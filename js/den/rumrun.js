// Helium's rum run (src/den-rumrun.ts: its steps, the stops, when Helium whistles; its lines src/lines/). Only
// what's drawn and played here: the barrels on her deck, a pile that shows, a barrel fewer at each stop; Helium
// aboard, stood as your spouse is (aboard.js), whistling past the Empire; each stop's little scene, its lines
// over each speaker's head and the barrels rolled ashore, left there; Mischievious on her jetty while there's
// rum coming. Touches the rest only through thin hooks: sailing.js builds, ticks and asks it (Space and Esc,
// the prompt, the run's goal), Helium's island (helium-isle.js: their casks, away on the run, quiet while it
// talks), Kikkit's (whirlpools.js: kikkitQuiet), Port Decorum's guards (imperial-isle.js: empireWatch,
// empireQuiet), Dignity's remark (dignity.js), and a starting point (menus.js, ?at=rumrun).
import {
  RUM_RUN, RUM_CAST, STOPS, RumRun, Whistle, Scene, AT_SEA, atStop, inSight, dropFor,
  askBeats, aboardBeats, stopBeats, notYetBeats, homeBeats, whistleBeats,
} from '../den-rumrun.js';
import { HELIUM_ARRIVE } from '../den-helium.js';
import { readSecs } from '../den-dignity.js';
import { Chatter } from '../chatter.js';
import { PIRATES } from '../den-look.js';
import { scene, V3, pirate, toast, burst, keys } from './world.js';
import { sail, seaX, seaZ, SLOOP_DECK } from './sea.js';
import { FURNITURE } from './furniture.js';
import { figure } from './wedding-scene.js';
import { person } from './props-people.js';
import { standAboard } from './aboard.js';
import { cine, cinePlay, cineEnd, bubble, bubbleAt } from './cine.js';
import { helium, heliumCasks, heliumShip, heliumAway, heliumQuiet, heliumStock } from './helium-isle.js';
import { kikkitQuiet } from './whirlpools.js';
import { empireWatch, empireQuiet } from './imperial-isle.js';
import { dignityRemark } from './dignity.js';

/* `run` the rules (RumRun); `deck` the barrels on her deck, `shown` how many of them are there just now (the
   bottom ones first as they're loaded, the top ones first ashore); `fig` Helium aboard; `her` Mischievious on
   her jetty; `ashore` the barrels left at the stops; `flying` barrels on their way; `talk` a few lines said at
   sea (Helium whistling), not a cutscene; `line` the line up over someone's head. */
export const rum = { run: new RumRun(), whistle: new Whistle(), deck: null, shown: 0, fig: null, her: null, ashore: [], flying: [], talk: null, line: null, bub: null, chat: null, heads: {}, watching: false, notYet: false, tune: 0, boarded: false };

const H = RUM_CAST.h;
const freshChat = () => new Chatter({ loop: AT_SEA }, { secs: readSecs, gap: [30, 55], wait: 25 });
rum.chat = freshChat();

/* The barrels on her deck, built once she's there: a spot each (RUM_CAST.deck), in her own frame. */
function build() {
  const g = sail.g;
  rum.deck = RUM_CAST.deck.map((p, i) => {
    const b = FURNITURE.barrel({ h: H }).g;
    b.position.set(p.x, SLOOP_DECK + p.y, p.z);
    b.rotation.y = i * 1.3;
    b.visible = false;
    g.add(b);
    return b;
  });
  rum.fig = figure(scene, PIRATES.Helium);
  rum.fig.g.visible = false;
  const M = RUM_CAST.her;
  rum.her = person({ look: PIRATES[M.look], parent: scene, x: seaX(M.at[0]), y: M.y, z: seaZ(M.at[1]), yaw: M.yaw, idle: 'wave', scale: 1.1 });
  rum.her.p.g.visible = false;
  rum.bub = bubble('', document.body, 'wrap');
}

