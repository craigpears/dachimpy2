/* Foraging, the real puzzle (YPPedia "Foraging", "Official:Foraging", "Jamesh's Ultimate Foraging",
   "Talk:Foraging" and Fullbeard University's two Foraging lessons, read 10 Nov 2026, with the wiki's
   screenshot of a board). TypeScript, compiled to js/foraging.js by `npm run build`; tested in
   tests/foraging.test.ts. It knows nothing of the den: the den deals the board (what's stuck on it,
   how many containers come), and shows what drops out of the bottom.

   Every puzzle stays faithful to the original (RULES.md):
   - The board is 7 wide by 10 high (the screenshot; "the board is 10 blocks tall"), five kinds of
     tile: rock, foliage, wood, sand and soil. Row 0 is the top.
   - The cursor is a loop round a 2x2 square. X (a left click) turns the four counter-clockwise, C (a
     right click) clockwise. It won't turn if a container, a special piece other than the ant, or an
     empty square is in it. Any turn is allowed, one that clears nothing too (it's still a move).
   - Three or more tiles of a kind in a row or a column clear. Everything falls into the gap and new
     tiles come in at the top; anything that lines up then clears too.
   - Containers come in at the top every few moves, forcing their way in over the tiles there (never
     over another container), and sink as the tiles under them clear: a crate (1x1, common), a basket
     (2x2, uncommon) or a chest (3 wide, 2 high, rare). Nothing falls through a container, so a gap
     under one stays empty; it only sinks when every square under it is clear, and when nothing at
     all is left under it, it drops out of the bottom of the board into the hold. At most three on
     the board at once (three crates, two baskets and a crate, or a chest and two crates).
   - The bananas down the side count the containers still to come; when they've all come and gone,
     the board's done.
   - Special pieces come in with the new tiles at the top (they don't force their way in), more of
     them the bigger the clears. Over one (not the ant) the cursor's 1x1, and X or C uses it:
     the machete clears its row to the left (X) or the right (C); the shovel clears its column below
     it; the monkey refills the 5x5 round him with new tiles, holes too; the earthquake shakes the
     board left (X) or right (C). They don't set each other off: a special in the way is wasted.
     Containers are never cleared, only left hanging.
   - The ant is turned with the tiles, and turns with them. Every move it eats the piece in front of
     it and steps into its place; the number on its back is how many more it'll eat. It starves at
     the edge, a hole or a container.
   - Score comes only from containers leaving the board: bigger ones score more, several in one move
     score much more, each one after the first in a move a little more again, and two at once more
     still (see `points`).
   Where the wiki is silent the reading here is the likeliest one, and says so ("A guess"). */

export const W = 7, H = 10, KINDS = 5;
/** The five tiles, as the real board has them. */
export const TILES = ['rock', 'foliage', 'wood', 'sand', 'soil'] as const;

export type Special = 'machete' | 'shovel' | 'monkey' | 'earthquake' | 'ant';
export const SPECIALS: readonly Special[] = ['machete', 'shovel', 'monkey', 'earthquake', 'ant'];
export type Size = 'crate' | 'basket' | 'chest';
/** Each container's size on the board, and what it's worth when it leaves (a guess: by its area,
    "bigger containers score much better than smaller ones do"). */
export const SIZES: Record<Size, { w: number; h: number; value: number }> = {
  crate: { w: 1, h: 1, value: 1 },
  basket: { w: 2, h: 2, value: 4 },
  chest: { w: 3, h: 2, value: 6 },
};
/** At most three containers on the board, and (the wiki's three examples, read as one rule) at most
    nine squares of them: a chest and a basket together never come. */
export const MAX_BOXES = 3, MAX_BOX_SQUARES = 9;

/** Which way an ant faces: up, right, down, left. */
export type Dir = 0 | 1 | 2 | 3;
export const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];

/** A piece. A tile has a kind (0 to 4); a special piece or a container has k -1. An ant faces `dir`
    with `bites` left; a container has a `box` size and fills its squares as one Bit, by its top
    left; `tag` is the dealer's (a capybara, say). `id` follows it about. */
export interface Bit { id: number; k: number; s?: Special; dir?: Dir; bites?: number; box?: Size; tag?: string }

