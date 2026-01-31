'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function TradePanel() {
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [amount, setAmount] = useState(100);
  const [leverage, setLeverage] = useState(5);

  const handlePlaceTrade = () => {
    alert(
      `✅ 下单成功！\n方向: ${
        direction === 'long' ? '看多 (LONG)' : '看空 (SHORT)'
      }\n金额: ${amount} MATIC\n杠杆: ${leverage}x`
    );
  };

  return (
    <div className="card-elevated p-4 sm:p-6 h-full space-y-6">
      {/* Direction selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          交易方向 (Direction)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setDirection('long')}
            className={`rounded-lg p-4 font-semibold transition-all border-2 ${
              direction === 'long'
                ? 'bg-profit/20 border-profit text-profit'
                : 'border-border-subtle text-gray-400 hover:border-profit/50'
            }`}
          >
            <TrendingUp className="h-5 w-5 mx-auto mb-2" />
            看多 (LONG)
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setDirection('short')}
            className={`rounded-lg p-4 font-semibold transition-all border-2 ${
              direction === 'short'
                ? 'bg-loss/20 border-loss text-loss'
                : 'border-border-subtle text-gray-400 hover:border-loss/50'
            }`}
          >
            <TrendingDown className="h-5 w-5 mx-auto mb-2" />
            看空 (SHORT)
          </motion.button>
        </div>
      </div>

      {/* Amount input */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          下单金额 (Amount)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="input-base text-lg font-bold"
          placeholder="100"
        />

        {/* Quick buttons */}
        <div className="grid grid-cols-3 gap-2">
          {['25%', '50%', 'Max'].map((label) => (
            <button
              key={label}
              onClick={() => {
                if (label === '25%') setAmount(250);
                else if (label === '50%') setAmount(500);
                else setAmount(1000);
              }}
              className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold text-gray-400 hover:text-polygon hover:border-polygon/50 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Leverage */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            杠杆 (Leverage)
          </label>
          <span className="text-lg font-bold text-polygon">{leverage}x</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={leverage}
          onChange={(e) => setLeverage(Number(e.target.value))}
          className="w-full cursor-pointer accent-polygon"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1x</span>
          <span>10x</span>
        </div>
      </div>

      {/* Trade summary */}
      <div className="border-t border-border-subtle pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Margin Required:</span>
          <span className="font-semibold">
            {(amount / leverage).toFixed(2)} MATIC
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Position Size:</span>
          <span className="font-semibold">{amount * leverage} MATIC</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Liquidation Price:</span>
          <span className="font-semibold text-loss">$5,600.00</span>
        </div>
      </div>

      {/* Place trade button */}
      <Button
        onClick={handlePlaceTrade}
        variant={direction === 'long' ? 'success' : 'danger'}
        fullWidth
        className="text-lg py-6 font-bold"
      >
        {direction === 'long' ? '开多 (LONG)' : '开空 (SHORT)'}
      </Button>

      {/* Risk warning */}
      <div className="bg-loss/10 border border-loss/30 rounded-lg p-3 text-xs text-loss/80">
        ⚠ 杠杆交易有风险，可能导致亏损，请谨慎操作。
      </div>
    </div>
  );
}
