/* Balloon animals (src/balloons.ts): Sailing's pieces twisted out of balloons and played onto a real
   Sailing board. The user (11 Nov): "how on earth do these sailing pieces pop in the puzzle? It makes
   sense. They're balloon animals"; then, of a first go, "it's not really a real looking sailing board,
   it's just things stacked on each other ... She's helping you ... how to build doubles and bingos and
   things", and "it should definitely be like a now you try thing ... she sets up the balloons, you do
   the pop". */
import { describe, expect, it } from 'vitest';
import { ROUTINES, SHOW, BalloonShow, beats, layout, marks, perform, plan, route, setup, type Act, type Mark, type Routine, type ShowEvent } from '../src/balloons';
import { Sailing, PLATFORM, SPAWN } from '../src/sailing';
import { SailPair, FALL } from '../src/sail-pair';
import { stagesAreWhatTheySay } from './sail-stages';

/** Plays a routine a twist at a time: the board after each of her twists, and what your pair (the
    last) set off, stage by stage. */
function stepThrough(r: Routine) {
  const g = layout(r), boards: Sailing[] = [];
  let last = null as ReturnType<Sailing['drop']> | null;
  r.twists.forEach((t, i) => {
    g.pair = [t.pair[0], t.pair[1]];
    const res = g.drop(t.col, t.turn, t.row);
    if (i < r.twists.length - 1) boards.push(g.copy(() => 0)); else last = res;
  });
  return { boards, last: last!, game: g };
}

const secs = (t: string) => 1 + t.length * 0.01;
/** Plays a show a tenth at a time till it's done or `stop` says, dropping your pairs with `you` (the
    chain they set off; the one she built, by default): everything that happened. */
function play(show: BalloonShow, you: (act: number) => number = (a) => show.shows[a].steps, limit = 20000): ShowEvent[] {
  const out: ShowEvent[] = [];
  for (let n = 0; !show.done && n < limit; n++) {
    if (show.yours) { const r = show.played(you(show.beat().act)); out.push(...(r?.events ?? [])); }
    out.push(...show.tick(0.1));
  }
  return out;
}

