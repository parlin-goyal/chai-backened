import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import { upload } from './../middlewares/multer.middleware.js';
import mongoose from "mongoose";


const generateAccessAndRefreshTokens = async(userId)=>{
    try{
   const user=await User.findById(userId);
   if (!user) {
      throw new Error("User not found");
   }
   const accessToken = user.generateAccessTokens();
   const refreshToken = user.generateRefreshTokens();

   user.refreshToken = refreshToken;
   await user.save({validateBeforeSave:false});
   return {accessToken,refreshToken};

   } catch(error){
    console.log("Token generation error:", error);
    throw new ApiError(500,"Failed to generate access and refresh tokens");

   }
    
}

const registerUser=asyncHandler(async(req,res)=>{
           const {fullName,email,username,password} = req.body;
          
           if(
             [fullName,email,username,password].some((field)=>
                field?.trim() === "")
            ){
                 throw new ApiError(400,"All fields are required");
           }
           /*if (!fullName || !email || !username || !password) {
              throw new ApiError(400, "All fields are required");
           }*/
              
           const existedUser = await User.findOne({
            $or:[{email},{username}]
           });
           if(existedUser){
            throw new ApiError(409,"User with the same email or username already exists");
           }
           const avatarLocalPath = req.files?.avatar[0]?.path;
           //const coverImageLocalPath = req.files?.coverImage[0]?.path;
           
           let coverImageLocalPath;
           if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
            coverImageLocalPath = req.files.coverImage[0].path;
           }

           if(!avatarLocalPath ){
           throw new ApiError(400,"Avatar image is required");   
           }
 
           const avatar = await uploadOnCloudinary(avatarLocalPath);
           const coverImage = await uploadOnCloudinary(coverImageLocalPath);
           
            if(!avatar){
            throw new ApiError(500,"Unable to upload avatar image");
           }
           const user = await User.create({
            fullName,
            avatar:avatar.url,
            coverImage: coverImage?.url || "",
            email,
            username: username?.toLowerCase(),
            password
           })
          
           const createdUser = await User.findById(user._id).select("-password -refreshToken"); 
           if(!createdUser){
            throw new ApiError(500,"Unable to create user");
           }
           return res
           .status(201)
           .json(new ApiResponse(201,createdUser,"User registered successfully"));
})

const loginUser=asyncHandler(async(req,res)=>{
         const {email,username,password} =req.body
         if(!(username || email)){
            throw new ApiError(400,"Email or username are required");
         }
        const user= await User.findOne({
            $or:[{username},{email}]
         })
        if(!user){
            throw new ApiError(404,"User not found");
        } 
        const isPasswordValid = await user.isPasswordCorrect(password);
        if(!isPasswordValid){
            throw new ApiError(401,"Invalid user credentials");
        }
      const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);
      const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        const options={
              httpOnly:true,
              secure:true
        }
        return res
        .status(200)
        .cookie("refreshToken",refreshToken,options)
        .cookie("accessToken",accessToken,options)
        .json(new ApiResponse(200,{user:loggedInUser,accessToken},"User logged in successfully"));  
}) 
const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully"));
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies?.refreshToken||req.body.refreshToken;
   if(!incomingRefreshToken){
         throw new ApiError(400,"Refresh token is required");
     }
   try {
    const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken._id);
 
    if(!user){
     throw new ApiError(404,"Invalid refresh token: user not found");
    }
    if(user.refreshToken !== incomingRefreshToken){
     throw new ApiError(401,"Refresh token is either expired or used");
    }
    const options={
     httpOnly:true,
     secure:true
    }
    const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(new ApiResponse(200,{accessToken, refreshToken: newRefreshToken},"Access token refreshed successfully"));
   } catch (error) {
       throw new ApiError(401,error?.message || "Invalid refresh token");
   }
})

const changePassword=asyncHandler(async(req,res)=>{
    const {currentPassword,newPassword} = req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);
    if(!isPasswordCorrect){
        throw new ApiError(401,"Current password is incorrect");
    }
     user.password=newPassword;
     await user.save({validateBeforeSave:false})
     return res
     .status(200)
     .json(new ApiResponse(200,{},"Password changed successfully"));
})
const getCurrentUser=asyncHandler(async(req,res)=>{
    
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"User fetched successfully"));
})
const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email} = req.body;
    if(!fullName && !email){
        throw new ApiError(400,"At least one field is required to update");
    }
    const updatedFields={};
    if(fullName) updatedFields.fullName=fullName;
    if(email) updatedFields.email=email;
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:updatedFields
        },
        {
            new:true
        }
    ).select("-password -refreshToken");
    if(!updatedUser){
        throw new ApiError(500,"Unable to update user details");
    }
    return res
    .status(200)
    .json(new ApiResponse(200,updatedUser,"User details updated successfully"));
})
const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar image is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(500,"Error while uploading avatar image");
     }
     const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new:true
        }
     ).select("-password");
     return res
     .status(200)
     .json(new ApiResponse(200,updatedUser,"Avatar updated successfully"));
})
const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover image is required");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url){
        throw new ApiError(500,"Error while uploading cover image");
     }
     const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new:true
        }
     ).select("-password");
     return res
     .status(200)
     .json(new ApiResponse(200,updatedUser,"Cover image updated successfully"));
})   
const getUserChannelProfile=asyncHandler(async(req,res)=>{
           const {username} = req.params;
           if(!username?.trim()){
            throw new ApiError(400,"Username is required");
           }
           const channel= await User.aggregate([
            {
                $match :{
                    username:username?.toLowerCase()
                }
            },
            {
                $lookup:{
                     from:"subscriptions",
                     localField:"_id",
                     foreignField:"channel",
                     as:"subscribers"
                }
            },
            {
                $lookup:{
                     from:"subscriptions",
                     localField:"_id",
                     foreignField:"subscriber",
                     as:"subscribedTo"
                }
            },
            {
                $addFields:{
                       subscribersCount:{
                        $size:"$subscribers"
                       },
                        channelSubscribedToCount:{
                             $size:"$subscribedTo"
                        },
                        
                            isSubscribed: {
                                $cond: {
                                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                                    then: true,
                                    else: false
                                }
                            }
                        
                    }   
                
                },
                {
                    $project:{
                        fullName:1,
                        username:1,
                        avatar:1,
                        coverImage:1,
                        subscribersCount:1,
                        channelSubscribedToCount:1,
                        isSubscribed:1,
                        email:1
                    }
                }
            
           ])
          
           if(!channel?.length){
            throw new ApiError(404,"channel does not exist");
           }
           return res
           .status(200)
           .json(new ApiResponse(200,channel[0],"User channel fetched successfully"));
        })
           
const getWatchHistory=asyncHandler(async(req,res)=>{
       const user = await User.aggregate([
           {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id) 
            }
           },
           {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                             from:"users",
                             localField:"owner",
                             foreignField:"_id",
                             as:"owner",
                             pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                             ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
           }
       ]) 
       return res
       .status(200)
       .json(new ApiResponse(200,user[0].watchHistory,"User watch history fetched successfully"));        
})   
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};
