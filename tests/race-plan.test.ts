/* Planning your race route, then puzzling it through (src/race-plan.ts; RACE.md §5). The user, 12 Nov: "you plan
   by choosing those options, that works. That's really simple and easy"; and 13 Nov: "it should all be in the
   same thing ... online, local should all be the same." */
import { describe, expect, it } from 'vitest';
import { LAY, Sea, Helm, type Pose } from '../src/den-sail';
import { RACE, Barrier, readyLocks, spotPose } from '../src/den-race';
import { fieldFor } from '../src/start-field';
import { gustPath } from '../src/den-sailing';
import { stretchAt } from '../src/den-racers';
import { CUTS, ROUTES, SIM, routePose, simulate, lineUp, sail, choiceTime, planTime, choiceLines, planLines } from '../src/race-sim';
import { LEGS, STOPS, WAY_IN, Pilot, longPlan, cycle, choose, cleanPlan, cutsOf, gapOf, holds, shutWays, readPlan, writePlan, courseChart, type Plan, type PlanWorld, type CutId } from '../src/race-plan';
import { FIELD, Field, courseSea } from '../src/den-racers';
import { Watch, planChange } from '../src/race-watch';
import { WATCHED } from '../src/den-rivals';

const RC = LAY.RACE, S = RC.STRETCHES, DT = 0.05;

/** Sails a plan with the pilot from a spot on the line to the finish, a person at each stop doing what it asks
    there at once (a Sailing hop's gust, the lock pumped, the driftwood cleared...). The stops she was held at. */
