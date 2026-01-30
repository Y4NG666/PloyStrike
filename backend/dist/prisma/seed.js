import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import path from "node:path";
const prisma = new PrismaClient();
async function loadJson(fileName) {
    const filePath = path.join(process.cwd(), "prisma", "seed", fileName);
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
}
async function main() {
    const skins = await loadJson("skins.json");
    const matches = await loadJson("matches.json");
    if (skins.length > 0) {
        await prisma.skin.createMany({
            data: skins.map((skin) => ({
                id: skin.id,
                marketHashName: skin.marketHashName,
                buffGoodsId: skin.buffGoodsId ?? null,
                iconUrl: skin.iconUrl ?? null
            })),
            skipDuplicates: true
        });
    }
    if (matches.length > 0) {
        await prisma.match.createMany({
            data: matches.map((match) => ({
                matchId: match.matchId,
                teamA: match.teamA,
                teamB: match.teamB,
                startTime: match.startTime ? new Date(match.startTime) : null,
                status: match.status,
                winner: null,
                score: null
            })),
            skipDuplicates: true
        });
    }
}
main()
    .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
