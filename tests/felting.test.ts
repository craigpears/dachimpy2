/* Felting's rules (src/felting.ts) and its greedy bot (src/felting-bot.ts): a first concept, 21 Nov. */
import { describe, expect, it } from 'vitest';
import { CALM, DEPTH, FIRM, Felting, HARD, MIN_GAP, NEEDLES, PATTERNS, SHALLOW, SPREAD, TUCK_SOFTEN, WISP_IN, detailColours, patternOf, seeded } from '../src/felting';
import type { Pattern } from '../src/felting';
import { play } from '../src/felting-bot';

/** A little pattern to test on: a 3 by 3 square of core with a black middle. */
const SQUARE: Pattern = { id: 'sq', name: 'square', core: 'w', wools: { w: 'white', k: 'black' }, rows: ['.....', '.www.', '.wkw.', '.www.', '.....'] };
const bare = (p: Pattern = SQUARE) => new Felting(p, () => 1);   // (random 1: no fringe)

describe('the patterns', () => {
  it('every pattern is a rectangle, its letters each named', () => {
    for (const p of Object.values(PATTERNS)) {
      for (const row of p.rows) expect(row.length, p.id).toBe(p.rows[0].length);
      for (const ch of new Set(p.rows.join(''))) if (ch !== '.' && ch !== 'o') expect(p.wools[ch], `${p.id} ${ch}`).toBeTruthy();
    }
  });
  it('a sheep and a wedge of cheese, by name in the address', () => {
    expect(patternOf('sheep').core).toBe('w');
    expect(patternOf('cheese').rows.join('')).toContain('o');
    expect(patternOf('nonsense')).toBe(PATTERNS.sheep);
    // (21 Nov, the user: "keep her personality ... don't call it frog": it's pepopupu, as Lintmint says)
    expect(patternOf('pepopupu').name).toBe('Pepopupu');
    expect(patternOf('frog')).toBe(PATTERNS.pepopupu);
    expect(detailColours(PATTERNS.sheep)).toEqual(['k']);
    expect(detailColours(PATTERNS.cheese)).toEqual(['r']);
  });
});

describe('a stab', () => {
  it('inside firms the cell by one and the cells beside it a quarter', () => {
    const f = bare();
    expect(f.stab(2, 2).kind).toBe('firm');
    expect(f.grid[2][2].firm).toBe(DEPTH);
    expect(f.grid[1][2].firm).toBe(DEPTH * SPREAD);
    expect(f.grid[2][1].firm).toBe(DEPTH * SPREAD);
    expect(f.grid[1][1].firm).toBe(0);           // (not the corners)
  });

  it('stabbing one spot again and again leaves a hard dimple with soft wool round it', () => {
    const f = bare();
    for (let i = 0; i < 5; i++) f.stab(2, 2, { t: i });
    expect(f.grid[2][2].firm).toBeGreaterThanOrEqual(HARD);
    expect(f.grid[1][2].firm).toBeLessThan(FIRM);
    expect(f.right(2, 2)).toBe(false);
  });

  it('a checkerboard of one and two stabs firms a wide middle dead even', () => {
    const p: Pattern = { ...SQUARE, rows: ['.......', '.wwwww.', '.wwwww.', '.wwwww.', '.wwwww.', '.wwwww.', '.......'] };
    const f = bare(p);
    let t = 0;
    for (let r = 1; r <= 5; r++) for (let c = 1; c <= 5; c++) for (let i = 0; i < ((r + c) % 2 ? 1 : 2); i++) f.stab(r, c, { t: t += 1 });
    expect(f.grid[3][3].firm).toBe(3);
    expect(f.grid[2][3].firm).toBe(3);
    expect(f.right(3, 3)).toBe(true);
    // (the edges, with fewer wool beside them, are still softer: they need stabs of their own)
    expect(f.grid[1][3].firm).toBeLessThan(FIRM);
  });

  it('outside on stray wool tucks it one cell in, softening where it lands', () => {
    const f = bare();
    f.grid[0][2].wool = 1;
    f.grid[1][2].firm = 2;
    const s = f.stab(0, 2);
    expect(s.kind).toBe('tuck');
    expect(s.to).toEqual({ r: 1, c: 2 });
    expect(f.grid[0][2].wool).toBe(0);
    expect(f.grid[1][2].wool).toBe(2);
    expect(f.grid[1][2].firm).toBe(2 - TUCK_SOFTEN);
  });

  it('stray wool two out comes in a cell at a time', () => {
    const p: Pattern = { ...SQUARE, rows: ['.......', '.......', '..www..', '..www..', '..www..', '.......', '.......'] };
    const f = bare(p);
    f.grid[0][3].wool = 1;
    expect(f.stab(0, 3).to).toEqual({ r: 1, c: 3 });
    expect(f.grid[1][3].wool).toBe(1);
    expect(f.stab(1, 3, { t: 1 }).to).toEqual({ r: 2, c: 3 });
  });

  it('on bare foam does nothing but use the needle', () => {
    const f = bare();
    expect(f.stab(0, 0).kind).toBe('foam');
    expect(f.stabs).toBe(1);
  });
});

