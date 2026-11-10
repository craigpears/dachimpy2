/* Shared by the tests: the engine, and quick ways to draw holes and pieces. */
import '../js/engine.js';
import { FairDeal, turnWide } from '../src/den-deal';
import type { Cell, Engine, Letter } from '../src/engine';

/** The main puzzle's engine (js/engine.js sets it on globalThis). */
export const carp = (globalThis as unknown as { Carp: Engine }).Carp;

/** A hole drawn as rows: '#' a square to fill, '.' none. */
export const hole = (...rows: string[]): Cell[] => carp.parseRows(rows);

/** A piece's squares as a hole: its nth way of lying, moved along by dc columns. */
export const piece = (letter: Letter, n = 0, dc = 0): Cell[] =>
  carp.ORIENTS_BY_LETTER[letter][n].cells.map(([r, c]): Cell => [r, c + dc]);

/** A fair deal whose every choice is repeatable for a seed, so a failure can be rerun. */
export function seededDealer(seed = 1): FairDeal {
  carp.useSeed(seed);
  let a = (seed * 7919) % 2147483647;
  return new FairDeal(turnWide(carp), () => (a = (a * 16807) % 2147483647) / 2147483647);
}

/** How many of each. */
export const count = <T extends string>(xs: (T | null)[]): Partial<Record<T, number>> =>
  xs.reduce((m, x) => (x === null ? m : { ...m, [x]: (m[x] ?? 0) + 1 }), {} as Partial<Record<T, number>>);

/** The sloop's sea without its wind zones (src/den-wind.ts), for the tests of what the winds guard:
    the locks, say, sailed through under sail (the winds themselves: den-wind.test.ts). */
export const stilled = <T extends { zones: unknown[] }>(sea: T): T => { sea.zones = []; return sea; };
