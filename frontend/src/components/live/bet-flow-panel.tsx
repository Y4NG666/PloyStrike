'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchJson } from '@/lib/api';
import { useMarketStream } from '@/lib/use-market-stream';

type OddsEntry = {
  prediction: string;
  percentage: number;
  payout: number | null;
};

type SessionOdds = {
  sessionId: number;
  odds: OddsEntry[];
};

const LABELS: Record<string, string> = {
  BLUE: '普通开箱',
  GOLD: '稀有开箱',
  KNIFE: '传说爆率',
};

export function BetFlowPanel() {
  const { unbox } = useMarketStream();
  const [fallback, setFallback] = useState<SessionOdds | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchJson<{ id: number }[]>('/api/unbox/sessions')
      .then((sessions) => {
        if (!mounted) return null;
        const latest = sessions[0];
        if (!latest) return null;
        return fetchJson<SessionOdds>(`/api/unbox/sessions/${latest.id}/odds`);
      })
      .then((payload) => {
        if (!mounted || !payload) return;
        setFallback(payload);
      })
      .catch(() => {
        if (!mounted) return;
        setFallback(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const odds = useMemo<OddsEntry[]>(() => {
    if (unbox?.odds?.length) {
      return unbox.odds;
    }
    return fallback?.odds ?? [];
  }, [unbox, fallback]);

  const totalPool = useMemo(() => {
    if (unbox) {
      return unbox.totalPool;
    }
    return null;
  }, [unbox]);

  return (
    <div className="card-elevated p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold">下注流动面板</h2>
        <span className="text-xs text-gray-500">
          {totalPool === null ? '等待池数据' : `池子 ${totalPool.toFixed(0)} MATIC`}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {odds.length === 0 && (
          <p className="text-xs text-gray-500">暂无下注分布数据</p>
        )}
        {odds.map((entry) => {
          const width = Math.min(Math.max(entry.percentage, 2), 100);
          return (
            <div key={entry.prediction} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{LABELS[entry.prediction] ?? entry.prediction}</span>
                <span>
                  {entry.percentage.toFixed(1)}% ·{' '}
                  {entry.payout ? `${entry.payout.toFixed(2)}x` : '—'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-polygon to-purple-rare transition-all duration-700"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
