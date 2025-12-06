import express from "express";
import { callback, login } from "./youtube.controller.js";

const router = express.Router();

// OAUTH
router.get("/auth/login", login);
router.get("/auth/callback", callback);

export default router;
