// The rowing boards' look: mirror strokes' two Bilge boards, port's and starboard's, drawn flat
// either side of the view while her oars are out (RULES.md, "Rowing by mirror strokes"). Only the
// look: the rules are src/mirror-row.ts (through src/den-row.ts), and js/den/rowing.js wires them to
// the sloop. No compass by them: the turn building shows on her (js/den/rowing.js).
import { W, H } from '../bilge.js';
import { mirrorCol } from '../mirror-row.js';
import { bitArt } from './bilge.js';
import { edges } from './world.js';

/* The user (10 Nov), on the first rowing board, laid along her deck: "I know it's like zoomed in is
   good to see the puzzle, but like I can't see where I'm rowing." So the boards stand either side
   of the screen, port's on the left and starboard's on the right, as you look over her bows, and
   the sea she's rowing through is between them: her, the rocks, the red rings, the next few
   squares. In a window too narrow for that they sit side by side along the bottom, the sea above.
   Each is drawn as it was in mirror strokes' test page, which the user played and loved: planks
   running fore and aft washed red for port and green for starboard (her sidelights' colours), a
   dark rim, the side's name across the bow end (the top, beyond row 0), the den's Bilge pieces
   (js/den/bilge.js's own faces), and the orange cursor brackets, mirrored on starboard. The whole
   board's under water, no water line across it (the user, 10 Nov: "it shouldn't have a bilge line
   ... everything should be under the water, really, for this mode"): a wash of sea over it all,
   light rippling across it, every piece swaying a little. */
const SIDES = ['port', 'starboard'];
const TINT = { port: '200,64,46', starboard: '47,174,90' };
/** In the board's own units: a square 40, the rim and the bow end's words. */
const CELL = 40, RIM = 12, HEAD = 40, BW = W * CELL + 2 * RIM, BH = H * CELL + HEAD + 2 * RIM;
const px = (c) => RIM + c * CELL, py = (r) => RIM + HEAD + r * CELL;
/* Which of the den's seven pieces each kind is drawn as: the most unlike first, so a board of five
   kinds (src/mirror-row.ts, KINDS_DEFAULT) reads at a glance: pale octagon, dark square, mint
   circle, teal octagon, slate rounded square. Not the pentagon (the user, 10 Nov: "didn't we talk
   about having fewer pieces? ... I see the pentagon"): five kinds, and none of them that. */
const ORDER = [0, 4, 3, 1, 5, 2, 6];
const faceOf = (b) => bitArt(b.s ? b : { k: ORDER[b.k] });
const SHADOW = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 8, 64, 64, 62);
  gr.addColorStop(0, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return cv;
})();

