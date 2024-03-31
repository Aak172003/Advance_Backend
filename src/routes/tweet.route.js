import { Router } from "express";

import * as tweetController from '../controllers/tweet.controller.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";
const tweetRouter = Router()

tweetRouter.use(verifyJWT)

tweetRouter.route('/createtweet').post(tweetController.createTweet)

tweetRouter.route('/updatetweet/:tweetId').patch(tweetController.updateTweet)

tweetRouter.route('/deletetweet/:tweetId').delete(tweetController.deleteComment)

tweetRouter.route('/get/usertweet/:userId').get(tweetController.getUserTweet)

export default tweetRouter


