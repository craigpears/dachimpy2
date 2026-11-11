/* The Sailing pair steered live as it falls (src/sail-pair.ts): its steps are moves()'s, so where it
   comes to rest is a place moves() has, and it's dropped there. */
import { describe, expect, it } from 'vitest';
import { H, SPAWN, Sailing, W, type Piece, type Platform } from '../src/sailing';
import { FALL, SailPair } from '../src/sail-pair';

/** An empty board (no platforms) with the pair `pair` coming in, and a dice that deals 0s after. */
function game(pair: [number, number] = [0, 1], platforms: Platform[] = [], fill: [number, number, number][] = []): Sailing {
  const s = new Sailing(() => 0, false);
  const grid: (Piece | null)[][] = Array.from({ length: H }, () => Array<Piece | null>(W).fill(null));
  fill.forEach(([r, c, colour], i) => { grid[r][c] = { id: 900 + i, c: colour }; });
  s.lay(grid, platforms);
  s.pair = pair;
  return s;
}

describe('the falling pair', () => {
  it('comes in at the top of the middle columns, turned 0', () => {
    const p = new SailPair(game());
    expect(p.cells()).toEqual([[0, SPAWN[0], 0], [0, SPAWN[1], 1]]);
  });
  it('slides till the wall, and turns about its first square', () => {
    const p = new SailPair(game());
    for (let i = 0; i < 9; i++) p.slide(1);
    expect(p.col).toBe(W - 2);
    expect(p.turnBy(1)).toBe(true);
    expect(p.cells()).toEqual([[0, W - 2, 0], [1, W - 2, 1]]);
    expect(p.slide(1)).toBe(true);   // (upright, it fits in the last column)
  });
  it("turned against the wall, it pushes off it (11 Nov: \"it doesn't turn when it's against the wall ... it should kind of push away from the wall\")", () => {
    const p = new SailPair(game());
    for (let i = 0; i < 9; i++) p.slide(1);
    p.turnBy(1); p.slide(1);   // (upright in the last column)
    expect(p.col).toBe(W - 1);
    expect(p.turnBy(1)).toBe(true);   // (turned 2 it'd stick out past the wall: it steps a column in)
    expect(p.col).toBe(W - 2);
    expect(p.cells().every(([, c]) => c >= 0 && c < W)).toBe(true);
    const q = new SailPair(game());
    for (let i = 0; i < 9; i++) q.slide(-1);
    q.turnBy(-1);   // (upright against the left wall, its second half above or below)
    for (let i = 0; i < 4; i++) q.turnBy(-1);
    expect(q.cells().every(([, c]) => c >= 0 && c < W)).toBe(true);
    expect(q.col).toBeLessThanOrEqual(1);
  });
  it('falls a row every FALL.SECS, and lands where it can\'t sink', () => {
    const s = game(), p = new SailPair(s);
    expect(p.tick(FALL.SECS * 0.5)).toBeNull();
    expect(p.row).toBe(0);
    expect(p.tick(FALL.SECS * 0.6)).toBeNull();
    expect(p.row).toBe(1);
    let res = null;
    for (let i = 0; i < 40 && !res; i++) res = p.tick(FALL.SECS);
    expect(res?.dropped).toBe(true);
    expect(s.grid[H - 1][SPAWN[0]]?.c).toBe(0);
    expect(s.grid[H - 1][SPAWN[1]]?.c).toBe(1);
    expect(p.row).toBe(0);   // (the next pair in at the top)
  });
  it('a hard drop lands it straight down, the same as Sailing.drop down that column', () => {
    const a = game(), b = game(), p = new SailPair(a);
    p.slide(-1); p.turnBy(1);
    const got = p.slam(), want = b.drop(SPAWN[0] - 1, 1);
    expect(got.dropped).toBe(true);
    expect(a.snap().map((r) => r.map((x) => x?.c ?? null))).toEqual(b.snap().map((r) => r.map((x) => x?.c ?? null)));
    expect(got.steps).toBe(want.steps);
  });
  it('can be slid in under a ledge as it falls, and lands there', () => {
    // A platform's shelf over columns 0-2 at row 10; the pair slid under it from column 3.
    const plat: Platform = { id: 1, r: 10, c: 0, w: 3, h: 1, targets: [{ r: 10, c: 0, colour: 2 }] };
    const s = game([0, 1], [plat]), p = new SailPair(s);
    p.turnBy(1);   // (upright in column 3)
    while (p.row < 13) p.tick(FALL.SECS);
    expect(p.slide(-1)).toBe(true);
    expect(p.col).toBe(2);
    const res = p.slam();
    expect(res.dropped).toBe(true);
    expect(s.grid[H - 2][2]?.c).toBe(0);
    expect(s.grid[H - 1][2]?.c).toBe(1);
  });
  it('a pair of one colour lands turned 2 as well as 0', () => {
    const s = game([2, 2]), p = new SailPair(s);
    p.turnBy(1); p.turnBy(1);
    expect(p.turn).toBe(2);
    expect(p.slam().dropped).toBe(true);
    expect(s.grid[H - 1][SPAWN[0]]?.c).toBe(2);
  });
  it('the shadow shows where a hard drop would land', () => {
    const p = new SailPair(game([0, 1], [], [[H - 1, SPAWN[0], 2]]));
    expect(p.rest()).toBe(H - 2);
    expect(p.row).toBe(0);
  });
});

