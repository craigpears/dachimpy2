/* Pirate Den: the blockade's bots (src/blockade.ts), each sailing one ship. TypeScript, compiled to js/blockade-bots.js;
   tested in tests/blockade.test.ts. Plain greedy bots, as the puzzles' are: no planning ahead, no teamwork beyond not
   all going for the same thing.
   - Each picks the buoy most worth her while for how far it is (more if the other side holds it or it's contested,
     less if a friend's on it already), and holds it.
   - A war frigate with no gate down yet weighs shooting one down instead (worth all the heart's pennants): she lies
     broadside to a tower and fires till it crumbles. Inside, the heart's buoys are worth more to her: what she's for.
   - No ship hides: a hurt one is patched where she is, on the points, and takes fewer risks (her nerve).
   - A raider sloop (two a side) darts out at an enemy brig or frigate, snipes at her from off her bow or her stern,
     where none of her broadsides can bear, and back to the buoys a while (till 15 Nov, back to hide: "you should see sloops hiding out,
     sometimes coming out ... while [war frigs] are having a fight to land a few pot shots"; "they're supposed to snipe
     at the war frigate from a safe ... angle ... the back or the front of the ship where they're safe, then they
     can't return a broadside" (the user, 15 Nov); never since: "you never hide").
   - A war frigate with an enemy close by, in her way or on a buoy she wants, lies off her side and fights her for
     it: "[war frigs] ... having a fight to land a few pot shots".
   - Every ship fires a loaded side whenever it would hit an enemy and no friend, a tower she's come for, or one of a
     gate's guns firing on her; an enemy knocked out too, in a sinking blockade, to sink her.
   - Rock, paper, scissors (the user, 15 Nov: "frigates sink sloops because they just overwhelm them with just sheer
     firepower. War brigs, can they be good at beating war frigates with how they deploy the turtles? ... sloops beat
     war brigs ... because of how they can just dart around and evade them"):
     - a frigate goes for a sloop close by before anything else, and her broadsides sink it; a sloop leaves a frigate
       be unless she's sniping at her end (a broadside duel with one is a sloop sunk);
     - a war brig goes for the lagoons' buoys more than the heart's, fights another brig, leaves sloops and frigates
       to others, and launches her craft whenever an enemy frigate's near: her turtles come at the nearest frigate
       from astern and ram her, again and again; her phantom sloops, never to be hit, dart at anything slow or sat
       still, frigates first;
     - a sloop with an enemy brig close by goes for her end, where the brig's broadsides can't bear, and the raiders
       snipe a brig before a frigate.
   - A war frigate's fights weigh more against an enemy knocked out (to finish her) and against one close by a friend
     who's knocked out (to drive her off before she sinks her).
   The sloops' shortcuts aren't told them: their pilot finds the winds through the side ways because they're quicker,
   as it finds any way ("the sloops are more nimble, taking the shortcuts, taking those sideways in").
   An admiral's order (src/blockade-orders.ts: hold a buoy, camp, snipe, shoot a gate down, escort, hunt) is carried
   out before anything she'd pick for herself; "free", she picks as above. A strategy's (the middle, the outside,
   rushing, step by step, their frigates, sinks) bends how she picks: what she'll go for, and how much it's worth. 
   How far anything is comes off her kind's chart of the board (src/hull-chart.ts): a look-up, the same for every
   ship of her kind, so a bot weighs every buoy, cove and gate by how long it really is to get there, round the
   rocks and the walls (and a frigate's shut out of the heart till a gate's down because there's no way in for her,
   not by a rule). */
import { SAIL, type Pose } from './den-sail.js';
import type { Side } from './ship-handling.js';
import { squares, drawnAt, alongs, shipPath } from './ship-handling.js';
import { BLOCKADE, inHeart, phantom, type Blockade, type Ship, type Buoy } from './blockade.js';
const RAM_STILL = BLOCKADE.LAUNCH.RAM.STILL, SAIL_SLOTS = SAIL.SLOTS;
import { FREE, type Order } from './blockade-orders.js';

export const BOTS = {
  /** Seconds between a bot's looks round for something better to do. */
  THINK: 3.5,
  /** Seconds she leaves a place she found no way to before trying it again. */
  NOWAY: 8,
  /** How much better something has to look before she changes her mind. */
  STICK: 1.3,
  /** How much more the heart's buoys are worth to a frigate; and to a sloop, once the enemy's frigates are in it. */
  HEART: 2.5, FLEE: 0.3,
  /** A sloop's dodge: how near (squares) a frigate has to be to be watched, how nearly loaded (seconds) her side has to
      be to count, and the longest she keeps at getting to the cover she picked. */
  DODGE: { NEAR: 7, LOADED: 1.5, SECS: 2.5 },
  /** How near (squares) an enemy frigate has to be to a buoy for a sloop to leave it be. */
  WARY: 5,
  /** A ship's nerve against an enemy, by how damaged each is (`nerve`): 1 + K times his damage less hers, between MIN and
      MAX; a sloop raids only with GO or more. No ship hides (the user, 15 Nov: "this is a game about the points ... You
      die practically on the points"; "you never hide"): her crew patch her where she is. */
  NERVE: { K: 1.5, MIN: 0.3, MAX: 2, GO: 0.8 },
  /** Seconds a raider lies hidden before she darts out again, and the longest a raid lasts. */
  LURK: [8, 14] as [number, number], RAID: 25,
  /** How near an enemy frigate has to be (squares) for a raider to dart out at her, and how far off her side she lies. */
  REACH: 16, OFF: 3,
  /** How far off a frigate's bow or stern a raider lies to snipe at her (squares past her end: in her own guns' reach). */
  END: [3, 2],
  /** Seconds further her bow looks than it is to a raider, against her stern. */
  BOW: 8,
  /** How near an enemy has to be (squares) for a frigate to fight her, and how much she's worth fighting. */
  ENGAGE: 9, FIGHT: 3,
  /** How much a fight's worth to a big ship with an enemy on no buoy (one on a buoy, or contesting it, 1). */
  OFF_POINTS: 0.35,
  /** How much longer than her way itself a big ship's way round the ships in it can be before she'd rather wait. */
  DETOUR: 1.6,
  /** How near (squares) an enemy has to come for a frigate holding a buoy in the heart to leave it to fight her. */
  HOLD: 5,
  /** How much more a fight's worth to finish an enemy who's knocked out, or to save a friend who is (an enemy within
      SAVE squares of her). */
  FINISH: 2, RESCUE: 1.6, SAVE: 7,
  /** A brig's: how much more the open sea's buoys are worth to her, and the heart's (less: the frigates' to take); how
      near an enemy has to be for her to launch her craft (from her lagoon's corner to the heart's middle, and a little). */
  BRIG: { OUT: 1.5, HEART: 0.35, LAUNCH: 17, SAFE: 7 },
  /** Seconds between a turtle's looks for whom to ram (quick: her prey moves), how far she looks, how many squares
      nearer a ship lying still looks to her (she can only ram one lying still), a frigate (her worth; a brig half), and
      the one she's after already. */
  RAM: { THINK: 0.8, REACH: 24, STUCK: 1.6, STILL_FIRST: 8, WORTH: 12, KEEP: 4 },
  /** How near (squares, middle to middle) an enemy she's fighting has to be for her to swing her broadside round onto her. */
  SWING: 5,
  /** A skirmishing sloop's seconds running off after each broadside (hit and run). */
  RUN: 4,
  /** Seconds a ship's lain still before a phantom sloop counts her fair game, whatever she is. */
  CAMPED: 6,
};

export type Goal = { kind: 'buoy'; i: number } | { kind: 'gate'; g: number; tower: number; pose: Pose; side: Side }
  | { kind: 'raid'; on: number; at: [number, number]; pose?: Pose } | { kind: 'fight'; on: number; at: [number, number] }
  | { kind: 'camp'; at: [number, number] } | { kind: 'escort'; on: number; at: [number, number] }
  | { kind: 'guns'; g: number; i: number; pose: Pose; side: Side } | { kind: 'ram'; on: number; at: [number, number] };

