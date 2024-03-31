import { Router } from "express";

import * as dashboardController from '../controllers/dashboard.controller.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";

const dashboadRouter = Router()

dashboadRouter.use(verifyJWT)

dashboadRouter.route('/get/channel').get(dashboardController.getChannelStatus)

dashboadRouter.route('/get/videos').get(dashboardController.getChannelVideos)

export default dashboadRouter