/* Pirate Den: the sloop race's course as data (12 Nov). TypeScript, compiled to js/race-course.js; tested
   in tests/race-course.test.ts. The few numbers the course is laid out from (LAY.RACE in src/den-sail.ts,
   layRace), and each shortcut's size: one plain object, packed into a share link, checked so it's always a
   race. The course editor (race-editor.html, src/race-editor.ts) edits it; the den's race takes one at load
   (?course=, read once before the race is made: courseFromPage), and the simulation races it.

   The user (12 Nov): "having a map editor are going to be like the top of demands ... down to the details
   of how many it takes to clear each thing, like ... the number of bilge clears required on the locks, or
   the number of pieces or complexity of each carpentry lift ... you'd need to be able to switch between 2D
   and 3D views."

   What's editable, as built:
   - the buoys: where each spit ends (its buoy, the long way round it), so a leg's long or short;
   - where each shortcut and snake cuts through its spit (a column), and the finish line;
   - each shortcut's size: the Bilge clears to raise her in the up lock, the crane's frames (small, as
     now, large), the driftwood barrier's bundles, the guard's price in coins.
   Fixed for now: the starlit door (DOOR_COLS: on every course, where it is on the den's own), the rows (each
   leg two deep, each spit as deep as it is: the whirlpool channel's depth is what makes it a Vegas), the
   start's field (laid fresh from each race's seed: src/start-field.ts) and its hop, the left-hand trade
   wind's gentle loops, the gun gap's Quad, the rocks' three hits (ROCKS in src/den-race.ts).
   No gambles since 12 Nov (RACE.md §4, "No gambles"): the veiled wind and the turning pool are gone, and so
   are their numbers here (a share link made before then opens the den's own course). */

/** The crane's frames: smaller, as the den's, or larger (src/den-crane.ts, CRANES). */
export type CraneSize = 'small' | 'standard' | 'large';
export const CRANE_SIZES: CraneSize[] = ['small', 'standard', 'large'];

/** A course: where everything is, along its spit (columns of the sea's board, 0 to 26 across), and how
    big each shortcut is. */
export interface Course {
  /** Each spit's numbered buoy, the column the long way rounds it by: spits 1, 3 and 5 end on the right
      (their land runs from the left-hand edge to the column before it), 2 and 4 on the left (their land
      starts two columns past it). */
  buoys: number[];
  /** Spit 1: the gun gap's gate, and the wreck in its notch (the bribe's coins). */
  gun: number; wreck: number;
  /** Spit 2: the headwind gap (two columns, its dog-leg), the Double's gap, and the trade wind back (a
      gentle snake across leg 3, its loop up into spit 2: `mid` is its column on the leg, the loop three
      columns back from it). */
  head: number; double: number; mid: number;
  /** Spit 3: the whirlpool channel (its column; its whirlpools and the way home the three to its left),
      the rocks blasted open (12 Nov), the barrier of driftwood. */
  whirl: number; rocks: number; forage: number;
  /** Spit 4: the locks (the berth two to their right). Leg 4's zigzag goes with buoy 4. */
  lock: number;
  /** Spit 5: the crane, the Triple's gap; the finish line on the run home. */
  crane: number; triple: number; finish: number;
  /** Moves' worth of Bilge to raise her in the up lock (the den's locks: 7). */
  clears: number;
  /** The crane's frames. */
  frames: CraneSize;
  /** Bundles of driftwood in the barrier (Foraging). */
  bundles: number;
  /** The gate's guard's price, in coins hauled up by Treasure Haul. */
  coins: number;
}

/** The course as the den lays it: its third pass (12 Nov, "the race's next pass": no gambles, gentle snakes,
    the rocks, each puzzle's shortcut cutting about the same stretch: RACE.md §8, "Shortcuts in proportion"). */
