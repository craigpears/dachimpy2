// The Sailing board's look: Puzzle Pirates' Sailing drawn flat on the screen, its pieces balloons
// that pop when they clear (TODO.md, "Sailing's look, when it's drawn"; IDEAS.md, Tzz's balloon
// animals). Only the look and the touch pad: the rules are src/sailing.ts, the falling pair
// src/sail-pair.ts. It knows nothing of the den (it imports only the rules), so a test page can stand
// it up on its own; js/den/sail-station.js plays it at sea.
import { W, H, SPAWN, chainName } from '../sailing.js';

/* From the user's screenshot of "a huge multi Vegas" (10 Nov): 8 wide by 16 tall, the next pair at
   the top left, two markers over the middle columns where pairs come in. Three balls: blue wavy
   water, yellow knotted rope, white swirled sail; a pair's halves joined by a little brown peg that
   stays after they land. Platforms are translucent square tiles with a thin ledge under them:
   filled, the piece shows inside; empty, coloured corner brackets for the colour it wants. A wave
   and a ship's sails behind the board.
   Each pop shown for what it is (11 Nov, of Tzz's board: "there was no chain of four or platform
   clear ... a yellow on a white block, and somehow it cleared a platform"): a target square is
   faintly tinted the colour it wants, its brackets showing round whatever's in it, so a platform
   reads as its colours and a square that's no target stays plain; and before a step pops, what it
   is lights up (the stage says, src/sailing.ts): a line's four ringed, or a platform's outline, and
   then they all pop together, the platform fading and its ledge dropping away with them.
   And balloony (11 Nov: "how on earth do these sailing pieces pop in the puzzle? It makes sense.
   They're balloon animals"): each piece a glossy balloon with its knot, a little squishy, squashing
   as it lands; when a chain goes off they pop a step at a time down the board, pop-pop-pop, each a
   quick swell, a burst and confetti, and the chain's name comes up as it climbs. */

/** In the board's own units: a square 40, the rim, and the head over it (the next pair, the
    markers, the score). */
const CELL = 40, RIM = 10, HEAD = 78, BW = W * CELL + 2 * RIM, BH = H * CELL + HEAD + 2 * RIM;
const px = (c) => RIM + c * CELL, py = (r) => RIM + HEAD + r * CELL;
/** Water, rope, wind (COLOUR_NAMES): base, light, dark, and the confetti's. */
const COL = [
  { base: '#2f86e8', light: '#a8dcff', dark: '#123f7c', bits: ['#2f86e8', '#7cc4ff', '#ffffff'] },
  { base: '#f2bf2a', light: '#fff2ae', dark: '#8f6206', bits: ['#f2bf2a', '#ffe680', '#b5782a'] },
  { base: '#eef2f8', light: '#ffffff', dark: '#7f8ea8', bits: ['#ffffff', '#dce6f5', '#a9c3e6'] },
];

const canvas = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); return cv; };

/* A balloon, 128 square: a glossy round body a touch taller than wide, its pattern on it (water's
   waves, rope's braid and knot, wind's swirl), the shine top left, and its knot tied at the bottom.
   A fixed piece is the same balloon held in an iron hoop. (The one drawing of a Sailing balloon:
   balloons.js twists the same ones in someone's hands, RULES.md "The same thing looks the same
   everywhere".) */
const SPRITES = new Map();
export function balloon(c, fixed = false) {
  const k = `${c}${fixed ? 'f' : ''}`;
  if (SPRITES.has(k)) return SPRITES.get(k);
  const C = COL[c];
  const cv = canvas(128, 128, (g) => {
    const cx = 64, cy = 60, rx = 50, ry = 53;
    // The knot: a little tied twist below.
    g.fillStyle = C.dark;
    g.beginPath(); g.moveTo(cx - 9, cy + ry + 9); g.quadraticCurveTo(cx, cy + ry - 6, cx + 9, cy + ry + 9); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(cx, cy + ry - 1, 6, 4, 0, 0, Math.PI * 2); g.fill();
    // The body.
    const body = () => { g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); };
    body();
    const gr = g.createRadialGradient(cx - 18, cy - 22, 4, cx, cy, ry * 1.05);
    gr.addColorStop(0, C.light); gr.addColorStop(0.55, C.base); gr.addColorStop(1, C.dark);
    g.fillStyle = gr; g.fill();
    // Its pattern, on the skin.
    g.save(); body(); g.clip();
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (c === 0) {
      // Water: rolling waves across it.
      g.strokeStyle = 'rgba(255,255,255,0.62)'; g.lineWidth = 6;
      for (const y of [cy - 22, cy + 2, cy + 26]) {
        g.beginPath();
        for (let x = cx - rx; x <= cx + rx; x += 3) g.lineTo(x, y + Math.sin((x - cx) / 9 + y) * 6);
        g.stroke();
      }
    } else if (c === 1) {
      // Rope: a braid of strands slanting round it, and a knot in the middle.
      g.strokeStyle = 'rgba(120,78,8,0.55)'; g.lineWidth = 4;
      for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(cx + i * 16 - 50, cy - 60); g.lineTo(cx + i * 16 + 10, cy + 60); g.stroke(); }
      g.strokeStyle = 'rgba(255,248,210,0.35)'; g.lineWidth = 2;
      for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(cx + i * 16 - 45, cy - 60); g.lineTo(cx + i * 16 + 15, cy + 60); g.stroke(); }
      g.strokeStyle = '#7a4c0a'; g.lineWidth = 7;
      g.beginPath(); g.ellipse(cx - 9, cy + 4, 15, 11, -0.5, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.ellipse(cx + 9, cy + 4, 15, 11, 0.5, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = '#f7d870'; g.lineWidth = 3;
      g.beginPath(); g.ellipse(cx - 9, cy + 4, 15, 11, -0.5, 3.6, 5.6); g.stroke();
      g.beginPath(); g.ellipse(cx + 9, cy + 4, 15, 11, 0.5, 3.8, 5.8); g.stroke();
    } else {
      // Wind: a swirl, like a gust on a sail.
      g.strokeStyle = 'rgba(110,135,175,0.7)'; g.lineWidth = 5;
      g.beginPath();
      for (let a = 0; a < Math.PI * 4.2; a += 0.1) { const r = 4 + a * 3.4; g.lineTo(cx + 2 + Math.cos(a) * r, cy + 4 + Math.sin(a) * r * 0.9); }
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2;
      g.beginPath();
      for (let a = 0.3; a < Math.PI * 3.6; a += 0.1) { const r = 6 + a * 3.4; g.lineTo(cx + Math.cos(a) * r, cy + 2 + Math.sin(a) * r * 0.9); }
      g.stroke();
    }
    g.restore();
    // The rim of it, and the shine.
    body(); g.lineWidth = 2.5; g.strokeStyle = 'rgba(20,20,40,0.55)'; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.78)';
    g.beginPath(); g.ellipse(cx - 20, cy - 27, 13, 8, -0.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.beginPath(); g.arc(cx - 4, cy - 37, 3.5, 0, Math.PI * 2); g.fill();
    if (fixed) {
      // Held fast in an iron hoop.
      g.lineWidth = 9; g.strokeStyle = '#3b3f46';
      g.beginPath(); g.ellipse(cx, cy, rx - 3, ry - 3, 0, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 2; g.strokeStyle = '#8a929e';
      g.beginPath(); g.ellipse(cx, cy, rx - 6, ry - 6, 0, Math.PI * 1.1, Math.PI * 1.6); g.stroke();
      g.fillStyle = '#9aa2ae';
      for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; g.beginPath(); g.arc(cx + Math.cos(a) * (rx - 3), cy + Math.sin(a) * (ry - 3), 4, 0, Math.PI * 2); g.fill(); }
    }
  });
  SPRITES.set(k, cv);
  return cv;
}

