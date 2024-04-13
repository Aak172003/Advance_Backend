import { Router } from "express";

import * as subscriptionController from '../controllers/subscription.controller.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";


const subscriptionRouter = Router()

subscriptionRouter.use(verifyJWT)

subscriptionRouter.route('/toggle/sub-unsub/:channelId').get(subscriptionController.toggleSubscription)

subscriptionRouter.route('/get/subscribers/:channelId').get(subscriptionController.getSubscribersList)


export default subscriptionRouter






