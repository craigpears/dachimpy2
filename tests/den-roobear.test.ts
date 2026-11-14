/* Roobear's house, her ROOm (13 Nov: "I want her thing in there so I can show it to her ... she was really
   cute ... a really sweet interaction, and I wanted to commemorate it ... So maybe just do the small house"). */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLAN, ARRIVE, FURNISH, GUESSES, guessLine, SIGN, TOUR, stopAt, RUB, RUB_BEATS, rubSpot, robertBy, atRobert, TABLE, MONSIEUR, BYSTANDER } from '../src/den-roobear';
import { houseById, houseList, walkable, atWayOut, step, blocksOf, BACKDROPS, lookingAt, lookView, viewAt, LOOK_HOME, remark, GAZE_START } from '../src/den-houses';
import type { View, Gaze } from '../src/den-houses';
import { AT_THE_DOOR, ROBERT, TOUR_LINES, ON_A_GUESS } from '../src/lines/roobear';
import { furnitureIds } from './furniture-files';

const ROOT = join(__dirname, '..');
const LOOK_JS = readFileSync(join(ROOT, 'js', 'den-look.js'), 'utf8').replace(/\r\n/g, '\n');
const FURNITURE_IDS = furnitureIds();
const partsOf = (slot: string) => {
  const m = LOOK_JS.match(new RegExp(`\\n  ${slot}: \\{\\n    m: \\[([\\s\\S]*?)\\],\\n    f: \\[([\\s\\S]*?)\\],\\n  \\}`))!;
  return [...(m[1] + m[2]).matchAll(/\['([a-z]+)'/g)].map((x) => x[1]);
};
const ROOM = PLAN.rooms[0];

describe("her house in the district: a small one of her own (RULES.md, 'Every pirate their own house')", () => {
  it('is on the list by her name, a cottage she calls her ROOm', () => {
    expect(houseById('roobear')).toMatchObject({ owner: 'Roobear', kind: 'Cottage' });
    expect(houseById('roobear')!.name).toMatch(/ROOm/);
    expect(houseList().map((h) => h.owner)).toContain('Roobear');
    expect(readFileSync(join(ROOT, 'js', 'den', 'house.js'), 'utf8')).toMatch(/roobear: ROOBEAR_HOUSE/);
  });

  it('is small: one room', () => {
    expect(PLAN.rooms).toHaveLength(1);
    expect((ROOM.x1 - ROOM.x0) * (ROOM.z1 - ROOM.z0)).toBeLessThan(80);
  });

  it('lets you in at the door, walk the length of her wall of guesses, and out again', () => {
    expect(walkable(PLAN, ARRIVE.you.x, ARRIVE.you.z)).toBe(true);
    expect(atWayOut(PLAN, ARRIVE.you.x, ARRIVE.you.z + 0.3)).toBe(true);
    const B = blocksOf(FURNISH);
    let x = ROOM.x0 + 0.5, z = ROOM.z0 + 0.8;
    for (let i = 0; i < 400 && x < ROOM.x1 - 0.5; i++) [x, z] = step(PLAN, x, z, x + 0.05, z, B);
    expect(x).toBeGreaterThanOrEqual(ROOM.x1 - 0.51);
    for (const p of [ARRIVE.her, ARRIVE.robert]) expect(walkable(PLAN, p.x, p.z)).toBe(true);
  });

  it('places only furniture the shared furniture module makes, each in her room, and her sign', () => {
    for (const p of FURNISH) {
      expect(FURNITURE_IDS, p.kind).toContain(p.kind);
      expect(p.x > ROOM.x0 && p.x < ROOM.x1 && p.z > ROOM.z0 && p.z < ROOM.z1, `${p.kind} at ${p.x},${p.z}`).toBe(true);
    }
    expect(FURNITURE_IDS).toContain('sign');
    expect(SIGN.text).toMatch(/ROOm/);
  });
});

describe("the gallery of guesses at her name (12 Nov: 'all the interpretations of the guesses of her name. Or is she the Roobear that roobs ears? You need that.')", () => {
  it('hangs every guess, each a portrait of her in her own look, in clothes the wardrobe has', () => {
    expect(GUESSES.map((g) => g.id)).toEqual(['robert', 'rooBear', 'answer', 'roobed', 'books']);
    const slots: Record<string, string[]> = { hat: partsOf('hat'), hair: partsOf('hair'), top: partsOf('top'), legs: partsOf('legs'), feet: partsOf('feet'), hand: partsOf('hand'), fam: partsOf('fam') };
    for (const g of GUESSES) {
      expect(g.sitter).toMatchObject({ who: 'pirate', name: 'Roobear' });
      expect(BACKDROPS).toContain(g.backdrop);
      const s = g.sitter.who === 'pirate' ? g.sitter : null;
      for (const d of [s?.dress ?? {}, ...(s?.company ?? []).map((c) => c.look ?? {})]) {
        for (const [k, v] of Object.entries(d)) if (slots[k]) expect(slots[k], `${g.id}: ${k} ${v}`).toContain(v);
      }
    }
    for (const [k, v] of Object.entries({ ...MONSIEUR, ...BYSTANDER })) if (slots[k]) expect(slots[k], `${k} ${v}`).toContain(v);
  });

  it('makes her answer the biggest frame, in the middle, Robert roobing her ear', () => {
    const answer = GUESSES.find((g) => g.id === 'answer')!;
    for (const g of GUESSES) if (g !== answer) expect(answer.w * answer.h).toBeGreaterThan(g.w * g.h);
    expect(answer.x).toBe(0);
    expect(answer.title).toBe('Robert the Kangaroo Bear that Roobs Ears');
    expect(answer.sitter.who === 'pirate' && answer.sitter.company?.[0]).toMatchObject({ kind: 'robert', pose: 'rub' });
  });

  it('hangs them along her back wall without overlapping, inside the room', () => {
    const G = [...GUESSES].sort((a, b) => a.x - b.x);
    for (let i = 1; i < G.length; i++) expect(G[i].x - G[i].w / 2 - 0.25).toBeGreaterThan(G[i - 1].x + G[i - 1].w / 2);
    for (const g of G) { expect(g.x - g.w / 2).toBeGreaterThan(ROOM.x0 + 0.3); expect(g.x + g.w / 2).toBeLessThan(ROOM.x1 - 0.3); }
    const big = GUESSES.find((g) => g.id === 'answer')!;
    expect(SIGN.y - SIGN.h / 2).toBeGreaterThan(big.y + big.h / 2 + 0.11);
  });

  it("has Roobear tell you whose guess each was: Dachimpy's three, Dignity's, and her own", () => {
    for (const g of GUESSES) expect(guessLine(g.id), g.id).toBe(ON_A_GUESS[g.id]);
    for (const id of ['robert', 'rooBear', 'roobed'] as const) expect(ON_A_GUESS[id]).toMatch(/Dachimpy/);
    expect(ON_A_GUESS.books).toMatch(/Dignity/);
    expect(ON_A_GUESS.answer).toMatch(/mine/i);
    expect(guessLine('nobody')).toBeNull();
    for (const g of GUESSES) expect(guessLine(g.id)!.length).toBeLessThan(110);   // (a bubble)
  });

  it('she talks about the guess you stop by (13 Nov)', () => {
    const exhibits = GUESSES.map((g) => ({ id: g.id, x: g.x, y: g.y, z: ROOM.z0 + 0.2 }));
    for (const g of GUESSES) {
      const you = { x: g.x, z: ROOM.z0 + 1.0 };
      const v: View = lookView({ look: { x: you.x, y: 0.85, z: you.z - 1.2 }, dist: 9, tilt: 0.7, yaw: 0 }, you, LOOK_HOME, ROOM, 3.8);
      const cam = viewAt(v), dir = { x: v.look.x - cam.x, y: v.look.y - cam.y, z: v.look.z - cam.z };
      expect(lookingAt(exhibits, you, cam, dir)?.id, g.id).toBe(g.id);
      let G: Gaze = GAZE_START;
      const said: string[] = [];
      for (let t = 0; t < 3; t += 0.1) { const r = remark(G, g.id, 0.1, true, true, guessLine); G = r.gaze; if (r.say) said.push(r.say); }
      expect(said).toEqual([ON_A_GUESS[g.id]]);
    }
  });
});

describe('her tour', () => {
  it('has her lines for every stop, each somewhere you can stand', () => {
    for (const s of TOUR) {
      expect(TOUR_LINES[s.id].length, s.id).toBeGreaterThan(0);
      expect(walkable(PLAN, s.at.x, s.at.z), `${s.id} at`).toBe(true);
      expect(walkable(PLAN, s.her.x, s.her.z), `${s.id} her`).toBe(true);
    }
    expect(stopAt(0, TOUR[1].at.x, TOUR[1].at.z)).toBe(1);
    expect(stopAt(2, TOUR[0].at.x, TOUR[0].at.z)).toBe(-1);
    expect(Math.hypot(TOUR[1].at.x - TABLE.x, TOUR[1].at.z - TABLE.z)).toBeLessThan(1.5);
  });

  it("says ROOm at the door, her own joke ('a ROOm you mean? xD')", () => {
    expect(AT_THE_DOOR.first).toMatch(/ROOm/);
  });
});

describe('Robert the kangaroo bear roobs your ear as the welcome', () => {
  it('stands beside you to do it, facing you (a little to the front), wherever you are, never in a wall or the furniture', () => {
    const B = blocksOf(FURNISH);
    for (const you of [ARRIVE.you, { x: ROOM.x0 + 0.4, z: 0 }, { x: ROOM.x1 - 0.4, z: 0 }, { x: TABLE.x + 0.9, z: TABLE.z }]) {
      const r = rubSpot(PLAN, you, B);
      expect(Math.hypot(r.x - you.x, r.z - you.z)).toBeCloseTo(RUB.side, 5);
      // facing you
      const want = Math.atan2(you.x - r.x, you.z - r.z);
      expect(Math.abs(Math.atan2(Math.sin(r.yaw - want), Math.cos(r.yaw - want)))).toBeLessThanOrEqual(RUB.turn + 1e-6);
    }
    const at = rubSpot(PLAN, ARRIVE.you, B);
    expect(walkable(PLAN, at.x, at.z)).toBe(true);
  });

  it('keeps by her, on her far side from you, never under your feet', () => {
    for (const [her, you] of [[{ x: 1, z: 0 }, { x: 0, z: 0.5 }], [{ x: -1, z: 0 }, { x: 0, z: 0.5 }]]) {
      const r = robertBy(her, you);
      expect(Math.hypot(r.x - you.x, r.z - you.z)).toBeGreaterThan(Math.hypot(her.x - you.x, her.z - you.z));
    }
  });

  it('is asked for another when you walk up to him', () => {
    expect(atRobert({ x: 0, z: 0 }, { x: 0.8, z: 0.4 })).toBe(true);
    expect(atRobert({ x: 0, z: 0 }, { x: 2, z: 0 })).toBe(false);
    expect(RUB_BEATS.said).toBeLessThan(RUB_BEATS.done);
    expect(ROBERT.hello).toMatch(/roobs ears/);
  });
});

describe('Roobear in the wardrobe, as her portrait is described (IDEAS.md, 12 Nov)', () => {
  it('in deep purple, her black hair pinned up, a wreath of purple roses with gold leaves, a hook, blueberries, a pale periwinkle crow', () => {
    const her = LOOK_JS.match(/\n {2}Roobear: \{([\s\S]*?)\n {2}\},/)![1];
    expect(her).toMatch(/hair: 'pinned', hairCol: 'black'/);
    expect(her).toMatch(/hat: 'roses', hatCol: 'purple', hatCol2: 'gold'/);
    expect(her).toMatch(/top: 'strapless', topCol: 'purple'/);
    expect(her).toMatch(/legs: 'flare', legsCol: 'purple'/);
    expect(her).toMatch(/hook: true/);
    expect(her).toMatch(/earring: true/);
    expect(her).toMatch(/patch: false/);
    expect(her).toMatch(/hand: 'blueberries'/);
    expect(her).toMatch(/fam: 'crow', famCol: 'atlantean'/);
    for (const [slot, id] of [['hair', 'pinned'], ['top', 'strapless'], ['hand', 'blueberries'], ['fam', 'crow'], ['hat', 'beret']]) expect(partsOf(slot)).toContain(id);
  });
});

describe('a link straight in, to send her (den.html?at=roobear)', () => {
  it('opens any house in the district by its id', () => {
    const menus = readFileSync(join(ROOT, 'js', 'den', 'menus.js'), 'utf8');
    expect(menus).toMatch(/else if \(houseById\(at\)\) toHouse\(at\)/);
    expect(houseById('roobear')).not.toBeNull();
  });
});
