/* DRAFT, not wired yet: Distilling's tutorial described in the shape every tutorial shares (src/tutorial.ts,
   TUTORIALS.md). TypeScript, compiled to js/distill-tutorial.js; tested in tests/tutorial.test.ts. Written 14 Nov while
   Distilling's bots, tricks and guide were being reworked for the late game: finish it once that work's merged
   (TUTORIALS.md, "Distilling: what's left to wire"). Nothing in the den or on distilling-guide.html uses it yet.

   Drawn from what's there now, so it can't drift from them: the phases' names and plans from src/distill-phase.ts
   (PHASES), the guide's tricks and techniques under each phase from src/distill-guide.ts (PLAN, the page's order),
   the techniques' names from the routines, the drag tricks' from Helium's TEACH (src/lines/helium.ts), the scenarios
   from the positions the guide reads (READ_EXAMPLES, src/distill-read.ts's states and tactics). Each part's `shows`
   names one of the guide's own pictures (`distillShows` finds it), so the lesson would play the very board the read
   version draws. The end game (CC^10 and past it, the carry-on at CC^12, when to stop: DISTILLING.md §3, "The
   endgame's gamble") is a phase marked `todo`, for the late-game work to fill.

   Helium's lines for the opening choice (DRAFT_LINES) are drafts here, not in src/lines/helium.ts, so as not to touch
   that file while it's being changed; they move there (as `TUTOR`) when this is wired. */
import { PHASES, PHASE_ORDER } from './distill-phase.js';
import { PLAN, READ_EXAMPLES, firstLevel, phaseExamples, readingExamples, techniqueExamples, trickExamples, trickTiles } from './distill-guide.js';
import { ROUTINES } from './distill-routines.js';
import { PATH_LABEL, SWEEP_LABEL } from './distill-bots.js';
import { DRAG_TRICKS } from './distill-teach.js';
import { TEACH } from './lines/helium.js';
import { afterOpening } from './den-helium.js';
/** Helium's opening choice, in their voice (short, dry), after the user's own words: "Would you like me to start you
    [with] the basics? Would you like help with the early or mid game? Are you trying to get your CC higher?", the end
    game too. To move into src/lines/helium.ts when this is wired. */
