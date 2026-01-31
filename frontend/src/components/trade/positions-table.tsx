'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

type UnboxSession = {
  id: number;
  createdAt: string;
};

type UnboxBet = {
  id: number;
  userAddress: string;
  prediction: string;
  amount: number;
  payout: number | null;
};

type PositionRow = {
  id: number;
  asset: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  markPrice: number;
  pnl: number;
  pnlPercent: number;
  status: string;
  leverage: string;
};

export function PositionsTable() {
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchJson<UnboxSession[]>('/api/unbox/sessions')
      .then((sessions) => {
        if (!mounted) return null;
        const latest = sessions[0];
        if (!latest) return null;
        return fetchJson<{ bets: UnboxBet[] }>(`/api/unbox/sessions/${latest.id}`);
      })
      .then((session) => {
        if (!mounted) return;
        const bets = session?.bets ?? [];
        const mapped = bets.map((bet) => {
          const entryPrice = Number(bet.amount);
          const markPrice = bet.payout === null ? entryPrice : Number(bet.payout);
          const pnl = markPrice - entryPrice;
          const pnlPercent = entryPrice ? (pnl / entryPrice) * 100 : 0;
          return {
            id: bet.id,
            asset: `Unbox ${bet.prediction}`,
            direction: bet.prediction === 'GOLD' || bet.prediction === 'KNIFE' ? 'LONG' : 'SHORT',
            entryPrice,
            markPrice,
            pnl,
            pnlPercent,
            status: bet.payout === null ? 'Open' : 'Closed',
            leverage: '1x',
          } satisfies PositionRow;
        });
        setPositions(mapped);
      })
      .catch(() => {
        if (!mounted) return;
        setPositions([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="card-elevated p-4 sm:p-6 overflow-x-auto">
      <h2 className="text-lg sm:text-xl font-bold mb-4">持仓 (Positions)</h2>
      {loading && <p className="text-xs text-gray-500 mb-3">加载中...</p>}
      {!loading && positions.length === 0 && (
        <p className="text-xs text-gray-500 mb-3">暂无真实持仓数据</p>
      )}

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left px-4 py-3 text-gray-400 font-semibold">
                资产
              </th>
              <th className="text-center px-4 py-3 text-gray-400 font-semibold">
                方向
              </th>
              <th className="text-right px-4 py-3 text-gray-400 font-semibold">
                开仓价
              </th>
              <th className="text-right px-4 py-3 text-gray-400 font-semibold">
                标记价
              </th>
              <th className="text-right px-4 py-3 text-gray-400 font-semibold">
                未实现盈亏
              </th>
              <th className="text-center px-4 py-3 text-gray-400 font-semibold">
                状态
              </th>
              <th className="text-center px-4 py-3 text-gray-400 font-semibold">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr
                key={position.id}
                className="border-b border-border-subtle/50 hover:bg-bg-tertiary/30 transition-colors"
              >
                <td className="px-4 py-4 font-semibold">{position.asset}</td>
                <td className="px-4 py-4 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-bg-tertiary/50">
                    {position.direction === 'LONG' ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-profit" />
                        <span className="text-profit font-semibold text-sm">
                          {position.direction}
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-4 w-4 text-loss" />
                        <span className="text-loss font-semibold text-sm">
                          {position.direction}
                        </span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 text-right font-mono">
                  ${position.entryPrice.toFixed(2)}
                </td>
                <td className="px-4 py-4 text-right font-mono">
                  ${position.markPrice.toFixed(2)}
                </td>
                <td
                  className={`px-4 py-4 text-right font-semibold ${
                    position.pnl >= 0 ? 'text-profit' : 'text-loss'
                  }`}
                >
                  {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                  <span className="text-xs ml-1 text-gray-400">
                    ({position.pnl >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="px-2 py-1 rounded-lg bg-blue-industrial/20 text-blue-industrial text-xs font-semibold">
                    {position.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <button className="p-2 rounded-lg hover:bg-loss/20 text-loss transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {positions.map((position) => (
          <div
            key={position.id}
            className="border border-border-subtle rounded-lg p-4 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white">{position.asset}</p>
                <p className="text-xs text-gray-500 mt-1">
                  杠杆: {position.leverage}
                </p>
              </div>
              <div
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                  position.direction === 'LONG'
                    ? 'bg-profit/20 text-profit'
                    : 'bg-loss/20 text-loss'
                }`}
              >
                {position.direction === 'LONG' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {position.direction}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-500">Entry Price</p>
                <p className="font-mono font-semibold">
                  ${position.entryPrice.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Mark Price</p>
                <p className="font-mono font-semibold">
                  ${position.markPrice.toFixed(2)}
                </p>
              </div>
            </div>

            <div
              className={`p-2 rounded bg-bg-tertiary/50 text-sm font-semibold ${
                position.pnl >= 0 ? 'text-profit' : 'text-loss'
              }`}
            >
              PnL: {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)} (
              {position.pnl >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
            </div>

            <Button variant="danger" size="sm" fullWidth>
              Close Position
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
