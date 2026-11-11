/* Pirate Den: Mischievious's wedding, a side quest on her island. TypeScript, compiled to
   js/den-wedding.js; tested in tests/den-wedding.test.ts. js/den/wedding.js (and wedding-props.js,
   wedding-scene.js) draws it, runs the planner and plays the ceremony; this is what there is to choose
   and what's said: the tone, the venues, the themes and the layouts they start from, the guests'
   outfits, the suitors, the plots (each a timeline of beats and lines), Mischievious's gushing, and the
   whole set-up as one config, made safe by clean() and packed into a share link by encode().

   The user (IDEAS.md, "A Puzzle Pirates wedding", 10 Nov): decorating and dressing up made central, a
   giggly, excited host who loves everything you do ("never a rule you can fail"), a line of suitors,
   blind-date style, start from a theme then tune it, choose how the wedding goes, a cheesy cutscene at
   the end and a portrait to keep and share. And on the tone: "you could choose the happy cheesy or the
   dark humour ... depending on what kind of wedding you want to go for". So the tone's chosen first:
   Happy and cheesy (the venue clean and pretty, her welcome all giggles and romance, no mishap) or Dark
   humour (the venue a wreck from the last wedding, blood and guts, extra security hired, the jilted
   groom bandaged and back as Bachelor number one). It flavours what she says and what she suggests,
   but every theme and plot is open in either.

   Mischievious is a real pirate, only a look (PIRATES.Mischievious and MISCHIEVIOUS_VERSIONS in
   js/den-look.js); this knows nothing of how anyone's drawn. Looks here are partial: the den's
   cleanLook fills in the rest, after wearable() has swapped anything the wardrobe hasn't got yet. */

/** A look, partial: slot ids and dye names as the wardrobe (js/den-look.js) has them. */
export type Look = Record<string, string | number | boolean>;

/** The Puzzle Pirates dyes, by name, as the wardrobe's DYES has them (a test checks each is there).
    Their order is the share link's: new ones go on the end. */
export const DYE_NAMES = [
  'aqua', 'black', 'blue', 'brown', 'gold', 'green', 'grey', 'lavender', 'light blue', 'light green', 'lime', 'lemon',
  'magenta', 'maroon', 'mint', 'navy', 'orange', 'peach', 'persimmon', 'pink', 'purple', 'red', 'rose', 'tan', 'violet',
  'white', 'yellow', 'shadow', 'atlantean', 'plum', 'crimson',
] as const;
const isDye = (c: unknown): c is string => typeof c === 'string' && (DYE_NAMES as readonly string[]).includes(c);

// ---------- the tone ----------
export const TONES = [
  { id: 'happy', name: 'Happy and cheesy', blurb: 'Hearts, flowers and giggles. Nothing goes wrong. Probably.' },
  { id: 'dark', name: 'Dark humour', blurb: 'The last wedding went a bit bloody. She\'s not bothered.' },
] as const;
export type ToneId = typeof TONES[number]['id'];

// ---------- the venues, all on her island ----------
/** Every venue has the same floor plan: the altar at the far end (-z), the aisle down the middle to
    its foot (+z), and room either side for benches; props go anywhere in AREA (metres, from its
    middle). */
export const VENUES = [
  { id: 'beach', name: 'The beach', where: 'on the beach', blurb: 'An arch on the sand, the sea behind you.' },
  { id: 'chapel', name: 'The clifftop chapel', where: 'in the clifftop chapel', blurb: 'An old ruin up on the cliff. Very romantic. Very windy.' },
  { id: 'deck', name: 'The ship\'s deck', where: 'on a ship\'s deck', blurb: 'Out along the jetty, on the deck of a big old ship.' },
] as const;
export type VenueId = typeof VENUES[number]['id'];
export const AREA = { x: 6, z0: -6, z1: 7 } as const;
export const ALTAR = { x: 0, z: -4.6 } as const;
export const AISLE_FOOT = { x: 0, z: 6.4 } as const;
/** Where the couple stand at the altar: you on the left as the guests look, your partner on the right. */
export const COUPLE = { you: { x: -0.65, z: -3.7 }, partner: { x: 0.65, z: -3.7 } } as const;
/** The two security guards, either side at the front. */
export const GUARDS = [{ x: -5.2, z: -3.6 }, { x: 5.2, z: -3.6 }] as const;

// ---------- props ----------
export const PROPS = [
  ['bench', 'Bench'], ['arch', 'Arch'], ['flowers', 'Flowers'], ['banner', 'Banner'], ['barrel', 'Barrel'],
  ['table', 'Table'], ['lantern', 'Lantern'], ['candles', 'Candles'], ['cake', 'Cake'], ['splat', 'Splatter'],
] as const;
export type PropKind = typeof PROPS[number][0];
/** A prop: its kind, where (x, z: metres in AREA, on quarter metres), its turn (r: eighths of a turn),
    its colour (a dye), and w: wrecked (a bench overturned, a banner torn, the arch snapped). */
export interface Prop { k: PropKind; x: number; z: number; r: number; c: string; w?: boolean }
export const MAX_PROPS = 48;
/** How much room each needs (its radius, metres): for picking it and keeping it in AREA. */
export const PROP_R: Record<PropKind, number> = { bench: 1.2, arch: 1.3, flowers: 0.35, banner: 0.8, barrel: 0.4, table: 0.6, lantern: 0.25, candles: 0.3, cake: 0.45, splat: 0.6 };
const snap = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v * 4) / 4));
// (on quarter metres, as anything you move is)
const P = (k: PropKind, x0: number, z0: number, c: string, r0 = 0, w = false): Prop => {
  const x = snap(x0, -AREA.x, AREA.x), z = snap(z0, AREA.z0, AREA.z1), r = ((Math.round(r0) % 8) + 8) % 8;
  return w ? { k, x, z, r, c, w } : { k, x, z, r, c };
};

