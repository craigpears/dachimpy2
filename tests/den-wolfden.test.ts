import { describe, expect, it } from 'vitest';
import { BOARDS, MOON, Moon, layBoard, playStep, atTable, TABLE, ARRIVE, boardsOf, cuesOn, isCue, stageCues } from '../src/den-wolfden';
import { linesOf, denPoints, needsCombo, DEN } from '../src/navigation';
import { WOLF_DEN_TUTORIAL, wolfShows, MECHANICS, nextStep } from '../src/wolf-den-tutorial';
import { LESSON } from '../src/lines/multibella';
import { SECTIONS, findPart } from '../src/tutorial';
import { HOUSES, houseById, houseList } from '../src/den-houses';
import { seeded } from '../src/mirror-row';
import { LAY, Sea } from '../src/den-sail';
import { multibellaAt, multibellaLandingSquares, multibellaMooring, onMultibellaLanding } from '../src/den-multibella';

// The wolf den, a first version (14 Nov: "build the building, the at least do a first version of it"), Multibella's
// tutorial (asked for by Dignity) of "the 4-tier duty nav in the werewolf den".
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

// The deeper mechanics, each a step of her lesson on a real board (the user, 15 Nov, after playing the basics: the
// cascade and the wild target it makes, constellations and the new ring, filling one with a cascade's last clear, and
// Umami's evil constellation).
const kinds = (m: ReturnType<typeof playStep>) => m.stages.filter((s) => s.kind === 'line' || s.kind === 'constellation').map((s) => s.kind);
describe('15 Nov: Multibella demonstrates the deeper mechanics, each on a real board', () => {
  it('a cascade: Single +3, Double +6, Triple +9 in one move, lines only, its combo clears turning slots wild', () => {
    const { results: [m], game } = played('cascade');
    expect(kinds(m)).toEqual(['line', 'line', 'line']);
    const lines = m.stages.filter((s) => s.kind === 'line');
    expect(lines.map((s, i) => s.cleared.length * (i + 1))).toEqual([3, 6, 9]);
    expect(lines[0].wilded ?? []).toEqual([]);
    expect(lines[1].wilded?.length).toBeGreaterThan(0);
    expect(m.done).toBeNull();
    expect(game.constellation!.marks.filter((k) => k.wild).length).toBeGreaterThanOrEqual(3);
  });

  it('the outer ring: a star dropped onto a full spoke waits up there, rides round with its ring, then drops into the slot when a clear opens under it, charted twice over; and the next constellation goes up three, two and one, its centre wild', () => {
    const { results: [drop, ride, clear], game } = played('outer');
    expect(drop.cleared).toBe(0);
    expect(game.rings).toBe(4);
    const g = layBoard('outer', seeded(4))!;
    playStep(g.game, g.moves[0]);
    expect(g.game.grid[3][1]?.c).toBe(BOARDS.outer.next!.c);
    playStep(g.game, g.moves[1]);
    expect(g.game.grid[3][2]?.c).toBe(BOARDS.outer.next!.c);
    expect(ride.cleared).toBe(0);
    expect(kinds(clear)).toEqual(['line', 'constellation']);
    expect(clear.done!.points).toBe(125 * 2);
    const next = game.constellation!.marks;
    expect([0, 1, 2].map((r) => next.filter((k) => k.ring === r).length)).toEqual([...DEN.PLACES]);
    expect(next.filter((k) => k.ring === 0).every((k) => k.wild)).toBe(true);
  });

  it('the last clear of a cascade charts it: Single, Double (its slot gone wild), Triple Constellation, 125 times three where a line is 3; two clears before it, so the next centre has a fourth wild target', () => {
    const { results: [m], game } = played('lastClear');
    expect(kinds(m)).toEqual(['line', 'line', 'constellation']);
    expect(m.stages.find((s) => s.kind === 'line' && s.wilded?.some((w) => w.ring === 2))).toBeTruthy();
    expect(m.done!.step).toBe(3);
    expect(m.done!.points).toBe(375);
    expect(m.done!.points / 3).toBeGreaterThan(100);
    expect(game.constellation!.marks.filter((k) => k.ring === 0 && k.wild).length).toBe(DEN.WILD_MORE);
  });

  it("Umami's evil constellation: six reds round the centre need a combo; a star at a time, the fifth makes a line and they go; by the combo, both reds land at once and it's charted on the second step", () => {
    expect(boardsOf('evilTry')).toEqual(['evilTry', 'evil']);
    expect(needsCombo(BOARDS.evil.marks)).toBe(true);
    const t = played('evilTry');
    expect(kinds(t.results[0])).toEqual(['line']);
    expect(t.results[0].cleared).toBe(5);
    expect(t.results[0].done).toBeNull();
    const e = played('evil');
    expect(kinds(e.results[0])).toEqual(['line', 'constellation']);
    expect(e.results[0].done!.points).toBe(denPoints(BOARDS.evil.marks) * 2);
  });

  it("her lesson's steps are the mechanics in order, each a ready part shown by moves on its board, the last with no next", () => {
    expect(MECHANICS).toEqual(['cascade', 'rings', 'chains', 'evil']);
    for (const id of MECHANICS) {
      const f = findPart(WOLF_DEN_TUTORIAL, id)!;
      expect(f.part.todo, id).toBeUndefined();
      expect(f.part.shows.kind, id).toBe('moves');
    }
    expect(nextStep('cascade')?.id).toBe('rings');
    expect(nextStep('evil')).toBeNull();
    expect(nextStep('moon')).toBeNull();
    expect(WOLF_DEN_TUTORIAL.choices.find((c) => c.id === 'mechanics')?.covers).toEqual(MECHANICS);
  });

  it('every line she has for a board is said on it: each of its cues comes as the board plays; and every board she plays has words', () => {
    for (const [name, words] of Object.entries(LESSON)) {
      expect(BOARDS[name], name).toBeDefined();
      const on = cuesOn(name, seeded(4));
      for (const cue of Object.keys(words)) {
        expect(isCue(cue), `${name}: ${cue}`).toBe(true);
        expect(on.has(cue), `${name}: ${cue} never comes`).toBe(true);
      }
    }
    for (const name of ['cascade', 'outer', 'lastClear', 'evilTry', 'evil']) expect((LESSON as Record<string, Record<string, string>>)[name]?.set, name).toBeTruthy();
  });

  it('each plan rings places on the board', () => {
    for (const [name, L] of Object.entries(BOARDS)) for (const p of L.plan ?? []) {
      expect(p.ring, name).toBeLessThan(4);
      expect(p.spoke, name).toBeLessThan(8);
    }
    expect(stageCues({ kind: 'constellation', wilded: [] }, 3)).toEqual(['step3', 'chart']);
    expect(stageCues({ kind: 'line', wilded: [{ ring: 0, spoke: 1, colour: 0 }] }, 2)).toEqual(['step2', 'wild']);
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
    expect(houseById('wolfden')?.owner).toBe('Multibella');
    expect(houseList().map((h) => h.id)).not.toContain('wolfden');
    expect(HOUSES.filter((h) => !h.away).length).toBe(houseList().length);
  });
  it('you come in away from the table, and walk up to it to chart', () => {
    expect(atTable(ARRIVE.you)).toBe(false);
    expect(atTable({ x: TABLE.x, z: TABLE.z + TABLE.r + 0.5 })).toBe(true);
  });
});