describe('her lesson\'s boards are real Sailing boards, played by the real rules (11 Nov)', () => {
  it('a Double and a Bingo: nothing pops till the last pair, then a chain of two, then four', () => {
    const want = { double: [5, 2, 'Double'], bingo: [10, 4, 'Bingo!'] } as const;
    expect(Object.keys(ROUTINES)).toEqual(['double', 'bingo']);
    for (const [name, r] of Object.entries(ROUTINES)) {
      const p = perform(r), [twists, steps, chain] = want[name as keyof typeof want];
      expect(r.twists).toHaveLength(twists);
      expect(p.early).toBe(0);
      expect([p.steps, p.name]).toEqual([steps, chain]);
    }
  });

  /* The user, 11 Nov, of the staircase routines: "Was that actually a valid combo that she just did when
     it dropped? That looked suspicious ... why are there ledges? ... the colours are not going into the
     right spots ... they're just going in random places and bodging it. This is a tutorial, and she's
     just showing bodging moves." */
  it('11 Nov: no bodged pieces: every balloon she puts on a platform is in a target of its own colour', () => {
    for (const r of Object.values(ROUTINES)) for (const g of stepThrough(r).boards) {
      for (let row = 0; row < g.grid.length; row++) for (let c = 0; c < g.grid[row].length; c++) {
        const x = g.grid[row][c], p = x && g.inPlatform(row, c);
        if (!p) continue;
        const t = p.targets.find((q) => q.r === row && q.c === c);
        expect(t, `a balloon on a square that's no target, ${row},${c}`).toBeDefined();
        expect(x!.c, `the wrong colour in the target at ${row},${c}`).toBe(t!.colour);
      }
    }
  });

  it('11 Nov: no balloon sits idle: everything she and you put down is popped by the chain', () => {
    for (const r of Object.values(ROUTINES)) {
      const { boards, last, game } = stepThrough(r), before = boards[boards.length - 1];
      expect(game.grid.flat().filter(Boolean)).toEqual([]);
      expect(last.cleared).toBe(r.twists.length * 2);
      // (every platform she builds on pops; the one she hasn't started on stays, so the board isn't
      // dealt afresh under her chain)
      const untouched = before.platforms.filter((p) => p.targets.every((t) => !before.grid[t.r][t.c])).map((p) => p.id);
      expect(untouched).toHaveLength(1);
      expect(game.platforms.map((p) => p.id)).toEqual(untouched);
      expect(last.boardCleared).toBe(false);
    }
  });

  it('11 Nov: the real way (YPPedia\'s Sailing strategy): each platform one target short, and a line\'s pop drops its partner in', () => {
    for (const r of Object.values(ROUTINES)) {
      const { boards, last } = stepThrough(r), before = boards[boards.length - 1];
      // (before your pair: each platform she's built on wants just one more balloon)
      for (const p of before.platforms) {
        const short = p.targets.filter((t) => before.grid[t.r][t.c]?.c !== t.colour).length;
        expect(short === 1 || short === p.targets.length, `platform ${p.id}: ${short} short`).toBe(true);
      }
      // (a line pops first, and then a platform, every time)
      const kinds = last.stages.slice(1).map((s) => s.kind);
      expect(kinds).toEqual(Array.from({ length: last.steps }, (_, i) => (i % 2 ? 'platform' : 'line')));
    }
  });

  it('11 Nov, "a yellow on a white block, and somehow it cleared a platform": each pop is a line of four or a platform she built, and says which', () => {
    for (const r of Object.values(ROUTINES)) {
      const { boards, last } = stepThrough(r), before = boards[boards.length - 1];
      stagesAreWhatTheySay(before.snap(), before.platforms.slice(), last);
      // (every line is four of a colour, every platform that goes one she built on, all its targets
      // filled in their colours: the board shows each for what it is, sail-board.js)
      for (const st of last.stages) {
        if (st.kind === 'line') expect(st.lines!.map((l) => l.length)).toEqual([4]);
        if (st.kind === 'platform') expect(st.went!.every((p) => p.targets.some((t) => before.grid[t.r][t.c]))).toBe(true);
      }
    }
  });

  it('11 Nov: her platforms are blocks, two by three at least, never a little row or ledge', () => {
    for (const r of Object.values(ROUTINES)) for (const p of r.platforms) {
      expect(Math.min(p.w, p.h)).toBeGreaterThanOrEqual(2);
      expect(p.w * p.h).toBeGreaterThanOrEqual(6);
      expect(p.targets).toHaveLength(p.w * p.h);
    }
  });

  it('the Bingo is the Double with another storey on top: the same bottom, built the same way first', () => {
    const d = ROUTINES.double, b = ROUTINES.bingo, n = d.twists.length - 1;
    expect(b.twists.slice(0, n)).toEqual(d.twists.slice(0, n));
    expect(b.platforms).toEqual(expect.arrayContaining([...d.platforms]));
  });

  it('every pair comes in at the top of the middle columns and is steered down by moves a player can make, to where it comes to rest', () => {
    for (const r of Object.values(ROUTINES)) {
      const g = layout(r);
      for (const t of r.twists) {
        g.pair = [t.pair[0], t.pair[1]];
        const P = new SailPair(g), way = route(g, t)!;
        expect(way).not.toBeNull();
        expect([P.row, P.col, P.turn]).toEqual([0, SPAWN[0], 0]);
        for (const st of way) {
          const ok = st === 'left' ? P.slide(-1) : st === 'right' ? P.slide(1) : st === 'turnR' ? P.turnBy(1) : st === 'turnL' ? P.turnBy(-1) : g.sinks(P.row, P.col, P.turn) && ++P.row > 0;
          expect(ok, st).toBe(true);
        }
        expect([P.row, P.col, P.turn]).toEqual([t.row, t.col, t.turn]);
        expect(P.slam().dropped).toBe(true);
      }
    }
  });

  it('its platforms are Sailing\'s own sizes (11 Nov)', () => {
    for (const r of Object.values(ROUTINES)) for (const p of r.platforms) {
      expect(PLATFORM.W).toContain(p.w);
      expect(PLATFORM.H).toContain(p.h);
    }
  });

  it('the board after her setup is what the rules make of it, and the pair she hands you sets it off', () => {
    for (const r of Object.values(ROUTINES)) {
      const n = r.twists.length - 1, g = setup(r, n), t = r.twists[n];
      expect(g.pair).toEqual([t.pair[0], t.pair[1]]);
      const res = g.drop(t.col, t.turn, t.row);
      expect(res.steps).toBe(perform(r).steps);
      // (and her chain doesn't clear the board: a platform she's not started on is left, so its name shows)
      expect(res.boardCleared).toBe(false);
    }
  });
});

