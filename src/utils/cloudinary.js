import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

// localfileUpload client ke ek path se media fetch krta hai , us media ko server ke ek path pr upload kr deta hai

const uploadCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return (console.log("there is no file "))
        }
        // upload files on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        console.log("res-----------------------", response);
        // // file uploaded
        // console.log("file uploaded", response.url);

        fs.unlinkSync(localFilePath)
        return response
    }
    catch (error) {
        fs.unlinkSync(localFilePath)
        // remove the locally saved temperory files as the upload operatin got failed 
        return null
    }
}

export { uploadCloudinary }