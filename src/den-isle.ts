/* Pirate Den: Mischievious's isle on the sloop's sea, where her wedding is. TypeScript, compiled to
   js/den-isle.js; tested in tests/den-isle.test.ts. js/den/isle.js draws it and takes you ashore.

   The user (11 Nov), of her wedding: "on an island somewhere ... islands can all have their own
   little thing out there". So it's a place on the sea (LAY.ISLE in src/den-sail.ts: its land, its
   jetty, her mooring by it), in plain sight off to the right of the lanes on the den's side of the
   checkpoint. Like the den's landing (src/den-beach.ts), a whole stretch of water off its jetty
   counts: from any square of it, Space brings her in alongside the jetty and puts you ashore, to
   the wedding. Leaving the wedding puts you back aboard her, there. */

import { LAY } from './den-sail.js';
import type { Helm, Pose } from './den-sail.js';

export const ISLE = {
  /** Its name, as the captain's map has it: the wedding's, not hers (the user, 11 Nov: "she's a primary
      character, but not the star of the show"). */
  NAME: 'Wedding Isle',
} as const;

const land = new Set(LAY.ISLE.LAND.map(([c, r]) => `${c},${r}`));

/** Is this square the isle's (its land, its jetty among it)? */
export const isleAt = (c: number, r: number): boolean => land.has(`${c},${r}`);

/** Is this square of the sea part of the landing off the isle's jetty? (Water only: never its land.) */
export function onIsleLanding(c: number, r: number): boolean {
  const L = LAY.ISLE.LANDING;
  return c >= L.c0 && c <= L.c1 && r >= L.r0 && r <= L.r1 && !isleAt(c, r);
}

/** Can you go ashore on the isle from where she is? On its landing, and not held up by a hole in her
    deck (a calm doesn't keep you aboard), as off the den's beach. */
export function canLandIsle(h: Helm): boolean {
  const held = h.held();
  return onIsleLanding(h.pose.c, h.pose.r) && !h.dazed() && (!held || held === 'calm');
}

/** Where she lies while you're ashore: alongside the jetty. */
export const isleMooring = (): Pose => ({ ...LAY.ISLE.MOOR });

/** The isle's shore, round its land squares (but the jetty's, which stands out from it into the
    water): see shoreOf. The sea's 3D (js/den/isle.js) and the captain's map (js/den/map.js) both draw
    it from this. */
export function isleShore(): [number, number][] {
  const [jc, jr] = LAY.ISLE.JETTY;
  return shoreOf(LAY.ISLE.LAND.filter(([c, r]) => c !== jc || r !== jr));
}

/** The shore round some squares of land (any island on the sea: the Wedding Isle's, Kikkit's): the
    corners of the squares along it in order, [c, r] with whole numbers on the squares' edges (a
    square [c, r] runs from c to c + 1 across and r to r + 1 out), once round, only where it turns. */
export function shoreOf(squares: readonly (readonly [number, number])[]): [number, number][] {
  const sand = new Set(squares.map(([c, r]) => `${c},${r}`));
  const on = (c: number, r: number) => sand.has(`${c},${r}`);
  // Each square's edges with water beyond them, corner to corner, all going the same way round.
  const next = new Map<string, [number, number]>();
  for (const id of sand) {
    const [c, r] = id.split(',').map(Number);
    if (!on(c, r - 1)) next.set(`${c + 1},${r}`, [c, r]);
    if (!on(c + 1, r)) next.set(`${c + 1},${r + 1}`, [c + 1, r]);
    if (!on(c, r + 1)) next.set(`${c},${r + 1}`, [c + 1, r + 1]);
    if (!on(c - 1, r)) next.set(`${c},${r}`, [c, r + 1]);
  }
  const first = next.keys().next().value as string, out: [number, number][] = [];
  for (let k = first; out.length <= next.size;) {
    out.push(k.split(',').map(Number) as [number, number]);
    k = next.get(k)!.join(',');
    if (k === first) break;
  }
  // (only the corners where it turns)
  return out.filter((p, i) => {
    const a = out[(i + out.length - 1) % out.length], b = out[(i + 1) % out.length];
    return (p[0] - a[0]) * (b[1] - p[1]) !== (p[1] - a[1]) * (b[0] - p[0]);
  });
}
