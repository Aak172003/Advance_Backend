import mongoose from "mongoose";

// This library allow to write mongodb aggration pipeline
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema({

    videoFile: {
        type: {
            url: String,
            public_id: String,
        }, // cloudinary Url
        required: [true, 'Video File is Required'],
    },
    thumbnail: {
        type: {
            url: String,
            public_id: String
        }, // cloudinary Url
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
        defaultValue: 0
    },
    // Means is publically available or not 
    isPublished: {
        type: Boolean,
        defaultValue: true
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