const { ethers } = require('ethers');

async function quickStatus() {
  console.log('📊 Oracle Live Data Status\\n');
  
  try {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const oracle = new ethers.Contract('0x7a2088a1bFc9d81c55368AE168C2C02570cB814F', // Live USGS data oracle
      ['function latestAnswer() external view returns (int256)'], provider);
    
    const value = await oracle.latestAnswer();
    const cm = Number(value) / 1e8;
    
    console.log(`🔗 Current Oracle Value: ${cm} cm`);
    
    if (cm >= 3000) {
      console.log('🚨 EMERGENCY LEVEL - Claims processing enabled!');
    } else if (cm >= 1000) {
      console.log('⚠️  Elevated water level');
    } else {
      console.log('✅ Normal water level');
    }
    
    console.log(`\\n💡 This data comes from live USGS water monitoring at Potomac River`);
    console.log(`💡 Updates automatically every 5 minutes when running: node index.js`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickStatus();
