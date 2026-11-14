/* Pirate Den: the housing district, as in old Puzzle Pirates. TypeScript, compiled to js/den-houses.js;
   tested in tests/den-houses.test.ts. js/den/lodgings.js draws the district's door in the den and its
   list of houses; js/den/house.js is the house shell every house is played in (its rooms, walking
   about them, the way out); each house's own scene is a module of its own (Gravee's:
   js/den/gravee-house.js, its rules src/den-gravee.ts; Roobear's: js/den/roobear-house.js, src/den-roobear.ts;
   Dachimpy's, the museum: js/den/dachimpy-house.js, src/den-dachimpy.ts).

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
    // Roobear's (13 Nov): a little house of her own, as every pirate has (RULES.md), small as suits her. A house,
    // but she calls it her ROOm (her own joke: "a ROOm you mean? xD"). Its rules: src/den-roobear.ts.
    { id: 'roobear', owner: 'Roobear', name: 'The ROOm', kind: 'Cottage', blurb: 'A house. She calls it her ROOm.' },
    // Dachimpy's (13 Nov), the user's own pirate: their house doubles as a museum of the old Blockade Simulator
    // and Dachimpy.com, and keeps their friends on its walls; a hug and a cookie at the door. Its rules:
    // src/den-dachimpy.ts.
    { id: 'dachimpy', owner: 'Dachimpy', name: 'Hugs and Cookies', kind: 'Manor', blurb: 'Hugs and cookies at the door. Friends first, then the old sims.' },
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
        else if (p.kind === 'simModel')
            out.push({ x: p.x, z: p.z, r: 0.5 });
        else if (p.kind === 'shelf') { // (long across its front: two circles side by side)
            const y = (p.yaw ?? 0) + Math.PI / 2, dx = Math.sin(y) * 0.38, dz = Math.cos(y) * 0.38;
            out.push({ x: p.x + dx, z: p.z + dz, r: 0.32 }, { x: p.x - dx, z: p.z - dz, r: 0.32 });
        }
        // (rugs and runners you walk over)
    }
    return out;
}
/** How long a line stays up in its bubble: long enough to read (seconds). */
export const readSecs = (text) => Math.max(1.8, String(text).trim().split(/\s+/).length * 0.33 + 1.0);
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
export const ALONGSIDE = { near: 1.9, keep: 1.3, hurry: 6.2, far: 3.2 };
/** Where a host heads to keep by you, and how fast; null when they're by you already. `walking`: they
    were on their way last step. */
export function alongside(host, you, walking = false) {
    const d = Math.hypot(host.x - you.x, host.z - you.z);
    if (d < (walking ? ALONGSIDE.keep + 0.1 : ALONGSIDE.near))
        return null;
    const k = ALONGSIDE.keep / d;
    return { x: you.x + (host.x - you.x) * k, z: you.z + (host.z - you.z) * k, speed: d > ALONGSIDE.far ? ALONGSIDE.hurry : YOUR_PACE };
}
/** Where a host heads: to the thing they're `showing` you while you're there (and they're on about it),
    or else at your side. Null: stay put. */
export function hostTarget(host, you, showing, walking = false) {
    if (showing && Math.hypot(you.x - showing.at.x, you.z - showing.at.z) < showing.near + 0.8) {
        return Math.hypot(host.x - showing.stand.x, host.z - showing.stand.z) < 0.1 ? null : { ...showing.stand, speed: YOUR_PACE };
    }
    return alongside(host, you, walking);
}
// ---------- painting at an easel ----------
/* Anyone painting at an easel, in any house (the user, 11 Nov, of Gravee: "her hand should actually be
   holding a brush at least pointing in the general direction of the canvas. She's right next to it at
   the moment"): stood a brush's reach from the canvas, facing it, a little round to one side so you see
   the picture past them, their brush hand to it. The easel's canvas (js/den/furniture.js's easel draws it
   from CANVAS): facing +z from the easel's foot at yaw 0, its middle `y` up and `out` in front, its
   painted face `face` further on. */
export const CANVAS = { y: 1.35, out: 0.18, face: 0.02 };
/** The 'paint' idle's brush (js/den/props-people.js, which holds one in the right hand while painting):
    from the shoulder to its tip along the arm (`tip`, metres: the arm to the hand, and the brush), where
    a pirate's right shoulder is (`shoulder`: out to the side, and up), and how far round from square-on
    to the canvas a painter stands (`slant`, radians; to the canvas's left as they face it, so the brush
    hand's toward it). */
