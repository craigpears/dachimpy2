// ---------- the house ----------
/** The gallery's length (metres), and how far apart its frames hang. Long: the gag's that it goes on. */
export const GALLERY_LEN = 64;
export const FRAME_GAP = 1.6;
const G0 = 4.5, G1 = G0 + GALLERY_LEN;
/** Three rooms in a row, the camera looking in from the front (their front walls cut low, a doll's
    house): the hall you come in at, the long gallery off it, and her bedchamber at its far end. */
export const PLAN = {
    rooms: [
        { id: 'hall', name: 'The hall', x0: -4.5, x1: G0, z0: -3, z1: 3, paper: '#2f4a34' },
        { id: 'gallery', name: 'The gallery', x0: G0, x1: G1, z0: -1.6, z1: 1.6, paper: '#5a1e26' },
        { id: 'chamber', name: 'The bedchamber', x0: G1, x1: G1 + 10, z0: -3.5, z1: 3, paper: '#232c4a' },
    ],
    doors: [
        { x0: G0 - 0.5, x1: G0 + 0.5, z0: -0.9, z1: 0.9 },
        { x0: G1 - 0.5, x1: G1 + 0.5, z0: -0.9, z1: 0.9 },
    ],
    out: { x: 0, z: 2.35, r: 0.9 },
};
/** Where you come in (just inside the front door), and where she meets you. */
export const ARRIVE = { you: { x: 0, z: 2.0 }, her: { x: 0.9, z: 0.6 } };
/** How high the walls are, and the front walls cut low so you can see in. */
export const WALLS = { high: 3.2, low: 0.45 };
export const COFFIN = { x: G1 + 7.6, z: -1.9, yaw: 0 };
export const EASEL = { x: G1 + 4.6, z: 0.6, yaw: -0.6 };
export const BED = { x: G1 + 3.2, z: -2.1 };
export const FURNISH = [
    // The hall: a rug, her armchair, a side table, candelabras either side of the pride of place.
    { kind: 'rug', x: 0, z: 0.2, col: '#6b1d2a' },
    { kind: 'armchair', x: -3.3, z: -1.6, yaw: 0.7, col: '#4a6b3a' },
    { kind: 'table', x: -2.2, z: -2.3 },
    { kind: 'candelabra', x: -1.25, z: -2.6 },
    { kind: 'candelabra', x: 1.25, z: -2.6 },
    { kind: 'chair', x: 3.3, z: 1.6, yaw: -2.3 },
    // The gallery: a long runner down it.
    { kind: 'runner', x: (G0 + G1) / 2, z: 0.2, col: '#3a5a2a' },
    // The bedchamber: her four-poster, the coffin at its bedside, the easel, a rug, candles.
    { kind: 'bed', x: BED.x, z: BED.z, col: '#2f5a32' },
    { kind: 'coffin', x: COFFIN.x, z: COFFIN.z, yaw: COFFIN.yaw },
    { kind: 'easel', x: EASEL.x, z: EASEL.z, yaw: EASEL.yaw },
    { kind: 'rug', x: G1 + 5.4, z: 0.6, col: '#2d3f5c' },
    { kind: 'candelabra', x: COFFIN.x + 0.85, z: COFFIN.z - 0.55 }, // (a candle by the coffin, catching your eye)
    { kind: 'candelabra', x: G1 + 5.7, z: -3.0 },
    { kind: 'chair', x: G1 + 8.6, z: 1.8, yaw: -2.6 },
];
/** What you walk round: each piece's footprint, by kind (a coffin and a bed are long: two circles). */
export function blocksOf(pieces) {
    const out = [];
    for (const p of pieces) {
        const along = (r, half) => {
            const y = p.yaw ?? 0, dx = Math.sin(y) * half, dz = Math.cos(y) * half;
            out.push({ x: p.x + dx, z: p.z + dz, r }, { x: p.x - dx, z: p.z - dz, r });
        };
        if (p.kind === 'coffin')
            along(0.38, 0.55);
        else if (p.kind === 'bed')
            along(0.95, 0.45);
        else if (p.kind === 'armchair' || p.kind === 'table')
            out.push({ x: p.x, z: p.z, r: 0.5 });
        else if (p.kind === 'easel')
            out.push({ x: p.x, z: p.z, r: 0.4 });
        else if (p.kind === 'chair')
            out.push({ x: p.x, z: p.z, r: 0.35 });
        else if (p.kind === 'candelabra')
            out.push({ x: p.x, z: p.z, r: 0.22 });
        // (rugs and runners you walk over)
    }
    return out;
}
export const BACKDROPS = ['bloodmoon', 'snow', 'beach', 'crypt', 'autumn', 'witch', 'sea', 'den', 'night'];
/* Her looks, from her gallery (Emerald, checked 11 Nov), each by its own title: what's over her look as
   she is now (her pirate page's portrait: PIRATES.Gravee in js/den-look.js). */
