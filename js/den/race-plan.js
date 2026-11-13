// Your race route, planned, then puzzled through (RACE.md §5; the rules, the pilot and its stops:
// src/race-plan.ts). The user, 12 Nov: "you plan by choosing those options, that works. That's really simple and
// easy." Here: the plan's strip along the screen's right-hand edge (the legs still to come and your choice on
// each, one click to change one, the board under your hands staying live), and the pilot wired to your sloop:
// it sails the plan a move at a time on your own helm, holds her at each obstacle's stop with the board it
// asks for put up, and lets her go on once it's done. You can still take the helm: W A D or a click on the sea
// and she sails your moves or your pin, and the pilot carries on once they're played out; or the strip's Pilot
// button (or T) to turn it off and steer all the way. Touches the rest through a few hooks: race.js steps it
// with the race (planStep), draws its strip (planTick) and starts it afresh each race (planReset); sailing.js
// tells it you've taken the helm (planTake); the Sailing board holds a gust too small for a hop (station.gusts).
import { Pilot, LEGS, cycle, holds, optionOf, stretchOf } from '../race-plan.js';
import { rocksDown } from '../den-race.js';
import { BRIBE } from '../den-bribe.js';
import { chainName } from '../sailing.js';
import { $, toast } from './world.js';
import { sail } from './sea.js';
import { station, stationToggle } from './sail-station.js';
import { gunnery, gunneryToggle } from './sea-guns.js';
import { rowToggle } from './wind.js';
import { haul } from './treasure.js';
import { door } from './door.js';
import { forage } from './race-forage.js';
import { bribe } from './race-bribe.js';
import { netPlan } from './race-net.js';

export const plan = { pilot: new Pilot(), el: null, sig: '', opened: '', rowed: false, said: 0, racing: false };
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
  const o = P().steer(h, world(R, ctx));
  // (a shortcut it couldn't sail to, put by: her plan says the long way there, and so does the strip)
  if (P().changes.length > changes) {
    const c = P().changes[P().changes.length - 1];
    toast(`No sailing to ${optionOf(c.leg, c.from).name.toLowerCase()} from here: leg ${c.leg + 1}'s ${optionOf(c.leg, c.to).name.toLowerCase()} now`);
    netPlan(P().plan);
  }
  // (out of the headwind gap: the oars it ran out shipped again)
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
    if (st.board === 'rowing' && !h.oars) { rowToggle(); plan.rowed = true; }
    if (['treasure', 'foraging', 'navigation', 'carpentry', 'pay'].includes(st.board) && !haul.on && !forage.on && !door.on) ctx.space();
    toast(st.say);
  }
  // (the crane built, her trip over the neck; the door open, through it)
  if (st.board === 'carpentry' && ctx.crane.built() && !ctx.trip() && ctx.crane.alongside(h)) ctx.space();
  if (st.board === 'navigation' && door.rules.open && !door.on && !door.trip) ctx.space();
}

/** A new race (or a fresh voyage): the plan kept, nothing done. */
export function planReset() { P().restart(); plan.opened = ''; plan.rowed = false; plan.racing = false; plan.said = 0; }
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
// Held at a hop, a chain too small for it doesn't carry her into its wind (src/race-plan.ts, holds).
const NEED = { 2: 'a Double', 3: 'a Triple', 4: 'a Quad', 7: 'a Vegas' };
station.gusts.push((res) => {
  const o = P().order;
  if (!plan.racing || !holds(o, res.run)) return null;
  const what = chainName(res.steps).replace(/!+$/, '') || 'clear';
  return { say: `A ${what}! Held here for the hop: it takes ${NEED[o.stop.need] ?? 'more'}`, went: 0 };
});
// What the Sailing board's prompt leads with at a stop.
station.leads.push(() => (plan.racing && P().order.kind === 'stop' && P().order.stop.board === 'sailing' ? P().order.stop.say : ''));

// ---------- the strip ----------
/* Along the screen's right-hand edge, on the line and in the race: the legs still to come, your choice on each,
   the leg you're on lit; one click (or tap) on a leg is its next choice, a right click the one before. Above them,
   what the pilot's doing, and its switch. */
function make() {
  const el = plan.el = document.createElement('div');
  el.id = 'raceplan';
  // (never focused: Space and the keys stay the sea's and the boards')
  // (on the press, not the click: the strip's redrawn as it changes, and a click across a redraw is lost)
  el.addEventListener('mousedown', (e) => {
    e.stopPropagation(); e.preventDefault();
    const b = e.target.closest('[data-leg]');
    if (b && (e.button === 0 || e.button === 2)) change(Number(b.dataset.leg), e.button === 2 ? -1 : 1);
    else if (e.button === 0 && e.target.closest('.rp-pilot')) pilotToggle();
  });
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  document.body.appendChild(el);
}
let R0 = null;
function change(leg, by) {
  P().set(cycle(P().plan, leg, by), R0?.clock?.() ?? 0);
  if (plan.racing) netPlan(P().plan);
  plan.sig = '';
}
/** Each frame (race.js): the strip, shown on the line and in the race. */
export function planTick(R, show) {
  R0 = R;
  if (!plan.el) make();
  const on = show && sail.on && ['line', 'count', 'on'].includes(R.state);
  plan.el.hidden = !on;
  document.body.classList.toggle('planning', on);
  if (!on) return;
  const h = sail.helm, from = R.state === 'on' ? Math.max(0, Math.min(4, stretchOf(h.pose.r))) : 0, o = P().order;
  const now = !P().on ? 'The helm\'s yours' : P().taken ? 'Your moves, then the pilot' : R.state !== 'on' ? 'The pilot sails it from the gun' : o.kind === 'stop' ? o.stop.say : 'Under way';
  const legs = P().plan.map((id, leg) => ({ leg, id, o: optionOf(leg, id) })).filter((x) => x.leg >= from);
  const sig = `${now}|${P().on}|${legs.map((x) => x.id).join()}|${from}`;
  if (sig === plan.sig) return;
  plan.sig = sig;
  plan.el.innerHTML = `<div class="rp-head"><b>Your plan</b><button class="rp-pilot${P().on ? ' on' : ''}" title="T">Pilot ${P().on ? 'on' : 'off'}</button></div><div class="rp-now">${now}</div>`
    + legs.map((x) => `<button data-leg="${x.leg}" class="rp-leg${x.leg === from && R.state === 'on' ? ' now' : ''}" title="Click: the next choice · right click: back (${LEGS[x.leg].options.length} on this leg)"><i>Leg ${x.leg + 1}</i> ${x.o.name}<small>${x.o.puzzle}</small></button>`).join('')
    + '<div class="rp-help">Click a leg to change it</div>';
}
