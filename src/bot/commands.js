const bot = require("./bot");

const userAdminGroups = new Map(); // Stores user-admin groups

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
    try {
      const admins = await bot.getChatAdministrators(chatId);
      const isBotAdmin = admins.some(
        (admin) => admin.user.id === bot.botInfo.id
      );

      if (!isBotAdmin) {
        return bot.sendMessage(
          chatId,
          "⚠️ I need to be an admin to function properly."
        );
      }

      if (!userAdminGroups.has(userId)) {
        userAdminGroups.set(userId, new Set());
      }
      userAdminGroups.get(userId).add({ id: chatId, title: msg.chat.title });

      bot.sendMessage(chatId, "✅ Bot is now active in this group.");
      bot.sendMessage(
        userId,
        `✅ Bot has been successfully added to *${msg.chat.title}* and is now active. Use /start to begin.`,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Error fetching group admins:", error);
    }
  } else {
    const replyKeyboard = {
      reply_markup: {
        keyboard: [[{ text: "📌 Click Here to Select Your Group" }]],
        resize_keyboard: true,
      },
    };

    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "➕ Add a Token / Change Token Settings",
              callback_data: "add_token",
            },
          ],
          // [
          //   {
          //     text: "⚙️ Change Token Settings",
          //     callback_data: "change_token_settings",
          //   },
          // ],
        ],
      },
    };

    bot
      .sendMessage(
        chatId,
        "Welcome to Bobby Buy Bot! 🚀\n\nSelect an option below:",
        replyKeyboard
      )
      .then(() =>
        bot.sendMessage(chatId, "🔹 Choose an action:", inlineKeyboard)
      );
  }
});

module.exports = { userAdminGroups };
