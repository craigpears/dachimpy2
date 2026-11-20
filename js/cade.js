/* The tabletop blockade, the cade: Puzzle Pirates' blockade, faithfully (TABLETOP-BLOCKADE.md §1). It knows nothing of
   the den, nor of the den's own 3D blockade (src/blockade.ts), and shares nothing with it. Ported from the user's own
   BlockadeSim (github.com/craigpears/BlockadeSim, its CollisionMechanics, Scoring and ShipStats), checked against
   YPPedia's Sea battle, Blockade, Collision mechanics, Influence and Ramming pages; its unit tests are the baseline of
   tests/cade.test.ts. Randomness is handed in, as every rule in src/ is.

   - The board: squares in rows, row 0 at the top. Its sides act as rocks. A tall rock stops shots, a small one doesn't.
     A wind pushes a ship a square its way; a whirlpool, 2 by 2, carries her clockwise to its opposite corner and turns
     her 90° clockwise. Buoys are worth 1, 2 or 3. The safe zone at each end: no shooting from it, no damage in it.
   - A turn is four slots. In each, every ship plays a move (forward, left, right, or none), then winds and whirlpools
     act once on the ships sitting on them, then the guns fire. All at once.
   - Moving: every moving ship claims the square ahead of her; then every turning ship that wasn't stopped claims the
     square to her side; then every ship that tried to turn faces her new way, stopped or not. A wind moves her as a
     forward move does, a whirlpool as a turn does. Collisions by YPPedia's claim rules: see `step`.
   - Guns: each side's shots fly out up to three squares and all hit the first ship in the way.
   - Influence: a ship holds the buoys within half her influence diameter; a buoy held by one side alone scores its
     points for that side at the end of each turn; held by both, it's contested and scores nothing. */
export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];
const cw = (d, n = 1) => (((d + n) % 4) + 4) % 4;
export const tileAt = (b, x, y) => x < 0 || y < 0 || x >= b.w || y >= b.h ? null : b.tiles[y * b.w + x];
/* ---------- Boards from text, and from the user's BlockadeSim ---------- */
/** One character a square: `.` open, `#` tall rock, `o` small rock, `^ > v <` a wind blowing that way, whirlpool
 *  corners `q` top left, `p` top right, `d` bottom right, `b` bottom left (as the letters sit), `1 2 3` a buoy,
 *  `~` safe zone. For hand-made boards: a tutorial's two buoys and one obvious hotspot. */
export function boardFromText(rows, name) {
    const h = rows.length, w = Math.max(...rows.map((r) => r.length));
    const tiles = [];
    const WIND = { '^': 0, '>': 1, v: 2, '<': 3 };
    const WHIRL = { q: 0, p: 1, d: 2, b: 3 };
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
            const c = rows[y][x] ?? '.';
            const t = {};
            if (c === '#')
                t.rock = 'tall';
            else if (c === 'o')
                t.rock = 'small';
            else if (c in WIND)
                t.wind = WIND[c];
            else if (c in WHIRL)
                t.whirl = WHIRL[c];
            else if (c === '1' || c === '2' || c === '3')
                t.buoy = Number(c);
            else if (c === '~')
                t.safe = true;
            else if (c !== '.')
                throw new Error(`No such square "${c}" at ${x},${y}`);
            tiles.push(t);
        }
    return { w, h, tiles, name };
}
/** The board as text again (`boardFromText`'s characters). */
export function boardToText(b) {
    const out = [];
    for (let y = 0; y < b.h; y++) {
        let r = '';
        for (let x = 0; x < b.w; x++) {
            const t = b.tiles[y * b.w + x];
            r += t.rock === 'tall' ? '#' : t.rock === 'small' ? 'o' : t.wind !== undefined ? '^>v<'[t.wind]
                : t.whirl !== undefined ? 'qpdb'[t.whirl] : t.buoy ? String(t.buoy) : t.safe ? '~' : '.';
        }
        out.push(r);
    }
    return out;
}
/** A square of the user's BlockadeSim (its Tile.as): 0 open, 1 tall rock, 2 to 5 winds north, east, south, west,
 *  6 to 9 whirlpool top left, top right, bottom left, bottom right, 10 to 12 buoys, 13 small rock, 14 safe zone. */
