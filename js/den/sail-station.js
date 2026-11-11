// The Sailing board at sea (1: Sailing, never "the rigging", 11 Nov): played whenever you like, and what its chains do to
// her, each drop's run a gust carrying her straight ahead in one go. (The rules: src/sailing.ts, the
// puzzle; src/sail-pair.ts, its pair as it falls; src/den-sailing.ts, a run given to her. The look:
// js/den/sail-board.js. js/den/sailing.js wires it in with a few hooks, as js/den/rowing.js does the
// oars.)
import * as THREE from 'three';
import { Sailing } from '../sailing.js';
import { SailPair } from '../sail-pair.js';
import { carry, carrySay, Sparkle } from '../den-sailing.js';
import { SAIL } from '../den-sail.js';
import { sparkleTick, sparkleWhoosh } from './sail-sparkle.js';
import { camera, keys, toast, $ } from './world.js';
import { sail } from './sea.js';
import { sailBoardMake, sailBoardLayout, sailBoardLay, sailBoardDrop, sailBoardBusy, sailBoardTick, sailBoardSnap } from './sail-board.js';

/* TODO.md, "The Sailing puzzle, for Kikkit's quest" (10 Nov): "You should be able to jump into the
   sailing puzzle whenever you want to, and that gives you, like the doubles ... it allows you to
   basically go really, really fast, and like in one go, like a trade winds, kind of, just jump
   multiple tiles." Like Carpentry for her deck, Bilge at the locks and 3 for the oars: 1 opens the
   board anywhere at sea (the puzzles in one bank, 11 Nov: 1 Sailing, 2 Gunnery, 3 the oars), 1 or Esc
   shuts it, and while it's open its keys take over, the real game's (11 Nov): ← → (A D) move the
   pair, ↑ (W, E) turns it clockwise and ↓ (S, Q) back, Space speeds its fall, a tap a burst and held
   for as long as it's held (src/sail-pair.ts: rush, ease); no key drops it. Each drop's chain is a run
   (runFor: a plain clear a square, a Double two ... a Vegas seven), given to her once its pops have
   played out: a gust straight ahead, the way she's heading, after the move she's on. She keeps
   sailing for the pin meanwhile, and the board's put away while something else has her (holed, at a
   lock's pump, hauling treasure, up in the lagoon) and comes back after. One board a voyage, kept
   while it's shut. */
export const station = { on: false, want: false, game: null, pair: null, B: null, run: null, layout: null, lowT: 0, low: 0, top: 0, sparkle: new Sparkle(), easy: false, kept: {} };
const fresh = () => new Sailing(Math.random, true, { easy: station.easy });

/* Kikkit's whirlpools have a board of their own, an easy one (the user, 11 Nov: "relatively small,
   easy platforms"): in her waters (whirlpools.js says when) it's that one, and out of them the sea's own
   again, each kept as you left it. Swapped only between drops. */
export function stationBoard(easy) {
  if (!!easy === station.easy || station.run || (station.B && sailBoardBusy(station.B))) return;
  station.kept[station.easy ? 'easy' : 'sea'] = { game: station.game, pair: station.pair };
  station.easy = !!easy;
  const k = station.kept[station.easy ? 'easy' : 'sea'];
  station.game = k?.game ?? null; station.pair = k?.pair ?? null;
  if (station.on) {
    station.game ||= fresh();
    station.pair ||= new SailPair(station.game);
    sailBoardLay(station.B, station.game);
    sailBoardSnap(station.B);
  }
}

function pad(act, col) {
  if (!station.on) return;
  if (act === 'close') return stationToggle();
  // (the pad's Faster, held as Space is)
  if (act === 'slow') { station.padFast = false; station.pair?.ease(); return; }
  if (act === 'fast') station.padFast = true;
  play(act, col);
}
function show() {
  station.B ||= sailBoardMake(pad);
  sailBoardLay(station.B, station.game);
  sailBoardSnap(station.B);
  station.B.el.style.display = '';
  station.on = true;
  station.lowT = 0;
  document.body.classList.add('sailboard');
  keys.clear();
  if (!station.told) { station.told = true; toast('Sailing! Clear a chain and the wind carries her that many squares ahead: a Vegas, seven'); }
}
function hide() {
  station.on = false;
  document.body.classList.remove('sailboard');
  if (station.B) station.B.el.style.display = 'none';
}

/** 1 at sea: the board out, or put away. `blocked`: something else has her just now. */
export function stationToggle(blocked = false) {
  if (station.want) { station.want = false; hide(); return; }
  if (blocked) { toast('Not just now: she\'s busy', true); return; }
  station.want = true;
}
/** A fresh voyage: the board put away, and a fresh one next time. */
export function stationReset() {
  station.want = false;
  hide();
  station.game = null; station.pair = null; station.run = null;
  station.sparkle = new Sparkle();
  station.easy = false; station.kept = {};
}

