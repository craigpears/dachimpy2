/* Pirate Den: a close look at pictures, one at a time, flat on the screen, like a puzzle's 2D view: the
   picture big, its title, and what's said of it; Left and Right (or A and D) through them in the order
   they hang, Escape (or Tab again) back. TypeScript, compiled to js/picture-view.js; tested in
   tests/picture-view.test.ts. Drawn by js/den/picture-view.js. Knows nothing of whose pictures they are
   or where they hang: a house's portraits (Gravee's, by the house shell: js/den/house.js), or a museum's
   exhibits, are a list of pictures.

   The user (11 Nov), in Gravee's gallery: "needs a 2D version similar to the puzzles, so you can go
   through the portraits easily with keyboard controls." */

/** A picture: its id, its title, and where it hangs (x, z: to start at the one you're nearest). */
export interface Picture { id: string; title: string; x: number; z: number }

/** What a key does in the view: back a picture, on a picture, the first or last, shut it; or nothing. */
export type PictureMove = 'prev' | 'next' | 'first' | 'last' | 'close';
export const PICTURE_KEYS: Readonly<Record<string, PictureMove>> = {
  arrowleft: 'prev', a: 'prev', arrowright: 'next', d: 'next', home: 'first', end: 'last', escape: 'close', tab: 'close',
};
/** The move for a key (as KeyboardEvent.key, lower case), or null. */
export const pictureKey = (key: string): PictureMove | null => PICTURE_KEYS[key.toLowerCase()] ?? null;

/** Where the view opens: on the picture you're looking at (`seen`, its id; if it hangs in two places,
    the one nearer you), if it's one of them; else the one hanging nearest you; else the first. */
export function startAt(pictures: readonly Picture[], seen: string | null, you: { x: number; z: number } | null): number {
  if (!pictures.length) return -1;
  const far = (p: Picture) => (you ? Math.hypot(p.x - you.x, p.z - you.z) : 0);
  let best = -1, bd = Infinity;
  pictures.forEach((p, j) => { if (p.id === seen && far(p) < bd) { bd = far(p); best = j; } });
  if (best >= 0) return best;
  if (!you) return 0;
  pictures.forEach((p, j) => { if (far(p) < bd) { bd = far(p); best = j; } });
  return best;
}

/** Where a move takes you from picture `i` of `n`: on or back one, round from the last to the first and
    back (a gallery's a loop to browse, not a wall to hit), or to either end. */
export function browse(i: number, move: Exclude<PictureMove, 'close'>, n: number): number {
  if (n <= 0) return -1;
  if (move === 'first') return 0;
  if (move === 'last') return n - 1;
  return (((i + (move === 'next' ? 1 : -1)) % n) + n) % n;
}

/** "3 of 41", under the picture. */
export const counter = (i: number, n: number): string => `${i + 1} of ${n}`;
