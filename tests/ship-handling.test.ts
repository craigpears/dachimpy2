/* Each ship's handling on the squares (src/ship-handling.ts), and the war frigate and the sloop on one test
   sea (src/two-ships.ts, frigate-test.html). RACE.md §11, "Racing in a frigate or a sloop" (14 Nov): the
   frigate battling her way through, the sloop slipping through the narrow ways. */
import { describe, expect, it } from 'vitest';
import { SAIL, Sea, path, poseAt, pauseFor, type Move, type Pose } from '../src/den-sail';
import { SLOOP_HANDLING as SL, FRIGATE_HANDLING as FR, SLOOP_HANDLING, FRIGATE_HANDLING, BRIG_HANDLING, HANDLING, ShipSea, ShipHelm, Guns, squares, shipPath, shipPose, drawnAt, broadside, groundSecs, type Handling } from '../src/ship-handling';
import { TwoShips, TWO_SEA, Tower, seaXZ, seaCR } from '../src/two-ships';
import { TURRET } from '../src/den-turret';

const MOVES: Move[] = ['F', 'L', 'R'];
const open = () => new Set<string>();
const run = (helm: ShipHelm, secs: number, step = 0.05) => { const out = []; for (let t = 0; t < secs; t += step) out.push(...helm.tick(step)); return out; };

describe('each ship\'s handling, from YPPedia\'s numbers and her hull', () => {
  it('the sloop handles as the den\'s sloop: four moves a turn, a square\'s turn, one square, one small shot a side', () => {
    expect(SL).toMatchObject({ tokens: SAIL.SLOTS, pace: SAIL.MOVE, radius: 1, long: 1, wide: 1, shots: 1, guns: 'small' });
  });
  it('the war frigate: three moves a turn, slower, turning twice as wide, four squares by two, two large shots a side', () => {
    expect(FR).toMatchObject({ tokens: 3, radius: 2, long: 4, wide: 2, shots: 2, guns: 'large' });
    expect(FR.pace).toBe(SAIL.MOVE * HANDLING.FRIGATE_PACE);
    expect(FR.pace).toBeGreaterThan(SL.pace);
    expect(FR.reload).toBeGreaterThan(SL.reload);
  });
  it('covers her squares round her own: the sloop just hers, the frigate four along and two across', () => {
    expect(squares(SL, { c: 5, r: 5, d: 0 })).toEqual([[5, 5]]);
    const f = squares(FR, { c: 5, r: 5, d: 0 });
    expect(f).toHaveLength(8);
    expect(new Set(f.map(([c]) => c))).toEqual(new Set([4, 5]));
    expect(new Set(f.map(([, r]) => r))).toEqual(new Set([3, 4, 5, 6]));
    // Turned, her squares turn with her.
    const g = squares(FR, { c: 5, r: 5, d: 1 });
    expect(new Set(g.map(([, r]) => r))).toEqual(new Set([5, 6]));
    expect(new Set(g.map(([c]) => c))).toEqual(new Set([3, 4, 5, 6]));
  });
  it('the sloop\'s moves are Battle Navigation\'s, as the den\'s helm has them; the frigate\'s turn twice as wide', () => {
    for (const d of [0, 1, 2, 3]) for (const m of MOVES) {
      const p = { c: 8, r: 8, d }, mine = shipPath(SL, p, m), den = path(p, m);
      expect(mine.to).toEqual(den.to);
      expect(mine.steps.map((q) => [q.c, q.r])).toEqual(den.cells);
      for (const u of [0, 0.3, 0.7, 1]) expect(shipPose(SL, p, m, u)).toEqual(poseAt(p, m, u));
    }
    // Her middle goes two ahead and two across, either way (her own square, aft and to port of it, follows).
    const p0 = { c: 8, r: 8, d: 0 }, m0 = drawnAt(FR, { c: 8, r: 8, a: 0 });
    for (const [m, dc, d] of [['L', -2, 3], ['R', 2, 1]] as const) {
      const to = shipPath(FR, p0, m).to, m1 = drawnAt(FR, { c: to.c, r: to.r, a: to.d });
      expect(to.d).toBe(d);
      expect(m1.c - m0.c).toBeCloseTo(dc); expect(m1.r - m0.r).toBeCloseTo(2);
      // Drawn on a quarter circle the same, from where she was to where she ends up.
      const end = shipPose(FR, p0, m, 1);
      expect(end.c).toBeCloseTo(to.c); expect(end.r).toBeCloseTo(to.r); expect(end.a).toBeCloseTo(m === 'L' ? -1 : 1);
    }
    // And her forward move as big as her turn: two squares (15 Nov: "it's equivalent movement to the turn").
    expect(shipPath(FR, p0, 'F').to).toEqual({ c: 8, r: 10, d: 0 });
    expect(shipPath(FR, p0, 'F').steps).toHaveLength(FR.stride);
  });
  it('is drawn at the middle of her squares', () => {
    expect(drawnAt(SL, { c: 3, r: 4, a: 0 })).toEqual({ c: 3, r: 4, a: 0 });
    const f = drawnAt(FR, { c: 5, r: 5, a: 0 });
    expect(f.c).toBeCloseTo(4.5); expect(f.r).toBeCloseTo(4.5);
  });
});

