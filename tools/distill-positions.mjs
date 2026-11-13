/* Distilling: positions to critique (src/distill-positions.ts; the user, 13 Nov: "snapshots from partways through
   the game that I can critique and we can create some real deterministic test on what I think the bot should be
   doing at that point"). Two ways to run it, on the compiled js (npm run build first) with Node 22:

   node_modules/node/bin/node.exe tools/distill-positions.mjs
     Refresh: each position's `bot`, what the bot does there now, worked out again by the planner (`botAt`), and its
     `plan`, its next few moves played forward (`planOf`), after the bots change. The boards stay as they are. Then `npm run build`.

   node_modules/node/bin/node.exe tools/distill-positions.mjs pick [minutes]
     Pick the positions again from play: the CC^3 and CC^8 bots on seeds 1 to 3 (six sessions, about 15 s each,
     `minutes` of play each at most, default 12), a couple of each kind of moment (MOMENTS). A position the user
     has given a verdict on is kept as it is, id and all; the rest are replaced. Deterministic: the same bots pick
     the same positions. Then `npm run build`.

   node_modules/node/bin/node.exe tools/distill-positions.mjs batch [minutes]
     A new batch to judge (13 Nov), added after the positions there, which all stay as they are: fresh play by the
     CC^2, CC^5 and CC^8 bots on seeds 4 to 9 (`minutes` of play each at most, default 5), and from it
     - random: about 8 telling moments, one of each kind (early, low, edge, stuck, block, the chain under way) and two
       more, each from a different deal;
     - the theme challenge: for each theme the user judged (THEMED), one or two boards the board reader
       (src/distill-read.ts) reads as that theme's judged positions read, each `like` the judged position it's nearest
       (its reading's targets in the same places, the same time of the session), from different deals.
     No two from the same session within 30 s of each other. Deterministic. Then the refresh above, then `npm run build`.

   node_modules/node/bin/node.exe tools/distill-positions.mjs leadup [minutes]
     The lead-up (13 Nov): fresh play by the CC^3, CC^5 and CC^8 bots on seeds 10 to 21 (`minutes` each, default 4, the
     early and middle game; about 8 minutes to run), and the moves that put a white in trouble (`inTrouble`): the last
     board where it was still free enough, the move drawn, the white ringed (`shut`). About 12 added, the earliest first.
     Then the refresh above, then `npm run build`.

   Each way it rewrites only the lines between the POSITIONS markers in src/distill-positions.ts. */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COLS, Distilling, SPICE, WHITE, BROWN, BLACK, writeBoard } from '../js/distilling.js';
import { DistillBot, contextFor, edgeWhites, levelNamed } from '../js/distill-bots.js';
import { canGo, isJunk } from '../js/distill-routines.js';
import { stuck } from '../js/distill-path.js';
import { POSITIONS, SKIPPED, THEMED, VERDICTS, botAt, moveOf, planOf } from '../js/distill-positions.js';
import { inTrouble, readBoard } from '../js/distill-read.js';
import { seeded } from '../js/mirror-row.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(ROOT, 'src/distill-positions.ts');
const START = '// ---- POSITIONS:', END = '// ---- end of POSITIONS ----';
const MODE = process.argv[2] ?? 'refresh', PICK = MODE === 'pick', BATCH = MODE === 'batch';
const CAP = Number(process.argv[3] ?? (BATCH ? 5 : MODE === 'leadup' ? 4 : 12));
/** The sessions positions are picked from, in order: CC^3 and CC^8, seeds 1 to 3. */
const SESSIONS = [['cc3', 1], ['cc8', 1], ['cc3', 2], ['cc8', 2], ['cc3', 3], ['cc8', 3]];
/** How many of each kind of moment, in the page's order. */
const KINDS = ['early', 'low', 'edge', 'stuck', 'block', 'junkUp'], EACH = 2;

