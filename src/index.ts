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
import path from "path";

app.use(express.json());

app.use(
  cors({
    origin: "*", // ou ton localhost en dev
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // si tu utilises des cookies ou headers d'auth
  })
);

app.use("/media", express.static(path.join(process.cwd(), "media")));

app.get("/", (_req, res) => {
  res.send("<h1>Hello Express</h1>");
});

app.use("/video", videoRoutes);
app.use("/prompt", promptRoutes);
app.use("/tiktok", tiktokRoutes);

app.listen(4000, "0.0.0.0", () => {
  console.log(`Server is running at ${baseUrl}`);
});
