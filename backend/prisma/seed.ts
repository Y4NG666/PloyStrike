import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import path from "node:path";

type SeedSkin = {
  id: string;
  marketHashName: string;
  buffGoodsId?: number;
  iconUrl?: string;
};

const prisma = new PrismaClient();

async function loadJson<T>(fileName: string): Promise<T> {
  const filePath = path.join(process.cwd(), "prisma", "seed", fileName);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function main() {
  const skins = await loadJson<SeedSkin[]>("skins.json");

  if (skins.length > 0) {
    await prisma.skin.createMany({
      data: skins.map((skin) => ({
        id: skin.id,
        marketHashName: skin.marketHashName,
        buffGoodsId: skin.buffGoodsId ?? null,
        iconUrl: skin.iconUrl ?? null
      })),
      skipDuplicates: true
    });
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
