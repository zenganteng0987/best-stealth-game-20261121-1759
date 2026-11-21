// Screenshot scenes: each one stages a real world state the game itself can reach, then
// the real renderer paints it. ?shot=cover|patrol|alert|exit (with &seed ignored: the
// scenes are placed by hand, so every run gives the same frame).
import { TILE } from './config.js';
import { createWorld, tileCentre } from './world.js';
import { SCREEN_CAUGHT, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function placeGuard(guard, tx, ty, facingDegrees) {
  const centre = tileCentre(tx, ty);
  guard.x = centre.x;
  guard.y = centre.y;
  guard.facing = (facingDegrees * Math.PI) / 180;
}

function placePlayer(world, tx, ty, facingDegrees = 0) {
  const centre = tileCentre(tx, ty);
  world.player.x = centre.x;
  world.player.y = centre.y;
  world.player.facing = (facingDegrees * Math.PI) / 180;
}

/**
 * Stage the named scene and return the world, the screen to draw and a fixed clock time
 * so the pulsing relics look the same in every capture.
 */
export function stageShot(name) {
  if (name === 'patrol') {
    const world = createWorld(1);
    placeGuard(world.guards[0], 15, 2, 0);
    placeGuard(world.guards[1], 10, 11, 90);
    placeGuard(world.guards[2], 24, 12, 270);
    world.timeSeconds = 34.5;
    return { world, screen: SCREEN_PLAY, time: 2.0 };
  }
  if (name === 'alert') {
    const world = createWorld(1);
    world.relics[0].taken = true;
    placePlayer(world, 16, 6, 90);
    world.player.running = true;
    world.player.moving = true;
    world.player.noisePulse = 0.8;
    const guard = world.guards[0];
    placeGuard(guard, 16, 3, 90);
    guard.state = 'chase';
    guard.detection = 1;
    guard.lastSeen = { x: world.player.x, y: world.player.y };
    placeGuard(world.guards[1], 10, 10, 0);
    world.guards[1].detection = 0.55;
    world.alerts = 1;
    world.timeSeconds = 61.2;
    return { world, screen: SCREEN_PLAY, time: 2.0 };
  }
  if (name === 'exit') {
    const world = createWorld(2);
    for (const relic of world.relics) relic.taken = true;
    world.exitOpen = true;
    placePlayer(world, 17, 16, 0);
    placeGuard(world.guards[0], 20, 2, 180);
    placeGuard(world.guards[3], 22, 14, 270);
    world.timeSeconds = 128.4;
    return { world, screen: SCREEN_PLAY, time: 2.0 };
  }
  if (name === 'caught') {
    const world = createWorld(0);
    world.relics[0].taken = true;
    placePlayer(world, 12, 2, 0);
    const guard = world.guards[0];
    placeGuard(guard, 13, 2, 0);
    guard.state = 'chase';
    guard.detection = 1;
    world.alerts = 1;
    world.timeSeconds = 22.7;
    return { world, screen: SCREEN_CAUGHT, time: 2.0 };
  }
  // Default: the cover shot — the thief crouched behind a shelf while a guard's cone
  // sweeps just past it, one relic already pocketed.
  const world = createWorld(0);
  world.relics[0].taken = true;
  placePlayer(world, 12, 4, 270);
  const guard = world.guards[0];
  placeGuard(guard, 14, 2, 90);
  guard.detection = 0.38;
  placeGuard(world.guards[1], 27, 13, 270);
  world.timeSeconds = 18.3;
  return { world, screen: SCREEN_PLAY, time: 2.0 };
}

export { SCREEN_TITLE };
