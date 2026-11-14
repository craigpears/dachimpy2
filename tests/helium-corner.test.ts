/* Helium's corner, one way in and one way out (14 Nov; LAY.HELIUM in src/den-sail.ts). The user, on the rum
   run: "If you want to get to Helium's hideout, you have to do a 90-degree turn by rowing, because there's no
   way of bumping yourself there. I really like that ... I think that should be the only way of getting to
   Helium's little corner ... But there should be a wind still so that you can get from his den to the front of
   where the Imperial Fort is. So it kind of becomes a one-way thing of getting back out." */
import { describe, expect, it } from 'vitest';
import { LAY, SAIL, Sea, Helm, type Move, type Pose } from '../src/den-sail';
import { gustPath } from '../src/den-sailing';
import { runFor } from '../src/sailing';
import { HELIUM_ARRIVE, HELIUM_MOOR, onHeliumLanding } from '../src/den-helium';
import { EMPIRE_OFF, empireAt } from '../src/den-imperial';
import { MOUTH, OUT } from '../src/den-kikkit';

const k = (c: number, r: number) => `${c},${r}`;
const sea = new Sea(9);   // (the den's own sea)
const SQUARES = Array.from({ length: SAIL.COLS * SAIL.ROWS }, (_, i) => [i % SAIL.COLS, Math.floor(i / SAIL.COLS)] as [number, number]);

/** Their corner: the water joining their island's without crossing a wind, or the wind of its own on its way in. */
const CORNER = (() => {
  const got = new Set<string>(), at: [number, number][] = [];
  const go = (c: number, r: number) => {
    if (got.has(k(c, r)) || !sea.open(c, r) || sea.windAt(c, r) !== undefined || sea.zoneAt(c, r)) return;
    got.add(k(c, r)); at.push([c, r]);
  };
  for (const [c, r] of SQUARES) if (onHeliumLanding(c, r)) go(c, r);
  for (let i = 0; i < at.length; i++) { const [c, r] = at[i]; go(c + 1, r); go(c - 1, r); go(c, r + 1); go(c, r - 1); }
  return got;
})();
const WAY_IN = LAY.HELIUM.WAY_IN;
const inside = (p: { c: number; r: number }) => CORNER.has(k(p.c, p.r)) || (p.c >= WAY_IN.c0 && p.c <= WAY_IN.c1 && p.r >= WAY_IN.r0 && p.r <= WAY_IN.r1);

/** Where she comes to rest from here: a whirlpool has her, round and round till it lets her go (the helm plays it). */
const rest = new Map<string, Pose>();
function settle(p: Pose): Pose {
  if (!sea.whirlAt(p.c, p.r)) return p;
  const id = `${p.c},${p.r},${p.d}`;
  if (!rest.has(id)) {
    const h = new Helm(sea, p);
    for (let t = 0; t < 40; t += 0.05) h.tick(0.05);
    rest.set(id, { ...h.pose });
  }
  return rest.get(id)!;
}

interface Step { from: Pose; how: Move | 'gust'; oars: boolean; to: Pose }
/** Every way she can go from the den, as she really goes: her own moves (bumps and all; at the oars too, with
    `oars`), the winds after them, a Sailing chain's gust of any size from wherever she is, the whirlpools having
    her; this side of the race's line of rocks. Each step taken, and the squares reached. */
function walk(oars: boolean, step: (s: Step) => void = () => {}): Set<string> {
  const seen = new Set<string>(), got = new Set<string>();
  let edge: Pose[] = [{ ...SAIL.HOME }];
  const go = (s: Step, next: Pose[]) => {
    step(s);
    const { to } = s, id = `${to.c},${to.r},${to.d}`;
    if (to.r >= LAY.RACE.R0 || seen.has(id)) return;
    seen.add(id); got.add(k(to.c, to.r)); next.push(to);
  };
  while (edge.length) {
    const next: Pose[] = [];
    for (const p of edge) {
      for (const rig of oars ? [false, true] : [false]) for (const m of ['F', 'L', 'R'] as Move[]) {
        const { to, ride } = sea.move(p, m, rig, true);
        go({ from: p, how: m, oars: rig, to: settle(ride.length ? ride[ride.length - 1] : to) }, next);
      }
      for (let steps = 1; steps <= 12; steps++) {
        const g = gustPath(sea, p, runFor(steps));
        if (!g.length) continue;
        const end = g[g.length - 1], ride = sea.whirlAt(end.c, end.r) ? [] : sea.ride(end, true);
        go({ from: p, how: 'gust', oars: false, to: settle(ride.length ? ride[ride.length - 1] : end) }, next);
      }
    }
    edge = next;
  }
  return got;
}

