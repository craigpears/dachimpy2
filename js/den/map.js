// The captain's map, and the cutscene of their captain's parting shot. (Split out of den.js.)
import * as THREE from 'three';
import { MAP, mapAfter, canPickUp, canRead, RUMOUR, NOTES, X_AT, CHART, ROUTE, SHEET, onMap, VEGAS_NOTE, SMUGGLERS_NOTE } from '../den-map.js';
import { SAIL } from '../den-sail.js';
import { PARTING } from '../lines/dalnoth.js';
import { FOUND_MAP } from '../lines/you.js';
import { PIRATES } from '../den-look.js';
import { $, scene, camera, mat, mesh, makePirate, animateWalk, faceTo, V3, pirate, carry, G, keys, wm, burst, v3, worldLets } from './world.js';
import { cine, cinePlay, cineEnd, bubble, bubbleAt, stepTo } from './cine.js';
import { outside } from './land.js';
import { wall } from './wall.js';
import { putBack, exitWall } from './pieces.js';
import { SHIP_Z, SHIP_DECK, ship, BOAT_FROM, boats, rowboat, cannon } from './raids.js';
import { sword } from './sword.js';
import { shoreZ, bilge } from './bilge.js';
import { sail } from './sea.js';
import { guest, send } from './crew.js';
import { deco, decoMode } from './menus.js';
import { questsTick, touring, tourStep, tourStart, tourMaybe } from './quests.js';

// ---------- the captain's map ----------
/* Left on the beach when the siege is over (src/den-map.ts). Beat the last wave and a short, cheesy
   cutscene plays (the user, 9 Nov: "I want a little cutscene, so they're not just sailing off in the
   distance ... You automatically walk out, pick up the treasure map"): their captain, on the beach,
   shakes his fist ("We'll be back!") and runs for his boat, and a map falls out of his coat; then
   your pirate walks out through the gate, picks it up and opens it out on the sand in front of them,
   the camera looking down on it. Space or Esc skips the cutscene (the map's left lying on the beach,
   to walk out and pick up). M opens it again wherever you are; M, Esc or Space rolls it up. */
export const MAP_W = 1.3, MAP_D = 0.92;
export const chart = { on: false, open: 0, g: null, paper: null, rolls: null, tex: null, scroll: null, label: null, yaw: 0 };
export let mapView = 0, mapWas = 'none', phaseWas = 'build';
let dal = null;   // his cutscene, while it plays

// Other parts of the den assign to these lets through this, as an imported binding can't be assigned.
export const mapLets = {
  get mapView() { return mapView; }, set mapView(v) { mapView = v; },
  get mapWas() { return mapWas; }, set mapWas(v) { mapWas = v; },
  get phaseWas() { return phaseWas; }, set phaseWas(v) { phaseWas = v; },
};
const mapSpot = () => ({ x: (wall?.door?.cx ?? 0) + MAP.DX, z: MAP.Z });
export const nearMap = () => outside() && !carry && !cine && canPickUp(G.map, pirate.x - mapSpot().x, pirate.z - mapSpot().z);

// The map rolled up and tied with a red ribbon, as it lies on the sand.
function scrollMesh() {
  const g = new THREE.Group();
  const roll = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 14), mat('#e6d2a0', { roughness: 0.9 }));
  roll.rotation.z = Math.PI / 2;
  const tie = mesh(new THREE.TorusGeometry(0.064, 0.013, 6, 16), mat('#a3271c'), false);
  tie.rotation.y = Math.PI / 2;
  g.add(roll, tie);
  return g;
}

/* The map itself, drawn in ink on old parchment, from her sea as it is (CHART, from the sea's lay:
   src/den-map.ts): your cove at the bottom, the trade winds out of it and the shipping lane on to
   the imperial checkpoint's line, the headland and its cliffs on the left, the reef on the right,
   and the open sea beyond with the old wreck and the X. Nothing secret: the cliffs are drawn whole.
   Drawn the first time it's opened (the fonts are in by then). */