describe('the same helm sailing each by her handling', () => {
  it('on open water the sloop\'s sea moves her as the den\'s does', () => {
    const den = new Sea(1, false, true), mine = new ShipSea(SL, den.cols, den.rows, new Set());
    for (const d of [0, 1, 2, 3]) for (const m of MOVES) {
      const p = { c: 10, r: 10, d };
      expect(mine.move(p, m).to).toEqual(den.move(p, m).to);
      expect(mine.moveSecs(false, p, m)).toBe(den.moveSecs(false, p, m));
    }
  });
  it('plays three moves a turn in the frigate, four in the sloop', () => {
    for (const [h, n] of [[SL, 4], [FR, 3]] as const) {
      const helm = new ShipHelm(new ShipSea(h, 20, 20, open()), { c: 10, r: 4, d: 0 });
      helm.drop(10, 18);
      const turns = run(helm, 3).filter((e) => e.kind === 'turn');
      expect(turns.length).toBeGreaterThan(0);
      expect((turns[0] as { moves: Move[] }).moves).toHaveLength(n);
      for (const m of 'FFFFF') helm.put(m as Move);
      expect(helm.mine.length).toBeLessThanOrEqual(n);
    }
  });
  it('over open water they\'re about as quick: her moves twice as big, and twice as long', () => {
    const time = (h: typeof SL) => {
      const helm = new ShipHelm(new ShipSea(h, 20, 20, open()), { c: 10, r: 4, d: 0 });
      helm.drop(10, 16);
      for (let t = 0; t < 60; t += 0.05) if (helm.tick(0.05).some((e) => e.kind === 'arrive')) return t;
      return Infinity;
    };
    expect(time(FR) / time(SL)).toBeGreaterThan(0.85);
    expect(time(FR) / time(SL)).toBeLessThan(1.15);
  });
  it('the frigate needs room to turn: a turn she\'s no room for leaves her as she was', () => {
    // Two squares out from a line of rocks, facing it: a sloop turns along it, the frigate can't.
    const rocks = new Set(Array.from({ length: 20 }, (_, c) => `${c},12`));
    const p: Pose = { c: 10, r: 10, d: 0 };
    expect(new ShipSea(SL, 20, 20, rocks).move(p, 'L').bump).toBe(false);
    const f = new ShipSea(FR, 20, 20, rocks).move(p, 'L');
    expect(f.bump).toBe(true);
    expect(new ShipSea(FR, 20, 20, rocks).fits(f.to)).toBe(true);
  });
});

