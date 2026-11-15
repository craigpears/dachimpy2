/* Pirate Den: Helium's lesson in the one tutorial shape (TUTORIALS.md §3; RULES.md, "Every tutorial has the same shape,
   and you can jump in anywhere", 14 Nov, and "The lesson is the quick way in", 15 Nov). TypeScript, compiled to
   js/den-helium-tutor.js; tested in tests/den-helium-tutor.test.ts. Their lesson starts showing straight after their
   opening (step one, no question first); js/den/helium-isle.js puts the choice of what else to see beside it, on T or
   its button, during the lesson and at the still, with js/tutorial-choice.js, from Distilling's description
   (src/distill-tutorial.ts). What you pick comes here and is turned into their lesson's beats (src/den-helium.ts's
   Beat), played on a real board at PACE_LESSON as their step one is: the part's board laid (the read guide's own
   picture of it, `distillShows`) and what's wrong or wanted on it, its drags played (or its column burned), what they
   did, then the still's yours. Step one is the scenario `stepOne`: their lesson as it was, on the board their opening
   leaves (lessonPlan). Kept apart from src/den-helium.ts, which the description's pictures are drawn from. */
import { COLS, WHITE, BURNT, goesUp } from './distilling.js';
import { afterOpening, follow, lessonPlan } from './den-helium.js';
import { DISTILL_TUTORIAL, distillShows } from './distill-tutorial.js';
import { findPart, ready } from './tutorial.js';
import { TUTOR } from './lines/helium.js';
export { DISTILL_TUTORIAL };
const copy = (b) => b.map((c) => [...c]);
/** The bar under a part as it plays: its name and what it is. */
export const noteFor = (part) => `${part.title}: ${part.line}`;
/** A part of Distilling's tutorial as their lesson's beats, on a board of its own, three beats in their voice (RULES.md,
    "Every trick shown says what it's for", 15 Nov; the user: "It just kind of jumped into it without any context of
    what it was doing, what it was achieving, what the point was"): the board laid, and what's wrong or wanted on it
    (its point's `before`), the pieces it's about ringed (the picture's rings, else the pieces about to be dragged);
    the move, its drags played at PACE_LESSON, or its column burned (a white in it, and the still goes bang); then
    what it did (`after`), the same pieces ringed again where the move left them (and the dragged ones where they
    went). Then their line handing you the still. Step one is their lesson's own (lessonPlan), its point theirs.
    Empty if the part isn't there or isn't ready, or nothing shows it. */
export function tutorBeats(part) {
    if (!ready(part))
        return [];
    const handOver = { name: 'after', says: TUTOR.after, note: TUTOR.afterNote, act: { kind: 'none' } };
    if (part.id === 'stepOne') {
        const g = afterOpening();
        return [{ name: 'lay', says: '', note: part.line, act: { kind: 'lay', cols: copy(g.cols) } }, ...lessonPlan(g)];
    }
    const pic = distillShows(part.shows.ref);
    if (!pic || !part.point)
        return [];
    const note = noteFor(part), drags = pic.drags.map((d) => ({ x: d.x, y: d.y, ways: [...d.ways] }));
    const at = (pic.rings.length ? pic.rings : drags.map((d) => [d.x, d.y])).map(([x, y]) => [x, y]);
    const beats = [{ name: 'before', says: part.point.before, note, act: { kind: 'lay', cols: copy(pic.cols) }, rings: at }];
    if (drags.length)
        beats.push({ name: 'moves', says: '', note, act: { kind: 'drags', drags } });
    if (pic.burn) {
        // (the column as it'll be once the drags are played: the read guide's burns have none before them)
        const last = pic.cols[COLS - 1], white = last.some((p) => p === WHITE || p === BURNT) && !goesUp(last);
        beats.push({ name: 'burn', says: '', note, act: { kind: 'burn' }, ...(white ? { mishap: true } : {}) });
    }
    // (a board with no move, its pieces ringed still; a burn's gone into the furnace, nothing)
    const after = drags.length ? ringedAfter(pic.cols, drags, at) : pic.burn ? [] : at;
    beats.push({ name: 'point', says: part.point.after, note, act: { kind: 'none' }, ...(after.length ? { rings: after } : {}) });
    return [...beats, handOver];
}
/** The pieces a part's about, where its drags leave them: those that moved, and every dragged piece where it went. */
export function ringedAfter(cols, drags, at) {
    const moved = follow(cols, drags, at).filter(([x, y], i) => x !== at[i][0] || y !== at[i][1]);
    const ends = follow(cols, drags, drags.map((d) => [d.x, d.y]));
    const out = [];
    for (const [x, y] of [...moved, ...ends])
        if (!out.some(([a, b]) => a === x && b === y))
            out.push([x, y]);
    return out;
}
/** A part by its id (a "show me this" link's `learn=`), as beats; empty if there's no such part ready. */
export function learnBeats(id) {
    const f = findPart(DISTILL_TUTORIAL, id);
    return f ? tutorBeats(f.part) : [];
}
