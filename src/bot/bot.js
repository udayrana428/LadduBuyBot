require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

// Using the polling method

// const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
//   polling: {
//     allowed_updates: ["message", "my_chat_member", "chat_member"],
//   },
// });

// bot.getMe().then((botInfo) => {
//   bot.botInfo = botInfo;
//   console.log(`🤖 Bot started as @${botInfo.username}`);
// });

// bot.on("polling_error", (error) => {
//   console.error("Polling error:", error);
// });

// Using the webhook method

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { webHook: true });
const WEBHOOK_URL = process.env.WEBHOOK_URL || "https://your-ngrok-url/webhook"; // Replace with actual ngrok URL

// Set Webhook
// bot.setWebHook(WEBHOOK_URL, {
//   allowed_updates: [
//     "message",
//     "my_chat_member",
//     "chat_member",
//     "callback_query",
//   ],
// });

const axios = require("axios");

async function updateWebhook() {
  const response = await axios.post(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`,
    {
      url: process.env.WEBHOOK_URL,
      allowed_updates: [
        "message",
        "my_chat_member",
        "chat_member",
        "callback_query",
        "chat_shared",
      ],
    }
  );
  console.log("Webhook Updated:", response.data);
}

updateWebhook();

bot.getMe().then((botInfo) => {
  bot.botInfo = botInfo;
  console.log(`🤖 Bot started as @${botInfo.username}`);
});

bot.on("polling_error", (error) => {
  console.error("⚠️ Polling error:", error);
});

console.log(`🤖 Bot started with webhook at ${WEBHOOK_URL}`);

module.exports = bot;
