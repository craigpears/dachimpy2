/* Pirate Den: a 3D proof of concept. A stone wall with a gate guards the den; raiders on the
   far side hack at it and a cannon blasts fresh holes. The pirate fetches pieces from three
   piles (the toolbox), carries them over and mends the holes.
   Same rules as the main puzzle: twelve pentominoes at their real draw weights. A hole filled
   exactly is a Masterpiece, and strong. A piece may also be nailed over the stone around a hole
   ("boarded over"): that always closes it, but the patch is weak and pays less. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { dressPirate, familiarTick, cleanLook, randomLook, cleanDen, cleanDesign, designOf, drawFlag, dyeHex, DYES, SKIN, HAIR, FUR, PARTS, FLAGS, PATTERNS, DECOR, MAX_DECOR, BIOMES, twoColours } from './den-look.js';

/* The main puzzle's engine, but searching a wide frame column by column (by turning it on its
   side): row by row, a long thin strip like a wall-walk can take the solver a minute; this way,
   a millisecond. Pentominoes turned on their side are still the same pentominoes. */
const C = { ...window.Carp, solve(cells, limit) {
  const b = window.Carp.bbox(cells);
  if (b.w <= b.h) return window.Carp.solve(cells, limit);
  const T = (cs) => cs.map(([r, c]) => [c, r]);
  return window.Carp.solve(T(cells), limit).map((t) => t.map((p) => ({ letter: p.letter, cells: T(p.cells) })));
} };
const S = 0.55;          // one carpentry square, in metres
const WOOD_D = 0.5;      // depth of a wooden piece
const STONE_D = 0.7;
const REACH = 2.4;       // how far along the wall the pirate can reach
// With the mouse, further: the next hole along, from in front of either one (the user: you
// shouldn't have to walk right up to each). Holes come in pairs about 4 m apart; not across the gate.
const MREACH = 6;
const WALL_Z = 2.7;      // how close to the wall the pirate must stand to fit a piece
const SPEED = 5.4;         // (4.6, then 5, now 5.4: the user and a friend wanted the pace a bit quicker)
// Seconds of one raider hacking at it at full speed (piece: each piece in an unfinished hole; patch:
// a board nailed on behind). A piece was 4: a half-mended hole fell in seconds and early waves were
// lost anyway; at 8, every piece you get in counts. (Balance tests in RULES.md.)
const HP = { master: 45, boarded: 10, piece: 8, patch: 12 };
const MAX_PATCHES = 3;
// Keeping them out pays well: each raider turned away at the wall, and more for a wave where not
// one got in (the user wanted more of a reward for blocking them off).
const PAY = { master: 10, boarded: 2, bonk: 3, steal: 10, turned: 5, clean: 10 };
/* The cannon: a few shots a wave (one in wave 2, two in wave 3, three after), each aimed for
   CANNON_AIM seconds first with the spot shown red on the wall, and a fresh breach is choked with
   RUBBLE seconds of hacking before anyone can climb through. (It used to fire every 9-20 seconds,
   straight through, and a raider was in two seconds later: nothing you did kept them out.) */
const CANNON_AIM = 8, CANNON_GAP = 22, RUBBLE = 10;
/* Raiders walk in, they don't jump in: only a gap two squares wide and three tall, down at the floor,
   lets them through (DOOR_W by DOOR_H). Any smaller or higher empty hole is a weak spot: WEAK seconds
   of hacking at the stone round it and it gives way into a bigger hole they can walk through (still
   whole pieces' worth of squares, so it can be mended). The user: hopping through a five-square gap
   high up the wall was "weird and dumb". */
const DOOR_W = 2, DOOR_H = 3, WEAK = 8;
const BUILD_SECS = 75, CALM_SECS = 20;
const RAIDER_DPS = 1, RAIDER_STAMINA = 16;
/* Getting through costs them: a raider who spent their strength hacking a way in arrives winded.
   They stop just inside to catch their breath (up to WINDED seconds, the more tired the longer) and
   then go for the chest slower (up to TIRED_SLOW slower). The user wanted hacking through to weaken
   the wave, and a window to deal with them when they do get in. */
const WINDED = 6, TIRED_SLOW = 0.4;
/* A wall giving way hits the ones hacking at it. When the last of a hole's wood or stone goes, the
   raiders at it reel back dazed for DAZE seconds, and stone that gives way chokes the new gap with
   FALLEN seconds of rubble to clear. The user: three raiders burst a hole together and walked straight
   in, barely tired, "there doesn't seem to be any win for it". */
const DAZE = 3, FALLEN = 5;
/* How fast raiders chop through wood, the main thing to balance. They start slow and build up wave
   by wave (start: the first wave's fraction of full speed; step: how much more each wave). To try
   other speeds without editing: den.html?hack=0.8 (a multiplier on all of it), or in the console
   den.tune.hack / den.tune.start / den.tune.step. */
const tune = { hack: Number(new URLSearchParams(location.search).get('hack')) || 1, start: 0.55, step: 0.15 };
const hackRate = () => RAIDER_DPS * tune.hack * Math.min(1, tune.start + tune.step * Math.max(0, G.wave - 1));
const k = (r, c) => r + ',' + c;
const rand = (n) => Math.floor(Math.random() * n);
const $ = (id) => document.getElementById(id);
// Kept in this browser: how your pirate looks, and how your den's dressed.
const saved = (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
const keep = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ } };
let myLook = cleanLook(saved('carp.den.look'));
let denLook = cleanDen(saved('carp.den.den'));

// ---------- renderer, scene, lights ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#1a110b');
scene.fog = new THREE.Fog('#1a110b', 20, 38);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);

const hemi = new THREE.HemisphereLight('#ffe6c4', '#3a2616', 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffd9a8', 1.6);
sun.position.set(-5, 12, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 14, bottom: -14, near: 1, far: 45 });
scene.add(sun);
// Moonlight from outside, so the outer face of the wall shows when you turn the view round.
const moon = new THREE.DirectionalLight('#a9bce0', 1.1);
moon.position.set(4, 10, -14);
scene.add(moon);

// Keep the view wide enough to see a good stretch of wall, whatever shape the window is.
function fitCamera() {
  camera.aspect = innerWidth / innerHeight;
  const hfov = 64 * Math.PI / 180;
  camera.fov = Math.min(80, Math.max(45, 2 * Math.atan(Math.tan(hfov / 2) / camera.aspect) * 180 / Math.PI));
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', fitCamera);
fitCamera();

// ---------- materials and little helpers ----------
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
function mesh(geo, m, shadow = true) {
  const x = new THREE.Mesh(geo, m);
  x.castShadow = shadow; x.receiveShadow = true;
  return x;
}
function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const stripes = (a, b) => canvasTex(4, 64, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(0, i * 8, 4, 8); } });
const woodTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#f2dcb8'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) {
    g.strokeStyle = `rgba(110, 66, 30, ${0.12 + Math.random() * 0.22})`;
    g.lineWidth = 1 + Math.random() * 2.5;
    const y = Math.random() * h;
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / 20 + i) * 2.5);
    g.stroke();
  }
});
const groundTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#7a5c3d'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(${Math.random() < 0.5 ? '40,26,14' : '170,135,95'}, ${Math.random() * 0.25})`;
    const s = 2 + Math.random() * 6;
    g.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
});
groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
groundTex.repeat.set(6, 6);

// Each letter gets its own shade of timber, so the piles are easy to tell apart.
const WOOD = { P: '#c98a45', F: '#b8743c', Y: '#d39a52', T: '#a8683a', N: '#c07a3f', L: '#d8a560', W: '#9c6036', U: '#b98048', V: '#cf9050', Z: '#a5703f', X: '#be8448', I: '#dcae6c' };
const woodMats = {};
const woodMat = (l) => (woodMats[l] ||= mat(WOOD[l], { map: woodTex, roughness: 0.7 }));
const cellBox = new THREE.BoxGeometry(S, S, WOOD_D);

/* A piece (or ghost) drawn in "cell space": the top-left corner of cell [0,0] at the origin,
   rows going down, the front face at z = 0. */
function pieceGroup(cells, m, edge = '#4a2a12') {
  const g = new THREE.Group();
  for (const [r, c] of cells) {
    const b = mesh(cellBox, m);
    b.position.set((c + 0.5) * S, -(r + 0.5) * S, -WOOD_D / 2);
    g.add(b);
  }
  g.add(outline(cells, 0.002, edge));
  return g;
}
function outline(cells, z, color) {
  const set = new Set(cells.map(([r, c]) => k(r, c)));
  const p = [];
  for (const [r, c] of cells) {
    const x0 = c * S, x1 = (c + 1) * S, y0 = -r * S, y1 = -(r + 1) * S;
    if (!set.has(k(r - 1, c))) p.push(x0, y0, z, x1, y0, z);
    if (!set.has(k(r + 1, c))) p.push(x0, y1, z, x1, y1, z);
    if (!set.has(k(r, c - 1))) p.push(x0, y0, z, x0, y1, z);
    if (!set.has(k(r, c + 1))) p.push(x1, y0, z, x1, y1, z);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color }));
}
// The same piece, centred on its own origin (for carrying and for the piles).
function centred(cells, m) {
  const b = C.bbox(cells);
  const inner = pieceGroup(cells, m);
  inner.position.set(-b.w * S / 2, b.h * S / 2, WOOD_D / 2);
  const g = new THREE.Group();
  g.add(inner);
  return g;
}
const rotCW = (cells) => C.normalize(cells.map(([r, c]) => [c, -r]));
const rotCCW = (cells) => C.normalize(cells.map(([r, c]) => [-c, r]));
const flip = (cells) => C.normalize(cells.map(([r, c]) => [r, -c]));

// Seen through the wall: raiders behind stone show as a red silhouette, so you always know where they are.
const xrayMat = new THREE.MeshBasicMaterial({ color: '#ff3b2a', transparent: true, opacity: 0.6, depthFunc: THREE.GreaterDepth, depthWrite: false });
function addXray(group, m = xrayMat) {
  const list = [];
  group.traverse((o) => { if (o.isMesh) list.push(o); });
  const xr = [];
  for (const o of list) { const s = new THREE.Mesh(o.geometry, m); s.renderOrder = 5; o.add(s); xr.push(s); }
  return xr;
}

// ---------- pirates: ours, and the raiders ----------
/* Ours and our crewmates' wear what they chose (den-look.js). Raiders and the gunner are still
   described the old way, in a few colours. */
function makePirate(o = {}) {
  if (o.look) return dressPirate(o.look, o);
  const { shirt = ['#f4efe4', '#b8322a'], scarf = '#c0392b', trousers = '#34395a', beard = '#5a3418', patch = true, sword = false } = o;
  return dressPirate({ body: 'm', top: 'striped', topCol: shirt[1], topCol2: shirt[0], hat: 'bandana', hatCol: scarf, legs: 'pants', legsCol: trousers, feetCol: '#2a1b12', hair: 'short', hairCol: beard, beard: 'full', patch, earring: true, fam: 'none' }, { sword });
}
// Change what a pirate already in the den is wearing, keeping where they are.
function wearLook(p, look) {
  const np = dressPirate(look), old = p.g;
  np.g.position.copy(old.position); np.g.rotation.copy(old.rotation); np.g.scale.copy(old.scale);
  old.parent?.add(np.g);
  old.parent?.remove(old);
  Object.assign(p, { g: np.g, legs: np.legs, arms: np.arms, body: np.body, fam: np.fam, look: np.look });
}
function animateWalk(p, moving, dt, speed = 11) {
  p.phase = moving ? p.phase + dt * speed : 0;
  familiarTick(p.fam, dt);
  const swing = moving ? Math.sin(p.phase) : 0;
  p.legs[0].rotation.x = swing * 0.6;
  p.legs[1].rotation.x = -swing * 0.6;
  p.arms[0].rotation.x = -swing * 0.5;
  p.arms[1].rotation.x = swing * 0.5;
  p.g.position.y = moving ? Math.abs(Math.cos(p.phase)) * 0.05 : 0;
  return swing;
}
function faceTo(p, dx, dz, dt) {
  let d = Math.atan2(dx, dz) - p.g.rotation.y;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  p.g.rotation.y += d * Math.min(1, dt * 12);
}

// ---------- the den: floor, rocks, torches, props ----------
const den = new THREE.Group();
scene.add(den);
const floor = mesh(new THREE.PlaneGeometry(70, 50), mat('#ffffff', { map: groundTex, roughness: 1 }), false);
floor.rotation.x = -Math.PI / 2;
floor.position.z = 4;
den.add(floor);
const rockMats = ['#5d5048', '#6b5c50', '#4f443d', '#73655a'].map((c) => mat(c, { flatShading: true }));
function rock(x, y, z, s) {
  const r = mesh(new THREE.DodecahedronGeometry(s, 0), rockMats[rand(rockMats.length)]);
  r.position.set(x, y, z);
  r.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  r.scale.y = 0.7 + Math.random() * 0.5;
  return r;
}
function torch(x, z) {
  const t = new THREE.Group();
  const stick = mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.6, 8), mat('#4a2f1a'));
  stick.position.y = 0.8;
  const flame = mesh(new THREE.ConeGeometry(0.13, 0.36, 10), new THREE.MeshBasicMaterial({ color: '#ffb347' }), false);
  flame.position.y = 1.78;
  const light = new THREE.PointLight('#ff9a3c', 14, 9, 1.6);
  light.position.y = 2;
  t.add(stick, flame, light);
  t.position.set(x, 0, z);
  return t;
}

// ---------- the wall, its gate and its holes ----------
let wall = null;
const wallGroup = new THREE.Group();
scene.add(wallGroup);
const stoneGeo = new RoundedBoxGeometry(S * 0.97, S * 0.95, STONE_D, 2, 0.06);
const X = (c) => (c - wall.W / 2) * S;     // left edge of column c
const Y = (r) => (wall.H - r) * S;         // top edge of row r
const backMat = mat('#120b07', { roughness: 1 });
const cellPlane = new THREE.PlaneGeometry(S, S);

// A one-piece hole, for a common piece (P, F, Y, T, N or L): see roomyShapes.
function lastGap() {
  const l = C.weightedLetter(['W', 'U', 'V', 'Z', 'X', 'I']);
  return C.pick(C.ORIENTS_BY_LETTER[l]).cells;
}

/* Holes made during a raid (cannon breaches, and weak spots hacked wider) are shaped for the common
   pieces: of a few candidates, the one with the most ways to fill it from P, F, Y, T, N and L. In the
   real puzzle fresh holes keep coming, so there's always room to dump an awkward piece; here the wall
   is fixed, and small breaches that only a W or a U could finish left the user stuck ("a lot of
   shapes that I can never really fill"). The wall you start with stays small and simple: the user
   likes that opening, so it keeps its 1, 2 and 3-piece holes, but they're picked the same way: with
   random ones the user still "wasn't getting the right pieces a lot at the start". (A test of a player who always picks the most flexible spot: random 1- and
   2-piece breaches left them with no piece that fits about 4 draws in every piece placed; 3-piece
   breaches picked this way, about 1.5.) */
const COMMON = new Set(['P', 'F', 'Y', 'T', 'N', 'L']);
const commonWays = (cells) => C.solve(cells, 400).filter((t) => t.every((p) => COMMON.has(p.letter))).length;
function roomyShapes(n, tries = 8) {
  return Array.from({ length: tries }, () => C.genHole(n).hole).map((s) => ({ s, w: commonWays(s) })).filter((o) => o.w > 0).sort((a, b) => b.w - a.w).map((o) => o.s);
}

function newWall() {
  const shapes = C.shuffle([1, 2, 2, 3]).map((n) => (n === 1 ? lastGap() : roomyShapes(n, 6)[0] || C.genHole(n).hole));
  const dims = shapes.map((s) => C.bbox(s));
  const H = Math.max(6, Math.max(...dims.map((d) => d.h)) + 2);
  let col = 3, gate = null;   // room at each end for the stairs up to the wall-walk
  const placed = shapes.map((s, i) => {
    // The gate, with room round it for the gun tower (fourteen squares wide), so its side guns
    // can fire along the wall at the raiders at the holes.
    if (i === 2) { col += 3; gate = { c0: col, c1: col + 3 }; col += 9; }
    const d = dims[i];
    const top = 1 + rand(H - 1 - d.h);
    const cells = s.map(([r, c]) => [r + top, c + col]);
    col += d.w + 2 + rand(2);
    return cells;
  });
  $('labels').replaceChildren();
  wall = { W: col + 1, H, holes: [], cellHole: new Map(), wood: new Set(), lining: Array.from({ length: MAX_PATCHES }, () => new Set()), gate: new Set(), gateCols: gate, stoneAt: new Map() };
  for (let r = 1; r < H; r++) for (let c = gate.c0; c <= gate.c1; c++) wall.gate.add(k(r, c));
  placed.forEach((cells) => registerHole(cells));
  buildWall();
  wall.holes.forEach((h) => { holeVisuals(h); updateHole(h); });
}

function registerHole(cells) {
  const h = { cells, b: C.bbox(cells), set: new Set(cells.map(([r, c]) => k(r, c))), filled: new Set(), pieces: [], lay: [], status: 'open', hp: 0, maxHp: 1, size: cells.length / 5, jig: 0, sig: '', weak: WEAK };
  h.door = doorOf(h);
  const i = wall.holes.push(h) - 1;
  cells.forEach(([r, c]) => wall.cellHole.set(k(r, c), i));
  return h;
}
function holeOutline(h) {
  if (h.vis) wallGroup.remove(h.vis);
  h.vis = outline(h.cells, 0.02, '#ffd58a');
  h.vis.position.set(X(0), Y(0), 0);
  wallGroup.add(h.vis);
}
function holeVisuals(h) {
  holeOutline(h);
  h.label = document.createElement('div');
  $('labels').append(h.label);
}
// The column a raider can walk in at (the left of a gap DOOR_W wide and DOOR_H tall at the foot of
// the wall), nearest the middle of the hole; null if there's none.
function doorOf(h) {
  const H = wall.H, mid = h.b.c0 + h.b.w / 2;
  let best = null;
  for (let c = h.b.c0; c + DOOR_W - 1 <= h.b.c1; c++) {
    let ok = true;
    for (let r = H - DOOR_H; r < H && ok; r++) for (let x = c; x < c + DOOR_W; x++) if (!h.set.has(k(r, x))) ok = false;
    if (ok && (best === null || Math.abs(c + DOOR_W / 2 - mid) < Math.abs(best + DOOR_W / 2 - mid))) best = c;
  }
  return best;
}

let stones = null, back = null;
/* Dark behind the stones, to hide the gaps between them, but not behind a hole: a hole is open
   right through, so you see out to the raiders until it's mended. */
function wallBack() {
  if (back) { wallGroup.remove(back); back.geometry.dispose(); }
  const pos = [];
  for (let r = 0; r < wall.H; r++) for (let c = 0; c < wall.W; c++) {
    if (wall.cellHole.has(k(r, c))) continue;
    const x0 = X(c), x1 = X(c + 1), y0 = Y(r + 1), y1 = Y(r);
    pos.push(x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y0, 0, x1, y1, 0, x0, y1, 0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  back = mesh(geo, backMat, false);
  back.position.z = -STONE_D - 0.02;
  wallGroup.add(back);
}
function buildWall() {
  wallGroup.clear();
  den.children.filter((o) => o.userData.scenery).forEach((o) => den.remove(o));
  const { W, H } = wall;
  const spots = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (!wall.cellHole.has(k(r, c)) && !wall.gate.has(k(r, c))) spots.push([r, c]);
  stones = new THREE.InstancedMesh(stoneGeo, mat('#ffffff', { roughness: 0.95 }), spots.length);
  stones.castShadow = stones.receiveShadow = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  spots.forEach(([r, c], i) => {
    const sx = 0.9 + Math.random() * 0.1, sy = 0.86 + Math.random() * 0.14;
    q.setFromEuler(new THREE.Euler(0, 0, (Math.random() - 0.5) * 0.08));
    m4.compose(new THREE.Vector3(X(c) + S / 2, Y(r) - S / 2, -STONE_D / 2 + Math.random() * 0.06), q, new THREE.Vector3(sx, sy, 1));
    stones.setMatrixAt(i, m4);
    col.setHSL(0.08 + Math.random() * 0.04, 0.05 + Math.random() * 0.06, 0.2 + Math.random() * 0.1);
    stones.setColorAt(i, col);
    wall.stoneAt.set(k(r, c), i);
  });
  wallGroup.add(stones);
  // A top course of flat capstones.
  for (let c = 0; c < W; c += 2) {
    const cap = mesh(new RoundedBoxGeometry(S * 2 - 0.03, S * 0.5, STONE_D + 0.12, 2, 0.05), mat('#4c443d'));
    cap.position.set(X(c) + S, Y(0) + S * 0.25, -STONE_D / 2 + 0.03);
    wallGroup.add(cap);
  }
  wallBack();
  wallGroup.add(makeGate());
  // Cave walls down both sides of the den, and rock piles where the wall meets them.
  const half = W * S / 2;
  const scenery = [];
  for (let i = 0; i < 9; i++) scenery.push(rock(-half - 0.6 - Math.random() * 1.2, Math.random() * H * S, -0.3, 0.7 + Math.random() * 0.6));
  for (let i = 0; i < 9; i++) scenery.push(rock(half + 0.6 + Math.random() * 1.2, Math.random() * H * S, -0.3, 0.7 + Math.random() * 0.6));
  for (let z = -14; z < 13; z += 1.4) {
    scenery.push(rock(-half - 2.2 - Math.random() - (z > HOUSE_Z0 - 1.5 && z < HOUSE_Z1 + 1.5 ? 1.4 : 0), 0.4, z, 1 + Math.random() * 0.8));
    scenery.push(rock(half + 2.2 + Math.random(), 0.4, z, 1 + Math.random() * 0.8));
  }
  makeRampart();
  scenery.push(torch(-half + 1.75, ramp.zBot + 0.3), torch(half - 1.75, ramp.zBot + 0.3), torch(X(wall.gateCols.c0) - 0.5, 1), torch(X(wall.gateCols.c1 + 1) + 0.5, 1));
  // Out beyond the wall: a rocky rise for the raiders' cannon.
  const cx = half * 0.45;
  const mound = rock(cx, -0.4, -16, 1.8);
  mound.scale.set(1.4, 0.5, 1.2);
  cannon.position.set(cx, 0.6, -16);
  cannon.visible = false;
  scenery.push(mound, cannon);
  // Props inside: three crates for the piles, a fire barrel, the treasure chest.
  piles.forEach((p, i) => { p.x = (i - 1) * Math.min(3.4, half * 0.42); p.z = 6.9; p.crate.position.set(p.x, 0.32, p.z); scenery.push(p.crate); });
  barrel.position.set(half - 1.4, 0, 7.6);
  chest.position.set(half - 1.7, 0, 9.7);
  scenery.push(barrel, chest);
  for (const x of [X(wall.gateCols.c0) - 0.3, X(wall.gateCols.c1 + 1) + 0.3]) {
    const fp = flagpole(1.8);
    fp.position.set(x, Y(0) + S * 0.5, -STONE_D / 2);
    scenery.push(fp);
  }
  scenery.forEach((o) => { o.userData.scenery = true; den.add(o); });
  bounds = { x: half - 0.35, z0: 0.55, z1: 10.5 };
  obstacles = [...piles.map((p) => ({ x: p.x, z: p.z, r: 0.75 })), { x: barrel.position.x, z: barrel.position.z, r: 0.55 }, { x: chest.position.x, z: chest.position.z, r: 0.75 }];
  piles.forEach(showPile);
  rebuildDecor();
  applyBiome(true);
  makePlot();
}

/* The rampart: a walk along the top of the wall, with stairs up from the den at either end. Up
   there the pirate can see over the wall and throw pieces down on the raiders hacking at it. None
   of it is there to start with: every plank of the walk and every step of the stairs is a carpentry
   piece the crew fits into a frame, and it stays that piece. Nothing turns into anything else. */
let ramp = null;
const STAIR_W = 1.1;
function makeRampart() {
  const half = wall.W * S / 2, T = wall.H * S + 0.38, n = wall.H + 1, zTop = 0.25, run = n * S, zBot = zTop + run;
  const cuts = [0, Math.round(wall.W / 3), Math.round(wall.W * 2 / 3), wall.W];
  const secs = [0, 1, 2].map((i) => ({ c0: cuts[i], c1: cuts[i + 1] - 1, x0: X(cuts[i]), x1: X(cuts[i + 1]) }));
  // What gets built, in order: an end stretch's walk and then its stairs, the other end's, the middle walk last.
  const jobs = [[0, 'deck'], [0, 'stair'], [2, 'deck'], [2, 'stair'], [1, 'deck'], [3, 'gun', 0], [3, 'gun', 1], [3, 'gun', 2], [4, 'house', 0], [4, 'house', 1], [4, 'house', 2], [4, 'house', 3]].map(([si, kind, part], i) => ({ i, si, kind, part, frame: null, up: false }));
  gd = null;
  ramp = { T, half, n, zTop, zBot, run, secs, jobs, next: 0, stairs: [[-half + 0.2, -half + 0.2 + STAIR_W], [half - 0.2 - STAIR_W, half - 0.2]] };
}
/* Building it. After a wave is beaten off, timber arrives for one stretch, and its frames come one
   at a time: the next only once the last is done, so there's never more than one to get on with.
   - The walk: a frame laid flat on the den floor in front of the wall. Lay pieces in it one at a
     time. A piece may stick out over the edge (so any piece will do); the spare is sawn off when
     the frame's full. Then the crew haul it up on ropes, pieces and all, and it's laid along the
     top of the wall. You walk on the very pieces you laid.
   - The stairs: a frame standing upright at the end of the den, a stepped stringer from the floor
     up to the walk. Fit pieces into it like a hole in the wall; they're the steps. */
const FRAME_Z = WALL_Z + 0.25;   // just behind where you stand to mend the wall
const frameMat = mat('#4a3220', { roughness: 1 });
const railMat = mat('#8a5a30', { map: woodTex });
const railGeo = [new THREE.BoxGeometry(0.06, S + 0.06, 0.07), new THREE.BoxGeometry(S + 0.06, 0.06, 0.07)];
const ropeMat = new THREE.LineBasicMaterial({ color: '#d8b77a' });
const frames = () => (ramp ? ramp.jobs.filter((j) => j.frame && !j.frame.done).map((j) => j.frame) : []);
const stairsUp = () => !!ramp && ramp.jobs.some((j) => j.kind === 'stair' && j.up);
// A point on a frame, from its grid (columns across, rows down), `z` out from its face.
const frameAt = (f, c, r, z = 0) => f.group.localToWorld(new THREE.Vector3(c * S, -r * S, z));
// The walk: three full rows along the top of the wall (two over the stone, so the stretches join
// up, and one over the den side), and a ragged fourth overhanging the den, all clear of where the
// stairs come up. (It was two rows and a ragged third: the user found it "very slim", with not much
// room to be creative, and wanted bigger pieces of work to invest in.)
function deckShape(si) {
  const s = ramp.secs[si], w = s.c1 - s.c0 + 1, base = [];
  const clear = (c) => !(si === 0 && c < 3) && !(si === 2 && c >= w - 3);
  for (let r = 0; r < 3; r++) for (let c = 0; c < w; c++) if (r < 2 || clear(c)) base.push([r, c]);
  const cols = [...Array(w).keys()].filter(clear);
  let extra = (5 - base.length % 5) % 5;
  while (extra < 5 && extra + 5 <= cols.length) extra += 5;   // a ragged edge of five squares at least
  if (extra > cols.length) extra = 0;
  for (let i = 0; i < 60; i++) {
    const cells = base.concat(C.shuffle(cols.slice()).slice(0, extra).map((c) => [3, c]));
    if (C.solve(cells, 1).length) return cells;
  }
  return base.length % 5 ? base.slice(0, base.length - base.length % 5) : base;
}
// The stairs: a stepped band three squares deep, from the walk at the wall down to the den floor.
// Column 0 is at the bottom of the left stairs, and at the top of the right ones.
// Thickened under the top, or trimmed at the foot, so it can be filled with not a scrap wasted.
function stairShape(si) {
  const n = ramp.n, band = [], under = [];
  for (let c = 0; c < n; c++) {
    const top = si === 0 ? n - 1 - c : c;
    for (let r = top; r <= Math.min(n - 1, top + 2); r++) band.push({ cell: [r, c], s: top });
    if (top + 3 <= n - 1) under.push({ cell: [top + 3, c], s: top });
  }
  band.sort((a, b) => a.s - b.s || a.cell[0] - b.cell[0]);
  under.sort((a, b) => a.s - b.s);
  const m = band.length % 5, tries = m ? [band.concat(under.slice(0, 5 - m)), band.slice(0, band.length - m)] : [band];
  const cells = (list) => list.map((o) => o.cell);
  return cells(tries.find((t) => C.solve(cells(t), 1).length) || band);
}
function openJob(i, shape = null) {
  const j = ramp.jobs[i];
  if (!j || j.frame) return j?.frame || null;
  if (j.kind !== 'house') ramp.next = Math.max(ramp.next, i + 1);
  const stair = j.kind === 'stair';
  shape ||= stair ? stairShape(j.si) : j.kind === 'gun' ? gunShape(j.part) : j.kind === 'house' ? houseShape(j.part) : deckShape(j.si);
  if (isHost()) send('all', { t: 'frame', fi: i, cells: shape });
  const g = new THREE.Group();
  if (j.kind === 'house') {
    // Laid flat on the floor in front of where the house goes, face up.
    const flat = housePose(-1);
    g.position.copy(flat.p);
    g.quaternion.copy(flat.q);
  } else if (!stair) {
    // Laid flat: the rows run from the wall towards the den, the face is up.
    g.position.set(j.kind === 'gun' ? gunX0() : ramp.secs[j.si].x0, 0, j.kind === 'gun' ? GUN_FRAME_Z : FRAME_Z);
    g.rotation.x = -Math.PI / 2;
  } else {
    // Stood on end against the side of the cave, facing into the den.
    const [xa, xb] = ramp.stairs[j.si ? 1 : 0];
    if (j.si === 0) { g.position.set(xb, ramp.T, ramp.zBot); g.rotation.y = Math.PI / 2; }
    else { g.position.set(xa, ramp.T, ramp.zTop); g.rotation.y = -Math.PI / 2; }
    g.scale.y = ramp.T / (ramp.n * S);
  }
  const set = new Set(shape.map(([r, c]) => k(r, c)));
  for (const [r, c] of shape) {
    const p = mesh(cellPlane, frameMat, false);
    p.receiveShadow = true;
    p.position.set((c + 0.5) * S, -(r + 0.5) * S, stair ? -STAIR_W - 0.01 : 0.012);
    g.add(p);
    // A timber rail round the edge, so it reads as a frame to fill.
    for (const [a, z] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      if (set.has(k(r + a, c + z))) continue;
      const rail = mesh(railGeo[a ? 1 : 0], railMat);
      rail.position.set((c + 0.5 + z * 0.5) * S, -(r + 0.5 + a * 0.5) * S, 0.035);
      g.add(rail);
    }
  }
  g.add(outline(shape, 0.075, '#9fe0ff'));
  g.userData.scenery = true;
  den.add(g);
  g.updateMatrixWorld(true);
  const label = document.createElement('div');
  $('labels').append(label);
  const b = C.bbox(shape);
  const f = j.frame = {
    i, si: j.si, kind: j.kind, part: j.part, cells: shape, b, set, occ: new Set(), filled: new Set(), pieces: [], group: g, label, sig: '', done: false,
    pz: stair ? 0 : 0.1, zs: stair ? STAIR_W / WOOD_D : 1,
    plane: new THREE.Plane().setFromNormalAndCoplanarPoint(g.getWorldDirection(new THREE.Vector3()), g.getWorldPosition(new THREE.Vector3())),
  };
  f.mid = frameAt(f, b.w / 2, b.h / 2, stair ? 0.4 : 0.7);
  frameState(f);
  burst(frameAt(f, b.w / 2, b.h / 2, 0.3), '#e8c890', 18, 3);
  return f;
}
function frameState(f) {
  f.open = f.cells.filter(([r, c]) => !f.filled.has(k(r, c)));
  f.exact = f.open.length % 5 === 0 && C.solve(f.open, 1).length > 0;
  f.sig = '';
}
// Every spot a piece could go in a frame: covering at least one empty square of it, clear of the
// pieces already there. Squares off the frame are allowed; `over` counts them.
// The stairs' tread line: the top row of column c (beyond either end, it carries straight on). A
// piece may stick up at most one square above it, so the stairs stay climbable with a hop.
const stepTop = (f, c) => (f.si === 0 ? ramp.n - 1 - c : c);
function frameFits(cells) {
  const out = [], b = C.bbox(cells);
  for (const f of frames()) {
    const seen = new Set();
    for (const [er, ec] of f.open) for (const [pr, pc] of cells) {
      const dr = er - pr, dc = ec - pc;
      if (seen.has(k(dr, dc))) continue;
      seen.add(k(dr, dc));
      let over = 0, ok = true;
      for (const [r, c] of cells) {
        const kk = k(r + dr, c + dc);
        if (f.occ.has(kk) || (f.kind === 'stair' && r + dr < stepTop(f, c + dc) - 1)) { ok = false; break; }
        if (!f.set.has(kk)) over++;
      }
      if (!ok) continue;
      const gc = dc + b.w / 2, gr = dr + b.h / 2, w = frameAt(f, gc, gr);
      out.push({ frame: f, dr, dc, over, gc, gr, cx: w.x, cy: w.y, cz: w.z });
    }
  }
  return out;
}
// A piece in a frame, where it ends up (no flying in): for placing, and for a joiner's copy.
function putFramePiece(f, i) {
  const g = pieceGroup(i.shape, woodMat(i.letter));
  g.position.set(i.dc * S, -i.dr * S, f.pz);
  g.scale.z = f.zs;
  f.group.add(g);
  const cells = i.shape.map(([r, c]) => k(r + i.dr, c + i.dc));
  cells.forEach((kk) => { f.occ.add(kk); if (f.set.has(kk)) f.filled.add(kk); });
  const b = C.bbox(i.shape), w = frameAt(f, i.dc + b.w / 2, i.dr + b.h / 2);
  const piece = { group: g, cells, shape: i.shape, over: i.over, cx: w.x, cy: w.y, cz: w.z, by: i.by, info: i, undo: null };
  f.pieces.push(piece);
  return piece;
}
function placeFrame(t, by, hand) {
  const f = t.frame;
  const info = { letter: hand.letter, shape: hand.cells, dr: t.dr, dc: t.dc, over: t.over, by };
  const from = f.group.worldToLocal(hand.group.position.clone());
  scene.remove(hand.group);
  if (hand === carry) carry = null;
  const piece = putFramePiece(f, info), g = piece.group, to = g.position.clone(), b = C.bbox(info.shape);
  const off = new THREE.Vector3(-b.w * S / 2, b.h * S / 2, 0);
  const undo = piece.undo = { frame: f, letter: info.letter, shape: info.shape, piece, hpAfter: null };
  if (by === myId()) lastPlaced = undo;
  frameState(f);
  if (isHost()) send('all', { t: 'place', frame: f.i, ...info });
  tween(0.32, (s) => {
    g.position.lerpVectors(from.clone().add(off), to, 1 - (1 - s) ** 3);
    g.position.z += Math.sin(s * Math.PI) * 0.6;
  }, () => {
    g.position.copy(to);
    if (!f.pieces.includes(piece)) return;
    undo.hpAfter = 0;
    burst(new THREE.Vector3(piece.cx, piece.cy + 0.15, piece.cz), '#e8c890', 8, 2);
    if (f.filled.size === f.cells.length) finishFrame(f);
    else if (piece.over && by === myId() && f.kind !== 'stair') toast('It sticks out over the frame: the spare gets sawn off', false, true);
  });
  refill(hand.from);
}
/* A gap in a frame is yours to sort out: nothing fills it for you (the user: "if there's a gap,
   that's it, that's broken. That's the point of it being a puzzle"). Lift pieces back out to undo
   it: any piece in a frame that isn't finished yet (liftable, lift). */
// The frame's full: saw off what sticks out. A walk is then hauled up onto the wall; stairs are
// done where they stand. `quiet` is for a joiner catching up: no sawdust, no pay, no waiting.
function finishFrame(f, quiet = false) {
  if (f.done) return;
  f.done = true;
  f.label.remove();
  if (lastPlaced?.frame === f) lastPlaced = null;
  let waste = 0;
  const j = ramp.jobs[f.i];
  if (f.kind === 'stair') {
    // Stairs stay exactly as built, bits sticking out and all: you walk on the tops of the pieces.
    j.tops = new Map();
    for (const kk of f.occ) { const [r, c] = kk.split(',').map(Number); if (!(j.tops.get(c) <= r)) j.tops.set(c, r); }
    j.up = true;
    if (!quiet) {
      if (f.pieces.some((p) => p.over)) toast('The stairs are up, just as you built them');
      else { G.gold += PAY.master; updateStats(); toast(`Shipshape stairs! Not a square out of place (+${PAY.master})`); }
    }
    jobDone(j, quiet);
    return;
  }
  for (const p of f.pieces) {
    const kept = [], old = p.group.children[p.group.children.length - 1];
    p.shape.forEach((cell, i) => {
      if (f.set.has(p.cells[i])) { kept.push(cell); return; }
      waste++;
      const m = p.group.children[i], at = new THREE.Vector3();
      m.getWorldPosition(at);
      if (!quiet) burst(at, '#f0d9a8', 10, 2.5);
      m.visible = false;
    });
    old.visible = false;
    p.group.add(outline(kept, 0.002, '#4a2a12'));
  }
  if (!quiet) {
    if (waste) toast(`Sawn to fit: ${waste} square${waste > 1 ? 's' : ''} of offcuts`);
    else { G.gold += PAY.master; updateStats(); toast(`Shipshape! Not a scrap wasted (+${PAY.master})`); }
  }
  if (j.kind === 'house') { raiseHouse(f, j, quiet); return; }
  const g = f.group, p0 = g.position.clone(), p1 = new THREE.Vector3(p0.x, ramp.T - 0.05, j.kind === 'gun' ? gunZ0() + partR0(j.part) * S : -0.85);
  const land = () => {
    g.position.copy(p1);
    g.updateMatrixWorld(true);
    Object.assign(j, { up: true, x0: p1.x, z0: p1.z, set: f.set });
    if (j.kind === 'gun' && ramp.jobs.every((o) => o.kind !== 'gun' || o.up)) makeGunDeck();
    jobDone(j, quiet);
  };
  if (quiet) { land(); return; }
  // Hauled up on four ropes from a block over the wall: up first, then in over the top.
  const top = new THREE.Vector3(p0.x + f.b.w * S / 2, ramp.T + 2.4, -0.3);
  const block = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.14, 12), railMat);
  block.rotation.x = Math.PI / 2;
  block.position.copy(top);
  const pos = new Float32Array(24), geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const ropes = new THREE.LineSegments(geo, ropeMat);
  ropes.frustumCulled = false;
  den.add(block, ropes);
  const corners = [[0, 0], [f.b.w, 0], [0, f.b.h], [f.b.w, f.b.h]];
  const rig = () => {
    g.updateMatrixWorld(true);
    corners.forEach(([c, r], n) => { const w = frameAt(f, c, r, 0.1); pos.set([top.x, top.y, top.z, w.x, w.y, w.z], n * 6); });
    geo.attributes.position.needsUpdate = true;
  };
  rig();
  const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
  tween(0.9, rig, () => tween(2.2, (u) => {
    // (A part of the gun tower is lifted clear over the parts already up.)
    const zu = ease(Math.max(0, (u - 0.4) / 0.6));
    g.position.y = p0.y + (p1.y - p0.y) * ease(Math.min(1, u * 1.5)) + (j.kind === 'gun' ? Math.sin(zu * Math.PI) * 0.8 : 0);
    g.position.z = p0.z + (p1.z - p0.z) * zu;
    rig();
  }, () => {
    land();
    burst(new THREE.Vector3(top.x, ramp.T, 0), '#e8c890', 16, 3);
    tween(0.6, () => {}, () => den.remove(block, ropes));
  }));
}
// A frame's done. The rest of the same stretch comes straight away; the next stretch's timber
// comes when the next wave's beaten off.
function jobDone(j, quiet) {
  if (quiet) return;
  if (j.kind === 'house') {
    const nx = ramp.jobs[j.i + 1];
    setTimeout(() => toast(nx?.kind === 'house' ? `The ${HOUSE_PART[j.part]}'s up! Now the ${HOUSE_PART[nx.part]}` : 'Your house is built!'), 1500);
    if (!guest() && nx?.kind === 'house') openJob(nx.i);
    return;
  }
  const stretch = ramp.jobs.filter((o) => o.si === j.si);
  const msg = j.kind === 'gun' ? (j.part === GD.parts.length - 1 ? 'The gun tower\'s up! Walk out onto it from the wall' : 'That part of the gun tower\'s up. Now the next')
    : ramp.jobs.every((o) => o.up || o.kind === 'gun' || o.kind === 'house') ? 'The whole rampart is up!'
    : stretch.every((o) => o.up) ? 'That stretch is up: climb the stairs and throw from the wall!'
    : 'The walk\'s up on the wall. Now build the stairs to it';
  setTimeout(() => toast(msg), 1500);
  if (!guest() && ramp.jobs[ramp.next]?.si === j.si) openJob(ramp.next);
}
// How high the floor is here: the wall-walk, the stairs, or the ground. `pad` widens the stairs'
// footprint a little, so you bump into their side instead of walking into them. Stairs still
// being built are in the way.
const hv = new THREE.Vector3();
// `from` is the height you're at: down on the floor, a deck overhead is no floor of yours.
function heightAt(x, z, pad = 0, from = 99) {
  if (!ramp) return 0;
  for (const j of ramp.jobs) {
    if (j.kind === 'house') continue;
    if (j.kind !== 'stair') {
      if (j.up && j.set.has(k(Math.floor((z - j.z0) / S), Math.floor((x - j.x0) / S)))) {
        if (j.kind === 'gun' && from < ramp.T - HOP) continue;
        return ramp.T;
      }
      continue;
    }
    const [x0, x1] = ramp.stairs[j.si ? 1 : 0];
    if (x < x0 - pad || x > x1 + pad) continue;
    if (j.up && j.tops) {
      const r = j.tops.get(Math.floor(j.frame.group.worldToLocal(hv.set(x, 0, z)).x / S));
      if (r !== undefined) return Math.max(0, ramp.T * (1 - r / ramp.n));
      continue;
    }
    if (z < ramp.zTop - 0.05 || z > ramp.zBot + pad) continue;
    if (j.frame) return 99;
  }
  return 0;
}
const onRampart = () => ramp && pirate.h > ramp.T - 0.15;

