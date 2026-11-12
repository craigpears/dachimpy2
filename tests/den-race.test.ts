/* The sloop race (src/den-race.ts; its course LAY.RACE in src/den-sail.ts). The user, 11 Nov: "a winding,
   snakes and ladders, zigzagging kind of course, just with a lot of shortcuts, and each shortcut is a
   different puzzle, and you have to choose either the long way round, just ... without doing anything,
   and the long way it potentially involves running past some cannons", and of the first draft: "this
   will be out near where Primates Rule is ... We're going to have to go through several iterations of
   this course." Its second pass (11 Nov): snakes, shortcuts of every size, a start through plain
   whirlpools and winds, buoys to follow, the race explained, and a ceremonious finish. */
import { describe, expect, it } from 'vitest';
import { LAY, SAIL, Sea, Helm, type Pose } from '../src/den-sail';
import {
  RACE, Race, GunGap, Drift, Barrier, LONG_ROUTE, stretchAt, atStart, atFinish, cleanBest, clockText, neckCrane,
  onLine, spotPose, snakeAt, nextBuoy, barrierDeal, atNotch, FIRST_SPOT, readyLocks, boardHasKey,
} from '../src/den-race';
import { LOCK } from '../src/den-lock';
import { STARTER } from '../src/lines/race';
import { sheltered } from '../src/den-racers';
import { gustPath } from '../src/den-sailing';
import { runFor, RUN } from '../src/sailing';
import { CRANE, TRIP } from '../src/den-crane';
import { WIND } from '../src/den-wind';
import { Forage, seeded } from '../src/foraging';
import { kikkitAt, onKikkitLanding } from '../src/den-kikkit';
import { mooredAt } from '../src/den-moored';
import { SIM, tauAt, routePose } from '../src/race-sim';
import { carp } from './helpers';
import { k, DT, shut, WAYS, settle, sail, sailTo, hop, longWay, BEFORE_MID } from './race-helpers';
import type { DeckHole } from '../src/den-patch';
import type { Cell } from '../src/engine';

const RC = LAY.RACE, S = RC.STRETCHES, P = RC.SPITS, sea = new Sea(9);
const at = (cells: Cell[]): [number, number] => [Math.min(...cells.map((p) => p[0])), Math.min(...cells.map((p) => p[1]))];
const norm = (cells: Cell[]): Cell[] => { const [r0, c0] = at(cells); return cells.map(([r, c]): Cell => [r - r0, c - c0]); };
const fill = (hole: DeckHole) => { for (const p of carp.solve(hole.open(), 1)[0]) hole.put(p.letter, norm(p.cells), ...at(p.cells)); };
/** Where the sweep that has her on this square leaves her. */
const swept = (c: number, r: number, d = 0): Pose => { const h = new Helm(sea, { c, r, d }); h.gust([{ c, r, d }]); settle(h); return { ...h.pose }; };
const G = RC.GUNS.way, B = RC.HEADWIND, M = RC.WHIRLS.MOUTH, L = RC.LOCKS, E = RC.CRANE, F = RC.FORAGE, D2 = RC.DOUBLE.WAY, T3 = RC.TRIPLE;
/** Through the race's locks, made ready for a race, from the leg before them out onto the next, pumped at
    once: the seconds, and the longest she sat waiting on any one thing (their water or their gates). */
function throughLocks() {
  const h = new Helm(sea, { c: L[0].at[0], r: L[0].at[1] - 1, d: 0 });
  readyLocks(h);
  for (let i = 0; i < 4; i++) h.put('F');
  let t = 0, wait = 0, most = 0, was: string | null = null;
  for (; t < 60 && h.pose.r < L[1].at[1] + 1; t += DT) {
    if (h.held() === 'up') h.pump(99);
    const held = h.held();
    wait = held && held === was ? wait + DT : held ? DT : 0;
    most = Math.max(most, wait);
    was = held;
    h.tick(DT);
  }
  return { t, most, at: [h.pose.c, h.pose.r] };
}

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
    expect(S).toHaveLength(6);
    expect(P).toHaveLength(5);
    S.forEach((s, i) => {
      if (i) expect(s.d).not.toBe(S[i - 1].d);
      for (let c = 2; c < SAIL.COLS; c++) for (const r of [s.r, s.r + 1]) expect(sea.ground(c, r), `${c},${r}`).toBe(false);
    });
    P.forEach((sp, i) => {
      expect(sp.r0).toBe(S[i].r + 2);
      expect(sp.r1 + 1).toBe(S[i + 1].r);
      // (round its end the way the stretch before it's sailed)
      expect(sp.bend).toBe(S[i].d === 1 ? 'R' : 'L');
    });
  });
});

