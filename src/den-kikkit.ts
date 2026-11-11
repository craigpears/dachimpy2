/* Pirate Den: Kikkit's island and her whirlpools, a way through the reef. TypeScript, compiled to
   js/den-kikkit.js; tested in tests/den-kikkit.test.ts. js/den/kikkit.js draws them and her; the
   squares are LAY.KIKKIT in src/den-sail.ts, a whirlpool's rules src/den-whirl.ts (the helm plays
   them), and a gust's way over them gustPath's (src/den-sailing.ts).

   The user (11 Nov), of the map's ways past the checkpoint: "maybe that will be a good place for it
   to be, is that's a way for you to get through the reef. And there's a penguin in the middle, so it
   gives you a bit of a reward", and then "Maybe a small combo gets you through the reef, with the
   penguins being the bigger prize after." And: "definitely a Vegas to get fully through to the
   penguins ... you've got relatively small, easy platforms" (so Sailing's board is an easy one in her
   waters: KIKKIT.WATERS, src/sailing.ts's EASY).

   Then (11 Nov) the first go "only spun her and flung her back": "Whirlpools are basically four tiles
   ... each one ... rotates the ship and sends it to the opposite corner", and some have "a corner
   missing where there's some winds, so you kind of get caught in the whirlpool and it sends you to the
   opposite corner, which then gets you on some winds and sends you back". YPPedia's rules win.

   So, sailed with the Sailing puzzle's gusts (R, the rigging), from the passage's mouth just off her
   island, facing the reef's gap (LAY.KIKKIT says the squares):
   - a plain clear stops in the gap, and its wind blows her into a whirlpool: it turns her a quarter
     and sends her to its far corner, the missing one, whose wind takes her back up through the reef,
     along her shore and into the mouth, just as she started (five lefts and a right: turnsOf);
   - a Double carries her clean over the gap, out past the reef: the third way past the checkpoint;
   - a Triple, a Bingo or a Donkey further, onto the winds past it, into the other whirlpool, and
     home the same way;
   - only a Vegas over all of it, to the penguins.
   Her own moves into any of it, and they have her the same way. The pilot never takes her in. */

import { Helm, LAY, Sea, type Pose, type SailEvent } from './den-sail.js';
import { carry } from './den-sailing.js';
import { shoreOf } from './den-isle.js';
import { RAMBLE, TANGENTS, BACK, BACK_OUT } from './lines/kikkit.js';

const K = LAY.KIKKIT;
export const KIKKIT = {
  /** Its name on the captain's map; and the penguins' island's, once you've been (the user named it,
      11 Nov: "reached only by a Vegas"). */
  NAME: 'Kikkit\'s Island',
  VEGAS: 'Vegas Island',
  /** Her waters: where Sailing's board is the whirlpools' own easy one (src/sailing.ts, EASY). */
  WATERS: { c0: 13, c1: 21, r0: 14, r1: 24 },
  /** Within earshot: squares from where she stands on her island. Once she's told her ramble she
      never stops talking while you're this near (the user, 11 Nov: "you're sailing past, you've not
      even engaged, and she's going on these tangents"). */
  EARSHOT: 7,
} as const;

const key = (c: number, r: number) => `${c},${r}`;
const land = new Set(K.LAND.map(([c, r]) => key(c, r)));

/** Her island's squares. */
export const kikkitAt = (c: number, r: number): boolean => land.has(key(c, r));
/** The water off her island's shore, where she hails you (and you her). */
export function onKikkitLanding(c: number, r: number): boolean {
  const L = K.LANDING;
  return c >= L.c0 && c <= L.c1 && r >= L.r0 && r <= L.r1 && !kikkitAt(c, r);
}
/** In her waters: Sailing's board is the easy one here. */
export function inKikkitWaters(c: number, r: number): boolean {
  const W = KIKKIT.WATERS;
  return c >= W.c0 && c <= W.c1 && r >= W.r0 && r <= W.r1;
}
/** Where she stands on her island (js/den/kikkit.js draws her there). */
export const KIKKIT_STANDS = { c: 18.35, r: 17.35 } as const;
/** Within earshot of her: she keeps talking. */
export const inEarshot = (c: number, r: number): boolean =>
  Math.hypot(c - KIKKIT_STANDS.c, r - KIKKIT_STANDS.r) <= KIKKIT.EARSHOT;
/** Her island's shore, for the 3D and the captain's map (src/den-isle.ts, shoreOf). */
export const kikkitShore = (): [number, number][] => shoreOf(K.LAND);

/** The passage's mouth, the reef's gap, the open water past it, and the penguins' water. */
export const MOUTH: Pose = { ...K.MOUTH };
export const GAP = [...K.GAP] as [number, number];
export const OUT = [...K.OUT] as [number, number];
export const PENGUINS = [...K.PENGUINS] as [number, number];
/** A square of the passage: a whirlpool's (its missing corner too) or one of its winds. The
    checkpoint knows she crossed the reef by them (src/den-checkpoint.ts). */