// "Busy This Weekend?": the Berserker pelt and a Gown in light blue, a mug of something hot.
const BUSY = { hatCol: 'light blue', topCol: 'light blue', topCol2: 'blue', legsCol: 'light blue', legsCol2: 'blue', hand: 'tankard' };
const HER = [
    { id: 'busy', title: 'Busy This Weekend?', backdrop: 'snow', sitter: { who: 'pirate', name: 'Gravee', dress: BUSY } },
    // "Graves": golden curls, a ragged white dress off one shoulder, bare feet, on the sand.
    { id: 'graves', title: 'Graves', backdrop: 'beach', sitter: { who: 'pirate', name: 'Gravee', dress: { hat: 'none', hair: 'curly', hairCol: 'blonde', patch: false, hook: false, starfish: false, top: 'tied', topCol: 'white', legs: 'ragged', legsCol: 'white', feet: 'bare', hand: 'none', fam: 'none' } } },
    // "Vampyre": a striped bandana, a black Vampire raiment, stripy knickers, a black bat.
    { id: 'vampyre', title: 'Vampyre', backdrop: 'crypt', sitter: { who: 'pirate', name: 'Gravee', dress: { hat: 'bandana', hatCol: 'black', starfish: false, top: 'raiment', topCol: 'black', topCol2: 'red', legs: 'knickers', legsCol: 'black', feet: 'boots', feetCol: 'black', hand: 'none', fam: 'bat', famCol: 'black' } } },
    // "Wicked": the Wicked witch, all in black.
    { id: 'wicked', title: 'Wicked', backdrop: 'witch', sitter: { who: 'pirate', name: 'Gravee', dress: { hat: 'witch', hatCol: 'black', hatCol2: 'lime', starfish: false, top: 'dresstop', topCol: 'black', topCol2: 'purple', legsCol: 'black', legsCol2: 'purple', hand: 'none' } } },
    // "Hello Autumn": her hair up in a bun, a Gown in orange and brown.
    { id: 'autumn', title: 'Hello Autumn', backdrop: 'autumn', sitter: { who: 'pirate', name: 'Gravee', dress: { hat: 'none', hair: 'bun', hairCol: 'brown', starfish: false, topCol: 'orange', topCol2: 'brown', legsCol: 'orange', legsCol2: 'brown', hand: 'none' } } },
];
/** Pirates she's met (each in the wardrobe as they are: PIRATES), with her titles for them. */
const MET = [
    { id: 'dalnoth', title: 'Dalnoth, Sober (Rare)', backdrop: 'sea', sitter: { who: 'pirate', name: 'Dalnoth' } },
    // (off duty, she says: her eyes follow you down the gallery all the same)
    { id: 'dignity', title: 'Dignity, Off Duty (Never)', backdrop: 'den', sitter: { who: 'pirate', name: 'Dignity' }, watch: true },
    { id: 'mischievious', title: 'Mischievious, Between Weddings', backdrop: 'beach', sitter: { who: 'pirate', name: 'Mischievious' } },
    { id: 'kikkit', title: 'Kikkit, Mid-Sentence', backdrop: 'sea', sitter: { who: 'pirate', name: 'Kikkit' } },
];
/** Her yeti, proved again and again: her real gallery's titles (pages four to seven, "Definitive Proof
    of ..."), each her beside him, he a little out of focus. */
export const YETIS = [
    'Untamed Robert', 'Legendary Quin', 'Massive Reade', 'Unshorn Oscar', 'Cuddly Calhoun', 'Big Felix', 'Hirsute Sarah', 'Hulking Heather',
    'Untamed Dagger', 'Wooly Pavel', 'Massive Forrester', 'Mighty Samuel', 'Cryptic Bonnie', 'Snowy Arden', 'Abominable Duffy', 'Big Corey',
    'Snowy McCoy', 'Enigmatic Clarisse', 'Untamed Grey', 'Hirsute Nolan', 'Abominable Ahab', 'Wooly Shane', 'Impossible Sheng', 'Cuddly Bowen',
    'Mighty Red', 'Snowy Bingham', 'Fuzzy Dane', 'Imaginary Yolanda', 'Massive Jasmine', 'Untamed Cap', 'Unbelievable Candra',
];
const PROOF_DRESS = [{}, BUSY, { hatCol: 'white', topCol: 'white', topCol2: 'light blue', legsCol: 'white', legsCol2: 'light blue' }];
const proofs = () => YETIS.map((name, i) => ({
    id: `proof-${i}`, title: `Definitive Proof of ${name}`, backdrop: 'snow',
    sitter: { who: 'yeti', name, dress: { ...PROOF_DRESS[i % PROOF_DRESS.length] } },
}));
/** The Count, the vampire in the coffin: a look from the wardrobe (js/den/creatures.js makes him pale and
    gives him fangs). Not a real pirate. */
