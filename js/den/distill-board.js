// Distilling's look, for any board that plays it: Puzzle Pirates' own panel, the still and the flask
// above, the honeycomb of bubbles, the furnace below. The puzzle itself, its rules, is
// src/distilling.ts (one copy of it); this only draws a board of it wherever its caller puts it (a plane
// in the scene, its picture painted on a canvas) and plays it by the real keys and mouse. It knows
// nothing of the den (it imports only three.js and the rules), so a test page plays it on its own
// (distilling-test.html). It's to be Helium's still: the hooks below say when a column goes, up or
// burned (a burnt one could be his still's little bang), when the furnace warns, and when it's over.
import * as THREE from 'three';
import {
  Distilling, COLS, TALL, SWAP_MS, SLIDE_MS, MESSAGES, WHITE, BROWN, BLACK, SPICE, BURNT, WAY,
} from '../distilling.js';

/* Drawn after the real one (DISTILLING.md §2, from the client port's measures): a portrait panel 450
   by 600. The top strip, 135 high: "Distilling" in gold letters outlined dark, top centre; behind it
   the shop: the distiller on the left by his barrels, a brass pot still (a tall polished cylinder, a
   domed lid, a tap), and right of it the flask, a glass cylinder (42 by 75 at 235, 55) with dark metal
   caps, tick marks up its right side and a white line at the level; a brass pipe from it to the right
   and down a chute at the board's top right, where columns sent up rise. The liquid rises with pieces
   sent up, golden (hue 49), paler and clearer the purer. The board, 425 by 465 at (25, 135): dark brown,
   burnished, lighter and olive-gold in the middle, framed by thin double brass lines. Pieces 40 px
   glossy spheres, outlined dark, lit top left: white pale cream-yellow, brown rich amber gold, black dark
   olive grey-green, spice bright orange with a darker ember swirl, burnt white a dull mottled khaki.
   Each lights the quarter facing a neighbour it can swap with: little khaki nubs bridge swappable
   pairs. The piece selected glows, red brackets at its corners (the cursor). At the bottom right the
   furnace, an iron box with a grille (109 by 66), its glow rising as the burn nears; to its left a
   copper trough along the bottom, where burned whites roll back left, scorched. Swaps slide 150 ms; a
   leaving column glides up into the pipe or down into the furnace (0.4 px a ms), then the board slides
   right over 900 ms. Messages float up 30 px over 1.5 s in the middle, fading in the second half
   ("Burnt!" and "Wasted Spice" drift down). "Finished!" holds the board when the flask is full. */

const PW = 450, PH = 600, K = 2;
/** The board view in the panel, its cells, and the furnace, flask and trough. */
const VX = 25, VY = 135, VW = 425, VH = 465, CELL = 40, TOP = 23;
const FURN = { x: 316, y: 399, w: 109, h: 66 };
const FLASK = { x: 235, y: 55, w: 42, h: 75 };
const EXIT_UP = -CELL, EXIT_DOWN = 416, EXIT_X = 9 * CELL, SPEED = 0.4;
const FLOAT_MS = 1500, FLOAT_PX = 30;

/** A piece's colours: base, light, shadow, outline. */
const COL = {
  [WHITE]: { base: '#f3e8b4', light: '#fffdf0', dark: '#bfae6a', edge: '#5a4c20' },
  [BROWN]: { base: '#c9861c', light: '#ffd27a', dark: '#7a4608', edge: '#3a2004' },
  [BLACK]: { base: '#4a5440', light: '#9aa888', dark: '#20261a', edge: '#0c1008' },
  [SPICE]: { base: '#f47a14', light: '#ffd08a', dark: '#b8300a', edge: '#5a1404' },
  [BURNT]: { base: '#b4a674', light: '#e2d6a8', dark: '#6e6238', edge: '#3a3014' },
};

const canvas = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); return cv; };
const ease = (u) => u * u * (3 - 2 * u);

