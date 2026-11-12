/* A wedding showered in gifts (12 Nov). Mischievious herself, laughing: "Something fun (not expected) maybe
   that I expect everyone to shower me with gifts 😂"; and the user: "you don't want her to seem demanding,
   but just make it fun ... maybe it can fit into the thing of like a wedding theme with lots and lots of
   gifts." So a theme, Showered in gifts, and a plot: the guests lay their presents till the couple are
   buried up to the neck. (src/den-wedding.ts) */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  COUPLE, GUSH, Gush, NECK, PLOTS, SPILL, SUGGEST, THEMES, TODAY, VENUES, AREA, ALTAR,
  clean, decode, dressFor, encode, fresh, giftPile, giftSpill, layout, moments, momentTime, plotScript, readSecs, scriptSecs, themeLook, baseGuest, seatsFor, SIZES,
} from '../src/den-wedding';
import { GUESTS_SAY } from '../src/lines/wedding-guests';
import { CEREMONY } from '../src/lines/mischievious';
import type { Wedding } from '../src/den-wedding';

const LOOK_JS = readFileSync(join(__dirname, '..', 'js', 'den-look.js'), 'utf8');
const gifts = THEMES.find((t) => t.id === 'gifts')!;

describe('a wedding showered in gifts, fun and never demanding (12 Nov)', () => {
  it('is a theme of its own: bright ribbon colours, and a present in every guest\'s hand', () => {
    expect(gifts.name).toBe('Showered in gifts');
    expect(THEMES.at(-1)).toBe(gifts);   // (on the end: the share link's themes are by number)
    expect(gifts.guests.every((g) => g.hand === 'gift')).toBe(true);
    expect(new Set(gifts.guests.map((g) => g.handCol)).size).toBeGreaterThanOrEqual(4);
    for (const b of ['m', 'f'] as const) expect(gifts.wear[b].hand).toEqual(['gift']);
    // (the crowd's presents in the theme's colours too)
    for (let s = 0; s < 20; s++) { const L = themeLook('gifts', s % 2 ? 'm' : 'f'); expect(L.hand).toBe('gift'); expect(gifts.dyes).toContain(L.handCol); }
    // (a present's a hand item in the wardrobe, its paper dyed, as a bouquet's flowers are)
    expect(LOOK_JS).toMatch(/\['gift', 'Present'\]/);
    expect(LOOK_JS).toMatch(/HAND_DYED = \[[^\]]*'gift'/);
  });

  it('piles presents everywhere at every venue: by the arch, up the aisle, a mountain beside the couple', () => {
    for (const v of VENUES) {
      const ps = layout(v.id, 'gifts'), g = ps.filter((p) => p.k === 'gifts');
      expect(g.length, v.id).toBeGreaterThanOrEqual(12);
      expect(g.filter((p) => p.z < -4.5 && Math.abs(p.x) < 2.5).length, `${v.id}: by the arch`).toBeGreaterThanOrEqual(2);
      expect(g.filter((p) => Math.abs(p.x) < 1.2 && p.z > 0).length, `${v.id}: up the aisle`).toBeGreaterThanOrEqual(4);
      expect(g.filter((p) => p.z < -3 && Math.abs(p.x) > 2.2).length, `${v.id}: the mountain`).toBeGreaterThanOrEqual(5);
      // (and never in the aisle itself: your sweetheart walks up it)
      for (const p of g) if (p.z > -0.8) expect(Math.abs(p.x), `${v.id}: a present in the aisle`).toBeGreaterThan(0.7);
    }
    // (with all the room it ever had for half the Ocean to stand)
    for (const v of VENUES) expect(seatsFor(layout(v.id, 'gifts'), SIZES.at(-1)!.n)).toHaveLength(SIZES.at(-1)!.n);
  });

  it('is a plot of its own: they file up, the pile grows over the couple, it tumbles, and on it goes', () => {
    expect(PLOTS.at(-1)).toMatchObject({ id: 'gifts', name: 'Showered in gifts', blurb: 'Everyone brought a present. Everyone.' });
    for (const cake of [true, false]) {
      const s = plotScript('gifts', cake), beats = s.map((b) => b.beat);
      expect(beats).toEqual(['seated', 'procession', 'vows', 'bring', 'heap', 'tumble', 'ido', 'kiss', 'cheer', 'portrait']);
      expect(scriptSecs(s)).toBeGreaterThan(30);
      expect(scriptSecs(s)).toBeLessThan(60);
      for (const b of s) b.lines.forEach((l, j) => expect((b.lines[j + 1]?.at ?? b.secs) - l.at, `${b.beat}: "${l.text}"`).toBeGreaterThanOrEqual(readSecs(l.text) - 1e-9));
      const said = s.flatMap((b) => b.lines.map((l) => l.text));
      expect(said).toContain(GUESTS_SAY.cannon);
      expect(said).toContain(GUESTS_SAY.twoCannons);
    }
    // (its keepsake snapshot: the couple in it up to the neck)
    expect(moments('gifts').map((m) => m.id)).toEqual(['aisle', 'vows', 'gifts', 'kiss', 'cheer']);
    expect(momentTime(plotScript('gifts'), moments('gifts')[2])).toBeGreaterThan(0);
  });

  it('buries the couple up to the neck, and no higher, then spills low across the front', () => {
    const pile = giftPile();
    expect(pile.length).toBeGreaterThan(30);
    expect(pile).toEqual(giftPile());   // (the same pile every time)
    for (const c of [COUPLE.you, COUPLE.partner]) {
      const top = Math.max(...pile.filter((g) => Math.hypot(g.x - c.x, g.z - c.z) < 0.45).map((g) => g.y + g.s));
      expect(top).toBeGreaterThan(NECK - 0.35);
      expect(top).toBeLessThan(NECK + 0.4);
    }
    // (the bottom first: each present lands on what's laid already)
    for (const g of pile) expect(g.s).toBeGreaterThan(0.2);
    // (the officiant at the altar's in it no more than waist deep: they've the rest of it to say)
    expect(pile.every((g) => Math.hypot(g.x - ALTAR.x, g.z - ALTAR.z) > 0.6 || g.y + g.s < 1.0)).toBe(true);
    const spill = giftSpill(pile);
    expect(spill.map((g) => g.s)).toEqual(pile.map((g) => g.s));
    for (const g of spill) {
      expect(Math.abs(g.x)).toBeLessThanOrEqual(SPILL.x + 0.1);
      expect(g.z).toBeGreaterThanOrEqual(SPILL.z0 - 0.1);
      expect(g.z).toBeLessThanOrEqual(SPILL.z1 + 0.1);
      expect(g.y + g.s).toBeLessThan(1.1);
      expect(Math.abs(g.x)).toBeLessThanOrEqual(AREA.x);
    }
  });

  it('round-trips the theme and the plot through a share link, a grand crowd and all', () => {
    for (const tone of ['happy', 'dark'] as const) {
      const w: Wedding = { ...dressFor({ ...fresh(tone), size: 'grand', seed: 321 }, 'gifts'), partner: { kind: 'suitor', i: 2 }, plot: 'gifts', venue: 'beach' };
      const back = decode(encode(w))!;
      expect(back).toEqual(clean(w));
      expect([back.theme, back.plot, back.guests.length]).toEqual(['gifts', 'gifts', 140]);
      expect(back.guests[60]).toEqual(baseGuest('gifts', 321, 60));
      expect(encode(w).length).toBeLessThan(80);
    }
    // (every other theme with the gifts plot, and the gifts theme with every plot)
    for (const t of THEMES) for (const p of PLOTS) if (t.id === 'gifts' || p.id === 'gifts') {
      const w = clean({ ...dressFor(fresh('happy'), t.id as 'gifts'), plot: p.id });
      expect([w.theme, w.plot]).toEqual([t.id, p.id]);
      expect(decode(encode(w))).toEqual(w);
    }
  });

  it('she\'s delighted by the heap, and it\'s all the couple\'s: never asking for presents herself', () => {
    const hers = [
      ...new Gush('happy').pool('theme_gifts'), ...new Gush('happy').pool('plot_gifts'), ...new Gush('dark').pool('plot_gifts'),
      ...GUSH.add_gifts as readonly string[], CEREMONY.presents, CEREMONY.stillThere, CEREMONY.thankYous,
    ];
    for (const l of hers) expect(l).not.toMatch(/\b(for me|my presents?|my gifts?|give me|gimme|I want|I expect|owe me|mine)\b/i);
    // (one of today's six was this one, and she recalls it)
    expect(TODAY.some((w) => w.theme === 'gifts' && w.plot === 'gifts')).toBe(true);
    expect(TODAY).toHaveLength(6);
    expect(SUGGEST.happy.plots).toContain('gifts');
  });
});
