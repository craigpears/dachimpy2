// The phone check (tools/mobile.mjs, 16 Nov): what it flags from what it measured, how it names a page's
// screenshot, and that it opens the same pages as the smoke tests.
import { describe, it, expect } from 'vitest';
// @ts-expect-error: a plain .mjs tool, untyped
import { flags, score, slug, THRESHOLDS } from '../tools/mobile.mjs';
// @ts-expect-error: a plain .mjs tool, untyped
import { sitePages } from '../tools/site.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fine = { cover: 0.1, middle: 0.05, chrome: 0.1, taps: 0, texts: 0, edges: 0, sideways: 0 };

describe('the phone check', () => {
  it('flags nothing on a page within every threshold', () => {
    expect(flags(fine)).toEqual([]);
  });

  it('flags the action covered, as on the blockade with its list of ships open (16 Nov)', () => {
    const blockade = { ...fine, cover: 0.39, middle: 0.45, chrome: 0.39, taps: 9 };
    expect(flags(blockade)).toEqual([
      'action 39% covered', 'its middle 45% covered', 'fixed bars and panels take 39% of the screen', `9 tap targets under ${THRESHOLDS.tap}px`,
    ]);
    expect(score(blockade)).toBeGreaterThan(score(fine));
  });

  it("doesn't judge cover on a page with no action to cover", () => {
    expect(flags({ ...fine, cover: null, middle: null })).toEqual([]);
  });

  it('says a page that did not load, and ranks it worst', () => {
    expect(flags({ error: 'Timeout' })).toEqual(["didn't load: Timeout"]);
    expect(score({ error: 'Timeout' })).toBeGreaterThan(score({ ...fine, cover: 1, middle: 1, chrome: 1, taps: 99 }));
  });

  it("names each page's screenshot plainly", () => {
    expect(slug('den.html?at=wolfden&as=dachimpy')).toBe('den-at-wolfden');
    expect(slug('den.html?as=dachimpy')).toBe('den');
    expect(slug('blockade-test.html?watch=brawl', 'landscape')).toBe('blockade-test-watch-brawl.landscape');
  });

  it('opens every place on the front page, dressed as Dachimpy, and every other page', () => {
    const { den, other } = sitePages(ROOT);
    expect(den).toContain('den.html?as=dachimpy');
    expect(den).toContain('den.html?at=wolfden&as=dachimpy');
    expect(other).toContain('index.html');
    expect(other).not.toContain('den.html');
  });
});
