/* Duty Navigation, the real puzzle (YPPedia "Navigation", read 11 Nov 2026, with its two pictures of a
   board: "A typical duty navigation puzzle" and the one without a constellation). TypeScript,
   compiled to js/navigation.js by `npm run build`; tested in tests/navigation.test.ts and played by
   the bots in tools/nav-bots.mjs. It knows nothing of the den: js/den/nav-board.js draws a board of
   it wherever its caller puts it.

   Faithful to the original (RULES.md, "Duty Navigation"):
   - A round board, a ship's wheel on a night sky: three rings round the hub, eight places round each
     (up, down, left, right and the diagonals), on the wheel's eight spokes. Ring 0 is the innermost.
   - Stars of five colours (the pictures: yellow, red, orange, white and blue, each its own shape).
     The next star waits outside the wheel on one of its spokes; Space drops it in, and it falls
     toward the middle down that spoke.
   - Up moves to the higher ring (outward, here), Down to the lower; Left turns the ring selected
     anticlockwise, Right clockwise, its stars with it. A star with nothing under it (inward) falls.
   - Three or more stars of a colour in a line vanish: straight out from the centre (a spoke, all
     three of its places), or round a ring (three or more in a row, round the ring's join too).
   - The constellation: coloured places marked on the board. Get stars of the right colours into
     every one of them and it vanishes, its stars with it, and scores; a new one's shown. Lining up
     stars "does little to increase the score". When the last star makes a constellation and a line
     at once, the constellation goes (YPPedia's strategy: a constellation with three like stars in a
     line, "that part of the constellation must be completed last").
   - Scores are "strongly weighted on the number of stars in the constellation" and on the moves
     taken; a combo (a line clearing, what falls then finishing it) that fills a constellation scores
     big. Constellations start at one or two stars and grow as you go.
   - A booch: dropping a star onto a star in the outermost ring (the ship turns round).

   Not on YPPedia, so made up here (say so if it matters): the exact points, the par of moves, the
   ratings' thresholds, how fast constellations grow (SIZES), that Up is outward, that a booch blows
   the board clear of stars (the constellation stays, rated Booched), that the next star's spoke and
   colour are plain random, that turning and dropping are the moves counted (choosing a ring isn't),
   and that a constellation's own places never make a line of three of a colour.

   A wolf den's Navigation (`den: true`, 14 Nov; IDEAS.md, "Dignity's tutorial: four-tier Duty Navigation in the
   werewolf den", from the Wolf Dens Guide and Multibella's telling): "four-tier", four rings, the fourth an outer one
   with no places of a constellation's, room for setting up chains (a star stays up there only over a full spoke, and
   turns with its ring); constellations of 3 places in the centre ring, 2 in the middle and 1 in the third (a fresh
   board's first, 3 and 1); points by the guide's sums, each ring's weight times (1.5 times its places) squared,
   rounded down (DEN.WEIGHT: 71 the first, 125 one after), times its step in the move's cascade, as a line's are; and
   wild places, filled by a star of any colour:
   - a constellation charted in a chain (a clear before it or after it, in the same move) deals the next with its
     centre ring all wild, and two or more clears add a fourth wild place to it; a plain chart deals plain;
   - a clear in a combo (the move's second step or later) turns wild the constellation's places on and beside what
     it cleared (beside: a place either side round the ring, or either side along the spoke).
   No par in a den: the points are the sums, however many moves. A line along a spoke is three or more of a colour in
   a row out from the centre (on three rings, all three, as before). */

export const RINGS = 3, SPOKES = 8, COLOURS = 5, LINE = 3;
/** A wolf den's board (the header): its rings, its constellations' places a ring (a fresh board's first, then the
    rest), each ring's weight in its points, and the centre ring's places when two or more clears charted the last. */
export const DEN = { RINGS: 4, FIRST: [3, 1, 0], PLACES: [3, 2, 1], WEIGHT: [3, 5, 9], WILD_MORE: 4 } as const;
/** The colours, as the pictures have them. */
export const COLOUR_NAMES = ['yellow', 'red', 'orange', 'white', 'blue'] as const;
/** Points off for a booch. */
export const BOOCH_PENALTY = 25;
/** Constellations' sizes in turn, the last repeating: one star, then two, then three... (YPPedia: "The
    constellations in the first couple of levels have only one or two stars"). A first go is the first
    FIRST_GO of them, one, two and three stars: tools/nav-bots.mjs's greedy navigator takes about 66
    moves over them (15, 21 and 30), a minute or two at the keys. */