/** How often new pieces at the top come in special: `chance` each, `perExtra` more for every piece
    the move's lines have cleared beyond three, never over `max`; which one by `weights`. (Guesses: the real
    odds aren't published, only that "comboing regular pieces increases yer chance".) */
export interface SpecialOdds { chance: number; perExtra: number; max: number; weights: Record<Special, number> }
export const NO_SPECIALS: SpecialOdds = { chance: 0, perExtra: 0, max: 0, weights: { machete: 1, shovel: 1, monkey: 1, earthquake: 1, ant: 1 } };
export const SPECIAL_ODDS: SpecialOdds = { chance: 0.015, perExtra: 0.03, max: 0.35, weights: { machete: 1, shovel: 1, monkey: 1, earthquake: 1, ant: 1 } };

/** A container dealt onto the board at the start, its top left at (r, c). */
export interface Placed { size: Size; r: number; c: number; tag?: string }

export interface Deal {
  random?: () => number;
  /** Containers still to come in (the bananas). 0 for a board that's only what's dealt; Infinity to
      play on. */
  bananas?: number;
  /** How likely each size is to come (relative). */
  sizes?: Record<Size, number>;
  /** Moves between one container coming in and the next being due, at least and at most (a guess:
      "it usually only takes 5-10 moves to bring another crate onto the board"). */
  every?: [number, number];
  /** Moves before the first one's due: 0 and it's there at the start. */
  first?: number;
  /** The tag every container that comes in carries. */
  tag?: string;
  /** Containers on the board from the start. */
  start?: Placed[];
  specials?: SpecialOdds;
  /** How much a new ant can eat, at least and at most (a guess; the wiki's ant shows a 7). */
  ant?: [number, number];
}

/** A container that dropped out of the bottom: `drop` counts the drops in its move from 0 (two in
    the same drop left together). */
export interface Left { id: number; size: Size; tag?: string; drop: number }

/** One step of a move as it's seen: what went, what dropped out of the bottom, then the board. */
export interface Stage { what: 'turn' | 'use' | 'clear' | 'fall' | 'bite' | 'enter'; cleared: number[]; left: number[]; grid: (Bit | null)[][] }

export type Action = 'turn' | Exclude<Special, 'ant'>;
/** What a move did. */
export interface Move {
  /** False when nothing happened (the cursor's on something that won't turn, it's over). */
  moved: boolean;
  action?: Action;
  /** The lines that cleared, each one's length, the cascade's included. */
  lines: number[];
  /** Tiles cleared by lines. */
  tiles: number;
  /** Pieces the ants ate. */
  bites: number;
  left: Left[];
  /** A container that came in after it, by id. */
  entered: number | null;
  points: number;
  stages: Stage[];
}

/** What the cursor's on: a 2x2 square by its top left, or one special piece. */
export interface Selection { one: boolean; r: number; c: number }

/** A move's score (the real formula isn't published): each container is worth its size's value,
    times its place among the drops of the move (the first drop 1, the next 2...: "each successive
    container cleared seems to get an increasing multiplier"), times how many dropped out together
    ("clearing more than one container in a single move scores much more"). */
export function points(left: { size: Size; drop: number }[]): number {
  const together = new Map<number, number>();
  for (const l of left) together.set(l.drop, (together.get(l.drop) ?? 0) + 1);
  const drops = [...together.keys()].sort((a, b) => a - b);
  return left.reduce((sum, l) => sum + SIZES[l.size].value * (drops.indexOf(l.drop) + 1) * together.get(l.drop)!, 0);
}

/** A seeded source of numbers in [0, 1) (mulberry32), so a board can be dealt again. */
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

const isTile = (b: Bit | null | undefined): b is Bit => !!b && b.k >= 0;
const key = (r: number, c: number) => r * W + c;
const inside = (r: number, c: number) => r >= 0 && r < H && c >= 0 && c < W;

/** How pieces fall as a board's drawn (js/den/foraging.js): all on one clock, so what falls together
    stays in step (a container among its tiles, the new tiles over them), each stopping where it
    lands: gathering speed at `A` squares a second a second, up to `V` squares a second, never
    bouncing. Slow enough to watch. (The user, 10 Nov, of the capybara dropping out of the bottom:
    "why is it so out of sync with the pieces? And it looks very jittery ... I think the animation's
    too fast and it just goes up and down like ding, ding, ding, ding." Till then each piece was
    stepped along at 9 squares a second, and a container leaving at 7 on a clock of its own.) */
