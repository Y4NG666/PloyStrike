import request from "supertest";
import { app } from "../backend/src/api/server.js";

describe("unbox APIs", () => {
  it("creates session, accepts bet, returns odds", async () => {
    const sessionRes = await request(app)
      .post("/api/unbox/sessions")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ hostAddress: "0xhost", durationSeconds: 120 }));
    expect(sessionRes.status).toBe(201);
    const sessionId = sessionRes.body.id;

    const betRes = await request(app)
      .post(`/api/unbox/sessions/${sessionId}/bets`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ userAddress: "0xuser", prediction: "BLUE", amount: 10 }));
    expect(betRes.status).toBe(201);

    const oddsRes = await request(app).get(`/api/unbox/sessions/${sessionId}/odds`);
    expect(oddsRes.status).toBe(200);
    expect(Array.isArray(oddsRes.body.odds)).toBe(true);
  });

  it("rejects invalid session id", async () => {
    const res = await request(app).get("/api/unbox/sessions/not-a-number");
    expect(res.status).toBe(400);
  });

  it("rejects invalid bet payload", async () => {
    const sessionRes = await request(app)
      .post("/api/unbox/sessions")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ hostAddress: "0xhost", durationSeconds: 120 }));
    const sessionId = sessionRes.body.id;

    const badRes = await request(app)
      .post(`/api/unbox/sessions/${sessionId}/bets`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ userAddress: "", prediction: "BLUE", amount: 10 }));
    expect(badRes.status).toBe(400);
  });

  it("resolves session with winners", async () => {
    const sessionRes = await request(app)
      .post("/api/unbox/sessions")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ hostAddress: "0xhost", durationSeconds: 120 }));
    const sessionId = sessionRes.body.id;

    await request(app)
      .post(`/api/unbox/sessions/${sessionId}/bets`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ userAddress: "0xuser", prediction: "BLUE", amount: 10 }));

    const resolveRes = await request(app)
      .post(`/api/unbox/sessions/${sessionId}/resolve`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ result: "BLUE" }));
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.status).toBe("RESOLVED");
  });

  it("marks refundable and processes refund", async () => {
    const sessionRes = await request(app)
      .post("/api/unbox/sessions")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ hostAddress: "0xhost", durationSeconds: 120 }));
    const sessionId = sessionRes.body.id;

    await request(app)
      .post(`/api/unbox/sessions/${sessionId}/bets`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ userAddress: "0xuser", prediction: "BLUE", amount: 12 }));

    await request(app)
      .post(`/api/unbox/sessions/${sessionId}/resolve`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ result: "GOLD" }));

    const refundRes = await request(app)
      .post(`/api/unbox/sessions/${sessionId}/refund`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ userAddress: "0xuser" }));
    expect(refundRes.status).toBe(200);
    expect(refundRes.body.refunded).toBe(12);
  });
});
