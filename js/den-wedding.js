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
   cleanLook fills in the rest, after wearable() has swapped anything the wardrobe hasn't got yet.

   What everyone says is in src/lines/ (the user, 11 Nov: "a record of them in case any get lost that I
   really love"): hers in mischievious.ts, the suitors' in suitors.ts, your sweetheart's in spouse.ts,
   yours in you.ts, the guests' in wedding-guests.ts, the keepsake's captions in keepsake.ts. Hers are re-exported here under their own names. */
import { ARRIVE, WELCOME, RETURN, GUSH, ASK_HER, PLANNER, CEREMONY as MIS } from './lines/mischievious.js';
import { SUITORS } from './lines/suitors.js';
import { VOWS } from './lines/spouse.js';
import { AT_YOUR_WEDDING as YOURS } from './lines/you.js';
import { GUESTS_SAY as GUEST, DRUNK_SAYS, RAIDER_SAYS, GUARD_SAYS } from './lines/wedding-guests.js';
import { CAPTIONS, SIGNED } from './lines/keepsake.js';
import { choices, restyle } from './showcase.js';
export { ARRIVE, WELCOME, RETURN, GUSH, ASK_HER, PLANNER, SIGNED };
/** The Puzzle Pirates dyes, by name, as the wardrobe's DYES has them (a test checks each is there).
    Their order is the share link's: new ones go on the end. */
export const DYE_NAMES = [
    'aqua', 'black', 'blue', 'brown', 'gold', 'green', 'grey', 'lavender', 'light blue', 'light green', 'lime', 'lemon',
    'magenta', 'maroon', 'mint', 'navy', 'orange', 'peach', 'persimmon', 'pink', 'purple', 'red', 'rose', 'tan', 'violet',
    'white', 'yellow', 'shadow', 'atlantean', 'plum', 'crimson',
];
const isDye = (c) => typeof c === 'string' && DYE_NAMES.includes(c);
// ---------- the tone ----------
export const TONES = [
    { id: 'happy', name: 'Happy and cheesy', blurb: 'Hearts, flowers and giggles. Nothing goes wrong. Probably.' },
    { id: 'dark', name: 'Dark humour', blurb: 'The last wedding went a bit bloody. She\'s not bothered.' },
];
// ---------- the venues, all on her island ----------
/** Every venue has the same floor plan: the altar at the far end (-z), the aisle down the middle to
    its foot (+z), and room either side for benches; props go anywhere in AREA (metres, from its
    middle). */
export const VENUES = [
    { id: 'beach', name: 'The beach', where: 'on the beach', blurb: 'An arch on the sand, the sea behind you.' },
    { id: 'chapel', name: 'The clifftop chapel', where: 'in the clifftop chapel', blurb: 'An old ruin up on the cliff. Very romantic. Very windy.' },
    { id: 'deck', name: 'The ship\'s deck', where: 'on a ship\'s deck', blurb: 'Out along the jetty, on the deck of a big old ship.' },
];
export const AREA = { x: 6, z0: -6, z1: 7 };
export const ALTAR = { x: 0, z: -4.6 };
export const AISLE_FOOT = { x: 0, z: 6.4 };
/** Where the couple stand at the altar: you on the left as the guests look, your partner on the right. */
export const COUPLE = { you: { x: -0.65, z: -3.7 }, partner: { x: 0.65, z: -3.7 } };
/** The two security guards, either side at the front. */
export const GUARDS = [{ x: -5.2, z: -3.6 }, { x: 5.2, z: -3.6 }];
/** Where she, you and your partner stand as you plan: at the front, before the arch. */
export const STAND = { mis: { x: -1.8, z: -2.9 }, you: { x: -0.55, z: -3.1 }, partner: { x: 0.75, z: -3.1 } };
/** The front, kept clear of guests (the user, 11 Nov: "front benches right up on them, so you can barely
    even see [Mischievious] because of all the guests are all kind of crowding her out"): her, the couple
    and the arch always plainly seen. And the aisle, for your partner to walk up. */
export const FRONT = { x: 2.9, z: -0.8 };
const AISLE_X = 0.7;
/** How much room a pirate takes, standing (metres, from their middle). */
export const BODY_R = 0.28;
// ---------- props ----------
/** Everything there is to lay out. Their order is the share link's: new ones go on the end (and no
    more than 36, one letter each). The user, 11 Nov: "people are really going to be like wanting more
    control and variety ... on the furniture ... some feel for getting lost in the furniture placement",
    so the furnisher's whole shop: seats, a feast and its grog, lights, flowers, finery, music, and the
    piratey bits. */
export const PROPS = [
    ['bench', 'Bench'], ['arch', 'Arch'], ['flowers', 'Flowers'], ['banner', 'Banner'], ['barrel', 'Barrel'],
    ['table', 'Table'], ['lantern', 'Lantern'], ['candles', 'Candles'], ['cake', 'Cake'], ['splat', 'Splatter'],
    ['chair', 'Chair'], ['throne', 'Throne'], ['feast', 'Feast table'], ['punch', 'Punch bowl'], ['fountain', 'Rum fountain'],
    ['candelabra', 'Candelabra'], ['torch', 'Torch'], ['chandelier', 'Chandelier'], ['palm', 'Potted palm'], ['garland', 'Garland'],
    ['petals', 'Petals'], ['rug', 'Rug'], ['flag', 'Flag pole'], ['statue', 'Statue'], ['heart', 'Big heart'],
    ['chest', 'Treasure chest'], ['gifts', 'Presents'], ['piano', 'Piano'], ['band', 'Band stand'], ['cannon', 'Cannon'],
    ['anchor', 'Anchor'], ['skulls', 'Skulls'],
];
/** The palette, by kind (each prop in one group). */
export const PROP_GROUPS = [
    { id: 'seats', name: 'Seats', kinds: ['bench', 'chair', 'throne'] },
    { id: 'food', name: 'Food and grog', kinds: ['table', 'feast', 'cake', 'punch', 'fountain', 'barrel'] },
    { id: 'lights', name: 'Lights', kinds: ['lantern', 'candles', 'candelabra', 'torch', 'chandelier'] },
    { id: 'flowers', name: 'Flowers', kinds: ['flowers', 'palm', 'garland', 'petals', 'arch'] },
    { id: 'finery', name: 'Finery', kinds: ['rug', 'banner', 'flag', 'statue', 'heart', 'chest', 'gifts'] },
    { id: 'music', name: 'Music', kinds: ['piano', 'band'] },
    { id: 'piratey', name: 'Piratey', kinds: ['cannon', 'anchor', 'skulls', 'splat'] },
];
export const MAX_PROPS = 96;
/** How much room each needs (its radius, metres): for picking it and keeping it in AREA. */
export const PROP_R = {
    bench: 1.2, arch: 1.3, flowers: 0.35, banner: 0.8, barrel: 0.4, table: 0.6, lantern: 0.25, candles: 0.3, cake: 0.45, splat: 0.6,
    chair: 0.4, throne: 0.55, feast: 1.2, punch: 0.35, fountain: 0.7, candelabra: 0.3, torch: 0.25, chandelier: 0.9, palm: 0.45, garland: 1.1,
    petals: 0.7, rug: 1.3, flag: 0.3, statue: 0.45, heart: 0.6, chest: 0.5, gifts: 0.45, piano: 0.85, band: 0.85, cannon: 0.7, anchor: 0.5, skulls: 0.4,
};
/** Flat on the ground (a splatter, a rug, petals): anyone stands on them, and anything goes on them. */
export const FLAT = ['splat', 'rug', 'petals'];
/** What goes on a table (a cake, a punch bowl, candles, presents), and the tables. */
export const TOPPERS = ['cake', 'punch', 'candles', 'gifts'];
const TABLES = ['table', 'feast'];
/** The colour a prop's made in when it's added, if it's not the theme's: blood's red, a barrel's
    brown, a statue's marble... */
export const MADE_IN = { splat: 'red', barrel: 'brown', statue: 'white', anchor: 'black', cannon: 'black', skulls: 'white', piano: 'black', chest: 'gold', fountain: 'gold' };
const snap = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v * 4) / 4));
// (on quarter metres, as anything you move is)
const P = (k, x0, z0, c, r0 = 0, w = false) => {
    const x = snap(x0, -AREA.x, AREA.x), z = snap(z0, AREA.z0, AREA.z1), r = ((Math.round(r0) % 8) + 8) % 8;
    return w ? { k, x, z, r, c, w } : { k, x, z, r, c };
};
const ROSY = {
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
const GORY = {
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
const DRUNK = {
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
export const THEMES = [ROSY, GORY, DRUNK];
export const themeOf = (id) => THEMES.find((t) => t.id === id) ?? null;
/** The guests each theme dresses itself (and a small wedding's size). */
export const GUESTS = 8;
// ---------- how many come ----------
/** The user, 11 Nov: "how many guests you want. Do you want big, small, cozy, large? Do you want the
    grand wedding where half the ocean turns up?" Their order is the share link's. */
export const SIZES = [
    { id: 'cosy', name: 'Cosy', n: 6, blurb: 'A handful of your nearest and dearest.' },
    { id: 'small', name: 'Small', n: GUESTS, blurb: 'Just the crew. Everyone gets a good view.' },
    { id: 'big', name: 'Big', n: 20, blurb: 'The whole flag, best hats on.' },
    { id: 'large', name: 'Large', n: 48, blurb: 'Everyone you\'ve ever pillaged with.' },
    { id: 'grand', name: 'Grand', n: 140, blurb: 'Half the Ocean turns up. Standing room only.' },
];
export const MAX_GUESTS = 140;
export const sizeN = (id) => SIZES.find((s) => s.id === id)?.n ?? GUESTS;
/** How many different crowds there are (a crowd's seed is one of them). */
export const SEEDS = 36 ** 3;
/** A little generator of numbers in [0, 1), the same ones each time from the same seed. */
export function seeded(seed) {
    let a = seed | 0;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
/** The i-th guest as they come, before you've touched them: the theme's own eight, then the crowd,
    each dressed within the theme from the wedding's seed (so a crowd of a hundred and forty needs no
    more than its seed to share). */
export function baseGuest(theme, seed, i) {
    const T = themeOf(theme);
    if (i < T.guests.length)
        return { ...T.guests[i] };
    const r = seeded(seed * 4099 + i * 7919 + 17);
    return themeLook(theme, r() < 0.5 ? 'm' : 'f', r);
}
/** Whether two looks are the same in every slot. */
export const sameLook = (a, b) => {
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => a[k] === b[k]);
};
/** The benches, four rows a side, facing the altar, well back from it (the front's kept clear: FRONT);
    everyone's layout starts from them. */
const ROWS = [0.2, 1.7, 3.2, 4.7];
function benches(c) { return ROWS.flatMap((z) => [P('bench', -2.1, z, c), P('bench', 2.1, z, c)]); }
/** The layout a theme starts from at a venue: the benches and the arch, the theme's own dressing,
    and a little something each venue adds (lanterns at the beach's aisle, candles in the chapel,
    barrels on the deck). */
export function layout(venue, theme) {
    const T = themeOf(theme), [a, b, c, d] = T.dyes;
    const out = [P('arch', ALTAR.x, -5.3, a), ...benches(b)];
    if (theme === 'rosy') {
        ROWS.forEach((z, i) => out.push(P('flowers', -0.62, z - 0.5, i % 2 ? a : d), P('flowers', 0.62, z - 0.5, i % 2 ? a : d)));
        out.push(P('candles', -1.7, -4.9, c), P('candles', 1.7, -4.9, c), P('banner', -3.8, -5.4, a, 0), P('banner', 3.8, -5.4, a, 0), P('table', 4.6, 5.0, c), P('cake', 4.6, 5.0, a));
        // (a runner up the aisle, and palms either side of the front)
        out.push(P('rug', 0, 2.4, a, 2), P('palm', -4.4, -1.6, d), P('palm', 4.4, -1.6, d));
    }
    else if (theme === 'gory') {
        for (const [x, z] of [[-0.6, 3.6], [0.7, 1.2], [-3.4, -3.6], [4.1, 0.2], [-4.4, 3.2], [0.2, -2.0]])
            out.push(P('splat', x, z, 'red', (x * 3 + z * 5 + 16) % 8 | 0));
        out.push(P('banner', -3.8, -5.4, c, 0), P('banner', 3.8, -5.4, c, 0), P('flowers', -1.0, -4.6, a), P('flowers', 1.0, -4.6, a), P('lantern', -4.4, -1.6, c), P('lantern', 4.4, -1.6, c), P('candles', -1.8, -5.0, b), P('candles', 1.8, -5.0, b), P('barrel', -4.8, 5.2, b), P('table', 4.6, 5.0, b), P('cake', 4.6, 5.0, c));
        // (torches by the front, and a pile of skulls or two)
        out.push(P('torch', -3.4, -1.2, c), P('torch', 3.4, -1.2, c), P('skulls', 5.4, 3.6, 'white', 1), P('skulls', -5.4, 1.4, 'white', 6));
    }
    else {
        for (const [x, z] of [[-4.6, -1.6], [4.6, -1.6], [-4.8, 1.5], [4.8, 1.5], [-4.6, 5.4], [-3.8, 6.2]])
            out.push(P('barrel', x, z, c));
        out.push(P('banner', -3.8, -5.4, d, 0), P('banner', 3.8, -5.4, d, 0), P('lantern', -1.2, 5.8, b), P('lantern', 1.2, 5.8, b), P('table', 4.6, 5.0, a), P('table', 2.6, 6.2, a, 2), P('cake', 4.6, 5.0, b), P('flowers', -1.0, -4.6, e(T)), P('flowers', 1.0, -4.6, e(T)));
        // (the rum fountain, and the shanty-singer's piano)
        out.push(P('fountain', -4.7, 3.4, 'gold'), P('piano', 4.6, 3.4, 'brown', 2));
    }
    if (venue === 'beach')
        out.push(P('lantern', -1.2, 6.8, b), P('lantern', 1.2, 6.8, b));
    else if (venue === 'chapel')
        out.push(P('candles', -3.4, -4.6, c), P('candles', 3.4, -4.6, c));
    else
        out.push(P('barrel', -5.4, -5.2, 'brown'), P('barrel', 5.4, -5.2, 'brown'));
    return out;
}
const e = (T) => T.dyes[4];
/** The venue as you find it in Dark humour: the last wedding's wreck. Benches overturned, the arch
    snapped, a banner torn, red splatters everywhere and the cake on the floor. (It was a rosy one.) */
export const WRECK = [
    P('arch', 0.3, -5.3, 'rose', 1, true),
    P('bench', -2.3, -2.2, 'pink', 1, true), P('bench', 2.0, -0.6, 'pink', 7, true), P('bench', -1.8, 1.1, 'pink', 6), P('bench', 2.6, 2.4, 'pink', 2, true), P('bench', -3.4, 3.8, 'pink', 3, true),
    P('banner', -3.8, -5.4, 'rose', 0, true), P('banner', 3.8, -5.4, 'rose', 0),
    P('table', 4.3, 4.6, 'white', 1, true), P('cake', 3.6, 5.3, 'rose', 0, true), P('barrel', -4.8, 5.0, 'brown', 2, true),
    P('splat', -0.4, -3.2, 'red', 1), P('splat', 0.6, 0.3, 'red', 4), P('splat', -2.8, 2.6, 'red', 6), P('splat', 3.6, -2.6, 'red', 3), P('splat', 1.2, 4.1, 'red', 5), P('splat', -4.2, -0.8, 'red', 2), P('splat', 0.1, -4.6, 'red', 7),
    P('flowers', -0.9, -0.9, 'rose', 0, true), P('flowers', 1.1, 2.1, 'pink', 0, true),
];
/** The venue as you find it in Happy and cheesy: all clean and pretty, ready for you. */
export const arrival = (tone) => (tone === 'dark' ? WRECK.map((p) => ({ ...p })) : layout('beach', 'rosy'));
export function footprint(p) {
    const r = (x, z, hx, hz = hx) => ({ x, z, hx, hz });
    switch (p.k) {
        case 'bench': return [p.w ? r(0, -0.4, 1.15, 0.45) : r(0, 0.01, 1.15, 0.25)];
        case 'arch': return p.w ? [r(0.2, 0.5, 1.7, 0.9)] : [r(-1.1, 0, 0.13), r(1.1, 0, 0.13)];
        case 'banner': return [r(0, 0, 0.8, 0.1)];
        case 'flowers': return [r(0, 0, 0.26)];
        case 'barrel': return [p.w ? r(0.37, 0, 0.4, 0.36) : r(0, 0, 0.35)];
        case 'table': return [r(0, 0, 0.58)];
        case 'lantern': return [r(0, 0, 0.1)];
        case 'candles': return [r(0, 0, 0.25)];
        case 'cake': return [r(0, 0, 0.42)];
        case 'chair': return [r(0, 0, 0.24)];
        case 'throne': return [r(0, 0.05, 0.42, 0.36)];
        case 'feast': return [r(0, 0, 1.15, 0.45)];
        case 'punch': return [r(0, 0, 0.28)];
        case 'fountain': return [r(0, 0, 0.62)];
        case 'candelabra': return [r(0, 0, 0.16)];
        case 'torch': return [r(0, 0, 0.08)];
        case 'chandelier': return [r(-1.0, 0, 0.12)]; // (its post: it hangs from an arm, over whoever's under it)
        case 'palm': return [r(0, 0, 0.3)];
        case 'garland': return [r(-1.0, 0, 0.08), r(1.0, 0, 0.08)];
        case 'flag': return [r(0, 0, 0.1)];
        case 'statue': return [r(0, 0, 0.36)];
        case 'heart': return [r(0, 0, 0.55, 0.15)];
        case 'chest': return [r(0, 0, 0.42, 0.28)];
        case 'gifts': return [r(0, 0, 0.42)];
        case 'piano': return [r(0, 0, 0.78, 0.32)];
        case 'band': return [r(0, 0, 0.8)];
        case 'cannon': return [r(0, 0.1, 0.36, 0.72)];
        case 'anchor': return [r(0, 0, 0.45, 0.16)];
        case 'skulls': return [r(0, 0, 0.36)];
        default: return []; // (flat: a splatter, a rug, petals)
    }
}
/** Whether a circle (a pirate standing at x, z) would stand in something. */
export function inProp(p, x, z, rad = BODY_R) {
    const a = p.r * Math.PI / 4, dx = x - p.x, dz = z - p.z;
    const lx = dx * Math.cos(a) - dz * Math.sin(a), lz = dx * Math.sin(a) + dz * Math.cos(a);
    return footprint(p).some((f) => Math.hypot(Math.max(0, Math.abs(lx - f.x) - f.hx), Math.max(0, Math.abs(lz - f.z) - f.hz)) < rad);
}
/** Whether two props stand in each other (sampling the first's footprint against the second's). */
export function propsOverlap(p, q) {
    const a = p.r * Math.PI / 4;
    return footprint(p).some((f) => {
        for (let i = -2; i <= 2; i++)
            for (let j = -2; j <= 2; j++) {
                const lx = f.x + f.hx * i / 2, lz = f.z + f.hz * j / 2;
                if (inProp(q, p.x + lx * Math.cos(a) + lz * Math.sin(a), p.z - lx * Math.sin(a) + lz * Math.cos(a), 0.05))
                    return true;
            }
        return false;
    });
}
/** Where nobody else may stand: her, the couple, the officiant at the altar, the guards. */
const PEOPLE = [STAND.mis, STAND.you, STAND.partner, COUPLE.you, COUPLE.partner, ALTAR, ...GUARDS];
/** Whether a prop would stand on her, the couple or the guards (moved or added there, it's not). */
export const onSomeone = (p) => PEOPLE.some((s) => inProp(p, s.x, s.z));
/** The table a cake (or a punch bowl, candles, presents) is standing on, if it's on one. */
export function restsOn(p, props) {
    if (!TOPPERS.includes(p.k) || p.w)
        return null;
    return props.find((q) => TABLES.includes(q.k) && !q.w && inProp(q, p.x, p.z, 0.01)) ?? null;
}
const stacks = (a, b) => (TOPPERS.includes(a.k) && TABLES.includes(b.k)) || (TOPPERS.includes(b.k) && TABLES.includes(a.k));
/** Whether a prop would stand in another (props[self] is itself, left out): never mind anything flat,
    and a cake's meant to be on its table. (The user, 11 Nov, wanting more to place: they stay out of
    each other where it matters.) */
export function clashes(p, props, self = -1) {
    if (FLAT.includes(p.k))
        return false;
    return props.some((q, j) => j !== self && q !== p && !FLAT.includes(q.k) && !stacks(p, q) && (propsOverlap(p, q) || propsOverlap(q, p)));
}
/** Where guests can stand at all: the venue, a little either side and behind it (the ship's deck
    narrows at her stern). */
export const GROUNDS = { x: 6.3, z0: AREA.z0, z1: AREA.z1 + 0.5 };
const onGrounds = (x, z) => Math.abs(x) <= GROUNDS.x && z >= GROUNDS.z0 && z <= GROUNDS.z1 && !(z > 6.9 && Math.abs(x) > 5.7);
const SPACE = BODY_R * 2.1;
/** Whether a guest could stand at x, z: on the grounds, never in a prop, in someone (`others`, or her,
    the couple and the guards), in the aisle, or in the front kept clear for her and the couple. */
export function standFree(props, others, x, z) {
    return onGrounds(x, z) && !(Math.abs(x) < FRONT.x && z < FRONT.z) && !(Math.abs(x) < AISLE_X && z >= FRONT.z)
        && !props.some((p) => inProp(p, x, z)) && !others.some((o) => Math.hypot(o.x - x, o.z - z) < SPACE)
        && !PEOPLE.some((s) => Math.hypot(s.x - x, s.z - z) < SPACE);
}
/** Which way someone at x, z faces to look at the altar (a turn, in eighths). */
export const facingAltar = (x, z) => ((Math.round(Math.atan2(ALTAR.x - x, ALTAR.z - z) / (Math.PI / 4)) % 8) + 8) % 8;
/* Everywhere a guest might stand, in the order they fill up: each a few spots to try, the first free
   one taken. Two at each bench; the back, from the aisle outwards; down the sides; then, for a crowd,
   a second rank behind each bench and one at each end, then shoulder to shoulder, from the back rows
   forward, everyone turned to the altar. */
function places(props) {
    const out = [], S = (x, z, yaw) => ({ x, z, yaw, sit: false });
    const benches = props.filter((b) => b.k === 'bench' && !b.w).map((b) => {
        const a = b.r * Math.PI / 4;
        // (a bench's length along its own x; it faces its own -z, so they look its way)
        return { yaw: a + Math.PI, at: (lx, lz) => ({ x: b.x + lx * Math.cos(a) + lz * Math.sin(a), z: b.z - lx * Math.sin(a) + lz * Math.cos(a) }) };
    });
    for (const b of benches)
        for (const lx of [-0.55, 0.55])
            out.push([b.at(lx, -0.58), b.at(lx, 0.6), b.at(lx * 2.75, 0)].map((s) => S(s.x, s.z, b.yaw)));
    for (let z = 5.0; z <= AREA.z1 + 0.01; z += 0.8)
        for (let i = 0; i < 6; i++)
            for (const sd of [-1, 1])
                out.push([S(sd * (1.4 + i * 0.85), z, Math.PI)]);
    for (let z = FRONT.z; z < 5; z += 0.8)
        for (const x of [5.4, 4.6])
            for (const sd of [-1, 1])
                out.push([S(sd * x, z, Math.PI)]);
    for (const b of benches)
        for (const [lx, lz] of [[-0.55, 0.62], [0.55, 0.62], [-1.5, 0], [1.5, 0], [-1.5, 0.62], [1.5, 0.62]]) {
            const s = b.at(lx, lz);
            out.push([S(s.x, s.z, b.yaw)]);
        }
    const D = 0.62, DZ = D * Math.sqrt(3) / 2;
    for (let row = 0, z = GROUNDS.z1; z >= GROUNDS.z0; row++, z -= DZ) {
        const xs = [];
        for (let x = AISLE_X + BODY_R + (row % 2 ? D / 2 : 0); x <= GROUNDS.x; x += D)
            xs.push(x);
        for (const x of xs)
            for (const sd of [-1, 1])
                out.push([S(sd * x, z, facingAltar(sd * x, z) * Math.PI / 4)]);
    }
    return out;
}
/** Where the guests stand: `n` of them, `spots` the ones you've moved (each where you put them, if it's
    still free: a prop moved onto them, they go back among the others). The rest stand where they would
    if nobody had moved, so moving one guest leaves the others be; only one you've put someone on
    finds somewhere else. */
export function seatsFor(props, n = GUESTS, spots = []) {
    const P = places(props);
    const fill = (taken, want) => {
        const got = [];
        for (const c of P) {
            if (got.length >= want)
                break;
            const s = c.find((s) => standFree(props, taken, s.x, s.z));
            if (s) {
                got.push(s);
                taken.push(s);
            }
        }
        return got;
    };
    // (as they'd stand with nobody moved)
    const base = fill([], n);
    const out = Array.from({ length: n }, () => null), fixed = [];
    for (const sp of spots) {
        if (!(sp.i >= 0 && sp.i < n) || out[sp.i] || !standFree(props, fixed, sp.x, sp.z))
            continue;
        fixed.push(out[sp.i] = { x: sp.x, z: sp.z, yaw: sp.r * Math.PI / 4, sit: false });
    }
    const taken = [...fixed];
    for (let i = 0; i < n; i++) {
        const b = base[i];
        if (!out[i] && b && !fixed.some((f) => Math.hypot(f.x - b.x, f.z - b.z) < SPACE))
            taken.push(out[i] = b);
    }
    // (anyone left: the next free place; and if there's nowhere at all, somewhere at the very back)
    const left = out.filter((s) => !s).length, more = left ? fill(taken, left) : [];
    let k = 0;
    return out.map((s) => s ?? more.shift() ?? { x: (k % 2 ? 1 : -1) * (1.2 + Math.floor(k++ / 2) * 0.7), z: GROUNDS.z1 + 0.6, yaw: Math.PI, sit: false });
}
/** The hired security, in black and grey, cutlasses at their sides; and the raiders who crash it. */
export const SECURITY = [
    { body: 'm', skin: 4, hair: 'bald', hairCol: 'black', beard: 'full', patch: false, smile: false, hat: 'bandana', hatCol: 'black', top: 'vest', topCol: 'black', topCol2: 'grey', waist: 'buckle', waistCol: 'black', legs: 'pants', legsCol: 'black', feet: 'boots', feetCol: 'black' },
    { body: 'f', skin: 1, hair: 'bun', hairCol: 'dark brown', patch: true, smile: false, hat: 'tricorne', hatCol: 'black', top: 'buccaneer', topCol: 'grey', topCol2: 'black', waist: 'belt', waistCol: 'black', legs: 'pants', legsCol: 'black', feet: 'boots', feetCol: 'black' },
];
export const RAIDERS = [
    { body: 'm', skin: 2, hair: 'long', hairCol: 'black', beard: 'bushy', patch: true, hat: 'bandana', hatCol: 'red', top: 'striped', topCol: 'red', topCol2: 'white', legs: 'patched', legsCol: 'navy', legsCol2: 'tan', feet: 'boots', feetCol: 'black' },
    { body: 'f', skin: 3, hair: 'braids', hairCol: 'ginger', patch: false, hat: 'bandana', hatCol: 'black', top: 'vest', topCol: 'maroon', topCol2: 'white', legs: 'pants', legsCol: 'brown', feet: 'boots', feetCol: 'brown' },
    { body: 'm', skin: 0, hair: 'short', hairCol: 'brown', beard: 'goatee', patch: true, hat: 'tricorne', hatCol: 'brown', top: 'striped', topCol: 'black', topCol2: 'yellow', legs: 'pants', legsCol: 'black', feet: 'boots', feetCol: 'black' },
];
/** A suitor: their name and line (src/lines/suitors.ts), and their look. */
const S = (id, look, hurt = false) => ({ id, name: SUITORS[id].name, line: SUITORS[id].line, look, ...(hurt ? { hurt } : {}) });
const JILTED = S('barnaby', { body: 'm', skin: 1, hair: 'short', hairCol: 'brown', beard: 'moustache', patch: false, smile: true, hat: 'none', top: 'captain', topCol: 'white', topCol2: 'gold', waist: 'sash', waistCol: 'rose', legs: 'pants', legsCol: 'white', feet: 'shoes', feetCol: 'black', hand: 'bouquet' }, true);
const SWEET = S('william', { body: 'm', skin: 2, hair: 'wavy', hairCol: 'blonde', beard: 'none', patch: false, smile: true, hat: 'feathered', hatCol: 'peach', hatCol2: 'white', top: 'vest', topCol: 'peach', topCol2: 'white', legs: 'pantaloons', legsCol: 'white', feet: 'shoes', feetCol: 'tan', hand: 'bouquet', handCol: 'white' });
const REST = [
    S('sal', { body: 'f', skin: 3, hair: 'braids', hairCol: 'black', patch: true, smile: true, hat: 'bandana', hatCol: 'aqua', top: 'vest', topCol: 'navy', topCol2: 'white', legs: 'patched', legsCol: 'navy', legsCol2: 'aqua', feet: 'boots', feetCol: 'black', hand: 'bouquet' }),
    S('jem', { body: 'm', skin: 4, hair: 'ponytail', hairCol: 'black', beard: 'goatee', patch: false, smile: true, hat: 'tricorne', hatCol: 'navy', top: 'swashbuckler', topCol: 'navy', topCol2: 'gold', legs: 'pants', legsCol: 'white', feet: 'fancy', feetCol: 'black', feetCol2: 'gold', hand: 'bouquet' }),
    S('rosalind', { body: 'f', skin: 0, hair: 'wavy', hairCol: 'auburn', patch: false, smile: true, hat: 'captain', hatCol: 'maroon', hatCol2: 'gold', top: 'captain', topCol: 'maroon', topCol2: 'gold', legs: 'long', legsCol: 'black', feet: 'fancy', feetCol: 'black', feetCol2: 'gold', hand: 'bouquet' }),
    S('pete', { body: 'm', skin: 1, hair: 'bald', hairCol: 'grey', beard: 'long', patch: true, smile: true, hat: 'fez', hatCol: 'purple', top: 'striped', topCol: 'purple', topCol2: 'white', legs: 'kilt', legsCol: 'green', legsCol2: 'black', feet: 'curled', feetCol: 'gold', hand: 'bouquet' }),
    S('marigold', { body: 'f', skin: 5, hair: 'bun', hairCol: 'black', patch: false, smile: true, hat: 'wide', hatCol: 'orange', hatCol2: 'lemon', top: 'corset', topCol: 'orange', topCol2: 'lemon', legs: 'gown', legsCol: 'lemon', feet: 'shoes', feetCol: 'orange', hand: 'bouquet', fam: 'parrot', famCol: 'green', famCol2: 'red' }),
];
/** The planner's three ways to choose who you marry, each with its blurb. Kind and funny about her (the
    user, 11 Nov: "marry [her], she's free, she's nearly always free. Like, that feels mean"). */
export const WHO = {
    her: { name: 'Marry Mischievious', blurb: "Five of her looks, and she'll model every one." },
    suitors: { name: 'Here are your bachelors!', blurb: 'A line of suitors, bouquets out, blind-date style.' },
    own: { name: 'Someone of your own', blurb: 'Anyone you like: a man, a woman, dressed however.' },
};
export const suitors = (tone) => [tone === 'dark' ? JILTED : SWEET, ...REST];
const NUMBERS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
/** "Bachelor number one", "Bachelorette number two"... */
export const suitorTitle = (s, i) => `${s.look.body === 'f' ? 'Bachelorette' : 'Bachelor'} number ${NUMBERS[i] ?? i + 1}`;
// ---------- the plots ----------
export const PLOTS = [
    { id: 'sweet', name: 'Sweet and blissful', blurb: 'Vows, tears, a kiss. Nothing goes wrong at all.' },
    { id: 'raiders', name: 'Raiders crash it', blurb: 'Halfway through, raiders storm in. Good thing there\'s security.' },
    { id: 'drunk', name: 'Somebody\'s drunk', blurb: 'One of the guests has had a few. Mind the cake.' },
    { id: 'brawl', name: 'A brawl breaks out', blurb: 'Words are had. Then fists. Then benches.' },
];
/** How long a line stays up: long enough to read. */
export const readSecs = (text) => Math.min(5, Math.max(1.6, text.length * 0.06));
const L = (who, at, text, cake) => (cake === undefined ? { who, at, text } : { who, at, text, cake });
/** Every wedding opens the same: everyone seated, your partner up the aisle, the vows begun. */
const OPEN = [
    { beat: 'seated', secs: 3.4, lines: [L('off', 0.4, MIS.places)] },
    { beat: 'procession', secs: 6, lines: [L('guest', 1.2, GUEST.lookAtThem), L('guest2', 3.6, GUEST.stunning)] },
    { beat: 'vows', secs: 4.6, lines: [L('off', 0.2, MIS.beloved)] },
];
/** The plot's twist, after the vows begin. */
const TWIST = {
    sweet: [
        { beat: 'sweet', secs: 9.2, lines: [L('partner', 0.3, VOWS.vow), L('you', 4.6, YOURS.vow), L('guest', 7.4, GUEST.sniff)] },
        { beat: 'calm', secs: 3, lines: [L('mis', 0.3, MIS.calm)] },
    ],
    raiders: [
        { beat: 'storm', secs: 3.6, lines: [L('raider', 0.6, RAIDER_SAYS)] },
        { beat: 'fight', secs: 6.2, lines: [L('mis', 0.2, MIS.security), L('guard', 2.6, GUARD_SAYS)] },
        { beat: 'cleared', secs: 3, lines: [L('off', 0.3, MIS.whereWereWe)] },
    ],
    drunk: [
        { beat: 'stagger', secs: 7.2, lines: [L('drunk', 0.3, DRUNK_SAYS), L('mis', 4.4, MIS.hadAFew)] },
        { beat: 'topple', secs: 3.6, lines: [L('mis', 1.5, MIS.cake, true), L('mis', 1.5, MIS.down, false)] },
    ],
    brawl: [
        { beat: 'argue', secs: 4.4, lines: [L('guest', 0.2, GUEST.grog), L('guest2', 2.2, GUEST.face)] },
        { beat: 'brawl', secs: 6.4, lines: [L('mis', 1.0, MIS.benches)] },
        { beat: 'sorry', secs: 2.6, lines: [L('guest', 0.3, GUEST.sorry)] },
    ],
};
/** And every one ends the same, cheesily: I do, the kiss, hearts and confetti, the portrait. */
const CLOSE = [
    { beat: 'ido', secs: 6.8, lines: [L('off', 0.1, MIS.doYou), L('you', 3.3, YOURS.ido), L('partner', 5.0, VOWS.ido)] },
    { beat: 'kiss', secs: 4.2, lines: [L('off', 0.2, MIS.kiss)] },
    { beat: 'cheer', secs: 4.2, lines: [L('guest', 0.3, GUEST.hooray), L('mis', 1.9, MIS.love)] },
    { beat: 'portrait', secs: 2.4, lines: [] },
];
/** The whole ceremony for a plot, its lines filtered by whether there's a cake to fall in. */
export function plotScript(plot, cake = true) {
    return [...OPEN, ...TWIST[plot], ...CLOSE].map((b) => ({ ...b, lines: b.lines.filter((l) => l.cake === undefined || l.cake === cake) }));
}
export const scriptSecs = (s) => s.reduce((a, b) => a + b.secs, 0);
/** Where a ceremony is `t` seconds in: the beat, how far through it (u), its own time, its index, the
    line being said (each up till the next comes, the beat ends or it's been read), and done once
    it's over. */
export function plotAt(s, t) {
    let t0 = 0;
    for (let i = 0; i < s.length; i++) {
        const b = s[i];
        if (t < t0 + b.secs) {
            const local = t - t0;
            let line = null;
            for (let j = 0; j < b.lines.length; j++) {
                const l = b.lines[j], next = b.lines[j + 1]?.at ?? b.secs;
                if (local >= l.at && local < Math.min(next, l.at + readSecs(l.text) + 0.6))
                    line = l;
            }
            return { beat: b.beat, i, u: local / b.secs, local, line, done: false };
        }
        t0 += b.secs;
    }
    const last = s[s.length - 1];
    return { beat: last?.beat ?? '', i: s.length - 1, u: 1, local: last?.secs ?? 0, line: null, done: true };
}
const MOMENT_OPEN = [{ id: 'aisle', beat: 'procession', at: 3.0 }, { id: 'vows', beat: 'vows', at: 3.2 }];
const MOMENT_TWIST = {
    sweet: [{ id: 'sweet', beat: 'sweet', at: 3.2 }], // (hand in hand, hearts floating up, the vow)
    raiders: [{ id: 'raiders', beat: 'fight', at: 3.6 }], // (one in the sea, another on his way)
    drunk: [{ id: 'drunk', beat: 'topple', at: 2.8 }], // (face first in the cake)
    brawl: [{ id: 'brawl', beat: 'brawl', at: 4.2 }], // (benches flying)
};
const MOMENT_CLOSE = [{ id: 'kiss', beat: 'kiss', at: 2.4 }, { id: 'cheer', beat: 'cheer', at: 2.8 }];
/** A plot's key moments, in the order they come. */
export const moments = (plot) => [...MOMENT_OPEN, ...MOMENT_TWIST[plot], ...MOMENT_CLOSE];
/** When a moment comes in a ceremony (seconds from its start), or -1 if its beat isn't in it. */
export function momentTime(s, m) {
    let t0 = 0;
    for (const b of s) {
        if (b.beat === m.beat)
            return t0 + m.at;
        t0 += b.secs;
    }
    return -1;
}
/** The moments that came between t0 and t1 (a frame's worth of the ceremony): each taken once. */
export const momentsDue = (s, plot, t0, t1) => moments(plot).filter((m) => { const t = momentTime(s, m); return t > t0 && t <= t1; });
/** A moment's caption in the tone (names not yet put in: fill()). */
export const momentCaption = (id, tone) => CAPTIONS[id][tone];
/** The keepsake laid out: its size, the hero (the portrait, 4:3), each snapshot (4:3) with its caption's
    box under it, and the title's box at the foot (the couple's names, and SIGNED). Upright (a phone held
    so), the hero on top and the snapshots in rows under it, three to a row; `wide`, the hero on the left
    and the snapshots in two columns down its right. With no snapshots (the ceremony skipped), just the
    portrait, as it always was. */
export function collage(n, wide) {
    const PAD = 46, GAP = 18, CAP = 46, TITLE = 82, shots = [], caps = [];
    const at = (x, y, w, h) => ({ x, y, w, h });
    if (n <= 0) {
        const hero = at(PAD, PAD, 1200, 900);
        return { w: 1200 + PAD * 2, h: PAD + 900 + GAP + TITLE + PAD + 12, hero, shots, caps, title: at(PAD, PAD + 900 + GAP, 1200, TITLE) };
    }
    if (!wide) {
        const W = 1200, cols = n === 4 ? 2 : 3, sw = (W - 2 * GAP) / 3, sh = sw * 3 / 4, rows = Math.ceil(n / cols);
        const hero = at(PAD, PAD, W, W * 3 / 4);
        let y = hero.y + hero.h + GAP;
        for (let r = 0; r < rows; r++) {
            const inRow = Math.min(cols, n - r * cols), x0 = PAD + (W - (inRow * sw + (inRow - 1) * GAP)) / 2;
            for (let c = 0; c < inRow; c++) {
                const x = x0 + c * (sw + GAP);
                shots.push(at(x, y, sw, sh));
                caps.push(at(x, y + sh, sw, CAP));
            }
            y += sh + CAP + GAP;
        }
        return { w: W + PAD * 2, h: y + TITLE + PAD + 12, hero, shots, caps, title: at(PAD, y, W, TITLE) };
    }
    const cols = n <= 3 ? 1 : 2, rows = Math.ceil(n / cols), sw = 330, sh = sw * 3 / 4;
    const side = rows * (sh + CAP) + (rows - 1) * GAP, hh = Math.max(side, 720), hero = at(PAD, PAD, hh * 4 / 3, hh);
    const x0 = hero.x + hero.w + GAP, y0 = PAD + (hh - side) / 2;
    for (let i = 0; i < n; i++) {
        const c = i % cols, r = Math.floor(i / cols), inRow = Math.min(cols, n - r * cols);
        const x = x0 + c * (sw + GAP) + (cols - inRow) * (sw + GAP) / 2, y = y0 + r * (sh + CAP + GAP);
        shots.push(at(x, y, sw, sh));
        caps.push(at(x, y + sh, sw, CAP));
    }
    const w = x0 + cols * sw + (cols - 1) * GAP + PAD, ty = PAD + hh + GAP;
    return { w, h: ty + TITLE + PAD + 12, hero, shots, caps, title: at(PAD, ty, w - PAD * 2, TITLE) };
}
/** A line with the names put in. */
export const fill = (text, names) => text.replace(/\{partner\}/g, names.partner).replace(/\{you\}/g, names.you);
// ---------- what Mischievious says ----------
/* Her greeting, her welcome and her welcome back (ARRIVE, WELCOME, RETURN): src/lines/mischievious.ts. */
/** The weddings she's been through today, for the fun of it (the user, 11 Nov: "showing that ... you
    can keep doing it for fun all the time ... I enjoy getting married, go through the ceremonies ...
    the first time I had this kind of wedding, second time it didn't quite go so well. The Raiders
    came and it was bloody gory ... tie it into the mechanics in a happy, fun way, not in a
    promiscuous ... way"). Each is the wedding's own options, so her stories (in GUSH, when you
    choose one, and asked about them) show you what there is to choose: between them, every venue,
    theme and plot. */
export const TODAY = [
    { venue: 'beach', theme: 'rosy', plot: 'sweet' },
    { venue: 'chapel', theme: 'gory', plot: 'raiders' },
    { venue: 'deck', theme: 'drunk', plot: 'drunk' },
    { venue: 'beach', theme: 'drunk', plot: 'brawl' },
    { venue: 'chapel', theme: 'rosy', plot: 'sweet' },
];
/** What she suggests first in each tone (every theme and plot is open in either). */
export const SUGGEST = {
    happy: { theme: 'rosy', plots: ['sweet'] },
    dark: { theme: 'gory', plots: ['raiders', 'brawl'] },
};
/* Her reactions as you plan (GUSH, a pool for each event, the same in both tones or one for each) and
   the things you can ask her (ASK_HER): src/lines/mischievious.ts. */
/** Her answer to the i-th question, in the tone. */
export const answer = (i, tone) => {
    const a = ASK_HER[i]?.a;
    return a === undefined ? '' : typeof a === 'string' ? a : a[tone];
};
/** Her chatter: a line for something that's happened, never the same line twice running. */
export class Gush {
    tone;
    rand;
    last = '';
    constructor(tone = 'happy', rand = Math.random) {
        this.tone = tone;
        this.rand = rand;
    }
    pool(ev) {
        const p = GUSH[ev];
        if (!p)
            return [];
        return Array.isArray(p) ? p : p[this.tone];
    }
    say(ev) {
        const all = this.pool(ev), fresh = all.length > 1 ? all.filter((l) => l !== this.last) : all;
        if (!fresh.length)
            return '';
        return (this.last = fresh[Math.min(fresh.length - 1, Math.floor(this.rand() * fresh.length))]);
    }
}
// ---------- looks the wardrobe hasn't got yet ----------
/** Stand-ins for wardrobe items still to come, tried in order: wearable() uses the first one the
    wardrobe has, so a guest is never left in the wrong thing (and once the item's there, it's worn). */
export const STAND_INS = {
    hat: { veil: ['none'], tiara: ['none'], butterfly: ['feathered', 'none'] },
    top: { dresstop: ['corset', 'belt', 'plain'], frilly: ['corset', 'belt', 'plain'] },
    legs: { gown: ['long', 'pants'] },
    hand: { bouquet: ['none'] },
    fam: { squirrel: ['none'] },
};
/** A look with whatever the wardrobe hasn't got (has(slot, body, id) says) swapped for a stand-in. */
export function wearable(look, has) {
    const out = { ...look }, body = look.body === 'f' ? 'f' : 'm';
    for (const [slot, subs] of Object.entries(STAND_INS)) {
        const id = out[slot];
        if (typeof id !== 'string' || has(slot, body, id))
            continue;
        const alt = (subs[id] ?? []).find((a) => has(slot, body, a));
        if (alt)
            out[slot] = alt;
        else
            delete out[slot];
    }
    return out;
}
/** A guest dressed afresh within a theme: its items for their body, its colours. */
export function themeLook(theme, body, rand = Math.random) {
    const T = themeOf(theme), pick = (xs) => xs[Math.floor(rand() * xs.length) % xs.length];
    const L = { body, skin: Math.floor(rand() * 6) % 6, smile: rand() < 0.75, patch: theme === 'gory' && rand() < 0.5 };
    for (const [slot, ids] of Object.entries(T.wear[body]))
        L[slot] = pick(ids);
    for (const k of ['hatCol', 'hatCol2', 'topCol', 'topCol2', 'legsCol', 'legsCol2', 'feetCol', 'feetCol2'])
        L[k] = pick(T.dyes);
    if (body === 'm')
        L.beard = pick(['full', 'goatee', 'moustache', 'none']);
    L.hair = pick(body === 'm' ? ['short', 'ponytail', 'long', 'wavy', 'bald'] : ['long', 'ponytail', 'bun', 'braids', 'wavy']);
    L.hairCol = pick(['black', 'dark brown', 'brown', 'auburn', 'ginger', 'blonde', 'grey']);
    return L;
}
// ---------- the whole set-up ----------
/** The wardrobe's familiars (js/den-look.js's `fam` slot: a test checks they're the same), 'none' first. */
export const FAMS = ['none', 'parrot', 'monkey', 'octopus', 'squirrel', 'bat', 'krakling'];
const isFam = (f) => FAMS.includes(f);
/* Her familiar, as well as her outfit (Mischievious herself, 11 Nov: "I'm usually wearing a monkey but
   maybe I could switch fams as well as outfits?"): offered after which look of hers, her look's own
   first, then a monkey, as she usually wears one, then the rest, none last. */
export const herFams = (look) => choices(typeof look.fam === 'string' ? look.fam : undefined, FAMS, ['monkey']);
/** Her as you're marrying her: the version you picked (of `vs`, MISCHIEVIOUS_VERSIONS), with the familiar
    you picked (in the colours another of her looks has it in, else the wardrobe's own). */
export function herLook(vs, p) {
    const v = vs[p.ver] ?? vs[0];
    return restyle(v?.look ?? {}, { fam: p.fam }, vs.map((x) => x.look));
}
/** A fresh wedding in a tone: the venue as you find it, nothing chosen. */
export function fresh(tone = 'happy', seed = 0) {
    return { tone, partner: null, venue: 'beach', theme: null, plot: SUGGEST[tone].plots[0], props: arrival(tone), guests: [], size: 'small', seed, spots: [] };
}
const guestsOf = (theme, size, seed) => Array.from({ length: sizeN(size) }, (_, i) => baseGuest(theme, seed, i));
/** The theme chosen: its layout for the venue, its guests (however many) in its outfits, where they'd stand. */
export function dressFor(w, theme) {
    return { ...w, theme, props: layout(w.venue, theme), guests: guestsOf(theme, w.size, w.seed), spots: [] };
}
/** Whether you've dressed the i-th guest yourself. */
export const dressedUp = (w, i) => !!w.theme && !!w.guests[i] && !sameLook(w.guests[i], baseGuest(w.theme, w.seed, i));
/** How many come, changed: those you've dressed and moved stay so, while there's room for them. */
export function withSize(w, size) {
    const n = sizeN(size);
    const guests = w.theme ? Array.from({ length: n }, (_, i) => (w.guests[i] ? { ...w.guests[i] } : baseGuest(w.theme, w.seed, i))) : [];
    return { ...w, size, guests, spots: w.spots.filter((s) => s.i < n) };
}
/** A different crowd (the same theme, dressed afresh from another seed): those you've dressed stay. */
export function reseed(w, seed) {
    if (!w.theme)
        return { ...w, seed };
    return { ...w, seed, guests: w.guests.map((g, i) => (dressedUp(w, i) ? g : baseGuest(w.theme, seed, i))) };
}
const fine = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v * 20) / 20));
/** A guest moved to x, z (facing `r`, or the altar), or turned where they stand: if they can stand
    there, among everyone else where they stand now (`seats`), the set-up with them there; if not, null. */
