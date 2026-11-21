// Render: one canvas painter for the whole game — the night archive floor, the guards'
// vision cones, the thief, the relics, the exit, the HUD and every screen.
import { COLORS, COLS, HEIGHT, NOISE_RADIUS, ROWS, TILE, VISION_HALF_ANGLE, VISION_RANGE, WIDTH } from './config.js';
import { TILE_COVER, TILE_WALL, anyAlarm, highestDetection, tileAt } from './world.js';
import { relicsLeft } from './player.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_LEVEL_DONE = 'level-done';
export const SCREEN_WIN = 'win';
export const SCREEN_CAUGHT = 'caught';

function drawCone(ctx, guard, alert) {
  const range = VISION_RANGE;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, range, guard.facing - VISION_HALF_ANGLE, guard.facing + VISION_HALF_ANGLE);
  ctx.closePath();
  ctx.fillStyle = alert ? COLORS.coneAlert : COLORS.coneCalm;
  ctx.fill();
  ctx.strokeStyle = alert ? COLORS.coneAlertEdge : COLORS.coneEdge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx, level) {
  for (let ty = 0; ty < ROWS; ty += 1) {
    for (let tx = 0; tx < COLS; tx += 1) {
      const x = tx * TILE;
      const y = ty * TILE;
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, TILE, TILE);
      const tile = tileAt(level, tx, ty);
      if (tile === TILE_WALL) {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(x, y, TILE, 6);
      } else if (tile === TILE_COVER) {
        ctx.fillStyle = COLORS.cover;
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = COLORS.coverTop;
        ctx.fillRect(x + 3, y + 3, TILE - 6, 5);
        ctx.strokeStyle = COLORS.coverLine;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 14);
        ctx.lineTo(x + TILE - 6, y + 14);
        ctx.moveTo(x + 6, y + 24);
        ctx.lineTo(x + TILE - 6, y + 24);
        ctx.stroke();
      }
    }
  }
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 1;
  for (let tx = 0; tx <= COLS; tx += 1) {
    ctx.beginPath();
    ctx.moveTo(tx * TILE + 0.5, 0);
    ctx.lineTo(tx * TILE + 0.5, HEIGHT);
    ctx.stroke();
  }
  for (let ty = 0; ty <= ROWS; ty += 1) {
    ctx.beginPath();
    ctx.moveTo(0, ty * TILE + 0.5);
    ctx.lineTo(WIDTH, ty * TILE + 0.5);
    ctx.stroke();
  }
}