export const DEFAULT_COURSE: Course = {
  buoys: [25, 2, 25, 2, 25],
  gun: 19, wreck: 14,
  head: 12, double: 6, mid: 23,
  whirl: 12, rocks: 17, forage: 19,
  lock: 11,
  crane: 16, triple: 21, finish: 4,
  clears: 6, frames: 'small', bundles: 2, coins: 40,
};
/** The starlit door's two columns (12 Nov, public: fixed in place, not edited): its face on spit 2 off leg 2, its
    tunnel straight on under the course, up onto leg 3 and leg 5 (LAY.RACE.DOOR). Nothing else may cut through
    a spit there. */
export const DOOR_COLS = [15, 16];
export const DOOR_NAME = 'The starlit door';
/** The board's width, in squares (SAIL.COLS). */
const W = 27;
/** The spits whose end is on the right (the long way rounds them there), and on the left. */
export const RIGHT = (spit: number): boolean => spit % 2 === 0;

/** What each size may be: its least, its most, and its step. */
export const SIZES = {
  clears: { lo: 3, hi: 20, step: 1 },
  bundles: { lo: 1, hi: 4, step: 1 },
  coins: { lo: 10, hi: 100, step: 10 },
} as const;
export type SizeKey = keyof typeof SIZES;
/** Where a buoy may go: a right-hand end from column 16 to 25 (spit 1's from 20, to leave room for its gate and
    wreck past the starting line's middle), a left-hand one from 2 to 10. */
export const BUOY_RANGE = (spit: number): [number, number] => (RIGHT(spit) ? [spit ? 16 : 20, W - 2] : [2, 10]);

/** A spit's land: its first and last columns. A right-hand spit's runs right to the left-hand edge (12 Nov:
    the left-hand trade wind's gone from beside it, so nobody slips down the edge past it). */
export const landOf = (k: Course, spit: number): [number, number] => (RIGHT(spit) ? [0, k.buoys[spit] - 1] : [k.buoys[spit] + 2, W - 1]);

/* ---- Features: what the editor shows and moves ---- */

/** The columns each feature takes in its spit, and the column that moves it. */
export type ColKey = 'gun' | 'wreck' | 'head' | 'double' | 'mid' | 'whirl' | 'rocks' | 'forage' | 'lock' | 'crane' | 'triple' | 'finish';
export const COL_KEYS: ColKey[] = ['gun', 'wreck', 'head', 'double', 'mid', 'whirl', 'rocks', 'forage', 'lock', 'crane', 'triple', 'finish'];
/** Which spit each is in (5: the run home), and its columns there from its own: [from, to]. The headwind gap
    two; the trade wind back its loop up into spit 2, three columns back; the whirlpool channel its
    whirlpools and the way home to its left; the locks their berth to the right; the gun gap its guns either
    side. */
export const PLACE: Record<ColKey, { spit: number; span: [number, number] }> = {
  gun: { spit: 0, span: [-1, 1] }, wreck: { spit: 0, span: [0, 0] },
  head: { spit: 1, span: [0, 1] }, double: { spit: 1, span: [0, 0] }, mid: { spit: 1, span: [-3, 0] },
  whirl: { spit: 2, span: [-3, 0] }, rocks: { spit: 2, span: [0, 0] }, forage: { spit: 2, span: [0, 0] },
  lock: { spit: 3, span: [0, 2] },
  crane: { spit: 4, span: [0, 0] }, triple: { spit: 4, span: [0, 0] },
  finish: { spit: 5, span: [0, 0] },
};
/** Its columns, from where it is. */
const cols = (k: Course, id: ColKey): [number, number] => [k[id] + PLACE[id].span[0], k[id] + PLACE[id].span[1]];

/** Where a feature may go, given the rest of the course where it is (the long way's legs either side of its
    spit, its spit's land, the zigzag on leg 4): its least and most column. Moving it past its neighbours
    is checked separately (problems). */
