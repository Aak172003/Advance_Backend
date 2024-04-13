import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comments.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";

// get all comments for a video

const getAllComments = asyncHandler(
    async (req, res, next) => {

        // Comment on video
        const { videoId } = req.params
        const { page = 1, limit = 10 } = req.query
        const video = await Video.findById(videoId)

        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        const commentFind = Comment.aggregate([
            // Find Video
            {
                // same video pr no of differnt user comment
                $match: {
                    video: new mongoose.Types.ObjectId(videoId)
                }
            },
            // Find User Details
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner" // output
                }
            },
            // Find Like Details Who Like The Comment
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "comment",
                    as: "likes" // output

                }
            },
            // Add Some new field
            {
                $addFields: {
                    likecount: {
                        $size: "$likes"
                    },
                    owner: {
                        $first: '$owner',
                    },
                    isLiked: {
                        $cond: {
                            if: { $in: [req.user?._id, "$likes.likedBy"] },
                            then: true,
                            else: false
                        }
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
                    content: 1,
                    createdAt: 1,
                    likecount: 1,
                    owner: {
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1
                    },
                    isLiked: 1
                }
            }

        ])

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        };

        const comments = await Comment.aggregatePaginate(
            commentFind,
            options
        );

        return res
            .status(200)
            .json(new ApiResponse(200,comments,"Comments fetched successfully"));
    }
)


const addComment = asyncHandler(
    async (req, res, next) => {

        const { videoId } = req.params;
        const { content } = req.body;

        if (!content) {
            throw new ApiError(400, "Content is required");
        }

        const video = await Video.findById(videoId)

        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        const comment = await Comment.create({
            content,
            video: videoId,
            owner: req.user?._id
        })

        if (!comment) {
            throw new ApiError(500, "Failed to add comment please try again");
        }

        return res
            .status(201)
            .json(new ApiResponse(
                201,
                comment,
                "Comment added successfully"));
    }
)

// update a comment
const updateComment = asyncHandler(
    async (req, res, next) => {

        const { commentId } = req.params;
        const { content } = req.body;
        // console.log(commentId)
        // console.log(content)

        if (!content) {
            throw new ApiError(400, "content is required");
        }

        const comment = await Comment.findById(commentId)

        if (!comment) {
            throw new ApiError(404, "Comment not found");
        }

        if (comment?.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(400, "only comment owner can edit their comment");
        }

        const updateComment = await Comment.findByIdAndUpdate(
            comment?._id,
            {
                $set: {
                    content: content
                }
            },
            { new: true }
        )

        if (!updateComment) {
            throw new ApiError(500, "Failed to edit comment please try again");
        }

        return res
            .status(200)
            .json(new ApiResponse(
                200,
                updateComment,
                "Comment edited successfully")
            );

    }

)

// delete a comment
const deleteComment = asyncHandler(
    async (req, res, next) => {
        const { commentId } = req.params

        const comment = await Comment.findById(commentId)

        if (!comment) {
            throw new ApiError(404, "Comment not found");
        }


        if (comment?.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(400, "only comment owner can delete their comment");
        }

        await Comment.findByIdAndDelete(commentId)

        // delete like as well of comment
        await Like.deleteMany({
            comment: commentId,
            likeBy: req.user
        })

        return res
            .status(200)
            .json(
                new ApiResponse(200, { commentId }, "Comment deleted successfully"));
    }
)

export { getAllComments, addComment, updateComment, deleteComment }