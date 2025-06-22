const { ethers } = require('ethers');
const axios = require('axios');

class OracleMonitor {
  constructor() {
    this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
    this.oracle = new ethers.Contract('0x7a2088a1bFc9d81c55368AE168C2C02570cB814F', // Live USGS data oracle
      ['function latestAnswer() external view returns (int256)',
       'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)'],
      this.provider);
  }

  async getUSGSData() {
    try {
      const response = await axios.get('https://waterservices.usgs.gov/nwis/iv/', {
        params: {
          format: 'json',
          sites: '01646500',
          parameterCd: '00065',
          siteStatus: 'active'
        }
      });

      if (response.data?.value?.timeSeries?.[0]?.values?.[0]?.value?.[0]) {
        const latestValue = response.data.value.timeSeries[0].values[0].value[0];
        const floodLevel = parseFloat(latestValue.value);
        const floodLevelCm = floodLevel * 30.48;
        
        return {
          rawFeet: floodLevel,
          cm: floodLevelCm,
          timestamp: latestValue.dateTime,
          age: Math.round((Date.now() - new Date(latestValue.dateTime)) / (1000 * 60))
        };
      }
    } catch (error) {
      return { error: error.message };
    }
  }

  async getOracleData() {
    try {
      const answer = await this.oracle.latestAnswer();
      const roundData = await this.oracle.latestRoundData();
      
      return {
        currentValue: Number(answer) / 1e8,
        roundId: Number(roundData.roundId),
        lastUpdated: new Date(Number(roundData.updatedAt) * 1000),
        minutesAgo: Math.round((Date.now() - Number(roundData.updatedAt) * 1000) / (1000 * 60))
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async showStatus() {
    console.log('🔍 Oracle Status Monitor');
    console.log('=' .repeat(50));
    
    console.log('\n🌊 USGS Live Data:');
    const usgsData = await this.getUSGSData();
    if (usgsData.error) {
      console.log(`   ❌ Error: ${usgsData.error}`);
    } else {
      console.log(`   💧 Water Level: ${usgsData.rawFeet} feet (${usgsData.cm.toFixed(2)} cm)`);
      console.log(`   📅 Timestamp: ${usgsData.timestamp}`);
      console.log(`   ⏰ Data Age: ${usgsData.age} minutes old`);
    }

    console.log('\n🔗 Oracle Contract:');
    const oracleData = await this.getOracleData();
    if (oracleData.error) {
      console.log(`   ❌ Error: ${oracleData.error}`);
    } else {
      console.log(`   📊 Current Value: ${oracleData.currentValue} cm`);
      console.log(`   🔄 Round ID: ${oracleData.roundId}`);
      console.log(`   📅 Last Updated: ${oracleData.lastUpdated.toISOString()}`);
      console.log(`   ⏰ Update Age: ${oracleData.minutesAgo} minutes ago`);
    }

    // Compare data sources
    if (!usgsData.error && !oracleData.error) {
      const difference = Math.abs(usgsData.cm - oracleData.currentValue);
      console.log('\n🔄 Data Synchronization:');
      console.log(`   📈 USGS vs Oracle: ${difference.toFixed(2)} cm difference`);
      
      if (difference < 0.1) {
        console.log('   ✅ Perfect sync! Oracle is up to date');
      } else if (difference < 10) {
        console.log('   ⚠️  Small difference - normal variation');
      } else {
        console.log('   🚨 Large difference - may need manual update');
      }
      
      // Emergency status
      const threshold = 3000;
      console.log('\n🚨 Emergency Status:');
      if (oracleData.currentValue >= threshold) {
        console.log(`   🔴 EMERGENCY: ${oracleData.currentValue} cm >= ${threshold} cm threshold!`);
      } else {
        console.log(`   🟢 Normal: ${oracleData.currentValue} cm < ${threshold} cm threshold`);
      }
    }
    
    console.log('\\n' + '=' .repeat(50));
  }

  startMonitoring(intervalMinutes = 1) {
    console.log(`🚀 Starting Oracle Monitor (checking every ${intervalMinutes} minute(s))\\n`);
    
    // Initial check
    this.showStatus();
    
    // Set up periodic monitoring
    setInterval(() => {
      console.log(`\\n📱 Update at ${new Date().toLocaleTimeString()}`);
      this.showStatus();
    }, intervalMinutes * 60 * 1000);
  }
}

// Usage
const monitor = new OracleMonitor();

// Show current status
monitor.showStatus().then(() => {
  console.log('\\n💡 To start continuous monitoring, run: monitor.startMonitoring()');
  console.log('💡 To check status once, run: monitor.showStatus()');
});