describe('the show: she sets the balloons up, squeak by squeak; you do the pop', () => {
  const acts: Act[] = [
    { routine: ROUTINES.double, says: { start: 'watch', twists: ['one', 'two'], yours: 'your go', again: ['again!'], help: 'like this', popped: 'Double!' }, you: true },
    { routine: ROUTINES.bingo, says: { twists: ['this,'] } },
  ];

  it('each of her pairs twisted (two squeaks, tossed), then steered down and landed; then your turn, then the chain', () => {
    const kinds = play(new BalloonShow(acts, secs)).filter((e) => e.kind !== 'note').map((e) => (e.kind === 'line' ? `line ${e.text}` : e.kind));
    const twist = ['squeak', 'squeak', 'toss', 'fall', 'land'];
    expect(kinds.slice(0, 28)).toEqual([
      'act', 'line watch',
      'line one', ...twist,
      'line two', ...twist,
      ...twist, ...twist,   // (her other two, quietly)
      'line your go', 'yours',
      'line Double!', 'act',
    ]);
    // (the second act's hers all through: ten pairs, no turn of yours)
    expect(kinds.filter((k) => k === 'toss')).toHaveLength(4 + 10);
    expect(kinds.filter((k) => k === 'yours')).toHaveLength(1);
    expect(kinds[kinds.length - 1]).toBe('done');
  });

  it('slow enough to see in her hands: each twist a few seconds, both squeaks before it\'s tossed', () => {
    expect(SHOW.TWIST).toBeGreaterThanOrEqual(3);
    expect(SHOW.SQUEAKS[0]).toBeLessThan(SHOW.SQUEAKS[1]);
    expect(SHOW.SQUEAKS[1]).toBeLessThan(SHOW.TOSS);
    for (const b of beats(acts, secs)) if (b.kind === 'twist') expect(b.secs).toBeGreaterThanOrEqual(SHOW.TWIST);
  });

  it('the squeaks are the colours of the balloons twisted off, in order', () => {
    const ev = play(new BalloonShow(acts.slice(0, 1), secs)).filter((e) => e.kind === 'squeak') as { colour: number; half: 0 | 1 }[];
    expect(ev.map((e) => e.colour)).toEqual(ROUTINES.double.twists.slice(0, -1).flatMap((t) => [t.pair[0], t.pair[1]]));
  });

  it('it waits for you on your turn, however long', () => {
    const show = new BalloonShow(acts.slice(0, 1), secs);
    for (let i = 0; i < 2000 && !show.yours; i++) show.tick(0.1);
    expect(show.yours).toBe(true);
    for (let i = 0; i < 500; i++) expect(show.tick(0.1)).toEqual([]);
    expect(show.yours).toBe(true);
    expect(show.skip()).toEqual([]);   // (Space doesn't skip your go)
  });

  it('miss, and she has you go again (her line for it); three misses and she shows you; hit, and on it goes', () => {
    const show = new BalloonShow(acts.slice(0, 1), secs);
    for (let i = 0; i < 2000 && !show.yours; i++) show.tick(0.1);
    expect(show.played(0)).toMatchObject({ result: 'miss' });
    expect(show.yours).toBe(true);
    expect(show.played(1)!.events.map((e) => e.kind)).toEqual(['again', 'line']);
    const help = show.played(0)!;
    expect(help.result).toBe('help');
    expect(help.events.map((e) => e.kind)).toEqual(['again', 'note', 'line', 'fall']);
    expect(show.yours).toBe(false);
    const hit = new BalloonShow(acts.slice(0, 1), secs);
    for (let i = 0; i < 2000 && !hit.yours; i++) hit.tick(0.1);
    expect(hit.played(2)).toEqual({ result: 'hit', events: [{ kind: 'note', text: '', yours: false }] });
    expect(hit.played(2)).toBeNull();
  });

  it('holds while the board plays a chain out', () => {
    const show = new BalloonShow(acts.slice(0, 1), secs);
    play(show, undefined, 0);
    for (let i = 0; i < 2000 && show.beat().kind !== 'pop'; i++) { if (show.yours) show.played(2); show.tick(0.1); }
    const t = show.t;
    for (let i = 0; i < 100; i++) show.tick(0.1, true);
    expect(show.beat().kind).toBe('pop');
    expect(show.t).toBeLessThan(t + show.beat().secs);
    show.tick(0.1);
    expect(show.beat().kind).toBe('after');
  });

  it('Space goes on a beat at a time, and a big step still says everything once, in order', () => {
    const a = play(new BalloonShow(acts.slice(1), secs)).map((e) => e.kind);
    const b = new BalloonShow(acts.slice(1), secs);
    expect(b.tick(1000).map((e) => e.kind)).toEqual(a);
    const c = new BalloonShow(acts.slice(1), secs), seen: string[] = [];
    for (let n = 0; n < c.beats.length + 1 && !c.done; n++) seen.push(...c.skip().map((e) => e.kind));
    expect(seen).toEqual(a);
  });
});

