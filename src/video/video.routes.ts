import express from "express"

import { createVideo, getStatusVideo } from "./video.controller.js"

const router = express.Router()

router.post("/generate", createVideo)
router.get("/status/:operationId", getStatusVideo)

export default router;