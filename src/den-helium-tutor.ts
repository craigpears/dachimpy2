/* Pirate Den: Helium's lesson in the one tutorial shape (TUTORIALS.md §3; RULES.md, "Every tutorial has the same shape,
   and you can jump in anywhere", 14 Nov). TypeScript, compiled to js/den-helium-tutor.js; tested in
   tests/den-helium-tutor.test.ts. js/den/helium-isle.js puts their opening choice to you after their opening (and on T
   at the still) with js/tutorial-choice.js, from Distilling's description (src/distill-tutorial.ts); what you pick
   comes here and is turned into their lesson's beats (src/den-helium.ts's Beat), played on a real board at
   PACE_LESSON as their step one is: the part's board laid (the read guide's own picture of it, `distillShows`), their
   line, its drags played (or its column burned), then the still's yours. Step one is the scenario `stepOne`: their
   lesson as it was, on the board their opening leaves (lessonPlan). Kept apart from src/den-helium.ts, which the
   description's pictures are drawn from. */

import { COLS, WHITE, BURNT, goesUp, type Board } from './distilling.js';
import { afterOpening, lessonPlan, type Beat } from './den-helium.js';
import { DISTILL_TUTORIAL, distillShows } from './distill-tutorial.js';
import { findPart, ready, type Part } from './tutorial.js';
import { TUTOR } from './lines/helium.js';

export { DISTILL_TUTORIAL };

const copy = (b: Board): Board => b.map((c) => [...c]);
/** Their line as a part's board is laid: its name in it. */
export const showLine = (part: Part): string => TUTOR.show.replace('{title}', part.title);

/** A part of Distilling's tutorial as their lesson's beats, on a board of its own: laid, their line (the part's own
    line in the bar), the pieces it's about ringed; its drags played, or its column burned (a white in it, and the
    still goes bang); then their line handing you the still. Step one is their lesson's own (lessonPlan). Empty if
    the part isn't there or isn't ready, or nothing shows it. */
export function tutorBeats(part: Part): Beat[] {
  if (!ready(part)) return [];
  const after: Beat = { name: 'after', says: TUTOR.after, note: TUTOR.afterNote, act: { kind: 'none' } };
  if (part.id === 'stepOne') {
    const g = afterOpening();
    return [{ name: 'lay', says: '', note: part.line, act: { kind: 'lay', cols: copy(g.cols) } }, ...lessonPlan(g)];
  }
  const pic = distillShows(part.shows.ref);
  if (!pic) return [];
  const rings = pic.rings.map(([x, y]) => [x, y] as [number, number]);
  const beats: Beat[] = [{ name: 'lay', says: showLine(part), note: part.line, act: { kind: 'lay', cols: copy(pic.cols) }, rings }];
  if (pic.drags.length) beats.push({ name: 'moves', says: '', note: part.line, act: { kind: 'drags', drags: pic.drags.map((d) => ({ x: d.x, y: d.y, ways: [...d.ways] })) }, rings });
  if (pic.burn) {
    // (the column as it'll be once the drags are played: the read guide's burns have none before them)
    const last = pic.cols[COLS - 1], white = last.some((p) => p === WHITE || p === BURNT) && !goesUp(last);
    beats.push({ name: 'burn', says: '', note: part.line, act: { kind: 'burn' }, rings, ...(white ? { mishap: true } : {}) });
  }
  return [...beats, after];
}

/** A part by its id (a "show me this" link's `learn=`), as beats; empty if there's no such part ready. */
export function learnBeats(id: string): Beat[] {
  const f = findPart(DISTILL_TUTORIAL, id);
  return f ? tutorBeats(f.part) : [];
}