// ---------- your house ----------
/* A little house at the back of the den, against the cave wall on the left: a front wall with a
   door and a window, two side walls and a lean-to roof. Built as everything here is built: each
   part's frame laid on the floor, filled with pieces, sawn to fit, then hoisted on ropes and set in
   place. You only get one when you ask for it (Your pirate, Den), as it's yours to dress. */
const HOUSE = { cols: 7, front: 5, back: 7, depth: 4 };
const HOUSE_PART = ['front wall', 'side wall', 'other side wall', 'roof'];
const HOUSE_Z1 = 10.3, HOUSE_Z0 = HOUSE_Z1 - HOUSE.cols * S;
const houseXF = () => -ramp.half + 1.7;   // the face of the front wall
function houseShape(part) {
  const cells = [];
  if (part === 0) {
    for (let r = 0; r < HOUSE.front; r++) for (let c = 0; c < HOUSE.cols; c++) {
      if ((c === 2 || c === 3) && r >= 1) continue;   // the door
      if (c === 5 && (r === 1 || r === 2)) continue;  // the window
      cells.push([r, c]);
    }
  } else if (part === 3) {
    for (let r = 0; r < 6; r++) for (let c = 0; c < HOUSE.cols; c++) if (!(r === 0 && (c === 0 || c === HOUSE.cols - 1))) cells.push([r, c]);
  } else {
    // Stepped down from the back (tall, against the rock) to the front, under the roof's slope.
    const hs = part === 1 ? [7, 7, 6, 5] : [5, 6, 7, 7];
    hs.forEach((h, c) => { for (let r = HOUSE.back - h; r < HOUSE.back; r++) cells.push([r, c]); });
  }
  return cells;
}
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const basis = (x, y) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, new THREE.Vector3().crossVectors(x, y)));
// Where a part goes (its top-left corner, and which way it faces). Part -1: laid flat on the floor.
function housePose(part) {
  const xf = houseXF(), xb = xf - WOOD_D - HOUSE.depth * S;
  if (part === -1) return { p: V3(xf + 0.3, 0, HOUSE_Z1 - 0.05), q: basis(V3(0, 0, -1), V3(-1, 0, 0)) };
  if (part === 0) return { p: V3(xf, HOUSE.front * S, HOUSE_Z1), q: basis(V3(0, 0, -1), V3(0, 1, 0)) };
  if (part === 1) return { p: V3(xb, HOUSE.back * S, HOUSE_Z1), q: basis(V3(1, 0, 0), V3(0, 1, 0)) };
  if (part === 2) return { p: V3(xf - WOOD_D, HOUSE.back * S, HOUSE_Z0), q: basis(V3(-1, 0, 0), V3(0, 1, 0)) };
  const up = V3(xb - xf, (HOUSE.back - HOUSE.front) * S, 0).normalize(), q = basis(V3(0, 0, -1), up);
  return { p: V3(xb, HOUSE.back * S, HOUSE_Z1).add(V3(0, 0, 1).applyQuaternion(q).multiplyScalar(0.42)), q };
}
function raiseHouse(f, j, quiet) {
  const g = f.group, to = housePose(j.part);
  const land = () => {
    g.position.copy(to.p);
    g.quaternion.copy(to.q);
    g.updateMatrixWorld(true);
    j.up = true;
    houseWalls(j.part);
    paintHouse();
    if (ramp.jobs.every((o) => o.kind !== 'house' || o.up)) houseDone();
    plotShow();
    jobDone(j, quiet);
  };
  if (quiet) { land(); return; }
  const p0 = g.position.clone(), q0 = g.quaternion.clone();
  const mid = to.p.clone().add(V3(0, -HOUSE.front * S / 2, 0).applyQuaternion(to.q)), top = mid.clone().setY(HOUSE.back * S + 2.6);
  const block = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.14, 12), railMat);
  block.rotation.x = Math.PI / 2;
  block.position.copy(top);
  const pos = new Float32Array(24), geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const ropes = new THREE.LineSegments(geo, ropeMat);
  ropes.frustumCulled = false;
  den.add(block, ropes);
  const corners = [[0, 0], [f.b.w, 0], [0, f.b.h], [f.b.w, f.b.h]];
  const rig = () => {
    g.updateMatrixWorld(true);
    corners.forEach(([c, r], n) => { const w = frameAt(f, c, r, 0.1); pos.set([top.x, top.y, top.z, w.x, w.y, w.z], n * 6); });
    geo.attributes.position.needsUpdate = true;
  };
  rig();
  const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
  tween(0.9, rig, () => tween(2.6, (u) => {
    const e = ease(u);
    g.position.lerpVectors(p0, to.p, e);
    g.position.y += Math.sin(e * Math.PI) * 1.4;
    g.quaternion.slerpQuaternions(q0, to.q, ease(Math.min(1, u * 1.25)));
    rig();
  }, () => {
    land();
    burst(mid, '#e8c890', 16, 3);
    tween(0.6, () => {}, () => den.remove(block, ropes));
  }));
}
// You can't walk through a wall that's up (only in at the door).
function houseWalls(part) {
  const xf = houseXF(), xb = xf - WOOD_D - HOUSE.depth * S, add = (x, z) => obstacles.push({ x, z, r: 0.3, house: true });
  if (part === 0) for (let c = 0; c < HOUSE.cols; c++) { if (c !== 2 && c !== 3) add(xf - 0.25, HOUSE_Z1 - (c + 0.5) * S); }
  if (part === 1) for (let c = 0; c < HOUSE.depth; c++) add(xb + (c + 0.5) * S, HOUSE_Z1 - 0.25);
  if (part === 2) for (let c = 0; c < HOUSE.depth; c++) add(xb + (c + 0.5) * S, HOUSE_Z0 + 0.25);
}
// Painted, if you like: each piece keeps a hint of its own timber, so you still see how it's built.
const houseMats = {};
const houseMat = (l, c) => (c === 'none' ? woodMat(l) : (houseMats[l + c] ||= mat(new THREE.Color(WOOD[l] || '#b08a5a').lerp(new THREE.Color(dyeHex(c)), 0.5), { map: woodTex, roughness: 0.75 })));
/* It's your little shack, and it's made of carpentry pieces: you must see them (the user). Each piece
   gets a bold dark edge on both faces, quieter than the frames' white, and the paint lets each
   piece's own timber show through. */
function paintHouse() {
  if (!ramp) return;
  for (const j of ramp.jobs) {
    if (j.kind !== 'house' || !j.up) continue;
    for (const pc of j.frame.pieces) {
      pc.group.traverse((m) => { if (m.isMesh && !m.userData.edge) m.material = houseMat(pc.info.letter, j.part === 3 ? denLook.roof : denLook.paint); });
      if (!pc.edged) {
        pc.edged = true;
        for (const z of [0.012, -WOOD_D - 0.012]) { const e = fatOutline(pc.info.shape, z, '#24130a', 0.045); e.traverse((m) => { m.userData.edge = true; }); pc.group.add(e); }
      }
    }
  }
}
// All up: your flag on the roof.
function houseDone() {
  const fp = flagpole(1.6), xb = houseXF() - WOOD_D - HOUSE.depth * S;
  fp.position.set(xb + 0.35, HOUSE.back * S + 0.45, HOUSE_Z1 - 0.4);
  fp.userData.scenery = true;
  den.add(fp);
}
function startHouse() {
  if (!ramp) return;
  if (guest()) { send('host', { t: 'build' }); return; }
  const first = ramp.jobs.find((j) => j.kind === 'house');
  if (first.frame) return;
  openJob(first.i);
  say('Timber for your shack! Its frame\'s on the floor here: fill it with pieces from the crates, and it\'s hoisted into place');
  plotShow();
}
/* The shack's plot, marked out on the floor from the start (the user: it was hidden in a menu; walk
   into the corner and it should be clear you can build there): pegs and a line round where it
   goes, and a sign. Walk in and Space starts it; once it's up, Space there dresses it. */
let plot = null;
const houseState = () => { const hs = ramp?.jobs.filter((j) => j.kind === 'house') || []; return !hs.length ? 'none' : hs.every((j) => j.up) ? 'built' : hs.some((j) => j.frame) ? 'building' : 'plot'; };
function makePlot() {
  plot = new THREE.Group();
  plot.userData.scenery = true;
  const xf = houseXF(), xb = xf - WOOD_D - HOUSE.depth * S, line = mat('#e6d3a6', { roughness: 1 }), peg = mat('#6b4426', { map: woodTex });
  const bar = (x0, z0, x1, z1) => { const b = mesh(new THREE.BoxGeometry(Math.abs(x1 - x0) + 0.1, 0.04, Math.abs(z1 - z0) + 0.1), line, false); b.position.set((x0 + x1) / 2, 0.025, (z0 + z1) / 2); plot.add(b); };
  // Chalked over, so the plot stands out on the floor.
  const fill = mesh(new THREE.PlaneGeometry(xf - xb, HOUSE_Z1 - HOUSE_Z0), new THREE.MeshBasicMaterial({ color: '#f2e2b8', transparent: true, opacity: 0.16, depthWrite: false }), false);
  fill.rotation.x = -Math.PI / 2;
  fill.position.set((xf + xb) / 2, 0.015, (HOUSE_Z0 + HOUSE_Z1) / 2);
  plot.add(fill);
  bar(xb, HOUSE_Z0, xf, HOUSE_Z0); bar(xb, HOUSE_Z1, xf, HOUSE_Z1); bar(xb, HOUSE_Z0, xb, HOUSE_Z1);
  bar(xf, HOUSE_Z0, xf, HOUSE_Z0 + 1.0); bar(xf, HOUSE_Z1 - 2.2, xf, HOUSE_Z1);   // (a gap where the door goes)
  for (const [x, z] of [[xb, HOUSE_Z0], [xb, HOUSE_Z1], [xf, HOUSE_Z0], [xf, HOUSE_Z1]]) { const p = mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.4, 6), peg); p.position.set(x, 0.2, z); plot.add(p); }
  // A sign on a post: "Your shack".
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96;
  const g = cv.getContext('2d');
  g.fillStyle = '#7a5230'; g.fillRect(0, 0, 256, 96); g.strokeStyle = '#3a2412'; g.lineWidth = 8; g.strokeRect(4, 4, 248, 88);
  g.fillStyle = '#f3e3c0'; g.font = 'bold 40px Alegreya, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Your shack', 128, 50);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  // The post stops under the board: running up through it, it hid the S ("Your hack", the user).
  const post = mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.2, 8), peg);
  post.position.set(xf + 0.7, 0.6, HOUSE_Z1 + 0.45);   // (clear of where its frames lie)
  const board = mesh(new THREE.BoxGeometry(1.3, 0.49, 0.06), [peg, peg, peg, peg, mat('#ffffff', { map: tex, emissive: '#3a2a18', emissiveMap: tex }), mat('#ffffff', { map: tex })]);
  board.position.set(xf + 0.7, 1.45, HOUSE_Z1 + 0.45);
  board.rotation.y = Math.PI / 4;   // turned to the den, where you look at it from
  plot.add(post, board);
  plot.userData.sign = board;
  plot.userData.label = document.createElement('div');
  den.add(plot);
  plotShow();
}
// The lines go once the timber's come (its frame lies on the floor there); the sign stays.
function plotShow() {
  if (!plot) return;
  const st = houseState();
  plot.children.forEach((o) => { o.visible = o === plot.userData.sign || o.geometry?.type === 'CylinderGeometry' && o.position.y > 0.5 ? st !== 'built' : st === 'plot'; });
}
/* What the plot's for, over it like a hole's label (the user clicked it by accident and couldn't
   work out what had happened: there was no call to action). Shown when you're near. */
function plotLabel() {
  const lab = plot?.userData.label;
  if (!lab) return;
  if (!lab.isConnected) $('labels').append(lab);
  const st = houseState(), xf = ramp ? houseXF() : 0, x = xf - HOUSE.depth * S / 2, z = (HOUSE_Z0 + HOUSE_Z1) / 2;
  const html = st === 'plot' ? 'Your shack: build it here<small>walk in and press Space (or click) and timber comes for it</small>'
    : st === 'built' ? 'Your shack<small>walk in and press Space (or click) to paint and dress it</small>' : '';
  const near = Math.hypot(pirate.x - x, pirate.z - z) < 7;
  if (!html || !near || wm || deco.on || deckView > 0.5 || pirate.h > 0.3) { lab.style.display = 'none'; return; }
  if (lab.innerHTML !== html) { lab.className = 'label deck'; lab.innerHTML = html; }
  v3.set(xf + 0.7, 2.05, HOUSE_Z1 + 0.45).project(camera);   // over the sign, kept on screen
  const half = lab.offsetWidth / 2 + 10;
  lab.style.left = `${Math.max(half, Math.min(innerWidth - half, (v3.x + 1) / 2 * innerWidth))}px`;
  lab.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
  lab.style.display = v3.z > 1 ? 'none' : '';
}
const atPlot = () => {
  if (!ramp || pirate.h > 0.3) return false;
  const xf = houseXF();
  return pirate.x < xf + 1.6 && pirate.z > HOUSE_Z0 - 0.8 && pirate.z < HOUSE_Z1 + 0.8;
};

// ---------- Jolly Roger flags ----------
// One flag for the whole den, drawn from your choices; every pole flies it.
const flagCanvas = document.createElement('canvas');
flagCanvas.width = 200; flagCanvas.height = 128;
const flagTex = new THREE.CanvasTexture(flagCanvas);
flagTex.colorSpace = THREE.SRGBColorSpace;
function redrawFlag() { drawFlag(flagCanvas.getContext('2d'), 200, 128, denLook); flagTex.needsUpdate = true; }
redrawFlag();
const flagMat = new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.9 });
// A flag or banner you've put up keeps the design it had then.
const designMats = new Map();
function designMat(D, tall = false) {
  const key = JSON.stringify(D) + tall;
  if (!designMats.has(key)) designMats.set(key, new THREE.MeshStandardMaterial({ map: canvasTex(tall ? 128 : 200, tall ? 200 : 128, (x, w, h) => drawFlag(x, w, h, D)), side: THREE.DoubleSide, roughness: 0.9 }));
  return designMats.get(key);
}
let flags = [];
function flagpole(h = 2, m = flagMat) {
  const g = new THREE.Group();
  const pole = mesh(new THREE.CylinderGeometry(0.035, 0.045, h, 8), mat('#5b3a20', { map: woodTex }));
  pole.position.y = h / 2;
  const ball = mesh(new THREE.SphereGeometry(0.07, 10, 8), mat('#e8b23a', { metalness: 0.7, roughness: 0.3 }));
  ball.position.y = h + 0.05;
  const geo = new THREE.PlaneGeometry(1, 0.64, 14, 2).translate(0.5, 0, 0);
  const cloth = mesh(geo, m);
  cloth.position.y = h - 0.34;
  g.add(pole, ball, cloth);
  flags.push({ g, geo, base: geo.attributes.position.array.slice(), t: Math.random() * 6 });
  return g;
}
// (Poles thrown away with an old den are forgotten.)
// ---------- the landscape ----------
/* Where the den is, your choice (Your pirate, Den): the barren cave it started as, a seaside
   hideout (sand, sandstone, palms, the sea out beyond where the raiders come from) or a jungle one
   (moss, mossy rock, big trees and ferns). Only the look changes, never the play: the props stand
   outside the wall's ends, out past the raiders' cannon and behind the cave rocks. */
const BIOME = {
  barren: { sky: '#1a110b', ground: '#7a5c3d', dots: ['40,26,14', '170,135,95'], rocks: ['#5d5048', '#6b5c50', '#4f443d', '#73655a'], hemi: ['#ffe6c4', '#3a2616'] },
  seaside: { sky: '#2b4a5f', ground: '#c4a172', dots: ['120,90,50', '245,232,200'], rocks: ['#9c8566', '#b09878', '#85704f', '#bfa886'], hemi: ['#fff0dc', '#5e5038'] },
  jungle: { sky: '#12231a', ground: '#5b5a30', dots: ['30,45,15', '120,150,60'], rocks: ['#4c5944', '#5a6a4b', '#3e4a37', '#677858'], hemi: ['#eaffd6', '#24321a'] },
};
const biomeGroup = new THREE.Group();
scene.add(biomeGroup);
let biomeId = null, sea = null;
const seaTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#2f7896'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(200,235,245,${0.1 + Math.random() * 0.25})`; g.fillRect(Math.random() * w, Math.random() * h, 8 + Math.random() * 22, 2); }
});
seaTex.wrapS = seaTex.wrapT = THREE.RepeatWrapping;
seaTex.repeat.set(16, 8);
const trunkMat = mat('#7d5b38', { map: woodTex });
const leafMats = ['#3f8a3a', '#2f7432', '#4f9a3c'].map((c) => mat(c, { side: THREE.DoubleSide, flatShading: true }));
const canopyMats = ['#2f6b2a', '#3b7d2f', '#275a26'].map((c) => mat(c, { flatShading: true }));
// A palm frond (or, low down, a fern's): a long leaf that droops from its base.
function frond(len, wid, droop, m) {
  const geo = new THREE.PlaneGeometry(wid, len, 1, 6).translate(0, len / 2, 0), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / len;
    pos.setZ(i, -t * t * droop);
    pos.setX(i, pos.getX(i) * (1 - t * 0.85));
  }
  geo.computeVertexNormals();
  return mesh(geo, m, false);
}
function plume(n, len, wid, droop, tilt) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const f = frond(len * (0.85 + Math.random() * 0.3), wid, droop, leafMats[rand(3)]);
    const arm = new THREE.Group();
    f.rotation.x = -tilt;
    arm.add(f);
    arm.rotation.y = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    g.add(arm);
  }
  return g;
}
function palm(x, z, sc) {
  const g = new THREE.Group();
  const top = new THREE.Vector3((Math.random() - 0.5) * 1.6, 4.4, (Math.random() - 0.5) * 1.6);
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(0, 2.6, 0), top);
  g.add(mesh(new THREE.TubeGeometry(curve, 10, 0.15, 7), trunkMat));
  const crown = plume(8, 2.2, 0.55, 0.9, 1.05);
  crown.position.copy(top);
  g.add(crown);
  const nutM = mat('#5a3d1e');
  for (let i = 0; i < 3; i++) {
    const nut = mesh(new THREE.SphereGeometry(0.13, 8, 6), nutM, false);
    nut.position.copy(top).add(new THREE.Vector3(Math.cos(i * 2.1) * 0.18, -0.15, Math.sin(i * 2.1) * 0.18));
    g.add(nut);
  }
  g.position.set(x, 0, z);
  g.scale.setScalar(sc);
  return g;
}
function jungleTree(x, z, sc) {
  const g = new THREE.Group(), h = 4.2 + Math.random() * 1.5;
  const trunk = mesh(new THREE.CylinderGeometry(0.2, 0.34, h, 8), trunkMat);
  trunk.position.y = h / 2;
  g.add(trunk);
  for (let i = 0; i < 4; i++) {
    const b = mesh(new THREE.IcosahedronGeometry(1.1 + Math.random() * 0.6, 0), canopyMats[rand(3)], false);
    b.position.set((Math.random() - 0.5) * 1.6, h + (Math.random() - 0.3) * 0.9, (Math.random() - 0.5) * 1.6);
    b.scale.y = 0.75;
    g.add(b);
  }
  g.position.set(x, 0, z);
  g.scale.setScalar(sc);
  return g;
}
function fern(x, z, sc) {
  const g = plume(7, 0.9, 0.3, 0.35, 1.0);
  g.position.set(x, 0.05, z);
  g.scale.setScalar(sc);
  return g;
}
// Spots for trees: out past the raiders' cannon, beyond the wall's two ends, and behind the
// cave rocks down both sides of the den.
function treeSpots(half) {
  const spots = [], cx = half * 0.45;
  for (let x = -half - 12; x <= half + 12; x += 2.6 + Math.random() * 1.4) if (Math.abs(x - cx) > 3) spots.push([x, -19 - Math.random() * 2]);
  for (const sx of [-1, 1]) {
    for (let z = -14; z < -1; z += 2.6 + Math.random()) spots.push([sx * (half + 4.8 + Math.random() * 3), z]);
    for (let z = 0; z < 14; z += 2.8 + Math.random()) spots.push([sx * (half + 5 + Math.random() * 2.5), z]);
  }
  return spots;
}
function drawGround(B) {
  const cv = groundTex.image, g = cv.getContext('2d'), w = cv.width, h = cv.height;
  g.fillStyle = B.ground; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(${B.dots[Math.random() < 0.5 ? 0 : 1]}, ${Math.random() * 0.25})`;
    const sz = 2 + Math.random() * 6;
    g.fillRect(Math.random() * w, Math.random() * h, sz, sz);
  }
  groundTex.needsUpdate = true;
}
function applyBiome(force = false) {
  const id = BIOME[denLook.biome] ? denLook.biome : 'barren', B = BIOME[id];
  if (!force && id === biomeId) return;
  if (id !== biomeId) {
    scene.background.set(B.sky);
    scene.fog.color.set(B.sky);
    hemi.color.set(B.hemi[0]); hemi.groundColor.set(B.hemi[1]);
    rockMats.forEach((m, i) => m.color.set(B.rocks[i]));
    drawGround(B);
  }
  biomeId = id;
  biomeGroup.clear();
  sea = null;
  if (!wall) return;
  const half = wall.W * S / 2;
  if (id === 'seaside') {
    // The sea, beyond the sand where the raiders land, with a line of surf.
    sea = mesh(new THREE.PlaneGeometry(220, 90), mat('#ffffff', { map: seaTex, roughness: 0.25, metalness: 0.1, emissive: '#0d2a36' }), false);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(0, -0.03, -21 - 45);
    const surf = mesh(new THREE.PlaneGeometry(220, 0.7), new THREE.MeshBasicMaterial({ color: '#e8f4f2', transparent: true, opacity: 0.7, depthWrite: false }), false);
    surf.rotation.x = -Math.PI / 2;
    surf.position.set(0, 0.01, -21.2);
    biomeGroup.add(sea, surf);
    for (const [x, z] of treeSpots(half)) biomeGroup.add(palm(x, z, 0.85 + Math.random() * 0.35));
  } else if (id === 'jungle') {
    for (const [x, z] of treeSpots(half)) biomeGroup.add(jungleTree(x, z, 0.85 + Math.random() * 0.4));
    // Ferns along the foot of the cave rocks inside the den, clear of the house.
    for (const sx of [-1, 1]) for (let z = 1; z < 12.5; z += 1.3 + Math.random()) {
      if (sx < 0 && z > HOUSE_Z0 - 1 && z < HOUSE_Z1 + 1) continue;
      biomeGroup.add(fern(sx * (half + 0.5 + Math.random() * 0.8), z, 0.8 + Math.random() * 0.5));
    }
    for (const sx of [-1, 1]) for (let z = -12; z < -1; z += 1.6 + Math.random()) biomeGroup.add(fern(sx * (half + 1 + Math.random() * 2), z, 1 + Math.random() * 0.5));
  }
}
function biomeTick(dt) {
  if (sea) { seaTex.offset.x += dt * 0.004; seaTex.offset.y = Math.sin(performance.now() / 2400) * 0.01; }
}
function waveFlags(dt) {
  flags = flags.filter((f) => { let o = f.g; while (o.parent) o = o.parent; return o === scene || o === dress.scene; });
  for (const f of flags) {
    f.t += dt;
    const pa = f.geo.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = f.base[i * 3]; pa.setZ(i, Math.sin(x * 5 - f.t * 4.5) * 0.09 * x); pa.setY(i, f.base[i * 3 + 1] - x * x * 0.04); }
    pa.needsUpdate = true;
  }
}

// ---------- the gun tower (after Gunnery) ----------
/* The rampart's last job: a gun tower, a big square platform jutting out from the wall over the
   gate, like a bastion, as big as a Gunnery board: one square of a carpentry piece is one square of
   the board. It's built in three frames laid on the den floor and hauled up and out over the wall
   one after another; you walk out onto it from the wall-walk. On it, Gunnery, kept as close to the
   puzzle as we can, so a Puzzle Pirates hand knows it at a glance.
   - A powder barrel in the middle rolls out the stores (powder, wad, shot and buckets), each way
     round in turn, till there are two of each on deck. Use one and another comes out.
   - A store rolls straight on. Blocked (a crate, a gun, the barrel, the gunwale, a pirate standing
     there), it turns right; left if it can't; back if neither. Two that meet both turn back.
   - Chalk arrows steer them: a store rolling onto one turns the way it points. Three each; chalk a
     fourth and your oldest is rubbed out.
   - Four guns lie across the deck as in Gunnery, two down each side, muzzle out, with a lane between
     the muzzle and the gunwale. Stores go in at the muzzle, and only off an arrow in the lane
     pointing into it; otherwise the gun's just in the way. Powder, wad, then shot. Loaded, it's run
     out over the lane through its port and swung round on it to aim, forwards at the raiders coming
     in and their cannon, or back along the wall at those hacking at it; it fires and the recoil
     brings it back in. Then it wants a bucket to swab it; the wrong store fouls it, and a bucket
     cleans that too.
   - Crates lashed about the deck make the board: the middle round the barrel kept clear, more out
     towards the edges, making pockets to trap a store in and loops that bring stores back past a
     gun. Each new board is tried out (stores rolling with no arrows) so a couple of guns sit on a
     loop of their own and the rest take more work, as on a good Gunnery board. */
const GD = {
  // Gunnery's board: 13 by 13, the barrel in the middle.
  cols: 13, rows: 13, tick: 0.36, each: 2, emit: 0.7, arrows: 3, crates: 16,
  // Each gun: the lane square in front of its muzzle, and the way it faces (out). It lies on the
  // three squares in from there.
  guns: [{ port: [3, 0], d: 3 }, { port: [9, 0], d: 3 }, { port: [3, 12], d: 1 }, { port: [9, 12], d: 1 }],
  parts: [5, 5, 3],   // the tower's frames, rows in each, from the wall out
};
const GUN_FRAME_Z = 0.6;   // the tower's frames are laid on the floor right up against the gate
const KINDS = ['powder', 'wad', 'shot', 'bucket'];
const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];   // north (out from the wall), east, south, west
// What each gun shows: its look, the words, and the store it wants next.
const GUN_SAYS = {
  empty: ['', 'Powder', 'powder'], powder: ['', 'Wad', 'wad'], wad: ['', 'Shot', 'shot'], loaded: ['done', 'Loaded!', ''],
  dirty: ['weak', 'Swab it', 'bucket'], fouled: ['bad', 'Fouled!', 'bucket'],
};
// Little pictures of the stores, for the labels and the key.
const STORE_ICON = {
  powder: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10.5" r="7.5" fill="#c42d1f" stroke="#5a0f08" stroke-width=".8"/><path d="M10 4.5c2.5 3 3.5 4.5 2 7.5 1.5-.5 2-1.5 2-2.5 1 2.5-.5 5.5-4 5.5s-5-3-3.5-6c0 1.5.8 2.3 1.6 2.5-1.2-2.6.6-4.8 1.9-7z" fill="#ffb21a"/></svg>',
  wad: '<svg viewBox="0 0 20 20"><g fill="#f1ede4" stroke="#8a8478" stroke-width=".8"><circle cx="7" cy="12" r="4.5"/><circle cx="13" cy="12" r="4.5"/><circle cx="10" cy="7.5" r="4.5"/></g></svg>',
  shot: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.5" fill="#6b7178" stroke="#30343a" stroke-width=".8"/><circle cx="7.5" cy="7.5" r="2.2" fill="#d6dbe0"/></svg>',
  bucket: '<svg viewBox="0 0 20 20"><path d="M4 7.5C4 1 16 1 16 7.5" fill="none" stroke="#1a1208" stroke-width="1.3"/><path d="M11.5 7.5l5-6" stroke="#1a1208" stroke-width="2.2" stroke-linecap="round"/><path d="M11.5 7.5l5-6" stroke="#a86c32" stroke-width="1" stroke-linecap="round"/><path d="M3 7.5h14l-2 10.5H5z" fill="#dfe5e9" stroke="#1a1208" stroke-width=".9" stroke-linejoin="round"/><ellipse cx="10" cy="7.5" rx="7" ry="2" fill="#2f86d6" stroke="#1a1208" stroke-width=".8"/></svg>',
};
const STORE_NAME = { powder: 'Powder', wad: 'Wad', shot: 'Shot', bucket: 'Bucket' };
$('gunhelp').innerHTML = `<h3>Load each gun</h3>${['powder', 'wad', 'shot'].map((kd, i) => `${i + 1}. ${STORE_ICON[kd]}${STORE_NAME[kd]}<br>`).join('')}Fired or fouled? ${STORE_ICON.bucket}Bucket<small>Stores go in at a gun's muzzle, off an arrow in front of it pointing in.</small>`;
let gd = null;
// The tower, centred on the gate and jutting out from the wall's face.
const gunX0 = () => X(wall.gateCols.c0) + ((wall.gateCols.c1 - wall.gateCols.c0 + 1) - GD.cols) * S / 2;
const gunZ0 = () => -0.85 - GD.rows * S;
// Its frames, from the wall out: the first row of each, on the board.
const partR0 = (part) => GD.rows - GD.parts.slice(0, part + 1).reduce((a, b) => a + b, 0);
function gunShape(part) {
  const cells = [];
  for (let r = 0; r < GD.parts[part]; r++) for (let c = 0; c < GD.cols; c++) cells.push([r, c]);
  return cells;
}
const gdCell = (x, z) => {
  if (!gd) return null;
  const c = Math.floor((x - gd.x0) / S), r = Math.floor((z - gd.z0) / S);
  return gd.cells.has(k(r, c)) ? [r, c] : null;
};
// (The planks' top is 5cm above the height you walk at.)
const gdAt = (r, c, y = 0) => new THREE.Vector3(gd.x0 + (c + 0.5) * S, ramp.T + 0.05 + y, gd.z0 + (r + 0.5) * S);
const onGunDeck = () => !!gd && onRampart() && !!gdCell(pirate.x, pirate.z);
const isBarrel = (r, c) => gd.barrel[0] === r && gd.barrel[1] === c;
// A gun's squares, counted in from the gunwale: 0 is the lane in front of its muzzle, where stores
// go in; it lies on 1-3, muzzle on 1.
const gunSq = (g, i) => [g.port[0] - DR[g.d] * i, g.port[1] - DC[g.d] * i];
const gunMouth = (g) => (g.d + 2) % 4;   // the way an arrow in the lane points to load it
// Where a gun's carriage sits: run in on its squares, or run out over the lane, its muzzle through
// the port, swung on the port to aim.
function gunPos(g) {
  const yaw = gunBase(g) + g.aim, fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const pivot = gdAt(...g.port).add(new THREE.Vector3(DC[g.d], 0, DR[g.d]).multiplyScalar(S * 0.4));
  return gdAt(...gunSq(g, 2)).lerp(pivot.sub(fwd.multiplyScalar(0.3)), g.slide);
}
const gunCells = (guns = gd.guns) => new Map(guns.flatMap((g) => [1, 2, 3].map((i) => [k(...gunSq(g, i)), g])));
// Where you can't walk or chalk: a crate, the barrel, a gun.
const gdSolid = (r, c) => isBarrel(r, c) || gd.crateSet.has(k(r, c)) || gd.gunSet.has(k(r, c));
function deckBlocks(x, z) {
  if (!gd) return false;
  return [[0, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]].some(([a, b]) => { const cell = gdCell(x + a * 0.17, z + b * 0.17); return cell && gdSolid(...cell); });
}

// ----- the look of it: Gunnery's, in the round -----
// Bold black outlines round everything on the board, as Gunnery draws it: readable before pretty.
const inkMat = new THREE.MeshBasicMaterial({ color: '#160d06', side: THREE.BackSide });
function ink(g, t = 0.022) {
  const list = [];
  g.traverse((m) => { if (m.isMesh && !m.userData.ink && m.geometry.type !== 'CircleGeometry') list.push(m); });
  for (const m of list) {
    m.geometry.computeBoundingSphere();
    const { radius, center } = m.geometry.boundingSphere, f = t / radius, h = new THREE.Mesh(m.geometry, inkMat);
    h.userData.ink = true;
    h.scale.setScalar(1 + f);
    h.position.copy(center).multiplyScalar(-f);
    m.add(h);
  }
  return g;
}
// The tower's deck once it's up: still the pieces you laid, each its own shade of timber, but all
// toned down close to Gunnery's deck brown, so the stores, crates and arrows stand out on it.
const DECK_BROWN = '#94704f';
const deckMats = {};
const deckMat = (l) => (deckMats[l] ||= mat(new THREE.Color(WOOD[l] || DECK_BROWN).lerp(new THREE.Color(DECK_BROWN), 0.72), { map: woodTex, roughness: 0.9 }));
const powderTex = (() => {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const x = cv.getContext('2d');
  x.fillStyle = '#c42d1f';
  x.fillRect(0, 0, 64, 64);
  x.fillStyle = '#ffb21a';
  x.beginPath();
  x.moveTo(32, 8); x.bezierCurveTo(44, 22, 48, 30, 41, 44); x.bezierCurveTo(47, 42, 49, 37, 49, 32); x.bezierCurveTo(55, 44, 47, 58, 32, 58);
  x.bezierCurveTo(17, 58, 10, 45, 17, 33); x.bezierCurveTo(17, 40, 21, 44, 25, 45); x.bezierCurveTo(19, 33, 26, 20, 32, 8);
  x.fill();
  x.fillStyle = '#ffe36b';
  x.beginPath(); x.ellipse(32, 46, 6, 9, 0, 0, Math.PI * 2); x.fill();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
// Gunnery's bucket, drawn flat: a tin pail seen from a little above, blue water in it, its handle
// up and the swab standing in it, all with a bold dark outline.
const bucketTex = canvasTex(128, 128, (x) => {
  const ink = '#1a1208';
  x.lineCap = x.lineJoin = 'round';
  const line = (w, c, f) => { x.strokeStyle = c; x.lineWidth = w; x.beginPath(); f(); x.stroke(); };
  // The handle, behind.
  const handle = () => { x.moveTo(24, 46); x.bezierCurveTo(26, 2, 102, 2, 104, 46); };
  line(9, ink, handle); line(4, '#8d99a3', handle);
  // The swab's staff, standing up out of it.
  const staff = () => { x.moveTo(74, 46); x.lineTo(108, 6); };
  line(14, ink, staff); line(7, '#a86c32', staff);
  // The pail.
  const body = () => { x.moveTo(20, 46); x.lineTo(34, 116); x.quadraticCurveTo(64, 126, 94, 116); x.lineTo(108, 46); x.closePath(); };
  const tin = x.createLinearGradient(20, 0, 108, 0);
  tin.addColorStop(0, '#8a96a0'); tin.addColorStop(0.3, '#ffffff'); tin.addColorStop(0.65, '#d3dae0'); tin.addColorStop(1, '#78838d');
  x.beginPath(); body(); x.fillStyle = tin; x.fill();
  line(6, ink, body);
  for (const y of [72, 100]) line(4, '#4b5560', () => { x.moveTo(24 + (y - 46) * 0.2, y); x.quadraticCurveTo(64, y + 9, 104 - (y - 46) * 0.2, y); });
  // Its rim and the water in it.
  const ell = (rx, ry, fill) => { x.beginPath(); x.ellipse(64, 46, rx, ry, 0, 0, Math.PI * 2); x.fillStyle = fill; x.fill(); };
  ell(47, 15, ink); ell(42, 11.5, '#eef2f5');
  const water = x.createLinearGradient(0, 38, 0, 54);
  water.addColorStop(0, '#2f86d6'); water.addColorStop(1, '#8fd0f6');
  ell(35, 8, water);
  line(3, 'rgba(255,255,255,0.85)', () => x.ellipse(56, 46, 18, 3.5, 0, Math.PI * 1.1, Math.PI * 1.7));
  // The staff where it goes into the water, in front.
  const dip = () => { x.moveTo(74, 46); x.lineTo(84, 34); };
  line(14, ink, dip); line(7, '#a86c32', dip);
});
// A soft glow under each store, so it shines out from the deck.
const glowTex = canvasTex(64, 64, (x) => {
  const gr = x.createRadialGradient(32, 32, 4, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,248,220,1)'); gr.addColorStop(0.55, 'rgba(255,236,170,0.55)'); gr.addColorStop(1, 'rgba(255,230,150,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
});
const glowGeo = new THREE.PlaneGeometry(S * 1.05, S * 1.05).rotateX(-Math.PI / 2);
const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.4, toneMapped: false, fog: false });
function storeMesh(kind) {
  const g = new THREE.Group(), body = new THREE.Group();
  g.add(body);
  g.userData.body = body;
  if (kind === 'shot') {
    body.add(mesh(new THREE.SphereGeometry(0.2, 20, 14), mat('#8d969f', { metalness: 0.55, roughness: 0.3 })));
    body.position.y = 0.2;
  } else if (kind === 'powder') {
    // A round red bag of powder, with the flame on it.
    const bag = mesh(new THREE.SphereGeometry(0.2, 18, 12), mat('#c42d1f', { roughness: 0.8 }));
    bag.scale.y = 0.72;
    const badge = mesh(new THREE.CircleGeometry(0.15, 20), new THREE.MeshStandardMaterial({ map: powderTex, roughness: 0.8 }));
    badge.rotation.x = -Math.PI / 2;
    badge.position.y = 0.146;
    const neck = mesh(new THREE.TorusGeometry(0.07, 0.025, 6, 14), mat('#5a0f08'));
    neck.rotation.x = Math.PI / 2;
    neck.position.set(0, 0.11, 0.13);
    body.add(bag, badge);
    body.position.y = 0.145;
  } else if (kind === 'wad') {
    // A puff of old rag and oakum.
    const wm = mat('#f1ede4', { roughness: 1 });
    for (const [x, y, z, r] of [[0, 0.12, 0, 0.14], [0.11, 0.1, 0.05, 0.11], [-0.11, 0.1, 0.05, 0.11], [0.02, 0.1, -0.12, 0.11], [0, 0.22, 0.02, 0.1], [-0.07, 0.09, -0.09, 0.1], [0.08, 0.09, -0.07, 0.09]]) {
      const s = mesh(new THREE.IcosahedronGeometry(r, 1), wm);
      s.position.set(x, y, z);
      body.add(s);
    }
  } else {
    // A bucket of water and a swab to clean the gun out, drawn flat as in Gunnery.
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: bucketTex, toneMapped: false, fog: false }));
    sp.scale.set(0.5, 0.5, 1);
    sp.position.y = 0.23;
    body.add(sp);
  }
  // Lit from within a little, so the colours stay bold whatever the light.
  body.traverse((m) => {
    if (!m.isMesh || !m.material.isMeshStandardMaterial) return;
    m.material.emissive.copy(m.material.color);
    m.material.emissiveIntensity = 0.35;
    if (m.material.map) m.material.emissiveMap = m.material.map;
  });
  body.scale.setScalar(1.15);
  body.position.y *= 1.15;
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.userData.ink = true;
  glow.position.y = 0.006;
  g.add(glow);
  return ink(g, 0.03);
}
const arrowGeo = (pts) => {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  const geo = new THREE.ShapeGeometry(s);
  geo.rotateX(-Math.PI / 2);   // lying on the planks, pointing north (-z)
  return geo;
};
const arrowOut = arrowGeo([[-0.1, -0.245], [0.1, -0.245], [0.1, 0], [0.245, 0], [0, 0.265], [-0.245, 0], [-0.1, 0]]);
const arrowIn = arrowGeo([[-0.055, -0.2], [0.055, -0.2], [0.055, 0.045], [0.15, 0.045], [0, 0.2], [-0.15, 0.045], [-0.055, 0.045]]);
// As in Gunnery: a bold yellow arrow with a dark edge, on a square lit up yellow underneath. A
// crewmate's is in their own colour.
const arrowTile = new THREE.PlaneGeometry(S * 0.94, S * 0.94).rotateX(-Math.PI / 2);
function arrowMesh(col = '#ffd23a', opacity = 1) {
  const g = new THREE.Group(), o = { transparent: true, depthWrite: false, toneMapped: false, fog: false };   // (true colours, not washed out by the light or the haze)
  const tile = new THREE.Mesh(arrowTile, new THREE.MeshBasicMaterial({ color: col, opacity: 0.55 * opacity, ...o }));
  const out = new THREE.Mesh(arrowOut, new THREE.MeshBasicMaterial({ color: '#2a1a06', opacity, ...o }));
  const inn = new THREE.Mesh(arrowIn, new THREE.MeshBasicMaterial({ color: col, opacity, ...o }));
  out.position.y = 0.004;
  inn.position.y = 0.008;
  out.renderOrder = 1; inn.renderOrder = 2;
  g.add(tile, out, inn);
  return g;
}
// A gun as Gunnery draws it: a long bright iron barrel lying on the deck, three squares long, on a
// low carriage. Muzzle to the north; centred on its middle square.
function gunMesh() {
  const g = new THREE.Group();
  const iron = mat('#b4bcc4', { metalness: 0.65, roughness: 0.3 }), dark = mat('#3a3f45', { metalness: 0.6, roughness: 0.4 });
  const wood = mat('#5b3a20', { map: woodTex });
  const bed = mesh(new RoundedBoxGeometry(0.44, 0.1, 1.2, 2, 0.03), wood);
  bed.position.set(0, 0.06, 0.1);
  g.add(bed);
  [-1, 1].forEach((sx) => [-0.35, 0.5].forEach((z) => { const w = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12), wood); w.rotation.z = Math.PI / 2; w.position.set(0.24 * sx, 0.09, z); g.add(w); }));
  const tube = mesh(new THREE.CylinderGeometry(0.17, 0.22, 1.5, 22), iron);
  tube.rotation.x = -Math.PI / 2;   // its narrow end, the muzzle, to the north
  tube.position.set(0, 0.3, 0);
  g.add(tube);
  // Reinforcing rings, the muzzle's swell, and the breech knob at the inner end.
  [[-0.72, 0.19, 0.035], [-0.2, 0.2, 0.025], [0.3, 0.215, 0.03], [0.72, 0.225, 0.04]].forEach(([z, r, t]) => { const ring = mesh(new THREE.TorusGeometry(r, t, 8, 24), iron); ring.position.set(0, 0.3, z); g.add(ring); });
  const mouth = mesh(new THREE.CircleGeometry(0.11, 16), mat('#0a0a0a'));
  mouth.position.set(0, 0.3, -0.756);
  mouth.rotation.y = Math.PI;
  const cap = mesh(new THREE.SphereGeometry(0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), iron);
  cap.rotation.x = Math.PI / 2;
  cap.position.set(0, 0.3, 0.75);
  const knob = mesh(new THREE.SphereGeometry(0.075, 10, 8), dark);
  knob.position.set(0, 0.3, 0.98);
  g.add(mouth, cap, knob);
  // An open trough along the top, where you see what's been rammed in (gunLoad).
  const trough = mesh(new RoundedBoxGeometry(0.22, 0.04, 1.3, 2, 0.015), mat('#161210', { roughness: 1 }));
  trough.position.set(0, 0.5, 0);
  g.userData.trough = trough;
  g.add(trough);
  return ink(g, 0.018);
}
/* What's in a gun, there to see as on the Gunnery board: powder rammed in deepest, by the breech,
   then the wad, then the shot by the muzzle, each a little copy of the store that went in. The
   trough goes red when the gun's fouled, and a fired gun smokes until it's swabbed out. */
