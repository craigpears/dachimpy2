// A Swordfight duel's board drawn on a canvas, hand-written: one side of a Duel (src/swordfight.ts), its well, its
// pieces in the den's sword crates (js/den-sword-draw.js), the falling pair, what just came in lit up,
// and the strip over it where attacks waiting to come in flash. The one drawing of a duel's board: the Swordfight duel
// test page (js/sword-duel-view.js) and Jezerbell's werewolf fray (js/den/jezerbell-house.js) both draw with it.
// It knows nothing of where it's shown: the page sizes it (`size(cell)`) and draws it each frame (`draw(side, dt)`).
import { W, H } from './swordfight.js';
import { PALETTE, drawSword, drawBreaker } from './den-sword-draw.js';

/** The strip over a board where waiting attacks show, in squares. */
export const STRIP = 1.3;

// The attack blocks' iron greys, as the den's banded crates (js/den/sword.js).
const GREY = { light: '#c9c6c0', base: '#8f8b84', dark: '#3c3934' };

/** The page's colours by name (css/site.css's), or the den's own where a page has none of them. */
function colours() {
  const css = getComputedStyle(document.documentElement), v = (n, or) => css.getPropertyValue(n).trim() || or;
  return { well: v('--well', '#241b1b'), tile: v('--tile', 'rgba(255, 236, 228, 0.05)'), accent: v('--accent', '#e0a92a'), accentHi: v('--accent-hi', '#f0bd44'), edge: v('--edge', '#5a412a'), text: v('--text', '#f6ead2') };
}

/** A board on `canvas`: `size(cell)` sets its squares' size (CSS pixels); `draw(side, dt)` draws a Duel's side;
    `flash(cells)` lights up squares that just came in ([row, column] each). */
