/* Pirate Den: a blockade, a proof of concept, kept close to Puzzle Pirates' (YPPedia: "Blockades", "Buoy"). TypeScript,
   compiled to js/blockade.js; tested in tests/blockade.test.ts; its bots src/blockade-bots.ts; drawn by
   js/den/blockade.js on the unlinked blockade-test.html. BLOCKADE.md is its design.

   The user (15 Nov): "go study blockading and how blockade boards look ... where you've got sideways for the sloops and
   you've got a few bots ... competing, trying to get to the points. The [war frig] bots are there trying to blast
   their way through while the sloops are more nimble, taking the shortcuts, taking those sideways in, just like winds
   and things now. Keep it like relatively close. Don't do all like the new mechanics." And then: "blockading is a bit
   more epic. So you'd maybe have ... a good handful of sloops each side and ... three or four [war frigs] ... coming
   from different directions ... Some ocean, some island ... you should see sloops hiding out, sometimes coming out ...
   while [war frigs] are having a fight to land a few pot shots." So, as a blockade board is:
   - a big sea board with rocks, islands and winds, and buoys of one to three pennants. At the end of each blockade
     turn a buoy inside the influence circle of one side's ships only scores that side its pennants; a buoy both
     sides reach is contested and scores nobody. A bigger ship's circle is bigger. The side with the most points
     when the round's out wins it;
   - two sides, three war frigates and five sloops each (one of them yours to sail if you like, the rest bots),
     coming in from two edges each: Dachimpy's from the south and west, Dalnoth's from the north and east;
   - the heart of the board, its best buoys, inside a walled fort in the middle: an imperial gate in its south wall
     and another in its north, one square wide, which a frigate has to crumble a tower of to get through
     (src/imperial-gate.ts: "a way of naturally delaying the war [frigs]"), four bastion guns on each firing on anyone
     who lingers under them, and on anyone at all once their gate's fired on; and a side way through its west wall and its east, a one-square gap with a wind blowing
     in through it that carries a sloop through fast and that a frigate rides out ("sideways ... that only the sloops
     can really get to on those fast little winds");
   - islands out on the open sea, each with a cove in it a sloop can hide in, one square in by a narrow way no
     frigate fits, its rocks between her and anyone's guns;
   - every ship's damage as Puzzle Pirates keeps it (src/ship-damage.ts): holes where she's shot, water in her
     bilge slowing her, her crew patching and pumping; at full damage she's knocked out, dead in the water, till
     they've rebuilt her; shot on while she's out, she sinks, and comes back a while later from her side's own edge
     of the board, to fight her way back in (the user, 15 Nov: "oh, look, we've lost control of the central area,
     we've got to get back in there again. And that sense of working your way back in would be lost if you can't
     [sink] at all"). */
import type { Move, Pose, SailEvent } from './den-sail.js';
import { ShipSea, ShipHelm, Guns, broadside, squares, SLOOP_HANDLING, FRIGATE_HANDLING, type Handling, type Side, type Shot } from './ship-handling.js';
import { HullChart } from './hull-chart.js';
import { SLOOP, WAR_FRIGATE, type ShipClass } from './ships.js';
import { Gate } from './imperial-gate.js';
import { Turret, type TurretEvent } from './den-turret.js';
import { Damage, struck, type Hole, type DamageEvent } from './ship-damage.js';

const key = (c: number, r: number) => `${c},${r}`;

export type Kind = 'sloop' | 'frigate';
export type TeamId = 'gold' | 'crimson';
export interface Lane { at: [number, number]; d: number; n: number }
export interface Buoy { at: [number, number]; pennants: 1 | 2 | 3 }
export interface Rect { c0: number; c1: number; r0: number; r1: number }
/** An island: its land, and the cove in it (`cove`, the square a sloop hides on, open to the sea by `way`). */
export interface Island extends Rect { cove: [number, number]; way: [number, number][] }
/** A ship of a side's fleet: her name, kind, where she comes in, and (a sloop) whether her bot's a raider. */
export interface FleetShip { name: string; kind: Kind; at: Pose; raider?: boolean }