// ---------- themes ----------
export interface Theme {
  id: string; name: string; blurb: string;
  /** Its colours: the main one, the second, the accent, and two more for guests and flowers. */
  dyes: readonly string[];
  /** The guests' outfits it starts with (one each). */
  guests: readonly Look[];
  /** What a guest might wear in it, by body, for "Something else to wear". */
  wear: { m: Record<string, readonly string[]>; f: Record<string, readonly string[]> };
}
const ROSY: Theme = {
  id: 'rosy', name: 'Happy and rosy', blurb: 'Roses, pinks and a great big cake.',
  dyes: ['rose', 'pink', 'white', 'peach', 'lavender'],
  guests: [
    { body: 'f', hair: 'bun', hairCol: 'blonde', hat: 'wide', hatCol: 'rose', hatCol2: 'white', top: 'corset', topCol: 'pink', topCol2: 'white', legs: 'long', legsCol: 'rose', feet: 'shoes', feetCol: 'white', smile: true, patch: false },
    { body: 'm', hair: 'short', hairCol: 'brown', beard: 'goatee', hat: 'tricorne', hatCol: 'white', top: 'captain', topCol: 'white', topCol2: 'pink', legs: 'pants', legsCol: 'white', feet: 'shoes', feetCol: 'black', smile: true, patch: false },
    { body: 'f', hair: 'braids', hairCol: 'auburn', hat: 'butterfly', hatCol: 'lavender', top: 'frilly', topCol: 'lavender', topCol2: 'white', legs: 'gown', legsCol: 'lavender', feet: 'shoes', feetCol: 'lavender', smile: true, patch: false },
    { body: 'm', hair: 'ponytail', hairCol: 'blonde', beard: 'moustache', hat: 'feathered', hatCol: 'peach', hatCol2: 'white', top: 'vest', topCol: 'peach', topCol2: 'white', legs: 'pantaloons', legsCol: 'peach', feet: 'boots', feetCol: 'brown', smile: true, patch: false },
    { body: 'f', hair: 'wavy', hairCol: 'ginger', hat: 'tiara', hatCol: 'white', top: 'dresstop', topCol: 'peach', topCol2: 'rose', legs: 'gown', legsCol: 'peach', feet: 'shoes', feetCol: 'rose', smile: true, patch: false, hand: 'bouquet' },
    { body: 'm', hair: 'long', hairCol: 'black', beard: 'none', hat: 'none', top: 'swashbuckler', topCol: 'rose', topCol2: 'white', legs: 'pants', legsCol: 'navy', feet: 'fancy', feetCol: 'white', feetCol2: 'rose', smile: true, patch: false },
    { body: 'f', hair: 'ponytail', hairCol: 'dark brown', hat: 'feathered', hatCol: 'pink', hatCol2: 'white', top: 'buccaneer', topCol: 'white', topCol2: 'pink', legs: 'short', legsCol: 'pink', feet: 'boots', feetCol: 'white', smile: true, patch: false, fam: 'parrot', famCol: 'pink', famCol2: 'white' },
    { body: 'm', hair: 'wavy', hairCol: 'grey', beard: 'long', hat: 'captain', hatCol: 'lavender', hatCol2: 'white', top: 'sash', topCol: 'white', topCol2: 'lavender', legs: 'pants', legsCol: 'lavender', feet: 'shoes', feetCol: 'black', smile: true, patch: false },
  ],
  wear: {
    m: { hat: ['tricorne', 'feathered', 'captain', 'none'], top: ['captain', 'vest', 'swashbuckler', 'sash'], legs: ['pants', 'pantaloons'], feet: ['shoes', 'fancy', 'boots'], hand: ['none', 'bouquet'] },
    f: { hat: ['wide', 'feathered', 'tiara', 'butterfly', 'none'], top: ['corset', 'frilly', 'dresstop', 'buccaneer'], legs: ['long', 'gown', 'short'], feet: ['shoes', 'fancy'], hand: ['none', 'bouquet'] },
  },
};
const GORY: Theme = {
  id: 'gory', name: 'Bloody and gory', blurb: 'Blood red, black lace and a lot of splatter.',
  dyes: ['maroon', 'black', 'red', 'shadow', 'grey'],
  guests: [
    { body: 'f', hair: 'long', hairCol: 'black', hat: 'veil', hatCol: 'black', top: 'corset', topCol: 'black', topCol2: 'maroon', legs: 'gown', legsCol: 'black', feet: 'boots', feetCol: 'black', patch: true, smile: true },
    { body: 'm', hair: 'bald', hairCol: 'black', beard: 'full', hat: 'tricorne', hatCol: 'black', top: 'buccaneer', topCol: 'maroon', topCol2: 'black', legs: 'pants', legsCol: 'black', feet: 'boots', feetCol: 'black', patch: true },
    { body: 'f', hair: 'braids', hairCol: 'white', hat: 'bandana', hatCol: 'red', top: 'vest', topCol: 'black', topCol2: 'red', legs: 'patched', legsCol: 'shadow', legsCol2: 'red', feet: 'boots', feetCol: 'maroon', patch: false, smile: true },
    { body: 'm', hair: 'long', hairCol: 'black', beard: 'goatee', hat: 'captain', hatCol: 'shadow', hatCol2: 'red', top: 'captain', topCol: 'shadow', topCol2: 'red', legs: 'pants', legsCol: 'shadow', feet: 'fancy', feetCol: 'black', feetCol2: 'red', patch: false },
    { body: 'f', hair: 'wavy', hairCol: 'auburn', hat: 'wide', hatCol: 'black', hatCol2: 'red', top: 'buccaneer', topCol: 'red', topCol2: 'black', legs: 'long', legsCol: 'maroon', feet: 'fancy', feetCol: 'black', feetCol2: 'red', patch: true, fam: 'octopus', famCol: 'red' },
    { body: 'm', hair: 'short', hairCol: 'grey', beard: 'bushy', hat: 'bandana', hatCol: 'maroon', top: 'striped', topCol: 'red', topCol2: 'black', legs: 'patched', legsCol: 'black', legsCol2: 'maroon', feet: 'boots', feetCol: 'brown', patch: true },
    { body: 'f', hair: 'bun', hairCol: 'black', hat: 'none', top: 'dresstop', topCol: 'maroon', topCol2: 'black', legs: 'gown', legsCol: 'maroon', feet: 'shoes', feetCol: 'black', patch: false, smile: true },
    { body: 'm', hair: 'ponytail', hairCol: 'ginger', beard: 'long', hat: 'viking', hatCol: 'grey', top: 'swashbuckler', topCol: 'black', topCol2: 'maroon', legs: 'kilt', legsCol: 'maroon', legsCol2: 'black', feet: 'boots', feetCol: 'black', patch: false },
  ],
  wear: {
    m: { hat: ['tricorne', 'bandana', 'captain', 'viking'], top: ['buccaneer', 'captain', 'striped', 'swashbuckler'], legs: ['pants', 'patched', 'kilt'], feet: ['boots', 'fancy'], hand: ['none'] },
    f: { hat: ['veil', 'bandana', 'wide', 'none'], top: ['corset', 'vest', 'buccaneer', 'dresstop'], legs: ['gown', 'long', 'patched'], feet: ['boots', 'fancy'], hand: ['none'] },
  },
};
const DRUNK: Theme = {
  id: 'drunk', name: 'Drunkards\' fest', blurb: 'Barrels of grog, tankards all round.',
  dyes: ['tan', 'gold', 'brown', 'orange', 'lemon'],
  guests: [
    { body: 'm', hair: 'short', hairCol: 'ginger', beard: 'bushy', hat: 'sleeping', hatCol: 'orange', top: 'striped', topCol: 'orange', topCol2: 'white', legs: 'knickers', feet: 'boots', feetCol: 'brown', hand: 'tankard', smile: true, patch: false },
    { body: 'f', hair: 'ponytail', hairCol: 'brown', hat: 'bandana', hatCol: 'gold', top: 'belt', legs: 'flare', legsCol: 'tan', feet: 'boots', feetCol: 'brown', hand: 'tankard', smile: true, patch: false },
    { body: 'm', hair: 'bald', hairCol: 'brown', beard: 'long', hat: 'fez', hatCol: 'red', top: 'vest', topCol: 'tan', topCol2: 'gold', legs: 'kilt', legsCol: 'orange', legsCol2: 'brown', feet: 'boots', feetCol: 'brown', hand: 'tankard', smile: true, patch: true },
    { body: 'f', hair: 'wavy', hairCol: 'blonde', hat: 'wide', hatCol: 'lemon', hatCol2: 'orange', top: 'corset', topCol: 'gold', topCol2: 'brown', legs: 'short', legsCol: 'brown', feet: 'curled', feetCol: 'gold', hand: 'tankard', smile: true, patch: false },
    { body: 'm', hair: 'wavy', hairCol: 'dark brown', beard: 'full', hat: 'tricorne', hatCol: 'brown', top: 'sash', topCol: 'lemon', topCol2: 'orange', legs: 'patched', legsCol: 'tan', legsCol2: 'brown', feet: 'shoes', feetCol: 'brown', hand: 'tankard', smile: true, patch: false },
    { body: 'f', hair: 'short', hairCol: 'ginger', hat: 'sleeping', hatCol: 'tan', top: 'striped', topCol: 'brown', topCol2: 'lemon', legs: 'knickers', feet: 'boots', feetCol: 'tan', hand: 'tankard', smile: true, patch: true },
    { body: 'm', hair: 'long', hairCol: 'blonde', beard: 'moustache', hat: 'feathered', hatCol: 'gold', hatCol2: 'orange', top: 'swashbuckler', topCol: 'gold', topCol2: 'brown', legs: 'pantaloons', legsCol: 'lemon', feet: 'curled', feetCol: 'gold', hand: 'tankard', smile: true, patch: false, fam: 'monkey', famCol: 'ginger' },
    { body: 'f', hair: 'bun', hairCol: 'grey', hat: 'none', top: 'vest', topCol: 'orange', topCol2: 'tan', legs: 'long', legsCol: 'brown', feet: 'shoes', feetCol: 'brown', hand: 'tankard', smile: true, patch: false },
  ],
  wear: {
    m: { hat: ['sleeping', 'fez', 'tricorne', 'feathered', 'bandana'], top: ['striped', 'vest', 'sash', 'swashbuckler'], legs: ['knickers', 'kilt', 'patched', 'pantaloons'], feet: ['boots', 'curled', 'shoes'], hand: ['tankard'] },
    f: { hat: ['sleeping', 'bandana', 'wide', 'none'], top: ['belt', 'corset', 'striped', 'vest'], legs: ['flare', 'short', 'knickers', 'long'], feet: ['boots', 'curled', 'shoes'], hand: ['tankard'] },
  },
};
export const THEMES = [ROSY, GORY, DRUNK] as const;
export type ThemeId = 'rosy' | 'gory' | 'drunk';
export const themeOf = (id: string | null): Theme | null => THEMES.find((t) => t.id === id) ?? null;
export const GUESTS = 8;

