/* Pirate Den: a war frigate's plan, and Primates Rule, Dachimpy's own, as config. TypeScript, compiled
   to js/den-frigate.js; tested in tests/den-frigate.test.ts. js/den/frigate.js builds any war frigate
   from a plan and a ship's config (her name, her paints, what's on her deck); Primates Rule is the
   first (the user, 11 Nov: "I want to use my ship ... my war frigate that's painted black and white
   ... the skeleton cannons. That's just really cool. I want Primates Rule."). No apostrophe in her name.

   Sized by YPPedia's numbers against the sloop (src/ships.ts): three times the sloop's length and a
   third more (she's long and slender, as Puzzle Pirates draws her), twice her beam, and deep enough
   that her hull holds sixteen times the sloop's, as her hold does. Three masts, her sails 5⅓ times
   the sloop's (her sail cloth, 400 to 75). A raised quarterdeck aft and forecastle forward, as in her
   picture (notes/primates-rule/1-top-deck.jpg). Her 24 large guns: 12 on her main deck (YPPedia's
   main deck has 12 Gunnery stations), 6 a side, and 12 below on the gun deck, behind the upper row
   of ports. Places along her are x (metres from amidships, + to the bow), across her z (+ to
   starboard, her right; port, her left, is -z), as the sloop's are. */
import { WAR_FRIGATE, hullFor, halfBeam, type Hull } from './ships.js';

/** Which of her decks a place is on. */
export type Deck = 'quarter' | 'waist' | 'fore';

/** A mast: where it stands, how high above the water its lowest sail's foot is (clear of what's on
    deck), and its sails from the bottom up (width, height; square sails across her, as the sloop's).
    Its top: mastTop. */
export interface Mast { x: number; foot: number; sails: [number, number][] }

export interface Plan {
  hull: Hull;
  /** The quarterdeck: from her stern to `to`, `up` above the main deck. The forecastle: from `from`
      to her bow. */
  quarter: { to: number; up: number };
  fore: { from: number; up: number };
  /** The bulwark round each deck: how high, how thick. */
  bulwark: { h: number; t: number };
  /** The hull's paint stops this far above the water: bare wood below. */
  bottom: number;
  /** The two stripes (sideboard) round her: their middles' heights, and how deep each is. */
  stripes: { at: [number, number]; h: number };
  /** Her gun ports, two rows a side: their middles' heights, how many in each, their size. The upper
      row is the gun deck's (her 12 guns below); the lower, staggered, shut. */
  ports: { rows: [number, number]; each: number; size: number; from: number; to: number };
  masts: Mast[];
  /** The ship's wheel, on the quarterdeck. */
  helm: { x: number };
  /** Stairs from the main deck: up each side to the quarterdeck, up the middle to the forecastle. */
  stairs: { quarter: { len: number }; fore: { len: number; w: number } };
  /** Hatches in the main deck, down to the gun deck. */
  hatches: { x: number; z: number; w: number }[];
}

/** A war frigate's hull, from the sloop's by YPPedia's numbers. */
export const FRIGATE_HULL: Hull = hullFor(WAR_FRIGATE, 3.4, 2);

/** The war frigate, as Puzzle Pirates draws her. */
export const WAR_FRIGATE_PLAN: Plan = {
  hull: FRIGATE_HULL,
  quarter: { to: -2.4, up: 1.5 },
  fore: { from: 3.4, up: 0.7 },
  bulwark: { h: 0.72, t: 0.12 },
  bottom: 0.28,
  stripes: { at: [0.88, 1.62], h: 0.09 },
  ports: { rows: [0.5, 1.25], each: 6, size: 0.32, from: -5.6, to: 4.6 },
  masts: [
    { x: 5.0, foot: 5.3, sails: [[2.8, 1.6], [2.2, 1.2], [1.5, 0.8]] },
    { x: 0.6, foot: 5.0, sails: [[3.2, 1.8], [2.5, 1.3], [1.7, 0.9]] },
    { x: -4.8, foot: 5.8, sails: [[2.2, 1.4], [1.6, 1.0]] },
  ],
  helm: { x: -3.8 },
  stairs: { quarter: { len: 2.0 }, fore: { len: 0.8, w: 1.0 } },
  hatches: [{ x: -0.8, z: 0, w: 0.8 }],
};

