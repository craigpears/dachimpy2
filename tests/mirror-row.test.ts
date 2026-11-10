/* Mirror strokes, a test page's rules (TODO.md, "Test mirror strokes on a page of its own", 10 Nov):
   two Bilge boards, every swap made in mirror on the other. */
import { describe, expect, it } from 'vitest';
import { H, KINDS, W } from '../src/bilge';
import type { Bilge, Bit } from '../src/bilge';
import { NO_SPECIALS } from '../src/bilge';
import { ClockedOars, Course, KINDS_DEFAULT, KINDS_LEAST, MirrorRow, SplitRow, Stroke, copyBilge, fewer, mirrorCol, rowBilge, seeded } from '../src/mirror-row';
import { ROW } from '../src/rowing';

/** New pieces come in as kinds 0, 1, 2 ... in turn, so they don't line up by chance. */
const cycle = () => { let i = 0; return () => ((i++ % KINDS) + 0.5) / KINDS; };

/** Lay a board from the top, as in tests/rowing.test.ts: 0-6 a piece of that kind. Rows not drawn
    are a pattern that never lines up. */
function lay(b: Bilge, rows: string[], id = 1000): void {
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const ch = rows[r]?.[c];
    const bit: Bit = { id: id++, k: ch === undefined ? (c + 3 * r + 5) % KINDS : Number(ch) };
    b.grid[r][c] = bit;
  }
}

function mirror(port: string[], starboard: string[]): MirrorRow {
  const m = new MirrorRow({ randoms: [cycle(), cycle()], kinds: KINDS });
  lay(m.port, port, 1000); lay(m.starboard, starboard, 5000);
  return m;
}

describe('the mirror', () => {
  it('maps columns c, c + 1 on port to W - 2 - c, W - 1 - c on starboard', () => {
    expect([0, 1, 2, 3, 4].map(mirrorCol)).toEqual([4, 3, 2, 1, 0]);
    for (let c = 0; c < W - 1; c++) expect([mirrorCol(c), mirrorCol(c) + 1].sort()).toEqual([W - 1 - (c + 1), W - 1 - c].sort());
  });
  it('makes one move on both boards, at the mirrored spot', () => {
    const m = mirror(['012345'], ['012345']);
    m.swap(0, 0);
    expect(m.port.grid[0].map((b) => b!.k)).toEqual([1, 0, 2, 3, 4, 5]);
    expect(m.starboard.grid[0].map((b) => b!.k)).toEqual([0, 1, 2, 3, 5, 4]);
  });
  it('the boards are dealt on their own', () => {
    const m = new MirrorRow({ randoms: [seeded(1), seeded(2)] });
    expect(m.port.grid.flat().map((b) => b!.k)).not.toEqual(m.starboard.grid.flat().map((b) => b!.k));
    expect([m.port.water, m.starboard.water]).toEqual([ROW.WATER, ROW.WATER]);
  });
});

describe('matched clears go straight', () => {
  it('a three on each board at once is all forward pull', () => {
    // Port: swapping columns 0 and 1 of the top row lines up 1s in columns 1-3. Starboard: the
    // mirrored swap is columns 4 and 5, lining up 3s in columns 2-4.
    const m = mirror(['101145'], ['013343']);
    const res = m.swap(0, 0);
    expect(res.combos).toEqual(['', '']);
    expect(res.moves.map((x) => x.cleared)).toEqual([3, 3]);
    expect(res.pull).toEqual({ port: ROW.THREE, starboard: ROW.THREE });
    expect([m.stroke.ahead, m.stroke.swing]).toEqual([2 * ROW.THREE, 0]);
  });
  it('a Bingo on each board at once drives her a long way, no turning', () => {
    const s = new Stroke();
    const steps = s.row({ port: 8, starboard: 8 });
    expect(steps.filter((x) => x === 'F').length).toBe(5);
    expect(steps.includes('L') || steps.includes('R')).toBe(false);
  });
});

describe('one-sided clears turn her', () => {
  it('a clear on port alone turns her to starboard', () => {
    const m = mirror(['101145'], []);
    const res = m.swap(0, 0);
    expect(res.pull.port).toBeGreaterThan(0);
    expect(res.pull.starboard).toBe(0);
    expect(m.stroke.swing).toBeGreaterThan(0);
  });
  it('a clear on starboard alone turns her to port', () => {
    const m = mirror([], ['013343']);
    m.swap(0, 0);
    expect(m.stroke.swing).toBeLessThan(0);
  });
  it('three plain threes on port alone is a quarter turn to starboard', () => {
    const s = new Stroke();
    expect(s.row({ port: 3, starboard: 0 })).toEqual(['R']);
  });
  it('near enough even counts as straight', () => {
    expect(Stroke.split({ port: 4, starboard: 3 })).toEqual({ fwd: 7, turn: 0 });
    expect(Stroke.split({ port: 8, starboard: 1 })).toEqual({ fwd: 2, turn: 7 });
  });
  it('four turns the same way is a whole circle', () => {
    const c = new Course();
    for (let i = 0; i < 4; i++) c.go('R');
    expect([c.x, c.y, c.heading, c.circled]).toEqual([0, 0, 0, true]);
  });
});