const LOAD_AT = { powder: 0.46, wad: 0.02, shot: -0.46 }, LOAD_S = 0.72;
const LOADS = { empty: [], dirty: [], powder: ['powder'], wad: ['powder', 'wad'], loaded: ['powder', 'wad', 'shot'] };
function gunLoad(g, dt) {
  if (g.state === 'dirty' && (g.smokeT = (g.smokeT ?? 0) - dt) < 0) {
    g.smokeT = 0.45;
    burst(g.g.localToWorld(new THREE.Vector3(0, 0.32, -0.8)), '#7d7873', 2, 0.5);
  }
  if (g.shown === g.state) return;
  const first = g.shown === undefined;
  g.shown = g.state;
  g.load ||= {};
  const want = LOADS[g.state] ?? Object.keys(g.load);   // fouled: what was in stays in
  for (const kind of ['powder', 'wad', 'shot']) {
    const m = g.load[kind], on = want.includes(kind);
    if (m && !on) { g.g.remove(m); delete g.load[kind]; }
    if (!m && on) {
      const it = storeMesh(kind);
      it.children.filter((o) => o.material === glowMat).forEach((o) => it.remove(o));
      it.position.set(0, 0.47, LOAD_AT[kind]);
      g.g.add(it);
      g.load[kind] = it;
      if (first) it.scale.setScalar(LOAD_S);
      else tween(0.35, (u) => it.scale.setScalar(LOAD_S * (u < 0.7 ? u / 0.7 * 1.25 : 1.25 - (u - 0.7) / 0.3 * 0.25)));
    }
  }
  const tm = g.g.userData.trough.material;
  tm.color.set({ fouled: '#8a1c12', dirty: '#3c3936' }[g.state] || '#161210');
  tm.emissive.set(g.state === 'fouled' ? '#5a0d06' : g.state === 'loaded' ? '#4a3208' : '#000000');
}
// A light-wood crate, as on the Gunnery board, open and full of shot or bundled red stores, or shut.
// The gun tower's paint, shared so it can be changed (paintTower): gunwale, rail, crates.
const towerMat = { gunwale: mat('#a3271c', { roughness: 0.7 }), rail: mat('#d9b23a', { metalness: 0.4, roughness: 0.4 }), crates: mat('#c9a06a', { map: woodTex }) };
const TOWER_OWN = { gunwale: '#a3271c', rail: '#d9b23a', crates: '#c9a06a' };
function paintTower() {
  for (const kk of ['gunwale', 'rail', 'crates']) {
    const dye = denLook[kk], c = new THREE.Color(TOWER_OWN[kk]);
    // Painted crates keep a little of their wood; the gunwale and rail take the dye as it is.
    if (dye !== 'none') c.set(kk === 'crates' ? c.lerp(new THREE.Color(dyeHex(dye)), 0.75) : dyeHex(dye));
    towerMat[kk].color.copy(c);
  }
}
paintTower();
function crateMesh(i) {
  const g = new THREE.Group();
  const light = towerMat.crates, edge = mat('#6b4426');
  const box = mesh(new THREE.BoxGeometry(0.5, 0.26, 0.5), light);
  box.position.y = 0.13;
  g.add(box);
  // Dark frame round the top, like the board's outlines.
  [[0, 0.24, 0.5, 0.06], [0, -0.24, 0.5, 0.06], [0.24, 0, 0.06, 0.5], [-0.24, 0, 0.06, 0.5]].forEach(([x, z, w, d]) => { const b = mesh(new THREE.BoxGeometry(w, 0.04, d), edge); b.position.set(x, 0.27, z); g.add(b); });
  const fill = i % 3;
  if (fill === 0) {
    const ball = new THREE.SphereGeometry(0.085, 10, 8), m = mat('#8a9097', { metalness: 0.6, roughness: 0.35 });
    for (const [x, z] of [[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]]) { const b = mesh(ball, m); b.position.set(x, 0.27, z); g.add(b); }
    const top = mesh(ball, m); top.position.set(0, 0.38, 0); g.add(top);
  } else if (fill === 1) {
    // Bottles of rum, red wax on the corks.
    const glass = mat('#2f6b3a', { roughness: 0.2, metalness: 0.1 }), wax = mat('#c42d1f');
    for (const [x, z] of [[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]]) {
      const b = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 10), glass); b.position.set(x, 0.3, z);
      const top = mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.07, 8), wax); top.position.set(x, 0.41, z);
      g.add(b, top);
    }
  } else {
    [-0.12, 0, 0.12].forEach((x) => { const s = mesh(new THREE.BoxGeometry(0.11, 0.02, 0.44), light); s.position.set(x, 0.265, 0); g.add(s); });
  }
  return ink(g, 0.018);
}
function makeGunDeck() {
  if (gd || !ramp) return;
  const x0 = gunX0(), z0 = gunZ0(), cells = new Set();
  for (let r = 0; r < GD.rows; r++) for (let c = 0; c < GD.cols; c++) if (heightAt(x0 + (c + 0.5) * S, z0 + (r + 0.5) * S) > ramp.T - 0.1) cells.add(k(r, c));
  const group = new THREE.Group();
  group.userData.scenery = true;
  den.add(group);
  gd = { x0, z0, cells, group, stores: [], arrows: new Map(), emitT: 0.4, dirI: 0, tickT: 0, seq: 0, hover: null, pen: 0, press: null, guns: [], crates: [], crateSet: new Set(), crateMeshes: [], crateSig: '' };
  const nearest = (r, c) => [...cells].map((kk) => kk.split(',').map(Number)).sort((a, b) => Math.hypot(a[0] - r, a[1] - c) - Math.hypot(b[0] - r, b[1] - c))[0];
  gd.barrel = nearest((GD.rows - 1) / 2, (GD.cols - 1) / 2);
  // The deck's pieces, all one Gunnery brown.
  for (const j of ramp.jobs) {
    if (j.kind !== 'gun') continue;
    j.frame.group.traverse((m) => { if (m.isMesh && m.material !== frameMat) m.material = deckMat(''); });
    for (const pc of j.frame.pieces) pc.group.traverse((m) => { if (m.isMesh) m.material = deckMat(pc.info.letter); });
  }
  // The powder barrel, on its side in the middle, as on the Gunnery board.
  const bg = new THREE.Group();
  const keg = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 18), mat('#7a4c28', { map: woodTex }));
  const bulge = mesh(new THREE.SphereGeometry(0.25, 18, 12), mat('#7a4c28', { map: woodTex }));
  bulge.scale.set(1, 0.95, 1);
  [-0.17, 0.17].forEach((y) => { const h = mesh(new THREE.TorusGeometry(0.235, 0.02, 6, 24), mat('#2b2b2b', { metalness: 0.6 })); h.rotation.x = Math.PI / 2; h.position.y = y; keg.add(h); });
  const ends = mat('#a3743f', { map: woodTex });
  [-0.25, 0.25].forEach((y) => { const e = mesh(new THREE.CircleGeometry(0.2, 18), ends); e.rotation.x = y > 0 ? -Math.PI / 2 : Math.PI / 2; e.position.y = y + Math.sign(y) * 0.002; keg.add(e); });
  keg.add(bulge);
  keg.rotation.set(0, 0, Math.PI / 2);
  const tilt = new THREE.Group();
  tilt.add(keg);
  tilt.rotation.y = 0.5;
  tilt.position.y = 0.24;
  bg.add(ink(tilt, 0.02));
  bg.position.copy(gdAt(...gd.barrel));
  group.add(bg);
  for (const { port, d } of GD.guns) {
    const g = { port, d, state: 'empty', out: false, slide: 0, aim: 0, want: 0, g: gunMesh(), label: document.createElement('div'), sig: '', waitT: 0 };
    g.g.rotation.y = gunBase(g);
    g.g.position.copy(gunPos(g));
    group.add(g.g);
    $('labels').append(g.label);
    gd.guns.push(g);
  }
  gd.gunSet = new Set(gunCells().keys());
  // Legs down to the ground outside, under the tower's front and sides, braced across.
  const legM = mat('#4f321b', { map: woodTex }), w = GD.cols * S, dz = GD.rows * S;
  for (const [x, z] of [[0.2, 0.2], [w / 2, 0.2], [w - 0.2, 0.2], [0.2, dz / 2], [w - 0.2, dz / 2]]) {
    const leg = mesh(new THREE.BoxGeometry(0.26, ramp.T, 0.26), legM);
    leg.position.set(x0 + x, ramp.T / 2, z0 + z);
    group.add(leg);
  }
  for (const [ax, bx] of [[0.2, w / 2], [w / 2, w - 0.2]]) {
    const brace = mesh(new THREE.BoxGeometry(Math.hypot(bx - ax, ramp.T * 0.6), 0.12, 0.1), legM);
    brace.position.set(x0 + (ax + bx) / 2, ramp.T * 0.5, z0 + 0.2);
    brace.rotation.z = Math.atan2(ramp.T * 0.6, bx - ax);
    group.add(brace);
  }
  // The gunwale round the three open sides, red with a gold rail as on a Puzzle Pirates ship, open
  // at the gunports; a low sill along the back where it meets the wall-walk.
  const red = towerMat.gunwale, gold = towerMat.rail;
  const isPort = (r, c, d) => GD.guns.some((o) => o.port[0] === r && o.port[1] === c && o.d === d);
  for (let r = 0; r < GD.rows; r++) for (let c = 0; c < GD.cols; c++) for (let d = 0; d < 4; d++) {
    if (!cells.has(k(r, c)) || cells.has(k(r + DR[d], c + DC[d]))) continue;
    const along = d % 2 === 0, at = gdAt(r, c).add(new THREE.Vector3(DC[d] * (S / 2 - 0.05), 0, DR[d] * (S / 2 - 0.05)));
    const piece = (h, y, m, t) => { const b = mesh(new THREE.BoxGeometry(along ? S + 0.001 : t, h, along ? t : S + 0.001), m); b.position.copy(at); b.position.y += y; group.add(b); };
    if (d === 2) { piece(0.05, 0.025, gold, 0.1); continue; }
    if (isPort(r, c, d)) { piece(0.08, 0.04, red, 0.1); continue; }
    piece(0.34, 0.17, red, 0.1);
    piece(0.04, 0.36, gold, 0.13);
  }
  // Your Jolly Rogers on its two outer corners.
  for (const x of [x0 + 0.12, x0 + w - 0.12]) {
    const fp = flagpole(2.2);
    fp.position.set(x, ramp.T + 0.05, z0 + 0.12);
    group.add(fp);
  }
  // Where the pointer is on the deck: a ring, and a ghost of the arrow a click would chalk.
  gd.cursor = outline([[0, 0]], 0, '#ffffff');
  gd.cursor.material = new THREE.LineBasicMaterial({ color: '#ffffff' });
  gd.cursor.rotation.x = -Math.PI / 2;
  gd.cursor.visible = false;
  gd.ghost = arrowMesh('#ffd23a', 0.5);
  gd.ghost.visible = false;
  group.add(gd.cursor, gd.ghost);
  if (!guest()) setCrates(pickCrates());
}
/* How stores roll on a board with no arrows: from every square and heading, follow the rules till
   it repeats. A gun is on a loop when some loop rolls a store past the square where it goes in (one
   arrow there then loads it, time after time). */
function loopsOf(blocked) {
  const next = (r, c, d) => {
    for (const t of [0, 1, 3, 2]) { const nd = (d + t) % 4; if (!blocked(r + DR[nd], c + DC[nd])) return [r + DR[nd], c + DC[nd], nd]; }
    return [r, c, d];
  };
  const loops = [], done = new Set();
  for (const kk of gd.cells) {
    const [r0, c0] = kk.split(',').map(Number);
    if (blocked(r0, c0)) continue;
    for (let d0 = 0; d0 < 4; d0++) {
      let st = [r0, c0, d0];
      const path = new Map();
      while (!done.has(st.join()) && !path.has(st.join())) { path.set(st.join(), path.size); st = next(...st); }
      if (!done.has(st.join())) {
        const from = path.get(st.join()), loop = [...path.keys()].slice(from).map((s) => s.split(',').map(Number));
        loops.push({ len: loop.length, cells: new Set(loop.map(([r, c]) => k(r, c))) });
      }
      for (const s of path.keys()) done.add(s);
    }
  }
  return loops;
}
// Lash the crates about the deck: none round the barrel in the middle, more out towards the edges;
// none on a gun or where stores go into one, none side by side, and none walling off any of it.
// Of the boards tried, the one closest to a good Gunnery board: two guns on a loop of their own.
function pickCrates() {
  const [br, bc] = gd.barrel, guns = gunCells();
  const ban = new Set();
  for (const g of gd.guns) for (let i = 0; i <= 4; i++) ban.add(k(...gunSq(g, i)));
  const cand = [...gd.cells].filter((kk) => {
    const [r, c] = kk.split(',').map(Number);
    return !ban.has(kk) && c > 0 && c < GD.cols - 1 && Math.max(Math.abs(r - br), Math.abs(c - bc)) > 2;
  });
  // Weighted towards the edges.
  const weight = (kk) => { const [r, c] = kk.split(',').map(Number); return 1 + Math.max(Math.abs(r - br) / (GD.rows / 2), Math.abs(c - bc) / (GD.cols / 2)) * 3; };
  let best = null, bestScore = -Infinity;
  for (let t = 0; t < 160; t++) {
    const pick = new Set(), pool = cand.slice();
    while (pick.size < GD.crates && pool.length) {
      let x = Math.random() * pool.reduce((a, kk) => a + weight(kk), 0), i = 0;
      while ((x -= weight(pool[i])) > 0 && i < pool.length - 1) i++;
      const kk = pool.splice(i, 1)[0], [r, c] = kk.split(',').map(Number);
      if (![0, 1, 2, 3].some((d) => pick.has(k(r + DR[d], c + DC[d])))) pick.add(kk);
    }
    const blocked = (r, c) => !gd.cells.has(k(r, c)) || pick.has(k(r, c)) || guns.has(k(r, c)) || (r === br && c === bc);
    // Everything still joined up.
    const open = [...gd.cells].filter((kk) => !blocked(...kk.split(',').map(Number)));
    const seen = new Set([open[0]]), todo = [open[0]];
    while (todo.length) {
      const [r, c] = todo.pop().split(',').map(Number);
      for (let d = 0; d < 4; d++) { const n = k(r + DR[d], c + DC[d]); if (!blocked(r + DR[d], c + DC[d]) && !seen.has(n)) { seen.add(n); todo.push(n); } }
    }
    if (seen.size !== open.length) continue;
    // Which guns sit on a short loop of their own, with no arrows down.
    const loops = loopsOf(blocked).filter((l) => l.len <= 30);
    const onLoop = gd.guns.filter((g) => loops.some((l) => l.cells.has(k(...gunSq(g, 0))))).length;
    const score = -Math.abs(onLoop - 2) * 10 + Math.random();
    if (score > bestScore) { bestScore = score; best = pick; }
    if (onLoop === 2 && t > 20) break;
  }
  return [...(best || [])].map((kk) => kk.split(',').map(Number));
}
function setCrates(list) {
  gd.crateMeshes.forEach((m) => gd.group.remove(m));
  gd.crates = list;
  gd.crateSig = JSON.stringify(list);
  gd.crateSet = new Set(list.map(([r, c]) => k(r, c)));
  gd.crateMeshes = list.map(([r, c], i) => { const m = crateMesh(i); m.position.copy(gdAt(r, c)); gd.group.add(m); return m; });
}
// Squares with a pirate standing on them: a body's an obstacle too.
function gdBodies() {
  const out = new Set(), add = (x, z, h) => { if (h > ramp.T - 0.3) { const cell = gdCell(x, z); if (cell) out.add(k(...cell)); } };
  add(pirate.x, pirate.z, pirate.h);
  if (online()) for (const mt of net.crew.values()) add(mt.tx ?? 0, mt.tz ?? 0, mt.th ?? 0);
  return out;
}
const storeAt = (r, c) => gd.stores.some((o) => o.r === r && o.c === c);
function gunTick() {
  const bodies = gdBodies();
  // (A gun run out lies across its lane.)
  const blocked = (r, c) => !gd.cells.has(k(r, c)) || gdSolid(r, c) || bodies.has(k(r, c)) || gd.guns.some((g) => g.slide > 0.05 && g.port[0] === r && g.port[1] === c);
  // Where each store wants to go.
  const want = gd.stores.map((s) => {
    const a = gd.arrows.get(k(s.r, s.c));
    if (a) {
      s.dir = a.dir;
      // Into a gun: only off an arrow in its lane pointing into the muzzle.
      const g = gd.guns.find((o) => k(...gunSq(o, 0)) === k(s.r, s.c) && a.dir === gunMouth(o));
      if (g && g.state !== 'loaded') return { d: a.dir, r: s.r + DR[a.dir], c: s.c + DC[a.dir], gun: g };
    }
    for (const t of [0, 1, 3, 2]) {
      const d = (s.dir + t) % 4, r = s.r + DR[d], c = s.c + DC[d];
      if (!blocked(r, c)) return { d, r, c };
    }
    return null;
  });
  // Two that would meet, or swap places, both turn back; one rolling into a store that's staying
  // put turns back too.
  const back = new Set();
  for (let i = 0; i < want.length; i++) for (let j = i + 1; j < want.length; j++) {
    const a = want[i], b = want[j], s = gd.stores[i], o = gd.stores[j];
    if (!a || !b) continue;
    if ((a.r === b.r && a.c === b.c) || (a.r === o.r && a.c === o.c && b.r === s.r && b.c === s.c)) { back.add(i); back.add(j); }
  }
  for (let pass = 0; pass < 4; pass++) gd.stores.forEach((s, i) => {
    const w = want[i];
    if (!w || back.has(i)) return;
    const j = gd.stores.findIndex((o) => o.r === w.r && o.c === w.c);
    if (j >= 0 && (!want[j] || back.has(j))) back.add(i);
  });
  const gone = [];
  gd.stores.forEach((s, i) => {
    s.pr = s.r; s.pc = s.c; s.bump = null;
    const w = want[i];
    if (!w) return;
    // Turned back: it bumps up against what's there and bounces off, rather than stopping dead.
    if (back.has(i)) { s.bump = w.d; s.bumpA = gd.stores.some((o) => o.r === w.r && o.c === w.c) ? 0.12 : 0.34; s.dir = (w.d + 2) % 4; return; }
    s.r = w.r; s.c = w.c; s.dir = w.d;
    if (w.gun) { loadGun(w.gun, s.kind); gone.push(s); }
  });
  for (const s of gone) dropStore(s, true);
  // The barrel rolls out another of whatever's short, each way round in turn.
  gd.emitT -= GD.tick;
  const short = KINDS.filter((kd) => gd.stores.filter((s) => s.kind === kd).length < GD.each);
  if (gd.emitT <= 0 && short.length) {
    for (let t = 0; t < 4; t++) {
      const d = gd.dirI++ % 4, r = gd.barrel[0] + DR[d], c = gd.barrel[1] + DC[d];
      if (blocked(r, c) || storeAt(r, c)) continue;
      addStore(++gd.seq, short[rand(short.length)], r, c, d, gd.barrel[0], gd.barrel[1]);
      gd.emitT = GD.emit;
      break;
    }
  }
}
function addStore(id, kind, r, c, dir, pr = r, pc = c) {
  const m = storeMesh(kind);
  m.position.copy(gdAt(pr, pc));
  gd.group.add(m);
  const s = { id, kind, r, c, dir, pr, pc, m, spin: 0 };
  gd.stores.push(s);
  return s;
}
function dropStore(s, roll = false) {
  gd.stores.splice(gd.stores.indexOf(s), 1);
  if (!roll) { gd.group.remove(s.m); return; }
  // Roll on into the gun's muzzle before it goes.
  const from = gdAt(s.pr, s.pc), to = gdAt(s.r, s.c, 0.2), grp = gd.group;
  tween(GD.tick, (u) => { s.m.position.lerpVectors(from, to, u); s.m.scale.setScalar(1 - 0.7 * u); }, () => grp.remove(s.m));
}
function loadGun(g, kind) {
  const next = { empty: 'powder', powder: 'wad', wad: 'shot' }[g.state];
  const was = g.state;
  if (kind === 'bucket') g.state = 'empty';
  else if (kind === next) g.state = kind === 'shot' ? 'loaded' : kind;
  else g.state = 'fouled';
  burst(gdAt(...gunSq(g, 1), 0.45), kind === 'bucket' ? '#9fd0ff' : g.state === 'fouled' ? '#ff7a5c' : '#f0d9a8', 8, 2);
  if (g.state === 'fouled' && was !== 'fouled') say('A gun\'s fouled! Roll a bucket into it', false, true);
  if (g.state === 'loaded') { g.waitT = 0.9; say('Loaded!'); }
}
// A loaded gun swings on its carriage to aim, anywhere in an arc round the way it faces, and
// fires by itself: at the raiders at the wall first, then those coming in, then their cannon.
const GUN_ARC = 1.62;   // radians either side of straight out: enough to fire straight ahead
const gunBase = (g) => -g.d * Math.PI / 2;
const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
// The swing that points gun g at (x, z), or null if that's out of its arc.
function gunSwing(g, x, z) {
  const from = gdAt(...g.port), a = wrapA(Math.atan2(-(x - from.x), -(z - from.z)) - gunBase(g));
  return Math.abs(a) <= GUN_ARC ? a : null;
}
function gunTarget(g, taken = new Set()) {
  const from = gdAt(...g.port);
  let best = null, bd = Infinity;
  for (const r of raiders) {
    if (r.inside || r.gone || r.state === 'down' || !['approach', 'attack', 'hackOut', 'dazed'].includes(r.state) || r.z > -0.9 || r.z < -11) continue;
    if (gunSwing(g, r.x, r.z) === null || r.shotT > performance.now()) continue;   // (another gun's shot is on its way)
    if (taken.has(r) && g.tgt !== r) continue;   // another gun's swinging onto them
    // (Sticking with the one it's already swinging onto, rather than lurching between two.)
    const d = Math.hypot(r.x - from.x, r.z - from.z) + (r.state === 'approach' ? 6 : 0) - (g.tgt === r ? 4 : 0);
    if (d < bd && d < 22) { bd = d; best = r; }
  }
  if (best) {
    // Lead a raider still on the way in: aim where they'll be when the ball comes down.
    let x = best.x, z = best.z;
    if (best.state === 'approach' && best.hole) {
      const dur = 0.5 + Math.hypot(x - from.x, z - from.z) * 0.035, tx = holeX(best.hole) + best.slot - x, tz = -1.15 - z, n = Math.hypot(tx, tz);
      if (n > 0) { const step = Math.min(n, 2.2 * dur); x += tx / n * step; z += tz / n * step; }
    }
    return { x, z, r: best };
  }
  if (cannon.visible && G.phase === 'wave' && (G.aim || (G.cannonShots > 0 && G.cannonT < 12)) && gunSwing(g, cannon.position.x, cannon.position.z) !== null) return { x: cannon.position.x, z: cannon.position.z, cannon: true };
  return null;
}
function fireGun(i, tx, tz, atCannon) {
  const g = gd.guns[i];
  if (isHost()) send('all', { t: 'gfire', i, x: r2(tx), z: r2(tz), cn: atCannon ? 1 : 0 });
  g.state = 'dirty';
  // Out of its own muzzle, pointed at the target; the recoil brings it back in.
  g.aim = gunSwing(g, tx, tz) ?? g.aim;
  g.slide = 1;
  g.g.rotation.y = gunBase(g) + g.aim;
  g.g.position.copy(gunPos(g));
  g.g.updateMatrixWorld(true);
  g.out = false;
  const from = g.g.localToWorld(new THREE.Vector3(0, 0.3, -0.85)), to = new THREE.Vector3(tx, 0.4, tz);
  burst(from, '#ffcf6a', 14, 3);
  burst(from, '#cfc6b8', 10, 1.5);
  shake = Math.max(shake, 0.25);
  const ball = mesh(new THREE.SphereGeometry(0.17, 12, 10), mat('#3a3f45', { metalness: 0.6 }));
  scene.add(ball);
  const d = from.distanceTo(to), dur = 0.5 + d * 0.035;
  tween(dur, (s) => {
    ball.position.lerpVectors(from, to, s);
    ball.position.y += Math.sin(s * Math.PI) * (1.5 + d * 0.12);
  }, () => {
    scene.remove(ball);
    burst(to, '#ffb85a', 26, 5);
    burst(to, '#7a6a5a', 16, 3.5);
    if (guest()) return;
    if (atCannon) { const spoilt = !!G.aim; G.aim = null; G.cannonT = Math.max(G.cannonT, 25); say(spoilt ? 'A hit on their cannon! Its aim\'s spoilt' : 'A hit on their cannon! It\'s quiet for a while'); return; }
    let n = 0;
    for (const r of raiders) if (!r.inside && r.state !== 'down' && !r.gone && Math.hypot(r.x - tx, r.z - tz) < 1.8) { hit(r, from, '#3a3a3a'); n++; }
    if (n > 1) say(`Broadside! ${n} raiders bowled over`);
  });
}
function updateGunDeck(dt) {
  if (!gd) return;
  if (!guest()) {
    gd.tickT += dt / GD.tick;
    if (gd.tickT >= 1) { gd.tickT = Math.min(gd.tickT - 1, 0.5); gunTick(); }
    // A loaded gun with something to fire at is run out over its lane (once the lane's clear) and
    // swung onto the target; it fires once it's on.
    // Guns already onto a raider keep them; the rest pick from who's left, so two guns don't both
    // run out at one raider and one then haul back in.
    const taken = new Set();
    gd.guns.forEach((g) => { if (g.state !== 'loaded') g.tgt = null; else if (g.tgt) taken.add(g.tgt); });
    const order = gd.guns.map((g, i) => i).sort((a, b) => !!gd.guns[b].tgt - !!gd.guns[a].tgt);
    order.forEach((i) => {
      const g = gd.guns[i];
      if (g.state !== 'loaded') return;
      if (g.tgt) taken.delete(g.tgt);
      const t = gunTarget(g, taken);
      g.tgt = t?.r || null;
      if (g.tgt) taken.add(g.tgt);
      g.out = !!t && (g.out || !storeAt(...g.port));
      g.want = t ? gunSwing(g, t.x, t.z) : 0;
      if ((g.waitT -= dt) > 0 || !t || Math.abs(g.aim - g.want) > 0.06 || g.slide < 1) return;
      if (t.r) t.r.shotT = performance.now() + 2500;
      g.tgt = null;
      fireGun(i, t.x, t.z, t.cannon);
    });
  } else gd.tickT = Math.min(1, gd.tickT + dt / GD.tick);
  const u = Math.min(1, gd.tickT);
  for (const s of gd.stores) {
    const was = s.m.position.clone();
    s.m.position.lerpVectors(gdAt(s.pr, s.pc), gdAt(s.r, s.c), u);
    // A bump: up against the store in the way, and back.
    if (s.bump != null) { const b = Math.sin(u * Math.PI) * (s.bumpA ?? 0.2) * S; s.m.position.x += DC[s.bump] * b; s.m.position.z += DR[s.bump] * b; }
    // It swings round to its new way smoothly, not in a snap.
    const face = s.bump != null && u < 0.5 ? s.bump : s.dir;
    s.yaw = s.yaw == null ? -face * Math.PI / 2 : s.yaw + wrapA(-face * Math.PI / 2 - s.yaw) * Math.min(1, dt * 14);
    s.m.rotation.y = s.yaw;
    // Shot rolls; the rest slide with a little jostle.
    const moved = was.distanceTo(s.m.position), body = s.m.userData.body;
    if (s.kind === 'shot') body.rotation.x -= moved / 0.2;
    else body.rotation.z = Math.sin((s.spin += moved * 9)) * 0.08;
  }
  for (const g of gd.guns) {
    gunLoad(g, dt);
    // Hauled out slowly by the crew, then swung onto its target; the recoil throws it back in fast,
    // and it's swung back square to be loaded again.
    g.slide = g.out ? Math.min(1, g.slide + dt * 1.6) : Math.max(0, g.slide - dt * 5);
    const want = !g.out ? 0 : g.slide > 0.95 ? g.want ?? 0 : g.aim, rate = g.out ? 1.6 : 3;
    g.aim += Math.max(-dt * rate, Math.min(dt * rate, want - g.aim));
    g.g.rotation.y = gunBase(g) + g.aim;
    g.g.position.copy(gunPos(g));
  }
  gd.cursor.visible = gd.ghost.visible = false;
  if (gd.hover && onGunDeck() && !carry) {
    const [r, c] = gd.hover, at = gdAt(r, c, 0.03), a = gd.arrows.get(k(r, c));
    if (canChalk(r, c)) {
      gd.cursor.position.set(at.x - S / 2, at.y, at.z - S / 2);
      gd.cursor.visible = true;
      if (!a) { gd.ghost.position.copy(at); gd.ghost.rotation.y = -gd.pen * Math.PI / 2; gd.ghost.visible = true; }
    }
  }
}
// Labels over the guns: what each wants next.
function gunLabels() {
  if (!gd) return;
  for (const g of gd.guns) {
    const [cls, text, want] = GUN_SAYS[g.state], sig = cls + text;
    if (g.sig !== sig) {
      g.sig = sig;
      g.label.className = `label gun ${cls}`;
      g.label.innerHTML = want ? `<small>${g.state === 'fouled' ? 'Fouled! needs' : g.state === 'dirty' ? 'Fired: needs' : 'needs'}</small>${STORE_ICON[want]}${STORE_NAME[want]}` : text;
    }
    // Out over its gunport, so it doesn't hide what's in the barrel.
    v3.copy(gdAt(...g.port, 0.5));
    v3.x += DC[g.d] * S * 1.1; v3.z += DR[g.d] * S * 1.1;
    v3.project(camera);
    g.label.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
    g.label.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
    g.label.style.display = v3.z > 1 || pirate.h < 1 ? 'none' : '';   // only once you're up on the wall
  }
}
// Chalking: an arrow on a plank, pointing one of the four ways. Chalk where one is and it turns
// to point your way; chalk the same way again and it's rubbed out.
const myArrows = (by = myId()) => [...gd.arrows.values()].filter((a) => a.by === by);
const canChalk = (r, c) => gd.cells.has(k(r, c)) && !gdSolid(r, c);
function chalk(r, c, dir, by = myId()) {
  if (!gd || !canChalk(r, c)) return false;
  if (guest() && by === myId()) { send('host', { t: 'chalk', r, c, dir }); return true; }
  const kk = k(r, c), old = gd.arrows.get(kk);
  if (old) { gd.group.remove(old.m); gd.arrows.delete(kk); if (dir < 0 || (old.dir === dir && old.by === by)) return true; }
  if (dir < 0) return true;
  const mine = myArrows(by).sort((a, b) => a.t - b.t);
  while (mine.length >= GD.arrows) { const o = mine.shift(); gd.group.remove(o.m); gd.arrows.delete(k(o.r, o.c)); }
  putArrow(r, c, dir, by);
  return true;
}
function putArrow(r, c, dir, by, t = performance.now()) {
  const ci = by === myId() ? -1 : net.crew.get(by)?.ci ?? -1;
  const m = arrowMesh(ci >= 0 ? CREW_COLOURS[ci] : '#ffd23a');
  m.position.copy(gdAt(r, c, 0.02));
  m.rotation.y = -dir * Math.PI / 2;
  gd.group.add(m);
  gd.arrows.set(k(r, c), { r, c, dir, by, t, m });
}
const facing = () => {
  const ry = pirate.g.rotation.y, fx = Math.sin(ry), fz = Math.cos(ry);
  return Math.abs(fx) > Math.abs(fz) ? (fx > 0 ? 1 : 3) : (fz < 0 ? 0 : 2);
};
// Space on the deck: an arrow on the plank in front of you, pointing the way you face.
function chalkAhead() {
  const me = gdCell(pirate.x, pirate.z), d = facing();
  if (!me) return;
  if (!chalk(me[0] + DR[d], me[1] + DC[d], d)) shake = 0.15;
}
// Q/E on the deck: turn the arrow in front of you.
function turnArrowAhead(t) {
  const me = gdCell(pirate.x, pirate.z), d = facing();
  const a = me && gd.arrows.get(k(me[0] + DR[d], me[1] + DC[d]));
  if (a) chalk(a.r, a.c, (a.dir + t) % 4);
}
/* The mouse, as in Gunnery: click a plank to chalk an arrow pointing the way the ghost arrow shows
   (the wheel turns it), or drag from the plank the way you want it to point. Click an arrow to turn
   it a quarter clockwise; the wheel over one turns it too. Right-click rubs one out. */
