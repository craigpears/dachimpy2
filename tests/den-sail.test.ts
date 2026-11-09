import { describe, expect, it } from 'vitest';
import { SAIL, LAY, Sea, Helm, Guns, Turret, broadside, path, poseAt, type Move, type Pose } from '../src/den-sail';
import { PATCH, type DeckHole } from '../src/den-patch';
import { carp } from './helpers';
import { worth } from '../src/den-bilge';
import type { Move as BilgeMove } from '../src/bilge';
import type { Cell } from '../src/engine';

const clearSea = () => { const s = new Sea(1, false); s.rocks.clear(); return s; };
const run = (h: Helm, secs: number, step = 0.05) => { const ev = []; for (let t = 0; t < secs; t += step) ev.push(...h.tick(step)); return ev; };
// A piece of a tiling: its squares at the top left, and where its top-left goes.
const at = (cells: Cell[]): [number, number] => [Math.min(...cells.map((p) => p[0])), Math.min(...cells.map((p) => p[1]))];
const norm = (cells: Cell[]): Cell[] => { const [r0, c0] = at(cells); return cells.map(([r, c]): Cell => [r - r0, c - c0]); };
// The lock's water up to what's been pumped in, a frame at a time.
const rise = (h: Helm) => { for (let i = 0; i < 300 && h.held() === 'up'; i++) h.tick(1 / 60); };
// Patch a hole the way it's meant to be filled.
const fill = (hole: DeckHole) => { for (const p of carp.solve(hole.open(), 1)[0]) expect(hole.put(p.letter, norm(p.cells), ...at(p.cells))).toBe(true); };

describe('sailing: the moves (Battle Navigation\'s, 9 Nov)', () => {
  const p: Pose = { c: 5, r: 5, d: 0 };   // facing out to sea

  it('forward is one square ahead', () => {
    expect(path(p, 'F').to).toEqual({ c: 5, r: 6, d: 0 });
    expect(path({ c: 5, r: 5, d: 1 }, 'F').to).toEqual({ c: 6, r: 5, d: 1 });
  });

  it('left and right are a square ahead and a square to that side, facing that way', () => {
    expect(path(p, 'L').to).toEqual({ c: 4, r: 6, d: 3 });
    expect(path(p, 'R').to).toEqual({ c: 6, r: 6, d: 1 });
    expect(path({ c: 5, r: 5, d: 2 }, 'R').to).toEqual({ c: 4, r: 4, d: 3 });
    expect(path(p, 'L').cells).toEqual([[5, 6], [4, 6]]);
  });

  it('drawn as she goes: a quarter circle for a turn, ending where the move does', () => {
    for (const m of ['F', 'L', 'R'] as Move[]) for (let d = 0; d < 4; d++) {
      const from = { c: 5, r: 5, d }, to = path(from, m).to, end = poseAt(from, m, 1);
      expect(end.c).toBeCloseTo(to.c); expect(end.r).toBeCloseTo(to.r);
      expect(((Math.round(end.a) % 4) + 4) % 4).toBe(to.d);
      const start = poseAt(from, m, 0);
      expect(start.c).toBeCloseTo(5); expect(start.r).toBeCloseTo(5);
    }
    // Halfway round a right turn she's out on the arc, a square from its middle.
    const mid = poseAt(p, 'R', 0.5);
    expect(Math.hypot(mid.c - 6, mid.r - 5)).toBeCloseTo(1);
  });
});

describe('sailing: rocks ("just keep it simple as like with a few rocks", 9 Nov)', () => {
  it('forward into a rock, she stays put; a blocked turn turns her on the spot', () => {
    const s = clearSea();
    s.rocks.add('5,6');
    expect(s.sail({ c: 5, r: 5, d: 0 }, 'F')).toEqual({ to: { c: 5, r: 5, d: 0 }, bump: true });
    expect(s.sail({ c: 5, r: 5, d: 0 }, 'L')).toEqual({ to: { c: 5, r: 5, d: 3 }, bump: true });
    expect(s.sail({ c: 5, r: 5, d: 1 }, 'F').bump).toBe(false);
  });

  it('the edge of the board stops her like a rock', () => {
    const s = clearSea();
    expect(s.sail({ c: 0, r: 3, d: 3 }, 'F').bump).toBe(true);
  });

  it('every sea leaves the mooring clear and every open square reachable', () => {
    for (let seed = 1; seed < 40; seed++) {
      const s = new Sea(seed), H = SAIL.HOME;
      expect(s.rocks.size).toBeGreaterThan(5);
      for (let r = 0; r <= 3; r++) for (let c = H.c - 2; c <= H.c + 2; c++) expect(s.isRock(c, r)).toBe(false);
      // (but a trade wind's squares: she can't stop on a lane, it always sweeps her on)
      for (let c = 0; c < s.cols; c++) for (let r = 0; r < s.rows; r++) if (s.open(c, r)) expect(s.plot(H, c, r) !== null).toBe(s.windAt(c, r) === undefined);
    }
  });

  it('is the same sea for the same seed', () => {
    expect([...new Sea(7).rocks].sort()).toEqual([...new Sea(7).rocks].sort());
  });
});

