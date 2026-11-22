// The infiltrator: WASD/arrows movement, sneak, run, noise, pickups.
import { TILE, PLAYER_RADIUS, PLAYER_WALK_SPEED, PLAYER_SNEAK_SPEED, PLAYER_RUN_SPEED,
  NOISE_RUN_RADIUS, NOISE_WALK_RADIUS, NOISE_SNEAK_RADIUS } from './config.js';
import { blocksMove } from './vision.js';

export class Player {
  constructor(start) {
    this.x = start.x * TILE;
    this.y = start.y * TILE;
    this.sneaking = false;
    this.running = false;
    this.moving = false;
    this.facing = -Math.PI / 2;
    this.stepAcc = 0;
    this.noiseCooldown = 0;
  }

  reset(start) {
    this.x = start.x * TILE;
    this.y = start.y * TILE;
    this.sneaking = false;
    this.running = false;
    this.moving = false;
    this.facing = -Math.PI / 2;
  }

  update(dt, level, input, onNoise) {
    let mx = 0; let my = 0;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;
    if (input.up) my -= 1;
    if (input.down) my += 1;
    this.moving = mx !== 0 || my !== 0;
    this.sneaking = !!input.sneak && this.moving;
    this.running = !!input.run && this.moving && !this.sneaking;
    if (!this.moving) { this.noiseCooldown = 0; return; }

    const len = Math.hypot(mx, my);
    mx /= len; my /= len;
    const speed = this.sneaking ? PLAYER_SNEAK_SPEED : this.running ? PLAYER_RUN_SPEED : PLAYER_WALK_SPEED;
    this.facing = Math.atan2(my, mx);
    const step = speed * dt;
    this.tryMove(level, mx * step, 0);
    this.tryMove(level, 0, my * step);

    // Footsteps: running is loud, walking is a whisper, sneaking is silent.
    this.stepAcc += step;
    this.noiseCooldown -= dt;
    const radius = this.running ? NOISE_RUN_RADIUS : this.sneaking ? NOISE_SNEAK_RADIUS : NOISE_WALK_RADIUS;
    if (radius > 0 && this.stepAcc > 26 && this.noiseCooldown <= 0) {
      this.stepAcc = 0;
      this.noiseCooldown = 0.28;
      onNoise(this.x, this.y, radius, this.running);
    }
  }

  // Axis-separated circle-vs-wall movement so the player slides along walls.
  tryMove(level, dx, dy) {
    const nx = this.x + dx;
    const ny = this.y + dy;
    const r = PLAYER_RADIUS;
    const corners = [[-r, -r], [r, -r], [-r, r], [r, r]];
    for (const [ox, oy] of corners) {
      if (blocksMove(level, nx + ox, ny + oy)) return;
    }
    this.x = nx;
    this.y = ny;
  }

  get radius() { return PLAYER_RADIUS; }
}
