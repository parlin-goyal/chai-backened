import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {Video} from "../models/video.model.js";
import { v2ascloudinary } from 'cloudinary';
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const deleteVideo = asyncHandler(async (req, res) => {
      const {videoId} = req.params;
        const video = await Video.findById(videoId);
        if (!video) {
          throw new ApiError(404, "Video not found");
        }   
        if (video.owner.toString() !== req.user._id.toString()) {
          throw new ApiError(403, "You are not authorized to delete this video");
        }   

        await Video.findByIdAndDelete(videoId);
        return res.status(200).json(new ApiResponse(200,{}, "Video deleted successfully"));

})
const updateVideo = asyncHandler(async (req, res) => {
        const {videoId} = req.params;
        const {title, description,thumbnail} = req.body;
        const video =await Video.findById(videoId);
        if (!video) {
          throw new ApiError(404, "Video not found");
        }
        if (video.owner.toString() !== req.user._id.toString()) {
          throw new ApiError(403, "You are not authorized to update this video");
        } 
        video.title = title || video.title;
        video.description = description || video.description;
        video.thumbnail = thumbnail || video.thumbnail;
        await video.save({validateBeforeSave: false})
        return res.status(200).json(new ApiResponse(200,video, "Video updated successfully"));
})

const publishVideo = asyncHandler(async (req, res) => {
      const {title, description, thumbnail} = req.body;
         if(!title || !description || !thumbnail) {
            throw new ApiError(400, "Title, description ,thumbnail are required");
         }
      const publishVideoLocalPath = req.files?.video[0]?.path;
      const publishThumbnailLocalPath = req.files?.thumbnail[0]?.path;
        if (!publishVideoLocalPath) {
            throw new ApiError(400, "Video file is required");
        }
        if (!publishThumbnailLocalPath) {
            throw new ApiError(400, "Thumbnail file is required");
        }

        const videoOnCloudinary = await uploadOnCloudinary(publishVideoLocalPath);
        const thumbnailOnCloudinary = await uploadOnCloudinary(publishThumbnailLocalPath);
        if(!videoOnCloudinary) {
            throw new ApiError(500, "Failed to upload video on cloudinary");
        }
        
        
        if(!thumbnailOnCloudinary) {
            throw new ApiError(500, "Failed to upload thumbnail on cloudinary");
        }

        const video = await Video.create({
            title,
            description,
            thumbnail: thumbnailOnCloudinary.url||"",
            video: videoOnCloudinary.url,
            owner: req.user._id
        })
        return res.status(201).json(new ApiResponse(201, video, "Video published successfully"));
})

const getVideById = asyncHandler(async (req, res) => {
        const {videoId} = req.params;
        const video= await Video.findById(videoId).populate("owner", "username avatar");
        return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
})

const togglePublicStatus = asyncHandler(async (req, res) => {
        const {videoId} = req.params;
        const video = await Video.findById(videoId);
        if (!video) {
          throw new ApiError(404, "Video not found");
        }
        video.isPublished = !video.isPublished;

        await video.save({validateBeforeSave: false});
        return res.status(200).json(new ApiResponse(200, video, "Video public status toggled successfully"));
})

const getAllVideos = asyncHandler(async (req, res) => {
     const {page=1,limit=10,query,sortBy="createdAt",sortType="desc",userId} = req.query;
     
     //build filter object
     const filter = {isPublished: true};

        if(query) {
            filter.$or = [
                {title: {$regex: query, $options: "i"}},
                {description: {$regex: query, $options: "i"}}
            ]
        }
        //if userId is provided, fetch videos of that user only
        if(userId) {
            filter.owner = userId;
        }

       //sorting
       const sortOptions = {};
       sortOptions[sortBy] = sortType === "asc" ? 1 : -1;
       //pagination
        const skip = (Number(page) - 1) * Number(limit);

        const videos = await Video.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .populate("owner", "username avatar");

        const totalVideos = await Video.countDocuments(filter);
        return res.status(200).json(new ApiResponse(200, {
            videos,
            totalPages: Math.ceil(totalVideos / limit),
            currentPage: Number(page)
        }, "Videos fetched successfully"));
})

export {
    deleteVideo,
    updateVideo,
    publishVideo,
    getVideById,
    togglePublicStatus,
    getAllVideos
};