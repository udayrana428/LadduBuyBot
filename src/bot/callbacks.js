const bot = require("./bot");
const { userAdminGroups } = require("./commands");

bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  if (data === "add_token") {
    const userGroups = userAdminGroups.get(userId) || new Set();

    if (userGroups.size > 0) {
      const group = Array.from(userGroups)[0];

      const groupInlineKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🆕 Add a New Token", callback_data: "new_token" }],
            [
              {
                text: "⚙️ Change Token Settings",
                callback_data: "modify_token",
              },
            ],
            [{ text: "❌ Cancel", callback_data: "cancel" }],
          ],
        },
      };

      await bot.sendMessage(
        chatId,
        `🤖 What would you like to do for *${group.title}*?`,
        {
          parse_mode: "Markdown",
          ...groupInlineKeyboard,
        }
      );
    } else {
      await bot.sendMessage(
        chatId,
        "⚠️ You haven't added the bot to any groups yet."
      );
    }
  } else if (data === "new_token") {
    bot.sendMessage(
      chatId,
      `📝 *Please paste the token address you would like me to track...*\n\nI support the following chains:\n\n` +
        `🔸 *EthereumPOW (ETHw)*\n` +
        { parse_mode: "Markdown" }
    );
  } else if (data === "modify_token") {
    bot.sendMessage(
      chatId,
      "⚙️ Select the token you want to modify settings for:"
    );
  } else if (data === "cancel") {
    bot.sendMessage(chatId, "❌ Action cancelled.");
  }

  bot.answerCallbackQuery(callbackQuery.id);
});
