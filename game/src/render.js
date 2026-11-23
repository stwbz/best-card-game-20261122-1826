// The renderer: every pixel of Ember Court on one canvas. The table is a
// fixed 1280x720 logical area scaled to the window; cards are drawn big
// enough to read at thumbnail size, and each element is told by colour AND
// shape. The screens are title, play, paused, win and loss.

import { ELEMENTS, FIELD, FONT, PALETTE } from './config.js';
import { cardById } from './cards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

const CARD_W = 150;
const CARD_H = 210;
const RIVAL_W = 92;
const RIVAL_H = 128;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 400} ${size}px ${FONT}`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

/** Wrap `value` into lines that fit `width` at `size`, at most `maxLines`. */
function wrapLines(ctx, value, size, width, maxLines) {
  ctx.font = `400 ${size}px ${FONT}`;
  const words = value.split(' ');
  const lines = [];
  let line = '';
  for (let i = 0; i < words.length; i += 1) {
    const next = line === '' ? words[i] : `${line} ${words[i]}`;
    if (ctx.measureText(next).width <= width || line === '') line = next;
    else {
      lines.push(line);
      line = words[i];
    }
    if (lines.length === maxLines) return lines;
  }
  if (line !== '' && lines.length < maxLines) lines.push(line);
  return lines;
}

/**
 * Draw one card face. Sizes and positions are fractions of the card's width
 * and height, so the same drawing works for the player's big cards and the
 * rival's small ones without any text overlapping. `opts`: faceDown, dimmed,
 * lifted, playable, chain.
 */
export function drawCard(ctx, card, x, y, w, h, opts) {
  const o = opts || {};
  const lift = o.lifted ? -16 : 0;
  const top = y + lift;
  const bandH = Math.round(h * 0.12);
  const costR = Math.max(8, Math.round(w * 0.1));
  const nameSize = Math.max(8, Math.round(w * 0.1));
  const powerSize = Math.max(16, Math.round(w * 0.29));
  const effectSize = Math.max(7, Math.round(w * 0.08));
  if (o.faceDown) {
    roundRect(ctx, x, top, w, h, 10);
    ctx.fillStyle = PALETTE.cardBack;
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, '◆', x + w / 2, top + h * 0.46, Math.max(16, Math.round(w * 0.22)), PALETTE.gold, 'center');
    text(ctx, 'EMBER', x + w / 2, top + h * 0.62, Math.max(7, Math.round(w * 0.07)), PALETTE.muted, 'center', 700);
    return;
  }
  const element = ELEMENTS[card.element];
  roundRect(ctx, x, top, w, h, 10);
  ctx.fillStyle = o.dimmed ? '#c9bda6' : PALETTE.cardFace;
  ctx.fill();
  ctx.strokeStyle = element.color;
  ctx.lineWidth = o.playable ? 4 : 3;
  ctx.stroke();
  // Element band across the top: colour and glyph, never text alone.
  ctx.fillStyle = element.color;
  ctx.fillRect(x + 3, top + 3, w - 6, bandH);
  text(ctx, element.glyph, x + w - Math.round(w * 0.09), top + 3 + bandH / 2, Math.max(8, Math.round(w * 0.1)), '#ffffff', 'center', 700);
  text(ctx, element.name.toUpperCase(), x + 8, top + 3 + bandH / 2, Math.max(7, Math.round(w * 0.07)), '#ffffff', 'left', 700);
  // Cost, in a circle below the band, at the top left.
  const costY = top + bandH + costR + 6;
  ctx.beginPath();
  ctx.arc(x + costR + 6, costY, costR, 0, Math.PI * 2);
  ctx.fillStyle = '#241c15';
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, String(card.cost), x + costR + 6, costY + 1, Math.max(9, Math.round(costR * 1.1)), '#f5ead6', 'center', 700);
  // Name, centred on its own line below the cost circle, so a neighbour
  // overlapping the card's right edge never hides the start of it.
  text(ctx, card.name, x + w / 2, costY + costR + 14, nameSize, PALETTE.cardInk, 'center', 700);
  // The big number: damage, shield or heal, whichever the card does.
  const power = card.damage || card.shield || card.heal || 0;
  const label = card.damage ? 'DMG' : card.shield ? 'SHIELD' : card.heal ? 'HEAL' : '';
  text(ctx, String(power), x + w / 2, top + h * 0.52, powerSize, element.dark, 'center', 800);
  if (label !== '') text(ctx, label, x + w / 2, top + h * 0.64, Math.max(7, Math.round(w * 0.07)), PALETTE.muted, 'center', 700);
  if (o.chain) text(ctx, 'CHAIN +1', x + w / 2, top + h * 0.72, Math.max(8, Math.round(w * 0.08)), element.color, 'center', 800);
  // Effect text, wrapped, near the bottom.
  const lines = wrapLines(ctx, card.text, effectSize, w - 16, 3);
  for (let i = 0; i < lines.length; i += 1) {
    text(ctx, lines[i], x + w / 2, top + h - 26 + i * (effectSize + 3), effectSize, '#5a4a33', 'center');
  }
  if (!o.playable && o.playable !== undefined) {
    ctx.fillStyle = 'rgba(20, 14, 10, 0.28)';
    roundRect(ctx, x, top, w, h, 10);
    ctx.fill();
  }
}

/**
 * A health bar with a number, and a shield badge when shield is up. The
 * number sits inside the bar and the shield on the line below it, so nothing
 * spills past the bar's right edge into the hand beside it.
 */
function drawHealth(ctx, x, y, w, hp, maxHp, shield, label, color) {
  text(ctx, label, x, y - 12, 13, PALETTE.text, 'left', 700);
  const barY = y;
  ctx.fillStyle = PALETTE.hpBack;
  roundRect(ctx, x, barY, w, 16, 8);
  ctx.fill();
  const fill = Math.max(0, Math.min(1, hp / maxHp));
  if (fill > 0) {
    ctx.fillStyle = color;
    roundRect(ctx, x, barY, Math.max(16, w * fill), 16, 8);
    ctx.fill();
  }
  text(ctx, `${hp} / ${maxHp}`, x + w / 2, barY + 9, 13, '#ffffff', 'center', 700);
  if (shield > 0) {
    ctx.beginPath();
    ctx.arc(x + 12, barY + 34, 11, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.shield;
    ctx.fill();
    text(ctx, String(shield), x + 12, barY + 35, 12, '#10233a', 'center', 800);
    text(ctx, 'SHIELD', x + 28, barY + 34, 11, PALETTE.shield, 'left', 700);
  }
}

/** Energy as filled pips, with a number after them. */
function drawEnergy(ctx, x, y, energy, maxEnergy) {
  text(ctx, 'ENERGY', x, y - 12, 11, PALETTE.muted, 'left', 700);
  for (let i = 0; i < maxEnergy; i += 1) {
    ctx.beginPath();
    ctx.arc(x + 9 + i * 22, y + 8, 8, 0, Math.PI * 2);
    ctx.fillStyle = i < energy ? PALETTE.energy : '#4a3823';
    ctx.fill();
    ctx.strokeStyle = '#8a6d3b';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  text(ctx, `${energy}/${maxEnergy}`, x + 9 + maxEnergy * 22 + 6, y + 8, 14, PALETTE.text, 'left', 700);
}

/** The last few log lines, in a panel. */
function drawLog(ctx, x, y, w, h, lines) {
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 1;
  ctx.stroke();
  text(ctx, 'THE TABLE', x + 12, y + 16, 11, PALETTE.muted, 'left', 700);
  for (let i = 0; i < lines.length; i += 1) {
    const wrapped = wrapLines(ctx, lines[i], 12, w - 24, 2);
    const lineY = y + 36 + i * 30;
    for (let j = 0; j < wrapped.length; j += 1) {
      text(ctx, wrapped[j], x + 12, lineY + j * 14, 12, PALETTE.text, 'left');
    }
  }
}

/**
 * The hand's card rectangles, laid out in a row centred on `centreX` and kept
 * inside `maxWidth`. Big hands overlap their cards (a negative gap) instead
 * of spilling past the table's edge; the hovered card is drawn last, on top.
 */
function handRects(count, cardW, cardH, centreX, top, maxWidth) {
  const rects = [];
  if (count === 0) return rects;
  let gap = 10;
  const full = count * cardW + (count - 1) * gap;
  if (full > maxWidth) gap = Math.floor((maxWidth - count * cardW) / (count - 1));
  const total = count * cardW + (count - 1) * gap;
  let x = centreX - total / 2;
  for (let i = 0; i < count; i += 1) {
    rects.push({ x, y: top, w: cardW, h: cardH });
    x += cardW + gap;
  }
  return rects;
}

function pointIn(point, rect) {
  return point !== null && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

/** The renderer: paints the match and remembers where the clickable things are. */
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const renderer = {
    canvas,
    ctx,
    cardRects: [],
    endTurnRect: null,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  };

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scale = Math.min(width / FIELD.width, height / FIELD.height);
    canvas.width = Math.round(FIELD.width * scale);
    canvas.height = Math.round(FIELD.height * scale);
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    renderer.scale = scale;
    renderer.offsetX = (width - canvas.width) / 2;
    renderer.offsetY = (height - canvas.height) / 2;
  }

  function paintTable() {
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // The felt table.
    ctx.fillStyle = PALETTE.felt;
    roundRect(ctx, 24, 96, FIELD.width - 48, 380, 18);
    ctx.fill();
    ctx.strokeStyle = PALETTE.feltEdge;
    ctx.lineWidth = 3;
    ctx.stroke();
    // Gold trim.
    ctx.strokeStyle = 'rgba(232, 182, 76, 0.35)';
    ctx.lineWidth = 1;
    roundRect(ctx, 32, 104, FIELD.width - 64, 364, 14);
    ctx.stroke();
  }

  function paintRival(match) {
    const rival = match.rival;
    text(ctx, 'CINDER — THE RIVAL', 40, 26, 16, PALETTE.rival, 'left', 800);
    drawHealth(ctx, 40, 64, 260, rival.hp, rival.maxHp, rival.shield, 'RIVAL HEALTH', PALETTE.rival);
    drawEnergy(ctx, 480, 64, rival.energy, rival.maxEnergy);
    text(ctx, `TURN ${match.turn}`, 1240, 26, 14, PALETTE.muted, 'right', 700);
    text(ctx, match.active === 'rival' ? "Cinder's turn" : 'Your turn', 1240, 52, 14, PALETTE.text, 'right', 700);
    // The rival's hand, face up but small and dimmed, so the table reads.
    const rects = handRects(rival.hand.length, RIVAL_W, RIVAL_H, FIELD.width / 2, 100, 900);
    for (let i = 0; i < rival.hand.length; i += 1) {
      const card = cardById(rival.hand[i]);
      if (card !== null) drawCard(ctx, card, rects[i].x, rects[i].y, RIVAL_W, RIVAL_H, { dimmed: true });
    }
  }

  function paintPlayer(match, hoverIndex) {
    const you = match.you;
    // Your status, in a panel at the left, clear of the hand.
    text(ctx, 'YOU', 24, 496, 16, PALETTE.you, 'left', 800);
    drawHealth(ctx, 24, 536, 180, you.hp, you.maxHp, you.shield, 'YOUR HEALTH', PALETTE.you);
    drawEnergy(ctx, 24, 620, you.energy, you.maxEnergy);
    // Your hand, big cards along the bottom, kept inside the middle band.
    const rects = handRects(you.hand.length, CARD_W, CARD_H, 660, 480, 880);
    renderer.cardRects = rects;
    for (let i = 0; i < you.hand.length; i += 1) {
      if (i === hoverIndex) continue;
      const card = cardById(you.hand[i]);
      if (card === null) continue;
      const playable = match.active === 'you' && you.energy >= card.cost;
      const chain = you.lastElement !== null && you.lastElement === card.element;
      drawCard(ctx, card, rects[i].x, rects[i].y, CARD_W, CARD_H, {
        playable,
        chain,
      });
    }
    // The hovered card is drawn last, lifted and on top of its neighbours.
    if (hoverIndex >= 0 && hoverIndex < you.hand.length) {
      const card = cardById(you.hand[hoverIndex]);
      if (card !== null) {
        const playable = match.active === 'you' && you.energy >= card.cost;
        const chain = you.lastElement !== null && you.lastElement === card.element;
        drawCard(ctx, card, rects[hoverIndex].x, rects[hoverIndex].y, CARD_W, CARD_H, {
          lifted: true,
          playable,
          chain,
        });
      }
    }
    // End Turn button, at the right, clear of the hand.
    const button = { x: 1120, y: 560, w: 120, h: 52 };
    renderer.endTurnRect = button;
    const canEnd = match.active === 'you';
    roundRect(ctx, button.x, button.y, button.w, button.h, 10);
    ctx.fillStyle = canEnd ? PALETTE.gold : '#4a3823';
    ctx.fill();
    text(ctx, 'END TURN', button.x + button.w / 2, button.y + button.h / 2 + 1, 15, canEnd ? '#241c15' : '#8b7a5c', 'center', 800);
    text(ctx, 'Click a card to play it · E ends turn', 24, 706, 12, PALETTE.muted, 'left');
  }

  function paintCentre(match) {
    // The last played card, large, at the centre-left of the table.
    const card = match.lastPlayed;
    if (card !== null) {
      const by = match.lastPlayedBy === 'you' ? 'You played' : 'Cinder played';
      text(ctx, by, 300, 252, 13, PALETTE.muted, 'center', 700);
      drawCard(ctx, card, 225, 266, CARD_W, CARD_H, {
        chain: match.lastChained,
        playable: true,
      });
    } else {
      text(ctx, 'No card played yet', 300, 360, 14, PALETTE.muted, 'center');
      text(ctx, 'Play a card from your hand', 300, 384, 12, PALETTE.muted, 'center');
    }
    drawLog(ctx, 560, 250, 380, 190, match.log.slice(-4));
  }

  function paintTitle(match, best) {
    paintTable();
    // A staged table behind the title, so the cover shows the game itself.
    const staged = match;
    const rects = handRects(staged.you.hand.length, CARD_W, CARD_H, FIELD.width / 2, 470, 1100);
    for (let i = 0; i < staged.you.hand.length; i += 1) {
      const card = cardById(staged.you.hand[i]);
      if (card !== null) drawCard(ctx, card, rects[i].x, rects[i].y, CARD_W, CARD_H, { dimmed: true });
    }
    ctx.fillStyle = 'rgba(23, 19, 16, 0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(ctx, 'EMBER COURT', FIELD.width / 2, 250, 84, PALETTE.gold, 'center', 800);
    text(ctx, 'A duel of ember cards', FIELD.width / 2, 310, 26, PALETTE.text, 'center');
    text(ctx, 'Play cards to strike, guard and chain elements. Reduce Cinder to 0 health to win.', FIELD.width / 2, 352, 16, PALETTE.muted, 'center');
    text(ctx, 'Click or press Space to begin', FIELD.width / 2, 420, 18, PALETTE.text, 'center', 700);
    text(ctx, 'Mouse + keyboard · No network · 20 health · 10 cards · 4 elements', FIELD.width / 2, 452, 13, PALETTE.muted, 'center');
    if (best > 0) text(ctx, `Best: won in ${best} turns`, FIELD.width / 2, 490, 14, PALETTE.gold, 'center', 700);
  }

  function paintOver(match, best, won) {
    paintTable();
    paintRival(match);
    paintPlayer(match, -1);
    paintCentre(match);
    ctx.fillStyle = 'rgba(23, 19, 16, 0.78)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    if (won) {
      text(ctx, 'VICTORY', FIELD.width / 2, 280, 84, PALETTE.gold, 'center', 800);
      text(ctx, 'Cinder falls. The court is yours.', FIELD.width / 2, 340, 24, PALETTE.text, 'center');
      text(ctx, `Won in ${match.turn} turns with ${match.you.hp} health left.`, FIELD.width / 2, 382, 16, PALETTE.muted, 'center');
    } else {
      text(ctx, 'DEFEAT', FIELD.width / 2, 280, 84, PALETTE.rival, 'center', 800);
      text(ctx, 'Your embers fade. Cinder takes the court.', FIELD.width / 2, 340, 24, PALETTE.text, 'center');
      text(ctx, `Cinder had ${match.rival.hp} health left after ${match.turn} turns.`, FIELD.width / 2, 382, 16, PALETTE.muted, 'center');
    }
    text(ctx, 'Click or press Space to play again', FIELD.width / 2, 440, 18, PALETTE.text, 'center', 700);
    if (best > 0) text(ctx, `Best: won in ${best} turns`, FIELD.width / 2, 478, 14, PALETTE.gold, 'center', 700);
  }

  function paintPaused(match) {
    paintTable();
    paintRival(match);
    paintPlayer(match, -1);
    paintCentre(match);
    ctx.fillStyle = 'rgba(23, 19, 16, 0.7)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(ctx, 'PAUSED', FIELD.width / 2, 330, 56, PALETTE.text, 'center', 800);
    text(ctx, 'Press Space or click to resume', FIELD.width / 2, 390, 16, PALETTE.muted, 'center');
  }

  renderer.resize = resize;
  renderer.draw = function draw(match, screen, best, hoverIndex) {
    resize();
    ctx.setTransform(renderer.scale, 0, 0, renderer.scale, 0, 0);
    renderer.cardRects = [];
    renderer.endTurnRect = null;
    if (screen === SCREEN_TITLE) {
      paintTitle(match, best);
      return;
    }
    if (screen === SCREEN_WIN) {
      paintOver(match, best, true);
      return;
    }
    if (screen === SCREEN_LOSS) {
      paintOver(match, best, false);
      return;
    }
    if (screen === SCREEN_PAUSED) {
      paintPaused(match);
      return;
    }
    paintTable();
    paintRival(match);
    paintCentre(match);
    paintPlayer(match, hoverIndex === undefined ? -1 : hoverIndex);
  };

  renderer.cardAt = function cardAt(point) {
    for (let i = renderer.cardRects.length - 1; i >= 0; i -= 1) {
      if (pointIn(point, renderer.cardRects[i])) return i;
    }
    return -1;
  };

  renderer.endTurnAt = function endTurnAt(point) {
    return renderer.endTurnRect !== null && pointIn(point, renderer.endTurnRect);
  };

  renderer.hoverCard = function hoverCard(point) {
    return renderer.cardAt(point);
  };

  return renderer;
}
