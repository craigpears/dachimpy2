/* Pirate Den: Dachimpy's house, which doubles as a museum, in the den's housing district (src/den-houses.ts).
   TypeScript, compiled to js/den-dachimpy.js; tested in tests/den-dachimpy.test.ts. js/den/dachimpy-house.js
   plays it in the house shell (js/den/house.js), placing the shared furniture (js/den/furniture.js) where
   FURNISH says, hanging the exhibits where EXHIBITS and hang() say and the friends' portraits
   (js/den/portraits.js) where FRIENDS says. Their lines and plaques are in src/lines/dachimpy.ts.

   Dachimpy is the user's own pirate (they/them). The user (11 Nov): "I'd love ... a museum of the really
   old school first versions of the blockade simulator and dachimpy.com"; then "maybe it could just be my
   own house ... showing off some beloved memories"; "It very much fits me, kind of just ... showing you
   around all the history of the things that I've built. They are my pride and joy"; and "I'm very well
   known for giving just like hugs and cookies ... anyone that comes into my house ... I need to give them
   cookies." And the tribute: "my trinkets and portraits ... my beloved friends, and certainly the
   special, really special, truly special ones." (IDEAS.md, "A museum, in Dachimpy's house".) Built 13 Nov.

   So: three rooms in a row. The hall, where Dachimpy hugs you at the door and gives you a cookie (every
   visit; more from the plate on the table), the Dachimpy.com banner over it all, the videos' title card,
   and where it all began. The museum, the user's own screenshots of the old Blockade Simulator framed
   along its wall, oldest first, each with a plaque in Dachimpy's voice, a panel of story where there's no
   picture, and a little model of the sim's board whose sloop now and then spins into the rocks. And their
   friends' room: the real pirates already in the den, the truly special ones in the middle, a shelf of
   trinkets, and a thank-you. Dachimpy walks you round, and tells you about whatever you stop by. */
import type { Plan, Piece, Portrait, Block } from './den-houses.js';
import { walkable } from './den-houses.js';
import { ON_AN_EXHIBIT, ON_A_FRIEND, FRIEND_TITLES } from './lines/dachimpy.js';

// ---------- the house ----------
/** The hall's back wall, the museum's start and length, and the friends' room after it (metres). */
const M0 = 4.5;
/** How long the museum is: room for every exhibit, a step at either end. */
export const MUSEUM_LEN = 25;
const M1 = M0 + MUSEUM_LEN, F1 = M1 + 14;
/** Three rooms in a row, the camera looking in from the front (their front walls cut low, a doll's house):
    the hall you come in at, the museum, and their friends' room. */
export const PLAN: Plan = {
  rooms: [
    { id: 'hall', name: 'The hall', x0: -4.5, x1: M0, z0: -3, z1: 3, paper: '#4a2b3e' },
    { id: 'museum', name: 'The museum', x0: M0, x1: M1, z0: -2, z1: 2.2, paper: '#1f3a52' },
    { id: 'friends', name: 'The friends\' room', x0: M1, x1: F1, z0: -3, z1: 3, paper: '#3d2c4a' },
  ],
  doors: [
    { x0: M0 - 0.5, x1: M0 + 0.5, z0: -0.9, z1: 0.9 },
    { x0: M1 - 0.5, x1: M1 + 0.5, z0: -0.9, z1: 0.9 },
  ],
  out: { x: 0, z: 2.35, r: 0.9 },
};
/** Where you come in (just inside the front door), and where Dachimpy meets you. */
export const ARRIVE = { you: { x: 0, z: 2.0 }, them: { x: 1.0, z: 0.9 } } as const;
/** Tall walls, for the banner over the hall. */
export const WALLS = { high: 3.6, low: 0.45 } as const;
const HALL = PLAN.rooms[0], MUSEUM = PLAN.rooms[1], FROOM = PLAN.rooms[2];
/** How far out from a room's back wall its pictures hang (the wall's thickness). */
export const WALL_T = 0.2;

// ---------- the exhibits ----------
/* The user's own screenshots (notes/museum/, numbered oldest first), published as museum/*.jpg, sized for the
   web, one cropped where it showed someone else's name: each framed with a plaque (src/lines/dachimpy.ts's
   PLAQUES). And three panels of story where there's no picture (PANELS): where it began, the first version
   (an HTML page of links: no screenshot kept), and how it ended. */
