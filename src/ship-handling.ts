/* Pirate Den: each ship's handling on the squares, and what fits where. TypeScript, compiled to
   js/ship-handling.js; tested in tests/ship-handling.test.ts. Knows nothing of where she's sailed: the
   frigate-and-sloop test sea (src/two-ships.ts, frigate-test.html) is the first to use it.

   The user (14 Nov, RACE.md §11): "you can choose either a [war frig] or a sloop, and that it unlocks
   different routes for you ... the frig being the I'm going to battle my way through kind of almost brute
   force option ... The sloop will have its nimble [ways] through." So the same helm (src/den-sail.ts: the
   pin, the pilot, your own moves, the turn's clock) sails any ship, handed her handling:
   - moves a turn: Battle Navigation's tokens, by YPPedia (src/ships.ts: the sloop 4, a war frigate 3);
   - her pace: the seconds a square takes (the sloop the den's SAIL.MOVE; a war frigate FRIGATE_PACE);
   - her moves as big as her turn (the user, 15 Nov: "to go forward on the [war frig], I think proportionately you
     want to be going like [her turn's squares], so it's equivalent movement to the turn, otherwise it looks really
     weird"): forward `stride` squares, her turn's `radius` (the sloop 1, the frigate 2), and every move of hers
     takes as long as any other (`move`). So she's as quick as the sloop over open water but clumsy: she plays her
     turn of moves in half as long again as the sloop plays hers, slower to react ("the sloop gets like two turns
     for every ... [one] of the [war frig] ... that'll then show, yeah, the [war frig]'s slower to react, and
     that's how it would equal them out"; "I want the big ships to feel clumsy. They're powerful but clumsy").
     The sloop's speed is the sea's: the winds she rides that a big ship rides out (ShipSea's `windy`: "getting in
     there faster comes from the opportunities you have to go take [winds] that the [war frig] doesn't have access
     to");
   - how wide she turns: a quarter circle `radius` squares round (her middle `radius` squares ahead, then
     `radius` across, ending facing that way), half her length (the sloop 1, as Battle Navigation's turn;
     the frigate 2). Drawn, her middle sails round the quarter circle, bows leading: never pivoting;
   - how long a turn takes: in proportion, as the sloop's (the user, 15 Nov: "be proportionate, similar to how
     the sloop is"): a move's, like any of hers, so each kind of move covers the ground at the same share of the
     sloop's speed. Her wide turn needs room and is never a shortcut past the sloop (15 Nov, the first go: "a turn
     is making it cover a lot more space than you would in a sloop, so that actually is making it faster");
   - her size on the squares, from her hull against SAIL.CELL (4 m): her length rounded (her ends can
     overhang a square a little), her beam rounded up (her sides mustn't scrape the rocks). The sloop, 4.4 m
     by 2.3, takes one square; Primates Rule, 15 m by 4.6, four along and two across, so a one-square gap is
     too narrow for her;
   - her guns: shots a side a broadside (YPPedia: the sloop 1, a war frigate 2), their size, their reload.
   Everything she covers on every square of a move has to be open water, so a big ship needs room to turn; a
   turn she's no room for leaves her as she was (the sloop's turns her on the spot, as the den's does). Only
   when she can't move at all, a big ship is warped round on the spot, slowly.
   Her pilot sails her till the square you plotted is under her, any square of her ("within the silhouette
   of the whole ship", 15 Nov), going straight on when that gets her there; where she'll lie then, her berth,
   is drawn as the block of squares she'll cover ("aim you for like a block of squares, not just one"). */
import { SAIL, Sea, Helm, pauseFor, type Move, type Pose } from './den-sail.js';
import { SLOOP, WAR_FRIGATE, WAR_BRIG, SLOOP_HULL, type ShipClass, type Hull } from './ships.js';
import { FRIGATE_HULL } from './den-frigate.js';
import { BRIG_HULL } from './den-brig.js';
import type { HullChart } from './hull-chart.js';

/** The four ways (den-sail.ts's): 0 out to sea (r + 1), 1 right (c + 1), 2 back in, 3 left. */
const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
const key = (c: number, r: number) => `${c},${r}`;

export type GunSize = ShipClass['gunSize'];