/** The benches, four rows a side, facing the altar; everyone's layout starts from them. */
const ROWS = [-2.4, -0.9, 0.6, 2.1];
function benches(c: string): Prop[] { return ROWS.flatMap((z) => [P('bench', -2.1, z, c), P('bench', 2.1, z, c)]); }
/** The layout a theme starts from at a venue: the benches and the arch, the theme's own dressing,
    and a little something each venue adds (lanterns at the beach's aisle, candles in the chapel,
    barrels on the deck). */
export function layout(venue: VenueId, theme: ThemeId): Prop[] {
  const T = themeOf(theme)!, [a, b, c, d] = T.dyes;
  const out: Prop[] = [P('arch', ALTAR.x, -5.3, a), ...benches(b)];
  if (theme === 'rosy') {
    for (const z of ROWS) out.push(P('flowers', -0.95, z, z % 2 ? a : d), P('flowers', 0.95, z, z % 2 ? a : d));
    out.push(P('candles', -1.7, -4.9, c), P('candles', 1.7, -4.9, c), P('banner', -3.8, -5.4, a, 0), P('banner', 3.8, -5.4, a, 0), P('table', 4.3, 4.6, c), P('cake', 4.3, 4.6, a));
  } else if (theme === 'gory') {
    for (const [x, z] of [[-0.6, 3.6], [0.7, 1.2], [-3.4, -3.6], [4.1, 0.2], [-4.4, 3.2], [0.2, -2.0]] as const) out.push(P('splat', x, z, 'red', (x * 3 + z * 5 + 16) % 8 | 0));
    out.push(P('banner', -3.8, -5.4, c, 0), P('banner', 3.8, -5.4, c, 0), P('flowers', -1.0, -4.6, a), P('flowers', 1.0, -4.6, a), P('lantern', -4.4, -1.6, c), P('lantern', 4.4, -1.6, c), P('candles', -1.8, -5.0, b), P('candles', 1.8, -5.0, b), P('barrel', -4.6, 4.8, b), P('table', 4.3, 4.6, b), P('cake', 4.3, 4.6, c));
  } else {
    for (const [x, z] of [[-4.6, -3.8], [4.6, -3.8], [-4.8, 1.5], [4.8, 1.5], [-4.4, 5.2], [-3.6, 5.6]] as const) out.push(P('barrel', x, z, c));
    out.push(P('banner', -3.8, -5.4, d, 0), P('banner', 3.8, -5.4, d, 0), P('lantern', -1.2, 5.6, b), P('lantern', 1.2, 5.6, b), P('table', 4.2, 4.4, a), P('table', 2.4, 5.6, a, 2), P('cake', 4.2, 4.4, b), P('flowers', -1.0, -4.6, e(T)), P('flowers', 1.0, -4.6, e(T)));
  }
  if (venue === 'beach') out.push(P('lantern', -1.4, 6.6, b), P('lantern', 1.4, 6.6, b));
  else if (venue === 'chapel') out.push(P('candles', -3.4, -4.6, c), P('candles', 3.4, -4.6, c));
  else out.push(P('barrel', -5.4, -5.2, 'brown'), P('barrel', 5.4, -5.2, 'brown'));
  return out;
}
const e = (T: Theme) => T.dyes[4];
/** The venue as you find it in Dark humour: the last wedding's wreck. Benches overturned, the arch
    snapped, a banner torn, red splatters everywhere and the cake on the floor. (It was a rosy one.) */
export const WRECK: readonly Prop[] = [
  P('arch', 0.3, -5.3, 'rose', 1, true),
  P('bench', -2.3, -2.2, 'pink', 1, true), P('bench', 2.0, -0.6, 'pink', 7, true), P('bench', -1.8, 1.1, 'pink', 6), P('bench', 2.6, 2.4, 'pink', 2, true), P('bench', -3.4, 3.8, 'pink', 3, true),
  P('banner', -3.8, -5.4, 'rose', 0, true), P('banner', 3.8, -5.4, 'rose', 0),
  P('table', 4.3, 4.6, 'white', 1, true), P('cake', 3.6, 5.3, 'rose', 0, true), P('barrel', -4.8, 5.0, 'brown', 2, true),
  P('splat', -0.4, -3.2, 'red', 1), P('splat', 0.6, 0.3, 'red', 4), P('splat', -2.8, 2.6, 'red', 6), P('splat', 3.6, -2.6, 'red', 3), P('splat', 1.2, 4.1, 'red', 5), P('splat', -4.2, -0.8, 'red', 2), P('splat', 0.1, -4.6, 'red', 7),
  P('flowers', -0.9, -0.9, 'rose', 0, true), P('flowers', 1.1, 2.1, 'pink', 0, true),
];
/** The venue as you find it in Happy and cheesy: all clean and pretty, ready for you. */
export const arrival = (tone: ToneId): Prop[] => (tone === 'dark' ? WRECK.map((p) => ({ ...p })) : layout('beach', 'rosy'));