/* What's behind the board, drawn once for each size: its wooden rim, the head's dark strip, and in
   the board a sky with a ship's sails standing up it and a wave rolling across its foot, washed
   over so the balloons read clearly. */
function backArt(k) {
  return canvas(Math.round(BW * k), Math.round(BH * k), (g) => {
    g.scale(k, k);
    g.fillStyle = '#3a2614'; g.beginPath(); g.roundRect(0, 0, BW, BH, 10); g.fill();
    g.fillStyle = '#5a3d22'; g.fillRect(RIM - 3, RIM - 3, BW - 2 * RIM + 6, HEAD - 4);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(RIM - 3, RIM + HEAD - 10, BW - 2 * RIM + 6, 3);
    const x0 = px(0), y0 = py(0), w = W * CELL, h = H * CELL;
    g.save();
    g.beginPath(); g.rect(x0, y0, w, h); g.clip();
    // The sky.
    const sky = g.createLinearGradient(0, y0, 0, y0 + h);
    sky.addColorStop(0, '#7fb6dc'); sky.addColorStop(0.6, '#3f7fb0'); sky.addColorStop(1, '#1d4f7e');
    g.fillStyle = sky; g.fillRect(x0, y0, w, h);
    // A ship's sails: her mast, a big square sail on each yard, billowing, and a jib.
    const mx = x0 + w * 0.56;
    g.globalAlpha = 0.5;   // (behind it all, faint: the balloons and platforms are what you read)
    g.fillStyle = '#4a3020'; g.fillRect(mx - 4, y0 + 20, 8, h * 0.78);
    g.fillRect(mx - w * 0.36, y0 + h * 0.12, w * 0.72, 6); g.fillRect(mx - w * 0.3, y0 + h * 0.42, w * 0.6, 6);
    const sail = (top, bot, half) => {
      const sg = g.createLinearGradient(mx - half, 0, mx + half, 0);
      sg.addColorStop(0, '#d9ccad'); sg.addColorStop(0.45, '#f6efdc'); sg.addColorStop(1, '#c9b892');
      g.fillStyle = sg;
      g.beginPath(); g.moveTo(mx - half, top); g.lineTo(mx + half, top);
      g.quadraticCurveTo(mx + half * 1.12, (top + bot) / 2, mx + half * 0.92, bot);
      g.quadraticCurveTo(mx, bot + 22, mx - half * 0.92, bot);
      g.quadraticCurveTo(mx - half * 1.12, (top + bot) / 2, mx - half, top);
      g.fill();
      g.strokeStyle = 'rgba(90,70,40,0.35)'; g.lineWidth = 2;
      for (let i = 1; i < 4; i++) { const x = mx - half + (2 * half * i) / 4; g.beginPath(); g.moveTo(x, top + 4); g.quadraticCurveTo(x + (x - mx) * 0.12, (top + bot) / 2, x - (x - mx) * 0.05, bot + 6); g.stroke(); }
    };
    sail(y0 + h * 0.12 + 6, y0 + h * 0.38, w * 0.34);
    sail(y0 + h * 0.42 + 6, y0 + h * 0.66, w * 0.28);
    g.fillStyle = '#ece2c8';
    g.beginPath(); g.moveTo(mx - 10, y0 + 30); g.lineTo(x0 + 8, y0 + h * 0.62); g.quadraticCurveTo(mx - w * 0.3, y0 + h * 0.55, mx - 10, y0 + h * 0.6); g.fill();
    g.globalAlpha = 1;
    // A wave rolling across the foot of it, its crest curling over in foam.
    const wy = y0 + h * 0.74;
    const sea = g.createLinearGradient(0, wy - 40, 0, y0 + h);
    sea.addColorStop(0, '#2a8bc0'); sea.addColorStop(1, '#0b3558');
    g.fillStyle = sea;
    g.beginPath(); g.moveTo(x0, y0 + h);
    g.lineTo(x0, wy + 30);
    g.bezierCurveTo(x0 + w * 0.25, wy + 10, x0 + w * 0.42, wy - 70, x0 + w * 0.66, wy - 64);
    g.bezierCurveTo(x0 + w * 0.86, wy - 58, x0 + w * 0.9, wy - 20, x0 + w * 0.78, wy - 18);
    g.bezierCurveTo(x0 + w * 0.88, wy + 10, x0 + w, wy + 6, x0 + w, wy + 10);
    g.lineTo(x0 + w, y0 + h); g.fill();
    g.strokeStyle = '#e8f6ff'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0 + w * 0.4, wy - 34); g.bezierCurveTo(x0 + w * 0.5, wy - 66, x0 + w * 0.82, wy - 72, x0 + w * 0.84, wy - 34); g.stroke();
    g.fillStyle = '#e8f6ff';
    for (const [fx, fy, r] of [[0.8, -26, 7], [0.76, -16, 5], [0.86, -22, 4], [0.7, -12, 3]]) { g.beginPath(); g.arc(x0 + w * fx, wy + fy, r, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = 'rgba(200,235,255,0.35)'; g.lineWidth = 3;
    for (let i = 0; i < 4; i++) { const y = wy + 40 + i * 26; g.beginPath(); for (let x = x0; x <= x0 + w; x += 6) g.lineTo(x, y + Math.sin(x / 14 + i) * 4); g.stroke(); }
    // Washed over, so the balloons stand out; the squares faintly marked.
    g.fillStyle = 'rgba(8,22,40,0.42)'; g.fillRect(x0, y0, w, h);
    g.strokeStyle = 'rgba(200,230,255,0.08)'; g.lineWidth = 1;
    for (let c = 1; c < W; c++) { g.beginPath(); g.moveTo(px(c), y0); g.lineTo(px(c), y0 + h); g.stroke(); }
    for (let r = 1; r < H; r++) { g.beginPath(); g.moveTo(x0, py(r)); g.lineTo(x0 + w, py(r)); g.stroke(); }
    g.restore();
    g.strokeStyle = '#1e140a'; g.lineWidth = 3; g.strokeRect(x0 - 1.5, y0 - 1.5, w + 3, h + 3);
    // The markers over the middle columns, where pairs come in.
    for (const c of SPAWN) {
      const mx2 = px(c) + CELL / 2, my = y0 - 8;
      g.fillStyle = '#ffd23a'; g.strokeStyle = '#3a2210'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(mx2 - 10, my - 12); g.lineTo(mx2 + 10, my - 12); g.lineTo(mx2, my); g.closePath(); g.fill(); g.stroke();
    }
    // The next pair's box, top left.
    g.fillStyle = 'rgba(20,12,6,0.55)'; g.beginPath(); g.roundRect(RIM + 4, RIM + 4, 96, HEAD - 20, 8); g.fill();
    g.fillStyle = '#e8d6b0'; g.font = "700 12px 'Alegreya Sans', sans-serif"; g.textAlign = 'left'; g.textBaseline = 'top';
    g.fillText('NEXT', RIM + 11, RIM + 7);
  });
}

// ---------- the touch pad ----------
const PAD = [['turnL', '⟲', 'Turn back (Q)'], ['turnR', '⟳', 'Turn (W or E)'], ['left', '◀', 'Left (A)'], ['right', '▶', 'Right (D)'], ['drop', '▼ Drop', 'Drop (S or Space)'], ['close', '✕ Helm', 'Back to the helm (R or Esc)']];
const PAD_W = 2 * 54 + 6;
function padMake(B) {
  const el = document.createElement('div');
  Object.assign(el.style, { position: 'absolute', display: 'grid', gridTemplateColumns: '54px 54px', gap: '6px', pointerEvents: 'auto', touchAction: 'none' });
  for (const [act, label, title] of PAD) {
    const b = document.createElement('button');
    b.textContent = label; b.title = title;
    Object.assign(b.style, { height: act === 'close' ? '40px' : '54px', font: "700 20px 'Alegreya Sans', sans-serif", color: '#f6ead2', background: 'rgba(40,26,14,0.88)', border: '1px solid #c9a35c', borderRadius: '10px', padding: '0', touchAction: 'none', cursor: 'pointer' });
    if (act === 'drop' || act === 'close') { b.style.gridColumn = 'span 2'; b.style.fontSize = act === 'close' ? '15px' : '19px'; }
    if (act === 'drop') b.style.background = 'rgba(110,70,20,0.92)';
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); B.onPad?.(act); });
    el.appendChild(b);
  }
  return el;
}