describe('the test sea: an imperial gate whose one-square way only the sloop fits, till the frigate crumbles a tower (15 Nov: "the [war frig] needs two, it has to destroy and crumble the towers in order to get through")', () => {
  const S = TWO_SEA, beyond: [number, number] = [11, 13], W = S.GATE.WAY;
  it('the gate is the one way through the rocks, one square wide between its towers', () => {
    const t = new TwoShips();
    for (let c = 0; c < S.COLS; c++) for (let r = S.WALL.r0; r <= S.WALL.r1; r++) expect(t.rocks.has(`${c},${r}`), `${c},${r}`).toBe(c !== W);
    expect(t.towers.map((x) => x.cols)).toEqual([[W - 2, W - 1], [W + 1, W + 2]]);
    for (const tw of t.towers) for (const [c, r] of tw.squares) expect(t.stopAt('frigate', c, r)).toBe('tower');
  });
  it('the sloop runs straight through; the frigate can\'t till a tower\'s crumbled, then it\'s two wide', () => {
    const t = new TwoShips(), fr = t.ships.frigate.sea;
    expect(t.ships.sloop.sea.plot(S.START.sloop, ...beyond)).not.toBeNull();
    expect(fr.plot(S.START.frigate, ...beyond)).toBeNull();
    for (let c = W - 2; c <= W + 2; c++) expect(fr.fits({ c, r: S.WALL.r0, d: 0 })).toBe(false);
    t.towers[0].hp = 1;
    t.ships.frigate.helm.moor({ c: W, r: 5, d: 1 });
    expect(t.fire('L', 'frigate')!.shots.some((x) => x.got === 'crumbled')).toBe(true);
    expect(t.gateOpen()).toBe(true);
    expect(fr.fits({ c: W, r: S.WALL.r0, d: 0 })).toBe(true);
    expect(fr.plot(t.ships.frigate.helm.pose, ...beyond)).not.toBeNull();
  });
  it('only large guns hurt a tower: the sloop\'s small ones bounce off', () => {
    const tw = new Tower([W - 2, W - 1], S.WALL.r0, S.WALL.r1);
    expect(tw.hit('small')).toBe('bounced');
    expect(tw.hp).toBe(S.TOWER_HP);
    for (let i = 1; i < S.TOWER_HP; i++) expect(tw.hit('large')).toBe('hit');
    expect(tw.hit('large')).toBe('crumbled');
    expect(tw.down()).toBe(true);
    expect(tw.has(W - 1, S.WALL.r0)).toBe(false);
    // (crumbled, the way's three wide: a frigate fits whichever square of her big moves she's on)
  });
  it('lying broadside to the gate, both shots of each of her broadsides land on a tower: a shooting phase before she\'s in', () => {
    const t = new TwoShips(), f = t.ships.frigate;
    // (along the rocks, her port side to the gate: facing right, port is out toward them; her guns either side of the way)
    f.helm.moor({ c: W - 1, r: 5, d: 1 });
    let broadsides = 0;
    while (!t.gateOpen() && broadsides < 20) {
      const got = t.fire('L', 'frigate')!;
      expect(got.shots).toHaveLength(2);
      expect(got.shots.filter((x) => x.what === 'tower')).toHaveLength(2);
      broadsides++;
      run(f.helm, f.h.reload + 0.1); f.guns.tick(f.h.reload + 0.1);
    }
    expect(broadsides).toBe(Math.ceil(S.TOWER_HP / 2));
  });
  it('the sloop\'s broadside on a tower bounces off and leaves it standing', () => {
    const t = new TwoShips(), s = t.ships.sloop;
    s.helm.moor({ c: W - 1, r: 6, d: 1 });
    const got = t.fire('L', 'sloop')!;
    expect(got.shots).toHaveLength(1);
    expect(got.shots[0].got).toBe('bounced');
    expect(t.towers[0].hp).toBe(S.TOWER_HP);
  });
  it('each is in the other\'s way', () => {
    const t = new TwoShips(), f = t.ships.frigate;
    // (the sloop sat in the frigate's way: the frigate can't go forward onto her)
    t.ships.sloop.helm.moor({ c: 2, r: 2, d: 0 });
    t.tick(0.01);
    expect(f.sea.move(f.helm.pose, 'F').bump).toBe(false);
    t.ships.sloop.helm.moor({ c: 15, r: 6, d: 0 });
    t.tick(0.01);
    expect(f.sea.move(f.helm.pose, 'F').bump).toBe(true);
    // A broadside stops at the other ship.
    const shot = broadside(SL, { c: 12, r: 4, a: 0 }, 'R', (c, r) => t.stopAt('sloop', c, r));
    expect(shot).toHaveLength(1);
    expect(shot[0]).toMatchObject({ hit: [14, 4], what: 'frigate' });
  });
  it('sailing for the buoy, the sloop gets through the gate and the frigate stops short of the rocks', () => {
    const t = new TwoShips();
    for (const k of ['sloop', 'frigate'] as const) t.drop(...S.GOAL, k);
    expect(t.drop(...S.GOAL, 'frigate')!.short).toBe(true);
    for (let i = 0; i < 1200; i++) t.tick(0.05);
    expect(t.through('sloop')).toBe(true);
    expect(t.through('frigate')).toBe(false);
  });
  it('lays its squares out in metres and back', () => {
    const [x, z] = seaXZ(3, 7), [c, r] = seaCR(x, z);
    expect(c).toBeCloseTo(3); expect(r).toBeCloseTo(7);
  });
  it('guns load again by their reload', () => {
    const g = new Guns(2);
    expect(g.fire('L')).toBe(true); expect(g.fire('L')).toBe(false); expect(g.fire('R')).toBe(true);
    g.tick(2); expect(g.ready('L')).toBe(true);
  });
});

