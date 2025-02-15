const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

const sendMessage = (chatId, text) => {
  bot.sendMessage(chatId, text);
};

module.exports = { sendMessage };
