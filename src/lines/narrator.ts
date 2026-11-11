/* Pirate Den: the den's pirate voice (src/lines/character.ts says how these files go): the captions of
   the little tour round the captain's map (src/den-finds.ts: TOUR, which says what each points at;
   js/den/quests.js shows them). */
import type { Character } from './character.js';

/** The tour round the captain's map, the first time you open it (T shows it again): a caption at a
    time, each pointing at a part of the map. */
export const TOUR_SAYS = {
  den: 'Yer den, and the old sloop they left ye, at anchor off the beach. Walk out to the end o\' the jetty and press Space to board her.',
  winds: 'The trade winds sweep her out from the beach, and the shipping lane runs on out to sea. Click the sea to drop a pin and she sails there herself, or steer her with W, A and D.',
  checkpoint: 'The Imperial checkpoint. Pirates not welcome, and its guns say so. There\'s more than one way past it, mind. Which? That\'s for ye to find.',
  wreck: 'Beyond it, the open sea, and an old wreck aground on a sandbar. X marks the spot: the captain\'s treasure, there for the hauling.',
  more: 'And that\'s only what the captain drew. There\'s more off the edges o\' this map. Yer quests are on the scrap by it, ticked off as ye go: the den\'s jobs, and what\'s still out there to find. T shows ye this again.',
} as const;

export const CHARACTER: Character = {
  name: 'The den\'s pirate voice',
  who: 'Not someone you meet: the den\'s own voice, a pirate\'s ("yer", "ye", "o\'"), in the captions of the '
    + 'little tour round the captain\'s map. It only says what\'s there to see and how to work a thing: never '
    + 'how to get past the checkpoint, nor where a secret is (RULES.md, "Hidden gems, never hinted").',
  lines: [
    {
      when: 'The tour round the captain\'s map, the first time you open it (T shows it again)', says: TOUR_SAYS,
      each: {
        den: 'At your den and the sloop',
        winds: 'At the trade winds and the shipping lane',
        checkpoint: 'At the imperial checkpoint',
        wreck: 'At the old wreck and the X',
        more: 'At your quests',
      },
    },
  ],
};