export const SIZES: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8];
export const FIRST_GO = 3;
/** Where a constellation's places go: weights for the inner, middle and outer rings. */
export const PLACE_WEIGHT: readonly number[] = [3, 2, 1];
/** A constellation's points: STAR * stars squared, times par / moves when over par, times COMBO when a
    combo fills it. Par is BASE + PER_STAR a star (about what the bots take, tools/nav-bots.mjs: a
    one-star constellation is mostly waiting for a star of its colour, one in five). */
export const SCORE = { STAR: 10, COMBO: 3 };
export const PAR = { BASE: 6, PER_STAR: 4 };
/** Ratings by a constellation's points (a booch while it was up rates it Booched). */
export const RATINGS = ['Booched', 'Poor', 'Fine', 'Good', 'Excellent', 'Incredible'] as const;
export const RATING_AT: readonly number[] = [10, 30, 60, 120];
export type Rating = (typeof RATINGS)[number];

/** A star on the board. */
export interface Star { id: number; c: number }
/** A place: its ring (0 innermost) and spoke (0 up, then clockwise: 2 right, 4 down, 6 left). */
export interface Place { ring: number; spoke: number }
/** A constellation's place, wanting a colour (any, when it's wild: a wolf den's). */
export interface Mark extends Place { colour: number; wild?: boolean }
export interface Constellation { id: number; marks: Mark[] }
/** The star waiting outside the wheel, on its spoke. */
export interface NextStar { id: number; c: number; spoke: number }
/** grid[ring][spoke]. */
export type Grid = (Star | null)[][];

/** A constellation finished: its stars, the moves it took, par, whether a combo filled it, its points
    and rating. */
export interface Done { id: number; stars: number; moves: number; par: number; combo: boolean; booched: boolean; points: number; rating: Rating; marks: Mark[]; step: number }

/** One step as it's seen, for drawing: what happened, then the board. 'turn' a ring turned (`ring`,
    `dir`); 'drop' the next star in at the outer ring; 'fall' everything loose fallen in; 'line' lines
    gone (`lines`, each its places); 'constellation' one filled and gone (`done`); 'deal' a new one
    shown; 'booch' the star dropped onto a star, and the board blown clear. */
export interface Stage {
  kind: 'turn' | 'drop' | 'fall' | 'line' | 'constellation' | 'deal' | 'booch';
  grid: Grid;
  cleared: number[];
  constellation: Constellation | null;
  ring?: number;
  dir?: number;
  lines?: Place[][];
  done?: Done;
  /** A den's: the constellation's places a line's clear turned wild. */
  wilded?: Mark[];
}

/** What a move did. */
export interface Move {
  /** False when nothing happened (no such ring). */
  moved: boolean;
  kind: 'turn' | 'drop';
  booched: boolean;
  /** Lines gone, stars gone (lines and constellation), and steps of the cascade. */
  lines: number;
  cleared: number;
  steps: number;
  /** Points this move (a constellation's, the lines', less a booch). */
  points: number;
  /** The constellation it finished, if it did. */
  done: Done | null;
  stages: Stage[];
}

export interface NavOptions {
  /** Constellations' sizes in turn, the last repeating (SIZES). */
  sizes?: readonly number[];
  /** Colours of star in play (COLOURS). */
  colours?: number;
  /** Constellations given, by their place in the run (0 the first; null, or past the end: dealt at
      random, by `sizes`): a host's own, such as a combo constellation (bottomRow). A given one may be a
      line of its own colour on purpose. */
  given?: readonly (readonly Mark[] | null)[];
  /** A wolf den's board (the header): four rings, the den's constellations, wild places, the den's points. */
  den?: boolean;
}

