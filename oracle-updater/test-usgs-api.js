const axios = require('axios');

async function testUSGSAPI() {
  console.log('🌊 Testing USGS Water Services API...\n');
  
  try {
    console.log('📡 Fetching data from USGS...');
    const response = await axios.get('https://waterservices.usgs.gov/nwis/iv/', {
      params: {
        format: 'json',
        sites: '01646500', // Potomac River
        parameterCd: '00065', // Gage height parameter
        siteStatus: 'active'
      }
    });

    console.log('✅ API Response received!');
    console.log(`Response status: ${response.status}`);
    
    if (response.data && response.data.value && response.data.value.timeSeries && response.data.value.timeSeries[0]) {
      const timeSeries = response.data.value.timeSeries[0];
      const siteInfo = timeSeries.sourceInfo;
      const values = timeSeries.values[0].value;
      
      console.log(`\n📍 Site Information:`);
      console.log(`   Site: ${siteInfo.siteName}`);
      console.log(`   Location: ${siteInfo.geoLocation.geogLocation.latitude}, ${siteInfo.geoLocation.geogLocation.longitude}`);
      console.log(`   Site Code: ${siteInfo.siteCode[0].value}`);
      
      console.log(`\n📊 Latest Water Data:`);
      const latestValue = values[0];
      const waterLevel = parseFloat(latestValue.value);
      const timestamp = latestValue.dateTime;
      
      console.log(`   Raw value: ${waterLevel} feet`);
      console.log(`   Timestamp: ${timestamp}`);
      console.log(`   Data age: ${Math.round((Date.now() - new Date(timestamp)) / (1000 * 60))} minutes old`);
      
      // Convert to our contract format
      const floodLevelCm = waterLevel * 30.48; // feet to cm
      const contractValue = Math.floor(floodLevelCm * 1e8);
      
      console.log(`\n🔧 Conversion for Contract:`);
      console.log(`   Converted to cm: ${floodLevelCm.toFixed(2)} cm`);
      console.log(`   Contract format: ${contractValue} (scaled by 1e8)`);
      
      // Show recent trend
      console.log(`\n📈 Recent Data Points (last 5):`);
      for (let i = 0; i < Math.min(5, values.length); i++) {
        const point = values[i];
        const cm = parseFloat(point.value) * 30.48;
        console.log(`   ${point.dateTime}: ${parseFloat(point.value)} ft (${cm.toFixed(1)} cm)`);
      }
      
      return {
        success: true,
        waterLevel,
        timestamp,
        contractValue
      };
      
    } else {
      console.log('❌ Unexpected API response structure');
      console.log('Response structure:', JSON.stringify(response.data, null, 2));
      return { success: false, error: 'Unexpected response structure' };
    }
    
  } catch (error) {
    console.error('❌ Error fetching USGS data:', error.message);
    
    if (error.response) {
      console.log(`HTTP Status: ${error.response.status}`);
      console.log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    return { success: false, error: error.message };
  }
}

// Run the test
testUSGSAPI().then(result => {
  if (result.success) {
    console.log('\n🎉 USGS API is working perfectly!');
    console.log('✅ Live data is available for your oracle');
  } else {
    console.log('\n❌ USGS API test failed');
    console.log('💡 We may need to switch to simulation mode or find alternative APIs');
  }
});
