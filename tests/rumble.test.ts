/* Rumble's rules, as YPPedia gives them (RUMBLE.md, read 21 Nov 2026), and its greedy bot. */
import { describe, expect, it } from 'vitest';
import { Board, H, LAUNCH_X, ROW_EVERY, Rumble, SHOT_CLOCK, W, seeded, sprinkles, strikeSize } from '../src/rumble';
import type { Colour } from '../src/rumble';
import { GREEDY, Hand, options } from '../src/rumble-bots';

const CODE = 'royab';
/** A board drawn top row first: r o y a b balls, R O Y A B dark (bruised twice), '.' empty, one character a column
    (the odd rows sit half a ball to the right, as the board starts). */
function board(...rows: string[]): Board {
  const b = new Board();
  rows.forEach((line, r) => [...line].forEach((ch, c) => {
    if (ch === '.') return;
    const i = CODE.indexOf(ch.toLowerCase());
    b.grid[r][c] = b.ball(i as Colour, ch === ch.toLowerCase() ? 0 : 2);
  }));
  return b;
}
const draw = (b: Board, rows: number) => b.grid.slice(0, rows).map((row) =>
  row.map((x) => (!x ? '.' : x.bruise ? CODE[x.c].toUpperCase() : CODE[x.c])).join(''));

describe('the board', () => {
  it('nine across, hexagonal: each ball touches six, rows half a ball over in turn', () => {
    const b = new Board();
    expect(b.neighbours(4, 4)).toHaveLength(6);
    for (const { r, c } of b.neighbours(5, 3)) expect(b.neighbours(r, c)).toContainEqual({ r: 5, c: 3 });
    expect(b.centre(1, 0).x - b.centre(0, 0).x).toBeCloseTo(0.5);
  });

  it('a ball fired straight up an empty board sticks to the top', () => {
    const b = new Board();
    const { cell } = b.shot(0, 0);
    expect(cell.r).toBe(0);
    expect(Math.abs(b.centre(0, cell.c).x - LAUNCH_X[0])).toBeLessThan(0.6);
  });

  it('a ball bounces off the side', () => {
    const b = new Board();
    const { path, cell } = b.shot(0, -1.2);
    expect(path.length).toBeGreaterThan(2);           // start, a bounce, where it sticks
    expect(cell.r).toBe(0);
  });

  it('a ball sticks where it meets the mass, under it', () => {
    const b = board('rrrrrrrrr');
    const { cell } = b.shot(0, 0);
    expect(cell.r).toBe(1);
  });
});

describe('clearing and dropoff', () => {
  it('three of a colour clear, and what hung from them falls as dropoff', () => {
    const b = board('ooorrbooo', '...y.....');
    // a red under the two reds makes three; the yellow hung from them falls.
    const out = b.land(0, { r: 1, c: 4 }, false);
    expect(out.kind).toBe('clear');
    expect(out.popped).toBe(3);
    expect(out.dropoff).toBe(1);
    expect(draw(b, 2)).toEqual(['ooo..booo', '.........']);
  });

  it('two of a colour just stick', () => {
    const b = board('ooo.rbooo');
    expect(b.land(0, { r: 1, c: 4 }, false).kind).toBe('none');
  });
});

describe('charging and combos (Official:Rumbling)', () => {
  it('a charged ball making three holds the group, recorded; one making none is just a ball', () => {
    const b = board('rr.oooooo');
    const out = b.land(0, { r: 0, c: 2 }, true);
    expect(out.kind).toBe('charge');
    expect(b.charges).toHaveLength(1);
    expect(draw(b, 1)).toEqual(['rrroooooo']);
    expect(b.land(2, { r: 1, c: 0 }, true).kind).toBe('none');
    expect(b.charges).toHaveLength(1);
  });

  it('an ordinary ball into a charged group sets it off, and every group charged after it', () => {
    const b = board('rr.yy.aa.', '.........');
    b.land(0, { r: 0, c: 2 }, true);   // red, first
    b.land(2, { r: 0, c: 5 }, true);   // yellow, second
    b.land(3, { r: 0, c: 8 }, true);   // aqua, third
    expect(b.charges).toHaveLength(3);
    const out = b.land(0, { r: 1, c: 1 }, false);
    expect(out.kind).toBe('combo');
    expect(out.groups).toBe(3);
    expect(b.charges).toHaveLength(0);
  });

  it('setting off a later group leaves the earlier ones charged', () => {
    const b = board('rr.yy.aa.', '.........');
    b.land(0, { r: 0, c: 2 }, true);
    b.land(2, { r: 0, c: 5 }, true);
    b.land(3, { r: 0, c: 8 }, true);
    const out = b.land(2, { r: 1, c: 4 }, false);     // into the yellow, the second
    expect(out.groups).toBe(2);
    expect(b.charges).toHaveLength(1);                 // the red's still charged
  });
});

