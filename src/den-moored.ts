/* Pirate Den: Primates Rule at anchor on the sloop's sea, still to come. TypeScript, compiled to
   js/den-moored.js; tested in tests/den-moored.test.ts. js/den/moored.js draws her there (her look:
   js/den/frigate.js, from src/den-frigate.ts); her squares are LAY.PRIMATES in src/den-sail.ts (with
   every other place's, as the sea lays them); what you say sailing by her, src/lines/you.ts.

   The user (11 Nov), of the war frigate modelled that day: "add that to the scene somewhere so you can
   just, once you start getting out to sea, you just kind of see that out there and put [a mark] on it.
   [To] make it clear, it's kind of a to-do item." So she lies at anchor, sails furled, out past Port
   Decorum, to its left (moved there 11 Nov from just off the trade winds' first run out from the beach:
   "if you go over to the left, you'll ... find the [war frig]"), a sign over her saying she's coming soon; sailing up near
   her, you say she's not ready yet. Nothing to do there yet: no boarding her. */
import { LAY } from './den-sail.js';

const P = LAY.PRIMATES.AT;
export const MOORED = {
  /** The sign over her. */
  SIGN: { name: 'Primates Rule', note: 'coming soon' },
  /** How near (squares, any way) you come before you say she's not ready yet. */
  NEAR: 2,
  /** Her bow's way: along her squares, out to the right (+c), broadside on to the den. */
  HEADING: 0,
} as const;

const key = (c: number, r: number) => `${c},${r}`;
const at = new Set(P.map(([c, r]) => key(c, r)));
/** One of the squares she lies across. */
export const mooredAt = (c: number, r: number): boolean => at.has(key(c, r));
/** Where her middle is, in squares (c, r: the 3D puts her there). */
export const MOORED_MID = {
  c: P.reduce((s, [c]) => s + c, 0) / P.length,
  r: P.reduce((s, [, r]) => s + r, 0) / P.length,
} as const;
/** Sailing near her: within NEAR squares of her, not on her. */
export function nearMoored(c: number, r: number): boolean {
  return !mooredAt(c, r) && P.some(([x, y]) => Math.max(Math.abs(x - c), Math.abs(y - r)) <= MOORED.NEAR);
}

/** Sailing up near her: said once a voyage, the first time, when nothing else is playing. */
export class MooredHail {
  said = false;
  /** Each tick: near her (`near`), free to say it (`free`). True the first time. */
  pass(near: boolean, free: boolean): boolean {
    if (!near || !free || this.said) return false;
    this.said = true;
    return true;
  }
}