/** The board (c across, r up from the south edge). */
export const BLOCKADE = {
  COLS: 44,
  ROWS: 36,
  /** The fort's walls, two deep, round the heart. */
  WALLS: [
    { c0: 14, c1: 29, r0: 12, r1: 13 }, { c0: 14, c1: 29, r0: 22, r1: 23 },
    { c0: 14, c1: 15, r0: 12, r1: 23 }, { c0: 28, c1: 29, r0: 12, r1: 23 },
  ] as Rect[],
  /** The heart, inside them. */
  HEART: { c0: 16, c1: 27, r0: 14, r1: 21 } as Rect,
  /** The imperial gates: each one's way (its column), its wall's rows, its bastion guns on the wall, four, doubled up
      (15 Nov: "I do love watching the imperial [cannons] ... training on people's positions, especially punishing people
      camping. I almost partly think that we need to double up on the [cannons] ... stop people camping. And provide
      more of a barrier to the war frigates"): two by the gate's towers, two further along. */
  GATES: [
    { way: 21, r0: 12, r1: 13, guns: [[16, 12], [18, 12], [24, 12], [26, 12]] as [number, number][] },
    { way: 22, r0: 22, r1: 23, guns: [[17, 23], [19, 23], [25, 23], [27, 23]] as [number, number][] },
  ],
  /** Seconds a ship lingers in a gate gun's reach before it fires on her, roused or not: camping there's punished;
      slipping past isn't, mostly; charging through a fallen gate under its guns costs her. */
  CAMP: 4,
  /** The side ways: a one-square gap through the west wall and the east. */
  SIDEWAYS: [[14, 18], [15, 18], [28, 17], [29, 17]] as [number, number][],
  /** The winds (the way each blows: 0 up the board, 1 right, 2 down, 3 left; n squares from `at`): one in through
      each side way from the open sea into the heart. A sloop on one is carried along it; a frigate rides them out. */
  WINDS: [{ at: [5, 18], d: 1, n: 13 }, { at: [38, 17], d: 3, n: 13 }] as Lane[],
  /** The islands, each with its cove. */
  ISLANDS: [
    { c0: 5, c1: 9, r0: 4, r1: 8, cove: [7, 6], way: [[7, 7], [7, 8]] },
    { c0: 34, c1: 38, r0: 4, r1: 8, cove: [36, 6], way: [[36, 7], [36, 8]] },
    { c0: 5, c1: 9, r0: 27, r1: 31, cove: [7, 29], way: [[7, 28], [7, 27]] },
    { c0: 34, c1: 38, r0: 27, r1: 31, cove: [36, 29], way: [[36, 28], [36, 27]] },
  ] as Island[],
  /** Each side's corner of the sea, where her sloops can lie out of the fighting too when the coves are full. */
  HOMES: { gold: [[0, 0], [3, 0], [0, 3]], crimson: [[43, 35], [40, 35], [43, 32]] } as Record<TeamId, [number, number][]>,
  /** Rocks about the open sea and the heart. */
  ROCKS: [
    [12, 7], [13, 7], [30, 7], [31, 7], [12, 28], [13, 28], [30, 28], [31, 28], [21, 4], [22, 31], [2, 24], [41, 11],
    [18, 20], [25, 15],
  ] as [number, number][],
  /** The buoys: in the heart two, and its prize three; out on the open sea, two off each gate and one by each island. */
  BUOYS: [
    { at: [21, 17], pennants: 3 }, { at: [18, 15], pennants: 2 }, { at: [25, 20], pennants: 2 },
    { at: [21, 8], pennants: 2 }, { at: [22, 27], pennants: 2 },
    { at: [11, 10], pennants: 1 }, { at: [32, 10], pennants: 1 }, { at: [11, 25], pennants: 1 }, { at: [32, 25], pennants: 1 },
  ] as Buoy[],
  /** Squares from any of her squares a ship's influence reaches, by her size (YPPedia: "different sized ships
      have different sized influence circles"). */
  INFLUENCE: { sloop: 2, frigate: 3.5 } as Record<Kind, number>,
  /** Seconds a blockade turn, scored at its end, and a round. */
  TURN: 10,
  ROUND: 360,
  /** The sides, and their fleets: where each ship comes in (a frigate's config by her name: src/den-frigate.ts). */
  TEAMS: [
    { id: 'gold', name: 'Dachimpy\'s flag', ships: [
      { name: 'Primates Rule', kind: 'frigate', at: { c: 13, r: 2, d: 0 } },
      { name: 'Coral Throne', kind: 'frigate', at: { c: 29, r: 2, d: 0 } },
      { name: 'Golden Grin', kind: 'frigate', at: { c: 2, r: 14, d: 1 } },
      { name: 'Lucky Banana', kind: 'sloop', at: { c: 4, r: 1, d: 0 }, raider: true },
      { name: 'Grin and Bear It', kind: 'sloop', at: { c: 20, r: 1, d: 0 } },
      { name: 'Cheeky Monkey', kind: 'sloop', at: { c: 24, r: 1, d: 0 } },
      { name: 'Bananarama', kind: 'sloop', at: { c: 1, r: 21, d: 1 }, raider: true },
      { name: 'Coconut Shy', kind: 'sloop', at: { c: 1, r: 10, d: 1 } },
    ] },
    { id: 'crimson', name: 'Dalnoth\'s flag', ships: [
      { name: 'Iron Pride', kind: 'frigate', at: { c: 14, r: 33, d: 2 } },
      { name: 'Eldritch Wail', kind: 'frigate', at: { c: 30, r: 33, d: 2 } },
      { name: 'Crimson Tide', kind: 'frigate', at: { c: 41, r: 21, d: 3 } },
      { name: 'Red Wake', kind: 'sloop', at: { c: 39, r: 34, d: 2 }, raider: true },
      { name: 'Smoke and Mirrors', kind: 'sloop', at: { c: 19, r: 34, d: 2 } },
      { name: 'Scarlet Fever', kind: 'sloop', at: { c: 23, r: 34, d: 2 } },
      { name: 'Blood Orange', kind: 'sloop', at: { c: 42, r: 14, d: 3 }, raider: true },
      { name: 'Rust Bucket', kind: 'sloop', at: { c: 42, r: 26, d: 3 } },
    ] },
  ] as { id: TeamId; name: string; ships: FleetShip[] }[],
  /** How near (squares) a ship has to be to another for her moving to make the other's pilot think again. */
  NEAR: 8,
  /** How near (squares) another ship has to be to be in a ship's way, as her pilot works it out: one further off will
      have moved by the time she's there (inside NEAR, so a ship in her way moving always makes her think again). */
  IN_WAY: 5,
  /** The gates' guns' size. */
  GATE_GUNS: 'medium' as const,
  /** A sinking blockade: a ship shot on while she's knocked out sinks (src/ship-damage.ts, SINK), and comes back
      this many seconds later where she came in at the start, refitted. */
  SINKING: true,
  RETURN: 25,
  /** The brawl to watch (blockade-test.html?watch=brawl, 15 Nov: "I want to see two of the big ships really having a
      brawl and fighting it out to see what that damage looks like"; "That needs to be like one of the shortcuts so
      people can actually see a cinematic of the blockade"): two war frigates broadside to broadside on the open water
      between the south-west islands and the fort, room to come about, the rest of the blockade going on round them. */
  BRAWL: [{ name: 'Primates Rule', at: { c: 7, r: 10, d: 1 } }, { name: 'Iron Pride', at: { c: 7, r: 14, d: 1 } }] as { name: string; at: Pose }[],
};