/** How a ship handles on the squares. */
export interface Handling {
  name: string;
  /** Moves a turn. */
  tokens: number;
  /** Seconds a square takes under way. */
  pace: number;
  /** How wide she turns: squares ahead, then across. */
  radius: number;
  /** Squares a forward move takes her: her turn's radius. */
  stride: number;
  /** Seconds any one move of hers takes, forward or a turn (moveTime). */
  move: number;
  /** Seconds a turn takes: her move's. */
  turn: number;
  /** Squares her hull covers, along her and across her. */
  long: number; wide: number;
  /** Shots a side a broadside, their guns' size, and the seconds a side takes to load again. */
  shots: number; guns: GunSize; reload: number;
}

/** The numbers that aren't YPPedia's (RACE.md §11, "Racing in a frigate or a sloop"). */
export const HANDLING = {
  /** A war frigate's seconds a square, against the sloop's SAIL.MOVE: as quick as the sloop over open water, all
      told, her moves twice as big and her turns of moves half as long again (her fewer moves, each paused after). */
  FRIGATE_PACE: 1.3,
  /** A war brig's (src/den-brig.ts): a square a move, as the sloop's, but slower at it: between the two. */
  BRIG_PACE: 1.15,
  /** How much longer a war brig's turn takes than her move forward: clumsy for her size, so a sloop off her end has time
      to stay there (rock, paper, scissors, src/blockade-skirmish.ts: "sloops beat war brigs ... because of how they can
      just dart around and evade them"). */
  BRIG_TURN: 1.6,
  /** Seconds a side's guns take to load again, by their size. */
  RELOAD: { small: 2, medium: 2.5, large: 3 } as Record<GunSize, number>,
};

/** Seconds of the clock a square straight on takes her, all told: the move, the pause after it, and her
    share of the breather between turns (SAIL.BREAK over her moves a turn). */
export const groundSecs = (pace: number, tokens: number): number => pace + pauseFor(pace) + SAIL.BREAK / tokens;

/** Seconds one move of hers takes, forward or a turn: `stride` squares' pace. The sloop's, a square's (the den's
    SAIL.MOVE); a big ship's, a big move's. A turn is a move like any (Battle Navigation's), in proportion to her
    size: the frigate's quarter circle two ahead and two across takes what her two squares forward do, as the
    sloop's one ahead and one across takes what her one square does (15 Nov: "be proportionate, similar to how the
    sloop is"). */
export const moveTime = (pace: number, stride: number): number => pace * stride;

/** A ship's handling, from her class and her hull: `pace` her seconds a square. */
export function handlingFor(ship: ShipClass, hull: Hull, pace: number = SAIL.MOVE): Handling {
  const long = Math.max(1, Math.round(hull.len / SAIL.CELL)), wide = Math.max(1, Math.ceil(hull.beam / SAIL.CELL));
  const radius = Math.max(1, Math.ceil(long / 2)), stride = radius, move = moveTime(pace, stride);
  return {
    name: ship.name, tokens: ship.tokens, pace, radius, stride, move, turn: move, long, wide,
    shots: ship.shotsPerSide, guns: ship.gunSize, reload: HANDLING.RELOAD[ship.gunSize],
  };
}
export const SLOOP_HANDLING = handlingFor(SLOOP, SLOOP_HULL);
export const FRIGATE_HANDLING = handlingFor(WAR_FRIGATE, FRIGATE_HULL, SAIL.MOVE * HANDLING.FRIGATE_PACE);
const brig = handlingFor(WAR_BRIG, BRIG_HULL, SAIL.MOVE * HANDLING.BRIG_PACE);
export const BRIG_HANDLING = { ...brig, turn: brig.turn * HANDLING.BRIG_TURN };

// (worked out once a size: every ship's squares are asked for many times a tick)
const spans = new Map<number, readonly number[]>();
const span = (n: number): number[] => (spans.get(n) ?? spans.set(n, Object.freeze(Array.from({ length: n }, (_, i) => i - Math.floor(n / 2)))).get(n)!) as number[];
/** Her squares along her from her own (+ toward her bow), and across her (+ to starboard): her own square
    in the middle, or just forward and to port of it with an even count. */
export const alongs = (h: Handling): number[] => span(h.long);
export const acrosses = (h: Handling): number[] => span(h.wide);

/** The squares she covers at a pose. */
export function squares(h: Handling, p: Pose): [number, number][] {
  const s = (p.d + 1) % 4, out: [number, number][] = [];
  for (const a of alongs(h)) for (const x of acrosses(h)) out.push([p.c + DC[p.d] * a + DC[s] * x, p.r + DR[p.d] * a + DR[s] * x]);
  return out;
}

