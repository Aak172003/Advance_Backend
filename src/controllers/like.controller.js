import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const toggleVideoLike = asyncHandler(
    async (req, res, next) => {

        const { videoId } = req.params

        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, 'Invalid VideoId')
        }

        const videoAlreadyLiked = await Like.findOne({
            // find on behalf of two things 
            video: videoId,
            likedBy: req.user?._id
        })

        // If Already Liekd , then if i click on like button , so it dislike , which means remove from like collections
        if (videoAlreadyLiked) {

            await Like.findByIdAndDelete(videoAlreadyLiked?._id)
            return res.status(200).json(new ApiResponse(200, { isLiked: false }))
        }

        // Otherwise create a new document in Like collections
        await Like.create({
            video: videoId,
            likedBy: req.user?._id
        })

        // First Time Like 
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: true }));
    }
)

const toggleCommentLike = asyncHandler(
    async (req, res, next) => {

        const { commentId } = req.params

        if (!isValidObjectId(commentId)) {
            throw new ApiError(400, 'Invalid CommentId')
        }

        const commentAlreadyLiked = await Like.findOne({
            // First find is already liked or not 
            comment: commentId,
            likedBy: req.user?._id
        })

        if (commentAlreadyLiked) {
            await Like.findByIdAndDelete(commentAlreadyLiked?._id)

            return res.status(200).json(new ApiResponse(200, { isLiked: false }))
        }

        // Otherwise create a new document in Like collections
        await Like.create({
            comment: commentId,
            likedBy: req.user?._id
        })

        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: true }));
    }
)

const toggleTweetLike = asyncHandler(
    async (req, res, next) => {

        const { tweetId } = req.params;

        if (!isValidObjectId(tweetId)) {
            throw new ApiError(400, 'Invalid CommentId')
        }

        const tweetAlreadyLiked = await Like.findOne({
            tweet: tweetId,
            likedBy: req.user?._id
        })

        if (tweetAlreadyLiked) {
            await Like.findByIdAndDelete(tweetAlreadyLiked?._id)

            return res.status(200).json(
                new ApiResponse(200, { isLiked: false })
            )
        }

        // Otherwise create a new document in Like collections
        await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id
        })

        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: true }));
    }
)

const getLikedVideos = asyncHandler(
    async (req, res, next) => {

        // Get Liked Video , here this will first pass through verify Function ,
        // this will set req.user = user from decode token 
        
        // const {userId} = req?.user?._id

        const allLikesVide = await Like.aggregate([
            {
                // Find particular user
                $match: {
                    likedBy: new mongoose.Types.ObjectId(req.user?._id),
                },
            },

            // Find videos via lookup
            {
                $lookup: {
                    from: 'videos',
                    localField: 'video',
                    foreignField: '_id',
                    as: 'likedVideo',

                    // then find who publish that video
                    pipeline: [
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'owner',
                                foreignField: '_id',
                                as: 'ownerDetails'
                            }
                        },
                        {

                            $unwind: '$ownerDetails'
                        }
                    ]
                }
            },
            {
                $unwind: '$likedVideo'
            },
            {
                $sort: {
                    createdAt: -1,
                }
            },
            {
                $project: {
                    _id: 0,
                    likedVideo: {
                        _id: 1,
                        "videoFile.url": 1,
                        "thumbnail.url": 1,
                        owner: 1,
                        title: 1,
                        description: 1,
                        duration: 1,
                        views: 1,
                        isPublished: 1,
                        createdAt: 1,
                        ownerDetails: {
                            username: 1,
                            fullName: 1,
                            "avatar.url": 1,
                        }
                    }
                }
            }
        ])

        // console.log("allLikesVide : ", allLikesVide)  // array
        // console.log("allLikesVide : ", allLikesVide[0])  // array 0th index

        return res.status(200).json(
            new ApiResponse(
                200, allLikesVide[0], "liked videos fetched successfully"
            )
        );
    }
)
export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}























