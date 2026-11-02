import React, { useState } from 'react';

export function Lobby({ onCreate, onJoin }: { onCreate: (name: string) => void; onJoin: (name: string, roomId: string) => void }) {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const trimmedName = name.trim() || 'Player';
  const trimmedRoom = room.trim();
  return (
    <div style={{ padding: 16, maxWidth: 420 }}>
      <h1>Boss Monster — Lobby</h1>
      <p style={{ fontSize: 12, opacity: 0.7 }}>Enter your name, then create a room or join with a code.</p>
      <div style={{ marginBottom: 12 }}>
        <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={{ marginRight: 8, padding: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => onCreate(trimmedName)}>Create Room</button>
      </div>
      <div style={{ borderTop: '1px solid #333', paddingTop: 12 }}>
        <input placeholder="Room code" value={room} onChange={e => setRoom(e.target.value)} style={{ marginRight: 8, padding: 6 }} />
        <button onClick={() => onJoin(trimmedName, trimmedRoom)} disabled={!trimmedRoom}>Join Room</button>
      </div>
    </div>
  );
}
