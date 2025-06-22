// 🔍 EXACT DATA SOURCE BREAKDOWN
// Here's what each parameter in your oracle code means:

/*
LINE 30: const response = await axios.get('https://waterservices.usgs.gov/nwis/iv/', {

🌐 BASE URL: https://waterservices.usgs.gov/nwis/iv/
   This is the USGS Instantaneous Values Web Service API

LINE 31-37: params: {
*/

const DATA_SOURCE_CONFIG = {
  // 📊 Data Format
  format: 'json',  // Request JSON response (vs XML or other formats)
  
  // 📍 SPECIFIC LOCATION
  sites: '01646500',  // ← THIS IS THE KEY!
  /*
  Site 01646500 = "POTOMAC RIVER NEAR WASH, DC LITTLE FALLS PUMP STA"
  Location: 38.94977778°N, -77.12763889°W
  
  If you wanted different locations, you'd change this to:
  - '01594440' = Patuxent River near Laurel, MD
  - '01645000' = Potomac River at Chain Bridge
  - '01668000' = Rappahannock River near Fredericksburg, VA
  */
  
  // 🌊 SPECIFIC MEASUREMENT TYPE  
  parameterCd: '00065',  // ← THIS IS WHAT WE'RE MEASURING!
  /*
  Parameter 00065 = "Gage height, feet"
  
  Other available parameters at this site:
  - '00060' = Discharge (cubic feet per second)
  - '00010' = Temperature, water (degrees Celsius)
  - '00095' = Specific conductance (microsiemens per centimeter)
  
  But we specifically want '00065' for flood monitoring!
  */
  
  // ✅ Site Status Filter
  siteStatus: 'active'  // Only get data from currently active monitoring stations
};

/*
LINE 39-44: Data Extraction
*/
const latestValue = response.data.value.timeSeries[0].values[0].value[0];
const floodLevel = parseFloat(latestValue.value);
/*
This extracts:
- The most recent measurement 
- From the first (and only) time series
- Converts the string value to a number
*/

/*
LINE 46-47: Unit Conversion
*/
const floodLevelCm = floodLevel * 30.48; // feet to cm conversion
return Math.floor(floodLevelCm * 1e8); // scale by 1e8 for contract
/*
This converts:
- Feet → Centimeters (multiply by 30.48)
- Centimeters → Contract format (multiply by 100,000,000)
*/

console.log('🎯 Your oracle is specifically monitoring:');
console.log('   Location: Potomac River near Washington, DC');
console.log('   Parameter: Water level (gage height) in feet');
console.log('   Source: USGS Site 01646500');
console.log('   Conversion: Feet → Centimeters → Blockchain format');
