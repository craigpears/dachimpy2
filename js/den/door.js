// The starlit door, on the sloop race's course (its rules: src/den-door.ts; its squares LAY.RACE.DOOR in
// src/den-sail.ts). A crag on the second spit off leg 2, plain rock, but for faint marks for anyone
// looking closely: the places of a ship's wheel carved small round the face high up, and a hairline
// seam below them. Stop off it and Space, and Duty Navigation stands on the rock beside them as the
// night sky (nav-board.js, its one look); each constellation filled lights its stars in their places on
// the carved wheel (placeXY, starCanvas). All lit, the door's outline glows and its two leaves swing in
// on a tunnel, a long straight cavern lit by glowing stones, under legs 3 and 4 to a plain door in the
// fourth spit's far face, out onto leg 5. A booch turns her about, pushed off, every star dark. Only a
// Vegas's gust from the mouth carries her through (the station's gust hook: sail-station.js); less, and
// the draught carries her back out. Touches the rest through race.js (built, ticked, keys, prompt, held,
// reset), the station's gust hook, and den.js's camera (doorCam). No words to speak, no elvish.
import * as THREE from 'three';
import { LAY, SAIL } from '../den-sail.js';
import { DOOR, Door, offDoor, mouthOf, tunnelGust } from '../den-door.js';
import { chainName } from '../sailing.js';
import { RINGS, SPOKES } from '../navigation.js';
import { scene, camera, mesh, V3, burst, toast, pirate } from './world.js';
import { rock } from './land.js';
import { sail, seaX, seaZ, stoneM, SLOOP_DECK } from './sea.js';
import { navBoard, placeXY, starCanvas } from './nav-board.js';
import { station } from './sail-station.js';

const D = LAY.RACE.DOOR, CELL = SAIL.CELL;
/** The door's middle across, its face (the crag's sea-side face), and the far end's face. */
const DX = (seaX(D.FACE[0][0]) + seaX(D.FACE[1][0])) / 2, FACE_Z = seaZ(D.FACE[0][1]) + CELL / 2, EXIT_Z = seaZ(D.OUT[0][1]) - CELL / 2;
/** The doorway (wide and tall enough for her mast), the crag, the carved wheel high above the door
    (its middle, and its width: the board's places at that size), and the board beside it. */
const DW = 4.6, DH = 7.6, CRAG_H = 14.5, WHEEL = { y: 10.6, w: 5.6 }, BOARD = { x: DX - 8.4, y: 9.9, size: 4.4 };
/** The tunnel, deep under the course: its water's height, its radius. */
const TY = -42, TR = 5.5;
/** Where the Sailing board's gust is taken: here. */
export const door = { rules: new Door(), W: null, board: null, on: false, trip: null, fade: null, said: {}, opening: 0, exitOpen: 0, closing: 0, booched: 0, snap: false };

// ---------- the look of it ----------
const darkM = new THREE.MeshBasicMaterial({ color: '#07060a', fog: false });
const seamM = new THREE.MeshBasicMaterial({ color: '#2a241e', transparent: true, opacity: 0.22 });
/** A rough block of crag: a box of the cliff's stone, x0..x1 across, z0..z1, its foot under the water. */
function block(g, x0, x1, z0, z1, h) {
  const b = mesh(new THREE.BoxGeometry(x1 - x0, h + 1.5, z1 - z0), stoneM);
  b.position.set((x0 + x1) / 2, (h - 1.5) / 2, (z0 + z1) / 2);
  g.add(b);
}
/** The marks: the wheel's places carved small and shallow, a darker notch with a lit lip, and its
    rings scratched faintly; so faint you'd only see them looking close. On a canvas the wheel's width. */
