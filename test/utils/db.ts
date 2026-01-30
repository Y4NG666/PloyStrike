import { Prisma } from "@prisma/client";
import { prisma } from "../../backend/src/database/client.js";

export async function cleanDatabase() {
  await prisma.userTransaction.deleteMany();
  await prisma.unboxBet.deleteMany();
  await prisma.unboxSession.deleteMany();
  await prisma.userStats.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.skin.deleteMany();
}

export async function seedPriceData() {
  await prisma.skin.create({
    data: {
      id: "skin_ak",
      marketHashName: "AK-47 Redline",
      iconUrl: "https://example.com/ak.png"
    }
  });
  await prisma.priceHistory.createMany({
    data: [
      {
        skinId: "skin_ak",
        price: new Prisma.Decimal(12.34),
        volume: 10,
        source: "buff163",
        timestamp: new Date(Date.now() - 60 * 60 * 1000)
      },
      {
        skinId: "skin_ak",
        price: new Prisma.Decimal(12.8),
        volume: 8,
        source: "steam",
        timestamp: new Date(Date.now() - 30 * 60 * 1000)
      }
    ]
  });
}
