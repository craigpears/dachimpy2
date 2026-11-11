/* Gravee's house, Bedside Manors (11 Nov: "she can show you ... around her house. And the vampires and do the
   portrait thing ... the taking a portrait and a snapshot, because that's fun"). */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PLAN, ARRIVE, FURNISH, blocksOf, galleryHang, GALLERY_SLOTS, GALLERY_LEN, FRAME_GAP, YETIS, HERSELF, VAMPIRE_PORTRAIT, HALL_OTHER, BACKDROPS,
  WHIZ, whiz, whizSecs, TOUR, stopAt, atCoffin, COFFIN, SITTING, SCARE, eyesToward,
} from '../src/den-gravee';
import type { Portrait } from '../src/den-gravee';
import { walkable, roomAt, atWayOut, step } from '../src/den-houses';
import { TOUR_LINES, AT_THE_DOOR, THE_SCARE } from '../src/lines/gravee';

const LOOK_JS = readFileSync(join(__dirname, '..', 'js', 'den-look.js'), 'utf8');
const FURNITURE_JS = readFileSync(join(__dirname, '..', 'js', 'den', 'furniture.js'), 'utf8');
/** The ids the wardrobe offers for a slot, read from js/den-look.js (it needs three.js to run). */
const partsOf = (slot: string) => {
  const m = LOOK_JS.match(new RegExp(`\\n  ${slot}: \\{\\n    m: \\[([\\s\\S]*?)\\],\\n    f: \\[([\\s\\S]*?)\\],\\n  \\}`))!;
  return [...(m[1] + m[2]).matchAll(/\['([a-z]+)'/g)].map((x) => x[1]);
};
const everyPortrait = (): Portrait[] => [...galleryHang(), HERSELF, VAMPIRE_PORTRAIT, HALL_OTHER];

describe('her house: three rooms in a row', () => {
  it('lets you walk from the front door, down the gallery, into her bedchamber', () => {
    expect(walkable(PLAN, ARRIVE.you.x, ARRIVE.you.z)).toBe(true);
    expect(atWayOut(PLAN, ARRIVE.you.x, ARRIVE.you.z + 0.3)).toBe(true);
    // Walk it along z = 0 from the hall to the far wall: never stuck.
    let x = 0, z = 0;
    const end = PLAN.rooms[2].x1 - 1;
    for (let i = 0; i < 2000 && x < end; i++) [x, z] = step(PLAN, x, z, x + 0.1, z, blocksOf(FURNISH));
    expect(x).toBeGreaterThanOrEqual(end - 0.01);
    expect(roomAt(PLAN, x, z)?.id).toBe('chamber');
  });

  it('places only furniture the shared furniture module makes, each inside its room', () => {
    for (const p of FURNISH) {
      expect(FURNITURE_JS, p.kind).toMatch(new RegExp(`\\b${p.kind}\\b`));
      expect(PLAN.rooms.some((r) => p.x > r.x0 && p.x < r.x1 && p.z > r.z0 && p.z < r.z1), `${p.kind} at ${p.x},${p.z}`).toBe(true);
    }
    expect(FURNISH.filter((p) => p.kind === 'coffin')).toHaveLength(1);
  });

  it('leaves room to stand by the coffin for your sitting, and for her at her easel', () => {
    const B = blocksOf(FURNISH);
    for (const s of [SITTING.you, SITTING.her]) {
      expect(walkable(PLAN, s.x, s.z)).toBe(true);
      for (const b of B) expect(Math.hypot(s.x - b.x, s.z - b.z)).toBeGreaterThan(b.r);
    }
    expect(atCoffin(SITTING.you.x, SITTING.you.z)).toBe(true);
    expect(atCoffin(0, 0)).toBe(false);
  });
});

describe('her portraits: config, each a pirate from a look', () => {
  it('fills the gallery wall, frames evenly along it', () => {
    const G = galleryHang();
    expect(G).toHaveLength(GALLERY_SLOTS);
    G.forEach((p, i) => i && expect(p.x - G[i - 1].x).toBeCloseTo(FRAME_GAP));
    expect(G[G.length - 1].x).toBeLessThan(PLAN.rooms[1].x1);
    expect(new Set(G.map((p) => p.id)).size).toBe(G.length);
  });

  it('starts with her own looks, by their real titles, where you walk', () => {
    const G = galleryHang().filter((p) => p.x < WHIZ.a);
    expect(G.length).toBeGreaterThanOrEqual(3);
    for (const p of G) expect(p.sitter).toMatchObject({ who: 'pirate', name: 'Gravee' });
  });

  it('is full of her definitive proof of the yeti, and the pirates she has met', () => {
    const G = galleryHang();
    expect(G.filter((p) => p.sitter.who === 'yeti').length).toBeGreaterThanOrEqual(20);
    for (const p of G.filter((q) => q.sitter.who === 'yeti')) expect(p.title).toMatch(/^Definitive Proof of /);
    for (const n of ['Dalnoth', 'Dignity', 'Mischievious', 'Kikkit']) expect(G.some((p) => p.sitter.who === 'pirate' && p.sitter.name === n), n).toBe(true);
    expect(new Set(YETIS).size).toBe(YETIS.length);
  });

  it('draws only real pirates in the wardrobe (PIRATES), in clothes it has', () => {
    const pirates = LOOK_JS.match(/export const PIRATES = [\s\S]*?\n\}\)/)![0];
    const slots: Record<string, string[]> = { hat: partsOf('hat'), hair: partsOf('hair'), top: partsOf('top'), legs: partsOf('legs'), feet: partsOf('feet'), hand: partsOf('hand'), fam: partsOf('fam') };
    for (const p of everyPortrait()) {
      const s = p.sitter;
      if (s.who === 'pirate') expect(pirates, s.name).toMatch(new RegExp(`\\n  ${s.name}: \\{`));
      const dress = s.who === 'pirate' || s.who === 'yeti' ? s.dress ?? {} : {};
      for (const [k, v] of Object.entries(dress)) if (slots[k]) expect(slots[k], `${p.id}: ${k} ${v}`).toContain(v);
      expect(BACKDROPS).toContain(p.backdrop);
    }
  });

  it('has Gravee in the wardrobe as her portrait has her: a white Berserker pelt, a green Gown, her tan monkey', () => {
    const her = LOOK_JS.match(/\n {2}Gravee: \{([\s\S]*?)\n {2}\},/)![1];
    expect(her).toMatch(/hat: 'pelt', hatCol: 'white'/);
    expect(her).toMatch(/legs: 'gown', legsCol: 'green'/);
    expect(her).toMatch(/fam: 'monkey', famCol: 'tan'/);
    expect(her).toMatch(/hook: true/);
    expect(her).toMatch(/starfish: true/);
    expect(partsOf('hat')).toContain('pelt');
    expect(partsOf('hand')).toContain('candle');
  });
});