/* Primates Rule as played on frigate-test.html (the user, 15 Nov): "It looks really cool", and the next pass. */
describe('powerful but clumsy (15 Nov: "be proportionate, similar to how the sloop is"; "the sloop gets like two turns for every ... [one] of the [war frig] ... that\'ll then show, yeah, the [war frig]\'s slower to react"; "I want the big ships to feel clumsy")', () => {
  // Seconds of the clock all told for a move (its pause, and her share of the breather between turns), and the
  // squares of ground it covers.
  const allTold = (h: Handling, m: Move) => { const secs = new ShipSea(h, 20, 20, open()).moveSecs(false, { c: 9, r: 9, d: 0 }, m); return secs + pauseFor(secs) + SAIL.BREAK / h.tokens; };
  const ground = (h: Handling, m: Move) => (m === 'F' ? h.stride : 2 * h.radius);
  const perSquare = (h: Handling, m: Move) => allTold(h, m) / ground(h, m);
  const cycle = (h: Handling) => h.tokens * (h.move + pauseFor(h.move)) + SAIL.BREAK;
  it('every move of hers takes as long as any other, forward as far as her turn\'s radius, as the sloop\'s does', () => {
    for (const h of [SL, FR]) { expect(allTold(h, 'L')).toBeCloseTo(allTold(h, 'F')); expect(h.stride).toBe(h.radius); }
    expect(SL.turn).toBe(SAIL.MOVE);
    expect(FR.move).toBeCloseTo(FR.pace * FR.stride);
  });
  it('each kind of move covers the ground at about the sloop\'s speed: neither quicker over open water', () => {
    const share = (m: Move) => perSquare(FR, m) / perSquare(SL, m);
    expect(share('L')).toBeCloseTo(share('F'), 1);
    expect(share('F')).toBeGreaterThan(0.9);
    expect(share('F')).toBeLessThan(1.1);
  });
  it('but she plays her turn of moves half as long again as the sloop plays hers: slower to react', () => {
    expect(cycle(FR) / cycle(SL)).toBeGreaterThan(1.4);
    expect(cycle(FR) / cycle(SL)).toBeLessThan(2.1);
  });
  it('round the same open-water course they\'re about even: the sloop\'s edge is the winds, not her moves', () => {
    const course: [number, number][] = [[14, 12], [26, 18], [28, 30], [16, 26], [6, 30]];
    const marks = (h: Handling) => {
      const helm = new ShipHelm(new ShipSea(h, 34, 34, open()), { c: 6, r: 3, d: 0 }), at: number[] = [];
      let t = 0, i = 0;
      helm.drop(...course[0]);
      while (t < 400 && i < course.length) {
        const ev = helm.tick(0.05); t += 0.05;
        if (ev.some((e) => e.kind === 'arrive')) { at.push(t); if (++i < course.length) helm.drop(...course[i]); }
      }
      return at;
    };
    const sloop = marks(SL), frigate = marks(FR);
    expect(frigate).toHaveLength(course.length);
    const ratio = frigate[course.length - 1] / sloop[course.length - 1];
    expect(ratio).toBeGreaterThan(0.8);
    expect(ratio).toBeLessThan(1.25);
  });
  it('the winds carry the sloop; the frigate rides them out', () => {
    const wind = new Map<string, number>([['5,5', 1], ['6,5', 1], ['7,5', 1], ['8,5', 1]]);
    const sl = new ShipSea(SL, 20, 20, open()).carriedBy(wind), fr = new ShipSea(FR, 20, 20, open()).carriedBy(wind);
    const got = sl.move({ c: 5, r: 4, d: 0 }, 'F');
    expect(got.ride.length).toBeGreaterThan(0);
    expect(got.ride[got.ride.length - 1].c).toBeGreaterThan(8);
    expect(fr.windy).toBe(false);
    expect(fr.move({ c: 6, r: 2, d: 0 }, 'F').ride).toHaveLength(0);
  });
});

