const bot = require("./bot");

// Load bot event handlers
require("./commands");
require("./events");
require("./callbacks");

// const startBot = () => {
//   console.log("🚀 Telegram bot is running...");
//   bot.on("polling_error", (error) => {
//     console.error("⚠️ Polling error:", error);
//   });
// };

const startBot = (app) => {
  console.log("🚀 Telegram bot is running with webhook...");

  // webhook endpoint for telegram bot

  app.post("/webhook", (req, res) => {
    // console.log("Webhook received:", JSON.stringify(req.body, null, 2));
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
};

module.exports = { startBot };