const mean = (xs: number[]) => xs.reduce((t, x) => t + x, 0) / xs.length;
/** Her middle from her own square (along her, across her): (0, 0) for one square; with an even count,
    half a square aft and to port. */
const middle = (h: Handling) => ({ al: mean(alongs(h)), ac: mean(acrosses(h)) });

/** Her middle at a pose (Helm.now's, the heading `a` in quarter turns, whole or not): where she's drawn. */
export function drawnAt(h: Handling, at: { c: number; r: number; a: number }): { c: number; r: number; a: number } {
  const { al, ac } = middle(h), t = at.a * Math.PI / 2, hc = Math.sin(t), hr = Math.cos(t), sc = Math.cos(t), sr = -Math.sin(t);
  return { c: at.c + hc * al + sc * ac, r: at.r + hr * al + sr * ac, a: at.a };
}
/** Back from her middle and heading to her own square (drawnAt's other way round). */
export function ownAt(h: Handling, mid: { c: number; r: number; a: number }): { c: number; r: number; a: number } {
  const { al, ac } = middle(h), t = mid.a * Math.PI / 2, hc = Math.sin(t), hr = Math.cos(t), sc = Math.cos(t), sr = -Math.sin(t);
  return { c: mid.c - hc * al - sc * ac, r: mid.r - hr * al - sr * ac, a: mid.a };
}
/** Her own square with her middle at (mc, mr), facing `d` (whole squares: a middle's always where it fits). */
const poseOf = (h: Handling, mc: number, mr: number, d: number): Pose => {
  const o = ownAt(h, { c: mc, r: mr, a: d });
  return { c: Math.round(o.c), r: Math.round(o.r), d };
};

/** A move's poses: each square her middle passes through and the way she faces there (forward, one; a turn,
    `radius` ahead, then `radius` across, facing the new way), and where she ends up; `swing`, her at the
    corner already facing the new way, the room she swings through (a turn wider than a square). The sloop's
    are den-sail.ts's path exactly. */
export function shipPath(h: Handling, p: Pose, m: Move): { steps: Pose[]; to: Pose; swing: Pose[] } {
  if (m === 'F') {
    const steps = Array.from({ length: h.stride }, (_, i) => ({ c: p.c + DC[p.d] * (i + 1), r: p.r + DR[p.d] * (i + 1), d: p.d }));
    return { steps, to: steps[steps.length - 1], swing: [] };
  }
  const R = h.radius, d = (p.d + (m === 'L' ? 3 : 1)) % 4, steps: Pose[] = [], M = drawnAt(h, { c: p.c, r: p.r, a: p.d });
  for (let k = 1; k <= R; k++) steps.push(poseOf(h, M.c + DC[p.d] * k, M.r + DR[p.d] * k, p.d));
  const ac = M.c + DC[p.d] * R, ar = M.r + DR[p.d] * R;
  for (let k = 1; k <= R; k++) steps.push(poseOf(h, ac + DC[d] * k, ar + DR[d] * k, d));
  return { steps, to: steps[steps.length - 1], swing: R > 1 ? [poseOf(h, ac, ar, d)] : [] };
}

/** Easing along a move: the den's (smoothstep, quick in the middle), or for a big ship's long turn a glide:
    gathering way over its first fifth, steady, easing off over its last, so she's always under way. */
const smooth = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
function glide(u: number, q = 0.2): number {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const v = 1 / (1 - q);
  return u < q ? v * u * u / (2 * q) : u > 1 - q ? 1 - v * (1 - u) * (1 - u) / (2 * q) : v * (u - q / 2);
}

/** Where she is partway (u, 0 to 1) through a move, for drawing (as den-sail.ts's poseAt): her own square,
    across and out, and her heading in quarter turns. Her middle sails it: forward, straight on; a turn, round
    its quarter circle `radius` across, her heading always along it, bows leading (15 Nov: "it should always
    be moving forward. It seems to be more like rotating on the spot"). A bump lurches her forward and back;
    `to`, where it left her: turned (the sloop's turn on the spot, or a big ship warped round), she turns
    about her middle, else (a big ship's turn she'd no room for) she lurches. */
