/* Pirate Den: a blockade, a proof of concept, kept close to Puzzle Pirates' (YPPedia: "Blockades", "Buoy"). TypeScript,
   compiled to js/blockade.js; tested in tests/blockade.test.ts; its bots src/blockade-bots.ts; drawn by
   js/den/blockade.js on the unlinked blockade-test.html. BLOCKADE.md is its design.

   The user (15 Nov): "go study blockading and how blockade boards look, because I think we're ready to do a nice kind
   of blockading concept here, where you've got sideways for the sloops and you've got a few bots ... competing,
   trying to get to the points. The [war frig] bots are there trying to blast their way through while the sloops are
   more nimble, taking the shortcuts, taking those sideways in, just like winds and things now. Keep it like
   relatively close. Don't do all like the new mechanics." So, as a blockade board is:
   - a big sea board with rocks and winds, and buoys of one to three pennants. At the end of each blockade turn a
     buoy inside the influence circle of one side's ships only scores that side its pennants; a buoy both sides
     reach is contested and scores nobody. A bigger ship's circle is bigger. The side with the most points when the
     round's out wins it;
   - two sides, each a war frigate and two sloops (one of them yours to sail, the rest bots), coming in from the
     sea's foot;
   - the heart of the board, its best buoys, behind a wall of rocks across it with three ways in: the imperial gate
     in the middle, one square wide, which a frigate has to crumble a tower of to get through (src/imperial-gate.ts;
     "a way of naturally delaying the war [frigs]"), its bastion guns firing on anyone once it's fired on; and a
     side way at each flank, a one-square gap with a wind blowing in through it that carries a sloop through fast
     and that a frigate rides out ("sideways ... that only the sloops can really get to on those fast little
     winds");
   - every ship's damage as Puzzle Pirates keeps it (src/ship-damage.ts): holes where she's shot, water in her
     bilge slowing her, her crew patching and pumping; at full damage she's knocked out, dead in the water, till
     they've rebuilt her (a non-sinking blockade's way). */
import type { Move, Pose, SailEvent } from './den-sail.js';
import { ShipSea, ShipHelm, Guns, broadside, squares, SLOOP_HANDLING, FRIGATE_HANDLING, type Handling, type Side, type Shot } from './ship-handling.js';
import { SLOOP, WAR_FRIGATE, type ShipClass } from './ships.js';
import { Gate } from './imperial-gate.js';
import { Turret, type TurretEvent } from './den-turret.js';
import { Damage, struck, type Hole, type DamageEvent } from './ship-damage.js';

const key = (c: number, r: number) => `${c},${r}`;

export type Kind = 'sloop' | 'frigate';
export type TeamId = 'gold' | 'crimson';
export interface Lane { at: [number, number]; d: number; n: number }
export interface Buoy { at: [number, number]; pennants: 1 | 2 | 3 }