const secs = (ms) => `${(ms / 1000).toFixed(1)} s`;
const whitesIn = (cols, x) => cols[x].filter((p) => p === WHITE).length;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const NAMES = { [WHITE]: 'white', [BROWN]: 'brown', [BLACK]: 'black', [SPICE]: 'spice', 4: 'burnt white' };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Each kind of moment: whether a plan is one (a score, higher the more telling; null if not), and its words. */
const MOMENT = {
  // Whites in the bottom three rows of the two columns by the fire, the furnace near (12 s or less).
  low: (c) => {
    if (c.stage !== 'junk' || c.timeLeft > 12000) return null;
    const n = [COLS - 2, COLS - 1].reduce((s, x) => s + c.cols[x].filter((p, y) => p === WHITE && y >= c.cols[x].length - 3).length, 0);
    return n >= 2 ? { score: n * 10 - c.timeLeft / 1000, what: `${plural(n, 'white')} in the bottom rows of the two columns by the fire, ${secs(c.timeLeft)} before the furnace takes column 10.` } : null;
  },
  // A white on its column's top or bottom, or beside a spice, in the three columns next to the fire (short of the
  // furnace's own).
  edge: (c) => {
    if (c.stage !== 'junk') return null;
    const e = edgeWhites(c.cols).filter((w) => w.x < COLS - 1);
    if (!e.length) return null;
    const w = e[0], len = c.cols[w.x].length;
    const where = w.y === 0 ? 'at the top of' : w.y === len - 1 ? 'at the bottom of' : 'beside a spice in';
    const spice = e.some((v) => v.y > 0 && v.y < c.cols[v.x].length - 1);
    return { score: e.length + (spice ? 3 : 0) - c.timeLeft / 20000, what: `A white ${where} column ${w.x + 1}, ${plural(COLS - 1 - w.x, 'column')} from the fire${e.length > 1 ? `, and ${plural(e.length - 1, 'more white')} on an edge or by a spice near it` : ''}; ${secs(c.timeLeft)} on the furnace.` };
  },
  // Stage I, the bot waiting while a piece is stuck where it can't go its way; most telling with whites in the three columns
  // by the fire that can't get out left on their own, low down (DISTILLING.md's thirty-second note: "It seems to have
  // just frozen").
  stuck: (c) => {
    if (c.advice.kind !== 'wait' || c.stage !== 'junk') return null;
    const s = stuck(c.cols, c.ctx);
    if (!s.length) return null;
    const near = [];
    for (let x = COLS - 3; x < COLS; x++) c.cols[x].forEach((p, y) => { if (p === WHITE && !canGo(c.cols, x, y, -1)) near.push({ x, y, low: y >= c.cols[x].length / 2 }); });
    const low = near.filter((w) => w.low).length;
    const kinds = [...new Set(s.map((p) => NAMES[c.cols[p.x][p.y]]))].join(' and ');
    const by = [...new Set(near.map((w) => w.x + 1))].join(' and ');
    return {
      score: 6 * low + 3 * near.length + s.length / 10,
      what: `The bot waits, with ${plural(s.length, 'piece')} stuck (${kinds})${near.length ? `, ${plural(near.length, 'white')} in column${by.includes('and') ? 's' : ''} ${by} by the fire with no way out left on ${near.length === 1 ? 'its' : 'their'} own${low ? `, ${low} of them low down` : ''}` : ''}; ${secs(c.timeLeft)} on the furnace.`,
    };
  },
  // In the chain, the furnace's column going up next with junk in it, the furnace near but time left to act (2.5 to 7 s).
  junkUp: (c) => {
    if (c.stage !== 'chain' || c.ctx.burnFrom <= COLS - 1 || c.timeLeft > 7000 || c.timeLeft < 2500) return null;
    const col = c.cols[COLS - 1], j = col.filter(isJunk).length;
    if (!j) return null;
    const b = col.filter((p) => p === BROWN).length, k = j - b;
    return { score: 10 - 2 * j + (c.chain ? 3 : 0) - c.timeLeft / 3000, what: `${c.chain ? `The chain at CC^${c.chain}` : 'The chain starting'}; column 10 goes up next with ${[b && plural(b, 'brown'), k && plural(k, 'black')].filter(Boolean).join(' and ')} in it, ${secs(c.timeLeft)} before it goes.` };
  },
  // The block phase, a few moves in.
  block: (c) => {
    if (c.advice.phase !== 'block' || c.advice.kind !== 'move' || c.blockMoves < 3) return null;
    const whites = c.cols.reduce((s, col) => s + col.filter((p) => p === WHITE).length, 0);
    return { score: -Math.abs(c.blockMoves - 5), what: `Whites mostly left (${whites} on the board); the junk being moved in blocks and wrapped round them in a V. ${secs(c.timeLeft)} on the furnace.` };
  },
  // The chain under way (a batch's): the bot filling a column, CC^2 or more banked, the furnace 4 to 12 s off.
  chain: (c) => {
    if (c.stage !== 'chain' || c.advice.kind !== 'move' || c.chain < 2 || c.timeLeft > 12000 || c.timeLeft < 4000) return null;
    const col = c.advice.column ?? COLS - 1, j = c.cols[col].filter(isJunk).length;
    return { score: c.chain + j - c.timeLeft / 6000, what: `The chain at CC^${c.chain}, the bot filling column ${col + 1} (${plural(j, 'piece')} of junk still in it), ${secs(c.timeLeft)} on the furnace.` };
  },
  // The fire's side, early in the session (6 to 30 s in, past the opening sweeps), the more whites by the fire the better.
  early: (c) => {
    if (c.advice.phase !== 'fire' || c.advice.kind !== 'move' || c.ms < 6000 || c.ms > 30000) return null;
    const n = [COLS - 3, COLS - 2, COLS - 1].reduce((s, x) => s + whitesIn(c.cols, x), 0);
    return { score: 2 * n - Math.abs(c.ms - 12000) / 4000, what: `${secs(c.ms)} into the session: ${plural(n, 'white')} still in the three columns by the fire, ${secs(c.timeLeft)} before the first goes.` };
  },
};

