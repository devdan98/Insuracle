const hre = require("hardhat");

async function main() {
  const MockV3Aggregator = await hre.ethers.getContractFactory("MockV3Aggregator");
  const mock = await MockV3Aggregator.deploy(8, 100e8); // 8 decimals, Initial flood level: 100 cm (scaled)
  console.log("MockV3Aggregator deployed to:", mock.target);

  const Insuracle = await hre.ethers.getContractFactory("Insuracle");
  const insuracle = await Insuracle.deploy(mock.target);
  console.log("Insuracle deployed to:", insuracle.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
