/*
 * Draws the four phone-screen states onto a 2D canvas, used as the emissive
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

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  const lines = [];
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return lines.length;
}

function drawBackground(ctx) {
  const grad = ctx.createRadialGradient(W * 0.35, 0, 40, W * 0.35, 0, H * 0.9);
  grad.addColorStop(0, "rgba(244, 160, 168, 0.4)");
  grad.addColorStop(1, COLORS.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawKicker(ctx, text, y) {
  ctx.font = "600 22px 'Barlow Condensed', sans-serif";
  ctx.fillStyle = COLORS.textMuted;
  ctx.textAlign = "center";
  ctx.letterSpacing = "2px";
  ctx.fillText(text.toUpperCase(), W / 2, y);
  ctx.letterSpacing = "0px";
}

// ---------- Screen 1: pose guide ----------
function drawPoseScreen(ctx) {
  drawBackground(ctx);

  ctx.font = "700 20px 'Barlow', sans-serif";
  ctx.textAlign = "center";
  const badgeText = "POSE 1/3";
  ctx.font = "700 18px 'Barlow', sans-serif";
  const badgeW = ctx.measureText(badgeText).width + 56;
  roundRect(ctx, W / 2 - badgeW / 2, 162, badgeW, 46, 23);
  ctx.fillStyle = COLORS.accentSoft;
  ctx.fill();
  ctx.strokeStyle = "rgba(215,38,56,0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = COLORS.accent;
  ctx.fillText(badgeText, W / 2, 192);

  ctx.font = "700 56px 'Barlow Condensed', sans-serif";
  ctx.fillStyle = COLORS.text;
  ctx.fillText("Face", W / 2, 280);

  ctx.font = "400 22px 'Barlow', sans-serif";
  ctx.fillStyle = COLORS.textMuted;
  wrapText(
    ctx,
    "Face caméra, bras légèrement écartés — torse nu pour poitrine/abdos.",
    W / 2,
    328,
    380,
    32
  );

  // silhouette icon
  ctx.save();
  ctx.translate(W / 2, 560);
  ctx.strokeStyle = COLORS.accent;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, -140, 52, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-78, -60);
  ctx.bezierCurveTo(-78, -110, -40, -150, 0, -150);
  ctx.bezierCurveTo(40, -150, 78, -110, 78, -60);
  ctx.lineTo(102, 148);
  ctx.lineTo(58, 148);
  ctx.lineTo(42, 232);
  ctx.lineTo(6, 232);
  ctx.lineTo(6, 148);
  ctx.lineTo(-42, 232);
  ctx.lineTo(-78, 232);
  ctx.lineTo(-94, 148);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  ctx.font = "700 24px 'Barlow', sans-serif";
  roundRect(ctx, 60, 940, W - 120, 62, 16);
  ctx.fillStyle = COLORS.accent;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Ouvrir la caméra", W / 2, 980);

  roundRect(ctx, 60, 1018, W - 120, 56, 16);
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = "600 20px 'Barlow', sans-serif";
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText("Importer une photo", W / 2, 1053);
}

// ---------- Screen 2: score ----------
function drawScoreScreen(ctx) {
  drawBackground(ctx);
  drawKicker(ctx, "Ton score physique", 172);

  const cx = W / 2;
  const cy = 380;
  const r = 190;
  ctx.lineWidth = 26;
  ctx.strokeStyle = COLORS.border;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI * 1.5);
  ctx.stroke();

  ctx.strokeStyle = COLORS.accent;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.83);
  ctx.stroke();
  ctx.lineCap = "butt";

  ctx.font = "700 110px 'Barlow Condensed', sans-serif";
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = "center";
  ctx.fillText("83", cx, cy + 20);
  ctx.font = "500 28px 'Barlow', sans-serif";
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText("/100", cx, cy + 66);

  ctx.font = "600 34px 'Barlow Condensed', sans-serif";
  ctx.fillStyle = COLORS.accent;
  ctx.fillText("Forme élite", cx, cy + r + 90);

  const tagY = 780;
  const tagW = (W - 120 - 24) / 2;
  const tagH = 150;

  roundRect(ctx, 60, tagY, tagW, tagH, 14);
  ctx.fillStyle = COLORS.accentSoft;
  ctx.fill();
  ctx.strokeStyle = "rgba(215,38,56,0.3)";
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.font = "500 18px 'Barlow', sans-serif";
  ctx.fillStyle = COLORS.accent;
  ctx.fillText("Point fort", 84, tagY + 44);
  ctx.font = "700 26px 'Barlow', sans-serif";
  ctx.fillStyle = COLORS.text;
  ctx.fillText("Dos · 9/10", 84, tagY + 84);

  const tag2X = 60 + tagW + 24;
  roundRect(ctx, tag2X, tagY, tagW, tagH, 14);
  ctx.fillStyle = COLORS.warnSoft;
  ctx.fill();
  ctx.strokeStyle = "rgba(207,220,255,0.8)";
  ctx.stroke();
  ctx.font = "500 18px 'Barlow', sans-serif";
  ctx.fillStyle = COLORS.warn;
  ctx.fillText("À travailler", tag2X + 24, tagY + 44);
  ctx.font = "700 26px 'Barlow', sans-serif";
  ctx.fillStyle = COLORS.text;
  ctx.fillText("Abdos · 4.8/10", tag2X + 24, tagY + 84);
}

// ---------- Screen 3: radar ----------
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

  ctx.font = "700 90px 'Barlow Condensed', sans-serif";
  ctx.fillStyle = COLORS.accent;
  ctx.textAlign = "center";
  ctx.fillText("+9", W / 2, 272);
  ctx.font = "600 20px 'Barlow', sans-serif";
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

  ctx.font = "500 17px 'Barlow', sans-serif";
  ctx.fillStyle = COLORS.textMuted;
  RADAR_LABELS.forEach((label, i) => {
    const p = radarPoint(cx, cy, maxR + 46, i, 1);
    ctx.fillText(label, p.x, p.y + 6);
  });
}

// ---------- Screen 4: stats + exercise ----------
const STATS = [
  ["Symétrie", "71/100"],
  ["V-taper", "88.8/100"],
  ["Fourchette %BF", "10.8–23.2%"],
  ["Densité", "8.8/10"],
];

function drawStatsScreen(ctx) {
  drawBackground(ctx);
  drawKicker(ctx, "Stats clés", 172);

  const gridTop = 202;
  const gap = 20;
  const cardW = (W - 120 - gap) / 2;
  const cardH = 130;

  STATS.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 60 + col * (cardW + gap);
    const y = gridTop + row * (cardH + gap);
    roundRect(ctx, x, y, cardW, cardH, 14);
    ctx.fillStyle = COLORS.bgCard;
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.font = "600 15px 'Barlow', sans-serif";
    ctx.fillStyle = COLORS.textFaint;
    ctx.letterSpacing = "0.8px";
    ctx.fillText(label.toUpperCase(), x + 22, y + 42);
    ctx.letterSpacing = "0px";
    ctx.font = "700 38px 'Barlow Condensed', sans-serif";
    ctx.fillStyle = COLORS.text;
    ctx.fillText(value, x + 22, y + 92);
  });

  const hintY = gridTop + 2 * cardH + gap + 60;
  ctx.font = "400 21px 'Barlow', sans-serif";
  ctx.fillStyle = COLORS.textMuted;
  ctx.textAlign = "left";
  wrapText(
    ctx,
    "Fais progresser tes fessiers — ton gain le plus rapide.",
    60,
    hintY,
    W - 120,
    30
  );

  const exY = hintY + 60;
  const exH = 110;
  roundRect(ctx, 60, exY, W - 120, exH, 16);
  ctx.fillStyle = COLORS.bgCard;
  ctx.fill();
  ctx.strokeStyle = COLORS.border;
  ctx.stroke();

  roundRect(ctx, 82, exY + 22, 66, 66, 14);
  ctx.fillStyle = COLORS.accentSoft;
  ctx.fill();
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(96, exY + 70);
  ctx.lineTo(112, exY + 42);
  ctx.lineTo(124, exY + 58);
  ctx.lineTo(134, exY + 34);
  ctx.lineTo(146, exY + 62);
  ctx.stroke();

  ctx.font = "700 25px 'Barlow', sans-serif";
  ctx.fillStyle = COLORS.text;
  ctx.fillText("Barbell glute bridge", 168, exY + 46);
  ctx.font = "500 19px 'Barlow', sans-serif";
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText("3×10–12 · Fessiers", 168, exY + 78);
}

const DRAWERS = {
  pose: drawPoseScreen,
  score: drawScoreScreen,
  radar: drawRadarScreen,
  stats: drawStatsScreen,
};

const canvasCache = new Map();

export function getScreenCanvas(state) {
  if (canvasCache.has(state)) return canvasCache.get(state);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  (DRAWERS[state] || drawScoreScreen)(ctx);
  canvasCache.set(state, canvas);
  return canvas;
}

export const SCREEN_STATES = ["pose", "score", "radar", "stats"];
