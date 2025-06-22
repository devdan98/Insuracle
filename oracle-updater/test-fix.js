const { ethers } = require('ethers');
const axios = require('axios');

// Test just the API data fetching function with the fix
async function testDataFetching() {
  console.log('🧪 Testing Fixed Data Fetching Function\n');
  
  try {
    console.log('📡 Fetching USGS data...');
    const response = await axios.get('https://waterservices.usgs.gov/nwis/iv/', {
      params: {
        format: 'json',
        sites: '01646500',
        parameterCd: '00065',
        siteStatus: 'active'
      }
    });

    if (response.data && response.data.value && response.data.value.timeSeries && response.data.value.timeSeries[0]) {
      const latestValue = response.data.value.timeSeries[0].values[0].value[0];
      const floodLevel = parseFloat(latestValue.value);
      
      console.log(`Raw USGS value: ${floodLevel} feet`);
      
      // OLD METHOD (incorrect):
      const oldMethod = Math.floor(floodLevel * 30.48 * 100);
      console.log(`Old method result: ${oldMethod} (should be wrong)`);
      console.log(`Old method in cm: ${oldMethod / 1e8} cm (way too small!)`);
      
      // NEW METHOD (correct):
      const floodLevelCm = floodLevel * 30.48;
      const newMethod = Math.floor(floodLevelCm * 1e8);
      console.log(`\nNew method - feet to cm: ${floodLevelCm.toFixed(2)} cm`);
      console.log(`New method result: ${newMethod}`);
      console.log(`New method verification: ${newMethod / 1e8} cm (should match!)`);
      
      return newMethod;
    }
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

// Test the oracle updater class method directly
class TestOracleUpdater {
  async getFloodDataFromAPI() {
    try {
      const response = await axios.get('https://waterservices.usgs.gov/nwis/iv/', {
        params: {
          format: 'json',
          sites: '01646500',
          parameterCd: '00065',
          siteStatus: 'active'
        }
      });

      if (response.data && response.data.value && response.data.value.timeSeries && response.data.value.timeSeries[0]) {
        const latestValue = response.data.value.timeSeries[0].values[0].value[0];
        const floodLevel = parseFloat(latestValue.value);
        
        // Convert to centimeters and scale for our contract (8 decimals)
        const floodLevelCm = floodLevel * 30.48;
        return Math.floor(floodLevelCm * 1e8);
      }
    } catch (error) {
      console.error('Error fetching real flood data:', error.message);
    }
    
    return null;
  }
}

async function runTest() {
  const directResult = await testDataFetching();
  
  console.log('\n🔄 Testing via OracleUpdater class method:');
  const updater = new TestOracleUpdater();
  const classResult = await updater.getFloodDataFromAPI();
  
  console.log(`Class method result: ${classResult}`);
  console.log(`Class method in cm: ${classResult / 1e8} cm`);
  
  console.log(`\n✅ Both methods match: ${directResult === classResult}`);
}

runTest();
