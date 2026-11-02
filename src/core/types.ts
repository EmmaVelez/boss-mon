import type { Card } from '../data/cards';

export type Phase = 'LOBBY' | 'DISCARD' | 'AGENT' | 'REVEAL' | 'DUNGEON' | 'ROUND_END' | 'GAME_OVER';

export interface Currency { gold?: number; mana?: number; food?: number; }

export interface RoomSlot {
  index: number;
  cardUid?: string;
  monsterId?: string;
  monsterName?: string;
  hp?: number;
  maxHp?: number;
  treasure?: 'sword' | 'book' | 'ankh' | 'coin';
}

export interface Hero {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  treasure: 'sword' | 'book' | 'ankh' | 'coin';
  damage: number;
}

export interface PlayerPublic {
  id: string;
  name: string;
  souls: number;
  wounds: number;
  dungeon: RoomSlot[];
  boss?: { name: string; treasure: string; xp: number };
}

export interface PublicState {
  roomId: string;
  phase: Phase;
  players: PlayerPublic[];
  heroes: Hero[];
}

export interface ClientMessage {
  type: 'SET_NAME' | 'CREATE_ROOM' | 'JOIN_ROOM' | 'PLAY' | 'PASS' | 'DRAW_CARD';
  name?: string;
  roomId?: string;
  cardUid?: string;
  spaceId?: string;
}

export interface ServerMessage {
  type: 'STATE' | 'ERROR' | 'SET_ID' | 'DRAWN';
  state?: PublicState;
  phase?: Phase;
  message?: string;
  id?: string;
  cards?: Card[];
}
