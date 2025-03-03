const bot = require("../bot/bot"); // Assuming this is your bot instance
const Group = require("../models/Group");

// Define blockchain explorers for different chains
const explorers = {
  ethw: {
    explorer: "https://www.oklink.com/ethw",
    chart: "https://powtools.io/pairexplorer",
  },
  eth: {
    explorer: "https://etherscan.io",
    chart: "https://dexscreener.com/ethereum",
  },
  bsc: {
    explorer: "https://bscscan.com",
    chart: "https://dexscreener.com/bsc",
  },
};

function sendTelegramNotification(groupId, transaction, tokenData) {
  const chain = transaction.chain.toLowerCase(); // Ensure lowercase chain name
  const explorer = explorers[chain] || explorers["ethw"]; // Default to ETHW if not found

  const shortTxHash = transaction.txHash
    ? `${transaction.txHash.slice(0, 6)}..${transaction.txHash.slice(-4)}`
    : "N/A";

  const shortMaker = transaction.maker
    ? `${transaction.maker.slice(0, 6)}..${transaction.maker.slice(-4)}`
    : "Unknown";

  const message = `
🚀 *${transaction.tokenName} ${transaction.tradeType.toUpperCase()}!*  

🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢  

⚽ *$${formatCurrency(
    transaction.tokenPriceInUsd * transaction.amountOfToken
  )}* (${transaction.amountOfEthW} ETH)  
🎾 *${formatAmount(transaction.amountOfToken)}* ${tokenData.symbol}  
🥏 *Maker:* [${shortMaker}](${explorer.explorer}/address/${
    transaction.maker
  }) 🆕  

🏀 *Price:* $${transaction.tokenPriceInUsd}  
🥎 *Market Cap:* $${transaction.marketCap}  

🏈 [TX](${explorer.explorer}/tx/${transaction.txHash}) | 🪀 [Chart](${
    explorer.chart
  }/${transaction.tokenAddress}) | 🎣 [Buy](#)
  `;

  bot.sendMessage(groupId, message, { parse_mode: "Markdown" });
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

const updateTokenSettingsMessage = async (chatId, messageId, tokenId) => {
  try {
    const group = await Group.findOne({ "tokens.token": tokenId }).populate(
      "tokens.token"
    );

    if (!group) return bot.sendMessage(chatId, "❌ Group not found.");

    const tokenData = group.tokens.find(
      (t) => t.token._id.toString() === tokenId
    );
    if (!tokenData)
      return bot.sendMessage(chatId, "❌ Token settings not found.");

    const { token, settings } = tokenData;

    const settingsMessage =
      `⚙️ *Settings for ${token.name} (${token.symbol})*:\n\n` +
      `Please click on each setting to change it`;

    const options = {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `✏ Minimum Buy : ${settings.minBuyValue}`,
              callback_data: `set_minBuy_${tokenId}`,
            },
          ],
          [
            {
              text: settings.buyAlerts
                ? "🔴 Disable Buy Alerts"
                : "🟢 Enable Buy Alerts",
              callback_data: `toggle_buyAlerts_${tokenId}`,
            },
          ],
          [
            {
              text: settings.sellAlerts
                ? "🔴 Disable Sell Alerts"
                : "🟢 Enable Sell Alerts",
              callback_data: `toggle_sellAlerts_${tokenId}`,
            },
          ],
          [
            {
              text: settings.priceTracking
                ? "🔴 Disable Price Tracking"
                : "🟢 Enable Price Tracking",
              callback_data: `toggle_priceTracking_${tokenId}`,
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

module.exports = { sendTelegramNotification, updateTokenSettingsMessage };
