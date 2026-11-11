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
   Out of reach of its guns she's safe, so you can stop short and build your combo. Or go round it
   by the locks (the canal's chain of them, cut through the headland beside it: src/den-lock.ts),
   out of its sight the whole way; that costs puzzles too, a go of Bilge at each lock up. Its
   reef's far end, the long way round that cost only time, was closed once the locks were the way
   round (the user, 10 Nov). Nothing says the locks are there, nor how to get past it: all yours to
   find (the user, 10 Nov: "I like these just to be hidden gems that you work out").

   And its guns can be knocked out, "just the same as" the turret that was (the user, 10 Nov:
   "everything should be destructive"): a hit from her guns on a gun's bastion quietens that gun a
   while, and the third wrecks it for good. A wrecked gun fires on its marks no more, so with both
   wrecked the way through is safe. But it costs a puzzle, as every way through does (RULES.md,
   "Every other way through costs a puzzle"): her guns are loaded by Gunnery (src/den-guns.ts). And
   it's a fight: once she's fired on the checkpoint, its guns fire on her square too, wherever she
   is within their reach, as the turret did, the shot in the air a while so a ship under way is
   often gone from under it. That lasts till she's out of its sight. */

import { LAY, type Sea } from './den-sail.js';
import { Turret } from './den-turret.js';

/* A real chance to get past (the user, 10 Nov: "you need some chance to actually sail through. I
   think getting hit once or twice is funny, but they hit like there's no opportunity to really get
   past"): a gun that's hit her holds its fire on its marks till she's out of the checkpoint's sight
   (its crew cheering, reloading, swabbing out), so running it costs a hit or two at most, one a
   gun, never one after another. A fight (she's fired on it) is a fight: roused, they fire on her
   whatever. */
export const CHECK = {
  /** Seconds a shot takes to come down on a mark (the guns are trained on them: no long flight).
      Longer than she's on a mark rowing two squares as one (about 0.7 s), shorter than she's on one
      she stops on (a square rowed on its own: about 1.5 s). */
  FLIGHT: 0.9,
  /** Seconds a gun takes to load again after a shot. */
  RELOAD: 2.5,
  /** Each gun's marks: the squares it's trained on (by gun, as LAY.CHECKPOINT.GUNS). The way through
      runs up the gate's column: before the gate, the gate itself, and after it. */
  MARKS: [[[9, 17], [9, 21]], [[9, 19]]] as [number, number][][],
  /** How near (squares, any way) of the gate she comes before it's pointed out. */
  SIGHT: 4,
  /** Once she's fired on it: how far a gun reaches to fire on her square (squares, any way), how
      long that shot's in the air (time to get out from under it, as the turret's was), and the
      seconds it takes that gun to load again after one. (Each gun's a destructible turret,
      src/den-turret.ts, set up with these.) */
  REACH: 3,
  AIMED: 1.4,
  AIMED_RELOAD: 4,
  /** A hit from her guns quietens a gun this many seconds; this many hits wreck it for good. */
  QUIET: 10,
  WRECK: 3,
};

/** A shot from one of its guns (by number): fired on a mark, or on her square once she's fired on
    it (`aimed`), and how long it's in the air; or coming down. */
export type GunEvent =
  | { kind: 'fire'; gun: number; to: [number, number]; aimed: boolean; secs: number }
  | { kind: 'land'; gun: number; to: [number, number]; hit: boolean; aimed: boolean };

/** What a shot of hers did on the checkpoint: hit one of its guns (quietened it, wrecked it, or it
    was a wreck already), or only the gatehouse's stone. `first`: the first she's fired on it since
    she came in sight of it (it's a fight now). */
export type ShotAt = ({ on: 'gun'; gun: number; did: 'quiet' | 'wrecked' | null } | { on: 'gatehouse' }) & { first: boolean };

/** What she's done at the checkpoint: sighted it, or got to the other side of it (through its gate,
    or round it by the locks), out or back, and how many times she was holed doing it. */
export type CheckEvent =
  | { kind: 'sighted' }
  | { kind: 'through'; how: 'gate' | 'locks' | 'whirlpools'; back: boolean; hits: number }
  /** Out of its sight after she'd fired on it: its guns go back to their marks. */
  | { kind: 'calm' };

/** The checkpoint's guns: a destructible turret (src/den-turret.ts) on each bastion, trained on its
    marks, and only firing on her square once she's fired on it. */
export class Battery {
  /** Each gun that's hit her since she came in sight: it holds its fire on its marks. */
  scored: boolean[] = LAY.CHECKPOINT.GUNS.map(() => false);
  readonly guns: Turret[] = LAY.CHECKPOINT.GUNS.map((at, g) => new Turret({
    at, marks: CHECK.MARKS[g], alert: false, reach: CHECK.REACH,
    flight: CHECK.AIMED, reload: CHECK.AIMED_RELOAD, markFlight: CHECK.FLIGHT, markReload: CHECK.RELOAD,
    quiet: CHECK.QUIET, wreck: CHECK.WRECK,
  }));

  /** She's fired on it: its guns fire on her square too, wherever she's in their reach. */
  get roused(): boolean { return this.guns.some((t) => t.roused); }
  set roused(on: boolean) { for (const t of this.guns) t.roused = on; }
  get hits(): number[] { return this.guns.map((t) => t.hits); }
  get quiet(): number[] { return this.guns.map((t) => t.quiet); }
  get wrecked(): boolean[] { return this.guns.map((t) => t.wrecked); }

  /** The gun trained on this square, if one is. */
  gunFor(c: number, r: number): number { return this.guns.findIndex((t) => t.trained(c, r)); }
  /** The gun whose bastion stands on this square, if one does. */
  gunAt(c: number, r: number): number { return this.guns.findIndex((t) => t.at[0] === c && t.at[1] === r); }
  /** Within gun g's reach (squares, any way). */
  reaches(g: number, c: number, r: number): boolean { return this.guns[g].reaches(c, r); }
  /** Gun g can fire: not wrecked, nor quietened by a hit. */
  live(g: number): boolean { return this.guns[g].live(); }
  /** Every gun wrecked: the way through is safe. */
  silenced(): boolean { return this.guns.every((t) => t.wrecked); }
  /** Gun g hit by her guns (see Turret.hit): it's a fight now, for all of them. */
  hit(g: number): 'quiet' | 'wrecked' | null {
    this.roused = true;
    return this.guns[g].hit();
  }

  /** `ship`: where she is now (Helm.now), or null when it shouldn't fire on her (she's not out, or
      Helm.spared: dazed, or just patched). Each gun fires on her when she's on one of its marks,
      unless it's hit her already; and, once roused, anywhere in its reach. Shots in the air still
      come down, a wreck's too. */
  tick(dt: number, ship: { c: number; r: number } | null): GunEvent[] {
    return this.guns.flatMap((t, gun) => t.tick(dt, this.scored[gun] && !t.roused ? null : ship).map((e) => {
      if (e.kind === 'land' && e.hit) this.scored[gun] = true;
      return { ...e, gun };
    }));
  }
}

/** The checkpoint: its guns, and which side of it she's on. */
export class Checkpoint {
  readonly battery = new Battery();
  /** The side of it she's on: the near side (the cove's) or beyond it, clear of its marks. */
  side: 'near' | 'far' = 'near';
  /** Holed under its guns since she last crossed (or was out of their sight). */
  hits = 0;
  private crossed: number | 'whirl' | null = null;
  private sighted = false;

  /** Holed by one of its guns. */
  holed() { this.hits++; }
  /** Kikkit's whirlpools have had her and spat her back to her island (src/den-kikkit.ts): if that
      takes her back across, it was by the whirlpools. */
  whirled() { this.crossed = 'whirl'; }

  /** A shot of hers came down on (c, r): on a gun's bastion, a hit on that gun; on the gatehouse,
      only stone. Either way it's a fight now (see Battery.roused). Null if it isn't the
      checkpoint's. */
  shot(c: number, r: number): ShotAt | null {
    const K = LAY.CHECKPOINT, g = this.battery.gunAt(c, r);
    const gate = K.PIERS.some(([pc, pr]) => pc === c && pr === r);
    if (g < 0 && !gate) return null;
    const first = !this.battery.roused;
    this.battery.roused = true;
    return g >= 0 ? { on: 'gun', gun: g, did: this.battery.hit(g), first } : { on: 'gatehouse', first };
  }

  /** Her square now (Helm.pose, after each tick): whether she's sighted it, or got through. */
  watch(p: { c: number; r: number }): CheckEvent[] {
    const out: CheckEvent[] = [], K = LAY.CHECKPOINT;
    const near = Math.max(Math.abs(p.c - K.GATE), Math.abs(p.r - K.ROW));
    if (!this.sighted && near <= CHECK.SIGHT) {
      this.sighted = true;
      out.push({ kind: 'sighted' });
    }
    if (near > CHECK.SIGHT + 1) {
      this.hits = 0;
      this.battery.scored.fill(false);
      if (this.battery.roused) { this.battery.roused = false; out.push({ kind: 'calm' }); }
    }
    // Through once she's past every mark (so "not a scratch on her" is so), crossing the line at the
    // gate or down the locks through the headland.
    if (p.r === K.ROW) this.crossed = LAY.KIKKIT.PASSAGE.some(([c, r]) => c === p.c && r === p.r) ? 'whirl' : p.c;
    const rows = CHECK.MARKS.flat().map((m) => m[1]);
    const side = p.r < Math.min(...rows) ? 'near' : p.r > Math.max(...rows) ? 'far' : this.side;
    if (side !== this.side) {
      out.push({ kind: 'through', how: this.crossed === K.GATE ? 'gate' : this.crossed === 'whirl' ? 'whirlpools' : 'locks', back: side === 'near', hits: this.hits });
      this.side = side;
      this.hits = 0;
    }
    return out;
  }
}

/** Whether a square is the checkpoint's (its piers, its bastions). */
export function isCheckpoint(sea: Sea, c: number, r: number): boolean {
  const K = LAY.CHECKPOINT;
  return sea.works.has(`${c},${r}`) && r === K.ROW && c >= K.GUNS[0][0] && c <= K.GUNS[K.GUNS.length - 1][0];
}

/** The den's word when she's through. */
export function throughSay(e: Extract<CheckEvent, { kind: 'through' }>): string {
  if (e.how === 'locks') return e.back ? 'Back round the checkpoint by the locks, and they never saw her' : 'Round the checkpoint by the locks, and they never saw her! The open sea beyond';
  if (e.how === 'whirlpools') return e.back ? '' : 'Out past the checkpoint, and they never saw her: through the reef by the whirlpools';
  const head = e.back ? 'Back through the checkpoint!' : 'Through the checkpoint!';
  if (!e.hits) return `${head} Not a scratch on her`;
  return `${head} Holed ${e.hits === 1 ? 'once' : e.hits === 2 ? 'twice' : `${e.hits} times`}, patched, and through`;
}
