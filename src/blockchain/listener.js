const ethers = require("ethers");
const { sendMessage } = require("../services/telegramService");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const listenToBuys = async () => {
  console.log("Listening for buy transactions...");
  provider.on("pending", async (txHash) => {
    try {
      const tx = await provider.getTransaction(txHash);
      if (tx && tx.to) {
        sendMessage(
          process.env.ADMIN_CHAT_ID,
          `New transaction detected: ${tx.hash}`
        );
      }
    } catch (err) {
      console.error("Error fetching transaction", err);
    }
  });
};

module.exports = { listenToBuys };
