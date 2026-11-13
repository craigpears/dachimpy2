import { walkable } from './den-houses.js';
import { ON_AN_EXHIBIT, ON_A_FRIEND, FRIEND_TITLES } from './lines/dachimpy.js';
// ---------- the house ----------
/** The hall's back wall, the museum's start and length, and the friends' room after it (metres). */
const M0 = 4.5;
/** How long the museum is: room for every exhibit, a step at either end. */
export const MUSEUM_LEN = 25;
const M1 = M0 + MUSEUM_LEN, F1 = M1 + 16;
/** Three rooms in a row, the camera looking in from the front (their front walls cut low, a doll's house):
    the hall you come in at, the museum, and their friends' room. */
export const PLAN = {
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
export const ARRIVE = { you: { x: 0, z: 2.0 }, them: { x: 1.0, z: 0.9 } };
/** Tall walls, for the banner over the hall. */
export const WALLS = { high: 3.6, low: 0.45 };
const HALL = PLAN.rooms[0], MUSEUM = PLAN.rooms[1], FROOM = PLAN.rooms[2];
/** How far out from a room's back wall its pictures hang (the wall's thickness). */
export const WALL_T = 0.2;
const shot = (id, file, w, h, title) => ({ id, kind: 'shot', file: `museum/${file}.jpg`, px: [w, h], title });
const panel = (id, title) => ({ id, kind: 'panel', title });
/** Everything on show, in the order you meet it: the hall's three, the museum's, oldest first. */
export const EXHIBITS = [
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
export const PAGE = { w: 0.9, h: 1.125 };
/** The biggest a screenshot's frame is (metres), and where its middle hangs. */
export const SHOT_MAX = { w: 1.7, h: 1.1, y: 2.0 };
/** How big a screenshot hangs: as wide as it can be, its own shape, within SHOT_MAX. */
export function shotSize(px) {
    const a = px[0] / px[1], w = Math.min(SHOT_MAX.w, SHOT_MAX.h * a);
    return { w, h: w / a };
}
/** A frame's gilt round its picture (furniture.js's frame: 0.11 ornate, 0.07 plain). */
export const FRAME_T = 0.07;
/** Where its plaque hangs: just under its frame. */
const cardUnder = (x, y, w, h) => {
    const cw = Math.max(0.8, Math.min(1.0, w)), ch = 0.42;
    return { x, y: y - h / 2 - FRAME_T - 0.06 - ch / 2, w: cw, h: ch };
};
/** Where each exhibit hangs, by id: the hall's three along its back wall (the banner high over them, its
    plaque to the right), then the museum's, oldest first, a frame and its plaque at a time. */
export function hang() {
    const out = {};
    const hallZ = HALL.z0 + WALL_T, musZ = MUSEUM.z0 + WALL_T;
    const tc = shotSize([640, 480]), tcW = 1.15, tcH = tcW * tc.h / tc.w;
    out.titleCard = { room: 'hall', x: -2.6, y: 1.92, w: tcW, h: tcH, wall: hallZ, card: cardUnder(-2.6, 1.92, tcW, tcH) };
    out.began = { room: 'hall', x: 0, y: 1.75, w: PAGE.w * 1.05, h: PAGE.h * 1.05, wall: hallZ, card: null };
    const bW = 3.2, bH = bW * 137 / 902;
    out.banner = { room: 'hall', x: 0, y: 2.95, w: bW, h: bH, wall: hallZ, card: { x: 2.6, y: 1.75, w: 1.0, h: 0.42 } };
    let x = MUSEUM.x0 + 1.2;
    for (const e of EXHIBITS) {
        if (out[e.id])
            continue;
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
export const exhibitLine = (id) => ON_AN_EXHIBIT[id] ?? ON_A_FRIEND[id] ?? null;
const FC = (M1 + F1) / 2, SMALL = { w: 0.72, h: 0.9, y: 1.75 }, BIG = { w: 1.05, h: 1.31, y: 1.8 };
const friend = (id, x, o) => ({ id, title: FRIEND_TITLES[id], x, ...SMALL, ...o });
/** A friend's portrait: them (their look in PIRATES, `dress` over it), and Dachimpy beside them if they
    shared it (`with`: Dachimpy's look, dressed for that sitting). */
const sat = (name, backdrop, o = {}) => ({
    id: name.toLowerCase(), title: name, backdrop,
    sitter: { who: 'pirate', name, ...(o.dress ? { dress: o.dress } : {}), ...(o.with ? { company: [{ kind: 'pirate', name: 'Dachimpy', look: o.with, x: -0.78, z: -0.1, yaw: 0.35 }] } : {}) },
});
/** Dachimpy in "Monkey Couple" (2007): in red to match her, a white sash, curls, a monkey. */
export const IN_RED = { hat: 'none', hair: 'curly', hairCol: 'dark brown', top: 'sash', topCol: 'red', topCol2: 'white', waist: 'none', legs: 'pants', legsCol: 'red', bareLegs: false, feet: 'boots', feetCol: 'red', fam: 'monkey', famCol: 'brown' };
/** Dachimpy as they are (the pink beehive, the kilt and braces), beside whoever they sat with. */
const AS_THEY_ARE = {};
export const FRIENDS = [
    friend('dalnoth', FC - 6.9, { portrait: sat('Dalnoth', 'sea') }),
    friend('dignity', FC - 5.9, { portrait: sat('Dignity', 'den') }),
    friend('mischievious', FC - 4.9, { portrait: sat('Mischievious', 'cafe') }),
    friend('monkeyMan', FC - 3.9, { portrait: sat('Dachimpy', 'beach', { dress: { fam: 'monkey', famCol: 'brown' } }) }),
    friend('gravee', FC - 2.9, { portrait: sat('Gravee', 'sea', { with: AS_THEY_ARE }) }),
    friend('kikkit', FC - 1.45, { ...BIG, special: true, portrait: sat('Kikkit', 'pinksea', { with: AS_THEY_ARE }) }),
    friend('zizzy', FC, { ...BIG, special: true, portrait: sat('Zizzy', 'night', { with: AS_THEY_ARE }) }),
    friend('sanne', FC + 1.45, { ...BIG, special: true, portrait: sat('Sanne', 'beach', { with: IN_RED }) }),
    friend('tzz', FC + 2.9, { portrait: sat('Tzz', 'autumn') }),
    friend('helium', FC + 3.9, { portrait: sat('Helium', 'night') }),
    friend('roobear', FC + 4.9, { portrait: sat('Roobear', 'pinksea') }),
    friend('welcomeBack', FC + 5.9, { page: 'welcomeBack' }),
    friend('thanks', FC + 6.9, { page: 'thanks' }),
];
/** The friends' wall (its face's z). */
export const FRIENDS_WALL = FROOM.z0 + WALL_T;
/** The sign over the truly special ones. */
export const SPECIAL_SIGN = { x: FC, w: 2.4, h: 0.42, y: 2.95 };
// ---------- the furniture ----------
/** The cookie plate, on the hall's table: walk up to it for another. */
export const COOKIES = { x: 2.7, z: -1.6, near: 1.35 };
/** The little model of the old sim's board, in front of "Blockade!" (its sloop spinning into the rocks now
    and then: furniture.js's simModel). */
export const MODEL = { z: 1.15 };
/** Their trinkets' shelf, against the friends' room's right-hand wall. */
export const SHELF = { x: F1 - 0.45, z: -1.7, yaw: -Math.PI / 2 };
export function furnish() {
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
export const FURNISH = furnish();
export const TOUR = [
    { id: 'hall', at: { x: 0, z: -0.7 }, near: 1.8, them: { x: 1.4, z: -1.5 } },
    { id: 'museum', at: { x: MUSEUM.x0 + 1.6, z: 0 }, near: 1.6, them: { x: MUSEUM.x0 + 2.6, z: 1.0 } },
    { id: 'friends', at: { x: M1 + 1.6, z: 0 }, near: 1.6, them: { x: M1 + 2.8, z: 1.0 } },
];
/** The stop to say next: the furthest from `from` on that you're at (so walking ahead skips them on), or -1
    if you're at none of them. */
export function stopAt(from, x, z) {
    for (let i = TOUR.length - 1; i >= Math.max(0, from); i--) {
        const s = TOUR[i];
        if (Math.hypot(x - s.at.x, z - s.at.z) < s.near)
            return i;
    }
    return -1;
}
// ---------- a hug and a cookie at the door ----------
/* Every visit, at the door: a hug first, then a cookie (IDEAS.md, "Cookies and hugs at the door"). They come
   to your side, face you and hug you, your eyes shut, a moment; then hold out a plate of cookies, you take
   one, and they take you on into the museum. While it lasts you stand still. `side`: how far to your side
   they stand to hug; `secs`: how long the hug lasts; `said`: when you say yours. */
export const HUG = { side: 0.62, secs: 3.0, said: 1.2 };
/** The cookie's beats, seconds after their line about it's been up long enough to read (so the two never talk over
    each other): yours, and the end. */
export const COOKIE = { said: 0.1, done: 1.8 };
/** Where they stand to hug you: beside you, to your left if there's room, else your right (`side`: -1 left,
    +1 right), facing you (`yaw`: 0 faces +z); you turned to face them (`youYaw`). */
export function hugSpot(plan, you, blocks = []) {
    const clear = (x, z) => walkable(plan, x, z) && blocks.every((b) => Math.hypot(x - b.x, z - b.z) > b.r + 0.3);
    for (const s of [-1, 1]) {
        const x = you.x + s * HUG.side;
        if (clear(x, you.z))
            return { x, z: you.z, yaw: -s * Math.PI / 2, youYaw: s * Math.PI / 2, side: s };
    }
    return { x: you.x, z: you.z - HUG.side, yaw: 0, youYaw: Math.PI, side: 0 };
}
/** Close enough to the cookie plate to ask for another. */
export const atCookies = (you) => Math.hypot(you.x - COOKIES.x, you.z - COOKIES.z) < COOKIES.near;
