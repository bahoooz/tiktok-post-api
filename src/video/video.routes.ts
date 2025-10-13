import express from "express"

import { createVideo, getAllVideos, getStatusVideo, startTiktokLogin, tiktokCallback, tiktokStatus, uploadDraftFromUrl } from "./video.controller.js"

const router = express.Router()

router.post("/generate", createVideo)
router.get("/status/:operationId", getStatusVideo)
router.get("/get", getAllVideos)

router.get("/auth/tiktok/login", startTiktokLogin)
router.get("/auth/tiktok/callback", tiktokCallback)
router.get("/auth/tiktok/status", tiktokStatus)

router.post("/tiktok/upload-draft", uploadDraftFromUrl)

export default router;