export function shipPose(h: Handling, p: Pose, m: Move, u: number, bump = false, to?: Pose): { c: number; r: number; a: number } {
  const M = drawnAt(h, { c: p.c, r: p.r, a: p.d }), lurch = 0.22 * Math.sin(Math.PI * Math.min(1, Math.max(0, u)));
  const own = (c: number, r: number, a: number) => ownAt(h, { c, r, a });
  if (m === 'F' || (bump && to && to.d === p.d)) {
    const k = bump ? lurch : h.stride > 1 ? h.stride * glide(u) : smooth(u);
    return own(M.c + DC[p.d] * k, M.r + DR[p.d] * k, p.d);
  }
  const R = h.radius, e = R > 1 && !bump ? glide(u) : smooth(u), s = m === 'L' ? -1 : 1, a = p.d + s * e;
  if (bump) return own(M.c, M.r, a);
  const side = (p.d + (m === 'L' ? 3 : 1)) % 4, mc = M.c + DC[side] * R, mr = M.r + DR[side] * R;
  const x = -DC[side] * R, y = -DR[side] * R, th = (m === 'L' ? 1 : -1) * e * Math.PI / 2;
  return own(mc + x * Math.cos(th) - y * Math.sin(th), mr + x * Math.sin(th) + y * Math.cos(th), a);
}

/** The sea as one ship sees it: a board of its own size and rocks, every square she covers having to be
    open, and `blocked` (another ship, say) in her way too. Its pilot (Sea.plot) works her way out by her
    own moves. With no winds, locks or whirlpools: those are the den's sea's, not yet sized for a ship. */
