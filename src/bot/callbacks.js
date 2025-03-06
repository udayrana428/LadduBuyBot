const bot = require("./bot");
const { userAdminGroups } = require("./commands");
const Group = require("../models/Group");
const Token = require("../models/Token"); // Assuming you have a Token model
const { updateTokenSettingsMessage } = require("../services/telegramService");

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
  const messageId = callbackQuery.message.message_id;

  if (data === "add_token/change_setting") {
    const replyKeyboard = {
      reply_markup: {
        // keyboard: [[{ text: "📌 Click Here to Select Your Group" }]],
        keyboard: [
          [
            {
              text: "📌 Select a Group",
              request_chat: {
                request_id: 1, // Unique ID for tracking requests
                chat_is_channel: false, // Set to true if selecting channels
                user_administrator_rights: {
                  can_manage_chat: true, // Ensures user is an admin
                  can_post_messages: true,
                  can_invite_users: true,
                  can_delete_messages: true,
                  can_change_info: true,
                },
                bot_administrator_rights: {
                  can_manage_chat: true,
                  can_post_messages: true,
                  can_invite_users: true,
                  can_delete_messages: true,
                  can_change_info: true,
                },
                bot_is_member: false, // Setting this to false ensures "Create a New Group" option appears
              },
            },
          ],
        ],
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
              [{ text: "❌ Cancel", callback_data: "cancel_home" }],
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
                { text: "❌ Cancel", callback_data: "cancel_home" },
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
  } else if (data.startsWith("change_token_")) {
    const groupId = data.split("_")[2];

    try {
      // Store the groupId in userState when user starts changing token settings
      userState[userId] = { groupId };
      const group = await Group.findOne({ groupId }).populate("tokens.token");

      if (!group) return bot.sendMessage(chatId, "❌ Group not found.");

      if (!group.tokens || group.tokens.length === 0) {
        return bot.sendMessage(
          chatId,
          `You have not loaded any tokens in ${group.title} - please add a token first `,
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
                [{ text: "❌ Cancel", callback_data: "cancel_home" }],
              ],
            },
          }
        );
      }

      // Create inline keyboard buttons for each token
      const tokenButtons = group.tokens.map(({ token }) => [
        {
          text: `${token.name} (${token.symbol}) on ${token.chain} chain`,
          callback_data: `edit_token_setting_${token._id}_${groupId}`,
        },
      ]);

      bot.sendMessage(chatId, "⚙️ Choose a token to change settings:", {
        reply_markup: {
          inline_keyboard: [
            ...tokenButtons,
            [{ text: "❌ Cancel", callback_data: "cancel_home" }],
          ],
        },
      });
    } catch (error) {
      console.error("Error fetching tokens for group:", error);
      bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  } else if (data.startsWith("edit_token_setting_")) {
    const [, , , tokenId, groupId] = data.split("_"); // Extract both tokenId and groupId

    try {
      // console.log(`Userstate: ${JSON.stringify(userState)}`);
      // const groupId = userState[userId].groupId;

      // Find the group that contains this token
      const group = await Group.findOne({ groupId }).populate("tokens.token");

      if (!group) return bot.sendMessage(chatId, "❌ Group not found.");

      // Store the groupId in userState to persist it for later interactions
      // userState[userId] = { ...userState[userId], groupId: group.groupId };

      // IMPORTANT FIX: Store both groupId and tokenId in userState // CHANGES
      userState[userId] = {
        groupId: group.groupId,
        tokenId: tokenId,
        messageId: messageId,
      };

      // Find the token settings within the group
      const tokenData = group.tokens.find(
        (t) => t.token._id.toString() === tokenId
      );

      if (!tokenData) {
        return bot.sendMessage(chatId, "❌ Token settings not found.");
      }

      const { token, settings } = tokenData;

      bot.sendMessage(
        chatId,
        `⚙️ *Settings for ${token.name} (${token.symbol}) in ${group.title}*:\n\n` + //changes added group.title
          `Please click on each setting to change it`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: `✏ Minimum Buy : ${settings.minBuyValue}`,
                  callback_data: `set_minBuy_${tokenId}_${groupId}`,
                },
              ],
              [
                {
                  text: "🖼️ Media/Gif",
                  callback_data: `set_media`,
                },
              ],
              [
                {
                  text: settings.buyAlerts
                    ? "🔴 Disable Buy Alerts"
                    : "🟢 Enable Buy Alerts",
                  callback_data: `toggle_buyAlerts_${tokenId}_${groupId}`,
                },
              ],
              [
                {
                  text: settings.sellAlerts
                    ? "🔴 Disable Sell Alerts"
                    : "🟢 Enable Sell Alerts",
                  callback_data: `toggle_sellAlerts_${tokenId}_${groupId}`,
                },
              ],
              [
                {
                  text: settings.priceTracking
                    ? "🔴 Disable Price Tracking"
                    : "🟢 Enable Price Tracking",
                  callback_data: `toggle_priceTracking_${tokenId}_${groupId}`,
                },
              ],
              [
                {
                  text: "⚠️ Delete Token",
                  callback_data: `confirm_delete_token`,
                },
              ],
              [{ text: "❌ Cancel", callback_data: "cancel_home" }],
            ],
          },
        }
      );
    } catch (error) {
      console.error("Error fetching token settings:", error);
      bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  } else if (data.startsWith("set_minBuy_")) {
    // const tokenId = data.split("_")[2];
    const [, , tokenId, groupId] = data.split("_"); // Extract both tokenId and groupId

    // IMPORTANT FIX: Make sure we're using the correct group for this token
    // We need to find the group that contains this token if not already in userState
    if (!userState[userId] || !userState[userId].groupId) {
      try {
        const group = await Group.findOne({ "tokens.token": tokenId });
        if (!group) return bot.sendMessage(chatId, "❌ Group not found.");

        userState[userId] = {
          groupId: group.groupId,
          tokenId,
          messageId,
          waitingForMinBuy: true,
        };
      } catch (error) {
        console.error("Error finding group for token:", error);
        return bot.sendMessage(
          chatId,
          "❌ An error occurred. Please try again."
        );
      }
    } else {
      // Update existing state
      userState[userId] = {
        ...userState[userId],
        tokenId,
        messageId,
        waitingForMinBuy: true,
      };
    }

    console.log(`Current User: ${JSON.stringify(userState)}`);

    bot.sendMessage(
      chatId,
      "✅ Please enter the minimum buy value (in dollars) below.\n\n" +
        "🔹 Purchases below the minimum buy value will not be posted by Laddu.\n" +
        "🔹 Minimum is 1.",
      {
        reply_markup: {
          force_reply: true,
          input_field_placeholder: "Put new minimum buy value...",
        },
      }
    );
  } else if (data === "set_media") {
    if (
      !userState[userId] ||
      !userState[userId].tokenId ||
      !userState[userId].groupId
    ) {
      return bot.sendMessage(chatId, "❌ Invalid request. Please try again.");
    }

    userState[userId].waitingForMedia = true;

    bot.sendMessage(
      chatId,
      "📸 Please send an image, gif, or media file.\n\n" +
        "🔹 Supported formats: JPG, PNG, GIF, MP4.\n" +
        "🔹 The bot will store and use this media for alerts.",
      {
        reply_markup: {
          force_reply: true,
          input_field_placeholder: "Upload an image/gif...",
        },
      }
    );
  } else if (data.startsWith("toggle_buyAlerts_")) {
    // const tokenId = data.split("_")[2];
    // const [, , tokenId, groupId] = data.split("_"); // Extract both tokenId and groupId

    // Ensure userState[userId] exists
    if (
      !userState[userId] ||
      !userState[userId].tokenId ||
      !userState[userId].groupId
    ) {
      return bot.sendMessage(chatId, "❌ Invalid request. Please try again.");
    }

    const { tokenId, groupId } = userState[userId];
    try {
      const group = await Group.findOne({ groupId }).populate("tokens.token");

      if (!group) return bot.sendMessage(chatId, "❌ Group not found.");

      const tokenData = group.tokens.find(
        (t) => t.token._id.toString() === tokenId
      );
      if (!tokenData)
        return bot.sendMessage(chatId, "❌ Token settings not found.");

      // Toggle buy alerts
      tokenData.settings.buyAlerts = !tokenData.settings.buyAlerts;
      await group.save();

      // Update the message dynamically
      await updateTokenSettingsMessage(chatId, messageId, tokenId, groupId);
    } catch (error) {
      console.error("Error toggling buy alerts:", error);
      bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  } else if (data.startsWith("toggle_sellAlerts_")) {
    // const tokenId = data.split("_")[2];
    // const [, , tokenId, groupId] = data.split("_"); // Extract both tokenId and groupId

    // Ensure userState[userId] exists
    if (
      !userState[userId] ||
      !userState[userId].tokenId ||
      !userState[userId].groupId
    ) {
      return bot.sendMessage(chatId, "❌ Invalid request. Please try again.");
    }

    const { tokenId, groupId } = userState[userId];

    try {
      const group = await Group.findOne({ groupId }).populate("tokens.token");

      if (!group) return bot.sendMessage(chatId, "❌ Group not found.");

      const tokenData = group.tokens.find(
        (t) => t.token._id.toString() === tokenId
      );
      if (!tokenData)
        return bot.sendMessage(chatId, "❌ Token settings not found.");

      // Toggle sell alerts
      tokenData.settings.sellAlerts = !tokenData.settings.sellAlerts;
      await group.save();

      // Update the message dynamically
      await updateTokenSettingsMessage(chatId, messageId, tokenId, groupId);
    } catch (error) {
      console.error("Error toggling sell alerts:", error);
      bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  } else if (data.startsWith("toggle_priceTracking_")) {
    // const tokenId = data.split("_")[2];
    // const [, , tokenId, groupId] = data.split("_"); // Extract both tokenId and groupId

    // Ensure userState[userId] exists
    if (
      !userState[userId] ||
      !userState[userId].tokenId ||
      !userState[userId].groupId
    ) {
      return bot.sendMessage(chatId, "❌ Invalid request. Please try again.");
    }

    const { tokenId, groupId } = userState[userId];

    try {
      const group = await Group.findOne({ groupId }).populate("tokens.token");

      if (!group) return bot.sendMessage(chatId, "❌ Group not found.");

      const tokenData = group.tokens.find(
        (t) => t.token._id.toString() === tokenId
      );
      if (!tokenData)
        return bot.sendMessage(chatId, "❌ Token settings not found.");

      // Toggle price tracking
      tokenData.settings.priceTracking = !tokenData.settings.priceTracking;
      await group.save();

      // Update the message dynamically
      await updateTokenSettingsMessage(chatId, messageId, tokenId, groupId);
    } catch (error) {
      console.error("Error toggling price tracking:", error);
      bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  } else if (data.startsWith("confirm_delete_token")) {
    // Send confirmation message
    bot.sendMessage(
      chatId,
      `Are you sure you want to delete token from this group?.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ DELETE Token",
                callback_data: `delete_token_`,
              },
            ],
            [{ text: "❌ Cancel", callback_data: "cancel_home" }],
          ],
        },
      }
    );
  } else if (data.startsWith("delete_token_")) {
    // Ensure userState[userId] exists
    if (
      !userState[userId] ||
      !userState[userId].tokenId ||
      !userState[userId].groupId
    ) {
      return bot.sendMessage(chatId, "❌ Invalid request. Please try again.");
    }

    const { tokenId, groupId } = userState[userId];

    try {
      // Find the group in the database
      const group = await Group.findOne({ groupId });

      if (!group) return bot.sendMessage(chatId, "❌ Group not found.");

      // Check if the token exists in the group
      const tokenIndex = group.tokens.findIndex(
        (t) => t.token.toString() === tokenId
      );

      if (tokenIndex === -1) {
        return bot.sendMessage(chatId, "❌ Token not found in this group.");
      }

      // Remove the token from the group's token list
      group.tokens.splice(tokenIndex, 1);
      await group.save();

      // Send confirmation message
      bot.sendMessage(
        chatId,
        `✅ Token has been successfully removed from *${group.title}*.`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Go back to Tokens List",
                  callback_data: `change_token_${groupId}`,
                },
              ],
              [{ text: "❌ Cancel", callback_data: "cancel_home" }],
            ],
          },
        }
      );

      // Update the settings message dynamically
      // await updateTokenSettingsMessage(chatId, messageId, tokenId, groupId);
    } catch (error) {
      console.error("Error deleting token:", error);
      bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  } else if (data === "cancel") {
    bot.sendMessage(chatId, "❌ Action cancelled.");
  } else if (data === "cancel_home") {
    delete userState[userId];

    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "➕ Add a Token / Change Token Settings",
              callback_data: "add_token/change_setting",
            },
          ],
        ],
      },
    };

    await bot.sendMessage(
      chatId,
      "Welcome to Laddu Buy Bot! 🚀\n\nSelect an option below:"
    );
    await bot.sendMessage(chatId, "🔹 Choose an action:", inlineKeyboard);
  }

  bot.answerCallbackQuery(callbackQuery.id);
});

module.exports = { userState, SUPPORTED_CHAINS };
