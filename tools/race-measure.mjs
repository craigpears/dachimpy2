/* The sloop race's course, measured with the helm (11 Nov): what the simulation's numbers are read from,
   for laying the course out (LAY.RACE in src/den-sail.ts). Prints the long way's time, each starting
   spot's time through the start's field, and what each shortcut saves over the long way round its bend.
   tests/den-race.test.ts and tests/race-sim.test.ts hold the course to the same numbers; this is for
   seeing them all at once while reworking it.

   Run on the compiled js (npm run build first) with Node 22: node_modules/node/bin/node.exe tools/race-measure.mjs */

import { LAY, SAIL, Sea, Helm } from '../js/den-sail.js';
import { RACE, Race, spotPose } from '../js/den-race.js';
import { WIND } from '../js/den-wind.js';
import { runFor, RUN } from '../js/sailing.js';
import { TRIP } from '../js/den-crane.js';
import { DOOR } from '../js/den-door.js';

const RC = LAY.RACE, S = RC.STRETCHES, P = RC.SPITS, k = (c, r) => `${c},${r}`, DT = 0.05;
const shut = (...sq) => { const s = new Sea(9); for (const [c, r] of sq) s.rocks.add(k(c, r)); return s; };
const WAYS = [...RC.GUNS.way, ...RC.HEADWIND, ...RC.LOCKS.map((l) => l.at), ...RC.DOUBLE.WAY];
/** Sails from `h`'s pose to a pin; the seconds. */
function to(h, at, limit = 300) {
  h.drop(...at);
  let t = 0;
  while ((h.pin || h.slot >= 0 || h.gusts.length || h.rides.length) && t < limit) { h.tick(DT); t += DT; }
  return t;
}
function settle(h) { let t = 0; while ((h.cur || h.gusts.length || h.rides.length || h.slot >= 0) && t < 60) { h.tick(DT); t += DT; } return t; }
/** A gust of n squares now, played out: the seconds. */
function hop(h, n) { const sq = []; let p = h.pose; const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0]; for (let i = 0; i < n; i++) { p = { c: p.c + DC[p.d], r: p.r + DR[p.d], d: p.d }; sq.push(p); } h.gust(sq); return settle(h); }

/** The long way, from a spot on the line to over the finish, every shortcut shut, hopping the trade wind
    back up the course with a Double (it can't be sailed round). */
export function longWay(spot = RACE.RIVAL.SPOT, log = false) {
  const s = shut(...WAYS), h = new Helm(s, spotPose(spot));
  const legs = [];
  let t = 0;
  const go = (at) => { const dt = to(h, at); t += dt; legs.push([at.join(','), dt.toFixed(1), `${h.pose.c},${h.pose.r}`]); };
  go([SAIL.COLS - 2, P[0].r0]);
  go([3, P[1].r1]);
  go([RC.SNAKES.MID[0][0] - 1, S[2].r + 1]);
  h.pose.d = 1;
  const hp = hop(h, 2); t += hp; legs.push(['hop', hp.toFixed(1), `${h.pose.c},${h.pose.r}`]);
  go([SAIL.COLS - 2, P[2].r1]);
  go([3, P[3].r1]);
  go([SAIL.COLS - 2, P[4].r1]);
  go(RC.FINISH);
  if (log) console.log(legs.map((l) => l.join(' ')).join(' | '));
  return { t, at: h.pose };
}

