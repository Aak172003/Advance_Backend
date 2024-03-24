import mongoose from "mongoose";

// This library allow to write mongodb aggration pipeline
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema({

    videoFile: {
        type: String, // cloudinary Url
        required: [true, 'Video File is Required'],
    },
    thumbnail: {
        type: String, // cloudinary Url
        required: [true, 'Thumbnail is Required'],
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    duration: {
        // This duration of video can be extracted by cloudinary information
        type: Number,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    // Means is publically available or not 
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
},
    { timestamps: true }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model('Video', videoSchema)