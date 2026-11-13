/* Distilling's bots and their planner (src/distill-bots.ts): every bot the same plan, a target chain each, its
   techniques the routines of src/distill-routines.ts picked by stage, at a person's pace, by the rules (12 Nov).
   What each reaches is tools/distill-bots.mjs's to measure (DISTILLING.md §4). */
import { describe, expect, it } from 'vitest';
import { BLACK, BROWN, BURN_TICKS, COLS, DOWN_RIGHT, Distilling, SHORT, TALL, UP_LEFT, UP_RIGHT, WHITE, neighbourOn, parseBoard } from '../src/distilling';
import { DistillBot, HELIUM, LEVELS, MENU, P, PAIR_LABEL, chainContext, chainOver, chainZones, nextChainAt, bankFor, brownSweep, clearComingUp, dangerZones, edgeWhites, joinedUp, levelFor, rightOrder, tieBreak, whitesInJunk, advise, backward, choose, contextFor, judge, junkAcross, levelNamed, playSession, tierNamed, turnsIn, weigh } from '../src/distill-bots';
import type { Advice } from '../src/distill-bots';
import { ROUTINES, canGo, colourLeft, playDrags } from '../src/distill-routines';
import { behindSpice, blockPhase, boardScore, keptTools, trappedWhite } from '../src/distill-score';
import type { Drag, RoutineName } from '../src/distill-routines';
import type { Board } from '../src/distilling';
import { seeded } from '../src/mirror-row';
import { bringRound, pairRescue } from '../src/distill-path';
import { STUCK_ON_TOP } from '../src/distill-guide';
import { chainOver as heliumChainOver } from '../src/den-helium';

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
  it('none faster than 6 swaps a second along a drag (a swap slides 150 ms)', () => {
    for (const t of LEVELS) expect(t.rate).toBeLessThanOrEqual(6);
  });
  it('every bot plays the same plan, only with fewer techniques lower down (the user: "It\'s always whites to the left")', () => {
    for (const t of LEVELS) for (const r of ['rescue', 'junkColumn', 'diamond', 'channel'] as const) expect(t.routines).toContain(r);
    for (let i = 1; i < LEVELS.length; i++) for (const r of LEVELS[i - 1].routines) expect(LEVELS[i].routines).toContain(r);
  });
  it('never burn a white when a rescue was possible (12 Nov: the bot "just went down and burnt" a white)', () => {
    // A white in the furnace's column, one swap from safety, and under two seconds on the furnace.
    for (const t of LEVELS) {
      const g = new Distilling(seeded(3)).lay(board([...column(9, 'KKKwKKKK'), [8, 3, 'K'], ...column(0, 'KbKbKbKbK'), ...column(1, 'bKbKbKbK')]));
      g.furnace = BURN_TICKS - 5;
      expect(g.timeLeft()).toBeLessThan(2000);
      const out: number[][] = [];
      playSession(g, t, 0.1, (c) => out.push(c.pieces));
      expect(out.length).toBeGreaterThan(0);
      expect(out[0].filter((p) => p === WHITE)).toHaveLength(0);
    }
  }, 90000);   // (every level in turn: past the 20 s default with agents running beside it)
  it('never burn a column with a white in it on purpose', () => {
    for (const t of LEVELS.slice(1)) {
      const g = new Distilling(seeded(5003));
      playSession(g, t, 3, undefined, (a) => { if (a.kind === 'burn' && a.stage === 'junk') expect(g.cols[COLS - 1]).not.toContain(WHITE); });
    }
  }, 60000);
  it('play a whole session by the rules at their own pace, and it ends', () => {
    for (const t of LEVELS) {
      const g = new Distilling(seeded(5000));
      const r = playSession(g, t, 3);
      expect(r.swaps / (r.minutes * 60)).toBeLessThanOrEqual(t.rate);
      expect(g.finished || g.time >= 3 * 60000).toBe(true);
      expect(r.columnsUp + r.columnsBurned).toBe(g.columns.length);
    }
    // (the board reader made the high levels' sessions slower to plan: 62 s under a full run's load, 13 Nov)
  }, 180000);
  it('play techniques as whole drags, several swaps each, not a click a swap (the user, 12 Nov: "a human doesn\'t have time for those little swaps")', () => {
    const r = playSession(new Distilling(seeded(5001)), levelNamed('cc3'), 4);
    expect(r.swaps / r.drags).toBeGreaterThan(2);
  });
  it('never burns a column by hand, 13 Nov ("definitely get rid of manual burns ... that\'s why no one\'s getting past CC2 ... just don\'t ever do that. Never.")', () => {
    for (const name of ['cc1', 'cc3']) {
      const g = new Distilling(seeded(5002));
      playSession(g, levelNamed(name), 4, undefined, (a) => expect(a.kind).not.toBe('burn'));
    }
    // The furnace's column all junk and nothing much to do: still not burned by hand, by a bot or by Helium.
    const right = [...column(7, 'KKKKbbbb'), ...column(8, 'KKKKbbbbb'), ...column(9, 'KKKKbbbb')];
    const clearBoard = board(right);
    expect(clearComingUp(clearBoard)).toBe(true);
    expect(choose({ cols: clearBoard, chain: 0, timeLeft: 12000 }, contextFor(clearBoard, 'junk', 0, 14), levelNamed('cc8')).kind).not.toBe('burn');
    expect(advise({ cols: clearBoard, chain: 0, timeLeft: 12000 }).kind).not.toBe('burn');
  }, 60000);
});