// A board's own state: its canvas, what's on it, what's playing out.
const state = (cv) => ({ cv, g: cv.getContext('2d'), k: 0, dpr: 1, back: null, sig: '', rect: null, game: null,
  pieces: new Map(), platforms: [], pops: [], bits: [], rings: [], glit: [], queue: [], prev: null, holdT: 0, steps: 0, banner: null, fall: null, shown: { r: 0, c: SPAWN[0] },
  hi: null, what: null, fading: [] });

/** The board's size in its own units (pixels at scale 1), and where a square of it is: for a board put
    in the world (sailBoardCanvas). */
export const SAIL_BOARD = { W: BW, H: BH, x: (c) => px(c) + CELL / 2, y: (r) => py(r) + CELL / 2 };

/** A board drawn off the page, to stand in the world as a picture (balloons.js: a lesson's board on its
    stand), the same board as at sea, played the same way (sailBoardLay, sailBoardDrop, sailBoardTick);
    `k` its scale (1: SAIL_BOARD.W by SAIL_BOARD.H pixels). Its canvas is `cv`. */
export function sailBoardCanvas(k = 1) {
  const cv = document.createElement('canvas');
  cv.width = Math.round(BW * k); cv.height = Math.round(BH * k);
  return Object.assign(state(cv), { el: null, k, back: backArt(k) });
}

