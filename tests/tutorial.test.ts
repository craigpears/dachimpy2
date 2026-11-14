/* Every tutorial the same shape, and you can jump in anywhere (the user, 14 Nov: "whatever structure we come up with
   ... should be a standard generic thing ... jump to this, let me show you this trick. Let me show you this phase";
   RULES.md, TUTORIALS.md): src/tutorial.ts, knowing nothing of any puzzle, and Distilling's draft description in it
   (src/distill-tutorial.ts). */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SECTIONS, TutorialMenu, anchorOf, choicesOf, covered, findPart, navFor, openingOf, partsOf, problems, spy } from '../src/tutorial';
import type { MenuEvent, Part, Tutorial } from '../src/tutorial';
import { DISTILL_TUTORIAL, SCENARIO_READS, distillShows } from '../src/distill-tutorial';
import { PHASE_ORDER } from '../src/distill-phase';
import { BASIC_MOVES, PLAN, READ_EXAMPLES, RULES_OF_THUMB, readingExamples, trickTiles } from '../src/distill-guide';
import { DRAG_TRICKS } from '../src/distill-teach';

// A made-up puzzle, to show the module knows nothing of any real one.
const part = (id: string, phase?: string, todo?: string): Part => ({ id, title: id.toUpperCase(), line: `All about ${id}.`, shows: { kind: 'board', ref: id }, ...(phase ? { phase } : {}), ...(todo ? { todo } : {}) });
const TOY: Tutorial = {
  puzzle: 'Knots', teacher: 'Bosun',
  basics: [part('rope'), part('loops')],
  phases: [part('early'), part('late'), part('never', undefined, 'not written yet')],
  tricks: [part('reef'), part('bowline', 'early'), part('hitch', 'late'), part('splice', 'never', 'later')],
  scenarios: [part('storm', 'late'), part('calm', 'early')],
  choices: [
    { id: 'start', label: 'The basics', asks: 'From the start?', then: 'From the start, then.', covers: ['basics', 'reef'] },
    { id: 'game', label: 'Early on', asks: 'Help early on?', then: 'Early on, then. A whole scenario, or one knot?', covers: ['early'] },
    { id: 'end', label: 'Late on', asks: 'Late on?', then: 'Late on.', covers: ['late'] },
    { id: 'someday', label: 'Never', asks: 'Never?', then: 'Never.', covers: ['never'] },
  ],
  hello: 'Ahoy.',
};
const ids = (ps: readonly { id: string }[]) => ps.map((p) => p.id);

describe('a tutorial described (14 Nov: "one standard structure for every puzzle")', () => {
  it('a sound description has no problems; a broken one says what\'s wrong', () => {
    expect(problems(TOY)).toEqual([]);
    const broken: Tutorial = {
      ...TOY,
      tricks: [...TOY.tricks, part('reef'), part('knot', 'nowhere'), { ...part('lost'), line: '' }],
      choices: [...TOY.choices, { id: 'odd', label: 'Odd', asks: 'Odd?', then: 'Odd.', covers: ['ghost'] }],
    };
    const p = problems(broken).join('\n');
    expect(p).toMatch(/reef: in tricks and tricks/);
    expect(p).toMatch(/knot: no phase nowhere/);
    expect(p).toMatch(/lost: its line wants to be one line/);
    expect(p).toMatch(/choice odd: covers ghost/);
    expect(p).toMatch(/lost: no choice reaches it/);   // (nothing in the lesson you can't get to)
  });

  it('a choice covers a phase\'s own scenarios and tricks, scenarios before tricks; what isn\'t ready is left out', () => {
    const game = covered(TOY, TOY.choices[1]);
    expect(game.map((l) => l.section)).toEqual(['phases', 'scenarios', 'tricks']);
    expect(game.map((l) => ids(l.parts))).toEqual([['early'], ['calm'], ['bowline']]);
    expect(covered(TOY, TOY.choices[0]).map((l) => ids(l.parts))).toEqual([['rope', 'loops'], ['reef']]);
    // Nothing ready: the choice isn't offered, nor asked.
    expect(ids(choicesOf(TOY))).toEqual(['start', 'game', 'end']);
    expect(openingOf(TOY)).toBe('Ahoy. From the start? Help early on? Late on?');
  });

  it('the read guide\'s sticky nav: a button a section, the tricks and scenarios under their phases (14 Nov)', () => {
    const nav = navFor({ ...TOY, anchors: { basics: 'rules' } });
    expect(nav.map((g) => g.section)).toEqual([...SECTIONS]);
    expect(nav[0].href).toBe('#rules');
    expect(nav[1].runs[0].links.map((l) => l.id)).toEqual(['early', 'late']);   // (not "never": not ready)
    const tricks = nav[2].runs;
    expect(tricks.map((r) => r.phase?.id ?? null)).toEqual([null, 'early', 'late']);   // (any time first)
    expect(tricks.map((r) => r.links.map((l) => l.href))).toEqual([['#reef'], ['#bowline'], ['#hitch']]);
    expect(nav[3].runs.map((r) => r.phase?.id)).toEqual(['early', 'late']);
  });

  it('the nav lights where you are: the last place at or above where you\'re reading', () => {
    const marks = [{ id: 'b', top: 900 }, { id: 'a', top: 100 }, { id: 'c', top: 1500 }];
    expect(spy(marks, 50)).toBeNull();
    expect(spy(marks, 100)).toBe('a');
    expect(spy(marks, 1499)).toBe('b');
    expect(spy(marks, 9999)).toBe('c');
  });
});

