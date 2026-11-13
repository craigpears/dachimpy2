/* Distilling's bots and their planner (src/distill-bots.ts): every tier the same plan, its techniques
   the routines of src/distill-routines.ts picked by stage, at a person's pace, by the rules (12 Nov). What
   each tier reaches is tools/distill-bots.mjs's to measure (DISTILLING.md §4). */
import { describe, expect, it } from 'vitest';
import { BLACK, BURN_TICKS, COLS, DOWN_RIGHT, Distilling, SHORT, TALL, UP_LEFT, UP_RIGHT, WHITE, neighbourOn, parseBoard } from '../src/distilling';
import { DistillBot, HELIUM, MENU, P, brownSweep, dangerZones, rightOrder, tieBreak, whitesInJunk, TIERS, advise, backward, choose, contextFor, judge, junkAcross, playSession, tierNamed, turnsIn, weigh } from '../src/distill-bots';
import type { Advice } from '../src/distill-bots';
import { ROUTINES, colourLeft, playDrags } from '../src/distill-routines';
import { blockPhase, boardScore, keptTools, trappedWhite } from '../src/distill-score';
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
    // furnace's own whites come first: here it has four, and the advice saves one with one quick drag (a long
    // plain one is still the sweep).
    const whites = (b: typeof g.cols) => b[COLS - 1].filter((p) => p === WHITE).length;
    expect(whites(g.cols)).toBeGreaterThan(0);
    expect(a.drags).toHaveLength(1);
    expect(whites(playDrags(g.cols, a.drags)!)).toBeLessThan(whites(g.cols));
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

describe('never a white burned (13 Nov, the twentieth and twenty-second notes)', () => {
  const ctxOf = (cols: Board) => contextFor(cols, 'junk', 0, 16);
  it('a white in the furnace\'s column is got out first, with the furnace far off and a sweep on offer, 13 Nov ("If you\'re playing well, you should never burn a white")', () => {
    // notes/distilling/37-*: whites low in the furnace's column, no one drag reaching them; with 12 s left the
    // planner used to sweep elsewhere and leave the two-drag rescue for the last seconds.
    const cols = parseBoard(['KKKwwKbKK', 'wwwKwbww', 'KwwKKw*Kw', 'bbwwbwbK', '*wKwKKbwb', 'bKwKbwKb', 'b*wKbbKbw', 'KwKbbKbw', 'KbwKKKbwK', 'bbKbbbww']);
    for (const style of [HELIUM, tierNamed('master'), tierNamed('ultimate')]) {
      const a = choose({ cols, chain: 0, timeLeft: 12000 }, ctxOf(cols), style);
      expect(a.kind).toBe('move');
      const whites = (b: Board) => b[COLS - 1].filter((p) => p === WHITE).length;
      expect(whites(playDrags(cols, a.drags)!)).toBeLessThan(whites(cols));
    }
  });
  it('whites low in the column before the fire, hard to reach, come before easy work up top, 13 Nov ("it doesn\'t seem fussed that you\'re only one column away from a couple of whites burning at the bottom ... that\'s your danger area that\'s hard to reach")', () => {
    // notes/distilling/39-*, read off the picture: the furnace's column all junk; the next has two whites low
    // down with no way out left on their own; a knot of whites round a spice in the bottom middle.
    const cols = parseBoard(['Kw*bbKKb', 'wbwww*KKw', 'bwwwwKKw', 'wKKwKKwwK', 'KwwwwwwK', 'wwbKbw*bw', 'bbKwwKww', '*wwwKKbww', 'bbKKbKww', 'b*bKbbbbK']);
    expect(dangerZones(cols, 'junk', true)).toEqual([COLS - 2]);
    const a = choose({ cols, chain: 0, timeLeft: 12000 }, ctxOf(cols), HELIUM);
    const nearFire = (b: Board) => b[COLS - 2].filter((p) => p === WHITE).length + b[COLS - 1].filter((p) => p === WHITE).length;
    expect(nearFire(playDrags(cols, a.drags)!)).toBeLessThan(nearFire(cols));
  });
  it('an early white must not burn: the Master on the board where it burned one in the first three columns gone, 13 Nov ("if you burn a white on the first column or the second column that goes up or down, that\'s catastrophic")', () => {
    for (const [tier, seed] of [['master', 5007]] as const) {
      const g = new Distilling(seeded(seed));
      let gone = 0, early = 0;
      playSession(g, tierNamed(tier), 2, (c) => { gone++; if (gone <= 3 && !c.up && c.whites > 0) early++; });
      expect(early, `${tier} on ${seed}`).toBe(0);
    }
  }, 60000);
});

