'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchJson } from '@/lib/api';
import { useMarketStream } from '@/lib/use-market-stream';
import { formatPrice } from '@/lib/utils';

type MarketRow = {
  id: string;
  marketHashName: string;
  latestPrice: number | null;
};

type TickerItem = {
  id: string;
  name: string;
  price: number | null;
  change: number;
  trend: 'up' | 'down' | 'flat';
};

export function Ticker() {
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [flashMap, setFlashMap] = useState<Record<string, 'up' | 'down' | null>>({});
  const { prices, unbox, connected } = useMarketStream();
  const timeoutRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let mounted = true;
    fetchJson<{ skins: MarketRow[] }>('/api/markets/live')
      .then((payload) => {
        if (!mounted) return;
        setMarkets(payload.skins);
      })
      .catch(() => {
        if (!mounted) return;
        setMarkets([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const tickerItems = useMemo<TickerItem[]>(() => {
    const priceMap = new Map(prices.map((p) => [p.skinId, p.price]));
    return markets.map((market) => {
      const price = priceMap.get(market.id) ?? market.latestPrice ?? null;
      return {
        id: market.id,
        name: market.marketHashName,
        price,
        change: 0,
        trend: 'flat',
      };
    });
  }, [markets, prices]);

  useEffect(() => {
    setMarkets((prev) => {
      const prevMap = new Map(prev.map((market) => [market.id, market]));
      return prev.map((market) => {
        const nextPrice = prices.find((p) => p.skinId === market.id)?.price ?? null;
        const prevPrice = prevMap.get(market.id)?.latestPrice ?? null;
        if (nextPrice !== null && prevPrice !== null && nextPrice !== prevPrice) {
          const direction = nextPrice > prevPrice ? 'up' : 'down';
          setFlashMap((current) => ({ ...current, [market.id]: direction }));
          if (timeoutRef.current[market.id]) {
            window.clearTimeout(timeoutRef.current[market.id]);
          }
          timeoutRef.current[market.id] = window.setTimeout(() => {
            setFlashMap((current) => ({ ...current, [market.id]: null }));
          }, 700);
        }
        return {
          ...market,
          latestPrice: nextPrice ?? market.latestPrice,
        };
      });
    });
  }, [prices]);

  const poolItem = useMemo(() => {
    if (!unbox) return null;
    return {
      id: 'pool',
      label: `开箱池 ${unbox.sessionId}`,
      value: `${unbox.totalPool.toFixed(0)} MATIC`,
    };
  }, [unbox]);

  const renderItems = useMemo(() => {
    const items = tickerItems.map((item) => (
      <div key={item.id} className="flex items-center gap-2 px-4">
        <span className="text-xs text-gray-400 whitespace-nowrap">{item.name}</span>
        <span
          className={`text-xs font-semibold transition-colors ${
            flashMap[item.id] === 'up'
              ? 'text-profit animate-flash-up'
              : flashMap[item.id] === 'down'
              ? 'text-loss animate-flash-down'
              : 'text-white'
          }`}
        >
          {item.price === null ? '—' : formatPrice(item.price)}
        </span>
      </div>
    ));
    if (poolItem) {
      items.push(
        <div key="pool" className="flex items-center gap-2 px-4">
          <span className="text-xs text-gray-400 whitespace-nowrap">{poolItem.label}</span>
          <span className="text-xs font-semibold text-gold">{poolItem.value}</span>
        </div>
      );
    }
    return items;
  }, [tickerItems, poolItem, flashMap]);

  const loopItems = useMemo(() => [...renderItems, ...renderItems], [renderItems]);

  return (
    <div className="border-t border-border-subtle bg-bg-secondary/60">
      <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500">
        <span className="h-2 w-2 rounded-full bg-profit animate-pulse" />
        <span>{connected ? '实时流动' : '连接中...'}</span>
      </div>
      <div className="overflow-hidden">
        <div className="flex w-max animate-ticker whitespace-nowrap">{loopItems}</div>
      </div>
    </div>
  );
}
