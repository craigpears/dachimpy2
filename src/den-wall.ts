/* Pirate Den: the wall's holes, laid out in two courses. TypeScript, compiled to js/den-wall.js;
   tested in tests/den-wall.test.ts. den.js builds the stone round them and runs the raiders.

   The user (9 Nov), after a flat board over the den was tried and dropped as "forced": an overlay
   "suggests there's a deeper design problem whereby however I've designed the wall is stopping me
   being able to do this properly". The wall was one long row of holes, so no view showed them all
   and the piece travelled sideways over bare stone. Real Carpentry's four holes sit two up, two
   down. So the wall itself is laid out that way: a high hole over a low one each side of the gate
   ("Try with 2 wall courses. Let's see how that works"), and the four are the real puzzle's four,
   Q/W/A/S going to them as they do there.

   Raiders walk in at the foot of the wall, hacking a low hole wider into a doorway (den.js); a
   high hole they reach with ladders, and climb straight in through, so it wants mending first. */

export type Cell = [number, number];
export interface Laid {
  /** Columns and rows of stone. Row 0 is the top course (under the capstones), row H-1 the foot. */
  W: number;
  H: number;
  /** The gate's columns, c0 to c1 inclusive, from row gateTop(H) to the foot. */
  gate: { c0: number; c1: number };
  /** High left, low left, high right, low right. */
  holes: Cell[][];
}

/** At least nine rows (5 m), half as tall again as the one-row wall's six. */
export const MIN_H = 9;
/** Columns of stone kept at each end, for the stairs up to the wall-walk. */
export const END = 3;
/** Rows of stone between a high hole and the low one under it, and under the low one (what raiders
    hack away to make a doorway). */
export const GAP = 1;
/** Round the gate: room for the gun tower (fourteen squares wide), so its side guns fire along
    the wall at the raiders at the holes. Stone before the gate, the gate, stone after it. */
export const GATE = { before: 5, w: 4, after: 5, h: 5 };
/** The gate's top row: five rows tall (2.75 m), as on the one-course wall, with stone over it. Run
    up the taller wall's whole height it looked stretched (the user, 9 Nov: "it just feels very
    stretched now"). */
export const gateTop = (H: number): number => Math.max(1, H - GATE.h);

const bbox = (cells: Cell[]) => {
  const rs = cells.map((p) => p[0]), cs = cells.map((p) => p[1]);
  const r0 = Math.min(...rs), c0 = Math.min(...cs);
  return { r0, c0, h: Math.max(...rs) - r0 + 1, w: Math.max(...cs) - c0 + 1 };
};
/** At the top left, and on its side if it's taller than it's wide, so the wall stays low. */
export function flat(cells: Cell[]): Cell[] {
  const b = bbox(cells);
  const at = cells.map(([r, c]): Cell => [r - b.r0, c - b.c0]);
  return b.h > b.w ? at.map(([r, c]): Cell => [c, r]) : at;
}

/** Four holes' shapes, in two courses either side of the gate. The biggest and smallest go on one
    side, the other two on the other, so both sides come out about as tall; which side and which
    of each pair goes high is chance. */
export function twoCourses(shapes: Cell[][], rnd: () => number = Math.random): Laid {
  if (shapes.length !== 4) throw new Error('the wall has four holes');
  const s = shapes.map(flat).sort((a, b) => b.length - a.length);
  const pairs: Cell[][][] = [[s[0], s[3]], [s[1], s[2]]];
  if (rnd() < 0.5) pairs.reverse();
  const sides = pairs.map((p) => (rnd() < 0.5 ? p : [p[1], p[0]]));   // [high, low]
  const H = Math.max(MIN_H, ...sides.map(([hi, lo]) => 1 + bbox(hi).h + GAP + bbox(lo).h + GAP));
  const holes: Cell[][] = [];
  let col = END, gate = { c0: 0, c1: 0 };
  sides.forEach(([hi, lo], i) => {
    if (i === 1) {
      gate = { c0: col + GATE.before, c1: col + GATE.before + GATE.w - 1 };
      col = gate.c1 + 1 + GATE.after;
    }
    const w = Math.max(bbox(hi).w, bbox(lo).w);
    const put = (cells: Cell[], top: number): Cell[] => {
      const off = Math.floor(rnd() * (w - bbox(cells).w + 1));
      return cells.map(([r, c]): Cell => [r + top, c + col + off]);
    };
    holes.push(put(hi, 1), put(lo, H - GAP - bbox(lo).h));
    col += w + (i === 0 ? 0 : 2 + Math.floor(rnd() * 2));
  });
  return { W: col + 1, H, gate, holes };
}

/** A hole in the top course: its middle above the wall's middle. Raiders need ladders for it. */
export function isHigh(cells: Cell[], H: number): boolean {
  const b = bbox(cells);
  return b.r0 + b.h / 2 < H / 2;
}
