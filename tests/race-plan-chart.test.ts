/* The race plan on the parchment chart (14 Nov). The user, 13 Nov, on the plan's strip: "for a new player, they
   don't know what those things correspond to. They've not seen the map before ... we've got the nice 2D map for
   the chart kind of thing. Is it something that could be combined into that". And before it: "you need to be
   able to see the length". So each leg's choices are written on the chart where they are (src/race-chart.ts,
   choicePlaces), with where she stops for each and its line against the long way's, drawn by the same sheet as the
   changelog's chart (tools/race-map.mjs). */
import { describe, expect, it } from 'vitest';
import { choicePlaces, lineSquares, sheet, sheetSvg, wordsAt, POINT, type Pt } from '../src/race-chart';
import { LEGS, STOPS } from '../src/race-plan';
import { choiceLines } from '../src/race-sim';
import { LAY, Sea } from '../src/den-sail';

const RC = LAY.RACE, S = RC.STRETCHES;
const places = choicePlaces();
const near = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe('the race plan for a new player: each choice on the chart where it is (13 Nov: "they don\'t know what those things correspond to. They\'ve not seen the map before")', () => {
  it('every leg\'s every choice the strip offers is on the chart, once, in the strip\'s order', () => {
    expect(places.map((p) => `${p.leg}:${p.id}`)).toEqual(LEGS.flatMap((L, leg) => L.options.map((o) => `${leg}:${o.id}`)));
    for (const p of places) expect(p.name).toBe(LEGS[p.leg].options.find((o) => o.id === p.id)!.name);
  });

  it('each shortcut is marked where she stops for its puzzle, the pilot\'s own stops, on the course\'s water', () => {
    const sea = new Sea(9);
    const of = (id: string) => places.find((p) => p.id === id && p.id !== 'long')!;
    expect(of('headwind').stops).toEqual([STOPS.headwind.at]);
    expect(of('crane').stops).toEqual([STOPS.crane.at]);
    expect(of('bribe').stops).toEqual([STOPS.wreck.at, STOPS.pay.at]);
    expect(of('zigzag').stops).toEqual(STOPS.zigzag.map((s) => s.at));
    for (const p of places) {
      if (p.id === 'long') { expect(p.stops).toEqual([]); continue; }
      expect(p.stops.length, `${p.id} is marked somewhere`).toBeGreaterThan(0);
      for (const [c, r] of p.stops) expect(sea.open(c, r) || sea.isLock(c, r), `${p.id}'s stop ${c},${r} is on the water`).toBe(true);
      expect(p.says.length, `${p.id} says what she does there`).toBeGreaterThan(0);
    }
  });

  it('each choice\'s words sit on its own leg, beside where she stops, a pointer at it when it\'s off to one side', () => {
    for (const p of places) {
      expect(p.words.r, `${p.leg}:${p.id}'s words on leg ${p.leg + 1}`).toBeGreaterThanOrEqual(S[p.leg].r - 1);
      expect(p.words.r).toBeLessThanOrEqual(S[p.leg + 1].r + 1);
      if (!p.stops.length) continue;
      expect(Math.min(...p.stops.map((s) => near(s, [p.words.c, p.words.r]))), `${p.id}'s words near its stop`).toBeLessThan(8.5);
      const right = Math.min(...p.stops.map(([c]) => c)) - p.words.c > POINT, left = Math.max(...p.stops.map(([c]) => c)) - p.words.c < -POINT;
      expect(p.lines[0].endsWith('▸'), `${p.id} points right`).toBe(right);
      expect(p.lines[0].startsWith('◂'), `${p.id} points left`).toBe(left);
      expect(p.lines[1]).toBe(p.puzzle);
    }
    // (the gate's two ways stacked under one another at the gate; the bribe at its wreck)
    const A = wordsAt(), run = places.find((p) => p.id === 'run')!, shoot = places.find((p) => p.id === 'shoot')!;
    expect(shoot.words).toEqual(A.gate);
    expect(run.words.c).toBe(A.gate.c);
    expect(run.words.r).toBeLessThan(A.gate.r);
    expect(places.find((p) => p.id === 'bribe')!.words).toEqual(A.wreck);
  });
});

describe('the race plan\'s chart: see each choice\'s length (13 Nov: "you need to be able to see the length")', () => {
  it('a choice\'s line is its line on the course, its length in squares along it', () => {
    for (const p of places) {
      expect(p.line).toEqual(choiceLines(p.leg, p.id));
      expect(p.squares).toBeCloseTo(p.line.reduce((n, l) => n + lineSquares(l), 0), 6);
    }
    expect(lineSquares([[0, 0], [3, 0], [3, 4]])).toBe(7);
  });

  it('a shortcut leaves the long way and rejoins it where the long way it skips starts and ends, and is the shorter on the water', () => {
    for (const p of places) {
      if (p.id === 'long') { expect(p.skips).toEqual(p.line[0]); expect(p.longSquares).toBeCloseTo(p.squares, 6); continue; }
      if (p.id === 'zigzag') continue;   // (hopping the zigzag is on the long way's own water)
      const first = p.line[0], last = p.line[p.line.length - 1];
      expect(near(first[0], p.skips[0]), `${p.id} leaves the long way where it starts`).toBeLessThan(1e-6);
      expect(near(last[last.length - 1], p.skips[p.skips.length - 1]), `${p.id} rejoins it where it ends`).toBeLessThan(1e-6);
      expect(p.squares, `${p.id}'s line is shorter than the long way it leaves`).toBeLessThan(p.longSquares);
    }
  });
});

describe('the chart\'s sheet, one drawing for the changelog\'s chart and the den\'s (14 Nov)', () => {
  it('draws the same sheet every time, its ids its own so two on a page don\'t clash', () => {
    const a = sheetSvg(sheet({ ids: 'pc-' })), b = sheetSvg(sheet({ ids: 'pc-' }));
    expect(a).toBe(b);
    expect(a).toContain('url(#pc-paper)');
    expect(a).not.toContain('url(#rc-');
    expect(a.startsWith('<svg') && a.endsWith('</g></svg>')).toBe(true);
  });
});
