// 🌊 SIMPLE EXPLANATION: How Your Oracle System Works

/* 
STEP 1: Oracle Contract (MockV3Aggregator) 
- This is like a "smart thermometer" that stores flood levels
- Anyone can read the current flood level
- Authorized people can update the flood level
*/

contract MockV3Aggregator {
    int256 public latestAnswer; // Current flood level (in cm × 10^8)
    
    // Update flood level (only authorized users)
    function updateAnswer(int256 _answer) external {
        latestAnswer = _answer;
    }
    
    // Anyone can read current flood level
    function latestRoundData() external view returns (..., int256 answer, ...) {
        return (..., latestAnswer, ...);
    }
}

/* 
STEP 2: Insurance Contract (Insuracle)
- This reads flood levels from the oracle
- Automatically pays claims when flood > 3000cm
*/

contract Insuracle {
    AggregatorV3Interface public priceFeed; // Connection to oracle
    int256 public constant FLOOD_THRESHOLD = 3000e8; // 3000cm emergency level
    
    // Read current flood level from oracle
    function getLatestPrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price; // Returns flood level
    }
    
    // Customer claims insurance payout
    function triggerPayout() external {
        int256 floodLevel = getLatestPrice(); // Ask oracle for flood level
        require(floodLevel >= FLOOD_THRESHOLD, "Not flooded enough"); // Check if emergency
        
        // Pay the customer their insurance money
        payable(msg.sender).transfer(coverage);
    }
}

/*
STEP 3: Real-World Data Flow
1. Flood sensor measures water: "Current level = 3200cm"
2. Oracle updater sends to blockchain: updateAnswer(3200e8)
3. Customer checks insurance: getLatestPrice() returns 3200e8
4. Customer claims payout: triggerPayout() sees 3200 > 3000, pays money
*/
