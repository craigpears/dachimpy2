/* The wolf den's tutorial (four-tier Duty Navigation, Multibella teaching it at the star table in her hut, on her island), described in
   the shape every tutorial shares (src/tutorial.ts, TUTORIALS.md). TypeScript, compiled to js/wolf-den-tutorial.js;
   tested in tests/den-wolfden.test.ts. A first version (14 Nov): js/den/wolfden-house.js opens Multibella's lesson with its
   choice (js/tutorial-choice.js), and what's picked is laid and played on one of the lesson's boards
   (src/den-wolfden.ts's BOARDS); wolf-den-guide.html, its read version, draws the same boards
   (js/wolf-den-guide-view.js), its sticky nav from this.

   Unlike the other tutorials it teaches the mechanics too, since a wolf den's Navigation isn't plain Duty Navigation:
   how it works and how it differs (the user, 14 Nov; TUTORIALS.md §5). Its words from the Wolf Dens Guide and
   Multibella's telling of the wilds (IDEAS.md); Multibella's lines are src/lines/multibella.ts's TUTOR. */
import { BOARDS, type Laid } from './den-wolfden.js';
import { TUTOR } from './lines/multibella.js';
import type { Part, Tutorial } from './tutorial.js';

const board = (ref: string) => ({ kind: 'board' as const, ref });
const moves = (ref: string) => ({ kind: 'moves' as const, ref });

const BASICS: readonly Part[] = [
  { id: 'rings', title: 'Four rings', line: 'Four-tier: a fourth, outer ring with no places of its own, room to park stars and set up chains.', shows: board('rings') },
  { id: 'constellations', title: 'The den\'s constellations', line: 'Three places in the centre ring, two in the middle, one in the third; a fresh board\'s first only three and one.', shows: board('rings') },
  { id: 'chains', title: 'Why chains pay', line: 'A constellation\'s points are times its step in the move: after one clear, double; after two, triple. Lines alone score next to nothing.', shows: moves('run') },
  { id: 'wilds', title: 'Wild places', line: 'Places ringed in every colour take any star. A chart in a chain makes the next one\'s centre wild; a combo\'s clear makes the places beside it wild.', shows: moves('run') },
  { id: 'moon', title: 'The moon', line: 'Every constellation charted takes its points off the moon; as it wanes, the werewolves turn back to wolf-kin.', shows: board('rings') },
];

const PHASES: readonly Part[] = [
  { id: 'window', title: 'Between the rumbles', line: 'The puzzle window: chart all you can before the next pack comes, each chart in a chain if you can.', shows: board('rings') },
  { id: 'rumble', title: 'The rumbles', line: 'Each round a Rumble against the pack first, then the stations.', shows: board('rings'), todo: 'the rumbles themselves, not in the den yet' },
];

const TRICKS: readonly Part[] = [
  { id: 'trapdoor', title: 'The Trapdoor', line: 'Clear, then chart: a line goes, and the star parked above it falls into the place. The chart\'s points doubled.', shows: moves('trapdoor'), phase: 'window', tag: 'x2' },
  { id: 'echo', title: 'The Echo', line: 'Chart, then clear: the stars falling into the places it leaves make a line. The next constellation\'s centre goes wild.', shows: moves('echo'), phase: 'window' },
  { id: 'beside', title: 'A combo beside the wrong star', line: 'A combo\'s clear beside a place holding the wrong colour turns it wild, and the star already in it counts.', shows: moves('run'), phase: 'window' },
  { id: 'noReset', title: 'Don\'t reset the board', line: 'A fresh board\'s first constellation is worth only 71: keep the board going instead.', shows: board('rings'), phase: 'window' },
];

const SCENARIOS: readonly Part[] = [
  { id: 'run', title: 'Single, Double, Triple Constellation', line: 'A red\'s line round the third ring, an orange\'s down its spoke beside a blue in a yellow place, and the constellation charted third.', shows: moves('run'), phase: 'window', tag: 'x3' },
];

export const WOLF_DEN_TUTORIAL: Tutorial = {
  puzzle: 'Duty Navigation in a wolf den', teacher: 'Multibella',
  basics: BASICS, phases: PHASES, tricks: TRICKS, scenarios: SCENARIOS,
  hello: TUTOR.hello,
  choices: [
    { id: 'basics', label: 'What\'s different', asks: TUTOR.basics.asks, then: TUTOR.basics.then, covers: ['basics'] },
    { id: 'tricks', label: 'The chains', asks: TUTOR.tricks.asks, then: TUTOR.tricks.then, covers: ['tricks'] },
    { id: 'run', label: 'A run', asks: TUTOR.run.asks, then: TUTOR.run.then, covers: ['scenarios'] },
  ],
};

/** The lesson's board a part's `shows.ref` names (its kind, a board to look at or moves to watch, is the part's). */
export const wolfShows = (ref: string): Laid | null => BOARDS[ref] ?? null;
