import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WEATHER, WIND, Wind, moveTime, pointOf, rowTime, upwind, type Strength } from '../src/den-wind';
import { SAIL, LAY, Sea, Helm, type Move, type Pose, type SailEvent } from '../src/den-sail';
import { ends } from '../src/den-lock';

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

describe('a wind by the old wreck beyond the checkpoint (10 Nov: "it should only really apply to this little ... area")', () => {
  // As the game has it: the weather parked, and a wind zone by the wreck (LAY.ZONES).
  beforeEach(() => { WEATHER.parked = true; });
  const game = () => { const s = new Sea(9); s.breeze = new Wind(9); return s; };
  const Z = LAY.ZONES[0], [wc, wr] = LAY.WRECK, BY: [number, number] = [wc - 1, wr];
  /** Just through the checkpoint's gate, heading on out. */
  const THROUGH: Pose = { c: LAY.CHECKPOINT.GATE, r: LAY.CHECKPOINT.ROW + 1, d: 0 };
  /** At the foot of the last lock, come down through the headland. */
  const FOOT: Pose = { c: ends(LAY.LOCKS[3]).low[0], r: ends(LAY.LOCKS[3]).low[1], d: 0 };

  it('a zone is a patch of sea with a wind of its own, felt whatever the weather; out of it, the weather\'s', () => {
    const s = game();
    expect(s.zoneAt(wc, wr)).toEqual(Z);
    expect(s.airAt(wc + 1, wr)).toEqual({ d: Z.d, s: Z.s, felt: true });
    expect(s.airAt(SAIL.HOME.c, 5)!.felt).toBe(false);
    expect(s.zoneAt(LAY.CHECKPOINT.GATE, LAY.CHECKPOINT.ROW + 1)).toBeNull();
  });

  it('the wind\'s own rules in it, not a copy: behind her she\'s quick, across her slow, into it nowhere', () => {
    const s = new Sea(1, false);
    s.rocks.clear();
    s.zones = [{ c0: 5, c1: 10, r0: 5, r1: 10, d: 1, s: 2 }];
    expect(s.moveSecs(false, { c: 6, r: 7, d: 1 }, 'F')).toBe(WIND.RUN);
    expect(s.moveSecs(false, { c: 6, r: 7, d: 0 }, 'F')).toBe(WIND.REACH);
    expect(s.irons({ c: 8, r: 7, d: 3 }, 'F')).toBe(true);
    expect(s.move({ c: 8, r: 7, d: 3 }, 'F')).toMatchObject({ bump: true, irons: true, to: { c: 8, r: 7 } });
    // Heading in from outside counts (it's the wind where she's going), and out of it, none.
    expect(s.irons({ c: 11, r: 7, d: 3 }, 'F')).toBe(true);
    expect(s.irons({ c: 5, r: 7, d: 3 }, 'F')).toBe(false);
    expect(s.irons({ c: 2, r: 7, d: 3 }, 'F')).toBe(false);
    // A turn whose second leg heads into it.
    expect(s.irons({ c: 11, r: 6, d: 0 }, 'L')).toBe(true);
    // The oars beat it.
    expect(s.irons({ c: 8, r: 7, d: 3 }, 'F', true)).toBe(false);
    expect(s.move({ c: 8, r: 7, d: 3 }, 'F', true)).toMatchObject({ bump: false, to: { c: 7, r: 7 } });
  });

  it('"tempting, but you can\'t get to it": from the checkpoint\'s side the wind\'s dead against her', () => {
    const s = game(), h = new Helm(s, THROUGH);
    expect(s.plot(THROUGH, ...BY)).toBeNull();
    expect(s.plot(THROUGH, ...BY, null, true)).not.toBeNull();
    h.drop(...BY);
    const ev = run(h, 20);
    expect(ev.filter((e) => e.kind === 'headwind')).toHaveLength(1);   // (said once)
    expect(h.headwind()).toBe(true);
    expect(moves(ev)).toEqual([]);
    expect(h.oars).toBe(false);   // (the oars are never run out for her, nor hinted at)
    // Steered by hand, she's headed off at its edge.
    const m = new Helm(s, { c: Z.c1 + 1, r: wr - 1, d: 0 });
    m.put('L');
    const by = moves(run(m, 5));
    expect(by[0]).toMatchObject({ irons: true, bump: true });
    expect(m.pose.c).toBe(Z.c1 + 1);
  });

  it('"unless you go around the back way": down the locks she sails in to it, the wind behind her or across her', () => {
    const s = game(), plan = s.plot(FOOT, ...BY)!;
    expect(plan).not.toBeNull();
    let p = FOOT;
    for (const m of plan) { expect(s.irons(p, m)).toBe(false); p = s.sail(p, m).to; }
    const h = new Helm(s, FOOT);
    h.drop(...BY);
    run(h, 30);
    expect([h.pose.c, h.pose.r, h.pin]).toEqual([...BY, null]);
    // And from beside it, out of it westward and back up the locks under sail.
    expect(s.plot(h.pose, FOOT.c, FOOT.r)).not.toBeNull();
  });

  it('the oars beat it, rowed from the checkpoint\'s side (and nothing says so)', () => {
    const s = game(), h = new Helm(s, { c: Z.c1 + 1, r: wr, d: 3 });
    h.row(true);
    h.stroke(['F', 'F']);
    const ev = run(h, 10);
    expect(moves(ev).every((e) => !e.bump && !e.irons)).toBe(true);
    expect(h.pose.c).toBe(Z.c1 - 1);
  });

  it('only there: everywhere else she sails the same every way, as parked', () => {
    const s = game();
    for (let d = 0; d < 4; d++) {
      const p = { c: 15, r: 10, d };
      expect(s.irons(p, 'F')).toBe(false);
      expect(s.moveSecs(false, p, 'F')).toBe(WIND.RUN);
    }
  });
});

