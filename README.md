# Insuracle: Decentralized Flood Insurance Proof of Concept (Polkadot/ink! Edition)

## Overview

**Insuracle** is a proof of concept (PoC) for a decentralized flood insurance platform, now ported to the Polkadot ecosystem. This version demonstrates automated insurance purchases and payouts triggered by flood level data from an oracle, using a smart contract written in [ink!](https://use.ink/) (Rust) and deployed to a Substrate-based testnet (e.g., Westend or Paseo).

**Key changes from the Ethereum version:**
- Contracts are now written in ink! (Rust) and deployed to a Polkadot testnet (Westend/Paseo).
- Users interact with the dApp using the [Polkadot.js browser extension](https://polkadot.js.org/extension/), not MetaMask.
- Frontend uses `@polkadot/api` and `@polkadot/extension-dapp` for wallet and contract interaction.

---

## Prerequisites

- **Rust**: Install from [rustup.rs](https://rustup.rs/)
- **cargo-contract**: For building and deploying ink! contracts
  ```bash
  cargo install cargo-contract --force
  ```
- **Substrate Node**: Use [Westend](https://wiki.polkadot.network/docs/maintain-westend) or [Paseo](https://wiki.polkadot.network/docs/maintain-paseo) testnet endpoints, or run a local node.
- **Polkadot.js Extension**: For wallet interactions ([install here](https://polkadot.js.org/extension/)).
- **Node.js**: For frontend (React) development.
- **Git**: To clone the repository.

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/devdan98/insuracle.git
   cd insuracle
   ```

2. **Set Up ink! Contract**:
   - Scaffold a new ink! contract:
     ```bash
     cargo contract new insuracle
     ```
   - Port the logic from `Insuracle.sol` to `contracts/insuracle/lib.rs` (see [Migration Notes](#migration-notes)).
   - Build the contract:
     ```bash
     cd contracts/insuracle
     cargo contract build
     ```

3. **Frontend Setup**:
   - Install dependencies:
     ```bash
     npm install
     ```
   - Update frontend to use `@polkadot/api` and `@polkadot/extension-dapp` for wallet and contract calls.

## Usage

### 1. Deploy the Contract
- Deploy to Westend/Paseo using [Contracts UI](https://contracts-ui.substrate.io/) or `cargo contract` CLI:
  ```bash
  cargo contract deploy --constructor new --suri //Alice --network westend
  ```
- Note the deployed contract address for frontend use.

### 2. Serve the Frontend
- Start the React frontend:
  ```bash
  cd frontend
  npm start
  ```
- Open the app in your browser and connect with Polkadot.js extension.

### 3. Interact with the Contract
- Buy insurance, update flood level, and trigger payouts via the UI.
- All transactions are signed with Polkadot.js extension accounts.

## Migration Notes

- Solidity contract logic must be rewritten in ink! (Rust). See [ink! docs](https://use.ink/) for syntax and patterns.
- Replace Ethereum-specific types (address, uint256, etc.) with ink!/Rust equivalents.
- Use Substrate events and storage for policy management.
- Replace Chainlink oracle with a mock oracle or off-chain worker for flood data.

## Project Structure

```
insuracle/
├── contracts/
│   └── insuracle/           # ink! contract (lib.rs)
├── frontend/                # React frontend (Polkadot.js integration)
├── README.md                # This file
└── ...
```

## Future Enhancements
- Integrate with a real oracle or off-chain worker for flood data.
- Support multiple policies per user.
- Add unit and integration tests for ink! contract.

## Troubleshooting
- Ensure you are using the correct Rust toolchain (`nightly` for ink!).
- If contract deployment fails, check node logs and contract build output.
- For Polkadot.js extension issues, ensure the correct network and account are selected.

## License
MIT License. See [LICENSE](./LICENSE) for details.

## Contact
For questions or feedback, open an issue on GitHub.

---

*Ported to Polkadot/ink! for Milestone 2, May 2025.*
