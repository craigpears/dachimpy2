/* Distilling's read version (distilling-guide.html, the user, 13 Nov: "a 2D static version of the guide, and ...
   everything's just kept in sync"): picks the guide's later boards from real play. A bot (src/distill-bots.ts,
   CC^8, every technique) plays seeded deals; wherever it plays a technique, or a phase or one of the user's tricks
   shows, the board is kept as a candidate, and for a technique the bot never played, the first board where that
   routine's own `find` offers a move. The clearest of each is written to src/distill-guide-boards.ts, plain data;
   src/distill-guide.ts draws its moves live from the routines, and tests/distill-guide.test.ts fails when a
   routine no longer offers its move there. Run it again (then `npm run build`) whenever that test says so: when
   the routines or the planner change, the guide's pictures change with them.

   The early boards (the fire's side, the fill, saving the whites, never a white down the fire) aren't picked
   here: they're the lesson's own, worked out live from Helium's board (src/den-helium.ts).

   Run on the compiled js (npm run build first) with Node 22:
   node_modules/node/bin/node.exe tools/distill-guide.mjs [sessions]
   - sessions: seeded deals at most (default 6, seeds 5000 on), about 16 s each; it stops early once every
     technique has been played by the bot. */

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COLS, Distilling, WHITE, writeBoard } from '../js/distilling.js';
import { DistillBot, clearComingUp, contextFor, dangerZones, edgeWhites, levelNamed, plainDrag } from '../js/distill-bots.js';
import { ROUTINES, burnsClean, canGo, playDrags, swapsIn } from '../js/distill-routines.js';
import { blockPhase, keptTools } from '../js/distill-score.js';
import { seeded } from '../js/mirror-row.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SESSIONS = Number(process.argv[2] ?? 6), FIRST_SEED = 5000, BOT = 'cc8';
const level = levelNamed(BOT);
const ROUTINE_NAMES = Object.keys(ROUTINES);
/** The techniques drawn on these boards: every routine but saving the whites (drawn on the lesson's own board), the
    path search's piece brought round, and the sweep. */
const TECHNIQUES = [...ROUTINE_NAMES.filter((n) => n !== 'rescue'), 'path', 'sweep'];
/** Where a technique's picture reads best: the diamond as Stage I plays it, junk right (the chain plays its mirror). */
const PREFER = {
  'technique:diamond': (c) => c.stage === 'junk',
  // A pair's techniques read best with both pieces' drags drawn, not a single drag of one of them.
  'technique:crawl': (c) => c.drags.length >= 2,
  'technique:figureEight': (c) => c.drags.length >= 2,
};

/** Candidates by key: 'technique:crawl', 'phase:block', 'trick:danger'... */
const found = new Map();
const keep = (key, c) => { const l = found.get(key) ?? []; if (l.length < 40) l.push(c); found.set(key, l); };

const whitesIn = (cols, x) => cols[x].filter((p) => p === WHITE).length;
const hard = (cols, x) => cols[x].some((p, y) => p === WHITE && !canGo(cols, x, y, -1));

