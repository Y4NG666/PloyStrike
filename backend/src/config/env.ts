import dotenv from "dotenv";

dotenv.config();

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function getOptionalEnv(name: string, fallback?: string): string | null {
  return process.env[name] ?? fallback ?? null;
}

export const env = {
  databaseUrl: getEnv("DATABASE_URL"),
  apiPort: Number(process.env.API_PORT ?? "3001"),
  wsIntervalMs: Number(process.env.WS_INTERVAL_MS ?? "10000"),
  scraperIntervalMs: Number(process.env.SCRAPER_INTERVAL_MS ?? "600000"),
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS ?? "15000"),
  requestMinDelayMs: Number(process.env.REQUEST_MIN_DELAY_MS ?? "300"),
  requestMaxDelayMs: Number(process.env.REQUEST_MAX_DELAY_MS ?? "900"),
  redisUrl: getOptionalEnv("REDIS_URL"),
  oraclePrivateKey: getOptionalEnv("ORACLE_PRIVATE_KEY"),
  oracleRpcUrl: getOptionalEnv("ORACLE_RPC_URL"),
  oracleAdapterAddress: getOptionalEnv("ORACLE_ADAPTER_ADDRESS"),
  oracleIntervalMs: Number(process.env.ORACLE_INTERVAL_MS ?? "120000"),
  oracleChallengeMs: Number(process.env.ORACLE_CHALLENGE_MS ?? "120000"),
  oracleDiffPct: Number(process.env.ORACLE_DIFF_PCT ?? "0.05"),
  oracleMaxSwingPct: Number(process.env.ORACLE_MAX_SWING_PCT ?? "0.5"),
  unboxIntervalMs: Number(process.env.UNBOX_INTERVAL_MS ?? "10000"),
  priceKeeperIntervalMs: Number(process.env.PRICE_KEEPER_INTERVAL_MS ?? "30000"),
  priceOptionPoolAddress: getOptionalEnv("PRICE_OPTION_POOL_ADDRESS")
};