const same = (a: Goal | null, z: Goal | null) => !!a && !!z && JSON.stringify(a) === JSON.stringify(z);
/** The same thing to do, if not exactly (a raid on the same ship, wherever she's got to; hiding in the same cove). */
const sameAim = (a: Goal | null, z: Goal) => !!a && a.kind === z.kind && (z.kind === 'raid' || z.kind === 'fight' || z.kind === 'ram' ? (a as typeof z).on === z.on : same(a, z));

/** A buoy's worth to one side: whose it is just now, and whether a friend's already on it. */
function worth(b: Blockade, s: Ship, buoy: Buoy, i: number, mates: Goal[]): number {
  const hold = b.hold(buoy), friend = b.ships.some((o) => o !== s && o.team === s.team && b.reaches(o, buoy));
  let w = buoy.pennants * (hold === s.team ? (friend ? 0.15 : 1) : hold === 'contested' ? 1.4 : hold ? 1.5 : 1.2);
  if (mates.some((g) => g.kind === 'buoy' && g.i === i)) w *= 0.35;
  if (s.kind === 'frigate' && inHeart(...buoy.at)) w *= BOTS.HEART;
  // (a sloop in the heart once the enemy's frigates are in it: out by the winds to the lagoons, before they're caught)
  if (s.kind === 'sloop' && inHeart(...buoy.at) && b.ships.some((o) => o.team !== s.team && o.kind === 'frigate' && o.away <= 0 && !o.dmg.out && b.inHeart(o))) w *= BOTS.FLEE;
  // (a sloop, wary: a buoy an enemy frigate's close to is a sloop sunk, so she leaves it to her and goes where she isn't;
  // the user, 15 Nov, of sloops "hanging around in the middle being blown up by [war frigs], foolishly")
  // (further off, the more damaged she is: fewer risks)
  if (s.kind === 'sloop' && !s.craft && b.ships.some((o) => o.team !== s.team && o.kind === 'frigate' && o.away <= 0 && !o.dmg.out && Math.hypot(o.helm.pose.c - buoy.at[0], o.helm.pose.r - buoy.at[1]) <= BOTS.WARY * (1 + s.dmg.share()))) w *= BOTS.FLEE;
  // (a brig: the lagoons' buoys before the heart's)
  if (s.kind === 'brig') w *= inHeart(...buoy.at) ? BOTS.BRIG.HEART : BOTS.BRIG.OUT;
  return w;
}

export type Berth = { g: number; tower: number; pose: Pose; side: Side };
export type GunBerth = { g: number; i: number; pose: Pose; side: Side };
/** The towers standing, gate by gate: what the berths by them hang on. */
const towersSig = (b: Blockade) => b.gates.map((x) => x.towers.map((t) => t.hp > 0 ? 1 : 0).join('')).join('/');
const berthsKept = new WeakMap<Blockade, Map<string, Berth[]>>();
/** Every berth a ship of her kind can lie in with one side's broadside landing on a standing tower of a gate, from
    either side of its wall (the rocks only: worked out once for her kind while the same towers stand), her nearest
    first. */
export function bombardBerths(b: Blockade, s: Ship): Berth[] {
  let kept = berthsKept.get(b);
  if (!kept) berthsKept.set(b, kept = new Map());
  const k = `${s.kind}|${towersSig(b)}`;
  let all = kept.get(k);
  if (!all) {
    all = [];
    const sea = s.sea.bare();
    for (const [g, gate] of b.gates.entries()) {
      if (gate.open()) continue;
      const rows = [...Array.from({ length: 5 }, (_, n) => gate.r0 - 1 - n), ...Array.from({ length: 5 }, (_, n) => gate.r1 + 1 + n)];
      for (let c = gate.way - 6; c <= gate.way + 6; c++) for (const r of rows) for (const d of [1, 3]) {
        const pose = { c, r, d };
        if (!sea.fits(pose)) continue;
        for (const side of ['L', 'R'] as Side[]) {
          const t = b.aim(s.id, side, pose, false).find((x) => x.what?.what === 'tower');
          if (t && t.what?.what === 'tower' && t.what.g === g) all.push({ g, tower: t.what.i, pose, side });
        }
      }
    }
    kept.set(k, all);
  }
  const p = s.helm.pose, far = (x: Berth) => Math.hypot(x.pose.c - p.c, x.pose.r - p.r);
  return [...all].sort((a, z) => far(a) - far(z));
}
const gunsKept = new WeakMap<Blockade, Map<string, GunBerth[]>>();
/** Every berth a ship of her kind can lie in with one side's broadside landing on one of a gate's bastion guns still
    standing (rocks only, worked out once while the same guns stand). */
export function gunBerths(b: Blockade, s: Ship): GunBerth[] {
  let kept = gunsKept.get(b);
  if (!kept) gunsKept.set(b, kept = new Map());
  const k = `${s.kind}|${towersSig(b)}|${b.battery.map((x) => x.wrecked ? 0 : 1).join('')}`;
  let all = kept.get(k);
  if (!all) {
    all = [];
    const sea = s.sea.bare();
    for (const [g, gate] of b.gates.entries()) {
      const rows = [...Array.from({ length: 5 }, (_, n) => gate.r0 - 1 - n), ...Array.from({ length: 5 }, (_, n) => gate.r1 + 1 + n)];
      for (let c = gate.way - 9; c <= gate.way + 9; c++) for (const r of rows) for (const d of [1, 3]) {
        const pose = { c, r, d };
        if (!sea.fits(pose)) continue;
        for (const side of ['L', 'R'] as Side[]) {
          const t = b.aim(s.id, side, pose, false).find((x) => x.what?.what === 'gun');
          if (t && t.what?.what === 'gun' && b.gunGate[t.what.i] === g && !b.battery[t.what.i].wrecked) all.push({ g, i: t.what.i, pose, side });
        }
      }
    }
    kept.set(k, all);
  }
  return all;
}
/** A gate's berths for her kind, as a place on her chart: its name and its poses. */
function gatePlace(b: Blockade, s: Ship, g: number): { key: string; poses: () => number[]; berths: Berth[] } {
  const berths = bombardBerths(b, s).filter((x) => x.g === g), rows = s.sea.rows;
  return { key: `gate${g}|${towersSig(b)}`, poses: () => berths.map((x) => (x.pose.c * rows + x.pose.r) * 4 + x.pose.d), berths };
}

/** One ship's bot. */
export class Bot {
  goal: Goal | null = null;
  score = 0;
  t: number;
  /** When she last fired; when her hiding or her raid started; how long she'll lurk. */
  firedAt = -99;
  since = 0;
  lurk = 10;
  /** Places she found no way to as things are, and when (not tried again for a while: a ship's in the way). */
  noway = new Map<string, number>();
  /** In a brawl (Blockade.brawl), the one ship she fights while that ship's afloat, and nothing else; the brawl's ships,
      which everyone else leaves to it (never raided, picked a fight with or fired on). */
  foe: number | null = null;
  spare = new Set<number>();
  /** Her admiral's order (src/blockade-orders.ts), carried out before anything she'd pick herself. */
  order: Order = FREE;
  /** A skirmish (src/blockade-skirmish.ts): no buoys, the nearest enemy hers to fight, as her kind best can. */
  skirmish = false;
  constructor(public id: number, public random: () => number = Math.random) { this.t = random() * BOTS.THINK; }