export function craigTile(n) {
    if (n === 1)
        return { rock: 'tall' };
    if (n === 13)
        return { rock: 'small' };
    if (n >= 2 && n <= 5)
        return { wind: (n - 2) };
    if (n >= 6 && n <= 9)
        return { whirl: [0, 1, 3, 2][n - 6] };
    if (n >= 10 && n <= 12)
        return { buoy: (n - 9) };
    if (n === 14)
        return { safe: true };
    return {};
}
/** A board from the user's BlockadeSim's MapList, a grid of its numbers. `raw` keeps it as the sim had it (on its
 *  side, 38 by 22 with a rock border, its safe zones at the left and right): its unit tests' squares. Otherwise the
 *  border's taken off and it's turned a quarter clockwise into the game's own shape, 20 wide and 36 long, the safe
 *  zones at the top and bottom (a turn, not a flip, so the whirlpools still turn clockwise). */
export function boardFromCraig(grid, name, raw = false) {
    if (raw) {
        const h = grid.length, w = grid[0].length;
        const tiles = [];
        for (let y = 0; y < h; y++)
            for (let x = 0; x < w; x++)
                tiles.push(craigTile(grid[y][x]));
        return { w, h, tiles, name };
    }
    const inner = grid.slice(1, -1).map((r) => r.slice(1, -1));
    const ih = inner.length, iw = inner[0].length; // the sim's: 20 rows of 36
    const w = ih, h = iw, tiles = new Array(w * h);
    for (let sy = 0; sy < ih; sy++)
        for (let sx = 0; sx < iw; sx++) {
            const t = craigTile(inner[sy][sx]);
            if (t.wind !== undefined)
                t.wind = cw(t.wind);
            if (t.whirl !== undefined)
                t.whirl = cw(t.whirl);
            tiles[sx * w + (ih - 1 - sy)] = t; // turned a quarter clockwise: x = rows-1-y, y = x
        }
    return { w, h, tiles, name };
}
const k = (id, name, cls, budget, influence, moves, guns, shot, sinks, ram) => ({ id, name, cls, budget, influence, moves, guns, shot, sinks, ram, rock: sinks / 20 });
/** Every ship, YPPedia's Blockade, Ramming and Sea battle tables (TABLETOP-BLOCKADE.md §1). */
export const KINDS = Object.fromEntries([
    k('sloop', 'Sloop', 0, 5, 1, 4, 1, 1, 10, 0.5),
    k('cutter', 'Cutter', 0, 7, 2, 4, 1, 1, 12, 0.5),
    k('dhow', 'Dhow', 0, 7, 2, 4, 1, 1.5, 12, 0.5),
    k('fanchuan', 'Fanchuan', 0, 7, 2, 3, 1, 2, 13.125, 0.5),
    k('longship', 'Longship', 1, 10, 2, 4, 2, 1, 15, 0.5),
    k('baghlah', 'Baghlah', 1, 15, 4, 3, 2, 1.5, 20, 1),
    k('merchantBrig', 'Merchant brig', 1, 15, 4, 3, 1, 1.5, 20, 1),
    k('junk', 'Junk', 1, 15, 4, 3, 1, 2, 25, 1.5),
    k('warBrig', 'War brig', 1, 25, 6, 3, 2, 1.5, 25, 2),
    k('merchantGalleon', 'Merchant galleon', 2, 20, 6, 3, 1, 2, 30, 2.5),
    k('xebec', 'Xebec', 2, 30, 6, 3, 2, 1.5, 35, 2.5),
    k('warGalleon', 'War galleon', 2, 30, 6, 3, 2, 2, 25, 2.5),
    k('warFrigate', 'War frigate', 2, 40, 8, 3, 2, 2, 50, 3),
    k('grandFrigate', 'Grand frigate', 3, 60, 10, 3, 2, 2, 60, 4),
].map((x) => [x.id, x]));
const at = (ships, x, y) => ships.find((s) => !s.sunk && s.x === x && s.y === y);
/** Can't be sailed into: off the board, a rock, or the safe zone for a ship that's left it, by her own move. */
function walled(b, s, x, y, own) {
    const t = tileAt(b, x, y);
    if (!t || t.rock)
        return 'rock';
    if (own && s.out && t.safe)
        return 'safe';
    return null;
}
/** One step of motion, every ship at once, by YPPedia's collision rules (Collision mechanics):
 *  1. Every moving ship claims the square ahead. Empty and unclaimed: in. A ship sitting there: a bump. A ship there
 *     claiming hers (head on): neither moves. Claimed by a ship as big or bigger: she stops. Only smaller ships claiming
 *     it: she's in.
 *  2. Every turning ship not stopped claims the square to her side. A ship there that isn't leaving it, whatever its
 *     size (sitting, or just arrived in 1): she stops. Head on, or claimed by one as big or bigger: she stops.
 *  3. Every ship that tried to turn faces her new way.
 *  A bump: a turning ship stops. A ship going forward into one her size stops and shoves her back a square; into a
 *  smaller one, takes her square and shoves her on a square; into a bigger one, stops. A shove needs a clear square,
 *  one no ship's in or sailing into, or nothing's shoved and the bigger ship stops too. A ship stopped in a square
 *  stops anyone sailing in after her. */
