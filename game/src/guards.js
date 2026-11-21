// Guards: patrols you can learn, a vision cone that fills the detection meter, and a
// chase that gives you a chance to recover — lose sight of them, and they search, then
// go back to their patrol.
import {
  CAUGHT_DISTANCE,
  CHASE_LOSE_SIGHT_SECONDS,
  DETECTION_DECAY,
  DETECTION_FILL_CLOSE,
  DETECTION_FILL_FAR,
  GUARD_CHASE_SPEED,
  GUARD_PATROL_SPEED,
  GUARD_RADIUS,
  GUARD_SEARCH_SPEED,
  NOISE_RADIUS,
  SEARCH_SECONDS,
  TILE,
  VISION_HALF_ANGLE,
  VISION_RANGE,
} from './config.js';
import { isSolid, lineOfSightClear } from './world.js';

export const EVENT_CAUGHT = 1;
export const EVENT_ALARM = 2;
export const EVENT_LOST = 4;

/** True when the player stands inside the guard's cone with nothing blocking the view. */
export function canSeeGuard(guard, world, px, py) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance > VISION_RANGE) return false;
  if (distance < GUARD_RADIUS + 4) return true;
  const angle = Math.atan2(dy, dx);
  let diff = angle - guard.facing;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > VISION_HALF_ANGLE) return false;
  return lineOfSightClear(world.level, guard.x, guard.y, px, py);
}

/** Move toward a point, sliding along walls instead of sticking on corners. */
function moveToward(guard, world, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return true;
  const step = Math.min(distance, speed * dt);
  const nx = guard.x + (dx / distance) * step;
  const ny = guard.y + (dy / distance) * step;
  if (!hitsSolid(world, nx, guard.y)) guard.x = nx;
  if (!hitsSolid(world, guard.x, ny)) guard.y = ny;
  guard.facing = Math.atan2(dy, dx);
  return distance - step < 2;
}

function hitsSolid(world, x, y) {
  const r = GUARD_RADIUS - 2;
  for (const [ox, oy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) {
    if (isSolid(world.level, Math.floor((x + ox) / TILE), Math.floor((y + oy) / TILE))) return true;
  }
  return false;
}

/**
 * Advance one guard a step. Returns event bits: EVENT_ALARM when the meter fills and the
 * chase starts, EVENT_LOST when a chase gives up, EVENT_CAUGHT when the thief is grabbed.
 */
export function updateGuard(guard, world, dt, playerRunning) {
  const player = world.player;
  const sees = canSeeGuard(guard, world, player.x, player.y);
  let events = 0;

  if (sees) {
    guard.lastSeen = { x: player.x, y: player.y };
    guard.unseenSeconds = 0;
    const distance = Math.hypot(player.x - guard.x, player.y - guard.y);
    const closeness = 1 - Math.min(1, distance / VISION_RANGE);
    const fill = DETECTION_FILL_FAR + (DETECTION_FILL_CLOSE - DETECTION_FILL_FAR) * closeness;
    const wasBelow = guard.detection < 1;
    guard.detection = Math.min(1, guard.detection + fill * dt);
    if (guard.detection >= 1 && wasBelow && guard.state !== 'chase') {
      guard.state = 'chase';
      world.alerts += 1;
      events |= EVENT_ALARM;
    }
    if (guard.state === 'chase') guard.facing = Math.atan2(player.y - guard.y, player.x - guard.x);
  } else {
    guard.detection = Math.max(0, guard.detection - DETECTION_DECAY * dt);
    guard.unseenSeconds += dt;
  }

  // Running is loud: a guard close enough hears it and comes to look. Sound travels
  // around corners, sight does not: hearing alone is enough to investigate.
  if (playerRunning && player.moving && guard.state === 'patrol') {
    const distance = Math.hypot(player.x - guard.x, player.y - guard.y);
    if (distance < NOISE_RADIUS) {
      guard.state = 'search';
      guard.searchSeconds = SEARCH_SECONDS;
      guard.lastSeen = { x: player.x, y: player.y };
    }
  }

  if (guard.state === 'patrol') {
    if (guard.pauseLeft > 0) {
      guard.pauseLeft -= dt;
      if (guard.pauseLeft <= 0) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
      }
    } else {
      const target = guard.waypoints[guard.waypointIndex];
      if (moveToward(guard, world, target.x, target.y, GUARD_PATROL_SPEED, dt)) {
        guard.pauseLeft = guard.pauseSeconds;
      }
    }
  } else if (guard.state === 'chase') {
    if (sees) {
      moveToward(guard, world, player.x, player.y, GUARD_CHASE_SPEED, dt);
    } else if (guard.unseenSeconds >= CHASE_LOSE_SIGHT_SECONDS) {
      guard.state = 'search';
      guard.searchSeconds = SEARCH_SECONDS;
      events |= EVENT_LOST;
    } else {
      moveToward(guard, world, guard.lastSeen.x, guard.lastSeen.y, GUARD_CHASE_SPEED, dt);
    }
  } else if (guard.state === 'search') {
    const arrived = moveToward(guard, world, guard.lastSeen.x, guard.lastSeen.y, GUARD_SEARCH_SPEED, dt);
    if (arrived) {
      guard.searchSeconds -= dt;
      guard.facing += dt * 1.6; // look around before giving up
      if (guard.searchSeconds <= 0) guard.state = 'return';
    }
  } else if (guard.state === 'return') {
    let nearest = guard.waypoints[0];
    let nearestDistance = Infinity;
    for (const point of guard.waypoints) {
      const d = Math.hypot(point.x - guard.x, point.y - guard.y);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearest = point;
      }
    }
    if (moveToward(guard, world, nearest.x, nearest.y, GUARD_PATROL_SPEED, dt)) {
      guard.waypointIndex = guard.waypoints.indexOf(nearest);
      guard.state = 'patrol';
      guard.pauseLeft = guard.pauseSeconds;
    }
  }

  if (Math.hypot(player.x - guard.x, player.y - guard.y) < CAUGHT_DISTANCE) {
    events |= EVENT_CAUGHT;
  }
  return events;
}

/** Advance every guard; returns the combined event bits for the frame. */
export function updateGuards(world, dt, playerRunning) {
  let events = 0;
  for (const guard of world.guards) events |= updateGuard(guard, world, dt, playerRunning);
  return events;
}
