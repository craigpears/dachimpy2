/* Every character's lines are in src/lines/, one file each, and LINES.md (made from them by
   tools/lines-doc.mjs, run by `npm run build`) is up to date: git's history of it is the record of
   every line (the user, 11 Nov: "I just want there to be a record of them in case any get lost that
   I really love, so I can see how they've evolved over time"). */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CHARACTERS } from '../src/lines/index';
import type { Character, Said } from '../src/lines/character';
// @ts-expect-error: a plain .mjs tool, untyped
import { linesDoc, DOC } from '../tools/lines-doc.mjs';

const lf = (s: string) => s.replace(/\r\n/g, '\n');   // (git may check it out with CRLF)
const DIR = join(__dirname, '../src/lines');
const lines = (s: Said): string[] => (typeof s === 'string' ? [s] : Array.isArray(s) ? s.flatMap(lines) : Object.values(s).flatMap(lines));

describe('who says what (11 Nov: "a record of them in case any get lost that I really love")', () => {
  it('LINES.md is up to date with src/lines/: run `npm run build`', () => {
    expect(lf(readFileSync(DOC as string, 'utf8'))).toBe((linesDoc as (c: readonly Character[]) => string)(CHARACTERS));
  });

  it('every character file in src/lines/ is in the list LINES.md is made from', async () => {
    const files = readdirSync(DIR).filter((f) => f.endsWith('.ts') && !['index.ts', 'character.ts'].includes(f));
    for (const f of files) {
      const m = await import(pathToFileURL(join(DIR, f)).href) as { CHARACTER?: Character };
      expect(m.CHARACTER, `${f} exports its CHARACTER`).toBeDefined();
      expect(CHARACTERS, `${f}'s character is in src/lines/index.ts`).toContain(m.CHARACTER);
    }
    expect(CHARACTERS.length).toBe(files.length);
  });

  it.each(CHARACTERS.map((c) => [c.name, c]))('%s: who they are, and every line as the game shows it', (_name, c) => {
    expect(c.who.length).toBeGreaterThan(40);
    expect(c.lines.length).toBeGreaterThan(0);
    for (const g of c.lines) {
      const all = lines(g.says);
      expect(all.length).toBeGreaterThan(0);
      for (const s of all) expect(s).toBe(s.trim()), expect(s).not.toBe('');
      // Every line named in a group is described, or none are.
      if (g.each && typeof g.says === 'object' && !Array.isArray(g.says)) expect(Object.keys(g.each).sort()).toEqual(Object.keys(g.says).sort());
    }
  });
});
