/* Mischievious's wedding (src/den-wedding.ts): the tone, venues, themes and their layouts, the suitors,
   the plots' timelines, her gushing, and the set-up kept and shared. (10 Nov) */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ALTAR, ARRIVE, AREA, ASK_HER, BODY_R, COUPLE, DYE_NAMES, FRONT, GUARDS, RETURN, STAND, inProp, onSomeone, propsOverlap, GUESTS, GUSH, Gush, MAX_PROPS, PLOTS, PROPS, SUGGEST, THEMES, TODAY, TONES, VENUES, WELCOME, WRECK,
  answer, arrival, caption, clean, decode, dressFor, encode, fill, fresh, layout, moveTo, plotAt, plotScript, readSecs,
  scriptSecs, seatsFor, suitorTitle, suitors, themeLook, wearable, moments, momentTime, momentsDue, momentCaption, collage,
  WHO, SIZES, MAX_GUESTS, GROUNDS, PROP_GROUPS, PROP_R, FLAT, TOPPERS, MADE_IN, footprint, clashes, restsOn, baseGuest, dressedUp, withSize, reseed, moveGuest, standFree, sizeN,
  FAMS, herFams, herLook,
} from '../src/den-wedding';
import { spouseOf } from '../src/den-spouse';
import type { FamId, Look, Prop, Seat, SizeId, ThemeId, Wedding } from '../src/den-wedding';

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

  it('offers two tones, three venues on her island, four themes and five plots (the gifts: 12 Nov)', () => {
    expect(TONES.map((t) => t.name)).toEqual(['Happy and cheesy', 'Dark humour']);
    expect(VENUES.map((v) => v.id)).toEqual(['beach', 'chapel', 'deck']);
    expect(THEMES.map((t) => t.name)).toEqual(['Happy and rosy', 'Bloody and gory', 'Drunkards\' fest', 'Showered in gifts']);
    expect(PLOTS.map((p) => p.name)).toEqual(['Sweet and blissful', 'Raiders crash it', 'Somebody\'s drunk', 'A brawl breaks out', 'Showered in gifts']);
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
    expect(SUGGEST.happy).toEqual({ theme: 'rosy', plots: ['sweet', 'gifts'] });
    expect(fresh('happy').plot).toBe('sweet');
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
    const twist = { sweet: 'sweet', raiders: 'fight', drunk: 'topple', brawl: 'brawl', gifts: 'heap' } as const;
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
    expect(new Gush('happy').say('again')).toMatch(/another\?|anything to anything/);   // (the loopy one, 12 Nov)
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
  // (and nor does the planner: it was still the blurb under "Marry Mischievious", 11 Nov)
  for (const f of ['js/den/wedding.js', 'den.html']) expect(readFileSync(join(__dirname, '..', f), 'utf8'), f).not.toMatch(/nearly always free|she'?s free/i);
  for (const w of Object.values(WHO)) expect(w.blurb).not.toMatch(/always free|she'?s free/i);
});

// The user, 11 Nov: "she's just the facilitator for this wedding mechanic. I don't want this to be a
// [Mischievious] show, but it still needs a bit of fun and personality. And Puzzle Pirate personality".
it('she\'s the host, not the show: no lines about how often she\'s married, and things to ask her, answered in both tones (11 Nov)', () => {
  const all = [...Object.values(WELCOME).flat(), ...Object.values(GUSH).flatMap((p) => (Array.isArray(p) ? p : Object.values(p).flat()))];
  for (const line of all) expect(line).not.toMatch(/ever so many|keep this one alive|marry them|my last (one|husband|wife)/i);
  expect(ASK_HER.length).toBeGreaterThanOrEqual(6);
  for (const tone of ['happy', 'dark'] as const) ASK_HER.forEach((_, i) => expect(answer(i, tone).length).toBeGreaterThan(10));
});

// The user, 12 Nov: "I'm going for like the loopy version where, you know, she's just really excited to marry
// people and decorate ... she married a parrot to a capybara earlier or something".
it('she\'s loopy about weddings: she married a parrot to a capybara earlier, and she\'ll marry anything to anything (12 Nov)', () => {
  const asked = ASK_HER.find((x) => /married off/.test(x.q))!;
  for (const tone of ['happy', 'dark'] as const) expect(answer(ASK_HER.indexOf(asked), tone)).toMatch(/parrot to a capybara/);
  expect(ARRIVE[0]).toMatch(/married two of them/);
  expect((GUSH.again as readonly string[]).join(' ')).toMatch(/anything to anything/);
});

// The user, 11 Nov: "the first time I had this kind of wedding, second time it didn't quite go so well. The
// Raiders came and it was bloody gory ... tie it into the mechanics in a happy, fun way".
it('her six weddings today show off every venue, theme and plot, and she recalls one whenever you choose (11 Nov; the sixth, showered in gifts, 12 Nov)', () => {
  expect(TODAY).toHaveLength(6);
  for (const [key, list] of [['venue', VENUES], ['theme', THEMES], ['plot', PLOTS]] as const) {
    const ids = list.map((x: { id: string }) => x.id);
    expect(new Set(TODAY.map((w) => w[key]))).toEqual(new Set(ids));
    for (const id of ids) for (const tone of ['happy', 'dark'] as const) {
      expect(new Gush(tone).pool(`${key}_${id}`).some((l) => /today/.test(l))).toBe(true);
    }
  }
  expect(WELCOME.happy.join(' ')).toMatch(/six today/);
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

// ---------- more to play with (11 Nov) ----------
// The user, 11 Nov: "people are really going to be like wanting more control and variety ... on the furniture
// ... I want them to have at least have some feel for getting lost in the furniture placement and the guest
// placement ... how many guests you want. Do you want big, small, cozy, large? Do you want the grand wedding
// where half the ocean turns up? ... Just the ability to like go around like with a camera and click on each
// pirate and configure them."
const PEOPLE = [STAND.mis, STAND.you, STAND.partner, COUPLE.you, COUPLE.partner, ALTAR, ...GUARDS];
/** Somewhere a guest could be moved to just now (the k-th such place, from the front, on quarter metres). */
function somewhere(w: Wedding, k = 0): [number, number] {
  const s = seatsFor(w.props, w.guests.length, w.spots);
  for (let z = -6; z <= 7.5; z += 0.25) for (let x = -6.25; x <= 6.25; x += 0.25) if (standFree(w.props, s, x, z) && k-- <= 0) return [x, z];
  throw new Error('nowhere free');
}
/** Every rule for where guests stand: none in a prop, in each other, on her, the couple or the guards, at
    the front, in the aisle, or off the grounds. */
function standsRight(props: readonly Prop[], s: readonly Seat[], what: string) {
  s.forEach((g, i) => {
    expect(Math.abs(g.x) <= GROUNDS.x && g.z >= GROUNDS.z0 && g.z <= GROUNDS.z1, `${what}: guest ${i} off the grounds at ${g.x},${g.z}`).toBe(true);
    for (const p of props) expect(inProp(p, g.x, g.z), `${what}: guest ${i} in a ${p.k} at ${p.x},${p.z}`).toBe(false);
    for (const q of PEOPLE) expect(Math.hypot(q.x - g.x, q.z - g.z), `${what}: guest ${i} on someone`).toBeGreaterThan(BODY_R * 2);
    expect(Math.abs(g.x) < FRONT.x && g.z < FRONT.z, `${what}: guest ${i} at the front`).toBe(false);
    expect(Math.abs(g.x) < 0.7 && g.z >= FRONT.z, `${what}: guest ${i} in the aisle`).toBe(false);
  });
  // (each against the rest, on a grid: a hundred and forty of them)
  const cell = new Map<string, number[]>(), key = (x: number, z: number) => `${Math.floor(x)},${Math.floor(z)}`;
  s.forEach((g, i) => { const k = key(g.x, g.z); cell.set(k, [...(cell.get(k) ?? []), i]); });
  s.forEach((g, i) => {
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const j of cell.get(key(g.x + dx, g.z + dz)) ?? []) {
      if (j > i) expect(Math.hypot(s[j].x - g.x, s[j].z - g.z), `${what}: guests ${i} and ${j} in each other`).toBeGreaterThan(BODY_R * 2);
    }
  });
}

describe('how many come: cosy to half the Ocean (11 Nov)', () => {
  it('runs from a handful to a crowd of a hundred and forty, small (eight) as ever', () => {
    expect(SIZES.map((s) => s.name)).toEqual(['Cosy', 'Small', 'Big', 'Large', 'Grand']);
    expect(SIZES[0].n).toBeLessThanOrEqual(GUESTS);
    expect(sizeN('small')).toBe(GUESTS);
    expect(SIZES.at(-1)!.n).toBe(MAX_GUESTS);
    expect(MAX_GUESTS).toBeGreaterThanOrEqual(100);
    for (let i = 1; i < SIZES.length; i++) expect(SIZES[i].n).toBeGreaterThan(SIZES[i - 1].n);
    // (the plots want three guests at least: the drunk, and two to argue)
    expect(SIZES[0].n).toBeGreaterThanOrEqual(5);
    expect(fresh().size).toBe('small');
  });

  it('every size stands everyone right, in every venue and theme: none in a prop, each other, the aisle or the front', () => {
    for (const z of SIZES) for (const v of VENUES) for (const t of THEMES) {
      const props = layout(v.id, t.id as ThemeId), s = seatsFor(props, z.n);
      expect(s, `${z.id} ${v.id}/${t.id}`).toHaveLength(z.n);
      standsRight(props, s, `${z.id} ${v.id}/${t.id}`);
    }
  });

  it('half the Ocean turns up: a crowd spilling off the benches, down the sides and to the back', () => {
    const props = layout('beach', 'rosy'), s = seatsFor(props, MAX_GUESTS);
    expect(s.filter((g) => g.z > 5.5).length).toBeGreaterThan(20);   // (the back)
    expect(s.filter((g) => Math.abs(g.x) > 4.4).length).toBeGreaterThan(20);   // (down the sides)
    expect(s.filter((g) => Math.abs(g.x) > 3.3 && g.z > -1 && g.z < 5).length).toBeGreaterThan(10);   // (beside the benches)
    // (and the small wedding's eight stand where they always did)
    expect(s.slice(0, GUESTS)).toEqual(seatsFor(props, GUESTS));
  });

  it('even with the benches moved about and more props down, a grand wedding fits, every rule kept', () => {
    for (let k = 0; k < 6; k++) {
      const props = [...layout('chapel', 'drunk').map((p, i) => (p.k === 'bench' ? { ...p, x: ((k * 7 + i * 3) % 9) - 4, z: ((k * 5 + i * 13) % 11) - 3, r: (k + i) % 8 } : p)),
        { k: 'feast', x: -3.5, z: 6, r: 0, c: 'gold' } as Prop, { k: 'band', x: 4.5, z: -0.5, r: 0, c: 'gold' } as Prop];
      const s = seatsFor(props, MAX_GUESTS);
      expect(s).toHaveLength(MAX_GUESTS);
      standsRight(props, s, `moved ${k}`);
    }
  });

  it('the crowd beyond the theme\'s eight is dressed in the theme, the same from the same seed, another from another', () => {
    for (const t of THEMES) {
      const w = dressFor({ ...fresh(), size: 'grand', seed: 77 }, t.id as ThemeId);
      expect(w.guests).toHaveLength(MAX_GUESTS);
      expect(w.guests.slice(0, GUESTS)).toEqual(t.guests);
      for (const g of w.guests.slice(GUESTS)) { expect(t.wear[g.body as 'm'].top).toContain(g.top); expect(t.dyes).toContain(g.topCol); }
      expect(dressFor({ ...fresh(), size: 'grand', seed: 77 }, t.id as ThemeId).guests).toEqual(w.guests);
      expect(dressFor({ ...fresh(), size: 'grand', seed: 78 }, t.id as ThemeId).guests).not.toEqual(w.guests);
    }
  });

  it('changing the size or the crowd keeps the guests you\'ve dressed and moved, while there\'s room for them', () => {
    let w = dressFor({ ...fresh(), size: 'large', seed: 5 }, 'gory');
    w.guests[3] = { ...w.guests[3], hat: 'fez' }; w.guests[30] = { ...w.guests[30], topCol: 'mint' };
    w = moveGuest(w, seatsFor(w.props, 48), 30, ...somewhere(w))!;
    expect(dressedUp(w, 30)).toBe(true); expect(dressedUp(w, 31)).toBe(false);
    const g = withSize(w, 'grand');
    expect(g.guests).toHaveLength(MAX_GUESTS);
    expect([g.guests[3].hat, g.guests[30].topCol]).toEqual(['fez', 'mint']);
    expect(g.spots).toEqual(w.spots);
    const c = withSize(w, 'cosy');
    expect(c.guests).toHaveLength(6); expect(c.guests[3].hat).toBe('fez'); expect(c.spots).toEqual([]);
    const r = reseed(w, 999);
    expect(r.guests[30]).toEqual(w.guests[30]); expect(r.guests[3]).toEqual(w.guests[3]);
    expect(r.guests[31]).toEqual(baseGuest('gory', 999, 31));
    expect(r.guests[31]).not.toEqual(w.guests[31]);
  });
});

describe('every guest yours: click one, move them anywhere free, dress them (11 Nov)', () => {
  const w0 = dressFor({ ...fresh(), size: 'big' }, 'rosy'), n = sizeN('big');
  it('moved, they stand where you put them, facing the altar; nobody else shuffles about', () => {
    const before = seatsFor(w0.props, n);
    const [x, z] = somewhere(w0);
    const w = moveGuest(w0, before, 5, x, z)!;
    expect(w.spots).toHaveLength(1);
    expect(w.spots[0]).toMatchObject({ i: 5, x, z });
    const after = seatsFor(w.props, n, w.spots);
    expect([after[5].x, after[5].z]).toEqual([x, z]);
    expect(Math.sin(after[5].yaw) * (ALTAR.x - x) + Math.cos(after[5].yaw) * (ALTAR.z - z)).toBeGreaterThan(0);   // (facing the altar)
    after.forEach((s, i) => { if (i !== 5) expect(s, `guest ${i}`).toEqual(before[i]); });
    standsRight(w.props, after, 'moved');
  });
  it('never into a prop, someone else, the aisle or the front, nor off the grounds', () => {
    const s = seatsFor(w0.props, n), bench = w0.props.find((p) => p.k === 'bench')!;
    expect(moveGuest(w0, s, 2, bench.x, bench.z)).toBe(null);
    expect(moveGuest(w0, s, 2, s[7].x, s[7].z)).toBe(null);
    expect(moveGuest(w0, s, 2, 0, 3)).toBe(null);
    expect(moveGuest(w0, s, 2, 0.5, -2)).toBe(null);
    expect(moveGuest(w0, s, 2, 9, 2.25)!.spots[0]).toMatchObject({ x: GROUNDS.x, z: 2.25 });   // (dragged off the side: at its edge)
    expect(moveGuest(w0, s, 2, s[2].x, s[2].z)).not.toBe(null);   // (back where they were's fine)
    expect(moveGuest(w0, s, 2, s[2].x, s[2].z, 2)!.spots).toEqual([{ i: 2, x: Math.round(s[2].x * 20) / 20, z: Math.round(s[2].z * 20) / 20, r: 2 }]);   // (or turned where they stand)
    expect(standFree(w0.props, s, 6, 2.3)).toBe(true);
  });
  it('a prop put on someone you\'ve moved sends them back among the others, every rule kept', () => {
    const [x, z] = somewhere(w0, 1);
    const w = moveGuest(w0, seatsFor(w0.props, n), 0, x, z)!;
    expect(seatsFor(w.props, n, w.spots)[0]).toMatchObject({ x, z });
    const props = [...w.props, { k: 'band', x, z, r: 0, c: 'gold' } as Prop];
    const s = seatsFor(props, n, w.spots);
    expect(Math.hypot(s[0].x - x, s[0].z - z)).toBeGreaterThan(0.5);
    standsRight(props, s, 'a band on them');
  });
});

describe('far more furniture, grouped for the palette (11 Nov)', () => {
  it('has the furnisher\'s whole shop, each kind in one group, each named, and room in the link for more', () => {
    expect(PROPS.length).toBeGreaterThanOrEqual(30);
    expect(PROPS.length).toBeLessThanOrEqual(36);   // (one letter each in the share link)
    const grouped = PROP_GROUPS.flatMap((g) => g.kinds);
    expect([...grouped].sort()).toEqual(PROPS.map(([k]) => k).sort());
    for (const [k, name] of PROPS) { expect(name.length).toBeGreaterThan(2); expect(PROP_R[k]).toBeGreaterThan(0); }
    for (const k of ['feast', 'rug', 'palm', 'chandelier', 'flag', 'statue', 'fountain', 'piano', 'band'] as const) expect(grouped).toContain(k);
    expect(MAX_PROPS).toBeGreaterThanOrEqual(96);
    for (const c of Object.values(MADE_IN)) expect(DYE_NAMES).toContain(c);
  });
  it('everything but the flat things stands on something; anyone stands on a rug, petals or a splatter', () => {
    for (const [k] of PROPS) expect(footprint({ k, x: 0, z: 0, r: 0, c: 'white' }).length > 0, k).toBe(!FLAT.includes(k));
  });
  it('props stay out of each other where it matters: a bench not in a bench, a cake on its table, anything on a rug', () => {
    const b: Prop = { k: 'bench', x: 0, z: 0, r: 0, c: 'pink' };
    expect(clashes({ ...b, x: 0.5 }, [b])).toBe(true);
    expect(clashes({ ...b, z: 1.5 }, [b])).toBe(false);
    const t: Prop = { k: 'feast', x: 3, z: 3, r: 0, c: 'gold' }, cake: Prop = { k: 'cake', x: 3.5, z: 3, r: 0, c: 'rose' };
    expect(clashes(cake, [t])).toBe(false);
    expect(restsOn(cake, [t])).toBe(t);
    expect(restsOn({ ...cake, x: 5 }, [t])).toBe(null);
    for (const k of TOPPERS) expect(clashes({ ...cake, k }, [t]), k).toBe(false);
    expect(clashes({ k: 'piano', x: 3, z: 3, r: 0, c: 'black' }, [{ k: 'rug', x: 3, z: 3, r: 0, c: 'red' }])).toBe(false);
    // (a prop never clashes with itself)
    expect(clashes(b, [b], 0)).toBe(false);
  });
  it('no theme\'s layout has a prop in another, or on her, the couple or the guards', () => {
    for (const v of VENUES) for (const t of THEMES) layout(v.id, t.id as ThemeId).forEach((p, i, ps) => {
      expect(clashes(p, ps, i), `${v.id}/${t.id}: ${p.k} at ${p.x},${p.z}`).toBe(false);
      expect(onSomeone(p)).toBe(false);
    });
  });
  it('she has something to say about the new things, and each size, in both tones, delighted as ever', () => {
    for (const tone of ['happy', 'dark'] as const) {
      const g = new Gush(tone);
      for (const [k] of PROPS.slice(10)) expect(g.pool(`add_${k}`).length, `${tone} add_${k}`).toBeGreaterThan(0);
      for (const s of SIZES) expect(g.pool(`size_${s.id}`).length, `${tone} size_${s.id}`).toBeGreaterThan(0);
      for (const ev of ['guest_move', 'crowd']) expect(g.say(ev)).toBeTruthy();
    }
  });
});

describe('the set-up with all of that, kept and shared (11 Nov)', () => {
  const big = (): Wedding => {
    const w: Wedding = { ...dressFor({ ...fresh('happy'), size: 'grand', seed: 4321 }, 'drunk'), partner: { kind: 'her', ver: 1 }, plot: 'brawl' };
    w.props = [...w.props, { k: 'chandelier', x: 0, z: 2.5, r: 2, c: 'gold' }, { k: 'statue', x: -5.75, z: -0.5, r: 1, c: 'white' }, { k: 'skulls', x: 5.5, z: 6, r: 3, c: 'white' }];
    w.guests[1] = { ...w.guests[1], hat: 'fez', topCol: 'mint' };
    w.guests[57] = { ...w.guests[57], top: 'captain', topCol: 'gold', name: 'Dread Pirate Kev' };
    w.guests[139] = { body: 'f', skin: 3, hair: 'bun', hairCol: 'black', hat: 'tiara', hatCol: 'gold', top: 'corset', topCol: 'pink', topCol2: 'white', legs: 'gown', legsCol: 'pink', feet: 'shoes', feetCol: 'white', smile: true, patch: false, hand: 'tankard', beard: 'none', earring: 'both' };
    const s = seatsFor(w.props, MAX_GUESTS);
    const a = moveGuest(w, s, 57, ...somewhere(w))!;
    return moveGuest(a, seatsFor(a.props, MAX_GUESTS, a.spots), 139, ...somewhere(a, 1))!;
  };
  it('round-trips a grand wedding: its size, crowd, new props, dressed guests and moved ones', () => {
    const w = big();
    expect(w.spots).toHaveLength(2);
    const back = decode(encode(w))!;
    expect(back).toEqual(clean(w));
    expect(back.guests).toHaveLength(MAX_GUESTS);
    expect(back.guests[57].name).toBe('Dread Pirate Kev');
    expect(back.props.at(-3)!.k).toBe('chandelier');
    expect(back.spots).toEqual(w.spots);
  });
  it('keeps the link short: only the guests you changed go in it, the rest from the seed', () => {
    expect(encode(big()).length).toBeLessThan(1400);
    const plain: Wedding = { ...dressFor({ ...fresh(), size: 'grand', seed: 4321 }, 'rosy'), partner: { kind: 'suitor', i: 1 } };
    expect(encode(plain).length).toBeLessThan(90);
    expect(decode(encode(plain))!.guests).toEqual(plain.guests);
  });
  it('cleans junk sizes, seeds and moved guests away', () => {
    const w = clean({ theme: 'rosy', size: 'galactic', seed: -4, spots: [{ i: 99, x: 0, z: 0 }, { i: 2, x: 'a', z: 1 }, { i: 3, x: 50, z: -50, r: 13 }, { i: 3, x: 1, z: 1 }] });
    expect([w.size, w.seed, w.guests.length]).toEqual(['small', 0, GUESTS]);
    expect(w.spots).toEqual([{ i: 3, x: GROUNDS.x, z: GROUNDS.z0, r: 5 }]);
    expect(clean({ ...fresh(), spots: [{ i: 0, x: 1, z: 1, r: 0 }] }).spots).toEqual([]);   // (no theme yet: no guests to move)
  });
});

// Links made before guests could be counted, moved or dressed one by one (made on 11 Nov by the share link as
// it was then, version 1): they still open, as they were.
describe('old share links still open (11 Nov)', () => {
  it('a plain one: the gory raid on the beach, Barnaby the groom, eight guests', () => {
    const w = decode('WzEsMSwwLDEsMSxbInMiLDBdLDAsMF0')!;
    expect(w).toMatchObject({ tone: 'dark', venue: 'beach', theme: 'gory', plot: 'raiders', partner: { kind: 'suitor', i: 0 }, size: 'small', spots: [] });
    expect(w.guests).toEqual(THEMES[1].guests);
    expect(w.props).toEqual(layout('beach', 'gory'));
  });
  it('a tuned one: its props as laid out, the guest it redressed, and her in Taco Princess', () => {
    const w = decode('WzEsMCwyLDIsMyxbImgiLDJdLCIwMGcwdjA0MDB3MHYwNDAwZzExMDQwMHcxMTA0MDBnMTcwNDAwdzE3MDQ0MDYwaTAzNDE2MGkwMzQwNTB1MDM0MTcwdTAzNDA2MWEwMzQwOTFkMDMzMDkwMjBnMzEzMDIwZzYwajFiMDQ2MHQxYjA0NTE2MTgwbjUweTFkMm44MTYxODA0MjBrMDYwYjIwczA2MGI0MDIwMzAzNDFhMDMwMzgwajEyZGEiLFswLDAsMCx7ImhhdCI6ImZleiIsInRvcENvbCI6Im1pbnQifSwwLDAsMCwwXV0')!;
    expect(w).toMatchObject({ tone: 'happy', venue: 'deck', theme: 'drunk', plot: 'brawl', partner: { kind: 'her', ver: 2 }, size: 'small' });
    expect(w.props.at(-1)).toEqual({ k: 'cake', x: -1.25, z: 3.5, r: 5, c: 'lime', w: true });
    expect(w.props.filter((p) => p.k === 'bench')).toHaveLength(6);   // (two taken away)
    expect(w.guests).toHaveLength(GUESTS);
    expect(w.guests[3]).toEqual({ ...THEMES[2].guests[3], hat: 'fez', topCol: 'mint' });
    expect(w.guests.filter((_, i) => !dressedUp(w, i))).toHaveLength(GUESTS - 1);
  });
  it('one with someone of your own, before a theme', () => {
    const w = decode('WzEsMCwwLC0xLDAsWyJvIix7ImJvZHkiOiJmIiwiaGFpciI6ImJ1biIsInRvcENvbCI6InJvc2UiLCJuYW1lIjoiUGVnIn1dLDAsMF0')!;
    expect(w.partner).toEqual({ kind: 'own', look: { body: 'f', hair: 'bun', topCol: 'rose', name: 'Peg' } });
    expect([w.theme, w.guests.length]).toEqual([null, 0]);
  });
  it('and shared again, they come back the same', () => {
    const w = decode('WzEsMSwwLDEsMSxbInMiLDBdLDAsMF0')!;
    expect(decode(encode(w))).toEqual(w);
  });
});

describe('a collage of the whole wedding, not just one picture (11 Nov: "snapshots of all the key moments")', () => {
  it('takes the walk up the aisle, the vows, the plot\'s big moment, the kiss and the cheer, in order, each once', () => {
    const big = { sweet: 'sweet', raiders: 'raiders', drunk: 'drunk', brawl: 'brawl', gifts: 'gifts' } as const;
    for (const p of PLOTS) {
      expect(moments(p.id).map((m) => m.id)).toEqual(['aisle', 'vows', big[p.id], 'kiss', 'cheer']);
      for (const cake of [true, false]) {
        const s = plotScript(p.id, cake), times = moments(p.id).map((m) => momentTime(s, m));
        // (each inside its beat, a second or more in, when the camera's settled on the shot)
        moments(p.id).forEach((m, i) => {
          const b = s.find((x) => x.beat === m.beat)!;
          expect(b, `${p.id}: ${m.beat}`).toBeDefined();
          expect(m.at).toBeGreaterThanOrEqual(1.5);
          expect(m.at).toBeLessThan(b.secs - 0.3);
          expect(plotAt(s, times[i]).beat).toBe(m.beat);
        });
        for (let i = 1; i < times.length; i++) expect(times[i]).toBeGreaterThan(times[i - 1]);
        // (a frame at a time, every one taken exactly once)
        const got: string[] = [];
        for (let t = 0; t < scriptSecs(s); t += 1 / 30) got.push(...momentsDue(s, p.id, t, t + 1 / 30).map((m) => m.id));
        expect(got).toEqual(moments(p.id).map((m) => m.id));
      }
    }
  });

  it('captions every snapshot in both tones, with the names put in', () => {
    for (const p of PLOTS) for (const m of moments(p.id)) for (const t of TONES) {
      const c = momentCaption(m.id, t.id);
      expect(c.length).toBeGreaterThan(5);
      expect(c.length).toBeLessThan(42);   // (one line under a little picture)
      expect(fill(c, { you: 'Ann', partner: 'Barnaby' })).not.toMatch(/[{}]/);
    }
    expect(momentCaption('aisle', 'happy')).toMatch(/\{partner\}/);
  });

  it('lays the keepsake out round the portrait, upright or sideways, nothing over anything and all of it inside', () => {
    const inside = (B: { x: number; y: number; w: number; h: number }, W: number, H: number) => B.x >= 20 && B.y >= 20 && B.x + B.w <= W - 20 && B.y + B.h <= H - 20;
    const apart = (a: { x: number; y: number; w: number; h: number }, b: typeof a) => a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
    for (const wide of [false, true]) for (let n = 0; n <= 6; n++) {
      const L = collage(n, wide), all = [L.hero, ...L.shots, ...L.caps, L.title];
      expect(L.shots.length).toBe(n);
      for (const B of all) expect(inside(B, L.w, L.h), `${wide ? 'wide' : 'upright'} ${n}`).toBe(true);
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(apart(all[i], all[j])).toBe(true);
      for (const B of [L.hero, ...L.shots]) expect(B.w / B.h).toBeCloseTo(4 / 3);
      for (const B of L.shots) expect(B.w * B.h).toBeLessThan(L.hero.w * L.hero.h / 4);   // (the portrait's the hero)
      // (upright, it's for a phone held upright: taller than wide; sideways, wider)
      if (n >= 3) expect(wide ? L.w > L.h : L.h > L.w).toBe(true);
    }
    // (no snapshots, the ceremony skipped: the portrait as it always was)
    expect(collage(0, false)).toMatchObject({ w: 1292, h: 1104, hero: { x: 46, y: 46, w: 1200, h: 900 } });
  });
});

/* Her own feedback, as a player (11 Nov): "The squirrel is cute and moving on my shoulder. Nice touch. I'm
   usually wearing a monkey but maybe I could switch fams as well as outfits?" */
describe('Mischievious: "I\'m usually wearing a monkey but maybe I could switch fams as well as outfits?" (11 Nov)', () => {
  // (her looks' familiars as js/den-look.js has them)
  const HER = [
    { title: 'Son of a Nutcracker!', look: { body: 'f', hat: 'feline', fam: 'squirrel', famCol: 'grey', famCol2: 'red' } as Look },
    { title: 'What is Love?', look: { body: 'f', hat: 'feline', fam: 'monkey', famCol: 'pink', famCol2: 'red' } as Look },
    { title: 'Taco Princess', look: { body: 'f', hat: 'tiara', fam: 'krakling', famCol: 'lemon', famCol2: 'red' } as Look },
    { title: 'Hotter Than Hell', look: { body: 'f', hat: 'feline', fam: 'none', famCol: 'green', famCol2: 'red' } as Look },
  ];
  const famsIn = (slot: string) => {
    const m = LOOK_JS.replace(/\r\n/g, '\n').match(new RegExp(`\\n  ${slot}: \\{\\n    m: \\[([\\s\\S]*?)\\],\\n    f: \\[([\\s\\S]*?)\\],\\n  \\}`))!;
    return [m[1], m[2]].map((b) => [...b.matchAll(/\['([a-z]+)'/g)].map((x) => x[1]));
  };
  const link = (a: unknown[]) => btoa(JSON.stringify(a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unlink = (code: string) => JSON.parse(atob(code.replace(/-/g, '+').replace(/_/g, '/')));

  it('offers every familiar the wardrobe has, and nothing else', () => {
    for (const body of famsIn('fam')) expect([...body].sort()).toEqual([...FAMS].sort());
  });
  it('offers her look\'s own first, then a monkey (she usually wears one), the rest, none last', () => {
    expect(herFams(HER[0].look)).toEqual(['squirrel', 'monkey', 'parrot', 'octopus', 'bat', 'krakling', 'dragon', 'none']);
    expect(herFams(HER[1].look)[0]).toBe('monkey');
    expect(herFams(HER[3].look)).toEqual(['none', 'monkey', 'parrot', 'octopus', 'squirrel', 'bat', 'krakling', 'dragon']);
    for (const v of HER) expect([...herFams(v.look)].sort()).toEqual([...FAMS].sort());
  });
  it('puts it on her in the colours another of her looks has it in, else the wardrobe\'s own', () => {
    expect(herLook(HER, { ver: 0, fam: 'monkey' })).toEqual({ ...HER[0].look, fam: 'monkey', famCol: 'pink', famCol2: 'red' });
    const parrot = herLook(HER, { ver: 0, fam: 'parrot' });
    expect(parrot.fam).toBe('parrot');
    expect(parrot.famCol).toBe(undefined);
    expect(parrot.hat).toBe('feline');
    expect(herLook(HER, { ver: 1 })).toEqual(HER[1].look);
    expect(herLook(HER, { ver: 3, fam: 'none' })).toEqual(HER[3].look);
    expect(herLook(HER, { ver: 9 })).toEqual(HER[0].look);
  });
  it('is kept with the wedding and its share link, a plain one\'s link as short as before', () => {
    const w: Wedding = { ...fresh('happy'), partner: { kind: 'her', ver: 2, fam: 'monkey' } };
    expect(decode(encode(w))!.partner).toEqual({ kind: 'her', ver: 2, fam: 'monkey' });
    expect(clean(JSON.parse(JSON.stringify(w))).partner).toEqual({ kind: 'her', ver: 2, fam: 'monkey' });
    const plain: Wedding = { ...fresh('happy'), partner: { kind: 'her', ver: 2 } };
    expect(decode(encode(plain))!.partner).toEqual({ kind: 'her', ver: 2 });
    expect(unlink(encode(plain))).toEqual([2, 0, 0, -1, 0, ['h', 2], 0]);
    expect(unlink(encode(w))).toEqual([2, 0, 0, -1, 0, ['h', 2, 'monkey'], 0]);
  });
  it('never takes a familiar the wardrobe hasn\'t got', () => {
    expect(clean({ partner: { kind: 'her', ver: 1, fam: 'unicorn' } }).partner).toEqual({ kind: 'her', ver: 1 });
    expect(clean({ partner: { kind: 'her', ver: 1, fam: 7 } }).partner).toEqual({ kind: 'her', ver: 1 });
    expect(decode(link([2, 0, 0, -1, 0, ['h', 1, '<script>'], 0]))!.partner).toEqual({ kind: 'her', ver: 1 });
    const fam: FamId = 'monkey';
    expect(FAMS).toContain(fam);
  });
  it('old links and saved weddings, from before, are her look\'s own', () => {
    expect(decode(link([1, 0, 2, 2, 3, ['h', 2], 0]))!.partner).toEqual({ kind: 'her', ver: 2 });
    expect(decode(link([2, 0, 0, -1, 0, ['h', 4], 0]))!.partner).toEqual({ kind: 'her', ver: 4 });
    expect(clean({ partner: { kind: 'her', ver: 2 } }).partner).toEqual({ kind: 'her', ver: 2 });
  });
  it('comes home with her: whoever you married, at the den, has it', () => {
    const s = spouseOf({ ...fresh('happy'), partner: { kind: 'her', ver: 0, fam: 'monkey' } }, HER)!;
    expect(s.look).toMatchObject({ fam: 'monkey', famCol: 'pink', hat: 'feline' });
    expect(spouseOf({ ...fresh('happy'), partner: { kind: 'her', ver: 0 } }, HER)!.look).toEqual(HER[0].look);
  });
});
