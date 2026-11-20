// The wolf den's read version (wolf-den-guide.html), its pictures: every board is the den's own board
// (js/den/nav-board.js, as it lies on Multibella's star table) laid from the lesson's boards (src/den-wolfden.ts's BOARDS):
// an article with data-board="name" gets that board as laid, one with data-moves="name" each of the lesson's boards in
// turn (the one named, then any it says to lay next) before its moves, her plan ringed, and after them, and under them
// what Multibella says as she plays them (src/lines/multibella.ts's LESSON), so the read version says what the lesson
// does. One with data-beat="step" too is a beat of a walk, How it works (Umami's run) or speed nav (the quick double)
// (src/wolf-den-tutorial.ts's WALKS): the board as each of its cues shows, and her words for them. The sticky nav comes from the tutorial's description (src/wolf-den-tutorial.ts), by js/tutorial-nav.js.
// Hand-written, not compiled.
import { BOARDS, boardsOf, layBoard, playStep, stageCues, planMarks } from './den-wolfden.js';
import { Navigation, COLOUR_NAMES } from './navigation.js';
import { seeded } from './mirror-row.js';
import { WOLF_DEN_TUTORIAL, WALKS } from './wolf-den-tutorial.js';
import { LESSON } from './lines/multibella.js';
import { tutorialNav } from './tutorial-nav.js';

const failed = document.querySelector('[data-failed]');
tutorialNav(WOLF_DEN_TUTORIAL, { mount: document.querySelector('#basics'), links: [{ title: 'Learn it from Multibella', href: 'den.html?at=wolfden', target: '_blank' }] });

const STEP_NAMES = ['Single', 'Double', 'Triple'];
const RING_NAMES = ['The centre', 'The middle', 'The third', 'The outer'];
/** A board's picture: the den's board drawn once, as its game stands (a plan ringed, if given), copied onto a canvas
    of its own. */
async function picture(game, plan = null, marks = null) {
  const { navBoard } = await import('./den/nav-board.js');
  const b = navBoard({ game, sky: false });
  b.idle = true;
  b.plan = plan;
  b.marks = marks;
  b.tick(0.001);
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 512;
  // (on the star table's navy cloth, as in the hut: on the page's paper the stars wouldn't show)
  const g = cv.getContext('2d');
  g.fillStyle = '#0a1640'; g.beginPath(); g.arc(256, 256, 252, 0, Math.PI * 2); g.fill();
  g.drawImage(b.canvas, 0, 0, 512, 512);
  b.dispose();
  return cv;
}
const figure = (cv, caption) => {
  const f = document.createElement('figure'), c = document.createElement('figcaption');
  c.textContent = caption;
  f.append(cv, c);
  return f;
};
/** What a board's moves did, as the board names it over the stars: "Single! +3, Double! Constellation! +250". */
function played(laid) {
  const said = [];
  for (const step of laid.moves) {
    let n = 0;
    for (const st of playStep(laid.game, step).stages) {
      if (st.kind === 'line') { n++; said.push(`${STEP_NAMES[n - 1] ?? `${n}x`}! +${st.cleared.length * n}`); }
      if (st.kind === 'constellation') { n++; said.push(`${n > 1 ? `${STEP_NAMES[n - 1]}! ` : ''}Constellation! +${st.done.points}`); }
    }
  }
  return said.join(', ') || 'nothing cleared';
}

/** A board as it stood at some stage of a move: its stars, and the constellation's targets as they were then. */
function boardAt(grid, marks) {
  const g = new Navigation(seeded(7), { den: true });
  g.grid = grid.map((ring) => ring.map((x) => (x ? { ...x } : null)));
  g.constellation = marks ? { id: 1, marks } : null;
  return g;
}
/** A beat of a walk: the board as each of its cues shows (the plan ringed before the moves, a ring just turned, a line
    as it goes, every target filled as it's charted, the next one up), captioned as the board names it, and her words
    for them. */
