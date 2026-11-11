/* Pirate Den: Gravee's house, Bedside Manors, the first house in the district (src/den-houses.ts).
   TypeScript, compiled to js/den-gravee.js; tested in tests/den-gravee.test.ts. js/den/gravee-house.js
   plays it in the house shell (js/den/house.js), placing the shared furniture (js/den/furniture.js)
   where FURNISH says and hanging the portraits (js/den/portraits.js) where the gallery says. Her lines
   are in src/lines/gravee.ts, the vampire's in src/lines/vampire.ts.

   Gravee, a real pirate of the Emerald Ocean (pirate name only): captain of Just In Time, a big
   portrait collector (seven pages of them; IDEAS.md, "The vampire in the coffin"), sweet and excitable.
   The user (11 Nov): "she can show you ... around her house. And the vampires and do the portrait
   thing. Maybe we don't go as far as a vampire game. It's more just about exploring her house and the
   portrait angle of it. And the taking a portrait and a snapshot, because that's fun."

   So: she shows you round in speech bubbles, stop by stop, as you walk; her portraits line the walls
   (each a pirate drawn by the pirate maker from a look: config here, so a picture is an entry); a
   long gallery you walk a few steps of before the camera whizzes past the rest (the gag: never
   tedious); her yeti "proof" (dozens of them: "Definitive Proof of Snowy Arden" and so on, as in her
   real gallery); the vampire's portrait over his coffin, its eyes following you; and the coffin by
   her bed (Bedside Manors). Lift its lid and he sits up, you both scream, and she sits you for a
   portrait, frozen mid-fright, that hangs pride of place in her hall, kept in this browser. No vampire
   game (yet: the rapid-Carpentry coffins wait, IDEAS.md). */
import type { Plan, Block } from './den-houses.js';

// ---------- the house ----------
/** The gallery's length (metres), and how far apart its frames hang. Long: the gag's that it goes on. */
export const GALLERY_LEN = 64;
export const FRAME_GAP = 1.6;
const G0 = 4.5, G1 = G0 + GALLERY_LEN;
/** Three rooms in a row, the camera looking in from the front (their front walls cut low, a doll's
    house): the hall you come in at, the long gallery off it, and her bedchamber at its far end. */