export function rangeOf(k: Course, id: ColKey): [number, number] {
  const b = k.buoys, [s0, s1] = PLACE[id].span;
  if (id === 'finish') return [2, Math.min(8, Math.min(k.crane, k.triple) - 2)];
  const [l0, l1] = landOf(k, PLACE[id].spit);
  // (inside its spit, a column of land either end)
  let lo = Math.max(l0, 1) + 1 - s0, hi = l1 - 1 - s1;
  switch (id) {
    // (leg 1's long way starts at the starting line's column 13: the gate and the wreck past it)
    // (its tight water along leg 2 clear of the starlit door's water)
    case 'gun': lo = Math.max(lo, DOOR_COLS[1] + 2); hi = Math.min(hi, b[0] - 2); break;
    case 'wreck': lo = Math.max(lo, 13); hi = Math.min(hi, k.gun - 4); break;
    // (from leg 2, before the tight water past the gun gap, out onto leg 3 before buoy 3)
    case 'head': hi = Math.min(hi, k.gun - 3, b[2] - 3); break;
    case 'double': hi = Math.min(hi, k.gun - 3, b[2] - 2); break;
    case 'mid': lo = Math.max(lo, b[1] + 6); hi = Math.min(hi, b[2] - 2); break;
    // (from leg 3, onto leg 4 past its zigzag)
    case 'whirl': lo = Math.max(lo, b[3] + 8, b[1] + 4); hi = Math.min(hi, b[2] - 2); break;
    case 'rocks': case 'forage': lo = Math.max(lo, b[3] + 8, b[1] + 1); hi = Math.min(hi, b[2] - 2); break;
    // (from leg 4 past its zigzag, onto leg 5 before buoy 5)
    case 'lock': lo = Math.max(lo, b[3] + 9); hi = Math.min(hi, b[2] - 3, b[4] - 1); break;
    // (from leg 5, past buoy 4; down onto the run home before the finish)
    case 'crane': case 'triple': lo = Math.max(lo, b[3] + 2, k.finish + 2); break;
    default: break;
  }
  return [lo, hi];
}

/** What's wrong with a course, in plain words (none: it's a race). The long way always passable (every
    feature inside its spit, a column of land either end), each spit's ways through apart from each other (a
    column of land between, so no way through runs into another), and each where the long way's legs reach
    it. */
export function problems(k: Course): string[] {
  const out: string[] = [];
  if (!Array.isArray(k.buoys) || k.buoys.length !== 5) return ['The course needs five buoys.'];
  k.buoys.forEach((c, i) => {
    const [lo, hi] = BUOY_RANGE(i);
    if (!(c >= lo && c <= hi)) out.push(`Buoy ${i + 1} has to be between columns ${lo} and ${hi}.`);
  });
  for (const id of COL_KEYS) {
    const [lo, hi] = rangeOf(k, id), c = k[id];
    if (!Number.isInteger(c) || c < lo || c > hi) out.push(`${NAMES[id]} has to be between columns ${lo} and ${hi} where it is${lo > hi ? ' (there\'s no room: move what\'s round it)' : ''}.`);
  }
  // Each spit's ways through, a column of land apart.
  const bySpit: [number, number, string][][] = [[], [], [], [], []];
  for (const id of COL_KEYS) if (PLACE[id].spit < 5) bySpit[PLACE[id].spit].push([...cols(k, id), NAMES[id]]);
  // (the starlit door, fixed in place: its face in spit 2, and its far exit in spit 4)
  bySpit[1].push([DOOR_COLS[0], DOOR_COLS[1], DOOR_NAME]);
  bySpit[3].push([DOOR_COLS[0], DOOR_COLS[1], DOOR_NAME]);
  bySpit.forEach((spans, s) => {
    for (let i = 0; i < spans.length; i++) for (let j = i + 1; j < spans.length; j++) {
      const [a0, a1, an] = spans[i], [b0, b1, bn] = spans[j];
      if (a0 <= b1 + 1 && b0 <= a1 + 1) out.push(`${an} and ${bn} run into each other on spit ${s + 1}: leave a column of land between.`);
    }
  });
  // Leg 3: the trade wind back crosses the whole leg (its loop three columns back), so nothing goes into
  // spit 3 under it; and the whirlpool channel's way home, the rocks' gap and the barrier's notch clear of
  // where the starlit door's tunnel comes up onto leg 3.
  const loop = new Set<number>();
  for (let c = k.mid - 3; c <= k.mid; c++) loop.add(c);
  for (const id of ['whirl', 'rocks', 'forage'] as ColKey[]) {
    const [a, z] = cols(k, id);
    for (let c = a; c <= z; c++) {
      if (DOOR_COLS.includes(c)) out.push(`${NAMES[id]} is where ${DOOR_NAME.toLowerCase()}'s tunnel comes up onto leg 3.`);
      if (loop.has(c)) out.push(`${NAMES[id]} is under the trade wind back's loop across leg 3.`);
    }
  }
  if (!CRANE_SIZES.includes(k.frames)) out.push('The crane\'s frames are small, standard or large.');
  for (const key of Object.keys(SIZES) as SizeKey[]) {
    const { lo, hi, step } = SIZES[key], v = k[key];
    if (!Number.isFinite(v) || v < lo || v > hi || (v - lo) % step) out.push(`${SIZE_NAMES[key]} has to be from ${lo} to ${hi}${step > 1 ? `, in ${step}s` : ''}.`);
  }
  return [...new Set(out)];
}

