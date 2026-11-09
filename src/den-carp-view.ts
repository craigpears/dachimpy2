/* Pirate Den: the Carpentry view. TypeScript, compiled to js/den-carp-view.js; tested in
   tests/den-carp-view.test.ts. den.js draws it (the camera straight on to the board, the piece's
   ghost) and wires these to the wall and the frames.

   The user (9 Nov), after Bilge: "have a 3D mode, but when you're puzzling, like I just don't think
   you can beat 2D, especially like the biggest critique and feedback I've got is people like to use
   keyboard controls, and this 3D experience is just not very good." And not a separate screen: "to
   make it really feel like, oh, look, I can put things on the stairs. I can put things on the wall
   or the deck or ramparts". So the view goes straight on to whatever you're building (the wall, or
   a frame: the stairs, the wall-walk, the gun tower, your shack), and the keys are Puzzle Pirates'
   own Carpentry keys (YPPedia "Carpentry", read 9 Nov 2026):
   - 1-3 take the toolbox's pieces (the den's three crates);
   - the arrows move the piece a square;
   - X and C turn it one way and the other, Z flips it;
   - Q, W, A and S centre it over the upper-left, upper-right, lower-left and lower-right holes;
   - Space puts it in.
   The den's own: Tab goes on to the next thing being built, Backspace takes the last piece back
   off (as the real puzzle lets you adjust the last piece), Esc walks off. E and F turn and flip as
   they do when walking about. */

export type Corner = 'ul' | 'ur' | 'dl' | 'dr';
export type Action =
  | { kind: 'move'; dr: number; dc: number }
  | { kind: 'turn'; dir: 1 | -1 }
  | { kind: 'flip' }
  | { kind: 'jump'; corner: Corner }
  | { kind: 'take'; i: number }
  | { kind: 'place' }
  | { kind: 'next' }
  | { kind: 'undo' }
  | { kind: 'leave' }
  /** A key the view keeps for itself, so it doesn't walk you off (D, the other WASD key). */
  | { kind: 'none' };

/** The keys, by `KeyboardEvent.key` in lower case. Turning: -1 anticlockwise, 1 clockwise. */
export const KEYS: Readonly<Record<string, Action>> = {
  arrowup: { kind: 'move', dr: -1, dc: 0 },
  arrowdown: { kind: 'move', dr: 1, dc: 0 },
  arrowleft: { kind: 'move', dr: 0, dc: -1 },
  arrowright: { kind: 'move', dr: 0, dc: 1 },
  x: { kind: 'turn', dir: -1 },
  c: { kind: 'turn', dir: 1 },
  e: { kind: 'turn', dir: 1 },
  z: { kind: 'flip' },
  f: { kind: 'flip' },
  q: { kind: 'jump', corner: 'ul' },
  w: { kind: 'jump', corner: 'ur' },
  a: { kind: 'jump', corner: 'dl' },
  s: { kind: 'jump', corner: 'dr' },
  '1': { kind: 'take', i: 0 },
  '2': { kind: 'take', i: 1 },
  '3': { kind: 'take', i: 2 },
  ' ': { kind: 'place' },
  enter: { kind: 'place' },
  tab: { kind: 'next' },
  backspace: { kind: 'undo' },
  escape: { kind: 'leave' },
  d: { kind: 'none' },
};

/** A point on a board, [row, column], fractional (a hole's middle, say). */
export type Pt = [number, number];

const LEFT = (c: Corner) => c === 'ul' || c === 'dl';
const UP = (c: Corner) => c === 'ul' || c === 'ur';

/** On the wall (holes all along it): the hole the corner key sends the piece to, from where it is
    now. Left keys look left, right keys right; of those, ones on the same level (up or down) as the
    key come first, then the nearest. Never `cur`, the hole the piece is at already (the user, 9 Nov:
    with the piece a little right of its hole's middle, Q took it back to that same hole, so "it
    isn't jumping"). Null if there's nothing that way. */
