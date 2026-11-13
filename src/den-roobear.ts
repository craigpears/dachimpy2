/* Pirate Den: Roobear's house, the ROOm, a little one in the den's housing district (src/den-houses.ts).
   TypeScript, compiled to js/den-roobear.js; tested in tests/den-roobear.test.ts. js/den/roobear-house.js
   plays it in the house shell (js/den/house.js), placing the shared furniture (js/den/furniture.js) where
   FURNISH says, hanging the portraits (js/den/portraits.js) where GUESSES says, and Robert, the kangaroo
   bear (js/den/creatures.js). Her lines are in src/lines/roobear.ts.

   Roobear, a real pirate of the Emerald Ocean (pirate name only): asked what her name stands for ("a french
   sounding Robert, roo like kangaroo plus a bear, or did someone roob an ear?", and Dignity's: the roo and
   the bear from the books), she answered: "I could be Robert the kangaroo bear that roobs ears ... I like
   it." Told she had a room in the game: "a ROOm you mean? xD". The user (13 Nov): "she was really cute ...
   a really sweet interaction, and I wanted to commemorate it ... So maybe just do the small house."

   So: one small room, her ROOm (its sign says so); she meets you at the door and Robert, half kangaroo and
   half bear, roobs your ear as the welcome (and again whenever you ask him); her walls hold everyone's
   guesses at her name, each a portrait of her in her own look, and she tells you whose guess each was as
   you stop by it; the biggest frame, in the middle, is her own answer. No quest yet. */
import type { Plan, Piece, Portrait, Block } from './den-houses.js';
import { walkable } from './den-houses.js';
import { ON_A_GUESS } from './lines/roobear.js';

// ---------- the house ----------
/** One room, the camera looking in from the front (its front wall cut low, a doll's house). */
export const PLAN: Plan = {
  rooms: [{ id: 'room', name: 'The ROOm', x0: -5.2, x1: 5.2, z0: -3, z1: 3, paper: '#3d2c58' }],
  doors: [],
  out: { x: 0, z: 2.35, r: 0.9 },
};
/** Where you come in (just inside the front door), where she meets you, and where Robert waits. */
export const ARRIVE = { you: { x: 0, z: 2.0 }, her: { x: 1.1, z: 0.9 }, robert: { x: -1.0, z: 1.2 } } as const;
/** Her walls are a little taller than Gravee's, for the sign over the biggest frame. */
export const WALLS = { high: 3.8, low: 0.45 } as const;
const BACK = PLAN.rooms[0].z0;

/** Her tea table (her crew's Tea Time), at the front left; the rest of her furniture, by kind. */
export const TABLE = { x: -3.4, z: 0.7 } as const;
export const FURNISH: readonly Piece[] = [
  { kind: 'rug', x: 0, z: 0.4, col: '#5b2c6f' },
  { kind: 'table', x: TABLE.x, z: TABLE.z },
  { kind: 'armchair', x: -4.4, z: 1.5, yaw: 2.4, col: '#6a4a8a' },
  { kind: 'chair', x: -2.4, z: 1.6, yaw: -2.5 },
  // (either side of her answer, the biggest frame)
  { kind: 'candelabra', x: -1.1, z: BACK + 0.4 },
  { kind: 'candelabra', x: 1.1, z: BACK + 0.4 },
  { kind: 'armchair', x: 4.3, z: 0.9, yaw: -2.2, col: '#6a4a8a' },
];

// ---------- the gallery of guesses ----------
/* Everyone's guess at her name (the user, 12 Nov: "I don't know if you can put that in portraits where
   you've got all the interpretations of the guesses of her name. Or is she the Roobear that roobs ears? You
   need that."), each painted of her in her own look (PIRATES.Roobear): who guessed what is hers to say
   (ON_A_GUESS), in the order they came, round her answer in the middle. */
type Dress = Record<string, string | number | boolean>;
const HER = 'Roobear';
/** A monsieur: her as a French Robert, a moustache and a beret, a Breton shirt in her purple; her crow,
    her hook, her bowl and her earring still. */
