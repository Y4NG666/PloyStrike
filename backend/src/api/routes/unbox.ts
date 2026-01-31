import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../database/client.js";
import { claimUnboxRefund, processUnboxResult } from "../../processors/unboxProcessor.js";

const UNBOX_PREDICTIONS = ["BLUE", "GOLD", "KNIFE"] as const;
type Prediction = (typeof UNBOX_PREDICTIONS)[number];

type OddsEntry = {
  prediction: string;
  totalBet: number;
  percentage: number;
  payout: number | null;
};

function buildOdds(bets: { prediction: string; amount: number }[]): OddsEntry[] {
  const totals = new Map<string, number>();
  let pool = 0;
  for (const bet of bets) {
    const amount = Number(bet.amount) || 0;
    pool += amount;
    totals.set(bet.prediction, (totals.get(bet.prediction) ?? 0) + amount);
  }
  const entries: OddsEntry[] = [];
  for (const [prediction, totalBet] of totals.entries()) {
    const payout = totalBet > 0 ? pool / totalBet : null;
    entries.push({
      prediction,
      totalBet,
      percentage: pool > 0 ? Number(((totalBet / pool) * 100).toFixed(2)) : 0,
      payout: payout ? Number(payout.toFixed(2)) : null
    });
  }
  return entries;
}

const router = Router();

router.get("/sessions", async (_req, res) => {
  const sessions = await prisma.unboxSession.findMany({
    orderBy: { createdAt: "desc" }
  });
  res.json(sessions);
});

router.get("/sessions/:id", async (req, res) => {
  const sessionId = Number(req.params.id);
  if (!Number.isFinite(sessionId)) {
    res.status(400).json({ error: "invalid_session_id" });
    return;
  }
  const session = await prisma.unboxSession.findUnique({
    where: { id: sessionId },
    include: { bets: true }
  });
  if (!session) {
    res.status(404).json({ error: "session_not_found" });
    return;
  }
  res.json(session);
});

router.post("/sessions", async (req, res) => {
  const hostAddress = typeof req.body?.hostAddress === "string" ? req.body.hostAddress : null;
  const durationSeconds =
    typeof req.body?.durationSeconds === "number" && req.body.durationSeconds > 0
      ? Math.min(req.body.durationSeconds, 3600)
      : 60;
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + durationSeconds * 1000);
  const session = await prisma.unboxSession.create({
    data: {
      hostAddress,
      status: "BETTING",
      totalPool: new Prisma.Decimal(0),
      startTime,
      endTime
    }
  });
  res.status(201).json(session);
});

router.post("/sessions/:id/bets", async (req, res) => {
  const sessionId = Number(req.params.id);
  if (!Number.isFinite(sessionId)) {
    res.status(400).json({ error: "invalid_session_id" });
    return;
  }
  const userAddress = typeof req.body?.userAddress === "string" ? req.body.userAddress : "";
  const prediction = typeof req.body?.prediction === "string" ? req.body.prediction : "";
  const amount = typeof req.body?.amount === "number" ? req.body.amount : NaN;

  if (!userAddress || !UNBOX_PREDICTIONS.includes(prediction as Prediction)) {
    res.status(400).json({ error: "invalid_bet_payload" });
    return;
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: "invalid_bet_amount" });
    return;
  }

  const session = await prisma.unboxSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    res.status(404).json({ error: "session_not_found" });
    return;
  }
  if (session.status !== "BETTING") {
    res.status(409).json({ error: "betting_closed" });
    return;
  }
  if (session.endTime && new Date() > session.endTime) {
    res.status(409).json({ error: "betting_ended" });
    return;
  }

  const amountDecimal = new Prisma.Decimal(amount);
  const result = await prisma.$transaction(async (tx) => {
    const bet = await tx.unboxBet.create({
      data: {
        sessionId,
        userAddress,
        prediction,
        amount: amountDecimal
      }
    });
    await tx.userTransaction.create({
      data: {
        address: userAddress,
        module: "unbox",
        type: "BET",
        amount: amountDecimal.mul(-1),
        sessionId,
        betId: bet.id
      }
    });
    const updatedSession = await tx.unboxSession.update({
      where: { id: sessionId },
      data: { totalPool: { increment: amountDecimal } }
    });
    await tx.userStats.upsert({
      where: { address: userAddress },
      update: {
        totalBets: { increment: 1 },
        totalWagered: { increment: amountDecimal }
      },
      create: {
        address: userAddress,
        totalBets: 1,
        totalWins: 0,
        totalWagered: amountDecimal,
        totalProfit: new Prisma.Decimal(0)
      }
    });
    return { bet, session: updatedSession };
  });

  res.status(201).json(result);
});

router.get("/sessions/:id/odds", async (req, res) => {
  const sessionId = Number(req.params.id);
  if (!Number.isFinite(sessionId)) {
    res.status(400).json({ error: "invalid_session_id" });
    return;
  }
  const bets = await prisma.unboxBet.findMany({
    where: { sessionId },
    select: { prediction: true, amount: true }
  });
  const odds = buildOdds(
    bets.map((bet) => ({
      prediction: bet.prediction,
      amount: Number(bet.amount || 0)
    }))
  );
  res.json({ sessionId, odds });
});

router.post("/sessions/:id/resolve", async (req, res) => {
  const sessionId = Number(req.params.id);
  if (!Number.isFinite(sessionId)) {
    res.status(400).json({ error: "invalid_session_id" });
    return;
  }
  const result = typeof req.body?.result === "string" ? req.body.result : "";
  if (!UNBOX_PREDICTIONS.includes(result as Prediction)) {
    res.status(400).json({ error: "invalid_result" });
    return;
  }
  await processUnboxResult(sessionId, result);
  const session = await prisma.unboxSession.findUnique({
    where: { id: sessionId },
    include: { bets: true }
  });
  res.json(session);
});

router.post("/sessions/:id/refund", async (req, res) => {
  const sessionId = Number(req.params.id);
  if (!Number.isFinite(sessionId)) {
    res.status(400).json({ error: "invalid_session_id" });
    return;
  }
  const userAddress = typeof req.body?.userAddress === "string" ? req.body.userAddress : "";
  if (!userAddress) {
    res.status(400).json({ error: "invalid_user" });
    return;
  }
  const refund = await claimUnboxRefund(sessionId, userAddress);
  res.json(refund);
});

export default router;
