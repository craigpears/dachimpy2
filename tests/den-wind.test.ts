import { describe, expect, it } from 'vitest';
import { WIND, Wind, moveTime, upwind, type Strength } from '../src/den-wind';
import { SAIL, Sea, Helm, type Move, type SailEvent } from '../src/den-sail';

// An open sea (no rocks, no lanes) with a wind on it: this way, this strong, and for a long while.
const windySea = (d = 1, s: Strength = 2) => { const sea = new Sea(1, false); sea.rocks.clear(); sea.breeze = new Wind(1); sea.breeze.set(d, s, 1e9); return sea; };
const run = (h: Helm, secs: number, step = 0.05) => { const ev: SailEvent[] = []; for (let t = 0; t < secs; t += step) ev.push(...h.tick(step)); return ev; };
// Where she is after each move she's sailed.
const moves = (ev: SailEvent[]) => ev.filter((e) => e.kind === 'move') as Extract<SailEvent, { kind: 'move' }>[];

describe('the wind (9 Nov: "try it. We\'ll see how it feels, whether it\'s overcomplicated or not")', () => {
  it('a good wind drops, sometimes to a calm, and picks up again; it only ever shifts a quarter', () => {
    const w = new Wind(7);
    expect([w.d, w.s]).toEqual([WIND.START.d, WIND.START.s]);
    const seen = new Set<Strength>(), steps: string[] = [];
    for (let t = 0; t < 3600; t += 0.5) for (const e of w.tick(0.5)) {
      seen.add(e.s);
      expect(Math.abs(e.s - e.was.s)).toBeLessThanOrEqual(1);   // (never good straight to calm)
      const turn = (e.d - e.was.d + 4) % 4;
      expect([0, 1, 3]).toContain(turn);
      steps.push(`${e.was.s}${e.s}`);
    }
    expect([...seen].sort()).toEqual([0, 1, 2]);
    // A calm always comes back as light airs, and they always freshen after it.
    for (let i = 0; i + 1 < steps.length; i++) if (steps[i] === '01') expect(steps[i + 1]).toBe('12');
  });

  it('a good wind most of the time, a calm now and then', () => {
    const w = new Wind(3), time = [0, 0, 0];
    for (let t = 0; t < 7200; t += 0.5) { time[w.s] += 0.5; w.tick(0.5); }
    expect(time[2]).toBeGreaterThan(time[1] + time[0]);
    expect(time[0]).toBeGreaterThan(0);
  });

  it('the same seed, the same weather', () => {
    const a = new Wind(5), b = new Wind(5), log = (w: Wind) => { const o: string[] = []; for (let t = 0; t < 600; t += 1) w.tick(1).forEach((e) => o.push(`${t}:${e.d}${e.s}`)); return o; };
    expect(log(a)).toEqual(log(b));
  });

  it('under sail quicker in a good wind, slower in light airs, nowhere in a calm; rowing steady between', () => {
    expect(moveTime(2, false)).toBeLessThan(moveTime(1, true));
    expect(moveTime(1, true)).toBeLessThan(moveTime(1, false));
    expect(moveTime(0, false)).toBe(Infinity);
    for (const s of [0, 1, 2] as Strength[]) expect(moveTime(s, true)).toBe(WIND.OARS);
  });

  it('against the wind is the step straight into it, nothing else', () => {
    expect(upwind(3, 1)).toBe(true);
    expect([0, 1, 2].map((d) => upwind(d, 1))).toEqual([false, false, false]);
  });
});