describe('a start through plain whirlpools and winds, picking your own spot along the starting line (11 Nov: "you can kind of ... pick your starting spot along the starting edge")', () => {
  it('Space at the buoy takes her in to the line; she moves along it, never onto a rival\'s spot, then the count', () => {
    const race = new Race();
    const theirs = race.racing().map((r) => r.spot);
    expect(race.take()).toBe(true);
    expect(race.state).toBe('line');
    expect(race.spot).toBe(FIRST_SPOT);
    expect(onLine(race.spot, RC.LINE.r)).toBe(true);
    for (let i = 0; i < 40; i++) race.shift(-1);
    expect(race.spot).toBe(RC.LINE.c0);
    for (let i = 0; i < 40; i++) { race.shift(1); expect(theirs).not.toContain(race.spot); }
    expect(race.spot).toBe(RC.LINE.c1);
    expect(race.shift(0, 6)).toBe(6);
    for (const c of theirs) expect(race.shift(0, c)).not.toBe(c);
    expect(race.start()).toBe(true);
    expect(race.state).toBe('count');
    // (her spot's held through the count)
    const was = race.spot;
    race.shift(1);
    expect(race.spot).toBe(was);
  });

  it('from every spot on the line she gets through the field to the first bend under sail, in about the time the simulation reckons', () => {
    for (let c = RC.LINE.c0; c <= RC.LINE.c1; c++) {
      expect(sea.open(c, RC.LINE.r)).toBe(true);
      const h = new Helm(shut(...WAYS), spotPose(c)), t = sail(h, [SAIL.COLS - 2, P[0].r0]);
      expect([h.pose.c, h.pose.r], `spot ${c}`).toEqual([SAIL.COLS - 2, P[0].r0]);
      expect(Math.abs(t - SIM.SPOTS[c - RC.LINE.c0]), `spot ${c}`).toBeLessThan(1.5);
    }
  }, 120000);

  it('no spot is far ahead of the rest: the field\'s winds carry the far ones on, and its quickest line through is one gap (the crowded line)', () => {
    const ts = SIM.SPOTS;
    expect(Math.max(...ts) - Math.min(...ts)).toBeLessThan(10);
    // (the quickest spots are those by the field's gap, where the conveyor across it drops her)
    const best = ts.indexOf(Math.min(...ts)) + RC.LINE.c0;
    expect(RC.FIELD.WINDS.some(([c, r, d]) => c === best && r === RC.FIELD.r0 && d === 0)).toBe(true);
  });

  it('its whirlpools are plain ones, by Puzzle Pirates\' rules: stop on one and it has her; a gust zooms her over', () => {
    for (const spot of RC.FIELD.POOLS) {
      const [c, r] = spot.at;
      expect(spot.gone).toBeUndefined();
      for (const [x, y] of [[c, r], [c + 1, r], [c, r + 1], [c + 1, r + 1]]) expect(sea.whirlAt(x, y), `${x},${y}`).toBeTruthy();
      // (never under the line, so every spot can get going)
      expect(r).toBeGreaterThan(RC.LINE.r + 1);
      // A gust from above it, straight down over it, lands beyond.
      const from = { c, r: r - 1, d: 0 }, g = gustPath(sea, from, 3);
      if (sea.open(from.c, from.r) && sea.windAt(from.c, from.r) === undefined && g.length === 3) expect(sea.whirlAt(g[2].c, g[2].r)).toBeFalsy();
    }
    // Sailed onto one of her own accord, it has her.
    const [c, r] = RC.FIELD.POOLS[1].at, h = new Helm(sea, { c, r: r - 1, d: 0 });
    h.put('F');
    let whirled = false;
    for (let t = 0; t < 4; t += DT) { h.tick(DT); if (h.cur?.m === 'W') whirled = true; }
    expect(whirled).toBe(true);
  });
});

describe('the course reachable both ways round every bend (11 Nov)', () => {
  it('the long way, start to finish, under sail, no puzzle but a Double over the trade wind back up it: the race is run and the clock stops', () => {
    const s = shut(...WAYS), race = new Race();
    race.take();
    race.shift(0, 14);
    race.start();
    const h = new Helm(s, spotPose(race.spot));
    race.tick(RACE.COUNT + 0.01, h.pose);
    longWay(h, () => race.tick(DT, h.pose));
    for (let i = 0; i < 200 && race.state !== 'done'; i++) { h.tick(DT); race.tick(DT, h.pose); }
    expect(race.state).toBe('done');
    expect(race.leg).toBe(5);
    expect(h.oars).toBe(false);
    // (a few minutes: "it should be significant"; about what the simulation reckons)
    expect(race.t).toBeGreaterThan(180);
    expect(race.t).toBeLessThan(260);
  }, 120000);
});

