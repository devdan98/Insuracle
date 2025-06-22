const { ethers } = require("hardhat");

async function main() {
  // Connect to the newly deployed Insuracle contract
  const insuraclAddress = "0x9d4454B023096f34B160D6B654540c56A1F81688";
  const oracleAddress = "0x7a2088a1bFc9d81c55368AE168C2C02570cB814F";
  
  const [signer] = await ethers.getSigners();
  
  // Connect to contracts
  const Insuracle = await ethers.getContractFactory("Insuracle");
  const insuracle = Insuracle.attach(insuraclAddress);
  
  const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
  const oracle = MockV3Aggregator.attach(oracleAddress);
  
  console.log("=== Testing New Insuracle Contract ===");
  console.log("Insuracle address:", insuraclAddress);
  console.log("Oracle address:", oracleAddress);
  
  try {
    // Check what oracle the Insuracle contract is pointing to
    const insuraclePriceFeed = await insuracle.priceFeed();
    console.log("Insuracle's oracle address:", insuraclePriceFeed);
    
    // Get price from oracle directly
    const oraclePrice = await oracle.latestRoundData();
    console.log("Oracle direct price:", oraclePrice[1].toString(), "raw");
    console.log("Oracle direct price:", Number(oraclePrice[1]) / 1e8, "formatted");
    
    // Get price through Insuracle contract
    const insuraclPrice = await insuracle.getLatestPrice();
    console.log("Insuracle price:", insuraclPrice.toString(), "raw");
    console.log("Insuracle price:", Number(insuraclPrice) / 1e8, "formatted");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
