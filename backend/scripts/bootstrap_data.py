#!/usr/bin/env python3
import argparse
import gzip
import json
import os
import re
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import urlencode, urlparse, urlunparse, parse_qsl
from urllib.request import Request, urlopen


def load_env_file(env_path: Path) -> None:
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def fetch_json(url: str, headers: Optional[Dict[str, str]] = None, timeout: int = 15):
    request = Request(url, headers=headers or {}, method="GET")
    with urlopen(request, timeout=timeout) as resp:
        raw = resp.read()
        if resp.headers.get("Content-Encoding") == "gzip":
            raw = gzip.decompress(raw)
        return json.loads(raw.decode("utf-8"))


def connect_db():
    try:
        import psycopg2  # type: ignore
    except Exception as exc:  # pragma: no cover
        raise RuntimeError(
            "psycopg2 is required. Install with: pip install psycopg2-binary"
        ) from exc
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set")
    parsed = urlparse(url)
    if parsed.query:
        filtered = [(k, v) for k, v in parse_qsl(parsed.query) if k != "schema"]
        parsed = parsed._replace(query=urlencode(filtered))
        url = urlunparse(parsed)
    conn = psycopg2.connect(url)
    conn.autocommit = True
    return conn


def normalize_skin_id(market_hash_name: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", market_hash_name).strip("-")
    cleaned = re.sub(r"-{2,}", "-", cleaned)
    return cleaned[:64] if cleaned else market_hash_name[:64]


def insert_skins(conn, skins: List[Dict]) -> int:
    inserted = 0
    with conn.cursor() as cur:
        for skin in skins:
            cur.execute(
                """
                INSERT INTO "Skin" ("id", "marketHashName", "buffGoodsId", "iconUrl")
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
                """,
                (
                    skin["id"],
                    skin["marketHashName"],
                    skin.get("buffGoodsId"),
                    skin.get("iconUrl"),
                ),
            )
            if cur.rowcount > 0:
                inserted += 1
    return inserted


def fetch_steam_skins(count: int) -> List[Dict]:
    skins: List[Dict] = []
    page_size = min(count, 100)
    start = 0
    while len(skins) < count:
        params = urlencode(
            {
                "query": "",
                "start": str(start),
                "count": str(page_size),
                "appid": "730",
                "norender": "1",
                "search_descriptions": "0",
            }
        )
        url = f"https://steamcommunity.com/market/search/render/?{params}"
        payload = fetch_json(
            url,
            headers={
                "user-agent": "Mozilla/5.0 PolyStrikeBot/1.0",
                "accept-language": "en-US,en;q=0.9",
            },
        )
        results = payload.get("results") or []
        if not results:
            break
        if not results:
            break
        for item in results:
            name = item.get("hash_name") or ""
            if not name:
                continue
            skin_id = normalize_skin_id(name)
            icon_url = None
            asset = item.get("asset_description") or {}
            if asset.get("icon_url"):
                icon_url = f"https://steamcommunity.com/economy/image/{asset['icon_url']}"
            skins.append(
                {
                    "id": skin_id,
                    "marketHashName": name,
                    "buffGoodsId": None,
                    "iconUrl": icon_url,
                }
            )
            if len(skins) >= count:
                break
        start += page_size
    if skins:
        return skins

    # Fallback: parse HTML search results for hash names
    html_url = "https://steamcommunity.com/market/search?appid=730"
    try:
        request = Request(
            html_url,
            headers={
                "user-agent": "Mozilla/5.0 PolyStrikeBot/1.0",
                "accept-language": "en-US,en;q=0.9",
            },
            method="GET",
        )
        with urlopen(request, timeout=15) as resp:
            html = resp.read().decode("utf-8")
        for match in re.findall(r'data-hash-name="([^"]+)"', html):
            skin_id = normalize_skin_id(match)
            skins.append(
                {
                    "id": skin_id,
                    "marketHashName": match,
                    "buffGoodsId": None,
                    "iconUrl": None,
                }
            )
            if len(skins) >= count:
                break
    except Exception:
        pass
    return skins


def main():
    parser = argparse.ArgumentParser(description="Bootstrap skins into DB")
    parser.add_argument("--skins", type=int, default=20)
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    load_env_file(root / ".env")
    conn = connect_db()

    if args.skins > 0:
        skins = fetch_steam_skins(args.skins)
        inserted = insert_skins(conn, skins)
        print(f"Inserted skins: {inserted}/{len(skins)}")


if __name__ == "__main__":
    main()
