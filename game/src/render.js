// All canvas drawing: floor, walls, cover, cones, entities, HUD, and screens.
// The game is read at a glance: warm floor, red cones, gold player, green exit.
import { TILE, COLS, ROWS, VIEW_W, VIEW_H, CONE_RANGE, CONE_HALF_ANGLE, COLORS } from './config.js';
import { angleDiff } from './vision.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw(game) {
    const c = this.ctx;
    c.clearRect(0, 0, VIEW_W, VIEW_H);
    this.drawFloor(c, game.level);
    this.drawExit(c, game.level, game.shardsLeft === 0);
    this.drawCover(c, game.level);
    this.drawShards(c, game.level, game.time);
    this.drawCones(c, game);
    this.drawGuards(c, game);
    this.drawPlayer(c, game);
    this.drawVignette(c);
    this.drawHud(c, game);
    if (game.screen !== 'play') this.drawScreen(c, game);
  }

  drawFloor(c, level) {
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        const k = tx + ',' + ty;
        if (level.walls.has(k)) continue;
        c.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
        c.fillRect(tx * TILE, ty * TILE, TILE, TILE);
        c.strokeStyle = COLORS.floorLine;
        c.lineWidth = 1;
        c.strokeRect(tx * TILE + 0.5, ty * TILE + 0.5, TILE, TILE);
      }
    }
    // Warm light pools under the hall lamps.
    for (const [lx, ly] of [[8, 4], [24, 4], [8, 19], [24, 19], [16, 12]]) {
      const g = c.createRadialGradient(lx * TILE, ly * TILE, 10, lx * TILE, ly * TILE, 150);
      g.addColorStop(0, 'rgba(232, 201, 106, 0.07)');
      g.addColorStop(1, 'rgba(232, 201, 106, 0)');
      c.fillStyle = g;
      c.fillRect(lx * TILE - 150, ly * TILE - 150, 300, 300);
    }
    // Walls on top of the floor.
    for (const k of level.walls) {
      const [tx, ty] = k.split(',').map(Number);
      c.fillStyle = COLORS.wall;
      c.fillRect(tx * TILE, ty * TILE, TILE, TILE);
      c.fillStyle = COLORS.wallTop;
      c.fillRect(tx * TILE, ty * TILE, TILE, 5);
      c.strokeStyle = COLORS.wallEdge;
      c.strokeRect(tx * TILE + 0.5, ty * TILE + 0.5, TILE, TILE);
    }
  }

  drawExit(c, level, open) {
    const ex = level.exit.x * TILE;
    const ey = level.exit.y * TILE;
    c.save();
    c.translate(ex, ey);
    c.fillStyle = open ? COLORS.exit : COLORS.exitDark;
    c.fillRect(-14, -14, 28, 28);
    c.strokeStyle = open ? '#b8ffcf' : '#3a7a52';
    c.lineWidth = 2;
    c.strokeRect(-14, -14, 28, 28);
    c.fillStyle = '#06210f';
    c.font = 'bold 16px Georgia, serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(open ? '»' : '✕', 0, 1);
    if (open) {
      const pulse = 0.25 + 0.15 * Math.sin(Date.now() / 240);
      c.fillStyle = `rgba(88, 224, 138, ${pulse})`;
      c.beginPath(); c.arc(0, 0, 26, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }

  drawCover(c, level) {
    for (const k of level.crates) {
      const [tx, ty] = k.split(',').map(Number);
      c.fillStyle = COLORS.crate;
      c.fillRect(tx * TILE + 2, ty * TILE + 2, TILE - 4, TILE - 4);
      c.fillStyle = COLORS.crateTop;
      c.fillRect(tx * TILE + 2, ty * TILE + 2, TILE - 4, 7);
      c.strokeStyle = '#2e2113';
      c.lineWidth = 1;
      c.strokeRect(tx * TILE + 2.5, ty * TILE + 2.5, TILE - 5, TILE - 5);
      c.beginPath();
      c.moveTo(tx * TILE + 2, ty * TILE + 2); c.lineTo(tx * TILE + TILE - 2, ty * TILE + TILE - 2);
      c.moveTo(tx * TILE + TILE - 2, ty * TILE + 2); c.lineTo(tx * TILE + 2, ty * TILE + TILE - 2);
      c.stroke();
    }
    for (const k of level.bushes) {
      const [tx, ty] = k.split(',').map(Number);
      c.fillStyle = COLORS.bush;
      c.fillRect(tx * TILE, ty * TILE, TILE, TILE);
      c.fillStyle = COLORS.bushTop;
      for (let i = 0; i < 5; i++) {
        const bx = tx * TILE + 5 + ((i * 7) % 22);
        const by = ty * TILE + 5 + ((i * 11) % 22);
        c.beginPath(); c.arc(bx, by, 6, 0, Math.PI * 2); c.fill();
      }
    }
  }

  drawShards(c, level, time) {
    for (const s of level.shards) {
      if (s.taken) continue;
      const x = s.x * TILE;
      const y = s.y * TILE + Math.sin(time * 2.4 + s.x) * 2;
      const glow = 0.22 + 0.12 * Math.sin(time * 3 + s.x);
      c.fillStyle = `rgba(111, 227, 255, ${glow})`;
      c.beginPath(); c.arc(x, y, 20, 0, Math.PI * 2); c.fill();
      c.save();
      c.translate(x, y);
      c.rotate(Math.PI / 4);
      c.fillStyle = COLORS.shard;
      c.fillRect(-7, -7, 14, 14);
      c.fillStyle = '#d9f7ff';
      c.fillRect(-3, -3, 6, 6);
      c.restore();
    }
  }

  drawCones(c, game) {
    for (const g of game.guards) {
      const alert = g.state === 'alert';
      const range = alert ? CONE_RANGE * 1.12 : CONE_RANGE;
      c.save();
      c.translate(g.x, g.y);
      c.rotate(g.facing);
      c.fillStyle = alert ? COLORS.coneAlert : COLORS.cone;
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, range, -CONE_HALF_ANGLE, CONE_HALF_ANGLE);
      c.closePath();
      c.fill();
      c.strokeStyle = COLORS.coneEdge;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(-CONE_HALF_ANGLE) * range, Math.sin(-CONE_HALF_ANGLE) * range);
      c.moveTo(0, 0);
      c.lineTo(Math.cos(CONE_HALF_ANGLE) * range, Math.sin(CONE_HALF_ANGLE) * range);
      c.stroke();
      c.restore();
    }
  }

  drawGuards(c, game) {
    for (const g of game.guards) {
      c.save();
      c.translate(g.x, g.y);
      // Body: dark uniform, red trim; facing wedge shows where he looks.
      c.fillStyle = COLORS.guardSuit;
      c.beginPath(); c.arc(0, 0, g.radius, 0, Math.PI * 2); c.fill();
      c.strokeStyle = COLORS.guard;
      c.lineWidth = 2.5;
      c.beginPath(); c.arc(0, 0, g.radius, 0, Math.PI * 2); c.stroke();
      c.rotate(g.facing);
      c.fillStyle = '#f2d8d8';
      c.beginPath();
      c.moveTo(g.radius - 2, 0);
      c.lineTo(g.radius - 9, -5);
      c.lineTo(g.radius - 9, 5);
      c.closePath(); c.fill();
      c.restore();
      // State marker: ? while suspicious, ! while alerted, and a suspicion arc.
      const cx = g.x;
      const cy = g.y - 24;
      if (g.state === 'alert') {
        c.fillStyle = COLORS.danger;
        c.font = 'bold 20px Georgia, serif';
        c.textAlign = 'center';
        c.fillText('!', cx, cy);
      } else if (g.state === 'suspicious' || g.suspicion > 1) {
        c.fillStyle = '#ffb347';
        c.font = 'bold 18px Georgia, serif';
        c.textAlign = 'center';
        c.fillText('?', cx, cy);
      }
      if (g.suspicion > 1 && g.state !== 'alert') {
        c.strokeStyle = 'rgba(255, 179, 71, 0.9)';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(g.x, g.y, g.radius + 5, -Math.PI / 2, -Math.PI / 2 + (g.suspicion / 100) * Math.PI * 2);
        c.stroke();
      }
    }
  }

  drawPlayer(c, game) {
    const p = game.player;
    c.save();
    c.translate(p.x, p.y);
    if (p.sneaking) {
      c.fillStyle = COLORS.playerRing;
      c.beginPath(); c.arc(0, 0, 20, 0, Math.PI * 2); c.fill();
    }
    // A quiet ring shows how loud you are being right now.
    const noiseR = p.running ? 26 : p.sneaking ? 14 : 19;
    c.strokeStyle = 'rgba(232, 201, 106, 0.25)';
    c.lineWidth = 1;
    c.beginPath(); c.arc(0, 0, noiseR, 0, Math.PI * 2); c.stroke();
    c.rotate(p.facing);
    c.fillStyle = COLORS.player;
    c.beginPath(); c.arc(0, 0, p.radius, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#7a5c14';
    c.beginPath();
    c.moveTo(p.radius + 3, 0);
    c.lineTo(p.radius - 4, -5);
    c.lineTo(p.radius - 4, 5);
    c.closePath(); c.fill();
    c.restore();
  }

  drawVignette(c) {
    const g = c.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.42, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.78);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.42)');
    c.fillStyle = g;
    c.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  drawHud(c, game) {
    c.save();
    c.fillStyle = 'rgba(5, 6, 12, 0.82)';
    c.fillRect(0, 0, VIEW_W, 34);
    c.fillStyle = COLORS.text;
    c.font = 'bold 15px Georgia, serif';
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    const total = game.level.shards.length;
    const got = total - game.shardsLeft;
    c.fillText(`◆ ${got}/${total} intel`, 14, 18);
    c.fillText(`♥ ${'●'.repeat(Math.max(0, game.lives))}${'○'.repeat(Math.max(0, 3 - game.lives))}`, 150, 18);
    c.fillText(game.levelName, 300, 18);
    const mm = String(Math.floor(game.time / 60)).padStart(2, '0');
    const ss = String(Math.floor(game.time % 60)).padStart(2, '0');
    c.textAlign = 'right';
    c.fillText(`${mm}:${ss}`, VIEW_W - 150, 18);
    // Alarm state on the right.
    const anyAlert = game.guards.some((g) => g.state === 'alert');
    const anySusp = game.guards.some((g) => g.state === 'suspicious');
    c.fillStyle = anyAlert ? COLORS.danger : anySusp ? '#ffb347' : COLORS.exit;
    c.fillText(anyAlert ? 'ALARM — RUN!' : anySusp ? 'SUSPICIOUS…' : 'UNSEEN', VIEW_W - 14, 18);
    // Bottom hint line.
    c.fillStyle = 'rgba(5, 6, 12, 0.7)';
    c.fillRect(0, VIEW_H - 26, VIEW_W, 26);
    c.fillStyle = COLORS.dim;
    c.font = '13px Georgia, serif';
    c.textAlign = 'center';
    const hint = game.shardsLeft === 0
      ? 'All intel lifted — reach the green exit door!'
      : 'WASD move · SHIFT sneak · hold nothing to walk quietly · grab the glowing shards';
    c.fillText(hint, VIEW_W / 2, VIEW_H - 13);
    c.restore();
  }

  drawScreen(c, game) {
    c.save();
    c.fillStyle = 'rgba(4, 5, 10, 0.78)';
    c.fillRect(0, 0, VIEW_W, VIEW_H);
    c.textAlign = 'center';
    c.fillStyle = COLORS.gold;
    c.font = 'bold 52px Georgia, serif';
    if (game.screen === 'title') {
      c.fillText('NIGHTSHADE', VIEW_W / 2, 250);
      c.fillStyle = COLORS.text;
      c.font = 'italic 26px Georgia, serif';
      c.fillText('The Gilded Vault', VIEW_W / 2, 292);
      c.font = '17px Georgia, serif';
      c.fillStyle = COLORS.dim;
      c.fillText('A top-down stealth game — slip past the guards, lift the intel,', VIEW_W / 2, 350);
      c.fillText('and reach the green exit door unseen.', VIEW_W / 2, 374);
      c.fillStyle = COLORS.text;
      c.font = 'bold 19px Georgia, serif';
      c.fillText('Press ENTER or click to begin', VIEW_W / 2, 440);
      c.font = '15px Georgia, serif';
      c.fillStyle = COLORS.dim;
      c.fillText('WASD / arrows move · SHIFT sneak · E grab intel · R restart · M sound', VIEW_W / 2, 480);
    } else if (game.screen === 'caught') {
      c.fillStyle = COLORS.danger;
      c.fillText('SPOTTED!', VIEW_W / 2, 300);
      c.fillStyle = COLORS.text;
      c.font = '20px Georgia, serif';
      c.fillText(`The guards caught Wren. ${game.lives} ${game.lives === 1 ? 'life' : 'lives'} left.`, VIEW_W / 2, 350);
      c.font = 'bold 19px Georgia, serif';
      c.fillText('Press ENTER to try again', VIEW_W / 2, 410);
    } else if (game.screen === 'leveldone') {
      c.fillStyle = COLORS.exit;
      c.fillText('CLEAN GETAWAY', VIEW_W / 2, 280);
      c.fillStyle = COLORS.text;
      c.font = '20px Georgia, serif';
      c.fillText(`${game.levelName} cleared in ${game.lastTime} — unseen enough.`, VIEW_W / 2, 330);
      c.font = 'bold 19px Georgia, serif';
      c.fillText('Press ENTER for the next gallery', VIEW_W / 2, 400);
    } else if (game.screen === 'win') {
      c.fillStyle = COLORS.gold;
      c.fillText('THE VAULT IS YOURS', VIEW_W / 2, 280);
      c.fillStyle = COLORS.text;
      c.font = '20px Georgia, serif';
      c.fillText(`Every gallery cleared in ${game.lastTime}. Wren vanishes into the night.`, VIEW_W / 2, 330);
      c.font = 'bold 19px Georgia, serif';
      c.fillText('Press ENTER to play again', VIEW_W / 2, 400);
    } else if (game.screen === 'gameover') {
      c.fillStyle = COLORS.danger;
      c.fillText('CAUGHT FOR GOOD', VIEW_W / 2, 300);
      c.fillStyle = COLORS.text;
      c.font = '20px Georgia, serif';
      c.fillText('The museum keeps its gold tonight.', VIEW_W / 2, 350);
      c.font = 'bold 19px Georgia, serif';
      c.fillText('Press ENTER to start over', VIEW_W / 2, 410);
    }
    c.restore();
  }
}
