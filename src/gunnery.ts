/* Gunnery, the puzzle itself: one copy of it, knowing nothing of the den. TypeScript, compiled to
   js/gunnery.js; tested in tests/gunnery.test.ts. Whoever plays it wraps it in their own look: the
   gun tower (js/den/gundeck.js) and the sloop's deck at sea (js/den/sea-guns.js) both drive this.

   The user (10 Nov): "there should be one copy of the gunning puzzle. We should not be having
   different copies, one for the ship, one for the deck in the den ... there can be a few wrappers
   with some of the different visual elements around it, but the core puzzle should be more or less
   the same, as in code-wise."

   The rules, kept as close to Puzzle Pirates' Gunnery as we can (RULES.md, "The gun tower"):
   - A powder barrel in the middle rolls out the stores (powder, wad, shot and buckets), each way
     round in turn, till there are two of each on deck. Use one and another comes out.
   - A store rolls straight on. Blocked (a crate, a gun, the barrel, the board's edge, a pirate
     standing there), it turns right; left if it can't; back if neither. Two that meet both turn back.
   - Chalk arrows steer them: a store rolling onto one turns the way it points. Three each; chalk a
     fourth and your oldest is rubbed out.
   - Four guns lie across the deck, two down each side, muzzle out, with a lane between the muzzle
     and the edge. Stores go in at the muzzle, and only off an arrow in the lane pointing into it;
     otherwise the gun's just in the way. Powder, wad, then shot. Fired, it wants a bucket to swab
     it; the wrong store fouls it, and a bucket cleans that too.
   - Crates lashed about the deck make the board: the middle round the barrel kept clear, more out
     towards the edges, never side by side, making pockets and loops; of the boards tried, the one
     where about two guns sit on a loop of their own, as on a good Gunnery board. */

/** The stores the barrel rolls out. */
export type Store = 'powder' | 'wad' | 'shot' | 'bucket';
export const KINDS: Store[] = ['powder', 'wad', 'shot', 'bucket'];
/** A gun: empty, part loaded, loaded, fired (it wants swabbing), or fouled (it wants swabbing too). */
export type GunState = 'empty' | 'powder' | 'wad' | 'loaded' | 'dirty' | 'fouled';
/** The four ways, by number: north (row 0's way), east, south, west. */
export const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];

export const GUNNERY = {
  /** The board, 13 by 13, the barrel in the middle. */
  COLS: 13,
  ROWS: 13,
  /** Seconds a store takes to roll a square: the puzzle's beat. */
  TICK: 0.36,
  /** Stores of each kind on deck at once. */
  EACH: 2,
  /** Seconds between stores rolling out of the barrel. */
  EMIT: 0.7,
  /** Arrows each pirate can have chalked. */
  ARROWS: 3,
  /** Crates lashed about the deck. */
  CRATES: 16,
  /** Each gun: the lane square in front of its muzzle, and the way it faces (out). It lies on the
      three squares in from there. Two down the left side, then two down the right. */
  GUNS: [{ port: [3, 0], d: 3 }, { port: [9, 0], d: 3 }, { port: [3, 12], d: 1 }, { port: [9, 12], d: 1 }] as { port: [number, number]; d: number }[],
};

export const k = (r: number, c: number) => `${r},${c}`;

export interface Gun {
  port: [number, number];
  d: number;
  state: GunState;
  /** Run out over its lane (it blocks the lane while it is). */
  inLane: boolean;
}
/** A store on deck: where it is, the way it's rolling, where it was a beat ago, and (if it was
    turned back) the way it bumped. */
export interface Bit { id: number; kind: Store; r: number; c: number; dir: number; pr: number; pc: number; bump: number | null; bumpA?: number }
/** A chalked arrow: who chalked it, and when (the oldest goes first). */
export interface Arrow { r: number; c: number; dir: number; by: string | number; t: number }

/** A gun's squares, counted in from the edge: 0 is the lane in front of its muzzle, where stores go
    in; it lies on 1-3, muzzle on 1. */
export const gunSq = (g: { port: [number, number]; d: number }, i: number): [number, number] => [g.port[0] - DR[g.d] * i, g.port[1] - DC[g.d] * i];
/** The way an arrow in a gun's lane points to load it. */
export const gunMouth = (g: { d: number }) => (g.d + 2) % 4;

/** Gunnery's loading: powder, then the wad, then the shot; a bucket swabs a gun out (fired, fouled,
    or part loaded, it's empty again); any other store out of turn fouls it. A loaded gun takes
    nothing more (stores roll past it). */
