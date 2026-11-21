/* Pirate Den: Jezerbell's house, a manor in the den's housing district (src/den-houses.ts). TypeScript, compiled to
   js/den-jezerbell.js; tested in tests/den-jezerbell.test.ts. js/den/jezerbell-house.js plays it in the house shell
   (js/den/house.js): her room furnished from the shared furniture (js/den/furniture/) where FURNISH says, her
   portraits where PORTRAITS says, her octopuses hidden where OCTOPUSES says, and the werewolf fray at her summoning
   stump, each duel a real Swordfight duel (src/swordfight.ts's Duel, its bots src/sword-bots.ts) drawn by
   js/sword-duel-board.js. Her lines are in src/lines/jezerbell.ts.

   Jezerbell, a real pirate (pirate name only), from the user's chat log and a screenshot of her house (21 Nov): she
   runs werewolf dens and vampire lairs, beginner ones so new crew get a shot, "she eats WW for breakfast"; her house
   has a summoning stump for werewolves (and an altar for vampires, left out here: one summoning to a house, the user,
   21 Nov), where a charm summons a fray right there; she hides
   her octopus familiars so nobody asks for them. The user: "there's definitely some good material there for Jezebel
   in her house, like the hidden octopus ... especially if you start going looking for her familiar octopus, the
   werewolf for it" (the card, houses/jezerbells-house-her-hidden-octopuses-and-the-we).

   So: her room as in the screenshot; her octopuses hidden about it, found one at a time; one missing, taken by the
   werewolves; Space at the stump uses a charm, and the pack bursts in. As Puzzle Pirates' fray: you and she against
   the pack, each of you dueling a wolf at a time, the next wolf on you when yours is down; she beats one every so
   often on her own; win, and the missing octopus is back, and one of you is given a Wolf-skull Wayfinder (in Puzzle
   Pirates, a compass that, on a small ship's chart table, takes her to the werewolves' ship, and past it their den on
   Woodhallow: Multibella's wolf den, js/den/wolfden-house.js, later). */
import type { Plan, Piece, Portrait } from './den-houses.js';

// ---------- the house ----------
/** One big room, the camera looking in from the front (its front wall cut low, a doll's house), papered a dark
    plum, as gothic as her stump. As big as what happens in it (the user, 21 Nov: "the house is a bit
    small for how big of a concept there is in it"): a hunt round it, and a fray in it. */
export const PLAN: Plan = {
  rooms: [{ id: 'hall', name: 'Jezerbell\'s hall', x0: -8.4, x1: 8.4, z0: -4.9, z1: 4.6, paper: '#3b2740' }],
  doors: [],
  out: { x: 0, z: 4.0, r: 0.9 },
};
/** Where you come in (just inside the front door), and where she meets you. */
export const ARRIVE = { you: { x: 0, z: 3.6 }, her: { x: 1.4, z: 2.6 } } as const;
export const WALLS = { high: 3.8, low: 0.45 } as const;
const ROOM = PLAN.rooms[0];
export const WALL_T = 0.2;
/** The back wall's face (z), and the left and right walls' (x). */
export const BACK = ROOM.z0 + WALL_T;
export const LEFT = ROOM.x0 + WALL_T, RIGHT = ROOM.x1 - WALL_T;

// ---------- her furniture ----------
/* As in the screenshot: the werewolf stump in the middle at the back (her vampire altar left out: "I don't know that I
   like two things in the same house, like the werewolf and the vampire altar", the user, 21 Nov);
   the bat-winged throne; the bat gargoyles crouched on chests down the right; two doubloon exchanges at the front on
   the right; the gold armour, the blue-and-white vase, the potted palm; the shark statue, the sea turtle and the seal
   down the left by the stairs (no stairs here: one room). */