describe('her turn drawn moving forward (15 Nov: "it should always be moving forward. It seems to be more like rotating on the spot when it turns")', () => {
  it('her middle sails round the quarter circle, always along her heading, bows leading', () => {
    for (const m of ['L', 'R'] as Move[]) for (const d of [0, 1, 2, 3]) {
      const p = { c: 10, r: 10, d }, N = 60;
      let last = drawnAt(FR, shipPose(FR, p, m, 0)), went = 0;
      for (let i = 1; i <= N; i++) {
        const at = drawnAt(FR, shipPose(FR, p, m, i / N)), dc = at.c - last.c, dr = at.r - last.r, len = Math.hypot(dc, dr);
        // (the heading halfway through the step: quarter turns, 0 out to sea, 1 right)
        const a = (at.a + last.a) / 2 * Math.PI / 2, along = (dc * Math.sin(a) + dr * Math.cos(a)) / len;
        expect(len).toBeGreaterThan(0);      // never standing still to turn
        expect(along).toBeGreaterThan(0.99); // and always going the way her bows point
        went += len; last = at;
      }
      expect(went).toBeCloseTo(Math.PI / 2 * FR.radius, 1);   // (the quarter circle's length)
    }
  });
  it('a turn she\'s no room for turns her on the spot, bumping, where her hull fits (16 Nov: "they don\'t need open water to turn. You can at least bounce off rocks or each other\'s ships"); where it doesn\'t, she stays as she was', () => {
    // A rock two squares off her starboard bow: no room for her wide turn right, room to go on, and to turn where she is.
    const rocks = new Set(['11,12']), sea = new ShipSea(FR, 20, 20, rocks), p = { c: 10, r: 10, d: 0 };
    expect(sea.move(p, 'F').bump).toBe(false);
    const got = sea.move(p, 'R');
    expect(got.bump).toBe(true);
    expect(got.to).toEqual({ c: 10, r: 9, d: 1 });
    // (and a rock where she'd lie across: she stays as she was)
    const tight = new ShipSea(FR, 20, 20, new Set(['11,12', '8,9'])).move(p, 'R');
    expect(tight.bump).toBe(true);
    expect(tight.to).toEqual(p);
  });
  it('with no move at all she turns on the spot', () => {
    // Bows on the board's edge, rocks either side ahead: nowhere to go.
    const sea = new ShipSea(FR, 20, 20, new Set(['6,18', '6,19', '13,18', '13,19'])), p = { c: 10, r: 18, d: 0 };
    for (const m of MOVES) expect(sea.clear(p, m)).toBe(false);
    const got = sea.move(p, 'L');
    expect(got.bump).toBe(true);
    expect(got.to.d).toBe(3);
    const was = drawnAt(FR, { c: p.c, r: p.r, a: p.d }), now = drawnAt(FR, { c: got.to.c, r: got.to.r, a: got.to.d });
    expect([now.c, now.r]).toEqual([was.c, was.r]);   // (about her middle)
  });
});