// ---------- lines over heads ----------
const HEAD = { helium: 2.3, you: 2.25, mischievious: 2.55, kikkit: 2.6, guard: 2.25 };
/** Where whoever's talking is (a world point over their head), or null. */
function headOf(who) {
  const at = (g, up) => (g ? g.getWorldPosition(V3(0, 0, 0)).add(V3(0, up, 0)) : null);
  if (who === 'helium') return rum.boarded && rum.fig?.g.visible ? at(rum.fig.g, HEAD.helium) : at(rum.heads.helium, 2.55);
  if (who === 'you') return at(pirate.g, HEAD.you);
  if (who === 'mischievious') return at(rum.her?.p.g, HEAD.mischievious);
  if (who === 'kikkit') return at(rum.heads.kikkit, HEAD.kikkit);
  if (who === 'guard') return at(rum.heads.guard, HEAD.guard);
  return null;
}
/** A line over someone's head, up `secs` (or till the next). Dignity's own over hers (dignity.js). */
function speak(who, text, secs = readSecs(text)) {
  if (who === 'dignity') { dignityRemark(text); return; }
  rum.bub.textContent = text;
  rum.line = { who, until: performance.now() + secs * 1000 };
  if (who === 'helium' && /whoop/i.test(text)) rum.tune = secs;
}
function placeLine() {
  const el = rum.bub, L = rum.line;
  if (!el) return;
  const p = L && performance.now() < L.until && sail.on ? headOf(L.who) : null;
  if (!p) { el.style.display = 'none'; if (L && performance.now() >= L.until) rum.line = null; return; }
  bubbleAt(el, true, p.x, p.y, p.z);
  if (el.style.display === 'none') return;
  if (parseFloat(el.style.top) < 90) el.style.top = '90px';
  const half = el.offsetWidth / 2, x = parseFloat(el.style.left);
  if (Number.isFinite(x)) el.style.left = `${Math.max(half + 8, Math.min(innerWidth - half - 8, x))}px`;
}

// ---------- barrels on their way ----------
/** A barrel from `from` (a world point, or a function giving one as it sets off) to `to`, in an arc, tumbling,
    `wait` seconds from now; `go` as it sets off, `then` when it lands. */
function fly(from, to, wait, then, go = null) {
  const b = FURNITURE.barrel({ h: H }).g;
  b.visible = false;
  scene.add(b);
  rum.flying.push({ b, from, to: to.clone(), t: -wait, dur: 0, then, go });
  return b;
}
function flyTick(dt) {
  rum.flying = rum.flying.filter((f) => {
    f.t += dt;
    if (f.t < 0) return true;
    if (!f.dur) {
      f.go?.();
      f.from = typeof f.from === 'function' ? f.from() : f.from.clone();
      f.dur = 0.9 + f.from.distanceTo(f.to) * 0.04;
    }
    f.b.visible = true;
    const u = Math.min(1, f.t / f.dur);
    f.b.position.lerpVectors(f.from, f.to, u);
    f.b.position.y += Math.sin(u * Math.PI) * (1.2 + f.from.distanceTo(f.to) * 0.08);
    f.b.rotation.z = u * Math.PI * 2;
    if (u < 1) return true;
    f.b.rotation.z = 0;
    f.then?.(f.b);
    return false;
  });
}
/** Lands every barrel still on its way, at once (a scene skipped). */
function landAll() { for (const f of rum.flying) f.t = Math.max(f.t, 0); flyTick(0); for (const f of rum.flying) f.t = f.dur; flyTick(0); }
/** The `i`th deck spot, in the world. */
const deckAt = (i) => { sail.g.updateMatrixWorld(true); const p = RUM_CAST.deck[i]; return sail.g.localToWorld(V3(p.x, SLOOP_DECK + p.y + H / 2, p.z)); };
/** `n` barrels off her deck to a stop's spot, the top ones first, left there. */
function rollAshore(n, drop) {
  const x = seaX(drop.at[0]), z = seaZ(drop.at[1]), was = rum.ashore.length;
  // (each leaves her deck as it sets off: from wherever she's been brought alongside by then)
  for (let k = 0; k < n; k++) {
    const i = RUM_CAST.deck.length - rum.shown + k;
    if (i >= RUM_CAST.deck.length) break;
    const j = was + k, to = V3(x + ((k % 3) - 1) * 0.42, drop.y + H / 2, z + Math.floor(k / 3) * 0.42);
    rum.ashore.push(fly(() => deckAt(i), to, 0.3 + k * 0.4, (o) => {
      o.position.y = drop.y; o.rotation.y = j * 1.7;
      burst(V3(o.position.x, drop.y + 0.1, o.position.z), '#d8c49a', 6, 1.2);
    }, () => { rum.shown = Math.min(rum.shown, RUM_CAST.deck.length - i - 1); }));
  }
}
/** The barrels rolled aboard from their cask by the spout, bottom ones first. */
function rollAboard(from) {
  const N = RUM_CAST.deck.length;
  for (let k = 0; k < N; k++) {
    fly(from.clone().add(V3(0, 0.4, 0)), deckAt(N - 1 - k), k * 0.3, (o) => { scene.remove(o); rum.shown = Math.max(rum.shown, k + 1); });
  }
}