describe('its tutorial, in the shape every tutorial shares', () => {
  it('has every section, Multibella teaching (14 Nov: "Thought the plan was for her to do the wolf den tutorial"), and every ready part shown by one of the lesson\'s boards', () => {
    expect(WOLF_DEN_TUTORIAL.teacher).toBe('Multibella');
    for (const s of SECTIONS) for (const p of WOLF_DEN_TUTORIAL[s]) {
      if (p.todo) continue;
      expect(wolfShows(p.shows.ref), p.id).not.toBeNull();
    }
    expect(findPart(WOLF_DEN_TUTORIAL, 'trapdoor')?.section).toBe('tricks');
  });
});

describe('Multibella\'s island (14 Nov: "would expect her to have her own island similar to others")', () => {
  it('is land on the sea, with two squares of open water at least to any rock or island, on any sea', () => {
    for (const seed of [1, 9, 42, 77]) {
      const s = new Sea(seed), own = new Set(LAY.MULTIBELLA.LAND.map(([c, r]) => `${c},${r}`));
      for (const [c, r] of LAY.MULTIBELLA.LAND) expect(s.open(c, r), `${c},${r}`).toBe(false);
      for (const [c, r] of LAY.MULTIBELLA.LAND) for (let dc = -2; dc <= 2; dc++) for (let dr = -2; dr <= 2; dr++) {
        const x = c + dc, y = r + dr;
        if (own.has(`${x},${y}`) || x < 0 || y < 0 || x >= s.cols) continue;
        expect(s.open(x, y), `seed ${seed}: ${x},${y} beside it`).toBe(true);
        expect(s.windAt(x, y), `seed ${seed}: a wind at ${x},${y}`).toBeUndefined();
      }
    }
  });
  it('goes ashore from its landing, water only, where she\'s moored while you\'re in the hut', () => {
    expect(multibellaLandingSquares().length).toBeGreaterThan(4);
    for (const [c, r] of multibellaLandingSquares()) expect(multibellaAt(c, r)).toBe(false);
    const m = multibellaMooring();
    expect(onMultibellaLanding(m.c, m.r)).toBe(true);
    expect(onMultibellaLanding(LAY.MULTIBELLA.LAND[0][0], LAY.MULTIBELLA.LAND[0][1])).toBe(false);
  });
});

describe('its read version, wolf-den-guide.html, kept in sync with the lesson (15 Nov)', () => {
  it('has an article for every ready part, showing the same board the lesson plays', async () => {
    const { readFileSync } = await import('node:fs');
    const html = readFileSync(new URL('../wolf-den-guide.html', import.meta.url), 'utf8');
    for (const s of SECTIONS) for (const p of WOLF_DEN_TUTORIAL[s]) {
      if (p.todo) continue;
      const m = html.match(new RegExp(`<article id="${p.anchor ?? p.id}" data-(board|moves)="([A-Za-z]+)"`));
      expect(m, p.id).not.toBeNull();
      expect([m![1], m![2]], p.id).toEqual([p.shows.kind, p.shows.ref]);
    }
  });
});
