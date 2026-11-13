/* Planning your race route, then puzzling it through (src/race-plan.ts; RACE.md §5). The user, 12 Nov: "you plan
   by choosing those options, that works. That's really simple and easy"; and 13 Nov: "it should all be in the
   same thing ... online, local should all be the same." */
import { describe, expect, it } from 'vitest';
import { LAY, Sea, Helm, type Pose } from '../src/den-sail';
import { RACE, Barrier, readyLocks, spotPose } from '../src/den-race';
import { fieldFor } from '../src/start-field';
import { gustPath } from '../src/den-sailing';
import { stretchAt } from '../src/den-racers';
import { CUTS, ROUTES, routePose, simulate, lineUp, sail } from '../src/race-sim';
import { LEGS, STOPS, WAY_IN, Pilot, longPlan, cycle, choose, cleanPlan, cutsOf, gapOf, holds, shutWays, type Plan, type PlanWorld, type CutId } from '../src/race-plan';
import { FIELD, Field, courseSea } from '../src/den-racers';
import { Watch, planChange } from '../src/race-watch';
import { WATCHED } from '../src/den-rivals';

const RC = LAY.RACE, S = RC.STRETCHES, DT = 0.05;

/** Sails a plan with the pilot from a spot on the line to the finish, a person at each stop doing what it asks
    there at once (a Sailing hop's gust, the lock pumped, the driftwood cleared...). The stops she was held at. */
function sailPlan(plan: Plan, spot = RACE.LONG_SPOT, seed = 5, limit = 700) {
  const sea = new Sea(9);
  sea.layField(fieldFor(seed));
  const h = new Helm(sea, spotPose(spot)), P = new Pilot(plan);
  readyLocks(h);
  let coins = 0, paid = false, cleared = false;
  const w: PlanWorld = { seed, sea, get sig() { return `${sea.rocks.size}`; }, coins: () => coins, price: 40, paid: () => paid, gunQuiet: () => false, rocksDown: () => false, cleared: () => cleared };
  const stops: string[] = [];
  let t = 0;
  for (; t < limit; t += DT) {
    const p = h.pose;
    if (stretchAt(p.c, p.r) === S.length - 1 && p.c <= RC.FINISH[0]) break;
    const o = P.steer(h, w);
    if (o.kind === 'stop') {
      const st = o.stop;
      if (stops[stops.length - 1] !== st.id) stops.push(st.id);
      if (!h.cur && !h.gusts.length && h.slot < 0) {
        if (st.board === 'sailing') h.gust(gustPath(sea, h.pose, st.need!));
        if (st.board === 'treasure') coins = 40;
        if (st.board === 'pay') { paid = true; h.gust(gustPath(sea, { ...h.pose, d: 0 }, 5)); }
        if (st.board === 'foraging') { new Barrier().clear(sea); cleared = true; }
      }
      if (st.board === 'bilge' && h.held() === 'up') h.pump(99);
    }
    h.tick(DT);
  }
  return { t, stops, at: { ...h.pose } as Pose, plan: P.plan, changes: P.changes };
}

describe('a plan is a choice for each leg (12 Nov, agreed)', () => {
  it('five legs, the long way first on each, the rest that leg\'s shortcuts; it starts as the long way everywhere', () => {
    expect(LEGS.length).toBe(5);
    for (const L of LEGS) expect(L.options[0].id).toBe('long');
    expect(longPlan()).toEqual(['long', 'long', 'long', 'long', 'long']);
    expect(cutsOf(longPlan())).toEqual([]);
    expect(cutsOf(choose(longPlan(), 3, 'zigzag'))).toEqual(['zigzag']);
  });
  it('one click on a leg changes it, round its choices and back to the first', () => {
    let p = longPlan();
    const seen = [p[2]];
    for (let i = 1; i < LEGS[2].options.length; i++) { p = cycle(p, 2); seen.push(p[2]); }
    expect(seen).toEqual(LEGS[2].options.map((o) => o.id));
    expect(cycle(p, 2)[2]).toBe('long');
    expect(choose(longPlan(), 4, 'locks')).toEqual(longPlan());   // (not one of leg 5's)
    expect(cleanPlan(['bribe', 'nonsense', 'whirls'])).toEqual(['bribe', 'long', 'whirls', 'long', 'long']);
  });
  it('the gun gap four ways: run, rushed on a Quad, shot quiet, bribed', () => {
    expect(['run', 'quad', 'shoot', 'bribe'].map((id) => gapOf(choose(longPlan(), 0, id as Plan[number])))).toEqual(['run', 'combo', 'shot', 'bribe']);
    expect(cutsOf(choose(longPlan(), 0, 'bribe'))).toEqual(['wreck', 'guns']);
  });
});

