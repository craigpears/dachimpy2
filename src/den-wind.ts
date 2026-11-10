/* Pirate Den: the wind on the sloop's sea, and her oars. TypeScript, compiled to js/den-wind.js;
   tested in tests/den-wind.test.ts. src/den-sail.ts sails her by it; js/den/sailing.js and
   js/den/wind.js draw it.

   The user (9 Nov): the wind can drop, and a ship that's all sails is "dead in the water until the
   wind picks back up again", and under sail you "can't go against the wind". Oars keep her moving
   either way: never stuck. Not "just going faster". And for a first go: "try it. We'll see how it
   feels, whether it's overcomplicated or not."

   So the wind has a way it blows (one of the board's four, as the trade winds do) and a strength:
   a good wind, light airs, or a calm. In a calm she can't make way at all under sail, and waits for
   the wind; and she never makes a square against it (a move that would is "in irons": she makes no
   way, a turn swinging her head round where she is, as a blocked turn does). At the oars she goes
   any way she likes, rowed by the port-and-starboard board (src/den-row.ts). The trade winds are
   currents of their own, and sweep her on whatever the weather.

   Made plainer (10 Nov, the user: "I like the animation and some of the idea, but it's very
   confusing"). In a strong wind "it was still letting me sail around. I'm not seeing like a big
   speed difference", so how she lies to the wind matters a lot now: running before it (the wind
   behind her) she's quickest, across it three times slower, and into it she gets nowhere. "It's
   coming up a pop-up saying you can't sail there. Well, it is letting me": the pilot used to run
   the oars out and row her there itself; now she only says she can't when she really won't. And
   "it changes quite quickly": a good wind lasts a couple of minutes or more, and every change is
   seen coming, WIND.WARN seconds ahead (a 'warn' event; the flag and streaks ease). */

/** The wind's strength: 0 a calm, 1 light airs, 2 a good wind. */
export type Strength = 0 | 1 | 2;

/** How she lies to the wind: running before it (it's behind her), across it (a reach), or into it. */
export type Point = 'run' | 'reach' | 'into';

export const WIND = {
  /** Seconds a move takes to sail in a good wind with the wind behind her, and across it. Into it
      she makes no way at all. (A move used to take 0.7 s in a good wind whichever way she went.) */
  RUN: 0.4,
  REACH: 1.2,
  /** In light airs everything under sail takes this many times as long. */
  LIGHT: 2.2,
  /** Seconds a square takes at the oars, rowed one at a time; a pile of them rowed at once goes
      quicker (rowTime), up to FAST. */
  OARS: 1.15,
  /** As quick as she's ever rowed, the rowers going like crazy: the trade winds' pace (SAIL.PUSH),
      "the same as traveling on the winds" (the user, 10 Nov). */
  FAST: 0.28,
  /** How long a spell of each strength lasts, in seconds (shortest, longest): a good wind for a good
      while (10 Nov: "it changes quite quickly"), then it drops, sometimes to a calm, and picks up
      again. */
  SPELL: { 0: [15, 25], 1: [20, 30], 2: [120, 180] } as Record<Strength, [number, number]>,
  /** Seconds' warning before the wind changes. */
  WARN: 8,
  /** When a good wind's spell is up, the chance it drops (otherwise it shifts a quarter and blows
      on); when light airs are dropping, the chance they die to a calm (otherwise the wind freshens
      again); and when a calm ends, the chance the wind comes back from a new way. */
  DROP: 0.75,
  CALM: 0.6,
  SHIFT: 0.5,
  /** The wind she finds when she first puts out: a good one, blowing across the cove from the left
      as seen from the den, so she can get out and home under sail. */
  START: { d: 1, s: 2 as Strength },
} as const;

/** The names for a strength, as on the sailing bar. */
export const STRENGTH = ['Calm', 'Light airs', 'Good wind'] as const;

/** Whether a step that way (one of the board's four) goes against a wind blowing `blows`. */
export function upwind(step: number, blows: number): boolean { return step === (blows + 2) % 4; }

/** How she lies to a wind blowing `blows`, heading that way. */
export function pointOf(heading: number, blows: number): Point {
  return heading === blows ? 'run' : upwind(heading, blows) ? 'into' : 'reach';
}