// ---------- scenes ----------
const settled = () => { const h = sail.helm; return sail.on && !cine && h.slot < 0 && !h.cur?.via && !h.gusts?.length && !h.rides?.length && !h.dazed(); };
/** A camera on her and somewhere ashore (world points), from out on the water behind her. */
function shotOf(ship, shore) {
  const look = ship.clone().lerp(shore, 0.5).add(V3(0, 1.2, 0)), d = Math.hypot(ship.x - shore.x, ship.z - shore.z);
  // (from up a little, off to one side, so her deck's in it: the barrels on it and whoever's aboard)
  return { look, dist: Math.max(11, d * 1.4 + 7), tilt: 0.75, yaw: Math.atan2(ship.x - shore.x, ship.z - shore.z) - 0.7 };
}
/** A little scene (cine.js): its lines in turn, Space on, Esc skips; `roll(n)` as a beat rolls barrels; `done`
    after, either way. `ship`: where she'll be (brought alongside), if not where she is. */
function play(beats, shore, roll, done, ship = sail.g.getWorldPosition(V3(0, 0, 0))) {
  const S = new Scene(beats), rolled = new Set();
  const rollOn = (b) => { if (b.roll && !rolled.has(b)) { rolled.add(b); roll(b.roll); } };
  rum.talk = null;
  const c = {
    cam: shotOf(ship, shore),
    key(k) { if (k === ' ' || k === 'enter') { S.goOn(); return true; } return false; },
    tick(dt) {
      const b = S.tick(dt);
      if (b) { speak(b.who, b.says, 99); rollOn(b); }
      if (S.done) cineEnd(false);
    },
    end(skip) {
      // (skipped: what it rolls rolled anyway, and landed)
      if (skip) { S.beats.forEach(rollOn); landAll(); }
      rum.line = null;
      done?.();
    },
  };
  keys.clear();
  cinePlay(c);
}
/** Helium asks you along, off their island. */
function ask() {
  rum.run.ask();
  rum.heads.helium = heliumQuiet(true);
  const shore = headOf('helium') ?? sail.g.getWorldPosition(V3(0, 0, 0));
  play(askBeats(), shore, () => {}, () => heliumQuiet(false));   // (the prompt says what next: rumPrompt)
}
/** Taken on: the casks off their pile, rolled aboard; them with them. */
function take() {
  if (!rum.run.take()) return;
  const from = heliumShip();
  rum.heads.helium = heliumQuiet(true);
  play(aboardBeats(), from, () => rollAboard(from), () => {
    landAll();
    rum.shown = RUM_RUN.LOAD;
    heliumQuiet(false);
    heliumAway(true);
    rum.boarded = true;
    burst(rum.fig.g.getWorldPosition(V3(0, 0, 0)).add(V3(0, 1, 0)), '#fff3c4', 12, 2);
    toast(`Helium's aboard with ${RUM_RUN.LOAD} barrels of rum`);   // (where to: the prompt, rumGoal)
  });
}
/** A stop: brought alongside, its barrels rolled ashore as its scene plays. */
function deliver(at) {
  const R = rum.run, how = at.how ?? null, n = R.deliver(at.id, how), drop = dropFor(at.id, how);
  if (!n) return;
  if (drop.moor) { if (sail.helm.oars) sail.helm.row(false); sail.helm.moor({ ...drop.moor }); sail.riding = false; }
  if (at.id === 'kikkit') rum.heads.kikkit = kikkitQuiet(true);
  if (how === 'quay') rum.heads.guard = empireQuiet(true);
  if (at.id === 'wedding') rum.her.setIdle('clap');
  const shore = V3(seaX(drop.at[0]), drop.y, seaZ(drop.at[1]));
  play(stopBeats(at.id, n, how), shore, (k) => rollAshore(k, drop), () => {
    kikkitQuiet(false); empireQuiet(false);
    if (at.id === 'wedding') rum.her.setIdle('sway');
    const where = STOPS.find((s) => s.id === at.id).name;
    toast(R.step === 'home' ? 'Every barrel delivered. Take Helium home' : `${n} barrel${n > 1 ? 's' : ''} ashore at ${where}`);
  }, drop.moor ? V3(seaX(drop.moor.c), 0, seaZ(drop.moor.r)) : undefined);
}
/** Home: they hop off, back on their island. */
function home() {
  if (!rum.run.home()) return;
  rum.heads.helium = heliumQuiet(false) ?? rum.heads.helium;
  const shore = (rum.heads.helium?.getWorldPosition(V3(0, 0, 0)) ?? sail.g.getWorldPosition(V3(0, 0, 0))).add(V3(0, 1.5, 0));
  play(homeBeats(), shore, () => {}, () => {
    rum.boarded = false;
    heliumAway(false);
    toast(`Helium's home. ${rum.run.delivered} barrels delivered this voyage`);
  });
}

