import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PlayerState = new Map();
const Rooms = new Map();
const Phases = { LOBBY:'LOBBY', DISCARD:'DISCARD', AGENT:'AGENT', REVEAL:'REVEAL', DUNGEON:'DUNGEON', ROUND_END:'ROUND_END', GAME_OVER:'GAME_OVER' };

let nextId = 1;
const uid = () => 'p' + (nextId++);

function findWs(pid) { for (const [ws, ps] of PlayerState) if (ps.id === pid) return ws; return null; }

function publicState(room) {
  return {
    roomId: room.id,
    phase: room.phase,
    heroes: room.heroes || [],
    players: room.players.map(pid => {
      const ps = PlayerState.get(findWs(pid));
      const p = room.playerData?.[pid] || { souls:0, wounds:0, dungeon: Array.from({length:5}, (_,i)=>({index:i})) };
      return { id: pid, name: ps?.name || pid, souls: p.souls, wounds: p.wounds, dungeon: p.dungeon };
    }),
  };
}

// Card data for the server-side deck (mirrors src/data/cards.ts)
const CARDS = [
  { name:'Dark Altar', rarity:'common', treasure:'ankh', damage:1, type:'room' },
  { name:'Open Grave', rarity:'common', treasure:'ankh', damage:2, type:'room' },
  { name:"Specter's Sanctum", rarity:'common', treasure:'ankh', damage:2, type:'room' },
  { name:'Succubus Spa', rarity:'common', treasure:'ankh', damage:1, type:'room' },
  { name:'Dracolich Lair', rarity:'rare', treasure:'ankh', damage:3, type:'room' },
  { name:'Vampire Bordello', rarity:'rare', treasure:'ankh', damage:3, type:'room' },
  { name:'Goblin Armory', rarity:'common', treasure:'sword', damage:1, type:'room' },
  { name:'Golem Factory', rarity:'common', treasure:'sword', damage:2, type:'room' },
  { name:"Minotaur's Maze", rarity:'common', treasure:'sword', damage:0, type:'room' },
  { name:'Neanderthal Cave', rarity:'uncommon', treasure:'sword', damage:3, type:'room' },
  { name:'Beast Menagerie', rarity:'rare', treasure:'sword', damage:4, type:'room' },
  { name:'Brainsucker Hive', rarity:'common', treasure:'book', damage:2, type:'room' },
  { name:'Dark Laboratory', rarity:'common', treasure:'book', damage:1, type:'room' },
  { name:'Haunted Library', rarity:'common', treasure:'book', damage:1, type:'room' },
  { name:"Witch's Kitchen", rarity:'common', treasure:'book', damage:1, type:'room' },
  { name:'All-Seeing Eye', rarity:'rare', treasure:'book', damage:3, type:'room' },
  { name:"Liger's Den", rarity:'rare', treasure:'book', damage:2, type:'room' },
  { name:'Bottomless Pit', rarity:'common', treasure:'coin', damage:1, type:'room' },
  { name:'Boulder Ramp', rarity:'common', treasure:'coin', damage:1, type:'room' },
  { name:'Dizzygas Hallway', rarity:'common', treasure:'coin', damage:1, type:'room' },
  { name:'Fireball', rarity:'common', treasure:'coin', damage:0, type:'spell' },
  { name:'Lightning Bolt', rarity:'common', treasure:'coin', damage:0, type:'spell' },
  { name:'Polymorph', rarity:'uncommon', treasure:'coin', damage:0, type:'spell' },
  { name:'Disintegrate', rarity:'rare', treasure:'coin', damage:0, type:'spell' },
];

