import { WebSocketServer } from "ws";
import { prisma } from "../database/client.js";
import { env } from "../config/env.js";
async function getLatestPrices() {
    const skins = await prisma.skin.findMany();
    const payload = await Promise.all(skins.map(async (skin) => {
        const latest = await prisma.priceHistory.findFirst({
            where: { skinId: skin.id, source: "buff163" },
            orderBy: { timestamp: "desc" }
        });
        return {
            skinId: skin.id,
            price: latest ? Number(latest.price) : null,
            timestamp: latest?.timestamp ?? null
        };
    }));
    return payload;
}
export function setupWebSocket(server) {
    const wss = new WebSocketServer({ server, path: "/ws" });
    wss.on("connection", (ws) => {
        ws.send(JSON.stringify({ type: "welcome", message: "connected" }));
    });
    const interval = setInterval(async () => {
        const prices = await getLatestPrices();
        const payload = JSON.stringify({ type: "prices", data: prices });
        for (const client of wss.clients) {
            if (client.readyState === client.OPEN) {
                client.send(payload);
            }
        }
    }, env.wsIntervalMs);
    wss.on("close", () => {
        clearInterval(interval);
    });
    return wss;
}
