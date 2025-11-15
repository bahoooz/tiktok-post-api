import "dotenv/config";
import "../cron.js";
import express from "express";
import cors, { CorsOptions } from "cors";
const app = express();
const PORT = process.env.PORT || 4000;
const baseUrl = process.env.API_URL;

import videoRoutes from "./video/video.routes.js";
import promptRoutes from "./prompt/prompt.routes.js";
import tiktokRoutes from "./tiktok/tiktok.routes.js";
import manualGenerateToUploadRoutes from "./manual-generate-to-upload/manual-generate-to-upload.routes.js";
import cutRoutes from "./cut/cut.routes.js";
import path from "path";

app.use(express.json());

const allowedOrigins = ["https://video.10banc.com", "http://localhost:3000"];

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

app.use("/cut", cutRoutes);
app.use("/video", videoRoutes);
app.use("/prompt", promptRoutes);
app.use("/tiktok", tiktokRoutes);
app.use("/generate-to-upload", manualGenerateToUploadRoutes);

app.listen(4000, "0.0.0.0", () => {
  console.log(`Server is running at ${baseUrl}`);
});