describe('the lesson\'s opening choice, in the teacher\'s voice, not a chatbot (14 Nov)', () => {
  const press = (m: TutorialMenu, ...keys: string[]): MenuEvent | undefined => {
    let ev: MenuEvent | undefined;
    for (const k of keys) { const r = m.key(k); if (r.handled && r.event) ev = r.event; }
    return ev;
  };

  it('asks what you\'re after, then lists that part\'s scenarios or single tricks, by the keys', () => {
    const m = new TutorialMenu(TOY);
    let v = m.view();
    expect(v.level).toBe('choose');
    expect(v.says).toBe('Ahoy. From the start? Help early on? Late on?');
    expect(v.items.map((i) => i.label)).toEqual(['The basics', 'Early on', 'Late on']);
    expect(press(m, 'ArrowDown', 'Enter')).toBeUndefined();   // (a choice opens its list)
    v = m.view();
    expect(v.level).toBe('list');
    expect(v.says).toBe('Early on, then. A whole scenario, or one knot?');
    expect(v.tabs.map((t) => [t.section, t.on])).toEqual([['phases', true], ['scenarios', false], ['tricks', false]]);
    press(m, 'ArrowRight');
    expect(m.view().items.map((i) => i.id)).toEqual(['calm']);
    press(m, 'ArrowLeft', 'ArrowLeft');   // (round to the last)
    expect(m.view().tabs.find((t) => t.on)?.section).toBe('tricks');
    expect(press(m, ' ')).toEqual({ kind: 'play', part: TOY.tricks[1], section: 'tricks', choice: 'game' });
  });

  it('a digit picks its row; Esc goes back a level, then shuts; other keys go through to the game', () => {
    const m = new TutorialMenu(TOY);
    expect(m.key('q')).toEqual({ handled: false });
    expect(m.key('9')).toEqual({ handled: false });   // (no ninth row)
    press(m, '1');
    expect(m.view().choice).toBe('start');
    expect(press(m, '2')).toMatchObject({ kind: 'play', part: { id: 'loops' }, section: 'basics' });
    expect(m.view().back).toBe(true);
    expect(press(m, 'Escape')).toBeUndefined();
    expect(m.view().level).toBe('choose');
    expect(press(m, 'Escape')).toEqual({ kind: 'close' });
    // Up from the first row goes round to the last; W and S as on the den's boards.
    press(m, 'ArrowUp');
    expect(m.view().focus).toBe(2);
    press(m, 's');
    expect(m.view().focus).toBe(0);
  });

  it('taps (touch, or a click) do the same, and a link can open a list or a part straight away', () => {
    const m = new TutorialMenu(TOY);
    expect(m.tap(2)).toBeNull();
    expect(m.view().choice).toBe('end');
    m.tapTab('scenarios');
    expect(m.view().items.map((i) => i.id)).toEqual(['storm']);
    expect(m.tap(0)).toMatchObject({ kind: 'play', part: { id: 'storm' }, section: 'scenarios', choice: 'end' });
    expect(m.back()).toBeNull();
    expect(m.back()).toEqual({ kind: 'close' });
    expect(m.open('someday')).toBe(false);   // (nothing ready in it)
    expect(m.open('game')).toBe(true);
    expect(m.view().level).toBe('list');
    expect(m.play('hitch')).toMatchObject({ kind: 'play', section: 'tricks' });
    expect(m.play('splice')).toBeNull();   // (not ready)
    expect(findPart(TOY, 'calm')?.section).toBe('scenarios');
  });
});

