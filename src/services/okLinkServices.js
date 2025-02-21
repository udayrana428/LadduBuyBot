const axios = require("axios");
const { fetchTokenDetails } = require("../utils");
require("dotenv").config(); // Ensure environment variables are loaded

async function checkTokenOnChain(tokenAddress, chain) {
  try {
    const response = await axios.get(
      `https://www.oklink.com/api/v5/explorer/address/address-summary?chainShortName=${chain.toLowerCase()}&address=${tokenAddress}`,
      {
        headers: {
          "Ok-Access-Key": process.env.OKLINK_API_KEY, // Correct Header
        },
      }
    );

    // Debugging: Log the full API response
    console.log("OKLink Response:", response.data);

    if (response.data.code === "0" && response.data.data.length > 0) {
      const tokenData2 = response.data.data[0];
      const tokenData = await fetchTokenDetails(
        "https://mainnet.ethereumpow.org",
        `${tokenAddress}`
      );
      console.log("Token Data:", tokenData);

      return {
        name: tokenData.name || "Unknown",
        symbol: tokenData.symbol || "UNKNOWN",
        decimals: tokenData2.decimals || 18,
      };
    }

    return false; // No data found
  } catch (error) {
    console.error("OKLink API Error:", error.response?.data || error.message);
    return false;
  }
}

// Example Usage
// checkTokenOnChain("0xBBfCAB3e1a4Aba7C1624a93430AD2467C38f9BBB", "ethw")
//   .then((data) => console.log("Token Data:", data))
//   .catch((err) => console.error(err));

module.exports = { checkTokenOnChain };
