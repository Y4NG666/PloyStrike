'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CHART_DATA } from '@/lib/mock-data';

export function PriceChart() {
  return (
    <div className="card-elevated p-4 sm:p-6 w-full h-full min-h-96">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold">AWP | Dragon Lore</h2>
          <p className="text-2xl sm:text-4xl font-bold text-polygon mt-2">
            $5,840.50
          </p>
          <p className="text-sm text-profit font-semibold mt-1">
            ↑ 12.4% (24h)
          </p>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={CHART_DATA}
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

        {/* Time range buttons */}
        <div className="flex gap-2 flex-wrap">
          {['1h', '4h', '1d', '1w', '1m'].map((period) => (
            <button
              key={period}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === '1d'
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
