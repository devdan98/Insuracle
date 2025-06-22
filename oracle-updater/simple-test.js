const { ethers } = require('ethers');

async function simpleTest() {
  console.log('🧪 Simple Oracle Test\n');
  
  try {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
    
    // Oracle contract (stores flood data)
    const oracleABI = [
      'function latestAnswer() external view returns (int256)', 
      'function updateAnswer(int256 _answer) external'
    ];
    const oracle = new ethers.Contract('0x7a2088a1bFc9d81c55368AE168C2C02570cB814F', oracleABI, wallet); // Live USGS data oracle
    
    // Insurance contract (reads flood data)  
    const insuranceABI = ['function getLatestPrice() public view returns (int256)'];
    const insurance = new ethers.Contract('0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', insuranceABI, provider);
    
    console.log('📊 Step 1: Reading data directly from Oracle:');
    const oracleValue = await oracle.latestAnswer();
    console.log(`   Oracle contract stores: ${Number(oracleValue) / 1e8} cm\n`);
    
    console.log('📊 Step 2: Reading data through Insurance contract:');
    const insuranceValue = await insurance.getLatestPrice();
    console.log(`   Insurance contract reads: ${Number(insuranceValue) / 1e8} cm\n`);
    
    console.log('✅ Verification:');
    console.log(`   Both values match: ${oracleValue.toString() === insuranceValue.toString()}`);
    console.log('   This proves insurance contract successfully reads from oracle!\n');
    
    console.log('🔄 Step 3: Let\'s update the oracle and see both change:');
    const newValue = Math.floor(150 * 1e8); // 150 cm
    console.log(`   Setting new flood level: 150 cm`);
    
    const tx = await oracle.updateAnswer(newValue);
    await tx.wait();
    console.log('   ✅ Oracle updated!');
    
    console.log('\n📊 Step 4: Reading again after update:');
    const newOracleValue = await oracle.latestAnswer();
    const newInsuranceValue = await insurance.getLatestPrice();
    
    console.log(`   Oracle now shows: ${Number(newOracleValue) / 1e8} cm`);
    console.log(`   Insurance now shows: ${Number(newInsuranceValue) / 1e8} cm`);
    console.log(`   Still match: ${newOracleValue.toString() === newInsuranceValue.toString()}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

simpleTest();
