import dotenv from "dotenv";
dotenv.config()
import connectDB from "./db/index.js";



connectDB()







/*
import express from "express";
const app=express();

(async () => {
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
       app.on("error",(error) => {
        console.error("Failed to start server:", error);
        throw error
       })
       app.listen(process.env.PORT || 3000, () => {
        console.log(`Server is running on port ${process.env.PORT || 3000}`);
       });
    } catch (error) {
        console.error("Error connecting to the database:", error);
        throw err
    }
})()
*/