describe('Sailing as it is', () => {
  it('her board is a plain Sailing game: nothing dealt but her platforms', () => {
    const g = layout(ROUTINES.bingo);
    expect(g).toBeInstanceOf(Sailing);
    expect(g.grid.flat().every((x) => !x)).toBe(true);
    expect(g.platforms).toHaveLength(ROUTINES.bingo.platforms.length);
  });
});

/* The user, 11 Nov, of Tzz's lesson: "her speech explains things. It doesn't really visibly show you the
   plan very well. Like, we're starting a stack. Great. What on earth does that even mean? What is the
   impact of that?" So the plan's marked on the board, read off the routine by the rules. */
describe('11 Nov, "it doesn\'t really visibly show you the plan": the plan, marked on the board', () => {
  const key = (x: unknown) => JSON.stringify(x);

  it('the Double\'s plan: the gap wanting yellow, three blues and the square for the fourth, the yellow dropping into the gap, the blues then the platform', () => {
    const P = plan(ROUTINES.double);
    expect(P.gaps).toEqual([{ at: [14, 2], colour: 1 }]);
    expect(P.lines).toEqual([{ n: 1, colour: 0, stack: expect.arrayContaining([[13, 3], [14, 3], [15, 3]]), four: [[12, 3]] }]);
    expect(P.drops).toEqual([{ from: [12, 2], to: [14, 2], colour: 1, yours: true }]);
    expect(P.pops.map((p) => [p.n, p.kind])).toEqual([[1, 'line'], [2, 'platform']]);
  });

  it('11 Nov: the ghost is where the routine\'s last pair goes, in its colours', () => {
    for (const r of Object.values(ROUTINES)) {
      const t = r.twists[r.twists.length - 1], [a, b] = t.pair;
      const want = t.turn === 0 ? [[t.row, t.col, a], [t.row, t.col + 1, b]] : t.turn === 1 ? [[t.row, t.col, a], [t.row + 1, t.col, b]] : null;
      expect(want).not.toBeNull();
      expect(plan(r).ghost).toEqual(want);
    }
  });

  it('11 Nov: each mark points at what it says: every gap filled by a balloon dropping into it in its colour, every stack three of a colour under the square its fourth comes to', () => {
    for (const r of Object.values(ROUTINES)) {
      const P = plan(r), ghost = P.ghost.map(([row, c]) => key([row, c]));
      for (const gap of P.gaps) expect(P.drops.find((d) => key(d.to) === key(gap.at))?.colour, `gap ${gap.at}`).toBe(gap.colour);
      for (const l of P.lines) {
        expect(l.stack).toHaveLength(3);
        expect(l.four).toHaveLength(1);
        const col = l.four[0][1], rows = l.stack.map(([row]) => row).sort((x, y) => x - y);
        expect(l.stack.every(([, c]) => c === col)).toBe(true);
        expect(rows).toEqual([rows[0], rows[0] + 1, rows[0] + 2]);
        expect(l.four[0][0]).toBe(rows[0] - 1);
        // (its fourth is yours, or a balloon dropping onto it)
        const four = key(l.four[0]);
        expect(ghost.includes(four) || P.drops.some((d) => key(d.to) === four)).toBe(true);
      }
      // (and every drop goes into a gap or onto a stack: nothing just falls about)
      for (const d of P.drops) expect([...P.gaps.map((x) => key(x.at)), ...P.lines.map((l) => key(l.four[0]))]).toContain(key(d.to));
      // (what pops after what: one to the end of the chain)
      expect(P.pops.map((p) => p.n)).toEqual(Array.from({ length: perform(r).steps }, (_, i) => i + 1));
    }
  });

  it('11 Nov, "words like trigger are shown before they\'re named": the gap\'s solid once it\'s the only square left, a stack from its first balloon, its fourth once there are three', () => {
    const at = (n: number) => marks(ROUTINES.double, n).filter((m) => !m.faint);
    expect(at(0)).toEqual([]);
    expect(at(2).filter((m) => m.kind === 'gap')).toEqual([]);
    expect(at(3)).toEqual(expect.arrayContaining([{ kind: 'gap', at: [14, 2], colour: 1 }, { kind: 'stack', cells: expect.any(Array), colour: 0, of: 1 }]));
    expect(at(3).some((m) => m.kind === 'four')).toBe(false);
    expect(at(4)).toEqual(expect.arrayContaining([{ kind: 'four', at: [12, 3], colour: 0 }, { kind: 'stack', cells: expect.any(Array), colour: 0, of: 3 }]));
    // (the Bingo's parked pair: its drops solid as soon as it's down)
    const b = ROUTINES.bingo, last = b.twists.length - 1, drops = (n: number) => marks(b, n).filter((m) => m.kind === 'drop' && !m.faint);
    expect(drops(last - 1)).toEqual([]);
    expect(drops(last).map((m) => (m as { from: readonly number[] }).from)).toEqual(expect.arrayContaining([[9, 2], [9, 3]]));
  });

  it('11 Nov: on your go, your pair\'s ghost, every drop and what pops in what order, all solid; the ghost never before, the pops only faint', () => {
    for (const r of Object.values(ROUTINES)) {
      const last = r.twists.length - 1;
      for (let n = 0; n < last; n++) {
        expect(marks(r, n).some((m) => m.kind === 'ghost')).toBe(false);
        expect(marks(r, n).filter((m) => m.kind === 'pop').every((m) => m.faint)).toBe(true);
      }
      const M = marks(r, last);
      expect(M.some((m) => m.faint)).toBe(false);
      expect(M.filter((m) => m.kind === 'ghost')).toEqual([{ kind: 'ghost', cells: plan(r).ghost }]);
      expect(M.filter((m) => m.kind === 'pop').map((m) => (m as { n: number }).n)).toEqual(plan(r).pops.map((p) => p.n));
      expect(M.filter((m) => m.kind === 'drop')).toHaveLength(plan(r).drops.length);
    }
  });

  it('a mark, once shown, stays while she builds (nothing she does takes the plan away), and once solid never goes faint again', () => {
    const plain = (m: Mark) => key({ ...m, faint: undefined, of: undefined });
    for (const r of Object.values(ROUTINES)) for (let n = 1; n < r.twists.length; n++) {
      const now = marks(r, n), was = marks(r, n - 1);
      for (const m of was) {
        const same = now.find((x) => plain(x) === plain(m));
        expect(same, key(m)).toBeDefined();
        if (!m.faint) expect(same!.faint, key(m)).toBeUndefined();
      }
    }
  });
});

