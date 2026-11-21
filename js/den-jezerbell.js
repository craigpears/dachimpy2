// ---------- the house ----------
/** One big room, the camera looking in from the front (its front wall cut low, a doll's house), papered a dark
    plum, as gothic as her stump. As big as what happens in it (the user, 21 Nov: "the house is a bit
    small for how big of a concept there is in it"): a hunt round it, and a fray in it. */
export const PLAN = {
    rooms: [{ id: 'hall', name: 'Jezerbell\'s hall', x0: -8.4, x1: 8.4, z0: -4.9, z1: 4.6, paper: '#3b2740' }],
    doors: [],
    out: { x: 0, z: 4.0, r: 0.9 },
};
/** Where you come in (just inside the front door), and where she meets you. */
export const ARRIVE = { you: { x: 0, z: 3.6 }, her: { x: 1.4, z: 2.6 } };
export const WALLS = { high: 3.8, low: 0.45 };
const ROOM = PLAN.rooms[0];
export const WALL_T = 0.2;
/** The back wall's face (z), and the left and right walls' (x). */
export const BACK = ROOM.z0 + WALL_T;
export const LEFT = ROOM.x0 + WALL_T, RIGHT = ROOM.x1 - WALL_T;
// ---------- her furniture ----------
/* As in the screenshot: the werewolf stump in the middle at the back (her vampire altar left out: "I don't know that I
   like two things in the same house, like the werewolf and the vampire altar", the user, 21 Nov);
   the bat-winged throne; the bat gargoyles crouched on chests down the right; two doubloon exchanges at the front on
   the right; the gold armour, the blue-and-white vase, the potted palm; the shark statue, the sea turtle and the seal
   down the left by the stairs (no stairs here: one room). */
/** Her summoning stump, for werewolves: Space by it uses a charm. */
export const STUMP = { x: 0.6, z: -3.4, near: 1.5 };
export const THRONE = { x: -4.6, z: -1.2, yaw: 0.9 };
export const VASE = { x: -7.4, z: 2.7 };
export const PALM = { x: 2.6, z: 3.5 };
export const ARMOUR = { x: -7.4, z: -3.9 };
/** The gargoyles' chests, down the right wall, facing in. */
export const CHESTS = [{ x: 7.6, z: -2.0 }, { x: 7.6, z: 0.4 }];
/** The doubloon exchanges, at the front on the right. */
export const EXCHANGES = [{ x: 6.4, z: 3.4 }, { x: 4.7, z: 3.7 }];
export const FURNISH = [
    { kind: 'rug', x: -1.6, z: 0.4, col: '#7a1f2e' },
    { kind: 'rug', x: 2.6, z: 0.4, col: '#5a1f4e' },
    { kind: 'summoningStump', x: STUMP.x, z: STUMP.z },
    { kind: 'batThrone', x: THRONE.x, z: THRONE.z, yaw: THRONE.yaw },
    { kind: 'gargoyleChest', x: CHESTS[0].x, z: CHESTS[0].z, yaw: -Math.PI / 2 },
    { kind: 'gargoyleChest', x: CHESTS[1].x, z: CHESTS[1].z, yaw: -Math.PI / 2, col: '#d8b64a' },
    { kind: 'doubloonExchange', x: EXCHANGES[0].x, z: EXCHANGES[0].z, yaw: -0.4 },
    { kind: 'doubloonExchange', x: EXCHANGES[1].x, z: EXCHANGES[1].z, yaw: 0.2 },
    { kind: 'armour', x: ARMOUR.x, z: ARMOUR.z, yaw: 0.6, extra: { gold: true, plume: '#c0262e' } },
    { kind: 'vase', x: VASE.x, z: VASE.z },
    { kind: 'pottedPalm', x: PALM.x, z: PALM.z },
    { kind: 'statue', x: -7.5, z: 0.3, yaw: Math.PI / 2, extra: { animal: 'shark' } },
    { kind: 'statue', x: -5.4, z: 3.6, yaw: 0.4, extra: { animal: 'turtle' } },
    { kind: 'statue', x: -4.0, z: 3.85, yaw: -0.3, extra: { animal: 'seal' } },
    { kind: 'candelabra', x: -1.5, z: -4.1 },
    { kind: 'candelabra', x: 2.7, z: -4.1 },
    { kind: 'candelabra', x: 6.0, z: -4.1 },
    { kind: 'gargoyleChest', x: 4.6, z: -4.2, col: '#8a2a3a' },
];
export const PORTRAITS = [
    { id: 'twilight', title: 'Twilight Stroll', backdrop: 'night', x: -5.6, y: 1.95, w: 1.0, h: 1.25, sitter: { who: 'pirate', name: 'Jezerbell' }, close: true },
    { id: 'love', title: 'Eternal Love!', backdrop: 'bloodmoon', x: -3.3, y: 2.05, w: 1.05, h: 1.3, sitter: { who: 'pirate', name: 'Jezerbell', dress: { fam: 'octopus', famCol: 'pink' } }, close: true },
    { id: 'three', title: 'Just the three of us', backdrop: 'sea', x: 6.4, y: 2.0, w: 1.05, h: 1.3, sitter: { who: 'pirate', name: 'Jezerbell', dress: { fam: 'octopus', famCol: 'violet' } }, close: true },
];
/* (No route labels on her walls: in her real house they're on presents, and here, without them, "it's just a bit
   weird", the user, 21 Nov.) */
