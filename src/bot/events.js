const bot = require("./bot");
const { userAdminGroups } = require("./commands");
const User = require("../models/User");
const Group = require("../models/Group");
const { SUPPORTED_CHAINS, userState } = require("./callbacks");
const { checkTokenOnChain } = require("../services/okLinkServices");
const Token = require("../models/Token");
const {
  updateTokenSettingsMessage,
  sendTokenSettingsMessage,
} = require("../services/telegramService");
const { uploadToCloudinary } = require("../services/cloudinaryServices");

// 📌 Handle bot being added to a group
bot.on("message", async (msg) => {
  // console.log("message event triggered", msg);
  // console.log(bot);
  if (msg.new_chat_member && msg.new_chat_member.id === bot.botInfo?.id) {
    bot.sendMessage(
      msg.chat.id,
      "🚀 Thank you for adding me to your group! To function properly, please make me an admin. Once done, use /start to begin."
    );
  }

  // Check if the message contains chat_shared
  if (msg.chat_shared && msg.chat_shared.chat_id) {
    const groupId = msg.chat_shared.chat_id; // Extract shared group ID
    const chatId = msg.chat.id; // User who shared the group
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;

    try {
      let user = await User.findOne({ userId });
      if (!user) {
        user = new User({
          userId,
          username,
          firstName: msg.from.first_name,
          lastName: msg.from.last_name || "",
          adminGroups: [],
        });
        await user.save();
      }

      let group = await Group.findOne({ groupId });

      if (!group) {
        // Fetch group details from Telegram
        const groupInfo = await bot.getChat(groupId);
        const admins = await bot.getChatAdministrators(groupId);
        const isUserAdmin = admins.some((admin) => admin.user.id === userId);
        const isBotAdmin = admins.some(
          (admin) => admin.user.id === bot.botInfo.id
        );

        if (!isBotAdmin) {
          return bot.sendMessage(
            chatId,
            "⚠️ I need to be an admin in the shared group to function properly. Please grant me admin permissions."
          );
        }

        // Create a new group entry
        group = new Group({
          groupId,
          title: groupInfo.title,
          owner: isUserAdmin ? user._id : null,
          admins: isUserAdmin ? [user._id] : [],
          members: !isUserAdmin ? [user._id] : [],
        });
        await group.save();

        bot.sendMessage(
          chatId,
          `✅ *${groupInfo.title}* has been registered successfully! ${
            isUserAdmin ? "You have admin rights." : "You are a member."
          }`,
          { parse_mode: "Markdown" }
        );
      } else {
        // Update existing group details
        const admins = await bot.getChatAdministrators(groupId);
        const isUserAdmin = admins.some((admin) => admin.user.id === userId);

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

      // Update user's adminGroups
      if (group.admins.includes(user._id)) {
        if (!Array.isArray(user.adminGroups)) {
          user.adminGroups = [];
        }
        if (!user.adminGroups.includes(group._id.toString())) {
          user.adminGroups.push(group._id);
          await user.save();
        }
      }

      //       const imgageUrl =
      //         "https://res.cloudinary.com/dbtsrjssc/image/upload/v1740042844/VRCPlastoMould/career-img-removebg-preview_ppwopt.webp";

      //       const message = `
      // 🚀 *Ethereum (ETH) BUY*

      // 📌 **Transaction Details:**
      // 💰 *Amount (USD):* $1,250 (5.2 ETHW)
      // 🔹 *Token Amount:* 3.5 ETH
      // 🛠 *Maker:* [0xA1B2..F3E4](https://explorer.ethw/0xA1B2F3E4)

      // 📊 **Market Insights:**
      // 💲 *Price per ETH:* $357.14
      // 🏦 *Market Cap:* $420M

      // 🔗 **Quick Links:**
      // 🔍 [Transaction](https://explorer.ethw/tx/0x1234ABCD5678) | 📈 [Chart](https://chart.ethw/0xETH1234) | 🛒 [Buy Now](https://dex.ethw)
      // `;

      //       bot.sendPhoto(chatId, imgageUrl, {
      //         caption: message,
      //         parse_mode: "Markdown",
      //         disable_web_page_preview: true,
      //       });

      // Send inline keyboard for group actions
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
      console.error("Error processing shared group:", error);
      bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
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
          `⚠ *You are not an admin in any group!* Please follow these steps to add the bot as an admin:
        
        1️⃣ *Add the Bot to a Group:*
           - Open Telegram and go to your group.
           - Tap the group name at the top.
           - Select *"Add Members"* and search for *@${bot.botInfo.username}*.
           - Click *"Add to Group"*.
        
        2️⃣ *Promote the Bot to Admin:*
           - Open group settings and go to *"Administrators"*.
           - Tap *"Add Admin"* and select *@${bot.botInfo.username}*.
           - Enable necessary permissions (*Manage Chat, Delete Messages, Ban Users*).
           - Tap *Save*.
        
        ✅ Done! The bot will now start managing the group.
        
        If you need further help, reach out to support!`,
          { parse_mode: "Markdown" }
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
        "✅ Select the group where you want to manage Laddu:",
        replyKeyboard
      );
    } catch (error) {
      console.error("Error fetching user groups:", error);
      bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  }

  // FOR ADDING THE TOKEN ADDRESS
  const text = msg.text;

  if (SUPPORTED_CHAINS.includes(text) && userState[userId]?.groupId) {
    userState[userId].chain = text;

    bot.sendMessage(
      chatId,
      `🔹 Now, please paste the token address for *${text}* chain:`,
      {
        reply_markup: {
          force_reply: true,
          input_field_placeholder: "Paste token address here...",
        },
      }
    );
  } else if (userState[userId]?.chain) {
    const tokenAddress = text.trim();
    const { groupId, chain } = userState[userId];

    bot.sendMessage(chatId, "🔍 Fetching details, please wait...");

    try {
      const tokenExists = await checkTokenOnChain(tokenAddress, chain);

      if (!tokenExists) {
        return bot.sendMessage(
          chatId,
          "❌ Invalid token address or token not found on the selected chain. Please try again."
        );
      }

      // Check if the token already exists in the database
      let token = await Token.findOne({ address: tokenAddress, chain });

      if (!token) {
        // Save new token
        token = new Token({
          address: tokenAddress,
          name: tokenExists.name,
          symbol: tokenExists.symbol,
          chain,
          decimals: tokenExists.decimals,
        });
        await token.save();
      }

      const group = await Group.findOne({ groupId }).select("_id tokens"); // ✅ Get the MongoDB `_id`
      if (!group) {
        return bot.sendMessage(chatId, "❌ Group not found in the database.");
      }

      // Add token to group
      // Check if the token already exists in the group
      // const tokenExistsInGroup = group.tokens.some(
      //   (t) => t.token.toString() === token._id.toString()
      // );

      console.log("Groups Tokens: ", group.tokens);

      const tokenExistsInGroup =
        group.tokens?.some(
          (t) => t.token.toString() === token._id.toString()
        ) || false;

      if (!tokenExistsInGroup) {
        // Only add token if it does not already exist
        await Group.findOneAndUpdate(
          { _id: group._id },
          {
            $addToSet: { tokens: { token: token._id } }, // Ensure unique token entry
          },
          { new: true, upsert: true }
        );
      } else {
        console.log(
          "⚠ Token already exists in this group. Skipping duplicate entry."
        );
        return bot.sendMessage(
          chatId,
          "⚠️ Token already exists in this group. Skipping duplicate entry.",
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "➕ Add Another Token",
                    callback_data: `new_token_${groupId}`,
                  },
                  { text: "❌ Cancel", callback_data: "cancel_home" },
                ],
              ],
            },
          }
        );
      }

      // Add group reference in token (fixing the ObjectId issue)
      await Token.findOneAndUpdate(
        { _id: token._id },
        { $addToSet: { groups: group._id } }, // ✅ Use group._id (MongoDB ObjectId)
        { new: true, upsert: true }
      );

      // Confirm token addition
      bot.sendMessage(
        chatId,
        `✅ Token added successfully!\n\n*Token Address:* \`${token.address}\`\n*Chain:* ${token.chain}`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "➕ Add Another Token",
                  callback_data: `new_token_${groupId}`,
                },
                { text: "❌ Cancel", callback_data: "cancel_home" },
              ],
            ],
          },
        }
      );
    } catch (error) {
      console.error("Error verifying token:", error);
      bot.sendMessage(
        chatId,
        "❌ Failed to verify the token. Please try again."
      );
    }

    // Clear user state after adding the token
    delete userState[userId];
  }

  // For updating the MINIMUM BUY

  if (userState[userId]?.waitingForMinBuy) {
    const minBuyValue = parseFloat(text);

    if (isNaN(minBuyValue) || minBuyValue < 1) {
      return bot.sendMessage(
        chatId,
        "❌ Invalid value. Please enter a number greater than or equal to 1."
      );
    }

    const { groupId, tokenId, messageId } = userState[userId];

    try {
      const group = await Group.findOne({
        groupId: groupId,
        "tokens.token": tokenId,
      }); // CHANGES

      if (!group) {
        return bot.sendMessage(chatId, "❌ Group or token not found.");
      }

      // Find the specific token inside the group
      const tokenData = group.tokens.find(
        (t) => t.token._id.toString() === tokenId
      );

      if (!tokenData) {
        return bot.sendMessage(chatId, "❌ Token settings not found.");
      }

      // Update only the specific token in the selected group
      await Group.updateOne(
        { groupId, "tokens.token": tokenId },
        { $set: { "tokens.$.settings.minBuyValue": minBuyValue } }
      );

      // Fetch updated settings after update
      const updatedGroup = await Group.findOne({
        groupId,
        "tokens.token": tokenId,
      }).populate("tokens.token");

      if (!updatedGroup) {
        return bot.sendMessage(
          chatId,
          "❌ Failed to fetch updated token settings."
        );
      }

      // Get updated token settings
      const updatedTokenData = updatedGroup.tokens.find(
        (t) => t.token._id.toString() === tokenId
      );
      if (!updatedTokenData) {
        return bot.sendMessage(chatId, "❌ Updated token settings not found.");
      }

      const { token, settings } = updatedTokenData;

      // Send confirmation message first
      bot
        .sendMessage(chatId, `✅ Minimum Buy Value updated to $${minBuyValue}`)
        .then(() => {
          // After sending confirmation, send the settings message
          sendTokenSettingsMessage(chatId, tokenId, groupId);
        });

      // **Update the settings message to reflect the change**
      // **Ensure messageId is correctly passed**
      // if (messageId) {
      //   await updateTokenSettingsMessage(chatId, messageId, tokenId, groupId);
      // } else {
      //   console.error("❌ messageId is missing, cannot update message.");
      // }

      // Clear state
      delete userState[userId].waitingForMinBuy;
    } catch (error) {
      console.error("Error updating token settings:", error);
      bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  }

  // For updating the EMOJI

  if (userState[userId] && userState[userId].waitingForEmoji) {
    const emoji = text;
    if (!emoji || emoji.length > 2 || emoji.length === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Invalid emoji. Please use a single emoji."
      );
    }
    const { groupId, tokenId, messageId } = userState[userId];
    try {
      await Group.updateOne(
        { groupId, "tokens.token": tokenId },
        { $set: { "tokens.$.settings.emoji": emoji } }
      );
      bot.sendMessage(chatId, `✅ Emoji updated to ${emoji}`);
      // await updateTokenSettingsMessage(chatId, messageId, tokenId, groupId);
      sendTokenSettingsMessage(chatId, tokenId, groupId);
      delete userState[userId].waitingForEmoji;
    } catch (error) {
      console.error("Error updating token settings:", error);
      bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  }

  //For updating the STEPSIZE

  if (userState[userId] && userState[userId].waitingForStepSize) {
    const stepSize = parseFloat(text);
    if (isNaN(stepSize) || stepSize <= 0)
      return bot.sendMessage(
        chatId,
        "❌ Invalid number. Please enter a positive number."
      );
    const { groupId, tokenId, messageId } = userState[userId];

    try {
      await Group.updateOne(
        { groupId, "tokens.token": tokenId },
        { $set: { "tokens.$.settings.stepSize": stepSize } }
      );
      bot.sendMessage(chatId, `✅ Step size updated to ${stepSize}`);
      // await updateTokenSettingsMessage(chatId, messageId, tokenId, groupId);
      sendTokenSettingsMessage(chatId, tokenId, groupId);
      delete userState[userId].waitingForStepSize;
    } catch (error) {
      console.error("Error updating token settings:", error);
      bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  }

  // FOR UPLOADING THE MEDIA

  if (userState[userId] && userState[userId].waitingForMedia) {
    delete userState[userId].waitingForMedia; // Reset state

    const { tokenId, groupId } = userState[userId];

    try {
      let fileId;

      if (msg.photo) {
        fileId = msg.photo[msg.photo.length - 1].file_id; // Get the highest resolution photo
      } else if (msg.video) {
        fileId = msg.video.file_id;
      } else if (msg.animation) {
        fileId = msg.animation.file_id; // GIFs are treated as animations
      } else {
        return bot.sendMessage(
          chatId,
          "❌ Please send a valid image, GIF, or video."
        );
      }

      // Get file path from Telegram API
      const file = await bot.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

      // Upload file to Cloudinary (or store Telegram URL if using direct linking)
      // console.log("before uploading to cloudinary");
      const uploadedUrl = await uploadToCloudinary(fileUrl);
      // console.log("after uploading to cloudinary");

      // Update database
      await Group.findOneAndUpdate(
        { groupId, "tokens.token": tokenId },
        { $set: { "tokens.$.settings.media": uploadedUrl } }
      );

      bot.sendMessage(chatId, "✅ Media has been successfully updated!");

      // Update UI
      // await updateTokenSettingsMessage(
      //   chatId,
      //   userState[userId].messageId,
      //   tokenId,
      //   groupId
      // );
      sendTokenSettingsMessage(chatId, tokenId, groupId);
    } catch (error) {
      console.error("Error handling media:", error);
      bot.sendMessage(chatId, "❌ Failed to upload media. Please try again.");
    }
  }
});

