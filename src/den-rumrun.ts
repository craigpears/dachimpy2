/* Pirate Den: Helium's rum run. TypeScript, compiled to js/den-rumrun.js; tested in tests/den-rumrun.test.ts.
   js/den/rumrun.js draws it: the barrels on her deck, Helium aboard, each stop's little scene.

   The user (13 Nov, IDEAS.md "Helium's rum run"): once you've done some distilling, Helium asks if you'd help
   smuggle it. They jump aboard your sloop, her deck "slightly full of barrels just piled all in the deck", and
   the run's a delivery to Mischievious for her wedding, some for Kikkit, then the rest smuggled to Port Decorum
   past the imperial outposts, Helium all innocence as you go by: "nothing suspicious at all", whistling
   "whoop-de-doop-de-doop-de-doo". "Definitely seems ready ... go ahead and just start ... be reasonable."

   A first version, kept light. Its own island in the code: the rules here (its steps, what's aboard, which stop
   she's at and when each one's done, when Helium whistles), its lines in src/lines/ (Helium's, Mischievious's,
   Kikkit's, Dignity's, the guards', yours), its 3D in js/den/rumrun.js, touching the rest through a few hooks.
   - It starts at their still: leave it with RUM_RUN.CASKS casks filled (src/den-helium.ts's Cellar) and they
     ask you along. Space takes the rum aboard (the casks off their pile, LOAD barrels on her deck, Helium with
     them); Esc, not now (they'll ask again the next time you leave the still with the casks).
   - The stops, each a little scene with that character's lines: the Wedding Isle (Mischievious on her jetty)
     and Kikkit's island, either way round, then the rest to Port Decorum, last. Port Decorum two ways: brazened
     out at its jetty under its guard's nose (past the checkpoint, the danger it always was), or landed quietly
     at the smugglers' beach round its back (the whirlpools' Vegas the only way there). Either does.
   - Past the Empire: sailing in sight of the checkpoint or Port Decorum with barrels aboard, Helium whistles and
     plays it innocent, Dignity remarks from her gate, Port Decorum's guards turn to watch. No new puzzle and no
     search: the checkpoint's guns are the danger, as they already are.
   - What it earns: the barrels counted as delivered and Helium's thanks, back at their island. No economy.
   Not yet (IDEAS.md): the barrels shifting or going over in a rough sea, a sharper search at the checkpoint,
   the smuggling ring and its penguin. */

import { LAY, type Pose } from './den-sail.js';
import { onIsleLanding } from './den-isle.js';
import { onKikkitLanding } from './den-kikkit.js';
import { inSmugglersCove, onSmugglersRun, smugglersAt } from './den-smugglers.js';
import { EMPIRE_OFF, empireAt, inEmpireEarshot } from './den-imperial.js';
import { onHeliumLanding } from './den-helium.js';
import { readSecs } from './den-dignity.js';
import { RUM_RUN as HELIUM_SAYS } from './lines/helium.js';
import { RUM_RUN as HER_SAYS } from './lines/mischievious.js';
import { RUM_RUN as KIKKIT_SAYS } from './lines/kikkit.js';
import { RUM_RUN as DIGNITY_SAYS } from './lines/dignity.js';
import { RUM_RUN as GUARD_SAYS } from './lines/imperial-guards.js';
import { ON_THE_RUM_RUN as YOU_SAY } from './lines/you.js';

export const RUM_RUN = {
  NAME: 'Helium\'s rum run',
  /** Casks filled at their still (Cellar.filled) before they ask you along: "once you've done some distilling".
      A cask's 16 measures, a white sent up a measure (two in a Crystal Clear), so a couple of good columns. */
  CASKS: 2,
  /** Barrels on her deck as you set off. */
  LOAD: 6,
  /** Sailing in sight of the Empire with barrels aboard: how near the checkpoint's gate (rows either side of its
      line, columns either side of its gate) and Port Decorum (squares from its land, any way), and how long out of
      sight (seconds) before Helium whistles again. */
  SIGHT: { ROWS: 3, COLS: 7, DECORUM: 2 },
  QUIET: 25,
} as const;

/** The stops, in the order they're named: the Wedding Isle and Kikkit's island either way round, then Port
    Decorum, last, with whatever's left (`barrels: 0`). */
