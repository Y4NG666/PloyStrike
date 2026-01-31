export function withinDiff(left, right, diffPct) {
    if (!left || !right)
        return false;
    const diff = Math.abs(left - right);
    const ratio = diff / Math.min(left, right);
    return ratio <= diffPct;
}
export function withinSwing(last, next, maxSwingPct) {
    if (!last || !next)
        return true;
    const diff = Math.abs(next - last);
    const ratio = diff / last;
    return ratio <= maxSwingPct;
}
