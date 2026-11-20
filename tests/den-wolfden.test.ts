import { describe, expect, it } from 'vitest';
import { BOARDS, MOON, Moon, layBoard, playStep, planMarks, atTable, TABLE, ARRIVE, boardsOf, cuesOn, isCue, stageCues, OPENING, openingAt } from '../src/den-wolfden';
import { linesOf, denPoints, needsCombo, DEN } from '../src/navigation';
import { WOLF_DEN_TUTORIAL, wolfShows, MECHANICS, QUICK, WALKS, walkOf, walkAt, nextStep, WALK, WALK_BOARD, walkStepOf, endsStep } from '../src/wolf-den-tutorial';
import { LESSON, OPENING as OPENING_LINES, TUTOR } from '../src/lines/multibella';
import { SECTIONS, TutorialMenu, findPart } from '../src/tutorial';
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

  // 20 Nov: "I end up on the Umami's Run thing, which for some reason is still broken down. Like I should be at that
  // top menu first": one lesson, played as soon as it's picked.
  it("how it works is one lesson, Umami's run, a ready part shown by moves on its board; picking it plays it", () => {
    expect(MECHANICS).toEqual(['umamiRun']);
    const f = findPart(WOLF_DEN_TUTORIAL, 'umamiRun')!;
    expect(f.part.todo).toBeUndefined();
    expect(f.part.shows).toEqual({ kind: 'moves', ref: WALK_BOARD });
    expect(nextStep('umamiRun')).toBeNull();
    expect(nextStep('moon')).toBeNull();
    expect(WOLF_DEN_TUTORIAL.choices.find((c) => c.id === 'mechanics')?.covers).toEqual(MECHANICS);
    expect(new TutorialMenu(WOLF_DEN_TUTORIAL).tap(0)).toMatchObject({ kind: 'play', part: { id: 'umamiRun' }, choice: 'mechanics' });
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
    for (const name of ['replay', 'cascade', 'outer', 'lastClear', 'evilTry', 'evil']) expect((LESSON as Record<string, Record<string, string>>)[name]?.set, name).toBeTruthy();
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

// 15 Nov, the user played her lesson: "not what was meant": How it works was to walk through Umami's replay, the
// screenshots of 14 Nov (notes/wolf-den/): Single +3, a Double +6 turning the top target multicoloured, then
// "Triple! Constellation! +213" with four multicoloured targets. Umami's evil constellation "just as like a fun one".
describe("15 Nov: How it works walks through Umami's replay, not the evil constellation", () => {
  it("Umami's board: four targets as in his replay (the orange one top middle holding a blue), worth 71", () => {
    const { game } = layBoard('replay')!;
    const marks = game.constellation!.marks;
    expect(denPoints(marks)).toBe(71);
    const top = marks.find((m) => m.ring === 0 && m.spoke === 0)!;
    expect(top.colour).toBe(2);
    expect(game.grid[0][0]?.c).toBe(4);
    expect(marks.filter((m) => m !== top).every((m) => game.grid[m.ring][m.spoke]?.c === m.colour)).toBe(true);
    expect(game.filled()).toBe(false);
  });
  it('one white dropped: "Single! +3", then "Double! +6" turning the top target multicoloured, then "Triple! Constellation! +213", and four multicoloured targets go up', () => {
    const { results: [m], game } = played('replay');
    const said = m.stages.filter((s) => s.kind === 'line' || s.kind === 'constellation');
    expect(said.map((s) => s.kind)).toEqual(['line', 'line', 'constellation']);
    expect(said[0].cleared.length * 1).toBe(3);
    expect(said[1].cleared.length * 2).toBe(6);
    expect(said[0].wilded ?? []).toEqual([]);
    expect(said[1].wilded?.map((w) => [w.ring, w.spoke])).toEqual([[0, 0]]);
    expect(m.done!.step).toBe(3);
    expect(m.done!.points).toBe(213);
    expect(m.points).toBe(3 + 6 + 213);
    const next = game.constellation!.marks;
    expect(next.filter((k) => k.ring === 0 && k.wild).length).toBe(4);
  });
  it('its beats are Single, Double and Triple, on the board in order, every beat she has words for', () => {
    const order: string[] = [];
    const b = layBoard(WALK_BOARD, seeded(4))!;
    order.push('set');
    let n = 0;
    for (const st of playStep(b.game, b.moves[0]).stages) order.push(...stageCues(st, st.kind === 'line' || st.kind === 'constellation' ? ++n : 0));
    order.push('end');
    const beats = MECHANICS.flatMap((id) => WALK[id]);
    expect(beats.filter((c) => !order.includes(c))).toEqual([]);
    expect(beats).toEqual(order.filter((c) => beats.includes(c)));
    expect(Object.keys(LESSON.replay).sort()).toEqual([...beats].sort());
    expect(walkStepOf('wild')).toBe('umamiRun');
    expect(endsStep('end')).toBe(true);
    expect(endsStep('step3')).toBe(false);
  });
  it('How it works comes first in her menu; the evil constellation is kept as a fun one, not in it', () => {
    expect(WOLF_DEN_TUTORIAL.choices[0].id).toBe('mechanics');
    expect(MECHANICS).not.toContain('evil');
    expect(findPart(WOLF_DEN_TUTORIAL, 'evil')?.part.tag).toBe('for fun');
    expect(BOARDS.evil).toBeDefined();
    expect(TUTOR.walked).toBeTruthy();
  });
});

// The user, 15 Nov: "notes for wolf den are it's speed nav and quick doubles is a good strategy. So a layer of three so
// you can line up two pieces in the outer ring and it's nice and simple"; their board, notes/wolf-den/quick-double.png.
// Built 20 Nov ("Yes, build it"); reworked the same day after playing it: "Surely when I pick the quick double, that
// should be it ... it's not really explaining the idea of why this is easy ... not really showing the build-up ...
// it's not really showing the plan in the way that sailing is."
describe('20 Nov: speed nav, the quick double, as you\'d really play it, its plan marked', () => {
  // (the user, 20 Nov: "the first step is ... building the bottom two rings basically like normal ... by the time we
  // get to the third ring ... we want to wait for an opportunity ... I've already got a red ... So now all I need is to
  // get a red and a yellow piece next to each other in the outer ring"; "you can['t] magically predict that the white
  // is coming next")
  const played = () => {
    const b = layBoard('quick', seeded(4))!;
    return { ...b, res: b.moves.map((s) => playStep(b.game, s)) };
  };
  it('fills the bottom two rings first, puts what\'s no use out of the way, and a red onto the target beside the red already there', () => {
    const b = layBoard('quick', seeded(4))!;
    expect(b.game.grid[2][1]?.c).toBe(1);   // (the red already beside the yellow target: the opportunity)
    expect(b.game.grid[2][0]).toBeNull();
    b.moves.slice(0, 2).forEach((s) => playStep(b.game, s));
    expect(b.game.grid.slice(0, 2).every((ring) => ring.every((x) => x))).toBe(true);
    playStep(b.game, b.moves[2]);
    expect(b.game.grid[2][4]?.c).toBe(4);   // (a blue, out of the way)
    playStep(b.game, b.moves[3]);
    expect([b.game.grid[2][0]?.c, b.game.grid[2][1]?.c, b.game.grid[2][7]]).toEqual([1, 1, null]);
  });
  it('the stars come as they come: no two in a row land where they\'re wanted without a turn to fit them', () => {
    const b = layBoard('quick', seeded(4))!;
    b.moves.slice(0, 5).forEach((s) => playStep(b.game, s));
    expect(b.game.grid[3][2]?.c).toBe(1);   // (a red, parked on the right)
    // (the yellow comes two spokes on: the outer ring turned one place first, the red brought up beside it)
    expect(b.moves[5]).toMatchObject({ turn: 3, dir: 1, next: { c: 0, spoke: 4 } });
    playStep(b.game, b.moves[5]);
    playStep(b.game, b.moves[6]);
    expect([b.game.grid[3][3]?.c, b.game.grid[3][4]?.c]).toEqual([1, 0]);
  });
  it('spun round toward the gap: Single, then Double, 3 + 71 x 2, nothing booched on the way', () => {
    const { game, res } = played();
    expect(denPoints(BOARDS.quick.marks)).toBe(71);
    expect(res.every((m) => !m.booched)).toBe(true);
    expect(res.slice(0, -1).every((m) => m.points === 0)).toBe(true);
    const last = res[res.length - 1];
    expect(last.stages.filter((s) => s.kind === 'line' || s.kind === 'constellation').map((s) => s.kind)).toEqual(['line', 'constellation']);
    expect(last.done!.step).toBe(2);
    expect(last.done!.points).toBe(142);
    expect(game.score).toBe(3 + 142);
  });
  it('its plan marked from when she spots the red, read off the rules: the pair, the gap, the two parked, where each lands, Single then Double', () => {
    const at = (p: { ring: number; spoke: number }) => `${p.ring},${p.spoke}`;
    expect(planMarks('quick', 0)).toEqual([]);
    expect(planMarks('quick', 2)).toEqual([]);
    const m = planMarks('quick', 3);
    const stars = m.filter((k) => k.kind === 'star') as { at: { ring: number; spoke: number }; label: string; colour: number }[];
    expect(stars.map((k) => [k.label, at(k.at), k.colour])).toEqual([['pair', '2,1', 1], ['', '2,0', 1], ['1st', '3,3', 1], ['2nd', '3,4', 0]]);
    expect(m.filter((k) => k.kind === 'gap').map((k) => at((k as { at: { ring: number; spoke: number } }).at))).toEqual(['2,7']);
    expect((m.filter((k) => k.kind === 'arrow') as { to: { ring: number; spoke: number } }[]).map((a) => at(a.to))).toEqual(['2,7', '2,0']);
    expect(m.filter((k) => k.kind === 'badge').map((k) => (k as { label: string }).label)).toEqual(['Single', 'Double']);
    // (the red already there solid; the rest dashed till built; everything solid once both are parked; none once set off)
    expect(m.filter((k) => !k.faint).map((k) => (k as { label?: string }).label)).toEqual(['pair']);
    expect(planMarks('quick', 7).every((k) => !k.faint)).toBe(true);
    expect(planMarks('quick', BOARDS.quick.moves.length)).toEqual([]);
    expect(planMarks('replay', 0)).toEqual([]);
  });
  it('one lesson, walked a beat at a time: its beats in order, every one she has words for; picking it plays it, no steps to pick', () => {
    const b = layBoard('quick', seeded(4))!, order = ['set'];
    b.moves.forEach((step, i) => {
      order.push(`move${i + 1}`);
      let n = 0;
      for (const st of playStep(b.game, step).stages) order.push(...stageCues(st, st.kind === 'line' || st.kind === 'constellation' ? ++n : 0));
    });
    order.push('end');
    expect(QUICK).toEqual(['quickDouble']);
    const beats = WALKS.quick.steps.quickDouble;
    expect(beats).toEqual(order.filter((c) => beats.includes(c)));
    for (const c of Object.keys(LESSON.quick)) expect(beats, c).toContain(c);
    expect(walkOf('quickDouble')).toMatchObject({ id: 'quick', at: 0 });
    expect(walkOf('umamiRun')).toMatchObject({ id: 'mechanics', at: 0 });
    expect(walkOf('trapdoor')).toBeNull();
    expect(walkAt('move3', 'quick')).toBe(0);
    expect(nextStep('quickDouble')).toBeNull();
    expect(WALKS.quick.done).toBe(TUTOR.quickWalked);
    const menu = new TutorialMenu(WOLF_DEN_TUTORIAL);
    expect(menu.tap(WOLF_DEN_TUTORIAL.choices.findIndex((c) => c.id === 'quick'))).toMatchObject({ kind: 'play', part: { id: 'quickDouble' }, choice: 'quick' });
  });
  it('its own choice in her menu, second, after how it works; the chains\' choice keeps the other tricks', () => {
    expect(WOLF_DEN_TUTORIAL.choices.map((c) => c.id)).toEqual(['mechanics', 'quick', 'basics', 'tricks', 'fun']);
    expect(WOLF_DEN_TUTORIAL.choices[1].covers).toEqual(QUICK);
    const tricks = WOLF_DEN_TUTORIAL.choices.find((c) => c.id === 'tricks')!.covers;
    expect(tricks).not.toContain('quickDouble');
    expect(tricks).toContain('trapdoor');
    expect(findPart(WOLF_DEN_TUTORIAL, 'quickDouble')?.part.shows).toEqual({ kind: 'moves', ref: 'quick' });
  });
});

// 15 Nov: "I thought she was supposed to be ... turning the table and doing all of the things, like just like spinning
// it ... stop the werewolves coming" (asked 14 Nov): her opening, spinning the wheel frantically as the moon wanes.
describe('15 Nov: her opening, spinning the wheel frantically as the moon wanes', () => {
  it('its beats in order, each with her words; the moon full at the start and gone before she sees you; short', () => {
    const at = OPENING.BEATS.map((b) => b.at);
    expect(at).toEqual([...at].sort((a, b) => a - b));
    for (const b of OPENING.BEATS) expect(OPENING_LINES[b.say], b.say).toBeTruthy();
    expect(openingAt(0)).toMatchObject({ beat: 0, moon: 1, spinning: true, done: false });
    const phew = OPENING.BEATS.find((b) => b.say === 'phew')!.at;
    expect(openingAt(phew).moon).toBe(0);
    expect(openingAt(phew).spinning).toBe(false);
    expect(openingAt(OPENING.SECS).done).toBe(true);
    expect(OPENING.SECS).toBeLessThan(16);
    let last = 1;
    for (let t = 0; t <= OPENING.SECS; t += 0.25) { const m = openingAt(t).moon; expect(m).toBeLessThanOrEqual(last); last = m; }
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