/** Where the guests sit: two to a bench (one that's standing up), in the order the benches are laid;
    any guests left over stand at the back. Each: where, which way they face (a turn, radians, as
    three.js's rotation.y: 0 faces +z) and whether they're sitting. */
export interface Seat { x: number; z: number; yaw: number; sit: boolean }
export function seatsFor(props: readonly Prop[], n = GUESTS): Seat[] {
  const out: Seat[] = [];
  for (const b of props) {
    if (b.k !== 'bench' || b.w) continue;
    const a = b.r * Math.PI / 4;
    for (const lx of [-0.55, 0.55]) {
      if (out.length >= n) return out;
      // (a bench's length along its own x; it faces its own -z, so they look its way)
      out.push({ x: b.x + lx * Math.cos(a), z: b.z - lx * Math.sin(a), yaw: a + Math.PI, sit: true });
    }
  }
  for (let i = 0; out.length < n; i++) {
    const side = i % 2 ? 1 : -1, row = Math.floor(i / 2);
    out.push({ x: side * (1.6 + (row % 4) * 1.1), z: 4.6 + Math.floor(row / 4) * 0.9, yaw: Math.PI, sit: false });
  }
  return out;
}

/** The hired security, in black and grey, cutlasses at their sides; and the raiders who crash it. */
export const SECURITY: readonly Look[] = [
  { body: 'm', skin: 4, hair: 'bald', hairCol: 'black', beard: 'full', patch: false, smile: false, hat: 'bandana', hatCol: 'black', top: 'vest', topCol: 'black', topCol2: 'grey', waist: 'buckle', waistCol: 'black', legs: 'pants', legsCol: 'black', feet: 'boots', feetCol: 'black' },
  { body: 'f', skin: 1, hair: 'bun', hairCol: 'dark brown', patch: true, smile: false, hat: 'tricorne', hatCol: 'black', top: 'buccaneer', topCol: 'grey', topCol2: 'black', waist: 'belt', waistCol: 'black', legs: 'pants', legsCol: 'black', feet: 'boots', feetCol: 'black' },
];
export const RAIDERS: readonly Look[] = [
  { body: 'm', skin: 2, hair: 'long', hairCol: 'black', beard: 'bushy', patch: true, hat: 'bandana', hatCol: 'red', top: 'striped', topCol: 'red', topCol2: 'white', legs: 'patched', legsCol: 'navy', legsCol2: 'tan', feet: 'boots', feetCol: 'black' },
  { body: 'f', skin: 3, hair: 'braids', hairCol: 'ginger', patch: false, hat: 'bandana', hatCol: 'black', top: 'vest', topCol: 'maroon', topCol2: 'white', legs: 'pants', legsCol: 'brown', feet: 'boots', feetCol: 'brown' },
  { body: 'm', skin: 0, hair: 'short', hairCol: 'brown', beard: 'goatee', patch: true, hat: 'tricorne', hatCol: 'brown', top: 'striped', topCol: 'black', topCol2: 'yellow', legs: 'pants', legsCol: 'black', feet: 'boots', feetCol: 'black' },
];

// ---------- the suitors ----------
/** "Here are your bachelors!": a line of them, blind-date style, bouquets out, each with a cheesy
    line. Men and women both, so anyone can find a match. Number one depends on the tone: in Dark
    humour, the groom left over from the last wedding (his bride had a mishap), bandaged and still in
    his finery; in Happy and cheesy, someone sweet. */
export interface Suitor { name: string; look: Look; line: string; hurt?: boolean }
const JILTED: Suitor = {
  name: 'Barnaby', hurt: true,
  look: { body: 'm', skin: 1, hair: 'short', hairCol: 'brown', beard: 'moustache', patch: false, smile: true, hat: 'none', top: 'captain', topCol: 'white', topCol2: 'gold', waist: 'sash', waistCol: 'rose', legs: 'pants', legsCol: 'white', feet: 'shoes', feetCol: 'black', hand: 'bouquet' },
  line: 'My last bride had a little mishap. With a cannon. I\'ve had a lie down and I\'m ready to try again!',
};
const SWEET: Suitor = {
  name: 'Sweet William',
  look: { body: 'm', skin: 2, hair: 'wavy', hairCol: 'blonde', beard: 'none', patch: false, smile: true, hat: 'feathered', hatCol: 'peach', hatCol2: 'white', top: 'vest', topCol: 'peach', topCol2: 'white', legs: 'pantaloons', legsCol: 'white', feet: 'shoes', feetCol: 'tan', hand: 'bouquet' },
  line: 'I picked you a daisy. I picked everyone a daisy, actually. I just really like daisies.',
};
const REST: Suitor[] = [
  { name: 'Saltwater Sal', look: { body: 'f', skin: 3, hair: 'braids', hairCol: 'black', patch: true, smile: true, hat: 'bandana', hatCol: 'aqua', top: 'vest', topCol: 'navy', topCol2: 'white', legs: 'patched', legsCol: 'navy', legsCol2: 'aqua', feet: 'boots', feetCol: 'black', hand: 'bouquet' },
    line: 'I can splice a rope, bilge a sloop and drink a kraken under the table. You\'ll never be bored.' },
  { name: 'Gentleman Jem', look: { body: 'm', skin: 4, hair: 'ponytail', hairCol: 'black', beard: 'goatee', patch: false, smile: true, hat: 'tricorne', hatCol: 'navy', top: 'swashbuckler', topCol: 'navy', topCol2: 'gold', legs: 'pants', legsCol: 'white', feet: 'fancy', feetCol: 'black', feetCol2: 'gold', hand: 'bouquet' },
    line: 'I\'ve written you a poem. It\'s mostly about rum, but you\'re in the last verse.' },
  { name: 'Captain Rosalind', look: { body: 'f', skin: 0, hair: 'wavy', hairCol: 'auburn', patch: false, smile: true, hat: 'captain', hatCol: 'maroon', hatCol2: 'gold', top: 'captain', topCol: 'maroon', topCol2: 'gold', legs: 'long', legsCol: 'black', feet: 'fancy', feetCol: 'black', feetCol2: 'gold', hand: 'bouquet' },
    line: 'I\'ve sunk forty ships, darling, but nobody\'s ever sunk my heart. Until now.' },
  { name: 'Wobbly Pete', look: { body: 'm', skin: 1, hair: 'bald', hairCol: 'grey', beard: 'long', patch: true, smile: true, hat: 'fez', hatCol: 'purple', top: 'striped', topCol: 'purple', topCol2: 'white', legs: 'kilt', legsCol: 'green', legsCol2: 'black', feet: 'curled', feetCol: 'gold', hand: 'bouquet', fam: 'parrot', famCol: 'green', famCol2: 'red' },
    line: 'I\'ve only the one good knee, but I\'ll go down on it for you. Getting up again\'s your job.' },
  { name: 'Lady Marigold', look: { body: 'f', skin: 5, hair: 'bun', hairCol: 'black', patch: false, smile: true, hat: 'wide', hatCol: 'orange', hatCol2: 'lemon', top: 'corset', topCol: 'orange', topCol2: 'lemon', legs: 'gown', legsCol: 'lemon', feet: 'shoes', feetCol: 'orange', hand: 'bouquet' },
    line: 'I\'ve a house on Admiral Island, three cats and a parrot who swears. We come as a set.' },
];
export const suitors = (tone: ToneId): Suitor[] => [tone === 'dark' ? JILTED : SWEET, ...REST];
const NUMBERS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
/** "Bachelor number one", "Bachelorette number two"... */
export const suitorTitle = (s: Suitor, i: number): string => `${s.look.body === 'f' ? 'Bachelorette' : 'Bachelor'} number ${NUMBERS[i] ?? i + 1}`;

