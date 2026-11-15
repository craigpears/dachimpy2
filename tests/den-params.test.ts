// A function's parameter named like something its file imports, and that import used in the same parameter list
// (a default): the default then reads the parameter before it's set, and the function throws every time it's called.
// Helium's lesson did (the user, 15 Nov: "live is not working for me trying to go to the helium thing"): lessonPlay's
// `beats = [...opening(), CHOOSE], { wide: opening = true }` threw "Cannot access 'opening' before initialization" as
// you came up off their island, from 14 Nov to 15 Nov.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIRS = ['js/den', 'js'];

/** Each function's parameter list in a file, and the names it binds. */
function paramLists(source: string) {
  return [...source.matchAll(/function\s*[\w$]*\s*\(((?:[^()]|\((?:[^()]|\([^()]*\))*\))*)\)\s*\{/g)].map((m) => ({
    params: m[1],
    names: [...m[1].matchAll(/(?:^|[,{(]\s*|:\s*)([A-Za-z_$][\w$]*)\s*(?==|,|}|$)/g)].map((x) => x[1]),
  }));
}
/** The name called, indexed or read into in the parameter list (`opening()`, `...opening()`), not as someone's property. */
const usedIn = (params: string, n: string) =>
  new RegExp(`(^|[^\\w$.]|\\.\\.\\.)${n.replace(/\$/g, '\\$')}\\s*[(.[]`).test(params);
const imports = (source: string) => new Set([...source.matchAll(/import\s*\{([^}]*)\}\s*from/g)]
  .flatMap((m) => m[1].split(',').map((n) => n.trim().split(/\s+as\s+/).pop()!).filter(Boolean)));

describe('no parameter hides an import its own defaults use (Helium\'s lesson, 15 Nov)', () => {
  for (const dir of DIRS) {
    const root = join(__dirname, '..', dir);
    for (const f of readdirSync(root).filter((x) => x.endsWith('.js') && !/^den\.[A-Z0-9]{8}\.js$/.test(x))) {
      it(`${dir}/${f}`, () => {
        const s = readFileSync(join(root, f), 'utf8'), imported = imports(s);
        for (const { params, names } of paramLists(s)) {
          for (const n of names) {
            if (!imported.has(n)) continue;
            const used = usedIn(params, n);
            expect(used, `${f}: the parameter "${n}" hides the import of that name, which its own defaults use: ${params.slice(0, 120)}`).toBe(false);
          }
        }
      });
    }
  }
  it('catches the one that broke Helium\'s lesson', () => {
    const s = "import { opening } from './x.js';\nfunction lessonPlay(beats = [...opening(), CHOOSE], { wide: opening = true } = {}) {}";
    const [{ params, names }] = paramLists(s);
    expect(names).toContain('opening');
    expect(imports(s).has('opening')).toBe(true);
    expect(usedIn(params, 'opening')).toBe(true);
    expect(usedIn('a, b = x.opening()', 'opening')).toBe(false); // someone else's opening, not the import
  });
});
