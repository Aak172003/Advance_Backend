// Create Playlist Handler

import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(
    async (req, res, next) => {

        const { name, description } = req.body;

        if (!name || !description) {
            throw new ApiError(400, "name and description both are required");
        }

        const playlist = await Playlist.create({
            name,
            description,
            playlistCreatedBy: req.user?._id
        })

        if (!playlist) {
            throw new ApiError(500, "failed to create playlist");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, playlist, "playlist created successfully"));
    }
)

const updatePlaylist = asyncHandler(
    async (req, res, next) => {

        const { name, description } = req.body;
        const { playlistId } = req.params;

        if (!name || !description) {
            throw new ApiError(400, "name and description both are required");
        }

        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid PlaylistId");
        }

        // Find Plylist By playlistId
        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        if (playlist?.playlistCreatedBy.toString() !== req.user?._id.toString()) {
            throw new ApiError(400, "only playlit owner can edit their comment");
        }

        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlist?._id,
            {
                $set: {
                    name,
                    description
                }
            }
            , { new: true }
        )

        return res.status(200).json(
            new ApiResponse(200, updatedPlaylist, "playlist updated successfully"
            )
        );
    }
)

const deletePlaylist = asyncHandler(
    async (req, res, next) => {

        const { playlistId } = req.params

        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid PlaylistId");
        }

        // Find Playlist
        const playlist = await Playlist.findById(playlistId)

        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        if (playlist.playlistCreatedBy.toString() !== req.user?._id.toString()) {
            throw new ApiError(400, "only owner can delete the playlist");
        }

        await Playlist.findByIdAndDelete(playlist._id)

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "playlist delete successfully")
            );
    }
)

const addVideoToPlaylist = asyncHandler(

    async (req, res, next) => {

        const { videoId, playlistId } = req.params

        if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
            throw new ApiError(400, "Please Give a valid PlaylistId or videoId");
        }

        const playlist = await Playlist.findById(playlistId)
        const video = await Video.findById(videoId)

        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }
        if (!video) {
            throw new ApiError(404, "video not found");
        }

        // check owner of both video , and playlist
        // Because only owner have right to add video's in playlist
        // if (
        //     (playlist.playlistCreatedBy?.toString() && video.owner.toString()) !== req.user?._id.toString()
        // ) {
        //     throw new ApiError(400, "only owner can add video to thier playlist");
        // }

        if (
            playlist.playlistCreatedBy?.toString() !== req.user?._id.toString()
        ) {
            throw new ApiError(400, "only owner can add video to thier playlist");
        }

        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlist?._id,
            {
                $addToSet: {
                    videos: videoId,
                },
            },
            { new: true }
        );

        if (!updatePlaylist) {
            throw new ApiError(400, "failed to add video to playlist please try again"
            );
        }

        return res
            .status(200)
            .json(new ApiResponse(200, updatedPlaylist, "Added video to playlist successfully"
            )
            );
    }
)

const removeVideoFromPlaylist = asyncHandler(
    async (req, res, next) => {

        const { playlistId, videoId } = req.params;

        if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid PlaylistId or videoId");
        }

        const playlist = await Playlist.findById(playlistId)
        const video = await Video.findById(videoId)

        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }
        if (!video) {
            throw new ApiError(404, "video not found");
        }

        // check owner of both video , and playlist
        // Because only owner have right to add video's in playlist
        // if (
        //     (playlist.playlistCreatedBy?.toString() && video.owner.toString()) !== req.user?._id.toString()
        // ) {
        //     throw new ApiError(400, "only owner can add video to thier playlist");
        // }

        if (
            playlist.playlistCreatedBy?.toString() !== req.user?._id.toString()
        ) {
            throw new ApiError(400, "only owner can add video to thier playlist");
        }

        const updatedPlaylistAfterRemoveVideo = await Playlist.findByIdAndUpdate(
            playlist?._id,
            {
                $pull: {
                    videos: videoId,
                },
            },
            { new: true }
        );

        return res
            .status(200)
            .json(
                new ApiResponse(200,
                    updatedPlaylistAfterRemoveVideo,
                    "Removed video from playlist successfully"
                )
            );
    }
)

const getPlaylistById = asyncHandler(
    async (req, res, next) => {

        const { playlistId } = req.params;

        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid PlaylistId");
        }

        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        const playlistVideo = await Playlist.aggregate([
            // find playlist
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(playlistId)
                }
            },
            // find videos
            {
                $lookup: {
                    from: 'videos',
                    localField: 'videos',
                    foreignField: '_id',
                    as: 'videos'
                }
            },
            // find publically available video
            {
                $match: {
                    'videos.isPublished': true
                }
            },
            
            // find user details
            {
                $lookup: {
                    from: 'users',
                    localField: 'playlistCreatedBy',
                    foreignField: '_id',
                    as: 'ownerDetails'
                }
            },
            {
                $addFields: {
                    totalVideos: {
                        $size: "$videos"
                    },
                    totalViews: {
                        $sum: "$videos.views"
                    },
                    owner: {
                        $first: "$ownerDetails"
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    totalVideos: 1,
                    totalViews: 1,
                    videos: {

                        // This means i want only url from avatar
                        // If i provide only "videoFile" , "thumbnail" this will show all public_id , url , _id
                        "videoFile.url": 1,
                        "thumbnail.url": 1,
                        title: 1,
                        description: 1,
                        duration: 1,
                        createdAt: 1,
                        views: 1
                    },
                    ownerDetails: {
                        username: 1,
                        fullName: 1,

                        // This means i want only url from avatar
                        "avatar.url": 1
                    }
                }
            }
        ])

        return res
            .status(200)
            .json(new ApiResponse(200, playlistVideo[0], "playlist fetched successfully"));
    }
)

const userPlaylist = asyncHandler(
    async (req, res, next) => {

        const { userId } = req.params;

        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }

        const playlists = await Playlist.aggregate([
            // first find playlist via give user id , because playlist conntains postedBy id
            {
                $match: {
                    playlistCreatedBy: new mongoose.Types.ObjectId(userId)
                }
            },
            // Find Video
            {
                $lookup: {
                    from: 'videos',
                    localField: 'videos',
                    foreignField: '_id',
                    as: 'videos'
                }
            },
            // Add some new fields 
            {
                $addFields: {
                    totalVideos: {
                        $size: '$videos'
                    },
                    totalViews: {
                        $sum: '$videos.views'
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    totalVideos: 1,
                    totalViews: 1,
                    updatedAt: 1,
                    // Access All Keys of video schema 
                    videos: {

                        // This means i want only url from avatar
                        // If i provide only "videoFile" , "thumbnail" this will show all public_id , url , _id
                        "videoFile.url": 1,
                        "thumbnail.url": 1,
                        title: 1,
                        description: 1,
                        duration: 1,
                        createdAt: 1,
                        views: 1
                    }
                }
            }
        ])

        // console.log(playlists)
        return res
            .status(200)
            .json(new ApiResponse(200, playlists, "User playlists fetched successfully"));
    }
)

export {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getPlaylistById,
    userPlaylist
}