// ---------- the plots ----------
export const PLOTS = [
  { id: 'sweet', name: 'Sweet and blissful', blurb: 'Vows, tears, a kiss. Nothing goes wrong at all.' },
  { id: 'raiders', name: 'Raiders crash it', blurb: 'Halfway through, raiders storm in. Good thing there\'s security.' },
  { id: 'drunk', name: 'Somebody\'s drunk', blurb: 'One of the guests has had a few. Mind the cake.' },
  { id: 'brawl', name: 'A brawl breaks out', blurb: 'Words are had. Then fists. Then benches.' },
] as const;
export type PlotId = typeof PLOTS[number]['id'];
/** Who says a line: the officiant (Mischievious, or a guard if you're marrying her), Mischievious
    herself, you, your partner, a guest (guest2: the one they're arguing with), the drunk, a guard, a
    raider. */
export type Who = 'off' | 'mis' | 'you' | 'partner' | 'guest' | 'guest2' | 'drunk' | 'guard' | 'raider';
/** A line, `at` seconds into its beat; `cake`: only said if there is (true) or isn't (false) a cake. */
export interface Line { who: Who; text: string; at: number; cake?: boolean }
export interface Beat { beat: string; secs: number; lines: Line[] }
/** How long a line stays up: long enough to read. */
export const readSecs = (text: string): number => Math.min(5, Math.max(1.6, text.length * 0.06));
const L = (who: Who, at: number, text: string, cake?: boolean): Line => (cake === undefined ? { who, at, text } : { who, at, text, cake });

/** Every wedding opens the same: everyone seated, your partner up the aisle, the vows begun. */
const OPEN: Beat[] = [
  { beat: 'seated', secs: 3.4, lines: [L('off', 0.4, 'Places, everyone! Ooh, I\'m going to cry.')] },
  { beat: 'procession', secs: 6, lines: [L('guest', 1.2, 'Ooh, look at them!'), L('guest2', 3.6, 'Stunning. Simply stunning.')] },
  { beat: 'vows', secs: 4.6, lines: [L('off', 0.2, 'Dearly beloved, we are gathered here today, on purpose...')] },
];
/** The plot's twist, after the vows begin. */
const TWIST: Record<PlotId, Beat[]> = {
  sweet: [
    { beat: 'sweet', secs: 9.2, lines: [L('partner', 0.3, 'I promise to love you, share my rum, and bilge beside you always.'), L('you', 4.6, 'And I promise to mend your wall. Every time.'), L('guest', 7.4, '*sniff* It\'s beautiful!')] },
    { beat: 'calm', secs: 3, lines: [L('mis', 0.3, 'Nothing\'s gone wrong. Is that allowed?')] },
  ],
  raiders: [
    { beat: 'storm', secs: 3.6, lines: [L('raider', 0.6, 'Yarr! Hand over the cake!')] },
    { beat: 'fight', secs: 6.2, lines: [L('mis', 0.2, 'Oh, not again. Security!'), L('guard', 2.6, 'On it, miss!')] },
    { beat: 'cleared', secs: 3, lines: [L('off', 0.3, 'Lovely. Now, where were we?')] },
  ],
  drunk: [
    { beat: 'stagger', secs: 7.2, lines: [L('drunk', 0.3, 'Hic! I jusht wanna shay... I love you all!'), L('mis', 4.4, 'Oh dear. Somebody\'s had a few.')] },
    { beat: 'topple', secs: 3.6, lines: [L('mis', 1.5, '...and that\'s the cake.', true), L('mis', 1.5, '...and down they go.', false)] },
  ],
  brawl: [
    { beat: 'argue', secs: 4.4, lines: [L('guest', 0.2, 'You spilt my grog!'), L('guest2', 2.2, 'You spilt your FACE!')] },
    { beat: 'brawl', secs: 6.4, lines: [L('mis', 1.0, 'Not the benches! They\'re hired!')] },
    { beat: 'sorry', secs: 2.6, lines: [L('guest', 0.3, '...sorry.')] },
  ],
};
/** And every one ends the same, cheesily: I do, the kiss, hearts and confetti, the portrait. */
const CLOSE: Beat[] = [
  { beat: 'ido', secs: 6.8, lines: [L('off', 0.1, 'Do you take {partner}, through bilge and broadside?'), L('you', 3.3, 'I do!'), L('partner', 5.0, 'I do!')] },
  { beat: 'kiss', secs: 4.2, lines: [L('off', 0.2, 'Then you may kiss!')] },
  { beat: 'cheer', secs: 4.2, lines: [L('guest', 0.3, 'Hooray!'), L('mis', 1.9, 'Eee! I love weddings!')] },
  { beat: 'portrait', secs: 2.4, lines: [] },
];
/** The whole ceremony for a plot, its lines filtered by whether there's a cake to fall in. */
export function plotScript(plot: PlotId, cake = true): Beat[] {
  return [...OPEN, ...TWIST[plot], ...CLOSE].map((b) => ({ ...b, lines: b.lines.filter((l) => l.cake === undefined || l.cake === cake) }));
}
export const scriptSecs = (s: readonly Beat[]): number => s.reduce((a, b) => a + b.secs, 0);
/** Where a ceremony is `t` seconds in: the beat, how far through it (u), its own time, its index, the
    line being said (each up till the next comes, the beat ends or it's been read), and done once
    it's over. */
export function plotAt(s: readonly Beat[], t: number): { beat: string; i: number; u: number; local: number; line: Line | null; done: boolean } {
  let t0 = 0;
  for (let i = 0; i < s.length; i++) {
    const b = s[i];
    if (t < t0 + b.secs) {
      const local = t - t0;
      let line: Line | null = null;
      for (let j = 0; j < b.lines.length; j++) {
        const l = b.lines[j], next = b.lines[j + 1]?.at ?? b.secs;
        if (local >= l.at && local < Math.min(next, l.at + readSecs(l.text) + 0.6)) line = l;
      }
      return { beat: b.beat, i, u: local / b.secs, local, line, done: false };
    }
    t0 += b.secs;
  }
  const last = s[s.length - 1];
  return { beat: last?.beat ?? '', i: s.length - 1, u: 1, local: last?.secs ?? 0, line: null, done: true };
}
/** A line with the names put in. */
export const fill = (text: string, names: { you: string; partner: string }): string => text.replace(/\{partner\}/g, names.partner).replace(/\{you\}/g, names.you);

// ---------- what Mischievious says ----------
/** Her welcome as you arrive, by tone: giggly and romantic, or not in the least bothered by the
    blood and guts. */
