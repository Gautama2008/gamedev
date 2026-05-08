// ── Elements ──────────────────────────────────────────────────
const menuScreen = document.getElementById('menuScreen');
const gameScreen = document.getElementById('gameScreen');
const canvas     = document.getElementById('gameCanvas');
const ctx        = canvas.getContext('2d');
const overlay    = document.getElementById('overlay');
const ovTitle    = document.getElementById('ov-title');
const ovBody     = document.getElementById('ov-body');
const ovRestart  = document.getElementById('ov-restart');
const ovExit     = document.getElementById('ov-exit');
const scoreEl    = document.getElementById('score-val');
const levelEl    = document.getElementById('level-badge');
const livesEl    = document.getElementById('lives');

// ── Level config ──────────────────────────────────────────────
const LEVELS = [
  {
    speed: 5, spawnRate: 110, flyChance: 0,
    bgTop: '#87CEEB', bgBot: '#c8f5a0', groundColor: '#5DBB63',
    obstacleColors: ['#e74c3c', '#e67e22'],
    lives: 3, label: 'Level 1 – Padang Rumput'
  },
  {
    speed: 7, spawnRate: 95, flyChance: 0,
    bgTop: '#FFD700', bgBot: '#FFA500', groundColor: '#cc7a00',
    obstacleColors: ['#9b59b6', '#2ecc71', '#e74c3c'],
    lives: 3, label: 'Level 2 – Padang Pasir'
  },
  {
    speed: 9, spawnRate: 80, flyChance: 0.25,
    bgTop: '#FF6B9D', bgBot: '#C44569', groundColor: '#8e1a3d',
    obstacleColors: ['#00cec9', '#fdcb6e', '#e17055'],
    lives: 3, label: 'Level 3 – Hutan Merah'
  },
  {
    speed: 11, spawnRate: 65, flyChance: 0.35,
    bgTop: '#2d3436', bgBot: '#6c5ce7', groundColor: '#4a00a0',
    obstacleColors: ['#fd79a8', '#55efc4', '#a29bfe'],
    lives: 2, label: 'Level 4 – Galaksi Ungu'
  },
  {
    speed: 14, spawnRate: 50, flyChance: 0.45,
    bgTop: '#0f0c29', bgBot: '#302b63', groundColor: '#24243e',
    obstacleColors: ['#e17055', '#74b9ff', '#a29bfe', '#fd79a8'],
    lives: 1, label: 'Level 5 – Malam Abadi'
  },
];

// ── Constants ─────────────────────────────────────────────────
const GROUND_Y   = 210;
const BUNNY_W    = 44;
const BUNNY_H    = 54;
const GRAVITY    = 0.55;
const JUMP_FORCE = -13;

// ── State ─────────────────────────────────────────────────────
let bunny, obstacles, clouds, score, level, lives, gameRunning, animId, frameCount, invincible, startLevel;

// ── Init ──────────────────────────────────────────────────────
function initGame(startLv) {
  startLevel = startLv;
  level      = startLv;
  bunny      = { x: 80, y: GROUND_Y - BUNNY_H, vy: 0, onGround: true, jumpCount: 0 };
  obstacles  = [];
  clouds     = [{ x: 200, y: 40, w: 80 }, { x: 500, y: 25, w: 110 }, { x: 720, y: 55, w: 70 }];
  score      = 0;
  lives      = LEVELS[level].lives;
  frameCount = 0;
  invincible = 0;
  updateHUD();
}

function updateHUD() {
  scoreEl.textContent = Math.floor(score);
  levelEl.textContent = LEVELS[level].label;
  livesEl.textContent = '❤️'.repeat(lives) + '🖤'.repeat(LEVELS[startLevel].lives - lives);
}

// ── Draw: Background ──────────────────────────────────────────
function drawBackground() {
  const cfg  = LEVELS[level];
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0, cfg.bgTop);
  grad.addColorStop(1, cfg.bgBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, GROUND_Y);
  ctx.fillStyle = cfg.groundColor;
  ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(canvas.width, GROUND_Y);
  ctx.stroke();
}

