// Your race route, planned, then puzzled through (RACE.md §5; the rules, the pilot and its stops:
// src/race-plan.ts; each choice's line: src/race-sim.ts, choiceLines). The user, 12 Nov:
// "you plan by choosing those options, that works. That's really simple and easy." Here: the plan's strip along
// the screen's right-hand edge (the course drawn small with your route on it, each leg's choices and their puzzles,
// one click to pick one, the board under your hands staying live), and the pilot wired to
// your sloop: it sails the plan a move at a time on your own helm, holds her at each obstacle's stop with the board
// it asks for put up, and lets her go on once it's done. You can still take the helm: W A D or a click on the sea
// and she sails your moves or your pin, and the pilot carries on once they're played out; or the strip's Pilot
// button (or T) to turn it off and steer all the way. Touches the rest through a few hooks: race.js steps it with
// the race (planStep), draws its strip (planTick) and starts it afresh each race (planReset); sailing.js tells it
// you've taken the helm (planTake); the Sailing board holds a gust it mustn't carry (station.gusts).
import { Pilot, LEGS, choose, optionOf, stretchOf, courseChart, readPlan, writePlan, PLAN_STORE } from '../race-plan.js';
import { choiceLines, planLines } from '../race-sim.js';
import { rocksDown } from '../den-race.js';
import { BRIBE } from '../den-bribe.js';
import { chainName } from '../sailing.js';
import { toast, edges } from './world.js';
import { sail } from './sea.js';
import { station, stationToggle } from './sail-station.js';
import { gunnery, gunneryToggle } from './sea-guns.js';
import { rowToggle } from './wind.js';
import { rowing } from './rowing.js';
import { patch } from './sea-puzzles.js';
import { haul } from './treasure.js';
import { door } from './door.js';
import { forage } from './race-forage.js';
import { bribe } from './race-bribe.js';
import { netPlan } from './race-net.js';

/* Your last plan, kept in this browser (the user, 13 Nov: "persist the last plan you chose so that you don't need to
   do it every time"): each race starts from it. Only what you choose is kept, never a shortcut the pilot put by. */
const stored = () => { try { return readPlan(localStorage.getItem(PLAN_STORE)); } catch { return readPlan(null); } };
const keep = (p) => { try { localStorage.setItem(PLAN_STORE, writePlan(p)); } catch { /* (no storage: kept this voyage only) */ } };

export const plan = { pilot: new Pilot(stored()), el: null, sig: '', opened: '', rowed: false, said: 0, racing: false, w: null, peek: false, hot: null, hotT: 0, chart: null, big: false };
const P = () => plan.pilot;
/** Racing under the pilot: aboard, the race on and not over for you. */
const steering = (R) => sail.on && R.state === 'on';

/** The world round her, as the pilot asks it (src/race-plan.ts, PlanWorld). */
function world(R, ctx) {
  const s = sail.helm.sea;
  return {
    seed: R.seed ?? 0, sea: s, sig: `${R.seed}|${s.rocks.size}`,
    coins: () => (bribe.k.paid ? BRIBE.PRICE : bribe.k.carried()), price: BRIBE.PRICE,
    paid: () => bribe.k.paid, gunQuiet: () => !ctx.gap.guns[0].live(), rocksDown: () => rocksDown(R.field), cleared: () => forage.bar.cleared,
  };
}

/** Each of the race's steps, before the helm's (race.js, raceHelm): the pilot's next moves, or held at a stop
    with its board put up. `ctx`: the race's gun gap and crane, her trip on its hook, and Space (raceKey). */
