import { describe, expect, it } from 'vitest';
import { Navigation, DEN, RINGS, denPoints, linesOf, type Mark } from '../src/navigation';
import { seeded } from '../src/mirror-row';

// A wolf den's Duty Navigation (14 Nov: "the 4-tier duty nav in the werewolf den", the tutorial asked for by
// Dignity; IDEAS.md, from the Wolf Dens Guide and Multibella's telling of the wilds).
const [Y, R, O, W, B] = [0, 1, 2, 3, 4];
const _ = null;
/** A den board laid ring by ring (8 places a ring, 0 the innermost). */
function den(rings: (number | null)[][], marks: Mark[]): Navigation {
  const g = new Navigation(seeded(1), { den: true });
  g.lay(rings, marks);
  return g;
}

describe('a wolf den\'s board: "four-tier" (14 Nov)', () => {
  it('has four rings, the fourth with no places of a constellation\'s; a plain board keeps its three', () => {
    const g = new Navigation(seeded(3), { den: true });
    expect(g.rings).toBe(DEN.RINGS);
    expect(g.grid.length).toBe(4);
    expect(new Navigation(seeded(3)).grid.length).toBe(RINGS);
    for (let i = 0; i < 30; i++) {
      g.deal();
      expect(g.constellation!.marks.every((m) => m.ring < 3)).toBe(true);
    }
  });

  it('deals the guide\'s constellations: a fresh board\'s first 3 in the centre and 1 in the middle (71), then 3, 2 and 1 (125)', () => {
    expect(denPoints([{ ring: 0, spoke: 0 }, { ring: 0, spoke: 1 }, { ring: 0, spoke: 2 }, { ring: 1, spoke: 0 }])).toBe(71);
    expect(denPoints([0, 1, 2].map((s) => ({ ring: 0, spoke: s })).concat([{ ring: 1, spoke: 0 }, { ring: 1, spoke: 1 }, { ring: 2, spoke: 0 }]))).toBe(125);
    expect(denPoints([0, 1, 2, 3].map((s) => ({ ring: 0, spoke: s })).concat([{ ring: 1, spoke: 0 }, { ring: 1, spoke: 1 }, { ring: 2, spoke: 0 }]))).toBe(173);
    const g = new Navigation(seeded(5), { den: true }), per = (ring: number) => g.constellation!.marks.filter((m) => m.ring === ring).length;
    expect([per(0), per(1), per(2)]).toEqual([3, 1, 0]);
    g.completed = 1;
    g.deal();
    expect([per(0), per(1), per(2)]).toEqual([3, 2, 1]);
  });

  it('a line along a spoke is three of a colour in a row out from the centre, of four rings', () => {
    const grid = Array.from({ length: 4 }, () => Array(8).fill(null));
    grid[0][2] = { id: 1, c: W }; grid[1][2] = { id: 2, c: R }; grid[2][2] = { id: 3, c: R }; grid[3][2] = { id: 4, c: R };
    expect(linesOf(grid)).toEqual([[{ ring: 1, spoke: 2 }, { ring: 2, spoke: 2 }, { ring: 3, spoke: 2 }]]);
  });

  it('booches on a star in the fourth ring', () => {
    const g = den([[R], [B], [W], [O]], [{ ring: 0, spoke: 4, colour: Y }]);
    g.next = { id: 99, c: Y, spoke: 0 };
    expect(g.drop().booched).toBe(true);
  });
});

describe('the den\'s wilds and chains (14 Nov, Multibella: "a constellation charted as part of a combo makes the next constellation\'s centre ring wholly wild")', () => {
  // The run in the screenshots: "Single! +3", "Double! +6", "Triple! Constellation! +213". A red dropped makes a
  // line round the third ring (Single); an orange falls onto two below it, a line down its spoke (Double), beside the
  // constellation's place holding a blue, the wrong colour; that clear in a combo turns the place wild, the blue in it
  // counts, and the constellation's charted on the third step.
  const run = () => den([
    [_, _, W, O, B],
    [_, _, B, O, W],
    [_, _, R, R],
    [_, _, _, O],
  ], [{ ring: 0, spoke: 4, colour: Y }]);

  it('scores each step times its place in the cascade, the chart the third: Single +3, Double +6, the constellation times 3', () => {
    const g = run();
    g.next = { id: 99, c: R, spoke: 4 };
    const m = g.drop();
    expect(m.stages.filter((s) => s.kind === 'line').map((s) => s.cleared.length)).toEqual([3, 3]);
    expect(m.done?.step).toBe(3);
    expect(m.done?.points).toBe(denPoints(m.done!.marks) * 3);
    expect(m.points).toBe(3 + 6 + denPoints(m.done!.marks) * 3);
  });

  it('a clear in a combo turns wild the constellation\'s place beside it, and any star there counts', () => {
    const g = run();
    g.next = { id: 99, c: R, spoke: 4 };
    const m = g.drop();
    const lines = m.stages.filter((s) => s.kind === 'line');
    expect(lines[0].wilded).toBeUndefined();
    expect(lines[1].wilded).toEqual([{ ring: 0, spoke: 4, colour: Y, wild: true }]);
  });

  it('charted in a chain of two clears, the next is dealt with four wild places in its centre ring', () => {
    const g = run();
    g.next = { id: 99, c: R, spoke: 4 };
    g.drop();
    const centre = g.constellation!.marks.filter((m) => m.ring === 0);
    expect(centre.length).toBe(DEN.WILD_MORE);
    expect(centre.every((m) => m.wild)).toBe(true);
    expect(g.constellation!.marks.filter((m) => m.ring > 0).some((m) => m.wild)).toBe(false);
  });

  // A Trapdoor (the guide's name): a clear, then the chart. Turning the third ring a place puts a red over two reds
  // down spoke 0; they go, and the yellow parked in the fourth ring above them falls into the constellation's place.
  const trapdoor = () => den([
    [R, W, _, _, _, _, _, O],
    [R, B, _, _, _, _, _, B],
    [W, R],
    [Y],
  ], [{ ring: 0, spoke: 0, colour: Y }]);

  it('a Trapdoor: a clear then the chart, its points doubled, and the next constellation\'s centre all wild', () => {
    const g = trapdoor();
    const m = g.turn(-1, 2);
    expect(m.done?.step).toBe(2);
    expect(m.done?.points).toBe(denPoints(m.done!.marks) * 2);
    const centre = g.constellation!.marks.filter((x) => x.ring === 0);
    expect(centre.length).toBe(3);
    expect(centre.every((x) => x.wild)).toBe(true);
  });

  it('a plain chart deals the next plain (and the run of wilds is broken)', () => {
    // (the centre ring turned a place, its yellow onto the constellation's place, nothing cleared; the last chart
    // was in a chain)
    const g = den([[R, Y, W, _, _, _, _, O]], [{ ring: 0, spoke: 0, colour: Y }]);
    g.wildNext = 1;
    const m = g.turn(-1, 0);
    expect(m.done?.step).toBe(1);
    expect(m.lines).toBe(0);
    expect(g.constellation!.marks.some((x) => x.wild)).toBe(false);
    expect(g.wildNext).toBe(0);
  });

  it('a plain board\'s Navigation is as it was: no wilds, its points by par', () => {
    const g = new Navigation(seeded(2));
    g.lay([[R, Y, W, _, _, _, _, O]], [{ ring: 0, spoke: 0, colour: Y }]);
    const m = g.turn(-1, 0);
    expect(m.done?.points).toBe(10);
    expect(g.constellation!.marks.some((x) => x.wild)).toBe(false);
  });
});