/* A combo constellation: one that can't be made a star at a time. Most can: whatever order its
   stars come in, the last one fills it, and filled it goes first, before any line (settle). But a
   row of six of a colour side by side round a ring can't: whichever five are in before the last, three
   of them are side by side, a line, and they're gone. (Three, four or five can: two, a gap, two, and
   the last into the gap.) So the last two have to land at once: the ring above turned so two stars of
   its colour slide over the two gaps together and fall in, or a line clearing under them. The user's
   evil constellation (11 Nov), for the starlit door: "you've got to have like three reds together or
   four reds together on the bottom row ... you basically got to put 2 in there and then say 2 of
   another color, 2 of the first color in the ring above those 2, so that when you do a combo ... it
   creates a gap and it falls down ... Those kind of really evil boards that are impossible and
   frustrating to beat, like you're guaranteed to practically booch them." */

/** `n` places of one colour side by side round a ring (the inner one, the bottom row, by default),
    from `spoke` clockwise. */
export function bottomRow(colour: number, n: number, spoke = 0, ring = 0): Mark[] {
  return Array.from({ length: Math.min(SPOKES, n) }, (_, i) => ({ ring, spoke: (spoke + i) % SPOKES, colour }));
}

/** Can't these places be filled a star at a time? True when every star that could go in last (none
    of the others above it on its spoke, so it can) leaves the rest a line of three among themselves:
    they'd have cleared before it came. (Any other stars a player keeps on the board can be colours
    that make no line with them, and rings turn their places round together, so it's the places
    themselves that say.) */
export function needsCombo(marks: readonly Mark[]): boolean {
  return !marks.some((m) => {
    if (marks.some((o) => o !== m && o.spoke === m.spoke && o.ring > m.ring)) return false;
    const g = emptyGrid();
    for (const o of marks) if (o !== m) g[o.ring][o.spoke] = { id: 0, c: o.colour };
    return !linesOf(g).length;
  });
}

/** A wolf den's constellation's points before its step: each ring's weight times (1.5 times its places) squared,
    rounded down (the Wolf Dens Guide: 71 for 3 centre and 1 middle, 125 for 3, 2 and 1, 173 with 4 in the centre). */
export function denPoints(marks: readonly Place[]): number {
  return DEN.WEIGHT.reduce((sum: number, w, ring) => sum + Math.floor(w * (1.5 * marks.filter((m) => m.ring === ring).length) ** 2), 0);
}
/** Do a star's colour and a place agree (a wild place takes any)? */
export const fits = (m: Mark, c: number | undefined): boolean => c !== undefined && (!!m.wild || c === m.colour);

/** A constellation's par of moves. */
export const parFor = (stars: number) => PAR.BASE + PAR.PER_STAR * stars;
/** A constellation's points, by its stars, the moves it took and whether a combo filled it. */
export function pointsFor(stars: number, moves: number, combo: boolean): number {
  const par = parFor(stars);
  return Math.round(SCORE.STAR * stars * stars * Math.min(1, par / Math.max(1, moves)) * (combo ? SCORE.COMBO : 1));
}
export function ratingFor(points: number, booched = false): Rating {
  if (booched) return 'Booched';
  let i = 0;
  while (i < RATING_AT.length && points >= RATING_AT[i]) i++;
  return RATINGS[i + 1];
}

/** Every line of three or more of a colour on a grid: each spoke all of a colour, and runs round each
    ring (the whole ring, if it's all one colour). */
export function linesOf(grid: Grid): Place[][] {
  const out: Place[][] = [];
  // (along a spoke: three or more of a colour in a row out from the centre; on three rings, all three)
  for (let s = 0; s < SPOKES; s++) {
    let run: number[] = [];
    for (let ring = 0; ring <= grid.length; ring++) {
      const c = ring < grid.length ? grid[ring][s]?.c ?? -1 : -2;
      if (run.length && c === grid[run[0]][s]?.c) { run.push(ring); continue; }
      if (run.length >= LINE) out.push(run.map((r) => ({ ring: r, spoke: s })));
      run = c >= 0 ? [ring] : [];
    }
  }
  for (let ring = 0; ring < grid.length; ring++) {
    const row = grid[ring], col = (s: number) => row[(s + SPOKES) % SPOKES]?.c ?? -1;
    // A start where a run begins (its colour differs from the place before); none: one colour all round.
    let start = -1;
    for (let s = 0; s < SPOKES; s++) if (col(s) !== col(s - 1)) { start = s; break; }
    if (start < 0) { if (col(0) >= 0 && SPOKES >= LINE) out.push(row.map((_, spoke) => ({ ring, spoke }))); continue; }
    let run: number[] = [];
    for (let k = 0; k <= SPOKES; k++) {
      const s = (start + k) % SPOKES, c = k < SPOKES ? col(s) : -2;
      if (run.length && c === col(run[0])) { run.push(s); continue; }
      if (run.length >= LINE && col(run[0]) >= 0) out.push(run.map((spoke) => ({ ring, spoke })));
      run = c >= 0 ? [s] : [];
    }
  }
  return out;
}

