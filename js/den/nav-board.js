// Duty Navigation's look, for any board that plays it: a round chart of the night sky, the ship's wheel
// on it with its three rings, and the stars. The puzzle itself, its rules, is src/navigation.ts: one
// copy of it; this only draws a board of it wherever its caller puts it (a plane in the scene, its
// picture painted on a canvas), and plays it by the real keys. It knows nothing of the den (it
// imports only three.js and the rules), so a test page can play it on its own (navigation-test.html).
// It's to be the night sky in front of the hidden cliff door, each constellation lighting its stars
// on the rock: the hooks below say when one's filled (and its marks, to light), and when you booch.
import * as THREE from 'three';
import { Navigation, RINGS, SPOKES, parFor } from '../navigation.js';

/* Drawn after Puzzle Pirates' own (YPPedia's "Navigation", its two pictures of a board, looked at
   11 Nov): a night sky, a crescent moon at the top left, faint stars; a gold ship's wheel, its eight
   spokes running out past the rim to handles, three gold rings round the hub, the stars sitting on
   them where the spokes cross. Each colour of star its own shape: yellow a plump five-pointed star,
   red a sharp five-pointed one, orange an eight-pointed burst, white a six-pointed star, blue a
   four-pointed compass star. The next star waits out on a spoke's handle, glowing. The
   constellation's places are round medallions: empty, a ring in its colour with a dim star inside;
   holding a star of its colour, a solid coin of that colour, the star on it. (Faint lines join the
   constellation's places, as a star chart's, so it reads as one figure.) */

/** The canvas's size, and the board's radii on it: the sky, the wheel's rim, the three rings, and the
    next star out on the handles. */
const S = 1024, C = S / 2, SKY = 506, RIM = 408, RING_R = [140, 240, 340], OUT = 456, STAR_R = 44;
/** A spoke's angle on the canvas (y down): 0 straight up, then clockwise. */
const ang = (spoke) => -Math.PI / 2 + spoke * (2 * Math.PI / SPOKES);
const radius = (ring) => (ring < RINGS ? RING_R[ring] : OUT);
/** Where a place is on the board, x right and y up, the board's width 1 (from -0.5 to 0.5): for a
    host lighting a constellation's stars on something else in the same arrangement. */
export function placeXY(ring, spoke) { const r = radius(ring) / S, a = ang(spoke); return { x: Math.cos(a) * r, y: -Math.sin(a) * r }; }

/** The colours, as COLOUR_NAMES: base, light, dark; and each one's shape (points, how deep). */
const COL = [
  { base: '#ffd23a', light: '#fff6b8', dark: '#a8780a', pts: 5, depth: 0.5 },    // yellow
  { base: '#e8303a', light: '#ffb0a8', dark: '#7a0e18', pts: 5, depth: 0.38 },   // red
  { base: '#ff8a1e', light: '#ffd8a0', dark: '#9a3e06', pts: 8, depth: 0.5 },    // orange
  { base: '#e8ecf6', light: '#ffffff', dark: '#8a90b0', pts: 6, depth: 0.5 },    // white
  { base: '#5aa8ff', light: '#d8f0ff', dark: '#1a4aa0', pts: 4, depth: 0.32 },   // blue
];

const canvas = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); return cv; };
function starPath(g, c, x, y, r, turn = 0) {
  const { pts, depth } = COL[c];
  g.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const a = -Math.PI / 2 + turn + i * Math.PI / pts, rr = i % 2 ? r * depth : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
}
/** A star, 128 square: its shape, shaded light at the top left, a dark edge and a shine. (Exported:
    the one drawing of a navigation star, for a host to light on the rock.) */
