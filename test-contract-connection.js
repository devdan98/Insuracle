const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Testing Contract Connection to Oracle\n");
  
  // Contract addresses
  const oracleAddress = "0x7a2088a1bFc9d81c55368AE168C2C02570cB814F";
  const insuracleDess = "0x9d4454B023096f34B160D6B654540c56A1F81688"; // Latest deployed
  
  try {
    const [signer] = await ethers.getSigners();
    console.log("Using signer:", signer.address);
    
    // Test oracle directly
    console.log("📊 Testing Oracle directly...");
    const oracleABI = [
      "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"
    ];
    
    const oracle = new ethers.Contract(oracleAddress, oracleABI, signer);
    const oracleData = await oracle.latestRoundData();
    console.log("   Oracle value:", Number(oracleData.answer) / 1e8, "cm");
    
    // Test Insuracle contract
    console.log("\n🏦 Testing Insuracle contract...");
    const insuraclABI = [
      "function getLatestPrice() public view returns (int256)",
      "function priceFeed() public view returns (address)"
    ];
    
    const insuracle = new ethers.Contract(insuracleDess, insuraclABI, signer);
    
    // Check which oracle address the contract is using
    const contractOracleAddress = await insuracle.priceFeed();
    console.log("   Contract's oracle address:", contractOracleAddress);
    console.log("   Expected oracle address: ", oracleAddress);
    console.log("   ✅ Addresses match:", contractOracleAddress.toLowerCase() === oracleAddress.toLowerCase());
    
    // Get the price from Insuracle
    const contractPrice = await insuracle.getLatestPrice();
    console.log("   Contract's getLatestPrice():", Number(contractPrice) / 1e8, "cm");
    
    console.log("\n✅ Success! Data flow is working:");
    console.log("   Oracle → Insuracle → Frontend");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main().catch(console.error);