export const BRUSH = { tip: 0.76, shoulder: { x: 0.28, y: 1.3 }, slant: 0.6 };
/** How far straight ahead of a painter's middle, at the canvas's height, the brush's tip reaches. */
export const brushReach = () => Math.sqrt(BRUSH.tip ** 2 - BRUSH.shoulder.x ** 2 - (CANVAS.y - BRUSH.shoulder.y) ** 2);
/** The canvas's painted middle, on the floor plan, of an easel at (x, z) turned to `yaw`. */
export function canvasAt(e) {
    const y = e.yaw ?? 0, out = CANVAS.out + CANVAS.face;
    return { x: e.x + Math.sin(y) * out, z: e.z + Math.cos(y) * out };
}
/** Where to stand to paint at an easel, and which way to face (yaw: 0 faces +z): the brush's tip on the
    canvas's middle, the painter `slant` round to its left. */
export function toPaint(e) {
    const y = e.yaw ?? 0, c = canvasAt(e), d = brushReach();
    // Facing into the canvas (along -its normal), turned `slant` toward its right (+x at its yaw).
    const fx = -Math.sin(y) * Math.cos(BRUSH.slant) + Math.cos(y) * Math.sin(BRUSH.slant);
    const fz = -Math.cos(y) * Math.cos(BRUSH.slant) - Math.sin(y) * Math.sin(BRUSH.slant);
    return { x: c.x - fx * d, z: c.z - fz * d, yaw: Math.atan2(fx, fz) };
}
/** Skipping from x, facing `dir` (+1: toward b): to its end that way, or, nothing much left that way, its
    other end; null if you're not in its room. */
export function skipTo(plan, s, x, z, dir) {
    if (roomAt(plan, x, z)?.id !== s.room)
        return null;
    const ahead = dir >= 0 ? s.b : s.a, behind = dir >= 0 ? s.a : s.b;
    if (Math.abs(ahead - x) > 2.5)
        return ahead;
    return Math.abs(behind - x) > 2.5 ? behind : null;
}
/** How long a skip takes (seconds), `dist` metres: the first time slow enough to see it go on and on and
    read the titles as they pass; after that quicker. A joke, not a chore. */
export const skipSecs = (dist, times) => Math.max(2.2, Math.abs(dist) / (times ? 11 : 6.5));
/** The house's own view: no turn, no zoom. */
export const LOOK_HOME = { yaw: 0, pitch: 0, zoom: 1, walked: 0 };
/** The limits and the feel. `turn`/`tip`: radians a pixel of drag turns and tips (the den's and the
    isle's); `touch`: a finger turns a little more; `drag`: pixels before a press is a drag, not a click
    (`dragTouch` for a finger); `notch`: zoom per notch of the wheel (the den's - and = keys); `zoom`: its
    range; `close`: the nearest the camera comes (metres from what it looks at); `ahead`: what it looks
    at, zoomed right in, metres ahead of you at `eye` height (a portrait's); `level`: its tilt then;
    `tilt`: the tilt's range (a little up, zoomed right in, to steeply down; zoomed out, never lower than
    `lowest`, looking down into the rooms over their walls); `pitch`: the most a drag tips it; `yawFar`:
    how far it turns zoomed out (round to the front still, the doll's house), `yawNear` zoomed in (along
    the walls either way, but never out of the open front, where there's nothing to see);
    `walkOff`: metres you walk before the house's view comes back, `ease` how fast (per second). */
