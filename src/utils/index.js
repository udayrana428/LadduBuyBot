const { ethers } = require("ethers");

async function fetchTokenDetails(rpcUrl, tokenAddress) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const abi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
  ];

  const contract = new ethers.Contract(tokenAddress, abi, provider);

  const [name, symbol, decimals] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.decimals(),
  ]);

  return { name, symbol, decimals };
}

// Example usage:
// fetchTokenDetails("https://mainnet.ethereumpow.org", "0xbbfcab3e1a4aba7c1624a93430ad2467c38f9bbb")
//   .then(console.log)
//   .catch(console.error);

module.exports = { fetchTokenDetails };
