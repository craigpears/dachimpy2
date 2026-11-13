// Distilling: positions to critique (distilling-positions.html). Hand-written, not compiled. Draws each of
// src/distill-positions.ts's positions (js/distill-positions.js) flat, as the read version draws its boards (its
// `board`, from js/distill-guide-view.js, whose own drawing finds nothing to fill on this page but sets up the
// pieces' colours), with the bot's move as numbered arrows, the column it's filling shaded, its phase and reason,
// how it reads the board (its state and tactic, src/distill-read.ts), and any verdicts the user has given there (or
// that they skipped it). A batch still to judge comes first, each card cut down to be quick on a phone: the board, the
// bot's move and plan, the reader's reading in a line (read here, live, by src/distill-read.ts), and one question.
import { board } from './distill-guide-view.js';
import { BATCHES, MOMENTS, POSITIONS, QUESTION, SKIPPED, THEMED, THEMES, VERDICTS } from './distill-positions.js';
import { STATES, TACTICS, readBoard } from './distill-read.js';
import { PHASES } from './distill-phase.js';

const NS = 'http://www.w3.org/2000/svg';
const CELL = 40;
const html = (tag, attrs = {}, text) => { const e = document.createElement(tag); Object.assign(e, attrs); if (text !== undefined) e.textContent = text; return e; };
const secs = (ms) => `${(ms / 1000).toFixed(1)} s`;
const levelLabel = (name) => name.replace(/^cc/, 'CC^');
const parse = (cols) => cols.map((s) => [...s].map((ch) => 'wbK*x'.indexOf(ch)));
const KIND = { wait: 'Waits', burn: 'Burns the column now', dismiss: 'Cashes in' };

/** The board, its columns numbered 1 to 10 above it, so a column can be named in chat. */
function drawn(p) {
  const cols = parse(p.cols), bot = p.bot;
  const svg = board({ cols, drags: bot.drags, shade: bot.column !== undefined ? [bot.column] : [], rings: [], burn: bot.kind === 'burn' },
    `${p.id}: the board, and the bot's move drawn on it`);
  const [x0, y0, w, h] = svg.getAttribute('viewBox').split(' ').map(Number);
  svg.setAttribute('viewBox', `${x0} ${y0 - 18} ${w} ${h + 18}`);
  cols.forEach((_, x) => {
    const t = document.createElementNS(NS, 'text');
    Object.entries({ x: 24 + x * CELL, y: -3, 'text-anchor': 'middle', class: 'colnum' }).forEach(([k, v]) => t.setAttribute(k, v));
    t.textContent = String(x + 1);
    svg.appendChild(t);
  });
  return svg;
}

/** The bot's next few moves, played forward (src/distill-ahead.ts, kept by tools/distill-positions.mjs): its aim and
    whether it's seen through, each move numbered on its own small board, and each listed with its drags' tricks and
    goals (the user, 13 Nov: "show like a short plan of next steps ... make sure it actually follows through"). */
function planBox(p) {
  const plan = p.plan, box = html('div', { className: 'plan' });
  box.appendChild(html('b', {}, `Its plan, the next ${plan.moves.length} move${plan.moves.length === 1 ? '' : 's'}`));
  const aim = !plan.aim ? 'no aim: it waits'
    : plan.reached === null ? `aim: ${plan.aim}; not reached in these moves`
    : plan.reached === 1 ? `aim: ${plan.aim}; done by move 1`
    : `aim: ${plan.aim}; done by move ${plan.reached}${plan.through ? ', every move working on it' : ', but not every move on the way works on it'}`;
  box.appendChild(html('p', { className: plan.reached && plan.through !== false ? 'aim' : 'aim off' }, `${aim[0].toUpperCase()}${aim.slice(1)}.${/^\d+ moves$/.test(plan.ends) ? '' : ` Then ${plan.ends}.`}`));
  const strip = html('div', { className: 'strip' }), ol = html('ol', { className: 'moves' });
  plan.moves.forEach((m, i) => {
    const f = html('figure');
    f.appendChild(board({ cols: parse(m.cols), drags: m.drags, shade: [], rings: [], burn: false }, `${p.id}, move ${i + 1} of its plan`));
    f.appendChild(html('figcaption', {}, `${i + 1}${plan.reached === i + 1 ? ' ✓' : ''}`));
    strip.appendChild(f);
    const li = html('li');
    li.appendChild(html('b', {}, m.label));
    li.appendChild(document.createTextNode(`: ${m.steps.map((st) => `${st.name}, to ${st.goal ?? '(no goal)'}`).join('; then ')}`));
    ol.appendChild(li);
  });
  box.appendChild(strip);
  box.appendChild(ol);
  return box;
}

