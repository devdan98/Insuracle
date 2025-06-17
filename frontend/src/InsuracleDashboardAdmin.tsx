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
  MOCK_ORACLE_ABI,
} from "./lib/contract";

interface InsuracleDashboardAdminProps {
  setUserType?: (userType: string | null) => void;
}

export default function InsuracleDashboardAdmin({
  setUserType,
}: InsuracleDashboardAdminProps) {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [ethBalance, setEthBalance] = useState<number>(0);
  const [floodLevel, setFloodLevel] = useState<number>(0);
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
  }, []);

  useEffect(() => {
    const fetchAdminStatus = async () => {
      if (window.ethereum) {
        try {
          await switchToLocalNetwork();
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_requestAccounts", []);
          const contract = new ethers.Contract(
            INSURACLE_ADDRESS,
            INSURACLE_ABI,
            provider
          );
          // Assume contract has a public 'hasRole' method and ADMIN_ROLE constant
          const ADMIN_ROLE = ethers.id("ADMIN_ROLE");
          const isAdmin = await contract.hasRole(ADMIN_ROLE, accounts[0]);
          setIsAdmin(isAdmin);
        } catch (e) {
          setIsAdmin(false);
        }
      }
    };
    fetchAdminStatus();
  }, []);

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
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const mockOracleContract = new ethers.Contract(
        MOCK_ORACLE_ADDRESS,
        MOCK_ORACLE_ABI,
        signer
      );
      // Convert flood level to proper format (8 decimals)
      const floodLevelFormatted = Math.floor(parseFloat(newFloodLevel) * 1e8);
      const tx = await mockOracleContract.updateAnswer(floodLevelFormatted);
      await tx.wait();
      setTransactionStatus("Flood level updated successfully!");
      // Refresh the flood level display
      const insuracleContract = new ethers.Contract(
        INSURACLE_ADDRESS,
        INSURACLE_ABI,
        provider
      );
      const latestFlood = await insuracleContract.getLatestPrice();
      setFloodLevel(Number(latestFlood) / 1e8);
      setNewFloodLevel(""); // Clear the input after successful update
    } catch (e: any) {
      console.error("Flood level update error:", e);
      setTransactionStatus(
        `Flood update failed! ${e.reason || e.message || "Unknown error"}`
      );
    }
    setIsUpdatingFlood(false);
    setTimeout(() => setTransactionStatus(""), 5000);
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
    try {
      // Ensure we're on the correct network first
      await switchToLocalNetwork();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Check network
      const network = await provider.getNetwork();
      if (network.chainId !== 31337n) {
        throw new Error(
          "Please switch to Hardhat Local network (Chain ID: 31337)"
        );
      }

      // Check if the contract exists at the address
      const code = await provider.getCode(INSURACLE_ADDRESS);
      if (code === "0x") {
        throw new Error(
          "Contract not found at address. Please ensure the contract is deployed."
        );
      }

      // Estimate gas first
      const gasEstimate = await provider.estimateGas({
        to: INSURACLE_ADDRESS,
        value: ethers.parseEther(fundAmount),
        from: await signer.getAddress(),
      });

      // Send transaction with estimated gas
      const tx = await signer.sendTransaction({
        to: INSURACLE_ADDRESS,
        value: ethers.parseEther(fundAmount),
        gasLimit: (gasEstimate * 120n) / 100n, // Add 20% buffer
      });

      await tx.wait();
      setTransactionStatus("Contract funded successfully!");

      const contract = new ethers.Contract(
        INSURACLE_ADDRESS,
        INSURACLE_ABI,
        provider
      );
      const contractBal = await contract.getContractBalance();
      setContractBalance(Number(ethers.formatEther(contractBal)));
      const balance = await provider.getBalance(walletAddress);
      setEthBalance(Number(ethers.formatEther(balance)));
      setFundAmount(""); // Clear the input after successful funding
    } catch (e: any) {
      console.error("Funding error:", e);
      let errorMessage = "Unknown error";
      if (e.message) {
        errorMessage = e.message;
      } else if (e.reason) {
        errorMessage = e.reason;
      } else if (e.code === "CALL_EXCEPTION") {
        errorMessage =
          "Transaction failed - contract may not be deployed or network issue";
      } else if (e.code === "UNKNOWN_ERROR" && e.message?.includes("404")) {
        errorMessage =
          "Network connection failed. Please ensure you are connected to Hardhat Local network";
      }
      setTransactionStatus(`Funding failed! ${errorMessage}`);
    }
    setIsFunding(false);
    setTimeout(() => setTransactionStatus(""), 5000);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setUserType && setUserType(null)}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </button>
            <div className="flex items-center justify-center">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-lg">
                <Waves className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                👑 ADMIN
              </div>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-gray-300 text-sm mb-2">Insuracle Logo</p>
            <h1 className="text-3xl font-bold text-white mb-2">
              Insuracle: Flood Insurance Oracle
            </h1>
            <p className="text-gray-300 text-lg">
              Buy flood insurance and claim payouts if flood levels exceed the
              threshold.
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Network connection status */}
          <div className="mb-6">
            <div className="flex items-center justify-between bg-black/20 rounded-lg p-4">
              <div className="flex flex-col">
                <span className="text-white font-medium">Network Status</span>
                <span className="text-gray-400 text-xs mt-1">
                  RPC:{" "}
                  {window.location.hostname.includes("app.github.dev") ||
                  window.location.hostname.includes("github.dev")
                    ? "Codespaces URL"
                    : "localhost:8545"}
                </span>
              </div>
              <button
                onClick={switchToLocalNetwork}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-all duration-200"
              >
                Connect to Hardhat Local
              </button>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Wallet className="h-5 w-5 text-purple-300" />
                <span className="text-white font-medium">Connected Wallet</span>
              </div>
            </div>
            <div className="bg-black/20 rounded-lg p-4 mb-4">
              <p className="text-gray-300 font-mono text-sm">
                Connected: {walletAddress}
              </p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-white">
                Your Balance: {ethBalance.toFixed(3)} ETH
              </span>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-blue-300" />
              Flood Level
            </h3>
            <div className="space-y-4">
              <div
                className={`rounded-lg p-6 ${
                  floodLevel >= threshold
                    ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-400/30"
                    : "bg-gradient-to-r from-blue-500/20 to-purple-500/20"
                }`}
              >
                <div className="text-center">
                  <div
                    className={`text-3xl font-bold mb-2 ${
                      floodLevel >= threshold ? "text-red-300" : "text-white"
                    }`}
                  >
                    {floodLevel.toFixed(1)} units
                  </div>
                  <div className="text-gray-300">
                    (Threshold: {threshold.toFixed(1)})
                  </div>
                  {floodLevel >= threshold && (
                    <div className="mt-2 text-red-300 font-semibold">
                      ⚠️ THRESHOLD EXCEEDED
                    </div>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="bg-black/20 rounded-lg p-4 mt-2">
                  <div className="space-y-3">
                    <input
                      type="number"
                      value={newFloodLevel}
                      onChange={(e) => setNewFloodLevel(e.target.value)}
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="New flood level"
                    />
                    <button
                      onClick={handleUpdateFloodLevel}
                      disabled={isUpdatingFlood || !newFloodLevel}
                      className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
                    >
                      {isUpdatingFlood ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </div>
                      ) : (
                        "Update Flood Level"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Shield className="mr-2 h-5 w-5 text-purple-300" />
              Insurance Policy
            </h3>
            <div className="space-y-4">
              {hasActivePolicy ? (
                <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-6">
                  <h4 className="text-green-200 font-semibold text-lg mb-4">
                    ✓ Active Insurance Policy
                  </h4>
                  <div className="space-y-2">
                    <p className="text-white">
                      <span className="text-green-300">Coverage:</span>{" "}
                      {insuranceAmount.toFixed(1)} ETH
                    </p>
                    <p className="text-white">
                      <span className="text-green-300">Status:</span> Active
                    </p>
                    {floodLevel >= 3000 && (
                      <div className="mt-4">
                        <button
                          onClick={handleTriggerPayout}
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Triggering...
                            </div>
                          ) : (
                            "🚨 Trigger Emergency Payout"
                          )}
                        </button>
                        <p className="text-red-300 text-sm mt-2">
                          ⚠️ Flood threshold exceeded - payout available
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4">
                  <p className="text-yellow-200 font-medium">
                    No active policy
                  </p>
                </div>
              )}

              {!hasActivePolicy && (
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="space-y-3">
                    <input
                      type="number"
                      value={coverageAmount}
                      onChange={(e) => handleCoverageChange(e.target.value)}
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Coverage amount (ETH)"
                    />
                    <div className="bg-black/30 rounded-lg p-3">
                      <p className="text-gray-300">
                        Premium:{" "}
                        <span className="text-white font-bold">
                          {premium.toFixed(1)} ETH
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={handleBuyInsurance}
                      disabled={
                        isLoading ||
                        !coverageAmount ||
                        parseFloat(coverageAmount) <= 0
                      }
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        <>
                          <Shield className="inline mr-2 h-5 w-5" />
                          Buy Insurance
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              Contract Info
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-black/20 rounded-lg p-4">
                <p className="text-gray-300 text-sm">Insurance Amount</p>
                <p className="text-white font-bold text-lg">
                  {insuranceAmount} units
                </p>
              </div>
              <div className="bg-black/20 rounded-lg p-4">
                <p className="text-gray-300 text-sm">Contract Balance</p>
                <p className="text-white font-bold text-lg">
                  {contractBalance.toFixed(1)} ETH
                </p>
              </div>
            </div>
          </div>

          {isAdmin && (
            <>
              <div className="bg-black/20 rounded-lg p-4 mb-8">
                <div className="space-y-3">
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Fund amount (ETH)"
                  />
                  <button
                    onClick={handleFundContract}
                    disabled={
                      isFunding || !fundAmount || parseFloat(fundAmount) <= 0
                    }
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
                  >
                    {isFunding ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Funding...
                      </div>
                    ) : (
                      "Fund Contract"
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Always show roles section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Roles</h3>
            <div className="space-y-3">
              {roleStatuses.map((role, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-black/20 rounded-lg p-4"
                >
                  <span className="text-white font-medium">{role.name}</span>
                  <span
                    className={`font-semibold ${
                      role.status ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {role.status ? "Yes" : "No"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {transactionStatus && (
            <div className="mt-6">
              <div
                className={`flex items-center p-4 rounded-lg ${
                  transactionStatus.includes("successfully")
                    ? "bg-green-500/20 border border-green-400/30"
                    : "bg-blue-500/20 border border-blue-400/30"
                }`}
              >
                {transactionStatus.includes("successfully") ? (
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-blue-400 mr-3" />
                )}
                <span
                  className={`font-medium ${
                    transactionStatus.includes("successfully")
                      ? "text-green-200"
                      : "text-blue-200"
                  }`}
                >
                  {transactionStatus}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Powered by blockchain technology and smart contracts
          </p>
        </div>
      </div>
    </div>
  );
}
