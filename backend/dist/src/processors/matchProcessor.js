import { prisma } from "../database/client.js";
export async function processMatchSamples(samples) {
    for (const sample of samples) {
        await prisma.match.update({
            where: { matchId: sample.matchId },
            data: {
                teamA: sample.teamA || undefined,
                teamB: sample.teamB || undefined,
                status: sample.status,
                winner: sample.winner ?? null,
                score: sample.score ?? null,
                startTime: sample.startTime ?? undefined
            }
        });
    }
}
