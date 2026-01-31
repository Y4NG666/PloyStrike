import { Router } from "express";
import { prisma } from "../../database/client.js";
import { redis } from "../../database/redis.js";
import { buildOhlc } from "../utils/ohlc.js";
const router = Router();
router.get("/", async (_req, res) => {
    const skins = await prisma.skin.findMany();
    const payload = await Promise.all(skins.map(async (skin) => {
        const latestBuff = await prisma.priceHistory.findFirst({
            where: { skinId: skin.id, source: "buff163" },
            orderBy: { timestamp: "desc" }
        });
        const latestSteam = await prisma.priceHistory.findFirst({
            where: { skinId: skin.id, source: "steam" },
            orderBy: { timestamp: "desc" }
        });
        return {
            ...skin,
            latest: {
                buff163: latestBuff ? Number(latestBuff.price) : null,
                steam: latestSteam ? Number(latestSteam.price) : null
            }
        };
    }));
    res.json(payload);
});
router.get("/:id/history", async (req, res) => {
    const skinId = req.params.id;
    const source = String(req.query.source ?? "buff163");
    const intervalMinutes = Number(req.query.intervalMinutes ?? "60");
    const to = req.query.to ? new Date(String(req.query.to)) : new Date();
    const from = req.query.from
        ? new Date(String(req.query.from))
        : new Date(to.getTime() - 24 * 60 * 60 * 1000);
    if (Number.isNaN(intervalMinutes) || intervalMinutes <= 0) {
        res.status(400).json({ error: "invalid intervalMinutes" });
        return;
    }
    const cacheKey = `history:${skinId}:${source}:${from.toISOString()}:${to.toISOString()}:${intervalMinutes}`;
    if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
            res.json(JSON.parse(cached));
            return;
        }
    }
    const history = await prisma.priceHistory.findMany({
        where: { skinId, source, timestamp: { gte: from, lte: to } },
        orderBy: { timestamp: "asc" }
    });
    const intervalMs = intervalMinutes * 60 * 1000;
    const ohlc = buildOhlc(history.map((row) => ({
        price: Number(row.price),
        volume: row.volume ?? null,
        timestamp: row.timestamp
    })), intervalMs);
    const response = {
        skinId,
        source,
        from: from.toISOString(),
        to: to.toISOString(),
        intervalMinutes,
        points: ohlc
    };
    if (redis) {
        await redis.set(cacheKey, JSON.stringify(response), "EX", 60);
    }
    res.json(response);
});
export default router;