describe('snakes: winds that sweep her back, their sting growing down the course (11 Nov: "I want the snakes and [ladders]")', () => {
  it('the trade wind back up the course: a Double\'s gust jumps it; anything less and it sweeps her back up onto leg 2 ("back a significant like one leg")', () => {
    const [mc] = RC.SNAKES.MID[0];
    // It crosses all of leg 3, and runs up through spit 2 to leg 2.
    for (const r of [S[2].r, S[2].r + 1]) expect(snakeAt(mc, r)).toBe('mid');
    for (let r = P[1].r0; r <= P[1].r1; r++) expect(snakeAt(mc, r)).toBe('mid');
    // A Double from beside it lands clean over it; a single move onto it, and she's swept back to leg 2.
    let h = new Helm(sea, { c: BEFORE_MID[0], r: BEFORE_MID[1], d: 1 });
    hop(h, runFor(2));
    expect([h.pose.c, h.pose.r]).toEqual([mc + 1, BEFORE_MID[1]]);
    h = new Helm(sea, { c: BEFORE_MID[0], r: BEFORE_MID[1], d: 1 });
    h.put('F'); settle(h);
    expect(stretchAt(h.pose.c, h.pose.r)).toBe(1);
    // (and the pilot can't take her round it: it's to be jumped)
    expect(sea.plot({ c: BEFORE_MID[0], r: BEFORE_MID[1], d: 1 }, mc + 2, S[2].r + 1)).toBeNull();
  });

  it('the left-hand trade wind a real snake on the way out: legs 2 and 4 end hard by it, and a gust too far there sweeps her back to the start ("accidentally being caught in the winds that sweep you in")', () => {
    for (const s of [S[1], S[3]]) {
      expect(snakeAt(0, s.r)).toBe('left');
      expect(sea.open(1, s.r)).toBe(true);
      // Sailing leg 2 (or 4) to its end, a Quad from four squares out carries her into it.
      const h = new Helm(sea, { c: 4, r: s.r + 1, d: 3 });
      hop(h, runFor(4));
      expect([h.pose.c, h.pose.r]).toEqual([0, RC.LINE.r]);
    }
  });

  it('a tight spot just past the gun gap: rush through and one move too many puts her in a wind that sweeps her back along leg 2 ("you accidentally clicked one too many")', () => {
    const [gc, gr] = G[G.length - 1];
    // Past the gap, the wall ahead, and the square before it a wind back along the leg.
    expect(sea.ground(gc, gr + 3)).toBe(true);
    expect(snakeAt(gc, gr + 2)).toBe('tight');
    expect(swept(gc, gr + 2, 1)).toMatchObject({ c: SAIL.COLS - 2, r: gr + 2 });
    // A heavy combo of just the right size from the leg before lands her clear; one square more and it has her.
    expect(gustPath(sea, { c: gc, r: S[0].r + 1, d: 0 }, runFor(4)).at(-1)).toMatchObject({ c: gc, r: gr + 1 });
    let h = new Helm(sea, { c: gc, r: S[0].r + 1, d: 0 });
    hop(h, runFor(5));
    expect([h.pose.c, h.pose.r]).toEqual([SAIL.COLS - 2, gr + 2]);
    // Out of it, the way on is a turn to port, along leg 2.
    h = new Helm(sea, { c: gc, r: gr + 1, d: 0 });
    h.put('L'); settle(h);
    expect([h.pose.c, h.pose.r]).toEqual([gc - 1, gr + 2]);
  });

  it('the run home narrow beside a wind that sweeps her all the way back to the start ("If I accidentally misclick ... pushed into the trade winds that send you back right to the very start")', () => {
    const run = S[5].r;
    for (let c = 1; c < SAIL.COLS; c++) { expect(sea.open(c, run)).toBe(true); expect(snakeAt(c, run + 1)).toBe('left'); }
    // (the spit beside it, but for the Triple's gap through it, and the veiled wind's since 12 Nov)
    for (let c = 1; c < SAIL.COLS - 2; c++) expect(sea.ground(c, run - 1) || T3.some(([x, y]) => x === c && y === run - 1) || sea.veils.has(`${c},${run - 1}`), `${c}`).toBe(true);
    // A turn to starboard, a misclick, sailing home along it: back to the starting line.
    const h = new Helm(sea, { c: 15, r: run, d: 3 });
    h.put('R'); settle(h);
    expect([h.pose.c, h.pose.r]).toEqual([0, RC.LINE.r]);
  });

  it('a snake\'s sting grows down the course: the tight water past the gun gap costs least, the trade wind up the middle a leg, the left-hand trade wind the most, and most of all on the run home ("I almost want the sense of foreboding doom")', () => {
    // (how far round the long way each puts her back: seconds of it, as the simulation reckons them)
    const back = (s: number, c: number, to: Pose) => tauAt(s, c) - (stretchAt(to.c, to.r) < 0 ? 0 : tauAt(stretchAt(to.c, to.r), Math.max(2.5, to.c)));
    const [gc, gr] = G[G.length - 1], [mc] = RC.SNAKES.MID[0];
    const tight = back(1, gc, swept(gc, gr + 2, 1)), mid = back(2, mc - 1, swept(mc, S[2].r + 1, 2));
    const leftOut = back(3, 2.5, swept(0, S[3].r, 2)), leftHome = back(5, RC.FINISH[0] + 2, swept(RC.FINISH[0] + 2, S[5].r + 1, 3));
    expect(tight).toBeGreaterThan(0);
    expect(tight).toBeLessThan(mid);
    expect(mid).toBeGreaterThan(25);
    expect(mid).toBeLessThan(leftOut);
    expect(leftOut).toBeLessThan(leftHome);
    expect(leftHome).toBeGreaterThan(SIM.LONG * 0.8);
  });
});