const STARS = new Map();
export function starCanvas(c) {
  if (STARS.has(c)) return STARS.get(c);
  const K = COL[c];
  const cv = canvas(128, 128, (g) => {
    if (K.pts === 4) {   // (the compass star has a little four-pointed one turned behind it)
      starPath(g, c, 64, 64, 34, Math.PI / 4);
      g.fillStyle = K.dark; g.fill();
    }
    starPath(g, c, 64, 64, 58);
    const gr = g.createRadialGradient(50, 44, 4, 64, 64, 64);
    gr.addColorStop(0, K.light); gr.addColorStop(0.5, K.base); gr.addColorStop(1, K.dark);
    g.fillStyle = gr; g.fill();
    g.lineWidth = 3.5; g.strokeStyle = 'rgba(20,16,40,0.75)'; g.lineJoin = 'round'; g.stroke();
    // A ridge down each point, light on one side: a faceted, cut look.
    const { pts } = K;
    for (let i = 0; i < pts; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / pts;
      g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.cos(a) * 52, 64 + Math.sin(a) * 52); g.stroke();
    }
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.beginPath(); g.ellipse(54, 46, 7, 4, -0.6, 0, Math.PI * 2); g.fill();
  });
  STARS.set(c, cv);
  return cv;
}

/** The sky behind it all: deep blue, lighter toward the bottom, faint stars, the crescent moon. */
let SKY_CV = null;
function skyCanvas() {
  if (SKY_CV) return SKY_CV;
  SKY_CV = canvas(S, S, (g) => {
    g.save();
    g.beginPath(); g.arc(C, C, SKY, 0, Math.PI * 2); g.clip();
    const gr = g.createLinearGradient(0, 0, 0, S);
    gr.addColorStop(0, '#04122e'); gr.addColorStop(0.55, '#0a2654'); gr.addColorStop(1, '#123a72');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    // Faint stars, the same every time.
    let a = 7;
    const rnd = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
    for (let i = 0; i < 260; i++) {
      const x = rnd() * S, y = rnd() * S, r = rnd() * 1.6 + 0.4;
      g.fillStyle = `rgba(220,230,255,${0.25 + rnd() * 0.5})`;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    // The moon, a crescent at the top left.
    // (between the handles, out past the rim)
    const ma = -Math.PI / 2 - 0.42, mx = C + Math.cos(ma) * 462, my = C + Math.sin(ma) * 462;
    g.fillStyle = '#c8d4ee';
    g.beginPath(); g.arc(mx, my, 28, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.arc(mx + 13, my - 9, 26, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = 'source-over';
    g.restore();
    // The chart's edge: a thin brass ring.
    g.lineWidth = 8; g.strokeStyle = '#6a5426'; g.beginPath(); g.arc(C, C, SKY - 4, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2; g.strokeStyle = '#d8b860'; g.beginPath(); g.arc(C, C, SKY - 4, 0, Math.PI * 2); g.stroke();
  });
  return SKY_CV;
}

/** The wheel: spokes out to handles, the rim, the hub; the rings drawn on it each frame (one lit). */
let WHEEL_CV = null;
function wheelCanvas() {
  if (WHEEL_CV) return WHEEL_CV;
  WHEEL_CV = canvas(S, S, (g) => {
    const brass = (w, col) => { g.lineWidth = w; g.strokeStyle = col; };
    g.lineCap = 'round';
    for (let s = 0; s < SPOKES; s++) {
      const a = ang(s), cx = Math.cos(a), cy = Math.sin(a);
      brass(16, '#3a2c10'); g.beginPath(); g.moveTo(C + cx * 40, C + cy * 40); g.lineTo(C + cx * (OUT - 44), C + cy * (OUT - 44)); g.stroke();
      brass(9, '#a88a3a'); g.beginPath(); g.moveTo(C + cx * 40, C + cy * 40); g.lineTo(C + cx * (OUT - 44), C + cy * (OUT - 44)); g.stroke();
      // The handle: a ring the next star sits in.
      brass(7, '#3a2c10'); g.beginPath(); g.arc(C + cx * OUT, C + cy * OUT, 44, 0, Math.PI * 2); g.stroke();
      brass(3.5, '#b89a48'); g.beginPath(); g.arc(C + cx * OUT, C + cy * OUT, 44, 0, Math.PI * 2); g.stroke();
    }
    // The rim, broad and dark gold, just outside the outer ring.
    // The rim, broad dark wood with a brass edge each side, just outside the outer ring (the rings
    // are brass: the wood keeps it from reading as a fourth).
    brass(34, '#1e1206'); g.beginPath(); g.arc(C, C, RIM, 0, Math.PI * 2); g.stroke();
    brass(26, '#5a3416'); g.beginPath(); g.arc(C, C, RIM, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 96; i++) {   // (the wood's grain, round it)
      const a = i * Math.PI / 48, w = 2 + (i % 3);
      brass(w, i % 2 ? 'rgba(30,16,4,0.5)' : 'rgba(140,90,40,0.35)');
      g.beginPath(); g.arc(C, C, RIM - 9 + (i % 5) * 4, a, a + 0.05); g.stroke();
    }
    brass(3, '#c8a050'); g.beginPath(); g.arc(C, C, RIM - 14, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(C, C, RIM + 14, 0, Math.PI * 2); g.stroke();
    // The hub.
    const hg = g.createRadialGradient(C - 12, C - 12, 4, C, C, 46);
    hg.addColorStop(0, '#f0d890'); hg.addColorStop(0.6, '#a8883a'); hg.addColorStop(1, '#4a3812');
    g.fillStyle = hg; g.beginPath(); g.arc(C, C, 44, 0, Math.PI * 2); g.fill();
    brass(3, '#2a1e08'); g.stroke();
    g.fillStyle = '#3a2c10'; g.beginPath(); g.arc(C, C, 12, 0, Math.PI * 2); g.fill();
  });
  return WHEEL_CV;
}

/** A medallion for a constellation's place: an outline in its colour with a dim star inside (empty),
    or a solid coin of its colour with the star on it (filled). */
function medallion(g, c, x, y, filled, glow, k = 1) {
  const K = COL[c], R = 50 * k;
  g.save();
  if (glow > 0) {
    const gg = g.createRadialGradient(x, y, R * 0.6, x, y, R * 2);
    gg.addColorStop(0, hexA(K.base, 0.45 * glow)); gg.addColorStop(1, hexA(K.base, 0));
    g.fillStyle = gg; g.beginPath(); g.arc(x, y, R * 2, 0, Math.PI * 2); g.fill();
  }
  if (filled) {
    const gr = g.createRadialGradient(x - R * 0.35, y - R * 0.35, 3, x, y, R);
    gr.addColorStop(0, K.light); gr.addColorStop(0.55, K.base); gr.addColorStop(1, K.dark);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.fill();
    g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.7)'; g.stroke();
  } else {
    g.fillStyle = 'rgba(4,10,30,0.55)'; g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.fill();
    g.lineWidth = 6; g.strokeStyle = hexA(K.base, 0.85); g.stroke();
    g.globalAlpha = 0.35;
    g.drawImage(starCanvas(c), x - R * 0.7, y - R * 0.7, R * 1.4, R * 1.4);
  }
  g.restore();
}
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
const ease = (u) => u * u * (3 - 2 * u);
const xy = (r, a) => [C + Math.cos(a) * r, C + Math.sin(a) * r];

/** How long each kind of stage plays, in seconds. */
const TIME = { turn: 0.13, drop: 0.12, fall: 0.16, line: 0.42, constellation: 0.9, deal: 0.35, booch: 0.9 };

/* A Navigation board. `game` (a Navigation already made) or `random` and `options` (its NavOptions:
   sizes, colours) to make one. `at` (a Vector3, the board's middle), `yaw` (turned about the world's
   up) and `lean` (0 standing upright facing along +z after the yaw; Math.PI / 2 lying flat face up):
   where it goes; `size`: its width in metres (3). `sky`: draw the round night sky behind the wheel
   (true); without it the wheel stands on whatever's behind (the cliff, say).
   Hooks: `onMove(move)` after each turn or drop (the rules' Move: points, lines, done, booched...),
   as it's made; `onConstellation(done)` as a filled constellation is seen to go (done.marks are its
   places and colours, placeXY says where each is, starCanvas draws its star); `onBooch()` as a booch
   is seen; `onDeal(constellation)` as a new one's shown.
   Returns the board: add `board.group` to the scene, call `tick(dt)` every frame, feed it `key`,
   `pointer` and `click`, and `dispose()` it when you're done. `game` is the rules' Navigation (its
   score, completed, moves, constellation...), `busy()` whether it's still showing what happened,
   `idle` (set it) hides the selected ring's light when nobody's at it. */
export function navBoard(o = {}) {
  const game = o.game ?? new Navigation(o.random ?? Math.random, o.options ?? {});
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const size = o.size ?? 3;
  const group = new THREE.Group();
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
  group.add(face);
  group.position.copy(o.at ?? new THREE.Vector3());
  group.rotation.set(-(o.lean ?? 0), o.yaw ?? 0, 0, 'YXZ');
  group.scale.setScalar(size);

  const b = {
    game, group, canvas: cv, size, sky: o.sky !== false, idle: false,
    onMove: o.onMove ?? null, onConstellation: o.onConstellation ?? null, onBooch: o.onBooch ?? null, onDeal: o.onDeal ?? null,
    queue: [], stage: null, t: 0,
    /** Stars as drawn: id -> { c, r, a, fr, fa, tr, ta } (radius and angle, from and to). */
    stars: new Map(),
    /** The constellation as drawn, and its fade (in for a new one, a flare as it goes). */
    shownCon: game.constellation, conFade: 1, conFlare: 0,
    fx: [], flash: 0, ringGlow: [0, 0, 0], time: 0,
  };
  // Lay the stars where the game has them now, without animating.
  const layNow = (grid) => {
    b.stars.clear();
    grid.forEach((ring, r) => ring.forEach((x, s) => { if (x) b.stars.set(x.id, { c: x.c, r: radius(r), a: ang(s), fr: radius(r), fa: ang(s), tr: radius(r), ta: ang(s) }); }));
  };
  layNow(game.grid);

  // Aim every star at where a stage's board has it (from where it's drawn now); a new one comes in
  // from the next star's handle. Angles go the short way round, so a turn swings along the ring and a
  // fall drops straight down its spoke.
  const aim = (grid, from) => {
    const seen = new Set();
    grid.forEach((ring, r) => ring.forEach((x, s) => {
      if (!x) return;
      seen.add(x.id);
      let st = b.stars.get(x.id);
      if (!st) { st = { c: x.c, r: OUT, a: from ? ang(from.spoke) : ang(s) }; b.stars.set(x.id, st); }
      st.fr = st.r; st.fa = st.a; st.tr = radius(r);
      let d = ang(s) - st.a;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      st.ta = st.a + d;
    }));
    return seen;
  };
  // A star bursts: sparks of its colour flying out, the star swelling and fading.
  const burst = (id, n = 10, gold = false) => {
    const st = b.stars.get(id);
    if (!st) return;
    b.stars.delete(id);
    const [x, y] = xy(st.r, st.a);
    b.fx.push({ kind: 'ghost', c: st.c, x, y, t: 0, t0: 0.3 });
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 220;
      b.fx.push({ kind: 'spark', col: gold ? (i % 2 ? '#ffe680' : COL[st.c].light) : (i % 2 ? COL[st.c].base : COL[st.c].light), x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, t0: 0.5 + Math.random() * 0.3 });
    }
  };

  // Begin showing a stage.
  const begin = (st) => {
    b.stage = st; b.t = 0;
    if (st.kind === 'turn') b.ringGlow[st.ring] = 1;
    if (st.kind === 'booch') {
      b.dropFrom.shift();
      b.flash = 1;
      for (const [id, s] of b.stars) { s.fr = s.r; s.fa = s.a; s.tr = S; s.ta = s.a + (Math.random() - 0.5); s.flee = true; b.stars.set(id, s); }
      b.onBooch?.();
      return;
    }
    if (st.kind === 'line') { b.lit = new Set(st.cleared); return; }
    if (st.kind === 'constellation') { b.conFlare = 1; b.onConstellation?.(st.done); return; }
    if (st.kind === 'deal') { b.shownCon = st.constellation; b.conFade = 0; b.onDeal?.(st.constellation); return; }
    aim(st.grid, st.kind === 'drop' ? b.dropFrom.shift() : null);
  };
  // Finish a stage: everything where it ends up.
  const end = (st) => {
    for (const s of b.stars.values()) { s.r = s.tr; s.a = s.ta; }
    if (st.kind === 'line') { for (const id of st.cleared) burst(id); b.lit = null; }
    if (st.kind === 'constellation') { for (const id of st.cleared) burst(id, 16, true); b.shownCon = null; }
    if (st.kind === 'booch') layNow(st.grid);
    b.stage = null;
  };

  // The keys, as in the real puzzle: Left turns the ring selected anticlockwise, Right clockwise, Up
  // moves to the higher ring, Down to the lower, Space drops the star (WASD too).
  b.dropFrom = [];
  const did = (m) => {
    if (!m.moved) return m;
    b.queue.push(...m.stages);
    b.onMove?.(m);
    return m;
  };
  b.turn = (dir) => did(game.turn(dir));
  b.select = (d) => game.select(d);
  b.drop = () => { b.dropFrom.push({ ...game.next }); return did(game.drop()); };
  b.key = (key, e) => {
    const k = key.length === 1 ? key.toLowerCase() : key;
    if (k === 'ArrowLeft' || k === 'a') { b.turn(-1); return true; }
    if (k === 'ArrowRight' || k === 'd') { b.turn(1); return true; }
    if (k === 'ArrowUp' || k === 'w') { b.select(1); return true; }
    if (k === 'ArrowDown' || k === 's') { b.select(-1); return true; }
    if (k === ' ' || k === 'Spacebar') { if (!e?.repeat) b.drop(); return true; }
    return false;
  };
  // The mouse: over the board, the ring nearest the pointer is selected; a left click turns it
  // anticlockwise, a right click clockwise. (nx, ny) in -1..1 across the canvas, as three.js's.
  const ray = new THREE.Raycaster();
  b.pointer = (nx, ny, camera) => {
    ray.setFromCamera(new THREE.Vector2(nx, ny), camera);
    group.updateMatrixWorld(true);
    const n = new THREE.Vector3(0, 0, 1).transformDirection(group.matrixWorld), p0 = new THREE.Vector3().setFromMatrixPosition(group.matrixWorld);
    const p = new THREE.Vector3();
    if (!ray.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(n, p0), p)) return false;
    group.worldToLocal(p);
    const d = Math.hypot(p.x, p.y) * S;
    if (d > RIM + 20) return false;
    let best = 0;
    for (let r = 1; r < RINGS; r++) if (Math.abs(RING_R[r] - d) < Math.abs(RING_R[best] - d)) best = r;
    game.ring = best;
    return true;
  };
  b.click = (button) => b.turn(button === 2 ? 1 : -1);
  b.busy = () => b.queue.length > 0 || !!b.stage;

  b.tick = (dt) => {
    b.time += dt;
    // Catch up when keys come faster than it's shown.
    const fast = 1 + Math.min(3, b.queue.length * 0.6);
    if (!b.stage && b.queue.length) begin(b.queue.shift());
    if (b.stage) {
      b.t += dt * fast;
      const T = TIME[b.stage.kind], u = Math.min(1, b.t / T);
      const moving = b.stage.kind === 'turn' || b.stage.kind === 'drop' || b.stage.kind === 'fall' || b.stage.kind === 'booch';
      if (moving) {
        const k = b.stage.kind === 'fall' ? u * u : ease(u);
        for (const s of b.stars.values()) { s.r = s.fr + (s.tr - s.fr) * k; s.a = s.fa + (s.ta - s.fa) * k; }
      }
      if (b.stage.kind === 'deal') b.conFade = u;
      if (u >= 1) end(b.stage);
    }
    for (let r = 0; r < RINGS; r++) b.ringGlow[r] = Math.max(0, b.ringGlow[r] - dt * 4);
    b.flash = Math.max(0, b.flash - dt * 1.5);
    b.conFlare = Math.max(0, b.conFlare - dt * 1.2);
    for (let i = b.fx.length - 1; i >= 0; i--) {
      const f = b.fx[i];
      f.t += dt;
      if (f.kind === 'spark') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.94; f.vy *= 0.94; }
      if (f.t >= f.t0) b.fx.splice(i, 1);
    }
    draw();
    tex.needsUpdate = true;
  };

  function draw() {
    g.clearRect(0, 0, S, S);
    if (b.sky) g.drawImage(skyCanvas(), 0, 0);
    g.drawImage(wheelCanvas(), 0, 0);
    // The rings: gold circles the stars sit on; the one selected lit.
    for (let r = 0; r < RINGS; r++) {
      const sel = r === game.ring && !b.idle, glow = Math.max(sel ? 0.55 + 0.15 * Math.sin(b.time * 4) : 0, b.ringGlow[r]);
      g.beginPath(); g.arc(C, C, RING_R[r], 0, Math.PI * 2);
      if (glow > 0) { g.save(); g.lineWidth = 34; g.strokeStyle = `rgba(255,226,120,${0.4 * glow})`; g.shadowColor = '#ffe080'; g.shadowBlur = 30 * glow; g.stroke(); g.restore(); }
      g.lineWidth = 16; g.strokeStyle = '#2e2208'; g.stroke();
      g.lineWidth = 10; g.strokeStyle = sel ? '#ffe27a' : '#9a7e34'; g.stroke();
      g.lineWidth = 2.5; g.strokeStyle = sel ? '#fff8d0' : '#d0b060'; g.beginPath(); g.arc(C, C, RING_R[r] - 2, 0, Math.PI * 2); g.stroke();
    }
    // The constellation: faint lines joining its places, a star chart's figure; then its medallions.
    const con = b.shownCon;
    if (con) {
      const fade = ease(b.conFade), flare = b.conFlare, ps = chartOrder(con.marks);
      g.save();
      g.lineWidth = 3 + 5 * flare;
      g.strokeStyle = `rgba(210,225,255,${(0.45 + 0.5 * flare) * fade})`;
      g.setLineDash(flare ? [] : [10, 10]);
      g.beginPath();
      ps.forEach((m, i) => { const [x, y] = xy(radius(m.ring), ang(m.spoke)); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
      g.stroke();
      g.restore();
      g.save();
      g.globalAlpha = fade;
      const grid = shownGrid();
      for (const m of con.marks) {
        const [x, y] = xy(radius(m.ring), ang(m.spoke)), here = grid.get(`${m.ring},${m.spoke}`);
        medallion(g, m.colour, x, y, here === m.colour || flare > 0, flare > 0 ? 1 + flare : 0.5 + 0.2 * Math.sin(b.time * 2.5 + m.spoke), 1 + 0.35 * flare);
      }
      g.restore();
    }
    // The stars.
    for (const [id, s] of b.stars) {
      const [x, y] = xy(s.r, s.a);
      let k = 1;
      if (b.lit?.has(id)) {   // (a line about to go: ringed and swelling)
        const u = Math.min(1, b.t / TIME.line);
        k = 1 + 0.25 * u;
        g.save(); g.lineWidth = 5; g.strokeStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(b.t * 40)})`; g.beginPath(); g.arc(x, y, STAR_R * 1.35, 0, Math.PI * 2); g.stroke(); g.restore();
      }
      if (s.flee) g.globalAlpha = Math.max(0, 1 - (s.r - s.fr) / (S - s.fr) * 1.5);
      const R = STAR_R * k;
      g.drawImage(starCanvas(s.c), x - R, y - R, 2 * R, 2 * R);
      g.globalAlpha = 1;
    }
    // The next star, out on its handle, glowing (not while one's still dropping in).
    if (!b.dropFrom.length && !(b.stage?.kind === 'booch')) {
      const n = game.next, [x, y] = xy(OUT, ang(n.spoke)), p = 0.5 + 0.5 * Math.sin(b.time * 5);
      const gg = g.createRadialGradient(x, y, 6, x, y, 62);
      gg.addColorStop(0, hexA(COL[n.c].light, 0.7)); gg.addColorStop(1, hexA(COL[n.c].base, 0));
      g.fillStyle = gg; g.beginPath(); g.arc(x, y, 62, 0, Math.PI * 2); g.fill();
      const R = STAR_R * (1.05 + 0.08 * p);
      g.save(); g.translate(x, y); g.rotate(Math.sin(b.time * 2) * 0.15);
      g.drawImage(starCanvas(n.c), -R, -R, 2 * R, 2 * R);
      g.restore();
    }
    // Sparks and ghosts.
    for (const f of b.fx) {
      const u = f.t / f.t0;
      if (f.kind === 'spark') { g.fillStyle = f.col; g.globalAlpha = 1 - u; g.beginPath(); g.arc(f.x, f.y, 5 * (1 - u) + 1, 0, Math.PI * 2); g.fill(); }
      else { const R = STAR_R * (1 + u); g.globalAlpha = 1 - u; g.drawImage(starCanvas(f.c), f.x - R, f.y - R, 2 * R, 2 * R); }
      g.globalAlpha = 1;
    }
    // A booch: the sky flushes red.
    if (b.flash > 0) {
      g.save(); g.beginPath(); g.arc(C, C, SKY, 0, Math.PI * 2); g.clip();
      g.fillStyle = `rgba(200,30,30,${0.45 * b.flash})`; g.fillRect(0, 0, S, S); g.restore();
    }
  }
  // Which colour each place holds as drawn, by "ring,spoke" (stars at rest only).
  const shownGrid = () => {
    const m = new Map();
    for (const s of b.stars.values()) {
      const r = RING_R.indexOf(Math.round(s.r)), sp = Math.round(((s.a + Math.PI / 2) / (2 * Math.PI / SPOKES) % SPOKES + SPOKES) % SPOKES);
      if (r >= 0 && Math.abs(s.r - RING_R[r]) < 1) m.set(`${r},${sp}`, s.c);
    }
    return m;
  };

  b.prompt = () => `Duty Navigation · Up / Down choose a ring · Left / Right turn it · Space drops the star · constellation ${game.completed + 1}, ${game.moves} moves (par ${game.constellation ? parFor(game.constellation.marks.length) : '-'})`;
  // The camera to play it from: straight on to its face, far enough back to see it all.
  b.camView = (camera) => {
    const vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect);
    const dist = Math.max((size / 2) / Math.tan(vh), (size / 2) / Math.tan(hh)) * 1.08;
    group.updateMatrixWorld(true);
    const look = new THREE.Vector3().setFromMatrixPosition(group.matrixWorld), out = new THREE.Vector3(0, 0, 1).transformDirection(group.matrixWorld);
    return { look, from: look.clone().addScaledVector(out, dist), dist };
  };
  // Redraw every star where the game has it now, without animating (after changing the game behind
  // the board's back).
  b.refresh = () => { b.queue = []; b.stage = null; b.dropFrom = []; b.lit = null; layNow(game.grid); b.shownCon = game.constellation; b.conFade = 1; };
  b.dispose = () => {
    group.removeFromParent();
    face.geometry.dispose(); face.material.dispose(); tex.dispose();
  };
  draw();
  tex.needsUpdate = true;
  return b;
}

/** A constellation's places in the order its figure's lines join them: from the innermost, on to the
    nearest not yet joined. */
function chartOrder(marks) {
  if (marks.length < 2) return marks;
  const pos = (m) => xy(radius(m.ring), ang(m.spoke));
  const left = marks.slice().sort((p, q) => p.ring - q.ring || p.spoke - q.spoke), out = [left.shift()];
  while (left.length) {
    const [x, y] = pos(out[out.length - 1]);
    let bi = 0, bd = Infinity;
    left.forEach((m, i) => { const [mx, my] = pos(m); const d = Math.hypot(mx - x, my - y); if (d < bd) { bd = d; bi = i; } });
    out.push(left.splice(bi, 1)[0]);
  }
  return out;
}
