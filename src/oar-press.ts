/* Oars against the water, a prototype (TODO.md, "Prototype oars against the water", 10 Nov).
   TypeScript, compiled to js/oar-press.js by `npm run build`; tested in tests/oar-press.test.ts,
   played on oars-test.html and by the bots in tools/oar-press-bots.mjs. It knows nothing of the den.

   IDEAS.md's "Oars against the water, a puzzle of its own": pairs of pieces come in from the top as
   the water's flow; a breaker pops the group of its colour it touches, and what falls after can
   set off more (a chain). The oar lies across the board from its rowlock at the foot. The pile's
   weight presses it back, and that sweep is the drive that moves her: a notch every pair, harder
   the more of its colours are on the board. Right back, it's spent and drives nothing. A pop frees
   it to swing forward, as far as the pop was big (a chain counts for more), up to the catch.

   Her heading follows the two oars: driving together she goes straight, one driving while the
   other's spent turns her. Solo, one board, warm colours (red, amber) pull the port oar and cool
   ones (teal, blue) the starboard; with a crew, a board a side, every colour on it pulling that
   side's oar.

   No game over: when a stack reaches the top the water washes over, and the top rows of the board
   are lost to the sea (pieces you'd been building on, so a little weight and the chances in it). */

/** Every number the puzzle runs on, to tune in one place. An oar's travel runs from 0 (at the
    catch, right forward) to 1 (right back, spent). */
export const OAR_PRESS = {
  /** The board, in pieces across. */
  W: 6,
  /** The board, in pieces up. */
  H: 12,
  /** How often a piece comes as a breaker (one in five, as Swordfight's). */
  BREAKER_ODDS: 0.2,
  /** How far the flow sweeps an oar back with every pair that lands: a full stroke lasts ten pairs. */
  FLOW: 0.1,
  /** How far forward each piece popped frees its oar. Under FLOW, so popping one piece a pair a
      side (all that comes in) can't keep an oar going: chains are what keep her moving. A pop of
      twelve pieces is a full stroke. */
  SWING: 0.08,
  /** Each link of a chain after the first counts its pieces this much more: a second link double,
      a third triple. */
  CHAIN: 1,
  /** How firmly an oar drives with none of its colours on the board. */
  FIRM_MIN: 0.3,
  /** Pieces of its colours on the board for a fully firm drive (more counts no more). */
  FIRM_FULL: 16,
  /** Boat lengths she makes in a full stroke of both oars, fully firm. */
  DRIVE: 1,
  /** How far she turns, in radians, for each boat length of drive on one side unmatched by the
      other (port driving harder turns her to starboard): one oar's full stroke alone, fully
      firm, turns her a quarter turn. */
  TURN: 1.5,
  /** Rows lost off the top when a stack reaches it. */
  WASH: 3,
};

/** Red, amber (warm: port), teal, blue (cool: starboard). */
export type Colour = 0 | 1 | 2 | 3;
export const COLOURS = ['red', 'amber', 'teal', 'blue'] as const;
/** 0 port, 1 starboard. */
export type Side = 0 | 1;
export const SIDES = ['port', 'starboard'] as const;

export interface Gem { c: Colour; breaker: boolean }
export type Pair = [Gem, Gem];
/** Where a pair goes: the first piece's column, and where the second sits from it (0 above, 1 to
    its right, 2 below, 3 to its left). */
export interface Placement { col: number; rot: number }
export type Grid = (Gem | null)[][];

/** One link of a chain: what popped, and the board just before it did (to show it a link at a time). */
export interface Link {
  /** 1 for the first pop, 2 for what the falling pieces set off after it, and so on. */
  chain: number;
  /** Pieces popped, by colour. */
  broken: number[];
  cells: { r: number; c: number }[];
  before: Grid;
}

/** A pair's landing: every link, and what washed away after. */
export interface Drop { links: Link[]; washed: number }

/** A seeded source of random numbers (mulberry32), so a run can be played again. */
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

export function randomPair(random: () => number): Pair {
  const one = (): Gem => ({ c: Math.floor(random() * 4) as Colour, breaker: random() < OAR_PRESS.BREAKER_ODDS });
  return [one(), one()];
}

const copyGrid = (g: Grid): Grid => g.map((row) => row.slice());
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

/** One board: grid[row][col], row 0 at the foot. */
export class Board {
  grid: Grid;
  /** The pair to place, and the one after it (shown, as the flow brings it). */
  pair: Pair;
  next: Pair;

  constructor(public random: () => number = Math.random) {
    const { W, H } = OAR_PRESS;
    this.grid = Array.from({ length: H }, () => Array<Gem | null>(W).fill(null));
    this.pair = randomPair(random);
    this.next = randomPair(random);
  }

