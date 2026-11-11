/* Mischievious's wedding (src/den-wedding.ts): the tone, venues, themes and their layouts, the suitors,
   the plots' timelines, her gushing, and the set-up kept and shared. (10 Nov) */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ALTAR, ARRIVE, AREA, ASK_HER, BODY_R, COUPLE, DYE_NAMES, FRONT, GUARDS, RETURN, STAND, inProp, onSomeone, propsOverlap, GUESTS, GUSH, Gush, MAX_PROPS, PLOTS, PROPS, SUGGEST, THEMES, TODAY, TONES, VENUES, WELCOME, WRECK,
  answer, arrival, caption, clean, decode, dressFor, encode, fill, fresh, layout, moveTo, plotAt, plotScript, readSecs,
  scriptSecs, seatsFor, suitorTitle, suitors, themeLook, wearable,
} from '../src/den-wedding';
import type { Prop, ThemeId, Wedding } from '../src/den-wedding';

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

describe('where the guests stand', () => {
  it('two to a bench, on their feet in front of it, facing the way it faces; any left over stand at the back', () => {
    const ps: Prop[] = [{ k: 'bench', x: -2, z: 0, r: 0, c: 'pink' }, { k: 'flowers', x: 0, z: 0, r: 0, c: 'pink' }, { k: 'bench', x: 3, z: 1, r: 2, c: 'pink' }];
    const s = seatsFor(ps, 6);
    expect(s).toHaveLength(6);
    expect(s.every((x) => !x.sit)).toBe(true);
    expect(s[0].x).toBeCloseTo(-2.55); expect(s[0].z).toBeCloseTo(-0.58); expect(s[0].yaw).toBeCloseTo(Math.PI);
    expect(s[2].x).toBeCloseTo(3 - 0.58); expect(s[2].z).toBeCloseTo(1.55);   // (turned a quarter: along z)
    expect(s.slice(4).every((x) => x.z >= 5)).toBe(true);
  });

  it('nobody stands at an overturned bench', () => {
    const s = seatsFor(WRECK, 8), upright = WRECK.find((p) => p.k === 'bench' && !p.w)!;
    expect(s.filter((x) => Math.hypot(x.x - upright.x, x.z - upright.z) < 1)).toHaveLength(2);
  });
});

