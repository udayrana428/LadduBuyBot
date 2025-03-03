// const SockJS = require("sockjs-client");
// const {
//   processFinalTransaction,
// } = require("../controllers/transactionController");

// const POWDEX_WS_URL = "https://powtools.io/ws/topic/tokenBuySell/";

// let sock = null;

// function connectWebSocket() {
//   console.log("🔌 Attempting to connect to Powtools WebSocket...");

//   sock = new SockJS(POWDEX_WS_URL);

//   sock.onopen = function () {
//     console.log("✅ WebSocket Connected to Powtools!");
//   };

//   sock.onmessage = function (event) {
//     try {
//       const data = JSON.parse(event.data);

//       console.log("🔹 Received Event:", data);

//       // 🔹 Ensure this is a transaction event
//       if (data.txHash && data.tokenAddress && data.amount) {
//         processFinalTransaction(data); // Send for processing
//       } else {
//         console.log("⚠️ Ignoring non-transaction event");
//       }
//     } catch (error) {
//       console.error("❌ Error parsing event:", error);
//     }
//   };

//   sock.onclose = function () {
//     console.log("🔴 WebSocket Disconnected! Reconnecting...");
//     setTimeout(connectWebSocket, 5000); // Auto-reconnect
//   };
// }

// module.exports = { connectWebSocket };

const SockJS = require("sockjs-client");
const { Client } = require("@stomp/stompjs");
const {
  processFinalTransaction,
} = require("../controllers/transactionController");

// WebSocket URL for PowTools
const POWTOOLS_WS_URL = "https://powtools.io/ws";

// Token-specific subscription
const SPECIFIC_TOKEN_TOPIC =
  "/topic/tokenBuySell/0xBBfCAB3e1a4Aba7C1624a93430AD2467C38f9BBB";

// Subscription for all tokens
const ALL_TOKENS_TOPIC = "/topic/tokenBuySellForTG";

let stompClient = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;

function connectWebSocket() {
  console.log("🔌 Attempting to connect to Powtools WebSocket...");

  try {
    const socket = new SockJS(POWTOOLS_WS_URL); // SockJS WebSocket Connection
    stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (msg) => console.log("🔹 STOMP Debug:", msg),

      reconnectDelay: RECONNECT_DELAY, // Auto-reconnect delay
      onConnect: () => {
        console.log("✅ WebSocket Connected to Powtools!");
        reconnectAttempts = 0;

        // ✅ Subscribe to a specific token's transactions
        // subscribeToTopic(SPECIFIC_TOKEN_TOPIC);

        // ✅ Subscribe to transactions for all tokens
        subscribeToTopic(ALL_TOKENS_TOPIC);
      },

      onStompError: (error) => {
        console.error("❌ STOMP Error:", error);
      },

      onDisconnect: () => {
        console.log("🔴 WebSocket Disconnected!");

        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          console.log(
            `Attempting to reconnect... (${
              reconnectAttempts + 1
            }/${MAX_RECONNECT_ATTEMPTS})`
          );
          setTimeout(connectWebSocket, RECONNECT_DELAY);
          reconnectAttempts++;
        } else {
          console.error(
            "❌ Max reconnection attempts reached. Please check the connection manually."
          );
        }
      },
    });

    stompClient.activate(); // Start STOMP Client
  } catch (error) {
    console.error("❌ Error establishing WebSocket connection:", error);
  }
}

// Function to subscribe to a topic
function subscribeToTopic(topic) {
  stompClient.subscribe(topic, (message) => {
    try {
      const data = JSON.parse(message.body);
      console.log(`🔹 Received Trade Event from ${topic}:`, data);

      // Validate transaction data
      if (isValidTransaction(data)) {
        const transaction = {
          txHash: data.transactionHash,
          tokenName: data.tokenName,
          tokenAddress: data.tokenAddress,
          amountOfToken: data.amountOfToken,
          amountOfEthW: data.amountOfEthW,
          tokenPriceInUsd: data.tokenPriceInUsd,
          type: data.tradeType, // 'buy' or 'sell'
          maker: data.maker,
          timestamp: data.date,
          marketCap: data.marketCap,
        };

        processFinalTransaction(transaction);
      } else {
        console.log(`⚠️ Invalid transaction data received from ${topic}`);
      }
    } catch (error) {
      console.error(`❌ Error processing message from ${topic}:`, error);
    }
  });
}

// Validate transaction data
function isValidTransaction(data) {
  return (
    data &&
    typeof data === "object" &&
    typeof data.transactionHash === "string" &&
    typeof data.tokenAddress === "string" &&
    typeof data.amountOfToken === "number" &&
    typeof data.amountOfEthW === "number" &&
    typeof data.tokenPriceInUsd === "string" &&
    typeof data.tokenPriceInEth === "string" &&
    typeof data.maker === "string" &&
    typeof data.tokenName === "string" &&
    typeof data.marketCap === "number" &&
    ["BUY", "SELL"].includes(data.tradeType)
  );
}

module.exports = { connectWebSocket };
