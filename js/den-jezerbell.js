// ---------- the house ----------
/** One big room, the camera looking in from the front (its front wall cut low, a doll's house), papered a dark
    plum, as gothic as her stump and altar. */
export const PLAN = {
    rooms: [{ id: 'hall', name: 'Jezerbell\'s hall', x0: -6.2, x1: 6.2, z0: -3.6, z1: 3.4, paper: '#3b2740' }],
    doors: [],
    out: { x: 0, z: 2.8, r: 0.9 },
};
/** Where you come in (just inside the front door), and where she meets you. */
export const ARRIVE = { you: { x: 0, z: 2.4 }, her: { x: 1.2, z: 1.5 } };
export const WALLS = { high: 3.8, low: 0.45 };
const ROOM = PLAN.rooms[0];
export const WALL_T = 0.2;
/** The back wall's face (z), and the left and right walls' (x). */
export const BACK = ROOM.z0 + WALL_T;
export const LEFT = ROOM.x0 + WALL_T, RIGHT = ROOM.x1 - WALL_T;
// ---------- her furniture ----------
/* As in the screenshot: the two summoning pieces at the back, the werewolf stump on the right of the vampire altar;
   the bat-winged throne; the bat gargoyles crouched on chests down the right; two doubloon exchanges at the front on
   the right; the gold armour, the blue-and-white vase, the potted palm; the shark statue, the sea turtle and the seal
   down the left by the stairs (no stairs here: one room). */
/** Her summoning stump, for werewolves: Space by it uses a charm. */
export const STUMP = { x: 2.6, z: -2.35, near: 1.5 };
/** Her altar, for vampires (for show: "Not tonight. Tonight's a wolf night."). */
export const ALTAR = { x: -0.6, z: -2.55, near: 1.3 };
export const THRONE = { x: -3.4, z: -0.6, yaw: 0.9 };
export const VASE = { x: -5.4, z: 1.9 };
export const PALM = { x: 1.9, z: 2.55 };
export const ARMOUR = { x: -5.4, z: -2.8 };
/** The gargoyles' chests, down the right wall, facing in. */
export const CHESTS = [{ x: 5.5, z: -1.4 }, { x: 5.5, z: 0.2 }];
/** The doubloon exchanges, at the front on the right. */
export const EXCHANGES = [{ x: 4.6, z: 2.4 }, { x: 3.3, z: 2.6 }];
export const FURNISH = [
    { kind: 'rug', x: 0.2, z: 0.2, col: '#7a1f2e' },
    { kind: 'summoningStump', x: STUMP.x, z: STUMP.z },
    { kind: 'vampireAltar', x: ALTAR.x, z: ALTAR.z },
    { kind: 'batThrone', x: THRONE.x, z: THRONE.z, yaw: THRONE.yaw },
    { kind: 'gargoyleChest', x: CHESTS[0].x, z: CHESTS[0].z, yaw: -Math.PI / 2 },
    { kind: 'gargoyleChest', x: CHESTS[1].x, z: CHESTS[1].z, yaw: -Math.PI / 2, col: '#d8b64a' },
    { kind: 'doubloonExchange', x: EXCHANGES[0].x, z: EXCHANGES[0].z, yaw: -0.4 },
    { kind: 'doubloonExchange', x: EXCHANGES[1].x, z: EXCHANGES[1].z, yaw: 0.2 },
    { kind: 'armour', x: ARMOUR.x, z: ARMOUR.z, yaw: 0.6, extra: { gold: true, plume: '#c0262e' } },
    { kind: 'vase', x: VASE.x, z: VASE.z },
    { kind: 'pottedPalm', x: PALM.x, z: PALM.z },
    { kind: 'statue', x: -5.4, z: 0.1, yaw: Math.PI / 2, extra: { animal: 'shark' } },
    { kind: 'statue', x: -3.9, z: 2.55, yaw: 0.4, extra: { animal: 'turtle' } },
    { kind: 'statue', x: -2.9, z: 2.75, yaw: -0.3, extra: { animal: 'seal' } },
    { kind: 'candelabra', x: 0.95, z: -2.75 },
    { kind: 'candelabra', x: -2.1, z: -2.75 },
];
export const PORTRAITS = [
    { id: 'twilight', title: 'Twilight Stroll', backdrop: 'night', x: -3.9, y: 1.95, w: 1.0, h: 1.25, sitter: { who: 'pirate', name: 'Jezerbell' }, close: true },
    { id: 'love', title: 'Eternal Love!', backdrop: 'bloodmoon', x: -2.05, y: 2.05, w: 1.05, h: 1.3, sitter: { who: 'pirate', name: 'Jezerbell', dress: { fam: 'octopus', famCol: 'pink' } }, close: true },
    { id: 'three', title: 'Just the three of us', backdrop: 'sea', x: 4.55, y: 2.0, w: 1.05, h: 1.3, sitter: { who: 'pirate', name: 'Jezerbell', dress: { fam: 'octopus', famCol: 'violet' } }, close: true },
];
/** Her route charts, on the wall over the stump and altar (the screenshot's, by their islands), each a little
    board with its words. */