export class ShipSea extends Sea {
  declare readonly cols: number;
  declare readonly rows: number;
  /** `windy`: the winds on this sea (`wind`, as the den's lanes) carry her, a ship of one square (the sloop);
      a bigger ship rides them out, never carried (15 Nov: the sloop's speed is "the opportunities you have to go
      take [winds] that the [war frig] doesn't have access to"). */
  windy = false;
  /** Squares that cost her to cross (a frigate's shoals: src/blockade.ts), and the seconds her pilot reckons each move
      through any of them costs her besides its own: she can go, but only takes them when it's well worth it. */
  toll: { squares: Set<string>; secs: number } | null = null;
  constructor(public ship: Handling, cols: number, rows: number, rocks: Set<string>, public blocked: (c: number, r: number) => boolean = () => false) {
    super(1, false, true);
    this.cols = cols; this.rows = rows;
    this.rocks = rocks;   // (shared with the other ships' seas: a rock broken is gone for all)
  }
  /** The winds she's carried by, if she's small enough (windy), shared with the other ships' seas. */
  carriedBy(wind: Map<string, number>): this { this.wind = wind; this.windy = this.ship.long * this.ship.wide === 1; return this; }
  override open(c: number, r: number): boolean { return super.open(c, r) && !this.blocked(c, r); }
  /** Every square she'd cover at this pose is open. */
  fits(p: Pose): boolean { return squares(this.ship, p).every(([c, r]) => this.open(c, r)); }
  /** She'd get through this move: she fits on every square of it, and where she swings round. */
  clear(p: Pose, m: Move): boolean {
    const { steps, swing } = shipPath(this.ship, p, m);
    return steps.every((q) => this.fits(q)) && swing.every((q) => this.fits(q));
  }
  /** A move by her handling: through only if she's room for all of it. Blocked, the sloop's turn turns her
      where she is (the den's); a bigger ship's leaves her as she was, never pivoting (15 Nov), unless she can't
      move at all: then she's warped round on the spot, about her middle, if there's room. */
  override move(p: Pose, m: Move, oars = false, whirls = false): { to: Pose; bump: boolean; ride: Pose[]; irons?: boolean } {
    if (this.windy) return super.move(p, m, oars, whirls);   // (a sloop on a sea of winds: the den's own, carried)
    const h = this.ship, { to } = shipPath(h, p, m);
    if (this.clear(p, m)) return { to, bump: false, ride: [] };
    if (m === 'F') return { to: { ...p }, bump: true, ride: [] };
    const stuck = h.radius <= 1 || (['F', 'L', 'R'] as Move[]).every((x) => !this.clear(p, x));
    const M = drawnAt(h, { c: p.c, r: p.r, a: p.d }), spun = poseOf(h, M.c, M.r, to.d);
    return { to: stuck && this.fits(spun) ? spun : { ...p }, bump: true, ride: [] };
  }
  /** Her pace: a move's, forward or a turn (moveTime). */
  override moveSecs(_oars = false, _p?: Pose, m?: Move): number { return (m && m !== 'F' ? this.ship.turn : this.ship.move) * this.drag; }
  /** How much longer her moves take than her handling's (water in her bilge: src/ship-damage.ts, drag). */
  drag = 1;
  /** Every wind square's way, for a big ship to ride out: none (Sea.windAt's, read by the helm's pushes). */
  override windAt(c: number, r: number): number | undefined { return this.windy ? super.windAt(c, r) : undefined; }
  /** A berth she's to lie in exactly, her own square and heading (sailTo: lying broadside to a gate's tower, say),
      if the pin's on its square. */
  exact: Pose | null = null;
  /** Her kind's chart (src/hull-chart.ts: every move of hers on this board worked out once, shared by every ship of
      her kind, and how far anywhere is), if her sea has one: her pilot then works her way out on it, the other ships
      in her way only within `near` squares of her. */
  chart: HullChart | null = null;
  near = Infinity;
  /** The squares a move sweeps (`got`, the move as made): where she bumped, the squares she's left on; else every
      square she covers on the way, where she swings round, and on the winds that carry her. */
  sweep(p: Pose, m: Move, got: { to: Pose; bump: boolean; ride: Pose[] } = this.move(p, m)): [number, number][] {
    const seen = new Set<number>(), out: [number, number][] = [];
    const add = (q: Pose) => { for (const s of squares(this.ship, q)) { const k = s[0] * 4096 + s[1]; if (!seen.has(k)) { seen.add(k); out.push(s); } } };
    if (got.bump) add(got.to);
    else { const { steps, swing } = shipPath(this.ship, p, m); steps.forEach(add); swing.forEach(add); }
    got.ride.forEach(add);
    return out;
  }
  /** How far (squares, any way) from her own square a move of hers looks: every square it has to be clear on, before
      any wind carries her (src/hull-chart.ts works out again only the poses this near a rock that's changed). */
  reach(): number {
    let most = 0;
    for (let d = 0; d < 4; d++) for (const m of ['F', 'L', 'R'] as Move[]) {
      const p = { c: 0, r: 0, d }, { steps, swing } = shipPath(this.ship, p, m);
      for (const q of [p, ...steps, ...swing]) for (const [c, r] of squares(this.ship, q)) most = Math.max(most, Math.abs(c), Math.abs(r));
    }
    return most;
  }
  /** The poses (numbered as the pilot's) she's there in for that square: any with it under her, or with `exact`
      on it, lying just so. */
  arrivals(c: number, r: number, exact: Pose | null = this.exact): number[] {
    if (exact && exact.c === c && exact.r === r) return [(c * this.rows + r) * 4 + exact.d];
    const out: number[] = [], n = Math.max(this.ship.long, this.ship.wide);
    for (let x = c - n; x <= c + n; x++) for (let y = r - n; y <= r + n; y++) {
      if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) continue;
      for (let d = 0; d < 4; d++) if (squares(this.ship, { c: x, r: y, d }).some(([a, b]) => a === c && b === r)) out.push((x * this.rows + y) * 4 + d);
    }
    return out;
  }
  /** What names a place on her chart: the square, or the square and the way she's to lie in it. */
  private placeKey(c: number, r: number, exact: Pose | null = this.exact): string {
    return exact && exact.c === c && exact.r === r ? `${c},${r},${exact.d}` : `${c},${r}`;
  }
  /** The pilot (Sea.plot's), on her chart if she has one: her quickest way as things are, round any ship near her. */
  private shipPlots = new Map<string, Move[] | null>();
  override plot(from: Pose, c: number, r: number, via: [number, number] | null = null, oars = false): Move[] | null {
    const chart = this.chart;
    if (!chart || via) return super.plot(from, c, r, via, oars);
    if (!this.open(c, r)) return null;
    if (this.there(from, c, r)) return [];
    const place = this.placeKey(c, r), memo = `${from.c},${from.r},${from.d}|${place}|${this.laid}|${chart.version()}`;
    if (!this.shipPlots.has(memo)) {
      if (this.shipPlots.size > 256) this.shipPlots.clear();
      const exact = this.exact;
      this.shipPlots.set(memo, chart.plot(this, from, place, () => this.arrivals(c, r, exact), this.near));
    }
    const got = this.shipPlots.get(memo);
    return got ? [...got] : null;
  }
  /** Her pilot's moves to a square as if the other ships weren't there (they'll have moved by then). */
  plotPast(from: Pose, c: number, r: number): Move[] | null {
    if (this.chart) return this.chart.plot(this, from, `${c},${r}`, () => this.arrivals(c, r, null), -1);
    return this.bare().plot(from, c, r);
  }
  /** Her pilot's moves from `from` to lie exactly at `to` (as if the other ships weren't there), or null if she can't. */
  plotTo(from: Pose, to: Pose): Move[] | null {
    if (this.chart) return this.chart.plot(this, from, this.placeKey(to.c, to.r, to), () => this.arrivals(to.c, to.r, to), -1);
    const twin = this.bare(), was = twin.exact;
    twin.exact = { ...to };
    const got = twin.plot(from, to.c, to.r);
    twin.exact = was;
    return got;
  }
  /** Her quickest way to the nearest of many places (`key` naming them: a gate's berths, say), past the other ships,
      on her chart: her moves, and where she'll lie. */
  plotAny(from: Pose, key: string, goals: () => Iterable<number>): { moves: Move[]; to: Pose } | null {
    if (!this.chart) return null;
    const moves = this.chart.plot(this, from, key, goals, -1);
    if (!moves) return null;
    let p = from;
    for (const m of moves) { const k = this.chart.id(p) * 3 + ['F', 'L', 'R'].indexOf(m); p = this.chart.pose(this.chart.end[k]); }
    return { moves, to: p };
  }
  /** Seconds to get there past the other ships, as she is (her drag): a look-up on her chart (Infinity: no way). */
  eta(from: Pose, c: number, r: number, exact: Pose | null = null): number {
    if (this.chart) return this.chart.field(this.placeKey(c, r, exact), () => this.arrivals(c, r, exact))[this.chart.id(from)] * this.drag;
    const moves = exact ? this.plotTo(from, exact) : this.plotPast(from, c, r);
    return moves ? moves.length * this.ship.move * this.drag : Infinity;
  }
  /** Seconds to the nearest of many places, past the other ships (as plotAny). */
  etaAny(from: Pose, key: string, goals: () => Iterable<number>): number {
    return this.chart ? this.chart.field(key, goals)[this.chart.id(from)] * this.drag : Infinity;
  }
  /** Her sea with no other ships on it, the same rocks and winds (its pilot's reckonings kept apart from hers, so
      neither throws the other's away; and her kind's chart is worked out on one). */
  private twin: ShipSea | null = null;
  bare(): ShipSea {
    if (!this.twin) { this.twin = new ShipSea(this.ship, this.cols, this.rows, this.rocks); if (this.windy) this.twin.carriedBy(this.wind); this.twin.toll = this.toll; }
    return this.twin;
  }
  /** (an exact berth is part of what a plot hangs on) */
  protected override plotKey(): string { const e = this.exact; return e ? `${e.c},${e.r},${e.d}` : ''; }
  /** She's there with that square under any of hers (or, for an exact berth, lying in it). */
  override there(p: Pose, c: number, r: number): boolean {
    const e = this.exact;
    if (e && e.c === c && e.r === r) return p.c === c && p.r === r && p.d === e.d;
    return squares(this.ship, p).some(([x, y]) => x === c && y === r);
  }
  protected override goalPoses(c: number, r: number): Set<number> { return new Set(this.arrivals(c, r)); }
}

