'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { fetchJson } from '@/lib/api';
import { useMarketStream } from '@/lib/use-market-stream';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatPrice, formatPercent } from '@/lib/utils';

// Sparkline SVG component
function Sparkline({
  id,
  data,
  trend,
}: {
  id: string;
  data: number[];
  trend: 'up' | 'down' | 'flat';
}) {
  const width = 64;
  const height = 28;
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

  const areaPath = `M${points} L${width},${height} L0,${height} Z`;
  const strokeColor =
    trend === 'up' ? '#10B981' : trend === 'down' ? '#F43F5E' : '#888888';
  const maxIndex = data.findIndex((value) => value === max);
  const minIndex = data.findIndex((value) => value === min);
  const pointX = (index: number) => (index / (data.length - 1)) * width;
  const pointY = (value: number) => height - ((value - min) / range) * height;

  return (
    <svg width={width} height={height} className="inline-block">
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-${id})`} />
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      {data.length > 1 && (
        <>
          <circle
            cx={pointX(maxIndex)}
            cy={pointY(max)}
            r="2.5"
            fill="#10B981"
            stroke="#0B0E14"
            strokeWidth="0.8"
          />
          <circle
            cx={pointX(minIndex)}
            cy={pointY(min)}
            r="2.5"
            fill="#F43F5E"
            stroke="#0B0E14"
            strokeWidth="0.8"
          />
        </>
      )}
    </svg>
  );
}

export function Sidebar() {
  const [markets, setMarkets] = useState<
    {
      id: string;
      name: string;
      price: number | null;
      change: number;
      trend: 'up' | 'down' | 'flat';
      sparkline: number[];
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [flashMap, setFlashMap] = useState<Record<string, 'up' | 'down' | null>>({});
  const [flowMap, setFlowMap] = useState<Record<string, boolean>>({});
  const flashTimers = useRef<Record<string, number>>({});
  const flowTimers = useRef<Record<string, number>>({});
  const { prices } = useMarketStream();

  useEffect(() => {
    let mounted = true;
    fetchJson<{
      markets: {
        id: string;
        marketHashName: string;
        latestPrice: number | null;
        changePct: number;
        sparkline: number[];
      }[];
    }>('/api/markets/hot?limit=8')
      .then((payload) => {
        if (!mounted) return;
        const mapped = payload.markets.map((market) => {
          const price = market.latestPrice;
          const sparkline =
            market.sparkline && market.sparkline.length > 0
              ? market.sparkline
              : price
              ? Array.from({ length: 8 }, () => price)
              : [0, 0, 0, 0, 0];
          const trend: 'up' | 'down' | 'flat' =
            market.changePct > 0 ? 'up' : market.changePct < 0 ? 'down' : 'flat';
          return {
            id: market.id,
            name: market.marketHashName,
            price,
            change: market.changePct,
            trend,
            sparkline,
          };
        });
        setMarkets(mapped);
      })
      .catch(() => {
        if (!mounted) return;
        setMarkets([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (prices.length === 0) return;
    setMarkets((prev) => {
      const prevMap = new Map(prev.map((market) => [market.id, market]));
      return prev.map((market) => {
        const price = prices.find((entry) => entry.skinId === market.id)?.price ?? market.price;
        const previousPrice = prevMap.get(market.id)?.price ?? null;
        const sparklineSeed = market.sparkline ?? [];
        const nextSparkline =
          price === null
            ? sparklineSeed.length > 0
              ? sparklineSeed
              : [0, 0, 0, 0, 0]
            : [...sparklineSeed, price].slice(-10);
        let change = market.change;
        let trend: 'up' | 'down' | 'flat' = market.trend;
        if (price !== null && previousPrice !== null && previousPrice !== 0 && price !== previousPrice) {
          change = ((price - previousPrice) / previousPrice) * 100;
          trend = change > 0 ? 'up' : 'down';
          setFlashMap((current) => ({ ...current, [market.id]: trend }));
          if (flashTimers.current[market.id]) {
            window.clearTimeout(flashTimers.current[market.id]);
          }
          flashTimers.current[market.id] = window.setTimeout(() => {
            setFlashMap((current) => ({ ...current, [market.id]: null }));
          }, 700);
          setFlowMap((current) => ({ ...current, [market.id]: true }));
          if (flowTimers.current[market.id]) {
            window.clearTimeout(flowTimers.current[market.id]);
          }
          flowTimers.current[market.id] = window.setTimeout(() => {
            setFlowMap((current) => ({ ...current, [market.id]: false }));
          }, 1500);
        }
        return {
          ...market,
          price,
          change,
          trend,
          sparkline: nextSparkline,
        };
      });
    });
  }, [prices]);

  const content = useMemo(() => {
    if (loading) {
      return <p className="text-xs text-gray-500 px-2">加载中...</p>;
    }
    if (markets.length === 0) {
      return <p className="text-xs text-gray-500 px-2">暂无市场数据</p>;
    }
    return (
      <div className="space-y-2">
        {markets.map((market) => (
          <Link
            key={market.id}
            href={`/trade?skin=${encodeURIComponent(market.id)}`}
            className="group block rounded-lg border border-border-subtle bg-bg-secondary/50 p-3 transition-all hover:bg-bg-tertiary hover:border-polygon/50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-semibold truncate text-white group-hover:text-polygon">
                  {market.name}
                </h3>
                <p
                  className={`text-xs mt-1 transition-colors ${
                    flashMap[market.id] === 'up'
                      ? 'text-profit animate-flash-up'
                      : flashMap[market.id] === 'down'
                      ? 'text-loss animate-flash-down'
                      : 'text-gray-500'
                  }`}
                >
                  {market.price === null ? '暂无报价' : formatPrice(market.price)}
                </p>
                <p
                  className={`text-[10px] mt-1 ${
                    market.trend === 'up'
                      ? 'text-profit'
                      : market.trend === 'down'
                      ? 'text-loss'
                      : 'text-gray-500'
                  }`}
                >
                  趋势 {market.trend === 'up' ? '↑' : market.trend === 'down' ? '↓' : '—'}{' '}
                  {formatPercent(market.change)}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <Sparkline id={market.id} data={market.sparkline} trend={market.trend} />
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
          </Link>
        ))}
      </div>
    );
  }, [loading, markets]);

  return (
    <aside className="sidebar-hidden w-full sm:w-64 flex-shrink-0 overflow-y-auto border-r border-border-subtle bg-bg-secondary/30 p-4">
      <div className="space-y-4">
        <h2 className="px-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
          热门市场
        </h2>
        {content}
      </div>
    </aside>
  );
}