function marksTex() {
  const N = 512, cv = document.createElement('canvas');
  cv.width = cv.height = N;
  const g = cv.getContext('2d'), k = N / 1.0;
  g.translate(N / 2, N / 2);
  g.lineWidth = 1.6;
  for (let r = 0; r < RINGS; r++) {
    const p = placeXY(r, 0), rad = Math.hypot(p.x, p.y) * k;
    g.strokeStyle = 'rgba(30,24,20,0.16)'; g.beginPath(); g.arc(0, 0, rad, 0, Math.PI * 2); g.stroke();
  }
  const notch = (x, y, R, col) => {
    g.fillStyle = col; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * 0.45 : R; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath(); g.fill();
  };
  for (let r = 0; r < RINGS; r++) for (let s = 0; s < SPOKES; s++) {
    const p = placeXY(r, s), x = p.x * k, y = -p.y * k;
    notch(x + 1.5, y + 1.5, 15, 'rgba(255,248,230,0.10)');
    notch(x, y, 15, 'rgba(24,18,14,0.34)');
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
/** A star lit on the rock: navigation's own star (starCanvas), and a soft glow of its colour behind it. */
const starTex = new Map(), GLOW = ['#ffe680', '#ff6a78', '#ffb060', '#f2f0ff', '#9cd0ff'];
function glowTex() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}
let glowT = null;
function litStar(c) {
  if (!starTex.has(c)) { const t = new THREE.CanvasTexture(starCanvas(c)); t.colorSpace = THREE.SRGBColorSpace; starTex.set(c, t); }
  glowT ||= glowTex();
  const g = new THREE.Group();
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.25), new THREE.MeshBasicMaterial({ map: glowT, color: GLOW[c], transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  const st = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.52), new THREE.MeshBasicMaterial({ map: starTex.get(c), transparent: true, depthWrite: false, toneMapped: false }));
  st.position.z = 0.02;
  g.add(halo, st);
  g.userData = { halo, t: 0 };
  g.scale.setScalar(0.01);
  return g;
}
/** A pair of door leaves in a face at z, `dir` as the crag's (into the rock is -dir), each on its hinge
    at the doorway's side; both swing toward -z (in, at the door; out onto leg 5, at the far end). */
function leaves(g, z, dir) {
  const out = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(DX + side * DW / 2, 0, z);
    const leaf = mesh(new THREE.BoxGeometry(DW / 2, DH + 1.5, 0.5), stoneM);
    leaf.position.set(-side * DW / 4, (DH - 1.5) / 2, -dir * 0.25);
    pivot.add(leaf);
    g.add(pivot);
    out.push(pivot);
  }
  return out;
}
/** The doorway's seam, a hairline round the door (faint), and the outline that glows as it opens. */
function seam(g, z, m) {
  const t = 0.05, parts = [[DW + t * 2, t, 0, DH], [t, DH, -DW / 2, DH / 2], [t, DH, DW / 2, DH / 2]];
  const o = new THREE.Group();
  for (const [w, h, x, y] of parts) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(DX + x, y, z + 0.02); o.add(p); }
  g.add(o);
  return o;
}
/** A crag at a face: blocks either side of the doorway and over it, a dark recess behind the door, and a
    few boulders on its top. `dir` 1 its face toward the sea (+z, the door's), -1 away (the far end's). */