export const FALL = { A: 16, V: 5.5 };
/** How far (squares) anything falling has fallen, `t` seconds after the stage starts. */
export function fallen(t: number): number {
  if (t <= 0) return 0;
  const tv = FALL.V / FALL.A;   // (when it reaches full speed)
  return t <= tv ? FALL.A * t * t / 2 : FALL.V * tv / 2 + FALL.V * (t - tv);
}
/** Seconds to fall `d` squares. */
export function fallTime(d: number): number {
  if (d <= 0) return 0;
  const tv = FALL.V / FALL.A, dv = FALL.V * tv / 2;
  return d <= dv ? Math.sqrt(2 * d / FALL.A) : tv + (d - dv) / FALL.V;
}

export class Forage {
  /** grid[row][col], row 0 at the top. */
  grid: (Bit | null)[][] = [];
  /** The cursor: a square. The 2x2 it turns has that square at its top left (kept on the board). */
  cur = { r: 4, c: 2 };
  bananas: number;
  /** The size of the next container to come, once it's chosen (it waits its turn for room). */
  next: Size | null = null;
  /** Moves made, containers that have left, and the score. */
  moves = 0;
  boxes = 0;
  score = 0;
  readonly random: () => number;
  readonly sizes: Record<Size, number>;
  readonly every: [number, number];
  readonly tag?: string;
  readonly specials: SpecialOdds;
  readonly ant: [number, number];
  /** The move the next container's due on. */
  due: number;
  private nextId = 1;
  /** Tiles cleared by lines so far in the move under way (more specials come the more there are:
      "clearing more of the puzzle pieces in combos"; what a special clears doesn't count). */
  private clearedThisMove = 0;

  constructor(deal: Deal = {}) {
    this.random = deal.random ?? Math.random;
    this.bananas = deal.bananas ?? 7;
    this.sizes = deal.sizes ?? { crate: 6, basket: 3, chest: 1 };
    this.every = deal.every ?? [3, 7];
    this.tag = deal.tag;
    this.specials = deal.specials ?? SPECIAL_ODDS;
    this.ant = deal.ant ?? [3, 7];
    this.fill();
    for (const p of deal.start ?? []) this.place(p.size, p.r, p.c, p.tag);
    this.due = deal.first ?? 0;
    this.enter();
  }

