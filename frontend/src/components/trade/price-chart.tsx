'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { fetchJson } from '@/lib/api';

type SkinSnapshot = {
  id: string;
  marketHashName: string;
  latest: {
    buff163: number | null;
    steam: number | null;
  };
};

type OhlcResponse = {
  skinId: string;
  points: {
    start: string;
    close: number;
    volume: number | null;
  }[];
};

export function PriceChart() {
  const searchParams = useSearchParams();
  const selectedSkinId = searchParams.get('skin');
  const [skin, setSkin] = useState<SkinSnapshot | null>(null);
  const [skins, setSkins] = useState<SkinSnapshot[]>([]);
  const [history, setHistory] = useState<OhlcResponse | null>(null);
  const [windowStart, setWindowStart] = useState(0);
  const [range, setRange] = useState('1d');
  const [loading, setLoading] = useState(true);
  const rangeConfig = useMemo(
    () => ({
      '1h': { minutes: 60, interval: 5 },
      '4h': { minutes: 240, interval: 15 },
      '1d': { minutes: 1440, interval: 60 },
      '1w': { minutes: 10080, interval: 240 },
      '1m': { minutes: 43200, interval: 1440 },
    }),
    []
  );

  useEffect(() => {
    let mounted = true;
    fetchJson<SkinSnapshot[]>('/api/skins')
      .then((payload) => {
        if (!mounted) return;
        setSkins(payload);
      })
      .catch(() => {
        if (!mounted) return;
        setSkin(null);
        setHistory(null);
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
    if (skins.length === 0) return;
    const selected = selectedSkinId
      ? skins.find((item) => item.id === selectedSkinId) ?? null
      : null;
    setSkin(selected ?? skins[0] ?? null);
  }, [skins, selectedSkinId]);

  useEffect(() => {
    if (!skin) return;
    let mounted = true;
    const { minutes, interval } = rangeConfig[range] ?? rangeConfig['1d'];
    const to = new Date();
    const from = new Date(to.getTime() - minutes * 60 * 1000);
    setLoading(true);
    fetchJson<OhlcResponse>(
      `/api/skins/${encodeURIComponent(skin.id)}/history?source=buff163&intervalMinutes=${interval}&from=${from.toISOString()}&to=${to.toISOString()}`
    )
      .then((ohlc) => {
        if (!mounted) return;
        setHistory(ohlc ?? null);
        setWindowStart(0);
      })
      .catch(() => {
        if (!mounted) return;
        setHistory(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [skin, range, rangeConfig]);

  const chartData = useMemo(() => {
    if (!history || history.points.length === 0) {
      return [];
    }
    const windowSize = Math.min(12, history.points.length);
    const windowEnd = Math.min(history.points.length, windowStart + windowSize);
    return history.points.slice(windowStart, windowEnd).map((point) => ({
      time: new Date(point.start).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      price: point.close,
      volume: point.volume ?? 0,
    }));
  }, [history, windowStart]);

  useEffect(() => {
    if (!history || history.points.length < 2) {
      return;
    }
    const windowSize = Math.min(12, history.points.length);
    const timer = window.setInterval(() => {
      setWindowStart((prev) => {
        const next = prev + 1;
        if (next + windowSize > history.points.length) {
          return 0;
        }
        return next;
      });
    }, 2000);
    return () => window.clearInterval(timer);
  }, [history]);

  const latestPrice = useMemo(() => {
    if (chartData.length > 0) {
      return chartData[chartData.length - 1].price;
    }
    if (!skin) return null;
    return skin.latest.buff163 ?? skin.latest.steam ?? null;
  }, [chartData, skin]);

  const changePercent = useMemo(() => {
    if (chartData.length < 2) return 0;
    const first = chartData[0].price;
    const last = chartData[chartData.length - 1].price;
    if (!first) return 0;
    return ((last - first) / first) * 100;
  }, [chartData]);

  return (
    <div className="card-elevated p-4 sm:p-6 w-full h-full min-h-96">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold">
            {skin?.marketHashName ?? '加载中...'}
          </h2>
          <p className="text-2xl sm:text-4xl font-bold text-polygon mt-2">
            {latestPrice === null ? '暂无报价' : `$${latestPrice.toFixed(2)}`}
          </p>
          <p
            className={`text-sm font-semibold mt-1 ${
              changePercent >= 0 ? 'text-profit' : 'text-loss'
            }`}
          >
            {changePercent >= 0 ? '↑' : '↓'} {changePercent.toFixed(2)}% (24h)
          </p>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8247E5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8247E5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2A2F3E"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              stroke="#666"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#666"
              style={{ fontSize: '12px' }}
              domain={['dataMin - 100', 'dataMax + 100']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#151921',
                border: '1px solid #2A2F3E',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#fff' }}
              formatter={(value) => `$${value}`}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#8247E5"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrice)"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>

        {!loading && chartData.length === 0 && (
          <p className="text-xs text-gray-500">
            暂无历史价格数据，请先运行抓取器。
          </p>
        )}

        {/* Time range buttons */}
        <div className="flex gap-2 flex-wrap">
          {['1h', '4h', '1d', '1w', '1m'].map((period) => (
            <button
              key={period}
              onClick={() => setRange(period)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === range
                  ? 'bg-polygon text-white'
                  : 'border border-border-subtle text-gray-400 hover:text-white hover:border-polygon/50'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