function crag(g, z, dir, left, right, h) {
  const deep = CELL * 2, z0 = dir > 0 ? z - deep : z, z1 = dir > 0 ? z : z + deep;
  block(g, DX - left, DX - DW / 2, z0, z1, h);
  block(g, DX + DW / 2, DX + right, z0, z1, h);
  const top = mesh(new THREE.BoxGeometry(DW, h - DH, deep), stoneM);
  top.position.set(DX, DH + (h - DH) / 2, (z0 + z1) / 2);
  g.add(top);
  // (behind the door, the dark: the tunnel's mouth, a deep black box)
  const rec = new THREE.Mesh(new THREE.BoxGeometry(DW, DH + 1.5, deep - 0.6), new THREE.MeshBasicMaterial({ color: '#050407', side: THREE.BackSide, fog: false }));
  rec.position.set(DX, (DH - 1.5) / 2, z - dir * (0.5 + (deep - 0.6) / 2));
  g.add(rec);
  // (and the doorway shut behind with rock, so from the spit's other side it's a plain crag: on the
  // course's second pass, 11 Nov, the far end's back stood in sight of leg 3, a black hole in it)
  const shut = mesh(new THREE.BoxGeometry(DW + 0.2, DH + 0.2, 0.4), stoneM);
  shut.position.set(DX, DH / 2, dir > 0 ? z0 + 0.2 : z1 - 0.2);
  g.add(shut);
  // (its water dark and still: the course's breeze doesn't blow in there)
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(DW, deep - 0.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#0b1119', fog: false }));
  pool.position.set(DX, 0.12, rec.position.z);
  g.add(pool);
  for (let i = 0; i < 7; i++) g.add(rock(DX - left + Math.random() * (left + right), h - 0.4, (z0 + z1) / 2 + (Math.random() - 0.5) * deep * 0.7, 1 + Math.random() * 1.4));
}
/** The tunnel, deep under the course: a long rough bore of dark rock, half full of black water, lit by
    glowing stones set in its walls; at its far end the daylight through the far door. */
function tunnel(g) {
  const L = FACE_Z - EXIT_Z + 6, mid = (FACE_Z + EXIT_Z) / 2;
  const geo = new THREE.CylinderGeometry(TR, TR, L, 20, 40, true);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), n = 1 + (Math.sin(pos.getY(i) * 0.7 + x) * 0.5 + Math.random() * 0.6) * 0.14;
    pos.setX(i, x * n); pos.setZ(i, z * n);
  }
  geo.computeVertexNormals();
  const bore = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#2b2733', roughness: 1, flatShading: true, side: THREE.BackSide, fog: false }));
  bore.rotation.x = Math.PI / 2;
  bore.position.set(DX, TY + 1.8, mid);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(TR * 2.4, L).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#0a1420', roughness: 0.15, metalness: 0.4, fog: false }));
  water.position.set(DX, TY, mid);
  g.add(bore, water);
  // The ends: the dark behind her, the far door's daylight ahead.
  const back = new THREE.Mesh(new THREE.CircleGeometry(TR * 1.3, 16), darkM);
  back.position.set(DX, TY + 1.8, FACE_Z + 2.5);
  back.rotation.y = Math.PI;
  const day = new THREE.Mesh(new THREE.CircleGeometry(TR * 1.3, 16), new THREE.MeshBasicMaterial({ color: '#dceeff', fog: false, toneMapped: false }));
  day.position.set(DX, TY + 1.8, EXIT_Z - 2.5);
  g.add(back, day);
  // Glowing stones in the walls, pale blue and white, like the stars; and their light on the water.
  const glows = [new THREE.MeshBasicMaterial({ color: '#8fe4ff', fog: false, toneMapped: false }), new THREE.MeshBasicMaterial({ color: '#d8ccff', fog: false, toneMapped: false }), new THREE.MeshBasicMaterial({ color: '#f4fbff', fog: false, toneMapped: false })];
  glowT ||= glowTex();
  const shine = new THREE.MeshBasicMaterial({ map: glowT, color: '#7fc8ff', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false });
  const stone = new THREE.IcosahedronGeometry(0.28, 0), pool = new THREE.PlaneGeometry(2.2, 2.2).rotateX(-Math.PI / 2), halo = new THREE.PlaneGeometry(1.6, 1.6);
  for (let z = FACE_Z - 4; z > EXIT_Z + 3; z -= 2.6 + Math.random() * 2.4) {
    for (const side of [-1, 1]) {
      if (Math.random() < 0.25) continue;
      const a = side * (0.35 + Math.random() * 0.9), x = DX + Math.sin(a) * TR * 0.92, y = TY + 1.8 + Math.cos(a) * TR * 0.92 - 1.2;
      const s = new THREE.Mesh(stone, glows[Math.floor(Math.random() * 3)]);
      s.position.set(x, Math.max(TY + 0.6, y), z);
      s.scale.setScalar(0.7 + Math.random() * 0.9);
      const h = new THREE.Mesh(halo, shine);
      h.position.copy(s.position); h.position.x -= side * 0.2;
      h.rotation.y = side * Math.PI / 2;
      const p = new THREE.Mesh(pool, shine);
      p.position.set(x - side * 1.2, TY + 0.03, z);
      g.add(s, h, p);
    }
  }
}

