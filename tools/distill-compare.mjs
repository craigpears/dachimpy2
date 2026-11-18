/* Your game of Distilling beside the bot's (the user, 18 Nov: "record and log my moves while I'm playing it live, so
   you can compare ... you can get more of an insight into what I'm doing differently"). distilling-test.html's Save my
   moves downloads a recording (src/distill-record.ts); this reads it and prints, for each of your moves, the board's
   time, your move, and the move the bot would have made on that same board, and how the bot played the same seed.

   Run on the compiled js (npm run build first) with Node 22:
     node_modules/node/bin/node.exe tools/distill-compare.mjs [recording.json] [target]
   - recording: a file, or left out for the newest distilling-seed*.json in your Downloads folder;
   - target: the bot's target chain (default 8, CC^8).
   ALL=1 prints every move (default: only the moves where the bot would have moved a different piece, and a count of
   the rest). BOT=0 skips playing the bot on the same seed. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { compare } from '../js/distill-record.js';
import { Distilling } from '../js/distilling.js';
import { levelNamed, playSession } from '../js/distill-bots.js';
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

if (process.env.BOT !== '0') {
  const g = new Distilling(seeded(rec.seed)), level = levelNamed(`cc${target}`);
  // (a finished game against the bot's whole session; one cut short against as long)
  const r = playSession(g, level, rec.end ? 30 : Math.max(1, Math.ceil(mins)));
  console.log(`the bot (CC^${target}), same seed: ${g.columns.length} columns gone (${r.columnsUp} up), longest chain ${r.longest}, ${r.points} points, whites burned ${r.whitesBurned}, ${r.swaps} swaps, ${r.minutes.toFixed(1)} minutes; moves a column gone ${(r.drags / Math.max(1, g.columns.length)).toFixed(1)}`);
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
