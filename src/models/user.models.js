import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt'
import dotenv from 'dotenv';
import jwt from "jsonwebtoken"
dotenv.config();

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            // this index true -> for proper searchable
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, // Cloudinary Url
            required: true
        },
        coverImage: {
            type: String, // Cloudinary Url
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, "Password is Required"],
        },
        refreshToken: {
            type: String
        }
    },
    { timestamps: true }
)

// Pre Hook

// here use userSchema.pre('save', () => {})
// this is not applicable, because here we need context of user schema, so that i can perform operation on this.password

userSchema.pre('save',

    // Always prefer this 
    async function (next) {
        // if password is modified by end user then hash password , otherwise return next 
        if (!this.isModified("password")) return next()

        this.password = await bcrypt.hash(this.password, 10)
        next()
    })

// Inject Methods with userSchema
userSchema.methods.isPasswordCorrect = async function (password) {
    // this return true or false
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {

    const payload = {
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullname
    }
    const token = jwt.sign(
        // Payload data , because we generate token by th help of this payload
        payload
        ,
        // JWT Secrets
        process.env.ACCESS_TOEKN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
    return token
}
userSchema.methods.generateRefreshToken = function () {

    const payload = {
        _id: this._id,
    }
    const RefToken = jwt.sign(
        payload,
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );

    return RefToken
}

export const User = mongoose.model('User', userSchema)