export const VAMPIRE = {
    body: 'm', skin: 0, hair: 'short', hairCol: 'black', beard: 'none', patch: false, earring: false, smile: false,
    hat: 'none', top: 'raiment', topCol: 'black', topCol2: 'red', waist: 'none', legs: 'pants', legsCol: 'black', feet: 'boots', feetCol: 'black', hand: 'none', fam: 'none',
};
/** Her portrait as she is now: over the hall's mantel, by the pride of place. */
export const HERSELF = { id: 'herself', title: 'Gravee, by Gravee', backdrop: 'bloodmoon', sitter: { who: 'pirate', name: 'Gravee' } };
/** The vampire's, over his coffin: its eyes follow you (src/eyes.ts; any portrait can, `watch`). */
export const VAMPIRE_PORTRAIT = { id: 'vampire', title: 'The Count, Awake (Rare)', backdrop: 'night', sitter: { who: 'vampire' }, watch: true };
/** Yours, once she's painted you: pride of place in her hall. */
export const YOURS = { id: 'you', title: '', backdrop: 'crypt', sitter: { who: 'you' } };
/** How many frames the gallery's back wall holds. */
export const GALLERY_SLOTS = Math.floor((GALLERY_LEN - 1.2) / FRAME_GAP);
/** The gallery's frames, hall end first: her looks (what you see at a walk), then the pirates she's met
    and her yeti proofs, one after another, the length of it. `x`: along the back wall. */
export function galleryHang() {
    const yet = proofs(), lead = [...HER], mixed = [];
    let m = 0;
    while (yet.length || m < MET.length) {
        if (m < MET.length && mixed.length % 4 === 1)
            mixed.push(MET[m++]);
        else if (yet.length)
            mixed.push(yet.shift());
        else
            mixed.push(MET[m++]);
    }
    return [...lead, ...mixed].slice(0, GALLERY_SLOTS).map((p, i) => ({ ...p, x: G0 + 1.2 + i * FRAME_GAP }));
}
/** Where the hall's pictures hang, on its back wall: hers, the pride of place in the middle (for you),
    and two more of hers either side. And the vampire's over the coffin. */
export const HALL_WALL = { pride: { x: 0, w: 1.5, h: 1.9 }, herself: { x: -3.0 }, other: { x: 3.0 }, vampire: { x: COFFIN.x } };
/** Which of her looks hangs right of the pride of place. */
export const HALL_OTHER = HER[1];
// ---------- the gag: the endless gallery ----------
/* It goes on and on, and you walk it, Gravee at your side: that's the joke (the user, 11 Nov: "Obviously,
   you can zoom by as a skip. I don't think it should do that by default, though"). Or skip along it, a
   button and a key (the house shell's: src/den-houses.ts's Stretch), at a run, the frames and their
   titles going by, from a few steps in at one end to a few steps from the other. */
export const WHIZ = { room: 'gallery', a: G0 + 5.9, b: G1 - 3.9 };
export const TOUR = [
    { id: 'hall', at: { x: 0, z: 0.4 }, near: 2.4, her: { x: -0.9, z: -1.6 } },
    { id: 'gallery', at: { x: G0 + 0.8, z: 0 }, near: 1.6, her: { x: G0 + 2.4, z: -0.6 } },
    { id: 'yeti', at: { x: WHIZ.b, z: 0 }, near: 1.4, her: { x: WHIZ.b + 1.8, z: -0.7 } },
    { id: 'chamber', at: { x: G1 + 1.3, z: 0 }, near: 1.8, her: { x: G1 + 2.8, z: 1.2 } },
    { id: 'coffin', at: { x: COFFIN.x - 0.4, z: COFFIN.z + 1.6 }, near: 1.5, her: { x: EASEL.x - 0.5, z: EASEL.z + 0.6 } },
];
/** The stop to say next: the furthest from `from` on that you're at (so walking ahead skips her on),
    or -1 if you're at none of them. */