const passage = new Set([
  ...K.WHIRLS.flatMap(({ at: [c, r] }) => [key(c, r), key(c + 1, r), key(c, r + 1), key(c + 1, r + 1)]),
  ...K.WINDS.map(([c, r]) => key(c, r)),
]);
export const passageAt = (c: number, r: number): boolean => passage.has(key(c, r));

/** The turns she makes, as Kikkit counts them, sailing a gust of `run` squares from the mouth: each
    quarter turn left (the winds turn her the way they blow), right, or a whirl's quarter right (a
    twirl), and about-turns (backflips); and whether she's back as she started, at the mouth. */
export function turnsOf(run = 1): { lefts: number; rights: number; twirls: number; backflips: number; home: boolean } {
  const h = new Helm(new Sea(1), MOUTH), n = { lefts: 0, rights: 0, twirls: 0, backflips: 0 };
  carry(h, run);
  for (let t = 0; t < 40; t += 0.05) {
    for (const e of h.tick(0.05)) {
      if (e.kind !== 'push') continue;
      const q = (((e.to.d - e.from.d) % 4) + 4) % 4;
      if (q === 3) n.lefts++;
      else if (q === 2) n.backflips++;
      else if (q === 1) n[e.whirl ? 'twirls' : 'rights']++;
    }
  }
  const p = h.pose;
  return { ...n, home: p.c === MOUTH.c && p.r === MOUTH.r && p.d === MOUTH.d };
}

/** What she's done in the whirlpools, by what the helm's done: through the reef, at the penguins, a
    whirlpool has her, and she's come to rest again after it (back at the mouth). */
export type WhirlEvent = 'through' | 'penguins' | 'caught' | 'back';

/** The passage's watch. Each time she does it. */
export class Whirlpools {
  /** Through the reef, and at the penguins, ever. */
  through = false;
  penguins = false;
  /** A whirlpool has her just now, its whirls and winds still carrying her: and whether she'd got
      out past the reef first. */
  has: { out: boolean } | null = null;
  /** The last time it let her go, whether she'd got out past the reef first. */
  backOut = false;
  private crossing = false;
  private past = false;
  private atPenguins = false;

  /** A tick's events and the helm after them. */
  watch(events: readonly SailEvent[], h: Helm): WhirlEvent[] {
    const out: WhirlEvent[] = [], ROW = LAY.CHECKPOINT.ROW;
    for (const e of events) {
      if (e.kind !== 'push' && e.kind !== 'move') continue;
      // Through: a gust's carrying her over the gap and on, out past the reef.
      if (e.kind === 'push' && e.whirl) {
        this.crossing = false;
        if (!this.has) { this.has = { out: this.past }; out.push('caught'); }
      } else if (e.kind === 'push' && e.gust && e.to.c === GAP[0] && e.to.r === GAP[1]) this.crossing = true;
      else if (this.crossing && e.to.r > ROW) { this.crossing = false; this.through = this.past = true; out.push('through'); }
      if (e.to.r < ROW) this.crossing = this.past = false;
    }
    const p = h.pose;
    // Let go: nothing more carrying her, and not about to whirl again.
    const settled = (!h.cur || !!h.cur.done) && !h.rides.length && !h.gusts.length && !h.whirling();
    if (this.has && settled) { this.backOut = this.has.out; this.has = null; this.past = false; out.push('back'); }
    const there = p.c === PENGUINS[0] && p.r === PENGUINS[1];
    if (there && !this.atPenguins) { this.penguins = true; out.push('penguins'); }
    this.atPenguins = there;
    return out;
  }
}

/** Kikkit: what she's said, and what she says next. */
export class Kikkit {
  /** She's told you her ramble, all of it at least once. */
  told = false;
  private tangent = 0;
  private back = 0;
  private backOut = 0;

  /** Sailing up to her island: the first time, her ramble (to be said in turn). */
  arrive(): string[] {
    if (this.told) return [];
    this.told = true;
    return [...RAMBLE];
  }
  /** Hailed: her ramble if she's not told it, else on she goes. */
  hail(): string[] {
    return this.told ? this.more() : this.arrive();
  }
  /** What she says next once she's run out, and she always has more: the next tangent, round and
      round for ever; after the last, the whole ramble again (it's the real way, after all). */
  more(): string[] {
    if (this.tangent >= TANGENTS.length) { this.tangent = 0; return [...RAMBLE]; }
    return [TANGENTS[this.tangent++]];
  }
  /** The whirlpools and the winds have thrown you back: a new line each time (`out`: you'd got out
      past the reef first). */
  spat(out = false): string {
    if (out) return BACK_OUT[this.backOut++ % BACK_OUT.length];
    return BACK[this.back++ % BACK.length];
  }
}
