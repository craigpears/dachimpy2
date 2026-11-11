import { describe, expect, it } from 'vitest';
import { SAIL, LAY, Sea, Helm, broadside, path, poseAt, type Move, type Pose } from '../src/den-sail';
import { PATCH, type DeckHole } from '../src/den-patch';
import { carp, stilled } from './helpers';
import { worth } from '../src/den-bilge';
import { LOCK, ends } from '../src/den-lock';
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
      // (but a trade wind's squares: she can't stop on a lane, it always sweeps her on; and under
      // sail, not the old wreck's wind zone and the water beyond it, which the wind keeps her out
      // of from this side)
      // (and the canal, up past its mouth's wind, and the harbour that wind fills: tests/den-wind.test.ts)
      const harbour = s.zoneAt(...LAY.LOCKS[0].at);
      const lee = (c: number, r: number) => (r >= LAY.ZONES[0].r0 && c <= LAY.ZONES[0].c1) || s.level(c, r) > 0 || s.isLock(c, r) || s.zoneAt(c, r) === harbour;
      // (and not the water only Kikkit's whirlpools get to, the smugglers' run behind Port Decorum, 11 Nov:
      // tests/den-smugglers.test.ts)
      // (nor the race's course behind its line of rocks, where past the trade wind back up it only a
      // gust gets her, 11 Nov: tests/den-race.test.ts sails her round it)
      for (let c = 0; c < s.cols; c++) for (let r = 0; r <= LAY.RACE.R0; r++) if (s.open(c, r) && !s.hidden.has(`${c},${r}`)) {
        expect(s.plot(H, c, r, null, true) !== null).toBe(s.windAt(c, r) === undefined);
        if (!lee(c, r)) expect(s.plot(H, c, r) !== null).toBe(s.windAt(c, r) === undefined);
      }
    }
  }, 120000);   // (a lot of plotting, on the bigger board: bigger again, 11 Nov, for Port Decorum)

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
      const s = new Sea(seed), at = s.pinAt(LAY.CHECKPOINT.GATE + 3, SAIL.CHARTED.ROWS - 1)!, h = new Helm(s);   // (the far side of the charted sea: the race's course is beyond it, 11 Nov)
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
    h.drop(SAIL.HOME.c + 5, SAIL.CHARTED.ROWS - 1);   // (the charted sea's far edge: the race's course is beyond it, 11 Nov)
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
  // (Loading them, by Gunnery, and firing what's loaded: tests/den-guns.test.ts.)
});

