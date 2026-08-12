"use strict";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

const player = {
  x: 205,
  y: 525
};

let mouse = {
  x: 690,
  y: 230
};

let ball;
let hoop;
let score;
let shots;
let streak;
let time;
let last;
let message;
let flash;
let gameOver = false;

function reset() {
  ball = {
    x: player.x + 42,
    y: player.y - 70,
    r: 15,
    vx: 0,
    vy: 0,
    flying: false,
    made: false,
    rot: 0
  };

  hoop = {
    x: 760,
    y: 205,
    r: 40,
    dir: 1,
    speed: 105
  };

  score = 0;
  shots = 0;
  streak = 0;
  time = 0;
  message = "AIM AT THE MOVING RIM";
  flash = 0;
  gameOver = false;
}

reset();

function resizeCanvas() {
  const scale = Math.min(innerWidth / W, innerHeight / H);

  canvas.style.width = `${W * scale}px`;
  canvas.style.height = `${H * scale}px`;
}

addEventListener("resize", resizeCanvas);
resizeCanvas();

function pointer(e) {
  const rect = canvas.getBoundingClientRect();

  mouse.x = ((e.clientX - rect.left) * W) / rect.width;
  mouse.y = ((e.clientY - rect.top) * H) / rect.height;
}

canvas.addEventListener("pointermove", pointer);

addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    shoot();
  }

  if (e.key.toLowerCase() === "r") {
    reset();
  }
});

function shoot() {
  if (ball.flying || gameOver) return;

  const dx = mouse.x - ball.x;
  const dy = mouse.y - ball.y;
  const distance = Math.hypot(dx, dy);

  const speed = Math.min(900, Math.max(610, distance * 1.12));

  ball.vx = (dx / distance) * speed;
  ball.vy = (dy / distance) * speed - 255;

  ball.flying = true;
  ball.made = false;
  shots++;

  message = "SHOOTING...";
}

function update(dt) {
  if (gameOver) return;

  time += dt;
  flash = Math.max(0, flash - dt);

  hoop.x += hoop.dir * hoop.speed * dt;

  if (hoop.x > 925 || hoop.x < 595) {
    hoop.dir *= -1;
    hoop.x = Math.max(595, Math.min(925, hoop.x));
  }

  hoop.y = 204 + Math.sin(time * 1.8) * 36;

  if (!ball.flying) {
    ball.x = player.x + 42;
    ball.y = player.y - 70;
    return;
  }

  const oldY = ball.y;

  ball.vy += 640 * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.rot += (ball.vx * dt) / 70;

  const ballPassedThroughRim =
    oldY < hoop.y + 2 &&
    ball.y >= hoop.y + 2 &&
    ball.vy > 0 &&
    Math.abs(ball.x - hoop.x) < hoop.r - ball.r * 0.55;

  if (!ball.made && ballPassedThroughRim) {
    ball.made = true;

    // One point per made shot.
    score++;
    streak++;

    flash = 0.28;
    message = streak > 1 ? `${streak} IN A ROW!` : "SWISH!";

    // Reset the game after reaching 11 points.
    if (score >= 11) {
      gameOver = true;
      message = "YOU WIN! 11 POINTS!";
      flash = 1;

      setTimeout(() => {
        reset();
      }, 2000);
    }
  }

  const boardX = hoop.x + 58;

  if (
    ball.x + ball.r > boardX &&
    ball.x - ball.r < boardX + 12 &&
    ball.y > hoop.y - 82 &&
    ball.y < hoop.y + 28 &&
    ball.vx > 0
  ) {
    ball.vx *= -0.62;
  }

  for (const rimX of [hoop.x - hoop.r, hoop.x + hoop.r]) {
    const distance = Math.hypot(ball.x - rimX, ball.y - hoop.y);

    if (distance < ball.r + 6 && distance > 0) {
      ball.x += ((ball.x - rimX) / distance) * (ball.r + 6 - distance);
      ball.vx *= -0.62;
      ball.vy *= -0.52;
    }
  }

  if (
    ball.y > H + 70 ||
    ball.x < -60 ||
    ball.x > W + 60
  ) {
    ball.flying = false;

    if (!ball.made) {
      streak = 0;
      message = "MISS — LINE UP THE NEXT ONE";
    }
  }
}

function line(x1, y1, x2, y2, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawCourt() {
  const gradient = ctx.createLinearGradient(0, 70, 0, H);

  gradient.addColorStop(0, "#d9924d");
  gradient.addColorStop(1, "#7d351f");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 70, W, H - 70);

  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 ? "#b85d32" : "#d77d42";
    ctx.fillRect(i * 75, 70, 38, H - 70);
  }

  ctx.fillStyle = "#111a2c";
  ctx.fillRect(0, 0, W, 70);

  ctx.fillStyle = "#fbfbff";
  ctx.font = "900 60px Arial";
  ctx.textAlign = "center";
  ctx.fillText("BASKETBALL", W / 2, 50);
}

function draw() {
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, W, H);

  drawCourt();

  ctx.fillStyle = "#fbfbff";
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 20, 30);
  ctx.fillText(`Shots: ${shots}`, 20, 60);

  ctx.translate(hoop.x, hoop.y);
  ctx.rotate(0);
  ctx.strokeStyle = "#ff6b6b";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, hoop.r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(-hoop.r, -6, hoop.r * 2, 12);

  ctx.resetTransform();

  if (ball.flying) {
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.rot);
    ctx.fillStyle = "#ff6b6b";
    ctx.beginPath();
    ctx.arc(0, 0, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, ball.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.5})`;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.fillStyle = "#fbfbff";
  ctx.font = "24px Arial";
  ctx.textAlign = "center";
  ctx.fillText(message, W / 2, H - 20);
}

let last = performance.now();

function gameLoop(now) {
  const dt = Math.min((now - last) / 1000, 0.016);
  last = now;

  update(dt);
  draw();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
  