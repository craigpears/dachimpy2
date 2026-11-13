/* Distilling, the read version (distilling-guide.html, src/distill-guide.ts), 13 Nov. The user: "a summary document of
   the strategy that the bot is taking now ... what are the rules, what are the phases, what are the tricks and
   techniques ... a read version ... a 2D static version of the guide, and ... everything's just kept in sync, like
   the animated version, the 2D static version" (RULES.md, "Every tutorial has a read version, kept in sync").

   So this fails whenever the page and the code part: a routine, phase, level or trick with no section on the page,
   or a board that no longer shows its move. When a routine or the planner changes and a board stops showing its
   move, pick the boards again: `npm run build`, then `node_modules/node/bin/node.exe tools/distill-guide.mjs`, then
   `npm run build` once more. */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  TRICKS, guide, liveMove, phaseExamples, position, sameMove, techniqueExamples, techniqueOrder, trickExamples, levelRows,
} from '../src/distill-guide';
import { POSITIONS } from '../src/distill-guide-boards';
import { BLACK, BROWN, CHAIN_BONUS, MESSAGES, WHITE, parseBoard } from '../src/distilling';
import { ROUTINES, playDrags } from '../src/distill-routines';
import { PHASES, PHASE_ORDER, phaseOf } from '../src/distill-phase';
import { LEVELS, PATH_LABEL, SWEEP_LABEL, bankFor } from '../src/distill-bots';
import { HELP, ONWARD, PHASE, TELL, BEST } from '../src/lines/helium';
import { STEP_ONE_CTX, afterOpening, lessonPlan } from '../src/den-helium';

