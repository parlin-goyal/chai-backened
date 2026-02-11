import {ApiResponse} from '../utils/ApiResponse.js';
import {ApiError} from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {Playlist} from '../models/playlist.model.js';

import mongoose,{isValidObjectId} from 'mongoose';

const getUserPlaylists = asyncHandler(async(req,res)=>{
    const {page=1,limit=10}=req.query
    const {UserId} = req.params;
    if(!isValidObjectId(UserId)){
        throw new ApiError(400,"Invalid user id")
    }
    const playlist = await Playlist.find({owner:UserId})
    .skip((page-1)*limit)
    .limit(limit)
    .sort({createdAt:-1})

    return res.status(200).json(new ApiResponse(200,playlist,"Playlist fetched successfully"))

})

const getPlaylistById = asyncHandler(async(req,res)=>{
           const {playlistId} = req.params;
           if(!isValidObjectId(playlistId)){
            throw new ApiError(400,"Invalid playlist id")
           }
           const playlist = await Playlist.findById(playlistId).populate("videos");
              if(!playlist){
                throw new ApiError(404,"Playlist not found")
              }
                return res.status(200).json(new ApiResponse(200,playlist,"Playlist fetched successfully"))
})
const createPlaylist = asyncHandler(async(req,res)=>{
    const {name,description}=req.body
    if(!name){
        throw new ApiError(400,"Playlist name is required")
    }
    const newPlaylist = await Playlist.create({
        fullName:name,
        description:description || "",
        owner:req.user._id
    })
    return res.status(201).json(new ApiResponse(201,newPlaylist,"Playlist created successfully"))
})

const addVideoToPlaylist = asyncHandler(async(req,res)=>{
    const {playlistId,videoId}=req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid playlist id or video id")
    }
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }
    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"You are not authorized to modify this playlist")
    }   
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push:{videos:videoId}
        },
        {new:true}
    )
    return res.status(200).json(new ApiResponse(200,updatedPlaylist,"Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async(req,res)=>{
      const {playlistId,videoId}=req.params
      if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid playlist id or video id")
    }
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }
    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"You are not authorized to modify this playlist")
    }   
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{videos:videoId}
        },
        {new:true}
    )
    return res.status(200).json(new ApiResponse(200,updatedPlaylist,"Video removed from playlist successfully"))
})
const deletePlaylist = asyncHandler(async(req,res)=>{
    const {playlistId}=req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist id")
    }
    
    const deletedPlaylist = await Playlist.findOneAndDelete({
        _id:playlistId,
        owner:req.user._id
    })
    if(!deletedPlaylist){
        throw new ApiError(404,"Playlist not found or you are not authorized to delete it")
    }
    return res.status(200).json(new ApiResponse(200,deletedPlaylist,"Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async(req,res)=>{
    const {playlistId}=req.params
    const {name,description}=req.body
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist id")
    }
    if(!name && !description){
        throw new ApiError(400,"At least name or description is required to update playlist")
    }
    const updatePlaylist = await Playlist.findOneAndUpdate(
        {
            _id:playlistId,
            owner:req.user._id
        },
        {   
            $set:{
                fullName:name,
                description:description 
            }
        },
        {new:true}
    )
    if(!updatePlaylist){
        throw new ApiError(404,"Playlist not found or you are not authorized to update it")
    }
    return res.status(200).json(new ApiResponse(200,updatePlaylist,"Playlist updated successfully"))
})

export {
    getUserPlaylists,
    getPlaylistById,
    createPlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}