function step(b, ships, motions) {
    const live = ships.filter((s) => !s.sunk);
    const byId = new Map(live.map((s) => [s.id, s]));
    const out = { stopped: new Map(), shoved: new Set(), rocks: new Set(), bumps: [] };
    const bumped = new Set();
    const bump = (a, c, double = false) => {
        const key = a < c ? `${a}:${c}` : `${c}:${a}`;
        if (bumped.has(key))
            return;
        bumped.add(key);
        out.bumps.push({ a, b: c, ...(double ? { double } : {}) });
    };
    for (const phase of [1, 2]) {
        // Who's claiming what this phase.
        const movers = [...motions.entries()].filter(([id, m]) => byId.has(id) && (phase === 1 || (m.d2 !== undefined && !out.stopped.has(id))));
        if (!movers.length)
            continue;
        const claim = new Map();
        for (const [id, m] of movers) {
            const s = byId.get(id), d = phase === 1 ? m.d1 : m.d2;
            claim.set(id, [s.x + DX[d], s.y + DY[d]]);
        }
        const ok = new Map(movers.map(([id]) => [id, true]));
        const needs = new Map(); // she gets in only if this ship leaves
        const shoves = [];
        const fail = (id) => ok.set(id, false);
        for (const [id, m] of movers) {
            const s = byId.get(id), [tx, ty] = claim.get(id);
            const wall = walled(b, s, tx, ty, m.own);
            if (wall) {
                fail(id);
                if (wall === 'rock')
                    out.rocks.add(id);
                continue;
            }
            // Head on: each claiming the other's square.
            const o = at(live, tx, ty);
            const oc = o && claim.get(o.id);
            if (o && oc && oc[0] === s.x && oc[1] === s.y) {
                fail(id);
                bump(id, o.id, s.kind.cls !== o.kind.cls);
                continue;
            }
            // Claimed by others too: the biggest gets it, and only if it's biggest alone.
            const rivals = movers.filter(([n]) => n !== id && claim.get(n)[0] === tx && claim.get(n)[1] === ty).map(([n]) => byId.get(n));
            if (rivals.some((r) => r.kind.cls >= s.kind.cls)) {
                fail(id);
                for (const r of rivals)
                    if (r.kind.cls >= s.kind.cls)
                        bump(id, r.id);
                continue;
            }
            for (const r of rivals)
                bump(id, r.id);
            if (!o)
                continue;
            if (claim.has(o.id)) {
                needs.set(id, o.id);
                continue;
            } // she's moving this phase: in if she gets out
            // A ship sitting there. In the second phase, or turning, she just stops.
            bump(id, o.id);
            const straight = m.d2 === undefined;
            if (phase === 2 || !straight || s.kind.cls < o.kind.cls) {
                fail(id);
                continue;
            }
            const d = m.d1, to = [o.x + DX[d], o.y + DY[d]];
            const clear = !walled(b, o, to[0], to[1], false) && !at(live, to[0], to[1])
                && ![...claim.entries()].some(([n, c]) => n !== id && c[0] === to[0] && c[1] === to[1]);
            if (s.kind.cls === o.kind.cls) {
                fail(id);
                if (clear)
                    shoves.push({ by: id, ship: o.id, to });
            }
            else if (clear)
                shoves.push({ by: id, ship: o.id, to });
            else
                fail(id);
        }
        // Two ships bumping one: nobody's shoved, and the bigger ones stop as well.
        for (const sh of shoves)
            if (shoves.filter((x) => x.ship === sh.ship).length > 1) {
                sh.to = [NaN, NaN];
                const s = byId.get(sh.by);
                if (s.kind.cls > byId.get(sh.ship).kind.cls)
                    fail(sh.by);
            }
        // A ship stays put if the ship ahead of her doesn't get out of her way.
        for (let changed = true; changed;) {
            changed = false;
            for (const [id, o] of needs)
                if (ok.get(id) && !ok.get(o)) {
                    fail(id);
                    bump(id, o);
                    changed = true;
                }
        }
        for (const [id] of movers) {
            const s = byId.get(id);
            if (ok.get(id))
                [s.x, s.y] = claim.get(id);
            else
                out.stopped.set(id, phase);
        }
        for (const sh of shoves)
            if (!Number.isNaN(sh.to[0])) {
                const o = byId.get(sh.ship);
                [o.x, o.y] = sh.to;
                out.shoved.add(o.id);
            }
    }
    for (const [id, m] of motions) {
        const s = byId.get(id);
        if (s && m.face !== undefined)
            s.face = m.face;
    }
    return out;
}
const turnTo = (face, mv) => (mv === 'L' ? cw(face, -1) : mv === 'R' ? cw(face, 1) : face);
/** Damage, halved between friends. Rocks never sink a ship: they take her only as far as full (the user's
 *  BlockadeSim, "You can't sink on a rock ram"; to check against the game). */