function mapTexture() {
  const w = 1024, h = Math.round(w * MAP_D / MAP_W), cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  let seed = 11;
  const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const P = (u, v) => [u * w, v * h];
  const Q = (sq) => P(...onMap(sq));   // a square of her sea
  const cw = (SHEET.U1 - SHEET.U0) / SAIL.COLS * w, ch = (SHEET.V1 - SHEET.V0) / SAIL.ROWS * h;   // (a square, in pixels)
  const INK = '#4a2c14', LAND = '#d6b778', SAND = '#e2c88e';
  // A ragged, burnt edge.
  const edge = [], side = (x0, y0, x1, y1, n) => { for (let i = 0; i < n; i++) { const t = i / n; edge.push([x0 + (x1 - x0) * t + (rnd() - 0.5) * 12, y0 + (y1 - y0) * t + (rnd() - 0.5) * 12]); } };
  const m = 16;
  side(m, m, w - m, m, 26); side(w - m, m, w - m, h - m, 18); side(w - m, h - m, m, h - m, 26); side(m, h - m, m, m, 18);
  g.beginPath(); edge.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
  const bg = g.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, w * 0.62);
  bg.addColorStop(0, '#f0ddae'); bg.addColorStop(0.72, '#dcc08a'); bg.addColorStop(1, '#a3763e');
  g.fillStyle = bg; g.fill();
  g.save(); g.clip();
  g.lineWidth = 14; g.strokeStyle = 'rgba(80,42,14,.5)'; g.stroke();
  for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(140,95,45,${0.04 + rnd() * 0.06})`; g.beginPath(); g.arc(rnd() * w, rnd() * h, 20 + rnd() * 60, 0, 7); g.fill(); }
  const boxOf = (shore) => shore.reduce((b, [c, r]) => [Math.min(b[0], c), Math.max(b[1], c), Math.min(b[2], r), Math.max(b[3], r)], [Infinity, -Infinity, Infinity, -Infinity]);
  const isleBox = boxOf(CHART.isle.shore), empireBox = boxOf(CHART.empire.shore);
  const onLand = (c, r) => CHART.land.some((L) => c >= L.c0 - 0.5 && c <= L.c1 + 0.5 && r >= L.r0 - 0.5 && r <= L.r1 + 0.5) || r < -0.5
    || (c >= isleBox[0] - 1.5 && c <= isleBox[1] + 0.5 && r >= isleBox[2] - 0.5 && r <= isleBox[3] + 0.5)   // (Mischievious's isle, and its jetty)
    || (c >= empireBox[0] - 0.5 && c <= empireBox[1] + 0.5 && r >= empireBox[2] - 1.5 && r <= empireBox[3] + 0.5);   // (Port Decorum, and its jetty)
  // A hand-drawn line through points (pixels), wobbling a little between them.
  const wobbly = (pts, close, jag = 3) => {
    g.beginPath();
    pts.forEach(([x, y], i) => {
      if (!i) { g.moveTo(x, y); return; }
      const [px, py] = pts[i - 1], n = Math.max(1, Math.round(Math.hypot(x - px, y - py) / 14));
      for (let k = 1; k <= n; k++) { const t = k / n; g.lineTo(px + (x - px) * t + (k < n ? (rnd() - 0.5) * jag : 0), py + (y - py) * t + (k < n ? (rnd() - 0.5) * jag : 0)); }
    });
    if (close) g.closePath();
  };

  // The sea: little waves all over it.
  g.strokeStyle = 'rgba(52,72,84,.45)'; g.lineWidth = 2;
  const wave = (x, y) => { g.beginPath(); g.moveTo(x - 11, y); g.quadraticCurveTo(x - 5.5, y - 5, x, y); g.quadraticCurveTo(x + 5.5, y + 5, x + 11, y); g.stroke(); };
  for (let i = 0; i < 70; i++) {
    const c = -0.5 + rnd() * SAIL.COLS, r = -0.3 + rnd() * SAIL.ROWS;
    if (!onLand(c, r) && Math.abs(r - CHART.checkpoint.row) > 0.8) wave(...Q([c, r]));
  }

  // The cliffs on the left, drawn whole as they look from the sea, and the checkpoint's headland on
  // from them (off the left edge of the sheet, the high ground goes on).
  {
    const pts = [[-3, CHART.land[0].r0 - 0.5]];
    let r = CHART.land[0].r0 - 0.5;
    for (const L of CHART.land) { pts.push([L.c1 + 0.5, Math.max(r, L.r0 - 0.5)], [L.c1 + 0.5, L.r1 + 0.5]); r = L.r1 + 0.5; }
    pts.push([-3, r]);
    // (its corners worn round: each cut back along both sides)
    const px = pts.map((sq) => Q(sq)).flatMap((p, i, a) => {
      if (!i || i === a.length - 1) return [p];
      const cut = (q) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]), k = Math.min(16, d / 3) / d; return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]; };
      return [cut(a[i - 1]), cut(a[i + 1])];
    });
    wobbly(px, true, 12);
    g.fillStyle = LAND; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
    // Its face: a cliff's hachures along the edge, down toward the sea.
    g.strokeStyle = 'rgba(74,44,20,.6)'; g.lineWidth = 2;
    for (let i = 1; i < px.length - 1; i++) {
      const [x0, y0] = px[i - 1], [x1, y1] = px[i], len = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(len / 9);
      const nx = (y1 - y0) / len, ny = -(x1 - x0) / len;   // (pointing into the land)
      for (let k = 1; k < n; k++) { const t = (k + (rnd() - 0.5) * 0.6) / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, l = 5 + rnd() * 12; g.beginPath(); g.moveTo(x, y); g.lineTo(x + nx * l, y + ny * l); g.stroke(); }
    }
    // High ground: little hills on it.
    for (let i = 0; i < 9; i++) {
      const L = CHART.land[i % 2 ? 0 : 1], [x, y] = Q([L.c0 - 0.3 + rnd() * (L.c1 - L.c0 - 0.2), L.r0 + rnd() * (L.r1 - L.r0)]);
      g.beginPath(); g.moveTo(x - 10, y + 5); g.quadraticCurveTo(x, y - 12, x + 10, y + 5); g.stroke();
    }
  }

  // Rocks to steer by: a little clump, and the chart's cross by it.
  const rockAt = (x, y, s = 1) => {
    g.fillStyle = '#9b8c78'; g.strokeStyle = INK; g.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      const rx = x + (rnd() - 0.5) * 12 * s, ry = y + (rnd() - 0.5) * 6 * s, rr = (4 + rnd() * 4) * s;
      g.beginPath(); g.moveTo(rx - rr, ry + rr * 0.5); g.lineTo(rx - rr * 0.4, ry - rr * 0.7); g.lineTo(rx + rr * 0.5, ry - rr * 0.6); g.lineTo(rx + rr, ry + rr * 0.5); g.closePath(); g.fill(); g.stroke();
    }
  };
  // (and the rocks round Port Decorum's back: drawn whole, the smugglers' run behind them as rock too,
  // till you've found the beach there)
  for (const sq of [...CHART.rocks, ...CHART.kikkit.reef, ...(chart.smugglers ? CHART.smugglers.rocks : CHART.smugglers.whole)]) rockAt(...Q(sq));

  // Kikkit's island, a little sandy one by the reef's end, a palm on it; and Vegas Island beyond, the
  // penguins', only once you've been there (hidden gems are never hinted).
  const isle = (shore, fill) => {
    const corners = shore.map((sq) => Q(sq));
    const px = corners.flatMap((p, i, a) => {
      const cut = (q) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]), k = Math.min(14, d / 2.5) / d; return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]; };
      return [cut(a[(i + a.length - 1) % a.length]), cut(a[(i + 1) % a.length])];
    });
    wobbly(px, true, 6);
    g.fillStyle = fill; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
  };
  isle(CHART.kikkit.shore, SAND);
  isle(CHART.tzz.shore, SAND);   // (Tzz's, a hop away, unnamed)
  isle(CHART.empire.shore, LAND);   // (Port Decorum, the imperial island past the checkpoint, unnamed)
  {
    const [x, y] = Q([20, 17.2]);
    g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 3, y - 9, x + 1, y - 18); g.stroke();
    for (const a of [-2.6, -2, -1.2, -0.5]) { g.beginPath(); g.moveTo(x + 1, y - 18); g.quadraticCurveTo(x + 1 + Math.cos(a) * 8, y - 21 + Math.sin(a) * 3, x + 1 + Math.cos(a) * 14, y - 15 + Math.sin(a) * 4); g.stroke(); }
  }
  if (chart.vegas) isle(CHART.kikkit.vegas, '#f3f4f2');
  if (chart.smugglers) isle(CHART.smugglers.beach, SAND);   // (the smugglers' beach, once found)

  // The trade winds: streaks along each lane, arrows the way it blows.
  for (const { from, to } of CHART.lanes) {
    const [x0, y0] = Q(from), [x1, y1] = Q(to), len = Math.hypot(x1 - x0, y1 - y0) + ch;
    const ux = (x1 - x0) / (len - ch || 1), uy = (y1 - y0) / (len - ch || 1), sx = -uy, sy = ux;
    const ax = x0 - ux * ch / 2, ay = y0 - uy * ch / 2;   // (from the near edge of its first square)
    g.strokeStyle = 'rgba(40,74,96,.75)'; g.lineWidth = 2;
    for (const off of [-9, 9]) {
      g.setLineDash([10 + rnd() * 6, 7]); g.lineDashOffset = rnd() * 10;
      g.beginPath();
      for (let t = 0; t <= len; t += 6) { const wv = Math.sin(t / 9 + off) * 1.6, x = ax + ux * t + sx * (off + wv), y = ay + uy * t + sy * (off + wv); if (t) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
    }
    g.setLineDash([]); g.lineWidth = 2.5;
    for (let t = ch * 1.2; t < len - ch * 0.3; t += ch * 2.2) {
      const x = ax + ux * t, y = ay + uy * t;
      g.beginPath(); g.moveTo(x - ux * 7 + sx * 7, y - uy * 7 + sy * 7); g.lineTo(x, y); g.lineTo(x - ux * 7 - sx * 7, y - uy * 7 - sy * 7); g.stroke();
    }
  }

  // The imperial checkpoint: its line across the sea from the headland to the reef, the bastions
  // with their guns, the gatehouse over the gate with the Empire's flag, the boom slack under it.
  const K = CHART.checkpoint;
  {
    const [xa, y] = Q([K.from - 0.5, K.row]), [xb] = Q([K.to + 0.5, K.row]), [gx] = Q([K.gate, K.row]);
    g.fillStyle = '#b8ab92'; g.strokeStyle = INK; g.lineWidth = 2.5;
    for (const [a, b] of [[xa, gx - cw / 2], [gx + cw / 2, xb]]) { g.fillRect(a, y - 5, b - a, 10); g.strokeRect(a, y - 5, b - a, 10); }
    g.setLineDash([3, 4]); g.lineWidth = 2; g.beginPath(); g.moveTo(gx - cw / 2, y + 2); g.quadraticCurveTo(gx, y + 9, gx + cw / 2, y + 2); g.stroke(); g.setLineDash([]);
    for (const c of K.guns) {
      const [x] = Q([c, K.row]);
      g.fillStyle = '#b89a6a'; g.lineWidth = 2.5;
      g.fillRect(x - 13, y - 13, 26, 22); g.strokeRect(x - 13, y - 13, 26, 22);
      for (let i = 0; i < 4; i++) g.strokeRect(x - 13 + i * 7, y - 18, 5, 5);
      g.lineWidth = 5; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke();   // (its gun, trained toward the den)
    }
    for (const c of K.piers) {
      const [x] = Q([c, K.row]);
      g.fillStyle = '#e6dcc4'; g.lineWidth = 2.5;
      g.fillRect(x - 9, y - 30, 18, 38); g.strokeRect(x - 9, y - 30, 18, 38);
      for (let i = 0; i < 3; i++) g.strokeRect(x - 9 + i * 6.5, y - 35, 5, 5);
      g.fillStyle = '#a3271c'; g.fillRect(x - 4, y - 24, 8, 18);   // (a crimson banner down it)
    }
    // The arch between the piers, and the flag over it: crimson, a gold crown.
    g.strokeStyle = INK; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(gx - cw + 9, y - 22); g.quadraticCurveTo(gx, y - 44, gx + cw - 9, y - 22); g.stroke();
    g.beginPath(); g.moveTo(gx, y - 33); g.lineTo(gx, y - 62); g.stroke();
    g.fillStyle = '#a3271c'; g.beginPath(); g.moveTo(gx, y - 62); g.lineTo(gx + 26, y - 57); g.lineTo(gx, y - 50); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#d9a93a'; g.beginPath(); g.moveTo(gx + 4, y - 53); g.lineTo(gx + 5, y - 59); g.lineTo(gx + 8, y - 56); g.lineTo(gx + 11, y - 59); g.lineTo(gx + 12, y - 53); g.closePath(); g.fill();
  }
  // The reef, on out to the edge of the sea.
  for (let c = CHART.reef.from; c <= CHART.reef.to + 1; c += 0.5) { const [x, y] = Q([c, CHART.reef.row + (rnd() - 0.5) * 0.5]); rockAt(x, y, 0.8); }

  // The old wreck, aground on its sandbar: a broken hull, her mast snapped.
  {
    const [x, y] = Q(CHART.wreck);
    g.fillStyle = SAND; g.strokeStyle = 'rgba(74,44,20,.6)'; g.lineWidth = 2;
    g.beginPath(); g.ellipse(x, y + 5, 50, 15, 0, 0, 7); g.fill(); g.stroke();
    g.save(); g.translate(x, y); g.rotate(-0.25); g.scale(1.35, 1.35);
    g.fillStyle = '#8a5a30'; g.strokeStyle = INK; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(-26, -4); g.lineTo(14, -4); g.lineTo(6, 8); g.lineTo(-20, 8); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(14, -4); g.lineTo(20, -10); g.moveTo(10, 2); g.lineTo(22, 0); g.stroke();   // (her bows stove in)
    g.beginPath(); g.moveTo(-6, -4); g.lineTo(-2, -24); g.lineTo(8, -30); g.stroke();
    g.restore();
  }

  // Mischievious's isle: its sandy shore, palms, her chapel's ruin on its rise, a jetty out from it
  // toward the lanes with her flag on it, and bunting.
  {
    const corners = CHART.isle.shore.map((sq) => Q(sq));
    const px = corners.flatMap((p, i, a) => {   // (its corners worn round, as the cliffs')
      const cut = (q) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]), k = Math.min(14, d / 2.5) / d; return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]; };
      return [cut(a[(i + a.length - 1) % a.length]), cut(a[(i + 1) % a.length])];
    });
    wobbly(px, true, 6);
    g.fillStyle = SAND; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
    // The jetty, out from its shore, and her flag at its foot.
    const [jx, jy] = Q(CHART.isle.jetty), [ex] = Q([CHART.isle.jetty[0] + 0.5, 0]);
    g.fillStyle = '#9a7a55'; g.lineWidth = 2;
    g.fillRect(jx - cw * 0.45, jy - ch * 0.35, ex - jx + cw * 0.45, 7); g.strokeRect(jx - cw * 0.45, jy - ch * 0.35, ex - jx + cw * 0.45, 7);
    const fx = ex - cw * 0.12, fy = jy - ch * 0.35;
    g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx, fy - 30); g.stroke();
    g.fillStyle = '#d14a8b'; g.beginPath(); g.moveTo(fx, fy - 30); g.lineTo(fx + 18, fy - 25); g.lineTo(fx, fy - 20); g.closePath(); g.fill(); g.stroke();
    // Her chapel's ruin on its rise: a hill, broken walls, an arch.
    const [cx, cy] = Q(CHART.isle.chapel);
    g.strokeStyle = INK; g.lineWidth = 2.5; g.fillStyle = '#c7a86e';
    g.beginPath(); g.moveTo(cx - 34, cy + 12); g.quadraticCurveTo(cx, cy - 22, cx + 34, cy + 12); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#b9ad9c';
    for (const [dx, hh] of [[-16, 14], [-8, 9], [8, 16], [15, 7]]) { g.fillRect(cx + dx - 3, cy - 4 - hh, 6, hh); g.strokeRect(cx + dx - 3, cy - 4 - hh, 6, hh); }
    g.beginPath(); g.arc(cx, cy - 14, 6, Math.PI, 0); g.stroke();
    // Palms round the sand.
    for (const sq of [[17.2, 9.6], [20.2, 10.6], [17.6, 12.6], [18.9, 13.3]]) {
      const [x, y] = Q(sq);
      g.strokeStyle = INK; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 3, y - 9, x + 1, y - 18); g.stroke();
      for (const a of [-2.6, -2, -1.2, -0.5]) { g.beginPath(); g.moveTo(x + 1, y - 18); g.quadraticCurveTo(x + 1 + Math.cos(a) * 8, y - 21 + Math.sin(a) * 3, x + 1 + Math.cos(a) * 14, y - 15 + Math.sin(a) * 4); g.stroke(); }
    }
    // Bunting, from her flag up the isle toward the chapel.
    const [bx, by] = Q([CHART.isle.chapel[0] - 1.2, CHART.isle.chapel[1] - 1]);
    g.strokeStyle = 'rgba(74,44,20,.8)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(fx, fy - 26); g.quadraticCurveTo((fx + bx) / 2, (fy + by) / 2 - 4, bx, by - 14); g.stroke();
    const cols = ['#c8402a', '#d9a93a', '#d14a8b', '#3f7fa8'];
    for (let i = 1; i < 9; i++) {
      const t = i / 9, x = (1 - t) ** 2 * fx + 2 * (1 - t) * t * (fx + bx) / 2 + t * t * bx, y = (1 - t) ** 2 * (fy - 26) + 2 * (1 - t) * t * ((fy + by) / 2 - 4) + t * t * (by - 14);
      g.fillStyle = cols[i % cols.length]; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + 3, y); g.lineTo(x, y + 6); g.closePath(); g.fill();
    }
  }

  // Your cove at the bottom: the shore, the den's wall and its gate, the rocks either side, palms.
  {
    const pts = [];
    for (let i = 0; i <= 24; i++) { const c = -1 + i * (SAIL.COLS + 1) / 24; pts.push(Q([c, -0.5 - Math.sin(i / 24 * Math.PI) * 0.4 + (rnd() - 0.5) * 0.25])); }
    wobbly([...pts, [w + 20, h + 20], [-20, h + 20]], true);
    g.fillStyle = SAND; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
    const [x, y] = Q(CHART.den);
    g.fillStyle = '#7d7266';
    for (const s of [-1, 1]) {   // (the cove's rocks round the den)
      wobbly([[x + s * 66, y + 14], [x + s * 70, y - 8], [x + s * 110, y - 14], [x + s * 150, y + 2], [x + s * 160, y + 30], [x + s * 66, y + 30]], true, 5);
      g.fill(); g.stroke();
    }
    g.fillStyle = '#9b9488'; g.strokeStyle = INK; g.lineWidth = 2.5;
    g.fillRect(x - 60, y - 2, 120, 12); g.strokeRect(x - 60, y - 2, 120, 12);
    for (let i = 0; i < 7; i++) g.strokeRect(x - 60 + i * 18, y - 8, 9, 6);
    g.fillStyle = '#5b3a20'; g.fillRect(x - 9, y - 2, 18, 12);
    const palmAt = (px, py) => {
      g.strokeStyle = INK; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + 4, py - 14, px + 2, py - 26); g.stroke();
      for (const a of [-2.6, -2, -1.2, -0.5]) { g.beginPath(); g.moveTo(px + 2, py - 26); g.quadraticCurveTo(px + 2 + Math.cos(a) * 12, py - 30 + Math.sin(a) * 4, px + 2 + Math.cos(a) * 20, py - 22 + Math.sin(a) * 6); g.stroke(); }
    };
    for (const dx of [-230, -190, 200, 250]) palmAt(x + dx, y + 8 + rnd() * 8);
  }

  // The captain's way, dotted: out of the den, up the winds, to the gate, through it to the X.
  g.setLineDash([6, 7]); g.strokeStyle = '#7a2414'; g.lineWidth = 3;
  wobbly(ROUTE.map((sq) => Q(sq)), false, 0);
  g.stroke(); g.setLineDash([]);
  // X marks the spot.
  {
    const [x, y] = Q(X_AT);
    g.strokeStyle = '#b3201a'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 14, y - 14); g.lineTo(x + 14, y + 14); g.moveTo(x + 14, y - 14); g.lineTo(x - 14, y + 14); g.stroke();
    g.lineCap = 'butt';
  }

  // Words, with a halo of parchment so they read over the waves.
  const write = (text, x, y, font, col = INK, align = 'center') => {
    g.font = font; g.textAlign = align; g.textBaseline = 'middle';
    g.lineWidth = 6; g.strokeStyle = 'rgba(236,216,166,.9)'; g.lineJoin = 'round'; g.strokeText(text, x, y);
    g.fillStyle = col; g.fillText(text, x, y);
  };
  const wrap = (text, max, font) => {
    g.font = font;
    const out = [];
    let line = '';
    for (const word of text.split(' ')) { const t = line ? `${line} ${word}` : word; if (g.measureText(t).width > max && line) { out.push(line); line = word; } else line = t; }
    out.push(line);
    return out;
  };
  const NOTE = 'italic 21px Alegreya, serif';
  for (const n of [...NOTES, ...(chart.vegas ? [VEGAS_NOTE] : []), ...(chart.smugglers ? [SMUGGLERS_NOTE] : [])]) {
    const [x, y] = Q(n.at);
    if (n.along) {   // (written up along a lane, as on a chart)
      g.save(); g.translate(x, y); g.rotate(-Math.PI / 2);
      write(n.label, 0, 0, 'bold 22px Alegreya, serif', '#5a1a0c');
      g.restore();
      continue;
    }
    write(n.label, x, y, 'bold 25px Alegreya, serif', '#5a1a0c');
    if (n.note) write(n.note, x, y + 26, NOTE);
  }
  // What the captain scrawled, bottom left; a compass, bottom right.
  const SCRAWL = 'italic 23px Alegreya, serif';
  wrap(`"${RUMOUR}"`, 320, SCRAWL).forEach((ln, i) => write(ln, ...P(0.04, 0.6 + i * 0.045), SCRAWL, '#3a2210', 'left'));
  {
    const [x, y] = P(0.89, 0.66);
    g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.arc(x, y, 30, 0, 7); g.stroke();
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      g.beginPath(); g.moveTo(x + dx * 40, y + dy * 40); g.lineTo(x + dy * 7, y - dx * 7); g.lineTo(x - dy * 7, y + dx * 7); g.closePath();
      if (dy === -1) g.fill(); else g.stroke();
    }
    write('N', x, y - 62, 'bold 22px Alegreya, serif');
  }
  g.restore();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// The map, opened out: the parchment between two rolls, unrolling towards you.
function mapMake() {
  chart.vegas = (G.found ?? []).includes('vegas');
  chart.smugglers = (G.found ?? []).includes('smugglers');
  chart.tex ||= mapTexture();
  const g = new THREE.Group();
  chart.paper = mesh(new THREE.PlaneGeometry(MAP_W, MAP_D), new THREE.MeshStandardMaterial({ map: chart.tex, transparent: true, alphaTest: 0.4, roughness: 0.95, emissive: '#6a5a40', emissiveMap: chart.tex, side: THREE.DoubleSide }), false);
  chart.paper.rotation.x = -Math.PI / 2;
  chart.paper.receiveShadow = true;
  const rollM = mat('#e2cc98', { roughness: 0.9 });
  chart.rolls = [0, 1].map(() => { const r = mesh(new THREE.CylinderGeometry(0.035, 0.035, MAP_W + 0.04, 12), rollM); r.rotation.z = Math.PI / 2; g.add(r); return r; });
  g.add(chart.paper);
  chart.g = g;
  scene.add(g);
}
function mapLayout(t) {
  const u = Math.max(0.001, t), d = u * MAP_D;
  chart.paper.scale.y = u;
  chart.paper.position.set(0, 0.012, -MAP_D / 2 + d / 2);
  chart.tex.repeat.set(1, u); chart.tex.offset.set(0, 1 - u);   // (the top of the map first)
  const fat = 1 + (1 - t) * 0.9;
  chart.rolls[0].position.set(0, 0.035, -MAP_D / 2);
  chart.rolls[1].position.set(0, 0.035 * fat, -MAP_D / 2 + d);
  chart.rolls[1].scale.set(fat, 1, fat);
}
export function openMap() {
  if (!canRead(G.map) || chart.on || sail.on || carry || pirate.h > 0.3 || wm || sword.on || bilge.on || deco.on || cine || G.over) return;
  keys.clear();
  const ry = pirate.g.rotation.y;
  if (!chart.g) mapMake();
  else if (chart.vegas !== (G.found ?? []).includes('vegas') || chart.smugglers !== (G.found ?? []).includes('smugglers')) {
    // (Vegas Island or the smugglers' beach, been to since it was drawn: drawn again with it on)
    chart.vegas = (G.found ?? []).includes('vegas');
    chart.smugglers = (G.found ?? []).includes('smugglers');
    chart.tex.dispose();
    chart.tex = mapTexture();
    chart.paper.material.map = chart.paper.material.emissiveMap = chart.tex;
    chart.paper.material.needsUpdate = true;
  }
  // (laid where you stand: on the jetty, on its planks, not under them)
  chart.g.position.set(pirate.x + Math.sin(ry) * 0.95, Math.max(0, pirate.h), pirate.z + Math.cos(ry) * 0.95);
  chart.g.rotation.y = chart.yaw = ry + Math.PI;   // its top away from you
  chart.on = true;
  chart.open = 0;
  chart.g.visible = true;
  $('intro').classList.add('off');
  tourMaybe();   // (the first time: a short tour round it, quests.js)
}
/* Its keys: while the tour's on, Space, Enter or → for the next step, ← back, Esc skips it (M rolls
   the map up as ever); else T shows the tour again, and M, Esc, Space or Enter rolls it up. */
export function mapKey(key, e) {
  if (touring()) {
    if (!e?.repeat) tourStep(key);
    if (key === 'm') chart.on = false;
  } else if (key === 't') tourStart();
  else if (['escape', 'm', ' ', 'enter'].includes(key)) chart.on = false;
  return true;   // (nothing else while you're reading it: no walking off with it open)
}
// A click on it: the tour's next step, or rolled up.
export function mapClick() {
  if (touring()) tourStep('click');
  else chart.on = false;
}
// Picked up: yours (and your crew's: anyone can open it after).
export function takeMap() {
  if (guest()) send('host', { t: 'map' });
  G.map = 'found';
  if (chart.scroll) chart.scroll.visible = false;
  openMap();
}
export function mapPrompt() {
  if (cine) return 'Space: skip';
  if (chart.on) return 'The captain\'s map · M, Esc or Space: roll it up';
  if (nearMap()) return 'Space: pick up the map';
  return '';
}

/* "A map?" over the scroll while it's lying there, so it catches your eye from the den. */
function mapLabel() {
  const lab = chart.label ||= document.createElement('div');
  if (!lab.isConnected) $('labels').append(lab);
  const s = mapSpot();
  if (G.map !== 'lying' || cine || wm || deco.on || sword.on || bilge.on || chart.on || Math.hypot(pirate.x - s.x, pirate.z - s.z) > MAP.SEEN || nearMap()) { lab.style.display = 'none'; return; }
  const html = 'A map?<small>dropped on the beach: walk up and press Space</small>';
  if (lab.innerHTML !== html) { lab.className = 'label done'; lab.innerHTML = html; }
  v3.set(s.x, 0.9, s.z).project(camera);
  lab.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
  lab.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
  lab.style.display = v3.z > 1 ? 'none' : '';
}

export function mapTick(dt) {
  if (!guest()) G.map = mapAfter(G.map, G.phase);
  // The siege beaten just now (not skipped to): the cutscene.
  if (G.map === 'lying' && mapWas === 'none' && phaseWas === 'wave' && !G.over) cineStart();
  mapWas = G.map ?? 'none'; phaseWas = G.phase;
  // The scroll on the sand (the cutscene moves it itself).
  const lying = G.map === 'lying';
  if (lying && !chart.scroll) { chart.scroll = scrollMesh(); scene.add(chart.scroll); }
  if (chart.scroll && !cine) {
    chart.scroll.visible = lying;
    if (lying) { const s = mapSpot(); chart.scroll.position.set(s.x, 0.06, s.z); chart.scroll.rotation.set(0, 0.5, 0); }
  }
  mapLabel();
  // The map open: rolled up again if you've something else to do.
  if (chart.on && (carry || pirate.h > 0.3 || wm || G.over)) chart.on = false;
  chart.open = Math.max(0, Math.min(1, chart.open + (chart.on ? 1.6 : -2.4) * dt));
  document.body.classList.toggle('reading', chart.on);   // (only the map while you read it)
  if (chart.g) {
    mapLayout(chart.open * chart.open * (3 - 2 * chart.open));
    if (!chart.on && chart.open <= 0) chart.g.visible = false;
  }
  questsTick({ g: chart.g, w: MAP_W, d: MAP_D, open: chart.open, on: chart.on });   // (its tour and quests over it)
}
export function mapReset() {
  chart.on = false; chart.open = 0;
  if (chart.g) chart.g.visible = false;
  if (dal) cineEnd(true);
  mapWas = 'none'; phaseWas = 'build';
}

// ---------- the cutscene: their captain's parting shot ----------
/* Their captain is Dalnoth (the user, 9 Nov: "really does not look very much like Dalnoth"), drawn
   from his portrait on YPPedia. He's only a look (PIRATES in den-look.js): everything he wears is in
   the wardrobe, so you can dress as him too. A bit of a drunk: the ale slopping and the unsteady feet
   are the cutscene's (cineTick). His white monkey's the one that comes to you when you beat him. */
const dalnoth = () => makePirate({ look: PIRATES.Dalnoth });
/* The cutscene's beats, in seconds from the start. The user (9 Nov): "it feels just a bit forced
   how he just magically appears. Like maybe he should be the one like manning the cannon on the
   boat", and "a few more seconds of him rowing away on the boat would be good". So: him at their
   cannon on deck; over the side into his rowboat; rowing in; up the beach; the rant; the run for
   it (the map falling out of his coat); a good long row back out to the ship; then you, out
   through the gate to pick it up. */
const CINE = { deck: 1.4, jump: 2.1, row: 5.3, walk: 6.5, rant: 8.7, run: 10.1, off: 7, you: 13.4 };
function cineStart() {
  // Whatever you were doing is put down: out of the puzzles, the piece in hand back on its crate.
  if (wm) exitWall();
  if (deco.on) decoMode(false);
  sword.on = false; bilge.on = false; chart.on = false;
  if (carry) { if (carry.from && !carry.from.letter) putBack(); else { scene.remove(carry.group); worldLets.carry = null; } }
  keys.clear();
  const s = mapSpot(), bz = Math.max(shoreZ() + 0.5, s.z - 6.5);
  const cap = dalnoth();
  cap.g.scale.setScalar(1.1);
  scene.add(cap.g);
  // His rowboat, waiting under the ship's side (his own: the raids don't touch it).
  const boat = rowboat();
  boats.splice(boats.indexOf(boat), 1);
  const from = { x: ship.position.x - 1.2, z: BOAT_FROM }, land = { x: s.x - 1.4, z: bz };
  boat.g.position.set(from.x, 0, from.z);
  if (!chart.scroll) { chart.scroll = scrollMesh(); scene.add(chart.scroll); }
  chart.scroll.visible = false;
  // You, just inside the gate (the camera's on him, so nobody sees you put there).
  Object.assign(pirate, { x: wall.door.cx, z: 1.5, h: 0, hs: 0, hop: null });
  pirate.g.rotation.y = Math.PI;
  // Him: on deck, at their cannon.
  const deck = { x: ship.position.x + 0.1, z: SHIP_Z + 0.15 };
  dal = {
    t: 0, cap, at: { ...deck }, deck, from, land, stand: { x: s.x - 0.2, z: s.z - 1.5 }, boat, bz, drop: null, got: 0,
    says: bubble(PARTING), mine: bubble(FOUND_MAP), cam: { look: V3(deck.x, SHIP_DECK + 1, deck.z), dist: 7, tilt: 0.32, yaw: 0.3 },
    tick: dalTick, end: dalEnd,
  };
  cap.g.position.set(deck.x, SHIP_DECK, deck.z);
  cannon.userData.gunner.visible = false;   // (he's the one at their cannon: raids.js)
  cinePlay(dal);
}
// Over (played out, or skipped: js/den/cine.js).
function dalEnd(skip) {
  const c = dal;
  dal = null;
  scene.remove(c.cap.g);
  scene.remove(c.boat.g);
  cannon.userData.gunner.visible = true;   // back aboard, at their cannon as they sail off
  c.says.remove(); c.mine.remove();
  pirate.arms.forEach((a) => { a.rotation.x = 0; });
  if (!skip) takeMap();
}
// Him in his boat, pulling at the oars, the boat heading for (tx, tz).
function cineRow(c, t, u, a, b) {
  const e = u * u * (3 - 2 * u), g = c.boat.g, cap = c.cap, pull = Math.sin(t * 5.5);
  g.position.set(a.x + (b.x - a.x) * e, Math.sin(t * 2.1) * 0.05 - 0.06, a.z + (b.z - a.z) * e);
  g.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
  cap.g.position.set(g.position.x, g.position.y + 0.22, g.position.z);
  cap.g.rotation.set(0, g.rotation.y, 0);
  cap.legs.forEach((l) => { l.rotation.x = -1.3; });
  cap.arms.forEach((a2) => { a2.rotation.x = -0.9 + pull * 0.45; a2.rotation.z = 0; });
  g.userData.oars.forEach((o, i) => { o.rotation.y = (i ? 1 : -1) * pull * 0.45; o.rotation.x = Math.cos(t * 5.5) * 0.12; });
  c.at.x = g.position.x; c.at.z = g.position.z;
}
function dalTick(dt) {
  const c = dal, t = (c.t += dt), cap = c.cap, at = c.at, s = mapSpot(), T = CINE, bg = c.boat.g;
  if (t < T.deck) {
    // At their cannon, looking over at your wall.
    animateWalk(cap, false, dt);
    faceTo(cap, 0, 1, dt);
    cap.g.position.set(at.x, SHIP_DECK + Math.sin(performance.now() / 1000 * 0.9) * 0.07, at.z);
  } else if (t < T.jump) {
    // Over the side and down into his boat.
    const u = (t - T.deck) / (T.jump - T.deck);
    at.x = c.deck.x + (c.from.x - c.deck.x) * u; at.z = c.deck.z + (c.from.z - c.deck.z) * u;
    cap.g.position.set(at.x, SHIP_DECK * (1 - u) + 0.16 * u + Math.sin(u * Math.PI) * 0.8, at.z);
    cap.arms.forEach((a) => { a.rotation.x = -2.6; });
  } else if (t < T.row) {
    cineRow(c, t, (t - T.jump) / (T.row - T.jump), c.from, c.land);
  } else if (t < T.walk) {
    // Out of the boat and up the beach.
    bg.position.y = 0;
    stepTo(at, cap, c.stand.x, c.stand.z, 3, dt);
    cap.g.position.set(at.x, 0, at.z);
  } else if (t < T.rant) {
    animateWalk(cap, false, dt);
    faceTo(cap, 0, 1, dt);   // at the wall
    cap.arms[1].rotation.x = -2.7 + Math.sin(t * 22) * 0.35;
    cap.arms[0].rotation.x = -0.5 + Math.sin(t * 22) * 0.12;   // (the ale slopping)
    cap.arms[0].rotation.z = 0.25;
    cap.g.position.set(at.x, Math.abs(Math.sin(t * 11)) * 0.08, at.z);   // hopping mad
  } else if (t < T.run) {
    c.drop ||= { t: 0, from: V3(at.x, 1.2, at.z) };
    stepTo(at, cap, c.land.x, c.land.z + 0.1, 4.2, dt);
    cap.g.position.set(at.x, 0, at.z);
  } else {
    // A good long pull back out to the ship, boat and all dwindling as he gets there.
    const u = Math.min(1, (t - T.run) / T.off);
    cineRow(c, t, u, c.land, c.from);
    if (u > 0.75) { const k = 1 - (u - 0.75) / 0.25 * 0.95; bg.scale.setScalar(k); cap.g.scale.setScalar(1.1 * k); }
  }
  cap.g.rotation.z = t >= T.row && t < T.run ? Math.sin(t * 2.3) * 0.09 : 0;   // (a bit unsteady on his feet)
  // The map, tumbling out of his coat as he turns to run, bouncing once on the sand.
  if (c.drop && !c.got) {
    const u = Math.min(1, (c.drop.t += dt) / 0.8), sc = chart.scroll;
    sc.visible = true;
    const hop = u < 0.75 ? Math.sin(u / 0.75 * Math.PI) * 0.9 : Math.sin((u - 0.75) / 0.25 * Math.PI) * 0.15;
    sc.position.set(c.drop.from.x + (s.x - c.drop.from.x) * u, Math.max(0.06, c.drop.from.y * (1 - u) + hop), c.drop.from.z + (s.z - c.drop.from.z) * u);
    sc.rotation.set(u < 1 ? t * 9 : 0, 0.5, 0);
  }
  bubbleAt(c.says, t > T.walk + 0.1 && t < T.rant + 0.2, at.x, 2.6, at.z);
  // You: out through the gate to the map, and pick it up.
  const by = { x: s.x + 0.1, z: s.z + 0.8 }, gx = wall.door.cx;
  if (t > T.you) {
    if (pirate.z > -1.4) stepTo(pirate, pirate, gx, -1.6, 2.6, dt);
    else if (stepTo(pirate, pirate, by.x, by.z, 2.6, dt)) {
      faceTo(pirate, 0, -1, dt * 2);
      c.got ||= t;
      const u = Math.min(1, (t - c.got) / 0.5);
      pirate.arms.forEach((a) => { a.rotation.x = -1.3 * u; });
      chart.scroll.position.set(pirate.x, 0.06 + u * 0.95, pirate.z - 0.45 * u);
      chart.scroll.rotation.set(0, 0, 0);
      if (u >= 1 && !c.sparkled) { c.sparkled = true; burst(chart.scroll.position.clone(), '#ffd23a', 16, 2.2); }
    }
    pirate.g.position.x = pirate.x; pirate.g.position.z = pirate.z;
  }
  bubbleAt(c.mine, c.got && t - c.got > 0.4, pirate.x, 2.4, pirate.z);
  // The camera: on him at the cannon, following his boat in, on the beach for the rant (high enough
  // that his bubble's in the shot), following him back out, then on you coming out.
  const cam = c.cam;
  if (t < T.jump) { cam.look.set(c.deck.x, SHIP_DECK + 1, c.deck.z); cam.dist = 7; cam.tilt = 0.32; cam.yaw = 0.3; }
  else if (t < T.row) { cam.look.set(bg.position.x, 0.8, bg.position.z); cam.dist = 7.5; cam.tilt = 0.38; cam.yaw = 0.3; }
  else if (t < T.run + 0.6) { cam.look.set(at.x * 0.6 + s.x * 0.4, 1.6, Math.min(at.z, s.z - 1.5) - 1.2); cam.dist = 6; cam.tilt = 0.4; cam.yaw = 0.25; }   // (from out on the sand, clear of the wall)
  else if (t < T.you) { cam.look.set(bg.position.x * 0.6 + c.from.x * 0.4, 0.8, bg.position.z * 0.6 + c.from.z * 0.4); cam.dist = 8 + (t - T.run) * 0.8; cam.tilt = 0.36; cam.yaw = -0.35; }   // (their ship in the shot, where he's heading)
  else { cam.look.set(pirate.x, 1.0, pirate.z); cam.dist = c.got ? 3.4 : 5; cam.tilt = c.got ? 0.5 : 0.36; cam.yaw = Math.PI - 0.45; }
  if (c.got && t - c.got > 1.6) cineEnd(false);
}
