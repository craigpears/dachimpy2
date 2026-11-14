/* Affame's house, the Sweet Spot (14 Nov: "The dame of everlasting sweetness things I made for Affame to show in
   her little house XD"; 11 Nov: "I have dubbed her the queen of sweetness so she can have a nice kind peaceful
   role somewhere"). */
import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PLAN, ARRIVE, FURNISH, TEDDIES, PICTURES, heightOf, pictureLine, SIGN, TOUR, stopAt, NOOK, SINK, atNook, sunk, BACK, heapTop } from '../src/den-affame';
import { houseById, houseList, walkable, atWayOut, step, blocksOf } from '../src/den-houses';
import { AT_THE_DOOR, TOUR_LINES, ON_A_PICTURE, IN_THE_CUSHIONS, CHATTER, GOODBYE } from '../src/lines/affame';
import { IN_AFFAMES_HOUSE } from '../src/lines/you';
import { furnitureSource } from './furniture-files';

const ROOT = join(__dirname, '..');
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');
const ROOM = PLAN.rooms[0];

describe("her house in the district: a little one of her own (14 Nov, 'to show in her little house')", () => {
  it('is on the list by her name, a cottage, with its own scene in the house shell', () => {
    expect(houseById('affame')).toMatchObject({ owner: 'Affame', kind: 'Cottage' });
    expect(houseList().map((h) => h.owner)).toContain('Affame');
    expect(read('js', 'den', 'house.js')).toMatch(/affame: AFFAME_HOUSE/);
  });

  it('is small: one room', () => {
    expect(PLAN.rooms).toHaveLength(1);
    expect((ROOM.x1 - ROOM.x0) * (ROOM.z1 - ROOM.z0)).toBeLessThan(80);
  });

  it('lets you in at the door, walk along her wall of pictures, and out again', () => {
    expect(walkable(PLAN, ARRIVE.you.x, ARRIVE.you.z)).toBe(true);
    expect(walkable(PLAN, ARRIVE.her.x, ARRIVE.her.z)).toBe(true);
    expect(atWayOut(PLAN, ARRIVE.you.x, ARRIVE.you.z + 0.3)).toBe(true);
    const B = blocksOf(FURNISH);
    let x = ROOM.x0 + 0.5, z = 0;
    for (let i = 0; i < 400 && x < ROOM.x1 - 0.5; i++) [x, z] = step(PLAN, x, z, x + 0.05, z, B);
    expect(x).toBeGreaterThanOrEqual(ROOM.x1 - 0.51);
  });

  it('places only pieces the shared modules make (furniture.js, cuddly.js), each in her room', () => {
    const shared = furnitureSource() + read('js', 'den', 'cuddly.js');   // (the furniture a piece a file: js/den/furniture/)
    for (const p of FURNISH) {
      expect(shared, p.kind).toMatch(new RegExp(`export (function|const) ${p.kind}\\b`));
      expect(p.x > ROOM.x0 && p.x < ROOM.x1 && p.z > ROOM.z0 && p.z < ROOM.z1, `${p.kind} at ${p.x},${p.z}`).toBe(true);
    }
    expect(read('js', 'den', 'cuddly.js')).toMatch(/export const CUDDLY = \{[^}]*\bcushions\b[^}]*\bteddy\b/);
    // (her cushions and her big teddy you walk round)
    expect(blocksOf(FURNISH.filter((p) => p.kind === 'cushions' || p.kind === 'teddy'))).toHaveLength(2);
  });

  it('has teddies (and a bunny) on her cushions, as in her picture "Cushions and Teddies"', () => {
    expect(TEDDIES.length).toBeGreaterThanOrEqual(3);
    expect(TEDDIES.some((t) => t.kind === 'bunny')).toBe(true);
    for (const t of TEDDIES) expect(Math.hypot(t.x - NOOK.x, t.z - NOOK.z)).toBeLessThan(0.8);
  });
});

