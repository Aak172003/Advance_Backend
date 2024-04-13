import { Router } from "express";

import * as healthcheckController from "../controllers/healthCheck.controller.js";

const healthRouter = Router();

healthRouter.route("/").get(healthcheckController.healthChcek);

export default healthRouter;