// ---------- the hooks ----------
/** Space (or Enter) at sea: take the rum aboard, roll a stop's ashore, or drop Helium home. True if it was for the run. */
export function rumSpace() {
  if (!rum.deck || !settled()) return false;
  const p = sail.helm.pose, at = atStop(p.c, p.r), R = rum.run;
  if (!at) return false;
  if (at.id === 'helium' && R.step === 'asked') { take(); return true; }
  if (at.id === 'helium' && R.step === 'home') { home(); return true; }
  if (at.id !== 'helium' && R.open(at.id)) { deliver(at); return true; }
  return false;
}
/** Keys at sea (sailing.js): Space and Enter as above; Esc, off their island when they've asked, not now. */
export function rumKey(key) {
  if (key === ' ' || key === 'enter') return rumSpace();
  if (key !== 'escape' || rum.run.step !== 'asked' || !settled()) return false;
  const p = sail.helm.pose;
  if (atStop(p.c, p.r)?.id !== 'helium') return false;
  rum.run.decline();
  toast('Not now. Helium will ask again once you\'ve been back at the still');
  return true;
}
/** What's said at the foot of the screen at a stop, settled ('' elsewhere). */
export function rumPrompt() {
  if (!rum.deck || !settled()) return '';
  const p = sail.helm.pose, at = atStop(p.c, p.r), R = rum.run;
  if (!at) return '';
  if (at.id === 'helium') {
    if (R.step === 'asked') return `Off Helium's Island · Space: take their rum aboard (${RUM_RUN.LOAD} barrels) · Esc: not now`;
    if (R.step === 'home') return 'Off Helium\'s Island · Space: drop Helium home';
    return '';
  }
  if (!R.open(at.id)) return '';
  const n = R.barrelsFor(at.id), s = n > 1 ? 's' : '';
  if (at.id === 'wedding') return `Off the Wedding Isle · Space: roll Mischievious's rum ashore (${n} barrel${s})`;
  if (at.id === 'kikkit') return `Off Kikkit's island · Space: roll her barrel ashore`;
  if (at.how === 'cove') return `The smugglers' beach · Space: roll the rum up the beach, quietly (${n} barrel${s})`;
  return `Off Port Decorum's jetty · Space: land the rum under the guard's nose (${n} barrel${s})`;
}
/** The run's goal, ahead of the sea's own prompt ('' with no run). */
export const rumGoal = () => { const g = rum.run.goal(); return g ? `${g} · ` : ''; };

