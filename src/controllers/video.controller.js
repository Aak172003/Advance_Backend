import mongoose, { isValidObjectId } from "mongoose";

import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import { User } from "../models/user.models.js";

import { deleteOnCloudinary, uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.models.js";
import { Comment } from '../models/comments.models.js'


// get video, upload to cloudinary, create video
const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description } = req.body

    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Get Both File Path via multer 
    const videofileLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if (!videofileLocalPath) {
        throw new ApiError(400, "videoFileLocalPath is required");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnailLocalPath is required");
    }

    const videoFile = await uploadCloudinary(videofileLocalPath)
    const thumbnail = await uploadCloudinary(thumbnailLocalPath)

    const video = await Video.create({
        title,
        description,
        duration: videoFile.duration,
        videoFile: {
            url: videoFile.url,
            public_id: videoFile.public_id
        },
        thumbnail: {
            url: thumbnail.url,
            public_id: thumbnail.public_id
        },
        owner: req.user?._id,
        // Initial me sb koi publically publish nhi hoge , we can toggle between 
        isPublished: false
    });

    const videoUploaded = await Video.findById(video._id);

    if (!videoUploaded) {
        throw new ApiError(500, "videoUpload failed please try again !!!");
    }

    return res.status(200)
        .json(new ApiResponse(200, video, "Video uploaded successfully"));

})

// get all videos based on query, sort, pagination
const getAllVideos = asyncHandler(
    async (req, res, next) => {
        const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

        // It initializes an empty array named pipeline to construct the aggregation pipeline for MongoDB.
        const pipeline = [];

        if (query) {
            // It checks if a search query is provided. If so, it adds a $search stage to the aggregation pipeline to perform a text search on the title and description fields.
            pipeline.push(
                {
                    // Try to find any video which have query name 
                    $match: {
                        $or: [
                            { title: { $regex: query, $options: 'i' } },
                            { description: { $regex: query, $options: 'i' } }
                        ]
                    }
                });
        }

        if (userId) {
            if (!isValidObjectId(userId)) {
                throw new ApiError(400, "Invalid userId");
            }

            // find particular user 
            // It checks if a userId is provided. If it's provided and valid, it adds a $match stage to filter videos by the specified user ID.
            pipeline.push({
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            });
        }

        // fetch videos only that are set isPublished as true , means are publically available
        pipeline.push({ $match: { isPublished: true } });

        //sortBy can be views, createdAt, duration
        // sortType can be ascending(-1) or descending(1)
        if (sortBy && sortType) {
            pipeline.push({
                $sort: {
                    [sortBy]: sortType === "asc" ? 1 : -1
                }
            });
        } else {
            pipeline.push({ $sort: { createdAt: -1 } });
        }

        pipeline.push(
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails",

                    // This is for nested filtering 
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                "avatar.url": 1
                            }
                        }
                    ]
                }
            },
            {
                // Unwind- > create an unique array , no duplicate data present
                // the $unwind stage deconstructs the ownerDetails array, 
                // creating multiple documents for each ownerDetails

                $unwind: "$ownerDetails"
            }
        )
        // Video.aggregate This is used to create aggregate pipeline for Video model
        const videoAggregate = Video.aggregate(pipeline);

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        };

        // Video.aggregatePaginate.
        const video = await Video.aggregatePaginate(videoAggregate, options);

        return res
            .status(200)
            .json(new ApiResponse(200, video, "Videos fetched successfully"));
    });

// get video by id
const getVideoById = asyncHandler(
    async (req, res, next) => {

        const { videoId } = req.params

        // console.log("req.user : ", req.user)
        // console.log("videoId : ", videoId)

        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid videoId");
        }

        // Apply Pipeline on Video 
        let videoPipeline = [
            {
                // Find That Document via videoId
                $match: {
                    _id: new mongoose.Types.ObjectId(videoId)
                }
            },

            // In MongoDB, if a stage in an aggregation pipeline produces no documents,
            // the pipeline will continue executing with an empty set of documents for the subsequent stages.
            // perform left join between video and likes

            {
                $lookup: {
                    // likes model
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes"
                }
            },

            // Find that video is posted by
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",

                    pipeline: [
                        {
                            $lookup: {
                                from: "subscriptions",
                                localField: "_id",
                                foreignField: "channel",
                                as: "subscribers"
                            }
                        },
                        {
                            $addFields: {
                                subscribersCount: {
                                    $size: "$subscribers"
                                },
                                isSubscribed: {
                                    $cond: {
                                        if: {
                                            $in: [
                                                req.user._id,"$subscribers.subscriber"]
                                        },
                                        then: true,
                                        else: false
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                username: 1,
                                "avatar.url": 1,
                                subscribersCount: 1,
                                isSubscribed: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    likesCount: {
                        $size: "$likes"
                    },
                    owner: {
                        $first: "$owner"
                    },
                    isLiked: {
                        $cond: {
                            if: {
                                $in: [
                                    req.user?._id,"$likes.likedBy"]
                            },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    "videoFile.url": 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    createdAt: 1,
                    duration: 1,
                    comments: 1,
                    owner: 1,
                    likesCount: 1,
                    isLiked: 1
                }
            }
        ];

        const video = await Video.aggregate(videoPipeline);

        if (!video) {
            throw new ApiError(500, "failed to fetch video");
        }

        await Video.findByIdAndUpdate(videoId, {
            $inc: {
                views: 1
            }
        })

        await User.findByIdAndUpdate(req.user?._id, {
            // set in watchHistory Array
            $addToSet: {
                watchHistory: videoId
            }
        })

        return res
            .status(200)
            .json(
                new ApiResponse(200, video[0], "video details fetched successfully")
            );

    }
)

// update video details like title, description, thumbnail
const updateThumbnail = asyncHandler(
    async (req, res, next) => {

        const { title, description } = req.body;
        const { videoId } = req.params;

        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid videoId");
        }

        if (!(title && description)) {
            throw new ApiError(400, "title and description are required");
        }

        const video = await Video.findById(videoId);

        if (!video) {
            throw new ApiError(404, "No video found , Invalid Video Access");
        }

        // video has owner object id, means this video is posted by owner id,
        // and req.user?._id check if both not equal means, you can't edit 
        if (video?.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(
                400,"You can't edit this video as you are not the owner"
            );
        }

        //deleting old thumbnail and updating with new one
        // TODO 
        const thumbnailToDelete = video.thumbnail.public_id;

        // Access from raw formdata
        const thumbnailLocalPath = req.file?.path;
        if (thumbnailToDelete) {
            await deleteOnCloudinary(thumbnailToDelete)
        }


        if (!thumbnailLocalPath) {
            throw new ApiError(400, "thumbnail is required");
        }

        const thumbnail = await uploadCloudinary(thumbnailLocalPath);

        if (!thumbnail) {
            throw new ApiError(400, "thumbnail not found");
        }
        const updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    title,
                    description,
                    thumbnail: {
                        public_id: thumbnail.public_id,
                        url: thumbnail.url
                    }
                }
            },
            { new: true }
        );

        if (!updatedVideo) {
            throw new ApiError(500, "Failed to update video please try again");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, updatedVideo, "Thumbnail Updated successfully")
            );
    }
)

