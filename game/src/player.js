// Player: the thief. Walks quietly, runs loud, picks up relics and slips out the exit
// once every relic on the floor is collected.
import { PLAYER_RADIUS, PLAYER_RUN_SPEED, PLAYER_WALK_SPEED, TILE } from './config.js';
import { isSolid } from './world.js';

export const EVENT_PICKUP = 1;
export const EVENT_EXIT = 2;

function hitsSolid(level, x, y) {
  const r = PLAYER_RADIUS - 2;
  for (const [ox, oy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) {
    if (isSolid(level, Math.floor((x + ox) / TILE), Math.floor((y + oy) / TILE))) return true;
  }
  return false;
}

/** Move the thief one step from the input direction; returns event bits. */
export function updatePlayer(world, direction, running, dt) {
  const player = world.player;
  const speed = running ? PLAYER_RUN_SPEED : PLAYER_WALK_SPEED;
  player.running = running && (direction.x !== 0 || direction.y !== 0);
  player.moving = direction.x !== 0 || direction.y !== 0;
  if (player.moving) {
    player.facing = Math.atan2(direction.y, direction.x);
    const nx = player.x + direction.x * speed * dt;
    const ny = player.y + direction.y * speed * dt;
    if (!hitsSolid(world.level, nx, player.y)) player.x = nx;
    if (!hitsSolid(world.level, player.x, ny)) player.y = ny;
    player.stepTimer -= dt;
    if (player.stepTimer <= 0) {
      player.stepTimer = running ? 0.22 : 0.38;
      player.noisePulse = 1;
    }
  }
  if (player.noisePulse > 0) player.noisePulse = Math.max(0, player.noisePulse - dt * 3);

  let events = 0;
  for (const relic of world.relics) {
    if (!relic.taken && Math.hypot(relic.x - player.x, relic.y - player.y) < PLAYER_RADIUS + 16) {
      relic.taken = true;
      events |= EVENT_PICKUP;
    }
  }
  if (world.relics.every((relic) => relic.taken)) world.exitOpen = true;
  if (
    world.exitOpen &&
    Math.hypot(world.exit.x - player.x, world.exit.y - player.y) < PLAYER_RADIUS + 14
  ) {
    world.levelDone = true;
    events |= EVENT_EXIT;
  }
  return events;
}

/** Relics still lying on the floor. */
export function relicsLeft(world) {
  return world.relics.filter((relic) => !relic.taken).length;
}
