import mongoose, { Schema } from "mongoose";


const playlistVideoSchema = new Schema({
    type: {
        type: Schema.Types.ObjectId,
        ref: 'Video'
    },
});

const playlistSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        videos: [
            // {
            //     type: Schema.Types.ObjectId,
            //     ref: 'Video',
            // }
            playlistVideoSchema

        ],
        playlistCreatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    { timestamps: true }
)


export const Playlis = mongoose.model('Playlist', playlistSchema)