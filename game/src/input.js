// Input: keyboard state, read once per frame. WASD or arrows move, Shift runs (loud),
// Space or Enter confirms, P pauses, R restarts, M mutes.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_MUTE = 8;

const MOVE_KEYS = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};

export function createInput() {
  const held = new Set();
  let actions = 0;

  function onKeyDown(event) {
    if (event.repeat) return;
    held.add(event.code);
    if (event.code === 'Space' || event.code === 'Enter') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyR') {
      actions |= ACTION_RESTART;
    } else if (event.code === 'KeyM') {
      actions |= ACTION_MUTE;
    }
    if (event.code.startsWith('Arrow')) event.preventDefault();
  }

  function onKeyUp(event) {
    held.delete(event.code);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', () => held.clear());

  return {
    /** Normalised move direction from the keys held down right now. */
    direction() {
      let x = 0;
      let y = 0;
      for (const code of held) {
        const move = MOVE_KEYS[code];
        if (move) {
          x += move[0];
          y += move[1];
        }
      }
      if (x === 0 && y === 0) return { x: 0, y: 0 };
      const length = Math.hypot(x, y);
      return { x: x / length, y: y / length };
    },
    running() {
      return held.has('ShiftLeft') || held.has('ShiftRight');
    },
    /** One-shot actions since the last call; reading them clears them. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** Drive the player from a scripted direction (used by the screenshot scenes). */
    drive(dx, dy, run) {
      held.clear();
      if (dx < 0) held.add('KeyA');
      if (dx > 0) held.add('KeyD');
      if (dy < 0) held.add('KeyW');
      if (dy > 0) held.add('KeyS');
      if (run) held.add('ShiftLeft');
    },
  };
}
