/* The sloop race's gambles (src/den-gamble.ts), 12 Nov. The user: "sometimes maybe there should be a
   mysterious headwind. Half the time it pushes you forward and helps you skip a bit. Sometimes you're getting
   lucky and it goes backwards. But maybe the whirlpool, the direction the whirlpool goes is changes, so it goes
   back up, that's involved, that goes back and forth. So you can go that way if you want to take a gamble." */
import { describe, expect, it } from 'vitest';
import { LAY, SAIL, Sea, Helm, type Pose } from '../src/den-sail';
import { whirl, whirlpool } from '../src/den-whirl';
import { gustPath } from '../src/den-sailing';
import { stretchAt } from '../src/den-racers';
import { GAMBLE, Gambles, toss, spinWay, spinAt, nextTurn, throwOf, onVeil, TURN_IN, VEIL_IN } from '../src/den-gamble';
import { run, simulate, route, style } from '../src/race-sim';
import { DT, sail, settle } from './race-helpers';

const RC = LAY.RACE, S = RC.STRETCHES, P = RC.SPITS, TN = RC.GAMBLES.TURN, VL = RC.GAMBLES.VEIL;

/** A helm on the course with the gambles wired in, the pool spinning `spin` (or by the gambles' clock). */
function wired(from: Pose, spin: 1 | -1 | null = null, seed = 1) {
  const sea = new Sea(9), h = new Helm(sea, from), g = new Gambles(seed);
  h.takes = (p, w) => g.takes(p, w);
  sea.whirlAt(...TN.POOL.at)!.turns = () => spin ?? g.way();
  return { sea, h, g };
}
/** From a few squares before it, sailing along the leg, into the pool by her own moves: where it leaves her. */
function intoPool(spin: 1 | -1) {
  const w = wired({ ...TURN_IN, c: TURN_IN.c + 3 }, spin);
  for (let i = 0; i < 3; i++) w.h.put('F');
  settle(w.h);
  return w;
}
/** From a few squares before it along leg 5, onto the veiled wind by her own moves. */
function ontoVeil(seed: number) {
  const w = wired({ c: VEIL_IN.c - 4, r: VEIL_IN.r, d: 1 }, 1, seed);
  for (let i = 0; i < 3; i++) w.h.put('F');
  w.h.put('L');
  settle(w.h);
  return w;
}
const goals = (h: Helm, to: [number, number][]) => to.reduce((t, z) => t + sail(h, z), 0);

