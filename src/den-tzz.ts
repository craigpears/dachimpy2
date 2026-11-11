/* Pirate Den: Tzz's island and her balloon lesson. TypeScript, compiled to js/den-tzz.js; tested in
   tests/den-tzz.test.ts. js/den/balloon-isle.js draws the island and places her from TZZ_CAST (below),
   plain data; the squares are LAY.TZZ in src/den-sail.ts; her lesson's balloons are src/balloons.ts's
   (a show any pair of hands can give), her lines src/lines/tzz.ts.

   The user (10 and 11 Nov, IDEAS.md "Tzz's huge Vegas, on an island of her own"): after Kikkit's
   rambling, "now I wonder if I can find somebody that can explain how to get past all these ...
   whirlpools and winds that makes a bit more sense, or goes on fewer tangents". Tzz is that someone,
   on a little island of her own a hop from Kikkit's, nearer the start: "Have it nearby because you
   want to run in to [Kikkit] first". The first time you sail up off it she gives her lesson, a little
   cutscene (the stretch's one: "we're going to be getting the cinematic from [Tzz] on her balloon
   popping"): she twists a real balloon, squeak by squeak, into Sailing's pieces, a Double ("and
   that's what zooms you over a whirlpool"), then a Vegas, and pops it pop-pop-pop. Then you sail the
   whirlpools yourself. Space off her island, and she shows you again.
   And no one comes aboard (11 Nov): "I don't think they need to be aboard, to be honest. I like Kikkit
   just kind of on her island. It works." She stays on hers. */

import { LAY } from './den-sail.js';
import { shoreOf } from './den-isle.js';
import { ROUTINES, type Act } from './balloons.js';
import { GREET, DOUBLE, BINGO, VEGAS, AFTER } from './lines/tzz.js';
import type { Script } from './chatter.js';

const T = LAY.TZZ;
export const TZZ = {
  /** Its name (not on the captain's map: the map shows the island, never whose: "Hidden gems, never
      hinted"). */
  NAME: 'Tzz\'s island',
  /** Within earshot: squares from where she stands. */
  EARSHOT: 4,
} as const;

const key = (c: number, r: number) => `${c},${r}`;
const land = new Set(T.LAND.map(([c, r]) => key(c, r)));
/** Her island's squares. */
export const tzzAt = (c: number, r: number): boolean => land.has(key(c, r));
/** The water off her island's shore, where her lesson's seen (and Space has her show you again). */
export function onTzzLanding(c: number, r: number): boolean {
  const L = T.LANDING;
  return c >= L.c0 && c <= L.c1 && r >= L.r0 && r <= L.r1 && !tzzAt(c, r);
}
/** Her island's shore, for the 3D and the captain's map (src/den-isle.ts, shoreOf). */
export const tzzShore = (): [number, number][] => shoreOf(T.LAND);
/** Where she stands, and where her balloons go up beside her (her stand, on the sand). */
export const TZZ_STANDS = { c: 20.95, r: 13.9 } as const;
export const inTzzEarshot = (c: number, r: number): boolean => Math.hypot(c - TZZ_STANDS.c, r - TZZ_STANDS.r) <= TZZ.EARSHOT;

/** Her lesson, on a real Sailing board beside her (src/balloons.ts): a Double, then a Bingo, then a
    Vegas, each a stair of ledges a little higher, so you see how each is made (the user, 11 Nov: "how to
    build doubles and bingos and things"), and in each she sets the balloons up and you drop the pair
    that pops it ("it should definitely be like a now you try thing"); her first line by whether you've heard Kikkit out (`heard`:
    you've wondered aloud after her ramble). */
export function lesson(heard: boolean): Act[] {
  return [
    { routine: ROUTINES.double, says: { ...DOUBLE, start: `${heard ? GREET.heard : GREET.plain} ${DOUBLE.start}` }, you: true },
    { routine: ROUTINES.bingo, says: BINGO, you: true },
    { routine: ROUTINES.vegas, says: VEGAS, you: true },
  ];
}

/** How long each of her lesson's lines is up: quick, breezy patter (a street performer's), still long
    enough to read; the show gives each beat at least this (src/balloons.ts). */
export const lessonSecs = (text: string): number => 0.8 + text.length * 0.055;

/** When her lesson plays: the first time you come up off her island (a cutscene), and again whenever
    you ask (Space there). Not while something else is playing, nor while you're just passing through
    at speed (on a gust, say): once you're off her island and nothing's carrying her. */
export class Visit {
  /** Her lesson's been seen. */
  seen = false;
  /** Each tick: off her island (`off`), and whether you're free to watch (`free`: nothing else playing,
      nothing carrying her). True when her lesson should begin now (the first time you come up). */
  arrive(off: boolean, free: boolean): boolean {
    if (!off || !free || this.seen) return false;
    this.seen = true;
    return true;
  }
  /** Space off her island: again (true), once it's been seen; the first time, it begins as you come up. */
  again(off: boolean, free: boolean): boolean { return off && free && this.seen; }
}

/** After her lesson, while you're within earshot: a tip now and then, round and round (src/chatter.ts). */
export const TZZ_SAYS: Script = { loop: AFTER };

/* Who's on her island, placed: a character is only config (RULES.md). js/den/balloon-isle.js puts them
   there through the shared pieces: a talking pirate (props-people.js's person(), her Script with
   src/chatter.ts), the balloon show in her hands (balloons.js, src/balloons.ts) and furniture (her
   still). Squares on the sloop's sea (`at`: [c, r]); `yaw` the way they face (0: out to sea). */
export const TZZ_CAST = {
  /** Tzz: her look (PIRATES's), on the sand, a touch big so she reads from the sea, swaying gently,
      turned to you while you're within earshot; her lines. */
  her: { look: 'Tzz', at: [TZZ_STANDS.c, TZZ_STANDS.r], scale: 1.15, yaw: -1.4, idle: 'sway', earshot: TZZ.EARSHOT, says: TZZ_SAYS, gap: [4, 7] as [number, number] },
  /** Her board: the den's own Sailing board on a stand on the sand beside her (balloons.js), its front
      to the camera; `tall`, its picture's height in metres. */
  board: { at: [20.2, 14.3], tall: 2.6 },
  /** Behind her, a copper still (her portrait's). */
  props: [{ kind: 'still', at: [21.45, 14.25], yaw: -1.9 }],
  /** The camera on her lesson, one shot held throughout (the user, 11 Nov: "She's hidden quite
      behind"): from out on the water toward `from` (squares), at her and her board side by side, `up`
      metres over the sand, `dist` metres off, tilted down `tilt`. */
  shot: { from: [18.2, 13.7], dist: 7.2, tilt: 0.1, up: 1.55 },
} as const;
