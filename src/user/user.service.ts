import { prisma } from "../lib/prisma.js";

export const getUsersService = async () => {
  const users = await prisma.user.findMany({
    orderBy: {
      id: "asc",
    },
  });

  return users;
};

export const getSpecificUserService = async (username: string) => {
  if (!username) throw new Error("Le nom d'utilisateur est manquant");

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      username: true,
      avatar: true,
    },
  });

  return user;
};