/* The user, 12 Nov, of Tzz's Bingo: "when you've got the blues at the bottom, like where she's about to,
   like, drop a blue onto it, but she's then, like, building the platform at the top and the gap first.
   But it's like, well, hang on, what happened to the blues on the bottom? What's the plan? ... It kind of
   gets revealed right at the end." Your go is "perfectly clear and fantastic"; "while she's building it,
   it's a bit like, wait, why were you putting that there?" (RULES.md: a demonstration shows its plan
   before it builds.) */
describe('12 Nov, "what happened to the blues on the bottom? What\'s the plan?": the whole plan on the board from the start, to come faint', () => {
  const key = (x: unknown) => JSON.stringify(x);
  const plain = (m: Mark) => key({ ...m, faint: undefined, of: undefined });

  it('12 Nov: as each act starts, every gap, stack, fourth, drop and pop is already marked (faint, still to come); only the ghost waits for your go', () => {
    for (const r of Object.values(ROUTINES)) {
      const P = plan(r), M = marks(r, 0), last = marks(r, r.twists.length - 1);
      expect(M.filter((m) => m.kind === 'gap')).toHaveLength(P.gaps.length);
      expect(M.filter((m) => m.kind === 'stack')).toHaveLength(P.lines.length);
      expect(M.filter((m) => m.kind === 'four')).toHaveLength(P.lines.length);
      expect(M.filter((m) => m.kind === 'drop')).toHaveLength(P.drops.length);
      expect(M.filter((m) => m.kind === 'pop').map((m) => (m as { n: number }).n)).toEqual(P.pops.map((p) => p.n));
      expect(M.every((m) => m.faint)).toBe(true);
      // (the same marks as on your go, the ghost aside: the plan doesn't change, it fills in)
      expect(M.map(plain).sort()).toEqual(last.filter((m) => m.kind !== 'ghost').map(plain).sort());
    }
  });

  it('12 Nov: at the Bingo\'s first upstairs twist, the blue dropping onto the bottom blues and the pop order are already marked', () => {
    const b = ROUTINES.bingo, P = plan(b), upstairs = b.twists.findIndex((t) => t.row <= 11), M = marks(b, upstairs);
    expect(upstairs).toBe(4);
    // (the bottom blues: their stack solid, built; the blue that falls onto them from the parked pair, to come)
    const blues = P.lines.find((l) => l.colour === 0)!;
    expect(M).toContainEqual({ kind: 'stack', cells: blues.stack, colour: 0, of: 3 });
    const onto = P.drops.find((d) => d.colour === 0 && key(d.to) === key(blues.four[0]))!;
    expect(onto.from[0]).toBeLessThan(12);
    expect(M).toContainEqual({ kind: 'drop', from: onto.from, to: onto.to, colour: 0, faint: true });
    expect(M.filter((m) => m.kind === 'pop').map((m) => (m as { n: number }).n)).toEqual([1, 2, 3, 4]);
    // (and the top gap the yellow drops into, before she's built round it)
    expect(M.some((m) => m.kind === 'gap' && m.at[0] === 10)).toBe(true);
  });

  it('12 Nov: each part goes solid as she builds it, and your go is as it was', () => {
    for (const r of Object.values(ROUTINES)) {
      const last = r.twists.length - 1, solid = (n: number) => marks(r, n).filter((m) => !m.faint).length;
      for (let n = 1; n <= last; n++) expect(solid(n)).toBeGreaterThanOrEqual(solid(n - 1));
      expect(solid(last)).toBe(marks(r, last).length);
    }
  });
});

