import { Router } from "express";
import { prisma } from "../../database/client.js";
const router = Router();
router.get("/live", async (_req, res) => {
    const skins = await prisma.skin.findMany();
    const matches = await prisma.match.findMany({
        where: { status: { not: "FINISHED" } },
        orderBy: { startTime: "asc" }
    });
    const skinSnapshots = await Promise.all(skins.map(async (skin) => {
        const latest = await prisma.priceHistory.findFirst({
            where: { skinId: skin.id, source: "buff163" },
            orderBy: { timestamp: "desc" }
        });
        return {
            id: skin.id,
            marketHashName: skin.marketHashName,
            latestPrice: latest ? Number(latest.price) : null
        };
    }));
    res.json({
        skins: skinSnapshots,
        matches
    });
});
export default router;
