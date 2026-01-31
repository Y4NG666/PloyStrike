import { useEffect, useMemo, useRef, useState } from 'react';
import { getWsUrl } from './api';

type PriceUpdate = {
  skinId: string;
  price: number | null;
  timestamp: string | null;
};

type UnboxSnapshot = {
  sessionId: number;
  status: string;
  totalPool: number;
  createdAt: string;
  startTime: string | null;
  endTime: string | null;
  odds: { prediction: string; payout: number | null }[];
  result: string | null;
};

type WsMessage =
  | { type: 'prices'; data: PriceUpdate[] }
  | { type: 'unbox'; data: UnboxSnapshot }
  | { type: 'odds:update'; data: { sessionId: number; odds: UnboxSnapshot['odds'] } }
  | { type: 'jackpot:update'; data: { sessionId: number; totalPool: number } }
  | { type: string; data?: unknown };

export function useMarketStream() {
  const [prices, setPrices] = useState<PriceUpdate[]>([]);
  const [unbox, setUnbox] = useState<UnboxSnapshot | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WsMessage;
          if (message.type === 'prices') {
            setPrices(message.data);
          }
          if (message.type === 'unbox') {
            setUnbox(message.data);
          }
          if (message.type === 'odds:update') {
            setUnbox((prev) =>
              prev && prev.sessionId === message.data.sessionId
                ? { ...prev, odds: message.data.odds }
                : prev
            );
          }
          if (message.type === 'jackpot:update') {
            setUnbox((prev) =>
              prev && prev.sessionId === message.data.sessionId
                ? { ...prev, totalPool: message.data.totalPool }
                : prev
            );
          }
        } catch {
          // Ignore invalid payloads
        }
      };

      ws.onclose = () => {
        if (reconnectTimer.current) {
          window.clearTimeout(reconnectTimer.current);
        }
        reconnectTimer.current = window.setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      if (reconnectTimer.current) {
        window.clearTimeout(reconnectTimer.current);
      }
      wsRef.current?.close();
    };
  }, []);

  return useMemo(
    () => ({
      prices,
      unbox,
      connected: wsRef.current?.readyState === WebSocket.OPEN,
    }),
    [prices, unbox]
  );
}
