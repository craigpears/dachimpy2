// Foraging's look, for any board that plays it: the clifftop lagoon's bank, where the capybara's
// stuck, and later the foraging island. The puzzle itself, its rules, is src/foraging.ts: one copy
// of it; this only draws a board of it in 3D wherever its caller puts it, and plays it by the real
// keys. It knows nothing of the den either (it imports only three.js and the rules), so a test page
// can play it on its own (foraging-test.html).
import * as THREE from 'three';
import { Forage, H, W, SIZES, fallen } from '../foraging.js';

/* Drawn after Puzzle Pirates' own (YPPedia's "Foraging" and "Official:Foraging" pictures, looked at
   10 Nov): the board stands in the jungle, the leaves showing through wherever it's empty, a thin
   pale frame round it and the bananas down its left side. The five tiles are square, each a little
   bevelled: rock a heap of pale lavender-white stones; foliage big bright leaves and grass on dark
   green; wood a tangle of pale grey-brown driftwood and roots; sand pale gold with a little orange
   starfish, a green sprig and a white pebble; soil dark red-brown clods with green shoots. The
   special pieces sit on the dark jungle with a bright cyan outline round them: the machete a steel
   blade with a tan grip over a spiky green burst; the shovel stuck down into a brown clod of earth;
   the monkey a tiki-like wooden face, purple eyes and a big toothy grimace; the earthquake a round
   ball of earth split by a yellow-green crack in a cyan ring; the ant a red ant with the yellow
   number of bites it has left on its back. The crate is a little slatted wooden crate full of
   mangoes, the basket a wicker basket heaped with red fruit, the chest an iron-studded chest
   spilling coloured gems. The cursor is a loop of dark green vine round its 2x2 (1x1 over a
   special piece).

   The board's local frame: x along the rows (column 0 on the left), y up (row 0 at the top), the
   pieces standing out toward +z. One square is one unit; the caller scales it. */

const tex = (w, h, draw) => {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
// A piece's face: lit like the rest, and glowing a little with its own picture, so the board reads as
// bright and clear as the real one's even in the den's night.
const faceMat = (map, roughness = 0.75) => new THREE.MeshStandardMaterial({ map, roughness, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.28 });
const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16), ch = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f))); return `rgb(${ch(16)},${ch(8)},${ch(0)})`; };
// A little dice of our own for the textures' scatter, so every board looks the same.
const dice = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const blob = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); };
const leaf = (g, x, y, len, wid, a, fill, vein) => {
  g.save(); g.translate(x, y); g.rotate(a);
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, -wid, len, 0); g.quadraticCurveTo(len * 0.5, wid, 0, 0); g.closePath();
  g.fillStyle = fill; g.fill();
  if (vein) { g.strokeStyle = vein; g.lineWidth = 2; g.beginPath(); g.moveTo(len * 0.05, 0); g.lineTo(len * 0.9, 0); g.stroke(); }
  g.restore();
};
// A square tile's bevel: a dark edge, lighter at the top left and darker at the bottom right.
function bevel(g, w, base) {
  g.save();
  g.lineWidth = 7;
  g.strokeStyle = shade(base, 0.35); g.strokeRect(3.5, 3.5, w - 7, w - 7);
  g.lineWidth = 4;
  g.strokeStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.moveTo(8, w - 9); g.lineTo(8, 8); g.lineTo(w - 9, 8); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.moveTo(w - 8, 9); g.lineTo(w - 8, w - 8); g.lineTo(9, w - 8); g.stroke();
  g.restore();
}

