/* Every colour a pirate's drawn in (src/palette.ts), and the wardrobe drawing from it (14 Nov). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DYES, FUR, FUR_FACE, GROUPS, HAIR, PALETTE, SKIN } from '../src/palette';

const ROOT = join(__dirname, '..');

/** The colours as js/den-look.js had them before they were moved out (13 Nov): every look drawn then draws the same now. */
const BEFORE = {
  DYES: {
    aqua: '#65c9c9', black: '#2a2a2e', blue: '#4d78cf', brown: '#7d5c35', gold: '#ffbe00', green: '#3b6c2c', grey: '#cbcdd1',
    lavender: '#d9b0ff', 'light blue': '#8cc8f6', 'light green': '#669619', lime: '#3fd837', lemon: '#fffbbf', magenta: '#c9227b',
    maroon: '#9e171b', mint: '#90ffb9', navy: '#434ca2', orange: '#f57c09', peach: '#ffd5a8', persimmon: '#ff5300', pink: '#fe79a4',
    purple: '#6104ad', red: '#d72c22', rose: '#ffc4d6', tan: '#ad8047', violet: '#bf3bc4', white: '#f6f2ea', yellow: '#f8ff35',
    shadow: '#674c7b', atlantean: '#afb8fe', plum: '#86094f', crimson: '#a8031f', silver: '#a6a9bf', 'vibrant red': '#d7094a',
  },
  SKIN: ['#f6d3b0', '#f0bf8e', '#d9a066', '#b57a4a', '#8a5530', '#5c3a22', '#9a887c'],
  HAIR: { black: '#1f1a17', 'dark brown': '#3b2414', brown: '#6a4020', 'light brown': '#8e7543', auburn: '#7f2e16', red: '#9a0a08', ginger: '#c4642a', blonde: '#dcb565', grey: '#a09a92', silver: '#b2b9c6', white: '#ece8e0', pink: '#e8609a' },
  FUR: { brown: '#6b4423', tan: '#ad8047', ginger: '#b5652a', grey: '#8a8a8a', black: '#2a2a2e', cream: '#e9dcc0', white: '#f7f5f0', lavender: '#b9a9ea', pink: '#be667f', plum: '#734b91' },
  FUR_FACE: { lavender: '#fbf8ff', plum: '#a98bc4' },
};

/** Every clothing colour YPPedia knows (Clothing palette, its standard and limited editions, and Chroma's list since), 14 Nov. */
const YPPEDIA = [
  'aqua', 'black', 'blue', 'brown', 'gold', 'green', 'grey', 'lavender', 'light blue', 'light green', 'lime', 'lemon', 'magenta', 'maroon',
  'mint', 'navy', 'orange', 'peach', 'persimmon', 'pink', 'purple', 'red', 'rose', 'tan', 'violet', 'white', 'yellow',
  'banana', 'chocolate', 'ice blue', 'plum', 'spring green', 'wine', 'emerald', 'sea green', 'silver', 'blue grey', 'crimson', 'royal blue',
  'shadow', 'atlantean', 'indigo', 'night blue', 'inky',
  'cranberry', 'cream', 'hot pink', 'hunter', 'periwinkle', 'pumpkin', 'vibrant red',
];

describe('the palette', () => {
  it('draws every colour a look could have before exactly as it did', () => {
    for (const [name, hex] of Object.entries(BEFORE.DYES)) expect(DYES[name], name).toBe(hex);
    expect([...SKIN]).toEqual(BEFORE.SKIN);
    expect(HAIR).toEqual(BEFORE.HAIR);
    expect(FUR).toEqual(BEFORE.FUR);
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

  it('checks only what was sampled from a real pirate\'s portrait', () => {
    for (const c of PALETTE) expect(c.checked, c.name).toBe(/portrait/.test(c.from) && !/may be/.test(c.from));
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
    const page = readFileSync(join(ROOT, 'catalogue-colours.html'), 'utf8');
    expect(page).toMatch(/from '\.\/js\/palette\.js'/);
    expect(page).toMatch(/discord\.gg\//);
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
