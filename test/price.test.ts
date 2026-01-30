import request from "supertest";
import { app } from "../backend/src/api/server.js";

describe("price APIs", () => {
  it("lists skins with latest prices", async () => {
    const res = await request(app).get("/api/skins");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("latest");
  });

  it("returns price history ohlc points", async () => {
    const res = await request(app).get("/api/skins/skin_ak/history");
    expect(res.status).toBe(200);
    expect(res.body.skinId).toBe("skin_ak");
    expect(Array.isArray(res.body.points)).toBe(true);
  });

  it("rejects invalid history interval", async () => {
    const res = await request(app).get("/api/skins/skin_ak/history?intervalMinutes=0");
    expect(res.status).toBe(400);
  });

  it("returns live market snapshot", async () => {
    const res = await request(app).get("/api/markets/live");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("skins");
    expect(Array.isArray(res.body.skins)).toBe(true);
  });

  it("returns oracle status", async () => {
    const res = await request(app).get("/api/oracle/status");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("lastPriceUpdate");
  });
});
