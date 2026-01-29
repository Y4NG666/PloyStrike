import { fetchJson } from "../utils/http.js";
export async function fetchBuffPrice(skin) {
    if (!skin.buffGoodsId) {
        return null;
    }
    const url = `https://buff.163.com/api/market/goods?goods_id=${skin.buffGoodsId}`;
    const payload = await fetchJson(url, {
        headers: {
            "accept-language": "en-US,en;q=0.9",
            referer: "https://buff.163.com/market/csgo"
        }
    });
    const priceRaw = payload.data?.goods_info?.sell_min_price;
    if (!priceRaw) {
        return null;
    }
    const price = Number(priceRaw);
    if (Number.isNaN(price) || price <= 0) {
        return null;
    }
    return {
        skinId: skin.id,
        price,
        volume: payload.data?.goods_info?.sell_num ?? null,
        source: "buff163",
        timestamp: new Date()
    };
}
