import { CARDS, drawCard } from '../data/cards';
import type { Card } from '../data/cards';

export function botChooseCard(hand: Card[]): Card | null {
  if (hand.length === 0) return null;
  // Prefer highest damage; tie-break by rarity order
  const rarityRank: Record<string, number> = { common:0, uncommon:1, rare:2, legendary:3 };
  return [...hand].sort((a,b) => b.damage - a.damage || rarityRank[b.rarity]-rarityRank[a.rarity])[0];
}

export function botShouldPlay(hand: Card[]): boolean {
  return hand.length > 0;
}