  tick(b: Blockade, dt: number, mates: Goal[] = []) {
    const s = b.ship(this.id);
    if (s.dmg.out || s.away > 0) { this.goal = null; return; }
    if (b.over) return;
    // (a sloop dips, ducks and dodges: out of a frigate's broadside before it bears, firing as she goes)
    if (s.kind === 'sloop' && !s.craft && this.dodge(b, s)) { this.shoot(b, s); return; }
    // (a turtle: no guns, only her prey, looked for often)
    // (her prey looked for every RAM.THINK; steered at every frame, a move put in the moment she's free for one: looking
    // only every RAM.THINK, she idled between moves, 0.8 squares a second for all her quick handling, and her 30 seconds
    // ran out short of her frigate, 15 Nov)
    if (s.craft?.kind === 'ram') {
      // (at once when she's launched, not after the bots' usual few seconds' start)
      if (!this.goal || (this.t -= dt) <= 0) { this.t = BOTS.RAM.THINK; const goal = this.prey(b, s); this.goal = goal; }
      if (this.goal?.kind === 'ram') this.charge(b, s, this.goal.at);
      return;
    }
    // (a brig: her craft launched whenever an enemy's near)
    // (a brig launches when there's a big ship for her craft in reach and no sloop near enough to catch her at anchor:
    // launching anchors her, a sitting duck till they're home, so she does it from somewhere safe; at anchor she only
    // fires)
    if (s.kind === 'brig') {
      const near = (o: Ship, d: number) => o.team !== s.team && !o.craft && o.away <= 0 && !o.dmg.out && Math.hypot(o.helm.pose.c - s.helm.pose.c, o.helm.pose.r - s.helm.pose.r) <= d;
      // (making for her launching spot by a lagoon: not till she's there, never anchored in the open on the way)
      const spot = !this.skirmish && this.order.kind === 'free' && !b.open ? this.station(b, s) : null;
      const placed = !spot || Math.max(Math.abs(spot[0] - s.helm.pose.c), Math.abs(spot[1] - s.helm.pose.r)) <= 1;
      // (at a frigate: her craft's work, rock, paper, scissors; not at another brig, both anchored by the edge ramming
      // each other, once the sides came in from both edges, 15 Nov)
      if (placed && b.canLaunch(s) && b.ships.some((o) => o.kind === 'frigate' && near(o, BOTS.BRIG.LAUNCH)) && !b.ships.some((o) => o.kind === 'sloop' && near(o, BOTS.BRIG.SAFE))) b.launch(s.id);
      if (b.anchored(s)) { this.shoot(b, s); return; }
    }
    this.shoot(b, s);
    // (idle short of where she's going, she looks again sooner: but never more than twice a second)
    const idle = s.helm.slot < 0 && !s.helm.pin && (this.goal?.kind === 'buoy' ? !b.reaches(s, BLOCKADE.BUOYS[this.goal.i]) : this.goal?.kind === 'raid' || this.goal?.kind === 'fight');
    if ((this.t -= dt) > 0 && !(idle && this.t < BOTS.THINK - 0.5)) return;
    this.t = BOTS.THINK * (0.8 + 0.4 * this.random());
    this.think(b, s, mates);
  }

  /** Fire a side that's loaded if it would hit an enemy and no friend, the tower she's come to shoot down, or a
      gate's gun firing on her. */
  private shoot(b: Blockade, s: Ship) {
    for (const side of ['L', 'R'] as Side[]) {
      if (!s.guns.ready(side)) continue;
      const shots = b.aim(s.id, side), at = (id: number) => b.ship(id);
      // (an enemy, knocked out or not in a sinking blockade: finishing her sinks her)
      // (a sloop leaves a frigate be unless she's sniping at her end: a broadside duel with one is a sloop sunk, rock,
      // paper, scissors)
      const duel = (o: Ship) => s.kind === 'sloop' && !s.craft && o.kind === 'frigate' && this.goal?.kind !== 'raid';
      const foe = shots.some((x) => x.what?.what === 'ship' && at(x.what.id).team !== s.team && (BLOCKADE.SINKING || !at(x.what.id).dmg.out) && !duel(at(x.what.id)));
      // (a friend in the way, or one of a brawl's ships, left to it: holding fire)
      const friend = shots.some((x) => x.what?.what === 'ship' && (at(x.what.id).team === s.team || this.spare.has(x.what.id)));
      const gate = this.goal?.kind === 'gate' && s.h.guns === 'large' && shots.some((x) => x.what?.what === 'tower');
      // (a gun she's come to wreck, step by step)
      const goal = this.goal, wreck = goal?.kind === 'guns' && shots.some((x) => x.what?.what === 'gun' && x.what.i === goal.i);
      // (a gate's gun firing on anyone, or on her for camping under it)
      const gun = shots.some((x) => x.what?.what === 'gun' && (b.battery[x.what.i].roused || b.gunOn[x.what.i] === s.id) && b.battery[x.what.i].live());
      if ((foe || gate || gun || wreck) && !friend && b.fire(s.id, side)) this.firedAt = b.clock;
    }
  }

  /** Look round, and steer for what's best. */
  private think(b: Blockade, s: Ship, mates: Goal[]) {
    const g = this.pick(b, s, mates);
    if (!g) return;
    if (g.goal.kind !== 'gate' && s.sea.exact) s.sea.exact = null;
    // (when her hiding or her raid started: not again just because the ship she's raiding has moved)
    if (!sameAim(this.goal, g.goal) && g.goal.kind === 'raid') this.since = b.clock;
    this.goal = g.goal; this.score = g.score;
    this.steer(b, s);
  }

