const bot = require("./bot");

// Load bot event handlers
require("./commands");
require("./events");
require("./callbacks");

const startBot = () => {
  console.log("🚀 Telegram bot is running...");
  bot.on("polling_error", (error) => {
    console.error("⚠️ Polling error:", error);
  });
};

module.exports = { startBot };
