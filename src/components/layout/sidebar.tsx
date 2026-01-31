'use client';

import { MARKET_DATA } from '@/lib/mock-data';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatPrice, formatPercent } from '@/lib/utils';

// Sparkline SVG component
function Sparkline({
  data,
  trend,
}: {
  data: number[];
  trend: 'up' | 'down' | 'flat';
}) {
  const width = 40;
  const height = 20;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map(
      (value, index) =>
        `${(index / (data.length - 1)) * width},${
          height - ((value - min) / range) * height
        }`
    )
    .join(' ');

  const strokeColor =
    trend === 'up' ? '#10B981' : trend === 'down' ? '#F43F5E' : '#888888';

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Sidebar() {
  return (
    <aside className="sidebar-hidden w-full sm:w-64 flex-shrink-0 overflow-y-auto border-r border-border-subtle bg-bg-secondary/30 p-4">
      <div className="space-y-4">
        <h2 className="px-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
          热门市场
        </h2>

        <div className="space-y-2">
          {MARKET_DATA.map((market) => (
            <div
              key={market.id}
              className="group cursor-pointer rounded-lg border border-border-subtle bg-bg-secondary/50 p-3 transition-all hover:bg-bg-tertiary hover:border-polygon/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-semibold truncate text-white group-hover:text-polygon">
                    {market.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPrice(market.price)}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <Sparkline data={market.sparkline} trend={market.trend} />
                  <p
                    className={`text-xs font-semibold mt-1 ${
                      market.trend === 'up'
                        ? 'text-profit'
                        : market.trend === 'down'
                        ? 'text-loss'
                        : 'text-gray-500'
                    }`}
                  >
                    {formatPercent(market.change)}
                  </p>
                </div>
              </div>

              {/* Trend indicator */}
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                {market.trend === 'up' && (
                  <TrendingUp className="h-3 w-3 text-profit" />
                )}
                {market.trend === 'down' && (
                  <TrendingDown className="h-3 w-3 text-loss" />
                )}
                {market.trend === 'flat' && (
                  <Minus className="h-3 w-3 text-gray-500" />
                )}
                <span>
                  {market.trend === 'up'
                    ? '上升'
                    : market.trend === 'down'
                    ? '下降'
                    : '平稳'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
