// Input: the mouse (hover and click) and the keyboard (Space / Enter to
// confirm, Escape or P to pause, 1-7 to play a card from the hand). The game
// reads actions once a frame and clears them, so a click never fires twice.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_END_TURN = 4;

/** Track the pointer over a canvas and the keys held down. */
export function createInput(canvas) {
  const input = {
    mouseX: -1,
    mouseY: -1,
    clicked: null,
    keys: new Set(),
    actions: 0,
    cardKey: -1,
  };

  function toLocal(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  canvas.addEventListener('pointermove', (event) => {
    const point = toLocal(event);
    input.mouseX = point.x;
    input.mouseY = point.y;
  });
  canvas.addEventListener('pointerleave', () => {
    input.mouseX = -1;
    input.mouseY = -1;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const point = toLocal(event);
    input.clicked = { x: point.x, y: point.y };
    input.mouseX = point.x;
    input.mouseY = point.y;
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    input.keys.add(event.key);
    if (event.key === ' ' || event.key === 'Enter') input.actions |= ACTION_CONFIRM;
    if (event.key === 'Escape' || event.key === 'p' || event.key === 'P') input.actions |= ACTION_PAUSE;
    if (event.key === 'e' || event.key === 'E') input.actions |= ACTION_END_TURN;
    const digit = Number.parseInt(event.key, 10);
    if (digit >= 1 && digit <= 7) input.cardKey = digit - 1;
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.key);
  });

  return input;
}

/** Take and clear the click since the last read (null when there was none). */
export function takeClick(input) {
  const click = input.clicked;
  input.clicked = null;
  return click;
}

/** Take and clear the queued actions since the last read. */
export function takeActions(input) {
  const actions = input.actions;
  input.actions = 0;
  return actions;
}

/** Take and clear the card number key since the last read (-1 when none). */
export function takeCardKey(input) {
  const key = input.cardKey;
  input.cardKey = -1;
  return key;
}
