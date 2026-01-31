'use client';

import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { PriceChart } from '@/components/trade/price-chart';
import { TradePanel } from '@/components/trade/trade-panel';
import { PositionsTable } from '@/components/trade/positions-table';

export default function TradePage() {
  return (
    <>
      <Navbar />
      <div className="flex flex-1 gap-0 overflow-hidden">
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 sm:p-6 lg:gap-6">
            {/* Chart (left, 2/3) */}
            <div className="lg:col-span-2">
              <PriceChart />
            </div>

            {/* Trade Panel (right, 1/3) */}
            <div className="lg:col-span-1">
              <TradePanel />
            </div>
          </div>

          {/* Positions table (full width at bottom) */}
          <div className="px-4 sm:px-6 lg:px-8 pb-6">
            <PositionsTable />
          </div>
        </main>
      </div>
    </>
  );
}
