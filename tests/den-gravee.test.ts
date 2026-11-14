/* Gravee's house, Bedside Manors (11 Nov: "she can show you ... around her house. And the vampires and do the
   portrait thing ... the taking a portrait and a snapshot, because that's fun"). */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PLAN, ARRIVE, FURNISH, blocksOf, galleryHang, GALLERY_SLOTS, GALLERY_LEN, FRAME_GAP, YETIS, HERSELF, VAMPIRE_PORTRAIT, HALL_OTHER, BACKDROPS,
  WHIZ, TOUR, stopAt, atCoffin, COFFIN, EASEL, SITTING, SCARE, SCARE_SHOTS, scareShot, LEAD, LURE, leading,
} from '../src/den-gravee';
import type { Portrait } from '../src/den-gravee';
import { walkable, roomAt, atWayOut, step, skipTo, hostTarget, canvasAt, brushReach, BRUSH } from '../src/den-houses';
import type { Stretch } from '../src/den-houses';
import { TOUR_LINES, AT_THE_DOOR, THE_SCARE, BECKON } from '../src/lines/gravee';
import { furnitureSource, furnitureIds } from './furniture-files';

const LOOK_JS = readFileSync(join(__dirname, '..', 'js', 'den-look.js'), 'utf8').replace(/\r\n/g, '\n');   // (either line ending, as checked out)
const FURNITURE_JS = furnitureSource(), FURNITURE_IDS = furnitureIds();
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
      expect(FURNITURE_IDS, p.kind).toContain(p.kind);
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

  it("is walked, not whizzed down by itself: the whiz is a skip you choose (11 Nov: 'Obviously, you can zoom by as a skip. I don't think it should do that by default, though')", () => {
    const S: Stretch = WHIZ;
    const GAL = PLAN.rooms[1];
    expect(S.room).toBe(GAL.id);
    // A skip from the gallery's door goes the length of it, and from its far end all the way back.
    expect(skipTo(PLAN, S, GAL.x0 + 1, 0, 1)).toBe(WHIZ.b);
    expect(skipTo(PLAN, S, GAL.x1 - 1, 0, -1)).toBe(WHIZ.a);
    expect(skipTo(PLAN, S, PLAN.rooms[0].x0 + 1, 0, 1)).toBeNull();   // (not from the hall)
    // Landing where you can stand, at the yeti stop going in.
    expect(walkable(PLAN, WHIZ.a, 0) && walkable(PLAN, WHIZ.b, 0)).toBe(true);
    expect(stopAt(0, WHIZ.b, 0)).toBe(TOUR.findIndex((s) => s.id === 'yeti'));
    // And nothing in the house whizzes you by itself any more.
    expect(readFileSync(join(__dirname, '..', 'js', 'den', 'gravee-house.js'), 'utf8')).not.toMatch(/[^.\w]whiz\(/);
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

describe("her brush to the canvas (11 Nov: 'her hand should actually be holding a brush at least pointing in the general direction of the canvas')", () => {
  const canvas = canvasAt(EASEL), her = SITTING.her;
  it('she faces the canvas when she paints (11 Nov)', () => {
    // Her yaw (0 faces +z) points at the canvas's middle...
    const want = Math.atan2(canvas.x - her.x, canvas.z - her.z);
    expect(Math.abs(Math.atan2(Math.sin(her.yaw - want), Math.cos(her.yaw - want)))).toBeLessThan(0.05);
    // ...from in front of it, not beside or behind it...
    const nx = Math.sin(EASEL.yaw), nz = Math.cos(EASEL.yaw);
    expect((her.x - canvas.x) * nx + (her.z - canvas.z) * nz).toBeGreaterThan(0.3);
    // ...and within arm's reach: the brush's tip on it.
    expect(Math.hypot(canvas.x - her.x, canvas.z - her.z)).toBeCloseTo(brushReach(), 5);
    expect(brushReach()).toBeGreaterThan(0.5);
    expect(brushReach()).toBeLessThan(BRUSH.tip);
  });
  it('paints with a brush in hand: the shared idle holds one, for any pirate who paints', () => {
    const PEOPLE_JS = readFileSync(join(__dirname, '..', 'js', 'den', 'props-people.js'), 'utf8');
    expect(PEOPLE_JS).toMatch(/HOLDS = \{[^}]*paint: 'brush'/);
    expect(FURNITURE_JS).toMatch(/CANVAS\.y, CANVAS\.out/);   // (the easel's canvas where a painter aims)
  });
});

describe("her pictures' captions don't flicker (11 Nov: 'the little captions underneath the pictures flicker')", () => {
  it('stands each layer clearly in front of the last: the wall, its wainscot, the picture, the plaque', () => {
    const HOUSE_JS = readFileSync(join(__dirname, '..', 'js', 'den', 'house.js'), 'utf8');
    const proud = Number(/WALL_T \+ ([\d.]+)/.exec(HOUSE_JS)![1]) / 2;   // (the wainscot, centred on the wall)
    const L = /const LAYER = \{ picture: ([\d.]+), plaque: ([\d.]+) \}/.exec(FURNITURE_JS)!;
    const picture = Number(L[1]), plaque = Number(L[2]);
    expect(picture).toBeGreaterThan(proud + 0.01);
    expect(plaque).toBeGreaterThan(Math.max(proud, picture) + 0.01);
    expect(FURNITURE_JS).toMatch(/polygonOffset: true/);
  });
});

describe("the Count's portrait: its eyes follow you", () => {
  it("is a portrait that watches (the eyes themselves: src/eyes.ts, any portrait's)", () => expect(VAMPIRE_PORTRAIT.watch).toBe(true));
});

describe("the camera while she paints you (11 Nov: 'the camera zoom's not really in the right place when she's painting ... It doesn't really flow right')", () => {
  const home = { look: { x: COFFIN.x - 1, y: 0.8, z: -2 }, dist: 8.5, tilt: 0.82, yaw: 0 };
  it('eases from where it was and back to it, never cutting', () => {
    expect(scareShot(0, home)).toEqual(home);
    expect(scareShot(SCARE.done, home)).toEqual(home);
    let last = scareShot(0, home);
    for (let t = 0.01; t < SCARE.done + 0.5; t += 0.01) {
      const s = scareShot(t, home);
      expect(Math.hypot(s.look.x - last.look.x, s.look.y - last.look.y, s.look.z - last.look.z), `look at ${t.toFixed(2)}`).toBeLessThan(0.08);
      expect(Math.abs(s.dist - last.dist), `dist at ${t.toFixed(2)}`).toBeLessThan(0.08);
      expect(Math.abs(s.tilt - last.tilt) + Math.abs(s.yaw - last.yaw)).toBeLessThan(0.02);
      last = s;
    }
  });
  it('holds on her at her easel, painting you, from her first stroke till she has done', () => {
    const paint = SCARE_SHOTS[SCARE_SHOTS.length - 1];
    expect(paint.from).toBeLessThanOrEqual(SCARE.paint + 0.5);
    expect(paint.to).toBeGreaterThanOrEqual(SCARE.painted);
    expect(scareShot(SCARE.painted, home)).toEqual(scareShot(SCARE.paint + 1, home));
    // Looking at the middle of her, the easel and you.
    const { look } = paint.shot;
    for (const p of [EASEL, SITTING.her, SITTING.you]) expect(Math.hypot(look.x - p.x, look.z - p.z)).toBeLessThan(1.8);
  });
  it('has her finish the picture before the scene ends', () => {
    expect(SCARE.paint).toBeLessThan(SCARE.painted);
    expect(SCARE.painted).toBeLessThan(SCARE.done);
  });
});

describe("drawn to the coffin from across her bedchamber (11 Nov: 'if you're on the other side of the room, there's nothing really pushing you in that direction')", () => {
  const CH = PLAN.rooms[2], coffinStop = TOUR.findIndex((s) => s.id === 'coffin');
  it('has her lead you to it once she has shown you into the bedchamber, till you have woken him', () => {
    expect(leading(coffinStop - 1, false)).toBe(false);   // (not before the bedchamber)
    expect(leading(coffinStop, false)).toBe(true);
    expect(leading(TOUR.length, false)).toBe(true);       // (still, after "don't open it")
    expect(leading(TOUR.length, true)).toBe(false);
  });
  it('takes her to the coffin from anywhere in the room, to stand beside it, not in your way', () => {
    for (const [x, z] of [[CH.x0 + 0.6, 2.4], [CH.x1 - 0.6, 2.4], [CH.x0 + 1, -3], [(CH.x0 + CH.x1) / 2, 0]]) {
      expect(hostTarget({ x: CH.x0 + 3, z: 1 }, { x, z }, LEAD), `you at ${x - CH.x0}, ${z}`).toMatchObject(LEAD.stand);
    }
    expect(walkable(PLAN, LEAD.stand.x, LEAD.stand.z)).toBe(true);
    expect(atCoffin(LEAD.stand.x, LEAD.stand.z)).toBe(false);
    for (const b of blocksOf(FURNISH)) expect(Math.hypot(LEAD.stand.x - b.x, LEAD.stand.z - b.z)).toBeGreaterThan(b.r + 0.3);
    // Out in the gallery, she walks with you instead.
    expect(hostTarget({ x: CH.x0 + 3, z: 1 }, { x: CH.x0 - 4, z: 0 }, LEAD)).not.toMatchObject(LEAD.stand);
  });
  it('beckons you over in her own words, and the coffin stirs now and then', () => {
    expect(BECKON.some((l) => /have a look at the Count/.test(l))).toBe(true);
    expect(LURE.rattle[0]).toBeGreaterThan(2); expect(LURE.rattle[1]).toBeLessThan(12);
    expect(LURE.beckon[0]).toBeGreaterThan(4);
  });
  it('lights a candle beside it', () => {
    expect(FURNISH.some((p) => p.kind === 'candelabra' && Math.hypot(p.x - COFFIN.x, p.z - COFFIN.z) < 1.2)).toBe(true);
  });
});
