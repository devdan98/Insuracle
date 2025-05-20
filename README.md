# Insuracle: Decentralized Flood Insurance Proof of Concept

## Overview

**Insuracle** is a proof of concept (PoC) for a decentralized flood insurance platform built on Ethereum, demonstrating automated insurance purchases and payouts triggered by flood level data from a Chainlink-compatible oracle. This PoC showcases a smart contract (`Insuracle.sol`) that allows users to buy flood insurance policies and claim payouts when flood levels exceed a predefined threshold, with role-based access control for secure administration.

Designed for presentation to the Polkadot ecosystem, Insuracle highlights the potential for decentralized insurance applications. While currently implemented on Ethereum using Hardhat, the architecture is adaptable to Polkadot parachains (e.g., Moonbeam for EVM compatibility or a native Substrate pallet with a custom oracle). This README provides instructions to set up, deploy, and demo the PoC locally, along with steps to test key features.

### Features
- **Insurance Purchase**: Users buy policies by paying a premium (10% of coverage), e.g., 0.1 ETH for 1 ETH coverage.
- **Automated Payouts**: Payouts are triggered when the flood level (from a mock oracle) exceeds 3000 units, sending coverage (e.g., 1 ETH) to the policyholder.
- **Role-Based Access**: Admins manage the contract, oracle updaters set flood levels, and insurance admins configure parameters.
- **Frontend Interface**: A React-based UI allows users to connect wallets, buy insurance, update flood levels, and trigger payouts.
- **Mock Oracle**: A `MockV3Aggregator` simulates Chainlink flood level data for local testing.

## Prerequisites

- **Node.js**: Version 18.x or 23.x (tested with 23.9.0).
- **MetaMask**: Browser extension for wallet interactions.
- **Git**: To clone the repository.
- **Hardhat**: For contract deployment and testing.

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/devdan98/insuracle.git
   cd insuracle
   ```

2. **Install Node.js Dependencies**:
   ```bash
   npm install
   ```
   - This installs Hardhat, Ethers.js, OpenZeppelin, Chainlink contracts, and other dependencies listed in `package.json`.

3. **Install `http-server` for Frontend**:
   ```bash
   npm install -g http-server
   ```

4. **Verify Hardhat Configuration**:
   - Ensure `hardhat.config.js` is set up for the `localhost` network:
     ```javascript
     module.exports = {
       solidity: "0.8.20",
       networks: {
         localhost: {
           url: "http://127.0.0.1:8545",
           chainId: 31337,
         },
       },
     };
     ```

## Usage

### 1. Start the Hardhat Node
Run a local Ethereum node to deploy contracts and interact with the blockchain:
```bash
npx hardhat node
```
- This starts a node at `http://127.0.0.1:8545` with Chain ID 31337 and provides test accounts (e.g., deployer: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`, customer: `0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199`).

### 2. Deploy Contracts
Deploy the `MockV3Aggregator` and `Insuracle` contracts:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
- Output example:
  ```
  MockV3Aggregator deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
  Insuracle deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
  ```
- Update `frontend/index.html` with the new `Insuracle` address in `INSURACLE_ADDRESS`.

### 3. Fund the Contract
The `Insuracle` contract requires ETH to cover payouts. Fund it with 2 ETH:
```bash
npx hardhat run scripts/fund-contract.js --network localhost
```
- Example script (`scripts/fund-contract.js`):
  ```javascript
  const { ethers } = require("hardhat");

  async function main() {
    const [deployer] = await ethers.getSigners();
    const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Update with Insuracle address
    const amount = ethers.parseEther("2");

    console.log("Funding contract with:", deployer.address);
    const tx = await deployer.sendTransaction({
      to: contractAddress,
      value: amount,
    });
    await tx.wait();
    console.log("Funded contract with 2 ETH, tx:", tx.hash);

    const contract = await ethers.getContractAt("Insuracle", contractAddress);
    const balance = await contract.getContractBalance();
    console.log("New Contract Balance:", ethers.formatEther(balance), "ETH");
  }

  main().catch(console.error);
  ```
- Output example:
  ```
  Funded contract with 2 ETH, tx: 0xc1c63a032e7ece1c09fb0db41e226dc1194d138f23d1e8e2f94b76d60a4d6182
  New Contract Balance: 2.0 ETH
  ```

### 4. Serve the Frontend
Serve the React frontend to interact with the contract:
```bash
cd frontend
http-server -p 8080
```
- If `http-server` is unavailable, use Python:
  ```bash
  python3 -m http.server 8080
  ```
- Open `http://localhost:8080` in a browser with MetaMask installed.

