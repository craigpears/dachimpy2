/* Pirate Den: Jazzmy's island on the sloop's sea, where you pick her up for her magic carpet ride (14 Nov). TypeScript,
   compiled to js/den-jazzmy.js; tested in tests/den-carpet.test.ts. js/den/jazzmy-isle.js draws it and takes you off
   on the ride (js/den/carpet.js, a place of its own); the ride over, you're back aboard her, here.

   The user, 14 Nov: "put it somewhere, don't put it in the den though. Again, I want these things kind of spread out.
   I don't want the den becoming noisy. This is why we have like a modular system of islands." So, like Multibella's
   (src/den-multibella.ts): a stretch of water off its shore counts, and from any square of it Space brings her
   alongside, Jazzmy's jetty, and the ride begins. Its squares are LAY.JAZZMY in src/den-sail.ts. */
import { squaresIn, type Square } from './den-marks.js';
import { LAY } from './den-sail.js';
import type { Helm, Pose } from './den-sail.js';
import { shoreOf } from './den-isle.js';

export const JAZZMY = {
  /** Its name, as the sea says it. */
  NAME: 'Jazzmy\'s island',
} as const;
const land = new Set(LAY.JAZZMY.LAND.map(([c, r]) => `${c},${r}`));
/** Is this square her island's? */
export const jazzmyAt = (c: number, r: number): boolean => land.has(`${c},${r}`);
/** Is this square of the sea part of the landing off her island? (Water only.) */
export function onJazzmyLanding(c: number, r: number): boolean {
  const L = LAY.JAZZMY.LANDING;
  return c >= L.c0 && c <= L.c1 && r >= L.r0 && r <= L.r1 && !jazzmyAt(c, r);
}
/** Its landing's squares, marked on the water (src/den-marks.ts). */
export const jazzmyLandingSquares = (): Square[] => squaresIn(LAY.JAZZMY.LANDING, (c, r) => !onJazzmyLanding(c, r));
/** Can you pick her up from where she is? On its landing, and not held up by a hole in her deck (a calm doesn't keep
    you), as off Multibella's. */
export function canPickUpJazzmy(h: Helm): boolean {
  const held = h.held();
  return onJazzmyLanding(h.pose.c, h.pose.r) && !h.dazed() && (!held || held === 'calm');
}
/** Where she lies while you're off on the ride: alongside its shore. */
export const jazzmyMooring = (): Pose => ({ ...LAY.JAZZMY.MOOR });
/** Her island's shore, for its 3D and the captain's map (shoreOf, src/den-isle.ts). */
export const jazzmyShore = (): [number, number][] => shoreOf(LAY.JAZZMY.LAND);
