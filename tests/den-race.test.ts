/* The sloop race (src/den-race.ts; its course LAY.RACE in src/den-sail.ts). The user, 11 Nov: "a winding,
   snakes and ladders, zigzagging kind of course, just with a lot of shortcuts, and each shortcut is a
   different puzzle, and you have to choose either the long way round, just ... without doing anything,
   and the long way it potentially involves running past some cannons", and of the first draft: "this
   will be out near where Primates Rule is ... We're going to have to go through several iterations of
   this course." */
import { describe, expect, it } from 'vitest';
import { LAY, SAIL, Sea, Helm, type Pose } from '../src/den-sail';
import { RACE, Race, GunGap, Drift, RIVAL_ROUTE, rivalAt, stretchAt, atStart, atFinish, cleanBest, clockText, neckCrane } from '../src/den-race';
import { gustPath } from '../src/den-sailing';
import { runFor, RUN } from '../src/sailing';
import { CRANE, TRIP } from '../src/den-crane';
import { WIND } from '../src/den-wind';
import { kikkitAt, onKikkitLanding } from '../src/den-kikkit';
import { mooredAt } from '../src/den-moored';
import { carp } from './helpers';
import type { DeckHole } from '../src/den-patch';
import type { Cell } from '../src/engine';

const RC = LAY.RACE, sea = new Sea(9), k = (c: number, r: number) => `${c},${r}`;
const DT = 0.05;

/** Sail her (under sail, by the pilot) from `from` to the square `to`: the seconds it takes, and where she ends. */
function sailTo(s: Sea, from: Pose, to: [number, number]): { t: number; at: Pose; oars: boolean } {
  const h = new Helm(s, from);
  h.drop(...to);
  let t = 0;
  while ((h.pin || h.slot >= 0) && t < 600) { h.tick(DT); t += DT; }
  return { t, at: { ...h.pose }, oars: h.oars };
}
/** The sea with these squares shut (a shortcut's way through), to sail round it the long way. */
function shut(...sq: [number, number][]): Sea { const s = new Sea(9); for (const [c, r] of sq) s.rocks.add(k(c, r)); return s; }
/** Played out till nothing's carrying her. */
function settle(h: Helm, secs = 60) { for (let t = 0; t < secs && (h.cur || h.gusts.length || h.rides.length || h.slot >= 0 || h.whirling() || h.mine.length || h.strokes.length || h.pin); t += DT) h.tick(DT); }
const at = (cells: Cell[]): [number, number] => [Math.min(...cells.map((p) => p[0])), Math.min(...cells.map((p) => p[1]))];
const norm = (cells: Cell[]): Cell[] => { const [r0, c0] = at(cells); return cells.map(([r, c]): Cell => [r - r0, c - c0]); };
const fill = (hole: DeckHole) => { for (const p of carp.solve(hole.open(), 1)[0]) hole.put(p.letter, norm(p.cells), ...at(p.cells)); };

/** Each shortcut: the square on the leg before it and the one on the leg after, the way she faces
    going in, and the squares that are its way through (shut, she has to go round). */
const G = RC.GUNS.gap, B = RC.HEADWIND, M = RC.WHIRLS.MOUTH, L = RC.LOCKS, E = RC.CRANE;
const BENDS = {
  guns: { from: { c: G[0], r: G[1] - 2, d: 1 }, to: [G[0], G[1] + 1] as [number, number], way: [G] },
  headwind: { from: { c: B[0][0], r: B[0][1] - 1, d: 3 }, to: [B[0][0], B[2][1] + 1] as [number, number], way: B },
  whirls: { from: { ...M }, to: RC.WHIRLS.OUT, way: [] as [number, number][] },
  locks: { from: { c: L[0].at[0], r: L[0].at[1] - 1, d: 3 }, to: [L[1].at[0], L[1].at[1] + 1] as [number, number], way: L.map((l) => l.at) },
  crane: { from: { c: E.LEDGE[0], r: E.LEDGE[1], d: 1 }, to: [E.TO.c, E.TO.r] as [number, number], way: [] as [number, number][] },
};