describe('the details', () => {
  it('a colour in hand lays a wisp, with no needle in it; then stabs it in, shallow', () => {
    const f = bare();
    expect(f.stab(2, 2, { colour: 'k' }).kind).toBe('lay');
    expect(f.stabs).toBe(0);
    expect(f.grid[2][2].wisp).toBe('k');
    expect(f.stab(2, 2, { colour: 'k', t: 1 }).kind).toBe('wisp');
    expect(f.grid[2][2].felt).toBe(1);
    expect(f.grid[2][2].firm).toBe(SHALLOW);
    expect(f.grid[1][2].firm).toBe(SHALLOW * SPREAD);
    f.stab(2, 2, { t: 2 });
    expect(f.grid[2][2].felt).toBe(WISP_IN);
    // (once it's in, the needle goes deep again)
    expect(f.stab(2, 2, { t: 3 }).kind).toBe('firm');
  });

  it('a detail is right when its wisp is in and the wool under it is firm', () => {
    const f = bare();
    f.stab(2, 2, { colour: 'k' });
    f.grid[2][2].felt = WISP_IN;
    f.grid[2][2].firm = 3.2;
    expect(f.right(2, 2)).toBe(true);
    f.grid[2][2].wisp = 'w';
    expect(f.right(2, 2)).toBe(false);
  });

  it('a wrong colour laid on the core spoils it', () => {
    const f = bare();
    f.grid[1][1].firm = 3.5;
    expect(f.right(1, 1)).toBe(true);
    f.stab(1, 1, { colour: 'k' });
    expect(f.right(1, 1)).toBe(false);
  });

  it("a cheese's holes are meant to be dimples", () => {
    const f = new Felting(PATTERNS.cheese, () => 1);
    const [r, c] = [4, 4];
    expect(f.grid[r][c].want).toBe('o');
    f.grid[r][c].firm = 3.5;
    expect(f.right(r, c)).toBe(false);
    f.grid[r][c].firm = 4.5;
    expect(f.right(r, c)).toBe(true);
  });
});

describe('the needles', () => {
  it('stabbing too fast bends the needle, and again while bent snaps it', () => {
    const f = bare();
    f.stab(2, 2, { t: 1 });
    expect(f.stab(2, 1, { t: 1 + MIN_GAP / 2 }).bent).toBe(true);
    expect(f.bent).toBe(true);
    const s = f.stab(2, 3, { t: 1 + MIN_GAP });
    expect(s.snapped).toBe(true);
    expect(f.needles).toBe(NEEDLES - 1);
  });

  it('a calm moment straightens a bent needle', () => {
    const f = bare();
    f.stab(2, 2, { t: 1, drag: true });
    expect(f.bent).toBe(true);
    expect(f.stab(2, 2, { t: 1 + CALM }).snapped).toBe(false);
    expect(f.bent).toBe(false);
  });

  it('pulling the needle sideways once it is in bends it, twice snaps it', () => {
    const f = bare();
    f.stab(2, 2, { t: 1 });
    expect(f.twist(1.05).bent).toBe(true);
    expect(f.twist(1.1).snapped).toBe(true);
    expect(f.needles).toBe(NEEDLES - 1);
  });

  it('a drag while stabbing bends it too, and the last needle snapping ends the piece', () => {
    const f = bare();
    for (let i = 0; i < NEEDLES * 2; i++) f.stab(2, 2, { t: i * 0.3, drag: true });   // (each within CALM of the last)
    expect(f.needles).toBe(0);
    expect(f.over).toBe(true);
    expect(f.stab(2, 2, { t: 99 }).kind).toBe('none');
  });
});

describe('the score', () => {
  it('a fresh tuft scores low; finishing stops the stabs', () => {
    const f = new Felting(PATTERNS.sheep, seeded(1));
    const s = f.score();
    expect(s.match).toBeLessThan(0.3);
    expect(s.strays).toBeGreaterThan(0);
    expect(s.total).toBeLessThan(40);
    f.finish();
    expect(f.stab(5, 5).kind).toBe('none');
  });

  it('the same seed lays the same fringe', () => {
    const a = new Felting(PATTERNS.cheese, seeded(7)), b = new Felting(PATTERNS.cheese, seeded(7));
    expect(a.grid.map((r) => r.map((x) => x.wool))).toEqual(b.grid.map((r) => r.map((x) => x.wool)));
  });
});

describe('the bot', () => {
  it.each(Object.keys(PATTERNS))('felts the %s well, so it can be done', (id) => {
    const f = new Felting(PATTERNS[id], seeded(3));
    const moves = play(f);
    const s = f.score();
    expect(s.strays).toBe(0);
    expect(s.details).toBe(0);
    expect(s.match, `${id}: ${moves} moves, ${JSON.stringify(s)}`).toBeGreaterThan(0.85);
    expect(s.total).toBeGreaterThan(80);
  });
});