describe('sailing: the pilot ("drop a pin ... it almost like auto moves", 9 Nov)', () => {
  it('finds the fewest moves to the pin, never through a rock', () => {
    const s = clearSea();
    expect(s.plot({ c: 5, r: 0, d: 0 }, 5, 4)).toEqual(['F', 'F', 'F', 'F']);
    s.rocks.add('5,2');
    const moves = s.plot({ c: 5, r: 0, d: 0 }, 5, 4)!;
    let p: Pose = { c: 5, r: 0, d: 0 };
    for (const m of moves) { const r = s.sail(p, m); expect(r.bump).toBe(false); p = r.to; }
    expect([p.c, p.r]).toEqual([5, 4]);
  });

  it('a pin dropped on a rock or off the board goes to the nearest open water', () => {
    const s = clearSea();
    s.rocks.add('8,8');
    expect(s.pinAt(8, 8)).not.toEqual([8, 8]);
    expect(s.pinAt(-3, 4)).toEqual([0, 4]);
    expect(s.pinAt(99, 99)).toEqual([s.cols - 1, s.rows - 1]);
  });

  it('every sea\'s pilot gets from the mooring to the far side', () => {
    for (let seed = 1; seed < 20; seed++) {
      const s = new Sea(seed), at = s.pinAt(SAIL.HOME.c, s.rows - 1)!, h = new Helm(s);
      h.drop(...at);
      run(h, 120);
      expect([h.pose.c, h.pose.r]).toEqual(at);
      expect(h.pin).toBeNull();
    }
  });
});

describe('sailing: the turns ("left, pauses, right, pauses, forward, forward", 9 Nov)', () => {
  it('a turn is up to four moves, each with a pause after, and lasts "5 or 10 seconds"', () => {
    const full = SAIL.SLOTS * (SAIL.MOVE + SAIL.PAUSE) + SAIL.BREAK;
    expect(full).toBeGreaterThanOrEqual(5);
    expect(full).toBeLessThanOrEqual(10);
  });

  it('plays the moves one at a time, then a breather before the next turn', () => {
    const h = new Helm(clearSea());
    h.drop(SAIL.HOME.c, 9);
    const ev = h.tick(SAIL.WAKE + 0.01);
    expect(ev.map((e) => e.kind)).toEqual(['turn', 'move']);
    expect((ev[0] as { moves: Move[] }).moves).toHaveLength(SAIL.SLOTS);
    const moves = run(h, SAIL.SLOTS * (SAIL.MOVE + SAIL.PAUSE) - 0.1).filter((e) => e.kind === 'move');
    expect(moves).toHaveLength(SAIL.SLOTS - 1);
    expect(h.pose.r).toBe(SAIL.SLOTS);
    // The breather: nothing new until it's over.
    expect(run(h, SAIL.BREAK - 0.2).filter((e) => e.kind === 'move')).toHaveLength(0);
    expect(run(h, 0.4).filter((e) => e.kind === 'turn')).toHaveLength(1);
  });

  it('crossing the whole board doesn\'t take forever (under a minute)', () => {
    const h = new Helm(clearSea());
    h.drop(SAIL.HOME.c + 5, SAIL.ROWS - 1);
    let t = 0;
    while (h.pin && t < 120) { h.tick(0.05); t += 0.05; }
    expect(h.pin).toBeNull();
    expect(t).toBeLessThan(60);
  });

  it('your own moves go first; the pilot carries on from wherever they leave her', () => {
    const h = new Helm(clearSea());
    h.drop(SAIL.HOME.c, 6);
    h.put('R');
    expect(h.next()[0]).toBe('R');
    run(h, 40);
    expect([h.pose.c, h.pose.r]).toEqual([SAIL.HOME.c, 6]);
  });

  it(`the pilot can still get her away when she's turned to face the shore (9 Nov)`, () => {
    // Moored broadside, a right turn at her mooring is blocked by the beach and turns her on the
    // spot to face it; the pilot used to give up there, a turn on the spot not counting as a move.
    const sea = clearSea(), h = new Helm(sea, { c: SAIL.HOME.c, r: 0, d: 2 });
    expect(sea.plot(h.pose, SAIL.HOME.c, 6)).not.toBeNull();
    h.drop(SAIL.HOME.c, 6);
    run(h, 40);
    expect([h.pose.c, h.pose.r]).toEqual([SAIL.HOME.c, 6]);
  });

  it('sits still with nothing to do, and wakes promptly when told', () => {
    const h = new Helm(clearSea());
    expect(run(h, 5)).toEqual([]);
    expect(h.idle()).toBe(true);
    h.put('F');
    const ev = run(h, SAIL.WAKE + 0.1);
    expect(ev.some((e) => e.kind === 'move')).toBe(true);
  });

  it('a pin pulled up mid-turn lets the turn finish, then she stops', () => {
    const h = new Helm(clearSea());
    h.drop(SAIL.HOME.c, 12);
    h.tick(SAIL.WAKE + 0.01);
    h.stop();
    run(h, 20);
    expect(h.pose.r).toBe(SAIL.SLOTS);
    expect(h.idle()).toBe(true);
  });
});

