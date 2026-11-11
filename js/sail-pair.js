/* The Sailing pair as it falls, steered live (TODO.md, "The Sailing puzzle", 11 Nov: "playable
   anywhere at sea"). TypeScript, compiled to js/sail-pair.js; tested in tests/sail-pair.test.ts.
   Like src/sailing.ts it knows nothing of the den: whatever draws a Sailing board (js/den/sail-board.js)
   and plays it by keys (js/den/sail-station.js; one day Tzz's lesson) holds one of these.

   The rules are src/sailing.ts's: this only keeps the falling pair's place and clock, moving it by the
   same steps Sailing.moves() searches (a column either way, a turn either way about its first square,
   a row down when it can sink), so wherever it comes to rest is a place moves() has, and it's dropped
   there (Sailing.drop with its row). It comes in at the top of the middle columns (SPAWN), turned 0,
   and falls a row every FALL.SECS by itself; a hard drop sends it straight down. */
import { SPAWN } from './sailing.js';
export const FALL = {
    /** Seconds a row as it falls by itself (YPPedia: pieces fall steadily, and can be sped up). */
    SECS: 0.6,
};
export class SailPair {
    game;
    row = 0;
    col = SPAWN[0];
    turn = 0;
    /** Seconds since it last fell a row. */
    t = 0;
    constructor(game) {
        this.game = game;
    }
    /** Back at the top of the middle columns, the game's pair (its next, after a drop) coming in. */
    reset() { this.row = 0; this.col = SPAWN[0]; this.turn = 0; this.t = 0; }
    /** Its squares, [row, col, colour] each. */
    cells() { return this.game.cells(this.row, this.col, this.turn) ?? []; }
    /** A column left (-1) or right (1), if there's room. */
    slide(dc) {
        if (!this.game.open(this.row, this.col + dc, this.turn))
            return false;
        this.col += dc;
        return true;
    }
    /** A quarter turn clockwise (1) or back (-1), about its first square; no kick off a wall. */
    turnBy(dir) {
        const t = ((this.turn + (dir > 0 ? 1 : 3)) % 4);
        if (!this.game.open(this.row, this.col, t))
            return false;
        this.turn = t;
        return true;
    }
    sinks() {
        return this.game.sinks(this.row, this.col, this.turn) && this.game.open(this.row + 1, this.col, this.turn);
    }
    /** The row it'd come to rest on, dropped straight down from here (for its shadow). */
    rest() {
        const r0 = this.row;
        while (this.sinks())
            this.row++;
        const r = this.row;
        this.row = r0;
        return r;
    }
    /** Time going by: it falls a row every FALL.SECS, and when it can't, it lands (what the drop
        earned), else null. `secs`: seconds a row, if not FALL.SECS. */
    tick(dt, secs = FALL.SECS) {
        this.t += dt;
        while (this.t >= secs) {
            this.t -= secs;
            if (!this.sinks())
                return this.land();
            this.row++;
        }
        return null;
    }
    /** A hard drop: straight down, and it lands. */
    slam() {
        while (this.sinks())
            this.row++;
        return this.land();
    }
    /** Dropped where it is (a pair of one colour lies the same turned 2 as 0: moves() gives it as 0),
        and the next pair comes in at the top. */
    land() {
        const [a, b] = this.game.pair, turn = (a === b ? this.turn & 1 : this.turn);
        let res = this.game.drop(this.col, turn, this.row);
        // (never seen: a place moves() hasn't, so straight down its column rather than stuck)
        if (!res.dropped)
            res = this.game.drop(this.col, turn);
        this.reset();
        return res;
    }
}
