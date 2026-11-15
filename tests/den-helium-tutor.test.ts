/* Helium's lesson in the one tutorial shape (the user, 14 Nov: "Would you like me to start you [with] the basics? Would
   you like help with the early or mid game? Are you trying to get your CC higher?"; then pick a part and it's shown on
   a real board), quick to get into and every trick with its point (15 Nov): src/den-helium-tutor.ts,
   src/lines/helium.ts's TUTOR and POINT. */
import { describe, expect, it } from 'vitest';
import { DISTILL_TUTORIAL, learnBeats, noteFor, ringedAfter, tutorBeats } from '../src/den-helium-tutor';
import { distillShows } from '../src/distill-tutorial';
import { SECTIONS, TutorialMenu, openingOf, partsOf, problems } from '../src/tutorial';
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
  it('says once, beside it, that T shows something else; the button and the bar say T too', () => {
    expect(beats.filter((b) => b.says === TUTOR.else)).toHaveLength(1);
    expect(TUTOR.else).toMatch(/\bT\b/);
    expect(TUTOR.button).toMatch(/\(T\)$/);
    expect(TUTOR.barKey).toMatch(/^T: /);
    // (and only once step one's moved the board)
    expect(beats.findIndex((b) => b.says === TUTOR.else)).toBeGreaterThan(beats.findIndex((b) => b.act.kind === 'drags'));
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
