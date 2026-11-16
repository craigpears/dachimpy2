/* Helium's lesson in the one tutorial shape (the user, 14 Nov: "Would you like me to start you [with] the basics? Would
   you like help with the early or mid game? Are you trying to get your CC higher?"; then pick a part and it's shown on
   a real board), quick to get into and every trick with its point (15 Nov): src/den-helium-tutor.ts,
   src/lines/helium.ts's TUTOR and POINT. */
import { describe, expect, it } from 'vitest';
import { DISTILL_TUTORIAL, learnBeats, nextOf, noteFor, ringedAfter, tutorBeats } from '../src/den-helium-tutor';
import { distillShows } from '../src/distill-tutorial';
import { SECTIONS, TutorialMenu, findPart, lessonOrder, openingOf, partsOf, problems } from '../src/tutorial';
import { Distilling, WHITE, BROWN, BLACK } from '../src/distilling';
import { POINT, TUTOR } from '../src/lines/helium';
import { afterOpening, follow, lessonBeats, lessonPlan } from '../src/den-helium';

const playable = () => SECTIONS.flatMap((s) => partsOf(DISTILL_TUTORIAL, s));

describe('Helium\'s choice of what to show you, in their own lines (14 Nov)', () => {
  it('their question and each answer\'s line are theirs, from src/lines/helium.ts', () => {
    const T = DISTILL_TUTORIAL;
    expect(openingOf(T)).toBe([TUTOR.opening, TUTOR.basics.asks, TUTOR.early.asks, TUTOR.higher.asks].join(' '));
    const m = new TutorialMenu(T);
    m.key('2');
    expect(m.view().says).toBe(TUTOR.early.then);
  });

  it('step one, picked, is their lesson as it was, on the board their opening leaves', () => {
    const beats = learnBeats('stepOne');
    expect(beats[0].act).toEqual({ kind: 'lay', cols: afterOpening().cols });
    expect(beats.slice(1).map((b) => b.name)).toEqual(lessonPlan().map((b) => b.name));
  });

  it('every part they can show plays on its own board: laid, every drag played whole, then the still yours', () => {
    for (const p of playable()) {
      const beats = tutorBeats(p);
      expect(beats.length, p.id).toBeGreaterThan(1);
      const lay = beats[0].act;
      expect(lay.kind, p.id).toBe('lay');
      if (lay.kind !== 'lay') continue;
      if (p.id !== 'stepOne') {
        expect(beats[0].note).toBe(noteFor(p));
        expect(beats[beats.length - 1].says).toBe(TUTOR.after);
      }
      const g = new Distilling(() => 0.5, { timer: false }).lay(lay.cols);
      for (const b of beats) {
        const drags = b.act.kind === 'drags' ? b.act.drags : b.act.kind === 'drag' ? [b.act] : [];
        for (const d of drags) { expect(g.dragWays(d.x, d.y, d.ways).swaps, `${p.id}: a drag from ${d.x},${d.y}`).toBe(d.ways.length); g.settle(1000); }
      }
      if (p.shows.kind === 'moves') expect(beats.some((b) => b.act.kind === 'drags'), `${p.id}'s moves`).toBe(true);
    }
  });

  it('a part not there, or not ready yet, is nothing to play', () => {
    expect(learnBeats('nowhere')).toEqual([]);
    expect(learnBeats('end')).toEqual([]);   // (the end game: the late-game work's)
  });
});

describe('"I don\'t want to have to ask 3 questions to see something happen" (15 Nov): their lesson starts showing straight away', () => {
  const beats = lessonBeats();
  it('needs no choice before a board moves: their opening, then step one, no question in between', () => {
    expect(beats.some((b) => (b.act.kind as string) === 'choose' || b.act.kind === 'learn')).toBe(false);
    const moves = beats.findIndex((b) => b.act.kind === 'drags' || b.act.kind === 'drag');
    expect(moves).toBeGreaterThan(0);
    expect(beats[moves].step).toBe(1);   // (step one's drags: the first thing after the opening)
    expect(beats.slice(0, moves).every((b) => b.act.kind === 'none' || b.act.kind === 'burn' || b.act.kind === 'bang')).toBe(true);
  });
  it('says once, handing you the still, that T is their lessons: nothing over the lesson itself', () => {
    expect(beats.filter((b) => /\bT\b/.test(b.says))).toHaveLength(1);
    expect(beats.at(-1)!.says).toMatch(/T for lessons/);
    expect(TUTOR.button).toBe('Lessons (T)');
    expect(TUTOR.next).toMatch(/\(N\)$/);
  });
});

