// A read guide's sticky nav (TUTORIALS.md; RULES.md, "Every tutorial has the same shape, and you can jump in
// anywhere", 14 Nov): a bar along the top of the page, a button for each part of the tutorial (the basics, the phases,
// the tricks, the scenarios), each opening its list of links, the tricks and scenarios under their phases; the part
// you're reading lit as you scroll. Hand-written, not compiled; everything it shows comes from the tutorial's
// description through js/tutorial.js (src/tutorial.ts, `navFor`, `spy`), so it knows nothing of any puzzle.
//
// The user (14 Nov): "everything should have a nice sticky nav at the top ... where it goes through like some basic
// tricks ... whatever the sections are organized as".
//
//   tutorialNav(tutorial, { mount, links })
//     mount: the element the bar goes before (or into, if `inside`); by default the top of <body>.
//     links: a few links of the page's own at the bar's end, [{ title, href }] (e.g. "Learn it from Helium").
//   Returns { el, close() }.
import { navFor, spy } from './tutorial.js';

const STYLE_ID = 'tutorial-nav-style';
/* Its look: the guides' (design.html's) dark wood and gold by default; a page sets the --tn-* properties to change it
   (--tn-bleed: how far it reaches out over the page's side padding). */
const CSS = `
.tnav { --tn-bg: rgba(20, 13, 8, 0.94); --tn-ink: #f6ead2; --tn-dim: #cbb894; --tn-gold: #e0a92a; --tn-edge: #5a412a; --tn-panel: #241710;
  position: sticky; top: 0; z-index: 30; margin: 0 calc(-1 * var(--tn-bleed, 0px)); padding: 0 var(--tn-bleed, 0px); background: var(--tn-bg); border-bottom: 1px solid var(--tn-edge);
  backdrop-filter: blur(4px); font: 600 15px/1.3 'Alegreya Sans', system-ui, sans-serif; color: var(--tn-ink); }
.tnav .tn-bar { display: flex; align-items: center; gap: 4px; overflow-x: auto; scrollbar-width: none; padding: 6px 0; }
.tnav .tn-bar::-webkit-scrollbar { display: none; }
.tnav button.tn-sec { flex: none; font: inherit; color: var(--tn-dim); background: none; border: 1px solid transparent; border-radius: 8px; padding: 6px 10px; cursor: pointer; white-space: nowrap; }
.tnav button.tn-sec:hover, .tnav button.tn-sec:focus-visible { color: var(--tn-ink); border-color: var(--tn-edge); outline: none; }
.tnav button.tn-sec[aria-current="true"] { color: var(--tn-gold); }
.tnav button.tn-sec[aria-expanded="true"] { color: var(--tn-ink); background: var(--tn-panel); border-color: var(--tn-edge); }
.tnav button.tn-sec::after { content: ' \\25BE'; font-size: 12px; opacity: .7; }
.tnav .tn-own { margin-left: auto; display: flex; gap: 10px; flex: none; padding-left: 10px; }
.tnav .tn-own a { color: var(--tn-gold); white-space: nowrap; }
.tnav .tn-panel { display: none; max-height: min(60vh, 520px); overflow-y: auto; padding: 8px 2px 12px; border-top: 1px solid var(--tn-edge); }
.tnav .tn-panel.open { display: block; }
.tnav .tn-run { margin: 0 0 8px; }
.tnav .tn-run h4 { margin: 4px 0 2px; font: 700 13px 'Alegreya Sans', system-ui, sans-serif; letter-spacing: .05em; text-transform: uppercase; color: var(--tn-dim); }
.tnav .tn-run h4 a { color: inherit; text-decoration: none; }
.tnav .tn-links { display: flex; flex-wrap: wrap; gap: 4px 6px; margin: 0; padding: 0; list-style: none; }
.tnav .tn-links a { display: inline-block; color: var(--tn-ink); text-decoration: none; padding: 4px 9px; border-radius: 99px; border: 1px solid var(--tn-edge); }
.tnav .tn-links a:hover, .tnav .tn-links a:focus-visible { border-color: var(--tn-gold); outline: none; }
.tnav .tn-links a[aria-current="true"] { color: #2a1d13; background: var(--tn-gold); border-color: var(--tn-gold); }
.tnav .tn-tag { margin-left: 5px; font-size: 12px; color: var(--tn-dim); }
.tnav .tn-links a[aria-current="true"] .tn-tag { color: #5b4330; }
@media (max-width: 640px) { .tnav { font-size: 14px; } .tnav .tn-own { display: none; } }
`;