export interface Shot { id: keyof typeof ON_AN_EXHIBIT; kind: 'shot'; file: string; px: readonly [number, number]; title: string }
export interface Panel { id: keyof typeof ON_AN_EXHIBIT; kind: 'panel'; title: string }
export type Exhibit = Shot | Panel;
const shot = (id: Shot['id'], file: string, w: number, h: number, title: string): Shot => ({ id, kind: 'shot', file: `museum/${file}.jpg`, px: [w, h], title });
const panel = (id: Panel['id'], title: string): Panel => ({ id, kind: 'panel', title });
/** Everything on show, in the order you meet it: the hall's three, the museum's, oldest first. */
export const EXHIBITS: readonly Exhibit[] = [
  panel('began', 'Where It All Began'),
  shot('titleCard', '11-title-card', 640, 480, 'The Title Card'),
  shot('banner', '12-header-banner', 902, 137, 'Dachimpy.com'),
  panel('guide', 'Version One: the Bnav Guide'),
  shot('first', '01-first-prototype', 379, 582, 'The First Prototype'),
  shot('beforeWhirled', '02-before-whirled-board', 766, 664, 'Before Whirled'),
  shot('jobbers', '03-before-whirled-new-game', 592, 423, 'Jobbers per Turn'),
  shot('wireframe', '04-game-setup-wireframe', 711, 573, 'Game Setup, a Wireframe'),
  shot('lobby', '05-blockade-sim-lobby', 800, 501, 'The Blockade Sim Lobby'),
  shot('teams', '06-lobby-teams', 239, 203, 'Team One'),
  shot('create', '07-create-your-game', 325, 228, 'Create Your Game'),
  shot('inPlay', '08-blockade-in-play', 799, 499, 'Blockade!'),
  shot('rotations', '09-sloop-rotations', 692, 156, 'A Sloop for Every Heading'),
  shot('rings', '10-sloop-rings', 285, 200, 'The Sloops, Round'),
  panel('gone', 'And Then'),
];
/** A panel's page, as painted: portrait, as a portrait's canvas is (4:5). */
export const PAGE = { w: 0.9, h: 1.125 } as const;
/** The biggest a screenshot's frame is (metres), and where its middle hangs. */
export const SHOT_MAX = { w: 1.7, h: 1.1, y: 2.0 } as const;
/** How big a screenshot hangs: as wide as it can be, its own shape, within SHOT_MAX. */
export function shotSize(px: readonly [number, number]): { w: number; h: number } {
  const a = px[0] / px[1], w = Math.min(SHOT_MAX.w, SHOT_MAX.h * a);
  return { w, h: w / a };
}
/** A frame on a back wall: in which room, where along it (`x`), its picture's size (`w`, `h`), and how high
    its middle (`y`); `wall`: the wall's face (z). `card`: the plaque under it (x, y its middle; w, h), if any. */
export interface Hung { room: string; x: number; y: number; w: number; h: number; wall: number; card: { x: number; y: number; w: number; h: number } | null }
/** A frame's gilt round its picture (furniture.js's frame: 0.11 ornate, 0.07 plain). */
export const FRAME_T = 0.07;
/** Where its plaque hangs: just under its frame. */
const cardUnder = (x: number, y: number, w: number, h: number) => {
  const cw = Math.max(0.8, Math.min(1.0, w)), ch = 0.42;
  return { x, y: y - h / 2 - FRAME_T - 0.06 - ch / 2, w: cw, h: ch };
};
/** Where each exhibit hangs, by id: the hall's three along its back wall (the banner high over them, its
    plaque to the right), then the museum's, oldest first, a frame and its plaque at a time. */
export function hang(): Record<string, Hung> {
  const out: Record<string, Hung> = {};
  const hallZ = HALL.z0 + WALL_T, musZ = MUSEUM.z0 + WALL_T;
  const tc = shotSize([640, 480]), tcW = 1.15, tcH = tcW * tc.h / tc.w;
  out.titleCard = { room: 'hall', x: -2.6, y: 1.92, w: tcW, h: tcH, wall: hallZ, card: cardUnder(-2.6, 1.92, tcW, tcH) };
  out.began = { room: 'hall', x: 0, y: 1.75, w: PAGE.w * 1.05, h: PAGE.h * 1.05, wall: hallZ, card: null };
  const bW = 3.2, bH = bW * 137 / 902;
  out.banner = { room: 'hall', x: 0, y: 2.95, w: bW, h: bH, wall: hallZ, card: { x: 2.6, y: 1.75, w: 1.0, h: 0.42 } };
  let x = MUSEUM.x0 + 1.2;
  for (const e of EXHIBITS) {
    if (out[e.id]) continue;
    const s = e.kind === 'shot' ? shotSize(e.px) : PAGE, cw = e.kind === 'shot' ? cardUnder(0, 0, s.w, s.h).w : 0;
    const half = Math.max(s.w, cw) / 2;
    x += half;
    const y = e.kind === 'shot' ? SHOT_MAX.y : 1.85;
    out[e.id] = { room: 'museum', x, y, w: s.w, h: s.h, wall: musZ, card: e.kind === 'shot' ? cardUnder(x, y, s.w, s.h) : null };
    x += half + 0.55;
  }
  return out;
}
/** What Dachimpy says of an exhibit or a friend's portrait (by its id), as you stand looking at it, or under
    it in the close view. Null for anything else. */
