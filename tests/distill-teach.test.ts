/* Helium's plan's moves made to teach, 13 Nov (src/distill-teach.ts; src/den-helium.ts, planFor and TeachLines). The
   user, playing it: "it's giving you really complicated moves ... I'm not really sure that seemed very
   tutorial-like. Like, am I supposed to be able to figure out and spot similar things?"; "if we go for a crystal
   clear one, those were complicated moves. Maybe for later, sure, but for crystal clear one starting, no."; and
   "drag the brown to the right, and then the white to the left ... why isn't that just one move?" */
import { describe, expect, it } from 'vitest';
import { Batch, PlanLines, TeachLines, aimFor, planFor, spotLine, type Plan } from '../src/den-helium';
import { BLACK, BROWN, Distilling, UP_LEFT, WHITE, neighbourOn, parseBoard, type Board } from '../src/distilling';
import { playDrags, type Drag } from '../src/distill-routines';
import { SPOT_MOST, TEACH_LEVELS, TRICKS, cost, joinPairs, plainMoves, teach, teachLevel, touched, trickOf, type Shown } from '../src/distill-teach';
import { SPOT, TEACH } from '../src/lines/helium';
import { seeded } from '../src/mirror-row';

const words = (s: string) => s.trim().split(/\s+/).length;
const swaps = (ds: readonly Drag[]) => ds.reduce((n, d) => n + d.ways.length, 0);
/** A plan's step's aim, as planFor hands it to the picker. */
const aimOf = (p: Plan, cols: Board, chain: number) => aimFor(cols, p.burn, p.column, p.target - chain, p.step === 'build' ? 'into' : 'out');

/** Follows Helium's arrows on a seeded board with the fire held, as a learner would: the move shown, or X when there's
    none; each plan kept, with the board it was made on. */
function follow(seed: number, goal: number, most = 120) {
  const g = new Distilling(seeded(seed), { timer: false }), batch = new Batch(goal), lines = new TeachLines(), said: string[][] = [];
  const plans: { p: Plan; cols: Board; chain: number }[] = [];
  let last: Shown | null = null;
  for (let i = 0; i < most && !batch.done; i++) {
    const cols = g.cols.map((c) => [...c]), p = planFor(g, goal, Infinity, last);
    plans.push({ p, cols, chain: g.chain });
    said.push(lines.next(p));
    if (p.teach) {
      last = p.teach.trick;
      for (const d of p.drags) { expect(g.dragWays(d.x, d.y, d.ways).swaps).toBe(d.ways.length); g.settle(1000); }
    } else for (const e of g.burnNow()) if (e.kind === 'column') batch.column(e.column, e.finished);
    g.settle(5000);
  }
  return { g, batch, plans, said };
}
const SEEDS = [269, 7, 42];
const runs = SEEDS.map((s) => follow(s, 1));

describe('"it\'s giving you really complicated moves" (13 Nov): at a Crystal Clear 1, plain moves', () => {
  it('every plain move shown is one drag of three swaps at most, a named trick; making way, two short drags', () => {
    let plain = 0;
    for (const { plans } of runs) for (const { p, cols, chain } of plans) {
      const m = p.teach;
      if (!m || m.trick === 'bots') continue;
      plain++;
      if (m.trick === 'makeWay') {
        expect(m.drags.length).toBe(2);
        expect(m.drags[0].ways.length).toBeLessThanOrEqual(TEACH_LEVELS[0].makeWay);
        expect(m.drags[1].ways.length).toBeLessThanOrEqual(TEACH_LEVELS[0].swaps);
      } else {
        expect(m.drags.length).toBe(1);
        expect(m.drags[0].ways.length).toBeLessThanOrEqual(3);
        expect(trickOf(cols[m.drags[0].x][m.drags[0].y], m.drags[0].ways)).toBe(m.trick);
      }
    }
    expect(plain).toBeGreaterThan(20);
  });
  it('the bots\' own move only now and then, a drag at a time', () => {
    for (const { plans } of runs) {
      const shown = plans.filter(({ p }) => p.teach), bots = shown.filter(({ p }) => p.teach!.trick === 'bots');
      expect(bots.length / shown.length).toBeLessThan(0.2);
      for (const { p } of bots) expect(p.drags.length).toBe(1);
    }
  });
  it('followed, the arrows get you to the goal: a Crystal Clear sent up', () => {
    for (const { batch } of runs) { expect(batch.met).toBe(true); expect(batch.done).toBe(true); }
  });
  it('a bigger goal may give longer moves: from a Crystal Clear 5, the bots\' own techniques first', () => {
    expect(teachLevel(1).swaps).toBe(3);
    expect(teachLevel(3).swaps).toBe(4);
    expect(teachLevel(5).bots).toBe('first');
    const { plans } = follow(269, 5, 25);
    expect(plans.some(({ p }) => p.teach?.trick === 'bots' && swaps(p.drags) > 3)).toBe(true);
  });
});