// ---------- the five tiles ----------
const TILE_BASE = ['#8f8aa8', '#1f5a22', '#4a3a2a', '#d9c48c', '#5c3424'];
const tileDraw = [
  // Rock: a heap of rounded stones, pale lavender-white, shaded mauve, dark in the cracks.
  (g, w) => {
    g.fillStyle = '#2e2838'; g.fillRect(0, 0, w, w);
    const R = dice(11);
    for (const [x, y, rx, ry] of [[34, 30, 30, 24], [92, 26, 30, 22], [64, 64, 28, 24], [26, 96, 26, 26], [98, 92, 28, 30], [62, 112, 22, 14], [118, 58, 14, 22], [8, 58, 14, 20]]) {
      blob(g, x, y, rx, ry, R() * 2);
      const gr = g.createRadialGradient(x - rx * 0.35, y - ry * 0.4, 2, x, y, Math.max(rx, ry) * 1.1);
      gr.addColorStop(0, '#fbfbff'); gr.addColorStop(0.45, '#d4cff0'); gr.addColorStop(1, '#7a6ea0');
      g.fillStyle = gr; g.fill();
      g.lineWidth = 2.5; g.strokeStyle = '#3c3450'; g.stroke();
      g.fillStyle = 'rgba(120,112,160,0.45)';
      for (let i = 0; i < 3; i++) { blob(g, x + (R() - 0.5) * rx, y + (R() - 0.2) * ry * 0.8, 3, 2); g.fill(); }
    }
    bevel(g, w, '#8f8aa8');
  },
  // Foliage: big bright leaves over grass, on deep green.
  (g, w) => {
    const gr = g.createLinearGradient(0, 0, w, w); gr.addColorStop(0, '#2f7a2c'); gr.addColorStop(1, '#123d16');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
    const R = dice(23);
    g.strokeStyle = '#4fae3c'; g.lineWidth = 3;
    for (let i = 0; i < 12; i++) { const x = R() * w, y = w * (0.4 + R() * 0.6); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (R() - 0.5) * 20, y - 30, x + (R() - 0.5) * 30, y - 50 - R() * 20); g.stroke(); }
    for (const [x, y, len, wid, a, c] of [[6, 60, 70, 30, -0.5, '#3c9a33'], [122, 108, 74, 30, -2.6, '#2e8a2a'], [40, 18, 72, 30, 0.7, '#5cc44a'], [58, 100, 76, 36, -1.0, '#7ad85e'], [116, 20, 64, 28, 2.2, '#48b23c'], [14, 120, 60, 24, -0.4, '#5cc44a'], [64, 64, 56, 26, 0.2, '#8ae66a']]) leaf(g, x, y, len, wid, a, c, '#1d5a1c');
    bevel(g, w, '#1f5a22');
  },
  // Wood: pale driftwood sticks and roots crossing every way, grey-brown with dark grain.
  (g, w) => {
    g.fillStyle = '#5a4a3a'; g.fillRect(0, 0, w, w);
    const R = dice(37);
    const stick = (x0, y0, x1, y1, wd) => {
      g.lineCap = 'round';
      g.strokeStyle = '#2a1e14'; g.lineWidth = wd + 5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      const gr = g.createLinearGradient(x0, y0 - wd, x0, y0 + wd); gr.addColorStop(0, '#f0e8da'); gr.addColorStop(0.6, '#c8baa2'); gr.addColorStop(1, '#8a7a66');
      g.strokeStyle = gr; g.lineWidth = wd; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.strokeStyle = 'rgba(70,50,30,0.55)'; g.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { const o = (R() - 0.5) * wd * 0.6; g.beginPath(); g.moveTo(x0 + o, y0 + o * 0.3); g.lineTo(x1 + o, y1 + o * 0.3); g.stroke(); }
    };
    for (const s of [[6, 24, 120, 40, 16], [10, 100, 96, 70, 18], [30, 6, 54, 124, 14], [84, 8, 110, 120, 16], [4, 64, 124, 90, 12], [60, 60, 124, 10, 10], [14, 124, 70, 84, 10]]) stick(...s);
    bevel(g, w, '#4a3a2a');
  },
  // Sand: pale gold, fine speckle, an orange starfish, a green sprig and a white pebble.
  (g, w) => {
    const gr = g.createLinearGradient(0, 0, w, w); gr.addColorStop(0, '#efe0b0'); gr.addColorStop(1, '#cdb47a');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
    const R = dice(41);
    for (let i = 0; i < 260; i++) { g.fillStyle = R() < 0.5 ? 'rgba(150,120,70,0.35)' : 'rgba(255,250,230,0.5)'; g.fillRect(R() * w, R() * w, 1.6, 1.6); }
    // The starfish, top right.
    g.save(); g.translate(86, 34); g.rotate(0.3);
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6 : 15; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    g.closePath(); g.fillStyle = '#e8743a'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#8a3a18'; g.stroke();
    g.restore();
    // A green sprig, top left, and a tuft of grass, bottom right.
    for (const [x, y, s] of [[30, 34, 1], [94, 100, 1.3]]) {
      g.strokeStyle = '#3c8a2a'; g.lineWidth = 3; g.lineCap = 'round';
      for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) { g.beginPath(); g.moveTo(x, y + 10 * s); g.quadraticCurveTo(x + a * 10 * s, y, x + a * 20 * s, y - 14 * s); g.stroke(); }
    }
    // The pebble, bottom left.
    blob(g, 42, 104, 15, 11);
    const pg = g.createRadialGradient(37, 99, 2, 42, 104, 16); pg.addColorStop(0, '#ffffff'); pg.addColorStop(1, '#b8b4b0');
    g.fillStyle = pg; g.fill(); g.lineWidth = 2; g.strokeStyle = '#6e665e'; g.stroke();
    bevel(g, w, '#d9c48c');
  },
  // Soil: dark red-brown clods with lighter specks and green shoots.
  (g, w) => {
    g.fillStyle = '#3e2016'; g.fillRect(0, 0, w, w);
    const R = dice(53);
    for (let i = 0; i < 26; i++) {
      const x = R() * w, y = R() * w, r = 10 + R() * 14;
      blob(g, x, y, r, r * 0.8, R() * 3);
      const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r); gr.addColorStop(0, '#a8644a'); gr.addColorStop(1, '#663426');
      g.fillStyle = gr; g.fill();
    }
    for (let i = 0; i < 70; i++) { g.fillStyle = R() < 0.5 ? 'rgba(220,170,130,0.5)' : 'rgba(30,14,8,0.6)'; g.fillRect(R() * w, R() * w, 2, 2); }
    g.strokeStyle = '#5ac040'; g.lineWidth = 3; g.lineCap = 'round';
    for (const [x, y] of [[100, 30], [108, 40], [96, 100], [104, 92], [28, 36], [112, 70]]) { g.beginPath(); g.moveTo(x, y + 10); g.quadraticCurveTo(x - 4, y, x + 2, y - 10); g.stroke(); leaf(g, x + 2, y - 4, 10, 4, -0.8, '#6fd456'); }
    bevel(g, w, '#5c3424');
  },
];

