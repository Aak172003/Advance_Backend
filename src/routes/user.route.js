import { Router } from "express";
import * as userController from "../controllers/user.controller.js";

import { upload } from "../middlewares/multerUploadFile.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()

router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]), userController.register)


router.route('/login').post(userController.login)

// secured routes 
router.route('/logout').post(verifyJWT, userController.logoutUser)

router.route('/refresh-token').post(userController.refreshAccessToken)
router.route('/update-password').post(verifyJWT, userController.changeCurrentPassword)

router.route('/get-user').post(verifyJWT, userController.getCurrentUser)

// Patch
router.route('/update-details').patch(verifyJWT, userController.updateAccountDetails)

// Upload Single file 
router.route('/update-avatar').patch(verifyJWT, upload.single("avatar"), userController.updateUserAvatar)
router.route('/update-coverimage').patch(verifyJWT, upload.single("coverImage"), userController.UpdateUserCoverImage)


router.route('/get-channel-profile/:username').post(verifyJWT, userController.getUserChannelProfile)
router.route('/get-watch-history').get(verifyJWT, userController.getWatchHistory)

export default router