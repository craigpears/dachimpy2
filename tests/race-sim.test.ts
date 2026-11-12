/* The sloop race, simulated (src/race-sim.ts). The user, 11 Nov: "a test harness underneath this ... where
   you don't need to worry about the graphical elements. So you can just run through simulations quickly and
   easily, and just really test balance ... implement a handful of bots that go through different strategies
   ... and just actually make sure they all have a relatively equal chance of winning." */
import { describe, expect, it } from 'vitest';
import { LAY, Helm } from '../src/den-sail';
import { RACE, Race, spotPose } from '../src/den-race';
import { DOOR } from '../src/den-door';
import { SIM, CUTS, ROUTES, STYLES, run, simulate, lineUp, route, style, routePose, tauAt, type CutId } from '../src/race-sim';
import { stretchAt } from '../src/den-racers';
import { shut, WAYS, DT, longWay } from './race-helpers';

const RC = LAY.RACE;

describe('the simulated course is the helm\'s (11 Nov)', () => {
  it('the long way takes as long as the helm sails it, from the rival\'s spot on the line, no puzzle', () => {
    const h = new Helm(shut(...WAYS), spotPose(RACE.LONG_SPOT)), race = new Race();
    race.start();
    race.tick(RACE.COUNT + 0.01, h.pose);
    longWay(h, () => race.tick(DT, h.pose));
    for (let i = 0; i < 200 && race.state !== 'done'; i++) { h.tick(DT); race.tick(DT, h.pose); }
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
    const legs: Record<CutId, number[]> = { guns: [0, 1], wreck: [0, 0], headwind: [1, 2], double: [1, 2], whirls: [2, 3], forage: [2, 3], locks: [3, 4], zigzag: [3, 3], crane: [4, 5], triple: [4, 5], door: [1, 4] };
    for (const c of Object.values(CUTS)) expect([at(c.tIn), at(c.tOut)], c.id).toEqual(legs[c.id]);
    expect(tauAt(0, 20)).toBeLessThan(tauAt(1, 20));
  });

  it('each shortcut saves what the helm says it does (RACE.DECENT, as tests/den-race.test.ts holds the course)', () => {
    // (the wreck saves nothing itself: its coins pay the gun gap's guard, the gap's saving: 12 Nov)
    for (const c of Object.values(CUTS)) expect(c.saves, c.id).toBeCloseTo(c.id === 'door' ? DOOR.SAVES : c.id === 'zigzag' ? SIM.ZIGZAG : c.id === 'wreck' ? 0 : RACE.DECENT[c.id], 5);
    // (sheltered: the locks, the crane, the barrier's notch and the wreck's; the rest in the open, or on the move)
    expect(Object.values(CUTS).filter((c) => c.sheltered).map((c) => c.id).sort()).toEqual(['crane', 'forage', 'locks', 'wreck']);
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
      for (const r of res) { expect(r.time).toBeGreaterThan(SIM.LONG * 0.5); expect(r.time).toBeLessThan(SIM.LONG * 2.2); }
    }
  });

  it('a lock is one racer\'s at a time: the second waits, or goes on the long way', () => {
    const locks = route('locks'), peaceful = style('peaceful');
    let waited = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const [a, b] = simulate({ racers: [{ route: locks, style: peaceful, skill: 'great', spot: 12 }, { route: locks, style: peaceful, skill: 'great', spot: 12 }], seed, snakes: false });
      const ta = a.cuts.find((c) => c.id === 'locks')!, tb = b.cuts.find((c) => c.id === 'locks')!;
      if (!ta.done || !tb.done || Math.min(ta.saved, tb.saved) < Math.max(ta.saved, tb.saved) - 10) waited++;
    }
    expect(waited).toBeGreaterThan(10);
  });

  it('the long way, a sheltered shortcut and the peaceful are never shot at by another racer', () => {
    const rep = run(150, 4, { seed: 900, routes: ROUTES.filter((r) => ['long', 'locks', 'crane', 'forage'].includes(r.name)).concat(route('whirls')), styles: [style('aggressive')] });
    expect(rep.byStyle.aggressive.hitsGiven).toBeGreaterThan(0);
    // (the long way's clear of the gun gap's marks now: 11 Nov, the course's second pass)
    for (const r of ['long', 'locks', 'forage']) expect(rep.byRoute[r].hitsTaken, r).toBeLessThan(rep.byRoute[r].n * 0.1);
  }, 60000);
});

