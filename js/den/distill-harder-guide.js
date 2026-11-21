// "Distilling on four sides": the harder Distilling's rules in plain words, each with a picture (the user, 21 Nov:
// "there needs to be a bit more explanation as to what this new version of distilling is ... not in a text dump, but
// in an actual decent thing"). Hand-written, like the read guides' views; the pictures are drawn from the rules
// themselves (src/distilling.ts's variations, DISTILLING.md §8): a seeded game laid out and burned, so what they show
// is what the board does. The pieces are the board's own (js/den/distill-board.js's pieceCanvas). Shown over the
// unlinked distilling-test.html, `harderGuide()` an overlay to open and close.
import {
  Distilling, COLS, TALL, WHITE, BROWN, SPICE, SLIDE_MS, CHAIN_BONUS, DOUBLE_BONUS, DARK_RUM_BONUS, TICK_MS,
  BURN_TICKS, rowSplit, parseBoard,
} from '../distilling.js';
import { seeded } from '../mirror-row.js';
import { pieceCanvas } from './distill-board.js';

const BURN_S = ((BURN_TICKS + 1) * TICK_MS / 1000).toFixed(1);
const FIRE = '#ff8a2a', IRON = '#3a3a40', NEW = '#ffd23a', GONE = '#ff5a3a';

/** A canvas drawn at the screen's sharpness, w by h in CSS pixels. */
function sharp(w, h) {
  const k = Math.min(2, window.devicePixelRatio || 1), cv = document.createElement('canvas');
  cv.width = Math.round(w * k); cv.height = Math.round(h * k);
  cv.style.width = `${w}px`; cv.style.maxWidth = '100%'; cv.style.height = 'auto';
  const g = cv.getContext('2d'); g.scale(k, k);
  return [cv, g];
}
/** A board in small, its furnaces round it (`lit`: which glow, 'sides' or 'rows'; `edges`: which are there), rings
    round pieces (`ring(x, y)` a colour or null) and pieces faded (`dim(x, y)`). */
function boardPic(cols, o = {}) {
  const C = o.cell ?? 20, P = 14, W = COLS * C + 2 * P, H = TALL * C + 2 * P;
  const [cv, g] = sharp(W, H);
  g.fillStyle = '#2a1a0c'; g.beginPath(); g.roundRect(0, 0, W, H, 8); g.fill();
  const edges = o.edges ?? ['left', 'right', 'top', 'bottom'];
  const bar = (x, y, w, h, on) => {
    g.fillStyle = IRON; g.beginPath(); g.roundRect(x, y, w, h, 3); g.fill();
    if (on) { g.fillStyle = FIRE; g.globalAlpha = 0.9; g.beginPath(); g.roundRect(x + 2, y + 2, w - 4, h - 4, 2); g.fill(); g.globalAlpha = 1; }
  };
  const sides = o.lit === 'sides', rows = o.lit === 'rows';
  if (edges.includes('left')) bar(2, P, 9, H - 2 * P, sides);
  if (edges.includes('right')) bar(W - 11, P, 9, H - 2 * P, sides);
  if (edges.includes('top')) bar(P, 2, W - 2 * P, 9, rows);
  if (edges.includes('bottom')) bar(P, H - 11, W - 2 * P, 9, rows);
  cols.forEach((col, x) => col.forEach((p, y) => {
    const px = P + x * C, py = P + y * C + (col.length === TALL ? 0 : C / 2);
    g.globalAlpha = o.dim?.(x, y) ? 0.25 : 1;
    g.drawImage(pieceCanvas(p), px, py, C, C);
    g.globalAlpha = 1;
    const r = o.ring?.(x, y);
    if (r) { g.strokeStyle = r; g.lineWidth = 2.5; g.beginPath(); g.arc(px + C / 2, py + C / 2, C / 2 + 0.5, 0, Math.PI * 2); g.stroke(); }
  }));
  return cv;
}
/** Pieces in a line, a column (`down`) or a row's zigzag, with a word under or beside it. */
function linePic(pieces, o = {}) {
  const C = o.cell ?? 22, down = !!o.down, n = pieces.length;
  const W = down ? C + 4 : n * C + 4, H = down ? n * C + 4 : C * 1.5 + 4;
  const [cv, g] = sharp(W, H);
  pieces.forEach((p, i) => g.drawImage(pieceCanvas(p), 2 + (down ? 0 : i * C), 2 + (down ? i * C : (i % 2 ? C / 2 : 0)), C, C));
  return cv;
}
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (k === 'class') e.className = v; else e.setAttribute(k, v);
  for (const k of kids) e.append(k);
  return e;
};
/** A picture with a caption under it. */
const fig = (pic, caption) => el('figure', {}, pic, caption ? el('figcaption', {}, caption) : '');