const HANDLINGS: Record<Kind, Handling> = { sloop: SLOOP_HANDLING, frigate: FRIGATE_HANDLING };
const CLASSES: Record<Kind, ShipClass> = { sloop: SLOOP, frigate: WAR_FRIGATE };
const inRect = (x: Rect, c: number, r: number) => c >= x.c0 && c <= x.c1 && r >= x.r0 && r <= x.r1;
/** A square in the heart. */
export const inHeart = (c: number, r: number): boolean => inRect(BLOCKADE.HEART, c, r);
/** Every island's land squares (not its cove nor the way into it). */
export function islandLand(i: Island): [number, number][] {
  const out: [number, number][] = [], open = new Set([i.cove, ...i.way].map(([c, r]) => key(c, r)));
  for (let c = i.c0; c <= i.c1; c++) for (let r = i.r0; r <= i.r1; r++) if (!open.has(key(c, r))) out.push([c, r]);
  return out;
}

/** One ship in the blockade: her side, her handling, her own sea (her size, the winds if she's small enough,
    every other ship in her way), helm, guns and damage. */
export interface Ship {
  id: number; name: string; team: TeamId; kind: Kind; h: Handling; cls: ShipClass; raider: boolean;
  sea: ShipSea; helm: ShipHelm; guns: Guns; dmg: Damage;
  /** Where she came in at the start (and comes back in after she's sunk). */
  start: Pose;
  /** Sunk: seconds till she's back (0 on the board). Off the board meanwhile: in nobody's way, no influence. */
  away: number;
}

