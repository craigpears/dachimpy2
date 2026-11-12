/* The sloop race's course as data, and edited (src/race-course.ts, layRace in src/den-sail.ts). The user,
   12 Nov: "having a map editor are going to be like the top of demands ... down to the details of how many it
   takes to clear each thing, like ... the number of bilge clears required on the locks, or the number of
   pieces or complexity of each carpentry lift". */
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LAY, layRace, path, type Pose } from '../src/den-sail';
import { DOOR } from '../src/den-door';
import { Lock } from '../src/den-lock';
import { CRANES, CRANE, Crane, partCells } from '../src/den-crane';
import { longRoute } from '../src/den-race';
import { DEFAULT_COURSE, decodeCourse, encodeCourse, problems, sameCourse, COL_KEYS, type Course } from '../src/race-course';
import { check, moved, waterProblems, FEATURES, limitsOf } from '../src/race-editor';
import { carp } from './helpers';

const BEFORE = JSON.parse(readFileSync(new URL('./fixtures/race-course-12nov.json', import.meta.url), 'utf8')) as Record<string, unknown>;
const json = (x: unknown) => JSON.parse(JSON.stringify(x));
const DOOR_SAVES = DOOR.SAVES;
const squares = (route: [number, number][]) => route.slice(1).reduce((n, b, i) => n + Math.abs(b[0] - route[i][0]) + Math.abs(b[1] - route[i][1]), 0);

describe('the den\'s own course, now laid out from data (12 Nov)', () => {
  it('is the same course to sail, every square of it as it was before it could be edited (the barrier since a column east)', () => {
    // (the race's layout as it was, saved before the change: every square of land, wind, buoy, gap...; saved
    // again when the barrier moved a column east, 12 Nov)
    for (const lay of [LAY.RACE, layRace(DEFAULT_COURSE)]) {
      for (const [k, v] of Object.entries(BEFORE)) expect(json((lay as Record<string, unknown>)[k]), k).toEqual(v);
    }
    expect(LAY.RACE.CUSTOM).toBe(false);
    expect(LAY.RACE.CODE).toBe('');
  });

  it('is a race the editor would allow: nothing out of place, the long way open to the finish', () => {
    expect(problems(DEFAULT_COURSE)).toEqual([]);
    expect(waterProblems(LAY.RACE)).toEqual([]);
  });
});

describe('the barrier "just feels like it\'s one square off" (12 Nov)', () => {
  // The user, at the race's chart: "how do you get to it? Like, you have to spin on the spot after jumping over
  // the, that snake trade wind thing."
  it('a Double over the trade wind back up leg 3 lands her a square short, and one turn takes her up into its notch', () => {
    const RC = LAY.RACE, mid = RC.SNAKES.MID[0][0], leg3 = RC.STRETCHES[2].r;
    expect(RC.FORAGE.NOTCH[0]).toBe(mid + 2);
    // (hopped from in front of the wind, a Double's two squares over it, along either row of leg 3)
    for (const r of [leg3, leg3 + 1]) {
      let p: Pose = { c: mid - 1, r, d: 1 };
      p = path(p, 'F').to; p = path(p, 'F').to;
      expect(p.c).toBe(mid + 1);
      expect(RC.WINDS.some(([c, y]) => c === p.c && y === p.r)).toBe(false);
      // (then a turn to port, out of the leg toward the spit: the notch from leg 3's second row; a square
      // before it from the first)
      const q = path(p, 'L').to;
      expect(q.d).toBe(0);
      expect(q.c).toBe(RC.FORAGE.NOTCH[0]);
      if (r === leg3 + 1) expect([q.c, q.r]).toEqual(RC.FORAGE.NOTCH);
      else expect(path(q, 'F').to).toMatchObject({ c: RC.FORAGE.NOTCH[0], r: RC.FORAGE.NOTCH[1] });
    }
  });
});

describe('a course\'s share link (12 Nov)', () => {
  it('is short, and brings back the same course', () => {
    const code = encodeCourse(DEFAULT_COURSE);
    expect(code.length).toBeLessThanOrEqual(30);
    expect(decodeCourse(code)).toEqual(DEFAULT_COURSE);
    const k: Course = { ...DEFAULT_COURSE, lock: 18, clears: 12, frames: 'large', coins: 70, buoys: [24, 3, 25, 2, 25] };
    expect(problems(k)).toEqual([]);
    expect(decodeCourse(encodeCourse(k))).toEqual(k);
    expect(sameCourse(decodeCourse(encodeCourse(k))!, k)).toBe(true);
  });

  it('that\'s garbled or isn\'t a race opens the den\'s own course instead', () => {
    for (const bad of ['', 'x', 'hello', encodeCourse(DEFAULT_COURSE).slice(0, -1), `2${encodeCourse(DEFAULT_COURSE).slice(1)}`]) expect(decodeCourse(bad)).toBeNull();
    // (the locks moved into the barrier's spit's water: out of place)
    expect(decodeCourse(encodeCourse({ ...DEFAULT_COURSE, lock: 3 }))).toBeNull();
  });
});

