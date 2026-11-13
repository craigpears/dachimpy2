/* Distilling's bots and their planner (src/distill-bots.ts): every tier the same plan, its techniques
   the routines of src/distill-routines.ts picked by stage, at a person's pace, by the rules (12 Nov). What
   each tier reaches is tools/distill-bots.mjs's to measure (DISTILLING.md §4). */
import { describe, expect, it } from 'vitest';
import { BLACK, BURN_TICKS, COLS, DOWN_RIGHT, Distilling, SHORT, TALL, UP_LEFT, UP_RIGHT, WHITE, neighbourOn, parseBoard } from '../src/distilling';
import { DistillBot, HELIUM, MENU, brownSweep, whitesInJunk, TIERS, advise, backward, choose, contextFor, judge, junkAcross, playSession, tierNamed, turnsIn, weigh } from '../src/distill-bots';
import type { Advice } from '../src/distill-bots';
import { ROUTINES, colourLeft, playDrags } from '../src/distill-routines';
import { trappedWhite } from '../src/distill-score';
import type { Drag, RoutineName } from '../src/distill-routines';
import type { Board } from '../src/distilling';
import { seeded } from '../src/mirror-row';

/** The slow techniques (the seventh note: "very action heavy"). */
const SLOW: readonly RoutineName[] = ['crawl', 'turnOver', 'linePull', 'figureEight', 'hook', 'leapfrog'];

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
    // Since 13 Nov (the nineteenth note: the bots got stuck with whites left in the columns next to burn) the
    // furnace's own whites come first: here it has four, and the advice saves one with one quick drag.
    expect(g.cols[COLS - 1].filter((p) => p === WHITE).length).toBeGreaterThan(0);
    expect(a.label).toBe('Save the whites');
    expect(a.drags).toHaveLength(1);
    // Swept blind: hardly a pause between them, every tier (the lower ones a bit slower).
    for (const t of TIERS) expect(t.sweepSpot).toBeLessThan(t.spot / 2);
    // A bot's first move is one quick drag (since 13 Nov, with the score "about filling those right-hand
    // columns", that can be a white saved out of the column next to burn, finishing it), never a slow
    // technique, and at the start plain drags (sweeps, the diamond's runs) come at least as often as the slow
    // techniques.
    const plans: Advice[] = [];
    playSession(new Distilling(seeded(5001)), tierNamed('master'), 1, undefined, (p) => { if (p.kind === 'move') plans.push(p); });
    const first = plans.slice(0, 20);
    expect(first[0].drags).toHaveLength(1);
    expect(SLOW).not.toContain(first[0].routine);
    const plain = first.filter((p) => p.routine === 'diamond').length, slow = first.filter((p) => SLOW.includes(p.routine!)).length;
    expect(plain).toBeGreaterThanOrEqual(slow);
  });
});
describe('the cheapest technique that still works (12 Nov, the seventh to tenth notes)', () => {
  const ctxOf = (cols: Board, scarce?: boolean) => ({ ...contextFor(cols, 'junk', 0, 16), ...(scarce === undefined ? {} : { scarce }) });
  it('half a board of colour gets no turn-over (12 Nov: "When you\'ve got, like, half the board is color, you don\'t need those techniques")', () => {
    // The sweep's end, but five columns of colour on the right: browns on top, blacks below.
    const cols = board([5, 6, 7, 8, 9].flatMap((x) => column(x, x % 2 === 0 ? 'bbbbKKKKK' : 'bbbbKKKK')));
    expect(colourLeft(cols)).toBeGreaterThan(0.45);
    expect(ROUTINES.turnOver.find(cols, ctxOf(cols))).toHaveLength(0);
    expect(choose({ cols, chain: 0, timeLeft: 12000 }, ctxOf(cols), HELIUM).routine).not.toBe('turnOver');
  });
  it('four columns of junk waiting get no sorting drag (12 Nov: "I\'m not going to waste my time organizing stuff that\'s going to get burned")', () => {
    // Four junk columns on the right, and a black on the bottom left under browns it could be lifted through.
    const cols = board([...[6, 7, 8, 9].flatMap((x) => column(x, x % 2 === 0 ? 'bbbbKKKKK' : 'bbbbKKKK')), [0, 8, 'K'], [1, 7, 'b'], [2, 7, 'b']]);
    const ctx = ctxOf(cols);
    expect(ROUTINES.store.find(cols, ctx)).toHaveLength(0);
    expect(ROUTINES.turnOver.find(cols, ctx)).toHaveLength(0);
    expect(['store', 'turnOver']).not.toContain(choose({ cols, chain: 0, timeLeft: 12000 }, ctx, HELIUM).routine);
  });
  it('when the two halves are close, plain drags, not a crawl (12 Nov: "all you need to do is drag the blacks down, the browns up. You could get, like, 10 pieces over")', () => {
    // notes/distilling/17-two-halves-close.webp, roughly: colour on the left, a gap of whites, junk on the right.
    const cols = parseBoard(['KwwwKbwbw', 'KwKwwbwb', 'wwKwwwbwb', 'wKwwwwbw', 'wwwwwwwww', 'wwwwwwww', 'KbKbKKbbb', 'KKbKbKbb', 'KbKbKKbbK', 'bKKKbbbb']);
    const ctx = ctxOf(cols);
    const a = choose({ cols, chain: 0, timeLeft: 12000 }, ctx, HELIUM);
    expect(a.sweep).toBe(true);
    expect(a.label).toBe('The sweep');
    expect(a.drags).toHaveLength(1);
    expect([BLACK, 1]).toContain(cols[a.drags[0].x][a.drags[0].y]);
  });
  it('another piece rather than a loop (12 Nov: "I\'ve got another black piece further up. I can just drag it down, fill in the gap, and then go brown up, down, up")', () => {
    // notes/distilling/18-another-black-not-a-loop.webp, roughly: a brown low in the middle with no way over
    // alone, a black higher up to its left.
    // Its way up-right is shut by a spice; a black dragged down into the gap below opens it.
    const cols = board([[3, 7, 'b'], [5, 6, '*'], [2, 6, 'K'], ...column(7, 'wwwwwbbb'), ...column(8, 'wwwwwwbbb'), ...column(9, 'KKKKbbbb')]);
    const ctx = ctxOf(cols, false);
    const ranked = weigh({ cols, chain: 0, timeLeft: 12000 }, ctx, HELIUM);
    const way = ranked.find((m) => m.move.drags.length === 2 && m.move.drags[1].x === 3 && m.move.drags[1].y === 7 && /another piece/.test(m.move.reason));
    expect(way).toBeDefined();
    // The black first, into the gap; every swap of the plan goes the right way.
    expect(cols[way!.move.drags[0].x][way!.move.drags[0].y]).toBe(BLACK);
    expect(backward(cols, way!.move.drags, 'junk')).toBe(0);
    const loop = ranked.find((m) => m.move.routine === 'crawl');
    if (loop) expect(way!.value).toBeGreaterThan(loop.value);
  });
});

