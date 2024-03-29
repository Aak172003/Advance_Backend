import mongoose, { isValidObjectId } from "mongoose";

import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import { User } from "../models/user.models.js";

import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


// get video, upload to cloudinary, create video
const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description } = req.body

    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

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

    // console.log("videoFile : ", videoFile)

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
        // isPublished: true
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

        console.log("req.user : ", req.user)

        console.log("videoId : ", videoId)

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
                                                req.user._id,
                                                "$subscribers.subscriber"]
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
                                    req.user?._id,
                                    "$likes.likedBy"]
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

        console.log("Aggregation Pipeline Stages:");

        for (let i = 0; i < videoPipeline.length; i++) {
            console.log(`Stage ${i + 1}:`, JSON.stringify(videoPipeline[i], null, 2));
        }


        const video = await Video.aggregate(videoPipeline);

        console.log("video : ", video)

        if (!video) {
            throw new ApiError(500, "failed to fetch video");
        }

        console.log("222222222222222222222222222222")
        await Video.findByIdAndUpdate(videoId, {
            $inc: {
                views: 1
            }
        })

        console.log("555555555555555555555555555555")
        await User.findByIdAndUpdate(req.user?._id, {
            // set in watchHistory Array
            $addToSet: {
                watchHistory: videoId
            }
        })


        console.log("888888888888888888888888888888888")
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
                400,
                "You can't edit this video as you are not the owner"
            );
        }

        //deleting old thumbnail and updating with new one
        // TODO 
        const thumbnailToDelete = video.thumbnail.public_id;

        // Access from raw formdata
        const thumbnailLocalPath = req.file?.path;
        if (!thumbnailLocalPath) {
            throw new ApiError(400, "thumbnail is required");
        }

        const thumbnail = await uploadCloudinary(thumbnailLocalPath);

        if (!thumbnail) {
            throw new ApiError(400, "thumbnail not found");
        }
        s
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

        // TODO
        // if (updatedVideo) {
        //     await deleteOnCloudinary(thumbnailToDelete);
        // }
        return res
            .status(200)
            .json(
                new ApiResponse(200, updatedVideo, "Thumbnail Updated successfully")
            );
    }
)


const update_Video_Thumbnail = asyncHandler(
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
                400,
                "You can't edit this video as you are not the owner"
            );
        }

        //deleting old thumbnail and updating with new one
        // TODO
        const videoToDelete = video.videoFile.public_id
        const thumbnailToDelete = video.thumbnail.public_id;

        const thumbnailPart = req.files?.thumbnailLocalPath[0]?.path;
        const videoPart = req.files?.videoLocalPath[0]?.path

        if (!thumbnailPart) {
            throw new ApiError(400, "thumbnail is required");
        }

        if (!videoPart) {
            throw new ApiError(400, "Video is required");
        }

        const thumbnail = await uploadCloudinary(thumbnailPart);
        const videoUpload = await uploadCloudinary(videoPart)

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
                    thumbnail: {
                        public_id: thumbnail.public_id,
                        url: thumbnail.url
                    },
                    videoFile: {
                        public_id: videoUpload.public_id,
                        url: videoUpload.url
                    }
                }
            },
            { new: true }
        );

        if (!updatedVideo) {
            throw new ApiError(500, "Failed to update video please try again");
        }

        // TODO
        // if (updatedVideo) {
        // await deleteOnCloudinary(thumbnailToDelete);
        // }

        return res
            .status(200)
            .json(
                new ApiResponse(200, updatedVideo, "Thumbnail And Video updated successfully")
            );
    }
)


















export { getAllVideos, publishAVideo, getVideoById, updateThumbnail, update_Video_Thumbnail };