const ROOT = join(__dirname, '..');
const page = readFileSync(join(ROOT, 'distilling-guide.html'), 'utf8');
/** The page's section for an attribute's value: its markup, from its opening tag to the next section's. */
function section(attr: string, value: string): string | null {
  const i = page.indexOf(`${attr}="${value}"`);
  if (i < 0) return null;
  const rest = page.slice(i), end = rest.search(/\n\s*<(article|li)[\s>]/);
  return end < 0 ? rest : rest.slice(0, end);
}
/** The hand-written words in a section: its paragraphs' text. */
const words = (s: string) => [...s.matchAll(/<p[^>]*>([^<]+(?:<[^p][^>]*>[^<]*)*)<\/p>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);

const g = guide();

describe('the read version: a section for everything the code has (13 Nov, "everything\'s just kept in sync")', () => {
  it('has a section, in words, for every routine, the sweep and the path search', () => {
    const names = techniqueOrder();
    for (const r of Object.keys(ROUTINES)) expect(names).toContain(r);
    expect(names).toContain('sweep');
    expect(names).toContain('path');
    for (const n of names) {
      const s = section('data-technique', n);
      expect(s, `no section for the technique ${n}`).not.toBeNull();
      expect(words(s!).join(' ').length, `no words for the technique ${n}`).toBeGreaterThan(60);
      expect(s).toContain('data-picture');
      expect(s).toContain(`id="t-${n}"`);
    }
  });
  it('has a section for every phase, in a game\'s order', () => {
    const at = PHASE_ORDER.map((p) => page.indexOf(`data-phase="${p}"`));
    for (const [i, p] of PHASE_ORDER.entries()) {
      expect(at[i], `no section for the phase ${p}`).toBeGreaterThan(0);
      expect(words(section('data-phase', p)!).join(' ').length).toBeGreaterThan(60);
    }
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });
  it('has a line for every level, its target\'s own', () => {
    for (const l of LEVELS) {
      const s = section('data-level', l.name);
      expect(s, `no line for the level ${l.label}`).not.toBeNull();
      expect(words(s!).length).toBeGreaterThan(0);
    }
  });
  it('has a section for each of the user\'s tricks', () => {
    expect(TRICKS).toHaveLength(7);
    for (const t of TRICKS) {
      const s = section('data-trick', t);
      expect(s, `no section for the trick ${t}`).not.toBeNull();
      expect(words(s!).join(' ').length).toBeGreaterThan(60);
    }
  });
  it('sends you to Helium, and on to other pirates', () => {
    expect(page).toContain('den.html?at=helium');
    expect(page).toContain('data-quote="onward"');
    expect(page).toContain('data-quote="tell"');
    expect(g.quotes.onward).toBe(ONWARD);
    expect(g.quotes.tell).toBe(TELL);
  });
  it('writes no names or lines of the code\'s into the page by hand: they\'re drawn in', () => {
    for (const line of [...Object.values(HELP), ONWARD, TELL, BEST.none, ...PHASE_ORDER.map((p) => PHASE[p].first), ...PHASE_ORDER.map((p) => PHASES[p].plan)]) {
      expect(page, `"${line}" written into the page`).not.toContain(line);
    }
    expect(page).toContain('<script type="module" src="js/distill-guide-view.js"></script>');
  });
});

describe('every board shows what it\'s there for', () => {
  it('draws each technique on a board where its own routine offers that move', () => {
    const ex = techniqueExamples();
    expect(ex.map((t) => t.name)).toEqual(techniqueOrder());
    for (const t of ex) {
      expect(t.offered, `${t.name}'s board no longer shows its move: run tools/distill-guide.mjs`).toBe(true);
      expect(t.picture.drags.length, `${t.name} has no drag drawn`).toBeGreaterThan(0);
      expect(playDrags(t.picture.cols, t.picture.drags), `${t.name}'s drags aren't legal on its board`).not.toBeNull();
    }
  });
  it('names each technique as the code does', () => {
    for (const t of techniqueExamples()) {
      expect(t.label).toBe(t.name === 'sweep' ? SWEEP_LABEL : t.name === 'path' ? PATH_LABEL : ROUTINES[t.name].label);
      if (t.name !== 'sweep') expect(t.says).toBe(HELP[t.name]);
    }
  });
  it('draws saving the whites on Helium\'s lesson board, as the first move of their step one', () => {
    const rescue = techniqueExamples().find((t) => t.name === 'rescue')!;
    const g0 = afterOpening(), before = g0.cols.map((c) => [...c]);
    const clear = lessonPlan(g0).find((b) => b.name === 'clear')!;
    expect(rescue.picture.cols).toEqual(before);
    expect(clear.act.kind).toBe('drags');
    if (clear.act.kind === 'drags') expect(rescue.picture.drags).toEqual(clear.act.drags.slice(0, rescue.picture.drags.length));
    expect(ROUTINES.rescue.find(before, STEP_ONE_CTX).some((m) => sameMove(m.drags, rescue.picture.drags))).toBe(true);
  });
  it('keeps a board for every technique but the lesson\'s, each one that bot\'s own move or its routine\'s', () => {
    for (const n of techniqueOrder().filter((x) => x !== 'rescue')) {
      const p = position(`technique:${n}`);
      expect(p.technique).toBe(n);
      expect(liveMove(p).offered, `${n}: its routine no longer offers the move kept for it`).toBe(true);
    }
    for (const [key, p] of Object.entries(POSITIONS)) expect(parseBoard(p.cols), key).toHaveLength(10);
  });
  it('draws each phase on a board in that phase, the first two Helium\'s lesson board', () => {
    const ex = phaseExamples();
    expect(ex.map((p) => p.phase)).toEqual(PHASE_ORDER);
    for (const p of ex) {
      expect(phaseOf(p.picture.cols, p.stage), p.phase).toBe(p.phase);
      expect(p.label).toBe(PHASES[p.phase].label);
      expect(p.says).toBe(PHASE[p.phase].first);
    }
    expect(ex[0].picture.from).toContain('lesson');
    expect(ex[1].picture.from).toContain('lesson');
    expect(ex[0].picture.rings.length).toBeGreaterThan(0);
    expect(ex[0].picture.drags.length).toBeGreaterThan(0);
  });
  it('draws each trick on a board where it shows', () => {
    const ex = trickExamples();
    expect(ex.map((t) => t.trick)).toEqual([...TRICKS]);
    for (const t of ex) expect(t.shows, `the trick ${t.trick} doesn't show on its board: run tools/distill-guide.mjs`).toBe(true);
    // Never a white down the fire: the opening's own white, at the fire.
    expect(ex[0].picture.rings.length).toBeGreaterThan(0);
  });
});

describe('the rules and the levels, read off the code', () => {
  it('has the three swaps of the rock, paper, scissors rule', () => {
    expect(g.swaps).toEqual([{ lower: WHITE, upper: BLACK }, { lower: BROWN, upper: WHITE }, { lower: BLACK, upper: BROWN }]);
    expect(g.furnaceSecs).toBe(15.3);
  });
  it('judges its sample columns as the game does: a Crystal Clear, a chain\'s bonus, a burn', () => {
    const [first, fourth] = g.columns;
    expect(first.message).toBe(MESSAGES.clear);
    expect(fourth.bonus).toBe(3 * CHAIN_BONUS);
    expect(g.columns.some((c) => !c.up && c.message === MESSAGES.burnt)).toBe(true);
    expect(g.columns.some((c) => c.up && c.message === null)).toBe(true);
  });
  it('lists each level with its bank and the techniques it adds, every technique somewhere', () => {
    const rows = levelRows();
    expect(rows.map((r) => r.name)).toEqual(LEVELS.map((l) => l.name));
    for (const r of rows) expect(r.bank).toBe(bankFor(r.target));
    expect(new Set(rows.flatMap((r) => r.adds))).toEqual(new Set(techniqueOrder()));
  });
});
