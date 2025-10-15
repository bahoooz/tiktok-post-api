import express from "express";
import { uploadDirectPostFromUrl, uploadDraftFromUrl } from "./tiktok.controller.js";

const router = express.Router();

router.post("/upload-draft", uploadDraftFromUrl)
router.post("/direct-post", uploadDirectPostFromUrl);

export default router;