function position(p) {
  const bot = p.bot, a = html('article', { id: p.id.toLowerCase() });
  const h = html('h3');
  h.appendChild(html('span', { className: 'pid' }, p.id));
  h.appendChild(document.createTextNode(MOMENTS[p.moment]));
  a.appendChild(h);
  a.appendChild(html('p', { className: 'what' }, p.what));
  const fig = html('figure', { className: 'pic' });
  fig.appendChild(drawn(p));
  fig.appendChild(html('figcaption', {}, bot.drags.length > 1 ? 'The bot\'s drags, in order: 1 first. A dot where each is picked up, an arrow where it\'s let go.'
    : bot.drags.length ? 'The bot\'s drag: a dot where it\'s picked up, an arrow where it\'s let go.' : 'The bot makes no drag here.'));
  a.appendChild(fig);
  const dl = html('dl');
  const row = (k, v) => { dl.appendChild(html('dt', {}, k)); dl.appendChild(html('dd', {}, v)); };
  row('Phase', `${PHASES[bot.phase]?.label ?? bot.phase}: ${PHASES[bot.phase]?.plan ?? ''}`);
  // The board read (src/distill-read.ts): its state, the tactic in play, and why.
  if (bot.state) row('Reads', `${STATES[bot.state]?.label ?? bot.state}; ${(TACTICS[bot.tactic]?.label ?? bot.tactic).toLowerCase()}: ${bot.read}`);
  row('Does', bot.kind === 'move' ? `${bot.label}${bot.drags.length > 1 ? `, in ${bot.drags.length} drags` : ''}` : (KIND[bot.kind] ?? bot.kind));
  row('Why', bot.reason);
  // Each drag a named trick with a goal (src/distill-goals.ts, 13 Nov), numbered as the arrows are.
  if (bot.steps?.length) {
    const ol = html('ol', { className: 'steps' });
    for (const st of bot.steps) {
      const li = html('li');
      li.appendChild(html('b', {}, `${st.name[0].toUpperCase()}${st.name.slice(1)}`));
      li.appendChild(document.createTextNode(`: ${st.goal ?? 'no goal (a half move)'}`));
      ol.appendChild(li);
    }
    dl.appendChild(html('dt', {}, bot.steps.length > 1 ? 'Drags' : 'Drag'));
    const dd = html('dd');
    dd.appendChild(ol);
    dl.appendChild(dd);
  }
  if (bot.column !== undefined) row('Filling', `column ${bot.column + 1} (shaded), to go up Crystal Clear`);
  row('Where', `the ${levelLabel(p.level)} bot, seed ${p.seed}, ${secs(p.ms)} in; ${secs(p.timeLeft)} on the furnace${p.chain ? `; the chain at CC^${p.chain}` : ''}`);
  a.appendChild(dl);
  if (p.plan) a.appendChild(planBox(p));
  const verdicts = VERDICTS[p.id] ?? [];
  if (!verdicts.length && SKIPPED[p.id]) a.appendChild(html('div', { className: 'verdicts' }, `Skipped by you, ${SKIPPED[p.id].date}: ${SKIPPED[p.id].note}`));
  if (verdicts.length) {
    const box = html('div', { className: 'verdicts' });
    box.appendChild(html('b', {}, 'Your verdicts, tested:'));
    const ul = html('ul');
    for (const v of verdicts) ul.appendChild(html('li', {}, `${v.date}${v.from ? ` (${v.from})` : ''}: ${v.note}${v.open ? ' Not done by the bot yet.' : ' The bot does it.'}`));
    box.appendChild(ul);
    a.appendChild(box);
  }
  a.appendChild(html('p', { className: 'ask' }, `Tell me in chat: “${p.id}: …” in your words (“${p.id}: should get the white in column 9 out first”), or a screenshot with your drag drawn on.`));
  return a;
}