describe('her pilot: there once the point\'s under her (15 Nov: "within the silhouette of the whole ship")', () => {
  it('a point under any of her squares is where she is already', () => {
    const sea = new ShipSea(FR, 20, 20, open()), helm = new ShipHelm(sea, { c: 10, r: 4, d: 0 });
    for (const [c, r] of squares(FR, helm.pose)) expect(sea.there(helm.pose, c, r)).toBe(true);
    helm.drop(9, 2);
    expect(helm.pin).toBeNull();
  });
  it('goes straight on when that brings the point under her, never turning toward it', () => {
    const sea = new ShipSea(FR, 20, 20, open()), helm = new ShipHelm(sea, { c: 10, r: 4, d: 0 });
    // One square to port of her own square, four ahead: a few squares on, it's under her port side.
    helm.drop(9, 8);
    const plan = helm.course();
    expect(plan.every((m) => m === 'F')).toBe(true);
    const ev = run(helm, 12);
    expect(ev.filter((e) => e.kind === 'move').every((e) => (e as { m: Move }).m === 'F')).toBe(true);
    expect(ev.some((e) => e.kind === 'arrive')).toBe(true);
    expect(sea.there(helm.pose, 9, 8)).toBe(true);
  });
  it('the sloop still sails right onto it, as the den\'s does', () => {
    const helm = new ShipHelm(new ShipSea(SL, 20, 20, open()), { c: 10, r: 4, d: 0 });
    helm.drop(10, 7);
    run(helm, 10);
    expect(helm.pose).toMatchObject({ c: 10, r: 7 });
  });
});

describe('shooting (15 Nov: "just be able to shoot at the sloop"; "would it just fire a broadside and then you\'d hit the sloop as part of it?")', () => {
  it('her broadside: two large shots out of her middle squares, three squares out, slower to load than the sloop\'s one small one', () => {
    const shots = broadside(FR, { c: 10, r: 10, a: 0 }, 'R', () => null);
    expect(shots).toHaveLength(2);
    expect(shots.every((s) => s.cells.length === SAIL.RANGE)).toBe(true);
    const rows = shots.map((s) => s.from[1]), mid = squares(FR, { c: 10, r: 10, d: 0 }).map(([, r]) => r);
    expect(Math.min(...rows)).toBeGreaterThan(Math.min(...mid));
    expect(Math.max(...rows)).toBeLessThan(Math.max(...mid));
    expect(FR.reload).toBeGreaterThan(SL.reload);
  });
  it('her broadside on the sloop holes her, dazed till her crew have patched her, longer for a large shot', () => {
    const t = new TwoShips(), f = t.ships.frigate, s = t.ships.sloop;
    f.helm.moor({ c: 10, r: 4, d: 0 }); s.helm.moor({ c: 12, r: 4, d: 0 });
    t.tick(0.01);
    const got = t.fire('R', 'frigate')!;
    expect(got.shots.some((x) => x.what === 'sloop' && x.holed)).toBe(true);
    expect(t.holed('sloop')).toBe(true);
    s.helm.drop(12, 7);
    const held = { ...s.helm.pose };
    for (let i = 0; i < (TWO_SEA.HOLED.large - 0.5) / 0.05; i++) t.tick(0.05);
    expect(s.helm.pose).toEqual(held);
    for (let i = 0; i < 1 / 0.05; i++) t.tick(0.05);
    expect(t.holed('sloop')).toBe(false);
    // and the sloop's small shot on her holes her a shorter while
    s.helm.moor({ c: 12, r: 4, d: 2 });
    s.guns.tick(9); t.tick(0.01);
    expect(t.fire('R', 'sloop')!.shots[0].what).toBe('frigate');
    expect(t.patch.frigate).toBe(TWO_SEA.HOLED.small);
    expect(TWO_SEA.HOLED.small).toBeLessThan(TWO_SEA.HOLED.large);
  });
});

