/* The sloop race's rivals: the den's own characters, racing you on the water (src/den-rivals.ts; each one's
   racing in her file in src/lines/; sailed by the simulation's bots, src/race-sim.ts's simDrive). The user,
   11 Nov: "whoever other characters we've got already in here can all be characters that can drive sloops
   ... Everyone's got their own little profile and way they approach it", and "I definitely want to be able
   to shoot other racers. That's absolutely part of this." */
import { describe, expect, it } from 'vitest';
import { LAY, Sea } from '../src/den-sail';
import { RACE, Race, FIRST_SPOT, spotPose } from '../src/den-race';
import { RIVALS, MOST_RIVALS } from '../src/den-rivals';
import { ROUTES, STYLES, CUTS, SIM, startPose, simDrive, progressAt, tauAt } from '../src/race-sim';
import { sheltered } from '../src/den-racers';

const RC = LAY.RACE, S = RC.STRETCHES, sea = new Sea(9);
/** A race against all of them, sailed by the bots from `seed`, through the count. */
const going = (seed: number, n = MOST_RIVALS) => {
  const race = new Race(null, (f, rv) => simDrive(f, rv, seed));
  race.take(); race.setRivals(n); race.start();
  race.tick(RACE.COUNT + 0.01, { c: race.spot, r: RC.LINE.r });
  return race;
};
/** Ticks it on (you sat at `at`) till they're all home, or `secs` go by: each tick's events. */
const until = (race: Race, at: { c: number; r: number }, secs = 900, each?: (race: Race) => void) => {
  const out = [];
  for (let t = 0; t < secs && race.field.racers.slice(1).some((r) => r.time === null); t += 0.1) {
    out.push(...race.tick(0.1, at));
    each?.(race);
  }
  return out;
};

describe('the rivals are the den\'s own characters, each with a profile (11 Nov)', () => {
  it('Kikkit, Tzz, and Dalnoth with Umami aboard (for Daquan, not drawn yet); each a route and a style the simulation sails, and lines for the start and the finish', () => {
    expect(RIVALS.map((r) => r.name)).toEqual(['Kikkit', 'Tzz', 'Dalnoth']);
    expect(RIVALS.find((r) => r.crew)?.crew?.who).toBe('umami');
    for (const R of RIVALS) {
      expect(ROUTES.map((x) => x.name), R.name).toContain(R.racer.route);
      expect(STYLES.map((x) => x.name), R.name).toContain(R.racer.style);
      for (const k of ['start', 'won', 'lost'] as const) expect(R.racer.says[k].length, `${R.name} ${k}`).toBeGreaterThan(0);
      // (never the starlit door: it's a secret, and a rival vanishing into a cliff would give it away)
      expect(R.racer.route).not.toBe('door');
    }
    // Kikkit greedy for the Vegas, Tzz steady on the Doubles and never firing, Umami's foraging.
    expect(RIVALS.map((r) => r.racer.route)).toEqual(['whirls', 'doubles', 'forage']);
    expect(RIVALS[1].racer.style).toBe('peaceful');
  });

  it('each starts on her own spot on the line, none yours to begin with, and comes down the field from it', () => {
    const spots = RIVALS.map((r) => r.spot);
    expect(new Set(spots).size).toBe(spots.length);
    expect(spots).not.toContain(FIRST_SPOT);
    for (const c of spots) {
      expect(c).toBeGreaterThanOrEqual(RC.LINE.c0);
      expect(c).toBeLessThanOrEqual(RC.LINE.c1);
      // (straight down the field from her spot: no whirlpool in her way)
      for (let r = RC.LINE.r; r <= S[0].r; r++) expect(!!sea.whirlAt(c, r), `${c},${r}`).toBe(false);
      expect(startPose(c, 0, 0)).toMatchObject({ c, r: RC.LINE.r });
    }
    // (and onto the long way, on the first leg)
    const p = startPose(4, 0, tauAt(0, RACE.LONG_SPOT));
    expect([p.c, p.r]).toEqual([RACE.LONG_SPOT, S[0].r]);
  });
});

