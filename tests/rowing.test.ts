/* Rowing: Bilge's board split into her port and starboard oars (TODO.md, "Rowing by port and
   starboard", 10 Nov), and two boards rowing a side each (the team way, 10 Nov). */
import { describe, expect, it } from 'vitest';
import { H, KINDS, W } from '../src/bilge';
import type { Bit } from '../src/bilge';
import { Oars, ROW, Rowing, isPort } from '../src/rowing';
import type { Side } from '../src/rowing';

/** New pieces come in as kinds 0, 1, 2 ... in turn, so they don't line up by chance. */
const cycle = () => { let i = 0; return () => ((i++ % KINDS) + 0.5) / KINDS; };

/** A rowing board drawn from the top, as in tests/bilge.test.ts: 0-6 a piece of that kind, C a
    crab. Rows not drawn are filled with a pattern that never lines up. */
function board(rows: string[], oars?: Oars, side?: Side): Rowing {
  const b = new Rowing({ random: cycle(), oars, side });
  let id = 1000;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const ch = rows[r]?.[c];
    const bit: Bit = ch === undefined ? { id: id++, k: (c + 3 * r + 5) % KINDS }
      : ch === 'C' ? { id: id++, k: -1, s: 'crab' } : { id: id++, k: Number(ch) };
    b.bilge.grid[r][c] = bit;
  }
  return b;
}

describe('the oars', () => {
  it('are the left three columns port and the right three starboard', () => {
    expect([0, 1, 2, 3, 4, 5].map(isPort)).toEqual([true, true, true, false, false, false]);
  });
  it('the water stays at its least, and a swap that clears nothing pulls nothing', () => {
    const b = board(['012345']);
    expect(b.bilge.water).toBe(3);
    const m = b.swap(0, 1, 0);
    expect(m.move.moved).toBe(true);
    expect([m.pull, m.steps, b.oars.tick(10)]).toEqual([{ port: 0, starboard: 0 }, [], []]);
  });
});

describe('even work goes straight', () => {
  it('a line each side at once is an Arrr!, shared evenly: a square straight ahead, at once', () => {
    // 0 0 1 0 1 1 -> 0 0 0 1 1 1, swapped across the middle: 0 0 0 on port, 1 1 1 on starboard.
    const b = board(['001011']);
    const m = b.swap(0, 2, 0);
    expect([m.move.combo, m.move.chain]).toEqual(['Arrr!', 0]);
    expect(m.pull).toEqual({ port: 1.5, starboard: 1.5 });
    expect(m.steps).toEqual(['F']);
    expect([b.oars.tick(10), b.oars.swing]).toEqual([[], 0]);
  });
  it('near enough even counts as straight', () => {
    const o = new Oars();
    expect(o.feed({ port: 3, starboard: 5 }, 0)).toEqual(['F', 'F']);
    o.tick(ROW.WINDOW);   // starboard's 2 over is within a quarter of the 8 rowed
    expect([o.swing, o.ahead]).toEqual([0, 2]);
    const p = new Oars();
    p.feed({ port: 1, starboard: 2 }, 0);
    p.tick(ROW.WINDOW);
    expect([p.swing, p.ahead]).toEqual([-1, 2]);
  });
});

describe('one-sided work turns her', () => {
  it('a three on the port oars swings her to starboard (right), as in a real boat', () => {
    // 0 0 1 0 3 4 -> 0 0 0 1 3 4: columns 0-2, port.
    const b = board(['001034']);
    expect(b.swap(0, 2, 0).pull).toEqual({ port: 1, starboard: 0 });
    b.oars.tick(ROW.WINDOW);
    expect([b.oars.swing, b.oars.ahead]).toEqual([1, 0]);
  });
  it('a three on the starboard oars swings her to port (left)', () => {
    const b = board(['430100']);   // -> 4 3 1 0 0 0: columns 3-5
    expect(b.swap(0, 2, 0).pull).toEqual({ port: 0, starboard: 1 });
    b.oars.tick(ROW.WINDOW);
    expect(b.oars.swing).toBe(-1);
  });
  it('three threes on port make a turn to starboard; three on starboard one to port', () => {
    const o = new Oars();
    for (const t of [0, 1, 2]) expect(board(['001034'], o).swap(0, 2, t).steps).toEqual([]);
    expect(o.tick(2 + ROW.WINDOW)).toEqual(['R']);
    const p = new Oars();
    for (const t of [0, 1, 2]) board(['430100'], p).swap(0, 2, t);
    expect(p.tick(2 + ROW.WINDOW)).toEqual(['L']);
  });
  it('the other side matching it in time drives her ahead instead', () => {
    const o = new Oars();
    o.row('port', 2, 0);
    expect(o.row('starboard', 2, ROW.WINDOW - 0.5)).toEqual(['F']);
    o.tick(20);
    expect([o.swing, o.ahead]).toEqual([0, 1]);
  });
  it('crabs pull on their own side', () => {
    // As in tests/bilge.test.ts: 6 6 6 lined up in column 0 go, and the crab under them floats up out of the water.
    const b = board([]);
    for (const r of [6, 7, 8]) b.bilge.grid[r][0] = { id: 50 + r, k: 6 };
    b.bilge.grid[9][0] = { id: 99, k: -1, s: 'crab' };
    b.bilge.grid[5][0] = { id: 49, k: 1 };
    const m = b.swap(0, 3, 0);
    expect(m.move.crabs).toBe(1);
    expect(m.pull.port).toBe(ROW.THREE + ROW.CRAB);
  });
});