/** Each tick at sea (sailing.js). */
export function rumTick(dt) {
  if (!sail.g) return;
  if (!rum.deck) build();
  const R = rum.run, p = sail.helm.pose;
  if (helium.on) R.stilled();
  // Off their island, the casks filled, not at their still: they ask.
  if (settled() && !helium.on && !helium.play && atStop(p.c, p.r)?.id === 'helium' && R.canAsk(heliumCasks())) ask();
  // At Port Decorum too soon: said once a visit.
  const at = sail.on ? atStop(p.c, p.r) : null;
  if (at?.id === 'decorum' && R.step === 'run' && !R.open('decorum')) { if (!rum.notYet && !rum.talk && settled()) { rum.notYet = true; rum.talk = new Scene(notYetBeats()); } }
  else if (at?.id !== 'decorum') rum.notYet = false;
  // Past the Empire with rum aboard: Helium whistles, Dignity remarks, Port Decorum's guards watch her go by.
  const rumAboard = R.heliumAboard && R.aboard > 0, sight = sail.on ? inSight(p.c, p.r) : null;
  const w = rum.whistle.tick(dt, sight, rumAboard);
  if (w && !cine && !rum.talk) rum.talk = new Scene(whistleBeats(w, rum.whistle.n - 1));
  const watch = rumAboard && sight === 'decorum' && !cine;
  if (watch) empireWatch({ x: sail.g.position.x, z: sail.g.position.z });
  else if (rum.watching) empireWatch(null);
  rum.watching = watch;
  // A few lines at sea, not a cutscene.
  if (rum.talk && !cine) {
    const b = rum.talk.tick(dt);
    if (b) speak(b.who, b.says);
    if (rum.talk.done) rum.talk = null;
  }
  // Now and then, aboard, a line of theirs.
  if (R.heliumAboard && sail.on && !cine && !rum.talk) { const t = rum.chat.tick(dt, true); if (t) speak('helium', t); }
  draw(dt);
}
function draw(dt) {
  const R = rum.run;
  flyTick(dt);
  rum.deck.forEach((b, i) => { b.visible = !sail.struck && i >= RUM_CAST.deck.length - rum.shown; });
  // Helium aboard, stood as anyone aboard is; whistling, a hand to their mouth and a bob.
  const f = rum.fig;
  if (rum.boarded) {
    if (f.g.parent !== sail.g) burst(V3(sail.g.position.x, SLOOP_DECK + 1, sail.g.position.z), '#fff3c4', 10, 2);
    standAboard(f, RUM_CAST.aboard, dt);
    if ((rum.tune -= dt) > 0) {
      const t = performance.now() / 1000;
      f.arms[1].rotation.set(-2.5, 0, -0.5);
      f.g.position.y += Math.abs(Math.sin(t * 7)) * 0.04;
      f.g.rotation.y += Math.sin(t * 3) * 0.2;
    }
  } else if (f.g.visible || f.g.parent === sail.g) { f.g.visible = false; scene.add(f.g); }
  // Mischievious on her jetty, once there's rum on its way: waving it in, then by her barrels.
  const her = rum.her, show = R.step === 'run' || R.step === 'home' || R.done.includes('wedding');
  her.p.g.visible = show;
  if (show) {
    her.lookAt = sail.g.visible ? { x: sail.g.position.x, z: sail.g.position.z } : null;
    her.tick(dt);
  }
  placeLine();
}

/** A fresh voyage: no run, Helium home, the barrels gone from her deck and the stops. */
export function rumReset() {
  if (rum.flying.length) landAll();
  for (const b of rum.ashore) scene.remove(b);
  Object.assign(rum, { run: new RumRun(), whistle: new Whistle(), shown: 0, ashore: [], flying: [], talk: null, line: null, chat: freshChat(), notYet: false, tune: 0, boarded: false });
  if (rum.watching) empireWatch(null);
  rum.watching = false;
  heliumAway(false);
}

/** A starting point (menus.js, ?at=rumrun): their lesson seen, a few casks filled, and her come up off their
    island, so they ask you along. */
export function rumCheat() {
  rumReset();
  heliumStock(RUM_RUN.CASKS);
  sail.helm.moor({ ...HELIUM_ARRIVE });
  sail.riding = false;
}
