import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from 'dotenv';
dotenv.config();

const dbConnection = async () => {
    try {
        const connInstance = await mongoose.connect(`${process.env.DATABASE_URI}/${DB_NAME}`);
        console.log(`Connected To MongoDB at ${connInstance.connection.host}`);
        console.log("------------------------------------------------------------------------");
        // console.log(connInstance);
    }
    catch (error) {
        console.log(`Error in MongoDB is ${error}`)
        // Kill the server , if not able to connect with DataBase
        process.exit(1)
    }
}

export default dbConnection