describe('"I think that should be the only way of getting to Helium\'s little corner" (14 Nov)', () => {
  it('their corner is shut in: rocks drawn as the reef across its bottom, its water hidden as the smugglers\' run is', () => {
    for (const [c, r] of LAY.HELIUM.ROCKS) { expect(sea.isRock(c, r)).toBe(true); expect(sea.reef.has(k(c, r)), `${c},${r}`).toBe(true); }
    expect(CORNER.size).toBeGreaterThan(80);
    for (const [c, r] of SQUARES) if (onHeliumLanding(c, r) && sea.open(c, r)) expect(CORNER.has(k(c, r))).toBe(true);
    for (const id of CORNER) expect(sea.hidden.has(id), id).toBe(true);
    // (nothing else's water in it: not Port Decorum's front, nor the race's buoy, nor Kikkit's reef's far side)
    expect(CORNER.has(k(EMPIRE_OFF.c, EMPIRE_OFF.r))).toBe(false);
    expect(CORNER.has(k(...LAY.RACE.BUOY))).toBe(false);
    expect(CORNER.has(k(...OUT))).toBe(false);
  });

  it('under sail there\'s no way in: every move, bump, wind, gust and whirlpool from the den stops outside it', () => {
    const got = walk(false);
    // (a real search: past the checkpoint to Port Decorum's front, and over Kikkit's reef by her Double)
    expect(got.has(k(EMPIRE_OFF.c, EMPIRE_OFF.r))).toBe(true);
    expect(got.has(k(...OUT))).toBe(true);
    for (const id of got) expect(CORNER.has(id), id).toBe(false);
    expect(got.has(k(WAY_IN.c0, WAY_IN.r0))).toBe(false);
  }, 60000);

  it('the one way in is rowed: off Kikkit\'s reef\'s far side (her Double), turned to starboard and rowed in', () => {
    const ways: Step[] = [];
    const got = walk(true, (s) => { if (!inside(s.from) && inside(s.to)) ways.push(s); });
    expect(got.has(k(HELIUM_MOOR.c, HELIUM_MOOR.r))).toBe(true);
    expect(ways.length).toBeGreaterThan(0);
    for (const s of ways) {
      expect(s.oars, JSON.stringify(s)).toBe(true);
      expect([s.from.c, s.from.r, s.from.d, s.how]).toEqual([...OUT, 1, 'F']);
    }
    // As it goes: the Double over the reef leaves her facing out to sea; a turn to starboard (the reef's in the way,
    // so she turns where she is); under sail she's in irons heading in, a chain's gust stops short, and the oars take her.
    const off: Pose = { c: OUT[0], r: OUT[1], d: MOUTH.d }, turned = sea.move(off, 'R', false, true);
    expect(turned.to).toEqual({ c: OUT[0], r: OUT[1], d: 1 });
    expect(sea.move(turned.to, 'F', false, true).irons).toBe(true);
    for (let steps = 1; steps <= 12; steps++) expect(gustPath(sea, turned.to, runFor(steps))).toEqual([]);
    expect(sea.move(turned.to, 'F', true, true).to).toEqual({ c: WAY_IN.c0, r: WAY_IN.r0, d: 1 });
  }, 60000);

  it('the pilot never takes her in from outside: a pin dropped by their island lands outside the corner', () => {
    expect(sea.plot(EMPIRE_OFF, HELIUM_MOOR.c, HELIUM_MOOR.r)).toBeNull();
    expect(sea.plot(EMPIRE_OFF, HELIUM_MOOR.c, HELIUM_MOOR.r, null, true)).toBeNull();
    expect(CORNER.has(k(...sea.pinAt(HELIUM_MOOR.c, HELIUM_MOOR.r, EMPIRE_OFF)!))).toBe(false);
  }, 30000);
});

describe('"there should be a wind still so that you can get from his den to the front of where the Imperial Fort is" (14 Nov)', () => {
  /** Off their island onto the wind: where it leaves her. */
  const out = () => {
    const [c, r] = LAY.HELIUM.WIND[0].at, from: Pose = { c, r: r - 1, d: 0 };
    expect(onHeliumLanding(from.c, from.r)).toBe(true);
    const { to, ride, bump } = sea.move(from, 'F', false, true);
    expect(bump).toBe(false);
    return { to, ride, end: ride[ride.length - 1] };
  };

  it('starts beside their island, and carries her out of the corner round Port Decorum\'s back', () => {
    const { ride, end } = out();
    expect(ride.length).toBeGreaterThan(15);
    expect(inside(end)).toBe(false);
    expect(ride.some((p) => p.r > Math.max(...LAY.EMPIRE.LAND.map(([, y]) => y)))).toBe(true);
    // (every square of it a wind: she's never left on it)
    for (const p of ride.slice(0, -1)) expect(sea.windAt(p.c, p.r), `${p.c},${p.r}`).toBeDefined();
    expect(sea.windAt(end.c, end.r)).toBeUndefined();
  });

  it('leaves her heading up Port Decorum\'s side, open water all the way to its front, and on to its jetty', () => {
    const { end } = out();
    expect(end.d).toBe(2);
    const front = LAY.EMPIRE.JETTY[1];
    for (let r = end.r - 1; r >= front - 1; r--) {
      expect(sea.open(end.c, r) && sea.windAt(end.c, r) === undefined && !sea.zoneAt(end.c, r), `${end.c},${r}`).toBe(true);
      expect(empireAt(end.c, r)).toBe(false);
    }
    const way = sea.plot(end, EMPIRE_OFF.c, EMPIRE_OFF.r);
    expect(way).not.toBeNull();
    expect(way!.length).toBeLessThanOrEqual(end.r - EMPIRE_OFF.r + 2);
    // (and the pilot takes it: from their island to Port Decorum's front under sail, by the wind)
    expect(sea.plot(HELIUM_ARRIVE, EMPIRE_OFF.c, EMPIRE_OFF.r)).not.toBeNull();
  });

  it('is one way: nothing sailed or rowed onto it from outside carries her back in (the way in above is the only one)', () => {
    for (const { at: [c, r], d, n } of LAY.HELIUM.WIND) for (let i = 0; i < n; i++) {
      const x = c + [0, 1, 0, -1][d] * i, y = r + [1, 0, -1, 0][d] * i;
      for (let f = 0; f < 4; f++) {
        const ride = sea.ride({ c: x, r: y, d: f }, true), end = ride[ride.length - 1];
        expect(inside(end), `${x},${y}`).toBe(false);
      }
    }
    // (out of its gap it bends, and the square on past the bend is rock, so no gust runs in along it)
    const gap = LAY.HELIUM.WIND[1];
    expect(LAY.HELIUM.WIND[2].d).not.toBe(gap.d);
    expect(sea.isRock(gap.at[0] - gap.n - 1, gap.at[1])).toBe(true);
  });
});
