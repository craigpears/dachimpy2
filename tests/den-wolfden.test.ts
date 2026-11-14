import { describe, expect, it } from 'vitest';
import { BOARDS, MOON, Moon, layBoard, playStep, atTable, TABLE, ARRIVE } from '../src/den-wolfden';
import { linesOf, denPoints } from '../src/navigation';
import { WOLF_DEN_TUTORIAL, wolfShows } from '../src/wolf-den-tutorial';
import { SECTIONS, findPart } from '../src/tutorial';
import { HOUSES, houseById, houseList } from '../src/den-houses';
import { seeded } from '../src/mirror-row';

// The wolf den, a first version (14 Nov: "build the building, the at least do a first version of it"), Dignity's
// tutorial of "the 4-tier duty nav in the werewolf den".
const played = (name: string) => {
  const b = layBoard(name, seeded(4))!;
  return { ...b, results: b.moves.map((s) => playStep(b.game, s)) };
};

describe('the lesson\'s boards each do what their part says', () => {
  it('every board lies still and lineless as laid, on four rings', () => {
    for (const name of Object.keys(BOARDS)) {
      const { game } = layBoard(name)!;
      expect(game.rings, name).toBe(4);
      expect(linesOf(game.grid), name).toEqual([]);
      expect(game.fall(), `${name}: a star with nothing under it`).toBe(false);
    }
  });

  it('the run in the screenshots: Single +3, Double +6, then the constellation, wild beside the Double, on step 3', () => {
    const { results: [m] } = played('run');
    const lines = m.stages.filter((s) => s.kind === 'line');
    expect(lines.map((s) => s.cleared.length)).toEqual([3, 3]);
    expect(lines[1].wilded?.length).toBe(1);
    expect(m.done?.step).toBe(3);
  });

  it('the Trapdoor clears, then charts (twice its points); the Echo charts, then clears; both deal the next with its centre wild', () => {
    const t = played('trapdoor'), e = played('echo');
    expect(t.results[0].stages.map((s) => s.kind).filter((k) => k === 'line' || k === 'constellation')).toEqual(['line', 'constellation']);
    expect(t.results[0].done!.points).toBe(denPoints(t.results[0].done!.marks) * 2);
    expect(e.results[0].stages.map((s) => s.kind).filter((k) => k === 'line' || k === 'constellation')).toEqual(['constellation', 'line']);
    for (const g of [t.game, e.game]) expect(g.constellation!.marks.filter((m) => m.ring === 0).every((m) => m.wild)).toBe(true);
  });

  it('the four rings\' board shows the den\'s first constellation: 3 in the centre, 1 in the middle', () => {
    const { game } = layBoard('rings')!;
    expect(game.constellation!.marks.map((m) => m.ring).sort()).toEqual([0, 0, 0, 1]);
    expect(denPoints(game.constellation!.marks)).toBe(71);
  });
});

describe('the moon (the Wolf Dens Guide: about 200 charted points a werewolf; each chart takes its points off)', () => {
  it('wanes with each chart, turning werewolves back, saying when it\'s half the pack and the last', () => {
    const m = new Moon(4);
    expect(m.full).toBe(4 * MOON.PER_WOLF);
    expect(m.werewolves()).toBe(4);
    expect(m.chart(150)).toEqual({ turned: 0, half: false, last: false });
    expect(m.chart(250)).toEqual({ turned: 2, half: true, last: false });
    expect(m.werewolves()).toBe(2);
    expect(m.chart(1000)).toEqual({ turned: 2, half: false, last: true });
    expect(m.share()).toBe(0);
    m.rise();
    expect(m.werewolves()).toBe(4);
  });
});

describe('the hut', () => {
  it('is a place of its own on the house shell, not in the housing district\'s list (den.html?at=wolfden)', () => {
    expect(houseById('wolfden')?.owner).toBe('Dignity');
    expect(houseList().map((h) => h.id)).not.toContain('wolfden');
    expect(HOUSES.filter((h) => !h.away).length).toBe(houseList().length);
  });
  it('you come in away from the table, and walk up to it to chart', () => {
    expect(atTable(ARRIVE.you)).toBe(false);
    expect(atTable({ x: TABLE.x, z: TABLE.z + TABLE.r + 0.5 })).toBe(true);
  });
});

describe('its tutorial, in the shape every tutorial shares', () => {
  it('has every section, Dignity teaching, and every ready part shown by one of the lesson\'s boards', () => {
    expect(WOLF_DEN_TUTORIAL.teacher).toBe('Dignity');
    for (const s of SECTIONS) for (const p of WOLF_DEN_TUTORIAL[s]) {
      if (p.todo) continue;
      expect(wolfShows(p.shows.ref), p.id).not.toBeNull();
    }
    expect(findPart(WOLF_DEN_TUTORIAL, 'trapdoor')?.section).toBe('tricks');
  });
});
