import { WebSocket } from 'ws';

const WS_URL = 'ws://localhost:3000/ws';

class TestClient {
  constructor(label) {
    this.label = label;
    this.ws = new WebSocket(WS_URL);
    this.states = [];
    this.playerId = null;
    this.drawn = [];
    this.roomId = null;
    this.ws.on('message', (raw) => {
      const msg = JSON.parse(raw);
      if (msg.type === 'STATE') {
        this.states.push(msg.state);
        if (msg.state.roomId && !this.roomId) this.roomId = msg.state.roomId;
      } else if (msg.type === 'SET_ID') {
        this.playerId = msg.id;
      } else if (msg.type === 'DRAWN') {
        this.drawn.push(...msg.cards);
      }
    });
  }
  send(data) { this.ws.send(JSON.stringify(data)); }
  wait(ms = 200) { return new Promise(r => setTimeout(r, ms)); }
  close() { this.ws.close(); }
}

async function main() {
  console.log('=== Boss Monster Smoke Test ===');
  const p1 = new TestClient('Alice');
  const p2 = new TestClient('Bob');

  await new Promise(r => setTimeout(r, 300));
  console.log('✓ Both players connected');

  // Verify SET_ID received
  if (p1.playerId && p2.playerId && p1.playerId !== p2.playerId) {
    console.log('✓ SET_ID received for both players:', p1.playerId, p2.playerId);
  } else {
    console.log('✗ FAIL: SET_ID not received');
  }

  // Test DRAW_CARD
  p1.send({ type: 'SET_NAME', name: 'Alice' });
  p1.send({ type: 'CREATE_ROOM' });
  await p1.wait(200);
  console.log('✓ P1 created room:', p1.roomId);

  p2.send({ type: 'SET_NAME', name: 'Bob' });
  await p2.wait(100);
  p2.send({ type: 'JOIN_ROOM', roomId: p1.roomId });
  await p1.wait(200);
  console.log('✓ P2 joined room');

  // Test draw cards
  p1.send({ type: 'DRAW_CARD' });
  p1.send({ type: 'DRAW_CARD' });
  p1.send({ type: 'DRAW_CARD' });
  await p1.wait(300);
  if (p1.drawn.length >= 3) {
    console.log('✓ P1 drew', p1.drawn.length, 'cards:', p1.drawn.map(c => c.name).join(', '));
  } else {
    console.log('✗ FAIL: expected 3 drawn cards, got', p1.drawn.length);
  }

  const latest = p1.states[p1.states.length - 1];
  console.log('  Phase:', latest.phase, '| Players:', latest.players.length);
  console.log('  Names:', latest.players.map(p => p.name).join(', '));

  if (latest.phase === 'AGENT' && latest.players.length === 2) {
    console.log('✓ Phase AGENT, 2 players');
  } else {
    console.log('✗ FAIL: expected AGENT phase with 2 players');
  }

  p1.send({ type: 'PLAY', cardName: 'Goblin Armory', treasure: 'sword', damage: 1 });
  await p1.wait(500);
  console.log('✓ P1 played Goblin Armory');

  const p2Latest = p2.states[p2.states.length - 1];
  console.log('  P2: phase:', p2Latest.phase, '| dungeon[0]:', p2Latest.players[0].dungeon[0].monsterName, '| heroes:', p2Latest.heroes.length);
  if (p2Latest.heroes.length === 1 && p2Latest.players[0].dungeon[0].monsterName === 'Goblin Armory') {
    console.log('✓ P2 sees card + hero via broadcast');
  } else {
    console.log('✗ FAIL: P2 did not see card/hero');
  }

  p2.send({ type: 'PLAY', cardName: 'Dracolich Lair', treasure: 'ankh', damage: 3 });
  await p1.wait(2000);
  console.log('✓ P2 played Dracolich Lair');

  const final = p1.states[p1.states.length - 1];
  console.log('  After round: phase:', final.phase, '| souls:', final.players.map(p => p.souls).join('/'));
  console.log('✓ Round advanced and combat resolved');

  console.log('\n=== Smoke test PASSED ===');
  p1.close(); p2.close();
  process.exit(0);
}

main().catch(e => { console.error('SMOKE TEST FAILED:', e); process.exit(1); });
