const Transaction = require("../models/Transaction");

const Group = require("../models/Group");
const { sendTelegramNotification } = require("../services/telegramService");
const Token = require("../models/Token");

// Better Approach
async function processFinalTransaction(data) {
  const { tokenAddress, amountOfToken, tokenPriceInUsd, type, txHash } = data;
  const txnValueInUsd = amountOfToken * tokenPriceInUsd;

  // 🔍 Step 1: Find the token
  const token = await Token.findOne({ address: tokenAddress })
    .select("name symbol chain decimals address") // Ensure token details are included
    .populate("groups");

  if (!token) {
    console.log(`⚠️ Token ${tokenAddress} not found in DB.`);
    return;
  }

  // 🔍 Step 2: Get all groups tracking this token
  const groups = token.groups;

  for (const group of groups) {
    const tokenSettings = group.tokens.find(
      (t) => t.token.toString() === token._id.toString()
    );
    if (!tokenSettings) continue;

    const { minBuyValue, buyAlerts, sellAlerts } = tokenSettings.settings;

    if (
      (type === "BUY" && buyAlerts && txnValueInUsd >= minBuyValue) ||
      (type === "SELL" && sellAlerts)
    ) {
      sendTelegramNotification(group.groupId, data, token);
    }
  }
}

//For very large datasets (millions of records): Use aggregation for better performance.

// async function processFinalTransaction(data) {
//   const { tokenAddress, amount, type, txHash } = data;

//   const token = await Token.aggregate([
//     { $match: { address: tokenAddress } },
//     { $lookup: {
//         from: "groups",
//         localField: "groups",
//         foreignField: "_id",
//         as: "groupDetails"
//       }
//     }
//   ]);

//   if (!token.length) {
//     console.log(`⚠️ Token ${tokenAddress} not found in DB.`);
//     return;
//   }

//   const groups = token[0].groupDetails;

//   for (const group of groups) {
//     const tokenSettings = group.tokens.find(
//       (t) => t.token.toString() === token[0]._id.toString()
//     );
//     if (!tokenSettings) continue;

//     const { minBuyValue, buyAlerts, sellAlerts } = tokenSettings.settings;

//     if (
//       (type === "BUY" && buyAlerts && amount >= minBuyValue) ||
//       (type === "SELL" && sellAlerts)
//     ) {
//       sendTelegramNotification(group.groupId, data);
//     }
//   }
// }

const recordTransaction = async (req, res) => {
  try {
    const { token, group, txHash, buyer, amount, value, type } = req.body;

    const existingTx = await Transaction.findOne({ txHash });
    if (existingTx) {
      return res.status(400).json({ message: "Transaction already recorded." });
    }

    const transaction = new Transaction({
      token,
      group,
      txHash,
      buyer,
      amount,
      value,
      type,
    });
    await transaction.save();

    res
      .status(201)
      .json({ message: "Transaction recorded successfully", transaction });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().populate("token group");
    res.status(200).json({ transactions });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  recordTransaction,
  getTransactions,
  processFinalTransaction,
};
