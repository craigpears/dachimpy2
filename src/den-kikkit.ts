/* Pirate Den: Kikkit's island and her whirlpools, a way through the reef. TypeScript, compiled to
   js/den-kikkit.js; tested in tests/den-kikkit.test.ts. js/den/kikkit.js draws them and her; the
   squares are LAY.KIKKIT in src/den-sail.ts, and a gust's way over the whirlpools is gustPath's
   (src/den-sailing.ts).

   The user (11 Nov), of the map's ways past the checkpoint: "maybe that will be a good place for it
   to be, is that's a way for you to get through the reef. And there's a penguin in the middle, so it
   gives you a bit of a reward", and then "Maybe a small combo gets you through the reef, with the
   penguins being the bigger prize after." And: "definitely a Vegas to get fully through to the
   penguins ... you've got relatively small, easy platforms" (so Sailing's board is an easy one in her
   waters: KIKKIT.WATERS, src/sailing.ts's EASY).

   So, sailed with the Sailing puzzle's gusts (R, the rigging), from the passage's mouth just off her
   island, facing the reef:
   - a plain clear drops her in the little whirlpool in the reef: it has her, spins her round and
     round (too many lefts) and spits her all the way back to Kikkit's island;
   - a small chain (a Double or better) carries her over it and out the other side: through the
     reef, the third way past the checkpoint;
   - only a Vegas carries her over the big whirlpools beyond, to the penguins in the middle of them:
     a lesser chain stops short of them, out past the reef;
   - sailing into a whirlpool under her own way (or at the oars), it has her too: back to the island.
   Whatever has her, she's back off Kikkit's island ("I don't want progress to sit. That's the funny
   [part]": 10 Nov), and Kikkit finds it hilarious. */

import { LAY, type Helm, type Pose, type SailEvent } from './den-sail.js';
import { shoreOf } from './den-isle.js';
import { RAMBLE, TANGENTS, BACK, BACK_OUT } from './lines/kikkit.js';

const K = LAY.KIKKIT;
export const KIKKIT = {
  /** Its name on the captain's map; and the penguins' island's, once you've been (the user named it,
      11 Nov: "reached only by a Vegas"). */
  NAME: 'Kikkit\'s Island',
  VEGAS: 'Vegas Island',
  /** Seconds a whirlpool spins her before it spits her out, and her flight back to the island. */
  SPIN: 1.6,
  FLING: 1.1,
  /** Her waters: where Sailing's board is the whirlpools' own easy one (src/sailing.ts, EASY). */
  WATERS: { c0: 13, c1: 21, r0: 14, r1: 23 },
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

/** The passage, square by square from the mouth. */
export const PASSAGE = K.PASSAGE.map(([c, r, spin, kind]) => ({ c, r, spin, kind }));
const find = (kind: string) => { const p = PASSAGE.find((q) => q.kind === kind)!; return [p.c, p.r] as [number, number]; };
/** The little whirlpool in the reef, the open water past it, and the penguins' water. */
export const REEF_WHIRL = find('small');
export const OUT = find('out');
export const PENGUINS = find('penguins');
/** Where too many lefts leave her: back off Kikkit's island. */
export const spatPose = (): Pose => ({ ...K.SPAT });

/** The turns the whirlpools make, as Kikkit counts them: a little whirlpool's full spin is four
    lefts ("the left, the left, the left, the left, and just spinning"), a big one's a backflip. */
export function turnsOf(): { lefts: number; rights: number; backflips: number } {
  let lefts = 0, rights = 0, backflips = 0;
  for (const { spin, kind } of PASSAGE) {
    if (kind === 'big' && Math.abs(spin) === 4) backflips++;
    else if (spin > 0) lefts += spin;
    else rights -= spin;
  }
  return { lefts, rights, backflips };
}

/** A whirlpool has her: she's come to rest on one (a gust left her there: nothing more to play on
    the square), or sailed into one (a move's `whirl`). Where, if so. */
export function caught(h: Helm, events: readonly SailEvent[] = []): [number, number] | null {
  for (const e of events) if (e.kind === 'move' && e.whirl) return [...e.whirl];
  const { c, r } = h.pose;
  if (!h.sea.whirlAt(c, r)) return null;
  const settled = (!h.cur || !!h.cur.done) && !h.gusts.length && !h.rides.length;
  return settled ? [c, r] : null;
}

/** What she's done in the whirlpools, by what the helm's done. */
export type WhirlEvent = 'through' | 'penguins';

/** The passage's watch: through the reef (carried over the little whirlpool and out past it), and to
    the penguins. Each time she does it. */
export class Whirlpools {
  /** Through the reef, and at the penguins, ever. */
  through = false;
  penguins = false;
  private crossing = false;
  private atPenguins = false;

  /** A tick's events and where she is after them (Helm.pose). */
  watch(events: readonly SailEvent[], pose: Pose): WhirlEvent[] {
    const out: WhirlEvent[] = [];
    for (const e of events) if (e.kind === 'push' && e.to.c === REEF_WHIRL[0] && e.to.r === REEF_WHIRL[1]) this.crossing = true;
    if (this.crossing && pose.r > LAY.CHECKPOINT.ROW) { this.crossing = false; this.through = true; out.push('through'); }
    else if (this.crossing && pose.r < K.MOUTH.r) this.crossing = false;   // (spat back)
    const there = pose.c === PENGUINS[0] && pose.r === PENGUINS[1];
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
  /** Too many lefts, and you're back: a new line each time (`out`: you'd got out past the reef). */
  spat(out = false): string {
    if (out) return BACK_OUT[this.backOut++ % BACK_OUT.length];
    return BACK[this.back++ % BACK.length];
  }
}
