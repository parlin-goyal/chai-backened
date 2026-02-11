import { Router } from 'express';
import { verifyJWT } from './../middlewares/auth.middleware.js';
import {upload} from "../middlewares/multer.middleware.js"
import { publishVideo,deleteVideo,updateVideo,getAllVideos,togglePublicStatus,getAllVideos } from '../controllers/video.controller.js';

const router = Router();

router.post(
  "/upload-video",
  upload.fields([
    {   
         name: "video",
         maxCount: 1 
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]),
  publishVideo
);

router.delete("/delete-video/:videoId", verifyJWT, deleteVideo);
router.patch("/update-video/:videoId", verifyJWT, updateVideo);
router.get("/all-videos", getAllVideos);
router.patch("/toggle-public-status/:videoId", verifyJWT, togglePublicStatus);

export default router;

