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
        minBuyValue: { type: Number, default: 50 }, // Notify only if buy is above this value
        buyAlerts: { type: Boolean, default: true }, // Enable buy alerts
        sellAlerts: { type: Boolean, default: true }, // Enable sell alerts
        priceTracking: { type: Boolean, default: false }, // Track token price
        media: { type: String, default: "" }, // Store media URL here
        emoji: { type: String, default: "⭐" }, // Store emoji here
        stepSize: { type: Number, default: 50 }, // Store step size here
      },
    },
  ],

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Group", groupSchema);
