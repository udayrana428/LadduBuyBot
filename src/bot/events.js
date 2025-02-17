const bot = require("./bot");
const { userAdminGroups } = require("./commands");
const User = require("../models/User");
const Group = require("../models/Group");

// 📌 Handle bot being added to a group
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
    try {
      const user = await User.findOne({ userId }).populate("adminGroups");

      if (!user || user.adminGroups.length === 0) {
        return bot.sendMessage(
          chatId,
          "⚠ You are not an admin in any group! Please add the bot to a group where you are an admin."
        );
      }

      // Create an inline keyboard with the user's groups
      const groupButtons = user.adminGroups.map((group) => [
        { text: group.title, callback_data: `select_group_${group.groupId}` },
      ]);

      const replyKeyboard = {
        reply_markup: {
          inline_keyboard: groupButtons.length > 0 ? groupButtons : [],
        },
      };

      bot.sendMessage(
        chatId,
        "✅ Select the group where you want to manage Bobby:",
        replyKeyboard
      );
    } catch (error) {
      console.error("Error fetching user groups:", error);
      bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  }
});

// 📌 Handle bot being removed from a group
bot.on("my_chat_member", async (msg) => {
  const chatId = msg.chat.id;

  if (
    msg.new_chat_member.status === "kicked" ||
    msg.new_chat_member.status === "left"
  ) {
    console.log(`🚨 Bot was removed from: ${chatId}`);

    try {
      const group = await Group.findOne({ groupId: chatId });

      if (!group) {
        console.log(`⚠️ No database entry found for group ${chatId}.`);
        return;
      }

      const removedGroupName = group.title;
      const adminIds = group.admins; // List of admin IDs

      // Find all admins of the removed group
      const adminUsers = await User.find({ _id: { $in: adminIds } });

      // Notify all admins
      for (let admin of adminUsers) {
        try {
          await bot.sendMessage(
            admin.userId,
            `⚠️ The bot has been removed from *${removedGroupName}*.`,
            { parse_mode: "Markdown" }
          );
        } catch (err) {
          console.error(`Failed to notify admin ${admin.userId}:`, err);
        }
      }

      // Remove the group from each admin's `adminGroups` array
      await User.updateMany(
        { _id: { $in: adminIds } },
        { $pull: { adminGroups: group._id } }
      );

      console.log(`✅ Removed group ID from all admin users' adminGroups.`);

      // Finally, delete the group from the database
      await Group.deleteOne({ groupId: chatId });

      console.log(`✅ Group ${removedGroupName} removed from database.`);
    } catch (error) {
      console.error("Error handling bot removal:", error);
    }
  }
});

// 📌 Handle users joining/leaving a group
bot.on("chat_member", async (msg) => {
  console.log("🔍 chat_member event detected:", msg);

  const chatId = msg.chat.id;
  const userId = msg.new_chat_member.user.id;
  const username =
    msg.new_chat_member.user.username || msg.new_chat_member.user.first_name;
  const userStatus = msg.new_chat_member.status;

  try {
    let group = await Group.findOne({ groupId: chatId });

    // Handle user joining
    if (userStatus === "member" || userStatus === "administrator") {
      let user = await User.findOne({ userId });

      if (!user) {
        user = new User({ userId, username });
        await user.save();
      }

      if (!group) {
        group = new Group({
          groupId: chatId,
          title: msg.chat.title,
          admins: [],
          members: [user._id], // Add the user as a member
        });
      } else if (
        !group.members.some((id) => id.toString() === user._id.toString())
      ) {
        group.members.push(user._id);
      }

      await group.save();
      console.log(
        `✅ User ${username} (${userId}) added to group ${msg.chat.title}`
      );
    }

    // Handle user leaving
    else if (userStatus === "left" || userStatus === "kicked") {
      if (group) {
        group.members = group.members.filter(
          (memberId) => memberId.toString() !== userId.toString()
        );
        await group.save();
        console.log(`❌ User ${userId} removed from group ${msg.chat.title}`);
      }
    }
  } catch (error) {
    console.error("Error handling chat_member event:", error);
  }
});