/** The board (c across, r out from the foot where both sides come in). */
export const BLOCKADE = {
  COLS: 30,
  ROWS: 28,
  /** The wall of rocks across the board, two deep, between the open sea and its heart. */
  WALL: { r0: 14, r1: 15 },
  /** The imperial gate in the middle of it, its one-square way (its towers two wide either side: src/imperial-gate.ts),
      and its bastion guns on the wall. */
  GATE: { WAY: 15, GUNS: [[11, 14], [19, 14]] as [number, number][] },
  /** The side ways: a one-square gap in the wall at each flank. */
  SIDEWAYS: [2, 27],
  /** The winds (the way each blows: 0 up the board, 1 right, 2 down, 3 left; n squares from `at`): one up through
      each side way from the open sea into the heart, and one along the heart from each toward its middle. A sloop
      on one is carried along it; a frigate rides them out. */
  WINDS: [
    { at: [2, 8], d: 0, n: 11 }, { at: [27, 8], d: 0, n: 11 },
    { at: [3, 19], d: 1, n: 5 }, { at: [26, 19], d: 3, n: 5 },
  ] as Lane[],
  /** Rocks about the board (besides the wall). */
  ROCKS: [
    [5, 4], [6, 4], [24, 4], [23, 4], [8, 9], [9, 9], [21, 9], [22, 9], [4, 11], [26, 11], [1, 12], [28, 12],
    [11, 18], [19, 18], [6, 23], [7, 23], [23, 23], [22, 23], [14, 25], [16, 25], [1, 21], [28, 21],
  ] as [number, number][],
  /** The buoys: out on the open sea, one or two pennants; in the heart, two, and the gate's prize, three. */
  BUOYS: [
    { at: [6, 8], pennants: 1 }, { at: [15, 9], pennants: 2 }, { at: [24, 8], pennants: 1 },
    { at: [7, 20], pennants: 2 }, { at: [15, 22], pennants: 3 }, { at: [23, 20], pennants: 2 },
  ] as Buoy[],
  /** Squares from any of her squares a ship's influence reaches, by her size (YPPedia: "different sized ships
      have different sized influence circles"). */
  INFLUENCE: { sloop: 2, frigate: 3.5 } as Record<Kind, number>,
  /** Seconds a blockade turn, scored at its end, and a round. */
  TURN: 10,
  ROUND: 300,
  /** The sides, and their ships: where each comes in, bows up the board. */
  TEAMS: [
    { id: 'gold', name: 'Dachimpy\'s flag', ships: [
      { name: 'Primates Rule', kind: 'frigate', at: { c: 8, r: 2, d: 0 } },
      { name: 'Lucky Banana', kind: 'sloop', at: { c: 3, r: 1, d: 0 } },
      { name: 'Grin and Bear It', kind: 'sloop', at: { c: 12, r: 1, d: 0 } },
    ] },
    { id: 'crimson', name: 'Dalnoth\'s flag', ships: [
      { name: 'Iron Pride', kind: 'frigate', at: { c: 22, r: 2, d: 0 } },
      { name: 'Red Wake', kind: 'sloop', at: { c: 26, r: 1, d: 0 } },
      { name: 'Smoke and Mirrors', kind: 'sloop', at: { c: 18, r: 1, d: 0 } },
    ] },
  ] as { id: TeamId; name: string; ships: { name: string; kind: Kind; at: Pose }[] }[],
  /** The gate's guns' size. */
  GATE_GUNS: 'medium' as const,
};

const HANDLINGS: Record<Kind, Handling> = { sloop: SLOOP_HANDLING, frigate: FRIGATE_HANDLING };
const CLASSES: Record<Kind, ShipClass> = { sloop: SLOOP, frigate: WAR_FRIGATE };

/** One ship in the blockade: her side, her handling, her own sea (her size, the winds if she's small enough,
    every other ship in her way), helm, guns and damage. */
export interface Ship {
  id: number; name: string; team: TeamId; kind: Kind; h: Handling; cls: ShipClass;
  sea: ShipSea; helm: ShipHelm; guns: Guns; dmg: Damage;
}

/** What a broadside stopped at: a rock, a gate's tower, one of the gate's guns, or a ship (her id). */
export type Stop = { what: 'rock' } | { what: 'tower'; i: number } | { what: 'gun'; i: number } | { what: 'ship'; id: number };
export interface FiredShot extends Shot<Stop> { got?: 'hit' | 'crumbled' | 'bounced' | 'quiet' | 'wrecked'; hole?: Hole; out?: boolean }
export interface Fired { ship: number; side: Side; shots: FiredShot[] }
/** A buoy's state just now: whose (the one side influencing it), contested, or nobody's. */
export type Hold = TeamId | 'contested' | null;
export type Ticked = { sail: Map<number, SailEvent[]>; damage: Map<number, DamageEvent[]>; guns: { gun: number; e: TurretEvent; hit: number | null; hole?: Hole }[]; scored: boolean };

export class Blockade {
  rocks = new Set<string>();
  wind = new Map<string, number>();
  gate = new Gate(BLOCKADE.GATE.WAY, BLOCKADE.WALL.r0, BLOCKADE.WALL.r1);
  battery: Turret[] = BLOCKADE.GATE.GUNS.map((at) => new Turret({ at, alert: false }));
  ships: Ship[] = [];
  score: Record<TeamId, number> = { gold: 0, crimson: 0 };
  /** Seconds into the round, and into this blockade turn. */
  clock = 0;
  turnT = 0;
  over = false;
  /** Every broadside fired since whoever draws them last took them (anyone's: a bot's or yours). */
  fired: Fired[] = [];
  private seen = new Map<number, string>();
  /** Each square a ship covers just now, and whose (kept as they move: notice). */
  private taken = new Map<string, number>();

