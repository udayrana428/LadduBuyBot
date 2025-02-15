module.exports = {
  welcomePrivate: (name) =>
    `Hello ${name}! 👋\nWelcome to the DEX Telegram Bot.\n\nUse /help to see available commands.`,

  welcomeGroup: (groupName) =>
    `Hello everyone in *${groupName}*! 🚀\nI'm here to monitor token buys and provide analytics.\nUse /help to see available commands.`,

  helpMessage: `📌 *Available Commands:*\n
    /start - Start the bot\n
    /help - Get the list of commands\n
    /track [token_address] - Track a token's buys\n
    /untrack [token_address] - Stop tracking a token\n
    /settings - Customize bot preferences\n
    /stats - Get recent buy statistics`,

  tokenTrackSuccess: (token) =>
    `✅ Successfully started tracking *${token}*. I will notify you of all major buys!`,

  tokenUntrackSuccess: (token) =>
    `🛑 Stopped tracking *${token}*. You will no longer receive updates.`,

  noPermission: `🚫 You don't have permission to use this command.`,

  invalidCommand: `⚠️ Invalid command. Use /help to see available commands.`,

  settingsUpdated: `✅ Your settings have been updated successfully!`,

  buyAlert: (token, amount, buyer) =>
    `🔥 *New Buy Alert!*\n\n💰 *Token:* ${token}\n📈 *Amount:* ${amount} ETH\n👤 *Buyer:* ${buyer}`,
};