describe('the endless gallery (10 Nov: "you wouldn\'t want to make it too tedious, but eventually you just start zooming along")', () => {
  it('is long, but you only ever walk its two ends', () => {
    expect(GALLERY_LEN).toBeGreaterThan(40);
    expect(WHIZ.a - PLAN.rooms[1].x0).toBeLessThan(8);
    expect(PLAN.rooms[1].x1 - WHIZ.b).toBeLessThan(8);
  });

  it('whizzes you the length of it going in, and back again coming out, never into the middle', () => {
    expect(whiz(WHIZ.a - 0.1, WHIZ.a + 0.05)).toBeCloseTo(WHIZ.b + 0.3);
    expect(whiz(WHIZ.b + 0.1, WHIZ.b - 0.05)).toBeCloseTo(WHIZ.a - 0.3);
    expect(whiz(WHIZ.a - 2, WHIZ.a - 1.9)).toBeNull();
    expect(whiz(WHIZ.b + 1, WHIZ.b + 1.1)).toBeNull();
    // Landing past the line it started from, so it doesn't whiz you straight back.
    expect(whiz(WHIZ.b + 0.3, WHIZ.b + 0.35)).toBeNull();
    expect(whiz(WHIZ.a - 0.3, WHIZ.a - 0.35)).toBeNull();
  });

  it('takes long enough the first time to see how far it goes, and is quick after', () => {
    expect(whizSecs(0)).toBeGreaterThan(3);
    expect(whizSecs(1)).toBeLessThan(2);
  });
});

describe('her tour, stop by stop', () => {
  it('has her lines for every stop, and every stop somewhere you can stand', () => {
    for (const s of TOUR) {
      expect(TOUR_LINES[s.id].length, s.id).toBeGreaterThan(0);
      expect(walkable(PLAN, s.at.x, s.at.z), `${s.id} at`).toBe(true);
      expect(walkable(PLAN, s.her.x, s.her.z), `${s.id} her`).toBe(true);
    }
  });

  it('skips her on to where you are if you walk ahead', () => {
    const coffin = TOUR.findIndex((s) => s.id === 'coffin');
    expect(stopAt(0, TOUR[coffin].at.x, TOUR[coffin].at.z)).toBe(coffin);
    expect(stopAt(0, TOUR[0].at.x, TOUR[0].at.z)).toBe(0);
    expect(stopAt(2, TOUR[0].at.x, TOUR[0].at.z)).toBe(-1);   // (said already)
    expect(stopAt(0, -4, 2.5)).toBe(-1);
  });

  it("says something at the door, and when she sees her chance to paint you", () => {
    expect(AT_THE_DOOR.first).toBeTruthy();
    expect(THE_SCARE.moment).toMatch(/portrait moment/);
    expect(SCARE.creak).toBeLessThan(SCARE.up);
    expect(SCARE.up).toBeLessThan(SCARE.scream);
    expect(SCARE.scream).toBeLessThan(SCARE.freeze);
    expect(SCARE.freeze).toBeLessThan(SCARE.paint);
    expect(SCARE.paint).toBeLessThan(SCARE.done);
    expect(COFFIN.x).toBeGreaterThan(PLAN.rooms[2].x0);
  });
});

describe("the Count's portrait: its eyes follow you", () => {
  it('looks left when you are to its left, right when you are to its right', () => {
    expect(eyesToward(10, 2, 7, 1, -3)[0]).toBeLessThan(-0.3);
    expect(eyesToward(10, 2, 13, 1, -3)[0]).toBeGreaterThan(0.3);
    expect(Math.abs(eyesToward(10, 2, 10, 1, -3)[0])).toBeLessThan(0.01);
  });
  it('never rolls its eyes right out of its head', () => {
    for (const x of [-100, 0, 100]) for (const z of [-3, 0, 50]) for (const v of eyesToward(10, 2, x, z, -3)) expect(Math.abs(v)).toBeLessThanOrEqual(1);
  });
});
