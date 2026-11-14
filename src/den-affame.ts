/* Pirate Den: Affame's house, the Sweet Spot, a little one in the den's housing district (src/den-houses.ts).
   TypeScript, compiled to js/den-affame.js; tested in tests/den-affame.test.ts. js/den/affame-house.js plays it
   in the house shell (js/den/house.js), placing the shared furniture (js/den/furniture.js) and the cushions and
   teddies (js/den/cuddly.js) where FURNISH and TEDDIES say, and hanging her four pictures (js/den/exhibits.js's
   photos) where PICTURES says. Her lines are in src/lines/affame.ts.

   Affame, a real pirate of the Emerald Ocean (pirate name only): "I have dubbed her the queen of sweetness so
   she can have a nice kind peaceful role somewhere" (the user, 11 Nov). Then (14 Nov) four cartoons, "The dame
   of everlasting sweetness things I made for Affame to show in her little house XD" (IDEAS.md, "Affame, the
   queen of sweetness").

   So: one small, cosy room, its walls hung with those four pictures; a heap of cushions and teddies in its
   corner; a table of pastries (she's the Melt-Apart Springer of Pastries). She meets you at the door, shows you
   her pictures and tells you about each as you stop by it; and, kind thing to do here, you can sink into her
   cushions among the teddies, eyes shut, a moment's peace. No quest. */
import type { Plan, Piece } from './den-houses.js';
import { ON_A_PICTURE } from './lines/affame.js';

// ---------- the house ----------
/** One room, the camera looking in from the front (its front wall cut low, a doll's house), papered rose. */
export const PLAN: Plan = {
  rooms: [{ id: 'room', name: 'The Sweet Spot', x0: -4.8, x1: 4.8, z0: -3, z1: 3, paper: '#7a3d5c' }],
  doors: [],
  out: { x: 0, z: 2.35, r: 0.9 },
};
/** Where you come in (just inside the front door), and where she meets you. */
export const ARRIVE = { you: { x: 0, z: 2.0 }, her: { x: 1.1, z: 0.9 } } as const;
export const WALLS = { high: 3.6, low: 0.45 } as const;
const ROOM = PLAN.rooms[0];
/** How far out from the back wall her pictures hang (the wall's thickness). */
export const WALL_T = 0.2;
/** The back wall's face (z). */
export const BACK = ROOM.z0 + WALL_T;

// ---------- her pictures ----------
/* The four cartoons Dachimpy made her (sources in notes/affame/, published as houses/affame/*.jpg, numbered in
   the order the user listed them), each framed on her back wall with its title on a plaque, its own shape. */
export type PictureId = keyof typeof ON_A_PICTURE;
/** A picture on her wall: its file, its size in pixels (its shape), its title (on its plaque), where along the
    wall (`x`), how wide its frame's picture is (`w`, metres; its height from its shape), how high its middle
    (`y`); `big`: the biggest, in an ornate frame. */
export interface Picture { id: PictureId; file: string; px: readonly [number, number]; title: string; x: number; w: number; y: number; big?: boolean }
const pic = (id: PictureId, file: string, px: readonly [number, number], title: string, at: { x: number; w: number; y: number; big?: boolean }): Picture =>
  ({ id, file: `houses/affame/${file}.jpg`, px, title, ...at });
/** Left to right: the cushions over her cushion corner; her knighting, the biggest, under her sign; the
    Sweetness War; the Sweetness Index. */
export const PICTURES: readonly Picture[] = [
  pic('cushions', '2-cushions-and-teddies', [1200, 800], 'Cushions and Teddies', { x: -3.2, w: 1.35, y: 1.8 }),
  pic('dame', '1-dame-of-everlasting-sweetness', [800, 1200], 'Dame of Everlasting Sweetness', { x: -1.1, w: 1.0, y: 1.85, big: true }),
  pic('war', '3-sweetness-war', [1200, 800], 'Sweetness War', { x: 1.05, w: 1.35, y: 1.8 }),
  pic('index', '4-sweetness-index', [1200, 800], 'Sweetness Index: Off the Charts!', { x: 3.2, w: 1.35, y: 1.8 }),
];
/** A picture's height on the wall (metres): its width, in its own shape. */
export const heightOf = (p: Picture): number => p.w * p.px[1] / p.px[0];
/** What she says of a picture (by its id), as you stand looking at it, or under it in the close view. Null for
    anything else. */
export const pictureLine = (id: string): string | null => (ON_A_PICTURE as Record<string, string>)[id] ?? null;
/** Her sign, over her knighting: who lives here. */
export const SIGN = { text: 'Affame, Queen of Sweetness', x: -1.1, w: 2.1, h: 0.42, y: 3.15 } as const;

// ---------- her furniture, her cushions and her teddies ----------
/** Her cushion corner, at the back on the left, under its picture: a heap of cushions (js/den/cuddly.js's
    cushions) you walk round, and come up to (within `near` of its middle) to sink into. */
