// Line of sight and vision-cone maths. Walls and crates block sight;
// bushes do not — they hide the player instead.
import { TILE, COLS, ROWS, CONE_RANGE, CONE_HALF_ANGLE } from './config.js';

export function tileAt(level, px, py) {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
  const k = tx + ',' + ty;
  if (level.walls.has(k)) return '#';
  if (level.crates.has(k)) return 'C';
  return '.';
}

export function blocksSight(level, px, py) {
  const t = tileAt(level, px, py);
  return t === '#' || t === 'C';
}

export function blocksMove(level, px, py) {
  return tileAt(level, px, py) !== '.';
}

// Sampled segment test: cheap, robust, and good enough at these ranges.
export function losClear(level, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 4));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (blocksSight(level, x0 + dx * t, y0 + dy * t)) return false;
  }
  return true;
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Is the point inside the guard's vision cone (range + angle + line of sight)?
export function inVisionCone(level, guard, px, py) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONE_RANGE) return false;
  if (dist < 26) return losClear(level, guard.x, guard.y, px, py); // point blank: felt, not seen
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, guard.facing)) > CONE_HALF_ANGLE) return false;
  return losClear(level, guard.x, guard.y, px, py);
}

// How hidden the player is right now: 1 = fully exposed, 0 = invisible.
export function exposureFactor(level, player) {
  const tx = Math.floor(player.x / TILE);
  const ty = Math.floor(player.y / TILE);
  let f = 1;
  if (level.bushes.has(tx + ',' + ty)) f *= 0.22; // deep in the shrubs
  if (player.sneaking) f *= 0.45;
  if (player.running) f *= 1.35;
  return f;
}
