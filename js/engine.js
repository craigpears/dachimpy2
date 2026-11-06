/* Carpentry engine: pentomino shapes, draw weights, an exact-cover solver,
   and generators for the drill scenarios. Plain script (no modules) so the
   site works when index.html is opened straight from disk. */
(function (root) {
  'use strict';

  // Free pentominoes, standard letter names.
  const SHAPES = {
    P: ['##', '##', '#.'],
    F: ['.##', '##.', '.#.'],
    Y: ['.#..', '####'],
    T: ['###', '.#.', '.#.'],
    N: ['##..', '.###'],
    L: ['####', '#...'],
    W: ['#..', '##.', '.##'],
    U: ['#.#', '###'],
    V: ['#..', '#..', '###'],
    Z: ['##.', '.#.', '.##'],
    X: ['.#.', '###', '.#.'],
    I: ['#####'],
  };

  // Draw weights from the YPPedia "Carpentry Shapes and Frequencies" table.
  const WEIGHTS = { P: 22, F: 14, Y: 14, T: 7, N: 8, L: 8, W: 4, U: 4, V: 4, Z: 4, X: 3, I: 2 };
  const PUTTY_WEIGHT = 1;
  const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((a, b) => a + b, 0); // 94
  const LETTERS = Object.keys(SHAPES);
  // Pieces whose grain runs along their long direction: they only keep Grain lying flat.
  const LONG_GRAIN = new Set(['I', 'L', 'N', 'Y']);

  const prob = (l) => WEIGHTS[l] / TOTAL_WEIGHT;

  // ---------- cell helpers ----------
  const key = (r, c) => r + ',' + c;
  const unkey = (k) => k.split(',').map(Number);

  function parseRows(rows) {
    const cells = [];
    rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') cells.push([r, c]); }));
    return cells;
  }

  function normalize(cells) {
    let mr = Infinity, mc = Infinity;
    for (const [r, c] of cells) { if (r < mr) mr = r; if (c < mc) mc = c; }
    return cells.map(([r, c]) => [r - mr, c - mc]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  }

  const cellsKey = (cells) => cells.map(([r, c]) => r + ',' + c).join(';');

  function bbox(cells) {
    let r0 = Infinity, c0 = Infinity, r1 = -Infinity, c1 = -Infinity;
    for (const [r, c] of cells) {
      if (r < r0) r0 = r; if (c < c0) c0 = c; if (r > r1) r1 = r; if (c > c1) c1 = c;
    }
    return { r0, c0, r1, c1, h: r1 - r0 + 1, w: c1 - c0 + 1 };
  }

  // The 8 symmetries of the square.
  const TRANSFORMS = [
    ([r, c]) => [r, c], ([r, c]) => [c, -r], ([r, c]) => [-r, -c], ([r, c]) => [-c, r],
    ([r, c]) => [r, -c], ([r, c]) => [c, r], ([r, c]) => [-r, c], ([r, c]) => [-c, -r],
  ];

  function variants(cells) {
    const seen = new Map();
    for (const t of TRANSFORMS) {
      const v = normalize(cells.map(t));
      const k = cellsKey(v);
      if (!seen.has(k)) seen.set(k, v);
    }
    return [...seen.values()];
  }

  // Canonical form under rotation/reflection, preferring a landscape layout for display.
  function canonical(cells) {
    let best = null, bestKey = null;
    for (const t of TRANSFORMS) {
      const v = normalize(cells.map(t));
      const b = bbox(v);
      const k = (b.w >= b.h ? '0' : '1') + cellsKey(v);
      if (bestKey === null || k < bestKey) { bestKey = k; best = v; }
    }
    return { cells: best, key: bestKey.slice(1) };
  }

  // All 63 fixed orientations.
  const ORIENTS = [];
  for (const l of LETTERS) {
    for (const v of variants(parseRows(SHAPES[l]))) ORIENTS.push({ letter: l, cells: v });
  }
  const ORIENTS_BY_LETTER = {};
  for (const o of ORIENTS) (ORIENTS_BY_LETTER[o.letter] ||= []).push(o);

  function identify(cells) {
    if (cells.length !== 5) return null;
    const k = cellsKey(normalize(cells));
    const o = ORIENTS.find((o) => cellsKey(o.cells) === k);
    return o ? o.letter : null;
  }

  function isConnected(cells) {
    if (!cells.length) return true;
    const set = new Set(cells.map(([r, c]) => key(r, c)));
    const stack = [cells[0]], seen = new Set([key(...cells[0])]);
    while (stack.length) {
      const [r, c] = stack.pop();
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = key(r + dr, c + dc);
        if (set.has(k) && !seen.has(k)) { seen.add(k); stack.push([r + dr, c + dc]); }
      }
    }
    return seen.size === set.size;
  }

  function perimeter(cells) {
    const set = new Set(cells.map(([r, c]) => key(r, c)));
    let p = 0;
    for (const [r, c] of cells) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!set.has(key(r + dr, c + dc))) p++;
    return p;
  }

  // ---------- solver ----------
  // Returns every exact tiling of `cells` by pentominoes: [[{letter, cells}], ...].
  function solve(cells, limit = 5000) {
    if (cells.length % 5) return [];
    const order = cells.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const free = new Set(order.map(([r, c]) => key(r, c)));
    const out = [], cur = [];
    (function rec() {
      if (out.length >= limit) return;
      let f = null;
      for (const [r, c] of order) if (free.has(key(r, c))) { f = [r, c]; break; }
      if (!f) { out.push(cur.slice()); return; }
      for (const o of ORIENTS) {
        const dr = f[0] - o.cells[0][0], dc = f[1] - o.cells[0][1];
        const placed = [];
        let ok = true;
        for (const [r, c] of o.cells) {
          const k = key(r + dr, c + dc);
          if (!free.has(k)) { ok = false; break; }
          placed.push([r + dr, c + dc]);
        }
        if (!ok) continue;
        for (const [r, c] of placed) free.delete(key(r, c));
        cur.push({ letter: o.letter, cells: placed });
        rec();
        cur.pop();
        for (const [r, c] of placed) free.add(key(r, c));
      }
    })();
    return out;
  }

  const comboName = (tiling) => tiling.map((p) => p.letter).sort(byWeight).join('');
  function byWeight(a, b) { return WEIGHTS[b] - WEIGHTS[a] || a.localeCompare(b); }

  // Group tilings by the multiset of pieces they use.
  function combos(cells) {
    const groups = new Map();
    for (const t of solve(cells)) {
      const name = comboName(t);
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(t);
    }
    return [...groups.entries()]
      .map(([name, tilings]) => ({ name, letters: [...name], tilings, grainSafe: tilings.some(grainSafe) }))
      .sort((a, b) => comboOdds(b.letters) - comboOdds(a.letters));
  }

  // Grain is only checkable for long-grain pieces: they must lie horizontally.
  function grainSafe(tiling) {
    return tiling.every((p) => !LONG_GRAIN.has(p.letter) || bbox(p.cells).w > bbox(p.cells).h);
  }

  // Chance that random draws are exactly this multiset of pieces, in any order.
  function comboOdds(letters) {
    const counts = {};
    for (const l of letters) counts[l] = (counts[l] || 0) + 1;
    let coef = fact(letters.length);
    for (const n of Object.values(counts)) coef /= fact(n);
    return coef * letters.reduce((a, l) => a * prob(l), 1);
  }
  function fact(n) { return n <= 1 ? 1 : n * fact(n - 1); }

  // How finishable a remnant is: the chance random draws are a perfect fill, plus what helps.
  function finishInfo(cells) {
    if (!cells.length) return { odds: 1, ways: 1, useful: [], combos: [] };
    if (cells.length === 5) {
      const l = identify(cells);
      return { odds: l ? prob(l) : 0, ways: l ? 1 : 0, useful: l ? [l] : [], combos: [], gap: l };
    }
    const list = combos(cells);
    const useful = [...new Set(list.flatMap((c) => c.letters))].sort(byWeight);
    return { odds: list.reduce((s, c) => s + comboOdds(c.letters), 0), ways: list.length, useful, combos: list };
  }

  // Flexibility stats for a 10-square remnant.
  function pairStats(cells) {
    const list = combos(cells);
    const pairOdds = list.reduce((s, c) => s + comboOdds(c.letters), 0);
    const useful = new Set(list.flatMap((c) => c.letters));
    const usefulShare = [...useful].reduce((s, l) => s + prob(l), 0);
    return { combos: list, pairOdds, usefulShare, useful: [...useful].sort(byWeight) };
  }

  // Every way to put one piece entirely inside `cells`.
  function placements(cells, letter) {
    const set = new Set(cells.map(([r, c]) => key(r, c)));
    const b = bbox(cells);
    const out = [];
    for (const o of ORIENTS_BY_LETTER[letter]) {
      for (let dr = b.r0 - 4; dr <= b.r1; dr++) {
        for (let dc = b.c0 - 4; dc <= b.c1; dc++) {
          const placed = o.cells.map(([r, c]) => [r + dr, c + dc]);
          if (placed.every(([r, c]) => set.has(key(r, c)))) out.push(placed);
        }
      }
    }
    return out;
  }

  function minus(cells, remove) {
    const gone = new Set(remove.map(([r, c]) => key(r, c)));
    return cells.filter(([r, c]) => !gone.has(key(r, c)));
  }

  // ---------- the atlas of 10-square remnants ----------
  // Every connected shape that two pentominoes can tile, up to symmetry.
  let atlasCache = null;
  function atlas() {
    if (atlasCache) return atlasCache;
    const shapes = new Map();
    for (const l of LETTERS) {
      const A = ORIENTS_BY_LETTER[l][0].cells;
      const aSet = new Set(A.map(([r, c]) => key(r, c)));
      const touch = new Set();
      for (const [r, c] of A) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (!aSet.has(key(r + dr, c + dc))) touch.add(key(r + dr, c + dc));
      }
      for (const o of ORIENTS) {
        for (let dr = -5; dr <= 5; dr++) for (let dc = -5; dc <= 5; dc++) {
          const B = o.cells.map(([r, c]) => [r + dr, c + dc]);
          if (B.some(([r, c]) => aSet.has(key(r, c)))) continue;
          if (!B.some(([r, c]) => touch.has(key(r, c)))) continue;
          const { cells, key: k } = canonical(A.concat(B));
          if (!shapes.has(k)) shapes.set(k, cells);
        }
      }
    }
    atlasCache = [...shapes.entries()].map(([k, cells]) => {
      const b = bbox(cells);
      return { key: k, cells, w: b.w, h: b.h, perimeter: perimeter(cells), ...pairStats(cells) };
    });
    return atlasCache;
  }

  // Remnants that look like the tail end of a real hole: compact, no long arms.
  function compactAtlas() {
    return atlas().filter((s) => s.h <= 4 && s.w <= 5 && s.perimeter <= 18);
  }

  // ---------- random helpers ----------
  // Swappable source so the Hole of the Day can be seeded and replayed.
  let rng = Math.random;
  function useSeed(seed) {
    if (seed == null) { rng = Math.random; return; }
    let a = seed >>> 0;
    rng = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = (n) => Math.floor(rng() * n);
  const pick = (arr) => arr[rand(arr.length)];
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function weightedLetter(exclude = []) {
    const pool = LETTERS.filter((l) => !exclude.includes(l));
    let x = rng() * pool.reduce((s, l) => s + WEIGHTS[l], 0);
    for (const l of pool) { x -= WEIGHTS[l]; if (x < 0) return l; }
    return pool[pool.length - 1];
  }
  // Random symmetry so the same remnant doesn't always face the same way.
  function randomPose(cells) {
    const v = normalize(cells.map(pick(TRANSFORMS)));
    const b = bbox(v);
    return b.h > b.w ? normalize(v.map(TRANSFORMS[5])) : v;
  }

  // ---------- drill generators ----------

  // "Which pair fills this?" — one valid pair among four options.
  function genPairQuiz() {
    const pool = compactAtlas().filter((s) => s.combos.length >= 1);
    const shape = pick(pool);
    const cells = randomPose(shape.cells);
    const stats = pairStats(cells);
    const valid = new Set(stats.combos.map((c) => c.name));
    const answer = pick(stats.combos);
    const distractors = new Set();
    let guard = 0;
    while (distractors.size < 3 && guard++ < 500) {
      // Mostly near-misses: keep one of the right pieces and swap the other.
      const a = rng() < 0.7 ? pick(answer.letters) : weightedLetter();
      const name = [a, weightedLetter()].sort(byWeight).join('');
      if (!valid.has(name)) distractors.add(name);
    }
    const options = shuffle([answer.name, ...distractors]).map((name) => ({ name, correct: valid.has(name) }));
    return { cells, stats, options };
  }

  // "Which remnant would you rather leave?" — three remnants, one clearly most flexible.
  function genRemnantQuiz() {
    const pool = compactAtlas();
    for (let tries = 0; tries < 200; tries++) {
      const picks = shuffle(pool).slice(0, 3);
      const odds = picks.map((s) => s.pairOdds).sort((a, b) => b - a);
      if (odds[0] < 0.03 || odds[0] < odds[1] * 1.4) continue;
      const options = picks.map((s) => {
        const cells = randomPose(s.cells);
        return { cells, stats: pairStats(cells) };
      });
      const best = Math.max(...options.map((o) => o.stats.pairOdds));
      options.forEach((o) => { o.correct = o.stats.pairOdds === best; });
      return { options };
    }
    return genRemnantQuiz();
  }

  // "Place the piece" — a 15-square hole, one piece in hand, three candidate placements.
  function genPlaceQuiz() {
    const pool = compactAtlas().filter((s) => s.pairOdds > 0.02);
    for (let tries = 0; tries < 400; tries++) {
      const base = pick(pool).cells;
      const letter = weightedLetter(['I']);
      const baseSet = new Set(base.map(([r, c]) => key(r, c)));
      // Attach a copy of the piece somewhere along the remnant's edge.
      const o = pick(ORIENTS_BY_LETTER[letter]);
      const dr = rand(7) - 3, dc = rand(9) - 4;
      const add = o.cells.map(([r, c]) => [r + dr, c + dc]);
      if (add.some(([r, c]) => baseSet.has(key(r, c)))) continue;
      const hole = normalize(base.concat(add));
      const b = bbox(hole);
      if (!isConnected(hole) || b.h > 5 || b.w > 6 || perimeter(hole) > 22) continue;

      const scored = placements(hole, letter).map((p) => {
        const rest = minus(hole, p);
        return { piece: p, remnant: rest, stats: pairStats(rest) };
      });
      if (scored.length < 3) continue;
      scored.sort((a, b) => b.stats.pairOdds - a.stats.pairOdds);
      const best = scored[0];
      if (best.stats.pairOdds < 0.03) continue;
      const worse = scored.filter((s) => s.stats.pairOdds < best.stats.pairOdds * 0.7);
      const dead = worse.filter((s) => s.stats.pairOdds === 0);
      const live = worse.filter((s) => s.stats.pairOdds > 0);
      if (worse.length < 2) continue;
      const others = [];
      if (dead.length) others.push(pick(dead));
      if (live.length) others.push(pick(live));
      while (others.length < 2) {
        const c = pick(worse);
        if (!others.includes(c)) others.push(c);
      }
      const options = shuffle([best, ...others]).map((s) => ({ ...s, correct: s === best }));
      return { hole, letter, options };
    }
    return genPlaceQuiz();
  }

  /* A hole of `size` pieces, grown outward from `core` (or from one random piece) into a
     compact blob. Returns { hole, core } in the same random pose. */
  function genHole(size, core) {
    const [shortMax, longMax] = { 1: [3, 5], 2: [4, 5], 3: [5, 5], 4: [5, 6], 5: [6, 6] }[size];
    const start = core ? core.length / 5 : 1;
    for (let tries = 0; tries < 2000; tries++) {
      let cells = (core || pick(ORIENTS).cells).slice();
      const set = new Set(cells.map(([r, c]) => key(r, c)));
      for (let n = start; n < size; n++) {
        let added = false;
        for (let g = 0; g < 60 && !added; g++) {
          const b = bbox(cells);
          const o = pick(ORIENTS);
          const dr = b.r0 - 4 + rand(b.h + 5), dc = b.c0 - 4 + rand(b.w + 5);
          const add = o.cells.map(([r, c]) => [r + dr, c + dc]);
          if (add.some(([r, c]) => set.has(key(r, c)))) continue;
          if (!add.some(([r, c]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, z]) => set.has(key(r + a, c + z))))) continue;
          add.forEach(([r, c]) => set.add(key(r, c)));
          cells = cells.concat(add);
          added = true;
        }
        if (!added) break;
      }
      if (cells.length !== size * 5) continue;
      const b = bbox(cells);
      if (Math.min(b.h, b.w) > shortMax || Math.max(b.h, b.w) > longMax) continue;
      if (perimeter(cells) > 6 + 1.2 * cells.length) continue;
      if (hasIsland(cells)) continue;
      // Same pose for hole and core, so the core can be drawn as a target inside the hole.
      let t = pick(TRANSFORMS);
      let moved = cells.map(t);
      const mb = bbox(moved);
      if (mb.h > mb.w) { const t0 = t; t = (p) => TRANSFORMS[5](t0(p)); moved = cells.map(t); }
      const { r0, c0 } = bbox(moved);
      const place = (list) => list.map(t).map(([r, c]) => [r - r0, c - c0]);
      return { hole: place(cells), core: core ? place(core) : null };
    }
    // This core wouldn't grow into a tidy hole; try another.
    return genHole(size, core ? pickCore() : null);
  }

  // Real holes don't have solid wood floating in the middle of them.
  function hasIsland(cells) {
    const b = bbox(cells);
    const hole = new Set(cells.map(([r, c]) => key(r, c)));
    const outside = [];
    for (let r = b.r0 - 1; r <= b.r1 + 1; r++) for (let c = b.c0 - 1; c <= b.c1 + 1; c++) if (!hole.has(key(r, c))) outside.push([r, c]);
    return components(outside).length > 1;
  }

  // A good ten-square finish to build a hole around: easy enough to reach, varied enough to learn from.
  function pickCore() {
    return pick(compactAtlas().filter((s) => s.pairOdds >= 0.06)).cells;
  }

  /* Deal for the next step. The toolbox holds `count` pieces: the ones you didn't play
     (`held`) stay and fresh pieces top it up. A few random deals first; if none can be placed
     usefully the player would have spent them on other holes, so fall back to one that helps.
     Deals with at least two real choices are preferred over ones with a single move. */
  function dealStep(cells, count = 1, storm = false, held = []) {
    const base = held.slice(0, count - 1);
    const fresh = (n) => Array.from({ length: n }, () => dealLetter(storm));
    for (let t = 0; t < 12; t++) {
      const letters = base.concat(fresh(count - base.length));
      const options = stepOptions(cells, letters);
      if (options) return { letters, options, skipped: t };
    }
    const useful = shuffle(finishInfo(cells).useful);
    for (const l of useful) {
      const letters = base.concat(l, fresh(count - base.length - 1));
      const options = stepOptions(cells, letters);
      if (options) return { letters, options, skipped: 12 };
    }
    // A single piece with only one sensible spot is no choice at all: offer a second piece instead.
    if (count === 1) {
      for (const l of useful) for (const m of useful) {
        if (m === l) continue;
        const options = stepOptions(cells, [l, m], 2, false);
        if (options) return { letters: [l, m], options, skipped: 12, pickOne: true };
      }
    }
    for (const l of useful) {
      const letters = base.concat(l, fresh(count - base.length - 1));
      const options = stepOptions(cells, letters, 1);
      if (options) return { letters, options, skipped: 12 };
    }
    return null;
  }

  // How good a remnant is when you also keep the `held` pieces in the toolbox for it.
  function holdScore(info, held) {
    if (!held.length) return info.odds;
    if (info.gap !== undefined) return held.includes(info.gap) ? 1 : info.odds;
    let best = info.odds;
    for (const h of new Set(held)) {
      let withHeld = 0;
      for (const c of info.combos) {
        const i = c.letters.indexOf(h);
        if (i < 0) continue;
        const partner = c.letters[1 - i];
        if (held.filter((x, j) => j !== held.indexOf(h)).includes(partner)) return 1;
        withHeld += comboOdds([partner]);
      }
      best = Math.max(best, withHeld);
    }
    return best;
  }

  // Deal a piece; storms flatten the odds so awkward pieces turn up more.
  function dealLetter(storm) {
    if (!storm) return weightedLetter();
    let x = rng() * LETTERS.reduce((s, l) => s + Math.sqrt(WEIGHTS[l]), 0);
    for (const l of LETTERS) { x -= Math.sqrt(WEIGHTS[l]); if (x < 0) return l; }
    return 'P';
  }

  const GRADES = [[0.95, 'best'], [0.6, 'good'], [0.25, 'tight'], [1e-12, 'risky'], [-1, 'dead']];
  const gradeOf = (score, best) => (score <= 0 ? 'dead' : (GRADES.find(([t]) => score / best >= t) || [0, 'risky'])[1]);

  // The two-piece finishes named in Hawkings' Carpentry tutorial on YPPedia.
  const NAMED = [
    ['Top-Notch', ['###.', '###.', '####']],
    ['Dogleg', ['####', '####', '..##']],
    ['Dome', ['.##.', '####', '####']],
    ['Middle-Notch', ['###.', '####', '###.']],
    ['Animal', ['####', '####', '#.#.']],
    ['Offset', ['###.', '####', '.###']],
    ['Lazy Animal', ['#####', '####.', '.#...']],
    ['The Ship', ['####.', '#####', '#....']],
    ['The Rectangle', ['#####', '#####']],
  ].map(([name, rows]) => ({ name, rows, key: canonical(parseRows(rows)).key }));
  const nameOf = (cells) => (cells.length === 10 ? (NAMED.find((n) => n.key === canonical(cells).key) || {}).name || null : null);

  function components(cells) {
    const left = new Set(cells.map(([r, c]) => key(r, c)));
    const sizes = [];
    while (left.size) {
      const first = left.values().next().value;
      const stack = [first];
      left.delete(first);
      let n = 0;
      while (stack.length) {
        const [r, c] = unkey(stack.pop());
        n++;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = key(r + dr, c + dc);
          if (left.has(k)) { left.delete(k); stack.push(k); }
        }
      }
      sizes.push(n);
    }
    return sizes;
  }

  // A square that, if filled, would split the space: a one-wide neck or a dangling nub.
  function hasNeck(cells) {
    if (cells.length <= 5) return false;
    return cells.some((cell) => components(cells.filter((x) => x !== cell)).length > 1);
  }

  // How far the outline is from the squarest shape of the same area.
  function ragged(cells) {
    const n = cells.length;
    if (!n) return 0;
    const a = Math.ceil(Math.sqrt(n)), b = Math.ceil(n / a);
    return perimeter(cells) - 2 * (a + b);
  }

  /* Up to three placements that all look like sensible moves (they hug the edge and strand
     no squares), chosen so they differ in how well they set up the finish. */
  function stepOptions(cells, letters, min = 2, keep = true) {
    const inHole = new Set(cells.map(([r, c]) => key(r, c)));
    const all = [];
    for (const letter of [...new Set(letters)]) {
      for (const p of placements(cells, letter)) {
        const rest = minus(cells, p);
        if (components(rest).some((n) => n % 5)) continue;
        const restSet = new Set(rest.map(([r, c]) => key(r, c)));
        let contact = 0;
        for (const [r, c] of p) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = key(r + dr, c + dc);
          if (!inHole.has(k) || (!restSet.has(k) && !p.some(([pr, pc]) => pr === r + dr && pc === c + dc))) contact++;
        }
        const held = keep ? letters.slice() : [];
        if (keep) held.splice(held.indexOf(letter), 1);
        const info = finishInfo(rest);
        all.push({ letter, piece: p, rest, held, contact, info, score: holdScore(info, held), name: nameOf(rest), neck: hasNeck(rest), ragged: ragged(rest) });
      }
    }
    if (all.length < min) return null;
    all.sort((a, b) => b.score - a.score || b.contact - a.contact);
    const best = all[0].score;
    if (best <= 0) return null;
    const maxContact = Math.max(...all.map((o) => o.contact));
    const seen = new Set([cellsKey(normalize(all[0].rest))]);
    const pool = all.filter((o) => {
      if (o === all[0] || o.contact < maxContact - 2) return false;
      const k = cellsKey(normalize(o.rest));
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).sort((a, b) => b.contact - a.contact);
    const chosen = [all[0]];
    const near = pool.find((o) => o.score > 0 && o.score < best * 0.9);
    if (near) chosen.push(near);
    const weak = pool.filter((o) => !chosen.includes(o) && o.score < best * 0.5);
    if (weak.length) chosen.push(weak[rand(Math.min(2, weak.length))]);
    for (const o of pool) { if (chosen.length >= 3) break; if (!chosen.includes(o)) chosen.push(o); }
    if (chosen.length < min) return null;
    chosen.forEach((o) => { o.grade = gradeOf(o.score, best); });
    return shuffle(chosen);
  }

  // ---------- the betting table: several holes, one pile ----------
  /* A table hole is either a last gap (five squares, one piece) or a two-piece hole (ten squares).
     For a two-piece hole we note, for each piece that can go in first, where it goes and which
     gap it leaves, preferring the gap for the commonest partner. */
  function tableHole(cells) {
    if (cells.length === 5) return { cells, gap: identify(cells) };
    const first = {};
    for (const c of combos(cells)) {
      for (const p of c.tilings[0]) {
        const other = c.tilings[0].find((q) => q !== p);
        const cur = first[p.letter];
        if (!cur || WEIGHTS[other.letter] > WEIGHTS[cur.partner]) first[p.letter] = { piece: p.cells, rest: other.cells, partner: other.letter };
      }
    }
    return { cells, first, name: nameOf(cells), useful: Object.keys(first).sort(byWeight) };
  }

  const tableState = (holes) => holes.map((h) => ({ need: h.gap || null, rest: h.cells, placed: [], done: false }));

  /* Where a drawn piece goes: first into a gap it finishes, otherwise into the untouched
     two-piece hole where it leaves the commonest gap. Returns the hole index, or -1 for a spare. */
  function tableDraw(holes, state, l) {
    let i = state.findIndex((s) => !s.done && s.need === l);
    if (i >= 0) {
      const s = state[i];
      s.placed.push({ letter: l, cells: s.rest });
      s.rest = []; s.need = null; s.done = true;
      return i;
    }
    let best = -1;
    holes.forEach((h, j) => {
      const f = h.first && !state[j].placed.length && h.first[l];
      if (f && (best < 0 || WEIGHTS[f.partner] > WEIGHTS[holes[best].first[l].partner])) best = j;
    });
    if (best >= 0) {
      const f = holes[best].first[l], s = state[best];
      s.placed.push({ letter: l, cells: f.piece });
      s.rest = f.rest; s.need = f.partner;
    }
    return best;
  }

  // Chance each hole is finished from `draws` pieces off the pile, by playing it out many times.
  function tableChances(holes, draws, sims = 3000) {
    const wins = holes.map(() => 0);
    for (let n = 0; n < sims; n++) {
      const st = tableState(holes);
      for (let d = 0; d < draws; d++) tableDraw(holes, st, weightedLetter());
      st.forEach((s, i) => { if (s.done) wins[i]++; });
    }
    return wins.map((w) => w / sims);
  }

  /* Four holes whose chances are close enough that the choice is a real one: a mix of last gaps
     (all needing different pieces) and two-piece holes. */
  function genBetTable(draws = 4, count = 4) {
    const pairs = compactAtlas().filter((s) => s.pairOdds >= 0.05);
    let fallback = null;
    for (let t = 0; t < 40; t++) {
      const nPairs = 1 + rand(2);
      const letters = shuffle(LETTERS.filter((l) => l !== 'I' && l !== 'X')).slice(0, count - nPairs);
      const holes = shuffle(letters.map((l) => tableHole(randomPose(pick(ORIENTS_BY_LETTER[l]).cells)))
        .concat(Array.from({ length: nPairs }, () => tableHole(randomPose(pick(pairs).cells)))));
      const chances = tableChances(holes, draws, 1500);
      const lo = Math.min(...chances), hi = Math.max(...chances);
      holes.forEach((h, i) => { h.chance = chances[i]; });
      if (lo >= 0.12 && hi <= 0.72 && hi - lo <= 0.45) return holes;
      if (!fallback || hi - lo < fallback.spread) fallback = { holes, spread: hi - lo };
    }
    return fallback.holes;
  }

  // "Name that piece" warm-up.
  function genNameQuiz() {
    const letter = weightedLetter();
    const o = pick(ORIENTS_BY_LETTER[letter]);
    const wrong = shuffle(LETTERS.filter((l) => l !== letter)).slice(0, 3);
    return { letter, cells: o.cells, options: shuffle([letter, ...wrong]) };
  }

  root.Carp = {
    SHAPES, WEIGHTS, PUTTY_WEIGHT, TOTAL_WEIGHT, LETTERS, LONG_GRAIN, ORIENTS, ORIENTS_BY_LETTER,
    prob, key, unkey, parseRows, normalize, bbox, canonical, identify, isConnected, perimeter,
    solve, combos, comboOdds, pairStats, placements, minus, grainSafe, byWeight,
    atlas, compactAtlas, shuffle, pick,
    finishInfo, genHole, pickCore, dealLetter, NAMED, nameOf, hasNeck, ragged, dealStep, stepOptions, weightedLetter, useSeed,
    genPairQuiz, genRemnantQuiz, genPlaceQuiz, genNameQuiz,
    tableHole, tableState, tableDraw, tableChances, genBetTable,
  };
})(typeof window !== 'undefined' ? window : globalThis);