/** The helm (src/den-sail.ts's, the den's own), sailing a ship by her handling: her moves a turn, and her
    wider turn drawn. */
export class ShipHelm extends Helm {
  declare sea: ShipSea;
  constructor(sea: ShipSea, pose: Pose) { super(sea, pose); }
  override next(): Move[] { return (this.oars ? this.strokes : this.course()).slice(0, this.sea.ship.tokens); }
  override put(m: Move): boolean { return this.mine.length < this.sea.ship.tokens && super.put(m); }
  override now(): { c: number; r: number; a: number } {
    const cur = this.cur;
    if (!cur || cur.m === 'W') return super.now();
    return shipPose(this.sea.ship, cur.from, cur.m, Math.min(1, this.t / cur.secs), cur.bump, cur.to);
  }
  /** Sail her to lie exactly so (a pose, not just a square under her): where it went, or null if she can't. */
  sailTo(p: Pose): [number, number] | null {
    if (!this.sea.plotTo(this.after(), p)) return null;
    this.sea.exact = { ...p };
    // (a ship in her way there just now: she waits for a look later, rather than her pilot trying every square round
    // it for somewhere else to go, a field each)
    if (!this.sea.plot(this.after(), p.c, p.r)) { this.sea.exact = null; return null; }
    const got = this.drop(p.c, p.r);
    if (!got || got[0] !== p.c || got[1] !== p.r) { this.sea.exact = null; this.stop(); return null; }
    return got;
  }
  /** Drop a pin as ever: an exact berth's forgotten. */
  override drop(c: number, r: number): [number, number] | null {
    const e = this.sea.exact;
    if (e && (e.c !== c || e.r !== r)) this.sea.exact = null;
    return super.drop(c, r);
  }
  /** Her course ahead as poses: where this turn leaves her, then where each move of the course after it does. */
  route(): Pose[] {
    let p = this.after();
    const out = [p];
    for (const m of this.course()) { p = this.sea.sail(p, m).to; out.push(p); }
    return out;
  }
  /** Where she'll lie when she's there, a block of squares rather than the one you clicked (15 Nov: "that pilot
      should really aim you for like a block of squares, not just one, because obviously you can't sit on one
      square"): her pose at the end of her course to the pin, whichever of the poses with it under her her pilot
      found quickest (null with no pin). */
  berth(): Pose | null {
    if (!this.pin) return null;
    const r = this.route();
    return r[r.length - 1];
  }
  /** The squares of her berth. */
  berthSquares(): [number, number][] { const b = this.berth(); return b ? squares(this.sea.ship, b) : []; }
  /** The squares she covers, where she is and (under way) where the move she's on takes her. */
  covers(): Set<string> {
    const out = new Set(squares(this.sea.ship, this.pose).map(([c, r]) => key(c, r)));
    if (this.cur) for (const [c, r] of squares(this.sea.ship, this.cur.to)) out.add(key(c, r));
    return out;
  }
}

