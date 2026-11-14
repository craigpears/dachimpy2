/* Helium's lesson opening with the one tutorial shape's choice (the user, 14 Nov: "Would you like me to start you
   [with] the basics? Would you like help with the early or mid game? Are you trying to get your CC higher?"; then pick
   a part and it's shown on a real board): src/den-helium-tutor.ts, src/lines/helium.ts's TUTOR. */
import { describe, expect, it } from 'vitest';
import { DISTILL_TUTORIAL, learnBeats, showLine, tutorBeats } from '../src/den-helium-tutor';
import { SECTIONS, TutorialMenu, openingOf, partsOf } from '../src/tutorial';
import { Distilling } from '../src/distilling';
import { TUTOR } from '../src/lines/helium';
import { afterOpening, lessonPlan } from '../src/den-helium';

describe('Helium asks what you\'re after before their lesson, in their own lines (14 Nov)', () => {
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

  it('every part they can show plays on its own board: laid, their line, every drag played whole, then the still yours', () => {
    for (const s of SECTIONS) for (const p of partsOf(DISTILL_TUTORIAL, s)) {
      const beats = tutorBeats(p);
      expect(beats.length, p.id).toBeGreaterThan(1);
      const lay = beats[0].act;
      expect(lay.kind, p.id).toBe('lay');
      if (lay.kind !== 'lay') continue;
      if (p.id !== 'stepOne') {
        expect(beats[0].says).toBe(showLine(p));
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