describe('each shortcut only passable by its puzzle, every size of them (11 Nov: "Are you a person that can break quick double triples? ... Or do you want to go for those giant" ones)', () => {
  it('[A] the gun gap: its marks all in the spit (the long way\'s clear of them); a square at a time she\'s a sitting duck; a heavy combo rushes her past; or knock its guns out by Gunnery', () => {
    for (const m of RC.GUNS.marks.flat()) expect(stretchAt(m[0], m[1]), `${m}`).toBe(-1);
    const run = (gap: GunGap, h: Helm, secs: number) => {
      let hits = 0;
      for (let t = 0; t < secs; t += 1 / 60) {
        h.tick(1 / 60);
        for (const e of gap.tick(1 / 60, h.spared() ? null : h.now(), h.pose)) if (e.kind === 'land' && e.hit) { h.hit(); hits++; }
        if (h.dazed()) fill(h.hole!);
      }
      return hits;
    };
    const [gc] = G[0], out = G[G.length - 1][1] + 1;
    // Square at a time: she's hit.
    let gap = new GunGap(), h = new Helm(sea, { c: gc, r: S[0].r + 1, d: 0 });
    for (let i = 0; i < 4; i++) h.put('F');
    expect(run(gap, h, 25)).toBeGreaterThan(0);
    expect([h.pose.c, h.pose.r]).toEqual([gc, out]);
    // A heavy combo from the leg: clean past their marks.
    gap = new GunGap(); h = new Helm(sea, { c: gc, r: S[0].r + 1, d: 0 });
    h.gust(gustPath(sea, h.pose, runFor(4)));
    expect(run(gap, h, 6)).toBe(0);
    expect([h.pose.c, h.pose.r]).toEqual([gc, out]);
    // Its guns knocked out by hers (loaded by Gunnery): three hits each, and the gap's safe.
    gap = new GunGap();
    for (const [c, r] of RC.GUNS.at) for (let i = 0; i < 3; i++) gap.shot(c, r);
    expect(gap.silenced()).toBe(true);
    h = new Helm(sea, { c: gc, r: S[0].r + 1, d: 0 });
    for (let i = 0; i < 4; i++) h.put('F');
    expect(run(gap, h, 25)).toBe(0);
  });

  it('[B] the headwind gap: no sail gets through; rowed, she does, round its dog-leg; idle in it, she drifts back out the way she came', () => {
    expect(sea.irons({ c: B[0][0], r: B[0][1] - 1, d: 0 }, 'F')).toBe(true);
    const h = new Helm(sea, { c: B[0][0], r: B[0][1] - 1, d: 0 });
    h.put('F'); settle(h);
    expect(h.pose.r).toBe(B[0][1] - 1);
    // Rowed: in, a turn round the dog-leg, and out onto leg 3.
    h.row(true);
    h.stroke(['F', 'R', 'L', 'F', 'F']);
    settle(h);
    expect([h.pose.c, h.pose.r]).toEqual([B[3][0], S[2].r]);
    // (its far end doesn't open straight onto leg 3: below its way in, land, so no broadside from the leg ahead reaches it)
    expect(sea.ground(B[0][0], P[1].r1)).toBe(true);
    // Idle in it at the oars, the wind blows her back a square at a time, the way she came.
    const g = new Helm(sea, { c: B[3][0], r: B[3][1], d: 0 }), drift = new Drift();
    g.row(true);
    const went: string[] = [];
    for (let t = 0; t < RACE.DRIFT * 5 + 2; t += DT) { const back = drift.tick(DT, g); if (back) { g.gust([back]); went.push(k(back.c, back.r)); } g.tick(DT); }
    expect(went).toEqual([...B.slice(0, 3).reverse(), [B[0][0], B[0][1] - 1]].map(([c, r]) => k(c, r)));
  });

  it('a small gap a Double hops, a wind blowing back across it; and a bigger one a Triple hops, two winds', () => {
    // The Double's: in at its mouth, a Double over its wind lands her through; a single square, blown back.
    let h = new Helm(sea, { c: D2[0][0], r: D2[0][1], d: 0 });
    hop(h, runFor(2));
    expect([h.pose.c, h.pose.r]).toEqual(D2[2]);
    h = new Helm(sea, { c: D2[0][0], r: D2[0][1], d: 0 });
    h.put('F'); settle(h);
    expect([h.pose.c, h.pose.r]).toEqual(D2[0]);
    // The Triple's: from the leg beside it, a Triple over both winds onto the run home; a Double, blown back.
    const before = { c: T3[0][0], r: T3[0][1] - 1, d: 0 };
    h = new Helm(sea, before); hop(h, runFor(3));
    expect([h.pose.c, h.pose.r]).toEqual([T3[0][0], S[5].r]);
    h = new Helm(sea, before); hop(h, runFor(2));
    expect([h.pose.c, h.pose.r]).toEqual([before.c, before.r]);
  });

  it('the long way\'s zigzag: headwinds alternating side to side with gaps, to weave through, or hop with a well-timed Double, a lot quicker ("getting over them with, like, a double, like a well-timed double, would be a lot more effective")', () => {
    const rows = new Set(RC.ZIGZAG.map(([, r]) => r));
    expect([...rows].sort()).toEqual([S[3].r, S[3].r + 1]);
    for (let i = 1; i < RC.ZIGZAG.length; i++) expect(RC.ZIGZAG[i][1]).not.toBe(RC.ZIGZAG[i - 1][1]);
    const start: Pose = { c: RC.ZIGZAG[0][0] + 2, r: S[3].r, d: 3 }, end: [number, number] = [2, P[3].r0];
    const weave = sailTo(sea, start, end).t;
    const h = new Helm(sea, start);
    let hops = 0;
    for (const [c, r] of RC.ZIGZAG.filter(([, r]) => r === S[3].r)) { hops += sail(h, [c + 1, r]); hops += hop(h, runFor(2), 3); }
    hops += sail(h, end);
    expect([h.pose.c, h.pose.r]).toEqual(end);
    expect(hops).toBeLessThan(weave * 0.7);
    expect(Math.abs(weave - hops - SIM.ZIGZAG)).toBeLessThan(2);
  });

  it('[C] the whirlpool channel: only a Vegas from its mouth carries her over; less, and its winds bring her back to the mouth', () => {
    for (let steps = 1; steps <= RUN.VEGAS; steps++) {
      const h = new Helm(sea, { ...M });
      h.gust(gustPath(sea, h.pose, runFor(steps)));
      settle(h, 120);
      if (steps === RUN.VEGAS) expect([h.pose.c, h.pose.r], `steps ${steps}`).toEqual(RC.WHIRLS.OUT);
      else expect([h.pose.c, h.pose.r, h.pose.d], `steps ${steps}`).toEqual([M.c, M.r, M.d]);
    }
    const by = { c: M.c + 1, r: M.r, d: 0 };
    expect(gustPath(sea, by, runFor(RUN.VEGAS)).some((p) => sea.passage.has(k(p.c, p.r)))).toBe(false);
  }, 60000);

  it('[C] a barrier of driftwood across a gap, cleared by Foraging from the notch in front of it, sheltered ("You just have to clear the barrier")', () => {
    const s = new Sea(9), bar = new Barrier();
    // Shut: land in the gap; the notch in front of it open water, off the leg, sheltered.
    for (const [c, r] of F.BARRIER) { expect(s.open(c, r)).toBe(false); expect(s.ground(c, r)).toBe(true); }
    expect(stretchAt(...F.NOTCH)).toBe(-1);
    expect(sheltered(...F.NOTCH)).toBe(true);
    expect(atNotch(...F.NOTCH)).toBe(true);
    const h = new Helm(s, { c: F.NOTCH[0], r: S[2].r + 1, d: 0 });
    h.put('F'); h.put('F'); settle(h);
    expect([h.pose.c, h.pose.r]).toEqual(F.NOTCH);
    // Its board: Foraging (src/foraging.ts), dealt with its bundles of driftwood on it, nothing more to come.
    const g = new Forage(barrierDeal(seeded(37)));
    expect(g.containers()).toHaveLength(RACE.FORAGE.BUNDLES.length);
    expect(g.containers().every((x) => x.bit.box === 'crate' && x.bit.tag === 'drift')).toBe(true);
    expect(g.toCome).toBe(0);
    expect(g.over).toBe(false);
    // Cleared, she sails on through to leg 4; a new race, it's back.
    bar.clear(s);
    expect(sail(h, F.OUT)).toBeLessThan(15);
    expect([h.pose.c, h.pose.r]).toEqual(F.OUT);
    bar.reset(s);
    for (const [c, r] of F.BARRIER) expect(s.open(c, r)).toBe(false);
  });

  it('[D] the locks: she waits in the first till it\'s pumped up by Bilge; then up, along and down; a sheltered berth beside the way in', () => {
    const h = new Helm(sea, { c: L[0].at[0], r: L[0].at[1] - 1, d: 0 });
    for (let i = 0; i < 4; i++) h.put('F');
    for (let t = 0; t < 30; t += DT) h.tick(DT);
    expect([h.pose.c, h.pose.r]).toEqual(L[0].at);
    expect(h.held()).toBe('up');
    for (let t = 0; t < 60 && h.pose.r < L[1].at[1] + 1; t += DT) { if (h.held() === 'up') h.pump(1); h.tick(DT); }
    expect([h.pose.c, h.pose.r]).toEqual([L[1].at[0], L[1].at[1] + 1]);
    // The berth: a notch off the leg, sheltered, sailed into and back out of under sail.
    expect(stretchAt(...RC.BERTH)).toBe(-1);
    expect(sheltered(...RC.BERTH)).toBe(true);
    expect(sea.plot({ c: RC.BERTH[0] + 3, r: S[3].r, d: 3 }, ...RC.BERTH)).not.toBeNull();
    expect(sea.plot({ c: RC.BERTH[0], r: RC.BERTH[1], d: 0 }, L[0].at[0], L[0].at[1] - 1)).not.toBeNull();
  });

  it('[E] the crane in its notch, off the leg and sheltered: it hauls her over once it\'s built by Carpentry', () => {
    expect(stretchAt(...E.LEDGE)).toBe(-1);
    expect(sheltered(...E.LEDGE)).toBe(true);
    const crane = neckCrane(), h = new Helm(sea, { c: E.LEDGE[0], r: E.LEDGE[1], d: 0 });
    expect(crane.ledge).toEqual(E.LEDGE);
    expect(crane.alongside(h)).toBe(true);
    expect(crane.haul()).toBe(false);
    for (let i = 0; i < CRANE.PARTS.length; i++) {
      const f = crane.build()!;
      for (const p of carp.solve(f.open(), 1)[0]) f.put(p.letter, norm(p.cells), ...at(p.cells));
      expect(crane.raise()[0]).toMatchObject({ kind: 'part', part: i });
    }
    expect(crane.haul()).toBe(true);
    expect(crane.tick(TRIP + 0.1)).toEqual([{ kind: 'arrive', where: 'lagoon' }]);
    expect(sea.open(E.TO.c, E.TO.r)).toBe(true);
    expect(stretchAt(E.TO.c, E.TO.r)).toBe(5);
    expect(E.TO.d).toBe(S[5].d);
    expect(E.TO.c).toBeGreaterThan(RC.FINISH[0]);
    // (and into the notch from the leg under sail, and back out)
    expect(sea.plot({ c: E.LEDGE[0] - 3, r: S[4].r + 1, d: 1 }, ...E.LEDGE)).not.toBeNull();
    expect(sea.plot({ c: E.LEDGE[0], r: E.LEDGE[1], d: 0 }, E.LEDGE[0] + 3, S[4].r + 1)).not.toBeNull();
  });

  it('each findable: plain to see as she sails by, every way through a gap in the spit beside a leg', () => {
    const mouths: [number, number][] = [G[0], B[0], D2[0], F.NOTCH, [M.c, M.r + 1], L[0].at, E.LEDGE, [T3[0][0], T3[0][1]]];
    for (const [c, r] of mouths) expect([stretchAt(c, r - 1), stretchAt(c, r)].some((x) => x >= 0), `${c},${r}`).toBe(true);
  });
});

