
import { Router } from "express";
import * as userController from "../controllers/user.controller.js";

import { upload } from "../middlewares/multerUploadFile.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router()

userRouter.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]), userController.register)


userRouter.route('/login').post(userController.login)

// secured routes 
userRouter.route('/logout').post(verifyJWT, userController.logoutUser)

userRouter.route('/refresh-token').post(userController.refreshAccessToken)
userRouter.route('/update-password').post(verifyJWT, userController.changeCurrentPassword)

userRouter.route('/get-user').post(verifyJWT, userController.getCurrentUser)


// Patch
userRouter.route('/update-details').patch(verifyJWT, userController.updateAccountDetails)

// Upload Single file 
userRouter.route('/update-avatar').patch(verifyJWT, upload.single("avatar"), userController.updateUserAvatar)
userRouter.route('/update-coverimage').patch(verifyJWT, upload.single("coverImage"), userController.UpdateUserCoverImage)


// Channel's userName
userRouter.route('/get-channel-profile/:username').post(verifyJWT, userController.getUserChannelProfile)

userRouter.route('/get-watch-history').get(verifyJWT, userController.getWatchHistory)

export default userRouter