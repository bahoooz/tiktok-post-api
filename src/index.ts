import "dotenv/config";
// import "../cron.js";
import express from "express";
import cookieParser from "cookie-parser"
import cors, { CorsOptions } from "cors";
const app = express();
const baseUrl = process.env.API_URL;

import videoRoutes from "./video/video.routes.js";
import promptRoutes from "./prompt/prompt.routes.js";
import tiktokRoutes from "./tiktok/tiktok.routes.js";
import authRoutes from "./auth/auth.routes.js";
import manualGenerateToUploadRoutes from "./manual-generate-to-upload/manual-generate-to-upload.routes.js";
import cutRoutes from "./cut/cut.routes.js";
import userRoutes from "./user/user.routes.js"
import path from "path";

app.use(express.json());
app.use(cookieParser())

const allowedOrigins = [
  "https://video.10banc.com",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://192.168.1.185:5173",
  "http://192.168.1.175:5173",
  "https://10banc.com"
];

const corsOptions: CorsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// app.options("*", cors(corsOptions));

app.use("/media", express.static(path.join(process.cwd(), "media")));
app.use("/output", express.static(path.join(process.cwd(), "cut", "output")));

app.get("/", (_req, res) => {
  res.send("<h1>Hello Express</h1>");
});

// CUT TOOL
app.use("/cut", cutRoutes);

// GENERATION VIDEO
app.use("/video", videoRoutes);

// UPDATE PROMPTS
app.use("/prompt", promptRoutes);

// POST TIKTOK
app.use("/tiktok", tiktokRoutes);

// GENERATION VIDEO -> POST TIKTOK
app.use("/generate-to-upload", manualGenerateToUploadRoutes);

// AUTH USERS
app.use("/auth", authRoutes);

// MANAGE USERS
app.use("/users", userRoutes)

app.listen(4000, "0.0.0.0", () => {
  console.log(`Server is running at ${baseUrl}`);
});