function hurt(s, n, by, hurtByShip) {
    if (s.sunk || n <= 0)
        return;
    if (by && by.side === s.side)
        n /= 2;
    s.damage = Math.min(s.kind.sinks, s.damage + n);
    if (by)
        hurtByShip.add(s.id);
}
/** One slot: everyone's move, then the winds and whirlpools, then the guns, then whoever's sunk. Changes `ships`. */
export function resolveSlot(b, ships, plans, slot) {
    const live = ships.filter((s) => !s.sunk);
    const tracks = new Map();
    for (const s of live) {
        const mv = plans.get(s.id)?.moves[slot] ?? null;
        tracks.set(s.id, { from: [s.x, s.y, s.face], moved: [s.x, s.y, s.face], to: [s.x, s.y, s.face], move: mv });
    }
    const bumps = [];
    const hurtByShip = new Set();
    const byId = new Map(live.map((s) => [s.id, s]));
    const safeAt = (s) => !!tileAt(b, s.x, s.y)?.safe;
    const ram = (bp) => {
        const a = byId.get(bp.a), c = byId.get(bp.b), times = bp.double ? 2 : 1;
        if (!safeAt(a))
            hurt(a, c.kind.ram * times, c, hurtByShip);
        if (!safeAt(c))
            hurt(c, a.kind.ram * times, a, hurtByShip);
    };
    const rocks = (ids) => { for (const id of ids) {
        const s = byId.get(id);
        tracks.get(id).rock = true;
        if (!safeAt(s))
            hurt(s, s.kind.rock, null, hurtByShip);
    } };
    const markOut = () => { for (const s of live)
        if (!safeAt(s))
            s.out = true; };
    // 1. Moves.
    const moves = new Map();
    for (const s of live) {
        const mv = tracks.get(s.id).move;
        if (!mv)
            continue;
        moves.set(s.id, mv === 'F' ? { d1: s.face, own: true } : { d1: s.face, d2: turnTo(s.face, mv), face: turnTo(s.face, mv), own: true });
    }
    const m1 = step(b, ships, moves);
    for (const [id, p] of m1.stopped)
        tracks.get(id).stopped = p;
    for (const id of m1.shoved)
        tracks.get(id).shoved = true;
    rocks(m1.rocks);
    m1.bumps.forEach(ram);
    bumps.push(...m1.bumps);
    for (const s of live)
        tracks.get(s.id).moved = [s.x, s.y, s.face];
    markOut();
    // 2. Winds and whirlpools, once, on the ships sitting on them now.
    const winds = new Map();
    for (const s of live) {
        const t = tileAt(b, s.x, s.y);
        if (t?.wind !== undefined) {
            winds.set(s.id, { d1: t.wind, own: false });
            tracks.get(s.id).wind = 'wind';
        }
        else if (t?.whirl !== undefined) {
            const d1 = cw(t.whirl, 1);
            winds.set(s.id, { d1, d2: cw(d1, 1), face: cw(s.face, 1), own: false });
            tracks.get(s.id).wind = 'whirl';
        }
    }
    const m2 = step(b, ships, winds);
    for (const [id, p] of m2.stopped)
        tracks.get(id).windStopped = p;
    for (const id of m2.shoved)
        tracks.get(id).shoved = true;
    rocks(m2.rocks);
    m2.bumps.forEach(ram);
    bumps.push(...m2.bumps);
    markOut();
    // 3. Guns, all at once from where everyone is now.
    const shots = [];
    for (const s of live) {
        const g = plans.get(s.id)?.guns?.[slot];
        if (!g)
            continue;
        [['left', g[0], -1], ['right', g[1], 1]].forEach(([side, count, turn]) => {
            if (count <= 0 || safeAt(s))
                return; // no firing from the safe zone
            const d = cw(s.face, turn);
            let range = null, hit = null;
            for (let i = 1; i <= 3; i++) {
                const x = s.x + DX[d] * i, y = s.y + DY[d] * i, t = tileAt(b, x, y);
                if (!t)
                    break;
                const o = at(live, x, y);
                if (o) {
                    range = i;
                    hit = { ship: o.id };
                    break;
                }
                if (t.rock === 'tall') {
                    range = i;
                    hit = 'rock';
                    break;
                }
            }
            shots.push({ from: s.id, side, count, range, hit, damage: 0 });
        });
    }
    for (const sh of shots) {
        if (!sh.hit || sh.hit === 'rock')
            continue;
        const s = byId.get(sh.from), o = byId.get(sh.hit.ship);
        if (safeAt(o))
            continue; // no damage in the safe zone
        const before = o.damage;
        hurt(o, sh.count * s.kind.shot, s, hurtByShip);
        sh.damage = o.damage - before;
    }
    // 4. Sunk: full damage, with a ship's hand in it this slot.
    const sunk = [];
    for (const s of live) {
        tracks.get(s.id).to = [s.x, s.y, s.face];
        if (s.damage >= s.kind.sinks && hurtByShip.has(s.id)) {
            s.sunk = true;
            sunk.push(s.id);
        }
    }
    return { tracks, bumps, shots, sunk };
}
/** A whole turn's four slots. Changes `ships`. */
export function resolveTurn(b, ships, plans) {
    return [0, 1, 2, 3].map((slot) => resolveSlot(b, ships, plans, slot));
}
/* ---------- Influence and points ---------- */
/** Does a ship of this influence diameter, at this square, hold that buoy? Within half the diameter of her (a sloop's
 *  1 is only her own square; 2 is 5 squares, 4 is 13, 6 is 29, 8 is 49). */