function screenDir(r, c, dx, dy) {
  const p0 = gdAt(r, c).project(camera);
  let best = 0, bd = -Infinity;
  for (let d = 0; d < 4; d++) {
    const p = gdAt(r + DR[d], c + DC[d]).project(camera), sx = p.x - p0.x, sy = p0.y - p.y, n = Math.hypot(sx, sy) || 1;
    const dot = (sx * dx + sy * dy) / n;
    if (dot > bd) { bd = dot; best = d; }
  }
  return best;
}
function chalkRelease(x, y) {
  const pr = gd.press;
  gd.press = null;
  if (!pr) return;
  const dx = x - pr.x, dy = y - pr.y, old = gd.arrows.get(k(pr.r, pr.c));
  let dir;
  if (Math.hypot(dx, dy) > 14) dir = screenDir(pr.r, pr.c, dx, dy);
  else dir = old ? (old.dir + 1) % 4 : gd.pen;
  if (old && old.dir === dir) return;
  gd.pen = dir;
  if (!chalk(pr.r, pr.c, dir)) shake = 0.15;
}
function wheelDeck(step) {
  gd.pen = (gd.pen + step + 4) % 4;
  const a = gd.hover && gd.arrows.get(k(...gd.hover));
  if (a) { chalk(a.r, a.c, (a.dir + step + 4) % 4); gd.pen = (a.dir + step + 4) % 4; }
}
const gunOut = () => gd && {
  s: gd.stores.map((s) => [s.id, KINDS.indexOf(s.kind), s.r, s.c, s.dir]),
  g: gd.guns.map((g) => [g.state, g.out ? 1 : 0, r2(g.want || 0)]),
  a: [...gd.arrows.values()].map((a) => [a.r, a.c, a.dir, a.by]),
  cr: gd.crates,
};
function gunIn(d) {
  if (!d || !gd) return;
  if (d.cr && JSON.stringify(d.cr) !== gd.crateSig) setCrates(d.cr);
  const seen = new Set(), stepped = new Set();
  for (const [id, ki, r, c, dir] of d.s) {
    seen.add(id);
    const s = gd.stores.find((o) => o.id === id);
    if (!s) { addStore(id, KINDS[ki], r, c, dir); continue; }
    if (s.r !== r || s.c !== c) { s.pr = s.r; s.pc = s.c; s.r = r; s.c = c; s.bump = null; stepped.add(s); }
    else if (dir === (s.dir + 2) % 4) { s.bump = s.dir; stepped.add(s); }
    s.dir = dir;
  }
  // A new beat. The ones that didn't move stay where they are, not jumping back to where they last
  // came from to roll in again.
  if (stepped.size) {
    gd.tickT = 0;
    for (const s of gd.stores) if (!stepped.has(s)) { s.pr = s.r; s.pc = s.c; s.bump = null; }
  }
  for (const s of gd.stores.slice()) if (!seen.has(s.id)) { s.pr = s.r; s.pc = s.c; dropStore(s, true); }
  d.g.forEach(([st, out, want], i) => { const g = gd.guns[i]; if (g) { g.state = st; g.out = !!out; g.want = want || 0; } });
  const want = new Map(d.a.map(([r, c, dir, by]) => [k(r, c), { r, c, dir, by }]));
  for (const [kk, a] of gd.arrows) {
    const w = want.get(kk);
    if (!w || w.dir !== a.dir || w.by !== a.by) { gd.group.remove(a.m); gd.arrows.delete(kk); }
  }
  for (const [kk, w] of want) if (!gd.arrows.has(kk)) putArrow(w.r, w.c, w.dir, w.by);
}

function makeGate() {
  const { c0, c1 } = wall.gateCols;
  const w = (c1 - c0 + 1) * S, h = (wall.H - 1) * S;
  const g = new THREE.Group();
  const plankMat = mat('#5b3a20', { map: woodTex });
  for (let i = 0; i < 6; i++) {
    const p = mesh(new THREE.BoxGeometry(w / 6 - 0.02, h, 0.22), plankMat);
    p.position.set(-w / 2 + (i + 0.5) * w / 6, h / 2, -0.25);
    g.add(p);
  }
  const iron = mat('#2a2a2a', { metalness: 0.6, roughness: 0.5 });
  [0.2, 0.5, 0.82].forEach((t) => { const b = mesh(new THREE.BoxGeometry(w, 0.1, 0.05), iron); b.position.set(0, h * t, -0.12); g.add(b); });
  const bar = mesh(new THREE.BoxGeometry(w + 0.5, 0.16, 0.14), mat('#3e2614', { map: woodTex }));
  bar.position.set(0, h * 0.5, -0.02);
  const ringL = mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 16), iron);
  ringL.position.set(-0.18, h * 0.36, -0.08);
  const ringR = ringL.clone();
  ringR.position.x = 0.18;
  g.add(bar, ringL, ringR);
  g.position.set(X(c0) + w / 2, 0, 0);
  return g;
}

// ---------- piles (the toolbox), fire barrel, chest, cannon ----------
const crateGeo = new RoundedBoxGeometry(1.2, 0.64, 1.2, 2, 0.04);
const piles = [0, 1, 2].map(() => {
  const label = document.createElement('div');
  label.className = 'label weak';
  label.innerHTML = 'Restocking<span class="bar part"><b></b></span>';
  label.style.display = 'none';
  $('labels').append(label);
  return { x: 0, z: 0, letter: null, cells: null, group: null, wait: 0, label, crate: mesh(crateGeo, mat('#7a5230', { map: woodTex })) };
});
function deal(p) {
  p.letter = C.weightedLetter();
  p.cells = C.normalize(C.pick(C.ORIENTS_BY_LETTER[p.letter]).cells);
}
function showPile(p) {
  if (p.group) scene.remove(p.group);
  p.group = null;
  if (!p.letter) return;
  const g = centred(p.cells, woodMat(p.letter));
  g.rotation.x = -Math.PI / 2;
  g.scale.setScalar(0.38);
  g.position.set(p.x, 0.76, p.z);
  scene.add(g);
  p.group = g;
}
/* The toolbox along the bottom of the screen: what's on each crate, so you can plan your next
   piece from the wall instead of walking back to look (the user: "so that it runs a bit faster").
   The crates are numbered 1, 2, 3, left to right as they stand, and pressing the number (or
   clicking the tile) takes that crate's piece into your hands wherever you are. */
const toolEls = [];
const cratesInOrder = () => [...piles].sort((a, z) => a.x - z.x);
function takeCrate(j) {
  const p = cratesInOrder()[j];
  if (!p || G.over || deco.on || onGunDeck() || net.pending || net.asking) return;
  if (carry && carry.from === p) return putBack();
  if (!p.letter) return toast(p.wait > 0.3 ? `Crate ${j + 1} is restocking` : `Crate ${j + 1}'s piece has been taken`, false, true);
  if (carry && !carry.from) return toast('Your hands are full: fit that piece first', false, true);
  if (carry) putBack();
  pickUp(p);
}
// One whole piece, drawn the main game's way (js/render.js), in the den's wood colours.
function pieceSvg(letter, cells) {
  const b = C.bbox(cells), cs = Math.min(11, Math.floor(42 / b.h), Math.floor(54 / b.w));
  return window.Render.piece(letter, cells, { cell: cs, pad: 1 });
}
function toolbox() {
  const box = $('toolbox');
  box.hidden = onGunDeck();
  if (box.hidden) return;
  if (!toolEls.length) {
    box.insertAdjacentHTML('afterbegin', window.Render.defs());   // (the grain patterns)
    for (const [l, c] of Object.entries(WOOD)) box.style.setProperty(`--p-${l}`, c);
  }
  if (!toolEls.length) for (let i = 0; i < piles.length; i++) {
    const el = document.createElement('div');
    el.addEventListener('click', () => takeCrate(i));
    box.append(el);
    toolEls.push({ el, sig: '' });
  }
  cratesInOrder().forEach((p, j) => {
    const t = toolEls[j], mine = carry && carry.from === p;
    const state = p.letter ? 'piece' : mine ? 'hand' : p.wait > 0.3 ? 'wait' : 'taken';
    const sig = `${state}|${p.letter}|${p.cells}|${mine ? carry.cells : ''}|${state === 'wait' ? Math.ceil(p.wait) : ''}`;
    if (sig !== t.sig) {
      t.sig = sig;
      t.el.className = `tool ${state}`;
      const n = `<kbd>${j + 1}</kbd>`;
      t.el.innerHTML = state === 'piece' ? `${pieceSvg(p.letter, p.cells)}<span>${n}</span>`
        : state === 'hand' ? `${pieceSvg(carry.letter, carry.cells)}<span>${n} in hand</span>`
        : state === 'wait' ? `<span>${n} restocking<br>${Math.ceil(p.wait)}s</span><i><b></b></i>`
        : `<span>${n} taken</span>`;
    }
    if (state === 'wait') t.el.querySelector('b').style.width = `${Math.min(1, 1 - p.wait / (p.waitFull || restockSecs())) * 100}%`;
  });
}
const barrel = (() => {
  const g = new THREE.Group();
  const b = mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.9, 16), mat('#6a4326', { map: woodTex }));
  b.position.y = 0.45;
  const hoop = mat('#2b2b2b', { metalness: 0.6 });
  [0.15, 0.75].forEach((y) => { const h = mesh(new THREE.TorusGeometry(0.405, 0.025, 6, 24), hoop); h.rotation.x = Math.PI / 2; h.position.y = y; g.add(h); });
  const fire = mesh(new THREE.ConeGeometry(0.28, 0.4, 10), new THREE.MeshBasicMaterial({ color: '#ff8a2a' }), false);
  fire.position.y = 1.05;
  const l = new THREE.PointLight('#ff7a2a', 6, 4, 1.8);
  l.position.y = 1.3;
  g.add(b, fire, l);
  return g;
})();
let chestHeap = null;
const chest = (() => {
  const g = new THREE.Group();
  const base = mesh(new RoundedBoxGeometry(1.1, 0.55, 0.7, 2, 0.04), mat('#6b3f22', { map: woodTex }));
  base.position.y = 0.28;
  const lid = mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.1, 16, 1, false, 0, Math.PI), mat('#7a4a28', { map: woodTex }));
  lid.rotation.set(-0.9, 0, Math.PI / 2);
  lid.position.set(0, 0.6, -0.32);
  const gold = mat('#e8b23a', { metalness: 0.8, roughness: 0.25, emissive: '#5a3a00' });
  chestHeap = mesh(new THREE.SphereGeometry(0.42, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), gold);
  chestHeap.scale.set(1.2, 0.5, 0.75);
  chestHeap.position.y = 0.52;
  g.add(base, lid, chestHeap);
  g.rotation.y = 0.4;
  return g;
})();
const cannon = (() => {
  const g = new THREE.Group();
  const iron = mat('#26282b', { metalness: 0.7, roughness: 0.4 });
  const tube = mesh(new THREE.CylinderGeometry(0.2, 0.28, 1.5, 16), iron);
  tube.rotation.x = Math.PI / 2 - 0.35;
  tube.position.set(0, 0.75, 0.2);
  const carriage = mesh(new RoundedBoxGeometry(0.7, 0.35, 1.1, 2, 0.04), mat('#5b3a20', { map: woodTex }));
  carriage.position.y = 0.35;
  const wheelM = mat('#3e2614');
  [-1, 1].forEach((s) => [-0.3, 0.35].forEach((z) => { const w = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 14), wheelM); w.rotation.z = Math.PI / 2; w.position.set(0.4 * s, 0.22, z); g.add(w); }));
  const gunner = makePirate({ shirt: ['#1f2433', '#59607a'], scarf: '#2b2b2b', patch: false, beard: '#222' });
  gunner.g.scale.setScalar(0.85);
  gunner.g.position.set(0.8, 0, -0.5);
  gunner.g.rotation.y = -0.3;
  g.add(tube, carriage, gunner.g);
  g.userData.muzzle = new THREE.Vector3(0, 1.0, 0.9);
  addXray(g, new THREE.MeshBasicMaterial({ color: '#ff8a3a', transparent: true, opacity: 0.45, depthFunc: THREE.GreaterDepth, depthWrite: false }));
  return g;
})();

// ---------- game state ----------
const pirate = Object.assign(makePirate({ look: myLook }), { x: 0, z: 8, bonkT: 0, h: 0, hs: 0, hop: null });
const STEP = 0.62, HOP = 1.2;   // metres: walked up / hopped up (a stair square is about 0.53)
const view = { yaw: 0, pitch: 0, zoom: 1 };   // the player's own turn, tilt and zoom of the camera
pirate.g.rotation.y = Math.PI;
scene.add(pirate.g);
let carry = null;   // { letter, cells, from, group, mat }
let bounds = { x: 6, z0: 0.55, z1: 10.5 };
let obstacles = [];
const G = {};
const keys = new Set();
const tweens = [];
const sparks = [];
const raiders = [];
let ghost = null, ghostKey = '', target = null, cycle = 0, shake = 0;
let mouse = null, mouseMode = false, topView = false;
/* Puzzle mode at the wall: walk up to it with a piece and the camera pulls back to show the whole
   wall, every hole at once, as near the real puzzle's board as the den gets. WASD moves the piece a
   square at a time, always the way the key points on screen, and the arrows jump it hole to hole;
   the pirate walks along under it by themself. Space or a click fits it, and that's you back to
   walking, as is Esc (the view stays a moment, so taking the next piece with 1 2 3 carries on).
   The user: running the pirate from hole to hole was too much effort, left/right went different
   ways depending on the camera, and in this mode WASD should be "pure" piece moving. */
let wm = null, wmBlock = null, wallView = 0, wmLinger = 0;

function newGame() {
  if (guest()) return send('host', { t: 'again' });
  raiders.splice(0).forEach((r) => { scene.remove(r.m.g); r.mark.remove(); });
  if (carry) { scene.remove(carry.group); carry = null; }
  ghostKey = ''; ghost = null;
  Object.assign(G, { gold: 60, wave: 0, phase: 'build', phaseT: BUILD_SECS, toSpawn: 0, spawnT: 0, cannonT: 0, cannonShots: 0, aim: null, masters: 0, boarded: 0, bonked: 0, stolen: 0, turned: 0, waveTurned: 0, waveIn: 0, over: false });
  piles.forEach(deal);
  newWall();
  Object.assign(pirate, { x: 0, z: 8, h: 0 });
  $('end').classList.remove('on');
  $('intro').classList.remove('off');
  updateStats();
  if (isHost()) sendSync('all', true);
}

// ---------- the rules: where a piece can go, and what a hole needs now ----------
const rest = (h) => h.cells.filter(([r, c]) => !h.filled.has(k(r, c)));
/* Every spot the piece could go: it must cover at least one empty square of an open hole and no
   square of another hole, the gate or other wood. Squares over the stone around the hole are
   allowed (that's boarding it over); `over` counts them. */
function fits(cells) {
  const out = [], seen = new Set();
  const b = C.bbox(cells);
  wall.holes.forEach((h, hi) => {
    // With boards nailed on behind, only the part of the hole they don't cover can be reached.
    if (h.status !== 'open') return;
    const boarded = h.pieces.some((p) => p.patch);
    for (const [er, ec] of rest(h)) for (const [pr, pc] of cells) {
      const dr = er - pr, dc = ec - pc;
      if (seen.has(k(dr, dc))) continue;
      seen.add(k(dr, dc));
      let over = 0, ok = true;
      for (const [r, c] of cells) {
        const R = r + dr, Cc = c + dc, kk = k(R, Cc);
        if (R < 0 || R >= wall.H || Cc < 0 || Cc >= wall.W || wall.gate.has(kk) || wall.wood.has(kk) || (boarded && wall.lining.some((s) => s.has(kk)))) { ok = false; break; }
        const ho = wall.cellHole.get(kk);
        if (ho === undefined) over++;
        else if (ho !== hi) { ok = false; break; }
      }
      if (ok) out.push({ dr, dc, hole: hi, over, cx: X(dc) + b.w * S / 2, cy: Y(dr) - b.h * S / 2, fr: dr + b.h / 2, fc: dc + b.w / 2 });
    }
  });
  return out;
}
/* Layers behind: once a hole's mended, a timber frame (studwork) goes up round it on the den side,
   and the hole's shape is open in it again: a second layer to fill, piece by piece, the pieces
   slotting together like the hole itself (the user: one piece started a layer and the next, which
   fitted perfectly beside it, started a third). Filled exactly, it's a Masterpiece layer; a piece
   may hang over onto the studwork, but then the layer's only boarded over. Each layer done, the
   next opens in front of it, up to MAX_PATCHES. Raiders hack through the hole, then each layer in
   turn. So a piece that fits nowhere else still has a use. */
/* Boards nailed on behind a hole are planks (PATCH_D thick) right up against it: against the stone,
   or in front of a piece boarded over it, which stands proud. Each layer goes on in front of the
   last. patchZ is a layer's front face. (They used to be full-depth pieces standing half a metre
   out, and from the camera's angle the ghost showed half a square below the hole it was for: the
   user saw it as not snapping to the right place.) */
const PATCH_D = 0.14;
const patchBase = (h) => (h?.pieces.some((p) => p.over && !p.patch) ? WOOD_D - 0.12 : 0.02);
const patchZ = (layer, h) => patchBase(h) + PATCH_D * (layer + 1);
// The squares of studwork round a hole: a square's width all round, clear of the gate and other holes.
function ringOf(h) {
  if (h.ring?.n === h.cells.length) return h.ring.cells;
  const out = new Map();
  for (const [r, c] of h.cells) for (let a = -1; a <= 1; a++) for (let z = -1; z <= 1; z++) {
    const R = r + a, Cc = c + z, kk = k(R, Cc), ho = wall.cellHole.get(kk);
    if (R >= 0 && R < wall.H && Cc >= 0 && Cc < wall.W && !h.set.has(kk) && !wall.gate.has(kk) && ho === undefined) out.set(kk, [R, Cc]);
  }
  h.ring = { n: h.cells.length, cells: [...out.values()] };
  return h.ring.cells;
}
const layerPieces = (h, i) => h.pieces.filter((p) => p.patch && p.layer === i);
function layerOpen(h, i) {
  const cov = new Set(layerPieces(h, i).flatMap((p) => p.cells));
  return h.cells.filter(([r, c]) => !cov.has(k(r, c)));
}
// The layer pieces go into now: the outermost, until it's full; then a new one. -1: none.
function curLayer(h) {
  const n = h.lay.length;
  if (!n) return h.status !== 'open' ? 0 : -1;
  if (h.lay[n - 1].status === 'open') return n - 1;
  return n < MAX_PATCHES ? n : -1;
}
function patchFits(cells) {
  const out = [], b = C.bbox(cells);
  wall.holes.forEach((h, hi) => {
    const layer = curLayer(h);
    if (layer < 0) return;
    const ring = new Set(ringOf(h).map(([r, c]) => k(r, c))), seen = new Set();
    for (const [er, ec] of layerOpen(h, layer)) for (const [pr, pc] of cells) {
      const dr = er - pr, dc = ec - pc;
      if (seen.has(k(dr, dc))) continue;
      seen.add(k(dr, dc));
      let over = 0;
      const ok = cells.every(([r, c]) => {
        const kk = k(r + dr, c + dc);
        if (ring.has(kk)) over++;
        return (h.set.has(kk) || ring.has(kk)) && !wall.lining[layer].has(kk);
      });
      if (ok) out.push({ dr, dc, hole: hi, over, patch: true, layer, cx: X(dc) + b.w * S / 2, cy: Y(dr) - b.h * S / 2, fr: dr + b.h / 2, fc: dc + b.w / 2 });
    }
  });
  return out;
}
// A piece just went into layer i: count it in, and if the layer's full, it's done.
function layerAdd(h, i) {
  const L = h.lay[i];
  if (!L || L.status !== 'open') return;
  if (layerOpen(h, i).length) { L.hp += HP.piece; L.maxHp = L.hp; return; }
  const master = layerPieces(h, i).every((p) => !p.over);
  L.status = master ? 'master' : 'boarded';
  L.hp = L.maxHp = HP[L.status];
  G.gold += PAY[L.status];
  if (master) { G.masters++; toast('Masterpiece layer! Another one opens in front of it'); }
  else { G.boarded++; toast('Layer boarded over: it\'ll hold, but not for long', false, true); }
  layerPieces(h, i).forEach(({ group }) => group.traverse((o) => {
    if (!o.isMesh) return;
    o.material = o.material.clone();
    tween(1.2, (t) => { o.material.emissive = new THREE.Color(master ? '#ffcf4a' : '#c98a45'); o.material.emissiveIntensity = 0.8 * (1 - t); });
  }));
  updateStats();
}
/* The studwork: a frame of timber a square wide round the opening of each layer there is (and the
   next one to fill), with a dark edge round the opening, so you can see where a layer goes and
   what's left to fill (the user: "some kind of wooden studwork structure outlining where the second
   layer goes, with material between the holes"). */
const studMat = mat('#8a5a32', { map: woodTex, roughness: 0.95 });
const studGeo = new THREE.BoxGeometry(S * 0.98, S * 0.98, 1);
function studwork(h) {
  const cur = curLayer(h), n = Math.min(MAX_PATCHES, Math.max(h.lay.length, cur + 1));
  const sig = `${n}|${h.cells.length}|${patchBase(h)}`;
  if (h.studSig === sig && h.stud?.parent === wallGroup) return;
  h.studSig = sig;
  if (h.stud) wallGroup.remove(h.stud);
  h.stud = null;
  if (!n) return;
  const g = new THREE.Group(), ring = ringOf(h), d = PATCH_D - 0.05;
  for (let i = 0; i < n; i++) {
    const z1 = patchZ(i, h) - 0.03;
    for (const [r, c] of ring) {
      const m = new THREE.Mesh(studGeo, studMat);
      m.scale.z = d;
      m.position.set((c + 0.5) * S, -(r + 0.5) * S, z1 - d / 2);
      m.castShadow = false;
      g.add(m);
    }
    g.add(fatOutline(h.cells, z1 + 0.005, '#3a2412', 0.07));
  }
  g.position.set(X(0), Y(0), 0);
  wallGroup.add(g);
  h.stud = g;
}
// Number each hole's boards from the stone outwards again (after one's broken or taken off), and
// note which squares each layer covers.
function relining() {
  wall.lining.forEach((s) => s.clear());
  for (const h of wall.holes) {
    const boards = boardsOf(h), used = [...new Set(boards.map((p) => p.layer))].sort((a, b) => a - b);
    h.lay = used.map((i) => h.lay[i] || { hp: 0, maxHp: 1, status: 'open' });
    boards.forEach((p) => {
      const i = used.indexOf(p.layer);
      if (p.layer !== i) {
        p.layer = i;
        if (p.info) p.info.layer = i;
        const z0 = p.group.position.z, z1 = patchZ(i, h);
        p.base.z = z1;
        tween(0.25, (s) => { p.group.position.z = z0 + (z1 - z0) * s; });
      }
      p.cells.forEach((kk) => wall.lining[i].add(kk));
    });
  }
}
const an = (l) => ('AEFILMNORSX'.includes(l) ? 'an ' : 'a ') + l;
function updateHole(h) {
  if (h.rubble > 0 && h.pieces.length) { h.rubble = 0; rubbleShow(h); }   // mended over the rubble
  const left = rest(h);
  if (!left.length && h.status === 'open') {
    const master = !h.pieces.some((p) => p.over);
    h.status = master ? 'master' : 'boarded';
    h.hp = h.maxHp = HP[h.status];
    G.gold += PAY[h.status];
    if (master) { G.masters++; masterpiece(h); }
    else { G.boarded++; toast(`Boarded over: it'll hold, but not for long`, false, true); }
  }
  h.open = left;
  h.exact = h.status === 'open' && left.length % 5 === 0 && C.solve(left, 1).length > 0;
  h.sig = '';
  updateStats();
}
/* While you're carrying a piece, every mended hole with room for another layer shows where it'd
   go: its outline on the den side, gently pulsing, like a frame waiting to be filled. */
// (A thin line was too faint to make out: the user couldn't see what shape it was. So the hole's
// squares are filled in a pulsing light blue, with a bold outline.)
const nextMat = new THREE.MeshBasicMaterial({ color: '#5fcfff', transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false });
function nextLayer(h) {
  studwork(h);
  const layer = curLayer(h), show = !!carry && pirate.h < 0.3 && layer >= 0;
  const open = show ? layerOpen(h, layer) : [], sig = `${layer}|${open.length}`;
  if (show && (h.next?.parent !== wallGroup || h.nextSig !== sig)) {
    if (h.next) wallGroup.remove(h.next);
    h.nextSig = sig;
    h.next = new THREE.Group();
    for (const [r, c] of open) {
      const p = new THREE.Mesh(cellPlane, nextMat);
      p.position.set((c + 0.5) * S, -(r + 0.5) * S, 0);
      h.next.add(p);
    }
    h.next.add(fatOutline(open, 0.01, '#bdeeff', 0.05));
    wallGroup.add(h.next);
  }
  if (!h.next) return;
  h.next.visible = show;
  if (show) h.next.position.set(X(0), Y(0), patchZ(layer, h) - PATCH_D + 0.01);   // where the board's back will go
}
const boardsOf = (h) => h.pieces.filter((p) => p.patch).sort((a, b) => a.layer - b.layer);
// How full the strength bar is: the hole's own wood, or once that's gone, the board they're on.
const barFrac = (h) => (weakSpot(h) ? h.weak / WEAK : h.rubble > 0 && !h.pieces.length ? h.rubble / RUBBLE : h.hp / h.maxHp);
/* A bar under the hole's own for each layer behind it, so boarding behind a damaged hole shows (the
   user: "no visible difference to the healthbar"). An unfinished layer's bar is amber. */
const layBars = (h) => h.lay.map((L) => `<i class="bar lay${L.status === 'open' ? ' part' : ''}"><b></b></i>`).join('');
function labelFor(h) {
  const atk = h.attackers ? `<em>⚔ ${h.attackers} raider${h.attackers > 1 ? 's' : ''} at it</em>` : '';
  const boards = h.lay.length, bs = boards > 1 ? 's' : '', cur = curLayer(h);
  const behind = boards ? ` · ${boards} layer${bs} behind` : '';
  const curOpen = cur >= 0 && h.lay[cur] ? layerOpen(h, cur).length : 0;
  const oneLeft = curOpen === 5 && C.identify(layerOpen(h, cur));
  const hurt = curOpen ? `<small>layer behind: ${oneLeft ? `needs ${an(oneLeft)}` : `${curOpen} squares to fill`}</small>`
    : h.hp < h.maxHp * 0.8 && cur >= 0 ? '<small>damaged: fill a layer behind it</small>' : carry && cur >= 0 ? `<small>room for ${boards ? 'another' : 'a'} layer behind</small>` : '';
  const bars = `<i class="bar"><b></b></i>${layBars(h)}`;
  if (h.status === 'master') return ['label done', `★ Masterpiece${behind}${hurt}${bars}${atk}`];
  if (h.status === 'boarded') return ['label weak', `Boarded over: weak${behind}${hurt}${bars}${atk}`];
  if (boards && !ownWood(h).length) return ['label weak', `Hacked open: ${boards} layer${bs} hold${boards > 1 ? '' : 's'}<small>they must get through each one</small>${hurt}${layBars(h)}${atk}`];
  if (h.rubble > 0 && !h.pieces.length) return ['label bad', `Fresh breach, full of rubble<small>mend it before they clear it!</small><i class="bar"><b></b></i>${atk}`];
  const left = h.open;
  const breach = h.pieces.length ? `<i class="bar part"><b></b></i>${layBars(h)}${atk}`
    : passable(h) ? `<em>${h.attackers ? '⚔ raiders can walk in!' : 'wide open: raiders can walk in'}</em>`
    : h.attackers || h.weak < WEAK ? `<small>too small to walk through: they're hacking it wider</small><i class="bar"><b></b></i>${atk}` : '';
  if (!h.exact) return ['label bad', `No Masterpiece now<small>board it over to close it</small>${breach}`];
  if (left.length === 5) return ['label', `Needs ${an(C.identify(left))}${breach}`];
  if (left.length === 10) {
    const list = C.combos(left).map((c) => c.letters.join('+'));
    return ['label', `Two pieces<small>${list.slice(0, 3).join(' · ')}${list.length > 3 ? ' · …' : ''}</small>${breach}`];
  }
  return ['label', `${left.length / 5} pieces${breach}`];
}
function frameLabel(f) {
  const left = f.open;
  const need = left.length === 5 && f.exact ? `needs ${an(C.identify(left))}` : f.exact ? `room for ${left.length / 5} more pieces` : f.kind === 'stair' ? `${left.length} squares left: any piece will do` : `${left.length} squares left: any piece, the spare's sawn off`;
  return ['label deck', `${{ stair: 'Stairs up to the wall', gun: `Gun tower frame (${['back', 'middle', 'front'][f.part]})`, house: `Your shack: the ${HOUSE_PART[f.part]}` }[f.kind] || 'Wall-walk frame'}<small>${need}</small>`];
}
function updateStats() {
  $('s-gold').textContent = Math.max(0, G.gold);
  $('s-wave').textContent = G.wave;
  $('s-master').textContent = G.masters;
  $('s-board').textContent = G.boarded;
  $('s-turned').textContent = G.turned || 0;
  chestHeap.scale.y = 0.08 + 0.5 * Math.min(1, Math.max(0, G.gold) / 60);
}