describe('where the course is: out past Primates Rule, a place of its own (11 Nov)', () => {
  it('lies past Primates Rule, behind a line of rocks with one gate, its buoy off the gate on the open sea', () => {
    expect(RC.R0).toBeGreaterThan(Math.max(...LAY.PRIMATES.AT.map(([, r]) => r)));
    for (let c = 0; c < SAIL.COLS; c++) expect(sea.open(c, RC.R0), `${c}`).toBe(RC.GATE.some(([g]) => g === c));
    // (the gate right of the old wreck's wind, so the line shuts its far end: no way round it to the locks' foot)
    const Z = LAY.ZONES[0];
    expect(Z.r1).toBe(RC.R0 - 1);
    for (const [c] of RC.GATE) expect(c).toBeGreaterThan(Z.c1);
    for (let c = RC.START.c0; c <= RC.START.c1; c++) for (let r = RC.START.r0; r <= RC.START.r1; r++) {
      expect(sea.open(c, r)).toBe(true);
      expect(mooredAt(c, r) || kikkitAt(c, r) || onKikkitLanding(c, r)).toBe(false);
    }
    expect(atStart(...RC.BUOY)).toBe(true);
    // (and sailed up to from the den's mooring, under sail)
    expect(sea.plot(SAIL.HOME, ...RC.BUOY)).not.toBeNull();
  }, 60000);

  it('five legs back and forth and the run home, a spit of land between each pair', () => {
    expect(RC.STRETCHES).toHaveLength(6);
    expect(RC.SPITS).toHaveLength(5);
    RC.STRETCHES.forEach((s, i) => {
      if (i) expect(s.d).not.toBe(RC.STRETCHES[i - 1].d);
      for (let c = 2; c < SAIL.COLS; c++) for (const r of [s.r, s.r + 1]) expect(sea.ground(c, r), `${c},${r}`).toBe(false);
    });
    RC.SPITS.forEach((sp, i) => {
      expect(sp.r0).toBe(RC.STRETCHES[i].r + 2);
      expect(sp.r1 + 1).toBe(RC.STRETCHES[i + 1].r);
      // (round its end the way the stretch before it's sailed)
      expect(sp.bend).toBe(RC.STRETCHES[i].d === 1 ? 'R' : 'L');
    });
  });

  it('the trade wind home sweeps her up to the finish, by the gate', () => {
    const h = new Helm(sea, { c: 1, r: RC.STRETCHES[5].r, d: 3 });
    h.put('F');
    settle(h);
    expect([h.pose.c, h.pose.r]).toEqual(RC.FINISH);
    expect(atFinish(h.pose.c, h.pose.r)).toBe(true);
    expect(Math.abs(RC.FINISH[0] - RC.GATE[0][0])).toBeLessThanOrEqual(9);
  });
});

describe('the course reachable both ways round every bend (11 Nov)', () => {
  for (const [name, b] of Object.entries(BENDS)) {
    it(`${name}: the long way round, under sail, no puzzle`, () => {
      const got = sailTo(shut(...b.way), b.from, b.to);
      expect([got.at.c, got.at.r]).toEqual(b.to);
      expect(got.oars).toBe(false);
    }, 60000);
  }

  it('the long way, start to finish, under sail, no puzzle: the race is run and the clock stops', () => {
    // (every shortcut shut, so the pilot can't take one; pins round each bend in turn, as you'd drop them)
    const s = shut(G, ...B, ...L.map((l) => l.at));
    const h = new Helm(s, { c: RC.BUOY[0], r: RC.BUOY[1], d: 0 }), race = new Race();
    race.start();
    const pins: [number, number][] = [[25, RC.SPITS[0].r0], [3, RC.SPITS[1].r1], [25, RC.SPITS[2].r1], [3, RC.SPITS[3].r1], [25, RC.SPITS[4].r1], [1, RC.STRETCHES[5].r]];
    let t = 0;
    for (const p of pins) {
      h.drop(...p);
      while ((h.pin || h.slot >= 0) && t < 900) { h.tick(DT); race.tick(DT, h.pose); t += DT; }
    }
    h.put('F');   // (into the trade wind home)
    for (let i = 0; i < 400 && race.state !== 'done'; i++) { h.tick(DT); race.tick(DT, h.pose); }
    expect(race.state).toBe('done');
    expect(race.leg).toBe(5);
    expect(h.oars).toBe(false);
    // (a few minutes: "it should be significant")
    expect(race.t).toBeGreaterThan(180);
    expect(race.t).toBeLessThan(330);
  }, 120000);
});

