// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps, and the renderer paints what is there. The game moves
// between five screens: title, play, paused, win and loss. The rival plays
// one card at a time, with a short pause between them, so you can follow it.
//
// ?seed=N fixes the deal. ?shot=title|table|win|loss (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './cards.js';
import { beginMatch, checkEnd, createMatch, endTurn, PHASE_LOSS, PHASE_PLAY, PHASE_WIN, playCard } from './state.js';
import { chooseAiPlay } from './ai.js';
import { ACTION_CONFIRM, ACTION_END_TURN, ACTION_PAUSE, createInput, takeActions, takeCardKey, takeClick } from './input.js';
import { createRenderer, SCREEN_LOSS, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;
/** Seconds between the rival's cards, so its turn reads one play at a time. */
const RIVAL_PAUSE = 0.7;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const match = createMatch(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, match);
  let painted = 0;
  function paint() {
    renderer.draw(match, scene.screen, scene.best, -1);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let rivalTimer = 0;
  let hoverIndex = -1;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    beginMatch(match);
    screen = SCREEN_PLAY;
    rivalTimer = 0;
    announce('Playing. Your turn — play a card, then end your turn.');
  }

  function finishMatch() {
    if (match.phase === PHASE_WIN) {
      screen = SCREEN_WIN;
      if (best === 0 || match.turn < best) {
        best = match.turn;
        saveBest(best);
      }
      announce(`Victory. You won in ${match.turn} turns.`);
    } else if (match.phase === PHASE_LOSS) {
      screen = SCREEN_LOSS;
      announce('Defeat. Cinder takes the court.');
    }
  }

  function handleActions() {
    const actions = takeActions(input);
    const cardKey = takeCardKey(input);
    const click = takeClick(input);
    // Hover follows the pointer, so the card under it lifts.
    hoverIndex = renderer.hoverCard({ x: input.mouseX, y: input.mouseY });
    if (screen === SCREEN_TITLE || screen === SCREEN_WIN || screen === SCREEN_LOSS) {
      if (actions & ACTION_CONFIRM || click !== null) startGame();
      return;
    }
    if (screen === SCREEN_PAUSED) {
      if (actions & (ACTION_CONFIRM | ACTION_PAUSE) || click !== null) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
      return;
    }
    if (actions & ACTION_PAUSE) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
      return;
    }
    if (match.active !== 'you') return;
    if (cardKey >= 0 && cardKey < match.you.hand.length) {
      if (playCard(match, 'you', cardKey)) checkEnd(match);
    }
    if (click !== null) {
      if (renderer.endTurnAt(click)) {
        endTurn(match);
        rivalTimer = 0;
      } else {
        const index = renderer.cardAt(click);
        if (index >= 0 && playCard(match, 'you', index)) checkEnd(match);
      }
    }
    if (actions & ACTION_END_TURN) {
      endTurn(match);
      rivalTimer = 0;
    }
    if (match.phase === PHASE_WIN || match.phase === PHASE_LOSS) finishMatch();
  }

  /** The rival's turn, one card per pause, then it ends its turn. */
  function stepRival(dt) {
    if (match.active !== 'rival' || match.phase !== PHASE_PLAY) return;
    rivalTimer += dt;
    if (rivalTimer < RIVAL_PAUSE) return;
    rivalTimer = 0;
    const index = chooseAiPlay(match);
    if (index === -1) {
      endTurn(match);
      return;
    }
    playCard(match, 'rival', index);
    if (match.phase === PHASE_WIN || match.phase === PHASE_LOSS) finishMatch();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY) stepRival(dt);
    if (match.phase === PHASE_WIN || match.phase === PHASE_LOSS) {
      if (screen === SCREEN_PLAY) finishMatch();
    }
    renderer.draw(match, screen, best, hoverIndex);
  }

  let last = performance.now();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Ember Court. Press Space or click to begin.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
