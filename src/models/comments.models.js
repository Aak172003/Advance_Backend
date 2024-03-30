import mongoose, { Schema } from "mongoose";

// This library allow to write mongodb aggration pipeline
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: true,
            trim: true,
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: 'Video'
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    { timestamps: true }
)

commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model('Comment', commentSchema)