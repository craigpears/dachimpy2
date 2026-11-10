/* Pirate Den: the imperial checkpoint on the main shipping lane. TypeScript, compiled to
   js/den-checkpoint.js; tested in tests/den-checkpoint.test.ts. js/den/checkpoint.js draws it;
   src/den-sail.ts lays it on the sea (LAY.CHECKPOINT) and sails her through it.

   The user (10 Nov): "this race idea was the funny one. We absolutely need that. We need our own
   puzzle where we have to get through the Imperial checkpoint by doing slow row and then fast
   rowing with the Vegas." Pirates aren't welcome ("you're pirates, so they're not going to be very
   friendly to you"), so its guns fire on her as she passes. And then, on how its guns could work:
   they're trained on particular squares; land on one and she's hit, and you mend her by
   Carpentry. "Or build a combo big enough to jump two squares at once and skip the gun's square.
   Quick small clears keep her moving but walk into the guns; a big combo leaves her sitting still
   while you build it, but rushes her past."

   So each gun is trained on squares of the way through (its marks, drawn on the water). Whenever
   she's on one of them and the gun's loaded, it fires on that square, and the shot's down a moment
   later (CHECK.FLIGHT): still there, she's hit (holed: patched by Carpentry, src/den-patch.ts);
   gone, it splashes down. That moment is shorter than she sits on a square she stops on, and longer
   than she's on one she rushes through:
   - rowing, a square rowed on its own stops there (a stroke at the oars' pace, the pause, the next
     stroke): hit. Two or more rowed at once go straight through the ones between: missed. So small
     clears walk her into the guns, and a combo rowed as one rushes her past them; a Vegas on each
     side (ten squares) carries her through the lot at the trade winds' pace.
   - under sail, a good wind behind her sails her through quick, each square gone before the shot's
     down, but a turn's breather on a mark, or a wind across her, or light airs, and she's hit.
   Out of reach of its guns she's safe, so you can stop short and build your combo. Or go round the
   long way, past the reef's end, out of reach the whole way.

   Its guns can't be wrecked, nor quieted: a sloop's guns don't trouble an imperial bastion. They're
   what the choice of ways through is about (RULES.md, "Every other way through costs a puzzle"), so
   shooting them down mustn't be a way through that costs no puzzle, nor end the choice for good. */
import { LAY } from './den-sail.js';
export const CHECK = {
    /** Seconds a shot takes to come down on a mark (the guns are trained on them: no long flight).
        Longer than she's on a mark rowing two squares as one (about 0.7 s), shorter than she's on one
        she stops on (a square rowed on its own: about 1.5 s). */
    FLIGHT: 0.9,
    /** Seconds a gun takes to load again after a shot. */
    RELOAD: 2.5,
    /** Each gun's marks: the squares it's trained on (by gun, as LAY.CHECKPOINT.GUNS). The way through
        runs up the gate's column: before the gate, the gate itself, and after it. */
    MARKS: [[[9, 17], [9, 21]], [[9, 19]]],
    /** How near (squares, any way) of the gate she comes before it's pointed out. */
    SIGHT: 4,
};
const same = (a, b) => a[0] === b[0] && a[1] === b[1];
/** The checkpoint's guns. */
export class Battery {
    /** Seconds till each gun's loaded. */
    wait = LAY.CHECKPOINT.GUNS.map(() => 0);
    /** Shots on their way down. */
    shots = [];
    /** The gun trained on this square, if one is. */
    gunFor(c, r) {
        return CHECK.MARKS.findIndex((ms) => ms.some((m) => m[0] === c && m[1] === r));
    }
    /** `ship`: where she is now (Helm.now), or null when it shouldn't fire on her (she's not out, or
        Helm.spared: dazed, or just patched). Shots in the air still come down. */
    tick(dt, ship) {
        const out = [];
        this.wait = this.wait.map((w) => Math.max(0, w - dt));
        const at = ship ? [Math.round(ship.c), Math.round(ship.r)] : null;
        for (const s of this.shots)
            s.t -= dt;
        for (const s of this.shots.filter((x) => x.t <= 1e-9))
            out.push({ kind: 'land', gun: s.gun, to: s.to, hit: !!at && same(at, s.to) });
        this.shots = this.shots.filter((x) => x.t > 1e-9);
        if (at) {
            const g = this.gunFor(...at);
            if (g >= 0 && this.wait[g] <= 1e-9) {
                this.wait[g] = CHECK.RELOAD;
                this.shots.push({ gun: g, to: at, t: CHECK.FLIGHT });
                out.push({ kind: 'fire', gun: g, to: at });
            }
        }
        return out;
    }
}
/** The checkpoint: its guns, and which side of it she's on. */
export class Checkpoint {
    battery = new Battery();
    /** The side of it she's on: the near side (the cove's) or beyond it, clear of its marks. */
    side = 'near';
    /** Holed under its guns since she last crossed (or was out of their sight). */
    hits = 0;
    crossed = null;
    sighted = false;
    /** Holed by one of its guns. */
    holed() { this.hits++; }
    /** Her square now (Helm.pose, after each tick): whether she's sighted it, or got through. */
    watch(p) {
        const out = [], K = LAY.CHECKPOINT;
        const near = Math.max(Math.abs(p.c - K.GATE), Math.abs(p.r - K.ROW));
        if (!this.sighted && near <= CHECK.SIGHT) {
            this.sighted = true;
            out.push({ kind: 'sighted' });
        }
        if (near > CHECK.SIGHT + 1)
            this.hits = 0;
        // Through once she's past every mark (so "not a scratch on her" is so), crossing the line at the
        // gate or round the reef's end.
        if (p.r === K.ROW)
            this.crossed = p.c;
        const rows = CHECK.MARKS.flat().map((m) => m[1]);
        const side = p.r < Math.min(...rows) ? 'near' : p.r > Math.max(...rows) ? 'far' : this.side;
        if (side !== this.side) {
            out.push({ kind: 'through', how: this.crossed === K.GATE ? 'gate' : 'round', back: side === 'near', hits: this.hits });
            this.side = side;
            this.hits = 0;
        }
        return out;
    }
}
/** Whether a square is the checkpoint's (its piers, its bastions): her shots do it no harm. */
export function isCheckpoint(sea, c, r) {
    const K = LAY.CHECKPOINT;
    return sea.works.has(`${c},${r}`) && r === K.ROW && c >= K.GUNS[0][0] && c <= K.GUNS[K.GUNS.length - 1][0];
}
/** The den's word when she's through. */
export function throughSay(e) {
    if (e.how === 'round')
        return e.back ? 'Back round the checkpoint, the long way' : 'Round the checkpoint the long way, out of reach of its guns';
    const head = e.back ? 'Back through the checkpoint!' : 'Through the checkpoint!';
    if (!e.hits)
        return `${head} Not a scratch on her`;
    return `${head} Holed ${e.hits === 1 ? 'once' : e.hits === 2 ? 'twice' : `${e.hits} times`}, patched, and through`;
}
