/* The Treasure Haul puzzle's rules, as YPPedia gives them ("Treasure Haul", "Official:Treasure Haul"
   and "Vampirate expedition", read 9 Nov 2026). */
import { describe, expect, it } from 'vitest';
import { H, Haul, KINDS, MAX_CHESTS, W, points, rating } from '../src/treasure-haul';
import type { Bit, Odds } from '../src/treasure-haul';

/** New pieces come in as coins 0, 1, 2, 3 in turn, so they don't line up by chance. */
const cycle = () => { let i = 0; return () => ((i++ % KINDS) + 0.5) / KINDS; };

/** A board drawn from the top: 0-3 a coin of that kind, R a ruby, E an emerald, C a chest (drawn
    two by two), '.' nothing. Rows not drawn are a pattern that never lines up. */
function board(rows: string[], odds?: Odds): Haul {
  const b = new Haul(cycle(), odds);
  let id = 1000;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const ch = rows[r]?.[c];
    if (ch === 'C') {
      if (b.grid[r][c]?.s === 'chest') continue;   // part of a chest already laid
      const chest: Bit = { id: id++, k: -1, s: 'chest' };
      for (const [rr, cc] of [[r, c], [r, c + 1], [r + 1, c], [r + 1, c + 1]]) b.grid[rr][cc] = chest;
      continue;
    }
    b.grid[r][c] = ch === undefined ? { id: id++, k: (c + 2 * r) % KINDS }
      : ch === '.' ? null
      : ch === 'R' ? { id: id++, k: -1, s: 'ruby' }
      : ch === 'E' ? { id: id++, k: -1, s: 'emerald' }
      : { id: id++, k: Number(ch) };
  }
  return b;
}
const row = (b: Haul, r: number) => b.grid[r].map((x) => (!x ? '.' : x.s ? x.s[0].toUpperCase() : String(x.k))).join('');
const ids = (b: Haul, cells: [number, number][]) => cells.map(([r, c]) => b.grid[r][c]!.id);
const RUBY_AT_3_3 = ['01230123', '23012301', '01230123', '230R2301'];
const EMERALD_AT_3_3 = ['01230123', '23012301', '01230123', '230E2301'];

describe('the board', () => {
  it('is 8 by 8, four kinds of coin, and starts with nothing lined up', () => {
    const b = new Haul();
    expect([b.grid.length, W, H, KINDS]).toEqual([8, 8, 8, 4]);
    expect(b.grid.every((r) => r.length === 8)).toBe(true);
    expect(b.grid.flat().every((x) => x && x.k >= 0 && x.k < 4 && !x.s)).toBe(true);
    expect(b.lines()).toEqual([]);
  });
});

describe('swapping', () => {
  it('swaps two coins one above the other, even when that clears nothing (it is still a move)', () => {
    const b = board([]);
    const m = b.swap(0, 0);
    expect([m.moved, m.coins]).toEqual([true, 0]);
    expect(row(b, 0)).toBe('21230123');
    expect(row(b, 1)).toBe('03012301');
  });
  it('only swaps up and down: the cursor needs a square below it on the board', () => {
    const b = board([]);
    expect(b.swap(H - 1, 0).moved).toBe(false);
    expect(b.swap(0, W).moved).toBe(false);
    expect(b.swap(-1, 0).moved).toBe(false);
  });
  it('hauls three in a row; what was below rises and new coins come in at the bottom', () => {
    const b = board(['00213021', '12031203']);
    const below = [b.grid[1][0]!.id, b.grid[1][1]!.id, b.grid[0][2]!.id];   // the 2 goes down a row
    const m = b.swap(0, 2);   // 0 0 0 across the top
    expect(m.lines).toEqual([3]);
    expect(m.coins).toBe(3);
    expect(m.stages[1].cleared.length).toBe(3);
    expect(ids(b, [[0, 0], [0, 1], [0, 2]])).toEqual(below);
    expect(b.grid[H - 1].slice(0, 3).every((x) => x!.id < 1000)).toBe(true);
    expect(b.grid[H - 1].slice(3).every((x) => x!.id >= 1000)).toBe(true);
  });
  it('hauls a column of three as well as a row', () => {
    const m = board(['01230123', '13012301', '01230123', '03012301', '21230123']).swap(0, 0);
    expect(m.lines).toEqual([3]);
  });
  it('counts what lines up once the coins have risen as a chain', () => {
    // 0 0 0 clears; the 3 that came up beside the top row's 3 makes 3 3 3: a chain.
    const b = board(['00331201', '23010213']);
    const three = b.grid[0][3]!.id;
    const m = b.swap(0, 2);
    expect(m.chain).toBeGreaterThanOrEqual(1);
    expect(m.stages[2].cleared).toContain(three);
  });
});