/** What a broadside stopped at: a rock, a gate's tower (which gate, which tower), one of the gates' guns, or a ship. */
export type Stop = { what: 'rock' } | { what: 'tower'; g: number; i: number } | { what: 'gun'; i: number } | { what: 'ship'; id: number };
export interface FiredShot extends Shot<Stop> { got?: 'hit' | 'crumbled' | 'bounced' | 'quiet' | 'wrecked'; hole?: Hole; out?: boolean; sunk?: boolean }
export interface Fired { ship: number; side: Side; shots: FiredShot[] }
/** A buoy's state just now: whose (the one side influencing it), contested, or nobody's. */
export type Hold = TeamId | 'contested' | null;
export type Ticked = { sail: Map<number, SailEvent[]>; damage: Map<number, DamageEvent[]>; guns: { gun: number; e: TurretEvent; hit: number | null; hole?: Hole; sunk?: boolean }[]; scored: boolean; returned: number[] };

export class Blockade {
  rocks = new Set<string>();
  wind = new Map<string, number>();
  gates = BLOCKADE.GATES.map((x) => new Gate(x.way, x.r0, x.r1));
  /** Every gate's bastion guns, and whose gate each is. */
  battery: Turret[] = BLOCKADE.GATES.flatMap((x) => x.guns.map((at) => new Turret({ at, alert: false })));
  gunGate: number[] = BLOCKADE.GATES.flatMap((x, i) => x.guns.map(() => i));
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
  /** Each gate gun's seconds each ship's been in its reach (camping there, past BLOCKADE.CAMP), and the ship it's
      firing on just now (-1: none). */
  private dwell: Map<number, number>[] = [];
  gunOn: number[] = [];
  /** Each kind of ship's chart of this board (src/hull-chart.ts): all the sloops share one, all the frigates another. */
  charts = {} as Record<Kind, HullChart>;