async function drawBeat(art, name, beat) {
  const walk = Object.values(WALKS).find((w) => w.board === name && w.steps[beat]);
  const laid = layBoard(name, seeded(7)), cues = walk?.steps[beat] ?? [];
  const row = document.createElement('div');
  row.className = 'boards';
  art.append(row);
  const wild = new Set(laid.game.constellation.marks.filter((m) => m.wild).map((m) => `${m.ring},${m.spoke}`));
  const marksOf = (c) => c && c.marks.map((m) => ({ ...m, wild: c === laid.game.constellation ? wild.has(`${m.ring},${m.spoke}`) : m.wild }));
  const shots = [];
  // (a board built then set off has its plan marked, dashed till it's built: src/den-wolfden.ts's planMarks)
  const marked = !!BOARDS[name].marked;
  const m0 = planMarks(name, 0);
  if (cues.includes('set')) shots.push([await picture(laid.game, BOARDS[name].plan ?? null, m0), m0.length ? 'The plan, dashed till it's built' : marked || !BOARDS[name].plan ? 'Before' : 'Before: the plan ringed']);
  const first = laid.game.constellation;
  let n = 0, prev = null;
  for (const [i, move] of laid.moves.entries()) {
    const colour = 'drop' in move ? COLOUR_NAMES[move.next?.c ?? laid.game.next.c] : null;
    for (const st of playStep(laid.game, move).stages) {
    if (st.kind === 'turn' || st.kind === 'drop') n = 0;
    if (st.kind === 'turn' && cues.includes(`move${i + 1}`)) shots.push([await picture(boardAt(st.grid, marksOf(first)), null, planMarks(name, i + 1)), `${RING_NAMES[move.turn] ?? 'A'} ring turned${laid.moves[i - 1] && 'turn' in laid.moves[i - 1] ? ' again' : ''}`]);
    const step = st.kind === 'line' || st.kind === 'constellation' ? ++n : 0;
    for (const w of st.wilded ?? []) wild.add(`${w.ring},${w.spoke}`);
    const said = stageCues(st, step).filter((c) => cues.includes(c));
    if (said.length) {
      const live = st.constellation === first || !st.constellation ? first : st.constellation;
      if (st.kind === 'line') shots.push([await picture(boardAt(st.grid, marksOf(live))), `${STEP_NAMES[step - 1] ?? `${step}x`}! +${st.cleared.length * step}${st.wilded?.length ? ', a target gone wild' : ''}`]);
      if (st.kind === 'constellation') shots.push([await picture(boardAt(prev.grid, marksOf(first))), `${step > 1 ? `${STEP_NAMES[step - 1]}! ` : ''}Constellation! +${st.done.points}`]);
      if (st.kind === 'deal') shots.push([await picture(boardAt(st.grid, marksOf(st.constellation))), `The next one up: ${st.constellation.marks.filter((m) => m.wild).length} wild targets`]);
    }
    prev = st;
    }
    // (a star she drops, as it comes to rest, the plan as it stands)
    if (colour && cues.includes(`move${i + 1}`)) shots.push([await picture(boardAt(laid.game.grid, marksOf(first)), null, planMarks(name, i + 1)), `A ${colour.toLowerCase()} comes: dropped${planMarks(name, i + 1).length && !planMarks(name, i).length ? ', and the plan marked' : ''}`]);
  }
  for (const [cv, caption] of shots) row.append(figure(cv, caption));
  const words = cues.map((c) => LESSON[name]?.[c]).filter(Boolean);
  if (words.length) {
    const q = document.createElement('blockquote');
    q.className = 'says';
    for (const w of words) { const p = document.createElement('p'); p.textContent = w; q.append(p); }
    art.append(q);
  }
}

async function draw() {
  for (const art of document.querySelectorAll('article[data-board], article[data-moves]')) {
    if (art.dataset.beat) { await drawBeat(art, art.dataset.moves, art.dataset.beat); continue; }
    const names = art.dataset.moves ? boardsOf(art.dataset.moves) : [art.dataset.board];
    for (const name of names) {
      const laid = layBoard(name, seeded(7));
      if (!laid) continue;
      const row = document.createElement('div');
      row.className = 'boards';
      art.append(row);
      if (!art.dataset.moves) { row.append(figure(await picture(laid.game), 'As it lies')); continue; }
      row.append(figure(await picture(laid.game, BOARDS[name].plan ?? null), BOARDS[name].plan ? 'Before: her plan ringed' : 'Before'));
      const caption = `After: ${played(laid)}`;
      row.append(figure(await picture(laid.game), caption));
      // (what she says as she plays it, in order)
      const words = Object.values(LESSON[name] ?? {});
      if (words.length && art.dataset.says !== 'no') {
        const q = document.createElement('blockquote');
        q.className = 'says';
        for (const w of words) { const p = document.createElement('p'); p.textContent = w; q.append(p); }
        art.append(q);
      }
    }
  }
}
draw().catch((e) => { console.error(e); failed.hidden = false; });