describe('combos pull harder', () => {
  it('five in a line (Great) pulls twice a three', () => {
    const m = board(['120345', '405612', '603451', '304512', '506123']).swap(0, 1, 0);   // five 0s down column 1
    expect([m.move.combo, m.move.chain]).toEqual(['Great', 0]);
    expect(m.pull.port).toBe(2 * ROW.THREE);
  });
  it('the bigger the combo, the bigger the pull', () => {
    const worth = ['Good', 'Great', 'Arrr!', 'Har!', 'Yarrr!', 'Bingo!', 'Sea Donkey!', 'Vegas!'].map((n) => ROW.WORTH[n]);
    expect(worth.every((w, i) => w > (i ? worth[i - 1] : ROW.THREE))).toBe(true);
  });
});

describe('the pull builds up into whole squares', () => {
  it("nothing until a square's worth, then a square forward, with the rest kept", () => {
    const o = new Oars();
    expect(o.feed({ port: 0.5, starboard: 0.5 }, 0)).toEqual([]);
    expect(o.feed({ port: 0.5, starboard: 0.5 }, 1)).toEqual([]);
    expect(o.feed({ port: 1, starboard: 1 }, 2)).toEqual(['F']);
    expect(o.ahead).toBe(1);
  });
  it('an even Bingo! rows nearly three squares at once', () => {
    const o = new Oars();
    expect(o.feed({ port: 4, starboard: 4 }, 0)).toEqual(['F', 'F']);
    expect(o.ahead).toBe(2);
  });
  it('a lopsided stroke goes ahead with what matched, and turns her with the rest a moment later', () => {
    const o = new Oars();
    expect(o.feed({ port: 6, starboard: 1.5 }, 0)).toEqual(['F']);   // 3 matched
    expect(o.tick(ROW.WINDOW - 0.1)).toEqual([]);
    expect(o.tick(ROW.WINDOW)).toEqual(['R']);                       // 4.5 extra on port
    expect([o.swing, o.ahead]).toEqual([1.5, 0]);
  });
  it('reset loses what was built up and what was waiting', () => {
    const o = new Oars();
    o.feed({ port: 2, starboard: 0.5 }, 0);
    o.reset();
    expect([o.swing, o.ahead, o.tick(10)]).toEqual([0, 0, []]);
  });
});

describe('two boards, a side each (the team way)', () => {
  it('two boards in step go straight: an Arrr! each, close together, is two squares ahead', () => {
    const o = new Oars();
    const port = board(['001011'], o, 'port'), starboard = board(['001011'], o, 'starboard');
    expect(port.swap(0, 2, 0)).toMatchObject({ pull: { port: 3, starboard: 0 }, steps: [] });
    expect(starboard.swap(0, 2, 1)).toMatchObject({ pull: { port: 0, starboard: 3 }, steps: ['F', 'F'] });
    expect([o.tick(20), o.swing]).toEqual([[], 0]);
  });
  it('one board alone turns her', () => {
    const o = new Oars();
    board(['001011'], o, 'port').swap(0, 2, 0);
    expect(o.tick(ROW.WINDOW)).toEqual(['R']);
  });
  it('out of step, she rows in circles: one way, then the other, and no further ahead', () => {
    const o = new Oars();
    board(['001011'], o, 'port').swap(0, 2, 0);
    expect(o.tick(ROW.WINDOW)).toEqual(['R']);
    board(['001011'], o, 'starboard').swap(0, 2, 10);
    expect(o.tick(10 + ROW.WINDOW)).toEqual(['L']);
    expect(o.ahead).toBe(0);
  });
});

describe('a swap across the middle', () => {
  it('is allowed, and counts where the pieces were cleared, not where the swap was', () => {
    // The 0 comes over from column 3 onto two 0s below in column 2: a line down column 2, port.
    const m = board(['123045', '450612', '610234']).swap(0, 2, 0);
    expect([m.move.lines, m.move.chain]).toEqual([[3], 0]);
    expect(m.pull).toEqual({ port: 1, starboard: 0 });
  });
  it('a line across the middle is shared by its pieces: two on port, one on starboard', () => {
    const m = board(['010034']).swap(0, 0, 0);   // -> 1 0 0 0 3 4: columns 1-3
    expect(m.pull.port).toBeCloseTo(2 / 3);
    expect(m.pull.starboard).toBeCloseTo(1 / 3);
  });
});
