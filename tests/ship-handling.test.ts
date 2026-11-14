/* Each ship's handling on the squares (src/ship-handling.ts), and the war frigate and the sloop on one test
   sea (src/two-ships.ts, frigate-test.html). RACE.md §11, "Racing in a frigate or a sloop" (14 Nov): the
   frigate battling her way through, the sloop slipping through the narrow ways. */
import { describe, expect, it } from 'vitest';
import { SAIL, Sea, path, poseAt, type Move, type Pose } from '../src/den-sail';
import { SLOOP_HANDLING as SL, FRIGATE_HANDLING as FR, HANDLING, ShipSea, ShipHelm, Guns, squares, shipPath, shipPose, drawnAt, broadside } from '../src/ship-handling';
import { TwoShips, TWO_SEA, Boom, seaXZ, seaCR } from '../src/two-ships';

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
    expect(shipPath(FR, { c: 8, r: 8, d: 0 }, 'L').to).toEqual({ c: 6, r: 10, d: 3 });
    expect(shipPath(FR, { c: 8, r: 8, d: 0 }, 'R').to).toEqual({ c: 10, r: 10, d: 1 });
    expect(shipPath(FR, { c: 8, r: 8, d: 0 }, 'F').to).toEqual({ c: 8, r: 9, d: 0 });
    // Drawn on a quarter circle the same, from where she was to where she ends up.
    const end = shipPose(FR, { c: 8, r: 8, d: 0 }, 'L', 1);
    expect(end.c).toBeCloseTo(6); expect(end.r).toBeCloseTo(10); expect(end.a).toBeCloseTo(-1);
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
  it('the frigate gets there more slowly than the sloop', () => {
    const time = (h: typeof SL) => {
      const helm = new ShipHelm(new ShipSea(h, 20, 20, open()), { c: 10, r: 4, d: 0 });
      helm.drop(10, 16);
      for (let t = 0; t < 60; t += 0.05) if (helm.tick(0.05).some((e) => e.kind === 'arrive')) return t;
      return Infinity;
    };
    expect(time(FR)).toBeGreaterThan(time(SL) * 1.15);
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

describe('the test sea: a narrow gap only the sloop fits, a boom only the frigate\'s broadside breaks', () => {
  const S = TWO_SEA, beyond: [number, number] = [11, 13];
  it('the sloop can get past the rocks, the frigate can\'t till the boom\'s broken', () => {
    const t = new TwoShips();
    expect(t.ships.sloop.sea.plot(S.START.sloop, ...beyond)).not.toBeNull();
    expect(t.ships.frigate.sea.plot(S.START.frigate, ...beyond)).toBeNull();
  });
  it('the gap is too narrow for her even with the boom gone, and the channel\'s wide enough', () => {
    const t = new TwoShips();
    const fr = t.ships.frigate.sea;
    for (let r = S.WALL.r0; r <= S.WALL.r1; r++) for (const d of [0, 2]) for (let c = S.GAP - 1; c <= S.GAP + 1; c++) expect(fr.fits({ c, r, d })).toBe(false);
    expect(t.ships.sloop.sea.fits({ c: S.GAP, r: S.WALL.r0, d: 0 })).toBe(true);
    t.boom.hp = 1; t.boom.hit('large');
    for (const [c, r] of t.boom.squares) t.rocks.delete(`${c},${r}`);
    fr.touch();
    expect(fr.fits({ c: S.CHANNEL.c0 + 1, r: S.WALL.r0, d: 0 })).toBe(true);
    expect(fr.plot(S.START.frigate, ...beyond)).not.toBeNull();
  });
  it('only large guns hurt the boom: the sloop\'s small ones bounce off', () => {
    const b = new Boom();
    expect(b.hit('small')).toBe('bounced');
    expect(b.hp).toBe(S.BOOM.HP);
    for (let i = 1; i < S.BOOM.HP; i++) expect(b.hit('large')).toBe('hit');
    expect(b.hit('large')).toBe('broken');
    expect(b.broken()).toBe(true);
  });
  it('lying broadside to the boom, two of the frigate\'s broadsides break it and open the channel', () => {
    const t = new TwoShips(), f = t.ships.frigate;
    // (put her along the rocks, her port side to the boom: facing right, port is out toward them)
    f.helm.moor({ c: 16, r: 5, d: 1 });
    const one = t.fire('L', 'frigate')!;
    expect(one.shots).toHaveLength(2);
    expect(one.shots.every((s) => s.what === 'boom')).toBe(true);
    expect(t.fire('L', 'frigate')).toBeNull();   // (loading again)
    run(f.helm, f.h.reload + 0.1); f.guns.tick(f.h.reload + 0.1);
    const two = t.fire('L', 'frigate')!;
    expect(two.shots.some((s) => s.boom === 'broken')).toBe(true);
    expect(t.boom.broken()).toBe(true);
    expect(f.sea.plot(f.helm.pose, ...beyond)).not.toBeNull();
  });
  it('the sloop\'s broadside on the boom bounces off and leaves it standing', () => {
    const t = new TwoShips(), s = t.ships.sloop;
    s.helm.moor({ c: 16, r: 6, d: 1 });
    const got = t.fire('L', 'sloop')!;
    expect(got.shots).toHaveLength(1);
    expect(got.shots[0].boom).toBe('bounced');
    expect(t.boom.hp).toBe(S.BOOM.HP);
  });
  it('each is in the other\'s way', () => {
    const t = new TwoShips(), f = t.ships.frigate;
    // (the sloop sat in the frigate's way: the frigate can't go forward onto her)
    t.ships.sloop.helm.moor({ c: 15, r: 6, d: 0 });
    t.tick(0.01);
    expect(f.sea.move(f.helm.pose, 'F').bump).toBe(false);
    f.helm.moor({ c: 15, r: 4, d: 0 });
    t.tick(0.01);
    expect(f.sea.move(f.helm.pose, 'F').bump).toBe(true);
    // A broadside stops at the other ship.
    const shot = broadside(SL, { c: 12, r: 4, a: 0 }, 'R', (c, r) => t.stopAt('sloop', c, r));
    expect(shot).toHaveLength(1);
    expect(shot[0]).toMatchObject({ hit: [14, 4], what: 'frigate' });
  });
  it('sailing for the buoy, the sloop gets through the gap and the frigate stops short of the rocks', () => {
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
