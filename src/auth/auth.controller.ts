import { Request, Response } from "express";
import {
  checkGatekeeperService,
  createUserService,
  getSessionService,
  loginService,
  verifyAndTokenGatekeeperService,
} from "./auth.service.js";
import { loginSchema, signupSchema } from "../../schemas/authSchema.js";
import { ZodError } from "zod";
import { AuthRequest } from "./auth.middleware.js";

export const createUser = async (req: Request, res: Response) => {
  try {
    const validatedData = signupSchema.parse(req.body);

    const newUser = await createUserService(validatedData);

    return res
      .status(201)
      .json({ message: "Compte créé avec succès", user: newUser });
  } catch (error: any) {
    console.error(error);
    if (error instanceof ZodError)
      return res.status(400).json({
        error: error.issues[0].message,
      });

    return res.status(500).json({ error: error.message || "Erreur interne du serveur" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const { token, user } = await loginService(validatedData);

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000,
    });

    return res.status(200).json({
      message: "Connexion réussie",
      user: user,
    });
  } catch (error: any) {
    console.error(error);
    if (error instanceof ZodError)
      return res.status(400).json({ error: error.issues[0].message });

    return res.status(500).json({ error: error.message || "Erreur interne du serveur" });
  }
};

export const getSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: "Non authentifié" });

    const userSession = await getSessionService(userId);

    return res
      .status(200)
      .json({ message: "Session récupéré avec succès", user: userSession });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Erreur interne du serveur" });
  }
};

export const verifyPasswordAndLoginGatekeeper = async (
  req: Request,
  res: Response
) => {
  try {
    const { password } = req.body;

    // VERIFY PASSWORD AND GENERATE TOKEN
    const token = await verifyAndTokenGatekeeperService(password);

    const sevenDaysInMs = 1000 * 60 * 60 * 24 * 7;

    res.cookie("gatekeeper_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: sevenDaysInMs,
    });

    return res.status(200).json({ success: true, message: "Accès approuvé" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(401)
      .json({ error: error.message || "Mot de passe incorrect" });
  }
};

export const checkGatekeeper = async (req: Request, res: Response) => {
  const token = req.cookies.gatekeeper_token;

  if (!token)
    return res.status(401).json({ authorized: false, error: "Pas de token" });

  try {
    checkGatekeeperService(token);

    return res.status(200).json({ authorized: true });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ authorized: false, error: "Token invalide" });
  }
};