  /** What's best for her just now. */
  private pick(b: Blockade, s: Ship, mates: Goal[]): { goal: Goal; score: number } | null {
    // A brawl: she fights her foe off her side, broadside to broadside, keeping her spot while she's getting there or
    // her guns bear, and finding another as the foe moves off.
    if (this.foe !== null && b.ship(this.foe).away <= 0 && (BLOCKADE.SINKING || !b.ship(this.foe).dmg.out)) {
      const fight = this.raid(b, s, Infinity, true, this.foe);
      if (fight) {
        const was = this.goal?.kind === 'fight' && this.goal.on === this.foe ? this.goal.at : null;
        const there = was && squares(s.h, s.helm.pose).some(([c, r]) => c === was[0] && r === was[1]);
        const bears = (['L', 'R'] as Side[]).some((side) => b.aim(s.id, side).some((x) => x.what?.what === 'ship' && x.what.id === this.foe));
        return { goal: { kind: 'fight', on: this.foe, at: was && (!there || bears) ? was : fight.at }, score: 99 };
      }
    }
    // A skirmish: the nearest enemy, as her kind best can fight her: a frigate or a brig broadside on; a sloop off a big
    // ship's end, where her broadsides can't bear, and broadside to another sloop.
    if (this.skirmish && !s.craft) {
      const far = (o: Ship) => Math.hypot(o.helm.pose.c - s.helm.pose.c, o.helm.pose.r - s.helm.pose.r);
      // (a frigate leaves be an enemy in a lagoon or its shoals: she'd scrape her bottom chasing her there)
      const sheltered = (o: Ship) => s.kind === 'frigate' && b.sheltered(o);
      const t = b.ships.filter((o) => o.team !== s.team && o.away <= 0 && !o.craft && !sheltered(o)).sort((a, z) => far(a) - far(z))[0];
      // (a brig on the blockade's board, with a big ship for her craft to go after, makes for a lagoon and lies in it, out
      // of any frigate's reach, launching from there: the terrain's hers, her craft slipping out through its gaps. With
      // only sloops against her, there's nothing to launch at: she fights in the open)
      if (s.kind === 'brig' && !b.open && b.ships.some((o) => o.team !== s.team && !o.craft && o.away <= 0 && o.kind !== 'sloop')) {
        const inside = BLOCKADE.REEFS.find((x) => Math.max(Math.abs(s.helm.pose.c - x.at[0]), Math.abs(s.helm.pose.r - x.at[1])) <= 2);
        if (inside) return { goal: { kind: 'camp', at: [s.helm.pose.c, s.helm.pose.r] }, score: 9 };
        const lagoon = BLOCKADE.REEFS.map((x) => ({ at: x.hide, eta: s.sea.eta(s.helm.pose, ...x.hide) })).filter((x) => x.eta < Infinity).sort((a, z) => a.eta - z.eta)[0];
        if (lagoon) return { goal: { kind: 'camp', at: lagoon.at }, score: 9 };
      }
      if (t) {
        // (a sloop hits and runs: a few seconds away from her after each broadside, then back at her)
        if (s.kind === 'sloop' && b.clock - this.firedAt < BOTS.RUN) {
          const p = s.helm.pose, dc = p.c - t.helm.pose.c, dr = p.r - t.helm.pose.r, k = 6 / (Math.hypot(dc, dr) || 1);
          const at: [number, number] = [Math.max(1, Math.min(BLOCKADE.COLS - 2, Math.round(p.c + dc * k))), Math.max(1, Math.min(BLOCKADE.ROWS - 2, Math.round(p.r + dr * k)))];
          if (s.sea.bare().open(...at)) return { goal: { kind: 'camp', at }, score: 9 };
        }
        if (s.kind === 'sloop' && t.kind !== 'sloop') { const r = this.raid(b, s, Infinity, false, t.id); if (r) return { goal: r, score: 9 }; }
        const f = this.raid(b, s, Infinity, true, t.id);
        // (her spot off her side picked afresh each look, as she moves: kept while she's still near her, so she doesn't
        // change her mind every look)
        if (f) {
          const was = this.goal?.kind === 'fight' && this.goal.on === t.id ? this.goal.at : null, near = was && Math.hypot(was[0] - f.at[0], was[1] - f.at[1]) <= 2;
          return { goal: { kind: 'fight', on: t.id, at: near ? was! : f.at }, score: 9 };
        }
      }
    }
    // Her admiral's order, if she has one (sniping's a raider's way, below; the middle and the outside bend her own
    // choice, below).
    if (!['free', 'snipe', 'middle', 'outside', 'rush'].includes(this.order.kind)) {
      const goal = this.ordered(b, s, this.order);
      if (goal) return { goal, score: 50 };
    }
    // A brig, with an enemy frigate in the heart: to her lagoon's corner nearest it, beside the gap the wind runs through
    // into the fort, out of any frigate's reach (a frigate scrapes her bottom in the shoals), to launch her craft in at
    // her along the wind (the user, 15 Nov: "war frigs camping in the middle, war brigs sending turtles in through the
    // gaps ... I just want to see the war brigs camping out there more and sending in the turtles").
    if (s.kind === 'brig' && !s.craft && !this.skirmish && this.order.kind === 'free' && !b.open) {
      const there = this.station(b, s);
      if (there) return { goal: { kind: 'camp', at: there }, score: 9 };
    }
    // A raider darts out at an enemy brig or frigate's end, and back to the buoys a while; never hiding (the user, 15 Nov:
    // "you never hide. There's just no tactical reason or benefit to. You lose coverage of points").
    const raider = this.order.kind === 'snipe' || (this.order.kind === 'free' && s.raider);
    // A phantom sloop darts at anything slow or sat still (a frigate first, a brig, a ship that's lain still a while),
    // again and again: she's only a while, nothing can hurt her, no hiding.
    if (phantom(s)) {
      const raid = this.raid(b, s, Infinity);
      if (raid) return { goal: raid, score: 8 };
    }
    if (s.kind === 'sloop' && !s.craft && raider) {
      const raiding = this.goal?.kind === 'raid', done = raiding && (this.firedAt > this.since || b.clock - this.since > BOTS.RAID);
      if (done) this.rest = b.clock + BOTS.LURK[0] + this.random() * (BOTS.LURK[1] - BOTS.LURK[0]);
      // (a brig before a frigate: rock, paper, scissors, the sloops' to beat; only with the nerve for it)
      const raid = b.clock < this.rest ? null : this.raid(b, s, BOTS.REACH, false, undefined, 'brig');
      if (raid && this.nerve(s, b.ship(raid.on)) >= BOTS.NERVE.GO) return { goal: raid, score: 8 };
    }
    // A sloop with an enemy brig close by goes for her, off her end where the brig's broadsides can't bear: too quick
    // for a brig (rock, paper, scissors, 15 Nov: "sloops beat war brigs ... because of how they can just dart around
    // and evade them").
    if (s.kind === 'sloop' && !s.craft && this.order.kind === 'free') {
      const raid = this.raid(b, s, BOTS.ENGAGE, false, undefined, 'brig');
      if (raid && b.ship(raid.on).kind === 'brig' && this.nerve(s, b.ship(raid.on)) >= BOTS.NERVE.GO) return { goal: raid, score: 7 };
    }
    const best: { goal: Goal; score: number }[] = [], p = s.helm.pose, post = this.order.kind;
    // (a strategy's weights: the heart's buoys, the gates, the fights)
    const heartW = post === 'rush' ? 3 : post === 'siege' ? 2 : 1, gateW = post === 'rush' || post === 'siege' ? 1.5 : 1, fightW = post === 'rush' ? 0.4 : 1;
    BLOCKADE.BUOYS.forEach((buoy, i) => {
      const heart = inHeart(...buoy.at);
      if ((post === 'middle' && !heart) || (post === 'outside' && heart)) return;
      const w = worth(b, s, buoy, i, mates) * (heart ? heartW : 1);
      if (b.reaches(s, buoy)) { best.push({ goal: { kind: 'buoy', i }, score: w / 10 }); return; }
      // (how long it really is, off her chart: none, and there's no way (a frigate and the heart, its gates shut))
      const eta = s.sea.eta(p, ...buoy.at);
      if (eta < Infinity) best.push({ goal: { kind: 'buoy', i }, score: w / (4 + eta) });
    });
    // (any gate still shut: the one nearest her may be quicker shot down than sailing round to one that's open; a
    // gate a friend's already shooting at is left to her)
    if (s.kind === 'frigate' && post !== 'outside') for (const [g, gate] of b.gates.entries()) {
      if (gate.open() || mates.some((m) => m.kind === 'gate' && m.g === g)) continue;
      const place = gatePlace(b, s, g);
      if (!place.berths.length) continue;
      const here = place.berths.find((x) => x.pose.c === p.c && x.pose.r === p.r && x.pose.d === p.d);
      // (her own berth while it's still a berth, so she doesn't change her mind for another each look; else the
      // nearest, where her quickest way to any of them ends)
      const mine = this.goal?.kind === 'gate' && this.goal.g === g ? place.berths.find((x) => same({ kind: 'gate', ...x }, this.goal)) : undefined;
      const nearest = () => { const way = s.sea.plotAny(p, place.key, place.poses); return way ? place.berths.find((x) => x.pose.c === way.to.c && x.pose.r === way.to.r && x.pose.d === way.to.d) : undefined; };
      const berth = here ?? mine ?? nearest();
      if (!berth) continue;
      // (the gate's own field, its nearest berth's, unless she's set on another of its berths already)
      const eta = here ? 0 : mine ? s.sea.eta(p, berth.pose.c, berth.pose.r, berth.pose) : s.sea.etaAny(p, place.key, place.poses);
      if (!(eta < Infinity)) continue;
      const prize = BLOCKADE.BUOYS.filter((x) => inHeart(...x.at)).reduce((t, x) => t + x.pennants, 0) * 1.3;
      const left = gate.towers[berth.tower].hp;
      best.push({ goal: { kind: 'gate', ...berth }, score: gateW * prize / (4 + eta + left * s.h.reload * 0.5) });
    }
    // A frigate fights an enemy close by (the nearest; a frigate before a sloop), lying off her side; a brig another
    // brig, her craft the frigates (rock, paper, scissors: she leaves the sloops, too quick for her, be).
    if (s.kind === 'frigate' || s.kind === 'brig') {
      // (a frigate holding a buoy in the heart keeps it: she fights only what comes at her there, the points hers while
      // she lies on them; the user, 15 Nov: "people aren't really paying attention to the points. They're just going off
      // and starting a few fights")
      const holds = s.kind === 'frigate' && BLOCKADE.BUOYS.some((x) => inHeart(...x.at) && b.reaches(s, x));
      // (a frigate a sloop before anything: rock, paper, scissors, hers to sink, sheer weight of shot)
      const fight = this.raid(b, s, holds ? BOTS.HOLD : BOTS.ENGAGE, true, undefined, s.kind === 'brig' ? 'brig' : 'sloop');
      if (fight) {
        const was = this.goal?.kind === 'fight' && this.goal.on === fight.on, eta = Math.hypot(fight.at[0] - s.helm.pose.c, fight.at[1] - s.helm.pose.r) / s.h.stride * s.h.move;
        const o = b.ship(fight.on), near = (x: typeof o) => Math.hypot(x.helm.pose.c - o.helm.pose.c, x.helm.pose.r - o.helm.pose.r) <= BOTS.SAVE;
        // (to finish her off, or to drive her off a friend who's knocked out)
        const why = (o.dmg.out ? BOTS.FINISH : 1) * (b.ships.some((x) => x.team === s.team && x !== s && x.dmg.out && x.away <= 0 && near(x)) ? BOTS.RESCUE : 1);
        const big = s.kind === 'brig' ? (o.kind === 'brig' ? 1.5 : 0.25) : o.kind === 'sloop' ? 1.6 : o.kind === 'frigate' ? 1.3 : 0.8;
        // (more for one more damaged than she is, less for one she'd lose to: her nerve; and a fight's for the points: one
        // on a buoy, or contesting one, is worth it, one off them far less: 15 Nov, "this is a game about the points")
        const onPoints = BLOCKADE.BUOYS.some((x) => b.reaches(o, x)) ? 1 : BOTS.OFF_POINTS;
        best.push({ goal: { kind: 'fight', on: fight.on, at: was && this.goal?.kind === 'fight' ? this.goal.at : fight.at }, score: fightW * BOTS.FIGHT * big * why * this.nerve(s, o) * onPoints / (4 + eta) });
      }
    }
    // Best first.
    best.sort((a, z) => z.score - a.score);
    const top = best[0];
    if (!top) return null;
    // (sticking to what she's at unless the new is much better, and it's still there to do)
    const mineNow = this.goal && best.find((x) => same(x.goal, this.goal));
    const goal = this.goal, gone = goal?.kind === 'gate' && b.gates[goal.g].open();
    if (mineNow && !same(top.goal, goal) && top.score < mineNow.score * BOTS.STICK && !gone) return mineNow;
    return top;
  }

