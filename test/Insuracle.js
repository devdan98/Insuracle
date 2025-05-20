const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Insuracle", function () {
  let Insuracle, insuracle, MockPriceFeed, mockPriceFeed, owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    console.log("Deployer address:", owner.address);

    // Deploy mock price feed
    console.log("Attempting to get MockV3Aggregator factory...");
    try {
      MockPriceFeed = await ethers.getContractFactory("MockV3Aggregator");
      console.log("MockV3Aggregator factory obtained:", !!MockPriceFeed);
      console.log("Deploying MockV3Aggregator with args: decimals=8, initialAnswer=2000e8");
      mockPriceFeed = await MockPriceFeed.deploy(8, 2000e8);
      const deployTx = await mockPriceFeed.deploymentTransaction();
      console.log("MockV3Aggregator deployment transaction sent:", deployTx ? deployTx.hash : "N/A");
      await mockPriceFeed.waitForDeployment();
      const mockAddress = await mockPriceFeed.getAddress();
      console.log("MockV3Aggregator deployed at:", mockAddress);
      // Verify deployment
      const decimals = await mockPriceFeed.decimals();
      console.log("MockV3Aggregator decimals:", decimals.toString());
    } catch (error) {
      console.error("Error deploying MockV3Aggregator:", error.message);
      throw error;
    }

    // Deploy Insuracle
    const priceFeedAddress = await mockPriceFeed.getAddress();
    console.log("Deploying Insuracle with price feed:", priceFeedAddress);
    try {
      Insuracle = await ethers.getContractFactory("Insuracle");
      console.log("Insuracle factory obtained:", !!Insuracle);
      insuracle = await Insuracle.deploy(priceFeedAddress);
      const deployTx = await insuracle.deploymentTransaction();
      console.log("Insuracle deployment transaction sent:", deployTx ? deployTx.hash : "N/A");
      await insuracle.waitForDeployment();
      console.log("Insuracle deployed at:", await insuracle.getAddress());
    } catch (error) {
      console.error("Error deploying Insuracle:", error.message);
      if (error.transaction) {
        console.error("Transaction data:", error.transaction);
        const txResponse = await ethers.provider.getTransaction(error.transaction.hash);
        console.error("Transaction response:", txResponse);
      }
      throw error;
    }
  });

  it("should assign roles correctly", async function () {
    expect(await insuracle.hasRole(await insuracle.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    expect(await insuracle.hasRole(await insuracle.ORACLE_UPDATER_ROLE(), owner.address)).to.be.true;
    expect(await insuracle.hasRole(await insuracle.INSURANCE_ADMIN_ROLE(), owner.address)).to.be.true;
  });

  it("should fetch latest price", async function () {
    const price = await insuracle.getLatestPrice();
    expect(price).to.equal(2000e8);
  });
});
