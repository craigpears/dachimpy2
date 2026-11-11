/* The sloop race, simulated (src/race-sim.ts). The user, 11 Nov: "a test harness underneath this ... where
   you don't need to worry about the graphical elements. So you can just run through simulations quickly and
   easily, and just really test balance ... implement a handful of bots that go through different strategies
   ... and just actually make sure they all have a relatively equal chance of winning." */
import { describe, expect, it } from 'vitest';
import { LAY, Sea, Helm } from '../src/den-sail';
import { RACE, Race } from '../src/den-race';
import { SIM, CUTS, NEXT, ROUTES, STYLES, run, simulate, lineUp, route, style, routePose, tauAt } from '../src/race-sim';
import { stretchAt } from '../src/den-racers';

const RC = LAY.RACE, k = (c: number, r: number) => `${c},${r}`, DT = 0.05;

describe('the simulated course is the helm\'s (11 Nov)', () => {
  it('the long way takes as long as the helm sails it, no puzzle', () => {
    const G = RC.GUNS.gap, s = new Sea(9);
    for (const [c, r] of [G, ...RC.HEADWIND, ...RC.LOCKS.map((l) => l.at)]) s.rocks.add(k(c, r));
    const h = new Helm(s, { c: RC.BUOY[0], r: RC.BUOY[1], d: 0 }), race = new Race();
    race.start();
    let t = 0;
    for (const p of [[25, RC.SPITS[0].r0], [3, RC.SPITS[1].r1], [25, RC.SPITS[2].r1], [3, RC.SPITS[3].r1], [25, RC.SPITS[4].r1], [1, RC.STRETCHES[5].r]] as [number, number][]) {
      h.drop(...p);
      while ((h.pin || h.slot >= 0) && t < 900) { h.tick(DT); race.tick(DT, h.pose); t += DT; }
    }
    h.put('F');
    for (let i = 0; i < 400 && race.state !== 'done'; i++) { h.tick(DT); race.tick(DT, h.pose); }
    expect(race.state).toBe('done');
    expect(Math.abs(race.t - SIM.LONG)).toBeLessThan(SIM.LONG * 0.03);
  }, 60000);

  it('the route runs every stretch in order, a leg on its first row, and each shortcut leaves and rejoins it on the right ones', () => {
    let leg = -1;
    for (let t = 0; t < SIM.LONG; t += 0.5) {
      const p = routePose(t), s = stretchAt(Math.round(p.c), Math.round(p.r));
      if (s > leg) { expect(s).toBe(leg + 1); leg = s; }
    }
    expect(leg).toBe(RC.STRETCHES.length - 1);
    const at = (t: number) => { const p = routePose(t); return stretchAt(Math.round(p.c), Math.round(p.r)); };
    const legs = { guns: [0, 1], headwind: [1, 2], whirls: [2, 3], locks: [3, 4], crane: [4, 5], door: [1, 4] };
    for (const c of Object.values(CUTS)) expect([at(c.tIn), at(c.tOut)], c.id).toEqual(legs[c.id]);
    expect(tauAt(0, 10)).toBeLessThan(tauAt(1, 10));
  });

  it('each shortcut saves about what the helm says it does (RACE.DECENT, within a quarter, as tests/den-race.test.ts holds the course)', () => {
    for (const c of Object.values(CUTS)) {
      const want = c.id === 'door' ? 145 : RACE.DECENT[c.id];
      expect(c.saves, c.id).toBeGreaterThan(want * 0.75);
      expect(c.saves, c.id).toBeLessThan(want * 1.25);
    }
    // (sheltered: the locks and the crane; the rest in the open)
    expect(Object.values(CUTS).filter((c) => c.sheltered).map((c) => c.id).sort()).toEqual(['crane', 'locks']);
  });
});

