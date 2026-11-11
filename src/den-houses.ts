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

/** A house in the district: whose it is, its name (its owner's own, as on their pirate page), and what
    kind of house (YPPedia's names: Shack, Cottage, Manor...). */
export interface House {
  id: string;
  owner: string;
  name: string;
  kind: string;
  /** What the list says of it, in a few words. */
  blurb: string;
}

/** The district's houses. Gravee's is the first (her manor on Admiral Island is "Bedside Manors": her
    pirate page, Emerald, 11 Nov). A friend's house is one more line here. */
export const HOUSES: readonly House[] = [
  { id: 'gravee', owner: 'Gravee', name: 'Bedside Manors', kind: 'Manor', blurb: 'Portraits. A great many portraits.' },
];

/** The house by its id, or null. */
export const houseById = (id: string): House | null => HOUSES.find((h) => h.id === id) ?? null;

/** The list as the door shows it: by owner, as Puzzle Pirates listed them. */
export const houseList = (): House[] => [...HOUSES].sort((a, b) => a.owner.localeCompare(b.owner));

/** The district's door, dug into the den's left-hand cliff, facing in across the floor: between the
    torch by the armoury hoist and your shack's plot, a stretch of floor nothing else uses at any stage
    (the rampart's frames are on the right, the plot at the back left). Metres, on the den's floor.
    `face`: the way the doorway faces (+x: into the den). */
export const LODGINGS = { x: -8.05, z: 8.6, face: 1, reach: 1.3, name: 'Lodgings' } as const;

/** Close enough to the district's door to knock? (Standing in front of it, on the den's floor.) */
export const atLodgings = (x: number, z: number): boolean => Math.hypot(x - LODGINGS.x, z - LODGINGS.z) < LODGINGS.reach;

// ---------- the house shell: rooms, doorways, walking about ----------

/** A rectangle on a house's floor (metres; x across, z toward you). */
export interface Rect { x0: number; x1: number; z0: number; z1: number }
/** A room: its floor, its name, and (if its owner chose) its wallpaper's colour. */
export interface Room extends Rect { id: string; name: string; paper?: string }
/** Something on the floor you walk round (a coffin, an easel): a circle. */
export interface Block { x: number; z: number; r: number }
/** A house's floor plan: its rooms, the doorways between them (each a rectangle reaching a little into
    both rooms), and its front door (the way out: walk up to it and Space). */
export interface Plan { rooms: readonly Room[]; doors: readonly Rect[]; out: { x: number; z: number; r: number } }

/** How far from a wall you can stand (your pirate's half-width). */
export const PAD = 0.32;

const inRect = (r: Rect, x: number, z: number, pad = 0): boolean => x >= r.x0 + pad && x <= r.x1 - pad && z >= r.z0 + pad && z <= r.z1 - pad;

/** Can you stand here: inside a room (clear of its walls), or in a doorway? */
export function walkable(plan: Plan, x: number, z: number): boolean {
  return plan.rooms.some((r) => inRect(r, x, z, PAD)) || plan.doors.some((d) => inRect(d, x, z));
}

/** The room you're in, or null (in a doorway). */
export const roomAt = (plan: Plan, x: number, z: number): Room | null => plan.rooms.find((r) => inRect(r, x, z)) ?? null;

/** A step from (ox, oz) toward (nx, nz): where you get to. Round anything in the way, and along a wall
    rather than stopping dead at it (as on the den's floor). */
export function step(plan: Plan, ox: number, oz: number, nx: number, nz: number, blocks: readonly Block[] = []): [number, number] {
  for (const b of blocks) {
    const dx = nx - b.x, dz = nz - b.z, d = Math.hypot(dx, dz), min = b.r + PAD;
    if (d < min && d > 1e-6) { nx = b.x + dx / d * min; nz = b.z + dz / d * min; }
  }
  if (walkable(plan, nx, nz)) return [nx, nz];
  if (walkable(plan, nx, oz)) return [nx, oz];
  if (walkable(plan, ox, nz)) return [ox, nz];
  return [ox, oz];
}

/** How long a line stays up in its bubble: long enough to read (seconds). */
export const readSecs = (text: string): number => Math.max(1.8, String(text).trim().split(/\s+/).length * 0.33 + 1.0);

// ---------- whoever shows you round: at your side ----------
/* A house's host walks with you (the user, 11 Nov, of Gravee: "[she] should be walking with you. As you
   walk through the house. Oh, she comes eventually. She was very slow to, though."; and "definitely needs
   to be a standard feature for people in houses and things"): kept at your side, at your pace (you walk
   at YOUR_PACE), hurrying when you've got ahead, and by the thing they're showing you while they talk
   about it. The house shell (js/den/house.js) walks any house's host so; a house only says who, and
   where each thing they show you is. */
export const YOUR_PACE = 4.2;
/** How near they keep (`keep`, metres), how far you get before they set off after you (`near`; once
    walking they keep on till they're back at `keep`, so they don't stop and start at your heels), and
    past `far` they hurry. */
