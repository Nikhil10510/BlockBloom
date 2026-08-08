# BlockBloom — Master Interview Preparation Guide
> Simple language. Easy to remember. All parts covered — Frontend, Smart Contracts, Backend, and AI.

---

## 📌 SECTION 1 — Project Introduction & Core Motivation

### Q1. Tell me about your BlockBloom project.
> **Answer:**
>
> BlockBloom is a decentralized voting platform we built for organizations like colleges or clubs to run fair and transparent elections.
>
> In normal voting apps, all votes are saved in a database that someone controls. That person can change results and nobody would know. We wanted to remove that trust problem completely.
>
> So we moved the actual voting onto the Ethereum blockchain. Once a vote is recorded on blockchain, nobody — not even us as developers — can change it.
>
> The app has three main things:
> - Organizations can create elections and upload a list of who is allowed to vote
> - Whitelisted voters connect their MetaMask wallet and cast votes directly on blockchain
> - An AI chatbot answers questions about the organization's proposals and elections
>
> We were a team of 3:
> - **Nikhil (Me):** Entire frontend — all React pages, wallet connection, MetaMask integration
> - **Chinmay:** Smart contracts in Solidity and deployment to Sepolia testnet
> - **Kushagra:** Node.js backend, MongoDB, RabbitMQ message queue, and AI chatbot

---

### Q2. What problem does BlockBloom solve? Why not just use Google Forms?
> **Answer:**
>
> Google Forms is centralized. The person who created the form can delete responses, modify them, or show fake results. There is no way for voters to verify anything.
>
> BlockBloom solves three main problems:
>
> 1. **Data Tampering:** Once a vote is on Ethereum blockchain, it is permanent. Nobody can delete or change it — not even the admin or us as developers.
> 2. **Double Voting:** The smart contract has a rule: each wallet address can vote only once. This rule is written in code and runs automatically. Nobody can override it.
> 3. **Verifiability:** Anyone can open a site called Etherscan and see every single vote transaction. You don't need to trust us. You can verify the results yourself.

---

### Q3. What is a DAO and why is it relevant to BlockBloom?
> **Answer:**
>
> DAO stands for Decentralized Autonomous Organization. It's basically an organization that is run by its members using smart contracts and voting, instead of a central authority like a CEO or board.
>
> In a DAO, members vote on proposals — for example: "Should we spend 5 ETH from the treasury on marketing?" If the vote passes, the action happens automatically via smart contract. No one person can block or override it.
>
> BlockBloom is a platform that helps organizations run DAO-style governance. Members can create elections, vote on proposals, and everything is recorded on-chain. We give organizations the tools to operate like a DAO without building everything from scratch.

---

### Q4. What is your tech stack?
> **Answer:**
>
> - **Frontend:** React, Vite, Ethers.js, Tailwind CSS, Wagmi, RainbowKit
> - **Backend:** Node.js, Express, MongoDB
> - **Blockchain:** Solidity, Hardhat, deployed on Ethereum Sepolia testnet
> - **AI:** Google Gemini API
> - **Deployment:** Frontend on Vercel, Backend on Render

---

### Q5. Explain the full system architecture of BlockBloom.
> **Answer:**
>
> There are four main layers that work together:
>
> **1. Frontend (React on Vercel):**
> This is what the user sees and interacts with. It talks to two things — our backend API for user data, and the Ethereum blockchain directly for voting.
>
> **2. Backend (Node.js/Express on Render):**
> Handles everything that doesn't need to be on blockchain. That means login (SIWE + JWT), managing organizations, generating voter proofs, and the AI chatbot. It also listens to blockchain events.
>
> **3. Blockchain (Ethereum Sepolia):**
> This is where votes actually live permanently. Two smart contracts are deployed here — ElectionFactory creates elections, Election stores the votes and handles verification.
>
> **4. RabbitMQ Worker:**
> When a vote is cast on the blockchain, an event fires. A background worker detects this event, pushes it to RabbitMQ queue, and updates MongoDB. This keeps the database in sync with blockchain without slowing down the main API.
>
> Simple summary: User → Frontend → Backend (for data) + Blockchain (for votes) → RabbitMQ keeps MongoDB updated automatically.

---

### Q6. Walk me through the complete flow from logging in to casting a vote.
> **Answer:**
>
> Here is exactly what happens step by step:
>
> **Step 1 — Connect Wallet:**
> User clicks "Connect Wallet." RainbowKit shows a popup with MetaMask option. User selects it. Now the app knows their wallet address.
>
> **Step 2 — SIWE Login:**
> The frontend asks our backend for a random number called a nonce (e.g., 928374). The user signs a message containing this nonce using MetaMask — this proves they own the wallet. The signed message is sent to backend. Backend verifies the signature mathematically, and if it matches, issues a JWT token.
>
> **Step 3 — Browse Elections:**
> User goes to their organization's page. Frontend fetches elections from MongoDB using the JWT in the request. Only their org's elections are shown.
>
> **Step 4 — Get Merkle Proof:**
> When the user opens an election to vote, the frontend asks the backend: "Give me the Merkle proof for my wallet address." Backend checks if the wallet is in the uploaded whitelist CSV, generates the proof, and sends it back.
>
> **Step 5 — Cast Vote:**
> User clicks a candidate and presses "Vote." Ethers.js calls `contract.vote(candidateId, proof)`. MetaMask popup appears asking to confirm. User approves and pays a tiny gas fee.
>
> **Step 6 — On-Chain Verification:**
> The smart contract checks: Is the Merkle proof valid? Has this wallet already voted? If all checks pass, the vote is recorded permanently and a VoteCast event is emitted.
>
> **Step 7 — Database Sync:**
> The backend worker detects the VoteCast event, sends it to RabbitMQ, and MongoDB is updated. The frontend shows "Vote cast successfully!"

---

### Q7. How is data split between blockchain and MongoDB?
> **Answer:**
>
> We store different types of data in different places based on what needs to be permanent vs what needs to be flexible.
>
> **On Blockchain (permanent, immutable):**
> - Votes (who voted for whom)
> - Merkle Root (proof of voter whitelist)
> - Candidate list for the election
> - Whether a wallet has already voted
>
> **In MongoDB (flexible, fast):**
> - User profiles and wallet addresses
> - Organization names, descriptions, documents
> - Election metadata (description, dates)
> - Proposal discussions and comments
> - AI chat history
>
> The rule was simple: if the data needs to be tamper-proof and permanently auditable, it goes on-chain. If it's just metadata or needs to be updated frequently, it goes in MongoDB.

---

## ⛓️ SECTION 2 — Chinmay's Part: Smart Contracts & Blockchain

### Q8. What is a smart contract?
> **Answer:**
>
> A smart contract is a program that lives on the Ethereum blockchain. Once you deploy it, it runs automatically based on its rules — no middleman or human can stop it or change it.
>
> Think of it like a vending machine. You put in the correct input (coins), and it gives you the snack automatically. No shopkeeper needed, no negotiations. The machine just follows its rules.
>
> In BlockBloom, our Election smart contract stores candidates and vote counts. When you call `vote()`, it automatically checks if you're whitelisted, checks if you already voted, and records your vote permanently. No one can interfere.

---

### Q9. What is MetaMask and how does it work?
> **Answer:**
>
> MetaMask is a browser extension that works like a digital wallet for Ethereum. It stores your private key securely and allows you to:
> - See your ETH and token balances
> - Connect to websites (dApps) like BlockBloom
> - Sign messages to prove identity
> - Approve transactions and pay gas fees
>
> When you click "Vote" in BlockBloom, the transaction request goes to MetaMask. MetaMask shows you the details — which contract, what function, how much gas — and you either approve or reject it. If you approve, MetaMask signs the transaction with your private key and sends it to Ethereum. Your private key never leaves MetaMask.

---

### Q10. What is Ethereum Sepolia and why did you use it?
> **Answer:**
>
> Sepolia is a testnet (test network) for Ethereum. It works exactly like the real Ethereum blockchain — same rules, same smart contract behavior — but the ETH on Sepolia is fake and has no real monetary value.
>
> We used it because:
> - Deploying and testing on Ethereum Mainnet would cost real money (gas fees for deployment, testing votes, debugging)
> - On Sepolia, we can get free ETH from "faucets" — websites that give you testnet ETH for free
> - We can experiment, break things, and redeploy contracts without any financial cost
>
> When we go to production (real deployment), we'd switch to Ethereum Mainnet or a Layer 2 network like Polygon.

---

### Q11. What smart contracts did Chinmay build?
> **Answer:**
>
> Chinmay built two contracts in Solidity:
>
> **1. ElectionFactory.sol:**
> This is the "mother contract." It creates new Election contracts. When an Admin creates a new election, this factory deploys a fresh Election contract just for that election. It also keeps a list of all deployed election contract addresses so the frontend can find them.
>
> **2. Election.sol:**
> This represents a single election. It stores:
> - The election name and Merkle Root (voter whitelist proof)
> - All candidates and their vote counts
> - A mapping of `address → bool` called `hasVoted` to prevent double voting
>
> Key functions:
> - `vote(candidateId, merkleProof)` — the voter calls this to cast a vote
> - `setMerkleRoot(root)` — admin calls this to upload the voter whitelist
> - `getResults()` — anyone can call this to see vote counts (free, no gas)

---

### Q12. Why not one big contract instead of two separate ones?
> **Answer:**
>
> If we had one big contract for all elections, everything would be mixed together. If one election had a bug, it could affect all elections. Also, the contract would get huge and more expensive to interact with.
>
> The Factory Pattern is like having separate classrooms instead of one giant hall. Each election gets its own clean contract that is fully independent. If Election A has an issue, Election B is completely unaffected because they are separate contracts.
>
> Also, deploying separate contracts means each election's data is isolated — different organizations can't accidentally see or affect each other's data.

---

