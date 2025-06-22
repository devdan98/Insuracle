const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Investigating Oracle Address\n");
  
  const oracleAddress = "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44";
  
  try {
    const [signer] = await ethers.getSigners();
    const provider = signer.provider;
    
    // Check if there's any code at this address
    const code = await provider.getCode(oracleAddress);
    console.log("Code at address:", code);
    console.log("Has contract code:", code !== "0x");
    
    if (code === "0x") {
      console.log("❌ No contract deployed at this address!");
      console.log("\n🔍 Let's find existing deployed contracts...");
      
      // Look for MockV3Aggregator deployments in recent blocks
      const latestBlock = await provider.getBlockNumber();
      console.log("Latest block:", latestBlock);
      
      // Check the last few blocks for contract deployments
      for (let i = Math.max(0, latestBlock - 20); i <= latestBlock; i++) {
        const block = await provider.getBlock(i, true);
        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (tx.to === null && tx.data && tx.data.length > 2) {
              const receipt = await provider.getTransactionReceipt(tx.hash);
              if (receipt && receipt.contractAddress) {
                console.log(`Found contract deployment in block ${i}:`);
                console.log(`  Address: ${receipt.contractAddress}`);
                console.log(`  Transaction: ${tx.hash}`);
              }
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main().catch(console.error);
