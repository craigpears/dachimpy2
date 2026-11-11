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
export const PROPS = [
    ['bench', 'Bench'], ['arch', 'Arch'], ['flowers', 'Flowers'], ['banner', 'Banner'], ['barrel', 'Barrel'],
    ['table', 'Table'], ['lantern', 'Lantern'], ['candles', 'Candles'], ['cake', 'Cake'], ['splat', 'Splatter'],
];
export const MAX_PROPS = 48;
/** How much room each needs (its radius, metres): for picking it and keeping it in AREA. */
export const PROP_R = { bench: 1.2, arch: 1.3, flowers: 0.35, banner: 0.8, barrel: 0.4, table: 0.6, lantern: 0.25, candles: 0.3, cake: 0.45, splat: 0.6 };
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
export const GUESTS = 8;
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
    }
    else if (theme === 'gory') {
        for (const [x, z] of [[-0.6, 3.6], [0.7, 1.2], [-3.4, -3.6], [4.1, 0.2], [-4.4, 3.2], [0.2, -2.0]])
            out.push(P('splat', x, z, 'red', (x * 3 + z * 5 + 16) % 8 | 0));
        out.push(P('banner', -3.8, -5.4, c, 0), P('banner', 3.8, -5.4, c, 0), P('flowers', -1.0, -4.6, a), P('flowers', 1.0, -4.6, a), P('lantern', -4.4, -1.6, c), P('lantern', 4.4, -1.6, c), P('candles', -1.8, -5.0, b), P('candles', 1.8, -5.0, b), P('barrel', -4.8, 5.2, b), P('table', 4.6, 5.0, b), P('cake', 4.6, 5.0, c));
    }
    else {
        for (const [x, z] of [[-4.6, -1.6], [4.6, -1.6], [-4.8, 1.5], [4.8, 1.5], [-4.6, 5.4], [-3.8, 6.2]])
            out.push(P('barrel', x, z, c));
        out.push(P('banner', -3.8, -5.4, d, 0), P('banner', 3.8, -5.4, d, 0), P('lantern', -1.2, 5.8, b), P('lantern', 1.2, 5.8, b), P('table', 4.6, 5.0, a), P('table', 2.6, 6.2, a, 2), P('cake', 4.6, 5.0, b), P('flowers', -1.0, -4.6, e(T)), P('flowers', 1.0, -4.6, e(T)));
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
        default: return [];
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
export function seatsFor(props, n = GUESTS) {
    const out = [];
    const free = (x, z) => Math.abs(x) <= AREA.x + 0.5 && z >= AREA.z0 && z <= AREA.z1 + 0.5
        && !(Math.abs(x) < FRONT.x && z < FRONT.z) && !(Math.abs(x) < AISLE_X && z >= FRONT.z)
        && !props.some((p) => inProp(p, x, z)) && !out.some((o) => Math.hypot(o.x - x, o.z - z) < BODY_R * 2.1)
        && !PEOPLE.some((s) => Math.hypot(s.x - x, s.z - z) < BODY_R * 2.1);
    for (const b of props) {
        if (b.k !== 'bench' || b.w)
            continue;
        const a = b.r * Math.PI / 4, yaw = a + Math.PI;
        // (a bench's length along its own x; it faces its own -z, so they look its way)
        const at = (lx, lz) => ({ x: b.x + lx * Math.cos(a) + lz * Math.sin(a), z: b.z - lx * Math.sin(a) + lz * Math.cos(a) });
        for (const lx of [-0.55, 0.55]) {
            if (out.length >= n)
                return out;
            const spot = [at(lx, -0.58), at(lx, 0.6), at(lx * 2.75, 0)].find((s) => free(s.x, s.z));
            if (spot)
                out.push({ ...spot, yaw, sit: false });
        }
    }
    // (the rest at the back, from the aisle outwards, then down the sides, front to back)
    const rest = [];
    for (let z = 5.0; z <= AREA.z1 + 0.01; z += 0.8)
        for (let i = 0; i < 6; i++)
            for (const sd of [-1, 1])
                rest.push({ x: sd * (1.4 + i * 0.85), z });
    for (let z = FRONT.z; z < 5; z += 0.8)
        for (const x of [5.4, 4.6])
            for (const sd of [-1, 1])
                rest.push({ x: sd * x, z });
    for (const r of rest) {
        if (out.length >= n)
            break;
        if (free(r.x, r.z))
            out.push({ x: r.x, z: r.z, yaw: Math.PI, sit: false });
    }
    // (and if there's nowhere at all, somewhere at the very back)
    for (let i = 0; out.length < n; i++)
        out.push({ x: (i % 2 ? 1 : -1) * (1.2 + Math.floor(i / 2) * 0.7), z: AREA.z1 + 0.6, yaw: Math.PI, sit: false });
    return out;
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
const JILTED = {
    name: 'Barnaby', hurt: true,
    look: { body: 'm', skin: 1, hair: 'short', hairCol: 'brown', beard: 'moustache', patch: false, smile: true, hat: 'none', top: 'captain', topCol: 'white', topCol2: 'gold', waist: 'sash', waistCol: 'rose', legs: 'pants', legsCol: 'white', feet: 'shoes', feetCol: 'black', hand: 'bouquet' },
    line: 'My last bride had a little mishap. With a cannon. I\'ve had a lie down and I\'m ready to try again!',
};
const SWEET = {
    name: 'Sweet William',
    look: { body: 'm', skin: 2, hair: 'wavy', hairCol: 'blonde', beard: 'none', patch: false, smile: true, hat: 'feathered', hatCol: 'peach', hatCol2: 'white', top: 'vest', topCol: 'peach', topCol2: 'white', legs: 'pantaloons', legsCol: 'white', feet: 'shoes', feetCol: 'tan', hand: 'bouquet', handCol: 'white' },
    line: 'I picked you a daisy. I picked everyone a daisy, actually. I just really like daisies.',
};
const REST = [
    { name: 'Saltwater Sal', look: { body: 'f', skin: 3, hair: 'braids', hairCol: 'black', patch: true, smile: true, hat: 'bandana', hatCol: 'aqua', top: 'vest', topCol: 'navy', topCol2: 'white', legs: 'patched', legsCol: 'navy', legsCol2: 'aqua', feet: 'boots', feetCol: 'black', hand: 'bouquet' },
        line: 'I can splice a rope, bilge a sloop and drink a kraken under the table. You\'ll never be bored.' },
    { name: 'Gentleman Jem', look: { body: 'm', skin: 4, hair: 'ponytail', hairCol: 'black', beard: 'goatee', patch: false, smile: true, hat: 'tricorne', hatCol: 'navy', top: 'swashbuckler', topCol: 'navy', topCol2: 'gold', legs: 'pants', legsCol: 'white', feet: 'fancy', feetCol: 'black', feetCol2: 'gold', hand: 'bouquet' },
        line: 'I\'ve written you a poem. It\'s mostly about rum, but you\'re in the last verse.' },
    { name: 'Captain Rosalind', look: { body: 'f', skin: 0, hair: 'wavy', hairCol: 'auburn', patch: false, smile: true, hat: 'captain', hatCol: 'maroon', hatCol2: 'gold', top: 'captain', topCol: 'maroon', topCol2: 'gold', legs: 'long', legsCol: 'black', feet: 'fancy', feetCol: 'black', feetCol2: 'gold', hand: 'bouquet' },
        line: 'I\'ve sunk forty ships, darling, but nobody\'s ever sunk my heart. Until now.' },
    { name: 'Wobbly Pete', look: { body: 'm', skin: 1, hair: 'bald', hairCol: 'grey', beard: 'long', patch: true, smile: true, hat: 'fez', hatCol: 'purple', top: 'striped', topCol: 'purple', topCol2: 'white', legs: 'kilt', legsCol: 'green', legsCol2: 'black', feet: 'curled', feetCol: 'gold', hand: 'bouquet' },
        line: 'I\'ve only the one good knee, but I\'ll go down on it for you. Getting up again\'s your job.' },
    { name: 'Lady Marigold', look: { body: 'f', skin: 5, hair: 'bun', hairCol: 'black', patch: false, smile: true, hat: 'wide', hatCol: 'orange', hatCol2: 'lemon', top: 'corset', topCol: 'orange', topCol2: 'lemon', legs: 'gown', legsCol: 'lemon', feet: 'shoes', feetCol: 'orange', hand: 'bouquet', fam: 'parrot', famCol: 'green', famCol2: 'red' },
        line: 'I\'ve a house on Admiral Island, three cats and a parrot who swears. We come as a set.' },
];
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
    { beat: 'seated', secs: 3.4, lines: [L('off', 0.4, 'Places, everyone! Ooh, I\'m going to cry.')] },
    { beat: 'procession', secs: 6, lines: [L('guest', 1.2, 'Ooh, look at them!'), L('guest2', 3.6, 'Stunning. Simply stunning.')] },
    { beat: 'vows', secs: 4.6, lines: [L('off', 0.2, 'Dearly beloved, we are gathered here today, on purpose...')] },
];
/** The plot's twist, after the vows begin. */
const TWIST = {
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
const CLOSE = [
    { beat: 'ido', secs: 6.8, lines: [L('off', 0.1, 'Do you take {partner}, through bilge and broadside?'), L('you', 3.3, 'I do!'), L('partner', 5.0, 'I do!')] },
    { beat: 'kiss', secs: 4.2, lines: [L('off', 0.2, 'Then you may kiss!')] },
    { beat: 'cheer', secs: 4.2, lines: [L('guest', 0.3, 'Hooray!'), L('mis', 1.9, 'Eee! I love weddings!')] },
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
/** A line with the names put in. */
export const fill = (text, names) => text.replace(/\{partner\}/g, names.partner).replace(/\{you\}/g, names.you);
// ---------- what Mischievious says ----------
/** As you arrive, before you've chosen a tone (the user, 11 Nov: "opening more with a cutscene where
    ... she explains to you what it is and what's going on"): her greeting, what this is, and her
    question, the tone's choice. Her voice, not yet either tone's. */
export const ARRIVE = [
    "Ahoy! Welcome to my isle! Mind the crabs, they're guests too.",
    'This is my wedding venue. Pirates sail in from all over the Ocean to get hitched here.',
    'First things first: what sort of wedding are we having?',
];
/** Her welcome once you've chosen the tone: the venue as she left it, what you do here, and her
    question. Giggly and romantic, or not in the least bothered by the blood and guts. */
export const WELCOME = {
    happy: [
        "Ooh, happy and cheesy! Roses, ribbons, the lot. I've done five today, just for the fun of it!",
        "You plan it your way: who, where, the look, and how it goes. I'll help. Then it plays out, and you get a portrait!",
        'So! How are you? Would you like to get married?',
    ],
    dark: [
        "Ooh, dark humour! Don't mind the blood and guts. The last wedding went a bit... bloody and gory.",
        "It's fine. Five weddings today, and only the one got raided. We've hired a bit of extra security.",
        "You plan it your way: who, where, the look, and how it goes. Then it plays out, and you get a portrait. Mop's in the corner.",
        'So! How are you? Would you like to get married?',
    ],
};
/** Back again, a wedding already planned (kept in this browser, or a share link): a shorter welcome,
    after her line for coming back (GUSH back, shared). */
export const RETURN = {
    happy: ["Carry on where you left off. Who, where, the look, how it goes: I'll be right here!"],
    dark: ["Carry on where you left off. I'll be right here. With the mop."],
};
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
export const GUSH = {
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
export const ASK_HER = [
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
/** A fresh wedding in a tone: the venue as you find it, nothing chosen. */
export function fresh(tone = 'happy') {
    return { tone, partner: null, venue: 'beach', theme: null, plot: SUGGEST[tone].plots[0], props: arrival(tone), guests: [] };
}
/** The theme chosen: its layout for the venue, its guests in its outfits. */
export function dressFor(w, theme) {
    return { ...w, theme, props: layout(w.venue, theme), guests: themeOf(theme).guests.map((g) => ({ ...g })) };
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
    choices is the default, and there are always GUESTS guests once a theme's chosen. */
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
            partner = { kind: 'her', ver: Number.isInteger(n) && n >= 0 && n < 16 ? n : 0 };
        else if (pa.kind === 'suitor' && Number.isInteger(n) && n >= 0 && n < suitors(tone).length)
            partner = { kind: 'suitor', i: n };
        else if (pa.kind === 'own')
            partner = { kind: 'own', look: plainLook(pa.look) };
    }
    const props = Array.isArray(w.props) ? w.props.slice(0, MAX_PROPS).map(cleanProp).filter((p) => !!p) : theme ? layout(venue, theme) : arrival(tone);
    const given = Array.isArray(w.guests) ? w.guests.slice(0, GUESTS).map(plainLook) : [];
    const T = themeOf(theme);
    const guests = T ? Array.from({ length: GUESTS }, (_, i) => (given[i] && Object.keys(given[i]).length ? given[i] : { ...T.guests[i] })) : [];
    return { tone, partner, venue, theme, plot, props, guests };
}
// ---------- the share link ----------
/* Short: the choices as indices, the props as seven characters each (or nothing, if they're still the
   theme's layout), the guests as only what's been changed from the theme's outfits. Then JSON in
   base64url, for den.html?at=wedding&w=... */
const b36 = (n, len) => n.toString(36).padStart(len, '0');
const VERSION = 1;
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
function diff(a, base) {
    const out = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(base)]))
        if (a[k] !== base[k] && a[k] !== undefined)
            out[k] = a[k];
    return Object.keys(out).length ? out : 0;
}
const toB64 = (s) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = (s) => atob(s.replace(/-/g, '+').replace(/_/g, '/'));
export function encode(w0) {
    const w = clean(w0), T = themeOf(w.theme);
    const tone = TONES.findIndex((t) => t.id === w.tone), venue = VENUES.findIndex((v) => v.id === w.venue);
    const theme = T ? THEMES.indexOf(T) : -1, plot = PLOTS.findIndex((p) => p.id === w.plot);
    const pa = !w.partner ? 0 : w.partner.kind === 'her' ? ['h', w.partner.ver] : w.partner.kind === 'suitor' ? ['s', w.partner.i] : ['o', w.partner.look];
    const base = T ? layout(w.venue, w.theme) : arrival(w.tone);
    const props = same(w.props, base) ? 0 : w.props.map(packProp).join('');
    const guests = T ? w.guests.map((g, i) => diff(g, T.guests[i])) : 0;
    const gs = guests && guests.some((g) => g) ? guests : 0;
    // (JSON's own characters: a look's names are plain ASCII after clean())
    return toB64(JSON.stringify([VERSION, tone, venue, theme, plot, pa, props, gs]));
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
    if (!Array.isArray(a) || a[0] !== VERSION)
        return null;
    const [, tone, venue, theme, plot, pa, props, gs] = a;
    const T = THEMES[theme] ?? null, tn = TONES[tone]?.id ?? 'happy', vn = VENUES[venue]?.id ?? 'beach';
    let partner = null;
    if (Array.isArray(pa))
        partner = pa[0] === 'h' ? { kind: 'her', ver: pa[1] } : pa[0] === 's' ? { kind: 'suitor', i: pa[1] } : pa[0] === 'o' ? { kind: 'own', look: pa[1] } : null;
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
    const guests = T ? T.guests.map((g, i) => ({ ...g, ...(Array.isArray(gs) && gs[i] && typeof gs[i] === 'object' ? plainLook(gs[i]) : {}) })) : [];
    return clean({ tone: tn, venue: vn, theme: T?.id ?? null, plot: PLOTS[plot]?.id, partner, props: ps, guests });
}
/** The portrait's caption: "You & Barnaby, wed on the beach, bloody and gory". */
export function caption(w, you, partner) {
    const V = VENUES.find((v) => v.id === w.venue), T = themeOf(w.theme);
    return `${you} & ${partner}, wed ${V.where}${T ? `, ${T.name.toLowerCase()}` : ''}`;
}