/** The reader's reading of a position in a line: its state, the tactic, and the top risks (src/distill-read.ts, live). */
function readerLine(p) {
  const r = readBoard(parse(p.cols), { stage: p.stage, timeLeft: p.timeLeft });
  const risks = r.whites.slice(0, 3).map((w) => `column ${w.x + 1}, row ${w.y + 1} (${w.risk.toFixed(1)}${r.flagged.includes(w) ? ', flagged' : ''})`);
  return `${STATES[r.state]?.label ?? r.state}; ${(TACTICS[r.tactic]?.label ?? r.tactic).toLowerCase()}. ${r.stage === 'chain' ? 'In the chain: no whites read.' : risks.length ? `Top risks: ${risks.join(', ')}.` : 'No whites by the fire.'}`;
}

/** A position still to judge, cut down to be quick: the board, the reader's line, the bot's move and plan, the question. */
function toJudge(p) {
  const bot = p.bot, a = html('article', { id: p.id.toLowerCase(), className: 'judge' });
  const h = html('h3');
  h.appendChild(html('span', { className: 'pid' }, p.id));
  h.appendChild(document.createTextNode(p.batch === 'challenge' ? `${THEMES[THEMED[p.like]?.theme]?.name ?? 'A theme'}?` : MOMENTS[p.moment]));
  a.appendChild(h);
  if (p.batch === 'challenge') {
    const like = html('p', { className: 'like' });
    like.appendChild(document.createTextNode('The reader thinks this is like '));
    like.appendChild(html('a', { href: `#${p.like.toLowerCase()}`, target: '_self' }, p.like));
    const v = VERDICTS[p.like]?.[0];
    if (v) like.appendChild(document.createTextNode(`. Your verdict there: “${v.note.split(/(?<=[.!?])\s/)[0]}”`));
    a.appendChild(like);
  } else a.appendChild(html('p', { className: 'what' }, p.what));
  const fig = html('figure', { className: 'pic' });
  fig.appendChild(drawn(p));
  a.appendChild(fig);
  const dl = html('dl');
  const row = (k, v) => {
    dl.appendChild(html('dt', {}, k));
    const dd = typeof v === 'string' ? html('dd', {}, v) : html('dd');
    if (typeof v !== 'string') dd.appendChild(v);
    dl.appendChild(dd);
  };
  row('Reader', readerLine(p));
  row('Bot', bot.kind === 'move' ? `${bot.label}${bot.drags.length > 1 ? `, in ${bot.drags.length} drags` : ''}` : `${KIND[bot.kind] ?? bot.kind}: ${bot.reason}`);
  if (bot.steps?.length) {
    const ol = html('ol', { className: 'steps' });
    for (const st of bot.steps) {
      const li = html('li');
      li.appendChild(html('b', {}, `${st.name[0].toUpperCase()}${st.name.slice(1)}`));
      li.appendChild(document.createTextNode(`: ${st.goal ?? 'no goal (a half move)'}`));
      ol.appendChild(li);
    }
    row(bot.steps.length > 1 ? 'Drags' : 'Drag', ol);
  }
  row('Where', `${levelLabel(p.level)} bot, seed ${p.seed}, ${secs(p.ms)} in; ${secs(p.timeLeft)} on the furnace${p.chain ? `; the chain at CC^${p.chain}` : ''}${bot.column !== undefined ? `; filling column ${bot.column + 1} (shaded)` : ''}`);
  a.appendChild(dl);
  if (p.plan) a.appendChild(planBox(p));
  const q = html('p', { className: 'question' });
  q.appendChild(html('b', {}, `${p.id}: ${QUESTION}`));
  q.appendChild(html('span', {}, `Answer in chat: “${p.id} yes”, or “${p.id} the blacks down first”.`));
  a.appendChild(q);
  return a;
}