describe('each shortcut saves about what a decent player takes on its puzzle (11 Nov)', () => {
  // The long way round its bend, sailed, less the shortcut's own trip: within a quarter of RACE.DECENT.
  const cases: Record<keyof typeof RACE.DECENT, { from: Pose; to: [number, number]; trip: () => number; mid?: boolean }> = {
    guns: { from: { c: G[0][0], r: S[0].r, d: 1 }, to: [G[0][0], G[2][1] + 1], trip: () => 1 + runFor(4) * SAIL.PUSH },
    headwind: { from: { c: B[0][0], r: B[0][1] - 1, d: 3 }, to: [B[3][0], S[2].r + 1], trip: () => 1 + (B.length + 2) * WIND.OARS },
    // (broken as she sails by on the leg: lined up and carried over, 12 Nov)
    double: { from: { c: D2[0][0], r: D2[0][1] - 1, d: 3 }, to: [D2[2][0], S[2].r], trip: () => { const h = new Helm(sea, { c: D2[0][0], r: D2[0][1] - 1, d: 3 }); return hop(h, 2) + sail(h, [D2[2][0], S[2].r]); } },
    whirls: { from: { ...M }, to: RC.WHIRLS.OUT, trip: () => runFor(RUN.VEGAS) * SAIL.PUSH, mid: true },
    forage: { from: { c: F.NOTCH[0], r: S[2].r + 1, d: 1 }, to: F.OUT, trip: () => { const s = new Sea(9); new Barrier().clear(s); return sailTo(s, { c: F.NOTCH[0], r: S[2].r + 1, d: 0 }, F.OUT).t; } },
    locks: { from: { c: L[0].at[0], r: L[0].at[1] - 1, d: 3 }, to: [L[1].at[0], L[1].at[1] + 1], trip: () => throughLocks().t },
    crane: { from: { c: E.LEDGE[0], r: S[4].r + 1, d: 1 }, to: [E.TO.c, E.TO.r], trip: () => TRIP + 1 },
    triple: { from: { c: T3[0][0], r: S[4].r + 1, d: 1 }, to: [T3[0][0], S[5].r], trip: () => 1 + runFor(3) * SAIL.PUSH },
  };
  for (const [name, x] of Object.entries(cases) as [keyof typeof RACE.DECENT, (typeof cases)['guns']][]) {
    it(`${name}: about ${RACE.DECENT[name]} seconds`, () => {
      const h = new Helm(shut(...WAYS), x.from);
      let long = 0;
      if (x.mid) { long += sail(h, BEFORE_MID); long += hop(h, 2, 1); }
      long += sail(h, x.to);
      expect([h.pose.c, h.pose.r]).toEqual(x.to);
      const saves = long - x.trip();
      expect(saves).toBeGreaterThan(RACE.DECENT[name] * 0.75);
      expect(saves).toBeLessThan(RACE.DECENT[name] * 1.25);
    }, 60000);
  }
});