export function planStep(h, R, ctx) {
  // (at the gun: her plan written down, online, for the race's record)
  // (and the Sailing board put up, your hands on it while the pilot sails: its clears carry her along the plan)
  if (steering(R) && !plan.racing) { plan.racing = true; netPlan(P().plan); if (P().on && !station.want) stationToggle(false); }
  if (!steering(R)) { plan.racing = false; return; }
  const was = P().order, changes = P().changes.length;
  const o = P().steer(h, plan.w = world(R, ctx));
  // (a shortcut it couldn't sail to, put by: her plan says the long way there, and so does the strip)
  if (P().changes.length > changes) {
    const c = P().changes[P().changes.length - 1];
    toast(`No sailing to ${optionOf(c.leg, c.from).name.toLowerCase()} from here: leg ${c.leg + 1}'s ${optionOf(c.leg, c.to).name.toLowerCase()} now`);
    netPlan(P().plan);
  }
  // (out of the headwind gap: the oars it ran out shipped again, and the Sailing board's back: sailing.js)
  if (plan.rowed && !(o.kind === 'stop' && o.stop.board === 'rowing')) { plan.rowed = false; if (h.oars) rowToggle(); }
  if (o.kind !== 'stop') { plan.opened = ''; return; }
  const st = o.stop, first = plan.opened !== st.id;
  if (was.kind !== 'stop' || was.stop.id !== st.id) plan.opened = '';
  if (h.cur || h.slot >= 0 || h.gusts.length) return;
  // The board it asks for, put up once as she comes to rest there (put away, it stays away: Space as ever).
  if (first) {
    plan.opened = st.id;
    if (st.board === 'sailing' && !station.want) stationToggle(false);
    if (st.board === 'gunnery' && sail.guns.shots('L') === 0 && !gunnery.on) gunneryToggle(false);
    // (the oars out once she's lined up facing down the gap: src/race-plan.ts, STOPS.headwind; Sailing's board
    // goes away meanwhile, and the boards fit beside the plan's strip)
    if (st.board === 'rowing' && !h.oars) { rowToggle(); plan.rowed = true; }
    if (['treasure', 'foraging', 'navigation', 'carpentry', 'pay'].includes(st.board) && !haul.on && !forage.on && !door.on) ctx.space();
    toast(st.say);
  }
  // (the crane built, her trip over the neck; the door open, through it)
  if (st.board === 'carpentry' && ctx.crane.built() && !ctx.trip() && ctx.crane.alongside(h)) ctx.space();
  if (st.board === 'navigation' && door.rules.open && !door.on && !door.trip) ctx.space();
}

/** A new race (or a fresh voyage): your last plan (kept in this browser), nothing done. */
export function planReset() { P().restart(); P().plan = stored(); plan.opened = ''; plan.rowed = false; plan.racing = false; plan.said = 0; plan.sig = ''; }
/** You've put in a move or dropped a pin (sailing.js): the helm's yours till they're sailed. */
export function planTake() { if (plan.racing && P().on) P().take(sail.helm); }
// (a click on the sea that drops a pin: the same)
sail.pins.push(() => { planTake(); return false; });
/** T at sea in a race: the pilot on or off. */
export function planKey(key, R) {
  if (key !== 't' || !sail.on || !['line', 'count', 'on'].includes(R.state)) return false;
  pilotToggle();
  return true;
}
function pilotToggle() {
  P().on = !P().on;
  if (!P().on) { while (sail.helm.mine.length) sail.helm.unput(); }
  toast(P().on ? 'The pilot has her: she sails your plan' : 'The helm\'s yours: click the sea or W A D. T: the pilot again');
}
/* A gust the Sailing board mustn't carry her by (src/race-plan.ts, gustHeld): held at a hop, a chain too small for
   it doesn't carry her into its wind; and none carries her into a way through her plan isn't taking her through
   just now (the user, 13 Nov: a plan changed while she was held facing into the gate, and a gust carried her
   straight through it). */
const NEED = { 2: 'a Double', 3: 'a Triple', 4: 'a Quad', 7: 'a Vegas' };
station.gusts.push((res) => {
  if (!plan.racing || !plan.w) return null;
  const why = P().gustHeld(sail.helm, plan.w, res.run);
  if (!why) return null;
  const what = chainName(res.steps).replace(/!+$/, '') || 'clear';
  const o = P().order;
  return { say: why === 'hop' ? `A ${what}! Held here for the hop: it takes ${NEED[o.stop.need] ?? 'more'}` : `A ${what}! Held: that's not her plan's way through. The pilot's turning her onto the leg`, went: 0 };
});
// What the Sailing board's prompt leads with at a stop.
station.leads.push(() => (plan.racing && P().order.kind === 'stop' && P().order.stop.board === 'sailing' ? P().order.stop.say : ''));

// ---------- the strip ----------
/* Along the screen's right-hand edge, on the line and in the race (the user, 13 Nov: "if you're changing the
   [plan], you need to be able to see the length. This is very disconnected"): the course drawn small, your route on
   it in gold and where she is; then each leg still to come with its choices side by side, each with its puzzle, yours
   lit. No times (the user, 13 Nov: "I don't know why you've got the timings on there ... that's just a
   behind-the-scenes balance thing. There's no reason to display that"; they stay the simulation's, src/race-sim.ts). Pointing at a choice (or picking one) draws its line on the
   course. One click (or tap) picks it, the board under your hands staying live (on the press, never focused, so
   Space and the keys stay the board's).
   Never over a board (the user, 13 Nov: "your plan is covering the right hand row board"): while a board other than
   Sailing's is up, it folds to a tab at the edge (a click opens it over the sea a moment), and the boards lay
   themselves out clear of whatever it keeps (world.js, edges). On a phone it's always the tab, opening as a sheet. */
