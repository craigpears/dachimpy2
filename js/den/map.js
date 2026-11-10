// The captain's map, and the cutscene of their captain's parting shot. (Split out of den.js.)
import * as THREE from 'three';
import { MAP, mapAfter, canPickUp, canRead, RUMOUR, WAYS, X_AT } from '../den-map.js';
import { PIRATES } from '../den-look.js';
import { $, scene, camera, mat, mesh, makePirate, animateWalk, faceTo, V3, pirate, carry, G, keys, wm, burst, v3, worldLets } from './world.js';
import { outside } from './land.js';
import { wall } from './wall.js';
import { putBack, exitWall } from './pieces.js';
import { SHIP_Z, SHIP_DECK, ship, BOAT_FROM, boats, rowboat } from './raids.js';
import { sword } from './sword.js';
import { shoreZ, bilge } from './bilge.js';
import { sail } from './sea.js';
import { guest, send } from './crew.js';
import { deco, decoMode } from './menus.js';

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
export let mapView = 0, cineView = 0, cine = null, cineCam = null, mapWas = 'none', phaseWas = 'build';

// Other parts of the den assign to these lets through this, as an imported binding can't be assigned.
export const mapLets = {
  get mapView() { return mapView; }, set mapView(v) { mapView = v; },
  get cineCam() { return cineCam; }, set cineCam(v) { cineCam = v; },
  get cineView() { return cineView; }, set cineView(v) { cineView = v; },
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

/* The map itself, drawn in ink on old parchment: your cove at the bottom, the sea, his island at the
   top with the X, and the three ways in. Drawn the first time it's opened (the fonts are in by then). */
function mapTexture() {
  const w = 1024, h = Math.round(w * MAP_D / MAP_W), cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  let seed = 11;
  const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const P = (u, v) => [u * w, v * h];
  const INK = '#4a2c14', PAPER = '#e9d4a2';
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
  // The sea: little waves all over the middle.
  g.strokeStyle = 'rgba(52,72,84,.5)'; g.lineWidth = 2;
  const wave = (x, y) => { g.beginPath(); g.moveTo(x - 13, y); g.quadraticCurveTo(x - 6.5, y - 6, x, y); g.quadraticCurveTo(x + 6.5, y + 6, x + 13, y); g.stroke(); };
  for (let i = 0; i < 40; i++) wave(40 + rnd() * (w - 80), h * (0.31 + rnd() * 0.46));
  const blob = (cu, cv2, ru, rv, n, jag, fill) => {
    g.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = i / n * Math.PI * 2, r = i === n ? 1 : 1 + (rnd() - 0.5) * jag;
      const [x, y] = P(cu + Math.cos(a) * ru * r, cv2 + Math.sin(a) * rv * r);
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
    }
    g.closePath(); g.fillStyle = fill; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
  };
  // His island, with the hidden cove bitten out of its east end.
  blob(0.5, 0.16, 0.31, 0.12, 40, 0.18, '#d6b778');
  blob(0.79, 0.19, 0.045, 0.045, 14, 0.2, PAPER);
  g.strokeStyle = 'rgba(74,44,20,.45)'; g.lineWidth = 2;
  for (let i = 0; i < 34; i++) {
    const a = rnd() * Math.PI * 2, [x, y] = P(0.5 + Math.cos(a) * 0.25, 0.16 + Math.sin(a) * 0.085);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 8); g.stroke();
  }
  // Palms.
  const palmAt = (u, v) => {
    const [x, y] = P(u, v);
    g.strokeStyle = INK; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 4, y - 14, x + 2, y - 26); g.stroke();
    for (const a of [-2.6, -2, -1.2, -0.5]) { g.beginPath(); g.moveTo(x + 2, y - 26); g.quadraticCurveTo(x + 2 + Math.cos(a) * 12, y - 30 + Math.sin(a) * 4, x + 2 + Math.cos(a) * 20, y - 22 + Math.sin(a) * 6); g.stroke(); }
  };
  palmAt(0.31, 0.15); palmAt(0.36, 0.09); palmAt(0.68, 0.1); palmAt(0.42, 0.21);
  // His defences: little towers along the front, cannon pointing out to sea.
  for (const u of [0.32, 0.4, 0.6, 0.68]) {
    const [x, y] = P(u, 0.245);
    g.fillStyle = '#b89a6a'; g.strokeStyle = INK; g.lineWidth = 2.5;
    g.fillRect(x - 9, y - 22, 18, 22); g.strokeRect(x - 9, y - 22, 18, 22);
    for (let i = 0; i < 3; i++) g.strokeRect(x - 9 + i * 6, y - 27, 5, 5);
    g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x + (u < 0.5 ? -8 : 8), y + 6); g.lineWidth = 4; g.stroke();
  }
  // The dotted ways: up his beach to the X, and across from your cove.
  const path = (pts) => { g.beginPath(); pts.forEach(([u, v], i) => { const [x, y] = P(u, v); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke(); };
  g.setLineDash([6, 7]); g.lineWidth = 2.5; g.strokeStyle = INK;
  path([[0.5, 0.27], [0.47, 0.21], [0.5, 0.155]]);
  g.strokeStyle = '#7a2414'; g.lineWidth = 3;
  path([[0.47, 0.82], [0.42, 0.66], [0.3, 0.52], [0.24, 0.45]]);                     // out to sea, with the guns
  path([[0.5, 0.82], [0.52, 0.62], [0.51, 0.42], [0.5, 0.29]]);                       // straight over, to land
  path([[0.53, 0.82], [0.75, 0.66], [0.93, 0.48], [0.92, 0.27], [0.83, 0.2]]);       // round the back, to the cove
  g.setLineDash([]);
  // The ship, and her shot arcing at the towers.
  {
    const [x, y] = P(0.22, 0.43);
    g.strokeStyle = INK; g.fillStyle = '#b07a43'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x - 30, y - 6); g.lineTo(x + 30, y - 6); g.lineTo(x + 20, y + 8); g.lineTo(x - 22, y + 8); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x, y - 52); g.stroke();
    g.fillStyle = '#f3e6c4'; g.beginPath(); g.moveTo(x + 2, y - 48); g.quadraticCurveTo(x + 26, y - 30, x + 2, y - 12); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#222'; g.fillRect(x - 1, y - 60, 14, 9);
    g.setLineDash([3, 6]); g.strokeStyle = 'rgba(74,44,20,.8)'; g.lineWidth = 2;
    for (const [u2, bend] of [[0.32, -60], [0.4, -40]]) { const [tx, ty] = P(u2, 0.235); g.beginPath(); g.moveTo(x + 18, y - 12); g.quadraticCurveTo((x + tx) / 2, Math.min(y, ty) + bend, tx, ty); g.stroke(); }
    g.setLineDash([]);
  }
  // Crossed swords below his beach.
  {
    const [x, y] = P(0.5, 0.33);
    g.strokeStyle = INK; g.lineWidth = 3;
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(x - 16 * s, y + 16); g.lineTo(x + 14 * s, y - 14); g.stroke();
      g.beginPath(); g.moveTo(x - 11 * s - 5, y + 7 - 5 * s); g.lineTo(x - 11 * s + 5, y + 7 + 5 * s); g.stroke();
    }
  }
  // The old pump in the hidden cove.
  {
    const [x, y] = P(0.79, 0.19);
    g.strokeStyle = INK; g.fillStyle = '#8a8f96'; g.lineWidth = 2.5;
    g.fillRect(x - 6, y - 14, 12, 18); g.strokeRect(x - 6, y - 14, 12, 18);
    g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x + 14, y - 22); g.stroke();
    g.beginPath(); g.moveTo(x + 6, y - 2); g.lineTo(x + 14, y - 2); g.lineTo(x + 14, y + 6); g.stroke();
  }
  // X marks the spot, and a little doodle of whoever's there: horned helmet, black beard, tankard, "?".
  {
    const [x, y] = P(...X_AT);
    g.strokeStyle = '#b3201a'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 16, y - 16); g.lineTo(x + 16, y + 16); g.moveTo(x + 16, y - 16); g.lineTo(x - 16, y + 16); g.stroke();
    g.lineCap = 'butt';
    const hx = x + 62, hy = y + 4;
    g.strokeStyle = INK; g.lineWidth = 2.5; g.fillStyle = '#efe6cf';
    g.beginPath(); g.arc(hx, hy, 13, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(hx + 11 * s, hy - 6); g.quadraticCurveTo(hx + 24 * s, hy - 10, hx + 22 * s, hy - 26); g.stroke(); }
    g.fillStyle = '#222'; g.beginPath(); g.arc(hx, hy + 12, 11, 0, Math.PI); g.fill();
    g.fillStyle = '#d9a93a'; g.fillRect(hx + 20, hy + 2, 12, 16); g.strokeRect(hx + 20, hy + 2, 12, 16);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(hx + 26, hy + 1, 6, Math.PI, 0); g.fill();
    g.fillStyle = INK; g.font = 'bold 30px Alegreya, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', hx + 46, hy + 4);
  }
  // Your cove at the bottom: its coast, the wall and its gate.
  g.beginPath(); g.moveTo(0, h * 0.86);
  for (let i = 0; i <= 20; i++) { const u = i / 20, [x, y] = P(u, 0.86 - Math.sin(u * Math.PI) * 0.05 + (rnd() - 0.5) * 0.012); g.lineTo(x, y); }
  g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fillStyle = '#d6b778'; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
  {
    const [x, y] = P(0.5, 0.86);
    g.fillStyle = '#9b9488'; g.strokeStyle = INK; g.lineWidth = 2.5;
    g.fillRect(x - 60, y - 2, 120, 12); g.strokeRect(x - 60, y - 2, 120, 12);
    for (let i = 0; i < 7; i++) g.strokeRect(x - 60 + i * 18, y - 8, 9, 6);
    g.fillStyle = '#5b3a20'; g.fillRect(x - 9, y - 2, 18, 12);
  }
  // Words, with a halo of parchment so they read over the waves.
  const write = (text, u, v, font, col = INK, align = 'center') => {
    const [x, y] = P(u, v);
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
  const NOTE = 'italic 22px Alegreya, serif';
  for (const wy of WAYS) {
    write(wy.label, wy.at[0], wy.at[1], 'bold 27px Alegreya, serif', '#5a1a0c');
    wrap(wy.note, 250, NOTE).forEach((ln, i) => write(ln, wy.at[0], wy.at[1] + 0.045 + i * 0.038, NOTE));
  }
  write('Yer den', 0.5, 0.94, 'bold 26px Alegreya, serif');
  // What the captain scrawled, bottom left; a compass, bottom right.
  const SCRAWL = 'italic 23px Alegreya, serif';
  wrap(`"${RUMOUR}"`, 330, SCRAWL).forEach((ln, i) => write(ln, 0.04, 0.66 + i * 0.045, SCRAWL, '#3a2210', 'left'));
  {
    const [x, y] = P(0.88, 0.7);
    g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.arc(x, y, 30, 0, 7); g.stroke();
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      g.beginPath(); g.moveTo(x + dx * 40, y + dy * 40); g.lineTo(x + dy * 7, y - dx * 7); g.lineTo(x - dy * 7, y + dx * 7); g.closePath();
      if (dy === -1) g.fill(); else g.stroke();
    }
    write('N', 0.88, 0.7 - 0.09, 'bold 22px Alegreya, serif');
  }
  g.restore();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// The map, opened out: the parchment between two rolls, unrolling towards you.