describe('sailing: her guns, one each side (9 Nov)', () => {
  it('a shot goes out of her right side, or her left, as she faces', () => {
    const s = clearSea(), at = { c: 5, r: 5, a: 0 };   // facing out to sea: her right is across to +c
    expect(broadside(s, at, 'R').cells).toEqual([[6, 5], [7, 5], [8, 5]]);
    expect(broadside(s, at, 'L').cells).toEqual([[4, 5], [3, 5], [2, 5]]);
    expect(broadside(s, { c: 5, r: 5, a: 1 }, 'R').cells[0]).toEqual([5, 4]);   // facing right: her right's back to the cove
  });

  it(`"go along and shoot the rocks": a shot stops at the first rock in its way`, () => {
    const s = clearSea();
    s.rocks.add('7,5'); s.rocks.add('8,5');
    expect(broadside(s, { c: 5, r: 5, a: 0 }, 'R')).toEqual({ cells: [[6, 5], [7, 5]], hit: [7, 5] });
    expect(broadside(s, { c: 5, r: 5, a: 0 }, 'L').hit).toBeNull();
  });

  it('mid-move, it fires from the square and the way she is nearest', () => {
    const s = clearSea();
    s.rocks.add('8,6');
    expect(broadside(s, { c: 5.1, r: 5.7, a: 0.2 }, 'R').hit).toEqual([8, 6]);
    expect(broadside(s, { c: 5, r: 5, a: -0.8 }, 'R').cells[0]).toEqual([5, 6]);   // turned left from facing out: facing left
  });

  it('a gun has to load again after a shot; the other side is ready all the same', () => {
    const g = new Guns();
    expect(g.fire('L')).toBe(true);
    expect(g.fire('L')).toBe(false);
    expect(g.fire('R')).toBe(true);
    g.tick(SAIL.RELOAD - 0.1);
    expect(g.ready('L')).toBe(false);
    expect(g.loaded('L')).toBeGreaterThan(0.9);
    g.tick(0.1);
    expect(g.fire('L')).toBe(true);
  });
});

