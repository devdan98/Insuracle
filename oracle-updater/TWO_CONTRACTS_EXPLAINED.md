// 🏗️ TWO SEPARATE SMART CONTRACTS EXPLAINED

/*
┌─────────────────────────────────────────────────────────────┐
│                    CONTRACT #1: ORACLE                     │
│  File: MockV3Aggregator.sol                                │
│  Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3       │
├─────────────────────────────────────────────────────────────┤
│  📊 STORES FLOOD DATA:                                      │
│  • latestAnswer = 150e8 (150 cm)                           │
│  • latestTimestamp = when last updated                      │
│  • decimals = 8                                            │
│                                                             │
│  🔧 FUNCTIONS:                                              │
│  • updateAnswer(newLevel) - Update flood level             │
│  • latestAnswer() - Get current flood level                │
│  • latestRoundData() - Get detailed data                   │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ reads from
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONTRACT #2: INSURANCE                    │
│  File: Insuracle.sol                                       │
│  Address: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512       │
├─────────────────────────────────────────────────────────────┤
│  💰 HANDLES INSURANCE:                                      │
│  • policies[customer] = customer insurance data            │
│  • priceFeed = points to oracle contract                   │
│  • FLOOD_THRESHOLD = 3000e8 (emergency level)              │
│                                                             │
│  🔧 FUNCTIONS:                                              │
│  • getLatestPrice() - Ask oracle for flood level           │
│  • buyInsurance() - Customer buys policy                   │
│  • triggerPayout() - Pay if flood > threshold              │
└─────────────────────────────────────────────────────────────┘
*/

// Example conversation between contracts:

// 1. Customer wants to claim insurance
customer.call(insurance.triggerPayout());

// 2. Insurance asks oracle for current flood level
insurance.call(oracle.latestRoundData());
// Oracle responds: "Current flood level is 3200cm"

// 3. Insurance checks: 3200cm > 3000cm threshold? YES!
// 4. Insurance pays customer their coverage amount

/*
🎯 KEY POINT: 
The insurance contract NEVER stores flood data itself.
It always asks the oracle contract for the latest data.
This way, one oracle can serve many different insurance contracts!
*/