// ---------- the special pieces: on the dark jungle, a cyan outline round them ----------
const jungleBack = (g, w) => {
  const gr = g.createLinearGradient(0, 0, w, w); gr.addColorStop(0, '#3a5a34'); gr.addColorStop(1, '#22361e');
  g.fillStyle = gr; g.fillRect(0, 0, w, w);
  g.fillStyle = 'rgba(80,120,150,0.35)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.6, 0); g.lineTo(0, w * 0.5); g.fill();
  g.strokeStyle = '#4a3020'; g.lineWidth = 5; g.strokeRect(2.5, 2.5, w - 5, w - 5);
};
// Stroke a path twice: black, then cyan inside it (the outline every special has).
const cyan = (g, path, wide = 9) => { path(); g.lineJoin = 'round'; g.lineWidth = wide + 6; g.strokeStyle = '#0c1a1c'; g.stroke(); g.lineWidth = wide; g.strokeStyle = '#28d0e0'; g.stroke(); g.lineWidth = 2; g.strokeStyle = '#b8f6fa'; g.stroke(); };
const specialDraw = {
  machete: (g, w) => {
    jungleBack(g, w);
    const burst = () => { g.beginPath(); for (let i = 0; i < 22; i++) { const a = i * Math.PI / 11, r = i % 2 ? 30 : 56; g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r * 0.9); } g.closePath(); };
    cyan(g, burst, 7);
    burst(); g.fillStyle = '#3c8a2a'; g.fill();
    for (let i = 0; i < 11; i++) leaf(g, 64, 64, 48, 6, i * 0.57, i % 2 ? '#7bd65a' : '#4fae3c');
    // The blade, pointing left, its grip on the left: a long steel blade, squared off at the tip.
    g.save(); g.translate(64, 70); g.rotate(-0.08);
    g.beginPath(); g.moveTo(-34, -10); g.lineTo(46, -14); g.lineTo(52, -4); g.lineTo(46, 10); g.lineTo(-34, 8); g.closePath();
    const bl = g.createLinearGradient(0, -14, 0, 10); bl.addColorStop(0, '#ffffff'); bl.addColorStop(0.5, '#c4ccd4'); bl.addColorStop(1, '#6a747e');
    g.fillStyle = bl; g.fill(); g.lineWidth = 3; g.strokeStyle = '#1a2026'; g.stroke();
    g.beginPath(); g.roundRect(-58, -8, 26, 14, 3); g.fillStyle = '#d8a870'; g.fill(); g.stroke();
    g.fillStyle = '#7a4a22'; for (const x of [-52, -44]) { g.beginPath(); g.arc(x, -1, 2, 0, Math.PI * 2); g.fill(); }
    g.restore();
  },
  shovel: (g, w) => {
    jungleBack(g, w);
    const clod = () => { g.beginPath(); for (let i = 0; i < 14; i++) { const a = i * Math.PI / 7, r = 48 + (i % 3) * 6; g.lineTo(64 + Math.cos(a) * r, 66 + Math.sin(a) * r * 0.92); } g.closePath(); };
    cyan(g, clod, 7);
    clod(); const gr = g.createRadialGradient(54, 54, 4, 64, 66, 56); gr.addColorStop(0, '#a87a52'); gr.addColorStop(1, '#5a3a22'); g.fillStyle = gr; g.fill();
    const R = dice(61);
    for (let i = 0; i < 10; i++) { blob(g, 30 + R() * 68, 30 + R() * 68, 7, 5, R() * 3); g.fillStyle = R() < 0.5 ? '#7a5234' : '#9a6c46'; g.fill(); }
    // The shovel stuck in, blade down: a tan handle and a steel spade.
    g.fillStyle = '#e0c088'; g.strokeStyle = '#2a1c10'; g.lineWidth = 3;
    g.beginPath(); g.roundRect(59, 12, 10, 66, 3); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(46, 74); g.lineTo(82, 74); g.lineTo(80, 100); g.quadraticCurveTo(64, 122, 48, 100); g.closePath();
    const sp = g.createLinearGradient(46, 0, 82, 0); sp.addColorStop(0, '#f4f6f8'); sp.addColorStop(1, '#8a949c');
    g.fillStyle = sp; g.fill(); g.stroke();
  },
  monkey: (g, w) => {
    jungleBack(g, w);
    const face = () => { g.beginPath(); g.roundRect(18, 14, 92, 102, 24); };
    cyan(g, face, 8);
    face(); const gr = g.createLinearGradient(0, 14, 0, 116); gr.addColorStop(0, '#e8d4a8'); gr.addColorStop(1, '#a88a5a'); g.fillStyle = gr; g.fill();
    g.strokeStyle = '#5a4428'; g.lineWidth = 2;
    for (const y of [30, 44]) { g.beginPath(); g.moveTo(30, y); g.lineTo(98, y); g.stroke(); }
    g.beginPath(); g.moveTo(64, 18); g.lineTo(64, 50); g.stroke();
    // Two big purple eyes under a heavy brow.
    g.fillStyle = '#5a4428'; g.beginPath(); g.roundRect(28, 48, 72, 8, 3); g.fill();
    for (const x of [46, 82]) {
      blob(g, x, 66, 12, 10); g.fillStyle = '#f4f0ff'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#2a1c10'; g.stroke();
      blob(g, x, 67, 6, 7); g.fillStyle = '#7a3ac8'; g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 2, 64, 2, 0, Math.PI * 2); g.fill();
    }
    // The grimace: a wide mouth full of square teeth.
    g.beginPath(); g.roundRect(26, 82, 76, 28, 8); g.fillStyle = '#2a1c10'; g.fill();
    g.fillStyle = '#f4f2ea';
    for (let i = 0; i < 6; i++) { g.fillRect(30 + i * 12, 85, 10, 10); g.fillRect(30 + i * 12, 97, 10, 10); }
    g.fillStyle = '#b8a8e0'; g.fillRect(26, 104, 76, 6);
  },
  earthquake: (g, w) => {
    jungleBack(g, w);
    const ring = () => { g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2); };
    ring(); const gr = g.createRadialGradient(50, 48, 6, 64, 64, 56); gr.addColorStop(0, '#f0dcb0'); gr.addColorStop(0.6, '#b8966a'); gr.addColorStop(1, '#6a5236'); g.fillStyle = gr; g.fill();
    cyan(g, ring, 8);
    // The crack: a jagged yellow-green split down through it, with a notch at the top of the ring.
    const crack = [[60, 12], [70, 34], [56, 50], [74, 66], [58, 84], [70, 104], [62, 118]];
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [lw, col] of [[18, '#2a3a10'], [11, '#7ac828'], [4, '#e4f468']]) {
      g.lineWidth = lw; g.strokeStyle = col; g.beginPath(); crack.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    }
    for (const [x0, y0, x1, y1] of [[56, 50, 34, 44], [74, 66, 96, 60], [58, 84, 40, 92]]) { g.lineWidth = 6; g.strokeStyle = '#7ac828'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  },
};
// The ant, facing down the texture (the mesh turns it), its bites left on its back.
function antDraw(g, w, n) {
  jungleBack(g, w);
  g.lineCap = 'round';
  const red = '#d8442a', dark = '#5a1408';
  // Legs, three a side, and feelers.
  g.strokeStyle = dark; g.lineWidth = 7;
  for (const s of [-1, 1]) for (const [y, a, b] of [[58, 28, 42], [70, 36, 62], [82, 30, 92]]) { g.beginPath(); g.moveTo(64, y); g.lineTo(64 + s * a, y - 4); g.lineTo(64 + s * (a + 12), b); g.stroke(); }
  g.strokeStyle = red; g.lineWidth = 4;
  for (const s of [-1, 1]) for (const [y, a, b] of [[58, 28, 42], [70, 36, 62], [82, 30, 92]]) { g.beginPath(); g.moveTo(64, y); g.lineTo(64 + s * a, y - 4); g.lineTo(64 + s * (a + 12), b); g.stroke(); }
  for (const s of [-1, 1]) { g.strokeStyle = dark; g.lineWidth = 4; g.beginPath(); g.moveTo(64 + s * 6, 100); g.quadraticCurveTo(64 + s * 22, 110, 64 + s * 24, 124); g.stroke(); }
  // Abdomen (top), thorax, head (bottom) with its jaws.
  for (const [y, rx, ry] of [[36, 20, 24], [70, 11, 13], [96, 15, 13]]) { blob(g, 64, y, rx, ry); const gr = g.createRadialGradient(58, y - ry * 0.4, 2, 64, y, rx * 1.3); gr.addColorStop(0, '#ff9a6a'); gr.addColorStop(1, red); g.fillStyle = gr; g.fill(); g.lineWidth = 3; g.strokeStyle = dark; g.stroke(); }
  g.fillStyle = '#1a1a1a'; for (const s of [-1, 1]) { g.beginPath(); g.arc(64 + s * 8, 96, 3, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = dark; g.lineWidth = 4; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(64 + s * 5, 107); g.lineTo(64 + s * 2, 114); g.stroke(); }
  // The number on its back.
  g.font = 'bold 44px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 6; g.strokeStyle = '#3a2008'; g.strokeText(String(n), 64, 40);
  g.fillStyle = '#ffd23a'; g.fillText(String(n), 64, 40);
}

// ---------- the containers ----------
// The crate: pale wood slats round a heap of mangoes, two slats across its front at the foot.
function crateDraw(g, w, h) {
  g.fillStyle = '#4a3418'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e8d29a'; g.fillRect(4, 4, w - 8, h - 8);
  g.fillStyle = '#3a2410'; g.fillRect(14, 12, w - 28, h * 0.58);
  const R = dice(71);
  for (const [x, y, r] of [[38, 38, 22], [84, 34, 22], [56, 58, 22], [100, 62, 18], [26, 66, 16]]) {
    blob(g, x, y, r * 1.15, r * 0.9, R() * 2);
    const gr = g.createRadialGradient(x - r * 0.4, y - r * 0.4, 2, x, y, r * 1.2); gr.addColorStop(0, '#ffe066'); gr.addColorStop(0.5, '#f6a228'); gr.addColorStop(1, '#c8401c');
    g.fillStyle = gr; g.fill(); g.lineWidth = 2; g.strokeStyle = '#6a2a0c'; g.stroke();
  }
  for (const y of [h * 0.68, h * 0.84]) {
    g.fillStyle = '#d8bc7c'; g.fillRect(8, y, w - 16, h * 0.12);
    g.strokeStyle = '#6a4a20'; g.lineWidth = 2; g.strokeRect(8, y, w - 16, h * 0.12);
    g.strokeStyle = 'rgba(110,80,40,0.5)'; g.beginPath(); g.moveTo(12, y + h * 0.06); g.lineTo(w - 12, y + h * 0.06); g.stroke();
  }
  g.fillStyle = '#e8c040'; g.fillRect(w / 2 - 8, h * 0.74, 16, 5);
  g.strokeStyle = '#2a1a08'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
}
// The basket: wicker, heaped with red fruit, a handle-slot in its front.
function basketDraw(g, w, h) {
  g.fillStyle = '#3a2410'; g.fillRect(0, 0, w, h);
  const weave = (y0, y1) => {
    for (let y = y0; y < y1; y += 10) for (let x = 6; x < w - 6; x += 14) {
      g.fillStyle = ((x / 14 + y / 10) | 0) % 2 ? '#c88a4a' : '#e8b070';
      g.beginPath(); g.roundRect(x, y, 13, 9, 3); g.fill();
      g.strokeStyle = '#6a3a14'; g.lineWidth = 1.5; g.stroke();
    }
  };
  weave(6, h - 6);
  g.fillStyle = '#2a1608'; g.fillRect(18, 18, w - 36, h * 0.48);
  const R = dice(83);
  for (let i = 0; i < 15; i++) {
    const x = 40 + (i % 5) * 44 + (Math.floor(i / 5) % 2) * 18 + (R() - 0.5) * 8, y = 36 + Math.floor(i / 5) * 30 + (R() - 0.5) * 6, r = 24;
    blob(g, x, y, r, r * 0.95);
    const gr = g.createRadialGradient(x - 8, y - 8, 2, x, y, r * 1.1); gr.addColorStop(0, '#ff8a7a'); gr.addColorStop(0.5, '#d42a24'); gr.addColorStop(1, '#6a0c0c');
    g.fillStyle = gr; g.fill(); g.lineWidth = 2; g.strokeStyle = '#3a0606'; g.stroke();
    g.fillStyle = '#7a3a1a'; g.fillRect(x - 2, y - r - 2, 4, 6);
  }
  // The slot.
  g.strokeStyle = '#4a2a10'; g.lineWidth = 6; g.beginPath(); g.roundRect(w / 2 - 26, h * 0.74, 52, 18, 4); g.stroke();
  g.strokeStyle = '#e8b070'; g.lineWidth = 2; g.stroke();
  g.strokeStyle = '#2a1a08'; g.lineWidth = 5; g.strokeRect(2.5, 2.5, w - 5, h - 5);
}
// The chest: an iron-studded lid at the top, gems in every colour heaped in it, its front with a
// clasp, blue-steel bands at the ends.
function chestDraw(g, w, h) {
  g.fillStyle = '#1a1a22'; g.fillRect(0, 0, w, h);
  const plank = (y, hh) => { const gr = g.createLinearGradient(0, y, 0, y + hh); gr.addColorStop(0, '#f0d8b0'); gr.addColorStop(1, '#a87a4a'); g.fillStyle = gr; g.fillRect(14, y, w - 28, hh); g.strokeStyle = 'rgba(90,60,30,0.5)'; g.lineWidth = 2; for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(16, y + hh * i / 3); g.lineTo(w - 16, y + hh * i / 3); g.stroke(); } };
  plank(10, h * 0.24);
  plank(h * 0.72, h * 0.22);
  // Gems.
  g.fillStyle = '#28303a'; g.fillRect(10, h * 0.36, w - 20, h * 0.34);
  const R = dice(97), cols = ['#30d050', '#e83030', '#3080ff', '#f0f0f8', '#c040e0', '#f0c020', '#40e0e0'];
  for (let i = 0; i < 60; i++) {
    const x = 20 + R() * (w - 40), y = h * 0.38 + R() * h * 0.3, r = 6 + R() * 7, c = cols[i % cols.length];
    blob(g, x, y, r, r * 0.75, R() * 3);
    const gr = g.createRadialGradient(x - r * 0.4, y - r * 0.4, 1, x, y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, c); gr.addColorStop(1, shade(c.length === 7 ? c : '#888888', 0.4));
    g.fillStyle = gr; g.fill();
  }
  // Iron: the frame, studs, the bands at the ends, the lock on the lid and the clasp on the front.
  g.strokeStyle = '#3a4a5a'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12);
  g.strokeStyle = '#8a9aaa'; g.lineWidth = 2; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = '#c8a050';
  for (let x = 14; x < w - 8; x += 18) for (const y of [8, h - 8]) { g.beginPath(); g.arc(x, y, 2.5, 0, Math.PI * 2); g.fill(); }
  for (const x of [8, w - 22]) { g.fillStyle = '#6a7aa8'; g.fillRect(x, h * 0.7, 14, h * 0.26); g.fillStyle = '#c8a050'; for (const y of [h * 0.75, h * 0.9]) { g.beginPath(); g.arc(x + 7, y, 2.5, 0, Math.PI * 2); g.fill(); } }
  g.fillStyle = '#d8a838'; g.strokeStyle = '#5a3a10'; g.lineWidth = 3;
  g.beginPath(); g.roundRect(w / 2 - 12, h * 0.2, 24, 26, 6); g.fill(); g.stroke();
  g.beginPath(); g.roundRect(w / 2 - 34, h * 0.77, 68, 22, 5); g.fillStyle = '#6a7aa8'; g.fill(); g.stroke();
  g.fillStyle = '#d8a838'; g.beginPath(); g.roundRect(w / 2 - 22, h * 0.79, 44, 16, 4); g.fill(); g.stroke();
}

