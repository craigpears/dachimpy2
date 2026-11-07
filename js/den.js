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
const HP = { master: 45, boarded: 10, piece: 4, patch: 12 };   // seconds of one raider hacking at it (piece: each piece in an unfinished hole; patch: a board nailed over a damaged one)
const MAX_PATCHES = 3;
const PAY = { master: 10, boarded: 2, bonk: 3, steal: 10 };
const BUILD_SECS = 75, CALM_SECS = 20;
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
  let col = 3, gate = null;   // room at each end for the stairs up to the wall-walk
  const placed = shapes.map((s, i) => {
    if (i === 2) { gate = { c0: col, c1: col + 3 }; col += 6; }
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
  scenery.push(makeRampart());
  scenery.push(torch(-half + 1.75, ramp.zBot + 0.3), torch(half - 1.75, ramp.zBot + 0.3), torch(X(wall.gateCols.c0) - 0.5, 1), torch(X(wall.gateCols.c1 + 1) + 0.5, 1));
  // Out beyond the wall: a rocky rise for the raiders' cannon.
  const cx = half * 0.45;
  const mound = rock(cx, -0.4, -10.5, 1.8);
  mound.scale.set(1.4, 0.5, 1.2);
  cannon.position.set(cx, 0.6, -10.5);
  cannon.visible = false;
  scenery.push(mound, cannon);
  // Props inside: three crates for the piles, a fire barrel, the treasure chest.
  piles.forEach((p, i) => { p.x = (i - 1) * Math.min(3.4, half * 0.42); p.z = 6.3; p.crate.position.set(p.x, 0.32, p.z); scenery.push(p.crate); });
  barrel.position.set(half - 1.4, 0, 7.6);
  chest.position.set(-half + 1.8, 0, 8.4);
  scenery.push(barrel, chest);
  scenery.forEach((o) => { o.userData.scenery = true; den.add(o); });
  bounds = { x: half - 0.35, z0: 0.55, z1: 10.5 };
  obstacles = [...piles.map((p) => ({ x: p.x, z: p.z, r: 0.75 })), { x: barrel.position.x, z: barrel.position.z, r: 0.55 }, { x: chest.position.x, z: chest.position.z, r: 0.75 }];
  piles.forEach(showPile);
}

/* The rampart: a plank walk along the top of the wall, like a ship's deck behind a rail, with stairs up from the
   den at either end. Up there the pirate can see over the wall and throw pieces down on the
   raiders hacking at it. */
let ramp = null;
function makeRampart() {
  const half = wall.W * S / 2, T = wall.H * S + 0.38, zTop = 0.45, run = T, zBot = zTop + run;
  const n = Math.max(8, Math.round(T / 0.24)), sw = 1.1;
  // Three stretches, each built separately (left, right, then middle); the stairs come with the end ones.
  const cuts = [0, Math.round(wall.W / 3), Math.round(wall.W * 2 / 3), wall.W];
  const secs = [0, 1, 2].map((i) => ({ c0: cuts[i], c1: cuts[i + 1] - 1, x0: X(cuts[i]), x1: X(cuts[i + 1]), built: false, g: new THREE.Group() }));
  ramp = { T, half, zTop, zBot, run, n, secs, stairs: [[-half + 0.2, -half + 0.2 + sw], [half - 0.2 - sw, half - 0.2]] };
  const g = new THREE.Group();
  const secAt = (x) => secs.find((s) => x >= s.x0 - 0.01 && x <= s.x1 + 0.01) || secs[2];
  const plank = mat('#6b4426', { map: woodTex }), post = mat('#4a2f1a', { map: woodTex }), rope = mat('#c9a66b', { roughness: 1 });
  for (const s of secs) {
    s.g.visible = false;
    g.add(s.g);
    const deck = mesh(new THREE.BoxGeometry(s.x1 - s.x0, 0.1, 1.3), plank);
    deck.position.set((s.x0 + s.x1) / 2, T - 0.05, -0.2);
    const top = mesh(new THREE.BoxGeometry(s.x1 - s.x0 - 0.1, 0.08, 0.14), post);
    top.position.set((s.x0 + s.x1) / 2, T + 0.82, -0.75);
    s.g.add(deck, top);
  }
  // A ship's rail along the outer edge: posts, a timber top rail and a sagging rope between.
  for (let x = -half + 0.25; x <= half - 0.2; x += 1.2) {
    const p = mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.8, 8), post);
    p.position.set(x, T + 0.4, -0.75);
    secAt(x).g.add(p);
    if (x + 1.2 <= half - 0.2) {
      const r = mesh(new THREE.TorusGeometry(0.6, 0.025, 5, 16, Math.PI), rope, false);
      r.rotation.z = Math.PI;
      r.scale.y = 0.35;
      r.position.set(x + 0.6, T + 0.55, -0.75);
      secAt(x + 0.6).g.add(r);
    }
  }
  // A coil of rope, and the Jolly Roger flying at each end.
  const coil = mesh(new THREE.TorusGeometry(0.18, 0.06, 6, 16), rope);
  coil.rotation.x = Math.PI / 2;
  coil.position.set(-half * 0.1, T + 0.06, 0.25);
  secs[1].g.add(coil);
  const flagTex = canvasTex(64, 44, (c, w, h) => {
    c.fillStyle = '#111'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#f2ead8';
    c.beginPath(); c.arc(32, 18, 9, 0, Math.PI * 2); c.fill();
    c.fillRect(27, 24, 10, 6);
    c.lineWidth = 4; c.strokeStyle = '#f2ead8';
    c.beginPath(); c.moveTo(16, 30); c.lineTo(48, 40); c.moveTo(48, 30); c.lineTo(16, 40); c.stroke();
    c.fillStyle = '#111'; c.fillRect(27, 15, 4, 4); c.fillRect(33, 15, 4, 4);
  });
  for (const sx of [-1, 1]) {
    const x = sx * (half - 1.6);
    const pole = mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.2, 8), post);
    pole.position.set(x, T + 1.1, -0.62);
    const flag = mesh(new THREE.PlaneGeometry(0.9, 0.6), new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 1 }), false);
    flag.position.set(x + sx * 0.47, T + 1.9, -0.62);
    if (sx < 0) flag.scale.x = -1;
    secs[sx < 0 ? 0 : 2].g.add(pole, flag);
  }
  // Stairs up from the den floor at each end, against the side of the cave.
  ramp.stairs.forEach(([x0, x1], si) => {
    const sg = secs[si ? 2 : 0].g;
    for (let i = 0; i < n; i++) {
      const h = T * (i + 1) / n;
      const step = mesh(new THREE.BoxGeometry(x1 - x0, h, run / n + 0.01), plank);
      step.position.set((x0 + x1) / 2, h / 2, zBot - (i + 0.5) * run / n);
      sg.add(step);
    }
    const rx = Math.abs(x0) < Math.abs(x1) ? x0 + 0.05 : x1 - 0.05;
    const len = Math.hypot(run, T);
    const rail = mesh(new THREE.BoxGeometry(0.07, 0.07, len), post);
    rail.position.set(rx, T / 2 + 0.85, zTop + run / 2);
    rail.rotation.x = Math.atan2(T, run);
    sg.add(rail);
    [zBot - 0.1, zTop + 0.1].forEach((z, i) => {
      const p = mesh(new THREE.BoxGeometry(0.1, 0.95, 0.1), post);
      p.position.set(rx, (i ? T : 0) + 0.47, z);
      sg.add(p);
    });
  });
  return g;
}
/* Building the rampart: after each of the first three waves, timber arrives for one stretch and a
   frame is laid out on the den floor in front of it: a carpentry puzzle lying flat. Lay pieces in
   it one at a time; they stay where you put them. A piece may stick out over the edge (so any piece
   will do), and the spare is sawn off when the frame's full. Then the finished deck is hoisted up
   onto the wall. */
