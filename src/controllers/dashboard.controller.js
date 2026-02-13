import mongoose, { isValidObjectId } from 'mongoose';
import {Video} from "../models/video.model.js";
import {User} from "../models/user.model.js"; 
import {asyncHandler} from 'express-async-handler'; 
import {ApiError} from '../utils/ApiError.js'; 
import {ApiResponse} from '../utils/ApiResponse.js';
import {Subscription} from '../models/subscription.model.js';
import {Like} from '../models/like.model.js';
import { Subscription } from '../models/subscription.model.js';
const getChannelVideos=asyncHandler(async(req,res)=>{
    const {UserId}=req.params;
    if(!isValidObjectId(UserId)){
        throw new ApiError(400,"Invalid video id");
    }
    const videos = await Video.find({owner:UserId});
    if(!videos){
        throw new ApiError(404,"videos not found");
    }
    if(videos.length()==0){
        res.status(200).json(new ApiResponse(200, [], "No videos found for this channel"));
    }
    res
    .status(200)
    .json(new ApiResponse(200,videos,"channel video fetched successfully"));
})
const getChannelStats=asyncHandler(async(req,res)=>{
    const {UserId}=req.params;
    if(!isValidObjectId(UserId)){
        throw new ApiError(400,"Invalid User id");
    }
    const videos = await Video.find({owner:UserId});
    const totalVideos=videos.length;    
    const likes = await Like.find({likeBy:UserId});
    const totalLikes=likes.length;
    const subscriber = await Subscription.find({channel:UserId});
     const totalSubscriber=subscriber.length;     
     res
     .status(200)
     .json(new ApiResponse(200,{totalVideos,totalLikes,totalSubscriber}))
})

export {
    getChannelStats,
    getChannelVideos
}