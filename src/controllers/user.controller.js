import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import { v2 as cloudinary } from 'cloudinary';


cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

const generateAccessAndRefreshToken = async (userId) => {
    try {

        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        // perfor no validation , directly go and save
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token", error)
    }
}

const register = asyncHandler(
    async (req, res) => {
        // res.status(200).json({
        //     message: " ok this is Register "
        // })

        // get user details from frontend
        // validation
        // check if user already exist : username , email
        // check for images , check for avatar
        // upload them to cloudinary, avatar
        // create user Object -> create entry in db
        // remove password and referesh token field from responses
        // check for user creation
        // return res 

        const { username, email, fullName, password } = req.body

        if (
            [fullName, email, username, password].some((field) => field?.trim() === "")
        ) {
            throw new ApiError(400, "All fields are required")
        }

        // In Production level ,
        // validations ka ek new file bnta hai or need ke accordings yaha call krte hai

        const existingUser = await User.findOne({
            // This is Operators
            $or: [{ username }, { email }]
        })

        if (existingUser) {
            return res.status(409).json(new ApiResponse(402, existingUser, "User with email already exists"));
        }

        // req.files  -> multer give this options 
        const avatarLocalPath = req.files?.avatar[0]?.path;

        // coverImage
        // const coverImageLocalPath = req.files?.coverImage[0]?.path;
        // console.log("coverImage ------------------>   ", coverImageLocalPath);

        let coverImageLocalPath;

        if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
            coverImageLocalPath = req.files.coverImage[0].path
        }
        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is Required")
        }

        const avatar = await uploadCloudinary(avatarLocalPath)
        const coverImage = await uploadCloudinary(coverImageLocalPath)

        if (!avatar) {
            throw new ApiError(400, "Avatar file is Required")
        }

        const user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username
        })
        const newlyCreatedUser = await User.findById(user._id).select('-password -refreshToken')

        if (!newlyCreatedUser) {
            throw new ApiError(500, "Something went wrong while registering the user")
        }

        return res.status(201).json(new ApiResponse(200, newlyCreatedUser, "User Registered Successfully"))
    }
)

const login = asyncHandler(
    async (req, res, next) => {
        // req body -> data
        // username or email
        // find the user
        // check password 
        // then generate refresh and access token
        // send cookies 

        const { email, username, password } = req.body
        if (!(username || email)) {
            throw new ApiError(400, "username or email is required")
        }
        const user = await User.findOne({
            // ya to email mil jae , ya to username mil jae 
            $or: [{ username }, { email }]
        })
        if (!user) {
            throw new ApiError(404, "User does not exist")
        }

        const isPasswordValid = await user.isPasswordCorrect(password)

        if (!isPasswordValid) {
            throw new ApiError(404, "Invalid user Credentials")
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
        const loggedInUser = await User.findById(user._id).select('-password -refreshToken')

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User Logged In Successfully")
            )
    }
)

const logoutUser = asyncHandler(
    async (req, res) => {
        const loggedOutUser = req.user
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    refreshToken: undefined
                }
            },
            { new: true }
        )

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200,
                {
                    loggedOutUser: loggedOutUser
                },
                "User logged Out SuccesFully")
            )
    }
)

const refreshAccessToken = asyncHandler(
    async (req, res) => {
        // i also have refresh token in my db 
        const inComingToken = req.cookies.refreshToken || req.body.refreshToken

        if (!inComingToken) {
            throw new ApiError(401, "Unauthorised Request")
        }

        try {
            const decodeToken = jwt.verify(inComingToken, process.env.REFRESH_TOKEN_SECRET)
            const user = await User.findById(decodeToken?._id)

            if (!user) {
                throw new ApiError(401, "Invalid Refresh Token")
            }

            // match incoming and refreshToken which is saved in database
            if (inComingToken !== user?.refreshToken) {
                throw new ApiError(401, "Refresh Token is Expired or Used")
            }

            const options = {
                httpOnly: true,
                secure: true
            }
            const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
            return res.status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", refreshToken, options)
                .json(
                    new ApiResponse(200, { accessToken, refreshToken: refreshToken }, "Access Token Refreshed")
                )
        }
        catch (error) {
            throw new ApiError(401, "Invalid Refresh Token")
        }
    }
)

