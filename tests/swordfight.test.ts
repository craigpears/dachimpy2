/* The Swordfight puzzle's rules, as YPPedia gives them (read 8 Nov 2026). */
import { describe, expect, it } from 'vitest';
import { Board, ENTRY, H, W, randomPair, toSword } from '../src/swordfight';
import type { Colour, Pair } from '../src/swordfight';

const CODE = 'rygb';
/** A board drawn bottom rows last: r y g b blocks, R Y G B breakers, x grey (attack) blocks, '.' empty. */
function board(...rows: string[]): Board {
  const b = new Board(() => 0.5);
  rows.forEach((row, i) => {
    const r = rows.length - 1 - i;
    [...row].forEach((ch, c) => {
      if (ch === '.') return;
      if (ch === 'x') { b.grid[r][c] = { c: 0, grey: 2 }; return; }
      const col = CODE.indexOf(ch.toLowerCase()) as Colour;
      b.grid[r][c] = { c: col, breaker: ch !== ch.toLowerCase() || undefined };
    });
  });
  return b;
}
/** The board drawn back, the same way ('.' empty), only as many rows as the drawing had. */
function draw(b: Board, rows: number): string[] {
  const out: string[] = [];
  for (let r = rows - 1; r >= 0; r--) {
    out.push(b.grid[r].map((g) => (!g ? '.' : g.grey ? 'x' : g.breaker ? CODE[g.c].toUpperCase() : CODE[g.c])).join(''));
  }
  return out;
}
const pair = (a: string, b: string): Pair => [a, b].map((ch) => ({ c: CODE.indexOf(ch.toLowerCase()) as Colour, breaker: ch !== ch.toLowerCase() })) as Pair;
/** Drop a pair straight down in a column, the second piece on top (rot 0) or beside (rot 1, to the right). */
function play(b: Board, p: Pair, col: number, rot = 0) {
  b.spawn(p);
  while (b.falling!.rot !== rot) b.rotate(1);
  while (b.falling!.c > col && b.move(-1));
  while (b.falling!.c < col && b.move(1));
  return b.drop();
}

describe('the board', () => {
  it('is 6 wide by 13 high, and a pair comes in at the top of the fourth column', () => {
    const b = new Board();
    expect([W, H]).toEqual([6, 13]);
    b.spawn(pair('r', 'g'));
    expect(b.fallingCells()).toEqual([[H - 2, ENTRY], [H - 1, ENTRY]]);
  });

  it('moves left and right, but not out of the board', () => {
    const b = new Board();
    b.spawn(pair('r', 'g'));
    for (let i = 0; i < 10; i++) b.move(-1);
    expect(b.falling!.c).toBe(0);
    for (let i = 0; i < 10; i++) b.move(1);
    expect(b.falling!.c).toBe(W - 1);
  });

  it('turning against the side shifts the pair over to make room', () => {
    const b = new Board();
    b.spawn(pair('r', 'g'));
    for (let i = 0; i < 10; i++) b.move(1);
    expect(b.rotate(1)).toBe(true);   // the second piece would go off the right: it shifts left
    expect(b.fallingCells()).toEqual([[H - 2, W - 2], [H - 2, W - 1]]);
  });

  it('falls a row at a time, and lands on what\'s there', () => {
    const b = board('r.....');
    b.spawn(pair('g', 'y'));
    while (b.falling!.c > 0) b.move(-1);
    let res = null;
    for (let i = 0; i < H && !res; i++) res = b.step();
    expect(res).not.toBeNull();
    expect(draw(b, 3)).toEqual(['y.....', 'g.....', 'r.....']);
  });

  it('each piece of a pair lying flat falls on its own', () => {
    const b = board('.r....', '.r....');
    play(b, pair('g', 'y'), 0, 1);
    expect(draw(b, 3)).toEqual(['.y....', '.r....', 'gr....']);
  });

  it('you lose when no pair can come in at the top of the fourth column', () => {
    const b = new Board();
    for (let r = 0; r < H - 1; r++) b.grid[r][ENTRY] = { c: (r % 2) as Colour };
    expect(b.lost).toBe(true);
    expect(b.spawn(pair('r', 'g'))).toBe(false);
  });
});

describe('breaking', () => {
  it('a breaker shatters every piece of its colour connected to it', () => {
    const b = board('rr....', 'yr....', 'yrrg..');
    const hit = play(b, pair('R', 'g'), 0);   // the breaker lands on the red at the top of the first column
    expect(hit.links).toHaveLength(1);
    expect(hit.links[0].broken).toBe(6);   // five reds and the breaker
    expect(draw(b, 3)).toEqual(['g.....', 'y.....', 'y..g..']);
  });

  it('diagonals don\'t connect', () => {
    const b = board('.r....', 'R.....');
    expect(b.resolve().links).toEqual([]);
  });

  it('a breaker touching only other colours stays put', () => {
    const b = board('gY....', 'gg....');
    expect(b.resolve().links).toEqual([]);
    expect(draw(b, 2)).toEqual(['gY....', 'gg....']);
  });

  it('two breakers of a colour side by side break each other', () => {
    const b = board('BB....');
    expect(b.resolve().links[0].broken).toBe(2);
  });

  it('attack blocks don\'t break until they\'ve turned into ordinary blocks', () => {
    const b = board('x.....', 'R.....');
    b.grid[1][0] = { c: 0, grey: 2 };
    expect(b.resolve().links).toEqual([]);
    b.grid[1][0] = { c: 0 };
    expect(b.resolve().links[0].broken).toBe(2);
  });
});

