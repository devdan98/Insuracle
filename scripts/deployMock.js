const hre = require("hardhat");

async function main() {
  const MockV3Aggregator = await hre.ethers.getContractFactory("MockV3Aggregator");
  const mock = await MockV3Aggregator.deploy(100); // Initial flood level: 100 cm
  console.log("MockV3Aggregator deployed to:", mock.address);

  const Insuracle = await hre.ethers.getContractFactory("Insuracle");
  const insuracle = await Insuracle.deploy(mock.address);
  console.log("Insuracle deployed to:", insuracle.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