describe('"I like that it\'s a single level ... click, click, and in. It felt a lot smoother" (15 Nov, of the wolf den\'s lessons)', () => {
  const T = DISTILL_TUTORIAL;
  it('a choice opens one list in a game\'s order, no tabs; a part picked from it plays', () => {
    expect(T.flat).toBe(true);
    for (const [key, choice] of [['1', 'basics'], ['2', 'early'], ['3', 'higher']] as const) {
      const m = new TutorialMenu(T);
      m.key(key);
      const v = m.view();
      expect(v.choice).toBe(choice);
      expect(v.tabs).toEqual([]);
      expect(v.items.map((i) => i.id)).toEqual(lessonOrder(T, T.choices.find((c) => c.id === choice)!).map((p) => p.id));
      const r = m.key('1');
      expect(r.handled && r.event?.kind).toBe('play');
    }
    // (the early game in a game's order: the fire's side, its scenarios and moves, then the fill's, then the blocks')
    const early = lessonOrder(T, T.choices.find((c) => c.id === 'early')!).map((p) => p.id);
    expect(early.slice(0, 2)).toEqual(['fire', 'stepOne']);
    expect(early.indexOf('fill')).toBeGreaterThan(early.indexOf('sweep'));
    expect(early.indexOf('block')).toBeGreaterThan(early.indexOf('turnOver'));
  });
  it('Next plays the one after it in that list, its hand-over saying N; at the list\'s end, nothing', () => {
    const early = lessonOrder(T, T.choices.find((c) => c.id === 'early')!);
    expect(nextOf('stepOne')?.id).toBe(early[2].id);   // (after their own lesson, the next on the fire's side)
    for (let i = 0; i + 1 < early.length; i++) expect(nextOf(early[i].id, 'early')?.id).toBe(early[i + 1].id);
    expect(nextOf(early.at(-1)!.id, 'early')).toBeNull();
    expect(learnBeats('sweep').at(-1)!.says).toBe(TUTOR.afterNext);
    expect(tutorBeats(findPart(T, 'hook')!.part).at(-1)!.says).toBe(TUTOR.after);   // (the last of a higher CC's)
  });
});

describe('"It just kind of jumped into it without any context of what it was doing, what it was achieving, what the point was" (15 Nov)', () => {
  it('every playable part has its before and after lines, from src/lines/helium.ts\'s POINT, and the description has no problems', () => {
    expect(problems(DISTILL_TUTORIAL)).toEqual([]);
    for (const p of playable()) {
      expect(p.point, p.id).toBeDefined();
      expect(p.point!.before.trim().length, p.id).toBeGreaterThan(0);
      expect(p.point!.after.trim().length, p.id).toBeGreaterThan(0);
      expect(p.point).toEqual((POINT as Record<string, unknown>)[p.id]);
      // (short enough for their bubble on a phone)
      for (const line of [p.point!.before, p.point!.after]) expect(line.split(/\s+/).length, `${p.id}: ${line}`).toBeLessThanOrEqual(22);
    }
  });
  it('says what\'s wrong or wanted first, the pieces ringed; then the move; then what it did, ringed again', () => {
    for (const p of playable()) {
      const beats = tutorBeats(p), says = beats.map((b) => b.says);
      const before = says.indexOf(p.point!.before), after = says.indexOf(p.point!.after);
      expect(before, `${p.id}: its before line`).toBeGreaterThanOrEqual(0);
      expect(after, `${p.id}: its after line`).toBeGreaterThan(before);
      const move = beats.findIndex((b) => b.act.kind === 'drags' || b.act.kind === 'burn');
      if (move >= 0) expect(move > before && move < after, `${p.id}: the move between`).toBe(true);
      if (p.id === 'stepOne') { expect(beats[before].marks).toBeDefined(); expect(beats[after].rings?.length).toBeGreaterThan(0); continue; }
      expect(beats[before].rings?.length, `${p.id}: ringed before`).toBeGreaterThan(0);
      if (beats.some((b) => b.act.kind === 'drags')) expect(beats[after].rings?.length, `${p.id}: ringed after`).toBeGreaterThan(0);
    }
  });
  it('rings the pieces again where the move left them', () => {
    // (step one: every white on the fire's side, out of it once the drags are played)
    const why = lessonPlan().find((b) => b.name === 'why')!;
    const board = afterOpening().cols, clear = lessonPlan().find((b) => b.name === 'clear')!;
    if (clear.act.kind !== 'drags') throw new Error('no drags');
    const g = new Distilling(() => 0.5, { timer: false }).lay(board.map((c) => [...c]));
    for (const d of clear.act.drags) { g.dragWays(d.x, d.y, d.ways); g.settle(1000); }
    for (const [x, y] of why.rings!) { expect(g.cols[x][y]).toBe(WHITE); expect(x).toBeLessThan(7); }
    // (a part's: each ring on the piece it followed)
    for (const p of playable()) {
      const pic = distillShows(p.shows.ref);
      if (!pic || !pic.drags.length || p.id === 'stepOne') continue;
      const t = new Distilling(() => 0.5, { timer: false }).lay(pic.cols.map((c) => [...c]));
      for (const d of pic.drags) { t.dragWays(d.x, d.y, d.ways); t.settle(1000); }
      const ends = follow(pic.cols, pic.drags, pic.drags.map((d) => [d.x, d.y]));
      pic.drags.forEach((d, i) => { const [x, y] = ends[i]; expect(t.cols[x][y], `${p.id}`).toBe(pic.cols[d.x][d.y]); });
      for (const [x, y] of ringedAfter(pic.cols, pic.drags, pic.rings.length ? pic.rings : pic.drags.map((d) => [d.x, d.y]))) expect([WHITE, BROWN, BLACK]).toContain(t.cols[x][y]);
    }
  });
});
