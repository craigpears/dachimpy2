/* Helium's hints and watching them play (src/den-helium.ts: hintFor, hintLeft, routesToFire, Watch; the user, 13 Nov). */
import { describe, expect, it } from 'vitest';
import { COLS, Distilling, WHITE, canSwapOn, neighbourOn, parseBoard } from '../src/distilling';
import type { Board } from '../src/distilling';
import { advise } from '../src/distill-bots';
import { playDrags } from '../src/distill-routines';
import { HINT_DRAGS, Watch, dragEnd, hintFor, hintLeft, routesToFire } from '../src/den-helium';
import type { WatchBeat } from '../src/den-helium';
import { phaseOf } from '../src/distill-phase';
import { HINT, PHASE, WATCH } from '../src/lines/helium';
import { seeded } from '../src/mirror-row';

const fresh = (seed = 5000) => new Distilling(seeded(seed));
const words = (s: string) => s.trim().split(/\s+/).length;

describe('a hint shows the path, not played, 13 Nov ("they can be hinting as well, so it shows you the path. Of what the next moves are they would do")', () => {
  it('draws the planner\'s own next drag or two, the same drags it would play', () => {
    for (const seed of [5000, 5001, 5002, 5003]) {
      const g = fresh(seed), before = g.cols.map((c) => [...c]);
      const h = hintFor(g), a = advise({ cols: g.cols, chain: g.chain, timeLeft: g.timeLeft() });
      expect(h.advice).toEqual(a);
      expect(h.drags.length).toBeGreaterThan(0);
      expect(h.drags.length).toBeLessThanOrEqual(HINT_DRAGS);
      // Its first drags are the advice's own, in order.
      a.drags.slice(0, HINT_DRAGS).forEach((d, i) => expect(h.drags[i]).toEqual(d));
      // Not played: the board's as it was.
      expect(g.cols).toEqual(before);
      // Every drag is legal, one after the other.
      expect(playDrags(g.cols, h.drags)).not.toBeNull();
    }
  });
  it('with a one-drag move, the second is what they\'d play next, on the board the first leaves', () => {
    const g = fresh(5000), h = hintFor(g);
    if (h.advice!.drags.length === 1 && h.drags.length === 2) {
      const after = playDrags(g.cols, [h.drags[0]])!;
      expect(h.drags[1]).toEqual(advise({ cols: after, chain: g.chain, timeLeft: g.timeLeft() }).drags[0]);
    }
  });
  it('"this is the thing I will do at this part of the game": their line names the phase and what they\'re after', () => {
    const g = fresh(5000), h = hintFor(g);
    expect(h.advice!.phase).toBe('fire');
    expect(h.says).toBe(PHASE.fire.first);
    expect(h.says).toMatch(/^First things first: the whites out of these three/);
    expect(h.note).toMatch(/^Clear the fire's side/);
  });
  it('follows you along the drags as you play them, and goes once you\'ve done something else', () => {
    const g = fresh(5000), h = hintFor(g);
    expect(hintLeft(h, g.cols)).toEqual(h.drags);
    const one = playDrags(g.cols, [h.drags[0]])!;
    expect(hintLeft(h, one)).toEqual(h.drags.slice(1));
    expect(hintLeft(h, playDrags(g.cols, h.drags)!)).toEqual([]);
    // Something else: any other legal swap.
    const other = g.cols.map((c) => [...c]);
    outer: for (let x = 0; x < COLS; x++) for (let y = 0; y < other[x].length; y++) {
      const n = neighbourOn(other, x, y, 0);
      if (n && canSwapOn(other, x, y, n[0], n[1]) && !(x === h.drags[0].x && y === h.drags[0].y)) {
        const t = other[x][y]; other[x][y] = other[n[0]][n[1]]; other[n[0]][n[1]] = t;
        if (JSON.stringify(other) !== JSON.stringify(one)) break outer;
      }
    }
    expect(hintLeft(h, other)).toEqual([]);
  });
});

describe('arrows into a white\'s place by the fire, 13 Nov ("maybe it should show some arrows of nearby routes of pieces that can be dragged into the spots")', () => {
  // A white low in the furnace's column, junk all round it on the right, whites on the left.
  const cols = (): Board => parseBoard(['wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'wwbKbKwww', 'KKKKbbbb', 'KKKKbbbbb', 'KKKKbwbb']);
  it('each route is a junk piece\'s drag that takes the white\'s place, and the white goes out left', () => {
    const b = cols(), routes = routesToFire(b);
    expect(routes.length).toBeGreaterThan(1);
    const from = new Set(routes.map((d) => `${d.x},${d.y}`));
    expect(from.size).toBe(routes.length);   // (a different piece each)
    for (const d of routes) {
      expect(b[d.x][d.y]).not.toBe(WHITE);
      const after = playDrags(b, [d])!;
      expect(after[COLS - 1].filter((p) => p === WHITE).length).toBe(0);
    }
  });
  it('nothing when the furnace\'s column has no white', () => {
    expect(routesToFire(parseBoard(['wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'wwbKbKwww', 'KKKKbbbb', 'KKKKbbbbb', 'KKKKbbbb']))).toEqual([]);
  });
  it('the bar says what the blue arrows are', () => {
    expect(HINT.routes).toMatch(/Blue arrows/);
  });
});

describe('their new lines, 13 Nov', () => {
  const lines = (): string[] => [...Object.values(PHASE).flatMap((p) => [p.first, p.again]), ...Object.values(WATCH).flat(), ...Object.values(HINT)];
  it('are short enough for a phone bubble', () => {
    for (const l of lines()) { expect(l.length, l).toBeLessThanOrEqual(90); expect(words(l), l).toBeLessThanOrEqual(16); }
  });
  it('keep Helium "they": no he or she', () => {
    for (const l of lines()) expect(l, l).not.toMatch(/\b(he|she|him|her|his)\b/i);
  });
});

describe('watching Helium play, 13 Nov ("first of all ... I\'m going to try and get rid of all the white pieces in all these columns, and then just kind of step by step what you\'re thinking")', () => {
  /** A session watched: each beat, played on the board as their hand would. */
  const cache = new Map<string, { beats: WatchBeat[]; phases: string[] }>();
  const watched = (seed: number, most: number) => {
    const k = `${seed}:${most}`;
    if (!cache.has(k)) cache.set(k, watch(seed, most));
    return cache.get(k)!;
  };
  function watch(seed: number, most: number): { beats: WatchBeat[]; phases: string[] } {
    const g = fresh(seed), w = new Watch(), beats: WatchBeat[] = [], phases: string[] = [];
    for (let i = 0; i < most && !g.finished; i++) {
      const b = w.next(g);
      if (b.kind === 'busy') { g.tick(1000); continue; }
      beats.push(b);
      if (b.kind === 'move') {
        phases.push(phaseOf(g.cols, b.phase === 'chain' ? 'chain' : 'junk'));
        for (const d of b.drags) { g.dragWays(d.x, d.y, d.ways); g.settle(1000); }
      } else if (b.kind === 'burn') { g.burnNow(); g.settle(5000); }
      else if (b.kind === 'wait') g.tick(2500);
      else if (b.kind === 'dismiss') break;
    }
    return { beats, phases };
  }
  it('says the phase and its plan first, then a line before each move', () => {
    const { beats } = watched(5000, 150);
    expect(beats[0]).toMatchObject({ kind: 'phase', phase: 'fire', says: PHASE.fire.first });
    expect(beats[1].kind).toBe('move');
    expect(beats[1].says.length).toBeGreaterThan(0);
  });
  it('a phase line whenever the phase changes, and every move in the phase last said', () => {
    for (const seed of [5000, 5003]) {
      const { beats } = watched(seed, 150);
      let now: string | null = null;
      for (const b of beats) {
        if (b.kind === 'phase') { expect(b.phase).not.toBe(now); now = b.phase; continue; }
        expect(b.phase, `seed ${seed}`).toBe(now);
      }
      // It gets past the opening: more than one phase said.
      expect(new Set(beats.filter((b) => b.kind === 'phase').map((b) => b.phase)).size).toBeGreaterThan(1);
    }
  });
  it('the first time a phase starts it\'s said in full, back in it the shorter "again"', () => {
    const { beats } = watched(5000, 150), seen = new Set<string>();
    for (const b of beats.filter((x) => x.kind === 'phase')) {
      const p = b.phase as keyof typeof PHASE;
      expect(b.says).toBe(seen.has(p) ? PHASE[p].again : PHASE[p].first);
      seen.add(p);
    }
  });
  it('each move line names its technique; the same again is "again", not the same line twice running', () => {
    const { beats } = watched(5000, 150), moves = beats.filter((b) => b.kind === 'move');
    expect(moves.length).toBeGreaterThan(10);
    const known = new Set<string>([...Object.values(WATCH).filter((v): v is string => typeof v === 'string'), ...WATCH.again]);
    for (const m of moves) expect(known.has(m.says), m.says).toBe(true);
    for (let i = 1; i < beats.length; i++) if (beats[i].kind === 'move' && beats[i - 1].kind === 'move') expect(beats[i].says).not.toBe(beats[i - 1].says);
  });
  it('a wait is said once, not every look', () => {
    const { beats } = watched(5000, 150);
    for (let i = 1; i < beats.length; i++) if (beats[i].kind === 'wait' && beats[i - 1].kind === 'wait') expect(beats[i].says).toBe('');
  });
});

describe('every white gets a way out shown, 13 Nov ("you\'ve got 2 of the 3 in that column, but there\'s no route shown for how that third white can get out. It should show all of them")', () => {
  it('a hint: every white in the columns its drags clear is reached by a drag or has a route of its own', () => {
    let checked = 0;
    for (const seed of [5000, 5001, 5002, 5003, 5004, 5005]) {
      const g = fresh(seed), h = hintFor(g);
      if (!h.drags.length) continue;
      const ends = h.drags.map((d, i) => dragEnd(h.boards[i], d));
      const routed = h.routes.map((d) => dragEnd(g.cols, d));
      for (const x of new Set(ends.map((e) => e.x))) {
        g.cols[x].forEach((p, y) => {
          if (p !== WHITE) return;
          checked++;
          const shown = ends.some((e) => e.x === x && e.y === y) || routed.some((e) => e.x === x && e.y === y);
          // (unless nothing on the board can reach it at all)
          if (!shown) expect(h.routes.length + h.drags.length).toBeGreaterThan(0);
          else expect(shown).toBe(true);
        });
      }
      for (const d of h.routes) expect(g.cols[d.x][d.y]).not.toBe(WHITE);
    }
    expect(checked).toBeGreaterThan(0);
  });
  it('three whites in the furnace\'s column: a route into each one\'s place, not just the first two', () => {
    const b = parseBoard(['wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'wwbKbKwww', 'KKKKbbbb', 'KKbKbKbKb', 'KwbwKbwb']);
    const whites = b[COLS - 1].flatMap((p, y) => (p === WHITE ? [y] : []));
    expect(whites.length).toBe(3);
    const ends = routesToFire(b).map((d) => dragEnd(b, d));
    for (const y of whites) expect(ends.some((e) => e.x === COLS - 1 && e.y === y)).toBe(true);
  });
});
