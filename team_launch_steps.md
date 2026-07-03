# 🚀 BlockBloom — Step-by-Step Production Launch Steps

This guide outlines the exact steps and order of execution for tomorrow's production deployment on Ethereum Sepolia and Vercel.

---

## ⛓️ Role 1: Chinmay — Smart Contract Deployment
* **Goal**: Deploy the smart contracts to the public Sepolia network.

1. **Configure Sepolia Provider**:
   * Open the `/hardhat` directory.
   * Create a local `.env` file (do NOT commit to Git) and add:
     ```env
     API_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_OR_INFURA_KEY
     PRIVATE_KEY=your_deployer_wallet_private_key
     ETHERSCAN_API_KEY=your_etherscan_api_key
     ```
2. **Run Deploy Script**:
   * Run the deployment command targeting Sepolia:
     ```bash
     npx hardhat run scripts/deploy.js --network sepolia
     ```
3. **Share Addresses**:
   * Copy the deployed contract addresses of **`BloomToken`** and **`ElectionFactory`** from the terminal and send them directly to Kushagra and Nikhil.

---

## ☁️ Role 2: Kushagra — Backend & Cloud Setup
* **Goal**: Spin up the cloud server, indexer, and database.

1. **Configure MongoDB Atlas**:
   * Set up a free cluster on [MongoDB Atlas](https://cloud.mongodb.com).
   * Whitelist all IP addresses (`0.0.0.0/0`) and copy the connection string.
2. **Collect AI Credentials**:
   * Go to [Google AI Studio](https://aistudio.google.com/apikey) and generate/copy a fresh Gemini API key.
3. **Deploy Backend (Render, Railway, or Heroku)**:
   * Link the `backend/` directory to your cloud host dashboard.
   * Set up the following Environment Variables in the provider's dashboard:
     ```env
     NODE_ENV=production
     USE_IN_MEMORY_DB=false
     MONGODB_URI=mongodb+srv://<your_atlas_connection_string>
     RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_OR_INFURA_KEY
     ELECTION_FACTORY_ADDRESS=deployed_address_from_chinmay
     BLOOM_TOKEN_ADDRESS=deployed_address_from_chinmay
     CORS_ORIGIN=https://blockbloom.vercel.app  # (Nikhil's Vercel domain)
     JWT_SECRET=generate_a_random_32_character_string
     GEMINI_API_KEY=your_fresh_gemini_api_key
     ```
4. **Share Backend URL**:
   * Copy the public URL of the deployed backend API (e.g. `https://blockbloom-api.onrender.com/api`) and send it to Nikhil.

---

## 🎨 Role 3: Nikhil — Frontend Vercel Launch
* **Goal**: Launch the Web App.

1. **Update Local Contracts Addresses**:
   * Open [contracts.json](file:///e:/Blockboom/BlockBloom_GDG_Project-main/BlockBloom_GDG_Project-main/FinalTask/frontend/src/contracts.json) and replace the Hardhat addresses with the Sepolia contract addresses received from Chinmay:
     ```json
     "BloomToken": {
       "address": "deployed_bloom_token_address_from_chinmay",
       ...
     },
     "ElectionFactory": {
       "address": "deployed_election_factory_address_from_chinmay",
       ...
     }
     ```
   * Commit and push this change to `main`.
2. **Deploy on Vercel**:
   * Link your repository to Vercel, targeting the `/frontend` directory.
   * Add the following environment variables in the Vercel Dashboard:
     ```env
     VITE_API_BASE=your_deployed_backend_api_url_from_kushagra
     VITE_REQUIRED_CHAIN_ID=11155111
     VITE_WALLETCONNECT_PROJECT_ID=your_reown_walletconnect_project_id
     ```
3. **Domain Allowlist**:
   * Go to the Reown (WalletConnect) Cloud dashboard and add your live Vercel domain to the **Domain Allowlist** of your Project ID.
