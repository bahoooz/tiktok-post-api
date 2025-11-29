import { Request, Response } from "express";
import { getUsersService } from "./user.service.js";

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await getUsersService();

    console.log(users)
    return res.status(200).json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
