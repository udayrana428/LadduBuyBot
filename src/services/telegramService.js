const bot = require("../bot/bot"); // Assuming this is your bot instance

function sendTelegramNotification(groupId, transaction) {
  const message = `🚀 New ${transaction.type} Transaction!
💰 Amount: ${transaction.amount}  
🔗 Token: ${transaction.tokenAddress}  
🔍 TX Hash: ${transaction.txHash}`;

  bot.sendMessage(groupId, message);
}

module.exports = { sendTelegramNotification };
