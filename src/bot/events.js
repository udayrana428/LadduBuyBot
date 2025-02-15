const bot = require("./bot");
const { userAdminGroups } = require("./commands");

// Handle bot being added to a group
bot.on("message", async (msg) => {
  if (msg.new_chat_member && msg.new_chat_member.id === bot.botInfo?.id) {
    bot.sendMessage(
      msg.chat.id,
      "🚀 Thank you for adding me to your group! To function properly, please make me an admin. Once done, use /start to begin."
    );
  }

  // Handle "📌 Click Here to Select Your Group"
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (msg.text === "📌 Click Here to Select Your Group") {
    const userGroups = userAdminGroups.get(userId) || new Set();

    if (userGroups.size > 0) {
      bot.sendMessage(chatId, "✅ You have already added the bot to a group!");
    } else {
      bot.sendMessage(
        chatId,
        "⚠ Please add the bot to a group where you are an admin!",
        {
          parse_mode: "Markdown",
        }
      );
    }
  }
});

// Handle bot being removed from a group
bot.on("my_chat_member", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (
    msg.new_chat_member.status === "kicked" ||
    msg.new_chat_member.status === "left"
  ) {
    console.log(`🚨 Bot was removed from: ${chatId}`);

    let removedGroupName = "";
    for (let [user, groups] of userAdminGroups.entries()) {
      groups.forEach((group) => {
        if (group.id === chatId) {
          removedGroupName = group.title;
          groups.delete(group);
        }
      });

      if (groups.size === 0) {
        userAdminGroups.delete(user);
      }

      if (removedGroupName) {
        bot.sendMessage(
          user,
          `⚠️ The bot has been removed from *${removedGroupName}*.`,
          { parse_mode: "Markdown" }
        );
      }
    }
  }
});
