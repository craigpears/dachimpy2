/* Pirate Den: the Sailing puzzle played at sea, and what its chains do to her (TODO.md, "The Sailing
   puzzle, for Kikkit's quest", 10 Nov: "You should be able to jump into the sailing puzzle whenever
   you want to, and that gives you, like the doubles ... it allows you to basically go really, really
   fast, and like in one go, like a trade winds, kind of, just jump multiple tiles"). TypeScript,
   compiled to js/den-sailing.js; tested in tests/den-sailing.test.ts. The puzzle is src/sailing.ts
   (its run, runFor, is what a drop's chain is worth in squares); js/den/sail-station.js plays it.

   A drop's run carries her that many squares straight ahead, the way she's heading, in one go: a
   gust, played as the trade winds play their squares (Helm.gust: SAIL.PUSH seconds a square), after
   the move she's on. She stops short of anything her other moves are stopped by (rocks, the cliffs,
   land, off the board) and of a lock (its gates are shut to a gust; she goes up and down the canal
   by its locks), and of water at another level (the canal above the sea). Ending on a trade wind's
   lane, the wind takes her on from there.

   Through the imperial checkpoint's gate it carries her (11 Nov; till then it stopped short of it): a
   big chain is what gets her through its guns, a gust's squares gone before a shot's down, as it zooms
   her over the whirlpools and the winds (the user: "It does not help you get through a checkpoint. The
   only thing that will do that is obviously the big sailing boost, but same with the whirlpools and the
   wind barriers is to just zoom over those"). Where it ends, on a gun's mark, she's hit as ever: a
   small chain into the guns is a hit, a big one past them isn't (src/den-checkpoint.ts).

   And of the way through the whirlpools (Sea.passage: Kikkit's whirlpools, their winds, the gap in
   the reef), unless she starts the gust at one of its mouths, facing into it (Sea.mouths). The user
   (11 Nov), sailing with the board open by Tzz's island: "somehow I have ended up over near Dignity
   ... I don't know how I managed to just make a mishap near the Whirlpools. Something got clipped",
   and "this is supposed to be a secret way round". A chain heading out to sea past Kikkit's island
   had carried her over the winds that feed the whirlpools, through the reef with them, and out the
   other side. Now the whirlpools are a way through only when you sail into them on purpose: up to
   the mouth, then the chain (as Kikkit tells it), or your own moves onto their winds.

   And of a wind only the oars beat (a WindZone's `oars`), heading into it: Helium's corner's way in (14
   Nov: "you have to do a 90-degree turn by rowing ... I think that should be the only way"), so no chain
   carries her in where the sails can't. */

import { path, type Helm, type Pose, type Sea } from './den-sail.js';
import { chainName, runFor, RUN } from './sailing.js';
import { against, zoneAir } from './den-wind.js';

/** The squares a gust of `n` takes her, from `from` straight ahead, a pose each; short of the first
    square she can't go to (and none if it's the first). From a wind gap's mouth, lined up first and
    carried over it (lineUp). */
export function gustPath(sea: Sea, from: Pose, n: number): Pose[] {
  return lineUp(sea, from, n) ?? straight(sea, from, n);
}

/* A wind gap's mouth (the race's Double's and Triple's gaps, and the zigzag's headwinds: LAY.RACE.LINEUPS).
   The user, 12 Nov: "some of these wind shortcuts, it's a bit awkward to set the ship up to get through
   them." Before, she had to stop on the one square in front of the gap, facing through it, and only then
   break her combo: a square short, or facing along the leg, and the gust took her along the leg or onto
   the gap's wind, which blew her back. Now a gust big enough for the hop, broken anywhere in its mouth (a
   leg's two rows, a column either side; a square behind a zigzag's headwind as well as right behind it),
   swings her onto that square, lined up, and carries her on over from there. Only when it carries her
   clean over (all its squares on, ending clear of any wind or whirlpool): a bigger gust that would land
   her in the left-hand trade wind beyond goes straight on as ever. The lining up is free, as a turn
   into the wind's own lane is: the puzzle's the challenge, not the steering. */
/** From a wind gap's mouth with a gust big enough to hop it: the squares lining her up, then the gust's
    `n` on over from there; null if she's not in one, or it wouldn't carry her clean over. */
export function lineUp(sea: Sea, from: Pose, n: number): Pose[] | null {
  for (const L of sea.lineups) {
    if (n < L.need || (L.facing && from.d !== L.start.d) || !L.from.some(([c, r]) => c === from.c && r === from.r)) continue;
    // (along her row to its column, then along the column to it, facing the way she goes; then turned
    // to face through)
    const pre: Pose[] = [], S = L.start;
    let { c, r } = from;
    while (c !== S.c) { c += Math.sign(S.c - c); pre.push({ c, r, d: S.c > from.c ? 1 : 3 }); }
    while (r !== S.r) { r += Math.sign(S.r - r); pre.push({ c, r, d: S.r > from.r ? 0 : 2 }); }
    if (pre.some((p) => !sea.open(p.c, p.r) || sea.isLock(p.c, p.r) || sea.level(p.c, p.r) !== sea.level(from.c, from.r))) continue;
    if (pre.length) pre[pre.length - 1] = { ...S };
    else if (from.d !== S.d) pre.push({ ...S });
    const on = straight(sea, S, n), end = on[on.length - 1];
    if (on.length < n || sea.windAt(end.c, end.r) !== undefined || sea.whirlAt(end.c, end.r)) continue;
    return [...pre, ...on];
  }
  return null;
}

