// The match: two duelists, their hands, energy, health and shield, and the
// turn that moves between them. Every rule lives here; the renderer only
// paints what this file says, and the AI only reads it.

import { MATCH } from './config.js';
import { buildDeck, cardById, drawCards, shuffleDeck } from './cards.js';

export const PHASE_TITLE = 'title';
export const PHASE_PLAY = 'play';
export const PHASE_WIN = 'win';
export const PHASE_LOSS = 'loss';

/** One duelist: health, shield, energy, hand, draw pile and discard pile. */
function createDuelist(random) {
  const pile = shuffleDeck(buildDeck(), random);
  const duelist = {
    hp: MATCH.startHp,
    maxHp: MATCH.startHp,
    shield: 0,
    energy: MATCH.startEnergy,
    maxEnergy: MATCH.startEnergy,
    hand: [],
    pile,
    discard: [],
    lastElement: null,
  };
  drawCards(duelist.hand, duelist.pile, duelist.discard, MATCH.startHand, random);
  return duelist;
}

/** A fresh match, seeded so the same seed always deals the same hands. */
export function createMatch(random) {
  return {
    random,
    turn: 1,
    phase: PHASE_TITLE,
    you: createDuelist(random),
    rival: createDuelist(random),
    active: 'you',
    log: ['Ember Court — the duel begins.'],
    lastPlayed: null,
    lastPlayedBy: null,
    lastChained: false,
    chain: 0,
    winner: null,
  };
}

/** Start a fresh match over the same random source (a new deal each time). */
export function resetMatch(match) {
  const fresh = createMatch(match.random);
  match.turn = fresh.turn;
  match.phase = fresh.phase;
  match.you = fresh.you;
  match.rival = fresh.rival;
  match.active = fresh.active;
  match.log = fresh.log;
  match.lastPlayed = fresh.lastPlayed;
  match.lastPlayedBy = fresh.lastPlayedBy;
  match.lastChained = fresh.lastChained;
  match.chain = fresh.chain;
  match.winner = fresh.winner;
}

/** The duelist whose turn it is, and the one waiting. */
export function activeDuelist(match) {
  return match.active === 'you' ? match.you : match.rival;
}

export function waitingDuelist(match) {
  return match.active === 'you' ? match.rival : match.you;
}

/** Append a line to the match log, keeping only the last few. */
export function logLine(match, text) {
  match.log.push(text);
  while (match.log.length > 5) match.log.shift();
}

/**
 * The chain: playing a card whose element matches the last card this duelist
 * played this turn adds +1 to its damage, shield and heal. Returns the bonus.
 */
function chainBonus(duelist, card) {
  if (duelist.lastElement === null || duelist.lastElement !== card.element) return 0;
  return 1;
}

/** Deal damage to a duelist, shield soaking it first. Returns damage taken. */
export function dealDamage(match, target, amount) {
  let left = amount;
  if (target.shield > 0) {
    const soaked = Math.min(target.shield, left);
    target.shield -= soaked;
    left -= soaked;
  }
  target.hp = Math.max(0, target.hp - left);
  return left;
}

/**
 * Play the card at `handIndex` for the active duelist. Returns false when the
 * card cannot be played (not affordable, wrong phase, not that duelist's turn).
 * The played card goes to the discard pile and its effect lands at once.
 */
export function playCard(match, who, handIndex) {
  if (match.phase !== PHASE_PLAY) return false;
  if (match.active !== who) return false;
  const duelist = who === 'you' ? match.you : match.rival;
  const target = who === 'you' ? match.rival : match.you;
  const id = duelist.hand[handIndex];
  if (id === undefined) return false;
  const card = cardById(id);
  if (card === null || duelist.energy < card.cost) return false;

  duelist.energy -= card.cost;
  duelist.hand.splice(handIndex, 1);
  duelist.discard.push(id);
  const bonus = chainBonus(duelist, card);
  duelist.lastElement = card.element;
  match.chain = bonus > 0 ? match.chain + 1 : match.chain;
  match.lastPlayed = card;
  match.lastPlayedBy = who;
  match.lastChained = bonus > 0;

  const whoName = who === 'you' ? 'You' : 'Cinder';
  const parts = [];
  if (card.damage) {
    const dealt = dealDamage(match, target, card.damage + bonus);
    parts.push(`dealt ${dealt} damage`);
  }
  if (card.shield) {
    duelist.shield += card.shield + bonus;
    parts.push(`gained ${card.shield + bonus} shield`);
  }
  if (card.heal) {
    const healed = Math.min(card.heal + bonus, duelist.maxHp - duelist.hp);
    duelist.hp += healed;
    parts.push(`restored ${healed} health`);
  }
  if (card.draw) drawCards(duelist.hand, duelist.pile, duelist.discard, card.draw, match.random);
  if (card.energy) duelist.energy = Math.min(duelist.maxEnergy, duelist.energy + card.energy);
  if (card.draw) parts.push('drew a card');
  if (card.energy) parts.push('gained 1 energy');
  if (bonus > 0) parts.push('CHAIN +1');
  logLine(match, `${whoName} played ${card.name} — ${parts.join(', ')}.`);
  checkEnd(match);
  return true;
}

/** Has the match been won or lost? Sets the phase and the winner. */
export function checkEnd(match) {
  if (match.phase !== PHASE_PLAY) return;
  if (match.rival.hp <= 0) {
    match.phase = PHASE_WIN;
    match.winner = 'you';
    logLine(match, 'Cinder falls. Victory is yours.');
  } else if (match.you.hp <= 0) {
    match.phase = PHASE_LOSS;
    match.winner = 'rival';
    logLine(match, 'Your embers fade. Cinder wins.');
  }
}

/** Begin the active duelist's turn: refill energy, draw, clear the chain. */
export function startTurn(match) {
  const duelist = activeDuelist(match);
  duelist.maxEnergy = Math.min(MATCH.maxEnergy, MATCH.startEnergy + match.turn - 1);
  duelist.energy = duelist.maxEnergy;
  duelist.lastElement = null;
  match.chain = 0;
  drawCards(duelist.hand, duelist.pile, duelist.discard, MATCH.drawPerTurn, match.random);
  const whoName = match.active === 'you' ? 'Your turn' : "Cinder's turn";
  logLine(match, `${whoName} — ${duelist.energy} energy.`);
}

/** End the active duelist's turn and hand the table to the other side. */
export function endTurn(match) {
  if (match.phase !== PHASE_PLAY) return;
  const duelist = activeDuelist(match);
  duelist.shield = 0;
  match.active = match.active === 'you' ? 'rival' : 'you';
  if (match.active === 'you') match.turn += 1;
  match.lastPlayed = null;
  match.lastPlayedBy = null;
  match.lastChained = false;
  startTurn(match);
}

/** Begin a match from the title screen. */
export function beginMatch(match) {
  resetMatch(match);
  match.phase = PHASE_PLAY;
  startTurn(match);
}
