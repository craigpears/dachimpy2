/* A teaching pirate's instructions to you, in a panel by their board: a piece any lesson can use (Tzz's
   balloon lesson: balloons.js), like the furniture. What's in it is the lesson's (src/balloons.ts's
   'note' events, the lines from src/lines/); this only shows it.

   The user (11 Nov, of Tzz's lesson): "her [important] instructions disappear very quickly. Like ...
   when she's telling me blue over the yellow and top the stack, that should be a lot clearer that it's
   just not her being a bit just chatting. It's an actual instruction to you, and it should be more
   prominent and persistent." So it's apart from her speech bubble, and looks it: a dark panel with a
   coloured edge, not her parchment bubble; "Watch" over what to look at on the board, "Your go!" in
   gold over what to do, with the pair you've got and the keys. It stays up till the next replaces it,
   flashing as a new one comes in. Beside the board where there's room, else above it. Its styles are
   its own, put on the page by it. */
import { camera, V3 } from './world.js';
import { balloon } from './sail-board.js';

// (one line per rule, joined: a template's newlines would survive minifying into the bundle, tests/bundle.test.ts)
const CSS = [
  ".lesson-note { position: fixed; z-index: 25; pointer-events: none; box-sizing: border-box; max-width: min(300px, 90vw);",
  "  background: rgba(10, 26, 42, 0.94); color: #eaf4ff; border: 2px solid #7cc4ff; border-left-width: 7px; border-radius: 10px;",
  "  padding: 9px 13px 10px; font: 700 18px/1.3 'Alegreya Sans', system-ui, sans-serif; box-shadow: 0 6px 18px rgba(0,0,0,0.5); }",
  ".lesson-note .ln-hd { font: 800 13px 'Alegreya Sans', sans-serif; letter-spacing: 2px; text-transform: uppercase; color: #7cc4ff; margin-bottom: 3px; }",
  ".lesson-note.yours { border-color: #ffd23a; background: rgba(40, 26, 6, 0.95); color: #fff6dc; }",
  ".lesson-note.yours .ln-hd { font-size: 24px; letter-spacing: 0.5px; text-transform: none; color: #ffd23a; margin-bottom: 4px; }",
  ".lesson-note .ln-pair { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 15px; color: #e8d6b0; }",
  ".lesson-note .ln-pair img { width: 30px; height: 30px; }",
  ".lesson-note .ln-pair i { display: inline-block; width: 10px; height: 5px; margin: 0 -7px; background: #6b4220; border-radius: 3px; }",
  ".lesson-note .ln-ghost { margin-top: 4px; font-size: 15px; color: #e8d6b0; }",
  ".lesson-note .ln-keys { margin-top: 8px; font-size: 15px; color: #e8d6b0; line-height: 1.7; }",
  ".lesson-note kbd { font: 700 14px 'Alegreya Sans'; color: #fff6dc; background: #3b2a1b; border: 1px solid #c9a35c; border-radius: 4px; padding: 0 6px; }",
  ".lesson-note.new { animation: lesson-note-in .5s ease-out; }",
  "@keyframes lesson-note-in { 0% { transform: scale(0.92); filter: brightness(1.8); } 60% { transform: scale(1.03); } 100% { transform: none; filter: none; } }",
  "@media (max-width: 600px) { .lesson-note { font-size: 16px; padding: 7px 10px; } .lesson-note.yours .ln-hd { font-size: 20px; } }",
].join(' ');

const art = new Map();
const balloonImg = (c) => { if (!art.has(c)) art.set(c, balloon(c).toDataURL()); return art.get(c); };

/** The panel, hidden till shown. */
export function lessonPanel() {
  if (!document.getElementById('lesson-note-css')) {
    const st = document.createElement('style');
    st.id = 'lesson-note-css'; st.textContent = CSS;
    document.head.appendChild(st);
  }
  const el = document.createElement('div');
  el.className = 'lesson-note';
  el.style.display = 'none';
  document.body.appendChild(el);
  let shown = '';
  const v = V3(0, 0, 0);
  return {
    el,
    /** Shows an instruction (`text`; '' takes it down). `yours`: it's your go, with `pair` (its two
        colours) and the keys. */
    show({ text, yours = false, pair = null }) {
      const sig = JSON.stringify([text, yours, pair]);
      if (sig === shown) return;
      shown = sig;
      if (!text) { el.style.display = 'none'; return; }
      el.className = `lesson-note${yours ? ' yours' : ''}`;
      el.innerHTML = '';
      const hd = document.createElement('div');
      hd.className = 'ln-hd'; hd.textContent = yours ? 'Your go!' : 'Watch';
      const tx = document.createElement('div');
      tx.textContent = text;
      el.append(hd, tx);
      if (yours && pair) {
        const p = document.createElement('div');
        p.className = 'ln-pair';
        p.append('Your pair:');
        const a = new Image(), b = new Image();
        a.src = balloonImg(pair[0]); b.src = balloonImg(pair[1]);
        p.append(a, document.createElement('i'), b);
        const gh = document.createElement('div');
        gh.className = 'ln-ghost'; gh.textContent = 'Steer it onto its ghost on the board.';
        el.append(p, gh);
      }
      if (yours) {
        const k = document.createElement('div');
        k.className = 'ln-keys';
        k.innerHTML = '<kbd>←</kbd> <kbd>→</kbd> move · <kbd>↑</kbd> <kbd>↓</kbd> turn · <kbd>Space</kbd> faster';
        el.append(k);
      }
      el.style.display = '';
      el.classList.remove('new'); void el.offsetWidth; el.classList.add('new');
    },
    hide() { this.show({ text: '' }); },
    /** Beside the board, where it is on screen (`corners`: its picture's corners in the world, from
        top left round): to its left where there's room, else above it, else to its right, else at the
        top of the screen. Within the cutscene's bars (10% of the height top and bottom). */
    place(corners) {
      if (el.style.display === 'none') return;
      const pts = corners.map((p) => { v.copy(p).project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; });
      const x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0]));
      const y0 = Math.min(...pts.map((p) => p[1]));
      const gap = 14, top = innerHeight * 0.1 + 10, bot = innerHeight * 0.9 - 10;
      // (left of it; else above it, where there's room for it; else right of it, over the sea, where the
      // performer's bubble may be; else at the top)
      const roomL = x0 - gap - 8, roomR = innerWidth - 8 - x1 - gap, roomUp = y0 - gap - top;
      const side = roomL >= 190 ? -1 : roomUp >= 150 ? 0 : roomR >= 190 ? 1 : 0;
      const wide = `${Math.round(side < 0 ? Math.min(300, roomL) : side > 0 ? Math.min(300, roomR) : Math.min(420, innerWidth * 0.92))}px`;
      if (el.style.maxWidth !== wide) el.style.maxWidth = wide;
      const w = el.offsetWidth, h = el.offsetHeight;
      let x, y;
      if (side < 0) { x = x0 - gap - w; y = Math.max(top, y0); }
      else if (side > 0) { x = x1 + gap; y = Math.max(top, y0); }
      else { x = Math.min(innerWidth - w - 8, Math.max(8, (x0 + x1) / 2 - w / 2)); y = Math.max(top, y0 - gap - h); }
      y = Math.min(y, bot - h);
      el.style.left = `${Math.round(x)}px`; el.style.top = `${Math.round(y)}px`;
    },
  };
}