describe('every racer races by a plan (13 Nov: "it should all be in the same thing")', () => {
  it('each of the simulation\'s routes is a plan, taking the shortcuts it always took', () => {
    const was: Record<string, CutId[]> = {
      long: ['zigzag'], 'gap-run': ['guns'], 'gap-combo': ['guns'], 'gap-shot': ['guns'], bribe: ['wreck', 'guns'], headwind: ['headwind'],
      doubles: ['double', 'triple'], whirls: ['whirls'], rocks: ['rocks'], forage: ['forage'], locks: ['locks'], crane: ['crane'], door: ['door'],
      every: ['wreck', 'guns', 'double', 'whirls', 'locks', 'crane'],
    };
    for (const r of ROUTES) { expect(r.cuts, r.name).toEqual(was[r.name]); expect(cutsOf(r.plan)).toEqual(r.cuts); }
  });
  it('the ways in are where the bots always left the long way', () => {
    const s = shutWays(new Sea(9)), ok = ([x, y]: [number, number]) => s.open(x, y) && s.windAt(x, y) === undefined && !s.isLock(x, y);
    for (const c of Object.values(CUTS)) {
      const q = routePose(c.tIn), p = { c: Math.round(q.c), r: Math.round(q.r) };
      const near: [number, number][] = [[p.c, p.r + 1], [p.c, p.r], [p.c - 1, p.r + 1], [p.c + 1, p.r + 1], [p.c - 1, p.r], [p.c + 1, p.r]];
      expect(WAY_IN[c.id], c.id).toEqual(near.find(ok) ?? near[0]);
    }
  });
  it('a bot that gives a shortcut up changes her plan, and someone watching sees it', () => {
    let changed = 0;
    for (let seed = 1; seed <= 30 && !changed; seed++) {
      const racers = lineUp(4, seed), run = sail({ racers, seed });
      for (let t = 0; t < 600 && run.field.state === 'on'; t += 0.1) { run.field.tick(0.1); run.step(0.1); }
      for (let i = 0; i < racers.length; i++) {
        const x = run.info(i)!;
        for (const c of x.changes) { changed++; expect(x.plan[c.leg]).toBe(c.to); expect(c.from).not.toBe(c.to); }
      }
    }
    expect(changed).toBeGreaterThan(0);
  }, 120000);
  it('watching, each racer\'s plan shows: the legs still to come and her choice on each, and a change as she makes it (13 Nov: "you should ... be able to see what people\'s plans are")', () => {
    const W = new Watch(11, WATCHED, false);
    for (let t = 0; t < 20; t += 0.1) W.tick(0.1);
    const k = WATCHED.findIndex((r) => r.racer.route === 'whirls');
    const p = W.plan(k);
    expect(p.legs[0].now).toBe(true);
    expect(p.legs.map((l) => l.name)).toContain('The whirlpools');
    expect(planChange('Kikkit', { t: 0, leg: 2, from: 'whirls', to: 'long' })).toBe('Kikkit changes her plan: leg 3, the whirlpools → the long way');
  }, 60000);
  it('the same seed races the same, plans and all', () => {
    const a = simulate({ racers: lineUp(4, 7), seed: 7 }), b = simulate({ racers: lineUp(4, 7), seed: 7 });
    expect(a).toEqual(b);
  }, 60000);
});

