import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Like} from "../models/like.model.js";
import {Video} from "../models/video.model.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js";
import {Comment} from "../models/comment.model.js";
import mongoose,{isValidObjectId} from "mongoose";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }
    const video = await Video.findById(videoId);
    if(!video) {
        throw new ApiError(404, "Video not found");
    }
    const existingLike = await Like.findOne({video: videoId, likeBy: req.user._id});
   if(existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res.status(200).json(new ApiResponse(200,{}, "Video unliked successfully"));
   }
    const newLike = await Like.create({video: videoId, likeBy: req.user._id});
    return res.status(200).json(new ApiResponse(200,newLike, "Video liked successfully"));
})
const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }
    const comment = await Comment.findById(commentId);
    if(!comment) {
        throw new ApiError(404, "Comment not found");
    }
    const existingLike = await Like.findOne({comment: commentId, likeBy: req.user._id}); 
    if(existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new ApiResponse(200,{}, "Comment unliked successfully"));
    }
    const newLike = await Like.create({comment: commentId, likeBy: req.user._id});
    return res.status(200).json(new ApiResponse(200,newLike, "Comment liked successfully"));
})
const toggleTweetLike = asyncHandler(async (req, res) => {
      const {tweetId} = req.params;
        if(!isValidObjectId(tweetId)) {
            throw new ApiError(400, "Invalid tweet id");    
        }
        const tweet = await Tweet.findById(tweetId);
        if(!tweet) {
            throw new ApiError(404, "Tweet not found");
        }
        const existingLike = await Like.findOne({tweet: tweetId, likeBy: req.user._id});
        if(existingLike) {
            await Like.findByIdAndDelete(existingLike._id);
            return res.status(200).json(new ApiResponse(200,{}, "Tweet unliked successfully"));
        }
        const newLike = await Like.create({tweet: tweetId, likeBy: req.user._id});
        return res.status(200).json(new ApiResponse(200,newLike, "Tweet liked successfully"));
})

const getLikedVideos = asyncHandler(async (req, res) => {
      const LikedVideos =await Like.find({likedBy: req.user._id, video: {$ne: null}}).populate("video");
      const videos = LikedVideos.map(like => like.video);
      return res.status(200).json(new ApiResponse(200,videos, "Liked videos fetched successfully"));
})  

export {
     toggleVideoLike,
     toggleCommentLike,
     toggleTweetLike,
     getLikedVideos
    }