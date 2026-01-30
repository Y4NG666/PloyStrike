export function withinDiff(
  left: number | null,
  right: number | null,
  diffPct: number
): boolean {
  if (!left || !right) return false;
  const diff = Math.abs(left - right);
  const ratio = diff / Math.min(left, right);
  return ratio <= diffPct;
}

export function withinSwing(
  last: number | null,
  next: number | null,
  maxSwingPct: number
): boolean {
  if (!last || !next) return true;
  const diff = Math.abs(next - last);
  const ratio = diff / last;
  return ratio <= maxSwingPct;
}
