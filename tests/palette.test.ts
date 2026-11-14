/* Every colour a pirate's drawn in (src/palette.ts), and the wardrobe drawing from it (14 Nov). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DYES, FUR, FUR_FACE, FURS, GROUPS, HAIR, HAIRS, PALETTE, SKIN } from '../src/palette';

const ROOT = join(__dirname, '..');

/** The colours as js/den-look.js had them before they were moved out (13 Nov), less the few made for one pirate
    (14 Nov): every look drawn then in these draws the same now. */
const BEFORE = {
  DYES: {
    aqua: '#65c9c9', black: '#2a2a2e', blue: '#4d78cf', brown: '#7d5c35', gold: '#ffbe00', green: '#3b6c2c', grey: '#cbcdd1',
    lavender: '#d9b0ff', 'light blue': '#8cc8f6', 'light green': '#669619', lime: '#3fd837', lemon: '#fffbbf', magenta: '#c9227b',
    maroon: '#9e171b', mint: '#90ffb9', navy: '#434ca2', orange: '#f57c09', peach: '#ffd5a8', persimmon: '#ff5300', pink: '#fe79a4',
    purple: '#6104ad', red: '#d72c22', rose: '#ffc4d6', tan: '#ad8047', violet: '#bf3bc4', white: '#f6f2ea', yellow: '#f8ff35',
    shadow: '#674c7b', atlantean: '#afb8fe', crimson: '#a8031f', silver: '#a6a9bf', 'vibrant red': '#d7094a',
  },
  SKIN: ['#f6d3b0', '#f0bf8e', '#d9a066', '#b57a4a', '#8a5530', '#5c3a22', '#9a887c'],
  HAIR: { black: '#1f1a17', 'dark brown': '#3b2414', brown: '#6a4020', 'light brown': '#8e7543', auburn: '#7f2e16', red: '#9a0a08', ginger: '#c4642a', blonde: '#dcb565', grey: '#a09a92', white: '#ece8e0' },
  FUR: { brown: '#6b4423', tan: '#ad8047', ginger: '#b5652a', grey: '#8a8a8a', black: '#2a2a2e', cream: '#e9dcc0', white: '#f7f5f0', lavender: '#b9a9ea' },
  FUR_FACE: { lavender: '#fbf8ff' },
};

/** Every clothing colour YPPedia knows (Clothing palette, its standard and limited editions, and Chroma's list since), 14 Nov. */
const YPPEDIA = [
  'aqua', 'black', 'blue', 'brown', 'gold', 'green', 'grey', 'lavender', 'light blue', 'light green', 'lime', 'lemon', 'magenta', 'maroon',
  'mint', 'navy', 'orange', 'peach', 'persimmon', 'pink', 'purple', 'red', 'rose', 'tan', 'violet', 'white', 'yellow',
  'banana', 'chocolate', 'ice blue', 'plum', 'spring green', 'wine', 'emerald', 'sea green', 'silver', 'blue grey', 'crimson', 'royal blue',
  'shadow', 'atlantean', 'indigo', 'night blue', 'inky',
  'cranberry', 'cream', 'hot pink', 'hunter', 'periwinkle', 'pumpkin', 'vibrant red',
];

const page = () => readFileSync(join(ROOT, 'catalogue-colours.html'), 'utf8');

