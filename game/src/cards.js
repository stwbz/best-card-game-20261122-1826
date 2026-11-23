// The deck: build it from the card list, shuffle it with a seeded random
// source, and draw from it. When the draw pile runs out the discard pile is
// shuffled back in, so a match never stalls for want of cards.

import { CARDS, MATCH } from './config.js';

/** Look a card up by id; returns the shared definition (never mutated). */
export function cardById(id) {
  for (let i = 0; i < CARDS.length; i += 1) {
    if (CARDS[i].id === id) return CARDS[i];
  }
  return null;
}

/** A fresh deck: every card twice, in list order (shuffled by the caller). */
export function buildDeck() {
  const deck = [];
  for (let copy = 0; copy < MATCH.deckCopies; copy += 1) {
    for (let i = 0; i < CARDS.length; i += 1) deck.push(CARDS[i].id);
  }
  return deck;
}

/** Fisher-Yates, driven by the given random function (seeded for replays). */
export function shuffleDeck(deck, random) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const held = deck[i];
    deck[i] = deck[j];
    deck[j] = held;
  }
  return deck;
}

/**
 * Draw `count` cards from `pile` into `hand`. When the pile runs out, the
 * discard is shuffled back in first. Returns how many were actually drawn.
 */
export function drawCards(hand, pile, discard, count, random) {
  let drawn = 0;
  for (let n = 0; n < count; n += 1) {
    if (hand.length >= MATCH.maxHand) break;
    if (pile.length === 0) {
      if (discard.length === 0) break;
      while (discard.length > 0) pile.push(discard.pop());
      shuffleDeck(pile, random);
    }
    hand.push(pile.pop());
    drawn += 1;
  }
  return drawn;
}

/** A tiny seeded random source (mulberry32): the same seed, the same match. */
export function createRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
