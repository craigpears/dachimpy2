/* Pirate Den: something new to start, offered where you're looking. TypeScript, compiled to
   js/start-mark.js; tested in tests/start-mark.test.ts. js/den/start-mark.js draws it: a marker over
   the thing itself, clickable, that any place can offer.

   The user (10 Nov), at the crane: "Like, it should be in the middle of the screen where I'm looking
   so that I can click on it and start it. It should not be a space along the bottom ... it's not in
   my eye line at all." (A bigger, glowing prompt at the bottom wasn't enough.) So when there's
   something new to start (build the crane, haul her up, free him), it's offered on the thing, in the
   view, and a click on it starts it; Space still does, and the prompt at the bottom still says so.

   This knows nothing of what's started or where: given where the thing is on the screen, it says
   where its marker goes, or that it's out of sight (the prompt at the bottom carries it then). */

export const MARK = {
  /** How far past the screen's edge (in its own halves: 1 is the edge) the thing may be and its
      marker still be brought in to the edge; any further and it's out of sight. */
  EDGE: 0.15,
  /** Pixels the marker's point is kept in from the screen's sides, and clear of what's at the top
      and the bottom (the den's panel, the prompt). */
  MARGIN: 40,
  /** The marker sits above its point: room it needs above it, in pixels. */
  HEAD: 56,
};

/** Where the thing is on screen: x and y from -1 to 1 (up), z past 1 once it's behind the camera
    (as three.js's `project` gives it). */
export interface Ndc { x: number; y: number; z: number }
/** The screen: its size, and the band between the den's panel at the top and the prompt at the foot. */
export interface Screen { w: number; h: number; top?: number; bottom?: number }

/** Where the marker's point goes, in pixels, for a thing at `p` on the screen; null when the
    thing's out of sight (behind you, or well off the screen). `half`: half the marker's width, so
    all of it stays on the screen. */
export function markAt(p: Ndc, s: Screen, half = 0): { x: number; y: number } | null {
  if (!(p.z < 1) || p.z < -1 || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
  if (Math.abs(p.x) > 1 + MARK.EDGE || Math.abs(p.y) > 1 + MARK.EDGE) return null;
  const top = (s.top ?? 0) + MARK.MARGIN + MARK.HEAD, bottom = (s.bottom ?? s.h) - MARK.MARGIN;
  const clamp = (v: number, a: number, b: number) => (a > b ? (a + b) / 2 : Math.max(a, Math.min(b, v)));
  return {
    x: clamp((p.x + 1) / 2 * s.w, Math.max(MARK.MARGIN, half + 8), s.w - Math.max(MARK.MARGIN, half + 8)),
    y: clamp((1 - p.y) / 2 * s.h, top, bottom),
  };
}
