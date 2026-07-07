/**
 * verifyDeployed.js
 *
 * Verifies that the deployed ElectionFactory and BloomToken contracts
 * on Sepolia are correct and contain the expected functions.
 *
 * Usage:
 *   npx hardhat run scripts/verifyDeployed.js --network sepolia
 */

const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const provider = ethers.provider;

  // --- Load ABIs from freshly compiled artifacts ---
  const ElectionFactoryArtifact = await hre.artifacts.readArtifact("ElectionFactory");
  const BloomTokenArtifact = await hre.artifacts.readArtifact("BloomToken");

  // --- Read the deployed addresses from frontend/src/contracts.json ---
  const fs = require("fs");
  const path = require("path");
  const contractsPath = path.join(__dirname, "../../frontend/src/contracts.json");
  const contracts = JSON.parse(fs.readFileSync(contractsPath, "utf8"));

  const factoryAddress = contracts.ElectionFactory?.address;
  const tokenAddress = contracts.BloomToken?.address;

  if (!factoryAddress || !tokenAddress) {
    console.error("❌ Could not read addresses from frontend/src/contracts.json");
    process.exit(1);
  }

  console.log("\n🔍 Verifying contracts on Sepolia...\n");
  console.log("   ElectionFactory :", factoryAddress);
  console.log("   BloomToken      :", tokenAddress);
  console.log("");

  // --- 1. Check bytecode is actually deployed ---
  const factoryCode = await provider.getCode(factoryAddress);
  const tokenCode = await provider.getCode(tokenAddress);

  const factoryDeployed = factoryCode !== "0x";
  const tokenDeployed = tokenCode !== "0x";

  console.log(`   ElectionFactory bytecode deployed : ${factoryDeployed ? "✅ YES" : "❌ NO — wrong address!"}`);
  console.log(`   BloomToken bytecode deployed      : ${tokenDeployed ? "✅ YES" : "❌ NO — wrong address!"}`);

  if (!factoryDeployed || !tokenDeployed) {
    console.error("\n❌ Verification FAILED: One or more contracts not found at the given address.");
    process.exit(1);
  }

  // --- 2. Call a read function to confirm it's the right contract ---
  const factory = new ethers.Contract(factoryAddress, ElectionFactoryArtifact.abi, provider);
  const token = new ethers.Contract(tokenAddress, BloomTokenArtifact.abi, provider);

  try {
    const allElections = await factory.getAllElections();
    console.log(`\n   ✅ ElectionFactory.getAllElections() works! (${allElections.length} elections so far)`);
  } catch (err) {
    console.error("\n   ❌ ElectionFactory call failed — ABI mismatch or wrong contract:", err.message);
    process.exit(1);
  }

  try {
    const tokenName = await token.name();
    const totalSupply = await token.totalSupply();
    console.log(`   ✅ BloomToken.name() = "${tokenName}"`);
    console.log(`   ✅ BloomToken.totalSupply() = ${ethers.formatEther(totalSupply)} BLOOM`);
  } catch (err) {
    console.error("\n   ❌ BloomToken call failed — ABI mismatch or wrong contract:", err.message);
    process.exit(1);
  }

  // --- 3. Final Summary ---
  const network = await provider.getNetwork();
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║           ✅ VERIFICATION PASSED                     ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Network         : Sepolia (chainId ${network.chainId})          ║`);
  console.log(`║  BloomToken      : ${tokenAddress}  ║`);
  console.log(`║  ElectionFactory : ${factoryAddress}  ║`);
  console.log("╚══════════════════════════════════════════════════════╝\n");
}

main().catch((err) => {
  console.error("❌ Verification script error:", err);
  process.exit(1);
});