/** Her sign, over the stump: whose house it is. */
export const SIGN = { text: 'Jezerbell', x: STUMP.x, w: 1.7, h: 0.4, y: 3.25 };
const oct = (id, col, at, peek, sit, near = 1.25) => ({ id, col, at, near, peek: { x: peek[0], y: peek[1], z: peek[2], yaw: peek[3] }, sit: { x: sit[0], y: sit[1], z: sit[2], yaw: sit[3] } });
// (each peeking out in front of where it hides, tentacles toward you, never sunk into it: the user, 21 Nov, "making
// sure the tentacles actually appear up front. Like one sinking into the chair")
export const OCTOPUSES = [
    oct('vase', 'pink', { x: VASE.x + 0.6, z: VASE.z }, [VASE.x, 0.62, VASE.z, 0.6], [VASE.x, 0.92, VASE.z, 0.6]),
    oct('throne', 'violet', { x: THRONE.x + 0.9, z: THRONE.z + 0.7 }, [THRONE.x + Math.sin(THRONE.yaw) * 0.62, 0.04, THRONE.z + Math.cos(THRONE.yaw) * 0.62, THRONE.yaw], [THRONE.x + 0.05, 0.52, THRONE.z + 0.05, THRONE.yaw]),
    oct('frame', 'red', { x: -3.3, z: BACK + 1.1 }, [-2.68, 2.62, BACK + 0.16, -0.3], [-3.3, 2.86, BACK + 0.16, 0]),
    oct('armour', 'lemon', { x: ARMOUR.x + 0.8, z: ARMOUR.z + 0.7 }, [ARMOUR.x + 0.3, 1.05, ARMOUR.z - 0.05, 0.9], [ARMOUR.x, 2.12, ARMOUR.z, 0.6]),
    oct('palm', 'lime', { x: PALM.x - 0.7, z: PALM.z - 0.5 }, [PALM.x + 0.11, 0.95, PALM.z - 0.02, 0.4], [PALM.x, 1.75, PALM.z, 0.3]),
    oct('chest', 'aqua', { x: CHESTS[1].x - 0.95, z: CHESTS[1].z }, [CHESTS[1].x + 0.3, 0.45, CHESTS[1].z + 0.2, -Math.PI / 2], [CHESTS[1].x - 0.25, 0.6, CHESTS[1].z + 0.5, -Math.PI / 2]),
    oct('exchange', 'orange', { x: EXCHANGES[0].x - 0.3, z: EXCHANGES[0].z - 0.85 }, [EXCHANGES[0].x + 0.38, 0.1, EXCHANGES[0].z - 0.2, -0.4], [EXCHANGES[0].x, 1.42, EXCHANGES[0].z, -0.4]),
];
/** The one the werewolves took. Back at her side once the pack's beaten. */
export const MISSING = { col: 'black' };
/** The hidden octopus you're close enough to find (the nearest not found yet), or null. */
export function octopusAt(you, found) {
    let best = null, bd = Infinity;
    for (const o of OCTOPUSES) {
        if (found.has(o.id))
            continue;
        const d = Math.hypot(you.x - o.at.x, you.z - o.at.z);
        if (d < o.near && d < bd) {
            best = o;
            bd = d;
        }
    }
    return best;
}
/** How many of hers there are in all (the missing one too): what the counter counts to. */
export const ALL = OCTOPUSES.length + 1;
export const TOUR = [
    { id: 'hall', at: { x: 0.4, z: 1.2 }, near: 2.0, her: { x: 1.6, z: 0.2 } },
    { id: 'stump', at: { x: STUMP.x - 0.4, z: STUMP.z + 1.3 }, near: 1.2, her: { x: STUMP.x + 1.2, z: STUMP.z + 0.9 } },
];
/** The stop to say next: the furthest from `from` on that you're at, or -1. */
export function stopAt(from, x, z) {
    for (let i = TOUR.length - 1; i >= Math.max(0, from); i--) {
        const s = TOUR[i];
        if (Math.hypot(x - s.at.x, z - s.at.z) < s.near)
            return i;
    }
    return -1;
}
/** Close enough to her stump for Space? */
export const atStump = (you) => Math.hypot(you.x - STUMP.x, you.z - STUMP.z) < STUMP.near;
export const PACK = [
    { id: 'huff', name: 'Huffing Hector', fur: '#7a6a5a', think: 2.6 },
    { id: 'puff', name: 'Puffing Prudence', fur: '#9a9086', think: 2.3 },
    { id: 'teeth', name: 'Big-Teeth Bartholomew', fur: '#4a3a30', think: 2.0 },
    { id: 'cried', name: 'Cried-Wolf Clementine', fur: '#2e2a2c', think: 1.7 },
];
/** How the fray goes, in seconds: Jezerbell beats a wolf of her own first `HER_FIRST` in, then one every
    `HER_EVERY` (never yours); once you're knocked out she fights on alone and wins if no more than `HER_ALONE` are
    left standing. */