  constructor() {
    const B = BLOCKADE, side = new Set(B.SIDEWAYS.map(([c, r]) => key(c, r))), ways = new Set(B.GATES.flatMap((x) => [key(x.way, x.r0), key(x.way, x.r1)]));
    for (const w of B.WALLS) for (let c = w.c0; c <= w.c1; c++) for (let r = w.r0; r <= w.r1; r++) if (!side.has(key(c, r)) && !ways.has(key(c, r))) this.rocks.add(key(c, r));
    for (const isle of B.ISLANDS) for (const [c, r] of islandLand(isle)) this.rocks.add(key(c, r));
    for (const [c, r] of B.ROCKS) this.rocks.add(key(c, r));
    for (const { at: [c, r], d, n } of B.WINDS) for (let i = 0; i < n; i++) this.wind.set(key(c + [0, 1, 0, -1][d] * i, r + [1, 0, -1, 0][d] * i), d);
    let id = 0;
    for (const team of B.TEAMS) for (const s of team.ships) {
      const h = HANDLINGS[s.kind], me = id++;
      const sea = new ShipSea(h, B.COLS, B.ROWS, this.rocks, (c, r) => { const o = this.taken.get(key(c, r)); return o !== undefined && o !== me; });
      if (s.kind === 'sloop') sea.carriedBy(this.wind);
      sea.chart = this.charts[s.kind] ??= new HullChart(sea.bare());
      sea.near = B.IN_WAY;
      this.ships.push({ id: me, name: s.name, team: team.id, kind: s.kind, h, cls: CLASSES[s.kind], raider: !!s.raider, sea, helm: new ShipHelm(sea, { ...s.at }), guns: new Guns(h.reload), dmg: new Damage(CLASSES[s.kind]), start: { ...s.at }, away: 0 });
    }
    // (the charts worked out now, while the board's being set up, rather than on the first move)
    for (const c of Object.values(this.charts)) c.fresh();
    this.notice();
  }

  ship(id: number): Ship { return this.ships[id]; }
  /** On the board: not sunk and waiting to come back. */
  afloat(s: Ship): boolean { return s.away <= 0; }
  /** The ship on this square, if one is. */
  under(c: number, r: number): Ship | null { const o = this.taken.get(key(c, r)); return o === undefined ? null : this.ships[o]; }
  /** A gate's down: the heart's open to a frigate. */
  gateOpen(): boolean { return this.gates.some((g) => g.open()); }