export function loadWith(state: GunState, store: Store): GunState {
  if (state === 'loaded') return state;
  if (store === 'bucket') return 'empty';
  const next = ({ empty: 'powder', powder: 'wad', wad: 'shot' } as Partial<Record<GunState, Store>>)[state];
  if (store !== next) return 'fouled';
  return store === 'shot' ? 'loaded' : store;
}

/** What a beat did: stores rolled into guns (and what each gun was), the stores gone into them, and
    any that rolled out of the barrel. */
export interface Beat { loads: { gun: Gun; store: Store; was: GunState }[]; gone: Bit[]; added: Bit[] }

export class Gunnery {
  /** The squares of deck (a gun tower's may be cut short at its corners). */
  readonly cells: Set<string>;
  readonly barrel: [number, number];
  readonly guns: Gun[];
  /** The squares the guns lie on. */
  readonly gunSet: Set<string>;
  crates: [number, number][] = [];
  crateSet = new Set<string>();
  stores: Bit[] = [];
  arrows = new Map<string, Arrow>();
  emitT = 0.4;
  dirI = 0;
  seq = 0;
  private rand: () => number;

  /** A board of these squares (all of a 13 by 13 by default), its guns as GUNNERY.GUNS, the barrel
      on the square nearest the middle. No crates till they're set (setCrates, pickCrates). */
  constructor(cells: Iterable<string> | null = null, rand: () => number = Math.random) {
    this.rand = rand;
    const all: string[] = [];
    for (let r = 0; r < GUNNERY.ROWS; r++) for (let c = 0; c < GUNNERY.COLS; c++) all.push(k(r, c));
    this.cells = new Set(cells ?? all);
    const mid = [(GUNNERY.ROWS - 1) / 2, (GUNNERY.COLS - 1) / 2];
    const near = [...this.cells].map((s) => s.split(',').map(Number) as [number, number])
      .sort((a, b) => Math.hypot(a[0] - mid[0], a[1] - mid[1]) - Math.hypot(b[0] - mid[0], b[1] - mid[1]));
    this.barrel = near[0];
    this.guns = GUNNERY.GUNS.map(({ port, d }) => ({ port: [port[0], port[1]], d, state: 'empty' as GunState, inLane: false }));
    this.gunSet = new Set(this.guns.flatMap((g) => [1, 2, 3].map((i) => k(...gunSq(g, i)))));
  }

  isBarrel(r: number, c: number): boolean { return this.barrel[0] === r && this.barrel[1] === c; }
  /** A crate, the barrel or a gun: where you can't walk or chalk, and stores can't roll. */
  solid(r: number, c: number): boolean { return this.isBarrel(r, c) || this.crateSet.has(k(r, c)) || this.gunSet.has(k(r, c)); }
  /** Where a store can't roll: off the deck, anything solid, a body standing there, a gun run out
      over its lane. */
  blocked(r: number, c: number, bodies: Set<string> = new Set()): boolean {
    return !this.cells.has(k(r, c)) || this.solid(r, c) || bodies.has(k(r, c)) || this.guns.some((g) => g.inLane && g.port[0] === r && g.port[1] === c);
  }
  storeAt(r: number, c: number): boolean { return this.stores.some((o) => o.r === r && o.c === c); }

