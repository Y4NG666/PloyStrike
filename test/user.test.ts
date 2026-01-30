import request from "supertest";
import { Prisma } from "@prisma/client";
import { app } from "../backend/src/api/server.js";
import { prisma } from "../backend/src/database/client.js";

describe("user APIs", () => {
  it("returns stats and history for unbox bets", async () => {
    const sessionRes = await request(app)
      .post("/api/unbox/sessions")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ hostAddress: "0xhost", durationSeconds: 120 }));
    const sessionId = sessionRes.body.id;

    await request(app)
      .post(`/api/unbox/sessions/${sessionId}/bets`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ userAddress: "0xstat", prediction: "BLUE", amount: 7 }));

    const statsRes = await request(app).get("/api/user/stats?address=0xstat");
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.totalBets).toBe(1);

    const historyRes = await request(app).get("/api/user/history?address=0xstat&module=unbox");
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.total).toBe(1);
  });

  it("returns balance and transactions", async () => {
    await prisma.userTransaction.createMany({
      data: [
        {
          address: "0xwallet",
          module: "unbox",
          type: "BET",
          amount: new Prisma.Decimal(-10)
        },
        {
          address: "0xwallet",
          module: "unbox",
          type: "PAYOUT",
          amount: new Prisma.Decimal(15)
        }
      ]
    });

    const balanceRes = await request(app).get("/api/user/balance?address=0xwallet");
    expect(balanceRes.status).toBe(200);
    expect(balanceRes.body.balance).toBe(5);

    const txRes = await request(app).get(
      "/api/user/transactions?address=0xwallet&module=all&page=1&limit=10"
    );
    expect(txRes.status).toBe(200);
    expect(txRes.body.total).toBe(2);
  });

  it("rejects invalid module param", async () => {
    const res = await request(app).get("/api/user/transactions?address=0xwallet&module=bad");
    expect(res.status).toBe(400);
  });
});
