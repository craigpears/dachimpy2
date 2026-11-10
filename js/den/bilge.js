// Bilging the shallows, on the beach. (Split out of den.js.)
import * as THREE from 'three';
import { Bilge, W as BW, H as BH } from '../bilge.js';
import { BILGE, Tide, HIGH, LOW, shoreAt, worth, barrelsFor, rocksBare, oddsFor, blastHits } from '../den-bilge.js';
import { S, rand, $, scene, camera, mat, mesh, canvasTex, woodTex, pirate, carry, G, keys, raiders, shake, ray, burst, tween, worldLets } from './world.js';
import { wall, holeX } from './wall.js';
import { GD, gunX0 } from './gundeck.js';
import { hit } from './raids.js';
import { online, say } from './crew.js';

// ---------- bilging the shallows (after Bilge) ----------
/* Out through the gate, on the beach to the right of the gun tower, the Bilge board lies in the
   shallows (src/bilge.ts, the real puzzle; src/den-bilge.ts, the tide and what it gives). Its top
   row is the dry sand nearest the wall; it runs out into the sea, and its water line is the sea's
   edge all along the beach. Bilge well and the tide goes out, the pieces you clear washing away and
   the water drawing back off the board; leave it and the tide creeps in. Sand the tide leaves bare,
   past high tide's mark, is strewn with sharp rocks that cut and slow the raiders landing beyond
   them. Two lines at once or better dredges up a powder barrel, rolled up the beach to a hole, that
   blows up raiders who come by. Solo only for now, like Swordfight: a crew's tide stays put.

   Seen as in the real puzzle: from the sea end, looking back at the den, row 0 at the top of the
   screen, the water at the bottom. So column 0 is the one furthest along the beach to the right
   (on the left of the screen as you look back at the den). */
export const tide = new Tide();
const bilgeHere = () => !online() && !G.over;
export const shoreZ = () => (online() ? shoreAt(BILGE.CREW_WATER) : tide.shore);
export const beachZ = () => shoreZ() + 0.15;
export const bilge = {
  board: new Bilge(Math.random, oddsFor(0)), group: new THREE.Group(), pieces: new THREE.Group(), x0: 4, on: false,
  cur: { r: 0, c: 2 }, shown: null, meshes: new Map(), queue: [], holdT: 0, rocks: [], barrels: [], water: null, cursor: null,
};
scene.add(bilge.group);
bilge.group.add(bilge.pieces);
const cellX = (c) => bilge.x0 + (BW - 0.5 - c) * BILGE.SQ;
const cellZ = (r) => BILGE.Z0 - (r + 0.5) * BILGE.SQ;
/* The pieces, drawn after Puzzle Pirates' own (the user, 9 Nov: "the graphics need to match Puzzle
   Pirates ... it's supposed to be in the water"): seven glassy pieces all in the sea's colours, each
   its own shape and pattern (two octagons, two spheres, a square, a rounded square and a pentagon),
   lying flat in the shallows; the crab orange, the pufferfish a yellow fish, the jellyfish a cyan
   and pink cap with purple tentacles. */