export function moveGuest(w, seats, i, x0, z0, r) {
    const x = fine(x0, -GROUNDS.x, GROUNDS.x), z = fine(z0, GROUNDS.z0, GROUNDS.z1);
    if (!(i >= 0 && i < w.guests.length) || !standFree(w.props, seats.filter((_, j) => j !== i), x, z))
        return null;
    const turn = r === undefined ? facingAltar(x, z) : ((Math.round(r) % 8) + 8) % 8;
    return { ...w, spots: [...w.spots.filter((s) => s.i !== i), { i, x, z, r: turn }] };
}
/** The venue changed: a layout still as the theme laid it out goes with it (one you've tuned stays as
    you tuned it). */
export function moveTo(w, venue) {
    if (w.theme && same(w.props, layout(w.venue, w.theme)))
        return { ...w, venue, props: layout(venue, w.theme) };
    return { ...w, venue };
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const LOOK_KEY = /^[a-zA-Z0-9]{1,12}$/, LOOK_VAL = /^[a-z0-9 '-]{1,20}$/i;
/** A look from anywhere (storage, a link) cut down to plain values: the den's cleanLook does the rest. */
export function plainLook(o) {
    const out = {};
    if (!o || typeof o !== 'object')
        return out;
    for (const [k, v] of Object.entries(o).slice(0, 40)) {
        if (!LOOK_KEY.test(k))
            continue;
        if (typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v) && Math.abs(v) < 100) || (typeof v === 'string' && LOOK_VAL.test(v)))
            out[k] = v;
    }
    return out;
}
/** A prop made safe: a real kind, in AREA on quarter metres, a whole turn, a dye. */
export function cleanProp(o) {
    if (!o || typeof o !== 'object')
        return null;
    const p = o;
    if (!PROPS.some(([k]) => k === p.k))
        return null;
    const x = Number(p.x), z = Number(p.z), r = Number(p.r);
    if (!Number.isFinite(x) || !Number.isFinite(z))
        return null;
    const out = { k: p.k, x: snap(x, -AREA.x, AREA.x), z: snap(z, AREA.z0, AREA.z1), r: Number.isFinite(r) ? ((Math.round(r) % 8) + 8) % 8 : 0, c: isDye(p.c) ? p.c : 'white' };
    if (p.w === true)
        out.w = true;
    return out;
}
/** A set-up from anywhere (storage, a link, a crewmate) made safe: anything that isn't one of the
    choices is the default, and once a theme's chosen there's a look for every guest its size has. */