describe('11 Nov, "it\'s an actual instruction to you": what\'s for you to do or watch is a note of its own, up till the next', () => {
  const acts: Act[] = [{
    routine: ROUTINES.double, you: true,
    says: { start: 'hi', twists: ['a', 'b', 'c', 'd'], yours: 'go!', again: ['again'], brief: 'watch it fill', watch: { 2: 'the gap', 3: 'three blues' }, task: 'yellow over the gap', chain: 'watch it pop' },
  }];

  it('the brief as it starts, each watch once its pair\'s down, the task on your go (a miss leaves it up), and once it\'s set off what to watch pop', () => {
    const show = new BalloonShow(acts, secs), seen: string[] = [];
    for (let i = 0; i < 5000 && !show.done; i++) {
      for (const e of show.tick(0.05)) {
        if (e.kind === 'note') seen.push(`${e.yours ? 'yours ' : ''}${e.text}`);
        if (e.kind === 'land') seen.push(`land ${e.twist}`);
      }
      if (show.yours) {
        expect(show.played(0)!.events.filter((e) => e.kind === 'note')).toEqual([]);
        for (const e of show.played(2)!.events) if (e.kind === 'note') seen.push(e.text);
      }
    }
    expect(seen).toEqual(['watch it fill', 'land 0', 'land 1', 'land 2', 'the gap', 'land 3', 'three blues', 'yours yellow over the gap', 'watch it pop']);
  });

  it('11 Nov, "her instructions disappear very quickly": each note\'s up long enough to read before the next replaces it', () => {
    const show = new BalloonShow(acts, secs), at: [number, string][] = [];
    for (let i = 0; i < 5000 && !show.yours; i++) for (const e of show.tick(0.05)) if (e.kind === 'note') at.push([show.t, e.text]);
    expect(at.map(([, x]) => x)).toEqual(['watch it fill', 'the gap', 'three blues', 'yellow over the gap']);
    for (let k = 1; k < at.length; k++) expect(at[k][0] - at[k - 1][0], at[k - 1][1]).toBeGreaterThanOrEqual(secs(at[k - 1][1]) - 0.06);
  });
});

describe('11 Nov, "surely it should start at the top ... give you a bit more of a chance": your go', () => {
  it('your pair comes in at the top of the middle columns, waits a moment, then falls slower than at sea, with time to steer it to the ghost', () => {
    expect(SHOW.YOU_FALL).toBeGreaterThan(FALL.SECS);
    expect(SHOW.YOU_WAIT).toBeGreaterThanOrEqual(1.5);
    for (const r of Object.values(ROUTINES)) {
      const n = r.twists.length - 1, t = r.twists[n], g = setup(r, n), way = route(g, t)!;
      const P = new SailPair(g);
      expect([P.row, P.col]).toEqual([0, SPAWN[0]]);
      const moves = way.filter((s) => s !== 'down').length, secs = SHOW.YOU_WAIT + t.row * SHOW.YOU_FALL;
      expect(secs).toBeGreaterThanOrEqual(6);
      expect(secs / Math.max(1, moves)).toBeGreaterThanOrEqual(1.5);
    }
  });
});
