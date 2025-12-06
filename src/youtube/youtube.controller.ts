import { Request, Response } from "express";
import * as youtubeService from "./youtube.service.js";

export const login = (_req: Request, res: Response) => {
  try {
    const url = youtubeService.generateAuthUrl();
    res.redirect(url);
  } catch (error) {
    console.error("Erreur de login : ", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la génération du lien de connexion" });
  }
};

export const callback = async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code || typeof code !== "string")
    return res.status(400).json({ error: "Code d'authentification manquant" });

  try {
    const channel = await youtubeService.handleAuthCallback(code);

    console.log(`✅ Chaîne connectée : ${channel.title}`);
    res.redirect(
      `${process.env.FRONTEND_URL}/dashboard?status=success&channel=${channel.title}`
    );
  } catch (error) {
    console.error("Erreur callback : ", error);
    res.redirect(`${process.env.FRONT_URL}/dashboard?status=error`);
  }
};
