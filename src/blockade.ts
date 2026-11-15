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
   - two sides, three war frigates, a war brig and five sloops each (one of them yours to sail if you like, the rest
     bots). The frigates come in facing their gate, Dachimpy's from the south edge, Dalnoth's from the north; the sloops
     and the brig from the side, Dachimpy's from the west, Dalnoth's from the east, by their own side's wind (the user,
     15 Nov: "Warfrigs start pointing at the Imperial gates. Smaller ships come from the other sides and obviously catch
     the winds for sloops. And the lagoons can also be on that side, which is maybe what the war brigs fight over in the
     opening");
   - the heart of the board, its best buoys, inside a walled fort in the middle: an imperial gate in its south wall
     and another in its north, one square wide, which a frigate has to crumble a tower of to get through
     (src/imperial-gate.ts: "a way of naturally delaying the war [frigs]"), four bastion guns on each, painting a target on
     the square of whoever's in reach and firing on it, the shot a while coming down: a ship on the move is gone from
     it, one lying still or a frigate in the middle of her long move isn't (the user, 15 Nov: "paint a target on a square
     and then just take quite a while to fire ... a sloop will move quickly before it shoots. But for a [war frig] ...
     that's basically an entire turn, so they can't dodge it"); and a side way through its west wall and
     its east, a one-square gap with a wind blowing in through it that carries a sloop through fast and that a frigate
     rides out ("sideways ... that only the sloops can really get to on those fast little winds");
   - a lagoon on each side's wind, out west and out east: a reef round its buoy, a ring of it three squares out with
     gaps a square wide, a tiny island by the buoy and the sloops' hiding place in its corner. The side's wind blows in
     through it and on through the side way into the heart; a second wind blows out of the heart through a gap in the
     wall and back into it, so the sloops can scatter there once the frigates are in (the user, 15 Nov: "an exit from
     the middle ... a wind heading towards each of the reefed areas, so they can get out quickly"). A sloop or a brig,
     one square wide, gets in by a gap; a frigate can't, and her influence doesn't reach the buoy from outside the
     reef, nor her broadsides through it: the lagoons are the sloops' and the brigs' to fight over;
   - shoals round each lagoon, three squares wide: a sloop or a brig sails them as any water; a frigate can, but
     scrapes her bottom every move she's in them, damage as a small shot's, so a frigate camped off a lagoon, or
     taking the short way round the fort, pays for it (the user, 15 Nov: "how hard would it be for a frig to just camp
     out between those two reefs and shoot any sloop that tries coming near? ... there just needs to be a cost to that
     move"). Her pilot reckons the toll (`SHOALS.TOLL`) and only takes them when it's well worth it;
   - a war brig a side between them (src/den-brig.ts; the user, 15 Nov: "a middle ship class, so it's not a big
     [brawling] fighter ... medium cannonballs ... but it can spawn ... haunted sloops that ... hang around for a set
     number of turns"; "the Atlantean ... sends out little [tritons] and turtles to go and ram the enemy ships"): medium
     guns, a square a move, and every so often her little craft launched off her sides (launch): Dachimpy's Tidecaller,
     an Atlantean, sends out turtles that come at an enemy frigate (a brig if there's none) from astern and ram her, again
     and again; Dalnoth's Grave Lantern, a haunted brig, sends out phantom sloops, slow as a frigate but never to be
     hit (shots go through them), that dart at anything slow or sat still, the frigates first (the user, 15 Nov: "they
     launch a phantom sloop ... a little bit slow, so they're a sluggish ship, similar to the war frigs, but they don't
     take damage. Like, you really can't shoot them, so that's how they counter frigs. So anything that's camping or
     just being sluggish is a target for them"). They hold no buoys, and fade a while later. Sunk or faded, a craft's
     back aboard her brig till she launches again. Rock, paper, scissors (15 Nov): the frigates sink the sloops by sheer
     weight of shot, the brigs' craft beat the frigates, and the sloops, too quick for a brig, beat the brigs;
   - every ship's damage as Puzzle Pirates keeps it (src/ship-damage.ts): holes where she's shot, water in her
     bilge slowing her, her crew patching and pumping; at full damage she's knocked out, dead in the water, till
     they've rebuilt her; shot on while she's out, she sinks, and comes back a while later from her side's own edge
     of the board, to fight her way back in (the user, 15 Nov: "oh, look, we've lost control of the central area,
     we've got to get back in there again. And that sense of working your way back in would be lost if you can't
     [sink] at all"). */
import type { Move, Pose, SailEvent } from './den-sail.js';
import { ShipSea, ShipHelm, Guns, broadside, squares, SLOOP_HANDLING, FRIGATE_HANDLING, BRIG_HANDLING, type Handling, type Side, type Shot } from './ship-handling.js';
import { HullChart } from './hull-chart.js';
import { SLOOP, WAR_FRIGATE, WAR_BRIG, type ShipClass } from './ships.js';
import { Gate } from './imperial-gate.js';
import { Turret, type TurretEvent } from './den-turret.js';
import { Damage, struck, type Hole, type DamageEvent } from './ship-damage.js';

const key = (c: number, r: number) => `${c},${r}`;

export type Kind = 'sloop' | 'brig' | 'frigate';
/** What a brig launches: phantom sloops (a haunted brig's: `ghost`), or sea turtles that ram (an Atlantean's). */
export type CraftKind = 'ghost' | 'ram';
/** A brig's craft: whose (her brig's id), what she is, her seconds left before she fades, and (a turtle) her seconds
    till she can ram again. */
export interface Craft { by: number; kind: CraftKind; life: number; cool?: number }
export type TeamId = 'gold' | 'crimson';
export interface Lane { at: [number, number]; d: number; n: number }
export interface Buoy { at: [number, number]; pennants: 1 | 2 | 3 }
export interface Rect { c0: number; c1: number; r0: number; r1: number }
/** A reef round a buoy: the buoy's square, how far out the ring is (squares, any way), its gaps, the tiny island by
    the buoy (`islet`), and the square a sloop hides on in the lagoon (`hide`). */
export interface Reef { at: [number, number]; ring: number; gaps: [number, number][]; islet: [number, number]; hide: [number, number]; shoal: number }
/** A side: its flag, its name, its fleet. */
export interface Team { id: TeamId; name: string; ships: FleetShip[] }
/** How a blockade's set up, if not as BLOCKADE has it: the sides' fleets; `open`, open sea (no fort, gates, reefs, rocks
    or winds: a skirmish's, src/blockade-skirmish.ts); `skirmish`, a ship sunk stays sunk. */
export interface Setup { teams?: Team[]; open?: boolean; skirmish?: boolean }
/** A ship of a side's fleet: her name, kind, where she comes in, (a sloop) whether her bot's a raider, and (a brig)
    what she launches. */
export interface FleetShip { name: string; kind: Kind; at: Pose; raider?: boolean; craft?: CraftKind }

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
  /** Seconds a gate gun's shot is coming down on the square it painted: a sloop on the move is gone from it (a move a
      second or so), a frigate in the middle of hers (two and a half) and a ship lying still aren't. Camping by a gate,
      or lying broadside to its tower, is punished by it; moving through isn't. */
  GATE_AIM: 2.4,
  /** The side ways: a one-square gap through the west wall and the east. */
  SIDEWAYS: [[14, 18], [15, 18], [28, 17], [29, 17]] as [number, number][],
  /** The winds (the way each blows: 0 up the board, 1 right, 2 down, 3 left; n squares from `at`): one a side, from its
      own edge in through its lagoon and its side way into the heart. A sloop on one is carried along it; a frigate rides
      them out. */
  WINDS: [{ at: [0, 18], d: 1, n: 18 }, { at: [43, 17], d: 3, n: 18 }] as Lane[],
  /** The ways out of the heart, one to each lagoon: a wind blowing out through a gap in the fort's wall and on into the
      lagoon by a gap in its reef, carrying a sloop from the heart to its buoy in one move. */
  EXITS: [
    [{ at: [16, 20], d: 3, n: 10 }],
    [{ at: [27, 15], d: 1, n: 10 }],
  ] as Lane[][],
  /** Each side's corner of the sea, where her sloops can lie out of the fighting too when the lagoons are full. */
  HOMES: { gold: [[0, 0], [3, 0], [0, 3]], crimson: [[43, 35], [40, 35], [43, 32]] } as Record<TeamId, [number, number][]>,
  /** The lagoons, one on each side's wind: a reef round each, a ring three squares out (any way) from its middle with
      gaps a square wide (the side's wind in and on, the wind out of the heart, one to the north and one to the south),
      a lagoon five across inside, its buoy in the middle (so no frigate, even in the shoals, reaches it), a tiny island
      by it and the sloops' hiding place in a corner; and shoals `shoal` squares wide round the reef. The east's the
      west's turned round the board's middle. */
  REEFS: [
    { at: [6, 19], ring: 3, gaps: [[3, 18], [9, 18], [9, 20], [6, 22], [6, 16]], islet: [7, 17], hide: [4, 21], shoal: 3 },
    { at: [37, 16], ring: 3, gaps: [[40, 17], [34, 17], [34, 15], [37, 13], [37, 19]], islet: [36, 18], hide: [39, 14], shoal: 3 },
  ] as Reef[],
  /** A frigate in the shoals: every SCRAPE seconds she's in them she scrapes her bottom (a hole, as a shot of that size
      on the square she's in them), and her pilot's toll, the seconds a move through them is reckoned to cost her more. */
  SHOALS: { SCRAPE: 1.5, GUN: 'small' as const, TOLL: 8 },
  /** Rocks about the open sea and the heart. */
  ROCKS: [
    // (none along the west and east edges: with the reefs, the way round past them is the frigates' only one from the
    // south to the north, and two squares either side of a rock is too narrow for her, at her every other square)
    [12, 7], [13, 7], [30, 7], [31, 7], [12, 28], [13, 28], [30, 28], [31, 28], [21, 4], [22, 31],
    [18, 20], [25, 15],
  ] as [number, number][],
  /** The buoys: in the heart two, and its prize three; off each gate two; in each lagoon two (where the wind out of the
      heart brings a sloop). */
  BUOYS: [
    { at: [21, 17], pennants: 3 }, { at: [18, 15], pennants: 2 }, { at: [25, 20], pennants: 2 },
    { at: [21, 8], pennants: 2 }, { at: [22, 27], pennants: 2 },
    { at: [6, 19], pennants: 2 }, { at: [37, 16], pennants: 2 },
  ] as Buoy[],
  /** Squares from any of her squares a ship's influence reaches, by her size (YPPedia: "different sized ships
      have different sized influence circles"). */
  INFLUENCE: { sloop: 2, brig: 2.75, frigate: 3.5 } as Record<Kind, number>,
  /** A brig's craft: seconds between her launches, how many she launches, their names, seconds each lasts before she
      fades (a ghost sloop's "a set number of turns", four blockade turns), and a turtle's ram, as so many hits of a gun
      that size where she strikes. */
  LAUNCH: {
    EVERY: 30,
    CRAFT: { ghost: ['Wisp', 'Shade'], ram: ['Snapper', 'Old Shell', 'Barnacle'] } as Record<CraftKind, string[]>,
    LIFE: { ghost: 40, ram: 30 } as Record<CraftKind, number>,
    // (a turtle rams again and again, every COOL seconds, for as long as she's out: the user, 15 Nov, rock, paper,
    // scissors: "War brigs, can they be good at beating war frigates with how they deploy the turtles?"; "if you go for
    // too many frigs ... the other team having Atlantean war frigs. They'll just send in the turtles and crush your war
    // frigs")
    RAM: { gun: 'large' as const, hits: 1, COOL: 4, STILL: 1 },
    /** Seconds weighing anchor takes a brig, her craft called home as she starts (the user, 15 Nov: "she has to stay
        anchored while they're out ... once a Brig's committed ... very difficult to ... raise the anchor. They become a
        sitting duck"). */
    WEIGH: 8,
  },
  /** Seconds a blockade turn, scored at its end, and a round. */
  TURN: 10,
  ROUND: 360,
  /** The sides, and their fleets: where each ship comes in (a frigate's config by her name: src/den-frigate.ts). */
  TEAMS: [
    { id: 'gold', name: 'Dachimpy\'s flag', ships: [
      { name: 'Primates Rule', kind: 'frigate', at: { c: 22, r: 2, d: 0 } },
      { name: 'Coral Throne', kind: 'frigate', at: { c: 30, r: 2, d: 0 } },
      { name: 'Golden Grin', kind: 'frigate', at: { c: 14, r: 2, d: 0 } },
      { name: 'Lucky Banana', kind: 'sloop', at: { c: 1, r: 10, d: 1 }, raider: true },
      { name: 'Grin and Bear It', kind: 'sloop', at: { c: 1, r: 16, d: 1 } },
      { name: 'Cheeky Monkey', kind: 'sloop', at: { c: 1, r: 20, d: 1 } },
      { name: 'Bananarama', kind: 'sloop', at: { c: 1, r: 26, d: 1 }, raider: true },
      { name: 'Coconut Shy', kind: 'sloop', at: { c: 1, r: 13, d: 1 } },
      { name: 'Tidecaller', kind: 'brig', at: { c: 2, r: 23, d: 1 }, craft: 'ram' },
    ] },
    { id: 'crimson', name: 'Dalnoth\'s flag', ships: [
      { name: 'Iron Pride', kind: 'frigate', at: { c: 21, r: 33, d: 2 } },
      { name: 'Eldritch Wail', kind: 'frigate', at: { c: 13, r: 33, d: 2 } },
      { name: 'Crimson Tide', kind: 'frigate', at: { c: 29, r: 33, d: 2 } },
      { name: 'Red Wake', kind: 'sloop', at: { c: 42, r: 25, d: 3 }, raider: true },
      { name: 'Smoke and Mirrors', kind: 'sloop', at: { c: 42, r: 19, d: 3 } },
      { name: 'Scarlet Fever', kind: 'sloop', at: { c: 42, r: 15, d: 3 } },
      { name: 'Blood Orange', kind: 'sloop', at: { c: 42, r: 9, d: 3 }, raider: true },
      { name: 'Rust Bucket', kind: 'sloop', at: { c: 42, r: 22, d: 3 } },
      { name: 'Grave Lantern', kind: 'brig', at: { c: 41, r: 12, d: 3 }, craft: 'ghost' },
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
      in the south-west corner, room to come about and for the camera to go round them clear of the fort, the rest of the
      blockade going on beyond them. */
  BRAWL: [{ name: 'Primates Rule', at: { c: 6, r: 3, d: 1 } }, { name: 'Iron Pride', at: { c: 6, r: 7, d: 1 } }] as { name: string; at: Pose }[],
};

const HANDLINGS: Record<Kind, Handling> = { sloop: SLOOP_HANDLING, brig: BRIG_HANDLING, frigate: FRIGATE_HANDLING };
const CLASSES: Record<Kind, ShipClass> = { sloop: SLOOP, brig: WAR_BRIG, frigate: WAR_FRIGATE };
/** A brig's sea turtle: a sloop's size on the board, no guns, a couple of small shots and she's gone. */
export const SEA_TURTLE: ShipClass = { ...SLOOP, name: 'Sea turtle', crew: 1, minCrew: 1, guns: 0, mainDeckGuns: 0, stations: { nav: 1, sailing: 0, carpentry: 0, bilge: 0, gunnery: 0 } };
/** A sea turtle swims slower than a sloop sails, quicker than a frigate's square: she catches a frigate, never a sloop
    that's under way (rock, paper, scissors by handling, not by rule). */
export const TURTLE_HANDLING: Handling = { ...SLOOP_HANDLING, name: 'Sea turtle', pace: SLOOP_HANDLING.pace * 1.15, move: SLOOP_HANDLING.move * 1.15, turn: SLOOP_HANDLING.turn * 1.15 };
/** A phantom sloop: the sloop's size, sluggish as a frigate (her moves taking as long as a frigate's square does). */
export const PHANTOM_HANDLING: Handling = { ...SLOOP_HANDLING, name: 'Phantom sloop', pace: SLOOP_HANDLING.pace * 1.3, move: SLOOP_HANDLING.move * 1.3, turn: SLOOP_HANDLING.turn * 1.3 };
/** A phantom: shots go through her, she holds no buoy, nothing can hurt her (she fades when her time's up). */
export const phantom = (s: Ship): boolean => s.craft?.kind === 'ghost';
const inRect = (x: Rect, c: number, r: number) => c >= x.c0 && c <= x.c1 && r >= x.r0 && r <= x.r1;
/** A square in the heart. */
export const inHeart = (c: number, r: number): boolean => inRect(BLOCKADE.HEART, c, r);
/** A reef's squares: its ring but its gaps (a square already land, an island's or the fort's, still counted). */
export function reefSquares(x: Reef): [number, number][] {
  const out: [number, number][] = [], gaps = new Set(x.gaps.map(([c, r]) => key(c, r))), [bc, br] = x.at;
  for (let c = bc - x.ring; c <= bc + x.ring; c++) for (let r = br - x.ring; r <= br + x.ring; r++) {
    if (Math.max(Math.abs(c - bc), Math.abs(r - br)) === x.ring && !gaps.has(key(c, r))) out.push([c, r]);
  }
  return out;
}
/** Every square of a wind lane, in order, and the way it blows. */
/** A reef's shoals: the band `shoal` squares wide outside its ring, on the board and not rock. */
export function shoalSquares(x: Reef): [number, number][] {
  const out: [number, number][] = [], [bc, br] = x.at, R = x.ring + x.shoal;
  for (let c = Math.max(0, bc - R); c <= Math.min(BLOCKADE.COLS - 1, bc + R); c++) for (let r = Math.max(0, br - R); r <= Math.min(BLOCKADE.ROWS - 1, br + R); r++) {
    if (Math.max(Math.abs(c - bc), Math.abs(r - br)) > x.ring) out.push([c, r]);
  }
  return out;
}
export function laneSquares({ at: [c, r], d, n }: Lane): [number, number][] {
  return Array.from({ length: n }, (_, i) => [c + [0, 1, 0, -1][d] * i, r + [1, 0, -1, 0][d] * i] as [number, number]);
}

/** One ship in the blockade: her side, her handling, her own sea (her size, the winds if she's small enough,
    every other ship in her way), helm, guns and damage. */
export interface Ship {
  id: number; name: string; team: TeamId; kind: Kind; h: Handling; cls: ShipClass; raider: boolean;
  sea: ShipSea; helm: ShipHelm; guns: Guns; dmg: Damage;
  /** Where she came in at the start (and comes back in after she's sunk). */
  start: Pose;
  /** Sunk: seconds till she's back (0 on the board). Off the board meanwhile: in nobody's way, no influence. A brig's
      craft not launched: Infinity. */
  away: number;
  /** A brig's craft: whose, what, and how long she's left (src/blockade.ts, LAUNCH). */
  craft?: Craft;
  /** A brig: when she last launched her craft; and seconds still weighing anchor. */
  launched: number;
  weigh?: number;
}
/** A turtle's ram: the turtle, the ship she rammed, the square she struck, its holes, and whether she sank her. */
export interface Rammed { ram: number; on: number; at: [number, number]; holes: Hole[]; sunk: boolean }

/** What a broadside stopped at: a rock, a gate's tower (which gate, which tower), one of the gates' guns, or a ship. */
export type Stop = { what: 'rock' } | { what: 'tower'; g: number; i: number } | { what: 'gun'; i: number } | { what: 'ship'; id: number };
export interface FiredShot extends Shot<Stop> { got?: 'hit' | 'crumbled' | 'bounced' | 'quiet' | 'wrecked'; hole?: Hole; out?: boolean; sunk?: boolean }
export interface Fired { ship: number; side: Side; shots: FiredShot[] }
/** A buoy's state just now: whose (the one side influencing it), contested, or nobody's. */
export type Hold = TeamId | 'contested' | null;
export type Ticked = { sail: Map<number, SailEvent[]>; damage: Map<number, DamageEvent[]>; guns: { gun: number; e: TurretEvent; hit: number | null; hole?: Hole; sunk?: boolean }[]; scored: boolean; returned: number[]; faded: number[]; rams: Rammed[]; scrapes: { ship: number; at: [number, number]; hole: Hole; sunk: boolean }[] };

export class Blockade {
  rocks = new Set<string>();
  wind = new Map<string, number>();
  /** How long each ship's lain still (on the same square, the same way), seconds: a phantom's for the taking. */
  still = new Map<number, number>();
  private stillAt = new Map<number, string>();
  /** The shoals round the lagoons (rock's not shoal); a frigate's seconds in them towards her next scrape. */
  shoals = new Set<string>();
  private scrape = new Map<number, number>();
  gates = BLOCKADE.GATES.map((x) => new Gate(x.way, x.r0, x.r1));
  /** Every gate's bastion guns, and whose gate each is. */
  battery: Turret[] = BLOCKADE.GATES.flatMap((x) => x.guns.map((at) => new Turret({ at, alert: true, flight: BLOCKADE.GATE_AIM })));
  gunGate: number[] = BLOCKADE.GATES.flatMap((x, i) => x.guns.map(() => i));
  ships: Ship[] = [];
  score: Record<TeamId, number> = { gold: 0, crimson: 0 };
  /** Seconds into the round, and into this blockade turn. */
  clock = 0;
  turnT = 0;
  over = false;
  /** Every broadside fired since whoever draws them last took them (anyone's: a bot's or yours). */
  fired: Fired[] = [];
  /** Every launch of a brig's craft, and every turtle's ram, since whoever draws them last took them. */
  launches: { by: number; ids: number[] }[] = [];
  private seen = new Map<number, string>();
  /** Each square a ship covers just now, and whose (kept as they move: notice). */
  private taken = new Map<string, number>();
  gunOn: number[] = [];
  /** Each kind of ship's chart of this board (src/hull-chart.ts): all the sloops share one, all the frigates another. */
  charts = {} as Record<Kind, HullChart>;

  /** Ships sunk stay sunk (a skirmish); and open sea, nothing on it but the ships. */
  skirmish = false;
  open = false;

  constructor(setup: Setup = {}) {
    const B = BLOCKADE, teams = setup.teams ?? B.TEAMS, open = !!setup.open;
    this.skirmish = !!setup.skirmish; this.open = open;
    if (open) { this.gates = []; this.battery = []; this.gunGate = []; }
    const side = new Set([...B.SIDEWAYS, ...B.EXITS.flat().flatMap(laneSquares)].map(([c, r]) => key(c, r))), ways = new Set(B.GATES.flatMap((x) => [key(x.way, x.r0), key(x.way, x.r1)]));
    if (!open) {
      for (const w of B.WALLS) for (let c = w.c0; c <= w.c1; c++) for (let r = w.r0; r <= w.r1; r++) if (!side.has(key(c, r)) && !ways.has(key(c, r))) this.rocks.add(key(c, r));
      for (const [c, r] of B.ROCKS) this.rocks.add(key(c, r));
      for (const reef of B.REEFS) for (const [c, r] of [...reefSquares(reef), reef.islet]) this.rocks.add(key(c, r));
      for (const lane of [...B.WINDS, ...B.EXITS.flat()]) for (const [c, r] of laneSquares(lane)) this.wind.set(key(c, r), lane.d);
      for (const reef of B.REEFS) for (const [c, r] of shoalSquares(reef)) if (!this.rocks.has(key(c, r))) this.shoals.add(key(c, r));
    }
    let id = 0;
    for (const team of teams) for (const s of team.ships) {
      const h = HANDLINGS[s.kind], me = id++;
      const sea = new ShipSea(h, B.COLS, B.ROWS, this.rocks, (c, r) => { const o = this.taken.get(key(c, r)); return o !== undefined && o !== me; });
      if (s.kind === 'sloop') sea.carriedBy(this.wind);
      // (a frigate's pilot reckons the shoals' toll: her kind's chart is worked out with it)
      if (s.kind === 'frigate') sea.toll = { squares: this.shoals, secs: B.SHOALS.TOLL };
      sea.chart = this.charts[s.kind] ??= new HullChart(sea.bare());
      sea.near = B.IN_WAY;
      this.ships.push({ id: me, name: s.name, team: team.id, kind: s.kind, h, cls: CLASSES[s.kind], raider: !!s.raider, sea, helm: new ShipHelm(sea, { ...s.at }), guns: new Guns(h.reload), dmg: new Damage(CLASSES[s.kind]), start: { ...s.at }, away: 0, launched: -Infinity });
    }
    // (each brig's craft, aboard her till she launches them: after every fleet's ships, so theirs keep their ids)
    for (const team of teams) for (const f of team.ships) {
      if (!f.craft) continue;
      const by = this.ships.find((x) => x.name === f.name)!;
      for (const name of B.LAUNCH.CRAFT[f.craft]) {
        const me = id++, cls = f.craft === 'ram' ? SEA_TURTLE : SLOOP, h = f.craft === 'ram' ? TURTLE_HANDLING : PHANTOM_HANDLING;
        const sea = new ShipSea(h, B.COLS, B.ROWS, this.rocks, (c, r) => { const o = this.taken.get(key(c, r)); return o !== undefined && o !== me; });
        sea.carriedBy(this.wind);
        sea.chart = this.charts.sloop ??= new HullChart(sea.bare());
        sea.near = B.IN_WAY;
        this.ships.push({ id: me, name, team: team.id, kind: 'sloop', h, cls, raider: false, sea, helm: new ShipHelm(sea, { ...by.start }), guns: new Guns(SLOOP_HANDLING.reload), dmg: new Damage(cls), start: { ...by.start }, away: Infinity, craft: { by: by.id, kind: f.craft, life: 0 }, launched: -Infinity });
      }
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
    const out: Ticked = { sail: new Map(), damage: new Map(), guns: [], scored: false, returned: [], faded: [], rams: [], scrapes: [] };
    if (this.over) return out;
    for (const s of this.ships) {
      // (sunk: back where she came in once her time's up and nobody's lying there)
      if (s.away > 0) {
        if (s.craft || this.skirmish) continue;   // (aboard her brig, till she's launched; a skirmish's sunk, gone)
        if ((s.away -= dt) <= 0 && !this.comeBack(s)) s.away = 0.5;
        if (s.away <= 0) out.returned.push(s.id);
        continue;
      }
      // (a craft's time up, or her brig gone down: she fades)
      if (s.craft && ((s.craft.life -= dt) <= 0 || this.ships[s.craft.by].away > 0)) { this.aboard(s); out.faded.push(s.id); continue; }
      const ev = s.dmg.tick(dt);
      if (ev.some((e) => e.kind === 'back')) s.helm.hole = null;
      { const p = s.helm.pose, k = `${p.c},${p.r},${p.d}`; this.still.set(s.id, this.stillAt.get(s.id) === k ? (this.still.get(s.id) ?? 0) + dt : 0); this.stillAt.set(s.id, k); }
      // (a frigate in the shoals scraping her bottom, every so often while she's in them)
      if (s.kind === 'frigate') {
        const shoal = squares(s.h, s.helm.pose).find(([c, r]) => this.shoals.has(key(c, r)));
        const t = shoal ? (this.scrape.get(s.id) ?? 0) + dt : 0;
        if (shoal && t >= BLOCKADE.SHOALS.SCRAPE) {
          this.scrape.set(s.id, 0);
          const got = this.hurt(s, BLOCKADE.SHOALS.GUN, shoal, shoal);
          out.scrapes.push({ ship: s.id, at: shoal, hole: got.hole, sunk: got.sunk });
          if (got.sunk) continue;
        } else this.scrape.set(s.id, t);
      }
      s.sea.drag = s.dmg.drag();
      out.damage.set(s.id, ev);
      out.sail.set(s.id, s.helm.tick(dt));
      s.guns.tick(dt);
      // (a brig at anchor, her craft out: she lies where she is; weighing it, she's free once it's up)
      if (s.kind === 'brig' && (s.weigh ?? 0) > 0 && (s.weigh = Math.max(0, s.weigh! - dt)) === 0) this.notice();
      if (this.anchored(s) && (s.helm.pin || s.helm.mine.length)) { s.helm.stop(); while (s.helm.mine.length) s.helm.unput(); }
      this.notice();
    }
    // (a turtle beside an enemy frigate or brig rams her: her holes where she struck; the turtle backs off a moment and
    // comes again)
    for (const s of this.ships) {
      if (s.craft?.kind !== 'ram' || s.away > 0 || s.dmg.out) continue;
      if ((s.craft.cool = Math.max(0, (s.craft.cool ?? 0) - dt)) > 0) continue;
      const hit = this.besideFoe(s);
      if (!hit) continue;
      const { o, at } = hit, from: [number, number] = [s.helm.pose.c, s.helm.pose.r], holes: Hole[] = [];
      let sunk = false;
      for (let i = 0; i < BLOCKADE.LAUNCH.RAM.hits && !sunk && o.away <= 0; i++) { const got = this.hurt(o, BLOCKADE.LAUNCH.RAM.gun, at, from); holes.push(got.hole); sunk = got.sunk; }
      s.craft.cool = BLOCKADE.LAUNCH.RAM.COOL;
      out.rams.push({ ram: s.id, on: o.id, at, holes, sunk });
    }
    // (every square a ship's on, read once for all the guns)
    const on = [...this.taken].map(([k, id]) => { const [c, r] = k.split(',').map(Number); return { c, r, id }; });
    this.battery.forEach((g, i) => {
      // (the nearest ship in its reach: it paints her square and fires, the shot GATE_AIM coming down; moving, she's gone
      // from it, lying still she isn't)
      const target = this.gunTarget(g, on);
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
      if ((s.dmg.out && !BLOCKADE.SINKING) || (only && !only(s.id)) || phantom(s)) continue;
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
    if (s.dmg.out || s.away > 0 || s.craft) return false;   // (a brig's craft hold no buoy)
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
    // (a phantom: the shot goes through her)
    return s && s !== from && !phantom(s) ? { what: 'ship', id: s.id } : null;
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
    // (a brig's craft knocked out goes down at once)
    if (got.sunk || (s.craft && got.out)) { this.sink(s); return { ...got, sunk: true }; }
    return got;
  }
  /** She's gone down: off the board till she comes back (comeBack), in nobody's way meanwhile; a brig's craft, back
      aboard her brig. */
  sink(s: Ship) {
    if (s.craft) { this.aboard(s); return; }
    s.away = this.skirmish ? Infinity : BLOCKADE.RETURN;
    s.helm.moor(s.helm.pose);
    s.helm.hole = null;
    this.notice();
  }
  /** A brig's craft back aboard her (faded, sunk, or rammed home): off the board till she's launched again. */
  private aboard(s: Ship) {
    s.away = Infinity; s.craft!.life = 0;
    s.helm.moor(s.helm.pose); s.helm.hole = null;
    this.notice();
  }

  /** A brig's craft still aboard her. */
  craftOf(brig: Ship): Ship[] { return this.ships.filter((x) => x.craft?.by === brig.id); }
  /** A brig at anchor: her craft out, or her anchor still coming up. She can't move; her guns still bear as she lies. */
  anchored(s: Ship): boolean { return s.kind === 'brig' && ((s.weigh ?? 0) > 0 || this.craftOf(s).some((x) => x.away <= 0)); }
  /** A brig weighs anchor: her craft called home at once (back aboard), and WEIGH seconds before she can move. */
  weighAnchor(id: number): boolean {
    const s = this.ship(id);
    if (s.kind !== 'brig' || !this.anchored(s) || (s.weigh ?? 0) > 0) return false;
    for (const x of this.craftOf(s)) if (x.away <= 0) this.aboard(x);
    s.weigh = BLOCKADE.LAUNCH.WEIGH;
    return true;
  }
  /** She can launch: a brig afloat and in action, her time since her last launch up, and her craft all aboard. */
  canLaunch(s: Ship): boolean {
    const craft = this.craftOf(s);
    return s.kind === 'brig' && s.away <= 0 && !s.dmg.out && this.clock - s.launched >= BLOCKADE.LAUNCH.EVERY && craft.length > 0 && craft.every((x) => x.away > 0);
  }
  /** A brig launches her craft off her sides (port and starboard by each of her squares, then off her bow and her
      stern), each heading as she is, refitted, for her LIFE: their ids (none, if she can't). */
  launch(id: number): number[] {
    const s = this.ship(id);
    if (!this.canLaunch(s)) return [];
    this.notice();
    const p = s.helm.pose, DC = [0, 1, 0, -1], DR = [1, 0, -1, 0], sd = (p.d + 1) % 4, mine = squares(s.h, p), al = mine.length;
    const spots: [number, number][] = [];
    for (const [c, r] of mine) for (const k of [1, -1]) spots.push([c + DC[sd] * k, r + DR[sd] * k]);
    const [bc, br] = mine[0], [sc, sr] = mine[al - 1];
    spots.push([bc + DC[p.d], br + DR[p.d]], [sc - DC[p.d], sr - DR[p.d]]);
    const out: number[] = [];
    for (const x of this.craftOf(s)) {
      const at = spots.find(([c, r]) => x.sea.bare().fits({ c, r, d: p.d }) && !this.taken.has(key(c, r)));
      if (!at) break;
      spots.splice(spots.indexOf(at), 1);
      x.dmg.refit(); x.sea.drag = 1; x.sea.exact = null;
      x.helm.moor({ c: at[0], r: at[1], d: p.d }); x.helm.hole = null;
      x.guns.wait = { L: 0, R: 0 };
      x.away = 0; x.craft!.life = BLOCKADE.LAUNCH.LIFE[x.craft!.kind];
      this.taken.set(key(...at), x.id);
      out.push(x.id);
    }
    // (and she drops anchor: lying where she is till they're home)
    if (out.length) { s.launched = this.clock; s.helm.stop(); while (s.helm.mine.length) s.helm.unput(); this.launches.push({ by: id, ids: out }); this.notice(); }
    return out;
  }
  /** An enemy beside a turtle (on a square next to hers, diagonals too; any ship but another brig's craft), and the
      square of hers it's on. */
  private besideFoe(s: Ship): { o: Ship; at: [number, number] } | null {
    const { c, r } = s.helm.pose;
    for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
      const o = this.under(c + dc, r + dr);
      // (a ram lands on a ship lying still a moment, a frigate trading broadsides, a ship at anchor on a buoy; a sloop under
      // way slips her)
      if (o && o !== s && o.team !== s.team && o.away <= 0 && !o.craft && (this.still.get(o.id) ?? 0) >= BLOCKADE.LAUNCH.RAM.STILL) return { o, at: [c + dc, r + dr] };
    }
    return null;
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

  drop(id: number, c: number, r: number): [number, number] | null { return this.anchored(this.ship(id)) ? null : this.ship(id).helm.drop(c, r); }
  put(id: number, m: Move): boolean { return !this.anchored(this.ship(id)) && this.ship(id).helm.put(m); }
  /** The brawl (BLOCKADE.BRAWL): its two frigates put broadside to broadside; their ids. */
  brawl(): [number, number] {
    const ids = BLOCKADE.BRAWL.map(({ name, at }) => { const s = this.ships.find((x) => x.name === name)!; s.helm.moor(at); return s.id; });
    this.notice();
    return [ids[0], ids[1]];
  }
  /** In the heart of the board, inside the fort. */
  inHeart(s: Ship): boolean { return inHeart(s.helm.pose.c, s.helm.pose.r); }
  /** Where a sloop of that side hides: each lagoon's far corner, and her side's corner of the sea, far from the
      fighting. */
  coves(team?: TeamId): [number, number][] { return [...BLOCKADE.REEFS.map((x) => x.hide), ...(team ? BLOCKADE.HOMES[team] : [])]; }
}
