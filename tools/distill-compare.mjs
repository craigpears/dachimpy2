/* Your game of Distilling beside the bot's (the user, 18 Nov: "record and log my moves while I'm playing it live, so
   you can compare ... you can get more of an insight into what I'm doing differently"). distilling-test.html's Save my
   moves downloads a recording (src/distill-record.ts); this reads it and prints, for each of your moves, the board's
   time, your move, and the move the bot would have made on that same board, and how the bot played the same seed.

   Run on the compiled js (npm run build first) with Node 22:
     node_modules/node/bin/node.exe tools/distill-compare.mjs [recording.json] [target]
   - recording: a file, or left out for the newest distilling-seed*.json in your Downloads folder;
   - target: the bot's target chain (default 8, CC^8).
   ALL=1 prints every move (default: only the moves where the bot would have moved a different piece, and a count of
   the rest). BOT=0 skips playing the bot on the same seed. First, a timeline, a line a furnace's column (your columns'
   times): your moves and the bot's in it, their swaps, and what each move did (junk carried over the white columns,
   junk moved on right of them, whites moved left or right...), so the phases show. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { boardOf, compare } from '../js/distill-record.js';
import { Distilling } from '../js/distilling.js';
import { levelNamed, playSession } from '../js/distill-bots.js';
import { bankEnd, bankOf } from '../js/distill-patterns.js';
import { seeded } from '../js/mirror-row.js';

let file = process.argv[2];
const target = Number(process.argv[3] || 8);
if (!file || /^\d+$/.test(file)) {
  const dir = join(homedir(), 'Downloads');
  const found = readdirSync(dir).filter((f) => /^distilling-seed.*\.json$/.test(f)).map((f) => join(dir, f)).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  if (!found.length) { console.error(`no distilling-seed*.json in ${dir}: save one from distilling-test.html first`); process.exit(1); }
  file = found[0];
}
const rec = JSON.parse(readFileSync(file, 'utf8'));
const secs = (ms) => (ms / 1000).toFixed(1);
console.log(`${file}\nseed ${rec.seed}, played ${rec.started}${rec.speed !== 1 ? ` at ${rec.speed}x` : ''}: ${rec.moves.length} moves`);
const columns = rec.columns.length, up = rec.columns.filter((c) => c.up).length;
const longest = rec.end?.longest ?? Math.max(0, ...rec.columns.map((c) => c.chain));
const mins = (rec.end?.t ?? rec.columns.at(-1)?.t ?? rec.moves.at(-1)?.t ?? 0) / 60000;
console.log(`you: ${columns} columns gone (${up} up, ${columns - up} burned), longest chain ${longest}, burns by hand ${rec.burns.length}${rec.end ? `, ${rec.end.points} points, whites burned ${rec.end.whitesBurned}, ${rec.end.swaps} swaps` : ' (unfinished)'}, ${mins.toFixed(1)} minutes; moves a column gone ${(rec.moves.length / Math.max(1, columns)).toFixed(1)}, swaps a move ${(rec.moves.reduce((n, m) => n + m.ways.length, 0) / Math.max(1, rec.moves.length)).toFixed(1)}`);

/** What a move did, in a few words: the piece, and where it went against the white columns (`bankOf`). */
function kindOf(cols, x, y, ways) {
  const g = new Distilling(() => 0.5, { timer: false }).lay(cols.map((c) => [...c]));
  const p = cols[x][y], r = g.dragWays(x, y, ways), end = bankEnd(bankOf(cols)), dx = r.at[0] - x;
  if (p === 0) return dx < 0 ? 'white left' : dx > 0 ? 'white right' : 'white up or down';
  if (p !== 1 && p !== 2) return 'spice';
  if (end && x < end && r.at[0] >= end) return 'junk over the whites';
  if (end && x >= end) return dx > 0 ? 'junk on, right of the whites' : dx < 0 ? 'junk back, right of the whites' : 'junk sorted, right of the whites';
  return dx > 0 ? 'junk right' : dx < 0 ? 'junk left' : 'junk sorted';
}
const yours = rec.moves.map((m) => ({ t: m.t, swaps: m.ways.length, kind: kindOf(boardOf(m.cols), m.x, m.y, m.ways) }));
const bots = [], botColumns = [];
if (process.env.BOT !== '0') {
  const g = new Distilling(seeded(rec.seed)), level = levelNamed(`cc${target}`);
  // (a finished game against the bot's whole session; one cut short against as long)
  const r = playSession(g, level, rec.end ? 30 : Math.max(1, Math.ceil(mins)), (c) => botColumns.push({ t: g.time, up: c.up, chain: c.chain }), (a) => {
    if (a.kind !== 'move') return;
    let cols = g.cols.map((c) => [...c]);
    for (const d of a.drags) {
      bots.push({ t: g.time, swaps: d.ways.length, kind: kindOf(cols, d.x, d.y, d.ways) });
      const h = new Distilling(() => 0.5, { timer: false }).lay(cols); h.dragWays(d.x, d.y, d.ways); cols = h.cols.map((c) => [...c]);
    }
  });
  console.log(`the bot (CC^${target}), same seed: ${g.columns.length} columns gone (${r.columnsUp} up), longest chain ${r.longest}, ${r.points} points, whites burned ${r.whitesBurned}, ${r.swaps} swaps, ${r.minutes.toFixed(1)} minutes; moves a column gone ${(r.drags / Math.max(1, g.columns.length)).toFixed(1)}`);
}