/** Her summoning stump, for werewolves: Space by it uses a charm. */
export const STUMP = { x: 0.6, z: -3.4, near: 1.5 } as const;
export const THRONE = { x: -4.6, z: -1.2, yaw: 0.9 } as const;
export const VASE = { x: -7.4, z: 2.7 } as const;
export const PALM = { x: 2.6, z: 3.5 } as const;
export const ARMOUR = { x: -7.4, z: -3.9 } as const;
/** The gargoyles' chests, down the right wall, facing in. */
export const CHESTS = [{ x: 7.6, z: -2.0 }, { x: 7.6, z: 0.4 }] as const;
/** The doubloon exchanges, at the front on the right. */
export const EXCHANGES = [{ x: 6.4, z: 3.4 }, { x: 4.7, z: 3.7 }] as const;
export type Placed = Piece & { s?: number; extra?: Record<string, string | number | boolean> };
export const FURNISH: readonly Placed[] = [
  { kind: 'rug', x: -1.6, z: 0.4, col: '#7a1f2e' },
  { kind: 'rug', x: 2.6, z: 0.4, col: '#5a1f4e' },
  { kind: 'summoningStump', x: STUMP.x, z: STUMP.z },
  { kind: 'batThrone', x: THRONE.x, z: THRONE.z, yaw: THRONE.yaw },
  { kind: 'gargoyleChest', x: CHESTS[0].x, z: CHESTS[0].z, yaw: -Math.PI / 2 },
  { kind: 'gargoyleChest', x: CHESTS[1].x, z: CHESTS[1].z, yaw: -Math.PI / 2, col: '#d8b64a' },
  { kind: 'doubloonExchange', x: EXCHANGES[0].x, z: EXCHANGES[0].z, yaw: -0.4 },
  { kind: 'doubloonExchange', x: EXCHANGES[1].x, z: EXCHANGES[1].z, yaw: 0.2 },
  { kind: 'armour', x: ARMOUR.x, z: ARMOUR.z, yaw: 0.6, extra: { gold: true, plume: '#c0262e' } },
  { kind: 'vase', x: VASE.x, z: VASE.z },
  { kind: 'pottedPalm', x: PALM.x, z: PALM.z },
  { kind: 'statue', x: -7.5, z: 0.3, yaw: Math.PI / 2, extra: { animal: 'shark' } },
  { kind: 'statue', x: -5.4, z: 3.6, yaw: 0.4, extra: { animal: 'turtle' } },
  { kind: 'statue', x: -4.0, z: 3.85, yaw: -0.3, extra: { animal: 'seal' } },
  { kind: 'candelabra', x: -1.5, z: -4.1 },
  { kind: 'candelabra', x: 2.7, z: -4.1 },
  { kind: 'candelabra', x: 6.0, z: -4.1 },
  { kind: 'gargoyleChest', x: 4.6, z: -4.2, col: '#8a2a3a' },
];

// ---------- her portraits ----------
/* Her real portraits' titles, from the screenshot (21 Nov): "Twilight Stroll", "Eternal Love!", "Just the three of
   us". What's in them is ours (her, painted by the den's pirate maker), till she says. */
export type PortraitId = 'twilight' | 'love' | 'three';
export interface Hung extends Portrait { id: PortraitId; x: number; y: number; w: number; h: number }
export const PORTRAITS: readonly Hung[] = [
  { id: 'twilight', title: 'Twilight Stroll', backdrop: 'night', x: -5.6, y: 1.95, w: 1.0, h: 1.25, sitter: { who: 'pirate', name: 'Jezerbell' }, close: true },
  { id: 'love', title: 'Eternal Love!', backdrop: 'bloodmoon', x: -3.3, y: 2.05, w: 1.05, h: 1.3, sitter: { who: 'pirate', name: 'Jezerbell', dress: { fam: 'octopus', famCol: 'pink' } }, close: true },
  { id: 'three', title: 'Just the three of us', backdrop: 'sea', x: 6.4, y: 2.0, w: 1.05, h: 1.3, sitter: { who: 'pirate', name: 'Jezerbell', dress: { fam: 'octopus', famCol: 'violet' } }, close: true },
];
/* (No route labels on her walls: in her real house they're on presents, and here, without them, "it's just a bit
   weird", the user, 21 Nov.) */
/** Her sign, over the stump: whose house it is. */
export const SIGN = { text: 'Jezerbell', x: STUMP.x, w: 1.7, h: 0.4, y: 3.25 } as const;

// ---------- her octopuses ----------
/* Hidden about her room, so nobody asks her for one: each peeking out of somewhere, a tentacle showing if you look.
   Come up close (within `near`) and Space, and it's found: out it comes, and sits up where everyone can see it. Found
   in any order. One more is missing altogether: the werewolves have her (MISSING), back only once the pack's beaten. */
export type Hide = 'vase' | 'throne' | 'frame' | 'armour' | 'palm' | 'chest' | 'exchange';
export interface Octopus {
  id: Hide;
  /** Her colour (a familiar's, src/palette.ts's names). */
  col: string;
  /** Where she's hiding (where you have to come to), and where she peeks out (`peek`: x, y, z, the bit showing). */
  at: { x: number; z: number };
  peek: { x: number; y: number; z: number; yaw: number };
  /** Where she sits once found (on top of where she hid, out in the open). */
  sit: { x: number; y: number; z: number; yaw: number };
  near: number;
}
const oct = (id: Hide, col: string, at: { x: number; z: number }, peek: [number, number, number, number], sit: [number, number, number, number], near = 1.25): Octopus =>
  ({ id, col, at, near, peek: { x: peek[0], y: peek[1], z: peek[2], yaw: peek[3] }, sit: { x: sit[0], y: sit[1], z: sit[2], yaw: sit[3] } });