  /** A copy, with its own source for the pairs after next (what a bot imagines). */
  copy(random: () => number = this.random): Board {
    const b = Object.create(Board.prototype) as Board;
    b.grid = copyGrid(this.grid);
    b.pair = this.pair; b.next = this.next; b.random = random;
    return b;
  }

  height(c: number): number {
    let h = 0;
    while (h < OAR_PRESS.H && this.grid[h][c]) h++;
    return h;
  }

  /** Pieces on the board, by colour. */
  counts(): number[] {
    const n = [0, 0, 0, 0];
    for (const row of this.grid) for (const g of row) if (g) n[g.c]++;
    return n;
  }

  /** Every way the pair can go (it can always go somewhere: a stack at the top washes over). */
  placements(): Placement[] {
    const { W, H } = OAR_PRESS, out: Placement[] = [];
    for (let c = 0; c < W; c++) {
      if (this.height(c) <= H - 2) out.push({ col: c, rot: 0 }, { col: c, rot: 2 });
      if (c < W - 1 && this.height(c) < H && this.height(c + 1) < H) out.push({ col: c, rot: 1 });
      if (c > 0 && this.height(c) < H && this.height(c - 1) < H) out.push({ col: c, rot: 3 });
    }
    return out;
  }

  /** Lands the pair (each half falls as far as it can), pops what it sets off, and brings in the next. */
  drop(p: Placement): Drop {
    const { H, W, WASH } = OAR_PRESS;
    const [a, b] = this.pair;
    const land = (g: Gem, c: number) => { const h = this.height(c); if (h < H) this.grid[h][c] = g; };
    if (p.rot === 0) { land(a, p.col); land(b, p.col); }
    else if (p.rot === 2) { land(b, p.col); land(a, p.col); }
    else { land(a, p.col); land(b, p.col + (p.rot === 1 ? 1 : -1)); }
    const links = this.resolve();
    let washed = 0;
    if (this.grid[H - 1].some((g) => g)) {
      for (let r = H - WASH; r < H; r++) for (let c = 0; c < W; c++) if (this.grid[r][c]) { this.grid[r][c] = null; washed++; }
    }
    this.pair = this.next;
    this.next = randomPair(this.random);
    return { links, washed };
  }

  /** Breakers touching their colour pop the whole group; what's above falls, and may set off more. */
  resolve(): Link[] {
    const { H, W } = OAR_PRESS, links: Link[] = [];
    for (let chain = 1; ; chain++) {
      const hit = new Set<number>();
      for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
        const g = this.grid[r][c];
        if (!g?.breaker || hit.has(r * W + c)) continue;
        if (!N4.some(([dr, dc]) => this.grid[r + dr]?.[c + dc]?.c === g.c)) continue;
        const todo = [[r, c]];
        hit.add(r * W + c);
        while (todo.length) {
          const [y, x] = todo.pop()!;
          for (const [dr, dc] of N4) {
            const yy = y + dr, xx = x + dc;
            if (yy < 0 || yy >= H || xx < 0 || xx >= W || hit.has(yy * W + xx) || this.grid[yy][xx]?.c !== g.c) continue;
            hit.add(yy * W + xx); todo.push([yy, xx]);
          }
        }
      }
      if (!hit.size) return links;
      const before = copyGrid(this.grid), broken = [0, 0, 0, 0], cells: Link['cells'] = [];
      for (const k of hit) {
        const r = Math.floor(k / W), c = k % W;
        broken[this.grid[r][c]!.c]++; cells.push({ r, c }); this.grid[r][c] = null;
      }
      for (let c = 0; c < W; c++) {
        let to = 0;
        for (let r = 0; r < H; r++) { const g = this.grid[r][c]; if (g) { this.grid[r][c] = null; this.grid[to++][c] = g; } }
      }
      links.push({ chain, broken, cells, before });
    }
  }
}

/** What one pair (one beat of the flow) did to her. */
export interface Beat {
  drops: Drop[];
  /** How far each oar swung forward from the pops (capped at the catch): the stroke the pop gave. */
  swing: [number, number];
  /** Each oar's drive this beat, in boat lengths. */
  drive: [number, number];
  /** Both sides popped on this pair: a stroke in unison. */
  unison: boolean;
  /** The longest chain on any board. */
  chain: number;
  washed: number;
}

export interface Stats {
  /** Boat lengths rowed, whichever way she was heading. */
  rowed: number;
  pops: number;
  /** Pieces popped. */
  popped: number;
  biggestChain: number;
  /** Chains of three links or more. */
  bigChains: number;
  unisons: number;
  /** Pieces lost to the sea. */
  washed: number;
  /** Beats each oar spent right back, doing nothing. */
  spent: [number, number];
}

