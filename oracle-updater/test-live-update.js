const { ethers } = require('ethers');
const axios = require('axios');

async function testLiveDataUpdate() {
  console.log('🔄 Testing Full Live Data Update Cycle\n');
  
  try {
    // Setup blockchain connection
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
    
    const oracleABI = [
      'function updateAnswer(int256 _answer) external',
      'function latestAnswer() external view returns (int256)'
    ];
    const oracle = new ethers.Contract('0x7a2088a1bFc9d81c55368AE168C2C02570cB814F', oracleABI, wallet); // Live USGS data oracle
    
    console.log('📊 Step 1: Current Oracle State');
    const currentValue = await oracle.latestAnswer();
    console.log(`   Current oracle value: ${Number(currentValue) / 1e8} cm\n`);
    
    console.log('🌊 Step 2: Fetching Live USGS Data');
    const response = await axios.get('https://waterservices.usgs.gov/nwis/iv/', {
      params: {
        format: 'json',
        sites: '01646500',
        parameterCd: '00065',
        siteStatus: 'active'
      }
    });
    
    const latestValue = response.data.value.timeSeries[0].values[0].value[0];
    const waterLevelFeet = parseFloat(latestValue.value);
    const waterLevelCm = waterLevelFeet * 30.48;
    const contractValue = Math.floor(waterLevelCm * 1e8);
    
    console.log(`   Live water level: ${waterLevelFeet} feet (${waterLevelCm.toFixed(2)} cm)`);
    console.log(`   Data timestamp: ${latestValue.dateTime}`);
    console.log(`   Contract format: ${contractValue}\n`);
    
    console.log('🔄 Step 3: Updating Oracle with Live Data');
    const tx = await oracle.updateAnswer(contractValue);
    console.log(`   Transaction sent: ${tx.hash}`);
    
    await tx.wait();
    console.log('   ✅ Transaction confirmed!\n');
    
    console.log('📊 Step 4: Verifying Update');
    const newValue = await oracle.latestAnswer();
    const newValueCm = Number(newValue) / 1e8;
    
    console.log(`   Oracle now shows: ${newValueCm} cm`);
    console.log(`   Expected: ${waterLevelCm.toFixed(2)} cm`);
    console.log(`   Update successful: ${Math.abs(newValueCm - waterLevelCm) < 0.01}\n`);
    
    // Check if this would trigger emergency
    const emergencyThreshold = 3000; // 3000 cm
    if (newValueCm >= emergencyThreshold) {
      console.log('🚨 EMERGENCY LEVEL DETECTED!');
      console.log(`   Current: ${newValueCm} cm >= Threshold: ${emergencyThreshold} cm`);
    } else {
      console.log('✅ Water level is normal');
      console.log(`   Current: ${newValueCm} cm < Threshold: ${emergencyThreshold} cm`);
    }
    
    console.log('\n🎉 Live Data Update Test Complete!');
    console.log('✅ Your oracle is now receiving real-time water level data from USGS');
    
  } catch (error) {
    console.error('❌ Error in live data update test:', error.message);
  }
}

testLiveDataUpdate();