/** Seconds a move takes: at the oars (a square on its own), or under sail in this strength of wind,
    lying to it so (Infinity in a calm, or into the wind: she can't make way). */
export function moveTime(s: Strength, oars: boolean, point: Point = 'reach'): number {
  if (oars) return WIND.OARS;
  if (s === 0 || point === 'into') return Infinity;
  const t = point === 'run' ? WIND.RUN : WIND.REACH;
  return s === 1 ? t * WIND.LIGHT : t;
}

/** Seconds each of a pile of rowed squares takes, `queued` of them waiting (this one counted): the
    more pull there's been, the harder they row and the quicker she goes, up to the trade winds'
    pace. No cap on how many squares a big clear is worth (10 Nov: "that's the point of Vegas"). */
export function rowTime(queued: number): number { return Math.max(WIND.FAST, WIND.OARS / Math.max(1, queued)); }

/** The wind changed: it dropped, picked up, or shifted (what it was, and what it is now); or, a
    `warn`, it's about to (what it is in `was`, and what it's going to be in `d` and `s`). */
export interface WindEvent { kind: 'wind' | 'warn'; d: number; s: Strength; was: { d: number; s: Strength } }

/** A little seeded dice, so the same weather comes up for the same seed. */
function dice(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The wind: the way it blows (0 out to sea, 1 right as seen from the den, 2 in to the cove, 3
    left), how strong, and how long till it changes. A good wind drops to light airs, and they
    either freshen again or die to a calm; a calm comes back as light airs (often from a new way),
    and they freshen to a good wind. Now and then a good wind shifts a quarter and blows on. What
    it does next is settled as each spell begins (`coming`), so it can be told WARN seconds ahead. */
export class Wind {
  d: number;
  s: Strength;
  /** Seconds till this spell's up. */
  left: number;
  /** What it'll be when this spell's up. */
  coming: { d: number; s: Strength } = { d: 0, s: 0 };
  /** Light airs on their way up (after a calm), rather than dying down; and whether what's coming is. */
  private rising = false;
  private risingNext = false;
  private warned = false;
  private roll: () => number;

  constructor(seed = 1, d: number = WIND.START.d, s: Strength = WIND.START.s) {
    this.roll = dice(seed);
    this.d = d; this.s = s;
    this.left = this.spell(s);
    this.plan();
  }

  private spell(s: Strength): number { const [a, b] = WIND.SPELL[s]; return a + (b - a) * this.roll(); }
  private turn(): number { return (this.d + (this.roll() < 0.5 ? 1 : 3)) % 4; }

  /** Settle what comes after this spell. */
  private plan() {
    let d = this.d, s = this.s;
    this.risingNext = false;
    if (s === 2) {
      if (this.roll() < WIND.DROP) s = 1;
      else d = this.turn();
    } else if (s === 1) {
      s = this.rising || this.roll() >= WIND.CALM ? 2 : 0;
    } else {
      s = 1; this.risingNext = true;
      if (this.roll() < WIND.SHIFT) d = this.turn();
    }
    this.coming = { d, s };
    this.warned = this.left <= WIND.WARN;   // (a spell set that short, by a cheat or a test: no warning)
  }

  /** Set it (a cheat, or a test): this way, this strong, for this long (a spell's worth if not said). */
  set(d: number, s: Strength, left?: number) {
    this.d = ((d % 4) + 4) % 4; this.s = s; this.rising = false;
    this.left = left ?? this.spell(s);
    this.plan();
  }

  tick(dt: number): WindEvent[] {
    const out: WindEvent[] = [];
    this.left -= dt;
    if (!this.warned && this.left <= WIND.WARN && this.left > 0) {
      this.warned = true;
      out.push({ kind: 'warn', d: this.coming.d, s: this.coming.s, was: { d: this.d, s: this.s } });
    }
    for (let guard = 0; this.left <= 0 && guard < 8; guard++) {
      const was = { d: this.d, s: this.s };
      this.d = this.coming.d; this.s = this.coming.s; this.rising = this.risingNext;
      this.left += this.spell(this.s);
      this.plan();
      out.push({ kind: 'wind', d: this.d, s: this.s, was });
    }
    return out;
  }
}
