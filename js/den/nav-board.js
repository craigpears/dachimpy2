// Duty Navigation's look, for any board that plays it: Puzzle Pirates' own panel, a ship's wheel
// standing on a night sea, and the stars. The puzzle itself, its rules, is src/navigation.ts: one
// copy of it; this only draws a board of it wherever its caller puts it (a plane in the scene, its
// picture painted on a canvas), and plays it by the real keys. It knows nothing of the den (it
// imports only three.js and the rules), so a test page can play it on its own (navigation-test.html).
// It's to be the night sky in front of the hidden cliff door, each constellation lighting its stars
// on the rock: the hooks below say when one's filled (and its marks, to light), and when you booch.
import * as THREE from 'three';
import { Navigation, RINGS, SPOKES, parFor } from '../navigation.js';

/* Drawn after Puzzle Pirates' own (YPPedia's "Navigation": its board pictures, full size, looked at
   close on 11 Nov). An upright panel, 3 wide by 4 high: "Navigation" in pale serif letters at the
   top, a pale crescent moon at the top left, a few faint stars in a navy sky, and below the middle a
   flat painted sea in wavy bands of navy, teal and royal blue. On it an olive-gold ship's wheel, its
   handles' knot-work reaching the panel's sides. Its three rings are the places: the outer ring is
   the wheel's own broad rim (white tick marks round it), the middle a second broad rim, the inner a
   thin ring near the hub; eight thin spokes, out past the rim to the handles, each a little ring and
   two leaves. In the hub, gold filigree: a half dome above, an anchor below, and a ship's hull of
   loops and peaks between the two lower rims. The stars are glossy and cut, each point a light facet
   and a dark one, dark-edged, a shape to each colour: yellow a fat six-pointed star, red a sharp
   five-pointed one, orange a spiky burst, white eight thin points, blue a compass star (four long
   points, four short). The next star sits out on a spoke's handle, a pale halo round it. The
   constellation's places are drawn on the board, nothing joining them: empty, a thick ring of its
   colour round a dark middle, the colour's star outlined in it; holding its colour, a coin of that
   colour with its star on it; holding another, the ring with that star sitting in it. Down the
   bottom left a column of little stars, lit from the bottom (made up: here, how far under par you
   are), and at the top right a cluster of four small stars, that sparkles as a constellation goes. */

/** The canvas: S wide; with the sky, the panel's height (the real one's 450 by 600); and the
    board's radii on it, centred: the three rings, the handles' little rings (where the next star
    sits), and a star's size. (Measured off the real board, scaled from 450 wide to 1024.) */
const S = 1024, C = S / 2, PANEL_H = 1366, RING_R = [118, 248, 369], OUT = 457, STAR_R = 46;
/** A spoke's angle on the canvas (y down): 0 straight up, then clockwise. */
const ang = (spoke) => -Math.PI / 2 + spoke * (2 * Math.PI / SPOKES);
const radius = (ring) => (ring < RINGS ? RING_R[ring] : OUT);
/** Where a place is on the board, x right and y up, the board's width 1 (from -0.5 to 0.5): for a
    host lighting a constellation's stars on something else in the same arrangement. */
export function placeXY(ring, spoke) { const r = radius(ring) / S, a = ang(spoke); return { x: Math.cos(a) * r, y: -Math.sin(a) * r }; }

/** The colours, as COLOUR_NAMES: the star's base, light facet, dark facet and edge; a coin's ring and
    face; and its shape (points, how deep the notches, and the odd points' length when they alternate). */
const COL = [
  { base: '#f2c830', light: '#fff4a8', dark: '#b88a10', edge: '#6a4a04', ring: '#f6e01e', face: '#e6d488', pts: 6, depth: 0.56 },                 // yellow
  { base: '#dc2236', light: '#ff9aa4', dark: '#8a0a1a', edge: '#4a0410', ring: '#e8303c', face: '#d02a38', pts: 5, depth: 0.44 },                 // red
  { base: '#f8862a', light: '#ffd2a0', dark: '#b84a0a', edge: '#6a2804', ring: '#f08a34', face: '#f4a050', pts: 12, depth: 0.52, alt: 0.8 },      // orange
  { base: '#ecebf6', light: '#ffffff', dark: '#aaa6c8', edge: '#4a4870', ring: '#ead8f0', face: '#dcd8e8', pts: 8, depth: 0.46 },                 // white
  { base: '#b8dcff', light: '#ffffff', dark: '#6aa8ec', edge: '#1a6ad8', ring: '#7ab2f2', face: '#5a90e2', pts: 8, depth: 0.3, alt: 0.58 },       // blue
];

