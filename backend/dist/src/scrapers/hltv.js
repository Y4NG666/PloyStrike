import { fetchJson } from "../utils/http.js";
export async function fetchHltvMatch(matchId) {
    const url = `https://hltv-api.vercel.app/api/match/${matchId}`;
    const payload = await fetchJson(url);
    if (!payload?.id) {
        return null;
    }
    return {
        matchId,
        teamA: payload.team1?.name ?? "",
        teamB: payload.team2?.name ?? "",
        status: payload.status?.toUpperCase() ?? "UNKNOWN",
        winner: payload.winnerTeam?.name ?? null,
        score: payload.result ?? null,
        startTime: payload.date ? new Date(payload.date) : null
    };
}
