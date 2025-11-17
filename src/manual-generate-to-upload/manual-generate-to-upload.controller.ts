import { Request, Response } from "express";
import { generateToUpload } from "../services/generateToUpload.js";

export const manualGenerateToUpload = async (req: Request, res: Response) => {
  const { promptId } = req.body;

  if (!promptId) return res.status(400).json({ error: "promptId manquant" });

  const id = Number(promptId);

  generateToUpload(id).catch((error) => console.error(error));

  return res.status(202).json({
    ok: true,
    message: "Génération de la vidéo et post sur tiktok en cours...",
  });
};
