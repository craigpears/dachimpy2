/* A check for any Sailing drop's stages (tests/sailing.test.ts, tests/balloons.test.ts): each step is
   what it says it is. */
import { expect } from 'vitest';
import { Sailing } from '../src/sailing';
import type { Piece, Platform, Sail } from '../src/sailing';
import { seeded } from '../src/mirror-row';
/** Every stage of a drop says what it was, and what it cleared is exactly that: a line step's pieces
    the squares of its lines of four or more of a colour, a platform step's the pieces in its done
    platforms' targets, each of its colour. (The board draws a step from these, so a pop is shown as the
    line or platform it is.) */
export function stagesAreWhatTheySay(prev: (Piece | null)[][], before: Platform[], res: Sail): void {
  let grid = prev, plats = before;
  res.stages.forEach((st, i) => {
    // (a 'fall' only last, after a clear, clearing nothing: the board as the clear left it, settled)
    if (st.kind === 'fall') {
      expect(i).toBe(res.stages.length - 1);
      expect(i).toBeGreaterThan(1);
      expect(st.cleared).toEqual([]);
      const s = new Sailing(seeded(1), false);
      s.lay(grid.map((row) => row.map((x) => (x ? { ...x } : null))), plats);
      s.fall();
      expect(st.grid.map((row) => row.map((x) => x?.id ?? 0))).toEqual(s.grid.map((row) => row.map((x) => x?.id ?? 0)));
      return;
    }
    if (st.kind === 'land') { expect(st.cleared).toEqual([]); grid = st.grid; plats = st.platforms; return; }
    // (where each piece was when it went: the board as the step before left it, settled)
    const s = new Sailing(seeded(1), false);
    s.lay(grid.map((row) => row.map((x) => (x ? { ...x } : null))), plats);
    s.fall();
    const at = new Map<number, [number, number, number]>();
    s.grid.forEach((row, r) => row.forEach((x, c) => { if (x) at.set(x.id, [r, c, x.c]); }));
    const gone = st.cleared.map((id) => at.get(id)!);
    expect(gone.every(Boolean)).toBe(true);
    if (st.kind === 'line') {
      expect(st.lines?.length).toBeGreaterThan(0);
      expect(st.went).toBeUndefined();
      const squares = new Set<string>();
      for (const l of st.lines!) {
        expect(l.length).toBeGreaterThanOrEqual(4);
        const [r0, c0] = l[0], colour = s.grid[r0][c0]!.c;
        const across = l.every(([r]) => r === r0), down = l.every(([, c]) => c === c0);
        expect(across || down).toBe(true);
        l.forEach(([r, c], i) => {
          expect(s.grid[r][c]?.c).toBe(colour);
          if (i) expect(Math.abs(r - l[i - 1][0]) + Math.abs(c - l[i - 1][1])).toBe(1);
          squares.add(`${r},${c}`);
        });
      }
      expect(new Set(gone.map(([r, c]) => `${r},${c}`))).toEqual(squares);
      expect(st.platforms.map((p) => p.id)).toEqual(plats.map((p) => p.id));
    } else {
      expect(st.lines).toBeUndefined();
      expect(st.went?.length).toBeGreaterThan(0);
      const targets = st.went!.flatMap((p) => p.targets);
      expect(new Set(gone.map(([r, c]) => `${r},${c}`))).toEqual(new Set(targets.map((t) => `${t.r},${t.c}`)));
      for (const t of targets) expect(s.grid[t.r][t.c]?.c).toBe(t.colour);
      expect(st.platforms.map((p) => p.id)).toEqual(plats.filter((p) => !st.went!.includes(p)).map((p) => p.id));
    }
    grid = st.grid; plats = st.platforms;
  });
}