const BITS = [
  ['#7cc6f2', 'octagon', 'scallops'], ['#1e7d7a', 'octagon', 'swirl'], ['#1a9ae0', 'circle', 'wave'], ['#a6e2cf', 'circle', 'ripples'],
  ['#2147b8', 'square', 'diagonals'], ['#6f84a8', 'rounded', 'waves'], ['#2fb5c4', 'pentagon', 'stripes'],
];
function shapePath(g, shape, c, r) {
  g.beginPath();
  if (shape === 'circle') g.arc(c, c, r, 0, Math.PI * 2);
  else if (shape === 'octagon') for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4, rr = r / Math.cos(Math.PI / 8) * 0.97; g.lineTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr); }
  else if (shape === 'pentagon') for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5, rr = r * 1.08; g.lineTo(c + Math.cos(a) * rr, c + 8 + Math.sin(a) * rr); }
  else if (shape === 'square') g.rect(c - r * 0.92, c - r * 0.92, r * 1.84, r * 1.84);
  else g.roundRect(c - r * 0.95, c - r * 0.95, r * 1.9, r * 1.9, r * 0.38);
  g.closePath();
}
const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16), ch = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f))); return `rgb(${ch(16)},${ch(8)},${ch(0)})`; };
function bitFace(col, shape, pat) {
  return canvasTex(128, 128, (g, w) => {
    const c = w / 2, r = 54;
    // The body: glassy, lit from the top left, dark at the rim.
    shapePath(g, shape, c, r);
    const body = g.createRadialGradient(c - 22, c - 26, 4, c, c, r * 1.3);
    body.addColorStop(0, shade(col, 1.45)); body.addColorStop(0.45, col); body.addColorStop(1, shade(col, 0.55));
    g.fillStyle = body; g.fill();
    // Its pattern, lighter, kept inside the shape.
    g.save(); g.clip();
    g.strokeStyle = shade(col, 1.6); g.fillStyle = shade(col, 1.5); g.lineWidth = 7; g.lineCap = 'round';
    if (pat === 'scallops') for (let y = 22; y < 120; y += 22) for (let x = -10; x < 140; x += 26) { g.beginPath(); g.arc(x + (y / 22 % 2) * 13, y, 11, Math.PI, 0); g.stroke(); }
    else if (pat === 'swirl') { for (const s of [-1, 1]) { g.beginPath(); g.arc(c + s * 18, c - s * 4, 22, s > 0 ? Math.PI * 0.2 : Math.PI * 1.2, s > 0 ? Math.PI * 1.3 : Math.PI * 2.3); g.stroke(); } }
    else if (pat === 'wave') { g.lineWidth = 10; g.beginPath(); g.arc(c - 4, c + 6, 26, Math.PI * 0.9, Math.PI * 2.05); g.stroke(); g.beginPath(); g.arc(c + 18, c + 4, 10, Math.PI, Math.PI * 2.2); g.stroke(); }
    else if (pat === 'ripples') for (const rr of [16, 30, 44]) { g.beginPath(); g.arc(c + 6, c + 10, rr, Math.PI * 1.05, Math.PI * 1.75); g.stroke(); }
    else if (pat === 'diagonals') for (let x = -60; x < 160; x += 24) { g.beginPath(); for (let t = 0; t <= 1; t += 0.1) g.lineTo(x + t * 70 + Math.sin(t * 9) * 6, 10 + t * 110); g.stroke(); }
    else if (pat === 'waves') for (let y = 28; y < 120; y += 22) { g.beginPath(); for (let x = 0; x <= 128; x += 6) g.lineTo(x, y + Math.sin(x / 9) * 5); g.stroke(); }
    else if (pat === 'stripes') for (let y = 30; y < 120; y += 20) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(40, y - 10, 80, y + 10, 128, y); g.stroke(); }
    g.restore();
    // A dark outline, and a white gleam.
    shapePath(g, shape, c, r);
    g.lineWidth = 5; g.strokeStyle = shade(col, 0.35); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.beginPath(); g.ellipse(c + 26, c - 30, 9, 6, -0.6, 0, Math.PI * 2); g.fill();
  });
}
const specialFace = {
  crab: () => canvasTex(128, 128, (g) => {
    g.strokeStyle = '#7a3e08'; g.lineWidth = 7; g.lineCap = 'round';
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(64 + s * 26, 78 + i * 8); g.lineTo(64 + s * 50, 92 + i * 12); g.stroke(); }
    g.fillStyle = '#e8901e'; g.strokeStyle = '#6a3606'; g.lineWidth = 4;
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(64 + s * 30, 66); g.lineTo(64 + s * 44, 34); g.stroke();
      g.beginPath(); g.ellipse(64 + s * 44, 26, 14, 18, s * 0.3, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(64 + s * 40, 18, 3, 9, s * 0.3, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e8901e';
    }
    g.beginPath(); g.ellipse(64, 78, 36, 24, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    for (const s of [-1, 1]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(64 + s * 11, 66, 7, 0, Math.PI * 2); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(64 + s * 11, 67, 3.5, 0, Math.PI * 2); g.fill(); }
  }),
  puffer: () => canvasTex(128, 128, (g) => {
    g.fillStyle = '#f2d23a'; g.strokeStyle = '#6a5a10'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(112, 64); g.lineTo(124, 48); g.lineTo(124, 80); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(64, 64, 50, 24, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#fbf3c0'; g.beginPath(); g.ellipse(60, 74, 36, 10, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#a08a20'; g.lineWidth = 2; for (let x = 38; x < 96; x += 7) { g.beginPath(); g.moveTo(x, 68); g.lineTo(x + 3, 76); g.stroke(); }
    g.fillStyle = '#fff'; g.beginPath(); g.arc(30, 58, 8, 0, Math.PI * 2); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(28, 58, 4, 0, Math.PI * 2); g.fill();
  }),
  jelly: () => canvasTex(128, 128, (g) => {
    g.strokeStyle = '#6a58c8'; g.lineWidth = 9; g.lineCap = 'round';
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(36 + i * 14, 66); g.quadraticCurveTo(28 + i * 14, 92, 38 + i * 14, 118); g.stroke(); }
    g.fillStyle = '#3ad8e0'; g.strokeStyle = '#106a78'; g.lineWidth = 4;
    g.beginPath(); g.arc(64, 66, 46, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#f070c8'; for (const [x, y, r] of [[48, 44, 9], [74, 36, 8], [84, 56, 7], [56, 60, 6]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.ellipse(46, 34, 10, 5, -0.5, 0, Math.PI * 2); g.fill();
  }),
};
// Each piece lies flat, face up, the right way up as you look back at the den from the sea end, with
// a soft shadow under it.
const bitLook = {
  geo: new THREE.PlaneGeometry(0.92, 0.92),
  faces: BITS.map(([col, shape, pat]) => new THREE.MeshStandardMaterial({ map: bitFace(col, shape, pat), alphaTest: 0.5, roughness: 0.25, metalness: 0.05 })),
  special: {},
  shadow: new THREE.MeshBasicMaterial({ map: canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 4, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }), transparent: true, depthWrite: false }),
};
const faceOf = (b) => (b.s ? (bitLook.special[b.s] ||= new THREE.MeshStandardMaterial({ map: specialFace[b.s](), alphaTest: 0.5, roughness: 0.4 })) : bitLook.faces[b.k]);
// A piece's face as a picture, for boards drawn flat (the rowing boards: js/den/row-boards.js).
export const bitArt = (b) => faceOf(b).map.image;
export function bitMesh(b) {
  const face = faceOf(b);
  const g = new THREE.Group();
  const m = new THREE.Mesh(bitLook.geo, face);
  m.rotation.set(-Math.PI / 2, 0, Math.PI);
  m.position.y = 0.022;   // (layers: the board's sand 0.012, the pieces, the board's water 0.042, the sea 0.05)
  const sh = new THREE.Mesh(bitLook.geo, bitLook.shadow);
  sh.rotation.x = -Math.PI / 2;
  sh.position.set(-0.05, 0.012, 0.05);
  sh.scale.setScalar(1.05);
  g.add(sh, m);
  g.userData.face = m;
  return g;
}

