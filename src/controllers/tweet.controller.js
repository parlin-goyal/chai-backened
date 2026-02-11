import mongoose,{isValidObjectId} from 'mongoose';
import {Tweet} from "../models/tweet.model.js"
import {User}  from "../models/user.model.js"
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';


const createTweet =asyncHandler(async(req,res)=>{
    const {description}=req.body;
        if(!description){
            throw new ApiError(400,"content are required");
        }
        const tweet = await Tweet.create({
            owner:req.user._id,
            content:description
        })
       if(!tweet){
        throw new ApiError(500,"Unable to create a Tweet");
       }
        return res
        .status(201)
        .json(new ApiResponse(201,createdTweet,"Tweet submitted successfully!!"))
})

const deleteTweet = asyncHandler(async(req,res)=>{
       const {tweetId}=req.params;
       if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Indvalid tweet id");
       }
       const tweetdeleted = await Tweet.findOneAndDelete({
         _id:tweetId,
         owner:req.user._id
     });    
       if(!tweetdeleted){
        throw new ApiError(404,"Tweet not found or not authorized")
       }
       
       return res
       .status(200)
       .json(new ApiResponse(200,{},"Tweet deleted successfully"))
})

const updateTweet = asyncHandler(async(req,res)=>{
    const {description}=req.body;
    const {tweetId}=req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid Tweet id");
    }
    if(!description){
        throw new ApiError(400,"description is required")
    }
   

    const tweetUpdated = await Tweet.findOneAndUpdate(
        {_id:tweetId,owner:req.user._id},
        {$set:{ content:description }},
        {new:true}
    )
    if(!tweetUpdated){
        throw new ApiError(404,"content not updated")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,tweetUpdated,"Tweet updated successfully!!!"));
})

const getUserTweets =asyncHandler(async(req,res)=>{
    const {userId} = req.params;
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid user id");
    }
    const getTweets = await Tweet
    .find({owner:userId})
    .Sort({createdAt:-1});
    return res
    .status(200)
    .json(new ApiResponse(200,getTweets,"User tweets fetched"));

})

export {
    createTweet,
    deleteTweet,
    updateTweet,
    getUserTweets
}