describe('the bots are their target chains, 13 Nov (the thirtieth note: "I want to say what is the bot\'s target crystal clear and it will try and work towards it")', () => {
  it('a ladder of targets, CC^1 up, named by them, the old tier names the nearest level', () => {
    expect(LEVELS.map((l) => l.target)).toEqual([1, 2, 3, 5, 8]);
    expect(LEVELS.map((l) => l.name)).toEqual(['cc1', 'cc2', 'cc3', 'cc5', 'cc8']);
    expect(levelNamed('cc2').label).toBe('CC^2');
    expect(levelNamed('ultimate').target).toBe(8);
    expect(levelNamed('learner').target).toBe(1);
    expect(tierNamed('master')).toBe(levelNamed('cc3'));
    expect(levelFor(4).target).toBe(3);
    // One pace for all: the levels are their targets, not their speed.
    for (const l of LEVELS) { expect(l.rate).toBe(LEVELS[0].rate); expect(l.spot).toBe(LEVELS[0].spot); }
  });
  it('the higher the target, the more whites banked before the chain, up to 6 columns', () => {
    for (let i = 1; i < LEVELS.length; i++) expect(bankFor(LEVELS[i].target)).toBeGreaterThanOrEqual(bankFor(LEVELS[i - 1].target));
    expect(bankFor(3)).toBeGreaterThan(bankFor(1));
    // Never more than 6 columns: banking 7 left the CC^8 bot in Stage I nearly all session (13 Nov, the twelfth run),
    // as banking 7 or 8 made every bot worse in the second run (12 Nov).
    for (const l of LEVELS) expect(bankFor(l.target)).toBeLessThanOrEqual(6);
  });
  it('low targets use the simple techniques; the crawl and the hook from CC^5, the figure of eight and line pull for CC^8 ("a CC^2 with the simple ones, the crawls and hooks only for the longer chains")', () => {
    for (const l of LEVELS.filter((x) => x.target < 5)) for (const r of ['crawl', 'hook', 'figureEight', 'linePull'] as const) expect(l.routines).not.toContain(r);
    expect(levelNamed('cc5').routines).toEqual(expect.arrayContaining(['crawl', 'hook']));
    expect(levelNamed('cc8').routines).toEqual(expect.arrayContaining(['figureEight', 'linePull']));
    expect([...levelNamed('cc8').routines].sort()).toEqual(Object.keys(ROUTINES).sort());
  });
  it('never dismisses: when a chain breaks it goes back to building toward the next ("then it will start working on the next one")', () => {
    let chained = false, rebuilt = false;
    // (Seed 5000: on 5002, since the pair rescue (13 Nov), its chains of 3, 4 and 1 each break with whites still banked,
    // so it chains them again and never needs to rebuild in 8 minutes.)
    const r = playSession(new Distilling(seeded(5000)), levelNamed('cc2'), 8, undefined, (a) => {
      expect(a.kind).not.toBe('dismiss');
      expect(a.target).toBe(2);
      expect(a.whitesNeeded).toBeGreaterThanOrEqual(0);
      if (a.stage === 'chain') chained = true; else if (chained) rebuilt = true;
    });
    expect(chained).toBe(true);
    expect(rebuilt).toBe(true);
    expect(r.dismissed).toBe(false);
    expect(r.chains.length).toBeGreaterThan(0);
  }, 60000);
  it('advise says its target and the whites still needed for it, for Helium to say ("our goal is to get one column full of white pieces")', () => {
    const g = new Distilling(seeded(5000));
    const two = advise({ cols: g.cols, chain: 0, timeLeft: g.timeLeft() }, { target: 2 });
    expect(two.target).toBe(2);
    // (A CC^2 banks two columns of whites, which a fresh board already has: it's in the chain from the start, 13 Nov:
    // "once it's got a crystal clear one, it will start sending them up"; a CC^8 banks six, still to gather.)
    expect(two.stage).toBe('chain');
    const top = advise({ cols: g.cols, chain: 0, timeLeft: g.timeLeft() });
    expect(top.target).toBe(8);
    expect(top.stage).toBe('junk');
    expect(top.whitesNeeded).toBeGreaterThan(0);
    // In the chain: the whites still missing from the columns going up for it, none once it's reached.
    const cols = board([...column(0, 'KKKKbbbbb'), ...column(1, 'KKKKbbbb'), [9, 0, 'K']]);
    expect(advise({ cols, chain: 1, timeLeft: 12000 }, { target: 2 }).whitesNeeded).toBe(1);
    expect(advise({ cols, chain: 2, timeLeft: 12000 }, { target: 2 }).whitesNeeded).toBe(0);
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
    for (const t of LEVELS) expect(t.sweepSpot).toBeLessThan(t.spot / 2);
    // A bot's first move is one quick drag (since 13 Nov, with the score "about filling those right-hand
    // columns", that can be a white saved out of the column next to burn, finishing it), never a slow
    // technique, and at the start plain drags (sweeps, the diamond's runs) come at least as often as the slow
    // techniques.
    const plans: Advice[] = [];
    playSession(new Distilling(seeded(5001)), levelNamed('cc3'), 1, undefined, (p) => { if (p.kind === 'move') plans.push(p); });
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
    // (The routines' own ranking, beneath the board reader: since 13 Nov the reader sees column 9's top whites over
    // browns, 27 s from the fire, and works them first, tests/distill-read.test.ts.)
    const was = P.READ;
    P.READ = 0;
    let ranked: ReturnType<typeof weigh>;
    try { ranked = weigh({ cols, chain: 0, timeLeft: 12000 }, ctx, HELIUM); } finally { P.READ = was; }
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
    for (const t of LEVELS) for (let seed = 1; seed <= 6; seed++) {
      const g = new Distilling(seeded(seed)), cols = g.cols;
      const bot = new DistillBot(t), a = bot.plan(g);
      // (Stage I's rule: a bot already in the chain from the first look, CC^1 and CC^2 with a column or two banked on a
      // fresh board, brings whites right, out of the buffer columns into the one it fills, 13 Nov.)
      if (a.kind !== 'move' || bot.stage === 'chain') continue;
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
      playSession(g, levelNamed('cc8'), 30, undefined, (a) => {
        if (a.stage !== 'junk' || a.kind !== 'move' || !brownSweep(g.cols, a.drags)) return;
        const ctx = contextFor(g.cols, 'junk', 0, 16), was = whitesInJunk(g.cols, ctx.burnFrom);
        if (was === 0) { free++; return; }
        expect(whitesInJunk(playDrags(g.cols, a.drags)!, ctx.burnFrom)).toBeLessThan(was);
      });
    }
    expect(free).toBeGreaterThan(0);
  }, 180000);
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
    for (const style of [HELIUM, levelNamed('cc3'), levelNamed('cc8')]) {
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
    // (the column before the fire first; since 13 Nov the next one too, for a white on its edge, the twenty-sixth note)
    expect(dangerZones(cols, 'junk', true)[0]).toBe(COLS - 2);
    const a = choose({ cols, chain: 0, timeLeft: 12000 }, ctxOf(cols), HELIUM);
    const nearFire = (b: Board) => b[COLS - 2].filter((p) => p === WHITE).length + b[COLS - 1].filter((p) => p === WHITE).length;
    expect(nearFire(playDrags(cols, a.drags)!)).toBeLessThan(nearFire(cols));
  });
  it('an early white must not burn: the Master on the board where it burned one in the first three columns gone, 13 Nov ("if you burn a white on the first column or the second column that goes up or down, that\'s catastrophic")', () => {
    for (const [tier, seed] of [['cc3', 5007]] as const) {
      const g = new Distilling(seeded(seed));
      let gone = 0, early = 0;
      playSession(g, levelNamed(tier), 2, (c) => { gone++; if (gone <= 3 && !c.up && c.whites > 0) early++; });
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
    // (The drag's cost on the routines' own ranking, beneath the board reader: since 13 Nov the reader sorts the V's
    // tail here first, tests/distill-read.test.ts, its drags costed the same way.)
    // (And beneath the goals, src/distill-goals.ts: since 13 Nov no drag is a half move, which takes most of the fiddly
    // ones away by itself, tests/distill-goals.test.ts.)
    const was = P.BLOCK_DRAG_MS, read = P.READ, goals = P.GOALS;
    try {
      P.READ = 0;
      P.GOALS = 0;
      P.BLOCK_DRAG_MS = 0;
      const fiddly = play(cols, 8);
      P.BLOCK_DRAG_MS = was;
      const blocks = play(cols, 8);
      const small = (d: number[]) => d.filter((n) => n <= 2).length;
      expect(small(blocks.drags)).toBeLessThan(small(fiddly.drags));
      expect(blocks.drags.length).toBeLessThan(fiddly.drags.length);
    } finally { P.BLOCK_DRAG_MS = was; P.READ = read; P.GOALS = goals; }
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

describe('watching the CC^8 on seed 1 (13 Nov, the twenty-sixth and twenty-ninth notes)', () => {
  // The user's board, seed 1 replayed with the Ultimate to its 27th plan: a white at the top of the third column
  // from the fire, a spice below-left of it, another white on that column's bottom.
  const user = () => parseBoard('KKKwwKbKK wwKwwbKb wwbwwb*ww bwwwwwww *KwwKwbwb bwwKbKbK K*KKbbKbw wbKbbKKw KbbKKKbKK bKKbbbbb'.split(' '));
  it('a white at the top by the fire, beside a spice, is got out before it\'s walled in, 13 Nov ("It even moved some blacks in the way at the top that actually block getting that white piece out easily ... Why have you blocked it all in?")', () => {
    let cols = user();
    expect(edgeWhites(cols)).toContainEqual({ x: 7, y: 0 });
    expect(dangerZones(cols, 'junk', true)).toContain(7);
    expect(canGo(cols, 7, 0, -1)).toBe(true);
    const ctx = () => contextFor(cols, 'junk', 0, 14);
    // No move it would weigh takes the white's way out away.
    for (const m of weigh({ cols, chain: 0, timeLeft: 12000 }, ctx(), levelNamed('cc8'))) {
      expect(m.after![7][0] !== WHITE || canGo(m.after!, 7, 0, -1), JSON.stringify(m.move.drags)).toBe(true);
    }
    // Played on: within a move or two both whites on the column's edges are out of the fire's side, each move
    // getting one of them out.
    for (let i = 0; i < 2 && edgeWhites(cols).length; i++) {
      const was = edgeWhites(cols).length, a = choose({ cols, chain: 0, timeLeft: 12000 }, ctx(), levelNamed('cc8'));
      expect(a.kind).toBe('move');
      cols = playDrags(cols, a.drags)!;
      expect(edgeWhites(cols).length).toBeLessThan(was);
    }
    expect(cols[7][0]).not.toBe(WHITE);
  });
  it('a block move is carried on into the junk, not let go one short among the whites, 13 Nov ("It has decided to just leave it one short. Why? Like, there was an extra move there")', () => {
    // The whites a block on the left, the junk the right three columns; a black among the whites dragged down-right.
    const cols = parseBoard(['KwwwwwwwK', 'wwwwwwww', 'wwwwKwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwwb', 'wwwwwwwwK', 'bbbbKKKK', 'bbbbKKKKK', 'bbbbKKKK']);
    expect(blockPhase(cols)).toBe(true);
    const drag = [{ x: 2, y: 4, ways: [DOWN_RIGHT, DOWN_RIGHT, DOWN_RIGHT, DOWN_RIGHT] }];
    const was = P.CARRY, onward = P.ONWARD;
    try {
      // (The onward carry, the thirty-second note's, off too: it carries this one on as well.)
      // (Since 13 Nov, later, "keep running things until it stops": a drag's let go where the board's best, the
      // longest such, so it goes all the way in even with both carries off.)
      P.CARRY = 0; P.ONWARD = 0;
      const carried = judge(cols, drag, HELIUM, undefined, true)!;
      expect(carried.drags[0].ways).toHaveLength(4);
      expect(carried.value).toBeGreaterThan(0);
      P.CARRY = was;
      const end = (n: number): [number, number] => { let at: [number, number] = [2, 4]; for (let i = 0; i < n; i++) at = neighbourOn(cols, at[0], at[1], DOWN_RIGHT)!; return at; };
      expect(joinedUp(playDrags(cols, [{ ...drag[0], ways: drag[0].ways.slice(0, 3) }])!, end(3))).toBe(false);
      expect(joinedUp(playDrags(cols, carried.drags)!, end(4))).toBe(true);
      P.CARRY = 0; P.ONWARD = onward;
      expect(judge(cols, drag, HELIUM, undefined, true)!.drags[0].ways).toHaveLength(4);
    } finally { P.CARRY = was; P.ONWARD = onward; }
  });
});
describe('whites burned later in a session, traced (13 Nov, the thirteenth run: "If you\'re playing well, you should never burn a white")', () => {
  it('after a chain breaks, the whites still banked on the right are sent up as a new chain, not filled with junk and burned', () => {
    // CC^5 on seed 5001 (the twelfth run's code): one chain, then back in Stage I with the bank still on the right,
    // every column that reached the fire mostly white, filled with junk by the bot and burned, a white or two each
    // time: 20 in the session.
    const g = new Distilling(seeded(5001)), bot = new DistillBot(levelNamed('cc5'));
    // The right-hand six columns the bank's leftovers, the junk on the left: too few whites for a fresh bank.
    g.cols = parseBoard(['KKKKbbbbb', 'KKKKbbbb', 'KKKKbbbbb', 'KKKKbbbb', 'wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwwK', 'bwwwwwwwK', 'wwwwwwwK']);
    bot.chained = true;
    expect(bot.plan(g).stage).toBe('chain');
    expect(bot.burns).toBe(0);
    // Before any chain, a mostly white column by the fire is still Stage I's to clear.
    const fresh = new DistillBot(levelNamed('cc8'));
    expect(fresh.plan(g).stage).toBe('junk');
  });
  it('a white in a column to burn is got out by a piece brought round from the left, not a brown taken in from the column and back, another white swapped in behind it', () => {
    // CC^3 on seed 5000 (the twelfth run's code): the chain's last junk column to burn, a white stuck in it; the
    // path search's cheapest move took the brown below it out and back, the white out and another in, so it saved
    // nothing, and the bot waited 15 s while it burned.
    const cols = parseBoard(['w*bbKbwK', 'bbbK*bKKb', 'bKb*bwKK', 'KwwbbbKwb', 'wwwwKwww', 'wwwwwwwww', 'ww*wwwww', 'wwwwwwwww', 'wwwwwwww', 'bwbKbKb**']);
    const ctx = contextFor(cols, 'chain', 1, 14);
    const [best] = weigh({ cols, chain: 0, timeLeft: 12700 }, ctx, levelNamed('cc3'));
    expect(best.saves).toBe(true);
    expect(best.after![COLS - 1].filter((p) => p === WHITE).length).toBe(0);
  });
  it('a white with spice on both its ways left is walled off for good, scored as a white behind spice', () => {
    // CC^8 on seed 5000: a white at the bottom of a short column, the tall one left of it spice at its bottom two:
    // it drifted right with the board till it burned.
    const walled = board([[4, 7, '*'], [4, 8, '*'], [6, 0, 'K']]), pocketJunk = board([[4, 7, '*'], [4, 8, '*'], [5, 7, 'K']]);
    expect(behindSpice(walled, 5, 7)).toBe(true);
    expect(behindSpice(walled, 5, 6)).toBe(false); // a white beside it on its left: a way out
    expect(boardScore(walled)).toBeLessThan(boardScore(pocketJunk));
  });
});

describe('frozen by the fire, and drags stopping short (13 Nov, the thirty-second note: "It seems to have just frozen ... maybe it\'s stuck because it requires maybe a few moves just to kind of get the brown into the right position"; "you could go one step further, just do it")', () => {
  it('when no one move saves a white by the fire, it plays the move that sets up the save, and the save comes next', () => {
    // CC^3 on seed 5001, 208 s in: a white low in the furnace's column, nothing reaching it in one move.
    const cols = parseBoard(['wbbwKKKKw', 'wbwbbKwK', '*wwwbbwKK', 'bwwwwwKw', 'wwwwwwwwK', 'wwwwwww*', 'bwwww*w*K', 'bbbK*wKw', 'bbbKbbwKK', 'KbbKbwwK']);
    const style = levelNamed('cc3'), ctx = contextFor(cols, 'junk', 0, style.reach);
    const moves = weigh({ cols, chain: 0, timeLeft: 10800 }, ctx, style);
    expect(moves).toHaveLength(1);
    expect(moves[0].setup).toBe(true);
    const after = moves[0].after!;
    const [next] = weigh({ cols: after, chain: 0, timeLeft: 7000 }, contextFor(after, 'junk', 0, style.reach), style);
    expect(next.saves).toBe(true);
    expect(next.setup).toBeFalsy();
  });
  it('a drag is carried on to the right while the board scores no worse, not let go where one look ahead peaks', () => {
    // A black at the top left of a board of whites, sent down-right all the way: it goes on to the far side.
    const cols = board([[0, 0, 'K'], [9, 4, 'K'], [9, 5, 'K'], [9, 6, 'K'], [9, 7, 'K']]);
    const drags = [{ x: 0, y: 0, ways: Array(8).fill(DOWN_RIGHT) }], style = levelNamed('cc3');
    const was = P.ONWARD;
    try {
      P.ONWARD = 0;
      const peak = judge(cols, drags, style)!;
      P.ONWARD = 1;
      const onward = judge(cols, drags, style)!;
      expect(onward.drags[0].ways.length).toBeGreaterThanOrEqual(peak.drags[0].ways.length);
      expect(boardScore(playDrags(cols, onward.drags)!)).toBeGreaterThanOrEqual(boardScore(playDrags(cols, peak.drags)!));
      expect(onward.drags[0].ways.length).toBe(8);
    } finally { P.ONWARD = was; }
  });
});

describe('a brown stuck at the top of the column going up, rescued (13 Nov: "this is absolute danger mode ... the first thing I would be doing here is just rescuing that brown piece")', () => {
  // The user's board: the furnace's column all white but a brown at its top, a black on the top row a few columns
  // left, a brown below it that can move up. Every bot frees it, so the column goes up Crystal Clear.
  const cols = parseBoard(STUCK_ON_TOP), last = COLS - 1;
  it('the brown can\'t get out on its own, nor with any one piece brought round', () => {
    const y = cols[last].indexOf(BROWN);
    expect(y).toBe(0);
    expect(canGo(cols, last, y, -1)).toBe(false);
    expect(bringRound(cols, { x: last, y, side: -1 }, HELIUM)).toBeNull();
    expect(chainZones(cols, contextFor(cols, 'chain', 0, HELIUM.reach))).toEqual([last]);
  });
  it('every bot sends that column up Crystal Clear, the brown rescued by a pair working together, 13 Nov', () => {
    for (const t of LEVELS) {
      const g = new Distilling(seeded(1)).lay(cols);
      const out: number[][] = [];
      playSession(g, t, 0.3, (c) => out.push(c.pieces));
      expect(out.length, t.name).toBeGreaterThan(0);
      expect(out[0].every((p) => p === WHITE), `${t.name} sent it up with the brown`).toBe(true);
    }
  });
  it('urgent from the first look, before anything easy elsewhere: the low targets play the pair rescue straight away', () => {
    for (const t of LEVELS.slice(0, 3)) {
      const a = choose({ cols, chain: 0, timeLeft: 15000 }, contextFor(cols, 'chain', 0, t.reach), t);
      expect(a.label, t.name).toBe(PAIR_LABEL);
      expect(a.technique).toBe('path');
      expect(a.drags.length).toBeGreaterThanOrEqual(2);
      expect(a.column).toBe(last);
      const after = playDrags(cols, a.drags)!;
      expect(after[last].every((p) => p === WHITE)).toBe(true);
      expect(after[last - 1].every((p) => p === WHITE), 'not just pushed on into the next column').toBe(true);
    }
  });
  it('the mirror too: a black stuck at the bottom is freed with a brown brought along the bottom', () => {
    // Upside down, browns and blacks swapped: the same puzzle by the rules.
    const flip = STUCK_ON_TOP.map((c) => [...c].reverse().map((ch) => (ch === 'b' ? 'K' : ch === 'K' ? 'b' : ch)).join(''));
    const m = parseBoard(flip);
    expect(m[last][m[last].length - 1]).toBe(BLACK);
    const plan = pairRescue(m, last, contextFor(m, 'chain', 0, HELIUM.reach), levelNamed('cc1'));
    expect(plan).not.toBeNull();
    expect(playDrags(m, plan!)![last].every((p) => p === WHITE)).toBe(true);
    const g = new Distilling(seeded(1)).lay(m), out: number[][] = [];
    playSession(g, levelNamed('cc1'), 0.3, (c) => out.push(c.pieces));
    expect(out[0].every((p) => p === WHITE)).toBe(true);
  });
  it('the one after the column going up too, from as soon as there\'s time: a brown stuck at the top of it is freed first', () => {
    // The user, 13 Nov: "there was lots of time to rescue it even before now." The same board a column earlier, a
    // clear column of whites at the fire.
    const early = parseBoard([...STUCK_ON_TOP.slice(1), 'wwwwwwww']);
    const ctx = contextFor(early, 'chain', 0, HELIUM.reach);
    expect(ctx.fill).toBe(last - 1);
    expect(chainZones(early, ctx)).toEqual([last - 1]);
    const [m] = weigh({ cols: early, chain: 1, timeLeft: 15000 }, ctx, levelNamed('cc1'));
    expect(m.saves).toBe(true);
    expect(m.after![last - 1].every((p) => p === WHITE)).toBe(true);
  });
});

describe('the chain\'s rule of thumb, shared with Helium (13 Nov: "if you\'ve got a completely junk column, you don\'t try and build a whites into it. Yeah, you build further left. You start a new chain as far left as you can. Obviously, in the context of CC^1, you don\'t need to. But like, if you\'re going for the maximalist one, absolutely")', () => {
  // Column 10 all junk just after a Crystal Clear; columns 9 to 6 mostly white, not yet clear.
  const cols = parseBoard(['wKwwKwKK', 'KKbKwKKKK', 'bbKbbbwK', 'bbbbbbbbK', 'KbwwbwKK', 'wwwwwwwwK', 'wwwwwKbw', 'wwwwwwwKb', 'wwwwwwKb', 'KKKbbKKKK']);
  it('one function, the bots\' and Helium\'s plan\'s: more junk than white in the next column and the chain can\'t go on', () => {
    expect(heliumChainOver).toBe(chainOver);
    expect(chainOver(cols, COLS - 1)).toBe(true);
    expect(chainOver(cols, COLS - 2)).toBe(false);
  });
  it('the next chain starts further left the bigger the target: CC^1 right beside the junk, CC^8 three columns in', () => {
    expect(nextChainAt(cols, COLS - 1, 1)).toBe(8);
    expect(nextChainAt(cols, COLS - 1, 2)).toBe(8);
    expect(nextChainAt(cols, COLS - 1, 3)).toBe(7);
    expect(nextChainAt(cols, COLS - 1, 5)).toBe(7);
    expect(nextChainAt(cols, COLS - 1, 8)).toBe(6);
    // (never past a column of junk next to it, whatever the target)
    const two = cols.map((c) => [...c]);
    two[8] = [...'KKKbbKbw'].map((ch) => 'wbK*x'.indexOf(ch));
    expect(nextChainAt(two, COLS - 1, 1)).toBe(7);
  });
  it('after a Crystal Clear, the bot lets the chain go: the columns from there to the fire burn, no white built into the junk', () => {
    for (const [target, from] of [[1, 8], [8, 6]] as const) {
      const c = chainContext(cols, 1, 0, target, 40);
      expect(c.letGo).toBe(true);
      expect(c.burns).toBe(COLS - 1 - from);
      expect(c.ctx.fill).toBe(from);
      const a = choose({ cols, chain: 1, timeLeft: 12000 }, c.ctx, levelFor(target));
      if (a.kind === 'move') expect(playDrags(cols, a.drags)![COLS - 1].filter((p) => p === WHITE).length).toBe(0);
    }
    // (no chain going: nothing to let go)
    expect(chainContext(cols, 0, 0, 8, 40).letGo).toBe(false);
  });
  it('with a Crystal Clear still to go up first, it goes, and no white is built into the junk column after it', () => {
    const b = cols.map((c) => [...c]);
    b[9] = b[9].map(() => WHITE);
    b[8] = [...'KKKbbKbw'].map((ch) => 'wbK*x'.indexOf(ch));
    expect(chainContext(b, 1, 0, 2, 40).ctx.over).toEqual([8, 8]);
    const c = chainContext(b, 1, 0, 3, 40);
    expect(c.letGo).toBe(true);
    expect(c.ctx.over).toEqual([7, 8]);
    expect(c.ctx.fill).toBe(6);
    const a = choose({ cols: b, chain: 1, timeLeft: 12000 }, c.ctx, levelFor(3));
    if (a.kind === 'move') {
      const after = playDrags(b, a.drags)!, whites = (x: Board, i: number) => x[i].filter((p) => p === WHITE).length;
      expect(whites(after, 8) + whites(after, 7)).toBeLessThanOrEqual(whites(b, 8) + whites(b, 7));
      expect(after[9].every((p) => p === WHITE)).toBe(true);
    }
  });
  it('advise says so: let go, and the column the next chain starts in', () => {
    const a = advise({ cols, chain: 1, timeLeft: 12000 }, { target: 8 });
    expect(a.letGo).toBe(true);
    expect(a.column).toBe(6);
    expect(a.read).toMatch(/can't go on into column 10/);
  });
});

describe('the CC^1 opening (the user, 13 Nov, watching CC^1: "it should be like trying to build it in the second or third column, like close to what\'s being burnt, just to have a bit of burnt buffer")', () => {
  it('on a fresh board the first chain\'s column is two or three in from the fire, the columns right of it burning first as a buffer, 13 Nov', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const g = new Distilling(seeded(seed)), bot = new DistillBot(levelNamed('cc1')), a = bot.plan(g);
      expect(bot.stage, `seed ${seed}`).toBe('chain');
      expect(bot.burns, `seed ${seed}`).toBeGreaterThanOrEqual(P.BUFFER);
      expect(a.column, `seed ${seed}`).toBeLessThanOrEqual(COLS - 1 - P.BUFFER);
    }
  });
  it('never a white moved back out of the column it\'s filling, 13 Nov ("it doesn\'t seem to actually try and get the whites there ... and then it\'s just moved that out")', () => {
    for (let seed = 1; seed <= 2; seed++) {
      const g = new Distilling(seeded(seed));
      playSession(g, levelNamed('cc1'), 0.5, undefined, (a) => {
        if (a.stage !== 'chain' || a.kind !== 'move' || a.column === undefined) return;
        const after = playDrags(g.cols, a.drags);
        if (after) expect(after[a.column].filter((p) => p === WHITE).length, `seed ${seed}`).toBeGreaterThanOrEqual(g.cols[a.column].filter((p) => p === WHITE).length);
      });
    }
  });
});
