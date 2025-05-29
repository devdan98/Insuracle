# Insuracle: Decentralized Flood Insurance Proof of Concept (Polkadot/ink! Edition)

## Overview

**Insuracle** is a proof of concept (PoC) for a decentralized flood insurance platform, ported to the Polkadot ecosystem. This version demonstrates automated insurance purchases and payouts triggered by flood level data from an oracle, using a smart contract written in [ink!](https://use.ink/) (Rust) and deployed to a Substrate-based testnet (e.g., Westend) or a local contracts node.

**Key features:**
- Contracts written in ink! (Rust) and deployable to a Polkadot testnet (Westend) or local contracts node.
- Users interact with the dApp using the [Polkadot.js browser extension](https://polkadot.js.org/extension/).
- Frontend uses `@polkadot/api` and `@polkadot/extension-dapp` for wallet and contract interaction.
- Full local development workflow supported with [substrate-contracts-node](https://github.com/paritytech/substrate-contracts-node).

---

## Prerequisites

- **Rust**: Install from [rustup.rs](https://rustup.rs/)
- **cargo-contract**: For building and deploying ink! contracts
  ```bash
  cargo install cargo-contract --force
  ```
- **Substrate Contracts Node**: For local testing ([download here](https://github.com/paritytech/substrate-contracts-node/releases)) **OR**:
  ```bash
  cargo install contracts-node
  ```
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
   - The contract is in `insuracle/lib.rs`.
   - Build the contract:
     ```bash
     cd insuracle
     cargo contract build --release
     ```
   - The compiled contract bundle will be in `insuracle/target/ink/insuracle.contract`.

3. **Frontend Setup**:
   - Go to the frontend directory:
     ```bash
     cd ../frontend
     npm install
     ```
   - The frontend is a Vite React app using Polkadot.js libraries.

## Local Development & Testing

### 1. Run a Local Contracts Node

Download and run the [substrate-contracts-node](https://github.com/paritytech/substrate-contracts-node/releases):

```bash
wget https://github.com/paritytech/substrate-contracts-node/releases/latest/download/substrate-contracts-node-linux-x86_64.tar.xz

# Extract and run

# (If on Codespaces or Linux)
tar -xf substrate-contracts-node-linux-x86_64.tar.xz
./substrate-contracts-node --dev
```

Or if installed using cargo:

```bash
substrate-contracts-node
```

- The node will listen on `ws://127.0.0.1:9944` by default.
- If using GitHub Codespaces, forward port 9944 and use the forwarded URL in Polkadot.js Apps and your frontend.

### 2. Deploy the Contract Locally

1. Open [Polkadot.js Apps](https://polkadot.js.org/apps/).
2. Connect to your local node (`ws://127.0.0.1:9944` or your Codespaces forwarded URL).
3. Go to the **Contracts** tab → **Upload & deploy code**.
4. Upload `insuracle/target/ink/insuracle.contract`.
5. Set the constructor parameter (e.g., `payout_threshold = 100`), endowment, and gas (defaults are fine for local).
6. Deploy and copy the contract address.

### 3. Update the Frontend

- Set the contract address in `frontend/src/App.jsx`.
- Copy the full contents of `insuracle/target/ink/insuracle.json` to `frontend/public/insuracle_abi.json`.
- If using Codespaces, set the endpoint in the frontend to your forwarded URL.

### 4. Run the Frontend

```bash
cd frontend
npm run dev
```
- Open the app in your browser and connect with the Polkadot.js extension.
- Test the full dApp flow: buy insurance, update flood level, trigger payout.

## Deployment to Westend

1. Make sure you have a funded Westend account (get WND from a faucet).
2. Go to [Polkadot.js Apps](https://polkadot.js.org/apps/?rpc=wss://westend-rpc.polkadot.io#/contracts) and select the Westend network.
3. Upload and deploy the contract as above, but on Westend.
4. Update your frontend with the new contract address and ensure the endpoint is set to Westend.

## Project Structure

```
insuracle/
├── insuracle/                 # ink! contract (lib.rs, Cargo.toml)
│   └── target/ink/            # Compiled contract bundle
├── frontend/                  # React frontend (Polkadot.js integration)
│   └── public/insuracle_abi.json # Contract ABI for frontend
├── README.md                  # This file
└── ...
```

## Troubleshooting
- Ensure you are using the correct Rust toolchain (`nightly` for ink!).
- If contract deployment fails, check node logs and contract build output.
- For Polkadot.js extension issues, ensure the correct network and account are selected.
- If you do not see the Contracts tab in Polkadot.js Apps, make sure you are connected to a contracts-enabled chain (Westend or local contracts node) and have enabled all sections in Settings.
- For Codespaces, ensure port 9944 is forwarded and use the correct endpoint in your frontend and Polkadot.js Apps.

## Future Enhancements
- Integrate with a real oracle or off-chain worker for flood data.
- Support multiple policies per user.
- Add unit and integration tests for ink! contract.

## License
MIT License. See [LICENSE](./LICENSE) for details.

## Contact
For questions or feedback, open an issue on GitHub.

---

*Ported to Polkadot/ink! for Milestone 2, May 2025.*
