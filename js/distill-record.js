import { Distilling } from './distilling.js';
import { advise } from './distill-bots.js';
const L = 'wbK*x';
/** A board as text, a column a string, top to bottom (the bots' tools' and the tests' way of writing one). */
export const boardText = (cols) => cols.map((c) => c.map((p) => L[p] ?? '?').join(''));
export const boardOf = (text) => text.map((c) => [...c].map((ch) => L.indexOf(ch)));
/** Records a game as it's played: `press` and `release` round a mouse or finger's drag (its swaps one move); a swap
    outside one, a click or a key, is a move of its own. Attach before play: it wraps the game's `swap` and `burnNow`. */
export class Recorder {
    game;
    rec;
    held = false;
    open = null;
    end = null;
    constructor(game, seed, o = {}) {
        this.game = game;
        this.rec = { kind: 'distilling', version: 1, seed, speed: o.speed ?? 1, started: o.started ?? new Date().toISOString(), moves: [], columns: [], burns: [] };
        const swap = game.swap.bind(game), burnNow = game.burnNow.bind(game);
        game.swap = (x1, y1, x2, y2) => {
            const before = this.game.cols.map((c) => [...c]);
            const ok = swap(x1, y1, x2, y2);
            if (ok)
                this.swapped(before, x1, y1, x2, y2);
            return ok;
        };
        game.burnNow = () => { if (!game.finished)
            this.rec.burns.push(game.time); return burnNow(); };
    }
    /** A drag begun, and ended. */
    press() { this.held = true; this.open = null; this.end = null; }
    release() { this.held = false; this.open = null; this.end = null; }
    /** A column gone (the page's onColumn). */
    column(c) {
        this.rec.columns.push({ t: this.game.time, up: c.up, pieces: c.pieces.map((p) => L[p]).join(''), chain: c.chain });
        // (a drag carried on over a burn is two moves: the board slid under it)
        this.open = null;
        this.end = null;
    }
    /** The game over (finished, or dismissed). */
    finish() {
        const g = this.game;
        this.rec.end = { t: g.time, points: g.points, longest: g.longest, whitesBurned: g.whitesBurned, swaps: g.swaps, columnsUp: g.columnsUp, columnsBurned: g.columns.length - g.columnsUp, dismissed: g.dismissed };
    }
    swapped(before, x1, y1, x2, y2) {
        // (the held piece is whichever end the last swap left it at; a fresh move holds the first)
        const from = this.open && this.end && this.end[0] === x2 && this.end[1] === y2 ? [x2, y2] : [x1, y1];
        const to = from[0] === x1 && from[1] === y1 ? [x2, y2] : [x1, y1];
        const way = [0, 1, 2, 3].find((d) => { const n = this.game.neighbour(from[0], from[1], d); return !!n && n[0] === to[0] && n[1] === to[1]; });
        if (way === undefined)
            return;
        const going = this.open && this.end && this.end[0] === from[0] && this.end[1] === from[1];
        if (!going) {
            const g = this.game, left = g.timeLeft();
            this.open = { t: g.time, timeLeft: Number.isFinite(left) ? Math.round(left) : null, chain: g.chain, cols: boardText(before), x: from[0], y: from[1], ways: [] };
            this.rec.moves.push(this.open);
        }
        this.open.ways.push(way);
        this.end = to;
        if (!this.held) {
            this.open = null;
            this.end = null;
        }
    }
}
/** A move in words: the piece, where from, its swaps, where it ended. */
export function describe(cols, x, y, ways) {
    const g = new Distilling(() => 0.5, { timer: false }).lay(cols.map((c) => [...c]));
    const piece = ['white', 'brown', 'black', 'spice', 'burnt white'][cols[x][y]] ?? 'piece', r = g.dragWays(x, y, ways);
    return `the ${piece} at column ${x + 1}, row ${y + 1}, ${r.swaps} swap${r.swaps === 1 ? '' : 's'} to column ${r.at[0] + 1}, row ${r.at[1] + 1}`;
}
export function compare(rec, target = 8) {
    return rec.moves.map((m, i) => {
        const cols = boardOf(m.cols);
        const a = advise({ cols, chain: m.chain, timeLeft: m.timeLeft ?? Infinity }, { target });
        const d = a.drags[0];
        const same = a.kind === 'move' && a.drags.length === 1 && d.x === m.x && d.y === m.y && d.ways.join() === m.ways.join() ? 'move'
            : a.kind === 'move' && a.drags.some((e) => e.x === m.x && e.y === m.y) ? 'piece' : 'no';
        const bot = a.kind !== 'move' ? `wait (${a.reason})` : a.drags.map((e) => describe(cols, e.x, e.y, e.ways)).join('; then ');
        return { i, t: m.t, timeLeft: m.timeLeft, chain: m.chain, cols: m.cols, yours: describe(cols, m.x, m.y, m.ways), bot, botLabel: a.label, botWhy: a.reason, same, stage: a.stage, tactic: a.tactic };
    });
}