let cardCounter = 0;
function makeDeck() {
  const deck = [];
  for (const c of CARDS) { deck.push({ ...c }); deck.push({ ...c }); }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function drawCard(room) {
  if (!room.deck || !room.deck.length) {
    room.deck = makeDeck();
    room.discard = [];
  }
  const card = room.deck.pop();
  if (card) card.uid = 'c' + (++cardCounter);
  return card;
}

function broadcast(room) {
  const msg = JSON.stringify({ type: 'STATE', state: publicState(room), phase: room.phase });
  for (const [ws, ps] of PlayerState) {
    if (ps.roomId === room.id && ws.readyState === 1) ws.send(msg);
  }
}

function resolveDungeon(room) {
  for (const hero of (room.heroes || [])) {
    // find a player dungeon with matching treasure
    let targetPlayer = null, targetSlot = null;
    for (const pid of room.players) {
      const pd = room.playerData[pid];
      const slot = pd.dungeon.find(s => s.monsterName && s.treasure === hero.treasure);
      if (slot) { targetPlayer = pid; targetSlot = slot; break; }
    }
    if (targetSlot) {
      targetSlot.hp = (targetSlot.hp || 0) - hero.damage;
      hero.hp -= 1; // room deals 1 damage
      if (targetSlot.hp <= 0) {
        targetSlot.monsterName = undefined; targetSlot.hp = 0;
        const pd = room.playerData[targetPlayer];
        pd.souls = (pd.souls || 0) + 1;
      }
    } else {
      // no matching room: hero wounds the first player
      const pid = room.players[0];
      if (pid && room.playerData[pid]) room.playerData[pid].wounds = (room.playerData[pid].wounds || 0) + 1;
    }
    if (hero.hp <= 0) {
      // hero defeated by room damage already counted via soul above if monster died; else wound already? keep simple
    }
  }
  // win check
  for (const pid of room.players) {
    const pd = room.playerData[pid];
    if (pd.souls >= 10) room.phase = Phases.GAME_OVER;
    if (pd.wounds >= 5) room.phase = Phases.GAME_OVER;
  }
}
function scheduleBotIfNeeded(room) {
  if (!room || room.phase !== Phases.AGENT) return;
  const nextPid = room.players[room.acted];
  if (!nextPid || !room.playerData?.[nextPid]?.isBot) return;
  setTimeout(() => {
    if (room.phase !== Phases.AGENT) return;
    const pd = room.playerData[nextPid];
    const slot = pd.dungeon.find(s => !s.monsterName);
    if (slot) {
      const card = CARDS[Math.floor(Math.random() * CARDS.length)];
      slot.monsterName = card.name;
      slot.hp = 5; slot.maxHp = 5; slot.treasure = card.treasure;
      room.heroes = room.heroes || [];
      room.heroes.push({ id: 'h' + (room.heroes.length + 1), name: 'Hero', hp: 3, maxHp: 3, treasure: card.treasure, damage: card.damage || 1 });
    }
    broadcast(room);
    advanceRound(room);
    scheduleBotIfNeeded(room);
  }, 600);
}
function advanceRound(room) {
  room.acted = (room.acted || 0) + 1;
  if (room.acted >= room.players.length) {
    room.acted = 0;
    room.phase = Phases.REVEAL; broadcast(room);
    setTimeout(() => { resolveDungeon(room); room.phase = Phases.DUNGEON; broadcast(room); }, 600);
    setTimeout(() => { room.phase = Phases.ROUND_END; broadcast(room); }, 1200);
    setTimeout(() => { room.drawnThisRound = new Set(); room.phase = Phases.AGENT; broadcast(room); }, 1800);
  } else {
    broadcast(room);
  }
}

app.get('/health', (_req, res) => res.status(200).send('ok'));
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'build', 'index.html')));