describe('a field of rivals on the water: one to three of them, three to start with (11 Nov)', () => {
  it('picked on the line, 1 to 3, the first of them in order; your spot\'s never one of theirs', () => {
    const race = new Race();
    race.take();
    expect(race.rivals).toBe(3);
    expect(race.field.racers).toHaveLength(4);
    expect(race.setRivals(1)).toBe(1);
    expect(race.field.racers.map((r) => r.name)).toEqual(['you', 'Kikkit']);
    expect(race.field.racers[1].pose).toEqual(spotPose(RIVALS[0].spot));
    race.shift(0, RIVALS[1].spot);
    expect(race.spot).toBe(RIVALS[1].spot);   // (Tzz isn't racing: hers is free)
    race.setRivals(2);
    expect(race.spot).not.toBe(RIVALS[1].spot);   // (she is now: you're moved along)
    expect(race.setRivals(9)).toBe(MOST_RIVALS);
    expect(race.setRivals(0)).toBe(1);
    race.start();
    expect(race.setRivals(3)).toBe(1);   // (not once the count's begun)
  });

  it('each races her own favourite way round and gets home: Kikkit stops at the whirlpools\' mouth, Dalnoth in the barrier\'s notch, Tzz hops the Double\'s gap', () => {
    const seen = new Set<string>();
    for (const seed of [1, 2, 3]) {
      const race = going(seed);
      until(race, { c: race.spot, r: RC.LINE.r }, 900, (R) => {
        const [k, t, d] = R.field.racers.slice(1).map((r) => [Math.round(r.pose.c), Math.round(r.pose.r)].join());
        if (k === [RC.WHIRLS.MOUTH.c, RC.WHIRLS.MOUTH.r].join()) seen.add('Kikkit');
        if (RC.DOUBLE.WAY.some(([c, r]) => `${c},${r}` === t)) seen.add('Tzz');
        if (d === RC.FORAGE.NOTCH.join()) seen.add('Dalnoth');
      });
      for (const r of race.field.racers.slice(1)) { expect(r.time, r.name).not.toBeNull(); expect(r.time!).toBeLessThan(400); }
    }
    expect([...seen].sort()).toEqual(['Dalnoth', 'Kikkit', 'Tzz']);
  }, 60000);

  it('her sloop never sails over land: down the field, along the legs, through her shortcut\'s own water (only the crane lifts one over a neck)', () => {
    for (const seed of [4, 5]) {
      const race = going(seed);
      until(race, { c: race.spot, r: RC.LINE.r }, 900, (R) => {
        R.field.racers.slice(1).forEach((r) => {
          if (r.state === 'finished' || (R.run?.lift(r.i) ?? 0) > 0) return;
          const c = Math.round(r.pose.c), y = Math.round(r.pose.r);
          // (the barrier of driftwood's squares are hers to sail once she's cleared her own)
          if (RC.FORAGE.BARRIER.some(([x, z]) => x === c && z === y)) return;
          expect(sea.ground(c, y), `${r.name} at ${c},${y} (${r.state})`).toBe(false);
        });
      });
    }
  }, 60000);
});