export function stopAt(from, x, z) {
    for (let i = TOUR.length - 1; i >= Math.max(0, from); i--) {
        const s = TOUR[i];
        if (Math.hypot(x - s.at.x, z - s.at.z) < s.near)
            return i;
    }
    return -1;
}
/** Close enough to the coffin to lift its lid. */
export const atCoffin = (x, z) => Math.hypot(x - COFFIN.x, z - (COFFIN.z + 1.3)) < 1.3;
/* Drawn to the coffin, the house's main event, from anywhere in her bedchamber (the user, 11 Nov: "it's not
   necessarily discoverable that you can go near the coffin ... if you're on the other side of the room,
   there's nothing really pushing you in that direction"). No arrow: she and the scene do it. Once she's
   shown you into the bedchamber she goes and stands by the coffin (LEAD: while you're anywhere in the
   room), beckoning you over now and then (her BECKON lines), till you've lifted its lid; and the coffin
   catches your eye itself, its lid giving a rattle now and then, the Count snoring, the bat circling over
   it, a candle burning beside it. */
export const LEAD = { at: { x: G1 + 5, z: -0.25 }, near: 5.2, stand: { x: COFFIN.x + 1.25, z: COFFIN.z + 0.5 } };
/** How often (seconds, least and most between) she beckons and the lid rattles; and how far off you are
    (from the coffin, metres) for her to bother beckoning. */
export const LURE = { beckon: [7, 11], rattle: [4.5, 8], far: 2.6 };
/** Is she leading you to the coffin: shown into the bedchamber, and he's not been woken yet? */
export const leading = (tour, woken) => !woken && tour >= TOUR.findIndex((s) => s.id === 'coffin');
/** Where you stand for your sitting (by the coffin, as you were when he sat up), and she at her easel. */
export const SITTING = { you: { x: COFFIN.x - 1.05, z: COFFIN.z + 1.15, yaw: 0.5 }, her: { x: EASEL.x + 0.6, z: EASEL.z + 0.45, yaw: 2.2 } };
/* The scare, beat by beat (seconds from lifting the lid): the lid creaks up, he sits bolt upright, you
   both scream, she claps, you freeze, she paints (he lies back down, the lid shuts), she's painted you,
   and it's done. */
export const SCARE = { creak: 0.0, up: 0.9, scream: 1.3, clap: 2.8, freeze: 3.4, paint: 5.2, painted: 9.2, done: 10.6 };
const shot = (x, y, z, dist, tilt, yaw) => ({ look: { x, y, z }, dist, tilt, yaw });
const YOU = SITTING.you, AT_EASEL = SITTING.her;
/* The scare's camera (the user, 11 Nov: "the camera zoom's not really in the right place when she's
   painting, to like, oh, hold it there, does the painting ... It doesn't really flow right"): shots each
   held a while, the camera easing from one to the next, never cutting: from where it was, onto the coffin
   as he sits up; in on your fright; round to her at her easel painting you, you and the coffin beyond,
   held till she's done; and back to where it was. `from`, `to`: when each is held (seconds). */
export const SCARE_SHOTS = [
    { from: 0.9, to: 2.9, shot: shot((COFFIN.x + YOU.x) / 2, 1.2, COFFIN.z + 1.0, 5.6, 0.3, 0.25) },
    { from: 3.5, to: 4.6, shot: shot(YOU.x + 0.5, 1.2, YOU.z - 0.4, 4.2, 0.15, 0.2) },
    { from: 5.6, to: SCARE.painted + 0.3, shot: shot((EASEL.x + AT_EASEL.x + YOU.x) / 3 + 0.2, 1.15, (EASEL.z + AT_EASEL.z + YOU.z) / 3, 5.8, 0.26, -0.1) },
];
const mixShot = (a, b, k) => {
    const m = (p, q) => p + (q - p) * k;
    return shot(m(a.look.x, b.look.x), m(a.look.y, b.look.y), m(a.look.z, b.look.z), m(a.dist, b.dist), m(a.tilt, b.tilt), m(a.yaw, b.yaw));
};
/** The camera `t` seconds into the scare: `home` (the house's own view, where it was) at the start and
    from the end (SCARE.done), the shots between, eased (smoothstep) from each to the next. */
export function scareShot(t, home) {
    const holds = [{ from: -Infinity, to: 0, shot: home }, ...SCARE_SHOTS, { from: SCARE.done, to: Infinity, shot: home }];
    for (let i = 0; i < holds.length; i++) {
        const h = holds[i];
        if (t <= h.to) {
            if (t >= h.from)
                return mixShot(h.shot, h.shot, 0);
            const p = holds[i - 1], u = (t - p.to) / (h.from - p.to), k = u * u * (3 - 2 * u);
            return mixShot(p.shot, h.shot, k);
        }
    }
    return mixShot(home, home, 0);
}
// ---------- your portrait's plaque ----------
/** Its title: you, by name, as she sees you. */
export const yourTitle = (name) => `${String(name || '').trim() || 'A Visitor'}, Scared to Death`;
/** Who painted it, where and when (under the title, on the snapshot). */
export const paintedBy = (date) => `Painted by Gravee at Bedside Manors${date ? `, ${date}` : ''}`;