export const holds = (diameter, dx, dy) => dx * dx + dy * dy <= (diameter / 2) ** 2;
export const buoysOf = (b) => b.tiles.flatMap((t, i) => (t.buoy ? [{ x: i % b.w, y: Math.floor(i / b.w), points: t.buoy }] : []));
/** Who holds each buoy now: a side, 'contested', or nobody; and what each side scores for it. */
export function influence(b, ships) {
    const points = [0, 0];
    const buoys = buoysOf(b).map((bu) => {
        const sides = new Set(ships.filter((s) => !s.sunk && holds(s.kind.influence, bu.x - s.x, bu.y - s.y)).map((s) => s.side));
        const holder = sides.size === 2 ? 'contested' : sides.size === 1 ? [...sides][0] : null;
        if (holder === 0 || holder === 1)
            points[holder] += bu.points;
        return { ...bu, holder };
    });
    return { buoys, points };
}
const CREWS = {
    sloop: { weak: { moves: 1.4, guns: 1, mend: 0.1, store: 4 }, normal: { moves: 2.5, guns: 2, mend: 0.15, store: 4 }, elite: { moves: 3.5, guns: 3.5, mend: 0.2, store: 4 } },
    brig: { weak: { moves: 1.6, guns: 3, mend: 0.4, store: 16 }, normal: { moves: 2.3, guns: 6, mend: 0.6, store: 16 }, elite: { moves: 2.9, guns: 8, mend: 0.8, store: 16 } },
    frig: { weak: { moves: 1.5, guns: 5, mend: 1.0, store: 24 }, normal: { moves: 2.2, guns: 8, mend: 1.6, store: 24 }, elite: { moves: 2.8, guns: 12, mend: 2.2, store: 24 } },
};
export const crewFor = (kind, q) => CREWS[kind.cls === 0 ? 'sloop' : kind.cls === 1 ? 'brig' : 'frig'][q];
/** A move token is lost after five turns unused (YPPedia). */
export const TOKEN_LIFE = 5;
/** What a fresh ship comes in with (the old cade sim's: four forwards, two lefts, two rights, ten guns). */
export const freshTokens = (turn, store) => ({ F: [turn, turn, turn, turn], L: [turn, turn], R: [turn, turn], guns: Math.min(10, store), made: 0, gunsMade: 0 });
/** Is the plan one she can play: no more moves than her ship's and her tokens allow, no more guns a side a slot
 *  than her ship has, no more guns than she's loaded. Why not, if not. */