export const exhibitLine = (id: string): string | null => (ON_AN_EXHIBIT as Record<string, string>)[id] ?? (ON_A_FRIEND as Record<string, string>)[id] ?? null;

// ---------- the friends' room ----------
/* Their friends on the wall (the real pirates already in the den, each from their look in PIRATES: pirate
   names only), the truly special ones in the middle, bigger, under a sign of their own: Kikkit, Zizzy and Sanne
   (Zizzy and Sanne not drawn: their portraits are still to check, so a page each with their name on it). Then a
   page of thanks to everyone who makes Puzzle Pirates what it is. */
export type FriendId = keyof typeof FRIEND_TITLES;
export interface Friend { id: FriendId; title: string; x: number; y: number; w: number; h: number; special?: boolean; portrait?: Portrait; page?: 'zizzy' | 'sanne' | 'thanks' }
const FC = (M1 + F1) / 2, SMALL = { w: 0.72, h: 0.9, y: 1.75 }, BIG = { w: 1.05, h: 1.31, y: 1.8 };
const friend = (id: FriendId, x: number, o: Partial<Friend>): Friend => ({ id, title: FRIEND_TITLES[id], x, ...SMALL, ...o });
const sat = (name: string, backdrop: Portrait['backdrop']): Portrait => ({ id: name.toLowerCase(), title: name, backdrop, sitter: { who: 'pirate', name } });
export const FRIENDS: readonly Friend[] = [
  friend('dalnoth', FC - 5.9, { portrait: sat('Dalnoth', 'sea') }),
  friend('dignity', FC - 4.9, { portrait: sat('Dignity', 'den') }),
  friend('mischievious', FC - 3.9, { portrait: sat('Mischievious', 'cafe') }),
  friend('gravee', FC - 2.9, { portrait: sat('Gravee', 'crypt') }),
  friend('kikkit', FC - 1.45, { ...BIG, special: true, portrait: sat('Kikkit', 'beach') }),
  friend('zizzy', FC, { ...BIG, special: true, page: 'zizzy' }),
  friend('sanne', FC + 1.45, { ...BIG, special: true, page: 'sanne' }),
  friend('tzz', FC + 2.9, { portrait: sat('Tzz', 'autumn') }),
  friend('helium', FC + 3.9, { portrait: sat('Helium', 'night') }),
  friend('roobear', FC + 4.9, { portrait: sat('Roobear', 'pinksea') }),
  friend('thanks', FC + 5.9, { page: 'thanks' }),
];
/** The friends' wall (its face's z). */
export const FRIENDS_WALL = FROOM.z0 + WALL_T;
/** The sign over the truly special ones. */
export const SPECIAL_SIGN = { x: FC, w: 2.4, h: 0.42, y: 2.95 } as const;

// ---------- the furniture ----------
/** The cookie plate, on the hall's table: walk up to it for another. */
export const COOKIES = { x: 2.7, z: -1.6, near: 1.35 } as const;
/** The little model of the old sim's board, in front of "Blockade!" (its sloop spinning into the rocks now
    and then: furniture.js's simModel). */
