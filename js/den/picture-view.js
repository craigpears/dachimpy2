/* The pictures' close view: pictures one at a time, flat on the screen, big, like a puzzle's 2D view (the
   user, 11 Nov, in Gravee's gallery: "needs a 2D version similar to the puzzles, so you can go through the
   portraits easily with keyboard controls"). Its rules (the keys, where it opens, going through them) are
   src/picture-view.ts's. It knows nothing of whose pictures they are: picturesOpen() takes a list
   ({ id, title, x, z }), how to draw each (`art(picture)`: a canvas, painted once and kept), what's said
   of each (`line(picture)`, and `who` says it), and `done` for when it's shut. A house's portraits (the
   house shell's: js/den/house.js), or a museum's exhibits, open it the same way. */
import { pictureKey, browse, counter } from '../picture-view.js';

const el = document.createElement('div');
el.className = 'pic-view'; el.id = 'pic-view';
el.innerHTML = '<div class="pic-box"><button class="pic-step" id="pic-prev" aria-label="The one before">&lsaquo;</button>'
  + '<figure><div class="pic-art" id="pic-art"></div><figcaption><b id="pic-title"></b><small id="pic-count"></small></figcaption><p class="pic-line" id="pic-line"></p></figure>'
  + '<button class="pic-step" id="pic-next" aria-label="The next one">&rsaquo;</button></div>'
  + '<div class="pic-foot"><span id="pic-keys">&larr; &rarr; or A, D: through them &middot; Esc: back</span><button class="mini" id="pic-back">Back</button></div>';
document.body.append(el);
const $p = (id) => document.getElementById(id);

/** The view: open or not, its pictures, which is up, and how to draw and speak of them. */
export const pictures = { on: false, list: [], i: 0, art: null, line: null, who: '', done: null, touch: matchMedia('(pointer: coarse)').matches };

/** Opens the view on `list`, at picture `at`. */
export function picturesOpen({ list, at = 0, art, line = null, who = '', done = null }) {
  if (!list?.length) return false;
  Object.assign(pictures, { on: true, list, i: Math.max(0, Math.min(list.length - 1, at)), art, line, who, done });
  $p('pic-keys').hidden = pictures.touch;
  el.classList.add('on');
  show();
  return true;
}
/** Shuts it (back to wherever it was opened from). */
export function picturesClose() {
  if (!pictures.on) return;
  pictures.on = false;
  el.classList.remove('on');
  $p('pic-art').replaceChildren();
  const d = pictures.done;
  pictures.done = null;
  d?.();
}
/** A key while it's open (as KeyboardEvent.key, lower case): true, it's used (every key is, while open). */
export function picturesKey(key, e) {
  if (!pictures.on) return false;
  const m = pictureKey(key);
  if (m) e?.preventDefault?.();
  if (m === 'close') { if (!e?.repeat) picturesClose(); } else if (m) go(m);
  return true;
}
function go(move) {
  pictures.i = browse(pictures.i, move, pictures.list.length);
  show();
}
function show() {
  const P = pictures, p = P.list[P.i];
  if (!p) return;
  const art = $p('pic-art'), cv = P.art?.(p);
  art.replaceChildren(...(cv ? [cv] : []));
  $p('pic-title').textContent = p.title;
  $p('pic-count').textContent = counter(P.i, P.list.length);
  const said = P.line?.(p);
  $p('pic-line').textContent = said ? `${P.who ? `${P.who}: ` : ''}“${said}”` : '';
  $p('pic-line').hidden = !said;
}
$p('pic-prev').onclick = (e) => { e.currentTarget.blur(); go('prev'); };
$p('pic-next').onclick = (e) => { e.currentTarget.blur(); go('next'); };
$p('pic-back').onclick = (e) => { e.currentTarget.blur(); picturesClose(); };
// (a click on the dark round it shuts it, as the portrait viewer does)
el.addEventListener('click', (e) => { if (e.target === el) picturesClose(); });
// (a swipe on a phone goes through them)
let swipe = null;
el.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') swipe = e.clientX; });
el.addEventListener('pointerup', (e) => {
  if (swipe === null) return;
  const dx = e.clientX - swipe;
  swipe = null;
  if (Math.abs(dx) > 50) go(dx < 0 ? 'next' : 'prev');
});
