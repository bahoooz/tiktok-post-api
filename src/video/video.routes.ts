import express from "express"

import { createVideo, getAllVideos, getStatusVideo } from "./video.controller.js"

const router = express.Router()

router.post("/generate", createVideo)
router.get("/status/:operationId", getStatusVideo)
router.get("/get", getAllVideos)

export default router;