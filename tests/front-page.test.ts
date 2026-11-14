import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (f: string) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const page = read('index.html');
// The colours and their themes, every page's (14 Nov: "the color theme and things need to carry on through the site").
const site = read('css/site.css');

describe('the front page', () => {
  it('lists the sticky menu in the order its sections appear on the page ("really off-putting", 14 Nov)', () => {
    const nav = page.match(/<nav class="jump"[\s\S]*?<\/nav>/)![0];
    const ids = [...nav.matchAll(/href="#([\w-]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThanOrEqual(1);
    const at = ids.map((id) => {
      const i = page.indexOf(`id="${id}"`);
      expect(i, `#${id} is on the page`).toBeGreaterThan(-1);
      return i;
    });
    expect(at).toEqual([...at].sort((a, b) => a - b));
  });
});

/** A colour's relative luminance, and the contrast of two (WCAG 2). */
const lum = (hex: string) => {
  const c = [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
/** A theme's colours (css/site.css): :root's, with a `[data-theme=...]` block's over them. */
const theme = (name?: string) => {
  const block = (sel: RegExp) => Object.fromEntries([...(site.match(sel)?.[1] ?? '').matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1], m[2]]));
  const root = block(/:root \{([\s\S]*?)\n\}/);
  if (!name) return root;
  const over = block(new RegExp(String.raw`\[data-theme="${name}"\] \{([\s\S]*?)\n\}`));
  expect(Object.keys(over).length, `the ${name} theme's block`).toBeGreaterThan(3);
  return { ...root, ...over };
};

describe('the front page\'s colours: usable first (the user, 14 Nov: "not at the expense of like usability")', () => {
  // Words against what they sit on, at least 4.5:1 (WCAG AA), in every theme.
  const WORDS: [string, string][] = [['text', 'bg'], ['dim', 'bg'], ['faint', 'bg'], ['title', 'bg'], ['accent-text', 'bg'],
    ['accent2-text', 'bg'], ['on-accent', 'accent'], ['ink', 'paper'], ['ink2', 'paper'], ['ink-head', 'paper'],
    ['link', 'paper'], ['link-hi', 'paper'], ['link', 'paper2'], ['good', 'paper'], ['coming-text', 'coming-a'], ['coming-text', 'coming-b']];
  const THEMES = [...site.matchAll(/:root\[data-theme="(\w+)"\] \{/g)].map((m) => m[1]);
  it('lets you pick any theme at the top right, every one there (14 Nov: "a theme picker in the top right")', () => {
    expect(THEMES).toEqual(expect.arrayContaining(['gold', 'black', 'blue']));
    const picks = [...page.matchAll(/data-pick="(\w+)"/g)].map((m) => m[1]);
    expect(picks.sort()).toEqual(['rose', ...THEMES].sort());
  });
  for (const name of [undefined, ...THEMES]) {
    it(`keeps every word readable in the ${name ?? 'rose'} theme`, () => {
      const t = theme(name);
      for (const [fg, bg] of WORDS) {
        if (!t[fg] || !t[bg]) continue;
        expect(contrast(t[fg], t[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
  it('shows where the keyboard is on every link and button, and calms down for reduced motion', () => {
    expect(site).toMatch(/a:focus-visible, button:focus-visible \{ outline:/);
    expect(site).toMatch(/prefers-reduced-motion: reduce/);
  });
});

/* The site's other pages: the same colours, and a way home at the top of each (the user, 14 Nov: "we also need a
   easy way to get back to home on each of these other pages at the top"; "the color theme and things need to carry
   on through the site. It's just on the homepage right now"). */
describe('every page: the front page\'s colours, and a way home at the top (14 Nov)', () => {
  const PAGES = ['changelog.html', 'design.html', 'distilling-guide.html', 'distilling-positions.html', 'carpentry.html',
    'catalogue-colours.html', 'catalogue-furniture.html', 'race-editor.html'];
  for (const f of PAGES) {
    const html = read(f);
    it(`${f}: the theme you picked, the shared colours, the bar home first thing`, () => {
      expect(html, 'the theme set in its head').toMatch(/<head>[\s\S]*<script src="js\/theme\.js"><\/script>[\s\S]*<\/head>/);
      expect(html).toContain('<link rel="stylesheet" href="css/site.css">');
      expect(html, 'the bar home at the top of the body').toMatch(/<body[^>]*>\s*<script src="js\/site-bar\.js"[^>]*><\/script>/);
    });
    it(`${f}: no colours of its own for the page, only the theme's by name`, () => {
      const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
      expect(styles).not.toMatch(/:root \{/);
      expect(styles).not.toMatch(/var\(--(gold|cream)\)/);
    });
  }
  it('the bar: home, the pages and Play the den, each 44px tall for a thumb', () => {
    const bar = read('js/site-bar.js');
    expect(bar).toContain('href="./"');
    expect(bar).toContain('href="den.html"');
    for (const sel of [/\.sb-home \{[^}]*min-height: 44px/, /\.sb-go a \{[^}]*min-height: 44px/, /\.sb-play \{[^}]*min-height: 44px/]) expect(site).toMatch(sel);
  });
});
