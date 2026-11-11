/* LINES.md: every character's lines, made from src/lines/, for reading without the code: who each
   is, then what they say, grouped by when. Run by `npm run build`; tests/lines.test.ts fails if
   it's out of date. Committed, so git's history shows every line
   as it changes (the user, 11 Nov: "I just want there to be a record of them in case any get lost
   that I really love, so I can see how they've evolved over time"). */
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DOC = join(ROOT, 'LINES.md');

// As written, not as Markdown: a *hic* stays *hic*.
const esc = (s) => s.replace(/[\\*_`<]/g, '\\$&');
const line = (s) => `"${esc(s)}"`;

/* Lines as a list: a line on its own; lines in order, one after another; lines by name, each under
   its name (or what `each` says of it), a deeper list under it where there's more than one line. */
function said(says, each, pad, out) {
  if (typeof says === 'string') { out.push(`${pad}- ${line(says)}`); return; }
  if (Array.isArray(says)) { for (const s of says) said(s, undefined, pad, out); return; }
  for (const [k, v] of Object.entries(says)) {
    const label = `*${esc(each?.[k] ?? k)}:*`;
    if (typeof v === 'string') out.push(`${pad}- ${label} ${line(v)}`);
    else { out.push(`${pad}- ${label}`); said(v, undefined, `${pad}  `, out); }
  }
}

/** LINES.md for these characters (src/lines/index.ts: CHARACTERS). */
export function linesDoc(characters) {
  const out = [
    '# Who says what in the Pirate Den',
    '',
    'Every character\'s lines, and who they are, made from `src/lines/` by `npm run build`',
    '(`tools/lines-doc.mjs`): change a line there, not here, and the game changes with it.',
    'This file\'s history in git shows every line as it\'s changed.',
    '',
    characters.map((c) => `[${c.name}](#${c.name.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-')})`).join(' · '),
  ];
  for (const c of characters) {
    out.push('', `## ${c.name}`, '');
    out.push(c.who.split('\n\n').map(esc).join('\n\n'));
    if (c.theUser?.length) {
      out.push('');
      for (const q of c.theUser) out.push(`> "${esc(q.said)}" (the user, ${q.on})`, '>');
      out.pop();
    }
    for (const g of c.lines) {
      out.push('', `### ${esc(g.when)}`, '');
      said(g.says, g.each, '', out);
    }
  }
  return `${out.join('\n')}\n`;
}

async function main() {
  // (src/lines/ as it is, in one go: esbuild, as tools/bundle.mjs uses.)
  const r = await build({ entryPoints: [join(ROOT, 'src/lines/index.ts')], bundle: true, format: 'esm', write: false, logLevel: 'silent' });
  const { CHARACTERS } = await import(`data:text/javascript,${encodeURIComponent(r.outputFiles[0].text)}`);
  writeFileSync(DOC, linesDoc(CHARACTERS));
  console.log('wrote LINES.md');
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
