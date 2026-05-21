/**
 * deploy-local.js
 *
 * ONE-COMMAND LOCAL SETUP FOR ALL TEAM MEMBERS.
 *
 * This script:
 *   1. Deploys BloomToken + DAOFactory to the local Hardhat node
 *   2. Automatically writes the deployed addresses to:
 *      - frontend/src/contracts.json  (addresses section only — ABIs stay)
 *      - backend/.env                 (DAO_FACTORY_ADDRESS + BLOOM_TOKEN_ADDRESS)
 *
 * HOW TO USE (every team member, every time you restart):
 *   1. In one terminal: npx hardhat node
 *   2. In another terminal: npx hardhat run deploy-local.js --network localhost
 *   3. Start backend: cd ../backend && npm run dev
 *   4. Start frontend: cd ../frontend && npm run dev
 *
 * WHY THIS EXISTS:
 *   Hardhat assigns contract addresses based on the deployer's nonce.
 *   If two developers deploy separately, they get DIFFERENT addresses.
 *   This script writes those addresses to the right config files automatically
 *   so nobody has to manually copy-paste addresses ever again.
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n🚀 Deploying contracts with account:", deployer.address);
  console.log("   Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // ── 1. Deploy BloomToken ──────────────────────────────────────────
  console.log("📦 Deploying BloomToken...");
  const BloomToken = await ethers.getContractFactory("BloomToken");
  const initialSupply = ethers.parseEther("1000000"); // 1 million BLOOM with 18 decimals
  const bloomToken = await BloomToken.deploy(initialSupply);
  await bloomToken.waitForDeployment();
  const bloomTokenAddress = await bloomToken.getAddress();
  console.log("   ✅ BloomToken deployed to:", bloomTokenAddress);

  // ── 2. Deploy DAOFactory ──────────────────────────────────────────
  console.log("📦 Deploying DAOFactory...");
  const DAOFactory = await ethers.getContractFactory("DAOFactory");
  const daoFactory = await DAOFactory.deploy();
  await daoFactory.waitForDeployment();
  const daoFactoryAddress = await daoFactory.getAddress();
  console.log("   ✅ DAOFactory deployed to:", daoFactoryAddress);

  // ── 3. Update frontend/src/contracts.json ────────────────────────
  // Path: hardhat/ -> up one level to FinalTask/ -> frontend/src/contracts.json
  const frontendContractsPath = path.join(__dirname, "../frontend/src/contracts.json");

  if (fs.existsSync(frontendContractsPath)) {
    const contracts = JSON.parse(fs.readFileSync(frontendContractsPath, "utf8"));

    // Only update the address fields — keep all ABIs intact
    contracts.BloomToken.address = bloomTokenAddress;
    contracts.DAOFactory.address = daoFactoryAddress;

    fs.writeFileSync(frontendContractsPath, JSON.stringify(contracts, null, 2));
    console.log("\n📝 Updated frontend/src/contracts.json with new addresses");
  } else {
    console.warn("\n⚠️  Could not find frontend/src/contracts.json — skipping frontend update");
  }

  // ── 4. Update backend/.env ────────────────────────────────────────
  // Path: hardhat/ -> up one level to FinalTask/ -> backend/.env
  const backendEnvPath = path.join(__dirname, "../backend/.env");

  if (fs.existsSync(backendEnvPath)) {
    let envContent = fs.readFileSync(backendEnvPath, "utf8");

    // Replace the address lines using regex — keeps all other env vars intact
    envContent = envContent.replace(
      /^DAO_FACTORY_ADDRESS=.*/m,
      `DAO_FACTORY_ADDRESS=${daoFactoryAddress}`
    );
    envContent = envContent.replace(
      /^BLOOM_TOKEN_ADDRESS=.*/m,
      `BLOOM_TOKEN_ADDRESS=${bloomTokenAddress}`
    );

    // If the lines don't exist yet, append them
    if (!envContent.includes("DAO_FACTORY_ADDRESS=")) {
      envContent += `\nDAO_FACTORY_ADDRESS=${daoFactoryAddress}`;
    }
    if (!envContent.includes("BLOOM_TOKEN_ADDRESS=")) {
      envContent += `\nBLOOM_TOKEN_ADDRESS=${bloomTokenAddress}`;
    }

    fs.writeFileSync(backendEnvPath, envContent);
    console.log("📝 Updated backend/.env with new addresses");
  } else {
    // .env doesn't exist — first time clone! Auto-create it from .env.example
    const envExamplePath = path.join(__dirname, "../backend/.env.example");
    if (fs.existsSync(envExamplePath)) {
      let envContent = fs.readFileSync(envExamplePath, "utf8");
      // Inject the deployed addresses
      envContent = envContent.replace(/^DAO_FACTORY_ADDRESS=.*/m, `DAO_FACTORY_ADDRESS=${daoFactoryAddress}`);
      envContent = envContent.replace(/^BLOOM_TOKEN_ADDRESS=.*/m, `BLOOM_TOKEN_ADDRESS=${bloomTokenAddress}`);
      fs.writeFileSync(backendEnvPath, envContent);
      console.log("📝 Created backend/.env from .env.example with new addresses");
    } else {
      console.warn("⚠️  Could not find backend/.env or .env.example");
      console.log("   Manually create backend/.env with:");
      console.log(`   DAO_FACTORY_ADDRESS=${daoFactoryAddress}`);
      console.log(`   BLOOM_TOKEN_ADDRESS=${bloomTokenAddress}`);
    }
  }

  // ── 5. Summary ────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║          ✅ LOCAL DEPLOYMENT COMPLETE                ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  BloomToken  : ${bloomTokenAddress}  ║`);
  console.log(`║  DAOFactory  : ${daoFactoryAddress}  ║`);
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log("║  Next Steps:                                         ║");
  console.log("║  1. cd ../backend  && npm run dev                    ║");
  console.log("║  2. cd ../frontend && npm run dev                    ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
