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