const emptyGrid = (rings = RINGS): Grid => Array.from({ length: rings }, () => Array<Star | null>(SPOKES).fill(null));

export class Navigation {
  grid: Grid;
  /** The ring selected (0 innermost). */
  ring: number;
  next: NextStar;
  constellation: Constellation | null = null;
  /** Constellations finished, and the last one's what-it-was. */
  completed = 0;
  last: Done | null = null;
  score = 0;
  /** Moves (turns and drops) since this constellation was shown, and in all. */
  moves = 0;
  totalMoves = 0;
  booches = 0;
  /** A booch while this constellation was up. */
  boochedThis = false;
  /** Keep stages (the board animates them; bots don't need them). */
  record = true;
  readonly sizes: readonly number[];
  readonly colours: number;
  readonly given: readonly (readonly Mark[] | null)[];
  /** A wolf den's board (NavOptions.den), and its rings. */
  readonly den: boolean;
  readonly rings: number;
  /** A den's next constellation's centre: 0 plain, 1 wild, 2 wild with a fourth place (the last charted in a chain
      of one clear, or of two or more). */
  wildNext = 0;
  private nextId = 1;

  constructor(private readonly random: () => number = Math.random, opts: NavOptions = {}) {
    this.den = !!opts.den;
    this.rings = this.den ? DEN.RINGS : RINGS;
    this.grid = emptyGrid(this.rings);
    this.ring = this.rings - 1;
    this.sizes = opts.sizes?.length ? opts.sizes : SIZES;
    this.colours = Math.max(2, Math.min(COLOURS, opts.colours ?? COLOURS));
    this.given = opts.given ?? [];
    this.next = this.newStar();
    this.deal();
  }

  private newStar(): NextStar {
    return { id: this.nextId++, c: Math.floor(this.random() * this.colours), spoke: Math.floor(this.random() * SPOKES) };
  }

  /** The size of the constellation up now (or next). */
  size(): number { return this.sizes[Math.min(this.completed, this.sizes.length - 1)]; }

  /** Show a new constellation: the one given for this place in the run (NavOptions.given), if there
      is one; else of size() stars (or `stars`): places weighted toward the middle (PLACE_WEIGHT),
      random colours, never a line of three of a colour among its own places, never filled already. */
  deal(stars?: number): Constellation {
    const given = stars === undefined ? this.given[this.completed] : null;
    if (this.den && !given?.length && stars === undefined) return this.dealDen();
    if (given?.length) {
      const c: Constellation = { id: this.nextId++, marks: given.map((m) => ({ ...m })) };
      this.constellation = c;
      this.moves = 0;
      this.boochedThis = false;
      return c;
    }
    const n = Math.max(1, Math.min(RINGS * SPOKES, stars ?? this.size()));
    for (let tries = 0; ; tries++) {
      const marks: Mark[] = [], used = new Set<number>();
      while (marks.length < n) {
        const total = PLACE_WEIGHT.reduce((a, b) => a + b, 0);
        let x = this.random() * total, ring = 0;
        while (ring < RINGS - 1 && x >= PLACE_WEIGHT[ring]) x -= PLACE_WEIGHT[ring++];
        const spoke = Math.floor(this.random() * SPOKES), k = ring * SPOKES + spoke;
        if (used.has(k)) { if (used.size >= RINGS * SPOKES) break; continue; }
        used.add(k);
        marks.push({ ring, spoke, colour: Math.floor(this.random() * this.colours) });
      }
      const c: Constellation = { id: this.nextId++, marks };
      const own = emptyGrid();
      for (const m of marks) own[m.ring][m.spoke] = { id: 0, c: m.colour };
      if (tries < 200 && (linesOf(own).length || this.filled(c))) continue;
      this.constellation = c;
      this.moves = 0;
      this.boochedThis = false;
      return c;
    }
  }

