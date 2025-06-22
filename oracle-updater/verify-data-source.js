const axios = require('axios');

async function verifyUSGSData() {
  console.log('🔍 Verifying USGS Data Source\n');
  
  console.log('📍 Site Information:');
  console.log('   Site Code: 01646500');
  console.log('   Name: POTOMAC RIVER NEAR WASH, DC LITTLE FALLS PUMP STA');
  console.log('   Location: Washington, DC area');
  console.log('   Parameter: 00065 (Gage height, feet)');
  console.log('\n🌐 Official USGS Links:');
  console.log('   Main Page: https://waterdata.usgs.gov/nwis/uv?site_no=01646500');
  console.log('   Direct API: https://waterservices.usgs.gov/nwis/iv/?format=json&sites=01646500&parameterCd=00065&siteStatus=active');
  
  try {
    console.log('\n📡 Making API call (same as your oracle)...');
    const response = await axios.get('https://waterservices.usgs.gov/nwis/iv/', {
      params: {
        format: 'json',
        sites: '01646500',
        parameterCd: '00065',
        siteStatus: 'active'
      }
    });

    if (response.data?.value?.timeSeries?.[0]) {
      const timeSeries = response.data.value.timeSeries[0];
      const siteInfo = timeSeries.sourceInfo;
      const variable = timeSeries.variable;
      const values = timeSeries.values[0].value;
      
      console.log('\n📊 Live Data Details:');
      console.log(`   Site Name: ${siteInfo.siteName}`);
      console.log(`   Coordinates: ${siteInfo.geoLocation.geogLocation.latitude}, ${siteInfo.geoLocation.geogLocation.longitude}`);
      console.log(`   Parameter: ${variable.variableName} (${variable.variableDescription})`);
      console.log(`   Units: ${variable.unit.unitCode}`);
      
      const latest = values[0];
      const waterLevel = parseFloat(latest.value);
      const timestamp = latest.dateTime;
      const age = Math.round((Date.now() - new Date(timestamp)) / (1000 * 60));
      
      console.log('\n🌊 Current Reading:');
      console.log(`   Raw Value: ${waterLevel} feet`);
      console.log(`   Timestamp: ${timestamp}`);
      console.log(`   Data Age: ${age} minutes old`);
      
      // Your oracle's conversion
      const floodLevelCm = waterLevel * 30.48;
      const contractValue = Math.floor(floodLevelCm * 1e8);
      
      console.log('\n🔄 Oracle Conversion:');
      console.log(`   Converted: ${floodLevelCm.toFixed(2)} cm`);
      console.log(`   Contract Value: ${contractValue}`);
      console.log(`   Verification: ${contractValue / 1e8} cm`);
      
      console.log('\n📈 Recent Values (last 5 readings):');
      for (let i = 0; i < Math.min(5, values.length); i++) {
        const point = values[i];
        const cm = parseFloat(point.value) * 30.48;
        const timeAgo = Math.round((Date.now() - new Date(point.dateTime)) / (1000 * 60));
        console.log(`   ${point.dateTime}: ${parseFloat(point.value)} ft (${cm.toFixed(1)} cm) - ${timeAgo}min ago`);
      }
      
    } else {
      console.log('❌ Unexpected API response structure');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n💡 To verify your oracle data:');
  console.log('   1. Check the USGS website link above');
  console.log('   2. Look for "Gage height" in feet');
  console.log('   3. Multiply by 30.48 to get centimeters');
  console.log('   4. This should match your oracle output');
}

verifyUSGSData();
