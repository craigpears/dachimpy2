import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WEATHER, WIND, Wind, moveTime, pointOf, rowTime, upwind, type Strength } from '../src/den-wind';
import { SAIL, Sea, Helm, type Move, type SailEvent } from '../src/den-sail';

// An open sea (no rocks, no lanes) with a wind on it: this way, this strong, and for a long while.
const windySea = (d = 1, s: Strength = 2) => { const sea = new Sea(1, false); sea.rocks.clear(); sea.breeze = new Wind(1); sea.breeze.set(d, s, 1e9); return sea; };
const run = (h: Helm, secs: number, step = 0.05) => { const ev: SailEvent[] = []; for (let t = 0; t < secs; t += step) ev.push(...h.tick(step)); return ev; };
// Where she is after each move she's sailed.
const moves = (ev: SailEvent[]) => ev.filter((e) => e.kind === 'move') as Extract<SailEvent, { kind: 'move' }>[];

// The wind's parked for now (10 Nov); these are its rules when it's turned back on, so they run
// with it on, and the parked ones below turn it off again.
const parked = WEATHER.parked;
beforeEach(() => { WEATHER.parked = false; });
afterEach(() => { WEATHER.parked = parked; });

describe('the wind (9 Nov: "try it. We\'ll see how it feels, whether it\'s overcomplicated or not")', () => {
  it('a good wind drops, sometimes to a calm, and picks up again; it only ever shifts a quarter', () => {
    const w = new Wind(7);
    expect([w.d, w.s]).toEqual([WIND.START.d, WIND.START.s]);
    const seen = new Set<Strength>(), steps: string[] = [];
    for (let t = 0; t < 3600; t += 0.5) for (const e of w.tick(0.5)) {
      if (e.kind !== 'wind') continue;
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

  it('under sail quicker in a good wind, slower in light airs, nowhere in a calm; a square at the oars the same whatever the wind', () => {
    expect(moveTime(2, false)).toBeLessThan(moveTime(1, false));
    expect(moveTime(0, false)).toBe(Infinity);
    for (const s of [0, 1, 2] as Strength[]) expect(moveTime(s, true)).toBe(WIND.OARS);
  });

  it('in a strong wind "I\'m not seeing like a big speed difference" (10 Nov): before the wind three times as quick as across it, and nowhere into it', () => {
    expect([pointOf(1, 1), pointOf(0, 1), pointOf(2, 1), pointOf(3, 1)]).toEqual(['run', 'reach', 'reach', 'into']);
    expect(moveTime(2, false, 'reach') / moveTime(2, false, 'run')).toBeGreaterThan(2.99);
    expect(moveTime(2, false, 'into')).toBe(Infinity);
    expect(moveTime(1, false, 'run')).toBeGreaterThan(moveTime(2, false, 'run'));
  });

  it('"it changes quite quickly" (10 Nov): a good wind lasts two minutes or more, and every change is warned of first', () => {
    const w = new Wind(11);
    let t = 0, since = 0, warned: { at: number; d: number; s: number } | null = null, changes = 0;
    for (; t < 7200; t += 0.25) for (const e of w.tick(0.25)) {
      if (e.kind === 'warn') { expect(warned).toBeNull(); warned = { at: t, d: e.d, s: e.s }; continue; }
      // Each change was said WARN seconds before, and is what was said.
      expect(warned).not.toBeNull();
      expect(t - warned!.at).toBeCloseTo(WIND.WARN, 0);
      expect([e.d, e.s]).toEqual([warned!.d, warned!.s]);
      if (e.was.s === 2) expect(t - since).toBeGreaterThanOrEqual(WIND.SPELL[2][0] - 0.5);
      warned = null; since = t; changes++;
    }
    expect(changes).toBeGreaterThan(10);
    expect(WIND.SPELL[2][0]).toBeGreaterThanOrEqual(120);
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
  // (Heading out to sea, d 0, with the wind blowing right, d 1, it's across her.)
  const forward = (sea: Sea, oars: boolean, d = 0) => {
    const h = new Helm(sea, { c: 8, r: 3, d });
    h.row(oars);
    if (oars) h.stroke(['F']); else h.put('F');
    let t = 0, began = -1;
    for (; t < 10 && h.pose.r === 3; t += 0.01) for (const e of h.tick(0.01)) if (e.kind === 'move') began = t;
    return t - began;
  };

  it('a move takes less time in a good wind, more in light airs, least with the wind behind her; a square rowed on its own the same whatever the wind', () => {
    expect(forward(windySea(1, 2), false)).toBeCloseTo(WIND.REACH, 1);
    expect(forward(windySea(1, 1), false)).toBeCloseTo(WIND.REACH * WIND.LIGHT, 1);
    expect(forward(windySea(0, 2), false)).toBeCloseTo(WIND.RUN, 1);
    expect(forward(windySea(1, 2), true)).toBeCloseTo(WIND.OARS, 1);
    expect(forward(windySea(1, 0), true)).toBeCloseTo(WIND.OARS, 1);
  });

  it('"I\'m not seeing like a big speed difference" (10 Nov): a turn\'s worth before the wind takes well under half as long as across it', () => {
    const turn = (blows: number) => {
      const h = new Helm(windySea(blows, 2), { c: 8, r: 2, d: 0 });
      for (let i = 0; i < 4; i++) h.put('F');
      let t = 0;
      for (; t < 30 && h.pose.r < 6; t += 0.01) h.tick(0.01);
      return t;
    };
    expect(turn(0)).toBeLessThan(turn(1) / 2);
  });

  it('becalmed under sail she\'s dead in the water till the wind picks up', () => {
    const sea = windySea(1, 0), h = new Helm(sea, { c: 8, r: 3, d: 0 });
    h.drop(8, 9);
    run(h, 10);
    expect(h.pose).toEqual({ c: 8, r: 3, d: 0 });
    expect(h.held()).toBe('calm');
    expect(h.spared()).toBe(false);   // (becalmed under the guns, row out of it)
    sea.breeze!.set(1, 2, 1e9);
    run(h, 20);
    expect([h.pose.c, h.pose.r]).toEqual([8, 9]);
  });

  it('in a calm the oars keep her going, rowed by the board', () => {
    const sea = windySea(1, 0), h = new Helm(sea, { c: 8, r: 3, d: 0 });
    h.row(true);
    for (let i = 0; i < 6; i++) { h.stroke(['F']); run(h, 1.6); }
    expect([h.pose.c, h.pose.r]).toEqual([8, 9]);
  });

  it('each move goes at the wind there is as it begins', () => {
    const sea = windySea(1, 2), h = new Helm(sea, { c: 8, r: 0, d: 0 });
    h.drop(8, 12);
    const ev = run(h, 1.2);
    sea.breeze!.set(1, 1, 1e9);
    ev.push(...run(h, 40));
    const secs = moves(ev).map((e) => e.secs);
    expect(secs[0]).toBe(WIND.REACH);
    expect(secs[secs.length - 1]).toBeCloseTo(WIND.REACH * WIND.LIGHT);
  });

  it('in irons it shows on her: the move she\'s on is marked, and she makes no way', () => {
    const sea = windySea(1, 2), h = new Helm(sea, { c: 8, r: 3, d: 3 });
    h.put('F');
    run(h, 0.6);
    expect(h.cur?.irons).toBe(true);
    run(h, 3);
    expect(h.pose).toEqual({ c: 8, r: 3, d: 3 });
  });

  it('in a calm, the first token of "This turn" lights up though she isn\'t moving (10 Nov): not any more', () => {
    const sea = windySea(1, 0), h = new Helm(sea, { c: 8, r: 3, d: 0 });
    h.drop(8, 9);
    run(h, 5);
    expect([h.held(), h.slot, h.lit()]).toEqual(['calm', 0, -1]);
    sea.breeze!.set(1, 2, 1e9);
    run(h, 0.1);
    expect(h.lit()).toBe(0);
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

  it('"a pop-up saying you can\'t sail there. Well, it is letting me" (10 Nov): dropped upwind, she really waits, says so once, and never runs the oars out herself', () => {
    const sea = windySea(0), h = new Helm(sea, { c: 8, r: 8, d: 2 });
    h.drop(8, 3);
    const ev = run(h, 30);
    expect(ev.filter((e) => e.kind === 'headwind')).toHaveLength(1);
    expect(h.oars).toBe(false);
    expect(h.headwind()).toBe(true);
    expect([h.pose.c, h.pose.r]).toEqual([8, 8]);
    // The wind comes round behind her and she sails on.
    sea.breeze!.set(2, 2, 1e9);
    run(h, 20);
    expect(h.pin).toBeNull();
  });

  it('at the oars the pilot doesn\'t row for her: the pin stays, a buoy to row for, and goes when she gets there', () => {
    const sea = windySea(1), h = new Helm(sea, { c: 8, r: 3, d: 0 });
    h.row(true);
    h.drop(8, 6);
    run(h, 10);
    expect([h.pose.r, h.pin]).toEqual([3, [8, 6]]);
    expect(h.next()).toEqual([]);
    h.stroke(['F', 'F', 'F']);
    const ev = run(h, 10);
    expect(ev.some((e) => e.kind === 'arrive')).toBe(true);
    expect([h.pose.r, h.pin, h.oars]).toEqual([6, null, true]);
  });

  it('ship the oars and she sails on to the pin by the wind', () => {
    const sea = windySea(1), h = new Helm(sea, { c: 8, r: 3, d: 0 });
    h.row(true);
    h.drop(8, 8);
    run(h, 5);
    h.row(false);
    run(h, 30);
    expect(h.pin).toBeNull();
    expect([h.pose.c, h.pose.r]).toEqual([8, 8]);
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

describe('the wind parked (10 Nov: "I think maybe we need to park the wind idea for now. That\'s just getting irritating")', () => {
  beforeEach(() => { WEATHER.parked = true; });

  it('it\'s parked as things stand, and turning it back on brings the weather back', () => {
    expect(parked).toBe(true);
    WEATHER.parked = false;
    const w = new Wind(1); w.set(1, 0, 1e9);
    expect([w.s, upwind(3, 1), moveTime(2, false, 'reach')]).toEqual([0, true, WIND.REACH]);
  });

  it('a steady good wind: it never drops or shifts, so nothing\'s ever said of it', () => {
    const w = new Wind(7);
    const ev: unknown[] = [];
    for (let t = 0; t < 3600; t += 0.5) ev.push(...w.tick(0.5));
    expect(ev).toEqual([]);
    expect([w.d, w.s]).toEqual([WIND.START.d, 2]);
    w.set(1, 0);   // (a calm can't be had even by asking)
    expect(w.s).toBe(2);
    expect(new Wind(1, 2, 1).s).toBe(2);
  });

  it('under sail she goes the same every way, at a good wind\'s pace with it behind her; at the oars as ever', () => {
    for (const s of [0, 1, 2] as Strength[]) for (const p of ['run', 'reach', 'into'] as const) expect(moveTime(s, false, p)).toBe(WIND.RUN);
    for (const s of [0, 1, 2] as Strength[]) expect(moveTime(s, true)).toBe(WIND.OARS);
    for (let d = 0; d < 4; d++) { expect(upwind(d, 1)).toBe(false); expect(pointOf(d, 1)).toBe('run'); }
  });

  it('"no irons": every way she heads, a move takes her on, the same time every way', () => {
    const sea = windySea(1);
    for (let d = 0; d < 4; d++) for (const m of ['F', 'L', 'R'] as Move[]) {
      const p = { c: 8, r: 5, d };
      expect(sea.irons(p, m)).toBe(false);
      expect(sea.move(p, m)).toMatchObject({ bump: false });
      expect(sea.moveSecs(false, p, m)).toBe(WIND.RUN);
    }
  });

  it('no calm: put out in what was a calm, she sails straight to the pin', () => {
    const sea = windySea(1, 0), h = new Helm(sea, { c: 8, r: 3, d: 0 });
    h.drop(8, 9);
    const ev = run(h, 10);
    expect([h.pose.c, h.pose.r, h.pin]).toEqual([8, 9, null]);
    expect(h.becalmed()).toBe(false);
    expect(ev.filter((e) => e.kind === 'wind' || e.kind === 'warn')).toEqual([]);
  });

  it('a pin anywhere is sailed to, never "dead against the wind"', () => {
    const sea = windySea(0), h = new Helm(sea, { c: 8, r: 8, d: 2 });
    expect(sea.plot({ c: 8, r: 8, d: 0 }, 8, 2)).not.toBeNull();
    h.drop(8, 3);
    const ev = run(h, 10);
    expect(ev.filter((e) => e.kind === 'headwind')).toEqual([]);
    expect(h.headwind()).toBe(false);
    expect([h.pose.c, h.pose.r, h.oars]).toEqual([8, 3, false]);
  });

  it('a turn\'s worth takes as long whichever way the wind was set to blow', () => {
    const turn = (blows: number) => {
      const h = new Helm(windySea(blows, 2), { c: 8, r: 2, d: 0 });
      for (let i = 0; i < 4; i++) h.put('F');
      let t = 0;
      for (; t < 30 && h.pose.r < 6; t += 0.01) h.tick(0.01);
      return t;
    };
    const behind = turn(0);
    for (const blows of [1, 2, 3]) expect(turn(blows)).toBeCloseTo(behind, 1);
  });
});
