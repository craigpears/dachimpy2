/* The housing district (11 Nov: "you have like the areas of houses and you have the enter a house stuff and
   you can choose whose house to go into ... a nice way of adding other friends in later"). */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { HOUSES, houseById, houseList, LODGINGS, atLodgings, walkable, step, roomAt, atWayOut, PAD, cleanSittings, sat, SITTINGS_KEY, plaqueDate, snapshotName } from '../src/den-houses';
import type { Plan } from '../src/den-houses';

const ROOT = join(__dirname, '..');
const BOX: Plan = {
  rooms: [{ id: 'a', name: 'A', x0: 0, x1: 4, z0: 0, z1: 4 }, { id: 'b', name: 'B', x0: 4, x1: 8, z0: 0, z1: 4 }],
  doors: [{ x0: 3.5, x1: 4.5, z0: 1.5, z1: 2.5 }],
  out: { x: 2, z: 3.6, r: 0.8 },
};

describe('the district lists its houses by owner, as Puzzle Pirates did', () => {
  it("has Gravee's manor, Bedside Manors, by its real name", () => {
    expect(houseById('gravee')).toMatchObject({ owner: 'Gravee', name: 'Bedside Manors', kind: 'Manor' });
    expect(houseById('nobody')).toBeNull();
  });

  it('lists them by owner, each id once', () => {
    const L = houseList();
    expect(L.map((h) => h.owner)).toEqual([...L.map((h) => h.owner)].sort((a, b) => a.localeCompare(b)));
    expect(new Set(HOUSES.map((h) => h.id)).size).toBe(HOUSES.length);
  });

  it('gives every house a scene module of its own (adding a friend is an entry and a scene)', () => {
    const shell = readFileSync(join(ROOT, 'js', 'den', 'house.js'), 'utf8');
    for (const h of HOUSES) {
      expect(shell, `house.js's SCENES has ${h.id}`).toMatch(new RegExp(`\\b${h.id}:`));
    }
    expect(readdirSync(join(ROOT, 'js', 'den'))).toContain('gravee-house.js');
  });
});

describe("the district's door, dug into the den's left-hand cliff", () => {
  it('is on the den floor, clear of the shack plot (back left) and the rampart frames (right)', () => {
    expect(LODGINGS.x).toBeLessThan(-7);   // the left-hand side
    expect(LODGINGS.z).toBeGreaterThan(6.9); expect(LODGINGS.z).toBeLessThan(10.5);   // between the hoist's torch and the plot
  });
  it('is knocked at from in front of it, not from across the den', () => {
    expect(atLodgings(LODGINGS.x + 1, LODGINGS.z)).toBe(true);
    expect(atLodgings(0, 8)).toBe(false);
    expect(atLodgings(LODGINGS.x + 1, LODGINGS.z + 3)).toBe(false);
  });
});

describe('walking about a house', () => {
  it('keeps you off the walls, and lets you through a doorway', () => {
    expect(walkable(BOX, 2, 2)).toBe(true);
    expect(walkable(BOX, 0.1, 2)).toBe(false);
    expect(walkable(BOX, 4, 2)).toBe(true);    // in the doorway
    expect(walkable(BOX, 4, 0.6)).toBe(false); // in the wall beside it
    expect(roomAt(BOX, 6, 2)?.id).toBe('b');
  });

  it('slides you along a wall instead of stopping you dead', () => {
    const [x, z] = step(BOX, 2, 2, 2.2, -1);
    expect(x).toBeCloseTo(2.2); expect(z).toBe(2);
  });

  it('walks you round furniture', () => {
    const [x, z] = step(BOX, 1.5, 2, 2, 2, [{ x: 2.2, z: 2, r: 0.4 }]);
    expect(Math.hypot(x - 2.2, z - 2)).toBeGreaterThanOrEqual(0.4 + PAD - 1e-9);
  });

  it('lets you out at the front door', () => {
    expect(atWayOut(BOX, 2, 3.4)).toBe(true);
    expect(atWayOut(BOX, 2, 1)).toBe(false);
  });
});

describe('your portrait on a friend\'s wall, kept in this browser (RULES.md, "Except what people make their own")', () => {
  it('is kept under a carp.den key', () => expect(SITTINGS_KEY).toMatch(/^carp\.den\./));

  it('keeps your look as it was when you sat, and the day', () => {
    const look = { body: 'f', hat: 'pelt', skin: 3 };
    const s = sat({}, 'gravee', look, new Date(2026, 10, 11));
    expect(s.gravee).toEqual({ look, at: '2026-11-11' });
    look.hat = 'none';
    expect(s.gravee.look.hat).toBe('pelt');   // (frozen as you were)
    expect(plaqueDate(s.gravee.at)).toBe('11 Nov 2026');
  });

  it('survives a round trip through storage, and throws away anything odd', () => {
    const s = sat({}, 'gravee', { body: 'm', hat: 'tricorne' }, new Date(2026, 0, 2));
    expect(cleanSittings(JSON.parse(JSON.stringify(s)))).toEqual(s);
    expect(cleanSittings(null)).toEqual({});
    expect(cleanSittings('x')).toEqual({});
    expect(cleanSittings({ nobody: s.gravee })).toEqual({});
    expect(cleanSittings({ gravee: { look: [1], at: '2026-01-02' } })).toEqual({});
    expect(cleanSittings({ gravee: { look: { a: 1 }, at: 'yesterday' } })).toEqual({});
    expect(cleanSittings({ gravee: { look: { a: 1, b: { evil: true } }, at: '2026-01-02' } }).gravee.look).toEqual({ a: 1 });
  });

  it('names a snapshot plainly', () => {
    expect(snapshotName("Cap'n Jo", 'Bedside Manors')).toBe('cap-n-jo-in-bedside-manors.png');
    expect(snapshotName('!!', '')).toBe('in.png');
  });
});
