import { Router } from "express";

import * as commentController from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const commentRouter = Router()

commentRouter.use(verifyJWT)

commentRouter.route('/getcomment/:videoId').get(commentController.getAllComments)
commentRouter.route('/addcomment/:videoId').post(commentController.addComment)

commentRouter.route('/updatecomment/:commentId/').patch(commentController.updateComment)

commentRouter.route('/deletecomment/:commentId').delete(commentController.deleteComment)

export default commentRouter