'use client';

import { Play } from 'lucide-react';

export function VideoPlayer() {
  return (
    <div className="relative w-full bg-bg-secondary rounded-lg overflow-hidden border border-border-subtle aspect-video sm:aspect-auto sm:h-96">
      {/* Video background */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg-tertiary to-bg-secondary" />

      {/* Play button center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-full bg-polygon/20 p-6 hover:bg-polygon/30 transition-colors cursor-pointer group">
          <Play className="h-12 w-12 text-polygon fill-polygon group-hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* LIVE badge */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-loss/90 px-3 py-1.5 rounded-lg font-semibold text-sm">
        <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
        LIVE
      </div>

      {/* Stream info */}
      <div className="absolute bottom-4 left-4 right-4">
        <p className="text-lg sm:text-2xl font-bold text-white drop-shadow-lg">
          🔴 LIVE: GabeN&apos;s Basement
        </p>
        <p className="text-xs sm:text-sm text-gray-300 mt-1">
          Legendary Unboxing Event - 传说级开箱活动
        </p>
      </div>

      {/* Viewer count */}
      <div className="absolute top-4 right-4 bg-bg-secondary/80 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm">
        <div className="h-2 w-2 rounded-full bg-profit animate-pulse" />
        <span className="font-semibold">12.5K watching</span>
      </div>
    </div>
  );
}