describe('Distilling\'s description (its end game to be finished after the late-game work)', () => {
  const T = DISTILL_TUTORIAL;

  it('is sound, and its opening asks only what\'s ready (the end game once it is)', () => {
    expect(problems(T)).toEqual([]);
    expect(openingOf(T)).toBe('Right. What are you after? The basics? Help with the early or mid game? Trying to get your CC higher?');
    expect(ids(choicesOf(T))).toEqual(['basics', 'early', 'higher']);
  });

  it('has every phase, technique and trick the guide has, in its phases; its basics the rules of thumb and the basic moves, every drag trick and the leapfrog (14 Nov: no rules of the game, "for people who know the mechanics")', () => {
    expect(ids(partsOf(T, 'phases'))).toEqual([...PHASE_ORDER]);
    for (const phase of PHASE_ORDER) {
      expect(partsOf(T, 'tricks').filter((p) => p.phase === phase).map((p) => p.id)).toEqual(PLAN[phase].map((it) => it.name));
    }
    expect(partsOf(T, 'tricks').filter((p) => !p.phase)).toEqual([]);
    expect(partsOf(T, 'basics').map((p) => p.id)).toEqual([...RULES_OF_THUMB, ...DRAG_TRICKS, 'makeWay', ...BASIC_MOVES]);
    expect(partsOf(T, 'scenarios').map((p) => p.id)).toEqual(['stepOne', ...READ_EXAMPLES.map((id) => id.toLowerCase())]);
  });

  it('each scenario is the state and tactic the planner reads on its board', () => {
    for (const r of readingExamples()) {
      const want = SCENARIO_READS[r.id as keyof typeof SCENARIO_READS];
      expect([r.id, r.state, r.tactic]).toEqual([r.id, want.state, want.tactic]);
    }
  });

  it('every part ready is shown by one of the read guide\'s own pictures: its moves, where it says moves', () => {
    for (const s of SECTIONS) for (const p of partsOf(T, s)) {
      const pic = distillShows(p.shows.ref);
      expect(pic, `${p.id}: ${p.shows.ref}`).not.toBeNull();
      if (p.shows.kind === 'moves') expect(pic!.drags.length, `${p.id}'s moves`).toBeGreaterThan(0);
    }
  });

  it('every part ready has its place on distilling-guide.html, so its sticky nav lands on each (14 Nov)', () => {
    const html = readFileSync(join(__dirname, '../distilling-guide.html'), 'utf8');
    const there = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
    for (const id of READ_EXAMPLES) there.add(`r-${id.toLowerCase()}`);   // (js/distill-guide-view.js draws these,
    for (const t of trickTiles()) there.add(`d-${t.trick}`);               // and the trick tiles)
    const nav = navFor(T);
    for (const g of nav) expect(there.has(g.href.slice(1)), g.href).toBe(true);
    for (const s of SECTIONS) for (const p of partsOf(T, s)) expect(there.has(anchorOf(p)), `#${anchorOf(p)}`).toBe(true);
  });

  it('distilling-guide.html draws its sticky nav from the description, and the old table of contents is gone (14 Nov)', () => {
    const html = readFileSync(join(__dirname, '../distilling-guide.html'), 'utf8');
    const view = readFileSync(join(__dirname, '../js/distill-guide-view.js'), 'utf8');
    expect(html).not.toMatch(/nav class="toc"|data-toc/);
    expect(view).toMatch(/tutorialNav\(DISTILL_TUTORIAL/);
    expect(view).toMatch(/id: `d-\$\{t\.trick\}`/);
  });
});
