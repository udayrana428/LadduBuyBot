const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true }, // Telegram user ID
  username: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  role: { type: String, enum: ["admin", "member"], default: "member" }, // Role in groups
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
