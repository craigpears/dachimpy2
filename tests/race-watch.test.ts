/* The sloop race, watched (src/race-watch.ts; den.html?at=race-watch). The user, 12 Nov: a link to watch
   four bots race, "to judge how realistic it looks", and a spectator mode: "I can see the puzzle, as I said,
   the puzzling, the just move around free camera, including jumping between watching each person in the
   race." */
import { describe, expect, it } from 'vitest';
import { LAY, Sea } from '../src/den-sail';
import { RACE } from '../src/den-race';
import { RIVALS, WATCHED } from '../src/den-rivals';
import { ROUTES, STYLES, startPose, type BotInfo } from '../src/race-sim';
import { Watch, FreeCam, Pacer, WATCH, boardOf, doing, paceOf, vegasDrops } from '../src/race-watch';
import { Sailing } from '../src/sailing';
import { SailPair } from '../src/sail-pair';
import { route } from '../src/balloons';
import { VEGAS_GAMES } from '../src/sail-bots';
import { seeded } from '../src/mirror-row';

const RC = LAY.RACE;
/** A watched race from `seed`, ticked till everyone's home (or `secs`): what each racer's board was, in order. */
function watched(seed: number, secs = 900) {
  const W = new Watch(seed), boards = W.racers.map(() => [] as string[]), said = W.racers.map(() => new Set<string>());
  for (let t = 0; t < secs && W.state !== 'done'; t += 0.1) {
    W.tick(0.1);
    W.racers.forEach((_, i) => {
      const b = W.board(i), k = b ? `${b.puzzle}/${b.why}` : '';
      if (k && boards[i][boards[i].length - 1] !== k) boards[i].push(k);
      W.pick(i);
      said[i].add(W.bar().doing);
    });
  }
  return { W, boards, said };
}

describe('a link to watch four bots race (12 Nov)', () => {
  it('four race with no player: your three rivals, and Gravee up the locks, a way round none of them takes', () => {
    expect(WATCHED.map((r) => r.name)).toEqual(['Kikkit', 'Tzz', 'Dalnoth', 'Gravee']);
    expect(WATCHED.slice(0, 3)).toEqual(RIVALS);
    const g = WATCHED[3];
    expect(RIVALS.map((r) => r.racer.route)).not.toContain(g.racer.route);
    expect(['long', 'locks', 'crane']).toContain(g.racer.route);
    expect(ROUTES.map((x) => x.name)).toContain(g.racer.route);
    expect(STYLES.map((x) => x.name)).toContain(g.racer.style);
    for (const k of ['start', 'won', 'lost'] as const) expect(g.racer.says[k].length).toBeGreaterThan(0);
    // (her own spot on the line, nobody else's, straight down the field from it with no whirlpool in her way)
    const sea = new Sea(9);
    expect(WATCHED.filter((r) => r.spot === g.spot)).toHaveLength(1);
    for (let r = RC.LINE.r; r <= RC.STRETCHES[0].r; r++) expect(!!sea.whirlAt(g.spot, r)).toBe(false);
    expect(startPose(g.spot, 0, 0)).toMatchObject({ c: g.spot, r: RC.LINE.r });
  });

  it('they wait for the starter\'s count, then race to the finish, all four home in a sensible time', () => {
    const W = new Watch(3);
    expect(W.state).toBe('count');
    W.tick(RACE.COUNT - 0.5);
    expect(W.run).toBeNull();
    for (let t = 0; t < 900 && W.state !== 'done'; t += 0.1) W.tick(0.1);
    expect(W.state).toBe('done');
    const times = W.field.racers.map((r) => r.time!);
    for (const t of times) { expect(t).toBeGreaterThan(150); expect(t).toBeLessThan(400); }
    expect(W.standings().map((s) => s.place)).toEqual([1, 2, 3, 4]);
  });

  it('one seed, one race: the same seed races the same', () => {
    const a = watched(11), b = watched(11);
    expect(a.W.field.racers.map((r) => r.time)).toEqual(b.W.field.racers.map((r) => r.time));
  });

  it('nobody takes the starlit door, and nothing said names it: it\'s a secret', () => {
    for (const seed of [1, 2, 3, 4]) {
      const { W, said } = watched(seed);
      for (let i = 0; i < 4; i++) expect(W.info(i)!.done).not.toContain('door');
      for (const s of said) for (const x of s) expect(x.toLowerCase()).not.toMatch(/door|tunnel|starlit|navigation/);
    }
  });
});

