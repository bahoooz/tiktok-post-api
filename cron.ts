import cron from "node-cron";

const baseUrl = process.env.API_URL;
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

cron.schedule(
  "12 0 * * *",
  async () => {
    console.log(
      "Création de la vidéo lancé à ",
      new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })
    );

    try {
      const res = await fetch(`${baseUrl}/video/generate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`generate -> HTTP¨${res.status}`);
      const data = await res.json();
      console.log("Statut de la vidéo terminée : ", data);
      const operationId = data.video.operationId;
      if (!operationId) throw new Error("operationId manquant");

      await delay(60_000);

      const statusRes = await fetch(`${baseUrl}/video/status/${operationId}`, {
        method: "POST",
      });
      if (!statusRes.ok) throw new Error(`status -> HTTP ${statusRes.status}`);
      const dataStatus = await statusRes.json();
      console.log("Statut de la vidéo terminée : ", dataStatus);
      const localUrl = dataStatus.localUrl;
      if (!localUrl) throw new Error("localUrl manquant");

      const tiktokPostRes = await fetch(`${baseUrl}/tiktok/upload-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          video_url: localUrl,
        }),
      });
      if (!tiktokPostRes.ok)
        throw new Error(`tiktokPost -> HTTP ${tiktokPostRes.status}`);
      const dataTiktokPost = await tiktokPostRes.json();
      console.log("Statut du post tiktok :", dataTiktokPost);
      console.log(
        "Création et post de la vidéo terminé à ",
        new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })
      );
    } catch (error) {
      console.log("Cron error :", error);
    }
  },
  {
    timezone: "Europe/Paris",
  }
);

cron.schedule(
  "10 9 * * *",
  () => {
    console.log(
      "Job lancé à ",
      new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })
    );
  },
  {
    timezone: "Europe/Paris",
  }
);

cron.schedule(
  "20 9 * * *",
  () => {
    console.log(
      "Job lancé à ",
      new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })
    );
  },
  {
    timezone: "Europe/Paris",
  }
);
