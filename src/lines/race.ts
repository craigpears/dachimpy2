/* Pirate Den: the race's starter (src/lines/character.ts says how these files go), at the buoy off the
   sloop race's gate, out past Primates Rule (src/den-race.ts; js/den/race.js says these). Nameless for
   now, as the rival is: a real pirate needs the user's pick, and their portrait checked. */
import type { Character } from './character.js';

/** What the starter calls out. `{time}` is a time, as the clock shows it. */
export const STARTER = {
  /** Sailing up to the buoy, the first time a voyage. */
  hail: 'A race round the course? Five legs out and back behind them rocks, and the trade wind home. Space when ye\'re ready',
  /** By the buoy again, after a race. */
  again: 'Another go? Space when ye\'re ready',
  /** The count, then the gun. */
  count: ['Three...', 'Two...', 'One...'],
  go: 'Go!',
  /** The other sloop's home. */
  rival: 'The other sloop\'s home: {time}',
  /** Home: first, or not; and a best. */
  won: 'Home first! {time}',
  lost: 'Home in {time}. Beaten to it, this time',
  best: 'Yer best yet: {time}',
  /** Sailed back out through the gate mid-race. */
  quit: 'Out the gate? That race is off, then',
} as const;

export const CHARACTER: Character = {
  name: 'The race\'s starter',
  who: 'Whoever keeps the buoy off the sloop race\'s gate, out past Primates Rule: counts you down, fires '
    + 'the gun, and calls the times at the finish. Nameless for now, as the rival sloop is: a real pirate '
    + 'needs the user\'s pick.\n\n'
    + 'Never says how to get round quicker: the shortcuts are yours to find (RULES.md, "Hidden gems, never hinted").',
  theUser: [
    { on: '11 Nov', said: 'a winding, snakes and ladders, zigzagging kind of course, just with a lot of shortcuts, and each shortcut is a different puzzle' },
    { on: '11 Nov', said: 'Obviously, this will be out near where Primates Rule is, I guess ... We\'re going to have to go through several iterations of this course.' },
  ],
  lines: [
    {
      when: 'At the buoy, and the race', says: STARTER,
      each: {
        hail: 'Sailing up to the buoy, the first time a voyage',
        again: 'By the buoy again, after a race',
        count: 'The count, a second each',
        go: 'The gun',
        rival: 'When the other sloop\'s home',
        won: 'Home before the other sloop',
        lost: 'Home after it',
        best: 'Your best time yet, kept in this browser',
        quit: 'Sailed back out through the gate mid-race',
      },
    },
  ],
};