export type StopId = 'wedding' | 'kikkit' | 'decorum';
export interface Stop { id: StopId; name: string; barrels: number; for: string }
export const STOPS: readonly Stop[] = [
  { id: 'wedding', name: 'the Wedding Isle', barrels: 2, for: 'Mischievious' },
  { id: 'kikkit', name: 'Kikkit\'s island', barrels: 1, for: 'Kikkit' },
  { id: 'decorum', name: 'Port Decorum', barrels: 0, for: 'the Empire' },
];
const stop = (id: StopId): Stop => STOPS.find((s) => s.id === id)!;

/** Port Decorum's two ways in: its jetty, under the guard's nose; or the smugglers' beach round its back. */
export type Landing = 'quay' | 'cove';
/** Where she is, for the run: off a stop (and, Port Decorum, which way), off Helium's island, or nowhere. */
export type At = { id: StopId; how?: Landing } | { id: 'helium' } | null;
export function atStop(c: number, r: number): At {
  if (onIsleLanding(c, r)) return { id: 'wedding' };
  if (onKikkitLanding(c, r)) return { id: 'kikkit' };
  if (inSmugglersCove(c, r)) return { id: 'decorum', how: 'cove' };
  if (inEmpireEarshot(c, r) && !empireAt(c, r) && !smugglersAt(c, r)) return { id: 'decorum', how: 'quay' };
  if (onHeliumLanding(c, r)) return { id: 'helium' };
  return null;
}

/** In sight of the Empire: by the checkpoint (near its gate's line), or by Port Decorum (off its shore, or along
    the smugglers' run and cove behind its rocks). */
export type Sight = 'checkpoint' | 'decorum';
export function inSight(c: number, r: number): Sight | null {
  const K = LAY.CHECKPOINT, S = RUM_RUN.SIGHT;
  if (Math.abs(r - K.ROW) <= S.ROWS && Math.abs(c - K.GATE) <= S.COLS) return 'checkpoint';
  if (onSmugglersRun(c, r) || inSmugglersCove(c, r)) return 'decorum';
  if (!empireAt(c, r) && LAY.EMPIRE.LAND.some(([x, y]) => Math.abs(x - c) <= S.DECORUM && Math.abs(y - r) <= S.DECORUM)) return 'decorum';
  return null;
}

/** Where the run's at: not offered yet; Helium's asked (Space takes it on, Esc not now); under way, barrels
    aboard; everything delivered, Helium to take home. */
export type Step = 'idle' | 'asked' | 'run' | 'home';

/** The run: its step, the barrels aboard, the stops done, and what's been delivered (this voyage). */
export class RumRun {
  step: Step = 'idle';
  aboard = 0;
  done: StopId[] = [];
  /** Port Decorum's way in, once it's done. */
  how: Landing | null = null;
  /** Barrels delivered, and runs finished (Helium home), this voyage. */
  delivered = 0;
  runs = 0;
  /** Said no (Esc): not asked again till they've been to the still again. */
  declined = false;

  /** Whether Helium should ask, given the casks filled at their still. */
  canAsk(casks: number): boolean { return this.step === 'idle' && !this.declined && casks >= RUM_RUN.CASKS; }
  ask(): void { if (this.step === 'idle') this.step = 'asked'; }
  /** Not now: they'll ask again once you've been back at the still. */
  decline(): void { if (this.step === 'asked') { this.step = 'idle'; this.declined = true; } }
  /** Back at the still: they may ask again as you leave it. */
  stilled(): void { this.declined = false; }
  /** Taken on: the barrels aboard, and Helium. False if they hadn't asked. */
  take(): boolean {
    if (this.step !== 'asked') return false;
    Object.assign(this, { step: 'run', aboard: RUM_RUN.LOAD, done: [], how: null });
    return true;
  }
  /** Helium's aboard (on the run, or being taken home). */
  get heliumAboard(): boolean { return this.step === 'run' || this.step === 'home'; }

  /** Whether a stop's barrels can go ashore now: under way, not done yet; Port Decorum only once the other two are. */
  open(id: StopId): boolean {
    if (this.step !== 'run' || this.done.includes(id)) return false;
    return id !== 'decorum' || STOPS.every((s) => s.id === 'decorum' || this.done.includes(s.id));
  }
  /** How many barrels go ashore there: its own, or all that's left. */
  barrelsFor(id: StopId): number {
    const n = stop(id).barrels;
    return n > 0 ? Math.min(n, this.aboard) : this.aboard;
  }
  /** Rolls a stop's barrels ashore: how many (0 if it isn't open). Port Decorum's the last: then Helium's to
      take home. */
  deliver(id: StopId, how: Landing | null = null): number {
    if (!this.open(id)) return 0;
    const n = this.barrelsFor(id);
    this.aboard -= n;
    this.delivered += n;
    this.done.push(id);
    if (id === 'decorum') { this.step = 'home'; this.how = how; }
    return n;
  }
  /** Back off their island with them: they hop off, the run's done. False if they weren't to go home. */
  home(): boolean {
    if (this.step !== 'home') return false;
    Object.assign(this, { step: 'idle', aboard: 0, runs: this.runs + 1 });
    return true;
  }