describe('sailing by the wind (9 Nov: under sail you "can\'t go against the wind")', () => {
  // The wind blowing right (1), as seen from the den: left (3) is against it.
  it('straight into the wind she gets nothing: in irons, she stays where she is', () => {
    const sea = windySea(1), p = { c: 8, r: 5, d: 3 };
    expect(sea.move(p, 'F')).toMatchObject({ to: p, bump: true, irons: true });
    // A turn either side swings her head round where she is.
    expect(sea.move(p, 'L')).toMatchObject({ to: { c: 8, r: 5, d: 2 }, irons: true });
    expect(sea.move(p, 'R')).toMatchObject({ to: { c: 8, r: 5, d: 0 }, irons: true });
  });

  it('a turn that would end up heading into it turns her on the spot', () => {
    const sea = windySea(1);
    expect(sea.move({ c: 8, r: 5, d: 0 }, 'L')).toMatchObject({ to: { c: 8, r: 5, d: 3 }, irons: true });
  });

  it('across the wind and before it she sails as ever', () => {
    const sea = windySea(1);
    for (const [d, m] of [[0, 'F'], [2, 'F'], [1, 'F'], [0, 'R'], [2, 'L']] as [number, Move][]) expect(sea.move({ c: 8, r: 5, d }, m).bump).toBe(false);
  });

  it('at the oars she goes any way, into the wind too', () => {
    const sea = windySea(1), p = { c: 8, r: 5, d: 3 };
    expect(sea.move(p, 'F', true)).toMatchObject({ to: { c: 7, r: 5, d: 3 }, bump: false });
  });

  it('the trade winds still sweep her on in a calm: they\'re currents of their own', () => {
    const sea = new Sea(9);
    sea.breeze = new Wind(1); sea.breeze.set(1, 0, 1e9);
    // Rowing onto the lane off the beach: it has her.
    const [c, r] = [9, 1], got = sea.move({ c, r: r - 1, d: 0 }, 'F', true);
    expect(sea.windAt(c, r + 1)).toBe(0);
    expect(got.to).toEqual({ c, r, d: 0 });
    const on = sea.move({ c, r, d: 0 }, 'F', true);
    expect(on.ride.length).toBeGreaterThan(3);
  });
});

describe('her pace by the wind, and the oars', () => {
  // How long her first forward takes, from her giving the order: the move itself, not the wake-up.
  const forward = (sea: Sea, oars: boolean) => {
    const h = new Helm(sea, { c: 8, r: 3, d: 0 });
    h.row(oars);
    h.put('F');
    let t = 0, began = -1;
    for (; t < 10 && h.pose.r === 3; t += 0.01) for (const e of h.tick(0.01)) if (e.kind === 'move') began = t;
    return t - began;
  };

  it('a move takes less time in a good wind, more in light airs; rowing is in between, whatever the wind', () => {
    expect(forward(windySea(1, 2), false)).toBeCloseTo(WIND.GOOD, 1);
    expect(forward(windySea(1, 1), false)).toBeCloseTo(WIND.LIGHT, 1);
    expect(forward(windySea(1, 2), true)).toBeCloseTo(WIND.OARS, 1);
    expect(forward(windySea(1, 0), true)).toBeCloseTo(WIND.OARS, 1);
  });

  it('becalmed under sail she\'s dead in the water till the wind picks up', () => {
    const sea = windySea(1, 0), h = new Helm(sea, { c: 8, r: 3, d: 0 });
    h.drop(8, 9);
    run(h, 10);
    expect(h.pose).toEqual({ c: 8, r: 3, d: 0 });
    expect(h.held()).toBe('calm');
    expect(h.spared()).toBe(false);   // (becalmed under the turret's guns, row out of it)
    sea.breeze!.set(1, 2, 1e9);
    run(h, 20);
    expect([h.pose.c, h.pose.r]).toEqual([8, 9]);
  });

  it('in a calm the oars keep her going', () => {
    const sea = windySea(1, 0), h = new Helm(sea, { c: 8, r: 3, d: 0 });
    h.row(true);
    h.drop(8, 9);
    run(h, 20);
    expect([h.pose.c, h.pose.r]).toEqual([8, 9]);
  });

  it('a turn under way plays out at the pace it began at, and the next at the new wind\'s', () => {
    const sea = windySea(1, 2), h = new Helm(sea, { c: 8, r: 0, d: 0 });
    h.drop(8, 12);
    const ev = run(h, 1.2);
    sea.breeze!.set(1, 1, 1e9);
    ev.push(...run(h, 30));
    const secs = moves(ev).map((e) => e.secs);
    expect(secs[0]).toBe(WIND.GOOD);
    expect(secs[secs.length - 1]).toBe(WIND.LIGHT);
  });
});

