#!/usr/bin/env python3
import argparse
import csv
import json
import os
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import urlencode
from urllib.request import Request, urlopen


@dataclass
class SkinItem:
    id: str
    market_hash_name: str
    buff_goods_id: Optional[int]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def bucketed_iso(interval_seconds: int) -> str:
    if interval_seconds <= 0:
        return now_iso()
    ts = int(time.time())
    bucket = ts - (ts % interval_seconds)
    return datetime.fromtimestamp(bucket, tz=timezone.utc).isoformat()


def fetch_json(url: str, headers: Optional[Dict[str, str]] = None, timeout: int = 15):
    request = Request(url, headers=headers or {}, method="GET")
    with urlopen(request, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def parse_price(text: Optional[str]) -> Optional[float]:
    if not text:
        return None
    cleaned = "".join(ch for ch in text if (ch.isdigit() or ch == "."))
    if not cleaned:
        return None
    try:
        value = float(cleaned)
        return value if value > 0 else None
    except ValueError:
        return None


def parse_volume(text: Optional[str]) -> Optional[int]:
    if not text:
        return None
    cleaned = "".join(ch for ch in text if ch.isdigit())
    if not cleaned:
        return None
    try:
        return int(cleaned)
    except ValueError:
        return None


def fetch_buff_price(skin: SkinItem) -> Optional[Dict]:
    if not skin.buff_goods_id:
        return None
    url = f"https://buff.163.com/api/market/goods?goods_id={skin.buff_goods_id}"
    payload = fetch_json(
        url,
        headers={
            "user-agent": "Mozilla/5.0 PolyStrikeBot/1.0",
            "accept-language": "en-US,en;q=0.9",
            "referer": "https://buff.163.com/market/csgo",
        },
    )
    goods = (payload.get("data") or {}).get("goods_info") or {}
    price = parse_price(goods.get("sell_min_price"))
    if not price:
        return None
    return {
        "skinId": skin.id,
        "source": "buff163",
        "price": price,
        "volume": goods.get("sell_num"),
        "timestamp": now_iso(),
    }


def fetch_steam_price(skin: SkinItem) -> Optional[Dict]:
    if not skin.market_hash_name:
        return None
    params = urlencode(
        {
            "appid": "730",
            "currency": "1",
            "market_hash_name": skin.market_hash_name,
        }
    )
    url = f"https://steamcommunity.com/market/priceoverview/?{params}"
    payload = fetch_json(
        url,
        headers={"user-agent": "Mozilla/5.0 PolyStrikeBot/1.0"},
    )
    price = parse_price(payload.get("lowest_price")) or parse_price(
        payload.get("median_price")
    )
    if not price:
        return None
    return {
        "skinId": skin.id,
        "source": "steam",
        "price": price,
        "volume": parse_volume(payload.get("volume")),
        "timestamp": now_iso(),
    }


def load_skins_from_seed(seed_path: Path) -> List[SkinItem]:
    raw = json.loads(seed_path.read_text(encoding="utf-8"))
    skins: List[SkinItem] = []
    for item in raw:
        skins.append(
            SkinItem(
                id=item.get("id", ""),
                market_hash_name=item.get("marketHashName", ""),
                buff_goods_id=item.get("buffGoodsId"),
            )
        )
    return skins


def load_env_file(env_path: Path) -> None:
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def load_skins_from_api(api_base: str) -> List[SkinItem]:
    payload = fetch_json(f"{api_base.rstrip('/')}/api/skins")
    skins: List[SkinItem] = []
    for item in payload:
        skins.append(
            SkinItem(
                id=item.get("id", ""),
                market_hash_name=item.get("marketHashName", ""),
                buff_goods_id=item.get("buffGoodsId"),
            )
        )
    return skins


def write_csv_row(path: Path, row: Dict):
    is_new = not path.exists()
    with path.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f, fieldnames=["timestamp", "skinId", "source", "price", "volume"]
        )
        if is_new:
            writer.writeheader()
        writer.writerow(row)


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
    # psycopg2 does not accept Prisma's "schema" query parameter.
    if "schema=" in url:
        from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

        parsed = urlparse(url)
        query = [(k, v) for k, v in parse_qsl(parsed.query) if k != "schema"]
        url = urlunparse(parsed._replace(query=urlencode(query)))
    conn = psycopg2.connect(url)
    conn.autocommit = True
    return conn


def insert_price_sample(conn, row: Dict) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "PriceHistory" ("skinId", "price", "volume", "source", "timestamp")
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                row["skinId"],
                row["price"],
                row.get("volume"),
                row["source"],
                row["timestamp"],
            ),
        )


def monitor_prices(
    skins: List[SkinItem],
    interval: int,
    threshold: float,
    out_csv: Path,
    request_gap: float,
    write_db: bool,
):
    last_seen: Dict[str, float] = {}
    conn = connect_db() if write_db else None
    while True:
        for skin in skins:
            for fetcher in (fetch_buff_price, fetch_steam_price):
                try:
                    sample = fetcher(skin)
                except Exception as exc:
                    print(f"[warn] {skin.id} fetch failed: {exc}")
                    sample = None
                if not sample:
                    continue
                sample["timestamp"] = bucketed_iso(interval)
                key = f"{sample['skinId']}:{sample['source']}"
                prev = last_seen.get(key)
                last_seen[key] = sample["price"]
                if conn:
                    insert_price_sample(conn, sample)
                write_csv_row(out_csv, sample)
                if prev:
                    diff = sample["price"] - prev
                    pct = (diff / prev) * 100
                    if abs(pct) >= threshold:
                        print(
                            f"[change] {key} {prev:.2f} -> {sample['price']:.2f} ({pct:+.2f}%)"
                        )
                time.sleep(request_gap)
        time.sleep(interval)


def main():
    parser = argparse.ArgumentParser(description="Price monitor for Buff/Steam")
    parser.add_argument("--source", choices=["seed", "api"], default="seed")
    parser.add_argument("--api-base", default="http://127.0.0.1:3001")
    parser.add_argument("--interval", type=int, default=1800)
    parser.add_argument("--threshold", type=float, default=0.5)
    parser.add_argument("--out-csv", default="price_samples.csv")
    parser.add_argument("--request-gap", type=float, default=0.4)
    parser.add_argument("--write-db", action="store_true")
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    seed_path = root / "prisma" / "seed" / "skins.json"
    out_csv = root / args.out_csv
    load_env_file(root / ".env")

    if args.source == "api":
        skins = load_skins_from_api(args.api_base)
    else:
        skins = load_skins_from_seed(seed_path)

    if not skins:
        print("No skins found to monitor.")
        sys.exit(1)

    print(
        f"Monitoring {len(skins)} skins every {args.interval}s, threshold={args.threshold}%"
    )
    monitor_prices(
        skins, args.interval, args.threshold, out_csv, args.request_gap, args.write_db
    )


if __name__ == "__main__":
    main()