export function duelBoard(canvas) {
  const x = canvas.getContext('2d');
  let cell = 24, flashes = [], C = colours();

  function box(X, Y, w, h, pal, alpha = 1) {
    const g = x.createLinearGradient(X, Y, X + w, Y + h);
    g.addColorStop(0, pal.light); g.addColorStop(0.55, pal.base); g.addColorStop(1, pal.dark);
    x.globalAlpha = alpha;
    x.fillStyle = g;
    x.beginPath(); x.roundRect(X + 1, Y + 1, w - 2, h - 2, Math.max(2, cell * 0.14)); x.fill();
    x.strokeStyle = pal.dark; x.lineWidth = 1.5; x.stroke();
    x.globalAlpha = 1;
  }
  function block(g, X, Y, w = cell, h = cell) {
    if (g.breaker && !g.grey) { drawBreaker(x, g.c, X, Y, cell); return; }
    if (g.grey === 2) {   // opaque grey: banded shut
      box(X, Y, w, h, GREY);
      x.strokeStyle = GREY.dark; x.lineWidth = 1;
      x.beginPath(); x.moveTo(X + 3, Y + h * 0.33); x.lineTo(X + w - 3, Y + h * 0.33); x.moveTo(X + 3, Y + h * 0.67); x.lineTo(X + w - 3, Y + h * 0.67); x.stroke();
      return;
    }
    const pal = PALETTE[g.c];
    box(X, Y, w, h, pal);
    const s = Math.min(w, h);
    drawSword(x, g.c, X + (w - s * 0.6) / 2, Y + (h - s * 0.86) / 2, s * 0.6, s * 0.86, 'rgba(255,248,230,0.45)', pal.dark);
    if (g.grey === 1) box(X, Y, w, h, GREY, 0.55);   // see-through grey: the colour showing through
  }

  return {
    get cell() { return cell; },
    size(c) {
      cell = c;
      C = colours();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.style.width = `${cell * W}px`;
      canvas.style.height = `${cell * (H + STRIP)}px`;
      canvas.width = Math.round(cell * W * dpr);
      canvas.height = Math.round(cell * (H + STRIP) * dpr);
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    flash(cells) { flashes.push({ cells, t: 1.2 }); },
    clear() { flashes = []; },
    draw(s, dt) {
      const b = s.board, top = STRIP * cell;
      const Y = (r) => top + (H - 1 - r) * cell;
      x.clearRect(0, 0, cell * W, cell * (H + STRIP));
      // the well, and the fourth column's top marked: fill it and you've lost
      x.fillStyle = C.well; x.fillRect(0, top, cell * W, cell * H);
      x.fillStyle = C.tile; for (let c = 0; c < W; c += 2) x.fillRect(c * cell, top, cell, cell * H);
      x.fillStyle = C.accent; x.globalAlpha = 0.35; x.fillRect(3 * cell, top, cell, cell * 2); x.globalAlpha = 1;
      x.strokeStyle = C.edge; x.lineWidth = 2; x.strokeRect(1, top + 1, cell * W - 2, cell * H - 2);
      // the pieces: fused blocks and swords just come in drawn whole, the rest a square each
      const units = new Map();
      for (const p of b.snap()) {
        const key = p.g.sword !== undefined ? `s${p.g.sword}` : p.fuse !== undefined ? `f${p.fuse}` : null;
        if (!key) { block(p.g, p.c * cell, Y(p.r)); continue; }
        const u = units.get(key) ?? { g: p.g, r0: p.r, r1: p.r, c0: p.c, c1: p.c, sword: key[0] === 's' };
        Object.assign(u, { r0: Math.min(u.r0, p.r), r1: Math.max(u.r1, p.r), c0: Math.min(u.c0, p.c), c1: Math.max(u.c1, p.c) });
        units.set(key, u);
      }
      for (const u of units.values()) {
        const X = u.c0 * cell, YY = Y(u.r1), w = (u.c1 - u.c0 + 1) * cell, h = (u.r1 - u.r0 + 1) * cell;
        if (!u.sword) { block(u.g, X, YY, w, h); continue; }
        // a sword just come in: its picture, silver, for a turn
        box(X, YY, w, h, { light: '#f4f2ee', base: GREY.light, dark: GREY.dark });
        x.save();
        if (w > h) { x.translate(X + w / 2, YY + h / 2); x.rotate(Math.PI / 2); x.translate(-(X + w / 2), -(YY + h / 2)); }
        const sw = Math.min(w, h), sh = Math.max(w, h);
        drawSword(x, 1, X + w / 2 - sw * 0.35, YY + h / 2 - sh * 0.46, sw * 0.7, sh * 0.92, '#ffffff', GREY.dark);
        x.restore();
      }
      // the falling pair, drawn once: no ghost where it'll land, which read as a second copy of it, "really just
      // confusing" (the user, 21 Nov; RULES.md)
      const f = b.falling;
      if (f) b.fallingCells().forEach(([r, c], k) => { if (r < H) block(f.pair[k], c * cell, Y(r)); });
      // what just came in, lit up
      for (const fl of flashes) {
        fl.t -= dt;
        x.strokeStyle = C.accentHi; x.lineWidth = 3; x.globalAlpha = Math.max(0, Math.min(1, fl.t));
        for (const [r, c] of fl.cells) x.strokeRect(c * cell + 2, Y(r) + 2, cell - 4, cell - 4);
        x.globalAlpha = 1;
      }
      flashes = flashes.filter((fl) => fl.t > 0);
      // the strip: attacks waiting to come in, flashing
      if (s.incoming.length) {
        x.globalAlpha = 0.65 + 0.35 * Math.sin(performance.now() / 140);
        x.fillStyle = C.text;
        x.font = `700 ${Math.max(11, Math.round(cell * 0.5))}px 'Alegreya Sans', sans-serif`;
        x.textBaseline = 'middle';
        const swords = s.incoming.flatMap((a) => a.strikes.map((k) => `${k.w}x${k.h}`)), n = s.incoming.reduce((t, a) => t + a.sprinkles, 0);
        const words = [swords.length ? `⚔ ${swords.join(' ')}` : '', n ? `${n} sprinkle${n > 1 ? 's' : ''}` : ''].filter(Boolean).join(', ');
        x.fillText(`incoming: ${words}`, 4, top * 0.5, cell * W - 8);
        x.globalAlpha = 1;
      }
    },
  };
}