/** The board on screen: made once, shown while it's played. `onPad(action, col?)`: a button on the
    touch pad ('left', 'right', 'turnL', 'turnR', 'drop', 'close'), or a column of the board pressed
    ('col'). */
export function sailBoardMake(onPad) {
  const el = document.createElement('div');
  Object.assign(el.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: 4, display: 'none' });
  el.className = 'sail-board';
  const cv = document.createElement('canvas');
  Object.assign(cv.style, { position: 'absolute', borderRadius: '10px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.55))', pointerEvents: 'auto', touchAction: 'none' });
  el.appendChild(cv);
  const B = { el, ...state(cv), onPad };
  B.pad = padMake(B);
  el.appendChild(B.pad);
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (!B.rect) return;
    const c = Math.floor(((e.clientX - B.rect.x) / B.k - RIM) / CELL);
    if (c >= 0 && c < W) B.onPad?.('col', c);
  });
  document.body.appendChild(el);
  return B;
}

/* Where it goes, by the screen's shape: on a wide screen down its left side, the sea she's sailing
   to its right; on a tall one (a phone) along the bottom, above the prompt, the sea above it. The
   touch pad goes beside it, on a tall screen always, on a wide one only for a touch screen. `low`:
   the screen's height left above the prompt; `top`: below the den's panel at the top. Says where
   the sea shows: `free`, a rectangle in pixels. */
export function sailBoardLayout(B, low, top, touch = matchMedia('(pointer: coarse)').matches) {
  const w = innerWidth, h = innerHeight, gap = 10;
  top = Math.max(gap, top + gap);
  const wide = w > h * 1.05, pad = touch || !wide;
  let k, x, y;
  if (wide) {
    k = Math.min(1.25, (h - top - gap) / BH, (w * 0.34 - (pad ? PAD_W + gap : 0)) / BW);
    x = gap; y = top + (h - top - gap - BH * k) / 2;
  } else {
    k = Math.min(1.1, (low - top - 2 * gap) * 0.76 / BH, (w - PAD_W - 3 * gap) / BW);
    x = (w - BW * k - PAD_W - gap) / 2; y = low - gap - BH * k;
  }
  const bw = BW * k, bh = BH * k;
  const sig = `${w}x${h}|${k.toFixed(3)}`;
  if (sig !== B.sig) {
    B.sig = sig;
    B.k = k; B.dpr = Math.min(2, devicePixelRatio);
    B.cv.width = Math.round(bw * B.dpr); B.cv.height = Math.round(bh * B.dpr);
    Object.assign(B.cv.style, { width: `${bw}px`, height: `${bh}px` });
    B.back = backArt(k * B.dpr);
  }
  Object.assign(B.cv.style, { left: `${x}px`, top: `${y}px` });
  B.rect = { x, y, w: bw, h: bh };
  B.pad.style.display = pad ? 'grid' : 'none';
  const ph = B.pad.offsetHeight || 230;
  Object.assign(B.pad.style, { left: `${x + bw + gap}px`, top: `${y + bh - ph}px` });
  const free = wide ? { x: x + bw + (pad ? PAD_W + gap : 0) + gap, y: 0, w: w - (x + bw + (pad ? PAD_W + gap : 0) + gap), h } : { x: 0, y: top, w, h: Math.max(60, y - gap - top) };
  return { wide, free };
}

/** Lay the board as it is (a fresh one, or opened again). */
export function sailBoardLay(B, game) {
  B.game = game;
  B.pieces.clear(); B.pops = []; B.bits = []; B.rings = []; B.queue = []; B.prev = null; B.holdT = 0;
  B.doomed = null; B.hi = null; B.what = null; B.fading = []; B.stagePlatforms = null; B.after = null;
  layGrid(B, game.snap(), game.platforms.slice());
}
function layGrid(B, grid, platforms) {
  B.pieces.clear();
  grid.forEach((line, r) => line.forEach((x, c) => { if (x) B.pieces.set(x.id, { x: c, y: r, ty: r, vy: 0, sq: 0, p: x }); }));
  B.platforms = platforms;
  B.prev = { grid, platforms };
}

/** A drop: its steps to play out (Sail.stages), and a fresh board after, if one was dealt. */
export function sailBoardDrop(B, res, game) {
  if (!res.dropped) return;
  B.steps = 0;
  B.queue.push(...res.stages);
  if (res.booched || res.boardCleared) B.queue.push({ kind: 'deal', booched: res.booched, grid: game.snap(), platforms: game.platforms.slice() });
}

const settling = (B) => [...B.pieces.values()].some((q) => Math.abs(q.y - q.ty) > 1e-3) || B.pops.some((p) => !p.gone);
/** Still playing out a drop. */
export const sailBoardBusy = (B) => B.queue.length > 0 || !!B.doomed || !!B.after || settling(B);
/** A new pair's come in at the top: it's drawn there at once, not glided up from where the last one
    landed. */
export function sailBoardSnap(B) { B.shown = { r: 0, c: SPAWN[0] }; }

