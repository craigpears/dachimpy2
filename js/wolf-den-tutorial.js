/* The wolf den's tutorial (four-tier Duty Navigation, Multibella teaching it at the star table in her hut, on her island), described in
   the shape every tutorial shares (src/tutorial.ts, TUTORIALS.md). TypeScript, compiled to js/wolf-den-tutorial.js;
   tested in tests/den-wolfden.test.ts. js/den/wolfden-house.js opens Multibella's lesson with its choice
   (js/tutorial-choice.js), and what's picked is laid and played on one of the lesson's boards (src/den-wolfden.ts's
   BOARDS), her words as it plays from src/lines/multibella.ts's LESSON; wolf-den-guide.html, its read version, draws
   the same boards (js/wolf-den-guide-view.js), her words beside them, its sticky nav from this.

   Unlike the other tutorials it teaches the mechanics too, since a wolf den's Navigation isn't plain Duty Navigation:
   how it works and how it differs (the user, 14 Nov; TUTORIALS.md §5). A first version 14 Nov; 15 Nov, after the user
   played it, the deeper mechanics on real boards: a cascade and the wild slots it makes, the outer ring where stars
   wait, a constellation charted by a cascade's last clear, and Umami's evil constellation (a fun one). Then, the same
   day, "How it works" as the user meant it: Umami's run from his replay (notes/wolf-den/), walked through a beat at a
   time on one real board, Space for each (WALK, MECHANICS). 20 Nov, speed nav: the quick double, the user's own
   (WALKS.quick), walked the same way. Its words from the Wolf Dens Guide and Multibella's telling of the wilds (IDEAS.md); Multibella's
   lines are src/lines/multibella.ts's TUTOR and LESSON. */
import { BOARDS } from './den-wolfden.js';
import { TUTOR } from './lines/multibella.js';
import { findPart } from './tutorial.js';
const board = (ref) => ({ kind: 'board', ref });
const moves = (ref) => ({ kind: 'moves', ref });
export const WALKS = {
    mechanics: {
        board: 'replay',
        steps: { single: ['set', 'step1'], double: ['step2', 'wild'], triple: ['step3', 'chart', 'deal', 'end'] },
        done: TUTOR.walked,
    },
    quick: {
        board: 'quick',
        steps: { quickDouble: ['set', 'move1', 'move2', 'move3', 'move4', 'move5', 'step1', 'step2', 'chart', 'end'] },
        done: TUTOR.quickWalked,
    },
};
export const WALK_BOARD = WALKS.mechanics.board;
export const WALK = WALKS.mechanics.steps;
/** The steps of how it works, in order. */
export const MECHANICS = Object.keys(WALK);
/** The steps of speed nav's quick double, in order. */
export const QUICK = Object.keys(WALKS.quick.steps);
/** The walk a part's a step of: the walk's name (its choice's id), and where in it the step is. Null for a part that
    isn't a step of one. */