export const DRAFT_LINES = {
    opening: 'Right. What are you after?',
    basics: { asks: 'The basics?', then: 'The basics, then. Pick one.' },
    early: { asks: 'Help with the early or mid game?', then: 'Early on, then. A board where it goes wrong, or one trick at a time?' },
    higher: { asks: 'Trying to get your CC higher?', then: 'Longer chains. That\'s banking, then the chain. Pick one.' },
    end: { asks: 'The end game?', then: 'The end game. A gamble, that. Pick one.' },
};
// ---------------------------------------------------------------- the basics
/** The rules in brief, and setting a target: the guide's first two sections. Shown on the lesson's own board. */
const BASICS = [
    { id: 'pieces', title: 'The pieces', line: 'Whites are the rum; browns and blacks are junk; spice never moves; a burnt white spoils its column.', shows: { kind: 'board', ref: 'lesson' }, anchor: 'b-pieces' },
    { id: 'swaps', title: 'The swap rule', line: 'Two touching bubbles swap only when the lower beats the upper, like rock, paper, scissors.', shows: { kind: 'board', ref: 'lesson' }, anchor: 'b-swaps' },
    { id: 'furnace', title: 'The furnace', line: 'Every few seconds the right-hand column leaves: down the furnace if it\'s more black than white, else up.', shows: { kind: 'board', ref: 'lesson' }, anchor: 'b-furnace' },
    { id: 'chains', title: 'Crystal Clears and chains', line: 'A column of only whites sent up is a Crystal Clear; one straight after another is a chain.', shows: { kind: 'board', ref: 'lesson' }, anchor: 'b-chains' },
    { id: 'target', title: 'A Crystal Clear to aim for', line: 'Pick the chain you\'re after first: it says how many whites to bank before you send them up.', shows: { kind: 'board', ref: 'lesson' }, anchor: 'target' },
    { id: 'goal', title: 'At Helium\'s still: a goal, and a plan for it', line: 'Clear the junk columns, bank the whites, build the Crystal Clear, send it up.', shows: { kind: 'moves', ref: 'phase:fire' }, anchor: 'goal' },
];
// ---------------------------------------------------------------- the phases
/** The guide's headings for the phases (distilling-guide.html), where they differ from PHASES' labels. */
const PHASE_TITLES = { fire: 'The fire\'s side', fill: 'Filling the junk columns', block: 'Blocks and the V', chain: 'The chain' };
const lineOf = (plan) => `${plan[0].toUpperCase()}${plan.slice(1)}.`;
const PHASE_PARTS = [
    ...PHASE_ORDER.map((p) => ({ id: p, title: PHASE_TITLES[p], line: lineOf(PHASES[p].plan), shows: { kind: p === 'fill' ? 'board' : 'moves', ref: `phase:${p}` }, anchor: `ph-${p}` })),
    {
        id: 'end', title: 'The end game', line: 'Past CC^10 each new column is a bet: ferry its whites over in time, or cash the chain in.',
        shows: { kind: 'moves', ref: 'phase:end' }, anchor: 'ph-end',
        todo: 'the late-game work: its phase in src/distill-phase.ts, its board, its tricks and the guide\'s section',
    },
];
// ---------------------------------------------------------------- the tricks
/** The user's tricks' headings on the guide, and each in a line. */
const TRICK_WORDS = {
    white: { title: 'Never a white down the fire', line: 'A white burned is lost, and every second one comes back burnt: played well, you never burn one.' },
    danger: { title: 'The danger low by the fire first', line: 'Whites low in the column next to burn, boxed in or behind a spice, are the hardest to reach: start there.' },
    edge: { title: 'Nothing walled in at the edges or by a spice', line: 'A white on an edge or beside a spice by the fire has few ways out: race junk into its place while you can.' },
    flick: { title: 'A brown a flick lower', line: 'Of two moves as good, take the one that leaves browns lower and blacks higher on the right.' },
    burnEarly: { title: 'Burn early only with the next columns clear', line: 'Burning early saves time, but only while the two columns after it are clear of white too.' },
    blocks: { title: 'Junk in blocks, into the V', line: 'Whites mostly left: big drags, each carried on till the junk joins the junk on its right.' },
    kept: { title: 'A brown kept bottom-left', line: 'Don\'t clear the left greedily: a brown bottom-left and a black top-left are tools for later.' },
    fluid: { title: 'One fluid motion, once the right side\'s sorted', line: 'A black from the far left down under the whites and up the browns till it joins the blacks: one drag.' },
    pair: { title: 'The pair rescue', line: 'A brown stuck at the top of a column going up: two pieces working together free it.' },
};
/** Each technique in a line, in the page's words (Helium's own on each are their HELP, src/lines/helium.ts). */
const TECHNIQUE_LINES = {
    rescue: 'A white by the fire dragged out left, up through blacks or down through browns.',
    sweep: 'Junk right and whites left in long plain drags: quick and dirty.',
    junkColumn: 'The right-hand column made all junk, so it burns clean.',
    diamond: 'Junk swept right and whites left in long drags round each other.',
    turnOver: 'The right side turned over like a pancake: the junk to the right, the whites out of it.',
    store: 'Blacks stored top-left and browns bottom-left, out of the way till later.',
    leapfrog: 'Black hops the brown, brown hops the white, along a stored row.',
    channel: 'A clear lane on the right for the whites: then it\'s Crystal Clear after Crystal Clear.',
    crawl: 'A piece walked across a swap at a time, when nothing faster reaches.',
    hook: 'A black and a brown together, round a corner.',
    figureEight: 'A pair looped up and down a nearly white board, and out the other side.',
    linePull: 'A line of browns pulled along by dragging one.',
    path: 'A piece brought round into a stuck one\'s place, another moved out of the way first if need be.',
};
const techniqueTitle = (t) => (t === 'sweep' ? SWEEP_LABEL : t === 'path' ? PATH_LABEL : ROUTINES[t].label);
/** The drag tricks (src/distill-teach.ts, DRAG_TRICKS), each the swap rule seen once, and making way: met any time. */
const DRAG_PARTS = [...DRAG_TRICKS, 'makeWay'].map((t) => ({
    id: t, title: TEACH[t].name, line: `${TEACH[t].how[0].toUpperCase()}${TEACH[t].how.slice(1)}.`, shows: { kind: 'moves', ref: `tile:${t}` }, anchor: `d-${t}`,
}));
/** The tricks shown by a burn, not a drag: a board to look at. */
const BURNS = ['white', 'burnEarly'];
const itemPart = (phase) => (it) => {
    const level = it.kind === 'technique' ? firstLevel(it.name)?.label : undefined;
    return it.kind === 'technique'
        ? { id: it.name, title: techniqueTitle(it.name), line: TECHNIQUE_LINES[it.name], shows: { kind: 'moves', ref: `technique:${it.name}` }, phase, anchor: `t-${it.name}`, ...(level ? { tag: level } : {}) }
        : { id: it.name, title: TRICK_WORDS[it.name].title, line: TRICK_WORDS[it.name].line, shows: { kind: BURNS.includes(it.name) ? 'board' : 'moves', ref: `trick:${it.name}` }, phase, anchor: `k-${it.name}` };
};
const TRICK_PARTS = [...DRAG_PARTS, ...PHASE_ORDER.flatMap((p) => PLAN[p].map(itemPart(p)))];
// ---------------------------------------------------------------- the scenarios
/** A board in trouble and what to do there: Helium's step one on their lesson board, and the positions the guide
    reads (READ_EXAMPLES), each with the state and tactic the planner reads on it (tested), and its phase. */
