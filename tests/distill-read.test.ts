/* Distilling's board reader (src/distill-risk.ts, the piece level; src/distill-patterns.ts, the pattern level;
   src/distill-read.ts, the state and the tactic), on the positions' own boards (src/distill-positions.ts), and the
   planner using its numbers (src/distill-bots.ts). The user, 13 Nov: "a feature that tells you there's a risk and
   detects it ... but also what kind of tactics are in play"; "those need to be actual features and calculations, not
   just things of note ... little modules that the bot uses to have information and determine what it's doing", tested
   so that it "identifies the right phases, risks, both at the individual piece level and that middle pattern level". */
import { describe, expect, it } from 'vitest';
import { POSITIONS, boardOf } from '../src/distill-positions';
import { BLACK, BROWN, WHITE, parseBoard } from '../src/distilling';
import { RISK, burnsIn, flagged, reachOf, urgency, whiteRisks } from '../src/distill-risk';
import { disorder, ladder, patternsOf, stranded, tail } from '../src/distill-patterns';
import { READ, progress, readBoard } from '../src/distill-read';
import { P, choose, contextFor, levelNamed } from '../src/distill-bots';
import { playDrags } from '../src/distill-routines';
import { joinPairs } from '../src/distill-teach';
import type { Drag } from '../src/distill-routines';

const pos = (id: string) => POSITIONS.find((p) => p.id === id)!;
const cols = (id: string) => boardOf(pos(id));
const read = (id: string) => readBoard(cols(id), { stage: pos(id).stage, timeLeft: pos(id).timeLeft });
const at = (ps: readonly { x: number; y: number }[]) => ps.map((p) => `${p.x},${p.y}`);
/** The user's own block-phase picture (notes/distilling/40-*): whites mostly left after good play, not cracked. */
const board40 = () => parseBoard(['KwwwKwwbK', 'Kw*wwKKw', 'wbwww*wKw', 'KwwwwwwK', 'wwwbwwwKw', 'wbbwwwww', 'bwwwww*wK', 'bbKKKKbK', '*bKbKKbKK', 'bbKKbKbK']);

describe('the piece level: each white\'s risk as numbers (src/distill-risk.ts)', () => {
  it('P2: column 9\'s top white walled in by blacks is the most at risk, nothing able to reach it, 13 Nov ("Alarm bells going off that column 9 has got a white at the top")', () => {
    const ws = whiteRisks(cols('P2'), pos('P2').timeLeft);
    expect([ws[0].x, ws[0].y]).toEqual([8, 0]);
    expect(ws[0].reach).toBe(Infinity);
    expect(ws[0].edge).toBe('top');
    expect(flagged(ws)[0]).toBe(ws[0]);
  });
  it('P5: column 8\'s top two whites are flagged, the second from the top the worst, 13 Nov ("there\'s no way of getting a [brown] up to those two at the top of [column] 8")', () => {
    const ws = whiteRisks(cols('P5'), pos('P5').timeLeft), f = at(flagged(ws));
    expect(f).toContain('7,0');
    expect(f).toContain('7,1');
    expect([ws[0].x, ws[0].y]).toEqual([7, 1]);
    // Junk reaches it only the long way round: five swaps.
    expect(ws[0].reach).toBe(5);
  });
  it('P1: the top right comes before the white low in column 8 that can still be saved later, 13 Nov ("I\'d definitely be going at the top because I see the risk of traps")', () => {
    const ws = whiteRisks(cols('P1'), pos('P1').timeLeft);
    const top = ws.find((w) => w.x === 7 && w.y === 1)!, low = ws.find((w) => w.x === 7 && w.y === 8)!;
    expect(top.risk).toBeGreaterThan(low.risk);
  });
  it('a white that can go left on its own has a reach of 1; the sooner its column burns, the more urgent', () => {
    // P4: column 9's two whites each have junk beside them on the left the right way round.
    expect(reachOf(cols('P4'), 8, 6)).toBe(1);
    expect(reachOf(cols('P4'), 8, 8)).toBe(1);
    expect(burnsIn(9, 5000)).toBe(5000);
    expect(burnsIn(8, 5000)).toBe(5000 + RISK.BURN_MS);
    expect(urgency(5000)).toBeGreaterThan(urgency(20000));
    expect(urgency(20000)).toBeGreaterThan(urgency(60000));
  });
});