describe('the long way: the route the simulation\'s bots sail round (11 Nov)', () => {
  it('sails open water all the way round from the long way\'s own spot on the line, every bend, to the finish line', () => {
    expect(LONG_ROUTE[0]).toEqual([RACE.LONG_SPOT, RC.LINE.r]);
    for (let i = 1; i < LONG_ROUTE.length; i++) {
      const [a, b] = [LONG_ROUTE[i - 1], LONG_ROUTE[i]];
      expect(a[0] === b[0] || a[1] === b[1], `${a} to ${b}`).toBe(true);
      const n = Math.ceil(Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1])) * 2;
      for (let j = 0; j <= n; j++) {
        const c = a[0] + (b[0] - a[0]) * j / n, r = a[1] + (b[1] - a[1]) * j / n;
        for (const [x, y] of [[Math.floor(c + 0.01), Math.floor(r + 0.01)], [Math.ceil(c - 0.01), Math.ceil(r - 0.01)]]) {
          // (by the turning pool on leg 2's first row, 12 Nov, the bots go by on its second: routePose)
          if (sea.whirlAt(x, y) === sea.whirlAt(...RC.GAMBLES.TURN.POOL.at) && !sea.whirlAt(x, y + 1)) { expect(routePose(tauAt(1, x)).r, `${x},${y}`).toBe(y + 1); continue; }
          expect(sea.ground(x, y) || sea.isRock(x, y) || !!sea.whirlAt(x, y), `${x},${y}`).toBe(false);
        }
      }
    }
    expect(LONG_ROUTE[LONG_ROUTE.length - 1]).toEqual(RC.FINISH);
  });
});

describe('knowing where you\'re going: numbered buoys round the long way, the next one shown (11 Nov: "clearer [buoys] for the main route")', () => {
  it('a numbered buoy at each bend, in the water she rounds it by, and the next one by the stretch she\'s on', () => {
    expect(RC.BUOYS.map((b) => b.n)).toEqual([1, 2, 3, 4, 5]);
    RC.BUOYS.forEach((b, i) => {
      expect(sea.open(...b.at), `buoy ${b.n}`).toBe(true);
      expect(b.at[1]).toBeGreaterThanOrEqual(P[i].r0);
      expect(b.at[1]).toBeLessThanOrEqual(P[i].r1);
      expect(b.bend).toBe(P[i].bend);
      expect(nextBuoy(10, S[i].r)).toBe(b.n);
    });
    expect(nextBuoy(10, S[5].r)).toBe(6);
    expect(nextBuoy(10, RC.FIELD.r0)).toBe(1);
  });
});

