import "dotenv/config";
import "../cron.js";
import express from "express";
import cors from "cors";
const app = express();
const PORT = process.env.PORT || 4000;
const baseUrl = process.env.API_URL;

import videoRoutes from "./video/video.routes.js";
import promptRoutes from "./prompt/prompt.routes.js";

app.use(express.json());

app.use(
  cors({
    origin: "*", // ou ton localhost en dev
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // si tu utilises des cookies ou headers d'auth
  })
);

app.get("/", (_req, res) => {
  res.send("<h1>Hello Express</h1>");
});

app.use("/video", videoRoutes);
app.use("/prompt", promptRoutes);

app.listen(4000, "0.0.0.0", () => {
  console.log(`Server is running at ${baseUrl}`);
});
