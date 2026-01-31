'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LIVE_BETS } from '@/lib/mock-data';
import { Copy, TrendingUp, Trophy } from 'lucide-react';

export function LiveChat() {
  const [messages, setMessages] = useState<typeof LIVE_BETS>([]);

  useEffect(() => {
    setMessages(LIVE_BETS);

    // Simulate new messages every 3-5 seconds
    const interval = setInterval(() => {
      const newBets = [
        {
          id: Date.now(),
          user: `0x${Math.random().toString(16).slice(2, 8)}...${Math.random()
            .toString(16)
            .slice(2, 6)}`,
          action: ['Bet Call', 'Bet Put', 'Open Case'][
            Math.floor(Math.random() * 3)
          ],
          amount: `${Math.floor(Math.random() * 1000) + 50} MATIC`,
          result:
            Math.random() > 0.7 ? 'Win (Gold)' : 'Pending',
          timestamp: 'now',
          highlight: Math.random() > 0.8,
        },
      ];

      setMessages((prev) => [...newBets, ...prev].slice(0, 10));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const getResultColor = (result: string) => {
    if (result.includes('Win')) return 'text-profit';
    if (result === 'Loss') return 'text-loss';
    return 'text-gray-400';
  };

  const getResultIcon = (result: string) => {
    if (result.includes('Gold')) return <Trophy className="h-3 w-3" />;
    if (result.includes('Win')) return <TrendingUp className="h-3 w-3" />;
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border-subtle pb-3 mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          🔴 Live Activity
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Viewing {messages.length} recent transactions
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {messages.map((bet) => (
            <motion.div
              key={bet.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className={`rounded-lg p-3 text-xs transition-all ${
                bet.highlight
                  ? 'bg-gold/20 border border-gold/50 shadow-lg shadow-gold/20'
                  : 'bg-bg-tertiary/50 border border-border-subtle hover:border-polygon/50'
              }`}
            >
              <div className="space-y-1.5">
                {/* User and action */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-polygon flex-shrink-0" />
                    <button className="font-mono font-semibold text-polygon hover:text-polygon/80 truncate group relative">
                      {bet.user}
                      <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 absolute -right-4 top-0.5 transition-opacity" />
                    </button>
                  </div>
                  <span className="text-gray-500 flex-shrink-0">
                    {bet.timestamp}
                  </span>
                </div>

                {/* Action and amount */}
                <div className="pl-3.5 space-y-1">
                  <p className="text-gray-300">
                    <span className="font-semibold">{bet.action}</span> ·{' '}
                    <span className="text-yellow-500 font-mono">
                      {bet.amount}
                    </span>
                  </p>

                  {/* Result */}
                  <div
                    className={`flex items-center gap-1 font-semibold ${getResultColor(
                      bet.result
                    )}`}
                  >
                    {getResultIcon(bet.result)}
                    <span>{bet.result}</span>
                  </div>
                </div>
              </div>

              {/* Highlight indicator */}
              {bet.highlight && (
                <div className="absolute -left-0.5 top-0 bottom-0 w-1 bg-gradient-to-b from-gold to-transparent rounded-full" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer stats */}
      <div className="border-t border-border-subtle pt-3 mt-4">
        <div className="grid grid-cols-3 gap-2 text-xs text-center">
          <div className="p-2 rounded-lg bg-bg-tertiary/50">
            <p className="text-gray-500">Total Volume</p>
            <p className="font-bold text-polygon mt-1">$125K</p>
          </div>
          <div className="p-2 rounded-lg bg-bg-tertiary/50">
            <p className="text-gray-500">Winners</p>
            <p className="font-bold text-profit mt-1">24</p>
          </div>
          <div className="p-2 rounded-lg bg-bg-tertiary/50">
            <p className="text-gray-500">Avg Win</p>
            <p className="font-bold text-gold mt-1">5.2x</p>
          </div>
        </div>
      </div>
    </div>
  );
}
