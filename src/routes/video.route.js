
import { Router } from "express";
import * as videoController from '../controllers/video.controller.js'

import { upload } from "../middlewares/multerUploadFile.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const videoRouter = Router()


videoRouter.route('/').get(videoController.getAllVideos)


videoRouter.use(verifyJWT)   // Apply verifyJWT middleware to all routes in this file

videoRouter.route('/').post(upload.fields([
    {
        name: 'videoFile',
        maxCount: 1
    }, {
        name: "thumbnail",
        maxCount: 1
    }
]), videoController.publishAVideo)

videoRouter.route('/getvideo/:videoId').get(videoController.getVideoById)

// Update Only Thumbnail in this Controller 
// videoRouter.route('/update/:videoId').patch(upload.single('thumbnailLocalPath'), videoController.updateThumbnail)

// Update Thumbnail And Video in single Controller 
videoRouter.route('/update/:videoId').patch(upload.fields([
    {
        name: "thumbnailLocalPath",
        maxCount: 1
    },
    {
        name: "videoLocalPath",
        maxCount: 1
    }
]), videoController.update_Video_Thumbnail)



export default videoRouter