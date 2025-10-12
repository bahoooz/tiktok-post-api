import { Request, Response } from "express";
import { getAccessToken } from "../../utils.js";
import { prisma } from "../lib/prisma.js";
import { DataStatusVideo } from "../../types.js";
import qs from "querystring";

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

    const existingVideoUpdated = await prisma.video.update({
      where: { operationId },
      data: {
        done: dataStatusVideo.done,
        uri: dataStatusVideo.response?.videos?.[0].gcsUri ?? null,
      },
    });

    console.log("Voici les données actuelles du statut : ", dataStatusVideo);
    return res.status(200).json({ existingVideoUpdated, dataStatusVideo });
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

const {
  TIKTOK_CLIENT_KEY,
  TIKTOK_CLIENT_SECRET,
  TIKTOK_REDIRECT_URI,
  TIKTOK_SCOPES,
} = process.env;

let accessToken: string | null = null;

export const startTiktokLogin = async (_req: Request, res: Response) => {
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_key: TIKTOK_CLIENT_KEY!,
    scope: TIKTOK_SCOPES!,
    response_type: "code",
    redirect_uri: TIKTOK_REDIRECT_URI!,
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
    client_key: TIKTOK_CLIENT_KEY!,
    client_secret: TIKTOK_CLIENT_SECRET!,
    code,
    grant_type: "authorization_code",
    redirect_uri: TIKTOK_REDIRECT_URI,
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
    console.error("❌ TikTok token exchange failed:", data);
    return res.status(500).json(data);
  }

  accessToken = data.access_token;
  console.log("✅ TikTok token récupéré avec succès :", accessToken);

  res.redirect("https://video.10banc.com/success-token");
};
export const tiktokStatus = async (_req: Request, res: Response) => {
  res.json({
    connected: !!accessToken,
    accessToken: accessToken ? "stored" : null,
  });
};