  /** A fresh board of tiles with nothing lined up. */
  fill(): void {
    this.grid = Array.from({ length: H }, () => Array<Bit | null>(W).fill(null));
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      let k: number;
      do k = Math.floor(this.random() * KINDS);
      while ((c >= 2 && this.kindAt(r, c - 1) === k && this.kindAt(r, c - 2) === k) || (r >= 2 && this.kindAt(r - 1, c) === k && this.kindAt(r - 2, c) === k));
      this.grid[r][c] = { id: this.nextId++, k };
    }
  }

  /** Put a container on the board with its top left at (r, c), over whatever tiles are there. */
  place(size: Size, r: number, c: number, tag?: string): Bit {
    const { w, h } = SIZES[size], bit: Bit = { id: this.nextId++, k: -1, box: size };
    if (tag !== undefined) bit.tag = tag;
    for (let rr = r; rr < r + h; rr++) for (let cc = c; cc < c + w; cc++) this.grid[rr][cc] = bit;
    return bit;
  }

  private kindAt(r: number, c: number): number {
    const b = this.grid[r]?.[c];
    return isTile(b) ? b.k : -1;
  }

  /** Every container on the board, by its top left square. */
  containers(): { bit: Bit; r: number; c: number }[] {
    const out: { bit: Bit; r: number; c: number }[] = [], seen = new Set<number>();
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const b = this.grid[r][c];
      if (b?.box && !seen.has(b.id)) { seen.add(b.id); out.push({ bit: b, r, c }); }
    }
    return out;
  }

  /** Containers still to come: the empty bananas. */
  get toCome(): number { return this.bananas + (this.next ? 1 : 0); }

  /** All the containers have come and gone. */
  get over(): boolean {
    return this.bananas <= 0 && !this.next && !this.containers().length;
  }

  // ---------- the cursor ----------
  /** What the cursor's on: one special piece (not an ant) if it's on one, else the 2x2 square. */
  selection(): Selection {
    const { r, c } = this.cur, b = this.grid[r]?.[c];
    if (b?.s && b.s !== 'ant') return { one: true, r, c };
    return { one: false, r: Math.min(r, H - 2), c: Math.min(c, W - 2) };
  }
  /** The arrow keys: a square at a time, anywhere on the board. */
  step(dr: number, dc: number): void {
    this.cur.r = Math.max(0, Math.min(H - 1, this.cur.r + dr));
    this.cur.c = Math.max(0, Math.min(W - 1, this.cur.c + dc));
  }
  /** The mouse, at (x, y) in squares from the board's top left corner: over a special piece (not
      an ant) it's on that piece; otherwise the 2x2 round the corner nearest the pointer. */
  point(x: number, y: number): void {
    const r = Math.floor(y), c = Math.floor(x), b = inside(r, c) ? this.grid[r][c] : null;
    if (b?.s && b.s !== 'ant') { this.cur = { r, c }; return; }
    this.cur = { r: Math.max(0, Math.min(H - 2, Math.round(y) - 1)), c: Math.max(0, Math.min(W - 2, Math.round(x) - 1)) };
  }
  /** Whether the 2x2 at (r, c) will turn: four tiles or ants, nothing else. */
  canTurn(r: number, c: number): boolean {
    if (r < 0 || c < 0 || r > H - 2 || c > W - 2) return false;
    return [[r, c], [r, c + 1], [r + 1, c], [r + 1, c + 1]].every(([rr, cc]) => {
      const b = this.grid[rr][cc];
      return !!b && !b.box && (!b.s || b.s === 'ant');
    });
  }

  // ---------- moves ----------
  /** X or a left click (`cw` false): turn counter-clockwise, or a machete or earthquake to the left.
      C or a right click (`cw` true): clockwise, or to the right. A shovel or monkey either way. */
  press(cw: boolean): Move {
    const sel = this.selection();
    if (!sel.one) return this.turn(sel.r, sel.c, cw);
    return this.use(sel.r, sel.c, cw);
  }

  private blank(): Move {
    return { moved: false, lines: [], tiles: 0, bites: 0, left: [], entered: null, points: 0, stages: [] };
  }

  /** Turn the 2x2 with its top left at (r, c), clockwise or not. An ant in it turns with it. */
  turn(r: number, c: number, cw: boolean): Move {
    const res = this.blank();
    if (this.over || !this.canTurn(r, c)) return res;
    const ants = this.antIds();
    const g = this.grid, tl = g[r][c], tr = g[r][c + 1], br = g[r + 1][c + 1], bl = g[r + 1][c];
    if (cw) { g[r][c + 1] = tl; g[r + 1][c + 1] = tr; g[r + 1][c] = br; g[r][c] = bl; }
    else { g[r][c] = tr; g[r][c + 1] = br; g[r + 1][c + 1] = bl; g[r + 1][c] = tl; }
    for (const b of [tl, tr, br, bl]) if (b!.s === 'ant') b!.dir = (((b!.dir ?? 2) + (cw ? 1 : 3)) % 4) as Dir;
    res.moved = true;
    res.action = 'turn';
    res.stages.push({ what: 'turn', cleared: [], left: [], grid: this.snap() });
    return this.finish(res, ants);
  }

  /** Use the special piece at (r, c): `right` for C (a machete or earthquake to the right). */
  use(r: number, c: number, right: boolean): Move {
    const res = this.blank(), b = this.grid[r]?.[c];
    if (this.over || !b?.s || b.s === 'ant') return res;
    const ants = this.antIds(), gone: number[] = [], g = this.grid;
    const take = (rr: number, cc: number) => { const x = g[rr][cc]; if (x && !x.box) { gone.push(x.id); g[rr][cc] = null; } };
    if (b.s === 'machete') {
      // Its row, to the edge on that side; containers in the way are passed by.
      take(r, c);
      for (let cc = c + (right ? 1 : -1); cc >= 0 && cc < W; cc += right ? 1 : -1) take(r, cc);
    } else if (b.s === 'shovel') {
      // Its column, down to the bottom; "a forageable item will be ignored".
      for (let rr = r; rr < H; rr++) take(rr, c);
    } else if (b.s === 'monkey') {
      // The 5x5 round him (himself too, and its holes) gets new tiles; specials there are lost,
      // containers aren't touched. The new tiles are only tiles (a guess).
      for (let rr = r - 2; rr <= r + 2; rr++) for (let cc = c - 2; cc <= c + 2; cc++) {
        if (!inside(rr, cc) || g[rr][cc]?.box) continue;
        take(rr, cc);
        g[rr][cc] = { id: this.nextId++, k: Math.floor(this.random() * KINDS) };
      }
    } else {
      take(r, c);
      gone.push(...this.quake(right ? 1 : -1));
    }
    res.moved = true;
    res.action = b.s;
    res.stages.push({ what: 'use', cleared: gone, left: [], grid: this.snap() });
    return this.finish(res, ants);
  }

  /* The earthquake, one way (-1 left, 1 right). A guess pieced together from the wiki: "tiles shift
     one place to the left or right"; "the tiles seem to shift as far as they need to in order to
     close a gap"; "if there's a chest on the down-stream edge of the board, the tiles in that row
     won't move at all"; and the official page, "used to get yer crates away from the sides". So,
     row by row: a row with a container at the downstream edge stays as it is (and so does every
     other row that container, or one it's tied to, spans). A full row shifts one place, containers
     with it (only if every row they span shifts too), and the tile pushed off the far edge is lost.
     A row with a gap in it closes up toward that side, its containers staying put as walls.
     Returns the ids of the tiles shaken off. */
  private quake(d: 1 | -1): number[] {
    const g = this.grid, edge = d > 0 ? W - 1 : 0, boxes = this.containers();
    const span = (x: { bit: Bit; r: number }) => Array.from({ length: SIZES[x.bit.box!].h }, (_, i) => x.r + i);
    const blocked = new Set<number>();
    for (let r = 0; r < H; r++) if (g[r][edge]?.box) blocked.add(r);
    for (let grew = true; grew;) {
      grew = false;
      for (const x of boxes) if (span(x).some((r) => blocked.has(r))) for (const r of span(x)) if (!blocked.has(r)) { blocked.add(r); grew = true; }
    }
    const full = (r: number) => !blocked.has(r) && g[r].every((b) => !!b);
    const moving = new Set(boxes.filter((x) => span(x).every(full)).map((x) => x.bit.id));
    const shifts = (r: number) => full(r) && g[r].every((b) => !b?.box || moving.has(b.id));
    for (let shrank = true; shrank;) {
      shrank = false;
      for (const x of boxes) if (moving.has(x.bit.id) && !span(x).every(shifts)) { moving.delete(x.bit.id); shrank = true; }
    }
    const lost: number[] = [];
    for (let r = 0; r < H; r++) {
      if (blocked.has(r)) continue;
      const row = g[r];
      if (shifts(r)) {
        const off = row[edge]!;
        if (!off.box) lost.push(off.id);
        const next = Array<Bit | null>(W).fill(null);
        for (let c = 0; c < W; c++) if (c + d >= 0 && c + d < W) next[c + d] = row[c];
        g[r] = next;
        continue;
      }
      // Close up toward d, between the containers.
      const next = row.slice();
      let wall = d > 0 ? W : -1;
      for (let c = d > 0 ? W - 1 : 0; c >= -1 && c <= W; c -= d) {
        if (c < 0 || c >= W || row[c]?.box) {
          // The stretch between this wall and the last: its pieces packed against the last one.
          const lo = Math.min(c, wall) + 1, hi = Math.max(c, wall) - 1;
          const bits = row.slice(lo, hi + 1).filter((b) => !!b);
          if (d > 0) bits.reverse();
          for (let i = lo; i <= hi; i++) next[i] = null;
          bits.forEach((b, i) => { next[d > 0 ? hi - i : lo + i] = b; });
          wall = c;
        }
      }
      g[r] = next;
    }
    return lost;
  }

  private antIds(): Set<number> {
    const out = new Set<number>();
    for (const row of this.grid) for (const b of row) if (b?.s === 'ant') out.add(b.id);
    return out;
  }

  /** After the player's action: clear and settle, the ants eat, settle again, then a container comes
      in if one's due and there's room. */
  private finish(res: Move, ants: Set<number>): Move {
    this.moves++;
    let drop = 0;
    drop = this.resolve(res, drop);
    // Each ant that was on the board before the move eats one piece (oldest first).
    const bitten: number[] = [];
    for (const id of [...ants].sort((a, b) => a - b)) {
      const at = this.find(id);
      if (!at) continue;
      const ant = this.grid[at.r][at.c]!, dir = ant.dir ?? 2, r = at.r + DR[dir], c = at.c + DC[dir];
      const food = inside(r, c) ? this.grid[r][c] : null;
      this.grid[at.r][at.c] = null;
      if (!food || food.box) { bitten.push(ant.id); continue; }   // starved: the edge, a hole or a container
      bitten.push(food.id);
      res.bites++;
      ant.bites = (ant.bites ?? 1) - 1;
      this.grid[r][c] = ant.bites > 0 ? ant : null;
      if (ant.bites <= 0) bitten.push(ant.id);
    }
    if (bitten.length) {
      res.stages.push({ what: 'bite', cleared: bitten, left: [], grid: this.snap() });
      drop = this.resolve(res, drop);
    }
    // A container comes in, if one's due and there's room for it.
    if (this.moves >= this.due) {
      const bit = this.enter();
      if (bit) {
        res.entered = bit.id;
        res.stages.push({ what: 'enter', cleared: this.displaced, left: [], grid: this.snap() });
        drop = this.resolve(res, drop);
      }
    }
    res.points = points(res.left);
    this.score += res.points;
    this.boxes += res.left.length;
    this.clearedThisMove = 0;
    return res;
  }

  private find(id: number): { r: number; c: number } | null {
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (this.grid[r][c]?.id === id) return { r, c };
    return null;
  }

  /** Settle, then clear what's lined up, and again, till nothing more clears. Returns the next drop. */
  private resolve(res: Move, drop: number): number {
    for (;;) {
      drop = this.settle(res, drop);
      const ls = this.lines();
      if (!ls.length) return drop;
      const gone = new Set<number>(), ids: number[] = [];
      for (const l of ls) {
        res.lines.push(l.n);
        for (const [r, c] of l.cells) gone.add(key(r, c));
      }
      for (const kk of gone) {
        const r = Math.floor(kk / W), c = kk % W;
        ids.push(this.grid[r][c]!.id);
        this.grid[r][c] = null;
      }
      res.tiles += gone.size;
      this.clearedThisMove += gone.size;
      res.stages.push({ what: 'clear', cleared: ids, left: [], grid: this.snap() });
    }
  }

  /** Every line of three or more tiles of a kind lined up now: its squares and its length. */
  lines(): { cells: [number, number][]; n: number }[] {
    const out: { cells: [number, number][]; n: number }[] = [];
    const scan = (n: number, m: number, at: (i: number, j: number) => [number, number]) => {
      for (let i = 0; i < n; i++) {
        let cur: [number, number][] = [];
        const run = () => { if (cur.length >= 3) out.push({ cells: cur, n: cur.length }); };
        for (let j = 0; j < m; j++) {
          const [r, c] = at(i, j), k = this.kindAt(r, c);
          if (cur.length && k >= 0 && k === this.kindAt(cur[0][0], cur[0][1])) cur.push([r, c]);
          else { run(); cur = k >= 0 ? [[r, c]] : []; }
        }
        run();
      }
    };
    scan(H, W, (r, c) => [r, c]);
    scan(W, H, (c, r) => [r, c]);
    return out;
  }

  /* Everything falls a row at a time, all together: a piece falls if every square under it is empty
     or falling too. A container with nothing at all under it (it's on the bottom edge) drops out.
     Then new pieces come in at the top of each column, down to the first thing in it; a gap held
     under a container stays empty. One stage for the lot; the drops are numbered as they go. */
  private settle(res: Move, drop: number): number {
    const left: number[] = [];
    let changed = false;
    for (;;) {
      const g = this.grid, falls = new Set<number>(), out: Bit[] = [];
      for (let r = H - 1; r >= 0; r--) for (let c = 0; c < W; c++) {
        const b = g[r][c];
        if (!b || falls.has(b.id)) continue;
        if (b.box) {
          const { w, h } = SIZES[b.box];
          if (g[r - (h - 1)]?.[c] !== b || g[r][c - 1] === b) continue;   // only at its bottom left
          if (r === H - 1) { out.push(b); continue; }
          let free = true;
          for (let cc = c; cc < c + w; cc++) { const u = g[r + 1][cc]; if (u && !falls.has(u.id)) free = false; }
          if (free) falls.add(b.id);
          continue;
        }
        if (r < H - 1 && (!g[r + 1][c] || falls.has(g[r + 1][c]!.id))) falls.add(b.id);
      }
      if (!falls.size && !out.length) break;
      changed = true;
      for (const b of out) {
        for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (g[r][c] === b) g[r][c] = null;
        res.left.push({ id: b.id, size: b.box!, ...(b.tag !== undefined ? { tag: b.tag } : {}), drop });
        left.push(b.id);
      }
      if (out.length) drop++;
      const next = g.map((row) => row.map((b) => (b && falls.has(b.id) ? null : b)));
      for (let r = 0; r < H - 1; r++) for (let c = 0; c < W; c++) { const b = g[r][c]; if (b && falls.has(b.id)) next[r + 1][c] = b; }
      this.grid = next;
    }
    // New pieces in at the top of each column.
    for (let c = 0; c < W; c++) for (let r = 0; r < H && !this.grid[r][c]; r++) { this.grid[r][c] = this.fresh(); changed = true; }
    if (changed) res.stages.push({ what: 'fall', cleared: [], left, grid: this.snap() });
    return drop;
  }

  /** A new piece coming in at the top: now and then a special one, more the more the move's cleared. */
  private fresh(): Bit {
    const o = this.specials, p = Math.min(o.max, o.chance + o.perExtra * Math.max(0, this.clearedThisMove - 3));
    if (p > 0 && this.random() < p) {
      const total = SPECIALS.reduce((a, s) => a + o.weights[s], 0);
      let x = this.random() * total, s: Special = SPECIALS[SPECIALS.length - 1];
      for (const t of SPECIALS) { if ((x -= o.weights[t]) < 0) { s = t; break; } }
      if (s === 'ant') {
        const [lo, hi] = this.ant;
        return { id: this.nextId++, k: -1, s, dir: Math.floor(this.random() * 4) as Dir, bites: lo + Math.floor(this.random() * (hi - lo + 1)) };
      }
      return { id: this.nextId++, k: -1, s };
    }
    return { id: this.nextId++, k: Math.floor(this.random() * KINDS) };
  }

  /** The ids a container coming in pushed off the board, for the stage that shows it. */
  private displaced: number[] = [];

  /** Bring the next container in at the top, if there are bananas left and room: no more than three
      on the board, nine squares of them, and a place along the top with no container in it.
      ("If there is a chest on the board, and the next container spawned to enter is a basket, it
      will not appear until the chest is removed, but once that happens it will appear
      immediately.") Then the next one's due a few moves on. */
  private enter(): Bit | null {
    this.displaced = [];
    if (!this.next) {
      if (this.bananas <= 0) return null;
      const t = this.sizes.crate + this.sizes.basket + this.sizes.chest;
      let x = this.random() * t;
      this.next = (x -= this.sizes.crate) < 0 ? 'crate' : (x -= this.sizes.basket) < 0 ? 'basket' : 'chest';
      this.bananas--;
    }
    if (this.moves < this.due) return null;
    const on = this.containers(), { w, h } = SIZES[this.next];
    const squares = on.reduce((a, x) => a + SIZES[x.bit.box!].w * SIZES[x.bit.box!].h, 0);
    if (on.length >= MAX_BOXES || squares + w * h > MAX_BOX_SQUARES) return null;
    const room: number[] = [];
    for (let c = 0; c + w <= W; c++) {
      let ok = true;
      for (let r = 0; r < h; r++) for (let cc = c; cc < c + w; cc++) if (this.grid[r][cc]?.box) ok = false;
      if (ok) room.push(c);
    }
    if (!room.length) return null;
    const c = room[Math.floor(this.random() * room.length)];
    for (let r = 0; r < h; r++) for (let cc = c; cc < c + w; cc++) { const b = this.grid[r][cc]; if (b) this.displaced.push(b.id); }
    const bit = this.place(this.next, 0, c, this.tag);
    this.next = null;
    const [lo, hi] = this.every;
    this.due = this.moves + lo + Math.floor(this.random() * (hi - lo + 1));
    return bit;
  }

  snap(): (Bit | null)[][] { return this.grid.map((row) => row.slice()); }
}
