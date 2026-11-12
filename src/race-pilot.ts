/* Pirate Den: the pilot's reckoning charted ahead of time, for the sloop race's bots. TypeScript, compiled to
   js/race-pilot.js; tested in tests/race-sim.test.ts. Pure: no 3D.

   Your helm's pilot (src/den-sail.ts, Sea.plot) works out the quickest way to the pin afresh each turn, from
   wherever she is: a search over the sea. Thousands of simulated races (src/race-sim.ts), four bots in each,
   can't afford that every turn. So the same reckoning is charted once, backwards from the pin: for every
   square and way she could face, the seconds to the pin by the quickest way, weighed exactly as the pilot
   weighs it (each move's sailing, its pause, its share of the turn's breather, a quick push a square of trade
   wind: PILOT_COST; never a move onto a whirlpool). A bot's next moves are then read off the chart: the move
   that leaves her quickest to the pin, then the next. The same moves as the pilot's (the quickest way is the
   quickest way), on the same sea, played by her own helm (Helm.mine, as moves you put in yourself).

   A chart covers some rows of the sea (r0 to r1); a move that leaves them is worth what `beyond` says (another
   chart's seconds: the start's field, charted for each race, hands on to the course below it, charted once). */

import { PILOT_COST, pauseFor, type Move, type Pose, type Sea } from './den-sail.js';

const MOVES: Move[] = ['F', 'L', 'R'];

export class PilotChart {
  /** Seconds to the pin from each pose (Infinity: no way there), numbered as the sea numbers them
      ((c * rows + r) * 4 + d). */
  readonly dist: Float64Array;
  /** Each pose's three moves: where each ends (-1 never: onto a whirlpool, or nowhere), and its weight. */
  private end: Int32Array;
  private w: Float64Array;
  /** Where each move ends, as a pose, when it's off the chart's rows. */
  private off = new Map<number, Pose>();

  constructor(readonly sea: Sea, readonly goal: [number, number], readonly r0: number, readonly r1: number, readonly beyond: (p: Pose) => number = () => Infinity) {
    const { cols, rows } = sea, N = cols * rows * 4;
    this.dist = new Float64Array(N).fill(Infinity);
    this.end = new Int32Array(N * 3).fill(-1);
    this.w = new Float64Array(N * 3);
    const id = (p: Pose) => (p.c * rows + p.r) * 4 + p.d, inRows = (r: number) => r >= r0 && r <= r1;
    const goalSq = goal[0] * rows + goal[1];
    // Each pose's moves, and who comes to each pose: the pilot's own weights (Sea.quickest).
    const preds: number[][] = Array.from({ length: N }, () => []);
    const seeds: [number, number][] = [];
    for (let c = 0; c < cols; c++) for (let r = r0; r <= r1; r++) {
      if (!sea.open(c, r)) continue;
      for (let d = 0; d < 4; d++) {
        const p = { c, r, d }, at = id(p);
        if (c * rows + r === goalSq) { this.dist[at] = 0; continue; }
        let best = Infinity;
        MOVES.forEach((m, k) => {
          if (sea.whirly(p, m)) return;
          const { to, ride } = sea.move(p, m), e = ride.length ? ride[ride.length - 1] : to;
          const secs = sea.moveSecs(false, p, m), w = secs + pauseFor(secs) + PILOT_COST.TURN + ride.length * PILOT_COST.PUSH;
          const to2 = id(e);
          this.end[at * 3 + k] = to2; this.w[at * 3 + k] = w;
          if (e.c * rows + e.r === goalSq) best = Math.min(best, w);
          else if (!inRows(e.r)) { this.off.set(to2, { c: e.c, r: e.r, d: e.d }); best = Math.min(best, w + beyond(e)); }
          else preds[to2].push(at * 3 + k);
        });
        if (best < Infinity) seeds.push([best, at]);
      }
    }
    // Backwards from the pin (and from the rows beyond): the quickest first.
    const heap: [number, number][] = [];
    const push = (x: [number, number]) => { heap.push(x); for (let i = heap.length - 1; i > 0;) { const j = (i - 1) >> 1; if (heap[j][0] <= x[0]) break; heap[i] = heap[j]; heap[j] = x; i = j; } };
    const pop = () => {
      const top = heap[0], last = heap.pop()!;
      if (heap.length) {
        heap[0] = last;
        for (let i = 0; ;) { const a = 2 * i + 1, b = a + 1; let k = i; if (a < heap.length && heap[a][0] < heap[k][0]) k = a; if (b < heap.length && heap[b][0] < heap[k][0]) k = b; if (k === i) break; [heap[i], heap[k]] = [heap[k], heap[i]]; i = k; }
      }
      return top;
    };
    for (const [t, at] of seeds) if (t < this.dist[at]) { this.dist[at] = t; push([t, at]); }
    for (let d = 0; d < 4; d++) { const at = goalSq * 4 + d; for (const e of preds[at]) { const q = Math.floor(e / 3), t = this.w[e]; if (t < this.dist[q]) { this.dist[q] = t; push([t, q]); } } }
    while (heap.length) {
      const [t, at] = pop();
      if (t > this.dist[at]) continue;
      if (Math.floor(at / 4) === goalSq) continue;
      for (const e of preds[at]) {
        const q = Math.floor(e / 3), u = t + this.w[e];
        if (u < this.dist[q] - 1e-12) { this.dist[q] = u; push([u, q]); }
      }
    }
  }

  /** Seconds to the pin from a pose (off its rows, what `beyond` says). */
  secs(p: Pose): number {
    if (p.c === this.goal[0] && p.r === this.goal[1]) return 0;
    if (p.r < this.r0 || p.r > this.r1) return this.beyond(p);
    return this.dist[(p.c * this.sea.rows + p.r) * 4 + p.d];
  }

  /** The next `n` moves from `from` by the quickest way to the pin (fewer if she gets there; none if there's
      no way), and where they leave her. */
  moves(from: Pose, n: number): { moves: Move[]; at: Pose } {
    const out: Move[] = [], rows = this.sea.rows;
    let p = { ...from };
    for (let i = 0; i < n; i++) {
      if (p.c === this.goal[0] && p.r === this.goal[1]) break;
      if (p.r < this.r0 || p.r > this.r1) break;
      const at = (p.c * rows + p.r) * 4 + p.d;
      let bestK = -1, best = Infinity;
      for (let k = 0; k < 3; k++) {
        const e = this.end[at * 3 + k];
        if (e < 0) continue;
        const ep = this.off.get(e) ?? { c: Math.floor(e / 4 / rows), r: Math.floor(e / 4) % rows, d: e % 4 };
        const t = this.w[at * 3 + k] + this.secs(ep);
        if (t < best - 1e-9) { best = t; bestK = k; }
      }
      if (bestK < 0 || best === Infinity) break;
      out.push(MOVES[bestK]);
      const e = this.end[at * 3 + bestK];
      p = this.off.get(e) ?? { c: Math.floor(e / 4 / rows), r: Math.floor(e / 4) % rows, d: e % 4 };
    }
    return { moves: out, at: p };
  }
}
