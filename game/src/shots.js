// Staged scenes for screenshots: ?shot=start | play | alert | end
// Each one sets a fixed, deterministic state and freezes the simulation so the
// screenshot is a real render of the game's own code, mid-scene.
import { TILE } from './config.js';

export function applyShot(game, name) {
  game.frozen = true;
  const g = game.guards;
  if (name === 'start') {
    game.screen = 'title';
    game.time = 0;
    return;
  }
  if (name === 'play') {
    // Wren crouched behind a crate, a guard's cone sweeping just past her.
    game.screen = 'play';
    game.time = 42.5;
    game.player.x = 9.5 * TILE;
    game.player.y = 8.5 * TILE;
    game.player.sneaking = true;
    game.player.facing = Math.PI / 2;
    if (g[0]) { g[0].x = 11.5 * TILE; g[0].y = 6.5 * TILE; g[0].facing = Math.PI * 0.75; g[0].suspicion = 22; g[0].state = 'suspicious'; }
    if (g[1]) { g[1].x = 24.5 * TILE; g[1].y = 5.5 * TILE; g[1].facing = Math.PI; g[1].suspicion = 0; }
    if (g[2]) { g[2].x = 10.5 * TILE; g[2].y = 18.5 * TILE; g[2].facing = -Math.PI / 2; g[2].suspicion = 0; }
    game.level.shards[0].taken = true;
    return;
  }
  if (name === 'alert') {
    // A near miss: the guard has spotted Wren and is closing in, alarm up.
    game.screen = 'play';
    game.time = 96.2;
    game.player.x = 15.5 * TILE;
    game.player.y = 12.5 * TILE;
    game.player.facing = Math.PI;
    game.player.running = true;
    if (g[0]) { g[0].x = 12.5 * TILE; g[0].y = 12.5 * TILE; g[0].facing = 0; g[0].suspicion = 100; g[0].state = 'alert'; }
    if (g[1]) { g[1].x = 22.5 * TILE; g[1].y = 9.5 * TILE; g[1].facing = Math.PI * 0.6; g[1].suspicion = 48; g[1].state = 'suspicious'; }
    if (g[2]) { g[2].x = 10.5 * TILE; g[2].y = 18.5 * TILE; g[2].facing = -Math.PI / 2; g[2].suspicion = 0; }
    game.level.shards[0].taken = true;
    game.level.shards[1].taken = true;
    return;
  }
  if (name === 'end') {
    // Clean getaway: all intel lifted, exit open, Wren at the door.
    game.screen = 'leveldone';
    game.time = 148.7;
    game.lastTime = '2:28';
    for (const s of game.level.shards) s.taken = true;
    game.player.x = (game.level.exit.x - 1.5) * TILE;
    game.player.y = game.level.exit.y * TILE;
    game.player.facing = 0;
    if (g[0]) { g[0].x = 11.5 * TILE; g[0].y = 6.5 * TILE; g[0].facing = Math.PI * 0.75; g[0].suspicion = 0; }
    if (g[1]) { g[1].x = 24.5 * TILE; g[1].y = 5.5 * TILE; g[1].facing = Math.PI; g[1].suspicion = 0; }
    if (g[2]) { g[2].x = 10.5 * TILE; g[2].y = 18.5 * TILE; g[2].facing = -Math.PI / 2; g[2].suspicion = 0; }
  }
}
