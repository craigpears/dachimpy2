/* Pirate Den: where Space does something, marked. TypeScript, compiled to js/den-marks.js; tested in
   tests/den-marks.test.ts. js/den/marks.js draws them: a gold ring pulsing on each square.

   The user (14 Nov), on Helium's rum run at Kikkit's island: "I eventually managed to throw her a barrel. But it
   took me a few places ... If there's only one square, because that works for the animation, then there should be
   a better visual indication of it." And: "always make that a generic thing ... this is like a quest or target ...
   you can do that for anything, even if it's just for interacting with the tutorial, it should be clear ... on the
   wedding island, she's on a little jetty. You could have a little flashing next to it."

   So any part of the den says which squares are its targets (a quest's next stop, a place's starting point), by a
   name of its own, and the marks show on them while she's near. Knows nothing of whose they are, nor of three.js. */

export type Square = readonly [number, number];
export interface Rect { c0: number; c1: number; r0: number; r1: number }

export const MARKS = {
  /** How near she has to be (squares, any way) for a target's marks to show. */
  NEAR: 6,
} as const;

/** The squares of a rectangle that aren't land. */
export function squaresIn(rect: Rect, land: (c: number, r: number) => boolean = () => false): Square[] {
  const out: Square[] = [];
  for (let r = rect.r0; r <= rect.r1; r++) for (let c = rect.c0; c <= rect.c1; c++) if (!land(c, r)) out.push([c, r]);
  return out;
}

/** The squares round some land (any of the eight neighbours of a land square) for which `ok` holds. */
export function squaresRound(land: readonly Square[], ok: (c: number, r: number) => boolean): Square[] {
  const seen = new Set<string>(), out: Square[] = [];
  for (const [x, y] of land) for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const c = x + dc, r = y + dr, k = `${c},${r}`;
    if (seen.has(k)) continue;
    seen.add(k);
    if (ok(c, r)) out.push([c, r]);
  }
  return out;
}

/** Every part's targets, by name: set (or cleared, with none) as each part sees fit; the squares to mark, from where
    she is (each target's squares when any of them is near). */
export class Marks {
  private by = new Map<string, readonly Square[]>();
  set(name: string, squares: readonly Square[] | null | undefined): void {
    if (squares?.length) this.by.set(name, squares); else this.by.delete(name);
  }
  get names(): string[] { return [...this.by.keys()]; }
  shown(c: number, r: number, near: number = MARKS.NEAR): Square[] {
    const seen = new Set<string>(), out: Square[] = [];
    for (const sq of this.by.values()) {
      if (!sq.some(([x, y]) => Math.max(Math.abs(x - c), Math.abs(y - r)) <= near)) continue;
      for (const s of sq) { const k = `${s[0]},${s[1]}`; if (!seen.has(k)) { seen.add(k); out.push(s); } }
    }
    return out;
  }
}
