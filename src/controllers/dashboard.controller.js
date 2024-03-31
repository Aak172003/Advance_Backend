import mongoose from "mongoose";
import { Subscription } from "../models/subscription.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import { Video } from "../models/video.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const getChannelStatus = asyncHandler(
    async (req, res, next) => {

        // Get the channel stats
        // like total video views, total subscribers, total videos, total likes etc.

        const userId = req.user?._id

        // Find total subscribers
        const totalSubscribers = await Subscription.aggregate([
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                // It groups the documents by a specified expression and applies accumulator expressions to create computed fields
                $group: {
                    _id: null,
                    subscriberCount: {
                        $sum: 1
                    }
                }
            }

        ])

        const video = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(req.user?._id)
                }
            },
            // Find Video
            {
                $lookup: {
                    from: 'likes',
                    localField: '_id',
                    foreignField: 'video',
                    as: 'likes'
                }
            },
            {
                $project: {
                    totalLikes: {
                        $size: "$likes"
                    },
                    totalViews: "$views",
                    totalVideos: 1
                }
            },
            {
                $group: {
                    _id: null,
                    totalLikes: {
                        $sum: '$totalLikes'
                    },
                    totalViews: {
                        $sum: '$totalViews'
                    },
                    totalVideos: {
                        $sum: 1
                    }
                }
            }
        ])

        const channelStats = {
            totalSubscribers: totalSubscribers[0]?.subscriberCount || 0,
            totalLikes: video[0]?.totalLikes || 0,
            totalViews: video[0]?.totalViews || 0,
            totalVideos: video[0]?.totalVideos || 0
        }

        return res
            .status(200)
            .json(new ApiResponse(
                200,
                channelStats,
                "channel stats fetched successfully")
            );
    }
)


const getChannelVideos = asyncHandler(
    async (req, res, next) => {

        // Get all the videos uploaded by the channel
        const userId = req.user?._id

        const videos = await Video.aggregate([
            // Find user
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            // find likes on video
            {
                $lookup: {
                    from: 'likes',
                    localField: '_id',
                    foreignField: 'video',
                    as: 'likes'
                }
            },
            // Add some new fields 
            {
                $addFields: {
                    createdAt: {
                        $dateToParts: { date: "$createdAt" }
                    },
                    likesCount: {
                        $size: '$likes'
                    }
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $project: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    createdAt: {
                        year: 1,
                        month: 1,
                        day: 1
                    },
                    isPublished: 1,
                    likesCount: 1
                }
            }
        ])


        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    videos,
                    "channel stats fetched successfully"
                )
            );
    }
)



export { getChannelStatus, getChannelVideos }