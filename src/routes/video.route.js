
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


export default videoRouter