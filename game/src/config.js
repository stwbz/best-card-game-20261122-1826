// Ember Court — every tuning number, colour and card in one place.
// The table is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const MATCH = {
  startHp: 20,
  startHand: 5,
  drawPerTurn: 2,
  maxHand: 7,
  startEnergy: 3,
  energyPerTurn: 1,
  maxEnergy: 6,
  deckCopies: 2,
};

/** A card's element is told by colour AND shape, never by text alone. */
export const ELEMENTS = {
  flame: { name: 'Flame', color: '#e5534b', dark: '#8f2b26', glyph: '▲' },
  stone: { name: 'Stone', color: '#d9a441', dark: '#7d5c1d', glyph: '◆' },
  gale: { name: 'Gale', color: '#4fbf7a', dark: '#256b40', glyph: '●' },
  tide: { name: 'Tide', color: '#4f9be0', dark: '#245a8f', glyph: '■' },
};

/**
 * The ten cards. damage / shield / heal are the base numbers; playing a card
 * whose element matches the last card played this turn adds +1 to each of
 * them (the chain). draw and energy are not chained.
 * kind: 'attack' | 'guard' | 'heal' | 'trick'
 */
export const CARDS = [
  { id: 'ember-dart', name: 'Ember Dart', element: 'flame', cost: 0, damage: 1, kind: 'attack', text: 'Deal 1 damage.' },
  { id: 'flame-strike', name: 'Flame Strike', element: 'flame', cost: 1, damage: 3, kind: 'attack', text: 'Deal 3 damage.' },
  { id: 'cinder-blast', name: 'Cinder Blast', element: 'flame', cost: 2, damage: 5, kind: 'attack', text: 'Deal 5 damage.' },
  { id: 'stone-guard', name: 'Stone Guard', element: 'stone', cost: 1, shield: 4, kind: 'guard', text: 'Gain 4 shield.' },
  { id: 'stone-wall', name: 'Stone Wall', element: 'stone', cost: 2, shield: 8, kind: 'guard', text: 'Gain 8 shield.' },
  { id: 'gale-draw', name: 'Gale Draw', element: 'gale', cost: 1, damage: 2, draw: 1, kind: 'trick', text: 'Deal 2 damage. Draw a card.' },
  { id: 'gale-rush', name: 'Gale Rush', element: 'gale', cost: 2, damage: 2, energy: 1, kind: 'trick', text: 'Deal 2 damage. Gain 1 energy.' },
  { id: 'tide-mend', name: 'Tide Mend', element: 'tide', cost: 2, heal: 5, kind: 'heal', text: 'Restore 5 health.' },
  { id: 'tide-surge', name: 'Tide Surge', element: 'tide', cost: 3, damage: 6, kind: 'attack', text: 'Deal 6 damage.' },
  { id: 'spark', name: 'Spark', element: 'flame', cost: 1, damage: 2, energy: 1, kind: 'trick', text: 'Deal 2 damage. Gain 1 energy.' },
];

export const PALETTE = {
  backdrop: '#171310',
  table: '#241c15',
  tableEdge: '#3a2d20',
  felt: '#2e4636',
  feltEdge: '#4a6b52',
  panel: '#2b2118',
  panelEdge: '#4a3823',
  text: '#f5ead6',
  muted: '#b8a888',
  gold: '#e8b64c',
  you: '#4f9be0',
  rival: '#e5534b',
  shield: '#7fb7e8',
  hp: '#e5534b',
  hpBack: '#3a2320',
  energy: '#e8b64c',
  cardBack: '#3a2d20',
  cardFace: '#f7efdd',
  cardInk: '#241c15',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best result is kept between visits (this browser only). */
export const BEST_KEY = 'ember-court.best';