function pop(B, q, delay, red = false) {
  B.pops.push({ x: q.x, y: q.y, p: q.p, t: -delay, gone: false, red });
}
// The next step of a drop: what's loose falls to where the rules have it fall (the board as the step
// before left it, settled by Sailing.fall on a copy), then what this step cleared pops, top first.
function stageNext(B) {
  const st = B.queue.shift();
  B.holdT = 0;
  if (st.kind === 'deal') {
    const rows = [...B.pieces.values()].map((q) => q.y), top = rows.length ? Math.min(...rows) : 0;
    for (const q of B.pieces.values()) pop(B, q, (q.y - top) * 0.02, st.booched);
    B.pieces.clear();
    B.banner = { text: st.booched ? 'Booched!' : 'Board cleared!', t: 0, bad: st.booched };
    B.after = () => layGrid(B, st.grid, st.platforms);
    return;
  }
  const at = new Map();
  if (B.prev && B.game) {
    const sim = B.game.copy(() => 0);
    sim.grid = B.prev.grid.map((line) => line.slice());
    sim.platforms = B.prev.platforms;
    sim.fall();
    sim.grid.forEach((line, r) => line.forEach((x, c) => { if (x) at.set(x.id, [r, c]); }));
  }
  st.grid.forEach((line, r) => line.forEach((x, c) => { if (x) at.set(x.id, [r, c]); }));
  for (const [id, [r, c]] of at) {
    let q = B.pieces.get(id);
    const p = st.grid[r]?.[c]?.id === id ? st.grid[r][c] : q?.p;
    if (!q) { q = { x: c, y: r, ty: r, vy: 0, sq: 0, p }; B.pieces.set(id, q); }
    q.ty = r; q.p = p ?? q.p;
  }
  B.doomed = new Set(st.cleared);
  B.what = { kind: st.kind, lines: st.lines ?? [], went: st.went ?? [], colours: new Map() };
  for (const l of B.what.lines) { const [r, c] = l[0]; B.what.colours.set(`${r},${c}`, colourAt(B, at, r, c)); }
  B.stagePlatforms = st.platforms;
  B.prev = { grid: st.grid, platforms: st.platforms };
}
// The colour of the piece that'll be at (r, c) once this step's fallen (`at`: where each is, by id).
function colourAt(B, at, r, c) {
  for (const [id, [rr, cc]] of at) if (rr === r && cc === c) return B.pieces.get(id)?.p.c;
  return undefined;
}
// Once everything's fallen and what it is has lit up (HILITE), the step's pops, all together: a
// line's four, or a platform's targets, the platform fading and its ledge dropping away with them.
// Step by step down the board, pop, pop, pop.
const HILITE = 0.3;
function doomedPop(B) {
  B.hi = null;
  if (!B.doomed?.size) { B.doomed = null; B.what = null; if (B.stagePlatforms) { B.platforms = B.stagePlatforms; B.stagePlatforms = null; } return; }
  const qs = [...B.doomed].map((id) => [id, B.pieces.get(id)]).filter(([, q]) => q);
  for (const [id, q] of qs) { pop(B, q, 0); B.pieces.delete(id); }
  B.doomed = null; B.what = null;
  B.steps++;
  if (B.steps >= 2) B.banner = { text: chainName(B.steps), t: 0 };
  // (a platform that went goes with its pops)
  const gone = B.platforms.filter((p) => !B.stagePlatforms?.includes(p));
  for (const p of gone) {
    B.fading.push({ p, t: 0 });
    for (let i = 0; i < 6; i++) B.bits.push({ x: p.c + Math.random() * p.w, y: p.r + p.h, vx: (Math.random() - 0.5) * 3, vy: -2 - Math.random() * 2, t: 0, life: 0.8, col: '#8a5a2a', w: 0.18, h: 0.07, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12 });
  }
  B.platforms = B.stagePlatforms ?? B.platforms;
  B.stagePlatforms = null;
}

const POP_SWELL = 0.09;
/** A frame: the drop playing out, and the board drawn, with `pair` (a SailPair, or null while it's
    hidden) falling in it; `sp`, the sparkle (src/den-sailing.ts, Sparkle): its meter in the head,
    and glitter over the board while a chain's show lasts. */