const SECTION_ORDER = [0, 2, 1];
const FRAME_Z = WALL_Z + 0.25;   // just behind where you stand to mend the wall
const frameMat = mat('#4a3220', { roughness: 1 });
const railMat = mat('#8a5a30', { map: woodTex });
const railGeo = [new THREE.BoxGeometry(0.06, S + 0.06, 0.07), new THREE.BoxGeometry(S + 0.06, 0.06, 0.07)];
const frames = () => (ramp ? ramp.secs.filter((s) => s.frame && !s.frame.done).map((s) => s.frame) : []);
function openFrame(si, shape = null) {
  const s = ramp.secs[si];
  if (s.frame || s.built) return s.frame;   // one frame per stretch
  // Clear of the stairs and torches at the ends.
  const lo = s.x0 + (si === 0 ? 2.4 : 0.4), hi = s.x1 - (si === 2 ? 2.4 : 0.4);
  for (let i = 0; i < 400 && !shape; i++) {
    const c = C.normalize(C.genHole(i < 250 ? 4 : 3).hole), b = C.bbox(c);
    if (b.h <= 4 && b.w * S <= hi - lo) shape = c;
  }
  if (!shape) { buildSection(si); return null; }
  if (isHost()) send('all', { t: 'frame', si, cells: shape });
  const b = C.bbox(shape), x0 = (lo + hi) / 2 - b.w * S / 2;
  // Laid flat: the frame's rows run from the wall towards the den, its "front" faces up.
  const g = new THREE.Group();
  g.position.set(x0, 0, FRAME_Z);
  g.rotation.x = -Math.PI / 2;
  const set = new Set(shape.map(([r, c]) => k(r, c)));
  for (const [r, c] of shape) {
    const p = mesh(cellPlane, frameMat, false);
    p.receiveShadow = true;
    p.position.set((c + 0.5) * S, -(r + 0.5) * S, 0.012);
    g.add(p);
    // A low timber rail round the edge, so it reads as a frame to fill.
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
  const label = document.createElement('div');
  $('labels').append(label);
  const f = s.frame = { si, x0, z0: FRAME_Z, cells: shape, b, set, occ: new Set(), filled: new Set(), pieces: [], scrapCells: [], group: g, label, sig: '', done: false };
  frameState(f);
  burst(new THREE.Vector3(x0 + b.w * S / 2, 0.3, FRAME_Z + b.h * S / 2), '#e8c890', 18, 3);
  return f;
}
function frameState(f) {
  f.open = f.cells.filter(([r, c]) => !f.filled.has(k(r, c)));
  f.exact = f.open.length % 5 === 0 && C.solve(f.open, 1).length > 0;
  f.sig = '';
}
// Every spot a piece could lie in a frame: covering at least one empty square of it, clear of
// the pieces already there. Squares off the frame are allowed; `over` counts them.
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
        if (f.occ.has(kk)) { ok = false; break; }
        if (!f.set.has(kk)) over++;
      }
      if (ok) out.push({ frame: f, dr, dc, over, cx: f.x0 + (dc + b.w / 2) * S, cz: f.z0 + (dr + b.h / 2) * S });
    }
  }
  return out;
}
// A piece lying in a frame, where it ends up (no flying in): for placing, and for a joiner's copy.
function putFramePiece(f, i) {
  const g = pieceGroup(i.shape, woodMat(i.letter));
  g.position.set(i.dc * S, -i.dr * S, 0.1);
  f.group.add(g);
  const cells = i.shape.map(([r, c]) => k(r + i.dr, c + i.dc));
  cells.forEach((kk) => { f.occ.add(kk); if (f.set.has(kk)) f.filled.add(kk); });
  const b = C.bbox(i.shape);
  const piece = { group: g, cells, shape: i.shape, over: i.over, cx: f.x0 + (i.dc + b.w / 2) * S, cz: f.z0 + (i.dr + b.h / 2) * S, by: i.by, info: i, undo: null };
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
  if (isHost()) send('all', { t: 'place', frame: f.si, ...info });
  tween(0.32, (s) => {
    g.position.lerpVectors(from.clone().add(off), to, 1 - (1 - s) ** 3);
    g.position.z += Math.sin(s * Math.PI) * 0.6;
  }, () => {
    g.position.copy(to);
    if (!f.pieces.includes(piece)) return;
    undo.hpAfter = 0;
    burst(new THREE.Vector3(piece.cx, 0.15, piece.cz), '#e8c890', 8, 2);
    if (f.filled.size === f.cells.length) finishFrame(f);
    else if (piece.over && by === myId()) toast('It sticks out over the frame: the spare gets sawn off', false, true);
  });
  refill(hand.from);
}
/* You can never get stuck: a gap in a frame that none of the pieces to hand (carried or on the
   crates) could reach any more, walled in by the pieces round it, gets plugged with offcuts. It
   costs the Shipshape bonus. */
