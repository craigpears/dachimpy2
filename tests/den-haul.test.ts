/* Hauling up a chest by Treasure Haul (src/den-haul.ts). */
import { describe, expect, it } from 'vitest';
import { HAUL, Salvage, aboard, chestBoard, payout } from '../src/den-haul';
import { H, W } from '../src/treasure-haul';
import { Helm, Sea } from '../src/den-sail';

const clearSea = () => { const s = new Sea(1, false); s.rocks.clear(); return s; };
const at = (sea: Sea, c: number, r: number) => new Helm(sea, { c, r, d: 0 });

// Play the board out, a swap at a time, till it's over (the first swap that makes a line, or sets
// off a gem; else any).
function haulOut(s: Salvage, most = 3000) {
  const b = s.open();
  for (let n = 0; n < most && !b.over; n++) {
    let pick: [number, number] | null = null;
    for (let r = 0; r < H - 1 && !pick; r++) for (let c = 0; c < W && !pick; c++) {
      const a = b.grid[r][c], d = b.grid[r + 1][c];
      if (!a || !d || a.s === 'chest' || d.s === 'chest') continue;
      if (a.s || d.s) { pick = [r, c]; break; }
      b.grid[r][c] = d; b.grid[r + 1][c] = a;
      const lined = b.lines().length > 0;
      b.grid[r][c] = a; b.grid[r + 1][c] = d;
      if (lined) pick = [r, c];
    }
    b.swap(...(pick ?? [n % (H - 1), (n * 3) % W]));
  }
  return b;
}

describe('the board you haul on', () => {
  it('has the chest at its foot, in the middle, and the coins it spilled to bring up', () => {
    const b = chestBoard();
    const ch = b.chestList();
    expect(ch.length).toBe(1);
    expect([ch[0].r, ch[0].c]).toEqual([H - 2, W / 2 - 1]);
    expect(b.hoard).toBe(HAUL.HOARD);
    expect(b.over).toBe(false);
  });

  it('brings up no more chests than the one you are hauling', () => {
    const b = chestBoard();
    expect(b.chestsLeft).toBe(0);
    expect(HAUL.ODDS.chest).toBe(0);
  });

  it('is over once the chest and its coins are all up', () => {
    const s = new Salvage([3, 3]);
    const b = haulOut(s);
    expect(b.over).toBe(true);
    expect(b.chests).toBe(1);
    expect(b.coins).toBe(HAUL.HOARD);
  });
});

describe('what it pays', () => {
  it('pays BASE, and more the better the haul, up to MAX', () => {
    expect(payout(0)).toBe(HAUL.BASE);
    expect(payout(HAUL.PER * 10)).toBe(HAUL.BASE + 10);
    expect(payout(1e6)).toBe(HAUL.MAX);
    expect(payout(-5)).toBe(HAUL.BASE);
  });

  it('says so in the den\'s voice', () => {
    expect(aboard(31)).toBe('The chest\'s aboard! 31 doubloons');
  });

  it('pays once, when the haul is over, and then it is aboard', () => {
    const s = new Salvage([3, 3]);
    expect(s.finish()).toBeNull();   // nothing hauled yet
    const b = haulOut(s);
    const paid = s.finish();
    expect(paid).toBe(payout(b.score));
    expect(s.done).toBe(true);
    expect(s.finish()).toBeNull();
    expect(() => s.open()).toThrow();
  });
});

describe('starting a haul: you choose your puzzles (9 Nov)', () => {
  it('sailing over the chest wins nothing: she has to stop there, and you start the haul', () => {
    const sea = clearSea(), s = new Salvage([6, 6]), h = at(sea, 6, 4);
    h.put('F'); h.put('F');
    for (let i = 0; i < 400 && h.slot < 0; i++) h.tick(0.05);   // under way, onto the chest's square
    expect(h.slot).toBeGreaterThanOrEqual(0);
    expect(s.canStart(h)).toBe(false);
    for (let i = 0; i < 2000 && !h.idle(); i++) h.tick(0.05);
    expect([h.pose.c, h.pose.r]).toEqual([6, 6]);
    expect(s.canStart(h)).toBe(true);
    expect(s.board).toBeNull();   // nothing's started till you ask
    expect(s.done).toBe(false);
  });

  it('can be started on the chest or beside it, not from further off', () => {
    const sea = clearSea(), s = new Salvage([6, 6]);
    expect(s.canStart(at(sea, 6, 6))).toBe(true);
    expect(s.canStart(at(sea, 7, 7))).toBe(true);
    expect(s.canStart(at(sea, 5, 6))).toBe(true);
    expect(s.canStart(at(sea, 8, 6))).toBe(false);
    expect(s.canStart(at(sea, 6, 3))).toBe(false);
  });

  it('not while she is dazed', () => {
    const sea = clearSea(), s = new Salvage([6, 6]), h = at(sea, 6, 6);
    h.hit();
    expect(s.canStart(h)).toBe(false);
  });

  it('not once it is aboard', () => {
    const sea = clearSea(), s = new Salvage([6, 6]);
    haulOut(s);
    s.finish();
    expect(s.canStart(at(sea, 6, 6))).toBe(false);
  });
});

describe('Esc out of a haul: the chest stays', () => {
  it('keeps the chest where it is, and the board as you left it, to come back to', () => {
    const s = new Salvage([6, 6]);
    const b = s.open();
    b.swap(0, 0);
    const score = b.score, hoard = b.hoard;
    // (Esc: the den just stops showing the board.)
    expect(s.done).toBe(false);
    expect(s.at).toEqual([6, 6]);
    const again = s.open();
    expect(again).toBe(b);
    expect([again.score, again.hoard]).toEqual([score, hoard]);
  });
});
