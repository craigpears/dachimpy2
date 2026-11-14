import { ON_A_PICTURE } from './lines/affame.js';
// ---------- the house ----------
/** One room, the camera looking in from the front (its front wall cut low, a doll's house), papered rose. */
export const PLAN = {
    rooms: [{ id: 'room', name: 'The Sweet Spot', x0: -4.8, x1: 4.8, z0: -3, z1: 3, paper: '#7a3d5c' }],
    doors: [],
    out: { x: 0, z: 2.35, r: 0.9 },
};
/** Where you come in (just inside the front door), and where she meets you. */
export const ARRIVE = { you: { x: 0, z: 2.0 }, her: { x: 1.1, z: 0.9 } };
export const WALLS = { high: 3.6, low: 0.45 };
const ROOM = PLAN.rooms[0];
/** How far out from the back wall her pictures hang (the wall's thickness). */
export const WALL_T = 0.2;
/** The back wall's face (z). */
export const BACK = ROOM.z0 + WALL_T;
const pic = (id, file, px, title, at) => ({ id, file: `houses/affame/${file}.jpg`, px, title, ...at });
/** Left to right: the cushions over her cushion corner; her knighting, the biggest, under her sign; the
    Sweetness War; the Sweetness Index. */
export const PICTURES = [
    pic('cushions', '2-cushions-and-teddies', [1200, 800], 'Cushions and Teddies', { x: -3.2, w: 1.35, y: 1.8 }),
    pic('dame', '1-dame-of-everlasting-sweetness', [800, 1200], 'Dame of Everlasting Sweetness', { x: -1.1, w: 1.0, y: 1.85, big: true }),
    pic('war', '3-sweetness-war', [1200, 800], 'Sweetness War', { x: 1.05, w: 1.35, y: 1.8 }),
    pic('index', '4-sweetness-index', [1200, 800], 'Sweetness Index: Off the Charts!', { x: 3.2, w: 1.35, y: 1.8 }),
];
/** A picture's height on the wall (metres): its width, in its own shape. */
export const heightOf = (p) => p.w * p.px[1] / p.px[0];
/** What she says of a picture (by its id), as you stand looking at it, or under it in the close view. Null for
    anything else. */
export const pictureLine = (id) => ON_A_PICTURE[id] ?? null;
/** Her sign, over her knighting: who lives here. */
export const SIGN = { text: 'Affame, Queen of Sweetness', x: -1.1, w: 2.1, h: 0.42, y: 3.15 };
// ---------- her furniture, her cushions and her teddies ----------
/** Her cushion corner, at the back on the left, under its picture: a heap of cushions (js/den/cuddly.js's
    cushions) you walk round, and come up to (within `near` of its middle) to sink into. */
export const NOOK = { x: -3.3, z: -1.95, near: 1.55 };
/** The heap's mound: `r` from its middle, `h` high there (js/den/cuddly.js's cushions). */
export const HEAP = { r: 0.8, h: 0.32 };
/** How high the heap's top is at (x, z) (0 off it). */
export function heapTop(x, z) {
    const d = Math.hypot(x - NOOK.x, z - NOOK.z) / HEAP.r;
    return d >= 1 ? 0 : HEAP.h * Math.sqrt(1 - d * d);
}
/** Her table of pastries, at the back on the right. */
export const TABLE = { x: 2.2, z: -1.65 };
export const FURNISH = [
    { kind: 'rug', x: 0, z: 0.3, col: '#d77fa1' },
    { kind: 'cushions', x: NOOK.x, z: NOOK.z },
    { kind: 'table', x: TABLE.x, z: TABLE.z },
    { kind: 'armchair', x: 3.7, z: 0.7, yaw: -2.3, col: '#e58fb0' },
    { kind: 'armchair', x: -3.6, z: 1.2, yaw: 2.3, col: '#e58fb0' },
    { kind: 'candelabra', x: 0.0, z: BACK + 0.3 },
    // A big teddy sitting up by the armchair on the right, as in her picture.
    { kind: 'teddy', x: 4.1, z: -0.7, yaw: -0.9, col: '#8a5a34', s: 1.8 },
];
const sitting = (kind, dx, dz, yaw, s, col) => ({ kind, x: NOOK.x + dx, z: NOOK.z + dz, y: Math.max(0, heapTop(NOOK.x + dx, NOOK.z + dz) - 0.05), yaw, s, col });
export const TEDDIES = [
    sitting('bear', -0.42, -0.15, 0.45, 1.0, '#8a5a34'),
    sitting('bear', 0.55, 0.05, -0.5, 0.75, '#c08a4e'),
    sitting('bunny', -0.5, 0.42, 0.35, 0.75, '#f3e6d0'),
    sitting('bear', 0.1, -0.5, -0.1, 0.6, '#d9a36a'),
    sitting('bear', 0.55, 0.5, -0.7, 0.55, '#a8a39a'),
];
export const TOUR = [
    { id: 'wall', at: { x: 0, z: -0.4 }, near: 1.9, her: { x: 1.3, z: -1.3 } },
    { id: 'nook', at: { x: NOOK.x + 1.0, z: NOOK.z + 1.4 }, near: 1.2, her: { x: NOOK.x + 1.9, z: NOOK.z + 0.9 } },
];
/** The stop to say next: the furthest from `from` on that you're at (so walking ahead skips her on), or -1 if
    you're at none of them. */
export function stopAt(from, x, z) {
    for (let i = TOUR.length - 1; i >= Math.max(0, from); i--) {
        const s = TOUR[i];
        if (Math.hypot(x - s.at.x, z - s.at.z) < s.near)
            return i;
    }
    return -1;
}
// ---------- sinking into her cushions ----------
/* Her kind thing to do (as Roobear's Robert roobs your ear and Dachimpy hugs you at the door): walk up to her
   cushion corner and Space, and you sink into the cushions among the teddies, sat deep in them, eyes shut and smiling,
   a moment's peace as in her picture; your line; then up again where you were, and her line. While it lasts you
   stay put. `at`: where you sink in (the heap's front, facing out to the room); `depth`: how far you sink (metres);
   `ease`: how long sinking in, or coming up, takes; `secs`: how long it all lasts; `said`: when you say yours. */
export const SINK = { at: { x: NOOK.x + 0.05, z: NOOK.z + 0.35 }, depth: 0.45, ease: 0.6, secs: 3.4, said: 1.3 };
/** Close enough to her cushions to sink in? */
export const atNook = (you) => Math.hypot(you.x - NOOK.x, you.z - NOOK.z) < NOOK.near;
/** How far sunk in you are (metres), `t` seconds in: easing down, staying, easing up again by the end. */
export function sunk(t) {
    const ease = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
    return SINK.depth * Math.min(ease(t / SINK.ease), ease((SINK.secs - t) / SINK.ease));
}
