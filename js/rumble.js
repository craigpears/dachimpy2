/* Rumble, the brawling puzzle, as Puzzle Pirates plays it (RUMBLE.md, researched on YPPedia 21 Nov 2026). It knows
   nothing of the den: no DOM, the dice and the clock handed in, so it runs in a page, a test or a server alike.
   Compiled to js/rumble.js by `npm run build`; tested in tests/rumble.test.ts; its bots src/rumble-bots.ts; played
   on rumble-test.html (js/rumble-view.js).

   A bubble shooter on a hexagonal board, nine balls across: balls fired from two fists at the foot travel straight,
   bounce off the sides and stick to the mass. Three or more of a colour clear, and whatever no longer hangs from the
   top falls (dropoff). A charged ball makes a group that stays, recorded in order; an ordinary ball into a charged
   group sets off it and every group charged after it, a combo. One group's worth sends sprinkles up from the bottom
   of the other board; two or more a strike, pushed in at its top corner. Where YPPedia is silent the den's choice is
   marked in RUMBLE.md, never here alone. */
export const COLOURS = ['red', 'orange', 'yellow', 'aqua', 'blue'];
/** Nine balls across; 13 rows above the line (RUMBLE.md §1: the height is the den's guess), 5 filled at the start. */
export const W = 9, H = 13, START_ROWS = 5;
/** A new row at the top after every eighth shot; about five seconds a shot before the game fires for you. */
export const ROW_EVERY = 8, SHOT_CLOCK = 5;
/** How long a fire button is held to charge its ball (about a second). For the page and the bots: the rules take
    a shot as charged or not. */
export const CHARGE_TIME = 1;
/** Rows are half a ball's width apart side to side and this far apart up and down; balls a ball across. */
export const ROW_H = Math.sqrt(3) / 2, R = 0.5;
/** The board's width in ball widths (the offset rows reach half a ball further). */
export const WIDTH = W + 0.5;
/** Where the line at the foot of the board is, and the fists below it. */
export const LINE_Y = (H - 1) * ROW_H + 1;
export const LAUNCH_Y = LINE_Y + 1.6;
export const LAUNCH_X = [WIDTH * 0.3, WIDTH * 0.7];
/** How far round from straight up a fist aims, either way (radians). */
export const MAX_AIM = (78 * Math.PI) / 180;
/** How fast a fired ball flies, in ball widths a second. */
export const SPEED = 24;
/** The shortest a sprinkle row is, and the most a queue sends (more than two rows is squished to one). */
export const SPRINKLE_ROW = 9, SQUISH = 18;
/** A seeded random number source (mulberry32), for a seed in a page's address. */
export function seeded(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
// ---- Strike size (YPPedia, "Rumble strike calculations"; RUMBLE.md §5 for the gaps) --------------------------
/** Base height and width by groups in the combo, 2 to 17 (more than 17 as 17). */
const BASE = {
    2: [1, 7], 3: [2, 5], 4: [3, 4], 5: [3, 5], 6: [4, 4], 7: [5, 4], 8: [6, 4], 9: [6, 4], 10: [7, 4],
    11: [9, 3], 12: [11, 3], 13: [12, 3], 14: [14, 3], 15: [16, 2], 16: [18, 2], 17: [19, 2],
};
/** The dropoff modifier by groups (3 to 8) and total dropoff (0 to 8+). The table's * and + are in `dropMod`. */
const DROP_MOD = {
    3: [0, 0, 0, 0, 3, 3, 4, 4, 4], 4: [0, 0, 1, 1, 3, 3, 4, 4, 5], 5: [0, 0, 2, 2, 3, 3, 4, 4, 4],
    6: [0, 0, 2, 2, 3, 4, 5, 5, 5], 7: [0, 0, 1, 1, 3, 3, 4, 4, 5], 8: [0, 0, 1, 2, 2, 2, 4, 4, 5],
};
/** The extra-balls modifier by groups (3 to 8) and total extra balls (0 to 9, more as 9). YPPedia's blanks are
    filled with the last number given on the row (RUMBLE.md §5). */
const EXTRA_MOD = {
    3: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4], 4: [0, 0, 0, 0, 0, 1, 1, 1, 3, 3], 5: [0, 0, 1, 1, 1, 2, 2, 2, 2, 2],
    6: [0, 0, 1, 1, 1, 1, 1, 2, 2, 2], 7: [0, 0, 0, 1, 1, 1, 1, 1, 1, 1], 8: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
};
const modRow = (groups) => Math.min(8, Math.max(3, groups));
function dropMod(groups, dropoff, extra) {
    const g = modRow(groups), d = Math.min(8, dropoff);
    let m = DROP_MOD[g][d];
    if (g === 3 && (d === 2 || d === 3) && extra === 1)
        m = 1; // "*Add 1, instead of 0, if exactly 1 extra ball"
    if (g === 4 && (d === 2 || d === 3) && extra >= 1)
        m = 2; // "+Add 2, instead of 1, if at least 1 extra ball"
    return m;
}
/** A strike's size: its rows and columns (at most the board's 9 across), and how many of its balls are bruises
    (one a dropoff ball, at most half the strike). */
