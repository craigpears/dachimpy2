/* Pirate Den: each ship's handling on the squares, and what fits where. TypeScript, compiled to
   js/ship-handling.js; tested in tests/ship-handling.test.ts. Knows nothing of where she's sailed: the
   frigate-and-sloop test sea (src/two-ships.ts, frigate-test.html) is the first to use it.

   The user (14 Nov, RACE.md §11): "you can choose either a [war frig] or a sloop, and that it unlocks
   different routes for you ... the frig being the I'm going to battle my way through kind of almost brute
   force option ... The sloop will have its nimble [ways] through." So the same helm (src/den-sail.ts: the
   pin, the pilot, your own moves, the turn's clock) sails any ship, handed her handling:
   - moves a turn: Battle Navigation's tokens, by YPPedia (src/ships.ts: the sloop 4, a war frigate 3);
   - her pace: the seconds a square takes (the sloop the den's SAIL.MOVE; a war frigate half as long again,
     heavier to drive: FRIGATE_PACE);
   - how wide she turns: a quarter circle `radius` squares round (a turn is `radius` squares ahead, then
     `radius` across, ending facing that way), half her length (the sloop 1, as Battle Navigation's turn;
     the frigate 2);
   - her size on the squares, from her hull against SAIL.CELL (4 m): her length rounded (her ends can
     overhang a square a little), her beam rounded up (her sides mustn't scrape the rocks). The sloop, 4.4 m
     by 2.3, takes one square; Primates Rule, 15 m by 4.6, four along and two across, so a one-square gap is
     too narrow for her;
   - her guns: shots a side a broadside (YPPedia: the sloop 1, a war frigate 2), their size, their reload.
   Everything she covers on every square of a move has to be open water, so a big ship needs room to turn. */
import { SAIL, Sea, Helm } from './den-sail.js';
import { SLOOP, WAR_FRIGATE, SLOOP_HULL } from './ships.js';
import { FRIGATE_HULL } from './den-frigate.js';
/** The four ways (den-sail.ts's): 0 out to sea (r + 1), 1 right (c + 1), 2 back in, 3 left. */
const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
const key = (c, r) => `${c},${r}`;
/** The numbers that aren't YPPedia's (RACE.md §11, "Racing in a frigate or a sloop"). */
export const HANDLING = {
    /** A war frigate's seconds a square, against the sloop's SAIL.MOVE. */
    FRIGATE_PACE: 1.5,
    /** Seconds a side's guns take to load again, by their size. */
    RELOAD: { small: 2, medium: 2.5, large: 3 },
};
/** A ship's handling, from her class and her hull: `pace` her seconds a square. */
export function handlingFor(ship, hull, pace = SAIL.MOVE) {
    const long = Math.max(1, Math.round(hull.len / SAIL.CELL)), wide = Math.max(1, Math.ceil(hull.beam / SAIL.CELL));
    return {
        name: ship.name, tokens: ship.tokens, pace, radius: Math.max(1, Math.ceil(long / 2)), long, wide,
        shots: ship.shotsPerSide, guns: ship.gunSize, reload: HANDLING.RELOAD[ship.gunSize],
    };
}
export const SLOOP_HANDLING = handlingFor(SLOOP, SLOOP_HULL);
export const FRIGATE_HANDLING = handlingFor(WAR_FRIGATE, FRIGATE_HULL, SAIL.MOVE * HANDLING.FRIGATE_PACE);
const span = (n) => Array.from({ length: n }, (_, i) => i - Math.floor(n / 2));
/** Her squares along her from her own (+ toward her bow), and across her (+ to starboard): her own square
    in the middle, or just forward and to port of it with an even count. */
export const alongs = (h) => span(h.long);
export const acrosses = (h) => span(h.wide);
/** The squares she covers at a pose. */
export function squares(h, p) {
    const s = (p.d + 1) % 4;
    return alongs(h).flatMap((a) => acrosses(h).map((x) => [p.c + DC[p.d] * a + DC[s] * x, p.r + DR[p.d] * a + DR[s] * x]));
}
/** A move's poses: each square she passes through and the way she faces there (forward, one; a turn,
    `radius` ahead, then `radius` across, facing the new way), and where she ends up. The sloop's are
    den-sail.ts's path exactly. */
export function shipPath(h, p, m) {
    if (m === 'F') {
        const to = { c: p.c + DC[p.d], r: p.r + DR[p.d], d: p.d };
        return { steps: [to], to };
    }
    const R = h.radius, d = (p.d + (m === 'L' ? 3 : 1)) % 4, steps = [];
    for (let k = 1; k <= R; k++)
        steps.push({ c: p.c + DC[p.d] * k, r: p.r + DR[p.d] * k, d: p.d });
    const a = steps[R - 1];
    for (let k = 1; k <= R; k++)
        steps.push({ c: a.c + DC[d] * k, r: a.r + DR[d] * k, d });
    return { steps, to: steps[steps.length - 1] };
}
/** Where she is partway (u, 0 to 1) through a move, for drawing (as den-sail.ts's poseAt, her turn a
    quarter circle `radius` round): her own square, across and out, and her heading in quarter turns. */
