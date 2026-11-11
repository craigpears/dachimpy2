/* Pirate Den: Port Decorum, the island under imperial control. TypeScript, compiled to
   js/den-imperial.js; tested in tests/den-imperial.test.ts. js/den/imperial-isle.js draws it and places
   who's on it from EMPIRE_CAST (below), plain data; its squares are LAY.EMPIRE in src/den-sail.ts (with
   every other island's, as the sea lays them), its guards' lines src/lines/imperial-guards.ts.

   The user (11 Nov): "start sketching out even just like, even if it's just an empty island or something
   where you can't interact yet, is just some island that's, say, under imperial control. So, you know, I
   guess you could naturally run into [Dignity] again there or something. But, you know, to create
   trading mechanics, looting mechanics, smuggling mechanics, all that kind of stuff. Just proof of
   concepts around those things ... that can certainly be the place for a few more puzzles."

   So, for now, a place to sail up to and look at, nothing to do there: an imperial port town, its fort,
   its harbour and jetty (where trading will happen), a customs house, a market, a warehouse, and its
   guards. Where the main shipping lane leads, straight out past the checkpoint's gate: the checkpoint
   guards the way to it. The first time on a voyage you come up off it, the status line says whose it
   is; the guard on the jetty hails you and grumbles on while you're within earshot. */

import { LAY } from './den-sail.js';
import { shoreOf } from './den-isle.js';
import { smugglersAt } from './den-smugglers.js';
import { HALT, GRUMBLES } from './lines/imperial-guards.js';
import type { Script } from './chatter.js';

const E = LAY.EMPIRE;
export const EMPIRE = {
  /** Its name: said as you come up, never on the captain's map (one point of interest there, unnamed:
      src/den-map.ts). */
  NAME: 'Port Decorum',
  /** Within earshot of the guard on the jetty: squares from where he stands. */
  EARSHOT: 4,
} as const;

const key = (c: number, r: number) => `${c},${r}`;
const land = new Set(E.LAND.map(([c, r]) => key(c, r)));
/** Its squares (the jetty's among them). */
export const empireAt = (c: number, r: number): boolean => land.has(key(c, r));
/** The water round it, every square beside it (diagonally too): off its shore, where you're told whose it is.
    Not the rocks shutting off its back, nor the smugglers' water behind them (src/den-smugglers.ts). */
export function onEmpireLanding(c: number, r: number): boolean {
  return !empireAt(c, r) && !smugglersAt(c, r) && E.LAND.some(([x, y]) => Math.abs(x - c) <= 1 && Math.abs(y - r) <= 1);
}
/** Its shore, for the 3D and the captain's map (src/den-isle.ts, shoreOf): round its land but the jetty,
    which stands out from it on piles. */
export const empireShore = (): [number, number][] => shoreOf(E.LAND.filter(([c, r]) => c !== E.JETTY[0] || r !== E.JETTY[1]));

/** Where the guard who talks stands: on the jetty's end. */
export const EMPIRE_STANDS = { c: E.JETTY[0], r: E.JETTY[1] - 0.3 } as const;
export const inEmpireEarshot = (c: number, r: number): boolean => Math.hypot(c - EMPIRE_STANDS.c, r - EMPIRE_STANDS.r) <= EMPIRE.EARSHOT;

/** Where a starting point (?at=imperial) puts her: just off the jetty's end, bows to the island. */
export const EMPIRE_OFF = { c: E.JETTY[0] - 1, r: E.JETTY[1] - 1, d: 0 } as const;

/** Coming up off it: whose it is is said once a voyage, the first time. */
export class Sighting {
  seen = false;
  /** Each tick: off its shore (`off`), free to hear it (`free`: nothing else playing). True the first time. */
  arrive(off: boolean, free: boolean): boolean {
    if (!off || !free || this.seen) return false;
    this.seen = true;
    return true;
  }
}

/** The jetty guard: halts you, then grumbles on, round and round, while you're within earshot (src/chatter.ts). */
export const EMPIRE_SAYS: Script = { intro: [HALT], loop: GRUMBLES };