  /** What's next, in plain words, for the foot of the screen ('' when there's no run). */
  goal(): string {
    if (this.step === 'home') return 'Rum run: all delivered · take Helium home';
    if (this.step !== 'run') return '';
    const left = STOPS.filter((s) => s.id !== 'decorum' && !this.done.includes(s.id));
    const n = (s: Stop) => `${this.barrelsFor(s.id)} for ${s.for}`;
    if (left.length === 2) return `Rum run: ${left[0].name} (${n(left[0])}) and ${left[1].name} (${n(left[1])}), either way round`;
    if (left.length === 1) return `Rum run: ${left[0].name} next (${n(left[0])})`;
    return `Rum run: the rest (${this.aboard}) to Port Decorum: its jetty, or round the back, quietly`;
  }
}

/** Sailing in sight of the Empire with barrels aboard: Helium whistles as she comes into sight, once a pass (not
    again till she's been out of sight a while). */
export class Whistle {
  private out = Infinity;
  private was: Sight | null = null;
  /** Times whistled. */
  n = 0;
  /** Each tick: where she's in sight of, if anywhere, and whether there's rum aboard to be innocent about. The
      place, the moment Helium should whistle; else null. */
  tick(dt: number, sight: Sight | null, rum: boolean): Sight | null {
    const was = this.was;
    this.was = sight;
    if (!sight || !rum) { this.out += dt; return null; }
    const fresh = !was && this.out >= RUM_RUN.QUIET;
    this.out = 0;
    if (!fresh) return null;
    this.n++;
    return sight;
  }
}

/** Who says a line in a scene: drawn over their head by js/den/rumrun.js. */
export type Who = 'helium' | 'you' | 'mischievious' | 'kikkit' | 'guard' | 'dignity';
/** A beat of a scene: who says what, and how many barrels go ashore (or aboard) as it's said. */
export interface Beat { who: Who; says: string; roll?: number }

const b = (who: Who, says: string, roll?: number): Beat => (roll ? { who, says, roll } : { who, says });

/** Off their island, the casks filled, as you leave the still: Helium asks you along. */
export const askBeats = (): Beat[] => [
  ...HELIUM_SAYS.ask.map((s) => b('helium', s)),
  b('you', YOU_SAY.smuggling),
  b('helium', HELIUM_SAYS.smuggling),
];
/** Taken on: the barrels rolled aboard, and them with them. */
export const aboardBeats = (n = RUM_RUN.LOAD): Beat[] => [b('helium', HELIUM_SAYS.aboard, n)];
/** A stop's scene: its character, Helium, and `n` barrels rolled ashore as it starts (Port Decorum's at the
    jetty once the guard's waved them on), then Helium's last line at the last stop. */
export function stopBeats(id: StopId, n: number, how: Landing | null = null): Beat[] {
  if (id === 'wedding') return [b('mischievious', HER_SAYS.hello, n), b('helium', HELIUM_SAYS.wedding.hello), b('helium', HELIUM_SAYS.wedding.other), b('mischievious', HER_SAYS.thanks)];
  if (id === 'kikkit') return [b('kikkit', KIKKIT_SAYS.hello, n), b('helium', HELIUM_SAYS.kikkit.hello), b('kikkit', KIKKIT_SAYS.stash), b('helium', HELIUM_SAYS.kikkit.monkey), b('kikkit', KIKKIT_SAYS.rodrigo)];
  const last = b('helium', HELIUM_SAYS.last);
  if (how === 'cove') return [b('helium', HELIUM_SAYS.cove.quiet, n), b('helium', HELIUM_SAYS.cove.after), last];
  return [
    b('guard', GUARD_SAYS.what), b('helium', HELIUM_SAYS.quay.water), b('guard', GUARD_SAYS.water), b('helium', HELIUM_SAYS.quay.fort),
    b('guard', GUARD_SAYS.fine, n), b('helium', HELIUM_SAYS.tune), last,
  ];
}
/** At Port Decorum before the other two have theirs. */
export const notYetBeats = (): Beat[] => [b('helium', HELIUM_SAYS.notYet)];
/** Home: they hop off. */
export const homeBeats = (): Beat[] => [b('helium', HELIUM_SAYS.home)];
/** Sailing by the Empire with barrels aboard: the tune, then the `n`th innocent line in turn; at the checkpoint,
    Dignity's remark from her gate, in turn. */
