const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  token: { type: mongoose.Schema.Types.ObjectId, ref: "Token", required: true }, // Associated token
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true }, // Group that receives this notification

  txHash: { type: String, required: true, unique: true }, // Blockchain transaction hash
  buyer: { type: String, required: true }, // Wallet address of the buyer
  amount: { type: Number, required: true }, // Token amount purchased
  value: { type: Number, required: true }, // Value in USD
  type: { type: String, enum: ["buy", "sell"], required: true }, // Buy or Sell
  timestamp: { type: Date, default: Date.now }, // Transaction time
});

module.exports = mongoose.model("Transaction", transactionSchema);