describe('nothing trapped (13 Nov, the eighteenth note)', () => {
  /** Whites trapped on a board (src/distill-score.ts, trappedWhite). */
  const trappedWhites = (cols: Board) => cols.flatMap((c, x) => c.map((_, y) => [x, y] as const)).filter(([x, y]) => trappedWhite(cols, x, y)).length;
  it('the bot\'s very first move doesn\'t drag a white up to the top and trap it, 13 Nov ("the very first thing they did was to drag this white upwards ... so that there was a white trap right at the top. So I don\'t know how that\'s following the instruction of don\'t trap things")', () => {
    // notes/distilling/35- and 36-*: the test page's first board (seed 1). The old first move took the white
    // second from the top of the second column from the right up-left twice, to the top of column 7, where its
    // only way left was a white: trapped.
    for (const t of TIERS) for (let seed = 1; seed <= 6; seed++) {
      const g = new Distilling(seeded(seed)), cols = g.cols;
      const a = new DistillBot(t).plan(g);
      if (a.kind !== 'move') continue;
      const after = playDrags(cols, a.drags)!;
      expect(trappedWhites(after), `${t.name} on seed ${seed}`).toBeLessThanOrEqual(trappedWhites(cols));
      if (seed === 1) expect(after[6][0] === WHITE && cols[6][0] !== WHITE, t.name).toBe(false);
    }
  });
  it('the brown sweep to the bottom right waits till the columns next to burn are clear of white, 13 Nov ("it\'s very good. But it\'s just like it leaves one or two trapped whites ... it\'s being applied a bit too quickly before those columns have been cleared")', () => {
    // Played over whole sessions: every brown sweep made while a white was still in the junk columns next to
    // burn took a white out of them; once they were clear, the sweep was played as before.
    let free = 0;
    for (const seed of [5000, 5001]) {
      const g = new Distilling(seeded(seed));
      playSession(g, tierNamed('master'), 30, undefined, (a) => {
        if (a.stage !== 'junk' || a.kind !== 'move' || !brownSweep(g.cols, a.drags)) return;
        const ctx = contextFor(g.cols, 'junk', 0, 16), was = whitesInJunk(g.cols, ctx.burnFrom);
        if (was === 0) { free++; return; }
        expect(whitesInJunk(playDrags(g.cols, a.drags)!, ctx.burnFrom)).toBeLessThan(was);
      });
    }
    expect(free).toBeGreaterThan(0);
  }, 60000);
  it('a white stuck where no routine frees it gets a piece brought round (the path search, "a pathfinding A-star style problem")', () => {
    // The user's shape: a white on the top of column 7, the white below-left of it its only way left, a black
    // further left in its row; the brown that can take its place is below-right of it, and has to go left
    // first. A planner knowing no routines that would free it (none here) searches, and plays it.
    const cols = parseBoard(['wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'Kwwwwwwww', 'wwKKKKKK', 'wwKKKKKKK', 'KbKKKKKK', 'KKKKbbbbb', 'KKKKbbbb']);
    expect(trappedWhite(cols, 6, 0)).toBe(true);
    const ctx = contextFor(cols, 'junk', 0, 16);
    const searching = { ...HELIUM, routines: [] };
    const loop = weigh({ cols, chain: 0, timeLeft: 12000 }, ctx, searching).find((m) => m.move.routine === 'path' && m.move.drags[0].x === 7);
    expect(loop?.move.drags).toEqual([{ x: 7, y: 1, ways: [UP_LEFT, UP_LEFT, UP_RIGHT] }]);
    expect(trappedWhites(playDrags(cols, loop!.move.drags)!)).toBeLessThan(trappedWhites(cols));
    const a = choose({ cols, chain: 0, timeLeft: 12000 }, ctx, searching);
    expect(a.technique).toBe('path');
    expect(a.label).toBe('Bring a piece round');
    // Named for anyone keyed by the routines' names ("Help, Helium"): the nearest, the hook.
    expect(a.routine).toBe('hook');
    // Without the search, nothing.
    expect(choose({ cols, chain: 0, timeLeft: 12000 }, ctx, { ...HELIUM, routines: [], path: false }).kind).not.toBe('move');
  });
});

describe('judging the board, one drag ahead (12 Nov, the eleventh note)', () => {
  const ctxOf = (cols: Board) => contextFor(cols, 'junk', 0, 16);
  const ups = (drags: readonly Drag[]) => drags.flatMap((d) => d.ways).filter((w) => w === UP_RIGHT || w === UP_LEFT).length;
  it('an early board: a black is dragged down-right into the junk, not up, 12 Nov ("you want blacks to the bottom right at this stage")', () => {
    // notes/distilling/21-a-diagonal-of-blacks.webp's mistake: blacks in the whites on the left, the junk on the
    // right with browns it could climb through. Early: plenty of colour.
    const cols = board([...column(0, 'KKKKKKKKK'), ...column(1, 'KKKKKKKK'), ...column(2, 'KwKwKwKwK'),
      ...column(7, 'bbbbbbbb'), ...column(8, 'bbbbbbbbK'), ...column(9, 'bbbbbbbK')]);
    expect(colourLeft(cols)).toBeGreaterThan(0.45);
    const a = choose({ cols, chain: 0, timeLeft: 12000 }, ctxOf(cols), HELIUM);
    expect(a.kind).toBe('move');
    expect(a.drags).toHaveLength(1);
    const [d] = a.drags;
    expect(cols[d.x][d.y]).toBe(BLACK);
    // Down-right across the whites to the bottom, a step into the junk at most; never on up through the browns.
    expect(d.ways[0]).toBe(DOWN_RIGHT);
    expect(ups(a.drags)).toBeLessThanOrEqual(1);
    let [x, y] = [d.x, d.y];
    for (const w of d.ways) [x, y] = neighbourOn(cols, x, y, w)!;
    expect(x).toBeGreaterThanOrEqual(6);
    expect(y).toBeGreaterThan(d.y);
  });
  it('between a plain drag and a crawl that get the same junk over, the plain drag wins, 12 Nov ("quick drag brown up, black down, done")', () => {
    // A black and a brown side by side in the whites, the junk on the right.
    const cols = board([[3, 4, 'K'], [4, 4, 'b'], ...column(8, 'KKKKbbbbb'), ...column(9, 'KKKKbbbb')]);
    // The crawl, looping them round each other (by the rules, checked): the black up past the brown and down,
    // the brown up, then each on again in turn; each two columns over.
    const crawl: Drag[] = [{ x: 3, y: 4, ways: [UP_RIGHT, DOWN_RIGHT] }, { x: 3, y: 4, ways: [UP_RIGHT] }, { x: 5, y: 4, ways: [UP_LEFT] }, { x: 5, y: 4, ways: [UP_RIGHT] }, { x: 4, y: 4, ways: [DOWN_RIGHT] }];
    const after = playDrags(cols, crawl)!;
    expect(after).not.toBeNull();
    expect(turnsIn(crawl)).toBeGreaterThan(0);
    // The same got over by plain drags: the black straight down-right, the brown straight up-right.
    const plain: Drag[] = [{ x: 3, y: 4, ways: [DOWN_RIGHT, DOWN_RIGHT] }, { x: 4, y: 4, ways: [UP_RIGHT, UP_RIGHT] }];
    const plainAfter = playDrags(cols, plain)!;
    expect(plainAfter).not.toBeNull();
    expect(junkAcross(plainAfter)).toBe(junkAcross(after));
    expect(judge(cols, plain, HELIUM)!.value).toBeGreaterThan(judge(cols, crawl, HELIUM)!.value);
  });
});