describe('each shortcut only passable by its puzzle (11 Nov)', () => {
  it('[A] the gun gap: a square at a time she\'s a sitting duck; a heavy combo rushes her past; or knock its guns out by Gunnery', () => {
    const run = (gap: GunGap, h: Helm, secs: number) => {
      let hits = 0;
      for (let t = 0; t < secs; t += 1 / 60) {
        h.tick(1 / 60);
        for (const e of gap.tick(1 / 60, h.spared() ? null : h.now(), h.pose)) if (e.kind === 'land' && e.hit) { h.hit(); hits++; }
        if (h.dazed()) fill(h.hole!);
      }
      return hits;
    };
    // Under sail, a square at a time: light airs in the gap, and she's hit.
    let gap = new GunGap(), h = new Helm(sea, { c: G[0], r: G[1] - 1, d: 0 });
    h.put('F'); h.put('F');
    expect(run(gap, h, 20)).toBeGreaterThan(0);
    expect([h.pose.c, h.pose.r]).toEqual([G[0], G[1] + 1]);
    // A heavy combo: a Sailing chain's boost from the leg before, clean past their marks.
    gap = new GunGap(); h = new Helm(sea, { c: G[0], r: G[1] - 2, d: 0 });
    const squares = gustPath(sea, h.pose, runFor(4));
    expect(squares.map((p) => [p.c, p.r])).toContainEqual([G[0], G[1] + 1]);
    h.gust(squares);
    expect(run(gap, h, 6)).toBe(0);
    expect(h.pose.r).toBeGreaterThan(G[1]);
    // Its guns knocked out by hers (loaded by Gunnery): three hits each, and the gap's safe a square at a time.
    gap = new GunGap();
    for (const [c, r] of RC.GUNS.at) for (let i = 0; i < 3; i++) gap.shot(c, r);
    expect(gap.silenced()).toBe(true);
    h = new Helm(sea, { c: G[0], r: G[1] - 1, d: 0 });
    h.put('F'); h.put('F');
    expect(run(gap, h, 20)).toBe(0);
    // (and her shot on one rouses them both: it's a fight, as at the checkpoint)
    gap = new GunGap();
    expect(gap.shot(...RC.GUNS.at[0])).toEqual({ gun: 0, did: 'quiet', first: true });
    expect(gap.guns.every((t) => t.roused)).toBe(true);
  });

  it('[B] the headwind gap: no sail gets through; rowed, she does; idle in it, she drifts back out', () => {
    const b = BENDS.headwind;
    // Under sail the pilot won't take her through, and her own move into it is in irons.
    expect(sea.irons({ c: B[0][0], r: B[0][1] - 1, d: 0 }, 'F')).toBe(true);
    const h = new Helm(sea, { c: B[0][0], r: B[0][1] - 1, d: 0 });
    h.put('F'); settle(h);
    expect(h.pose.r).toBe(B[0][1] - 1);
    // Rowed: four squares straight through (the board's strokes: src/den-row.ts).
    h.row(true);
    h.stroke(['F', 'F', 'F', 'F']);
    settle(h);
    expect([h.pose.c, h.pose.r]).toEqual(b.to);
    // Idle in it at the oars, the wind blows her back a square at a time, out the way she came.
    const g = new Helm(sea, { c: B[1][0], r: B[1][1], d: 0 }), drift = new Drift();
    g.row(true);
    for (let t = 0; t < RACE.DRIFT * 3 + 2; t += DT) { const back = drift.tick(DT, g); if (back) g.gust([back]); g.tick(DT); }
    expect(g.pose.r).toBe(B[0][1] - 1);
    // (but not while she's being rowed on)
    const n = new Drift(), r = new Helm(sea, { c: B[0][0], r: B[0][1], d: 0 });
    r.row(true);
    let pushed = 0;
    for (let t = 0; t < 4; t += DT) { if (r.slot < 0 && !r.strokes.length && r.pose.r < B[2][1] + 1) r.stroke(['F']); if (n.tick(DT, r)) pushed++; r.tick(DT); }
    expect(pushed).toBe(0);
  });

  it('[C] the whirlpool reef: only a Vegas from its mouth carries her over; less, and its winds bring her back to the mouth', () => {
    for (let steps = 1; steps <= RUN.VEGAS; steps++) {
      const h = new Helm(sea, { ...M });
      h.gust(gustPath(sea, h.pose, runFor(steps)));
      settle(h, 120);
      if (steps === RUN.VEGAS) expect([h.pose.c, h.pose.r], `steps ${steps}`).toEqual(RC.WHIRLS.OUT);
      else expect([h.pose.c, h.pose.r, h.pose.d], `steps ${steps}`).toEqual([M.c, M.r, M.d]);
    }
    // A gust from anywhere else stops short of it, and the pilot never sails her in.
    const by = { c: M.c + 1, r: M.r, d: 0 };
    expect(gustPath(sea, by, runFor(RUN.VEGAS)).some((p) => sea.passage.has(k(p.c, p.r)))).toBe(false);
    expect(sea.plot(M, ...RC.WHIRLS.OUT)!.length).toBeGreaterThan(10);
  }, 60000);

  it('[D] the locks: she waits in the first till it\'s pumped up by Bilge; then up, along and down', () => {
    const h = new Helm(sea, { c: L[0].at[0], r: L[0].at[1] - 1, d: 0 });
    for (let i = 0; i < 4; i++) h.put('F');
    for (let t = 0; t < 30; t += DT) h.tick(DT);
    expect([h.pose.c, h.pose.r]).toEqual(L[0].at);
    expect(h.held()).toBe('up');
    for (let t = 0; t < 60 && h.pose.r < BENDS.locks.to[1]; t += DT) { if (h.held() === 'up') h.pump(1); h.tick(DT); }
    expect([h.pose.c, h.pose.r]).toEqual(BENDS.locks.to);
    // (and the pilot never takes her up a lock on her own: the long way's her course)
    expect(sea.plot(BENDS.locks.from, ...BENDS.locks.to)!.length).toBeGreaterThan(10);
  });

  it('[E] the crane on the neck: alongside its ledge, it hauls her over only once it\'s built by Carpentry', () => {
    const crane = neckCrane(), h = new Helm(sea, { ...BENDS.crane.from });
    expect(crane.ledge).toEqual(E.LEDGE);
    expect(crane.alongside(h)).toBe(true);
    expect(crane.haul()).toBe(false);
    // Each part's frame filled with pieces (Carpentry), sawn and raised.
    for (let i = 0; i < CRANE.PARTS.length; i++) {
      const f = crane.build()!;
      for (const p of carp.solve(f.open(), 1)[0]) f.put(p.letter, norm(p.cells), ...at(p.cells));
      expect(crane.raise()[0]).toMatchObject({ kind: 'part', part: i });
    }
    expect(crane.built()).toBe(true);
    expect(crane.haul()).toBe(true);
    expect(crane.tick(TRIP + 0.1)).toEqual([{ kind: 'arrive', where: 'lagoon' }]);
    // (where it sets her down: the run home, open water, facing along it)
    expect(sea.open(E.TO.c, E.TO.r)).toBe(true);
    expect(stretchAt(E.TO.c, E.TO.r)).toBe(5);
    expect(E.TO.d).toBe(RC.STRETCHES[5].d);
    // Not anywhere else on the leg.
    expect(neckCrane().alongside(new Helm(sea, { ...BENDS.crane.from, c: E.LEDGE[0] + 1 }))).toBe(false);
  });
});

