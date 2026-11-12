/* The sloop race's course editor (src/race-editor.ts; race-editor.html). The user, 12 Nov: "having a map
   editor are going to be like the top of demands ... you'd need to be able to switch between 2D and 3D
   views." */
import { describe, expect, it } from 'vitest';
import { LAY, layRace } from '../src/den-sail';
import { DEFAULT_COURSE, decodeCourse, encodeCourse, problems } from '../src/race-course';
import { run, CUTS, BET_SAVES, SIM } from '../src/race-sim';
import {
  FEATURES, ABOUT, featureAt, squaresOf, moved, sized, check, shareLink, raceLink, fresh, limitsOf, columnOf, balanceOf, mergeReports, mmss,
  ROUTE_NAMES, BAND,
} from '../src/race-editor';

const lay = layRace(DEFAULT_COURSE, true);

describe('clicking the chart (12 Nov)', () => {
  it('a click on a lock, the crane\'s ledge, a buoy or the wreck picks it', () => {
    expect(featureAt(lay, ...lay.LOCKS[0].at)).toBe('lock');
    expect(featureAt(lay, ...lay.BERTH)).toBe('lock');
    expect(featureAt(lay, ...lay.CRANE.LEDGE)).toBe('crane');
    expect(featureAt(lay, ...lay.BUOYS[2].at)).toBe('buoy2');
    expect(featureAt(lay, ...lay.BRIBE.WRECK)).toBe('wreck');
    expect(featureAt(lay, lay.GUNS.gap[0], lay.GUNS.gap[1])).toBe('gun');
    expect(featureAt(lay, lay.WHIRLS.MOUTH.c, lay.WHIRLS.MOUTH.r)).toBe('whirl');
  });

  it('a click on open water or plain land picks nothing', () => {
    expect(featureAt(lay, 3, lay.STRETCHES[2].r)).toBeNull();
    expect(featureAt(lay, 5, lay.SPITS[2].r0 + 3)).toBeNull();
  });

  it('every feature it shows has squares on the chart and a line saying what it is', () => {
    for (const id of FEATURES) {
      expect(squaresOf(lay, id).length, id).toBeGreaterThan(0);
      expect(ABOUT[id].what.length, id).toBeGreaterThan(20);
    }
  });
});

describe('moving things (12 Nov)', () => {
  it('dragging the locks along their spit moves them, and no further than the spit lets them', () => {
    const k = moved(DEFAULT_COURSE, 'lock', 18);
    expect(k.lock).toBe(18);
    expect(check(k)).toEqual([]);
    const [lo, hi] = limitsOf(DEFAULT_COURSE, 'lock');
    expect(moved(DEFAULT_COURSE, 'lock', 0).lock).toBe(lo);
    expect(moved(DEFAULT_COURSE, 'lock', 99).lock).toBe(hi);
    expect(columnOf(k, 'lock')).toBe(18);
  });

  it('a buoy moved shifts the long way round it, and the zigzag goes with buoy 4', () => {
    let k = moved(DEFAULT_COURSE, 'buoy3', 4);
    // (the zigzag now reaches where the locks were: they have to move along first)
    expect(check(k).join(' ')).toMatch(/^The locks/);
    k = moved(k, 'lock', 18);
    expect(check(k)).toEqual([]);
    const z = layRace(k, true).ZIGZAG.map(([c]) => c);
    expect(Math.min(...z)).toBe(5);
    expect(layRace(k, true).BUOYS[3].at[0]).toBe(4);
  });

  it('the veiled wind carries where it blows her back with it', () => {
    const k = moved(DEFAULT_COURSE, 'veil', 16);
    expect(k.veil).toBe(16);
    expect(k.veilBack).toBe(4);
    expect(problems(k)).toEqual([]);
  });

  it('two shortcuts dragged into each other are flagged, not hidden', () => {
    const k = moved(DEFAULT_COURSE, 'head', 7);
    expect(check(k).length).toBeGreaterThan(0);
  });
});