function straight(sea: Sea, from: Pose, n: number): Pose[] {
  const out: Pose[] = [], level = sea.level(from.c, from.r);
  if (sea.isLock(from.c, from.r)) return out;
  const key = (c: number, r: number) => `${c},${r}`;
  // (on purpose: from a mouth of the way through the whirlpools, facing into it, or in it already)
  const meant = sea.passage.has(key(from.c, from.r)) || sea.mouths.some((m) => m.c === from.c && m.r === from.r && m.d === from.d);
  let at = from;
  for (let i = 0; i < n; i++) {
    const to = path(at, 'F').to, whirl = sea.whirlAt(to.c, to.r), pocket = sea.pockets.has(key(to.c, to.r));
    if (!meant && (sea.passage.has(key(to.c, to.r)) || sea.reef.has(key(to.c, to.r)))) break;
    // (Into the way through on purpose: a gust carries her clean over its whirlpools, as the token
    // moves do in Puzzle Pirates, and they have her only if it ends on one (src/den-whirl.ts). And into
    // the penguins' water, but only a Vegas's: src/den-kikkit.ts)
    if (!whirl && !pocket && (!sea.open(to.c, to.r) || sea.isLock(to.c, to.r) || sea.level(to.c, to.r) !== level)) break;
    if (pocket && n < runFor(RUN.VEGAS)) break;
    // (and of a wind only the oars beat, heading into it: Helium's corner's way in, 14 Nov)
    const z = sea.zoneAt(to.c, to.r);
    if (z?.oars && against(to.d, zoneAir(z))) break;
    out.push(to);
    at = to;
  }
  return out;
}

/** What a drop's run did: the squares it was worth, the squares she goes, and why short, if she is
    ('held': holed, or waiting on a lock, so no gust at all; 'short': something in the way). */
export interface Carried { run: number; went: number; why: 'held' | 'short' | null; squares: Pose[] }

/** A drop's run, given to her: a gust of that many squares straight ahead (gustPath), from where
    she'll be once the move she's on (and any gust already blowing) is done. */
export function carry(h: Helm, run: number): Carried {
  if (run <= 0) return { run, went: 0, why: null, squares: [] };
  if (!h.gusty()) return { run, went: 0, why: 'held', squares: [] };
  const squares = gustPath(h.sea, h.gustFrom(), run);
  h.gust(squares);
  return { run, went: squares.length, why: squares.length < run ? 'short' : null, squares };
}

const squares = (n: number) => (n === 1 ? 'a square' : `${n} squares`);
/** What's said of a drop's run: its chain by name, and how far the wind carried her. */
export function carrySay(steps: number, c: Carried): string {
  const name = chainName(steps).replace(/!+$/, '');
  const what = name ? `A ${name}!` : 'A clear!';
  if (c.why === 'held') return `${what} But she's held up: no wind can carry her just now`;
  if (!c.went) return `${what} But there's no sea ahead of her to run`;
  if (c.why === 'short') return `${what} The wind carries her ${squares(c.went)}, as far as she can go`;
  return `${what} The wind carries her ${squares(c.went)}`;
}

/* Doing well shows, as it does in Puzzle Pirates (the user, 11 Nov, "very important"): a sparkly
   indicator, and sparkly full sails. The bigger the chain the more show: a Double a little glitter on
   her sails, a Vegas her sails billowing full with sparkles streaming off them and a whoosh. It lasts
   a while after the chain, while the gust carries her and a few seconds more, then fades. And on the
   board a sparkle meter fills with how well you're sailing: each chain adds to it, more for a bigger
   one, a booch knocks most of it out, and it drains slowly with time, so it shows how you've been
   sailing lately. js/den/sail-station.js draws it, on her (js/den/sea.js's sails) and the board. */