describe('each shortcut saves about what a decent player takes on its puzzle (11 Nov)', () => {
  // The long way round its bend, sailed, less the shortcut's own sailing (or rowing, or the crane's
  // trip): within a quarter of RACE.DECENT's time for its puzzle.
  const through = {
    guns: () => sailTo(sea, BENDS.guns.from, BENDS.guns.to).t,
    headwind: () => 1 + (BENDS.headwind.to[1] - BENDS.headwind.from.r) * WIND.OARS,
    whirls: () => runFor(RUN.VEGAS) * SAIL.PUSH,
    locks: () => {
      const h = new Helm(sea, { ...BENDS.locks.from, d: 0 });
      for (let i = 0; i < 4; i++) h.put('F');
      let t = 0;
      for (; t < 90 && h.pose.r < BENDS.locks.to[1]; t += DT) { if (h.held() === 'up') h.pump(99); h.tick(DT); }
      return t;
    },
    crane: () => TRIP,
  };
  for (const [name, b] of Object.entries(BENDS) as [keyof typeof BENDS, typeof BENDS.guns][]) {
    it(`${name}: about ${RACE.DECENT[name]} seconds`, () => {
      const long = sailTo(shut(...b.way), b.from, b.to).t, saves = long - through[name]();
      expect(saves).toBeGreaterThan(RACE.DECENT[name] * 0.75);
      expect(saves).toBeLessThan(RACE.DECENT[name] * 1.25);
    }, 60000);
  }
});

