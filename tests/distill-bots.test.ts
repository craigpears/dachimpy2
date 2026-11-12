/* Distilling's bots and their planner (src/distill-bots.ts): every tier the same plan, its techniques
   the routines of src/distill-routines.ts picked by stage, at a person's pace, by the rules (12 Nov). What
   each tier reaches is tools/distill-bots.mjs's to measure (DISTILLING.md §4). */
import { describe, expect, it } from 'vitest';
import { BURN_TICKS, COLS, Distilling, SHORT, TALL, WHITE, parseBoard } from '../src/distilling';
import { HELIUM, MENU, TIERS, advise, choose, contextFor, playSession, sweepsOn, tierNamed } from '../src/distill-bots';
import { playDrags } from '../src/distill-routines';
import type { Board } from '../src/distilling';
import { seeded } from '../src/mirror-row';

const sea = (ch: string) => Array.from({ length: COLS }, (_, x) => ch.repeat(x % 2 === 0 ? TALL : SHORT));
function board(at: [number, number, string][], cols = sea('w')): Board {
  const out = cols.map((c) => [...c]);
  for (const [x, y, ch] of at) out[x][y] = ch;
  return parseBoard(out.map((c) => c.join('')));
}
const column = (x: number, s: string): [number, number, string][] => [...s].map((ch, y) => [x, y, ch]);

describe('the bots (12 Nov)', () => {
  it('are four tiers, none faster than 6 swaps a second along a drag (a swap slides 150 ms)', () => {
    expect(TIERS.map((t) => t.name)).toEqual(['learner', 'master', 'grandmaster', 'ultimate']);
    for (const t of TIERS) expect(t.rate).toBeLessThanOrEqual(6);
  });
  it('every tier plays the same plan, only with fewer techniques lower down (the user: "It\'s always whites to the left")', () => {
    for (const t of TIERS) for (const r of ['rescue', 'junkColumn', 'diamond', 'channel'] as const) expect(t.routines).toContain(r);
    for (let i = 1; i < TIERS.length; i++) for (const r of TIERS[i - 1].routines) expect(TIERS[i].routines).toContain(r);
  });
  it('never burn a white when a rescue was possible (12 Nov: the bot "just went down and burnt" a white)', () => {
    // A white in the furnace's column, one swap from safety, and under two seconds on the furnace.
    for (const t of TIERS) {
      const g = new Distilling(seeded(3)).lay(board([...column(9, 'KKKwKKKK'), [8, 3, 'K'], ...column(0, 'KbKbKbKbK'), ...column(1, 'bKbKbKbK')]));
      g.furnace = BURN_TICKS - 5;
      expect(g.timeLeft()).toBeLessThan(2000);
      const out: number[][] = [];
      playSession(g, t, 0.1, (c) => out.push(c.pieces));
      expect(out.length).toBeGreaterThan(0);
      expect(out[0].filter((p) => p === WHITE)).toHaveLength(0);
    }
  });
  it('never burn a column with a white in it on purpose', () => {
    for (const t of TIERS.slice(1)) {
      const g = new Distilling(seeded(5003));
      playSession(g, t, 3, undefined, (a) => { if (a.kind === 'burn' && a.stage === 'junk') expect(g.cols[COLS - 1]).not.toContain(WHITE); });
    }
  }, 60000);
  it('play a whole session by the rules at their own pace, and it ends', () => {
    for (const t of TIERS) {
      const g = new Distilling(seeded(5000));
      const r = playSession(g, t, 3);
      expect(r.swaps / (r.minutes * 60)).toBeLessThanOrEqual(t.rate);
      expect(g.finished || g.time >= 3 * 60000).toBe(true);
      expect(r.columnsUp + r.columnsBurned).toBe(g.columns.length);
    }
  }, 60000);
  it('play techniques as whole drags, several swaps each, not a click a swap (the user, 12 Nov: "a human doesn\'t have time for those little swaps")', () => {
    const r = playSession(new Distilling(seeded(5001)), tierNamed('master'), 4);
    expect(r.swaps / r.drags).toBeGreaterThan(2);
  });
  it('the learner never burns early: its columns go at the furnace\'s pace', () => {
    const g = new Distilling(seeded(5001)), at: number[] = [];
    playSession(g, tierNamed('learner'), 4, () => at.push(g.time));
    expect(at.length).toBeGreaterThan(10);
    // (seen at the end of the drag or wait it came in)
    for (let i = 1; i < at.length; i++) expect(at[i] - at[i - 1]).toBeGreaterThanOrEqual(15300 - 1500);
  });
  it('the better tiers burn early, and dismiss once their chain breaks or isn\'t worth chasing', () => {
    const g = new Distilling(seeded(5002));
    const r = playSession(g, tierNamed('master'), 20);
    expect(g.columns.length).toBeGreaterThan(Math.floor(g.time / 15300));
    if (r.dismissed && g.longest > 0) expect(g.columns[g.columns.length - 1].chain === 0 || g.chain > 0).toBe(true);
  });
});

