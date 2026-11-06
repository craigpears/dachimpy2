/* Voyage, Hole of the Day, harbour games and the workshop. Hash-routed so it stays static. */
(function () {
  'use strict';
  const C = window.Carp, R = window.Render;
  const $ = (sel, el = document) => el.querySelector(sel);
  const main = $('#main');

  // ---------- small helpers ----------
  const letterChip = (l) => `<span class="lchip" style="--pc: var(--p-${l})">${l}</span>`;
  const an = (l) => ('FLNXI'.includes(l) ? 'an ' : 'a ') + letterChip(l);
  const comboChip = (name) => `<span class="combo">${[...name].map(letterChip).join('<span class="plus">+</span>')}</span>`;
  const chips = (letters) => `<span class="chips">${letters.map(letterChip).join('')}</span>`;
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const coin = (n) => `<span class="coin" aria-hidden="true"></span><b>${n}</b>`;

  // How often each piece turns up: a word, and "about 1 in X pieces".
  const RARITY = {
    P: 'very common', F: 'common', Y: 'common', T: 'uncommon', N: 'uncommon', L: 'uncommon',
    W: 'rare', U: 'rare', V: 'rare', Z: 'rare', X: 'very rare', I: 'very rare',
  };
  const oneIn = (l) => Math.round(C.TOTAL_WEIGHT / C.WEIGHTS[l]);
  const rarityText = (l) => `${RARITY[l]} · about 1 in ${oneIn(l)} pieces`;

  // Bookmaker's odds: the best price at or under the fair one, with a small edge for the house.
  const PRICES = [[0.2, '1 to 5'], [0.25, '1 to 4'], [1 / 3, '1 to 3'], [0.5, '1 to 2'], [0.8, '4 to 5'], [1, 'evens'], [1.5, '6 to 4'], [2, '2 to 1'], [2.5, '5 to 2'], [3, '3 to 1'],
    [4, '4 to 1'], [5, '5 to 1'], [6, '6 to 1'], [8, '8 to 1'], [10, '10 to 1'], [12, '12 to 1'], [16, '16 to 1'], [20, '20 to 1']];
  // Returns null when the bet is too likely to win for the house to take it.
  const priceFor = (chance) => {
    const fair = (1 - chance) / Math.max(chance, 1e-6) * 0.92;
    return PRICES.filter(([m]) => m <= fair).pop() || null;
  };
  const QUIZ_PAY = 2, DAILY_PAY = 25;
  const threeDraws = C.threeDraws;

  // Ten-square remnants on a five-step scale, from roomy to dead.
  const FLEX = [[0.13, 5, 'Roomy'], [0.09, 4, 'Comfortable'], [0.05, 3, 'Fair'], [0.02, 2, 'Tight'], [1e-9, 1, 'Long shot'], [-1, 0, 'Dead end']];
  const flexOf = (odds) => FLEX.find(([t]) => odds >= t);
  const meter = (level) => `<span class="meter" data-l="${level}">${'<i></i>'.repeat(5)}</span>`;
  const flexBadge = (odds) => { const [, lvl, word] = flexOf(odds); return `${meter(lvl)}<span class="flex-word">${word}</span>`; };

  const store = {
    get() { try { return JSON.parse(localStorage.getItem('carp.v1')) || {}; } catch { return {}; } },
    set(v) { try { localStorage.setItem('carp.v1', JSON.stringify(v)); } catch { /* storage unavailable */ } },
    patch(k, v) { const s = this.get(); s[k] = v; this.set(s); },
  };

  /* One purse for the whole site. You earn doubloons by finishing Masterpieces and answering
     well; every bet is priced a little against you, so gambling alone slowly drains it. */
  const purse = {
    get() {
      const s = store.get();
      return s.purse ?? (s.voyage && s.voyage.purse) ?? 20;
    },
    add(n, why) {
      n = Math.round(n);
      const next = Math.max(0, this.get() + n);
      store.patch('purse', next);
      this.render();
      if (n && why) toast(`${n > 0 ? '+' : '−'}${Math.abs(n)}`, why, n > 0);
      return next;
    },
    render() {
      document.querySelectorAll('#purse-n, .purse-live').forEach((el) => { el.textContent = this.get(); });
    },
  };

  let toastTimer = null;
  function toast(amount, why, good) {
    let t = document.getElementById('toast');
    if (!t) { document.body.insertAdjacentHTML('beforeend', '<div id="toast" class="toast" role="status"></div>'); t = document.getElementById('toast'); }
    t.className = 'toast show ' + (good ? 'up' : 'down');
    t.innerHTML = `${coin(amount)}${why ? `<span>${why}</span>` : ''}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function shake(el) {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }

  const RATINGS = {
    masterpiece: { text: 'A Masterpiece!', cls: 'good' },
    craft: { text: 'Craftsmanship.', cls: 'ok' },
    fair: { text: 'A Fair Job.', cls: 'ok' },
    sloppy: { text: 'Sloppy Work.', cls: 'bad' },
    pig: { text: "A Pig's Breakfast!", cls: 'bad' },
  };

  const PIECE_NOTES = {
    P: 'The workhorse. You will see more P than anything else, so build your finishes around it.',
    F: 'Looks awkward, but it hugs ragged edges well.',
    Y: 'Long-grained, so keep it lying flat if you want the Grain bonus.',
    T: 'Good for a notch with a stem sticking out.',
    N: 'Long-grained. Slides into staggered steps.',
    L: 'Long-grained. Reliable for edges and corners.',
    W: 'A staircase. Symmetric, so it never costs Grain.',
    U: 'Caps two nubs at once.',
    V: 'A big corner. Symmetric, so Grain is free.',
    Z: 'Spend it early while holes are still roomy.',
    X: 'Rigid. Never leave a gap that only an X can fill.',
    I: 'The rarest piece. Lay it along long straight edges early. Never wait for one.',
  };

  // Every finishing pair for a remnant, drawn as small boards.
  function fillsGallery(combos, opts = {}) {
    if (!combos.length) return `<p class="dead-note">Nothing fits. This one can't be a Masterpiece.</p>`;
    return `<div class="fills">${combos.map((c) => `
      <figure class="fill${opts.highlight === c.name ? ' hl' : ''}">
        ${R.board([], c.tilings[0], { cell: opts.cell || 15, frame: 0, labels: false })}
        <figcaption>${comboChip(c.name)}</figcaption>
      </figure>`).join('')}</div>`;
  }

  // "Holding a P? An L, Y, T, V or Z finishes it."
  function partners(combos) {
    const useful = [...new Set(combos.flatMap((c) => c.letters))].sort(C.byWeight);
    return useful.map((a) => {
      const set = new Set();
      for (const c of combos) {
        const [x, y] = c.letters;
        if (x === a) set.add(y); else if (y === a) set.add(x);
      }
      return { letter: a, partners: [...set].sort(C.byWeight) };
    });
  }

  // ---------- quiz runner (harbour games) ----------
  let keyHandler = null;
  let onLeave = null; // run once when the route changes, e.g. to hand back stakes not yet played
  window.addEventListener('pagehide', () => { if (onLeave) { const f = onLeave; onLeave = null; f(); } });
  document.addEventListener('keydown', (e) => {
    if (keyHandler && !e.ctrlKey && !e.metaKey && !e.altKey && !/input|textarea/i.test(e.target.tagName)) keyHandler(e);
  });

  /* A quiz supplies gen(), prompt(q), options(q) -> [html], grade(q, i) -> rating key,
     and optionally annotate(q, j), explain(q, i) and onAnswer(q, i, el). */
  function runQuiz(el, d) {
    let q, answered;
    const stats = () => (store.get()[d.id] || { streak: 0, best: 0, right: 0, total: 0 });
    const scoreEl = () => $('.drill-score', el.parentElement);

    function scoreline() {
      const s = stats();
      return `<span>Streak <b>${s.streak}</b></span><span>Best <b>${s.best}</b></span>`;
    }

    function next() {
      q = d.gen();
      answered = false;
      el.innerHTML = `
        <div class="q-prompt">${d.prompt(q)}</div>
        <div class="options ${d.layout || 'grid'}">${d.options(q).map((html, i) => `
          <button class="opt" data-i="${i}"><span class="opt-key">${i + 1}</span>
            <span class="opt-body">${html}</span><span class="opt-note"></span></button>`).join('')}
        </div>
        <div class="feedback" hidden></div>`;
      el.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => answer(+b.dataset.i)));
      if (scoreEl()) scoreEl().innerHTML = scoreline();
    }

    function answer(i) {
      if (answered) return;
      answered = true;
      const rating = d.grade(q, i);
      const right = rating === 'masterpiece';
      const s = stats();
      s.total++;
      if (right) { s.right++; s.streak++; s.best = Math.max(s.best, s.streak); } else s.streak = 0;
      store.patch(d.id, s);
      if (right) purse.add(d.pay ? d.pay(q) : QUIZ_PAY, 'Right answer');

      el.querySelectorAll('.opt').forEach((b, j) => {
        b.disabled = true;
        b.classList.add(d.grade(q, j) === 'masterpiece' ? 'is-right' : 'is-wrong');
        if (j === i) b.classList.add('chosen');
        $('.opt-note', b).innerHTML = d.annotate ? d.annotate(q, j) : '';
      });
      if (d.onAnswer) d.onAnswer(q, i, el);
      if (!right) { shake($('.q-prompt', el)); shake(el.querySelector('.opt.chosen')); }
      const fb = $('.feedback', el);
      const r = RATINGS[rating];
      fb.hidden = false;
      fb.innerHTML = `<div class="verdict ${r.cls}">${r.text}</div>${d.explain ? d.explain(q, i) : ''}
        <button class="btn next">Next <kbd>Enter</kbd></button>`;
      $('.next', fb).addEventListener('click', next);
      if (scoreEl()) scoreEl().innerHTML = scoreline();
    }

    keyHandler = (e) => {
      const n = parseInt(e.key, 10);
      if (!answered && n >= 1 && n <= el.querySelectorAll('.opt').length) { answer(n - 1); e.preventDefault(); }
      else if (answered && (e.key === 'Enter' || e.key === ' ')) { next(); e.preventDefault(); }
    };
    next();
    return { next };
  }

  function quizPage(d) {
    main.innerHTML = `
      <article class="drill-page">
        <header class="page-head">
          <p class="eyebrow">Harbour games</p>
          <h1>${d.title}</h1>
          <p class="lede">${d.lede}</p>
          ${d.controls ? d.controls() : ''}
          <div class="drill-score"></div>
        </header>
        <section class="drill"></section>
      </article>`;
    const quiz = runQuiz($('.drill', main), d);
    if (d.bindControls) d.bindControls(main, quiz);
  }

  // Percentages are kept for the odds working, where the sums need them.
  const pct = (x) => (x >= 0.995 ? '100%' : x > 0 && x < 0.01 ? 'under 1%' : `${Math.round(x * 100)}%`);

  // One gap's odds, step by step: first piece in, then the last gap.
  function workingHtml(o, n) {
    const w = C.finishWorking(o.cells);
    if (!w.starters.length) return `<div class="work"><h4>Gap ${n}: 0%</h4><p>No piece fits in it cleanly.</p></div>`;
    return `<div class="work"><h4>Gap ${n}: ${pct(w.chance)}</h4>
      <table><thead><tr><th>First piece</th><th>Turns up</th><th>Leaves a gap for</th><th>Found in 3 draws</th></tr></thead><tbody>
      ${w.starters.map((x) => `<tr><td>${letterChip(x.letter)}</td><td>1 in ${oneIn(x.letter)}</td><td>${letterChip(x.leaves)}</td><td>${pct(x.then)}</td></tr>`).join('')}
      </tbody></table>
      <p>Between them, the first pieces are ${pct(w.share)} of the pile, so three draws find one ${pct(w.first)} of the time.
        On average the last gap is then found ${pct(w.then)} of the time.</p>
      <p class="sum">${pct(w.first)} × ${pct(w.then)} = <b>${pct(w.chance)}</b></p></div>`;
  }

  const PAIR_MAX = 4; // five-piece holes are slow to grow and have too many answers
  const pairSize = () => Math.min(PAIR_MAX, Math.max(2, store.get().pairSize || 2));

  const QUIZZES = {
    name: {
      id: 'name', layout: 'letters',
      gen: C.genNameQuiz,
      prompt: (q) => `<div class="solo-piece">${R.piece(q.letter, q.cells, { cell: 30, pad: 4 })}</div><p class="ask">Which piece is this?</p>`,
      options: (q) => q.options.map((l) => `<span class="big-letter">${l}</span>`),
      grade: (q, i) => (q.options[i] === q.letter ? 'masterpiece' : 'sloppy'),
      explain: (q) => `<p>${letterChip(q.letter)} <b>${q.letter}</b> is ${RARITY[q.letter]}: about 1 in ${oneIn(q.letter)} pieces. ${PIECE_NOTES[q.letter]}</p>`,
    },

    pair: {
      id: 'pair', title: 'Which pair fits?',
      lede: 'Exactly one of these sets of pieces drops into the hole cleanly. Turn and flip them in your head. Slide for bigger holes: they pay more.',
      layout: 'pairs',
      gen: () => C.genPairQuiz(pairSize()),
      // Two pieces pay 1 doubloon, and every extra piece adds another.
      pay: (q) => q.size - 1,
      controls: () => `<label class="size-pick">Pieces to finish it
          <input type="range" min="2" max="${PAIR_MAX}" step="1" value="${pairSize()}">
          <b class="size-n"></b><span class="size-pay"></span></label>`,
      bindControls: (root, quiz) => {
        const input = $('.size-pick input', root);
        const show = () => {
          $('.size-n', root).textContent = input.value;
          $('.size-pay', root).innerHTML = `pays ${coin(input.value - 1)}`;
        };
        show();
        input.addEventListener('input', show);
        input.addEventListener('change', () => { store.patch('pairSize', +input.value); quiz.next(); });
      },
      prompt: (q) => `<div class="hole-wrap">${R.board(q.cells, [], { cell: q.size > 3 ? 34 : 40 })}</div>
        <p class="ask">Which ${q.size === 2 ? 'pair' : `${q.size} pieces`} fill${q.size === 2 ? 's' : ''} it?</p>`,
      options: (q) => q.options.map((o) => `<span class="pair-tray">${[...o.name].map((l) => R.piece(l, C.pick(C.ORIENTS_BY_LETTER[l]).cells, { cell: q.size > 3 ? 10 : q.size > 2 ? 12 : 15 })).join('')}</span>`),
      grade: (q, i) => (q.options[i].correct ? 'masterpiece' : 'sloppy'),
      annotate: (q, j) => comboChip(q.options[j].name),
      // Drop the right pair into the hole so you see how it goes.
      onAnswer: (q, i, el) => {
        const ans = q.options.find((o) => o.correct).name;
        const combo = q.stats.combos.find((c) => c.name === ans);
        $('.hole-wrap', el).innerHTML = R.board(q.cells, combo.tilings[0].map((p) => ({ ...p, fresh: true })), { cell: 40 });
      },
      explain: (q) => {
        const ans = q.options.find((o) => o.correct).name;
        const others = q.stats.combos.filter((c) => c.name !== ans);
        const set = q.size === 2 ? 'pair' : 'set';
        return others.length
          ? `<p class="also">${plural(others.length, `other ${set}`)} would also have done it:</p>${fillsGallery(others)}`
          : `<p class="also">That was the only ${set} that fits.</p>`;
      },
    },

    remnant: {
      id: 'remnant', title: 'Which gap would you rather leave?',
      lede: "You can steer a hole towards any of these endings. Pick the one you're most likely to finish cleanly.",
      gen: C.genRemnantQuiz,
      prompt: () => '',
      options: (q) => q.options.map((o) => R.board(o.cells, [], { cell: 26 })),
      grade: (q, i) => {
        const c = C.finishChance(q.options[i].cells), best = Math.max(...q.options.map((x) => C.finishChance(x.cells)));
        if (q.options[i].correct) return 'masterpiece';
        if (c === 0) return 'pig';
        return c >= best * 0.6 ? 'craft' : 'fair';
      },
      annotate: (q, j) => {
        const s = q.options[j].stats;
        return `<span class="pct-line"><b>${pct(C.finishChance(q.options[j].cells))}</b> finished</span>${s.useful.length ? chips(s.useful) : ''}`;
      },
      explain: (q, i) => {
        const best = q.options.find((o) => o.correct);
        const shown = [...new Set([q.options[i], best])];
        return `<p>The best gap can be finished by ${plural(best.stats.combos.length, 'different pair')}:</p>${fillsGallery(best.stats.combos)}
          <details class="working"><summary>How the odds are worked out</summary>
            <p class="hint">You get three draws to find a piece that fits, and three more for the last gap.</p>
            ${shown.map((o) => workingHtml(o, q.options.indexOf(o) + 1)).join('')}
          </details>
          <p class="hint">Look for gaps that <b>P</b>, <b>F</b> and <b>Y</b> can finish. They're the pieces you see most.</p>`;
      },
    },
  };

  // ---------- the hole run: fill a whole hole, one dealt piece at a time ----------
  const LINES = {
    best: ['Shipshape!', 'Lovely work.', "That's the spot."],
    good: ['Solid.', 'Good enough to sail.', 'Nicely done.'],
    tight: ['Getting tight…', 'Hmm, that boxes you in.'],
    risky: ['Living dangerously!', "You'll need some luck now."],
    dead: ['Dead end! Nothing fits what\'s left.'],
  };
  const AUTO_MS = 3500; // long enough to read the feedback before the next piece
  const TAGS = { best: 'Best', good: 'Good', tight: 'Tight', risky: 'Risky', dead: 'Dead end' };
  const SHARE = { best: '🟩', good: '🟨', tight: '🟧', risky: '🟥', dead: '⬛' };

  // "about 4 times in 10", "about 1 time in 25", in words rather than percentages.
  function timesText(c) {
    if (c >= 0.95) return 'almost every time';
    if (c >= 0.1) return `about ${Math.round(c * 10)} times in 10`;
    if (c > 0) return `about 1 time in ${Math.round(1 / c)}`;
    return 'never';
  }

  // The plain odds behind a grade.
  function oddsLine(o) {
    const c = C.finishChance(o.rest, o.held);
    return c >= 1 ? 'Finishes for sure' : `Finishes ${timesText(c)}`;
  }

  // Why the green option beat yours, in the same plain odds.
  function whyBetter(o, best) {
    const a = C.finishChance(o.rest, o.held), b = C.finishChance(best.rest, best.held);
    return `Yours finishes ${timesText(a)}; the green one ${b >= 1 ? 'every time' : timesText(b)}.`;
  }

  // What a placement leaves behind, in the words a carpenter would use.
  function leavesText(o, minRagged) {
    const info = o.info;
    if (info.gap !== undefined) {
      if (!info.gap) return 'Leaves a gap no piece fits';
      return `Leaves a gap for ${an(info.gap)}${o.held.includes(info.gap) ? ", and you're holding one!" : ''}`;
    }
    let text;
    if (!info.ways) text = 'Nothing can finish it';
    else if (o.name) text = `Leaves a <b>${o.name}</b>`;
    else if (o.rest.length === 10) text = `Finished by ${chips(info.useful)}`;
    else if (o.neck) text = 'Cuts a bottleneck';
    else if (o.ragged <= minRagged) text = 'Keeps it square';
    else text = 'Leaves ragged edges';
    return text + (o.held.length ? `<br><span class="keeps">Keeps ${o.held.map(an).join(' and ')}</span>` : '');
  }
  const optionNote = (o, minRagged) => `${leavesText(o, minRagged)}<br><span class="odds-line">${oddsLine(o)}</span>`;

  /* opts: size, deal (pieces per step), storm, bet (purse to wager from or null),
           header() -> html, onDone(result), seed (for the daily), replay ([choice indexes]), onChoice(i) */
  function holeRun(el, opts) {
    if (opts.seed != null) C.useSeed(opts.seed);
    const grown = C.genHole(opts.size, opts.core ? C.pickCore() : null);
    const hole = grown.hole;
    let remaining = hole, placed = [], steps = [], deal = null, chosen = false;
    let held = []; // with a bigger toolbox, the pieces you didn't play stay
    const replay = (opts.replay || []).slice();
    let autoTimer = null;
    // Training wheels: outline the good ten-square finish hiding inside the hole.
    const target = () => (opts.hint && grown.core && remaining.length > 10 ? grown.core : null);

    const boardHtml = (fresh) => R.board(remaining, placed.map((p, i) => ({ ...p, fresh: fresh && i === placed.length - 1 })), { cell: 38, labels: false, target: target() });
    const trail = () => `<div class="trail">${steps.map((g) => `<span class="pip ${g}" title="${TAGS[g]}"></span>`).join('')}</div>`;

    function step(freshBoard) {
      chosen = false;
      if (remaining.length === 5) return drawStage(freshBoard);
      deal = C.dealStep(remaining, opts.deal || 1, opts.storm, held);
      if (!deal) { steps.push('dead'); return deadEnd(); }
      if (replay.length) return choose(replay.shift(), true);
      const many = deal.letters.length > 1;
      const minRagged = Math.min(...deal.options.map((o) => o.ragged));
      el.innerHTML = `
        ${opts.header()}
        <div class="run-top">
          <div class="hole-wrap big">${boardHtml(freshBoard)}</div>
          <div class="run-side">
            <p class="label">${many ? 'Your toolbox' : 'Dealt to you'}</p>${R.toolbox(deal.letters)}
            ${deal.pickOne ? '<p class="hint small">Pick one to play. The other goes back on the pile.</p>'
              : many ? `<p class="hint small">Play one. The ${deal.letters.length > 2 ? 'others stay' : 'other stays'} in your toolbox for later.</p>` : ''}
            ${deal.skipped ? `<p class="hint small">${deal.skipped >= 12 ? 'A few pieces' : plural(deal.skipped, 'piece')} went into your other holes first.</p>` : ''}
            ${target() ? '<p class="hint small"><span class="target-key"></span> A good finish hides inside. Work from the outside in to reach it.</p>' : ''}
            <p class="squares"><b>${remaining.length}</b> squares to go</p>${trail()}
          </div>
        </div>
        <p class="ask">${many ? 'Which piece, and where?' : `Where does the ${letterChip(deal.letters[0])} go?`}</p>
        <div class="options run-opts">${deal.options.map((o, i) => `
          <button class="opt" data-i="${i}"><span class="opt-key">${i + 1}</span>
            <span class="opt-body">${R.board(o.rest, placed.concat({ letter: o.letter, cells: o.piece, fresh: true }), { cell: 20, labels: false, target: target() })}</span>
            <span class="opt-note"></span></button>`).join('')}
        </div>
        <div class="feedback" hidden></div>`;
      el.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => choose(+b.dataset.i)));
      el.dataset.minRagged = minRagged;
      keyHandler = (e) => {
        const n = parseInt(e.key, 10);
        if (!chosen && n >= 1 && n <= deal.options.length) { choose(n - 1); e.preventDefault(); }
        else if (chosen && (e.key === 'Enter' || e.key === ' ')) { advance(); e.preventDefault(); }
      };
    }

    function choose(i, silent) {
      if (chosen) return;
      chosen = true;
      const o = deal.options[i];
      steps.push(o.grade);
      placed = placed.concat({ letter: o.letter, cells: o.piece });
      remaining = o.rest;
      held = o.held;
      if (!silent && opts.onChoice) opts.onChoice(i);
      if (silent) return o.grade === 'dead' ? deadEnd(true) : step();

      el.querySelectorAll('.opt').forEach((b, j) => {
        const x = deal.options[j];
        b.disabled = true;
        b.classList.add('g-' + x.grade);
        if (j === i) b.classList.add('chosen');
        $('.opt-note', b).innerHTML = `<span class="tag-grade ${x.grade}">${TAGS[x.grade]}</span><span class="leaves">${optionNote(x, +el.dataset.minRagged)}</span>`;
      });
      $('.hole-wrap', el).innerHTML = boardHtml(true);
      $('.run-side .trail', el).outerHTML = trail();
      $('.squares', el).innerHTML = `<b>${remaining.length}</b> squares to go`;
      if (o.grade === 'dead' || o.grade === 'risky') shake($('.hole-wrap', el));

      const fb = $('.feedback', el);
      fb.hidden = false;
      const good = o.grade === 'best' || o.grade === 'good';
      const bestOpt = deal.options.find((x) => x.grade === 'best');
      fb.innerHTML = `<div class="verdict ${good ? 'good' : o.grade === 'tight' ? 'ok' : 'bad'}">${pickOne(LINES[o.grade])}</div>
        ${o.name ? `<p>That leaves a <b>${o.name}</b>, one of the classic two-piece finishes.</p>` : ''}
        ${o.grade !== 'best' && bestOpt ? `<p class="hint">The green option was stronger${bestOpt.name ? `: it leaves a <b>${bestOpt.name}</b>` : ''}. ${whyBetter(o, bestOpt)}</p>` : ''}
        <button class="btn next">${o.grade === 'dead' ? 'See the damage' : 'Next piece'} <kbd>Enter</kbd></button>
        ${good ? '<span class="auto"><i></i></span>' : ''}`;
      $('.next', fb).addEventListener('click', advance);
      // Quick-fire: good moves roll straight on.
      if (good) autoTimer = setTimeout(advance, AUTO_MS);
    }

    function advance() {
      clearTimeout(autoTimer);
      if (!chosen) return;
      if (steps[steps.length - 1] === 'dead') deadEnd(); else step(true);
    }

    function deadEnd() {
      const result = { masterpiece: false, steps, hole, placed, remaining, dead: true };
      el.innerHTML = `${opts.header()}
        <div class="run-top"><div class="hole-wrap big">${boardHtml()}</div>
          <div class="run-side"><div class="verdict bad">Dead end.</div>
          <p>No piece can fill what's left exactly. You'd have to overlap with extra pieces, so this hole won't be a Masterpiece.</p>${trail()}</div></div>
        <button class="btn next">Carry on <kbd>Enter</kbd></button>`;
      shake($('.hole-wrap', el));
      finish(result);
    }

    function drawStage(fresh) {
      const gap = C.identify(remaining);
      if (held.includes(gap)) return savedFinish(gap);
      const offer = priceFor(threeDraws(gap));
      const [mult, price] = offer || [0, ''];
      const wallet = opts.bet && offer ? opts.bet() : null;
      let stake = 0;
      el.innerHTML = `
        ${opts.header()}
        <div class="run-top">
          <div class="hole-wrap big">${boardHtml(fresh)}</div>
          <div class="run-side">
            <p class="label">The last gap needs</p>
            <div class="need">${R.piece(gap, remaining, { cell: 18 })}<div><b>${an(gap)}</b><br><span class="hint">About 1 in ${oneIn(gap)} pieces is ${an(gap)}.<br>With three draws, one turns up ${timesText(threeDraws(gap))}.</span></div></div>
            ${trail()}
          </div>
        </div>
        <div class="draw-zone">
          <p class="ask">You get three draws. Do you think ${an(gap)} will turn up?</p>
          ${wallet != null ? `
            <div class="bet">
              <p class="label">Bet your doubloons · pays ${price}</p>
              <div class="stakes">${[0, 5, 10, 25].filter((v) => v <= wallet).map((v) => `<button class="stake${v === 0 ? ' on' : ''}" data-v="${v}">${v ? coin(v) : 'No bet'}</button>`).join('')}
              ${wallet > 0 ? `<button class="stake" data-v="${wallet}">All in · ${coin(wallet)}</button>` : ''}</div>
            </div>` : opts.bet && !offer ? '<p class="hint">The bookie won\'t take bets on a sure thing.</p>' : ''}
          <div class="cards">${[0, 1, 2].map((i) => `<div class="card" data-i="${i}"><div class="card-in"><div class="face back"></div><div class="face front"></div></div></div>`).join('')}</div>
          <button class="btn draw">Draw! <kbd>Enter</kbd></button>
        </div>`;
      el.querySelectorAll('.stake').forEach((b) => b.addEventListener('click', () => {
        stake = +b.dataset.v;
        el.querySelectorAll('.stake').forEach((x) => x.classList.toggle('on', x === b));
      }));
      let drawing = false;
      const go = () => { if (!drawing) { drawing = true; draw(gap, () => stake, mult); } };
      $('.draw', el).addEventListener('click', go);
      keyHandler = (e) => { if (e.key === 'Enter' || e.key === ' ') { go(); e.preventDefault(); } };
    }

    // You kept exactly the piece the last gap needs: no draw, no bet, just drop it in.
    function savedFinish(gap) {
      C.useSeed(null);
      placed = placed.concat({ letter: gap, cells: remaining });
      const gapCells = remaining;
      remaining = [];
      el.innerHTML = `${opts.header()}
        <div class="run-top"><div class="hole-wrap big glow">${R.board(remaining, placed.map((p, i) => ({ ...p, fresh: i === placed.length - 1 })), { cell: 38, labels: false })}</div>
          <div class="run-side"><div class="verdict good">A Masterpiece!</div>
          <p>You saved ${an(gap)} for exactly this gap. No waiting, no luck needed.</p>
          <p class="hint">This is the habit the best carpenters have: keep the common piece and spend the awkward ones early.</p>${trail()}</div></div>
        <button class="btn next">Carry on <kbd>Enter</kbd></button>`;
      finish({ masterpiece: true, steps, hole, placed, remaining, drawsUsed: 0, betDelta: 0, gapCells });
    }

    function draw(gap, getStake, mult) {
      const stake = getStake();
      $('.draw', el).disabled = true;
      el.querySelectorAll('.stake').forEach((b) => { b.disabled = true; });
      const draws = [0, 1, 2].map(() => C.dealLetter(false));
      const hitAt = draws.indexOf(gap);
      const shown = hitAt === -1 ? 3 : hitAt + 1;
      C.useSeed(null);
      let i = 0;
      const flipNext = () => {
        const card = el.querySelector(`.card[data-i="${i}"]`);
        const l = draws[i];
        $('.front', card).innerHTML = R.piece(l, null, { cell: 12, box: 70 }) + `<span>${l}</span>`;
        card.classList.add('flipped');
        if (l === gap) card.classList.add('hit');
        i++;
        if (i < shown) setTimeout(flipNext, 650);
        else setTimeout(() => settle(hitAt !== -1, stake, mult, hitAt), 700);
      };
      setTimeout(flipNext, 200);
    }

    function settle(hit, stake, mult, hitAt) {
      const gapCells = remaining;
      if (hit) {
        placed = placed.concat({ letter: C.identify(gapCells), cells: gapCells });
        remaining = [];
        $('.hole-wrap', el).innerHTML = boardHtml(true);
        $('.hole-wrap', el).classList.add('glow');
      } else {
        shake($('.hole-wrap', el));
        el.querySelectorAll('.card').forEach((c) => c.classList.add('miss'));
      }
      const won = stake ? (hit ? Math.round(stake * mult) : -stake) : 0;
      const zone = $('.draw-zone', el);
      zone.insertAdjacentHTML('beforeend', `<div class="settle">
        <div class="verdict ${hit ? 'good' : 'bad'}">${hit ? 'A Masterpiece!' : 'No luck.'}</div>
        <p>${hit ? `It turned up on draw ${hitAt + 1}.` : `No ${letterChip(C.identify(gapCells))} in three draws. The hole sat too long, so you'd finish it with extra pieces.`}
        ${stake ? (hit ? ` Your bet pays ${coin('+' + won)}.` : ` You lose your ${coin(stake)}.`) : ''}</p>
        <button class="btn next">Carry on <kbd>Enter</kbd></button></div>`);
      finish({ masterpiece: hit, steps, hole, placed, remaining, drawsUsed: hit ? hitAt + 1 : 3, betDelta: won });
    }

    function finish(result) {
      C.useSeed(null);
      const btn = el.querySelector('.next');
      const done = () => { keyHandler = null; opts.onDone(result); };
      btn.addEventListener('click', done);
      keyHandler = (e) => { if (e.key === 'Enter' || e.key === ' ') { done(); e.preventDefault(); } };
      if (opts.onFinish) opts.onFinish(result);
    }

    step();
  }

  // ---------- Hole of the Day ----------
  const EPOCH = Date.UTC(2026, 10, 1);
  function today() {
    const d = new Date();
    return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 864e5) + 1;
  }

  function shareText(n, r) {
    const end = r.dead ? '⬛ dead end' : r.masterpiece ? `⭐ Masterpiece on draw ${r.drawsUsed}` : '💨 missed the draw';
    return `Hole of the Day #${n}\n${r.steps.map((g) => SHARE[g]).join('')} ${end}`;
  }

  function dailyPage() {
    const n = today();
    const saved = store.get().daily || {};
    const mine = saved.day === n && saved.v === 4 ? saved : { day: n, v: 4, choices: [] };
    const streak = store.get().dailyStreak || { last: 0, count: 0 };

    const header = () => `<header class="run-bar"><span class="eyebrow">Hole of the Day</span><b>#${n}</b>
      <span class="hint">Same hole for everyone today</span></header>`;

    function showResult(r) {
      const text = shareText(n, r);
      main.innerHTML = `<article class="daily-done">
        ${header()}
        <div class="run-top">
          <div class="hole-wrap big ${r.masterpiece ? 'glow' : ''}">${R.board(r.remaining, r.placed, { cell: 38, labels: false })}</div>
          <div class="run-side">
            <div class="verdict ${r.masterpiece ? 'good' : 'bad'}">${r.masterpiece ? 'A Masterpiece!' : r.dead ? 'Dead end.' : 'So close.'}</div>
            <pre class="share">${text}</pre>
            <button class="btn copy">Copy result</button>
            <p class="hint">Daily streak <b>${streak.count}</b> · a new hole tomorrow.</p>
          </div>
        </div>
        <p><a class="btn ghost" href="#/">Set sail on the voyage →</a></p>
      </article>`;
      $('.copy', main).addEventListener('click', async (e) => {
        try { await navigator.clipboard.writeText(text); e.target.textContent = 'Copied!'; } catch { e.target.textContent = 'Select the text to copy'; }
      });
    }

    if (mine.result) return showResult(mine.result);

    main.innerHTML = `<article><section class="run"></section></article>`;
    holeRun($('.run', main), {
      size: 4, deal: 3, core: true, seed: 7919 * n + 13, header, replay: mine.choices,
      bet: () => purse.get(),
      onChoice: (i) => { mine.choices.push(i); store.patch('daily', mine); },
      onFinish: (r) => {
        if (r.betDelta) purse.add(r.betDelta, r.betDelta > 0 ? 'Bet won' : 'Bet lost');
        if (r.masterpiece) purse.add(DAILY_PAY, 'Daily Masterpiece');
        mine.result = { masterpiece: r.masterpiece, steps: r.steps, dead: !!r.dead, drawsUsed: r.drawsUsed, placed: r.placed, remaining: r.remaining };
        store.patch('daily', mine);
        const s = store.get().dailyStreak || { last: 0, count: 0 };
        if (s.last !== n) store.patch('dailyStreak', { last: n, count: r.masterpiece ? (s.last === n - 1 ? s.count + 1 : 1) : 0 });
      },
      onDone: () => dailyPage(),
    });
  }

  // ---------- the betting table: four holes, one pile, bets between every piece ----------
  const TABLE_DRAWS = 5, STAKE_STEP = 5, HOLE_NAMES = 'ABCD';

  // What a hole still needs, given how far it has got.
  function needsText(h, st) {
    if (st.done) return '<p class="t-need">Finished!</p>';
    if (st.need) return `<p class="t-need">Needs ${an(st.need)}</p><p class="hint small">About 1 in ${oneIn(st.need)} pieces</p>`;
    return `<p class="t-need">${h.name ? `A <b>${h.name}</b>` : 'Ten squares'}: two pieces</p>
      <p class="hint small">Starts with ${chips(h.useful)}</p>`;
  }

  /* Like in-play betting: five pieces come off the pile one at a time, and before each one you
     can back any open hole at the price going right then. Prices move as the table changes. */
  function betPage() {
    let topUp = false;
    if (purse.get() < STAKE_STEP) { purse.add(10 - purse.get(), 'From the quartermaster'); topUp = true; }
    const holes = C.genBetTable(TABLE_DRAWS);
    const state = C.tableState(holes);
    const bets = holes.map(() => []); // placed bets: { amt, mult }
    const pending = holes.map(() => 0); // stakes you're adding before the next piece
    let drawsLeft = TABLE_DRAWS, prices = [], busy = false;
    const pendingTotal = () => pending.reduce((a, b) => a + b, 0);
    const backed = (i) => bets[i].reduce((a, b) => a + b.amt, 0);
    const returns = (i) => bets[i].reduce((a, b) => a + Math.round(b.amt * (1 + b.mult)), 0);
    // When two holes need the same piece, the one with more riding on it gets it.
    const order = () => holes.map((_, i) => i).sort((a, b) => backed(b) + pending[b] - backed(a) - pending[a] || a - b);
    const holeBoard = (i, fresh) => R.board(state[i].rest, state[i].placed.map((p, j) => ({ ...p, fresh: fresh && j === state[i].placed.length - 1 })), { cell: 22, labels: false });

    // Price every open hole for the pieces still to come. A longer run than the generator's keeps the house edge honest.
    function reprice() {
      const chances = C.tableChances(holes, drawsLeft, 3000, state, order());
      prices = holes.map((_, i) => (state[i].done || !drawsLeft ? null : priceFor(chances[i])));
    }

    main.innerHTML = `
      <article class="bet-page">
        <header class="page-head">
          <p class="eyebrow">Harbour games</p>
          <h1>Place your bets</h1>
          <p class="lede">Four holes, one pile of timber. ${TABLE_DRAWS} pieces come off the pile, one at a time. Each goes into a hole it finishes; otherwise it starts a two-piece hole, or it's a spare. A piece only fills one hole, so if two holes need the same piece, it goes to the one with more of your money on it. Bet before every piece: the prices move as the holes fill.</p>
        </header>
        ${topUp ? '<p class="hint">Your purse ran dry, so the quartermaster spots you 10 doubloons. Masterpieces on the voyage and in Hole of the Day earn far more.</p>' : ''}
        <div class="purse-bar bet-purse"><span>Your purse ${coin(`<span class="purse-live">${purse.get()}</span>`)}</span><span>On this piece ${coin('<span class="staked-n">0</span>')}</span><span class="hint">The house always keeps a small edge. Masterpieces are how you really earn.</span></div>
        <div class="table-holes">${holes.map((h, i) => `
          <div class="tcard" data-i="${i}">
            <div class="t-head"><span class="t-name">${HOLE_NAMES[i]}</span><span class="t-price"></span></div>
            <div class="hole-wrap t-board">${holeBoard(i)}</div>
            <div class="t-needs"></div>
            <div class="t-stake"><button class="sbtn minus" aria-label="Take ${STAKE_STEP} off ${HOLE_NAMES[i]}">−</button>
              <span class="t-amt">${coin('<span class="amt-n">0</span>')}</span>
              <button class="sbtn plus" aria-label="Add ${STAKE_STEP} on ${HOLE_NAMES[i]}">+${STAKE_STEP}</button></div>
            <div class="t-backed hint small"></div>
            <div class="t-result"></div>
          </div>`).join('')}</div>
        <div class="draw-zone">
          <div class="cards">${Array.from({ length: TABLE_DRAWS }, (_, i) => `<div class="card-slot"><div class="card" data-i="${i}"><div class="card-in"><div class="face back"></div><div class="face front"></div></div></div><span class="card-cap"></span></div>`).join('')}</div>
          <button class="btn draw"></button>
          <div class="settle" hidden></div>
        </div>
      </article>`;

    const cards = main.querySelectorAll('.tcard');

    function paint() {
      holes.forEach((h, i) => {
        const c = cards[i], st = state[i], price = prices[i];
        $('.t-price', c).innerHTML = st.done ? '' : price ? `pays <b>${price[1]}</b>` : drawsLeft ? 'No bets: too likely' : '';
        $('.t-needs', c).innerHTML = needsText(h, st);
        $('.t-stake', c).hidden = !price && !pending[i];
        $('.amt-n', c).textContent = pending[i];
        c.classList.toggle('backed', backed(i) + pending[i] > 0);
        $('.t-backed', c).innerHTML = bets[i].length && !st.done && drawsLeft
          ? `Backed ${coin(backed(i))} · returns ${coin(returns(i))} if finished` : '';
      });
      $('.staked-n', main).textContent = pendingTotal();
      const d = $('.draw', main);
      d.hidden = !drawsLeft;
      d.innerHTML = `Draw piece ${TABLE_DRAWS - drawsLeft + 1} of ${TABLE_DRAWS} <kbd>Enter</kbd>`;
    }

    // Stakes leave the purse as you place them, so the purse always shows what you have left.
    function setStake(i, d) {
      if (busy || (!prices[i] && d > 0)) return;
      const step = Math.max(-pending[i], Math.min(d, purse.get()));
      if (!step) return;
      pending[i] += step;
      purse.add(-step);
      reprice();
      paint();
    }
    onLeave = () => { if (pendingTotal()) purse.add(pendingTotal()); };
    cards.forEach((c, i) => {
      $('.plus', c).addEventListener('click', () => setStake(i, STAKE_STEP));
      $('.minus', c).addEventListener('click', () => setStake(i, -STAKE_STEP));
    });

    function draw() {
      if (busy || !drawsLeft) return;
      busy = true;
      // Lock in this round's stakes at the prices showing now.
      // A stake on a hole the bookie has stopped pricing goes back to the purse.
      holes.forEach((_, i) => {
        if (pending[i]) { if (prices[i]) bets[i].push({ amt: pending[i], mult: prices[i][0] }); else purse.add(pending[i]); }
        pending[i] = 0;
      });
      main.querySelectorAll('.sbtn').forEach((b) => { b.disabled = true; });
      $('.draw', main).disabled = true;

      const n = TABLE_DRAWS - drawsLeft;
      const l = C.weightedLetter();
      const card = main.querySelector(`.card[data-i="${n}"]`);
      $('.front', card).innerHTML = R.piece(l, null, { cell: 12, box: 70 }) + `<span>${l}</span>`;
      card.classList.add('flipped');
      const i = C.tableDraw(holes, state, l, order());
      drawsLeft--;
      setTimeout(() => {
        const cap = card.parentElement.querySelector('.card-cap');
        if (i < 0) { cap.textContent = 'Spare'; card.classList.add('miss'); }
        else {
          cap.innerHTML = `Into <b>${HOLE_NAMES[i]}</b>`;
          $('.t-board', cards[i]).innerHTML = holeBoard(i, true);
          if (state[i].done) {
            card.classList.add('hit');
            cards[i].classList.add('done');
            $('.t-board', cards[i]).classList.add('glow');
            const win = returns(i);
            $('.t-result', cards[i]).innerHTML = `<span class="tag-grade best">Finished</span>${win ? ` ${coin('+' + (win - backed(i)))}` : ''}`;
            if (win) purse.add(win, `Hole ${HOLE_NAMES[i]} pays out, stake back included`);
          }
        }
        reprice();
        busy = false;
        main.querySelectorAll('.sbtn').forEach((b) => { b.disabled = false; });
        $('.draw', main).disabled = false;
        paint();
        if (!drawsLeft) settle();
      }, 450);
    }

    function settle() {
      let lost = 0;
      holes.forEach((_, i) => {
        if (state[i].done) return;
        const s = backed(i);
        lost += s;
        $('.t-result', cards[i]).innerHTML = `<span class="tag-grade risky">Bodged</span>${s ? ` ${coin(-s)}` : ''}`;
        if (s) shake($('.t-board', cards[i]));
      });
      const staked = holes.reduce((a, _, i) => a + backed(i), 0);
      const won = holes.reduce((a, _, i) => a + (state[i].done ? returns(i) : 0), 0);
      const net = won - staked;
      const fin = holes.map((_, i) => (state[i].done ? HOLE_NAMES[i] : null)).filter(Boolean);
      const box = $('.settle', main);
      box.hidden = false;
      box.innerHTML = `<div class="verdict ${net > 0 ? 'good' : net < 0 ? 'bad' : 'ok'}">${net > 0 ? `You're up ${coin(net)}` : net < 0 ? `You're down ${coin(-net)}` : staked ? 'You break even.' : 'No bets this time.'}</div>
        <p>${fin.length ? `Finished: <b>${fin.join(', ')}</b>.` : 'Nothing got finished.'} ${lost ? `The bodged holes cost you ${coin(lost)}.` : ''}</p>
        <button class="btn next">Next table <kbd>Enter</kbd></button>`;
      $('.next', box).addEventListener('click', betPage);
    }

    reprice();
    paint();
    $('.draw', main).addEventListener('click', draw);
    keyHandler = (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (drawsLeft) draw(); else if ($('.next', main)) betPage();
    };
  }

  // ---------- the voyage ----------
  /* The trail starts at the very end of a hole and works backwards: each port moves the
     start one piece further out from a good two-piece finish. */
  const PORTS = [
    { id: 'quay', name: 'Driftwood Quay', size: 2, deal: 1, core: true, x: 110, y: 250,
      tip: "We start at the very end of a hole: ten squares, two pieces. Place the first so the gap left over is a shape you'll see often. A P-shaped gap is the best of all." },
    { id: 'bay', name: 'Barnacle Bay', size: 3, deal: 1, core: true, hint: true, x: 285, y: 115,
      tip: "Same endings, one piece further back. The dashed outline marks a good finish hiding in the hole. Fill the outside so that shape is what's left." },
    { id: 'reef', name: 'Tarpot Reef', size: 3, deal: 2, core: true, x: 460, y: 245,
      tip: "Now you hold two pieces, and the one you don't play stays for later. Put the awkward piece into the odd corner and keep the P for the finish. If you're holding exactly what the last gap needs, it's a Masterpiece with no luck needed." },
    { id: 'strait', name: 'Gullwing Strait', size: 4, deal: 2, core: true, hint: true, x: 635, y: 110,
      tip: 'Twenty squares, two steps back. The outline returns to show you where you are heading. Square off the hole from the outside in, and don\'t cut across it.' },
    { id: 'maw', name: "Kraken's Maw", size: 4, deal: 3, storm: true, x: 805, y: 235,
      tip: "A full toolbox of three, like the real puzzle, and storm timber: X, I and their friends turn up far more often. No outlines. Spend the awkward pieces in the odd corners while the hole is big, and keep your P close." },
  ];
  const HOLES_PER_PORT = 3;

  function voyage() {
    return Object.assign({ unlocked: 1, stars: {}, streak: 0 }, store.get().voyage || {});
  }
  const saveVoyage = (v) => store.patch('voyage', v);

  function mapSvg(v) {
    const pts = PORTS.map((p) => [p.x, p.y]);
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      d += ` C${x0 + 80} ${y0}, ${x1 - 80} ${y1}, ${x1} ${y1}`;
    }
    const cur = Math.min(v.unlocked, PORTS.length) - 1;
    return `<svg class="map" viewBox="0 0 900 340" role="img" aria-label="Voyage map">
      <rect width="900" height="340" rx="16" class="sea"/>
      ${Array.from({ length: 14 }, (_, i) => `<path class="wave" d="M${(i * 137) % 860 + 10} ${(i * 71) % 300 + 20}q8 -6 16 0t16 0"/>`).join('')}
      <path d="${d}" class="route"/>
      ${PORTS.map((p, i) => {
        const open = i < v.unlocked, stars = v.stars[p.id] || 0;
        return `<a href="${open ? '#/port/' + p.id : '#/'}" class="isle ${open ? 'open' : 'locked'}${i === cur ? ' current' : ''}" aria-label="${p.name}">
          ${i === cur ? `<circle cx="${p.x}" cy="${p.y}" r="44" class="ring"/>` : ''}
          <ellipse cx="${p.x}" cy="${p.y + 6}" rx="40" ry="20" class="sand"/>
          <ellipse cx="${p.x - 4}" cy="${p.y}" rx="26" ry="13" class="grass"/>
          <text x="${p.x}" y="${p.y + 46}" class="isle-name">${open ? p.name : '???'}</text>
          <text x="${p.x}" y="${p.y + 64}" class="isle-stars">${open ? '★'.repeat(stars) + '☆'.repeat(HOLES_PER_PORT - stars) : ''}</text>
        </a>`;
      }).join('')}
      <g class="ship" transform="translate(${PORTS[cur].x - 10} ${PORTS[cur].y - 54})">
        <path d="M-14 14h40l-7 9h-26z" class="hull"/><path d="M5 -10v24h17z" class="sail"/><path d="M3 -4v18h-14z" class="sail"/>
      </g>
    </svg>`;
  }

  function home() {
    const v = voyage();
    const n = today();
    const daily = store.get().daily;
    const dailyDone = daily && daily.day === n && daily.result;
    const next = PORTS[Math.min(v.unlocked, PORTS.length) - 1];
    main.innerHTML = `
      <article class="home">
        <header class="page-head">
          <p class="eyebrow">A carpentry primer</p>
          <h1>Fill the hull, one hole at a time.</h1>
          <p class="lede">Each piece you're dealt goes into the hole, and you choose where. Fill a hole with no wasted squares and it's a Masterpiece.</p>
        </header>
        <a class="daily-card" href="#/daily">
          <div><p class="eyebrow">Hole of the Day #${n}</p>
          <h3>${dailyDone ? (daily.result.masterpiece ? 'Masterpiece! Come back tomorrow.' : 'Done for today. Come back tomorrow.') : 'Today\'s hole is waiting.'}</h3>
          <p class="hint">One 20-square hole, the same for everyone. Share your result.</p></div>
          <span class="btn">${dailyDone ? 'See result' : 'Play'}</span>
        </a>
        <section class="voyage-wrap">
          <div class="purse-bar"><span>Purse ${coin(purse.get())}</span><span>Masterpiece streak <b>${v.streak}</b></span>
            <a class="btn" href="#/port/${next.id}">Sail to ${next.name} →</a></div>
          <div class="map-wrap">${mapSvg(v)}</div>
          <p class="hint">Three holes at every port. Every Masterpiece earns doubloons, more on a streak, and you can bet them on the last piece turning up. <button class="linkish reset">Start a new voyage</button></p>
        </section>
      </article>`;
    $('.reset', main).addEventListener('click', () => {
      if (confirm('Start the voyage again from Driftwood Quay? Your stars will be reset, but you keep your purse.')) { store.patch('voyage', null); home(); }
    });
  }

  function portPage(id) {
    const idx = PORTS.findIndex((p) => p.id === id);
    const port = PORTS[idx];
    const v = voyage();
    if (!port || idx >= v.unlocked) { location.hash = '#/'; return; }
    const results = [];

    const header = () => {
      const cur = voyage();
      return `<header class="run-bar"><a href="#/" class="back">← Map</a><b>${port.name}</b>
        <span class="holes">${Array.from({ length: HOLES_PER_PORT }, (_, i) => `<span class="hdot ${results[i] ? (results[i].masterpiece ? 'won' : 'lost') : i === results.length ? 'now' : ''}"></span>`).join('')}</span>
        <span>Streak <b>${cur.streak}</b></span></header>`;
    };

    main.innerHTML = `<article class="port-intro">
      <p class="eyebrow">Port ${idx + 1} of ${PORTS.length}</p><h1>${port.name}</h1>
      <div class="mentor"><div class="mentor-face" aria-hidden="true">⚓</div><blockquote><p>${port.tip}</p><cite>The old shipwright</cite></blockquote></div>
      <p class="hint">${HOLES_PER_PORT} holes of ${port.size * 5} squares${port.deal > 1 ? ', with two pieces in your toolbox each turn' : ''}.</p>
      <button class="btn begin">Start puzzling <kbd>Enter</kbd></button></article>`;
    const begin = () => playHole();
    $('.begin', main).addEventListener('click', begin);
    keyHandler = (e) => { if (e.key === 'Enter') { begin(); e.preventDefault(); } };

    function playHole() {
      main.innerHTML = '<article><section class="run"></section></article>';
      holeRun($('.run', main), {
        size: port.size, deal: port.deal, storm: port.storm, core: port.core, hint: port.hint, header,
        bet: () => purse.get(),
        onFinish: (r) => {
          const cur = voyage();
          if (r.betDelta) purse.add(r.betDelta, r.betDelta > 0 ? 'Bet won' : 'Bet lost');
          if (r.masterpiece) {
            cur.streak++;
            const reward = 5 * port.size + 2 * (cur.streak - 1);
            purse.add(reward, cur.streak > 1 ? `Masterpiece · streak ${cur.streak}` : 'Masterpiece');
            r.reward = reward;
          } else cur.streak = 0;
          saveVoyage(cur);
          results.push(r);
        },
        onDone: () => (results.length < HOLES_PER_PORT ? playHole() : portDone()),
      });
    }

    function portDone() {
      const cur = voyage();
      const stars = results.filter((r) => r.masterpiece).length;
      cur.stars[port.id] = Math.max(cur.stars[port.id] || 0, stars);
      cur.unlocked = Math.max(cur.unlocked, Math.min(idx + 2, PORTS.length));
      saveVoyage(cur);
      const nextPort = PORTS[idx + 1];
      main.innerHTML = `<article class="port-done">
        <p class="eyebrow">${port.name}</p>
        <h1>${['Back to the drawing board.', 'One Masterpiece.', 'Two Masterpieces!', 'A clean sweep!'][stars]}</h1>
        <div class="big-stars">${'★'.repeat(stars)}<span>${'☆'.repeat(HOLES_PER_PORT - stars)}</span></div>
        <div class="done-holes">${results.map((r) => `<figure>${R.board(r.remaining, r.placed, { cell: 16, labels: false })}
          <figcaption>${r.steps.map((g) => SHARE[g]).join('')} ${r.masterpiece ? '⭐' : r.dead ? '⬛' : '💨'}${r.reward ? ` ${coin('+' + r.reward)}` : ''}</figcaption></figure>`).join('')}</div>
        <p>Purse ${coin(purse.get())}</p>
        <p class="actions">${nextPort ? `<a class="btn" href="#/port/${nextPort.id}">Sail to ${nextPort.name} →</a>` : '<span class="verdict good">You sailed the whole voyage!</span>'}
          <a class="btn ghost" href="#/port/${port.id}" data-again>Replay ${port.name}</a> <a class="btn ghost" href="#/">Map</a></p>
      </article>`;
      $('[data-again]', main).addEventListener('click', (e) => { e.preventDefault(); portPage(port.id); });
    }
  }

  // ---------- workshop ----------
  // The named two-piece finishes (names from Hawkings' tutorial), with our own notes.
  const NOTES = {
    'Top-Notch': 'The best of them. Seven pairs fit, and almost all of them use a P.',
    Dogleg: 'Nearly as good. Hold a P and another P, an L or a U finishes it.',
    Dome: 'Every finish needs a P. It also gives a stray W somewhere useful to go.',
    'Middle-Notch': 'P and F, the two most common pieces, are the usual finish.',
    Animal: 'Two Ps is the realistic finish. Worth leaving if you already hold a U or V.',
    Offset: 'Mostly pairs of the same piece: two Ps, or two Ns if they come in a run.',
    'Lazy Animal': 'Two Ps, or F + Y if you want a break from all those Ps.',
    'The Ship': 'Two Ps, with Y + V or N + T as backups if you already hold the odd piece.',
    'The Rectangle': 'Two Ps or two Ls. Only go for two Is if you already have both.',
  };
  const CLASSIC = C.NAMED.map((n) => ({ ...n, note: NOTES[n.name] }));

  function piecesPage() {
    const sorted = C.LETTERS.slice().sort(C.byWeight);
    main.innerHTML = `
      <article>
        <header class="page-head"><p class="eyebrow">Workshop</p><h1>Timber guide</h1>
          <p class="lede">Carpentry uses the twelve five-square pieces, each named after a letter. Some turn up far more often than others. The longer the bar, the more often you'll see it.</p></header>
        <div class="gallery">${sorted.map((l) => `
          <div class="pcard">
            <div class="pcard-art">${R.piece(l, null, { cell: 20, box: 110, labels: false })}</div>
            <div class="pcard-body"><h3>${letterChip(l)} <span class="rarity">${rarityText(l)}</span></h3>
            <span class="odds-bar"><i style="width:${(C.WEIGHTS[l] / 22) * 100}%"></i></span>
            <p>${PIECE_NOTES[l]}</p></div>
          </div>`).join('')}</div>
        <section class="drill-page">
          <header class="page-head"><h2>Warm-up: name that piece</h2><div class="drill-score"></div></header>
          <section class="drill"></section>
        </section>
      </article>`;
    runQuiz($('.drill', main), QUIZZES.name);
  }

  function twoPiecePage() {
    main.innerHTML = `
      <article>
        <header class="page-head"><p class="eyebrow">Workshop</p><h1>Two-piece holes</h1>
          <p class="lede">When ten squares are left, two pieces finish the hole. Carpenters give the best ten-square shapes names, and steer every hole towards one of them. Tap a pair to see how it fits.</p></header>
        <div class="classics">${CLASSIC.map((c, i) => {
          const cells = C.parseRows(c.rows);
          const stats = C.pairStats(cells);
          const hold = partners(stats.combos).slice(0, 2);
          return `<div class="classic" data-i="${i}">
            <div class="classic-board">${R.board(cells, stats.combos[0].tilings[0], { cell: 30, labels: false })}</div>
            <div class="classic-body">
              <h3>${c.name}</h3>
              <span class="flex">${flexBadge(stats.pairOdds)}</span>
              <div class="combo-pick">${stats.combos.map((cb, j) => `<button class="cbtn${j === 0 ? ' on' : ''}" data-j="${j}">${comboChip(cb.name)}</button>`).join('')}</div>
              <p>${c.note}</p>
              <p class="hint">${hold.map((h) => `Holding ${an(h.letter)}? ${chips(h.partners)} finishes it.`).join('<br>')}</p>
            </div></div>`;
        }).join('')}</div>
        <aside class="tipbox"><b>The habit to build:</b> keep the hole square so it collapses into one of these shapes, and hang on to your P. Place the second-to-last piece only once its partner is in your toolbox. Play your other holes in the meantime.</aside>
        <p class="credit">Shape names come from Master Carpenter Hawkings' <a href="https://yppedia.puzzlepirates.com/Carpentry_tutorial" target="_blank" rel="noopener">Carpentry tutorial</a> on YPPedia.</p>
        <p><a class="btn" href="#/games/pair">Try: Which pair fits? →</a></p>
      </article>`;

    main.querySelectorAll('.classic').forEach((el) => {
      const cells = C.parseRows(CLASSIC[+el.dataset.i].rows);
      const stats = C.pairStats(cells);
      el.querySelectorAll('.cbtn').forEach((b) => b.addEventListener('click', () => {
        el.querySelectorAll('.cbtn').forEach((x) => x.classList.toggle('on', x === b));
        $('.classic-board', el).innerHTML = R.board(cells, stats.combos[+b.dataset.j].tilings[0].map((p) => ({ ...p, fresh: true })), { cell: 30, labels: false });
      }));
    });
  }

  // ---------- hole lab ----------
  const LAB_ROWS = 6, LAB_COLS = 8;
  let labCells = new Set();
  let painting = null; // true while adding squares, false while erasing
  window.addEventListener('pointerup', () => { if (painting !== null) { painting = null; labUpdate(); } });

  function labPage() {
    main.innerHTML = `
      <article>
        <header class="page-head"><p class="eyebrow">Workshop</p><h1>Hole lab</h1>
          <p class="lede">Paint a hole by clicking or dragging. The lab shows every way to finish it with whole pieces, so you can check a tricky gap you met in the game.</p></header>
        <div class="lab">
          <div class="lab-left">
            <div class="lab-grid" style="--cols:${LAB_COLS}">${Array.from({ length: LAB_ROWS * LAB_COLS }, (_, i) => `<button class="lc" data-r="${Math.floor(i / LAB_COLS)}" data-c="${i % LAB_COLS}" aria-label="Square"></button>`).join('')}</div>
            <div class="lab-tools">
              <button class="btn ghost sm" data-act="clear">Clear</button>
              <button class="btn ghost sm" data-act="random">Random gap</button>
            </div>
          </div>
          <div class="lab-out" aria-live="polite"></div>
        </div>
        <section>
          <h2>Gaps worth knowing</h2>
          <div class="atlas-tabs"><button class="cbtn on" data-a="best">Easiest to finish</button><button class="cbtn" data-a="trap">Traps</button></div>
          <div class="atlas" aria-live="polite"><p class="hint">Planing timber…</p></div>
        </section>
      </article>`;

    const grid = $('.lab-grid', main);
    const paint = (b) => {
      const k = C.key(+b.dataset.r, +b.dataset.c);
      if (painting) labCells.add(k); else labCells.delete(k);
      b.classList.toggle('on', painting);
    };
    grid.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('.lc'); if (!b) return;
      e.preventDefault();
      painting = !b.classList.contains('on');
      paint(b);
    });
    grid.addEventListener('pointerover', (e) => {
      const b = e.target.closest('.lc');
      if (b && painting !== null && e.buttons) paint(b);
    });
    main.querySelector('.lab-tools').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.act === 'clear') labLoad([]);
      if (b.dataset.act === 'random') labLoad(C.pick(C.compactAtlas()).cells);
    });

    let atlasMode = 'best';
    const drawAtlas = () => {
      const ca = C.compactAtlas();
      const list = atlasMode === 'best'
        ? ca.slice().sort((a, b) => b.pairOdds - a.pairOdds).slice(0, 12)
        : ca.filter((s) => s.combos.every((c) => c.letters.some((l) => C.WEIGHTS[l] <= 4))).sort((a, b) => a.pairOdds - b.pairOdds).slice(0, 12);
      $('.atlas', main).innerHTML = (atlasMode === 'trap' ? '<p class="hint">Every way to finish these needs a rare piece. Steer clear.</p>' : '') +
        `<div class="atlas-grid">${list.map((s, i) => `<button class="atlas-item" data-i="${i}">${R.board(s.cells, [], { cell: 14, frame: 0 })}
          ${chips(s.useful)}</button>`).join('')}</div>`;
      $('.atlas', main).querySelectorAll('.atlas-item').forEach((b) => b.addEventListener('click', () => {
        labLoad(list[+b.dataset.i].cells);
        main.querySelector('.lab').scrollIntoView({ behavior: 'smooth' });
      }));
    };
    main.querySelectorAll('.atlas-tabs .cbtn').forEach((b) => b.addEventListener('click', () => {
      atlasMode = b.dataset.a;
      main.querySelectorAll('.atlas-tabs .cbtn').forEach((x) => x.classList.toggle('on', x === b));
      drawAtlas();
    }));
    setTimeout(drawAtlas, 30);

    labLoad(labCells.size ? [...labCells].map(C.unkey) : C.parseRows(CLASSIC[0].rows));
  }

  function labLoad(cells) {
    const b = cells.length ? C.bbox(cells) : { h: 0, w: 0, r0: 0, c0: 0 };
    const dr = Math.floor((LAB_ROWS - b.h) / 2) - b.r0, dc = Math.floor((LAB_COLS - b.w) / 2) - b.c0;
    labCells = new Set(cells.map(([r, c]) => C.key(r + dr, c + dc)));
    main.querySelectorAll('.lab-grid .lc').forEach((el) => el.classList.toggle('on', labCells.has(C.key(+el.dataset.r, +el.dataset.c))));
    labUpdate();
  }

  function labUpdate() {
    const out = $('.lab-out', main);
    if (!out) return;
    const cells = [...labCells].map(C.unkey);
    const n = cells.length;
    let html = `<p class="count"><b>${plural(n, 'square')}</b>${n && n % 5 === 0 ? ` · ${plural(n / 5, 'piece')} to finish` : ''}</p>`;
    if (!n) html += '<p class="hint">Paint some squares to make a hole.</p>';
    else if (n % 5) html += `<p>Pieces cover five squares each, so this can't be finished cleanly. Add ${5 - (n % 5)} or remove ${n % 5}.</p>`;
    else if (n > 25) html += '<p>Keep it to 25 squares or fewer.</p>';
    else if (n === 5) {
      const l = C.identify(cells);
      html += l ? `<p>One ${letterChip(l)} finishes it (${RARITY[l]}: about 1 in ${oneIn(l)} pieces).</p>` : `<p>No single piece fits.${C.isConnected(cells) ? ' Only putty could save it.' : ''}</p>`;
    } else if (n === 10) {
      const stats = C.pairStats(cells);
      html += `<p class="flex">${flexBadge(stats.pairOdds)}</p>${fillsGallery(stats.combos, { cell: 16 })}`;
      if (stats.combos.length) html += `<ul class="holding">${partners(stats.combos).map((h) => `<li>Holding ${an(h.letter)}? ${chips(h.partners)}</li>`).join('')}</ul>`;
    } else {
      const list = C.combos(cells);
      html += list.length
        ? `<p>${plural(list.length, 'different set')} of pieces can finish it. The likeliest are first.</p>
           <div class="fills">${list.slice(0, 18).map((c) => `<figure class="fill">${R.board([], c.tilings[0], { cell: 13, frame: 0, labels: false })}
           <figcaption>${comboChip(c.name)}</figcaption></figure>`).join('')}</div>`
        : '<p class="dead-note">No set of whole pieces fills this exactly.</p>';
    }
    out.innerHTML = html;
  }

  // ---------- router ----------
  const ROUTES = {
    '/': home,
    '/daily': dailyPage,
    '/games/pair': () => quizPage(QUIZZES.pair),
    '/games/remnant': () => quizPage(QUIZZES.remnant),
    '/games/bets': betPage,
    '/pieces': piecesPage,
    '/two-piece': twoPiecePage,
    '/lab': labPage,
  };

  function route() {
    const path = location.hash.replace(/^#/, '') || '/';
    keyHandler = null;
    if (onLeave) { const f = onLeave; onLeave = null; f(); }
    C.useSeed(null);
    purse.render();
    const port = path.match(/^\/port\/(\w+)$/);
    if (port) portPage(port[1]); else (ROUTES[path] || home)();
    const navPath = port ? '/' : path;
    document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + navPath));
    window.scrollTo(0, 0);
  }

  document.body.insertAdjacentHTML('afterbegin', R.defs());
  window.addEventListener('hashchange', route);
  route();
  // Build the remnant atlas in the background so the games start instantly.
  setTimeout(() => C.atlas(), 300);
})();