// (each peeking out in front of where it hides, tentacles toward you, never sunk into it: the user, 21 Nov, "making
// sure the tentacles actually appear up front. Like one sinking into the chair")
export const OCTOPUSES: readonly Octopus[] = [
  oct('vase', 'pink', { x: VASE.x + 0.6, z: VASE.z }, [VASE.x, 0.62, VASE.z, 0.6], [VASE.x, 0.92, VASE.z, 0.6]),
  oct('throne', 'violet', { x: THRONE.x + 0.9, z: THRONE.z + 0.7 }, [THRONE.x + Math.sin(THRONE.yaw) * 0.62, 0.04, THRONE.z + Math.cos(THRONE.yaw) * 0.62, THRONE.yaw], [THRONE.x + 0.05, 0.52, THRONE.z + 0.05, THRONE.yaw]),
  oct('frame', 'red', { x: -3.3, z: BACK + 1.1 }, [-2.68, 2.62, BACK + 0.16, -0.3], [-3.3, 2.86, BACK + 0.16, 0]),
  oct('armour', 'lemon', { x: ARMOUR.x + 0.8, z: ARMOUR.z + 0.7 }, [ARMOUR.x + 0.3, 1.05, ARMOUR.z - 0.05, 0.9], [ARMOUR.x, 2.12, ARMOUR.z, 0.6]),
  oct('palm', 'lime', { x: PALM.x - 0.7, z: PALM.z - 0.5 }, [PALM.x + 0.11, 0.95, PALM.z - 0.02, 0.4], [PALM.x, 1.75, PALM.z, 0.3]),
  oct('chest', 'aqua', { x: CHESTS[1].x - 0.95, z: CHESTS[1].z }, [CHESTS[1].x + 0.3, 0.45, CHESTS[1].z + 0.2, -Math.PI / 2], [CHESTS[1].x - 0.25, 0.6, CHESTS[1].z + 0.5, -Math.PI / 2]),
  oct('exchange', 'orange', { x: EXCHANGES[0].x - 0.3, z: EXCHANGES[0].z - 0.85 }, [EXCHANGES[0].x + 0.38, 0.1, EXCHANGES[0].z - 0.2, -0.4], [EXCHANGES[0].x, 1.42, EXCHANGES[0].z, -0.4]),
];
/** The one the werewolves took. Back at her side once the pack's beaten. */
export const MISSING = { col: 'black' } as const;

/** The hidden octopus you're close enough to find (the nearest not found yet), or null. */
export function octopusAt(you: { x: number; z: number }, found: ReadonlySet<Hide>): Octopus | null {
  let best: Octopus | null = null, bd = Infinity;
  for (const o of OCTOPUSES) {
    if (found.has(o.id)) continue;
    const d = Math.hypot(you.x - o.at.x, you.z - o.at.z);
    if (d < o.near && d < bd) { best = o; bd = d; }
  }
  return best;
}
/** How many of hers there are in all (the missing one too): what the counter counts to. */
export const ALL = OCTOPUSES.length + 1;

// ---------- the tour ----------
/** Her tour, stop by stop: where you come to (`at`, within `near`) for her to say a stop's lines, and where she
    waits for you there (`her`). */
export type TourStop = 'hall' | 'stump';
export interface Stop { id: TourStop; at: { x: number; z: number }; near: number; her: { x: number; z: number } }
export const TOUR: readonly Stop[] = [
  { id: 'hall', at: { x: 0.4, z: 1.2 }, near: 2.0, her: { x: 1.6, z: 0.2 } },
  { id: 'stump', at: { x: STUMP.x - 0.4, z: STUMP.z + 1.3 }, near: 1.2, her: { x: STUMP.x + 1.2, z: STUMP.z + 0.9 } },
];
/** The stop to say next: the furthest from `from` on that you're at, or -1. */
export function stopAt(from: number, x: number, z: number): number {
  for (let i = TOUR.length - 1; i >= Math.max(0, from); i--) {
    const s = TOUR[i];
    if (Math.hypot(x - s.at.x, z - s.at.z) < s.near) return i;
  }
  return -1;
}
/** Close enough to her stump for Space? */
export const atStump = (you: { x: number; z: number }): boolean => Math.hypot(you.x - STUMP.x, you.z - STUMP.z) < STUMP.near;

