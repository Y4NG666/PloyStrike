'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BETTING_OPTIONS } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';

export function BettingCards() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCardClick = (cardId: string) => {
    setSelectedCard(cardId);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    const card = BETTING_OPTIONS.find((c) => c.id === selectedCard);
    if (card) {
      alert(`✅ 下注成功！${card.label} - 已下注 100 MATIC`);
      setShowConfirm(false);
      setSelectedCard(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Betting Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {BETTING_OPTIONS.map((option) => {
          const isHovered = hoveredCard === option.id;
          const isSelected = selectedCard === option.id;

          return (
            <motion.div
              key={option.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onMouseEnter={() => setHoveredCard(option.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`relative cursor-pointer rounded-xl border-2 p-4 sm:p-5 transition-all ${
                isSelected
                  ? `${option.borderColor} bg-white/5 ring-2 ring-offset-2 ring-offset-bg-primary`
                  : `border-border-subtle hover:border-polygon/50`
              } ${option.legendary ? 'animate-pulse-glow' : ''}`}
              onClick={() => handleCardClick(option.id)}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 rounded-xl opacity-10 ${option.color}`} />

              {/* Content */}
              <div className="relative space-y-3">
                <div className="text-3xl">{option.icon}</div>

                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    {option.label}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {option.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border-subtle">
                  <p className="text-xl sm:text-2xl font-black text-gold">
                    {option.multiplier}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">赔率倍数</p>
                </div>

                {option.legendary && (
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gold drop-shadow-lg">
                      超稀有 (Ultra Rare)
                    </p>
                  </div>
                )}
              </div>

              {/* Hover effect - gold glow on legendary */}
              {option.legendary && isHovered && (
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-gold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Input Section */}
      <div className="space-y-2 pt-2">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          下注金额 (Bet Amount)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="输入 MATIC 数量"
            className="flex-1 rounded-lg border border-border-subtle bg-bg-secondary/50 px-4 py-2 text-white placeholder-gray-500 focus:border-polygon focus:outline-none focus:ring-1 focus:ring-polygon/50"
            defaultValue="100"
          />
          <select className="rounded-lg border border-border-subtle bg-bg-secondary/50 px-3 py-2 text-white focus:border-polygon focus:outline-none focus:ring-1 focus:ring-polygon/50">
            <option>MATIC</option>
            <option>USDT</option>
            <option>ETH</option>
          </select>
        </div>

        {/* Quick select buttons */}
        <div className="flex gap-2">
          {['25%', '50%', 'Max'].map((label) => (
            <button
              key={label}
              className="flex-1 px-2 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold text-gray-400 hover:text-polygon hover:border-polygon/50 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && selectedCard && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            className="card border-polygon/50 p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg sm:text-xl font-bold mb-4">确认下注</h3>
            <p className="text-gray-300 mb-6">
              你将下注 100 MATIC 参与{' '}
              <span className="text-polygon font-semibold">
                {BETTING_OPTIONS.find((c) => c.id === selectedCard)?.label}
              </span>
            </p>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                fullWidth
                onClick={() => setShowConfirm(false)}
              >
                取消
              </Button>
              <Button
                variant="success"
                fullWidth
                onClick={handleConfirm}
              >
                确认下注
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
