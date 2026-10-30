import React, { useState } from 'react';

export function Lobby({ onCreate, onJoin }: { onCreate: (name: string) => void; onJoin: (name: string, roomId: string) => void }) {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  return (
    <div style={{ padding: 16 }}>
      <h1>Boss Monster — Lobby</h1>
      <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={{ marginRight: 8 }} />
      <button onClick={() => onCreate(name || 'Player')}>Create Room</button>
      <div style={{ marginTop: 12 }}>
        <input placeholder="Room code" value={room} onChange={e => setRoom(e.target.value)} style={{ marginRight: 8 }} />
        <button onClick={() => onJoin(name || 'Player', room)}>Join Room</button>
      </div>
    </div>
  );
}
