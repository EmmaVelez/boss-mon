import { useEffect, useRef, useState, useCallback } from 'react';
import type { PublicState, Phase } from '../core/types';
import type { Card } from '../data/cards';

export function useWebSocket(onDrawn?: (cards: Card[]) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<PublicState | null>(null);
  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${window.location.host}/ws`);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'STATE') {
        setState(msg.state);
      } else if (msg.type === 'SET_ID') {
        setPlayerId(msg.id);
      } else if (msg.type === 'DRAWN') {
        onDrawn?.(msg.cards);
      }
    };
    return () => ws.close();
  }, [onDrawn]);

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(msg));
  }, []);

  const drawCard = useCallback(() => {
    send({ type: 'DRAW_CARD' });
  }, [send]);

  return { state, connected, send, playerId, drawCard };
}
