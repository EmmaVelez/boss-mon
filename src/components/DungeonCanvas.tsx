import React, { useRef, useEffect, useState } from 'react';
import type { Hero, RoomSlot } from '../core/types';

interface Slot extends RoomSlot {}

export function DungeonCanvas({ slots = [], heroes = [], width = 500, height = 160, phase = '', boss }: {
  slots?: Slot[];
  heroes?: Hero[];
  width?: number;
  height?: number;
  phase?: string;
  boss?: { name: string; treasure: string; xp: number; ability: string };
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (phase !== 'DUNGEON') { progressRef.current = 0; return; }
    let start: number | null = null;
    let raf = 0;
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / 600);
      progressRef.current = p;
      setTick(x => x + 1);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase]);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const n = 6; // 5 rooms + boss
    const heroRowTop = 8;
    const slotAreaTop = 50;
    const slotAreaHeight = height - slotAreaTop - 8;
    const w = width / n;

    // Clear
    ctx.fillStyle = '#0b0b0b'; ctx.fillRect(0, 0, width, height);
    ctx.textAlign = 'left';

    // Draw heroes above the dungeon row
    if (heroes.length > 0) {
      ctx.font = 'bold 11px sans-serif';
      heroes.forEach((hero, i) => { {
        const baseX = (i + 0.5) * (width / heroes.length);
        const targetIdx = slots.findIndex(s => s.treasure === hero.treasure && s.monsterName);
        const targetX = targetIdx >= 0 ? (targetIdx * w + w / 2) : (width / 2);
        const targetY = slotAreaTop + slotAreaHeight / 2;
        const p = progressRef.current;
        const x = baseX + (targetX - baseX) * p;
        const y = 22 + (targetY - 22) * p;
        const r = 12 * (1 - p * 0.4);
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Hero initials
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(hero.name.substring(0, 2).toUpperCase(), x, y + 3);

        // HP bar below hero
        const hp = hero.hp, max = hero.maxHp;
        ctx.fillStyle = '#333';
        ctx.fillRect(x - 12, 38, 24, 8);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x - 12, 38, 24 * (hp / max), 8);
        ctx.fillStyle = '#fff';
        ctx.font = '9px sans-serif';
        ctx.fillText(`${hp}/${max}`, x - 6, 45);
        ctx.textAlign = 'left';

        // Arrow from hero to matching dungeon slot (same treasure type)
        ctx.strokeStyle = targetIdx >= 0 ? '#fbbf24' : '#ef4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, y + 4);
        ctx.lineTo(targetIdx >= 0 ? (targetIdx * w + w / 2) : (width / 2), slotAreaTop + 12);
        ctx.stroke();
        ctx.setLineDash([]);
      }});
    }

    // Draw dungeon slots
    for (let i = 0; i < n; i++) {
      const x = i * w;
      const y = slotAreaTop;
      const isBoss = i === n - 1;
      ctx.strokeStyle = '#444'; ctx.strokeRect(x + 4, y, w - 8, slotAreaHeight);
      if (isBoss) {
        const emoji = boss?.treasure === 'sword' ? '⚔️' : boss?.treasure === 'book' ? '📖' : boss?.treasure === 'ankh' ? '☥' : '💰';
        const slotW = w - 16;
        ctx.fillStyle = '#7f1d1d'; ctx.fillRect(x + 8, y + 4, slotW, slotAreaHeight - 8);
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        // Name
        let fs = 11;
        ctx.font = `bold ${fs}px sans-serif`;
        while (ctx.measureText((boss?.name || 'BOSS') + ' ' + emoji).width > slotW - 4 && fs > 7) { fs--; ctx.font = `bold ${fs}px sans-serif`; }
        ctx.fillText((boss?.name || 'BOSS') + ' ' + emoji, x + w/2, y + 16);
        // Ability
        ctx.font = '9px sans-serif';
        const ability = boss?.ability || '';
        // wrap
        const words = ability.split(' ');
        let line = '';
        const lines = [];
        for (const wd of words) {
          const test = line ? line + ' ' + wd : wd;
          if (ctx.measureText(test).width > slotW - 4) { if (line) lines.push(line); line = wd; }
          else line = test;
        }
        if (line) lines.push(line);
        let ay = y + 30;
        for (const ln of lines.slice(0, 3)) { ctx.fillText(ln, x + w/2, ay); ay += 11; }
        // XP
        ctx.font = '10px sans-serif';
        ctx.fillText('XP ' + (boss?.xp ?? 0), x + w/2, y + slotAreaHeight - 8);
        ctx.textAlign = 'left';
        continue;
      }
      const s = slots[i] as any;
      if (s?.monsterName || s?.monster) {
        const name = s.monsterName || s.monster;
        ctx.fillStyle = '#7c3aed'; ctx.fillRect(x + 8, y + 4, w - 16, slotAreaHeight - 30);
        ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.fillText(name, x + 10, y + 20);
        const hp = s.hp ?? 0, max = s.maxHp ?? 1;
        ctx.fillStyle = '#333'; ctx.fillRect(x + 8, y + slotAreaHeight - 24, w - 16, 10);
        ctx.fillStyle = '#ef4444'; ctx.fillRect(x + 8, y + slotAreaHeight - 24, (w - 16) * (hp / max), 10);
        ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.fillText(`${hp}/${max}`, x + 10, y + slotAreaHeight - 16);
      } else {
        ctx.fillStyle = '#555'; ctx.font = '11px sans-serif'; ctx.fillText('empty', x + 12, y + slotAreaHeight / 2);
      }
    }

    // Combat flash during DUNGEON phase
    if (phase === 'DUNGEON') {
      ctx.fillStyle = 'rgba(239,68,68,0.15)';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('yellow = lure · red = no match', width - 8, height - 4);
  }, [slots, heroes, width, height, phase, tick]);

  return <canvas ref={ref} width={width} height={height} style={{ border: '1px solid #333', borderRadius: 8 }} />;
}
