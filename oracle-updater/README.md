# Oracle Updater Service

This service automatically updates your Insuracle oracle with real-world flood data.

## How It Works

1. **Data Collection**: Fetches flood level data from real APIs (currently includes USGS Water Services as an example)
2. **Smart Contract Update**: Updates your MockV3Aggregator contract with new flood data
3. **Automatic Scheduling**: Runs every 5 minutes to keep data fresh
4. **Emergency Detection**: Logs when flood levels cross the 3000cm threshold

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update your contract addresses in `.env` file:
   - Get your deployed contract addresses from your Hardhat deployment
   - Update `MOCK_ORACLE_ADDRESS` with your actual oracle contract address

3. Configure data sources:
   - The service includes example integration with USGS Water Services
   - Add your API keys to `.env` for real data sources
   - Modify the `getFloodDataFromAPI()` function to use your preferred flood monitoring service

## Running the Service

```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

## Data Sources You Can Integrate

1. **USGS Water Services** (included as example)
   - Real-time water level data
   - Free, no API key required for basic usage

2. **National Weather Service**
   - Flood warnings and river levels
   - Free government API

3. **Weather APIs** (OpenWeatherMap, AccuWeather)
   - Current weather and flood risk data
   - Require API keys

4. **IoT Sensors**
   - Connect directly to flood monitoring sensors
   - Custom hardware integration

## Customization

- **Update Frequency**: Change the cron schedule in `index.js`
- **Data Sources**: Modify `getFloodDataFromAPI()` to use your preferred APIs
- **Threshold Logic**: Adjust emergency detection thresholds
- **Data Format**: The service expects flood levels in centimeters

## Security Notes

- Keep your `.env` file secure and never commit it to version control
- Use environment-specific private keys
- Consider using a dedicated wallet for oracle updates
- Monitor gas costs for frequent updates

## Monitoring

The service logs:
- ✅ Successful updates
- 🚨 Emergency threshold crossings
- ❌ Errors and failed updates
- 📈 Data changes and trends