function drawRelic(ctx, relic, time) {
  const pulse = 1 + Math.sin(time * 3 + relic.x) * 0.12;
  ctx.save();
  ctx.translate(relic.x, relic.y);
  ctx.scale(pulse, pulse);
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
  glow.addColorStop(0, COLORS.relicGlow);
  glow.addColorStop(1, 'rgba(255, 211, 77, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.relic;
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(8, 0);
  ctx.lineTo(0, 11);
  ctx.lineTo(-8, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(4, 0);
  ctx.lineTo(0, 6);
  ctx.lineTo(-4, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawExit(ctx, world, time) {
  const open = world.exitOpen;
  const glow = ctx.createRadialGradient(world.exit.x, world.exit.y, 4, world.exit.x, world.exit.y, 46);
  glow.addColorStop(0, open ? COLORS.exitGlow : 'rgba(120, 130, 125, 0.18)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(world.exit.x, world.exit.y, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = open ? COLORS.exit : COLORS.exitLocked;
  ctx.fillRect(world.exit.x - 14, world.exit.y - 18, 28, 36);
  ctx.fillStyle = '#0b0f0d';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(open ? 'EXIT' : '🔒', world.exit.x, world.exit.y + 1);
  if (open) {
    ctx.strokeStyle = COLORS.exit;
    ctx.lineWidth = 2;
    const w = 20 + Math.sin(time * 4) * 3;
    ctx.strokeRect(world.exit.x - w, world.exit.y - 24, w * 2, 48);
  }
}

function drawGuard(ctx, guard) {
  const alert = guard.state === 'chase';
  drawCone(ctx, guard, alert);
  ctx.fillStyle = alert ? COLORS.guard : COLORS.guardDark;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.facing) * 6, guard.y + Math.sin(guard.facing) * 6, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
  ctx.globalAlpha = 0.35;
  ctx.fill();
  ctx.globalAlpha = 1;
  // Detection arc above the guard's head.
  if (guard.detection > 0.02) {
    ctx.strokeStyle = guard.detection >= 1 ? COLORS.alarm : COLORS.relic;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 21, -Math.PI / 2, -Math.PI / 2 + guard.detection * Math.PI * 2);
    ctx.stroke();
  }
  if (guard.state === 'search') {
    ctx.fillStyle = COLORS.relic;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - 26);
  } else if (alert) {
    ctx.fillStyle = COLORS.alarm;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - 26);
  }
}

function drawPlayer(ctx, world, time) {
  const player = world.player;
  if (player.running && player.moving) {
    ctx.strokeStyle = COLORS.noiseRing;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, NOISE_RADIUS * player.noisePulse, 0, Math.PI * 2);
    ctx.stroke();
  }
  const bob = player.moving ? Math.sin(time * 12) * 1.5 : 0;
  ctx.fillStyle = COLORS.playerDark;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, 10, 0, Math.PI * 2);
  ctx.fill();
  // Hood point showing which way the thief faces.
  ctx.fillStyle = COLORS.playerDark;
  ctx.beginPath();
  ctx.moveTo(player.x + Math.cos(player.facing) * 16, player.y + Math.sin(player.facing) * 16 + bob);
  ctx.lineTo(
    player.x + Math.cos(player.facing + 2.5) * 9,
    player.y + Math.sin(player.facing + 2.5) * 9 + bob,
  );
  ctx.lineTo(
    player.x + Math.cos(player.facing - 2.5) * 9,
    player.y + Math.sin(player.facing - 2.5) * 9 + bob,
  );
  ctx.closePath();
  ctx.fill();
}