describe('the veiled wind: a ladder or a snake, a coin toss each time (12 Nov: "Half the time it pushes you forward ... Sometimes ... it goes backwards")', () => {
  it('lies across spit 5, off leg 5, a gap beside the leg like any way through, onto the run home', () => {
    for (const [c, r] of VL.WAY) expect(RC.LAND.flat().some(([x, y]) => x === c && y === r)).toBe(false);
    expect(stretchAt(VEIL_IN.c, VEIL_IN.r)).toBe(4);
    expect(VL.WAY[0][1]).toBe(P[4].r0);
    expect(VL.WAY[VL.WAY.length - 1][1]).toBe(P[4].r1);
  });

  it('a coin toss: seeded, so a race tossed again is the same race; about half on, half back', () => {
    for (let seed = 1; seed < 50; seed++) for (let n = 0; n < 4; n++) expect(toss(seed, n)).toBe(toss(seed, n));
    let on = 0, n = 0;
    for (let seed = 1; seed <= 2000; seed++) for (let k = 0; k < 3; k++) { n++; if (toss(seed, k)) on++; }
    expect(on / n).toBeGreaterThan(0.47);
    expect(on / n).toBeLessThan(0.53);
    // (each time she comes onto it a toss of its own, not the race's one toss over and over)
    const runs = Array.from({ length: 40 }, (_, s) => [0, 1, 2, 3].map((k) => toss(s + 1, k)).join());
    expect(new Set(runs).size).toBeGreaterThan(8);
  });

  it('sailed onto, it blows her on through onto the run home, facing along it, or back out and along leg 5 to its start', () => {
    let ons = 0, backs = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const { h, g } = ontoVeil(seed);
      expect(g.last?.kind).toBe('veil');
      if (g.last!.on) { ons++; expect(h.pose).toEqual({ c: VL.WAY[0][0], r: S[5].r, d: 3 }); expect(stretchAt(h.pose.c, h.pose.r)).toBe(5); }
      else { backs++; expect(h.pose.r).toBe(S[4].r + 1); expect(h.pose.c).toBe(VL.BACK[VL.BACK.length - 1].c); expect(stretchAt(h.pose.c, h.pose.r)).toBe(4); }
    }
    expect(ons).toBeGreaterThan(0);
    expect(backs).toBeGreaterThan(0);
  });

  it('looks the same either way till she\'s on it: nothing about it says which, and the same seed tosses the same', () => {
    // (the lane's squares are no wind of the sea's: no way to read it but to sail onto it)
    for (const [c, r] of VL.WAY) { expect(new Sea(9).windAt(c, r)).toBeUndefined(); expect(onVeil(c, r)).toBe(true); }
    const a = ontoVeil(7), b = ontoVeil(7);
    expect(a.h.pose).toEqual(b.h.pose);
  });

  it('only on purpose: the pilot never takes her onto it, nor a chain\'s gust from the leg (12 Nov)', () => {
    const sea = new Sea(9);
    for (const [c, r] of VL.WAY) expect(sea.open(c, r)).toBe(false);
    // (to the run home from leg 5 before it, the pilot goes round the spit's end)
    const moves = sea.plot({ c: VEIL_IN.c - 2, r: VEIL_IN.r, d: 1 }, VEIL_IN.c, S[5].r)!;
    expect(moves).not.toBeNull();
    let p: Pose = { c: VEIL_IN.c - 2, r: VEIL_IN.r, d: 1 };
    for (const m of moves) { p = sea.sail(p, m).to; expect(onVeil(p.c, p.r)).toBe(false); }
    expect(gustPath(sea, VEIL_IN, 4)).toEqual([]);
  });

  it(`each way about the same, as the helm sails it: on saves about ${GAMBLE.SAVES.veil.on} s, back costs about ${-GAMBLE.SAVES.veil.back} (worth about nothing on average: a swing)`, () => {
    const from: Pose = { c: VEIL_IN.c - 4, r: VEIL_IN.r, d: 1 }, round: [number, number] = [SAIL.COLS - 3, P[4].r1];
    const long = goals(wired(from).h, [round, RC.FINISH]);
    // (measured from the same start: its moves onto it, its carry, and on to the finish line)
    const time = (seed: number) => {
      const w = wired(from, 1, seed);
      for (let i = 0; i < 3; i++) w.h.put('F');
      w.h.put('L');
      const t = settle(w.h);
      return { on: w.g.last!.on, t: t + goals(w.h, w.g.last!.on ? [RC.FINISH] : [round, RC.FINISH]) };
    };
    const got = [1, 2, 3, 4, 5, 6, 7, 8].map(time), on = got.find((x) => x.on)!, back = got.find((x) => !x.on)!;
    expect(Math.abs(long - on.t - GAMBLE.SAVES.veil.on)).toBeLessThan(2);
    expect(Math.abs(long - back.t - GAMBLE.SAVES.veil.back)).toBeLessThan(2);
    expect(Math.abs(GAMBLE.SAVES.veil.on + GAMBLE.SAVES.veil.back)).toBeLessThan(4);
  }, 30000);
});