const scrapMat = mat('#b08a5a', { map: woodTex });
const scrapGeo = new THREE.BoxGeometry(S * 0.96, S * 0.96, 0.16);
function plugGaps(f) {
  const have = new Set([carry?.letter, ...piles.map((p) => p.letter)].filter(Boolean));
  const orients = C.ORIENTS.filter((o) => have.has(o.letter));
  const reachable = (r0, c0) => orients.some((o) => o.cells.some(([pr, pc]) => o.cells.every(([r, c]) => !f.occ.has(k(r - pr + r0, c - pc + c0)))));
  const dead = f.open.filter(([r, c]) => !reachable(r, c));
  if (!dead.length) return 0;
  plugCells(f, dead);
  if (isHost()) send('all', { t: 'plug', si: f.si, cells: dead });
  return dead.length;
}
function plugCells(f, cells) {
  for (const [r, c] of cells) {
    f.occ.add(k(r, c)); f.filled.add(k(r, c));
    f.scrapCells.push([r, c]);
    const m = mesh(scrapGeo, scrapMat);
    m.position.set((c + 0.5) * S, -(r + 0.5) * S, 0.02);
    f.group.add(m);
    burst(new THREE.Vector3(f.x0 + (c + 0.5) * S, 0.2, f.z0 + (r + 0.5) * S), '#f0d9a8', 6, 2);
  }
  frameState(f);
}
// Checked whenever the crates are dealt afresh.
function checkGaps() {
  for (const f of frames()) {
    if (!plugGaps(f)) continue;
    if (lastPlaced?.frame === f) lastPlaced = null;
    toast('A gap none of your pieces can reach: plugged with offcuts', false, true);
    if (f.filled.size === f.cells.length) finishFrame(f);
  }
}
// The frame's full: saw off what sticks out, then hoist the deck up onto the wall.
function finishFrame(f) {
  if (f.done) return;
  f.done = true;
  f.label.remove();
  if (lastPlaced?.frame === f) lastPlaced = null;
  let waste = 0;
  for (const p of f.pieces) {
    const kept = [], old = p.group.children[p.group.children.length - 1];
    p.shape.forEach((cell, i) => {
      if (f.set.has(p.cells[i])) { kept.push(cell); return; }
      waste++;
      const m = p.group.children[i], at = new THREE.Vector3();
      m.getWorldPosition(at);
      burst(at.setY(0.2), '#f0d9a8', 10, 2.5);
      m.visible = false;
    });
    old.visible = false;
    p.group.add(outline(kept, 0.002, '#4a2a12'));
  }
  if (waste || f.scrapCells.length) toast(waste ? `Sawn to fit: ${waste} square${waste > 1 ? 's' : ''} of offcuts` : 'Patched with offcuts: it\'ll do');
  else { G.gold += PAY.master; updateStats(); toast(`Shipshape! Not a scrap wasted (+${PAY.master})`); }
  const g = f.group, p0 = g.position.clone(), p1 = new THREE.Vector3(p0.x, ramp.T - 0.05, -0.85);
  const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
  tween(0.9, () => {}, () => tween(1.5, (u) => {
    // Up first, then in over the top of the wall.
    g.position.y = p0.y + (p1.y - p0.y) * ease(Math.min(1, u * 1.6));
    g.position.z = p0.z + (p1.z - p0.z) * ease(Math.max(0, (u - 0.35) / 0.65));
  }, () => { den.remove(g); buildSection(f.si); }));
}
function buildSection(si, quiet = false) {
  const s = ramp.secs[si];
  if (s.built) return;
  s.built = true;
  s.g.visible = true;
  if (quiet) return;
  tween(0.5, (t) => { s.g.scale.y = 0.01 + 0.99 * (1 - (1 - t) ** 3); s.g.position.y = ramp.T * (1 - s.g.scale.y) * 0.98; }, () => { s.g.scale.y = 1; s.g.position.y = 0; });
  for (let i = 0; i < 3; i++) burst(new THREE.Vector3(s.x0 + Math.random() * (s.x1 - s.x0), ramp.T, 0), '#e8c890', 12, 3);
  toast(ramp.secs.every((x) => x.built) ? 'The whole rampart is up!' : 'Rampart built: climb up and throw from the wall!');
}
const builtAt = (x) => ramp.secs.some((s) => s.built && x >= s.x0 - 0.01 && x <= s.x1 + 0.01);
// How high the floor is here: the wall-walk, the stairs, or the ground. `pad` widens the stairs'
// footprint a little, so you bump into their side instead of walking into them.
function heightAt(x, z, pad = 0) {
  if (!ramp) return 0;
  if (z <= ramp.zTop && Math.abs(x) <= ramp.half && builtAt(x)) return ramp.T;
  for (const [si, [x0, x1]] of ramp.stairs.entries()) {
    if (!ramp.secs[si ? 2 : 0].built) continue;
    if (x >= x0 - pad && x <= x1 + pad && z < ramp.zBot + pad) return Math.max(0, Math.min(ramp.T, ramp.T * (ramp.zBot - z) / ramp.run + ramp.T / (2 * ramp.n)));
  }
  return 0;
}
const onRampart = () => ramp && pirate.h > ramp.T - 0.15;

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
const pirate = Object.assign(makePirate(), { x: 0, z: 8, bonkT: 0, h: 0 });
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

