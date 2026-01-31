import { ethers } from "ethers";
import { env } from "../config/env.js";

const SETTLE_ABI = ["function settleExpired()"];

function buildWallet(): ethers.Wallet | null {
  if (!env.oraclePrivateKey || !env.oracleRpcUrl) {
    return null;
  }
  const provider = new ethers.JsonRpcProvider(env.oracleRpcUrl);
  return new ethers.Wallet(env.oraclePrivateKey, provider);
}

async function runOnce() {
  if (!env.priceOptionPoolAddress) {
    console.warn("PRICE_OPTION_POOL_ADDRESS not configured, skip settleExpired");
    return;
  }
  const wallet = buildWallet();
  if (!wallet) {
    console.warn("Oracle wallet not configured, skip settleExpired");
    return;
  }
  const contract = new ethers.Contract(env.priceOptionPoolAddress, SETTLE_ABI, wallet);
  const tx = await contract.settleExpired();
  await tx.wait();
}

async function main() {
  await runOnce();
  setInterval(() => {
    runOnce().catch((error) => {
      console.error("Price keeper run failed:", error);
    });
  }, env.priceKeeperIntervalMs);
}

main().catch((error) => {
  console.error("Price keeper boot failed:", error);
  process.exit(1);
});
