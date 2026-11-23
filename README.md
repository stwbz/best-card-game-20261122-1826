# Ember Court — a duel of ember cards

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/stwbz/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/stwbz/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

Entry for the make.fun bounty **"Best card game"** (`best-card-game-20261122-1826`, pot $50).

## How to play

You duel Cinder, the rival, with a hand of ember cards. Each turn you get
energy (3, growing by 1 a turn to 6) and draw 2 cards. Click a card (or press
1-7) to play it, then End Turn (or E). Cards strike for damage, guard with
shield, restore health, draw cards or gain energy. Playing a card whose
element matches the last card you played this turn chains it for +1. Reduce
Cinder to 0 health to win; if your health hits 0, you lose. Space starts and
restarts; P pauses.

## How it works

Canvas 2D, no library, no network. The game is deterministic from `?seed=N`
(a mulberry32 shuffle), and `?shot=title|table|win|loss` stages each
screenshot scene by playing the real rules forward with an autopilot, so every
screenshot is a real render of the game's own code. The rival Cinder plays by
a readable heuristic: take the win when it can, guard when low, chain
elements when the chain is open. Source is split by job: `config.js` (cards
and tuning), `cards.js` (deck and draw), `state.js` (the match and its rules),
`ai.js` (Cinder), `input.js`, `render.js`, `shots.js`, `main.js`.

## Screenshots

1. Title — Ember Court over a staged table.
2. Table — mid-match: both hands, readable values and costs, health, shield
   and energy, the log of the last plays.
3. Win — the victory screen after Cinder falls.
4. Loss — the defeat screen after your embers fade.

Serve it with `node serve.ts` and open http://localhost:8080. Hand it in with
`mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.
