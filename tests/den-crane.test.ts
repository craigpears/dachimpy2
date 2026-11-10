/* The crane up the cliff from the hidden cove, and the clifftop lagoon (src/den-crane.ts). The user,
   9 Nov: "could I go somewhere to the side of a cliff and like construct a crane to get in?" */
import { describe, expect, it } from 'vitest';
import { CRANE, Crane, CraneFrame, LAGOON, TRIP, partCells, travel, type Ship } from '../src/den-crane';
import { LAY, SAIL, Sea } from '../src/den-sail';
import { carp } from './helpers';
import type { Cell } from '../src/engine';

const at = (cells: Cell[]): [number, number] => [Math.min(...cells.map((p) => p[0])), Math.min(...cells.map((p) => p[1]))];
const norm = (cells: Cell[]): Cell[] => { const [r0, c0] = at(cells); return cells.map(([r, c]): Cell => [r - r0, c - c0]); };
/** Fill a frame exactly, as the solver would. */
const fill = (f: CraneFrame) => { for (const p of carp.solve(f.open(), 1)[0]) expect(f.put(p.letter, norm(p.cells), ...at(p.cells))).toBe(true); };
const flatI: Cell[] = [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]];
/** Her, stopped at a square (or under way, or held up, or rowing). */
const ship = (c: number, r: number, o: Partial<{ idle: boolean; held: string | null; oars: boolean }> = {}): Ship =>
  ({ pose: { c, r }, idle: () => o.idle ?? true, held: () => o.held ?? null, oars: o.oars ?? false });
const [LC, LR] = CRANE.LEDGE;

describe('the ledge', () => {
  it('is in the hidden cove, open water she can get to through the lock', () => {
    const sea = new Sea(9);
    expect(sea.level(LC, LR)).toBe(1);
    expect(sea.open(LC, LR)).toBe(true);
    expect(sea.plot(SAIL.HOME, LC, LR, null, true)).not.toBeNull();
  });

  it('is at the foot of the cove\'s left-hand cliff, the side the lagoon lies', () => {
    expect(LC).toBe(LAY.COVE.c0);
    expect(LR).toBeGreaterThan(LAY.COVE.r0);
    expect(LR).toBeLessThan(LAY.COVE.r1);
    expect(LAGOON.WRECK[0]).toBeLessThan(0);   // off the board, past the cove's left-hand cliff
  });
});

describe('the crane\'s frames', () => {
  it('can each be filled exactly, about four pieces apiece', () => {
    CRANE.PARTS.forEach((_, i) => {
      const cells = partCells(i);
      expect(cells.length % 5).toBe(0);
      expect(cells.length / 5).toBeGreaterThanOrEqual(3);
      expect(cells.length / 5).toBeLessThanOrEqual(5);
      expect(carp.solve(cells, 1).length).toBe(1);
    });
  });

  it('have single squares jutting out, where the rare pieces go', () => {
    CRANE.PARTS.forEach((_, i) => {
      const cells = partCells(i), set = new Set(cells.map(([r, c]) => `${r},${c}`));
      const jut = cells.some(([r, c]) => [[-1, 0], [1, 0], [0, -1], [0, 1]].filter(([a, b]) => set.has(`${r + a},${c + b}`)).length === 1);
      expect(jut).toBe(true);
    });
  });

  it('are built foot, post and jib, in that order', () => {
    expect(CRANE.PARTS.map((p) => p.name)).toEqual(['foot', 'post', 'jib']);
  });
});

describe('a frame on the ledge', () => {
  it('takes a piece over at least one empty square, clear of the pieces in it', () => {
    const f = new CraneFrame(partCells(1));
    expect(f.fit(flatI, 1, 0)).toEqual({ r: 1, c: 0, over: 0 });
    expect(f.put('I', flatI, 1, 0)).toBe(true);
    expect(f.fit(flatI, 1, 0)).toBeNull();   // that's wood now
    expect(f.fit(flatI, 1, 3)).toBeNull();   // over the I
    expect(f.fit(flatI, -2, 0)).toBeNull();   // nothing of the frame under it
  });

  it('lets a piece stick out over its edge, as the den\'s frames do, but only so far', () => {
    const f = new CraneFrame(partCells(1));   // the post: 3 rows of 8
    expect(f.fit(flatI, 1, -2)).toEqual({ r: 1, c: -2, over: 2 });   // three in, two out over its end
    expect(f.fit(flatI, 1, 5)).toEqual({ r: 1, c: 5, over: 2 });
    expect(f.fit(flatI, 1, 6)).toBeNull();   // past the margin
    expect(f.fit(flatI, -1, 0)).toBeNull();   // all out
    const up: Cell[] = flatI.map(([r, c]): Cell => [c, r]);
    expect(f.fit(up, -2, 1)).toEqual({ r: -2, c: 1, over: 2 });
    expect(f.fit(up, -3, 1)).toBeNull();   // past the margin
  });

  it('is full when every square of it is filled; Shipshape when nothing sticks out', () => {
    const f = new CraneFrame(partCells(0));
    fill(f);
    expect(f.done()).toBe(true);
    expect(f.shipshape()).toBe(true);
    const g = new CraneFrame(partCells(1));
    g.put('I', flatI, 1, -2);
    expect(g.over()).toBe(2);
    expect(g.shipshape()).toBe(false);
  });

  it('gives the last piece back to try again, till it\'s full', () => {
    const f = new CraneFrame(partCells(1));
    f.put('I', flatI, 1, 0);
    expect(f.takeBack()?.letter).toBe('I');
    expect(f.open().length).toBe(20);
    fill(f);
    expect(f.takeBack()).toBeUndefined();
  });
});

