import { Prisma } from "@prisma/client";
import { prisma } from "../database/client.js";

export const UNBOX_PREDICTIONS = ["BLUE", "GOLD", "KNIFE"] as const;
export type Prediction = (typeof UNBOX_PREDICTIONS)[number];

type OddsEntry = {
  prediction: string;
  totalBet: number;
  percentage: number;
  payout: number | null;
};

export type UnboxSnapshot = {
  sessionId: number;
  status: string;
  totalPool: number;
  createdAt: Date;
  startTime: Date | null;
  endTime: Date | null;
  odds: OddsEntry[];
  result: string | null;
};

function buildOdds(bets: { prediction: string; amount: number }[]): OddsEntry[] {
  const totals = new Map<string, number>();
  let pool = 0;
  for (const bet of bets) {
    const amount = Number(bet.amount) || 0;
    pool += amount;
    totals.set(bet.prediction, (totals.get(bet.prediction) ?? 0) + amount);
  }
  return UNBOX_PREDICTIONS.map((prediction) => {
    const totalBet = totals.get(prediction) ?? 0;
    const payout = totalBet > 0 ? pool / totalBet : null;
    return {
      prediction,
      totalBet,
      percentage: pool > 0 ? Number(((totalBet / pool) * 100).toFixed(2)) : 0,
      payout: payout ? Number(payout.toFixed(2)) : null
    };
  });
}

export async function processUnboxResult(sessionId: number, result: string): Promise<void> {
  const session = await prisma.unboxSession.findUnique({
    where: { id: sessionId },
    include: { bets: true }
  });
  if (!session) {
    return;
  }
  const normalized = result.toUpperCase();
  const totalPool = session.bets.reduce((sum, bet) => sum + Number(bet.amount || 0), 0);
  const winners = session.bets.filter((bet) => bet.prediction === normalized);
  if (winners.length === 0) {
    await prisma.unboxSession.update({
      where: { id: sessionId },
      data: {
        status: "REFUNDABLE",
        result: normalized,
        totalPool
      }
    });
    return;
  }
  const winnerPool = winners.reduce((sum, bet) => sum + Number(bet.amount || 0), 0);
  const updates = [];
  updates.push(
    prisma.unboxSession.update({
      where: { id: sessionId },
      data: {
        status: "RESOLVED",
        result: normalized,
        totalPool
      }
    })
  );

  for (const bet of session.bets) {
    const amount = Number(bet.amount || 0);
    const payout =
      bet.prediction === normalized && winnerPool > 0
        ? (totalPool * amount) / winnerPool
        : 0;
    if (payout > 0) {
      updates.push(
        prisma.userTransaction.create({
          data: {
            address: bet.userAddress,
            module: "unbox",
            type: "PAYOUT",
            amount: new Prisma.Decimal(payout),
            sessionId
          }
        })
      );
    }
    updates.push(
      prisma.unboxBet.update({
        where: { id: bet.id },
        data: { payout }
      })
    );

    const profit = payout - amount;
    updates.push(
      prisma.userStats.update({
        where: { address: bet.userAddress },
        data: {
          totalWins: bet.prediction === normalized ? { increment: 1 } : undefined,
          totalProfit: { increment: profit }
        }
      })
    );
  }

  await prisma.$transaction(updates);
}

export async function claimUnboxRefund(
  sessionId: number,
  userAddress: string
): Promise<{ sessionId: number; userAddress: string; refunded: number }> {
  const session = await prisma.unboxSession.findUnique({
    where: { id: sessionId }
  });
  if (!session || session.status !== "REFUNDABLE") {
    return { sessionId, userAddress, refunded: 0 };
  }
  const bets = await prisma.unboxBet.findMany({
    where: { sessionId, userAddress }
  });
  const refundable = bets.filter((bet) => bet.payout === null);
  const refunded = refundable.reduce((sum, bet) => sum + Number(bet.amount || 0), 0);
  if (refundable.length === 0) {
    return { sessionId, userAddress, refunded: 0 };
  }
  const updates: Prisma.PrismaPromise<unknown>[] = refundable.map((bet) =>
    prisma.unboxBet.update({
      where: { id: bet.id },
      data: { payout: bet.amount }
    })
  );
  updates.push(
    prisma.userTransaction.create({
      data: {
        address: userAddress,
        module: "unbox",
        type: "REFUND",
        amount: new Prisma.Decimal(refunded),
        sessionId
      }
    })
  );
  await prisma.$transaction(updates);
  return { sessionId, userAddress, refunded };
}

export async function loadActiveUnboxSnapshot(): Promise<UnboxSnapshot | null> {
  const session = await prisma.unboxSession.findFirst({
    where: { status: { in: ["BETTING", "OPENING", "RESOLVED", "REFUNDABLE"] } },
    orderBy: { createdAt: "desc" },
    include: { bets: true }
  });
  if (!session) {
    return null;
  }
  const totalPool = session.bets.reduce((sum, bet) => sum + Number(bet.amount || 0), 0);
  return {
    sessionId: session.id,
    status: session.status,
    totalPool,
    createdAt: session.createdAt,
    startTime: session.startTime ?? null,
    endTime: session.endTime ?? null,
    odds: buildOdds(
      session.bets.map((bet) => ({
        prediction: bet.prediction,
        amount: Number(bet.amount || 0)
      }))
    ),
    result: session.result ?? null
  };
}
