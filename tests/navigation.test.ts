/* Duty Navigation's rules, as YPPedia gives them ("Navigation", read 11 Nov 2026), and what was made
   up where it doesn't say (src/navigation.ts). */
import { describe, expect, it } from 'vitest';
import { BOOCH_PENALTY, COLOURS, COLOUR_NAMES, FIRST_GO, Navigation, PAR, RINGS, SCORE, SIZES, SPOKES, bottomRow, linesOf, needsCombo, parFor, pointsFor, ratingFor } from '../src/navigation';
import type { Mark } from '../src/navigation';
import { seeded } from '../src/mirror-row';

const Y = 0, R = 1, O = 2, Wh = 3, B = 4;
/** A board from three strings, the inner ring first, a place a spoke from up clockwise: '.' empty, or
    a colour's letter (Y R O W B). */
const ring = (s: string) => [...s].map((ch) => 'YROWB'.indexOf(ch));
const draw = (g: Navigation) => g.grid.map((r) => r.map((x) => (x ? 'YROWB'[x.c] : '.')).join(''));
/** A game with the board laid as given, the constellation's marks, and the next star. */
function game(rings: string[], marks: Mark[] = [{ ring: 2, spoke: 4, colour: B }], next?: { c: number; spoke: number }): Navigation {
  const g = new Navigation(seeded(1));
  g.lay(rings.map(ring), marks);
  if (next) g.next = { ...g.next, ...next };
  return g;
}

describe('the board (11 Nov)', () => {
  it('is three rings of eight places, stars of five colours, the next star waiting outside on a spoke', () => {
    expect([RINGS, SPOKES, COLOURS]).toEqual([3, 8, 5]);
    expect(COLOUR_NAMES).toEqual(['yellow', 'red', 'orange', 'white', 'blue']);
    const g = new Navigation(seeded(2));
    expect(g.grid.length).toBe(3);
    expect(g.grid.every((r) => r.length === 8 && r.every((x) => x === null))).toBe(true);
    expect(g.next.c).toBeGreaterThanOrEqual(0);
    expect(g.next.c).toBeLessThan(5);
    expect(g.next.spoke).toBeGreaterThanOrEqual(0);
    expect(g.next.spoke).toBeLessThan(8);
    expect(g.constellation).not.toBeNull();
  });
  it('is the same game from the same seed', () => {
    const play = () => { const g = new Navigation(seeded(9)); for (let i = 0; i < 30; i++) (i % 3 ? g.drop() : g.turn(i % 2 ? 1 : -1)); return [draw(g), g.score, g.constellation]; };
    expect(play()).toEqual(play());
  });
});

describe('the keys (11 Nov)', () => {
  it('Up moves to the higher ring (outward) and Down to the lower, stopping at the ends, and isn\'t a move', () => {
    const g = new Navigation(seeded(1));
    expect(g.ring).toBe(2);
    expect(g.select(1)).toBe(false);
    expect(g.select(-1)).toBe(true);
    expect(g.select(-1)).toBe(true);
    expect(g.ring).toBe(0);
    expect(g.select(-1)).toBe(false);
    expect(g.moves).toBe(0);
  });
  it('Right turns the ring selected clockwise with its stars, Left anticlockwise; the other rings stay', () => {
    const g = game(['YROWBYRO', 'BO......', 'W.......']);
    g.ring = 0;
    g.turn(1);
    expect(draw(g)).toEqual(['OYROWBYR', 'BO......', 'W.......']);
    g.turn(-1);
    g.turn(-1);
    expect(draw(g)).toEqual(['ROWBYROY', 'BO......', 'W.......']);
    expect(g.moves).toBe(3);
  });
  it('Space drops the next star down its spoke to the innermost empty place', () => {
    const g = game(['..Y.....', '..R.....', '........'], undefined, { c: B, spoke: 2 });
    const e = g.drop();
    expect(e.moved).toBe(true);
    expect(draw(g)[2]).toBe('..B.....');
    g.next = { ...g.next, c: O, spoke: 5 };
    g.drop();
    expect(draw(g)[0]).toBe('..Y..O..');
    expect(g.moves).toBe(2);
  });
});

