const bot = require("../bot/bot"); // Assuming this is your bot instance
const { userState } = require("../bot/callbacks");
const Group = require("../models/Group");

// Define blockchain explorers for different chains
const explorers = {
  ethw: {
    explorer: "https://www.oklink.com/ethw",
    chart: "https://powtools.io/pairexplorer",
    dex: "https://powdex.io/swap",
  },
  eth: {
    explorer: "https://etherscan.io",
    chart: "https://dexscreener.com/ethereum",
    dex: "https://app.uniswap.org/swap",
  },
  bsc: {
    explorer: "https://bscscan.com",
    chart: "https://dexscreener.com/bsc",
    dex: "https://pancakeswap.finance/",
  },
};

function sendTelegramNotification(
  groupId,
  transaction,
  tokenData,
  tokenSettings
) {
  const chain = tokenData.chain.toLowerCase(); // Ensure lowercase chain name
  const explorer = explorers[chain] || explorers["ethw"]; // Default to ETHW if not found

  const shortTxHash = transaction.txHash
    ? `${transaction.txHash.slice(0, 6)}..${transaction.txHash.slice(-4)}`
    : "N/A";

  const shortMaker = transaction.maker
    ? `${transaction.maker.slice(0, 6)}..${transaction.maker.slice(-4)}`
    : "Unknown";

  const totalAmountUSD = formatCurrency(
    transaction.tokenPriceInUsd * transaction.amountOfToken
  );

  const displayEmojis = generateEmojiNotification(
    totalAmountUSD,
    tokenSettings
  );

  //   const message = `
  // 🚀 *${transaction.tokenName} ${transaction.type.toUpperCase()}!*

  // 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢

  // ⚽ *${formatCurrency(
  //     transaction.tokenPriceInUsd * transaction.amountOfToken
  //   )}* (${transaction.amountOfEthW} ETHW)
  // 🎾 *${formatAmount(transaction.amountOfToken)}* ${tokenData.symbol}
  // 🥏 *Maker:* [${shortMaker}](${explorer.explorer}/address/${
  //     transaction.maker
  //   }) 🆕

  // 🏀 *Price:* $${transaction.tokenPriceInUsd}
  // 🥎 *Market Cap:* $${transaction.marketCap}

  // 🏈 [TX](${explorer.explorer}/tx/${transaction.txHash}) | 🪀 [Chart](${
  //     explorer.chart
  //   }/${transaction.tokenAddress}) | 🎣 [Buy](${explorer.dex})
  //   `;

  const message = `
🚀 *${transaction.tokenName} ${transaction.type.toUpperCase()}*  

${displayEmojis}

📌 **Transaction Details:**  
💰 *Amount (USD):* ${formatCurrency(
    transaction.tokenPriceInUsd * transaction.amountOfToken
  )} (${transaction.amountOfEthW} ETHW)  
🔹 *Token Amount:* ${formatAmount(transaction.amountOfToken)} ${
    tokenData.symbol
  }  
🛠 *Maker:* [${shortMaker}](${explorer.explorer}/address/${transaction.maker})  

📊 **Market Insights:**  
💲 *Price per ${tokenData.symbol}:* $${transaction.tokenPriceInUsd}  
🏦 *Market Cap:* $${transaction.marketCap}  

🔗 **Quick Links:**  
🔍 [Transaction](${explorer.explorer}/tx/${transaction.txHash}) | 📈 [Chart](${
    explorer.chart
  }/${transaction.tokenAddress}) | 🛒 [Buy Now](${explorer.dex})  
`;

  // bot.sendMessage(groupId, message, {
  //   parse_mode: "Markdown",
  //   disable_web_page_preview: true,
  // });

  const imgageUrl = tokenSettings.media ? tokenSettings.media : "";
  bot.sendPhoto(groupId, imgageUrl, {
    caption: message,
    parse_mode: "Markdown",
    disable_web_page_preview: true,
  });
}

// Helper function to format currency values
function formatCurrency(value) {
  return `$${parseFloat(value).toFixed(2)}`;
}

// Helper function to format token amounts
function formatAmount(amount) {
  if (parseFloat(amount) >= 1e6) {
    return `${(parseFloat(amount) / 1e6).toFixed(2)}M`;
  }
  return parseFloat(amount).toFixed(2);
}

function generateEmojiNotification(transactionAmount, groupSettings) {
  const { stepSize = 50, emoji = "💀" } = groupSettings;

  if (!emoji) {
    return ""; // No emoji if below step size
  }

  // Calculate the number of emojis based on step size
  const emojiCount = Math.ceil(transactionAmount / stepSize);

  // Generate the emoji string
  return emoji.repeat(emojiCount);
}

const updateTokenSettingsMessage = async (
  chatId,
  messageId,
  tokenId,
  groupId
) => {
  try {
    const group = await Group.findOne({ groupId }).populate("tokens.token");

    if (!group)
      return bot.sendMessage(
        chatId,
        "❌ Group not found in updateTokenSettingsMessage."
      );

    const tokenData = group.tokens.find(
      (t) => t.token._id.toString() === tokenId
    );
    if (!tokenData)
      return bot.sendMessage(chatId, "❌ Token settings not found.");

    const { token, settings } = tokenData;

    const settingsMessage =
      `⚙️ *Settings for ${token.name} (${token.symbol}) in ${group.title}*:\n\n` +
      `Please click on each setting to change it`;

    const options = {
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
              text: `😊 Emoji : ${settings.emoji}`,
              callback_data: `set_emoji`,
            },
          ],
          [
            {
              text: `🔁 Step : ${settings.stepSize}`,
              callback_data: `set_stepSize`,
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
              callback_data: `confirm_delete_token_${tokenId}_${groupId}`,
            },
          ],
          [{ text: "❌ Cancel", callback_data: "cancel_home" }],
        ],
      },
    };

    // **Edit the existing message** instead of sending a new one
    await bot.editMessageText(settingsMessage, {
      chat_id: chatId,
      message_id: messageId,
      ...options,
    });
  } catch (error) {
    console.error("Error updating token settings message:", error);
    bot.sendMessage(
      chatId,
      "❌ An error occurred while updating the settings."
    );
  }
};

async function sendTokenSettingsMessage(chatId, tokenId, groupId) {
  try {
    const group = await Group.findOne({
      groupId,
      "tokens.token": tokenId,
    }).populate("tokens.token");
    if (!group) {
      return bot.sendMessage(chatId, "❌ Group or token not found.");
    }

    const tokenData = group.tokens.find(
      (t) => t.token._id.toString() === tokenId
    );
    if (!tokenData) {
      return bot.sendMessage(chatId, "❌ Token settings not found.");
    }

    const { token, settings } = tokenData;
    bot.sendMessage(
      chatId,
      `⚙️ *Settings for ${token.name} (${token.symbol}) in ${group.title}*:\n\n` +
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
                text: `😊 Emoji : ${settings.emoji}`,
                callback_data: `set_emoji`,
              },
            ],
            [
              {
                text: `🔁 Step : ${settings.stepSize}`,
                callback_data: `set_stepSize`,
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
                callback_data: `confirm_delete_token_${tokenId}_${groupId}`,
              },
            ],
            [{ text: "❌ Cancel", callback_data: "cancel_home" }],
          ],
        },
      }
    );
  } catch (error) {
    console.error("Error sending token settings message:", error);
    bot.sendMessage(
      chatId,
      "❌ An error occurred while fetching token settings."
    );
  }
}

module.exports = {
  sendTelegramNotification,
  updateTokenSettingsMessage,
  sendTokenSettingsMessage,
};
