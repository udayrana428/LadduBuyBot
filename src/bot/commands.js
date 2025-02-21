const bot = require("./bot");
const mongoose = require("mongoose");
const Group = require("../models/Group"); // Group model
const User = require("../models/User"); // User model

const userAdminGroups = new Map(); // Stores user-admin groups

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name; // Get username or first name

  try {
    // Check if the user exists in the database
    let user = await User.findOne({ userId: userId });

    if (!user) {
      user = new User({
        userId,
        username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name || "",
        adminGroups: [], // Ensure this field exists
      });
      await user.save();
    }

    if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
      // Group Handling
      const admins = await bot.getChatAdministrators(chatId);
      const isUserAdmin = admins.some((admin) => admin.user.id === userId);
      const isBotAdmin = admins.some(
        (admin) => admin.user.id === bot.botInfo.id
      );

      if (!isBotAdmin) {
        return bot.sendMessage(
          chatId,
          "⚠️ I need to be an admin to function properly. Please grant me admin permissions."
        );
      }

      let group = await Group.findOne({ groupId: chatId });

      if (!group) {
        // If group doesn't exist, create it
        group = new Group({
          groupId: chatId,
          title: msg.chat.title,
          owner: isUserAdmin ? user._id : null, // Set owner only if the user is an admin
          admins: isUserAdmin ? [user._id] : [],
          members: !isUserAdmin ? [user._id] : [],
        });
        await group.save();
        bot.sendMessage(
          chatId,
          `✅ Bot is now active in this group. ${
            isUserAdmin ? "You have admin rights." : "You are a member."
          }`
        );
        bot.sendMessage(
          userId,
          `✅ Bot has been successfully added to *${msg.chat.title}* and is now active. Use /start to begin.`,
          { parse_mode: "Markdown" }
        );
      } else {
        // If group exists, update user role
        if (isUserAdmin && !group.admins.includes(user._id)) {
          group.admins.push(user._id);
          await group.save();
          bot.sendMessage(chatId, `✅ ${username}, you are now an admin.`);
        } else if (!isUserAdmin && !group.members.includes(user._id)) {
          group.members.push(user._id);
          await group.save();
          bot.sendMessage(
            chatId,
            `✅ ${username}, you have been added as a member.`
          );
        }
      }

      // ✅ Ensure user's `adminGroups` field is updated without duplicates
      if (isUserAdmin) {
        if (!Array.isArray(user.adminGroups)) {
          user.adminGroups = [];
        }
        const existingAdminGroups = user.adminGroups.map((id) => id.toString());
        if (!existingAdminGroups.includes(group._id.toString())) {
          user.adminGroups.push(group._id);
          await user.save();
        }
      }
    } else {
      // Private Chat Handling
      const inlineKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "➕ Add a Token / Change Token Settings",
                callback_data: "add_token",
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

      // ✅ Check if the user is an admin in any groups
      const adminGroups = await Group.find({ admins: user._id });

      if (adminGroups.length > 0) {
        const groupIds = adminGroups.map((group) => group._id.toString());

        if (!Array.isArray(user.adminGroups)) {
          user.adminGroups = [];
        }
        const existingAdminGroups = user.adminGroups.map((id) => id.toString());
        const newAdminGroups = groupIds.filter(
          (id) => !existingAdminGroups.includes(id)
        );

        if (newAdminGroups.length > 0) {
          user.adminGroups.push(...newAdminGroups);
          await user.save();
        }
      }
    }
  } catch (error) {
    console.error("Error handling /start:", error);
  }
});

module.exports = { userAdminGroups };