describe('falling (11 Nov)', () => {
  it('a star with nothing under it falls toward the middle when its ring turns over a gap, and what was over it follows', () => {
    const g = game(['Y.......', 'RB......', 'O.......']);
    g.ring = 1;
    g.turn(1);
    expect(draw(g)).toEqual(['YRB.....', 'O.......', '........']);
  });
  it('turning the inner ring out from under a star lets it fall into the gap', () => {
    const g = game(['Y.......', 'R.......', '........']);
    g.ring = 0;
    g.turn(1);
    expect(draw(g)).toEqual(['RY......', '........', '........']);
  });
});

describe('lines (11 Nov)', () => {
  it('three of a colour straight out from the centre (a spoke) vanish', () => {
    expect(linesOf(['....Y...', '....Y...', '....Y...'].map(ring).map((r) => r.map((c) => (c >= 0 ? { id: 1, c } : null))))).toHaveLength(1);
    const g = game(['....Y...', '....Y...', '........'], undefined, { c: Y, spoke: 4 });
    const e = g.drop();
    expect(e.lines).toBe(1);
    expect(e.cleared).toBe(3);
    expect(draw(g)).toEqual(['........', '........', '........']);
  });
  it('three or more of a colour in a row round a ring vanish, round its join too; two don\'t', () => {
    const lay = (s: string[]) => s.map(ring).map((r) => r.map((c) => (c >= 0 ? { id: 1, c } : null)));
    expect(linesOf(lay(['YYY.....', '........', '........']))).toEqual([[{ ring: 0, spoke: 0 }, { ring: 0, spoke: 1 }, { ring: 0, spoke: 2 }]]);
    expect(linesOf(lay(['Y.....YY', '........', '........']))[0].map((p) => p.spoke)).toEqual([6, 7, 0]);
    expect(linesOf(lay(['YY.YY.RR', '........', '........']))).toEqual([]);
    expect(linesOf(lay(['........', 'RRRRR...', '........']))[0]).toHaveLength(5);
    expect(linesOf(lay(['BBBBBBBB', '........', '........']))[0]).toHaveLength(8);
  });
  it('what falls into the gap can line up again (a cascade), each step scoring more, a little', () => {
    // The yellows go round the inner ring; the R over them falls in beside the other two: two steps.
    const g = game(['...RRYY.', '.....R..', '........'], undefined, { c: Y, spoke: 7 });
    const e = g.drop();
    expect(e.steps).toBe(2);
    expect(e.lines).toBe(2);
    expect(e.points).toBe(3 * 1 + 3 * 2);
    expect(draw(g)).toEqual(['........', '........', '........']);
  });
});