describe('the gems', () => {
  it('a ruby under the cursor clears its whole row and column, and nothing is swapped', () => {
    const b = board(RUBY_AT_3_3);
    const m = b.swap(3, 3);
    expect([m.moved, m.gems, m.lines]).toEqual([true, 1, []]);
    expect(m.stages[0].cleared.length).toBe(15);   // 7 across, 7 down, and the ruby
    expect(m.stages[0].chests).toEqual([]);
  });
  it('a ruby goes off from the lower square of the cursor too', () => {
    const m = board(RUBY_AT_3_3).swap(2, 3);
    expect([m.gems, m.stages[0].cleared.length]).toEqual([1, 15]);
  });
  it('an emerald clears both its diagonals, and not the coin beside it under the cursor', () => {
    const b = board(EMERALD_AT_3_3);
    const beside = b.grid[4][3]!.id;
    const m = b.swap(3, 3);
    expect(m.gems).toBe(1);
    expect(m.stages[0].cleared.length).toBe(14);   // 7 one way, 6 the other, and the emerald
    expect(m.stages[0].cleared).not.toContain(beside);
  });
  it('a gem in another gem\'s path goes off too', () => {
    const m = board(['01230123', '23012301', '01230123', '230R23E1']).swap(3, 3);
    expect(m.gems).toBe(2);
    expect(m.stages[0].cleared.length).toBe(22);   // the ruby's 15 and the emerald's 7 more
  });
  it('a gem doesn\'t clear a chest, and clears on past it', () => {
    const b = board(['01230123', '23012301', '01230CC3', '2R012CC1']);
    const beyond = b.grid[3][7]!.id;
    const m = b.swap(3, 1);
    expect(m.stages[0].cleared.length).toBe(13);   // row 3 but the chest (5 and the ruby), column 1 (7)
    expect(m.stages[0].cleared).toContain(beyond);
    expect(b.chestList().length).toBe(1);
  });
});

describe('the chests', () => {
  it('a chest can\'t be moved', () => {
    const b = board(['01230123', '23012301', '01230CC3', '23012CC1']);
    expect(b.swap(1, 5).moved).toBe(false);
    expect(b.swap(2, 6).moved).toBe(false);
    expect(b.swap(3, 5).moved).toBe(false);
  });
  it('rises with the coins when both squares above it clear', () => {
    const b = board(['00213021', '12031203', '01230123', '23012301', 'CC230123', 'CC012301']);
    b.swap(0, 2);   // 0 0 0 across the top, over both its columns
    expect(b.chestList().map(({ r, c }) => [r, c])).toEqual([[3, 0]]);
  });
  it('when only one side above it clears, the gap stays and the chest waits', () => {
    const b = board(['30021302', '21203120', '01230123', '23012301', 'CC230123', 'CC012301']);
    const m = b.swap(0, 3);   // 0 0 0 across the top, over its second column but not its first
    expect(m.lines).toEqual([3]);
    expect(b.chestList().map(({ r, c }) => [r, c])).toEqual([[4, 0]]);
    expect(b.grid[3][1]).toBe(null);
    expect(b.grid[3][0]).not.toBe(null);
  });
  it('is hauled when it reaches the top row', () => {
    const b = board(['00213021', 'CC031203', 'CC230123']);
    const chest = b.grid[1][0]!.id;
    const m = b.swap(0, 2);
    expect(m.chests).toBe(1);
    expect(m.stages.flatMap((s) => s.chests)).toEqual([chest]);
    expect(b.chests).toBe(1);
    expect(b.chestList()).toEqual([]);
    expect(b.grid.flat().every((x) => x)).toBe(true);
  });
  it('comes up from the bottom, now and then, in two columns that were cleared', () => {
    const b = board(['00123012', '11030123'], { ruby: 0, emerald: 0, chest: 1 });
    b.chestsLeft = 1;
    b.swap(0, 2);   // two lines: columns 0 to 2 each take two new pieces
    const chests = b.chestList();
    expect(chests.length).toBe(1);
    expect(chests[0].r).toBe(H - 2);
    expect(chests[0].c).toBeLessThanOrEqual(1);
    expect(b.chestsLeft).toBe(0);
  });
  it('never more than two at once, and none once there are none left down there', () => {
    const two = board(['00123012', '11030123', '01230123', '23012301', '0123CCCC', '2301CCCC'], { ruby: 0, emerald: 0, chest: 1 });
    two.swap(0, 2);
    expect(two.chestList().length).toBe(MAX_CHESTS);
    const none = board(['00123012', '11030123'], { ruby: 0, emerald: 0, chest: 1 });
    none.chestsLeft = 0;
    none.swap(0, 2);
    expect(none.chestList()).toEqual([]);
  });
});