/* A box with no front (+z), its back at z 0: its picture is a plane laid exactly where the front
   would be, the lid on it. A front under the picture flickered through it (z-fighting) seen from
   any way off, the squares flashing their dark sides (the user, 11 Nov, from the hidden cove: "the
   squares are flashing black. And flickering"), the two only a millimetre apart. */
function openBox(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d), front = g.groups[4], idx = Array.from(g.index.array);
  idx.splice(front.start, front.count);
  g.setIndex(idx);
  g.clearGroups();
  return g.translate(0, 0, d / 2);
}
const look = {};
function makeLook() {
  if (look.ready) return;
  look.ready = true;
  look.slab = openBox(0.97, 0.97, 0.18);
  look.face = new THREE.PlaneGeometry(0.97, 0.97);
  look.tileSide = TILE_BASE.map((c) => mat(shade(c, 0.6), { roughness: 0.9 }));
  look.tiles = tileDraw.map((d) => faceMat(tex(128, 128, d), 0.8));
  look.specialSide = mat('#22361e');
  look.specials = Object.fromEntries(Object.entries(specialDraw).map(([k, d]) => [k, faceMat(tex(128, 128, d), 0.6)]));
  look.boxSide = { crate: mat('#9a7a48', { roughness: 0.8 }), basket: mat('#a8703a', { roughness: 0.9 }), chest: mat('#3a4a5a', { metalness: 0.4, roughness: 0.5 }) };
  look.boxFace = {
    crate: faceMat(tex(128, 128, crateDraw)),
    basket: faceMat(tex(256, 256, basketDraw), 0.8),
    chest: faceMat(tex(384, 256, chestDraw), 0.6),
  };
}
const antMats = new Map();
function antMat(n) {
  if (!antMats.has(n)) antMats.set(n, faceMat(tex(128, 128, (g, w) => antDraw(g, w, n)), 0.6));
  return antMats.get(n);
}