describe('the pilot and the wind', () => {
  it('never plans a square against the wind under sail', () => {
    const sea = windySea(0);   // blowing out to sea: back in towards the cove is against it
    for (const [c, r] of [[2, 6], [14, 3], [8, 12], [0, 13]] as [number, number][]) {
      const plan = sea.plot({ c: 8, r: 2, d: 1 }, c, r);
      expect(plan).not.toBeNull();
      let p = { c: 8, r: 2, d: 1 };
      for (const m of plan!) { expect(sea.irons(p, m)).toBe(false); p = sea.sail(p, m).to; }
      expect([p.c, p.r]).toEqual([c, r]);
    }
  });

  it('a pin upwind can\'t be sailed to, but can be rowed to; and the pin stays where you dropped it', () => {
    const sea = windySea(0), from = { c: 8, r: 8, d: 0 };
    expect(sea.plot(from, 8, 2)).toBeNull();
    expect(sea.plot(from, 8, 2, null, true)).not.toBeNull();
    expect(sea.pinAt(8, 2, from)).toEqual([8, 2]);
  });

  it('her bow into the wind, the pilot swings her off it and sails on', () => {
    const sea = windySea(1), from = { c: 8, r: 5, d: 3 }, plan = sea.plot(from, 8, 10)!;
    expect(plan).not.toBeNull();
    expect(sea.irons(from, plan[0])).toBe(true);   // (the first turns her where she is)
  });

  it('dropped upwind, the pilot runs the oars out, rows there, and ships them again', () => {
    const sea = windySea(0), h = new Helm(sea, { c: 8, r: 8, d: 2 });
    h.drop(8, 3);
    const ev = run(h, 30), oars = ev.filter((e) => e.kind === 'oars');
    expect([h.pose.c, h.pose.r]).toEqual([8, 3]);
    expect(oars).toEqual([{ kind: 'oars', out: true, auto: true }, { kind: 'oars', out: false, auto: true }]);
    expect(h.oars).toBe(false);
  });

  it('ship the oars yourself on the way and the pilot leaves them be: she waits on the wind', () => {
    const sea = windySea(0), h = new Helm(sea, { c: 8, r: 8, d: 2 });
    h.drop(8, 3);
    run(h, 3);
    expect(h.oars).toBe(true);
    h.row(false);
    run(h, 20);
    expect(h.oars).toBe(false);
    expect(h.headwind()).toBe(true);
    // The wind comes round behind her and she sails on.
    sea.breeze!.set(2, 2, 1e9);
    run(h, 20);
    expect(h.pin).toBeNull();
  });

  it('your own oars stay out when she gets there', () => {
    const sea = windySea(1), h = new Helm(sea, { c: 8, r: 3, d: 0 });
    h.row(true);
    h.drop(8, 8);
    run(h, 20);
    expect(h.pin).toBeNull();
    expect(h.oars).toBe(true);
  });

  it('the course follows the wind: shift it, and she plans again from where she\'ll be', () => {
    const sea = windySea(1), h = new Helm(sea, { c: 4, r: 4, d: 0 });
    h.drop(10, 4);   // downwind of her
    expect(h.course().length).toBeGreaterThan(0);
    sea.breeze!.set(3, 2, 1e9);   // now it's against her
    expect(sea.plot(h.after(), 10, 4)).toBeNull();
    expect(h.headwind()).toBe(true);
  });

  it('with no wind on the sea, every move takes SAIL.MOVE as before', () => {
    const sea = new Sea(1, false);
    expect(sea.moveSecs()).toBe(SAIL.MOVE);
    expect(sea.moveSecs(true)).toBe(SAIL.MOVE);
  });
});
