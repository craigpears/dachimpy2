/* Pirate Den: Umami the capybara (src/lines/character.ts says how these files go; the file's not
   umami.ts, a name ad blockers stop: RULES.md). He doesn't speak:
   these are what's said of him at his moments, by js/den/capybara.js. */
import type { Character, Racer } from './character.js';

/** What's said as his story goes. */
export const OF_HIM = {
  found: 'A capybara, shut in an old fish trap on the bank!',
  free: 'He\'s free! Umami the capybara',
  aboard: 'Umami\'s aboard!',
} as const;

/** In the sloop race (src/den-rivals.ts): aboard Dalnoth's sloop, sat up on her foredeck, doing his
    foraging for him at the barrier of driftwood. Said on the starter's card, of who's racing. */
export const RACING = 'Umami aboard, to do his foraging';

/** In the race watched (src/den-rivals.ts, WATCHED; the user, 14 Nov: "somebody that does the foraging and the
    ... carpentry and the duty nav ... Umami would come in quite well, actually"): at the helm of a sloop of his
    own, by the odd jobs nobody else bothers with, the starlit door, the barrier and the crane. Peaceful, being a
    capybara. He doesn't speak: what's over his sloop is said of him. */
export const RACER: Racer = {
  how: 'At the helm of his own sloop: through the starlit door by Duty Navigation, the barrier of driftwood by '
    + 'Foraging, and the crane by Carpentry. Never fires on anyone.',
  route: 'odd-jobs', style: 'peaceful', skill: 'good',
  says: {
    start: ['(Umami, at the helm. Nobody knows how.)', '(Umami, unbothered, at the helm.)'],
    won: ['(Umami, first home. Still unbothered.)'],
    lost: ['(Umami, home. Time for a nap.)'],
  },
};

export const CHARACTER: Character = {
  name: 'Umami',
  who: 'A capybara, the den\'s first rescued friend (a friend\'s side quest: the friend asked for the name). '
    + 'Shut in an old driftwood fish trap on the far bank of the clifftop lagoon, and never hinted at '
    + 'beforehand: you find him. Freed by Foraging, he bursts out of his trap, bounds along the bank three '
    + 'times for joy, swims out to her and clambers aboard onto her foredeck. Then he lives at the den, in '
    + 'the shallows by her mooring: wading, swimming, sitting at the water\'s edge.\n\n'
    + 'He doesn\'t speak (yet): his lines are what\'s said of him.',
  theUser: [
    { on: '10 Nov', said: 'a pet that you found and rescued' },
    { on: '10 Nov', said: 'being in the cage or being trapped in some way visually makes sense while you\'re trying to free them. They break free and happily start jumping around' },
  ],
  lines: [
    {
      when: 'His rescue', says: OF_HIM,
      each: {
        found: 'Poling her along the lagoon to his bank, the first time',
        free: 'Off the foot of his Foraging board: his trap bursts open',
        aboard: 'He\'s clambered aboard onto her foredeck',
      },
    },
    { when: 'In the sloop race, aboard Dalnoth\'s sloop: on the starter\'s card, after Dalnoth\'s name', says: [RACING] },
    { when: 'Racing in the race watched, at the helm of his own sloop, said over it: on the starting line, and over the finish line first or after', says: RACER.says },
  ],
};