// Laid out with the wall: to the right of the gun tower, the rocks out past high tide's mark.
export function bilgePlace(half) {
  const towerR = gunX0() + GD.cols * S, w = BW * BILGE.SQ;
  bilge.x0 = Math.min(half - 0.6 - w, Math.max(towerR + 1.2, (towerR + half) / 2 - w / 2));
  bilge.group.clear();
  bilge.pieces = new THREE.Group();
  bilge.group.add(bilge.pieces);
  bilge.meshes.clear();
  bilge.shown = null;
  const L = BH * BILGE.SQ, cx = bilge.x0 + w / 2, cz = BILGE.Z0 - L / 2;
  // Wet sand under the board, its squares faintly marked, and driftwood stakes down both sides.
  const bedTex = canvasTex(BW * 32, BH * 32, (g, cw, ch) => {
    g.fillStyle = '#a3865c'; g.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(60,40,20,${Math.random() * 0.12})`; g.fillRect(Math.random() * cw, Math.random() * ch, 2, 2); }
    g.strokeStyle = 'rgba(70,50,28,0.35)'; g.lineWidth = 1.5;
    for (let x = 0; x <= cw; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, ch); g.stroke(); }
    for (let y = 0; y <= ch; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(cw, y); g.stroke(); }
  });
  const bed = mesh(new THREE.PlaneGeometry(w, L), new THREE.MeshStandardMaterial({ map: bedTex, roughness: 1 }), false);
  bed.rotation.x = -Math.PI / 2;
  bed.position.set(cx, 0.012, cz);
  bilge.group.add(bed);
  // The water over the board's wet rows, the deep clear blue of the real puzzle's (under the sea's
  // own surface, which runs on over it).
  bilge.water = mesh(new THREE.PlaneGeometry(w, 1), new THREE.MeshBasicMaterial({ color: '#2a6fd8', transparent: true, opacity: 0.36, depthWrite: false }), false);
  bilge.water.rotation.x = -Math.PI / 2;
  bilge.water.renderOrder = 1;
  bilge.group.add(bilge.water);
  const stakeM = mat('#6a5038', { map: woodTex });
  for (const sx of [-1, 1]) for (let i = 0; i <= BH; i += 2) {
    const st = mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.9, 6), stakeM);
    st.position.set(cx + sx * (w / 2 + 0.25), 0.3, BILGE.Z0 - i * BILGE.SQ);
    st.rotation.z = (Math.random() - 0.5) * 0.2;
    bilge.group.add(st);
  }
  // The cursor, as in the real puzzle: orange brackets at the corners of the two squares, and
  // ticks between them.
  bilge.cursor = new THREE.Group();
  const orange = new THREE.MeshBasicMaterial({ color: '#f39a2b' }), q = BILGE.SQ, t = 0.07, len = 0.28;
  const bar = (x, z, sx, sz) => { const m = mesh(new THREE.BoxGeometry(sx, 0.03, sz), orange, false); m.position.set(x, 0.07, z); bilge.cursor.add(m); };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    bar(sx * (q - len / 2), sz * q / 2, len, t);
    bar(sx * q, sz * (q / 2 - len / 2), t, len);
  }
  for (const sz of [-1, 1]) bar(0, sz * (q / 2 - len / 2), t, len);
  bilge.group.add(bilge.cursor);
  // Sharp rocks and barnacled stones beyond high tide's mark, bare when the tide's out.
  bilge.rocks = [];
  const rockM = mat('#55504a', { flatShading: true, roughness: 0.9 }), barnM = mat('#cfc6b4', { flatShading: true });
  for (let i = 0; i < 70; i++) {
    const x = (Math.random() * 2 - 1) * (half + 1), z = HIGH - 0.3 - Math.random() * (HIGH - LOW - 0.3);
    if (x > bilge.x0 - 0.5 && x < bilge.x0 + w + 0.5) continue;
    const g = new THREE.Group(), n = 1 + rand(3);
    for (let j = 0; j < n; j++) {
      const r = mesh(new THREE.ConeGeometry(0.12 + Math.random() * 0.14, 0.25 + Math.random() * 0.35, 5), j ? barnM : rockM, false);
      r.position.set((Math.random() - 0.5) * 0.4, 0.1, (Math.random() - 0.5) * 0.4);
      r.rotation.set((Math.random() - 0.5) * 0.6, Math.random() * 3, (Math.random() - 0.5) * 0.6);
      g.add(r);
    }
    g.position.set(x, 0, z);
    g.userData.z = z;
    bilge.rocks.push(g);
    bilge.group.add(g);
  }
  // A crew's den has no board (yet): only the shore where it always was.
  bilge.group.visible = bilgeHere();
}

export const atBilge = () => bilgeHere() && pirate.h < 0.05 && pirate.x > bilge.x0 - 0.8 && pirate.x < bilge.x0 + BW * BILGE.SQ + 0.8 && pirate.z < BILGE.Z0 + 1.8 && pirate.z > shoreZ();
export function bilgeEnter() {
  bilge.on = true;
  keys.clear();
  Object.assign(pirate, { x: bilge.x0 + BW * BILGE.SQ / 2, z: BILGE.Z0 + 0.7 });   // at the top of the board, looking out over it
  pirate.g.rotation.y = Math.PI;
  $('intro').classList.add('off');
  if (!G.bilgeSaid) { G.bilgeSaid = true; say('Bilge the shallows: three in a row clear, and the tide goes out with every good move', false, true); }
}
// The keys play the board, as in the real puzzle: the arrows (or WASD) move the cursor, Space swaps.
export function bilgeKey(key, e) {
  if (key === 'escape') { bilge.on = false; return true; }
  const mv = { arrowleft: [0, -1], a: [0, -1], arrowright: [0, 1], d: [0, 1], arrowup: [-1, 0], w: [-1, 0], arrowdown: [1, 0], s: [1, 0] }[key];
  if (mv) { bilge.cur.r = Math.max(0, Math.min(BH - 1, bilge.cur.r + mv[0])); bilge.cur.c = Math.max(0, Math.min(BW - 2, bilge.cur.c + mv[1])); return true; }
  if (key === ' ' || key === 'enter') { if (!e.repeat) bilgeSwap(); return true; }
  return key === 'tab';
}
export const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
export function bilgeHover(x, y) {
  ray.setFromCamera(new THREE.Vector2(x / innerWidth * 2 - 1, -y / innerHeight * 2 + 1), camera);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(groundPlane, p)) return;
  // The cursor's two squares either side of the pointer, as in the real puzzle.
  const fc = BW - (p.x - bilge.x0) / BILGE.SQ, fr = (BILGE.Z0 - p.z) / BILGE.SQ;
  bilge.cur.c = Math.max(0, Math.min(BW - 2, Math.round(fc - 1)));
  bilge.cur.r = Math.max(0, Math.min(BH - 1, Math.floor(fr)));
}
const bilgeBusy = () => bilge.queue.length > 0;
export function bilgeSwap() {
  if (bilgeBusy()) return;
  const { r, c } = bilge.cur, b = bilge.board;
  b.water = tide.water;
  const m = b.swap(r, c);
  if (!m.moved) {
    // A crab won't budge: it does a little jig.
    for (const bit of [b.grid[r][c], b.grid[r][c + 1]]) if (bit?.s === 'crab') { const mm = bilge.meshes.get(bit.id); if (mm) mm.userData.jig = 0.6; }
    return;
  }
  bilge.queue.push(...m.stages);
  bilge.holdT = 0;
  const w = worth(m, tide.water);
  tide.pump(w);
  const nb = barrelsFor(m);
  for (let i = 0; i < nb; i++) setTimeout(() => dredge(), 500 + i * 450);
  const bits = [];
  if (m.combo) bits.push(m.combo);
  if (m.crabs) bits.push(m.crabs > 1 ? `${m.crabs} crabs up out of the water!` : 'A crab up out of the water!');
  if (nb) bits.push(nb > 1 ? `${nb} powder barrels dredged up!` : 'A powder barrel dredged up!');
  if (bits.length) say(`${bits.join(' ')}${w >= 3 ? ' The tide goes out' : ''}`);
}
// A powder barrel out of the shallows, rolled up the beach to the foot of the wall by a hole.
const kegM = { wood: mat('#7a4a26', { map: woodTex }), hoop: mat('#2a2a2a', { metalness: 0.6, roughness: 0.5 }), fuse: mat('#d8c9a0') };
export function dredge() {
  if (!bilgeHere()) return;
  const live = bilge.barrels.filter((b) => !b.gone);
  if (live.length >= BILGE.MAX_BARRELS) return;
  const holes = wall.holes;
  let x = 0;
  for (let t = 0; t < 12; t++) {
    const h = holes.length ? holes[rand(holes.length)] : null;
    x = h ? holeX(h) + (Math.random() - 0.5) * 2.4 : (Math.random() - 0.5) * wall.W * S * 0.8;
    if (live.every((b) => Math.abs(b.x - x) > 1.3)) break;
  }
  const z = -2.4 - Math.random() * 0.8;
  const g = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.62, 14), kegM.wood);
  body.position.y = 0.31;
  g.add(body);
  for (const y of [0.1, 0.52]) { const h = mesh(new THREE.TorusGeometry(0.305, 0.022, 6, 18), kegM.hoop, false); h.rotation.x = Math.PI / 2; h.position.y = y; g.add(h); }
  const fuse = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 5), kegM.fuse, false);
  fuse.position.set(0.08, 0.7, 0); fuse.rotation.z = -0.4;
  g.add(fuse);
  const from = new THREE.Vector3(bilge.x0 + BW * BILGE.SQ / 2, 0.4, shoreZ() + 0.5);
  g.position.copy(from);
  scene.add(g);
  const b = { g, x, z, landed: false, gone: false };
  bilge.barrels.push(b);
  tween(1.6, (t) => { g.position.set(from.x + (x - from.x) * t, Math.sin(t * Math.PI) * 2.2, from.z + (z - from.z) * t); g.rotation.x = t * 9; }, () => { g.position.set(x, 0, z); g.rotation.set(0, 0, 0); b.landed = true; });
}
// A raider coming by sets it off: everyone near is blown flat.
function blowBarrel(b) {
  b.gone = true;
  scene.remove(b.g);
  const at = new THREE.Vector3(b.x, 0.5, b.z);
  burst(at, '#ffb21a', 30, 6);
  burst(at, '#3a3a3a', 18, 3.5);
  worldLets.shake = 0.5;
  const near = blastHits(b, raiders.filter((r) => !r.inside && r.state !== 'down' && r.state !== 'row' && r.state !== 'rowOff'));
  near.forEach((r) => hit(r, new THREE.Vector3(b.x, 0, b.z), '#ffb21a'));
  say(near.length > 1 ? `Boom! A powder barrel blew ${near.length} raiders flat!` : 'Boom! A powder barrel blew a raider flat!');
}

export function bilgeTick(dt) {
  bilge.group.visible = bilgeHere();
  if (!bilgeHere()) { bilge.on = false; return; }
  if (bilge.on && (carry || !atBilge())) bilge.on = false;
  tide.tick(dt);
  const b = bilge.board, sz = shoreZ();
  b.water = tide.water;
  b.odds = oddsFor(G.wave);
  if (!bilge.shown) {
    bilge.shown = b.snap();
    for (let r = 0; r < BH; r++) for (let c = 0; c < BW; c++) { const bit = bilge.shown[r][c], m = bitMesh(bit); m.position.set(cellX(c), 0.01, cellZ(r)); bilge.pieces.add(m); bilge.meshes.set(bit.id, m); }
  }
  // A move a step at a time: what's cleared washes away, then the rest float up.
  bilge.holdT += dt;
  let moving = false;
  for (const m of bilge.meshes.values()) if (m.userData.tz !== undefined && Math.abs(m.position.z - m.userData.tz) + Math.abs(m.position.x - m.userData.tx) > 0.02) moving = true;
  if (bilge.queue.length && bilge.holdT > 0.18 && !moving) {
    const st = bilge.queue.shift();
    bilge.holdT = 0;
    for (const id of st.cleared) {
      const m = bilge.meshes.get(id);
      if (!m) continue;
      burst(m.position.clone().setY(0.3), '#dff3f6', 6, 1.6);
      bilge.pieces.remove(m);
      bilge.meshes.delete(id);
    }
    bilge.shown = st.grid;
    const fresh = Array(BW).fill(0);
    for (let r = 0; r < BH; r++) for (let c = 0; c < BW; c++) {
      const bit = st.grid[r][c];
      let m = bilge.meshes.get(bit.id);
      if (!m) {
        // New pieces wash in from the sea end, below the board, and float up into place.
        m = bitMesh(bit);
        m.position.set(cellX(c), 0.01, cellZ(BH + fresh[c]++));
        bilge.pieces.add(m);
        bilge.meshes.set(bit.id, m);
      }
      m.userData.tx = cellX(c); m.userData.tz = cellZ(r);
    }
  }
  // Pieces slide to their squares; under the water, more slowly (as in the real puzzle), and bobbing.
  const now = performance.now() / 1000;
  for (const [id, m] of bilge.meshes) {
    const tx = m.userData.tx ?? m.position.x, tz = m.userData.tz ?? m.position.z;
    const wet = m.position.z < sz, sp = (wet ? 3.5 : 7) * dt;
    const dx = tx - m.position.x, dz = tz - m.position.z, d = Math.hypot(dx, dz);
    if (d > 1e-3) { const k = Math.min(1, sp / d); m.position.x += dx * k; m.position.z += dz * k; }
    m.rotation.y = wet ? Math.sin(now * 1.3 + id) * 0.04 : 0;   // a little sway under the water
    if (m.userData.jig > 0) { m.userData.jig -= dt; m.rotation.y = Math.sin(m.userData.jig * 40) * 0.4; }
  }
  // The board's water, its edge the sea's.
  const end = BILGE.Z0 - BH * BILGE.SQ, len = Math.max(0.001, sz - end);
  bilge.water.scale.y = len;
  bilge.water.position.set(bilge.x0 + BW * BILGE.SQ / 2, 0.042, end + len / 2);
  bilge.water.visible = len > 0.01;
  bilge.cursor.visible = bilge.on;
  bilge.cursor.position.set((cellX(bilge.cur.c) + cellX(bilge.cur.c + 1)) / 2, 0, cellZ(bilge.cur.r));
  // Rocks bared by the tide; the first time, say what they're for.
  for (const g of bilge.rocks) g.visible = g.userData.z > sz + 0.1;
  if (!G.rocksSaid && rocksBare(sz) > 2 && G.wave > 0) { G.rocksSaid = true; say('The tide\'s out: sharp rocks on the bare sand cut up raiders landing beyond them'); }
  // Barrels: set off by a raider coming by.
  for (const br of bilge.barrels) {
    if (br.gone || !br.landed) continue;
    if (raiders.some((r) => !r.inside && r.state !== 'down' && r.state !== 'row' && r.state !== 'rowOff' && Math.hypot(r.x - br.x, r.z - br.z) < BILGE.FUSE)) blowBarrel(br);
  }
  bilge.barrels = bilge.barrels.filter((br) => !br.gone);
}
export function bilgePrompt() {
  if (bilge.on) return `The shallows · arrows or mouse move · Space or click swaps · Esc: walk${bilgeBusy() ? '' : ''}`;
  if (carry || !atBilge()) return '';
  return 'Space: bilge the shallows (the tide goes out, baring sharp rocks the raiders have to cross)';
}
export function bilgeReset() {
  tide.reset();
  bilge.on = false;
  bilge.board = new Bilge(Math.random, oddsFor(0));
  bilge.queue = [];
  for (const m of bilge.meshes.values()) bilge.pieces.remove(m);
  bilge.meshes.clear();
  bilge.shown = null;
  bilge.barrels.forEach((b) => scene.remove(b.g));
  bilge.barrels = [];
}