// ---------- the pack ----------
/* Our own pack, in the fairy-tale spirit of Puzzle Pirates' wolves (their names and taunts are ours, never the
   game's). Each duels at a pace of its own (sword-bots.ts's Hand at `pace`: seconds to think when a pair comes in,
   a key a beat, the drop), slower than a person's to begin with, the pack's leader quickest. `fur`: its coat. */
export interface Wolf { id: string; name: string; fur: string; pace: { THINK: number; KEY: number; DROP: number } }
export const PACK: readonly Wolf[] = [
  { id: 'huff', name: 'Huffing Hector', fur: '#7a6a5a', pace: { THINK: 1.6, KEY: 0.34, DROP: 0.6 } },
  { id: 'puff', name: 'Puffing Prudence', fur: '#9a9086', pace: { THINK: 1.5, KEY: 0.32, DROP: 0.55 } },
  { id: 'teeth', name: 'Big-Teeth Bartholomew', fur: '#4a3a30', pace: { THINK: 1.35, KEY: 0.3, DROP: 0.5 } },
  { id: 'cried', name: 'Cried-Wolf Clementine', fur: '#2e2a2c', pace: { THINK: 1.2, KEY: 0.28, DROP: 0.45 } },
];

/** How the fray goes, in seconds: Jezerbell beats a wolf of her own first `HER_FIRST` in, then one every
    `HER_EVERY` (never yours); once you're knocked out she fights on alone and wins if no more than `HER_ALONE` are
    left standing. */
export const FRAY = { HER_FIRST: 40, HER_EVERY: 45, HER_ALONE: 2 } as const;

/** What happens in the fray, as it happens. */
export type FrayEvent =
  | { what: 'duel'; wolf: number }          // a wolf turns on you: a fresh duel against it
  | { what: 'down'; wolf: number; by: 'you' | 'her' }
  | { what: 'out' }                         // you're knocked out
  | { what: 'over'; won: boolean };

/* The fray: who's standing, whom you're dueling, and her own wolves. Pure (the duel itself is the page's, a real
   Swordfight Duel; it tells the fray who won with `duelOver`). Time goes by on `tick`. */
export class Fray {
  /** Who's standing, by their place in PACK. */
  readonly standing: boolean[];
  /** The wolf you're dueling (its place in PACK), or -1 (you're out, or it's over). */
  yours = -1;
  youOut = false;
  over = false;
  won = false;
  private t = 0;
  private herNext: number = FRAY.HER_FIRST;
  constructor(readonly pack: readonly Wolf[] = PACK) {
    this.standing = pack.map(() => true);
  }
  /** How many wolves are still standing. */
  get left(): number { return this.standing.filter(Boolean).length; }
  /** The wolf she's fighting (her own: the first standing that isn't yours), or -1. */
  hers(): number {
    if (this.over) return -1;
    return this.standing.findIndex((s, k) => s && k !== this.yours);
  }
  /** It starts: the first wolf turns on you. */
  start(): FrayEvent[] {
    this.yours = this.standing.indexOf(true);
    return [{ what: 'duel', wolf: this.yours }];
  }
  /** Your duel's over: `youWon`, you knocked your wolf out; else it knocked you out. */
  duelOver(youWon: boolean): FrayEvent[] {
    if (this.over || this.yours < 0) return [];
    const out: FrayEvent[] = [];
    if (youWon) {
      this.standing[this.yours] = false;
      out.push({ what: 'down', wolf: this.yours, by: 'you' });
      this.yours = this.standing.indexOf(true);
      if (this.yours >= 0) out.push({ what: 'duel', wolf: this.yours });
      else out.push(...this.end(true));
    } else {
      this.yours = -1;
      this.youOut = true;
      out.push({ what: 'out' });
      // (on her own now: she sees off a few, but not a whole pack)
      const won = this.left <= FRAY.HER_ALONE;
      if (won) this.standing.forEach((s, i) => { if (s) { this.standing[i] = false; out.push({ what: 'down', wolf: i, by: 'her' }); } });
      out.push(...this.end(won));
    }
    return out;
  }
  /** Time goes by: now and then she beats one of her own (one you're not dueling). */
  tick(dt: number): FrayEvent[] {
    if (this.over || this.yours < 0) return [];
    this.t += dt;
    if (this.t < this.herNext) return [];
    this.herNext += FRAY.HER_EVERY;
    const i = this.hers();
    if (i < 0) return [];
    this.standing[i] = false;
    return [{ what: 'down', wolf: i, by: 'her' }];
  }
  private end(won: boolean): FrayEvent[] {
    this.over = true;
    this.won = won;
    this.yours = -1;
    return [{ what: 'over', won }];
  }
}
