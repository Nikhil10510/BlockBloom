import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { BrowserProvider, Contract, formatEther } from "ethers";
import { io } from "socket.io-client";
import contracts from "../contracts.json";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
const EXPECTED_CHAIN_ID = import.meta.env.VITE_REQUIRED_CHAIN_ID || "31337";

function DAODashboard() {
  const { address } = useParams();
  const [daoName, setDaoName] = useState("");
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tokenBalance, setTokenBalance] = useState("0");
  const [errorMessage, setErrorMessage] = useState("");
  const [votingPower, setVotingPower] = useState("0");

  // Create proposal form
  const [proposalDesc, setProposalDesc] = useState("");
  const [proposalDuration, setProposalDuration] = useState("5");
  const [proposalOptions, setProposalOptions] = useState(["Yes", "No"]);

  // Vote state
  const [votingOn, setVotingOn] = useState(null);

  // AI Summary state
  const [aiSummaries, setAiSummaries] = useState({});
  const [summarizing, setSummarizing] = useState({});
  const [geminiApiKey, setGeminiApiKey] = useState(
    localStorage.getItem("GEMINI_API_KEY") || import.meta.env.VITE_GEMINI_API_KEY || ""
  );
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState("");
  const [pendingSummaryArgs, setPendingSummaryArgs] = useState(null);

  useEffect(() => {
    connectAndLoad();

    // Connect to WebSocket server on Port 5000
    const socket = io(API_BASE.replace('/api', ''));

    // Subscribe to this DAO's update channel
    socket.emit("join:dao", address);

    // Listen to real-time events and refresh state
    socket.on("proposal:created", (newProp) => {
      if (newProp.daoAddress.toLowerCase() === address.toLowerCase()) {
        console.log("Real-time proposal created:", newProp);
        connectAndLoad();
      }
    });

    socket.on("vote:cast", (voteInfo) => {
      if (voteInfo.daoAddress.toLowerCase() === address.toLowerCase()) {
        console.log("Real-time vote cast:", voteInfo);
        connectAndLoad();
      }
    });

    // Handle MetaMask account and chain changes dynamically
    let handleAccountsChanged;
    let handleChainChanged;

    if (window.ethereum) {
      handleAccountsChanged = (accounts) => {
        console.log("MetaMask accounts changed on Dashboard:", accounts);
        connectAndLoad();
      };
      handleChainChanged = (chainId) => {
        console.log("MetaMask network chain changed on Dashboard:", chainId);
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      socket.disconnect();
      if (window.ethereum) {
        if (handleAccountsChanged) window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        if (handleChainChanged) window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [address]);

  const getProvider = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is required to use BlockBloom.");
    }

    const provider = new BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    if (String(network.chainId) !== EXPECTED_CHAIN_ID) {
      throw new Error(
        `Please switch MetaMask to the local Hardhat network (chainId ${EXPECTED_CHAIN_ID}). Current chainId: ${network.chainId}.`
      );
    }

    return provider;
  };

  const ensureContractDeployed = async (provider, address, name) => {
    const code = await provider.getCode(address);
    if (!code || code === "0x" || code === "0x0") {
      throw new Error(`${name} contract is not deployed at ${address} on the current network.`);
    }
  };

  const connectAndLoad = async () => {
    try {
      setErrorMessage("");
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const addressString = await signer.getAddress();
      setAccount(addressString);
      
      // Load user token details
      await ensureContractDeployed(provider, contracts.BloomToken.address, "BloomToken");
      const token = new Contract(contracts.BloomToken.address, contracts.BloomToken.abi, provider);
      const bal = await token.balanceOf(addressString);
      const votes = await token.getVotes(addressString);
      setTokenBalance(parseFloat(formatEther(bal)).toLocaleString(undefined, { maximumFractionDigits: 2 }));
      setVotingPower(parseFloat(formatEther(votes)).toLocaleString(undefined, { maximumFractionDigits: 2 }));

      await loadDAO(provider);
    } catch (err) {
      setErrorMessage(err?.message || "Unable to connect to the DAO.");
      console.error(err);
    }
  };

  const loadDAO = async (provider) => {
    try {
      setErrorMessage("");
      setLoading(true);

      // Fetch DAO details from blockchain for Name
      await ensureContractDeployed(provider, address, "Governance");
      const gov = new Contract(address, contracts.Governance.abi, provider);
      const name = await gov.name();
      setDaoName(name);

      const daoBloomToken = await gov.bloomToken();
      if (daoBloomToken.toLowerCase() !== contracts.BloomToken.address.toLowerCase()) {
        throw new Error(
          `This DAO was created with a stale BloomToken address (${daoBloomToken}). Recreate the DAO after deploying the current BloomToken contract at ${contracts.BloomToken.address}.`
        );
      }

      // 1. Try to fetch proposals from MongoDB fast REST API first
      try {
        const response = await fetch(`${API_BASE}/proposals?daoAddress=${address}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const mapped = result.data.map(p => ({
              id: Number(p.proposalId),
              proposer: p.proposer,
              description: p.description,
              endTime: Math.floor(new Date(p.endTime).getTime() / 1000),
              executed: p.executed,
              optionNames: p.options.map(o => o.name),
              optionVotes: p.options.map(o => parseFloat(formatEther(o.voteCount))),
              target: p.target,
              value: Number(p.value),
            }));
            setProposals(mapped);
            return;
          }
        }
      } catch (backendError) {
        console.warn("Backend down, falling back to on-chain proposal querying:", backendError);
      }

      // 2. On-chain Fallback
      const count = Number(await gov.proposalCount());
      const props = [];
      for (let i = 1; i <= count; i++) {
        const p = await gov.getProposal(i);
        props.push({
          id: Number(p.id),
          proposer: p.proposer,
          description: p.description,
          endTime: Number(p.endTime),
          executed: p.executed,
          optionNames: [...p.optionNames],
          optionVotes: p.optionVotes.map((v) => parseFloat(formatEther(v))),
          target: p.target,
          value: Number(p.value),
        });
      }
      setProposals(props);
    } catch (err) {
      setErrorMessage(err?.message || "Error loading DAO.");
      console.error("Error loading DAO:", err);
    } finally {
      setLoading(false);
    }
  };

  const createProposal = async () => {
    if (!proposalDesc.trim()) {
      alert("Please enter a proposal description.");
      return;
    }
    if (proposalOptions.filter((o) => o.trim()).length < 2) {
      alert("At least 2 voting options are required.");
      return;
    }
    setErrorMessage("");
    setCreating(true);
    try {
      const provider = await getProvider();
      await ensureContractDeployed(provider, address, "Governance");
      const signer = await provider.getSigner();
      const gov = new Contract(address, contracts.Governance.abi, signer);
      const daoBloomToken = await gov.bloomToken();
      if (daoBloomToken.toLowerCase() !== contracts.BloomToken.address.toLowerCase()) {
        throw new Error(
          `This DAO was created with a stale BloomToken address (${daoBloomToken}). It cannot create proposals on the current network. Create a new DAO using the updated BloomToken deployment at ${contracts.BloomToken.address}.`
        );
      }
      const token = new Contract(contracts.BloomToken.address, contracts.BloomToken.abi, signer);
      const userAddress = await signer.getAddress();

      // Ensure the user has voting power; self-delegate if a token balance exists but no votes.
      let votes = await token.getVotes(userAddress);
      const balance = await token.balanceOf(userAddress);
      const threshold = await gov.proposalThreshold();

      if (votes === 0n && balance > 0n) {
        const delegateTx = await token.delegate(userAddress);
        await delegateTx.wait();
        votes = await token.getVotes(userAddress);
        setVotingPower(parseFloat(formatEther(votes)).toLocaleString(undefined, { maximumFractionDigits: 2 }));
      }

      if (votes < threshold) {
        throw new Error(
          `Your voting power is too low to create a proposal. Current votes: ${votes.toString()}, required: ${threshold.toString()}. Delegate your BLOOM tokens to yourself or acquire more voting power.`
        );
      }

      const tx = await gov.createProposal(
        proposalDesc.trim(),
        BigInt(proposalDuration),
        proposalOptions.filter((o) => o.trim())
      );
      await tx.wait();

      alert("Proposal created successfully! 🎉");
      setShowCreateModal(false);
      setProposalDesc("");
      setProposalDuration("5");
      setProposalOptions(["Yes", "No"]);
      await loadDAO(provider);
    } catch (err) {
      const message =
        err?.reason ||
        err?.message ||
        "Failed to create proposal. You may not have enough $BLOOM tokens.";
      setErrorMessage(message);
      console.error("Create proposal failed:", err);
      alert(message);
    } finally {
      setCreating(false);
    }
  };

  const castVote = async (proposalId, optionIndex) => {
    setVotingOn(proposalId);
    try {
      setErrorMessage("");
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const gov = new Contract(address, contracts.Governance.abi, signer);
      const tx = await gov.vote(BigInt(proposalId), BigInt(optionIndex));
      await tx.wait();
      alert("Vote cast successfully! ✅");
      await loadDAO(provider);
    } catch (err) {
      const message = err?.message || "Vote failed. You may have already voted or lack voting power.";
      setErrorMessage(message);
      console.error("Vote failed:", err);
      alert(message);
    } finally {
      setVotingOn(null);
    }
  };

  const getTimeRemaining = (endTime) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = endTime - now;
    if (diff <= 0) return "Ended";
    const mins = Math.floor(diff / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m remaining`;
    return `${mins}m remaining`;
  };

  const isActive = (endTime) => {
    return Math.floor(Date.now() / 1000) < endTime;
  };

  const generateMockSummary = (description) => {
    if (!description || !description.trim()) {
      return "This governance proposal addresses standard DAO administration and community guidelines. It seeks to gauge member sentiment.";
    }

    const clean = description.trim().replace(/[?.]+$/, "");
    const desc = clean.toLowerCase();
    
    // Categorize proposal type
    let type = "governance initiative";
    let action = "gauge member sentiment and build consensus";
    
    if (desc.includes("eth") || desc.includes("usdt") || desc.includes("fund") || desc.includes("transfer") || desc.includes("allocate") || desc.includes("treasury") || desc.includes("spend") || desc.includes("grant")) {
      type = "financial proposal";
      action = "authorize the allocation and transfer of treasury resources";
    } else if (desc.includes("marketing") || desc.includes("community") || desc.includes("campaign") || desc.includes("social") || desc.includes("twitter") || desc.includes("telegram")) {
      type = "marketing & outreach initiative";
      action = "align on promotional strategies and growth campaigns";
    } else if (desc.includes("develop") || desc.includes("code") || desc.includes("smart contract") || desc.includes("bug") || desc.includes("security") || desc.includes("audit") || desc.includes("upgrade")) {
      type = "technical improvement proposal";
      action = "approve smart contract upgrades, bug fixes, or system security enhancements";
    } else if (desc.includes("win") || desc.includes("election") || desc.includes("vote") || desc.includes("poll") || desc.includes("candidate")) {
      type = "community voting poll";
      action = "track preferences and record votes on external options";
    }

    // Build sentence prefix based on description structure
    let leadSentence = "";
    const words = clean.split(/\s+/);
    const firstWord = words[0].toLowerCase();
    const helperVerbs = ["should", "can", "will", "would", "is", "are", "do", "does", "could", "shall"];
    
    if (helperVerbs.includes(firstWord)) {
      leadSentence = `This ${type} evaluates community sentiment regarding the question: "${clean}?".`;
    } else if (["allocate", "transfer", "spend", "send", "grant", "deploy", "create", "upgrade", "change", "modify", "setup", "fund", "mint", "burn"].includes(firstWord)) {
      leadSentence = `This ${type} seeks formal authorization to ${clean.charAt(0).toLowerCase() + clean.slice(1)}.`;
    } else {
      leadSentence = `This ${type} addresses the request: "${clean}".`;
    }

    return `${leadSentence} It aims to ${action} based on the collective decision of the DAO's voting members.`;
  };

  const summarizeProposal = async (proposalId, description) => {
    if (aiSummaries[proposalId] && aiSummaries[proposalId] !== "Could not generate summary.") return;
    
    const activeKey = geminiApiKey || localStorage.getItem("GEMINI_API_KEY");
    
    // If no key is provided, prompt for Gemini API key
    if (!activeKey) {
      setPendingSummaryArgs({ proposalId, description });
      setTempKey("");
      setShowKeyModal(true);
      return;
    }

    setSummarizing((prev) => ({ ...prev, [proposalId]: true }));
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${activeKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a DAO governance assistant. Summarize this proposal in exactly 2 clear sentences. Be neutral and factual.\n\nProposal: "${description}"`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (res.status === 400 || res.status === 403) {
        throw new Error("Invalid API key");
      }

      const data = await res.json();
      const summary =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        generateMockSummary(description);
      setAiSummaries((prev) => ({ ...prev, [proposalId]: summary }));
    } catch (err) {
      console.warn("AI summary failed, falling back to local summarizer:", err);
      // Fail gracefully to the smart mock summarizer
      const mockSummary = generateMockSummary(description);
      setAiSummaries((prev) => ({ ...prev, [proposalId]: mockSummary }));
    } finally {
      setSummarizing((prev) => ({ ...prev, [proposalId]: false }));
    }
  };

  const handleSaveApiKey = () => {
    const trimmed = tempKey.trim();
    localStorage.setItem("GEMINI_API_KEY", trimmed);
    setGeminiApiKey(trimmed);
    setShowKeyModal(false);
    if (pendingSummaryArgs) {
      // Retry summarizing
      const { proposalId, description } = pendingSummaryArgs;
      setPendingSummaryArgs(null);
      // Wait a tick for state update
      setTimeout(() => {
        summarizeProposal(proposalId, description);
      }, 100);
    }
  };

  const handleSkipWithMock = () => {
    setShowKeyModal(false);
    if (pendingSummaryArgs) {
      const { proposalId, description } = pendingSummaryArgs;
      setPendingSummaryArgs(null);
      setSummarizing((prev) => ({ ...prev, [proposalId]: true }));
      setTimeout(() => {
        const mockSummary = generateMockSummary(description);
        setAiSummaries((prev) => ({ ...prev, [proposalId]: mockSummary }));
        setSummarizing((prev) => ({ ...prev, [proposalId]: false }));
      }, 300);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">
          DAOs
        </Link>
        <span>→</span>
        <span className="text-gray-700 font-medium">{daoName}</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {daoName.charAt(0)}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {daoName}
            </h1>
          </div>
          <p className="text-gray-500 font-mono text-xs ml-[52px]">
            {address}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-sm transition-all duration-200"
        >
          + New Proposal
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Total Proposals</p>
          <p className="text-2xl font-bold text-gray-900">{proposals.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Active Proposals</p>
          <p className="text-2xl font-bold text-green-600">
            {proposals.filter((p) => isActive(p.endTime)).length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Your Balance</p>
          <p className="text-2xl font-bold text-indigo-600">{tokenBalance} BLOOM</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Voting Power</p>
          <p className="text-2xl font-bold text-purple-600">{votingPower} Votes</p>
        </div>
      </div>

      {/* Proposals */}
      {proposals.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
            📋
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No proposals yet</h3>
          <p className="text-gray-500 mb-6">
            Create the first governance proposal for this DAO.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Create Proposal
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {proposals.map((p) => {
            const totalVotes = p.optionVotes.reduce((a, b) => a + b, 0);
            const active = isActive(p.endTime);
            const maxVotes = Math.max(...p.optionVotes);

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Proposal Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          active
                            ? "bg-green-50 text-green-700 border border-green-100"
                            : p.executed
                            ? "bg-purple-50 text-purple-700 border border-purple-100"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            active ? "bg-green-500" : p.executed ? "bg-purple-500" : "bg-gray-400"
                          }`}
                        ></span>
                        {active ? "Active" : p.executed ? "Executed" : "Ended"}
                      </span>
                      <span className="text-xs text-gray-400">
                        Proposal #{p.id}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {active ? getTimeRemaining(p.endTime) : "Voting closed"}
                    </span>
                  </div>
                  <p className="text-gray-900 font-semibold text-base leading-relaxed">
                    {p.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    by {p.proposer.substring(0, 6)}...{p.proposer.substring(38)} · {totalVotes.toLocaleString()} total votes
                  </p>

                  {/* AI Summary */}
                  <div className="mt-3">
                    {aiSummaries[p.id] ? (
                      <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                        <p className="text-xs font-semibold text-purple-600 mb-1 flex items-center justify-between">
                          <span className="flex items-center"><span className="mr-1">✨</span> AI Summary</span>
                          <button
                            onClick={() => {
                              setPendingSummaryArgs({ proposalId: p.id, description: p.description });
                              setTempKey(geminiApiKey);
                              setShowKeyModal(true);
                            }}
                            className="text-[10px] text-purple-400 hover:text-purple-600 font-medium transition-colors"
                          >
                            Update Key
                          </button>
                        </p>
                        <p className="text-sm text-purple-800 leading-relaxed">
                          {aiSummaries[p.id]}
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => summarizeProposal(p.id, p.description)}
                        disabled={summarizing[p.id]}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-100 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                      >
                        {summarizing[p.id] ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Summarizing...
                          </span>
                        ) : (
                          "✨ Summarize with AI"
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Voting Options */}
                <div className="p-6">
                  <div className="space-y-3">
                    {p.optionNames.map((opt, idx) => {
                      const votes = p.optionVotes[idx];
                      const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                      const isWinning = votes === maxVotes && totalVotes > 0;

                      return (
                        <div key={idx} className="relative">
                          <div
                            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                              isWinning && !active
                                ? "border-indigo-200 bg-indigo-50/50"
                                : "border-gray-100 bg-gray-50/50"
                            }`}
                          >
                            <div className="flex items-center space-x-3 z-10 relative">
                              {active && (
                                <button
                                  onClick={() => castVote(p.id, idx)}
                                  disabled={votingOn === p.id}
                                  className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                                >
                                  ✓
                                </button>
                              )}
                              <span className="text-sm font-medium text-gray-800">{opt}</span>
                            </div>
                            <div className="flex items-center space-x-3 z-10 relative">
                              <span className="text-xs text-gray-500">{votes.toLocaleString()} votes</span>
                              <span
                                className={`text-sm font-bold ${
                                  isWinning && totalVotes > 0 ? "text-indigo-600" : "text-gray-400"
                                }`}
                              >
                                {pct}%
                              </span>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="absolute bottom-0 left-0 h-1 rounded-b-xl overflow-hidden w-full">
                            <div
                              className={`h-full transition-all duration-700 ${
                                isWinning ? "bg-indigo-400" : "bg-gray-300"
                              }`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Create Proposal Modal ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !creating && setShowCreateModal(false)}
          ></div>
          <div className="relative bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-md p-8 mx-4">
            <button
              onClick={() => !creating && setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-lg">
              <span className="text-white text-xl">📋</span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
              New Proposal
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Submit a governance proposal for the community to vote on.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Description
                </label>
                <textarea
                  value={proposalDesc}
                  onChange={(e) => setProposalDesc(e.target.value)}
                  placeholder="e.g. Should we allocate 10 ETH to the marketing fund?"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={proposalDuration}
                  onChange={(e) => setProposalDuration(e.target.value)}
                  min="1"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Voting Options
                </label>
                <div className="space-y-2">
                  {proposalOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const copy = [...proposalOptions];
                          copy[idx] = e.target.value;
                          setProposalOptions(copy);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      {proposalOptions.length > 2 && (
                        <button
                          onClick={() =>
                            setProposalOptions(proposalOptions.filter((_, i) => i !== idx))
                          }
                          className="text-rose-400 hover:text-rose-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setProposalOptions([...proposalOptions, ""])}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold mt-2 transition-colors"
                >
                  + Add Option
                </button>
              </div>

              <button
                onClick={createProposal}
                disabled={creating}
                className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 mt-2 ${
                  creating
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md"
                }`}
              >
                {creating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "📝 Submit Proposal"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─── Gemini API Key Modal ─── */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowKeyModal(false)}
          ></div>
          <div className="relative bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-md p-8 mx-4">
            <button
              onClick={() => setShowKeyModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-5 8a2 2 0 01-2-2V9a2 2 0 114 0v4a2 2 0 01-2 2z" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
              Configure Gemini API Key
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              AI summaries require a valid Google Gemini API Key.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="Paste your AIzaSy... API Key"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Don't have a key? Get one for free at{" "}
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 hover:text-purple-700 font-semibold underline"
                  >
                    Google AI Studio
                  </a>.
                </p>
              </div>

              <div className="flex space-x-3 mt-2">
                <button
                  onClick={handleSaveApiKey}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                >
                  💾 Save API Key
                </button>
                <button
                  onClick={handleSkipWithMock}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200"
                >
                  Skip & Mock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DAODashboard;