export const MODEL = { z: 1.15 } as const;
/** Their trinkets' shelf, against the friends' room's right-hand wall. */
export const SHELF = { x: F1 - 0.45, z: -1.7, yaw: -Math.PI / 2 } as const;
export function furnish(): Piece[] {
  const H = hang();
  return [
    // The hall: a rug, an armchair, the cookie table, candles either side of where it began.
    { kind: 'rug', x: 0, z: 0.3, col: '#7a3a5c' },
    { kind: 'armchair', x: -3.4, z: -0.9, yaw: 0.8, col: '#c46a8f' },
    { kind: 'table', x: COOKIES.x, z: COOKIES.z },
    { kind: 'candelabra', x: -1.0, z: HALL.z0 + 0.45 },
    { kind: 'candelabra', x: 1.0, z: HALL.z0 + 0.45 },
    // The museum: a runner down it, and the model of the sim's board by "Blockade!".
    { kind: 'runner', x: (MUSEUM.x0 + MUSEUM.x1) / 2, z: 0.35, col: '#2a5a7a' },
    { kind: 'simModel', x: H.inPlay.x, z: MODEL.z, yaw: Math.PI },
    // The friends' room: a rug, candles either side of the truly special ones, a chair, the trinkets' shelf.
    { kind: 'rug', x: FC, z: 0.5, col: '#5b2c6f' },
    { kind: 'candelabra', x: FC - 2.28, z: FROOM.z0 + 0.45 },
    { kind: 'candelabra', x: FC + 2.28, z: FROOM.z0 + 0.45 },
    { kind: 'armchair', x: FC - 5.2, z: 1.4, yaw: 2.4, col: '#c46a8f' },
    { kind: 'shelf', x: SHELF.x, z: SHELF.z, yaw: SHELF.yaw },
  ];
}
export const FURNISH: readonly Piece[] = furnish();

// ---------- the tour ----------
/** Their tour, stop by stop: where you have to come to (`at`, within `near`) for them to say a stop's
    lines, and where they wait for you there (`them`). Walk ahead and they skip on with you. */
export type TourStop = 'hall' | 'museum' | 'friends';
export interface Stop { id: TourStop; at: { x: number; z: number }; near: number; them: { x: number; z: number } }
export const TOUR: readonly Stop[] = [
  { id: 'hall', at: { x: 0, z: -0.7 }, near: 1.8, them: { x: 1.4, z: -1.5 } },
  { id: 'museum', at: { x: MUSEUM.x0 + 1.6, z: 0 }, near: 1.6, them: { x: MUSEUM.x0 + 2.6, z: 1.0 } },
  { id: 'friends', at: { x: M1 + 1.6, z: 0 }, near: 1.6, them: { x: M1 + 2.8, z: 1.0 } },
];
/** The stop to say next: the furthest from `from` on that you're at (so walking ahead skips them on), or -1
    if you're at none of them. */
export function stopAt(from: number, x: number, z: number): number {
  for (let i = TOUR.length - 1; i >= Math.max(0, from); i--) {
    const s = TOUR[i];
    if (Math.hypot(x - s.at.x, z - s.at.z) < s.near) return i;
  }
  return -1;
}

// ---------- a hug and a cookie at the door ----------
/* Every visit, at the door: a hug first, then a cookie (IDEAS.md, "Cookies and hugs at the door"). They come
   to your side, face you and hug you, your eyes shut, a moment; then hold out a plate of cookies, you take
   one, and they take you on into the museum. While it lasts you stand still. `side`: how far to your side
   they stand to hug; `secs`: how long the hug lasts; `said`: when you say yours. */
export const HUG = { side: 0.62, secs: 3.0, said: 1.2 } as const;
/** The cookie's beats, seconds from when they hold out the plate: yours, and the end. */
export const COOKIE = { said: 1.2, done: 2.4 } as const;
/** Where they stand to hug you: beside you, to your left if there's room, else your right (`side`: -1 left,
    +1 right), facing you (`yaw`: 0 faces +z); you turned to face them (`youYaw`). */
export function hugSpot(plan: Plan, you: { x: number; z: number }, blocks: readonly Block[] = []): { x: number; z: number; yaw: number; youYaw: number; side: number } {
  const clear = (x: number, z: number) => walkable(plan, x, z) && blocks.every((b) => Math.hypot(x - b.x, z - b.z) > b.r + 0.3);
  for (const s of [-1, 1]) {
    const x = you.x + s * HUG.side;
    if (clear(x, you.z)) return { x, z: you.z, yaw: -s * Math.PI / 2, youYaw: s * Math.PI / 2, side: s };
  }
  return { x: you.x, z: you.z - HUG.side, yaw: 0, youYaw: Math.PI, side: 0 };
}
/** Close enough to the cookie plate to ask for another. */
export const atCookies = (you: { x: number; z: number }): boolean => Math.hypot(you.x - COOKIES.x, you.z - COOKIES.z) < COOKIES.near;