  /** A beat of the puzzle: every store rolls a square (or is turned back), stores rolled in at a
      gun's muzzle load it, and the barrel rolls out another of whatever's short. `bodies`: squares
      with a pirate standing on them. */
  tick(bodies: Set<string> = new Set()): Beat {
    const out: Beat = { loads: [], gone: [], added: [] };
    const blocked = (r: number, c: number) => this.blocked(r, c, bodies);
    // Where each store wants to go.
    const want = this.stores.map((s) => {
      const a = this.arrows.get(k(s.r, s.c));
      if (a) {
        s.dir = a.dir;
        // Into a gun: only off an arrow in its lane pointing into the muzzle.
        const g = this.guns.find((o) => k(...gunSq(o, 0)) === k(s.r, s.c) && a.dir === gunMouth(o));
        if (g && g.state !== 'loaded') return { d: a.dir, r: s.r + DR[a.dir], c: s.c + DC[a.dir], gun: g };
      }
      for (const t of [0, 1, 3, 2]) {
        const d = (s.dir + t) % 4, r = s.r + DR[d], c = s.c + DC[d];
        if (!blocked(r, c)) return { d, r, c, gun: null as Gun | null };
      }
      return null;
    });
    // Two that would meet, or swap places, both turn back; one rolling into a store that's staying
    // put turns back too.
    const back = new Set<number>();
    for (let i = 0; i < want.length; i++) for (let j = i + 1; j < want.length; j++) {
      const a = want[i], b = want[j], s = this.stores[i], o = this.stores[j];
      if (!a || !b) continue;
      if ((a.r === b.r && a.c === b.c) || (a.r === o.r && a.c === o.c && b.r === s.r && b.c === s.c)) { back.add(i); back.add(j); }
    }
    for (let pass = 0; pass < 4; pass++) this.stores.forEach((s, i) => {
      const w = want[i];
      if (!w || back.has(i)) return;
      const j = this.stores.findIndex((o) => o.r === w.r && o.c === w.c);
      if (j >= 0 && (!want[j] || back.has(j))) back.add(i);
    });
    this.stores.forEach((s, i) => {
      s.pr = s.r; s.pc = s.c; s.bump = null;
      const w = want[i];
      if (!w) return;
      // Turned back: it bumps up against what's there and bounces off, rather than stopping dead.
      if (back.has(i)) { s.bump = w.d; s.bumpA = this.stores.some((o) => o.r === w.r && o.c === w.c) ? 0.12 : 0.34; s.dir = (w.d + 2) % 4; return; }
      s.r = w.r; s.c = w.c; s.dir = w.d;
      if (w.gun) { out.loads.push({ gun: w.gun, store: s.kind, was: this.load(w.gun, s.kind) }); out.gone.push(s); }
    });
    this.stores = this.stores.filter((s) => !out.gone.includes(s));
    // The barrel rolls out another of whatever's short, each way round in turn.
    this.emitT -= GUNNERY.TICK;
    const short = KINDS.filter((kd) => this.stores.filter((s) => s.kind === kd).length < GUNNERY.EACH);
    if (this.emitT <= 0 && short.length) {
      for (let t = 0; t < 4; t++) {
        const d = this.dirI++ % 4, r = this.barrel[0] + DR[d], c = this.barrel[1] + DC[d];
        if (blocked(r, c) || this.storeAt(r, c)) continue;
        out.added.push(this.addStore(++this.seq, short[Math.floor(this.rand() * short.length)], r, c, d, this.barrel[0], this.barrel[1]));
        this.emitT = GUNNERY.EMIT;
        break;
      }
    }
    return out;
  }

  addStore(id: number, kind: Store, r: number, c: number, dir: number, pr = r, pc = c): Bit {
    const s: Bit = { id, kind, r, c, dir, pr, pc, bump: null };
    this.stores.push(s);
    return s;
  }

  /** A store rolled into a gun's muzzle: what the gun was. */
  load(g: Gun, store: Store): GunState {
    const was = g.state;
    g.state = loadWith(was, store);
    return was;
  }
  /** A gun fired: it wants a bucket now. */
  fired(g: Gun) { g.state = 'dirty'; }

  // ----- chalking -----
  canChalk(r: number, c: number): boolean { return this.cells.has(k(r, c)) && !this.solid(r, c); }
  myArrows(by: string | number): Arrow[] { return [...this.arrows.values()].filter((a) => a.by === by); }
  /** Chalk an arrow (dir 0-3) on a plank: where one is, it turns to point your way, and chalking the
      same way again rubs it out (dir -1 rubs out whatever's there). Chalk more than your share and
      your oldest goes. False if that plank can't be chalked. */
  chalk(r: number, c: number, dir: number, by: string | number, t = 0): boolean {
    if (!this.canChalk(r, c)) return false;
    const kk = k(r, c), old = this.arrows.get(kk);
    if (old) { this.arrows.delete(kk); if (dir < 0 || (old.dir === dir && old.by === by)) return true; }
    if (dir < 0) return true;
    const mine = this.myArrows(by).sort((a, b) => a.t - b.t);
    while (mine.length >= GUNNERY.ARROWS) { const o = mine.shift()!; this.arrows.delete(k(o.r, o.c)); }
    this.arrows.set(kk, { r, c, dir, by, t });
    return true;
  }