export const CHARTS = [
    { text: 'Gauntlet Island to Barbary Island', x: 1.05, y: 3.15 },
    { text: 'Blackthorpe Island to Kakraphoon Island', x: 1.05, y: 2.7 },
    { text: 'Terjit Island to Tichka Plateau', x: 3.0, y: 3.15 },
];
/** Her sign, over the stump and altar: whose house it is. */
export const SIGN = { text: 'Jezerbell', x: -0.6, w: 1.7, h: 0.4, y: 3.25 };
const oct = (id, col, at, peek, sit, near = 1.25) => ({ id, col, at, near, peek: { x: peek[0], y: peek[1], z: peek[2], yaw: peek[3] }, sit: { x: sit[0], y: sit[1], z: sit[2], yaw: sit[3] } });
export const OCTOPUSES = [
    oct('vase', 'pink', { x: VASE.x + 0.6, z: VASE.z }, [VASE.x, 0.62, VASE.z, 0.6], [VASE.x, 0.92, VASE.z, 0.6]),
    oct('throne', 'violet', { x: THRONE.x + 0.9, z: THRONE.z + 0.7 }, [THRONE.x + 0.2, 0.08, THRONE.z + 0.25, THRONE.yaw], [THRONE.x + 0.05, 0.52, THRONE.z + 0.05, THRONE.yaw]),
    oct('frame', 'red', { x: -2.05, z: BACK + 1.1 }, [-1.45, 2.82, BACK + 0.06, 0], [-2.05, 2.86, BACK + 0.16, 0]),
    oct('armour', 'lemon', { x: ARMOUR.x + 0.8, z: ARMOUR.z + 0.7 }, [ARMOUR.x + 0.12, 1.05, ARMOUR.z - 0.25, 0.6], [ARMOUR.x, 2.12, ARMOUR.z, 0.6]),
    oct('palm', 'lime', { x: PALM.x - 0.7, z: PALM.z - 0.5 }, [PALM.x + 0.05, 0.95, PALM.z - 0.13, 2.6], [PALM.x, 1.75, PALM.z, 2.6]),
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
    { id: 'hall', at: { x: 0.2, z: 0.6 }, near: 1.7, her: { x: 1.3, z: -0.3 } },
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
/** Close enough to her stump (or altar) for Space? */
export const atStump = (you) => Math.hypot(you.x - STUMP.x, you.z - STUMP.z) < STUMP.near;
export const atAltar = (you) => Math.hypot(you.x - ALTAR.x, you.z - ALTAR.z) < ALTAR.near;
export const PACK = [
    { id: 'huff', name: 'Huffing Hector', fur: '#7a6a5a', pace: { THINK: 1.6, KEY: 0.34, DROP: 0.6 } },
    { id: 'puff', name: 'Puffing Prudence', fur: '#9a9086', pace: { THINK: 1.5, KEY: 0.32, DROP: 0.55 } },
    { id: 'teeth', name: 'Big-Teeth Bartholomew', fur: '#4a3a30', pace: { THINK: 1.35, KEY: 0.3, DROP: 0.5 } },
    { id: 'cried', name: 'Cried-Wolf Clementine', fur: '#2e2a2c', pace: { THINK: 1.2, KEY: 0.28, DROP: 0.45 } },
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
        const i = this.standing.findIndex((s, k) => s && k !== this.yours);
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