describe('advise: Helium reads anyone\'s board (12 Nov: "context aware")', () => {
  it('Stage I, on a board mid-game: whites left, junk right, a routine with its reason and drags', () => {
    const g = new Distilling(seeded(5000));
    g.burnNow(); g.tick(1000);
    const a = advise({ cols: g.cols, chain: g.chain, timeLeft: g.timeLeft() });
    expect(a.stage).toBe('junk');
    expect(a.kind).toBe('move');
    expect(MENU.junk).toContain(a.routine);
    expect(a.reason.length).toBeGreaterThan(10);
    expect(playDrags(g.cols, a.drags)).not.toBeNull();
  });
  it('Stage II, in a chain: junk in the column going up next is taken out left, the mirror', () => {
    const cols = board([...column(0, 'KKKKbbbbb'), ...column(1, 'KKKKbbbb'), [9, 0, 'K']]);
    const a = advise({ cols, chain: 2, timeLeft: 12000 });
    expect(a.stage).toBe('chain');
    expect(a.kind).toBe('move');
    expect(MENU.chain).toContain(a.routine);
    expect(playDrags(cols, a.drags)![COLS - 1].every((p) => p === WHITE)).toBe(true);
  });
  it('the endgame\'s gamble, named plainly: CC^10 and a column that can\'t be filled in time is cashed in (the user, 12 Nov: "Russian roulette")', () => {
    // A black trapped on the bottom of the furnace's column (a tall one: nowhere lower to sink), nothing
    // near to free it, two seconds left.
    const flipped = Array.from({ length: COLS }, (_, x) => 'w'.repeat(x % 2 ? TALL : SHORT));
    const cols = board([...column(0, 'KKKKbbbb'), [9, 8, 'K']], flipped);
    const a = advise({ cols, chain: 10, timeLeft: 2000 });
    expect(a.kind).toBe('dismiss');
    expect(a.reason).toMatch(/gamble/);
    expect(a.reason).toMatch(/CC\^10/);
  });
});

describe('the start is sweeping, the techniques after (12 Nov)', () => {
  it('the start is quick sweeping drags, not careful little ones (12 Nov: "It\'s just quick drag motions ... go, go, go")', () => {
    const g = new Distilling(seeded(5000));
    g.burnNow(); g.tick(1000);
    const a = advise({ cols: g.cols, chain: 0, timeLeft: g.timeLeft() });
    expect(a.sweep).toBe(true);
    expect(a.label).toBe('The sweep');
    expect(a.drags).toHaveLength(1);
    expect(a.drags[0].ways.length).toBeGreaterThanOrEqual(3);
    // Swept blind: hardly a pause between them, every tier (the lower ones a bit slower).
    for (const t of TIERS) expect(t.sweepSpot).toBeLessThan(t.spot / 2);
    // A bot's first move is a sweep, and sweeps are what it plays most at the start.
    const plans: string[] = [];
    playSession(new Distilling(seeded(5001)), tierNamed('master'), 1, undefined, (p) => { if (p.kind === 'move') plans.push(p.label); });
    const first = plans.slice(0, 20), most = (l: string) => first.filter((x) => x === l).length;
    expect(first[0]).toBe('The sweep');
    for (const l of new Set(first)) expect(most('The sweep')).toBeGreaterThanOrEqual(most(l));
  });
  it('the techniques come in only once sweeping blind stops getting junk over (12 Nov: "it\'s only once you can\'t just do that blind ... that you start needing to do things")', () => {
    // The sweep's end: whites left, browns top right, blacks bottom right, nothing left to sweep.
    const cols = board([...column(6, 'bbbbKKKKK'), ...column(7, 'bbbbKKKK'), ...column(8, 'bbbbKKKKK'), ...column(9, 'bbbbKKKK')]);
    const ctx = contextFor(cols, 'junk', 0, 16);
    expect(sweepsOn(cols, ctx, HELIUM)).toHaveLength(0);
    const a = choose({ cols, chain: 0, timeLeft: 12000 }, ctx, HELIUM);
    expect(a.sweep).toBe(false);
    expect(a.routine).toBe('turnOver');
    expect(a.reason).toMatch(/zigzagging up the side/);
  });
});