  /** What her order has her do just now (null: nothing, for now: she does as she'd choose). */
  private ordered(b: Blockade, s: Ship, o: Order): Goal | null {
    switch (o.kind) {
      case 'hold': return { kind: 'buoy', i: o.buoy };
      case 'camp': return { kind: 'camp', at: o.at };
      case 'gate': {
        // (down already: done, and she's her own again)
        if (s.kind !== 'frigate' || b.gates[o.g].open()) { this.order = FREE; return null; }
        const place = gatePlace(b, s, o.g), p = s.helm.pose;
        const here = place.berths.find((x) => x.pose.c === p.c && x.pose.r === p.r && x.pose.d === p.d);
        const mine = this.goal?.kind === 'gate' && this.goal.g === o.g ? place.berths.find((x) => same({ kind: 'gate', ...x }, this.goal)) : undefined;
        const way = here || mine ? null : s.sea.plotAny(p, place.key, place.poses);
        const berth = here ?? mine ?? (way ? place.berths.find((x) => x.pose.c === way.to.c && x.pose.r === way.to.r && x.pose.d === way.to.d) : undefined);
        return berth ? { kind: 'gate', ...berth } : null;
      }
      case 'frigates': case 'sinks': {
        // (their frigates: the nearest, wherever she is; sinks: whoever's most hurt in reach, knocked out first)
        const foes = b.ships.filter((x) => x.team !== s.team && x.away <= 0 && (o.kind === 'sinks' ? Math.hypot(x.helm.pose.c - s.helm.pose.c, x.helm.pose.r - s.helm.pose.r) <= BOTS.REACH : x.kind === 'frigate'));
        const far = (x: Ship) => Math.hypot(x.helm.pose.c - s.helm.pose.c, x.helm.pose.r - s.helm.pose.r);
        const t = o.kind === 'sinks' ? foes.filter((x) => x.dmg.share() > 0.2).sort((a, z) => (z.dmg.out ? 2 : z.dmg.share()) - (a.dmg.out ? 2 : a.dmg.share()))[0] : foes.sort((a, z) => far(a) - far(z))[0];
        if (!t) return null;
        const at = this.raid(b, s, Infinity, true, t.id);
        return at ? { kind: 'fight', on: t.id, at: at.at } : null;
      }
      case 'siege': {
        // (the nearest gate still shut: its guns wrecked first, then its tower, by her own choice, then in)
        if (s.kind !== 'frigate') return null;
        const p = s.helm.pose, shut = b.gates.map((x, g) => ({ g, x })).filter(({ x }) => !x.open());
        const g = shut.map(({ g }) => ({ g, eta: s.sea.etaAny(p, gatePlace(b, s, g).key, gatePlace(b, s, g).poses) })).sort((a, z) => a.eta - z.eta)[0]?.g;
        if (g === undefined) return null;
        const all = gunBerths(b, s).filter((x) => x.g === g), rows = s.sea.rows;
        if (!all.length) return null;
        const here = all.find((x) => x.pose.c === p.c && x.pose.r === p.r && x.pose.d === p.d);
        const mine = this.goal?.kind === 'guns' ? all.find((x) => same({ kind: 'guns', ...x }, this.goal)) : undefined;
        const key = `guns${g}|${b.battery.map((x) => x.wrecked ? 0 : 1).join('')}|${towersSig(b)}`;
        const way = here || mine ? null : s.sea.plotAny(p, key, () => all.map((x) => (x.pose.c * rows + x.pose.r) * 4 + x.pose.d));
        const berth = here ?? mine ?? (way ? all.find((x) => x.pose.c === way.to.c && x.pose.r === way.to.r && x.pose.d === way.to.d) : undefined);
        return berth ? { kind: 'guns', ...berth } : null;
      }
      case 'hunt': {
        const t = b.ship(o.ship);
        if (t.away > 0) return null;
        // (a sloop after a frigate snipes at her end; anyone else lies off her side)
        const at = this.raid(b, s, Infinity, !(s.kind === 'sloop' && t.kind === 'frigate'), o.ship);
        return at ? (at.pose ? at : { kind: 'fight', on: o.ship, at: at.at }) : null;
      }
      case 'escort': {
        const f = b.ship(o.ship);
        if (f.away > 0) return null;
        // (an enemy coming at her: fight her off; else keep off her side)
        const fm = drawnAt(f.h, { c: f.helm.pose.c, r: f.helm.pose.r, a: f.helm.pose.d });
        const threat = b.ships.filter((x) => x.team !== s.team && x.away <= 0 && !x.dmg.out && Math.hypot(x.helm.pose.c - fm.c, x.helm.pose.r - fm.r) <= BOTS.ENGAGE)
          .sort((a, z) => Math.hypot(a.helm.pose.c - fm.c, a.helm.pose.r - fm.r) - Math.hypot(z.helm.pose.c - fm.c, z.helm.pose.r - fm.r))[0];
        if (threat) { const at = this.raid(b, s, Infinity, true, threat.id); if (at) return { kind: 'fight', on: threat.id, at: at.at }; }
        // (off her side, the nearer side to her first; rocks there, a little nearer or further off, then astern of
        // her, then the nearest open water to her)
        const d = f.helm.pose.d, sd = (d + 1) % 4, DC = [0, 1, 0, -1], DR = [1, 0, -1, 0], k = BOTS.OFF + Math.max(f.h.wide, s.h.wide), sea = s.sea.bare();
        const near = (a: [number, number], z: [number, number]) => Math.hypot(a[0] - s.helm.pose.c, a[1] - s.helm.pose.r) - Math.hypot(z[0] - s.helm.pose.c, z[1] - s.helm.pose.r);
        const at = (x: number, y: number): [number, number] => [Math.round(fm.c + DC[sd] * x + DC[d] * y), Math.round(fm.r + DR[sd] * x + DR[d] * y)];
        for (const off of [k, k - 1, k + 1, k - 2, k + 2]) {
          const spots = [at(off, 0), at(-off, 0)].filter(([c, r]) => sea.open(c, r)).sort(near);
          if (spots.length) return { kind: 'escort', on: o.ship, at: spots[0] };
        }
        const astern = at(0, -(Math.ceil(f.h.long / 2) + k));
        if (sea.open(...astern)) return { kind: 'escort', on: o.ship, at: astern };
        for (let ring = 1; ring < 8; ring++) {
          const round: [number, number][] = [];
          for (let x = -ring; x <= ring; x++) for (let y = -ring; y <= ring; y++) if (Math.max(Math.abs(x), Math.abs(y)) === ring) round.push([Math.round(fm.c) + x, Math.round(fm.r) + y]);
          const open = round.filter(([c, r]) => sea.open(c, r) && !squares(f.h, f.helm.pose).some(([x, y]) => x === c && y === r)).sort(near);
          if (open.length) return { kind: 'escort', on: o.ship, at: open[0] };
        }
        return null;
      }
      default: return null;
    }
  }