// ---------- input ----------
addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (dress.open) { if (e.key === 'Escape') dressPanel(false); return; }
  const key = e.key.toLowerCase();
  if (paused) { if (['p', ' ', 'escape', 'enter'].includes(key)) { e.preventDefault(); setPaused(false); } return; }
  if (key === 'p' && !deco.on) { setPaused(true); return; }
  if ([' ', 'tab', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) e.preventDefault();
  const arrow = { arrowleft: [0, -1], arrowright: [0, 1], arrowup: [-1, 0], arrowdown: [1, 0] }[key];
  const step = { a: [0, -1], d: [0, 1], w: [-1, 0], s: [1, 0] }[key];
  // Puzzle mode at the wall: WASD moves the piece a square (held down, it keeps going), the arrows
  // jump it to the next hole that way, Esc walks off.
  if (wm && !deco.on && !G.over) {
    if (key === 'escape') { exitWall(); return; }
    if (step || arrow) {
      mouseMode = false;
      if (carry && step) { wm.r += step[0]; wm.c += step[1]; clampCursor(); }
      else if (carry && !e.repeat) jumpHole(arrow);
      return;
    }
  } else if (arrow && !deco.on && !G.over && carry && canWallMode() && !nearFrame()) {
    enterWall();
    mouseMode = false;
    return;
  }
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) { keys.add(key); mouseMode = false; }
  if (key === 'z' || key === 'c') keys.add(key);
  if (deco.on) {
    if (key === 'escape' || key === 'b') decoMode(false);
    else if (key === 'q' || key === 'e') decoTurn(key === 'e' ? 1 : -1);
    return;
  }
  if (e.repeat || G.over) return;
  if (key === ' ' || key === 'enter') act();
  else if (key === 'q' && carry) turn(rotCCW, 1);
  else if (key === 'e' && carry) turn(rotCW, -1);
  else if ((key === 'q' || key === 'e') && onGunDeck()) turnArrowAhead(key === 'e' ? 1 : 3);
  else if (key === 'f' && carry) turn(flip, 0);
  else if (key === 'b') decoMode(true);
  else if (['1', '2', '3'].includes(key)) takeCrate(Number(key) - 1);
  else if (key === 'backspace' && canTakeBack()) takeBack();
  else if ((key === 'shift' || key === 'r') && carry && aimFoe()) throwAt(aimFoe());
  else if (key === 'v') Object.assign(view, { yaw: 0, pitch: 0, zoom: 1 });
  else if (key === '-' || key === '_') view.zoom = Math.min(2, view.zoom * 1.15);
  else if (key === '=' || key === '+') view.zoom = Math.max(0.55, view.zoom / 1.15);
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
const ray = new THREE.Raycaster(), wallPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
// The gun deck square under the pointer, if you're up there.
function deckCellAt(x, y) {
  if (!gd || pirate.h < 0.3) return null;
  ray.setFromCamera(new THREE.Vector2(x / innerWidth * 2 - 1, -y / innerHeight * 2 + 1), camera);
  const p = new THREE.Vector3();
  return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -(ramp.T + 0.05)), p) ? gdCell(p.x, p.z) : null;
}
/* Where the pointer is on the wall grid, at depth z. Boards behind a hole stand out from the stone
   towards you, and the camera looks down on them, so a board is matched to the pointer at its own
   depth, or it'd snap a square or two away from where you're pointing. */
function mouseAt(z) {
  if (!z || !mouse.ray) return mouse;
  let m = mouse.at.get(z);
  if (!m) {
    const p = new THREE.Vector3();
    m = mouse.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), -z), p) ? { fc: p.x / S + wall.W / 2, fr: wall.H - p.y / S } : mouse;
    mouse.at.set(z, m);
  }
  return m;
}
renderer.domElement.addEventListener('mousemove', (e) => {
  if (deco.on) { decoMove(e); return; }
  ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1), camera);
  const p = new THREE.Vector3();
  // A rampart frame you're pointing at (the nearest, if one's in front of another), else the wall.
  let best = null;
  if (pirate.h < 0.3 && !wm) for (const f of frames()) {
    if (!ray.ray.intersectPlane(f.plane, p)) continue;
    const l = f.group.worldToLocal(p.clone()), fc = l.x / S, fr = -l.y / S, d = p.distanceTo(ray.ray.origin);
    if (fc < -1.2 || fc > f.b.w + 1.2 || fr < -1.2 || fr > f.b.h + 1.2) continue;
    if (!best || d < best.d) best = { d, frame: f, fc, fr };
  }
  if (best) { mouse = best; mouseMode = true; return; }
  if (gd) { gd.hover = deckCellAt(e.clientX, e.clientY); ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1), camera); }
  if (!ray.ray.intersectPlane(wallPlane, p)) { mouse = null; return; }
  const fc = p.x / S + wall.W / 2, fr = wall.H - p.y / S;
  mouse = fc >= -1 && fc <= wall.W + 1 && fr >= -1 && fr <= wall.H + 1 ? { fc, fr, ray: ray.ray.clone(), at: new Map() } : null;
  if (mouse) mouseMode = true;
});
addEventListener('mousemove', (e) => { cursor = { x: e.clientX, y: e.clientY }; });
document.addEventListener('mouseleave', () => { cursor = null; });
// Left click: throw at the raider you clicked on, otherwise pick up / fit. Right-drag turns the
// camera; a right click without dragging flips the piece.
let drag = null;
renderer.domElement.addEventListener('mousedown', (e) => {
  if (deco.on) { if (e.button === 2) drag = { x: e.clientX, y: e.clientY, moved: false, deco: e }; else decoClick(e); return; }
  if (e.button === 2) { drag = { x: e.clientX, y: e.clientY, moved: false }; return; }
  if (e.button !== 0 || G.over) return;
  // Up on the rampart there's nothing to fit, so a click anywhere throws at the raider nearest it.
  // In puzzle mode a click only ever fits the piece (raiders show through the holes, so it used to throw).
  const r = carry && !wm && clickedFoe(e.clientX, e.clientY, pirate.h > 0.3 ? 1e4 : 90);
  if (r) throwAt(r);
  else if (!carry && onGunDeck() && (gd.hover = deckCellAt(e.clientX, e.clientY))) gd.press = { r: gd.hover[0], c: gd.hover[1], x: e.clientX, y: e.clientY };
  else act();
});
addEventListener('mousemove', (e) => {
  if (!drag || !(e.buttons & 2)) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
  if (!drag.moved) return;
  view.yaw -= dx * 0.006;
  view.pitch = Math.max(-0.35, Math.min(0.9, view.pitch + dy * 0.004));
  drag.x = e.clientX; drag.y = e.clientY;
});
addEventListener('mouseup', (e) => {
  if (e.button === 0 && gd?.press) chalkRelease(e.clientX, e.clientY);
  if (e.button !== 2 || !drag) return;
  if (drag.deco) { if (!drag.moved) decoClick(drag.deco); drag = null; return; }
  if (!drag.moved && carry && !G.over) turn(flip, 0);
  else if (!drag.moved && !carry && onGunDeck() && (gd.hover = deckCellAt(e.clientX, e.clientY)) && gd.arrows.has(k(...gd.hover))) chalk(...gd.hover, -1);
  drag = null;
});
// The wheel turns the piece while it's showing a spot to fit it, or your chalk on the gun deck; otherwise it zooms.
let wheelAcc = 0, wheelT = 0;
renderer.domElement.addEventListener('wheel', (e) => {
  if (deco.on) {
    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) >= 40) { decoTurn(wheelAcc > 0 ? 1 : -1); wheelAcc = 0; }
    return;
  }
  // On the gun deck the wheel turns your chalk, as in Gunnery, and never zooms.
  if (!carry && onGunDeck() && !G.over) {
    wheelAcc += e.deltaY;
    const now = performance.now();
    gd.hover = deckCellAt(e.clientX, e.clientY);
    if (Math.abs(wheelAcc) >= 40 && now - wheelT > 110) { wheelDeck(wheelAcc > 0 ? 1 : -1); wheelAcc = 0; wheelT = now; }
    return;
  }
  if (carry && target && !G.over) {
    wheelAcc += e.deltaY;
    const now = performance.now();
    if (Math.abs(wheelAcc) >= 40 && now - wheelT > 110) {
      if (wheelAcc > 0) turn(rotCW, -1); else turn(rotCCW, 1);
      wheelAcc = 0; wheelT = now;
    }
    return;
  }
  wheelAcc = 0;
  view.zoom = Math.max(0.55, Math.min(2, view.zoom * (e.deltaY > 0 ? 1.1 : 1 / 1.1)));
}, { passive: true });
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
$('again').onclick = () => newGame();

// ---------- actions ----------
function nearest(list, r) {
  let best = null, bd = r;
  for (const o of list) { const d = Math.hypot(o.x - pirate.x, o.z - pirate.z); if (d < bd) { bd = d; best = o; } }
  return best;
}
function focus() {
  const p = nearest(piles, 1.55);
  if (p) return { kind: 'pile', p };
  return { kind: 'wall' };
}
/* The raider a thrown piece would hit: the nearest one loose in the den, or else (R only) one at the
   wall outside, lobbed over the top. Throwing at a raider is the only way to get rid of a piece. */
const THROW_RANGE = 10;
const free = (r) => r.state !== 'down' && !r.targeted;
const foe = () => nearest(raiders.filter((r) => r.inside && free(r)), THROW_RANGE);
const atWall = (r) => !r.inside && free(r) && (r.state === 'attack' || r.state === 'dazed' || (r.state === 'approach' && r.z > -6));
const outsideFoe = () => (onRampart() ? nearest(raiders.filter(atWall), THROW_RANGE + 3) : null);
const anyFoe = () => foe() || outsideFoe();
// The throwable raider nearest a point on screen (within `cap` pixels), measured to the whole body
// from feet to the ⚔ marker, so clicking the marker or the raider both count.
const toScreen = (x, y, z) => { v3.set(x, y, z).project(camera); return v3.z > 1 ? null : [(v3.x + 1) / 2 * innerWidth, (1 - v3.y) / 2 * innerHeight]; };
function clickedFoe(mx, my, cap = 90) {
  let best = null, bd = cap;
  for (const r of raiders) {
    if (!(r.inside ? free(r) : onRampart() && atWall(r))) continue;
    if (Math.hypot(r.x - pirate.x, r.z - pirate.z) > (r.inside ? THROW_RANGE : THROW_RANGE + 3)) continue;
    // The ⚔ marker counts too, even pinned to the screen edge for a raider out of view.
    let d = r.mark.style.display === 'none' || !r.mark.style.left ? 1e9 : Math.hypot(parseFloat(r.mark.style.left) - mx, parseFloat(r.mark.style.top) - 17 - my);
    const a = toScreen(r.x, 0.1, r.z), b = toScreen(r.x, 2.3, r.z);
    if (a && b) {
      const ex = b[0] - a[0], ey = b[1] - a[1], t = Math.max(0, Math.min(1, ((mx - a[0]) * ex + (my - a[1]) * ey) / (ex * ex + ey * ey || 1)));
      d = Math.min(d, Math.hypot(a[0] + ex * t - mx, a[1] + ey * t - my));
    }
    if (d < bd) { bd = d; best = r; }
  }
  return best;
}
// Who Shift (or Space on the rampart) throws at: the raider by the mouse pointer if there is one,
// otherwise the nearest. Worked out every frame and ringed in gold so you can see it.
let cursor = null, aimed = null;
const aimFoe = () => (cursor && clickedFoe(cursor.x, cursor.y, 160)) || anyFoe();
function act() {
  if (net.pending || net.asking) return;   // waiting to hear back about the last one
  const f = focus();
  if (pirate.h > 0.3) {
    if (carry && onRampart() && aimFoe()) throwAt(aimFoe());
    else if (!carry && onGunDeck()) chalkAhead();
    return;
  }
  if (f.kind === 'pile') {
    const p = f.p;
    if (!carry && p.letter) return pickUp(p);
    if (carry && carry.from === p && !p.letter) return putBack();
    if (carry && p.letter && carry.from) { putBack(); return pickUp(p); }
  } else if (!carry && liftable()) return lift(liftable());
  else if (!carry && canTakeBack()) return takeBack();
  else if (!carry && atPlot() && houseState() === 'plot') return startHouse();
  else if (!carry && atPlot() && houseState() === 'built') return dressPanel(true, 'den', 'house');
  else if (carry && target?.ok) return place(target);
  else if (carry && target) shake = 0.2;
}
function pickUp(p) {
  $('intro').classList.add('off');
  lastPlaced = null;
  if (guest()) { net.asking = true; return send('host', { t: 'crate', i: piles.indexOf(p) }); }
  const m = woodMat(p.letter).clone();
  m.transparent = true;
  carry = { letter: p.letter, cells: p.cells, from: p, mat: m, group: centred(p.cells, m), lift: 0 };
  const g = carry.group;
  g.position.copy(p.group.position);
  g.rotation.x = -Math.PI / 2;
  g.scale.setScalar(0.38);
  scene.add(g);
  scene.remove(p.group);
  p.group = null; p.letter = null;
  tween(0.25, (t) => { if (carry?.group === g) carry.lift = t; });
}
function putBack() {
  const p = carry.from;
  if (guest()) {
    send('host', { t: 'putback', i: piles.indexOf(p), letter: carry.letter, cells: carry.cells });
    scene.remove(carry.group);
    carry = null;
    return;
  }
  p.letter = carry.letter; p.cells = carry.cells;
  scene.remove(carry.group);
  carry = null;
  showPile(p);
}
function turn(fn, dir) {
  carry.cells = fn(carry.cells);
  const old = carry.group;
  const g = centred(carry.cells, carry.mat);
  g.position.copy(old.position);
  scene.remove(old);
  scene.add(g);
  carry.group = g;
  carry.spin = dir ? dir * Math.PI / 2 : 0;
  carry.flipT = dir ? 1 : 0;
  cycle = 0;
  clampCursor();
}
/* Fitting a piece: yours (from your hands), or a crewmate's (`by`, with `hand` made at their
   head). A guest asks the host first; the piece waits in the air until the answer comes. */
function place(t, by = myId(), hand = carry) {
  if (guest() && hand === carry) {
    net.pending = carry;
    carry = null;
    return send('host', { t: 'place', hole: t.hole, frame: t.frame?.i, dr: t.dr, dc: t.dc, patch: !!t.patch, letter: hand.letter, shape: hand.cells, pile: piles.indexOf(hand.from) });
  }
  return t.frame ? placeFrame(t, by, hand) : placeWall(t, by, hand);
}
// A piece in the wall, where it ends up: a clean fit sits flush in the hole; a board nailed over
// the stone sticks out in front of it; boards behind stack up on the den side.
function putPiece(h, i) {
  const over = i.over > 0;
  const g = pieceGroup(i.shape, woodMat(i.letter));
  if (i.patch) g.scale.z = PATCH_D / WOOD_D;
  const to = new THREE.Vector3(X(i.dc), Y(i.dr), i.patch ? patchZ(i.layer, h) : over ? WOOD_D - 0.12 : -0.04);
  g.position.copy(to);
  wallGroup.add(g);
  const cells = i.shape.map(([r, c]) => k(r + i.dr, c + i.dc));
  if (i.patch) cells.forEach((kk) => wall.lining[i.layer].add(kk));
  else cells.forEach((kk) => { wall.wood.add(kk); if (h.set.has(kk)) h.filled.add(kk); });
  const b = C.bbox(i.shape);
  const piece = { group: g, cells, over, patch: !!i.patch, base: to.clone(), cx: to.x + b.w * S / 2, by: i.by, info: i, undo: null };
  if (i.patch) { piece.layer = i.layer; h.lay[i.layer] ||= { hp: 0, maxHp: 1, status: 'open' }; }
  h.pieces.push(piece);
  return piece;
}
function placeWall(t, by, hand) {
  const h = wall.holes[t.hole];
  const info = { letter: hand.letter, shape: hand.cells, dr: t.dr, dc: t.dc, over: t.over, patch: !!t.patch, layer: t.layer ?? 0, by };
  const from = hand.group.position.clone();
  scene.remove(hand.group);
  if (hand === carry) carry = null;
  const undo = { h, letter: info.letter, shape: info.shape, prev: { status: h.status, hp: h.hp, maxHp: h.maxHp }, prevLay: h.lay[info.layer] ? { ...h.lay[info.layer] } : null, boarded: G.boarded, masters: G.masters, hpAfter: null };
  const piece = undo.piece = putPiece(h, info);
  piece.undo = undo;
  if (by === myId()) lastPlaced = undo;
  if (isHost()) send('all', { t: 'place', hole: t.hole, ...info });
  const g = piece.group, to = piece.base.clone(), b = C.bbox(info.shape);
  const off = new THREE.Vector3(-b.w * S / 2, b.h * S / 2, 0);
  const wasExact = h.exact;
  h.busy = (h.busy || 0) + 1;
  tween(0.32, (s) => {
    const e = 1 - (1 - s) ** 3;
    g.position.lerpVectors(from.clone().add(off), to, e);
    g.position.z += Math.sin(s * Math.PI) * 0.6;
  }, () => {
    h.busy--;
    g.position.copy(to);
    if (!h.pieces.includes(piece)) return;   // knocked out while it was flying in
    if (piece.patch) {
      layerAdd(h, info.layer);
      undo.hpAfter = h.lay[info.layer]?.hp ?? 0;
      burst(new THREE.Vector3(to.x + b.w * S / 2, to.y - b.h * S / 2, to.z + 0.1), '#ffe0a0', 10, 2.5);
      h.sig = '';
      return;
    }
    updateHole(h);
    if (h.status === 'open') { h.hp += HP.piece; h.maxHp = h.hp; }
    undo.hpAfter = h.hp;
    if (h.status === 'master' && lastPlaced === undo) lastPlaced = null;   // a Masterpiece is never a misclick
    if (by === myId() && h.status === 'open' && wasExact && !h.exact) { shake = 0.3; toast('No Masterpiece in that hole now · Space: take it back', true); }
  });
  refill(hand.from);
}
/* Taking back a misplaced piece: with empty hands at the wall, the last piece you put up comes
   back off, as it was, so you can nudge it into the right spot. Not once it's made a Masterpiece,
   once anything has gone on top of it, or once you've picked up another piece. Damage the hole took
   meanwhile stays taken. */
let lastPlaced = null;
function canTakeBack() {
  const u = lastPlaced;
  if (!u || carry || u.hpAfter === null || pirate.h > 0.3) return false;
  if (u.frame) return !u.frame.done && u.frame.pieces[u.frame.pieces.length - 1] === u.piece && Math.hypot(u.piece.cx - pirate.x, u.piece.cz - pirate.z) <= REACH + 1.2;
  if (pirate.z > WALL_Z + 2.5) return false;   // (as far back as you can put one)
  if (u.h.pieces[u.h.pieces.length - 1] !== u.piece || (!u.piece.patch && u.h.status === 'master') || (u.piece.patch && u.h.lay[u.piece.layer]?.status === 'master')) return false;
  return Math.abs(u.piece.cx - pirate.x) <= MREACH;
}
// A piece in an unfinished frame you could lift back out: the one under the pointer, or (keyboard)
// the nearest within reach. Anyone's, as everyone builds together.
function liftable() {
  if (carry || pirate.h > 0.3) return null;
  if (mouseMode) {
    const m = mouse?.frame && mouse;
    if (!m || m.frame.done) return null;
    const kk = k(Math.floor(m.fr), Math.floor(m.fc)), pi = m.frame.pieces.findIndex((p) => p.cells.includes(kk));
    return pi < 0 || Math.hypot(m.frame.pieces[pi].cx - pirate.x, m.frame.pieces[pi].cz - pirate.z) > REACH + 1.2 ? null : { f: m.frame, pi };
  }
  let best = null, bd = REACH;
  for (const f of frames()) f.pieces.forEach((p, pi) => { const d = Math.hypot(p.cx - pirate.x, p.cz - pirate.z); if (d < bd && (f.kind === 'stair' || pirate.z > WALL_Z)) { bd = d; best = { f, pi }; } });
  return best;
}
function lift(l) {
  if (guest()) return send('host', { t: 'takeback', frame: l.f.i, pi: l.pi });
  unplace(l.f, myId(), true, l.pi);
}
function takeBack() {
  const u = lastPlaced, where = u.frame || u.h;
  lastPlaced = null;
  if (guest()) return send('host', { t: 'takeback', hole: u.frame ? undefined : wall.holes.indexOf(where), frame: u.frame?.i });
  unplace(where, u.piece.by, true);
}
// Off comes the last piece in a hole or frame, put back as it was before. Whoever put it there
// gets it back in their hands. From a frame, any piece can be lifted (`pi`), by anyone: it goes
// into the hands of whoever lifted it (`by`).
function unplace(where, by, mine = by === myId(), pi = null) {
  const frame = !!where.occ, at0 = pi != null && frame ? pi : where.pieces.length - 1;
  const piece = where.pieces[at0];
  if (!piece || (pi == null && piece.by !== by) || (frame && where.done)) return;
  const u = piece.undo, b = C.bbox(piece.info.shape);
  where.pieces.splice(at0, 1);
  let at;
  if (frame) {
    piece.cells.forEach((kk) => { where.occ.delete(kk); where.filled.delete(kk); });
    frameState(where);
    at = piece.group.localToWorld(new THREE.Vector3(b.w * S / 2, -b.h * S / 2, 0));
    where.group.remove(piece.group);
  } else {
    const h = where;
    if (piece.patch) {
      const L = h.lay[piece.layer];
      if (L && u && u.hpAfter !== null) {
        const dmg = Math.max(0, u.hpAfter - L.hp);
        if (L.status !== 'open') { G.gold -= PAY[L.status]; G.boarded = u.boarded; G.masters = u.masters; }
        if (u.prevLay) Object.assign(L, u.prevLay, { hp: Math.max(0, u.prevLay.hp - dmg) });
      }
      relining();
    } else {
      piece.cells.forEach((kk) => { wall.wood.delete(kk); h.filled.delete(kk); });
      if (u && u.hpAfter !== null) {
        const dmg = Math.max(0, u.hpAfter - h.hp);
        if (h.status === 'boarded') { G.gold -= PAY.boarded; G.boarded = u.boarded; }
        h.status = u.prev.status;
        h.maxHp = u.prev.maxHp;
        h.hp = Math.max(0, u.prev.hp - dmg);
      }
    }
    updateHole(h);
    at = new THREE.Vector3();
    piece.group.getWorldPosition(at);
    at.x += b.w * S / 2; at.y -= b.h * S / 2;
    wallGroup.remove(piece.group);
  }
  if (lastPlaced?.piece === piece) lastPlaced = null;
  if (isHost()) send('all', { t: 'unplace', hole: frame ? undefined : wall.holes.indexOf(where), frame: frame ? where.i : undefined, by, pi: pi ?? undefined });
  if (mine) holdPiece(piece.info.letter, piece.info.shape, null, at);
}
// Into your hands, lifting from `at`: a piece from a crate (`from`), or one taken back off.
function holdPiece(letter, cells, from, at) {
  const m = woodMat(letter).clone();
  m.transparent = true;
  carry = { letter, cells, from, mat: m, group: centred(cells, m), lift: 0 };
  const g = carry.group;
  g.position.copy(at);
  g.rotation.x = -Math.PI / 2;
  g.scale.setScalar(0.38);
  scene.add(g);
  tween(0.25, (t) => { if (carry?.group === g) carry.lift = t; });
  ghostKey = null;
}
/* A crate restocks itself after a piece is used. Fitting one is quick; a thrown piece is timber
   gone for good, so that crate takes a few seconds to restock (restockSecs), or you could stand and
   pelt raiders forever. */
// (8 seconds felt a touch slow, more so with a crew sharing the three crates: 7 on your own, about
// 0.6 less for each crewmate, so 5.2 with four. The user asked for marginally faster, not a lot.)
const restockSecs = () => 7 - 0.6 * (Math.min(4, crewSize()) - 1);
function refill(p, secs = 0.45) {
  if (!p || guest()) return;   // a piece taken back off the wall has no crate to refill; the host deals
  p.wait = p.waitFull = secs;
  clearTimeout(p.timer);
  p.timer = setTimeout(() => {
    p.wait = 0;
    if (p.letter || carry?.from === p) return;   // dealt afresh meanwhile (a new game)
    deal(p); showPile(p);
    const g = p.group, s0 = g.scale.x;
    tween(0.3, (s) => g.scale.setScalar(s0 * (1 - (1 - s) ** 3)));
  }, secs * 1000);
}
// Hurl the carried piece at a raider. It always flies true, but the piece is spent.
function throwAt(r, hand = carry, by = myId()) {
  const g = hand.group, pile = hand.from, color = WOOD[hand.letter];
  if (hand.mat) { hand.mat.opacity = 1; hand.mat.depthWrite = true; }
  if (hand === carry) carry = null;
  r.targeted = true;
  if (by === myId()) {
    pirate.bonkT = 0.3;
    pirate.g.rotation.y = Math.atan2(r.x - pirate.x, r.z - pirate.z);
    if (guest()) send('host', { t: 'throw', rid: r.id, letter: hand.letter, shape: hand.cells, pile: piles.indexOf(pile) });
  }
  if (isHost()) send('all', { t: 'throw', rid: r.id, letter: hand.letter, shape: hand.cells, by });
  const from = g.position.clone(), d = Math.hypot(r.x - from.x, r.z - from.z);
  const to = new THREE.Vector3(r.x, 1.1, r.z);
  const over = !r.inside, dur = 0.25 + d * 0.05 + (over ? 0.3 : 0);
  let arc = 0.5 + d * 0.12;
  if (over) {
    // Over the wall: aim where the raider will be when it lands (at the foot of the wall at the
    // nearest), and lob high enough to clear the whole thickness of the wall on the way.
    if (r.state === 'approach') {
      const tx = passable(r.hole) ? doorX(r.hole) : hackX(r.hole, r.slot), dx = tx - r.x, dz = -1.15 - r.z, n = Math.hypot(dx, dz);
      const step = Math.min(n, 2.2 * dur);
      if (n > 0) to.set(r.x + dx / n * step, 1.1, r.z + dz / n * step);
    }
    to.z = Math.min(to.z, -1.15);
    const top = wall.H * S + 0.6;
    for (let s = 0.02; s < 1; s += 0.02) {
      const z = from.z + (to.z - from.z) * s;
      if (Math.abs(z) < 0.9) arc = Math.max(arc, (top - (from.y + (to.y - from.y) * s)) / Math.sin(Math.PI * s));
    }
  }
  tween(dur, (s) => {
    if (!over) to.set(r.x, 1.1, r.z);
    g.position.lerpVectors(from, to, s);
    g.position.y += Math.sin(s * Math.PI) * arc;
    g.rotation.x = s * 9; g.rotation.z = s * 5;
  }, () => { scene.remove(g); hit(r, from, color); });
  refill(pile, restockSecs());
}
function hit(r, from, color) {
  burst(new THREE.Vector3(r.x, 1.1, r.z), color, 22, 4.5);
  r.targeted = false;
  if (guest() || r.state === 'down' || r.gone) return;   // the host says what happened to them
  const dx = r.x - from.x, dz = r.z - from.z, n = Math.hypot(dx, dz) || 1;
  r.state = 'down'; r.t = 0; r.outside = !r.inside;
  r.kv = new THREE.Vector3(dx / n * 5.5, 5, dz / n * 5.5);
  G.bonked++;
  G.gold += PAY.bonk;
  burst(new THREE.Vector3(r.x, 1.6, r.z), '#ffe27a', 12, 3);
  if (r.loot) { G.gold += PAY.steal; r.loot.visible = false; r.loot = null; say('Thwack! Loot recovered'); } else say('Thwack!');
  shake = 0.35;
  updateStats();
}
function breakHole(h) {
  if (isHost()) send('all', { t: 'break', hole: wall.holes.indexOf(h) });
  const boards = boardsOf(h);
  h.pieces.filter((p) => !p.patch).forEach(({ group: g, cells }) => {
    cells.forEach((kk) => wall.wood.delete(kk));
    // With boards behind it, the wood falls out the far side instead of into the den.
    const v = new THREE.Vector3((Math.random() - 0.5) * 2, 2 + Math.random(), (boards.length ? -1 : 1) * (2.5 + Math.random() * 1.5));
    const p0 = g.position.clone();
    tween(0.8, (s) => { g.position.set(p0.x + v.x * s, p0.y + v.y * s - 9 * s * s, p0.z + v.z * s); g.rotation.x = s * 3; }, () => wallGroup.remove(g));
  });
  h.pieces = boards;
  h.filled.clear();
  h.status = 'open';
  h.hp = 0;
  updateHole(h);
  burst(new THREE.Vector3(holeX(h), holeMidY(h), 0.3), '#c98a45', 24, 4);
  shake = 0.5;
  reel(h);
  toast(boards.length ? 'Through the hole! Only the boards behind it hold them now' : 'They broke through!', true);
}
/* A hole's wood comes out a piece at a time, the last one put in first (as in the real puzzle, where
   a neglected hole loses its most recently placed piece). Each piece holds an equal share of the
   hole's strength, so a Masterpiece of three pieces loses one every 15 seconds of hacking. The gap a
   piece leaves is too small to walk through, so there's a chance to put one back; doing that
   finishes the hole again, and only the share that fell is made good. The user found a whole hole's
   wood falling out in one go frustrating. */
const ownWood = (h) => h.pieces.filter((p) => !p.patch);
const nextOut = (h) => { const n = ownWood(h).length; return n > 1 ? h.maxHp * (n - 1) / n : 0; };
function dropPiece(h) {
  const own = ownWood(h), p = own[own.length - 1];
  if (own.length <= 1) return breakHole(h);
  if (isHost()) send('all', { t: 'drop', hole: wall.holes.indexOf(h) });
  h.pieces = h.pieces.filter((x) => x !== p);
  p.cells.forEach((kk) => { wall.wood.delete(kk); h.filled.delete(kk); });
  const g = p.group, p0 = g.position.clone(), out = boardsOf(h).length ? -1 : 1;
  const v = new THREE.Vector3((Math.random() - 0.5) * 2, 2 + Math.random(), out * (2.5 + Math.random() * 1.5));
  tween(0.8, (s) => { g.position.set(p0.x + v.x * s, p0.y + v.y * s - 9 * s * s, p0.z + v.z * s); g.rotation.x = s * 3; }, () => wallGroup.remove(g));
  h.maxHp *= (own.length - 1) / own.length;
  h.hp = Math.min(h.hp, h.maxHp);
  h.status = 'open';
  if (lastPlaced?.piece === p) lastPlaced = null;
  updateHole(h);
  burst(new THREE.Vector3(p.cx, holeMidY(h), 0.3), '#c98a45', 16, 3.5);
  shake = 0.3;
  toast(`They knocked ${an(p.info.letter)} out! Put one back before they're through`, true);
}
// A layer behind comes apart the same way as the hole: a piece at a time, the last one in first.
function layerNextOut(h, i) { const n = layerPieces(h, i).length, L = h.lay[i]; return n > 1 ? L.maxHp * (n - 1) / n : 0; }
function dropBoard(h, i, out) {
  const ps = layerPieces(h, i), p = ps[ps.length - 1], L = h.lay[i];
  if (!p) return;
  if (ps.length > 1) {
    L.maxHp *= (ps.length - 1) / ps.length;
    L.hp = Math.min(L.hp, L.maxHp);
    L.status = 'open';
  }
  if (lastPlaced?.piece === p) lastPlaced = null;
  breakBoard(h, p, out);
  toast(ps.length > 1 ? `They knocked ${an(p.info.letter)} out of the layer behind!` : 'Through a layer behind!', true);
}
function breakBoard(h, p) {
  if (isHost()) send('all', { t: 'unboard', hole: wall.holes.indexOf(h), i: h.pieces.indexOf(p) });
  h.pieces = h.pieces.filter((x) => x !== p);
  const g = p.group, p0 = g.position.clone(), v = new THREE.Vector3((Math.random() - 0.5) * 2, 1.5 + Math.random(), 2.5 + Math.random());
  tween(0.8, (s) => { g.position.set(p0.x + v.x * s, p0.y + v.y * s - 9 * s * s, p0.z + v.z * s); g.rotation.x = s * 3; }, () => wallGroup.remove(g));
  relining();
  updateHole(h);
  burst(new THREE.Vector3(holeX(h), holeMidY(h), patchZ(0, h)), '#c98a45', 16, 3.5);
  shake = 0.3;
  reel(h);
  toast(h.pieces.length ? 'They hacked through a board!' : 'They broke through!', true);
}
const holeX = (h) => X(h.b.c0) + h.b.w * S / 2;
const holeMidY = (h) => Y(h.b.r0) - h.b.h * S / 2;
const holeFootY = (h) => Y(h.b.r1 + 1);

function masterpiece(h) {
  toast('Masterpiece! Strong as iron');
  const glow = new THREE.Color('#ffcf4a');
  h.pieces.forEach(({ group }) => group.traverse((o) => {
    if (!o.isMesh) return;
    o.material = o.material.clone();
    tween(1.2, (s) => { o.material.emissive = glow; o.material.emissiveIntensity = 0.8 * (1 - s); });
  }));
  for (let i = 0; i < 3; i++) burst(new THREE.Vector3(X(h.b.c0) + Math.random() * h.b.w * S, Y(h.b.r0) - Math.random() * h.b.h * S, 0.2), '#ffd45a', 14, 3);
}
const sparkGeo = new THREE.TetrahedronGeometry(0.07);
const sparkMats = {};
function burst(at, color, n, speed) {
  const m = (sparkMats[color] ||= new THREE.MeshBasicMaterial({ color }));
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(sparkGeo, m);
    s.position.copy(at);
    s.userData.v = new THREE.Vector3((Math.random() - 0.5) * speed, Math.random() * speed, (Math.random() - 0.2) * speed);
    s.userData.life = 0.9 + Math.random() * 0.4;
    scene.add(s);
    sparks.push(s);
  }
}
let toastTimer;
function toast(text, bad = false, warn = false) {
  const t = $('toast');
  t.textContent = text;
  t.className = 'toast on' + (bad ? ' bad' : '');
  t.style.color = warn ? '#ffc46b' : '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 1800);
}
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
function tween(dur, step, done) { tweens.push({ t: 0, dur, step, done }); }

// ---------- raiders ----------
// Only an empty hole with a gap at the floor big enough to walk through lets raiders in; anything
// with wood in it has to be hacked open first, and a smaller or higher one hacked wider (WEAK).
const bareHole = (h) => h.status === 'open' && !h.pieces.length && !(h.rubble > 0);
const passable = (h) => bareHole(h) && (h.door != null || !!h.hop);
const weakSpot = (h) => bareHole(h) && !passable(h);
const doorX = (h) => (h.door != null ? X(h.door) + DOOR_W * S / 2 : holeX(h));
// Where a raider stands to hack at a hole: in its doorway if it has one (rubble or wood in it), else
// spread along the hole.
const hackX = (h, slot) => (h.door != null ? doorX(h) + slot * 0.4 : holeX(h) + slot);
/* The squares a weak spot gives way into: a gap DOOR_W wide down to the floor below the hole, plus a
   few more next to it so the whole thing is still whole pieces' worth and can be filled exactly.
   Only solid stone, kept a square clear of the gate, the other holes and the stairs at the ends. */