  constructor() {
    const B = BLOCKADE;
    for (let c = 0; c < B.COLS; c++) for (let r = B.WALL.r0; r <= B.WALL.r1; r++) if (c !== B.GATE.WAY && !B.SIDEWAYS.includes(c)) this.rocks.add(key(c, r));
    for (const [c, r] of B.ROCKS) this.rocks.add(key(c, r));
    for (const { at: [c, r], d, n } of B.WINDS) for (let i = 0; i < n; i++) this.wind.set(key(c + [0, 1, 0, -1][d] * i, r + [1, 0, -1, 0][d] * i), d);
    let id = 0;
    for (const team of B.TEAMS) for (const s of team.ships) {
      const h = HANDLINGS[s.kind], me = id++;
      const sea = new ShipSea(h, B.COLS, B.ROWS, this.rocks, (c, r) => { const o = this.taken.get(key(c, r)); return o !== undefined && o !== me; });
      if (s.kind === 'sloop') sea.carriedBy(this.wind);
      this.ships.push({ id: me, name: s.name, team: team.id, kind: s.kind, h, cls: CLASSES[s.kind], sea, helm: new ShipHelm(sea, { ...s.at }), guns: new Guns(h.reload), dmg: new Damage(CLASSES[s.kind]) });
    }
    this.notice();
  }

  ship(id: number): Ship { return this.ships[id]; }
  /** The ship on this square, if one is. */
  under(c: number, r: number): Ship | null { const o = this.taken.get(key(c, r)); return o === undefined ? null : this.ships[o]; }

  /** Everything a tick on: each ship's helm and crew, the gate's guns, the blockade turn's scoring. */
  tick(dt: number): Ticked {
    const out: Ticked = { sail: new Map(), damage: new Map(), guns: [], scored: false };
    if (this.over) return out;
    for (const s of this.ships) {
      const ev = s.dmg.tick(dt);
      if (ev.some((e) => e.kind === 'back')) s.helm.hole = null;
      s.sea.drag = s.dmg.drag();
      out.damage.set(s.id, ev);
      out.sail.set(s.id, s.helm.tick(dt));
      s.guns.tick(dt);
      this.notice();
    }
    this.battery.forEach((g, i) => {
      for (const e of g.tick(dt, this.gunTarget(g))) {
        const hit = e.kind === 'land' ? this.under(...e.to) : null;
        let hole: Hole | undefined;
        if (hit) hole = this.hurt(hit, BLOCKADE.GATE_GUNS, e.to, g.at).hole;
        out.guns.push({ gun: i, e, hit: hit?.id ?? null, hole });
      }
    });
    this.clock += dt;
    if ((this.turnT += dt) >= BLOCKADE.TURN) { this.turnT -= BLOCKADE.TURN; this.scoreTurn(); out.scored = true; }
    if (this.clock >= BLOCKADE.ROUND) this.over = true;
    return out;
  }
  /** The ship a gate's gun fires on: the nearest square of any in its reach, not knocked out. */
  private gunTarget(g: Turret): { c: number; r: number } | null {
    let best: [number, number] | null = null, far = Infinity;
    for (const s of this.ships) {
      if (s.dmg.out) continue;
      for (const id of s.helm.covers()) {
        const [c, r] = id.split(',').map(Number), d = Math.max(Math.abs(c - g.at[0]), Math.abs(r - g.at[1]));
        if (g.reaches(c, r) && d < far) { far = d; best = [c, r]; }
      }
    }
    return best && { c: best[0], r: best[1] };
  }
  /** Where any ship's moved to, every other's pilot works her way out afresh. */
  notice() {
    let moved = false;
    for (const s of this.ships) {
      const sig = [...s.helm.covers()].sort().join(' ');
      if (sig !== this.seen.get(s.id)) { this.seen.set(s.id, sig); moved = true; for (const o of this.ships) if (o !== s) o.sea.touch(); }
    }
    if (!moved && this.taken.size) return;
    this.taken.clear();
    for (const s of this.ships) for (const k of s.helm.covers()) this.taken.set(k, s.id);
  }