/** The default look for a container: the real crate, basket or chest. */
export function containerMesh(bit) {
  makeLook();
  const { w, h } = SIZES[bit.box], g = new THREE.Group();
  const body = new THREE.Mesh(openBox(w - 0.06, h - 0.06, 0.4), look.boxSide[bit.box]);
  body.castShadow = true;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.06), look.boxFace[bit.box]);
  face.position.z = 0.4;   // (its lid: openBox)
  g.add(body, face);
  return g;
}

/* The capybara stuck in reeds, roots and mud: a skin for a basket-sized (2x2) container. A plump
   red-brown capybara with its big blunt head, tangled in an old net among reeds and roots in a bank
   of mud. Pass `capybaraSkin` as a board's skin; it falls back to the default for anything else.
   When he leaves the board only he goes (its `userData.leaves`): the bank, the reeds and the net
   break up and fall away where they were (the user, 10 Nov, of the capybara going off with "some
   background pieces got caught up in it"). */
const capyFur = mat('#c48a52', { roughness: 0.95 }), capyDark = mat('#6a4224', { roughness: 0.95 }), capyNose = mat('#2a1a12', { roughness: 0.6 });
const capyEye = mat('#0e0a08', { roughness: 0.2 }), capyGlint = new THREE.MeshBasicMaterial({ color: '#ffffff' });
/* The capybara himself, side on, facing +x, standing on his feet with y up (his feet about 0.67
   below his middle): a barrel of a body, a big square-ended head, little round ears, short legs, no
   tail to speak of. One model, wherever he's drawn: stuck on his bank, swimming, at the den.
   `userData`: his `head` (it nods) and `legs` (they paddle). */
export function capybaraMesh() {
  const c = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14).scale(1.25, 0.85, 0.8), capyFur);
  body.position.set(-0.12, -0.1, 0);
  const head = new THREE.Group();
  head.position.set(0.52, 0.12, 0.05);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 12).scale(1.25, 0.95, 0.85), capyFur);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.36), capyFur);
  snout.position.set(0.26, -0.08, 0);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.22), capyNose);
  nose.position.set(0.43, -0.03, 0);
  head.add(skull, snout, nose);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8).scale(1, 1.2, 0.5), capyDark);
    ear.position.set(-0.12, 0.26, s * 0.16 - 0.05);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), capyEye);
    eye.position.set(0.14, 0.1, s * 0.2 - 0.05);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), capyGlint);   // (a bright eye)
    glint.position.set(0.18, 0.125, s * 0.2 - 0.05 + s * 0.022);
    head.add(ear, eye, glint);
  }
  c.add(body, head);
  c.userData.head = head;
  c.userData.legs = [];
  for (const [x, z] of [[-0.48, 0.22], [-0.48, -0.22], [0.22, 0.22], [0.22, -0.22]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.3, 8).translate(0, -0.15, 0), capyDark);
    leg.position.set(x, -0.37, z);
    c.add(leg);
    c.userData.legs.push(leg);
  }
  c.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return c;
}
/* The old fish trap he's shut in: a box of pale driftwood bars lashed with rope at the corners, its
   front barred so you see him through it. Centred on him, a square of the board each way (his skin's
   units). Every bar knows which way it flies when he breaks out (`cageOpen`). */
const driftM = mat('#d8c8a8', { roughness: 0.85 }), driftD = mat('#a89070', { roughness: 0.9 }), lashM = mat('#8a6a3a', { roughness: 1 });
function trap() {
  const g = new THREE.Group(), X = 0.88, Y = 0.84, Z0 = 0.08, Z1 = 0.98;
  const bar = (len, axis, x, y, z, m = driftM, r = 0.05) => {
    const geo = new THREE.CylinderGeometry(r, r * 1.15, len, 7);
    if (axis === 'x') geo.rotateZ(Math.PI / 2); else if (axis === 'z') geo.rotateX(Math.PI / 2);
    const b = new THREE.Mesh(geo, m);
    b.position.set(x, y, z);
    b.castShadow = true;
    // (when he breaks out: away from his middle, spinning, falling)
    const out = new THREE.Vector3(x, y * 0.6 + 0.4, z - 0.5).normalize();
    b.userData.fly = { p: b.position.clone(), r: b.rotation.clone(), d: out, spin: new THREE.Vector3(x * 3, 1.5 - y, y * 2) };
    g.add(b);
    return b;
  };
  // Its frame: four corner posts at the front, rails along the top and bottom, front and back, and
  // the sides' rails back to the bank.
  for (const x of [-X, X]) { bar(2 * Y + 0.1, 'y', x, 0, Z1, driftD, 0.065); bar(2 * Y, 'y', x, 0, Z0, driftD, 0.055); }
  for (const y of [-Y, Y]) for (const z of [Z0, Z1]) bar(2 * X + 0.12, 'x', 0, y, z, driftD, 0.06);
  for (const x of [-X, X]) for (const y of [-Y, Y]) bar(Z1 - Z0, 'z', x, y, (Z0 + Z1) / 2, driftD, 0.05);
  // The bars across its front, a little crooked, as an old trap's would be.
  for (let i = 0; i < 4; i++) { const b = bar(2 * Y, 'y', -X + (i + 1) * (2 * X / 5), 0, Z1 + 0.02); b.rotation.z = ((i * 37) % 5 - 2) * 0.025; b.userData.fly.r = b.rotation.clone(); }
  // Rope lashings at the front corners, and one tied across the middle.
  for (const x of [-X, X]) for (const y of [-Y, Y]) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.028, 6, 10), lashM); l.position.set(x, y, Z1); l.userData.fly = { p: l.position.clone(), r: l.rotation.clone(), d: new THREE.Vector3(x, y, 0.4).normalize(), spin: new THREE.Vector3(2, 1, 0) }; g.add(l); }
  return g;
}
/** His trap breaking open as he gets out, `k` from 0 (shut) to 1 (its bars flown off and fallen):
    a pose for a moment, so it plays as a function of time (the caller's). */