const phone = () => innerWidth <= 720 || innerHeight <= 520;
function make() {
  const el = plan.el = document.createElement('div');
  el.id = 'raceplan';
  el.addEventListener('mousedown', press);
  el.addEventListener('touchstart', (e) => { const t = e.target.closest('[data-pick],.rp-pilot,.rp-fold,.rp-tab,.rp-big,.rp-chart'); if (t) { e.preventDefault(); press({ target: t, button: 0, stopPropagation() {}, preventDefault() {} }); } }, { passive: false });
  el.addEventListener('mouseover', (e) => { const b = e.target.closest('[data-pick]'); if (b) hot(Number(b.dataset.leg), b.dataset.pick); });
  el.addEventListener('mouseleave', () => { if (plan.hotT <= 0) hot(null); });
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  document.body.appendChild(el);
}
function press(e) {
  e.stopPropagation(); e.preventDefault();
  if (e.button !== 0) return;
  const b = e.target.closest('[data-pick]');
  if (b) return pick(Number(b.dataset.leg), b.dataset.pick);
  if (e.target.closest('.rp-pilot')) return pilotToggle();
  // (the course on the parchment chart, big, the choices on it where they are: plan-chart.js)
  if (e.target.closest('.rp-big,.rp-chart')) { plan.big = !plan.big; return; }
  if (e.target.closest('.rp-tab')) { plan.peek = true; plan.sig = ''; return; }
  if (e.target.closest('.rp-fold')) { plan.peek = false; plan.sig = ''; }
}
let R0 = null;
/** A choice taken, from the strip or the big chart (plan-chart.js): kept, and online said to the room. */
export function planPick(leg, id) { pick(leg, id); }
function pick(leg, id) {
  if (P().plan[leg] === id) { hot(leg, id, 3); return; }
  P().set(choose(P().plan, leg, id), R0?.clock?.() ?? 0);
  keep(P().plan);
  if (plan.racing) netPlan(P().plan);
  hot(leg, id, 3);
  plan.sig = '';
}
/** A choice's line drawn on the course (null: none), for `secs` once picked (a tap has no pointing). */
function hot(leg, id, secs = 0) {
  plan.hot = leg === null ? null : { leg, id };
  plan.hotT = secs;
  drawHot();
}

// The course drawn small: an SVG in squares, its land once, the lines over it.
const pts = (line) => line.map(([c, r]) => `${(c + 0.5).toFixed(2)},${(r + 0.5).toFixed(2)}`).join(' ');
function chartSvg() {
  const C = plan.chart ??= courseChart(sail.helm.sea);
  const land = C.land.map(([r, a, b]) => `<rect x="${a}" y="${r}" width="${b - a + 1}" height="1.02"/>`).join('');
  const long = planLines(LEGS.map(() => 'long')).map((l) => `<polyline points="${pts(l)}"/>`).join('');
  return `<svg class="rp-chart" viewBox="0 ${C.r0} ${C.cols} ${C.r1 - C.r0 + 1}" preserveAspectRatio="xMidYMid meet">`
    + `<rect class="rp-sea" x="0" y="${C.r0}" width="${C.cols}" height="${C.r1 - C.r0 + 1}"/><g class="rp-land">${land}</g>`
    + `<g class="rp-long">${long}</g><g class="rp-route"></g><g class="rp-hot"></g><circle class="rp-me" r="0.9" cx="-9" cy="0"/></svg>`;
}
function drawRoute() {
  const g = plan.el?.querySelector('.rp-route');
  if (g) g.innerHTML = planLines(P().plan).map((l) => `<polyline points="${pts(l)}"/>`).join('');
}
function drawHot() {
  const g = plan.el?.querySelector('.rp-hot'), d = plan.el?.querySelector('.rp-detail');
  if (!g) return;
  const H = plan.hot;
  g.innerHTML = H ? choiceLines(H.leg, H.id).map((l) => `<polyline points="${pts(l)}"/>`).join('') : '';
  if (d) d.innerHTML = H ? detail(H.leg, H.id) : totalText();
}
/** What a choice is, said: "Leg 2 · The headwind gap · rowing". */
function detail(leg, id) {
  const o = optionOf(leg, id);
  return `<b>Leg ${leg + 1} · ${o.name}</b> · ${o.puzzle}`;
}
/** Your route, said: the puzzles it stops for, in order, or the long way round. */
function totalText() {
  const ps = P().plan.map((id, leg) => (id === 'long' ? null : optionOf(leg, id).puzzle)).filter(Boolean);
  return ps.length ? `Your route: ${ps.join(' · ')}` : 'Your route: the long way round, no stops';
}

