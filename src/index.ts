import "dotenv/config";
import "../cron.js";
import express from "express";
import cors from "cors";
const app = express();
const PORT = process.env.PORT || 4000;
const baseUrl = process.env.API_URL;

import videoRoutes from "./video/video.routes.js";
import promptRoutes from "./prompt/prompt.routes.js";
import tiktokRoutes from "./tiktok/tiktok.routes.js";
import cutRoutes from "./cut/cut.routes.js";
import path from "path";

app.use(express.json());

const allowedOrigins = ["https://video.10banc.com", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use("/media", express.static(path.join(process.cwd(), "media")));
app.use("/output", express.static(path.join(process.cwd(), "cut", "output")));

app.get("/", (_req, res) => {
  res.send("<h1>Hello Express</h1>");
});

app.use("/cut", cutRoutes);
app.use("/video", videoRoutes);
app.use("/prompt", promptRoutes);
app.use("/tiktok", tiktokRoutes);

app.listen(4000, "0.0.0.0", () => {
  console.log(`Server is running at ${baseUrl}`);
});