export function planProblem(kind, t, p) {
    const ms = p.moves.slice(0, 4).filter(Boolean);
    if (ms.length > kind.moves)
        return `A ${kind.name.toLowerCase()} has ${kind.moves} moves a turn`;
    for (const m of ['F', 'L', 'R'])
        if (ms.filter((x) => x === m).length > t[m].length)
            return `Not enough ${m === 'F' ? 'forwards' : m === 'L' ? 'lefts' : 'rights'}`;
    const g = (p.guns ?? []).slice(0, 4);
    if (g.some(([l, r]) => l > kind.guns || r > kind.guns || l < 0 || r < 0))
        return `${kind.guns} gun${kind.guns > 1 ? 's' : ''} a side a slot`;
    if (g.reduce((n, [l, r]) => n + l + r, 0) > t.guns)
        return 'Not enough guns loaded';
    return null;
}
/** A round of the tabletop blockade: its board, its ships, the turn, the score. Side 0 comes in at the bottom facing
 *  north, side 1 at the top facing south, along the outer row of their safe zones; sunk, a ship comes back there
 *  fresh at the end of the turn (as the cade sims did; in the game, that ship's out and the side sends another). */
export class Cade {
    board;
    turns;
    random;
    turn = 0;
    score = [0, 0];
    ships = [];
    plans = new Map();
    next = 0;
    constructor(board, turns = 60, random = Math.random) {
        this.board = board;
        this.turns = turns;
        this.random = random;
    }
    get over() { return this.turn >= this.turns; }
    /** Who's winning: a side, or a tie. */
    get leader() { return this.score[0] > this.score[1] ? 0 : this.score[1] > this.score[0] ? 1 : null; }
    /** A ship joins, at her side's edge or where she's put. Her id. */
    add(e) {
        const kind = KINDS[e.kind];
        if (!kind)
            throw new Error(`No ship "${e.kind}"`);
        const crew = e.crew ?? 'normal';
        const s = { id: this.next++, kind, side: e.side, x: 0, y: 0, face: 0, damage: 0, sunk: false, out: false, crew, tokens: freshTokens(this.turn, crewFor(kind, crew).store), want: 'auto' };
        if (e.at)
            [s.x, s.y, s.face] = e.at;
        else
            this.enter(s);
        s.out = !tileAt(this.board, s.x, s.y)?.safe;
        this.ships.push(s);
        return s.id;
    }
    /** Her side's entry row, a free square picked at random, facing in. */
    enter(s) {
        const y = s.side === 0 ? this.board.h - 1 : 0;
        const free = [...Array(this.board.w).keys()].filter((x) => !tileAt(this.board, x, y)?.rock && !this.ships.some((o) => o !== s && !o.sunk && o.x === x && o.y === y));
        s.x = free.length ? free[Math.floor(this.random() * free.length)] : 0;
        s.y = y;
        s.face = s.side === 0 ? 0 : 2;
        s.out = false;
    }
    ship(id) { const s = this.ships.find((x) => x.id === id); if (!s)
        throw new Error(`No ship ${id}`); return s; }
    /** Her plan for the turn coming. Why not, if she can't play it. */
    plan(id, p) {
        const s = this.ship(id);
        const why = planProblem(s.kind, s.tokens, p);
        if (!why)
            this.plans.set(id, p);
        return why;
    }
    /** The turn played: its four slots, then the buoys scored, tokens spent and made, damage mended, the sunk back. */
    playTurn() {
        const live = this.ships.filter((s) => !s.sunk);
        const slots = resolveTurn(this.board, live, this.plans);
        for (const s of live) {
            const p = this.plans.get(s.id);
            if (!p)
                continue;
            for (const m of p.moves.slice(0, 4))
                if (m)
                    s.tokens[m].shift();
            s.tokens.guns -= (p.guns ?? []).slice(0, 4).reduce((n, [l, r]) => n + l + r, 0);
        }
        this.plans.clear();
        const { buoys, points } = influence(this.board, this.ships);
        this.score[0] += points[0];
        this.score[1] += points[1];
        this.turn++;
        const respawned = [];
        for (const s of this.ships) {
            if (s.sunk) {
                s.sunk = false;
                s.damage = 0;
                this.enter(s);
                s.tokens = freshTokens(this.turn, crewFor(s.kind, s.crew).store);
                respawned.push(s.id);
                continue;
            }
            this.work(s);
        }
        return { turn: this.turn, slots, buoys, points, score: [...this.score], respawned };
    }
    /** A turn of her crew's work: moves made (the kind she wants, or whichever she's fewest of), guns loaded up to her
     *  store, damage mended; moves older than five turns lost. */
    work(s) {
        const c = crewFor(s.kind, s.crew), t = s.tokens;
        for (const m of ['F', 'L', 'R'])
            t[m] = t[m].filter((born) => this.turn - born < TOKEN_LIFE);
        t.made += c.moves;
        while (t.made >= 1) {
            t.made -= 1;
            const m = s.want !== 'auto' ? s.want : ['F', 'L', 'R'].reduce((a, x) => (t[x].length < t[a].length ? x : a), 'F');
            t[m].push(this.turn);
        }
        t.gunsMade += c.guns;
        const loaded = Math.floor(t.gunsMade);
        t.gunsMade -= loaded;
        t.guns = Math.min(c.store, t.guns + loaded);
        s.damage = Math.max(0, s.damage - c.mend);
    }
}
