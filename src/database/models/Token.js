const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true }, // Token contract address
  name: { type: String, required: true }, // Token name
  symbol: { type: String, required: true }, // Token symbol
  chain: {
    type: String,
    enum: ["Eth", "Bsc", "Polygon", "Avax", "Arb", "Base", "Tron", "Unichain"],
    required: true,
  },
  decimals: { type: Number, default: 18 }, // Token decimals
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Token", tokenSchema);
