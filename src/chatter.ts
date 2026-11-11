/* Pirate Den: someone standing about talking, what they say and when, for anyone anywhere. TypeScript,
   compiled to js/chatter.js; tested in tests/chatter.test.ts. js/den/props-people.js's person() says
   its lines with it (Kikkit on her island, Gravee in her house), knowing nothing of who's talking.

   The user (11 Nov), of Kikkit: "It's a pirate with a configurable loop of text", and "Kikkit should
   just be a bit of config ... this is what her lines are. But then it should be using ... some generic
   pirate talking". So a character's talk is a Script, plain data: lines said once first (an intro, a
   ramble), then a list round and round for ever (in turn or at random), the intro told again after
   each time round if it says so, and lines slotted in by name when something happens (an aside: Kikkit
   when you're spat back). A Chatter plays one: a line up for as long as it takes to read, a pause
   between if it has one, only while you're within earshot (out of it, it finishes its line and stops;
   come back and it carries on where it was), Space on to the next. */

/** What someone says, and in what order. Plain data. */
export interface Script {
  /** Said first, once, in order (an introduction; Kikkit's ramble). */
  readonly intro?: readonly string[];
  /** Then these, round and round for ever: in turn, or (`random`) any of them each time. */
  readonly loop?: readonly string[];
  readonly random?: boolean;
  /** After each time round `loop`, the intro told again. */
  readonly retell?: boolean;
  /** Lines slotted in when something happens, by name: each name's said in turn, round again after its
      last. */
  readonly asides?: { readonly [name: string]: readonly string[] };
}

/** How it's said: each line's time up (seconds, by its text), the pause between, and the wait before
    the first. */
export interface Pace {
  secs: (text: string) => number;
  /** Seconds between lines: a number, or [least, most] (default none). */
  gap?: number | readonly [number, number];
  /** Seconds before the first line, once it's begun (default none). */
  wait?: number;
  /** For `random` and a random gap (default Math.random). */
  rand?: () => number;
}

/** A line being said: its text, how long it's been up, and how long it's up for. */
export interface Said { text: string; t: number; secs: number }

/** Someone's talk, played: see the top of this file. */
export class Chatter {
  /** It's begun (start): it says its script while you're within earshot. */
  started = false;
  /** The line up just now, if any. */
  line: Said | null = null;
  private phase: 'intro' | 'loop' = 'intro';
  private i = 0;
  private wait: number;
  private asideAt: { [name: string]: number } = {};
  private readonly rand: () => number;

  constructor(readonly script: Script, readonly pace: Pace) {
    this.wait = pace.wait ?? 0;
    this.rand = pace.rand ?? Math.random;
  }

  /** Begins its script (its first line comes on the next tick within earshot). False if it already had. */
  start(): boolean {
    if (this.started) return false;
    this.started = true;
    return true;
  }

  /** The script's next line, moving on: the intro's, then the loop's, for ever (null when there's
      nothing more: an intro alone, said). Just the order: nothing's said. */
  next(): string | null {
    const S = this.script, intro = S.intro ?? [], loop = S.loop ?? [];
    if (this.phase === 'intro') {
      if (this.i < intro.length) return intro[this.i++];
      this.phase = 'loop'; this.i = 0;
    }
    if (!loop.length) return null;
    if (S.random) return loop[Math.floor(this.rand() * loop.length)];
    if (this.i >= loop.length) {
      this.i = 0;
      if (S.retell && intro.length) { this.phase = 'intro'; return this.next(); }
    }
    return loop[this.i++];
  }

  /** Each tick: its line up a while, then (within earshot: `near`) after the pause, the next. The text of
      a line begun this tick, or null. */
  tick(dt: number, near = true): string | null {
    if (this.line) {
      if ((this.line.t += dt) < this.line.secs) return null;
      this.line = null;
      this.wait = this.gap();
    }
    if (!this.started || !near) return null;   // (out of earshot: its line finished, it stops there)
    if ((this.wait -= dt) > 0) return null;
    return this.say(this.next());
  }

  /** Space: on to its next line now if it's talking (no pause), else (begun) its next line. Null if it's
      nothing to say. */
  hail(): string | null {
    if (!this.started && !this.line) { this.start(); return this.say(this.next()); }
    this.line = null;
    return this.started ? this.say(this.next()) : null;
  }

  /** Something's happened: the next of its lines for it (Script.asides), said now over whatever it was
      saying; then it carries on where it was. Null if it has none by that name. */
  aside(name: string): string | null {
    const list = this.script.asides?.[name];
    if (!list?.length) return null;
    const k = this.asideAt[name] ?? 0;
    this.asideAt[name] = k + 1;
    return this.say(list[k % list.length]);
  }

  /** Says this now, over whatever it was saying (or, null, stops). */
  say(text: string | null): string | null {
    this.line = text ? { text, t: 0, secs: this.pace.secs(text) } : null;
    return text;
  }

  /** Stops talking just now (where it is in its script is kept). */
  hush(): void { this.line = null; this.wait = this.gap(); }

  private gap(): number {
    const g = this.pace.gap ?? 0;
    return typeof g === 'number' ? g : g[0] + this.rand() * (g[1] - g[0]);
  }
}