// The user, 11 Nov: "the pirates are kind of ... going through the benches ... we want to show their outfits
// off"; and "front benches right up on them, so you can barely even see [Mischievious] because of all the
// guests are all kind of crowding her out".
describe('nobody stands in anything, and the front is kept clear for her and the couple (11 Nov)', () => {
  const people = [STAND.mis, STAND.you, STAND.partner, COUPLE.you, COUPLE.partner, ALTAR, ...GUARDS];
  const check = (props: readonly Prop[], what: string) => {
    const s = seatsFor(props, GUESTS);
    expect(s, what).toHaveLength(GUESTS);
    s.forEach((g, i) => {
      for (const p of props) expect(inProp(p, g.x, g.z), `${what}: guest ${i} in a ${p.k} at ${p.x},${p.z}`).toBe(false);
      for (const h of s.slice(i + 1)) expect(Math.hypot(h.x - g.x, h.z - g.z), `${what}: guests ${i} in each other`).toBeGreaterThan(BODY_R * 2);
      for (const q of people) expect(Math.hypot(q.x - g.x, q.z - g.z), `${what}: guest ${i} on someone`).toBeGreaterThan(BODY_R * 2);
      expect(Math.abs(g.x) < FRONT.x && g.z < FRONT.z, `${what}: guest ${i} at the front`).toBe(false);
    });
  };
  it('in every venue and theme, and the wreck: no guest in a prop, in another, on her or the couple, or at the front', () => {
    for (const v of VENUES) for (const t of THEMES) check(layout(v.id, t.id as ThemeId), `${v.id}/${t.id}`);
    check(WRECK, 'the wreck');
  });
  it('and wherever the benches are moved', () => {
    for (let k = 0; k < 40; k++) {
      const props = layout('beach', 'rosy').map((p, i) => (p.k === 'bench' ? { ...p, x: ((k * 7 + i * 3) % 11) - 5, z: ((k * 5 + i * 13) % 13) - 6, r: (k + i) % 8 } : p));
      check(props, `moved ${k}`);
    }
  });
  it('no prop stands in another, nor on her, the couple or the guards, in any venue and theme', () => {
    for (const v of VENUES) for (const t of THEMES) {
      const ps = layout(v.id, t.id as ThemeId).filter((p) => p.k !== 'cake');
      ps.forEach((p, i) => {
        expect(onSomeone(p), `${v.id}/${t.id}: a ${p.k} on someone`).toBe(false);
        for (const q of ps.slice(i + 1)) expect(propsOverlap(p, q) || propsOverlap(q, p), `${v.id}/${t.id}: ${p.k} ${p.x},${p.z} in ${q.k} ${q.x},${q.z}`).toBe(false);
      });
    }
  });
  it('the benches stand well back from the arch: a clear space before it', () => {
    for (const t of THEMES) for (const p of layout('beach', t.id as ThemeId)) if (p.k === 'bench') expect(p.z).toBeGreaterThan(FRONT.z + 0.5);
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

// The user, 11 Nov: "she's just the facilitator for this wedding mechanic. I don't want this to be a
// [Mischievious] show, but it still needs a bit of fun and personality. And Puzzle Pirate personality".
it('she\'s the host, not the show: no lines about how often she\'s married, and things to ask her, answered in both tones (11 Nov)', () => {
  const all = [...Object.values(WELCOME).flat(), ...Object.values(GUSH).flatMap((p) => (Array.isArray(p) ? p : Object.values(p).flat()))];
  for (const line of all) expect(line).not.toMatch(/ever so many|keep this one alive|marry them|my last (one|husband|wife)/i);
  expect(ASK_HER.length).toBeGreaterThanOrEqual(6);
  for (const tone of ['happy', 'dark'] as const) ASK_HER.forEach((_, i) => expect(answer(i, tone).length).toBeGreaterThan(10));
});

// The user, 11 Nov: "the first time I had this kind of wedding, second time it didn't quite go so well. The
// Raiders came and it was bloody gory ... tie it into the mechanics in a happy, fun way".
it('her five weddings today show off every venue, theme and plot, and she recalls one whenever you choose (11 Nov)', () => {
  expect(TODAY).toHaveLength(5);
  for (const [key, list] of [['venue', VENUES], ['theme', THEMES], ['plot', PLOTS]] as const) {
    const ids = list.map((x: { id: string }) => x.id);
    expect(new Set(TODAY.map((w) => w[key]))).toEqual(new Set(ids));
    for (const id of ids) for (const tone of ['happy', 'dark'] as const) {
      expect(new Gush(tone).pool(`${key}_${id}`).some((l) => /today/.test(l))).toBe(true);
    }
  }
  expect(WELCOME.happy.join(' ')).toMatch(/five today/);
});

// The user, 11 Nov: "check that's cohesive ... One joked about a parrot that swears coming as a set, but she
// doesn't actually have a parrot, but the guy next to her does."
it('the parrot that swears was on the man next to her: whatever a suitor mentions, they have (11 Nov)', () => {
  const FAMS = ['parrot', 'monkey', 'octopus', 'squirrel', 'bat', 'krakling'];
  for (const tone of ['happy', 'dark'] as const) for (const s of suitors(tone)) {
    for (const f of FAMS) expect(s.look.fam === f, `${s.name}: ${f}`).toBe(new RegExp(`(^|[^a-z])${f}`, 'i').test(s.line));
    if (/dais/i.test(s.line)) expect(s.look.handCol).toBe('white');
    if (/bouquet|flowers?\b|picked you/i.test(s.line)) expect(s.look.hand).toBe('bouquet');
  }
});

// The user, 11 Nov: "It should definitely be opening more with a cutscene where, you know, she explains to
// you what it is and what's going on."
it('she opens by explaining what it is: her venue, planning it your way, then it plays out and a portrait; shorter coming back (11 Nov)', () => {
  expect(ARRIVE.join(' ')).toMatch(/isle/);
  expect(ARRIVE.join(' ')).toMatch(/wedding venue/);
  expect(ARRIVE.at(-1)).toMatch(/what sort of wedding/);
  for (const t of TONES) {
    const said = WELCOME[t.id].join(' ');
    for (const w of ['who', 'where', 'the look', 'how it goes', 'portrait']) expect(said, `${t.id}: ${w}`).toMatch(w);
    expect(RETURN[t.id].length).toBeLessThan(WELCOME[t.id].length);
    expect(RETURN[t.id].join(' ')).toMatch(/left off/);
  }
  for (const line of [...ARRIVE, ...Object.values(RETURN).flat()]) {
    expect(line).not.toMatch(/ever so many|always free|I'?m free|my last (one|husband|wife)/i);
    expect(line.length).toBeLessThan(130);
  }
  expect([...ARRIVE, ...RETURN.happy].join(' ')).not.toMatch(/blood|guts|raid/);
});

// The user, 11 Nov: "when you're doing like someone of your own ... it should let you do like the same as
// like when you're dressing yourself ... you need to be able to customize them".
it('a partner of your own keeps their whole wardrobe and their name, in the set-up and its share link (11 Nov)', () => {
  const look = { body: 'f', skin: 3, hair: 'braids', hairCol: 'dark brown', patch: false, earring: true, smile: true, hook: true, hat: 'wide', hatCol: 'rose', hatCol2: 'white', top: 'corset', topCol: 'pink', topCol2: 'black', waist: 'sash', waistCol: 'gold', legs: 'gown', legsCol: 'lavender', feet: 'fancy', feetCol: 'white', feetCol2: 'rose', hand: 'bouquet', handCol: 'white', fam: 'parrot', famCol: 'green', famCol2: 'red', name: "Peg O'Malley" };
  const w = clean({ ...fresh('happy'), partner: { kind: 'own', look } });
  expect(w.partner).toEqual({ kind: 'own', look });
  expect(decode(encode(w))!.partner).toEqual({ kind: 'own', look });
});