/** The gap between one sail and the next up a mast, and the mast's head above its top sail. */
export const SAIL_GAP = 0.2, MAST_HEAD = 0.6;
/** Each sail's foot up a mast (above the water), and the mast's top. */
export function mastSails(m: Mast): { feet: number[]; top: number } {
  const feet: number[] = [];
  let y = m.foot;
  for (const [, h] of m.sails) { feet.push(y); y += h + SAIL_GAP; }
  return { feet, top: y - SAIL_GAP + MAST_HEAD };
}
/** Which deck is at `x` along her. */
export const deckAt = (p: Plan, x: number): Deck => (x < p.quarter.to ? 'quarter' : x >= p.fore.from ? 'fore' : 'waist');
/** That deck's height above the water. */
export const deckY = (p: Plan, d: Deck): number => p.hull.deck + (d === 'quarter' ? p.quarter.up : d === 'fore' ? p.fore.up : 0);
/** How far out from her middle the inside of her bulwark is at `x`. */
export const insideAt = (p: Plan, x: number): number => halfBeam(p.hull, x) - p.bulwark.t;

/** Her 12 main-deck guns, 6 a side: where each stands (muzzle out over her side). */
export function deckGuns(p: Plan, xs: number[]): { x: number; z: number; side: 'port' | 'starboard' }[] {
  return xs.flatMap((x) => (['port', 'starboard'] as const).map((side) => ({ x, z: (side === 'port' ? -1 : 1) * (insideAt(p, x) - 0.6), side })));
}
/** The upper row of ports, her gun deck's, and the lower, staggered between them. */
export function portXs(p: Plan): [number[], number[]] {
  const { from, to, each } = p.ports, step = (to - from) / (each - 1);
  const upper = Array.from({ length: each }, (_, i) => from + i * step);
  return [upper, upper.map((x) => x + step / 2)];
}

/** A piece of furniture on her deck, by its kind in js/den/furniture.js's FURNITURE, at (x, z),
    turned `yaw` (0: facing +z, to starboard). `opts`: what that piece takes. */
export interface Placed { kind: string; x: number; z: number; yaw?: number; opts?: Record<string, unknown> }
/** About how far each piece reaches from where it stands (for keeping them clear of each other). */
export const FOOT: Record<string, number> = {
  skeletalCannon: 0.55, gibbet: 0.5, skeletonChair: 0.3, armour: 0.35, grandPiano: 0.6, anchorChair: 0.3,
  table: 0.42, jar: 0.25, toolChest: 0.35,
};

/** A war frigate's config: her name, her paints, her guns' places and what's on her deck. */
export interface Frigate {
  name: string;
  /** YPPedia's paints for a war frigate's main deck: hull, sideboard (the stripes and the ports'
      frames) and railing; and the rest: her bare wood below the paint, her deck, her sails, the gold
      of her figurehead's scrollwork. */
  paint: { hull: string; sideboard: string; railing: string; bottom: string; deck: string; sails: string; gold: string };
  /** Her figurehead: a beast's head (Primates Rule's, black). */
  figurehead: { kind: 'beast'; col: string };
  /** Where along her the main deck's guns stand (one each side at each). */
  guns: number[];
  /** The guns' look (js/den/furniture.js, skeletalCannon). */
  gunKind: string;
  furniture: Placed[];
}

/** Primates Rule, from the user's picture of her deck (TODO.md, "Pictures of Primates Rule"): black
    and white, the skeleton cannons, gibbets, the skeleton furniture; suits of armour on plinths, a
    black grand piano, anchor-backed chairs, tables of cards and bottles, jars with creatures in them,
    tool chests. ("go relatively close": the user, 11 Nov.) */