describe('a brown a flick lower, for next to nothing (13 Nov, the twenty-first note)', () => {
  it('between two moves doing the same job, a swap or two apart, the one leaving the brown lower and a black above it wins; never one costing more, 13 Nov ("it\'s a little flick and a swish, and the brown can be one level lower")', () => {
    // notes/distilling/38-*: the bot's plain diagonal left a brown high on the right; the user's hook, a swap or two
    // longer, left it a row lower with a black lifted above it. Here the same two outcomes: the right-hand junk the
    // same pieces, the brown at the top of column 9, or one place lower under a black.
    const right = (c9: string) => board([...column(7, 'KKKKbbbb'), ...column(8, c9), ...column(9, 'KKKKbbbb')]);
    const cols = right('KKKKKbbbb');
    const plain = { move: { routine: 'diamond' as const, drags: [{ x: 0, y: 0, ways: [0, 0, 0] }], reason: '' }, value: 3, after: right('bKKKKbbbK') };
    const hook = { move: { routine: 'diamond' as const, drags: [{ x: 0, y: 0, ways: [0, 0, 3, 0, 3] }], reason: '' }, value: 2.4, after: right('KbKKKbbbK') };
    const long = { move: { routine: 'diamond' as const, drags: [{ x: 0, y: 0, ways: [0, 3, 0, 3, 0, 3] }], reason: '' }, value: 2, after: right('KKKKbbbbK') };
    expect(boardScore(hook.after)).toBe(boardScore(plain.after));
    expect(rightOrder(hook.after)).toBeGreaterThan(rightOrder(plain.after));
    const pick = tieBreak(cols, [plain, hook, long], plain);
    expect(pick.move).toBe(hook.move);
    expect(pick.tie).toBe(true);
    // Three swaps more is real moves: not taken, however tidy.
    expect(tieBreak(cols, [plain, long], plain).move).toBe(plain.move);
    // Nor a move doing less of the job.
    const less = { ...hook, after: right('KbKKKbbbw') };
    expect(tieBreak(cols, [plain, less], plain).move).toBe(plain.move);
  });
});

describe('the block phase: the junk in blocks, the V, a brown kept bottom-left (13 Nov, the twenty-third to twenty-fifth notes)', () => {
  // notes/distilling/40-whites-left-now-move-junk-in-blocks.webp, read off the picture: the whites a big block on
  // the left and middle, the right three columns junk, a brown and a black in the left-hand corners.
  const board40 = () => parseBoard(['KwwwKwwbK', 'Kw*wwKKw', 'wbwww*wKw', 'KwwwwwwK', 'wwwbwwwKw', 'wbbwwwww', 'bwwwww*wK', 'bbKKKKbK', '*bKbKKbKK', 'bbKKbKbK']);
  const play = (cols: Board, n: number) => {
    const drags: number[] = [];
    let b = cols;
    for (let i = 0; i < n; i++) {
      const a = choose({ cols: b, chain: 0, timeLeft: 12000 }, contextFor(b, 'junk', 0, 16), HELIUM);
      if (a.kind !== 'move') break;
      for (const d of a.drags) drags.push(d.ways.length);
      b = playDrags(b, a.drags)!;
    }
    return { drags, b };
  };
  it('once the whites are mostly left, fewer small fiddly drags: the junk moved in long ones, 13 Nov ("it\'s doing a lot of little fiddly things ... I would just start pulling, like treating it more like blocks of things to move")', () => {
    const cols = board40();
    expect(blockPhase(cols)).toBe(true);
    const was = P.BLOCK_DRAG_MS;
    try {
      P.BLOCK_DRAG_MS = 0;
      const fiddly = play(cols, 8);
      P.BLOCK_DRAG_MS = was;
      const blocks = play(cols, 8);
      const small = (d: number[]) => d.filter((n) => n <= 2).length;
      expect(small(blocks.drags)).toBeLessThan(small(fiddly.drags));
      expect(blocks.drags.length).toBeLessThan(fiddly.drags.length);
    } finally { P.BLOCK_DRAG_MS = was; }
  });
  it('the brown in the bottom-left and the black in the top-left are kept as tools, 13 Nov ("one black in the top left, one brown in the bottom left can be useful ... you don\'t want to just get too greedy")', () => {
    const cols = board40();
    expect(keptTools(cols)).toEqual({ brown: true, black: true });
    expect(keptTools(play(cols, 8).b)).toEqual({ brown: true, black: true });
    // Spending the last one costs the score, in the block phase only.
    const spent = parseBoard(['KwwwKwwwK', 'Kw*wwKKw', 'wbwww*wKw', 'KwwwwwwK', 'wwwbwwwKw', 'wbbwwwww', 'bwwwww*wK', 'bbKKKKbK', '*bKbKKbKK', 'bbKKbKbb']);
    expect(boardScore(cols, true) - boardScore(spent, true)).toBeGreaterThan(boardScore(cols) - boardScore(spent));
  });
  it('the V\'s bottom arm: a brown along the bottom under the whites scores, a black there doesn\'t, 13 Nov ("you want the V to be made of ... browns there, preferably more than blacks")', () => {
    const right = [...column(7, 'KKKKbbbb'), ...column(8, 'KKKKbbbbb'), ...column(9, 'KKKKbbbb')];
    const brown = board([[3, 7, 'b'], ...right]), black = board([[3, 7, 'K'], ...right]);
    const vTerm = (b: Board) => boardScore(b, true) - boardScore(b);
    expect(vTerm(brown)).toBeGreaterThan(vTerm(black));
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