export const NOOK = { x: -3.3, z: -1.95, near: 1.55 } as const;
/** The heap's mound: `r` from its middle, `h` high there (js/den/cuddly.js's cushions). */
export const HEAP = { r: 0.8, h: 0.32 } as const;
/** How high the heap's top is at (x, z) (0 off it). */
export function heapTop(x: number, z: number): number {
  const d = Math.hypot(x - NOOK.x, z - NOOK.z) / HEAP.r;
  return d >= 1 ? 0 : HEAP.h * Math.sqrt(1 - d * d);
}
/** Her table of pastries, at the back on the right. */
export const TABLE = { x: 2.2, z: -1.65 } as const;
/** A piece as Piece, and how big (`s`: a teddy's, times a small one's). */
export type Placed = Piece & { s?: number };
export const FURNISH: readonly Placed[] = [
  { kind: 'rug', x: 0, z: 0.3, col: '#d77fa1' },
  { kind: 'cushions', x: NOOK.x, z: NOOK.z },
  { kind: 'table', x: TABLE.x, z: TABLE.z },
  { kind: 'armchair', x: 3.7, z: 0.7, yaw: -2.3, col: '#e58fb0' },
  { kind: 'armchair', x: -3.6, z: 1.2, yaw: 2.3, col: '#e58fb0' },
  { kind: 'candelabra', x: 0.0, z: BACK + 0.3 },
  // A big teddy sitting up by the armchair on the right, as in her picture.
  { kind: 'teddy', x: 4.1, z: -0.7, yaw: -0.9, col: '#8a5a34', s: 1.8 },
];
/** The teddies (and a bunny) on her cushions, as in "Cushions and Teddies": where each sits (`y`: how high,
    sat in the heap), turned `yaw`, how big (`s`), in its colour. Room left in front for you to sink in. */
export interface Teddy { kind: 'bear' | 'bunny'; x: number; z: number; y: number; yaw: number; s: number; col: string }
const sitting = (kind: Teddy['kind'], dx: number, dz: number, yaw: number, s: number, col: string): Teddy =>
  ({ kind, x: NOOK.x + dx, z: NOOK.z + dz, y: Math.max(0, heapTop(NOOK.x + dx, NOOK.z + dz) - 0.05), yaw, s, col });
export const TEDDIES: readonly Teddy[] = [
  sitting('bear', -0.42, -0.15, 0.45, 1.0, '#8a5a34'),
  sitting('bear', 0.55, 0.05, -0.5, 0.75, '#c08a4e'),
  sitting('bunny', -0.5, 0.42, 0.35, 0.75, '#f3e6d0'),
  sitting('bear', 0.1, -0.5, -0.1, 0.6, '#d9a36a'),
  sitting('bear', 0.55, 0.5, -0.7, 0.55, '#a8a39a'),
];

// ---------- the tour ----------
/** Her tour, stop by stop: where you have to come to (`at`, within `near`) for her to say a stop's lines, and
    where she waits for you there (`her`). Walk ahead of her and she skips on with you. */
export type TourStop = 'wall' | 'nook';
export interface Stop { id: TourStop; at: { x: number; z: number }; near: number; her: { x: number; z: number } }
export const TOUR: readonly Stop[] = [
  { id: 'wall', at: { x: 0, z: -0.4 }, near: 1.9, her: { x: 1.3, z: -1.3 } },
  { id: 'nook', at: { x: NOOK.x + 1.0, z: NOOK.z + 1.4 }, near: 1.2, her: { x: NOOK.x + 1.9, z: NOOK.z + 0.9 } },
];
/** The stop to say next: the furthest from `from` on that you're at (so walking ahead skips her on), or -1 if
    you're at none of them. */
export function stopAt(from: number, x: number, z: number): number {
  for (let i = TOUR.length - 1; i >= Math.max(0, from); i--) {
    const s = TOUR[i];
    if (Math.hypot(x - s.at.x, z - s.at.z) < s.near) return i;
  }
  return -1;
}

// ---------- sinking into her cushions ----------
/* Her kind thing to do (as Roobear's Robert roobs your ear and Dachimpy hugs you at the door): walk up to her
   cushion corner and Space, and you sink into the cushions among the teddies, sat deep in them, eyes shut and smiling,
   a moment's peace as in her picture; your line; then up again where you were, and her line. While it lasts you
   stay put. `at`: where you sink in (the heap's front, facing out to the room); `depth`: how far you sink (metres);
   `ease`: how long sinking in, or coming up, takes; `secs`: how long it all lasts; `said`: when you say yours. */
export const SINK = { at: { x: NOOK.x + 0.05, z: NOOK.z + 0.35 }, depth: 0.45, ease: 0.6, secs: 3.4, said: 1.3 } as const;
/** Close enough to her cushions to sink in? */
export const atNook = (you: { x: number; z: number }): boolean => Math.hypot(you.x - NOOK.x, you.z - NOOK.z) < NOOK.near;
/** How far sunk in you are (metres), `t` seconds in: easing down, staying, easing up again by the end. */
export function sunk(t: number): number {
  const ease = (u: number) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
  return SINK.depth * Math.min(ease(t / SINK.ease), ease((SINK.secs - t) / SINK.ease));
}
