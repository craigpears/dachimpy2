/* The site serves the compiled js/, not src/: this fails if a src/*.ts file was changed without
   `npm run build`, so what's tested is what's served. */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

const root = join(__dirname, '..');

describe('the compiled js/', () => {
  const config = ts.getParsedCommandLineOfConfigFile(join(root, 'tsconfig.json'), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} });
  if (!config) throw new Error('tsconfig.json did not parse');
  const out = new Map<string, string>();
  const program = ts.createProgram(config.fileNames, config.options);
  const result = program.emit(undefined, (file, text) => out.set(resolve(file), text));

  it('compiles without type errors', () => {
    const errors = ts.getPreEmitDiagnostics(program).concat(result.diagnostics);
    expect(errors.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))).toEqual([]);
  });

  // The browser loads these as they are: an import without its .js is a file it can't find, and the
  // whole den fails to start (8 Nov: './swordfight').
  it.each([...out.entries()].map(([f, text]) => [relative(root, f), text]))('%s imports whole file names', (_file, text) => {
    const bad = [...text.matchAll(/^\s*(?:import|export)[^;]*?from\s+['"](\.[^'"]*)['"]/gm)].map((m) => m[1]).filter((p) => !p.endsWith('.js'));
    expect(bad).toEqual([]);
  });

  it.each([...out.keys()].map((f) => relative(root, f)))('%s is up to date (run npm run build)', (file) => {
    const lf = (s: string) => s.replace(/\r\n/g, '\n');
    expect(lf(readFileSync(join(root, file), 'utf8'))).toBe(lf(out.get(resolve(root, file)) ?? ''));
  });
});
