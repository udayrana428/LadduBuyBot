require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
  allowed_updates: ["chat_member", "message", "my_chat_member"],
});

bot.getMe().then((botInfo) => {
  bot.botInfo = botInfo;
  console.log(`🤖 Bot started as @${botInfo.username}`);
});

bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

module.exports = bot;
