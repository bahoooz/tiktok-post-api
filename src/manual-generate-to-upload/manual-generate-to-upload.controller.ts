import { Request, Response } from "express";
import { generateToUpload } from "../services/generateToUpload.js";

export const manualGenerateToUpload = async (req: Request, res: Response) => {
  generateToUpload().catch((error) => console.error(error));

  return res
    .status(202)
    .json({
      ok: true,
      message: "Génération de la vidéo et post sur tiktok en cours...",
    });
};