  /** A brig's launching spot, while an enemy frigate's in the heart: the square inside a lagoon nearest the heart's
      middle, or a corner of the heart itself (out of the reach of any frigate in there, a postern or a way out by it:
      the user, 15 Nov, "an enclosed launching spot for a brig"), whichever she gets to soonest (none: no enemy frigate
      in there, or no way to one). */
  private station(b: Blockade, s: Ship): [number, number] | null {
    const frigate = b.ships.some((o) => o.team !== s.team && o.kind === 'frigate' && o.away <= 0 && !o.dmg.out && b.inHeart(o));
    if (!frigate) return null;
    const [hc, hr] = BLOCKADE.BUOYS[0].at, sea = s.sea.bare(), H = BLOCKADE.HEART;
    const spots = BLOCKADE.REEFS.map((x) => {
      const inside: [number, number][] = [];
      for (let dc = 1 - x.ring; dc < x.ring; dc++) for (let dr = 1 - x.ring; dr < x.ring; dr++) if (sea.open(x.at[0] + dc, x.at[1] + dr)) inside.push([x.at[0] + dc, x.at[1] + dr]);
      return inside.sort((a, z) => Math.hypot(a[0] - hc, a[1] - hr) - Math.hypot(z[0] - hc, z[1] - hr))[0];
    }).concat(([[H.c0, H.r1], [H.c1, H.r1], [H.c0, H.r0], [H.c1, H.r0]] as [number, number][]).filter(([c, r]) => sea.open(c, r))).filter(Boolean).map((at) => ({ at, eta: at[0] === s.helm.pose.c && at[1] === s.helm.pose.r ? 0 : s.sea.eta(s.helm.pose, ...at) }))
      .filter((x) => x.eta < Infinity && !this.blocked(b, x.at)).sort((a, z) => a.eta - z.eta);
    return spots[0]?.at ?? null;
  }

  /** Her nerve against an enemy: more than 1 if he's more damaged than she is (she presses in), less if she's the more
      damaged (she takes fewer risks); the user, 15 Nov: "being more or less aggressive depending on your damage level ...
      if you know the person next to you is more damaged than you are, you get more aggressive. If you're damaged, you
      might kind of take fewer risks". */
  nerve(s: Ship, o: Ship): number {
    const d = (o.dmg.out ? 1 : o.dmg.share()) - s.dmg.share();
    return Math.max(BOTS.NERVE.MIN, Math.min(BOTS.NERVE.MAX, 1 + BOTS.NERVE.K * d));
  }
  /** Till when a raider's back on the buoys after a raid. */
  private rest = -1;

  /** A raid (or a frigate's fight): the nearest enemy frigate in reach (`any`: any enemy ship, frigates first), and
      where to fire from: a raider's, lying across her line off her bow or her stern, her broadside raking her end
      while none of the frigate's can bear on her; a frigate's fight, a square off her side, broadside to broadside. */
  private raid(b: Blockade, s: Ship, reach: number = BOTS.REACH, any = false, only?: number, first: Ship['kind'] = 'frigate'): { kind: 'raid'; on: number; at: [number, number]; pose?: Pose } | null {
    const p = s.helm.pose;
    // (a frigate's fight can be with one knocked out, to sink her, in a sinking blockade; a raider's never)
    // (a raider's: a frigate or a brig, both too slow to answer a sloop off her end)
    const camped = (o: Ship) => phantom(s) && (b.still.get(o.id) ?? 0) >= BOTS.CAMPED && !o.craft;
    // (a big ship never goes after a brig's craft of her own choosing: too quick to catch and only a while, she shoots
    // them as they come in reach and keeps to what she's at)
    // (nor a ship sheltering in a lagoon or its shoals, for a frigate: she'd scrape her bottom going in after her, and
    // there are no points in chasing her there)
    // (and nobody goes after a ship in the safe zone round the edge: there's no shooting there)
    const chase = (o: Ship) => !b.safe(o) && !(any && only === undefined && ((o.craft && (s.kind === 'frigate' || s.kind === 'brig')) || (s.kind === 'frigate' && b.sheltered(o))));
    const foes = b.ships.filter((o) => o.team !== s.team && !phantom(o) && chase(o) && (any || o.kind === 'frigate' || o.kind === 'brig' || camped(o)) && o.away <= 0 && (any && BLOCKADE.SINKING ? true : !o.dmg.out) && (only === undefined ? !this.spare.has(o.id) : o.id === only))
      .map((o) => ({ o, m: drawnAt(o.h, { c: o.helm.pose.c, r: o.helm.pose.r, a: o.helm.pose.d }) }))
      .filter(({ m }) => Math.hypot(m.c - p.c, m.r - p.r) <= reach)
      .sort((a, z) => (a.o.kind === z.o.kind ? 0 : a.o.kind === first ? -1 : z.o.kind === first ? 1 : 0) || Math.hypot(a.m.c - p.c, a.m.r - p.r) - Math.hypot(z.m.c - p.c, z.m.r - p.r));
    const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
    for (const { o, m } of foes) {
      if (!any) {
        const op = o.helm.pose, d = op.d, al = alongs(o.h), ends: [number, number][] = [[al[al.length - 1], 1], [al[0], -1]], snipes: { x: Pose; bow: boolean }[] = [];
        for (const [end, dir] of ends) for (const k of BOTS.END) for (const q of [(d + 1) % 4, (d + 3) % 4]) {
          const x = { c: op.c + DC[d] * (end + dir * k), r: op.r + DR[d] * (end + dir * k), d: q };
          if (s.sea.fits(x)) snipes.push({ x, bow: dir > 0 });
        }
        // (the quickest to lie in, off her chart; her stern sooner than her bow, which is in her way as she sails on at
        // you, and blocks her)
        const best = snipes.map(({ x, bow }) => ({ x, eta: s.sea.eta(p, x.c, x.r, x) + (bow ? BOTS.BOW : 0) })).filter((x) => x.eta < Infinity).sort((a, z) => a.eta - z.eta)[0];
        if (best) return { kind: 'raid', on: o.id, at: [best.x.c, best.x.r], pose: best.x };
        continue;
      }
      const sd = (o.helm.pose.d + 1) % 4;
      const spots = [1, -1].map((k) => [Math.round(m.c + DC[sd] * k * BOTS.OFF), Math.round(m.r + DR[sd] * k * BOTS.OFF)] as [number, number])
        // (never in the shoals, for a frigate: she'd scrape her bottom lying there)
        .filter(([c, r]) => s.sea.open(c, r) && !squares(o.h, o.helm.pose).some(([x, y]) => x === c && y === r) && !(s.kind === 'frigate' && b.shoals.has(`${c},${r}`)))
        .sort((a, z) => Math.hypot(a[0] - p.c, a[1] - p.r) - Math.hypot(z[0] - p.c, z[1] - p.r));
      if (spots.length) return { kind: 'raid', on: o.id, at: spots[0] };
    }
    return null;
  }