// ── Draw: Clouds ──────────────────────────────────────────────
function drawClouds() {
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  clouds.forEach(c => {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.w / 2, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x - c.w * 0.2, c.y + 8, c.w * 0.3, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x + c.w * 0.2, c.y + 8, c.w * 0.3, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ── Draw: Bunny ───────────────────────────────────────────────
function drawBunny() {
  const x = bunny.x, y = bunny.y;
  if (invincible > 0 && Math.floor(invincible / 4) % 2 === 0) return;

  ctx.fillStyle = '#f5f5f5';
  ctx.beginPath();
  ctx.ellipse(x + BUNNY_W / 2, y + BUNNY_H * 0.62, BUNNY_W * 0.42, BUNNY_H * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(x + BUNNY_W / 2, y + BUNNY_H * 0.3, BUNNY_W * 0.32, BUNNY_H * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f5f5f5';
  ctx.beginPath(); ctx.ellipse(x + BUNNY_W * 0.35, y + BUNNY_H * 0.08, 6, 16, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + BUNNY_W * 0.62, y + BUNNY_H * 0.06, 6, 16,  0.2, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#ffb3c6';
  ctx.beginPath(); ctx.ellipse(x + BUNNY_W * 0.35, y + BUNNY_H * 0.08, 3, 10, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + BUNNY_W * 0.62, y + BUNNY_H * 0.06, 3, 10,  0.2, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.arc(x + BUNNY_W * 0.62, y + BUNNY_H * 0.27, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x + BUNNY_W * 0.64, y + BUNNY_H * 0.255, 1.2, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#ff9eb5';
  ctx.beginPath(); ctx.arc(x + BUNNY_W * 0.7, y + BUNNY_H * 0.33, 2.5, 0, Math.PI * 2); ctx.fill();

  const legSwing = bunny.onGround ? Math.sin(frameCount * 0.3) * 8 : 0;
  ctx.fillStyle = '#e0e0e0';
  ctx.beginPath(); ctx.ellipse(x + BUNNY_W * 0.3,  y + BUNNY_H * 0.92 + legSwing, 7, 10,  0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + BUNNY_W * 0.65, y + BUNNY_H * 0.92 - legSwing, 7, 10, -0.3, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x + BUNNY_W * 0.1, y + BUNNY_H * 0.58, 7, 0, Math.PI * 2); ctx.fill();
}

// ── Draw: Obstacle ────────────────────────────────────────────
function drawObstacle(ob) {
  const r = 8;
  ctx.fillStyle   = ob.color;
  ctx.shadowColor = ob.color;
  ctx.shadowBlur  = 12;
  ctx.beginPath();
  ctx.moveTo(ob.x + r, ob.y);
  ctx.lineTo(ob.x + ob.w - r, ob.y);
  ctx.quadraticCurveTo(ob.x + ob.w, ob.y, ob.x + ob.w, ob.y + r);
  ctx.lineTo(ob.x + ob.w, ob.y + ob.h - r);
  ctx.quadraticCurveTo(ob.x + ob.w, ob.y + ob.h, ob.x + ob.w - r, ob.y + ob.h);
  ctx.lineTo(ob.x + r, ob.y + ob.h);
  ctx.quadraticCurveTo(ob.x, ob.y + ob.h, ob.x, ob.y + ob.h - r);
  ctx.lineTo(ob.x, ob.y + r);
  ctx.quadraticCurveTo(ob.x, ob.y, ob.x + r, ob.y);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(ob.x + 6, ob.y + 6, ob.w - 12, 5);

  if (ob.flying) {
    ctx.font = '14px serif';
    ctx.fillText('🪽', ob.x + ob.w / 2 - 8, ob.y - 4);
  }
}

// ── Draw: HUD on canvas ───────────────────────────────────────
function drawHUDCanvas() {
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, canvas.height - 36, canvas.width, 36);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px Segoe UI';
  ctx.fillText(`Skor: ${Math.floor(score)}`, 16, canvas.height - 12);
  ctx.fillText('Kontrol: SPASI / ↑ / Klik  |  Double Jump tersedia', canvas.width / 2 - 130, canvas.height - 12);
}

// ── Spawn obstacle ────────────────────────────────────────────
function spawnObstacle() {
  const cfg    = LEVELS[level];
  const color  = cfg.obstacleColors[Math.floor(Math.random() * cfg.obstacleColors.length)];
  const h      = 28 + Math.random() * 44;
  const w      = 20 + Math.random() * 22;
  const flying = Math.random() < cfg.flyChance;
  const y      = flying ? GROUND_Y - h - 55 - Math.random() * 35 : GROUND_Y - h;
  obstacles.push({ x: canvas.width + 10, y, w, h, color, flying });
}

// ── Collision ─────────────────────────────────────────────────
function checkCollision(ob) {
  const m = 8;
  return (
    bunny.x + m       < ob.x + ob.w &&
    bunny.x + BUNNY_W - m > ob.x    &&
    bunny.y + m       < ob.y + ob.h &&
    bunny.y + BUNNY_H - m > ob.y
  );
}

// ── Jump ──────────────────────────────────────────────────────
function jump() {
  if (bunny.jumpCount < 2) {
    bunny.vy = JUMP_FORCE;
    bunny.onGround = false;
    bunny.jumpCount++;
  }
}

// ── Game loop ─────────────────────────────────────────────────
function gameLoop() {
  if (!gameRunning) return;
  frameCount++;
  const cfg = LEVELS[level];

  score += 0.12 * (level + 1);
  updateHUD();

  if (frameCount % cfg.spawnRate === 0) spawnObstacle();

  obstacles.forEach(ob => ob.x -= cfg.speed);
  obstacles = obstacles.filter(ob => ob.x + ob.w > 0);

  clouds.forEach(c => { c.x -= 0.7; if (c.x + c.w < 0) c.x = canvas.width + c.w; });

  bunny.vy += GRAVITY;
  bunny.y  += bunny.vy;
  if (bunny.y >= GROUND_Y - BUNNY_H) {
    bunny.y        = GROUND_Y - BUNNY_H;
    bunny.vy       = 0;
    bunny.onGround = true;
    bunny.jumpCount = 0;
  }

  if (invincible > 0) {
    invincible--;
  } else {
    for (const ob of obstacles) {
      if (checkCollision(ob)) {
        lives--;
        invincible = 80;
        updateHUD();
        if (lives <= 0) { gameOver(); return; }
        break;
      }
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawClouds();
  obstacles.forEach(drawObstacle);
  drawBunny();
  drawHUDCanvas();

  animId = requestAnimationFrame(gameLoop);
}

// ── Game over ─────────────────────────────────────────────────
function gameOver() {
  gameRunning = false;
  cancelAnimationFrame(animId);
  ovTitle.textContent   = '💀 Game Over!';
  ovBody.innerHTML      = `Skor akhir: <strong>${Math.floor(score)}</strong> &nbsp;|&nbsp; ${LEVELS[level].label}`;
  overlay.style.display = 'flex';
}

// ── Start game ────────────────────────────────────────────────
function startGame(lv) {
  menuScreen.style.display = 'none';
  gameScreen.style.display = 'flex';
  overlay.style.display    = 'none';
  initGame(lv);
  gameRunning = true;
  gameLoop();
}

// ── Overlay buttons ───────────────────────────────────────────
ovRestart.addEventListener('click', () => {
  overlay.style.display = 'none';
  initGame(startLevel);
  gameRunning = true;
  gameLoop();
});

ovExit.addEventListener('click', () => {
  gameRunning = false;
  cancelAnimationFrame(animId);
  overlay.style.display    = 'none';
  gameScreen.style.display = 'none';
  menuScreen.style.display = 'flex';
});

// ── Input ─────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.code === 'Space' || e.code === 'ArrowUp') && gameRunning) {
    e.preventDefault();
    jump();
  }
});
canvas.addEventListener('click',      () => { if (gameRunning) jump(); });
canvas.addEventListener('touchstart', e => { e.preventDefault(); if (gameRunning) jump(); }, { passive: false });
