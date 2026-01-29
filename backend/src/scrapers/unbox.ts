export type UnboxResult = {
  sessionId: number;
  result: "BLUE" | "GOLD" | "KNIFE";
  resolvedAt: Date;
};

const outcomes: UnboxResult["result"][] = ["BLUE", "GOLD", "KNIFE"];
const weights = [0.75, 0.2, 0.05];

function weightedPick<T>(values: T[], weightsList: number[]): T {
  const total = weightsList.reduce((sum, w) => sum + w, 0);
  const roll = Math.random() * total;
  let acc = 0;
  for (let i = 0; i < values.length; i += 1) {
    acc += weightsList[i];
    if (roll <= acc) {
      return values[i];
    }
  }
  return values[values.length - 1];
}

export function simulateUnboxResult(sessionId: number): UnboxResult {
  return {
    sessionId,
    result: weightedPick(outcomes, weights),
    resolvedAt: new Date()
  };
}

export async function fetchUnboxResult(_sessionId: number): Promise<UnboxResult | null> {
  // Placeholder for real integration (stream scrape or contract event).
  return null;
}