/** The puzzle and the boat: one board (solo) or one a side (crew). */
export class OarPress {
  readonly boards: Board[];
  readonly crew: boolean;
  /** Each oar's travel: 0 at the catch, 1 spent. They start at the catch, ready. */
  oar: [number, number] = [0, 0];
  /** Where she is in boat lengths (y up the course, the way she started) and her heading in
      radians (0 up the course, more to starboard). */
  x = 0;
  y = 0;
  heading = 0;
  beats = 0;
  stats: Stats = { rowed: 0, pops: 0, popped: 0, biggestChain: 0, bigChains: 0, unisons: 0, washed: 0, spent: [0, 0] };

  constructor(opts: { crew?: boolean; randoms?: (() => number)[]; seed?: number } = {}) {
    this.crew = !!opts.crew;
    const n = this.crew ? 2 : 1, seed = opts.seed ?? Math.floor(Math.random() * 1e9);
    this.boards = Array.from({ length: n }, (_, i) => new Board(opts.randoms?.[i] ?? seeded(seed + i)));
  }

  /** A copy, for a bot to try a move on. */
  copy(): OarPress {
    const g = Object.create(OarPress.prototype) as OarPress;
    Object.assign(g, this, {
      boards: this.boards.map((b) => b.copy(Math.random)), oar: [...this.oar],
      stats: { ...this.stats, spent: [...this.stats.spent] },
    });
    return g;
  }

  /** Which oar a colour on a board pulls. */
  sideOf(board: number, c: Colour): Side {
    return this.crew ? (board as Side) : c < 2 ? 0 : 1;
  }

  /** Pieces of a side's colours on the board(s): the weight on its oar. */
  weight(side: Side): number {
    let n = 0;
    this.boards.forEach((b, i) => b.counts().forEach((k, c) => { if (this.sideOf(i, c as Colour) === side) n += k; }));
    return n;
  }

  /** How hard an oar drives as the flow sweeps it back: firmer with more weight on it. */
  firmness(side: Side): number {
    const { FIRM_MIN, FIRM_FULL } = OAR_PRESS;
    return FIRM_MIN + (1 - FIRM_MIN) * Math.min(1, this.weight(side) / FIRM_FULL);
  }

  /** Each board's pair placed (one placement a board), then the pops swing the oars forward and
      the flow sweeps them back, driving her. */
  step(ps: Placement[]): Beat {
    const { SWING, CHAIN, FLOW, DRIVE, TURN } = OAR_PRESS;
    const drops = this.boards.map((b, i) => b.drop(ps[i]));
    const freed = [0, 0];
    let chain = 0, washed = 0;
    drops.forEach((d, i) => {
      washed += d.washed;
      chain = Math.max(chain, d.links.length);
      for (const l of d.links) l.broken.forEach((k, c) => { freed[this.sideOf(i, c as Colour)] += k * (1 + CHAIN * (l.chain - 1)); });
      if (d.links.length) {
        this.stats.pops++;
        this.stats.biggestChain = Math.max(this.stats.biggestChain, d.links.length);
        if (d.links.length >= 3) this.stats.bigChains++;
        for (const l of d.links) this.stats.popped += l.broken.reduce((s, k) => s + k, 0);
      }
    });
    const swing: [number, number] = [0, 0], drive: [number, number] = [0, 0];
    for (const s of [0, 1] as Side[]) {
      const was = this.oar[s];
      this.oar[s] = Math.max(0, was - freed[s] * SWING);
      swing[s] = was - this.oar[s];
      const sweep = Math.min(FLOW, 1 - this.oar[s]);
      if (sweep <= 0) this.stats.spent[s]++;
      this.oar[s] += sweep;
      drive[s] = sweep * this.firmness(s) * DRIVE;
    }
    const ahead = (drive[0] + drive[1]) / 2, turn = (drive[0] - drive[1]) * TURN;
    const mid = this.heading + turn / 2;
    this.x += Math.sin(mid) * ahead;
    this.y += Math.cos(mid) * ahead;
    this.heading += turn;
    this.stats.rowed += ahead;
    const unison = freed[0] > 0 && freed[1] > 0;
    if (unison) this.stats.unisons++;
    this.stats.washed += washed;
    this.beats++;
    return { drops, swing, drive, unison, chain, washed };
  }

  /** How straight she's gone: made good up the course for every length rowed (1 dead straight). */
  straightness(): number {
    return this.stats.rowed ? this.y / this.stats.rowed : 1;
  }
}

/** A name for what a beat did, for the page to call out (empty for a plain pair). */
export function callout(b: Beat): string {
  const chain = ['', '', 'Double chain', 'Triple chain', 'Quadruple chain'][b.chain] ?? `${b.chain}-chain`;
  const parts: string[] = [];
  if (b.unison) parts.push('In unison!');
  if (chain) parts.push(chain + '!');
  if (!parts.length && b.drops.some((d) => d.links.length)) {
    const long = Math.max(...b.swing);
    parts.push(long >= 0.6 ? 'Long stroke!' : 'Pop');
  }
  if (b.washed) parts.push('Washed over');
  return parts.join(' ');
}
