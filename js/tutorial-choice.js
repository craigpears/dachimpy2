// A lesson's opening choice (TUTORIALS.md; RULES.md, "Every tutorial has the same shape, and you can jump in
// anywhere", 14 Nov): a panel any teacher can show at the start of their lesson, their question in their voice, a
// button for each answer; then that part's list, its scenarios or its single tricks in tabs, to pick one to be shown
// on a real board. Not a chatbot (the user, 14 Nov: "they kind of annoy me"). Hand-written, not compiled; its model
// is js/tutorial.js (src/tutorial.ts, `TutorialMenu`): the keys and taps both go through it, and this only draws it.
//
//   const c = tutorialChoice(tutorial, { onPlay(event), onClose(), parent, open, at })
//     onPlay({ part, section, choice }): what's picked, for the puzzle's lesson to play from part.shows.
//     onClose(): shut (Esc at the opening choice, or "Not now").
//     parent: where it goes (document.body); at: 'center' (the default) or 'bottom'; open: a choice's id to start
//       on its list.
//   c.el, c.close(), c.menu (the model). While it's up it takes the keys it uses (arrows, W A S D, Enter, Space, digits,
//   Esc), and lets every other key through to the game.
import { TutorialMenu } from './tutorial.js';

const STYLE_ID = 'tutorial-choice-style';
/* The den's look (its buttons' wood and gold, Alegreya), so it sits over any scene or page. */
const CSS = `
.tchoice { position: fixed; z-index: 40; left: 50%; transform: translateX(-50%); width: min(560px, calc(100vw - 32px)); max-height: calc(100vh - 32px);
  display: flex; flex-direction: column; background: rgba(36, 23, 14, 0.96); color: #f6ead2; border: 1px solid #c8a050; border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55); font: 500 16px/1.35 'Alegreya Sans', system-ui, sans-serif; }
.tchoice.center { top: 50%; transform: translate(-50%, -50%); }
.tchoice.bottom { bottom: 16px; }
.tchoice .tc-says { margin: 0; padding: 14px 16px 10px; font: italic 500 19px/1.3 'Alegreya', serif; color: #fff4d8; }
.tchoice .tc-says::after { content: ' \\2014 ' attr(data-who); font: 500 14px 'Alegreya Sans', system-ui, sans-serif; font-style: normal; color: #cbb894; }
.tchoice .tc-tabs { display: flex; gap: 4px; padding: 0 12px; border-bottom: 1px solid #5a412a; overflow-x: auto; }
.tchoice .tc-tabs button { font: 700 14px 'Alegreya Sans', system-ui, sans-serif; color: #cbb894; background: none; border: 0; border-bottom: 3px solid transparent; padding: 6px 10px; cursor: pointer; white-space: nowrap; }
.tchoice .tc-tabs button[aria-selected="true"] { color: #e0a92a; border-bottom-color: #e0a92a; }
.tchoice ol { list-style: none; margin: 0; padding: 8px 10px; overflow-y: auto; display: grid; gap: 6px; }
.tchoice ol button { width: 100%; display: grid; grid-template-columns: 26px 1fr auto; gap: 0 8px; align-items: baseline; text-align: left;
  font: 700 16px 'Alegreya Sans', system-ui, sans-serif; color: #f6ead2; background: #3a2410; border: 1px solid #6b5230; border-radius: 9px; padding: 9px 12px; cursor: pointer; }
.tchoice ol button:hover { border-color: #c8a050; }
.tchoice ol button.focus { border-color: #e0a92a; background: #4a2f14; box-shadow: 0 0 0 1px #e0a92a; outline: none; }
.tchoice ol .n { color: #cbb894; font-size: 14px; }
.tchoice ol .line { grid-column: 2 / 4; font-weight: 500; font-size: 14px; color: #cbb894; }
.tchoice ol .tag { font-size: 12px; font-weight: 700; color: #2a1d13; background: #cbb894; border-radius: 99px; padding: 0 7px; }
.tchoice .tc-foot { display: flex; justify-content: space-between; gap: 8px; padding: 6px 12px 12px; }
.tchoice .tc-foot button { font: 700 14px 'Alegreya Sans', system-ui, sans-serif; color: #f6ead2; background: transparent; border: 1px solid #6b5230; border-radius: 8px; padding: 5px 12px; cursor: pointer; }
.tchoice .tc-foot button:hover { border-color: #c8a050; }
.tchoice .tc-keys { align-self: center; font-size: 12px; color: #8c7a60; }
@media (max-width: 640px) { .tchoice .tc-says { font-size: 17px; } .tchoice .tc-keys { display: none; } }
`;

const make = (tag, props = {}, text) => {
  const e = Object.assign(document.createElement(tag), props);
  if (text !== undefined) e.textContent = text;
  return e;
};

export function tutorialChoice(tutorial, { onPlay = () => {}, onClose = () => {}, parent = document.body, at = 'center', open } = {}) {
  if (!document.getElementById(STYLE_ID)) document.head.appendChild(make('style', { id: STYLE_ID }, CSS));
  const menu = new TutorialMenu(tutorial);
  if (open) menu.open(open);
  const el = make('div', { className: `tchoice ${at}` });
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', `${tutorial.teacher}: ${tutorial.puzzle}`);
  const says = make('p', { className: 'tc-says' }), tabs = make('div', { className: 'tc-tabs' }), list = make('ol'), foot = make('div', { className: 'tc-foot' });
  tabs.setAttribute('role', 'tablist');
  says.dataset.who = tutorial.teacher;
  const backBtn = make('button', { type: 'button' }), keys = make('span', { className: 'tc-keys' }, '↑↓ pick · Enter · Esc back');
  foot.append(backBtn, keys);
  el.append(says, tabs, list, foot);

  let shut = false;
  const done = (ev) => {
    if (!ev) return draw();
    if (ev.kind === 'close') { close(); onClose(); } else { close(); onPlay(ev); }
  };
  backBtn.addEventListener('click', () => done(menu.back()));

  function draw() {
    const v = menu.view();
    says.textContent = v.says;
    tabs.replaceChildren(...v.tabs.map((t) => {
      const b = make('button', { type: 'button' }, t.title);
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(t.on));
      b.addEventListener('click', () => { menu.tapTab(t.section); draw(); });
      return b;
    }));
    tabs.hidden = !v.tabs.length;
    list.replaceChildren(...v.items.map((it, i) => {
      const li = make('li'), b = make('button', { type: 'button', className: i === v.focus ? 'focus' : '' });
      b.append(make('span', { className: 'n' }, i < 9 ? String(i + 1) : ''), make('span', {}, it.label), it.tag ? make('span', { className: 'tag' }, it.tag) : make('span'));
      if (it.line) b.append(make('span', { className: 'line' }, it.line));
      b.addEventListener('click', () => done(menu.tap(i)));
      li.appendChild(b);
      return li;
    }));
    backBtn.textContent = v.back ? `← ${v.words.back}` : v.words.close;
    list.querySelector('.focus')?.scrollIntoView({ block: 'nearest' });
  }

  // The keys it uses, before the game sees them (capture), and only those.
  const onKey = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const r = menu.key(e.key);
    if (!r.handled) return;
    e.preventDefault(); e.stopImmediatePropagation();
    done(r.event);
  };
  window.addEventListener('keydown', onKey, true);

  function close() {
    if (shut) return;
    shut = true;
    window.removeEventListener('keydown', onKey, true);
    el.remove();
  }

  parent.appendChild(el);
  draw();
  return { el, close, menu };
}
