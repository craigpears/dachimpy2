// The race plan on the parchment chart (14 Nov; RACE.md §5). The user, 13 Nov: "for a new player, they don't know
// what those things correspond to. They've not seen the map before ... we've got the nice 2D map for the chart
// kind of thing. Is it something that could be combined into that". So the plan's big chart: the course as the
// changelog's chart draws it (src/race-chart.ts, the one drawing tools/race-map.mjs makes it with, from the course
// as laid, never the jpg), each leg's choices written where they are with their puzzles, where she stops for each,
// your route on it in gold, and a choice pointed at drawn in blue over the long way it leaves. A click on a choice
// takes it (race-plan.js, planPick), the board under your hands staying live (never focused). No times or win
// rates (13 Nov: "that's just a behind-the-scenes balance thing"). Opened from the plan's strip (its Chart button,
// or a click on its little chart) or M, on the line and in the race; M or Esc closes it. Touches the rest through
// race.js: chartTick each frame, chartKey first among the race's keys.
import { sheet, sheetSvg, choicePlaces, legWords, wordsAt, SQ, TITLE, INK } from '../race-chart.js';
import { planLines } from '../race-sim.js';
import { fieldFor } from '../start-field.js';
import { optionOf, LEGS } from '../race-plan.js';
import { plan, planPick } from './race-plan.js';
import { sail } from './sea.js';
import { peek, peekAt, peekEnd, peekTick } from './plan-peek.js';

const big = { el: null, seed: null, sheet: null, places: [], hot: null, sig: '', fitted: false };
const P = () => plan.pilot;
const live = (R) => sail.on && ['line', 'count', 'on'].includes(R?.state);

/** M or Esc, at sea in a race (race.js, first among its keys): the chart open or shut. */
export function chartKey(key, R) {
  if (!live(R)) return false;
  // (looking at a choice in 3D: M or Esc back to the chart now, plan-peek.js)
  if (peek.p && (key === 'm' || key === 'escape')) { peekEnd(); plan.big = true; return true; }
  if (key === 'm') { plan.big = !plan.big; return true; }
  if (key === 'escape' && plan.big) { plan.big = false; return true; }
  return false;
}

const pts = (S, line) => line.map(([c, r]) => `${S.X(c).toFixed(1)},${S.Y(r).toFixed(1)}`).join(' ');
const optKey = (leg, id) => `${leg}:${id}`;

function make() {
  const el = big.el = document.createElement('div');
  el.id = 'planchart';
  el.hidden = true;
  el.addEventListener('mousedown', press);
  el.addEventListener('touchstart', (e) => { const t = e.target.closest('[data-pick],.pc-close,.pc-bg'); if (t) { e.preventDefault(); press({ target: t, button: 0, stopPropagation() {}, preventDefault() {} }); } }, { passive: false });
  el.addEventListener('mouseover', (e) => { const b = e.target.closest('[data-pick]'); hot(b ? { leg: Number(b.dataset.leg), id: b.dataset.pick } : null); });
  el.addEventListener('mouseleave', () => hot(null));
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  el.addEventListener('wheel', (e) => e.stopPropagation());
  document.body.appendChild(el);
}
function press(e) {
  e.stopPropagation(); e.preventDefault();
  if (e.button !== 0) return;
  const b = e.target.closest('[data-pick]');
  if (b) {
    const leg = Number(b.dataset.leg), id = b.dataset.pick;
    planPick(leg, id);
    hot({ leg, id });
    // (on the line, a look at it in 3D first, the chart back after: plan-peek.js)
    if (peekAt(leg, id, true)) plan.big = false;
    return;
  }
  if (e.target.closest('.pc-close') || e.target.classList.contains('pc-bg')) plan.big = false;
}

/* The sheet (drawn once a race's field: its slow winds and whirlpools are the race's own) with what never changes
   on it: the legs' names, the line, the finish. Over it, a second svg the same size: the choices, your route, the
   choice pointed at, where she is. */
function build(seed) {
  big.seed = seed;
  const S = big.sheet = sheet({ field: fieldFor(seed ?? 1), ids: 'pc-' }), A = wordsAt();
  big.places = choicePlaces();
  const words = [
    // (the legs' names are their long ways' words; the run home's, alone)
    ...legWords().slice(LEGS.length).map((g) => S.at(g.c, g.r, [[g.text, TITLE, 700]], { size: 0.8, anchor: g.anchor, style: 'italic' })),
    S.at(A.line.c, A.line.r, [['↑ the starting line', TITLE, 700]], { size: 0.6, anchor: A.line.anchor }),
    S.at(A.finish.c, A.finish.r, [['FINISH', TITLE, 700]], { size: 0.75, anchor: A.finish.anchor }),
  ];
  const opts = big.places.map((p) => `<g class="pc-opt" data-leg="${p.leg}" data-pick="${p.id}"><rect class="pc-hit" rx="8"/>`
    + S.at(p.words.c, p.words.r, [[p.lines[0], TITLE, 700], [p.lines[1], INK, 500, 'italic']], { size: 0.78, lh: 1.08, anchor: p.words.anchor })
    + '</g>').join('');
  big.el.innerHTML = '<div class="pc-bg"></div><div class="pc-box">'
    + `<div class="pc-stage" style="aspect-ratio: ${S.w} / ${S.h}">${sheetSvg(S, words, ' class="pc-sheet" aria-hidden="true"')}`
    + `<svg class="pc-over" viewBox="${S.viewBox}" xmlns="http://www.w3.org/2000/svg"><g class="pc-skips"></g><g class="pc-route"></g><g class="pc-hotline"></g><g class="pc-stops"></g><g class="pc-opts">${opts}</g>`
    + `<g class="pc-me"><circle r="${SQ * 0.42}"/><circle r="${SQ * 0.16}" class="pc-me-in"/></g></svg></div>`
    + '<div class="pc-side"><div class="pc-head"><b>Your plan, on the chart</b><button class="pc-close" title="M or Esc">✕</button></div>'
    + '<div class="pc-detail"></div><div class="pc-legs"></div>'
    + '<div class="pc-key"><span><i class="k-route"></i>your route</span><span><i class="k-hot"></i>the choice you point at</span><span><i class="k-long"></i>the long way round the buoys</span><span><i class="k-stop"></i>where she stops for its puzzle</span></div>'
    + '<div class="pc-help"></div></div></div>';
  big.fitted = false;
}
/** Each choice's words a box behind them, to point at and to light (once they're shown, the font in). */
function fit() {
  for (const g of big.el.querySelectorAll('.pc-opt')) {
    const t = g.querySelector('text'), r = g.querySelector('rect'), b = t.getBBox(), m = SQ * 0.14;
    if (!b.width) return;
    Object.entries({ x: b.x - m, y: b.y - m * 0.35, width: b.width + 2 * m, height: b.height + m * 0.7 }).forEach(([k, v]) => r.setAttribute(k, v.toFixed(1)));
  }
  big.fitted = true;
}