const changeCurrentPassword = asyncHandler(
    async (req, res, next) => {

        const { oldPassword, newPassword } = req.body
        const { id } = req.user
        const user = await User.findById(id)
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

        if (!isPasswordCorrect) {
            throw new ApiError(400, "Invalid Old Password")
        }

        user.password = newPassword
        await user.save({ validateBeforeSave: false })

        return res.status(200)
            .json(new ApiResponse(200, {}, "Password Updated Successfully"))
    }
)
// Get Get User 
const getCurrentUser = asyncHandler(
    async (req, res, next) => {
        return res
            .status(200)
            .json(new ApiResponse(200, req.user, "current user fetched Successfuly"))
    }
)

const updateAccountDetails = asyncHandler(
    async (req, res, next) => {

        const { fullName, email } = req.body

        if (!fullName || !email) {
            throw new ApiError(400, "All Fields Are Required")
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    fullName: fullName,
                    email: email
                }
            },
            {
                new: true
            }).select("-password")

        return res
            .status(200)
            .json(new ApiResponse(200, user, " Account Details Updated Successfully"))

    }
)

const updateUserAvatar = asyncHandler(
    async (req, res, next) => {

        const avatarLocalPath = req.file?.path;
        const url = req.user.avatar
        const regex = (/\/([^\/]+)\.jpg$/) || (/\/([^\/]+)\.png$/);

        const match = url.match(regex)
        console.log("match is ------------------- ", match);

        let extractedstring = undefined
        if (match) {
            extractedstring = match[1]
            console.log("Extracted String ------------------- ", extractedstring);
        }
        else {
            console.log("No match Found");
        }

        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is Missing")
        }

        if (req.user.avatar) {
            await cloudinary.uploader.destroy(`${extractedstring}`, function (error, result) {
                if (error) {
                    console.error(error)
                } else {
                    console.log(result)
                }
            })
        }

        const avatar = await uploadCloudinary(avatarLocalPath)
        if (!avatar.url) {
            throw new ApiError(400, "Error While Uploading on Avatar")
        }

        const updatedUserAvatar = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    avatar: avatar.url
                }
            },
            { new: true }
        ).select("-password")


        return res
            .status(200)
            .json(new ApiResponse(200, updatedUserAvatar, "Avatar Updated Successfully"))
    }
)

const UpdateUserCoverImage = asyncHandler(
    async (req, res, next) => {
        const coverImageLocalPath = req.file?.path

        const url = req.user.coverImage
        const regex = (/\/([^\/]+)\.jpg$/) || (/\/([^\/]+)\.png$/);

        const match = url.match(regex)
        console.log("match is ------------------- ", match);

        let extractedstring = undefined
        if (match) {
            extractedstring = match[1]
            console.log("Extracted String ------------------- ", extractedstring);
        }
        else {
            console.log("No match Found");
        }

        if (!coverImageLocalPath) {
            throw new ApiError(400, "Cover Image file is Missing")
        }

        if (req.user.coverImage) {
            await cloudinary.uploader.destroy(`${extractedstring}`, function (error, result) {
                if (error) {
                    console.error(error)
                } else {
                    console.log(result)
                }
            })
        }
        const coverImage = await uploadCloudinary(coverImageLocalPath)
        if (!coverImage.url) {
            throw new ApiError(400, "Error While Uploading on coverImage")
        }

        const updatedUserCoverImage = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    coverImage: coverImage.url
                }
            },
            { new: true }
        )
        return res
            .status(200)
            .json(new ApiResponse(200, updatedUserCoverImage, " Cover Image Updated Successfully"))
    }
)

