import { Router } from "express";
import { prisma } from "../../database/client.js";

const router = Router();

router.get("/live", async (_req, res) => {
  const skins = await prisma.skin.findMany();

  const skinSnapshots = await Promise.all(
    skins.map(async (skin) => {
      const latest = await prisma.priceHistory.findFirst({
        where: { skinId: skin.id, source: "buff163" },
        orderBy: { timestamp: "desc" }
      });
      return {
        id: skin.id,
        marketHashName: skin.marketHashName,
        latestPrice: latest ? Number(latest.price) : null
      };
    })
  );

  res.json({
    skins: skinSnapshots
  });
});

router.get("/hot", async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit ?? 8), 1), 20);
  const to = new Date();
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
  const skins = await prisma.skin.findMany();

  const markets = await Promise.all(
    skins.map(async (skin) => {
      const [latest, earliest, volumeAgg, history] = await Promise.all([
        prisma.priceHistory.findFirst({
          where: { skinId: skin.id, source: "buff163" },
          orderBy: { timestamp: "desc" }
        }),
        prisma.priceHistory.findFirst({
          where: { skinId: skin.id, source: "buff163", timestamp: { gte: from, lte: to } },
          orderBy: { timestamp: "asc" }
        }),
        prisma.priceHistory.aggregate({
          where: { skinId: skin.id, source: "buff163", timestamp: { gte: from, lte: to } },
          _sum: { volume: true }
        }),
        prisma.priceHistory.findMany({
          where: { skinId: skin.id, source: "buff163" },
          orderBy: { timestamp: "desc" },
          take: 12
        })
      ]);
      const latestPrice = latest ? Number(latest.price) : null;
      const basePrice = earliest ? Number(earliest.price) : null;
      const changePct =
        latestPrice !== null && basePrice && basePrice !== 0
          ? Number((((latestPrice - basePrice) / basePrice) * 100).toFixed(2))
          : 0;
      const historyPrices = history
        .map((row) => Number(row.price))
        .reverse();
      return {
        id: skin.id,
        marketHashName: skin.marketHashName,
        latestPrice,
        changePct,
        volume: Number(volumeAgg._sum.volume ?? 0),
        sparkline: historyPrices
      };
    })
  );

  const sorted = markets.sort((a, b) => {
    if (b.volume !== a.volume) {
      return b.volume - a.volume;
    }
    return Math.abs(b.changePct) - Math.abs(a.changePct);
  });

  res.json({ markets: sorted.slice(0, limit) });
});

export default router;
