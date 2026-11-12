/* Pirate Den: the sloop race replayed, step for step, from what was written down (src/race-server.ts,
   RaceRecord). TypeScript, compiled to js/race-replay.js; tested in tests/race-net.test.ts. Pure: no 3D.

   The user (12 Nov): "you don't need positions 4 times a second, you just need moves ... really all you need
   is to save somebody's actions", and of drift, "everybody should always be on the same turn"; skipping ahead
   is replaying moves faster ("you can translate between number of moves and time"). So a race runs in whole
   steps (NET.STEP) wherever it's run, and a player's sloop is her helm and what was done to it, stamped with
   the steps sailed before it (Act): replayed through the same helm on the same sea, she sails the same
   squares at the same steps. The room's own race is replayed through the same rules too (Referee.replay),
   fed what each player said when it heard it (the record's `inputs`, stamped with the room's steps), her
   squares at each from her sloop's replay.

   PlayerSea is a player's sloop on the race's course: her helm, its sea (its breeze as written down, its
   spots shut and opened as they were), the gambles' tosses from her seed. The den's race (js/den/race.js)
   steps her the same way: the gambles' clock at the step, then the helm's step. */
import { Sea, Helm } from './den-sail.js';
import { Barrier, readyLocks, spotPose } from './den-race.js';
import { Gambles } from './den-gamble.js';
import { Wind } from './den-wind.js';
import { LAY } from './den-sail.js';
import { NET } from './race-net.js';
const TN = LAY.RACE.GAMBLES.TURN;
/** A player's gambles' seed: the race's, and her number in it (the same in her browser: js/den/race-net.js). */
export const gambleSeed = (seed, i) => (seed + i * 7919) % 2 ** 31;
export class PlayerSea {
    acts;
    sea = new Sea(9);
    helm;
    gambles;
    /** Steps sailed from the gun, and the actions applied so far. */
    n = 0;
    k = 0;
    /** From her spot on the line at the gun; her actions, in order; the race's seed and her number in it. */
    constructor(spot, acts, seed, i) {
        this.acts = acts;
        // (the breeze as the den's sea has one, js/den/sea.js: a calm stops her. Here it changes only as written
        // down, from the way it was at the gun)
        this.sea.breeze = new Wind(9);
        this.sea.breeze.tick = () => [];
        this.helm = new Helm(this.sea, spotPose(spot));
        readyLocks(this.helm);
        this.gambles = new Gambles(gambleSeed(seed, i));
        this.helm.takes = (p, whirled) => this.gambles.takes(p, whirled);
        const w = this.sea.whirlAt(...TN.POOL.at);
        if (w)
            w.turns = () => this.gambles.way();
    }
    /** One action, done to her helm or her sea. */
    act(a) {
        const h = this.helm, [, kind, ...x] = a, sq = x[0] + ',' + x[1];
        switch (kind) {
            case 'put':
                h.put(x[0]);
                break;
            case 'unput':
                h.unput();
                break;
            case 'stop':
                h.stop();
                break;
            case 'drop':
                h.drop(x[0], x[1]);
                break;
            case 'moor':
                h.moor(x[0]);
                break;
            case 'gust':
                h.gust(x[0]);
                break;
            case 'row':
                h.row(x[0]);
                break;
            case 'stroke':
                h.stroke(x[0]);
                break;
            case 'hit':
                h.hit(x[0]);
                break;
            case 'pump':
                h.pump(x[0]);
                break;
            case 'patched':
                h.hole = null;
                break;
            case 'clear':
                new Barrier().clear(this.sea);
                break;
            case 'shut':
                this.sea.rocks.add(sq);
                break;
            case 'open':
                this.sea.rocks.delete(sq);
                break;
            case 'breeze':
                Object.assign(this.sea.breeze, { d: x[0], s: x[1] });
                break;
            default: break; // ('fire': her broadside moves nothing of hers)
        }
    }
    /** One step: the gambles' clock at it, then the helm's. */
    step() {
        this.gambles.t = this.n * NET.STEP;
        this.helm.tick(NET.STEP);
        this.n++;
    }
    /** On to `n` steps sailed, each action done before the step after the steps it was stamped with: her
        square then. */
    to(n) {
        while (this.n < n) {
            while (this.k < this.acts.length && this.acts[this.k][0] <= this.n)
                this.act(this.acts[this.k++]);
            this.step();
        }
        return { ...this.helm.pose };
    }
}