describe('the race: the clock, in order, a ceremonious finish line, your best kept (11 Nov)', () => {
  it('counts every stretch in order, and the finish line only once she\'s been round: her time and place', () => {
    const race = new Race();
    expect(race.start()).toBe(true);
    expect(race.start()).toBe(false);
    race.tick(RACE.COUNT + 0.01, { c: RC.BUOY[0], r: RC.BUOY[1] });
    expect(race.state).toBe('on');
    // Straight to the finish line (swept round by the left-hand trade wind, say): not finished.
    expect(race.tick(1, { c: RC.FINISH[0], r: RC.FINISH[1] })).toEqual([]);
    expect(race.tick(1, { c: 10, r: S[2].r })).toEqual([]);
    for (let n = 1; n < 6; n++) expect(race.tick(1, { c: 10, r: S[n].r })).toEqual([{ kind: 'leg', n }]);
    // (not yet over the line)
    expect(race.tick(1, { c: RC.FINISH[0] + 1, r: RC.FINISH[1] })).toEqual([]);
    const e = race.tick(1, { c: RC.FINISH[0], r: RC.FINISH[1] });
    expect(e).toEqual([{ kind: 'finish', secs: race.t, best: true, won: true, place: 1 }]);
    expect(race.best).toBeCloseTo(race.t);
    expect(atFinish(RC.FINISH[0] - 2, RC.FINISH[1])).toBe(true);
    expect(atFinish(RC.FINISH[0], RC.FINISH[1] + 1)).toBe(false);
  });

  it('says when a snake has her, once a sweep', () => {
    const race = new Race();
    race.start(); race.tick(RACE.COUNT + 0.01, { c: RC.BUOY[0], r: RC.BUOY[1] });
    expect(race.tick(0.1, { c: 0, r: 60 })).toEqual([{ kind: 'swept', snake: 'left' }]);
    expect(race.tick(0.1, { c: 0, r: 59 })).toEqual([]);
    expect(race.tick(0.1, { c: 0, r: RC.LINE.r })).toEqual([]);
    expect(race.tick(0.1, { c: RC.SNAKES.MID[0][0], r: S[2].r })).toEqual([{ kind: 'swept', snake: 'mid' }]);
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
    for (let n = 1; n < 6; n++) race.tick(0, { c: 10, r: S[n].r });
    race.tick(150, { c: RC.FINISH[0], r: RC.FINISH[1] });
    expect(race.best).toBe(100);
    expect(cleanBest('123.4')).toBe(123.4);
    for (const bad of [null, 'x', -3, 0, {}, 1e9]) expect(cleanBest(bad)).toBeNull();
    expect(clockText(187.43)).toBe('3:07.4');
  });
});

describe('the starlit door\'s place (11 Nov; the door itself: den-door.test.ts)', () => {
  it('a plain cliff face off leg 2, and its tunnel\'s exits onto legs 3 and 5 (12 Nov), clear of every shortcut and out of the gun gap\'s reach', () => {
    const D = RC.DOOR, OUT = D.EXITS.flatMap((e) => e.OUT);
    for (const [c, r] of [...D.FACE, ...OUT]) expect(sea.ground(c, r), `${c},${r}`).toBe(true);
    for (const [c, r] of D.OFF) { expect(sea.open(c, r)).toBe(true); expect(stretchAt(c, r)).toBe(1); expect(snakeAt(c, r)).toBeNull(); }
    D.EXITS.forEach((e, n) => { for (const [c, r] of e.INTO) { expect(sea.open(c, r)).toBe(true); expect(stretchAt(c, r)).toBe([2, 4][n]); expect(sea.windAt(c, r)).toBeUndefined(); expect(snakeAt(c, r)).toBeNull(); } });
    const ways = new Set([...G, ...RC.GUNS.at, ...B, ...D2, ...L.map((l) => l.at), ...RC.POUND.at, E.LEDGE, F.NOTCH, ...F.BARRIER, ...F.GAP, ...RC.SNAKES.MID, ...RC.WHIRLS.WINDS].map(([c, r]) => k(c, r)));
    for (const [c, r] of [...D.FACE, ...OUT]) for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) expect(ways.has(k(c + a, r + b)), `${c + a},${r + b}`).toBe(false);
    for (const [gc, gr] of RC.GUNS.at) for (const [c, r] of D.OFF) expect(Math.max(Math.abs(c - gc), Math.abs(r - gr))).toBeGreaterThan(3);
  });
});

/* The user's playtest of the race, 12 Nov. */
describe('the race\'s locks: too long waiting on the animation (12 Nov)', () => {
  // "I was spending just as much time waiting for the ship to go forward, and it was like, come on, come
  // on ... it shouldn't feel like you're losing the race because you're waiting on the animation."
  it('through the race\'s locks, pumped at once, in a beat: no wait on their water or gates over a second', () => {
    const x = throughLocks();
    expect(x.at).toEqual([L[1].at[0], L[1].at[1] + 1]);
    expect(x.most).toBeLessThanOrEqual(1);
    expect(x.t).toBeLessThan(5);   // (it was 10 s: 2 s to fill the down lock from above, 2 to drain it...)
    expect(LOCK.DRAIN).toBeLessThanOrEqual(1);
    expect(LOCK.GATES).toBeLessThanOrEqual(0.5);
  });

  it('made ready for each race: the up lock drained for her to go in, the down lock full from the canal above', () => {
    const h = new Helm(sea);
    const up = h.lockAt(...L[0].at)!, down = h.lockAt(...L[1].at)!;
    up.set(1); down.set(0);   // (as a race before left them)
    readyLocks(h);
    expect([up.level, down.level]).toEqual([0, 1]);
    // (and the canal's own locks, by the checkpoint, left as they were)
    expect(h.locks.slice(0, LAY.LOCKS.length).every((l) => l.level === 0)).toBe(true);
  });
});