/** The pictures, from real games. */
function pictures() {
  const four = (seed) => new Distilling(seeded(seed), { furnaces: 4 });
  const settle = (g) => g.tick(SLIDE_MS);
  // A furnace on every edge: a fresh board, the sides going first.
  const start = four(11);
  // The rows going: before (the top and bottom rows ringed), after (each column's two new pieces ringed).
  const rows = four(11); rows.burnNow(); settle(rows);
  const before = rows.cols.map((c) => [...c]);
  rows.burnNow(); settle(rows);
  // The sides going: before, after (the two new columns in the middle).
  const sides = four(23), sidesBefore = sides.cols.map((c) => [...c]);
  sides.burnNow(); settle(sides);
  // A double: both side columns all white, and the spice it brings in.
  const dbl = new Distilling(seeded(5), { furnaces: 2, doubles: true });
  dbl.cols[0] = dbl.cols[0].map(() => WHITE); dbl.cols[COLS - 1] = dbl.cols[COLS - 1].map(() => WHITE);
  const dblBefore = dbl.cols.map((c) => [...c]);
  dbl.burnNow(); settle(dbl);
  // Rich spice: a column made rich, beside a plain one.
  const rich = new Distilling(seeded(8)), plain = Array.from({ length: TALL }, () => rich.nextPiece()), richer = Array.from({ length: TALL }, () => rich.nextPiece(true));
  return { start, before, rows, sides, sidesBefore, dbl, dblBefore, plain, richer };
}