describe('the pattern level: groups of pieces (src/distill-patterns.ts)', () => {
  it('P10: the blacks stranded at the bottom of columns 1, 3, 5 and 7 and the browns at the top are found, 13 Nov ("black\'s at the bottom, surrounded by whites, browns at the top")', () => {
    const b = cols('P10'), s = stranded(b);
    const blacks = s.filter((p) => b[p.x][p.y] === BLACK), browns = s.filter((p) => b[p.x][p.y] === BROWN);
    for (const x of [0, 2, 4, 6]) expect(blacks.some((p) => p.x === x), `a black in column ${x + 1}`).toBe(true);
    for (const p of blacks) expect(p.y * 2).toBeGreaterThanOrEqual(b[p.x].length);
    expect(browns.length).toBeGreaterThan(0);
    for (const p of browns) expect(p.y * 2).toBeLessThan(b[p.x].length);
  });
  it('P8: columns 9 and 10 aren\'t a ladder, and the risk of losing it is high with column 10 about to go, 13 Nov ("when you\'re at risk of losing the ability to do the Z thing ... That\'s a risk")', () => {
    const b = cols('P8'), l = ladder(b, pos('P8').timeLeft)!;
    expect(l.cols).toEqual([8, 9]);
    expect(l.unsorted).toBe(1);
    expect(l.risk).toBeGreaterThan(0.9);
    // It grows as the column comes up to burn, and peaks just before it goes.
    const r = (ms: number) => ladder(b, ms)!.risk;
    expect(r(14000)).toBeLessThan(r(8000));
    expect(r(8000)).toBeLessThan(r(950));
    expect(r(0)).toBe(l.unsorted);
    // A ladder sorted, blacks over browns, is no risk however near the fire.
    expect(disorder([BLACK, BLACK, BLACK, BROWN, BROWN])).toBe(0);
    expect(disorder([BROWN, BROWN, BLACK, BLACK])).toBe(1);
  });
  it('P9: the V\'s tail is unsorted at the bottom of columns 7 and 8, 13 Nov ("dealing with the tail at the bottom left. So dragging those browns at the bottom of 7 and 8")', () => {
    expect(at(tail(cols('P9')).unsorted)).toEqual(expect.arrayContaining(['6,7', '7,6']));
  });
  it('P7: many pieces stuck, and the free junk fills a column at most, 13 Nov ("how many columns do I think I can actually fill ... how many pieces are stuck")', () => {
    const p7 = patternsOf(cols('P7'), pos('P7').timeLeft), p3 = patternsOf(cols('P3'), pos('P3').timeLeft);
    expect(p7.fillable.columns).toBeLessThanOrEqual(1);
    expect(p3.fillable.columns).toBeGreaterThan(p7.fillable.columns);
    expect(p7.stuck).toBeGreaterThan(p3.stuck);
  });
});