describe('balance: every way round a relatively equal chance of winning (11 Nov: "make sure they all have a relatively equal chance of winning")', () => {
  // A standard field: four racers, each a route drawn at random (no two alike), a style and a skill drawn
  // at random, and a spot on the line (half of them at the field's gap). Fair is one race in four. "Wildly
  // off" is under half of fair or over 1.6 times it (12.5% or 40%): with 800 races each route races about
  // 270 times, so chance alone moves a rate about 2.6 points either way; the band is wide enough for that
  // and for a route that's a little weaker or stronger (the gap's run, rightly the riskiest way past its
  // guns, sits near the bottom), and narrow enough to catch a way round that's never worth taking or one
  // that's always best, as the long way and the starlit door were on the first draft (1% and 58%).
  // Styles race against each other in every field, so their band is tighter: 0.75 to 1.25 of fair. It
  // races on the course as laid (11 Nov, its second pass: laid to what the simulation recommended).
  const rep = run(800, 4, { seed: 1 });
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
  it('no spot on the starting line always wins: left of the field\'s gap, at it, right of it, each about its fair share (11 Nov: "pick your starting spot along the starting edge")', () => {
    for (const z of ['left', 'gap', 'right']) {
      const t = rep.bySpot[z], rate = t.wins / t.n;
      expect(rate, z).toBeGreaterThan(fair * 0.6);
      expect(rate, z).toBeLessThan(fair * 1.4);
    }
  });
  it('the better puzzler still wins more: great over good over decent', () => {
    const w = (k: string) => rep.bySkill[k].wins / rep.bySkill[k].n;
    expect(w('great')).toBeGreaterThan(w('good'));
    expect(w('good')).toBeGreaterThan(w('decent'));
  });
  it('the lead isn\'t safe in the open, the back is free: stopped out in the open, a leader\'s hit far more often than the last', () => {
    const P = rep.byPosition;
    expect(P.leader.hit / P.leader.n).toBeGreaterThan(2 * (P.last.hit / P.last.n));
  });
  it('the leader always has a shortcut worth taking on every stretch, sheltered or on the move ("I don\'t want the leaders not be able to puzzle at all")', () => {
    // Each spit's shortcuts a leader can play safely, and what the best of them saved a good player, on average.
    const safe: CutId[][] = [['guns'], ['double'], ['forage'], ['locks', 'zigzag'], ['crane', 'triple']];
    for (const ids of safe) {
      for (const id of ids) expect(CUTS[id].sheltered || ['guns', 'double', 'triple', 'zigzag'].includes(id), id).toBe(true);
      const best = Math.max(...ids.map((id) => { const s = rep.cuts[id].saved.good; return s.secs / s.n; }));
      expect(best, ids.join()).toBeGreaterThan(0);
    }
  });
});

describe('the bribe at the gate, simulated (12 Nov: "build the bribe gate ... to show how many different ways you have of really getting through the course")', () => {
  it('a briber hauls the wreck\'s coins in its notch, sheltered, pays the gate and is towed through, never holed by its guns', () => {
    const bribe = route('bribe'), peaceful = style('peaceful');
    for (let seed = 1; seed <= 20; seed++) {
      // (an aggressive racer on the long way beside her, firing on anyone sitting still in the open)
      const [b] = simulate({ racers: [{ route: bribe, style: peaceful, skill: 'good', spot: 13 }, { route: route('long'), style: style('aggressive'), skill: 'good', spot: 14 }], seed, snakes: false });
      expect(b.hitsTaken, `seed ${seed}`).toBe(0);
      expect(b.exposed, `seed ${seed}`).toEqual([]);
      expect(b.cuts.find((c) => c.id === 'guns')?.done).toBe(true);
    }
  });
  it('the haul is counted against the gap it pays for: a decent player saves less than a great one, and both save something', () => {
    const at = (skill: 'decent' | 'great') => {
      let n = 0;
      for (let seed = 1; seed <= 40; seed++) n += simulate({ racers: [{ route: route('every'), style: style('peaceful'), skill, spot: 13 }, { route: route('long'), style: style('peaceful'), skill: 'decent', spot: 3 }], seed, snakes: false })[0].cuts.find((c) => c.id === 'guns')!.saved;
      return n / 40;
    };
    const decent = at('decent'), great = at('great');
    expect(decent).toBeGreaterThan(0);
    expect(great).toBeGreaterThan(decent);
    expect(great).toBeLessThan(RACE.DECENT.guns);
  });
});

describe('the starlit door\'s tunnel, simulated (12 Nov: "you should always get some benefit from going through it")', () => {
  const rep = run(400, 4, { seed: 12 });
  it('whoever goes in always comes out ahead of the mouth, at one exit or the other, never sent back to it', () => {
    const d = rep.cuts.door;
    expect(d.done).toBe(d.tried);
    const n = rep.exits.map((e) => e.decent + e.good + e.great);
    expect(n.reduce((a, b) => a + b, 0)).toBe(d.done);
    for (const [k, x] of n.entries()) expect(x, `exit ${k}`).toBeGreaterThan(0);
  });
  it('she takes the exits by her skill and luck: the far end mostly the Vegas players good at it, and it wins more than coming up at the first', () => {
    const [first, far] = rep.exits;
    expect(far.great + far.good).toBeGreaterThan(far.decent);
    expect(far.wins / (far.decent + far.good + far.great)).toBeGreaterThan(first.wins / (first.decent + first.good + first.great));
  });
});

describe('snakes in the simulation (11 Nov: "I want the snakes and [ladders]")', () => {
  it('each snake has a few racers in a standard field; the tight water by the gun gap, near the start, costs least', () => {
    const rep = run(400, 4, { seed: 3 });
    for (const s of ['mid', 'tight', 'left']) expect(rep.bySnake[s]?.n ?? 0, s).toBeGreaterThan(0);
    expect(rep.bySnake.tight.wins).toBeGreaterThan(0);
  }, 60000);
});
