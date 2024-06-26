
import { v2 as cloudinary } from 'cloudinary';

// fs -> is file system , this basically allow to perform operation on files 

import fs from 'fs'

import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

// localfileUpload client ke ek path se media fetch krta hai , 
// us media ko server ke ek path pr upload kr deta hai

const uploadCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return (console.log("there is no file "))
        }

        // upload files on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,
            {
                resource_type: "auto"
            }
        )
        // // file uploaded successfully

        // console.log("res-----------------------", response);
        // console.log("file uploaded", response.url);

        // If successfully upload on cloudinary server , then unlink that file 
        fs.unlinkSync(localFilePath)
        return response
    }
    catch (error) {
        fs.unlinkSync(localFilePath)
        // remove the locally saved temperory files as the upload operatin got failed 
        return null
    }
}

const deleteOnCloudinary = async (public_id, resource_type = 'image') => {
    try {

        if (!public_id) return null

        console.log("public_id :from delete function ", public_id)

        // delete File from cloudinary
        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type: `${resource_type}`
        })
        console.log("result : ", result)
    }
    catch (error) {
        console.log('Failed, while Deleting the resouce', error)
        return error
    }
}

export { uploadCloudinary, deleteOnCloudinary }