// The pair's moves, by key or pad; none while a drop's still playing out.
function play(act, col) {
  const P = station.pair;
  if (!P || sailBoardBusy(station.B) || station.run) return;
  if (act === 'left') P.slide(-1);
  else if (act === 'right') P.slide(1);
  else if (act === 'turnR') P.turnBy(1);
  else if (act === 'turnL') P.turnBy(-1);
  else if (act === 'fast') P.rush();
  else if (act === 'col') { const d = col < P.col ? -1 : 1; while (P.col !== col && P.slide(d)); }
}
function landed(res) {
  if (!res.dropped) return;
  sailBoardDrop(station.B, res, station.game);
  sailBoardSnap(station.B);
  station.run = res;
}

/** The board's keys, while it's open (Sailing's own, as the real game's: YPPedia's Sailing, Controls):
    true if it took the key. 2 and 3 put it away and go on to her guns or oars. Space speeds the pair
    while it's held (in `keys` till its keyup: stationTick lets it go); its key repeat never gets here. */
export function stationKey(key) {
  if (!station.on) return false;
  if (key === '1' || key === 'escape') { stationToggle(); return true; }
  if (key === '2' || key === '3') { stationToggle(); return false; }
  if (key === 'enter') return true;   // (nothing: it used to drop the pair)
  const act = { a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right', w: 'turnL', arrowup: 'turnL', e: 'turnR', s: 'turnR', arrowdown: 'turnR', q: 'turnL', ' ': 'fast' }[key];
  if (!act) return false;
  if (act === 'fast') keys.add(' ');
  play(act);
  return true;
}

export function stationTick(dt, blocked = false) {
  // Doing well shows: on her sails, whether the board's open or not, fading as the gust's spent.
  station.sparkle.tick(dt);
  sparkleTick(sail.g, station.sparkle, dt);
  const want = station.want && sail.on && !blocked;
  if (want !== station.on) {
    if (want) {
      station.game ||= fresh();
      station.pair ||= new SailPair(station.game);
      show();
    } else hide();
  }
  if (!station.on) return;
  const B = station.B;
  // Where it goes: clear of the prompt at the bottom and the den's panel at the top (measured now
  // and then: they change as you go).
  if ((station.lowT -= dt) <= 0) { station.lowT = 0.5; station.low = $('dock').getBoundingClientRect().top; station.top = document.querySelector('.hud')?.getBoundingClientRect().bottom ?? 0; }
  station.layout = sailBoardLayout(B, station.low || innerHeight, station.top);
  // A drop's pops played out: its run's given to her.
  if (station.run && !sailBoardBusy(B)) {
    const res = station.run;
    station.run = null;
    if (res.booched) station.sparkle.booch();
    if (res.run > 0) {
      const c = carry(sail.helm, res.run);
      toast(carrySay(res.steps, c));
      station.sparkle.chain(res.steps, c.went, SAIL.PUSH);
      if (station.sparkle.full()) sparkleWhoosh(sail.g);
    }
  }
  const busy = sailBoardBusy(B) || !!station.run;
  if (!keys.has(' ') && !station.padFast) station.pair.ease();   // (Space let go)
  if (!busy) { const res = station.pair.tick(dt); if (res) landed(res); }
  sailBoardTick(B, dt, busy ? null : station.pair, station.sparkle);
}

export function stationPrompt() {
  return 'Sailing · ← → move · ↑ ↓ turn · Space: faster · a chain carries her ahead · 1 or Esc: back to the helm';
}

/* The camera while the board's open: the sea view as ever, slid so she sits in the part of the
   screen the board leaves (to its right on a wide screen, above it on a tall one). What to take off
   the camera's look point, given its yaw, tilt and distance. */
const shift = new THREE.Vector3();
export function stationShift(yaw, tilt, dist) {
  const F = station.layout?.free;
  if (!station.on || !F) return null;
  const nx = ((F.x + F.w / 2) / innerWidth) * 2 - 1, ny = 1 - ((F.y + F.h * 0.55) / innerHeight) * 2;
  const vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect);
  const a = nx * dist * Math.tan(hh), b = ny * dist * Math.tan(vh) / Math.max(0.3, Math.sin(tilt));
  return shift.set(Math.cos(yaw) * a - Math.sin(yaw) * b, 0, -Math.sin(yaw) * a - Math.cos(yaw) * b);
}
