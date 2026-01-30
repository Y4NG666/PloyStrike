import { prisma } from "../database/client.js";
import { env } from "../config/env.js";
import { simulateUnboxResult } from "../scrapers/unbox.js";
import { processUnboxResult } from "../processors/unboxProcessor.js";

async function fetchReadySessions() {
  const now = new Date();
  return prisma.unboxSession.findMany({
    where: {
      status: { in: ["BETTING", "OPENING"] },
      endTime: { not: null, lte: now }
    }
  });
}

async function runOnce() {
  const sessions = await fetchReadySessions();
  for (const session of sessions) {
    if (session.status === "BETTING") {
      await prisma.unboxSession.update({
        where: { id: session.id },
        data: { status: "OPENING" }
      });
    }
    const result = simulateUnboxResult(session.id);
    await processUnboxResult(session.id, result.result);
  }
}

async function main() {
  await runOnce();
  setInterval(() => {
    runOnce().catch((error) => {
      console.error("Unbox keeper run failed:", error);
    });
  }, env.unboxIntervalMs);
}

main().catch((error) => {
  console.error("Unbox keeper boot failed:", error);
  process.exit(1);
});