describe('the two ways of pairing the sides', () => {
  it('move by move, port then starboard cancels out: nothing ahead, no turn', () => {
    const s = new Stroke();
    expect([...s.row({ port: 3, starboard: 0 }), ...s.row({ port: 0, starboard: 3 })]).toEqual(['R', 'L']);
  });
  it("as the den's oars do, the next move evens it up: straight ahead", () => {
    const s = new ClockedOars();
    expect([...s.row({ port: 3, starboard: 0 }), ...s.row({ port: 0, starboard: 3 })]).toEqual(['F', 'F']);
    expect(s.pending()).toBe(0);
  });
  it("as the den's oars do, unmatched pull turns her a move later", () => {
    const s = new ClockedOars();
    expect(s.row({ port: 3, starboard: 0 })).toEqual([]);
    expect(s.pending()).toBe(3);
    expect(s.row({ port: 0, starboard: 0 })).toEqual(['R']);
  });
  it('a copy of the oars goes its own way', () => {
    const s = new ClockedOars();
    s.row({ port: 3, starboard: 0 });
    const c = s.copy();
    c.row({ port: 0, starboard: 3 });
    expect([s.pending(), c.pending()]).toEqual([3, 0]);
  });
});

describe('the bots', () => {
  it('try a move on copies, leaving the boards as they were', () => {
    const m = mirror(['101145'], ['013343']);
    const before = m.boards.map((b) => b.snap());
    const t = m.tryMove(0, 0, seeded(3));
    expect(t.pull.port).toBeGreaterThan(0);
    expect(m.boards.map((b) => b.snap())).toEqual(before);
    const sp = new SplitRow({ randoms: [seeded(4)] });
    const was = sp.boards[0].snap();
    sp.tryMove(5, 2, seeded(5));
    expect(sp.boards[0].snap()).toEqual(was);
  });
  it('a copied board keeps its piece ids apart from the original', () => {
    const m = new MirrorRow({ randoms: [seeded(1), seeded(2)] });
    const c = copyBilge(m.port, seeded(9));
    for (let r = 0; r < H; r++) for (let col = 0; col < W - 1; col++) c.swap(r, col);
    const ids = new Set(m.port.grid.flat().map((b) => b!.id));
    const fresh = c.grid.flat().filter((b) => !ids.has(b!.id)).map((b) => b!.id);
    expect(Math.min(...fresh, Infinity)).toBeGreaterThan(Math.max(...ids));
  });
});

/* Fewer kinds of piece (the user, 10 Nov: "fewer kinds of piece, because that makes more of a risk
   for cascades and unintended effects"), an option on the page. */
describe('fewer kinds of piece', () => {
  const kindsOn = (b: Bilge) => new Set(b.grid.flat().filter((x) => x && !x.s).map((x) => x!.k));
  it('a board of four kinds is dealt only those four, all of them, with nothing lined up', () => {
    const b = rowBilge(seeded(7), NO_SPECIALS, 4);
    expect([...kindsOn(b)].sort()).toEqual([0, 1, 2, 3]);
    expect(b.lines()).toEqual([]);
  });
  it('new pieces coming in are of those kinds too', () => {
    const b = rowBilge(seeded(8), NO_SPECIALS, 4);
    for (let i = 0; i < 300; i++) b.swap(i % 12, i % 5);
    expect(Math.max(...kindsOn(b))).toBeLessThan(4);
  });
  it('seven is Bilge as it is; the number is kept to KINDS_LEAST to seven', () => {
    const r = seeded(1);
    expect(fewer(r, KINDS)).toBe(r);
    expect([...kindsOn(rowBilge(seeded(2), NO_SPECIALS, 2))].sort()).toEqual([0, 1, 2]);
    expect(Math.max(...kindsOn(rowBilge(seeded(3), NO_SPECIALS, 12)))).toBe(KINDS - 1);
    expect(KINDS_LEAST).toBe(3);
  });
  it('both boards and the split board take the option, and default to KINDS_DEFAULT', () => {
    expect(new MirrorRow().kinds).toBe(KINDS_DEFAULT);
    expect(new SplitRow().kinds).toBe(KINDS_DEFAULT);
    const m = new MirrorRow({ randoms: [seeded(1), seeded(2)], kinds: 3 });
    expect(m.boards.map((b) => Math.max(...kindsOn(b)))).toEqual([2, 2]);
    const s = new SplitRow({ randoms: [seeded(3)], kinds: 6 });
    expect(Math.max(...kindsOn(s.boards[0]))).toBe(5);
  });
  it("a bot's copies keep the boards' kinds", () => {
    const m = new MirrorRow({ randoms: [seeded(1), seeded(2)], kinds: 4 });
    const t = m.tryMove(11, 2, seeded(5));
    expect(t.copy.kinds).toBe(4);
    for (let i = 0; i < 100; i++) t.copy.swap(i % 12, i % 5);
    for (const b of t.copy.boards) expect(Math.max(...kindsOn(b))).toBeLessThan(4);
  });
  it('specials still come in at the odds asked for', () => {
    const b = rowBilge(seeded(9), { puffer: 0.2, crab: 0, jelly: 0.1 }, 4);
    const fresh = b as unknown as { fresh(): Bit };
    const n = 4000, got = Array.from({ length: n }, () => fresh.fresh());
    expect(got.filter((x) => x.s === 'puffer').length / n).toBeCloseTo(0.2, 1);
    expect(got.filter((x) => x.s === 'jelly').length / n).toBeCloseTo(0.1, 1);
    expect(Math.max(...got.filter((x) => !x.s).map((x) => x.k))).toBe(3);
  });
  it('fewer kinds, more cascades: the same moves clear more and chain more (10 Nov)', () => {
    const play = (kinds: number) => {
      let cleared = 0, chain = 0;
      for (let g = 0; g < 6; g++) {
        const b = rowBilge(seeded(100 + g), NO_SPECIALS, kinds), r = seeded(200 + g);
        for (let i = 0; i < 200; i++) { const m = b.swap(Math.floor(r() * 12), Math.floor(r() * 5)); cleared += m.cleared; chain += m.chain; }
      }
      return { cleared, chain };
    };
    const four = play(4), seven = play(7);
    expect(four.cleared).toBeGreaterThan(2 * seven.cleared);
    expect(four.chain).toBeGreaterThan(2 * seven.chain);
  });
});