/** A piece, a glossy sphere 40 px (drawn at K times), cached by kind. */
const PIECES = new Map();
function pieceCanvas(p) {
  if (PIECES.has(p)) return PIECES.get(p);
  const c = COL[p], S = CELL * K, R = S / 2 - 2 * K;
  const cv = canvas(S, S, (g) => {
    const m = S / 2;
    g.beginPath(); g.arc(m, m, R, 0, Math.PI * 2);
    const gr = g.createRadialGradient(m - R * 0.38, m - R * 0.42, R * 0.08, m, m, R);
    gr.addColorStop(0, c.light); gr.addColorStop(0.35, c.base); gr.addColorStop(1, c.dark);
    g.fillStyle = gr; g.fill();
    if (p === SPICE) {   // an ember's swirl
      g.save(); g.clip();
      g.strokeStyle = 'rgba(160,30,4,0.75)'; g.lineWidth = 4 * K / 2;
      g.beginPath();
      for (let a = 0; a < Math.PI * 3.2; a += 0.1) { const r = R * 0.12 + a * R * 0.07; g.lineTo(m + Math.cos(a) * r, m + Math.sin(a) * r); }
      g.stroke(); g.restore();
    }
    if (p === BURNT) {   // scorched: mottled
      g.save(); g.beginPath(); g.arc(m, m, R, 0, Math.PI * 2); g.clip();
      let s = 7;
      const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
      for (let i = 0; i < 14; i++) {
        g.fillStyle = `rgba(${70 + rnd() * 40},${55 + rnd() * 30},${20 + rnd() * 20},${0.25 + rnd() * 0.3})`;
        g.beginPath(); g.arc(m + (rnd() - 0.5) * R * 1.6, m + (rnd() - 0.5) * R * 1.6, R * (0.08 + rnd() * 0.16), 0, Math.PI * 2); g.fill();
      }
      g.restore();
    }
    // The shine, top left, and the outline.
    const sh = g.createRadialGradient(m - R * 0.4, m - R * 0.45, 0, m - R * 0.4, m - R * 0.45, R * 0.45);
    sh.addColorStop(0, 'rgba(255,255,255,0.85)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sh; g.beginPath(); g.arc(m, m, R, 0, Math.PI * 2); g.fill();
    g.lineWidth = 1.6 * K; g.strokeStyle = c.edge; g.beginPath(); g.arc(m, m, R, 0, Math.PI * 2); g.stroke();
  });
  PIECES.set(p, cv);
  return cv;
}

/** The panel's still parts (everything but the pieces, the flask's liquid, the furnace's glow and the
    messages), drawn once. */
let PANEL = null;
function panelCanvas() {
  if (PANEL) return PANEL;
  PANEL = canvas(PW * K, PH * K, (g) => {
    g.scale(K, K);
    // The shop: a dark plank wall, warm lamp light from the middle.
    const wall = g.createLinearGradient(0, 0, 0, VY);
    wall.addColorStop(0, '#2a1a0e'); wall.addColorStop(1, '#4a2e16');
    g.fillStyle = wall; g.fillRect(0, 0, PW, VY);
    for (let y = 8; y < VY; y += 18) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, y, PW, 1.5); }
    const lamp = g.createRadialGradient(200, 70, 10, 200, 70, 230);
    lamp.addColorStop(0, 'rgba(255,190,90,0.28)'); lamp.addColorStop(1, 'rgba(255,190,90,0)');
    g.fillStyle = lamp; g.fillRect(0, 0, PW, VY);
    // Barrels.
    for (const [bx, by, bw, bh] of [[92, 84, 38, 50], [118, 98, 34, 37]]) barrel(g, bx, by, bw, bh);
    // The distiller: coat, sash, head, tricorn.
    distiller(g, 50, 135);
    // The pot still: a polished brass cylinder, a domed lid, a swan neck to the flask, a tap.
    potStill(g);
    // The flask's back and the pipe to the chute at the board's top right.
    pipe(g);
    // The board: dark brown, burnished, olive-gold in the middle, a double brass frame.
    g.fillStyle = '#1c1008'; g.fillRect(0, VY, PW, PH - VY);
    const bg = g.createRadialGradient(VX + 200, VY + 200, 30, VX + 200, VY + 210, 330);
    bg.addColorStop(0, '#6e5a26'); bg.addColorStop(0.45, '#4a3416'); bg.addColorStop(1, '#22140a');
    g.fillStyle = bg; g.fillRect(VX, VY, VW, VH);
    let s = 3;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 260; i++) {   // burnish
      g.strokeStyle = `rgba(${rnd() < 0.5 ? '255,220,150' : '0,0,0'},${0.03 + rnd() * 0.05})`;
      g.lineWidth = 0.6 + rnd();
      const x = VX + rnd() * VW, y = VY + rnd() * VH, a = (rnd() - 0.5) * 0.6;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 30, y + Math.sin(a) * 30); g.stroke();
    }
    for (const [o, col] of [[1.5, '#b89a48'], [5, '#7a6a30']]) { g.strokeStyle = col; g.lineWidth = 1.4; g.strokeRect(VX + o, VY + o, VW - 2 * o, VH - 2 * o); }
    g.strokeStyle = '#d8b858'; g.lineWidth = 2; g.strokeRect(1, 1, PW - 2, PH - 2);
    // The copper trough along the bottom, left of the furnace.
    const ty = VY + 412, tr = g.createLinearGradient(0, ty, 0, ty + 40);
    tr.addColorStop(0, '#d88a4a'); tr.addColorStop(0.3, '#a8582a'); tr.addColorStop(0.7, '#6a3014'); tr.addColorStop(1, '#3a1808');
    g.fillStyle = tr; g.beginPath(); g.roundRect(VX + 6, ty, FURN.x - 8, 40, 10); g.fill();
    g.fillStyle = '#2a1206'; g.beginPath(); g.roundRect(VX + 12, ty + 6, FURN.x - 20, 26, 8); g.fill();
    g.strokeStyle = 'rgba(255,200,140,0.45)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(VX + 12, ty + 3); g.lineTo(VX + FURN.x - 6, ty + 3); g.stroke();
    // The furnace: an iron box, rivets, its grille (lit by the glow, drawn each frame).
    const fx = VX + FURN.x, fy = VY + FURN.y;
    const iron = g.createLinearGradient(fx, fy, fx + FURN.w, fy + FURN.h);
    iron.addColorStop(0, '#5a5a5e'); iron.addColorStop(1, '#202024');
    g.fillStyle = iron; g.beginPath(); g.roundRect(fx, fy, FURN.w, FURN.h, 6); g.fill();
    g.strokeStyle = '#0e0e10'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = '#9a9aa0';
    for (const [rx, ry] of [[6, 6], [FURN.w - 6, 6], [6, FURN.h - 6], [FURN.w - 6, FURN.h - 6]]) { g.beginPath(); g.arc(fx + rx, fy + ry, 2.2, 0, Math.PI * 2); g.fill(); }
    // The title, gold, outlined dark, top centre.
    g.font = '700 34px Alegreya, Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 6; g.strokeStyle = '#2a1404'; g.lineJoin = 'round'; g.strokeText('Distilling', PW / 2 + 10, 24);
    const gold = g.createLinearGradient(0, 8, 0, 40);
    gold.addColorStop(0, '#fff2a0'); gold.addColorStop(0.5, '#e8b62a'); gold.addColorStop(1, '#a86c10');
    g.fillStyle = gold; g.fillText('Distilling', PW / 2 + 10, 24);
  });
  return PANEL;
}
function barrel(g, x, y, w, h) {
  const gr = g.createLinearGradient(x, 0, x + w, 0);
  gr.addColorStop(0, '#4a2a10'); gr.addColorStop(0.45, '#9a6230'); gr.addColorStop(1, '#3a1e0a');
  g.fillStyle = gr; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); g.fill();
  g.fillRect(x + 2, y + 6, w - 4, h - 12);
  g.strokeStyle = '#2a2a2a'; g.lineWidth = 2.5;
  for (const f of [0.2, 0.8]) { g.beginPath(); g.moveTo(x + 2, y + h * f); g.quadraticCurveTo(x + w / 2, y + h * f + 3, x + w - 2, y + h * f); g.stroke(); }
}
function distiller(g, x, y) {
  // A pirate in a long green coat, red sash, tricorn, standing at the still.
  g.fillStyle = '#2e4a2a'; g.beginPath(); g.moveTo(x - 22, y); g.lineTo(x - 16, y - 58); g.quadraticCurveTo(x, y - 66, x + 16, y - 58); g.lineTo(x + 24, y); g.fill();
  g.fillStyle = '#a8261c'; g.fillRect(x - 17, y - 34, 34, 7);
  g.fillStyle = '#e6c8a0'; g.beginPath(); g.arc(x + 1, y - 74, 12, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#3a2410'; g.beginPath(); g.arc(x - 2, y - 66, 8, 0, Math.PI); g.fill();   // beard
  g.fillStyle = '#1a1410'; g.beginPath(); g.moveTo(x - 22, y - 82); g.quadraticCurveTo(x + 1, y - 104, x + 24, y - 82); g.quadraticCurveTo(x + 1, y - 90, x - 22, y - 82); g.fill();
  g.strokeStyle = '#c8a040'; g.lineWidth = 1.2; g.stroke();
  g.fillStyle = '#e6c8a0'; g.beginPath(); g.arc(x + 26, y - 40, 5, 0, Math.PI * 2); g.fill();   // a hand on the tap
  g.strokeStyle = '#2e4a2a'; g.lineWidth = 7; g.beginPath(); g.moveTo(x + 12, y - 52); g.lineTo(x + 24, y - 42); g.stroke();
}
function potStill(g) {
  const x = 150, y = 58, w = 58, h = 72;
  const br = g.createLinearGradient(x, 0, x + w, 0);
  br.addColorStop(0, '#6a4a14'); br.addColorStop(0.3, '#f0d070'); br.addColorStop(0.55, '#c89a30'); br.addColorStop(1, '#5a3a0c');
  g.fillStyle = br; g.beginPath(); g.roundRect(x, y, w, h, 6); g.fill();
  g.beginPath(); g.ellipse(x + w / 2, y + 2, w / 2, 16, 0, Math.PI, 0); g.fill();   // the dome
  g.fillStyle = '#c89a30'; g.fillRect(x + w / 2 - 4, y - 22, 8, 10);
  g.strokeStyle = '#4a2e08'; g.lineWidth = 1.2; g.beginPath(); g.roundRect(x, y, w, h, 6); g.stroke();
  for (const f of [0.25, 0.75]) { g.strokeStyle = 'rgba(80,50,10,0.6)'; g.beginPath(); g.moveTo(x, y + h * f); g.lineTo(x + w, y + h * f); g.stroke(); }
  // The swan neck to the flask, and the tap.
  g.strokeStyle = '#b88a2a'; g.lineWidth = 5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x + w / 2, y - 18); g.quadraticCurveTo(x + w + 10, y - 30, FLASK.x + FLASK.w / 2, FLASK.y - 6); g.stroke();
  g.lineWidth = 4; g.beginPath(); g.moveTo(x + 4, y + h - 14); g.lineTo(x - 8, y + h - 14); g.lineTo(x - 8, y + h - 6); g.stroke();
}
function pipe(g) {
  // From the flask's right, along and down a chute over the board's top right.
  const cx = VX + EXIT_X + CELL / 2;
  g.strokeStyle = '#8a6420'; g.lineWidth = 10; g.lineCap = 'butt';
  g.beginPath(); g.moveTo(FLASK.x + FLASK.w, FLASK.y + 30); g.lineTo(cx, FLASK.y + 30); g.lineTo(cx, VY + 4); g.stroke();
  g.strokeStyle = '#e8c060'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(FLASK.x + FLASK.w, FLASK.y + 27); g.lineTo(cx - 3, FLASK.y + 27); g.lineTo(cx - 3, VY + 4); g.stroke();
  g.fillStyle = '#6a4a14'; g.beginPath(); g.roundRect(cx - 24, VY - 8, 48, 14, 3); g.fill();   // the chute's mouth
}

