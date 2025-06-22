const { ethers } = require('ethers');
const axios = require('axios');

async function manualOracleTest() {
  console.log('🔄 Manual Oracle Test with Live Data\n');
  
  try {
    // Setup
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
    const oracle = new ethers.Contract('0x7a2088a1bFc9d81c55368AE168C2C02570cB814F', 
      ['function updateAnswer(int256) external', 'function latestAnswer() external view returns (int256)'], wallet);
    
    console.log('📊 Step 1: Current Oracle State');
    const currentValue = await oracle.latestAnswer();
    console.log(`   Current: ${Number(currentValue) / 1e8} cm\n`);
    
    console.log('🌊 Step 2: Fetching Live Data');
    console.log('   Making API call to USGS...');
    
    const response = await axios.get('https://waterservices.usgs.gov/nwis/iv/', {
      params: {
        format: 'json',
        sites: '01646500',
        parameterCd: '00065', 
        siteStatus: 'active'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('   ✅ API response received');
    
    if (response.data?.value?.timeSeries?.[0]?.values?.[0]?.value?.[0]) {
      const latestValue = response.data.value.timeSeries[0].values[0].value[0];
      const floodLevel = parseFloat(latestValue.value);
      const floodLevelCm = floodLevel * 30.48;
      const contractValue = Math.floor(floodLevelCm * 1e8);
      
      console.log(`   Raw: ${floodLevel} feet`);
      console.log(`   Converted: ${floodLevelCm.toFixed(2)} cm`);
      console.log(`   Contract format: ${contractValue}`);
      console.log(`   Timestamp: ${latestValue.dateTime}\n`);
      
      console.log('🔄 Step 3: Updating Oracle');
      const tx = await oracle.updateAnswer(contractValue);
      console.log(`   Transaction: ${tx.hash}`);
      
      await tx.wait();
      console.log('   ✅ Confirmed!\n');
      
      console.log('📊 Step 4: Verification');
      const newValue = await oracle.latestAnswer();
      console.log(`   Oracle now: ${Number(newValue) / 1e8} cm`);
      console.log(`   Expected: ${floodLevelCm.toFixed(2)} cm`);
      console.log(`   Success: ${Math.abs(Number(newValue) / 1e8 - floodLevelCm) < 0.01}\n`);
      
      console.log('🎉 Oracle is successfully using live USGS data!');
      
    } else {
      console.log('❌ Unexpected API response structure');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Network connectivity issue - check internet connection');
    }
  }
}

manualOracleTest();