export function cageOpen(cage, k) {
  const e = k * k * (3 - 2 * k);
  for (const b of cage.children) {
    const f = b.userData.fly;
    if (!f) continue;
    b.position.copy(f.p).addScaledVector(f.d, 1.1 * e);
    b.position.y -= 1.6 * k * k;
    b.rotation.set(f.r.x + f.spin.x * e, f.r.y + f.spin.y * e, f.r.z + f.spin.z * e);
    b.scale.setScalar(k < 0.75 ? 1 : Math.max(0.01, 1 - (k - 0.75) * 4));
  }
}
export function capybaraSkin(bit) {
  if (bit.box !== 'basket') return null;
  const g = new THREE.Group();
  // A little mound of mud under him, and reeds round its foot: no picture behind him, the board's
  // own jungle shows through the trap.
  const mud = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(0.95, 0.3, 0.55), mat('#7a5634', { roughness: 1 }));
  mud.position.set(0, -0.9, 0.55);
  g.add(mud);
  // The capybara, sat in it facing you, a little turned (the user, 10 Nov: "being in the cage or
  // being trapped in some way visually makes sense while you're trying to free them"), shut in an old
  // fish trap. He and the trap go down the board together (`leaves`); off its foot he breaks out of
  // it (whoever takes him: his `capybara` and his `cage`; `cageOpen` breaks it).
  const him = new THREE.Group();
  const c = capybaraMesh();
  c.rotation.set(0.2, -0.75, 0);   // three-quarters to you, looking up out of it
  c.scale.setScalar(0.78);
  c.position.set(-0.05, -0.1, 0.5);
  him.add(c);
  const cage = trap();
  him.add(cage);
  him.userData.capybara = c;
  him.userData.cage = cage;
  g.add(him);
  g.userData.capybara = c;
  g.userData.leaves = him;   // (only he leaves the board, in his trap: the mud falls away)
  // Reeds round the trap's foot.
  const reedM = mat('#5a8a32', { roughness: 0.8 }), reedD = mat('#3e6a24', { roughness: 0.8 });
  for (let i = 0; i < 7; i++) {
    const hgt = 0.3 + (i * 37 % 10) / 40, r = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.03, hgt, 5), i % 2 ? reedM : reedD);
    r.position.set(-0.95 + i * 0.32, -0.97 + hgt / 2, 1.25 + (i % 2) * 0.08);
    r.rotation.z = ((i * 53) % 7 - 3) * 0.06;
    g.add(r);
  }
  return g;

}

// ---------- the board ----------
// The jungle behind the board, showing wherever a square's empty.
const jungleTex = () => tex(256, 256, (g, w, h) => {
  g.fillStyle = '#16301a'; g.fillRect(0, 0, w, h);
  const R = dice(151);
  for (let i = 0; i < 60; i++) leaf(g, R() * w, R() * h, 40 + R() * 50, 10 + R() * 12, R() * Math.PI * 2, ['#24502a', '#2f6a30', '#1c4220', '#3a7a36'][i % 4], '#14301a');
  g.fillStyle = 'rgba(10,20,12,0.35)'; g.fillRect(0, 0, w, h);
});
// A banana, for the meter down the left side: an empty outline for each container still to come,
// filled yellow from the bottom up as they come in ("make sure you have at least two empty bananas").
function bananaTex(full) {
  return tex(64, 64, (g) => {
    g.beginPath(); g.moveTo(14, 8); g.quadraticCurveTo(58, 18, 50, 56); g.quadraticCurveTo(40, 30, 10, 14); g.closePath();
    if (full) { const gr = g.createLinearGradient(10, 8, 50, 56); gr.addColorStop(0, '#fff07a'); gr.addColorStop(1, '#e8b81a'); g.fillStyle = gr; g.fill(); }
    g.lineWidth = 3.5; g.strokeStyle = full ? '#6a4a08' : '#d8b84a'; g.stroke();
    g.fillStyle = '#4a3008'; g.fillRect(10, 6, 7, 6);
  });
}
// The cursor's vine: dark green rope, wound with lighter green.
const vineTex = () => tex(128, 16, (g, w, h) => {
  g.fillStyle = '#163a14'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#6ac83a'; g.lineWidth = 3;
  for (let x = -16; x < w + 16; x += 12) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 10, 0); g.stroke(); }
  g.strokeStyle = '#0a1a08'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
});

const colX = (c, w = 1) => c + w / 2 - W / 2, rowY = (r, h = 1) => H / 2 - (r + h / 2);
const sizeOf = (bit) => (bit.box ? SIZES[bit.box] : { w: 1, h: 1 });

/* A Foraging board. `deal`: what's dealt (src/foraging.ts's Deal) or `game`, a Forage already made.
   `at` (a Vector3, the middle of the board), `yaw` (turned about the world's up) and `lean` (0
   standing upright facing along +z after the yaw; Math.PI / 2 lying flat face up, its top row
   away): where it goes. `sq`: a square's size in metres. `skin(bit)`: a container's look (an
   Object3D, 1 unit to a square, centred, standing out toward +z), or null for the real crate,
   basket or chest. `bananas`: show the bananas down its left side (true).
   Hooks: `onMove(move)` after each move; `onLeave({ id, size, tag, mesh, world })` as a container
   drops out of the bottom (return true to take its mesh, which is then yours to move on, still in
   the board's group till you take it out); `onDone()` once every container has come and gone.
   Returns the board: add `board.group` to the scene, call `tick(dt)` every frame, feed it `key`,
   `pointer` and `click`, and `dispose()` it when you're done. */