describe('the move serves the plan\'s step: the same columns, the same aim', () => {
  it('each plain move brings the step\'s aim on: whites out of the junk columns, junk out of the gold column', () => {
    for (const { plans } of runs) for (const { p, cols, chain } of plans) {
      if (!p.teach || p.teach.trick === 'bots') continue;
      const aim = aimOf(p, cols, chain), after = playDrags(cols, p.drags)!;
      expect(cost(after, aim)).toBeLessThan(cost(cols, aim));
      expect(p.teach.value).toBeGreaterThan(0);
    }
  });
  it('clearing the junk columns, the move is about a ringed white whenever one plain move can help it', () => {
    let n = 0;
    for (const { plans } of runs) for (const { p, cols, chain } of plans) {
      if (p.step !== 'clear' || !p.teach || p.teach.trick === 'bots' || p.teach.trick === 'makeWay') continue;
      const aim = aimOf(p, cols, chain), helps = plainMoves(cols, aim, teachLevel(1)).length > 0;
      if (!helps) continue;
      n++;
      // (whites out of the junk columns, or nearer their edge: the ringed ones, the move passing through one)
      expect(cost(playDrags(cols, p.drags)!, aim, 'out')).toBeLessThan(cost(cols, aim, 'out'));
      const ringed = new Set(p.ring.map(([x, y]) => `${x},${y}`));
      expect(touched(cols, p.drags[0]).some(([x, y]) => ringed.has(`${x},${y}`))).toBe(true);
    }
    expect(n).toBeGreaterThan(5);
  });
  it('nothing to drag when the step is to send it up (that\'s X)', () => {
    for (const { plans } of runs) for (const { p } of plans) if (p.step === 'send') expect(p.drags).toEqual([]);
  });
});

describe('"drag the brown to the right, and then the white to the left ... why isn\'t that just one move?" (13 Nov)', () => {
  // A white's drag of two swaps or more on a real board, split as a player wouldn't: the piece it first passes
  // dragged one swap onto it, then the white dragged on from there.
  const g = new Distilling(seeded(269), { timer: false });
  const aim = aimFor(g.cols, [5, 6, 7, 8, 9], 4);
  const white = plainMoves(g.cols, aim, TEACH_LEVELS[1]).find((m) => g.cols[m.drags[0].x][m.drags[0].y] === WHITE && m.swaps >= 2)!;
  const d = white.drags[0], n = neighbourOn(g.cols, d.x, d.y, d.ways[0])!;
  const split: Drag[] = [{ x: n[0], y: n[1], ways: [(d.ways[0] + 2) % 4] }, { x: n[0], y: n[1], ways: d.ways.slice(1) }];
  it('a split pair is joined into the one drag a player would make, the board left the same', () => {
    expect(playDrags(g.cols, split)).toEqual(playDrags(g.cols, [d]));
    expect(joinPairs(g.cols, split)).toEqual([d]);
  });
  it('the same piece dragged on from where it stopped is one drag too: never "1, then 2" for one piece', () => {
    // (a board at Helium's still, 13 Nov: a brown taken down and up-left, then on up-right from there, shown as two)
    const cols = parseBoard(['KKwwbbKbK', 'bww*bwKw', 'KbbwwKbwb', 'wwbbwKb*', 'bKKKKbwbb', 'bbwKwwww', 'Kbbbwwwww', 'KwwwwKbb', 'wbbwwbKKb', 'KKKKKKKK']);
    const two: Drag[] = [{ x: 8, y: 5, ways: [2, 1] }, { x: 6, y: 5, ways: [0, 0] }];
    expect(joinPairs(cols, two)).toEqual([{ x: 8, y: 5, ways: [2, 1, 0, 0] }]);
    const t = teach(cols, aimFor(cols, [8, 9], 7, 1, 'out'), 1);
    if (t.move?.drags.length === 2) expect(joinPairs(cols, t.move.drags)).toHaveLength(2);
  });
  it('drags that aren\'t one split are left as they are', () => {
    const two = [d, { x: 0, y: 0, ways: [] as number[] }];
    expect(joinPairs(g.cols, [d])).toEqual([d]);
    expect(joinPairs(g.cols, two)[0]).toEqual(d);
  });
  it('never shown split: a move making way is never one drag in two, nor the bots\' move', () => {
    for (const { plans } of runs) for (const { p, cols, chain } of plans) {
      if (p.drags.length === 2) expect(joinPairs(cols, p.drags)).toHaveLength(2);
    }
    // (the bots' own move handed in split comes out joined, first from a Crystal Clear 5)
    const shown = teach(g.cols, aim, 5, split);
    expect(shown.move?.trick).toBe('bots');
    expect(shown.move?.drags).toEqual([d]);
    // (and below that only when nothing plain helps and the whole of it does something: an empty aim, nothing shown)
    expect(teach(g.cols, { out: [], into: [] }, 1, split).move).toBeNull();
  });
});

