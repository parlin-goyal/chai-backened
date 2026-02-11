import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';

export const healthCheck = asyncHandler(async (req, res) => {
  
    const response = new ApiResponse(200, 'OK', 'Health check successful');
    res.status(200).json(response);
  
});