bot.on("my_chat_member", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.new_chat_member.user.id; // User who is promoted

  // 📌 Handle bot being removed from a group
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
  console.log("chat_member event triggered");

  const userId = msg.new_chat_member.user.id;
  const chatId = msg.chat.id;
  const newStatus = msg.new_chat_member.status;
  const oldStatus = msg.old_chat_member ? msg.old_chat_member.status : null;

  console.log(
    `User ${userId} status changed from ${oldStatus} to ${newStatus}`
  );

  try {
    // Find or create the user
    let user = await User.findOne({ userId });

    if (!user) {
      user = new User({
        userId,
        username:
          msg.new_chat_member.user.username ||
          msg.new_chat_member.user.first_name,
        firstName: msg.new_chat_member.user.first_name,
        lastName: msg.new_chat_member.user.last_name || "",
        adminGroups: [],
      });
      await user.save();
      console.log(`✅ New user created: ${userId}`);
    }

    // Find the group
    let group = await Group.findOne({ groupId: chatId });

    if (!group) {
      console.log(`⚠️ No group found with ID: ${chatId}`);
      return;
    }

    if (newStatus === "member" || newStatus === "administrator") {
      // ✅ ADD MEMBER TO GROUP
      if (!group.members.includes(user._id)) {
        group.members.push(user._id);
        await group.save();
        console.log(`✅ User ${userId} added as a member in group ${chatId}`);
      }
    }

    if (newStatus === "administrator") {
      // ✅ PROMOTED TO ADMIN
      if (!group.admins.includes(user._id)) {
        group.admins.push(user._id);
      }

      // Remove from members if present
      group.members = group.members.filter(
        (memberId) => memberId.toString() !== user._id.toString()
      );

      if (!user.adminGroups.includes(group._id.toString())) {
        user.adminGroups.push(group._id);
      }

      await group.save();
      await user.save();

      console.log(`✅ User ${userId} promoted to admin in group ${chatId}`);
    } else if (oldStatus === "administrator" && newStatus === "member") {
      // ❌ DEMOTED FROM ADMIN TO MEMBER
      group.admins = group.admins.filter(
        (adminId) => adminId.toString() !== user._id.toString()
      );

      // Add to members if not already present
      if (!group.members.includes(user._id)) {
        group.members.push(user._id);
      }

      // Remove group from user's adminGroups
      user.adminGroups = user.adminGroups.filter(
        (groupId) => groupId.toString() !== group._id.toString()
      );

      await group.save();
      await user.save();

      console.log(`❌ User ${userId} demoted to member in group ${chatId}`);
    } else if (newStatus === "left" || newStatus === "kicked") {
      // ❌ REMOVE USER FROM GROUP
      group.members = group.members.filter(
        (memberId) => memberId.toString() !== user._id.toString()
      );

      group.admins = group.admins.filter(
        (adminId) => adminId.toString() !== user._id.toString()
      );

      // Remove group from user's adminGroups
      user.adminGroups = user.adminGroups.filter(
        (groupId) => groupId.toString() !== group._id.toString()
      );

      await group.save();
      await user.save();

      console.log(`❌ User ${userId} removed from group ${chatId}`);
    }
  } catch (error) {
    console.error("Error updating user roles:", error);
  }
});
