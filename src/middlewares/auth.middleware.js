import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import JWT from 'jsonwebtoken'

export const verifyJWT = asyncHandler(async (req, res, next) => {

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")

        if (!token) {
            throw new ApiError(401, "Unauthorise Request")
        }
        const decodedToken = JWT.verify(token, process.env.ACCESS_TOEKN_SECRET)

        const user = await User.findById(decodedToken?._id).select('-password -refreshToken')

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        // if found user , then set user in req
        req.user = user
        next()
    }
    catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
})