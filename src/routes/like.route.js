
import { Router } from "express";
import * as likeController from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const likeRouter = Router()

likeRouter.use(verifyJWT)


likeRouter.route('/toggle/video/like/:videoId').get(likeController.toggleVideoLike)

likeRouter.route("/toggle/likecomment/:commentId").get(likeController.toggleCommentLike);
likeRouter.route("/toggle/liketweet/:tweetId").get(likeController.toggleTweetLike);
likeRouter.route("/get-likes").get(likeController.getLikedVideos);


export default likeRouter