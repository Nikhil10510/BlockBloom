# 🏆 BlockBloom DAO — Local Testing & Verification Guide

This guide outlines the step-by-step instructions for the **BlockBloom** development team to run, test, and verify the entire decentralized governance application locally.

---

## 🛠️ Step 1: Git Repository Synchronization
To make sure you are running the latest codebase with all theme-aware scrollbars, Web3 adapters, and floating AI Copilot session widgets:
```bash
# Switch to main and pull latest changes
git checkout main
git pull origin main
```

---

## ⛓️ Step 2: Spin Up the Local Blockchain (Hardhat)
We simulate the Ethereum network locally to avoid Sepolia gas costs during dev testing.
1. Navigate to the `hardhat` folder:
   ```bash
   cd hardhat
   npm install
   ```
2. Start the local node:
   ```bash
   npx hardhat node
   ```
   *⚠️ Keep this terminal window open! It will print local test accounts and their private keys. You can import these keys into MetaMask to get free testing tokens.*

---

## ⚙️ Step 3: Start the Backend REST API & Event Indexer
The backend is responsible for indexing events from the Hardhat chain to MongoDB, managing chat sessions, and serving the AI models.
1. Open a new terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   npm install
   ```
2. Set up your `.env` configuration file inside `backend/`:
   Ensure your local MongoDB service is running (`mongodb://localhost:27017`) and optionally add your `GEMINI_API_KEY` for AI features.
3. Start the server:
   ```bash
   npm run dev
   ```
   *You should see verification logs showing MongoDB is connected, WebSockets are ready, and the Event Indexer is live.*

---

## 🎨 Step 4: Run the Frontend App
1. Open a third terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   npm install
   ```
2. Launch the Vite local dev server:
   ```bash
   npm run dev
   ```
3. Open your browser to **`http://localhost:5173`** to test.

---

## 🧪 Step 5: Verification & Testing Checklist

Follow this checklist to confirm all features are operating correctly:

### 1. 👛 Wallet Connection
* Click the **"Connect Wallet"** button in the top right.
* Connect MetaMask and ensure the network is pointing to the local Hardhat Node (RPC URL `http://127.0.0.1:8545`, Chain ID `31337`).

### 2. ☀️/🌙 Theme System & Slim Scrollbars
* Click the theme toggle icon in the navbar.
* Verify that the interface switches seamlessly between the dark theme and light theme.
* Scroll down inside any container (e.g. the chat widget or leaderboard). Scrollbars should be slim, rounded, and adapt automatically to the color palette.

### 3. 🌱 Multi-DAO Deployment & Proposals
* Click **"+ Deploy New DAO"** on the home explore page.
* Fill in details and click **"Deploy DAO"**. Sign the txn in MetaMask.
* Click into your new DAO dashboard, and select **"+ New Proposal"**. Submit a new community initiative.

### 4. 🤖 Grounded AI Copilot Chat (Sidebar)
* Click the floating blue robot chat bubble at the bottom right.
* Ask questions about your DAO (e.g., *"What is the treasury address?"* or *"Summarize the current proposals for this DAO"*).
* Verify that the AI correctly references active proposals, options, and balances.
* Click **"Clear"** in the chat header to reset conversation history.

### 5. ✨ Smart AI Proposal Summarizer
* Locate a proposal card inside the DAO dashboard.
* Click **"✨ Summarize with AI"**.
* If a Gemini API key is configured, it will call the remote model. Otherwise, it will fallback gracefully to a smart, mock local summarizer that analyzes the description dynamically.

### 🏆 6. Real-Time Leaderboard Update
* Place a vote on a proposal.
* Navigate to the **"Leaderboard"** page in the navbar.
* Observe that your voting metrics (Votes Cast, DAOs Active) update in real-time via WebSocket broadcasting.