/** A position as written in the file, a few readable lines. */
function format(p) {
  const head = ['id', 'moment', 'level', 'seed', 'ms', 'stage', 'burns', 'chain', 'timeLeft', 'batch', 'like', 'shut'].filter((k) => p[k] !== undefined).map((k) => `${k}: ${JSON.stringify(p[k])}`).join(', ');
  return `  {\n    ${head},\n    what: ${JSON.stringify(p.what)},\n    cols: ${JSON.stringify(p.cols)},\n    bot: ${JSON.stringify(p.bot)},${p.plan ? `\n    plan: ${JSON.stringify(p.plan)},` : ''}\n  },`;
}
function write(list) {
  const src = readFileSync(FILE, 'utf8'), i = src.indexOf(START), j = src.indexOf(END);
  if (i < 0 || j < 0) throw new Error('no POSITIONS markers in src/distill-positions.ts');
  const lineEnd = src.indexOf('\n', i) + 1;
  const body = list.length ? `export const POSITIONS: readonly Position[] = [\n${list.map(format).join('\n')}\n];\n` : 'export const POSITIONS: readonly Position[] = [];\n';
  writeFileSync(FILE, src.slice(0, lineEnd) + body + src.slice(j));
}

/** Play a session as the bots do (src/distill-bots.ts's playSession), calling `visit` with each moment before its
    move: the board, the furnace's time, the chain, the bot's stage, its context and its advice. */
