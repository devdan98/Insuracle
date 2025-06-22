import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { INSURACLE_ADDRESS, INSURACLE_ABI, MOCK_ORACLE_ADDRESS, MOCK_ORACLE_ABI } from "./lib/contract";

const InsuracleDashboard: React.FC = () => {
  // State variables for flood levels
  const [floodLevel, setFloodLevel] = useState<number>(-1);
  const [rawFloodLevel, setRawFloodLevel] = useState<string>("Loading...");
  const [oracleFloodLevel, setOracleFloodLevel] = useState<string>("Loading...");
  const [floodLevelError, setFloodLevelError] = useState<string>("");
  const [oracleError, setOracleError] = useState<string>("");
  
  // State for connection status
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [account, setAccount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setAccount(accounts[0]);
        setIsConnected(true);
        return true;
      } catch (error) {
        console.error("Failed to connect wallet:", error);
        return false;
      }
    }
    return false;
  };

  const fetchOracleData = async () => {
    if (!window.ethereum) {
      console.error("No ethereum provider found");
      setFloodLevelError("No ethereum provider found");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Ensure we're connected to the right network (Hardhat localhost)
      const network = await provider.getNetwork();
      console.log("Connected to network:", network.chainId);

      // Get flood level from Insuracle contract
      try {
        console.log("Fetching from Insuracle at:", INSURACLE_ADDRESS);
        setFloodLevelError("");
        
        const insuracleContract = new ethers.Contract(
          INSURACLE_ADDRESS,
          INSURACLE_ABI,
          provider
        );
        
        console.log("Calling getLatestPrice()...");
        const latestPrice = await insuracleContract.getLatestPrice();
        console.log("Raw price from Insuracle:", latestPrice.toString());
        
        setRawFloodLevel(latestPrice.toString());
        const formattedFlood = Number(latestPrice) / 1e8;
        setFloodLevel(formattedFlood);
        
      } catch (e: any) {
        console.error("Error fetching from Insuracle:", e);
        setFloodLevelError(e.message || "Could not fetch flood level from Insuracle");
        setRawFloodLevel("Error");
        setFloodLevel(-1);
      }

      // Get flood level directly from oracle
      try {
        console.log("Fetching from Oracle at:", MOCK_ORACLE_ADDRESS);
        setOracleError("");
        
        const oracleContract = new ethers.Contract(
          MOCK_ORACLE_ADDRESS,
          MOCK_ORACLE_ABI,
          provider
        );
        
        console.log("Calling latestAnswer()...");
        const latestAnswer = await oracleContract.latestAnswer();
        console.log("Raw answer from Oracle:", latestAnswer.toString());
        
        setOracleFloodLevel(latestAnswer.toString());
        
      } catch (e: any) {
        console.error("Error fetching from Oracle:", e);
        setOracleError(e.message || "Could not fetch from Oracle");
        setOracleFloodLevel("Error");
      }

    } catch (e: any) {
      console.error("Provider error:", e);
      setFloodLevelError("Provider error: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const connected = await connectWallet();
      if (connected) {
        await fetchOracleData();
      }
    };
    
    init();
    
    // Set up auto-refresh every 5 seconds
    const interval = setInterval(() => {
      if (isConnected) {
        fetchOracleData();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isConnected]);

  const formatFloodLevel = (value: number): string => {
    if (value === -1) return "Not Available";
    return value.toFixed(2);
  };

  const formatRawValue = (value: string): string => {
    if (value === "Loading..." || value === "Error" || value === "N/A") {
      return value;
    }
    try {
      const num = BigInt(value);
      return `${num.toString()} (${(Number(num) / 1e8).toFixed(2)} normalized)`;
    } catch {
      return value;
    }
  };

  return (
    <div className="insuracle-dashboard">
      <h1>Insuracle Flood Monitoring Dashboard</h1>
      
      {!isConnected ? (
        <div className="connection-status">
          <p>Please connect your wallet to view oracle data</p>
          <button onClick={connectWallet}>Connect Wallet</button>
        </div>
      ) : (
        <>
          <div className="connection-status">
            <p>Connected: {account.substring(0, 6)}...{account.substring(38)}</p>
          </div>

          <div className="oracle-data-container">
            <h2>Oracle Data</h2>
            
            <div className="data-section">
              <h3>Insuracle Contract Data</h3>
              <div className="data-item">
                <label>Contract Address:</label>
                <span className="mono">{INSURACLE_ADDRESS}</span>
              </div>
              <div className="data-item">
                <label>Flood Level (Normalized):</label>
                <span className={floodLevel === -1 ? "error" : "value"}>
                  {formatFloodLevel(floodLevel)}
                </span>
              </div>
              <div className="data-item">
                <label>Raw Value:</label>
                <span className="mono">{formatRawValue(rawFloodLevel)}</span>
              </div>
              {floodLevelError && (
                <div className="error-message">
                  Error: {floodLevelError}
                </div>
              )}
            </div>

            <div className="data-section">
              <h3>Direct Oracle Data (MockV3Aggregator)</h3>
              <div className="data-item">
                <label>Oracle Address:</label>
                <span className="mono">{MOCK_ORACLE_ADDRESS}</span>
              </div>
              <div className="data-item">
                <label>Latest Answer:</label>
                <span className="mono">{formatRawValue(oracleFloodLevel)}</span>
              </div>
              {oracleError && (
                <div className="error-message">
                  Error: {oracleError}
                </div>
              )}
            </div>

            <div className="refresh-section">
              <button onClick={fetchOracleData} disabled={isLoading}>
                {isLoading ? "Loading..." : "Refresh Data"}
              </button>
              <p className="auto-refresh-note">Auto-refreshing every 5 seconds</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InsuracleDashboard;