export function clean(o) {
    const w = (o && typeof o === 'object' ? o : {});
    const tone = w.tone === 'dark' ? 'dark' : 'happy';
    const venue = (VENUES.find((v) => v.id === w.venue)?.id ?? 'beach');
    const theme = (themeOf(w.theme)?.id ?? null);
    const plot = (PLOTS.find((p) => p.id === w.plot)?.id ?? SUGGEST[tone].plots[0]);
    let partner = null;
    const pa = w.partner;
    if (pa && typeof pa === 'object') {
        const n = Number(pa.kind === 'her' ? pa.ver : pa.i);
        if (pa.kind === 'her')
            partner = { kind: 'her', ver: Number.isInteger(n) && n >= 0 && n < 16 ? n : 0, ...(isFam(pa.fam) ? { fam: pa.fam } : {}) };
        else if (pa.kind === 'suitor' && Number.isInteger(n) && n >= 0 && n < suitors(tone).length)
            partner = { kind: 'suitor', i: n };
        else if (pa.kind === 'own')
            partner = { kind: 'own', look: plainLook(pa.look) };
    }
    const props = Array.isArray(w.props) ? w.props.slice(0, MAX_PROPS).map(cleanProp).filter((p) => !!p) : theme ? layout(venue, theme) : arrival(tone);
    const size = (SIZES.find((s) => s.id === w.size)?.id ?? 'small'), n = sizeN(size);
    const seed = Number.isInteger(w.seed) && w.seed >= 0 && w.seed < SEEDS ? w.seed : 0;
    const given = Array.isArray(w.guests) ? w.guests.slice(0, n).map(plainLook) : [];
    const guests = theme ? Array.from({ length: n }, (_, i) => (given[i] && Object.keys(given[i]).length ? given[i] : baseGuest(theme, seed, i))) : [];
    const spots = [];
    if (theme && Array.isArray(w.spots)) {
        for (const s of w.spots.slice(0, n)) {
            const i = Number(s?.i), x = Number(s?.x), z = Number(s?.z), r = Number(s?.r);
            if (!Number.isInteger(i) || i < 0 || i >= n || spots.some((t) => t.i === i) || !Number.isFinite(x) || !Number.isFinite(z))
                continue;
            spots.push({ i, x: fine(x, -GROUNDS.x, GROUNDS.x), z: fine(z, GROUNDS.z0, GROUNDS.z1), r: Number.isFinite(r) ? ((Math.round(r) % 8) + 8) % 8 : 4 });
        }
    }
    return { tone, partner, venue, theme, plot, props, guests, size, seed, spots };
}
// ---------- the share link ----------
/* Short: the choices as indices, the props as seven characters each (or nothing, if they're still the
   theme's layout), the guests as only what's been changed from how they come (the theme's outfits, and
   the crowd's from its seed: a hundred and forty guests, and only the ones you've dressed are in it),
   and the guests you've moved as seven characters each. Then JSON in base64url, for
   den.html?at=wedding&w=... Version 1 (10 Nov) had no size, seed or moved guests; its links still open. */