describe('a long haul', () => {
  it('after every move: nothing left lined up, chests whole, and a gap only above a stuck chest', () => {
    let a = 12345;
    const rnd = () => (a = (a * 16807) % 2147483647) / 2147483647;
    const b = new Haul(rnd, { ruby: 0.03, emerald: 0.03, chest: 0.3 });
    for (let i = 0; i < 2000; i++) {
      b.swap(Math.floor(rnd() * (H - 1)), Math.floor(rnd() * W));
      expect(b.lines()).toEqual([]);
      const chests = b.chestList();
      expect(chests.length).toBeLessThanOrEqual(MAX_CHESTS);
      for (const { bit, r, c } of chests) expect([b.grid[r][c + 1], b.grid[r + 1][c], b.grid[r + 1][c + 1]]).toEqual([bit, bit, bit]);
      for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
        if (b.grid[r][c]) continue;
        let below = r + 1;
        while (below < H && !b.grid[below][c]) below++;
        expect(b.grid[below]?.[c]?.s).toBe('chest');
      }
    }
    expect(b.chests).toBeGreaterThan(0);
  });
});

describe('scoring and the end of a haul', () => {
  it('a three is worth three', () => {
    const b = board(['00213021', '12031203']);
    const m = b.swap(0, 2);
    expect([m.points, b.score, b.coins]).toEqual([3, 3, 3]);
  });
  it('combinations score more: two lines from one swap count twice', () => {
    const m = board(['00123012', '11030123']).swap(0, 2);   // 0 0 0 and 1 1 1 at once
    expect(m.lines).toEqual([3, 3]);
    expect([m.coins, m.chain, m.points]).toEqual([6, 0, 12]);
  });
  it('each link of a chain counts one more than the last', () => {
    expect([points(3, 0, 1), points(3, 1, 1), points(4, 2, 1), points(3, 0, 3)]).toEqual([3, 6, 12, 9]);
  });
  it('is over when the hoard is all hauled up, and then nothing moves', () => {
    const b = board(['00213021', '12031203']);
    b.hoard = 2;
    b.swap(0, 2);
    expect([b.coins, b.hoard, b.over]).toEqual([2, 0, true]);
    expect(b.swap(1, 1).moved).toBe(false);
  });
  it('isn\'t over while a chest is still on the board', () => {
    const b = board(['00213021', '12031203', '01230123', '23012301', 'CC230123', 'CC012301'], { ruby: 0, emerald: 0, chest: 0.1 });
    b.hoard = 1;
    b.chestsLeft = 0;
    b.swap(0, 2);
    expect(b.over).toBe(false);
  });
  it('rates a session by chests hauled, as the Vampirate lairs do', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 12].map(rating)).toEqual(
      ['Asleep', 'Asleep', 'Lethargic', 'Steady', 'Steady', 'Brisk', 'Swift', 'Swift', 'Frenetic', 'Frenetic']);
  });
});