export const FRAY = { HER_FIRST: 40, HER_EVERY: 45, HER_ALONE: 2 };
/* The fray: who's standing, whom you're dueling, and her own wolves. Pure (the duel itself is the page's, a real
   Swordfight Duel; it tells the fray who won with `duelOver`). Time goes by on `tick`. */
export class Fray {
    pack;
    /** Who's standing, by their place in PACK. */
    standing;
    /** The wolf you're dueling (its place in PACK), or -1 (you're out, or it's over). */
    yours = -1;
    youOut = false;
    over = false;
    won = false;
    t = 0;
    herNext = FRAY.HER_FIRST;
    constructor(pack = PACK) {
        this.pack = pack;
        this.standing = pack.map(() => true);
    }
    /** How many wolves are still standing. */
    get left() { return this.standing.filter(Boolean).length; }
    /** The wolf she's fighting (her own: the first standing that isn't yours), or -1. */
    hers() {
        if (this.over)
            return -1;
        return this.standing.findIndex((s, k) => s && k !== this.yours);
    }
    /** It starts: the first wolf turns on you. */
    start() {
        this.yours = this.standing.indexOf(true);
        return [{ what: 'duel', wolf: this.yours }];
    }
    /** Your duel's over: `youWon`, you knocked your wolf out; else it knocked you out. */
    duelOver(youWon) {
        if (this.over || this.yours < 0)
            return [];
        const out = [];
        if (youWon) {
            this.standing[this.yours] = false;
            out.push({ what: 'down', wolf: this.yours, by: 'you' });
            this.yours = this.standing.indexOf(true);
            if (this.yours >= 0)
                out.push({ what: 'duel', wolf: this.yours });
            else
                out.push(...this.end(true));
        }
        else {
            this.yours = -1;
            this.youOut = true;
            out.push({ what: 'out' });
            // (on her own now: she sees off a few, but not a whole pack)
            const won = this.left <= FRAY.HER_ALONE;
            if (won)
                this.standing.forEach((s, i) => { if (s) {
                    this.standing[i] = false;
                    out.push({ what: 'down', wolf: i, by: 'her' });
                } });
            out.push(...this.end(won));
        }
        return out;
    }
    /** Time goes by: now and then she beats one of her own (one you're not dueling). */
    tick(dt) {
        if (this.over || this.yours < 0)
            return [];
        this.t += dt;
        if (this.t < this.herNext)
            return [];
        this.herNext += FRAY.HER_EVERY;
        const i = this.hers();
        if (i < 0)
            return [];
        this.standing[i] = false;
        return [{ what: 'down', wolf: i, by: 'her' }];
    }
    end(won) {
        this.over = true;
        this.won = won;
        this.yours = -1;
        return [{ what: 'over', won }];
    }
}
