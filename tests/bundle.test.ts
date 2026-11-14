/* The den is served as one bundled file (tools/bundle.mjs, run by `npm run build`): this fails if
   the bundle's out of date with js/, or den.html doesn't load the one that's there. */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const lf = (s: string) => s.replace(/\r\n/g, '\n');   // (git may check it out with CRLF)
// @ts-expect-error: a plain .mjs tool, untyped
import { bundled, ROOT, BUNDLE } from '../tools/bundle.mjs';

describe('the den in one file (10 Nov: "shouldn\'t there be some build process that bundles and minifies things?")', () => {
  it('is up to date with js/, and den.html loads it: run `npm run build`', async () => {
    const { name, files } = await bundled() as { name: string; files: { name: string; text: string }[] };
    for (const f of files) expect(lf(readFileSync(join(ROOT, 'js', f.name), 'utf8'))).toBe(lf(f.text));
    expect(readFileSync(join(ROOT, 'den.html'), 'utf8')).toContain(`'./js/${name}'`);
    // No old bundles left lying about.
    expect(readdirSync(join(ROOT, 'js')).filter((f) => BUNDLE.test(f)).sort()).toEqual(files.map((f) => f.name).sort());
  }, 30000);

  it('is small: minified, three.js left to the CDN', async () => {
    const { files } = await bundled() as { name: string; files: { name: string; text: string }[] };
    const js = files.find((f) => f.name.endsWith('.js'))!;
    expect(js.text).not.toMatch(/WebGLRenderer\s*=\s*class|REVISION\s*=\s*"160"/);
    // (its few line breaks are the blank lines inside characters' `who` in src/lines/: Gravee's joined the
    // main bundle on 12 Nov, racing in the race watched; and, 14 Nov, the stylesheet of Helium's opening choice,
    // js/tutorial-choice.js, kept readable as it's written; and the race plan chart's, js/den/plan-chart.js)
    expect(js.text.split('\n').length).toBeLessThan(70);
  }, 30000);
});
