// Shared tuning for Nightshade: The Gilded Vault.
export const TILE = 32;
export const COLS = 32;
export const ROWS = 24;
export const VIEW_W = COLS * TILE; // 1024
export const VIEW_H = ROWS * TILE; // 768

export const PLAYER_RADIUS = 11;
export const PLAYER_WALK_SPEED = 150; // px per second
export const PLAYER_SNEAK_SPEED = 82;
export const PLAYER_RUN_SPEED = 205;

export const GUARD_RADIUS = 12;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_CHASE_SPEED = 132;
export const GUARD_INVESTIGATE_SPEED = 92;

export const CONE_RANGE = 175;
export const CONE_HALF_ANGLE = Math.PI / 5.2; // ~35 degrees each side
export const CATCH_DISTANCE = 24;

export const NOISE_RUN_RADIUS = 130;
export const NOISE_WALK_RADIUS = 34;
export const NOISE_SNEAK_RADIUS = 0;

// Suspicion 0..100. Fills while the player is seen, drains while hidden.
export const SUSPICION_FILL_BASE = 46; // per second at point blank
export const SUSPICION_DRAIN = 26; // per second while unseen
export const ALERT_AT = 100;
export const SUSPICIOUS_AT = 35; // guard turns to look / walks over

export const COLORS = {
  floorA: '#141728',
  floorB: '#121524',
  floorLine: '#1b1f33',
  wall: '#2c3252',
  wallTop: '#3d4470',
  wallEdge: '#171a2c',
  crate: '#5a4630',
  crateTop: '#7a6244',
  bush: '#1d3a24',
  bushTop: '#2c5a35',
  cone: 'rgba(255, 64, 64, 0.20)',
  coneAlert: 'rgba(255, 40, 40, 0.34)',
  coneEdge: 'rgba(255, 90, 90, 0.35)',
  player: '#e8c96a',
  playerRing: 'rgba(232, 201, 106, 0.35)',
  guard: '#c94f4f',
  guardSuit: '#8e2f2f',
  shard: '#6fe3ff',
  exit: '#58e08a',
  exitDark: '#1d5c34',
  text: '#e8e4d8',
  dim: '#9aa0b8',
  danger: '#ff5a5a',
  gold: '#e8c96a',
};