describe('sailing: the trade winds ("just insanely quick wind tiles", 9 Nov)', () => {
  const [ac, ar] = LAY.LANES[0].at, [jc, jr] = LAY.JUNCTION;

  it('sail onto a lane and it sweeps her down it, square by square, to the junction at its end', () => {
    const s = new Sea(9), { to, ride } = s.move({ c: ac, r: ar - 1, d: 0 }, 'F');
    expect(to).toEqual({ c: ac, r: ar, d: 0 });
    expect(ride.map((p) => [p.c, p.r])).toEqual(Array.from({ length: LAY.LANES[0].n }, (_, i) => [ac, ar + 1 + i]));
    expect(s.sail({ c: ac, r: ar - 1, d: 0 }, 'F').to).toEqual({ c: jc, r: jr, d: 0 });
  });

  it(`"drops you off just like a normal square": at the junction, left, right or on`, () => {
    const s = new Sea(9), at: Pose = { c: jc, r: jr, d: 0 };
    expect(s.windAt(jc, jr)).toBeUndefined();
    // Right: onto the wind across and round, back in towards the cove: a loop.
    const right = s.sail(at, 'R').to, C = LAY.LANES[2];
    expect([right.c, right.r]).toEqual([C.at[0], C.at[1] - C.n]);
    // Left: the canal, towards the lock; on: open sea.
    expect(s.sail(at, 'L')).toEqual({ to: { c: jc - 1, r: jr + 1, d: 3 }, bump: false });
    expect(s.sail(at, 'F').to).toEqual({ c: jc, r: jr + 1, d: 0 });
  });

  it('the wind turns her the way it blows as it carries her round a corner', () => {
    const s = new Sea(9), B = LAY.LANES[1];
    const ride = s.ride({ c: B.at[0], r: B.at[1], d: 1 });
    expect(ride[B.n - 1].d).toBe(B.d);
    expect(ride[B.n].d).toBe(LAY.LANES[2].d);
  });

  it('the pilot takes the lane when it\'s quicker, and the ride is quick to sail', () => {
    const s = new Sea(9), from: Pose = { c: ac, r: ar - 1, d: 0 };
    expect(s.plot(from, jc, jr)).toEqual(['F']);
    const h = new Helm(s, from);
    h.drop(jc, jr);
    let t = 0;
    while (h.pin && t < 30) { h.tick(0.05); t += 0.05; }
    expect([h.pose.c, h.pose.r]).toEqual([jc, jr]);
    expect(t).toBeLessThan(SAIL.WAKE + SAIL.MOVE + LAY.LANES[0].n * SAIL.PUSH + 0.2);
  });

  it('a pin dropped on a lane goes to water she can stop in', () => {
    const s = new Sea(9), at = s.pinAt(ac, ar + 3)!;
    expect(s.windAt(...at)).toBeUndefined();
  });
});

