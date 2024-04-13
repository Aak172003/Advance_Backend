import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import mongoose, { isValidObjectId } from "mongoose";

const createTweet = asyncHandler(
    async (req, res, next) => {
        const { content } = req.body

        if (!content) {
            throw new ApiError(400, "content is required");
        }

        const tweet = await Tweet.create({
            content,
            tweetBy: req.user?._id
        })

        if (!tweet) {
            throw new ApiError(500, "failed to create tweet please try again");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, tweet, "Tweet created successfully"));
    }
)

const updateTweet = asyncHandler(
    async (req, res, next) => {
        const { content } = req.body;
        const { tweetId } = req.params;

        if (!content) {
            throw new ApiError(400, "content is required");
        }

        if (!isValidObjectId(tweetId)) {
            throw new ApiError(400, "Invalid tweetId");
        }

        const tweet = await Tweet.findById(tweetId)

        if (!tweet) {
            throw new ApiError(404, "Tweet not found");
        }

        if (tweet?.tweetBy.toString() !== req.user?._id.toString()) {
            throw new ApiError(400, "only owner can edit thier tweet");
        }

        const updateTweet = await Tweet.findByIdAndUpdate(
            tweet._id,
            {
                $set: {
                    content
                }
            },
            { new: true }
        )

        if (!updateTweet) {
            throw new ApiError(500, "Failed to edit tweet please try again");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, updateTweet, "Tweet updated successfully"));
    }
)

const deleteComment = asyncHandler(
    async (req, res, next) => {

        const { tweetId } = req.params;

        console.log(tweetId)

        if (!isValidObjectId(tweetId)) {
            throw new ApiError(400, "Invalid tweetId");
        }

        const tweet = await Tweet.findById(tweetId)

        console.log(tweet)
        if (!tweet) {
            throw new ApiError(404, "Tweet not found");
        }

        if (tweet?.tweetBy.toString() !== req.user?._id.toString()) {
            throw new ApiError(400, "only owner can delete thier tweet");
        }

        await Tweet.findByIdAndDelete(tweet._id,)

        return res
            .status(200)
            .json(new ApiResponse(200, { tweetId }, "Tweet Delete successfully"));
    }
)

const getUserTweet = asyncHandler(
    async (req, res, next) => {

        const { userId } = req.params

        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }
        const tweets = await Tweet.aggregate([
            // Find Tweet
            {
                $match: {
                    tweetBy: new mongoose.Types.ObjectId(userId)
                }
            },
            // Find TweetBy / Owner
            {
                $lookup: {
                    from: 'users',
                    localField: 'tweetBy',
                    foreignField: '_id',
                    as: 'ownerDetails',

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
            
            // Find Likes on tweet
            {
                $lookup: {
                    from: 'likes',
                    localField: "_id",
                    foreignField: 'tweet',
                    as: 'likeDetails',
                    pipeline: [
                        {
                            $project: {
                                likedBy: 1
                            }
                        }
                    ]
                }
            },
            // Add some new fields
            {
                $addFields: {
                    likesCount: {
                        $size: '$likeDetails'
                    },
                    ownerDetails: {
                        $first: '$ownerDetails'
                    },
                    isLiked: {
                        $cond: {
                            if: { $in: [req.user?._id, '$likeDetails.likedBy'] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            // sort 
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $project: {
                    content: 1,
                    likesCount: 1,
                    createdAt: 1,
                    ownerDetails: 1,
                    isLiked: 1,
                }
            }
        ])

        return res
            .status(200)
            .json(new ApiResponse(
                200,
                tweets,
                "Tweets fetched successfully")
            );
    }
)

export {
    createTweet,
    updateTweet,
    deleteComment,
    getUserTweet
}