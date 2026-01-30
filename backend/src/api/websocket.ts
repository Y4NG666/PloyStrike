import { WebSocketServer } from "ws";
import type { Server } from "node:http";
import { prisma } from "../database/client.js";
import { env } from "../config/env.js";
import { loadActiveUnboxSnapshot } from "../processors/unboxProcessor.js";

async function getLatestPrices() {
  const skins = await prisma.skin.findMany();
  const payload = await Promise.all(
    skins.map(async (skin) => {
      const latest = await prisma.priceHistory.findFirst({
        where: { skinId: skin.id, source: "buff163" },
        orderBy: { timestamp: "desc" }
      });
      return {
        skinId: skin.id,
        price: latest ? Number(latest.price) : null,
        timestamp: latest?.timestamp ?? null
      };
    })
  );
  return payload;
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    ws.send(JSON.stringify({ type: "welcome", message: "connected" }));
  });

  const interval = setInterval(async () => {
    const prices = await getLatestPrices();
    const payload = JSON.stringify({ type: "prices", data: prices });
    const unboxSnapshot = await loadActiveUnboxSnapshot();
    const unboxPayload = unboxSnapshot
      ? JSON.stringify({ type: "unbox", data: unboxSnapshot })
      : null;
    const now = Date.now();
    const createdRecently =
      unboxSnapshot && now - new Date(unboxSnapshot.createdAt).getTime() <= env.wsIntervalMs * 1.5;
    const sessionCreatedPayload = createdRecently
      ? JSON.stringify({
          type: "session:created",
          data: {
            sessionId: unboxSnapshot?.sessionId,
            status: unboxSnapshot?.status,
            startTime: unboxSnapshot?.startTime,
            endTime: unboxSnapshot?.endTime
          }
        })
      : null;
    const sessionBettingPayload =
      unboxSnapshot?.status === "BETTING"
        ? JSON.stringify({
            type: "session:betting",
            data: {
              sessionId: unboxSnapshot.sessionId,
              endTime: unboxSnapshot.endTime
            }
          })
        : null;
    const sessionResolvedPayload =
      unboxSnapshot && ["RESOLVED", "REFUNDABLE"].includes(unboxSnapshot.status)
        ? JSON.stringify({
            type: "session:resolved",
            data: {
              sessionId: unboxSnapshot.sessionId,
              status: unboxSnapshot.status,
              result: unboxSnapshot.result
            }
          })
        : null;
    const oddsPayload = unboxSnapshot
      ? JSON.stringify({
          type: "odds:update",
          data: {
            sessionId: unboxSnapshot.sessionId,
            odds: unboxSnapshot.odds
          }
        })
      : null;
    const jackpotPayload = unboxSnapshot
      ? JSON.stringify({
          type: "jackpot:update",
          data: {
            sessionId: unboxSnapshot.sessionId,
            totalPool: unboxSnapshot.totalPool
          }
        })
      : null;
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
        if (unboxPayload) {
          client.send(unboxPayload);
        }
        if (sessionCreatedPayload) {
          client.send(sessionCreatedPayload);
        }
        if (sessionBettingPayload) {
          client.send(sessionBettingPayload);
        }
        if (sessionResolvedPayload) {
          client.send(sessionResolvedPayload);
        }
        if (oddsPayload) {
          client.send(oddsPayload);
        }
        if (jackpotPayload) {
          client.send(jackpotPayload);
        }
      }
    }
  }, env.wsIntervalMs);

  wss.on("close", () => {
    clearInterval(interval);
  });

  return wss;
}