export function whistleBeats(where: Sight, n: number): Beat[] {
  const I = HELIUM_SAYS.innocent, D = DIGNITY_SAYS;
  const out = [b('helium', HELIUM_SAYS.tune), b('helium', I[n % I.length])];
  if (where === 'checkpoint') out.push(b('dignity', D[n % D.length]));
  return out;
}
/** Now and then while you sail with barrels aboard (src/chatter.ts's Script: a loop, a line now and then). */
export const AT_SEA = HELIUM_SAYS.atSea;

/** A scene's beats played in time: each line up as long as it takes to read (src/den-dignity.ts's readSecs), a
    breath between; Space on to the next once it's been up a moment. */
export const PACE_RUN = { GAP: 0.35, READ_FIRST: 0.6 } as const;
export class Scene {
  i = -1;
  t = 0;
  private gap = 0;
  constructor(readonly beats: readonly Beat[]) {}
  get beat(): Beat | null { return this.beats[this.i] ?? null; }
  get done(): boolean { return this.i >= this.beats.length; }
  /** Each tick: the beat that's just begun, or null. */
  tick(dt: number): Beat | null {
    if (this.done) return null;
    this.t += dt;
    const cur = this.beat;
    if (cur && this.t < readSecs(cur.says)) return null;
    if (cur && (this.gap += dt) < PACE_RUN.GAP) return null;
    this.i++; this.t = 0; this.gap = 0;
    return this.beat;
  }
  /** Space: on to the next line now (once this one's been up a moment). */
  goOn(): void { const cur = this.beat; if (cur && this.t >= PACE_RUN.READ_FIRST) { this.t = Infinity; this.gap = Infinity; } }
  /** Every barrel the scene rolls. */
  get rolls(): number { return this.beats.reduce((s, x) => s + (x.roll ?? 0), 0); }
}

/** What's drawn where (js/den/rumrun.js), plain data. Squares on the sloop's sea (`at`: [c, r]), heights (`y`) in
    metres over the water. */
export const RUM_CAST = {
  /** The barrels on her deck (metres in her own frame: x along her from her middle, +x her bow; z across; y up
      from her deck), in the order they go ashore: the top two first. A pile forward of her mast, clear of
      her tiller, of your spouse's spot and Helium's, and of Umami on her foredeck. Barrels `h` tall. */
  deck: [
    { x: 0.8, y: 0.5, z: -0.38 }, { x: 0.8, y: 0.5, z: 0.38 },
    { x: 0.8, y: 0, z: 0.57 }, { x: 0.8, y: 0, z: 0.19 }, { x: 0.8, y: 0, z: -0.19 }, { x: 0.8, y: 0, z: -0.57 },
  ],
  h: 0.5,
  /** Helium aboard: where they stand on her deck (as your spouse does: src/den-spouse.ts's ABOARD), to port. */
  aboard: { x: -0.25, z: -0.5 },
  /** Mischievious on her jetty while there's rum coming (her look PIRATES's), and where her barrels go. */
  her: { look: 'Mischievious', at: [16.45, 10.32] as [number, number], y: 0.38, yaw: -Math.PI / 2 },
  /** Where each stop's barrels go ashore (`at`, and its ground's height `y`), and where she's brought alongside
      for it (`moor`: none, off Kikkit's, she lies where she is). */
  drops: {
    wedding: { at: [16.1, 10.3] as [number, number], y: 0.38, moor: LAY.ISLE.MOOR as Pose | null },
    kikkit: { at: [18.0, 17.05] as [number, number], y: 0.5, moor: null as Pose | null },
    quay: { at: [11.0, 27.05] as [number, number], y: 0.56, moor: EMPIRE_OFF as Pose | null },
    cove: { at: [15.35, 31.3] as [number, number], y: 0.22, moor: { c: 16, r: 31, d: 3 } as Pose | null },
  },
} as const;

/** Where a stop's barrels go (Port Decorum's by its way in). */
export const dropFor = (id: StopId, how: Landing | null) => (id === 'decorum' ? RUM_CAST.drops[how ?? 'quay'] : RUM_CAST.drops[id]);
