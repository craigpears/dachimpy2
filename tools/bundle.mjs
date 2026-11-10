/* The den in one file: js/den.js and every module it imports, bundled and minified by esbuild into
   js/den.<hash>.js (with its source map), and den.html pointed at it. Run by `npm run build`, after
   tsc; tests/bundle.test.ts fails if it's out of date.

   Why (the user, 10 Nov: "shouldn't there be some build process that bundles and minifies things?"):
   - one file, so a blocker can't stop one module by its name and break the whole den (it stopped
     "umami.js": RULES.md, "No file a blocker would stop");
   - named after its contents, so after a deploy a page never mixes old modules with new ones;
   - one small download instead of thirty.
   three.js stays where it was, from the CDN by den.html's import map.
   Locally (localhost) den.html still loads js/den.js's modules as they are, so a change shows on a
   reload without a build; add ?bundle to try the bundle. */
import { build } from 'esbuild';
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const OPTIONS = {
  entryPoints: [join(ROOT, 'js/den.js')],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  external: ['three', 'three/addons/*'],
  sourcemap: 'linked',
  sourcesContent: false,
  entryNames: '[name].[hash]',
  outdir: join(ROOT, 'js'),
  legalComments: 'none',
  logLevel: 'silent',
};
/** A bundle's file name: den.<hash>.js (and its .map). */
export const BUNDLE = /^den\.[A-Z0-9]{8}\.js(\.map)?$/;
/** Where den.html names the bundle to load. */
export const LOAD = /'\.\/js\/den\.[A-Z0-9]{8}\.js'/;

/** The bundle as it'd be built now: its file name and its files' contents. */
export async function bundled() {
  const r = await build({ ...OPTIONS, write: false });
  const files = r.outputFiles.map((f) => ({ name: f.path.slice(f.path.lastIndexOf(f.path.includes('\\') ? '\\' : '/') + 1), text: f.text }));
  const js = files.find((f) => f.name.endsWith('.js'));
  return { name: js.name, files };
}

async function main() {
  const { name, files } = await bundled();
  for (const f of readdirSync(join(ROOT, 'js'))) if (BUNDLE.test(f) && !files.some((g) => g.name === f)) unlinkSync(join(ROOT, 'js', f));
  for (const f of files) writeFileSync(join(ROOT, 'js', f.name), f.text);
  const html = join(ROOT, 'den.html'), s = readFileSync(html, 'utf8');
  if (!LOAD.test(s)) throw new Error("den.html doesn't load the bundle (look for its loader script)");
  writeFileSync(html, s.replace(LOAD, `'./js/${name}'`));
  console.log(`bundled js/${name}`);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