function widenCells(h) {
  const H = wall.H;
  const free = (r, c) => {
    const kk = k(r, c);
    if (h.set.has(kk) || r < 1 || r >= H || c < 3 || c > wall.W - 4 || !wall.stoneAt.has(kk) || wall.wood.has(kk)) return false;
    for (let a = -1; a <= 1; a++) for (let z = -1; z <= 1; z++) {
      const nk = k(r + a, c + z), o = wall.cellHole.get(nk);
      if (wall.gate.has(nk) || (o !== undefined && wall.holes[o] !== h)) return false;
    }
    return true;
  };
  // Left-hand columns of the gap to try, under the hole's lowest squares first.
  const starts = [];
  for (let a = h.b.c0 - 1; a <= h.b.c1; a++) starts.push(a);
  const lowAt = (x) => h.cells.reduce((m, [r, c]) => (c === x ? Math.max(m, r) : m), -1);
  starts.sort((a, z) => Math.max(lowAt(z), lowAt(z + 1)) - Math.max(lowAt(a), lowAt(a + 1)) || Math.random() - 0.5);
  // Of the ways it could give way, the one the common pieces fill best (see roomyShapes).
  let best = null, bestW = -1;
  for (let tries = 0; tries < 30; tries++) {
    const a = starts[tries % starts.length], add = new Set();
    let good = lowAt(a) >= 0 || lowAt(a + 1) >= 0;
    for (let x = a; good && x < a + DOOR_W; x++) {
      const low = lowAt(x);
      for (let r = Math.min(H - DOOR_H, low + 1); r < H; r++) {
        if (h.set.has(k(r, x))) continue;
        if (!free(r, x)) { good = false; break; }
        add.add(k(r, x));
      }
    }
    if (!good) continue;
    let need = (5 - (h.set.size + add.size) % 5) % 5;
    while (need > 0) {
      const opts = [];
      for (const kk of add) {
        const [r, c] = kk.split(',').map(Number);
        for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nk = k(r + dr, c + dc);
          if (!add.has(nk) && free(r + dr, c + dc)) opts.push([r + dr, c + dc, r + dr + Math.random() * 2.5]);
        }
      }
      if (!opts.length) break;
      opts.sort((p, q) => q[2] - p[2]);
      add.add(k(opts[0][0], opts[0][1]));
      need--;
    }
    if (need) continue;
    const added = [...add].map((kk) => kk.split(',').map(Number));
    if (!C.solve([...h.cells, ...added], 1).length) continue;
    const w = commonWays([...h.cells, ...added]);
    if (w > bestW) { best = added; bestW = w; }
  }
  return best;
}
// The weak spot gives way: the stone round it falls out and it's a gap they can walk through.
function widen(h, cells) {
  if (isHost()) send('all', { t: 'widen', hole: wall.holes.indexOf(h), cells });
  if (!cells.length) { h.hop = true; return; }   // no room to widen it: they squeeze through as it is
  const zero = new THREE.Matrix4().makeScale(0, 0, 0), i = wall.holes.indexOf(h);
  for (const [r, c] of cells) {
    const kk = k(r, c), si = wall.stoneAt.get(kk);
    if (si !== undefined) { stones.setMatrixAt(si, zero); wall.stoneAt.delete(kk); }
    wall.cellHole.set(kk, i);
    h.set.add(kk);
    h.cells.push([r, c]);
    const chunk = rock(X(c) + S / 2, Y(r) - S / 2, -STONE_D / 2, 0.2);
    scene.add(chunk);
    const v = new THREE.Vector3((Math.random() - 0.5) * 2, 1 + Math.random() * 1.5, 1.5 + Math.random() * 2.5), p0 = chunk.position.clone();
    tween(0.9, (s) => { chunk.position.set(p0.x + v.x * s, Math.max(0.1, p0.y + v.y * s - 9 * s * s), p0.z + v.z * s); }, () => setTimeout(() => scene.remove(chunk), 4000));
  }
  stones.instanceMatrix.needsUpdate = true;
  h.b = C.bbox(h.cells);
  h.size = h.cells.length / 5;
  h.door = doorOf(h);
  if (h.door == null) h.hop = true;
  if (h.next) { wallGroup.remove(h.next); h.next = null; }
  if (h.rubbleG) { wallGroup.remove(h.rubbleG); h.rubbleG = null; }
  h.rubble = FALLEN;   // the stone that fell, choking the gap
  rubbleShow(h);
  holeOutline(h);
  wallBack();
  updateHole(h);
  burst(new THREE.Vector3(doorX(h), 0.8, 0.3), '#9a8a7a', 26, 4);
  shake = 0.5;
  reel(h);
  toast('The wall gave way, but the stone dazed them: plug it!', true);
}
// The raiders hacking at a hole when it gives way reel back from it, dazed.
function reel(h) {
  if (guest() || h.pieces.length) return;
  for (const r of raiders) if (r.hole === h && r.state === 'attack') { r.state = 'dazed'; r.t = 0; r.hitT = 0.2; }
}
/* Each raider goes for the hole in front of where they come up to the wall, not the weakest one
   along the whole of it: a breach only draws the raiders close to it (GAP_PULL metres). So one hole
   broken doesn't let the whole wave in, and the parts of the wall you've kept strong hold their own
   raiders off till they tire. */
const GAP_PULL = 3;
const gapNear = (x) => wall.holes.filter((h) => passable(h) && Math.abs(holeX(h) - x) <= GAP_PULL).sort((a, b) => Math.abs(holeX(a) - x) - Math.abs(holeX(b) - x))[0];
function pickHole(x) {
  return gapNear(x) || wall.holes.slice().sort((a, b) => Math.abs(holeX(a) - x) - Math.abs(holeX(b) - x))[0];
}
const SHIRTS = ['#59607a', '#2f6b4f', '#6b2f5e'], SCARVES = ['#2b2b2b', '#3a4a8a', '#7a1f1f'], BEARDS = ['#222', '#7a4a1a', '#999'];
let raiderSeq = 0;
function makeRaider(look, id, x, z) {
  const [sh, sc, pt, bd] = look;
  const m = makePirate({ shirt: ['#1f2433', SHIRTS[sh]], scarf: SCARVES[sc], trousers: '#5a4636', patch: !!pt, beard: BEARDS[bd], sword: true });
  m.g.scale.setScalar(0.82);
  const xr = addXray(m.g);
  const r = { id, look, m, xr, x, z, state: 'approach', hole: null, t: 0, stamina: RAIDER_STAMINA, hitT: 0.5, slot: 0, inside: false, loot: null };
  m.g.position.set(x, 0, z);
  scene.add(m.g);
  r.mark = document.createElement('div');
  r.mark.className = 'mark';
  r.mark.textContent = '⚔';
  $('labels').append(r.mark);
  raiders.push(r);
  return r;
}
function spawnRaider() {
  const x = (Math.random() - 0.5) * wall.W * S * 0.9;
  const r = makeRaider([rand(3), rand(3), Math.random() < 0.5 ? 1 : 0, rand(3)], ++raiderSeq, x, -14);
  r.hole = pickHole(x);
  r.slot = (Math.random() - 0.5) * 1.2;
}
function giveLoot(r) {
  r.loot = mesh(new THREE.SphereGeometry(0.16, 10, 8), mat('#e8b23a', { metalness: 0.7, roughness: 0.3 }));
  r.loot.position.set(0, -0.5, 0.1);
  r.m.arms[0].add(r.loot);
}
function moveTo(r, tx, tz, speed, dt) {
  const dx = tx - r.x, dz = tz - r.z, d = Math.hypot(dx, dz);
  if (d < 0.08) return true;
  const step = Math.min(d, speed * dt);
  r.x += dx / d * step; r.z += dz / d * step;
  faceTo(r.m, dx, dz, dt);
  return false;
}
function updateRaider(r, dt) {
  const h = r.hole;
  let moving = false;
  r.t += dt;
  switch (r.state) {
    case 'approach': {
      moving = !moveTo(r, passable(h) ? doorX(h) : hackX(h, r.slot), -1.15, 2.2, dt);
      if (!moving) { r.state = passable(h) ? 'climb' : 'attack'; r.t = 0; }
      break;
    }
    case 'attack': case 'hackOut': {
      // Hacking at the wood in a hole: from outside to get in, or from inside to get back out.
      const out = r.state === 'hackOut';
      if (passable(h)) { r.state = out ? 'climbOut' : 'climb'; r.t = 0; break; }
      const gap = !out && gapNear(r.x);   // the hole next along's been broken open: in that way
      if (gap) { r.hole = gap; r.slot = (Math.random() - 0.5) * 1.2; r.state = 'approach'; break; }
      faceTo(r.m, 0, out ? -1 : 1, dt);
      if (!out) r.stamina -= dt;
      // From outside: the hole's own wood, then the boards behind it, nearest first. A thief
      // inside hacks the other way.
      const fill = h.pieces.some((p) => !p.patch), li = !h.lay.length ? -1 : out ? h.lay.length - 1 : fill ? -1 : 0;
      const board = li >= 0 ? h.lay[li] : null;
      const rub = !out && h.rubble > 0 && !h.pieces.length;   // a fresh breach: clear the rubble first
      const hack = hackRate() * dt, weak = weakSpot(h);   // weak: an empty hole they can't walk through
      if (weak) h.weak -= hack; else if (rub) { h.rubble -= hack; rubbleShow(h); } else if (board) board.hp -= hack; else h.hp -= hack;
      r.m.arms[1].rotation.x = -1.8 + Math.sin(r.t * 9) * 1.1;
      r.hitT -= dt;
      if (r.hitT <= 0) {
        r.hitT = 0.7;
        burst(new THREE.Vector3(hackX(h, r.slot * 0.5), Math.min(holeMidY(h), 1.4), out ? 0.6 : 0.25), weak ? '#9a8a7a' : '#c98a45', 4, 2);
        h.jig = 0.15;
      }
      if (weak) { if (h.weak <= 0) widen(h, widenCells(h) || []); else if (!out && r.stamina <= 0) turnedAway(r); }
      else if (rub) { if (r.stamina <= 0) turnedAway(r); }
      else if (board && board.hp <= layerNextOut(h, li)) dropBoard(h, li, out);
      else if (!board && h.hp <= 0) breakHole(h);
      else if (!board && h.hp <= nextOut(h)) dropPiece(h);
      else if (r.stamina <= 0) { if (out) r.state = 'leave'; else turnedAway(r); }
      break;
    }
    case 'climb': case 'climbOut': {
      // Walking in through the gap (or back out again). Only a hole that couldn't be widened is
      // hopped through, up over the sill.
      const walk = h.door != null, into = r.state === 'climb';
      const s = Math.min(1, r.t / (walk ? 1 : 1.3));
      const z0 = into ? -1.15 : 1.2, z1 = into ? 1.2 : -1.15;
      r.z = z0 + (z1 - z0) * s;
      r.x += (doorX(h) - r.x) * Math.min(1, dt * 5);
      r.m.g.position.y = walk ? 0 : Math.sin(s * Math.PI) * (holeFootY(h) + 0.25);
      moving = walk;
      faceTo(r.m, 0, into ? 1 : -1, dt);
      r.inside = r.z > 0.3;
      if (s >= 1) {
        r.state = into ? 'raid' : 'leave'; r.t = 0; r.inside = into;
        if (into) {
          if (!guest()) G.waveIn++;
          r.tired = Math.min(1, Math.max(0, 1 - r.stamina / RAIDER_STAMINA));
          if (r.tired > 0.15) {
            r.state = 'winded';
            if (!G.windSaid) { G.windSaid = true; say('Through, but winded: knock them flat!', true, true); }
          }
        }
      }
      break;
    }
    case 'dazed': {
      // Knocked reeling by the wall coming down on them: they stagger back, then go again.
      if (r.t < 1) r.z = Math.max(-2.2, r.z - 1.1 * dt);
      faceTo(r.m, 0, 1, dt);
      if (r.t >= DAZE) { r.state = 'approach'; r.t = 0; }
      break;
    }
    case 'winded': {
      // Bent double, getting their breath back, just inside the wall.
      faceTo(r.m, 0, 1, dt);
      if (r.t >= WINDED * r.tired) { r.state = 'raid'; r.t = 0; }
      break;
    }
    case 'raid': {
      const c = chest.position;
      moving = !moveTo(r, c.x + 0.9, c.z - 0.2, 2.5 * (1 - TIRED_SLOW * (r.tired || 0)), dt);
      if (!moving) {
        G.gold -= PAY.steal; G.stolen++;
        updateStats();
        say(`A raider stole ${PAY.steal} doubloons!`, true);
        giveLoot(r);
        r.state = 'flee';
      }
      break;
    }
    case 'flee': {
      if (!passable(h)) { const gap = wall.holes.filter(passable).sort((a, b) => Math.abs(holeX(a) - r.x) - Math.abs(holeX(b) - r.x))[0]; if (gap) r.hole = gap; }
      moving = !moveTo(r, passable(r.hole) ? doorX(r.hole) : holeX(r.hole), 1.2, 2.8 * (1 - TIRED_SLOW * (r.tired || 0)), dt);
      if (!moving) { r.state = passable(r.hole) ? 'climbOut' : 'hackOut'; r.t = 0; }
      break;
    }
    case 'leave': {
      r.inside = false;
      moving = !moveTo(r, r.x, -15, 2.4, dt);
      if (!moving) r.gone = true;
      break;
    }
    case 'down': {
      // Sent flying: up, spinning, a bounce, then flat out and gone.
      const v = r.kv || new THREE.Vector3();
      const g = r.m.g;
      v.y -= 14 * dt;
      r.x = Math.max(-bounds.x, Math.min(bounds.x, r.x + v.x * dt));
      r.z = r.outside ? Math.max(-15, Math.min(-0.8, r.z + v.z * dt)) : Math.max(0.6, Math.min(bounds.z1, r.z + v.z * dt));
      g.position.y = Math.max(0, g.position.y + v.y * dt);
      if (g.position.y <= 0 && v.y < 0) { v.x *= 0.4; v.z *= 0.4; v.y = Math.abs(v.y) > 3 ? -v.y * 0.3 : 0; }
      if (g.position.y > 0.05) g.rotation.y += dt * 10;
      g.rotation.x = Math.max(-Math.PI / 2, -r.t * 4);
      if (r.t > 1.4) g.scale.setScalar(Math.max(0.001, 0.82 * (1 - (r.t - 1.4) * 2.5)));
      if (r.t > 1.8) r.gone = true;
      break;
    }
  }
  raiderPose(r, moving, dt);
}
function raiderPose(r, moving, dt) {
  const hop = (r.state === 'climb' || r.state === 'climbOut') && !moving;
  const g = r.m.g;
  if (r.state === 'winded') {
    // Hands on knees, puffing: leaning forward, the lean rising and falling with each breath.
    animateWalk(r.m, false, dt, 12);
    r.m.legs.forEach((l) => { l.rotation.x = 0; });
    r.m.arms.forEach((a) => { a.rotation.x = -0.75; });
    g.rotation.x = 0.38 + Math.sin(r.t * 7) * 0.05;
    r.hitT -= dt;
    if (r.hitT <= 0) { r.hitT = 0.7; burst(new THREE.Vector3(r.x, 1.15, r.z + 0.35), '#dfe8ee', 2, 0.7); }
  } else if (r.state !== 'down') g.rotation.x = 0;
  if (r.state === 'dazed') {
    // Swaying on the spot, arms hanging, sparks of the knock round their head.
    animateWalk(r.m, false, dt, 12);
    r.m.legs.forEach((l) => { l.rotation.x = 0; });
    r.m.arms.forEach((a) => { a.rotation.x = 0.2; });
    g.rotation.z = Math.sin(r.t * 4.5) * 0.16;
    r.hitT -= dt;
    if (r.hitT <= 0) { r.hitT = 0.45; burst(new THREE.Vector3(r.x, 1.75, r.z), '#ffd45a', 3, 0.8); }
  } else g.rotation.z = 0;
  if (!hop && r.state !== 'down' && r.state !== 'winded' && r.state !== 'dazed') {
    const swing = animateWalk(r.m, moving, dt, 12);
    if (r.state === 'attack' || r.state === 'hackOut') {
      r.m.legs.forEach((l) => { l.rotation.x = 0; });
      r.m.arms[1].rotation.x = -1.8 + Math.sin(r.t * 9) * 1.1;
    } else r.m.arms[1].rotation.x = moving ? swing * 0.5 : -0.4;
  }
  r.m.g.position.x = r.x;
  r.m.g.position.z = r.z;
  const behind = r.z < -0.1 && !topView;   // from up on the wall you can see them for real
  r.xr.forEach((x) => { x.visible = behind; });
}

// ---------- the cannon ----------
function fireCannon() {
  const cells = cannonSpot();
  if (cells) shoot(cells);
  return !!cells;
}
// A patch of solid stone, away from the gate and other holes, for a new hole.
// The roomiest breach that fits anywhere: three pieces if there's the stone for it, else two, else a
// single common piece (a P, F or Y, never a W or a U). Stone between the holes is short, so most
// walls only have room for the smaller ones in places.
function cannonSpot() {
  const singles = C.shuffle(['P', 'P', 'F', 'Y']).map((l) => C.pick(C.ORIENTS_BY_LETTER[l]).cells);
  const shapes = [...roomyShapes(3).slice(0, 4), ...roomyShapes(2, 6).slice(0, 4), ...singles];
  const clear = ([r, c]) => {
    if (r >= wall.H || c < 3 || c > wall.W - 4 || !wall.stoneAt.has(k(r, c))) return false;
    for (let a = -1; a <= 1; a++) for (let z = -1; z <= 1; z++) {
      const kk = k(r + a, c + z);
      if (wall.cellHole.has(kk) || wall.gate.has(kk) || wall.wood.has(kk)) return false;
    }
    return true;
  };
  for (const shape of shapes) {
    const b = C.bbox(shape), spots = [];
    for (let r0 = 1; r0 + b.h <= wall.H; r0++) for (let c0 = 3; c0 + b.w <= wall.W - 3; c0++) {
      const cells = shape.map(([r, c]) => [r + r0, c + c0]);
      if (cells.every(clear)) spots.push(cells);
    }
    if (spots.length) return C.pick(spots);
  }
  return null;
}
// A raider who tires at your wall before getting through gives up: that's the wall doing its job.
function turnedAway(r) {
  r.state = 'leave';
  if (guest()) return;
  G.turned++; G.waveTurned++;
  G.gold += PAY.turned;
  updateStats();
  burst(new THREE.Vector3(r.x, 1.6, r.z), '#ffd45a', 12, 2.5);
  say(`Turned away! They couldn't get through (+${PAY.turned})`);
}
// Rubble in a fresh breach: a heap of broken stone that thins as the raiders clear it.
function rubbleShow(h) {
  if (!h.rubbleG) {
    if (!(h.rubble > 0)) return;
    h.rubbleG = new THREE.Group();
    // Bottom row first, so a part-cleared pile sits on the ground and goes from the top.
    for (const [r, c] of [...h.cells].sort((a, b) => b[0] - a[0])) for (let i = 0; i < 2; i++) {
      const b = rock(X(c) + S * (0.25 + Math.random() * 0.5), Y(r) - S * (0.3 + Math.random() * 0.5), -STONE_D * (0.25 + Math.random() * 0.5), 0.17 + Math.random() * 0.06);
      h.rubbleG.add(b);
    }
    wallGroup.add(h.rubbleG);
  }
  const on = h.rubble > 0 && !h.pieces.length, n = h.rubbleG.children.length, keep = on ? Math.ceil(n * h.rubble / RUBBLE) : 0;
  h.rubbleG.children.forEach((b, i) => { b.visible = i < keep; });
}
// Where the cannon's aiming: the squares glow red on both faces of the wall, with a countdown.
const aimMat = new THREE.MeshBasicMaterial({ color: '#ff3a24', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
let aimMark = null;
function showAim() {
  const A = G.aim;
  if (aimMark && (!A || aimMark.userData.key !== JSON.stringify(A.cells))) { wallGroup.remove(aimMark); aimMark.userData.label.remove(); aimMark = null; }
  if (!A) return;
  if (!aimMark) {
    aimMark = new THREE.Group();
    for (const [r, c] of A.cells) for (const z of [0.08, -STONE_D - 0.08]) {
      const p = new THREE.Mesh(cellPlane, aimMat);
      p.position.set(X(c) + S / 2, Y(r) - S / 2, z);
      aimMark.add(p);
    }
    const line = outline(A.cells, 0.09, '#ff6a4a');
    line.position.set(X(0), Y(0), 0);
    aimMark.add(line);
    aimMark.userData.key = JSON.stringify(A.cells);
    aimMark.userData.label = document.createElement('div');
    wallGroup.add(aimMark);
  }
  const lab = aimMark.userData.label;
  if (!lab.isConnected) $('labels').append(lab);
  aimMat.opacity = 0.35 + 0.3 * Math.abs(Math.sin(performance.now() / 180));
  const b = C.bbox(A.cells);
  v3.set(X(b.c0) + b.w * S / 2, Y(b.r0) + 0.2, 0.1).project(camera);
  lab.className = 'label bad';
  lab.innerHTML = `Their cannon's aiming here! <b>${Math.max(1, Math.ceil(A.t))}</b><small>${gd ? 'shoot their cannon from the gun tower to spoil it' : 'get pieces ready to mend the breach'}</small>`;
  lab.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
  lab.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
  lab.style.display = v3.z > 1 ? 'none' : '';
}
function shoot(cells) {
  if (isHost()) send('all', { t: 'shoot', cells });
  const from = cannon.localToWorld(cannon.userData.muzzle.clone());
  const b = C.bbox(cells);
  const to = new THREE.Vector3(X(b.c0) + b.w * S / 2, Y(b.r0) - b.h * S / 2, -STONE_D);
  burst(from, '#ffcf6a', 10, 2);
  const ball = mesh(new THREE.SphereGeometry(0.18, 12, 10), mat('#1a1a1a', { metalness: 0.6 }));
  addXray(ball, new THREE.MeshBasicMaterial({ color: '#ff8a3a', transparent: true, opacity: 0.6, depthFunc: THREE.GreaterDepth, depthWrite: false }));
  scene.add(ball);
  tween(1.1, (s) => {
    ball.position.lerpVectors(from, to, s);
    ball.position.y += Math.sin(s * Math.PI) * 4;
  }, () => {
    scene.remove(ball);
    if (!guest()) blast(cells);
  });
}
function blast(cells, told = false) {
  // Anything mended or opened there while the ball was in the air wins: skip those squares.
  if (!told) cells = cells.filter(([r, c]) => wall.stoneAt.has(k(r, c)) && !wall.wood.has(k(r, c)));
  if (!told && (cells.length % 5 || !C.isConnected(cells))) return;
  if (isHost()) send('all', { t: 'blast', cells });
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const at = new THREE.Vector3();
  cells.forEach(([r, c]) => {
    const i = wall.stoneAt.get(k(r, c));
    wall.stoneAt.delete(k(r, c));
    stones.setMatrixAt(i, zero);
    // The stone tumbles into the den.
    const chunk = rock(X(c) + S / 2, Y(r) - S / 2, 0, 0.2);
    scene.add(chunk);
    const v = new THREE.Vector3((Math.random() - 0.5) * 2, 1 + Math.random() * 2, 2 + Math.random() * 2.5);
    const p0 = chunk.position.clone();
    tween(0.9, (s) => { chunk.position.set(p0.x + v.x * s, Math.max(0.1, p0.y + v.y * s - 9 * s * s), p0.z + v.z * s); }, () => setTimeout(() => scene.remove(chunk), 4000));
    at.set(X(c) + S / 2, Y(r) - S / 2, 0.3);
  });
  stones.instanceMatrix.needsUpdate = true;
  const h = registerHole(cells);
  h.rubble = RUBBLE;
  rubbleShow(h);
  wallBack();
  holeVisuals(h);
  updateHole(h);
  burst(at, '#9a8a7a', 26, 4.5);
  shake = 0.6;
  toast('Cannon fire! A breach, choked with rubble: mend it before they clear it', true);
}

// ---------- waves ----------
function startWave() {
  G.wave++;
  G.phase = 'wave';
  G.toSpawn = Math.round((1 + G.wave) * (1 + 0.5 * (crewSize() - 1)));
  G.spawnT = 0.5;
  G.cannonShots = G.wave >= 2 ? Math.min(3, G.wave - 1) : 0;
  G.cannonT = 20;
  G.aim = null;
  G.waveTurned = G.waveIn = 0;
  G.windSaid = false;
  if (G.wave >= 2 && !cannon.visible) { cannon.visible = true; say('They brought a cannon!', true); }
  else say(`Wave ${G.wave}: raiders!`, true);
  $('intro').classList.add('off');
  updateStats();
}
function updateWaves(dt) {
  if (G.phase !== 'wave') {
    G.phaseT -= dt;
    if (G.phaseT <= 0) startWave();
    return;
  }
  G.spawnT -= dt;
  if (G.toSpawn > 0 && G.spawnT <= 0) { spawnRaider(); G.toSpawn--; G.spawnT = Math.max(2.5, 7 - G.wave); }
  if (G.aim) {
    if ((G.aim.t -= dt) <= 0) { const cells = G.aim.cells; G.aim = null; G.cannonShots--; G.cannonT = CANNON_GAP; shoot(cells); }
  } else if (G.cannonShots > 0 && (G.cannonT -= dt) <= 0) {
    const cells = cannonSpot();
    if (cells) { G.aim = { cells, t: CANNON_AIM }; say('Their cannon\'s aiming at the wall: see the red!', true); } else G.cannonT = 5;
  }
  if (!G.toSpawn && !raiders.length) {
    G.phase = 'calm'; G.phaseT = CALM_SECS; G.aim = null;
    let tally = G.waveTurned || G.waveIn ? ` ${G.waveTurned} turned away at the wall, ${G.waveIn} got in.` : '';
    if (!G.waveIn && G.waveTurned) { G.gold += PAY.clean; updateStats(); tally = ` Not one got in! (+${PAY.clean})`; }
    // Timber for the next stretch, once nothing's still being built.
    const f = !frames().some((o) => o.kind !== 'house') && !ramp.jobs.some((j) => j.kind !== 'house' && j.frame && !j.up) && ramp.jobs[ramp.next]?.kind !== 'house' && openJob(ramp.next);
    if (f) say(`Wave ${G.wave} beaten off!${tally} Timber's come: ${f.kind === 'gun' ? 'build a gun tower in its frame' : 'build the rampart in its frame'}`);
    else say(`Wave ${G.wave} beaten off!${tally}`);
  }
}
function banner() {
  const el = $('banner');
  let t, cls = 'banner calm';
  if (G.phase === 'build') t = `Raiders attack in ${fmt(Math.ceil(G.phaseT))}: mend the wall!`;
  else if (G.phase === 'calm') t = `Wave ${G.wave} beaten off · next wave in ${fmt(Math.ceil(G.phaseT))}`;
  else { t = `Wave ${G.wave} · ${G.toSpawn + raiders.filter((r) => r.state !== 'down').length} raiders`; cls = 'banner'; }
  if (el.textContent !== t) el.textContent = t;
  if (el.className !== cls) el.className = cls;
}
function checkEnd() {
  if (G.over || G.gold > 0) return;
  G.over = true;
  endScreen();
}
function endScreen() {
  $('end-text').textContent = `They emptied the chest in wave ${G.wave}. You built ${G.masters} Masterpiece${G.masters === 1 ? '' : 's'}, boarded over ${G.boarded} hole${G.boarded === 1 ? '' : 's'} and knocked out ${G.bonked} raider${G.bonked === 1 ? '' : 's'}.`;
  setTimeout(() => $('end').classList.add('on'), 900);
}

// ---------- where the carried piece would go ----------
const ghostMats = {
  ok: new THREE.MeshBasicMaterial({ color: '#7dff7a', transparent: true, opacity: 0.45, depthWrite: false }),
  over: new THREE.MeshBasicMaterial({ color: '#ffb84a', transparent: true, opacity: 0.5, depthWrite: false }),
  no: new THREE.MeshBasicMaterial({ color: '#ff5a4a', transparent: true, opacity: 0.4, depthWrite: false }),
  // A board nailed on behind a mended hole: the green of "it goes here", bolder than the blue of
  // the layer it's going on (wood-coloured, it got lost against the wood in the hole).
  layer: new THREE.MeshBasicMaterial({ color: '#6dff6a', transparent: true, opacity: 0.6, depthWrite: false, toneMapped: false }),
};
// An outline drawn with thin bars rather than a line, so it reads at any distance.
const fatMats = {};
function fatOutline(cells, z, color, t = 0.045) {
  const set = new Set(cells.map(([r, c]) => k(r, c))), g = new THREE.Group();
  const m = (fatMats[color] ||= new THREE.MeshBasicMaterial({ color, toneMapped: false }));
  const bar = (x0, y0, x1, y1) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0) + t, Math.abs(y1 - y0) + t, t), m);
    b.position.set((x0 + x1) / 2, (y0 + y1) / 2, z);
    g.add(b);
  };
  for (const [r, c] of cells) {
    const x0 = c * S, x1 = (c + 1) * S, y0 = -r * S, y1 = -(r + 1) * S;
    if (!set.has(k(r - 1, c))) bar(x0, y0, x1, y0);
    if (!set.has(k(r + 1, c))) bar(x0, y1, x1, y1);
    if (!set.has(k(r, c - 1))) bar(x0, y0, x0, y1);
    if (!set.has(k(r, c + 1))) bar(x1, y0, x1, y1);
  }
  return g;
}
/* Easier snapping with the mouse (the user, and a friend: it was hard to put pieces where they
   wanted). A spot covering the square under the pointer comes first, then the one centred
   nearest it; a clean fit before boarding over. And it holds steady: once the ghost has snapped
   somewhere it stays there till you clearly point somewhere better, rather than flicking between
   two. Nothing turns the piece for you (that was tried and dropped). */
let aimKeep = '';
function pickSpot(list, at) {
  const shape = carry.cells.map(String).join(';');
  const key = (o) => `${o.frame ? o.frame.i : 'w'}|${o.hole ?? ''}|${o.patch ? o.layer : ''}|${o.dr},${o.dc}|${shape}`;
  const score = (o) => {
    const m = at(o), R = Math.floor(m.fr), Cc = Math.floor(m.fc);
    const covers = carry.cells.some(([r, c]) => r + o.dr === R && c + o.dc === Cc);
    const cx = o.frame ? o.gc : o.fc, cy = o.frame ? o.gr : o.fr;
    // Pointing into the hole (or frame) means fit it in there: a clean fit nearby beats one that
    // hangs over the stone. Pointing at the stone beside it is how you board over.
    const inside = o.frame ? o.frame.set.has(k(R, Cc)) : wall.cellHole.has(k(R, Cc));
    return (covers ? 0 : 0.9) + 0.5 * Math.hypot(cx - m.fc, cy - m.fr) + (o.over ? (inside ? 1.2 : 0.35) : 0);
  };
  let best = null, bs = Infinity, kept = null, ks = Infinity;
  for (const o of list) {
    const sc = score(o);
    if (sc < bs) { bs = sc; best = o; }
    if (aimKeep && key(o) === aimKeep) { kept = o; ks = sc; }
  }
  if (kept && ks <= bs + 0.4) best = kept, bs = ks;
  if (!best || bs > 2.2) { aimKeep = ''; return null; }
  aimKeep = key(best);
  return best;
}
// ---- puzzle mode at the wall (see `wm`) ----
const wallSpots = () => (carry ? fits(carry.cells).concat(patchFits(carry.cells)) : []);
const nearFrame = () => !!carry && frames().length > 0 && frameFits(carry.cells).some((o) => Math.hypot(o.cx - pirate.x, o.cz - pirate.z) <= REACH + 1.2);
/* Standing on (or right by) a frame on the floor: you're there to build it, so the whole-wall view
   doesn't come on by itself (it did along the right-hand walk frame, and the camera kept changing
   while the user was trying to start on it). The arrow keys still take you to the wall. */