describe('bruises (Official:Rumbling: "Do this 2 times and the ball will be back to normal")', () => {
  it('a dark ball is in no group, and each clear beside it lightens it a stage', () => {
    const b = board('rrRoooooo', '.........');
    expect(b.group(0, 0)).toHaveLength(2);            // the dark red isn't in it
    b.land(0, { r: 1, c: 0 }, false);                 // clears the two reds and the one fired, beside the dark one
    expect(b.at(0, 2)!.bruise).toBe(1);
  });

  it('a charged ball pushed out of its group by a strike turns dark', () => {
    const b = board('ooooooooo', 'rr.......');
    b.land(0, { r: 1, c: 2 }, true);
    expect(b.charges).toHaveLength(1);
    // one row pushed in over the left two columns shoves its two reds down, away from the charged one
    b.strike([[b.ball(3), b.ball(4)]], 'left');
    expect(b.charges).toHaveLength(0);
    expect(b.at(1, 2)!.bruise).toBe(2);
  });
});

describe('what a clear sends (YPPedia, "Rumble strike calculations" and "Rumble sprinkle calculations")', () => {
  it('a strike by the tables: groups set its base, dropoff and extra balls widen it', () => {
    expect(strikeSize(2, 0, 0)).toEqual({ h: 1, w: 7, bruises: 0 });
    expect(strikeSize(4, 3, 6)).toEqual({ h: 3, w: 7, bruises: 3 });       // "7-5-3-3+3" (example 2)
    expect(strikeSize(5, 13, 0)).toEqual({ h: 3, w: 9, bruises: 13 });     // "3 high and 9 wide ... with 13 bruises"
    expect(strikeSize(3, 12, 0)).toEqual({ h: 2, w: 9, bruises: 9 });      // "2 high and 9 wide ... 9 bruises"
    expect(strikeSize(6, 0, 0)).toEqual({ h: 4, w: 4, bruises: 0 });       // "The basic 6-group strike only contains 16 balls!"
    expect(strikeSize(3, 2, 1).w).toBe(6);                                  // * "add 1 instead of 0 if exactly 1 extra ball"
  });

  it('sprinkles: half the popped, a third of the dropoff', () => {
    expect(sprinkles(5, 7)).toBe(4);                                         // "5d7"
    expect(sprinkles(3, 0) * 3 + sprinkles(4, 22)).toBe(12);               // hint video 1: "3 3 3 4d22", 12 sprinkles
  });

  it('a strike pushes in at the top corner, shoving the balls under it down', () => {
    const b = board('rrrrrrrrr');
    const rows = [[2, 2, 2], [3, 3, 3]].map((r) => r.map((c) => b.ball(c as Colour)));
    b.strike(rows, 'right');
    expect(draw(b, 4).map((l) => l.slice(6))).toEqual(['yyy', 'aaa', 'rrr', '...']);
    expect(draw(b, 1)[0].slice(0, 6)).toBe('rrrrrr');
  });

  it('sprinkles fly up their column from the foot and stick under the board', () => {
    const b = board('rrrrrrrrr', 'yyyyyyyyy');
    const cells = b.sprinkle([{ col: 4, ball: b.ball(4) }]);
    expect(cells[0].r).toBe(2);
  });
});