if (process.argv[1].endsWith('race-measure.mjs')) {
  const sea = new Sea(9);
  const L = longWay(RACE.RIVAL.SPOT, true);
  console.log(`The long way from spot ${RACE.RIVAL.SPOT}: ${L.t.toFixed(1)} s, ends ${L.at.c},${L.at.r}`);
  // Each spot on the line: the seconds to the first bend (and to the gun gap's way in).
  const spots = [];
  for (let c = RC.LINE.c0; c <= RC.LINE.c1; c++) {
    const h = new Helm(shut(...WAYS), spotPose(c)), t = to(h, [SAIL.COLS - 2, P[0].r0]);
    const g = new Helm(sea, spotPose(c)), tg = to(g, [RC.GUNS.way[0][0], S[0].r + 1]);
    spots.push(`${c}:${t.toFixed(1)}/${tg.toFixed(1)}`);
  }
  console.log('Spots (to the first bend / to the gun gap):', spots.join(' '));
  // Each shortcut: the long way between, and her trip through.
  const G = RC.GUNS.way, B = RC.HEADWIND, M = RC.WHIRLS.MOUTH, Lk = RC.LOCKS, E = RC.CRANE, F = RC.FORAGE, D2 = RC.DOUBLE.WAY, T3 = RC.TRIPLE, Dr = RC.DOOR;
  const bends = {
    guns: [{ c: G[0][0], r: G[0][1] - 2, d: 1 }, [G[0][0], G[2][1] + 1]],
    headwind: [{ c: B[0][0], r: B[0][1] - 1, d: 3 }, [B[3][0], B[3][1] + 2]],
    double: [{ c: D2[0][0], r: D2[0][1] - 1, d: 3 }, [D2[2][0], D2[2][1] + 1]],
    whirls: [{ ...M }, RC.WHIRLS.OUT],
    forage: [{ c: F.NOTCH[0], r: F.NOTCH[1] - 1, d: 1 }, F.OUT],
    locks: [{ c: Lk[0].at[0], r: Lk[0].at[1] - 1, d: 3 }, [Lk[1].at[0], Lk[1].at[1] + 1]],
    crane: [{ c: E.LEDGE[0], r: E.LEDGE[1] - 1, d: 1 }, [E.TO.c, E.TO.r]],
    triple: [{ c: T3[0][0], r: T3[0][1] - 1, d: 1 }, [T3[1][0], T3[1][1] + 1]],
    door: [{ c: Dr.OFF[0][0], r: Dr.OFF[0][1], d: 3 }, Dr.INTO[0]],
  };
  const trips = {
    guns: () => { const h = new Helm(sea, { ...bends.guns[0], r: bends.guns[0].r + 1, d: 0 }); return hop(h, 4) + 0.5; },
    run: () => { const h = new Helm(sea, bends.guns[0]); return to(h, bends.guns[1]); },
    headwind: () => 1 + (B.length + 2) * WIND.OARS,
    double: () => { const h = new Helm(sea, { ...bends.double[0], d: 0 }); let t = to(h, D2[0]); h.pose.d = 0; t += hop(h, 2); return t + to(h, bends.double[1]); },
    whirls: () => runFor(RUN.VEGAS) * SAIL.PUSH,
    forage: () => { const s = new Sea(9); for (const [c, r] of F.BARRIER) { s.rocks.delete(k(c, r)); s.works.delete(k(c, r)); } const h = new Helm(s, { ...bends.forage[0], d: 0 }); return to(h, F.OUT); },
    locks: () => { const h = new Helm(sea, { ...bends.locks[0], d: 0 }); for (let i = 0; i < 4; i++) h.put('F'); let t = 0; for (; t < 90 && h.pose.r < bends.locks[1][1]; t += DT) { if (h.held() === 'up') h.pump(99); h.tick(DT); } return t; },
    crane: () => TRIP + 1,
    triple: () => { const h = new Helm(sea, { ...bends.triple[0], d: 0 }); return hop(h, 3) + 0.5; },
    door: () => DOOR.TRIP,
  };
  console.log(`the gun gap, run square by square: ${trips.run().toFixed(1)} s`);
  for (const [id, [from, at]] of Object.entries(bends)) {
    // (the long way round: every shortcut shut; across the trade wind back up the course with a Double)
    const h = new Helm(shut(...WAYS), from);
    let long;
    if (id === 'whirls') {
      long = to(h, [RC.SNAKES.MID[0][0] - 1, S[2].r + 1]);
      h.pose.d = 1; long += hop(h, 2);
      long += to(h, at);
    } else if (id === 'door') {
      long = to(h, [3, P[1].r1]) + to(h, [RC.SNAKES.MID[0][0] - 1, S[2].r + 1]);
      h.pose.d = 1; long += hop(h, 2);
      long += to(h, [SAIL.COLS - 2, P[2].r1]) + to(h, at);
    } else long = to(h, at);
    const trip = trips[id](), want = id === 'door' ? DOOR.SAVES : RACE.DECENT[id];
    console.log(`${id.padEnd(9)} long way ${long.toFixed(1).padStart(6)}  ended ${h.pose.c},${h.pose.r}  trip ${trip.toFixed(1).padStart(5)}  saves ${(long - trip).toFixed(1).padStart(6)}  (DECENT ${want})`);
  }
}
