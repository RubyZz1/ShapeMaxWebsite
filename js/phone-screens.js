/*
 * Draws the hero phone's radar screen onto a 2D canvas, used as the emissive
 * texture for the 3D phone's screen mesh (js/phone3d.js). Mirrors the content
 * of the CSS .pscreen mockups so the 3D phone shows the same app screens.
 */

const COLORS = {
  bg: "#ffffff",
  bgCard: "#ffffff",
  border: "#e7e7e7",
  text: "#1b1b1b",
  textMuted: "#6b6b6b",
  textFaint: "#9a9a9a",
  accent: "#d72638",
  accentSoft: "rgba(215, 38, 56, 0.14)",
  warn: "#1b1b1b",
  warnSoft: "rgba(207, 220, 255, 0.5)",
};

const W = 520;
const H = 1120;

function drawBackground(ctx) {
  const grad = ctx.createRadialGradient(W * 0.35, 0, 40, W * 0.35, 0, H * 0.9);
  grad.addColorStop(0, "rgba(244, 160, 168, 0.4)");
  grad.addColorStop(1, COLORS.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawKicker(ctx, text, y) {
  ctx.font = "600 22px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = COLORS.textMuted;
  ctx.textAlign = "center";
  ctx.letterSpacing = "2px";
  ctx.fillText(text.toUpperCase(), W / 2, y);
  ctx.letterSpacing = "0px";
}

// ---------- Radar screen (hero phone) ----------
const RADAR_LABELS = [
  "Épaules",
  "Poitrine",
  "Dos",
  "Bras",
  "Av.-bras",
  "Abdos",
  "Fessiers",
  "Jambes",
];
const RADAR_VALUES = [0.85, 0.82, 0.95, 0.78, 0.8, 0.55, 0.68, 0.78];

function radarPoint(cx, cy, radius, index, fraction) {
  const angle = -Math.PI / 2 + (index * Math.PI) / 4;
  return {
    x: cx + Math.cos(angle) * radius * fraction,
    y: cy + Math.sin(angle) * radius * fraction,
  };
}

function drawRadarScreen(ctx) {
  drawBackground(ctx);
  drawKicker(ctx, "Radar musculaire", 172);

  ctx.font = "700 90px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = COLORS.accent;
  ctx.textAlign = "center";
  ctx.fillText("+9", W / 2, 272);
  ctx.font = "600 20px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = COLORS.textMuted;
  ctx.letterSpacing = "1.5px";
  ctx.fillText("VS TON DERNIER SCAN", W / 2, 310);
  ctx.letterSpacing = "0px";

  const cx = W / 2;
  const cy = 660;
  const maxR = 300;

  for (const frac of [0.34, 0.67, 1.0]) {
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const p = radarPoint(cx, cy, maxR, i % 8, frac);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = "rgba(27,27,27,0.1)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const p = radarPoint(cx, cy, maxR, i, 1);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = "rgba(27,27,27,0.1)";
    ctx.stroke();
  }

  ctx.beginPath();
  RADAR_VALUES.forEach((v, i) => {
    const p = radarPoint(cx, cy, maxR, i, v);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(215,38,56,0.22)";
  ctx.fill();
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 3;
  ctx.stroke();

  RADAR_VALUES.forEach((v, i) => {
    const p = radarPoint(cx, cy, maxR, i, v);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.accent;
    ctx.fill();
  });

  ctx.font = "500 17px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = COLORS.textMuted;
  RADAR_LABELS.forEach((label, i) => {
    const p = radarPoint(cx, cy, maxR + 46, i, 1);
    ctx.fillText(label, p.x, p.y + 6);
  });
}

const canvasCache = new Map();

export function getScreenCanvas(state) {
  if (canvasCache.has(state)) return canvasCache.get(state);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  drawRadarScreen(ctx);
  canvasCache.set(state, canvas);
  return canvas;
}