describe('the board\'s state and the tactic in play (src/distill-read.ts)', () => {
  it('P7 reads as damage control, filling the gaps by the fire, 13 Nov ("That\'s a fantastic example of just things have gone really wrong, and then it would be into damage control")', () => {
    expect(read('P7')).toMatchObject({ state: 'damageControl', tactic: 'fillGaps' });
  });
  it('P10 reads as cracked, fixing the cracks; the user\'s own block-phase picture doesn\'t, 13 Nov ("I\'d switch strategy or tactics from trying to fill in the white column so they\'re brown with fixing cracked pieces")', () => {
    expect(read('P10')).toMatchObject({ state: 'cracked', tactic: 'fixCracks' });
    expect(readBoard(board40(), { stage: 'junk', timeLeft: 12000 }).state).not.toBe('cracked');
  });
  it('P1, P2, P5 and P6 read as at risk, freeing the trapped whites; P2 with column 9\'s top white first, 13 Nov ("the top right first")', () => {
    for (const id of ['P1', 'P2', 'P5', 'P6']) expect(read(id), id).toMatchObject({ state: 'atRisk', tactic: 'freeTrapped' });
    expect(at(read('P2').targets)[0]).toBe('8,0');
  });
  it('P3 and P4 fill the gaps in column 9 quickly, 13 Nov ("prioritising filling those right-hand columns with as much speed as I could")', () => {
    for (const id of ['P3', 'P4']) {
      const r = read(id);
      expect(r.tactic, id).toBe('fillGaps');
      expect(r.targets.every((t) => t.x === 8), id).toBe(true);
    }
  });
  it('P8 sorts the ladder, P9 the tail, 13 Nov ("you\'ve left the V for too long, you\'ve not sorted your pieces"; "the efficiency of sorting that bottom bit out")', () => {
    expect(read('P8')).toMatchObject({ state: 'atRisk', tactic: 'sortLadder' });
    expect(read('P8').patterns.ladder!.risk).toBeGreaterThanOrEqual(READ.LADDER);
    expect(read('P9').tactic).toBe('sortTail');
  });
  it('a board with nothing at risk reads healthy: quick sorting moves while the junk\'s plentiful, blocks once the whites are mostly left; the chain reads as the chain, 13 Nov (P3: "they\'re just really fast, quick, simple, easy moves")', () => {
    // The whites on the left, the right-hand columns junk sorted, no white near the fire: six columns of junk, then four.
    const fill = parseBoard(['wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'KKKKbbbbb', 'KKKKbbbb', 'KKKKbbbbb', 'KKKKbbbb', 'KKKKKbbbb', 'KKKKbbbb']);
    expect(readBoard(fill, { stage: 'junk', timeLeft: 12000 })).toMatchObject({ state: 'healthy', tactic: 'quickSort' });
    const block = parseBoard(['wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'KKKKbbbbb', 'KKKKbbbb', 'KKKKKbbbb', 'KKKKbbbb']);
    expect(readBoard(block, { stage: 'junk', timeLeft: 12000 })).toMatchObject({ state: 'healthy', tactic: 'blocks' });
    expect(read('P11').tactic).toBe('chain');
  });
});

describe('the planner uses the reading (src/distill-bots.ts, `byTactic`)', () => {
  const bot = (id: string) => { const p = pos(id), b = cols(id), l = levelNamed(p.level); return choose({ cols: b, chain: p.chain, timeLeft: p.timeLeft }, contextFor(b, p.stage, p.burns, l.reach), l); };
  it('the Advice carries the state and the tactic, and the move is the tactic\'s, 13 Nov', () => {
    for (const id of ['P1', 'P4', 'P7', 'P8', 'P9', 'P10']) {
      const a = bot(id), r = read(id), b = cols(id);
      expect(a.state, id).toBe(r.state);
      expect(a.tactic, id).toBe(r.tactic);
      expect(a.read, id).toBe(r.why);
      expect(a.kind, id).toBe('move');
      // What it gets done for the tactic, by the tactic's own measure (freeing, opening the way to a trapped white).
      const after = playDrags(b, a.drags)!, t = r.targets[0];
      expect(Math.max(progress(r, b, after, a.drags), t ? progress(r, b, after, a.drags, t, true) : 0), id).toBeGreaterThan(0);
    }
  });
  it('with the reader off, P8 waits with the ladder about to be lost and P7 with its gaps unfilled, as the bots did before, 13 Nov', () => {
    const was = P.READ;
    try {
      P.READ = 0;
      expect(bot('P8').kind).toBe('wait');
      expect(bot('P7').kind).toBe('wait');
    } finally { P.READ = was; }
    expect(bot('P8').kind).toBe('move');
  });
});

describe('two drags a player makes as one, in the bots\' Advice (src/distill-teach.ts, `joinPairs`, shared with Helium\'s teaching)', () => {
  it('a brown dragged onto a white, then the white dragged on, is one drag of the white, ending on the same board, 13 Nov ("drag the brown to the right, and then the white to the left. When to me, it\'s like, well, why isn\'t that just one move?")', () => {
    // P4: the brown at column 8, row 7 dragged up-right onto column 9's white, then that white, now where the brown
    // was, dragged on.
    const b = cols('P4'), first: Drag = { x: 7, y: 6, ways: [0] }, mid = playDrags(b, [first])!;
    expect(mid[7][6]).toBe(WHITE);
    const ways = [0, 1, 2, 3].filter((w) => playDrags(mid, [{ x: 7, y: 6, ways: [w] }]));
    expect(ways.length).toBeGreaterThan(0);
    const two: Drag[] = [first, { x: 7, y: 6, ways: [ways[0]] }], one = joinPairs(b, two);
    expect(one).toHaveLength(1);
    expect([one[0].x, one[0].y]).toEqual([8, 6]);
    expect(one[0].ways).toHaveLength(2);
    expect(playDrags(b, one)).toEqual(playDrags(b, two));
  });
  it('the bots\' moves at every position are already joined: no two of their drags are one drag split, 13 Nov', () => {
    for (const p of POSITIONS) {
      const b = boardOf(p), l = levelNamed(p.level);
      const a = choose({ cols: b, chain: p.chain, timeLeft: p.timeLeft }, contextFor(b, p.stage, p.burns, l.reach), l);
      expect(joinPairs(b, a.drags), p.id).toEqual(a.drags);
    }
  });
  it('drags that don\'t chain are left as they are', () => {
    const b = cols('P5'), two: Drag[] = [{ x: 2, y: 0, ways: [3, 3, 0, 0, 3] }, { x: 5, y: 1, ways: [0] }];
    expect(joinPairs(b, two)).toEqual(two);
  });
});