const getUserChannelProfile = asyncHandler(
    async (req, res, next) => {

        const { username } = req.params

        if (!username.trim()) {
            throw new ApiError(400, "Username is Missing")
        }

        console.log("Now going to Aggregerate Pipeline");
        // Aggregeation Pipeline -> pipeline always return array 
        const channelProfile = await User.aggregate([
            {
                // this is like where clause , 
                // this return only single document current user ka 
                $match: {
                    username: username
                }
            },
            // lookup -> is like operation 
            // find how many my subscribers
            {
                // kon si documents se join kru , lookup kru
                // kaha se 
                $lookup: {
                    from: "subscriptions",

                    // -------------------local is user , access subscriber and channel form subscriptionschema

                    // kisme (local me ) , user documents me 
                    localField: "_id",
                    // kaha wale me , 
                    // channels ko jo ki subscriptionSchema me pda hai
                    foreignField: "channel",
                    // result name , this is a new field 
                    as: "subscribers"
                }
            },

            // -------------------local is user , access subscriber and channel form subscriptionschema
            // lookup -> is like operation
            // find whom i subscribed

            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },

            // add new fileds ( with those data which exist in db , but adfileds not exist)
            {
                $addFields: {
                    // subscribe count
                    subscribersCount: {
                        // subscribers this is a filed , i.e use $
                        $size: "$subscribers"
                    },
                    // channel ne kitno k o subscribe kia hai 
                    channelSubscribedToCount: {
                        $size: "$subscribedTo"
                    },
                    // add issubscrifield , through which we can get wheteher this user is subscribed or not 
                    isSubscribed: {
                        // condition
                        $cond: {
                            // subscribers this is a field -> that why i use $ 
                            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            // Project is used to return things in our requirements basis
            {
                $project: {
                    // jisko Response me bhejna hai usko 1 krdo
                    fullName: 1,
                    username: 1,
                    subscribersCount: 1,
                    channelSubscribedToCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    coverImage: 1,
                    email: 1
                }
            }
        ])

        // console.log("channel log --------------------------------------");
        // console.log(channelProfile);

        if (!channelProfile?.length) {
            throw new ApiError(404, "Channel doe's not exist")
        }

        return res
            .status(200)
            .json(new ApiResponse(
                200, channelProfile[0],
                "User Channel Fetched Successfully"
            ))
    }
)

const getWatchHistory = asyncHandler(
    async (req, res, next) => {

        const userHistory = await User.aggregate([
            {
                // First find current user
                // this is like where clause , 
                // this return only single document current user ka 
                $match: {
                    // here i pass string , which is document id in mongodb
                    _id: new mongoose.Types.ObjectId(req.user._id)
                }
            },

            // lookup -> is like operation 
            // find how many my subscribers
            {
                $lookup: {
                    // kaha se " videos " model se 
                    from: "videos",

                    // -------------------local is user 
                    // kisme (local me ) , user documents me 
                    localField: "watchHistory",
                    // kaha wale me , 
                    // channels ko jo ki subscriptionSchema me pda hai
                    foreignField: "_id",
                    // result name , this is a new field 
                    as: "watchHistory",

                    // This allows Nested Pipelines
                    pipeline: [

                        // owner ke field me saara data pda hai 

                        {
                            // lookup -> is like operation 
                            // find how many my subscribers
                            $lookup: {

                                // kaha se " users " model se 
                                from: "users",

                                // -------------------local is owner 
                                // kisme (local me ) , user documents me 
                                localField: "owner",
                                // kaha wale me , 
                                // channels ko jo ki subscriptionSchema me pda hai
                                foreignField: "_id",
                                // result name , this is a new field 
                                as: "owner",

                                // User wala lookup return this much things 
                                pipeline: [
                                    {
                                        $project: {
                                            fullName: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },

                        // Add fiels 
                        {
                            $addFields: {
                                owner: {
                                    $first: "$owner"
                                }
                            }
                        }

                    ]
                }
            }
        ])

        console.log(userHistory);

        console.log(userHistory[0].watchHistory);

        return res.status(200).json(new ApiResponse(200, userHistory[0].watchHistory, "Watch History Fetched Successfully"))
    }
)

export {
    register,
    login,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    UpdateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