const b36 = (n, len) => n.toString(36).padStart(len, '0');
const VERSION = 2;
function packProp(p) {
    return b36(PROPS.findIndex(([k]) => k === p.k), 1) + b36(Math.round(p.x * 4) + 24, 2) + b36(Math.round(p.z * 4) + 24, 2) + b36(p.r + (p.w ? 8 : 0), 1) + b36(Math.max(0, DYE_NAMES.indexOf(p.c)), 1);
}
function unpackProp(s) {
    const n = (a, b) => parseInt(s.slice(a, b), 36);
    const k = PROPS[n(0, 1)]?.[0], rw = n(5, 6);
    if (!k || Number.isNaN(rw))
        return null;
    return cleanProp({ k, x: (n(1, 3) - 24) / 4, z: (n(3, 5) - 24) / 4, r: rw % 8, w: rw >= 8, c: DYE_NAMES[n(6, 7)] });
}
const packSpot = (s) => b36(s.i, 2) + b36(Math.round(s.x * 20) + 150, 2) + b36(Math.round(s.z * 20) + 150, 2) + b36(s.r, 1);
function unpackSpots(s) {
    if (typeof s !== 'string')
        return [];
    const out = [], n = (t, a, b) => parseInt(t.slice(a, b), 36);
    for (let j = 0; j + 7 <= s.length && out.length < MAX_GUESTS; j += 7) {
        const t = s.slice(j, j + 7), v = [n(t, 0, 2), n(t, 2, 4), n(t, 4, 6), n(t, 6, 7)];
        if (!v.some(Number.isNaN))
            out.push({ i: v[0], x: (v[1] - 150) / 20, z: (v[2] - 150) / 20, r: v[3] });
    }
    return out;
}
function diff(a, base) {
    const out = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(base)]))
        if (a[k] !== base[k] && a[k] !== undefined)
            out[k] = a[k];
    return Object.keys(out).length ? out : 0;
}
const toB64 = (s) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = (s) => atob(s.replace(/-/g, '+').replace(/_/g, '/'));
const SMALL = SIZES.findIndex((s) => s.id === 'small');
export function encode(w0) {
    const w = clean(w0), T = themeOf(w.theme);
    const tone = TONES.findIndex((t) => t.id === w.tone), venue = VENUES.findIndex((v) => v.id === w.venue);
    const theme = T ? THEMES.indexOf(T) : -1, plot = PLOTS.findIndex((p) => p.id === w.plot);
    const pa = !w.partner ? 0 : w.partner.kind === 'her' ? ['h', w.partner.ver, ...(w.partner.fam ? [w.partner.fam] : [])] : w.partner.kind === 'suitor' ? ['s', w.partner.i] : ['o', w.partner.look];
    const base = T ? layout(w.venue, w.theme) : arrival(w.tone);
    const props = same(w.props, base) ? 0 : w.props.map(packProp).join('');
    // (a guest's changes; or, if they've lost something they came with, their whole look, in a list)
    const gs = {};
    if (w.theme)
        w.guests.forEach((g, i) => {
            const b = baseGuest(w.theme, w.seed, i), d = diff(g, b);
            if (d)
                gs[i] = Object.keys(b).every((k) => k in g) ? d : [g];
        });
    const out = [VERSION, tone, venue, theme, plot, pa, props, Object.keys(gs).length ? gs : 0, SIZES.findIndex((s) => s.id === w.size), w.seed, w.spots.length ? w.spots.map(packSpot).join('') : 0];
    // (what's as it always was left off the end: a plain wedding's link as short as ever)
    const DEF = [null, null, null, null, null, null, null, 0, SMALL, 0, 0];
    while (out.length > 7 && out[out.length - 1] === DEF[out.length - 1])
        out.pop();
    // (JSON's own characters: a look's names are plain ASCII after clean())
    return toB64(JSON.stringify(out));
}
/** A link's set-up, or null if it isn't one. */
export function decode(code) {
    let a;
    try {
        a = JSON.parse(fromB64(String(code)));
    }
    catch {
        return null;
    }
    if (!Array.isArray(a) || (a[0] !== 1 && a[0] !== VERSION))
        return null;
    const [ver, tone, venue, theme, plot, pa, props, gs, size, seed, spots] = a;
    const T = THEMES[theme] ?? null, tn = TONES[tone]?.id ?? 'happy', vn = VENUES[venue]?.id ?? 'beach';
    const sz = ver === 1 ? 'small' : SIZES[size ?? SMALL]?.id ?? 'small';
    const sd = Number.isInteger(seed) && seed >= 0 && seed < SEEDS ? seed : 0;
    let partner = null;
    if (Array.isArray(pa))
        partner = pa[0] === 'h' ? { kind: 'her', ver: pa[1], fam: pa[2] } : pa[0] === 's' ? { kind: 'suitor', i: pa[1] } : pa[0] === 'o' ? { kind: 'own', look: pa[1] } : null;
    let ps;
    if (typeof props === 'string') {
        const out = [];
        for (let i = 0; i + 7 <= props.length && out.length < MAX_PROPS; i += 7) {
            const p = unpackProp(props.slice(i, i + 7));
            if (p)
                out.push(p);
        }
        ps = out;
    }
    // (version 1: the eight guests' changes in a list; since, only the changed ones, by number)
    const changed = (i) => {
        if (!gs || typeof gs !== 'object')
            return null;
        if (Array.isArray(gs))
            return ver === 1 ? gs[i] : null;
        return Object.prototype.hasOwnProperty.call(gs, String(i)) ? gs[String(i)] : null;
    };
    const guests = T ? Array.from({ length: sizeN(sz) }, (_, i) => {
        const d = changed(i);
        if (Array.isArray(d))
            return plainLook(d[0]);
        return { ...baseGuest(T.id, sd, i), ...(d && typeof d === 'object' ? plainLook(d) : {}) };
    }) : [];
    return clean({ tone: tn, venue: vn, theme: T?.id ?? null, plot: PLOTS[plot]?.id, partner, props: ps, guests, size: sz, seed: sd, spots: unpackSpots(spots) });
}
/** The portrait's caption: "You & Barnaby, wed on the beach, bloody and gory". */
export function caption(w, you, partner) {
    const V = VENUES.find((v) => v.id === w.venue), T = themeOf(w.theme);
    return `${you} & ${partner}, wed ${V.where}${T ? `, ${T.name.toLowerCase()}` : ''}`;
}
