// The wolf den's read version (wolf-den-guide.html), its pictures: every board is the den's own board
// (js/den/nav-board.js, as it lies on Multibella's star table) laid from the lesson's boards (src/den-wolfden.ts's BOARDS):
// an article with data-board="name" gets that board as laid, one with data-moves="name" each of the lesson's boards in
// turn (the one named, then any it says to lay next) before its moves, her plan ringed, and after them, and under them
// what Multibella says as she plays them (src/lines/multibella.ts's LESSON), so the read version says what the lesson
// does. The sticky nav comes from the tutorial's description (src/wolf-den-tutorial.ts), by js/tutorial-nav.js.
// Hand-written, not compiled.
import { BOARDS, boardsOf, layBoard, playStep } from './den-wolfden.js';
import { seeded } from './mirror-row.js';
import { WOLF_DEN_TUTORIAL } from './wolf-den-tutorial.js';
import { LESSON } from './lines/multibella.js';
import { tutorialNav } from './tutorial-nav.js';

const failed = document.querySelector('[data-failed]');
tutorialNav(WOLF_DEN_TUTORIAL, { mount: document.querySelector('#basics'), links: [{ title: 'Learn it from Multibella', href: 'den.html?at=wolfden', target: '_blank' }] });

const STEP_NAMES = ['Single', 'Double', 'Triple'];
/** A board's picture: the den's board drawn once, as its game stands (a plan ringed, if given), copied onto a canvas
    of its own. */
async function picture(game, plan = null) {
  const { navBoard } = await import('./den/nav-board.js');
  const b = navBoard({ game, sky: false });
  b.idle = true;
  b.plan = plan;
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

async function draw() {
  for (const art of document.querySelectorAll('article[data-board], article[data-moves]')) {
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
