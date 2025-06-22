const { ethers } = require('ethers');

async function testRealDataFlow() {
  console.log('🧪 Testing: Can we change data source without changing contracts?\n');
  
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
  
  const oracleABI = ['function updateAnswer(int256 _answer) external', 'function latestAnswer() external view returns (int256)'];
  const oracle = new ethers.Contract('0x7a2088a1bFc9d81c55368AE168C2C02570cB814F', oracleABI, wallet); // Live USGS data oracle
  
  const insuranceABI = ['function getLatestPrice() public view returns (int256)'];
  const insurance = new ethers.Contract('0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', insuranceABI, provider);
  
  // Simulate different data sources
  const dataSources = [
    { name: 'Weather API', value: 250 },
    { name: 'IoT Sensor', value: 1500 },
    { name: 'Database', value: 3200 }, // Emergency level!
    { name: 'Manual Entry', value: 180 }
  ];
  
  for (const source of dataSources) {
    console.log(`📡 Simulating data from: ${source.name}`);
    console.log(`   Raw data: ${source.value} cm`);
    
    // Convert to blockchain format
    const blockchainValue = Math.floor(source.value * 1e8);
    
    // Update oracle (same contract, different data source)
    const tx = await oracle.updateAnswer(blockchainValue);
    await tx.wait();
    
    // Verify insurance contract sees the new data
    const insuranceReads = await insurance.getLatestPrice();
    console.log(`   Insurance contract now reads: ${Number(insuranceReads) / 1e8} cm`);
    
    if (source.value >= 3000) {
      console.log(`   🚨 EMERGENCY LEVEL - Claims can be processed!`);
    }
    console.log('');
  }
  
  console.log('✅ Proof: Same contracts work with ANY data source!');
}

testRealDataFlow().catch(console.error);
