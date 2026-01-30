import { prisma } from "../database/client.js";
import { env } from "../config/env.js";
import { computeVWAP } from "./vwap.js";
import { withinDiff, withinSwing } from "./validator.js";
import { OracleRelayer } from "./relayer.js";
const pending = new Map();
const lastSent = new Map();
const resolvedMatches = new Set();
async function loadVwap(skinId, source) {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const history = await prisma.priceHistory.findMany({
        where: { skinId, source, timestamp: { gte: since } },
        orderBy: { timestamp: "desc" }
    });
    if (history.length === 0)
        return null;
    return computeVWAP(history.map((row) => ({
        price: Number(row.price),
        volume: row.volume ?? undefined
    })));
}
function shouldSubmitPrice(skinId, price) {
    const now = Date.now();
    const existing = pending.get(skinId);
    if (!existing) {
        pending.set(skinId, { price, since: now });
        return false;
    }
    const diff = Math.abs(price - existing.price) / existing.price;
    if (diff > env.oracleDiffPct) {
        pending.set(skinId, { price, since: now });
        return false;
    }
    if (now - existing.since < env.oracleChallengeMs) {
        return false;
    }
    const last = lastSent.get(skinId) ?? null;
    if (!withinSwing(last, price, env.oracleMaxSwingPct)) {
        pending.set(skinId, { price, since: now });
        return false;
    }
    pending.delete(skinId);
    lastSent.set(skinId, price);
    return true;
}
async function processPrices(relayer) {
    const skins = await prisma.skin.findMany();
    for (const skin of skins) {
        const [buffVwap, steamVwap] = await Promise.all([
            loadVwap(skin.id, "buff163"),
            loadVwap(skin.id, "steam")
        ]);
        if (!withinDiff(buffVwap, steamVwap, env.oracleDiffPct)) {
            continue;
        }
        const price = buffVwap && steamVwap ? (buffVwap + steamVwap) / 2 : null;
        if (!price)
            continue;
        if (!shouldSubmitPrice(skin.id, price)) {
            continue;
        }
        if (!relayer.isReady()) {
            console.warn("Relayer not configured, skip updatePrice");
            continue;
        }
        const signature = await relayer.signPrice(skin.id, price);
        await relayer.updatePrice(skin.id, price, signature);
    }
}
async function processMatches(relayer) {
    const matches = await prisma.match.findMany({
        where: { status: "FINISHED", winner: { not: null } }
    });
    for (const match of matches) {
        if (resolvedMatches.has(match.matchId)) {
            continue;
        }
        if (!relayer.isReady()) {
            console.warn("Relayer not configured, skip resolveMatch");
            break;
        }
        await relayer.resolveMatch(match.matchId, match.winner ?? "");
        resolvedMatches.add(match.matchId);
    }
}
async function runOnce(relayer) {
    await processPrices(relayer);
    await processMatches(relayer);
}
async function main() {
    const relayer = new OracleRelayer();
    await runOnce(relayer);
    setInterval(() => {
        runOnce(relayer).catch((error) => {
            console.error("Oracle run failed:", error);
        });
    }, env.oracleIntervalMs);
}
main().catch((error) => {
    console.error("Oracle boot failed:", error);
    process.exit(1);
});