### Q13. How did Chinmay compile and deploy the contracts?
> **Answer:**
>
> He used **Hardhat**, which is a development tool for Ethereum built on Node.js.
>
> 1. **Compile:** Run `npx hardhat compile`. This converts the Solidity code into bytecode (the actual machine code that runs on Ethereum) and generates the ABI (a JSON file describing the contract's functions).
> 2. **Write deploy script:** A JavaScript file that uses Hardhat's tools to deploy the contract to Sepolia. It reads the private key from a `.env` file and connects to Sepolia via Alchemy (an Ethereum node provider).
> 3. **Deploy:** Run the script. The contract address is printed in the terminal.
> 4. **Save address:** The contract address and ABI were saved into `frontend/src/contracts.json` so my React frontend knew where to send transactions.

---

### Q14. What is an ABI and why does the frontend need it?
> **Answer:**
>
> ABI stands for Application Binary Interface. It's a JSON file that describes all the functions in a smart contract — their names, what inputs they take, and what they return.
>
> Think of it like a menu at a restaurant. The menu tells you what dishes are available and what ingredients you need to order. Without the menu, you wouldn't know what to ask for.
>
> Ethers.js on the frontend uses the ABI to know how to call contract functions. For example, without the ABI, it wouldn't know that `vote()` takes a `uint256 candidateId` and a `bytes32[] proof` as inputs.

---

### Q15. What are Solidity events and how did you use them?
> **Answer:**
>
> Events in Solidity are like notifications that the contract can fire. When something important happens, the contract emits an event that gets logged on the blockchain.
>
> Example: When a vote is cast, `Election.sol` emits:
> `event VoteCast(address indexed voter, uint256 candidateId);`
>
> Events are very cheap to emit (minimal gas). They can't be read by other contracts but external applications (like our Node.js backend) can listen for them in real-time.
>
> We used events to keep MongoDB in sync. When `VoteCast` fires on the blockchain, our backend worker immediately picks it up and updates MongoDB with the latest vote count. This way the frontend always shows up-to-date results without having to re-read the blockchain every time.

---

### Q16. What happens when a transaction is "reverted" on Ethereum?
> **Answer:**
>
> In Solidity, we write safety checks using `require()`. For example:
> `require(!hasVoted[msg.sender], "Already voted");`
>
> If that condition fails (meaning the person already voted), the transaction is **reverted**. This means:
> - Everything the transaction did up to that point is undone — like it never happened
> - The user still loses the gas fee they paid (because computation happened)
> - An error message is returned (like "Already voted")
>
> In my frontend, Ethers.js catches this revert. I read the error message and show it as a red toast notification to the user so they know why their vote failed.

---

### Q17. What happens if someone tries to vote twice?
> **Answer:**
>
> The smart contract makes this impossible. Here's how:
>
> Inside `Election.sol`, there's a line:
> `mapping(address => bool) public hasVoted;`
>
> When someone successfully votes, the contract sets `hasVoted[msg.sender] = true`.
>
> At the beginning of the `vote()` function, there's a check:
> `require(!hasVoted[msg.sender], "You have already voted");`
>
> If the same wallet address tries to vote again, this check fails, the transaction is reverted, and the person gets an error. They can't double-vote no matter what — not through the UI, not directly through MetaMask, nothing. The blockchain enforces it.
>
> This is much more reliable than a database check because the smart contract code is immutable once deployed.

---

### Q18. Why is blockchain voting more secure than traditional voting systems?
> **Answer:**
>
> Four main reasons:
>
> 1. **Immutability:** Once a vote is recorded on Ethereum, it cannot be changed or deleted — not by the admin, not by the developers, not by anyone. A traditional database can be modified by whoever has admin access.
>
> 2. **Transparency:** Every single vote is a public transaction on Ethereum. Anyone can go to Etherscan and verify all votes. There's no "trust the organizer" — you can verify yourself.
>
> 3. **Double Vote Prevention:** The `hasVoted` mapping in the smart contract enforces one vote per wallet. This runs at the blockchain level — it cannot be bypassed.
>
> 4. **Decentralized:** There is no single point of failure. A traditional server can be hacked or shut down. Ethereum runs on thousands of nodes worldwide — taking it down is practically impossible.

---

### Q19. What is gas? How did gas affect your design decisions?
> **Answer:**
>
> Gas is the fee you pay to perform operations on the Ethereum blockchain. Every computation costs gas, which is paid in ETH. More complex operations = more gas = more expensive.
>
> This directly influenced how we designed BlockBloom:
>
> 1. **Merkle Tree for whitelisting:** Storing 1,000 wallet addresses on-chain would be extremely expensive. Instead, we store just one 32-byte Merkle Root. Gas cost goes from hundreds of dollars down to a few cents.
>
> 2. **Factory Pattern:** Keeping each election as a separate, small contract means fewer operations per transaction, saving gas.
>
> 3. **Minimal on-chain storage:** We only put votes and the Merkle Root on-chain. Everything else (names, descriptions, profiles) stays in MongoDB — zero gas cost.
>
> 4. **Using testnet:** Gas fees during development would have been very expensive on mainnet. Sepolia testnet lets us test everything for free.

---

## 💾 SECTION 3 — Kushagra's Part: Backend, RabbitMQ & AI

### Q20. What did Kushagra build in the backend?
> **Answer:**
>
> Kushagra built a REST API using Node.js and Express.js. Here's what it does:
>
> - **Authentication:** Handles the SIWE login flow (generates nonces, verifies signatures, issues JWTs)
> - **Organization Management:** CRUD APIs for creating and managing organizations and their members
> - **Merkle Proof Generation:** When a voter wants to vote, the backend generates their Merkle Proof from the stored whitelist
> - **Blockchain Sync:** A worker process listens to smart contract events and keeps MongoDB updated
> - **AI Chatbot:** Connects to Google Gemini and builds context from the organization's data to answer governance questions

---

### Q21. Why did you need RabbitMQ? Can't you just update MongoDB directly?
> **Answer:**
>
> Think of RabbitMQ like a post office sorting room. Instead of handling every letter (blockchain event) immediately and getting overwhelmed, you drop all letters into a queue. Then a worker picks them up one by one and processes them in order.
>
> If 1,000 people vote at the same time, 1,000 `VoteCast` events fire on the blockchain. If the backend tries to write to MongoDB directly for each one:
> - MongoDB might get overloaded and crash
> - If the server crashes mid-process, you lose track of what was synced
>
> With RabbitMQ:
> - Events are instantly added to a queue (fast, doesn't touch MongoDB)
> - A worker processes them one by one safely
> - If the server crashes, RabbitMQ keeps the messages and retries them when the server restarts
>
> This makes the system reliable even under heavy load.

---

### Q22. How does the AI chatbot work? Explain RAG simply.
> **Answer:**
>
> The chatbot answers questions specific to an organization — like "When does the election end?" or "What are the active proposals?"
>
> If we just asked Google Gemini this question directly, it wouldn't know — it doesn't have access to our private database.
>
> So we use **RAG (Retrieval-Augmented Generation)** — think of it like an open-book exam:
>
> 1. User asks a question in the chat UI
> 2. Backend fetches relevant data from MongoDB (proposals, election dates, org documents)
> 3. Backend builds a prompt for Gemini like: "Here is the organization data: [data]. Now answer this question: [user's question]"
> 4. Gemini reads the data we provide and gives an answer based on it
> 5. Answer is sent back to the frontend and shown to the user
>
> RAG prevents the AI from making up (hallucinating) answers because it only uses real data from our database.

---

## 🔐 SECTION 4 — Authentication (SIWE, Merkle Trees, JWT)

### Q23. Why didn't you use username and password login?
> **Answer:**
>
> Because the identity in our system is a wallet address, not an email. Votes on the blockchain are tied to wallet addresses. If someone logs in with an email and uses a different wallet to vote, we'd have an identity mismatch.
>
> With SIWE (Sign-In with Ethereum), the wallet address IS the identity. It's cryptographically proven — the user signs a message with their private key to prove they own that wallet. This is more secure than passwords because:
> - No password can be hacked or forgotten
> - The private key never leaves MetaMask
> - The signature can be mathematically verified by anyone
>
> It's similar to OAuth ("Sign in with Google") but instead of Google verifying you, math verifies you.

---

### Q24. Explain SIWE step by step in simple words.
> **Answer:**
>
> Step 1: User connects MetaMask — now we know their wallet address.
>
> Step 2: Frontend asks our backend: "I want to log in. Give me a nonce."
> Backend generates a random number like `928374` and saves it.
>
> Step 3: Frontend asks MetaMask to sign a message:
> *"Sign in to BlockBloom. Nonce: 928374. Timestamp: 2026-07-17..."*
> MetaMask shows this message to the user. User clicks "Sign." MetaMask creates a signature using their private key.
>
> Step 4: Frontend sends the signature + wallet address to the backend.
>
> Step 5: Backend does the math. It takes the signature and the original message and computes: "Which wallet address would have created this signature?" If the answer matches the wallet address the user claimed, login is successful.
>
> Step 6: Backend deletes the nonce (so it can't be reused) and creates a JWT token containing the user's wallet address and role. Frontend saves this JWT for future API calls.

---

### Q25. What is a nonce and why is it important?
> **Answer:**
>
> A nonce is a random number that is used only once. The word literally means "Number used ONCE."
>
> In SIWE login, it prevents **replay attacks**. Imagine a hacker intercepts your signed login message. Without a nonce, they could send your signature to the backend again and log in as you.
>
> With a nonce:
> - Each login attempt uses a unique nonce (e.g., `928374`)
> - When the user successfully logs in, the backend immediately deletes that nonce from the database
> - If the hacker tries to reuse the signature, the backend looks for nonce `928374` — it's gone. Login rejected.
>
> Think of it like a one-time OTP. Once used, it's dead.

---

### Q26. What is a Merkle Tree? Explain it simply.
> **Answer:**
>
> A Merkle Tree is a way to organize data as a tree of hashes so you can prove something belongs in a list without showing the entire list.
>
> Simple example with 4 voter addresses (A, B, C, D):
> - Hash each address: H(A), H(B), H(C), H(D)
> - Combine pairs: H(H(A)+H(B)) and H(H(C)+H(D))
> - Combine those: H(everything) — this is the **Merkle Root**
>
> No matter how many addresses you have (4 or 10,000), the root is always just 32 bytes.
>
> We store only this 32-byte Merkle Root on the blockchain instead of storing all addresses. This saves a lot of gas money.
>
> When a voter wants to vote, they provide a **Merkle Proof** — just a few hashes that prove their address was part of the original tree. The smart contract verifies this instantly.
>
> Simple analogy: The Merkle Root is a fingerprint of the entire voter list. The Merkle Proof is your ID card that proves you're on the list.

---

### Q27. What is a Merkle Proof and how is it verified on-chain?
> **Answer:**
>
> A Merkle Proof is a small set of hashes that proves your specific address is part of the Merkle Tree.
>
> Think of it like this: In a family tree, to prove you're part of the family, you show your parent's record, grandparent's record, and great-grandparent's record. You don't need to show everyone else in the family.
>
> In our system:
> 1. Admin uploads 500 voter addresses. Backend builds the Merkle Tree and sends the Merkle Root to the smart contract.
> 2. When voter "Alice" wants to vote, the backend generates her Merkle Proof (3-4 hashes that trace her path up the tree).
> 3. Alice calls `vote(candidateId, proof)` on the smart contract.
> 4. The smart contract hashes Alice's address (`msg.sender`), then sequentially hashes it with each item in the proof.
> 5. If the final result equals the stored Merkle Root, the proof is valid. Alice is confirmed as whitelisted.
>
> This verification costs almost no gas and is cryptographically impossible to fake.

---

## 🖥️ SECTION 5 — Nikhil's Part: Frontend in Detail

### Q28. What was your specific contribution to BlockBloom?
> **Answer:**
>
> I was responsible for the entire frontend of the application. Here's everything I built:
>
> **Pages:**
> - **Organizations page** — Browse all available organizations, join them
> - **Elections page** — View active and past elections for an organization
> - **Proposals page** — View, discuss, and vote on governance proposals
> - **ElectionVote page** — The main voting interface with candidate cards, MetaMask integration, and voting
> - **Leaderboard** — Ranks members by participation and voting history
> - **Admin Dashboard** — Upload voter whitelist CSV, manage election settings
> - **Profile page** — User's wallet info, role, and voting history
>
> **Core Features:**
> - Wallet connection using RainbowKit and Wagmi
> - SIWE login flow (nonce → sign → JWT → protected routes)
> - Smart contract calls using Ethers.js (vote, setMerkleRoot, read results)
> - CSV file parsing and validation for whitelist upload
> - Dark/light mode using ThemeContext
> - Toast notification system using ToastContext
> - Role-based access control (SuperAdmin, Admin, Student) using ProtectedRoute
> - Network switching detection (force user to Sepolia)

---

### Q29. How did you connect MetaMask to React using Wagmi and RainbowKit?
> **Answer:**
>
> Wagmi and RainbowKit work as a pair. RainbowKit gives you the "Connect Wallet" button and modal UI. Wagmi gives you React hooks to access wallet state anywhere in the app.
>
> Setup in `main.jsx`:
> 1. Create a Wagmi config specifying our target chain (Sepolia) and Alchemy as the RPC provider
> 2. Create a TanStack Query client (Wagmi uses it internally for caching)
> 3. Wrap the entire app in three providers: WagmiProvider → QueryClientProvider → RainbowKitProvider
>
> Usage anywhere in the app:
> - `useAccount()` → gives me `{ address, isConnected }`
> - `useChainId()` → gives me the current network ID
> - `useSwitchChain()` → lets me programmatically ask user to switch to Sepolia
>
> I added RainbowKit's `<ConnectButton />` in the navbar. That single component handles the entire wallet connection UI — showing the popup, handling different wallets, showing the connected address.

---

### Q30. How did you interact with the smart contract from React?
> **Answer:**
>
> I used **Ethers.js** — a JavaScript library that knows how to talk to Ethereum.
>
> **Reading data (free, no gas needed):**
> ```
> Get browser's Ethereum provider → Create a contract instance with ABI → Call read function
> ```
> Example: `contract.candidates(0)` returns the first candidate's name and vote count. This is free because we're just reading, not writing.
>
> **Writing data (requires gas and MetaMask approval):**
> ```
> Get provider → Get signer (user's wallet via MetaMask) → Create contract with signer → Call write function
> ```
> Example: `contract.vote(candidateId, merkleProof)` sends a transaction. MetaMask pops up, user confirms, and the vote is sent to the blockchain. I use `await tx.wait()` to wait until the transaction is mined before showing "Vote cast successfully."

---

### Q31. What is the difference between a Provider and a Signer in Ethers.js?
> **Answer:**
>
> Simple way to think about it:
>
> - **Provider = Read-only connection to the blockchain.** Like browsing a library — you can read all the books but you can't write in them. No private key needed.
>
> - **Signer = The wallet that can sign and send transactions.** Like having a pen at the library — you can actually write things. In our case, the Signer is the user's MetaMask wallet. When you want to write a vote, Ethers.js asks MetaMask to sign the transaction.
>
> When I call read functions (like getting vote counts), I use just a Provider. When I call write functions (like casting a vote), I need a Signer.

---

### Q32. How did you implement dark/light mode?
> **Answer:**
>
> I built a `ThemeContext` using React Context API.
>
> How it works:
> 1. `ThemeContext.jsx` stores a `theme` state ('light' or 'dark') and a toggle function
> 2. On app load, it checks `localStorage` — if the user had previously set a theme, restore it. Otherwise default to system preference.
> 3. When theme changes, it sets an attribute on the root HTML element: `document.documentElement.setAttribute('data-theme', 'dark')`
> 4. In `index.css`, I define CSS variables that change based on this attribute:
>    - `:root { --bg: #ffffff; --text: #000000; }`
>    - `[data-theme='dark'] { --bg: #0f172a; --text: #f8fafc; }`
>    - All components use `var(--bg)` and `var(--text)` instead of hardcoded colors
>
> Result: Toggling the theme switches every component's color instantly without page reload.

---

### Q33. How did you implement role-based access control on the frontend?
> **Answer:**
>
> I built a `ProtectedRoute` wrapper component in React Router.
>
> It does two checks:
> 1. **Is the user logged in?** (Does the JWT exist in AuthContext?) → If not, redirect to login page.
> 2. **Does the user have the right role?** (Is their role in the allowed roles list?) → If not, redirect to home page.
>
> Usage in routes:
> ```
> Admin-only route:
>   ProtectedRoute (allowedRoles=['admin']) → AdminDashboard
>
> SuperAdmin-only route:
>   ProtectedRoute (allowedRoles=['superadmin']) → SuperAdminPanel
> ```
>
> If a Student manually types `/admin/dashboard` in the URL bar, the ProtectedRoute catches it and redirects them home. The backend also validates JWT roles on every API call, so there's double protection.

---

### Q34. How did you handle loading states during a blockchain transaction?
> **Answer:**
>
> Blockchain transactions are slow — they can take 5-30 seconds to be mined. The user shouldn't stare at a frozen screen.
>
> Here's how I handled it:
>
> 1. When user clicks "Vote," I immediately set a `isVoting = true` state
> 2. The Vote button becomes disabled and shows a spinner with "Casting vote..."
> 3. MetaMask popup appears — user confirms
> 4. I call `await tx.wait()` which pauses until the transaction is confirmed on-chain
> 5. Once confirmed: set `isVoting = false`, show green success toast, update UI
>
> **Error states I handled:**
> - User clicks "Reject" in MetaMask → catch `ACTION_REJECTED` error → show "Transaction cancelled"
> - Not whitelisted → smart contract reverts → catch and show "You are not on the whitelist"
> - Already voted → catch and show "You have already voted"
> - Wrong network → catch and show "Please switch to Sepolia network"
>
> The key principle: never leave the user confused. Always show loading → success or a clear error message.

---

### Q35. How did the whitelist upload work on the admin side?
> **Answer:**
>
> In the Admin Dashboard, I built a file dropzone component. Here's exactly what happens:
>
> 1. Admin drags and drops (or selects) a `.csv` file containing wallet addresses
> 2. Browser reads the file using the `FileReader` API — this is pure JavaScript, no library needed
> 3. I parse the CSV text — split by newlines, skip the header row
> 4. **Validation:** Every address must match the Ethereum address format:
>    - Starts with `0x`
>    - Exactly 42 characters total
>    - Only hex characters (0-9, a-f, A-F) after `0x`
> 5. If any address is invalid, I stop immediately and show "Line 5: Invalid address format"
> 6. If all valid, I send the clean list to the backend API
> 7. Backend generates the Merkle Tree, computes the Merkle Root, and returns it
> 8. Frontend calls the smart contract's `setMerkleRoot(root)` using Ethers.js
> 9. MetaMask pops up — admin confirms — root is stored on-chain
> 10. Success toast: "500 voters whitelisted successfully!"

---

### Q36. How did you handle API calls to the backend?
> **Answer:**
>
> I used the native browser Fetch API. The JWT token is stored in AuthContext after login.
>
> For every protected API call:
> - I include the JWT in the `Authorization` header: `Bearer <token>`
> - The backend middleware checks this token on every request
> - If the token is invalid or expired, backend returns 401 and I redirect to login
>
> I created a small utility function `fetchWithAuth(url, options)` that automatically adds the Authorization header. All my API calls use this utility so I don't repeat the header code in every component.
>
> I also handle network errors — if the Render backend is sleeping (free tier) and takes time to wake up, I show a "Loading..." state while retrying.

---

### Q37. How did you detect and handle wrong network (not Sepolia)?
> **Answer:**
>
> Our smart contracts are deployed on Sepolia. If the user is on Mainnet or another chain, all contract calls will fail silently or give confusing errors.
>
> I handled this with Wagmi's `useChainId()` hook:
> - Sepolia's chain ID is `11155111`
> - I constantly compare the user's current chain ID with this
> - If they don't match, I show a warning banner: "You're on the wrong network. Please switch to Sepolia."
> - I added a "Switch Network" button that calls Wagmi's `switchChain({ chainId: 11155111 })` — this prompts MetaMask to automatically switch the user to Sepolia
>
> This way the user never gets a confusing blockchain error. They get a clear message and a one-click fix.

---

### Q38. What was the hardest part of your frontend work?
> **Answer:**
>
> The hardest part was the **complete voting flow** — coordinating three different async operations at the same time:
>
> 1. Fetch Merkle Proof from backend (API call — can fail if backend is down)
> 2. MetaMask transaction (user can reject, can fail if not enough gas, can revert on-chain)
> 3. Update UI properly at every step with loading, success, and error states
>
> Each step can fail in different ways with different error messages. A blockchain revert error looks very different from a network error or a MetaMask rejection error. I had to write a catch handler that correctly identified the error type and showed the right message.
>
> It took several debugging sessions to handle all edge cases. But once it worked smoothly, it was the most satisfying part of the project.

---

### Q39. Where did you struggle the most during development?
> **Answer:**
>
> My biggest struggle was understanding SIWE authentication — specifically what signing means vs what a transaction means.
>
> At first I thought both required gas. Then I realized signing is just cryptographic proof (free, off-chain) while a transaction actually writes to blockchain (costs gas, takes time). Once I understood that distinction, everything clicked.
>
> The second struggle was wallet state management. When a user switches MetaMask networks while logged in, the app needs to:
> - Detect the network change
> - Lock the voting interface
> - Prompt the user to switch back to Sepolia
>
> Getting Wagmi hooks to work with my custom AuthContext so all of this happened automatically took a lot of trial and error.
>
> The third struggle was parsing raw Ethereum error messages. When a transaction reverts, the error is a huge nested JavaScript object. I had to figure out where inside that object the human-readable error message was hiding (it's in `err.reason` or `err.data.message`).

---

## 🏗️ SECTION 6 — Architecture & Design Choices

### Q40. Why did you choose React for the frontend?
> **Answer:**
>
> Three reasons:
>
> 1. **The whole Web3 ecosystem is built around React.** Libraries like Wagmi and RainbowKit are React-specific. They provide hooks (`useAccount`, `useChainId`) that fit naturally with React's component model. Building wallet integration in vanilla JS would have taken 3x more code.
>
> 2. **React is great for dynamic UIs.** Our app state changes a lot — wallet connects/disconnects, network switches, vote transaction in progress, results updating. React's state and re-rendering model handles all this cleanly.
>
> 3. **Team familiarity.** We'd all used React in previous projects, so there was no learning curve for the framework itself. We could focus on learning the Web3 concepts.

---

### Q41. Why did you choose Vite over Create React App?
> **Answer:**
>
> Create React App (CRA) is slow because it bundles the entire app every time you save a file. With our large dependencies like Ethers.js and RainbowKit, CRA's start time was 30-60 seconds.
>
> Vite is fundamentally faster because during development it doesn't bundle at all. It uses the browser's native module system (ES Modules) to serve files directly. When you save a file, only that file updates — the rest of the app stays the same. So HMR (Hot Module Replacement) is nearly instant.
>
> Simple comparison: CRA builds the entire house every time you change one brick. Vite only updates the changed brick.

---

### Q42. Why MongoDB and not SQL (like PostgreSQL)?
> **Answer:**
>
> Our data structure has a lot of nesting. An Organization has members (array), elections (array), each election has candidates (array), each candidate has vote counts.
>
> In SQL, this would require 5+ tables with foreign keys and complex JOIN queries. In MongoDB, all of this is one document — one query gets everything.
>
> Also, our schema changed constantly during development. New fields were added to organizations, new election metadata, AI context fields. In SQL, every change needs a migration script. In MongoDB, you just add the field. Existing documents still work.
>
> Rule of thumb: MongoDB for flexible, nested data with changing schemas. SQL for highly relational data with strict structure and complex transactions.

---

### Q43. Why store votes on blockchain instead of just MongoDB?
> **Answer:**
>
> Because the whole point of the project is to remove the need to trust a central database.
>
> If votes were in MongoDB, whoever controls the database can change results. That includes us as developers. Users would have no way to verify the true results.
>
> On Ethereum blockchain, the vote data is:
> - **Immutable** — Cannot be changed by anyone
> - **Transparent** — Anyone can verify on Etherscan
> - **Decentralized** — No single point of failure or control
>
> Yes, there's a trade-off: blockchain transactions cost gas and take a few seconds. But for a voting platform where integrity is the core feature, that trade-off is 100% worth it.

---

## 📈 SECTION 7 — Scaling, Future & Improvements

### Q44. How would you scale BlockBloom for 100,000 users?
> **Answer:**
>
> Current setup (Render free tier, Sepolia testnet) is just for demonstration. For real scale:
>
> **Backend Scaling:**
> - Move to AWS or GCP with auto-scaling (more servers spin up automatically when traffic increases)
> - Add Redis caching for frequently read data like election details and org info
> - RabbitMQ already helps because events are processed asynchronously
>
> **Blockchain Scaling (the hardest part):**
> - Ethereum mainnet handles only 15 transactions/second. 100k voters can't all vote at once.
> - Solution: Deploy on a **Layer 2 network** like Polygon or Arbitrum — same Ethereum security, but 100x cheaper fees and much higher throughput
> - Or implement **gasless voting** (EIP-2771): voters sign votes off-chain (free), a relayer submits them to the chain in batches
>
> **Frontend Scaling:**
> - Vercel already auto-scales
> - Add a CDN for faster loading globally
>
> **Database:**
> - MongoDB Atlas has built-in horizontal scaling (sharding)
> - Read replicas for high traffic

---

### Q45. What are your future improvements for BlockBloom?
> **Answer:**
>
> Several things we'd want to add given more time:
>
> 1. **Real-time vote counts with WebSockets:** Right now you need to refresh to see updated counts. With WebSockets, vote counts would update live on everyone's screen as votes come in — like watching live election results on TV.
>
> 2. **Gasless voting (EIP-2771):** Voters need a small amount of Sepolia ETH to pay gas. This is a barrier. With meta-transactions, the organization pays gas on behalf of voters. Voters just sign a message (free) and a relayer submits the transaction.
>
> 3. **Mobile support:** MetaMask has a mobile app with a built-in browser. Making BlockBloom work seamlessly on mobile would significantly increase accessibility.
>
> 4. **Token-weighted voting:** Instead of one person = one vote, members could vote proportionally based on how many governance tokens they hold — a real DAO feature.
>
> 5. **On-chain treasury management:** Let the organization hold funds in a smart contract wallet. If a proposal passes, funds are released automatically.
>
> 6. **Multi-chain support:** Currently Sepolia only. Supporting Polygon, Arbitrum, and BSC would let organizations pick the cheapest chain.

---

### Q46. How would you handle production security if this were a real product?
> **Answer:**
>
> Multiple layers:
>
> **Smart Contract Security:**
> - Get contracts audited by a security firm before deploying to mainnet
> - Use OpenZeppelin's battle-tested contract libraries (like their MerkleProof verification) instead of writing cryptographic logic from scratch
> - Add re-entrancy guards, access modifiers, and pause functionality for emergencies
>
> **Backend Security:**
> - JWT tokens with short expiry (1 hour) and refresh tokens
> - Rate limiting (we already have this) to prevent brute force attacks
> - Validate and sanitize all API inputs
> - Store all secrets in environment variables, never hardcode
> - HTTPS only, strict CORS configuration
>
> **Frontend Security:**
> - Never store private keys in the browser (MetaMask handles this)
> - Content Security Policy (CSP) headers
> - Validate all data from API before displaying
>
> **Infrastructure:**
> - MongoDB behind a firewall — only accessible from backend server, not public internet
> - Separate environments: development, staging, production

---

## 🤔 SECTION 8 — Conceptual & Tricky Questions

### Q47. Is BlockBloom a real DAO?
> **Answer:**
>
> BlockBloom is a platform for building DAO-style governance — but it's not a DAO itself.
>
> A fully featured DAO has three things:
> 1. **Treasury** — Community funds held in a smart contract wallet
> 2. **Token voting** — You vote with governance tokens proportional to your stake
> 3. **Automatic execution** — If a proposal passes, the action executes automatically (like sending treasury funds)
>
> BlockBloom currently handles the voting part well — wallet-based authentication, whitelisting, tamper-proof votes. But it doesn't yet have treasury management or token-weighted voting.
>
> So think of BlockBloom as the foundation for DAO governance. We've built the voting and governance layer; future improvements would add treasury and tokens to make it a full DAO platform.

---

### Q48. What is the difference between signing a message and sending a transaction?
> **Answer:**
>
> This is a key distinction that confused me at first:
>
> **Signing a message:**
> - Happens entirely off-chain (not on blockchain)
> - Zero gas fee — completely free
> - Just creates a cryptographic signature proving "I own this wallet"
> - MetaMask shows: "Sign this message?" — no ETH is spent
> - Used for: SIWE login, proving identity
>
> **Sending a transaction:**
> - Goes to the Ethereum blockchain and changes state
> - Costs gas (ETH)
> - Takes time to be mined (5-30 seconds)
> - MetaMask shows the gas fee and asks to confirm
> - Used for: Casting a vote, setting Merkle Root
>
> In BlockBloom, login uses signing (free, proves who you are). Voting uses a transaction (costs gas, permanently records the vote).

---

### Q49. What is a Public Key, Private Key, and Wallet Address?
> **Answer:**
>
> Simple analogy: think of it like a mailbox system.
>
> - **Private Key = Your secret key to the mailbox.** Never share it with anyone. MetaMask stores it securely. You use it to sign transactions.
>
> - **Public Key = Derived from the private key using math.** Used to verify that a signature was made by the private key. You don't usually share this directly.
>
> - **Wallet Address = Your mailbox number (like 0xAbcd...).** Derived by hashing the public key. This is what you share with others to receive ETH or to be added to a voter whitelist.
>
> The key relationship: Private Key → (generates) → Public Key → (hashed) → Wallet Address. You can go forward but never backward. Given a wallet address, it's mathematically impossible to figure out the private key.

---

### Q50. What is Etherscan and how did you use it?
> **Answer:**
>
> Etherscan is a website that works like a search engine for the Ethereum blockchain. You can paste any wallet address, transaction hash, or contract address and see all its history.
>
> We used Etherscan during development for:
> - **Verifying contract deployment** — after deploying, we'd paste the contract address into Etherscan Sepolia to confirm it was live
> - **Debugging transactions** — when a vote transaction failed, we'd look at the Tx Hash on Etherscan to see exactly where it reverted and what error it gave
> - **Checking event logs** — we'd verify that `VoteCast` events were being emitted correctly after voting
>
> In production, Etherscan is the tool users would use to independently verify vote results without trusting us.

---

### Q51. What is a Tx Hash?
> **Answer:**
>
> A Tx Hash (transaction hash) is a unique ID for every transaction on the blockchain — like a receipt number.
>
> It's a 66-character string starting with `0x`. It's generated by hashing the transaction data.
>
> When a user casts a vote, MetaMask generates a Tx Hash and the frontend shows it. The user can copy this hash and paste it into Etherscan to see:
> - Was the vote confirmed?
> - Which candidate did they vote for?
> - How much gas did they pay?
> - Which block was it included in?

---

## 🛠️ SECTION 9 — Debugging Stories

### Q52. Tell me about a major bug you fixed in the project.
> **Answer (use the 403 bug — it's a great story):**
>
> One of the most confusing bugs was a `403 Forbidden` error when the admin tried to upload a voter whitelist.
>
> **The Problem:**
> The backend was checking: "Is the person uploading this the same person who created this election?" It compared the wallet address stored in MongoDB as the election creator against the logged-in admin's wallet address.
>
> But we had redeployed our smart contracts (because we made changes to the Solidity code). The old MongoDB records still had the old contract's admin wallet address as the "creator." The new admin wallet was different. So the backend kept saying 403 — "you're not the creator."
>
> **The Fix:**
> - We added a database reset script that clears old election data whenever contracts are redeployed
> - We added a `force=true` admin override for SuperAdmins to bypass the creator check in emergency
> - I updated the frontend to show a clear error message: "Election data is out of sync. Please contact SuperAdmin."
>
> **What I learned:** Always version your deployment data. When you redeploy smart contracts, the on-chain state is fresh but your database still has old references.

---

### Q53. What was the 500 error during whitelist upload and how did you fix it?
> **Answer:**
>
> After fixing the 403, we hit a 500 Internal Server Error on the same upload endpoint.
>
> **The Problem:**
> The backend was supposed to compute the Merkle Root and then call `contract.setMerkleRoot(root)` to save it on-chain. But this call was being signed by the backend server's own wallet (stored as `ADMIN_PRIVATE_KEY` in env). That server wallet had 0 Sepolia ETH — it couldn't pay gas.
>
> **The Fix:**
> We redesigned the architecture:
> 1. Backend only computes and returns the Merkle Root to the frontend (no on-chain call)
> 2. Frontend receives the root
> 3. Frontend calls `contract.setMerkleRoot(root)` using the admin's connected MetaMask wallet
> 4. MetaMask prompts the admin to confirm and pay the gas fee
>
> This was actually a better design — the gas burden is on the organization admin who is running the election, not on our backend server. It also means our backend doesn't need to hold any ETH.

---

### Q54. How did you handle "Out of Gas" errors?
> **Answer:**
>
> Sometimes MetaMask under-estimates the gas required for complex operations. The Merkle Proof verification inside the smart contract involves multiple hash operations, which uses more gas than a simple transaction.
>
> When this happened, the transaction would fail mid-execution with "out of gas."
>
> **Fix:**
> I added a manual `gasLimit` override in the Ethers.js transaction call:
> `await contract.vote(candidateId, proof, { gasLimit: 250000 });`
>
> I arrived at 250,000 by first calling Ethers.js's gas estimator, which gave ~180,000, and then I added a 40% buffer (about 70,000 extra). This ensures the transaction always has enough gas to complete, even on a congested network.

---

## 💼 SECTION 10 — HR & Behavioral

### Q55. What was your specific role in the team?
> **Answer:**
>
> I was the frontend developer. My job was to take the backend APIs and blockchain contracts my teammates built and turn them into a working, user-friendly application.
>
> Specifically:
> - I built all 7 React pages from scratch
> - I integrated MetaMask wallet connection using Wagmi and RainbowKit
> - I wrote all the Ethers.js code to interact with smart contracts from the browser
> - I built the admin whitelist upload flow with CSV parsing and validation
> - I implemented authentication (SIWE login, JWT storage, protected routes)
> - I built dark/light mode, toast notifications, and responsive layouts
>
> I also played a coordination role — I defined what API endpoints we needed from Kushagra and what contract functions I needed from Chinmay, so we could all work in parallel.

---

### Q56. What did you learn from building BlockBloom?
> **Answer:**
>
> BlockBloom taught me how to think about Web3 from a frontend developer's perspective. Before this project, I had zero experience with blockchain development.
>
> **Technical learnings:**
> - How Ethereum works at a conceptual level — wallets, transactions, gas, smart contracts
> - How Ethers.js bridges JavaScript with the blockchain
> - What Merkle Trees are and why they're used in real-world systems
> - How SIWE authentication differs from traditional login
> - How to handle async blockchain transactions gracefully in a React UI
>
> **Architecture learnings:**
> - How to design a system where blockchain is the source of truth but a database handles the flexible data
> - How message queues (RabbitMQ) make systems reliable under load
>
> **Soft skills:**
> - Coordinating with teammates on API contracts and ABI changes
> - Debugging issues across three different layers (frontend, backend, blockchain) at the same time

---

### Q57. What would you do differently if you rebuilt BlockBloom from scratch?
> **Answer:**
>
> Three main things:
>
> 1. **Use TypeScript from day one.** Plain JavaScript doesn't catch type errors. Smart contract functions are very strict about types — a uint256 is not the same as a string. TypeScript would have caught these mismatches at compile time instead of at runtime when a transaction fails.
>
> 2. **Deploy on a Layer 2 from the start.** Ethereum Sepolia simulates mainnet where gas fees are very high. Polygon and Arbitrum are Layer 2 networks — same Ethereum security but 100x cheaper gas and much faster. This would make the voting experience much smoother.
>
> 3. **Write frontend unit tests.** We tested manually. For a voting platform, correctness is critical. I'd add unit tests for the voting flow, Merkle Proof validation, and authentication logic.

---

### Q58. How did the team coordinate during development?
> **Answer:**
>
> We divided the project into three clear independent areas — frontend, backend, and smart contracts — so most of the time we worked without blocking each other.
>
> **Key coordination points:**
> - Before writing any code, Kushagra and I agreed on API endpoint names, request formats, and response structures. I built the frontend against these agreed contracts while he built the actual implementation.
> - Chinmay gave me the ABI and contract addresses after deployment so I could integrate Ethers.js.
>
> **One challenge we faced:**
> Chinmay updated the smart contract (changed some function names and parameters) after I had already integrated Ethers.js. My frontend calls suddenly broke. From this we learned: freeze the contract interface before frontend integration starts.
>
> **Tools:**
> We used GitHub with feature branches and pull requests. Merge conflicts were rare because our code was in completely different folders.

---

### Q59. What was the biggest challenge the team faced?
> **Answer:**
>
> Scope management. We originally planned to build a full DAO platform with:
> - On-chain treasury management
> - Token-based voting (vote weight proportional to token holdings)
> - Proposal auto-execution
>
> After two weeks we realized we were building too many things and nothing would be properly tested in time. We sat down and decided to cut scope:
> - Keep: secure voting, Merkle whitelisting, SIWE auth, role management, AI chatbot
> - Remove for now: treasury, token voting, auto-execution
>
> This was the right call. We delivered a working, stable product on time instead of a half-built ambitious one. It taught me that a clean MVP beats a feature-heavy broken product every time.

---

### Q60. Is the project live? Can I try it?
> **Answer:**
>
> Yes! The frontend is live at **block-bloom-seven.vercel.app**.
>
> To try it:
> 1. Install MetaMask browser extension
> 2. Add the Sepolia test network to MetaMask
> 3. Get free Sepolia ETH from a faucet (google.com web3 faucet)
> 4. Connect wallet and explore
>
> Smart contracts are deployed on Ethereum Sepolia testnet. You can look up our contract addresses on Sepolia Etherscan and verify every vote that was ever cast during our demo.

---

## 🔢 SECTION 11 — Quick Terminology Questions

### Q61. What is MetaMask?
> **Answer:**
> MetaMask is a browser wallet extension for Ethereum. It securely stores your private key, lets you connect to dApps (decentralized apps), sign messages, and approve transactions. When you vote in BlockBloom, MetaMask handles the signing and sending of the transaction.

---

### Q62. What is a Testnet Faucet?
> **Answer:**
> A faucet is a website that gives you free testnet tokens (like Sepolia ETH). Testnet ETH has no real value but lets you pay gas fees on testnets for development and testing. We used Google's web3 faucet during testing.

---

### Q63. What is an RPC endpoint?
> **Answer:**
> RPC (Remote Procedure Call) endpoint is a URL that gives you access to an Ethereum node. Instead of running your own node (expensive), we used **Alchemy** as an RPC provider. Our frontend and backend connect to Alchemy's URL to read/write blockchain data.

---

### Q64. What is Alchemy?
> **Answer:**
> Alchemy is a blockchain infrastructure company. They run Ethereum nodes and provide an API (RPC endpoint) that developers can use. It's like AWS but for Ethereum nodes. We used Alchemy's free tier to connect both our frontend (Wagmi config) and smart contract deployment scripts to the Sepolia network.

---

### Q65. What is EIP-2771 (Meta Transactions)?
> **Answer:**
> EIP-2771 is a standard for gasless transactions. Normally, the voter pays gas. With meta-transactions, the voter signs a message (free), sends it to a "relayer" server, and the relayer submits the actual blockchain transaction and pays the gas. The organization sponsors the gas fees so voters can participate for free.

---

## ⚡ CHEAT SHEET — Quick Analogies & Key Numbers

### Analogies to remember:
| Concept | Simple Analogy |
|---------|---------------|
| **Smart Contract** | Vending machine — fixed rules, works automatically, no middleman |
| **Blockchain** | Google Doc that nobody can delete lines from |
| **Merkle Root** | A fingerprint of the entire voter list |
| **Merkle Proof** | Your ID proving you're on the list without showing everyone else |
| **Gas Fee** | Postage stamp — you pay to send a transaction |
| **Transaction Revert** | Undo button — if a condition fails, everything resets |
| **SIWE Login** | Showing your ID card — proves who you are without a password |
| **Nonce** | One-time OTP — prevents someone from reusing your signature |
| **Signing a message** | Showing ID (free, proves identity) |
| **Sending a transaction** | Signing a cheque (costs money, makes a permanent change) |
| **RabbitMQ** | Post office sorting room — queues events, processes them in order |
| **RAG (AI)** | Open-book exam — AI uses your database as the textbook |
| **MetaMask** | Digital wallet + identity card for Ethereum |
| **Etherscan** | Search engine for the blockchain |
| **Provider (Ethers.js)** | Library card — read-only access |
| **Signer (Ethers.js)** | Pen + library card — can read and write |

### Key numbers to remember:
| Fact | Value |
|------|-------|
| Team size | 3 (Nikhil — Frontend, Chinmay — Contracts, Kushagra — Backend) |
| User roles | 3 (SuperAdmin, Admin, Student) |
| Smart contracts | 2 (ElectionFactory, Election) |
| Merkle Root size | 32 bytes (no matter how many voters) |
| Network deployed on | Ethereum Sepolia testnet |
| Sepolia chain ID | 11155111 |
| Frontend deployed on | Vercel |
| Backend deployed on | Render |
| AI model used | Google Gemini API |

### The complete flow in one line:
```
Connect MetaMask → SIWE login (sign nonce → JWT) → Browse elections
→ Get Merkle Proof from backend → Click Vote → MetaMask confirms
→ Smart contract verifies proof + records vote → RabbitMQ updates MongoDB
```

---

## 📌 SECTION 1 — Project Introduction & Core Motivation

### Q1. Tell me about your BlockBloom project.
> **Answer:**
>
> BlockBloom is a decentralized voting platform that we built for organizations (like colleges, clubs, or DAOs) to conduct secure, transparent, and tamper-proof elections.
>
> In traditional voting apps, all votes are stored in a central database (like MySQL or MongoDB). This means anyone who has admin access to that database can modify the records, delete votes, or add fake votes, and the users would never know. We wanted to eliminate this trust issue.
>
> We split the application into two parts:
> 1. **Off-chain data (MongoDB):** Storing user profiles, organization details, and proposal discussions.
> 2. **On-chain data (Ethereum Blockchain):** Storing candidates and the actual votes.
>
> Once a vote is cast, it is recorded as a transaction on the Ethereum blockchain, making it permanent, immutable, and auditable by anyone in the world.
>
> We were a team of 3:
> - **Nikhil (Me):** Handled the entire Frontend (React, Vite, Ethers.js, Wagmi, RainbowKit) and on-chain wallet integrations.
> - **Chinmay:** Handled the Blockchain layer (Solidity smart contracts, Hardhat tests, and Sepolia deployment).
> - **Kushagra:** Handled the Backend (Node.js, Express, MongoDB), the RabbitMQ queue, and the Google Gemini AI chatbot.

---

### Q2. What real-world problem does this solve? Why not just use Google Forms?
> **Answer:**
>
> Google Forms is centralized. The form creator can delete responses, edit them, or just choose to show whatever results they want. There is no audit trail.
>
> BlockBloom solves **three main problems**:
> 1. **Data Tampering:** Once a vote is cast on-chain, it cannot be modified by anyone. Even the SuperAdmin of the system cannot alter the votes.
> 2. **Double Voting:** Smart contracts enforce that one wallet address can only vote once per election. The rules are written in code and executed by the blockchain, not a human.
> 3. **Verifier Trust:** Anyone can verify the results. You don't have to trust the organizer's database; you can look up the smart contract on Etherscan and verify every single vote transaction.

---

### Q3. Explain the full system architecture of BlockBloom.
> **Answer:**
>
> The project has a **three-tier architecture** with an asynchronous sync worker:
>
> ```
>  +--------------------------------------------+
>  |                 FRONTEND                   |
>  |            (React, Vite, Tailwind)         |
>  |      Connects to MetaMask via RainbowKit   |
>  +----------+----------------------+-----------+
>             |                      |
>    HTTP REST Requests      Direct Contract Calls
>    (JWT Authenticated)     (using Ethers.js)
>             |                      |
>             v                      v
>  +----------+---------+  +---------+----------+
>  |      BACKEND       |  |     BLOCKCHAIN     |
>  |  (Node.js/Express) |  | (Sepolia Testnet)  |
>  |  Stores metadata   |  | Smart Contracts    |
>  |  Generates proofs  |  | Stores active votes|
>  +----------+---------+  +---------+----------+
>             |                      |
>        Reads/Writes           Emits Events
>             |                      |
>             v                      v
>  +----------+---------+  +---------+----------+
>  |     DATABASE       |  |  RABBITMQ WORKER   |
>  |    (MongoDB)       |<-| Listens to events  |
>  | Stores profiles,   |  | Updates database   |
>  | orgs, proposals    |  | asynchronously     |
>  +--------------------+  +--------------------+
> ```
>
> 1. **Client Layer (Frontend):** A React Single Page Application (SPA). It uses **Ethers.js** to talk to the blockchain and **Fetch API** to talk to the backend.
> 2. **Application Server (Backend):** An Express.js REST API. It handles SIWE authentication, manages organizations, generates Merkle Proofs for whitelisting, and serves as a gateway to the AI model.
> 3. **Blockchain Layer (Consensus):** Solidity smart contracts deployed on Ethereum Sepolia.
> 4. **Asynchronous Sync Layer (RabbitMQ & Workers):** A background worker listens for smart contract events (like `VoteCast` or `ElectionCreated`), pushes them to RabbitMQ, and updates MongoDB. This keeps our database in sync with the blockchain without slowing down the frontend.

---

### Q4. Walk me through the complete end-to-end flow from logging in to casting a vote.
> **Answer:**
>
> Here is the exact path a user takes:
>
> 1. **Wallet Connection:** The user visits the app, clicks "Connect Wallet", and RainbowKit prompts MetaMask to connect.
> 2. **SIWE Auth:** The frontend requests a cryptographic "nonce" (a random number) from the backend. The user signs a login message containing this nonce using MetaMask. The frontend sends this signature back to the backend. The backend verifies the signature, confirms ownership of the wallet, and issues a JWT token.
> 3. **Dashboard:** The user navigates to their organization's page. The frontend requests the list of elections from MongoDB (using the JWT in the header).
> 4. **Voter Whitelist Check:** When the user clicks on an election, the frontend asks the backend: *"Give me the Merkle Proof for my wallet address."* The backend checks MongoDB to see if the address is in the CSV whitelist uploaded by the Admin. If yes, it returns the Merkle Proof (a set of hashes).
> 5. **Voting Transaction:** The user selects a candidate and clicks "Vote". The frontend calls the smart contract's `vote(candidateId, proof)` function using Ethers.js. MetaMask pops up, showing the gas fee. The user signs the transaction.
> 6. **On-Chain Verification & Storage:** The smart contract receives the transaction. It validates the Merkle Proof against the stored Merkle Root, checks that `hasVoted[msg.sender]` is false, marks them as having voted, increments the candidate's vote, and emits a `VoteCast` event.
> 7. **Database Sync:** The backend worker detects the `VoteCast` event, pushes a message to RabbitMQ, and updates MongoDB to increment the vote count and mark the user as voted. The frontend displays a success toast.

---

## ⛓️ SECTION 2 — Chinmay's Part: Smart Contracts & Blockchain Basics

### Q5. What smart contracts did Chinmay write, and what do they do?
> **Answer:**
>
> Chinmay wrote two smart contracts in Solidity:
>
> 1. **ElectionFactory.sol:** 
>    - This implements the **Factory Pattern**.
>    - It has a function `createElection(string name, bytes32 merkleRoot, string[] candidates)`.
>    - When called by an Admin, it deploys a brand new `Election.sol` contract on the blockchain.
>    - It keeps track of all deployed election addresses so the frontend can query them.
>
> 2. **Election.sol:**
>    - This represents a single election.
>    - It stores:
>      - The election name.
>      - The `backendAdmin` address (the backend server wallet).
>      - The `merkleRoot` (for whitelisting).
>      - The candidates and their vote counts.
>      - A mapping: `mapping(address => bool) public hasVoted`.
>    - It has a function `vote(uint256 candidateId, bytes32[] proof)` that verifies the voter is whitelisted, registers the vote, and marks the address as voted.
>    - It has a function `setMerkleRoot(bytes32 newRoot)` so the admin can update the whitelist.

---

### Q6. How did the smart contracts get compiled and deployed?
> **Answer:**
>
> We used **Hardhat**, which is a Node.js-based development environment for Ethereum.
>
> 1. **Compilation:** We wrote a configuration file `hardhat.config.js` specifying the Solidity version. Running `npx hardhat compile` compiles the contracts into **bytecode** (what runs on EVM) and generates **ABIs** (JSON files describing contract interfaces).
> 2. **Deployment script:** Chinmay wrote a deployment script in JavaScript using Hardhat’s ethers wrapper. It reads private keys from an `.env` file, connects to the Ethereum Sepolia RPC URL (we used Alchemy as our node provider), and deploys the `ElectionFactory` contract.
> 3. **Address storage:** Once deployed, the contract address was saved in `frontend/src/contracts.json` so my frontend code knew where to send transactions.

---

### Q7. How did Chinmay test the smart contracts?
> **Answer:**
>
> He wrote unit tests in JavaScript using **Mocha** (testing framework) and **Chai** (assertion library) running on Hardhat's local network.
>
> He tested:
> - **Deployment:** Does the Factory deploy an election correctly?
> - **Voting:** Can a whitelisted user vote successfully? Does it increment the candidate's count?
> - **Double Voting:** Does the contract revert (fail) if a user tries to vote a second time?
> - **Unauthorized Access:** Does the contract block non-admins from calling `setMerkleRoot()`?
> - **Merkle Verification:** Does the contract correctly block users who provide an invalid Merkle Proof?

---

### Q8. What are Solidity events, and why did the team use them?
> **Answer:**
>
> An **Event** in Solidity is a way for a smart contract to write logs to the blockchain. These logs are cheap to write (compared to updating storage variables) but cannot be read by other smart contracts. However, external applications (like our backend server) can listen for these logs in real-time.
>
> We used events to keep our database in sync with the blockchain:
> - When a vote is successfully cast, `Election.sol` emits `event VoteCast(address indexed voter, uint256 candidateId)`.
> - When a new election is created, `ElectionFactory.sol` emits `event ElectionCreated(address contractAddress, string name)`.
>
> Our backend runs a service that listens for these events. When they occur, it updates our MongoDB database instantly.

---

### Q9. What does it mean when a transaction is "reverted" on Ethereum?
> **Answer:**
>
> In Solidity, we use check statements like `require()`. For example:
> `require(!hasVoted[msg.sender], "Already voted");`
>
> If the condition inside `require` evaluates to `false`, the transaction is **reverted**. This means:
> 1. All changes made during the transaction are completely rolled back (as if the transaction never happened).
> 2. The user is still charged a gas fee for the computation used up to the point of failure.
> 3. The contract returns an error message (like "Already voted") to the caller.
>
> In my frontend, Ethers.js catches this revert error, and I show it to the user as a red error toast.

---

## 💾 SECTION 3 — Kushagra's Part: Backend, RabbitMQ, and AI

### Q10. What backend stack did Kushagra build?
> **Answer:**
>
> He built a REST API using **Node.js** and **Express.js**. 
> - **MongoDB & Mongoose:** Used to store user data, organization structures, and chat history.
> - **JWT (JSON Web Tokens):** Used to authorize routes. After SIWE login, all client requests must send the JWT in the headers.
> - **RabbitMQ:** Used as a message broker to queue blockchain synchronization tasks.
> - **Google Gemini API:** Integrated to power our AI governance chatbot.

---

### Q11. Why did the project need RabbitMQ? Can't we just write to MongoDB directly?
> **Answer:**
>
> We used RabbitMQ to prevent database bottlenecks and ensure reliability.
>
> Blockchain events can be unpredictable. If 1,000 users vote in a short window, the blockchain will emit 1,000 `VoteCast` events. If the backend tries to handle each event by opening a connection to MongoDB, writing to the database, and updating the UI synchronously:
> 1. The database might crash under the load.
> 2. If the backend server crashes mid-process, we lose track of which votes were synced.
>
> **RabbitMQ solves this:**
> - When the backend detects a blockchain event, it immediately drops it into a RabbitMQ queue (takes micro-seconds) and keeps listening.
> - A separate background **Worker Process** pulls messages from the RabbitMQ queue one by one and updates MongoDB.
> - If the database goes down, the messages stay safely in the RabbitMQ queue until it recovers.
> - This separates the API from the syncing process, making the system highly reliable and scalable.

---

### Q12. How does the AI Chatbot work under the hood? Explain RAG.
> **Answer:**
>
> The AI chatbot is designed to answer questions specific to an organization (e.g., *"What is the deadline for Proposal #3?"*). If we just sent this question to Gemini, it wouldn't know the answer because it doesn't have access to our private MongoDB.
>
> To solve this, Kushagra implemented **RAG (Retrieval-Augmented Generation)**:
> 1. The user asks the chatbot a question in the React UI.
> 2. The frontend sends the question and the organization ID to the backend.
> 3. The backend queries MongoDB for recent proposals, election metadata, and uploaded documents for that specific organization.
> 4. The backend builds a detailed prompt for Gemini, combining the retrieved database data as "context" along with the user's question.
> 5. Gemini reads this context and formulates a response based *only* on the verified data.
> 6. The response is returned to the user on the frontend.
>
> This prevents the AI from making things up (hallucinating) and keeps answers accurate.

---

## 🔒 SECTION 4 — Authentication & Security (SIWE & Merkle Trees)

### Q13. Explain SIWE (Sign-In with Ethereum) in simple terms.
> **Answer:**
>
> Traditional authentication uses a username and password. The server checks if the password hash matches the database.
>
> SIWE is passwordless. It relies on **Public-Key Cryptography**:
> 1. Every user has a private key (stored securely in MetaMask) and a public key (their wallet address, public to everyone).
> 2. The server sends a unique, random string called a **nonce** to the frontend.
> 3. The user signs a standard message containing this nonce using their private key in MetaMask. This produces a cryptographic signature.
> 4. The frontend sends the signature and wallet address to the backend.
> 5. The backend uses the signature and the message to mathematically recover the public key (wallet address). If the recovered address matches the address they claimed to own, authentication is successful.
>
> It is extremely secure because the private key never leaves MetaMask, and no passwords are sent over the network.

---

### Q14. What is a "Replay Attack" and how does the nonce prevent it?
> **Answer:**
>
> A replay attack is when a hacker intercepts a valid signed message and sends it to the server again to log in as that user.
>
> **How the nonce prevents this:**
> 1. When the user requests a login, the backend generates a unique nonce (e.g., `928374`) and stores it in the user's session.
> 2. The user signs the message: *"Sign into BlockBloom with nonce 928374"*.
> 3. The backend receives the signature, verifies it, checks that the nonce matches `928374`, and immediately **deletes the nonce** from the session.
> 4. If a hacker intercepts the signature and tries to send it again, the backend checks the nonce `928374`. Since it was already used and deleted, the backend rejects it.

---

### Q15. Explain how a Merkle Tree verification works in the smart contract.
> **Answer:**
>
> Instead of storing 1,000 voter addresses on the blockchain (which would cost massive gas fees), we store a single 32-byte hash called the **Merkle Root**.
>
> **Verification Process:**
> 1. When an Admin uploads the whitelist, the backend builds a Merkle Tree from the voter addresses.
> 2. The Merkle Root is submitted to the contract.
> 3. To vote, the frontend requests a **Merkle Proof** from the backend. The proof is a list of sibling hashes in the tree required to reconstruct the root from the user's address.
> 4. The user calls `vote(candidateId, proof)`.
> 5. The smart contract takes the sender's address (`msg.sender`), hashes it, and hashes it sequentially with the hashes in the `proof` array.
> 6. If the final computed hash matches the stored `merkleRoot`, the contract knows the user's address was part of the original whitelist.
>
> This is a zero-knowledge-style proof: we prove membership in a list without storing the list on-chain.

---

## 🖥️ SECTION 5 — Frontend Implementation (Nikhil's Core Contribution)

### Q16. How did you set up RainbowKit and Wagmi in your React app?
> **Answer:**
>
> I initialized Wagmi and RainbowKit in the `main.jsx` file at the root of the project:
>
> 1. **Configuration:** I created a Wagmi configuration using `getDefaultConfig` from RainbowKit. I passed our project name, target chain (Sepolia), and an Alchemy RPC provider URL.
> 2. **Query Client:** Set up a TanStack Query (`@tanstack/react-query`) client, which Wagmi uses internally to manage caching and async state.
> 3. **Providers:** Wrapped the app component hierarchy:
>    ```jsx
>    <WagmiProvider config={config}>
>      <QueryClientProvider client={queryClient}>
>        <RainbowKitProvider>
>          <App />
>        </RainbowKitProvider>
>      </QueryClientProvider>
>    </WagmiProvider>
>    ```
> 4. **Usage:** In the navbar component, I added `<ConnectButton />` from RainbowKit. This handles the wallet connection modal and displays the connected account.

---

### Q17. How did you use Ethers.js to read from and write to a smart contract?
> **Answer:**
>
> Ethers.js acts as the bridge between React and the Ethereum network.
>
> **To Read Data (Free, no gas):**
> I created a provider using the browser’s Ethereum provider, instantiated the contract, and called the view function:
> ```javascript
> const provider = new ethers.BrowserProvider(window.ethereum);
> const contract = new ethers.Contract(contractAddress, ElectionABI, provider);
> const candidateData = await contract.candidates(candidateId);
> ```
>
> **To Write Data (Requires gas, needs user signature):**
> I requested the signer (the user's wallet) from the provider, instantiated the contract with the signer, and invoked the function:
> ```javascript
> const provider = new ethers.BrowserProvider(window.ethereum);
> const signer = await provider.getSigner(); // Request permission to sign
> const contract = new ethers.Contract(contractAddress, ElectionABI, signer);
> const tx = await contract.vote(candidateId, merkleProof);
> await tx.wait(); // Wait for the transaction to be mined
> ```

---

### Q18. What is the difference between Ethers.js providers and signers?
> **Answer:**
>
> - **Provider (Read-Only):** A Provider is a read-only connection to the blockchain. It lets you query block numbers, check balances, read contract variables, and look up transactions. It does not require a private key and cannot sign transactions.
> - **Signer (Write):** A Signer represents an Ethereum account that has the authority to sign messages and submit transactions. In our app, the Signer is the user's MetaMask wallet. When you call a state-changing contract function using a Signer, Ethers.js forwards the transaction request to MetaMask, prompting the user to approve the transaction.

---

### Q19. How did you handle user network switches in React?
> **Answer:**
>
> BlockBloom is deployed on the Sepolia network. If a user is connected to Ethereum Mainnet or Polygon, contract calls will fail.
>
> I handled this using Wagmi's `useChainId()` hook:
> 1. In my app, I define the target chain ID (Sepolia is `11155111`).
> 2. I check if the user's connected chain ID matches the target.
> 3. If they do not match, I block the voting interface and display a warning banner: *"Please switch to Sepolia Network to interact."*
> 4. I added a button to trigger network switching programmatically using Wagmi's `switchChain` hook:
>    ```javascript
>    const { switchChain } = useSwitchChain();
>    // switchChain({ chainId: 11155111 })
>    ```

---

### Q20. How did you implement Route Protection in React Router?
> **Answer:**
>
> I built a wrapper component called `ProtectedRoute.jsx`.
>
> 1. It consumes the `AuthContext` to check if the user has a valid JWT token.
> 2. It accepts an optional `allowedRoles` array (e.g., `['superadmin', 'admin']`).
> 3. **Logic:**
>    - If the user is not logged in, it redirects them to the `/login` page.
>    - If they are logged in but their role is not in the `allowedRoles` list, it redirects them to the home page (unauthorized).
>    - If they meet all requirements, it renders the child components using `<Outlet />`.
>
> **Route Setup:**
> ```jsx
> <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
>   <Route path="/admin/dashboard" element={<AdminDashboard />} />
> </Route>
> ```

---

### Q21. Explain the Theme Context implementation details.
> **Answer:**
>
> I built a theme toggler using React Context and CSS Variables.
>
> 1. **ThemeContext.jsx:** Stores the state `theme` ('light' or 'dark') and a toggle function.
> 2. **Persistence:** On mount, it checks `localStorage` or browser preferences to set the initial theme.
> 3. **DOM Mutation:** When the theme changes, it updates the `document.documentElement` class list or sets an attribute:
>    `document.documentElement.setAttribute('data-theme', theme)`
> 4. **CSS Styling:** I used CSS Variables in my index.css:
>    ```css
>    :root { --bg-color: #ffffff; --text-color: #000000; }
>    [data-theme='dark'] { --bg-color: #0f172a; --text-color: #f8fafc; }
>    body { background-color: var(--bg-color); color: var(--text-color); }
>    ```
> This configuration allows for instant theme transitions across all components without page reloads.

---

### Q22. How did you handle file parsing and validation for the voter whitelist?
> **Answer:**
>
> In the Admin Dashboard, I created a dropzone file input.
>
> 1. **File Reading:** When a CSV file is dropped, I use the native JavaScript `FileReader` API:
>    ```javascript
>    const reader = new FileReader();
>    reader.readAsText(file);
>    reader.onload = (e) => { const text = e.target.result; parseCSV(text); }
>    ```
> 2. **Parsing:** I split the text by newlines and filter out headers.
> 3. **Validation:** For each line, I check if it's a valid Ethereum address format:
>    - Must start with `0x`.
>    - Must be exactly 42 characters long.
>    - Regex check: `/^0x[a-fA-F0-9]{40}$/`.
> 4. **Error Reporting:** If any address is malformed, I abort the upload and show an error toast specifying which line has the invalid address. If all are valid, I send the clean array to the backend.

---

### Q23. What is the structure of your `contracts.json` file?
> **Answer:**
>
> The `contracts.json` file is a configuration file that connects my frontend to deployed smart contracts.
> It contains two main keys:
> 1. **addresses:** Maps network names to deployed contract addresses.
>    ```json
>    {
>      "sepolia": {
>        "ElectionFactory": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
>      }
>    }
>    ```
> 2. **abis:** Contains the complete ABI array for both `ElectionFactory` and `Election`. This defines the function signatures that Ethers.js uses to encode transaction inputs.

---

## 🛠️ SECTION 6 — Debugging & Problem Solving

### Q24. How did you debug smart contract interaction failures on the frontend?
> **Answer:**
>
> When a contract write fails, Ethers.js returns a complex nested error object. To debug:
>
> 1. **Check the code property:** I look for the error code. For example, `ACTION_REJECTED` means the user clicked "Cancel" in MetaMask.
> 2. **Inspect the data property:** If the contract reverted, the error object contains a nested `error.data` or `error.reason` field showing the revert message (e.g., *"Already voted"*).
> 3. **Console logging:** I set up an error handler that logs the raw error and displays a simplified message to the user:
>    ```javascript
>    try { ... } catch (err) {
>      const message = err.reason || err.message || "Transaction failed";
>      showToast(message, "error");
>    }
>    ```
> 4. **Hardhat Console:** During development on the local network, we added `console.log()` inside Solidity contracts (supported by Hardhat) to print variables directly to our terminal when a call was made.

---

### Q25. What was the "403 Forbidden" CSV upload bug, and how did you resolve it?
> **Answer (excellent troubleshooting story):**
>
> We hit a bug where uploading a voter whitelist CSV returned a `403 Forbidden` error from our backend.
>
> **The Problem:**
> The backend authorization middleware was checking if the user uploading the file was the creator of the election in the database:
> `const isCreator = election.creator.toLowerCase() === userAddress;`
>
> We had deployed a new version of our smart contracts, but the database still contained election entries created under the old factory contract. The database `creator` field for those elections was set to an old wallet address, so when the Admin tried to upload the whitelist using their new wallet, the backend rejected it as unauthorized.
>
> **The Fix:**
> 1. We added a `?force=true` query parameter to the upload route for SuperAdmins to allow force-syncing.
> 2. We updated the database seeding scripts to purge old mock data whenever new smart contracts are deployed.
> 3. I updated the frontend to gracefully handle the error and guide the Admin to create a new election instance if a permission error occurred.

---

### Q26. What was the "500 Internal Server Error" during whitelist upload, and how did you resolve it?
> **Answer (another strong debug story):**
>
> After fixing the authorization check, the CSV upload failed with a `500 Internal Server Error`.
>
> **The Problem:**
> When the admin uploaded a whitelist, the backend generated the Merkle Root and tried to write it to the smart contract:
> `await contract.setMerkleRoot(root);`
>
> This write transaction was signed using the backend's configured wallet private key (`ADMIN_PRIVATE_KEY` in env vars). The transaction reverted because the backend wallet had **0.0 Sepolia ETH** and couldn't pay for gas.
>
> **The Fix:**
> We resolved this by modifying the architecture to bypass backend gas limits:
> 1. We modified the backend to only calculate the Merkle Root and return it to the frontend, without executing the transaction.
> 2. The frontend receives the Merkle Root, requests the user's signature, and calls `setMerkleRoot` on-chain directly from the browser.
> 3. This offloaded the gas fee from our backend server to the Admin's connected MetaMask wallet, which resolved the 500 error.

---

### Q27. What is a "gas limit" vs "gas price"? How did you handle out-of-gas errors?
> **Answer:**
>
> - **Gas Limit:** The maximum amount of gas units a user is willing to spend on a transaction.
> - **Gas Price:** The amount of Gwei (fraction of ETH) the user pays per unit of gas.
>
> **Handling Out-of-Gas Errors:**
> If a transaction exceeds the gas limit, it reverts with an "Out of Gas" error.
> 1. Ethers.js estimates the gas limit automatically using `contract.estimateGas.vote(...)` before sending the transaction.
> 2. In some cases, MetaMask under-estimates the gas required for complex verifications (like Merkle Proofs).
> 3. To fix this, I set a manual override in the transaction options to add a safety buffer:
>    `await contract.vote(candidateId, proof, { gasLimit: 250000 });`
> This allocates enough gas to complete the transaction safely.

---

## 📈 SECTION 7 — Scaling & Performance

### Q28. How would you handle voting if Ethereum congestion makes gas prices spike?
> **Answer:**
>
> If Ethereum Mainnet is congested, a single vote could cost $10 in gas fees. To scale this for real-world use:
>
> 1. **Deploy on Layer 2 (L2):** Move the contracts to a Layer 2 network like **Polygon, Arbitrum, or Optimism**. L2s process transactions off-chain and submit them to Ethereum in batches, reducing gas fees to a fraction of a cent.
> 2. **Gasless Transactions (Meta-Transactions - EIP-2771):**
>    - The voter signs a message stating: *"I vote for Candidate A"*. This is a signature, which costs zero gas.
>    - The signature is sent to a backend relayer.
>    - The relayer submits the transaction to the blockchain and pays the gas fee. The organization sponsors the gas, so voters can vote for free.

---

### Q29. How does the RabbitMQ setup prevent database inconsistencies if the server crashes?
> **Answer:**
>
> RabbitMQ has a feature called **Message Acknowledgments**.
>
> 1. The worker pulls a job from the queue (e.g., *"Sync Vote for User A"*).
> 2. RabbitMQ marks the message as "Unacknowledged" but keeps it in memory.
> 3. The worker attempts to write the vote data to MongoDB.
> 4. If the server crashes mid-write:
>    - The connection drops.
>    - RabbitMQ detects the worker went offline and puts the message back at the front of the queue.
> 5. When the server restarts, the worker pulls the message again and retries the sync.
> 6. Once the write succeeds, the worker sends an `ack` (acknowledgment) to RabbitMQ, which deletes the message. This prevents data loss.

---

### Q30. Why did you use React Context instead of Redux?
> **Answer:**
>
> Redux is useful for apps with high-frequency state updates or complex data pipelines.
>
> In BlockBloom, our global state is minimal:
> - User Auth State (is logged in? token? address? role?)
> - UI Theme (dark/light)
> - Active loading states
>
> Using Redux would require setting up actions, reducers, and selectors, which adds unnecessary boilerplate. React Context API handles this state size cleanly, keeps the bundle size small, and is easier to maintain.

---

### Q31. What is React's "Hot Module Replacement" (HMR), and how does Vite optimize it?
> **Answer:**
>
> HMR updates modules in a running application without requiring a full page refresh, which preserves the application state.
>
> **Vite Optimization:**
> - Create React App uses Webpack. Webpack rebuilds and bundles the entire application structure whenever a file is modified, which gets slower as the codebase grows.
> - Vite utilizes native ES modules (ESM). It only transpiles and serves the specific file that was edited. The browser requests the updated file directly, resulting in instant HMR updates regardless of project size.

---

## 🤖 SECTION 8 — Conceptual Web3 Questions

### Q32. Explain the difference between a Public Key, Private Key, and Wallet Address.
> **Answer:**
>
> - **Private Key (Password):** A 256-bit random number (represented as a 64-character hex string). It is stored in MetaMask and used to sign transactions. It must never be shared.
> - **Public Key (Account Identity):** Derived from the private key using the Elliptic Curve Digital Signature Algorithm (ECDSA). It is used to verify that a signature came from the private key owner.
> - **Wallet Address (Account Number):** Derived by hashing the public key (Keccak-256) and taking the last 20 bytes (prefixed with `0x`). This is what users share to receive funds or identify themselves in the system.

---

### Q33. What is a transaction hash (Tx Hash)?
> **Answer:**
>
> A transaction hash is a unique 66-character identifier (using SHA-256) generated when a transaction is submitted to the blockchain. It acts as a digital receipt. You can paste a Tx Hash into a block explorer like Etherscan to view transaction details, including:
> - Sender and receiver addresses.
> - Gas spent.
> - Transaction status (Success/Fail).
> - Deployed contract logs and inputs.

---

### Q34. What is a Block Explorer (e.g., Etherscan)?
> **Answer:**
>
> A block explorer is a search engine for the blockchain. It queries blockchain nodes directly to display on-chain data in a user-friendly web interface.
> We used Etherscan to check if our contracts deployed successfully on Sepolia and to verify that the transactions triggered by Ethers.js were processed correctly.

---

### Q35. What is the difference between `ethers.BrowserProvider` and `ethers.JsonRpcProvider`?
> **Answer:**
>
> - **`BrowserProvider` (Client Wallet):** Used when interacting with an in-browser wallet like MetaMask (`window.ethereum`). It forwards transaction signing requests to the browser extension.
> - **`JsonRpcProvider` (Direct Connection):** Connects directly to an Ethereum node via an RPC endpoint (like Alchemy or Infura) without using a wallet. It can read contract data but cannot sign or submit transactions.

---

### Q36. What is a "Mapping" in Solidity?
> **Answer:**
>
> A mapping is a hash table structure in Solidity:
> `mapping(keyType => valueType)`
>
> In `Election.sol`, we use `mapping(address => bool) public hasVoted`.
> Unlike JavaScript Maps, Solidity mappings do not store keys or have a size property. If a key has not been set, querying it returns the default value (e.g., `false` for booleans). Lookups are $O(1)$, which helps minimize gas costs.

---

### Q37. What is the difference between `view` and `pure` functions in Solidity?
> **Answer:**
>
> - **`view`:** A function that reads state variables from the contract but does not modify them (e.g., querying vote counts). Calling a `view` function from the frontend does not require gas.
> - **`pure`:** A function that does not read or modify state variables (e.g., executing a utility math calculation). Like `view` functions, these do not cost gas.

---

### Q38. What is the EVM (Ethereum Virtual Machine)?
> **Answer:**
>
> The EVM is the global, sandboxed runtime environment that executes smart contract code on the Ethereum network. Solidity code is compiled into EVM bytecode, which is run by Ethereum nodes. This ensures that smart contracts produce identical results on every machine on the network.

---

### Q39. What is a Testnet Faucet?
> **Answer:**
>
> A testnet faucet is a web service that sends free testnet tokens (like Sepolia ETH) to a user's wallet address. This allows developers to pay gas fees on test networks during development.

---

## 💼 SECTION 9 — Team Coordination & Behavioral

### Q40. How did the team divide the work?
> **Answer:**
>
> We defined clear boundaries between our components:
> - **Nikhil (Me) - Frontend:** Developed the React application, wallet integrations, on-chain transaction calls, and administrative controls.
> - **Chinmay - Smart Contracts:** Developed the Solidity contracts, wrote Hardhat unit tests, and managed deployments.
> - **Kushagra - Backend:** Built the Express API, set up the MongoDB database, implemented RabbitMQ, and integrated the Gemini chatbot.
>
> We agreed on API endpoints and JSON structures before writing code, which allowed us to work in parallel.

---

### Q41. How did you resolve the git conflicts when contract ABIs updated?
> **Answer:**
>
> When smart contracts were updated and redeployed, the ABI changes broke my frontend transaction formatting.
>
> To resolve this:
> 1. We centralized contract configurations in `frontend/src/contracts.json`.
> 2. Chinmay updated this file in his repository branch after each deployment.
> 3. I pulled the updated file and adjusted my Ethers.js parameters to match the new ABI signatures.

---

### Q42. What was the biggest non-technical challenge the team faced?
> **Answer:**
>
> Our biggest challenge was **scope management**. We initially planned to build a fully decentralized DAO featuring on-chain treasury management and token-based voting.
>
> We realized that deploying multiple complex features within our timeline would make it difficult to test everything thoroughly. We narrowed our scope to focus on a secure voting workflow, role-based governance controls, and whitelisting. This adjustment allowed us to deliver a stable, working project on time.

---

### Q43. What would you do differently if you rebuilt this today?
> **Answer:**
>
> 1. **Use TypeScript:** Plain JavaScript does not enforce types. TypeScript would catch contract call parameter mismatches at compile time, saving debugging time.
> 2. **Build on Layer 2:** I would deploy to Polygon or Arbitrum from the start to ensure low gas fees for users.
> 3. **Implement Gasless Relay (EIP-2771):** I would set up a relayer so users could vote without needing testnet ETH.

---

### Q44. How did you verify the final integration worked correctly?
> **Answer:**
>
> We performed end-to-end integration testing:
> 1. Purged mock data from MongoDB.
> 2. Deployed contracts to Sepolia.
> 3. Logged in with Admin credentials, created an election, and uploaded a whitelist CSV.
> 4. Connected a whitelisted voter wallet and submitted a vote.
> 5. Verified that:
>    - MetaMask confirmed the transaction.
>    - The contract state updated.
>    - The backend worker updated MongoDB.
>    - The voting page updated to show the vote was recorded.

---

### Q45. Why is this project the highlight of your resume?
> **Answer:**
>
> It demonstrates my ability to build Web3 integrations.
> It shows I can design frontends that handle real-time blockchain states, manage decentralized logins, and connect with microservices like RabbitMQ and AI models. This practical experience is more valuable than typical web projects.

---

## ⚡ CHEAT SHEET — Quick Analogies

| Web3 Concept | Real World Analogy |
|--------------|-------------------|
| **Smart Contract** | A vending machine. You insert input, and it outputs the result automatically based on rules. |
| **Merkle Root** | A single lock on a secure container. |
| **Merkle Proof** | The key that opens the lock for your specific item, without opening other locks. |
| **Gas Fee** | A postage stamp. You pay to send your transaction across the network. |
| **Revert** | An undo button. If a condition fails, the system resets to its previous state. |
| **RabbitMQ** | A post office sorting system. It queues incoming mail and processes it sequentially. |
| **RAG (AI)** | An open-book exam. The AI is given the textbook (your database) to answer questions. |
| **Private Key** | Your physical signature stamp. Keep it locked away. |
| **Public Key** | Your ID card. Used to verify the signature. |
| **Address** | Your mailbox number. Share it to receive mail. |
