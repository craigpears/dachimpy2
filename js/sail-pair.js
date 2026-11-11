/* The Sailing pair as it falls, steered live (TODO.md, "The Sailing puzzle", 11 Nov: "playable
   anywhere at sea"). TypeScript, compiled to js/sail-pair.js; tested in tests/sail-pair.test.ts.
   Like src/sailing.ts it knows nothing of the den: whatever draws a Sailing board (js/den/sail-board.js)
   and plays it by keys (js/den/sail-station.js; one day Tzz's lesson) holds one of these.

   The rules are src/sailing.ts's: this only keeps the falling pair's place and clock, moving it by the
   same steps Sailing.moves() searches (a column either way, a turn either way about its first square,
   a row down when it can sink), so wherever it comes to rest is a place moves() has, and it's dropped
   there (Sailing.drop with its row). It comes in at the top of the middle columns (SPAWN), turned 0,
   and falls a row every FALL.SECS by itself. Space speeds it (rush, ease: TODO.md, "Sailing's keys as
   the real game's", 11 Nov), never straight to the bottom: no key drops it. (slam() is for a pair
   steered by a show, Tzz's own, not for a key.) */
import { SPAWN, W } from './sailing.js';
export const FALL = {
    /** Seconds a row as it falls by itself (YPPedia: pieces fall steadily, and can be sped up). */
    SECS: 0.6,
    /** Seconds a row while Space speeds it (YPPedia's Sailing, Controls: "Space bar: Increase the pair's
        falling speed"), still steerable as it goes. */
    FAST: 0.04,
    /** A tap of Space: this long falling FAST, a few rows (five), never to the bottom from up the board.
        The user, 11 Nov: "the space usually kind of speeds up the drop. It doesn't drop it entirely ...
        you normally tap space just so you zoom kind of near the bottom but not at the bottom." Held, it
        keeps falling FAST till it's let go (ease). */
    BURST: 0.2,
};
export class SailPair {
    game;
    row = 0;
    col = SPAWN[0];
    turn = 0;
    /** How far it's fallen toward the next row (a row at 1). */
    t = 0;
    /** Space held: falling FAST. */
    held = false;
    /** Seconds of a tap's burst of speed left. */
    burst = 0;
    constructor(game) {
        this.game = game;
    }
    /** Back at the top of the middle columns, the game's pair (its next, after a drop) coming in. */
    reset() { this.row = 0; this.col = SPAWN[0]; this.turn = 0; this.t = 0; this.held = false; this.burst = 0; }
    /** Space pressed (not its key repeat): a burst of speed, FALL.BURST, and fast for as long as it's
        held. A new pair needs a fresh press: one held on from the last doesn't rush it. */
    rush() { this.held = true; this.burst = FALL.BURST; }
    /** Space let go: what's left of the tap's burst plays out, then it falls at its own pace. */
    ease() { this.held = false; }
    /** Its squares, [row, col, colour] each. */
    cells() { return this.game.cells(this.row, this.col, this.turn) ?? []; }
    /** A column left (-1) or right (1), if there's room. */
    slide(dc) {
        if (!this.game.open(this.row, this.col + dc, this.turn))
            return false;
        this.col += dc;
        return true;
    }
    /** A quarter turn clockwise (1) or back (-1), about its first square. Against a wall or a piece it
        pushes off it, as the real game does (the user, 11 Nov: "it doesn't turn when it's against the
        wall. If you rotate it and it's against the wall, it should kind of push away from the wall"): a
        column away from the side it's nearer first, then the other, then a row up. */
    turnBy(dir) {
        const t = ((this.turn + (dir > 0 ? 1 : 3)) % 4);
        const away = this.col < W / 2 ? 1 : -1;
        for (const [dr, dc] of [[0, 0], [0, away], [0, -away], [-1, 0]]) {
            if (this.row + dr < 0 || !this.game.open(this.row + dr, this.col + dc, t))
                continue;
            this.row += dr;
            this.col += dc;
            this.turn = t;
            return true;
        }
        return false;
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
    /** Time going by: it falls a row every FALL.SECS (every FALL.FAST while Space speeds it), and when
        it can't, it lands (what the drop earned), else null. `secs`: seconds a row, if not FALL.SECS. */
    tick(dt, secs = FALL.SECS) {
        const fast = this.held ? dt : Math.min(dt, this.burst);
        this.burst = Math.max(0, this.burst - dt);
        this.t += fast / FALL.FAST + (dt - fast) / secs;
        while (this.t >= 1) {
            this.t -= 1;
            if (!this.sinks())
                return this.land();
            this.row++;
        }
        return null;
    }
    /** Straight down, and it lands: a show's own pair (Tzz's), at the end of its route. No key does this. */
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
