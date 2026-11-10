import { describe, expect, it } from 'vitest';
import { Board, OAR_PRESS, OarPress, callout, seeded } from '../src/oar-press.js';
import type { Colour, Gem, Grid } from '../src/oar-press.js';

const { W, H, FLOW, SWING, FIRM_MIN } = OAR_PRESS;
const gem = (c: Colour, breaker = false): Gem => ({ c, breaker });
const empty = (): Grid => Array.from({ length: H }, () => Array<Gem | null>(W).fill(null));

/** A board laid out from rows written top first: r/a/t/b plain red, amber, teal, blue; capitals breakers. */
function board(rows: string[]): Board {
  const b = new Board(seeded(1));
  b.grid = empty();
  rows.slice().reverse().forEach((line, r) => [...line].forEach((ch, c) => {
    const k = 'ratb'.indexOf(ch.toLowerCase());
    if (k >= 0) b.grid[r][c] = gem(k as Colour, ch !== ch.toLowerCase());
  }));
  return b;
}

describe('the board', () => {
  it('lands a pair each half as far as it falls', () => {
    const b = board(['r.....']);
    b.pair = [gem(2), gem(3)];
    b.drop({ col: 0, rot: 1 });
    expect(b.grid[1][0]?.c).toBe(2);
    expect(b.grid[0][1]?.c).toBe(3);
  });

  it('pops the whole connected group a breaker touches, and only its colour', () => {
    const b = board(['rr....', 'rt....']);
    b.pair = [gem(0, true), gem(3)];
    const d = b.drop({ col: 1, rot: 0 });
    expect(d.links).toHaveLength(1);
    expect(d.links[0].broken).toEqual([4, 0, 0, 0]);
    expect(b.grid[0][1]?.c).toBe(2);
  });

  it('a breaker touching nothing of its colour waits', () => {
    const b = board(['tt....']);
    b.pair = [gem(0, true), gem(1)];
    expect(b.drop({ col: 0, rot: 0 }).links).toHaveLength(0);
  });

  it('what falls after a pop can set off a chain', () => {
    // The amber breaker sits on the red group; popping the reds drops it beside the ambers.
    const b = board(['.A....', '.r....', 'ar....']);
    b.pair = [gem(0, true), gem(3)];
    const d = b.drop({ col: 2, rot: 0 });
    expect(d.links.map((l) => l.chain)).toEqual([1, 2]);
    expect(d.links[1].broken).toEqual([0, 2, 0, 0]);
  });

  it('washes the top rows off when a stack reaches the top, and play goes on', () => {
    const b = board(Array(H - 1).fill('r.....').map((s, i) => (i % 2 ? s : 't.....')));
    b.pair = [gem(1), gem(2)];
    const d = b.drop({ col: 0, rot: 1 });
    expect(d.washed).toBe(OAR_PRESS.WASH);
    expect(b.height(0)).toBe(H - OAR_PRESS.WASH);
    expect(b.placements().length).toBeGreaterThan(0);
  });

  it('never offers a placement off the board', () => {
    const b = new Board(seeded(3));
    for (const p of b.placements()) {
      expect(p.col).toBeGreaterThanOrEqual(0);
      expect(p.col + (p.rot === 1 ? 1 : p.rot === 3 ? -1 : 0)).toBeLessThan(W);
      expect(p.col + (p.rot === 3 ? -1 : 0)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('the oars', () => {
  it('the flow sweeps each oar back a notch a pair, and a spent oar drives nothing', () => {
    const g = new OarPress({ seed: 5 });
    g.boards[0].grid = empty();
    g.oar = [1 - FLOW / 2, 1];
    g.boards[0].pair = [gem(0), gem(2)];
    const beat = g.step([{ col: 0, rot: 1 }]);
    expect(g.oar[0]).toBeCloseTo(1);
    expect(g.oar[1]).toBe(1);
    expect(beat.drive[1]).toBe(0);
    expect(beat.drive[0]).toBeCloseTo((FLOW / 2) * g.firmness(0));
  });

  it('more weight of its colours drives an oar more firmly', () => {
    const g = new OarPress({ seed: 5 });
    g.boards[0] = board(['......']);
    const light = g.firmness(0);
    g.boards[0] = board(['rrrrrr', 'aaaaaa']);
    expect(light).toBe(FIRM_MIN);
    expect(g.firmness(0)).toBeGreaterThan(light);
    expect(g.firmness(1)).toBe(FIRM_MIN);
  });

  it('a pop swings its own side forward, a bigger pop further, but no further than the catch', () => {
    const g = new OarPress({ seed: 5 });
    g.boards[0] = board(['rr....', 'rr....']);
    g.oar = [1, 1];
    g.boards[0].pair = [gem(0, true), gem(1)];
    const beat = g.step([{ col: 2, rot: 0 }]);
    expect(beat.swing[0]).toBeCloseTo(5 * SWING);
    expect(beat.swing[1]).toBe(0);
    g.oar = [0.05, 1];
    g.boards[0] = board(['rr....', 'rr....']);
    g.boards[0].pair = [gem(0, true), gem(1)];
    expect(g.step([{ col: 2, rot: 0 }]).swing[0]).toBeCloseTo(0.05);
  });

  it('warm pops pull port and cool pops starboard; both at once is a stroke in unison', () => {
    const g = new OarPress({ seed: 5 });
    g.boards[0] = board(['r....t']);
    g.oar = [1, 1];
    g.boards[0].pair = [gem(0, true), gem(2, true)];
    // The pair lies across columns 1 and 2: the red breaker beside the red, the teal beside a teal.
    g.boards[0].grid[0][3] = gem(2);
    const beat = g.step([{ col: 1, rot: 1 }]);
    expect(beat.unison).toBe(true);
    expect(beat.swing[0]).toBeGreaterThan(0);
    expect(beat.swing[1]).toBeGreaterThan(0);
    expect(callout(beat)).toContain('unison');
  });
});

describe('her heading', () => {
  it('goes straight when both oars drive alike', () => {
    const g = new OarPress({ seed: 9 });
    g.boards[0] = board(['......']);
    g.boards[0].pair = [gem(0), gem(2)];
    g.step([{ col: 0, rot: 1 }]);
    expect(g.heading).toBe(0);
    expect(g.y).toBeGreaterThan(0);
  });

  it('turns to starboard when port drives and starboard is spent, and round in circles if it goes on', () => {
    const g = new OarPress({ seed: 9 });
    for (let i = 0; i < 200; i++) {
      g.oar = [0, 1];
      g.boards[0] = board(['......']);
      g.boards[0].pair = [gem(1), gem(3)];
      g.step([{ col: 0, rot: 1 }]);
    }
    expect(g.heading).toBeGreaterThan(Math.PI * 2);
    expect(g.straightness()).toBeLessThan(0.3);
  });

  it('plays the same run again from the same seed', () => {
    const run = () => {
      const g = new OarPress({ seed: 42 });
      for (let i = 0; i < 80; i++) { const ps = g.boards[0].placements(); g.step([ps[i % ps.length]]); }
      return [g.x, g.y, g.heading, g.stats.popped];
    };
    expect(run()).toEqual(run());
  });

  it('with a crew, every colour on a board pulls that board\'s side', () => {
    const g = new OarPress({ seed: 2, crew: true });
    expect(g.boards).toHaveLength(2);
    expect(g.sideOf(0, 3)).toBe(0);
    expect(g.sideOf(1, 0)).toBe(1);
  });
});