describe("the four pictures Dachimpy made her (14 Nov: the Dame, the cushions and teddies, 'Sweetness War', 'Sweetness Index: off the charts!')", () => {
  it('hangs all four on her back wall, each its own shape, none overlapping, inside the room', () => {
    expect(PICTURES.map((p) => p.id).sort()).toEqual(['cushions', 'dame', 'index', 'war']);
    const sorted = [...PICTURES].sort((a, b) => a.x - b.x);
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i], frame = 0.12;
      expect(p.x - p.w / 2 - frame).toBeGreaterThan(ROOM.x0 + 0.2);
      expect(p.x + p.w / 2 + frame).toBeLessThan(ROOM.x1 - 0.2);
      if (i) expect(sorted[i - 1].x + sorted[i - 1].w / 2 + frame).toBeLessThan(p.x - p.w / 2 - frame);
      expect(heightOf(p) / p.w).toBeCloseTo(p.px[1] / p.px[0], 5);
    }
    // (her sign over her knighting, clear of its frame)
    const dame = PICTURES.find((p) => p.id === 'dame')!;
    expect(dame.y + heightOf(dame) / 2 + 0.12).toBeLessThan(SIGN.y - SIGN.h / 2);
    expect(SIGN.x).toBe(dame.x);
    expect(BACK).toBeCloseTo(ROOM.z0 + 0.2);
  });

  it('publishes each as a picture for the web, under 400 KB, its sources kept in notes/affame/', () => {
    for (const p of PICTURES) {
      expect(p.file).toMatch(/^houses\/affame\/\d-[a-z-]+\.jpg$/);
      expect(statSync(join(ROOT, p.file)).size).toBeLessThan(400 * 1024);
    }
    expect(read('.assetsignore')).toMatch(/^notes$/m);
  });

  it('has Affame say something of each, in her own sweet voice', () => {
    for (const p of PICTURES) expect(pictureLine(p.id), p.id).toBe(ON_A_PICTURE[p.id]);
    expect(pictureLine('nothing')).toBeNull();
    expect(ON_A_PICTURE.dame).toMatch(/Dame of Everlasting Sweetness/);
    expect(ON_A_PICTURE.index).toMatch(/[Oo]ff the charts/);
    expect(SIGN.text).toMatch(/Queen of Sweetness/);
  });
});

describe('her tour, and sinking into her cushions (a kind thing to do, as a hug or an ear rub is next door)', () => {
  it('says each stop once you come to it, and skips on if you walk ahead', () => {
    expect(TOUR.map((s) => s.id)).toEqual(['wall', 'nook']);
    for (const s of TOUR) {
      expect(TOUR_LINES[s.id].length).toBeGreaterThan(0);
      expect(walkable(PLAN, s.at.x, s.at.z)).toBe(true);
      expect(walkable(PLAN, s.her.x, s.her.z)).toBe(true);
    }
    expect(stopAt(0, TOUR[1].at.x, TOUR[1].at.z)).toBe(1);
    expect(stopAt(0, 0, 2.4)).toBe(-1);
  });

  it('lets you reach her cushions from her room, standing clear of the heap', () => {
    const B = blocksOf(FURNISH);
    let x = 0, z = 0;
    for (let i = 0; i < 400; i++) [x, z] = step(PLAN, x, z, x + (NOOK.x - x) * 0.05, z + (NOOK.z - z) * 0.05, B);
    expect(atNook({ x, z })).toBe(true);
    expect(atNook(ARRIVE.you)).toBe(false);
  });

  it('sinks you deep into them, sat in the heap, and brings you up again by the end', () => {
    expect(SINK.depth).toBeGreaterThan(heapTop(SINK.at.x, SINK.at.z));   // (your legs in the cushions)
    expect(sunk(0)).toBeCloseTo(0);
    expect(sunk(SINK.secs / 2)).toBeCloseTo(SINK.depth);
    expect(sunk(SINK.secs)).toBeCloseTo(0);
    expect(SINK.said).toBeLessThan(SINK.secs);
    expect(Math.hypot(SINK.at.x - NOOK.x, SINK.at.z - NOOK.z)).toBeLessThan(0.75);
    expect(IN_AFFAMES_HOUSE.sunk).toBeTruthy();
    expect(IN_THE_CUSHIONS.again.length).toBeGreaterThan(1);
  });

  it('keeps her kind and sweet: no unkind words in anything she says', () => {
    const all = [AT_THE_DOOR.first, AT_THE_DOOR.again, ...Object.values(TOUR_LINES).flat(), ...Object.values(ON_A_PICTURE), IN_THE_CUSHIONS.first, ...IN_THE_CUSHIONS.again, ...CHATTER, GOODBYE];
    for (const l of all) expect(l, l).not.toMatch(/\b(stupid|idiot|shut up|hate|ugly)\b/i);
  });
});

describe('a link straight in, to send her (den.html?at=affame)', () => {
  it('opens her house by its id', () => {
    expect(read('js', 'den', 'menus.js')).toMatch(/else if \(houseById\(at\)\) toHouse\(at\)/);
    expect(houseById('affame')).not.toBeNull();
  });
});