describe('sailing: the lock up the cliff into the hidden cove (9 Nov)', () => {
  const [lc, lr] = LAY.LOCK, canal: Pose = { c: lc + 1, r: lr, d: 3 };

  it('the cove is behind a cliff: the lock is the only way in', () => {
    const s = new Sea(9), { c0, c1, r0, r1 } = LAY.COVE;
    for (let r = r0 - 1; r <= r1; r++) if (r !== lr) expect(s.isRock(c1 + 1, r)).toBe(true);
    for (let c = c0; c <= c1; c++) expect(s.isRock(c, r0 - 1)).toBe(true);
    expect(s.isLock(c1 + 1, lr)).toBe(true);
    expect(s.level(c0, r0)).toBe(1);
    expect(s.level(lc + 1, lr)).toBe(0);
  });

  it(`"you have to go up a lock": she waits in it while it's pumped up by Bilge, then sails on into the cove`, () => {
    const h = new Helm(new Sea(9), canal);
    h.put('F'); h.put('F');
    run(h, 4);
    expect([h.pose.c, h.pose.r]).toEqual([lc, lr]);
    expect(h.held()).toBe('up');
    run(h, 10);
    expect([h.pose.c, h.pose.r]).toEqual([lc, lr]);   // nothing happens on its own
    expect(h.pump(SAIL.LOCK_WORK / 2)).toBe('lock');
    run(h, 2);
    expect(h.held()).toBe('up');
    h.pump(SAIL.LOCK_WORK / 2);
    rise(h);
    expect(h.held()).toBe('gates');
    run(h, 3);
    expect([h.pose.c, h.pose.r]).toEqual([lc - 1, lr]);
  });

  it('the top gates were still swinging open as she sailed through (9 Nov): she waits for the gates, up and down', () => {
    const h = new Helm(new Sea(9), canal);
    h.put('F'); h.put('F');
    run(h, 4);
    h.pump(SAIL.LOCK_WORK);
    rise(h);
    expect(h.held()).toBe('gates');
    run(h, SAIL.GATES - 0.15);
    expect(h.cur).toBeNull();
    expect([h.pose.c, h.pose.r]).toEqual([lc, lr]);
    run(h, 0.3);
    expect(h.held()).toBeNull();
    expect(h.cur?.m).toBe('F');
    // Back down: drained, then the bottom gates swing open before she sails out to sea.
    const d = new Helm(new Sea(9), { c: lc - 1, r: lr, d: 1 });
    d.level = 1;
    d.put('F'); d.put('F');
    for (let t = 0; t < 10 && d.level > 0; t += 0.05) d.tick(0.05);
    expect([d.pose.c, d.pose.r]).toEqual([lc, lr]);
    expect(d.level).toBe(0);
    expect(d.held()).toBe('gates');
    expect(d.cur).toBeNull();
    run(d, SAIL.GATES - 0.15);
    expect(d.cur).toBeNull();
    run(d, 0.3);
    expect(d.cur?.m).toBe('F');
  });

  it('the lock filled in a few bilging pieces (9 Nov)', () => {
    // "way too quickly", like the daze: "you should see the line of water gradually going up as
    // you clear a few bilging pieces".
    const three: BilgeMove = { moved: true, lines: [3], combo: '', cleared: 3, chain: 0, crabs: 0, puffer: false, jelly: false, stages: [] };
    const w = worth(three, 6), h = new Helm(new Sea(9), canal);
    h.put('F'); h.put('F');
    run(h, 4);
    expect(h.held()).toBe('up');
    // As many pieces cleared as used to fill it, and it's well short.
    for (let i = 0; i < 5; i++) { h.pump(w); run(h, 1.5); }
    expect(h.level).toBeLessThan(0.3);
    expect(h.held()).toBe('up');
    // Each clear lifts the water a step: smoothly, never all at once, and there within a second.
    const before = h.level;
    h.pump(w);
    h.tick(1 / 60);
    expect(h.level).toBeGreaterThan(before);
    expect(h.level - before).toBeLessThan(w / SAIL.LOCK_WORK / 2);
    run(h, 1);
    expect(h.level).toBeCloseTo(before + w / SAIL.LOCK_WORK, 6);
    // A proper go of Bilge: about twenty plain threes, tens of seconds of play.
    let n = 6;
    while (h.held() === 'up' && n < 100) { h.pump(w); run(h, 1.5); n++; }
    expect(n).toBeGreaterThanOrEqual(15);
    expect(h.level).toBe(1);
  });

  it('coming back down, the lock drains by itself and lets her out', () => {
    const h = new Helm(new Sea(9), { c: lc - 1, r: lr, d: 1 });
    h.level = 1;
    h.put('F'); h.put('F');
    run(h, 3);
    expect([h.pose.c, h.pose.r]).toEqual([lc, lr]);
    run(h, SAIL.DRAIN + 3);
    expect([h.pose.c, h.pose.r]).toEqual([lc + 1, lr]);
    expect(h.level).toBe(0);
  });

  it('the pilot finds the way into the cove through the lock', () => {
    const s = new Sea(9), h = new Helm(s);
    h.drop(LAY.COVE.c0 + 1, LAY.COVE.r0 + 1);
    for (let t = 0; t < 120 && h.pin; t += 0.05) { h.tick(0.05); if (h.held() === 'up') h.pump(1); }
    expect(h.pin).toBeNull();
    expect(s.level(h.pose.c, h.pose.r)).toBe(1);
  });

  it('pulling up the pin while she waits at the lock lets her off', () => {
    const h = new Helm(new Sea(9), canal);
    h.put('F'); h.put('F');
    run(h, 4);
    expect(h.held()).toBe('up');
    h.stop();
    expect(h.held()).toBeNull();
    expect(h.idle()).toBe(true);
  });
});