describe('constellations (11 Nov)', () => {
  it('fill every marked place with its colour and it vanishes, its stars with it, scores, and a new one is shown', () => {
    const marks: Mark[] = [{ ring: 0, spoke: 0, colour: R }, { ring: 1, spoke: 0, colour: B }];
    const g = game(['R.......', '........', '........'], marks, { c: B, spoke: 0 });
    const e = g.drop();
    expect(e.done).not.toBeNull();
    expect(e.done!.stars).toBe(2);
    expect(e.done!.moves).toBe(1);
    expect(e.points).toBe(pointsFor(2, 1, false));
    expect(draw(g)).toEqual(['........', '........', '........']);
    expect(g.completed).toBe(1);
    expect(g.constellation).not.toBeNull();
    expect(g.constellation!.marks).not.toEqual(marks);
    expect(g.moves).toBe(0);
    expect(e.stages.map((s) => s.kind)).toEqual(['drop', 'fall', 'constellation', 'deal']);
  });
  it('filled by a turn alone, it goes too', () => {
    const g = game(['.W......', '........', '........'], [{ ring: 0, spoke: 2, colour: Wh }]);
    g.ring = 0;
    expect(g.turn(1).done?.stars).toBe(1);
  });
  it('a star of the wrong colour in a marked place doesn\'t fill it', () => {
    const g = game(['Y.......', '........', '........'], [{ ring: 0, spoke: 0, colour: R }]);
    g.ring = 0;
    expect(g.turn(1).done).toBeNull();
    expect(g.turn(-1).done).toBeNull();
  });
  it('made with a line of its own stars at once, the constellation goes first (YPPedia: "that part of the constellation must be completed last")', () => {
    const marks: Mark[] = [{ ring: 0, spoke: 3, colour: O }, { ring: 1, spoke: 3, colour: O }, { ring: 2, spoke: 3, colour: O }];
    const g = game(['...O....', '...O....', '........'], marks, { c: O, spoke: 3 });
    const e = g.drop();
    expect(e.done?.stars).toBe(3);
    expect(e.lines).toBe(0);
  });
  it('a combo, a line clearing and what falls then filling it, scores big', () => {
    // The inner yellows go (three round the ring); the B over the marked place falls into it.
    const g = game(['YY......', '.B......', '........'], [{ ring: 0, spoke: 1, colour: B }], { c: Y, spoke: 2 });
    const e = g.drop();
    expect(e.lines).toBe(1);
    expect(e.done?.combo).toBe(true);
    expect(e.done!.points).toBe(pointsFor(1, 1, true));
    expect(pointsFor(1, 1, true)).toBe(SCORE.COMBO * pointsFor(1, 1, false));
    expect(e.stages.map((st) => st.kind)).toEqual(['drop', 'fall', 'line', 'fall', 'constellation', 'deal']);
  });
  it('are dealt in turn by SIZES, one star then two then three for a first go, places all different, never a line of three of a colour among them, never already filled', () => {
    expect(SIZES.slice(0, FIRST_GO)).toEqual([1, 2, 3]);
    for (let seed = 1; seed <= 60; seed++) {
      const g = new Navigation(seeded(seed), { sizes: [seed % 9 + 1] });
      const c = g.constellation!;
      expect(c.marks).toHaveLength(seed % 9 + 1);
      expect(new Set(c.marks.map((m) => m.ring * 8 + m.spoke)).size).toBe(c.marks.length);
      const own = Array.from({ length: 3 }, () => Array(8).fill(null));
      for (const m of c.marks) own[m.ring][m.spoke] = { id: 1, c: m.colour };
      expect(linesOf(own)).toEqual([]);
      expect(g.filled()).toBe(false);
    }
  });
  it('places lean toward the middle (filled from the centre out)', () => {
    const n = [0, 0, 0];
    for (let seed = 1; seed <= 200; seed++) for (const m of new Navigation(seeded(seed), { sizes: [3] }).constellation!.marks) n[m.ring]++;
    expect(n[0]).toBeGreaterThan(n[1]);
    expect(n[1]).toBeGreaterThan(n[2]);
  });
  it('a host can ask for its own sizes and fewer colours', () => {
    const g = new Navigation(seeded(4), { sizes: [2, 4], colours: 3 });
    expect(g.constellation!.marks).toHaveLength(2);
    expect(g.constellation!.marks.every((m) => m.colour < 3)).toBe(true);
    for (let i = 0; i < 40; i++) { expect(g.next.c).toBeLessThan(3); g.drop(); if (g.booches) break; }
  });
});

describe('scoring (11 Nov)', () => {
  it('is strongly weighted on the stars in the constellation, and on the moves taken over par', () => {
    expect(pointsFor(1, 1, false)).toBe(SCORE.STAR);
    expect(pointsFor(3, 1, false)).toBe(9 * SCORE.STAR);
    expect(parFor(2)).toBe(PAR.BASE + 2 * PAR.PER_STAR);
    expect(pointsFor(2, parFor(2), false)).toBe(pointsFor(2, 1, false));
    expect(pointsFor(2, 2 * parFor(2), false)).toBe(Math.round(pointsFor(2, 1, false) / 2));
  });
  it('a constellation of one or two stars can only rate low (YPPedia: "it is only possible to score very low")', () => {
    expect(ratingFor(pointsFor(1, 1, false))).toBe('Fine');
    expect(ratingFor(pointsFor(2, 1, false))).toBe('Good');
    expect(ratingFor(pointsFor(4, 1, false))).toBe('Incredible');
    expect(ratingFor(pointsFor(1, 40, false))).toBe('Poor');
  });
});

describe('the booch (11 Nov)', () => {
  it('dropping a star onto a star in the outermost ring: points off, the board blown clear, the constellation rated Booched', () => {
    const marks: Mark[] = [{ ring: 0, spoke: 0, colour: R }];
    const g = game(['.Y......', '.Y......', '.B......'], marks, { c: O, spoke: 1 });
    const e = g.drop();
    expect(e.booched).toBe(true);
    expect(e.points).toBe(-BOOCH_PENALTY);
    expect(g.booches).toBe(1);
    expect(draw(g)).toEqual(['........', '........', '........']);
    expect(g.constellation!.marks).toEqual(marks);
    g.lay(['R.......', '........', '........'].map(ring));
    g.ring = 0;
    g.turn(1); g.turn(-1);
    expect(g.last?.rating).toBe('Booched');
  });
  it('dropping onto a spoke whose outer place is free is no booch, however full the rest is', () => {
    const g = game(['YRYRYRYR', 'RYRYRYRY', 'OBOBOB.B'], undefined, { c: Wh, spoke: 6 });
    expect(g.drop().booched).toBe(false);
  });
});