export const MONSIEUR: Dress = { body: 'm', hair: 'short', beard: 'moustache', hat: 'beret', hatCol: 'purple', top: 'striped', topCol: 'white', topCol2: 'purple', waist: 'none', legs: 'pants' };
/** Whose ear was roobed, at the scene of the crime: a pirate who wasn't expecting it. */
export const BYSTANDER: Dress = { body: 'm', skin: 2, hair: 'short', hairCol: 'brown', beard: 'goatee', patch: false, earring: false, hat: 'tricorne', hatCol: 'brown', top: 'plain', topCol: 'tan', waist: 'belt', legs: 'pants', legsCol: 'brown', feet: 'boots', hand: 'none', fam: 'none' };
/** A frame on her back wall: where along it (`x`), how big (`w`, `h`) and how high its middle (`y`). */
export interface Hung { x: number; w: number; h: number; y: number }
export type Guess = Portrait & Hung & { id: keyof typeof ON_A_GUESS };
const SMALL = { w: 0.8, h: 1.0, y: 1.7 }, BIG = { w: 1.5, h: 1.9, y: 1.75 };
export const GUESSES: readonly Guess[] = [
  { id: 'robert', title: 'Robert, a Monsieur', backdrop: 'cafe', x: -3.6, ...SMALL, sitter: { who: 'pirate', name: HER, dress: MONSIEUR } },
  { id: 'rooBear', title: 'Roo + Bear', backdrop: 'beach', x: -1.9, ...SMALL, sitter: { who: 'pirate', name: HER, costume: 'roo-bear' } },
  // Her answer: Robert himself beside her, roobing her ear, and she's enjoying it.
  {
    id: 'answer', title: 'Robert the Kangaroo Bear that Roobs Ears', backdrop: 'pinksea', x: 0, ...BIG,
    sitter: { who: 'pirate', name: HER, pose: 'bliss', company: [{ kind: 'robert', x: -0.5, z: 0.12, yaw: 1.45, pose: 'rub' }] },
  },
  {
    id: 'roobed', title: 'Did Someone Roob an Ear?', backdrop: 'den', x: 1.9, ...SMALL,
    sitter: { who: 'pirate', name: HER, dress: { hand: 'none' }, pose: 'rub', company: [{ kind: 'pirate', look: BYSTANDER, x: -0.85, z: -0.1, yaw: 0.6, pose: 'bliss' }] },
  },
  // Dignity's: a roo and a bear "from the books", drawn as our own (never the books' characters).
  {
    id: 'books', title: 'A Roo and a Bear', backdrop: 'autumn', x: 3.6, ...SMALL,
    sitter: { who: 'pirate', name: HER, company: [{ kind: 'joey', x: -0.6, z: 0.25, yaw: 0.5 }, { kind: 'bear', x: 0.72, z: -0.35, yaw: -0.4 }] },
  },
];
/** Her line about a guess (by its id), as you stand looking at it, or under it in the close view: whose it
    was. Null for anything else. */
export const guessLine = (id: string): string | null => (ON_A_GUESS as Record<string, string>)[id] ?? null;
/** Her sign, over her answer: it's a house, but it's her ROOm. */
export const SIGN = { text: "Roobear's ROOm", x: 0, w: 1.9, h: 0.46, y: 3.22 } as const;

// ---------- the tour ----------
/** Her tour, stop by stop: where you have to come to (`at`, within `near`) for her to say a stop's lines,
    and where she waits for you there (`her`). Walk ahead of her and she skips to where you are. */
export type TourStop = 'guesses' | 'tea';
export interface Stop { id: TourStop; at: { x: number; z: number }; near: number; her: { x: number; z: number } }
export const TOUR: readonly Stop[] = [
  { id: 'guesses', at: { x: 0, z: -0.2 }, near: 2.0, her: { x: 1.2, z: -1.6 } },
  { id: 'tea', at: { x: TABLE.x + 0.4, z: TABLE.z - 0.9 }, near: 1.3, her: { x: TABLE.x + 1.1, z: TABLE.z - 0.3 } },
];
/** The stop to say next: the furthest from `from` on that you're at (so walking ahead skips her on), or -1
    if you're at none of them. */
export function stopAt(from: number, x: number, z: number): number {
  for (let i = TOUR.length - 1; i >= Math.max(0, from); i--) {
    const s = TOUR[i];
    if (Math.hypot(x - s.at.x, z - s.at.z) < s.near) return i;
  }
  return -1;
}

// ---------- Robert's ear rub ----------
/* Robert roobs ears: as the welcome, the moment you're in (after her hello), and again whenever you ask him
   (walk up to him and Space). He hops over to your side, faces you, and hops on the spot with a paw up at
   your ear, roobing it; you shut your eyes and enjoy it; then she says who he is. While he's at it you stand
   still. `secs`: how long a rub lasts; `side`: how far to your side he stands, `turn` how far he's turned from facing you square on toward the
   front (radians: so you see his face); `near`: how near him you
   come to ask; `follow`: where he keeps, by her (to her side away from you, a little behind, metres); `pace`: his hopping
   speed. */
export const RUB = { secs: 2.6, side: 0.55, turn: 0.3, near: 1.25, follow: { x: 0.85, z: -0.3 }, pace: 3.6 } as const;
/** The beats of a rub, seconds from when he's by you: your line, and the end. */
export const RUB_BEATS = { said: 0.9, done: RUB.secs } as const;
/** Where Robert stands to roob your ear: beside you, to your left if there's room there, else your right
    (`side`: -1 left, +1 right, 0 in front), facing you, turned RUB.turn to the front (`yaw`: 0 faces +z). */
export function rubSpot(plan: Plan, you: { x: number; z: number }, blocks: readonly Block[] = []): { x: number; z: number; yaw: number; side: number } {
  const clear = (x: number, z: number) => walkable(plan, x, z) && blocks.every((b) => Math.hypot(x - b.x, z - b.z) > b.r + 0.3);
  for (const s of [-1, 1]) {
    const x = you.x + s * RUB.side;
    if (clear(x, you.z)) return { x, z: you.z, yaw: -s * (Math.PI / 2 - RUB.turn), side: s };
  }
  return { x: you.x, z: you.z + RUB.side, yaw: Math.PI, side: 0 };
}
/** Where Robert keeps when he's not roobing: by her, on her far side from you (so never under your feet). */
export function robertBy(her: { x: number; z: number }, you: { x: number; z: number }): { x: number; z: number } {
  const side = her.x >= you.x ? 1 : -1;
  return { x: her.x + side * RUB.follow.x, z: her.z + RUB.follow.z };
}
/** Close enough to Robert to ask him for an ear rub. */
export const atRobert = (you: { x: number; z: number }, rob: { x: number; z: number }): boolean => Math.hypot(you.x - rob.x, you.z - rob.z) < RUB.near;
