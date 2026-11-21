/* Needle felting as a puzzle (21 Nov, a first concept for Lintmint's croft: "i like sheep wool stabbing and cheej
   :3"). Knows nothing of where it's played: no DOM, the clock and the dice handed in.

   Real needle felting, what it's drawn from: a barbed needle stabbed into loose wool on a foam pad tangles the
   fibres; where you stab, the wool firms and shrinks; more wool adds bulk; coloured wool laid on top and stabbed in
   makes the details; over-stab a spot and it goes hard and sinks; stab crooked or too fast and the needle snaps.

   The board is a tuft of wool on a foam pad seen from above, a grid, with a pattern's outline faint on it. Every cell
   inside the outline starts as loose core wool; a ragged fringe of stray wool lies round it.
   - A stab outside the outline on stray wool tucks it one cell in toward the shape. Tucked in, it's fresh fibre: the
     cell it lands on softens a little (and a dimple filled with wool comes back up).
   - A stab inside firms the cell by one, and the cells beside it a quarter each. So stabbing one spot over and over
     leaves a hard dimple with soft wool round it; even firming means spreading your stabs, and the middle, with wool
     on every side, needs fewer stabs of its own than the edges do (as real felting goes: the edges stay fluffy).
   - Firm is the goal: 3 to 4. Under 3 it's still soft; 4 or more is hard, a dimple, a flaw. Except a cheese's holes,
     which are meant to be dimples: stab them deep.
   - Details: lay a wisp of coloured wool on a cell (the sheep's black face, the cheese's rind), then stab it in. A
     stab through a wisp is shallow: the wisp felts by one (two and it's in), the wool under it firms by a half, the
     cells beside it an eighth. So leave the detail cells a little soft before the details, or do them as you go.
   - Three needles. Stabbing too fast, or dragging while you stab, bends the needle; do it again while it's bent and
     it snaps. A calm moment straightens it. The last needle snapping ends the piece.
   Scored by how close to the pattern it came, how even the felt is, and needles left. */

/** A pattern: its rows, one character a cell. '.' is outside the outline; the core's letter is the tuft's own
    wool; any other letter is a detail colour laid on the core; 'o' is a hole (a dimple meant to be there). */
export interface Pattern {
  id: string;
  name: string;
  /** The core wool's letter, the colour of the tuft you start with. */
  core: string;
  rows: string[];
  /** Each letter's wool, by name (the view picks its colour). */
  wools: Record<string, string>;
}

export const HOLE = 'o';

export const PATTERNS: Record<string, Pattern> = {
  sheep: {
    id: 'sheep', name: 'A sheep', core: 'w',
    wools: { w: 'white', k: 'black' },
    rows: [
      '................',
      '...ww..ww..ww...',
      '..wwwwwwwwwwww..',
      '.wwwwwwwwwwwwkk.',
      '.wwwwwwwwwwwkkkk',
      '.wwwwwwwwwwwkwkk',
      '.wwwwwwwwwwwwkk.',
      '..wwwwwwwwwwww..',
      '...wwwwwwwwww...',
      '...k.k....k.k...',
      '...k.k....k.k...',
      '................',
    ],
  },
  cheese: {
    id: 'cheese', name: 'A wedge of cheese', core: 'y',
    wools: { y: 'yellow', r: 'rind' },
    rows: [
      '................',
      '.rr.............',
      '.rryy...........',
      '.rryyyy.........',
      '.rryoyyyy.......',
      '.rryyyyyyyy.....',
      '.rryyyyoyyyyy...',
      '.rryoyyyyyyyyyy.',
      '.rryyyyyyyoyyyy.',
      '.rryyoyyyyyyyyy.',
      '.rrrrrrrrrrrrrr.',
      '................',
    ],
  },
  frog: {
    id: 'frog', name: 'A frog (pepopupu)', core: 'g',
    wools: { g: 'green', w: 'white', k: 'black', p: 'pink' },
    rows: [
      '................',
      '...ww......ww...',
      '..wkkw....wkkw..',
      '..wkkwggggwkkw..',
      '.gggggggggggggg.',
      '.gggggggggggggg.',
      '.ggpggggggggpgg.',
      '.gggkkkkkkkkggg.',
      '..gggggggggggg..',
      '...gggggggggg...',
      '..gg........gg..',
      '................',
    ],
  },
};

