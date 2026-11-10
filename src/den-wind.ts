/* Pirate Den: the wind on the sloop's sea, and her oars. TypeScript, compiled to js/den-wind.js;
   tested in tests/den-wind.test.ts. src/den-sail.ts sails her by it; js/den/sailing.js and
   js/den/sea.js draw it.

   The user (9 Nov): the wind can drop, and a ship that's all sails is "dead in the water until the
   wind picks back up again", and under sail you "can't go against the wind". Oars keep her moving
   either way: slower than a good wind, but never stuck. Not "just going faster". And for a first
   go: "try it. We'll see how it feels, whether it's overcomplicated or not."

   So the wind has a way it blows (one of the board's four, as the trade winds do) and a strength:
   a good wind, light airs, or a calm. Under sail a move takes less time in a good wind and more in
   light airs; in a calm she can't make way at all, and waits for the wind; and she never makes a
   square against it (a move that would is "in irons": she makes no way, a turn swinging her head
   round where she is, as a blocked turn does). At the oars she rows at one steady speed whatever
   the wind, any way she likes, slower than a good wind. The trade winds are currents of their own,
   and sweep her on whatever the weather. */

/** The wind's strength: 0 a calm, 1 light airs, 2 a good wind. */
export type Strength = 0 | 1 | 2;

export const WIND = {
  /** Seconds a move takes to sail in a good wind, and in light airs; and to row, whatever the
      wind. (A move used to take a second, whatever: SAIL.MOVE.) */
  GOOD: 0.7,
  LIGHT: 1.6,
  OARS: 1.15,
  /** How long a spell of each strength lasts, in seconds (shortest, longest): a good wind most of
      the time, then it drops, sometimes to a calm, and picks up again. */
  SPELL: { 0: [8, 14], 1: [9, 14], 2: [35, 55] } as Record<Strength, [number, number]>,
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

/** Seconds a move takes: at the oars, or under sail in this strength of wind (Infinity in a calm,
    when she can't make way). */
export function moveTime(s: Strength, oars: boolean): number {
  if (oars) return WIND.OARS;
  return s === 2 ? WIND.GOOD : s === 1 ? WIND.LIGHT : Infinity;
}

/** The wind changed: it dropped, picked up, or shifted (what it was, and what it is now). */
export interface WindEvent { kind: 'wind'; d: number; s: Strength; was: { d: number; s: Strength } }

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
    and they freshen to a good wind. Now and then a good wind shifts a quarter and blows on. */
export class Wind {
  d: number;
  s: Strength;
  /** Seconds till this spell's up. */
  left: number;
  /** Light airs on their way up (after a calm), rather than dying down. */
  private rising = false;
  private roll: () => number;

  constructor(seed = 1, d: number = WIND.START.d, s: Strength = WIND.START.s) {
    this.roll = dice(seed);
    this.d = d; this.s = s;
    this.left = this.spell(s);
  }

  private spell(s: Strength): number { const [a, b] = WIND.SPELL[s]; return a + (b - a) * this.roll(); }
  private turn(): number { return (this.d + (this.roll() < 0.5 ? 1 : 3)) % 4; }

  /** Set it (a cheat, or a test): this way, this strong, for this long (a spell's worth if not said). */
  set(d: number, s: Strength, left?: number) {
    this.d = ((d % 4) + 4) % 4; this.s = s; this.rising = false;
    this.left = left ?? this.spell(s);
  }

  tick(dt: number): WindEvent[] {
    const out: WindEvent[] = [];
    this.left -= dt;
    for (let guard = 0; this.left <= 0 && guard < 8; guard++) {
      const was = { d: this.d, s: this.s };
      if (this.s === 2) {
        if (this.roll() < WIND.DROP) this.s = 1;
        else this.d = this.turn();
        this.rising = false;
      } else if (this.s === 1) {
        this.s = this.rising || this.roll() >= WIND.CALM ? 2 : 0;
        this.rising = false;
      } else {
        this.s = 1; this.rising = true;
        if (this.roll() < WIND.SHIFT) this.d = this.turn();
      }
      this.left += this.spell(this.s);
      out.push({ kind: 'wind', d: this.d, s: this.s, was });
    }
    return out;
  }
}
