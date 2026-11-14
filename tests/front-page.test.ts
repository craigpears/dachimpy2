import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

describe('the front page', () => {
  it('lists the sticky menu in the order its sections appear on the page ("really off-putting", 14 Nov)', () => {
    const nav = page.match(/<nav class="jump"[\s\S]*?<\/nav>/)![0];
    const ids = [...nav.matchAll(/href="#([\w-]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(3);
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
/** A theme's colours: :root's, with a `[data-theme=...]` block's over them. */
const theme = (name?: string) => {
  const block = (sel: RegExp) => Object.fromEntries([...(page.match(sel)?.[1] ?? '').matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1], m[2]]));
  const root = block(/:root \{([\s\S]*?)\n {2}\}/);
  if (!name) return root;
  const over = block(new RegExp(String.raw`\[data-theme="${name}"\] \{([\s\S]*?)\n {2}\}`));
  expect(Object.keys(over).length, `the ${name} theme's block`).toBeGreaterThan(3);
  return { ...root, ...over };
};

describe('the front page\'s colours: usable first (the user, 14 Nov: "not at the expense of like usability")', () => {
  // Words against what they sit on, at least 4.5:1 (WCAG AA), in every theme.
  const WORDS: [string, string][] = [['text', 'bg'], ['dim', 'bg'], ['faint', 'bg'], ['title', 'bg'], ['accent-text', 'bg'],
    ['accent2-text', 'bg'], ['on-accent', 'accent'], ['ink', 'paper'], ['ink2', 'paper'], ['ink-head', 'paper'],
    ['link', 'paper'], ['link-hi', 'paper'], ['link', 'paper2'], ['coming-text', 'coming-a'], ['coming-text', 'coming-b']];
  for (const name of [undefined, 'gold']) {
    it(`keeps every word readable in the ${name ?? 'rose'} theme`, () => {
      const t = theme(name);
      for (const [fg, bg] of WORDS) {
        if (!t[fg] || !t[bg]) continue;
        expect(contrast(t[fg], t[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
  it('shows where the keyboard is on every link and button, and calms down for reduced motion', () => {
    expect(page).toMatch(/a:focus-visible, button:focus-visible \{ outline:/);
    expect(page).toMatch(/prefers-reduced-motion: reduce/);
  });
});