/** How firm a cell has to be: FIRM to HARD is right; HARD or more is a dimple. */
export const FIRM = 3, HARD = 4;
/** What a stab does: the cell by DEPTH, each cell beside it by DEPTH * SPREAD. A stab through a wisp is SHALLOW. */
export const DEPTH = 1, SPREAD = 0.25, SHALLOW = 0.5;
/** A wisp is felted in at this many stabs. */
export const WISP_IN = 2;
/** Fresh wool tucked onto a cell softens it by this. */
export const TUCK_SOFTEN = 0.5;
/** The needles: stabs closer together than MIN_GAP seconds bend one; CALM seconds without straightens it. */
export const NEEDLES = 3, MIN_GAP = 0.12, CALM = 0.5;

export interface Cell {
  /** Inside the outline. */
  inside: boolean;
  /** What it should be: the pattern's letter ('.' outside). */
  want: string;
  /** Wool on it: inside, its core (always 1 or more); outside, stray wool to tuck in (0 if bare foam). */
  wool: number;
  /** How felted its wool is: 0 loose, FIRM firm, HARD a dimple. */
  firm: number;
  /** A wisp of colour laid on top, and how far it's stabbed in (WISP_IN and it's in). */
  wisp: string | null;
  felt: number;
}

export type StabKind = 'foam' | 'tuck' | 'firm' | 'wisp' | 'lay' | 'none';

export interface Stab {
  kind: StabKind;
  r: number; c: number;
  /** For a tuck, where the wool went. */
  to?: { r: number; c: number };
  /** The needle bent on this stab, or snapped. */
  bent: boolean;
  snapped: boolean;
  /** The piece is done (the last needle snapped). */
  over: boolean;
}

export interface Score {
  /** The fraction of cells that came out as the pattern wants: 0 to 1. */
  match: number;
  /** How even the felt is (1 dead even): from the spread of the body's firmness. */
  evenness: number;
  needles: number;
  /** All of it, out of 100. */
  total: number;
  /** In plain words. */
  verdict: string;
  /** What's still off, counted. */
  strays: number; soft: number; hard: number; details: number; holes: number;
}