export const ALONGSIDE = { near: 1.9, keep: 1.3, hurry: 6.2, far: 3.2 } as const;
interface At { x: number; z: number }
/** Where a host heads to keep by you, and how fast; null when they're by you already. `walking`: they
    were on their way last step. */
export function alongside(host: At, you: At, walking = false): { x: number; z: number; speed: number } | null {
  const d = Math.hypot(host.x - you.x, host.z - you.z);
  if (d < (walking ? ALONGSIDE.keep + 0.1 : ALONGSIDE.near)) return null;
  const k = ALONGSIDE.keep / d;
  return { x: you.x + (host.x - you.x) * k, z: you.z + (host.z - you.z) * k, speed: d > ALONGSIDE.far ? ALONGSIDE.hurry : YOUR_PACE };
}
/** Something a host shows you: you come within `near` of `at`, and they stand at `stand` to talk about it. */
export interface ShowSpot { at: At; near: number; stand: At }
/** Where a host heads: to the thing they're `showing` you while you're there (and they're on about it),
    or else at your side. Null: stay put. */
export function hostTarget(host: At, you: At, showing: ShowSpot | null, walking = false): { x: number; z: number; speed: number } | null {
  if (showing && Math.hypot(you.x - showing.at.x, you.z - showing.at.z) < showing.near + 0.8) {
    return Math.hypot(host.x - showing.stand.x, host.z - showing.stand.z) < 0.1 ? null : { ...showing.stand, speed: YOUR_PACE };
  }
  return alongside(host, you, walking);
}

// ---------- a long stretch you can skip along ----------
/* A house can have a stretch that goes on and on (Gravee's gallery), which you walk at a walk, the joke
   being that it does; or skip along, a button and a key, at a run, the camera alongside (the user, 11 Nov:
   "Obviously, you can zoom by as a skip. I don't think it should do that by default, though"). Along x,
   in one room, from `a` to `b`. */
export interface Stretch { room: string; a: number; b: number }
/** Skipping from x, facing `dir` (+1: toward b): to its end that way, or, nothing much left that way, its
    other end; null if you're not in its room. */
export function skipTo(plan: Plan, s: Stretch, x: number, z: number, dir: number): number | null {
  if (roomAt(plan, x, z)?.id !== s.room) return null;
  const ahead = dir >= 0 ? s.b : s.a, behind = dir >= 0 ? s.a : s.b;
  if (Math.abs(ahead - x) > 2.5) return ahead;
  return Math.abs(behind - x) > 2.5 ? behind : null;
}
/** How long a skip takes (seconds), `dist` metres: the first time slow enough to see it go on and on and
    read the titles as they pass; after that quicker. A joke, not a chore. */
export const skipSecs = (dist: number, times: number): number => Math.max(2.2, Math.abs(dist) / (times ? 11 : 6.5));

/** At the front door, to go out? */
export const atWayOut = (plan: Plan, x: number, z: number): boolean => Math.hypot(x - plan.out.x, z - plan.out.z) < plan.out.r;

// ---------- your portrait, kept ----------

/** A portrait of you an owner painted: your look as it was when you sat (frozen so, whatever you
    wear after), and when. */
export interface Sitting { look: Record<string, string | number | boolean>; at: string }

/** Kept in this browser, by house (RULES.md, "Except what people make their own": a portrait of you on
    a friend's wall is yours, kept through a reload and a new game alike). */
export const SITTINGS_KEY = 'carp.den.portraits';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Whatever was kept, made safe: only known houses, only looks that are objects of plain values, only
    proper dates. (Each look is cleaned again by the wardrobe's cleanLook when it's drawn.) */
export function cleanSittings(raw: unknown): Record<string, Sitting> {
  const out: Record<string, Sitting> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [id, s] of Object.entries(raw as Record<string, unknown>)) {
    if (!houseById(id) || !s || typeof s !== 'object') continue;
    const { look, at } = s as { look?: unknown; at?: unknown };
    if (!look || typeof look !== 'object' || Array.isArray(look) || typeof at !== 'string' || !DATE.test(at)) continue;
    const L: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(look as Record<string, unknown>)) if (['string', 'number', 'boolean'].includes(typeof v)) L[k] = v as string | number | boolean;
    out[id] = { look: L, at };
  }
  return out;
}

/** The sittings with a new one: you, as you are, painted in this house today (a new sitting replaces
    the last: she paints over it). */
export function sat(sittings: Record<string, Sitting>, house: string, look: Record<string, string | number | boolean>, when: Date): Record<string, Sitting> {
  if (!houseById(house)) return { ...sittings };
  const at = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, '0')}-${String(when.getDate()).padStart(2, '0')}`;
  return { ...sittings, [house]: { look: { ...look }, at } };
}

/** "11 Nov 2026", as a plaque has it. */
export function plaqueDate(at: string): string {
  if (!DATE.test(at)) return '';
  const [y, m, d] = at.split('-').map(Number);
  return `${d} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}`;
}

/** A file name for the snapshot of a portrait: plain letters, dashes between. */
export const snapshotName = (who: string, house: string): string =>
  `${`${who}-in-${house}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'portrait'}.png`;