  /** Everything a tick on: each ship's helm and crew, the gates' guns, the blockade turn's scoring. */
  tick(dt: number): Ticked {
    const out: Ticked = { sail: new Map(), damage: new Map(), guns: [], scored: false, returned: [] };
    if (this.over) return out;
    for (const s of this.ships) {
      // (sunk: back where she came in once her time's up and nobody's lying there)
      if (s.away > 0) {
        if ((s.away -= dt) <= 0 && !this.comeBack(s)) s.away = 0.5;
        if (s.away <= 0) out.returned.push(s.id);
        continue;
      }
      const ev = s.dmg.tick(dt);
      if (ev.some((e) => e.kind === 'back')) s.helm.hole = null;
      s.sea.drag = s.dmg.drag();
      out.damage.set(s.id, ev);
      out.sail.set(s.id, s.helm.tick(dt));
      s.guns.tick(dt);
      this.notice();
    }
    // (every square a ship's on, read once for all the guns)
    const on = [...this.taken].map(([k, id]) => { const [c, r] = k.split(',').map(Number); return { c, r, id }; });
    this.battery.forEach((g, i) => {
      // (how long each ship's been under it: a gun not yet roused fires on whoever's camped there)
      const dw = this.dwell[i] ??= new Map(), near = new Set(on.filter((x) => g.reaches(x.c, x.r)).map((x) => x.id));
      for (const s of this.ships) if (near.has(s.id)) dw.set(s.id, (dw.get(s.id) ?? 0) + dt); else dw.delete(s.id);
      const target = this.gunTarget(g, on, g.roused ? null : (id) => (dw.get(id) ?? 0) >= BLOCKADE.CAMP);
      this.gunOn[i] = target?.id ?? -1;
      for (const e of g.tick(dt, target, !!target)) {
        const hit = e.kind === 'land' ? this.under(...e.to) : null;
        let hole: Hole | undefined, sunk = false;
        if (hit) ({ hole, sunk } = this.hurt(hit, BLOCKADE.GATE_GUNS, e.to, g.at));
        out.guns.push({ gun: i, e, hit: hit?.id ?? null, hole, sunk });
      }
    });
    this.clock += dt;
    if ((this.turnT += dt) >= BLOCKADE.TURN) { this.turnT -= BLOCKADE.TURN; this.scoreTurn(); out.scored = true; }
    if (this.clock >= BLOCKADE.ROUND) this.over = true;
    return out;
  }
  /** The ship a gate's gun fires on: the nearest square of any in its reach (`only` those camped there, if it's not
      roused), not knocked out (unless it's a sinking blockade: lying there knocked out, she's camping). */
  private gunTarget(g: Turret, on: { c: number; r: number; id: number }[], only: ((id: number) => boolean) | null = null): { c: number; r: number; id: number } | null {
    let best: { c: number; r: number; id: number } | null = null, far = Infinity;
    for (const x of on) {
      const s = this.ships[x.id];
      if ((s.dmg.out && !BLOCKADE.SINKING) || (only && !only(s.id))) continue;
      const d = Math.max(Math.abs(x.c - g.at[0]), Math.abs(x.r - g.at[1]));
      if (g.reaches(x.c, x.r) && d < far) { far = d; best = x; }
    }
    return best;
  }
  /** Where any ship's moved to, every other's pilot works her way out afresh. */
  notice() {
    let moved = false;
    for (const s of this.ships) {
      // (where she is and where the move she's on takes her: what she covers, cheaply)
      const p = s.helm.pose, to = s.helm.cur?.to, sig = s.away > 0 ? 'away' : `${p.c},${p.r},${p.d}${to ? `>${to.c},${to.r},${to.d}` : ''}`;
      // (only the ships near enough for her to be in their way work their ways out afresh: one far off will have
      // moved again by the time she's near, and a bump makes her pilot think again anyway)
      if (sig !== this.seen.get(s.id)) {
        this.seen.set(s.id, sig); moved = true;
        for (const o of this.ships) if (o !== s && Math.max(Math.abs(o.helm.pose.c - p.c), Math.abs(o.helm.pose.r - p.r)) <= BLOCKADE.NEAR) o.sea.touch();
      }
    }
    if (!moved && this.taken.size) return;
    this.taken.clear();
    for (const s of this.ships) if (s.away <= 0) for (const k of s.helm.covers()) this.taken.set(k, s.id);
  }