export function strikeSize(groups, dropoff, extra) {
    const [h, base] = BASE[Math.min(17, Math.max(2, groups))];
    const w = Math.min(W, base + dropMod(groups, dropoff, extra) + EXTRA_MOD[modRow(groups)][Math.min(9, extra)]);
    return { h, w, bruises: Math.min(dropoff, Math.floor((h * w) / 2)) };
}
/** What a clear adds to the sprinkle queue: half the balls popped (at most 5 a pop, RUMBLE.md §5), and a third of
    the dropoff, each rounded down. */
export function sprinkles(popped, dropoff) {
    return Math.min(5, Math.floor(popped / 2)) + Math.floor(dropoff / 3);
}
/** A row of colours from their letters: r o y a b. */
export const row = (s) => [...s].map((ch) => 'royab'.indexOf(ch));
/** Bare fists, the no-bludgeons pattern. The sprinkles as YPPedia describes them (red in columns 1 to 3, RRRYYYOOO;
    the multi-row's middle a different colour, CYC); the strike rows a stand-in until checked against its picture. */
export const BARE_FISTS = {
    name: 'Bare fists',
    strike: [row('rroyybaar'), row('roybbaarr'), row('oyybaarro'), row('yybaarroo')],
    single: row('rrryyyooo'),
    multi: row('rrrayaooo'),
};
/** One board: the balls hanging in it, its charged groups in order, and its rows' offset. */
export class Board {
    grid;
    /** Which rows sit half a ball over: row r does when (r + parity) is odd. Flips as a new row comes in. */
    parity = 0;
    /** The charged balls, oldest first: each one's group a recorded charged group. */
    charges = [];
    nextId;
    constructor(nextId = 1) {
        this.grid = Array.from({ length: H + 24 }, () => Array(W).fill(null));
        this.nextId = nextId;
    }
    clone() {
        const b = new Board(this.nextId);
        b.grid = this.grid.map((row) => row.map((x) => (x ? { ...x } : null)));
        b.parity = this.parity;
        b.charges = [...this.charges];
        return b;
    }
    ball(c, bruise = 0) { return { id: this.nextId++, c, bruise }; }
    at(r, c) { return r >= 0 && r < this.grid.length && c >= 0 && c < W ? this.grid[r][c] : null; }
    offset(r) { return (r + this.parity) & 1; }
    centre(r, c) { return { x: c + R + this.offset(r) * 0.5, y: r * ROW_H + R }; }
    isCharged(b) { return !!b && this.charges.includes(b.id); }
    /** The six cells round one, on the board. */
    neighbours(r, c) {
        const o = this.offset(r), out = [];
        const add = (rr, cc) => { if (rr >= 0 && rr < this.grid.length && cc >= 0 && cc < W)
            out.push({ r: rr, c: cc }); };
        add(r, c - 1);
        add(r, c + 1);
        for (const dr of [-1, 1]) {
            add(r + dr, c - 1 + o);
            add(r + dr, c + o);
        }
        return out;
    }
    /** Every ball, where it is. */
    balls() {
        const out = [];
        this.grid.forEach((row, r) => row.forEach((ball, c) => { if (ball)
            out.push({ r, c, ball }); }));
        return out;
    }
    find(id) {
        for (let r = 0; r < this.grid.length; r++)
            for (let c = 0; c < W; c++)
                if (this.grid[r][c]?.id === id)
                    return { r, c };
        return null;
    }
    /** The lowest row with a ball in it, or -1 when the board's empty. */
    lowest() {
        for (let r = this.grid.length - 1; r >= 0; r--)
            if (this.grid[r].some(Boolean))
                return r;
        return -1;
    }
    /** A ball below the line. */
    over() { return this.lowest() >= H; }
    /** The group a ball's in: it and every ball of its colour touching, bruised balls left out (a bruised ball is in
        no group). */
    group(r, c) {
        const start = this.at(r, c);
        if (!start || start.bruise)
            return [];
        const seen = new Set([r * W + c]), out = [{ r, c }];
        for (let i = 0; i < out.length; i++) {
            for (const n of this.neighbours(out[i].r, out[i].c)) {
                const b = this.at(n.r, n.c), k = n.r * W + n.c;
                if (b && !b.bruise && b.c === start.c && !seen.has(k)) {
                    seen.add(k);
                    out.push(n);
                }
            }
        }
        return out;
    }
    /** Removes the balls no longer hanging from the top; returns them. */
    dropLoose() {
        const held = new Set(), stack = [];
        for (let c = 0; c < W; c++)
            if (this.grid[0][c]) {
                held.add(c);
                stack.push({ r: 0, c });
            }
        while (stack.length) {
            const { r, c } = stack.pop();
            for (const n of this.neighbours(r, c)) {
                const k = n.r * W + n.c;
                if (this.grid[n.r][n.c] && !held.has(k)) {
                    held.add(k);
                    stack.push(n);
                }
            }
        }
        const out = [];
        this.grid.forEach((row, r) => row.forEach((ball, c) => {
            if (ball && !held.has(r * W + c)) {
                out.push({ r, c, ball });
                row[c] = null;
            }
        }));
        this.forget(out.map((x) => x.ball.id));
        return out;
    }
    forget(ids) {
        if (ids.length)
            this.charges = this.charges.filter((id) => !ids.includes(id));
    }
    /** Clears a group: its balls gone, and every bruised ball beside it a stage lighter (once a group). */
    clear(cells) {
        const gone = cells.map(({ r, c }) => ({ r, c, ball: this.grid[r][c] }));
        for (const { r, c } of cells)
            this.grid[r][c] = null;
        const lit = new Set();
        for (const { r, c } of cells)
            for (const n of this.neighbours(r, c)) {
                const b = this.grid[n.r][n.c];
                if (b && b.bruise && !lit.has(b.id)) {
                    lit.add(b.id);
                    b.bruise = (b.bruise - 1);
                }
            }
        this.forget(gone.map((g) => g.ball.id));
        return gone;
    }
    /** Follows a ball fired from (x, y) at an angle (radians from straight up, right positive): its path, bounces
        and all, and the cell it sticks in. */
    trace(x0, y0, angle) {
        let x = x0, y = y0, dx = Math.sin(angle), dy = -Math.cos(angle);
        const path = [{ x, y }], step = 0.08;
        for (let i = 0; i < 4000; i++) {
            let nx = x + dx * step;
            const ny = y + dy * step;
            if (nx < R) {
                nx = 2 * R - nx;
                dx = -dx;
                path.push({ x: R, y: ny });
            }
            else if (nx > WIDTH - R) {
                nx = 2 * (WIDTH - R) - nx;
                dx = -dx;
                path.push({ x: WIDTH - R, y: ny });
            }
            if (ny <= R) {
                x = nx;
                y = R;
                break;
            }
            if (this.touches(nx, ny))
                break;
            x = nx;
            y = ny;
        }
        const cell = this.snap(x, y);
        path.push(this.centre(cell.r, cell.c));
        return { path, cell };
    }
    /** Whether a ball at (x, y) would touch one on the board (a little under a ball across, so balls slip past a
        corner, as a bubble shooter's do). */
    touches(x, y) {
        const r0 = Math.round((y - R) / ROW_H);
        for (let r = r0 - 1; r <= r0 + 1; r++) {
            if (r < 0 || r >= this.grid.length)
                continue;
            for (let c = 0; c < W; c++) {
                if (!this.grid[r][c])
                    continue;
                const p = this.centre(r, c);
                if ((p.x - x) ** 2 + (p.y - y) ** 2 < 0.82 * 0.82)
                    return true;
            }
        }
        return false;
    }
    /** The empty cell nearest (x, y) that a ball could hang in: the top row, or touching a ball. */
    snap(x, y) {
        const r0 = Math.round((y - R) / ROW_H);
        let best = null, bestD = Infinity, any = null, anyD = Infinity;
        for (let r = Math.max(0, r0 - 1); r <= Math.min(this.grid.length - 1, r0 + 1); r++) {
            for (let c = 0; c < W; c++) {
                if (this.grid[r][c])
                    continue;
                const p = this.centre(r, c), d = (p.x - x) ** 2 + (p.y - y) ** 2;
                if (d < anyD) {
                    anyD = d;
                    any = { r, c };
                }
                if (d < bestD && (r === 0 || this.neighbours(r, c).some((n) => this.grid[n.r][n.c]))) {
                    bestD = d;
                    best = { r, c };
                }
            }
        }
        return best ?? any ?? { r: Math.max(0, Math.min(this.grid.length - 1, r0)), c: Math.max(0, Math.min(W - 1, Math.floor(x))) };
    }
    /** Where a ball fired from a fist at an angle goes. */
    shot(fist, angle) {
        return this.trace(LAUNCH_X[fist], LAUNCH_Y, Math.max(-MAX_AIM, Math.min(MAX_AIM, angle)));
    }
    /** A fired ball sticking in a cell: charging a group, clearing one, setting off a combo, or just sticking. */
    land(c, cell, charged) {
        const ball = this.ball(c);
        this.grid[cell.r][cell.c] = ball;
        const out = { kind: 'none', cell, popped: 0, dropoff: 0, groups: 0, extra: 0, gone: [], lost: false };
        const group = this.group(cell.r, cell.c);
        const chargedIn = group.map(({ r, c }) => this.charges.indexOf(this.grid[r][c].id)).filter((i) => i >= 0);
        if (charged) {
            // A charged ball making a group of three or more holds it, recorded; into a charged group, it's just a ball.
            if (group.length >= 3 && !chargedIn.length) {
                this.charges.push(ball.id);
                out.kind = 'charge';
            }
        }
        else if (chargedIn.length) {
            this.combo(Math.min(...chargedIn), ball.id, out);
        }
        else if (group.length >= 3) {
            out.kind = 'clear';
            out.gone.push(...this.clear(group).map((g) => ({ ...g, fell: false })));
            out.popped = group.length;
            out.groups = 1;
            out.extra = Math.max(0, group.length - 3);
        }
        if (out.kind === 'clear' || out.kind === 'combo') {
            const loose = this.dropLoose();
            out.dropoff = loose.length;
            out.gone.push(...loose.map((g) => ({ ...g, fell: true })));
        }
        out.lost = this.over();
        return out;
    }
    /** Sets off the charged group recorded at `from` and every one after it: each group clears in turn, one counter
        each; the loose balls fall after (a group knocked loose on the way still counts). */
    combo(from, trigger, out) {
        out.kind = 'combo';
        const order = this.charges.slice(from);
        this.charges = this.charges.slice(0, from);
        for (const id of order) {
            const at = this.find(id);
            if (!at)
                continue; // gone with an earlier group of the combo (they'd merged)
            const g = this.group(at.r, at.c);
            if (g.length === 0)
                continue;
            const hasTrigger = g.some(({ r, c }) => this.grid[r][c].id === trigger);
            out.gone.push(...this.clear(g).map((x) => ({ ...x, fell: false })));
            out.popped += g.length;
            out.extra += Math.max(0, g.length - (hasTrigger ? 1 : 0) - 3);
            out.groups++;
        }
    }
    /** A new row in at the top, everything else down one. */
    pushRow(balls) {
        this.grid.unshift(balls.slice(0, W));
        this.grid.pop();
        this.parity = (this.parity ^ 1);
    }
    /** A strike pushed in at a top corner: its columns' balls shoved down by its height to make room. A charged ball
        pushed out of its group turns into a bruise (dark). Returns the cells the strike's balls went into. */
    strike(rows, from) {
        const h = rows.length, w = rows[0]?.length ?? 0, c0 = from === 'left' ? 0 : W - w, cells = [];
        for (let i = 0; i < w; i++) {
            const c = c0 + i;
            for (let r = this.grid.length - 1 - h; r >= 0; r--) {
                this.grid[r + h][c] = this.grid[r][c];
                this.grid[r][c] = null;
            }
            for (let r = 0; r < h; r++) {
                this.grid[r][c] = rows[r][i];
                cells.push({ r, c });
            }
        }
        this.settle();
        return cells;
    }
    /** Sprinkles flying up from the foot of the board, each up its own column, sticking to the first thing they meet.
        Returns where each went. */
    sprinkle(balls) {
        const cells = [];
        for (const { col, ball } of balls) {
            const { cell } = this.trace(col + R + 0.25, LINE_Y + 1, 0);
            this.grid[cell.r][cell.c] = ball;
            cells.push(cell);
        }
        return cells;
    }
    /** After a strike: charged balls no longer in a group of three bruised, and anything left hanging from nothing
        falls (it isn't anyone's attack). */
    settle() {
        for (const id of [...this.charges]) {
            const at = this.find(id);
            if (!at)
                continue;
            if (this.group(at.r, at.c).length < 3) {
                this.grid[at.r][at.c].bruise = 2;
                this.forget([id]);
            }
        }
        this.dropLoose();
    }
}
/** One pirate in a rumble: their board, their fists (each a ball now and the one after), and what's coming at them. */
export class Side {
    random;
    board = new Board();
    fists;
    /** Where both fists aim (radians from straight up), for the shot the game fires when the clock runs out. */
    aim = 0;
    shots = 0;
    queue = 0;
    /** The hidden count behind the new rows' bruises: up a ball removed, down a ball sent (RUMBLE.md §4). */
    bruising = 0;
    /** Attacks coming, each landing after the first shot fired once it came (`after`: shots fired by then). */
    incoming = [];
    flying = null;
    /** When the ball in hand was ready: the shot clock runs from here. */
    ready;
    lost = false;
    constructor(random, now) {
        this.random = random;
        const ball = () => Math.floor(random() * 5);
        this.fists = [[ball(), ball()], [ball(), ball()]];
        for (let r = 0; r < START_ROWS; r++)
            for (let c = 0; c < W; c++)
                this.board.grid[r][c] = this.board.ball(ball());
        this.ready = now;
    }
    colour() { return Math.floor(this.random() * 5); }
    /** Seconds left on the shot clock. */
    clock(now) { return this.flying || this.lost ? SHOT_CLOCK : Math.max(0, SHOT_CLOCK - (now - this.ready)); }
    /** Shots until the board drops a row. */
    toRow() { return ROW_EVERY - (this.shots % ROW_EVERY); }
}
/** A rumble between two pirates: each board, the balls in the air, attacks sent and landing, the winner. */
export class Rumble {
    random;
    sides;
    winner = null;
    /** Everything that's happened since the page last took them (`drain`). */
    happened = [];
    bludgeons = [BARE_FISTS, BARE_FISTS];
    constructor(random = Math.random, now = 0) {
        this.random = random;
        this.sides = [new Side(random, now), new Side(random, now)];
    }
    drain() { const out = this.happened; this.happened = []; return out; }
    over() { return this.winner !== null; }
    /** Whether a pirate can fire now: playing, and no ball of theirs in the air. */
    canFire(p) { const s = this.sides[p]; return !this.over() && !s.lost && !s.flying; }
    /** Fires a fist at an angle, its ball charged or not. False if it can't fire now. */
    fire(p, fist, angle, charged, now) {
        if (!this.canFire(p))
            return false;
        const s = this.sides[p];
        s.aim = angle;
        const { path, cell } = s.board.shot(fist, angle);
        let length = 0;
        for (let i = 1; i < path.length; i++)
            length += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
        const c = s.fists[fist][0];
        s.fists[fist] = [s.fists[fist][1], s.colour()];
        s.flying = { fist, c, charged, cell, path, firedAt: now, landsAt: now + length / SPEED, n: ++s.shots };
        this.happened.push({ t: now, p, what: 'fired', fist, charged, path, lands: s.flying.landsAt });
        return true;
    }
    /** The clock moving on: balls landing, the shot clock firing for anyone too slow. */
    tick(now) {
        for (let p = 0; p < 2 && !this.over(); p++) {
            const s = this.sides[p];
            if (s.flying && now >= s.flying.landsAt)
                this.resolve(p, s.flying.landsAt);
            else if (!s.flying && !s.lost && now - s.ready >= SHOT_CLOCK)
                this.fire(p, 0, s.aim, false, s.ready + SHOT_CLOCK);
        }
    }
    /** A ball landing: what it does, what it sends, then what was coming at them lands, then the row every eighth shot. */
    resolve(p, now) {
        const s = this.sides[p], f = s.flying;
        s.flying = null;
        s.ready = now;
        const outcome = s.board.land(f.c, f.cell, f.charged);
        this.happened.push({ t: now, p, what: 'landed', outcome, charged: f.charged, fist: f.fist });
        s.bruising += outcome.popped + outcome.dropoff;
        if (outcome.kind === 'clear' || (outcome.kind === 'combo' && outcome.groups === 1)) {
            s.queue += sprinkles(outcome.popped, outcome.dropoff);
            if (s.queue >= SPRINKLE_ROW) {
                const n = s.queue > SQUISH ? SPRINKLE_ROW : s.queue;
                s.queue = 0;
                this.send(p, this.sprinkleAttack(p, n), now);
            }
        }
        else if (outcome.kind === 'combo') {
            this.send(p, this.strikeAttack(p, outcome, f.fist), now);
        }
        if (outcome.lost)
            return this.lose(p, now);
        // What was coming lands now: anything sent before this ball was fired.
        const due = s.incoming.filter((x) => x.after < f.n);
        s.incoming = s.incoming.filter((x) => x.after >= f.n);
        for (const { attack } of due) {
            const cells = attack.kind === 'strike' ? s.board.strike(attack.rows, attack.from) : s.board.sprinkle(attack.balls);
            this.happened.push({ t: now, p, what: 'hit', attack, cells });
            if (s.board.over())
                return this.lose(p, now);
        }
        if (s.shots % ROW_EVERY === 0) {
            const chance = Math.min(0.5, Math.max(0, s.bruising) / 150);
            s.board.pushRow(Array.from({ length: W }, () => s.board.ball(s.colour(), this.random() < chance ? 2 : 0)));
            this.happened.push({ t: now, p, what: 'row' });
            if (s.board.over())
                return this.lose(p, now);
        }
    }
    send(p, attack, now) {
        const to = this.sides[1 - p], n = attack.kind === 'strike' ? attack.rows.length * attack.rows[0].length : attack.balls.length;
        this.sides[p].bruising -= n;
        to.incoming.push({ attack, after: to.shots });
        this.happened.push({ t: now, p, what: 'sent', attack, to: 1 - p });
    }
    /** Sprinkles by the bludgeon: the first nine its single-row pattern across the board, any more its multi-row
        pattern at columns picked at random. */
    sprinkleAttack(p, n) {
        const b = this.bludgeons[p], board = this.sides[1 - p].board, balls = [];
        for (let col = 0; col < Math.min(n, W); col++)
            balls.push({ col, ball: board.ball(b.single[col]) });
        const cols = Array.from({ length: W }, (_, i) => i);
        for (let i = cols.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [cols[i], cols[j]] = [cols[j], cols[i]];
        }
        for (let i = 0; i < n - W; i++)
            balls.push({ col: cols[i % W], ball: board.ball(b.multi[cols[i % W]]) });
        return { kind: 'sprinkle', balls };
    }
    /** A strike by the tables, laid out by the bludgeon's strike rows from the bottom up (past its rows, its top four
        again), its bruises scattered through it. Set off with the left fist it comes in at the top right. */
    strikeAttack(p, o, fist) {
        const { h, w, bruises } = strikeSize(o.groups, o.dropoff, o.extra);
        const pat = this.bludgeons[p].strike, P = pat.length, from = fist === 0 ? 'right' : 'left';
        const board = this.sides[1 - p].board, c0 = from === 'left' ? 0 : W - w;
        const rows = [];
        for (let r = 0; r < h; r++) {
            const up = h - 1 - r; // its row counted from the bottom
            const pr = up < P ? P - 1 - up : Math.min(3, P - 1) - ((up - P) % Math.min(4, P));
            rows.push(Array.from({ length: w }, (_, i) => board.ball(pat[pr][c0 + i])));
        }
        const all = rows.flat();
        for (let i = all.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [all[i], all[j]] = [all[j], all[i]];
        }
        for (let i = 0; i < bruises; i++)
            all[i].bruise = 2;
        return { kind: 'strike', from, rows, groups: o.groups, bruises };
    }
    lose(p, now) {
        this.sides[p].lost = true;
        this.sides[p].flying = null;
        this.winner = 1 - p;
        this.happened.push({ t: now, p, what: 'lost' });
    }
}
