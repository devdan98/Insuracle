const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Deploy MockV3Aggregator first
  const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
  const mock = await MockV3Aggregator.deploy(8, 100e8); // 8 decimals, 100cm
  await mock.waitForDeployment();
  const oracleAddress = await mock.getAddress();
  console.log("MockV3Aggregator deployed to:", oracleAddress);

  // Deploy Insuracle with the new oracle address
  const Insuracle = await ethers.getContractFactory("Insuracle");
  const insuracle = await Insuracle.deploy(oracleAddress);
  await insuracle.waitForDeployment();
  const insuracleAddress = await insuracle.getAddress();
  console.log("Insuracle deployed to:", insuracleAddress);

  // Print for easy copy-paste
  console.log("\n--- Copy these addresses to your .env and frontend config ---");
  console.log("MOCK_ORACLE_ADDRESS=", oracleAddress);
  console.log("INSURACLE_ADDRESS=", insuracleAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