describe('the imperial gate to shoot at (15 Nov: "put like a ... destructible. That Imperial Gate thing")', () => {
  const S = TWO_SEA;
  it('its towers either side of its way, a gun on a bastion either side of them', () => {
    const t = new TwoShips();
    expect(t.battery.map((g) => g.at)).toEqual(S.GATE.GUNS);
    for (const [c, r] of S.GATE.GUNS) expect(t.rocks.has(`${c},${r}`)).toBe(true);
    for (const [c, r] of t.gate.squares()) expect(t.rocks.has(`${c},${r}`)).toBe(true);
    expect(t.stopAt('frigate', ...S.GATE.GUNS[0])).toBe('gun');
  });
  it('its guns leave her be till someone fires on the gate, then fire on her in reach', () => {
    const t = new TwoShips(), f = t.ships.frigate;
    f.helm.moor({ c: 16, r: 5, d: 1 });
    let fired = 0;
    for (let i = 0; i < 100; i++) fired += t.tick(0.05).guns.filter((g) => g.e.kind === 'fire').length;
    expect(fired).toBe(0);
    t.fire('L', 'frigate');
    for (let i = 0; i < 100; i++) fired += t.tick(0.05).guns.filter((g) => g.e.kind === 'fire').length;
    expect(fired).toBeGreaterThan(0);
  });
  it('a gun\'s shot coming down on her, sat still, holes her', () => {
    const t = new TwoShips(), f = t.ships.frigate;
    f.helm.moor({ c: 16, r: 5, d: 1 });
    for (const g of t.battery) g.rouse();
    let hit = false;
    for (let i = 0; i < 200 && !hit; i++) hit = t.tick(0.05).guns.some((g) => g.hit === 'frigate');
    expect(hit).toBe(true);
    expect(t.holed('frigate')).toBe(true);
  });
  it('any ship\'s shots quieten its guns, and the third wrecks one; only large guns hurt its towers', () => {
    const t = new TwoShips(), g = t.battery[0];
    for (let i = 0; i < TURRET.WRECK; i++) expect(g.hit()).toBe(i < TURRET.WRECK - 1 ? 'quiet' : 'wrecked');
    expect(t.stopAt('sloop', ...g.at)).toBe('rock');
    expect(t.towers[0].hit('small')).toBe('bounced');
  });
});

describe('a turn ends where it ends (15 Nov: a war brig "turns, then it seems like it gets snapped into an adjacent square")', () => {
  it('every kind of ship, drawn through a turn, finishes on the square and heading her move leaves her on', () => {
    for (const h of [SLOOP_HANDLING, BRIG_HANDLING, FRIGATE_HANDLING]) for (const m of ['L', 'R'] as const) for (const d of [0, 1, 2, 3]) {
      const p = { c: 20, r: 20, d }, to = shipPath(h, p, m).to, end = shipPose(h, p, m, 1, false, to);
      expect(end.c, `${h.name} ${m} ${d}`).toBeCloseTo(to.c, 6);
      expect(end.r, `${h.name} ${m} ${d}`).toBeCloseTo(to.r, 6);
      // (and no jump on the way: her middle moves smoothly frame to frame)
      let last = drawnAt(h, shipPose(h, p, m, 0, false, to));
      for (let u = 0.02; u <= 1.0001; u += 0.02) { const now = drawnAt(h, shipPose(h, p, m, u, false, to)); expect(Math.hypot(now.c - last.c, now.r - last.r), `${h.name} ${m} ${d} at ${u.toFixed(2)}`).toBeLessThan(0.2); last = now; }
    }
  });
});
