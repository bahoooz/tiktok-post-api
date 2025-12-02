import express from "express";
import { checkGatekeeper, checkLogin, createUser, getSession, login, verifyPasswordAndLoginGatekeeper } from "./auth.controller.js";
import { verifySessionToken } from "./auth.middleware.js";

const router = express.Router();

router.post("/signup", verifySessionToken, createUser);
router.post("/login", login);
router.get("/session", verifySessionToken, getSession);
router.post("/gatekeeper/login", verifyPasswordAndLoginGatekeeper)

router.get("/login/check", checkLogin)
router.get("/gatekeeper/check", checkGatekeeper)

export default router;
