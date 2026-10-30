export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export interface Card { uid: string; id: string; name: string; rarity: Rarity; treasure: 'sword' | 'book' | 'ankh' | 'coin'; damage: number; type: 'room' | 'boss' | 'hero' | 'spell'; }

const RARITY_COLOR: Record<Rarity, string> = { common:'#3b82f6', uncommon:'#22c55e', rare:'#eab308', legendary:'#ec4899' };
export { RARITY_COLOR };

// Real Boss Monster room cards (treasure: Cleric->ankh, Fighter->sword, Mage->book, Thief->coin)
export const CARDS: Omit<Card,'uid'>[] = [
  { id:'BMR009', name:'Dark Altar', rarity:'common', treasure:'ankh', damage:1, type:'room' },
  { id:'BMR010', name:'Open Grave', rarity:'common', treasure:'ankh', damage:2, type:'room' },
  { id:'BMR011', name:"Specter's Sanctum", rarity:'common', treasure:'ankh', damage:2, type:'room' },
  { id:'BMR012', name:'Succubus Spa', rarity:'common', treasure:'ankh', damage:1, type:'room' },
  { id:'BMR013', name:'Dracolich Lair', rarity:'rare', treasure:'ankh', damage:3, type:'room' },
  { id:'BMR014', name:'Vampire Bordello', rarity:'rare', treasure:'ankh', damage:3, type:'room' },
  { id:'BMR015', name:'Goblin Armory', rarity:'common', treasure:'sword', damage:1, type:'room' },
  { id:'BMR016', name:'Golem Factory', rarity:'common', treasure:'sword', damage:2, type:'room' },
  { id:'BMR017', name:"Minotaur's Maze", rarity:'common', treasure:'sword', damage:0, type:'room' },
  { id:'BMR018', name:'Neanderthal Cave', rarity:'uncommon', treasure:'sword', damage:3, type:'room' },
  { id:'BMR019', name:'Beast Menagerie', rarity:'rare', treasure:'sword', damage:4, type:'room' },
  { id:'BMR021', name:'Brainsucker Hive', rarity:'common', treasure:'book', damage:2, type:'room' },
  { id:'BMR022', name:'Dark Laboratory', rarity:'common', treasure:'book', damage:1, type:'room' },
  { id:'BMR023', name:'Haunted Library', rarity:'common', treasure:'book', damage:1, type:'room' },
  { id:'BMR024', name:"Witch's Kitchen", rarity:'common', treasure:'book', damage:1, type:'room' },
  { id:'BMR025', name:'All-Seeing Eye', rarity:'rare', treasure:'book', damage:3, type:'room' },
  { id:'BMR026', name:"Liger's Den", rarity:'rare', treasure:'book', damage:2, type:'room' },
  { id:'BMR027', name:'Bottomless Pit', rarity:'common', treasure:'coin', damage:1, type:'room' },
  { id:'BMR028', name:'Boulder Ramp', rarity:'common', treasure:'coin', damage:1, type:'room' },
  { id:'BMR029', name:'Dizzygas Hallway', rarity:'common', treasure:'coin', damage:1, type:'room' },
];

let counter = 0;
export function drawCard(): Card {
  const base = CARDS[Math.floor(Math.random() * CARDS.length)];
  return { ...base, uid: `c${++counter}` };
}
