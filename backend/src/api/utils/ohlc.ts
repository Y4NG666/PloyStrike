export type OhlcPoint = {
  start: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
};

type RawPoint = {
  price: number;
  volume?: number | null;
  timestamp: Date;
};

export function buildOhlc(points: RawPoint[], intervalMs: number): OhlcPoint[] {
  const buckets = new Map<number, OhlcPoint>();
  const sorted = points
    .filter((point) => Number.isFinite(point.price))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  for (const point of sorted) {
    const ts = point.timestamp.getTime();
    const bucketStart = Math.floor(ts / intervalMs) * intervalMs;
    const existing = buckets.get(bucketStart);
    if (!existing) {
      buckets.set(bucketStart, {
        start: new Date(bucketStart).toISOString(),
        open: point.price,
        high: point.price,
        low: point.price,
        close: point.price,
        volume: point.volume ?? null
      });
    } else {
      existing.high = Math.max(existing.high, point.price);
      existing.low = Math.min(existing.low, point.price);
      existing.close = point.price;
      if (existing.volume !== null) {
        existing.volume += point.volume ?? 0;
      }
    }
  }

  return Array.from(buckets.values()).sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
}
