// Nightshade: The Gilded Vault — game loop, input, screens, win/lose flow.
// Screens: title -> play -> caught | leveldone -> win | gameover.
import { TILE, VIEW_W, VIEW_H, CATCH_DISTANCE, COLS, ROWS } from './config.js';
import { LEVELS, parseLevel } from './levels.js';
import { Player } from './player.js';
import { Guard } from './guards.js';
import { Renderer } from './render.js';
import { Sfx } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const renderer = new Renderer(canvas);
const sfx = new Sfx();

const game = {
  screen: 'title',
  levelIndex: 0,
  level: null,
  levelName: '',
  player: null,
  guards: [],
  lives: 3,
  time: 0,
  lastTime: '',
  frozen: false,
  detections: 0,
};

export function formatTime(t) {
  const mm = String(Math.floor(t / 60)).padStart(2, '0');
  const ss = String(Math.floor(t % 60)).padStart(2, '0');
  return `${mm}:${ss}`;
}

Object.defineProperty(game, 'shardsLeft', {
  get() { return this.level ? this.level.shards.filter((s) => !s.taken).length : 0; },
});

function loadLevel(index) {
  game.levelIndex = index;
  game.level = parseLevel(LEVELS[index]);
  game.levelName = game.level.name;
  game.player = new Player(game.level.start);
  game.guards = game.level.guards.map((def) => new Guard(def));
  game.time = 0;
}

function startGame() {
  game.lives = 3;
  game.detections = 0;
  loadLevel(0);
  game.screen = 'play';
}

function caught() {
  game.lives -= 1;
  game.detections += 1;
  sfx.caught();
  game.screen = game.lives <= 0 ? 'gameover' : 'caught';
}

function nextLevel() {
  if (game.levelIndex + 1 >= LEVELS.length) {
    game.screen = 'win';
    sfx.win();
  } else {
    loadLevel(game.levelIndex + 1);
    game.screen = 'play';
  }
}

// --- input ---
const input = { up: false, down: false, left: false, right: false, sneak: false, run: false };
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
};
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  const k = KEYMAP[e.code];
  if (k) input[k] = true;
  if (e.code === 'Enter' || e.code === 'Space') advance();
  if (e.code === 'KeyR') { if (game.screen === 'play') loadLevel(game.levelIndex); }
  if (e.code === 'KeyM') { sfx.ensure(); sfx.toggleMute(); }
  if (e.code === 'KeyE' && game.screen === 'play') tryGrab();
});
window.addEventListener('keyup', (e) => {
  const k = KEYMAP[e.code];
  if (k) input[k] = false;
});
canvas.addEventListener('mousedown', () => { sfx.ensure(); advance(); });
canvas.addEventListener('click', () => sfx.ensure());

function advance() {
  sfx.ensure();
  if (game.screen === 'title') startGame();
  else if (game.screen === 'caught') { loadLevel(game.levelIndex); game.screen = 'play'; }
  else if (game.screen === 'leveldone') nextLevel();
  else if (game.screen === 'win' || game.screen === 'gameover') startGame();
}

function tryGrab() {
  // Walk-over pickup also runs every frame; E is a manual grab for nearby shards.
  for (const s of game.level.shards) {
    if (s.taken) continue;
    const d = Math.hypot(s.x * TILE - game.player.x, s.y * TILE - game.player.y);
    if (d < 30) { s.taken = true; sfx.pickup(); }
  }
}

function onNoise(x, y, radius, loud) {
  for (const g of game.guards) g.hearNoise(x, y, radius);
}

// --- update ---
function update(dt) {
  if (game.screen !== 'play' || game.frozen) return;
  game.time += dt;
  game.player.update(dt, game.level, input, onNoise);
  for (const g of game.guards) g.update(dt, game.level, game.player, sfx);

  // Walk-over shard pickup.
  for (const s of game.level.shards) {
    if (s.taken) continue;
    const d = Math.hypot(s.x * TILE - game.player.x, s.y * TILE - game.player.y);
    if (d < 24) { s.taken = true; sfx.pickup(); }
  }

  // Caught? An alerted guard that reaches the player ends the run.
  for (const g of game.guards) {
    if (g.state === 'alert' && Math.hypot(g.x - game.player.x, g.y - game.player.y) < CATCH_DISTANCE) {
      caught();
      return;
    }
  }

  // Exit: only open once every shard is lifted.
  if (game.shardsLeft === 0) {
    const d = Math.hypot(game.level.exit.x * TILE - game.player.x, game.level.exit.y * TILE - game.player.y);
    if (d < 26) {
      game.lastTime = formatTime(game.time);
      sfx.win();
      game.screen = 'leveldone';
    }
  }

  // Guard footsteps: a soft tick panned by direction, louder when close.
  for (const g of game.guards) {
    g.stepAcc += g.state === 'alert' ? 132 * dt : 62 * dt;
    if (g.stepAcc > 34) {
      g.stepAcc = 0;
      const d = Math.hypot(g.x - game.player.x, g.y - game.player.y);
      if (d < 320) {
        const pan = Math.max(-1, Math.min(1, (g.x - game.player.x) / 320));
        sfx.step(pan, g.state === 'alert');
      }
    }
  }
}

// --- main loop ---
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  renderer.draw(game);
  requestAnimationFrame(frame);
}

// --- boot ---
loadLevel(0);
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) applyShot(game, shot);
window.__nightshade = game; // inspectable for play-testing
requestAnimationFrame(frame);