describe('the rival: one sloop, the long way, at a set pace (11 Nov)', () => {
  it('sails open water all the way round, every bend, and home up the trade wind', () => {
    for (let i = 1; i < RIVAL_ROUTE.length; i++) {
      const [a, b] = [RIVAL_ROUTE[i - 1], RIVAL_ROUTE[i]];
      expect(a[0] === b[0] || a[1] === b[1], `${a} to ${b}`).toBe(true);
      const n = Math.ceil(Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1])) * 2;
      for (let j = 0; j <= n; j++) {
        const c = a[0] + (b[0] - a[0]) * j / n, r = a[1] + (b[1] - a[1]) * j / n;
        for (const [x, y] of [[Math.floor(c + 0.01), Math.floor(r + 0.01)], [Math.ceil(c - 0.01), Math.ceil(r - 0.01)]]) {
          expect(sea.ground(x, y) || sea.isRock(x, y) || !!sea.whirlAt(x, y), `${x},${y}`).toBe(false);
        }
      }
    }
    expect(RIVAL_ROUTE[RIVAL_ROUTE.length - 1]).toEqual(RC.FINISH);
  });

  it('finishes at its pace, and the race says so; beaten only on the shortcuts', () => {
    expect(rivalAt(0).home).toBe(false);
    expect(rivalAt(RACE.RIVAL.SECS - 1).home).toBe(false);
    const end = rivalAt(RACE.RIVAL.SECS + 0.01);
    expect(end.home).toBe(true);
    expect([end.c, end.r]).toEqual(RC.FINISH);
    const race = new Race();
    race.start();
    const said: string[] = [];
    for (let t = 0; t < RACE.COUNT + RACE.RIVAL.SECS + 1; t += 0.5) said.push(...race.tick(0.5, { c: RC.BUOY[0], r: RC.BUOY[1] }).map((e) => e.kind));
    expect(said).toEqual(['count', 'count', 'go', 'rival']);
    // Quicker than the long way sailed (about 4 minutes), slower than every shortcut taken by a decent player.
    const decent = Object.values(RACE.DECENT).reduce((a, b) => a + b, 0);
    expect(RACE.RIVAL.SECS).toBeLessThan(240);
    expect(RACE.RIVAL.SECS).toBeGreaterThan(240 - decent);
  });
});