describe('a combo constellation: the starlit door\'s evil one (11 Nov)', () => {
  /* The user: "you've got to have like three reds together or four reds together on the bottom row ...
     you basically got to put 2 in there and then say 2 of another color, 2 of the first color in the ring
     above those 2, so that when you do a combo ... it creates a gap and it falls down ... Those kind of
     really evil boards that are impossible and frustrating to beat". */
  it('a row of a colour side by side round a ring, the inner one (the bottom row) unless said', () => {
    expect(bottomRow(R, 3, 7)).toEqual([{ ring: 0, spoke: 7, colour: R }, { ring: 0, spoke: 0, colour: R }, { ring: 0, spoke: 1, colour: R }]);
    expect(bottomRow(B, 2, 0, 1).every((m) => m.ring === 1)).toBe(true);
  });

  it('three, four or five side by side can be made a star at a time: two, a gap, two, and the last into the gap fills it, and filled it goes first', () => {
    expect([3, 4, 5].map((n) => needsCombo(bottomRow(R, n)))).toEqual([false, false, false]);
    const three = game(['RR......', '........', '........'], bottomRow(R, 3), { c: R, spoke: 2 }).drop();
    expect(three.done?.stars).toBe(3);
    expect(three.lines).toBe(0);
    const five = game(['RR.RR...', '........', '........'], bottomRow(R, 5), { c: R, spoke: 2 }).drop();
    expect(five.done?.stars).toBe(5);
    expect(five.lines).toBe(0);
  });

  it('six can\'t: whichever five go in first, three of them are side by side, a line, and gone', () => {
    expect([6, 7, 8].map((n) => needsCombo(bottomRow(R, n)))).toEqual([true, true, true]);
    // Two, a gap, two, a gap: a red into either gap makes five in a row, and they go.
    const g = game(['RR.RR.WB', '........', '........'], bottomRow(R, 6), { c: R, spoke: 2 });
    const e = g.drop();
    expect(e.done).toBeNull();
    expect(e.lines).toBe(1);
    expect(draw(g)[0]).toBe('......WB');
    // (and the puzzle's own constellations never need a combo: any size, dealt at random)
    for (let seed = 1; seed <= 200; seed++) expect(needsCombo(new Navigation(seeded(seed), { sizes: [seed % 8 + 1] }).constellation!.marks)).toBe(false);
  });

  it('two landing at once fill it: the ring above turned so two reds slide over the two gaps together and fall in', () => {
    const g = game(['RR.RR.WB', '.R..R...', '........'], bottomRow(R, 6), { c: Y, spoke: 0 });
    g.ring = 1;
    const e = g.turn(1);
    expect(e.done?.stars).toBe(6);
    expect(e.lines).toBe(0);
    expect(draw(g)).toEqual(['......WB', '........', '........']);
  });

  it('or the user\'s own way: two in, two of another colour, two of the first in the ring above; clear the other colour and the first falls into place', () => {
    // (on four: the two blues go as a line with a third, and the reds above them fall into their places)
    const g = game(['RRBB....', '..RR....', '........'], bottomRow(R, 4), { c: B, spoke: 4 });
    const e = g.drop();
    expect(e.done?.stars).toBe(4);
    expect(e.done?.combo).toBe(true);
    expect(e.stages.map((st) => st.kind)).toEqual(['drop', 'fall', 'line', 'fall', 'constellation', 'deal']);
  });

  it('a host can give its own constellations by their place in the run; the rest are dealt as ever', () => {
    const evil = bottomRow(R, 6, 1);
    const g = new Navigation(seeded(3), { sizes: [2, 3], given: [null, evil] });
    expect(g.constellation!.marks).toHaveLength(2);
    expect(needsCombo(g.constellation!.marks)).toBe(false);
    g.lay([[], [], []]);
    for (const m of g.constellation!.marks) g.grid[m.ring][m.spoke] = { id: 900 + m.ring * 8 + m.spoke, c: m.colour };
    g.turn(1, 2);
    expect(g.completed).toBe(1);
    expect(g.constellation!.marks).toEqual(evil);
    expect(g.constellation!.marks).not.toBe(evil);
  });
});
