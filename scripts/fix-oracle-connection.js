const { ethers } = require('hardhat');

async function main() {
  console.log('🔧 Connecting Insurance to Live Oracle');
  
  const [signer] = await ethers.getSigners();
  
  // Get Insurance contract
  const Insuracle = await ethers.getContractFactory('Insuracle');
  const insurance = Insuracle.attach('0x09635F643e140090A9A8Dcd712eD6285858ceBef');
  
  console.log('📊 Current price in Insurance contract:');
  try {
    const oldPrice = await insurance.getLatestPrice();
    console.log('   Value:', ethers.formatUnits(oldPrice, 8), 'cm');
  } catch (e) {
    console.log('   Error:', e.message);
  }
  
  console.log('🔄 Updating oracle address to live data oracle...');
  const tx = await insurance.setOracleAddress('0x7a2088a1bFc9d81c55368AE168C2C02570cB814F');
  await tx.wait();
  
  console.log('📊 New price after update:');
  const newPrice = await insurance.getLatestPrice();
  console.log('   Value:', ethers.formatUnits(newPrice, 8), 'cm');
  
  console.log('✅ Insurance contract now connected to live USGS data!');
}

main().catch(console.error);