function drawHud(ctx, world, levelName, muted) {
  ctx.fillStyle = COLORS.hudBack;
  ctx.fillRect(0, 0, WIDTH, 44);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(levelName, 16, 23, 280);
  const taken = world.relics.length - relicsLeft(world);
  ctx.fillStyle = COLORS.relic;
  ctx.font = '16px sans-serif';
  ctx.fillText(`◆ Relik ${taken}/${world.relics.length}`, 310, 23);
  const detection = highestDetection(world);
  ctx.fillStyle = '#2a2733';
  ctx.fillRect(520, 14, 180, 16);
  ctx.fillStyle = detection >= 1 ? COLORS.alarm : detection > 0.4 ? '#f59e0b' : COLORS.exit;
  ctx.fillRect(520, 14, 180 * detection, 16);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.strokeRect(520.5, 14.5, 180, 16);
  ctx.fillStyle = COLORS.text;
  ctx.font = '14px sans-serif';
  ctx.fillText('Terlihat', 710, 23);
  const minutes = Math.floor(world.timeSeconds / 60);
  const seconds = Math.floor(world.timeSeconds % 60);
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.text;
  ctx.font = '16px sans-serif';
  ctx.fillText(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`, 1130, 23);
  ctx.fillText(muted ? 'M — suara mati' : 'M — suara', 1264, 23);
  ctx.textAlign = 'left';
  if (anyAlarm(world)) {
    ctx.fillStyle = COLORS.alarm;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('⚠ ALARM — SEMBUNYI!', 800, 23);
  } else if (!world.exitOpen) {
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '14px sans-serif';
    ctx.fillText('Ambil 3 relik, lalu ke EXIT', 800, 23);
  } else {
    ctx.fillStyle = COLORS.exit;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('EXIT TERBUKA — LARI!', 800, 23);
  }
}

function drawOverlay(ctx, lines, accent) {
  ctx.fillStyle = 'rgba(8, 7, 12, 0.78)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let y = HEIGHT / 2 - (lines.length - 1) * 26;
  for (const line of lines) {
    ctx.fillStyle = line.color ?? COLORS.text;
    ctx.font = line.font ?? '20px sans-serif';
    ctx.fillText(line.text, WIDTH / 2, y);
    y += 52;
  }
  if (accent) {
    ctx.fillStyle = accent;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(accent, WIDTH / 2, y + 10);
  }
}

export function createRenderer(canvas) {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

  return {
    draw(world, screen, time, muted, extra = {}) {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      if (screen === SCREEN_TITLE) {
        drawFloor(ctx, world.level);
        for (const relic of world.relics) drawRelic(ctx, relic, time);
        drawExit(ctx, world, time);
        for (const guard of world.guards) drawGuard(ctx, guard);
        drawOverlay(ctx, [
          { text: 'ARSIP TENGAH MALAM', font: 'bold 54px sans-serif', color: COLORS.relic },
          { text: 'Masuk arsip. Ambil 3 relik. Keluar tanpa ketahuan.', font: '22px sans-serif' },
          { text: 'WASD / panah — bergerak   •   Shift — lari (berisik!)', font: '19px sans-serif', color: COLORS.textDim },
          { text: 'Rak kayu menahan pandangan penjaga. Kerucut kuning = terlihat.', font: '19px sans-serif', color: COLORS.textDim },
          { text: 'Kalau meter "Terlihat" penuh, penjaga mengejar — hilang dari pandangan untuk pulih.', font: '19px sans-serif', color: COLORS.textDim },
        ], 'Tekan Spasi / Enter untuk mulai');
        return;
      }
      drawFloor(ctx, world.level);
      for (const relic of world.relics) if (!relic.taken) drawRelic(ctx, relic, time);
      drawExit(ctx, world, time);
      for (const guard of world.guards) drawGuard(ctx, guard);
      drawPlayer(ctx, world, time);
      drawHud(ctx, world, world.level.name, muted);
      if (screen === SCREEN_PAUSED) {
        drawOverlay(ctx, [
          { text: 'JEDA', font: 'bold 44px sans-serif' },
          { text: 'Tekan P atau Spasi untuk lanjut', font: '20px sans-serif', color: COLORS.textDim },
        ]);
      } else if (screen === SCREEN_LEVEL_DONE) {
        drawOverlay(ctx, [
          { text: `Lantai ${world.levelIndex + 1} bersih!`, font: 'bold 44px sans-serif', color: COLORS.exit },
          { text: `Waktu: ${world.timeSeconds.toFixed(1)} detik  •  Alarm: ${world.alerts}x`, font: '20px sans-serif' },
        ], 'Tekan Spasi untuk lanjut ke lantai berikutnya');
      } else if (screen === SCREEN_WIN) {
        drawOverlay(ctx, [
          { text: 'SEMUA RELIK AMAN!', font: 'bold 48px sans-serif', color: COLORS.relic },
          { text: 'Kamu keluar dari arsip tanpa ketahuan.', font: '22px sans-serif' },
          { text: `Total waktu: ${extra.totalTime ?? world.timeSeconds.toFixed(1)} detik  •  Alarm: ${world.alerts}x`, font: '20px sans-serif' },
        ], 'Tekan Spasi untuk main lagi');
      } else if (screen === SCREEN_CAUGHT) {
        drawOverlay(ctx, [
          { text: 'KETAHUAN!', font: 'bold 48px sans-serif', color: COLORS.alarm },
          { text: 'Penjaga menangkapmu di lorong.', font: '22px sans-serif' },
          { text: `Lantai ${world.levelIndex + 1}  •  Relik: ${world.relics.length - relicsLeft(world)}/${world.relics.length}`, font: '20px sans-serif' },
        ], 'Tekan R atau Spasi untuk coba lagi');
      }
    },
  };
}