describe('"some wind stopping you from getting to the locks on the left as well" (10 Nov)', () => {
  // "People have got to figure out that they can use the oars to go past the wind, and that's how
  // they get over there." The same wind zone, put down again at the canal's mouth.
  beforeEach(() => { WEATHER.parked = true; });
  const game = () => { const s = new Sea(9); s.breeze = new Wind(9); return s; };
  const L = LAY.LOCKS[0], { low, high } = ends(L), mouth = LAY.CANAL[LAY.CANAL.length - 1];

  it('it blows down out of the cut, over the mouth and the first lock: only there', () => {
    const s = game(), z = s.zoneAt(...L.at)!;
    expect(z).not.toBeNull();
    expect(z.d).toBe((L.up + 2) % 4);
    expect(s.zoneAt(...low)).toBe(z);
    expect(s.zoneAt(...high)).toBeNull();
    expect(s.zoneAt(...LAY.JUNCTION)).toBeNull();
    expect(s.zoneAt(SAIL.HOME.c, SAIL.HOME.r)).toBeNull();
  });

  it('under sail she\'s headed off at the first lock, and the pilot won\'t take her in (said once, no word of the oars)', () => {
    const s = game(), h = new Helm(s, { c: low[0], r: low[1], d: L.up });
    expect(s.irons(h.pose, 'F')).toBe(true);
    h.put('F');
    expect(moves(run(h, 4))[0]).toMatchObject({ irons: true, bump: true });
    expect([h.pose.c, h.pose.r]).toEqual(low);
    const p = new Helm(s);
    p.drop(...high);
    expect(run(p, 10).filter((e) => e.kind === 'headwind')).toHaveLength(1);
    expect(p.oars).toBe(false);
  });

  it('rowed, she goes in and up; coming back down she sails out before it', () => {
    const s = game(), h = new Helm(s, { c: mouth[0], r: mouth[1], d: L.up });
    h.row(true);
    h.stroke(['F', 'F', 'F']);
    run(h, 10);
    expect([h.pose.c, h.pose.r]).toEqual(L.at);
    const d = new Helm(s, { c: high[0], r: high[1], d: (L.up + 2) % 4 });
    d.locks[0].level = 1;
    d.put('F'); d.put('F'); d.put('F');
    const ev = run(d, 15);
    expect(moves(ev).some((e) => e.irons)).toBe(false);
    expect([d.pose.c, d.pose.r]).toEqual([low[0], low[1] - 1]);
  });
});

