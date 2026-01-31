import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

function getArg(name, fallback) {
  const arg = process.argv.find((item) => item.startsWith(`--${name}=`));
  if (!arg) return fallback;
  const value = arg.split("=", 2)[1];
  return value ?? fallback;
}

const intervalMinutes = Number(getArg("interval-minutes", "30"));
const jitterPct = Number(getArg("jitter-pct", "2"));
const once = process.argv.includes("--once");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function applyJitter(price, pct) {
  const swing = (Math.random() * 2 - 1) * pct;
  return price * (1 + swing / 100);
}

async function seedPrices() {
  const skins = await prisma.skin.findMany();
  if (skins.length === 0) {
    console.log("No skins found; skipping demo feed.");
    return;
  }

  const now = new Date();
  for (let i = 0; i < skins.length; i += 1) {
    const skin = skins[i];
    const latest = await prisma.priceHistory.findFirst({
      where: { skinId: skin.id, source: "buff163" },
      orderBy: { timestamp: "desc" },
    });
    const base = latest ? Number(latest.price) : 1200 + i * 250;
    const buffPrice = clamp(applyJitter(base, jitterPct), 10, 100000);
    const steamPrice = clamp(applyJitter(base * 1.01, jitterPct), 10, 100000);
    const volumeBase = 60 + i * 8;
    const buffVolume = Math.floor(volumeBase + Math.random() * 30);
    const steamVolume = Math.floor(volumeBase * 0.7 + Math.random() * 20);

    await prisma.priceHistory.createMany({
      data: [
        {
          skinId: skin.id,
          price: buffPrice,
          volume: buffVolume,
          source: "buff163",
          timestamp: now,
        },
        {
          skinId: skin.id,
          price: steamPrice,
          volume: steamVolume,
          source: "steam",
          timestamp: now,
        },
      ],
    });
  }

  console.log(
    `[demo-feed] inserted ${skins.length * 2} price rows at ${now.toISOString()}`
  );
}

async function main() {
  if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) {
    throw new Error("interval-minutes must be a positive number");
  }
  if (!Number.isFinite(jitterPct) || jitterPct <= 0) {
    throw new Error("jitter-pct must be a positive number");
  }

  await seedPrices();
  if (once) {
    await prisma.$disconnect();
    return;
  }

  const intervalMs = intervalMinutes * 60 * 1000;
  setInterval(seedPrices, intervalMs);
}

main().catch(async (error) => {
  console.error("Demo price feeder failed:", error);
  await prisma.$disconnect();
  process.exit(1);
});
