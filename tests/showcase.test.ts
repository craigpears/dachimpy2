/* Modelling looks, for anyone anywhere (src/showcase.ts). The user, 11 Nov, of Mischievious modelling
   her looks at her wedding: "that definitely needs to be a generic module so that you can just ... go
   through someone like as a wardrobe furniture kind of thing that you can just like cycle and demo some
   outfits ... incredibly reusable." */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SHOW, Showcase, TWIRL, choices, restyle, titled, twirlAt } from '../src/showcase';
import type { Look } from '../src/showcase';

describe('going through the looks (11 Nov: "cycle and demo some outfits")', () => {
  it('shows each for a while, once round from where it started, then stops on the last', () => {
    const S = new Showcase(3);
    S.start(1);
    expect([S.on, S.i]).toEqual([true, 1]);
    expect(S.tick(SHOW.HOLD - 0.1)).toBe(null);
    expect(S.tick(0.2)).toBe('next');
    expect(S.i).toBe(2);
    expect(S.tick(SHOW.HOLD + 0.1)).toBe('next');
    expect(S.i).toBe(0);
    expect(S.tick(SHOW.HOLD + 0.1)).toBe('done');
    expect([S.on, S.i]).toEqual([false, 0]);
    expect(S.tick(10)).toBe(null);
  });

  it('or round and round for ever', () => {
    const S = new Showcase(2, 1, true);
    S.start();
    const seen = Array.from({ length: 5 }, () => (S.tick(1.1), S.i));
    expect(seen).toEqual([1, 0, 1, 0, 1]);
    expect(S.on).toBe(true);
  });

  it('goes on, back, or straight to one, wrapping round, its clock from the start', () => {
    const S = new Showcase(4);
    S.start();
    S.tick(2);
    S.prev();
    expect([S.i, S.t]).toEqual([3, 0]);
    S.next(); S.next();
    expect(S.i).toBe(1);
    S.pick(9);
    expect(S.i).toBe(1);
    S.stop();
    expect(S.tick(99)).toBe(null);
  });

  it('starts on nothing if there\'s nothing to show', () => {
    const S = new Showcase(0);
    S.start(3);
    expect([S.on, S.i]).toEqual([false, 0]);
  });

  it('says each look by its title, its bubble gone before the next is up', () => {
    expect(titled({ title: 'Taco Princess', look: {} })).toBe('"Taco Princess"');
    expect(SHOW.TITLE).toBeLessThan(SHOW.HOLD);
  });
});

describe('the twirl: a spin with a little hop', () => {
  it('goes a whole turn round, up and back down', () => {
    expect(twirlAt(TWIRL.SECS)).toEqual({ turn: 0, hop: 0 });
    const mid = twirlAt(TWIRL.SECS / 2);
    expect(mid.turn).toBeCloseTo(Math.PI);
    expect(mid.hop).toBeCloseTo(TWIRL.HOP);
    expect(twirlAt(0)).toEqual({ turn: 0, hop: 0 });
    expect(twirlAt(-1)).toEqual({ turn: 0, hop: 0 });
    expect(twirlAt(0.01).turn).toBeGreaterThan(Math.PI * 1.9);
  });
});

describe('a piece swapped on any look', () => {
  const looks: Look[] = [
    { body: 'f', fam: 'squirrel', famCol: 'grey', famCol2: 'red', hat: 'feline', hatCol: 'black' },
    { body: 'f', fam: 'monkey', famCol: 'pink', famCol2: 'red' },
    { body: 'f', fam: 'none', famCol: 'green', famCol2: 'red' },
  ];
  it('in the colours another look wears it in', () => {
    expect(restyle(looks[0], { fam: 'monkey' }, looks)).toEqual({ ...looks[0], fam: 'monkey', famCol: 'pink', famCol2: 'red' });
  });
  it('else in the wardrobe\'s own (its colours left off)', () => {
    const out = restyle(looks[0], { fam: 'parrot' }, looks);
    expect(out.fam).toBe('parrot');
    expect('famCol' in out || 'famCol2' in out).toBe(false);
    expect(out.hatCol).toBe('black');
  });
  it('and nothing swapped is nothing changed', () => {
    expect(restyle(looks[0], {}, looks)).toEqual(looks[0]);
    expect(restyle(looks[0], { fam: undefined }, looks)).toEqual(looks[0]);
    expect(restyle(looks[0], { fam: 'squirrel' }, looks)).toEqual(looks[0]);
  });
  it('never changes the look it was given', () => {
    const was = JSON.stringify(looks);
    restyle(looks[0], { fam: 'bat', hat: 'tiara' }, looks);
    expect(JSON.stringify(looks)).toBe(was);
  });
});

describe('the choices for a piece', () => {
  const all = ['none', 'parrot', 'monkey', 'bat'];
  it('its own first, then those put first, the rest, none last, each once', () => {
    expect(choices('bat', all, ['monkey'])).toEqual(['bat', 'monkey', 'parrot', 'none']);
    expect(choices('monkey', all, ['monkey'])).toEqual(['monkey', 'parrot', 'bat', 'none']);
    expect(choices(undefined, all, ['monkey'])).toEqual(['none', 'monkey', 'parrot', 'bat']);
    expect(choices('dragon', all, ['kraken'])).toEqual(['parrot', 'monkey', 'bat', 'none']);
  });
});

describe('one twirl, in one place (11 Nov: "a generic module")', () => {
  it('is the showcase\'s: the wedding only configures it', () => {
    const W = readFileSync(join(__dirname, '..', 'js', 'den', 'wedding.js'), 'utf8');
    expect(W).toMatch(/from '\.\/showcase\.js'/);
    expect(W).not.toMatch(/Math\.PI \* 2; p\.g\.position\.y \+=/);
    expect(W).not.toMatch(/function twirl\(/);
  });
});
