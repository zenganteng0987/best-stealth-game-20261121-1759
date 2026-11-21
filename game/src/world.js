// World: the three archive floors. Each level is a grid of characters plus the guards that
// patrol it. '#' is a wall, 'C' is a shelf (cover: blocks movement and line of sight),
// 'R' is a relic, 'E' is the exit, 'P' is where the thief starts. Everything else is floor.
import { COLS, ROWS, TILE } from './config.js';

export const TILE_WALL = '#';
export const TILE_COVER = 'C';
export const TILE_RELIC = 'R';
export const TILE_EXIT = 'E';
export const TILE_PLAYER = 'P';

export const LEVELS = [
  {
    name: 'Ruang Arsip 1 — Lorong Sunyi',
    map: [
      '################################',
      '#P......C.......R.......C......#',
      '#..............................#',
      '#..C........C........C.........#',
      '#..............................#',
      '#.......######.................#',
      '#.......#....#....C........R...#',
      '#..R....#....#.................#',
      '#.......#....#....C............#',
      '#.......######.......C.........#',
      '#..............................#',
      '#....C........C........C.......#',
      '#..............................#',
      '#.........C.............C......#',
      '#..............................#',
      '#..C...........C...............#',
      '#......................E.......#',
      '################################',
    ],
    guards: [
      { tx: 6, ty: 2, waypoints: [[6, 2], [24, 2]], pause: 1.2 },
      { tx: 27, ty: 10, waypoints: [[27, 10], [27, 15]], pause: 1.0 },
    ],
  },
  {
    name: 'Ruang Arsip 2 — Galeri Tertutup',
    map: [
      '################################',
      '#P...C........R......C.........#',
      '#..............................#',
      '#..#####....C......#####.......#',
      '#..#...#............#...#......#',
      '#..#...#....C.......#...#..R...#',
      '#..#...#............#...#......#',
      '#..#####....C......#####.......#',
      '#..............................#',
      '#....C.......######.......C....#',
      '#...........#....#.............#',
      '#..R........#....#.....C.......#',
      '#...........#....#.............#',
      '#....C......######......C......#',
      '#..............................#',
      '#.......C...........C..........#',
      '#....................E.........#',
      '################################',
    ],
    guards: [
      { tx: 5, ty: 2, waypoints: [[5, 2], [26, 2]], pause: 1.0 },
      { tx: 10, ty: 8, waypoints: [[10, 8], [10, 14]], pause: 1.4 },
      { tx: 24, ty: 8, waypoints: [[24, 8], [24, 15]], pause: 1.0 },
    ],
  },
  {
    name: 'Ruang Arsip 3 — Brankas Tengah Malam',
    map: [
      '################################',
      '#P..C......R.....C......R......#',
      '#..............................#',
      '#.####.....C.....####....C.....#',
      '#.#..#...........#..#..........#',
      '#.#..#....C......#..#....C.....#',
      '#.#..#...........#..#..........#',
      '#.####.....C.....####....C.....#',
      '#..............................#',
      '#...C......#####......C........#',
      '#..........#...#...............#',
      '#..R.......#...#......C........#',
      '#..........#...#...............#',
      '#....C.....#####.......C.......#',
      '#..............................#',
      '#......C..........C.......C....#',
      '#..................E...........#',
      '################################',
    ],
    guards: [
      { tx: 4, ty: 2, waypoints: [[4, 2], [28, 2]], pause: 0.8 },
      { tx: 9, ty: 8, waypoints: [[9, 8], [9, 14]], pause: 1.2 },
      { tx: 24, ty: 8, waypoints: [[24, 8], [24, 14]], pause: 1.0 },
      { tx: 14, ty: 14, waypoints: [[14, 14], [28, 14]], pause: 0.9 },
    ],
  },
];

export function tileAt(level, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return TILE_WALL;
  return level.map[ty][tx];
}

/** Walls and shelves block movement; shelves also block a guard's line of sight. */
export function isSolid(level, tx, ty) {
  const tile = tileAt(level, tx, ty);
  return tile === TILE_WALL || tile === TILE_COVER;
}

export function blocksSight(level, tx, ty) {
  return isSolid(level, tx, ty);
}

/** Pixel position of the centre of a tile. */
export function tileCentre(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

/** True when no wall or shelf stands between two pixel points (sampled along the segment). */
export function lineOfSightClear(level, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const distance = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(distance / 8));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const tx = Math.floor((x0 + dx * t) / TILE);
    const ty = Math.floor((y0 + dy * t) / TILE);
    if (blocksSight(level, tx, ty)) return false;
  }
  return true;
}

/** A fresh, playable state for one level: player, guards, relics, exit and the run's clock. */
export function createWorld(levelIndex) {
  const level = LEVELS[levelIndex];
  const relics = [];
  let playerStart = { x: TILE * 1.5, y: TILE * 1.5 };
  let exit = { x: TILE * 1.5, y: TILE * 1.5 };
  for (let ty = 0; ty < ROWS; ty += 1) {
    for (let tx = 0; tx < COLS; tx += 1) {
      const tile = level.map[ty][tx];
      const centre = tileCentre(tx, ty);
      if (tile === TILE_RELIC) relics.push({ x: centre.x, y: centre.y, taken: false });
      else if (tile === TILE_EXIT) exit = { x: centre.x, y: centre.y };
      else if (tile === TILE_PLAYER) playerStart = { x: centre.x, y: centre.y };
    }
  }
  return {
    levelIndex,
    level,
    relics,
    exit,
    exitOpen: false,
    player: {
      x: playerStart.x,
      y: playerStart.y,
      facing: 0,
      running: false,
      moving: false,
      stepTimer: 0,
      noisePulse: 0,
    },
    guards: level.guards.map((def) => {
      const start = tileCentre(def.tx, def.ty);
      const first = tileCentre(def.waypoints[0][0], def.waypoints[0][1]);
      const second = tileCentre(def.waypoints[1][0], def.waypoints[1][1]);
      return {
        x: start.x,
        y: start.y,
        facing: Math.atan2(second.y - first.y, second.x - first.x),
        waypoints: def.waypoints.map(([wx, wy]) => tileCentre(wx, wy)),
        waypointIndex: 1,
        pauseLeft: 0,
        pauseSeconds: def.pause,
        state: 'patrol', // patrol | chase | search | return
        detection: 0,
        unseenSeconds: 0,
        searchSeconds: 0,
        lastSeen: { x: start.x, y: start.y },
        speed: 1,
      };
    }),
    timeSeconds: 0,
    alerts: 0,
    caught: false,
    levelDone: false,
  };
}

/** The highest detection among the guards: what the HUD meter shows. */
export function highestDetection(world) {
  let top = 0;
  for (const guard of world.guards) if (guard.detection > top) top = guard.detection;
  return top;
}

/** True while any guard is chasing the thief. */
export function anyAlarm(world) {
  return world.guards.some((guard) => guard.state === 'chase');
}
