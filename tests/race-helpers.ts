/* Shared by the sloop race's tests (den-race, den-door, race-sim): sailing her about its course with the
   helm, as tools/race-measure.mjs does. */
import { LAY, SAIL, Sea, Helm, type Pose } from '../src/den-sail';
import { gustPath } from '../src/den-sailing';

const RC = LAY.RACE, S = RC.STRETCHES, P = RC.SPITS;
export const k = (c: number, r: number) => `${c},${r}`;
export const DT = 0.05;

/** The sea with these squares shut (a shortcut's way through), to sail round it the long way. */
export function shut(...sq: [number, number][]): Sea { const s = new Sea(9); for (const [c, r] of sq) s.rocks.add(k(c, r)); return s; }
/** Every shortcut's way through the spits, shut: the long way. */
export const WAYS: [number, number][] = [...RC.GUNS.way, ...RC.HEADWIND, ...RC.LOCKS.map((l) => l.at), ...RC.DOUBLE.WAY];

/** Played out till nothing's carrying her. */
export function settle(h: Helm, secs = 60): number {
  let t = 0;
  for (; t < secs && (h.cur || h.gusts.length || h.rides.length || h.slot >= 0 || h.whirling() || h.mine.length || h.strokes.length || h.pin); t += DT) h.tick(DT);
  return t;
}
/** Sails her (under sail, by the pilot) to a pin: the seconds it takes. */
export function sail(h: Helm, to: [number, number], limit = 600, each?: () => void): number {
  h.drop(...to);
  let t = 0;
  while ((h.pin || h.slot >= 0 || h.gusts.length || h.rides.length) && t < limit) { h.tick(DT); t += DT; each?.(); }
  return t;
}
/** Sail from `from` to the square `to`: the seconds it takes, and where she ends. */
export function sailTo(s: Sea, from: Pose, to: [number, number]): { t: number; at: Pose; oars: boolean } {
  const h = new Helm(s, from), t = sail(h, to);
  return { t, at: { ...h.pose }, oars: h.oars };
}
/** A gust of `n` squares from where she is, the way she's facing (a Sailing chain's), played out: the seconds. */
export function hop(h: Helm, n: number, d = h.pose.d, each?: () => void): number {
  h.pose.d = d;
  h.gust(gustPath(h.sea, h.pose, n));
  let t = 0;
  while ((h.cur || h.gusts.length || h.rides.length || h.slot >= 0) && t < 60) { h.tick(DT); t += DT; each?.(); }
  return t;
}
/** The trade wind back up the course, hopped with a Double (it can't be sailed round): from leg 3's
    second row beside it. */
export const BEFORE_MID: [number, number] = [RC.SNAKES.MID[0][0] - 1, S[2].r + 1];
/** The long way, from `h`'s pose on the starting line to over the finish, every shortcut shut: round
    each spit's end (spit 1's by way of the fort's bay since 13 Nov: round its mole's end and on round buoy 1),
    hopping the trade wind back up the course with a Double. `each` after every tick. */
export function longWay(h: Helm, each?: () => void): number {
  let t = 0;
  for (const p of [[SAIL.COLS - 2, P[0].r0], RC.BAY.TURN, [SAIL.COLS - 2, P[0].r1], [3, P[1].r1], BEFORE_MID] as [number, number][]) t += sail(h, p, 600, each);
  t += hop(h, 2, 1, each);
  for (const p of [[SAIL.COLS - 2, P[2].r1], [3, P[3].r1], [SAIL.COLS - 2, P[4].r1], RC.FINISH] as [number, number][]) t += sail(h, p, 600, each);
  return t;
}
