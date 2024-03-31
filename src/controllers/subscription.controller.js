import { isValidObjectId } from "mongoose";
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



export { toggleSubscription }