const SECTIONS = (pic) => {
  const k = (x, cols) => rowSplit(cols[x].length);
  return [
    {
      title: 'A furnace on every edge',
      text: ['The same pieces and the same swap rule as ever. What\'s new is where the fire is: every edge burns.',
        'The left and right furnaces each take a column. The top and bottom furnaces each take a row: the top piece of every column, or the bottom one.'],
      pics: [fig(boardPic(pic.start.cols, { lit: 'sides' }), 'A fresh board. Both side columns start all black, and the sides go first (glowing).')],
    },
    {
      title: 'They take turns',
      text: [`Something burns every ${BURN_S} s, as in the real game: the two sides together, then the top and bottom together, then the sides again.`,
        'So each pair burns every ' + (2 * Number(BURN_S)).toFixed(1) + ' s. The furnaces going next glow, and X (or right-click) burns that pair now.'],
      pics: [el('div', { class: 'turns' }, ...['the sides', 'top and bottom', 'the sides', 'top and bottom'].map((w, i) => el('span', { class: i % 2 ? 'rows' : 'sides' }, el('b', {}, `${((i + 1) * Number(BURN_S)).toFixed(1)} s`), w)))],
    },
    {
      title: 'New pieces come in the middle',
      text: ['Nothing new comes in at an edge. After the sides burn, each half slides out a column and two new columns rise into the middle.',
        'After the rows burn, every column keeps its height: its top half moves up a piece, its bottom half down, and two new pieces appear in its middle.'],
      pics: [
        fig(boardPic(pic.before, { lit: 'rows', cell: 15, ring: (x, y) => (y === 0 || y === pic.before[x].length - 1 ? GONE : null) }), 'Before: the top and bottom rows (ringed) go.'),
        fig(boardPic(pic.rows.cols, { lit: 'sides', cell: 15, ring: (x, y) => (y === k(x, pic.rows.cols) || y === k(x, pic.rows.cols) + 1 ? NEW : null) }), 'After: two new pieces in every column (ringed).'),
        fig(boardPic(pic.sides.cols, { lit: 'rows', cell: 15, ring: (x) => (x === 4 || x === 5 ? NEW : null) }), 'After the sides: two new columns in the middle.'),
      ],
    },
    {
      title: 'Up or burned, one at a time',
      text: ['Every column and every row is judged on its own, just as a column always was: more blacks than whites and it burns; anything else goes up into the flask.',
        `Only whites (and spice) is a Crystal Clear. You don't need a pair for one: a single column or row clears on its own, and they chain as before, ${CHAIN_BONUS} more for every Crystal Clear straight before it, in the order they go: right, left, top, bottom.`],
      pics: [
        fig(linePic(parseBoard(['wwwwwwwwww'])[0]), 'A row of whites: Crystal clear!'),
        fig(linePic(parseBoard(['wKbwKKbKwK'])[0]), 'More blacks than whites: burned, its whites with it.'),
      ],
    },
    {
      title: 'Double Crystal Clear',
      text: [`Both of a pair clear at the same burn (left and right, or top and bottom): ${DOUBLE_BONUS} more points, and a spice comes in with each new column or row.`,
        'Spice is 3 points sent up and -3 burned, and it never moves. So a double pays twice, and then sits in your way.'],
      pics: [
        fig(boardPic(pic.dblBefore, { edges: ['left', 'right'], lit: 'sides', cell: 15, ring: (x) => (x === 0 || x === COLS - 1 ? NEW : null) }), 'Both side columns all white...'),
        fig(boardPic(pic.dbl.cols, { edges: ['left', 'right'], cell: 15, ring: (x, y) => (pic.dbl.cols[x][y] === SPICE && (x === 4 || x === 5) ? FIRE : null) }), '...a double, and a spice in each new column.'),
      ],
    },
    {
      title: 'Dark rum',
      text: ['A column or row of only browns sent up while a chain is going holds the chain instead of breaking it. Once: a second in a row breaks it.',
        `It pays nothing by itself. The next Crystal Clear carries the chain on and pays ${DARK_RUM_BONUS} more for it.`],
      pics: [el('div', { class: 'cols' },
        fig(linePic(Array(8).fill(WHITE), { down: true, cell: 18 }), 'Crystal clear'),
        fig(linePic(Array(8).fill(BROWN), { down: true, cell: 18 }), 'dark rum: held'),
        fig(linePic(Array(8).fill(WHITE), { down: true, cell: 18 }), `clear, +${DARK_RUM_BONUS}`))],
    },
    {
      title: 'Rich spice',
      text: ['A spice sent up in a Crystal Clear makes the next two columns or rows richer: half of their pieces white, and spice one in twelve.'],
      pics: [el('div', { class: 'cols' },
        fig(linePic(pic.plain, { down: true, cell: 18 }), 'as usual'),
        fig(linePic(pic.richer, { down: true, cell: 18 }), 'rich'))],
    },
    {
      title: 'Every move heats the fire',
      text: [`Each move you make (a drag, however many swaps, or a click's swap) brings the next burn ${(TICK_MS / 1000).toFixed(1)} s nearer.`,
        'It isn\'t scored. Fewer, better moves just leave you more time.'],
      pics: [el('div', { class: 'turns' }, el('span', { class: 'sides' }, el('b', {}, '1 drag'), `−${(TICK_MS / 1000).toFixed(1)} s`), el('span', { class: 'sides' }, el('b', {}, '10 drags'), `−${(10 * TICK_MS / 1000).toFixed(1)} s`))],
    },
    {
      title: 'What it changes',
      text: ['There\'s no safe corner any more. Junk kept top-left or bottom-left is next to a fire, and whites by any edge are about to go.',
        'You can\'t save everything, so you choose: which side to give up this burn, whether to chase a double and take its spice, and when a dark rum keeps a chain alive.'],
      pics: [],
    },
  ];
};

