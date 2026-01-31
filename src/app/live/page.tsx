'use client';

import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { VideoPlayer } from '@/components/live/video-player';
import { SafeModeBanner } from '@/components/live/safe-mode-banner';
import { BettingCards } from '@/components/live/betting-cards';
import { LiveChat } from '@/components/live/live-chat';

export default function LivePage() {
  return (
    <>
      <Navbar />
      <div className="flex flex-1 gap-0 overflow-hidden">
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 sm:p-6 lg:gap-6">
            {/* Left section: Video + Betting (2/3 width on desktop) */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Video Player */}
              <VideoPlayer />

              {/* Safe Mode Banner */}
              <SafeModeBanner />

              {/* Betting Console */}
              <div className="card-elevated p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold mb-4">
                  选择下注选项 (Select Bet Type)
                </h2>
                <BettingCards />
              </div>
            </div>

            {/* Right section: Live Chat (1/3 width on desktop) */}
            <div className="lg:col-span-1 h-auto lg:h-[calc(100vh-7rem)] lg:sticky lg:top-20">
              <div className="card-elevated h-full flex flex-col p-4 sm:p-6 min-h-96 lg:min-h-0">
                <LiveChat />
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
