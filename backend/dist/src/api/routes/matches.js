import { Router } from "express";
import { prisma } from "../../database/client.js";
const router = Router();
router.get("/", async (_req, res) => {
    const matches = await prisma.match.findMany({
        orderBy: { startTime: "asc" }
    });
    res.json(matches);
});
export default router;