describe('moving a buoy (12 Nov)', () => {
  it('in toward the start shortens the long way, once the gate\'s moved out of its way', () => {
    let k = moved(DEFAULT_COURSE, 'buoy0', 21);
    expect(k.buoys[0]).toBe(21);
    expect(check(k).some((p) => p.startsWith('The imperial gate'))).toBe(true);
    k = moved(k, 'gun', 18);
    k = moved(k, 'wreck', 14);
    expect(check(k)).toEqual([]);
    expect(squares(longRoute(layRace(k, true)))).toBe(squares(longRoute(LAY.RACE)) - 2 * 4);
    // (the spit's land ends a column before its buoy)
    const spit = layRace(k, true).LAND[0];
    expect(Math.max(...spit.map(([c]) => c))).toBe(20);
  });

  it('can\'t go past the edge of the course', () => {
    expect(moved(DEFAULT_COURSE, 'buoy1', -5).buoys[1]).toBe(limitsOf(DEFAULT_COURSE, 'buoy1')[0]);
    expect(moved(DEFAULT_COURSE, 'buoy0', 99).buoys[0]).toBe(25);
  });
});

describe('every course the editor allows is a race (12 Nov)', () => {
  it('a thousand courses, each feature and buoy moved about at random: whenever nothing\'s out of place, the long way and every shortcut can be sailed', () => {
    let a = 12345;
    const rand = () => (a = (a * 16807) % 2147483647) / 2147483647;
    let k: Course = { ...DEFAULT_COURSE }, races = 0;
    for (let n = 0; n < 1000; n++) {
      const id = FEATURES[Math.floor(rand() * FEATURES.length)], [lo, hi] = limitsOf(k, id);
      const next = moved(k, id, lo + Math.floor(rand() * (hi - lo + 1)));
      if (problems(next).length) continue;
      k = next; races++;
      expect(waterProblems(layRace(k, true)), encodeCourse(k)).toEqual([]);
    }
    expect(races).toBeGreaterThan(100);
  });

  it('two ways through a spit run into each other: it says so', () => {
    expect(problems({ ...DEFAULT_COURSE, double: 12 }).join(' ')).toMatch(/run into each other/);
    expect(problems({ ...DEFAULT_COURSE, head: 7 }).join(' ')).toMatch(/run into each other/);
  });
});

describe('each shortcut\'s size, from the course (12 Nov)', () => {
  it('the up lock takes the course\'s Bilge clears to raise her (the den\'s own: 7)', () => {
    const at = LAY.RACE.LOCKS[0];
    const den = new Lock({ ...at }), edited = new Lock({ ...at, work: 12 });
    for (let i = 0; i < 7; i++) { den.pump(1); edited.pump(1); }
    expect(den.fill).toBeCloseTo(1, 9);
    expect(edited.fill).toBeCloseTo(7 / 12);
    for (let i = 0; i < 5; i++) edited.pump(1);
    expect(edited.fill).toBeCloseTo(1, 9);
  });

  it('the crane\'s frames, small or large, are each filled exactly, a square jutting out for a rare piece, foot, post and jib', () => {
    expect(CRANES.standard).toBe(CRANE.PARTS);
    const pieces: Record<string, number> = {};
    for (const [size, parts] of Object.entries(CRANES)) {
      expect(parts.map((p) => p.name)).toEqual(['foot', 'post', 'jib']);
      parts.forEach((_, i) => {
        const cells = partCells(i, parts), set = new Set(cells.map(([r, c]) => `${r},${c}`));
        expect(cells.length % 5).toBe(0);
        expect(carp.solve(cells, 1).length, `${size} ${i}`).toBe(1);
        expect(cells.some(([r, c]) => [[-1, 0], [1, 0], [0, -1], [0, 1]].filter(([x, y]) => set.has(`${r + x},${c + y}`)).length === 1)).toBe(true);
      });
      pieces[size] = parts.reduce((n, _, i) => n + partCells(i, parts).length / 5, 0);
    }
    expect(pieces).toEqual({ small: 6, standard: 13, large: 18 });
    // (built a frame at a time, the course's own)
    const k = new Crane(() => 0.5, [12, 70], CRANES.small);
    expect(k.build()!.open().length).toBe(10);
  });
});