describe('the palette', () => {
  it('draws every colour a look could have before exactly as it did', () => {
    for (const [name, hex] of Object.entries(BEFORE.DYES)) expect(DYES[name], name).toBe(hex);
    expect([...SKIN]).toEqual(BEFORE.SKIN);
    expect(Object.fromEntries(HAIRS.map((c) => [c.name, c.hex]))).toEqual(BEFORE.HAIR);
    expect(Object.fromEntries(FURS.map((c) => [c.name, c.hex]))).toEqual(BEFORE.FUR);
    expect(FUR_FACE).toEqual(BEFORE.FUR_FACE);
  });

  it('has every Puzzle Pirates clothing colour, periwinkle among them (Fable, 14 Nov), and nothing YPPedia doesn\'t', () => {
    expect(PALETTE.map((c) => c.name).sort()).toEqual([...YPPEDIA].sort());
  });

  it('names each once, in a group, as a colour, saying where it came from', () => {
    expect(new Set(PALETTE.map((c) => c.name)).size).toBe(PALETTE.length);
    for (const c of PALETTE) {
      expect(c.hex, c.name).toMatch(/^#[0-9a-f]{6}$/);
      if (c.wiki) expect(c.wiki, c.name).toMatch(/^#[0-9a-f]{6}$/);
      expect(GROUPS.map((g) => g.id), c.name).toContain(c.group);
      expect(c.from.length, c.name).toBeGreaterThan(5);
    }
    for (const g of GROUPS) expect(PALETTE.some((c) => c.group === g.id), g.id).toBe(true);
  });

  it('has no colour of anybody\'s own, everyone in the one palette (the user, 14 Nov: "There should be no specific colours for anybody")', () => {
    // Pink or silver hair, a pink or a plum monkey: the palette's own dyes, not shades of their own.
    for (const name of ['pink', 'silver']) expect(HAIRS.map((c) => c.name), name).not.toContain(name);
    for (const name of ['pink', 'plum']) expect(FURS.map((c) => c.name), name).not.toContain(name);
    expect(HAIR.pink).toBe(DYES.pink);
    expect(HAIR.silver).toBe(DYES.silver);
    expect(FUR.pink).toBe(DYES.pink);
    expect(FUR.plum).toBe(DYES.plum);
    expect(DYES.plum).toBe('#4c0e78');
    // Hair and fur keep their natural colours where a dye shares the name.
    expect(HAIR.red).toBe(BEFORE.HAIR.red);
    expect(FUR.lavender).toBe(BEFORE.FUR.lavender);
    // Every colour the den's pirates wear is one of them.
    for (const file of [join('js', 'den-look.js'), join('src', 'den-dachimpy.ts'), join('src', 'den-wedding.ts')]) {
      const src = readFileSync(join(ROOT, file), 'utf8');
      for (const [, key, name] of src.matchAll(/\b(\w*Col2?): '([^'#]+)'/g)) {
        if (name === 'none') continue;
        expect(key === 'hairCol' ? HAIR[name] : FUR[name], `${file}: ${key} '${name}'`).toBeDefined();
      }
    }
  });

  it('says nothing on the catalogue of which colours were checked (the user, 14 Nov)', () => {
    expect(page()).not.toMatch(/checked|from a portrait|\.from\b|\.wiki\b/i);
    expect(PALETTE.some((c) => 'checked' in c)).toBe(false);
  });

  it('has the catalogue\'s menu as the page\'s main navigation, above its title (the user, 14 Nov: "I had to really look for that")', () => {
    const html = page(), nav = html.indexOf('<nav class="catnav" aria-label="The catalogue">'), h1 = html.indexOf('<h1>Colours</h1>');
    expect(nav).toBeGreaterThan(-1);
    expect(h1).toBeGreaterThan(nav);
    expect(html.slice(nav, h1)).toMatch(/aria-current="page">Colours</);
    expect(html).toMatch(/id="sections" aria-label="On this page"/);
  });

  it('lists the tailor\'s standard palette first, so the wardrobe offers them first', () => {
    const firstLimited = PALETTE.findIndex((c) => c.group !== 'standard');
    expect(PALETTE.slice(firstLimited).every((c) => c.group !== 'standard')).toBe(true);
    expect(firstLimited).toBe(27);
  });

  it('is what the wardrobe draws: js/den-look.js keeps no colours of its own', () => {
    const look = readFileSync(join(ROOT, 'js', 'den-look.js'), 'utf8');
    expect(look).toMatch(/import \{[^}]*DYES[^}]*\} from '\.\/palette\.js'/);
    expect(look).not.toMatch(/export const (DYES|HAIR|FUR|SKIN) =/);
  });

  it('is listed in full on the catalogue\'s colours page, linked from the wardrobe and the front page', () => {
    expect(page()).toMatch(/from '\.\/js\/palette\.js'/);
    expect(page()).toMatch(/discord\.gg\//);
    expect(readFileSync(join(ROOT, 'index.html'), 'utf8')).toMatch(/href="catalogue-colours\.html"/);
    expect(readFileSync(join(ROOT, 'js', 'den', 'menus.js'), 'utf8')).toMatch(/catalogue-colours\.html/);
  });

  it('is tried on by the page\'s stage with the den\'s own pirates and furniture, without the den starting up round them', () => {
    const stage = readFileSync(join(ROOT, 'js', 'den', 'colour-stage.js'), 'utf8'), furniture = readFileSync(join(ROOT, 'js', 'den', 'furniture.js'), 'utf8');
    expect(stage).toMatch(/from '\.\.\/den-look\.js'/);
    expect(stage).toMatch(/from '\.\/furniture\.js'/);
    // (world.js makes the den's full-window renderer as it loads: neither may need it.)
    for (const src of [stage, furniture]) expect(src).not.toMatch(/from '\.\/world\.js'/);
  });
});