describe('two pirates rumbling', () => {
  it('an attack lands after the other pirate\'s next shot, a strike in the corner opposite the fist', () => {
    const g = new Rumble(seeded(3), 0);
    const [me, them] = g.sides;
    // Ready-made: two charged groups on my board, and a ball to set them off.
    me.board = board('rr.yy....', '.........');
    me.board.land(0, { r: 0, c: 2 }, true);
    me.board.land(2, { r: 0, c: 5 }, true);
    me.fists[0] = [0, 0];
    const angle = aimAt(me.board, 0, { r: 1, c: 1 });
    expect(g.fire(0, 0, angle, false, 0)).toBe(true);
    g.tick(5);
    const sent = g.drain().find((h) => h.what === 'sent');
    expect(sent && sent.what === 'sent' && sent.attack.kind).toBe('strike');
    expect(them.incoming).toHaveLength(1);
    const before = them.board.lowest();
    g.fire(1, 1, 0, false, 5);
    g.tick(10);
    expect(them.incoming).toHaveLength(0);
    const hit = g.drain().find((h) => h.what === 'hit');
    expect(hit && hit.what === 'hit' && hit.attack.kind === 'strike' && hit.attack.from).toBe('right');   // left fist: top right
    expect(them.board.lowest()).toBeGreaterThan(before);
  });

  it('the board drops a row every eighth shot', () => {
    const g = new Rumble(seeded(5), 0);
    const s = g.sides[0];
    let t = 0;
    for (let i = 0; i < ROW_EVERY; i++) { g.fire(0, 0, 0.9, false, t); t += 2; g.tick(t); }
    expect(g.drain().filter((h) => h.what === 'row' && h.p === 0)).toHaveLength(1);
    expect(s.shots).toBe(ROW_EVERY);
  });

  it('the game fires for you when the shot clock runs out', () => {
    const g = new Rumble(seeded(6), 0);
    g.tick(SHOT_CLOCK + 0.01);
    expect(g.sides[0].shots).toBe(1);
    expect(g.sides[1].shots).toBe(1);
  });

  it('balls over the line lose', () => {
    const g = new Rumble(seeded(7), 0);
    const s = g.sides[1];
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) s.board.grid[r][c] = s.board.ball(((r * 2 + c) % 5) as Colour);
    s.board.grid[H - 1][4] = null;
    s.fists[0] = [0, 0];
    g.fire(1, 0, 0, false, 0);
    for (let t = 0; t < 60 && !g.over(); t += 0.5) g.tick(t);
    expect(g.winner).toBe(0);
  });
});

describe('the greedy bot', () => {
  it('sees every cell it can reach, both fists', () => {
    const g = new Rumble(seeded(11), 0);
    const opts = options(g.sides[0]);
    expect(new Set(opts.map((o) => o.fist)).size).toBe(2);
    expect(opts.length).toBeGreaterThan(10);
  });

  it('uses a pair of its colour when there is one: charging it or clearing it', () => {
    const g = new Rumble(seeded(12), 0);
    const s = g.sides[0];
    s.board = board('ooorrbooo', '.........');
    s.fists = [[0, 1], [1, 1]];
    const hand = new Hand(GREEDY, 0, seeded(1));
    hand.play(g, 0);
    expect(['charge', 'clear']).toContain(hand.plan?.option.outcome.kind);
  });

  it('two greedy bots brawl a whole rumble to a winner (a quick check, one seed)', () => {
    const g = new Rumble(seeded(21), 0), hands = [new Hand(GREEDY, 0, seeded(2)), new Hand(GREEDY, 1, seeded(3))];
    let t = 0, strikes = 0, sprinkleRows = 0;
    for (; t < 900 && !g.over(); t += 0.05) {
      for (const h of hands) h.play(g, t);
      g.tick(t);
      for (const h of g.drain()) if (h.what === 'sent') { if (h.attack.kind === 'strike') strikes++; else sprinkleRows++; }
    }
    expect(g.over()).toBe(true);
    expect(strikes + sprinkleRows).toBeGreaterThan(0);
  }, 30000);
});

/** An angle that lands a fist's ball in a cell. */
function aimAt(b: Board, fist: 0 | 1, cell: { r: number; c: number }): number {
  for (let a = -1.36; a <= 1.36; a += 0.002) {
    const at = b.shot(fist, a).cell;
    if (at.r === cell.r && at.c === cell.c) return a;
  }
  throw new Error(`no angle reaches ${cell.r},${cell.c}`);
}