export function sailBoardTick(B, dt, pair, sp = null) {
  B.sp = sp;
  // Glitter over the board, as much as the show (a Double a little, a Vegas a shower).
  const lv = sp?.level ?? 0;
  B.owed = (B.owed ?? 0) + dt * 40 * lv ** 1.3;
  for (; B.owed >= 1; B.owed--) B.glit.push({ x: Math.random() * W, y: Math.random() * H, t: 0, life: 0.5 + Math.random() * 0.7, s: 0.12 + Math.random() * 0.18 * (0.5 + lv) });
  B.glit = B.glit.filter((q) => (q.t += dt) < q.life);
  const now = performance.now() / 1000;
  B.holdT += dt;
  // Falling: quicker and quicker, landing with a squash.
  for (const q of B.pieces.values()) {
    if (q.y < q.ty) { q.vy += 40 * dt; q.y = Math.min(q.ty, q.y + q.vy * dt); if (q.y >= q.ty) { q.sq = Math.min(1, 0.35 + q.vy * 0.05); q.vy = 0; } }
    else { q.y = q.ty; q.vy = 0; }
    q.sq = Math.max(0, q.sq - dt * 4);
  }
  const fallen = ![...B.pieces.values()].some((q) => Math.abs(q.y - q.ty) > 1e-3);
  // (once it's all fallen, what's going lights up, then pops)
  if (fallen && B.doomed) {
    if (!B.doomed.size) doomedPop(B);
    else if (!B.hi) B.hi = { t: 0 };
    else if ((B.hi.t += dt) >= HILITE) doomedPop(B);
  }
  B.fading = B.fading.filter((f) => (f.t += dt) < FADE);
  if (B.after && !B.pops.some((p) => !p.gone)) { B.after(); B.after = null; }
  if (B.queue.length && fallen && !B.doomed && !B.after && !B.pops.some((p) => !p.gone) && B.holdT > 0.12) stageNext(B);
  // Pops: a quick swell, then the burst: a ring, scraps of skin and confetti.
  for (const p of B.pops) {
    p.t += dt;
    if (p.t >= POP_SWELL && !p.gone) {
      p.gone = true; p.t = POP_SWELL;
      const cx = p.x + 0.5, cy = p.y + 0.48, bits = p.red ? ['#e04a3a', '#ff9a80', '#ffffff'] : COL[p.p.c].bits;
      B.rings.push({ x: cx, y: cy, t: 0, col: p.red ? '#ff8a70' : COL[p.p.c].light });
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2, s = 2.5 + Math.random() * 4;
        B.bits.push({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2.5, t: 0, life: 0.6 + Math.random() * 0.4, col: bits[i % bits.length], w: 0.13, h: 0.08, rot: a, vr: (Math.random() - 0.5) * 20 });
      }
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        B.bits.push({ x: cx, y: cy, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3 - 1, t: 0, life: 0.45, col: COL[p.p.c].base, w: 0.28, h: 0.12, rot: a, vr: (Math.random() - 0.5) * 10, skin: true });
      }
    }
  }
  B.pops = B.pops.filter((p) => !p.gone || p.t < POP_SWELL + 0.01);
  B.rings = B.rings.filter((r) => (r.t += dt) < 0.3);
  B.bits = B.bits.filter((b) => (b.t += dt) < b.life);
  for (const b of B.bits) { b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 14 * dt; b.vx *= 1 - dt * 1.5; b.rot += b.vr * dt; }
  if (B.banner && (B.banner.t += dt) > 1.6) B.banner = null;
  // The falling pair glides to where it is.
  if (pair) {
    const k = Math.min(1, dt * 18);
    B.shown.r += (pair.row - B.shown.r) * k; B.shown.c += (pair.col - B.shown.c) * k;
    if (Math.abs(pair.row - B.shown.r) > 2) B.shown.r = pair.row;
  }
  draw(B, now, pair);
}

const S = CELL * 0.9;
function drawBalloon(g, c, fixed, x, y, sq = 0, wob = 0, scale = 1, alpha = 1) {
  const sx = (1 + wob * 0.035 + sq * 0.2) * scale, sy = (1 - wob * 0.035 - sq * 0.16) * scale;
  const cx = px(x) + CELL / 2, cy = py(y) + CELL / 2 + (1 - sy / scale) * S * 0.45 * scale;
  g.globalAlpha = alpha;
  g.drawImage(balloon(c, fixed), cx - S / 2 * sx, cy - S / 2 * sy, S * sx, S * sy);
  g.globalAlpha = 1;
}
function drawPeg(g, a, b) {
  const ax = px(a[1]) + CELL / 2, ay = py(a[0]) + CELL / 2, bx = px(b[1]) + CELL / 2, by = py(b[0]) + CELL / 2;
  const mx = (ax + bx) / 2, my = (ay + by) / 2, flat = Math.abs(ay - by) < Math.abs(ax - bx);
  g.save(); g.translate(mx, my); if (!flat) g.rotate(Math.PI / 2);
  g.fillStyle = '#6b4220'; g.beginPath(); g.roundRect(-CELL * 0.3, -4.5, CELL * 0.6, 9, 4); g.fill();
  g.fillStyle = '#a8743c'; g.fillRect(-CELL * 0.27, -3, CELL * 0.54, 2.5);
  g.restore();
}
function brackets(g, r, c, col) {
  const x = px(c) + 4, y = py(r) + 4, s = CELL - 8, l = 10;
  g.strokeStyle = col; g.lineWidth = 3.5; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const [ox, oy, dx, dy] of [[0, 0, 1, 1], [s, 0, -1, 1], [0, s, 1, -1], [s, s, -1, -1]]) {
    g.beginPath(); g.moveTo(x + ox, y + oy + dy * l); g.lineTo(x + ox, y + oy); g.lineTo(x + ox + dx * l, y + oy); g.stroke();
  }
}

/* A platform: a translucent tile on each square, each target tinted the colour it wants with that
   colour's brackets in its corners (drawn under the balloons, so they show round one sitting in it;
   brighter once it holds its colour), any other square plain; the ledge under it. `a` how much of it
   there is (fading as it goes), `drop` how far its ledge has fallen away. */