export const SCENARIO_READS = {
    P2: { state: 'atRisk', tactic: 'freeTrapped', phase: 'fire', title: 'Whites trapped by the fire', line: 'Whites walled in near the fire: free them first, the most at risk first.' },
    P8: { state: 'atRisk', tactic: 'sortLadder', phase: 'fill', title: 'The ladder about to be lost', line: 'The two right-hand columns unsorted with one about to burn: blacks over browns, now.' },
    P10: { state: 'cracked', tactic: 'fixCracks', phase: 'block', title: 'A cracked board', line: 'Junk stranded among the whites: stop filling and fix the cracks, the browns kept as tools.' },
    P7: { state: 'damageControl', tactic: 'fillGaps', phase: 'fire', title: 'Damage control', line: 'Too many whites by the fire for the time left: fill the gaps however you can, the quickest first.' },
    P27: { state: 'damageControl', tactic: 'fillGaps', phase: 'fire', title: 'Damage control, and the hoist', line: 'Browns sunk through blacks, lifting them, where a brown swept off to the top right would split them.' },
};
const SCENARIO_PARTS = [
    { id: 'stepOne', title: 'Helium\'s step one', line: 'Their lesson\'s board: every white out of the three columns by the fire, walked out swap by swap.', shows: { kind: 'moves', ref: 'phase:fire' }, phase: 'fire', anchor: 'p-fire' },
    ...READ_EXAMPLES.map((id) => ({ id: id.toLowerCase(), title: SCENARIO_READS[id].title, line: SCENARIO_READS[id].line, shows: { kind: 'moves', ref: `reading:${id}` }, phase: SCENARIO_READS[id].phase, anchor: `r-${id.toLowerCase()}` })),
    {
        id: 'gamble', title: 'Chase it, or cash in?', line: 'Eight whites banked on the right, two in the new column: risk a burn for a longer chain?',
        shows: { kind: 'moves', ref: 'scenario:gamble' }, phase: 'end', anchor: 's-gamble', todo: 'a board from the late-game bots, and what they do there',
    },
];
// ---------------------------------------------------------------- the opening choice
const L = DRAFT_LINES;
const CHOICES = [
    { id: 'basics', label: 'The basics', ...L.basics, covers: ['basics', ...DRAG_PARTS.map((p) => p.id)] },
    { id: 'early', label: 'The early or mid game', ...L.early, covers: ['fire', 'fill', 'block'] },
    // (banking whites for it, storing the junk out of their way, then the chain and its longer techniques)
    { id: 'higher', label: 'A higher Crystal Clear', ...L.higher, covers: ['target', 'store', 'leapfrog', 'chain'] },
    { id: 'end', label: 'The end game', ...L.end, covers: ['end'] },
];
/** Distilling's tutorial, the draft (see the top of this file). */
export const DISTILL_TUTORIAL = {
    puzzle: 'Distilling', teacher: 'Helium',
    basics: BASICS, phases: PHASE_PARTS, tricks: TRICK_PARTS, scenarios: SCENARIO_PARTS, choices: CHOICES,
    hello: L.opening,
    anchors: { basics: 'rules', phases: 'phases', tricks: 'tricks', scenarios: 'reading' },
};
/** Places on distilling-guide.html the parts link to that aren't there yet: ids to give the rules' four articles, and
    the trick tiles (js/distill-guide-view.js draws them; an id each, `d-<trick>`). Part of the wiring; the test lets
    these through and no others. */
export const ANCHORS_TO_ADD = ['b-pieces', 'b-swaps', 'b-furnace', 'b-chains', ...DRAG_PARTS.map((p) => p.anchor)];
// ---------------------------------------------------------------- what shows each part
/** What a part's `shows` names, found: the guide's own picture of it (its board, its drags), so the lesson plays the
    board the read version draws. null if there's none (the test fails). Each kind worked out once, when first asked
    for (the guide's examples take a moment). */
const once = (f) => { let v; return () => (v ??= f()); };
const KINDS = {
    phase: once(() => { const xs = phaseExamples(); return (k) => xs.find((x) => x.phase === k)?.picture; }),
    technique: once(() => { const xs = techniqueExamples(); return (k) => xs.find((x) => x.name === k)?.picture; }),
    trick: once(() => { const xs = trickExamples(); return (k) => xs.find((x) => x.trick === k)?.picture; }),
    tile: once(() => { const xs = trickTiles(); return (k) => xs.find((x) => x.trick === k)?.picture; }),
    reading: once(() => { const xs = readingExamples(); return (k) => xs.find((x) => x.id === k)?.picture; }),
};
export function distillShows(ref) {
    if (ref === 'lesson')
        return { cols: afterOpening().cols, drags: [], rings: [], shade: [], from: 'Helium\'s lesson board' };
    const [kind, key] = ref.split(':');
    return KINDS[kind]?.()(key) ?? null;
}