const CSS = `
.hg { position: fixed; inset: 0; z-index: 50; background: rgba(10, 6, 2, 0.78); display: flex; justify-content: center; align-items: flex-start; overflow-y: auto; padding: 24px 12px; }
.hg[hidden] { display: none; }
.hg-panel { width: min(900px, 100%); background: #1e1308; border: 1px solid #8a6430; border-radius: 12px; padding: 18px 20px 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.6); }
.hg-head { display: flex; align-items: flex-start; gap: 12px; }
.hg-head h2 { font: 700 28px 'Alegreya', Georgia, serif; color: #e0a92a; margin: 0; flex: 1; }
.hg-head p { margin: 4px 0 0; color: #cbb894; font-size: 15px; }
.hg-close { font: 700 15px 'Alegreya Sans', sans-serif; color: #f6ead2; background: #3a2410; border: 1px solid #a88050; border-radius: 6px; padding: 6px 12px; cursor: pointer; min-height: 40px; }
.hg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; margin-top: 14px; }
.hg-card { background: #2a1a0c; border: 1px solid #5a3e1c; border-radius: 10px; padding: 12px 14px; }
.hg-card.wide { grid-column: 1 / -1; }
.hg-card h3 { font: 700 19px 'Alegreya', Georgia, serif; color: #ffd27a; margin: 0 0 6px; }
.hg-card p { margin: 0 0 6px; color: #f6ead2; font-size: 15px; line-height: 1.4; }
.hg-pics { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; margin-top: 8px; }
.hg figure { margin: 0; max-width: 100%; }
.hg figcaption { font-size: 13px; color: #cbb894; margin-top: 3px; max-width: 220px; }
.hg .cols { display: flex; gap: 10px; align-items: flex-end; }
.hg .cols figcaption { text-align: center; max-width: 80px; }
.hg .turns { display: flex; flex-wrap: wrap; gap: 6px; }
.hg .turns span { display: flex; flex-direction: column; padding: 5px 10px; border-radius: 6px; font-size: 14px; color: #f6ead2; border: 1px solid; }
.hg .turns .sides { border-color: #ff8a2a; background: rgba(255, 138, 42, 0.14); }
.hg .turns .rows { border-color: #ffd23a; background: rgba(255, 210, 58, 0.12); }
.hg .turns b { color: #ffd27a; }
@media (max-width: 620px) { .hg { padding: 8px; } .hg-panel { padding: 12px; } .hg-head h2 { font-size: 23px; } }
`;

/** The guide, an overlay over the page: `open()` and `close()` it; it closes on Escape or a click outside it. */
export function harderGuide() {
  const style = el('style'); style.textContent = CSS; document.head.append(style);
  const close = el('button', { class: 'hg-close', type: 'button' }, 'Play');
  const pic = pictures();
  const grid = el('div', { class: 'hg-grid' }, ...SECTIONS(pic).map((s, i) => el('section', { class: `hg-card${i === 2 || i === 8 ? ' wide' : ''}` },
    el('h3', {}, s.title), ...s.text.map((t) => el('p', {}, t)), s.pics.length ? el('div', { class: 'hg-pics' }, ...s.pics) : '')));
  const panel = el('div', { class: 'hg-panel', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Distilling on four sides' },
    el('div', { class: 'hg-head' }, el('div', {}, el('h2', {}, 'Distilling on four sides'),
      el('p', {}, 'A harder Distilling to try: the same puzzle, with the fire all round it, and a few new ways to score.')), close),
    grid);
  const root = el('div', { class: 'hg', hidden: '' }, panel);
  document.body.append(root);
  const api = {
    open() { root.hidden = false; close.focus(); },
    close() { root.hidden = true; },
    get shown() { return !root.hidden; },
  };
  close.onclick = () => api.close();
  root.addEventListener('pointerdown', (e) => { if (e.target === root) api.close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && api.shown) { api.close(); e.stopPropagation(); } }, true);
  return api;
}