const FADE = 0.35;
const TINT = [['rgba(47,134,232,0.30)', 'rgba(47,134,232,0.5)'], ['rgba(255,205,40,0.5)', 'rgba(255,205,40,0.68)'], ['rgba(255,255,255,0.26)', 'rgba(255,255,255,0.45)']];
const BRACKET = ['#4ea2ff', '#ffd23a', '#ffffff'];
function drawPlatform(g, p, grid, a = 1, drop = 0) {
  g.globalAlpha = a;
  const want = new Map(p.targets.map((t) => [`${t.r},${t.c}`, t.colour]));
  for (let r = p.r; r < p.r + p.h; r++) for (let c = p.c; c < p.c + p.w; c++) {
    const colour = want.get(`${r},${c}`);
    g.beginPath(); g.roundRect(px(c) + 2, py(r) + 2, CELL - 4, CELL - 4, 5);
    if (colour === undefined) {
      g.fillStyle = 'rgba(150,180,210,0.10)'; g.strokeStyle = 'rgba(200,225,245,0.35)'; g.lineWidth = 1.5;
      g.fill(); g.stroke();
      continue;
    }
    const q = grid.get(`${r},${c}`), ok = q && q.p.c === colour && Math.abs(q.y - q.ty) < 1e-3;
    g.fillStyle = TINT[colour][ok ? 1 : 0]; g.strokeStyle = 'rgba(225,245,255,0.7)'; g.lineWidth = 2;
    g.fill(); g.stroke();
    brackets(g, r, c, BRACKET[colour]);
  }
  const ly = py(p.r + p.h) - 3 + drop * CELL * 0.8;
  g.fillStyle = '#6b4220'; g.fillRect(px(p.c) + 1, ly, p.w * CELL - 2, 6);
  g.fillStyle = '#b07a40'; g.fillRect(px(p.c) + 1, ly, p.w * CELL - 2, 2);
  g.globalAlpha = 1;
}
/* What a step's about to pop, lit up (`u` 0 to 1 as it comes on): a line's squares ringed in one
   bright band, in its colour; a platform's outline in gold, ledge and all. */
function drawLit(g, what, u, now) {
  if (!what) return;
  const pulse = 0.75 + 0.25 * Math.sin(now * 22);
  g.save();
  g.lineJoin = 'round'; g.shadowBlur = 14;
  const band = (x, y, w, h, col) => {
    g.globalAlpha = u * 0.22; g.fillStyle = '#ffffff'; g.shadowColor = 'transparent';
    g.beginPath(); g.roundRect(x, y, w, h, CELL * 0.42); g.fill();
    g.globalAlpha = u * pulse; g.shadowColor = col; g.strokeStyle = col; g.lineWidth = 4;
    g.beginPath(); g.roundRect(x, y, w, h, CELL * 0.42); g.stroke();
  };
  for (const l of what.lines) {
    const rs = l.map(([r]) => r), cs = l.map(([, c]) => c), r0 = Math.min(...rs), c0 = Math.min(...cs);
    band(px(c0) + 1, py(r0) + 1, (Math.max(...cs) - c0 + 1) * CELL - 2, (Math.max(...rs) - r0 + 1) * CELL - 2, BRACKET[what.colours.get(`${l[0][0]},${l[0][1]}`) ?? 2]);
  }
  for (const p of what.went) band(px(p.c) - 1, py(p.r) - 1, p.w * CELL + 2, p.h * CELL + 6, '#ffd23a');
  g.restore();
}