export function nextHole(holes: Pt[], at: Pt, corner: Corner, cur: number | null = null): number | null {
  let best: number | null = null, bd = Infinity;
  holes.forEach(([r, c], i) => {
    if (i === cur) return;
    const dc = c - at[1], dr = r - at[0];
    if (LEFT(corner) ? dc > -0.5 : dc < 0.5) return;
    const wrongLevel = UP(corner) ? dr > 0.5 : dr < -0.5;
    const d = Math.abs(dc) + Math.abs(dr) * 0.5 + (wrongLevel ? 1000 : 0);
    if (d < bd) { bd = d; best = i; }
  });
  return best;
}

/** On a frame (one big space): its four quarters, as the real board's four holes. Each is the
    middle of the squares still empty in that quarter of the frame, or null if it's all filled. */
export function quarters(open: Pt[]): Record<Corner, Pt | null> {
  const out: Record<Corner, Pt | null> = { ul: null, ur: null, dl: null, dr: null };
  if (!open.length) return out;
  const rs = open.map((p) => p[0]), cs = open.map((p) => p[1]);
  const midR = (Math.min(...rs) + Math.max(...rs)) / 2, midC = (Math.min(...cs) + Math.max(...cs)) / 2;
  const sums: Record<Corner, [number, number, number]> = { ul: [0, 0, 0], ur: [0, 0, 0], dl: [0, 0, 0], dr: [0, 0, 0] };
  for (const [r, c] of open) {
    const k: Corner = r <= midR ? (c <= midC ? 'ul' : 'ur') : (c <= midC ? 'dl' : 'dr');
    sums[k][0] += r + 0.5; sums[k][1] += c + 0.5; sums[k][2]++;
  }
  for (const k of Object.keys(sums) as Corner[]) if (sums[k][2]) out[k] = [sums[k][0] / sums[k][2], sums[k][1] / sums[k][2]];
  return out;
}

/** Where a piece's top-left goes to be centred over a point. */
export const centreOn = (p: Pt, h: number, w: number): [number, number] => [Math.round(p[0] - h / 2), Math.round(p[1] - w / 2)];

/** How far the piece can be moved: anywhere it still touches the board, so it can hang over an
    edge (frames take overhangs; the spare's sawn off). `box` is the board's squares' extent. */
export function clampTo(r: number, c: number, h: number, w: number, box: { r0: number; c0: number; h: number; w: number }, overhang: boolean): [number, number] {
  const lo = (a0: number, n: number) => (overhang ? a0 - n + 1 : a0);
  const hi = (a0: number, A: number, n: number) => (overhang ? a0 + A - 1 : a0 + A - n);
  return [
    Math.max(lo(box.r0, h), Math.min(hi(box.r0, box.h, h), r)),
    Math.max(lo(box.c0, w), Math.min(hi(box.c0, box.w, w), c)),
  ];
}

/** Tab: the next thing being built after the one you're on, round and round. */
export function nextBoard<T>(boards: T[], cur: T | null): T | null {
  if (!boards.length) return null;
  const i = cur === null ? -1 : boards.indexOf(cur);
  return boards[(i + 1) % boards.length];
}

/** A hole's stretch of the wall, as far as moving along it goes: its columns, and the stone just
    round it. `i`: which hole. */
export interface Zone { i: number; c0: number; c1: number }

/** Left and right on the wall (the user, 9 Nov: "it just blocks me instead of skipping over it"):
    a square at a time while the piece (`w` wide, its left at column `c`) stays over a hole's
    stretch; off it, straight on to the next hole that way, over the bare stone and the gate
    between. 'step': move a square; a number: the hole to jump to; null: there's none that way. */
export function along(zones: Zone[], c: number, w: number, dir: 1 | -1): 'step' | number | null {
  const over = (z: Zone, at: number) => at < z.c1 && at + w > z.c0;
  if (zones.some((z) => over(z, c + dir))) return 'step';
  const ahead = zones.filter((z) => !over(z, c) && (dir > 0 ? z.c0 > c : z.c1 < c + w))
    .sort((a, z) => (dir > 0 ? a.c0 - z.c0 : z.c1 - a.c1))[0];
  return ahead ? ahead.i : null;
}