function build() {
  const W = { g: new THREE.Group(), front: null, back: null, glow: null, marks: [], lit: [], wheel: new THREE.Group() };
  // The door's crag, its leaves and their seam; the carved wheel high over the door.
  crag(W.g, FACE_Z, 1, 11.5, 6.5, CRAG_H);
  W.front = leaves(W.g, FACE_Z, 1);
  seam(W.g, FACE_Z, seamM);
  W.glow = seam(W.g, FACE_Z + 0.01, new THREE.MeshBasicMaterial({ color: '#d8ecff', transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(WHEEL.w, WHEEL.w), new THREE.MeshBasicMaterial({ map: marksTex(), transparent: true, depthWrite: false }));
  W.wheel.position.set(DX, WHEEL.y, FACE_Z + 0.03);
  W.wheel.add(face);
  W.g.add(W.wheel);
  // The far end: a plain crag in the fourth spit's far face, its door no different from the rock.
  crag(W.g, EXIT_Z, -1, 6.5, 6.5, 10);
  W.back = leaves(W.g, EXIT_Z, -1);
  tunnel(W.g);
  scene.add(W.g);
  return W;
}
/** Built with the race's course (race.js). */
export function doorWorld() { door.W ||= build(); }
/** The squares the course's land leaves to the door's crags (race.js draws the rest): its face and the
    far end, and the square behind each, where the dark of the tunnel's mouth goes. */
export const doorSquares = new Set([...D.FACE, ...D.FACE.map(([c, r]) => [c, r + 1]), ...D.OUT, ...D.OUT.map(([c, r]) => [c, r - 1])].map(([c, r]) => `${c},${r}`));

// ---------- the stars on the rock ----------
function lightMarks(marks) {
  for (const m of marks) {
    const p = placeXY(m.ring, m.spoke), s = litStar(m.colour);
    s.position.set(p.x * WHEEL.w, p.y * WHEEL.w, 0.05);
    door.W.wheel.add(s);
    door.W.lit.push(s);
    burst(door.W.wheel.localToWorld(s.position.clone()), GLOW[m.colour], 8, 2);
  }
}
function darkAll() {
  for (const s of door.W.lit) s.removeFromParent();
  door.W.lit = [];
}

// ---------- the board, on the rock as the night sky ----------
function boardUp() {
  door.board ||= navBoard({
    options: DOOR.NAV, sky: true, size: BOARD.size, at: V3(BOARD.x, BOARD.y, FACE_Z + 0.4), yaw: 0,
    onConstellation: (d) => {
      const opens = door.rules.done(d);
      lightMarks(d.marks);
      if (opens) { door.opening = 0.001; door.closing = 1.1; }
    },
    onBooch: () => { door.booched = 1.0; },
  });
  if (!door.board.group.parent) scene.add(door.board.group);
  door.board.idle = false;
  door.on = true;
}
function boardDown(gone = false) {
  door.on = false;
  if (!door.board) return;
  door.board.group.removeFromParent();
  if (gone || door.rules.open) { door.board.dispose(); door.board = null; }
}
/** A booch, seen on the board: she's turned about and pushed off, the board gone, every star dark. */
function booched() {
  boardDown(true);
  darkAll();
  const h = sail.helm, to = door.rules.booch(h.pose);
  h.moor({ ...h.pose, d: 2 });
  h.gust([to]);
  toast('Booched! She\'s turned about and pushed off the cliff', true);
}

// ---------- her trip through the tunnel ----------
// 'through': in at the door, the dark, the length of the tunnel, the dark, out of the far door onto leg 5.
// 'back': in a little way, and the draught carries her back out, stern first.
const PH = { in: 1.2, dark: 0.4, out: 1.2 };
const ease = (u) => u * u * (3 - 2 * u);
station.gusts.push((res) => {
  if (!sail.on || !door.W || !door.rules.open || door.trip || !sail.helm.gusty()) return null;
  const h = sail.helm, from = h.gustFrom(), t = tunnelGust(true, from, res.run);
  if (!t) return null;
  door.trip = { way: t.way, t: 0, wait: true, from, to: t.to, went: t.went, col: mouthOf(from) };
  const name = chainName(res.steps).replace(/!+$/, ''), what = name ? `A ${name}!` : 'A clear!';
  return { say: t.way === 'through' ? `${what} The gust carries her into the dark` : `${what} The gust carries her in, and the draught carries her back out`, went: t.went };
});
const runSecs = () => DOOR.TRIP - PH.in - PH.dark * 2 - PH.out;
/** Where she is on her trip: x, y, z, and the way she faces (quarter turns, as a pose's). */
function tripAt(T) {
  const x0 = seaX(T.from.c), z0 = seaZ(T.from.r), t = T.t;
  if (T.way === 'back') {
    const inTo = FACE_Z - 0.5 - Math.min(3, T.went) * 0.9;
    const u = t < 1.1 ? ease(t / 1.1) : t < 1.4 ? 1 : 1 - ease(Math.min(1, (t - 1.4) / (DOOR.BACK - 1.4)));
    return { x: x0 + (DX - x0) * Math.min(1, u * 1.5), y: 0, z: z0 + (inTo - z0) * u };
  }
  if (t < PH.in) { const u = ease(t / PH.in); return { x: x0 + (DX - x0) * Math.min(1, u * 1.4), y: 0, z: z0 + (FACE_Z - 3 - z0) * u }; }
  const r0 = PH.in + PH.dark, run = runSecs();
  if (t < r0 + run) { const u = Math.max(0, (t - r0) / run); return { x: DX, y: TY, z: FACE_Z - 3 + (EXIT_Z + 3 - (FACE_Z - 3)) * u, under: true }; }
  const u = ease(Math.min(1, Math.max(0, (t - r0 - run - PH.dark) / PH.out))), x1 = seaX(T.to.c), z1 = seaZ(T.to.r);
  return { x: DX + (x1 - DX) * u, y: 0, z: EXIT_Z + 2 + (z1 - EXIT_Z - 2) * u };
}
/** How dark the screen is on her trip through (0 to 1). */
function tripDark(T) {
  if (T.way !== 'through') return 0;
  const t = T.t, run = runSecs(), r0 = PH.in + PH.dark;
  if (t < PH.in) return Math.max(0, (t - (PH.in - 0.45)) / 0.45);
  if (t < r0) return 1;
  if (t < r0 + 0.35) return 1 - (t - r0) / 0.35;
  if (t < r0 + run - 0.35) return 0;
  if (t < r0 + run) return (t - (r0 + run - 0.35)) / 0.35;
  if (t < r0 + run + PH.dark) return 1;
  return Math.max(0, 1 - (t - r0 - run - PH.dark) / 0.3);
}
function fade(v) {
  if (!door.fade) {
    const el = door.fade = document.createElement('div');
    Object.assign(el.style, { position: 'fixed', inset: '0', background: '#000', opacity: '0', pointerEvents: 'none', zIndex: 15 });
    document.body.appendChild(el);
  }
  const s = v > 0.001 ? v.toFixed(3) : '0';
  if (door.fade.style.opacity !== s) door.fade.style.opacity = s;
}
function tripTick(dt, onLeg) {
  const T = door.trip, h = sail.helm;
  if (T.wait) {
    if (h.cur || h.gusts.length) return;
    T.wait = false;
    h.moor({ ...T.from });
  }
  const was = T.t;
  T.t += dt;
  const end = T.way === 'through' ? DOOR.TRIP : DOOR.BACK;
  // (the camera jumps under the black: in, and out)
  const r1 = PH.in + PH.dark + runSecs();
  door.snap = T.way === 'through' && ((was < PH.in && T.t >= PH.in) || (was < r1 && T.t >= r1));
  if (T.way === 'through' && was < r1 && T.t >= r1) door.exitOpen = 0.001;
  const p = tripAt(T);
  sail.g.position.set(p.x, p.y + Math.sin(performance.now() / 1000 * 0.9) * 0.06, p.z);
  sail.g.rotation.set(0, Math.PI / 2, 0);   // (facing in, along the tunnel, d 0)
  fade(tripDark(T));
  sail.g.updateMatrixWorld(true);
  const at = sail.g.localToWorld(V3(-1.15, SLOOP_DECK, 0)), yaw = sail.g.rotation.y;
  pirate.x = at.x; pirate.z = at.z; pirate.g.position.copy(at);
  pirate.g.rotation.set(0, Math.atan2(Math.cos(yaw), -Math.sin(yaw)), 0);
  if (T.t < end) return;
  door.trip = null;
  fade(0);
  if (T.way === 'through') {
    h.moor({ ...T.to });
    onLeg?.();
    toast('Out of the dark, onto the fifth leg');
  } else h.moor({ ...T.from });
}

// ---------- the keys, the prompt, the camera ----------
/** Holding her: at the board, or on her way through. */
export const doorHolds = () => door.on || !!door.trip;
/** On her way through the tunnel (or carried back out of it): out of anyone's reach (race.js). */
export const doorCarried = () => !!door.trip;
const VIEW = ['z', 'c', 'v', '-', '_', '=', '+', 'p'];
/** A key at sea, first: whether it was the door's. */
export function doorKey(key) {
  if (!sail.on || !door.W) return false;
  if (door.trip) return !VIEW.includes(key);
  if (door.on) {
    if (key === 'escape') { boardDown(); return true; }
    if (door.booched) return !VIEW.includes(key);
    const k = { arrowleft: 'ArrowLeft', arrowright: 'ArrowRight', arrowup: 'ArrowUp', arrowdown: 'ArrowDown' }[key] ?? key;
    door.board.key(k, {});
    return !VIEW.includes(key);
  }
  const h = sail.helm;
  if ((key === ' ' || key === 'enter') && !door.rules.open && offDoor(h.pose.c, h.pose.r) && h.slot < 0 && !h.cur && !h.held()) { boardUp(); return true; }
  return false;
}
export function doorPrompt() {
  if (!sail.on || !door.W) return '';
  if (door.trip) return door.trip.way === 'through' ? 'Under the cliffs, through the dark' : 'The draught is carrying her back out';
  if (door.on) return `${door.board.prompt()} · Esc: step back`;
  const h = sail.helm;
  if (!offDoor(h.pose.c, h.pose.r) || h.slot >= 0) return '';
  if (door.rules.open) return mouthOf(h.pose) >= 0 ? 'The open door · a long dark tunnel, and a draught blowing out of it' : 'The door in the cliff stands open';
  return 'Under the cliff · Space: look closer at the rock';
}
/** The camera (den.js): straight on to the board and the carved wheel; behind her going in; along the
    tunnel; and out at the far door, watching her come out. */
export function doorCam() {
  if (!sail.on || !door.W) return null;
  if (door.on && door.board) {
    // (the board and the carved wheel side by side, filling the view)
    const vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect);
    return { look: V3(DX - 4.1, WHEEL.y - 0.6, FACE_Z), dist: Math.max(7.6 / Math.tan(hh), 4.3 / Math.tan(vh)), tilt: 0.12, yaw: 0 };
  }
  // (the door opening: the wheel lit, the outline glowing, the leaves swinging in)
  if (door.opening > 0 && door.opening < 3.9 && !door.trip) return { look: V3(DX, 6.8, FACE_Z), dist: 21, tilt: 0.2, yaw: 0 };
  const T = door.trip;
  if (!T || T.wait) return null;
  const p = tripAt(T), snap = door.snap;
  if (p.under) return { look: V3(p.x, p.y + 2.2, p.z - 3), dist: 9, tilt: 0.2, yaw: 0, snap };
  if (T.way === 'through' && T.t > PH.in) return { look: V3(DX, 3, EXIT_Z - 2), dist: 16, tilt: 0.3, yaw: Math.PI, snap };
  return { look: V3(DX, 4, FACE_Z), dist: 15, tilt: 0.32, yaw: 0, snap };
}

// ---------- each tick ----------
/** Each tick at sea (race.js, after she's drawn where the helm has her). `onLeg`: she's come out on leg 5. */
export function doorTick(dt, onLeg) {
  const W = door.W;
  if (!W) return;
  door.snap = false;
  document.body.classList.toggle('starlit', sail.on && (door.on || !!door.trip));   // (the sailing bar out of the way: den.html)
  if (door.on) door.board?.tick(dt);
  if (door.closing > 0 && (door.closing -= dt) <= 0) boardDown();
  if (door.booched && (door.booched -= dt) <= 0) { door.booched = 0; booched(); }
  if (door.trip && sail.on) tripTick(dt, onLeg);
  else fade(0);
  // The stars on the rock coming up, twinkling.
  const t = performance.now() / 1000;
  W.lit.forEach((s, i) => {
    s.userData.t += dt;
    const u = Math.min(1, s.userData.t / 0.5);
    s.scale.setScalar(u < 1 ? 1.3 * Math.sin(u * Math.PI / 2) : 1 + Math.sin(t * 3 + i) * 0.04);
    s.userData.halo.material.opacity = 0.6 + Math.sin(t * 2.3 + i * 1.7) * 0.2;
  });
  // Opening: the outline glows, then the leaves swing in.
  if (door.opening > 0) {
    door.opening = Math.min(4, door.opening + dt);
    const glow = Math.min(1, door.opening / 1.2), swing = ease(Math.min(1, Math.max(0, (door.opening - 1.2) / 2.4)));
    W.glow.children.forEach((p) => { p.material.opacity = glow * (0.75 + 0.25 * Math.sin(t * 4)); });
    W.front[0].rotation.y = swing * 1.75; W.front[1].rotation.y = -swing * 1.75;
    if (door.opening > 1.2 && !door.said.open) { door.said.open = true; toast('The door swings open on a tunnel, long and dark'); burst(V3(DX, DH / 2, FACE_Z + 0.5), '#d8ecff', 30, 4); }
  } else W.glow.children.forEach((p) => { p.material.opacity = 0; });
  if (door.exitOpen > 0) {
    door.exitOpen = Math.min(1.5, door.exitOpen + dt);
    const swing = ease(Math.min(1, door.exitOpen / 1.2));
    W.back[0].rotation.y = swing * 1.75; W.back[1].rotation.y = -swing * 1.75;
  }
}

/** A new race, or a fresh voyage: shut, dark, the board gone. */
export function doorReset() {
  door.rules.reset();
  door.said = {};
  door.opening = 0; door.exitOpen = 0; door.booched = 0; door.closing = 0;
  if (door.trip) { door.trip = null; fade(0); }
  if (door.board) boardDown(true);
  if (door.W) {
    darkAll();
    door.W.front[0].rotation.y = 0; door.W.front[1].rotation.y = 0;
    door.W.back[0].rotation.y = 0; door.W.back[1].rotation.y = 0;
  }
}

/* A test hook, not a cheat (no menu or ?at= names it: a hidden gem). From the console, locally:
   (await import('/js/den/door.js')).doorTest.open() lights the run's stars and opens it;
   .off() puts her off the door, .mouth() at its mouth facing in. */
export const doorTest = {
  off() { sail.helm.moor({ c: D.OFF[0][0], r: D.OFF[0][1], d: 3 }); },
  mouth() { sail.helm.moor({ c: D.OFF[0][0], r: D.OFF[0][1], d: 0 }); },
  open() {
    doorWorld();
    if (door.board) boardDown(true);
    darkAll();
    door.rules.reset();
    for (const marks of [[{ ring: 0, spoke: 3, colour: 4 }, { ring: 1, spoke: 6, colour: 0 }], [{ ring: 2, spoke: 1, colour: 3 }, { ring: 1, spoke: 4, colour: 2 }, { ring: 0, spoke: 7, colour: 0 }]]) {
      door.rules.done({ marks, booched: false });
      lightMarks(marks);
    }
    door.opening = 0.001;
  },
};
