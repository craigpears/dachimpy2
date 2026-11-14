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
  const coin = (n) => `<span class="coin" aria-hidden="true"></span><b>${n}</b>`;

  // How often each piece turns up: a word, and "about 1 in X pieces".
  const RARITY = {
    P: 'very common', F: 'common', Y: 'common', T: 'uncommon', N: 'uncommon', L: 'uncommon',
    W: 'rare', U: 'rare', V: 'rare', Z: 'rare', X: 'very rare', I: 'very rare',
  };
  const oneIn = (l) => Math.round(C.TOTAL_WEIGHT / C.WEIGHTS[l]);
  const rarityText = (l) => `${RARITY[l]} · about 1 in ${oneIn(l)} pieces`;

  // Prices in the words bookmakers use.
  const PRICES = [[0.2, '1 to 5'], [0.25, '1 to 4'], [1 / 3, '1 to 3'], [0.5, '1 to 2'], [0.8, '4 to 5'], [1, 'evens'], [1.5, '6 to 4'], [2, '2 to 1'], [2.5, '5 to 2'], [3, '3 to 1'],
    [4, '4 to 1'], [5, '5 to 1'], [6, '6 to 1'], [8, '8 to 1'], [10, '10 to 1'], [12, '12 to 1'], [16, '16 to 1'], [20, '20 to 1']];
  // A tote price (winnings per doubloon staked) in the same words, rounded down to a price people know.
  const toteText = (r) => (r <= 0 ? 'only your stake back' : r >= 20 ? `${Math.floor(r)} to 1` : (PRICES.filter(([m]) => m <= r).pop() || [0, 'less than 1 to 5'])[1]);
  const QUIZ_PAY = 2;
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
      if (window.Social) Social.purseChanged();
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
      // Every harbour game pays into the one purse.
      const earn = d.pay ? d.pay(q, rating) : right ? QUIZ_PAY : 0;
      if (earn) purse.add(earn, earn < 0 ? 'Wrong answer' : right ? 'Right answer' : 'Close call');

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
          <div class="purse-bar quiz-purse"><span>Your purse ${coin(`<span class="purse-live">${purse.get()}</span>`)}</span>
            ${d.payNote ? `<span class="hint">${d.payNote()}</span>` : ''}</div>
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
  // Bigger holes are much harder to see, so the pay climbs steeply: 2 pieces 1, 3 pieces 4, 4 pieces 10.
  const PAIR_PAY = [0, 0, 1, 4, 10];
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
      lede: 'Exactly one of these sets of pieces drops into the hole cleanly. Turn and flip them in your head. Bigger holes are harder and pay far more.',
      layout: 'pairs',
      gen: () => C.genPairQuiz(pairSize()),
      // A wrong answer costs what a right one pays, so guessing loses doubloons.
      pay: (q, rating) => (rating === 'masterpiece' ? 1 : -1) * PAIR_PAY[q.size],
      payNote: () => 'A wrong answer costs as much as a right one pays, so don’t guess.',
      // How many pieces finish the hole: three big buttons, each with its pay.
      controls: () => `<div class="size-pick" role="radiogroup" aria-label="Pieces to finish the hole">
          ${[2, 3, 4].map((n) => `<button type="button" class="size-opt" role="radio" aria-checked="${n === pairSize()}" data-n="${n}">
            <b>${n} pieces</b><span class="size-word">${['', '', 'Easy', 'Tricky', 'Hard'][n]}</span><span class="size-pay">wins or loses ${coin(PAIR_PAY[n])}</span></button>`).join('')}
        </div>`,
      bindControls: (root, quiz) => {
        root.querySelectorAll('.size-opt').forEach((b) => b.addEventListener('click', () => {
          root.querySelectorAll('.size-opt').forEach((x) => x.setAttribute('aria-checked', x === b));
          store.patch('pairSize', +b.dataset.n);
          quiz.next();
        }));
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
      // The best gap pays 2; a close second, nearly as likely to finish, still pays 1. Anything worse costs 2.
      pay: (q, rating) => ({ masterpiece: QUIZ_PAY, craft: 1 }[rating] || -QUIZ_PAY),
      payNote: () => `The best gap pays ${coin(QUIZ_PAY)}, a close second ${coin(1)}, and anything worse costs ${coin(QUIZ_PAY)}`,
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

  // ---------- the harbour table's holes: four holes, one pile ----------
  const TABLE_DRAWS = 5, HOLE_NAMES = 'ABCD';

  // What a hole still needs, given how far it has got.
  function needsText(h, st) {
    if (st.done) return '<p class="t-need">Finished!</p>';
    if (st.need) return `<p class="t-need">Needs ${an(st.need)}</p><p class="hint small">About 1 in ${oneIn(st.need)} pieces</p>`;
    // Between them, how often a piece that can start it turns up.
    const starts = Math.round(C.TOTAL_WEIGHT / h.useful.reduce((a, l) => a + C.WEIGHTS[l], 0));
    return `<p class="t-need">${h.name ? `A <b>${h.name}</b>` : 'Ten squares'}: two pieces</p>
      <p class="hint small">Starts with ${chips(h.useful)}: about 1 in ${starts} pieces, then needs the one that fits what's left</p>`;
  }

  // ---------- the landing page ----------
  /* Trimmed on 14 Nov (the user: "the voyage thing we've dropped, [Hole] of the Day we've dropped. Practice bets
     doesn't seem relevant, just have [the] Harbour table ... that can really be trimmed down"): two quick
     puzzles to earn doubloons, the harbour table to bet them, and the workshop. */
  const EARN = [
    { href: '#/games/pair', icon: '◧', name: 'Which pair fits?', pays: `up to ${coin(PAIR_PAY[4])} a puzzle` },
    { href: '#/games/remnant', icon: '◨', name: 'Which gap?', pays: `${coin(QUIZ_PAY)} a puzzle` },
  ];
  const earnLinks = (skip) => `<div class="earn-links">${EARN.filter((e) => e.href !== skip).map((e) => `<a class="earn" href="${e.href}"><i>${e.icon}</i><b>${e.name}</b><span>${e.pays}</span></a>`).join('')}</div>`;

  function home() {
    main.innerHTML = `
      <article class="home">
        <header class="page-head">
          <p class="eyebrow">A carpentry primer</p>
          <h1>Which piece fills the hole?</h1>
          <p class="lede">Quick Carpentry puzzles. Earn doubloons, then bet them at the harbour table.</p>
        </header>
        <section class="start">
          <div class="step">
            <p class="eyebrow">Step 1</p><h2>Earn doubloons</h2>
            ${earnLinks()}
          </div>
          <a class="step face-off" href="#/games/table">
            <p class="eyebrow">Step 2</p><h2>The harbour table</h2>
            <p>Bet against other pirates, a new round every 45 seconds.</p>
            <span class="btn">Take a seat →</span>
          </a>
        </section>
      </article>`;
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

  // ---------- the harbour table: everyone online bets on the same round ----------
  /* One round every 45 seconds, run by the server: 20 seconds to bet, then five pieces for
     everyone. All the stakes go in one pot, split between whoever backed a finished hole. */
  function harbourPage() {
    const api = window.Social && Social.api;
    let view = null, offset = 0, state = null, flipped = 0, lastPoll = 0, fetching = false, resultShown = false, timer = null;
    let lastStake = new Map(); // what each pirate had on last time we drew the crew, to spot new bets
    let stake = 10; // the stake you've picked; it stays picked from round to round
    const t = () => Date.now() + offset - view.start;
    const secs = (ms) => Math.max(0, Math.ceil(ms / 1000));
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const isMe = (name) => { const me = Social.me(); return !!me && me.name === name; };
    const RANKS = ['Rarest', '2nd rarest', '3rd rarest', 'Likeliest'];
    const rank = (i) => view.holes.filter((h, j) => h.chance < view.holes[i].chance || (h.chance === view.holes[i].chance && j < i)).length;
    const hue = (name) => [...name].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 360, 7);

    main.innerHTML = `
      <article class="bet-page harbour">
        <header class="page-head">
          <p class="eyebrow">Harbour games</p>
          <h1>Harbour table</h1>
          <p class="lede">Everyone online plays the same table. Pick a stake, back the holes you think will get finished, then watch ${TABLE_DRAWS} pieces come off the pile.</p>
          <details class="working h-rules"><summary>How the pot works</summary>
            <p>You've 20 seconds to bet, up to 20 a round across as many holes as you like. If more than one hole gets finished, the rarest one with money on it wins.</p>
            <p><b>The winners share the whole pot, by stake.</b> Everyone who backed the winning hole splits the pot by how much each put on it. Put 10 of the 40 on that hole and you get a quarter of the pot. Alone on it, you take the lot. So a hole few pirates back pays big, and money you spread over other holes feeds whoever wins.</p>
            <p>Each hole shows what it pays right now, like a bookmaker's price. It changes as pirates bet.</p>
            <p><b>Rolled over:</b> if nobody backed a finished hole, nobody wins and the whole pot rolls over into the next round's pot.</p></details>
        </header>
        <div class="h-body"><p class="hint">Pulling up a chair…</p></div>
      </article>`;
    const body = $('.h-body', main);

    async function load() {
      fetching = true;
      try {
        const me = Social.me();
        const r = await api('harbour' + (me ? '?me=' + encodeURIComponent(me.name) : ''));
        if (!r.ok) throw new Error('no harbour');
        return r.data;
      } finally { fetching = false; }
    }

    async function newRound() {
      try { view = await load(); } catch {
        view = null;
        body.innerHTML = `<p>The harbour table needs the online server, and it can't be reached from here.</p>`;
        return;
      }
      offset = view.now - Date.now();
      state = C.tableState(view.holes);
      flipped = 0; resultShown = false; lastPoll = Date.now();
      build();
    }

    const holeBoard = (i, fresh) => R.board(state[i].rest, state[i].placed.map((p, j) => ({ ...p, fresh: fresh && j === state[i].placed.length - 1 })), { cell: 22, labels: false });

    function build() {
      const me = Social.me();
      body.innerHTML = `
        <div class="purse-bar bet-purse">
          <span>Your purse ${coin(`<span class="purse-live">${purse.get()}</span>`)}</span>
          <span>Pot ${coin('<span class="pot-n">0</span>')}<span class="carry"></span></span>
          <span class="clock"></span>
          <span class="h-bar"><i></i></span>
        </div>
        ${me ? '' : `<form class="h-join"><h3>You’re only watching</h3><label for="h-name">Put your pirate name down to join the table and bet</label>
          <div class="b-row"><input id="h-name" name="name" maxlength="16" placeholder="Pirate name" autocomplete="nickname" required><button class="btn">Join the table</button></div>
          <p class="b-err" role="alert"></p></form>`}
        <div class="stake-pick" role="radiogroup" aria-label="Your stake"><span class="sp-label">Your stake</span>
          ${[5, 10, 15, 20].filter((n) => n <= view.cap).map((n) => `<button type="button" class="sp-opt" role="radio" data-n="${n}">${coin(n)}</button>`).join('')}
          <span class="sp-then">then pick a hole</span></div>
        <p class="h-note"></p>
        <div class="h-broke" hidden><h3>Your purse is empty</h3><p>Earn some doubloons, then come back to face the other pirates.</p>${earnLinks()}</div>
        <div class="h-layout">
        <aside class="h-crew"><h2>At the table</h2><p class="h-count"></p><ul></ul></aside>
        <div class="h-play">
        <div class="table-holes">${view.holes.map((h, i) => `
          <div class="tcard" data-i="${i}">
            <div class="t-head"><span class="t-name">${HOLE_NAMES[i]}</span><span class="t-rank r${rank(i)}">${RANKS[rank(i)]}</span></div>
            <div class="hole-wrap t-board">${holeBoard(i)}</div>
            <div class="t-needs">${needsText(h, state[i])}<p class="t-odds">From ${TABLE_DRAWS} pieces: finished ${timesText(h.chance)}</p></div>
            <div class="t-backed"></div>
            <div class="t-result"></div>
            <div class="t-stake"><button class="bet-btn plus"></button></div>
            <p class="t-mine"></p>
          </div>`).join('')}</div>
        <div class="draw-zone">
          <div class="cards">${Array.from({ length: TABLE_DRAWS }, (_, i) => `<div class="card-slot"><div class="card" data-i="${i}"><div class="card-in"><div class="face back"></div><div class="face front"></div></div></div><span class="card-cap"></span></div>`).join('')}</div>
          <div class="settle" hidden></div>
        </div>
        </div></div>`;
      lastStake = new Map();
      const form = $('.h-join', body);
      if (form) form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = $('button', form);
        btn.disabled = true;
        const problem = await Social.joinAs(form.name.value.trim());
        if (problem) { $('.b-err', form).textContent = problem; btn.disabled = false; }
      });
      body.querySelectorAll('.tcard .plus').forEach((b, i) => b.addEventListener('click', () => bet(i)));
      body.querySelectorAll('.sp-opt').forEach((b) => b.addEventListener('click', () => { stake = +b.dataset.n; paint(); }));
      paint();
    }

    function paint() {
      const cards = body.querySelectorAll('.tcard'), open = t() < view.betMs, me = Social.me();
      const staked = view.mine.reduce((a, b) => a + b, 0);
      // You can only stake what's in your purse and what's left of the round's cap.
      const can = [5, 10, 15, 20].filter((n) => n <= view.cap - staked && n <= purse.get());
      if (can.length && !can.includes(stake)) stake = can[can.length - 1];
      const picking = !!me && open && can.length > 0;
      $('.stake-pick', body).hidden = !picking;
      body.querySelectorAll('.sp-opt').forEach((b) => {
        b.setAttribute('aria-checked', String(+b.dataset.n === stake));
        b.disabled = !can.includes(+b.dataset.n);
      });
      $('.pot-n', body).textContent = view.pot;
      $('.carry', body).innerHTML = view.carry ? ` (${coin(view.carry)} of it rolled over)` : '';
      view.holes.forEach((h, i) => {
        const c = cards[i], total = view.totals[i], mine = view.mine[i];
        c.classList.toggle('backed', mine > 0);
        $('.plus', c).innerHTML = `<span>${mine ? `Bet ${coin(stake)} more` : `Bet ${coin(stake)} on ${HOLE_NAMES[i]}`}</span>`;
        $('.t-stake', c).hidden = !picking;
        $('.t-mine', c).innerHTML = mine ? `<span class="mine-tag">Your bet ${coin(mine)}</span>` : '';
        // What you'd collect if this hole takes the pot, worked out the way the server pays.
        const who = me ? me.name : ' you', bets = view.bets.map((b) => ({ who: b.name, hole: b.hole, amt: b.amt }));
        if (!mine) bets.push({ who, hole: i, amt: stake });
        const get = C.potPayout(bets, i, view.carry).get(who) || 0;
        const backers = view.bets.filter((b) => b.hole === i).sort((a, b) => b.amt - a.amt);
        // Shown as what you'd come out ahead, counting your stakes on other holes too.
        const net = get - staked - (mine ? 0 : stake);
        const outcome = net > 0 ? `win ${coin(net)}` : net < 0 ? `lose ${coin(-net)}` : 'break even';
        const share = !open || !me || (!mine && !picking) ? ''
          : `If ${HOLE_NAMES[i]} wins, you${mine ? '' : '’d'} ${outcome} as things stand`;
        // The tote price: what each doubloon on this hole wins if it takes the pot (with your stake added, if you're picking).
        const add = picking && !mine ? stake : 0;
        const price = total + add ? `Pays ${toteText((view.pot + add) / (total + add) - 1)}` : 'Nobody on it yet';
        $('.t-backed', c).innerHTML = `<p class="t-price">${price}</p><p>On this hole ${coin(total)}</p>`
          + (backers.length ? `<ul class="backers">${backers.map((b) => `<li class="${b.bot ? 'bot' : ''}${isMe(b.name) ? ' me' : ''}">${isMe(b.name) ? 'You' : esc(b.name)} ${coin(b.amt)}</li>`).join('')}</ul>` : '')
          + (share ? `<p class="t-share">${share}</p>` : '');
      });
      let note = '';
      if (me && open) note = `Bets are final. Whoever backed the winning hole shares the whole pot by stake, so a hole few pirates back pays big.${staked ? ` You've staked ${coin(staked)} of ${coin(view.cap)} this round.` : ` Up to ${coin(view.cap)} a round.`}`;
      $('.h-note', body).innerHTML = note;
      $('.h-broke', body).hidden = !(me && open && !staked && !can.length);
      paintCrew();
    }

    // Everyone at the table, what they've got on which hole, and once it's settled, who won.
    function paintCrew() {
      const open = t() < view.betMs, res = view.result;
      const crew = [...view.crew].sort((a, b) => (res ? b.won - b.staked - a.won + a.staked : 0) || isMe(b.name) - isMe(a.name) || a.bot - b.bot || b.staked - a.staked);
      const people = crew.filter((c) => !c.bot).length;
      $('.h-count', body).textContent = `${people ? plural(people, 'pirate') : 'No pirates'} and ${plural(crew.length - people, 'house pirate')}`;
      const mark = (i) => (res && res.hole === i ? ' paid' : state[i].done ? ' done' : res ? ' bodged' : '');
      $('.h-crew ul', body).innerHTML = crew.map((c) => {
        const holes = view.bets.filter((b) => b.name === c.name).sort((a, b) => a.hole - b.hole);
        const bump = lastStake.has(c.name) && c.staked > lastStake.get(c.name);
        lastStake.set(c.name, c.staked);
        const what = holes.length
          ? holes.map((b) => `<span class="hb${mark(b.hole)}"><b>${HOLE_NAMES[b.hole]}</b> ${coin(b.amt)}</span>`).join('')
          : `<span class="hint">${open ? (c.bot ? 'Thinking…' : 'Watching') : 'Sat this one out'}</span>`;
        const net = c.won - c.staked;
        const out = res && c.staked ? `<span class="h-out ${net > 0 ? 'up' : net < 0 ? 'down' : ''}">${net > 0 ? `Won ${coin(net)}` : net < 0 ? `Lost ${coin(-net)}` : 'Even'}</span>` : '';
        return `<li class="seat${c.bot ? ' bot' : ''}${isMe(c.name) ? ' me' : ''}${bump ? ' bump' : ''}${res && c.won ? ' winner' : ''}">
          <span class="s-face" style="--h:${hue(c.name)}">${esc(c.name.replace(/^Cap'n /, '')[0])}</span>
          <span class="who"><span class="nm"><b>${isMe(c.name) ? 'You' : esc(c.name)}</b>${c.bot ? '<small>House</small>' : ''}</span><span class="what">${what}${out}</span></span></li>`;
      }).join('');
    }

    async function bet(i) {
      const me = Social.me(), amt = stake;
      if (!me || purse.get() < amt || view.mine.reduce((a, b) => a + b, 0) + amt > view.cap) return;
      body.querySelectorAll('.tcard .plus').forEach((b) => { b.disabled = true; });
      const r = await api('harbour/bet', { name: me.name, key: me.key, n: view.n, hole: i, amt }).catch(() => null);
      if (r && r.ok) {
        purse.add(-amt);
        view.mine[i] += amt; view.totals[i] += amt; view.pot += amt;
        view.bets.unshift({ name: me.name, hole: i, amt });
      } else if (r) toast('', r.data.message || 'That bet didn’t go through.', false);
      body.querySelectorAll('.tcard .plus').forEach((b) => { b.disabled = false; });
      paint();
    }

    function flip(i) {
      const l = view.draws[i];
      const card = main.querySelector(`.card[data-i="${i}"]`);
      $('.front', card).innerHTML = R.piece(l, null, { cell: 12, box: 70 }) + `<span>${l}</span>`;
      card.classList.add('flipped');
      const into = C.tableDraw(view.holes, state, l, view.order);
      const cap = card.parentElement.querySelector('.card-cap');
      const cards = body.querySelectorAll('.tcard');
      if (into < 0) { cap.textContent = 'Spare'; card.classList.add('miss'); return; }
      cap.innerHTML = `Into <b>${HOLE_NAMES[into]}</b>`;
      $('.t-board', cards[into]).innerHTML = holeBoard(into, true);
      $('.t-needs', cards[into]).innerHTML = needsText(view.holes[into], state[into]);
      if (state[into].done) {
        card.classList.add('hit');
        cards[into].classList.add('done');
        $('.t-board', cards[into]).classList.add('glow');
        $('.t-result', cards[into]).innerHTML = '<span class="tag-grade best">Finished</span>';
      }
    }

    async function showResult() {
      resultShown = true;
      const [mine, fresh] = await Promise.all([Social.claim(), load().catch(() => null)]);
      if (fresh && fresh.n === view.n) view = { ...fresh, mine: view.mine };
      const res = view.result;
      if (!res) { resultShown = false; return; }
      const cards = body.querySelectorAll('.tcard');
      view.holes.forEach((_, i) => {
        if (i === res.hole) $('.t-result', cards[i]).innerHTML = '<span class="tag-grade best">Winning hole</span>';
        if (state[i].done) return;
        $('.t-result', cards[i]).innerHTML = '<span class="tag-grade risky">Bodged</span>';
        if (view.mine[i]) shake($('.t-board', cards[i]));
      });
      const r = mine && mine.rounds.find((x) => x.n === view.n);
      const staked = view.mine.reduce((a, b) => a + b, 0);
      const won = r ? r.won : 0, net = won - staked;
      const fin = res.finished.map((i) => HOLE_NAMES[i]);
      const paid = view.crew.filter((c) => c.won > c.staked).sort((a, b) => b.won - b.staked - a.won + a.staked)
        .map((c) => `${isMe(c.name) ? 'you' : esc(c.name)} won ${coin(c.won - c.staked)}`);
      paintCrew();
      const box = $('.settle', body);
      box.hidden = false;
      box.innerHTML = `<div class="verdict ${net > 0 ? 'good' : net < 0 ? 'bad' : 'ok'}">${!staked ? 'You sat this one out.' : net > 0 ? `You won ${coin(net)}!` : !net ? 'You broke even.' : `You lost ${coin(-net)}.${won ? ` Your share of the pot was ${coin(won)}, less than you staked.` : ''}`}</div>
        <p>${fin.length ? `Finished: <b>${fin.join(', ')}</b>.` : 'Nothing got finished.'} ${res.rollover ? `Nobody backed a finished hole, so nobody wins: the whole pot of ${coin(res.rollover)} rolls over into the next round.` : `${HOLE_NAMES[res.hole]} ${res.finished.length > 1 ? 'was the rarest finished hole with money on it, so it won' : 'won'}: ${paid.join(', ') || 'nobody came out ahead'}.`}</p>
        ${res.rollover ? '' : splitText(res.hole)}
        <p class="hint next-in"></p>`;
      // Show the whole pot for a moment, then break it into the winners' shares.
      setTimeout(() => { const bar = $('.ps-bar', box); if (bar) bar.classList.add('split'); }, 900);
    }

    /* How the pot was shared out, as a picture: every stake goes in, then the pot (one bar) breaks
       into each winner's share. Worked out with the same sums the server pays with. */
    function splitText(hole) {
      const back = C.potPayout(view.bets.map((b) => ({ who: b.name, hole: b.hole, amt: b.amt })), hole, view.carry);
      const pot = view.result.pot, onHole = view.totals[hole], H = HOLE_NAMES[hole];
      const on = new Map();
      view.bets.filter((b) => b.hole === hole).forEach((b) => on.set(b.name, (on.get(b.name) || 0) + b.amt));
      const gcd = (a, b) => (b ? gcd(b, a % b) : a);
      const frac = (a) => (a === onHole ? 'the lot' : `${a / gcd(a, onHole)}/${onHole / gcd(a, onHole)}`);
      const name = (w) => (isMe(w) ? 'You' : esc(w));
      const chips = [...view.bets].sort((a, b) => (b.hole === hole) - (a.hole === hole) || a.hole - b.hole)
        .map((b) => `<span class="ps-chip${b.hole === hole ? ' win' : ''}">${name(b.name)} ${coin(b.amt)} on ${HOLE_NAMES[b.hole]}</span>`)
        .concat(view.carry ? [`<span class="ps-chip">Rolled over ${coin(view.carry)}</span>`] : []);
      const segs = [...on].sort((a, b) => b[1] - a[1]).map(([w, amt]) =>
        `<div class="ps-seg${isMe(w) ? ' me' : ''}" style="flex-grow:${back.get(w) || 1}"><b>${name(w)}</b><span>${frac(amt)} · ${coin(back.get(w) || 0)}</span></div>`);
      return `<div class="h-split"><h3>How the pot was split</h3>
        <p class="ps-step">Everything bet goes in the pot:</p>
        <div class="ps-chips">${chips.join('')}</div>
        <p class="ps-step">The pot is shared by stake on ${H}${on.size > 1 ? ` (${[...on].map(([w, a]) => `${name(w)} ${coin(a)}`).join(', ')})` : ''}:</p>
        <div class="ps-bar"><div class="ps-whole">Pot ${coin(pot)}</div>${segs.join('')}</div></div>`;
    }

    function tick() {
      if (!view || !document.body.contains(body)) return;
      const now = t();
      const clock = $('.clock', body);
      if (now < view.betMs) {
        clock.innerHTML = `Betting closes in <b>${secs(view.betMs - now)}s</b>`;
        if (Date.now() - lastPoll > 3000 && !fetching) {
          lastPoll = Date.now();
          load().then((v) => { if (v.n === view.n) { view = v; paint(); } }).catch(() => {});
        }
      } else if (!view.draws) {
        clock.innerHTML = 'Betting closed';
        if (!fetching) load().then((v) => { if (v.n === view.n) { view = v; paint(); } }).catch(() => {});
      } else if (now < view.settleMs) clock.innerHTML = 'Pieces coming off the pile';
      else clock.innerHTML = `Next round in <b>${secs(view.roundMs - now)}s</b>`;
      $('.h-bar i', body).style.width = `${now < view.betMs ? 100 * (view.betMs - now) / view.betMs : 0}%`;
      // As the first piece turns over, bring the pile into view so nobody misses the reveal.
      if (view.draws && !flipped && now >= view.flipAt[0] - 1200 && now < view.settleMs) {
        const zone = $('.draw-zone', body), r = zone.getBoundingClientRect();
        if (r.bottom > innerHeight || r.top < 0) zone.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
      if (view.draws) while (flipped < view.draws.length && now >= view.flipAt[flipped]) { flip(flipped++); paintCrew(); }
      if (view.draws && now >= view.settleMs && !resultShown) showResult();
      const ni = $('.next-in', body);
      if (ni) ni.textContent = `Next round in ${secs(view.roundMs - now)}s.`;
      if (now >= view.roundMs + 300 && !fetching) newRound();
    }

    function onJoin() { if (view) load().then((v) => { if (v.n === view.n) { view = v; build(); } }).catch(() => {}); }
    if (api) {
      document.addEventListener('pirate-joined', onJoin);
      timer = setInterval(tick, 250);
      onLeave = () => { clearInterval(timer); document.removeEventListener('pirate-joined', onJoin); };
    }
    newRound();
  }

  // ---------- router ----------
  const ROUTES = {
    '/': home,
    '/games/pair': () => quizPage(QUIZZES.pair),
    '/games/remnant': () => quizPage(QUIZZES.remnant),
    '/games/table': harbourPage,
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
    (ROUTES[path] || home)();   // (an old link to the voyage, a port or Hole of the Day: the landing page)
    const navPath = ROUTES[path] ? path : '/';
    document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + navPath));
    window.scrollTo(0, 0);
  }

  document.body.insertAdjacentHTML('afterbegin', R.defs());
  window.addEventListener('hashchange', route);
  route();
  if (window.Social) Social.start(() => purse.get(), (n, why) => purse.add(n, why));
  // Build the remnant atlas in the background so the games start instantly.
  setTimeout(() => C.atlas(), 300);
})();