describe('no way to sneak round the wind into the first lock: a sheltered harbour (10 Nov)', () => {
  // "it just maybe needs a few rocks along the right-hand side so you can't try and, like, sneak
  // around the wind. I mean, you can't, but it kind of feels like you almost can ... almost like
  // it's a bit of a harbour, sheltered area. And like the wind just to expand up to the cliff."
  beforeEach(() => { WEATHER.parked = true; });
  const game = (seed = 9) => { const s = new Sea(seed); s.breeze = new Wind(9); return s; };
  const L = LAY.LOCKS[0], { low } = ends(L);

  it('every square beside the mouth\'s wind, on the way in, is rock or cliff (or the canal above): its harbour', () => {
    for (let seed = 1; seed < 20; seed++) {
      const s = game(seed), z = s.zoneAt(...L.at)!, inZ = (c: number, r: number) => s.zoneAt(c, r) === z;
      const walled = (c: number, r: number) => !s.open(c, r) || s.isLock(c, r) || s.level(c, r) > 0;
      // (its sides, and the cliff at its head; its open end faces the den, downwind)
      for (let r = z.r0; r <= z.r1; r++) for (const c of [z.c0 - 1, z.c1 + 1]) expect(walled(c, r) || inZ(c, r)).toBe(true);
      for (let c = z.c0; c <= z.c1; c++) expect(walled(c, z.r1 + 1)).toBe(true);
      // Its mouth is open water, out of the wind: the way in, toward the den.
      for (let c = z.c0; c <= z.c1; c++) { expect(s.open(c, z.r0 - 1)).toBe(true); expect(inZ(c, z.r0 - 1)).toBe(false); }
      // It fills the harbour right up to the cliff: every open square from its mouth to the lock.
      for (let c = z.c0; c <= z.c1; c++) for (let r = z.r0; r < LAY.PLATEAU.r0; r++) expect(s.open(c, r)).toBe(true);
      expect(z.r1).toBeGreaterThanOrEqual(LAY.PLATEAU.r0);
      // Its arms are rocks jutting from the cliff, longest on its right.
      const arm = (c: number) => LAY.HARBOUR.filter(([x]) => x === c).length;
      expect(arm(z.c1 + 1)).toBeGreaterThan(arm(z.c0 - 1));
      for (const [c, r] of LAY.HARBOUR) expect(s.isRock(c, r)).toBe(true);
    }
  });

  it('under sail she can\'t get into any of it, from anywhere, not even round its side; at the oars she can', () => {
    const s = game(), z = s.zoneAt(...L.at)!;
    for (let c = z.c0; c <= z.c1; c++) for (let r = z.r0; r < LAY.PLATEAU.r0; r++) {
      expect(s.plot(SAIL.HOME, c, r)).toBeNull();
      expect(s.plot(SAIL.HOME, c, r, null, true)).not.toBeNull();
    }
    // Round its right-hand side and in across the wind: rock.
    expect(s.open(z.c1 + 2, z.r0)).toBe(true);
    expect(s.move({ c: z.c1 + 2, r: z.r0, d: 3 }, 'F').bump).toBe(true);
    // Rowed in from the den, right up the canal into the lock; under sail, no way in.
    expect(s.plot(SAIL.HOME, ...L.at, null, true)).not.toBeNull();
    expect(s.plot(SAIL.HOME, ...L.at)).toBeNull();
  });

  it('the rest of the sea isn\'t cut off: the main lane, the den\'s beach, the way home', () => {
    const s = game();
    expect(s.plot(SAIL.HOME, ...LAY.JUNCTION)).not.toBeNull();
    expect(s.plot({ c: LAY.CHECKPOINT.GATE, r: LAY.CHECKPOINT.ROW - 2, d: 2 }, SAIL.HOME.c, SAIL.HOME.r)).not.toBeNull();
    // Her way down out of the harbour, before the wind, home.
    expect(s.plot({ c: low[0], r: low[1], d: (L.up + 2) % 4 }, SAIL.HOME.c, SAIL.HOME.r)).not.toBeNull();
  });
});
