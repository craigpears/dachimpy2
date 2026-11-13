/* Distilling: positions to critique (src/distill-positions.ts; the user, 13 Nov: "snapshots from partways through
   the game that I can critique and we can create some real deterministic test on what I think the bot should be
   doing at that point"). Two ways to run it, on the compiled js (npm run build first) with Node 22:

   node_modules/node/bin/node.exe tools/distill-positions.mjs
     Refresh: each position's `bot`, what the bot does there now, worked out again by the planner (`botAt`), after
     the bots change. The boards stay as they are. Then `npm run build`.

   node_modules/node/bin/node.exe tools/distill-positions.mjs pick [minutes]
     Pick the positions again from play: the CC^3 and CC^8 bots on seeds 1 to 3 (six sessions, about 15 s each,
     `minutes` of play each at most, default 12), a couple of each kind of moment (MOMENTS). A position the user
     has given a verdict on is kept as it is, id and all; the rest are replaced. Deterministic: the same bots pick
     the same positions. Then `npm run build`.

   Either way it rewrites only the lines between the POSITIONS markers in src/distill-positions.ts. */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COLS, Distilling, SPICE, WHITE, BROWN, BLACK, writeBoard } from '../js/distilling.js';
import { DistillBot, contextFor, edgeWhites, levelNamed } from '../js/distill-bots.js';
import { canGo, isJunk } from '../js/distill-routines.js';
import { stuck } from '../js/distill-path.js';
import { POSITIONS, SKIPPED, VERDICTS, botAt, moveOf } from '../js/distill-positions.js';
import { seeded } from '../js/mirror-row.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(ROOT, 'src/distill-positions.ts');
const START = '// ---- POSITIONS:', END = '// ---- end of POSITIONS ----';
const PICK = process.argv[2] === 'pick', CAP = Number(process.argv[3] ?? 12);
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
  // The fire's side, early in the session (6 to 30 s in, past the opening sweeps), the more whites by the fire the better.
  early: (c) => {
    if (c.advice.phase !== 'fire' || c.advice.kind !== 'move' || c.ms < 6000 || c.ms > 30000) return null;
    const n = [COLS - 3, COLS - 2, COLS - 1].reduce((s, x) => s + whitesIn(c.cols, x), 0);
    return { score: 2 * n - Math.abs(c.ms - 12000) / 4000, what: `${secs(c.ms)} into the session: ${plural(n, 'white')} still in the three columns by the fire, ${secs(c.timeLeft)} before the first goes.` };
  },
};

/** A position as written in the file, a few readable lines. */
function format(p) {
  const head = ['id', 'moment', 'level', 'seed', 'ms', 'stage', 'burns', 'chain', 'timeLeft'].map((k) => `${k}: ${JSON.stringify(p[k])}`).join(', ');
  return `  {\n    ${head},\n    what: ${JSON.stringify(p.what)},\n    cols: ${JSON.stringify(p.cols)},\n    bot: ${JSON.stringify(p.bot)},\n  },`;
}
function write(list) {
  const src = readFileSync(FILE, 'utf8'), i = src.indexOf(START), j = src.indexOf(END);
  if (i < 0 || j < 0) throw new Error('no POSITIONS markers in src/distill-positions.ts');
  const lineEnd = src.indexOf('\n', i) + 1;
  const body = list.length ? `export const POSITIONS: readonly Position[] = [\n${list.map(format).join('\n')}\n];\n` : 'export const POSITIONS: readonly Position[] = [];\n';
  writeFileSync(FILE, src.slice(0, lineEnd) + body + src.slice(j));
}

if (!PICK) {
  // Refresh what the bot does at each position now.
  let changed = 0;
  const list = POSITIONS.map((p) => {
    const bot = moveOf(botAt(p));
    if (!same(bot, p.bot)) { changed++; console.log(`${p.id}: was ${p.bot.label} (${p.bot.kind}), now ${bot.label} (${bot.kind})`); }
    return { ...p, bot };
  });
  write(list);
  console.log(`refreshed ${list.length} positions, ${changed} changed. Now npm run build.`);
} else {
  // Play the sessions, keeping each kind's best moment in each.
  const best = new Map();   // kind -> [{ session, score, position }]
  for (const [name, seed] of SESSIONS) {
    const level = levelNamed(name), g = new Distilling(seeded(seed)), bot = new DistillBot(level), swapMs = 1000 / level.rate;
    const t0 = Date.now(), top = {};
    let went = false, blockMoves = 0;
    const handle = (ev) => { for (const e of ev) if (e.kind === 'column') { went = true; bot.seen(e.column, g); } };
    while (!g.finished && g.time < CAP * 60000) {
      if (g.sliding > 0) { handle(g.tick(g.sliding)); continue; }
      const cols = g.cols.map((c) => [...c]), timeLeft = g.timeLeft(), chain = g.chain;
      const a = bot.plan(g);
      const ctx = contextFor(cols, bot.stage, bot.burns, level.reach);
      if (a.phase === 'block' && a.kind === 'move') blockMoves++;
      const c = { cols, timeLeft, chain, ms: Math.round(g.time), stage: bot.stage, burns: bot.burns, ctx, advice: a, blockMoves };
      for (const kind of KINDS) {
        const m = MOMENT[kind](c);
        if (!m || (top[kind] && top[kind].score >= m.score)) continue;
        const position = { id: '', moment: kind, level: name, seed, ms: c.ms, stage: c.stage, burns: c.burns, chain, timeLeft, what: m.what, cols: writeBoard(cols), bot: moveOf(a) };
        // Only a moment the planner gives again from what's kept (nothing hidden in the bot's state).
        if (!same(moveOf(botAt(position)), position.bot)) continue;
        top[kind] = { score: m.score, position };
      }
      // Play the move as the bots do (src/distill-bots.ts's playSession).
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
    for (const [kind, t] of Object.entries(top)) best.set(kind, [...(best.get(kind) ?? []), { session: `${name}:${seed}`, ...t }]);
    console.log(`${name} seed ${seed}: ${((Date.now() - t0) / 1000).toFixed(1)} s, ${(g.time / 60000).toFixed(1)} min of play; found ${Object.keys(top).join(', ') || 'nothing'}`);
  }
  // Keep the positions with verdicts; fill each kind up to EACH with the most telling, from different sessions.
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
  // Ids: kept ones keep theirs; new ones numbered on from the highest.
  let next = Math.max(0, ...kept.map((p) => Number(p.id.slice(1)))) + 1;
  for (const p of list) if (!p.id) p.id = `P${next++}`;
  write(list);
  console.log(`wrote ${list.length} positions (${kept.length} kept for their verdicts):`);
  for (const p of list) console.log(`  ${p.id} ${p.moment} ${p.level} seed ${p.seed} at ${secs(p.ms)}: ${p.bot.label} (${p.bot.kind}, ${p.bot.phase})`);
  console.log('Now npm run build.');
}
