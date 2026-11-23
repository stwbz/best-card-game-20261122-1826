// The screenshot scenes behind ?shot=title|table|win|loss. Each one plays the
// real rules forward from a fresh match, steered by a simple autopilot, so
// the frame is what a short game really looks like and the same seed always
// gives the same frame. The win scene's pilot plays well; the loss scene's
// pilot plays badly, as a hurried player does; the table scene stops mid-match.

import { cardById } from './cards.js';
import { beginMatch, checkEnd, endTurn, PHASE_LOSS, PHASE_PLAY, PHASE_WIN, playCard } from './state.js';
import { chooseAiPlay } from './ai.js';
import { SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

/** The player's autopilot: the best card to play now, by the same scoring the rival uses. */
function bestCardIndex(match) {
  const you = match.you;
  let bestIndex = -1;
  let bestScore = -1;
  for (let i = 0; i < you.hand.length; i += 1) {
    const card = cardById(you.hand[i]);
    if (card === null || card.cost > you.energy) continue;
    let score = 0;
    if (card.damage) score = (card.damage + (you.lastElement === card.element ? 1 : 0)) * 10;
    if (card.shield) score = you.hp <= 8 ? 60 + card.shield : -1;
    if (card.heal) score = you.hp < you.maxHp - 2 ? 40 + (you.maxHp - you.hp) : -1;
    if (card.draw || card.energy) score = 55;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex;
}

/** The player's bad autopilot: it passes every turn, so the rival wins. */
function worstCardIndex(match) {
  return -1;
}

/** The player's table autopilot: one good card a turn, then it ends the turn. */
function oneCardIndex(match) {
  return bestCardIndex(match);
}

/** Play the active duelist's whole turn, picking cards with `pick`. */
function playWholeTurn(match, pick) {
  for (let step = 0; step < 12; step += 1) {
    if (match.phase !== PHASE_PLAY) return;
    const index = pick(match);
    if (index === -1) break;
    if (!playCard(match, match.active, index)) break;
    if (match.phase !== PHASE_PLAY) return;
  }
  if (match.phase === PHASE_PLAY) endTurn(match);
}

/** Play one card, then end the turn (the table scene's slower pace). */
function playOneCardTurn(match) {
  if (match.phase !== PHASE_PLAY) return;
  const index = bestCardIndex(match);
  if (index !== -1) {
    if (!playCard(match, match.active, index)) return;
    if (match.phase !== PHASE_PLAY) return;
  }
  if (match.phase === PHASE_PLAY) endTurn(match);
}

/** Play the rival's whole turn with its own chooser, one card at a time. */
function playRivalTurn(match) {
  for (let step = 0; step < 12; step += 1) {
    if (match.phase !== PHASE_PLAY) return;
    const index = chooseAiPlay(match);
    if (index === -1) break;
    if (!playCard(match, 'rival', index)) break;
    if (match.phase !== PHASE_PLAY) return;
  }
  if (match.phase === PHASE_PLAY) endTurn(match);
}

/**
 * Set `match` to the named scene (title, table, win or loss; any other name
 * is title) and return the screen to draw and the best result to show.
 */
export function stageShot(name, match) {
  beginMatch(match);
  if (name !== 'table' && name !== 'win' && name !== 'loss') {
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const pick = name === 'loss' ? worstCardIndex : bestCardIndex;
  // Play turns until the scene is reached, or the match runs long.
  for (let turn = 0; turn < 40; turn += 1) {
    if (match.phase !== PHASE_PLAY) break;
    if (name === 'table') {
      // One card a turn, so the match is still alive at turn 3.
      if (match.active === 'you') playOneCardTurn(match);
      else playRivalTurn(match);
      if (match.turn >= 3 && match.active === 'you' && match.phase === PHASE_PLAY) break;
    } else if (match.active === 'you') {
      playWholeTurn(match, pick);
    } else {
      playRivalTurn(match);
    }
  }
  checkEnd(match);
  if (name === 'win' && match.phase === PHASE_WIN) return { screen: SCREEN_WIN, best: match.turn };
  if (name === 'loss' && match.phase === PHASE_LOSS) return { screen: SCREEN_LOSS, best: 0 };
  if (name === 'table') {
    // Leave a card on the table: play one more for the player, without
    // ending the turn, so the frame shows the last play and not an empty felt.
    if (match.phase === PHASE_PLAY && match.active === 'you') {
      const index = bestCardIndex(match);
      if (index !== -1) playCard(match, 'you', index);
    }
    return { screen: SCREEN_PLAY, best: 0 };
  }
  // A win or loss scene that did not land is shown as the table instead:
  // the frame is still a real mid-match render, never a fake.
  return { screen: SCREEN_PLAY, best: 0 };
}
