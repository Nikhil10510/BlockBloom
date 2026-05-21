# 🌱 BlockBloom DAO — Local Development Setup

> **For all team members (Chinmay, Kushagra, Nikhil)**
> Follow these steps exactly after pulling from `main`. No manual address editing needed.

---

## ✅ Prerequisites (install once)

- [Node.js v18+](https://nodejs.org/)
- [MetaMask browser extension](https://metamask.io/)
- Git

---

## 🚀 First-Time Setup (after cloning / pulling)

### Step 0 — Install all dependencies
Open a terminal in the `FinalTask` folder:

```bash
cd hardhat   && npm install && cd ..
cd backend   && npm install && cd ..
cd frontend  && npm install && cd ..
```

---

### Step 1 — Start the local blockchain
Open **Terminal 1** and keep it running:

```bash
cd e:\Blockboom\BlockBloom_GDG_Project-main\BlockBloom_GDG_Project-main\FinalTask\hardhat
npx hardhat node
```

⏳ Wait until you see:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

---

### Step 2 — Deploy contracts + auto-configure everything
Open **Terminal 2** (after Terminal 1 is ready):

```bash
cd e:\Blockboom\BlockBloom_GDG_Project-main\BlockBloom_GDG_Project-main\FinalTask\hardhat
npm run setup
```

⏳ Wait until you see:
```
✅ LOCAL DEPLOYMENT COMPLETE
📝 Updated frontend/src/contracts.json with new addresses
📝 Created backend/.env from .env.example with new addresses
```

> ⚡ This single command:
> - Deploys `BloomToken` and `DAOFactory` to your local node
> - Automatically updates `frontend/src/contracts.json` with your addresses
> - Automatically creates/updates `backend/.env` with your addresses
> - **You never need to manually copy-paste any address**

---

### Step 3 — Start the backend
Open **Terminal 3**:

```bash
cd e:\Blockboom\BlockBloom_GDG_Project-main\BlockBloom_GDG_Project-main\FinalTask\backend
npm run dev
```

⏳ Wait until you see:
```
MongoDB     : Connected ✅
Socket.IO   : Ready ✅
Indexer     : Running ✅
```

---

### Step 4 — Start the frontend
Open **Terminal 4**:

```bash
cd e:\Blockboom\BlockBloom_GDG_Project-main\BlockBloom_GDG_Project-main\FinalTask\frontend
npm run dev
```

⏳ Wait until you see:
```
Local: http://localhost:5173/
```

---

### Step 5 — Configure MetaMask

1. Open MetaMask → click the network dropdown
2. Add a new network manually:

| Field | Value |
|---|---|
| Network Name | Hardhat Localhost |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency Symbol | `ETH` |

3. Import a test account using one of Hardhat's private keys (shown in Terminal 1 output):
   ```
   Account #0 private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

---

### Step 6 — Open the app

Go to: **http://localhost:5173**

- Click **"+ Deploy New DAO"** to create your first DAO
- Start creating proposals and voting!

---

## 🔄 Every Day Workflow (after first setup)

When you come back the next day or restart your PC:

```
Terminal 1:  cd hardhat   → npx hardhat node     (start blockchain)
Terminal 2:  cd hardhat   → npm run setup         (redeploy + update configs)
Terminal 3:  cd backend   → npm run dev            (start backend)
Terminal 4:  cd frontend  → npm run dev            (start frontend)
```

> ⚠️ Always run `npm run setup` AFTER starting the hardhat node, and BEFORE starting the backend.
> The setup script rewrites addresses — start backend after it completes.

---

## ❓ Common Errors & Fixes

| Error | Fix |
|---|---|
| `EADDRINUSE: port 5000` | Old backend still running. Run: `Get-Process node \| Stop-Process -Force` then restart backend |
| `This DAO was created with a stale BloomToken` | You ran setup without restarting the node. Restart node → run setup → create new DAOs |
| `ECONNREFUSED 127.0.0.1:8545` | Hardhat node isn't running. Start Terminal 1 first |
| `429 Too Many Requests` | Backend rate limit hit. Already fixed in `.env.example` (10000 limit) |
| MetaMask wrong network | Switch MetaMask to `Hardhat Localhost` (chainId 31337) |

---

## 📁 Project Structure

```
FinalTask/
├── hardhat/          ← Smart contracts (Solidity) + deploy scripts
│   ├── contracts/    ← BloomToken.sol, Governance.sol, DAOFactory.sol, Treasury.sol
│   └── deploy-local.js  ← The magic setup script
├── backend/          ← Express API + MongoDB + Socket.IO
│   ├── src/
│   └── .env.example  ← Copy of env template (auto-used by setup script)
└── frontend/         ← React + Vite UI
    └── src/
        ├── contracts.json  ← ABI + addresses (auto-updated by setup script)
        └── pages/
```

---

*BlockBloom DAO Team · Phase 3 · May 2026*
