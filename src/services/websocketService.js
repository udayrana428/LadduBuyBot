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

let stompClient = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;

function connectWebSocket() {
  console.log("🔌 Attempting to connect to DEX WebSocket...");

  try {
    const socket = new SockJS(POWTOOLS_WS_URL); // SockJS WebSocket Connection
    stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (msg) => console.log("🔹 STOMP Debug:", msg),

      reconnectDelay: RECONNECT_DELAY, // Auto-reconnect delay
      onConnect: () => {
        console.log("✅ WebSocket Connected to DEX!");
        reconnectAttempts = 0;

        // ✅ Subscribe to Transactions Topic
        stompClient.subscribe("/topic/tokenBuySell", (message) => {
          try {
            const data = JSON.parse(message.body);
            console.log("🔹 Received Trade Event:", data);

            // Validate transaction data
            if (isValidTransaction(data)) {
              const transaction = {
                txHash: data.hash,
                tokenAddress: data.tokenAddress,
                amount: data.amount,
                price: data.price,
                type: data.type, // 'buy' or 'sell'
                timestamp: data.timestamp,
              };

              processFinalTransaction(transaction);
            } else {
              console.log("⚠️ Invalid transaction data received");
            }
          } catch (error) {
            console.error("❌ Error processing message:", error);
          }
        });
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

// Validate transaction data
function isValidTransaction(data) {
  return (
    data &&
    typeof data === "object" &&
    typeof data.hash === "string" &&
    typeof data.tokenAddress === "string" &&
    typeof data.amount === "string" &&
    ["buy", "sell"].includes(data.type)
  );
}

module.exports = { connectWebSocket };
