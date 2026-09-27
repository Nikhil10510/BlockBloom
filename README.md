# 🌱 BlockBloom DAO

Welcome to **BlockBloom DAO**, a comprehensive, full-stack Decentralized Autonomous Organization (DAO) platform designed to empower communities with transparent, on-chain governance. This project demonstrates proficiency in Web3 integration, full-stack development, and scalable system architecture.

## 🚀 Project Overview

BlockBloom is a platform that allows users to seamlessly deploy their own DAOs, create decentralized proposals, and participate in on-chain voting. It bridges the gap between complex blockchain interactions and intuitive user experiences, making decentralized governance accessible to everyone. 

This project was built to showcase a complete Web3 ecosystem, starting from smart contract deployment all the way to backend indexing and a responsive frontend interface.

## ✨ Key Features

- **DAO Factory & Deployment**: Users can deploy custom DAOs instantly, provisioning their own `Governance`, `Treasury`, and `BloomToken` contracts directly from the UI.
- **On-Chain Governance & Voting**: Secure, immutable proposal creation and voting mechanisms backed by Solidity smart contracts.
- **Off-Chain Drafts & SIWE**: "Sign-In With Ethereum" (SIWE) authentication allows users to save draft proposals securely in a centralized backend before paying gas fees to publish them on-chain.
- **Real-Time Data Indexing**: A dedicated backend indexer listens to blockchain events and syncs them with a MongoDB database, enabling lightning-fast frontend queries without overloading RPC nodes.
- **AI-Powered Summaries**: Integrates Gemini AI to generate concise, readable summaries of complex proposals.
- **Leaderboards & Analytics**: Comprehensive tracking of voter history, DAO statistics, and platform-wide engagement metrics.

## 🛠️ Technology Stack

BlockBloom utilizes a modern, robust tech stack:

### Frontend
- **React.js & Vite**: For a fast, responsive, and dynamic user interface.
- **Ethers.js / Web3.js**: To interact with the Ethereum blockchain and user wallets (MetaMask).
- **CSS / Styling**: Custom responsive designs optimized for a premium user experience.

### Backend
- **Node.js & Express**: RESTful APIs for off-chain data (drafts, stats, leaderboards).
- **MongoDB**: NoSQL database for caching indexed on-chain data and storing off-chain drafts.
- **Socket.IO**: Real-time updates for voting and proposal statuses.

### Smart Contracts (Solidity)
- **Hardhat**: Development environment for compiling, testing, and deploying contracts.
- **Contracts**: `BloomToken.sol` (ERC20), `Governance.sol`, `DAOFactory.sol`, `Treasury.sol`.

## 🏗️ System Architecture

1. **User Interaction**: Users connect their MetaMask wallets to the React frontend.
2. **Blockchain Layer**: Smart contracts handle the core logic (token balances, proposal states, vote counting) on the Ethereum network (or local Hardhat node).
3. **Indexer & Backend**: The Node.js backend listens for events emitted by the smart contracts, processes them, and stores the structured data in MongoDB.
4. **Data Delivery**: The frontend fetches aggregated data (like leaderboards and stats) from the Express APIs, ensuring a snappy user experience.

## 👨‍💻 Developer Setup

If you are a developer or teammate looking to run this project locally, please refer to our detailed setup guide:
👉 [Local Development Setup](TEAMMATE_SETUP.md)

---
*Developed by the BlockBloom Team (Chinmay, Kushagra, Nikhil) - 2026*