/* TODO.md, "Sailing's keys as the real game's" (11 Nov): "the space usually kind of speeds up the drop.
   It doesn't drop it entirely. So if you're like halfway down the screen and you just want it to get 2/3
   of the way down or 3/4, you normally tap space just so you zoom kind of near the bottom but not at the
   bottom." */
describe("Space speeds the drop, it doesn't drop it entirely (the user, 11 Nov 2026)", () => {
  /** A pair fallen `rows` rows on an empty board. */
  function fallen(rows: number) {
    const s = game(), p = new SailPair(s);
    while (p.row < rows) p.tick(FALL.SECS);
    return { s, p };
  }
  it('a tap halfway down zooms it near the bottom, but not to it', () => {
    const { p } = fallen(H / 2);
    p.rush();
    expect(p.tick(0.08)).toBeNull();
    p.ease();   // (a quick tap: let go)
    expect(p.tick(FALL.BURST)).toBeNull();
    expect(p.row).toBeGreaterThanOrEqual(H / 2 + 3);
    expect(p.row).toBeLessThan(H - 1);   // (not at the bottom: still falling)
    // And then at its own pace again.
    const r = p.row;
    p.tick(FALL.SECS * 0.9);
    expect(p.row).toBeLessThanOrEqual(r + 1);   // (at most the row it was partway to)
  });
  it("held, it keeps falling fast till it's let go", () => {
    const { p } = fallen(0);
    p.rush();
    for (let i = 0; i < 15; i++) p.tick(1 / 60);   // (a quarter of a second, held)
    expect(p.row).toBeGreaterThanOrEqual(5);
    const r = p.row;
    p.ease();
    p.tick(FALL.SECS * 0.9);
    expect(p.row).toBeLessThanOrEqual(r + 1);   // (at most the row it was partway to)
  });
  it('it stays steerable as it falls fast, and lands where it was steered', () => {
    const { s, p } = fallen(2);
    p.rush();
    p.tick(0.1);
    expect(p.slide(1)).toBe(true);
    expect(p.turnBy(1)).toBe(true);
    let res = null;
    for (let i = 0; i < 200 && !res; i++) res = p.tick(1 / 60);
    expect(res?.dropped).toBe(true);
    expect(s.grid[H - 2][SPAWN[0] + 1]?.c).toBe(0);
    expect(s.grid[H - 1][SPAWN[0] + 1]?.c).toBe(1);
  });
  it("a Space held on from the last pair doesn't rush the next one in", () => {
    const { p } = fallen(H - 2);
    p.rush();
    let res = null;
    for (let i = 0; i < 60 && !res; i++) res = p.tick(1 / 60);
    expect(res?.dropped).toBe(true);
    p.tick(FALL.SECS * 0.9);
    expect(p.row).toBe(0);
  });
});

describe("the drop is smooth, not a row at a time (11 Nov: \"could also be a lot smoother. That's noticeably jumpy\")", () => {
  it('it is drawn partway to the next row as it falls, Space held or not, and never past where it rests', () => {
    const p = new SailPair(game());
    p.tick(FALL.SECS * 0.5);
    expect(p.y()).toBeCloseTo(0.5, 5);
    p.rush();
    let last = p.y();
    for (let i = 0; i < 20; i++) {
      p.tick(1 / 120);
      expect(p.y()).toBeGreaterThanOrEqual(last);
      expect(p.y() - last).toBeLessThan(1);   // (glides: never a jump of a whole row in a frame)
      last = p.y();
    }
    const q = new SailPair(game([0, 1], [], [[H - 1, SPAWN[0], 2], [H - 1, SPAWN[1], 2]]));
    while (q.row < q.rest()) q.tick(FALL.SECS);
    q.tick(FALL.SECS * 0.5);
    expect(q.y()).toBe(q.row);   // (resting on something: drawn on its row, not sunk into it)
  });
});

describe('moves() and a pair of one colour (bug, 11 Nov)', () => {
  it('gives each place once, as turn 0 or 1, even one only reached turned 2 or 3', () => {
    const s = game([1, 1]);
    const ms = s.moves();
    expect(ms.every((m) => m.turn < 2)).toBe(true);
    expect(new Set(ms.map((m) => `${m.row},${m.col},${m.turn}`)).size).toBe(ms.length);
  });
});
