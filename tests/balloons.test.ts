/* Balloon animals (src/balloons.ts): Sailing's pieces twisted out of balloons and played onto a real
   Sailing board. The user (11 Nov): "how on earth do these sailing pieces pop in the puzzle? It makes
   sense. They're balloon animals"; then, of a first go, "it's not really a real looking sailing board,
   it's just things stacked on each other ... She's helping you ... how to build doubles and bingos and
   things", and "it should definitely be like a now you try thing ... she sets up the balloons, you do
   the pop". */
import { describe, expect, it } from 'vitest';
import { ROUTINES, SHOW, BalloonShow, beats, layout, perform, route, setup, staircase, type Act, type ShowEvent } from '../src/balloons';
import { Sailing, PLATFORM, SPAWN } from '../src/sailing';
import { SailPair } from '../src/sail-pair';

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
  it('a Double, a Bingo and a Vegas: nothing pops till the last pair, then a chain of two, four, six', () => {
    const want = { double: [3, 2, 'Double'], bingo: [5, 4, 'Bingo!'], vegas: [7, 6, 'Vegas!!'] } as const;
    for (const [name, r] of Object.entries(ROUTINES)) {
      const p = perform(r), [twists, steps, chain] = want[name as keyof typeof want];
      expect(r.twists).toHaveLength(twists);
      expect(p.early).toBe(0);
      expect([p.steps, p.name]).toEqual([steps, chain]);
    }
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

  it('its platforms are Sailing\'s own sizes: two by two at least, never a little row (11 Nov)', () => {
    for (const r of Object.values(ROUTINES)) for (const p of r.platforms) {
      expect(p.w).toBeGreaterThanOrEqual(PLATFORM.W[0]);
      expect(PLATFORM.H).toContain(p.h);
    }
  });

  it('the board after her setup is what the rules make of it, and the pair she hands you sets it off', () => {
    for (const r of Object.values(ROUTINES)) {
      const n = r.twists.length - 1, g = setup(r, n), t = r.twists[n];
      expect(g.pair).toEqual([t.pair[0], t.pair[1]]);
      const res = g.drop(t.col, t.turn, t.row);
      expect(res.steps).toBe(perform(r).steps);
      // (and the stair's chain doesn't clear the board: a spare platform's left, so its name shows)
      expect(res.boardCleared).toBe(false);
    }
  });

  it('a staircase of n ledges is a chain of n', () => {
    for (const n of [1, 2, 3, 4, 5, 6]) {
      const slot = [1, 2, 0, 1, 2, 0].slice(0, n), floor = [0, 1, 2, 0, 1, 2].slice(0, n);
      expect(perform(staircase(slot, floor, 2)).steps).toBe(n);
    }
  });
});

describe('the show: she sets the balloons up, squeak by squeak; you do the pop', () => {
  const acts: Act[] = [
    { routine: ROUTINES.double, says: { start: 'watch', twists: ['one', 'two'], yours: 'your go', again: ['again!'], help: 'like this', popped: 'Double!' }, you: true },
    { routine: ROUTINES.bingo, says: { twists: ['this,'] } },
  ];

  it('each of her pairs twisted (two squeaks, tossed), then steered down and landed; then your turn, then the chain', () => {
    const kinds = play(new BalloonShow(acts, secs)).map((e) => (e.kind === 'line' ? `line ${e.text}` : e.kind));
    expect(kinds.slice(0, 18)).toEqual([
      'act', 'line watch',
      'line one', 'squeak', 'squeak', 'toss', 'fall', 'land',
      'line two', 'squeak', 'squeak', 'toss', 'fall', 'land',
      'line your go', 'yours',
      'line Double!', 'act',
    ]);
    // (the second act's hers all through: five pairs, no turn of yours)
    expect(kinds.filter((k) => k === 'toss')).toHaveLength(2 + 5);
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
    expect(ev.map((e) => e.colour)).toEqual(ROUTINES.double.twists.slice(0, 2).flatMap((t) => [t.pair[0], t.pair[1]]));
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
    expect(help.events.map((e) => e.kind)).toEqual(['again', 'line', 'fall']);
    expect(show.yours).toBe(false);
    const hit = new BalloonShow(acts.slice(0, 1), secs);
    for (let i = 0; i < 2000 && !hit.yours; i++) hit.tick(0.1);
    expect(hit.played(2)).toEqual({ result: 'hit', events: [] });
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
    const g = layout(ROUTINES.vegas);
    expect(g).toBeInstanceOf(Sailing);
    expect(g.grid.flat().every((x) => !x)).toBe(true);
    expect(g.platforms).toHaveLength(ROUTINES.vegas.platforms.length);
  });
});