function newGame() {
  if (guest()) return send('host', { t: 'again' });
  raiders.splice(0).forEach((r) => { scene.remove(r.m.g); r.mark.remove(); });
  if (carry) { scene.remove(carry.group); carry = null; }
  ghostKey = ''; ghost = null;
  Object.assign(G, { gold: 60, wave: 0, phase: 'build', phaseT: BUILD_SECS, toSpawn: 0, spawnT: 0, cannonT: 0, masters: 0, boarded: 0, bonked: 0, stolen: 0, over: false });
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
    if (h.status !== 'open' || h.pieces.some((p) => p.patch)) return;
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
/* Boards behind: any mended hole can take a piece nailed over it on the den side, a second (and
   third, fourth) layer that raiders must hack through one at a time after the hole itself. So a
   piece that fits nowhere still has a use. A board may cover the hole's own wood and the stone round
   it, but nothing of another hole, the gate, or another board in the same layer. */
const patchZ = (layer) => WOOD_D - 0.12 + 0.14 * (layer + 1);
function patchFits(cells) {
  const out = [], b = C.bbox(cells);
  wall.holes.forEach((h, hi) => {
    const layer = boardsOf(h).length;
    if ((h.status === 'open' && !layer) || layer >= MAX_PATCHES) return;
    const own = new Set(h.pieces.filter((p) => !p.patch).flatMap((p) => p.cells)), seen = new Set();
    for (const [er, ec] of h.cells) for (const [pr, pc] of cells) {
      const dr = er - pr, dc = ec - pc;
      if (seen.has(k(dr, dc))) continue;
      seen.add(k(dr, dc));
      const ok = cells.every(([r, c]) => {
        const R = r + dr, Cc = c + dc, kk = k(R, Cc), ho = wall.cellHole.get(kk);
        return R >= 0 && R < wall.H && Cc >= 0 && Cc < wall.W && !wall.gate.has(kk) && (ho === undefined || ho === hi) && (!wall.wood.has(kk) || own.has(kk)) && !wall.lining[layer].has(kk);
      });
      if (ok) out.push({ dr, dc, hole: hi, over: 1, patch: true, layer, cx: X(dc) + b.w * S / 2, cy: Y(dr) - b.h * S / 2, fr: dr + b.h / 2, fc: dc + b.w / 2 });
    }
  });
  return out;
}
// Number each hole's boards from the stone outwards again (after one's broken or taken off), and
// note which squares each layer covers.
function relining() {
  wall.lining.forEach((s) => s.clear());
  for (const h of wall.holes) boardsOf(h).forEach((p, i) => {
    if (p.layer !== i) {
      p.layer = i;
      if (p.info) p.info.layer = i;
      const z0 = p.group.position.z, z1 = patchZ(i);
      p.base.z = z1;
      tween(0.25, (s) => { p.group.position.z = z0 + (z1 - z0) * s; });
    }
    p.cells.forEach((kk) => wall.lining[i].add(kk));
  });
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
const boardsOf = (h) => h.pieces.filter((p) => p.patch).sort((a, b) => a.layer - b.layer);
// How full the strength bar is: the hole's own wood, or once that's gone, the board they're on.
const barFrac = (h) => (h.status !== 'open' || h.pieces.some((p) => !p.patch) ? h.hp / h.maxHp : (boardsOf(h)[0]?.hp ?? 0) / HP.patch);
function labelFor(h) {
  const atk = h.attackers ? `<em>⚔ ${h.attackers} raider${h.attackers > 1 ? 's' : ''} at it</em>` : '';
  const boards = boardsOf(h).length, bs = boards > 1 ? 's' : '';
  const behind = boards ? ` · ${boards} board${bs} behind` : '';
  const hurt = h.hp < h.maxHp * 0.8 && boards < MAX_PATCHES ? '<small>damaged: nail a board on behind it</small>' : '';
  if (h.status === 'master') return ['label done', `★ Masterpiece${behind}${hurt}<i class="bar"><b></b></i>${atk}`];
  if (h.status === 'boarded') return ['label weak', `Boarded over: weak${behind}${hurt}<i class="bar"><b></b></i>${atk}`];
  if (boards) return ['label weak', `Hacked open: ${boards} board${bs} hold${boards > 1 ? '' : 's'}<small>they must get through each one</small><i class="bar"><b></b></i>${atk}`];
  const left = h.open;
  const breach = h.pieces.length ? `<i class="bar part"><b></b></i>${atk}` : h.attackers ? `<em>⚔ raiders can climb in!</em>` : '';
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
  const need = left.length === 5 && f.exact ? `needs ${an(C.identify(left))}` : f.exact ? `room for ${left.length / 5} more pieces` : `${left.length} squares left: any piece, the spare's sawn off`;
  return ['label deck', `Rampart frame<small>${need}</small>`];
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
  if (e.target instanceof HTMLInputElement) return;
  const key = e.key.toLowerCase();
  if ([' ', 'tab', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) e.preventDefault();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) { keys.add(key); mouseMode = false; }
  if (key === 'z' || key === 'c') keys.add(key);
  if (e.repeat || G.over) return;
  if (key === ' ' || key === 'enter') act();
  else if (key === 'q' && carry) turn(rotCCW, 1);
  else if (key === 'e' && carry) turn(rotCW, -1);
  else if (key === 'f' && carry) turn(flip, 0);
  else if (key === 'tab') cycle++;
  else if (key === 'backspace' && canTakeBack()) takeBack();
  else if ((key === 'shift' || key === 'r') && carry && aimFoe()) throwAt(aimFoe());
  else if (key === 'v') Object.assign(view, { yaw: 0, pitch: 0, zoom: 1 });
  else if (key === '-' || key === '_') view.zoom = Math.min(2, view.zoom * 1.15);
  else if (key === '=' || key === '+') view.zoom = Math.max(0.55, view.zoom / 1.15);
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
const ray = new THREE.Raycaster(), wallPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
renderer.domElement.addEventListener('mousemove', (e) => {
  ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1), camera);
  const p = new THREE.Vector3();
  const nearFrame = (f) => p.x > f.x0 - 1.2 && p.x < f.x0 + f.b.w * S + 1.2 && p.z < f.z0 + f.b.h * S + 1.2;
  if (pirate.h < 0.3 && ray.ray.intersectPlane(floorPlane, p) && p.z > WALL_Z - 0.3 && frames().some(nearFrame)) { mouse = { floor: true, x: p.x, z: p.z }; mouseMode = true; return; }
  if (!ray.ray.intersectPlane(wallPlane, p)) { mouse = null; return; }
  const fc = p.x / S + wall.W / 2, fr = wall.H - p.y / S;
  mouse = fc >= -1 && fc <= wall.W + 1 && fr >= -1 && fr <= wall.H + 1 ? { fc, fr } : null;
  if (mouse) mouseMode = true;
});
addEventListener('mousemove', (e) => { cursor = { x: e.clientX, y: e.clientY }; });
document.addEventListener('mouseleave', () => { cursor = null; });
// Left click: throw at the raider you clicked on, otherwise pick up / fit. Right-drag turns the
// camera; a right click without dragging flips the piece.
let drag = null;
renderer.domElement.addEventListener('mousedown', (e) => {
  if (e.button === 2) { drag = { x: e.clientX, y: e.clientY, moved: false }; return; }
  if (e.button !== 0 || G.over) return;
  // Up on the rampart there's nothing to fit, so a click anywhere throws at the raider nearest it.
  const r = carry && clickedFoe(e.clientX, e.clientY, pirate.h > 0.3 ? 1e4 : 90);
  if (r) throwAt(r); else act();
});
addEventListener('mousemove', (e) => {
  if (!drag || !(e.buttons & 2)) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
  if (!drag.moved) return;
  view.yaw = Math.max(-1.3, Math.min(1.3, view.yaw - dx * 0.006));
  view.pitch = Math.max(-0.35, Math.min(0.9, view.pitch + dy * 0.004));
  drag.x = e.clientX; drag.y = e.clientY;
});
addEventListener('mouseup', (e) => {
  if (e.button !== 2 || !drag) return;
  if (!drag.moved && carry && !G.over) turn(flip, 0);
  drag = null;
});
// The wheel turns the piece while it's showing a spot to fit it; otherwise it zooms.
let wheelAcc = 0, wheelT = 0;
renderer.domElement.addEventListener('wheel', (e) => {
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
const atWall = (r) => !r.inside && free(r) && (r.state === 'attack' || (r.state === 'approach' && r.z > -6));
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
  if (pirate.h > 0.3) { if (carry && onRampart() && aimFoe()) throwAt(aimFoe()); return; }
  if (f.kind === 'pile') {
    const p = f.p;
    if (!carry && p.letter) return pickUp(p);
    if (carry && carry.from === p && !p.letter) return putBack();
    if (carry && p.letter && carry.from) { putBack(); return pickUp(p); }
  } else if (!carry && canTakeBack()) return takeBack();
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
}
/* Fitting a piece: yours (from your hands), or a crewmate's (`by`, with `hand` made at their
   head). A guest asks the host first; the piece waits in the air until the answer comes. */
function place(t, by = myId(), hand = carry) {
  if (guest() && hand === carry) {
    net.pending = carry;
    carry = null;
    return send('host', { t: 'place', hole: t.hole, frame: t.frame?.si, dr: t.dr, dc: t.dc, patch: !!t.patch, letter: hand.letter, shape: hand.cells, pile: piles.indexOf(hand.from) });
  }
  return t.frame ? placeFrame(t, by, hand) : placeWall(t, by, hand);
}
// A piece in the wall, where it ends up: a clean fit sits flush in the hole; a board nailed over
// the stone sticks out in front of it; boards behind stack up on the den side.
function putPiece(h, i) {
  const over = i.over > 0;
  const g = pieceGroup(i.shape, woodMat(i.letter));
  const to = new THREE.Vector3(X(i.dc), Y(i.dr), i.patch ? patchZ(i.layer) : over ? WOOD_D - 0.12 : -0.04);
  g.position.copy(to);
  wallGroup.add(g);
  const cells = i.shape.map(([r, c]) => k(r + i.dr, c + i.dc));
  if (i.patch) cells.forEach((kk) => wall.lining[i.layer].add(kk));
  else cells.forEach((kk) => { wall.wood.add(kk); if (h.set.has(kk)) h.filled.add(kk); });
  const b = C.bbox(i.shape);
  const piece = { group: g, cells, over, patch: !!i.patch, base: to.clone(), cx: to.x + b.w * S / 2, by: i.by, info: i, undo: null };
  if (i.patch) Object.assign(piece, { layer: i.layer, hp: HP.patch });
  h.pieces.push(piece);
  return piece;
}
function placeWall(t, by, hand) {
  const h = wall.holes[t.hole];
  const info = { letter: hand.letter, shape: hand.cells, dr: t.dr, dc: t.dc, over: t.over, patch: !!t.patch, layer: t.layer ?? 0, by };
  const from = hand.group.position.clone();
  scene.remove(hand.group);
  if (hand === carry) carry = null;
  const undo = { h, letter: info.letter, shape: info.shape, prev: { status: h.status, hp: h.hp, maxHp: h.maxHp }, boarded: G.boarded, hpAfter: null };
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
      undo.hpAfter = h.hp;
      burst(new THREE.Vector3(to.x + b.w * S / 2, to.y - b.h * S / 2, to.z + 0.1), '#ffe0a0', 10, 2.5);
      const n = boardsOf(h).length;
      toast(`Nailed on behind: ${n === 1 ? 'one more layer' : `${n} layers`} to hack through`);
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
  if (u.frame) return !u.frame.done && u.frame.pieces[u.frame.pieces.length - 1] === u.piece && Math.hypot(u.piece.cx - pirate.x, u.piece.cz - pirate.z) <= REACH + 0.6;
  if (pirate.z > WALL_Z) return false;
  if (u.h.pieces[u.h.pieces.length - 1] !== u.piece || (!u.piece.patch && u.h.status === 'master')) return false;
  return Math.abs(u.piece.cx - pirate.x) <= REACH + 0.6;
}
function takeBack() {
  const u = lastPlaced, where = u.frame || u.h;
  lastPlaced = null;
  if (guest()) return send('host', { t: 'takeback', hole: u.frame ? undefined : wall.holes.indexOf(where), frame: u.frame?.si });
  unplace(where, u.piece.by, true);
}
// Off comes the last piece in a hole or frame, put back as it was before. Whoever put it there
// gets it back in their hands.
function unplace(where, by, mine = by === myId()) {
  const piece = where.pieces[where.pieces.length - 1];
  if (!piece || piece.by !== by) return;
  const u = piece.undo, b = C.bbox(piece.info.shape), frame = !!where.occ;
  where.pieces.pop();
  let at;
  if (frame) {
    piece.cells.forEach((kk) => { where.occ.delete(kk); where.filled.delete(kk); });
    frameState(where);
    at = piece.group.localToWorld(new THREE.Vector3(b.w * S / 2, -b.h * S / 2, 0));
    where.group.remove(piece.group);
  } else {
    const h = where;
    if (piece.patch) relining();
    else {
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
  if (isHost()) send('all', { t: 'unplace', hole: frame ? undefined : wall.holes.indexOf(where), frame: frame ? where.si : undefined, by });
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
function refill(p) {
  if (!p || guest()) return;   // a piece taken back off the wall has no crate to refill; the host deals
  setTimeout(() => {
    deal(p); showPile(p);
    checkGaps();
    const g = p.group, s0 = g.scale.x;
    tween(0.3, (s) => g.scale.setScalar(s0 * (1 - (1 - s) ** 3)));
  }, 450);
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
      const tx = holeX(r.hole) + r.slot, dx = tx - r.x, dz = -1.15 - r.z, n = Math.hypot(dx, dz);
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
  refill(pile);
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
  toast(boards.length ? 'Through the hole! Only the boards behind it hold them now' : 'They broke through!', true);
}
function breakBoard(h, p) {
  if (isHost()) send('all', { t: 'unboard', hole: wall.holes.indexOf(h), i: h.pieces.indexOf(p) });
  h.pieces = h.pieces.filter((x) => x !== p);
  const g = p.group, p0 = g.position.clone(), v = new THREE.Vector3((Math.random() - 0.5) * 2, 1.5 + Math.random(), 2.5 + Math.random());
  tween(0.8, (s) => { g.position.set(p0.x + v.x * s, p0.y + v.y * s - 9 * s * s, p0.z + v.z * s); g.rotation.x = s * 3; }, () => wallGroup.remove(g));
  relining();
  updateHole(h);
  burst(new THREE.Vector3(holeX(h), holeMidY(h), patchZ(0)), '#c98a45', 16, 3.5);
  shake = 0.3;
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
// Only an empty hole can be climbed through; anything with wood in it has to be hacked open first.
const passable = (h) => h.status === 'open' && !h.pieces.length;
function pickHole(x) {
  const near = (a, b) => Math.abs(holeX(a) - x) - Math.abs(holeX(b) - x);
  const gaps = wall.holes.filter(passable);
  if (gaps.length) return gaps.sort(near)[0];
  const strength = (h) => h.hp + boardsOf(h).reduce((s, p) => s + p.hp, 0);
  return wall.holes.slice().sort((a, b) => strength(a) - strength(b) || near(a, b))[0];
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
      moving = !moveTo(r, holeX(h) + r.slot, -1.15, 2.2, dt);
      if (!moving) { r.state = passable(h) ? 'climb' : 'attack'; r.t = 0; }
      break;
    }
    case 'attack': case 'hackOut': {
      // Hacking at the wood in a hole: from outside to get in, or from inside to get back out.
      const out = r.state === 'hackOut';
      if (passable(h)) { r.state = out ? 'climbOut' : 'climb'; r.t = 0; break; }
      faceTo(r.m, 0, out ? -1 : 1, dt);
      if (!out) r.stamina -= dt;
      // From outside: the hole's own wood, then the boards behind it, nearest first. A thief
      // inside hacks the other way.
      const boards = boardsOf(h), fill = h.pieces.some((p) => !p.patch);
      const board = out ? boards[boards.length - 1] || null : fill ? null : boards[0];
      if (board) board.hp -= RAIDER_DPS * dt; else h.hp -= RAIDER_DPS * dt;
      r.m.arms[1].rotation.x = -1.8 + Math.sin(r.t * 9) * 1.1;
      r.hitT -= dt;
      if (r.hitT <= 0) {
        r.hitT = 0.7;
        burst(new THREE.Vector3(holeX(h) + r.slot * 0.5, Math.min(holeMidY(h), 1.4), out ? 0.6 : 0.25), '#c98a45', 4, 2);
        h.jig = 0.15;
      }
      if (board && board.hp <= 0) breakBoard(h, board);
      else if (!board && h.hp <= 0) breakHole(h);
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
        say(`A raider stole ${PAY.steal} doubloons!`, true);
        giveLoot(r);
        r.state = 'flee';
      }
      break;
    }
    case 'flee': {
      if (!passable(h)) { const gap = wall.holes.filter(passable).sort((a, b) => Math.abs(holeX(a) - r.x) - Math.abs(holeX(b) - r.x))[0]; if (gap) r.hole = gap; }
      moving = !moveTo(r, holeX(r.hole), 1.2, 2.8, dt);
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
  if (r.state !== 'climb' && r.state !== 'climbOut' && r.state !== 'down') {
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
  // Find a patch of solid stone, away from the gate and other holes, for a new hole.
  for (let tries = 0; tries < 200; tries++) {
    const shape = Math.random() < 0.6 ? lastGap() : C.genHole(2).hole;
    const b = C.bbox(shape);
    if (b.h > wall.H - 1 || b.w > wall.W - 2) continue;
    const r0 = 1 + rand(wall.H - b.h), c0 = 3 + rand(wall.W - b.w - 5);
    const cells = shape.map(([r, c]) => [r + r0, c + c0]);
    const clear = cells.every(([r, c]) => {
      if (r >= wall.H || c < 3 || c > wall.W - 4 || !wall.stoneAt.has(k(r, c))) return false;
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
  G.toSpawn = Math.round((1 + G.wave) * (1 + 0.5 * (crewSize() - 1)));
  G.spawnT = 0.5;
  G.cannonT = G.wave >= 2 ? 8 : Infinity;
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
  G.cannonT -= dt;
  if (G.cannonT <= 0) { fireCannon(); G.cannonT = Math.max(9, 22 - 2 * G.wave); }
  if (!G.toSpawn && !raiders.length) {
    G.phase = 'calm'; G.phaseT = CALM_SECS;
    const si = SECTION_ORDER[G.wave - 1];
    if (si !== undefined && !ramp.secs[si].built && !ramp.secs[si].frame && openFrame(si)) say(`Wave ${G.wave} beaten off! Timber's come: build the rampart in its frame`);
    else say(`Wave ${G.wave} beaten off!`);
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
};
function aim() {
  target = null;
  if (!carry || pirate.h > 0.3) return;
  // A rampart frame on the floor, when you're stood back from the wall (or pointing at it).
  if (frames().length && (mouseMode ? mouse?.floor : pirate.z > WALL_Z)) {
    const fl = frameFits(carry.cells);
    const dist = (o) => Math.hypot(o.cx - pirate.x, o.cz - pirate.z);
    if (mouseMode) {
      const d = (o) => Math.hypot(o.cx - mouse.x, o.cz - mouse.z) / S + (o.over ? 0.35 : 0);
      fl.sort((a, z) => d(a) - d(z));
      if (fl[0] && d(fl[0]) <= 1.8) target = { ...fl[0], ok: dist(fl[0]) <= REACH, far: dist(fl[0]) > REACH };
    } else {
      const near = fl.filter((o) => dist(o) <= REACH).sort((a, z) => a.over - z.over || dist(a) - dist(z));
      if (near.length) target = { ...near[cycle % near.length], ok: true, count: near.length };
    }
    return;
  }
  if (pirate.z > WALL_Z + 2.5 || mouse?.floor) return;
  const list = fits(carry.cells).concat(patchFits(carry.cells));
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
    const near = list.filter(reach).sort((a, z) => (a.over > 0) - (z.over > 0) || !!a.patch - !!z.patch || Math.abs(a.cx - pirate.x) - Math.abs(z.cx - pirate.x) || a.over - z.over);
    if (near.length) target = { ...near[cycle % near.length], ok: true, count: near.length };
  }
}
function drawGhost() {
  const kind = !target ? '' : !target.ok ? 'no' : target.over ? 'over' : 'ok';
  const f = target?.frame;
  const gz = f ? 0.16 : target?.patch ? patchZ(target.layer) + 0.07 : kind === 'over' ? 0.45 : 0.08;
  const want = target && carry ? `${f ? f.si : 'w'}|${carry.cells.map((x) => x.join()).join(';')}|${target.dr},${target.dc}|${kind}|${gz}` : '';
  if (want === ghostKey) return;
  ghostKey = want;
  if (ghost) { ghost.parent?.remove(ghost); ghost = null; }
  if (!want) return;
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(S * 0.98, S * 0.98, 0.12);
  for (const [r, c] of carry.cells) {
    const b = new THREE.Mesh(geo, ghostMats[kind]);
    b.position.set((c + 0.5) * S, -(r + 0.5) * S, gz);
    g.add(b);
  }
  g.add(outline(carry.cells, gz + 0.07, kind === 'no' ? '#ffd0c8' : '#fff4d0'));
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
  } else if (!carry && canTakeBack()) t = `Space: take the ${lastPlaced.letter} back off`;
  else if (carry) {
    const more = target?.count > 1 ? ` · Tab: other spots (${target.count})` : '';
    if (target?.frame) t = !target.ok ? 'Walk closer to lay it there' : target.over ? `Space: lay it in the frame (it sticks out: the spare gets sawn off)${more}` : `Space: lay the ${carry.letter} in the rampart frame${more}`;
    else if (target?.ok && target.patch) t = `Space: nail it on behind (one more layer for them to hack through)${more}`;
    else if (target?.ok && !target.over) t = `Space: fit the ${carry.letter} here${more}`;
    else if (target?.ok) t = `Space: board it over (weak, no Masterpiece)${more}`;
    else if (target?.far) t = 'Walk closer to fit it there';
    else if (pirate.z <= WALL_Z || (mouseMode && mouse)) t = `The ${carry.letter} won't go there · Q/E turn · F flip`;
    else t = `Carry the ${carry.letter} to a hole`;
  } else t = frames().some((f) => pirate.x > f.x0 - 1 && pirate.x < f.x0 + f.b.w * S + 1 && pirate.z > WALL_Z) ? 'Fetch pieces to build the rampart in its frame' : 'Fetch a piece from the piles';
  const hacking = raiders.some(atWall);
  if (onRampart()) {
    if (!carry) t = 'Bring a piece up here to throw at the raiders';
    else if (outsideFoe()) t = `Space, Shift or click a raider: throw the ${carry.letter} down on them!`;
    else t = hacking ? 'Walk along to get in range' : 'Up on the rampart · watch for raiders at the wall';
  } else if (pirate.h > 0.3) t = carry ? 'Up the stairs to the rampart' : 'Up to the rampart';
  else if (loose) t = carry ? `${f.kind === 'pile' || target?.ok ? t + ' · ' : ''}Shift or click: throw the ${carry.letter} at the raider!` : 'A raider is in the den! Grab a piece to throw at them';
  else if (hacking && carry && !target?.ok && ramp.secs.some((x) => x.built)) t += ' · or take it up the rampart and throw it';
  const el = $('prompt');
  if (el.textContent !== t) el.textContent = t;
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
const pilesOut = () => piles.map((p) => (p.letter ? [p.letter, p.cells] : null));
function pilesIn(list) {
  list.forEach((d, i) => {
    const p = piles[i];
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
    t: 'snap', g: { ...G }, p: pilesOut(), s: ramp.secs.map((s) => (s.built ? 1 : 0)), cv: cannon.visible ? 1 : 0,
    h: wall.holes.map((h) => [r2(h.hp), h.maxHp, h.status, h.pieces.length, boardsOf(h).map((p) => r2(p.hp))]),
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
  m.s.forEach((b, si) => { if (b && !ramp.secs[si].built) buildSection(si); });
  cannon.visible = !!m.cv;
  m.h.forEach(([hp, maxHp, status, n, bh], i) => {
    const h = wall.holes[i];
    if (!h || h.busy || h.pieces.length !== n) return;   // something's on its way: wait for it
    if (h.status !== status) { h.status = status; h.sig = ''; }
    h.hp = hp; h.maxHp = maxHp;
    boardsOf(h).forEach((p, j) => { if (bh[j] !== undefined) p.hp = bh[j]; });
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
      burst(new THREE.Vector3(holeX(r.hole) + r.slot * 0.5, Math.min(holeMidY(r.hole), 1.4), r.state === 'hackOut' ? 0.6 : 0.25), '#c98a45', 4, 2);
      r.hole.jig = 0.15;
    }
  }
  raiderPose(r, Math.hypot(r.x - ox, r.z - oz) > dt * 0.4, dt);
}

// Everything a pirate joining needs to see the den as it is now.
function sendSync(to, fresh = false) {
  send(to, {
    t: 'sync', fresh, g: { ...G }, W: wall.W, H: wall.H, gate: wall.gateCols, cv: cannon.visible ? 1 : 0, p: pilesOut(),
    holes: wall.holes.map((h) => ({ cells: h.cells, status: h.status, hp: h.hp, maxHp: h.maxHp, pieces: h.pieces.map((p) => p.info), boards: boardsOf(h).map((p) => p.hp) })),
    built: ramp.secs.map((s) => s.built),
    frames: ramp.secs.map((s) => (s.frame && !s.frame.done ? { cells: s.frame.cells, pieces: s.frame.pieces.map((p) => p.info), scraps: s.frame.scrapCells } : null)),
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
    Object.assign(h, { status: d.status, hp: d.hp, maxHp: d.maxHp });
    boardsOf(h).forEach((p, j) => { p.hp = d.boards[j] ?? HP.patch; });
    h.open = rest(h);
    h.exact = h.status === 'open' && h.open.length % 5 === 0 && C.solve(h.open, 1).length > 0;
    h.sig = '';
  });
  relining();
  s.built.forEach((b, si) => { if (b) buildSection(si, true); });
  s.frames.forEach((d, si) => {
    if (!d) return;
    const f = openFrame(si, d.cells);
    d.pieces.forEach((info) => putFramePiece(f, info));
    if (d.scraps.length) plugCells(f, d.scraps);
    frameState(f);
  });
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
  const list = m.frame != null ? frameFits(m.shape).filter((o) => o.frame.si === m.frame) : fits(m.shape).concat(patchFits(m.shape)).filter((o) => o.hole === m.hole);
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
const slotOf = (m) => (m.frame != null ? ramp.secs[m.frame]?.frame : wall.holes[m.hole]);

function onNet(m) {
  const mt = net.crew.get(m.from);
  switch (m.t) {
    case 'welcome':
      net.id = m.id;
      net.host = m.host === m.id;
      m.crew.forEach((c) => addMate(c.id, c.name));
      crewPanel(false);
      history.replaceState(null, '', `?crew=${net.code}`);
      if (net.host) newGame();
      crewLine();
      break;
    case 'full': lobbyMsg('That crew is full: four pirates already.'); break;
    case 'join':
      addMate(m.id, m.name);
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
        const t = { ...m, frame: m.frame != null ? ramp.secs[m.frame].frame : undefined };
        if (t.frame || wall.holes[m.hole]) place(t, m.by, handAt(m.by, m.letter, m.shape));
      }
      break;
    case 'unplace': if (!net.host && slotOf(m)) unplace(slotOf(m), m.by); break;
    case 'throw':
      if (net.host) hostThrow(m);
      else if (m.by !== net.id) {
        const r = raiders.find((o) => o.id === m.rid), hand = handAt(m.by, m.letter, m.shape);
        if (r) throwAt(r, hand, m.by); else scene.remove(hand.group);
      }
      break;
    case 'break': if (!net.host && wall.holes[m.hole]) breakHole(wall.holes[m.hole]); break;
    case 'unboard': { const h = wall.holes[m.hole]; if (!net.host && h?.pieces[m.i]) breakBoard(h, h.pieces[m.i]); break; }
    case 'shoot': if (!net.host) shoot(m.cells); break;
    case 'blast': if (!net.host) blast(m.cells, true); break;
    case 'frame': if (!net.host && !ramp.secs[m.si].frame && !ramp.secs[m.si].built) openFrame(m.si, m.cells); break;
    case 'plug': {
      const f = ramp.secs[m.si]?.frame;
      if (net.host || !f || f.done) break;
      plugCells(f, m.cells);
      toast('A gap none of your pieces can reach: plugged with offcuts', false, true);
      if (f.filled.size === f.cells.length) finishFrame(f);
      break;
    }
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

// ---------- main loop ----------
const camAt = new THREE.Vector3(0, 7.4, 14.2), camLook = new THREE.Vector3(0, 1.8, 3.6);
camera.position.copy(camAt);
const v3 = new THREE.Vector3(), L0 = new THREE.Vector3(), L1 = new THREE.Vector3();
/* Each tick runs the game on in small steps. Alone, a pause (another tab) stops the clock. In a
   crew it doesn't: the den goes on for everyone, so when the browser stops drawing a tab in the
   background, a timer keeps it ticking (as often as the browser lets it) and catches up. */
let lastT = performance.now();
function tick() {
  const now = performance.now();
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
  const moving = pirate.moving = !!(mx || mz);
  // Turn the view.
  if (keys.has('z')) view.yaw = Math.min(1.3, view.yaw + dt * 1.4);
  if (keys.has('c')) view.yaw = Math.max(-1.3, view.yaw - dt * 1.4);
  if (moving) {
    // Walk the way the camera faces.
    const n = Math.hypot(mx, mz), cy = Math.cos(view.yaw), sy = Math.sin(view.yaw);
    const wx = (mx * cy + mz * sy) / n, wz = (-mx * sy + mz * cy) / n;
    const ox = pirate.x, oz = pirate.z;
    let nx = pirate.x + wx * SPEED * dt, nz = pirate.z + wz * SPEED * dt;
    for (const o of obstacles) {
      const dx = nx - o.x, dz = nz - o.z, d = Math.hypot(dx, dz), min = o.r + 0.3;
      if (d < min && d > 0) { nx = o.x + dx / d * min; nz = o.z + dz / d * min; }
    }
    nx = Math.max(-bounds.x, Math.min(bounds.x, nx));
    nz = Math.max(pirate.h > 1 ? -0.3 : bounds.z0, Math.min(bounds.z1, nz));
    // Up and down the stairs, but no walking into their side or off the edge of the rampart.
    const pad = pirate.h < 0.05 ? 0.28 : 0;
    const okAt = (x, z) => Math.abs(heightAt(x, z, pad) - pirate.h) <= 0.4;
    if (!okAt(nx, nz)) { if (okAt(nx, oz)) nz = oz; else if (okAt(ox, nz)) nx = ox; else { nx = ox; nz = oz; } }
    pirate.x = nx; pirate.z = nz;
    pirate.h = heightAt(nx, nz);
    faceTo(pirate, wx, wz, dt * 1.2);
  }
  animateWalk(pirate, moving, dt);
  pirate.g.position.y += pirate.h;
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
     right-drag) and tilt it (right-drag). */
  const cz = Math.min(pirate.z, 7.5), u = ramp ? Math.min(1, pirate.h / ramp.T) : 0;
  topView = u > 0.7;
  L0.set(pirate.x * 0.55, 1.8, cz - 3.4);
  L1.set(pirate.x, 0.5, -2.6);
  const look = L0.lerp(L1, u);
  const dist = (12 + (17 - 12) * u) * view.zoom;
  const tilt = Math.max(0.2, Math.min(1.45, 0.486 + (1.4 - 0.486) * u + view.pitch));
  v3.set(Math.sin(view.yaw) * Math.cos(tilt), Math.sin(tilt), Math.cos(view.yaw) * Math.cos(tilt)).multiplyScalar(dist).add(look);
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

  // A marker over every raider inside the den, pinned to the screen edge when they're out of view.
  aimed = carry ? aimFoe() : null;
  renderer.domElement.style.cursor = carry && cursor && clickedFoe(cursor.x, cursor.y, pirate.h > 0.3 ? 1e4 : 90) ? 'crosshair' : '';
  for (const r of raiders) {
    const show = r === aimed || (r.state !== 'down' && (r.inside || (topView && !r.gone && ['approach', 'attack'].includes(r.state) && r.z > -6)));
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
  for (const h of wall.holes) {
    h.attackers = raiders.filter((r) => r.hole === h && ['approach', 'attack', 'hackOut'].includes(r.state)).length;
    const [cls, html] = labelFor(h);
    if (h.sig !== cls + html) { h.sig = cls + html; h.label.className = cls; h.label.innerHTML = html; }
    const bar = h.label.querySelector('.bar b');
    if (bar) bar.style.width = `${Math.max(0, barFrac(h)) * 100}%`;
    // From up on the wall, labels sit on the den side so they don't hide the raiders.
    if (topView) v3.set(holeX(h), 0, 2.2).project(camera); else v3.set(holeX(h), Y(h.b.r0) + 0.15, 0.1).project(camera);
    h.label.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
    h.label.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
    // A patch under attack shudders.
    if (h.jig > 0) {
      h.jig = Math.max(0, h.jig - dt);
      h.pieces.forEach((p) => { p.group.position.x = p.base.x + (Math.random() - 0.5) * h.jig * 0.4; });
      if (!h.jig) h.pieces.forEach((p) => { p.group.position.x = p.base.x; });
    }
  }
  for (const f of frames()) {
    const [cls, html] = frameLabel(f);
    if (f.sig !== cls + html) { f.sig = cls + html; f.label.className = cls; f.label.innerHTML = html; }
    v3.set(f.x0 + f.b.w * S / 2, 0.7, f.z0 + f.b.h * S / 2).project(camera);
    f.label.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
    f.label.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
    f.label.style.display = v3.z > 1 ? 'none' : '';
  }
}

newGame();
requestAnimationFrame(frame);

// For poking at it from the console.
window.den = { net, onNet, sendSync, joinCrew, leaveCrew, buildSection, openFrame, frameFits, frames, takeBack, canTakeBack, get lastPlaced() { return lastPlaced; }, get aimed() { return aimed; }, clickedFoe, get wall() { return wall; }, pirate, piles, raiders, G, get carry() { return carry; }, get target() { return target; }, act, startWave, fireCannon, spawnRaider, fits, patchFits, place, pickUp, showPile, view, get ramp() { return ramp; }, heightAt, throwAt,
  // Run the game forward by hand (for testing while the tab is in the background).
  step(secs) { for (let t = 0; t < secs; t += 1 / 30) update(1 / 30); renderer.render(scene, camera); } };