describe('the race: the clock, in order, your best kept (11 Nov)', () => {
  it('counts every stretch in order, and the finish only once she\'s been round', () => {
    const race = new Race();
    expect(race.start()).toBe(true);
    expect(race.start()).toBe(false);
    race.tick(RACE.COUNT + 0.01, { c: RC.BUOY[0], r: RC.BUOY[1] });
    expect(race.state).toBe('on');
    // Straight to the finish (round by the open sea, say): not finished.
    expect(race.tick(1, { c: RC.FINISH[0], r: RC.FINISH[1] })).toEqual([]);
    // A leg out of order doesn't count.
    expect(race.tick(1, { c: 10, r: RC.STRETCHES[2].r })).toEqual([]);
    for (let n = 1; n < 6; n++) expect(race.tick(1, { c: 10, r: RC.STRETCHES[n].r })).toEqual([{ kind: 'leg', n }]);
    const e = race.tick(1, { c: RC.FINISH[0], r: RC.FINISH[1] });
    expect(e).toEqual([{ kind: 'finish', secs: race.t, best: true, won: true }]);
    expect(race.best).toBeCloseTo(race.t);
  });

  it('sailed back out through the gate once she is through it, the race is off; waiting outside it, it is not', () => {
    const race = new Race();
    race.start(); race.tick(RACE.COUNT + 0.01, { c: RC.BUOY[0], r: RC.BUOY[1] });
    expect(race.tick(5, { c: RC.BUOY[0], r: RC.BUOY[1] })).toEqual([]);
    race.tick(1, { c: RC.GATE[0][0], r: RC.R0 + 1 });
    expect(race.tick(1, { c: RC.GATE[0][0], r: RC.R0 - 1 })).toEqual([{ kind: 'quit' }]);
    expect(race.state).toBe('off');
  });

  it('keeps your best time: a slower one doesn\'t replace it', () => {
    const race = new Race(100);
    race.start(); race.tick(RACE.COUNT + 0.01, { c: 9, r: 36 });
    for (let n = 1; n < 6; n++) race.tick(0, { c: 10, r: RC.STRETCHES[n].r });
    race.tick(150, { c: RC.FINISH[0], r: RC.FINISH[1] });
    expect(race.best).toBe(100);
    expect(cleanBest('123.4')).toBe(123.4);
    for (const bad of [null, 'x', -3, 0, {}, 1e9]) expect(cleanBest(bad)).toBeNull();
    expect(clockText(187.43)).toBe('3:07.4');
  });
});

describe('the starlit door\'s place, kept for later (11 Nov)', () => {
  it('a plain cliff face off leg 2, and a tunnel\'s end onto leg 5, clear of every shortcut', () => {
    const D = RC.DOOR;
    for (const [c, r] of [...D.FACE, ...D.OUT]) expect(sea.ground(c, r), `${c},${r}`).toBe(true);
    for (const [c, r] of D.OFF) { expect(sea.open(c, r)).toBe(true); expect(stretchAt(c, r)).toBe(1); }
    for (const [c, r] of D.INTO) { expect(sea.open(c, r)).toBe(true); expect(stretchAt(c, r)).toBe(4); }
    const ways = new Set([G, ...RC.GUNS.at, ...B, ...L.map((l) => l.at), ...RC.POUND.at, E.LEDGE].map(([c, r]) => k(c, r)));
    for (const [c, r] of [...D.FACE, ...D.OUT]) for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) expect(ways.has(k(c + a, r + b))).toBe(false);
  });
});
