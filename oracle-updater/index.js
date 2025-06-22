const { ethers } = require('ethers');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();

// Configuration
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Default Hardhat account
const MOCK_ORACLE_ADDRESS = process.env.MOCK_ORACLE_ADDRESS || '0x7a2088a1bFc9d81c55368AE168C2C02570cB814F'; // Oracle with LIVE USGS data

// Mock Oracle ABI (just the functions we need)
const MOCK_ORACLE_ABI = [
  "function updateAnswer(int256 _answer) external",
  "function latestAnswer() external view returns (int256)",
  "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"
];

class OracleUpdater {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(MOCK_ORACLE_ADDRESS, MOCK_ORACLE_ABI, this.wallet);
  }

  // Example: Get flood data from a real API
  async getFloodDataFromAPI() {
    try {
      // Example using USGS Water Services API (replace with your preferred data source)
      // This is just an example - you'll need to find a real flood monitoring API
      const response = await axios.get('https://waterservices.usgs.gov/nwis/iv/', {
        params: {
          format: 'json',
          sites: '01646500', // Example site (Potomac River)
          parameterCd: '00065', // Gage height parameter
          siteStatus: 'active'
        }
      });

      if (response.data && response.data.value && response.data.value.timeSeries && response.data.value.timeSeries[0]) {
        const latestValue = response.data.value.timeSeries[0].values[0].value[0];
        const floodLevel = parseFloat(latestValue.value);
        
        // Convert to centimeters and scale for our contract (8 decimals)
        const floodLevelCm = floodLevel * 30.48; // feet to cm conversion
        return Math.floor(floodLevelCm * 1e8); // scale by 1e8 for contract
      }
    } catch (error) {
      console.error('Error fetching real flood data:', error.message);
    }

    // Fallback: Generate realistic simulation data
    return this.generateSimulatedFloodData();
  }

  // Simulate realistic flood data when real API is unavailable
  generateSimulatedFloodData() {
    const baseLevel = 200; // 200cm base level
    const variation = Math.sin(Date.now() / 100000) * 50; // Slow sine wave
    const randomFactor = (Math.random() - 0.5) * 100; // Random variation
    const emergencyChance = Math.random();
    
    // 5% chance of emergency flood level
    if (emergencyChance < 0.05) {
      return Math.floor((3500 + Math.random() * 1000) * 1e8); // Emergency level: 3500-4500cm
    }
    
    return Math.floor((baseLevel + variation + randomFactor) * 1e8); // Normal level with variation
  }

  // Update the oracle contract with new flood data
  async updateOracle(floodLevel) {
    try {
      console.log(`Updating oracle with flood level: ${floodLevel / 1e8} cm`);
      
      const tx = await this.contract.updateAnswer(floodLevel);
      await tx.wait();
      
      console.log(`✅ Oracle updated successfully! Transaction: ${tx.hash}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating oracle:', error.message);
      return false;
    }
  }

  // Get current oracle value
  async getCurrentOracleValue() {
    try {
      const value = await this.contract.latestAnswer();
      return Number(value) / 1e8;
    } catch (error) {
      console.error('Error reading oracle value:', error.message);
      return null;
    }
  }

  // Main update function
  async performUpdate() {
    console.log(`\n📊 Performing oracle update at ${new Date().toISOString()}`);
    
    try {
      // Get current oracle value
      const currentValue = await this.getCurrentOracleValue();
      console.log(`Current oracle value: ${currentValue} cm`);
      
      // Get new flood data
      const newFloodLevel = await this.getFloodDataFromAPI();
      const newValueInCm = newFloodLevel / 1e8;
      
      console.log(`New flood level from data source: ${newValueInCm} cm`);
      
      // Only update if there's a significant change (more than 10cm difference)
      if (currentValue === null || Math.abs(newValueInCm - currentValue) > 10) {
        const success = await this.updateOracle(newFloodLevel);
        
        if (success) {
          // Check if it crosses the emergency threshold
          const threshold = 3000; // 3000cm threshold
          if (newValueInCm >= threshold && (currentValue === null || currentValue < threshold)) {
            console.log(`🚨 EMERGENCY: Flood level crossed threshold! Current: ${newValueInCm}cm, Threshold: ${threshold}cm`);
          } else if (newValueInCm < threshold && currentValue && currentValue >= threshold) {
            console.log(`✅ Flood level back to normal: ${newValueInCm}cm`);
          }
        }
      } else {
        console.log(`📈 No significant change detected (${Math.abs(newValueInCm - currentValue)}cm difference)`);
      }
      
    } catch (error) {
      console.error('Error in performUpdate:', error.message);
    }
  }

  // Start the automatic updating service
  start() {
    console.log('🚀 Oracle Updater Service Starting...');
    console.log(`📡 Connected to RPC: ${RPC_URL}`);
    console.log(`📝 Oracle Contract: ${MOCK_ORACLE_ADDRESS}`);
    console.log(`⏰ Update interval: Every 5 minutes`);
    
    // Perform initial update
    this.performUpdate();
    
    // Schedule updates every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.performUpdate();
    });
    
    console.log('✅ Oracle Updater Service is running...');
  }
}

// Create and start the oracle updater
const updater = new OracleUpdater();
updater.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Oracle Updater Service...');
  process.exit(0);
});