export const PRIMATES_RULE: Frigate = {
  name: 'Primates Rule',
  paint: { hull: '#18171b', sideboard: '#f1efe8', railing: '#f4f2ec', bottom: '#a27a4f', deck: '#c49a6a', sails: '#ece6d8', gold: '#d6a63c' },
  figurehead: { kind: 'beast', col: '#1c1a1e' },
  guns: [-5.4, -3.2, 0.2, 1.5, 2.75, 4.4],
  gunKind: 'skeletalCannon',
  furniture: [
    // The quarterdeck: the piano at the stern, armour in its corners, two anchor chairs to listen
    // from; a table of bottles by the wheel.
    { kind: 'grandPiano', x: -6.55, z: 0, yaw: Math.PI / 2 },
    { kind: 'armour', x: -6.9, z: -1.3, yaw: Math.PI / 2 },
    { kind: 'armour', x: -6.9, z: 1.3, yaw: Math.PI / 2 },
    { kind: 'anchorChair', x: -5.45, z: -0.45, yaw: -Math.PI / 2 - 0.3 },
    { kind: 'anchorChair', x: -5.45, z: 0.45, yaw: -Math.PI / 2 + 0.3 },
    { kind: 'table', x: -2.95, z: 0, opts: { cup: false, bottles: 3, black: true } },
    // The main deck: armour either side of the doors under the quarterdeck, jars, a hatch, skeleton
    // chairs, a tool chest.
    { kind: 'armour', x: -2.05, z: -0.8, yaw: Math.PI / 2 },
    { kind: 'armour', x: -2.05, z: 0.8, yaw: Math.PI / 2 },
    { kind: 'jar', x: 0.95, z: 0.7, opts: { creature: '#8a5cd8' } },
    { kind: 'jar', x: -0.9, z: 0.95, opts: { creature: '#c8343a' } },
    { kind: 'skeletonChair', x: 2.05, z: -0.5, yaw: 0.4 },
    { kind: 'skeletonChair', x: 2.05, z: 0.5, yaw: Math.PI - 0.4 },
    { kind: 'toolChest', x: 0.95, z: -0.75, yaw: Math.PI },
    // The forecastle: the gibbets, a skeleton sat in a chair, a table of cards, a tool chest.
    { kind: 'gibbet', x: 6.1, z: -0.6, yaw: Math.PI / 2 },
    { kind: 'gibbet', x: 3.95, z: 0.55, yaw: -Math.PI / 2 },
    { kind: 'skeletonChair', x: 6.1, z: 0.72, yaw: -Math.PI / 2 - 0.5, opts: { sitter: true } },
    { kind: 'table', x: 7.0, z: 0, opts: { cup: false, cards: true, bottles: 1, black: true } },
    { kind: 'toolChest', x: 4.25, z: -0.6, yaw: 0 },
  ],
};

/** Everything standing on her decks (masts, stairs, hatches, the wheel, the guns and the furniture),
    each where it is and how far it reaches: for checking nothing's in anything else's way. */
export function onDeck(p: Plan, f: Frigate): { what: string; x: number; z: number; r: number; deck: Deck }[] {
  const at = (what: string, x: number, z: number, r: number) => ({ what, x, z, r, deck: deckAt(p, x) });
  const l = p.quarter.to, s = p.stairs;
  return [
    ...p.masts.map((m) => at('mast', m.x, 0, 0.3)),
    at('helm', p.helm.x, 0, 0.35),
    ...p.hatches.map((h) => at('hatch', h.x, h.z, h.w * 0.56)),
    // (the stairs up to the quarterdeck, along each side just forward of it; up to the forecastle,
    // in the middle just aft of it)
    ...[-1, 1].map((sd) => at('stairs', l + s.quarter.len / 2, sd * (insideAt(p, l + s.quarter.len / 2) - 0.32), 0.55)),
    at('stairs', p.fore.from - s.fore.len / 2 - 0.01, 0, 0.5),
    ...deckGuns(p, f.guns).map((g) => at(f.gunKind, g.x, g.z, FOOT[f.gunKind] ?? 0.55)),
    ...f.furniture.map((o) => at(o.kind, o.x, o.z, FOOT[o.kind] ?? 0.4)),
  ];
}
