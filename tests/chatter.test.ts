/* Someone standing about talking (src/chatter.ts): the user, 11 Nov, "a pirate with a configurable loop
   of text", and "Kikkit should just be a bit of config ... using ... some generic pirate talking". */
import { describe, expect, it } from 'vitest';
import { Chatter, type Script } from '../src/chatter';

const secs = () => 2;
/** Plays a chatter for `t` seconds an eighth at a time (exact in floating point), `near` or not: the lines begun. */
function play(c: Chatter, t: number, near = true, dt = 0.125): string[] {
  const out: string[] = [];
  for (let s = 0; s < t - 1e-9; s += dt) { const l = c.tick(dt, near); if (l) out.push(l); }
  return out;
}
const S: Script = { intro: ['hi', 'so'], loop: ['a', 'b', 'c'] };

describe('a script: lines once, then a list round and round', () => {
  it('the intro once, in order, then the loop for ever', () => {
    const c = new Chatter(S, { secs });
    expect(Array.from({ length: 9 }, () => c.next())).toEqual(['hi', 'so', 'a', 'b', 'c', 'a', 'b', 'c', 'a']);
  });
  it('retold: the intro again after each time round', () => {
    const c = new Chatter({ ...S, retell: true }, { secs });
    expect(Array.from({ length: 12 }, () => c.next())).toEqual(['hi', 'so', 'a', 'b', 'c', 'hi', 'so', 'a', 'b', 'c', 'hi', 'so']);
  });
  it('an intro alone is said once, and then nothing', () => {
    const c = new Chatter({ intro: ['x', 'y'] }, { secs });
    expect([c.next(), c.next(), c.next(), c.next()]).toEqual(['x', 'y', null, null]);
  });
  it('random: any of the loop each time', () => {
    let k = 0;
    const c = new Chatter({ loop: ['a', 'b', 'c'], random: true }, { secs, rand: () => [0.9, 0.1, 0.5][k++ % 3] });
    expect([c.next(), c.next(), c.next()]).toEqual(['c', 'a', 'b']);
  });
});

describe('played: a line at a time, while you\'re within earshot', () => {
  it('says nothing till it\'s begun; then each line for its time, the next straight after', () => {
    const c = new Chatter(S, { secs });
    expect(play(c, 5)).toEqual([]);
    expect(c.start()).toBe(true);
    expect(c.start()).toBe(false);
    expect(play(c, 6.125)).toEqual(['hi', 'so', 'a', 'b']);
  });
  it('a pause between lines (`gap`), and a wait before the first', () => {
    const c = new Chatter(S, { secs, gap: 3, wait: 1 });
    c.start();
    expect(play(c, 1)).toEqual(['hi']);
    expect(play(c, 4.75)).toEqual([]);
    expect(play(c, 0.125)).toEqual(['so']);
  });
  it('out of earshot it finishes its line and stops; back in earshot it carries on where it was', () => {
    const c = new Chatter(S, { secs });
    c.start();
    expect(play(c, 0.125)).toEqual(['hi']);
    expect(play(c, 30, false)).toEqual([]);
    expect(c.line).toBeNull();
    expect(play(c, 0.125)).toEqual(['so']);
  });
  it('Space: on to the next line now; or, not begun, its first', () => {
    const c = new Chatter(S, { secs, gap: 5 });
    expect(c.hail()).toBe('hi');
    expect(c.started).toBe(true);
    expect(c.hail()).toBe('so');
    expect(c.hail()).toBe('a');
  });
  it('an aside slots in over its line, in turn, round again; then it carries on where it was', () => {
    const c = new Chatter({ ...S, asides: { oops: ['o1', 'o2'] } }, { secs });
    c.start();
    expect(play(c, 0.125)).toEqual(['hi']);
    expect(c.aside('oops')).toBe('o1');
    expect(c.line?.text).toBe('o1');
    expect(play(c, 2)).toEqual(['so']);
    expect([c.aside('oops'), c.aside('oops'), c.aside('oops')]).toEqual(['o2', 'o1', 'o2']);
    expect(c.aside('none')).toBeNull();
  });
  it('an aside before it\'s begun is said, and then it\'s quiet', () => {
    const c = new Chatter({ ...S, asides: { oops: ['o1'] } }, { secs });
    expect(c.aside('oops')).toBe('o1');
    expect(play(c, 10)).toEqual([]);
    expect(c.started).toBe(false);
  });
});

describe("pirates other than Kikkit talk now and then, not every few seconds (11 Nov: \"it's not the odd bonus thing. Like, it's coming along every few seconds\")", () => {
  it('an aside comes a good while after the last line; Kikkit rambles on, line on line', async () => {
    const { PACE } = await import('../src/chatter');
    const { TZZ_CAST } = await import('../src/den-tzz');
    expect(PACE.ASIDE[0]).toBeGreaterThanOrEqual(15);
    expect(PACE.RAMBLE).toBe(0);
    expect(TZZ_CAST.her.gap).toEqual(PACE.ASIDE);
  });
});
