import React, { memo } from 'react';
import type { Card } from '../data/cards';
import { RARITY_COLOR } from '../data/cards';

export const CardHandSimple = memo(function CardHandSimple({ cards, onPlay }: { cards: Card[]; onPlay?: (uid: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 8 }}>
      {cards.map(c => (
        <button key={c.uid} onClick={() => onPlay?.(c.uid)}
          style={{ border: `2px solid ${RARITY_COLOR[c.rarity]}`, borderRadius: 8, padding: 8, background: '#111', color: '#fff', minWidth: 100 }}>
          <div style={{ fontWeight: 700 }}>{c.name}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{c.treasure} · dmg {c.damage}</div>
          <div style={{ fontSize: 11, color: RARITY_COLOR[c.rarity] }}>{c.rarity}</div>
        </button>
      ))}
    </div>
  );
});
