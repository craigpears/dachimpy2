/* Whoever you marry comes home with you (src/den-spouse.ts). The user, 11 Nov: "whoever you marry, I
   think naturally has to jump on the ship with you after you leave the Isle to have that continuity and
   hang out with the Den with you, that sort of thing. It's got to carry out into the world." */
import { describe, expect, it } from 'vitest';
import { dressFor, fresh, seeded, suitors } from '../src/den-wedding';
import type { Look, Wedding } from '../src/den-wedding';
import { ABOARD, Chatter, STROLL, Stroll, cleanSpouse, homeLines, homeNews, leaving, reopened, settle, spouseOf } from '../src/den-spouse';
import type { Area } from '../src/den-spouse';
import { SUITORS } from '../src/lines/suitors';

const HER = [
  { title: 'Son of a Nutcracker!', look: { body: 'f', hat: 'none', fam: 'squirrel' } as Look },
  { title: 'Taco Princess', look: { body: 'f', hat: 'tiara' } as Look },
];
const married = (partner: Wedding['partner'], tone: 'happy' | 'dark' = 'happy'): Wedding => ({ ...dressFor(fresh(tone), 'rosy'), partner });
const seq = (...xs: number[]) => { let i = 0; return () => xs[i++ % xs.length]; };

describe('whoever you marry comes home with you (11 Nov: "It\'s got to carry out into the world")', () => {
  it('is whoever the wedding married you to, in their wedding look: her (the version you picked), a suitor, or your own', () => {
    expect(spouseOf(married({ kind: 'her', ver: 1 }), HER)).toEqual({ kind: 'her', name: 'Mischievious', look: HER[1].look, title: 'Taco Princess' });
    const barnaby = spouseOf(married({ kind: 'suitor', i: 0 }, 'dark'), HER)!;
    expect(barnaby).toMatchObject({ kind: 'suitor', name: 'Barnaby', suitor: 'barnaby', hurt: true });
    expect(barnaby.look).toEqual(suitors('dark')[0].look);
    expect(spouseOf(married({ kind: 'suitor', i: 0 }, 'happy'), HER)).toMatchObject({ name: 'Sweet William', suitor: 'william' });
    expect(spouseOf(married({ kind: 'suitor', i: 3 }), HER)).toMatchObject({ name: 'Captain Rosalind', suitor: 'rosalind' });
    const own = spouseOf(married({ kind: 'own', look: { body: 'm', name: 'Fernando', hat: 'tricorne' } }), HER)!;
    expect(own).toMatchObject({ kind: 'own', name: 'Fernando', look: { hat: 'tricorne' } });
    expect(spouseOf(married({ kind: 'own', look: { body: 'f' } }), HER)!.name).toBe('Your sweetheart');
    expect(spouseOf(married(null), HER)).toBe(null);
  });

  it('is kept with your save: what\'s stored comes back the same, and anything else is nobody', () => {
    for (const p of [{ kind: 'her', ver: 0 }, { kind: 'suitor', i: 0 }, { kind: 'suitor', i: 5 }, { kind: 'own', look: { body: 'f', name: 'Ada', top: 'corset' } }] as const) {
      for (const tone of ['happy', 'dark'] as const) {
        const s = spouseOf(married(p as Wedding['partner'], tone), HER)!;
        expect(cleanSpouse(JSON.parse(JSON.stringify(s)))).toEqual(s);
      }
    }
    expect(cleanSpouse(null)).toBe(null);
    expect(cleanSpouse({ kind: 'suitor', suitor: 'nobody', look: {} })).toBe(null);
    expect(cleanSpouse({ kind: 'mystery' })).toBe(null);
    // (a name's a name, not a script)
    expect(cleanSpouse({ kind: 'own', name: '<img onerror=x>', look: { body: 'm' } })!.name).toBe('Your sweetheart');
    expect(cleanSpouse({ kind: 'suitor', suitor: 'pete', name: 'Someone Else', look: {} })!.name).toBe('Wobbly Pete');
  });

  it('sailed home with you once, then stayed at the den on later trips: aboard every time you set sail (11 Nov)', () => {
    let w = settle('aboard', { sailing: false, onIsle: false });
    expect(w).toBe('den');
    w = settle(w, { sailing: true, onIsle: false });
    expect(w).toBe('aboard');
    w = settle(w, { sailing: false, onIsle: false });
    expect(w).toBe('den');
    expect(settle('den', { sailing: false, onIsle: false })).toBe('den');
  });

  it('comes aboard with you leaving the isle by sea, or straight home by the cheat; steps off once she\'s home and you\'re ashore', () => {
    expect(leaving(true)).toBe('aboard');
    expect(leaving(false)).toBe('den');
    expect(settle('aboard', { sailing: true, onIsle: false })).toBe('aboard');
    expect(settle('aboard', { sailing: true, onIsle: true })).toBe('aboard');
    expect(settle('aboard', { sailing: false, onIsle: false })).toBe('den');
    expect(settle('isle', { sailing: false, onIsle: true })).toBe('isle');
    expect(reopened()).toBe('den');
  });

  it('stands on her deck clear of you at the tiller (x -1.15) and of Umami on her foredeck (x 1.55)', () => {
    expect(Math.hypot(ABOARD.x + 1.15, ABOARD.z)).toBeGreaterThan(0.8);
    expect(Math.hypot(ABOARD.x - 1.55, ABOARD.z)).toBeGreaterThan(0.8);
    expect(Math.abs(ABOARD.z)).toBeLessThan(0.7);   // (on her deck, not over the side)
  });

  it('has lines of their own at home, whoever they are, and says so as they come home', () => {
    for (const id of Object.keys(SUITORS)) {
      const L = homeLines({ kind: 'suitor', name: '', look: {}, suitor: id as keyof typeof SUITORS });
      expect(L.aboard.length).toBeGreaterThan(10);
      expect(L.den.length).toBeGreaterThanOrEqual(2);
    }
    expect(homeLines({ kind: 'her', name: 'Mischievious', look: {} }).den.length).toBeGreaterThanOrEqual(2);
    expect(homeLines({ kind: 'own', name: 'Ada', look: {} }).den.length).toBeGreaterThanOrEqual(2);
    expect(homeNews({ kind: 'own', name: 'Ada', look: {} }, true)).toMatch(/^Ada's aboard/);
    expect(homeNews({ kind: 'suitor', name: 'Barnaby', look: {}, suitor: 'barnaby' }, false)).toMatch(/^Barnaby's come home/);
  });
});

describe('at the den: strolling about, stopping for a word', () => {
  const AREA: Area = { x0: -5, x1: 5, z0: 4, z1: 12 };
  const crate = { x: 0, z: 8, r: 1.2 };
  const free = (x: number, z: number) => Math.hypot(x - crate.x, z - crate.z) > crate.r && x >= AREA.x0 && x <= AREA.x1 && z >= AREA.z0 && z <= AREA.z1;

  it('wanders from spot to spot, staying a while at each, never into anything', () => {
    const S = new Stroll(AREA, free, seeded(11));
    const spots = new Set<string>();
    for (let t = 0; t < 240; t += 0.1) {
      S.tick(0.1);
      expect(free(S.x, S.z), `at ${S.x.toFixed(2)}, ${S.z.toFixed(2)}`).toBe(true);
      if (!S.to) spots.add(`${S.x.toFixed(1)},${S.z.toFixed(1)}`);
    }
    expect(spots.size).toBeGreaterThan(5);
  });

  it('stops and turns to you when you come up to them, then strolls on once you go', () => {
    const S = new Stroll(AREA, free, seq(0.2, 0.8), { x: -3, z: 5 });
    S.wait = 0;
    S.tick(0.1);
    expect(S.walking).toBe(true);
    const at = { x: S.x, z: S.z };
    for (let i = 0; i < 20; i++) S.tick(0.1, { x: S.x + 1, z: S.z });
    expect(S.chatting).toBe(true);
    expect(S.walking).toBe(false);
    expect(Math.hypot(S.x - at.x, S.z - at.z)).toBeLessThan(0.2);
    expect(S.yaw).toBeCloseTo(Math.PI / 2);   // (facing you, along +x)
    S.tick(0.1, { x: S.x + STROLL.CHAT + 1, z: S.z });
    expect(S.chatting).toBe(false);
  });

  it('says a line as you come up to them, never the same twice running, and not again straight away', () => {
    const C = new Chatter(['a', 'b', 'c']);
    expect(C.tick(0.1, false)).toBe(null);
    expect(C.tick(0.1, true)).toBe('a');
    expect(C.tick(0.1, true)).toBe(null);   // (still there: nothing more)
    C.tick(0.1, false);
    expect(C.tick(0.1, true)).toBe(null);   // (back too soon)
    C.tick(STROLL.GAP, false);
    expect(C.tick(0.1, true)).toBe('b');
    const said: string[] = [];
    for (let i = 0; i < 9; i++) { C.tick(STROLL.GAP, false); said.push(C.tick(0.1, true)!); }
    for (let i = 1; i < said.length; i++) expect(said[i]).not.toBe(said[i - 1]);
  });
});
