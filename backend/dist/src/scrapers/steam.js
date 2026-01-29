import { fetchJson } from "../utils/http.js";
function parseSteamPrice(value) {
    if (!value)
        return null;
    const normalized = value.replace(/[^0-9.]/g, "");
    const price = Number(normalized);
    return Number.isNaN(price) || price <= 0 ? null : price;
}
function parseSteamVolume(value) {
    if (!value)
        return null;
    const normalized = value.replace(/[^0-9]/g, "");
    const volume = Number(normalized);
    return Number.isNaN(volume) ? null : volume;
}
export async function fetchSteamPrice(skin) {
    if (!skin.marketHashName) {
        return null;
    }
    const params = new URLSearchParams({
        appid: "730",
        currency: "1",
        market_hash_name: skin.marketHashName
    });
    const url = `https://steamcommunity.com/market/priceoverview/?${params.toString()}`;
    const payload = await fetchJson(url, {
        headers: {
            referer: "https://steamcommunity.com/market/"
        }
    });
    const price = parseSteamPrice(payload.lowest_price) ?? parseSteamPrice(payload.median_price);
    if (!price) {
        return null;
    }
    return {
        skinId: skin.id,
        price,
        volume: parseSteamVolume(payload.volume),
        source: "steam",
        timestamp: new Date()
    };
}