function play(name, seed, cap, visit) {
  const level = levelNamed(name), g = new Distilling(seeded(seed)), bot = new DistillBot(level), swapMs = 1000 / level.rate;
  let went = false, blockMoves = 0;
  const handle = (ev) => { for (const e of ev) if (e.kind === 'column') { went = true; bot.seen(e.column, g); } };
  while (!g.finished && g.time < cap * 60000) {
    if (g.sliding > 0) { handle(g.tick(g.sliding)); continue; }
    const cols = g.cols.map((c) => [...c]), timeLeft = g.timeLeft(), chain = g.chain;
    const a = bot.plan(g);
    const ctx = contextFor(cols, bot.stage, bot.burns, level.reach);
    if (a.phase === 'block' && a.kind === 'move') blockMoves++;
    visit({ cols, timeLeft, chain, ms: Math.round(g.time), stage: bot.stage, burns: bot.burns, ctx, advice: a, blockMoves, gone: g.columns.length });
    if (a.kind === 'dismiss') { g.dismiss(); break; }
    if (a.kind === 'burn') { handle(g.burnNow()); handle(g.tick(level.spot)); continue; }
    if (a.kind === 'wait') { handle(g.tick(Math.max(1, Math.min(250, g.timeLeft())))); continue; }
    went = false;
    for (const d of a.drags) {
      handle(g.tick(a.sweep ? level.sweepSpot : level.spot));
      let x = d.x, y = d.y, ok = true;
      for (const w of d.ways) {
        if (went || !g.movable) break;
        const n = g.swapToward(x, y, w);
        if (!n) { ok = false; break; }
        [x, y] = n;
        handle(g.tick(swapMs));
      }
      if (went || !ok) break;
    }
  }
  return g;
}
/** A moment kept as a position (no id yet). */
const positionAt = (c, name, seed, moment, what) => ({ id: '', moment, level: name, seed, ms: c.ms, stage: c.stage, burns: c.burns, chain: c.chain, timeLeft: c.timeLeft, what, cols: writeBoard(c.cols), bot: moveOf(c.advice) });
/** Only a moment the planner gives again from what's kept (nothing hidden in the bot's state). */
const again = (position) => same(moveOf(botAt(position)), position.bot);
/** Two positions too near to judge both: the same session within 30 s of play, or early on (a deal plays alike at every level at first) the same deal. */
const near = (a, b) => a.seed === b.seed && Math.abs(a.ms - b.ms) < 30000 && (a.level === b.level || Math.min(a.ms, b.ms) < 60000);