// The timeline: a line a furnace's column, yours, the bot's moves in the same stretch of time beside.
console.log("\ntimeline, a furnace column at a time (yours gone at the end of each; the bot's own in brackets):");
const said = (list) => {
  if (!list.length) return 'no moves';
  const k = {}; for (const m of list) k[m.kind] = (k[m.kind] || 0) + 1;
  return `${list.length} moves, ${(list.reduce((n, m) => n + m.swaps, 0) / list.length).toFixed(1)} swaps a move: ` + Object.entries(k).sort((a, b) => b[1] - a[1]).map(([a, b]) => `${a} ${b}`).join(', ');
};
let from = 0;
const ends = [...rec.columns.map((c) => c.t), ...(rec.moves.length && rec.moves.at(-1).t > (rec.columns.at(-1)?.t ?? 0) ? [rec.moves.at(-1).t + 1] : [])];
for (const [i, to] of ends.entries()) {
  const c = rec.columns[i], b = botColumns.filter((x) => x.t > from && x.t <= to);
  console.log(`${secs(from)}-${secs(to)} s${c ? `, yours ${c.up ? `up${c.chain ? `, CC^${c.chain}` : ''}` : 'burned'}` : ''}${b.length ? ` (the bot's ${b.map((x) => (x.up ? `up${x.chain ? `, CC^${x.chain}` : ''}` : 'burned')).join(', ')})` : ''}`);
  console.log(`   you: ${said(yours.filter((m) => m.t >= from && m.t < to))}`);
  if (bots.length) console.log(`   bot: ${said(bots.filter((m) => m.t >= from && m.t < to))}`);
  from = to;
}

const all = compare(rec, target), alike = { move: 0, piece: 0, no: 0 };
for (const c of all) alike[c.same]++;
console.log(`\nthe bot on each of your boards: the same move ${alike.move}, the same piece another way ${alike.piece}, something else ${alike.no}\n`);
const L = (c) => c.cols.join(' ');
for (const c of all) {
  if (!process.env.ALL && c.same !== 'no') continue;
  console.log(`${c.i + 1}. ${secs(c.t)} s${c.timeLeft != null ? `, burn in ${secs(c.timeLeft)} s` : ''}${c.chain ? `, chain ${c.chain}` : ''}  [${L(c)}]`);
  console.log(`   you: ${c.yours}`);
  console.log(`   bot: ${c.bot}${c.botLabel ? ` (${c.botLabel}${c.tactic ? `, ${c.tactic}` : ''}): ${c.botWhy}` : ''}`);
}