/** Each frame (race.js): the strip, shown on the line and in the race. */
export function planTick(R, show) {
  R0 = R;
  if (!plan.el) make();
  const on = show && sail.on && ['line', 'count', 'on'].includes(R.state);
  plan.el.hidden = !on;
  document.body.classList.toggle('planning', on);
  if (!on) { edges.right = 0; plan.peek = false; return; }
  if (plan.hotT > 0 && (plan.hotT -= 1 / 60) <= 0) hot(null);
  const h = sail.helm, from = R.state === 'on' ? Math.max(0, Math.min(4, stretchOf(h.pose.r))) : 0, o = P().order;
  // (folded while a board other than Sailing's is up, and always on a phone; a click on its tab opens it a while)
  const busy = rowing.on || gunnery.on || patch.on || haul.on || forage.on || door.on || (o.kind === 'stop' && o.stop.board !== 'sailing');
  const fold = (busy || phone()) && !plan.peek;
  plan.el.classList.toggle('folded', fold);
  plan.el.classList.toggle('sheet', phone() && plan.peek);
  // (down the edge under the starter's card while it's up, above the prompt along the bottom; never scrolling: the
  // course drawn small gives up height first)
  if (!phone()) {
    const card = document.getElementById('racecard')?.getBoundingClientRect(), cb = card && card.height > 0 ? card.bottom : 0;
    const top = Math.max(150, cb + 8), low = document.getElementById('dock')?.getBoundingClientRect().top || innerHeight;
    Object.assign(plan.el.style, { top: `${Math.round(top)}px`, bottom: 'auto', maxHeight: `${Math.round(Math.max(120, low - top - 8))}px` });
  } else Object.assign(plan.el.style, { top: '', bottom: '', maxHeight: '' });
  // (what it keeps along the edge, for the boards to lay themselves out clear of: nothing on a phone, where they're
  // along the bottom and it's a tab at the top)
  edges.right = phone() ? 0 : Math.ceil(innerWidth - plan.el.getBoundingClientRect().left) + 4;
  // (where she is, on the course drawn small)
  const me = plan.el.querySelector('.rp-me');
  if (me) { me.setAttribute('cx', (h.pose.c + 0.5).toFixed(2)); me.setAttribute('cy', (h.pose.r + 0.5).toFixed(2)); }
  const now = !P().on ? 'The helm\'s yours' : P().taken ? 'Your moves, then the pilot' : R.state !== 'on' ? 'The pilot sails it from the gun' : o.kind === 'stop' ? o.stop.say : 'Under way';
  const sig = `${now}|${P().on}|${P().plan.join()}|${from}|${fold}|${plan.peek}|${R.state === 'on'}`;
  if (sig === plan.sig) return;
  plan.sig = sig;
  const cur = optionOf(from, P().plan[from]);
  if (fold) {
    plan.el.innerHTML = `<button class="rp-tab" title="Your plan: open it">Plan<small>Leg ${from + 1}: ${cur.short}</small></button>`;
    return;
  }
  const legs = P().plan.map((id, leg) => ({ leg, id })).filter((x) => x.leg >= from);
  plan.el.innerHTML = `<div class="rp-head"><b>Your plan</b><button class="rp-big" title="M: the course on the chart, your choices on it">Chart</button><button class="rp-pilot${P().on ? ' on' : ''}" title="T">Pilot ${P().on ? 'on' : 'off'}</button>${busy || phone() ? '<button class="rp-fold" title="Fold it away">✕</button>' : ''}</div>`
    + `<div class="rp-now">${now}</div>${chartSvg()}<div class="rp-detail"></div>`
    + legs.map((x) => `<div class="rp-leg${x.leg === from && R.state === 'on' ? ' now' : ''}"><i title="Leg ${x.leg + 1}">${x.leg + 1}</i><span>`
      + LEGS[x.leg].options.map((op) => `<button data-leg="${x.leg}" data-pick="${op.id}" class="rp-opt${op.id === x.id ? ' on' : ''}" title="${op.name}: ${op.puzzle}">${op.short}</button>`).join('')
      + '</span></div>').join('')
    + `<div class="rp-help">${phone() ? 'Tap a choice to take it · Chart: see them all on the course' : 'Point at a choice to see it on the course · click to take it · M or Chart: where each one is'}</div>`;
  drawRoute();
  drawHot();
}
