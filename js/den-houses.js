/* Pirate Den: the housing district, as in old Puzzle Pirates. TypeScript, compiled to js/den-houses.js;
   tested in tests/den-houses.test.ts. js/den/lodgings.js draws the district's door in the den and its
   list of houses; js/den/house.js is the house shell every house is played in (its rooms, walking
   about them, the way out); each house's own scene is a module of its own (Gravee's:
   js/den/gravee-house.js, its rules src/den-gravee.ts).

   The user (11 Nov): "more like ... old Puzzle Pirates, you have like the areas of houses and you have
   the enter a house stuff and you can choose whose house to go into. And maybe she's just one of them.
   ... It's a nice way of adding other friends in later if I just want people to have their own little
   house and their own scenes."

   How Puzzle Pirates did it (YPPedia, House, checked 11 Nov): a house is a building on an island where
   pirates enter each other's houses; walk up to it and it lists that island's houses of its kind by
   owner; you knock, and the owner (home) lets you in. Each house is a set of rooms (a shack one, a
   manor nine), furnished and decorated by its owner, portraits on its walls. So here: a doorway dug
   into the den's left-hand cliff, its sign "Lodgings" (a hideout, not a city: STORY.md); walk up and
   Space (or a click) lists the houses there by owner; knock on one and its owner lets you in. Adding a
   friend's house is one more entry in HOUSES and a scene module of its own (house.js's SCENES). */
/** The district's houses. Gravee's is the first (her manor on Admiral Island is "Bedside Manors": her
    pirate page, Emerald, 11 Nov). A friend's house is one more line here. */
export const HOUSES = [
    { id: 'gravee', owner: 'Gravee', name: 'Bedside Manors', kind: 'Manor', blurb: 'Portraits. A great many portraits.' },
];
/** The house by its id, or null. */
export const houseById = (id) => HOUSES.find((h) => h.id === id) ?? null;
/** The list as the door shows it: by owner, as Puzzle Pirates listed them. */
export const houseList = () => [...HOUSES].sort((a, b) => a.owner.localeCompare(b.owner));
/** The district's door, dug into the den's left-hand cliff, facing in across the floor: between the
    torch by the armoury hoist and your shack's plot, a stretch of floor nothing else uses at any stage
    (the rampart's frames are on the right, the plot at the back left). Metres, on the den's floor.
    `face`: the way the doorway faces (+x: into the den). */
export const LODGINGS = { x: -8.05, z: 8.6, face: 1, reach: 1.3, name: 'Lodgings' };
/** Close enough to the district's door to knock? (Standing in front of it, on the den's floor.) */
export const atLodgings = (x, z) => Math.hypot(x - LODGINGS.x, z - LODGINGS.z) < LODGINGS.reach;
/** How far from a wall you can stand (your pirate's half-width). */
export const PAD = 0.32;
const inRect = (r, x, z, pad = 0) => x >= r.x0 + pad && x <= r.x1 - pad && z >= r.z0 + pad && z <= r.z1 - pad;
/** Can you stand here: inside a room (clear of its walls), or in a doorway? */
export function walkable(plan, x, z) {
    return plan.rooms.some((r) => inRect(r, x, z, PAD)) || plan.doors.some((d) => inRect(d, x, z));
}
/** The room you're in, or null (in a doorway). */
export const roomAt = (plan, x, z) => plan.rooms.find((r) => inRect(r, x, z)) ?? null;
/** A step from (ox, oz) toward (nx, nz): where you get to. Round anything in the way, and along a wall
    rather than stopping dead at it (as on the den's floor). */
export function step(plan, ox, oz, nx, nz, blocks = []) {
    for (const b of blocks) {
        const dx = nx - b.x, dz = nz - b.z, d = Math.hypot(dx, dz), min = b.r + PAD;
        if (d < min && d > 1e-6) {
            nx = b.x + dx / d * min;
            nz = b.z + dz / d * min;
        }
    }
    if (walkable(plan, nx, nz))
        return [nx, nz];
    if (walkable(plan, nx, oz))
        return [nx, oz];
    if (walkable(plan, ox, nz))
        return [ox, nz];
    return [ox, oz];
}
/** How long a line stays up in its bubble: long enough to read (seconds). */
export const readSecs = (text) => Math.max(1.8, String(text).trim().split(/\s+/).length * 0.33 + 1.0);
/** At the front door, to go out? */
export const atWayOut = (plan, x, z) => Math.hypot(x - plan.out.x, z - plan.out.z) < plan.out.r;
/** Kept in this browser, by house (RULES.md, "Except what people make their own": a portrait of you on
    a friend's wall is yours, kept through a reload and a new game alike). */
export const SITTINGS_KEY = 'carp.den.portraits';
const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Whatever was kept, made safe: only known houses, only looks that are objects of plain values, only
    proper dates. (Each look is cleaned again by the wardrobe's cleanLook when it's drawn.) */
export function cleanSittings(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
        return out;
    for (const [id, s] of Object.entries(raw)) {
        if (!houseById(id) || !s || typeof s !== 'object')
            continue;
        const { look, at } = s;
        if (!look || typeof look !== 'object' || Array.isArray(look) || typeof at !== 'string' || !DATE.test(at))
            continue;
        const L = {};
        for (const [k, v] of Object.entries(look))
            if (['string', 'number', 'boolean'].includes(typeof v))
                L[k] = v;
        out[id] = { look: L, at };
    }
    return out;
}
/** The sittings with a new one: you, as you are, painted in this house today (a new sitting replaces
    the last: she paints over it). */
export function sat(sittings, house, look, when) {
    if (!houseById(house))
        return { ...sittings };
    const at = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, '0')}-${String(when.getDate()).padStart(2, '0')}`;
    return { ...sittings, [house]: { look: { ...look }, at } };
}
/** "11 Nov 2026", as a plaque has it. */
export function plaqueDate(at) {
    if (!DATE.test(at))
        return '';
    const [y, m, d] = at.split('-').map(Number);
    return `${d} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}`;
}
/** A file name for the snapshot of a portrait: plain letters, dashes between. */
export const snapshotName = (who, house) => `${`${who}-in-${house}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'portrait'}.png`;