function mapMake() {
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
  if (!canRead(G.map) || chart.on || sail.on || carry || pirate.h > 0.05 || wm || sword.on || bilge.on || deco.on || cine || G.over) return;
  keys.clear();
  const ry = pirate.g.rotation.y;
  if (!chart.g) mapMake();
  chart.g.position.set(pirate.x + Math.sin(ry) * 0.95, 0, pirate.z + Math.cos(ry) * 0.95);
  chart.g.rotation.y = chart.yaw = ry + Math.PI;   // its top away from you
  chart.on = true;
  chart.open = 0;
  chart.g.visible = true;
  $('intro').classList.add('off');
}
export function mapKey(key) {
  if (['escape', 'm', ' ', 'enter'].includes(key)) chart.on = false;
  return true;   // (nothing else while you're reading it: no walking off with it open)
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
  if (chart.on && (carry || pirate.h > 0.05 || wm || G.over)) chart.on = false;
  chart.open = Math.max(0, Math.min(1, chart.open + (chart.on ? 1.6 : -2.4) * dt));
  document.body.classList.toggle('reading', chart.on);   // (only the map while you read it)
  if (chart.g) {
    mapLayout(chart.open * chart.open * (3 - 2 * chart.open));
    if (!chart.on && chart.open <= 0) chart.g.visible = false;
  }
  cineTick(dt);
}
export function mapReset() {
  chart.on = false; chart.open = 0;
  if (chart.g) chart.g.visible = false;
  cineEnd(true);
  mapWas = 'none'; phaseWas = 'build';
}