export const WELCOME: Record<ToneId, readonly string[]> = {
  happy: [
    'Oh! You came! Welcome to my island! Isn\'t it pretty?',
    'I do love a wedding. I\'ve been through five today, just for the fun of it! Hee hee!',
    'So! How are you? Would you like to get married?',
  ],
  dark: [
    'Oh, hello! Don\'t mind the blood and guts. The last wedding went a bit... bloody and gory.',
    'It\'s fine. Five weddings today, and only the one got raided. We\'ve hired a bit of extra security.',
    'So! How are you? Would you like to get married?',
  ],
};
/** The weddings she's been through today, for the fun of it (the user, 11 Nov: "showing that ... you
    can keep doing it for fun all the time ... I enjoy getting married, go through the ceremonies ...
    the first time I had this kind of wedding, second time it didn't quite go so well. The Raiders
    came and it was bloody gory ... tie it into the mechanics in a happy, fun way, not in a
    promiscuous ... way"). Each is the wedding's own options, so her stories (in GUSH, when you
    choose one, and asked about them) show you what there is to choose: between them, every venue,
    theme and plot. */
export const TODAY: readonly { venue: VenueId; theme: ThemeId; plot: PlotId }[] = [
  { venue: 'beach', theme: 'rosy', plot: 'sweet' },
  { venue: 'chapel', theme: 'gory', plot: 'raiders' },
  { venue: 'deck', theme: 'drunk', plot: 'drunk' },
  { venue: 'beach', theme: 'drunk', plot: 'brawl' },
  { venue: 'chapel', theme: 'rosy', plot: 'sweet' },
];
/** What she suggests first in each tone (every theme and plot is open in either). */
export const SUGGEST: Record<ToneId, { theme: ThemeId; plots: readonly PlotId[] }> = {
  happy: { theme: 'rosy', plots: ['sweet'] },
  dark: { theme: 'gory', plots: ['raiders', 'brawl'] },
};
/** Her reactions as you plan: gushing, giggly, delighted with whatever you do (never "wrong"), and
    funny about herself without ever running herself down (the user, 11 Nov: "more humorous about
    [her], but not negative ... 'she's nearly always free' ... that feels mean"). A pool is the same
    in both tones, or one for each. And she's the host, not the show (the user, 11 Nov: "she's just
    the facilitator for this wedding mechanic. I don't want this to be a [Mischievious] show, but it
    still needs a bit of fun and personality. And Puzzle Pirate personality ... rather than specific
    people"): chattery Puzzle Pirates banter, little about her own love life. */
type Pool = readonly string[] | Record<ToneId, readonly string[]>;
export const GUSH: Record<string, Pool> = {
  ask: { happy: ['Me, perhaps? I do make a gorgeous bride. Hee hee!', 'Me, perhaps? I\'ve the dress on already!'], dark: ['Me, perhaps? I\'ve a dress that\'s hardly been bled on.', 'Me, perhaps? I\'ve had the veil cleaned. Mostly.'] },
  her: { happy: ['Me? Oh, you charmer! Yes! Yes yes yes!', 'I knew you\'d ask! I\'ve had the dress on since Tuesday.'], dark: ['Me? Oh, you brave thing! Yes!', 'Lovely. I\'ll have security stand a bit closer this time.'] },
  version: ['Ooh, that one\'s my favourite!', 'Good choice. I look fabulous in that.', 'This old thing? Hee hee!', 'Twirl! Did you see me twirl?'],
  bachelors: ['Here are your bachelors!'],
  suitor: ['Ooh, good choice! I\'d have picked them too.', 'A match made in the Ocean!', 'They\'ll scrub up lovely.', 'Eee! I love them already!'],
  suitorOne: { happy: ['Sweet William! He\'s an absolute poppet.'], dark: ['Barnaby! He\'s had a lie down and everything.'] },
  own: ['Someone of your own! How mysterious. I love it.', 'Ooh, who\'s this? They\'re gorgeous!', 'Oh, I like them. I like them a lot.'],
  // (Each with her memory of one of today's weddings: TODAY, below.)
  venue_beach: ['The beach! Sand between your toes. Perfect.', 'Ooh, the sea breeze in your hair!', 'My first today was on the beach. Roses everywhere!'],
  venue_chapel: ['The old chapel! So romantic. Mind the drop.', 'Up on the cliff! You can see half the Ocean from here.', 'I\'ve had two up there today! The raiders came to one. The other made me cry.'],
  venue_deck: ['A ship\'s deck! How very piratey of you.', 'On the deck! We can sail off on honeymoon straight after!', 'My third today was on that deck. Mind the cake.'],
  theme_rosy: ['Happy and rosy! Pink everywhere! I could burst!', 'Roses! I adore roses.', 'Just like my first today! Roses all down the aisle.'],
  theme_gory: { happy: ['Bloody and gory! Ooh, daring. I love it.', 'Like my second today! That one went a bit red.'], dark: ['Bloody and gory! Saves on tidying up, really.', 'Red goes with everything. Especially blood.', 'Like my second today! The raiders saw to the red.'] },
  theme_drunk: ['A drunkards\' fest! Grog for everyone!', 'Barrels! Lovely, lovely barrels.', 'I\'ve had the inn send over every drop they\'ve got.', 'Like my third today! Grog in the punch, grog in the cake.'],
  plot_sweet: { happy: ['Sweet and blissful! Oh, I\'m welling up already.', 'My fifth today went just like that. I cried!'], dark: ['Sweet and blissful? Ooh, that\'d make a change.', 'My fifth today went just like that. Made a nice change!'] },
  plot_raiders: { happy: ['Raiders! How exciting! Good thing I hired security.', 'Like my second today! They came right up the aisle.'], dark: ['Raiders! Just like last time. I\'ll tell the guards.', 'Like my second today! They came right up the aisle.'] },
  plot_drunk: ['Somebody\'s drunk! There\'s always one. Hee hee!', 'Hee hee! I\'ll put the cake somewhere safe. Or not.', 'Like my third today! Face first in the cake.'],
  plot_brawl: { happy: ['A brawl? Ooh, a lively one!', 'Like my fourth today! Benches everywhere. Lovely day, though.'], dark: ['A brawl! Proper wedding, that.', 'Like my fourth today! Benches everywhere. Lovely day, though.'] },
  add: ['More! More is always better.', 'Oh, that\'s gorgeous there.', 'Yes! Just there!', 'Ooh, I wouldn\'t have thought of that!', 'Straight from the furnisher\'s, that!'],
  move: ['Ooh, much better there.', 'Perfect! Well, nearly perfect. No, perfect!', 'Yes, yes, yes! There!', 'Oh, that\'s much more you.'],
  turn: ['Ooh, a different angle!', 'Twirly! I love it.'],
  colour: ['That colour! Swoon.', 'Oh, it matches! Or clashes. I love it either way.', 'Gorgeous. Simply gorgeous.', 'Ooh, a pricey dye, that. Worth every doubloon.'],
  remove: ['Gone! Never liked it anyway.', 'Less is more. Sometimes. Hee hee!', 'Room to dance!'],
  dress: ['Oh, they look divine!', 'Stunning! Absolutely stunning!', 'Fit for the Governor\'s ball!', 'Fresh from the tailor, that.', 'Fabulous! Twirl for me!'],
  ready: ['Ooh, it\'s all ready! Shall we?', 'Everything\'s perfect. I\'m going to cry.'],
  back: ['You\'re back! I kept everything just as you left it.'],
  shared: ['Oh, this one! I remember this one. Shall we do it again?'],
  again: ['That was lovely. Shall we have another?'],
};
/** Things you can ask her while you plan, and what she says: chattery Puzzle Pirates banter, the
    wedding's and the Ocean's, not her own life (the user, 11 Nov: "Maybe it's that kind of
    interactive. You could ask her"). Same in both tones but where the tone gives her another answer. */