describe('the simulation (11 Nov: "just run through simulations quickly and easily")', () => {
  it('is deterministic: one seed, one race', () => {
    const racers = lineUp(4, 7);
    expect(simulate({ racers, seed: 7 })).toEqual(simulate({ racers, seed: 7 }));
    expect(simulate({ racers, seed: 7 })).not.toEqual(simulate({ racers, seed: 8 }));
    expect(run(20, 3, { seed: 5 })).toEqual(run(20, 3, { seed: 5 }));
  });

  it('races two, three or four, and every racer gets home, placed one to n', () => {
    for (const n of [2, 3, 4]) for (let seed = 1; seed <= 15; seed++) {
      const res = simulate({ racers: lineUp(n, seed), seed });
      expect(res.map((r) => r.place).sort()).toEqual(Array.from({ length: n }, (_, i) => i + 1));
      for (const r of res) { expect(r.time).toBeGreaterThan(SIM.LONG * 0.5); expect(r.time).toBeLessThan(SIM.LONG * 2); }
    }
  });

  it('a lock is one racer\'s at a time: the second waits, or goes on the long way', () => {
    const locks = route('locks'), peaceful = style('peaceful');
    // (two great Bilgers, side by side at the start: one has to wait her turn)
    let waited = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const [a, b] = simulate({ racers: [{ route: locks, style: peaceful, skill: 'great' }, { route: locks, style: peaceful, skill: 'great' }], seed });
      const ta = a.cuts.find((c) => c.id === 'locks')!, tb = b.cuts.find((c) => c.id === 'locks')!;
      if (!ta.done || !tb.done || Math.min(ta.saved, tb.saved) < Math.max(ta.saved, tb.saved) - 10) waited++;
    }
    expect(waited).toBeGreaterThan(10);
  });

  it('the long way, a sheltered shortcut and the peaceful are never shot at by another racer', () => {
    const rep = run(150, 4, { ...NEXT, seed: 900, routes: ROUTES.filter((r) => ['long', 'locks', 'crane'].includes(r.name)).concat(route('whirls')), styles: [style('aggressive')] });
    expect(rep.byStyle.aggressive.hitsGiven).toBeGreaterThan(0);
    // (any hit on these is the gap's guns' (the long way runs past them), never a broadside: on the next
    // course the long way's clear of their marks)
    expect(rep.byRoute.long.hitsTaken).toBeLessThan(rep.byRoute.long.n * 0.1);
    expect(rep.byRoute.locks.hitsTaken).toBeLessThan(rep.byRoute.locks.n * 0.1);
  });
});

describe('balance: every way round a relatively equal chance of winning (11 Nov: "make sure they all have a relatively equal chance of winning")', () => {
  // A standard field: four racers, each a route drawn at random (no two alike), a style and a skill drawn
  // at random. Fair is one race in four. "Wildly off" is under half of fair or over 1.6 times it (12.5% or
  // 40%): with 800 races each route races about 320 times, so chance alone moves a rate about 2.5 points
  // either way; the band is wide enough for that and for a route that's a little weaker or stronger (the
  // gap's run, rightly the riskiest way past its guns, sits near the bottom), and narrow enough to catch a
  // way round that's never worth taking or one that's always best, as the long way and the starlit door
  // were on the first draft (1% and 58%). Styles race against each other in every field, so their band is
  // tighter: 0.75 to 1.25 of fair. It races on the course's next pass (NEXT) till it's laid.
  const rep = run(800, 4, { ...NEXT, seed: 1 });
  const fair = 1 / 4;
  for (const r of ROUTES) {
    it(`the ${r.name} route wins between half and 1.6 times its fair share`, () => {
      const t = rep.byRoute[r.name], rate = t.wins / t.n;
      expect(rate).toBeGreaterThan(fair * 0.5);
      expect(rate).toBeLessThan(fair * 1.6);
    });
  }
  for (const s of STYLES) {
    it(`the ${s.name} style wins between 0.75 and 1.25 times its fair share`, () => {
      const t = rep.byStyle[s.name], rate = t.wins / t.n;
      expect(rate).toBeGreaterThan(fair * 0.75);
      expect(rate).toBeLessThan(fair * 1.25);
    });
  }
  it('the better puzzler still wins more: great over good over decent', () => {
    const w = (k: string) => rep.bySkill[k].wins / rep.bySkill[k].n;
    expect(w('great')).toBeGreaterThan(w('good'));
    expect(w('good')).toBeGreaterThan(w('decent'));
  });
  it('the lead isn\'t safe in the open, the back is free: stopped out in the open, a leader\'s hit far more often than the last', () => {
    const P = rep.byPosition;
    expect(P.leader.hit / P.leader.n).toBeGreaterThan(2 * (P.last.hit / P.last.n));
  });
});
