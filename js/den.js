/* Pirate Den: a 3D proof of concept. A stone wall with a gate guards the den; raiders on the
   far side hack at it and a cannon blasts fresh holes. The pirate fetches pieces from three
   piles (the toolbox), carries them over and mends the holes.
   Same rules as the main puzzle: twelve pentominoes at their real draw weights. A hole filled
   exactly is a Masterpiece, and strong. A piece may also be nailed over the stone around a hole
   ("boarded over"): that always closes it, but the patch is weak and pays less. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const C = window.Carp;
const S = 0.55;          // one carpentry square, in metres
const WOOD_D = 0.5;      // depth of a wooden piece
const STONE_D = 0.7;
const REACH = 2.4;       // how far along the wall the pirate can reach
const WALL_Z = 2.7;      // how close to the wall the pirate must stand to fit a piece
const SPEED = 4.6;
const HP = { master: 45, boarded: 10 };   // seconds of one raider hacking at it
const PAY = { master: 10, boarded: 2, bonk: 3, steal: 15, scrap: 1 };
const RAIDER_DPS = 1, RAIDER_STAMINA = 16;
const k = (r, c) => r + ',' + c;
const rand = (n) => Math.floor(Math.random() * n);
const $ = (id) => document.getElementById(id);

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

scene.add(new THREE.HemisphereLight('#ffe6c4', '#3a2616', 0.9));
const sun = new THREE.DirectionalLight('#ffd9a8', 1.6);
sun.position.set(-5, 12, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 14, bottom: -14, near: 1, far: 45 });
scene.add(sun);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

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
function makePirate(o = {}) {
  const { shirt = ['#f4efe4', '#b8322a'], scarf = '#c0392b', trousers = '#34395a', beard = '#5a3418', patch = true, sword = false } = o;
  const g = new THREE.Group();
  const skin = mat('#f0bf8e'), pants = mat(trousers), boot = mat('#2a1b12'), red = mat(scarf), black = mat('#1d1a18');
  const gold = mat('#e8b23a', { metalness: 0.7, roughness: 0.3 });
  const top = mat('#ffffff', { map: stripes(...shirt) });
  const legs = [-1, 1].map((s) => {
    const hip = new THREE.Group();
    hip.position.set(0.13 * s, 0.72, 0);
    const leg = mesh(new THREE.CylinderGeometry(0.095, 0.085, 0.58, 10), pants);
    leg.position.y = -0.29;
    const b = mesh(new RoundedBoxGeometry(0.18, 0.15, 0.3, 2, 0.05), boot);
    b.position.set(0, -0.62, 0.05);
    hip.add(leg, b);
    g.add(hip);
    return hip;
  });
  const body = new THREE.Group();
  body.position.y = 0.72;
  g.add(body);
  const torso = mesh(new THREE.CylinderGeometry(0.24, 0.29, 0.62, 16), top);
  torso.position.y = 0.33;
  const belt = mesh(new THREE.CylinderGeometry(0.295, 0.295, 0.08, 16), black);
  belt.position.y = 0.06;
  const buckle = mesh(new THREE.BoxGeometry(0.11, 0.09, 0.03), gold);
  buckle.position.set(0, 0.06, 0.29);
  const head = mesh(new THREE.SphereGeometry(0.25, 20, 16), skin);
  head.position.y = 0.9;
  const nose = mesh(new THREE.SphereGeometry(0.055, 10, 8), skin);
  nose.position.set(0, 0.87, 0.245);
  const eye = mesh(new THREE.SphereGeometry(0.035, 8, 6), black, false);
  eye.position.set(0.085, 0.95, 0.215);
  body.add(torso, belt, buckle, head, nose, eye);
  if (patch) {
    const pt = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 14), black, false);
    pt.rotation.x = Math.PI / 2 - 0.35;
    pt.position.set(-0.09, 0.95, 0.215);
    const strap = mesh(new THREE.TorusGeometry(0.252, 0.012, 6, 32), black, false);
    strap.rotation.set(Math.PI / 2 - 0.25, 0.35, 0);
    strap.position.y = 0.96;
    body.add(pt, strap);
  } else {
    const e2 = eye.clone();
    e2.position.x = -0.085;
    body.add(e2);
  }
  const bandana = mesh(new THREE.SphereGeometry(0.262, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2.3), red);
  bandana.position.y = 0.93;
  bandana.rotation.x = -0.18;
  const knot = mesh(new THREE.SphereGeometry(0.07, 10, 8), red);
  knot.position.set(0, 1.0, -0.25);
  const tail = mesh(new THREE.BoxGeometry(0.07, 0.2, 0.03), red);
  tail.position.set(0.04, 0.88, -0.28); tail.rotation.z = 0.3;
  const bd = mesh(new THREE.SphereGeometry(0.17, 14, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(beard));
  bd.position.set(0, 0.82, 0.07);
  const ring = mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 16), gold, false);
  ring.position.set(0.25, 0.83, 0);
  ring.rotation.y = Math.PI / 2;
  body.add(bandana, knot, tail, bd, ring);
  const arms = [-1, 1].map((s) => {
    const sh = new THREE.Group();
    sh.position.set(0.31 * s, 0.58, 0);
    const arm = mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.48, 10), top);
    arm.position.y = -0.24;
    const hand = mesh(new THREE.SphereGeometry(0.075, 10, 8), skin);
    hand.position.y = -0.5;
    sh.add(arm, hand);
    body.add(sh);
    return sh;
  });
  if (sword) {
    const blade = mesh(new THREE.BoxGeometry(0.04, 0.05, 0.62), mat('#d8dde2', { metalness: 0.8, roughness: 0.25 }));
    blade.position.set(0, -0.52, 0.34);
    const guard = mesh(new THREE.BoxGeometry(0.16, 0.05, 0.04), gold);
    guard.position.set(0, -0.52, 0.04);
    arms[1].add(blade, guard);
  }
  g.traverse((x) => { if (x.isMesh) x.castShadow = true; });
  return { g, legs, arms, body, phase: 0 };
}
function animateWalk(p, moving, dt, speed = 11) {
  p.phase = moving ? p.phase + dt * speed : 0;
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
const holeBackMat = mat('#5a3a22', { roughness: 1 });
const cellPlane = new THREE.PlaneGeometry(S, S);

function lastGap() {
  let l;
  do l = C.weightedLetter(); while (l === 'I' || l === 'X');
  return C.pick(C.ORIENTS_BY_LETTER[l]).cells;
}

function newWall() {
  const shapes = C.shuffle([1, 2, 2, 3]).map((n) => (n === 1 ? lastGap() : C.genHole(n).hole));
  const dims = shapes.map((s) => C.bbox(s));
  const H = Math.max(6, Math.max(...dims.map((d) => d.h)) + 2);
  let col = 2, gate = null;
  const placed = shapes.map((s, i) => {
    if (i === 2) { gate = { c0: col, c1: col + 3 }; col += 6; }
    const d = dims[i];
    const top = 1 + rand(H - 1 - d.h);
    const cells = s.map(([r, c]) => [r + top, c + col]);
    col += d.w + 2 + rand(2);
    return cells;
  });
  $('labels').replaceChildren();
  wall = { W: col, H, holes: [], cellHole: new Map(), wood: new Set(), gate: new Set(), gateCols: gate, stoneAt: new Map() };
  for (let r = 1; r < H; r++) for (let c = gate.c0; c <= gate.c1; c++) wall.gate.add(k(r, c));
  placed.forEach((cells) => registerHole(cells));
  buildWall();
  wall.holes.forEach((h) => { holeVisuals(h); updateHole(h); });
}

function registerHole(cells) {
  const h = { cells, b: C.bbox(cells), set: new Set(cells.map(([r, c]) => k(r, c))), filled: new Set(), pieces: [], status: 'open', hp: 0, maxHp: 1, size: cells.length / 5, jig: 0, sig: '' };
  const i = wall.holes.push(h) - 1;
  cells.forEach(([r, c]) => wall.cellHole.set(k(r, c), i));
  return h;
}
function holeVisuals(h) {
  const g = new THREE.Group();
  for (const [r, c] of h.cells) {
    const p = mesh(cellPlane, holeBackMat, false);
    p.position.set(X(c) + S / 2, Y(r) - S / 2, -STONE_D - 0.01);
    g.add(p);
  }
  const line = outline(h.cells, 0.02, '#ffd58a');
  line.position.set(X(0), Y(0), 0);
  g.add(line);
  wallGroup.add(g);
  h.label = document.createElement('div');
  $('labels').append(h.label);
}

let stones = null;
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
  const back = mesh(new THREE.PlaneGeometry(W * S, H * S), mat('#120b07', { roughness: 1 }), false);
  back.position.set(0, H * S / 2, -STONE_D - 0.02);
  wallGroup.add(back);
  wallGroup.add(makeGate());
  // Cave walls down both sides of the den, and rock piles where the wall meets them.
  const half = W * S / 2;
  const scenery = [];
  for (let i = 0; i < 9; i++) scenery.push(rock(-half - 0.6 - Math.random() * 1.2, Math.random() * H * S, -0.3, 0.7 + Math.random() * 0.6));
  for (let i = 0; i < 9; i++) scenery.push(rock(half + 0.6 + Math.random() * 1.2, Math.random() * H * S, -0.3, 0.7 + Math.random() * 0.6));
  for (let z = -14; z < 13; z += 1.4) {
    scenery.push(rock(-half - 2.2 - Math.random(), 0.4, z, 1 + Math.random() * 0.8));
    scenery.push(rock(half + 2.2 + Math.random(), 0.4, z, 1 + Math.random() * 0.8));
  }
  scenery.push(torch(-half + 0.5, 1.2), torch(half - 0.5, 1.2), torch(X(wall.gateCols.c0) - 0.5, 1), torch(X(wall.gateCols.c1 + 1) + 0.5, 1));
  // Out beyond the wall: a rocky rise for the raiders' cannon.
  const cx = half * 0.45;
  const mound = rock(cx, -0.4, -10.5, 1.8);
  mound.scale.set(1.4, 0.5, 1.2);
  cannon.position.set(cx, 0.6, -10.5);
  cannon.visible = false;
  scenery.push(mound, cannon);
  // Props inside: three crates for the piles, a scrap fire, the treasure chest.
  piles.forEach((p, i) => { p.x = (i - 1) * Math.min(3.4, half * 0.42); p.z = 5.6; p.crate.position.set(p.x, 0.32, p.z); scenery.push(p.crate); });
  barrel.position.set(half - 1.4, 0, 7.6);
  chest.position.set(-half + 1.8, 0, 8.4);
  scenery.push(barrel, chest);
  scenery.forEach((o) => { o.userData.scenery = true; den.add(o); });
  bounds = { x: half - 0.35, z0: 0.55, z1: 10.5 };
  obstacles = [...piles.map((p) => ({ x: p.x, z: p.z, r: 0.75 })), { x: barrel.position.x, z: barrel.position.z, r: 0.55 }, { x: chest.position.x, z: chest.position.z, r: 0.75 }];
  piles.forEach(showPile);
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

// ---------- piles (the toolbox), scrap fire, chest, cannon ----------
const crateGeo = new RoundedBoxGeometry(1.2, 0.64, 1.2, 2, 0.04);
const piles = [0, 1, 2].map(() => ({ x: 0, z: 0, letter: null, cells: null, group: null, crate: mesh(crateGeo, mat('#7a5230', { map: woodTex })) }));
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
const pirate = Object.assign(makePirate(), { x: 0, z: 7, bonkT: 0 });
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
let mouse = null, mouseMode = false;

function newGame() {
  raiders.splice(0).forEach((r) => scene.remove(r.m.g));
  if (carry) { scene.remove(carry.group); carry = null; }
  ghostKey = ''; ghost = null;
  Object.assign(G, { gold: 50, wave: 0, phase: 'build', phaseT: 40, toSpawn: 0, spawnT: 0, cannonT: 0, masters: 0, boarded: 0, bonked: 0, stolen: 0, over: false });
  piles.forEach(deal);
  newWall();
  Object.assign(pirate, { x: 0, z: 7 });
  $('end').classList.remove('on');
  $('intro').classList.remove('off');
  updateStats();
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
    if (h.status !== 'open') return;
    for (const [er, ec] of rest(h)) for (const [pr, pc] of cells) {
      const dr = er - pr, dc = ec - pc;
      if (seen.has(k(dr, dc))) continue;
      seen.add(k(dr, dc));
      let over = 0, ok = true;
      for (const [r, c] of cells) {
        const R = r + dr, Cc = c + dc, kk = k(R, Cc);
        if (R < 0 || R >= wall.H || Cc < 0 || Cc >= wall.W || wall.gate.has(kk) || wall.wood.has(kk)) { ok = false; break; }
        const ho = wall.cellHole.get(kk);
        if (ho === undefined) over++;
        else if (ho !== hi) { ok = false; break; }
      }
      if (ok) out.push({ dr, dc, hole: hi, over, cx: X(dc) + b.w * S / 2, cy: Y(dr) - b.h * S / 2, fr: dr + b.h / 2, fc: dc + b.w / 2 });
    }
  });
  return out;
}
const an = (l) => ('AEFILMNORSX'.includes(l) ? 'an ' : 'a ') + l;
function updateHole(h) {
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
function labelFor(h) {
  const atk = h.attackers ? `<em>⚔ ${h.attackers} raider${h.attackers > 1 ? 's' : ''} at it</em>` : '';
  if (h.status === 'master') return ['label done', `★ Masterpiece<i class="bar"><b></b></i>${atk}`];
  if (h.status === 'boarded') return ['label weak', `Boarded over: weak<i class="bar"><b></b></i>${atk}`];
  const left = h.open;
  const breach = h.attackers ? `<em>⚔ raiders can climb in!</em>` : '';
  if (!h.exact) return ['label bad', `No Masterpiece now<small>board it over to close it</small>${breach}`];
  if (left.length === 5) return ['label', `Needs ${an(C.identify(left))}${breach}`];
  if (left.length === 10) {
    const list = C.combos(left).map((c) => c.letters.join('+'));
    return ['label', `Two pieces<small>${list.slice(0, 3).join(' · ')}${list.length > 3 ? ' · …' : ''}</small>${breach}`];
  }
  return ['label', `${left.length / 5} pieces${breach}`];
}
function updateStats() {
  $('s-gold').textContent = Math.max(0, G.gold);
  $('s-wave').textContent = G.wave;
  $('s-master').textContent = G.masters;
  $('s-board').textContent = G.boarded;
  chestHeap.scale.y = 0.08 + 0.5 * Math.min(1, Math.max(0, G.gold) / 60);
}

// ---------- input ----------
addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if ([' ', 'tab', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) e.preventDefault();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) { keys.add(key); mouseMode = false; }
  if (e.repeat || G.over) return;
  if (key === ' ' || key === 'enter') act();
  else if (key === 'q' && carry) turn(rotCCW, 1);
  else if (key === 'e' && carry) turn(rotCW, -1);
  else if (key === 'f' && carry) turn(flip, 0);
  else if (key === 'tab') cycle++;
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
const ray = new THREE.Raycaster(), wallPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
renderer.domElement.addEventListener('mousemove', (e) => {
  ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1), camera);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(wallPlane, p)) { mouse = null; return; }
  const fc = p.x / S + wall.W / 2, fr = wall.H - p.y / S;
  mouse = fc >= -1 && fc <= wall.W + 1 && fr >= -1 && fr <= wall.H + 1 ? { fc, fr } : null;
  if (mouse) mouseMode = true;
});
renderer.domElement.addEventListener('mousedown', (e) => { if (e.button === 0 && !G.over) act(); });
renderer.domElement.addEventListener('wheel', (e) => { if (carry) turn(e.deltaY > 0 ? rotCW : rotCCW, e.deltaY > 0 ? -1 : 1); }, { passive: true });
renderer.domElement.addEventListener('contextmenu', (e) => { e.preventDefault(); if (carry) turn(flip, 0); });
$('again').onclick = () => newGame();

// ---------- actions ----------
function nearest(list, r) {
  let best = null, bd = r;
  for (const o of list) { const d = Math.hypot(o.x - pirate.x, o.z - pirate.z); if (d < bd) { bd = d; best = o; } }
  return best;
}
function focus() {
  const foe = nearest(raiders.filter((r) => r.inside && r.state !== 'down'), 1.6);
  if (foe) return { kind: 'bonk', foe };
  const p = nearest(piles, 1.55);
  if (p) return { kind: 'pile', p };
  if (nearest([{ x: barrel.position.x, z: barrel.position.z }], 1.35)) return { kind: 'barrel' };
  return { kind: 'wall' };
}
function act() {
  const f = focus();
  if (f.kind === 'bonk') return bonk(f.foe);
  if (f.kind === 'pile') {
    const p = f.p;
    if (!carry && p.letter) return pickUp(p);
    if (carry && carry.from === p && !p.letter) return putBack();
    if (carry && p.letter) { putBack(); return pickUp(p); }
  } else if (f.kind === 'barrel' && carry) return scrap();
  else if (carry && target?.ok) return place(target);
  else if (carry && target) shake = 0.2;
}
function pickUp(p) {
  $('intro').classList.add('off');
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
}
function place(t) {
  const h = wall.holes[t.hole];
  const cells = carry.cells.map(([r, c]) => [r + t.dr, c + t.dc]);
  const over = t.over > 0;
  const g = pieceGroup(carry.cells, woodMat(carry.letter));
  const from = carry.group.position.clone();
  // A clean fit sits flush in the hole; a board nailed over the stone sticks out in front of it.
  const to = new THREE.Vector3(X(t.dc), Y(t.dr), over ? WOOD_D - 0.12 : -0.04);
  const b = C.bbox(carry.cells);
  const off = new THREE.Vector3(-b.w * S / 2, b.h * S / 2, 0);
  scene.remove(carry.group);
  wallGroup.add(g);
  const pile = carry.from;
  carry = null;
  cells.forEach(([r, c]) => { wall.wood.add(k(r, c)); if (h.set.has(k(r, c))) h.filled.add(k(r, c)); });
  const piece = { group: g, cells: cells.map(([r, c]) => k(r, c)), over, base: to.clone() };
  h.pieces.push(piece);
  const wasExact = h.exact;
  tween(0.32, (s) => {
    const e = 1 - (1 - s) ** 3;
    g.position.lerpVectors(from.clone().add(off), to, e);
    g.position.z += Math.sin(s * Math.PI) * 0.6;
  }, () => {
    g.position.copy(to);
    if (!h.pieces.includes(piece)) return;   // knocked out while it was flying in
    updateHole(h);
    if (h.status === 'open' && wasExact && !h.exact) { shake = 0.3; toast('No Masterpiece in that hole now', true); }
  });
  refill(pile);
}
function refill(p) {
  setTimeout(() => {
    deal(p); showPile(p);
    const g = p.group, s0 = g.scale.x;
    tween(0.3, (s) => g.scale.setScalar(s0 * (1 - (1 - s) ** 3)));
  }, 450);
}
function scrap() {
  const g = carry.group, from = g.position.clone(), to = barrel.position.clone().setY(1.1);
  const pile = carry.from;
  carry = null;
  G.gold -= PAY.scrap;
  updateStats();
  tween(0.4, (s) => { g.position.lerpVectors(from, to, s); g.position.y += Math.sin(s * Math.PI) * 0.8; g.scale.setScalar(0.55 * (1 - s)); }, () => scene.remove(g));
  refill(pile);
}
function bonk(r) {
  pirate.bonkT = 0.3;
  r.state = 'down'; r.t = 0;
  G.bonked++;
  G.gold += PAY.bonk;
  if (r.loot) { G.gold += PAY.steal; r.loot.visible = false; r.loot = null; toast('Got the loot back!'); } else toast('Bonk!');
  burst(new THREE.Vector3(r.x, 1.4, r.z), '#ffe27a', 14, 2.5);
  shake = 0.15;
  updateStats();
}
function breakHole(h) {
  h.pieces.forEach(({ group: g, cells }) => {
    cells.forEach((kk) => wall.wood.delete(kk));
    const v = new THREE.Vector3((Math.random() - 0.5) * 2, 2 + Math.random(), 2.5 + Math.random() * 1.5);
    const p0 = g.position.clone();
    tween(0.8, (s) => { g.position.set(p0.x + v.x * s, p0.y + v.y * s - 9 * s * s, p0.z + v.z * s); g.rotation.x = s * 3; }, () => wallGroup.remove(g));
  });
  h.pieces = [];
  h.filled.clear();
  h.status = 'open';
  h.hp = 0;
  updateHole(h);
  burst(new THREE.Vector3(holeX(h), holeMidY(h), 0.3), '#c98a45', 24, 4);
  shake = 0.5;
  toast('They broke through!', true);
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
function pickHole(x) {
  const open = wall.holes.filter((h) => h.status === 'open');
  if (open.length) return open.sort((a, b) => Math.abs(holeX(a) - x) - Math.abs(holeX(b) - x))[0];
  return wall.holes.slice().sort((a, b) => a.hp - b.hp)[0];
}
function spawnRaider() {
  const m = makePirate({ shirt: ['#1f2433', ['#59607a', '#2f6b4f', '#6b2f5e'][rand(3)]], scarf: ['#2b2b2b', '#3a4a8a', '#7a1f1f'][rand(3)], trousers: '#5a4636', patch: Math.random() < 0.5, beard: ['#222', '#7a4a1a', '#999'][rand(3)], sword: true });
  m.g.scale.setScalar(0.82);
  const xr = addXray(m.g);
  const x = (Math.random() - 0.5) * wall.W * S * 0.9;
  const r = { m, xr, x, z: -14, state: 'approach', hole: pickHole(x), t: 0, stamina: RAIDER_STAMINA, hitT: 0.5, slot: (Math.random() - 0.5) * 1.2, inside: false, loot: null };
  m.g.position.set(r.x, 0, r.z);
  scene.add(m.g);
  raiders.push(r);
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
      moving = !moveTo(r, holeX(h) + r.slot, -1.15, 2.2, dt);
      if (!moving) { r.state = h.status === 'open' ? 'climb' : 'attack'; r.t = 0; }
      break;
    }
    case 'attack': {
      if (h.status === 'open') { r.state = 'climb'; r.t = 0; break; }
      faceTo(r.m, 0, 1, dt);
      r.stamina -= dt;
      h.hp -= RAIDER_DPS * dt;
      r.m.arms[1].rotation.x = -1.8 + Math.sin(r.t * 9) * 1.1;
      r.hitT -= dt;
      if (r.hitT <= 0) {
        r.hitT = 0.7;
        burst(new THREE.Vector3(holeX(h) + r.slot * 0.5, Math.min(holeMidY(h), 1.4), 0.25), '#c98a45', 4, 2);
        h.jig = 0.15;
      }
      if (h.hp <= 0) { breakHole(h); r.state = 'climb'; r.t = 0; }
      else if (r.stamina <= 0) r.state = 'leave';
      break;
    }
    case 'climb': case 'climbOut': {
      // Up over the sill and through the hole (or back out again).
      const s = Math.min(1, r.t / 1.3), into = r.state === 'climb';
      const z0 = into ? -1.15 : 1.2, z1 = into ? 1.2 : -1.15;
      r.z = z0 + (z1 - z0) * s;
      r.x += (holeX(h) - r.x) * Math.min(1, dt * 5);
      r.m.g.position.y = Math.sin(s * Math.PI) * (holeFootY(h) + 0.25);
      faceTo(r.m, 0, into ? 1 : -1, dt);
      r.inside = r.z > 0.3;
      if (s >= 1) { r.state = into ? 'raid' : 'leave'; r.t = 0; r.inside = into; }
      break;
    }
    case 'raid': {
      const c = chest.position;
      moving = !moveTo(r, c.x + 0.9, c.z - 0.2, 2.5, dt);
      if (!moving) {
        G.gold -= PAY.steal; G.stolen++;
        updateStats();
        toast(`A raider stole ${PAY.steal} doubloons!`, true);
        r.loot = mesh(new THREE.SphereGeometry(0.16, 10, 8), mat('#e8b23a', { metalness: 0.7, roughness: 0.3 }));
        r.loot.position.set(0, -0.5, 0.1);
        r.m.arms[0].add(r.loot);
        r.state = 'flee';
      }
      break;
    }
    case 'flee': {
      moving = !moveTo(r, holeX(h), 1.2, 2.8, dt);
      if (!moving) { r.state = 'climbOut'; r.t = 0; }
      break;
    }
    case 'leave': {
      r.inside = false;
      moving = !moveTo(r, r.x, -15, 2.4, dt);
      if (!moving) r.gone = true;
      break;
    }
    case 'down': {
      r.m.g.rotation.x = Math.max(-Math.PI / 2, -r.t * 6);
      r.m.g.position.y = 0.1;
      if (r.t > 1) r.m.g.scale.setScalar(Math.max(0.001, 0.82 * (1 - (r.t - 1) * 2)));
      if (r.t > 1.5) r.gone = true;
      break;
    }
  }
  if (r.state !== 'climb' && r.state !== 'climbOut' && r.state !== 'down') {
    const swing = animateWalk(r.m, moving, dt, 12);
    if (r.state === 'attack') {
      r.m.legs.forEach((l) => { l.rotation.x = 0; });
      r.m.arms[1].rotation.x = -1.8 + Math.sin(r.t * 9) * 1.1;
    } else r.m.arms[1].rotation.x = moving ? swing * 0.5 : -0.4;
  }
  r.m.g.position.x = r.x;
  r.m.g.position.z = r.z;
  const behind = r.z < -0.1;
  r.xr.forEach((x) => { x.visible = behind; });
}

// ---------- the cannon ----------
function fireCannon() {
  // Find a patch of solid stone, away from the gate and other holes, for a new hole.
  for (let tries = 0; tries < 200; tries++) {
    const shape = Math.random() < 0.6 ? lastGap() : C.genHole(2).hole;
    const b = C.bbox(shape);
    if (b.h > wall.H - 1 || b.w > wall.W - 2) continue;
    const r0 = 1 + rand(wall.H - b.h), c0 = 1 + rand(wall.W - b.w - 1);
    const cells = shape.map(([r, c]) => [r + r0, c + c0]);
    const clear = cells.every(([r, c]) => {
      if (r >= wall.H || c < 1 || c > wall.W - 2 || !wall.stoneAt.has(k(r, c))) return false;
      for (let a = -1; a <= 1; a++) for (let z = -1; z <= 1; z++) {
        const kk = k(r + a, c + z);
        if (wall.cellHole.has(kk) || wall.gate.has(kk) || wall.wood.has(kk)) return false;
      }
      return true;
    });
    if (!clear) continue;
    shoot(cells);
    return true;
  }
  return false;
}
function shoot(cells) {
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
    blast(cells);
  });
}
function blast(cells) {
  // Anything mended or opened there while the ball was in the air wins: skip those squares.
  cells = cells.filter(([r, c]) => wall.stoneAt.has(k(r, c)) && !wall.wood.has(k(r, c)));
  if (cells.length % 5 || !C.isConnected(cells)) return;
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
  holeVisuals(h);
  updateHole(h);
  burst(at, '#9a8a7a', 26, 4.5);
  shake = 0.6;
  toast('Cannon fire! A new hole', true);
}

// ---------- waves ----------
function startWave() {
  G.wave++;
  G.phase = 'wave';
  G.toSpawn = 2 + 2 * G.wave;
  G.spawnT = 0.5;
  G.cannonT = G.wave >= 2 ? 8 : Infinity;
  if (G.wave >= 2 && !cannon.visible) { cannon.visible = true; toast('They brought a cannon!', true); }
  else toast(`Wave ${G.wave}: raiders!`, true);
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
  G.cannonT -= dt;
  if (G.cannonT <= 0) { fireCannon(); G.cannonT = Math.max(9, 22 - 2 * G.wave); }
  if (!G.toSpawn && !raiders.length) { G.phase = 'calm'; G.phaseT = 15; toast(`Wave ${G.wave} beaten off!`); }
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
  $('end-text').textContent = `They emptied the chest in wave ${G.wave}. You built ${G.masters} Masterpiece${G.masters === 1 ? '' : 's'}, boarded over ${G.boarded} hole${G.boarded === 1 ? '' : 's'} and bonked ${G.bonked} raider${G.bonked === 1 ? '' : 's'}.`;
  setTimeout(() => $('end').classList.add('on'), 900);
}

// ---------- where the carried piece would go ----------
const ghostMats = {
  ok: new THREE.MeshBasicMaterial({ color: '#7dff7a', transparent: true, opacity: 0.45, depthWrite: false }),
  over: new THREE.MeshBasicMaterial({ color: '#ffb84a', transparent: true, opacity: 0.5, depthWrite: false }),
  no: new THREE.MeshBasicMaterial({ color: '#ff5a4a', transparent: true, opacity: 0.4, depthWrite: false }),
};
function aim() {
  target = null;
  if (!carry || pirate.z > WALL_Z + 2.5) return;
  const list = fits(carry.cells);
  const b = C.bbox(carry.cells);
  const reach = (o) => Math.abs(o.cx - pirate.x) <= REACH && pirate.z <= WALL_Z;
  if (mouseMode && mouse) {
    const d = (o) => Math.hypot(o.fc - mouse.fc, o.fr - mouse.fr) + (o.over ? 0.35 : 0);
    list.sort((a, z) => d(a) - d(z));
    const best = list[0];
    if (best && d(best) <= 1.8) target = { ...best, ok: reach(best), far: !reach(best) };
    else target = { dr: Math.round(mouse.fr - b.h / 2), dc: Math.round(mouse.fc - b.w / 2), ok: false };
  } else if (pirate.z <= WALL_Z) {
    // Clean fits first, nearest first; then the ways to board it over.
    const near = list.filter(reach).sort((a, z) => (a.over > 0) - (z.over > 0) || Math.abs(a.cx - pirate.x) - Math.abs(z.cx - pirate.x) || a.over - z.over);
    if (near.length) target = { ...near[cycle % near.length], ok: true, count: near.length };
  }
}
function drawGhost() {
  const kind = !target ? '' : !target.ok ? 'no' : target.over ? 'over' : 'ok';
  const want = target && carry ? `${carry.cells.map((x) => x.join()).join(';')}|${target.dr},${target.dc}|${kind}` : '';
  if (want === ghostKey) return;
  ghostKey = want;
  if (ghost) { wallGroup.remove(ghost); ghost = null; }
  if (!want) return;
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(S * 0.98, S * 0.98, 0.12);
  for (const [r, c] of carry.cells) {
    const b = new THREE.Mesh(geo, ghostMats[kind]);
    b.position.set((c + 0.5) * S, -(r + 0.5) * S, kind === 'over' ? 0.45 : 0.08);
    g.add(b);
  }
  g.add(outline(carry.cells, kind === 'over' ? 0.52 : 0.15, kind === 'no' ? '#ffd0c8' : '#fff4d0'));
  g.position.set(X(target.dc), Y(target.dr), 0);
  wallGroup.add(g);
  ghost = g;
}
function prompt() {
  const f = focus();
  let t = '';
  if (f.kind === 'bonk') t = 'Space: bonk the raider!';
  else if (f.kind === 'pile') {
    if (!carry && f.p.letter) t = `Space: pick up the ${f.p.letter}`;
    else if (carry && carry.from === f.p && !f.p.letter) t = `Space: put the ${carry.letter} back`;
    else if (carry && f.p.letter) t = `Space: swap the ${carry.letter} for the ${f.p.letter}`;
  } else if (f.kind === 'barrel') t = carry ? `Space: burn the ${carry.letter} (costs ${PAY.scrap} doubloon)` : 'The scrap fire, for pieces you can\'t use';
  else if (carry) {
    const more = target?.count > 1 ? ` · Tab: other spots (${target.count})` : '';
    if (target?.ok && !target.over) t = `Space: fit the ${carry.letter} here${more}`;
    else if (target?.ok) t = `Space: board it over (weak, no Masterpiece)${more}`;
    else if (target?.far) t = 'Walk closer to fit it there';
    else if (pirate.z <= WALL_Z || (mouseMode && mouse)) t = `The ${carry.letter} won't go there · Q/E turn · F flip`;
    else t = `Carry the ${carry.letter} to a hole`;
  } else t = 'Fetch a piece from the piles';
  const el = $('prompt');
  if (el.textContent !== t) el.textContent = t;
}

// ---------- main loop ----------
const clock = new THREE.Clock();
const camAt = new THREE.Vector3(0, 7.4, 14.2), camLook = new THREE.Vector3(0, 1.8, 3.6);
camera.position.copy(camAt);
const v3 = new THREE.Vector3();
function frame() {
  update(Math.min(clock.getDelta(), 0.05));
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
function update(dt) {
  // Walk.
  let mx = 0, mz = 0;
  if (!G.over) {
    if (keys.has('a') || keys.has('arrowleft')) mx--;
    if (keys.has('d') || keys.has('arrowright')) mx++;
    if (keys.has('w') || keys.has('arrowup')) mz--;
    if (keys.has('s') || keys.has('arrowdown')) mz++;
  }
  const moving = !!(mx || mz);
  if (moving) {
    const n = Math.hypot(mx, mz);
    pirate.x += mx / n * SPEED * dt;
    pirate.z += mz / n * SPEED * dt;
    for (const o of obstacles) {
      const dx = pirate.x - o.x, dz = pirate.z - o.z, d = Math.hypot(dx, dz), min = o.r + 0.3;
      if (d < min && d > 0) { pirate.x = o.x + dx / d * min; pirate.z = o.z + dz / d * min; }
    }
    pirate.x = Math.max(-bounds.x, Math.min(bounds.x, pirate.x));
    pirate.z = Math.max(bounds.z0, Math.min(bounds.z1, pirate.z));
    faceTo(pirate, mx, mz, dt * 1.2);
  }
  animateWalk(pirate, moving, dt);
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

  if (!G.over) {
    updateWaves(dt);
    for (let i = raiders.length - 1; i >= 0; i--) {
      const r = raiders[i];
      updateRaider(r, dt);
      if (r.gone) { scene.remove(r.m.g); raiders.splice(i, 1); }
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

  // Camera follows the pirate, always looking at the wall and a little over it.
  const cz = Math.min(pirate.z, 7.5);
  camAt.lerp(v3.set(pirate.x * 0.55, 7.4, cz + 7.2), Math.min(1, dt * 3));
  camera.position.copy(camAt);
  if (shake > 0) { camera.position.x += (Math.random() - 0.5) * shake * 0.5; camera.position.y += (Math.random() - 0.5) * shake * 0.5; shake = Math.max(0, shake - dt); }
  camLook.lerp(v3.set(pirate.x * 0.55, 1.8, cz - 3.4), Math.min(1, dt * 3));
  camera.lookAt(camLook);

  // Hole labels float above each hole, with a strength bar for mended ones.
  for (const h of wall.holes) {
    h.attackers = raiders.filter((r) => r.hole === h && (r.state === 'approach' || r.state === 'attack')).length;
    const [cls, html] = labelFor(h);
    if (h.sig !== cls + html) { h.sig = cls + html; h.label.className = cls; h.label.innerHTML = html; }
    const bar = h.label.querySelector('.bar b');
    if (bar) bar.style.width = `${Math.max(0, h.hp / h.maxHp) * 100}%`;
    v3.set(holeX(h), Y(h.b.r0) + 0.15, 0.1).project(camera);
    h.label.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
    h.label.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
    // A patch under attack shudders.
    if (h.jig > 0) {
      h.jig = Math.max(0, h.jig - dt);
      h.pieces.forEach((p) => { p.group.position.x = p.base.x + (Math.random() - 0.5) * h.jig * 0.4; });
      if (!h.jig) h.pieces.forEach((p) => { p.group.position.x = p.base.x; });
    }
  }
}

newGame();
requestAnimationFrame(frame);

// For poking at it from the console.
window.den = { get wall() { return wall; }, pirate, piles, raiders, G, get carry() { return carry; }, get target() { return target; }, act, startWave, fireCannon, spawnRaider, fits,
  // Run the game forward by hand (for testing while the tab is in the background).
  step(secs) { for (let t = 0; t < secs; t += 1 / 30) update(1 / 30); renderer.render(scene, camera); } };
