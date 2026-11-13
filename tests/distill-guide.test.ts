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
  PLAN, SORTED_RIGHT, STUCK_ON_TOP, TRICKS, pairOn, amongBlacks, endOf, firstLevel, fluidMotion, guide, isFluid, liveMove, phaseExamples, position, sameMove,
  techniqueExamples, techniqueOrder, trickExamples, levelRows, unsorted, READ_EXAMPLES, readingExamples,
} from '../src/distill-guide';
import { STATES, TACTICS, readBoard } from '../src/distill-read';
import { POSITIONS as POS } from '../src/distill-positions';
import type { GuideItem, Technique } from '../src/distill-guide';
import { POSITIONS } from '../src/distill-guide-boards';
import { BLACK, BROWN, CHAIN_BONUS, DOWN_LEFT, DOWN_RIGHT, MESSAGES, UP_LEFT, UP_RIGHT, WHITE, parseBoard } from '../src/distilling';
import { ROUTINES, playDrags, rightFrom, whitesFrom } from '../src/distill-routines';
import { PHASES, PHASE_ORDER, phaseOf } from '../src/distill-phase';
import { LEVELS, PATH_LABEL, SWEEP_LABEL, bankFor, choose, contextFor } from '../src/distill-bots';
import { HELP, ONWARD, PHASE, TELL, BEST, SPOT, TEACH } from '../src/lines/helium';
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
    expect(TRICKS).toHaveLength(9);
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
  it('says the lesson shows plain moves first and asks you to spot more (13 Nov: "am I supposed to be able to figure out and spot similar things?")', () => {
    const at = page.indexOf('id="goal"'), goal = page.slice(at, page.indexOf('</article>', at));
    expect(goal).toMatch(/plain moves first/);
    expect(goal).toMatch(/for you to find/);
    expect(goal).toContain('data-quote="trick"');
    expect(goal).toContain('data-quote="spot"');
    expect(g.quotes.trick).toBe(TEACH.lift.why);
    expect(g.quotes.spot).toBe(SPOT.three);
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

describe('the guide in the course of a game (13 Nov, "a few of the simple things are a bit out of order ... progression\'s a bit weird")', () => {
  const attrOf = (it: GuideItem) => `data-${it.kind}="${it.name}"`;
  it('puts every technique and trick once, under its phase', () => {
    const items = PHASE_ORDER.flatMap((p) => PLAN[p]);
    const techs = items.filter((i) => i.kind === 'technique').map((i) => i.name), tricks = items.filter((i) => i.kind === 'trick').map((i) => i.name);
    expect([...techs].sort()).toEqual([...techniqueOrder()].sort());
    expect([...tricks].sort()).toEqual([...TRICKS].sort());
    expect(g.plan).toBe(PLAN);
  });
  it('lays the page out as the plan: each phase\'s heading and board, then its own sections, in order', () => {
    let last = page.indexOf('id="target"');
    for (const [k, p] of PHASE_ORDER.entries()) {
      const head = page.indexOf(`id="ph-${p}"`), board = page.indexOf(`data-phase="${p}"`);
      const next = k + 1 < PHASE_ORDER.length ? page.indexOf(`id="ph-${PHASE_ORDER[k + 1]}"`) : page.indexOf('id="then"');
      expect(head, `no heading for the phase ${p}`).toBeGreaterThan(last);
      expect(board).toBeGreaterThan(head);
      let at = board;
      for (const it of PLAN[p]) {
        const i = page.indexOf(attrOf(it));
        expect(i, `${it.name} isn't under ${p}, in order`).toBeGreaterThan(at);
        expect(i, `${it.name} isn't under ${p}`).toBeLessThan(next);
        at = i;
      }
      last = at;
    }
  });
  it('starts with what a player needs first, never a white down the fire and the danger by the fire, and keeps the channels in the chain', () => {
    expect(PLAN.fire.slice(0, 2)).toEqual([{ kind: 'trick', name: 'white' }, { kind: 'trick', name: 'danger' }]);
    expect(PLAN.chain[0]).toEqual({ kind: 'technique', name: 'channel' });
    const firstTechnique = Math.min(...techniqueOrder().map((t) => page.indexOf(`data-technique="${t}"`)));
    expect(page.indexOf('data-trick="white"')).toBeLessThan(firstTechnique);
    expect(page.indexOf('data-trick="danger"')).toBeLessThan(firstTechnique);
  });
  it('simplest first: within a phase no technique comes before one a lower level brings in, and the ones marked for longer chains come in later than the channels', () => {
    const target = (t: Technique) => firstLevel(t)!.target;
    for (const p of PHASE_ORDER) {
      const ts = PLAN[p].filter((i) => i.kind === 'technique' && !i.longer && i.name !== 'path').map((i) => target(i.name as Technique));
      expect([...ts].sort((a, b) => a - b), p).toEqual(ts);
    }
    for (const i of PLAN.chain) if (i.kind === 'technique' && i.longer) expect(target(i.name)).toBeGreaterThan(target('channel'));
  });
});

describe('the sorted right side\'s one fluid motion (13 Nov, "once there\'s a nice clear separation, it\'s just down, up and back up again")', () => {
  const cols = parseBoard(SORTED_RIGHT), d = fluidMotion(cols)!;
  it('finds the drag on a sorted right side: a black from the far left, down under the whites, then up through the browns', () => {
    expect(d).not.toBeNull();
    expect(d.x).toBeLessThan(2);
    expect(cols[d.x][d.y]).toBe(BLACK);
    const after = playDrags(cols, [d]);
    expect(after, 'not a legal drag').not.toBeNull();
    const turn = d.ways.findIndex((w) => w === UP_RIGHT || w === UP_LEFT);
    expect(turn).toBeGreaterThan(0);
    expect(d.ways.slice(0, turn).every((w) => w === DOWN_RIGHT || w === DOWN_LEFT)).toBe(true);
    expect(d.ways.slice(turn).every((w) => w === UP_RIGHT || w === UP_LEFT)).toBe(true);
    expect(isFluid(cols, d)).toBe(true);
  });
  it('ends with the black among the blacks on the right, and the sort keeps itself', () => {
    const after = playDrags(cols, [d])!, [ex, ey] = endOf(cols, d), from = rightFrom(cols);
    expect(ex).toBeGreaterThanOrEqual(from);
    expect(after[ex][ey]).toBe(BLACK);
    expect(amongBlacks(after, ex, ey)).toBe(true);
    expect(unsorted(after, from)).toBeLessThanOrEqual(unsorted(cols, from));
    expect(whitesFrom(after, from)).toBeLessThanOrEqual(whitesFrom(cols, from));
  });
  it('is drawn on the page in the blocks, its board the sorted one and its drag the one found', () => {
    const t = trickExamples().find((x) => x.trick === 'fluid')!;
    expect(t.shows).toBe(true);
    expect(t.picture.cols).toEqual(cols);
    expect(t.picture.drags).toEqual([d]);
    expect(t.level).toBe(firstLevel('turnOver')!.label);
    expect(PLAN.block.at(-1)).toEqual({ kind: 'trick', name: 'fluid' });
    expect(words(section('data-trick', 'fluid')!).join(' ').length).toBeGreaterThan(60);
  });
  it('isn\'t fooled: a drag that stops short among the browns isn\'t it', () => {
    const turn = d.ways.findIndex((w) => w === UP_RIGHT || w === UP_LEFT);
    expect(isFluid(cols, { ...d, ways: d.ways.slice(0, turn + 1) })).toBe(false);
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

describe('the pair rescue in the chain (13 Nov: "this is absolute danger mode ... the first thing I would be doing here is just rescuing that brown piece")', () => {
  const cols = parseBoard(STUCK_ON_TOP), last = cols.length - 1, p = pairOn(cols);
  it('is drawn on the board of a brown stuck at the top of the column going up, the drags the bots find on it', () => {
    const t = trickExamples().find((x) => x.trick === 'pair')!;
    expect(t.shows).toBe(true);
    expect(t.picture.cols).toEqual(cols);
    expect(t.picture.rings).toEqual([[last, 0]]);
    expect(cols[last][0]).toBe(BROWN);
    expect(t.picture.shade).toEqual([last]);
    expect(t.picture.drags).toEqual(p.drags);
    expect(t.says).toBe(HELP.path);
  });
  it('the drags free the column, a pair working together where no one piece does, and they are the lowest bot\'s own move', () => {
    expect(p.frees).toBe(true);
    expect(p.drags.length).toBeGreaterThanOrEqual(2);
    expect(playDrags(cols, p.drags)![last].every((x) => x === WHITE)).toBe(true);
    const a = choose({ cols, chain: 0, timeLeft: 15000 }, contextFor(cols, 'chain', 0, LEVELS[0].reach), LEVELS[0]);
    expect(a.drags).toEqual(p.drags);
  });
  it('sits in the chain, straight after the channels, with words of its own', () => {
    expect(PLAN.chain[1]).toEqual({ kind: 'trick', name: 'pair' });
    expect(words(section('data-trick', 'pair')!).join(' ').length).toBeGreaterThan(60);
  });
});

describe('reading the board, in the read version (13 Nov, the board reader: "what kind of tactics are in play")', () => {
  it('has a section on reading the board, its states in plain words, before the phases', () => {
    const i = page.indexOf('id="reading"');
    expect(i).toBeGreaterThan(0);
    expect(i).toBeLessThan(page.indexOf('id="phases"'));
    expect(page).toContain('data-reading');
    for (const s of Object.values(STATES)) expect(page).toContain(`<b>${s.label}:</b>`);
  });
  it('reads each position as the planner reads it, a different state each, the bot\'s move drawn on it', () => {
    const r = readingExamples();
    expect(r.map((e) => e.id)).toEqual([...READ_EXAMPLES]);
    expect(new Set(r.map((e) => e.state)).size).toBeGreaterThanOrEqual(3);
    for (const e of r) {
      const p = POS.find((q) => q.id === e.id)!;
      expect(readBoard(e.picture.cols, { stage: p.stage, timeLeft: p.timeLeft }).tactic).toBe(e.tactic);
      expect(e.picture.drags.length, e.id).toBeGreaterThan(0);
      expect(playDrags(e.picture.cols, e.picture.drags), e.id).not.toBeNull();
      expect(e.tacticLabel).toBe(TACTICS[e.tactic].label);
    }
    expect(g.reading).toHaveLength(READ_EXAMPLES.length);
  });
});