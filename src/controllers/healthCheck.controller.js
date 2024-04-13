import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthChcek = asyncHandler(async (req, res, next) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { message: "Everything is O.K" }, "Ok"));
});

export { healthChcek };