describe('the turning pool: its spin back and forth on a beat, a bet on timing (12 Nov: "the direction the whirlpool goes ... changes, so it goes back up ... that goes back and forth")', () => {
  it('spins clockwise a beat, slows, then anticlockwise a beat, over and over, from the gun', () => {
    for (let t = 0.1; t < GAMBLE.BEAT; t += 0.5) { expect(spinWay(t)).toBe(1); expect(spinWay(t + GAMBLE.BEAT)).toBe(-1); expect(spinWay(t + 2 * GAMBLE.BEAT)).toBe(1); }
    // (it slows to a stop as it turns, so you can see it coming)
    expect(Math.abs(spinAt(GAMBLE.BEAT - 0.1))).toBeLessThan(0.1);
    expect(spinAt(GAMBLE.BEAT / 2)).toBeCloseTo(1);
    expect(nextTurn(GAMBLE.BEAT * 1.25)).toBeCloseTo(GAMBLE.BEAT * 0.75);
  });

  it('anticlockwise, its step goes round by the other corner to the same far one, and turns her a quarter left', () => {
    const w = whirlpool({ at: [4, 6] });
    expect(whirl(w, { c: 5, r: 6, d: 0 }, -1)).toEqual({ via: [5, 7], to: { c: 4, r: 7, d: 3 } });
    expect(whirl(w, { c: 5, r: 6, d: 0 }, 1)).toEqual({ via: [4, 6], to: { c: 4, r: 7, d: 1 } });
    // (one that turns says which way it's going when it steps)
    w.turns = () => -1;
    expect(whirl(w, { c: 5, r: 6, d: 0 }).to.d).toBe(3);
  });

  it('on leg 2\'s first row, its corner in spit 1; on the second row she sails by, never had', () => {
    expect(stretchAt(...TN.IN)).toBe(1);
    expect(TN.IN[1]).toBe(S[1].r);
    expect(TN.FAR[1]).toBe(P[0].r1);
    const sea = new Sea(9);
    const by = sea.plot({ c: TN.IN[0] + 3, r: S[1].r + 1, d: 3 }, 3, S[1].r + 1);
    expect(by).not.toBeNull();
    let p: Pose = { c: TN.IN[0] + 3, r: S[1].r + 1, d: 3 };
    for (const m of by!) { p = sea.sail(p, m).to; expect(sea.whirlAt(p.c, p.r)).toBeUndefined(); }
    // (and the long way's pilot, from the first row, goes round it)
    expect(sea.plot({ c: TN.IN[0] + 3, r: S[1].r, d: 3 }, 3, S[1].r + 1)).not.toBeNull();
  });

  it('timed right, sailed into along the leg as it spins clockwise, it flings her on, down the cleft through spit 2 onto leg 3', () => {
    const { h, g } = intoPool(1);
    expect(g.last).toMatchObject({ kind: 'turn', on: true });
    expect(h.pose).toEqual({ c: TN.FAR[0], r: S[2].r, d: 1 });
    expect(stretchAt(h.pose.c, h.pose.r)).toBe(2);
  });

  it('mistimed, anticlockwise, it throws her back up the lane through spit 1 onto leg 1 ("so it goes back up")', () => {
    const { h, g } = intoPool(-1);
    expect(g.last).toMatchObject({ kind: 'turn', on: false });
    expect(h.pose.c).toBe(TN.FAR[0]);
    expect(h.pose.r).toBe(S[0].r + 1);
    expect(stretchAt(h.pose.c, h.pose.r)).toBe(0);
  });

  it('its turn is the race\'s clock: going in just as it turns is a mistime', () => {
    // (sailed in by the gambles' clock, set so the step comes just after it's turned anticlockwise)
    const w = wired({ ...TURN_IN, c: TURN_IN.c + 1 });
    w.g.t = GAMBLE.BEAT - 0.3;
    w.h.put('F');
    for (let t = 0; t < 20; t += DT) { w.h.tick(DT); w.g.tick(DT); }
    expect(w.g.last?.on).toBe(false);
    const x = wired({ ...TURN_IN, c: TURN_IN.c + 1 });
    x.g.t = 0.5;
    x.h.put('F');
    for (let t = 0; t < 20; t += DT) { x.h.tick(DT); x.g.tick(DT); }
    expect(x.g.last?.on).toBe(true);
  });

  it('sailed into any other way it\'s a plain whirlpool, turning her about: no throw', () => {
    // (from leg 2's second row, turning in: its step leaves her facing along the leg, and lets her be)
    expect(throwOf({ c: TN.FAR[0], r: TN.FAR[1], d: 1 })).toBeNull();
    expect(throwOf({ c: TN.FAR[0], r: TN.FAR[1], d: 3 })).toBeNull();
    expect(throwOf({ c: TN.IN[0], r: TN.IN[1], d: 0 })).toBeNull();
    // (sailing the other way along the leg, into its other corner on the leg)
    const w = wired({ c: TN.POOL.at[0] - 2, r: S[1].r, d: 1 }, 1);
    w.h.put('F'); w.h.put('F');
    for (let t = 0; t < 4; t += DT) w.h.tick(DT);
    expect(w.g.last).toBeNull();
  });

  it('only its throw gets down the cleft, and nothing sails down the lane: no free way through either spit', () => {
    const sea = new Sea(9);
    for (const [c, r] of TN.CLEFT) expect(sea.open(c, r)).toBe(false);
    // (a chain's gust from leg 2's second row, out over the cleft, stops short; one from leg 1 down the lane too)
    expect(gustPath(sea, { c: TN.FAR[0], r: S[1].r + 1, d: 0 }, 5)).toEqual([]);
    expect(gustPath(sea, { c: TN.FAR[0], r: S[0].r + 1, d: 0 }, 5)).toEqual([]);
    // (sailed down onto the lane from leg 1, its wind blows her straight back out)
    const h = new Helm(sea, { c: TN.FAR[0], r: S[0].r + 1, d: 0 });
    h.put('F');
    settle(h);
    expect(h.pose.r).toBe(S[0].r + 1);
  });

  it(`each way as the helm sails it: on saves about ${GAMBLE.SAVES.turn.on} s, back up costs about ${-GAMBLE.SAVES.turn.back}`, () => {
    const from: Pose = { ...TURN_IN, c: TURN_IN.c + 3 }, to: [number, number] = [17, S[2].r + 1];
    const long = goals(wired(from).h, [[3, P[1].r1], to]);
    // (each from the same start: three moves along the leg into it, its step and its throw, on to leg 3)
    const time = (spin: 1 | -1) => {
      const w = wired(from, spin);
      for (let i = 0; i < 3; i++) w.h.put('F');
      return settle(w.h) + goals(w.h, spin > 0 ? [to] : [[SAIL.COLS - 2, P[0].r0], [3, P[1].r1], to]);
    };
    expect(Math.abs(long - time(1) - GAMBLE.SAVES.turn.on)).toBeLessThan(2);
    expect(Math.abs(long - time(-1) - GAMBLE.SAVES.turn.back)).toBeLessThan(3);
  }, 30000);
});