wss.on('connection', (ws) => {
  const id = uid();
  PlayerState.set(ws, { id, name: null, roomId: null });
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.send(JSON.stringify({ type: 'SET_ID', id }));

  ws.on('message', (raw) => {
    let data; try { data = JSON.parse(raw); } catch { return; }
    const ps = PlayerState.get(ws);
    if (!ps) return;
    switch (data.type) {
      case 'SET_NAME':
        ps.name = String(data.name || '').slice(0, 20) || ps.id;
        break;
      case 'CREATE_ROOM': {
        const roomId = Math.random().toString(36).slice(2, 11);
        const room = { id: roomId, players: [ps.id], phase: Phases.LOBBY, playerData: {}, heroes: [], acted: 0, deck: null, discard: [] };
        room.playerData[ps.id] = { souls:0, wounds:0, dungeon: Array.from({length:5}, (_,i)=>({index:i})) };
        Rooms.set(roomId, room);
        ps.roomId = roomId;
        ws.send(JSON.stringify({ type: 'STATE', state: publicState(room), phase: room.phase }));
        break;
      }
      case 'JOIN_ROOM': {
        const room = Rooms.get(data.roomId);
        if (!room) { ws.send(JSON.stringify({ type:'ERROR', message:'room not found' })); break; }
        if (room.players.length >= 4) { ws.send(JSON.stringify({ type:'ERROR', message:'room full' })); break; }
        if (!room.players.includes(ps.id)) room.players.push(ps.id);
        if (!room.playerData[ps.id]) room.playerData[ps.id] = { souls:0, wounds:0, dungeon: Array.from({length:5}, (_,i)=>({index:i})) };
        ps.roomId = room.id;
        if (room.players.length >= 2 && room.phase === Phases.LOBBY) {
          room.phase = Phases.DISCARD;
          room.discarded = [];
          broadcast(room);
          for (const pid of room.players) {
            if (room.playerData[pid]?.isBot) {
              setTimeout(() => { if (room.phase === Phases.DISCARD) { room.discarded = room.discarded || []; if (!room.discarded.includes(pid)) room.discarded.push(pid); if (room.discarded.length >= room.players.length) { room.drawnThisRound = new Set(); room.phase = Phases.AGENT; broadcast(room); scheduleBotIfNeeded(room); } else broadcast(room); } }, 800);
            }
          }
        } else broadcast(room);
        break;
      }
      case 'PLAY': {
        if (ps.roomId) {
          const r = Rooms.get(ps.roomId);
          if (r && r.playerData[ps.id]) {
            const pd = r.playerData[ps.id];
            const slot = pd.dungeon.find((s) => !s.monsterName);
            if (slot) {
              slot.monsterName = data.cardName || 'Monster';
              slot.hp = 5; slot.maxHp = 5; slot.treasure = data.treasure || 'coin';
              r.heroes = r.heroes || [];
              r.heroes.push({ id: 'h' + (r.heroes.length+1), name: 'Hero', hp: 3, maxHp: 3, treasure: data.treasure || 'coin', damage: data.damage || 1 });
            }
            broadcast(r);
          }
          const r2 = Rooms.get(ps.roomId);
          if (r2) { advanceRound(r2); scheduleBotIfNeeded(r2); }
        }
        break;
      }
      case 'PASS': {
        if (ps.roomId) {
          const r = Rooms.get(ps.roomId);
          if (r) { advanceRound(r); scheduleBotIfNeeded(r); }
        }
        break;
      }
      case 'ADD_BOT': {
        if (ps.roomId) {
          const r = Rooms.get(ps.roomId);
          if (r && r.phase === Phases.LOBBY && r.players.length < 4) {
            const botId = 'bot' + (r.players.length + 1);
            r.players.push(botId);
            r.playerData[botId] = { souls:0, wounds:0, dungeon: Array.from({length:5}, (_,i)=>({index:i})), isBot:true };
            if (!r.bots) r.bots = [];
            r.bots.push(botId);
            broadcast(r);
          }
        }
        break;
      }
      case 'START_GAME': {
        if (ps.roomId) {
          const r = Rooms.get(ps.roomId);
          if (r && r.phase === Phases.LOBBY && r.players.length >= 2) {
            r.phase = Phases.DISCARD;
            r.discarded = [];
            broadcast(r);
            // auto-discard for bots
            for (const pid of r.players) {
              if (r.playerData[pid]?.isBot) {
                setTimeout(() => { if (r.phase === Phases.DISCARD) { r.discarded = r.discarded || []; if (!r.discarded.includes(pid)) r.discarded.push(pid); if (r.discarded.length >= r.players.length) { r.phase = Phases.AGENT; broadcast(r); scheduleBotIfNeeded(r); } else broadcast(r); } }, 800);
              }
            }
          }
        }
        break;
      }
      case 'DISCARD_DONE': {
        if (ps.roomId) {
          const r = Rooms.get(ps.roomId);
          if (r && r.phase === Phases.DISCARD) {
            r.discarded = r.discarded || [];
            if (!r.discarded.includes(ps.id)) r.discarded.push(ps.id);
            if (r.discarded.length >= r.players.length) {
              r.drawnThisRound = new Set();
              r.phase = Phases.AGENT; broadcast(r); scheduleBotIfNeeded(r);
            } else broadcast(r);
          }
        }
        break;
      }
      case 'DRAW_CARD': {
        if (ps.roomId) {
          const r = Rooms.get(ps.roomId);
          if (r) {
            if (r.phase === Phases.AGENT) {
              r.drawnThisRound = r.drawnThisRound || new Set();
              if (r.drawnThisRound.has(ps.id)) break;
              r.drawnThisRound.add(ps.id);
            }
            const card = drawCard(r);
            if (card) ws.send(JSON.stringify({ type: 'DRAWN', cards: [card] }));
          }
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    const ps = PlayerState.get(ws);
    if (ps?.roomId) {
      const room = Rooms.get(ps.roomId);
      if (room) {
        room.players = room.players.filter(p => p !== ps.id);
        if (room.players.length === 0) Rooms.delete(room.id);
        else broadcast(room);
      }
    }
    PlayerState.delete(ws);
  });
});

const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

server.listen(PORT, () => console.log(`Boss Monster server on ${PORT}`));
process.on('SIGTERM', () => { clearInterval(heartbeat); server.close(); });
