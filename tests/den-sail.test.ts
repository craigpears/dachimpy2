import { describe, expect, it } from 'vitest';
import { SAIL, Sea, Helm, path, poseAt, type Move, type Pose } from '../src/den-sail';

const clearSea = () => { const s = new Sea(1); s.rocks.clear(); return s; };
const run = (h: Helm, secs: number, step = 0.05) => { const ev = []; for (let t = 0; t < secs; t += step) ev.push(...h.tick(step)); return ev; };

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
      for (let c = 0; c < s.cols; c++) for (let r = 0; r < s.rows; r++) if (s.open(c, r)) expect(s.plot(H, c, r)).not.toBeNull();
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