  /** A turtle's prey: the nearest enemy ship, whatever she is (whether she can catch her is her handling's to say: the
      user, 15 Nov, "it feels a bit artificial ... turtles don't go for sloops at all, rather than it being a mechanical
      advantage"), and where to come at her: astern of her, where none of her broadsides bears, else off her quarter,
      else anywhere beside her. */
  private prey(b: Blockade, s: Ship): { kind: 'ram'; on: number; at: [number, number] } | null {
    const p = s.helm.pose, sea = s.sea.bare(), far = (c: number, r: number) => Math.hypot(c - p.c, r - p.r), DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
    // (a brawl's ships left to it, as every bot leaves them)
    // (a ship lying still first, a few squares' worth: she can only ram one that's still, so a frigate camped on a buoy
    // is hers before a sloop darting about nearer)
    // (and worth: a frigate's worth sinking far more than a sloop, a brig between, as a captain weighs it; and the one
    // she's after already, so she doesn't change her mind every look. Since no sloop hides, sloops lying on the
    // lagoons' buoys drew the turtles off the frigates they were launched at: 15 Nov, 3 or 4 rams on frigates a game)
    const was = this.goal?.kind === 'ram' ? this.goal.on : -1;
    const lies = (o: Ship) => far(o.helm.pose.c, o.helm.pose.r) - ((b.still.get(o.id) ?? 0) >= RAM_STILL ? BOTS.RAM.STILL_FIRST : 0)
      - (o.kind === 'frigate' ? BOTS.RAM.WORTH : o.kind === 'brig' ? BOTS.RAM.WORTH / 2 : 0) - (o.id === was ? BOTS.RAM.KEEP : 0);
    const foes = b.ships.filter((o) => o.team !== s.team && !o.craft && o.away <= 0 && !b.safe(o) && !this.spare.has(o.id) && far(o.helm.pose.c, o.helm.pose.r) <= BOTS.RAM.REACH)
      .sort((a, z) => lies(a) - lies(z));
    for (const o of foes) {
      const op = o.helm.pose, d = op.d, sd = (d + 1) % 4, al = alongs(o.h)[0], hers = squares(o.h, op), on = new Set(hers.map(([c, r]) => `${c},${r}`));
      // (astern: the squares just past her stern, across her; then her quarters, a square further out each side)
      const stern = Array.from(new Set(hers.map(([c, r]) => (c - op.c) * DC[d] + (r - op.r) * DR[d] === al ? `${c + DC[d] * -1},${r + DR[d] * -1}` : ''))).filter(Boolean).map((k) => k.split(',').map(Number) as [number, number]);
      const quarters = stern.flatMap(([c, r]) => [[c + DC[sd], r + DR[sd]], [c - DC[sd], r - DR[sd]]] as [number, number][]);
      const beside: [number, number][] = [];
      for (const [c, r] of hers) for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) beside.push([c + dc, r + dr]);
      for (const ring of [stern, quarters, beside]) {
        const spots = ring.filter(([x, y]) => !on.has(`${x},${y}`) && sea.open(x, y) && !this.blocked(b, [x, y])).sort((a, z) => far(...a) - far(...z));
        if (spots.length) return { kind: 'ram', on: o.id, at: spots[0] };
      }
    }
    return null;
  }

  /** A turtle's way to her prey: straight at her, a move at a time, whichever of her moves ends nearest her (no
      pilot's way worked out: her prey's moved by the next look anyway); stuck a while getting no nearer (rocks in
      her way), her pilot's way round them. */
  private charge(b: Blockade, s: Ship, at: [number, number]) {
    const p = s.helm.pose, far = (q: Pose) => Math.hypot(q.c - at[0], q.r - at[1]), now = far(p);
    if (now < this.near - 0.5) { this.near = now; this.since = b.clock; }
    if (b.clock - this.since > BOTS.RAM.STUCK) { this.near = now; this.since = b.clock; this.steer(b, s); return; }
    if (s.helm.pin || s.helm.slot >= 0 || s.helm.mine.length) return;
    // (a whole turn's worth at once, each the move ending nearest her prey from where the last leaves her: one at a time,
    // every move was a turn of its own and its breather after, a second and a half a square, 15 Nov)
    let q = p;
    for (let k = 0; k < SAIL_SLOTS && far(q) > 1.5; k++) {
      const moves = (['F', 'L', 'R'] as const).filter((m) => s.sea.clear(q, m)).map((m) => ({ m, to: shipPath(s.h, q, m).to })).map((x) => ({ ...x, d: far(x.to) - (x.m === 'F' ? 0.01 : 0) }));
      moves.sort((a, z) => a.d - z.d);
      if (!moves.length || !s.helm.put(moves[0].m)) break;
      q = moves[0].to;
    }
  }
  /** A turtle's nearest yet to her prey (charge). */
  private near = Infinity;

  /** Swing her broadside round onto an enemy in gun range that neither side of hers bears on just now (lying ahead of or
      astern of her): a turn, if she's free to make one. Whether she did. */
  private swing(b: Blockade, s: Ship, o: Ship): boolean {
    if (o.away > 0 || s.helm.slot >= 0 || s.helm.mine.length) return false;
    const p = s.helm.pose, m = drawnAt(o.h, { c: o.helm.pose.c, r: o.helm.pose.r, a: o.helm.pose.d }), me = drawnAt(s.h, { c: p.c, r: p.r, a: p.d });
    const dc = m.c - me.c, dr = m.r - me.r;
    if (Math.hypot(dc, dr) > BOTS.SWING) return false;
    if ((['L', 'R'] as Side[]).some((side) => b.aim(s.id, side).some((x) => x.what?.what === 'ship' && x.what.id === o.id))) return false;
    const DC = [0, 1, 0, -1], DR = [1, 0, -1, 0], ahead = dc * DC[p.d] + dr * DR[p.d], across = dc * DC[(p.d + 1) % 4] + dr * DR[(p.d + 1) % 4];
    if (Math.abs(ahead) < Math.abs(across)) return false;   // (abeam already: her guns will bear as she lies)
    const turn = (['L', 'R'] as const).find((m2) => s.sea.clear(p, m2));
    if (!turn) return false;
    if (s.helm.pin) s.helm.stop();
    s.helm.put(turn);
    return true;
  }

  /** Dip, duck and dodge (the user, 15 Nov: "in the open water, it would be suicide, but in there are ways to dip and
      dodge"): a sloop on a square an enemy frigate's broadside reaches, from where she lies or where the move she's on
      will leave her (her turn the warning: two and a half seconds of it, a sloop's move one), with that side loaded or
      nearly, gets off it to the nearest square none of them reach, a square behind a rock among them (shots stop at
      rocks). Whether she's dodging. */
  private dodge(b: Blockade, s: Ship): boolean {
    const p = s.helm.pose, here = `${p.c},${p.r}`;
    // (still on her way to cover she chose: keep at it a moment)
    if (b.clock < this.dodging && this.goal?.kind === 'camp') { if (!(p.c === this.goal.at[0] && p.r === this.goal.at[1])) return true; }
    const danger = new Set<string>();
    for (const f of b.ships) {
      if (f.team === s.team || f.kind !== 'frigate' || f.away > 0 || f.dmg.out || Math.max(Math.abs(f.helm.pose.c - p.c), Math.abs(f.helm.pose.r - p.r)) > BOTS.DODGE.NEAR) continue;
      const poses = [f.helm.pose, f.helm.after()];
      for (const side of ['L', 'R'] as Side[]) {
        if (f.guns.wait[side] > BOTS.DODGE.LOADED) continue;
        for (const at of poses) for (const shot of b.aim(f.id, side, at, false)) for (const [c, r] of shot.cells) danger.add(`${c},${r}`);
      }
    }
    if (!danger.has(here)) return false;
    // (a duck: whichever of her moves next ends her out of it, one ending beside a rock first, straight on before a turn)
    const cover = (c: number, r: number) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([x, y]) => b.rocks.has(`${c + x},${r + y}`));
    if (s.helm.slot < 0 || !s.helm.cur) {
      const ducks = (['F', 'L', 'R'] as const).filter((m) => s.sea.clear(p, m)).map((m) => {
        const got = s.sea.move(p, m), to = got.ride.length ? got.ride[got.ride.length - 1] : got.to;
        return { m, to, score: (danger.has(`${to.c},${to.r}`) ? 10 : 0) - (cover(to.c, to.r) ? 1 : 0) + (m === 'F' ? 0 : 0.5) };
      }).filter((x) => x.score < 10).sort((a, z) => a.score - z.score);
      if (ducks.length) {
        if (s.helm.pin) s.helm.stop();
        while (s.helm.mine.length) s.helm.unput();
        s.helm.put(ducks[0].m);
        this.goal = { kind: 'camp', at: [ducks[0].to.c, ducks[0].to.r] }; this.dodging = b.clock + BOTS.DODGE.SECS;
        return true;
      }
    }
    const sea = s.sea.bare(), spots: { at: [number, number]; d: number; cover: boolean }[] = [];
    for (let dc = -2; dc <= 2; dc++) for (let dr = -2; dr <= 2; dr++) {
      const c = p.c + dc, r = p.r + dr;
      if ((!dc && !dr) || danger.has(`${c},${r}`) || !sea.open(c, r) || b.under(c, r)) continue;
      const near = cover(c, r);
      spots.push({ at: [c, r], d: Math.hypot(dc, dr) - (near ? 0.4 : 0), cover: near });
    }
    spots.sort((a, z) => a.d - z.d);
    const to = spots.find((x) => !this.blocked(b, x.at));
    if (!to) return false;
    this.goal = { kind: 'camp', at: to.at }; this.dodging = b.clock + BOTS.DODGE.SECS;
    this.steer(b, s);
    return true;
  }
  /** Till when she's on her way to the cover she dodged to. */
  private dodging = -1;

  /** She found no way there as things are a little while ago (another ship in the way): left alone a while. */
  private blocked(b: Blockade, at: [number, number]): boolean {
    const when = this.noway.get(`${at[0]},${at[1]}`);
    return when !== undefined && b.clock - when < BOTS.NOWAY;
  }
  /** Her way to a square as things are (round the ships near her), or null: none, and it's left alone a while. */
  private way(b: Blockade, s: Ship, at: [number, number]) {
    if (this.blocked(b, at)) return null;
    const k = `${at[0]},${at[1]}`, got = s.sea.plot(s.helm.after(), ...at);
    // (a big ship's way round the ships in hers far longer than the way itself (a gateway full, say): they'll have moved
    // long before she's got round, so she waits for them rather than setting off right round the fort, 15 Nov: "one's
    // really out there, near the edge of the map. Like, what is going on again?")
    if (got && s.kind !== 'sloop' && got.length * s.h.move > s.sea.eta(s.helm.after(), ...at) * BOTS.DETOUR + 6) return null;
    if (got) this.noway.delete(k); else this.noway.set(k, b.clock);
    return got;
  }
  /** Set her pin for her goal. */
  private steer(b: Blockade, s: Ship) {
    const g = this.goal!;
    // (in a fight and in gun range of her, no broadside bearing: she swings her side round to her, rather than sailing on
    // for a spot off her side that moves as she does, the two of them circling and never firing)
    if (g.kind === 'fight' && this.swing(b, s, b.ship(g.on))) return;
    if (g.kind === 'gate' || g.kind === 'guns') {
      const p = s.helm.pose;
      if (!(p.c === g.pose.c && p.r === g.pose.r && p.d === g.pose.d)) s.helm.sailTo(g.pose);
      return;
    }
    if (g.kind === 'raid' && g.pose) {
      // (lying across her line off her end, broadside on: firing as she bears)
      const p = s.helm.pose;
      if (p.c === g.pose.c && p.r === g.pose.r && p.d === g.pose.d) return;
      if (s.helm.sailTo(g.pose)) return;
    }
    if (g.kind === 'buoy' && b.reaches(s, BLOCKADE.BUOYS[g.i])) { if (s.helm.pin) s.helm.stop(); return; }
    const at = g.kind === 'buoy' ? BLOCKADE.BUOYS[g.i].at : g.at;
    // (lying off her, or where she's camped, or by the friend she's escorting: firing as they bear)
    if ((g.kind === 'fight' || g.kind === 'camp' || g.kind === 'escort') && squares(s.h, s.helm.pose).some(([c, r]) => c === at[0] && r === at[1])) { if (s.helm.pin && g.kind !== 'fight') s.helm.stop(); return; }
    if (s.helm.pose.c === at[0] && s.helm.pose.r === at[1]) return;
    // (only if she can get there as things are: another ship in her way, she waits for her next look)
    if (this.way(b, s, at)) { s.helm.drop(...at); return; }
    // (another ship's in her way: rather than wait on each other for ever, she makes a move of her own, forward if
    // she can, to try another way)
    // (a big ship waits instead: a move off at random is a big ship's long way off her course)
    if (s.kind !== 'sloop') { if (s.helm.pin) s.helm.stop(); return; }
    if (s.helm.slot < 0 && !s.helm.mine.length) {
      const free = (['F', 'L', 'R'] as const).filter((m) => s.sea.clear(s.helm.pose, m));
      if (free.length) s.helm.put(free.includes('F') && this.random() < 0.6 ? 'F' : free[Math.floor(this.random() * free.length)]);
    }
  }
}