// Update Video And Thumbnail both
const updateVideoThumbnail = asyncHandler(
    async (req, res, next) => {

        const { title, description } = req.body;
        const { videoId } = req.params;

        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid videoId");
        }

        if (!(title && description)) {
            throw new ApiError(400, "title and description are required");
        }

        const video = await Video.findById(videoId);

        if (!video) {
            throw new ApiError(404, "No video found , Invalid Video Access");
        }

        // video has owner object id, means this video is posted by owner id,
        // and req.user?._id check if both not equal means, you can't edit

        if (video?.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(400, "You can't edit this video as you are not the owner");
        }

        //deleting old thumbnail and Video and updating with new one
        const videoToDelete = video.videoFile.public_id
        const thumbnailToDelete = video.thumbnail.public_id;

        if (videoToDelete) {
            await deleteOnCloudinary(videoToDelete, 'video') // Pass video public id and resource tupe as well
        }
        if (thumbnailToDelete) {
            await deleteOnCloudinary(thumbnailToDelete)
        }


        const videoPart = req.files?.videoLocalPath[0]?.path
        const thumbnailPart = req.files?.thumbnailLocalPath[0]?.path;

        if (!thumbnailPart) {
            throw new ApiError(400, "thumbnail is required");
        }
        if (!videoPart) {
            throw new ApiError(400, "Video is required");
        }

        const videoUpload = await uploadCloudinary(videoPart)
        const thumbnail = await uploadCloudinary(thumbnailPart);
        if (!thumbnail) {
            throw new ApiError(400, "thumbnail not found");
        }
        if (!videoUpload) {
            throw new ApiError(400, "videoUpload not found");
        }

        const updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    title,
                    description,
                    videoFile: {
                        public_id: videoUpload.public_id,
                        url: videoUpload.secure_url
                    },
                    thumbnail: {
                        public_id: thumbnail.public_id,
                        url: thumbnail.secure_url
                    },
                }
            },
            { new: true }
        );

        if (!updatedVideo) {
            throw new ApiError(500, "Failed to update video please try again");
        }
        return res
            .status(200)
            .json(
                new ApiResponse(200, updatedVideo, "Thumbnail And Video updated successfully")
            );
    }
)

const togglePublishStatus = asyncHandler(
    async (req, res, next) => {

        const { videoId } = req.params

        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid videoId");
        }
        const video = await Video.findById(videoId);

        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        // Change isPublish Status , only by owner of that video
        if (video?.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(
                400,
                "You can't toogle publish status as you are not the owner"
            );
        }

        const toggledVideoPublish = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    isPublished: !video?.isPublished
                }
            },
            { new: true }
        );

        if (!toggledVideoPublish) {
            throw new ApiError(500, "Failed to toogle video publish status");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { isPublished: toggledVideoPublish.isPublished },
                    "Video publish toggled successfully"
                )
            );
    }
)

// Delete Video
const deleteVideo = asyncHandler(
    async (req, res, next) => {

        const { videoId } = req.params

        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid videoId");
        }
        const video = await Video.findById(videoId)

        if (!video) {
            throw new ApiError(404, "No video found");
        }

        // delete video , only by its owner
        if (video?.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(400, "You can't delete this video as you are not the owner");
        }

        // Remove entery form db
        const videoDeleted = await Video.findByIdAndDelete(video?._id);

        if (!videoDeleted) {
            throw new ApiError(400, "Failed to delete the video please try again");
        }

        // delete video or thumbnail from cloudinary as well . 
        await deleteOnCloudinary(video.thumbnail.public_id);
        await deleteOnCloudinary(video.videoFile.public_id, "video");

        // delete video likes
        await Like.deleteMany({
            // Videoid
            video: videoId
        })

        // delete Comment
        await Comment.deleteMany({
            // Videoid
            video: videoId
        })

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Video deleted successfully")
            );
    }
)

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateThumbnail,
    updateVideoThumbnail,
    deleteVideo,
    togglePublishStatus
};
