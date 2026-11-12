/* A whirlpool on the sloop's sea, by YPPedia's rules (src/den-whirl.ts): "The whirlpool covers a two
   tile by two tile area"; "On each move, whirlpools move the ship clockwise around to the opposite
   corner of the whirlpool. They simultaneously rotate the ship clockwise 90 degrees." */
import { describe, expect, it } from 'vitest';
import { WHIRL, inWhirlpool, whirl, whirlAt, whirlpool } from '../src/den-whirl';
import { Helm, SAIL, Sea, type Pose, type SailEvent } from '../src/den-sail';

describe('a whirlpool, as YPPedia has it (11 Nov)', () => {
  const w = whirlpool({ at: [4, 6] });

  it('covers two squares by two', () => {
    expect(w.squares).toHaveLength(4);
    for (const [c, r] of [[4, 6], [5, 6], [4, 7], [5, 7]] as [number, number][]) expect(inWhirlpool(w, c, r)).toBe(true);
    expect(inWhirlpool(w, 6, 6)).toBe(false);
  });

  it('moves her clockwise round to the opposite corner, by the next one, turned a quarter clockwise', () => {
    // Seen from above, out to sea up: from the near right corner, clockwise is by the near left one.
    const got = whirl(w, { c: 5, r: 6, d: 0 });
    expect(got.via).toEqual([4, 6]);
    expect(got.to).toEqual({ c: 4, r: 7, d: 1 });
    // and on round, clockwise, from each corner
    expect(whirl(w, { c: 4, r: 7, d: 1 })).toEqual({ via: [5, 7], to: { c: 5, r: 6, d: 2 } });
    expect(whirl(w, { c: 4, r: 6, d: 3 })).toEqual({ via: [4, 7], to: { c: 5, r: 7, d: 0 } });
  });

  it('four whirls and she ends "in exactly the same position and orientation as it started"', () => {
    for (const start of [{ c: 4, r: 6, d: 0 }, { c: 5, r: 7, d: 3 }] as Pose[]) {
      let p = start;
      for (let i = 0; i < 4; i++) p = whirl(w, p).to;
      expect(p).toEqual(start);
    }
  });

  it('swings her round its middle as it goes, through the next corner halfway', () => {
    const from = { c: 5, r: 6, d: 0 }, to = whirl(w, from).to, half = whirlAt(from, to, 0.5);
    expect(half.c).toBeCloseTo(4);
    expect(half.r).toBeCloseTo(6);
    expect(half.a).toBeCloseTo(0.5);
    expect(whirlAt(from, to, 1)).toMatchObject({ c: 4, r: 7, a: 1 });
  });

  it('with a corner missing, the corner opposite it sends her onto it; the two either side of it send her to and fro', () => {
    const g = whirlpool({ at: [4, 6], gone: [4, 7] });
    expect(g.squares).toHaveLength(3);
    expect(inWhirlpool(g, 4, 7)).toBe(false);
    expect(whirl(g, { c: 5, r: 6, d: 0 }).to).toMatchObject({ c: 4, r: 7 });
    expect(whirl(g, { c: 4, r: 6, d: 0 }).to).toMatchObject({ c: 5, r: 7 });
    expect(whirl(g, { c: 5, r: 7, d: 0 }).to).toMatchObject({ c: 4, r: 6 });
    expect(() => whirlpool({ at: [4, 6], gone: [7, 7] })).toThrow();
  });

  it('on the helm: it acts when she comes to rest on it, and lets her go after a whole turn round, never holding her for ever', () => {
    const s = new Sea(1, false), pool = whirlpool({ at: [4, 6] });
    for (const [c, r] of pool.squares) s.whirls.set(`${c},${r}`, pool);
    const h = new Helm(s, { c: 4, r: 4, d: 0 }), ev: SailEvent[] = [];
    h.put('F'); h.put('F');
    for (let t = 0; t < 30; t += 0.02) ev.push(...h.tick(0.02));
    const whirls = ev.filter((e) => e.kind === 'push' && e.whirl);
    // Into the near left corner, then round and round: four whirls, back as she was, and let be.
    expect(whirls).toHaveLength(WHIRL.MOST);
    expect(h.pose).toEqual({ c: 4, r: 6, d: 0 });
    expect(h.whirling()).toBe(false);
    // A move of her own and it has her again.
    h.put('F');
    const more: SailEvent[] = [];
    for (let t = 0; t < 10; t += 0.02) more.push(...h.tick(0.02));
    expect(more.some((e) => e.kind === 'push' && e.whirl)).toBe(true);
  });

  // The user (12 Nov), at the race's start and Kikkit's: "if I do like forward into a whirlpool, it should
  // be like take me into the whirlpool, then to the other corner, rotate it a bit, and then my next
  // forward should happen." It whirled her four times in a row, back where she'd come in, and her next
  // move went on from there.
  it('a move into a whirlpool: her move, the pool\'s step to its far corner, then her next move (12 Nov)', () => {
    const s = new Sea(1, false), pool = whirlpool({ at: [4, 6] });
    for (const [c, r] of pool.squares) s.whirls.set(`${c},${r}`, pool);
    const h = new Helm(s, { c: 4, r: 5, d: 0 }), ev: { e: SailEvent; t: number }[] = [];
    h.put('F'); h.put('F');
    for (let t = 0; t < 8; t += 0.02) for (const e of h.tick(0.02)) ev.push({ e, t });
    const steps = ev.filter(({ e }) => e.kind === 'move' || (e.kind === 'push' && e.whirl));
    // Into its near left corner; one whirl, to the far right one, a quarter turn right; then her
    // forward, from there, facing right: off the pool.
    expect(steps.map(({ e }) => e.kind === 'move' ? `F ${e.to.c},${e.to.r}` : e.kind === 'push' ? `whirl ${e.to.c},${e.to.r},${e.to.d}` : '')).toEqual(['F 4,6', 'whirl 5,7,1', 'F 6,7']);
    expect(h.pose).toEqual({ c: 6, r: 7, d: 1 });
    // The whirl a beat of its own, as long as a move's about: not instant, not slow.
    const beat = steps[2].t - steps[1].t, move = steps[1].t - steps[0].t;
    expect(beat).toBeGreaterThan(0.6);
    expect(beat).toBeLessThanOrEqual(move + 0.05);
    // One beat: the step, and the move after it, both in the one turn.
    expect(ev.filter(({ e }) => e.kind === 'turn')).toHaveLength(1);
  });

  it('where its step leaves her on it still, it acts again only a beat later: her next move first, or with none a breather', () => {
    const s = new Sea(1, false), pool = whirlpool({ at: [4, 6] });
    for (const [c, r] of pool.squares) s.whirls.set(`${c},${r}`, pool);
    const h = new Helm(s, { c: 4, r: 5, d: 0 }), at: number[] = [];
    h.put('F');
    for (let t = 0; t < 12; t += 0.02) for (const e of h.tick(0.02)) if (e.kind === 'push' && e.whirl) at.push(t);
    // Round and round, a step at a time, each a breather after the last: never two at once.
    expect(at).toHaveLength(WHIRL.MOST);
    for (let i = 1; i < at.length; i++) expect(at[i] - at[i - 1]).toBeGreaterThanOrEqual(WHIRL.SECS + SAIL.BREAK - 0.05);
    expect(h.pose).toEqual({ c: 4, r: 6, d: 0 });
  });
});