/** The Empire's uniform, from the wardrobe (js/den-look.js): a black tricorne, a Captain's jacket in
    maroon (the checkpoint's crimson) faced gold, white breeches, black boots, a pistol. Each guard is this
    with a face of their own. */
export const UNIFORM = {
  patch: false, earring: false, smile: false,
  hat: 'tricorne', hatCol: 'black', top: 'captain', topCol: 'maroon', topCol2: 'gold', waist: 'belt', waistCol: 'white',
  legs: 'pants', legsCol: 'white', feet: 'boots', feetCol: 'black', hand: 'pistol', fam: 'none',
} as const;

/** A guard: their face (`face`: body, skin, hair, beard), on the island at `at` (squares, as the sloop's sea),
    turned `yaw` (radians, as the den's figures: 0 out to sea, pi toward the den), standing `idle`. `talks`:
    the one on the jetty, whose lines are EMPIRE_SAYS. */
export interface Guard { face: Record<string, string | number>; at: [number, number]; yaw: number; idle: string; talks?: boolean }

/** What's on the island, placed (a character is only config: RULES.md). js/den/imperial-isle.js builds
    each kind of building and puts the guards there through the shared pieces (props-people.js's person()).
    Squares on the sloop's sea (`at`: [c, r]); `yaw` the way a thing faces. */
export const EMPIRE_CAST = {
  guards: [
    { face: { body: 'm', skin: 1, hair: 'short', hairCol: 'brown', beard: 'moustache' }, at: [EMPIRE_STANDS.c, EMPIRE_STANDS.r], yaw: Math.PI, idle: 'stand', talks: true },
    { face: { body: 'f', skin: 3, hair: 'bun', hairCol: 'black', beard: 'none' }, at: [11.95, 29.15], yaw: Math.PI, idle: 'stand' },
    { face: { body: 'm', skin: 4, hair: 'short', hairCol: 'black', beard: 'none' }, at: [12.85, 29.15], yaw: Math.PI, idle: 'stand' },
    { face: { body: 'm', skin: 0, hair: 'short', hairCol: 'ginger', beard: 'goatee' }, at: [14.1, 28.3], yaw: Math.PI - 0.5, idle: 'sway' },
    { face: { body: 'f', skin: 2, hair: 'ponytail', hairCol: 'blonde', beard: 'none' }, at: [10.1, 29.25], yaw: Math.PI + 0.6, idle: 'sway' },
  ] as Guard[],
  /** Its buildings: the fort at the back, its keep flying the Empire's flag; a watchtower on the left;
      along the quay, the customs house at the jetty's foot, the market (the trading house) and the
      warehouse. `w`, `d`: across and deep, in squares. To scale with the sloop (11 Nov; the heights in
      js/den/imperial-isle.js, FORT): the fort fills the back of the island, 12 m by 7.4 inside its
      corner towers, the guards at its gate; the town between it and the quay. */
  town: [
    { kind: 'fort', at: [12.4, 30.35], w: 3, d: 1.85 },
    { kind: 'watchtower', at: [10, 30.1] },
    { kind: 'customs', at: [11.55, 28.65], w: 1, d: 0.7 },
    { kind: 'market', at: [13.2, 28.7], w: 0.85, d: 0.6 },
    { kind: 'warehouse', at: [14.85, 29.7], w: 0.75, d: 1.25 },
  ] as { kind: string; at: [number, number]; w?: number; d?: number }[],
  /** The stone quay along its near shore, from the jetty's foot along to the warehouse (squares across,
      and how far out its face is). */
  quay: { c0: 10.75, c1: 14.4, r: 27.62 },
  /** Cargo on the quay: crates and barrels. */
  cargo: [[12.2, 28.15], [12.45, 28.25], [14.3, 28.6], [14.4, 28.9], [10.95, 28.35]] as [number, number][],
  palms: [[15.2, 30.75], [9.75, 29.6], [15.35, 29.15]] as [number, number][],
} as const;