/** An HSB colour (0-1 each) as rgb. */
function hsb(h, s, v) {
  const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const [r, g, b] = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6];
  return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
}

/** Cursor moves by the game's keys (BrewBoardView): down-left, up-left, up, up-right, down-right, down. */
const SW = 0, NW = 2, N = 3, NE = 4, SE = 6, S = 7;
const KEY_MOVES = {
  ArrowLeft: SW, '1': SW, End: SW, '4': SW, ArrowRight: NE, '9': NE, PageUp: NE, '6': NE,
  ArrowDown: S, '2': S, ArrowUp: N, '8': N, '3': SE, PageDown: SE, '7': NW, Home: NW,
};

/* Hooks: `onColumn(column, finished)` as a column goes, up or burned (the rules' Column: up, points,
   bonus, chain, message, spice); `onWarning()` as the furnace warns, about 3 s before; `onSwap(a, b)`
   after each swap; `onFinish(game)` when the flask is full (or it's dismissed).
   Returns the board: add `board.group` to the scene, call `tick(dt)` every frame (it drives the rules'
   clock: `paused` stops it), feed it `key`, `pointer`, `press` and `release`, and `dispose()` it when
   you're done. `game` is the rules' Distilling; `swapAt(x, y, way)` and `burn()` play it as a hand
   would (a bot's), shown as they happen. */
