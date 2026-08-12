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
    rot: 0,
    trail: []
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

  mouse.x = (e.clientX - rect.left) * W / rect.width;
  mouse.y = (e.clientY - rect.top) * H / rect.height;
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
    // clear trail when resting
    ball.trail = [];
    return;
  }

  const oldY = ball.y;

  ball.vy += 640 * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.rot += (ball.vx * dt) / 70;

  // add to trail
  if (!ball.trail) ball.trail = [];
  ball.trail.push({ x: ball.x, y: ball.y, life: 1 });
  // fade + limit
  for (let i = 0; i < ball.trail.length; i++) ball.trail[i].life -= dt * 2.6;
  if (ball.trail.length > 18) ball.trail.splice(0, ball.trail.length - 18);
  ball.trail = ball.trail.filter(t => t.life > 0);

  const ballPassedThroughRim =
    oldY < hoop.y + 2 &&
    ball.y >= hoop.y + 2 &&
    ball.vy > 0 &&
    Math.abs(ball.x - hoop.x) < hoop.r - ball.r * 0.55;

  if (!ball.made && ballPassedThroughRim) {
    ball.made = true;
    score += 1;
    streak++;

    message = streak > 1 ? `${streak} IN A ROW!` : "SWISH!";
    flash = 0.28;

    // check win
    if (score >= 12) {
      gameOver = true;
      ball.flying = false;
      message = "YOU WIN!";
      flash = 0.8;
    }
  }

  // Fallback scoring: if ball goes below rim inside hoop x-range, count as make
  if (!ball.made) {
    const insideX = Math.abs(ball.x - hoop.x) < hoop.r - ball.r * 0.55;
    if (ball.y > hoop.y + 6 && insideX && ball.vy > -120) {
      ball.made = true;
      score += 1;
      streak++;
      message = streak > 1 ? `${streak} IN A ROW!` : "SWISH!";
      flash = 0.28;

      if (score >= 12) {
        gameOver = true;
        ball.flying = false;
        message = "YOU WIN!";
        flash = 0.8;
      }
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
    const d = Math.hypot(ball.x - rimX, ball.y - hoop.y);

    if (d < ball.r + 6 && d > 0) {
      ball.x += ((ball.x - rimX) / d) * (ball.r + 6 - d);
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
      // reset score on miss
      score = 0;
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
  ctx.font = "900 25px system-ui";
  ctx.fillText("MOVING HOOP", 35, 45);

  ctx.fillStyle = "#8aa0c7";
  ctx.font = "700 14px system-ui";
  ctx.fillText("PRO ARENA", 250, 43);

  ctx.strokeStyle = "#f7e4bd";
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 70, W, H - 70);

  ctx.beginPath();
  ctx.arc(0, H / 2 + 55, 245, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(19,34,82,.55)";
  ctx.fillRect(0, 280, 180, 300);
  ctx.strokeRect(0, 280, 180, 300);

  ctx.beginPath();
  ctx.arc(550, 410, 72, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(19,34,82,.62)";
  ctx.font = "900 56px system-ui";
  ctx.fillText("24", 503, 430);
}

function drawHoop() {
  ctx.fillStyle = "#242c3a";
  ctx.fillRect(hoop.x + 72, hoop.y - 120, 20, 180);
  ctx.fillRect(hoop.x + 65, hoop.y + 42, 115, 11);

  ctx.fillStyle = "rgba(220,237,255,.35)";
  ctx.fillRect(hoop.x + 50, hoop.y - 82, 16, 100);

  ctx.strokeStyle = "#eaf6ff";
  ctx.lineWidth = 4;
  ctx.strokeRect(hoop.x + 50, hoop.y - 82, 16, 100);

  line(
    hoop.x + 57,
    hoop.y - 16,
    hoop.x + 57,
    hoop.y + 8,
    4,
    "#e94343"
  );

  ctx.strokeStyle = "#f1f5f9";
  ctx.lineWidth = 2;

  for (let i = -30; i <= 30; i += 12) {
    line(
      hoop.x + i,
      hoop.y + 6,
      hoop.x + i * 0.65,
      hoop.y + 48,
      2,
      "#e2e8f0"
    );
  }

  // rim glow
  ctx.save();
  ctx.strokeStyle = "#ff5a36";
  ctx.lineWidth = 8;
  ctx.shadowBlur = 18;
  ctx.shadowColor = "rgba(255,90,54,0.45)";
  ctx.beginPath();
  ctx.ellipse(hoop.x, hoop.y, hoop.r, 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPlayer() {
  ctx.fillStyle = "#18213b";
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 54, 72, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e7ae82";
  ctx.beginPath();
  ctx.arc(player.x, player.y - 95, 25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0d244a";
  ctx.fillRect(player.x - 34, player.y - 66, 68, 96);

  ctx.fillStyle = "#f0c546";
  ctx.font = "900 35px system-ui";
  ctx.fillText("23", player.x - 21, player.y);

  line(
    player.x - 28,
    player.y + 28,
    player.x - 42,
    player.y + 65,
    16,
    "#172030"
  );

  line(
    player.x + 25,
    player.y + 28,
    player.x + 42,
    player.y + 65,
    16,
    "#172030"
  );

  if (!ball.flying) {
    line(
      player.x + 23,
      player.y - 50,
      ball.x - 8,
      ball.y + 12,
      13,
      "#e7ae82"
    );
  }
}

function drawBall() {
  // draw trail
  if (ball.trail && ball.trail.length) {
    for (let i = 0; i < ball.trail.length; i++) {
      const t = ball.trail[i];
      ctx.beginPath();
      ctx.globalAlpha = Math.max(0, t.life) * 0.45;
      ctx.fillStyle = "#df6d28";
      ctx.arc(t.x, t.y, ball.r * (0.6 * (t.life)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.rotate(ball.rot);

  ctx.fillStyle = "#df6d28";
  ctx.beginPath();
  ctx.arc(0, 0, ball.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#552610";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, ball.r, Math.PI * 0.42, Math.PI * 1.58);
  ctx.stroke();

  line(-ball.r, 0, ball.r, 0, 2, "#552610");

  ctx.restore();
}

function drawHUD() {
  // rounded HUD background
  const hx = 760, hy = 14, hw = 315, hh = 43, hr = 10;
  ctx.save();
  ctx.fillStyle = "rgba(8,15,32,.78)";
  ctx.shadowBlur = 12;
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.beginPath();
  ctx.moveTo(hx + hr, hy);
  ctx.arcTo(hx + hw, hy, hx + hw, hy + hh, hr);
  ctx.arcTo(hx + hw, hy + hh, hx, hy + hh, hr);
  ctx.arcTo(hx, hy + hh, hx, hy, hr);
  ctx.arcTo(hx, hy, hx + hw, hy, hr);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.font = "800 17px system-ui";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`SCORE  ${score}`, 780, 42);

  ctx.fillStyle = "#f6b94d";
  ctx.fillText(`SHOTS  ${shots}`, 920, 42);

  if (!ball.flying) {
    ctx.setLineDash([7, 7]);
    line(ball.x, ball.y, mouse.x, mouse.y, 2, "rgba(255,255,255,.55)");
    ctx.setLineDash([]);
  }

  ctx.textAlign = "center";
  ctx.font = "900 22px system-ui";
  ctx.fillStyle = flash ? "#fff36b" : "#f8fafc";
  ctx.fillText(message, W / 2, 105);
  ctx.textAlign = "left";
}

function render() {
  drawCourt();
  drawHoop();
  drawPlayer();
  drawBall();
  drawHUD();

  if (gameOver) {
    // overlay
    ctx.save();
    ctx.fillStyle = "rgba(2,6,23,0.7)";
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "900 72px system-ui";
    ctx.shadowColor = "rgba(255,220,120,0.2)";
    ctx.shadowBlur = 24;
    ctx.fillText("YOU WIN!", W / 2, H / 2 - 10);

    ctx.shadowBlur = 0;
    ctx.font = "600 20px system-ui";
    ctx.fillStyle = "#f1f5f9";
    ctx.fillText("Press R to play again", W / 2, H / 2 + 36);
    ctx.textAlign = "left";
    ctx.restore();
  }
}

function loop(now) {
  const dt = Math.min(0.03, (now - last) / 1000 || 0);

  last = now;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