for (let s = 0; s < SESSIONS; s++) {
  const seed = FIRST_SEED + s, g = new Distilling(seeded(seed)), bot = new DistillBot(level), swapMs = 1000 / level.rate;
  let blockMoves = 0, went = false;
  const handle = (ev) => { for (const e of ev) if (e.kind === 'column') { went = true; bot.seen(e.column, g); } };
  const t0 = Date.now();
  while (!g.finished && g.time < 30 * 60000) {
    if (g.sliding > 0) { handle(g.tick(g.sliding)); continue; }
    const a = bot.plan(g);
    const ctx = contextFor(g.cols, bot.stage, bot.burns, level.reach);
    const at = { seed, bot: BOT, ms: Math.round(g.time), stage: a.stage, phase: a.phase, chain: g.chain, cols: writeBoard(g.cols), ctx };
    const cols = g.cols.map((c) => [...c]);
    if (a.kind === 'move' && a.drags.length) {
      const technique = a.sweep ? 'sweep' : a.technique;
      const c = { ...at, technique, by: a.technique, drags: a.drags, chosen: true };
      keep(`technique:${technique}`, c);
      const after = playDrags(cols, a.drags);
      if (a.phase === 'block') { blockMoves++; if (blockMoves >= 3) keep('phase:block', c); if (swapsIn(a.drags) >= 5) keep('trick:blocks', c); }
      if (a.phase === 'chain' && g.chain >= 1) keep('phase:chain', c);
      if (after && a.stage === 'junk') {
        // The danger low by the fire: a hard-to-reach white in the column before the furnace's, taken out.
        if (dangerZones(cols, 'junk', true).includes(COLS - 2) && hard(cols, COLS - 2) && whitesIn(after, COLS - 2) < whitesIn(cols, COLS - 2)) keep('trick:danger', c);
        // A white on an edge or by a spice, next to the fire, got out.
        if (edgeWhites(cols).length && edgeWhites(after).length < edgeWhites(cols).length) keep('trick:edge', c);
        if (a.tie) keep('trick:flick', c);
        if (blockPhase(cols) && keptTools(cols).brown && keptTools(after).brown) keep('trick:kept', c);
      }
    }
    if (a.kind === 'burn' && a.stage === 'junk' && burnsClean(cols[COLS - 1]) && clearComingUp(cols) && g.timeLeft() > 6000) {
      keep('trick:burnEarly', { ...at, technique: null, by: null, drags: [], chosen: true });
    }
    // A technique the bot hasn't played yet: the first board its routine offers a move on.
    for (const name of ROUTINE_NAMES) {
      if (found.has(`technique:${name}`) || found.has(`offered:${name}`)) continue;
      const m = ROUTINES[name].find(cols, ctx)[0];
      if (m && playDrags(cols, m.drags)) keep(`offered:${name}`, { ...at, technique: name, by: name, drags: m.drags, chosen: false });
    }
    // Then the move played, as tools/distill-bots.mjs plays it.
    if (a.kind === 'dismiss') break;
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
  const missing = TECHNIQUES.filter((t) => !found.has(`technique:${t}`));
  console.log(`seed ${seed}: ${((Date.now() - t0) / 1000).toFixed(1)} s, chains ${bot.allChains().join(' ') || 'none'}; not played yet: ${missing.join(', ') || 'none'}`);
  // Enough: every technique played, or (after a few deals) the rest at least offered.
  if ((!missing.length && s >= 1) || (s >= 3 && missing.every((t) => found.has(`offered:${t}`)))) break;
}

/** The clearest candidate: a move of a few swaps, in as few drags as it can be, early in its session (so it reads
    off a board that's still busy); a sweep a long one. */
function clearest(key, list) {
  const size = (c) => {
    const sw = swapsIn(c.drags), want = key === 'technique:sweep' ? 8 : key.startsWith('phase:') ? 6 : 5;
    return Math.abs(sw - want) + 3 * Math.max(0, c.drags.length - 1) + (c.chosen ? 0 : 0.5) + c.ms / 600000 + (PREFER[key] && !PREFER[key](c) ? 20 : 0);
  };
  return [...list].sort((a, b) => size(a) - size(b))[0];
}
const out = {};
for (const t of TECHNIQUES) {
  const l = found.get(`technique:${t}`) ?? found.get(`offered:${t}`);
  if (l) out[`technique:${t}`] = clearest(`technique:${t}`, l);
}
for (const [key, l] of found) if (!key.startsWith('technique:') && !key.startsWith('offered:')) out[key] = clearest(key, l);
const missing = [...TECHNIQUES.map((t) => `technique:${t}`), 'phase:block', 'phase:chain', 'trick:danger', 'trick:edge', 'trick:flick', 'trick:blocks', 'trick:kept', 'trick:burnEarly'].filter((k) => !out[k]);
if (missing.length) console.log(`no board found for: ${missing.join(', ')} (try more sessions)`);

const body = Object.entries(out).sort(([a], [b]) => a.localeCompare(b)).map(([key, c]) => `  '${key}': ${JSON.stringify({
  seed: c.seed, bot: c.bot, ms: c.ms, stage: c.stage, phase: c.phase, chain: c.chain, chosen: c.chosen, technique: c.technique, by: c.by, ctx: c.ctx, cols: c.cols, drags: c.drags,
})},`).join('\n');
writeFileSync(join(ROOT, 'src/distill-guide-boards.ts'), `/* Distilling's read version: the boards its later pictures are drawn on, picked from real play by
   tools/distill-guide.mjs (a ${BOT.toUpperCase().replace('CC', 'CC^')} bot on seeded deals). Written by that tool: run it again rather than
   editing these (tests/distill-guide.test.ts says when). Each is where the bot played that technique (\`chosen\`),
   or, for one it never played, where the routine's own \`find\` offered a move; or where a phase or one of the
   user's tricks showed. Plain data: src/distill-guide.ts draws the moves on them live. */
import type { Ctx, Drag, RoutineName } from './distill-routines.js';
import type { Phase } from './distill-phase.js';

export interface Position {
  /** The deal (its seed), the bot, and how far into the session, in ms of its play. */
  seed: number; bot: string; ms: number;
  stage: 'junk' | 'chain'; phase: Phase; chain: number;
  /** Where the bot played it (true), or only where its routine offered it (false). */
  chosen: boolean;
  technique: RoutineName | 'path' | 'sweep' | null;
  /** What offered the move: its routine, or 'path' (a sweep is a long plain drag some routine offered). */
  by: RoutineName | 'path' | null;
  ctx: Ctx;
  /** The board, a column a string top to bottom (parseBoard), and the move played or offered there. */
  cols: string[];
  drags: Drag[];
}

export const POSITIONS: Readonly<Record<string, Position>> = {
${body}
};
`);
console.log(`wrote src/distill-guide-boards.ts: ${Object.keys(out).length} boards`);
