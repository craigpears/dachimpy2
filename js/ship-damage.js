export const DAMAGE = {
    /** A hit's damage, by its gun's size, in small shots' worth (YPPedia: 30 small = 20 medium = 15 large). */
    SHOT: { small: 1, medium: 1.5, large: 2 },
    /** Full damage, in small shots: a war frigate's YPPedia's (30); the sloop's not checked yet (6). */
    FULL: { 'War frigate': 30, Sloop: 6 },
    /** Damage a second her carpenters take off, by the square root of her carpentry stations. */
    CARP: 0.035,
    /** Water a second her bilgers pump out (of a full bilge, 1), by the square root of her bilge stations. */
    PUMP: 0.012,
    /** Water a second coming in at full damage (in proportion below it). */
    LEAK: 0.12,
    /** How much a full bilge slows her moves (1 + DRAG x water). */
    DRAG: 0.6,
    /** Knocked out at full damage, she's back in action under this share of it. */
    RECOVER: 0.6,
};
let ids = 0;
/** One ship's damage and her crew working on it. */
export class Damage {
    ship;
    holes = [];
    /** Her bilge, 0 (dry) to 1 (full). */
    water = 0;
    /** Knocked out: dead in the water. */
    out = false;
    full;
    carp;
    pump;
    constructor(ship) {
        this.ship = ship;
        this.full = DAMAGE.FULL[ship.name] ?? 10;
        this.carp = DAMAGE.CARP * Math.sqrt(ship.stations.carpentry);
        this.pump = DAMAGE.PUMP * Math.sqrt(ship.stations.bilge);
    }
    /** Her damage, in small shots' worth. */
    total() { return this.holes.reduce((t, h) => t + h.left, 0); }
    /** Her damage as a share of full. */
    share() { return Math.min(1, this.total() / this.full); }
    /** Struck by a shot of that size, there: the hole it makes (knocking her out if it's her last). */
    hit(gun, along, side) {
        const hole = { id: ++ids, along: Math.max(-0.5, Math.min(0.5, along)), side, gun, left: DAMAGE.SHOT[gun] };
        this.holes.push(hole);
        const out = !this.out && this.total() >= this.full - 1e-9;
        if (out)
            this.out = true;
        return { hole, out };
    }
    /** Her crew at work a while: her carpenters on the oldest hole, her bilgers on the water, the water coming in. */
    tick(dt) {
        const out = [];
        let work = this.carp * dt;
        while (work > 0 && this.holes.length) {
            const h = this.holes[0], d = Math.min(work, h.left);
            h.left -= d;
            work -= d;
            if (h.left <= 1e-9) {
                this.holes.shift();
                out.push({ kind: 'patched', hole: h });
            }
        }
        this.water = Math.max(0, Math.min(1, this.water + (DAMAGE.LEAK * this.share() - this.pump) * dt));
        if (this.out && this.share() <= DAMAGE.RECOVER) {
            this.out = false;
            out.push({ kind: 'back' });
        }
        return out;
    }
    /** How much longer her moves take for the water in her. */
    drag() { return 1 + DAMAGE.DRAG * this.water; }
}
/** Where on her a shot struck: `along` her (stern -0.5 to bow 0.5) from her own square and heading, the square it
    struck and her length in squares; the side it came in on from where it was fired. Her squares lie along her
    from her own (src/ship-handling.ts, alongs). */
export function struck(own, long, at, from) {
    const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0], hc = DC[own.d], hr = DR[own.d], sc = DC[(own.d + 1) % 4], sr = DR[(own.d + 1) % 4];
    const mid = long % 2 ? 0 : -0.5; // (her middle along her from her own square: alongs' mean)
    const a = (at[0] - own.c) * hc + (at[1] - own.r) * hr - mid;
    const s = (from[0] - at[0]) * sc + (from[1] - at[1]) * sr;
    return { along: long > 1 ? a / long : 0, side: s >= 0 ? 'R' : 'L' };
}
