/* Pirate Den: Multibella's island on the sloop's sea, where her wolf den's hut is (14 Nov). TypeScript, compiled to
   js/den-multibella.js; tested in tests/den-wolfden.test.ts. js/den/multibella-isle.js draws it and takes you ashore,
   into the hut (js/den/wolfden-house.js, on the house shell); leaving the hut puts you back aboard her, here.

   The user, 14 Nov: "Thought the plan was for her to do the wolf den tutorial and would expect her to have her own
   island similar to others." So Multibella (a real pirate of the Emerald Ocean; pirate name only) teaches the wolf
   den's four-ring Duty Navigation at its star table, on an island of her own (IDEAS.md: "Multibella's little island,
   somewhere on the sea, is where they teach you"). Like the Wedding Isle (src/den-isle.ts): a stretch of water off its
   shore counts, and from any square of it Space brings her alongside and puts you ashore. Its squares are
   LAY.MULTIBELLA in src/den-sail.ts. */
import { squaresIn, type Square } from './den-marks.js';
import { LAY } from './den-sail.js';
import type { Helm, Pose } from './den-sail.js';
import { shoreOf } from './den-isle.js';

export const MULTIBELLA = {
  /** Its name, as the sea and the captain's map would say it. */
  NAME: 'Multibella\'s island',
} as const;
const land = new Set(LAY.MULTIBELLA.LAND.map(([c, r]) => `${c},${r}`));
/** Is this square her island's? */
export const multibellaAt = (c: number, r: number): boolean => land.has(`${c},${r}`);
/** Is this square of the sea part of the landing off her island? (Water only.) */
export function onMultibellaLanding(c: number, r: number): boolean {
  const L = LAY.MULTIBELLA.LANDING;
  return c >= L.c0 && c <= L.c1 && r >= L.r0 && r <= L.r1 && !multibellaAt(c, r);
}
/** Its landing's squares, marked on the water (src/den-marks.ts). */
export const multibellaLandingSquares = (): Square[] => squaresIn(LAY.MULTIBELLA.LANDING, (c, r) => !onMultibellaLanding(c, r));
/** Can you go ashore from where she is? On its landing, and not held up by a hole in her deck (a calm doesn't keep you
    aboard), as off the Wedding Isle. */
export function canLandMultibella(h: Helm): boolean {
  const held = h.held();
  return onMultibellaLanding(h.pose.c, h.pose.r) && !h.dazed() && (!held || held === 'calm');
}
/** Where she lies while you're in the hut: alongside its shore. */
export const multibellaMooring = (): Pose => ({ ...LAY.MULTIBELLA.MOOR });
/** Her island's shore, for its 3D (shoreOf, src/den-isle.ts). */
export const multibellaShore = (): [number, number][] => shoreOf(LAY.MULTIBELLA.LAND);