const footV = new THREE.Vector3();
const onFrame = () => frames().some((f) => {
  if (f.done) return false;
  if (f.kind === 'stair') return Math.hypot(f.mid.x - pirate.x, f.mid.z - pirate.z) < 2.5;
  const l = f.group.worldToLocal(footV.set(pirate.x, f.mid.y, pirate.z)), m = 1.4 / S, fc = l.x / S, fr = -l.y / S;
  return fc > -m && fc < f.b.w + m && fr > -m && fr < f.b.h + m;
});
const spotRank = (o) => (o.patch ? 1 : o.over ? 2 : 0);   // a clean fit, then a board behind, then boarding over
const canWallMode = () => pirate.h < 0.05 && !deco.on && !G.over && pirate.z <= WALL_Z + 2.5 && wall.holes.length > 0;
function clampCursor() {
  if (!wm || !carry) return;
  const b = C.bbox(carry.cells);
  wm.r = Math.max(0, Math.min(wall.H - b.h, wm.r));
  wm.c = Math.max(0, Math.min(wall.W - b.w, wm.c));
}
function enterWall() {
  const spots = wallSpots().sort((a, z) => spotRank(a) - spotRank(z) || Math.abs(a.cx - pirate.x) - Math.abs(z.cx - pirate.x));
  const s = (target && !target.frame && target.ok ? target : null) || spots[0];
  const h = s ? null : wall.holes.slice().sort((a, z) => Math.abs(holeX(a) - pirate.x) - Math.abs(holeX(z) - pirate.x))[0];
  wm = s ? { r: s.dr, c: s.dc } : { r: h.b.r0, c: h.b.c0 };
  for (const a of ['arrowup', 'arrowdown', 'arrowleft', 'arrowright']) keys.delete(a);
  clampCursor();
}
function exitWall() {
  wm = null;
  wmLinger = 0;
  wmBlock = carry || null;   // don't pull you straight back in while you walk off with that piece
}
// The arrows: to the next hole that way (along the wall for left and right), to the best spot the
// piece has in it, or over the middle of it if it won't go in.
function jumpHole([dr, dc]) {
  const b = C.bbox(carry.cells), cx = wm.c + b.w / 2, cy = wm.r + b.h / 2;
  const mid = (h) => [h.b.r0 + h.b.h / 2, h.b.c0 + h.b.w / 2];
  const inside = (h) => cy >= h.b.r0 && cy <= h.b.r1 + 1 && cx >= h.b.c0 && cx <= h.b.c1 + 1;
  let best = null, bd = Infinity;
  wall.holes.forEach((h, i) => {
    if (inside(h)) return;
    const [hy, hx] = mid(h), along = dc ? (hx - cx) * dc : (hy - cy) * dr, side = dc ? Math.abs(hy - cy) : Math.abs(hx - cx);
    if (along <= 0.5) return;
    const d = along + side * 0.5;
    if (d < bd) { bd = d; best = i; }
  });
  if (best === null) { shake = 0.08; return; }
  const h = wall.holes[best], [hy, hx] = mid(h);
  const s = wallSpots().filter((o) => o.hole === best).sort((a, z) => spotRank(a) - spotRank(z) || Math.hypot(a.fr - hy, a.fc - hx) - Math.hypot(z.fr - hy, z.fc - hx))[0];
  if (s) { wm.r = s.dr; wm.c = s.dc; } else { wm.r = Math.round(hy - b.h / 2); wm.c = Math.round(hx - b.w / 2); clampCursor(); }
}
// Which way to walk to stand below the piece, a step back from the wall.
function wallWalk() {
  const b = carry ? C.bbox(carry.cells) : null;
  const tx = !b ? pirate.x : X(target && !target.frame ? target.dc : wm.c) + b.w * S / 2;
  const dx = Math.max(-bounds.x + 1.6, Math.min(bounds.x - 1.6, tx)) - pirate.x, dz = WALL_Z + 0.9 - pirate.z;   // a step back, so they don't hide the hole
  const n = Math.hypot(dx, dz);
  return n > 0.12 ? { wx: dx / n, wz: dz / n, slow: Math.min(1, n * 2) } : null;
}
function aim() {
  target = null;
  if (!carry || pirate.h > 0.3) return;
  if (wm) {
    // Anywhere on the wall, no walking needed: a clean fit at the piece's square first, then a board
    // on behind, then boarding it over. With the mouse, wherever it points, and the keys carry on
    // from there.
    const list = wallSpots();
    if (mouseMode && mouse && !mouse.frame) {
      const best = pickSpot(list, (o) => mouseAt(o.patch ? patchZ(o.layer, wall.holes[o.hole]) - PATCH_D / 2 : 0));
      const b = C.bbox(carry.cells);
      if (best) { target = { ...best, ok: true }; wm.r = best.dr; wm.c = best.dc; }
      else { wm.r = Math.round(mouse.fr - b.h / 2); wm.c = Math.round(mouse.fc - b.w / 2); clampCursor(); target = { dr: wm.r, dc: wm.c, ok: false }; }
      return;
    }
    const here = list.filter((o) => o.dr === wm.r && o.dc === wm.c).sort((a, z) => spotRank(a) - spotRank(z) || (a.layer ?? 0) - (z.layer ?? 0));
    target = here.length ? { ...here[0], ok: true } : { dr: wm.r, dc: wm.c, ok: false };
    return;
  }
  const fl = frames().length ? frameFits(carry.cells) : [];
  const fd = (o) => Math.hypot(o.cx - pirate.x, o.cz - pirate.z);
  // Pointing at a rampart frame: the spot nearest the pointer.
  if (mouseMode && mouse?.frame) {
    const best = pickSpot(fl.filter((o) => o.frame === mouse.frame), () => mouse);
    if (best) target = { ...best, ok: fd(best) <= REACH + 1.2, far: fd(best) > REACH + 1.2 };
    return;
  }
  if (pirate.z > WALL_Z + 2.5 && !fl.length) return;
  const reach = (o) => Math.abs(o.cx - pirate.x) <= REACH && pirate.z <= WALL_Z;
  // With the mouse, if it shows you where it'd go, you can put it there: from as far back as the
  // preview shows (the user: no value in having to walk closer), and as far as the next hole along.
  const mReach = (o) => Math.abs(o.cx - pirate.x) <= MREACH && pirate.z <= WALL_Z + 2.5;
  const list = pirate.z <= WALL_Z + 2.5 ? fits(carry.cells).concat(patchFits(carry.cells)) : [];
  const b = C.bbox(carry.cells);
  if (mouseMode && mouse) {
    if (pirate.z > WALL_Z + 2.5) return;
    const best = pickSpot(list, (o) => mouseAt(o.patch ? patchZ(o.layer, wall.holes[o.hole]) - PATCH_D / 2 : 0));
    if (best) target = { ...best, ok: mReach(best), far: !mReach(best) };
    else target = { dr: Math.round(mouse.fr - b.h / 2), dc: Math.round(mouse.fc - b.w / 2), ok: false };
  } else if (!mouseMode) {
    // Everything in reach: a walk frame on the floor when stood back from the wall, the stairs
    // when stood beside them, the holes when at the wall. Clean fits first, nearest first; then
    // the ways to board it over.
    const nf = fl.filter((o) => fd(o) <= REACH && (o.frame.kind === 'stair' || pirate.z > WALL_Z));
    const dd = (o) => (o.frame ? fd(o) : Math.abs(o.cx - pirate.x));
    const near = list.filter(reach).concat(nf).sort((a, z) => (a.over > 0) - (z.over > 0) || !!a.patch - !!z.patch || dd(a) - dd(z) || a.over - z.over);
    if (near.length) target = { ...near[cycle % near.length], ok: true, count: near.length };
  }
}
function drawGhost() {
  const kind = !target ? '' : !target.ok ? 'no' : target.patch ? 'layer' : target.over ? 'over' : 'ok';
  const f = target?.frame;
  const gz = f ? (f.kind === 'stair' ? 0.08 : 0.16) : target?.patch ? patchZ(target.layer, wall.holes[target.hole]) - 0.06 : kind === 'over' ? WOOD_D - 0.18 : 0.08;
  const want = target && carry ? `${f ? f.i : 'w'}|${carry.cells.map((x) => x.join()).join(';')}|${target.dr},${target.dc}|${kind}|${gz}` : '';
  if (want === ghostKey) return;
  ghostKey = want;
  if (ghost) { ghost.parent?.remove(ghost); ghost.traverse((o) => o.geometry?.dispose()); ghost = null; }
  if (!want) return;
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(S * 0.98, S * 0.98, 0.12);
  for (const [r, c] of carry.cells) {
    const b = new THREE.Mesh(geo, ghostMats[kind]);
    b.position.set((c + 0.5) * S, -(r + 0.5) * S, gz);
    g.add(b);
  }
  g.add(fatOutline(carry.cells, gz + 0.07, kind === 'no' ? '#ffd0c8' : kind === 'layer' ? '#e8fbff' : '#fff4d0', f ? 0.03 : 0.04));
  if (f) { g.position.set(target.dc * S, -target.dr * S, 0); f.group.add(g); }
  else { g.position.set(X(target.dc), Y(target.dr), 0); wallGroup.add(g); }
  ghost = g;
}
function prompt() {
  const f = focus();
  let t = '';
  const loose = foe();
  if (f.kind === 'pile') {
    if (!carry && f.p.letter) t = `Space: pick up the ${f.p.letter}`;
    else if (carry && carry.from === f.p && !f.p.letter) t = `Space: put the ${carry.letter} back`;
    else if (carry && f.p.letter && carry.from) t = `Space: swap the ${carry.letter} for the ${f.p.letter}`;
    else if (carry && f.p.letter) t = `Fit the ${carry.letter} again, or throw it at a raider`;
    else if (!f.p.letter && f.p.wait > 0.3) t = 'This crate\'s restocking: a thrown piece is timber gone';
  } else if (!carry && liftable()) { const l = liftable(); t = `Space: lift the ${l.f.pieces[l.pi].info.letter} back out of the frame`; }
  else if (!carry && canTakeBack()) t = `Space: take the ${lastPlaced.letter} back off`;
  else if (wm) {
    const keysTip = ' · WASD move it · arrows: next hole · Q/E turn · F flip · Esc: walk';
    if (!carry) t = '1, 2, 3: take a crate\'s piece · Esc: walk';
    else if (target?.ok && target.patch) t = `Space: nail it on behind${keysTip}`;
    else if (target?.ok && !target.over) t = `Space: fit the ${carry.letter} here${keysTip}`;
    else if (target?.ok) t = `Space: board it over (weak, no Masterpiece)${keysTip}`;
    else t = `The ${carry.letter} won't go there${keysTip}`;
  } else if (carry) {
    const more = '';
    if (target?.frame) t = !target.ok ? 'Walk closer to fit it there' : target.over ? (target.frame.kind === 'stair' ? `Space: fit the ${carry.letter} in the stairs (it sticks out, and stays that way)${more}` : `Space: fit it in the frame (it sticks out: the spare gets sawn off)${more}`) : `Space: fit the ${carry.letter} in the ${{ stair: 'stairs', gun: 'gun tower frame', house: 'house frame' }[target.frame.kind] || 'wall-walk frame'}${more}`;
    else if (target?.ok && target.patch) t = `Space: nail it on behind (one more layer for them to hack through)${more}`;
    else if (target?.ok && !target.over) t = `Space: fit the ${carry.letter} here${more}`;
    else if (target?.ok) t = `Space: board it over (weak, no Masterpiece)${more}`;
    else if (target?.far) t = 'Walk closer to fit it there';
    else if (pirate.z <= WALL_Z || (mouseMode && mouse)) t = `The ${carry.letter} won't go there · Q/E turn · F flip`;
    else if (wall.holes.every((h) => h.status !== 'open')) t = `Carry the ${carry.letter} to the wall: nail it on behind a mended hole`;
    else t = `Carry the ${carry.letter} to a hole`;
  } else if (atPlot() && houseState() === 'plot') t = 'Space: build your shack here';
  else if (atPlot() && houseState() === 'built') t = 'Space: paint and dress your shack';
  else if (atPlot() && houseState() === 'building') t = 'Fetch pieces for your shack\'s frame';
  else t = frames().length && pirate.z > WALL_Z ? `Fetch pieces to build the ${{ gun: 'gun tower', house: 'shack' }[(frames().find((o) => o.kind !== 'house') || frames()[0]).kind] || 'rampart'} in its frame` : 'Fetch a piece from the piles';
  const hacking = raiders.some(atWall);
  if (onGunDeck() && !carry) {
    const n = myArrows().length;
    t = `Chalk arrows to steer the stores into the guns: click a plank · wheel turns · right-click rubs out (${n}/${GD.arrows})`;
  } else if (onRampart()) {
    if (!carry) t = 'Bring a piece up here to throw at the raiders';
    else if (outsideFoe()) t = `Space, Shift or click a raider: throw the ${carry.letter} down on them!`;
    else t = hacking ? 'Walk along to get in range' : 'Up on the rampart · watch for raiders at the wall';
  } else if (pirate.h > 0.3) t = carry ? 'Up the stairs to the rampart' : 'Up to the rampart';
  else if (loose) t = carry ? `${f.kind === 'pile' || target?.ok ? t + ' · ' : ''}Shift or click: throw the ${carry.letter} at the raider!` : 'A raider is in the den! Grab a piece to throw at them';
  else if (hacking && carry && !target?.ok && stairsUp()) t += ' · or take it up the rampart and throw it';
  const el = $('prompt');
  if (el.textContent !== t) el.textContent = t;
  $('gunhelp').classList.toggle('on', onGunDeck());
  if (onGunDeck()) $('intro').classList.add('off');   // (nothing over the board)
}

// ---------- the crew: playing together ----------
/* Co-op: up to four pirates defend one den, all doing the same jobs. One browser (the first in)
   runs the raiders, deals the crates and tells the others what happens; that's only whose computer
   does the sums. Each pirate walks themself and asks it before taking from a crate or fitting a
   piece, so two can't take the same piece or fill the same spot. If it leaves, the next carries on. */
const CREW_COLOURS = ['#2a6fb8', '#2f8a4a', '#8a2fb8', '#c07a1f'];
const net = { ws: null, id: null, host: false, code: '', name: '', crew: new Map(), pending: null, asking: false, holds: new Map(), meAt: 0, snapAt: 0 };
const online = () => !!(net.ws && net.id);
const guest = () => online() && !net.host;
const isHost = () => online() && net.host;
const myId = () => net.id || 'me';
const crewSize = () => (online() ? 1 + net.crew.size : 1);
function send(to, msg) { if (net.ws?.readyState === 1) net.ws.send(JSON.stringify({ ...msg, to })); }
// News everyone should hear: shown here and passed to the crew.
function say(text, bad = false, warn = false) { toast(text, bad, warn); if (isHost()) send('all', { t: 'toast', text, bad, warn }); }
const r2 = (n) => Math.round(n * 100) / 100;
const pileSig = (p) => (p.letter ? p.letter + JSON.stringify(p.cells) : '');
// An empty crate goes as the seconds left till it restocks (if it's a while), so the crew see it.
const pilesOut = () => piles.map((p) => (p.letter ? [p.letter, p.cells] : p.wait > 1 ? r2(p.wait) : null));
function pilesIn(list) {
  list.forEach((d, i) => {
    const p = piles[i];
    if (typeof d === 'number') { p.wait = d; d = null; } else if (!d) p.wait = 0;
    if ((d ? d[0] + JSON.stringify(d[1]) : '') === pileSig(p)) return;
    const fresh = d && !p.letter;
    p.letter = d ? d[0] : null;
    p.cells = d ? d[1] : null;
    showPile(p);
    if (fresh && p.group) { const g = p.group, s0 = g.scale.x; tween(0.3, (s) => g.scale.setScalar(s0 * (1 - (1 - s) ** 3))); }
  });
}

// Crewmates: a pirate in their own colours, with their name over their head.
function addMate(id, name) {
  if (id === net.id || net.crew.has(id)) return;
  const used = new Set([...net.crew.values()].map((m) => m.ci));
  const ci = [0, 1, 2, 3].find((i) => !used.has(i)) ?? 0, col = CREW_COLOURS[ci];
  const m = makePirate({ shirt: ['#f4efe4', col], scarf: col, beard: ['#3a2a1a', '#222', '#7a4a1a', '#999'][ci] });
  m.g.position.set(0, 0, 8);
  scene.add(m.g);
  const tag = document.createElement('div');
  tag.className = 'tag';
  tag.textContent = name;
  tag.style.borderColor = col;
  $('tags').append(tag);
  net.crew.set(id, { id, name, ci, col, m, tag, x: 0, z: 8, h: 0, tx: 0, tz: 8, th: 0, ry: Math.PI, mv: false, c: '', cg: null, bonkT: 0 });
  crewLine();
}
function dropMate(id) {
  const mt = net.crew.get(id);
  if (!mt) return;
  scene.remove(mt.m.g);
  if (mt.cg) scene.remove(mt.cg);
  mt.tag.remove();
  net.crew.delete(id);
  crewLine();
}
function mateCarry(mt, c) {
  const sig = c ? c[0] + JSON.stringify(c[1]) : '';
  if (sig === mt.c) return;
  mt.c = sig;
  if (mt.cg) scene.remove(mt.cg);
  mt.cg = null;
  if (!c) return;
  mt.cg = centred(c[1], woodMat(c[0]));
  mt.cg.scale.setScalar(0.55);
  scene.add(mt.cg);
}
function updateMates(dt) {
  for (const mt of net.crew.values()) {
    const a = Math.min(1, dt * 12), g = mt.m.g;
    mt.x += (mt.tx - mt.x) * a; mt.z += (mt.tz - mt.z) * a; mt.h += (mt.th - mt.h) * a;
    let d = mt.ry - g.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    g.rotation.y += d * a;
    animateWalk(mt.m, mt.mv, dt);
    g.position.set(mt.x, g.position.y + mt.h, mt.z);
    if (mt.cg) {
      mt.m.arms.forEach((arm, i) => { arm.rotation.x = -2.75; arm.rotation.z = i ? 0.25 : -0.25; });
      mt.cg.position.set(mt.x, 2.15 + g.position.y, mt.z + 0.05);
    } else mt.m.arms.forEach((arm) => { arm.rotation.z = 0; });
    if (mt.bonkT > 0) { mt.bonkT -= dt; mt.m.arms[1].rotation.x = -2.6 + (0.3 - mt.bonkT) * 9; }
    v3.set(mt.x, 2.5 + mt.h + (mt.cg ? 0.6 : 0), mt.z).project(camera);
    mt.tag.style.display = v3.z > 1 ? 'none' : '';
    mt.tag.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
    mt.tag.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
  }
}
// The piece a crewmate is using, appearing at their head (or ours, waiting in the air).
function handAt(by, letter, cells, from = null) {
  if (by === myId() && net.pending) { const p = net.pending; net.pending = null; return p; }
  const mt = net.crew.get(by), src = mt || pirate;
  const g = centred(cells, woodMat(letter));
  g.position.set(src.x, 2.15 + (src.h || 0), src.z);
  g.scale.setScalar(0.55);
  scene.add(g);
  if (mt) { mateCarry(mt, null); mt.bonkT = 0.3; }
  return { letter, cells, from, group: g };
}
// Our piece back in our hands (the host said no, or the crew's gone).
function regain(why) {
  const p = net.pending;
  net.pending = null;
  net.asking = false;
  if (!p) return;
  const at = p.group.position.clone();
  scene.remove(p.group);
  holdPiece(p.letter, p.cells, p.from, at);
  if (why) toast(why, true);
}

function sendMe() {
  send('all', { t: 'me', x: r2(pirate.x), z: r2(pirate.z), h: r2(pirate.h), ry: r2(pirate.g.rotation.y), mv: pirate.moving ? 1 : 0, c: carry ? [carry.letter, carry.cells] : null });
}
function snapshot() {
  send('all', {
    t: 'snap', g: { ...G }, p: pilesOut(), cv: cannon.visible ? 1 : 0, gd: gunOut(),
    h: wall.holes.map((h) => [r2(h.hp), h.maxHp, h.status, h.pieces.length, h.lay.map((L) => [r2(L.hp), r2(L.maxHp), L.status]), r2(h.rubble || 0), r2(h.weak)]),
    r: raiders.map((r) => [r.id, r2(r.x), r2(r.z), r2(r.m.g.position.y), r2(r.m.g.rotation.y), r2(r.m.g.rotation.x), r2(r.m.g.scale.x), r.state, r.inside ? 1 : 0, r.loot ? 1 : 0, wall.holes.indexOf(r.hole), r2(r.slot), r.look]),
  });
}
function applySnap(m) {
  const was = G.over;
  Object.assign(G, m.g);
  if (G.over && !was) endScreen();
  if (G.wave > 0) $('intro').classList.add('off');
  updateStats();
  pilesIn(m.p);
  gunIn(m.gd);
  cannon.visible = !!m.cv;
  m.h.forEach(([hp, maxHp, status, n, bh, rub, weak], i) => {
    const h = wall.holes[i];
    if (!h) return;
    if (weak !== undefined) h.weak = weak;
    if (h.rubble !== rub) { h.rubble = rub; rubbleShow(h); }
    if (h.busy || h.pieces.length !== n) return;   // something's on its way: wait for it
    if (h.status !== status) { h.status = status; h.sig = ''; }
    h.hp = hp; h.maxHp = maxHp;
    (bh || []).forEach(([hp, maxHp, status], j) => { if (h.lay[j]) { if (h.lay[j].status !== status) h.sig = ''; Object.assign(h.lay[j], { hp, maxHp, status }); } });
  });
  const seen = new Set();
  for (const [id, x, z, y, ry, rx, sc, state, inside, loot, hi, slot, look] of m.r) {
    seen.add(id);
    let r = raiders.find((o) => o.id === id);
    if (!r) { r = makeRaider(look, id, x, z); r.m.g.rotation.y = ry; }
    Object.assign(r, { nx: x, nz: z, ny: y, nry: ry, nrx: rx, nsc: sc, inside: !!inside, hole: wall.holes[hi] || r.hole, slot });
    if (r.state !== state) { r.state = state; r.t = 0; }
    if (loot && !r.loot) giveLoot(r);
    else if (!loot && r.loot) { r.loot.removeFromParent(); r.loot = null; }
  }
  for (let i = raiders.length - 1; i >= 0; i--) {
    if (seen.has(raiders[i].id)) continue;
    scene.remove(raiders[i].m.g);
    raiders[i].mark.remove();
    raiders.splice(i, 1);
  }
}
function followRaider(r, dt) {
  if (r.nx === undefined) return;
  const a = Math.min(1, dt * 10), g = r.m.g, ox = r.x, oz = r.z;
  r.t += dt;
  r.x += (r.nx - r.x) * a;
  r.z += (r.nz - r.z) * a;
  if (['climb', 'climbOut', 'down'].includes(r.state)) {
    g.position.y += (r.ny - g.position.y) * a;
    g.rotation.x = r.nrx;
    g.scale.setScalar(r.nsc);
  } else { g.rotation.x = 0; g.scale.setScalar(0.82); }
  let d = r.nry - g.rotation.y;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  g.rotation.y += d * a;
  if ((r.state === 'attack' || r.state === 'hackOut') && r.hole) {
    r.hitT -= dt;
    if (r.hitT <= 0) {
      r.hitT = 0.7;
      burst(new THREE.Vector3(hackX(r.hole, r.slot * 0.5), Math.min(holeMidY(r.hole), 1.4), r.state === 'hackOut' ? 0.6 : 0.25), weakSpot(r.hole) ? '#9a8a7a' : '#c98a45', 4, 2);
      r.hole.jig = 0.15;
    }
  }
  raiderPose(r, Math.hypot(r.x - ox, r.z - oz) > dt * 0.4, dt);
}

// Everything a pirate joining needs to see the den as it is now.
function sendSync(to, fresh = false) {
  send(to, {
    t: 'sync', fresh, g: { ...G }, W: wall.W, H: wall.H, gate: wall.gateCols, cv: cannon.visible ? 1 : 0, p: pilesOut(),
    holes: wall.holes.map((h) => ({ cells: h.cells, status: h.status, hp: h.hp, maxHp: h.maxHp, weak: h.weak, hop: h.hop ? 1 : 0, pieces: h.pieces.map((p) => p.info), boards: h.lay.map((L) => [L.hp, L.maxHp, L.status]) })),
    next: ramp.next,
    gd: gunOut(),
    den: denLook,
    jobs: ramp.jobs.map((j) => (j.frame ? { cells: j.frame.cells, pieces: j.frame.pieces.map((p) => p.info), done: j.frame.done } : null)),
  });
}
function applySync(s) {
  raiders.splice(0).forEach((r) => { scene.remove(r.m.g); r.mark.remove(); });
  if (carry) { scene.remove(carry.group); carry = null; }
  if (net.pending) { scene.remove(net.pending.group); net.pending = null; }
  net.asking = false;
  lastPlaced = null; target = null; ghost = null; ghostKey = '';
  Object.assign(G, s.g);
  $('labels').replaceChildren();
  wall = { W: s.W, H: s.H, holes: [], cellHole: new Map(), wood: new Set(), lining: Array.from({ length: MAX_PATCHES }, () => new Set()), gate: new Set(), gateCols: s.gate, stoneAt: new Map() };
  for (let r = 1; r < s.H; r++) for (let c = s.gate.c0; c <= s.gate.c1; c++) wall.gate.add(k(r, c));
  s.holes.forEach((d) => registerHole(d.cells));
  buildWall();
  wall.holes.forEach((h, i) => {
    const d = s.holes[i];
    holeVisuals(h);
    d.pieces.forEach((info) => putPiece(h, info));
    Object.assign(h, { status: d.status, hp: d.hp, maxHp: d.maxHp, weak: d.weak ?? WEAK, hop: !!d.hop });
    (d.boards || []).forEach((L, j) => { if (h.lay[j] && Array.isArray(L)) Object.assign(h.lay[j], { hp: L[0], maxHp: L[1], status: L[2] }); });
    h.open = rest(h);
    h.exact = h.status === 'open' && h.open.length % 5 === 0 && C.solve(h.open, 1).length > 0;
    h.sig = '';
  });
  relining();
  // The rampart as built so far: every piece of it, where it is.
  s.jobs.forEach((d, i) => {
    if (!d) return;
    const f = openJob(i, d.cells);
    d.pieces.forEach((info) => putFramePiece(f, info));
    frameState(f);
    if (d.done) finishFrame(f, true);
  });
  ramp.next = s.next;
  if (s.den) applyDen(cleanDen(s.den));
  gunIn(s.gd);
  cannon.visible = !!s.cv;
  pilesIn(s.p);
  if (s.fresh) { Object.assign(pirate, { x: 0, z: 8, h: 0 }); $('intro').classList.remove('off'); }
  if (G.over) endScreen(); else $('end').classList.remove('on');
  updateStats();
}
// The host's gone: this browser runs the den now (or, cut off, carries on alone).
function becomeHost() {
  net.host = true;
  for (const r of raiders) { r.t = 0; r.hitT = 0.5; r.targeted = false; if (r.state === 'down') r.gone = true; }
  if (G.cannonT == null) G.cannonT = G.wave >= 2 ? 8 : Infinity;
  if (G.spawnT == null) G.spawnT = 1;
  raiderSeq = Math.max(raiderSeq, 0, ...raiders.map((r) => r.id));
  net.holds.clear();
  regain();
  piles.forEach((p) => { if (!p.letter && carry?.from !== p) refill(p); });
}

// The host's side: the crew asking for things.
function hostPlace(m) {
  const pile = piles[m.pile] || null;
  const list = m.frame != null ? frameFits(m.shape).filter((o) => o.frame.i === m.frame) : fits(m.shape).concat(patchFits(m.shape)).filter((o) => o.hole === m.hole);
  const t = list.find((o) => o.dr === m.dr && o.dc === m.dc && !!o.patch === !!m.patch);
  if (!t) return send(m.from, { t: 'grant', letter: m.letter, cells: m.shape, pile: m.pile, why: 'Someone got there first' });
  net.holds.delete(m.from);
  place(t, m.from, handAt(m.from, m.letter, m.shape, pile));
}
function hostThrow(m) {
  net.holds.delete(m.from);
  const hand = handAt(m.from, m.letter, m.shape, piles[m.pile] || null);
  const r = raiders.find((o) => o.id === m.rid);
  if (r && !r.gone) throwAt(r, hand, m.from);
  else { scene.remove(hand.group); refill(hand.from); }
}
const slotOf = (m) => (m.frame != null ? ramp.jobs[m.frame]?.frame : wall.holes[m.hole]);

function onNet(m) {
  const mt = net.crew.get(m.from);
  switch (m.t) {
    case 'welcome':
      net.id = m.id;
      net.host = m.host === m.id;
      m.crew.forEach((c) => addMate(c.id, c.name));
      send('all', { t: 'look', look: myLook });
      crewPanel(false);
      history.replaceState(null, '', `?crew=${net.code}`);
      if (net.host) newGame();
      crewLine();
      break;
    case 'full': lobbyMsg('That crew is full: four pirates already.'); break;
    case 'join':
      addMate(m.id, m.name);
      send(m.id, { t: 'look', look: myLook });
      toast(`${m.name} came aboard!`);
      if (net.host) sendSync(m.id);
      break;
    case 'leave': {
      const who = net.crew.get(m.id)?.name;
      dropMate(m.id);
      if (who) toast(`${who} left the crew`, false, true);
      if (net.host) {
        const pi = net.holds.get(m.id);
        net.holds.delete(m.id);
        if (pi !== undefined && !piles[pi].letter) refill(piles[pi]);
      } else if (m.host === net.id) becomeHost();
      break;
    }
    case 'me':
      if (!mt) return;
      Object.assign(mt, { tx: m.x, tz: m.z, th: m.h, ry: m.ry, mv: !!m.mv });
      mateCarry(mt, m.c);
      break;
    case 'toast': toast(m.text, m.bad, m.warn); break;
    case 'look': if (mt) wearLook(mt.m, cleanLook(m.look)); break;
    case 'den': applyDen(cleanDen(m.den)); break;
    case 'build': if (net.host) startHouse(); break;
    // From the host: what happened.
    case 'snap': if (!net.host) applySnap(m); break;
    case 'sync': if (!net.host) applySync(m); break;
    case 'grant':
      if (net.host) break;
      if (net.pending) { regain(m.why); break; }
      net.asking = false;
      if (m.letter && !carry) {
        const p = piles[m.pile];
        holdPiece(m.letter, m.cells, p, p.group ? p.group.position.clone() : new THREE.Vector3(p.x, 0.76, p.z));
        if (p.group) scene.remove(p.group);
        p.group = null; p.letter = null;
      }
      break;
    case 'place':
      if (net.host) hostPlace(m);
      else {
        const t = { ...m, frame: m.frame != null ? ramp.jobs[m.frame]?.frame : undefined };
        if (t.frame || wall.holes[m.hole]) place(t, m.by, handAt(m.by, m.letter, m.shape));
      }
      break;
    case 'unplace': if (!net.host && slotOf(m)) unplace(slotOf(m), m.by, undefined, m.pi ?? null); break;
    case 'throw':
      if (net.host) hostThrow(m);
      else if (m.by !== net.id) {
        const r = raiders.find((o) => o.id === m.rid), hand = handAt(m.by, m.letter, m.shape);
        if (r) throwAt(r, hand, m.by); else scene.remove(hand.group);
      }
      break;
    case 'break': if (!net.host && wall.holes[m.hole]) breakHole(wall.holes[m.hole]); break;
    case 'drop': if (!net.host && wall.holes[m.hole]) dropPiece(wall.holes[m.hole]); break;
    case 'gfire': if (!net.host && gd?.guns[m.i]) fireGun(m.i, m.x, m.z, !!m.cn); break;
    case 'chalk': if (net.host && gd) chalk(m.r, m.c, m.dir, m.from); break;
    case 'unboard': { const h = wall.holes[m.hole]; if (!net.host && h?.pieces[m.i]) breakBoard(h, h.pieces[m.i]); break; }
    case 'shoot': if (!net.host) shoot(m.cells); break;
    case 'blast': if (!net.host) blast(m.cells, true); break;
    case 'widen': if (!net.host && wall.holes[m.hole]) widen(wall.holes[m.hole], m.cells); break;
    case 'frame': if (!net.host) openJob(m.fi, m.cells); break;
    // To the host: the crew asking.
    case 'crate': {
      if (!net.host) break;
      const p = piles[m.i];
      if (p?.letter && !net.holds.has(m.from)) {
        send(m.from, { t: 'grant', letter: p.letter, cells: p.cells, pile: m.i });
        net.holds.set(m.from, m.i);
        if (p.group) scene.remove(p.group);
        p.group = null; p.letter = null;
      } else send(m.from, { t: 'grant' });
      break;
    }
    case 'putback': {
      if (!net.host) break;
      const p = piles[m.i];
      if (p && !p.letter) { p.letter = m.letter; p.cells = m.cells; showPile(p); }
      net.holds.delete(m.from);
      break;
    }
    case 'takeback': {
      if (net.host && m.pi != null && slotOf(m)?.occ) { unplace(slotOf(m), m.from, false, m.pi); break; }   // lifted out of a frame
      const where = net.host && slotOf(m), p = where?.pieces[where.pieces.length - 1];
      if (p && p.by === m.from && p.undo?.hpAfter != null && !(where.occ ? where.done : !p.patch && where.status === 'master')) unplace(where, m.from, false);
      break;
    }
    case 'again': if (net.host && G.over) newGame(); break;
  }
}

