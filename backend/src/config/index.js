/**
 * Centralized configuration module.
 *
 * WHY THIS EXISTS:
 * Instead of scattering `process.env.XYZ` calls across dozens of files,
 * we read every environment variable ONCE here, validate it, and export
 * a frozen config object. This means:
 *   1. Typos in env-var names are caught at startup, not at 3 AM in production.
 *   2. Every other module imports `config` — no direct `process.env` coupling.
 *   3. Adding a new variable is a single-line change in one place.
 */

require('dotenv').config();

const config = {
  // --- Server ---
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // --- MongoDB ---
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/blockbloom',
  useInMemoryDb: process.env.USE_IN_MEMORY_DB !== 'false',

  // --- Blockchain ---
  rpcUrl: process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo',
  electionFactoryAddress: process.env.ELECTION_FACTORY_ADDRESS || '0x282e16edFeAAf66a5d86665e10237A2e380e09C7',
  bloomTokenAddress: process.env.BLOOM_TOKEN_ADDRESS || '0xE79404a6a1c6085BCe9De11DC5705492eF2fF173',
  adminPrivateKey: process.env.ADMIN_PRIVATE_KEY,

  // --- CORS ---
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // --- Rate Limiting ---
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 10000,

  // --- Auth ---
  jwtSecret: process.env.JWT_SECRET || 'super-secret-default-key-please-change',

  // --- AI (Gemini) ---
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
};

/**
 * Validate that critical variables are present.
 * Log a warning if default fallback is being used.
 */
const requiredVars = ['rpcUrl', 'electionFactoryAddress'];
for (const key of requiredVars) {
  if (!config[key] || config[key].includes('0x000000000000000000000000000000000000')) {
    console.warn(`⚠️  WARNING: "${key}" is missing or unconfigured. Using fallback or disabling feature.`);
  }
}

module.exports = config;