function draw() {
  // Grouped by the themes the verdicts fell into (the user, 13 Nov: "kind of organize them into the themes"), each
  // under its heading; any position with no theme yet last.
  const list = document.querySelector('[data-positions]'), toc = document.querySelector('[data-toc]');
  // A batch to judge first, in its parts, under one heading (13 Nov: a batch to speed through).
  const fresh = POSITIONS.filter((p) => p.batch && !THEMED[p.id] && !VERDICTS[p.id]?.length && !SKIPPED[p.id]);
  if (fresh.length) {
    const top = html('section', { className: 'theme tojudge', id: 'to-judge' });
    top.appendChild(html('h2', {}, `To judge: ${fresh[0].id} to ${fresh[fresh.length - 1].id}`));
    top.appendChild(html('p', { className: 'about' }, `${fresh.length} new positions. For each: is the bot's idea right? Answer in chat by number, as briefly as you like: “${fresh[0].id} yes, ${fresh[1]?.id ?? fresh[0].id} the blacks down first”.`));
    list.appendChild(top);
    const line = html('div', { className: 'tojudge' });
    line.appendChild(html('a', { href: '#to-judge', target: '_self' }, 'To judge'));
    for (const [key, b] of Object.entries(BATCHES)) {
      const ps = fresh.filter((p) => p.batch === key);
      if (!ps.length) continue;
      const head = html('section', { className: 'part', id: `batch-${key}` });
      head.appendChild(html('h2', {}, b.name));
      head.appendChild(html('p', { className: 'about' }, b.about));
      list.appendChild(head);
      for (const p of ps) list.appendChild(toJudge(p));
      line.appendChild(document.createTextNode(' · '));
      line.appendChild(html('a', { href: `#batch-${key}`, target: '_self' }, b.name.replace(/^The /, '').replace(/^./, (c) => c.toLowerCase())));
      line.appendChild(document.createTextNode(': '));
      ps.forEach((p, i) => {
        if (i) line.appendChild(document.createTextNode(' · '));
        line.appendChild(html('a', { href: `#${p.id.toLowerCase()}`, target: '_self', title: p.like ? `like ${p.like}` : MOMENTS[p.moment] }, p.id));
      });
    }
    toc.appendChild(line);
  }
  const groups = Object.entries(THEMES).map(([key, t]) => ({ key, t, ps: POSITIONS.filter((p) => THEMED[p.id]?.theme === key) }));
  const rest = POSITIONS.filter((p) => !THEMED[p.id] && !fresh.includes(p));
  if (rest.length) groups.push({ key: 'new', t: { name: 'Not judged yet', about: 'new positions, waiting for your verdict' }, ps: rest });
  for (const { key, t, ps } of groups) {
    if (!ps.length) continue;
    const head = html('section', { className: 'theme', id: `theme-${key}` });
    head.appendChild(html('h2', {}, t.name));
    head.appendChild(html('p', { className: 'about' }, t.about));
    list.appendChild(head);
    for (const p of ps) list.appendChild(position(p));
    const line = html('div');
    line.appendChild(html('a', { href: `#theme-${key}`, target: '_self' }, t.name));
    line.appendChild(document.createTextNode(': '));
    ps.forEach((p, i) => {
      if (i) line.appendChild(document.createTextNode(' · '));
      line.appendChild(html('a', { href: `#${p.id.toLowerCase()}`, target: '_self', title: MOMENTS[p.moment] }, p.id));
    });
    toc.appendChild(line);
  }
  if (!POSITIONS.length) list.appendChild(html('p', { className: 'intro' }, 'No positions picked yet.'));
}

try { draw(); } catch (e) {
  console.error(e);
  document.getElementById('broken').hidden = false;
}
