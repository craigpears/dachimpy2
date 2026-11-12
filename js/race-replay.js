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

   PlayerSea is a player's sloop on the race's course: her helm, its sea (its start's field from the race's
   seed, its breeze as written down, its spots shut and opened as they were, the rocks down when they came
   down on it). The den's race (js/den/race.js) steps her the same way, a helm's step at a time. */
import { Sea, Helm } from './den-sail.js';
import { Barrier, readyLocks, spotPose, rocksOn } from './den-race.js';
import { Wind } from './den-wind.js';
import { fieldFor } from './start-field.js';
import { NET } from './race-net.js';
export class PlayerSea {
    acts;
    i;
    sea = new Sea(9);
    helm;
    /** Steps sailed from the gun, and the actions applied so far. */
    n = 0;
    k = 0;
    /** From her spot on the line at the gun; her actions, in order; the race's seed (its start's field) and her
        number in it. */
    constructor(spot, acts, seed, i) {
        this.acts = acts;
        this.i = i;
        // (the breeze as the den's sea has one, js/den/sea.js: a calm stops her. Here it changes only as written
        // down, from the way it was at the gun)
        this.sea.breeze = new Wind(9);
        this.sea.breeze.tick = () => [];
        this.sea.layField(fieldFor(seed));
        this.helm = new Helm(this.sea, spotPose(spot));
        readyLocks(this.helm);
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
                this.sea.touch();
                break;
            case 'open':
                this.sea.rocks.delete(sq);
                this.sea.touch();
                break;
            case 'breeze':
                Object.assign(this.sea.breeze, { d: x[0], s: x[1] });
                break;
            case 'rocks':
                rocksOn(this.sea, false);
                break;
            default: break; // ('fire': her broadside moves nothing of hers)
        }
    }
    /** One step: the helm's. */
    step() {
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
