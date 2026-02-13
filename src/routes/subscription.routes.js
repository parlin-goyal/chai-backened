import { Router } from 'express';
import {
    getUserSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/c/:channelId")
    .get(verifyJWT,getUserSubscribedChannels)
    .post(verifyJWT,toggleSubscription);

router.route("/u/:subscriberId").get(verifyJWT,getUserChannelSubscribers);

export default router