// A four-pointed sparkle at (x, y), `k` from its middle to a point.
function sparkleStar(g, x, y, k) {
  if (k <= 0.2) return;
  g.save(); g.translate(x, y);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, k);
  gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.35, 'rgba(255,230,140,0.5)'); gr.addColorStop(1, 'rgba(255,210,80,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, k, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffffff';
  g.beginPath(); g.moveTo(0, -k); g.quadraticCurveTo(k * 0.1, -k * 0.1, k, 0); g.quadraticCurveTo(k * 0.1, k * 0.1, 0, k); g.quadraticCurveTo(-k * 0.1, k * 0.1, -k, 0); g.quadraticCurveTo(-k * 0.1, -k * 0.1, 0, -k); g.fill();
  g.restore();
}
function draw(B, now, pair) {
  const g = B.g, s = B.k * B.dpr;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, B.cv.width, B.cv.height);
  if (B.back) g.drawImage(B.back, 0, 0);
  g.setTransform(s, 0, 0, s, 0, 0);
  const grid = new Map();
  for (const q of B.pieces.values()) grid.set(`${Math.round(q.ty)},${q.x}`, q);
  // The platforms: translucent tiles, a ledge under each, and the platforms that just went fading.
  for (const p of B.platforms) drawPlatform(g, p, grid);
  for (const f of B.fading) drawPlatform(g, f.p, grid, 1 - f.t / FADE, f.t / FADE);
  // The pegs between a pair's halves (still joined), then the balloons.
  const where = new Map();
  for (const [id, q] of B.pieces) where.set(id, q);
  for (const [id, q] of B.pieces) {
    const m = q.p.mate !== undefined ? where.get(q.p.mate) : null;
    if (m && id < q.p.mate && Math.abs(m.y - q.y) + Math.abs(m.x - q.x) < 1.2) drawPeg(g, [q.y, q.x], [m.y, m.x]);
  }
  // (what's about to pop, lit up, quivers)
  const lit = B.hi ? Math.min(1, B.hi.t / (HILITE * 0.35)) : 0;
  for (const [id, q] of B.pieces) {
    const going = lit && B.doomed?.has(id);
    drawBalloon(g, q.p.c, q.p.fixed, q.x, q.y, q.sq, going ? Math.sin(now * 38 + id) * 1.6 * lit : Math.sin(now * 2.3 + id * 1.7), going ? 1 + 0.06 * lit : 1);
  }
  if (lit) drawLit(g, B.what, lit, now);
  // About to pop: swelling.
  for (const p of B.pops) if (!p.gone) {
    const u = Math.max(0, p.t) / POP_SWELL;
    drawBalloon(g, p.p.c, p.p.fixed, p.x, p.y, 0, Math.sin(now * 40) * u * 3, 1 + u * 0.28);
  }
  // The pair falling: its shadow where it'd land, and it.
  if (pair) {
    const cells = pair.cells(), dr = B.shown.r - pair.row, dc = B.shown.c - pair.col, rest = pair.rest();
    if (rest > pair.row) for (const [r, c, col] of cells) {
      g.strokeStyle = COL[col].base === '#eef2f8' ? 'rgba(255,255,255,0.55)' : `${COL[col].base}aa`; g.lineWidth = 2; g.setLineDash([4, 4]);
      g.beginPath(); g.arc(px(c) + CELL / 2, py(r + rest - pair.row) + CELL / 2, S * 0.42, 0, Math.PI * 2); g.stroke();
      g.setLineDash([]);
    }
    if (cells.length === 2) drawPeg(g, [cells[0][0] + dr, cells[0][1] + dc], [cells[1][0] + dr, cells[1][1] + dc]);
    for (const [r, c, col] of cells) drawBalloon(g, col, false, c + dc, r + dr, 0, Math.sin(now * 3.1 + c));
  }
  // Rings and confetti from the pops.
  for (const r of B.rings) {
    const u = r.t / 0.3;
    g.globalAlpha = 1 - u; g.strokeStyle = r.col; g.lineWidth = 3 * (1 - u) + 1;
    g.beginPath(); g.arc(px(r.x), py(r.y), CELL * (0.35 + u * 0.55), 0, Math.PI * 2); g.stroke();
  }
  for (const b of B.bits) {
    g.globalAlpha = Math.max(0, 1 - b.t / b.life);
    g.save(); g.translate(px(b.x), py(b.y)); g.rotate(b.rot);
    g.fillStyle = b.col;
    if (b.skin) { g.beginPath(); g.ellipse(0, 0, b.w * CELL / 2, b.h * CELL / 2, 0, 0, Math.PI); g.fill(); }
    else g.fillRect(-b.w * CELL / 2, -b.h * CELL / 2, b.w * CELL, b.h * CELL);
    g.restore();
  }
  for (const q of B.glit) {
    const u = q.t / q.life, k = Math.sin(u * Math.PI) * q.s * CELL;
    g.globalAlpha = Math.sin(u * Math.PI);
    sparkleStar(g, px(q.x), py(q.y), k);
  }
  g.globalAlpha = 1;
  // The sparkle meter, in the head between the next pair and the score: how well you're sailing,
  // a gold bar filling, a star twinkling at its tip, and the whole of it shining while a show lasts.
  const sp = B.sp;
  if (sp) {
    const mx = RIM + 116, my = RIM + 38, mw = 112, mh = 13, f = Math.max(0, Math.min(1, sp.meter)), now2 = performance.now() / 1000;
    g.fillStyle = '#e8d6b0'; g.font = "700 12px 'Alegreya Sans', sans-serif"; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillText('SPARKLE', mx, my - 6);
    g.fillStyle = 'rgba(20,12,6,0.7)'; g.beginPath(); g.roundRect(mx, my, mw, mh, 6); g.fill();
    if (f > 0.005) {
      const gr = g.createLinearGradient(mx, 0, mx + mw, 0);
      gr.addColorStop(0, '#b8862a'); gr.addColorStop(0.6, '#ffd23a'); gr.addColorStop(1, '#fff6c8');
      g.fillStyle = gr; g.beginPath(); g.roundRect(mx, my, Math.max(mh, mw * f), mh, 6); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(mx + 4, my + 2, Math.max(0, mw * f - 8), 3);
      sparkleStar(g, mx + Math.max(mh / 2, mw * f - 3), my + mh / 2, 9 + 3 * Math.sin(now2 * 7) + 6 * (sp.level ?? 0));
    }
    g.strokeStyle = '#c9a35c'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(mx, my, mw, mh, 6); g.stroke();
    // (a shine round the board's rim while the show lasts)
    if (sp.level > 0.01) {
      g.save(); g.globalAlpha = Math.min(1, sp.level) * (0.55 + 0.25 * Math.sin(now2 * 6));
      g.strokeStyle = '#ffd23a'; g.lineWidth = 4; g.shadowColor = '#ffd23a'; g.shadowBlur = 14;
      g.strokeRect(px(0) - 2, py(0) - 2, W * CELL + 4, H * CELL + 4);
      g.restore();
    }
  }
  // The head: the next pair (the one coming in, while a drop plays out), and the score.
  const G = B.game;
  if (G) {
    const nx = G && pair ? G.next : G.pair, x0 = RIM + 18, y0 = RIM + 24;
    const art = (c, x) => g.drawImage(balloon(c), x, y0, 34, 34);
    g.fillStyle = '#6b4220'; g.beginPath(); g.roundRect(x0 + 26, y0 + 13, 26, 8, 4); g.fill();
    art(nx[0], x0); art(nx[1], x0 + 44);
    g.textAlign = 'right'; g.textBaseline = 'middle';
    g.fillStyle = '#e8d6b0'; g.font = "700 13px 'Alegreya Sans', sans-serif";
    g.fillText('SCORE', BW - RIM - 10, RIM + 20);
    g.fillStyle = '#ffd23a'; g.font = "700 26px 'Alegreya', serif";
    g.fillText(String(G.score), BW - RIM - 10, RIM + 44);
  }
  // The chain's name as it climbs.
  if (B.banner) {
    const u = B.banner.t, sc = u < 0.15 ? 0.6 + (u / 0.15) * 0.6 : u < 0.3 ? 1.2 - ((u - 0.15) / 0.15) * 0.2 : 1;
    g.save();
    g.globalAlpha = u > 1.2 ? Math.max(0, 1 - (u - 1.2) / 0.4) : 1;
    g.translate(BW / 2, py(H * 0.36)); g.scale(sc, sc); g.rotate(-0.06);
    g.font = "700 46px 'Alegreya', serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 8; g.strokeStyle = '#2a1608'; g.strokeText(B.banner.text, 0, 0);
    g.fillStyle = B.banner.bad ? '#ff7a5a' : '#ffd23a'; g.fillText(B.banner.text, 0, 0);
    g.restore();
  }
}