describe('the pilot sails your plan and stops at the obstacles (12 Nov, agreed: "the ship auto stops when you hit those kind of obvious points or obstacles")', () => {
  it('the long way: held only behind the trade wind back up the course, a Double over it, and weaving the zigzag', () => {
    const r = sailPlan(longPlan());
    expect(stretchAt(r.at.c, r.at.r)).toBe(S.length - 1);
    expect(r.at.c).toBeLessThanOrEqual(RC.FINISH[0]);
    expect(r.stops).toEqual(['mid']);
    expect(r.t).toBeLessThan(260);
  }, 120000);
  it('hopping the zigzag: held behind each of its headwinds on her row (every other one: they alternate rows), a Double over each, and no slower than weaving with Doubles ready', () => {
    const r = sailPlan(choose(longPlan(), 3, 'zigzag')), w = sailPlan(longPlan());
    expect(stretchAt(r.at.c, r.at.r)).toBe(S.length - 1);
    expect(r.stops.filter((s) => s.startsWith('zigzag')).length).toBe(2);
    expect(r.t).toBeLessThan(w.t + 3);
  }, 120000);
  it('the Double\'s gap, the locks and the Triple\'s gap: a stop at each, home', () => {
    const r = sailPlan(['long', 'double', 'long', 'locks', 'triple']);
    expect(r.at.r).toBe(S[5].r);
    expect(r.stops).toEqual(expect.arrayContaining(['double', 'mid', 'locks', 'triple']));
    expect(r.stops.filter((s) => s.startsWith('zigzag'))).toEqual([]);
  }, 120000);
  it('the whirlpools\' mouth, facing in, a Vegas over them; and the driftwood\'s notch, cleared and through', () => {
    const a = sailPlan(['long', 'long', 'whirls', 'long', 'long']);
    expect(a.stops).toContain('whirls');
    expect(a.stops).not.toContain('mid');
    expect(a.at.r).toBe(S[5].r);
    const b = sailPlan(['long', 'long', 'forage', 'long', 'long']);
    expect(b.stops).toContain('forage');
    expect(b.at.r).toBe(S[5].r);
  }, 120000);
  it('rushing the gate: held in front of it facing in, a Quad carries her through', () => {
    const r = sailPlan(['quad', 'long', 'long', 'long', 'long'], 18);
    expect(r.stops[0]).toBe('quad');
    expect(r.at.r).toBe(S[5].r);
  }, 120000);
  it('a shortcut she can\'t sail to from where she is is put by, and her plan says so: the bribe\'s wreck, behind the field\'s hop (RACE.md §8), the gate run instead', () => {
    const r = sailPlan(['bribe', 'long', 'long', 'long', 'long'], 18);
    if (!r.stops.includes('wreck')) {
      expect(r.plan[0]).toBe('run');
      expect(r.changes[0]).toMatchObject({ leg: 0, from: 'bribe', to: 'run' });
    } else expect(r.stops.slice(0, 2)).toEqual(['wreck', 'pay']);
    expect(r.at.r).toBe(S[5].r);
  }, 120000);
  it('held at a hop, a clear too small for it doesn\'t carry her into the wind; a big enough one does', () => {
    const o = { kind: 'stop' as const, stop: STOPS.mid };
    expect(holds(o, 1)).toBe(true);
    expect(holds(o, 2)).toBe(false);
    expect(holds({ kind: 'stop', stop: STOPS.whirls }, 3)).toBe(false);   // (the whirlpools' own loop is their price)
    expect(holds({ kind: 'idle' }, 1)).toBe(false);
  });
  it('taking the helm: your moves let the pilot\'s go, and once they\'re sailed the pilot carries on', () => {
    const sea = new Sea(9);
    sea.layField(fieldFor(3));
    const h = new Helm(sea, spotPose(RACE.LONG_SPOT)), P = new Pilot();
    const w: PlanWorld = { seed: 3, sea, sig: '1', coins: () => 0, price: 40, paid: () => false, gunQuiet: () => false, rocksDown: () => false, cleared: () => false };
    P.steer(h, w);
    expect(h.mine.length).toBeGreaterThan(0);
    P.take(h);
    expect(h.mine).toEqual([]);
    h.put('F');
    expect(P.steer(h, w).kind).toBe('idle');
    for (let t = 0; t < 20 && P.taken; t += DT) { P.steer(h, w); h.tick(DT); }
    expect(P.taken).toBe(false);
    expect(h.mine.length).toBeGreaterThan(0);
  });
});
void FIELD; void Field; void courseSea;