// ---------- the cutscene: their captain's parting shot ----------
/* Their captain is Dalnoth (the user, 9 Nov: "really does not look very much like Dalnoth"), drawn
   from his portrait on YPPedia. He's only a look (PIRATES in den-look.js): everything he wears is in
   the wardrobe, so you can dress as him too. A bit of a drunk: the ale slopping and the unsteady feet
   are the cutscene's (cineTick). His white monkey's the one that comes to you when you beat him. */
const dalnoth = () => makePirate({ look: PIRATES.Dalnoth });
function bubble(text) {
  const el = document.createElement('div');
  el.className = 'label say';
  el.textContent = text;
  el.style.display = 'none';
  $('labels').append(el);
  return el;
}
function bubbleAt(el, on, x, y, z) {
  if (!on) { el.style.display = 'none'; return; }
  v3.set(x, y, z).project(camera);
  el.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
  el.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
  el.style.display = v3.z > 1 ? 'none' : '';
}
// Walks o (anything with x and z) towards (tx, tz), p's legs going; true once there.
function stepTo(o, p, tx, tz, speed, dt) {
  const dx = tx - o.x, dz = tz - o.z, d = Math.hypot(dx, dz);
  if (d < 0.05 || !speed) { animateWalk(p, false, dt); return true; }
  const s = Math.min(d, speed * dt);
  o.x += dx / d * s; o.z += dz / d * s;
  faceTo(p, dx, dz, dt);
  animateWalk(p, true, dt, speed * 3.4);
  return false;
}
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
  cine = {
    t: 0, cap, at: { ...deck }, deck, from, land, stand: { x: s.x - 0.2, z: s.z - 1.5 }, boat, bz, drop: null, got: 0,
    says: bubble('We\'ll be back! *hic*'), mine: bubble('A map!'), cam: { look: V3(deck.x, SHIP_DECK + 1, deck.z), dist: 7, tilt: 0.32, yaw: 0.3 },
  };
  cap.g.position.set(deck.x, SHIP_DECK, deck.z);
  document.body.classList.add('cine');
  $('intro').classList.add('off');
}
export function cineEnd(skip) {
  if (!cine) return;
  const c = cine;
  cine = null;
  scene.remove(c.cap.g);
  scene.remove(c.boat.g);
  c.says.remove(); c.mine.remove();
  document.body.classList.remove('cine');
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
function cineTick(dt) {
  if (!cine) return;
  const c = cine, t = (c.t += dt), cap = c.cap, at = c.at, s = mapSpot(), T = CINE, bg = c.boat.g;
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
