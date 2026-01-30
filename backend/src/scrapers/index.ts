import { prisma } from "../database/client.js";
import { env } from "../config/env.js";
import { fetchBuffPrice } from "./buff163.js";
import { fetchSteamPrice } from "./steam.js";
import { processPriceSamples } from "../processors/priceProcessor.js";

async function scrapePrices() {
  const skins = await prisma.skin.findMany();
  const samples = [];
  for (const skin of skins) {
    const buffSample = await fetchBuffPrice(skin);
    if (buffSample) samples.push(buffSample);
    const steamSample = await fetchSteamPrice(skin);
    if (steamSample) samples.push(steamSample);
  }
  await processPriceSamples(samples);
}

async function runOnce() {
  await scrapePrices();
}

async function main() {
  await runOnce();
  setInterval(() => {
    runOnce().catch((error) => {
      console.error("Scraper run failed:", error);
    });
  }, env.scraperIntervalMs);
}

main().catch((error) => {
  console.error("Scraper boot failed:", error);
  process.exit(1);
});