describe('the side panel\'s numbers (12 Nov)', () => {
  it('the locks\' Bilge clears, the barrier\'s bundles, the guard\'s price, the crane\'s frames, kept to what they may be', () => {
    expect(sized(DEFAULT_COURSE, 'clears', 12).clears).toBe(12);
    expect(sized(DEFAULT_COURSE, 'clears', 99).clears).toBe(20);
    expect(sized(DEFAULT_COURSE, 'bundles', 0).bundles).toBe(1);
    expect(sized(DEFAULT_COURSE, 'coins', 47).coins).toBe(50);
    expect(sized(DEFAULT_COURSE, 'frames', 'large').frames).toBe('large');
    expect(sized(DEFAULT_COURSE, 'frames', 'huge').frames).toBe('standard');
    expect(sized(DEFAULT_COURSE, 'veilOn', 75).veilOn).toBe(80);
    expect(problems(sized(sized(DEFAULT_COURSE, 'clears', 3), 'beat', 8))).toEqual([]);
  });
});

describe('the links (12 Nov)', () => {
  it('a share link brings the same course back into the editor', () => {
    const k = sized(moved(DEFAULT_COURSE, 'lock', 18), 'clears', 12);
    const link = shareLink('https://example.org/race-editor.html?course=old#x', k);
    expect(link.startsWith('https://example.org/race-editor.html?course=')).toBe(true);
    expect(decodeCourse(new URL(link).searchParams.get('course'))).toEqual(k);
  });

  it('the 3D view opens the den\'s race on the course', () => {
    expect(raceLink(DEFAULT_COURSE)).toBe(`den.html?at=race&course=${encodeCourse(DEFAULT_COURSE)}`);
  });

  it('reset gives the den\'s own course, a fresh copy to edit', () => {
    const k = fresh();
    expect(k).toEqual(DEFAULT_COURSE);
    k.buoys[0] = 20;
    expect(DEFAULT_COURSE.buoys[0]).toBe(25);
  });
});

describe('the balance check (12 Nov)', () => {
  it('shows each way round\'s wins and what each shortcut saves, from the simulation\'s races, two batches as one', () => {
    const a = run(6, 4, { seed: 1 }), b = run(6, 4, { seed: 7 }), both = mergeReports(a, b);
    expect(both.races).toBe(12);
    const n = (r: typeof a) => Object.values(r.byRoute).reduce((x, t) => x + t.n, 0);
    expect(n(both)).toBe(n(a) + n(b));
    const saves = Object.fromEntries(Object.entries(CUTS).map(([id, c]) => [id, c.saves]));
    const B = balanceOf(both, SIM.LONG, saves, BET_SAVES);
    expect(B.fair).toBe(0.25);
    expect(B.long).toBe(222);
    expect(B.routes.length).toBeGreaterThan(0);
    for (const r of B.routes) expect(ROUTE_NAMES[r.id]).toBe(r.name);
    expect(B.cuts.find((c) => c.id === 'locks')!.saves).toBe(23);
    expect(B.bets.map((x) => x.id)).toEqual(['turn', 'veil']);
    expect(B.routes.every((r) => r.ok === (r.wins >= BAND[0] * B.fair && r.wins <= BAND[1] * B.fair))).toBe(true);
  });

  it('never lists a way round it has no name for', () => {
    const rep = run(2, 4, { seed: 3 });
    rep.byRoute.mystery = { n: 4, wins: 4, time: 0, hitsTaken: 0, hitsGiven: 0 };
    expect(balanceOf(rep, 222, {}, BET_SAVES).routes.map((r) => r.id)).not.toContain('mystery');
  });

  it('a time on the clock to the second', () => {
    expect(mmss(222)).toBe('3:42');
    expect(mmss(59.6)).toBe('1:00');
  });
});

it('the den\'s own race is untouched by the editor: no course in its link, the den\'s own (12 Nov)', () => {
  expect(LAY.RACE.CUSTOM).toBe(false);
  expect(check(DEFAULT_COURSE)).toEqual([]);
});
