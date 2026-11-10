/* Pirate Den: a destructible gun at sea, the one module for every gun that shoots at her. TypeScript,
   compiled to js/den-turret.js; tested in tests/den-turret.test.ts. js/den/turret.js draws one (the
   gun, being hit, the toppling, the smoking stump); a place puts one down and sets it up: the
   imperial checkpoint's two bastion guns are two of these (src/den-checkpoint.ts), and so was the
   turret on a rock near the den, the first (9 Nov, gone 10 Nov: the checkpoint is "the evolution of
   it"). Future turrets plug in the same way.

   The user (10 Nov): "that should just be really dead easy because there should be an object for a
   destructible turret. We shouldn't have to be recoding something. It should just be there to plug
   in."

   The rules, as the turret's were (9 Nov):
   - In reach (squares, any way), it fires on the square she's on; the shot's in the air a while
     (time to get out from under it), so a ship under way is often gone when it comes down: "you can
     shoot, but there's no guarantee". Still there, she's hit (holed: patched by Carpentry).
   - Or it can be trained on marks, squares it fires on whenever she's on one, the shot down quicker
     (the checkpoint's: stop on one and she's hit). A gun that's only `alert` once she's fired on it
     keeps to its marks till then.
   - A hit from her guns quietens it a while; the third wrecks it for good ("it obviously needs to be
     destructible"). Its last shots in the air still come down.
   - It holds fire while she's dazed or in the lock, and a while after she's patched (Helm.spared:
     the caller passes no ship then; 9 Nov: it fired again "literally before you can do anything
     about it"). */

export const TURRET = {
  /** How far it reaches to fire on her square (squares, any way). */
  REACH: 3,
  /** Seconds a shot fired on her square is in the air, and to load again after one. */
  FLIGHT: 1.4,
  RELOAD: 4,
  /** Seconds a shot on a mark takes to come down, and to load again after one. */
  MARK_FLIGHT: 0.9,
  MARK_RELOAD: 2.5,
  /** A hit from her guns quietens it this many seconds; this many hits wreck it for good. */
  QUIET: 10,
  WRECK: 3,
};

/** How one's set up where it's placed (anything left out is TURRET's). */
export interface TurretSpec {
  /** The square it stands on. */
  at: [number, number];
  reach?: number;
  /** Squares it's trained on (none: it only fires on her square). */
  marks?: [number, number][];
  /** Fires on her square from the start (a turret on a rock), or only once she's fired on it
      (the checkpoint's guns: off their marks they leave her be till it's a fight). */
  alert?: boolean;
  flight?: number;
  reload?: number;
  markFlight?: number;
  markReload?: number;
  quiet?: number;
  wreck?: number;
}

/** A shot fired on a square (on a mark, or `aimed` at her), and how long it's in the air; or coming
    down, on her or not. */
export type TurretEvent =
  | { kind: 'fire'; to: [number, number]; aimed: boolean; secs: number }
  | { kind: 'land'; to: [number, number]; hit: boolean; aimed: boolean };

const same = (a: [number, number], b: [number, number]) => a[0] === b[0] && a[1] === b[1];

export class Turret {
  readonly at: [number, number];
  readonly reach: number;
  readonly marks: [number, number][];
  /** Firing on her square, wherever she's in reach: from the start if it's set up `alert`, or once
      she's fired on it (rouse). */
  roused: boolean;
  /** Seconds till it's loaded; seconds it's still quiet after a hit. */
  wait = 1;
  quiet = 0;
  /** Hits from her guns so far; wrecked, silent for good, at its `wreck`. */
  hits = 0;
  wrecked = false;
  /** Shots in the air: where each comes down, when, and whether it was aimed at her. */
  shots: { to: [number, number]; t: number; aimed: boolean }[] = [];
  private cfg: Required<Omit<TurretSpec, 'at' | 'marks' | 'alert'>>;

  constructor(spec: TurretSpec) {
    this.at = [spec.at[0], spec.at[1]];
    this.marks = (spec.marks ?? []).map(([c, r]) => [c, r] as [number, number]);
    this.roused = spec.alert ?? true;
    this.reach = spec.reach ?? TURRET.REACH;
    this.cfg = {
      reach: this.reach, flight: spec.flight ?? TURRET.FLIGHT, reload: spec.reload ?? TURRET.RELOAD,
      markFlight: spec.markFlight ?? TURRET.MARK_FLIGHT, markReload: spec.markReload ?? TURRET.MARK_RELOAD,
      quiet: spec.quiet ?? TURRET.QUIET, wreck: spec.wreck ?? TURRET.WRECK,
    };
    if (this.marks.length) this.wait = 0;
  }

  /** Within its reach (squares, any way). */
  reaches(c: number, r: number): boolean { return Math.max(Math.abs(c - this.at[0]), Math.abs(r - this.at[1])) <= this.reach; }
  /** Trained on this square. */
  trained(c: number, r: number): boolean { return this.marks.some((m) => m[0] === c && m[1] === r); }
  /** Can fire: not wrecked, nor quietened by a hit. */
  live(): boolean { return !this.wrecked && this.quiet <= 1e-9; }
  /** Hits still to come before it's wrecked. */
  left(): number { return Math.max(0, this.cfg.wreck - this.hits); }

  /** She's fired on it: from now on it fires on her square wherever she's in reach. */
  rouse() { this.roused = true; }
  /** Hit by her guns: quiet a while or, the last hit, wrecked for good. It's roused either way.
      What the hit did (null if it's a wreck already). */
  hit(): 'quiet' | 'wrecked' | null {
    this.rouse();
    if (this.wrecked) return null;
    if (++this.hits < this.cfg.wreck) { this.quiet = this.cfg.quiet; return 'quiet'; }
    this.wrecked = true; this.quiet = 0;
    return 'wrecked';
  }

  /** `ship`: where she is now (Helm.now), or null when it shouldn't fire on her (she's not out, or
      Helm.spared: dazed, at the lock, or just patched). Fires on her square if she's on one of its
      marks, or (roused) anywhere in its reach, when it's loaded and can fire; shots in the air come
      down whatever. */
  tick(dt: number, ship: { c: number; r: number } | null): TurretEvent[] {
    const out: TurretEvent[] = [];
    this.quiet = Math.max(0, this.quiet - dt);
    this.wait = Math.max(0, this.wait - dt);
    const at: [number, number] | null = ship ? [Math.round(ship.c), Math.round(ship.r)] : null;
    for (const s of this.shots) s.t -= dt;
    for (const s of this.shots.filter((x) => x.t <= 1e-9)) out.push({ kind: 'land', to: s.to, hit: !!at && same(at, s.to), aimed: s.aimed });
    this.shots = this.shots.filter((x) => x.t > 1e-9);
    if (!at || !this.live() || this.wait > 1e-9) return out;
    const onMark = this.trained(...at);
    if (!onMark && !(this.roused && this.reaches(...at))) return out;
    const aimed = !onMark, secs = aimed ? this.cfg.flight : this.cfg.markFlight;
    this.wait = aimed ? this.cfg.reload : this.cfg.markReload;
    this.shots.push({ to: [at[0], at[1]], t: secs, aimed });
    out.push({ kind: 'fire', to: [at[0], at[1]], aimed, secs });
    return out;
  }
}