describe('building the crane', () => {
  it('starts only alongside the ledge, stopped, with her oars shipped', () => {
    const k = new Crane();
    expect(k.alongside(ship(LC, LR))).toBe(true);
    expect(k.alongside(ship(LC + 1, LR))).toBe(false);
    expect(k.alongside(ship(LC, LR, { idle: false }))).toBe(false);
    expect(k.alongside(ship(LC, LR, { held: 'daze' }))).toBe(false);
    expect(k.alongside(ship(LC, LR, { oars: true }))).toBe(false);
  });

  it('goes up a part at a time, each frame full before it goes up, the next laid after it', () => {
    const k = new Crane();
    expect(k.raise()).toEqual([]);   // nothing on the ledge yet
    for (let i = 0; i < CRANE.PARTS.length; i++) {
      const f = k.build()!;
      expect(f.cells).toEqual(partCells(i));
      expect(k.raise()).toEqual([]);   // not full yet
      fill(f);
      const said = k.raise();
      expect(said[0]).toEqual({ kind: 'part', part: i, shipshape: true });
      expect(k.up).toBe(i + 1);
    }
    expect(k.built()).toBe(true);
    expect(k.building).toBe(false);
    expect(k.build()).toBeNull();
  });

  it('keeps a frame as you left it, to come back to', () => {
    const k = new Crane();
    const f = k.build()!;
    f.put('I', flatI, 1, 0);
    k.leave();
    expect(k.building).toBe(false);
    expect(k.build()).toBe(f);
    expect(f.laid.length).toBe(1);
  });

  it('says when a part had offcuts sawn off it', () => {
    const k = new Crane();
    k.build();
    // (a little frame of four in a row, for the sake of it: an I fills it, one square out over its end)
    const f = k.frame = new CraneFrame([[0, 0], [0, 1], [0, 2], [0, 3]]);
    f.put('I', flatI, 0, 0);
    expect(f.done()).toBe(true);
    expect(k.raise()[0]).toEqual({ kind: 'part', part: 0, shipshape: false });
  });
});

describe('her trip up the cliff and down again', () => {
  const built = () => {
    const k = new Crane();
    for (let i = 0; i < CRANE.PARTS.length; i++) { fill(k.build()!); k.raise(); }
    return k;
  };

  it('needs the crane built', () => {
    expect(new Crane().haul()).toBe(false);
    expect(built().haul()).toBe(true);
  });

  it('is a short moment: up, round and down into the lagoon, then back down to the cove', () => {
    expect(TRIP).toBeGreaterThan(6);
    expect(TRIP).toBeLessThan(12);
    const k = built();
    k.haul();
    expect(k.haul()).toBe(false);   // one at a time
    let said: unknown[] = [];
    for (let t = 0; t < TRIP + 0.1; t += 1 / 30) said = said.concat(k.tick(1 / 30));
    expect(said).toEqual([{ kind: 'arrive', where: 'lagoon' }]);
    expect(k.where).toBe('lagoon');
    expect(k.alongside(ship(LC, LR))).toBe(false);   // (she's up in the lagoon)
    k.haul();
    for (let t = 0; t < TRIP + 0.1; t += 1 / 30) k.tick(1 / 30);
    expect(k.where).toBe('cove');
    expect(k.alongside(ship(LC, LR))).toBe(true);
  });

  it('can be skipped: she\'s there at once', () => {
    const k = built();
    k.haul();
    k.tick(1);
    expect(k.skip()).toEqual([{ kind: 'arrive', where: 'lagoon' }]);
    expect(k.trip).toBeNull();
  });

  it('goes beat by beat: the winch, up, round, down, and you back aboard', () => {
    const B = CRANE.BEATS;
    expect(travel(0)).toEqual({ leap: 0, rise: 0, swing: 0, lower: 0, back: 0, done: false });
    const mid = travel(B.leap + B.rise + B.swing / 2);
    expect(mid.rise).toBe(1);
    expect(mid.swing).toBeCloseTo(0.5);
    expect(mid.lower).toBe(0);
    expect(travel(TRIP)).toEqual({ leap: 1, rise: 1, swing: 1, lower: 1, back: 1, done: true });
  });

  it('only in the lagoon is the wreck\'s treasure to be hauled up, and only till it\'s up', () => {
    const k = built();
    expect(k.canHaulWreck()).toBe(false);
    k.haul();
    expect(k.canHaulWreck()).toBe(false);   // on her way
    k.skip();
    expect(k.canHaulWreck()).toBe(true);
    k.salvage.done = true;
    expect(k.canHaulWreck()).toBe(false);
  });
});
