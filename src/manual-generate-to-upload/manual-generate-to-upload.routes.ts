import express from "express";
import { manualGenerateToUpload } from "./manual-generate-to-upload.controller.js";

const router = express.Router();

router.post("/", manualGenerateToUpload);

export default router;