export const SPARKLE = {
  /** The show a chain puts on, by its steps: a glint for a plain clear (the user, 14 Nov: "when you see ... Kikkit
      complete a single or a double ... you should visibly see the jump, the ship sparkle even a tiny bit"), a
      little glitter for a Double, everything for a Vegas. */
  BY_STEPS: [0, 0.12, 0.25, 0.45, 0.62, 0.8, 1] as readonly number[],
  /** Seconds it stays at its height after the gust's spent, then the seconds it takes to fade away. */
  HOLD: 3,
  FADE: 5,
  /** The show at which her sails billow full and the whoosh goes off (a Vegas). */
  FULL: 1,
  /** What a chain adds to the meter, by its steps (a plain clear a sliver), and the meter's drain a
      second; a booch keeps this much of it. */
  METER_BY_STEPS: [0, 0.02, 0.1, 0.18, 0.26, 0.34, 0.45] as readonly number[],
  METER_DRAIN: 1 / 90,
  BOOCH_KEEPS: 0.3,
};
const bySteps = (t: readonly number[], steps: number) => t[Math.max(0, Math.min(t.length - 1, Math.floor(steps)))];

/** A gust's surge on her, seen as it takes her (14 Nov: "you should visibly see the jump ... and start moving
    faster. There's no impact visible at the moment"): her bow lifting and a burst of spray, bigger with a bigger
    chain, easing off over `EASE` seconds. Any racer's sloop, yours or a rival's (race-field.js, boatGusts). */
export const SURGE = {
  /** How big, by the chain's steps (0 to 1): a plain clear already a clear lift. */
  BY_STEPS: [0, 0.4, 0.55, 0.7, 0.8, 0.9, 1] as readonly number[],
  /** Seconds it takes to ease off. */
  EASE: 0.9,
  /** Her bow's lift at its biggest (radians), and the spray's puffs. */
  PITCH: 0.09,
  SPRAY: 14,
} as const;
/** The surge a gust of a chain of `steps` puts on her (0 to 1), none when it carries her nowhere. */
export const surgeFor = (steps: number, went = 1): number => (went > 0 ? bySteps(SURGE.BY_STEPS, steps) : 0);
/** The show a chain of `steps` puts on (0 to 1). */
export const sparkleFor = (steps: number): number => bySteps(SPARKLE.BY_STEPS, steps);

/** The sparkle: the show on her now, and the meter of how well you're sailing. */
export class Sparkle {
  /** The show on her sails now, 0 to 1. */
  level = 0;
  /** The meter, 0 to 1. */
  meter = 0;
  /** Seconds before the show starts to fade. */
  hold = 0;

  /** A drop's chain (`steps`), and the squares its gust carries her (`went`): the show goes up to
      the chain's, if that's more, and holds while the gust blows, a square every `push` seconds. */
  chain(steps: number, went = 0, push = 0.28): void {
    const s = sparkleFor(steps);
    if (s > 0) {
      this.level = Math.max(this.level, s);
      this.hold = Math.max(this.hold, went * push + SPARKLE.HOLD);
    }
    this.meter = Math.min(1, this.meter + bySteps(SPARKLE.METER_BY_STEPS, steps));
  }
  /** A booch: the show's gone, and most of the meter. */
  booch(): void { this.level = 0; this.hold = 0; this.meter *= SPARKLE.BOOCH_KEEPS; }
  /** Time going by: the show holds, then fades; the meter drains. */
  tick(dt: number): void {
    const held = Math.min(dt, this.hold);
    this.hold -= held;
    this.level = Math.max(0, this.level - (dt - held) / SPARKLE.FADE);
    this.meter = Math.max(0, this.meter - dt * SPARKLE.METER_DRAIN);
  }
  /** Her sails billowing full (a Vegas's show, while it lasts). */
  full(): boolean { return this.level >= SPARKLE.FULL - 1e-9; }
}

/* Her sails' billow, by the show on them (0 to 1), on top of what the wind does to them. Seen from the
   usual camera at sea, behind her and above, her square sails face you, so a deeper belly alone (out
   toward her bow, away from you) hardly showed (11 Nov, when it was built: a Vegas's billow "barely
   shows" from behind her). So they swell too, wider and taller, which reads from anywhere; their
   bellies deepen as well, which from above curves their feet; and they're squared across her, the
   gust right behind her, so from behind her they face you full on (braced round, as the wind or
   her moorings have them, they were seen at a slant). (Their feet blown forward was tried: seen
   from above and behind, that tips the cloth away from you, and they look smaller.) */
export const BILLOW = {
  /** At a Vegas: how much wider and taller they swell (1 is their own size)... */
  WIDE: 0.3,
  TALL: 0.2,
  /** ...and how much fuller than the best a wind fills them (FULL_WIND) their belly gets, whatever
      the wind (in a calm too). */
  BELLY: 0.8,
  FULL_WIND: 1.25,
};
export interface Billow { wide: number; tall: number; fill: number; square: number }
/** Her sails' billow for a show of `level`: their width and height (times their own), the least
    fullness of their belly (0: the wind's alone), and how far they're squared across her (0: as the
    wind has them braced, 1: square). */
export function billow(level: number): Billow {
  const l = Math.max(0, Math.min(1, level || 0));
  return { wide: 1 + BILLOW.WIDE * l, tall: 1 + BILLOW.TALL * l, fill: l > 0 ? BILLOW.FULL_WIND * (1 + BILLOW.BELLY * l) : 0, square: l };
}