/** A side of her: port (her left) or starboard (her right). */
export type Side = 'L' | 'R';
/** A shot: the squares it passes over, and what it stopped at, if anything. */
export interface Shot<T> { from: [number, number]; cells: [number, number][]; hit: [number, number] | null; what: T | null }

/** A broadside out of that side from where she is (Helm.now: mid-move, the square and heading she's
    nearest): `shots` of them, from her middle squares along her, each straight out past her side up to
    `range` squares, stopping at the first square `stops` says is something (a rock, a boom, a ship). */
export function broadside<T>(h: Handling, at: { c: number; r: number; a: number }, side: Side, stops: (c: number, r: number) => T | null, range: number = SAIL.RANGE): Shot<T>[] {
  const d = ((Math.round(at.a) % 4) + 4) % 4, s = (d + 1) % 4, out = side === 'R' ? s : (d + 3) % 4;
  const c0 = Math.round(at.c), r0 = Math.round(at.r), al = alongs(h), ac = acrosses(h), edge = side === 'R' ? ac[ac.length - 1] : ac[0];
  const first = Math.max(0, Math.floor((al.length - h.shots) / 2)), guns = al.slice(first, first + h.shots);
  return guns.map((g) => {
    const from: [number, number] = [c0 + DC[d] * g + DC[s] * edge, r0 + DR[d] * g + DR[s] * edge], cells: [number, number][] = [];
    for (let k = 1; k <= range; k++) {
      const c = from[0] + DC[out] * k, r = from[1] + DR[out] * k, what = stops(c, r);
      cells.push([c, r]);
      if (what !== null) return { from, cells, hit: [c, r] as [number, number], what };
    }
    return { from, cells, hit: null, what: null };
  });
}

/** Her guns, a side at a time: fired, a side loads again for her reload's seconds. */
export class Guns {
  wait: Record<Side, number> = { L: 0, R: 0 };
  constructor(public reload: number) {}
  ready(side: Side): boolean { return this.wait[side] <= 1e-9; }
  /** Fire that side, if it's loaded: whether it fired. */
  fire(side: Side): boolean { if (!this.ready(side)) return false; this.wait[side] = this.reload; return true; }
  tick(dt: number) { for (const s of ['L', 'R'] as Side[]) this.wait[s] = Math.max(0, this.wait[s] - dt); }
}
