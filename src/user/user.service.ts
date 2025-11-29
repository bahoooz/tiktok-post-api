import { prisma } from "../lib/prisma.js";

export const getUsersService = async () => {
  const users = await prisma.user.findMany({
    orderBy: {
      id: "asc"
    }
  });

  return users;
};