### 5. Configure MetaMask
- Add the Hardhat network:
  - Network Name: Hardhat
  - RPC URL: `http://127.0.0.1:8545`
  - Chain ID: 31337
  - Currency Symbol: ETH
- Import test accounts (from Hardhat node output):
  - Deployer: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (admin roles).
  - Customer: `0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199` (no admin roles).
  - Use private keys from the Hardhat node console (e.g., `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` for deployer).

## Demo Instructions

### 1. Buy Insurance
- Connect MetaMask as the customer (`0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199`).
- In the UI, enter `1` in “Coverage amount (ETH)” (premium: 0.1 ETH).
- Click “Buy Insurance” and confirm in MetaMask.
- Verify: Premium: 0.1 ETH, Coverage: 1 ETH, Status: Active.

### 2. Set Flood Level
- Connect as the deployer (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`).
- Enter `3001` in “New flood level” (threshold: 3000).
- Click “Update Flood Level” and confirm.
- Verify: Flood level is 3001.0 units.

### 3. Trigger Payout
- Connect as the customer.
- Click “Trigger Payout” and confirm.
- Verify:
  - Status: Paid Out.
  - Customer balance increases by 1 ETH (check “Your Balance” or MetaMask).
  - Contract balance decreases to ~1.1 ETH.

### 4. Edge Cases
- **Low Flood Level**: Set flood level to 2000 and try payout (fails: “Flood level below threshold”).
- **Low Contract Balance**: Deploy a new contract without funding and try payout (fails: “Payout failed”).
- **Duplicate Policy**: Try buying another policy while one is active (fails: “Policy already active”).

## Testing

Run unit tests to verify contract functionality:
```bash
npx hardhat test
```
- Tests cover:
  - Policy creation and validation.
  - Payout triggering above/below threshold.
  - Role-based access control.
  - Contract funding and withdrawal.

To verify the current state:
```bash
npx hardhat run scripts/check-policy.js --network localhost
```
- Example script (`scripts/check-policy.js`):
  ```javascript
  const { ethers } = require("hardhat");

  async function main() {
    const customer = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";
    const contract = await ethers.getContractAt("Insuracle", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
    const policy = await contract.policies(customer);
    console.log("Policy:", {
      active: policy.active,
      premium: ethers.formatEther(policy.premium),
      coverage: ethers.formatEther(policy.coverage),
      paidOut: policy.paidOut,
    });
    const balance = await contract.getContractBalance();
    console.log("Contract Balance:", ethers.formatEther(balance), "ETH");
    const customerBalance = await ethers.provider.getBalance(customer);
    console.log("Customer Balance:", ethers.formatEther(customerBalance), "ETH");
  }

  main().catch(console.error);
  ```

## Project Structure

```
insuracle/
├── contracts/
│   ├── Insuracle.sol          # Main insurance contract
│   └── mocks/
│       └── MockV3Aggregator.sol # Mock Chainlink oracle
├── scripts/
│   ├── deploy.js              # Deploy contracts
│   ├── fund-contract.js       # Fund contract with ETH
│   └── check-policy.js        # Check policy and balances
├── frontend/
│   └── index.html             # React frontend
├── test/
│   └── Insuracle.test.js      # Unit tests
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Node.js dependencies
└── README.md                  # This file
```

## Security and Dependencies

- **Dependencies**:
  - `@openzeppelin/contracts@5.0.2`: For AccessControl.
  - `@chainlink/contracts@1.2.0`: For AggregatorV3Interface.
  - `hardhat`, `ethers`, `@nomicfoundation/hardhat-toolbox`: For development.
- **Vulnerability Check**:
  ```bash
  npm audit fix
  npm audit
  ```
  - Address any high-severity issues before deployment.

## Future Enhancements

- **Real Oracle Data**: Replace `MockV3Aggregator` with Chainlink’s flood level data feed.
- **Multi-Policy Support**: Allow users to hold multiple policies.

## Troubleshooting

- **http-server not found**:
  - Install: `npm install -g http-server`.
  - Alternative: `python3 -m http.server 8080`.
- **Contract Funding Fails**:
  - Ensure `Insuracle.sol` has `receive() external payable {}`.
  - Redeploy if necessary: `npx hardhat run scripts/deploy.js --network localhost`.
- **Payout Fails**:
  - Check contract balance (`getContractBalance`): Must be ≥ coverage (e.g., 1 ETH).
  - Verify flood level ≥ 3000 units.
- **MetaMask Issues**:
  - Ensure Hardhat network is added and accounts are imported.

## License

MIT License. See [LICENSE](./LICENSE) for details.

## Contact

For questions or feedback, open an issue on GitHub.

---

*Presented as a proof of concept for Polkadot, May 2025.*