describe('fusing', () => {
  it('a colour two by two or bigger fuses into one block', () => {
    const b = board('rr....', 'rr....');
    b.fuse();
    expect(b.fusedIds()).toHaveLength(1);
    expect(b.fusedBox(b.fusedIds()[0])).toMatchObject({ w: 2, h: 2 });
  });

  it('a fused block grows by a whole row of its colour', () => {
    const b = board('rr....', 'rr....');
    b.fuse();
    b.grid[2][0] = { c: 0 }; b.grid[2][1] = { c: 0 };
    b.fuse();
    expect(b.fusedIds()).toHaveLength(1);
    expect(b.fusedBox(b.fusedIds()[0])).toMatchObject({ w: 2, h: 3 });
  });

  it('an L of one colour isn\'t a rectangle: only its 2x2 fuses', () => {
    const b = board('r.....', 'rr....', 'rr....');
    b.fuse();
    expect(b.fusedBox(b.fusedIds()[0])).toMatchObject({ w: 2, h: 2, r0: 0 });
    expect(b.grid[2][0]!.fuse).toBeUndefined();
  });

  it('a fused block falls all together', () => {
    const b = board('rr....', 'rr....', 'g.....');
    b.fuse();
    b.grid[0][0] = null;
    b.settle();
    expect(draw(b, 3)).toEqual(['......', 'rr....', 'rr....']);
  });
});

describe('attacks', () => {
  it('one sprinkle for every two loose pieces broken, rounded down', () => {
    const b = board('rrrrR.');   // five pieces
    expect(b.resolve().sprinkles).toBe(2);
  });

  it('each group broken at once is counted on its own: 5 and 4 make 2 + 2', () => {
    const b = board('rrrrRB', '....bb', '.....b');
    // red: 5 pieces; blue: the breaker and three blues, 4 pieces
    const res = b.resolve();
    expect(res.links[0].broken).toBe(9);
    expect(res.sprinkles).toBe(4);
  });

  it('a fused block sends a sword', () => {
    const b = board('rr....', 'rr....', 'R.....');
    // (the breaker under it: touching the fused red)
    const res = b.resolve();
    expect(res.strikes).toEqual([{ w: 1, h: 4, vertical: true }]);
    expect(res.sprinkles).toBe(0);   // the breaker alone is one loose piece: none
  });

  it('swords are the fused block\'s size, with the real exceptions', () => {
    expect(toSword(2, 2)).toEqual({ w: 1, h: 4, vertical: true });
    expect(toSword(3, 3)).toEqual({ w: 2, h: 4, vertical: true });
    expect(toSword(2, 3)).toEqual({ w: 2, h: 3, vertical: true });
    expect(toSword(3, 2)).toEqual({ w: 3, h: 2, vertical: false });
    expect(toSword(5, 5)).toEqual({ w: 3, h: 7, vertical: true });
    expect(toSword(5, 4)).toEqual({ w: 6, h: 3, vertical: false });
  });

  it('a chain multiplies: the second link sends double', () => {
    // A red breaker sits on the blue breaker's way down: break the reds and the blue breaker drops
    // onto the blues.
    const b = board(
      'B.....',
      'r.....',
      'R.....',
      'bbbb..',
    );
    const res = b.resolve();
    expect(res.links.map((l) => l.chain)).toEqual([1, 2]);
    expect(res.links[0].sprinkles).toBe(1);   // the red pair: 1
    expect(res.links[1].sprinkles).toBe(2 * 2);   // the blue breaker and four blues: 2, doubled
  });

  it('a chain makes a sword longer along its longest side', () => {
    expect(toSword(2, 2, 2)).toEqual({ w: 2, h: 4, vertical: true });
    expect(toSword(3, 2, 2)).toEqual({ w: 6, h: 2, vertical: false });
  });
});

describe('attacks coming in', () => {
  it('sprinkles land as grey blocks that turn ordinary after two turns', () => {
    const b = new Board(() => 0);
    expect(b.receive(3)).toBe(3);
    const greys = () => b.grid.flat().filter((g) => g?.grey).length;
    expect(greys()).toBe(3);
    play(b, pair('r', 'r'), 5);
    expect(b.grid.flat().filter((g) => g?.grey === 1)).toHaveLength(3);   // see-through now
    play(b, pair('y', 'y'), 5);
    expect(greys()).toBe(0);
  });

  it('never land in the top of the fourth column', () => {
    const b = new Board(() => 0.6);
    for (let i = 0; i < 20; i++) b.receive(6);
    expect(b.at(H - 1, ENTRY)).toBeNull();
    expect(b.at(H - 2, ENTRY)).toBeNull();
  });

  it('don\'t land where the falling pair is', () => {
    const b = new Board(() => 0.6);
    b.spawn(pair('r', 'g'));
    b.move(-1); b.move(-1);
    for (let i = 0; i < 20; i++) b.receive(6);
    for (const [r, c] of b.fallingCells()) expect(b.at(r, c)).toBeNull();
    expect(b.at(H - 3, 1)).not.toBeNull();   // (the column under it did fill)
  });
});

describe('randomPair', () => {
  it('deals the four colours, and breakers about one piece in five', () => {
    let s = 7;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const pieces = Array.from({ length: 2000 }, () => randomPair(rnd)).flat();
    for (let c = 0; c < 4; c++) expect(pieces.filter((p) => p.c === c).length).toBeGreaterThan(400);
    const breakers = pieces.filter((p) => p.breaker).length / pieces.length;
    expect(breakers).toBeGreaterThan(0.15);
    expect(breakers).toBeLessThan(0.25);
  });
});
