import { walkable } from './den-houses.js';
import { ON_AN_EXHIBIT, ON_A_FRIEND, FRIEND_TITLES } from './lines/dachimpy.js';
const shot = (id, file, w, h, title) => ({ id, kind: 'shot', file: `houses/dachimpy/museum/${file}.jpg`, px: [w, h], title });
const panel = (id, title) => ({ id, kind: 'panel', title });
/** Everything on show, in the order you meet it: where it began in the hall, then the museum's, in the order
    the user told it (14 Nov): the raw HTML Bnav Guide and its first Shoot Dalnoth ("Each version requires some
    variation of shooting [Dalnoth] ... it's become tradition"); the first Flash try ("wasn't even a prototype");
    the two boards before Whirled ("certainly the prototype"); the SmartFox set-up screen ("not even a
    wireframe, that is just the first version"); the lobby with Team One; the donation, and what it paid for
    (the banner, the title card, the sloops cut out by hand); the refined lobby; Create Your Game, on Whirled;
    the finished thing; then Dachimpy.com's later versions, and Shoot Dalnoth to the last; and the end. */
export const EXHIBITS = [
    panel('began', 'Where It All Began'),
    shot('guide', '01-bnav-guide', 1020, 663, 'Version One: the Bnav Guide'),
    shot('shootDalnoth', '02-shoot-dalnoth', 359, 361, 'The First Shoot Dalnoth'),
    shot('traverses', '03-dalnoth-traverses', 724, 571, 'Dalnoth Traverses the Board'),
    shot('first', '04-first-flash', 379, 582, 'My First Go at Flash'),
    shot('beforeWhirled', '05-before-whirled-board', 766, 664, 'Before Whirled'),
    shot('jobbers', '06-before-whirled-new-game', 592, 423, 'Jobbers per Turn'),
    shot('setup', '07-first-setup-screen', 711, 573, 'Game Setup, the First Version'),
    shot('teams', '08-lobby-team-one', 239, 203, 'Team One'),
    panel('donation', 'A Kind Donation'),
    shot('banner', '09-header-banner', 902, 137, 'The Banner'),
    shot('titleCard', '10-title-card', 640, 480, 'The Title Card'),
    shot('rotations', '11-sloop-rotations', 692, 156, 'A Sloop for Every Heading'),
    shot('rings', '12-sloop-rings', 285, 200, 'The Sloops, Round'),
    shot('lobby', '13-blockade-sim-lobby', 800, 501, 'The Blockade Sim Lobby'),
    shot('create', '14-create-your-game', 325, 228, 'Create Your Game'),
    shot('inPlay', '15-blockade-in-play', 799, 499, 'Blockade!'),
    shot('siteV2', '16-site-v2', 901, 543, 'Dachimpy.com, Version Two'),
    shot('siteV3', '17-site-v3', 902, 791, 'Version Three'),
    shot('siteV4', '18-site-v4', 921, 796, 'Version Four'),
    shot('siteV5', '19-site-v5', 922, 800, 'Version Five'),
    shot('siteLatest', '20-site-latest', 920, 800, 'The Last Version'),
    shot('dalnothApp', '21-shoot-dalnoth-app', 640, 925, 'Shoot Dalnoth, to the Last'),
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
/** The hall's exhibits (along its back wall); the rest hang in the museum. */
const IN_THE_HALL = ['began'];
/** The museum's pictures in clusters, the order kept (the user, 14 Nov: "some of them need to be clustered
    together a bit. Like I love the HTML one, but then the shoot [Dalnoth] ... Those next three are kind of grouped
    together, and then the Smart Fox ones ... And the [Whirled] ones, and then a bit of those technical drawings"):
    each of these starts a new cluster, a wider gap (CLUSTER_GAP) before it than between pictures in one. */
export const CLUSTERS = ['shootDalnoth', 'first', 'setup', 'donation', 'rotations', 'lobby', 'siteV2', 'dalnothApp'];
export const GAP = 0.55, CLUSTER_GAP = 1.6;
/** The museum's wall, laid out from its start (`x0`): each exhibit's middle and size, a frame and its plaque
    at a time, a step between (a wider one between clusters); and where the last one ends. */
function museumRow(x0) {
    const row = [];
    let x = x0 + 1.2;
    for (const e of EXHIBITS) {
        if (IN_THE_HALL.includes(e.id))
            continue;
        const s = e.kind === 'shot' ? shotSize(e.px) : PAGE, cw = e.kind === 'shot' ? cardUnder(0, 0, s.w, s.h).w : 0;
        const half = Math.max(s.w, cw) / 2;
        if (row.length && CLUSTERS.includes(e.id))
            x += CLUSTER_GAP - GAP;
        x += half;
        row.push({ e, x, ...s });
        x += half + GAP;
    }
    return { row, end: x - GAP };
}
// ---------- the house ----------
/** The hall's back wall, the museum's start and length, and the friends' room after it (metres). */
const M0 = 4.5;
/** How long the museum is: room for every exhibit, a step at either end. */
export const MUSEUM_LEN = Math.ceil(museumRow(0).end + 1.0);
const M1 = M0 + MUSEUM_LEN, F1 = M1 + 23;
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
/** Tall walls. */
export const WALLS = { high: 3.6, low: 0.45 };
const HALL = PLAN.rooms[0], MUSEUM = PLAN.rooms[1], FROOM = PLAN.rooms[2];
/** How far out from a room's back wall its pictures hang (the wall's thickness). */
export const WALL_T = 0.2;
/** Where each exhibit hangs, by id: where it began in the middle of the hall's back wall, then the museum's,
    in order, a frame and its plaque at a time. */
export function hang() {
    const out = {};
    const hallZ = HALL.z0 + WALL_T, musZ = MUSEUM.z0 + WALL_T;
    out.began = { room: 'hall', x: 0, y: 1.8, w: PAGE.w * 1.2, h: PAGE.h * 1.2, wall: hallZ, card: null };
    for (const { e, x, w, h } of museumRow(MUSEUM.x0).row) {
        const y = e.kind === 'shot' ? SHOT_MAX.y : 1.85;
        out[e.id] = { room: 'museum', x, y, w, h, wall: musZ, card: e.kind === 'shot' ? cardUnder(x, y, w, h) : null };
    }
    return out;
}
/** What Dachimpy says of an exhibit or a friend's portrait (by its id), as you stand looking at it, or under
    it in the close view. Null for anything else. */
export const exhibitLine = (id) => ON_AN_EXHIBIT[id] ?? ON_A_FRIEND[id] ?? null;
const SMALL = { w: 0.8, h: 1.0, y: 1.8 }, BIG = { w: 1.08, h: 1.35, y: 1.82 };
/** The wall's middle (x), and the step between frames: the middle's big ones, from them to the small ones, and
    between the small ones. */
export const FC = (M1 + F1) / 2;
const STEP = { big: 1.45, edge: 1.5, small: 1.0 };
/** Where the `i`th frame from the middle hangs, on `side` (-1 left, +1 right): the middle's two either side of
    its centre first, then the small ones on out. */
const along = (side, i) => FC + side * (i < 3 ? i * STEP.big : 2 * STEP.big + STEP.edge + (i - 3) * STEP.small);
const friend = (id, x, o) => ({ id, title: FRIEND_TITLES[id], x, ...SMALL, ...o });
const mid = (id, x, o) => friend(id, x, { ...BIG, middle: true, ...o });
/** A friend's portrait, painted close (knees up, big in the frame): them (their look in PIRATES, `dress` over
    it, turned `yaw`), and Dachimpy beside them if they shared it (`with`: Dachimpy's look, dressed as they
    were for that sitting). */
const sat = (name, backdrop, o = {}) => ({
    id: name.toLowerCase(), title: name, backdrop, close: true,
    sitter: {
        who: 'pirate', name, ...(o.dress ? { dress: o.dress } : {}), ...(o.yaw !== undefined ? { yaw: o.yaw } : {}),
        ...(o.with ? { company: [{ kind: 'pirate', name: 'Dachimpy', look: o.with, x: -0.82, z: -0.1, yaw: 0.3 }] } : {}),
    },
});
/* Dachimpy as they were in each sitting, from the real portraits (yoweb, both oceans, looked at 14 Nov). Never long
   hair (the user, 14 Nov: "I'm pretty sure I've never had long hair"): short and dark in the early ones, the pink
   beehive later. */
/** "Monkey Couple" (Meridian, 5 Jan 2007): short dark curls, gold hoops, a red shirt with a white sash at the waist,
    red trousers, a monkey on the shoulder: in red to match Sanne. Clean-shaven then. */
export const IN_RED = {
    hat: 'none', hair: 'short', hairCol: 'dark brown', beard: 'none', earring: 'both', patch: false,
    top: 'plain', topCol: 'red', waist: 'sash', waistCol: 'white', legs: 'pants', legsCol: 'red', bareLegs: false,
    feet: 'boots', feetCol: 'red', fam: 'monkey', famCol: 'brown',
};
/** "The monkey man" (Emerald, 29 Jan 2007): shaggy brown hair and beard, a gold hoop, a ragged orange shirt and
    patched blue shorts, on a beach. No monkey in it: the monkey man's himself. */
export const MONKEY_MAN = {
    hat: 'none', hair: 'short', hairCol: 'brown', beard: 'full', earring: true, patch: false,
    top: 'rag', topCol: 'orange', waist: 'none', legs: 'patched', legsCol: 'blue', bareLegs: false, feet: 'bare', fam: 'none',
};
/** "Oh, Gawd!" (Emerald, 2025, in the jaws of her Familiar Plaice): shaggy hair, beard, a patch and hoops, a white
    rag shirt and patched white shorts, barefoot. Gravee beside them in a red bandana and a black ragged dress. */
export const IN_RAGS = {
    hat: 'none', hair: 'short', hairCol: 'brown', beard: 'full', earring: 'both', patch: true,
    top: 'rag', topCol: 'white', waist: 'none', legs: 'patched', legsCol: 'white', bareLegs: false, feet: 'bare', fam: 'none',
};
const GRAVEE_IN_RAGS = { hat: 'bandana', hatCol: 'red', hair: 'long', hairCol: 'red', top: 'rag', topCol: 'black', legs: 'ragged', legsCol: 'black', feet: 'bare', hand: 'none', fam: 'none' };
/** "Cursed & Cookied" (Emerald, Valentine's 2010, Kikkit's): the pink beehive, a patch, a white frilly shirt with
    pink, pink-and-white stripy knickers. Kikkit in a red bandana and a white frilly blouse, her monkey. */
export const CURSED = { patch: true, top: 'frilly', topCol: 'white', topCol2: 'pink', waist: 'none', legs: 'knickers', legsCol: 'pink', legsCol2: 'white', bareLegs: false, feet: 'shoes', feetCol: 'pink' };
const KIKKIT_CURSED = { hat: 'bandana', hatCol: 'red', top: 'frilly', topCol: 'white', topCol2: 'red', legs: 'short', legsCol: 'white', hand: 'none' };
/** "Pinky and the pink" (Meridian, 2012, as Dachimpy-East): the pink beehive, a patch, bare-chested in braces and
    the pink kilt, a monkey on the shoulder. Zizzy in pink, her pink hair loose to the shoulders. */
export const IN_PINK = { patch: true, fam: 'monkey', famCol: 'brown' };
const ZIZZY_PINK = { hair: 'wavy', earring: 'both' };
/** "Scabard's group" (Emerald, 31 Mar 2008, at Scabard's Estate, Daquan's copy and Dachimpy's): Dachimpy in a pink
    coat and pink breeches, short brown hair (never long), a full beard, gold hoops, barefoot. Daquan as his look is, from that
    sitting. (Fordenis and Scabard, in it too, aren't drawn: their looks aren't in the den. Nor are everyone's
    false noses and glasses: there's nothing in the wardrobe for them.) */
export const IN_PINK_COAT = {
    hat: 'none', hair: 'short', hairCol: 'brown', beard: 'full', earring: 'both', patch: false,
    top: 'swashbuckler', topCol: 'pink', topCol2: 'pink', waist: 'none', legs: 'pants', legsCol: 'pink', bareLegs: false, feet: 'bare', fam: 'none',
};
const DAQUAN_GROUP = { hat: 'none', feet: 'bare' };
/** "Welcome Back Dachimpy!" (Meridian, 29 Jun 2025, commissioned by Fable at Fable's Gallery on Drogeo Island): shaggy
    brown hair, a patch and gold hoops, a white rag shirt and patched white shorts, a tan monkey on the shoulder.
    Fable beside them in white rags too, crowned with ice blue roses, light blue boots, a hook, a blue parrot. (The
    pale purple eggs both hold aren't in the wardrobe.) */
export const WELCOME_BACK_RAGS = { ...IN_RAGS, fam: 'monkey', famCol: 'tan' };
const FABLE_IN_RAGS = {
    hat: 'roses', hatCol: 'ice blue', hatCol2: 'light blue', top: 'rag', topCol: 'white', legs: 'ragged', legsCol: 'white',
    feet: 'boots', feetCol: 'light blue', hook: true, fam: 'parrot', famCol: 'aqua', famCol2: 'light blue',
};
export const FRIENDS = [
    friend('dignity', along(-1, 8), { portrait: sat('Dignity', 'den') }),
    friend('mischievious', along(-1, 7), { portrait: sat('Mischievious', 'cafe') }),
    friend('monkeyMan', along(-1, 6), { portrait: sat('Dachimpy', 'beach', { dress: MONKEY_MAN }) }),
    friend('gravee', along(-1, 5), { portrait: sat('Gravee', 'sea', { dress: GRAVEE_IN_RAGS, with: IN_RAGS }) }),
    friend('balloffire', along(-1, 4), { portrait: sat('Balloffire', 'night') }),
    friend('felinee', along(-1, 3), { portrait: sat('Felinee', 'sea') }),
    mid('kikkit', along(-1, 2), { portrait: sat('Kikkit', 'bloodmoon', { dress: KIKKIT_CURSED, with: CURSED }) }),
    mid('zizzy', along(-1, 1), { portrait: sat('Zizzy', 'night', { dress: ZIZZY_PINK, with: IN_PINK }) }),
    mid('daquan', FC, { portrait: sat('Daquan', 'beach', { dress: DAQUAN_GROUP, with: IN_PINK_COAT }) }),
    // (Sanne turned a little more, so her blonde hair, tied back, shows)
    mid('whiterose', along(1, 1), { portrait: sat('Whiterose', 'bloodmoon') }),
    mid('sanne', along(1, 2), { portrait: sat('Sanne', 'beach', { with: IN_RED, yaw: -0.45 }) }),
    friend('affame', along(1, 3), { portrait: sat('Affame', 'night') }),
    friend('welcomeBack', along(1, 4), { portrait: sat('Fable', 'night', { dress: FABLE_IN_RAGS, with: WELCOME_BACK_RAGS, yaw: -0.3 }) }),
    friend('tzz', along(1, 5), { portrait: sat('Tzz', 'autumn') }),
    friend('helium', along(1, 6), { portrait: sat('Helium', 'night') }),
    friend('roobear', along(1, 7), { portrait: sat('Roobear', 'pinksea') }),
    friend('everyone', along(1, 8), { page: 'everyone' }),
    friend('thanks', along(1, 9), { page: 'thanks' }),
];
/** The friends' wall (its face's z). */
export const FRIENDS_WALL = FROOM.z0 + WALL_T;
// ---------- the furniture ----------
/** The cookie plate, on the hall's table: walk up to it for another. */
export const COOKIES = { x: 2.7, z: -1.6, near: 1.35 };
/** The little model of the old sim's board, in front of "Blockade!" (its sloop spinning into the rocks now
    and then: furniture.js's simModel). */
export const MODEL = { z: 1.15 };
/** Their trinkets' shelf, against the friends' room's right-hand wall. */
export const SHELF = { x: F1 - 0.45, z: -1.7, yaw: -Math.PI / 2 };
/** How far from the middle the candles stand: between the middle's frames and the small ones. */
const CANDLES = 2 * STEP.big + (STEP.edge + BIG.w / 2 - SMALL.w / 2) / 2;
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
        // The friends' room: a rug, candles either side of the middle, a chair, the trinkets' shelf.
        { kind: 'rug', x: FC, z: 0.5, col: '#5b2c6f' },
        { kind: 'candelabra', x: FC - CANDLES, z: FROOM.z0 + 0.45 },
        { kind: 'candelabra', x: FC + CANDLES, z: FROOM.z0 + 0.45 },
        { kind: 'armchair', x: FC - 6.2, z: 1.4, yaw: 2.4, col: '#c46a8f' },
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
