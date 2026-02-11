import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler} from "../utils/asyncHandler.js";

const addComment=asyncHandler(async(req,res)=>{
    const {content,video}=req.body
    if(!content || !video){
        throw new ApiError(400,"Content and video are required")
    }
    const comment=await Comment.create({
        content:content,
        video:video,
        owner:req.user._id
    })
    res.status(201).json(new ApiResponse(true,comment,"Comment added successfully"))
})
const updateComment=asyncHandler(async(req,res)=>{
        const {content}=req.body
        const {id}=req.params
        if(!content){
            throw new ApiError(400,"Content is required")
        }
        const updatedComment={}
        if(content){
            updatedComment.content=content
        }
        const updated=await Comment.findOneAndUpdate(
            {
                _id:id,
                owner:req.user._id
            },
            {
                $set:updatedComment
            },
            {
                new:true
            })
        if(!updated){
            throw new ApiError(404,"Comment not found")
        }
        return res
        .status(200)
        .json(new ApiResponse(200,updated,"Comment updated successfully"))
})
const deleteComment=asyncHandler(async(req,res)=>{
      const {id}=req.params
      const deleted=await Comment.findOneAndDelete({
        _id:id,
        owner:req.user._id
      })
        if(!deleted){
            throw new ApiError(404,"Comment not found")
        }
        return res
        .status(200)
        .json(new ApiResponse(200,null,"Comment deleted successfully"))
})
const getVideoComments=asyncHandler(async(req,res)=>{
        const {page=1,limit=10}=req.query
        const {videoId}=req.params
        const comments=await Comment.find({video:videoId})
        .populate("owner","username avatar")
        .skip((page-1)*limit)
        .limit(limit)
        .sort({createdAt:-1})
        return res
        .status(200)
        .json(new ApiResponse(200,comments,"Comments fetched successfully"))
})

export {
    addComment,
    updateComment,
    deleteComment,
    getVideoComments
}