describe('sailing: the turret, and being dazed (9 Nov: "keeps it faster paced, but while keeping the puzzles key")', () => {
  it('shoots at the square she\'s on when she\'s in reach, and the shot takes a while to come down', () => {
    const t = new Turret([5, 5]);
    expect(t.tick(2, { c: 5, r: 9 })).toEqual([]);   // out of reach
    expect(t.tick(0.1, { c: 6.9, r: 7.2 })).toEqual([{ kind: 'fire', to: [7, 7] }]);
    expect(t.tick(SAIL.FLIGHT - 0.2, { c: 7, r: 7 })).toEqual([]);
    expect(t.tick(0.2, { c: 7, r: 7 })).toEqual([{ kind: 'land', to: [7, 7], hit: true }]);
  });

  it(`"you can shoot, but there's no guarantee": gone from that square by the time it lands, she's missed`, () => {
    const t = new Turret([5, 5]);
    t.tick(1, { c: 7, r: 7 });
    expect(t.tick(SAIL.FLIGHT, { c: 8, r: 7 })[0]).toEqual({ kind: 'land', to: [7, 7], hit: false });
  });

  it('loads between shots; quiet for a while once her guns hit it; holds fire while she\'s dazed', () => {
    const t = new Turret([5, 5]), at = { c: 6, r: 6 };
    t.tick(1, at);
    expect(t.tick(SAIL.TURRET_RELOAD - 0.1, at).some((e) => e.kind === 'fire')).toBe(false);
    expect(t.tick(0.2, at).some((e) => e.kind === 'fire')).toBe(true);
    t.silence();
    expect(t.tick(SAIL.QUIET - 0.1, at).some((e) => e.kind === 'fire')).toBe(false);
    expect(t.tick(0.2, null).some((e) => e.kind === 'fire')).toBe(false);
    expect(t.tick(0.1, at).some((e) => e.kind === 'fire')).toBe(true);
  });

  it(`a hit dazes her: she finishes the move she's on, then waits till the hole in her deck's patched`, () => {
    const h = new Helm(clearSea());
    h.drop(SAIL.HOME.c, 10);
    h.tick(SAIL.WAKE + 0.3);
    h.hit();
    expect(h.held()).toBe('daze');
    run(h, 10);
    expect(h.pose.r).toBe(1);   // the move she was on, and no more
    expect(h.pump(5)).toBeNull();   // (no bilging her out)
    expect(h.dazed()).toBe(true);
    fill(h.hole!);
    expect(h.dazed()).toBe(false);
    expect(h.held()).toBeNull();
    run(h, 3);
    expect(h.pose.r).toBeGreaterThan(1);
  });

  it('the daze was over in one fix, and bilging a cannonball hit felt wrong (9 Nov)', () => {
    // "way too quickly. Like, you know, one fix and it was done": a hole is a whole hole to fill,
    // three pieces' worth, and pumping does nothing for it ("I've been hit by a cannonball, not
    // water bucket").
    const h = new Helm(clearSea());
    h.hit();
    expect(h.hole!.cells.length).toBe(5 * PATCH.PIECES);
    for (let i = 0; i < 20; i++) h.pump(10);
    expect(h.dazed()).toBe(true);
    const [first, ...rest] = carp.solve(h.hole!.cells, 1)[0];
    h.hole!.put(first.letter, norm(first.cells), ...at(first.cells));
    expect(h.dazed()).toBe(true);   // one fix isn't it
    for (const p of rest) h.hole!.put(p.letter, norm(p.cells), ...at(p.cells));
    expect(h.dazed()).toBe(false);
    // A hit knocks in a fresh hole; a second hit while she's holed doesn't make it worse.
    h.hit(); const hole = h.hole;
    h.hit();
    expect(h.hole).toBe(hole);
  });
  it('the turret fired again the moment she was patched (9 Nov)', () => {
    // "As soon as you finish the puzzle, the cannon starts shooting at you again ... literally
    // before you can do anything about it." So it holds fire a while once she's patched.
    const h = new Helm(clearSea(), { c: 6, r: 6, d: 0 }), t = new Turret([6, 8]);
    const shoot = (secs: number) => { const ev = []; for (let s = 0; s < secs; s += 0.05) { h.tick(0.05); ev.push(...t.tick(0.05, h.spared() ? null : h.now())); } return ev; };
    h.hit();
    expect(shoot(20).some((e) => e.kind === 'fire')).toBe(false);   // dazed: no shots
    fill(h.hole!);
    expect(h.dazed()).toBe(false);
    expect(shoot(SAIL.GRACE - 0.2).some((e) => e.kind === 'fire')).toBe(false);
    expect(shoot(0.4).some((e) => e.kind === 'fire')).toBe(true);   // (she's still in reach)
  });

  it('dazed on the trade wind, the wind still carries her to the end of the lane', () => {

    const [ac, ar] = LAY.LANES[0].at, h = new Helm(new Sea(9), { c: ac, r: ar - 1, d: 0 });
    h.put('F');
    h.tick(SAIL.WAKE + SAIL.MOVE + 0.1);
    h.hit();
    run(h, 10);
    expect([h.pose.c, h.pose.r]).toEqual(LAY.JUNCTION);
  });
});