export const ASK_HER: readonly { q: string; a: string | Record<ToneId, string> }[] = [
  { q: 'How were today\'s weddings?', a: 'Five so far! Roses on the beach, raiders at the chapel, cake on the deck, a lovely brawl, and a sweet one to finish. Every one a treat!' },
  { q: 'Who\'s on the guest list?', a: 'Anyone with a clean shirt. Well, a shirt.' },
  { q: 'What\'s the dress code?', a: 'Whatever the tailor had in! Dyed to match, ideally. Black if you\'re showing off.' },
  { q: 'Who\'s paying for all this?', a: 'The crew\'s coffers, love. Don\'t tell the purser.' },
  { q: 'Is the cake safe?', a: { happy: 'Safer than a sloop in a sea battle!', dark: 'Safer than the last one. That one had a cutlass in it.' } },
  { q: 'What if raiders turn up?', a: { happy: 'Then the guards earn their doubloons. Hee hee!', dark: 'Then the guards earn their doubloons. And the mop earns its keep.' } },
  { q: 'Any advice?', a: 'Say "I do", not "Arr". People mix them up.' },
  { q: 'Can my familiar come?', a: 'Of course! Parrots in the front row. Monkeys at the back, near the cake.' },
  { q: 'Who\'s doing the music?', a: 'A shanty-singer from the inn. He knows three songs. All about the sea.' },
];
/** Her answer to the i-th question, in the tone. */
export const answer = (i: number, tone: ToneId): string => {
  const a = ASK_HER[i]?.a;
  return a === undefined ? '' : typeof a === 'string' ? a : a[tone];
};
/** Her chatter: a line for something that's happened, never the same line twice running. */
export class Gush {
  last = '';
  constructor(public tone: ToneId = 'happy', private rand: () => number = Math.random) {}
  pool(ev: string): readonly string[] {
    const p = GUSH[ev];
    if (!p) return [];
    return Array.isArray(p) ? p : (p as Record<ToneId, readonly string[]>)[this.tone];
  }
  say(ev: string): string {
    const all = this.pool(ev), fresh = all.length > 1 ? all.filter((l) => l !== this.last) : all;
    if (!fresh.length) return '';
    return (this.last = fresh[Math.min(fresh.length - 1, Math.floor(this.rand() * fresh.length))]);
  }
}

// ---------- looks the wardrobe hasn't got yet ----------
/** Stand-ins for wardrobe items still to come, tried in order: wearable() uses the first one the
    wardrobe has, so a guest is never left in the wrong thing (and once the item's there, it's worn). */
export const STAND_INS: Record<string, Record<string, readonly string[]>> = {
  hat: { veil: ['none'], tiara: ['none'], butterfly: ['feathered', 'none'] },
  top: { dresstop: ['corset', 'belt', 'plain'], frilly: ['corset', 'belt', 'plain'] },
  legs: { gown: ['long', 'pants'] },
  hand: { bouquet: ['none'] },
  fam: { squirrel: ['none'] },
};
/** A look with whatever the wardrobe hasn't got (has(slot, body, id) says) swapped for a stand-in. */
export function wearable(look: Look, has: (slot: string, body: string, id: string) => boolean): Look {
  const out: Look = { ...look }, body = look.body === 'f' ? 'f' : 'm';
  for (const [slot, subs] of Object.entries(STAND_INS)) {
    const id = out[slot];
    if (typeof id !== 'string' || has(slot, body, id)) continue;
    const alt = (subs[id] ?? []).find((a) => has(slot, body, a));
    if (alt) out[slot] = alt; else delete out[slot];
  }
  return out;
}
/** A guest dressed afresh within a theme: its items for their body, its colours. */
export function themeLook(theme: ThemeId, body: 'm' | 'f', rand: () => number = Math.random): Look {
  const T = themeOf(theme)!, pick = <X>(xs: readonly X[]): X => xs[Math.floor(rand() * xs.length) % xs.length];
  const L: Look = { body, skin: Math.floor(rand() * 6) % 6, smile: rand() < 0.75, patch: theme === 'gory' && rand() < 0.5 };
  for (const [slot, ids] of Object.entries(T.wear[body])) L[slot] = pick(ids);
  for (const k of ['hatCol', 'hatCol2', 'topCol', 'topCol2', 'legsCol', 'legsCol2', 'feetCol', 'feetCol2']) L[k] = pick(T.dyes);
  if (body === 'm') L.beard = pick(['full', 'goatee', 'moustache', 'none']);
  L.hair = pick(body === 'm' ? ['short', 'ponytail', 'long', 'wavy', 'bald'] : ['long', 'ponytail', 'bun', 'braids', 'wavy']);
  L.hairCol = pick(['black', 'dark brown', 'brown', 'auburn', 'ginger', 'blonde', 'grey']);
  return L;
}

// ---------- the whole set-up ----------
/** Who you marry: her (which version: an index into MISCHIEVIOUS_VERSIONS), a suitor, or someone of
    your own (their look). */
export type Partner = { kind: 'her'; ver: number } | { kind: 'suitor'; i: number } | { kind: 'own'; look: Look };
export interface Wedding {
  tone: ToneId;
  partner: Partner | null;
  venue: VenueId;
  theme: ThemeId | null;
  plot: PlotId;
  props: Prop[];
  guests: Look[];
}
/** A fresh wedding in a tone: the venue as you find it, nothing chosen. */
export function fresh(tone: ToneId = 'happy'): Wedding {
  return { tone, partner: null, venue: 'beach', theme: null, plot: SUGGEST[tone].plots[0], props: arrival(tone), guests: [] };
}
/** The theme chosen: its layout for the venue, its guests in its outfits. */
export function dressFor(w: Wedding, theme: ThemeId): Wedding {
  return { ...w, theme, props: layout(w.venue, theme), guests: themeOf(theme)!.guests.map((g) => ({ ...g })) };
}
/** The venue changed: a layout still as the theme laid it out goes with it (one you've tuned stays as
    you tuned it). */
