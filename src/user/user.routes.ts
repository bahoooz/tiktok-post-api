import express from "express";
import { getUsers } from "./user.controller.js";
import { verifyGatekeeperToken } from "../auth/auth.middleware.js";

const router = express.Router();

router.get("/", verifyGatekeeperToken, getUsers);

export default router;