describe('sailing: the trade winds ("just insanely quick wind tiles", 9 Nov)', () => {
  const [ac, ar] = LAY.LANES[0].at, [jc, jr] = LAY.JUNCTION;

  it('sail onto a lane and it sweeps her down it, square by square, to the junction at its end', () => {
    const s = new Sea(9), { to, ride } = s.move({ c: ac, r: ar - 1, d: 0 }, 'F');
    expect(to).toEqual({ c: ac, r: ar, d: 0 });
    expect(ride.map((p) => [p.c, p.r])).toEqual(Array.from({ length: LAY.LANES[0].n }, (_, i) => [ac, ar + 1 + i]));
    expect(s.sail({ c: ac, r: ar - 1, d: 0 }, 'F').to).toEqual({ c: jc, r: jr, d: 0 });
  });

  it(`"drops you off just like a normal square": at the junction, left or on`, () => {
    const s = new Sea(9), at: Pose = { c: jc, r: jr, d: 0 };
    expect(s.windAt(jc, jr)).toBeUndefined();
    // Left: the canal, towards the lock; on: the main shipping lane, out to the imperial checkpoint
    // (10 Nov), which drops her off short of its guns.
    expect(s.sail(at, 'L')).toEqual({ to: { c: jc - 1, r: jr + 1, d: 3 }, bump: false });
    const D = LAY.LANES[1];
    expect(D.at).toEqual([jc, jr + 1]);
    expect(s.sail(at, 'F').to).toEqual({ c: jc, r: jr + 1 + D.n, d: 0 });
    // Right is open sea (the loop that was there went with the turret, 10 Nov).
    expect(s.sail(at, 'R')).toEqual({ to: { c: jc + 1, r: jr + 1, d: 1 }, bump: false });
  });

  it('the sea was rebuilt round the checkpoint (10 Nov): out towards it on the wind, and home on another', () => {
    // "there's no need for that cannon near the turret near the den now, because ... we've got the
    // Imperial checkpoint. That's the evolution of it." So the trade winds run out towards the
    // checkpoint from off the beach, and back home.
    const s = new Sea(9), K = LAY.CHECKPOINT;
    expect(s.sail({ c: ac, r: ar - 1, d: 0 }, 'F').to).toEqual({ c: jc, r: jr, d: 0 });
    const out = s.sail({ c: jc, r: jr, d: 0 }, 'F').to;
    expect(out).toEqual({ c: K.GATE, r: 15, d: 0 });
    // Home: a lane from beside where the main lane drops her, back in to just off the beach.
    const H = LAY.LANES[2], end = s.dropOff(...H.at);
    expect(H.d).toBe(2);
    expect(Math.max(Math.abs(H.at[0] - out.c), Math.abs(H.at[1] - out.r))).toBeLessThanOrEqual(2);
    expect(end[1]).toBeLessThanOrEqual(2);
    // The pilot rides it home from there, quicker than sailing.
    const home = s.plot(out, SAIL.HOME.c, SAIL.HOME.r, null, true)!;
    let p: Pose = out;
    const been: string[] = [];
    for (const m of home) { const mv = s.move(p, m, true); been.push(...mv.ride.map((q) => `${q.c},${q.r}`)); p = s.sail(p, m, true).to; }
    expect([p.c, p.r]).toEqual([SAIL.HOME.c, SAIL.HOME.r]);
    expect(been).toContain(`${end[0]},${end[1]}`);
    expect(home.length).toBeLessThan(10);
  });

  it('the wind turns her the way it blows as it carries her round a corner', () => {
    const s = clearSea();
    for (let i = 0; i < 3; i++) s.wind.set(`5,${5 + i}`, 0);
    for (let i = 0; i < 3; i++) s.wind.set(`${5 + i},8`, 1);
    const ride = s.ride({ c: 5, r: 5, d: 0 });
    expect(ride.map((p) => [p.c, p.r, p.d])).toEqual([[5, 6, 0], [5, 7, 0], [5, 8, 0], [6, 8, 1], [7, 8, 1], [8, 8, 1]]);
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

  // Sails to the pin, a frame at a time: the squares she was on, the seconds it took, and the
  // squares the wind swept her over.
  const voyage = (h: Helm, secs = 120) => {
    const been: string[] = [], swept: string[] = [];
    let t = 0;
    for (; h.pin && t < secs; t += 0.05) {
      for (const e of h.tick(0.05)) {
        if (e.kind === 'move') been.push(`${e.to.c},${e.to.r}`);
        if (e.kind === 'push') { been.push(`${e.to.c},${e.to.r}`); swept.push(`${e.to.c},${e.to.r}`); }
      }
    }
    return { been, swept, t };
  };

  it(`couldn't drop a pin onto the lanes (9 Nov)`, () => {
    // "I don't seem to be able to drop a pin onto the lanes." A pin on a lane means "ride this
    // lane": it goes to where the wind will drop her off, and she gets there by riding it, over the
    // square you dropped it on.
    const s = new Sea(9);
    let h = new Helm(s);
    expect(h.drop(ac, ar + 3)).toEqual([jc, jr]);
    expect(h.pin).toEqual([jc, jr]);
    let v = voyage(h);
    expect(h.pin).toBeNull();
    expect([h.pose.c, h.pose.r]).toEqual([jc, jr]);
    expect(v.swept).toContain(`${ac},${ar + 4}`);
    // On the lane home, she's dropped off at its end, back in towards the beach.
    const C = LAY.LANES[2], end: [number, number] = [C.at[0], C.at[1] - C.n];
    h = new Helm(s);
    expect(h.drop(C.at[0], C.at[1] - 4)).toEqual(end);
    v = voyage(h);
    expect([h.pose.c, h.pose.r]).toEqual(end);
    expect(v.been).toContain(`${C.at[0]},${C.at[1] - 4}`);   // (onto it there, or swept over it)
    // Even when she's sitting where the lane drops her off: she goes round and rides it.
    h = new Helm(s, { c: jc, r: jr, d: 0 });
    expect(h.drop(ac, ar + 2)).toEqual([jc, jr]);
    v = voyage(h);
    expect([h.pose.c, h.pose.r]).toEqual([jc, jr]);
    expect(v.swept).toContain(`${ac},${ar + 3}`);
    // And on the lane she's riding already, ahead of her, she just carries on.
    h = new Helm(s, { c: ac, r: ar - 1, d: 0 });
    h.put('F');
    run(h, SAIL.WAKE + SAIL.MOVE + SAIL.PUSH * 2);
    expect(h.cur?.m).toBe('W');
    h.drop(ac, ar + 6);
    expect(h.course()).toEqual([]);
    run(h, 5);
    expect([h.pose.c, h.pose.r]).toEqual([jc, jr]);
    expect(h.pin).toBeNull();
  });

  it('the autopilot is going crazy around them (9 Nov)', () => {
    // "The autopilot is going crazy around them." The pilot counted moves and the wind was free,
    // so for a pin out beyond the loop's far lane (the loop that was) she sailed onto the first
    // lane, out to the junction, all the way round the loop back in near the beach, and out again.
    // Now the wind's quick but not free, and she sails straight there, never riding the lane home
    // out of her way.
    const s = new Sea(9), C = LAY.LANES[2], h = new Helm(s);
    h.drop(15, 8);
    const v = voyage(h);
    expect([h.pose.c, h.pose.r]).toEqual([15, 8]);
    expect(v.swept).toEqual([]);
    expect(v.been.filter((id) => s.windAt(...(id.split(',').map(Number) as [number, number])) === C.d)).toEqual([]);
    expect(v.t).toBeLessThan(24);
    // Anywhere she's sent, she sails what she plotted, with no dithering on the way: no more moves
    // than planned, and there.
    for (let c = 0; c < s.cols; c++) for (let r = 0; r < s.rows; r++) {
      if (!s.open(c, r) || s.windAt(c, r) !== undefined || s.level(c, r) || s.isLock(c, r) || s.hidden.has(`${c},${r}`)) continue;   // (nor behind the smugglers' rocks: only the whirlpools get there)
      if (r >= LAY.RACE.R0) continue;   // (nor out on the race's course, minutes away: tests/den-race.test.ts)
      const g = new Helm(s);
      if (!g.drop(c, r) || !g.pin || g.headwind()) continue;   // (the wreck's wind keeps her off: den-wind.test.ts)
      const plan = g.course().length;
      let moves = 0;
      for (let t = 0; g.pin && t < 200; t += 0.05) moves += g.tick(0.05).filter((e) => e.kind === 'move').length;
      expect(g.pin).toBeNull();
      expect([g.pose.c, g.pose.r]).toEqual([c, r]);
      expect(moves).toBe(plan);
    }
  });
});

describe('sailing: the first lock, up the cliff from the canal (9 Nov)', () => {
  // (The lock itself, and the chain of them it's the first of: tests/den-lock.test.ts. The wind at
  // the canal's mouth that keeps her out under sail, stilled here: den-wind.test.ts.)
  // (Below it, the canal's mouth at the sea's level, facing it; above it, the canal a lift up.)
  const L = LAY.LOCKS[0], [lc, lr] = L.at, { low, high } = ends(L), canal: Pose = { c: low[0], r: low[1], d: L.up };
  const lock = (h: Helm) => h.lockAt(lc, lr)!;

  it('the canal behind it is a lock\'s lift up: the lock is the only way in', () => {
    const s = stilled(new Sea(9)), banks: [number, number][] = L.up % 2 ? [[lc, lr - 1], [lc, lr + 1]] : [[lc - 1, lr], [lc + 1, lr]];
    for (const b of banks) expect(s.isRock(...b)).toBe(true);
    expect(s.isLock(lc, lr)).toBe(true);
    expect(s.level(...high)).toBe(1);
    expect(s.level(...low)).toBe(0);
  });

  it(`"you have to go up a lock": she waits in it while it's pumped up by Bilge, then sails on`, () => {
    const h = new Helm(stilled(new Sea(9)), canal);
    h.put('F'); h.put('F');
    run(h, 4);
    expect([h.pose.c, h.pose.r]).toEqual([lc, lr]);
    expect(h.held()).toBe('up');
    run(h, 10);
    expect([h.pose.c, h.pose.r]).toEqual([lc, lr]);   // nothing happens on its own
    expect(h.pump(LOCK.WORK / 2)).toBe('lock');
    run(h, 2);
    expect(h.held()).toBe('up');
    h.pump(LOCK.WORK / 2);
    rise(h);
    expect(h.held()).toBe('gates');
    run(h, 3);
    expect([h.pose.c, h.pose.r]).toEqual(high);
  });

  it('the top gates were still swinging open as she sailed through (9 Nov): she waits for the gates, up and down', () => {
    const h = new Helm(stilled(new Sea(9)), canal);
    h.put('F'); h.put('F');
    run(h, 4);
    h.pump(LOCK.WORK);
    rise(h);
    expect(h.held()).toBe('gates');
    run(h, LOCK.GATES - 0.15);
    expect(h.cur).toBeNull();
    expect([h.pose.c, h.pose.r]).toEqual([lc, lr]);
    run(h, 0.3);
    expect(h.held()).toBeNull();
    expect(h.cur?.m).toBe('F');
    // Back down: drained, then the bottom gates swing open before she sails out to sea.
    const d = new Helm(stilled(new Sea(9)), { c: high[0], r: high[1], d: (L.up + 2) % 4 });
    lock(d).level = 1;
    d.put('F'); d.put('F');
    for (let t = 0; t < 10 && lock(d).level > 0; t += 0.05) d.tick(0.05);
    expect([d.pose.c, d.pose.r]).toEqual([lc, lr]);
    expect(lock(d).level).toBe(0);
    expect(d.held()).toBe('gates');
    expect(d.cur).toBeNull();
    run(d, LOCK.GATES - 0.15);
    expect(d.cur).toBeNull();
    run(d, 0.3);
    expect(d.cur?.m).toBe('F');
  });

  it('the lock filled in a few bilging pieces (9 Nov)', () => {
    // "way too quickly", like the daze: "you should see the line of water gradually going up as
    // you clear a few bilging pieces".
    const three: BilgeMove = { moved: true, lines: [3], combo: '', cleared: 3, chain: 0, crabs: 0, puffer: false, jelly: false, stages: [] };
    const w = worth(three, 6), h = new Helm(stilled(new Sea(9)), canal);
    h.put('F'); h.put('F');
    run(h, 4);
    expect(h.held()).toBe('up');
    // A few clears in, it's well short.
    for (let i = 0; i < 3; i++) { h.pump(w); run(h, 1.5); }
    expect(lock(h).level).toBeLessThan(0.4);
    expect(h.held()).toBe('up');
    // Each clear lifts the water a step: smoothly, never all at once, and there within a second.
    const before = lock(h).level;
    h.pump(w);
    h.tick(1 / 60);
    expect(lock(h).level).toBeGreaterThan(before);
    expect(lock(h).level - before).toBeLessThan(w / LOCK.WORK / 2);
    run(h, 1);
    expect(lock(h).level).toBeCloseTo(before + w / LOCK.WORK, 6);
    // A proper go of Bilge still: about nine plain threes.
    let n = 4;
    while (h.held() === 'up' && n < 100) { h.pump(w); run(h, 1.5); n++; }
    expect(n).toBeGreaterThanOrEqual(8);
    expect(lock(h).level).toBe(1);
  });

  it('"tone down how many times you need to get through the locks ... Maybe take a third off" (10 Nov)', () => {
    // Less Bilge to lift her than the sixteen moves' worth it was: a third off, then less again.
    expect(LOCK.WORK).toBeLessThanOrEqual(16 * 2 / 3);
  });

  it('the locks aren\'t so bilge-heavy now there\'s rowing to get in too (10 Nov)', () => {
    // "the locks are incredibly [bilge] heavy now because we've got the rowing to get in ... a bit
    // of balancing on how much bilging is needed": under half the sixteen it was, but still a go.
    expect(LOCK.WORK).toBeLessThan(8);
    expect(LOCK.WORK).toBeGreaterThanOrEqual(6);
  });

  it('coming back down, the lock drains by itself and lets her out', () => {
    const h = new Helm(stilled(new Sea(9)), { c: high[0], r: high[1], d: (L.up + 2) % 4 });
    lock(h).level = 1;
    h.put('F'); h.put('F');
    run(h, 3);
    expect([h.pose.c, h.pose.r]).toEqual([lc, lr]);
    run(h, LOCK.DRAIN + 3);
    expect([h.pose.c, h.pose.r]).toEqual(low);
    expect(lock(h).level).toBe(0);
  });

  it('the pilot finds the way up through the lock', () => {
    const s = stilled(new Sea(9)), h = new Helm(s);
    h.drop(high[0], high[1] + 1);
    for (let t = 0; t < 120 && h.pin; t += 0.05) { h.tick(0.05); if (h.held() === 'up') h.pump(1); }
    expect(h.pin).toBeNull();
    expect(s.level(h.pose.c, h.pose.r)).toBe(1);
  });

  it('pulling up the pin while she waits at the lock lets her off', () => {
    const h = new Helm(stilled(new Sea(9)), canal);
    h.put('F'); h.put('F');
    run(h, 4);
    expect(h.held()).toBe('up');
    h.stop();
    expect(h.held()).toBeNull();
    expect(h.idle()).toBe(true);
  });
});

describe('sailing: being dazed (9 Nov: "keeps it faster paced, but while keeping the puzzles key")', () => {
  // (The guns that hit her, the imperial checkpoint's: tests/den-checkpoint.test.ts. The turret that
  // first did went, 10 Nov.)
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
  it('dazed on the trade wind, the wind still carries her to the end of the lane', () => {

    const [ac, ar] = LAY.LANES[0].at, h = new Helm(new Sea(9), { c: ac, r: ar - 1, d: 0 });
    h.put('F');
    h.tick(SAIL.WAKE + SAIL.MOVE + 0.1);
    h.hit();
    run(h, 10);
    expect([h.pose.c, h.pose.r]).toEqual(LAY.JUNCTION);
  });
});
