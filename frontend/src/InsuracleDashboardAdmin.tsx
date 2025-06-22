import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  Waves,
  Shield,
  TrendingUp,
  Wallet,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import {
  INSURACLE_ADDRESS,
  INSURACLE_ABI,
  MOCK_ORACLE_ADDRESS,
} from "./lib/contract";
import { MOCK_ORACLE_ABI } from "./lib/mockOracleAbi";

interface InsuracleDashboardAdminProps {
  setUserType?: (userType: string | null) => void;
}

export default function InsuracleDashboardAdmin({
  setUserType,
}: InsuracleDashboardAdminProps) {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [ethBalance, setEthBalance] = useState<number>(0);
  const [floodLevel, setFloodLevel] = useState<number>(-1);
  const [rawFloodLevel, setRawFloodLevel] = useState<string>("N/A");
  const [floodLevelError, setFloodLevelError] = useState<string>("");
  const [threshold, setThreshold] = useState<number>(3000);
  const [coverageAmount, setCoverageAmount] = useState<string>("");
  const [premium, setPremium] = useState<number>(0);
  const [insuranceAmount, setInsuranceAmount] = useState<number>(0);
  const [contractBalance, setContractBalance] = useState<number>(0);
  const [fundAmount, setFundAmount] = useState<string>("");
  const [newFloodLevel, setNewFloodLevel] = useState<string>("");
  const [transactionStatus, setTransactionStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingFlood, setIsUpdatingFlood] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [hasActivePolicy, setHasActivePolicy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [walletChecked, setWalletChecked] = useState(false);

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      setTransactionStatus("MetaMask not detected. Please install MetaMask.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (!accounts || accounts.length === 0) {
        setTransactionStatus(
          "Please connect your wallet to use the admin dashboard."
        );
        setIsAdmin(false);
        setWalletChecked(true);
        return;
      }
      setWalletAddress(accounts[0]);
      const adminAddress =
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266".toLowerCase();
      if (accounts[0].toLowerCase() === adminAddress) {
        setIsAdmin(true);
        setTransactionStatus("");
      } else {
        setIsAdmin(false);
        setTransactionStatus(
          "You must be connected as the admin to access this dashboard."
        );
      }
      setWalletChecked(true);
    } catch (e) {
      setTransactionStatus("Error checking wallet connection.");
      setIsAdmin(false);
      setWalletChecked(true);
      return;
    }
  };

  useEffect(() => {
    // Listen for account changes in MetaMask
    if (window.ethereum && window.ethereum.on) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (!accounts || accounts.length === 0) {
          setIsAdmin(false);
          setTransactionStatus(
            "Please connect your wallet to use the admin dashboard."
          );
          setWalletChecked(false);
        } else {
          setWalletAddress(accounts[0]);
          const adminAddress =
            "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266".toLowerCase();
          if (accounts[0].toLowerCase() === adminAddress) {
            setIsAdmin(true);
            setTransactionStatus("");
          } else {
            setIsAdmin(false);
            setTransactionStatus(
              "You must be connected as the admin to access this dashboard."
            );
          }
          setWalletChecked(true);
        }
      };
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      };
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (window.ethereum) {
        try {
          // Ensure we're on the correct network
          await switchToLocalNetwork();

          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          console.log("Connected to network:", network.chainId);

          const accounts = await provider.send("eth_requestAccounts", []);
          setWalletAddress(accounts[0]);
          const balance = await provider.getBalance(accounts[0]);
          setEthBalance(Number(ethers.formatEther(balance)));

          const contract = new ethers.Contract(
            INSURACLE_ADDRESS,
            INSURACLE_ABI,
            provider
          );
          try {
            const contractBal = await contract.getContractBalance();
            setContractBalance(Number(ethers.formatEther(contractBal)));
            const latestFlood = await contract.getLatestPrice();
            setFloodLevel(Number(latestFlood) / 1e8);
          } catch (e) {
            console.log(
              "Contract calls failed, contract may not be deployed yet:",
              e
            );
          }
        } catch (e) {
          console.error("Failed to connect to network:", e);
          setTransactionStatus(
            "Please connect to Hardhat Local network (Chain ID: 31337)"
          );
        }
      }
    };
    fetchData();
  }, [walletAddress]);

  useEffect(() => {
    const fetchAdminStatus = async () => {
      if (window.ethereum && walletAddress) {
        try {
          await switchToLocalNetwork();
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_requestAccounts", []);
          const contract = new ethers.Contract(
            INSURACLE_ADDRESS,
            INSURACLE_ABI,
            provider
          );
          // FIX: Use ethers.id to get the role hash, not call a function
          const ADMIN_ROLE = ethers.id("ADMIN_ROLE");
          const isAdmin = await contract.hasRole(ADMIN_ROLE, accounts[0]);
          setIsAdmin(isAdmin);
        } catch (e) {
          console.error("Failed to fetch admin status:", e);
          setIsAdmin(false);
        }
      }
    };
    fetchAdminStatus();
  }, [walletAddress]);

  const calculatePremium = (coverage: number) => coverage * 0.1;

  const handleCoverageChange = (value: string) => {
    setCoverageAmount(value);
    const coverage = parseFloat(value) || 0;
    setPremium(calculatePremium(coverage));
  };

  const handleUpdateFloodLevel = async () => {
    if (!window.ethereum || !newFloodLevel) return;
    setIsUpdatingFlood(true);
    setTransactionStatus("Updating flood level...");
    console.log("Attempting to update flood level to:", newFloodLevel);
    try {
      // Connect directly to the provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      console.log("Signer address:", await signer.getAddress());
      
      // Format the flood level value correctly (8 decimals)
      const floodLevelFormatted = ethers.parseUnits(newFloodLevel, 8);
      console.log("Formatted flood level for contract:", floodLevelFormatted.toString());

      // Get the contract interface to encode function data
      const mockOracleInterface = new ethers.Interface(MOCK_ORACLE_ABI);
      const data = mockOracleInterface.encodeFunctionData("updateAnswer", [floodLevelFormatted]);
      
      // Prepare the transaction
      const tx = {
        to: MOCK_ORACLE_ADDRESS,
        data: data,
        from: await signer.getAddress(),
      };

      // Estimate gas to ensure transaction will succeed
      console.log("Estimating gas...");
      const gasEstimate = await provider.estimateGas(tx);
      console.log("Gas estimate:", gasEstimate.toString());

      // Send the transaction - this will trigger MetaMask
      console.log("Sending transaction with gas estimate:", gasEstimate.toString());
      const txResponse = await signer.sendTransaction({
        ...tx,
        gasLimit: gasEstimate
      });
      
      console.log("Transaction sent:", txResponse.hash);
      setTransactionStatus("Transaction sent. Waiting for confirmation...");
      
      // Wait for transaction confirmation
      const receipt = await txResponse.wait();
      console.log("Transaction confirmed:", receipt);

      setTransactionStatus("Flood level updated successfully!");
      
      // Refresh the flood level display
      const insuracleContract = new ethers.Contract(
        INSURACLE_ADDRESS,
        INSURACLE_ABI,
        provider
      );
      const latestFlood = await insuracleContract.getLatestPrice();
      setRawFloodLevel(latestFlood.toString());
      setFloodLevel(Number(latestFlood) / 1e8);
      setNewFloodLevel(""); // Clear the input after successful update
    } catch (e: any) {
      console.error("Flood level update error:", e);
      setTransactionStatus(
        `Flood update failed! ${e.reason || e.message || "Unknown error"}`
      );
    }
    setIsUpdatingFlood(false);
  };

  const handleBuyInsurance = async () => {
    if (!window.ethereum || !coverageAmount) return;
    setIsLoading(true);
    setTransactionStatus("Processing insurance purchase...");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        INSURACLE_ADDRESS,
        INSURACLE_ABI,
        signer
      );
      const coverage = ethers.parseEther(coverageAmount);
      const calculatedPremium = ethers.parseEther(premium.toString());
      const tx = await contract.buyInsurance(coverage, {
        value: calculatedPremium,
      });
      await tx.wait();
      setTransactionStatus("Insurance purchased successfully!");
      setHasActivePolicy(true);
      setInsuranceAmount(parseFloat(coverageAmount));
      const balance = await provider.getBalance(walletAddress);
      setEthBalance(Number(ethers.formatEther(balance)));
      const contractBal = await contract.getContractBalance();
      setContractBalance(Number(ethers.formatEther(contractBal)));
    } catch (e: any) {
      console.error("Insurance purchase error:", e);
      setTransactionStatus(
        `Insurance purchase failed! ${e.reason || e.message || "Unknown error"}`
      );
    }
    setIsLoading(false);
    setTimeout(() => setTransactionStatus(""), 5000);
  };

  const handleFundContract = async () => {
    if (!window.ethereum || !fundAmount) return;
    setIsFunding(true);
    setTransactionStatus("Funding contract...");
    console.log("Attempting to fund contract with amount:", fundAmount);
    try {
      console.log("Switching to local network...");
      await switchToLocalNetwork();
      console.log("Switched to local network.");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log("Signer address:", signerAddress);

      // Check network
      const network = await provider.getNetwork();
      console.log("Current network chainId:", network.chainId.toString());
      if (network.chainId !== 31337n) {
        throw new Error(
          "Please switch to Hardhat Local network (Chain ID: 31337)"
        );
      }

      // Check if the contract exists at the address
      console.log("Checking for contract code at:", INSURACLE_ADDRESS);
      const code = await provider.getCode(INSURACLE_ADDRESS);
      if (code === "0x") {
        throw new Error(
          "Contract not found at address. Please ensure the contract is deployed."
        );
      }
      console.log("Contract code found.");

      const value = ethers.parseEther(fundAmount);
      console.log("Funding value (wei):", value.toString());

      // Prepare transaction
      const tx = {
        to: INSURACLE_ADDRESS,
        value: value,
        from: signerAddress,
      };

      // Estimate gas
      console.log("Estimating gas...");
      const gasEstimate = await provider.estimateGas(tx);
      console.log("Gas estimate:", gasEstimate.toString());

      // Send transaction - this should trigger MetaMask
      console.log("Sending transaction...");
      const txResponse = await signer.sendTransaction({
        ...tx,
        gasLimit: gasEstimate
      });
      
      console.log("Transaction sent:", txResponse.hash);
      setTransactionStatus("Transaction sent. Waiting for confirmation...");
      
      const receipt = await txResponse.wait();
      console.log("Transaction confirmed:", receipt);

      setTransactionStatus("Contract funded successfully!");

      // Refresh balances
      const balance = await provider.getBalance(walletAddress);
      setEthBalance(Number(ethers.formatEther(balance)));
      const contractBal = await provider.getBalance(INSURACLE_ADDRESS);
      setContractBalance(Number(ethers.formatEther(contractBal)));
    } catch (e: any) {
      console.error("Contract funding error:", e);
      setTransactionStatus(
        `Funding failed! ${e.reason || e.message || "Unknown error"}`
      );
    }
    setIsFunding(false);
  };

  const handleTriggerPayout = async () => {
    if (!window.ethereum) return;
    setIsLoading(true);
    setTransactionStatus("Triggering payout...");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        INSURACLE_ADDRESS,
        INSURACLE_ABI,
        signer
      );
      const tx = await contract.triggerPayout();
      await tx.wait();
      setTransactionStatus("Payout triggered successfully!");
      setHasActivePolicy(false);
      setInsuranceAmount(0);
      // Update balances
      const balance = await provider.getBalance(walletAddress);
      setEthBalance(Number(ethers.formatEther(balance)));
      const contractBal = await contract.getContractBalance();
      setContractBalance(Number(ethers.formatEther(contractBal)));
    } catch (e: any) {
      console.error("Payout trigger error:", e);
      setTransactionStatus(
        `Payout failed! ${e.reason || e.message || "Unknown error"}`
      );
    }
    setIsLoading(false);
    setTimeout(() => setTransactionStatus(""), 5000);
  };

  const addLocalNetwork = async () => {
    if (!window.ethereum) return;

    // Detect if we're in Codespaces
    const isCodespaces =
      window.location.hostname.includes("app.github.dev") ||
      window.location.hostname.includes("github.dev");

    const rpcUrl = isCodespaces
      ? "https://expert-couscous-4j6674wqj9jr2q7xx-8545.app.github.dev"
      : "http://localhost:8545";

    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x7a69", // 31337 in hex
            chainName: "Hardhat Local",
            nativeCurrency: {
              name: "ETH",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: [rpcUrl],
            blockExplorerUrls: null,
          },
        ],
      });
      setTransactionStatus(`Network added with RPC: ${rpcUrl}`);
    } catch (error) {
      console.error("Failed to add network:", error);
      setTransactionStatus(`Failed to add network. RPC URL: ${rpcUrl}`);
    }
  };

  const switchToLocalNetwork = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x7a69" }],
      });
    } catch (error) {
      if (error.code === 4902) {
        // Network not added yet, add it
        await addLocalNetwork();
      } else {
        console.error("Failed to switch network:", error);
      }
    }
  };

  const roleStatuses = [
    { name: "Admin", status: true },
    { name: "Oracle Updater", status: true },
    { name: "Insurance Admin", status: true },
  ];

  // Only show admin dashboard if isAdmin is true
  if (!walletChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="bg-black/70 p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Admin Dashboard
          </h2>
          <p className="text-white/80 mb-2">
            Please connect your wallet to continue.
          </p>
          <button
            onClick={handleConnectWallet}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
          >
            Connect Wallet
          </button>
          {transactionStatus && (
            <div className="mt-4 text-red-400">{transactionStatus}</div>
          )}
        </div>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="bg-black/70 p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-white/80 mb-2">
            You must be connected as the admin to access this dashboard.
          </p>
          <p className="text-white/60 text-sm mb-4">
            Admin address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
          </p>
          <button
            onClick={() => setUserType && setUserType(null)}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 font-sans">
      <header className="flex items-center justify-between p-4 bg-white shadow-md">
        <div className="flex items-center">
          {setUserType && (
            <button
              onClick={() => setUserType(null)}
              className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          )}
          <h1 className="text-3xl font-bold text-blue-600">Insuracle</h1>
          <span className="ml-4 text-sm font-semibold text-gray-500">
            Admin Dashboard
          </span>
        </div>
        <div className="flex items-center">
          {walletAddress ? (
            <div className="text-right">
              <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {walletAddress}
              </p>
              <p className="text-xs text-gray-600">ETH: {ethBalance.toFixed(4)}</p>
            </div>
          ) : (
            <button
              onClick={handleConnectWallet}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      <main className="flex-grow p-8">
        {!walletAddress ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
            <p className="text-xl font-semibold">
              Please connect your wallet to continue.
            </p>
            <p className="text-gray-600"> {transactionStatus}</p>
          </div>
        ) : !isAdmin ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-xl font-semibold">
              You are not authorized to view this page.
            </p>
            <p className="text-gray-600">{transactionStatus}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Stats */}
            <div className="lg:col-span-1 space-y-6">
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Live Data</h2>
                <div className="flex items-center text-4xl font-bold text-blue-600">
                  <Waves className="w-10 h-10 mr-4" />
                  <span>
                    {floodLevel === -1
                      ? "Loading..."
                      : `${floodLevel.toFixed(4)} feet`}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Raw Value: {rawFloodLevel}
                </div>
                {floodLevelError && (
                  <div className="text-xs text-red-500 mt-2">
                    {floodLevelError}
                  </div>
                )}
              </div>
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Contract Status</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Contract Balance:</span>
                    <span className="font-mono text-green-600">
                      {contractBalance.toFixed(4)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Active Policies:</span>
                    <span className="font-mono">{hasActivePolicy ? 1 : 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Insurance Amount:</span>
                    <span className="font-mono">
                      {insuranceAmount.toFixed(2)} ETH
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column: Actions */}
            <div className="lg:col-span-1 space-y-6">
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">
                  Manually Update Flood Level
                </h2>
                <div className="flex flex-col space-y-4">
                  <input
                    type="number"
                    value={newFloodLevel}
                    onChange={(e) => setNewFloodLevel(e.target.value)}
                    placeholder="Enter new flood level in feet"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleUpdateFloodLevel}
                    disabled={isUpdatingFlood || !newFloodLevel}
                    className="w-full px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isUpdatingFlood ? "Updating..." : "Update Flood Level"}
                  </button>
                </div>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Fund Contract</h2>
                <div className="flex flex-col space-y-4">
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="Enter amount in ETH"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleFundContract}
                    disabled={isFunding || !fundAmount}
                    className="w-full px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isFunding ? "Funding..." : "Fund Contract"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Transactions */}
            <div className="lg:col-span-1 p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Transaction Status</h2>
              <div className="h-full flex items-center justify-center">
                {transactionStatus ? (
                  <div className="flex items-center space-x-2">
                    {isLoading || isUpdatingFlood || isFunding ? (
                      <div
                        className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"
                        role="status"
                      ></div>
                    ) : transactionStatus.includes("failed") ||
                      transactionStatus.includes("error") ? (
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                    <p className="text-gray-700 text-sm">
                      {transactionStatus}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    No recent transactions.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
