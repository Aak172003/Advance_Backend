import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const toggleSubscription = asyncHandler(
    async (req, res, next) => {

        const { channelId } = req.params

        console.log("channelId : ", channelId)
        // TODO: toggle subscription


        if (!isValidObjectId(channelId)) {
            throw new ApiError(400, "Invalid channelId");
        }


        // If Already Subscribed , then if i click on subscribe button , so it un-subscribe , which means remove from subscription collections
        const isAlreadySubscribed = await Subscription.findOne({
            subscriber: req.user?._id,
            channel: channelId
        })

        if (isAlreadySubscribed) {
            await Subscription.findByIdAndDelete(isAlreadySubscribed?._id)
            return res.status(200).json(new ApiResponse(200, { subscribed: false },
                "unsunscribed successfully")
            );
        }

        // Otherwise create a new document in Subscription collections
        await Subscription.create({
            subscriber: req.user?._id,
            channel: channelId
        })

        return res.status(200).json(
            new ApiResponse(200, { subscribed: true },
                "subscribed successfully")
        );
    }
)

// controller to return subscriber list of a channel
const getSubscribersList = asyncHandler(
    async (req, res, next) => {

        const { channelId } = req.params

        if (!isValidObjectId(channelId)) {
            throw new ApiError(400, "Invalid channelId");
        }

        const subscribers = await Subscription.aggregate([
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(channelId)
                }
            },

            {
                $lookup: {
                    from: 'users',
                    localField: 'subscriber',
                    foreignField: '_id',
                    // if i give same field name , then it add in front of it ,
                    // but if i give different name, this will add new field 

                    as: 'subscriber',


                    pipeline: [
                        {
                            $lookup: {
                                from: 'subscriptions',
                                localField: '_id',
                                foreignField: 'channel',
                                as: 'subscribedToSubscriber'
                            }
                        },
                        {
                            $addFields: {

                                subscribedToSubscriber: {
                                    $cond: {
                                        if: {
                                            $in: [channelId, "$subscribedToSubscriber.subscriber",
                                            ]
                                        },
                                        then: true,
                                        else: false
                                    }
                                },

                                subscribersCount: {
                                    $size: "$subscribedToSubscriber"
                                }
                            }
                        }
                    ]
                }
            },

            {
                $unwind: "$subscriber",
            },
            {
                $project: {
                    _id: 0,
                    subscriber: {
                        _id: 1,
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1,
                        subscribedToSubscriber: 1,
                        subscribersCount: 1
                    }
                }
            }
        ])
        return res
            .status(200)
            .json(
                new ApiResponse(200, subscribers,
                    "subscribers fetched successfully"
                )
            );
    }
)


export { toggleSubscription, getSubscribersList }