  /** A ship's influence reaches this buoy: within her circle of any square of hers, and she's not knocked out. */
  reaches(s: Ship, b: Buoy): boolean {
    if (s.dmg.out || s.away > 0) return false;
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

  /** What a shot of `from`'s stops at on this square (`ships` false: as if no ship were on the sea). */
  stopAt(from: Ship, c: number, r: number, ships = true): Stop | null {
    for (const [g, gate] of this.gates.entries()) { const t = gate.towerAt(c, r); if (t >= 0) return { what: 'tower', g, i: t }; }
    const g = this.battery.findIndex((x) => x.at[0] === c && x.at[1] === r);
    if (g >= 0) return this.battery[g].wrecked ? { what: 'rock' } : { what: 'gun', i: g };
    if (this.rocks.has(key(c, r))) return { what: 'rock' };
    if (!ships) return null;
    const s = this.under(c, r);
    return s && s !== from ? { what: 'ship', id: s.id } : null;
  }
  /** Her broadside out of that side as it would fly now (or lying at `at`), without firing it (a bot's look
      before it fires; `ships` false, as if no ship were in the way). */
  aim(id: number, side: Side, at?: Pose, ships = true): Shot<Stop>[] {
    const s = this.ship(id), from = at ? { c: at.c, r: at.r, a: at.d } : s.helm.now();
    return broadside(s.h, from, side, (c, r) => this.stopAt(s, c, r, ships));
  }

  /** A ship struck by a shot of that size on that square, fired from `from`: her hole, there (and she's sunk, if it
      was the last she could take). */
  private hurt(s: Ship, gun: Handling['guns'], at: [number, number], from: [number, number]): { hole: Hole; out: boolean; sunk: boolean } {
    const where = struck(s.helm.pose, s.h.long, at, from), got = s.dmg.hit(gun, where.along, where.side, BLOCKADE.SINKING);
    if (got.out) s.helm.hit();   // (dead in the water: held till she's rebuilt)
    if (got.sunk) this.sink(s);
    return got;
  }
  /** She's gone down: off the board till she comes back (comeBack), in nobody's way meanwhile. */
  sink(s: Ship) {
    s.away = BLOCKADE.RETURN;
    s.helm.moor(s.helm.pose);
    s.helm.hole = null;
    this.notice();
  }
  /** Back where she came in, refitted, if nobody's lying there: whether she is. */
  private comeBack(s: Ship): boolean {
    if (!s.sea.bare().fits(s.start) || squares(s.h, s.start).some(([c, r]) => this.taken.has(key(c, r)))) return false;
    s.dmg.refit(); s.sea.drag = 1; s.sea.exact = null;
    s.helm.moor(s.start); s.helm.hole = null;
    s.guns.wait = { L: 0, R: 0 };
    s.away = 0;
    this.notice();
    return true;
  }

  /** Fire a ship's broadside out of that side, if it's loaded and she's not knocked out (null if not). */
  fire(id: number, side: Side): Fired | null {
    const s = this.ship(id);
    if (s.dmg.out || s.away > 0 || !s.guns.fire(side)) return null;
    this.notice();   // (where everyone is now, if they've been moved by hand)
    const roused = new Set<number>();
    const shots: FiredShot[] = this.aim(id, side).map((shot) => {
      const w = shot.what;
      if (!w || w.what === 'rock') return shot;
      if (w.what === 'tower') {
        roused.add(w.g);
        const tower = this.gates[w.g].towers[w.i], got = tower.hit(s.h.guns);
        if (got === 'crumbled') { for (const [c, r] of tower.squares) this.rocks.delete(key(c, r)); for (const o of this.ships) o.sea.touch(); }
        return { ...shot, got: got ?? undefined };
      }
      if (w.what === 'gun') { roused.add(this.gunGate[w.i]); return { ...shot, got: this.battery[w.i].hit() ?? undefined }; }
      const { hole, out, sunk } = this.hurt(this.ship(w.id), s.h.guns, shot.hit!, shot.from);
      return { ...shot, got: 'hit', hole, out, sunk };
    });
    this.battery.forEach((g, i) => { if (roused.has(this.gunGate[i])) g.rouse(); });
    const got = { ship: id, side, shots };
    this.fired.push(got);
    if (this.fired.length > 64) this.fired.shift();   // (nobody drawing them: kept short)
    return got;
  }

  drop(id: number, c: number, r: number): [number, number] | null { return this.ship(id).helm.drop(c, r); }
  put(id: number, m: Move): boolean { return this.ship(id).helm.put(m); }
  /** The brawl (BLOCKADE.BRAWL): its two frigates put broadside to broadside; their ids. */
  brawl(): [number, number] {
    const ids = BLOCKADE.BRAWL.map(({ name, at }) => { const s = this.ships.find((x) => x.name === name)!; s.helm.moor(at); return s.id; });
    this.notice();
    return [ids[0], ids[1]];
  }
  /** In the heart of the board, inside the fort. */
  inHeart(s: Ship): boolean { return inHeart(s.helm.pose.c, s.helm.pose.r); }
  /** Where a sloop of that side hides: the islands' coves, and her side's corner of the sea, far from the fighting. */
  coves(team?: TeamId): [number, number][] { return [...BLOCKADE.ISLANDS.map((i) => i.cove), ...(team ? BLOCKADE.HOMES[team] : [])]; }
}
