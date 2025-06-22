const { ethers } = require('ethers');

// Test connection to your oracle
async function testOracleConnection() {
  console.log('🧪 Testing Oracle Connection...\n');
  
  try {
    // Connect to Hardhat network
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
    
    // Test network connection
    console.log('📡 Checking network connection...');
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Test wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} ETH`);
    
    // Oracle contract ABI
    const MOCK_ORACLE_ABI = [
      "function updateAnswer(int256 _answer) external",
      "function latestAnswer() external view returns (int256)",
      "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"
    ];
    
    // Connect to oracle contract
    const oracleAddress = '0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44'; // Live USGS data oracle
    console.log(`\n🔗 Connecting to oracle at: ${oracleAddress}`);
    
    const oracleContract = new ethers.Contract(oracleAddress, MOCK_ORACLE_ABI, wallet);
    
    // Read current value
    console.log('📊 Reading current oracle value...');
    const currentValue = await oracleContract.latestAnswer();
    console.log(`Current flood level: ${Number(currentValue) / 1e8} cm`);
    
    // Test update (small change)
    console.log('\n✏️  Testing oracle update...');
    const testValue = Math.floor((250 + Math.random() * 100) * 1e8); // Random value between 250-350cm
    
    const tx = await oracleContract.updateAnswer(testValue);
    console.log(`Transaction sent: ${tx.hash}`);
    
    await tx.wait();
    console.log('✅ Transaction confirmed!');
    
    // Verify update
    const newValue = await oracleContract.latestAnswer();
    console.log(`Updated flood level: ${Number(newValue) / 1e8} cm`);
    
    console.log('\n🎉 Oracle connection test successful!');
    console.log('Your oracle updater service is ready to run.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('  1. Hardhat node is running (npx hardhat node)');
    console.log('  2. Contracts are deployed');
    console.log('  3. Contract addresses are correct');
  }
}

testOracleConnection();
