import {Router} from "express";
import {addComment,deleteComment,updateComment,getVideoComments} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from '../middlewares/multer.middleware.js';

const router=Router();

router.route("/add").post(verifyJWT,addComment);
router.route("/:id")
.patch(verifyJWT,updateComment)
.delete(verifyJWT,deleteComment);
router.route("/video/:videoId").get(getVideoComments);

export default router;