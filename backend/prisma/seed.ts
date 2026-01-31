import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import path from "node:path";

type SeedSkin = {
  id: string;
  marketHashName: string;
  buffGoodsId?: number;
  iconUrl?: string;
};

const prisma = new PrismaClient();

async function loadJson<T>(fileName: string): Promise<T> {
  const filePath = path.join(process.cwd(), "prisma", "seed", fileName);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function main() {
  const seedDemo = process.env.SEED_DEMO === "true";
  const skins = await loadJson<SeedSkin[]>("skins.json");

  if (skins.length > 0) {
    await prisma.skin.createMany({
      data: skins.map((skin) => ({
        id: skin.id,
        marketHashName: skin.marketHashName,
        buffGoodsId: skin.buffGoodsId ?? null,
        iconUrl: skin.iconUrl ?? null
      })),
      skipDuplicates: true
    });
  }

  const existingHistory = await prisma.priceHistory.count();
  if (existingHistory === 0 || seedDemo) {
    const skinRows = await prisma.skin.findMany();
    const now = Date.now();
    const points = 24;
    const historyRows: {
      skinId: string;
      price: number;
      volume: number;
      source: string;
      timestamp: Date;
    }[] = [];
    skinRows.forEach((skin, index) => {
      const basePrice = 1200 + index * 350;
      for (let i = points - 1; i >= 0; i -= 1) {
        const timestamp = new Date(now - i * 60 * 60 * 1000);
        const wobble = (i % 6) * 8 - 12;
        const buffPrice = basePrice + wobble;
        const steamPrice = basePrice + wobble * 0.8 + 10;
        historyRows.push(
          {
            skinId: skin.id,
            price: Number(buffPrice.toFixed(2)),
            volume: 120 + i * 3 + index * 5,
            source: "buff163",
            timestamp
          },
          {
            skinId: skin.id,
            price: Number(steamPrice.toFixed(2)),
            volume: 80 + i * 2 + index * 3,
            source: "steam",
            timestamp
          }
        );
      }
    });
    if (historyRows.length > 0) {
      await prisma.priceHistory.createMany({
        data: historyRows.map((row) => ({
          skinId: row.skinId,
          price: row.price,
          volume: row.volume,
          source: row.source,
          timestamp: row.timestamp
        }))
      });
    }
  }

  const existingSessions = await prisma.unboxSession.count();
  if (existingSessions === 0 || seedDemo) {
    const session = await prisma.unboxSession.create({
      data: {
        hostAddress: "0xDEMO00000000000000000000000000000000001",
        status: "BETTING",
        totalPool: 0,
        startTime: new Date(Date.now() - 5 * 60 * 1000),
        endTime: new Date(Date.now() + 55 * 60 * 1000)
      }
    });
    const bets = [
      {
        sessionId: session.id,
        userAddress: "0xA1b2c3d4E5f607182930405060708090A1B2C3D4",
        prediction: "BLUE",
        amount: 120,
        payout: null
      },
      {
        sessionId: session.id,
        userAddress: "0xF1e2D3c4B5a607182930405060708090F1E2D3C4",
        prediction: "GOLD",
        amount: 250,
        payout: 500
      },
      {
        sessionId: session.id,
        userAddress: "0x1111222233334444555566667777888899990000",
        prediction: "KNIFE",
        amount: 75,
        payout: 0
      },
      {
        sessionId: session.id,
        userAddress: "0x2222333344445555666677778888999900001111",
        prediction: "BLUE",
        amount: 180,
        payout: null
      },
      {
        sessionId: session.id,
        userAddress: "0x3333444455556666777788889999000011112222",
        prediction: "GOLD",
        amount: 320,
        payout: null
      },
      {
        sessionId: session.id,
        userAddress: "0x4444555566667777888899990000111122223333",
        prediction: "KNIFE",
        amount: 90,
        payout: 0
      },
      {
        sessionId: session.id,
        userAddress: "0x5555666677778888999900001111222233334444",
        prediction: "BLUE",
        amount: 60,
        payout: null
      },
      {
        sessionId: session.id,
        userAddress: "0x6666777788889999000011112222333344445555",
        prediction: "GOLD",
        amount: 140,
        payout: 280
      }
    ];
    await prisma.unboxBet.createMany({
      data: bets.map((bet) => ({
        sessionId: bet.sessionId,
        userAddress: bet.userAddress,
        prediction: bet.prediction,
        amount: bet.amount,
        payout: bet.payout
      }))
    });
    const totalPool = bets.reduce((sum, bet) => sum + bet.amount, 0);
    await prisma.unboxSession.update({
      where: { id: session.id },
      data: { totalPool }
    });

    const uniqueAddresses = Array.from(new Set(bets.map((bet) => bet.userAddress)));
    await prisma.userStats.createMany({
      data: uniqueAddresses.map((address) => ({
        address,
        totalBets: 1,
        totalWins: bets.some((bet) => bet.userAddress === address && (bet.payout ?? 0) > bet.amount)
          ? 1
          : 0,
        totalWagered: bets
          .filter((bet) => bet.userAddress === address)
          .reduce((sum, bet) => sum + bet.amount, 0),
        totalProfit: bets
          .filter((bet) => bet.userAddress === address)
          .reduce((sum, bet) => sum + (bet.payout ?? 0) - bet.amount, 0)
      })),
      skipDuplicates: true
    });

    const transactions = bets.flatMap((bet) => {
      const items = [
        {
          address: bet.userAddress,
          module: "unbox",
          type: "BET",
          amount: -bet.amount,
          sessionId: bet.sessionId
        }
      ];
      if (bet.payout !== null) {
        items.push({
          address: bet.userAddress,
          module: "unbox",
          type: "PAYOUT",
          amount: bet.payout,
          sessionId: bet.sessionId
        });
      }
      return items;
    });
    await prisma.userTransaction.createMany({
      data: transactions.map((tx) => ({
        address: tx.address,
        module: tx.module,
        type: tx.type,
        amount: tx.amount,
        sessionId: tx.sessionId,
        betId: null
      }))
    });

    await prisma.userTransaction.createMany({
      data: [
        {
          address: uniqueAddresses[0] ?? "0xDEMO00000000000000000000000000000000002",
          module: "price",
          type: "DEPOSIT",
          amount: 500,
          sessionId: null,
          betId: null
        },
        {
          address: uniqueAddresses[1] ?? "0xDEMO00000000000000000000000000000000003",
          module: "price",
          type: "WITHDRAW",
          amount: -120,
          sessionId: null,
          betId: null
        }
      ]
    });
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