/** Each feature's name, as the editor shows it. */
export const NAMES: Record<ColKey, string> = {
  gun: 'The imperial gate', wreck: 'The wreck',
  head: 'The headwind gap', double: 'The Double\'s gap', mid: 'The trade wind back',
  whirl: 'The whirlpool channel', rocks: 'The rocks', forage: 'The barrier of driftwood',
  lock: 'The locks',
  crane: 'The crane', triple: 'The Triple\'s gap', finish: 'The finish line',
};
export const SIZE_NAMES: Record<SizeKey, string> = {
  clears: 'The locks\' Bilge clears', bundles: 'The barrier\'s bundles', coins: 'The guard\'s price',
};

/* ---- The share link ----
   One character a number, base 36, in this order (new ones go on the end), after a version: about twenty
   characters. Coins in tens. Version 2 since 12 Nov (the gambles gone, the rocks in). */

const ORDER: ColKey[] = ['gun', 'wreck', 'head', 'double', 'mid', 'whirl', 'rocks', 'forage', 'lock', 'crane', 'triple', 'finish'];
const VERSION = '2';

/** A course packed into a share link's `course=`. */
export function encodeCourse(k: Course): string {
  const n = [...k.buoys, ...ORDER.map((id) => k[id]), k.clears, CRANE_SIZES.indexOf(k.frames), k.bundles, k.coins / 10];
  return VERSION + n.map((x) => Math.max(0, Math.min(35, Math.round(x))).toString(36)).join('');
}

/** A share link's course, or null if it isn't one (or isn't a race: problems). */
export function decodeCourse(code: unknown): Course | null {
  const s = String(code ?? '').trim().toLowerCase();
  const len = 1 + 5 + ORDER.length + 4;
  if (s.length !== len || s[0] !== VERSION || !/^[0-9a-z]+$/.test(s)) return null;
  const n = [...s.slice(1)].map((ch) => parseInt(ch, 36));
  const k: Course = { ...DEFAULT_COURSE, buoys: n.slice(0, 5) };
  ORDER.forEach((id, i) => { k[id] = n[5 + i]; });
  const [clears, frames, bundles, coins] = n.slice(5 + ORDER.length);
  Object.assign(k, { clears, frames: CRANE_SIZES[frames] ?? 'x', bundles, coins: coins * 10 });
  return problems(k).length ? null : k;
}

/** The same course. */
export const sameCourse = (a: Course, b: Course): boolean => encodeCourse(a) === encodeCourse(b);

/** The course a page was opened with (`?course=`), read once before the race is made; null for the den's
    own (none given, or not a race). In Node (the tests, the simulation's runner), none. */
export function courseFromPage(): Course | null {
  const loc = (globalThis as { location?: { search?: string } }).location;
  if (!loc || typeof loc.search !== 'string') return null;
  const code = new URLSearchParams(loc.search).get('course');
  return code ? decodeCourse(code) : null;
}