const make = (tag, props = {}, text) => {
  const e = Object.assign(document.createElement(tag), props);
  if (text !== undefined) e.textContent = text;
  return e;
};

export function tutorialNav(tutorial, { mount = document.body.firstElementChild, inside = false, links = [] } = {}) {
  if (!document.getElementById(STYLE_ID)) document.head.appendChild(make('style', { id: STYLE_ID }, CSS));
  const groups = navFor(tutorial);
  const el = make('nav', { className: 'tnav' });
  el.setAttribute('aria-label', `${tutorial.puzzle}: jump to`);
  const bar = make('div', { className: 'tn-bar' }), panel = make('div', { className: 'tn-panel' });
  el.append(bar, panel);
  // (a page's <base target="_blank"> would open each jump in a new tab: these stay on the page)
  const anchor = (l, cls) => { const a = make('a', { href: l.href, target: '_self', className: cls ?? '' }, l.title); a.dataset.id = l.id; if (l.tag) a.appendChild(make('span', { className: 'tn-tag' }, l.tag)); return a; };

  let open = -1;
  const buttons = groups.map((g, i) => {
    const b = make('button', { type: 'button', className: 'tn-sec' }, g.title);
    b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', () => show(open === i ? -1 : i));
    bar.appendChild(b);
    return b;
  });
  if (links.length) {
    const own = make('span', { className: 'tn-own' });
    for (const l of links) own.appendChild(make('a', { href: l.href, target: l.target ?? '_self' }, l.title));
    bar.appendChild(own);
  }

  function show(i) {
    open = i;
    buttons.forEach((b, j) => b.setAttribute('aria-expanded', String(j === i)));
    panel.replaceChildren();
    panel.classList.toggle('open', i >= 0);
    if (i < 0) return;
    for (const run of groups[i].runs) {
      const box = make('div', { className: 'tn-run' });
      if (run.phase) { const h = make('h4'); h.appendChild(anchor(run.phase)); box.appendChild(h); }
      const ul = make('ul', { className: 'tn-links' });
      for (const l of run.links) { const li = make('li'); li.appendChild(anchor(l)); ul.appendChild(li); }
      box.appendChild(ul);
      panel.appendChild(box);
    }
    light();
  }
  const close = () => show(-1);
  panel.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open >= 0) { close(); buttons[0]?.focus(); } });
  document.addEventListener('click', (e) => { if (open >= 0 && !el.contains(e.target)) close(); });

  // Where you are: every place the nav links to, lit as you read past it (its section's button too).
  const places = groups.flatMap((g, i) => [{ id: g.href.slice(1), group: i, link: null },
    ...g.runs.flatMap((r) => [...(r.phase ? [r.phase] : []), ...r.links].map((l) => ({ id: l.href.slice(1), group: i, link: l.id })))]);
  let here = null;
  function light() {
    const y = window.scrollY + el.offsetHeight + 24;
    const marks = places.flatMap((p) => { const t = document.getElementById(p.id); return t ? [{ id: `${p.group}|${p.link ?? ''}|${p.id}`, top: t.getBoundingClientRect().top + window.scrollY }] : []; });
    here = spy(marks, y);
    const [g, link] = here ? here.split('|') : [null, null];
    buttons.forEach((b, j) => b.setAttribute('aria-current', String(String(j) === g)));
    for (const a of panel.querySelectorAll('a')) a.setAttribute('aria-current', String(!!link && a.dataset.id === link));
  }
  let queued = false;
  window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; light(); }); } }, { passive: true });

  // Jumps land below the bar, not under it.
  document.documentElement.style.scrollPaddingTop = '64px';
  if (inside) mount.appendChild(el); else mount?.parentNode ? mount.parentNode.insertBefore(el, mount) : document.body.prepend(el);
  light();
  return { el, close };
}