const canvas = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); return cv; };
/** A star's corners: tips and notches round it, from the top. */
function starPts(c, x, y, r) {
  const { pts, depth, alt = 1 } = COL[c], out = [];
  for (let i = 0; i < pts * 2; i++) {
    const a = -Math.PI / 2 + i * Math.PI / pts, rr = i % 2 ? r * depth : (i % 4 === 2 ? r * alt : r);
    out.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr, a]);
  }
  return out;
}
function starPath(g, c, x, y, r) {
  g.beginPath();
  for (const [px, py] of starPts(c, x, y, r)) g.lineTo(px, py);
  g.closePath();
}
const mix = (h1, h2, t) => {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16), m = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return `rgb(${m(16)},${m(8)},${m(0)})`;
};
/** A star, 128 square, as the real ones: each point cut in two, a facet either side of its ridge, lit
    from the top left, and a dark edge. (Exported: the one drawing of a navigation star, for a host
    to light on the rock.) */
const STARS = new Map();
export function starCanvas(c) {
  if (STARS.has(c)) return STARS.get(c);
  const K = COL[c];
  const cv = canvas(128, 128, (g) => {
    const p = starPts(c, 64, 64, 58), n = p.length, L = -3 * Math.PI / 4;
    // The facets: from the middle to each tip and the notch either side of it.
    for (let i = 0; i < n; i += 2) {
      for (const side of [-1, 1]) {
        const v = p[(i + side + n) % n], t = Math.cos(p[i][2] + side * 1.1 - L);
        g.fillStyle = t > 0 ? mix(K.base, K.light, Math.min(1, t * 0.95)) : mix(K.base, K.dark, Math.min(1, -t * 0.85));
        g.beginPath(); g.moveTo(64, 64); g.lineTo(p[i][0], p[i][1]); g.lineTo(v[0], v[1]); g.closePath(); g.fill();
        g.strokeStyle = g.fillStyle; g.lineWidth = 0.8; g.stroke();   // (no hairline seams)
      }
    }
    starPath(g, c, 64, 64, 58);
    g.lineJoin = 'round'; g.lineWidth = 3; g.strokeStyle = K.edge; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.75)';
    g.beginPath(); g.arc(57, 55, 4, 0, Math.PI * 2); g.fill();
  });
  STARS.set(c, cv);
  return cv;
}
/** A little flat star for the panel's meter and cluster: lit (filled pale), or just its outline. */
function smallStar(g, x, y, r, fill, line) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.48 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  g.lineJoin = 'round'; g.lineWidth = 4; g.strokeStyle = line; g.stroke();
}

/** The panel behind it all: the night sky with its moon and faint stars, the painted sea below the
    middle, the title. */
let PANEL_CV = null;
function panelCanvas() {
  if (PANEL_CV) return PANEL_CV;
  PANEL_CV = canvas(S, PANEL_H, (g, w, h) => {
    const cy = h / 2, horizon = cy - 8;
    const sky = g.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#011646'); sky.addColorStop(1, '#0a2a64');
    g.fillStyle = sky; g.fillRect(0, 0, w, horizon + 4);
    let a = 11;
    const rnd = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
    for (let i = 0; i < 46; i++) {   // (a few faint stars, some twinkling)
      const x = rnd() * w, y = rnd() * horizon * 0.95, r = 1.6 + rnd() * 2;
      g.fillStyle = `rgba(190,205,240,${0.35 + rnd() * 0.4})`;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      if (i % 7 === 0) { g.fillRect(x - r * 3, y - 0.8, r * 6, 1.6); g.fillRect(x - 0.8, y - r * 3, 1.6, r * 6); }
    }
    // The moon, a pale crescent at the top left, open to the right.
    const moon = canvas(160, 160, (m) => {
      const gr = m.createLinearGradient(20, 20, 120, 140);
      gr.addColorStop(0, '#b4c2e0'); gr.addColorStop(1, '#7a8cb8');
      m.fillStyle = gr; m.beginPath(); m.arc(80, 80, 58, 0, Math.PI * 2); m.fill();
      m.globalCompositeOperation = 'destination-out';
      m.beginPath(); m.arc(104, 70, 52, 0, Math.PI * 2); m.fill();
    });
    g.drawImage(moon, 120 - 80, 128 - 80);
    // The sea: wavy bands, dark at the horizon, teal, then royal blue, faint darker lines between.
    const bands = [[0, '#0a1f5c'], [52, '#0e2c74'], [118, '#155e88'], [158, '#1b7898'], [204, '#155490'], [250, '#183c98'],
      [318, '#1d46ac'], [392, '#1a3ca2'], [470, '#2048b2'], [552, '#1a3a9c'], [620, '#1e44aa']];
    const wave = (y0, k) => { g.moveTo(0, y0); for (let x = 0; x <= w; x += 16) g.lineTo(x, y0 + Math.sin(x * (0.006 + k * 0.0013) + k * 1.7) * (5 + k % 3 * 3) + Math.sin(x * 0.017 + k) * 2.5); };
    bands.forEach(([dy, col], k) => {
      g.fillStyle = col; g.beginPath(); wave(horizon + dy, k); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
    });
    g.lineWidth = 2.5; g.strokeStyle = 'rgba(4,14,52,0.4)';
    bands.forEach(([dy], k) => { if (k) { g.beginPath(); wave(horizon + dy + 20 + k % 2 * 14, k + 5); g.stroke(); } });
    // The title.
    g.font = '600 56px "Book Antiqua", Palatino, Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = 9; g.strokeStyle = '#06102c'; g.strokeText('Navigation', w / 2, 48);
    g.fillStyle = '#e2eaf8'; g.fillText('Navigation', w / 2, 48);
  });
  return PANEL_CV;
}