// ---------- joining a crew ----------
const CREW_CODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ', PIRATE_NAME = /^[A-Za-z]{3,16}$/;
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } } };
function savedName() {
  const own = store.get('carp.den.name');
  if (own) return own;
  try { return JSON.parse(store.get('carp.pirate'))?.name || ''; } catch { return ''; }
}
function lobbyMsg(text, calm = false) { const el = $('crew-err'); el.textContent = text; el.classList.toggle('calm', calm); }
function crewPanel(on) {
  $('crew').classList.toggle('on', on);
  if (!on) return;
  lobbyMsg('');
  $('crew-name').value ||= savedName();
  ($('crew-name').value ? $('crew-code') : $('crew-name')).focus();
}
function crewLine() {
  const el = $('crew-line');
  el.replaceChildren();
  $('crew-btn').hidden = online();
  if (!online()) return;
  const add = (tag, text, cls) => { const e = document.createElement(tag); e.textContent = text; if (cls) e.className = cls; el.append(e); return e; };
  add('span', 'Crew ');
  add('b', net.code);
  add('span', ': ');
  add('span', `${net.name} (you)`);
  for (const mt of net.crew.values()) { add('span', ', '); add('span', mt.name).style.color = mt.col; }
  const copy = add('button', 'Copy invite link', 'mini');
  copy.onclick = () => {
    const link = `${location.origin}${location.pathname}?crew=${net.code}`;
    navigator.clipboard?.writeText(link).then(() => { copy.textContent = 'Copied!'; }, () => { copy.textContent = link; });
  };
  add('button', 'Leave', 'mini').onclick = leaveCrew;
}
// On narrower screens the wave banner sits under the panel, however tall the crew line makes it.
new ResizeObserver(([e]) => document.documentElement.style.setProperty('--hud-h', `${e.target.offsetHeight}px`)).observe(document.querySelector('.hud'));
function joinCrew(code, name) {
  if (!PIRATE_NAME.test(name)) return lobbyMsg('Your pirate name: 3 to 16 letters, no spaces.');
  if (!/^[A-Z]{4}$/.test(code)) return lobbyMsg('A crew code is four letters.');
  store.set('carp.den.name', name);
  if (net.ws) leaveCrew();
  const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/crew/${code}?name=${encodeURIComponent(name)}`);
  Object.assign(net, { ws, code, name: name[0].toUpperCase() + name.slice(1).toLowerCase(), host: false, id: null });
  lobbyMsg('Hailing the crew…', true);
  ws.onmessage = (e) => { if (net.ws !== ws) return; let m; try { m = JSON.parse(e.data); } catch { return; } onNet(m); };
  ws.onclose = () => { if (net.ws === ws) lostCrew(); };
}
function lostCrew(quiet = false) {
  const was = online();
  net.ws = null;
  net.id = null;
  [...net.crew.keys()].forEach(dropMate);
  if (was && !net.host) becomeHost();   // carry on with the den as it stands
  net.host = false;
  net.holds.clear();
  regain();
  crewLine();
  if (quiet) return;
  if (was) toast('Lost touch with the crew: carrying on alone', true);
  else lobbyMsg("Couldn't reach the crew. Crews need the live site, not a plain file preview.");
}
function leaveCrew() {
  const ws = net.ws;
  lostCrew(true);
  ws?.close();
  history.replaceState(null, '', location.pathname);
}
$('crew-btn').onclick = () => crewPanel(true);
$('crew-close').onclick = () => crewPanel(false);
$('crew-start').onclick = () => joinCrew(Array.from({ length: 4 }, () => CREW_CODE[rand(CREW_CODE.length)]).join(''), $('crew-name').value.trim());
$('crew-join').onclick = () => joinCrew($('crew-code').value.trim().toUpperCase(), $('crew-name').value.trim());
$('crew-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('crew-join').click(); });
{
  const code = new URLSearchParams(location.search).get('crew')?.toUpperCase();
  if (code && /^[A-Z]{4}$/.test(code)) {
    $('crew-code').value = code;
    if (PIRATE_NAME.test(savedName())) setTimeout(() => joinCrew(code, savedName()), 0);
    else crewPanel(true);
  }
}

// ---------- decorating the den ----------
/* As in a Puzzle Pirates house: pick something (a Jolly Roger, a banner, a lantern, a rum barrel),
   point where it goes, turn it with the wheel or Q/E, click to put it down; right-click one to take
   it away. Flags and banners fly the design you've drawn up in the flag designer at the time. They
   stay where you put them, game after game, and the crew sees them too. Never in front of the wall
   (that's where you mend it and build) nor on a frame or by the crates. */
const deco = { on: false, tool: 'flag', rot: 0, at: null, ok: false, ghost: null, ring: null, group: new THREE.Group() };
scene.add(deco.group);
const DECO_Z0 = 5.2;   // nothing in front of this: the mending, the frames
function decorMesh(it) {
  const g = new THREE.Group();
  if (it.k === 'flag') g.add(flagpole(2.1, designMat(it.d)));
  else if (it.k === 'banner') {
    const post = mesh(new THREE.CylinderGeometry(0.045, 0.055, 2.2, 8), mat('#5b3a20', { map: woodTex }));
    post.position.y = 1.1;
    const bar = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), mat('#5b3a20', { map: woodTex }));
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 2.1, 0.06);
    const cloth = mesh(new THREE.PlaneGeometry(0.66, 1.03), designMat(it.d, true));
    cloth.position.set(0, 1.56, 0.08);
    const knobs = [-1, 1].map((sx) => { const b = mesh(new THREE.SphereGeometry(0.045, 8, 6), mat('#e8b23a', { metalness: 0.7, roughness: 0.3 })); b.position.set(0.42 * sx, 2.1, 0.06); return b; });
    g.add(post, bar, cloth, ...knobs);
  } else if (it.k === 'lantern') {
    const post = mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.7, 8), mat('#3a2616', { map: woodTex }));
    post.position.y = 0.85;
    const arm = mesh(new THREE.BoxGeometry(0.05, 0.05, 0.42), mat('#3a2616'));
    arm.position.set(0, 1.66, 0.19);
    const glass = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 6), new THREE.MeshStandardMaterial({ color: '#ffcf6a', emissive: '#ffae35', emissiveIntensity: 1.6 }), false);
    glass.position.set(0, 1.45, 0.36);
    const lid = mesh(new THREE.ConeGeometry(0.14, 0.1, 6), mat('#2b2b2b', { metalness: 0.6 }));
    lid.position.set(0, 1.61, 0.36);
    g.add(post, arm, glass, lid);
  } else {
    const b = mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.75, 16), mat('#7a4c28', { map: woodTex }));
    b.position.y = 0.375;
    const hoop = mat('#2b2b2b', { metalness: 0.6 });
    [0.12, 0.63].forEach((y) => { const h = mesh(new THREE.TorusGeometry(0.33, 0.02, 6, 24), hoop); h.rotation.x = Math.PI / 2; h.position.y = y; g.add(h); });
    const tap = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 6), mat('#e8b23a', { metalness: 0.7, roughness: 0.3 }));
    tap.rotation.x = Math.PI / 2;
    tap.position.set(0, 0.2, 0.36);
    g.add(b, tap);
  }
  g.position.set(it.x, 0, it.z);
  g.rotation.y = it.r * Math.PI / 2;
  return g;
}
const decorR = (it) => (it.k === 'barrel' ? 0.38 : 0.18);
function rebuildDecor() {
  deco.group.clear();
  for (const it of denLook.decor) if (Math.abs(it.x) < bounds.x + 0.3) deco.group.add(decorMesh(it));
  obstacles = obstacles.filter((o) => !o.deco).concat(denLook.decor.map((it) => ({ x: it.x, z: it.z, r: decorR(it), deco: true })));
}
// Is this a good spot? In the den, back from the wall, clear of everything else.
function decoFree(x, z, k) {
  if (Math.abs(x) > bounds.x - 0.1 || z < DECO_Z0 || z > bounds.z1) return false;
  const r = k === 'barrel' ? 0.38 : 0.18;
  if (Math.hypot(x - pirate.x, z - pirate.z) < r + 0.35) return false;
  for (const o of obstacles) if (Math.hypot(x - o.x, z - o.z) < o.r + r + 0.15) return false;
  if (ramp && x < houseXF() + 0.2 && z > HOUSE_Z0 - 0.3) return false;
  for (const f of frames()) {
    const l = f.group.worldToLocal(new THREE.Vector3(x, 0, z));
    if (l.x > -0.4 && l.x < f.b.w * S + 0.4 && l.y < 0.4 && l.y > -f.b.h * S - 0.4 && Math.abs(l.z) < 1) return false;
  }
  return true;
}
function decoMode(on) {
  deco.on = on;
  $('deco').classList.toggle('on', on);
  $('deco-btn').textContent = on ? 'Done decorating' : 'Decorate';
  $('dock').style.display = on ? 'none' : '';
  if (!on) { if (deco.ghost) deco.group.remove(deco.ghost); deco.ghost = null; if (deco.ring) deco.ring.visible = false; deco.at = null; return; }
  if (carry) putBack();
  if (!deco.ring) {
    deco.ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#7dff7a', transparent: true, opacity: 0.8, depthWrite: false }));
    scene.add(deco.ring);
  }
  decoBar();
}
function decoBar() {
  const box = $('deco-tools');
  box.replaceChildren(...DECOR.map(([id, name]) => {
    const b = el('button', 'tab' + (deco.tool === id ? ' on' : ''), name);
    b.onclick = () => { deco.tool = id; decoGhost(); decoBar(); };
    return b;
  }));
  $('deco-count').textContent = `${denLook.decor.length} of ${MAX_DECOR} put up`;
}
function decoGhost() {
  if (deco.ghost) deco.group.remove(deco.ghost);
  deco.ghost = null;
  if (!deco.at) return;
  deco.ghost = decorMesh({ k: deco.tool, x: deco.at.x, z: deco.at.z, r: deco.rot, d: designOf(denLook) });
  deco.ghost.traverse((m) => { if (m.isMesh) m.castShadow = false; });
  deco.group.add(deco.ghost);
}
function decoPoint(e) {
  ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1), camera);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p)) return null;
  // Lined up on half squares, so things stand in neat rows.
  return { x: Math.round(p.x / (S / 2)) * S / 2, z: Math.round(p.z / (S / 2)) * S / 2 };
}
function decoMove(e) {
  const at = decoPoint(e);
  deco.at = at;
  if (!at) { decoGhost(); deco.ring.visible = false; return; }
  const near = decoNear(at);
  deco.ok = !near && denLook.decor.length < MAX_DECOR && decoFree(at.x, at.z, deco.tool);
  deco.ring.visible = true;
  deco.ring.position.set(near ? near.x : at.x, 0.03, near ? near.z : at.z);
  deco.ring.material.color.set(near ? '#ffb84a' : deco.ok ? '#7dff7a' : '#ff5a4a');
  if (near) { if (deco.ghost) deco.group.remove(deco.ghost); deco.ghost = null; } else decoGhost();
  $('deco-tip').textContent = near ? 'Right-click to take it down' : !deco.ok ? (denLook.decor.length >= MAX_DECOR ? 'That\'s all there\'s room for: take something down first' : 'Not there: keep clear of the wall, the frames and the crates') : 'Click to put it here · wheel or Q/E turns it';
}
const decoNear = (at) => denLook.decor.find((it) => Math.hypot(it.x - at.x, it.z - at.z) < 0.45);
function decoClick(e) {
  const at = decoPoint(e);
  if (!at) return;
  const near = decoNear(at);
  if (e.button === 2) {
    if (near) { denLook = { ...denLook, decor: denLook.decor.filter((it) => it !== near) }; decoSaved(); }
    return;
  }
  if (e.button !== 0 || near || !decoFree(at.x, at.z, deco.tool) || denLook.decor.length >= MAX_DECOR) return;
  const it = { k: deco.tool, x: at.x, z: at.z, r: deco.rot, ...(deco.tool === 'flag' || deco.tool === 'banner' ? { d: designOf(denLook) } : {}) };
  denLook = { ...denLook, decor: [...denLook.decor, it] };
  decoSaved();
  burst(new THREE.Vector3(at.x, 0.3, at.z), '#e8c890', 10, 2);
}
function decoTurn(d) { deco.rot = (deco.rot + d + 4) % 4; decoGhost(); }
function decoSaved() {
  applyDen(denLook, true);
  decoBar();
  deco.ghost = null;
}
$('deco-done').onclick = () => decoMode(false);
$('deco-flag').onclick = () => { decoMode(false); dressPanel(true, 'den', 'flag'); };

// ---------- dressing your pirate, and your den ----------
/* "Your pirate": a turning preview of your pirate, with what to wear chosen from Puzzle Pirates'
   own tailor in its dyes, a familiar for your shoulder, and the den's flag and house paint. Kept
   in this browser; crewmates see your look, and the den's dress is shared by the crew. */
const dress = { open: false, tab: 'pirate', r: null, scene: null, cam: null, model: null, yaw: 0.6, drag: null };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
function dressInit() {
  if (dress.r) return;
  const cv = $('dress-cv');
  dress.r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
  dress.r.setPixelRatio(Math.min(devicePixelRatio, 2));
  dress.r.toneMapping = THREE.ACESFilmicToneMapping;
  dress.scene = new THREE.Scene();
  dress.scene.add(new THREE.HemisphereLight('#ffe6c4', '#3a2616', 1.3));
  const l = new THREE.DirectionalLight('#ffd9a8', 1.9);
  l.position.set(-2, 4, 3);
  dress.scene.add(l);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1.15, 40), mat('#4a3524'));
  ground.rotation.x = -Math.PI / 2;
  const fp = flagpole(2.1);
  fp.position.set(-0.9, 0, -0.9);
  dress.scene.add(ground, fp);
  dress.cam = new THREE.PerspectiveCamera(30, 1, 0.1, 30);
  cv.addEventListener('pointerdown', (e) => { dress.drag = e.clientX; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => { if (dress.drag == null) return; dress.yaw += (e.clientX - dress.drag) * 0.012; dress.drag = e.clientX; });
  cv.addEventListener('pointerup', () => { dress.drag = null; });
}
function dressModel() {
  if (dress.model) dress.scene.remove(dress.model.g);
  dress.model = dressPirate(myLook);
  dress.scene.add(dress.model.g);
}
let dressT = 0;
function dressFrame(now) {
  if (!dress.open) return;
  const dt = Math.min(0.05, (now - (dressT || now)) / 1000);
  dressT = now;
  const cv = $('dress-cv'), w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dress.r.getPixelRatio())) { dress.r.setSize(w, h, false); dress.cam.aspect = w / h; dress.cam.updateProjectionMatrix(); }
  const fam = myLook.fam !== 'none', denMode = dress.mode === 'den';
  // Your den: no pirate, a closer look at your flag.
  dress.model.g.visible = !denMode;
  if (denMode) { dress.cam.position.set(-0.1, 1.75, 2.6); dress.cam.lookAt(-0.35, 1.75, -0.9); }
  else { dress.cam.position.set(fam ? -0.2 : 0, 1.4, 4.5); dress.cam.lookAt(fam ? -0.1 : 0, 1.02, 0); }
  if (dress.drag == null) dress.yaw += dt * 0.35;
  dress.model.g.rotation.y = dress.yaw;
  familiarTick(dress.model.fam, dt);
  dress.r.render(dress.scene, dress.cam);
  requestAnimationFrame(dressFrame);
}
function dressPanel(on, mode = 'pirate', tab = null) {
  dress.open = on;
  $('dress').classList.toggle('on', on);
  palette(null);
  if (!on) return;
  dress.mode = mode;
  if (tab || !dressTabsFor[mode].some(([id]) => id === dress.tab)) dress.tab = tab || dressTabsFor[mode][0][0];
  $('dress-title').textContent = mode === 'den' ? 'Your den' : 'Your pirate';
  $('dress-rand').style.display = mode === 'den' ? 'none' : '';
  keys.clear();
  dressInit();
  dressModel();
  dressRows();
  dressT = 0;
  requestAnimationFrame(dressFrame);
}
// A colour chooser: the dye swatches in a little pop-up by the swatch you clicked.
function palette(btn, pal, cur, set, none) {
  const box = $('palette');
  box.replaceChildren();
  box.classList.toggle('on', !!btn);
  if (!btn) return;
  const opts = (none ? [['none', none]] : []).concat(Object.keys(pal).map((n) => [n, n]));
  for (const [id, name] of opts) {
    const b = el('button', 'sw' + (id === cur ? ' cur' : '') + (id === 'none' ? ' none' : ''));
    b.title = name;
    b.setAttribute('aria-label', name);
    if (id !== 'none') b.style.background = pal[id];
    b.onclick = () => { palette(null); set(id); };
    box.append(b);
  }
  const r = btn.getBoundingClientRect(), host = $('dress').firstElementChild.getBoundingClientRect();
  box.style.left = `${Math.max(8, Math.min(host.width - 250, r.left - host.left - 100))}px`;
  box.style.top = `${r.bottom - host.top + 6}px`;
}
// Two panels in one box: Your pirate (looks), and Your den (the user: the pirate's no place for the
// den's things), with the flag, the den itself and the shack.
const dressTabsFor = { pirate: [['pirate', 'Pirate'], ['clothes', 'Clothes'], ['familiar', 'Familiar']], den: [['flag', 'Flag'], ['den', 'Den'], ['house', 'Shack']] };
function dressRows() {
  const tabs = $('dress-tabs');
  tabs.replaceChildren(...dressTabsFor[dress.mode || 'pirate'].map(([id, name]) => { const b = el('button', 'tab' + (dress.tab === id ? ' on' : ''), name); b.onclick = () => { dress.tab = id; palette(null); dressRows(); }; return b; }));
  const box = $('dress-rows');
  box.replaceChildren();
  const L = myLook;
  const row = (label) => { const r = el('div', 'drow'); r.append(el('span', 'lab', label)); box.append(r); return r; };
  const chooser = (r, list, cur, set) => {
    const i = Math.max(0, list.findIndex(([id]) => id === cur)), w = el('span', 'pick');
    const prev = el('button', 'arr', '‹'), next = el('button', 'arr', '›');
    prev.setAttribute('aria-label', 'Previous'); next.setAttribute('aria-label', 'Next');
    prev.onclick = () => set(list[(i - 1 + list.length) % list.length][0]);
    next.onclick = () => set(list[(i + 1) % list.length][0]);
    w.append(prev, el('b', '', list[i][1]), next);
    r.append(w);
  };
  const swatch = (r, pal, cur, set, title, none) => {
    const b = el('button', 'sw' + (cur === 'none' ? ' none' : ''));
    if (cur !== 'none') b.style.background = pal[cur];
    b.title = `${title}: ${cur === 'none' ? none : cur}`;
    b.setAttribute('aria-label', b.title);
    b.onclick = (e) => { e.stopPropagation(); palette(b, pal, cur, set, none); };
    r.append(b);
  };
  const toggle = (r, on, set) => { const b = el('button', 'tog' + (on ? ' on' : ''), on ? 'Yes' : 'No'); b.onclick = () => set(!on); r.append(b); };
  const look = (k) => (v) => { myLook = cleanLook({ ...myLook, [k]: v }); lookChanged(); };
  const slot = (label, k) => {
    const r = row(label);
    chooser(r, PARTS[k][L.body], L[k], look(k));
    if (k === 'fam' && L.fam === 'none') return;
    const pal = k === 'fam' && L.fam === 'monkey' ? FUR : DYES;
    swatch(r, pal, L[k + 'Col'], look(k + 'Col'), 'Colour');
    if (twoColours(L, k)) swatch(r, DYES, L[k + 'Col2'], look(k + 'Col2'), 'Second colour');
  };
  if (dress.tab === 'pirate') {
    chooser(row('Pirate'), [['m', 'Male'], ['f', 'Female']], L.body, look('body'));
    const sk = row('Skin');
    SKIN.forEach((c, i) => { const b = el('button', 'sw' + (i === L.skin ? ' cur' : '')); b.style.background = c; b.title = 'Skin'; b.setAttribute('aria-label', `Skin ${i + 1}`); b.onclick = () => look('skin')(i); sk.append(b); });
    const hr = row('Hair');
    chooser(hr, PARTS.hair[L.body], L.hair, look('hair'));
    swatch(hr, HAIR, L.hairCol, look('hairCol'), 'Hair colour');
    if (L.body === 'm') chooser(row('Beard'), PARTS.beard.m, L.beard, look('beard'));
    toggle(row('Eyepatch'), L.patch, look('patch'));
    toggle(row('Earring'), L.earring, look('earring'));
  } else if (dress.tab === 'clothes') {
    slot('Hat', 'hat'); slot('Top', 'top'); slot('Legs', 'legs'); slot('Feet', 'feet');
    box.append(el('p', 'note', 'Clothes and dyes from the Puzzle Pirates tailor.'));
  } else if (dress.tab === 'familiar') {
    slot('Familiar', 'fam');
    box.append(el('p', 'note', 'A familiar rides on your shoulder. In Puzzle Pirates they were rare prizes.'));
  } else {
    const D = denLook, den = (k) => (v) => { denLook = cleanDen({ ...denLook, [k]: v }); applyDen(denLook, true); };
    const decorate = () => {
      const dr = row('Decorate');
      const db = el('button', 'mini', 'Put things up round the den');
      db.onclick = () => { dressPanel(false); decoMode(true); };
      dr.append(db);
    };
    if (dress.tab === 'flag') {
    box.append(el('h3', '', 'Your flag'));
    const fr = row('Emblem');
    chooser(fr, FLAGS, D.flag, den('flag'));
    swatch(fr, DYES, D.flagCol2, den('flagCol2'), 'Emblem');
    const pr0 = row('Cloth');
    chooser(pr0, PATTERNS, D.pat, den('pat'));
    swatch(pr0, DYES, D.flagCol, den('flagCol'), 'Cloth');
    if (D.pat !== 'plain') swatch(pr0, DYES, D.flagCol3, den('flagCol3'), 'Pattern');
    box.append(el('p', 'note', 'Flown over the gate, on the gun tower and on your shack. Flags and banners you put up yourself keep the design they had.'));
    decorate();
    } else if (dress.tab === 'den') {
    box.append(el('h3', '', 'Where it is'));
    chooser(row('Landscape'), BIOMES, D.biome, den('biome'));
    box.append(el('h3', '', 'The gun tower'));
    const tw = row('Gun tower');
    swatch(tw, DYES, D.gunwale, den('gunwale'), 'Gunwale', 'Gunnery red');
    swatch(tw, DYES, D.rail, den('rail'), 'Rail', 'Gunnery gold');
    swatch(tw, DYES, D.crates, den('crates'), 'Crates', 'Light wood');
    tw.append(el('small', '', 'gunwale · rail · crates'));
    decorate();
    } else {
    box.append(el('h3', '', 'Your shack'));
    const hs = ramp?.jobs.filter((j) => j.kind === 'house') || [], building = hs.find((j) => j.frame && !j.up);
    const hr = row('Shack');
    if (hs.length && hs.every((j) => j.up)) hr.append(el('b', 'state', 'Built!'));
    else if (building) hr.append(el('b', 'state', `Building the ${HOUSE_PART[building.part]} (${hs.indexOf(building) + 1} of ${hs.length})`));
    else { const b = el('button', 'mini', 'Start building'); b.onclick = () => { startHouse(); dressPanel(false); }; hr.append(b); }
    const pr = row('Paint');
    swatch(pr, DYES, D.paint, den('paint'), 'Walls', 'Bare wood');
    swatch(pr, DYES, D.roof, den('roof'), 'Roof', 'Bare wood');
    pr.append(el('small', '', 'walls · roof'));
    box.append(el('p', 'note', 'Its plot is marked out in the far left corner: walk in to start it, or to dress it once it\'s up. Built from pieces like everything else: each part laid on the floor, filled, and hoisted into place.'));
    decorate();
    }
  }
}
function lookChanged() {
  keep('carp.den.look', myLook);
  wearLook(pirate, myLook);
  if (dress.open) { dressModel(); dressRows(); }
  if (online()) send('all', { t: 'look', look: myLook });
}
// The den's dress: the flag every pole flies, and the house's paint. `mine`: chosen here, so kept
// and passed to the crew.
function applyDen(D, mine = false) {
  denLook = D;
  redrawFlag();
  paintHouse();
  paintTower();
  applyBiome();
  rebuildDecor();
  if (!mine) return;
  keep('carp.den.den', denLook);
  if (dress.open) dressRows();
  if (online()) send('all', { t: 'den', den: denLook });
}
$('look-btn').onclick = () => dressPanel(true, 'pirate');
$('den-btn').onclick = () => dressPanel(true, 'den');
$('deco-btn').onclick = (e) => { e.currentTarget.blur(); decoMode(!deco.on); };
$('dress-done').onclick = () => dressPanel(false);
$('dress-rand').onclick = () => { myLook = randomLook(); lookChanged(); };
$('dress').addEventListener('click', (e) => { if (e.target === $('dress')) dressPanel(false); else if (!e.target.closest('#palette')) palette(null); });

// ---------- main loop ----------
const camAt = new THREE.Vector3(0, 7.4, 14.2), camLook = new THREE.Vector3(0, 1.8, 3.6);
camera.position.copy(camAt);
const v3 = new THREE.Vector3(), L0 = new THREE.Vector3(), L1 = new THREE.Vector3(), L2 = new THREE.Vector3();
let deckView = 0;
/* Each tick runs the game on in small steps. Alone, a pause (another tab) stops the clock. In a
   crew it doesn't: the den goes on for everyone, so when the browser stops drawing a tab in the
   background, a timer keeps it ticking (as often as the browser lets it) and catches up. */
let lastT = performance.now();
/* Pause (the button, or P): everything stops, raiders, timers and stores alike. Only on your own:
   with a crew the raiders don't wait for anyone. It also pauses when you switch away from the tab. */
let paused = false;
function setPaused(on) {
  if (on && (online() || G.over)) { if (online()) toast('No pausing with a crew: the raiders don\'t wait for anyone', true); return; }
  paused = on;
  keys.clear();
  $('paused').classList.toggle('on', on);
  $('pause-btn').textContent = on ? 'Carry on' : 'Pause';
}
$('pause-btn').onclick = (e) => { e.currentTarget.blur(); setPaused(!paused); };
$('resume').onclick = () => setPaused(false);
document.addEventListener('visibilitychange', () => { if (document.hidden && !online() && !G.over) setPaused(true); });
function tick() {
  const now = performance.now();
  if (paused && online()) setPaused(false);
  if (paused) { lastT = now; return; }
  let left = Math.min(online() ? 1.5 : 0.05, (now - lastT) / 1000);
  lastT = now;
  while (left > 1e-4) { const d = Math.min(0.05, left); update(d); left -= d; }
  if (!online()) return;
  if (now - net.meAt > 80) { net.meAt = now; sendMe(); }
  if (net.host && now - net.snapAt > 100) { net.snapAt = now; snapshot(); }
}
function frame() {
  tick();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
setInterval(() => { if (online() && performance.now() - lastT > 250) tick(); }, 200);
function update(dt) {
  // Walk.
  let mx = 0, mz = 0;
  if (!G.over) {
    if (keys.has('a') || keys.has('arrowleft')) mx--;
    if (keys.has('d') || keys.has('arrowright')) mx++;
    if (keys.has('w') || keys.has('arrowup')) mz--;
    if (keys.has('s') || keys.has('arrowdown')) mz++;
  }
  // Puzzle mode at the wall: in when you come up to it with a piece, out on leaving it.
  if (wmBlock && (wmBlock !== carry || pirate.z > WALL_Z + 3)) wmBlock = null;
  // Fitting the piece is the end of it (the view stays a moment, for the next piece).
  if (wm && !carry && !net.pending) { wm = null; wmLinger = 1.5; }
  wmLinger = mx || mz || !canWallMode() ? 0 : Math.max(0, wmLinger - dt);
  if (wm && (!canWallMode() || pirate.h > 0.05)) wm = null;
  else if (!wm && carry && !wmBlock && !mx && !mz && canWallMode() && !nearFrame() && !onFrame() && wallSpots().length) enterWall();
  const auto = wm && !mx && !mz ? wallWalk() : null;
  const moving = pirate.moving = !!(mx || mz || auto);
  // Turn the view.
  if (keys.has('z')) view.yaw += dt * 1.4;
  if (keys.has('c')) view.yaw -= dt * 1.4;
  if (moving) {
    // Walk the way the camera faces (or, at the wall, to stand under the piece).
    const n = Math.hypot(mx, mz) || 1, cy = Math.cos(view.yaw), sy = Math.sin(view.yaw);
    const wx = auto ? auto.wx : (mx * cy + mz * sy) / n, wz = auto ? auto.wz : (-mx * sy + mz * cy) / n;
    const ox = pirate.x, oz = pirate.z, sp = SPEED * (auto ? auto.slow : 1);
    let nx = pirate.x + wx * sp * dt, nz = pirate.z + wz * sp * dt;
    for (const o of obstacles) {
      if (o.low && pirate.h > 1) continue;
      const dx = nx - o.x, dz = nz - o.z, d = Math.hypot(dx, dz), min = o.r + 0.3;
      if (d < min && d > 0) { nx = o.x + dx / d * min; nz = o.z + dz / d * min; }
    }
    nx = Math.max(-bounds.x, Math.min(bounds.x, nx));
    nz = Math.max(pirate.h > 1 ? (gd ? gd.z0 + 0.2 : -0.3) : bounds.z0, Math.min(bounds.z1, nz));
    // Up and down the stairs, but no walking into their side or off the edge of the rampart.
    const pad = pirate.h < 0.05 ? 0.28 : 0;
    // A step of one square you walk up; two, you hop up (stairs built with bits sticking out).
    const stuck = deckBlocks(ox, oz);   // (a gun run out right by you: you can always step clear)
    const okAt = (x, z) => Math.abs(heightAt(x, z, pad, pirate.h) - pirate.h) <= HOP && (pirate.h < ramp.T - 0.3 || stuck || !deckBlocks(x, z));
    if (!okAt(nx, nz)) { if (okAt(nx, oz)) nz = oz; else if (okAt(ox, nz)) nx = ox; else { nx = ox; nz = oz; } }
    pirate.x = nx; pirate.z = nz;
    const was = pirate.h;
    pirate.h = heightAt(nx, nz, 0, pirate.h);
    if (pirate.h - was > STEP) pirate.hop = { t: 0, a: pirate.hs, b: pirate.h };
    faceTo(pirate, wx, wz, dt * 1.2);
  }
  animateWalk(pirate, moving, dt);
  if (pirate.hop) {
    const hp = pirate.hop, u = Math.min(1, (hp.t += dt / 0.3));
    pirate.hs = hp.a + (hp.b - hp.a) * u + Math.sin(Math.PI * u) * 0.35;
    if (u >= 1) pirate.hop = null;
  } else pirate.hs += (pirate.h - pirate.hs) * Math.min(1, dt * 16);
  pirate.g.position.y += pirate.hs;
  pirate.g.position.x = pirate.x;
  pirate.g.position.z = pirate.z;
  if (carry) {
    const up = -2.75 * (carry.lift ?? 1);
    pirate.arms.forEach((a, i) => { a.rotation.x = up; a.rotation.z = i ? 0.25 : -0.25; });
  } else pirate.arms.forEach((a) => { a.rotation.z = 0; });
  if (pirate.bonkT > 0) { pirate.bonkT -= dt; pirate.arms[1].rotation.x = -2.6 + (0.3 - pirate.bonkT) * 9; }

  // The carried piece: held overhead, facing the wall's way so you can see how it'll go in.
  if (carry) {
    const g = carry.group, l = carry.lift ?? 1;
    v3.set(pirate.x, 2.15 + pirate.g.position.y, pirate.z + 0.05);
    if (l < 1) { g.position.lerp(v3, Math.min(1, l * 1.6 + 0.2)); g.rotation.x = -Math.PI / 2 * (1 - l); g.scale.setScalar(0.38 + 0.17 * l); }
    else { g.position.copy(v3); g.rotation.x = 0; g.scale.setScalar(0.55); }
    if (carry.spin) { carry.spin *= Math.max(0, 1 - dt * 14); if (Math.abs(carry.spin) < 0.01) carry.spin = 0; }
    if (carry.flipT !== undefined && carry.flipT < 1) carry.flipT = Math.min(1, carry.flipT + dt * 6);
    g.rotation.z = carry.spin || 0;
    g.rotation.y = carry.flipT < 1 ? Math.PI * (1 - carry.flipT) : 0;
    // See-through while aiming, so it doesn't hide the hole you're fitting it into.
    carry.mat.opacity += ((target ? 0.3 : 1) - carry.mat.opacity) * Math.min(1, dt * 10);
    carry.mat.depthWrite = carry.mat.opacity > 0.9;
  }

  if (!G.over) updateGunDeck(dt);
  if (guest()) {
    // The host runs the raiders; here they just follow what it says.
    if (G.phase !== 'wave' && !G.over) G.phaseT = Math.max(0, G.phaseT - dt);
    raiders.forEach((r) => followRaider(r, dt));
  } else if (!G.over) {
    updateWaves(dt);
    for (let i = raiders.length - 1; i >= 0; i--) {
      const r = raiders[i];
      updateRaider(r, dt);
      if (r.gone) { scene.remove(r.m.g); r.mark.remove(); raiders.splice(i, 1); }
    }
    checkEnd();
  }
  aim();
  drawGhost();
  prompt();
  banner();

  // Tweens and sparks.
  for (let i = tweens.length - 1; i >= 0; i--) {
    const t = tweens[i];
    t.t += dt;
    const s = Math.min(1, t.t / t.dur);
    t.step(s);
    if (s >= 1) { tweens.splice(i, 1); t.done?.(); }
  }
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.userData.v.y -= 7 * dt;
    s.position.addScaledVector(s.userData.v, dt);
    s.rotation.x += dt * 6; s.rotation.y += dt * 4;
    s.userData.life -= dt;
    s.scale.setScalar(Math.max(0, s.userData.life));
    if (s.userData.life <= 0) { scene.remove(s); sparks.splice(i, 1); }
  }

  /* Camera follows the pirate, looking at the wall and a little over it. Up on the rampart it
     swings up high to look down over the wall at the raiders. The player can turn it (Z/C or
     right-drag) all the way round, to see the outside of the wall, and tilt it (right-drag). It
     follows you right to the back of the den, where your house is. */
  const cz = pirate.z, u = ramp ? Math.min(1, pirate.h / ramp.T) : 0;
  topView = u > 0.7;
  L0.set(pirate.x * 0.55, 1.8, cz - 3.4);
  L1.set(pirate.x, 0.5, -2.6);
  const look = L0.lerp(L1, u);
  let dist = (12 + (17 - 12) * u) * view.zoom;
  let tilt = Math.max(0.2, Math.min(1.45, 0.486 + (1.4 - 0.486) * u + view.pitch));
  deckView += ((onGunDeck() ? 1 : 0) - deckView) * Math.min(1, dt * 2.5);
  if (gd && deckView > 0.001) {
    L2.set(gd.x0 + GD.cols * S / 2, ramp.T, gd.z0 + GD.rows * S * 0.5);
    look.lerp(L2, deckView);
    // Close enough that the tower fills the screen, with the wall either side of it in view.
    const vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect);
    dist += (Math.max((GD.cols * S / 2 + 2.2) / Math.tan(hh), (GD.rows * S / 2 + 1.2) / Math.tan(vh)) * view.zoom - dist) * deckView;
    tilt += (Math.max(0.6, Math.min(1.45, 1.1 + view.pitch)) - tilt) * deckView;
  }
  // Puzzle mode at the wall: straight on to the whole wall, every hole in view at once.
  wallView += ((wm || wmLinger > 0 ? 1 : 0) - wallView) * Math.min(1, dt * 3);
  let yaw = view.yaw;
  if (wallView > 0.001) {
    const W2 = wall.W * S / 2, H2 = wall.H * S / 2;
    const vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect);
    L2.set(0, H2 + 0.2, 0.6);
    look.lerp(L2, wallView);
    dist += (Math.max((W2 + 0.5) / Math.tan(hh), (H2 + 1.4) / Math.tan(vh)) * Math.min(1, view.zoom) + 1 - dist) * wallView;
    tilt += (0.36 - tilt) * wallView;   // high enough to see over the pirate's head
    yaw = Math.atan2(Math.sin(view.yaw), Math.cos(view.yaw)) * (1 - wallView);
  }
  v3.set(Math.sin(yaw) * Math.cos(tilt), Math.sin(tilt), Math.cos(yaw) * Math.cos(tilt)).multiplyScalar(dist).add(look);
  camAt.lerp(v3, Math.min(1, dt * 3));
  camera.position.copy(camAt);
  // The fog starts beyond what you're looking at, so a high or zoomed-out view doesn't go murky.
  const camD = camAt.distanceTo(camLook);
  scene.fog.near = camD + 6; scene.fog.far = camD + 24;
  // Looking down from the wall you see more of the floor the torches don't reach: brighten it up.
  renderer.toneMappingExposure = 1 + 0.45 * u;
  if (shake > 0) { camera.position.x += (Math.random() - 0.5) * shake * 0.5; camera.position.y += (Math.random() - 0.5) * shake * 0.5; shake = Math.max(0, shake - dt); }
  camLook.lerp(look, Math.min(1, dt * 3));
  camera.lookAt(camLook);
  updateMates(dt);
  waveFlags(dt);
  biomeTick(dt);
  showAim();

  // A marker over every raider inside the den, pinned to the screen edge when they're out of view.
  aimed = carry ? aimFoe() : null;
  renderer.domElement.style.cursor = carry && cursor && clickedFoe(cursor.x, cursor.y, pirate.h > 0.3 ? 1e4 : 90) ? 'crosshair' : '';
  for (const r of raiders) {
    const show = r === aimed || (r.state !== 'down' && (r.inside || (topView && !r.gone && ['approach', 'attack', 'dazed'].includes(r.state) && r.z > -6)));
    r.mark.classList.toggle('aim', r === aimed);
    r.mark.style.display = show ? '' : 'none';
    if (!show) continue;
    v3.set(r.x, 1.9, r.z).project(camera);
    let sx = (v3.x + 1) / 2 * innerWidth, sy = (1 - v3.y) / 2 * innerHeight;
    const off = v3.z > 1 || sx < 0 || sx > innerWidth || sy < 0 || sy > innerHeight;
    sx = Math.min(innerWidth - 28, Math.max(28, sx));
    sy = Math.min(innerHeight - 90, Math.max(70, sy));
    r.mark.style.left = `${sx}px`;
    r.mark.style.top = `${sy}px`;
    r.mark.classList.toggle('off', off);
    r.mark.classList.toggle('loot', !!r.loot);
  }

  // Hole labels float above each hole, with a strength bar for mended ones.
  nextMat.opacity = 0.22 + 0.2 * Math.sin(performance.now() / 260);
  for (const h of wall.holes) {
    h.attackers = raiders.filter((r) => r.hole === h && ['approach', 'attack', 'hackOut', 'dazed'].includes(r.state)).length;
    const [cls, html] = labelFor(h);
    nextLayer(h);
    if (h.sig !== cls + html) { h.sig = cls + html; h.label.className = cls; h.label.innerHTML = html; }
    const bar = h.label.querySelector('.bar:not(.lay) b');
    if (bar) bar.style.width = `${Math.max(0, barFrac(h)) * 100}%`;
    h.label.querySelectorAll('.bar.lay b').forEach((b, j) => { const L = h.lay[j]; b.style.width = `${L ? Math.max(0, L.hp / L.maxHp) * 100 : 0}%`; });
    // From up on the wall, labels sit on the den side so they don't hide the raiders.
    if (topView) v3.set(holeX(h), 0, 2.2).project(camera); else v3.set(holeX(h), Y(h.b.r0) + 0.15, 0.1).project(camera);
    h.label.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
    h.label.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
    h.label.style.display = deckView > 0.5 ? 'none' : '';   // out of the way while you're gunning
    // A patch under attack shudders.
    if (h.jig > 0) {
      h.jig = Math.max(0, h.jig - dt);
      h.pieces.forEach((p) => { p.group.position.x = p.base.x + (Math.random() - 0.5) * h.jig * 0.4; });
      if (!h.jig) h.pieces.forEach((p) => { p.group.position.x = p.base.x; });
    }
  }
  // A crate restocking after a throw shows how long it's got to go.
  for (const p of piles) {
    if (p.wait > 0) p.wait = Math.max(0, p.wait - dt);
    const show = !p.letter && p.wait > 0.3 && carry?.from !== p;
    p.label.style.display = show ? '' : 'none';
    if (!show) continue;
    p.label.firstChild.textContent = `Restocking · ${Math.ceil(p.wait)}s`;
    p.label.querySelector('.bar b').style.width = `${Math.min(1, 1 - p.wait / (p.waitFull || restockSecs())) * 100}%`;
    v3.set(p.x, 1.2, p.z).project(camera);
    p.label.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
    p.label.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
    if (v3.z > 1) p.label.style.display = 'none';
  }
  toolbox();
  gunLabels();
  plotLabel();
  for (const f of frames()) {
    const [cls, html] = frameLabel(f);
    if (f.sig !== cls + html) { f.sig = cls + html; f.label.className = cls; f.label.innerHTML = html; }
    v3.copy(f.mid).project(camera);
    f.label.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
    f.label.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
    f.label.style.display = v3.z > 1 ? 'none' : '';
  }
}

/* A shortcut for trying things out (den.html?try=gundeck): the whole rampart and the gun deck
   already built, with the pieces a crew might have used, so you can go straight up and play it. */
function buildAll(upTo = ramp.jobs.length - 1) {
  for (let i = 0; i <= upTo; i++) {
    const f = openJob(i);
    if (!f) continue;
    let sol = C.solve(f.cells, 1)[0];
    for (let n = 1; n <= 4 && !sol; n++) sol = C.solve(f.cells.concat([...Array(n).keys()].map((c) => [f.b.h, c])), 1)[0];
    for (const p of sol || []) {
      const r0 = Math.min(...p.cells.map((x) => x[0])), c0 = Math.min(...p.cells.map((x) => x[1]));
      putFramePiece(f, { letter: p.letter, shape: C.normalize(p.cells), dr: r0, dc: c0, over: 0, by: myId() });
    }
    frameState(f);
    finishFrame(f, true);
  }
  ramp.next = upTo + 1;
}

newGame();
// ?try=all (or ?try=gundeck): everything built, and you start up on the gun tower.
if (['all', 'gundeck'].includes(new URLSearchParams(location.search).get('try'))) {
  buildAll();
  Object.assign(pirate, { x: gd.x0 + GD.cols * S / 2, z: gd.z0 + (GD.rows - 0.5) * S, h: ramp.T });
  $('intro').classList.add('off');
}
requestAnimationFrame(frame);

// For poking at it from the console.
window.den = { tune, HP, widenCells, widen, dropPiece, dropBoard, curLayer, layerOpen, breakHole, onFrame, cannonSpot, get wm() { return wm; }, newWall, doorOf, passable, weakSpot, decoMode, get deco() { return deco; }, get denLook() { return denLook; }, get gd() { return gd; }, get myLook() { return myLook; }, setLook(l) { myLook = cleanLook(l); lookChanged(); }, setDen(d) { applyDen(cleanDen(d), true); }, startHouse, dressPanel, get dressTab() { return dress.tab; }, set dressTab(t) { dress.tab = t; dressRows(); }, buildAll, chalk, gunTick, loopsOf, addStore, gunSq, camera, net, onNet, sendSync, joinCrew, leaveCrew, openJob, finishFrame, frameFits, frames, putFramePiece, frameState, takeBack, canTakeBack, get lastPlaced() { return lastPlaced; }, get aimed() { return aimed; }, clickedFoe, get wall() { return wall; }, pirate, piles, raiders, G, get carry() { return carry; }, get target() { return target; }, act, startWave, fireCannon, spawnRaider, fits, patchFits, place, pickUp, showPile, view, get ramp() { return ramp; }, heightAt, throwAt,
  // Run the game forward by hand (for testing while the tab is in the background).
  step(secs) { for (let t = 0; t < secs; t += 1 / 30) update(1 / 30); renderer.render(scene, camera); } };
