import { Router } from "express";
import { prisma } from "../../database/client.js";
import { env } from "../../config/env.js";
const router = Router();
router.get("/status", async (_req, res) => {
    const latest = await prisma.priceHistory.findFirst({
        orderBy: { timestamp: "desc" }
    });
    res.json({
        lastPriceUpdate: latest?.timestamp ?? null,
        relayerConfigured: Boolean(env.oraclePrivateKey && env.oracleRpcUrl),
        adapterConfigured: Boolean(env.oracleAdapterAddress)
    });
});
export default router;
