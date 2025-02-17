const mongoose = require("mongoose");

const botSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // Example: "max_groups_per_user"
  value: { type: mongoose.Schema.Types.Mixed, required: true }, // Can be string, number, boolean, etc.
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BotSettings", botSettingsSchema);
