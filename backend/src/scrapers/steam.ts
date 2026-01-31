import { Skin } from "@prisma/client";
import { fetchJson } from "../utils/http.js";
import type { PriceSample } from "./buff163.js";

type SteamPriceOverview = {
  lowest_price?: string;
  median_price?: string;
  volume?: string;
};

function parseSteamPrice(value?: string): number | null {
  if (!value) return null;
  const normalized = value.replace(/[^0-9.]/g, "");
  const price = Number(normalized);
  return Number.isNaN(price) || price <= 0 ? null : price;
}

function parseSteamVolume(value?: string): number | null {
  if (!value) return null;
  const normalized = value.replace(/[^0-9]/g, "");
  const volume = Number(normalized);
  return Number.isNaN(volume) ? null : volume;
}

export async function fetchSteamPrice(skin: Skin): Promise<PriceSample | null> {
  if (!skin.marketHashName) {
    return null;
  }
  const params = new URLSearchParams({
    appid: "730",
    currency: "1",
    market_hash_name: skin.marketHashName
  });
  const url = `https://steamcommunity.com/market/priceoverview/?${params.toString()}`;
  const payload = await fetchJson<SteamPriceOverview>(url, {
    headers: {
      referer: "https://steamcommunity.com/market/"
    }
  });
  const price =
    parseSteamPrice(payload.lowest_price) ?? parseSteamPrice(payload.median_price);
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