describe('why it works, in a line in Helium\'s voice (13 Nov: "each with why it works in a line")', () => {
  it('each trick\'s why says its swap rule, short enough for a phone bubble, and Helium "they"', () => {
    const rule: Record<string, RegExp> = { climb: /white climbs past a black/i, sink: /white sinks past a brown/i, lift: /brown rises past a white/i, drop: /black sinks past a white/i, weave: /up over a black, down under a brown/i };
    for (const t of TRICKS) expect(TEACH[t].why).toMatch(rule[t]);
    const lines = [...Object.values(TEACH).flatMap((t) => [t.why, t.name, t.how]), ...Object.values(SPOT)];
    for (const l of lines) {
      expect(l.length, l).toBeLessThanOrEqual(110);
      expect(words(l), l).toBeLessThanOrEqual(18);
      expect(l, l).not.toMatch(/\b(he|she|him|her|his)\b/i);
    }
  });
  it('the why is the move\'s own: a plain trick\'s rule, and it\'s in the bar by name', () => {
    for (const { plans } of runs) for (const { p } of plans) {
      if (!p.teach || p.teach.trick === 'bots') continue;
      expect(p.why).toBe(TEACH[p.teach.trick].why);
      expect(p.note).toContain(TEACH[p.teach.trick].name);
    }
  });
  it('said the first time each trick\'s shown in a batch, not every move', () => {
    for (const { plans, said } of runs) {
      const whys = said.flat().filter((l) => Object.values(TEACH).some((t) => t.why === l));
      expect(new Set(whys).size).toBe(whys.length);
      expect(whys.length).toBeGreaterThan(1);
      const first = plans.findIndex(({ p }) => p.teach && p.teach.trick !== 'bots');
      expect(said[first][0]).toBe(plans[first].p.why);
    }
  });
});

describe('"am I supposed to be able to figure out and spot similar things?" (13 Nov): the other places ringed', () => {
  it('a few at the most, each the same trick doing the same job, none touching the move shown', () => {
    let rung = 0;
    for (const { plans } of runs) for (const { p, cols, chain } of plans) {
      expect(p.spots.length).toBeLessThanOrEqual(SPOT_MOST);
      if (!p.spots.length) continue;
      rung++;
      const aim = aimOf(p, cols, chain), used = new Set(touched(cols, p.drags[0]).map(([x, y]) => `${x},${y}`));
      for (const s of p.spots) {
        expect(trickOf(cols[s.x][s.y], s.ways)).toBe(p.teach!.trick);
        expect(cost(playDrags(cols, [s])!, aim)).toBeLessThan(cost(cols, aim));
        expect(used.has(`${s.x},${s.y}`)).toBe(false);
      }
      expect(p.more).toBeGreaterThanOrEqual(p.spots.length);
    }
    expect(rung).toBeGreaterThan(5);
  });
  it('their line counts them ("Three more like that. Find them."), said with the why the first time', () => {
    expect(spotLine(0, 0)).toBeNull();
    expect(spotLine(1, 1)).toBe(SPOT.one);
    expect(spotLine(2, 2)).toBe(SPOT.two);
    expect(spotLine(3, 3)).toBe(SPOT.three);
    expect(spotLine(3, 5)).toBe(SPOT.many);
    const L = new TeachLines(), p = { teach: { trick: 'climb' as const, drags: [], value: 1, swaps: 1 }, why: TEACH.climb.why, spots: [{ x: 1, y: 1, ways: [UP_LEFT] }], more: 1, advice: {} as Plan['advice'] };
    expect(L.next(p)).toEqual([TEACH.climb.why, SPOT.one]);
    expect(L.next(p)).toEqual([]);
  });
  it('the same trick again while it still does well, so the ringed places are the next ones shown', () => {
    // (on a board where a climb and something better are both on offer, the climb shown last is kept)
    for (const { plans } of runs) for (let i = 1; i < plans.length; i++) {
      const { p, cols, chain } = plans[i], last = plans[i - 1].p.teach?.trick;
      if (!p.teach || !last || p.teach.trick === last || p.teach.trick === 'bots' || p.teach.trick === 'makeWay') continue;
      const aim = aimOf(p, cols, chain);
      const all = plainMoves(cols, aim, teachLevel(1)), top = Math.max(...all.map((m) => m.value));
      expect(all.filter((m) => m.trick === last).every((m) => m.value < top * 0.5)).toBe(true);
    }
  });
});

describe('the plain tricks are the swap rule', () => {
  it('a white up through blacks, down through browns; a brown up through whites; a black down through them', () => {
    expect(trickOf(WHITE, [UP_LEFT])).toBe('climb');
    expect(trickOf(WHITE, [2, 2])).toBe('sink');
    expect(trickOf(WHITE, [1, 2])).toBe('weave');
    expect(trickOf(BROWN, [0, 0])).toBe('lift');
    expect(trickOf(BLACK, [3, 3])).toBe('drop');
    // (a brown or black a single swap is the white's own move, shown as the white's)
    expect(trickOf(BROWN, [0])).toBeNull();
    expect(trickOf(BLACK, [0, 0])).toBeNull();
  });
  it('PlanLines still says each step as it starts', () => {
    expect(new PlanLines().next({ step: 'clear' }, 0)).not.toBeNull();
  });
});