describe('jumping between racers, and a bar saying what each is doing (12 Nov)', () => {
  it('1 to 4 follow a racer, Tab the next round (from the free camera, the leader), 0 the free camera', () => {
    const W = new Watch(2);
    expect(W.follow).toBe(-1);
    expect(W.pick(2)).toBe(2);
    expect(W.cycle()).toBe(3);
    expect(W.cycle()).toBe(0);
    expect(W.cycle(-1)).toBe(3);
    expect(W.pick(-1)).toBe(-1);
    expect(W.pick(9)).toBe(-1);
    expect(W.cycle()).toBe(W.standings()[0].i);
  });

  it('the bar: who, her place, her leg, and what she\'s doing, in plain words ("pumping the lock", "sailing the long way")', () => {
    const { said } = watched(5);
    const all = new Set(said.flatMap((s) => [...s]));
    expect(all).toContain('pumping the lock (Bilge)');
    expect(all).toContain('clearing the barrier of driftwood (Foraging)');
    expect([...all].some((x) => x.startsWith('building a Vegas at the whirlpools\' mouth'))).toBe(true);
    expect(all).toContain('sailing the long way (Sailing on the pilot)');
    expect([...all].some((x) => x.startsWith('home, '))).toBe(true);
    const W = new Watch(5);
    W.pick(3);
    expect(W.bar()).toMatchObject({ who: 'Gravee', place: expect.stringMatching(/of 4$/), leg: 'on the line' });
    W.pick(-1);
    expect(W.bar().who).toBe('Free camera');
  });

  it('what she\'s doing, for each thing the simulation has her do', () => {
    const x = (o: Partial<BotInfo>): BotInfo => ({ mode: 'sail', was: 'sail', cut: null, stage: 0, work: 0, full: 0, tries: 0, daze: 0, move: null, hop: 0, route: 'long', style: 'peaceful', best: 'good', skill: 'decent', done: [], ...o });
    expect(doing(x({ mode: 'stop', cut: 'crane', route: 'crane' }), null, null)).toBe('building the crane (Carpentry)');
    expect(doing(x({ mode: 'wait', cut: 'locks' }), 'locks', null)).toBe('waiting her turn at the locks');
    expect(doing(x({ mode: 'daze' }), null, null)).toMatch(/Patching her deck/);
    expect(doing(x({ mode: 'trip', cut: null }), null, null)).toBe('swept back by the wind!');
    // (the gambles, 12 Nov: on, or back)
    expect(doing(x({ mode: 'trip', bet: { id: 'turn', on: true } }), null, null)).toMatch(/flung on by the turning whirlpool/);
    expect(doing(x({ mode: 'trip', bet: { id: 'veil', on: false } }), null, null)).toMatch(/blown back along the leg by the veiled wind/);
    expect(doing(x({ route: 'locks' }), 'locks', null)).toBe('sailing for the locks (Sailing on the pilot)');
    expect(doing(x({ move: { kind: 'load', left: 3 } }), null, null)).toBe('loading a shot by Gunnery, under way');
    expect(doing(null, null, 2)).toBe('home, 2nd');
  });
});

