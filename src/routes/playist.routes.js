import { Router } from 'express';

import { getUserPlaylists,getPlaylistById,createPlaylist,addVideoToPlaylist,removeVideoFromPlaylist,deletePlaylist,updatePlaylist } from '../controllers/playlist.controller.js';

import { verifyJWT } from '../middlewares/auth.middleware.js';
const router = Router();
router.use(verifyJWT);

router.route("/").post(verifyJWT,createPlaylist)

router
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(verifyJWT,updatePlaylist)
    .delete(verifyJWT,deletePlaylist);

router.route("/add/:videoId/:playlistId").patch(verifyJWT,addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(verifyJWT,removeVideoFromPlaylist);

router.route("/user/:userId").get(getUserPlaylists);

export default router