export function distillBoard(o = {}) {
  const game = o.game ?? new Distilling(o.random ?? Math.random, o.options ?? {});
  const cv = document.createElement('canvas');
  cv.width = PW * K; cv.height = PH * K;
  const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const size = o.size ?? 3;
  const group = new THREE.Group();
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1, PH / PW), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  group.add(face);
  group.position.copy(o.at ?? new THREE.Vector3());
  group.rotation.set(-(o.lean ?? 0), o.yaw ?? 0, 0, 'YXZ');
  group.scale.setScalar(size);

  const b = {
    game, group, canvas: cv, size, paused: false, idle: false,
    onColumn: o.onColumn ?? null, onWarning: o.onWarning ?? null, onSwap: o.onSwap ?? null, onFinish: o.onFinish ?? null,
    now: 0,
  };
  /** Where a piece sits (its top left, in the board view): by column and row, the column's height as the game has it. */
  const spot = (col, row) => [col * CELL, TOP + row * CELL + (game.cols[col].length === TALL ? 0 : CELL / 2)];
  /** The pieces as drawn: grid[col][row] a sprite { p, col, row, x, y, path }, and those leaving. */
  let grid = [], leaving = [];
  const sprite = (col, row, x) => { const [sx, sy] = spot(col, row); return { p: game.cols[col][row], col, row, x: x ?? sx, y: sy, path: null }; };
  const layNow = () => { grid = game.cols.map((c, col) => c.map((_, row) => sprite(col, row))); leaving = []; };
  layNow();
  /** Move a sprite along points over times (ms on b.now), then call onEnd. */
  const go = (s, pts, durs, onNode, onEnd) => { s.path = { pts: [[s.x, s.y], ...pts], durs, t0: b.now, onNode, onEnd, at: 0 }; };
  const line = (s, to, ms, onEnd) => go(s, [to], [ms], null, onEnd);

  let cursor = { col: 0, row: 0 }, selected = null, dragging = false, dragSwapped = false, held = false, clickBusy = 0;
  let messages = [], over = false, finishedAt = null, heatShown = 0;

  const animateSwap = (a, c) => {
    const pa = spot(a.col, a.row), pc = spot(c.col, c.row);
    grid[a.col][a.row] = c; grid[c.col][c.row] = a;
    [a.col, a.row, c.col, c.row] = [c.col, c.row, a.col, a.row];
    line(a, pc, SWAP_MS); line(c, pa, SWAP_MS);
    if (!dragging) clickBusy = SWAP_MS;
    b.onSwap?.(a, c);
  };
  /** Swap the pieces at two places, if the rules let them, and show it. */
  const trySwap = (x1, y1, x2, y2) => {
    if (!game.swap(x1, y1, x2, y2)) return false;
    animateSwap(grid[x1][y1], grid[x2][y2]);
    return true;
  };
  b.swapAt = (x, y, way) => { const n = game.neighbour(x, y, way); return !!n && trySwap(x, y, n[0], n[1]) && n; };
  /** A hand's drag (a bot's, or Helium's): the piece at (x, y) held, glowing under the cursor as it's
      swept along; `letGo()` when the drag's done. */
  b.hold = (x, y) => { selected = grid[x]?.[y] ?? null; cursor = { col: x, row: y }; };
  b.letGo = () => { selected = null; };
  b.burn = () => handle(game.burnNow());

  // A column goes: its pieces glide up into the pipe or down into the furnace (burned whites rolling
  // back left along the trough, scorched), the board slides right, a new column comes in.
  function columnGone(c, finished) {
    for (const s of grid[COLS - 1]) {
      if (s === selected) selected = null;
      const burning = !c.up && s.p === WHITE, ey = c.up ? EXIT_UP : EXIT_DOWN;
      const d1 = Math.hypot(EXIT_X - s.x, ey - s.y) / SPEED;
      const pts = [[EXIT_X, ey]], durs = [d1];
      if (burning) { pts.push([-CELL, ey]); durs.push((EXIT_X + CELL) / SPEED * 1.6); }
      go(s, pts, durs, burning ? () => { s.p = BURNT; } : null, () => { leaving = leaving.filter((q) => q !== s); });
      leaving.push(s);
    }
    grid.pop();
    grid.unshift(game.cols[0].map((_, row) => sprite(0, row, -CELL)));
    grid.forEach((col, x) => col.forEach((s) => { s.col = x; const [tx, ty] = spot(x, s.row); line(s, [tx, ty], SLIDE_MS); }));
    if (cursor.col < COLS - 1) cursor = { col: cursor.col + 1, row: Math.min(cursor.row, game.cols[cursor.col + 1].length - 1) };
    // Messages, as the game shows them.
    if (c.message === 'clear') say(MESSAGES.clear, { sup: c.chain > 1 ? String(c.chain) : '' });
    else if (c.message === 'smooth') say(MESSAGES.smooth);
    else if (c.message === 'blecch') say(MESSAGES.blecch);
    else if (c.message === 'burnt') say(MESSAGES.burnt, { down: true });
    if (c.spice === 'spicy') say(MESSAGES.spicy, { orange: true });
    else if (c.spice === 'wasted') say(MESSAGES.wasted, { orange: true, down: true });
    b.onColumn?.(c, finished);
    if (finished) finish();
  }
  function finish() {
    if (over) return;
    over = true; finishedAt = b.now; selected = null;
    say(MESSAGES.finished, { hold: true });
    b.onFinish?.(game);
  }
  function handle(ev) {
    for (const e of ev) {
      if (e.kind === 'warning') b.onWarning?.();
      else columnGone(e.column, e.finished);
    }
    return ev;
  }
  b.dismiss = () => { if (game.finished) return; game.dismiss(); finish(); };

  /** A message in the middle of the board, moved clear of others still showing. */
  function say(text, opt = {}) {
    const px = opt.orange || opt.down ? 24 : 30;
    let y = VH / 2 - px / 2;
    for (const m of messages) { const my = msgY(m); if (y < my + m.px * 1.2 && my < y + px * 1.2) y = my + m.px * 1.2; }
    messages.push({ text, sup: opt.sup ?? '', px, y, t0: b.now, down: !!opt.down, orange: !!opt.orange, hold: !!opt.hold });
  }
  const msgY = (m) => { const u = Math.min(1, (b.now - m.t0) / FLOAT_MS); return m.hold ? m.y : m.y + (m.down ? 1 : -1) * FLOAT_PX * u; };

  // Selecting and swapping, as the game does it: a click selects a piece, a click on a neighbour swaps
  // them; held down, the piece selected is dragged on through every swap it can make.
  const pieceAt = (c) => grid[c.col]?.[c.row];
  function selOrSwap() {
    if (!game.movable || over || clickBusy > 0) return;
    const s = pieceAt(cursor);
    if (!s) return;
    if (!selected) { if (!dragging && game.mask(s.col, s.row)) selected = s; }
    else if (selected === s) { if (!dragging) selected = null; }
    else if (trySwap(s.col, s.row, selected.col, selected.row)) { if (dragging) dragSwapped = true; else selected = null; }
    else if (!dragging && game.mask(s.col, s.row)) selected = s;
  }
  function moveCursor(dir) {
    const tall = game.tall(cursor.col);
    let dx = 0, dy = 0;
    if (dir === SW) { dx = -1; dy = tall && cursor.col !== 0 ? 0 : 1; }
    else if (dir === NW) { dx = -1; dy = !tall && cursor.col !== 0 ? 0 : -1; }
    else if (dir === N) dy = -1;
    else if (dir === NE) { dx = 1; dy = !tall && cursor.col !== COLS - 1 ? 0 : -1; }
    else if (dir === SE) { dx = 1; dy = tall && cursor.col !== COLS - 1 ? 0 : 1; }
    else if (dir === S) dy = 1;
    const col = Math.max(0, Math.min(COLS - 1, cursor.col + dx));
    cursor = { col, row: Math.max(0, Math.min(game.cols[col].length - 1, cursor.row + dy)) };
  }
  b.key = (key, e) => {
    if (key in KEY_MOVES) { moveCursor(KEY_MOVES[key]); return true; }
    if (key === ' ' || key === 'Spacebar' || key === '5' || key === 'Clear') { if (!e?.repeat) selOrSwap(); return true; }
    if (key === 'x' || key === 'X') { if (!e?.repeat && !over) b.burn(); return true; }
    return false;
  };
  // The mouse: (u, v) in the panel's pixels. The cursor follows it; dragging, the piece held swaps
  // toward wherever the mouse has gone, if it can (smoothed: the way nearest the mouse, rather than
  // only with the mouse right over a piece's middle).
  let mouse = null;
  const hover = (u, v) => {
    const vx = u - VX, vy = v - VY;
    if (vx < 0 || vy < 0 || vx >= VW || vy >= VH) return false;
    const col = Math.max(0, Math.min(COLS - 1, Math.trunc(vx / CELL))), tall = game.tall(col);
    const row = Math.max(0, Math.min(game.cols[col].length - 1, Math.trunc(Math.max(0, vy - TOP - (tall ? 0 : CELL / 2)) / CELL)));
    if (!dragging) cursor = { col, row };
    return true;
  };
  const dragOn = () => {
    if (!dragging || !selected || !mouse || !game.movable || over) return;
    for (let i = 0; i < 4; i++) {
      const [sx, sy] = spot(selected.col, selected.row);
      const dx = (mouse[0] - VX - sx - CELL / 2) / CELL, dy = (mouse[1] - VY - sy - CELL / 2) / CELL;
      const way = game.wayToward(selected.col, selected.row, dx, dy);
      if (way === null) break;
      const n = game.neighbour(selected.col, selected.row, way);
      if (!trySwap(selected.col, selected.row, n[0], n[1])) break;
      dragSwapped = true;
      cursor = { col: selected.col, row: selected.row };
    }
  };
  const ray = new THREE.Raycaster();
  /** The mouse at (nx, ny), -1 to 1 across the canvas as three.js has it; true when it's over the board. */
  b.pointer = (nx, ny, camera) => {
    ray.setFromCamera(new THREE.Vector2(nx, ny), camera);
    group.updateMatrixWorld(true);
    const n = new THREE.Vector3(0, 0, 1).transformDirection(group.matrixWorld), p0 = new THREE.Vector3().setFromMatrixPosition(group.matrixWorld);
    const p = new THREE.Vector3();
    if (!ray.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(n, p0), p)) { mouse = null; return false; }
    group.worldToLocal(p);
    const u = (p.x + 0.5) * PW, v = (PH / PW / 2 - p.y) * PW;
    mouse = [u, v];
    const on = hover(u, v);
    dragOn();
    return on;
  };
  /** A button pressed (0 left, 2 right: burn now) or let go, the mouse where pointer last put it. */
  b.press = (button) => {
    if (button === 2) { if (!over) b.burn(); return; }
    if (!mouse || !hover(...mouse)) return;
    selOrSwap();
    dragging = held = true;
  };
  b.release = (button) => {
    if (button === 2) return;
    if (dragSwapped && selected) selected = null;
    dragging = dragSwapped = held = false;
  };
  b.busy = () => clickBusy > 0 || game.sliding > 0 || grid.some((c) => c.some((s) => s.path));
  b.cursor = () => ({ ...cursor });
  b.selected = () => (selected ? { col: selected.col, row: selected.row } : null);

  b.tick = (dt) => {
    const ms = dt * 1000;
    b.now += ms;
    clickBusy = Math.max(0, clickBusy - ms);
    if (!b.paused && !over) handle(game.tick(ms));
    for (const s of [...grid.flat(), ...leaving]) step(s);
    heatShown += (game.heat() - heatShown) * Math.min(1, dt * 10);
    messages = messages.filter((m) => m.hold || b.now - m.t0 < FLOAT_MS);
    draw();
    tex.needsUpdate = true;
  };
  function step(s) {
    const P = s.path;
    if (!P) return;
    let t = b.now - P.t0;
    for (let i = 0; i < P.durs.length; i++) {
      if (t < P.durs[i]) {
        const u = P.durs[i] > 0 ? t / P.durs[i] : 1, [ax, ay] = P.pts[i], [bx, by] = P.pts[i + 1], k = P.durs.length > 1 ? u : ease(u);
        s.x = ax + (bx - ax) * k; s.y = ay + (by - ay) * k;
        return;
      }
      t -= P.durs[i];
      if (P.at <= i) { P.at = i + 1; if (i < P.durs.length - 1) P.onNode?.(); }
    }
    [s.x, s.y] = P.pts[P.pts.length - 1];
    s.path = null;
    P.onEnd?.();
  }

  function draw() {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(panelCanvas(), 0, 0);
    g.scale(K, K);
    drawFlask();
    drawFurnace();
    // The pieces, clipped to the board.
    g.save();
    g.beginPath(); g.rect(VX, VY, VW, VH); g.clip();
    g.translate(VX, VY);
    const resting = (s) => !s.path;
    for (const col of grid) for (const s of col) {
      if (s === selected) {
        const gl = g.createRadialGradient(s.x + 20, s.y + 20, 12, s.x + 20, s.y + 20, 28);
        gl.addColorStop(0, 'rgba(255,240,160,0.9)'); gl.addColorStop(1, 'rgba(255,240,160,0)');
        g.fillStyle = gl; g.fillRect(s.x - 10, s.y - 10, 60, 60);
      }
    }
    for (const s of [...grid.flat(), ...leaving]) g.drawImage(pieceCanvas(s.p), s.x, s.y, CELL, CELL);
    // The links: a khaki nub on each of a swappable pair, facing the other (resting pieces only).
    if (!over) for (const col of grid) for (const s of col) {
      if (!resting(s) || s.p === SPICE) continue;
      const m = game.mask(s.col, s.row);
      if (!m) continue;
      for (let d = 0; d < 4; d++) {
        if (!(m & (1 << d))) continue;
        const wx = WAY[d][0] * CELL, wy = WAY[d][1] * CELL, len = Math.hypot(wx, wy);
        const cx = s.x + 20 + (wx / len) * 14.5, cy = s.y + 20 + (wy / len) * 14.5;
        g.fillStyle = '#d8cc88'; g.strokeStyle = '#3a3410'; g.lineWidth = 1.2;
        g.beginPath(); g.ellipse(cx, cy, 5, 3.4, Math.atan2(wy, wx), 0, Math.PI * 2); g.fill(); g.stroke();
      }
    }
    // The cursor: red brackets at its corners.
    if (!over && !b.idle) {
      const c = pieceAt(cursor);
      if (c) {
        const x = c.x, y = c.y, L = 9;
        g.strokeStyle = '#e8241c'; g.lineWidth = 2.5; g.lineCap = 'square';
        for (const [px, py, sx, sy] of [[x, y, 1, 1], [x + CELL, y, -1, 1], [x, y + CELL, 1, -1], [x + CELL, y + CELL, -1, -1]]) {
          g.beginPath(); g.moveTo(px, py + sy * L); g.lineTo(px, py); g.lineTo(px + sx * L, py); g.stroke();
        }
      }
    }
    // Messages.
    for (const m of messages) {
      const u = Math.min(1, (b.now - m.t0) / FLOAT_MS);
      g.globalAlpha = m.hold ? 1 : u < 0.5 ? 1 : 1 - (u - 0.5) * 2;
      g.font = `700 ${m.px}px Alegreya, Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'top';
      const y = msgY(m), x = 200;
      g.lineWidth = 5; g.strokeStyle = '#1a0c02'; g.lineJoin = 'round';
      g.strokeText(m.text, x, y);
      g.fillStyle = m.orange ? '#ff9a2a' : m.down ? '#e8d0a0' : '#ffe680';
      g.fillText(m.text, x, y);
      if (m.sup) {
        const w = g.measureText(m.text).width;
        g.font = `700 ${m.px * 0.6}px Alegreya, Georgia, serif`; g.textAlign = 'left';
        g.strokeText(m.sup, x + w / 2 + 2, y - 4); g.fillText(m.sup, x + w / 2 + 2, y - 4);
      }
      g.globalAlpha = 1;
    }
    g.restore();
  }
  function drawFlask() {
    const { x, y, w, h } = FLASK;
    g.fillStyle = 'rgba(20,24,28,0.75)'; g.beginPath(); g.roundRect(x, y, w, h, 6); g.fill();
    const L = game.liquid();
    if (game.flask > 0) {
      const top = h - Math.round(L.level * h);
      g.save(); g.beginPath(); g.roundRect(x, y, w, h, 6); g.clip();
      g.globalAlpha = Math.max(0.12, L.alpha); g.fillStyle = hsb(L.hue, L.sat, L.bri); g.fillRect(x, y + top, w, h - top);
      g.globalAlpha = 1; g.fillStyle = '#fff'; g.fillRect(x, y + top - 1, w, 2);
      g.restore();
    }
    // Glass: a sheen down the left, tick marks up the right, dark metal caps.
    const gl = g.createLinearGradient(x, 0, x + w, 0);
    gl.addColorStop(0, 'rgba(255,255,255,0.35)'); gl.addColorStop(0.25, 'rgba(255,255,255,0.06)'); gl.addColorStop(0.8, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(255,255,255,0.2)');
    g.fillStyle = gl; g.beginPath(); g.roundRect(x, y, w, h, 6); g.fill();
    g.strokeStyle = 'rgba(220,235,240,0.7)'; g.lineWidth = 1.2; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 1;
    for (let i = 1; i < 10; i++) { const ty = y + h - (h * i) / 10, l = i % 5 === 0 ? 9 : 5; g.beginPath(); g.moveTo(x + w - 2 - l, ty); g.lineTo(x + w - 2, ty); g.stroke(); }
    g.fillStyle = '#2a2a30';
    g.beginPath(); g.roundRect(x - 4, y - 7, w + 8, 9, 3); g.fill();
    g.beginPath(); g.roundRect(x - 4, y + h - 2, w + 8, 9, 3); g.fill();
  }
  function drawFurnace() {
    // The grille: eight slots, lit orange from the bottom as the burn nears, full just before.
    const fx = VX + FURN.x + 12, fy = VY + FURN.y + 12, fw = FURN.w - 24, fh = FURN.h - 24, n = 5;
    const lit = over ? 0 : heatShown;
    for (let i = 0; i < n; i++) {
      const sy = fy + fh - (i + 1) * (fh / n) + 2, on = Math.max(0, Math.min(1, lit * n - i));
      g.fillStyle = '#120a06'; g.fillRect(fx, sy, fw, fh / n - 3);
      if (on > 0) {
        const fl = 0.85 + 0.15 * Math.sin(b.now / 90 + i);
        g.fillStyle = `rgba(255,${Math.round(110 + 90 * on)},30,${on * fl})`; g.fillRect(fx, sy, fw, fh / n - 3);
      }
    }
    if (lit > 0.75) {
      const gl = g.createRadialGradient(fx + fw / 2, fy + fh, 4, fx + fw / 2, fy + fh, 70);
      gl.addColorStop(0, `rgba(255,140,40,${(lit - 0.75) * 1.6})`); gl.addColorStop(1, 'rgba(255,140,40,0)');
      g.fillStyle = gl; g.fillRect(fx - 40, fy - 40, fw + 80, fh + 60);
    }
  }

  b.prompt = () => (over ? 'Finished: restart for another batch'
    : 'Distilling · click a piece then a neighbour to swap (or drag through swaps) · arrows / number pad move · Space swaps · X or right-click burns the column now');
  // The camera to play it from: straight on to its face, far enough back to see it all.
  b.camView = (camera) => {
    const vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect);
    const dist = Math.max((size * PH / PW / 2) / Math.tan(vh), (size / 2) / Math.tan(hh)) * 1.06;
    group.updateMatrixWorld(true);
    const look = new THREE.Vector3().setFromMatrixPosition(group.matrixWorld), out = new THREE.Vector3(0, 0, 1).transformDirection(group.matrixWorld);
    return { look, from: look.clone().addScaledVector(out, dist), dist };
  };
  /** Redraw every piece where the game has it, without animating (after changing the game behind the board's back). */
  b.refresh = () => { layNow(); selected = null; };
  b.dispose = () => {
    group.removeFromParent();
    face.geometry.dispose(); face.material.dispose(); tex.dispose();
  };
  draw();
  tex.needsUpdate = true;
  return b;
}