function deckArt(side, k) {
  const cv = document.createElement('canvas');
  cv.width = Math.round(BW * k); cv.height = Math.round(BH * k);
  const g = cv.getContext('2d');
  g.scale(k, k);
  g.fillStyle = '#3a2614'; g.beginPath(); g.roundRect(0, 0, BW, BH, 6); g.fill();
  g.fillStyle = '#8a6a45'; g.fillRect(RIM - 4, RIM - 4, BW - 2 * RIM + 8, BH - 2 * RIM + 8);
  for (let x = RIM - 4, i = 0; x < BW - RIM + 4; x += CELL / 2, i++) {
    g.fillStyle = i % 2 ? 'rgba(0,0,0,0.10)' : 'rgba(255,240,210,0.06)'; g.fillRect(x, RIM - 4, CELL / 2 - 1, BH - 2 * RIM + 8);
    g.fillStyle = 'rgba(40,24,10,0.5)'; for (let y = RIM + (i * 37) % 90; y < BH - RIM; y += 140) g.fillRect(x, y, CELL / 2 - 1, 2);
  }
  g.fillStyle = `rgba(${TINT[side]},0.30)`; g.fillRect(RIM - 4, RIM - 4, BW - 2 * RIM + 8, BH - 2 * RIM + 8);
  g.font = `700 ${Math.round(CELL * 0.62)}px 'Alegreya Sans', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 4; g.strokeStyle = 'rgba(30,18,8,0.8)';
  const word = side.toUpperCase(), col = side === 'port' ? '#ffb3a6' : '#b6f0c6';
  g.strokeText(word, BW / 2, RIM + HEAD / 2); g.fillStyle = col; g.fillText(word, BW / 2, RIM + HEAD / 2);
  // The squares, faintly marked.
  g.strokeStyle = 'rgba(40,24,10,0.25)'; g.lineWidth = 1;
  for (let c = 0; c <= W; c++) { g.beginPath(); g.moveTo(px(c), py(0)); g.lineTo(px(c), py(H)); g.stroke(); }
  for (let r = 0; r <= H; r++) { g.beginPath(); g.moveTo(px(0), py(r)); g.lineTo(px(W), py(r)); g.stroke(); }
  return cv;
}

/** The boards on screen: made once, shown while she rows. */
export function boardsMake() {
  const el = document.createElement('div');
  Object.assign(el.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: 4, display: 'none' });
  el.className = 'rowboards';
  const views = SIDES.map((side, i) => {
    const cv = document.createElement('canvas');
    Object.assign(cv.style, { position: 'absolute', borderRadius: '8px', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' });
    el.appendChild(cv);
    return { i, side, cv, g: cv.getContext('2d'), k: 0, deck: null, pieces: new Map(), dying: [], splash: [], queue: [], holdT: 0, flash: 0, rect: null };
  });
  document.body.appendChild(el);
  return { el, views, sig: '' };
}

/* Where they go: either side of the screen when it's wide enough to leave the sea a good middle,
   else side by side along the bottom (over the prompt), the sea above. `low`: the screen's height
   left above the prompt; `top`: below the den's panel at the top. Says where the sea shows: `free`,
   a rectangle in pixels. */
export function boardsLayout(B, low, top) {
  // (clear of a panel along the right-hand edge: the race plan's strip, world.js's edges)
  const w = innerWidth - edges.right, h = innerHeight, gap = 10;
  top = Math.max(gap, top + gap);
  let k, wide = w > h * 1.05;
  if (wide) {
    k = Math.min(1.3, (h - top - gap) / BH, (w * 0.29) / BW);
    if (w - 2 * BW * k - 4 * gap < 260) wide = false;
  }
  if (!wide) k = Math.min(1.1, (w - 3 * gap) / 2 / BW, (low - 2 * gap) * 0.52 / BH);
  const bw = BW * k, bh = BH * k;
  const ty = top + (h - top - gap - bh) / 2, at = wide ? [[gap, ty], [w - gap - bw, ty]] : [[w / 2 - gap / 2 - bw, low - gap - bh], [w / 2 + gap / 2, low - gap - bh]];
  const sig = `${w}x${h}|${low}|${k.toFixed(3)}`;
  if (sig !== B.sig) {
    B.sig = sig;
    const dpr = Math.min(2, devicePixelRatio);
    for (const v of B.views) {
      v.k = k; v.dpr = dpr;
      v.cv.width = Math.round(BW * k * dpr); v.cv.height = Math.round(BH * k * dpr);
      Object.assign(v.cv.style, { width: `${bw}px`, height: `${bh}px` });
      v.deck = deckArt(v.side, k * dpr);
    }
  }
  B.views.forEach((v, i) => { Object.assign(v.cv.style, { left: `${at[i][0]}px`, top: `${at[i][1]}px` }); v.rect = { x: at[i][0], y: at[i][1], w: bw, h: bh }; });
  const free = wide ? { x: gap * 2 + bw, y: 0, w: w - 4 * gap - 2 * bw, h } : { x: 0, y: top, w, h: Math.max(60, at[0][1] - gap - top) };
  return { wide, free };
}

/** Lay a board's pieces as they are (a fresh board). */
export function boardsLay(B, boards) {
  B.views.forEach((v, i) => {
    v.pieces.clear(); v.dying = []; v.splash = []; v.queue = []; v.holdT = 0;
    boards[i].grid.forEach((line, r) => line.forEach((bit, c) => { if (bit) v.pieces.set(bit.id, { bit, x: c, y: r, tx: c, ty: r, jig: 0 }); }));
  });
}

/** A move made: each board's steps to play out, and a flash on the side it pulled. */
export function boardsMove(B, res) {
  res.moves.forEach((m, i) => { B.views[i].queue.push(...m.stages); B.views[i].holdT = 0; });
  B.views.forEach((v) => { if (res.pull[v.side] > 0) v.flash = Math.min(1, 0.35 + res.pull[v.side] * 0.12); });
}
/** A side flashed as it pulls (the debug hook's pull, with no move on the boards). */
export function boardsFlash(B, side) { B.views.find((v) => v.side === side).flash = 1; }

/** A crab that won't budge does a little jig. */
export function boardsJig(B, boards, cur) {
  B.views.forEach((v, i) => {
    const c0 = i ? mirrorCol(cur.c) : cur.c;
    for (const c of [c0, c0 + 1]) { const b = boards[i].grid[cur.r][c]; if (b?.s === 'crab') { const p = v.pieces.get(b.id); if (p) p.jig = 0.6; } }
  });
}

const moving = (v) => v.dying.length > 0 || [...v.pieces.values()].some((p) => Math.abs(p.x - p.tx) + Math.abs(p.y - p.ty) > 0.02);
/** Still playing out a move. */
export const boardsBusy = (B) => B.views.some((v) => v.queue.length || moving(v));

function stageNext(v) {
  const st = v.queue.shift();
  v.holdT = 0;
  for (const id of st.cleared) {
    const p = v.pieces.get(id);
    if (!p) continue;
    v.pieces.delete(id);
    v.dying.push({ ...p, t: 0 });
    const tint = v.side === 'port' ? '255,208,200' : '208,255,220';
    for (let n = 0; n < 5; n++) v.splash.push({ x: p.x + 0.5, y: p.y + 0.5, vx: (Math.random() - 0.5) * 4, vy: -1 - Math.random() * 3, t: 0, life: 0.5 + Math.random() * 0.3, tint });
  }
  const fresh = Array(W).fill(0);
  st.grid.forEach((line, r) => line.forEach((bit, c) => {
    if (!bit) return;
    let p = v.pieces.get(bit.id);
    // New pieces wash in from under her stern end and float up into place.
    if (!p) { p = { bit, x: c, y: H + fresh[c]++, jig: 0 }; v.pieces.set(bit.id, p); }
    p.tx = c; p.ty = r;
  }));
}

/** A frame: the moves playing out, and each board drawn. `cur`: the cursor (port's columns);
    `lead`: each side's pull waiting for the other (the board glows its colour with it). */
export function boardsTick(B, dt, cur, lead) {
  const now = performance.now() / 1000;
  B.views.forEach((v, i) => {
    v.holdT += dt;
    if (v.queue.length && v.holdT > 0.18 && !moving(v)) stageNext(v);
    for (const p of v.pieces.values()) {
      const sp = 5 * dt, dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
      if (d > 1e-3) { const q = Math.min(1, sp / d); p.x += dx * q; p.y += dy * q; }
      p.jig = Math.max(0, p.jig - dt);
    }
    v.flash = Math.max(0, v.flash - dt * 1.6);
    const g = v.g, s = v.k * v.dpr;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, v.cv.width, v.cv.height);
    g.drawImage(v.deck, 0, 0);
    g.setTransform(s, 0, 0, s, 0, 0);
    g.save();
    g.beginPath(); g.rect(px(0), py(0), W * CELL, H * CELL); g.clip();
    const S = CELL * 0.92, draw = (p, a = 1, sc = 1) => {
      const cx = px(p.x) + CELL / 2, cy = py(p.y) + CELL / 2;
      g.globalAlpha = a * 0.9;
      g.drawImage(SHADOW, cx - S * 0.55 * sc - 2, cy - S * 0.55 * sc + 2, S * 1.1 * sc, S * 1.1 * sc);
      g.globalAlpha = a;
      g.save(); g.translate(cx, cy);
      g.rotate(p.jig > 0 ? Math.sin(p.jig * 40) * 0.4 : Math.sin(now * 1.3 + p.bit.id) * 0.04);
      g.drawImage(faceOf(p.bit), -S / 2 * sc, -S / 2 * sc, S * sc, S * sc);
      g.restore();
      g.globalAlpha = 1;
    };
    for (const p of v.pieces.values()) draw(p);
    // What's cleared: a flash of white, swelling and gone.
    v.dying = v.dying.filter((p) => (p.t += dt) < 0.22);
    for (const p of v.dying) {
      const u = p.t / 0.22;
      draw(p, 1 - u, 1 + u * 0.4);
      g.globalAlpha = (1 - u) * 0.8; g.fillStyle = '#ffffff';
      g.beginPath(); g.arc(px(p.x) + CELL / 2, py(p.y) + CELL / 2, CELL * 0.42 * (1 + u * 0.4), 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
    }
    // All of it under water: the sea's wash over it, light rippling across it.
    g.fillStyle = 'rgba(42,111,216,0.26)'; g.fillRect(px(0), py(0), W * CELL, H * CELL);
    g.strokeStyle = 'rgba(220,240,255,0.10)'; g.lineWidth = 3;
    for (let y = -2; y < H * CELL + 40; y += 46) {
      g.beginPath();
      for (let x = 0; x <= W * CELL; x += 8) g.lineTo(px(0) + x, py(0) + y + Math.sin(x / 22 + now * 1.4 + y) * 5 + ((now * 9) % 46));
      g.stroke();
    }
    // It glows its colour while its pull waits for the other side, and flashes as it pulls.
    const a = Math.min(0.55, lead[v.side] * 0.08 + v.flash * 0.4);
    if (a > 0.01) {
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = `rgba(${TINT[v.side]},${a})`; g.fillRect(px(0), py(0), W * CELL, H * CELL);
      g.globalCompositeOperation = 'source-over';
    }
    // Splashes.
    v.splash = v.splash.filter((sp) => (sp.t += dt) < sp.life);
    for (const sp of v.splash) {
      sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.vy += 9 * dt;
      g.fillStyle = `rgba(${sp.tint},${1 - sp.t / sp.life})`;
      g.beginPath(); g.arc(px(sp.x), py(sp.y), 3, 0, Math.PI * 2); g.fill();
    }
    g.restore();
    // The cursor, as the den's Bilge boards have it: orange brackets round its two squares, ticks
    // between them; on starboard's, mirrored.
    const x0 = px(i ? mirrorCol(cur.c) : cur.c), y0 = py(cur.r), q = CELL, len = 11, t = 3;
    g.fillStyle = '#f39a2b';
    for (const [x, sx] of [[x0, 1], [x0 + 2 * q, -1]]) for (const [y, sy] of [[y0, 1], [y0 + q, -1]]) {
      g.fillRect(sx > 0 ? x - t / 2 : x - len, y - t / 2, len + t / 2, t);
      g.fillRect(x - t / 2, sy > 0 ? y - t / 2 : y - len, t, len + t / 2);
    }
    g.fillRect(x0 + q - t / 2, y0 - t / 2, t, len); g.fillRect(x0 + q - t / 2, y0 + q - len + t / 2, t, len);
  });
}

/** The square under a point on screen, as the cursor holds it (port's columns), or null off both
    boards. */
export function boardsAt(B, x, y) {
  for (const v of B.views) {
    const R = v.rect;
    if (!R || x < R.x || y < R.y || x > R.x + R.w || y > R.y + R.h) continue;
    const bx = (x - R.x) / v.k, by = (y - R.y) / v.k;
    if (by < py(0) - CELL / 2 || by > py(H) + CELL / 2) return null;
    const r = Math.max(0, Math.min(H - 1, Math.floor((by - py(0)) / CELL)));
    const c = Math.max(0, Math.min(W - 2, Math.round((bx - RIM) / CELL - 1)));
    return { r, c: v.i ? mirrorCol(c) : c };
  }
  return null;
}
