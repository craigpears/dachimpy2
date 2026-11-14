// The wolf den's read version (wolf-den-guide.html), its pictures: every board is the den's own board
// (js/den/nav-board.js, as it lies on Dignity's star table) laid from the lesson's boards (src/den-wolfden.ts's BOARDS):
// an article with data-board="name" gets that board as laid, one with data-moves="name" the board before its moves
// and after them. The sticky nav comes from the tutorial's description (src/wolf-den-tutorial.ts), by
// js/tutorial-nav.js. Hand-written, not compiled.
import { layBoard, playStep } from './den-wolfden.js';
import { seeded } from './mirror-row.js';
import { WOLF_DEN_TUTORIAL } from './wolf-den-tutorial.js';
import { tutorialNav } from './tutorial-nav.js';

const failed = document.querySelector('[data-failed]');
tutorialNav(WOLF_DEN_TUTORIAL, { mount: document.querySelector('#basics'), links: [{ title: 'Learn it from Dignity', href: 'den.html?at=wolfden', target: '_blank' }] });

/** A board's picture: the den's board drawn once, as its game stands, copied onto a canvas of its own. */
async function picture(game) {
  const { navBoard } = await import('./den/nav-board.js');
  const b = navBoard({ game, sky: false });
  b.idle = true;
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

async function draw() {
  for (const art of document.querySelectorAll('article[data-board], article[data-moves]')) {
    const name = art.dataset.board ?? art.dataset.moves, laid = layBoard(name, seeded(7));
    if (!laid) continue;
    const row = document.createElement('div');
    row.className = 'boards';
    art.append(row);
    row.append(figure(await picture(laid.game), art.dataset.moves ? 'Before' : 'As it lies'));
    if (art.dataset.moves) {
      let said = [];
      for (const step of laid.moves) {
        const m = playStep(laid.game, step);
        let n = 0;
        for (const st of m.stages) {
          if (st.kind === 'line') { n++; said.push(`${['Single', 'Double', 'Triple'][n - 1] ?? `${n}x`}! +${st.cleared.length * n}`); }
          if (st.kind === 'constellation') { n++; said.push(`${n > 1 ? `${['Single', 'Double', 'Triple'][n - 1]}! ` : ''}Constellation! +${st.done.points}`); }
        }
      }
      row.append(figure(await picture(laid.game), `After: ${said.join(', ') || 'nothing cleared'}`));
    }
  }
}
draw().catch((e) => { console.error(e); failed.hidden = false; });
