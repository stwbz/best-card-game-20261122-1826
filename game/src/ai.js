// Cinder, the rival: a readable opponent whose choices you can counter.
// Each turn it plays the best card it can afford, in order, until it runs out
// of energy or cards worth playing. Its rules, in priority order:
//   1. take the win when it can deal lethal damage this turn;
//   2. guard when it is low on health and holds a guard;
//   3. play the card that deals the most damage per energy, chaining
//      elements when the chain is open; draw and energy cards come first
//      so the rest of the turn can use them.

import { cardById } from './cards.js';

/** Damage this card would deal right now, chain bonus included. */
function cardDamage(duelist, card) {
  if (!card.damage) return 0;
  const bonus = duelist.lastElement === card.element ? 1 : 0;
  return card.damage + bonus;
}

/** Score a card for the rival: the higher, the sooner it is played. */
function scoreCard(duelist, target, card) {
  if (card.cost > duelist.energy) return -1;
  if (card.kind === 'heal') {
    // Mend only when hurt, and more the lower the health.
    if (duelist.hp >= duelist.maxHp - 2) return -1;
    return 40 + (duelist.maxHp - duelist.hp) * 2;
  }
  if (card.kind === 'guard') {
    // Guard only when low, or when the player is about to hit hard.
    if (duelist.hp > 8) return -1;
    return 60 + (card.shield || 0);
  }
  if (card.draw || card.energy) return 55;
  return cardDamage(duelist, card) * 10 + (card.cost === 0 ? 5 : 0);
}

/**
 * Choose the rival's next play: the best hand index to play now, or -1 when
 * nothing is worth playing. The caller plays it, then asks again, so the
 * choice is always made against the live hand — indexes never go stale.
 */
export function chooseAiPlay(match) {
  const duelist = match.rival;
  const target = match.you;
  let bestIndex = -1;
  let bestScore = -1;
  for (let i = 0; i < duelist.hand.length; i += 1) {
    const card = cardById(duelist.hand[i]);
    if (card === null) continue;
    // Lethal first: any card that ends the match outranks everything.
    if (card.damage && cardDamage(duelist, card) >= target.hp + target.shield) return i;
    const score = scoreCard(duelist, target, card);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex;
}