/** Every ship's bot. */
export class Bots {
  bots: Bot[];
  /** `brawl`: two ships' ids (Blockade.brawl) that fight each other and nothing else. */
  constructor(b: Blockade, people: number[] = [], random: () => number = Math.random, brawl: [number, number] | null = null, skirmish = false) {
    this.bots = b.ships.filter((s) => !people.includes(s.id)).map((s) => Object.assign(new Bot(s.id, random), { skirmish }));
    if (brawl) for (const bot of this.bots) {
      if (brawl.includes(bot.id)) bot.foe = brawl[0] === bot.id ? brawl[1] : brawl[0];
      else bot.spare = new Set(brawl);
    }
  }
  /** Give a ship her admiral's order (FREE: her own choice again): she looks round at once. */
  order(id: number, o: Order) {
    const bot = this.bots.find((x) => x.id === id);
    if (!bot) return;
    bot.order = o; bot.t = 0;
  }
  /** A ship's order just now. */
  orderOf(id: number): Order { return this.bots.find((x) => x.id === id)?.order ?? FREE; }
  /** Each bot a tick on but those sailing a ship someone's sailing just now (`people`: their ids). */
  tick(b: Blockade, dt: number, people: number[] = []) {
    for (const bot of this.bots) {
      if (people.includes(bot.id)) continue;
      const team = b.ship(bot.id).team, mates = this.bots.filter((o) => o !== bot && b.ship(o.id).team === team && o.goal).map((o) => o.goal!);
      bot.tick(b, dt, mates);
    }
  }
  /** What a ship's bot is up to, in plain words. */
  doing(b: Blockade, id: number): string {
    const bot = this.bots.find((x) => x.id === id), s = b.ship(id);
    if (s.craft && s.away > 0) return `aboard ${b.ship(s.craft.by).name}, to be launched`;
    if (s.away > 0) return `sunk: back in ${Math.ceil(s.away)}s from her side's edge`;
    if (s.dmg.out) return 'knocked out: her crew rebuilding her';
    if (b.anchored(s)) return (s.weigh ?? 0) > 0 ? 'weighing anchor' : 'at anchor, her craft out';
    const g = bot?.goal;
    if (!g) return 'looking round';
    if (g.kind === 'gate') return `shooting down the ${BLOCKADE.GATES[g.g].r0 < BLOCKADE.HEART.r0 ? 'south' : 'north'} gate's tower`;
    if (g.kind === 'guns') return `wrecking the ${BLOCKADE.GATES[g.g].r0 < BLOCKADE.HEART.r0 ? 'south' : 'north'} gate's guns`;
    if (g.kind === 'raid') return `darting out at ${b.ship(g.on).name}`;
    if (g.kind === 'camp') return squares(s.h, s.helm.pose).some(([c, r]) => c === g.at[0] && r === g.at[1]) ? 'camped, firing on what comes by' : 'making for her camp';
    if (g.kind === 'escort') return `escorting ${b.ship(g.on).name}`;
    if (g.kind === 'fight') return `fighting ${b.ship(g.on).name}`;
    if (g.kind === 'ram') return `making for ${b.ship(g.on).name}, to ram her`;
    const buoy = BLOCKADE.BUOYS[g.i];
    return `${b.reaches(s, buoy) ? 'holding' : 'making for'} the ${['', 'one', 'two', 'three', 'four', 'five'][buoy.pennants] ?? buoy.pennants}-pennant buoy${inHeart(...buoy.at) ? ' in the heart' : ''}`;
  }
}
