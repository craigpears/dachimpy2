/* No file the site serves is one an ad or privacy blocker would stop: one module blocked and the
   whole den fails to load. */
import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', 'src', 'tests', 'tools', '.claude', '.wrangler', 'worker']);

function served(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) served(p, out);
    else if (/\.(js|mjs|html|css)$/.test(name)) out.push(p.slice(ROOT.length + 1).replace(/\\/g, '/'));
  }
  return out;
}

// Names the common blocker lists (EasyList, EasyPrivacy, uBlock's) stop as analytics, ads or tracking.
const BLOCKED = /(umami|analytics|gtag|matomo|piwik|plausible|tracking|tracker|pixel|beacon|adsbygoogle|(^|[/_.-])ads?([/_.-]|$))/i;

describe('the den loads behind a blocker', () => {
  it('the den won\'t load: a blocker stopped umami.js (10 Nov)', () => {
    // "Failed to load resource: net::ERR_BLOCKED_BY_CLIENT ... Trying to load umami.js"
    const files = served(ROOT);
    expect(files).toContain('js/den.js');
    expect(files.filter((f) => BLOCKED.test(f))).toEqual([]);
  });
});