function hot(h) {
  big.hot = h;
  drawHot();
}
function drawHot() {
  const S = big.sheet, el = big.el, H = big.hot;
  const p = H && big.places.find((x) => x.leg === H.leg && x.id === H.id);
  el.querySelector('.pc-hotline').innerHTML = p ? p.line.map((l) => `<polyline points="${pts(S, l)}"/>`).join('') : '';
  el.querySelector('.pc-skips').innerHTML = p && p.id !== 'long' ? `<polyline points="${pts(S, p.skips)}"/>` : '';
  for (const g of el.querySelectorAll('.pc-opt')) g.classList.toggle('hot', !!p && optKey(p.leg, p.id) === optKey(Number(g.dataset.leg), g.dataset.pick));
  drawStops(p);
  el.querySelector('.pc-detail').innerHTML = p ? detail(p) : route();
}
/** Where she stops: your route's stops in gold, the one pointed at in blue. */
function drawStops(hotP) {
  const S = big.sheet, mine = new Set(P().plan.map((id, leg) => optKey(leg, id)));
  const ring = (p, cls) => p.stops.map(([c, r]) => `<circle class="${cls}" cx="${S.X(c).toFixed(1)}" cy="${S.Y(r).toFixed(1)}" r="${(SQ * 0.48).toFixed(1)}"/>`).join('');
  big.el.querySelector('.pc-stops').innerHTML = big.places.filter((p) => mine.has(optKey(p.leg, p.id))).map((p) => ring(p, 'on')).join('') + (hotP ? ring(hotP, 'hot') : '');
}
function detail(p) {
  const says = p.says.length ? `<p>${p.says.map((s) => s.replace(/ · /, ': ')).join('<br>')}</p>` : '';
  const vs = p.id === 'long' ? '' : `<p class="pc-vs">Its line in blue; the long way it leaves, in red beneath.</p>`;
  return `<b>Leg ${p.leg + 1} · ${p.name}</b><span>${p.puzzle}</span>${says}${vs}`;
}
function route() {
  const ps = P().plan.map((id, leg) => (id === 'long' ? null : optionOf(leg, id).puzzle)).filter(Boolean);
  return `<b>Your route</b><span>${ps.length ? ps.join(' · ') : 'the long way round, no stops'}</span>`;
}
function drawRoute() {
  const S = big.sheet, mine = new Set(P().plan.map((id, leg) => optKey(leg, id)));
  big.el.querySelector('.pc-route').innerHTML = planLines(P().plan).map((l) => `<polyline points="${pts(S, l)}"/>`).join('');
  for (const g of big.el.querySelectorAll('.pc-opt')) g.classList.toggle('on', mine.has(optKey(Number(g.dataset.leg), g.dataset.pick)));
  big.el.querySelector('.pc-legs').innerHTML = P().plan.map((id, leg) => `<div><i>${leg + 1}</i>${optionOf(leg, id).name}</div>`).join('');
  drawHot();
}

/** Each frame (race.js): open while plan.big is, on the line and in the race. */
export function chartTick(R) {
  if (peekTick(live(R) && R.state === 'line')) plan.big = true;   // (a look at a choice over: plan-peek.js)
  const on = !!plan.big && live(R);
  if (!on && plan.big && !live(R)) plan.big = false;
  if (!big.el) { if (!on) return; make(); }
  big.el.hidden = !on;
  document.body.classList.toggle('bigchart', on);
  if (!on) { big.sig = ''; return; }
  if (big.seed !== (R.seed ?? 1) || !big.sheet) build(R.seed ?? 1);
  if (!big.fitted) fit();
  const sig = P().plan.join();
  if (sig !== big.sig) {
    big.sig = sig;
    drawRoute();
    big.el.querySelector('.pc-help').textContent = innerWidth <= 720 ? 'Tap a choice to take it' : 'Point at a choice to see it · click to take it · M or Esc closes the chart; the race goes on meanwhile';
  }
  const h = sail.helm, me = big.el.querySelector('.pc-me');
  me.setAttribute('transform', `translate(${big.sheet.X(h.pose.c).toFixed(1)} ${big.sheet.Y(h.pose.r).toFixed(1)})`);
}
