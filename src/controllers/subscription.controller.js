import  mongoose ,{isValidObjectId} from 'mongoose';
import {User} from "../models/user.model.js"
import {Subscription} from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription=asyncHandler(async(req,res)=>{
    const {channelId}=req.params;
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channel id")
    }
    const channel = await Subscription.findOne({subscriber:req.user._id, channel:channelId});
    if(channel){
        await Subscription.deleteOne({subscriber:req.user._id, channel:channelId});
        res.status(200).json(new ApiResponse(200,null, "Unsubscribed successfully"))
    }else{
        await Subscription.create({subscriber:req.user._id, channel:channelId});
        res.status(200).json(new ApiResponse(200,null, "Subscribed successfully"))
    }
})
const getUserChannelSubscribers=asyncHandler(async(req,res)=>{
     const {channelId}=req.params;
     const subscribers = await Subscription.find({channel:channelId}).populate("subscriber","username fullName email coverImage");
     res.status(200).json(new ApiResponse(200,subscribers, "Subscribers fetched successfully"))
})

const getUserSubscribedChannels=asyncHandler(async(req,res)=>{
    const {subscriberId}=req.params;
    const channels = await Subscription.find({subscriber:subscriberId}).populate("channel","username fullName email coverImage");
    res.status(200).json(new ApiResponse(200,channels, "Subscribed channels fetched successfully"))
})

export {toggleSubscription,getUserChannelSubscribers,getUserSubscribedChannels}
