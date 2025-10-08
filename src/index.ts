import "dotenv/config"
import "../cron.js"
import express from "express";
const app = express();
const PORT = process.env.PORT || 4000;

import videoRoutes from "./video/video.routes.js"
import promptRoutes from "./prompt/prompt.routes.js"

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("<h1>Hello Express</h1>");
});

app.use("/video", videoRoutes)
app.use("/prompt", promptRoutes)

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
