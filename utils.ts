import { JWT } from "google-auth-library";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getAccessToken() {
  const keyPath = path.join(__dirname, "vertex-key.json");
  const sa = JSON.parse(fs.readFileSync(keyPath, "utf-8"));

  const client = new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const { token } = await client.getAccessToken();

  if (!token) throw new Error("Impossible de générer un token d'accès");

  return token;
}
