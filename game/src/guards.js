// Guard AI: patrol waypoints, suspicion, investigation, chase, and giving up.
// States: patrol -> suspicious (something seen) -> alert (chasing) -> search -> patrol.
import { TILE, GUARD_RADIUS, GUARD_PATROL_SPEED, GUARD_CHASE_SPEED, GUARD_INVESTIGATE_SPEED,
  SUSPICION_FILL_BASE, SUSPICION_DRAIN, ALERT_AT, SUSPICIOUS_AT, CONE_RANGE } from './config.js';
import { inVisionCone, exposureFactor, angleDiff, losClear } from './vision.js';

export class Guard {
  constructor(def) {
    this.waypoints = def.waypoints.map((w) => ({ x: w.x * TILE, y: w.y * TILE }));
    this.x = this.waypoints[0].x;
    this.y = this.waypoints[0].y;
    this.wp = 1 % this.waypoints.length;
    this.facing = 0;
    this.state = 'patrol'; // patrol | suspicious | alert | search | return
    this.suspicion = 0;
    this.pause = 0;
    this.target = null; // {x, y} last seen / heard spot
    this.searchTime = 0;
    this.loseTime = 0;
    this.stepPhase = Math.random() * Math.PI * 2;
    this.stepAcc = 0;
  }

  moveToward(tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 2) return true;
    const want = Math.atan2(dy, dx);
    this.facing += angleDiff(want, this.facing) * Math.min(1, dt * 8);
    const step = Math.min(d, speed * dt);
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    this.stepAcc += step;
    return d - step < 2;
  }

  update(dt, level, player, sfx) {
    // --- seeing the player ---
    const sees = inVisionCone(level, this, player.x, player.y);
    if (sees) {
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      const closeness = 1 - (dist / CONE_RANGE) * 0.75;
      this.suspicion += SUSPICION_FILL_BASE * closeness * exposureFactor(level, player) * dt;
      this.target = { x: player.x, y: player.y };
      this.loseTime = 0;
      if (this.suspicion >= ALERT_AT && this.state !== 'alert') {
        this.state = 'alert';
        sfx.alert();
      } else if (this.suspicion >= SUSPICIOUS_AT && this.state === 'patrol') {
        this.state = 'suspicious';
        sfx.suspicious();
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - SUSPICION_DRAIN * dt);
      if (this.state === 'alert') {
        this.loseTime += dt;
        if (this.loseTime > 3.5) { this.state = 'search'; this.searchTime = 0; }
      }
    }

    // --- behaviour by state ---
    if (this.state === 'patrol') {
      if (this.pause > 0) { this.pause -= dt; return; }
      const wp = this.waypoints[this.wp];
      if (this.moveToward(wp.x, wp.y, GUARD_PATROL_SPEED, dt)) {
        this.wp = (this.wp + 1) % this.waypoints.length;
        this.pause = 0.9;
      }
    } else if (this.state === 'suspicious') {
      // Walk to where the player was glimpsed, look around, then calm down.
      if (this.target && this.moveToward(this.target.x, this.target.y, GUARD_INVESTIGATE_SPEED, dt)) {
        this.facing += dt * 2.2; // scan the room
        this.searchTime += dt;
        if (this.searchTime > 2.2) { this.state = 'patrol'; this.searchTime = 0; }
      }
    } else if (this.state === 'alert') {
      if (sees && this.target) {
        this.moveToward(this.target.x, this.target.y, GUARD_CHASE_SPEED, dt);
      } else if (this.target) {
        // Run to the last known spot, then start searching.
        if (this.moveToward(this.target.x, this.target.y, GUARD_CHASE_SPEED, dt)) {
          this.state = 'search'; this.searchTime = 0;
        }
      }
    } else if (this.state === 'search') {
      this.searchTime += dt;
      this.facing += dt * 2.6;
      if (this.searchTime > 3) { this.state = 'return'; }
    } else if (this.state === 'return') {
      // Head back to the nearest patrol waypoint and resume the route.
      let best = 0; let bestD = Infinity;
      this.waypoints.forEach((w, i) => {
        const d = Math.hypot(w.x - this.x, w.y - this.y);
        if (d < bestD) { bestD = d; best = i; }
      });
      const wp = this.waypoints[best];
      if (this.moveToward(wp.x, wp.y, GUARD_PATROL_SPEED, dt)) {
        this.wp = (best + 1) % this.waypoints.length;
        this.state = 'patrol';
        this.suspicion = 0;
      }
    }
  }

  // A noise at (x, y) with radius r: guards inside it go and look.
  hearNoise(x, y, radius) {
    if (this.state === 'alert') return;
    const d = Math.hypot(x - this.x, y - this.y);
    if (d <= radius) {
      this.target = { x, y };
      this.state = 'suspicious';
      this.searchTime = 0;
      this.suspicion = Math.max(this.suspicion, SUSPICIOUS_AT);
    }
  }

  get radius() { return GUARD_RADIUS; }
}