  /** A wolf den's constellation: its places a ring (DEN.FIRST for a fresh board's first, else DEN.PLACES), each
      ring's on spokes of its own; its centre wild after a chain's chart (wildNext), with a fourth place after two or
      more clears; never a line of its own colours, never filled already. */
  private dealDen(): Constellation {
    const wild = this.wildNext, per: number[] = this.completed === 0 && !wild ? [...DEN.FIRST] : [...DEN.PLACES];
    if (wild >= 2) per[0] = DEN.WILD_MORE;
    for (let tries = 0; ; tries++) {
      const marks: Mark[] = [];
      per.forEach((n, ring) => {
        const spokes = Array.from({ length: SPOKES }, (_, s) => s);
        for (let i = 0; i < n; i++) {
          const spoke = spokes.splice(Math.floor(this.random() * spokes.length), 1)[0];
          marks.push({ ring, spoke, colour: Math.floor(this.random() * this.colours), ...(ring === 0 && wild ? { wild: true } : {}) });
        }
      });
      const c: Constellation = { id: this.nextId++, marks };
      const own = emptyGrid(this.rings);
      for (const m of marks) if (!m.wild) own[m.ring][m.spoke] = { id: 0, c: m.colour };
      if (tries < 200 && (linesOf(own).length || this.filled(c))) continue;
      this.constellation = c;
      this.moves = 0;
      this.boochedThis = false;
      return c;
    }
  }

  /** Is every place of the constellation holding a star of its colour (any star, a wild one)? */
  filled(c = this.constellation): boolean {
    return !!c && c.marks.every((m) => fits(m, this.grid[m.ring][m.spoke]?.c));
  }

  /** Choose the higher (+1, outward) or lower (-1) ring. Not a move. */
  select(d: number): boolean {
    const r = Math.max(0, Math.min(this.rings - 1, this.ring + Math.sign(d)));
    if (r === this.ring) return false;
    this.ring = r;
    return true;
  }

  /** Turn a ring (the one selected) a place: +1 clockwise (Right), -1 anticlockwise (Left), its stars
      with it; then everything settles. A move. */
  turn(dir: number, ring = this.ring): Move {
    const res = this.blank('turn');
    if (ring < 0 || ring >= this.rings || !dir) return res;
    const d = Math.sign(dir), row = this.grid[ring];
    this.grid[ring] = row.map((_, s) => row[(s - d + SPOKES) % SPOKES]);
    res.moved = true;
    this.counted();
    this.stage(res, 'turn', [], { ring, dir: d });
    this.settle(res);
    return res;
  }

  /** Drop the next star in down its spoke. Onto a star in the outer ring, it's a booch. A move. */
  drop(): Move {
    const res = this.blank('drop'), n = this.next, outer = this.rings - 1;
    res.moved = true;
    this.counted();
    this.next = this.newStar();
    if (this.grid[outer][n.spoke]) {
      res.booched = true;
      res.points -= BOOCH_PENALTY;
      this.score -= BOOCH_PENALTY;
      this.booches++;
      this.boochedThis = true;
      const gone: number[] = [];
      for (const ring of this.grid) for (const x of ring) if (x) gone.push(x.id);
      this.grid = emptyGrid(this.rings);
      this.stage(res, 'booch', [...gone, n.id]);
      return res;
    }
    this.grid[outer][n.spoke] = { id: n.id, c: n.c };
    this.stage(res, 'drop', []);
    this.settle(res);
    return res;
  }

  /** Everything loose falls in until it rests. Did anything move? */
  fall(): boolean {
    let any = false;
    for (let moved = true; moved;) {
      moved = false;
      for (let ring = 1; ring < this.rings; ring++) for (let s = 0; s < SPOKES; s++) {
        if (this.grid[ring][s] && !this.grid[ring - 1][s]) { this.grid[ring - 1][s] = this.grid[ring][s]; this.grid[ring][s] = null; moved = any = true; }
      }
    }
    return any;
  }

  /** Every line of three or more of a colour now. */
  lines(): Place[][] { return linesOf(this.grid); }

  private counted(): void { this.moves++; this.totalMoves++; }

  private blank(kind: Move['kind']): Move {
    return { moved: false, kind, booched: false, lines: 0, cleared: 0, steps: 0, points: 0, done: null, stages: [] };
  }