  // ----- the board: its crates -----
  /** How stores roll on a board with no arrows: from every square and heading, follow the rules
      till it repeats. A gun is on a loop when some loop rolls a store past the square where it goes
      in (one arrow there then loads it, time after time). */
  loopsOf(blocked: (r: number, c: number) => boolean = (r, c) => this.blocked(r, c)): { len: number; cells: Set<string> }[] {
    const next = (r: number, c: number, d: number): [number, number, number] => {
      for (const t of [0, 1, 3, 2]) { const nd = (d + t) % 4; if (!blocked(r + DR[nd], c + DC[nd])) return [r + DR[nd], c + DC[nd], nd]; }
      return [r, c, d];
    };
    const loops: { len: number; cells: Set<string> }[] = [], done = new Set<string>();
    for (const kk of this.cells) {
      const [r0, c0] = kk.split(',').map(Number);
      if (blocked(r0, c0)) continue;
      for (let d0 = 0; d0 < 4; d0++) {
        let st: [number, number, number] = [r0, c0, d0];
        const path = new Map<string, number>();
        while (!done.has(st.join()) && !path.has(st.join())) { path.set(st.join(), path.size); st = next(...st); }
        if (!done.has(st.join())) {
          const from = path.get(st.join())!, loop = [...path.keys()].slice(from).map((s) => s.split(',').map(Number));
          loops.push({ len: loop.length, cells: new Set(loop.map(([r, c]) => k(r, c))) });
        }
        for (const s of path.keys()) done.add(s);
      }
    }
    return loops;
  }

  /** Lash the crates about the deck: none round the barrel in the middle, more out towards the
      edges; none on a gun or where stores go into one, none side by side, and none walling off any
      of it. Of the boards tried, the one closest to a good Gunnery board: two guns on a loop of
      their own. */
  pickCrates(): [number, number][] {
    const [br, bc] = this.barrel, ban = new Set<string>();
    for (const g of this.guns) for (let i = 0; i <= 4; i++) ban.add(k(...gunSq(g, i)));
    const cand = [...this.cells].filter((kk) => {
      const [r, c] = kk.split(',').map(Number);
      return !ban.has(kk) && c > 0 && c < GUNNERY.COLS - 1 && Math.max(Math.abs(r - br), Math.abs(c - bc)) > 2;
    });
    // Weighted towards the edges.
    const weight = (kk: string) => { const [r, c] = kk.split(',').map(Number); return 1 + Math.max(Math.abs(r - br) / (GUNNERY.ROWS / 2), Math.abs(c - bc) / (GUNNERY.COLS / 2)) * 3; };
    let best: Set<string> | null = null, bestScore = -Infinity;
    for (let t = 0; t < 160; t++) {
      const pick = new Set<string>(), pool = cand.slice();
      while (pick.size < GUNNERY.CRATES && pool.length) {
        let x = this.rand() * pool.reduce((a, kk) => a + weight(kk), 0), i = 0;
        while ((x -= weight(pool[i])) > 0 && i < pool.length - 1) i++;
        const kk = pool.splice(i, 1)[0], [r, c] = kk.split(',').map(Number);
        if (![0, 1, 2, 3].some((d) => pick.has(k(r + DR[d], c + DC[d])))) pick.add(kk);
      }
      const blocked = (r: number, c: number) => !this.cells.has(k(r, c)) || pick.has(k(r, c)) || this.gunSet.has(k(r, c)) || (r === br && c === bc);
      // Everything still joined up.
      const open = [...this.cells].filter((kk) => !blocked(...(kk.split(',').map(Number) as [number, number])));
      const seen = new Set([open[0]]), todo = [open[0]];
      while (todo.length) {
        const [r, c] = todo.pop()!.split(',').map(Number);
        for (let d = 0; d < 4; d++) { const n = k(r + DR[d], c + DC[d]); if (!blocked(r + DR[d], c + DC[d]) && !seen.has(n)) { seen.add(n); todo.push(n); } }
      }
      if (seen.size !== open.length) continue;
      // Which guns sit on a short loop of their own, with no arrows down.
      const loops = this.loopsOf(blocked).filter((l) => l.len <= 30);
      const onLoop = this.guns.filter((g) => loops.some((l) => l.cells.has(k(...gunSq(g, 0))))).length;
      const score = -Math.abs(onLoop - 2) * 10 + this.rand();
      if (score > bestScore) { bestScore = score; best = pick; }
      if (onLoop === 2 && t > 20) break;
    }
    return [...(best || [])].map((kk) => kk.split(',').map(Number) as [number, number]);
  }
  setCrates(list: [number, number][]) {
    this.crates = list;
    this.crateSet = new Set(list.map(([r, c]) => k(r, c)));
  }
}