if (MODE === 'refresh') {
  // Refresh what the bot does at each position now.
  let changed = 0;
  const list = POSITIONS.map((p) => {
    const bot = moveOf(botAt(p)), plan = planOf(p);
    if (!same(bot, p.bot)) { changed++; console.log(`${p.id}: was ${p.bot.label} (${p.bot.kind}), now ${bot.label} (${bot.kind})`); }
    console.log(`${p.id}: plan of ${plan.moves.length}, aim ${plan.aim ?? 'none'}, ${plan.reached ? `reached by move ${plan.reached}` : 'not reached'}${plan.reached && !plan.through ? ', not seen through' : ''} (${plan.ends})`);
    return { ...p, bot, plan };
  });
  write(list);
  console.log(`refreshed ${list.length} positions, ${changed} changed. Now npm run build.`);
} else if (PICK) {
  // Play the sessions, keeping each kind's best moment in each.
  const best = new Map();   // kind -> [{ session, score, position }]
  for (const [name, seed] of SESSIONS) {
    const t0 = Date.now(), top = {};
    const g = play(name, seed, CAP, (c) => {
      for (const kind of KINDS) {
        const m = MOMENT[kind](c);
        if (!m || (top[kind] && top[kind].score >= m.score)) continue;
        const position = positionAt(c, name, seed, kind, m.what);
        if (!again(position)) continue;
        top[kind] = { score: m.score, position };
      }
    });
    for (const [kind, t] of Object.entries(top)) best.set(kind, [...(best.get(kind) ?? []), { session: `${name}:${seed}`, ...t }]);
    console.log(`${name} seed ${seed}: ${((Date.now() - t0) / 1000).toFixed(1)} s, ${(g.time / 60000).toFixed(1)} min of play; found ${Object.keys(top).join(', ') || 'nothing'}`);
  }
  // Keep the positions with verdicts; fill each kind up to EACH with the most telling, from different sessions; any
  // batch to judge stays as it is.
  const kept = POSITIONS.filter((p) => VERDICTS[p.id]?.length || SKIPPED[p.id]);
  const list = [];
  for (const kind of KINDS) {
    const mine = kept.filter((p) => p.moment === kind);
    const fresh = (best.get(kind) ?? []).sort((a, b) => b.score - a.score)
      .filter((c) => !mine.some((p) => p.level === c.position.level && p.seed === c.position.seed && p.ms === c.position.ms));
    // Each from a different deal (a seed deals the same board to every bot), the most telling first.
    const seeds = new Set(mine.map((p) => p.seed)), picked = [];
    for (const c of fresh) if (picked.length < EACH - mine.length && !seeds.has(c.position.seed)) { picked.push(c.position); seeds.add(c.position.seed); }
    for (const c of fresh) if (picked.length < EACH - mine.length && !picked.includes(c.position)) picked.push(c.position);
    list.push(...mine, ...picked);
  }
  list.push(...POSITIONS.filter((p) => p.batch && !list.includes(p)));
  // Ids: kept ones keep theirs; new ones numbered on from the highest.
  let next = Math.max(0, ...POSITIONS.map((p) => Number(p.id.slice(1)))) + 1;
  for (const p of list) if (!p.id) p.id = `P${next++}`;
  write(list);
  console.log(`wrote ${list.length} positions (${kept.length} kept for their verdicts):`);
  for (const p of list) console.log(`  ${p.id} ${p.moment} ${p.level} seed ${p.seed} at ${secs(p.ms)}: ${p.bot.label} (${p.bot.kind}, ${p.bot.phase})`);
  console.log('Now npm run build.');
} else if (BATCH) {
  // A batch to judge: fresh play on levels and deals not used before (LEVELS and SEEDS to try fewer).
  const LEVELS = (process.env.LEVELS ?? 'cc2,cc5,cc8').split(','), SEEDS = (process.env.SEEDS ?? '4,5,6,7,8,9').split(',').map(Number);
  const RANDOM_KINDS = ['early', 'low', 'edge', 'stuck', 'block', 'chain'], EXTRA = ['stuck', 'edge'];
  const DRY = !!process.env.DRY;
  // The judged positions with a reading, each read now: what a challenge board must read as, and its targets.
  const judged = POSITIONS.filter((p) => THEMED[p.id]?.reads && VERDICTS[p.id]?.length).map((p) => {
    const r = readBoard(p.cols.map((s) => [...s].map((ch) => 'wbK*x'.indexOf(ch))), { stage: p.stage, timeLeft: p.timeLeft });
    return { p, theme: THEMED[p.id].theme, reads: THEMED[p.id].reads, targets: r.targets };
  });
  const matches = (r, reads) => (!reads.state || r.state === reads.state) && (!reads.tactic || r.tactic === reads.tactic);
  const key = (t) => `${t.x},${t.y}`;
  // How like a judged position a reading is: its targets in the same places (the share shared), the same time of the
  // session (in the first 30 s or not), the furnace's time near.
  const likeness = (j, r, c) => {
    const a = new Set(r.targets.map(key)), b = new Set(j.targets.map(key)), both = [...a].filter((k) => b.has(k)).length;
    const shared = a.size + b.size ? both / (a.size + b.size - both) : 0;
    return shared + 0.5 * ((c.ms < 30000) === (j.p.ms < 30000) ? 1 : 0) + 0.3 * Math.max(0, 1 - Math.abs(c.timeLeft - j.p.timeLeft) / 15000);
  };
  let randoms = new Map(), challenges = new Map();   // kind -> [...], judged id -> [...]
  // CACHE: a file to keep the play's moments in, so the picking can be tried again without playing again.
  const CACHE = process.env.CACHE, cached = CACHE && existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : null;
  if (cached) { randoms = new Map(cached.randoms); challenges = new Map(cached.challenges); console.log(`moments from ${CACHE}`); }
  if (!cached) for (const name of LEVELS) for (const seed of SEEDS) {
    const t0 = Date.now(), top = {}, like = {};
    const g = play(name, seed, CAP, (c) => {
      for (const kind of RANDOM_KINDS) {
        const m = MOMENT[kind](c);
        if (!m || (top[kind] && top[kind].score >= m.score)) continue;
        const position = positionAt(c, name, seed, kind, m.what);
        if (again(position)) top[kind] = { score: m.score, position };
      }
      if (c.stage !== 'junk' || c.ms < 6000) return;   // past the opening sweeps, as the early moments are
      const r = readBoard(c.cols, { stage: c.stage, timeLeft: c.timeLeft });
      for (const j of judged) {
        if (!matches(r, j.reads)) continue;
        // Kept as like the nearest judged position of all those it reads as.
        const score = likeness(j, r, c), better = judged.some((k) => k !== j && matches(r, k.reads) && likeness(k, r, c) > score);
        if (better || (like[j.p.id] && like[j.p.id].score >= score)) continue;
        const what = `Read as ${j.p.id} is: ${r.why}. ${secs(c.ms)} in, ${secs(c.timeLeft)} on the furnace.`;
        const position = { ...positionAt(c, name, seed, 'read', what), batch: 'challenge', like: j.p.id };
        if (again(position)) like[j.p.id] = { score, position };
      }
    });
    for (const [kind, t] of Object.entries(top)) randoms.set(kind, [...(randoms.get(kind) ?? []), t]);
    for (const [id, t] of Object.entries(like)) challenges.set(id, [...(challenges.get(id) ?? []), t]);
    console.log(`${name} seed ${seed}: ${((Date.now() - t0) / 1000).toFixed(1)} s, ${(g.time / 60000).toFixed(1)} min of play; moments ${Object.keys(top).join(', ') || 'none'}; like ${Object.keys(like).join(', ') || 'none'}`);
  }
  if (CACHE && !cached) writeFileSync(CACHE, JSON.stringify({ randoms: [...randoms], challenges: [...challenges] }));
  const picked = [], clash = (q) => picked.some((p) => near(p, q)) || POSITIONS.some((p) => near(p, q));
  // The theme challenge first (rarer): per theme one or two, from different deals, like different judged positions
  // where it can.
  const themes = [...new Set(judged.map((j) => j.theme))];
  for (const theme of themes) {
    const ids = judged.filter((j) => j.theme === theme).map((j) => j.p.id);
    const best = ids.map((id) => (challenges.get(id) ?? []).sort((a, b) => b.score - a.score));
    const mine = [], seeds = new Set();
    const take = (t) => { if (mine.length < 2 && !seeds.has(t.position.seed) && !clash(t.position)) { mine.push(t.position); picked.push(t.position); seeds.add(t.position.seed); } };
    // One like each judged position first (the one whose best is likest first), then any.
    for (const b of [...best].sort((u, v) => (v[0]?.score ?? -1) - (u[0]?.score ?? -1))) for (const t of b) { const n = mine.length; take(t); if (mine.length > n) break; }
    for (const b of best) for (const t of b) take(t);
    console.log(`challenge ${theme}: ${mine.length ? mine.map((p) => `${p.level} seed ${p.seed} at ${secs(p.ms)}, like ${p.like}`).join('; ') : 'none found'}`);
  }
  const challengeList = [...picked];
  // Random: one of each kind, each from a deal not used yet among the random ones; then two more, any session.
  const randomList = [], seeds = new Set();
  const take = (kind, anyDeal = false) => {
    for (const t of (randoms.get(kind) ?? []).sort((a, b) => b.score - a.score)) {
      if (t.position.ms < 6000 || (!anyDeal && seeds.has(t.position.seed)) || clash(t.position) || randomList.some((p) => same(p.cols, t.position.cols))) continue;
      const p = { ...t.position, batch: 'random' };
      randomList.push(p); picked.push(p); seeds.add(p.seed);
      return;
    }
    console.log(`random ${kind}: none on a new deal`);
  };
  for (const kind of RANDOM_KINDS) take(kind);
  for (const kind of EXTRA) take(kind, true);
  let next = Math.max(0, ...POSITIONS.map((p) => Number(p.id.slice(1)))) + 1;
  for (const p of [...randomList, ...challengeList]) { p.id = `P${next++}`; p.plan = planOf(p); }
  if (!DRY) write([...POSITIONS, ...randomList, ...challengeList]);
  console.log(`${DRY ? 'would add' : 'added'} ${randomList.length} random and ${challengeList.length} challenge positions:`);
  for (const p of [...randomList, ...challengeList]) console.log(`  ${p.id} ${p.batch} ${p.moment}${p.like ? ` like ${p.like}` : ''} ${p.level} seed ${p.seed} at ${secs(p.ms)}: ${p.bot.label} (${p.bot.kind}, ${p.bot.phase}); ${p.what}`);
  console.log('Now npm run build.');
} else if (MODE === 'leadup') {
  // The lead-up (13 Nov): "the ones I really want to be judging are the things that have gotten me into that position
  // beforehand ... you're showing me examples after the problem already looks irreversible"; "give me options earlier in
  // the game". Fresh play (LEVELS, SEEDS; `minutes` each, default 4: the early and middle game); at every bot move in
  // Stage I, the whites from column 5 on in trouble (src/distill-read.ts, `inTrouble`: trapped, a complicated way out of
  // many swaps or none; or in the furnace's column, past saving in the time left) counted before and after it. A move
  // after which one more is is the moment: the last board where that white was still free enough, and the move that put
  // it in trouble: the first move toward trouble, not the last board before it's lost (the user, 13 Nov: "try and get
  // earlier in ... the most common theme was this is all coming too late"). A white burned that wasn't seen so: the move
  // that left its column with a white in trouble, looked for back to a column before. About COUNT kept (default 12), the
  // earliest in the session first, two a session at most, 30 s apart, each deal once before any twice.
  const LEVELS = (process.env.LEVELS ?? 'cc3,cc5,cc8').split(','), SEEDS = (process.env.SEEDS ?? '10,11,12,13,14,15,16,17,18,19,20,21').split(',').map(Number);
  const COUNT = Number(process.env.COUNT ?? 12), DRY = !!process.env.DRY, FROM = 4;
  const lostIn = (cols, x0 = FROM, x1 = COLS - 1, timeLeft = Infinity) => {
    const out = [];
    for (let x = Math.max(1, x0); x <= x1; x++) cols[x].forEach((_, y) => { if (inTrouble(cols, x, y, timeLeft)) out.push([x, y]); });
    return out;
  };
  const found = [];
  for (const name of LEVELS) for (const seed of SEEDS) {
    const t0 = Date.now(), moments = [];
    const g = play(name, seed, CAP, (c) => { moments.push(c); });
    const events = [];
    for (let i = 0; i + 1 < moments.length; i++) {
      const c = moments[i], n = moments[i + 1];
      if (c.stage !== 'junk' || c.advice.kind !== 'move' || c.ms < 6000 || n.gone !== c.gone) continue;
      const before = lostIn(c.cols, FROM, COLS - 1, c.timeLeft), after = lostIn(n.cols, FROM, COLS - 1, n.timeLeft);
      if (after.length <= before.length) continue;
      // The whites shut in by the move: where they stand after it, on the board before it (a held white at its start).
      const was = new Set(before.map(([x, y]) => `${x},${y}`));
      const shut = after.filter(([x, y]) => !was.has(`${x},${y}`)).map(([x, y]) => {
        if (c.cols[x][y] === WHITE) return [x, y];
        const held = c.advice.drags.find((d) => c.cols[d.x][d.y] === WHITE);
        return held ? [held.x, held.y] : [x, y];
      });
      events.push({ c, shut, why: 'shut' });
    }
    // Whites burned: the column they burned in, looked back at over the moves while it was one of the two columns by the
    // fire, for the last move that left a white in it nothing could free (one not already counted above).
    g.columns.forEach((col, k) => {
      if (col.up || !col.whites) return;
      for (let i = moments.length - 2; i >= 0; i--) {
        const c = moments[i], n = moments[i + 1], x = COLS - 1 - (k - c.gone);
        if (c.gone > k || n.gone !== c.gone || c.stage !== 'junk' || c.advice.kind !== 'move' || c.ms < 6000) continue;
        if (x < COLS - 2) break;
        if (events.some((e) => e.c === c)) break;
        const before = lostIn(c.cols, x, x, c.timeLeft), after = lostIn(n.cols, x, x, n.timeLeft);
        if (after.length > before.length) { events.push({ c, shut: after.filter(([ax, ay]) => !before.some(([bx, by]) => bx === ax && by === ay)), why: 'burned', at: secs(n.ms) }); break; }
      }
    });
    for (const e of events) {
      const position = positionAt(e.c, name, seed, 'leadup', '');
      position.batch = 'leadup';
      position.shut = e.shut;
      if (!again(position)) continue;
      const where = e.shut.map(([x, y]) => `column ${x + 1}, row ${y + 1}`).join(' and ');
      position.what = `${secs(e.c.ms)} in, ${secs(e.c.timeLeft)} on the furnace: the white${e.shut.length > 1 ? 's' : ''} at ${where} (ringed) ${e.shut.length > 1 ? 'are' : 'is'} free enough here; after the bot's move ${e.shut.length > 1 ? 'they are' : 'it is'} trapped (a long, complicated way out, or none)${e.why === 'burned' ? ', and it burns' : ''}.`;
      found.push(position);
    }
    console.log(`${name} seed ${seed}: ${((Date.now() - t0) / 1000).toFixed(1)} s, ${(g.time / 60000).toFixed(1)} min of play, ${moments.length} moments; ${events.length} whites shut in, at ${events.map((e) => secs(e.c.ms)).join(', ') || 'none'}; whites burned ${g.whitesBurned}`);
  }
  // The earliest first; two a session at most, 30 s apart, nothing near a position already there; each deal once
  // before any twice.
  found.sort((a, b) => a.ms - b.ms);
  const picked = [], clash = (q) => picked.some((p) => near(p, q)) || POSITIONS.some((p) => near(p, q));
  const perSession = (q) => picked.filter((p) => p.level === q.level && p.seed === q.seed).length;
  for (const pass of [1, 2]) for (const q of found) {
    if (picked.length >= COUNT || picked.includes(q) || clash(q) || perSession(q) >= pass || (pass === 1 && picked.some((p) => p.seed === q.seed))) continue;
    picked.push(q);
  }
  picked.sort((a, b) => a.ms - b.ms);
  let next = Math.max(0, ...POSITIONS.map((p) => Number(p.id.slice(1)))) + 1;
  for (const p of picked) { p.id = `P${next++}`; p.plan = planOf(p); }
  if (!DRY) write([...POSITIONS, ...picked]);
  console.log(`${DRY ? 'would add' : 'added'} ${picked.length} lead-up positions (of ${found.length} found):`);
  for (const p of picked) console.log(`  ${p.id} ${p.level} seed ${p.seed} at ${secs(p.ms)}: ${p.bot.label}; ${p.what}`);
  console.log('Now npm run build.');
} else throw new Error(`unknown mode ${MODE}: refresh (none), pick, batch or leadup`);