export function walkOf(partId) {
    for (const [id, walk] of Object.entries(WALKS)) {
        const at = Object.keys(walk.steps).indexOf(partId);
        if (at >= 0)
            return { id, walk, at };
    }
    return null;
}
/** The step of a walk (how it works, unless named) a cue's said in (null for none). */
export const walkStepOf = (cue, walk = 'mechanics') => {
    const steps = WALKS[walk]?.steps ?? {};
    return Object.keys(steps).find((id) => steps[id].includes(cue)) ?? null;
};
/** Where in its walk the step a cue's said in is (-1 for none). */
export const walkAt = (cue, walk = 'mechanics') => Object.keys(WALKS[walk]?.steps ?? {}).indexOf(walkStepOf(cue, walk) ?? '');
/** Is this cue the last of its step's (the walk goes on to the next step after it)? */
export const endsStep = (cue, walk = 'mechanics') => {
    const id = walkStepOf(cue, walk), cues = id ? WALKS[walk].steps[id] : [];
    return cues[cues.length - 1] === cue;
};
const BASICS = [
    { id: 'single', title: 'Single! +3', line: 'Umami\'s run, from his replay: three targets filled, a blue in the orange one. One white dropped makes three round the centre: a line, a point a star.', shows: moves(WALK_BOARD) },
    { id: 'double', title: 'Double! +6: a wild target', line: 'The red above falls in beside two reds: a line in a combo. Its clear turns the target beside it every colour, wild, and the blue in it counts.', shows: moves(WALK_BOARD) },
    { id: 'triple', title: 'Triple! Constellation! +213', line: 'Every target filled on the third step: 71 times three. And the next one comes up with four wild targets in the centre.', shows: moves(WALK_BOARD), tag: 'x3' },
    { id: 'cascade', title: 'Cascades', line: 'A clear whose falling stars make another clear, and another, in the one move: Single, Double, Triple. And each clear in a combo turns the slots beside it wild.', shows: moves('cascade') },
    { id: 'rings', title: 'Four rings', line: 'Four-tier: a fourth, outer ring with no slots of its own, where stars wait over a full spoke, turning with their ring, to drop in when a clear opens under them.', shows: moves('outer') },
    { id: 'constellations', title: 'The den\'s constellations', line: 'Three slots in the centre ring, two in the middle, one in the third; a fresh board\'s first only three and one.', shows: board('rings') },
    { id: 'chains', title: 'Why chains pay', line: 'A constellation\'s points are times its step in the move: charted by a cascade\'s third clear, triple. Lines alone score next to nothing.', shows: moves('lastClear') },
    { id: 'wilds', title: 'Wild targets', line: 'Slots ringed in every colour take any star. A chart in a chain makes the next one\'s centre wild; a combo\'s clear makes the slots on and beside it wild.', shows: moves('cascade') },
    { id: 'moon', title: 'The moon', line: 'Every constellation charted takes its points off the moon; as it wanes, the werewolves turn back to wolf-kin.', shows: board('rings') },
];
const PHASES = [
    { id: 'window', title: 'Between the rumbles', line: 'The puzzle window: chart all you can before the next pack comes, each chart in a chain if you can.', shows: board('rings') },
    { id: 'rumble', title: 'The rumbles', line: 'Each round a Rumble against the pack first, then the stations.', shows: board('rings'), todo: 'the rumbles themselves, not in the den yet' },
];
const TRICKS = [
    { id: 'quickDouble', title: 'Speed nav: the quick double', line: 'A shape you can build every time, quick: a pair on the third ring, the gap beside it over the target; the two you need parked on the outer ring, in order; one spin, and it\'s a Single, then a Double.', shows: moves(WALKS.quick.board), phase: 'window', tag: 'x2' },
    { id: 'trapdoor', title: 'The Trapdoor', line: 'Clear, then chart: a line goes, and the star parked above it falls into the slot. The chart\'s points doubled.', shows: moves('trapdoor'), phase: 'window', tag: 'x2' },
    { id: 'echo', title: 'The Echo', line: 'Chart, then clear: the stars falling into the slots it leaves make a line. The next constellation\'s centre goes wild.', shows: moves('echo'), phase: 'window' },
    { id: 'beside', title: 'A combo beside the wrong star', line: 'A combo\'s clear beside a slot holding the wrong colour turns it wild, and the star already in it counts.', shows: moves(WALK_BOARD), phase: 'window' },
    { id: 'noReset', title: 'Don\'t reset the board', line: 'A fresh board\'s first constellation is worth only 71: keep the board going instead.', shows: board('rings'), phase: 'window' },
];
const SCENARIOS = [
    { id: 'evil', title: 'Umami\'s evil constellation', line: 'A fun one, made with Umami in mind: six reds side by side round the centre. A star at a time, three always line up first, so it only goes in a combo, two reds dropping in at once.', shows: moves('evilTry'), phase: 'window', tag: 'for fun' },
];
export const WOLF_DEN_TUTORIAL = {
    puzzle: 'Duty Navigation in a wolf den', teacher: 'Multibella',
    basics: BASICS, phases: PHASES, tricks: TRICKS, scenarios: SCENARIOS,
    hello: TUTOR.hello,
    choices: [
        { id: 'mechanics', label: 'How it works: Umami\'s run', asks: TUTOR.mechanics.asks, then: TUTOR.mechanics.then, covers: MECHANICS },
        { id: 'quick', label: 'Speed nav: the quick double', asks: TUTOR.quick.asks, then: TUTOR.quick.then, covers: QUICK },
        { id: 'basics', label: 'What\'s different', asks: TUTOR.basics.asks, then: TUTOR.basics.then, covers: BASICS.map((p) => p.id).filter((id) => !MECHANICS.includes(id)) },
        { id: 'tricks', label: 'The chains', asks: TUTOR.tricks.asks, then: TUTOR.tricks.then, covers: TRICKS.map((p) => p.id).filter((id) => !QUICK.includes(id)) },
        { id: 'fun', label: 'A fun one', asks: TUTOR.fun.asks, then: TUTOR.fun.then, covers: ['scenarios'] },
    ],
};
/** The lesson's board a part's `shows.ref` names (its kind, a board to look at or moves to watch, is the part's). */
export const wolfShows = (ref) => BOARDS[ref] ?? null;
/** After a step of a walk, the next step's part (null after the last, or for a part that isn't a step): what Next
    says it's going on to. */
export function nextStep(id) {
    const w = walkOf(id), steps = w ? Object.keys(w.walk.steps) : [];
    return w && w.at + 1 < steps.length ? findPart(WOLF_DEN_TUTORIAL, steps[w.at + 1])?.part ?? null : null;
}
