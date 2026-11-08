/* Pirate Den: the fair deal, kept on its own so it can be tested from the command line
   (tests/deal.test.js, `npm test`). Plain script like engine.js: in the browser it's
   window.DenDeal, in Node `require` it after engine.js. It knows nothing of the den itself: it is
   handed what's left of each hole and the pieces already on the crates or in your hands.

   The first wave is dealt fair: the crates hand out the pieces that finish the holes as
   Masterpieces, not whatever comes. The user, left needing three F's and an L that never came with
   only a T in the toolbox: "This first wave definitely needs to be perfectly considered." Each deal
   looks again at what's left of every open hole (so a piece put somewhere else, or knocked out,
   just changes the plan), picks the way of finishing each that uses the most of what's already on
   the crates or in your hands, and deals one of the pieces still missing. Once nothing's missing
   (or a hole can't be finished exactly any more) it deals as usual. When it's on at all (the first
   wall only, until it's done) is the den's business: see fairDeal in den.js. */
(function (root) {
  'use strict';

  /* The main puzzle's solver, but searching a wide shape column by column (by turning it on its
     side): row by row, a long thin strip like a wall-walk can take the solver a minute; this way,
     a millisecond. Pentominoes turned on their side are still the same pentominoes. */
  function turnWide(Carp) {
    return { ...Carp, solve(cells, limit) {
      const b = Carp.bbox(cells);
      if (b.w <= b.h) return Carp.solve(cells, limit);
      const T = (cs) => cs.map(([r, c]) => [c, r]);
      return Carp.solve(T(cells), limit).map((t) => t.map((p) => ({ letter: p.letter, cells: T(p.cells) })));
    } };
  }

  // Of a list of letters, the ones `pool` doesn't cover (taking each piece in it once).
  function missing(letters, pool) {
    const q = pool.slice();
    return letters.filter((x) => { const i = q.indexOf(x); if (i < 0) return true; q.splice(i, 1); return false; });
  }

  // Every order of 0..n-1 (n is the number of holes, four or so), or `many` shuffles when that's too many.
  function orders(n, shuffle, many = 60) {
    const out = [], a = [...Array(n).keys()];
    if (n > 5) { for (let t = 0; t < many; t++) out.push(shuffle(a)); return out; }
    const perm = (i) => {
      if (i === n) { out.push(a.slice()); return; }
      for (let j = i; j < n; j++) { [a[i], a[j]] = [a[j], a[i]]; perm(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    };
    perm(0);
    return out;
  }

  class FairDeal {
    /* C: the engine (window.Carp), turned for wide shapes. random: for the weighted choices, so a
       test can make them repeatable (the engine's own shuffles follow Carp.useSeed). */
    constructor(C = turnWide(root.Carp), random = Math.random) {
      this.C = C;
      this.random = random;
      this.held = [];
    }

    // A new game: nothing held back.
    reset() { this.held = []; }

    /* But never round and round. The user, building a frame with the fair deal still on: "four M
       pieces in a row ... and so many U pieces. The favourable pieces thing seems to be stuck on."
       A piece dealt fair that goes into a frame instead is held back for the next three deals, or
       the wall's missing W would keep coming back. (Held back for good, as it first was, a thrown L
       meant the hole needing an L never got one; and a thrown piece isn't held back at all: the
       hole still needs it.) */
    holdBack(letter, deals = 3) { this.held.push({ l: letter, n: deals }); }

    // The usual odds of being dealt these pieces, softened (see plan).
    odds(letters) { return letters.reduce((o, x) => o * Math.sqrt(this.C.WEIGHTS[x] / this.C.TOTAL_WEIGHT), 1); }

    /* Each hole's different ways of finishing, as the sorted letters they take (one entry per
       different set; a hole that can't be finished exactly has none). */
    ways(cells) {
      if (!cells.length || cells.length % 5) return [];
      const seen = new Map();
      for (const sol of this.C.solve(cells, 200)) { const l = sol.map((p) => p.letter).sort(); seen.set(l.join(''), l); }
      return [...seen.values()];
    }

    /* The pieces still to be dealt, as { l: letter, h: which hole }. holes: what's left of each
       hole, as [row, col] cells ([] for one that's done or not open). have: the letters already on
       the crates or in your hands. */
    plan(holes, have = []) {
      const ways = holes.map((cells) => this.ways(cells));
      const live = ways.map((w, i) => (w.length ? i : -1)).filter((i) => i >= 0);
      /* The holes are planned together, not one at a time: planned in turn, an earlier hole could
         take one of the two W's you had for the hole you're mending, and a third W got dealt (the
         user: "it was deciding I needed another M before realising I'd already finished that first
         hole"). So: try the holes in every order (a few dozen at most), each taking the way that
         uses most of what's left on the crates and in your hands, and keep the plan missing fewest
         pieces. */
      /* And at the usual odds: picking evenly among the ways of finishing a hole, a way needing a
         cross came up as often as one needing a P (the user got five crosses in thirteen pieces:
         "That feels very broken"). So among the ways that use most of what you've got, one is picked
         with the chance of being dealt the pieces it still needs, and of the plans missing fewest
         pieces the likeliest is kept. A rare piece comes when the holes really need one. (Softened,
         square roots of the odds: weighted fully, a plan full of P's was so much likelier that half
         of what came was P's, against about a quarter dealt at random.) */
      let best = null, bestOdds = 0;
      for (const order of orders(live.length, this.C.shuffle)) {
        const pool = have.slice(), need = [];
        for (const hi of order.map((i) => live[i])) {
          let most = -1, cands = [];
          for (const l of ways[hi]) {
            const miss = missing(l, pool), use = l.length - miss.length;
            if (use > most) { most = use; cands = []; }
            if (use === most) cands.push({ l, o: this.odds(miss) });
          }
          let x = this.random() * cands.reduce((s, c) => s + c.o, 0), pick = cands[cands.length - 1].l;
          for (const c of cands) { x -= c.o; if (x < 0) { pick = c.l; break; } }
          for (const y of pick) { const i = pool.indexOf(y); if (i >= 0) pool.splice(i, 1); else need.push({ l: y, h: hi }); }
        }
        const o = this.odds(need.map((n) => n.l));
        if (!best || need.length < best.length || (need.length === best.length && o > bestOdds)) { best = need; bestOdds = o; }
      }
      const need = best || [];
      for (const s of this.held) { const i = need.findIndex((n) => n.l === s.l); if (i >= 0) need.splice(i, 1); }
      return need;
    }

    /* The piece to deal, or null to deal as usual. The hole nearest done first: picking any of the
       missing pieces, the user needing just an L to finish a hole got three or four P's meant for
       the others: "it certainly does not seem to have been looking at him being like, right, he
       needs this piece". So the deal is for the hole with fewest pieces still to come. */
    pick(holes, have = []) {
      const need = this.plan(holes, have);
      if (!need.length) return null;
      const left = new Map();
      for (const n of need) left.set(n.h, (left.get(n.h) || 0) + 1);
      const fewest = Math.min(...left.values());
      return this.C.pick(need.filter((n) => left.get(n.h) === fewest)).l;
    }

    // A crate's deal: the pick (pass no holes when the fair deal's off), and a held-back piece is a deal nearer coming back.
    next(holes, have = []) {
      const l = this.pick(holes, have);
      this.held = this.held.filter((s) => --s.n > 0);
      return l;
    }
  }

  root.DenDeal = { FairDeal, turnWide, missing };
})(typeof window !== 'undefined' ? window : globalThis);
