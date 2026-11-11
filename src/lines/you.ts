/* Pirate Den: your own pirate's lines (src/lines/character.ts says how these files go). Said over your
   head: picking up the captain's map (js/den/map.js), and hauling her up the cliff by the crane
   (js/den/crane.js: its trip's beats are src/den-crane.ts's); and at your wedding (src/den-wedding.ts's
   plotScript; the questions you ask Mischievious as you plan are with her answers, in mischievious.ts). */
import type { Character } from './character.js';

/** Picking up the captain's map, at the end of Dalnoth's cutscene. */
export const FOUND_MAP = 'A map!';

/** The crane's trip, a line for each beat of it: hauling her up the cliff into the lagoon, or
    lowering her back down into the cove. */
export const CRANE_RIDE = {
  up: 'Up she comes!',
  down: 'Down she goes!',
  heave: 'Heave!',
  ho: 'Ho!',
  easy: 'Easy... easy...',
  paint: 'Mind her paint!',
  wheee: 'Wheee!',
  lagoon: 'Ooh, a lagoon!',
  cove: 'Home sweet cove',
} as const;

/** Your wedding, on the Wedding Isle: your vow (Sweet and blissful) and your "I do". */
export const AT_YOUR_WEDDING = {
  vow: 'And I promise to mend your wall. Every time.',
  ido: 'I do!',
} as const;

export const CHARACTER: Character = {
  name: 'You',
  who: 'Your own pirate, dressed as you like from the wardrobe (or as any real pirate in it). You say little, '
    + 'and only at the den\'s short, cheesy moments: picking up the captain\'s map, and riding the crane '
    + 'up the cliff and down again, and your own wedding.',
  lines: [
    { when: 'Picking up the captain\'s map, at the end of Dalnoth\'s cutscene', says: [FOUND_MAP] },
    {
      when: 'Hauling her up the cliff by the crane, or back down (over your head)', says: CRANE_RIDE,
      each: {
        up: 'Leaping up to the windlass, to haul her up into the lagoon',
        down: 'Leaping up to the windlass, to lower her back down into the cove',
        heave: 'Winding her up out of the water',
        ho: 'Winding her the rest of the way up',
        easy: 'The jib swinging her round',
        paint: 'Lowering her in',
        wheee: 'Leaping down onto her deck',
        lagoon: 'There: up in the lagoon',
        cove: 'There: back down in the cove',
      },
    },
    {
      when: 'Your wedding, on the Wedding Isle', says: AT_YOUR_WEDDING,
      each: { vow: 'Sweet and blissful: your vow, after your sweetheart\'s', ido: '"I do"' },
    },
  ],
};
