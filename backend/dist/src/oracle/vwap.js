export function computeVWAP(points) {
    let totalVolume = 0;
    let totalWeighted = 0;
    for (const point of points) {
        if (!Number.isFinite(point.price) || point.price <= 0) {
            continue;
        }
        const volume = point.volume && point.volume > 0 ? point.volume : 1;
        totalVolume += volume;
        totalWeighted += point.price * volume;
    }
    if (totalVolume === 0) {
        return null;
    }
    return Number((totalWeighted / totalVolume).toFixed(4));
}
