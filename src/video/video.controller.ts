import { Request, Response } from "express";
import { getAccessToken } from "../../utils.js";
import { prisma } from "../lib/prisma.js";
import { DataStatusVideo } from "../../types.js";

const baseUrl = process.env.API_URL;
const bucketName = process.env.GCS_BUCKET;
const projectId = process.env.GCP_ID!;
const model = "veo-3.0-fast-generate-001";
const location = "us-central1";
const aspectRatio = "9:16";

// const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

    // OBTENTION DE L'OPERATIONID POUR AVOIR LE STATUS DE LA CREATION DE LA VIDEO

    // const resStatusVideo = await fetch(
    //   `${baseUrl}/get-status-video/${operationID}`
    // );

    // const dataStatusVideo = await resStatusVideo.json();

    console.log(data);
    console.log(generatedVideo);
    // console.log(operationID);
    // console.log(dataStatusVideo);
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
