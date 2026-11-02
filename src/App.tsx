import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import type { Card } from './data/cards';
import { CardHandSimple } from './components/CardHandSimple';
import { DungeonCanvas } from './components/DungeonCanvas';
import { botChooseCard } from './ai/bot';
import { Lobby } from './components/Lobby';

export default function App() {
  const { state, connected, send, playerId, drawCard: requestDraw } = useWebSocket(
    useCallback((cards: Card[]) => {
      setHand(h => [...h, ...cards]);
    }, [])
  );
  const [hand, setHand] = useState<Card[]>([]);
  const [started, setStarted] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [discardSel, setDiscardSel] = useState<string[]>([]);

  // Request opening hand from server once in a room
  useEffect(() => {
    if (!state || started) return;
    setStarted(true);
    for (let i = 0; i < 7; i++) requestDraw();
  }, [state, started, requestDraw]);

  // Auto-play: when enabled, play best card automatically in AGENT phase
  useEffect(() => {
    if (!autoPlay || state?.phase !== 'AGENT' || hand.length === 0) return;
    const c = botChooseCard(hand);
    if (c) {
      send({ type: 'PLAY', cardUid: c.uid, cardName: c.name, treasure: c.treasure, damage: c.damage });
      setHand(h => h.filter(x => x.uid !== c.uid));
    }
  }, [autoPlay, state?.phase, hand, send]);
  if (!state) {
    return (
      <Lobby onCreate={(name) => { send({ type:'SET_NAME', name }); send({ type:'CREATE_ROOM' }); }}
            onJoin={(name, roomId) => { send({ type:'SET_NAME', name }); send({ type:'JOIN_ROOM', roomId }); }} />
    );
  }
  if (state.phase === 'LOBBY') {
    return (
      <div style={{ padding: 16 }}>
        <h1>Boss Monster — Room {state.roomId}</h1>
        <p style={{ fontSize: 12, opacity: 0.7 }}>Players: {state.players.map(p => p.name || p.id).join(', ')}</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={() => send({ type: 'ADD_BOT' })} disabled={state.players.length >= 4}>Add Bot</button>
          <button onClick={() => send({ type: 'START_GAME' })} disabled={state.players.length < 2}>Start Game</button>
        </div>
      </div>
    );
  }
  if (state.phase === 'DISCARD') {
    return (
      <div style={{ padding: 16 }}>
        <h1>Discard 2 cards</h1>
        <p style={{ fontSize: 12, opacity: 0.7 }}>Select {2 - discardSel.length} more to discard.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {hand.map(c => (
            <button key={c.uid} onClick={() => setDiscardSel(s => s.includes(c.uid) ? s.filter(x=>x!==c.uid) : (s.length<2 ? [...s,c.uid] : s))} style={{ padding:8, border: discardSel.includes(c.uid)?'2px solid #ef4444':'1px solid #444', borderRadius:8, background:'transparent', color:'inherit' }}>
              {c.name}
            </button>
          ))}
        </div>
        <button disabled={discardSel.length !== 2} onClick={() => { setHand(h => h.filter(c => !discardSel.includes(c.uid))); setDiscardSel([]); send({ type: 'DISCARD_DONE' }); }}>Confirm Discard</button>
      </div>
    );
  }
  if (state.phase === 'GAME_OVER') {
    const winner = state.players.reduce((a,b) => (a.souls > b.souls ? a : b));
    return <div style={{ padding:16 }}><h1>Game Over</h1><p>Winner: {winner.name} ({winner.souls} souls)</p><p>{state.players.map(p=>`${p.name}: ${p.souls} souls, ${p.wounds} wounds`).join(' · ')}</p></div>;
  }

  const me = state.players.find(p => p.id === playerId) || state.players[0];
  const others = state.players.filter(p => p.id !== playerId);

  return (
    <div style={{ padding: 16 }}>
      <h1>Boss Monster — Room {state.roomId}</h1>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <button onClick={() => navigator.clipboard?.writeText(state.roomId)}>Copy Room Code</button>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Phase: {state.phase}</span>
      </div>
      <p style={{ fontSize: 12, opacity: 0.7 }}>Players: {state.players.map(p=>`${p.name||p.id} (${p.souls}s/${p.wounds}w)`).join(' · ')}</p>

      {/* Town / decks */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {['Epic Heroes','Heroes','Room Deck','Discard','Spell Deck'].map(d => (
          <div key={d} style={{ border:'1px solid #444', borderRadius:8, padding:8, minWidth:70, textAlign:'center', fontSize:11 }}>
            <div style={{ opacity:0.7 }}>{d}</div>
            <div style={{ fontWeight:600, marginTop:4 }}>Deck</div>
          </div>
        ))}
        <div style={{ border:'1px solid #444', borderRadius:8, padding:8, minWidth:120, fontSize:11 }}>
          <div style={{ opacity:0.7 }}>Revealed Heroes</div>
          <div style={{ marginTop:4 }}>{state.heroes.map(h=>h.name).join(', ') || '—'}</div>
        </div>
        <div style={{ border:'1px solid #444', borderRadius:8, padding:8, minWidth:90, fontSize:11 }}>
          <div style={{ opacity:0.7 }}>Souls / Wounds</div>
          <div style={{ marginTop:4 }}>{me.souls} / {me.wounds}</div>
        </div>
      </div>
      {others.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {others.map(p => (
            <div key={p.id} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name} — {p.souls} souls, {p.wounds} wounds</div>
            <DungeonCanvas slots={p.dungeon} heroes={state.heroes} width={400} height={80} phase={state.phase} />
            </div>
          ))}
        </div>
      )}

      {/* My dungeon */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{me.name} (YOU) — {me.souls} souls, {me.wounds} wounds</div>
        <DungeonCanvas slots={me.dungeon} heroes={state.heroes} phase={state.phase} />
      </div>

      {state.heroes.length > 0 && state.phase === 'DUNGEON' && <p style={{ fontSize: 12, opacity: 0.8 }}>Combat resolving — heroes attacking dungeons...</p>}

      {state.phase !== 'AGENT' && (
        <p style={{ fontSize: 14, color: '#fbbf24', margin: '8px 0' }}>
          {state.phase === 'REVEAL' && 'Revealing heroes...'}
          {state.phase === 'DUNGEON' && 'Heroes are attacking!'}
          {state.phase === 'ROUND_END' && 'Round ending...'}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <button onClick={() => requestDraw()} disabled={state.phase !== 'AGENT'}>Draw Card</button>
        <button onClick={() => { const c = botChooseCard(hand); if (c) { send({ type:'PLAY', cardUid: c.uid, cardName: c.name, treasure: c.treasure, damage: c.damage }); setHand(h => h.filter(x=>x.uid!==c.uid)); } }} disabled={state.phase !== 'AGENT' || hand.length === 0}>Bot Play</button>
        <button onClick={() => setAutoPlay(a => !a)}>{autoPlay ? 'Auto: ON' : 'Auto: OFF'}</button>
      </div>

      <CardHandSimple cards={hand} disabled={state.phase !== 'AGENT'} onPlay={(uid) => { const c = hand.find(x=>x.uid===uid); send({ type:'PLAY', cardUid: uid, cardName: c?.name, treasure: c?.treasure, damage: c?.damage }); setHand(h => h.filter(c=>c.uid!==uid)); }} />
    </div>
  );
}
