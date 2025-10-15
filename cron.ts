import cron from "node-cron";

cron.schedule("43 21 * * *", () => {
  console.log("Job lancé à ", new Date().toLocaleDateString());
}, {
    timezone: "Europe/Paris"
});