function sailPlan(plan: Plan, spot = RACE.LONG_SPOT, seed = 5, limit = 700, opt: { until?: (stops: string[]) => boolean; shut?: [number, number][] } = {}) {
  const sea = new Sea(9);
  sea.layField(fieldFor(seed));
  for (const [c, r] of opt.shut ?? []) sea.rocks.add(`${c},${r}`);
  sea.touch();
  const h = new Helm(sea, spotPose(spot)), P = new Pilot(plan);
  readyLocks(h);
  let coins = 0, paid = false, cleared = false;
  const w: PlanWorld = { seed, sea, get sig() { return `${sea.rocks.size}`; }, coins: () => coins, price: 40, paid: () => paid, gunQuiet: () => false, rocksDown: () => false, cleared: () => cleared };
  const stops: string[] = [];
  let t = 0;
  for (; t < limit; t += DT) {
    const p = h.pose;
    if (stretchAt(p.c, p.r) === S.length - 1 && p.c <= RC.FINISH[0]) break;
    if (opt.until?.(stops)) break;
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
  it('a shortcut she can\'t sail to from where she is is put by, and her plan says so: the bribe\'s wreck with its notch shut, the gate run instead', () => {
    const r = sailPlan(['bribe', 'long', 'long', 'long', 'long'], 18, 5, 700, { shut: [RC.BRIBE.NOTCH] });
    expect(r.stops).not.toContain('wreck');
    expect(r.plan[0]).toBe('run');
    expect(r.changes[0]).toMatchObject({ leg: 0, from: 'bribe', to: 'run' });
    expect(r.at.r).toBe(S[5].r);
  }, 120000);
  it('the bribe\'s wreck is reached from every spot on the line, never put by (13 Nov: "I definitely need to fix the bribe so it\'s more usable. I mean, I think that was obvious")', () => {
    // (every spot, on fields of all sorts, those whose slow winds shut the left-hand way down onto leg 1 too:
    // she hauls at the wreck, then pays at the gate, her plan the bribe throughout)
    for (let spot = RC.LINE.c0; spot <= RC.LINE.c1; spot++) for (const seed of [1, 3, 5, 6]) {
      const r = sailPlan(['bribe', 'long', 'long', 'long', 'long'], spot, seed, 120, { until: (s) => s.includes('pay') });
      expect(r.changes, `spot ${spot}, seed ${seed}`).toEqual([]);
      expect(r.plan[0]).toBe('bribe');
      expect(r.stops.slice(0, 2), `spot ${spot}, seed ${seed}`).toEqual(['wreck', 'pay']);
    }
  }, 240000);
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

describe('racing by the plan, the user\'s playtest (13 Nov)', () => {
  it('the headwind gap, 13 Nov: "the rowboat is perpendicular to the actual gap, so you\'re not even going forward": she\'s lined up facing down it before the oars go out, and rowing takes her through', () => {
    const r = sailPlan(['long', 'headwind', 'long', 'long', 'long'], RACE.LONG_SPOT, 5, 200, { until: (s) => s.includes('headwind') });
    expect(r.stops).toEqual(['headwind']);
    // (held on the square above the gap's first, facing down into it: d 0, out to sea, along the gap)
    expect([r.at.c, r.at.r]).toEqual(STOPS.headwind.at);
    expect(r.at.d).toBe(0);
    expect(STOPS.headwind.at).toEqual([RC.HEADWIND[0][0], RC.HEADWIND[0][1] - 1]);
    // (the oars out there: even pulls row her ahead into the gap, and round its dog-leg onto leg 3)
    const sea = new Sea(9);
    const h = new Helm(sea, { ...r.at });
    h.row(true);
    h.stroke(['F']);
    for (let t = 0; t < 5 && (h.cur || h.strokes.length || h.slot >= 0); t += DT) h.tick(DT);
    expect([h.pose.c, h.pose.r]).toEqual(RC.HEADWIND[0]);
    h.stroke(['R', 'L', 'F', 'F']);
    for (let t = 0; t < 20 && (h.cur || h.strokes.length || h.slot >= 0); t += DT) h.tick(DT);
    expect(stretchAt(h.pose.c, h.pose.r)).toBe(2);
  }, 120000);
  it('the gate, 13 Nov: changing the plan while she\'s held facing into the gate for the Quad, a Sailing gust no longer carries her straight through it without paying or shooting', () => {
    const plan: Plan = ['quad', 'long', 'long', 'long', 'long'];
    const sea = new Sea(9);
    sea.layField(fieldFor(5));
    sea.touch();
    const h = new Helm(sea, spotPose(18)), P = new Pilot(plan);
    readyLocks(h);
    const w: PlanWorld = { seed: 5, sea, sig: '1', coins: () => 0, price: 20, paid: () => false, gunQuiet: () => false, rocksDown: () => false, cleared: () => false };
    let t = 0;
    for (; t < 120 && !(P.order.kind === 'stop' && P.order.stop.id === 'quad' && !h.cur && h.slot < 0); t += DT) { P.steer(h, w); h.tick(DT); }
    expect(P.order.kind === 'stop' && P.order.stop.id).toBe('quad');
    expect(h.pose.d).toBe(0);
    // (held there for her Quad, a Quad would carry her through: that's the plan)
    expect(P.gustHeld(h, w, 4)).toBe(null);
    expect(P.gustHeld(h, w, 2)).toBe('hop');
    // The plan changed to the long way on leg 1: any gust now, a Quad or more, is held till she's turned onto the leg.
    P.set(choose(plan, 0, 'long'));
    P.steer(h, w);
    expect(P.gustHeld(h, w, 4)).toBe('way');
    expect(P.gustHeld(h, w, 7)).toBe('way');
    // And sailing on, a gust thrown whenever she's between moves, she goes the long way round the gate, never into it.
    const gate = new Set(RC.GUNS.way.map(([c, r]) => `${c},${r}`));
    let into = 0, gusts = 0;
    for (t = 0; t < 60 && stretchAt(h.pose.c, h.pose.r) < 1; t += DT) {
      P.steer(h, w);
      if (!h.cur && !h.gusts.length && h.gusty() && !P.gustHeld(h, w, 4)) { h.gust(gustPath(sea, h.gustFrom(), 4)); gusts++; }
      h.tick(DT);
      if (gate.has(`${h.pose.c},${h.pose.r}`)) into++;
    }
    expect(into).toBe(0);
    expect(gusts).toBeGreaterThan(0);
    expect(stretchAt(h.pose.c, h.pose.r)).toBe(1);
  }, 120000);
  it('the gate: running it, a gust may carry her into it; bribing it, not till the guard\'s paid', () => {
    const sea = new Sea(9), G = RC.GUNS.way;
    const h = new Helm(sea, { c: G[0][0], r: G[0][1] - 1, d: 0 });
    const w: PlanWorld = { seed: 5, sea, sig: '1', coins: () => 20, price: 20, paid: () => false, gunQuiet: () => false, rocksDown: () => false, cleared: () => false };
    const run = new Pilot(['run', 'long', 'long', 'long', 'long']);
    run.steer(h, w);
    expect(run.gustHeld(h, w, 3)).toBe(null);
    const bribe = new Pilot(['bribe', 'long', 'long', 'long', 'long']);
    bribe.done.add('wreck');
    bribe.steer(h, w);
    expect(bribe.gustHeld(h, w, 3)).toBe('way');
    expect(bribe.gustHeld(h, { ...w, paid: () => true }, 3)).toBe(null);
  });
  it('your last plan kept, 13 Nov: "persist the last plan you chose so that you don\'t need to do it every time"; anything stale or broken reads as the long way', () => {
    const plan: Plan = ['bribe', 'headwind', 'whirls', 'locks', 'crane'];
    expect(readPlan(writePlan(plan))).toEqual(plan);
    expect(readPlan(null)).toEqual(longPlan());
    expect(readPlan('')).toEqual(longPlan());
    expect(readPlan('not json {')).toEqual(longPlan());
    expect(readPlan('{"a":1}')).toEqual(longPlan());
    expect(readPlan('["bribe","nonsense","whirls"]')).toEqual(['bribe', 'long', 'whirls', 'long', 'long']);
    expect(readPlan('["crane","crane","crane","crane","crane"]')).toEqual(['long', 'long', 'long', 'long', 'crane']);
  });
});

describe('the plan\'s strip: the course and each choice\'s time (13 Nov: "you need to be able to see the length. This is very disconnected")', () => {
  it('each choice\'s time against the long way is the simulation\'s own: what its shortcut saves (CUTS) and a decent player\'s puzzle (SIM.PUZZLE)', () => {
    expect(choiceTime(0, 'long')).toEqual({ saves: 0, puzzle: 0, net: 0 });
    expect(choiceTime(1, 'headwind')).toEqual({ saves: CUTS.headwind.saves, puzzle: SIM.PUZZLE.row, net: SIM.PUZZLE.row - CUTS.headwind.saves });
    expect(choiceTime(4, 'locks').saves).toBe(0);   // (not one of leg 5's)
    expect(choiceTime(3, 'locks')).toMatchObject({ saves: CUTS.locks.saves, puzzle: SIM.PUZZLE.bilge });
    expect(choiceTime(2, 'whirls').puzzle).toBeGreaterThan(SIM.PUZZLE.vegas);   // (a Vegas doesn't always come off the first go)
    for (const [leg, L] of LEGS.entries()) for (const o of L.options) {
      const x = choiceTime(leg, o.id);
      expect(Number.isFinite(x.net), `${leg} ${o.id}`).toBe(true);
      // (a chain hop's built on the move: no stop, its saving alone)
      expect(x.net).toBeCloseTo(x.move ? -x.saves : x.puzzle - x.saves, 9);
      expect(!!x.move, `${leg} ${o.id}`).toBe(['quad', 'double', 'triple', 'zigzag'].includes(o.id));
      if (o.id !== 'long') expect(x.saves, `${leg} ${o.id}`).toBeGreaterThan(0);
    }
    const plan: Plan = ['quad', 'door', 'forage', 'zigzag', 'triple'];
    expect(planTime(plan)).toBeCloseTo(plan.reduce((n, id, leg) => n + choiceTime(leg, id).net, 0), 9);
    expect(planTime(longPlan())).toBe(0);
  });
  it('each choice\'s line on the course: the long way along its leg, a shortcut off it and back on, the headwind gap round its dog-leg', () => {
    const near = (a: [number, number], b: [number, number]) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) < 1.01;
    const head = choiceLines(1, 'headwind')[0];
    for (const q of RC.HEADWIND) expect(head).toContainEqual(q);
    const long2 = choiceLines(1, 'long')[0];
    expect(near(long2[0], [long2[0][0], S[1].r])).toBe(true);
    expect(choiceLines(0, 'bribe').length).toBe(2);   // (the wreck's notch, then the gate)
    // (the whole long way, one line from the line to the finish; a plan's lines join up end to end)
    expect(planLines(longPlan()).length).toBe(1);
    const ls = planLines(['long', 'headwind', 'whirls', 'locks', 'crane']);
    expect(ls.length).toBe(9);
    for (let i = 1; i < ls.length; i++) expect(ls[i][0], `line ${i}`).toEqual(ls[i - 1][ls[i - 1].length - 1]);
    // (the course drawn small: its land, the headwind gap open water through it)
    const ch = courseChart();
    const solid = (c: number, r: number) => ch.land.some(([y, a, b]) => y === r && a <= c && c <= b);
    expect(solid(RC.HEADWIND[0][0] - 1, RC.HEADWIND[0][1])).toBe(true);
    for (const [c, r] of RC.HEADWIND) expect(solid(c, r)).toBe(false);
  });
});
void FIELD; void Field; void courseSea;