export function moveTo(w: Wedding, venue: VenueId): Wedding {
  if (w.theme && same(w.props, layout(w.venue, w.theme))) return { ...w, venue, props: layout(venue, w.theme) };
  return { ...w, venue };
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const LOOK_KEY = /^[a-zA-Z0-9]{1,12}$/, LOOK_VAL = /^[a-z0-9 '-]{1,20}$/i;
/** A look from anywhere (storage, a link) cut down to plain values: the den's cleanLook does the rest. */
export function plainLook(o: unknown): Look {
  const out: Look = {};
  if (!o || typeof o !== 'object') return out;
  for (const [k, v] of Object.entries(o as Record<string, unknown>).slice(0, 40)) {
    if (!LOOK_KEY.test(k)) continue;
    if (typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v) && Math.abs(v) < 100) || (typeof v === 'string' && LOOK_VAL.test(v))) out[k] = v;
  }
  return out;
}
/** A prop made safe: a real kind, in AREA on quarter metres, a whole turn, a dye. */
export function cleanProp(o: unknown): Prop | null {
  if (!o || typeof o !== 'object') return null;
  const p = o as Record<string, unknown>;
  if (!PROPS.some(([k]) => k === p.k)) return null;
  const x = Number(p.x), z = Number(p.z), r = Number(p.r);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  const out: Prop = { k: p.k as PropKind, x: snap(x, -AREA.x, AREA.x), z: snap(z, AREA.z0, AREA.z1), r: Number.isFinite(r) ? ((Math.round(r) % 8) + 8) % 8 : 0, c: isDye(p.c) ? p.c : 'white' };
  if (p.w === true) out.w = true;
  return out;
}
/** A set-up from anywhere (storage, a link, a crewmate) made safe: anything that isn't one of the
    choices is the default, and there are always GUESTS guests once a theme's chosen. */
export function clean(o: unknown): Wedding {
  const w = (o && typeof o === 'object' ? o : {}) as Record<string, unknown>;
  const tone: ToneId = w.tone === 'dark' ? 'dark' : 'happy';
  const venue = (VENUES.find((v) => v.id === w.venue)?.id ?? 'beach') as VenueId;
  const theme = (themeOf(w.theme as string)?.id ?? null) as ThemeId | null;
  const plot = (PLOTS.find((p) => p.id === w.plot)?.id ?? SUGGEST[tone].plots[0]) as PlotId;
  let partner: Partner | null = null;
  const pa = w.partner as Record<string, unknown> | null;
  if (pa && typeof pa === 'object') {
    const n = Number(pa.kind === 'her' ? pa.ver : pa.i);
    if (pa.kind === 'her') partner = { kind: 'her', ver: Number.isInteger(n) && n >= 0 && n < 16 ? n : 0 };
    else if (pa.kind === 'suitor' && Number.isInteger(n) && n >= 0 && n < suitors(tone).length) partner = { kind: 'suitor', i: n };
    else if (pa.kind === 'own') partner = { kind: 'own', look: plainLook(pa.look) };
  }
  const props = Array.isArray(w.props) ? w.props.slice(0, MAX_PROPS).map(cleanProp).filter((p): p is Prop => !!p) : theme ? layout(venue, theme) : arrival(tone);
  const given = Array.isArray(w.guests) ? w.guests.slice(0, GUESTS).map(plainLook) : [];
  const T = themeOf(theme);
  const guests = T ? Array.from({ length: GUESTS }, (_, i) => (given[i] && Object.keys(given[i]).length ? given[i] : { ...T.guests[i] })) : [];
  return { tone, partner, venue, theme, plot, props, guests };
}

// ---------- the share link ----------
/* Short: the choices as indices, the props as seven characters each (or nothing, if they're still the
   theme's layout), the guests as only what's been changed from the theme's outfits. Then JSON in
   base64url, for den.html?at=wedding&w=... */
const b36 = (n: number, len: number) => n.toString(36).padStart(len, '0');
const VERSION = 1;
function packProp(p: Prop): string {
  return b36(PROPS.findIndex(([k]) => k === p.k), 1) + b36(Math.round(p.x * 4) + 24, 2) + b36(Math.round(p.z * 4) + 24, 2) + b36(p.r + (p.w ? 8 : 0), 1) + b36(Math.max(0, DYE_NAMES.indexOf(p.c as typeof DYE_NAMES[number])), 1);
}
function unpackProp(s: string): Prop | null {
  const n = (a: number, b: number) => parseInt(s.slice(a, b), 36);
  const k = PROPS[n(0, 1)]?.[0], rw = n(5, 6);
  if (!k || Number.isNaN(rw)) return null;
  return cleanProp({ k, x: (n(1, 3) - 24) / 4, z: (n(3, 5) - 24) / 4, r: rw % 8, w: rw >= 8, c: DYE_NAMES[n(6, 7)] });
}
function diff(a: Look, base: Look): Look | 0 {
  const out: Look = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(base)])) if (a[k] !== base[k] && a[k] !== undefined) out[k] = a[k];
  return Object.keys(out).length ? out : 0;
}
const toB64 = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = (s: string) => atob(s.replace(/-/g, '+').replace(/_/g, '/'));
export function encode(w0: Wedding): string {
  const w = clean(w0), T = themeOf(w.theme);
  const tone = TONES.findIndex((t) => t.id === w.tone), venue = VENUES.findIndex((v) => v.id === w.venue);
  const theme = T ? THEMES.indexOf(T as typeof THEMES[number]) : -1, plot = PLOTS.findIndex((p) => p.id === w.plot);
  const pa = !w.partner ? 0 : w.partner.kind === 'her' ? ['h', w.partner.ver] : w.partner.kind === 'suitor' ? ['s', w.partner.i] : ['o', w.partner.look];
  const base = T ? layout(w.venue, w.theme!) : arrival(w.tone);
  const props = same(w.props, base) ? 0 : w.props.map(packProp).join('');
  const guests = T ? w.guests.map((g, i) => diff(g, T.guests[i])) : 0;
  const gs = guests && guests.some((g) => g) ? guests : 0;
  // (JSON's own characters: a look's names are plain ASCII after clean())
  return toB64(JSON.stringify([VERSION, tone, venue, theme, plot, pa, props, gs]));
}
/** A link's set-up, or null if it isn't one. */
export function decode(code: string): Wedding | null {
  let a: unknown;
  try { a = JSON.parse(fromB64(String(code))); } catch { return null; }
  if (!Array.isArray(a) || a[0] !== VERSION) return null;
  const [, tone, venue, theme, plot, pa, props, gs] = a as [number, number, number, number, number, unknown, unknown, unknown];
  const T = THEMES[theme] ?? null, tn = TONES[tone]?.id ?? 'happy', vn = VENUES[venue]?.id ?? 'beach';
  let partner: unknown = null;
  if (Array.isArray(pa)) partner = pa[0] === 'h' ? { kind: 'her', ver: pa[1] } : pa[0] === 's' ? { kind: 'suitor', i: pa[1] } : pa[0] === 'o' ? { kind: 'own', look: pa[1] } : null;
  let ps: unknown;
  if (typeof props === 'string') { const out: Prop[] = []; for (let i = 0; i + 7 <= props.length && out.length < MAX_PROPS; i += 7) { const p = unpackProp(props.slice(i, i + 7)); if (p) out.push(p); } ps = out; }
  const guests = T ? T.guests.map((g, i) => ({ ...g, ...(Array.isArray(gs) && gs[i] && typeof gs[i] === 'object' ? plainLook(gs[i]) : {}) })) : [];
  return clean({ tone: tn, venue: vn, theme: T?.id ?? null, plot: PLOTS[plot]?.id, partner, props: ps, guests });
}

/** The portrait's caption: "You & Barnaby, wed on the beach, bloody and gory". */
export function caption(w: Wedding, you: string, partner: string): string {
  const V = VENUES.find((v) => v.id === w.venue)!, T = themeOf(w.theme);
  return `${you} & ${partner}, wed ${V.where}${T ? `, ${T.name.toLowerCase()}` : ''}`;
}
