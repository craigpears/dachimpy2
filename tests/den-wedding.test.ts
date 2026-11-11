/* Mischievious's wedding (src/den-wedding.ts): the tone, venues, themes and their layouts, the suitors,
   the plots' timelines, her gushing, and the set-up kept and shared. (10 Nov) */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AREA, DYE_NAMES, GUESTS, GUSH, Gush, MAX_PROPS, PLOTS, PROPS, SUGGEST, THEMES, TONES, VENUES, WELCOME, WRECK,
  arrival, caption, clean, decode, dressFor, encode, fill, fresh, layout, moveTo, plotAt, plotScript, readSecs,
  scriptSecs, seatsFor, suitorTitle, suitors, themeLook, wearable,
} from '../src/den-wedding';
import type { Prop, Wedding } from '../src/den-wedding';

const LOOK_JS = readFileSync(join(__dirname, '..', 'js', 'den-look.js'), 'utf8');
/** The wardrobe's own lists, read from js/den-look.js (it needs three.js to run). */
const DYES_IN_WARDROBE = (() => {
  const body = LOOK_JS.match(/export const DYES = \{([\s\S]*?)\n\};/)![1].replace(/\/\/.*$/gm, '');
  return [...body.matchAll(/(?:'([^']+)'|([a-z]+)):\s*'#/g)].map((m) => m[1] ?? m[2]);
})();
const seq = (...xs: number[]) => { let i = 0; return () => xs[i++ % xs.length]; };
const planned = (): Wedding => ({ ...dressFor(fresh('dark'), 'gory'), partner: { kind: 'suitor', i: 0 }, plot: 'raiders' });

describe('the wedding\'s choices (10 Nov)', () => {
  it('uses only the wardrobe\'s own dyes, every one of them by its Puzzle Pirates name', () => {
    for (const d of DYE_NAMES) expect(DYES_IN_WARDROBE).toContain(d);
    const used = [...THEMES.flatMap((t) => [...t.dyes, ...t.guests.flatMap((g) => Object.entries(g).filter(([k]) => /Col2?$/.test(k) && !/hair|fam/.test(k)).map(([, v]) => v))]),
      ...WRECK.map((p) => p.c), ...VENUES.flatMap((v) => THEMES.flatMap((t) => layout(v.id, t.id as 'rosy').map((p) => p.c)))];
    for (const c of used) expect(DYE_NAMES).toContain(c);
  });

  it('offers two tones, three venues on her island, three themes and four plots', () => {
    expect(TONES.map((t) => t.name)).toEqual(['Happy and cheesy', 'Dark humour']);
    expect(VENUES.map((v) => v.id)).toEqual(['beach', 'chapel', 'deck']);
    expect(THEMES.map((t) => t.name)).toEqual(['Happy and rosy', 'Bloody and gory', 'Drunkards\' fest']);
    expect(PLOTS.map((p) => p.name)).toEqual(['Sweet and blissful', 'Raiders crash it', 'Somebody\'s drunk', 'A brawl breaks out']);
  });

  it('gives every theme a starting layout at every venue, all inside the venue, and its guests dressed to suit', () => {
    for (const v of VENUES) for (const t of THEMES) {
      const ps = layout(v.id, t.id as 'rosy');
      expect(ps.length).toBeGreaterThan(12);
      expect(ps.length).toBeLessThanOrEqual(MAX_PROPS);
      expect(ps.filter((p) => p.k === 'arch')).toHaveLength(1);
      expect(ps.filter((p) => p.k === 'bench').length).toBeGreaterThanOrEqual(4);
      expect(ps.some((p) => p.k === 'cake')).toBe(true);
      for (const p of ps) { expect(Math.abs(p.x)).toBeLessThanOrEqual(AREA.x); expect(p.z).toBeGreaterThanOrEqual(AREA.z0); expect(p.z).toBeLessThanOrEqual(AREA.z1); expect(p.w).toBeFalsy(); }
      expect(t.guests).toHaveLength(GUESTS);
    }
    // Each venue adds something of its own.
    expect(layout('beach', 'rosy')).not.toEqual(layout('chapel', 'rosy'));
    // The drunkards' fest has a tankard in every hand.
    expect(THEMES[2].guests.every((g) => g.hand === 'tankard')).toBe(true);
  });

  it('dresses a guest afresh within the theme: its clothes and its colours', () => {
    for (const t of THEMES) for (const body of ['m', 'f'] as const) for (let s = 0; s < 20; s++) {
      const L = themeLook(t.id as 'rosy', body, seq(s / 20, 0.37, 0.81, 0.13));
      expect(L.body).toBe(body);
      expect(t.wear[body].top).toContain(L.top);
      expect(t.dyes).toContain(L.topCol);
    }
  });
});

describe('the tone, chosen first (11 Nov)', () => {
  it('Dark humour arrives at the last wedding\'s wreck; Happy and cheesy at a clean, pretty venue', () => {
    const dark = arrival('dark'), happy = arrival('happy');
    expect(dark.filter((p) => p.k === 'bench').some((p) => p.w)).toBe(true);
    expect(dark.find((p) => p.k === 'arch')?.w).toBe(true);
    expect(dark.filter((p) => p.k === 'splat').length).toBeGreaterThan(4);
    expect(happy.some((p) => p.w)).toBe(false);
    expect(happy.some((p) => p.k === 'splat')).toBe(false);
  });

  it('her welcome: blood and guts and extra security in Dark humour, none of it in Happy and cheesy; both ask', () => {
    expect(WELCOME.dark.join(' ')).toMatch(/blood and guts/);
    expect(WELCOME.dark.join(' ')).toMatch(/extra security/);
    expect(WELCOME.happy.join(' ')).not.toMatch(/blood|guts|security|mishap/);
    for (const t of TONES) expect(WELCOME[t.id].at(-1)).toBe('So! How are you? Would you like to get married?');
  });

  it('Bachelor number one is the jilted groom, bandaged, only in Dark humour; someone sweet in Happy', () => {
    const [d1] = suitors('dark'), [h1] = suitors('happy');
    expect(d1.hurt).toBe(true);
    expect(d1.line).toMatch(/last bride/);
    expect(d1.look.top).toBe('captain');   // (still in his finery)
    expect(h1.hurt).toBeFalsy();
    expect(h1.line).not.toMatch(/bride|mishap|cannon/);
    expect(suitors('dark').slice(1)).toEqual(suitors('happy').slice(1));
  });

  it('flavours what she suggests first, but leaves every theme and plot open', () => {
    expect(SUGGEST.happy).toEqual({ theme: 'rosy', plots: ['sweet'] });
    expect(SUGGEST.dark.theme).toBe('gory');
    expect(SUGGEST.dark.plots).toEqual(['raiders', 'brawl']);
    expect(fresh('dark').plot).toBe('raiders');
    for (const tone of ['happy', 'dark'] as const) for (const t of THEMES) for (const p of PLOTS) {
      const w = clean({ ...dressFor(fresh(tone), t.id as 'rosy'), plot: p.id });
      expect([w.tone, w.theme, w.plot]).toEqual([tone, t.id, p.id]);
    }
  });

  it('keeps the tone in the share link', () => {
    expect(decode(encode(fresh('dark')))!.tone).toBe('dark');
    expect(decode(encode(fresh('happy')))!.tone).toBe('happy');
  });
});

describe('the suitors (10 Nov)', () => {
  it('are a line of men and women, each with a bouquet and a line, called Bachelor or Bachelorette number one, two...', () => {
    const s = suitors('dark');
    expect(s.length).toBeGreaterThanOrEqual(5);
    expect(s.some((x) => x.look.body === 'f')).toBe(true);
    expect(s.some((x) => x.look.body === 'm')).toBe(true);
    for (const x of s) { expect(x.look.hand).toBe('bouquet'); expect(x.line.length).toBeGreaterThan(20); }
    expect(suitorTitle(s[0], 0)).toBe('Bachelor number one');
    expect(suitorTitle(s[1], 1)).toBe('Bachelorette number two');
  });
});

describe('where the guests sit', () => {
  it('two to a bench, facing the way it faces; any left over stand at the back', () => {
    const ps: Prop[] = [{ k: 'bench', x: -2, z: 0, r: 0, c: 'pink' }, { k: 'flowers', x: 0, z: 0, r: 0, c: 'pink' }, { k: 'bench', x: 2, z: 1, r: 2, c: 'pink' }];
    const s = seatsFor(ps, 6);
    expect(s).toHaveLength(6);
    expect(s.slice(0, 4).every((x) => x.sit)).toBe(true);
    expect(s[0].x).toBeCloseTo(-2.55); expect(s[0].z).toBeCloseTo(0); expect(s[0].yaw).toBeCloseTo(Math.PI);
    expect(s[2].x).toBeCloseTo(2); expect(s[2].z).toBeCloseTo(1.55);   // (turned a quarter: along z)
    expect(s.slice(4).every((x) => !x.sit && x.z > 4)).toBe(true);
  });

  it('nobody sits on an overturned bench', () => {
    expect(seatsFor(WRECK, 8).filter((x) => x.sit)).toHaveLength(2);
  });
});

describe('the plots, as cheesy cutscenes (10 Nov)', () => {
  it('each runs procession, vows, its own twist, I do, the kiss, the cheer and the portrait', () => {
    const twist = { sweet: 'sweet', raiders: 'fight', drunk: 'topple', brawl: 'brawl' } as const;
    for (const p of PLOTS) {
      const s = plotScript(p.id), beats = s.map((b) => b.beat);
      expect(beats.slice(0, 3)).toEqual(['seated', 'procession', 'vows']);
      expect(beats.slice(-4)).toEqual(['ido', 'kiss', 'cheer', 'portrait']);
      expect(beats).toContain(twist[p.id]);
      expect(scriptSecs(s)).toBeGreaterThan(30);
      expect(scriptSecs(s)).toBeLessThan(60);
    }
  });

  it('gives every line time to be read before the next, and inside its beat', () => {
    for (const p of PLOTS) for (const cake of [true, false]) for (const b of plotScript(p.id, cake)) {
      b.lines.forEach((l, j) => {
        const next = b.lines[j + 1]?.at ?? b.secs;
        expect(next - l.at, `${p.id} ${b.beat}: "${l.text}"`).toBeGreaterThanOrEqual(readSecs(l.text) - 1e-9);
      });
    }
  });

  it('says the cake line only when there is a cake to fall in', () => {
    const lines = (cake: boolean) => plotScript('drunk', cake).flatMap((b) => b.lines.map((l) => l.text));
    expect(lines(true)).toContain('...and that\'s the cake.');
    expect(lines(false)).not.toContain('...and that\'s the cake.');
    expect(lines(false)).toContain('...and down they go.');
  });

  it('knows where it is: the beat, how far through, the line being said, and when it\'s over', () => {
    const s = plotScript('raiders');
    expect(plotAt(s, 0).beat).toBe('seated');
    expect(plotAt(s, 0.5).line?.text).toMatch(/Places, everyone/);
    expect(plotAt(s, 0.1).line).toBe(null);
    const fight = s.slice(0, s.findIndex((b) => b.beat === 'fight')).reduce((a, b) => a + b.secs, 0);
    expect(plotAt(s, fight + 0.5)).toMatchObject({ beat: 'fight', line: { who: 'mis' } });
    expect(plotAt(s, scriptSecs(s) + 1).done).toBe(true);
  });

  it('puts the names into a line', () => {
    expect(fill('Do you take {partner}?', { you: 'You', partner: 'Barnaby' })).toBe('Do you take Barnaby?');
  });
});

describe('Mischievious, gushing (10 Nov)', () => {
  it('never says the same line twice running', () => {
    const g = new Gush('happy', seq(0, 0, 0, 0));
    let last = '';
    for (let i = 0; i < 12; i++) { const l = g.say(i % 3 ? 'add' : 'dress'); expect(l).not.toBe(last); last = l; }
  });

  it('is never anything but delighted with your choices', () => {
    for (const tone of ['happy', 'dark'] as const) {
      const g = new Gush(tone);
      for (const ev of Object.keys(GUSH)) for (const l of g.pool(ev)) {
        expect(l).toBeTruthy();
        expect(l).not.toMatch(/\b(wrong|mistakes?|bad|badly|ugly)\b|can't/i);
      }
    }
  });

  it('has something for every venue, theme and plot, in both tones', () => {
    for (const tone of ['happy', 'dark'] as const) {
      const g = new Gush(tone);
      for (const ev of [...VENUES.map((v) => `venue_${v.id}`), ...THEMES.map((t) => `theme_${t.id}`), ...PLOTS.map((p) => `plot_${p.id}`), 'her', 'suitor', 'suitorOne', 'own', 'again'])
        expect(g.say(ev), `${tone} ${ev}`).toBeTruthy();
    }
    expect(new Gush('dark').say('suitorOne')).toMatch(/Barnaby/);
    expect(new Gush('happy').say('again')).toBe('That was lovely. Shall we have another?');
  });
});

describe('looks the wardrobe hasn\'t got yet', () => {
  it('swaps a missing item for its stand-in, and wears the real thing once it\'s there', () => {
    const none = (slot: string, _b: string, id: string) => !['veil', 'gown', 'bouquet', 'dresstop'].includes(id) && !(slot === 'top' && id === 'corset');
    expect(wearable({ body: 'f', hat: 'veil', legs: 'gown', hand: 'bouquet', top: 'dresstop' }, none)).toEqual({ body: 'f', hat: 'none', legs: 'long', hand: 'none', top: 'belt' });
    const all = () => true;
    expect(wearable({ body: 'f', hat: 'veil', legs: 'gown' }, all)).toEqual({ body: 'f', hat: 'veil', legs: 'gown' });
  });
});

describe('the set-up, kept and shared (10 Nov)', () => {
  it('starts fresh in a tone, then the theme lays it out and dresses the guests', () => {
    const w = fresh('happy');
    expect([w.partner, w.theme, w.guests.length]).toEqual([null, null, 0]);
    const d = dressFor({ ...w, venue: 'deck' }, 'drunk');
    expect(d.props).toEqual(layout('deck', 'drunk'));
    expect(d.guests).toHaveLength(GUESTS);
  });

  it('moving venue takes an untouched layout with it, and leaves one you\'ve tuned as you tuned it', () => {
    const d = dressFor(fresh('happy'), 'rosy');
    expect(moveTo(d, 'chapel').props).toEqual(layout('chapel', 'rosy'));
    const tuned = { ...d, props: d.props.slice(1) };
    expect(moveTo(tuned, 'chapel').props).toEqual(tuned.props);
  });

  it('cleans anything at all into a safe set-up', () => {
    for (const junk of [null, 7, 'x', [], { tone: 'evil', venue: 'moon', theme: 'x', plot: 'y', partner: { kind: 'suitor', i: 99 } }]) {
      const w = clean(junk);
      expect(w.tone).toBe('happy'); expect(w.venue).toBe('beach'); expect(w.theme).toBe(null); expect(w.partner).toBe(null);
    }
    const w = clean({ theme: 'gory', props: [{ k: 'cake', x: 99, z: -99, r: 11, c: 'plaid' }, { k: 'dragon', x: 0, z: 0 }, { k: 'bench', x: 1.13, z: 'a' }], guests: [{ top: '<script>', hat: 'tricorne', evil: { a: 1 } }], partner: { kind: 'own', look: { body: 'f', topCol: 'pink' } } });
    expect(w.props).toEqual([{ k: 'cake', x: AREA.x, z: AREA.z0, r: 3, c: 'white' }]);
    expect(w.guests).toHaveLength(GUESTS);
    expect(w.guests[0]).toEqual({ hat: 'tricorne' });
    expect(w.partner).toEqual({ kind: 'own', look: { body: 'f', topCol: 'pink' } });
    expect(clean({ props: Array.from({ length: 99 }, () => ({ k: 'barrel', x: 0, z: 0 })) }).props).toHaveLength(MAX_PROPS);
  });

  it('round-trips through a short share link', () => {
    const w = planned();
    const code = encode(w);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(code.length).toBeLessThan(80);   // (the layout untouched: just the choices)
    expect(decode(code)).toEqual(clean(w));
  });

  it('carries a tuned layout, redressed guests and someone of your own in the link', () => {
    const w = planned();
    w.props = [...w.props.slice(2), { k: 'cake', x: -1.25, z: 3.5, r: 5, c: 'lime', w: true }];
    w.props[0] = { ...w.props[0], x: 1.75, c: 'atlantean' };
    w.guests[3] = { ...w.guests[3], topCol: 'mint', hat: 'fez' };
    w.partner = { kind: 'own', look: { body: 'f', hair: 'bun', topCol: 'rose' } };
    const back = decode(encode(w))!;
    expect(back).toEqual(clean(w));
    expect(encode(w).length).toBeLessThan(600);
  });

  it('turns down a link that isn\'t one', () => {
    for (const bad of ['', '!!!', 'aGVsbG8', encode(fresh()).slice(0, 5)]) expect(decode(bad)).toBe(null);
  });

  it('writes the portrait\'s caption', () => {
    expect(caption(planned(), 'You', 'Barnaby')).toBe('You & Barnaby, wed on the beach, bloody and gory');
  });
});

it('every prop kind has a name, for the palette', () => {
  expect(PROPS.every(([, n]) => n.length > 2)).toBe(true);
});

// The user, 11 Nov: "we'd rather be a lot more humorous about [Mischievious], but not negative. Like, I
// don't like where it says, oh, marry [her], she's free, she's nearly always free. Like, that feels mean."
it("'she's nearly always free' felt mean: none of her lines run her down (11 Nov)", () => {
  const all = [...Object.values(WELCOME).flat(), ...Object.values(GUSH).flatMap((p) => (Array.isArray(p) ? p : Object.values(p).flat()))];
  expect(all.length).toBeGreaterThan(40);
  for (const line of all) expect(line).not.toMatch(/always free|I'?m free|usually me|nobody wants|desperate|lonely|single again/i);
});
