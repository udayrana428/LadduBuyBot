const bot = require("./bot");
const { userAdminGroups } = require("./commands");
const Group = require("../models/Group");
const Token = require("../models/Token"); // Assuming you have a Token model

const SUPPORTED_CHAINS = [
  "Ethw",
  "Bsc",
  "Polygon",
  "Avax",
  "Arb",
  "Base",
  "Tron",
  "Unichain",
];

let userState = {}; // Temporary storage for user selections

bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  if (data === "add_token") {
    const replyKeyboard = {
      reply_markup: {
        keyboard: [[{ text: "📌 Click Here to Select Your Group" }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    };
    await bot.sendMessage(
      chatId,
      "Use the buttons below to select the group or channel that you want to add or modify Laddu with (If Laddu is not in this group then it will be automatically added):",
      replyKeyboard
    );
  } else if (data.startsWith("confirm_group_")) {
    const groupId = data.split("_")[2];

    try {
      const group = await Group.findOne({ groupId });
      if (!group) return bot.sendMessage(chatId, "❌ Group not found.");

      bot.sendMessage(
        chatId,
        `What are you wanting to do for *${group.title}* today?`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "➕ Add a New Token",
                  callback_data: `new_token_${groupId}`,
                },
              ],
              [
                {
                  text: "⚙ Change Token Settings",
                  callback_data: `change_token_${groupId}`,
                },
              ],
              [{ text: "❌ Cancel", callback_data: "cancel_action" }],
            ],
          },
        }
      );
    } catch (error) {
      console.error("Error processing group confirmation:", error);
      bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  } else if (data.startsWith("select_group_")) {
    const groupId = data.split("_")[2];

    try {
      const group = await Group.findOne({ groupId });
      if (!group) return bot.sendMessage(chatId, "❌ Group not found.");

      bot.sendMessage(
        chatId,
        `Are you sure you want to send *${group.title}* to LadduBuyBot?\n\nThis will also add LadduBuyBot to *${group.title}* with the following rights:\n- Add Users`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "✅ Send", callback_data: `confirm_group_${groupId}` },
                { text: "❌ Cancel", callback_data: "cancel_selection" },
              ],
            ],
          },
        }
      );
    } catch (error) {
      console.error("Error fetching group details:", error);
      bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  } else if (data.startsWith("new_token_")) {
    const groupId = data.split("_")[2];

    try {
      const group = await Group.findOne({ groupId });
      if (!group) return bot.sendMessage(chatId, "❌ Group not found.");

      // Store the group selection for the user
      userState[userId] = { groupId };

      // Ask the user to select a chain
      bot.sendMessage(
        chatId,
        "🔹 Please select the blockchain where the token exists:",
        {
          reply_markup: {
            keyboard: SUPPORTED_CHAINS.map((chain) => [{ text: chain }]),
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }
      );
    } catch (error) {
      console.error("Error handling new token:", error);
      bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
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

module.exports = { userState, SUPPORTED_CHAINS };
