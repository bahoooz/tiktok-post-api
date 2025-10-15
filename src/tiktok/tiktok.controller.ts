import { Request, Response } from "express";

let accessToken: string | null = null;

export const uploadDraftFromUrl = async (req: Request, res: Response) => {
  try {
    if (!accessToken)
      return res.status(401).json({ error: "Not connected to Tiktok" });
    const { video_url } = req.body;
    if (!video_url) {
      console.log("Body reçu:", req.body); // debug
      return res.status(400).json({ error: "Missing videoUrl" });
    }

    const r = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          Accept: "application/json",
        },
        body: JSON.stringify({
          source_info: {
            source: "PULL_FROM_URL",
            video_url,
          },
        }),
      }
    );
    const ct = r.headers.get("content-type") || "";
    const raw = await r.text();
    if (!ct.includes("application/json")) {
      // TikTok a renvoyé une page HTML (404/403...) → renvoyer l’aperçu pour debug
      return res.status(r.status).json({
        error: "Non-JSON from TikTok",
        status: r.status,
        bodyPreview: raw.slice(0, 600),
      });
    }
    const data = JSON.parse(raw);
    if (!r.ok) {
      console.error("TikTok draft init error:", data);
      return res.status(r.status).json(data);
    }
    return res.json({ ok: true, step: "inbox_init", data });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error?.message ?? "server_error" });
  }
};

export const uploadDirectPostFromUrl = async (req: Request, res: Response) => {
  try {
    if (!accessToken)
      return res.status(401).json({ error: "Not connected to Tiktok" });

    const { video_url } = req.body;

    if (!video_url) {
      console.log("Body reçu:", req.body); // debug
      return res.status(400).json({ error: "Missing videoUrl" });
    }

    const r = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/video/init/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({
          post_info: {
            title: "C'est bientôt halloween #fyp #pourtoi",
            privacy_level: "SELF_ONLY",
            is_aigc: true,
            video_cover_timestamp_ms: 1000,
            brand_content_toggle: false,
            brand_organic_toggle: false,
          },
          source_info: {
            source: "PULL_FROM_URL",
            video_url,
          },
        }),
      }
    );
    const data = await r.json();
    res.status(200).json({ message: "ça a marché : ", data });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error?.message ?? "server_error" });
  }
};