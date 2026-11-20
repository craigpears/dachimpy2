/* Pirate Den: the blockade's bots (src/blockade-ai/), a sea turtle's AI: an Atlantean brig's craft. TypeScript,
   compiled to js/blockade-ai/turtle.js; tested in tests/blockade.test.ts.
   - No guns: she picks her prey often (a ship lying still first, a frigate worth most, or the other side's gate guns,
     her brig's standoff work), comes at her off her nearer end, bow or stern, where none of her broadsides bears, and
     rams her when she's alongside (src/blockade.ts). */
import { SAIL } from '../den-sail.js';
import { squares, alongs, shipPath } from '../ship-handling.js';
import { BLOCKADE } from '../blockade.js';
import { BOTS } from './config.js';
import { Captain } from './captain.js';
const RAM_STILL = BLOCKADE.LAUNCH.RAM.STILL, SAIL_SLOTS = SAIL.SLOTS;
export class TurtleAI extends Captain {
    act(b, s, dt) {
        // (a turtle: no guns, only her prey, looked for often)
        // (her prey looked for every RAM.THINK; steered at every frame, a move put in the moment she's free for one: looking
        // only every RAM.THINK, she idled between moves, 0.8 squares a second for all her quick handling, and her 30 seconds
        // ran out short of her frigate, 15 Nov)
        {
            // (at once when she's launched, not after the bots' usual few seconds' start)
            if (!this.goal || (this.t -= dt) <= 0) {
                this.t = BOTS.RAM.THINK;
                const goal = this.prey(b, s);
                this.goal = goal;
            }
            if (this.goal?.kind === 'ram')
                this.charge(b, s, this.goal.at);
            return true;
        }
    }
    /** A turtle's prey: the nearest enemy ship, whatever she is (whether she can catch her is her handling's to say: the
        user, 15 Nov, "it feels a bit artificial ... turtles don't go for sloops at all, rather than it being a mechanical
        advantage"), or a gate's gun of the other side's; and where to come at her: off her nearer end, bow or stern, where
        none of her broadsides bears, else off a corner of her, else anywhere beside her. */
    prey(b, s) {
        const p = s.helm.pose, sea = s.sea.bare(), far = (c, r) => Math.hypot(c - p.c, r - p.r), DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
        // (a brawl's ships left to it, as every bot leaves them)
        // (a ship lying still first, a few squares' worth: she can only ram one that's still, so a frigate camped on a buoy
        // is hers before a sloop darting about nearer)
        // (and worth: a frigate's worth sinking far more than a sloop, a brig between, as a captain weighs it; and the one
        // she's after already, so she doesn't change her mind every look. Since no sloop hides, sloops lying on the
        // lagoons' buoys drew the turtles off the frigates they were launched at: 15 Nov, 3 or 4 rams on frigates a game)
        const was = this.goal?.kind === 'ram' ? this.goal.on : -1, wasGun = this.goal?.kind === 'ram' ? this.goal.gun ?? -1 : -1;
        const lies = (o) => far(o.helm.pose.c, o.helm.pose.r) - ((b.still.get(o.id) ?? 0) >= RAM_STILL ? BOTS.RAM.STILL_FIRST : 0)
            - (o.kind === 'frigate' ? BOTS.RAM.WORTH : o.kind === 'brig' ? BOTS.RAM.WORTH / 2 : 0) - (o.id === was ? BOTS.RAM.KEEP : 0);
        const foes = b.ships.filter((o) => o.team !== s.team && !o.craft && o.away <= 0 && !b.safe(o) && !this.spare.has(o.id) && far(o.helm.pose.c, o.helm.pose.r) <= BOTS.RAM.REACH)
            .sort((a, z) => lies(a) - lies(z));
        // (or a gate's gun of the other side's still standing: always lying still, worth half a frigate; her brig's standoff
        // work, 15 Nov: "a good tactical job for the warbrigs to take on")
        const guns = b.battery.map((g, i) => ({ g, i })).filter(({ g, i }) => !g.wrecked && b.gunSide[i] !== s.team && far(...g.at) <= BOTS.RAM.REACH)
            .map(({ g, i }) => ({ i, at: g.at, lies: far(...g.at) - BOTS.RAM.STILL_FIRST - BOTS.RAM.GUN - (i === wasGun ? BOTS.RAM.KEEP : 0) }));
        const gunFirst = guns.sort((a, z) => a.lies - z.lies)[0];
        const atGun = () => {
            const [gc, gr] = gunFirst.at, spots = [];
            for (let dc = -1; dc <= 1; dc++)
                for (let dr = -1; dr <= 1; dr++)
                    if (dc || dr)
                        spots.push([gc + dc, gr + dr]);
            const open = spots.filter(([x, y]) => sea.open(x, y) && !this.blocked(b, [x, y])).sort((a, z) => far(...a) - far(...z));
            return open.length ? { kind: 'ram', on: -1, at: open[0], gun: gunFirst.i } : null;
        };
        for (const o of foes) {
            if (gunFirst && gunFirst.lies < lies(o)) {
                const g = atGun();
                if (g)
                    return g;
            }
            const op = o.helm.pose, d = op.d, sd = (d + 1) % 4, als = alongs(o.h), hers = squares(o.h, op), on = new Set(hers.map(([c, r]) => `${c},${r}`));
            // (off her ends, where none of her broadsides bears: the squares just past her bow or her stern, whichever's
            // nearer, the way she's coming; then her quarters and bows, a square further out each side; her side only if
            // there's nothing else. Coming at a frigate's bow, she rams her bow, not round to her side to be shot: the user,
            // 16 Nov, "let's stay at the front of the war frig and start ramming it from the front. That's what they were
            // designed to do")
            const past = (al, k) => Array.from(new Set(hers.map(([c, r]) => (c - op.c) * DC[d] + (r - op.r) * DR[d] === al ? `${c + DC[d] * k},${r + DR[d] * k}` : ''))).filter(Boolean).map((x) => x.split(',').map(Number));
            const ends = [...past(als[0], -1), ...past(als[als.length - 1], 1)];
            const corners = ends.flatMap(([c, r]) => [[c + DC[sd], r + DR[sd]], [c - DC[sd], r - DR[sd]]]);
            const beside = [];
            for (const [c, r] of hers)
                for (let dc = -1; dc <= 1; dc++)
                    for (let dr = -1; dr <= 1; dr++)
                        beside.push([c + dc, r + dr]);
            for (const ring of [ends, corners, beside]) {
                const spots = ring.filter(([x, y]) => !on.has(`${x},${y}`) && sea.open(x, y) && !this.blocked(b, [x, y])).sort((a, z) => far(...a) - far(...z));
                if (spots.length)
                    return { kind: 'ram', on: o.id, at: spots[0] };
            }
        }
        return gunFirst ? atGun() : null;
    }
    /** A turtle's way to her prey: straight at her, a move at a time, whichever of her moves ends nearest her (no
        pilot's way worked out: her prey's moved by the next look anyway); stuck a while getting no nearer (rocks in
        her way), her pilot's way round them. */
    charge(b, s, at) {
        const p = s.helm.pose, far = (q) => Math.hypot(q.c - at[0], q.r - at[1]), now = far(p);
        if (now < this.near - 0.5) {
            this.near = now;
            this.since = b.clock;
        }
        if (b.clock - this.since > BOTS.RAM.STUCK) {
            this.near = now;
            this.since = b.clock;
            this.steer(b, s);
            return;
        }
        if (s.helm.pin || s.helm.slot >= 0 || s.helm.mine.length)
            return;
        // (a whole turn's worth at once, each the move ending nearest her prey from where the last leaves her: one at a time,
        // every move was a turn of its own and its breather after, a second and a half a square, 15 Nov)
        let q = p;
        for (let k = 0; k < SAIL_SLOTS && far(q) > 1.5; k++) {
            const moves = ['F', 'L', 'R'].filter((m) => s.sea.clear(q, m)).map((m) => ({ m, to: shipPath(s.h, q, m).to })).map((x) => ({ ...x, d: far(x.to) - (x.m === 'F' ? 0.01 : 0) }));
            moves.sort((a, z) => a.d - z.d);
            if (!moves.length || !s.helm.put(moves[0].m))
                break;
            q = moves[0].to;
        }
    }
    /** A turtle's nearest yet to her prey (charge). */
    near = Infinity;
}
