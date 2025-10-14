import { Request, Response } from "express";
import { getAccessToken } from "../../utils.js";
import { prisma } from "../lib/prisma.js";
import { DataStatusVideo } from "../../types.js";
import qs from "querystring";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { createWriteStream } from "fs";
import { randomUUID } from "crypto";

const MEDIA_DIR = path.join(process.cwd(), "media");

const baseUrl = process.env.API_URL;
const bucketName = process.env.GCS_BUCKET;
const projectId = process.env.GCP_ID!;
const model = "veo-3.0-fast-generate-001";
const location = "us-central1";
const aspectRatio = "9:16";

export const createVideo = async (_req: Request, res: Response) => {
  try {
    const generatePrompt = await fetch(`${baseUrl}/prompt/generate`);
    if (!generatePrompt.ok)
      throw new Error(
        `generate-prompt failed : ${generatePrompt.status} ${generatePrompt.statusText}`
      );
    const { prompt } = (await generatePrompt.json()) as { prompt: string };
    if (!prompt || typeof prompt !== "string")
      throw new Error("Invalid prompt payload form /generate-prompt");

    console.log("prompt :", prompt);

    // GENERER AVEC LA VIDEO (VEO3)
    const token = await getAccessToken();
    const veoRequest = await fetch(
      `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predictLongRunning`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [
            {
              prompt,
            },
          ],
          parameters: {
            storageUri: bucketName,
            sampleCount: 1,
            aspectRatio: aspectRatio,
            durationSeconds: 8,
          },
        }),
      }
    );

    // REPONSE API CREATION DE LA VIDEO
    const data = await veoRequest.json();
    const operationId = data.name.split("/operations/")[1];

    const generatedVideo = await prisma.video.create({
      data: {
        type: "tiktok",
        operationId,
        done: false,
        prompt,
        createdAt: new Date(),
      },
    });

    console.log(data);
    console.log(generatedVideo);
    return res.status(200).json({
      message: "Video generated successfully and save",
      video: generatedVideo,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getStatusVideo = async (req: Request, res: Response) => {
  try {
    const token = await getAccessToken();

    const { operationId } = req.params;

    const existingVideo = await prisma.video.findUnique({
      where: { operationId },
    });

    if (!existingVideo)
      return res
        .status(400)
        .json({ message: "No video with this operationId" });

    const statusVideo = await fetch(
      `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:fetchPredictOperation`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operationName: `projects/${projectId}/locations/${location}/publishers/google/models/${model}/operations/${operationId}`,
        }),
      }
    );
    const dataStatusVideo: DataStatusVideo = await statusVideo.json();

    const gcsUri = dataStatusVideo.response?.videos?.[0]?.gcsUri ?? null;

    const existingVideoUpdated = await prisma.video.update({
      where: { operationId },
      data: {
        done: dataStatusVideo.done,
        uri: gcsUri,
      },
    });

    let localUrl: string | null = null;

    if (gcsUri) {
      if (!fs.existsSync(MEDIA_DIR))
        fs.mkdirSync(MEDIA_DIR, { recursive: true });

      const toHttpsFromGs = (uri: string) => {
        if (!uri.startsWith("gs://")) return uri;
        const without = uri.replace("gs://", "");
        const [bucket, ...rest] = without.split("/");
        return `https://storage.googleapis.com/${bucket}/${rest.join("/")}`;
      };
      const publicUrl = toHttpsFromGs(gcsUri);

      const r = await fetch(publicUrl);

      if (r.ok && r.body) {
        const filename = `${operationId}.mp4`;
        const destPath = path.join(MEDIA_DIR, filename);
        await pipeline(r.body as any, createWriteStream(destPath));

        const base =
          process.env.MEDIA_BASE_URL ??
          `${req.protocol}://${req.get("host")}/media`;
        localUrl = `${base}/${filename}`;
      } else {
        console.error("Mirror download failed :", publicUrl, r.status);
      }
    }

    console.log("Voici les données actuelles du statut : ", dataStatusVideo);
    return res
      .status(200)
      .json({ existingVideoUpdated, dataStatusVideo, localUrl });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllVideos = async (_req: Request, res: Response) => {
  try {
    const videos = await prisma.video.findMany();

    if (videos.length === 0)
      return res.status(404).json({ message: "No videos found" });

    return res.status(200).json(videos);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// TIKTOK API

let accessToken: string | null = null;

export const startTiktokLogin = async (_req: Request, res: Response) => {
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    scope: process.env.TIKTOK_SCOPES!,
    response_type: "code",
    redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
    state,
  });

  res.redirect(
    `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`
  );
};

export const tiktokCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).send("Missing code");

  const body = qs.stringify({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    client_secret: process.env.TIKTOK_CLIENT_SECRET!,
    code,
    grant_type: "authorization_code",
    redirect_uri: process.env.TIKTOK_REDIRECT_URI,
  });

  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ TikTok token exchange failed. Full payload :", data);
    return res.status(500).json({
      message: "Token exhange failed",
      data,
    });
  }

  accessToken = data.access_token;
  console.log("✅ TikTok token récupéré avec succès :", data);

  res.redirect("https://video.10banc.com/success-token");
};

export const tiktokStatus = async (_req: Request, res: Response) => {
  res.json({
    connected: !!accessToken,
    accessToken: accessToken ? "stored" : null,
  });
};

export const uploadDraftFromUrl = async (req: Request, res: Response) => {
  try {
    if (!accessToken)
      return res.status(401).json({ error: "Not connected to Tiktok" });
    const { video_url } = req.body;
    if (!video_url) {
      console.log("Body reçu:", req.body); // debug
      return res.status(400).json({ error: "Missing videoUrl" });
    }

    const r = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          Accept: "application/json",
        },
        body: JSON.stringify({
          source_info: {
            source: "PULL_FROM_URL",
            video_url,
          },
        }),
      }
    );
    const ct = r.headers.get("content-type") || "";
    const raw = await r.text();
    if (!ct.includes("application/json")) {
      // TikTok a renvoyé une page HTML (404/403...) → renvoyer l’aperçu pour debug
      return res.status(r.status).json({
        error: "Non-JSON from TikTok",
        status: r.status,
        bodyPreview: raw.slice(0, 600),
      });
    }
    const data = JSON.parse(raw);
    if (!r.ok) {
      console.error("TikTok draft init error:", data);
      return res.status(r.status).json(data);
    }
    return res.json({ ok: true, step: "inbox_init", data });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error?.message ?? "server_error" });
  }
};

export const uploadDirectPostFromUrl = async (req: Request, res: Response) => {
  try {
    if (!accessToken)
      return res.status(401).json({ error: "Not connected to Tiktok" });

    const { video_url } = req.body;

    if (!video_url) {
      console.log("Body reçu:", req.body); // debug
      return res.status(400).json({ error: "Missing videoUrl" });
    }

    const r = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/video/init/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({
          post_info: {
            title: "C'est bientôt halloween #fyp #pourtoi",
            privacy_level: "PUBLIC_TO_EVERYONE",
            is_aigc: true,
            video_cover_timestamp_ms: 1000,
            brand_content_toggle: false,
            brand_organic_toggle: false
          },
          source_info: {
            source: "PULL_FROM_URL",
            video_url,
          },
        }),
      }
    );
  } catch (error) {}
};
