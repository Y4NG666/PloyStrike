import { Router } from "express";
import { prisma } from "../../database/client.js";

const router = Router();

router.get("/balance", async (req, res) => {
  const address = typeof req.query.address === "string" ? req.query.address : "";
  if (!address) {
    res.status(400).json({ error: "invalid_address" });
    return;
  }
  const [inAgg, outAgg] = await Promise.all([
    prisma.userTransaction.aggregate({
      where: { address, amount: { gt: 0 } },
      _sum: { amount: true }
    }),
    prisma.userTransaction.aggregate({
      where: { address, amount: { lt: 0 } },
      _sum: { amount: true }
    })
  ]);
  const totalIn = Number(inAgg._sum.amount ?? 0);
  const totalOut = Math.abs(Number(outAgg._sum.amount ?? 0));
  const balance = totalIn - totalOut;
  res.json({
    address,
    balance,
    totalIn,
    totalOut,
    currency: "USDT"
  });
});

router.get("/transactions", async (req, res) => {
  const address = typeof req.query.address === "string" ? req.query.address : "";
  const module = typeof req.query.module === "string" ? req.query.module : "all";
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);
  if (!address) {
    res.status(400).json({ error: "invalid_address" });
    return;
  }
  if (!["all", "unbox", "price"].includes(module)) {
    res.status(400).json({ error: "invalid_module" });
    return;
  }
  const where =
    module === "all"
      ? { address }
      : {
          address,
          module
        };
  const skip = (page - 1) * limit;
  const [total, items] = await Promise.all([
    prisma.userTransaction.count({ where }),
    prisma.userTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    })
  ]);
  res.json({
    address,
    module,
    page,
    limit,
    total,
    items: items.map((tx) => ({
      id: tx.id,
      module: tx.module,
      type: tx.type,
      amount: Number(tx.amount),
      sessionId: tx.sessionId,
      betId: tx.betId,
      createdAt: tx.createdAt
    }))
  });
});

router.get("/stats", async (req, res) => {
  const address = typeof req.query.address === "string" ? req.query.address : "";
  if (!address) {
    res.status(400).json({ error: "invalid_address" });
    return;
  }
  const stats = await prisma.userStats.findUnique({
    where: { address }
  });
  if (!stats) {
    res.json({
      address,
      totalBets: 0,
      totalWins: 0,
      totalWagered: 0,
      totalProfit: 0
    });
    return;
  }
  res.json({
    address: stats.address,
    totalBets: stats.totalBets,
    totalWins: stats.totalWins,
    totalWagered: Number(stats.totalWagered),
    totalProfit: Number(stats.totalProfit)
  });
});

router.get("/history", async (req, res) => {
  const address = typeof req.query.address === "string" ? req.query.address : "";
  const module = typeof req.query.module === "string" ? req.query.module : "unbox";
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);
  if (!address) {
    res.status(400).json({ error: "invalid_address" });
    return;
  }
  if (module !== "unbox") {
    res.json({ address, module, page, limit, total: 0, items: [] });
    return;
  }
  const skip = (page - 1) * limit;
  const [total, items] = await Promise.all([
    prisma.unboxBet.count({ where: { userAddress: address } }),
    prisma.unboxBet.findMany({
      where: { userAddress: address },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { session: true }
    })
  ]);
  res.json({
    address,
    module,
    page,
    limit,
    total,
    items: items.map((bet) => ({
      id: bet.id,
      sessionId: bet.sessionId,
      prediction: bet.prediction,
      amount: Number(bet.amount),
      payout: bet.payout === null ? null : Number(bet.payout),
      createdAt: bet.createdAt,
      session: bet.session
        ? {
            status: bet.session.status,
            result: bet.session.result,
            startTime: bet.session.startTime,
            endTime: bet.session.endTime
          }
        : null
    }))
  });
});

export default router;