  /** A ship's influence reaches this buoy: within her circle of any square of hers, and she's not knocked out. */
  reaches(s: Ship, b: Buoy): boolean {
    if (s.dmg.out) return false;
    const R = BLOCKADE.INFLUENCE[s.kind];
    return squares(s.h, s.helm.pose).some(([c, r]) => Math.hypot(c - b.at[0], r - b.at[1]) <= R + 1e-9);
  }
  /** Whose a buoy is just now. */
  hold(b: Buoy): Hold {
    const teams = new Set(this.ships.filter((s) => this.reaches(s, b)).map((s) => s.team));
    return teams.size === 0 ? null : teams.size > 1 ? 'contested' : [...teams][0];
  }
  /** The end of a blockade turn: each buoy one side alone holds scores it the buoy's pennants. */
  scoreTurn() {
    for (const b of BLOCKADE.BUOYS) { const h = this.hold(b); if (h === 'gold' || h === 'crimson') this.score[h] += b.pennants; }
  }
  /** Who's ahead (null while it's level). */
  leader(): TeamId | null { return this.score.gold === this.score.crimson ? null : this.score.gold > this.score.crimson ? 'gold' : 'crimson'; }

  /** What a shot of `from`'s stops at on this square. */
  stopAt(from: Ship, c: number, r: number): Stop | null {
    const t = this.gate.towerAt(c, r);
    if (t >= 0) return { what: 'tower', i: t };
    const g = this.battery.findIndex((x) => x.at[0] === c && x.at[1] === r);
    if (g >= 0) return this.battery[g].wrecked ? { what: 'rock' } : { what: 'gun', i: g };
    if (this.rocks.has(key(c, r))) return { what: 'rock' };
    const s = this.under(c, r);
    return s && s !== from ? { what: 'ship', id: s.id } : null;
  }
  /** Her broadside out of that side as it would fly now (or lying at `at`), without firing it (a bot's look
      before it fires). */
  aim(id: number, side: Side, at?: Pose): Shot<Stop>[] {
    this.notice();   // (where everyone is now, if they've been moved by hand)
    const s = this.ship(id), from = at ? { c: at.c, r: at.r, a: at.d } : s.helm.now();
    return broadside(s.h, from, side, (c, r) => this.stopAt(s, c, r));
  }

  /** A ship struck by a shot of that size on that square, fired from `from`: her hole, there. */
  private hurt(s: Ship, gun: Handling['guns'], at: [number, number], from: [number, number]): { hole: Hole; out: boolean } {
    const where = struck(s.helm.pose, s.h.long, at, from), got = s.dmg.hit(gun, where.along, where.side);
    if (got.out) s.helm.hit();   // (dead in the water: held till she's rebuilt)
    return got;
  }

  /** Fire a ship's broadside out of that side, if it's loaded and she's not knocked out (null if not). */
  fire(id: number, side: Side): Fired | null {
    const s = this.ship(id);
    if (s.dmg.out || !s.guns.fire(side)) return null;
    const shots: FiredShot[] = this.aim(id, side).map((shot) => {
      const w = shot.what;
      if (!w || w.what === 'rock') return shot;
      if (w.what === 'tower') {
        const got = this.gate.towers[w.i].hit(s.h.guns);
        if (got === 'crumbled') { for (const [c, r] of this.gate.towers[w.i].squares) this.rocks.delete(key(c, r)); for (const o of this.ships) o.sea.touch(); }
        return { ...shot, got: got ?? undefined };
      }
      if (w.what === 'gun') return { ...shot, got: this.battery[w.i].hit() ?? undefined };
      const { hole, out } = this.hurt(this.ship(w.id), s.h.guns, shot.hit!, shot.from);
      return { ...shot, got: 'hit', hole, out };
    });
    if (shots.some((x) => x.what?.what === 'tower' || x.what?.what === 'gun')) for (const g of this.battery) g.rouse();
    const got = { ship: id, side, shots };
    this.fired.push(got);
    if (this.fired.length > 64) this.fired.shift();   // (nobody drawing them: kept short)
    return got;
  }

  drop(id: number, c: number, r: number): [number, number] | null { return this.ship(id).helm.drop(c, r); }
  put(id: number, m: Move): boolean { return this.ship(id).helm.put(m); }
  /** In the heart of the board, past the wall. */
  inHeart(s: Ship): boolean { return s.helm.pose.r > BLOCKADE.WALL.r1; }
}