/** A seeded random, the same as the other puzzles'. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SIDES = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;

export class Felting {
  readonly pattern: Pattern;
  readonly w: number;
  readonly h: number;
  readonly grid: Cell[][];
  /** Each cell's steps to the shape (0 inside), so a tuck knows which way is in. */
  readonly toShape: number[][];
  needles = NEEDLES;
  /** The needle in hand is bent. */
  bent = false;
  stabs = 0;
  over = false;
  private last = -Infinity;

  constructor(pattern: Pattern, random: () => number = Math.random, { fringe = 1 } = {}) {
    this.pattern = pattern;
    this.h = pattern.rows.length;
    this.w = pattern.rows[0].length;
    this.grid = pattern.rows.map((row) => [...row].map((ch) => ({
      inside: ch !== '.', want: ch, wool: ch !== '.' ? 1 : 0, firm: 0, wisp: null, felt: 0,
    })));
    this.toShape = this.distances();
    // The ragged fringe: stray wool round the outline, thickest close in.
    for (let r = 0; r < this.h; r++) for (let c = 0; c < this.w; c++) {
      const d = this.toShape[r][c];
      if (d === 1 && random() < 0.5 * fringe) this.grid[r][c].wool = 1;
      else if (d === 2 && random() < 0.18 * fringe) this.grid[r][c].wool = 1;
    }
  }

  at(r: number, c: number): Cell | null { return this.grid[r]?.[c] ?? null; }

  private distances(): number[][] {
    const d = this.grid.map((row) => row.map((x) => (x.inside ? 0 : Infinity)));
    const queue: [number, number][] = [];
    for (let r = 0; r < this.h; r++) for (let c = 0; c < this.w; c++) if (d[r][c] === 0) queue.push([r, c]);
    for (let i = 0; i < queue.length; i++) {
      const [r, c] = queue[i];
      for (const [dr, dc] of SIDES) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= this.h || cc >= this.w || d[rr][cc] <= d[r][c] + 1) continue;
        d[rr][cc] = d[r][c] + 1;
        queue.push([rr, cc]);
      }
    }
    return d;
  }

  /** Where stray wool on (r, c) goes when it's tucked: the next cell toward the shape (the first of the nearest,
      in a fixed order, so the same stab always does the same thing). */
  tuckTo(r: number, c: number): { r: number; c: number } | null {
    const here = this.toShape[r]?.[c];
    if (here == null || here === 0) return null;
    let best: { r: number; c: number } | null = null, bestD = here;
    for (const [dr, dc] of SIDES) {
      const d = this.toShape[r + dr]?.[c + dc];
      if (d != null && d < bestD) { bestD = d; best = { r: r + dr, c: c + dc }; }
    }
    return best;
  }

  /** The needle's part of a stab, at time t (seconds): too soon after the last, or a drag, bends it; again while
      bent, it snaps. */
  private needle(t: number, drag: boolean): { bent: boolean; snapped: boolean } {
    if (t - this.last >= CALM) this.bent = false;
    const rough = drag || t - this.last < MIN_GAP;
    this.last = t;
    if (!rough) return { bent: false, snapped: false };
    if (!this.bent) { this.bent = true; return { bent: true, snapped: false }; }
    this.bent = false;
    this.needles--;
    if (this.needles <= 0) { this.needles = 0; this.over = true; }
    return { bent: false, snapped: true };
  }

  /** The needle pulled sideways while it's in the wool (a drag after a stab), at time t: bends it, or snaps it if
      it's bent already. */
  twist(t: number): { bent: boolean; snapped: boolean } {
    if (this.over) return { bent: false, snapped: false };
    const was = this.last;
    const n = this.needle(t, true);
    this.last = Math.max(was, t);
    return n;
  }

  /** Whether the needle in hand is bent at time t (a calm moment since the last stab straightens it). */
  bentAt(t: number): boolean { return this.bent && t - this.last < CALM; }

  /** Can a stab or a wisp go here at all. */
  canStab(r: number, c: number): boolean { return !this.over && !!this.at(r, c); }

  /** A stab at (r, c), at time t in seconds (the clock handed in), with the colour in hand (a detail's letter, or
      null for the bare needle). With a colour in hand on a cell not already wearing it, the tap lays a wisp instead
      (no needle in it). `drag`: the pointer moved while stabbing. */
  stab(r: number, c: number, { t = 0, drag = false, colour = null as string | null } = {}): Stab {
    const cell = this.at(r, c);
    const none: Stab = { kind: 'none', r, c, bent: false, snapped: false, over: this.over };
    if (!cell || this.over) return none;
    if (colour && cell.inside && cell.wisp !== colour) {
      cell.wisp = colour;
      cell.felt = 0;
      return { ...none, kind: 'lay' };
    }
    if (colour && !cell.inside) return none;
    this.stabs++;
    const n = this.needle(t, drag);
    const out = { ...none, ...n, over: this.over };
    if (!cell.inside) {
      if (!cell.wool) return { ...out, kind: 'foam' };
      const to = this.tuckTo(r, c)!;
      const there = this.grid[to.r][to.c];
      there.wool += cell.wool;
      if (there.inside) there.firm = Math.max(0, there.firm - TUCK_SOFTEN * cell.wool);
      cell.wool = 0;
      return { ...out, kind: 'tuck', to };
    }
    const shallow = cell.wisp !== null && cell.felt < WISP_IN;
    const depth = shallow ? SHALLOW : DEPTH;
    if (shallow) cell.felt++;
    cell.firm += depth;
    for (const [dr, dc] of SIDES) {
      const n2 = this.at(r + dr, c + dc);
      if (n2?.inside) n2.firm += depth * SPREAD;
    }
    return { ...out, kind: shallow ? 'wisp' : 'firm' };
  }

  /** Whether a cell came out as the pattern wants. */
  right(r: number, c: number): boolean {
    const x = this.grid[r][c];
    if (!x.inside) return x.wool === 0;
    if (x.want === HOLE) return x.firm >= HARD;
    const firm = x.firm >= FIRM && x.firm < HARD;
    if (x.want === this.pattern.core) return firm && (x.wisp === null || x.wisp === x.want);
    return firm && x.wisp === x.want && x.felt >= WISP_IN;
  }

  /** The cells of each kind still off, for the phases' checklist: stray tufts, soft or hard cells of the body, the
      details not yet felted in, the holes not yet deep. */
  left() {
    let strays = 0, soft = 0, hard = 0, details = 0, holes = 0, body = 0, detailsAll = 0, holesAll = 0;
    for (let r = 0; r < this.h; r++) for (let c = 0; c < this.w; c++) {
      const x = this.grid[r][c];
      if (!x.inside) { if (x.wool) strays++; continue; }
      if (x.want === HOLE) { holesAll++; if (x.firm < HARD) holes++; continue; }
      body++;
      if (x.firm < FIRM) soft++; else if (x.firm >= HARD) hard++;
      if (x.want !== this.pattern.core) { detailsAll++; if (x.wisp !== x.want || x.felt < WISP_IN) details++; }
      else if (x.wisp && x.wisp !== x.want) details++;
    }
    return { strays, soft, hard, details, holes, body, detailsAll, holesAll };
  }

  /** The piece's score as it stands. */
  score(): Score {
    let right = 0, all = 0;
    const firms: number[] = [];
    for (let r = 0; r < this.h; r++) for (let c = 0; c < this.w; c++) {
      const x = this.grid[r][c];
      // (bare foam far from the shape counts for nothing either way)
      if (!x.inside && this.toShape[r][c] > 2) continue;
      all++;
      if (this.right(r, c)) right++;
      if (x.inside && x.want !== HOLE) firms.push(x.firm);
    }
    const match = all ? right / all : 0;
    const mean = firms.reduce((a, b) => a + b, 0) / Math.max(1, firms.length);
    const sd = Math.sqrt(firms.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, firms.length));
    // Even at the right firmness: a dead-even loose tuft isn't even felt.
    const evenness = Math.max(0, 1 - sd / 1.2) * Math.min(1, mean / FIRM);
    const total = Math.round(100 * (0.6 * match + 0.25 * evenness + 0.15 * (this.needles / NEEDLES)));
    const l = this.left();
    return { match, evenness, needles: this.needles, total, verdict: verdict(total), strays: l.strays, soft: l.soft, hard: l.hard, details: l.details, holes: l.holes };
  }

  /** The piece is finished: no more stabs. */
  finish(): Score { this.over = true; return this.score(); }

  /** A copy to try a stab on (for the bot). */
  clone(): Felting {
    const f = Object.create(Felting.prototype) as Felting;
    Object.assign(f, this, { grid: this.grid.map((row) => row.map((x) => ({ ...x }))) });
    return f;
  }
}

export function verdict(total: number): string {
  if (total >= 92) return 'A keeper: soft to look at, firm to hold.';
  if (total >= 80) return 'Lovely. A little lumpy if you look close.';
  if (total >= 65) return 'Charming, in a homemade way.';
  if (total >= 45) return 'It is definitely something.';
  return 'A tuft of wool with ambitions.';
}

/** Read a pattern's name from the address, falling back to the sheep. */
export function patternOf(id: string | null | undefined): Pattern {
  return (id && PATTERNS[id]) || PATTERNS.sheep;
}

/** The detail colours a pattern needs laid (its letters other than the core and the holes). */
export function detailColours(p: Pattern): string[] {
  const seen = new Set<string>();
  for (const row of p.rows) for (const ch of row) if (ch !== '.' && ch !== p.core && ch !== HOLE) seen.add(ch);
  return [...seen];
}