describe('the race\'s wind gaps are awkward to line up for (12 Nov)', () => {
  // "some of these wind shortcuts, it's a bit awkward to set the ship up to get through them."
  const at = (p: Pose) => [p.c, p.r];
  it('the Double\'s gap: a Double broken anywhere in its mouth on leg 2 lines her up and carries her over', () => {
    for (let c = D2[0][0] - 1; c <= D2[0][0] + 1; c++) for (const r of [S[1].r, S[1].r + 1]) for (const d of [1, 3]) {
      const g = gustPath(sea, { c, r, d }, runFor(2));
      expect(at(g[g.length - 1]), `${c},${r} facing ${d}`).toEqual(D2[2]);
      expect(sea.windAt(...D2[2])).toBeUndefined();
    }
    // From further along the leg, a Double's just a Double along it.
    expect(at(gustPath(sea, { c: D2[0][0] + 3, r: S[1].r + 1, d: 3 }, runFor(2)).at(-1)!)).toEqual([D2[0][0] + 1, S[1].r + 1]);
    // And played out on the helm, from the leg she's over and onto leg 3 in a couple of seconds.
    const h = new Helm(sea, { c: D2[0][0] + 1, r: S[1].r + 1, d: 3 });
    expect(hop(h, runFor(2))).toBeLessThan(2.5);
    expect([h.pose.c, h.pose.r]).toEqual(D2[2]);
  });

  it('the Triple\'s gap: a Triple broken in its mouth on leg 5 lines her up and lands her on the run home; a bigger gust that would land her in the trade wind goes on along the leg', () => {
    for (let c = T3[0][0] - 1; c <= T3[0][0] + 1; c++) for (const r of [S[4].r, S[4].r + 1]) {
      const g = gustPath(sea, { c, r, d: 1 }, runFor(3));
      expect(at(g[g.length - 1]), `${c},${r}`).toEqual([T3[0][0], S[5].r]);
    }
    for (const p of gustPath(sea, { c: T3[0][0] - 1, r: S[4].r + 1, d: 1 }, runFor(4))) expect(snakeAt(p.c, p.r)).toBeNull();
    // (a Double's too little for it: just a Double along the leg)
    expect(gustPath(sea, { c: T3[0][0], r: S[4].r + 1, d: 1 }, runFor(2)).every((p) => p.r === S[4].r + 1)).toBe(true);
  });

  it('the zigzag: a Double broken right behind a headwind, or a square further back, hops it', () => {
    for (const [c, r] of RC.ZIGZAG) for (const back of [1, 2]) {
      const g = gustPath(sea, { c: c + back, r, d: 3 }, runFor(2));
      expect(at(g[g.length - 1]), `${c},${r} from ${back} back`).toEqual([c - 1, r]);
      expect(sea.windAt(c - 1, r)).toBeUndefined();
    }
  });

  it('their savings stay in band: the Double\'s gap from the leg saves about RACE.DECENT.double', () => {
    const h = new Helm(shut(...WAYS), { c: D2[0][0], r: D2[0][1] - 1, d: 3 }), long = sail(h, [D2[2][0], S[2].r]);
    const g = new Helm(sea, { c: D2[0][0], r: D2[0][1] - 1, d: 3 }), trip = hop(g, runFor(2)) + sail(g, [D2[2][0], S[2].r]);
    expect(long - trip).toBeGreaterThan(RACE.DECENT.double * 0.75);
    expect(long - trip).toBeLessThan(RACE.DECENT.double * 1.25);
  });
});

describe('Space at the race\'s start buoy, with the Sailing board open (12 Nov)', () => {
  it('goes to the board, not in to the starting line; with it put away, Space takes her in', () => {
    const race = new Race(), h = new Helm(sea, { c: RC.BUOY[0], r: RC.BUOY[1], d: 0 });
    expect(race.takes(' ', h, true)).toBe(false);
    expect(race.takes('enter', h, true)).toBe(false);
    expect(boardHasKey(' ', true)).toBe(true);
    expect(race.takes(' ', h, false)).toBe(true);
    expect(boardHasKey(' ', false)).toBe(false);
    expect(race.takes('w', h, false)).toBe(false);
    race.start();
    expect(race.takes(' ', h, false)).toBe(false);   // (not with one on)
  });
});

describe('the starter\'s card names the gambles (12 Nov): a veiled wind, on or back, and a whirlpool that turns', () => {
  it('names them as gambles, in a few words', () => {
    const line = STARTER.explain.find((l) => /gamble/.test(l))!;
    expect(line).toMatch(/veiled wind/);
    expect(line).toMatch(/whirlpool that turns/);
    expect(line.split(' ').length).toBeLessThan(35);
  });
});

describe('the starter\'s card names the starlit door, 12 Nov: no hidden gems in the proof of concept', () => {
  it('a starry door in the cliff off leg 2, opened by Navigation, and a tunnel under the course, in a line of its own', () => {
    const line = STARTER.explain.find((l) => /\bdoor\b/.test(l))!;
    expect(line).toMatch(/starry door/);
    expect(line).toMatch(/leg two/);
    expect(line).toMatch(/Navigation/);
    expect(line).toMatch(/tunnel under the course/);
    expect(line.split(' ').length).toBeLessThan(35);
  });
});

describe('the starter\'s card names the bribe at the gate (12 Nov)', () => {
  it('pay off the guard at the gate, among the ways through', () => {
    const card = STARTER.explain.join(' ');
    expect(card).toMatch(/pay off the guard at the gate/);
    expect(card).toMatch(/treasure/);
  });
});
