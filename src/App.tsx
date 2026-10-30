import { useEffect, useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { drawCard } from './data/cards';
import type { Card } from './data/cards';
import { CardHandSimple } from './components/CardHandSimple';
import { DungeonCanvas } from './components/DungeonCanvas';
import { botChooseCard } from './ai/bot';
import { Lobby } from './components/Lobby';

export default function App() {
  const { state, connected, send } = useWebSocket();
  const [hand, setHand] = useState<Card[]>([]);

  useEffect(() => {
    if (connected && hand.length === 0) setHand([drawCard(), drawCard(), drawCard()]);
  }, [connected]);

  if (!connected) return <div style={{ padding: 16 }}>Connecting…</div>;
  if (!state) {
    return (
      <Lobby onCreate={(name) => { send({ type:'SET_NAME', name }); send({ type:'CREATE_ROOM' }); }}
            onJoin={(name, roomId) => { send({ type:'SET_NAME', name }); send({ type:'JOIN_ROOM', roomId }); }} />
    );
  }
  if (state.phase === 'GAME_OVER') {
    const winner = state.players.reduce((a,b) => (a.souls > b.souls ? a : b));
    return <div style={{ padding:16 }}><h1>Game Over</h1><p>Winner: {winner.name} ({winner.souls} souls)</p><p>{state.players.map(p=>`${p.name}: ${p.souls} souls, ${p.wounds} wounds`).join(' · ')}</p></div>;
  }
  return (
    <div style={{ padding: 16 }}>
      <h1>Boss Monster — {state.roomId}</h1>
      <p>Phase: {state.phase} · Players: {state.players.map(p=>p.name||p.id).join(', ')}</p>
      <DungeonCanvas slots={state.players[0]?.dungeon || []} />
      {state.heroes.length > 0 && <p>Heroes in play: {state.heroes.map(h=>`${h.name}(${h.hp}/${h.maxHp})`).join(', ')}</p>}
      <button onClick={() => { const c = botChooseCard(hand); if (c) { send({ type:'PLAY', cardUid: c.uid, cardName: c.name, treasure: c.treasure, damage: c.damage }); setHand(h => h.filter(x=>x.uid!==c.uid)); } }}>Bot Play</button>
      <CardHandSimple cards={hand} onPlay={(uid) => { const c = hand.find(x=>x.uid===uid); send({ type:'PLAY', cardUid: uid, cardName: c?.name, treasure: c?.treasure, damage: c?.damage }); setHand(h => h.filter(c=>c.uid!==uid)); }} />
    </div>
  );
}
