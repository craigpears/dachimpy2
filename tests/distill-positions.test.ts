/* Distilling: positions to critique, each critique a test (src/distill-positions.ts, distilling-positions.html; the
   user, 13 Nov: "some real deterministic test on what I think the bot should be doing at that point, either at the
   strategic level or specific move level ... at the moment, I feel like I'm critiquing, but it's not really having
   the specific impact, and it's not very regression-proof").

   Each verdict the user gives on a position is checked against what the bot does there now (`botAt`: the planner
   with the position's level, stage and furnace time). A position with no verdict yet is a todo. A verdict marked
   `open` (the bots don't meet it yet) is expected to fail, and this says so once they do: then take `open` off.

   When the bots change and the page's moves should follow: `npm run build`, then
   `node_modules/node/bin/node.exe tools/distill-positions.mjs`, then `npm run build` again. */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MOMENTS, POSITIONS, SKIPPED, VERDICTS, boardOf, botAt, check, moveOf } from '../src/distill-positions';
import { COLS, TALL } from '../src/distilling';
import { playDrags } from '../src/distill-routines';

describe('the positions (picked by tools/distill-positions.mjs)', () => {
  it('are a dozen or so, a couple of each kind of moment, with ids P1, P2... once each', () => {
    expect(POSITIONS.length).toBeGreaterThanOrEqual(10);
    expect(new Set(POSITIONS.map((p) => p.id)).size).toBe(POSITIONS.length);
    for (const p of POSITIONS) expect(p.id).toMatch(/^P\d+$/);
    for (const m of Object.keys(MOMENTS)) expect(POSITIONS.some((p) => p.moment === m), m).toBe(true);
  });
  it('are real boards, and the move kept with each plays on it', () => {
    for (const p of POSITIONS) {
      const cols = boardOf(p);
      expect(cols.length).toBe(COLS);
      cols.forEach((c, x) => { if (x) expect(c.length === TALL).not.toBe(cols[x - 1].length === TALL); });
      expect(playDrags(cols, p.bot.drags), p.id).not.toBeNull();
    }
  });
  it('every verdict is on a position that exists, dated, in words', () => {
    const ids = new Set(POSITIONS.map((p) => p.id));
    for (const [id, vs] of Object.entries(VERDICTS)) {
      expect(ids.has(id), id).toBe(true);
      for (const v of vs) { expect(v.date).toBeTruthy(); expect(v.note.length).toBeGreaterThan(10); expect(Object.keys(v.expect).length).toBeGreaterThan(0); }
    }
  });
  it('the page has a slot for them, and says to answer in chat', () => {
    const page = readFileSync(join(__dirname, '..', 'distilling-positions.html'), 'utf8');
    expect(page).toContain('js/distill-positions-view.js');
    expect(page).toMatch(/in chat/);
  });
});

describe('what the bot should do at each position (the user\'s verdicts)', () => {
  for (const p of POSITIONS) {
    const verdicts = VERDICTS[p.id] ?? [];
    if (!verdicts.length && SKIPPED[p.id]) { it.skip(`${p.id}: skipped by the user, ${SKIPPED[p.id].date}: ${SKIPPED[p.id].note}`, () => {}); continue; }
    if (!verdicts.length) { it.todo(`${p.id}: ${MOMENTS[p.moment].toLowerCase()} (${p.level}, seed ${p.seed}), no verdict yet`); continue; }
    for (const v of verdicts) {
      const name = `${p.id}, ${v.date}: ${v.note}`;
      const run = () => {
        const misses = check(p, moveOf(botAt(p)), v.expect);
        expect(misses, `${p.id}: ${misses.join('; ')}`).toEqual([]);
      };
      if (v.open) it.fails(`${name} (open: the bots don't do this yet; once this fails, they do, so take "open" off)`, run);
      else it(name, run);
    }
  }
});
