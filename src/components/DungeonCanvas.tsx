import React, { useRef, useEffect } from 'react';

interface Slot { id?: string; monster?: string; hp?: number; maxHp?: number; }

export function DungeonCanvas({ slots = [], width = 500, height = 120 }: { slots?: Slot[]; width?: number; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#0b0b0b'; ctx.fillRect(0, 0, width, height);
    const n = 5; const w = width / n;
    for (let i = 0; i < n; i++) {
      const x = i * w;
      ctx.strokeStyle = '#444'; ctx.strokeRect(x + 4, 8, w - 8, height - 16);
      const s = slots[i] as any;
      if (s?.monsterName || s?.monster) {
        const name = s.monsterName || s.monster;
        ctx.fillStyle = '#7c3aed'; ctx.fillRect(x + 8, 12, w - 16, height - 40);
        ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.fillText(name, x + 10, 30);
        const hp = s.hp ?? 0, max = s.maxHp ?? 1;
        ctx.fillStyle = '#333'; ctx.fillRect(x + 8, height - 24, w - 16, 10);
        ctx.fillStyle = '#ef4444'; ctx.fillRect(x + 8, height - 24, (w - 16) * (hp / max), 10);
        ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.fillText(`${hp}/${max}`, x + 10, height - 16);
      } else {
        ctx.fillStyle = '#555'; ctx.font = '11px sans-serif'; ctx.fillText('empty', x + 12, height / 2);
      }
    }
  }, [slots, width, height]);
  return <canvas ref={ref} width={width} height={height} style={{ border: '1px solid #333', borderRadius: 8 }} />;
}
