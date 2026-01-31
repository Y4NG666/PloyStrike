import { Prisma } from "@prisma/client";
import { prisma } from "../database/client.js";
import type { PriceSample } from "../scrapers/buff163.js";

const OUTLIER_THRESHOLD = 0.5;

function isOutlier(latest: Prisma.PriceHistoryGetPayload<{}> | null, next: PriceSample): boolean {
  if (!latest) return false;
  const diff = Math.abs(next.price - Number(latest.price));
  const ratio = diff / Number(latest.price);
  return ratio > OUTLIER_THRESHOLD;
}

export async function processPriceSamples(samples: PriceSample[]): Promise<void> {
  for (const sample of samples) {
    const latest = await prisma.priceHistory.findFirst({
      where: { skinId: sample.skinId, source: sample.source },
      orderBy: { timestamp: "desc" }
    });
    if (isOutlier(latest, sample)) {
      continue;
    }
    await prisma.priceHistory.create({
      data: {
        skinId: sample.skinId,
        price: sample.price,
        volume: sample.volume ?? null,
        source: sample.source,
        timestamp: sample.timestamp
      }
    });
  }
}