describe('shooting at sea, by the field\'s rules (11 Nov: "I definitely want to be able to shoot other racers")', () => {
  // You, sat still on the first leg's second row, in the open, as the field comes by along the first.
  const SIT = { c: 22, r: S[0].r + 1 };
  it('they fire on you sitting still in the open as they go by, by their style: Kikkit and Dalnoth do, Tzz never', () => {
    const by = new Set<string>();
    for (let seed = 1; seed <= 12; seed++) {
      const race = going(seed);
      for (const e of until(race, SIT, 60)) if (e.kind === 'shot' && e.hit === 0) by.add(race.field.racers[e.by].name);
    }
    expect(by.has('Tzz')).toBe(false);
    expect(by.size).toBeGreaterThan(0);
  }, 60000);

  it('sailing on, or sheltered in a notch, she\'s never hit', () => {
    expect(sheltered(...RC.FORAGE.NOTCH)).toBe(true);
    for (let seed = 1; seed <= 6; seed++) {
      const race = going(seed);
      // (on the move: a square on every tick)
      const on = { c: 4, r: S[0].r + 1 };
      for (const e of until(race, on, 60, () => { on.c = on.c >= 25 ? 4 : on.c + 1; })) expect(e.kind === 'shot' && e.hit === 0).toBe(false);
      const sat = going(seed);
      for (const e of until(sat, { c: RC.FORAGE.NOTCH[0], r: RC.FORAGE.NOTCH[1] }, 300)) expect(e.kind === 'shot' && e.hit === 0).toBe(false);
    }
  }, 60000);

  it('your broadside holes a rival in reach: she\'s dazed till she\'s patched, then races on', () => {
    const race = going(7);
    until(race, { c: race.spot, r: RC.LINE.r }, 30);
    const k = race.field.racers[1];
    expect(k.state).not.toBe('dazed');
    const cells: [number, number][] = [[Math.round(k.pose.c), Math.round(k.pose.r)]];
    expect(race.target(cells)).toBe(1);
    expect(race.target([])).toBe(-1);
    expect(race.shoot(1)).toBe(true);
    expect(k.state).toBe('dazed');
    expect(k.hits).toBe(1);
    expect(race.shoot(1)).toBe(false);   // (holed already: not again till she's patched)
    let t = 0;
    while (k.state === 'dazed' && t < 120) { race.tick(0.1, { c: race.spot, r: RC.LINE.r }); t += 0.1; }
    expect(k.state).not.toBe('dazed');
    expect(t).toBeGreaterThan(3);
  });

  it('no shot of yours reaches a rival behind land: a spit between stops it', () => {
    const race = going(8);
    until(race, { c: race.spot, r: RC.LINE.r }, 30);
    const k = race.field.racers[1];
    // (a broadside over a spit's land first, then her square)
    const land = RC.LAND[0][0];
    expect(race.target([land, [Math.round(k.pose.c), Math.round(k.pose.r)]])).toBe(-1);
  });
});

describe('places: yours as you race, everyone\'s at the finish (11 Nov)', () => {
  it('your place among the field by how far round each of you has got; once home, by time', () => {
    const race = going(9);
    expect(race.place()).toBeGreaterThanOrEqual(1);
    until(race, { c: race.spot, r: RC.LINE.r }, 40);
    // (sat on the line, you're last)
    expect(race.place()).toBe(4);
    expect(progressAt({ c: 20, r: S[0].r })).toBeGreaterThan(progressAt({ c: 14, r: S[0].r }));
    expect(progressAt({ c: 10, r: S[2].r })).toBeGreaterThan(progressAt({ c: 10, r: S[1].r }));
    until(race, { c: race.spot, r: RC.LINE.r });
    const st = race.standings();
    expect(st.map((x) => x.place)).toEqual([1, 2, 3, 4]);
    expect(st[3].i).toBe(0);
    const times = st.slice(0, 3).map((x) => x.time!);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  }, 60000);

  it('every rival\'s home in about the long way\'s time or quicker: beatable on the shortcuts you\'re good at', () => {
    const t: number[] = [];
    for (let seed = 20; seed < 30; seed++) {
      const race = going(seed);
      until(race, { c: race.spot, r: RC.LINE.r });
      t.push(...race.field.racers.slice(1).map((r) => r.time!));
    }
    t.sort((a, b) => a - b);
    const mid = t[Math.floor(t.length / 2)];
    expect(mid).toBeGreaterThan(170);
    expect(mid).toBeLessThan(SIM.LONG);   // (235 till 13 Nov, the long way 223.5 s: round the fort's bay it's longer)
    expect(CUTS.whirls.saves).toBeGreaterThan(0);
  }, 60000);
});