export const PLAN: Plan = {
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
export const ARRIVE = { you: { x: 0, z: 2.0 }, her: { x: 0.9, z: 0.6 } } as const;
/** How high the walls are, and the front walls cut low so you can see in. */
export const WALLS = { high: 3.2, low: 0.45 } as const;

/** Her furniture, by kind (js/den/furniture.js has one of each, for anywhere): where it stands, turned
    to face (`yaw`, radians: 0 faces you, toward +z). The house only places it. */
export interface Piece { kind: string; x: number; z: number; yaw?: number; col?: string }
export const COFFIN = { x: G1 + 7.6, z: -1.9, yaw: 0 } as const;
export const EASEL = { x: G1 + 4.6, z: 0.6, yaw: -0.6 } as const;
export const BED = { x: G1 + 3.2, z: -2.1 } as const;
export const FURNISH: readonly Piece[] = [
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
  { kind: 'candelabra', x: G1 + 9.2, z: -3.0 },
  { kind: 'candelabra', x: G1 + 5.7, z: -3.0 },
  { kind: 'chair', x: G1 + 8.6, z: 1.8, yaw: -2.6 },
];

/** What you walk round: each piece's footprint, by kind (a coffin and a bed are long: two circles). */
export function blocksOf(pieces: readonly Piece[]): Block[] {
  const out: Block[] = [];
  for (const p of pieces) {
    const along = (r: number, half: number) => {
      const y = p.yaw ?? 0, dx = Math.sin(y) * half, dz = Math.cos(y) * half;
      out.push({ x: p.x + dx, z: p.z + dz, r }, { x: p.x - dx, z: p.z - dz, r });
    };
    if (p.kind === 'coffin') along(0.38, 0.55);
    else if (p.kind === 'bed') along(0.95, 0.45);
    else if (p.kind === 'armchair' || p.kind === 'table') out.push({ x: p.x, z: p.z, r: 0.5 });
    else if (p.kind === 'easel') out.push({ x: p.x, z: p.z, r: 0.4 });
    else if (p.kind === 'chair') out.push({ x: p.x, z: p.z, r: 0.35 });
    else if (p.kind === 'candelabra') out.push({ x: p.x, z: p.z, r: 0.22 });
    // (rugs and runners you walk over)
  }
  return out;
}

// ---------- the portraits ----------
/** Who's in a portrait: Gravee in one of her looks (her look in the wardrobe, PIRATES.Gravee, with
    `dress` over it); another real pirate she's met, by name (their look in PIRATES); a yeti, beside her;
    the vampire; or you. `fright`: frozen mid-scream. `blur`: her yeti proof's famous focus. */
export type Sitter =
  | { who: 'pirate'; name: string; dress?: Record<string, string | number | boolean> }
  | { who: 'yeti'; name: string; dress?: Record<string, string | number | boolean> }
  | { who: 'vampire' }
  | { who: 'you' };
/** A portrait: its title (on its plaque), who's in it, what's behind them. */
export interface Portrait { id: string; title: string; sitter: Sitter; backdrop: Backdrop }
export type Backdrop = 'bloodmoon' | 'snow' | 'beach' | 'crypt' | 'autumn' | 'witch' | 'sea' | 'den' | 'night';
export const BACKDROPS: readonly Backdrop[] = ['bloodmoon', 'snow', 'beach', 'crypt', 'autumn', 'witch', 'sea', 'den', 'night'];

/* Her looks, from her gallery (Emerald, checked 11 Nov), each by its own title: what's over her look as
   she is now (her pirate page's portrait: PIRATES.Gravee in js/den-look.js). */
// "Busy This Weekend?": the Berserker pelt and a Gown in light blue, a mug of something hot.
const BUSY = { hatCol: 'light blue', topCol: 'light blue', topCol2: 'blue', legsCol: 'light blue', legsCol2: 'blue', hand: 'tankard' };
const HER: Portrait[] = [
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
const MET: Portrait[] = [
  { id: 'dalnoth', title: 'Dalnoth, Sober (Rare)', backdrop: 'sea', sitter: { who: 'pirate', name: 'Dalnoth' } },
  { id: 'dignity', title: 'Dignity, Off Duty (Never)', backdrop: 'den', sitter: { who: 'pirate', name: 'Dignity' } },
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
] as const;
type Dress = Record<string, string | number | boolean>;
const PROOF_DRESS: Dress[] = [{}, BUSY, { hatCol: 'white', topCol: 'white', topCol2: 'light blue', legsCol: 'white', legsCol2: 'light blue' }];
const proofs = (): Portrait[] => YETIS.map((name, i) => ({
  id: `proof-${i}`, title: `Definitive Proof of ${name}`, backdrop: 'snow',
  sitter: { who: 'yeti', name, dress: { ...PROOF_DRESS[i % PROOF_DRESS.length] } },
}));

/** The Count, the vampire in the coffin: a look from the wardrobe (js/den/creatures.js makes him pale and
    gives him fangs). Not a real pirate. */
export const VAMPIRE: Record<string, string | number | boolean> = {
  body: 'm', skin: 0, hair: 'short', hairCol: 'black', beard: 'none', patch: false, earring: false, smile: false,
  hat: 'none', top: 'raiment', topCol: 'black', topCol2: 'red', waist: 'none', legs: 'pants', legsCol: 'black', feet: 'boots', feetCol: 'black', hand: 'none', fam: 'none',
};

/** Her portrait as she is now: over the hall's mantel, by the pride of place. */
export const HERSELF: Portrait = { id: 'herself', title: 'Gravee, by Gravee', backdrop: 'bloodmoon', sitter: { who: 'pirate', name: 'Gravee' } };
/** The vampire's, over his coffin: its eyes follow you. */
export const VAMPIRE_PORTRAIT: Portrait = { id: 'vampire', title: 'The Count, Awake (Rare)', backdrop: 'night', sitter: { who: 'vampire' } };
/** Yours, once she's painted you: pride of place in her hall. */
export const YOURS: Portrait = { id: 'you', title: '', backdrop: 'crypt', sitter: { who: 'you' } };

/** How many frames the gallery's back wall holds. */
export const GALLERY_SLOTS = Math.floor((GALLERY_LEN - 1.2) / FRAME_GAP);
/** The gallery's frames, hall end first: her looks (what you see at a walk), then the pirates she's met
    and her yeti proofs, one after another, the length of it. `x`: along the back wall. */
export function galleryHang(): (Portrait & { x: number })[] {
  const yet = proofs(), lead = [...HER], mixed: Portrait[] = [];
  let m = 0;
  while (yet.length || m < MET.length) {
    if (m < MET.length && mixed.length % 4 === 1) mixed.push(MET[m++]);
    else if (yet.length) mixed.push(yet.shift()!);
    else mixed.push(MET[m++]);
  }
  return [...lead, ...mixed].slice(0, GALLERY_SLOTS).map((p, i) => ({ ...p, x: G0 + 1.2 + i * FRAME_GAP }));
}
/** Where the hall's pictures hang, on its back wall: hers, the pride of place in the middle (for you),
    and two more of hers either side. And the vampire's over the coffin. */
export const HALL_WALL = { pride: { x: 0, w: 1.5, h: 1.9 }, herself: { x: -3.0 }, other: { x: 3.0 }, vampire: { x: COFFIN.x } } as const;
/** Which of her looks hangs right of the pride of place. */
export const HALL_OTHER: Portrait = HER[1];

// ---------- the gag: the endless gallery ----------
/** Where the gallery's two ends are, that you walk at a walk: past the first (going in), the camera
    whizzes you the length of it, to the second; and back again the same, coming out. */
export const WHIZ = { a: G0 + 6.2, b: G1 - 4.2 } as const;
/** Walking from x0 to x1 along the gallery: where the whiz takes you, or null. Never into the middle. */
export function whiz(x0: number, x1: number): number | null {
  if (x0 < WHIZ.a && x1 >= WHIZ.a) return WHIZ.b + 0.3;
  if (x0 > WHIZ.b && x1 <= WHIZ.b) return WHIZ.a - 0.3;
  return null;
}
/** How long the whiz takes: the first time along it, long enough to see how far it goes; after that,
    quick (it's a joke, not a chore). */
export const whizSecs = (times: number): number => (times ? 1.6 : 4.2);

// ---------- the tour ----------
/** Her tour, stop by stop: where you have to come to (`at`, within `near`) for her to say a stop's lines,
    and where she waits for you there (`her`). Walk ahead of her and she skips to where you are. */
export interface Stop { id: TourStop; at: { x: number; z: number }; near: number; her: { x: number; z: number } }
export type TourStop = 'hall' | 'gallery' | 'yeti' | 'chamber' | 'coffin';
export const TOUR: readonly Stop[] = [
  { id: 'hall', at: { x: 0, z: 0.4 }, near: 2.4, her: { x: -0.9, z: -1.6 } },
  { id: 'gallery', at: { x: G0 + 0.8, z: 0 }, near: 1.6, her: { x: G0 + 2.4, z: -0.6 } },
  { id: 'yeti', at: { x: WHIZ.b + 0.3, z: 0 }, near: 1.4, her: { x: WHIZ.b + 1.8, z: -0.7 } },
  { id: 'chamber', at: { x: G1 + 1.3, z: 0 }, near: 1.8, her: { x: G1 + 2.8, z: 1.2 } },
  { id: 'coffin', at: { x: COFFIN.x - 0.4, z: COFFIN.z + 1.6 }, near: 1.5, her: { x: EASEL.x - 0.5, z: EASEL.z + 0.6 } },
];
/** The stop to say next: the furthest from `from` on that you're at (so walking ahead skips her on),
    or -1 if you're at none of them. */
export function stopAt(from: number, x: number, z: number): number {
  for (let i = TOUR.length - 1; i >= Math.max(0, from); i--) {
    const s = TOUR[i];
    if (Math.hypot(x - s.at.x, z - s.at.z) < s.near) return i;
  }
  return -1;
}
/** Close enough to the coffin to lift its lid. */
export const atCoffin = (x: number, z: number): boolean => Math.hypot(x - COFFIN.x, z - (COFFIN.z + 1.3)) < 1.3;

/** Where you stand for your sitting (by the coffin, as you were when he sat up), and she at her easel. */
export const SITTING = { you: { x: COFFIN.x - 1.05, z: COFFIN.z + 1.15, yaw: 0.5 }, her: { x: EASEL.x + 0.6, z: EASEL.z + 0.45, yaw: 2.2 } } as const;

/* The scare, beat by beat (seconds from lifting the lid): the lid creaks up, he sits bolt upright, you
   both scream, she claps, you freeze, she paints, he lies back down, the lid shuts, and it's done. */
export const SCARE = { creak: 0.0, up: 0.9, scream: 1.3, clap: 2.8, freeze: 3.4, paint: 5.2, done: 9.6 } as const;

// ---------- the vampire's eyes ----------
/** Which way the portrait's eyes look to follow you: (dx, dy), each -1 to 1, from where its eyes are
    (x, y on its wall) to where you are (x along the wall, 1.5 m up: your face), a little lazy. */
export function eyesToward(eyeX: number, eyeY: number, youX: number, youZ: number, wallZ: number): [number, number] {
  const dx = youX - eyeX, dz = Math.max(0.5, youZ - wallZ), dy = 1.5 - eyeY;
  const ax = Math.atan2(dx, dz) / (Math.PI / 2), ay = Math.atan2(dy, Math.hypot(dx, dz)) / (Math.PI / 2);
  const c = (v: number) => Math.max(-1, Math.min(1, v * 1.6));
  return [c(ax), c(ay)];
}

// ---------- your portrait's plaque ----------
/** Its title: you, by name, as she sees you. */
export const yourTitle = (name: string): string => `${String(name || '').trim() || 'A Visitor'}, Scared to Death`;
/** Who painted it, where and when (under the title, on the snapshot). */
export const paintedBy = (date: string): string => `Painted by Gravee at Bedside Manors${date ? `, ${date}` : ''}`;
