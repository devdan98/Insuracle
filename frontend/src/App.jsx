import { useEffect, useState } from "react";
import { web3Enable, web3Accounts, web3FromSource } from "@polkadot/extension-dapp";
import { ApiPromise, WsProvider } from "@polkadot/api";
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

const CONTRACT_ADDRESS = "<PASTE_DEPLOYED_CONTRACT_ADDRESS_HERE>";
const CONTRACT_ABI = await fetch("/insuracle_abi.json").then(r => r.json()); // Place ABI JSON in public/
const WS_PROVIDER = "wss://westend-rpc.polkadot.io"; // Or your local node

function App() {
  const [api, setApi] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [floodLevel, setFloodLevel] = useState(0);
  const [policy, setPolicy] = useState(null);
  const [payoutThreshold, setPayoutThreshold] = useState(100);
  const [buyAmount, setBuyAmount] = useState(0);
  const [buyPayout, setBuyPayout] = useState(0);
  const [isOwner, setIsOwner] = useState(false);

  // Connect to node and extension
  useEffect(() => {
    (async () => {
      await web3Enable("Insuracle dApp");
      const allAccounts = await web3Accounts();
      setAccounts(allAccounts);
      if (allAccounts.length > 0) setSelectedAccount(allAccounts[0]);
      const provider = new WsProvider(WS_PROVIDER);
      const api = await ApiPromise.create({ provider });
      setApi(api);
      // @ts-ignore
      const contract = new api.ContractPromise(api, CONTRACT_ABI, CONTRACT_ADDRESS);
      setContract(contract);
    })();
  }, []);

  // Fetch flood level and policy
  useEffect(() => {
    if (!contract || !selectedAccount) return;
    (async () => {
      const { output: flood } = await contract.query.getFloodLevel(selectedAccount.address, {});
      setFloodLevel(flood?.toNumber() || 0);
      const { output: pol } = await contract.query.getPolicy(selectedAccount.address, {});
      setPolicy(pol?.toHuman() || null);
      const { output: owner } = await contract.query.owner(selectedAccount.address, {});
      setIsOwner(owner?.toString() === selectedAccount.address);
    })();
  }, [contract, selectedAccount]);

  // Buy insurance
  const buyPolicy = async () => {
    if (!contract || !selectedAccount) return;
    const injector = await web3FromSource(selectedAccount.meta.source);
    await contract.tx.buyPolicy({ value: buyAmount, gasLimit: -1 }, buyPayout)
      .signAndSend(selectedAccount.address, { signer: injector.signer });
  };

  // Update flood level (owner only)
  const updateFlood = async (level) => {
    if (!contract || !selectedAccount) return;
    const injector = await web3FromSource(selectedAccount.meta.source);
    await contract.tx.updateFloodLevel({ gasLimit: -1 }, level)
      .signAndSend(selectedAccount.address, { signer: injector.signer });
  };

  // Trigger payout
  const triggerPayout = async () => {
    if (!contract || !selectedAccount) return;
    const injector = await web3FromSource(selectedAccount.meta.source);
    await contract.tx.triggerPayout({ gasLimit: -1 })
      .signAndSend(selectedAccount.address, { signer: injector.signer });
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <div style={{ padding: 24 }}>
        <h1>Insuracle Flood Insurance (Polkadot/ink!)</h1>
        <div>
          <label>Account: </label>
          <select onChange={e => setSelectedAccount(accounts[e.target.selectedIndex])}>
            {accounts.map(acc => (
              <option key={acc.address}>{acc.address}</option>
            ))}
          </select>
        </div>
        <div>Flood Level: {floodLevel}</div>
        <div>Your Policy: {policy ? JSON.stringify(policy) : "None"}</div>
        <div>
          <h2>Buy Insurance</h2>
          <input type="number" placeholder="Premium (planck)" onChange={e => setBuyAmount(Number(e.target.value))} />
          <input type="number" placeholder="Payout (planck)" onChange={e => setBuyPayout(Number(e.target.value))} />
          <button onClick={buyPolicy}>Buy Policy</button>
        </div>
        {isOwner && (
          <div>
            <h2>Update Flood Level (Owner Only)</h2>
            <input type="number" placeholder="Flood Level" onBlur={e => updateFlood(Number(e.target.value))} />
          </div>
        )}
        <div>
          <h2>Trigger Payout</h2>
          <button onClick={triggerPayout}>Trigger</button>
        </div>
      </div>
    </>
  )
}

export default App
