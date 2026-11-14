/* The furniture's source as the tests read it (it needs three.js and a canvas to run, so they read it):
   js/den/furniture.js passes on js/den/furniture/, a file a piece (or a small family), listed in its
   registry, index.js (14 Nov). */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const FURNITURE_DIR = join(__dirname, '..', 'js', 'den', 'furniture');

/** Every file in the furniture's folder, by its name, and its source (either line ending, as checked out). */
export const furnitureFiles = (): Record<string, string> => Object.fromEntries(readdirSync(FURNITURE_DIR)
  .filter((f) => f.endsWith('.js'))
  .map((f) => [f, readFileSync(join(FURNITURE_DIR, f), 'utf8').replace(/\r\n/g, '\n')]));

/** All the furniture's source in one string: furniture.js and every file in its folder. */
export const furnitureSource = (): string =>
  [readFileSync(join(FURNITURE_DIR, '..', 'furniture.js'), 'utf8'), ...Object.values(furnitureFiles())].join('\n');

/** The id of every piece in the registry: each file's PIECES. */
export const furnitureIds = (): string[] =>
  Object.entries(furnitureFiles()).flatMap(([, src]) => {
    const m = /export const PIECES = \[([\s\S]*?)\n\];/.exec(src);
    return m ? [...m[1].matchAll(/\{ id: '([a-zA-Z]+)'/g)].map((x) => x[1]) : [];
  });
