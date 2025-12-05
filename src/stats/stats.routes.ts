import express from "express";
import { verifySessionToken } from "../auth/auth.middleware.js";

const router = express.Router();

router.get("/", verifySessionToken, )

export default router;