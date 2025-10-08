import cron from "node-cron";

cron.schedule("5 17 * * *", () => {
  console.log("Job lancé à ", new Date().toLocaleDateString());
}, {
    timezone: "Europe/Paris"
});
