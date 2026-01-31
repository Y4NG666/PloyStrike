'use client';

import { ShieldCheck } from 'lucide-react';

export function SafeModeBanner() {
  return (
    <div className="relative w-full bg-gradient-to-r from-profit/20 to-profit/10 border border-profit/50 rounded-lg p-4 sm:p-5 overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-profit/10 via-transparent to-profit/5 animate-shimmer" />

      {/* Content */}
      <div className="relative flex items-start gap-3 sm:gap-4">
        <div className="flex-shrink-0 pt-1">
          <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-profit drop-shadow-lg" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-profit text-sm sm:text-base">
            🛡️ 退款保护生效中
          </h3>
          <p className="text-xs sm:text-sm text-gray-300 mt-1 leading-relaxed">
            若本轮无人中奖，100% 资金原路退回。您的资金受到我们的完全保护。
            <br className="hidden sm:block" />
            <span className="text-gray-400">
              (If no winner this round, full refund guaranteed.)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