describe('seeing the puzzling: each racer\'s board, with real moves paced to the simulation\'s times (12 Nov)', () => {
  it('her board is the puzzle she\'s at: Sailing under way and for her Vegas, Foraging at the barrier, Bilge at the lock, Gunnery loading, Carpentry patching', () => {
    const seen = new Set<string>();
    // (races where a rival fires and loads again by Gunnery: seeds 5 to 7 till the gambles, 12 Nov, moved who's where)
    for (const seed of [3, 7, 8]) for (const b of watched(seed).boards) for (const k of b) seen.add(k);
    for (const k of ['sailing/pilot', 'sailing/vegas', 'sailing/double', 'sailing/triple', 'foraging/barrier', 'bilge/lock', 'gunnery/load', 'carpentry/patch']) expect(seen, k).toContain(k);
  });

  it('a board\'s seconds are the simulation\'s, so the race\'s balance holds', () => {
    const x = { mode: 'stop', was: 'stop', cut: 'locks', stage: 0, work: 12, full: 28, tries: 0, daze: 0, move: null, hop: 0, route: 'locks', style: 'cautious', best: 'great', skill: 'good', done: [] } as BotInfo;
    expect(boardOf(x)).toEqual({ puzzle: 'bilge', why: 'lock', left: 12, full: 28, tries: 0 });
    expect(boardOf({ ...x, mode: 'sail', cut: null })?.left).toBe(Infinity);
    expect(boardOf({ ...x, mode: 'wait' })).toBeNull();
    expect(boardOf({ ...x, mode: 'trip' })).toBeNull();
    // (a move every so often: Sailing's drops by her skill, quicker the better she is)
    const pilot = boardOf({ ...x, mode: 'sail', cut: null })!;
    expect(paceOf(pilot, 'great')).toBeLessThan(paceOf(pilot, 'decent'));
    expect(paceOf(boardOf(x)!, 'good')).toBeLessThanOrEqual(WATCH.BILGE);
  });

  it('a Pacer spreads the moves still to make over the seconds left', () => {
    const p = new Pacer(1);
    let n = 0;
    for (let t = 0; t < 10; t += 0.1) n += p.tick(0.1);
    expect(n).toBeGreaterThanOrEqual(9);
    p.spread(6, 3);
    expect(p.every).toBeCloseTo(2);
    expect(vegasDrops(30, 52)).toBe(Math.round(30 / WATCH.VEGAS_DROP));
    expect(vegasDrops(1, 52)).toBe(WATCH.VEGAS_MIN);
    expect(vegasDrops(1000, 40)).toBe(40);
  });

  it('a Vegas shown move by move comes off: each recorded game, its last drops steered down by real moves, sets one off', () => {
    for (const g of VEGAS_GAMES) {
      const game = new Sailing(seeded(g.seed)), k = 8;
      for (const [c, t, r] of g.drops.slice(0, g.drops.length - k)) expect(game.drop(c, t, r).dropped).toBe(true);
      let last = null;
      for (const [col, turn, row] of g.drops.slice(g.drops.length - k)) {
        const P = new SailPair(game), way = route(game, { pair: game.pair, col, turn, row });
        expect(way, `${g.seed}: ${col},${turn},${row}`).not.toBeNull();
        for (const st of way!) {
          if (st === 'left') P.slide(-1); else if (st === 'right') P.slide(1);
          else if (st === 'turnR') P.turnBy(1); else if (st === 'turnL') P.turnBy(-1);
          else P.row++;
        }
        last = P.slam();
        expect(last.booched).toBe(false);
      }
      expect(last!.vegas, `seed ${g.seed}`).toBe(true);
    }
  });
});

describe('the free camera (12 Nov): "just move around free camera"', () => {
  const bounds = { x0: -30, x1: 70, z0: -160, z1: -300 };
  it('moves the way it looks, along the ground, and to the side', () => {
    const c = new FreeCam(bounds, { x: 0, z: -200, yaw: 0 });
    c.move(10, 0);
    expect(c.shot.z).toBeCloseTo(-210);
    c.move(0, 5);
    expect(c.shot.x).toBeCloseTo(5);
    c.turn(Math.PI / 2);
    c.move(10, 0);
    expect(c.shot.x).toBeCloseTo(-5);
  });
  it('stays over the course, tilts and zooms within bounds', () => {
    const c = new FreeCam(bounds);
    c.move(1e4, 1e4);
    expect(c.shot.x).toBeLessThanOrEqual(70);
    expect(c.shot.z).toBeGreaterThanOrEqual(-300);
    c.turn(0, 10);
    expect(c.shot.tilt).toBe(WATCH.CAM.TILT_MAX);
    c.zoom(1e-3);
    expect(c.shot.dist).toBe(WATCH.CAM.DIST_MIN);
    c.zoom(1e3);
    expect(c.shot.dist).toBe(WATCH.CAM.DIST_MAX);
  });
});
