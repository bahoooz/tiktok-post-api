import express from "express";
import { generatePrompt } from "./prompt.controller.js";
const router = express.Router();

router.get("/generate", generatePrompt);

export default router;