describe('the gambles in the simulation (12 Nov: "so you can go that way if you want to take a gamble")', () => {
  const rep = run(400, 4, { seed: 31 });
  it('both are taken, and each comes off about as often as it should: the veiled wind half the time, the pool as often as it\'s timed', () => {
    const v = rep.bets.veil, t = rep.bets.turn;
    expect(v.taken).toBeGreaterThan(100);
    expect(t.taken).toBeGreaterThan(100);
    expect(v.on / v.taken).toBeGreaterThan(0.4);
    expect(v.on / v.taken).toBeLessThan(0.6);
    expect(t.on / t.taken).toBeGreaterThan(0.65);
    expect(t.on / t.taken).toBeLessThan(0.9);
  });
  it('the back of the field gambles most; the leader least', () => {
    for (const g of [rep.bets.veil, rep.bets.turn]) {
      const n = g.by.leader + g.by.pack + g.by.last;
      expect(g.by.last / n).toBeGreaterThan(g.by.leader / n);
    }
  });
  it('a swing, not a shortcut: worth about nothing on average, the veiled wind whoever you are, the pool by how well you time it', () => {
    const mean = (g: typeof rep.bets.veil, k: 'decent' | 'good' | 'great') => g.saved[k].secs / Math.max(1, g.saved[k].n);
    for (const k of ['decent', 'good', 'great'] as const) expect(Math.abs(mean(rep.bets.veil, k)), k).toBeLessThan(12);
    expect(mean(rep.bets.turn, 'great')).toBeGreaterThan(mean(rep.bets.turn, 'decent'));
    expect(Math.abs(mean(rep.bets.turn, 'good'))).toBeLessThan(12);
  });
  it('a cautious leader never gambles', () => {
    const cautious = style('cautious'), long = route('long');
    for (let seed = 1; seed <= 30; seed++) {
      // (one cautious racer well ahead of a decent one: she leads all the way)
      const [lead] = simulate({ racers: [{ route: long, style: cautious, skill: 'great', spot: 18 }, { route: long, style: style('peaceful'), skill: 'decent', spot: 1 }], seed, snakes: false });
      for (const b of lead.bets) expect(b.rank, `seed ${seed}`).toBeGreaterThan(0);
    }
  });
  it('one seed, one race, gambles and all', () => {
    const racers = [{ route: route('long'), style: style('opportunist'), skill: 'decent' as const, spot: 3 }, { route: route('locks'), style: style('aggressive'), skill: 'good' as const, spot: 18 }];
    expect(simulate({ racers, seed: 9 })).toEqual(simulate({ racers, seed: 9 }));
  });
});