describe('the race on a course from the editor (12 Nov)', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
  const load = async (k: Course) => {
    vi.resetModules();
    vi.stubGlobal('location', { search: `?at=race&course=${encodeCourse(k)}` });
    return {
      sail: await import('../src/den-sail'), race: await import('../src/den-race'), sim: await import('../src/race-sim'),
      bribe: await import('../src/den-bribe'), gamble: await import('../src/den-gamble'),
    };
  };

  it('is laid from the link, read once as the page loads, and keeps a best time of its own', async () => {
    const k: Course = { ...DEFAULT_COURSE, lock: 18, clears: 10, coins: 60, bundles: 3, veilOn: 70, beat: 6 };
    const m = await load(k);
    expect(m.sail.LAY.RACE.CUSTOM).toBe(true);
    expect(m.sail.LAY.RACE.LOCKS[0].at[0]).toBe(18);
    expect(m.race.RACE.STORE).not.toBe('den-race-best');
    expect(m.race.RACE.FORAGE.BUNDLES).toHaveLength(3);
    expect(m.bribe.BRIBE.PRICE).toBe(60);
    expect(m.gamble.GAMBLE.ON).toBe(0.7);
    expect(m.gamble.GAMBLE.BEAT).toBe(6);
    // (the sea's up lock raised by its own clears)
    const sea = new m.sail.Sea(), at = m.sail.LAY.RACE.LOCKS[0].at;
    expect(sea.locks.find((l) => l.at[0] === at[0] && l.at[1] === at[1])!.work).toBe(10);
  });

  it('keeps the starlit door where it is, fixed, its tunnel coming up on legs the editor has moved, and racers going through it', async () => {
    const m = await load({ ...DEFAULT_COURSE, buoys: [25, 2, 23, 2, 25] });
    expect(m.sail.LAY.RACE.CUSTOM).toBe(true);
    expect(m.sim.ROUTES.map((r) => r.name)).toContain('door');
    expect(json(m.sail.LAY.RACE.DOOR)).toEqual(BEFORE.DOOR);
    // (legs 3 and 4 shorter, the door's way under them saves less than on the den's own)
    expect(m.sim.CUTS.door.saves).toBeLessThan(DOOR_SAVES);
  });
  it('is raced by the simulation: its puzzles as big as the course has them, each shortcut saving more or less as it\'s moved', async () => {
    const den = await load(DEFAULT_COURSE);
    const base = { saves: Object.fromEntries(Object.entries(den.sim.CUTS).map(([id, c]) => [id, c.saves])), puzzle: { ...den.sim.SIM.PUZZLE }, long: den.sim.SIM.LONG };
    // (the den's own, read from a link, races as the den's own: the same numbers)
    expect(base.long).toBe(222);
    expect(base.saves.locks).toBe(23);
    const k: Course = { ...DEFAULT_COURSE, lock: 18, clears: 14, bundles: 4, frames: 'large', buoys: [25, 2, 25, 2, 21], crane: 10, triple: 18, veil: 15, veilBack: 6 };
    expect(problems(k)).toEqual([]);
    const m = await load(k);
    expect(m.sim.SIM.PUZZLE.bilge).toBe(base.puzzle.bilge * 2);
    expect(m.sim.SIM.PUZZLE.forage).toBe(base.puzzle.forage * 2);
    // (the locks further from their bend save more; the last leg shorter, so the long way's quicker)
    expect(m.sim.CUTS.locks.saves).toBeGreaterThan(base.saves.locks);
    expect(m.sim.SIM.LONG).toBeLessThan(222);
    const rep = m.sim.run(6, 4, {});
    expect(Object.values(rep.byRoute).reduce((n, t) => n + t.n, 0)).toBe(24);
  });
});

describe('the starlit door on an edited course (12 Nov: "make the [starlit] door public")', () => {
  it('nothing else may cut through a spit in its columns: it says so', () => {
    expect(problems({ ...DEFAULT_COURSE, head: 15 }).join(' ')).toMatch(/starlit door/);
    expect(problems({ ...DEFAULT_COURSE, lock: 14 }).join(' ')).toMatch(/starlit door/);
    expect(problems({ ...DEFAULT_COURSE, mid: 16 }).join(' ')).toMatch(/starlit door/);
  });

  it('isn\'t one of the columns the editor moves', () => {
    expect(COL_KEYS).toHaveLength(13);
    expect(Object.keys(DEFAULT_COURSE)).not.toContain('door');
  });
});
