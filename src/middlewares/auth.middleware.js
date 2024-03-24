import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import JWT from 'jsonwebtoken'

export const verifyJWT = asyncHandler(async (req, res, next) => {

    try {

        // req.cookies?.accessToken automatically aceess the accessToke from cookie , because i have add cookieParser middleware

        // req.header("Authorization")?.replace("Bearer", "") ->
        // In Mobile application, custom header me Authorization me accessToken hota hai

        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")

        if (!token) {
            throw new ApiError(401, "Unauthorise Request")
        }
        const decodedToken = JWT.verify(token, process.env.ACCESS_TOEKN_SECRET)

        // console.log("decodedToken : ", decodedToken)

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