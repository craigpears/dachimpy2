/* The furniture laid out so anyone can add a piece (14 Nov: "it's not very obvious at all where the source stuff is
   for all of the graphics ... furniture, like [what] Fable wants to do"): a file a piece (or a small family) in
   js/den/furniture/, each listing its pieces (PIECES), all of them in the registry (index.js), which
   js/den/furniture.js passes on so every import works as before; and the catalogue page drawn from it. The pieces
   need three.js and a canvas to build, so these read the source; catalogue-furniture.html builds every one. */
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { FURNITURE_DIR, furnitureFiles, furnitureIds } from './furniture-files';

const ROOT = join(__dirname, '..');
const FILES = furnitureFiles(), INDEX = FILES['index.js'];
const PIECE_FILES = Object.keys(FILES).filter((f) => f !== 'index.js' && f !== 'parts.js');
/** Every piece's entry in a file's PIECES, as written. */
const entriesOf = (src: string) => {
  const m = /export const PIECES = \[([\s\S]*?)\n\];/.exec(src);
  return m ? m[1].split(/\n  \{ id: /).slice(1).map((e) => `{ id: ${e}`) : [];
};
// Every kind furniture.js's FURNITURE had before it was split (14 Nov), and the plate of cookies it exported.
const BEFORE = ['rug', 'runner', 'chair', 'armchair', 'table', 'bed', 'candelabra', 'sconce', 'coffin', 'easel', 'frame', 'sign',
  'door', 'still', 'skeleton', 'skeletonChair', 'skeletalCannon', 'gibbet', 'armour', 'grandPiano', 'anchorChair', 'jar', 'toolChest',
  'crate', 'barrel', 'tarpPile', 'lantern', 'rowboat', 'card', 'shelf', 'simModel', 'cookiePlate'];
/** Builders a piece file exports that aren't pieces of their own: a skull for the skeleton set, words wrapped. */
const HELPERS = ['skull', 'wrapLines'];

describe("the furniture, a piece a file, so anyone can add one (14 Nov: 'it's not very obvious at all where the source stuff is')", () => {
  it('keeps furniture.js a thin pass-on of the folder, so every import works as before', () => {
    const thin = readFileSync(join(FURNITURE_DIR, '..', 'furniture.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    expect(thin).toBe("export * from './furniture/index.js';");
  });

  it('lists every piece there was, once, in the registry', () => {
    const ids = furnitureIds();
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...BEFORE].sort());
  });

  it('has every piece file in the registry: imported, passed on and in FILES', () => {
    for (const f of PIECE_FILES) {
      const m = new RegExp(`import \\* as (\\w+) from '\\./${f.replace('.', '\\.')}'; export \\* from '\\./${f.replace('.', '\\.')}';`).exec(INDEX);
      expect(m, f).not.toBeNull();
      expect(/const FILES = \[([\s\S]*?)\];/.exec(INDEX)![1], f).toMatch(new RegExp(`\\b${m![1]}\\b`));
    }
    expect(INDEX).toMatch(/export const PIECES = FILES\.flatMap/);
    expect(INDEX).toMatch(/export const FURNITURE = Object\.fromEntries\(PIECES\.map/);
  });

  it('has every builder a piece file exports in its PIECES, each entry named, grouped, described and placed', () => {
    const groups = [...INDEX.matchAll(/\{ id: '([a-z]+)', name: '/g)].map((x) => x[1]);
    expect(groups.length).toBeGreaterThan(3);
    for (const f of PIECE_FILES) {
      const src = FILES[f], entries = entriesOf(src);
      expect(entries.length, f).toBeGreaterThan(0);
      for (const e of entries) {
        expect(e, f).toMatch(/name: '[^']+'/);
        expect(e, f).toMatch(/about: '/);
        expect(e, f).toMatch(/where: '/);
        expect(groups, `${f}: ${e.slice(0, 40)}`).toContain(/group: '([a-z]+)'/.exec(e)?.[1]);
      }
      const built = [...src.matchAll(/^export (?:function (\w+)|const (\w+) =)/gm)].map((x) => x[1] || x[2]).filter((n) => n !== 'PIECES');
      for (const b of built) if (!HELPERS.includes(b)) expect(entries.some((e) => new RegExp(`make: (?:${b}\\b|\\(o\\) => \\(\\{ g: ${b}\\(o\\) \\}\\))`).test(e)), `${f}: ${b}`).toBe(true);
    }
  });

  it('stands up anywhere: no piece needs the den running round it', () => {
    for (const [f, src] of Object.entries(FILES)) {
      expect(src, f).not.toMatch(/from '\.\.\/world\.js'/);
      expect(src, f).not.toMatch(/from '\.\.\/\.\.\/den\.js'/);
    }
  });

  it('has a guide in its folder on adding a piece', () => {
    const readme = readFileSync(join(FURNITURE_DIR, 'README.md'), 'utf8');
    expect(readme).toMatch(/index\.js/);
    expect(readme).toMatch(/PIECES/);
    expect(readme).toMatch(/catalogue-furniture\.html/);
  });
});

describe("the catalogue's furniture page (14 Nov: 'a list of all the furniture and kind of what they look like')", () => {
  it('draws every piece from the registry, none listed by hand', () => {
    expect(existsSync(join(ROOT, 'catalogue-furniture.html'))).toBe(true);
    const page = readFileSync(join(ROOT, 'catalogue-furniture.html'), 'utf8');
    expect(page).toMatch(/from '\.\/js\/den\/furniture\.js'/);
    expect(page).toMatch(/\bPIECES\b/);
    expect(page).toMatch(/\bGROUPS\b/);
    const script = /<script type="module">([\s\S]*?)<\/script>/.exec(page)![1];
    for (const id of BEFORE) expect(script, id).not.toMatch(new RegExp(`['"]${id}['"]`));
  });
});
