const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  groupId: { type: Number, required: true, unique: true }, // Telegram group ID
  title: { type: String, required: true }, // Group name
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Group creator (Admin)

  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users who can modify settings
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Regular users (read-only)

  tokens: [
    {
      token: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Token",
        required: true,
      },
      settings: {
        minBuyValue: { type: Number, default: 0 }, // Notify only if buy is above this value
        buyAlerts: { type: Boolean, default: true }, // Enable buy alerts
        sellAlerts: { type: Boolean, default: true }, // Enable sell alerts
        priceTracking: { type: Boolean, default: false }, // Track token price
      },
    },
  ],

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Group", groupSchema);