/** Olive-gold, the wheel's: dark edge, body, shade and shine. */
const GOLD = { edge: '#2e2808', body: '#857526', shade: '#62561a', shine: '#ddd290', tick: '#f0ecd0' };
/** The wheel: spokes out to their handles, the hub's filigree, the thin inner ring and the two broad
    rims the other places sit on (one lit over it each frame). */
let WHEEL_CV = null;
function wheelCanvas() {
  if (WHEEL_CV) return WHEEL_CV;
  WHEEL_CV = canvas(S, S, (g) => {
    g.lineCap = 'round'; g.lineJoin = 'round';
    // Gold work: a dark edge, then the gold, along the same path.
    const gold = (path, w) => { path(); g.lineWidth = w + 6; g.strokeStyle = GOLD.edge; g.stroke(); g.lineWidth = w; g.strokeStyle = GOLD.body; g.stroke(); };
    const at = (r, a) => [C + Math.cos(a) * r, C + Math.sin(a) * r];
    for (let s = 0; s < SPOKES; s++) {
      const a = ang(s), u = [Math.cos(a), Math.sin(a)], v = [-u[1], u[0]];
      gold(() => { g.beginPath(); g.moveTo(C, C); g.lineTo(...at(OUT - 17, a)); }, 5);
      // The handle: a little ring, and two leaves out from it.
      const [kx, ky] = at(OUT, a);
      gold(() => { g.beginPath(); g.arc(kx, ky, 15, 0, Math.PI * 2); }, 5);
      for (const sd of [-1, 1]) {
        const bx = kx + u[0] * 13, by = ky + u[1] * 13, tx = bx + u[0] * 40 + v[0] * 24 * sd, ty = by + u[1] * 40 + v[1] * 24 * sd;
        gold(() => {
          g.beginPath(); g.moveTo(bx, by);
          g.quadraticCurveTo(bx + u[0] * 34 + v[0] * 2 * sd, by + u[1] * 34 + v[1] * 2 * sd, tx, ty);
          g.quadraticCurveTo(bx + u[0] * 6 + v[0] * 30 * sd, by + u[1] * 6 + v[1] * 30 * sd, bx, by);
        }, 5);
      }
    }
    // The hub's filigree: a half dome over the middle, an anchor under it, ribs out to a ship's hull
    // of peaks and loops between the two lower rims.
    gold(() => { g.beginPath(); g.arc(C, C, 62, Math.PI, 2 * Math.PI); g.moveTo(C - 62, C); g.lineTo(C + 62, C); }, 8);
    gold(() => { g.beginPath(); g.arc(C, C, 46, Math.PI, 2 * Math.PI); }, 3);
    gold(() => { g.beginPath(); g.moveTo(C, C + 4); g.lineTo(C, C + 236); }, 10);
    gold(() => {   // (the anchor's head, a spade, and its arms)
      g.beginPath(); g.moveTo(C, C - 4); g.quadraticCurveTo(C + 26, C + 24, C + 4, C + 46); g.lineTo(C - 4, C + 46); g.quadraticCurveTo(C - 26, C + 24, C, C - 4);
      for (const sd of [-1, 1]) { g.moveTo(C, C + 70); g.quadraticCurveTo(C + sd * 50, C + 74, C + sd * 54, C + 36); g.arc(C + sd * 46, C + 36, 8, 0, Math.PI * 2); }
    }, 6);
    gold(() => {   // (the ribs, like a ship's sweeping up to her hull)
      g.beginPath();
      for (const sd of [-1, 1]) {
        g.moveTo(C + sd * 8, C + 96); g.quadraticCurveTo(C + sd * 110, C + 112, C + sd * 176, C + 268);
        g.moveTo(C + sd * 8, C + 140); g.quadraticCurveTo(C + sd * 64, C + 156, C + sd * 82, C + 268);
        g.moveTo(C + sd * 26, C + 120); g.quadraticCurveTo(C + sd * 40, C + 196, C + sd * 30, C + 268);
      }
    }, 7);
    gold(() => {   // (the hull: a band of peaks and loops)
      g.beginPath();
      g.moveTo(C - 196, C + 268); g.lineTo(C + 196, C + 268); g.lineTo(C + 132, C + 336); g.lineTo(C - 132, C + 336); g.closePath();
      for (const x of [-120, 0, 120]) { g.moveTo(C + x - 30, C + 330); g.lineTo(C + x, C + 276); g.lineTo(C + x + 30, C + 330); }
      for (const x of [-60, 60]) { g.moveTo(C + x + 20, C + 302); g.arc(C + x, C + 302, 20, 0, Math.PI * 2); }
    }, 6);
    // The inner ring, thin.
    gold(() => { g.beginPath(); g.arc(C, C, RING_R[0], 0, Math.PI * 2); }, 9);
    g.lineWidth = 2; g.strokeStyle = GOLD.shine; g.beginPath(); g.arc(C, C, RING_R[0] - 2, 0, Math.PI * 2); g.stroke();
    // The two broad rims, the middle and the outer: shaded on the inside, a shine toward the outside,
    // tick marks round the outer like a dial's.
    for (const r of [RING_R[1], RING_R[2]]) {
      const w = 46;
      g.lineWidth = w + 7; g.strokeStyle = GOLD.edge; g.beginPath(); g.arc(C, C, r, 0, Math.PI * 2); g.stroke();
      g.lineWidth = w; g.strokeStyle = GOLD.body; g.stroke();
      g.lineWidth = w * 0.34; g.strokeStyle = GOLD.shade; g.beginPath(); g.arc(C, C, r - w * 0.3, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 4; g.strokeStyle = GOLD.shine; g.beginPath(); g.arc(C, C, r + w * 0.16, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 2; g.strokeStyle = 'rgba(221,210,144,0.6)'; g.beginPath(); g.arc(C, C, r - w * 0.12, 0, Math.PI * 2); g.stroke();
      const n = r === RING_R[2] ? 72 : 48;
      for (let i = 0; i < n; i++) {
        const a = i * 2 * Math.PI / n, long = i % 3 === 0;
        g.lineWidth = 2.5; g.strokeStyle = r === RING_R[2] ? GOLD.tick : 'rgba(46,40,8,0.7)';
        g.beginPath(); g.moveTo(...at(r + w * 0.05, a)); g.lineTo(...at(r + w * (long ? 0.36 : 0.26), a)); g.stroke();
      }
    }
  });
  return WHEEL_CV;
}

/** A constellation's place: holding its colour, a coin of it with its star on; else a thick ring of
    its colour round a dark middle, the star's outline in it (a wrong star drawn on top by the caller). */
function medallion(g, c, x, y, filled, glow, k = 1) {
  const K = COL[c], R = 56 * k;
  g.save();
  if (glow > 0) {
    const gg = g.createRadialGradient(x, y, R * 0.6, x, y, R * 2);
    gg.addColorStop(0, hexA(K.ring, 0.5 * glow)); gg.addColorStop(1, hexA(K.ring, 0));
    g.fillStyle = gg; g.beginPath(); g.arc(x, y, R * 2, 0, Math.PI * 2); g.fill();
  }
  g.beginPath(); g.arc(x, y, R - 6, 0, Math.PI * 2);
  if (filled) {
    const gr = g.createRadialGradient(x - R * 0.3, y - R * 0.35, 4, x, y, R);
    gr.addColorStop(0, mix(K.face, '#ffffff', 0.35)); gr.addColorStop(1, mix(K.face, '#000000', 0.12));
    g.fillStyle = gr; g.fill();
  } else {
    g.fillStyle = 'rgba(4,12,40,0.88)'; g.fill();
  }
  // The ring: its colour, a dark edge each side, lit along the top.
  g.lineWidth = 15; g.strokeStyle = 'rgba(10,10,30,0.7)'; g.beginPath(); g.arc(x, y, R - 6, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 11; g.strokeStyle = K.ring; g.stroke();
  g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.arc(x, y, R - 6, Math.PI * 1.1, Math.PI * 1.75); g.stroke();
  if (filled) {
    g.drawImage(starCanvas(c), x - R * 0.82, y - R * 0.82, R * 1.64, R * 1.64);
  } else {
    starPath(g, c, x, y, R * 0.66);
    g.fillStyle = hexA(K.edge, 0.35); g.fill();
    g.lineWidth = 3; g.lineJoin = 'round'; g.strokeStyle = mix(K.ring, '#000000', 0.45); g.stroke();
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
   where it goes; `size`: its width in metres (3). `sky`: draw the real puzzle's whole panel, its
   night sky and sea, title, meter and cluster, 3 wide by 4 high (true); without it the wheel and its
   stars stand on whatever's behind (the cliff, say), square. Either way the wheel's in the middle.
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
  const sky = o.sky !== false, CH = sky ? PANEL_H : S, OFF = (CH - S) / 2;
  const cv = document.createElement('canvas');
  cv.width = S; cv.height = CH;
  const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const size = o.size ?? 3;
  const group = new THREE.Group();
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1, CH / S), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
  group.add(face);
  group.position.copy(o.at ?? new THREE.Vector3());
  group.rotation.set(-(o.lean ?? 0), o.yaw ?? 0, 0, 'YXZ');
  group.scale.setScalar(size);

  const b = {
    game, group, canvas: cv, size, sky, idle: false,
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
    if (d > RING_R[RINGS - 1] + 60) return false;
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
    g.clearRect(0, 0, S, CH);
    if (sky) g.drawImage(panelCanvas(), 0, 0);
    // The wheel and all on it, its middle the canvas's.
    g.save();
    g.translate(0, OFF);
    g.drawImage(wheelCanvas(), 0, 0);
    // The ring selected, a little brighter (and one just turned, brighter still for a moment).
    for (let r = 0; r < RINGS; r++) {
      const sel = r === game.ring && !b.idle, lift = Math.max(sel ? 0.22 + 0.05 * Math.sin(b.time * 3) : 0, b.ringGlow[r] * 0.55);
      if (lift <= 0) continue;
      g.save(); g.globalCompositeOperation = 'lighter';
      g.lineWidth = r ? 46 : 10; g.strokeStyle = `rgba(150,130,60,${lift})`;
      g.beginPath(); g.arc(C, C, RING_R[r], 0, Math.PI * 2); g.stroke();
      g.restore();
    }
    // The constellation's places.
    const con = b.shownCon;
    if (con) {
      const fade = ease(b.conFade), flare = b.conFlare;
      g.save();
      g.globalAlpha = fade;
      const grid = shownGrid();
      for (const m of con.marks) {
        const [x, y] = xy(radius(m.ring), ang(m.spoke)), here = grid.get(`${m.ring},${m.spoke}`);
        medallion(g, m.colour, x, y, here === m.colour || flare > 0, flare > 0 ? 1 + flare : 0, 1 + 0.3 * flare);
      }
      g.restore();
    }
    // The stars (on a place of the constellation's in its own colour, the coin shows it instead).
    const filled = new Set();
    if (con) for (const m of con.marks) filled.add(`${m.ring},${m.spoke},${m.colour}`);
    for (const [id, s] of b.stars) {
      const [x, y] = xy(s.r, s.a);
      const rr = RING_R.indexOf(Math.round(s.r)), sp = Math.round(((s.a + Math.PI / 2) / (2 * Math.PI / SPOKES) % SPOKES + SPOKES) % SPOKES);
      if (rr >= 0 && filled.has(`${rr},${sp},${s.c}`) && !b.lit?.has(id)) continue;
      let k = 1;
      if (b.lit?.has(id)) {   // (a line about to go: ringed and swelling)
        const u = Math.min(1, b.t / TIME.line);
        k = 1 + 0.25 * u;
        g.save(); g.lineWidth = 5; g.strokeStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(b.t * 40)})`; g.beginPath(); g.arc(x, y, STAR_R * 1.3, 0, Math.PI * 2); g.stroke(); g.restore();
      }
      if (s.flee) g.globalAlpha = Math.max(0, 1 - (s.r - s.fr) / (S - s.fr) * 1.5);
      const R = STAR_R * k;
      g.drawImage(starCanvas(s.c), x - R, y - R, 2 * R, 2 * R);
      g.globalAlpha = 1;
    }
    // The next star, out on its spoke's handle, a pale halo round it (not while one's still dropping in).
    if (!b.dropFrom.length && !(b.stage?.kind === 'booch')) {
      const n = game.next, [x, y] = xy(OUT, ang(n.spoke)), p = 0.5 + 0.5 * Math.sin(b.time * 4);
      const gg = g.createRadialGradient(x, y, STAR_R * 0.6, x, y, STAR_R * 1.5);
      gg.addColorStop(0, `rgba(200,220,255,${0.45 + 0.15 * p})`); gg.addColorStop(1, 'rgba(160,190,255,0)');
      g.fillStyle = gg; g.beginPath(); g.arc(x, y, STAR_R * 1.5, 0, Math.PI * 2); g.fill();
      g.drawImage(starCanvas(n.c), x - STAR_R, y - STAR_R, 2 * STAR_R, 2 * STAR_R);
    }
    // Sparks and ghosts.
    for (const f of b.fx) {
      const u = f.t / f.t0;
      if (f.kind === 'spark') { g.fillStyle = f.col; g.globalAlpha = 1 - u; g.beginPath(); g.arc(f.x, f.y, 5 * (1 - u) + 1, 0, Math.PI * 2); g.fill(); }
      else { const R = STAR_R * (1 + u); g.globalAlpha = 1 - u; g.drawImage(starCanvas(f.c), f.x - R, f.y - R, 2 * R, 2 * R); }
      g.globalAlpha = 1;
    }
    g.restore();
    if (sky) panelBits();
    // A booch: the night flushes red.
    if (b.flash > 0) {
      g.save();
      if (!sky) { g.beginPath(); g.arc(C, C, OUT + 50, 0, Math.PI * 2); g.clip(); }
      g.fillStyle = `rgba(200,30,30,${0.45 * b.flash})`; g.fillRect(0, 0, S, CH); g.restore();
    }
  }
  // The panel's own pieces: the column of little stars at the bottom left (lit from the bottom: a
  // star a place of the constellation's, all lit until you pass par, then going out as par / moves),
  // and the cluster at the top right, sparkling as a constellation goes.
  function panelBits() {
    const con = game.constellation, n = Math.max(3, con ? con.marks.length : 3);
    const lit = con ? n * Math.min(1, parFor(con.marks.length) / Math.max(1, game.moves)) : n;
    for (let i = 0; i < n; i++) {
      const x = 91, y = CH - 80 - i * 43;
      smallStar(g, x, y, 21, 'rgba(0,10,40,0.25)', '#c8b030');
      const f = Math.max(0, Math.min(1, lit - i));
      if (f > 0) {
        g.save(); g.beginPath(); g.rect(x - 30, y + 24 - 48 * f, 60, 48 * f); g.clip();
        const gr = g.createLinearGradient(x, y - 21, x, y + 21);
        gr.addColorStop(0, '#fffbd8'); gr.addColorStop(1, '#f0de70');
        smallStar(g, x, y, 21, gr, '#b89a20');
        g.restore();
      }
    }
    const sp = b.conFlare;
    for (const [dx, dy] of [[0, -26], [24, 0], [0, 26], [-24, 0]]) smallStar(g, 950 + dx, 74 + dy, 14 * (1 + 0.2 * sp), '#eef2a8', '#8a8a2a');
    if (sp > 0) {
      for (let i = 0; i < 18; i++) {
        const a = i * 2.4 + b.time * 3, r = 28 + (i % 5) * 9;
        g.fillStyle = `rgba(255,250,190,${sp * (0.5 + 0.5 * Math.sin(b.time * 20 + i))})`;
        g.fillRect(950 + Math.cos(a) * r - 2, 74 + Math.sin(a) * r - 2, 4, 4);
      }
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
    const dist = Math.max((size * CH / S / 2) / Math.tan(vh), (size / 2) / Math.tan(hh)) * 1.08;
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
