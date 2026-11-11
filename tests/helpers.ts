/* Shared by the tests: the engine, and quick ways to draw holes and pieces. */
import '../js/engine.js';
import { FairDeal, turnWide } from '../src/den-deal';
import type { Cell, Engine, Letter } from '../src/engine';
import { SAIL, path, type Pose, type Sea } from '../src/den-sail';
import { gustPath } from '../src/den-sailing';
import { runFor } from '../src/sailing';

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

/** Every square the sloop can get to from the den without ever touching the way through the
    whirlpools (Sea.passage: the whirlpools, their winds, the gap), as she really goes: her own moves
    (under sail or at the oars), the winds after them, and a Sailing chain's gust from wherever she
    is, all as the helm plays them; any of it that touches the passage is left out. */
export function reachedAround(s: Sea): Set<string> {
  const k = (c: number, r: number) => `${c},${r}`, avoid = (c: number, r: number) => s.passage.has(k(c, r)) || !!s.whirlAt(c, r);
  const got = new Set<string>(), seen = new Set<string>();
  let edge: Pose[] = [{ ...SAIL.HOME }];
  const go = (to: Pose, next: Pose[]) => {
    const id = `${to.c},${to.r},${to.d}`;
    if (seen.has(id)) return;
    seen.add(id); got.add(k(to.c, to.r)); next.push(to);
  };
  while (edge.length) {
    const next: Pose[] = [];
    for (const p of edge) {
      for (const oars of [false, true]) for (const m of ['F', 'L', 'R'] as const) {
        const { to, bump, ride } = s.move(p, m, oars, true);
        if (bump || [...path(p, m).cells, [to.c, to.r], ...ride.map((q) => [q.c, q.r])].some(([c, r]) => avoid(c, r))) continue;
        go(ride.length ? ride[ride.length - 1] : to, next);
      }
      for (let steps = 1; steps <= 8; steps++) {
        const g = gustPath(s, p, runFor(steps));
        if (!g.length) continue;
        const end = g[g.length - 1], ride = s.ride(end, true);
        if ([...g, ...ride].some((q) => avoid(q.c, q.r))) continue;
        go(ride.length ? ride[ride.length - 1] : end, next);
      }
    }
    edge = next;
  }
  return got;
}