export function forageBoard(o = {}) {
  makeLook();
  const game = o.game ?? new Forage(o.deal ?? {});
  const group = new THREE.Group(), pieces = new THREE.Group();
  const b = {
    game, group, pieces, sq: o.sq ?? 0.45, skin: o.skin ?? null,
    onMove: o.onMove ?? null, onLeave: o.onLeave ?? null, onDone: o.onDone ?? null,
    meshes: new Map(), queue: [], holdT: 0, fx: [], leaving: [], done: false, shake: 0, shown: false,
  };
  group.add(pieces);
  // The jungle behind and the pale frame round the grid.
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: jungleTex(), roughness: 1 }));
  back.receiveShadow = true;
  group.add(back);
  const frame = mat('#e8dcb0', { roughness: 0.6 }), frameDark = mat('#5a4a2a', { roughness: 0.8 });
  for (const [x, y, sx, sy] of [[0, H / 2 + 0.06, W + 0.24, 0.12], [0, -H / 2 - 0.06, W + 0.24, 0.12], [-W / 2 - 0.06, 0, 0.12, H], [W / 2 + 0.06, 0, 0.12, H]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, 0.22), frame); m.position.set(x, y, 0.11); group.add(m);
    const d = new THREE.Mesh(new THREE.BoxGeometry(sx + 0.1, sy + 0.1, 0.12), frameDark); d.position.set(x, y, 0.04); group.add(d);
  }
  // The bananas.
  b.bananaGroup = new THREE.Group();
  b.bananaMats = [new THREE.MeshBasicMaterial({ map: bananaTex(false), transparent: true }), new THREE.MeshBasicMaterial({ map: bananaTex(true), transparent: true })];
  if (o.bananas !== false) group.add(b.bananaGroup);
  b.bananaShown = -1;
  // The cursor: a vine loop, 2x2 or 1x1.
  const vm = new THREE.MeshStandardMaterial({ map: vineTex(), roughness: 0.8 });
  b.cursor = new THREE.Group();
  b.cursorBars = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.14, 0.14), vm); b.cursor.add(m); return m; });
  b.cursor.position.z = 0.32;
  group.add(b.cursor);

  group.position.copy(o.at ?? new THREE.Vector3());
  group.rotation.set(-(o.lean ?? 0), o.yaw ?? 0, 0, 'YXZ');
  group.scale.setScalar(b.sq);

  const pieceMesh = (bit) => {
    if (bit.box) {
      const m = b.skin?.(bit) ?? containerMesh(bit);
      m.userData.box = true;
      return m;
    }
    const g = new THREE.Group();
    const side = bit.s ? look.specialSide : look.tileSide[bit.k];
    const slab = new THREE.Mesh(look.slab, side);
    slab.castShadow = true;
    const face = new THREE.Mesh(look.face, bit.s === 'ant' ? antMat(bit.bites) : bit.s ? look.specials[bit.s] : look.tiles[bit.k]);
    face.position.z = 0.18;   // (the slab's lid: openBox)
    g.add(slab, face);
    g.userData.face = face;
    if (bit.s === 'ant') { face.rotation.z = (2 - (bit.dir ?? 2)) * Math.PI / 2; g.userData.bites = bit.bites; }
    return g;
  };
  const place = (bit, r, c) => { const { w, h } = sizeOf(bit); return [colX(c, w), rowY(r, h)]; };

  /* Every piece moves on the stage's one clock, as a function of the time since it started (no
     stepping a frame at a time): what falls, falls together (src/foraging.ts, `fallen`), in step,
     each stopping where it lands; a turn (or a shake) swings its pieces over in a fifth of a second,
     eased in and out. */
  const SLIDE = 0.2;
  const go = (m, x, y) => {
    const fx = m.position.x, fy = m.position.y;
    m.userData.tx = x; m.userData.ty = y;
    if (!b.shown) { m.position.set(x, y, m.position.z); m.userData.anim = null; return; }
    if (Math.abs(fx - x) + Math.abs(fy - y) < 1e-6) { m.userData.anim = null; return; }
    m.userData.anim = { fx, fy, tx: x, ty: y, t: 0, fall: Math.abs(fx - x) < 1e-6 && y < fy };
  };
  const step = (m, dt) => {
    const a = m.userData.anim;
    if (!a) return;
    a.t += dt;
    let done;
    if (a.fall) { const d = a.fy - a.ty, s = Math.min(d, fallen(a.t)); m.position.y = a.fy - s; m.position.x = a.tx; done = s >= d; }
    else {
      const u = Math.min(1, a.t / SLIDE), k = u * u * (3 - 2 * u);
      m.position.x = a.fx + (a.tx - a.fx) * k; m.position.y = a.fy + (a.ty - a.fy) * k; done = u >= 1;
    }
    if (done) { m.position.x = a.tx; m.position.y = a.ty; m.userData.anim = null; }
  };
  // Lay out a stage's board: pieces already shown move to their new squares, new ones come in
  // from above the top edge, stacked in their columns.
  const lay = (grid, inPlace = false) => {
    const above = Array(W).fill(0), seen = new Set();
    for (let r = H - 1; r >= 0; r--) for (let c = 0; c < W; c++) {
      const bit = grid[r][c];
      if (!bit || seen.has(bit.id)) continue;
      // (a container by its top left square)
      if (bit.box) { const { w, h } = SIZES[bit.box]; if (grid[r - (h - 1)]?.[c] !== bit || grid[r][c - 1] === bit) continue; }
      seen.add(bit.id);
      const top = bit.box ? r - (SIZES[bit.box].h - 1) : r;
      const [x, y] = place(bit, top, c);
      let m = b.meshes.get(bit.id);
      if (!m) {
        m = pieceMesh(bit);
        const { w, h } = sizeOf(bit);
        let n = 0; for (let cc = c; cc < c + w; cc++) n = Math.max(n, above[cc]);
        for (let cc = c; cc < c + w; cc++) above[cc] = n + h;
        m.position.set(x, b.shown && !inPlace ? H / 2 + n + h / 2 + 0.2 : y, 0);
        if (inPlace && b.shown) { m.scale.setScalar(0.01); b.fx.push({ m, grow: true, t: 0.25, t0: 0.25 }); }
        pieces.add(m); b.meshes.set(bit.id, m);
      }
      go(m, x, y);
      if (bit.s === 'ant') {
        m.userData.face.rotation.z = (2 - (bit.dir ?? 2)) * Math.PI / 2;
        if (m.userData.bites !== bit.bites) { m.userData.face.material = antMat(bit.bites); m.userData.bites = bit.bites; }
      }
    }
    b.shown = true;
  };
  // A piece cleared: it pops, a few bits of it flying.
  const pop = (m, n = 5, cols = [m.userData.face?.material?.map ? '#c8b890' : '#a08060'], spread = 0) => {
    pieces.remove(m);
    for (let i = 0; i < n; i++) {
      const bit = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.1), mat(cols[i % cols.length]));
      bit.position.copy(m.position).add(new THREE.Vector3((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, 0.3));
      const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 3;
      pieces.add(bit);
      b.fx.push({ m: bit, vx: Math.cos(a) * s, vy: Math.sin(a) * s + 2, vz: 2 + Math.random() * 2, t: 0.5 });
    }
    const ghost = m.clone();
    pieces.add(ghost);
    b.fx.push({ m: ghost, shrink: true, t: 0.18, t0: 0.18 });
  };
  const apply = (st) => {
    for (const id of st.cleared) { const m = b.meshes.get(id); if (m) { b.meshes.delete(id); pop(m); } }
    for (const id of st.left) {
      let m = b.meshes.get(id);
      if (!m) continue;
      b.meshes.delete(id);
      const left = b.pendingLeft.find((l) => l.id === id);
      let { h } = SIZES[left.size];
      // A skin that's more than what leaves (the capybara on his bank): only he goes; the rest
      // breaks up and falls away where it was, mud, reeds and net.
      const goes = m.userData.leaves;
      if (goes && goes !== m) {
        pieces.attach(goes);
        pop(m, 14, ['#7a5a38', '#5a8a32', '#3a2a1a', '#2a2018'], 1.6);
        m = goes;
        h = 1.4;
      }
      // Out of the bottom, falling with the pieces on the stage's clock.
      m.userData.anim = null;
      go(m, m.position.x, -H / 2 - h / 2 - 0.1);
      b.leaving.push({ m, left });
    }
    if (st.what === 'use' && b.lastAction === 'earthquake') b.shake = 0.5;
    lay(st.grid, st.what === 'use');   // (the monkey's new tiles turn up where they are)
  };
  const busy = () => b.queue.length > 0 || b.leaving.length > 0 || moving();
  const moving = () => { for (const m of b.meshes.values()) if (m.userData.anim) return true; return false; };
  b.busy = busy;

  b.press = (cw) => {
    if (b.done || busy()) return null;
    const m = game.press(cw);
    if (!m.moved) {
      const sel = game.selection(), mm = b.meshes.get(game.grid[sel.r]?.[sel.c]?.id);
      if (mm) mm.userData.jig = 0.35;
      return m;
    }
    b.lastAction = m.action;
    b.pendingLeft = (b.pendingLeft ?? []).concat(m.left);
    b.queue.push(...m.stages);
    b.holdT = 0;
    b.onMove?.(m);
    return m;
  };
  // The keys, as in the real puzzle: the arrows (or WASD) move the cursor, X turns it
  // counter-clockwise (a machete or earthquake to the left), C clockwise (to the right).
  b.key = (key, e) => {
    key = key.toLowerCase();
    const mv = { arrowleft: [0, -1], a: [0, -1], arrowright: [0, 1], d: [0, 1], arrowup: [-1, 0], w: [-1, 0], arrowdown: [1, 0], s: [1, 0] }[key];
    if (mv) { game.step(mv[0], mv[1]); return true; }
    if (key === 'x' || key === 'c') { if (!e?.repeat) b.press(key === 'c'); return true; }
    return false;
  };
  // The mouse: (nx, ny) in -1..1 across the canvas, as three.js's pointer.
  const ray = new THREE.Raycaster();
  b.pointer = (nx, ny, camera) => {
    ray.setFromCamera(new THREE.Vector2(nx, ny), camera);
    group.updateMatrixWorld(true);
    const n = new THREE.Vector3(0, 0, 1).transformDirection(group.matrixWorld), p0 = new THREE.Vector3().setFromMatrixPosition(group.matrixWorld);
    const p = new THREE.Vector3();
    if (!ray.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(n, p0), p)) return false;
    group.worldToLocal(p);
    const x = p.x + W / 2, y = H / 2 - p.y;
    if (x < -0.5 || x > W + 0.5 || y < -0.5 || y > H + 0.5) return false;
    game.point(x, y);
    return true;
  };
  // A left click turns counter-clockwise (X), a right click clockwise (C).
  b.click = (button) => b.press(button === 2);

  b.tick = (dt) => {
    if (!b.shown) lay(game.snap());
    b.holdT += dt;
    if (b.queue.length && b.holdT > 0.1 && !moving()) { apply(b.queue.shift()); b.holdT = 0; }
    const t = performance.now() / 1000;
    for (const [, m] of b.meshes) {
      step(m, dt);
      m.visible = m.position.y < H / 2 - 0.4;   // (new ones show once they're in at the top)
      m.rotation.z = m.userData.jig > 0 ? Math.sin((m.userData.jig -= dt) * 50) * 0.12 : 0;
    }
    // Containers dropping out of the bottom, in step with the pieces falling round them.
    for (let i = b.leaving.length - 1; i >= 0; i--) {
      const L = b.leaving[i];
      step(L.m, dt);
      if (L.m.userData.anim) continue;
      b.leaving.splice(i, 1);
      b.pendingLeft = b.pendingLeft.filter((l) => l !== L.left);
      const world = L.m.getWorldPosition(new THREE.Vector3());
      const taken = b.onLeave?.({ ...L.left, mesh: L.m, world });
      if (!taken) pieces.remove(L.m);
    }
    for (let i = b.fx.length - 1; i >= 0; i--) {
      const f = b.fx[i];
      f.t -= dt;
      if (f.grow) { f.m.scale.setScalar(Math.min(1, Math.max(0.01, 1 - f.t / f.t0))); if (f.t <= 0) { f.m.scale.setScalar(1); b.fx.splice(i, 1); } continue; }
      if (f.shrink) f.m.scale.setScalar(Math.max(0.01, f.t / f.t0));
      else { f.vy -= 18 * dt; f.m.position.x += f.vx * dt; f.m.position.y += f.vy * dt; f.m.position.z += f.vz * dt; f.m.rotation.x += dt * 9; }
      if (f.t <= 0) { pieces.remove(f.m); if (!f.shrink) f.m.geometry.dispose(); b.fx.splice(i, 1); }
    }
    // The earthquake shakes the board.
    if (b.shake > 0) { b.shake -= dt; pieces.position.x = Math.sin(t * 70) * 0.12 * Math.max(0, b.shake) * 2; } else pieces.position.x = 0;
    // The cursor.
    const sel = game.selection(), n = sel.one ? 1 : 2;
    const cx = colX(sel.c, n), cy = rowY(sel.r, n), half = n / 2;
    b.cursorBars.forEach((m, i) => {
      const horiz = i < 2;
      m.scale.x = n + 0.14;
      m.rotation.z = horiz ? 0 : Math.PI / 2;
      m.position.set(cx + (horiz ? 0 : (i === 2 ? -half : half)), cy + (horiz ? (i === 0 ? half : -half) : 0), 0);
    });
    b.cursor.visible = !b.done && !b.idle;   // (no cursor on a board nobody's at: `idle`)
    // The bananas: one for each container the board has had or will have, the ones that have come
    // in filled, from the bottom.
    const toCome = game.toCome, total = Number.isFinite(toCome) ? (b.total ??= toCome + game.boxes + game.containers().length) : 0;
    const key = `${toCome}/${total}`;
    if (key !== b.bananaShown) {
      b.bananaShown = key;
      b.bananaGroup.clear();
      for (let i = 0; i < total; i++) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), b.bananaMats[i < total - toCome ? 1 : 0]);
        m.position.set(-W / 2 - 0.55, -H / 2 + 0.4 + i * 0.66, 0.05);
        b.bananaGroup.add(m);
      }
    }
    if (!b.done && game.over && !busy()) { b.done = true; b.onDone?.(); }
  };
  b.prompt = () => {
    if (b.done) return 'Foraging · all done';
    const sel = game.selection(), on = game.grid[sel.r]?.[sel.c];
    const what = sel.one ? { machete: 'X slashes left · C slashes right', earthquake: 'X shakes left · C shakes right', shovel: 'X or C digs', monkey: 'X or C sets him off' }[on.s] : 'X turns anticlockwise · C clockwise';
    return `Foraging · arrows or mouse move · ${what} (left / right click)`;
  };
  // The camera to play it from: straight on to its face, far enough back to see it all.
  b.camView = (camera) => {
    const vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect), sq = b.sq;
    const dist = Math.max((H * sq / 2 + sq) / Math.tan(vh), (W * sq / 2 + sq * 1.6) / Math.tan(hh)) * 1.1;
    group.updateMatrixWorld(true);
    const look = new THREE.Vector3().setFromMatrixPosition(group.matrixWorld), out = new THREE.Vector3(0, 0, 1).transformDirection(group.matrixWorld);
    return { look, from: look.clone().addScaledVector(out, dist), dist };
  };
  // Redraw every piece where the game has it now, without animating (after changing the game
  // behind the board's back: a saved game, say, or a test).
  b.refresh = () => {
    for (const m of b.meshes.values()) pieces.remove(m);
    b.meshes.clear();
    b.queue = [];
    b.shown = false;
  };
  b.dispose = () => {
    group.removeFromParent();
    group.traverse((x) => { if (x.geometry && x.geometry !== look.slab && x.geometry !== look.face) x.geometry.dispose(); });
  };
  return b;
}