export function shipPose(h, p, m, u, bump = false) {
    const e = u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
    if (m === 'F') {
        const k = bump ? 0.22 * Math.sin(Math.PI * Math.min(1, Math.max(0, u))) : e;
        return { c: p.c + DC[p.d] * k, r: p.r + DR[p.d] * k, a: p.d };
    }
    const s = m === 'L' ? -1 : 1, a = p.d + s * e;
    if (bump)
        return { c: p.c, r: p.r, a };
    const R = h.radius, side = (p.d + (m === 'L' ? 3 : 1)) % 4, mc = p.c + DC[side] * R, mr = p.r + DR[side] * R;
    const x = -DC[side] * R, y = -DR[side] * R, th = (m === 'L' ? 1 : -1) * e * Math.PI / 2;
    return { c: mc + x * Math.cos(th) - y * Math.sin(th), r: mr + x * Math.sin(th) + y * Math.cos(th), a };
}
/** The middle of her squares, where she's drawn, from her own square and heading (Helm.now). */
export function drawnAt(h, at) {
    const mid = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length, al = mid(alongs(h)), ac = mid(acrosses(h));
    const t = at.a * Math.PI / 2, hc = Math.sin(t), hr = Math.cos(t), sc = Math.cos(t), sr = -Math.sin(t);
    return { c: at.c + hc * al + sc * ac, r: at.r + hr * al + sr * ac, a: at.a };
}
/** The sea as one ship sees it: a board of its own size and rocks, every square she covers having to be
    open, and `blocked` (another ship, say) in her way too. Its pilot (Sea.plot) works her way out by her
    own moves. With no winds, locks or whirlpools: those are the den's sea's, not yet sized for a ship. */
export class ShipSea extends Sea {
    ship;
    blocked;
    constructor(ship, cols, rows, rocks, blocked = () => false) {
        super(1, false, true);
        this.ship = ship;
        this.blocked = blocked;
        this.cols = cols;
        this.rows = rows;
        this.rocks = rocks; // (shared with the other ships' seas: a rock broken is gone for all)
    }
    open(c, r) { return super.open(c, r) && !this.blocked(c, r); }
    /** Every square she'd cover at this pose is open. */
    fits(p) { return squares(this.ship, p).every(([c, r]) => this.open(c, r)); }
    /** A move by her handling: through only if she fits on every square of it; blocked, a turn turns her
        where she is if she's room to, else she stays as she was. */
    move(p, m) {
        const { steps, to } = shipPath(this.ship, p, m);
        if (steps.every((q) => this.fits(q)))
            return { to, bump: false, ride: [] };
        const spun = { c: p.c, r: p.r, d: to.d };
        return { to: this.fits(spun) ? spun : { ...p }, bump: true, ride: [] };
    }
    /** Her pace: a square's, or a turn's `radius` of them. */
    moveSecs(_oars = false, _p, m) { return this.ship.pace * (m && m !== 'F' ? this.ship.radius : 1); }
}
/** The helm (src/den-sail.ts's, the den's own), sailing a ship by her handling: her moves a turn, and her
    wider turn drawn. */
export class ShipHelm extends Helm {
    constructor(sea, pose) { super(sea, pose); }
    next() { return (this.oars ? this.strokes : this.course()).slice(0, this.sea.ship.tokens); }
    put(m) { return this.mine.length < this.sea.ship.tokens && super.put(m); }
    now() {
        const cur = this.cur;
        if (!cur || cur.m === 'W')
            return super.now();
        return shipPose(this.sea.ship, cur.from, cur.m, Math.min(1, this.t / cur.secs), cur.bump);
    }
    /** The squares she covers, where she is and (under way) where the move she's on takes her. */
    covers() {
        const out = new Set(squares(this.sea.ship, this.pose).map(([c, r]) => key(c, r)));
        if (this.cur)
            for (const [c, r] of squares(this.sea.ship, this.cur.to))
                out.add(key(c, r));
        return out;
    }
}
/** A broadside out of that side from where she is (Helm.now: mid-move, the square and heading she's
    nearest): `shots` of them, from her middle squares along her, each straight out past her side up to
    `range` squares, stopping at the first square `stops` says is something (a rock, a boom, a ship). */
export function broadside(h, at, side, stops, range = SAIL.RANGE) {
    const d = ((Math.round(at.a) % 4) + 4) % 4, s = (d + 1) % 4, out = side === 'R' ? s : (d + 3) % 4;
    const c0 = Math.round(at.c), r0 = Math.round(at.r), al = alongs(h), ac = acrosses(h), edge = side === 'R' ? ac[ac.length - 1] : ac[0];
    const first = Math.max(0, Math.floor((al.length - h.shots) / 2)), guns = al.slice(first, first + h.shots);
    return guns.map((g) => {
        const from = [c0 + DC[d] * g + DC[s] * edge, r0 + DR[d] * g + DR[s] * edge], cells = [];
        for (let k = 1; k <= range; k++) {
            const c = from[0] + DC[out] * k, r = from[1] + DR[out] * k, what = stops(c, r);
            cells.push([c, r]);
            if (what !== null)
                return { from, cells, hit: [c, r], what };
        }
        return { from, cells, hit: null, what: null };
    });
}
/** Her guns, a side at a time: fired, a side loads again for her reload's seconds. */
export class Guns {
    reload;
    wait = { L: 0, R: 0 };
    constructor(reload) {
        this.reload = reload;
    }
    ready(side) { return this.wait[side] <= 1e-9; }
    /** Fire that side, if it's loaded: whether it fired. */
    fire(side) { if (!this.ready(side))
        return false; this.wait[side] = this.reload; return true; }
    tick(dt) { for (const s of ['L', 'R'])
        this.wait[s] = Math.max(0, this.wait[s] - dt); }
}
