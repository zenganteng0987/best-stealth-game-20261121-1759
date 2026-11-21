// Config: every number the game tunes lives here, so the other files read rules, not magic numbers.
export const TILE = 40;
export const COLS = 32;
export const ROWS = 18;
export const WIDTH = COLS * TILE; // 1280
export const HEIGHT = ROWS * TILE; // 720
export const STEP = 1 / 60;

export const PLAYER_WALK_SPEED = 150;
export const PLAYER_RUN_SPEED = 235;
export const PLAYER_RADIUS = 13;

export const GUARD_PATROL_SPEED = 72;
export const GUARD_CHASE_SPEED = 158;
export const GUARD_SEARCH_SPEED = 110;
export const GUARD_RADIUS = 14;

export const VISION_RANGE = 205;
export const VISION_HALF_ANGLE = 0.61; // ~35 degrees each side
export const NOISE_RADIUS = 105;

export const DETECTION_FILL_CLOSE = 1.5; // per second, player almost touching the guard
export const DETECTION_FILL_FAR = 0.4; // per second, player at the edge of the cone
export const DETECTION_DECAY = 0.45; // per second while unseen
export const CHASE_LOSE_SIGHT_SECONDS = 2.5;
export const SEARCH_SECONDS = 2.2;
export const CAUGHT_DISTANCE = 21;

export const RELICS_PER_LEVEL = 3;

export const BEST_KEY = 'midnight-archive-best-time';

// Night-archive palette: dark floor, warm lamp light, guards in red, the thief in teal.
export const COLORS = {
  floorA: '#1c1a24',
  floorB: '#201d2b',
  floorLine: '#262233',
  wall: '#3a3348',
  wallTop: '#544a68',
  cover: '#6b4a2b',
  coverTop: '#8a6136',
  coverLine: '#4a3018',
  relic: '#ffd34d',
  relicGlow: 'rgba(255, 211, 77, 0.25)',
  exit: '#39d98a',
  exitGlow: 'rgba(57, 217, 138, 0.22)',
  exitLocked: '#5a6b62',
  player: '#2dd4bf',
  playerDark: '#0f766e',
  guard: '#e5484d',
  guardDark: '#7f1d1d',
  coneCalm: 'rgba(255, 214, 90, 0.16)',
  coneEdge: 'rgba(255, 214, 90, 0.35)',
  coneAlert: 'rgba(229, 72, 77, 0.22)',
  coneAlertEdge: 'rgba(229, 72, 77, 0.5)',
  noiseRing: 'rgba(45, 212, 191, 0.45)',
  hudBack: 'rgba(10, 9, 16, 0.82)',
  text: '#f2ead8',
  textDim: '#a89f8d',
  alarm: '#ff5a5a',
};
