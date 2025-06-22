# 🌊 Insuracle Oracle Integration Guide

## 📍 **Your Oracle Code Locations**

### **Smart Contracts (Blockchain Layer)**
- **`contracts/Insuracle.sol`** - Main insurance contract that reads oracle data via `getLatestPrice()`
- **`contracts/mocks/MockV3Aggregator.sol`** - Your oracle contract that stores and provides flood data
- **Key Function:** `updateAnswer(int256 _answer)` - Updates flood level data

### **Frontend (User Interface)**
- **`frontend/src/InsuracleDashboard.tsx`** - Displays flood data and auto-refreshes every 30 seconds
- **`frontend/src/InsuracleDashboardAdmin.tsx`** - Admin panel for manual oracle updates
- **`frontend/src/lib/contract.ts`** - Contract addresses and configurations

### **Backend Oracle Updater (NEW!)**
- **`oracle-updater/index.js`** - Automated service that updates oracle with real-world data
- **`oracle-updater/test-connection.js`** - Test script to verify your setup

---

## 🚀 **Step-by-Step Setup**

### **Step 1: Start Your Blockchain**
```bash
# In terminal 1 - Start Hardhat network
cd /workspaces/Insuracle
npx hardhat node
```

### **Step 2: Deploy Your Contracts**
```bash
# In terminal 2 - Deploy contracts
cd /workspaces/Insuracle
npx hardhat run scripts/deploy.js --network localhost
```

### **Step 3: Test Oracle Connection**
```bash
# Test if oracle updater can connect
cd /workspaces/Insuracle/oracle-updater
node test-connection.js
```

### **Step 4: Start Oracle Updater Service**
```bash
# Start the automated oracle updater
cd /workspaces/Insuracle/oracle-updater
npm start
```

### **Step 5: Start Frontend**
```bash
# In terminal 3 - Start frontend
cd /workspaces/Insuracle/frontend
npm run dev
```

---

## 🔗 **How to Connect Real-World Data**

### **Current Data Sources in Oracle Updater:**

1. **USGS Water Services** (included as example)
   - Real-time river and flood gauge data
   - Free government API
   - Already integrated in `getFloodDataFromAPI()`

2. **Simulated Data** (fallback)
   - Realistic flood level simulation
   - Generates emergency levels 5% of the time
   - Good for testing

### **To Add Your Own Data Source:**

Edit `oracle-updater/index.js`, find the `getFloodDataFromAPI()` function:

```javascript
async getFloodDataFromAPI() {
  try {
    // Replace this section with your API
    const response = await axios.get('YOUR_FLOOD_API_ENDPOINT', {
      params: {
        // Your API parameters
      },
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY'
      }
    });

    // Convert your API response to centimeters
    const floodLevel = response.data.flood_level_in_cm;
    return Math.floor(floodLevel * 1e8); // Scale for contract (8 decimals)
    
  } catch (error) {
    console.error('API Error:', error);
    return this.generateSimulatedFloodData(); // Fallback
  }
}
```

### **Popular Flood Data APIs:**

1. **USGS Water Services** (Free, US-based)
   - `https://waterservices.usgs.gov/nwis/iv/`
   - Real-time water levels from river gauges

2. **NOAA APIs** (Free, US-based)
   - Flood warnings and water level data
   - `https://api.weather.gov/`

3. **European Environment Agency** (Free, EU-based)
   - `https://water.europa.eu/`

4. **OpenWeatherMap** (Free tier available)
   - Weather and flood risk data
   - Requires API key

---

## 📊 **Frontend Features Added**

Your dashboard now includes:

- **🔄 Manual Refresh Button** - Click to get latest oracle data
- **🔄 Auto-Refresh Toggle** - Automatically updates every 30 seconds
- **⏰ Last Updated Timestamp** - Shows when data was last refreshed
- **🚨 Real-time Alerts** - Notifications when threshold is crossed
- **📈 Live Data Display** - Shows flood levels in centimeters

---

## ⚙️ **Configuration**

### **Oracle Update Frequency:**
Edit `oracle-updater/index.js` line 116:
```javascript
// Change update interval (cron format)
cron.schedule('*/5 * * * *', () => {  // Every 5 minutes
  this.performUpdate();
});
```

### **Emergency Threshold:**
Edit `contracts/Insuracle.sol` line 24:
```solidity
int256 public constant FLOOD_THRESHOLD = 3000e8; // 3000cm threshold
```

### **Contract Addresses:**
Update `oracle-updater/.env` with your actual deployed addresses:
```
MOCK_ORACLE_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

---

## 🔍 **Monitoring Your Oracle**

### **Oracle Updater Logs:**
- ✅ Successful updates
- 🚨 Emergency threshold crossings  
- ❌ Errors and failed updates
- 📈 Data changes and trends

### **Frontend Indicators:**
- Green: Normal flood levels
- Red: Emergency threshold exceeded
- Auto-refresh status (ON/OFF)
- Last update timestamp

### **Smart Contract Events:**
Your contract emits events that can be monitored:
- `PayoutTriggered` - When insurance claim is processed
- `InsurancePurchased` - When new policy is bought

---

## 🛠 **Troubleshooting**

### **Oracle Not Updating?**
1. Check Hardhat node is running (`npx hardhat node`)
2. Verify contract addresses in `.env`
3. Ensure wallet has ETH for gas fees
4. Check oracle updater logs for errors

### **Frontend Not Refreshing?**
1. Make sure auto-refresh is enabled (toggle button)
2. Check browser console for errors
3. Verify MetaMask is connected to localhost:8545

### **Gas Fees Too High?**
1. Reduce update frequency in cron schedule
2. Only update when data changes significantly
3. Use a dedicated wallet with limited ETH

---

## 🎯 **Next Steps**

1. **Choose Your Data Source** - Pick a real flood monitoring API
2. **Get API Keys** - Register for your chosen service
3. **Update Configuration** - Add API details to oracle updater
4. **Test With Real Data** - Verify your integration works
5. **Deploy to Testnet** - Move beyond localhost when ready
6. **Monitor and Optimize** - Watch gas costs and update frequency

Your oracle system is now ready to bridge real-world flood data to your blockchain insurance contract! 🌊⛓️
