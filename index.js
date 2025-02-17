require("dotenv").config();
const express = require("express");
const mongoose = require("./src/database/db");
const { startBot } = require("./src/bot");
// const { listenToBuys } = require("./src/blockchain/listener");
const routes = require("./src/routes/index");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use("/api", routes);

// Start Telegram Bot
startBot();

// Start Blockchain Listener
// listenToBuys();

app.get("/", (req, res) => {
  res.send("Telegram DEX Bot is running 🚀");
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