export const LOOK = {
    turn: 0.006, tip: 0.004, touch: 1.3, drag: 5, dragTouch: 10, notch: 1.15,
    zoom: [0.1, 1.3], close: 1.1, ahead: 1.2, eye: 1.5, level: 0.12,
    tilt: [-0.3, 1.35], lowest: 0.3, pitch: 0.65, yawFar: 1.0, yawNear: 1.9, walkOff: 1.0, ease: 2.5,
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
/** How far in you've zoomed, 0 (the house's view, or out) to 1 (right in). */
export const closeness = (zoom) => clamp((1 - zoom) / (1 - LOOK.zoom[0]), 0, 1);
/** How far round it turns at this zoom: a little either way zoomed out, along the walls zoomed in. */
export const yawLimit = (zoom) => LOOK.yawFar + (LOOK.yawNear - LOOK.yawFar) * smooth(closeness(zoom) * 1.6);
/** A press moved `dx`, `dy` pixels: a drag (turning the camera), or still a click? */
export const isDrag = (dx, dy, touch = false) => Math.hypot(dx, dy) >= (touch ? LOOK.dragTouch : LOOK.drag);
/** Turned by a drag of `dx`, `dy` pixels (right turns it right; down looks down). */
export function lookTurn(L, dx, dy, touch = false) {
    const lim = yawLimit(L.zoom), yaw = clamp(L.yaw - dx * LOOK.turn * (touch ? LOOK.touch : 1), -lim, lim);
    return { ...L, yaw, pitch: clamp(L.pitch + dy * LOOK.tip, -LOOK.pitch, LOOK.pitch), walked: 0 };
}
/** Zoomed by `k` (under 1: in), kept within its range; turned back within what that zoom allows. */
export function lookZoom(L, k) {
    const zoom = clamp(L.zoom * k, LOOK.zoom[0], LOOK.zoom[1]), lim = yawLimit(zoom);
    return { ...L, zoom, yaw: clamp(L.yaw, -lim, lim), walked: 0 };
}
/** The wheel rolled `deltaY` (over 0: out; a mouse's notch is 100, a trackpad's strokes a few each, so
    it goes by how far it rolled, a notch at a time at most five at once). */
export const lookWheel = (L, deltaY) => lookZoom(L, LOOK.notch ** clamp(deltaY / 100, -5, 5));
/** A tick (`dt` seconds) in which you walked `moved` metres: stood still, your look's kept, however long;
    once you've walked on past LOOK.walkOff, it eases back to the house's own view. */
export function lookEase(L, dt, moved) {
    const walked = L.walked + Math.max(0, moved);
    if (walked < LOOK.walkOff)
        return { ...L, walked };
    const k = 1 - Math.exp(-LOOK.ease * dt), z = Math.log(L.zoom);
    const out = { yaw: L.yaw * (1 - k), pitch: L.pitch * (1 - k), zoom: Math.exp(z * (1 - k)), walked };
    return Math.abs(out.yaw) < 1e-3 && Math.abs(out.pitch) < 1e-3 && Math.abs(out.zoom - 1) < 1e-3 ? { ...LOOK_HOME, walked } : out;
}
/** Is it the house's own view (nothing turned or zoomed)? */
export const lookHome = (L) => !L.yaw && !L.pitch && L.zoom === 1;
/** Which way the keys walk you, the camera turned `yaw` (0: the house's view, up away from you): `mx`
    right, `mz` toward you, as on the screen; a world step (x, z), unit length. */
export function walkDir(mx, mz, yaw) {
    const n = Math.hypot(mx, mz);
    if (!n)
        return [0, 0];
    const c = Math.cos(yaw), s = Math.sin(yaw);
    return [(mx * c + mz * s) / n, (-mx * s + mz * c) / n];
}
/** A room's walls are full height along the back, and down the sides this far of the way to the front;
    low from there on, and along the front, so the camera looks in as at a doll's house (the shell's
    rooms: js/den/house.js). */
export const WALL_BACK = 0.45;
/** Full-height walls, unless a house says otherwise. */
const HIGH = 3.2;
/** How near the camera comes to a wall. */
const CAM_PAD = 0.3;
/** Where the camera is, for a view. */
export function viewAt(v) {
    const c = Math.cos(v.tilt);
    return { x: v.look.x + Math.sin(v.yaw) * c * v.dist, y: v.look.y + Math.sin(v.tilt) * v.dist, z: v.look.z + Math.cos(v.yaw) * c * v.dist };
}
/** Is (x, y, z) in a wall of `room` (a full-height one) or under the floor? */
function inWall(room, x, y, z, high) {
    if (y < 0.2)
        return true;
    if (!room || y >= high)
        return false;
    const zm = room.z0 + (room.z1 - room.z0) * WALL_BACK;
    return z < room.z0 + CAM_PAD || (z < zm && (x < room.x0 + CAM_PAD || x > room.x1 - CAM_PAD));
}
/** Your look over `base` (the house's view of you, or the scene's own), you at `you` in `room`: turned
    round you, zoomed in toward a spot ahead of you at a portrait's height, and drawn in short of any
    full-height wall of the room (`high` its walls' height) rather than through it. */
export function lookView(base, you, L, room = null, high = HIGH) {
    if (lookHome(L))
        return { look: { ...base.look }, dist: base.dist, tilt: base.tilt, yaw: base.yaw };
    const u = closeness(L.zoom), c = Math.cos(L.yaw), s = Math.sin(L.yaw);
    // What it looks at: the house's spot, turned round you; zooming in, a spot just ahead at eye height.
    const ox = base.look.x - you.x, oz = base.look.z - you.z, rx = ox * c + oz * s, rz = -ox * s + oz * c;
    const yaw = base.yaw + L.yaw, fx = -Math.sin(yaw) * LOOK.ahead, fz = -Math.cos(yaw) * LOOK.ahead;
    const look = { x: you.x + rx + (fx - rx) * u, y: base.look.y + (LOOK.eye - base.look.y) * u, z: you.z + rz + (fz - rz) * u };
    if (room && look.y < high) { // (zoomed in by a wall, it looks at the wall, not into it)
        const cx = clamp(look.x, room.x0 + CAM_PAD, room.x1 - CAM_PAD), cz = clamp(look.z, room.z0 + CAM_PAD, room.z1 - CAM_PAD);
        const k = smooth(u * 2);
        look.x += (cx - look.x) * k;
        look.z += (cz - look.z) * k;
    }
    const v = { look, dist: Math.max(LOOK.close, base.dist * L.zoom), tilt: clamp(base.tilt + (LOOK.level - base.tilt) * u + L.pitch, LOOK.tilt[0] + (LOOK.lowest - LOOK.tilt[0]) * (1 - u), LOOK.tilt[1]), yaw };
    // Out from what it looks at toward the camera: once clear of the walls, it stops short of the next one.
    const STEP = 0.05;
    let free = false;
    for (let i = 0, n = Math.ceil(v.dist / STEP); i <= n; i++) {
        const t = Math.min(v.dist, i * STEP), p = viewAt({ ...v, dist: t }), wall = inWall(room, p.x, p.y, p.z, high);
        if (!wall)
            free = true;
        else if (free) {
            v.dist = Math.max(0.05, t - STEP);
            break;
        }
    }
    return v;
}
/** `reach`: how near you are to it (metres, along the floor) for it to be what you're looking at;
    `angle`: how near the middle of the view (radians); `dwell`: how long you stand looking (seconds)
    before they say something; `near`: how near the host must be to say it. */
export const REMARK = { reach: 3.2, angle: 0.3, dwell: 1.0, near: 4.5 };
/** What you're looking at: the exhibit nearest the middle of the view (the camera at `cam` looking along
    `dir`, house-local), within REMARK.angle of it and REMARK.reach of you; or null. */
export function lookingAt(exhibits, you, cam, dir) {
    const dn = Math.hypot(dir.x, dir.y, dir.z) || 1;
    let best = null, bestA = REMARK.angle;
    for (const e of exhibits) {
        if (Math.hypot(e.x - you.x, e.z - you.z) > REMARK.reach)
            continue;
        const vx = e.x - cam.x, vy = e.y - cam.y, vz = e.z - cam.z, vn = Math.hypot(vx, vy, vz) || 1;
        const a = Math.acos(clamp((vx * dir.x + vy * dir.y + vz * dir.z) / (vn * dn), -1, 1));
        if (a < bestA) {
            best = e;
            bestA = a;
        }
    }
    return best;
}
export const GAZE_START = { id: null, t: 0, said: [] };
/** A tick (`dt`) of looking at `seen` (an exhibit's id, or null), `still` (not walking): the gaze on,
    and the line to say about it now, if it's time (`quiet`: nothing else is being said, the host's by
    you), it's not been said this visit, and the house has a line for it (`lineOf`). */
export function remark(G, seen, dt, still, quiet, lineOf) {
    const t = seen !== null && seen === G.id && still ? G.t + dt : 0;
    const gaze = { id: seen, t, said: G.said };
    if (seen === null || t < REMARK.dwell || !quiet || G.said.includes(seen))
        return { gaze, say: null };
    const line = lineOf(seen);
    if (!line || G.said.includes(line))
        return { gaze: { ...gaze, said: [...G.said, seen] }, say: null };
    return { gaze: { ...gaze, said: [...G.said, seen, line] }, say: line };
}
/** The backdrops portraits.js paints. `pinksea`: a pink sky over a violet, sparkling sea (Roobear's portrait's);
    `cafe`: a café wall under a striped awning (a monsieur's). */
export const BACKDROPS = ['bloodmoon', 'snow', 'beach', 'crypt', 'autumn', 'witch', 'sea', 'den', 'night', 'pinksea', 'cafe'];
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