  /** After a move: falls; a constellation filled goes first; then lines; round again till still. */
  private settle(res: Move): void {
    let lineSteps = 0;
    for (;;) {
      if (this.fall()) this.stage(res, 'fall', []);
      const c = this.constellation;
      if (c && this.filled(c)) {
        const ids = c.marks.map((m) => this.grid[m.ring][m.spoke]!.id);
        for (const m of c.marks) this.grid[m.ring][m.spoke] = null;
        const stars = c.marks.length, combo = lineSteps > 0, step = res.steps + 1;
        const points = this.den ? denPoints(c.marks) * step : pointsFor(stars, this.moves, combo);
        const done: Done = { id: c.id, stars, moves: this.moves, par: parFor(stars), combo, booched: this.boochedThis, points, rating: ratingFor(points, this.boochedThis), marks: c.marks, step };
        res.done = done;
        res.points += points;
        res.cleared += ids.length;
        res.steps++;
        this.score += points;
        this.completed++;
        this.last = done;
        this.constellation = null;
        this.stage(res, 'constellation', ids, { done });
        continue;
      }
      const lines = this.lines();
      if (!lines.length) break;
      lineSteps++;
      res.steps++;
      res.lines += lines.length;
      const ids = new Set<number>();
      for (const l of lines) for (const p of l) ids.add(this.grid[p.ring][p.spoke]!.id);
      for (const l of lines) for (const p of l) this.grid[p.ring][p.spoke] = null;
      res.cleared += ids.size;
      // ("Simply lining up same-colored stars does little to increase the score": a point a star,
      // times its step in the cascade; a den's step counting its chart too.)
      const times = this.den ? res.steps : lineSteps;
      res.points += ids.size * times;
      this.score += ids.size * times;
      // (a den's: a clear in a combo turns wild the constellation's places on and beside what it cleared)
      const wilded = this.den && res.steps >= 2 ? this.wildBeside(lines) : [];
      this.stage(res, 'line', [...ids], { lines, ...(wilded.length ? { wilded } : {}) });
    }
    // (a den's chart in a chain deals the next with its centre wild; a plain one, plain)
    if (this.den && res.done) { const clears = res.steps - 1; this.wildNext = clears >= 2 ? 2 : clears; }
    if (!this.constellation) { this.deal(); this.stage(res, 'deal', []); }
  }

  /** The constellation's places on or beside the places cleared, made wild; the ones newly wild. */
  private wildBeside(lines: Place[][]): Mark[] {
    const c = this.constellation;
    if (!c) return [];
    const near = (m: Place, p: Place) => (m.ring === p.ring && [0, 1, SPOKES - 1].includes((m.spoke - p.spoke + SPOKES) % SPOKES)) || (m.spoke === p.spoke && Math.abs(m.ring - p.ring) === 1);
    const out: Mark[] = [];
    for (const m of c.marks) if (!m.wild && lines.some((l) => l.some((p) => near(m, p)))) { m.wild = true; out.push({ ...m }); }
    return out;
  }

  private stage(res: Move, kind: Stage['kind'], cleared: number[], what: Partial<Stage> = {}): void {
    if (this.record) res.stages.push({ kind, cleared, grid: this.snap(), constellation: this.constellation, ...what });
  }

  /** A copy of the grid, stars and all. */
  snap(): Grid { return this.grid.map((ring) => ring.map((x) => (x ? { ...x } : null))); }

  /** Lay a board out as given (a test's): grid[ring][spoke] colours, -1 or null empty. */
  lay(colours: (number | null)[][], constellation?: Mark[]): void {
    this.grid = emptyGrid(this.rings);
    colours.forEach((ring, r) => ring.forEach((c, s) => { if (c !== null && c >= 0) this.grid[r][s] = { id: this.nextId++, c }; }));
    if (constellation) { this.constellation = { id: this.nextId++, marks: constellation.map((m) => ({ ...m })) }; this.moves = 0; this.boochedThis = false; }
  }

  /** A copy of the whole game with its own source of numbers (what a bot imagines a move would do). */
  copy(random: () => number): Navigation {
    const s: Navigation = Object.assign(Object.create(Navigation.prototype) as Navigation, this as Navigation);
    Object.assign(s, { grid: this.snap(), next: { ...this.next }, random, record: false });
    return s;
  }
}
