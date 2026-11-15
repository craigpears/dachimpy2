/* The wolf den's tutorial (four-tier Duty Navigation, Multibella teaching it at the star table in her hut, on her island), described in
   the shape every tutorial shares (src/tutorial.ts, TUTORIALS.md). TypeScript, compiled to js/wolf-den-tutorial.js;
   tested in tests/den-wolfden.test.ts. js/den/wolfden-house.js opens Multibella's lesson with its choice
   (js/tutorial-choice.js), and what's picked is laid and played on one of the lesson's boards (src/den-wolfden.ts's
   BOARDS), her words as it plays from src/lines/multibella.ts's LESSON; wolf-den-guide.html, its read version, draws
   the same boards (js/wolf-den-guide-view.js), her words beside them, its sticky nav from this.

   Unlike the other tutorials it teaches the mechanics too, since a wolf den's Navigation isn't plain Duty Navigation:
   how it works and how it differs (the user, 14 Nov; TUTORIALS.md §5). A first version 14 Nov; 15 Nov, after the user
   played it, the deeper mechanics as steps of her lesson, each on a real board (MECHANICS): a cascade and the wild
   slots it makes, the outer ring where stars wait, a constellation charted by a cascade's last clear, and Umami's evil
   constellation. Its words from the Wolf Dens Guide and Multibella's telling of the wilds (IDEAS.md); Multibella's
   lines are src/lines/multibella.ts's TUTOR and LESSON. */
import { BOARDS, type Laid } from './den-wolfden.js';
import { TUTOR } from './lines/multibella.js';
import { findPart, type Part, type Tutorial } from './tutorial.js';

const board = (ref: string) => ({ kind: 'board' as const, ref });
const moves = (ref: string) => ({ kind: 'moves' as const, ref });

const BASICS: readonly Part[] = [
  { id: 'cascade', title: 'Cascades', line: 'A clear whose falling stars make another clear, and another, in the one move: Single, Double, Triple. And each clear in a combo turns the slots beside it wild.', shows: moves('cascade') },
  { id: 'rings', title: 'Four rings', line: 'Four-tier: a fourth, outer ring with no slots of its own, where stars wait over a full spoke, turning with their ring, to drop in when a clear opens under them.', shows: moves('outer') },
  { id: 'constellations', title: 'The den\'s constellations', line: 'Three slots in the centre ring, two in the middle, one in the third; a fresh board\'s first only three and one.', shows: board('rings') },
  { id: 'chains', title: 'Why chains pay', line: 'A constellation\'s points are times its step in the move: charted by a cascade\'s third clear, triple. Lines alone score next to nothing.', shows: moves('lastClear') },
  { id: 'wilds', title: 'Wild slots', line: 'Slots ringed in every colour take any star. A chart in a chain makes the next one\'s centre wild; a combo\'s clear makes the slots on and beside it wild.', shows: moves('cascade') },
  { id: 'moon', title: 'The moon', line: 'Every constellation charted takes its points off the moon; as it wanes, the werewolves turn back to wolf-kin.', shows: board('rings') },
];

const PHASES: readonly Part[] = [
  { id: 'window', title: 'Between the rumbles', line: 'The puzzle window: chart all you can before the next pack comes, each chart in a chain if you can.', shows: board('rings') },
  { id: 'rumble', title: 'The rumbles', line: 'Each round a Rumble against the pack first, then the stations.', shows: board('rings'), todo: 'the rumbles themselves, not in the den yet' },
];

const TRICKS: readonly Part[] = [
  { id: 'trapdoor', title: 'The Trapdoor', line: 'Clear, then chart: a line goes, and the star parked above it falls into the slot. The chart\'s points doubled.', shows: moves('trapdoor'), phase: 'window', tag: 'x2' },
  { id: 'echo', title: 'The Echo', line: 'Chart, then clear: the stars falling into the slots it leaves make a line. The next constellation\'s centre goes wild.', shows: moves('echo'), phase: 'window' },
  { id: 'beside', title: 'A combo beside the wrong star', line: 'A combo\'s clear beside a slot holding the wrong colour turns it wild, and the star already in it counts.', shows: moves('run'), phase: 'window' },
  { id: 'noReset', title: 'Don\'t reset the board', line: 'A fresh board\'s first constellation is worth only 71: keep the board going instead.', shows: board('rings'), phase: 'window' },
];

const SCENARIOS: readonly Part[] = [
  { id: 'run', title: 'Single, Double, Triple Constellation', line: 'A red\'s line round the third ring, an orange\'s down its spoke beside a blue in a yellow slot, and the constellation charted third.', shows: moves('run'), phase: 'window', tag: 'x3' },
  { id: 'evil', title: 'Umami\'s evil constellation', line: 'Six reds side by side round the centre, made with Umami in mind: a star at a time, three always line up first, so it only goes in a combo, two reds dropping in at once.', shows: moves('evilTry'), phase: 'window', tag: 'x2' },
];

/** The steps of how it all works, in the order she shows them, each on a board of its own (the user, 15 Nov, after
    playing the basics: the cascade and its wild slots, a constellation and the new ring, filling it with a cascade's
    last clear, and Umami's evil constellation). */
export const MECHANICS: readonly string[] = ['cascade', 'rings', 'chains', 'evil'];

export const WOLF_DEN_TUTORIAL: Tutorial = {
  puzzle: 'Duty Navigation in a wolf den', teacher: 'Multibella',
  basics: BASICS, phases: PHASES, tricks: TRICKS, scenarios: SCENARIOS,
  hello: TUTOR.hello,
  choices: [
    { id: 'basics', label: 'What\'s different', asks: TUTOR.basics.asks, then: TUTOR.basics.then, covers: ['basics'] },
    { id: 'mechanics', label: 'How it works', asks: TUTOR.mechanics.asks, then: TUTOR.mechanics.then, covers: MECHANICS },
    { id: 'tricks', label: 'The chains', asks: TUTOR.tricks.asks, then: TUTOR.tricks.then, covers: ['tricks'] },
    { id: 'run', label: 'A run', asks: TUTOR.run.asks, then: TUTOR.run.then, covers: ['scenarios'] },
  ],
};

/** The lesson's board a part's `shows.ref` names (its kind, a board to look at or moves to watch, is the part's). */
export const wolfShows = (ref: string): Laid | null => BOARDS[ref] ?? null;
/** After a step of how it works, the next step's part (null after the last, or for a part that isn't a step). */
export function nextStep(id: string): Part | null {
  const i = MECHANICS.indexOf(id);
  return i >= 0 && i + 1 < MECHANICS.length ? findPart(WOLF_DEN_TUTORIAL, MECHANICS[i + 1])?.part ?? null : null;
}
