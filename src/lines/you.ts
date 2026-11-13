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

/** Your wedding, on the Wedding Isle: your vow (Sweet and blissful), from under the presents (Showered in
    gifts), and your "I do". */
export const AT_YOUR_WEDDING = {
  vow: 'And I promise to mend your wall. Every time.',
  buried: 'Mmf! Lovely! Thank you all! Mmf!',
  ido: 'I do!',
} as const;

/** In Gravee's house (js/den/gravee-house.js): down her endless gallery, and when the Count sits up. */
export const IN_GRAVEES_HOUSE = {
  howMany: 'How many portraits ARE there?',
  scream: 'AAAAAH!',
} as const;

/** In Roobear's ROOm, Robert the kangaroo bear roobing your ear: the first time, and when you ask again. */
export const IN_ROOBEARS_HOUSE = {
  rubbed: 'Oh! ...Oh, that\'s actually lovely.',
  again: '...Yes. Still lovely.',
} as const;

/** Once Kikkit's told her ramble (all of it, the first time), you wonder aloud, the joke on her
    tangents (the user, 11 Nov: "now I wonder if I can find somebody that can explain how to get past
    all these ... whirlpools and winds that makes a bit more sense, or goes on fewer tangents"). It
    says someone else might, never who or where (RULES.md, "Hidden gems, never hinted"). */
export const AFTER_KIKKIT = 'Is there anyone out here who could explain that with fewer tangents?';

/** Sailing up near Primates Rule at anchor, still to come (src/den-moored.ts; the user, 11 Nov: "make
    it clear, it's kind of a to-do item"): at the foot of the screen. */
export const BY_PRIMATES_RULE = 'Primates Rule, at anchor. She\'s not ready yet: coming soon!';

/** Coming into the smugglers' cove round the back of Port Decorum, the first time on a voyage (the user,
    11 Nov: "Penguin Island, and then you have the ... Smuggler's Beach there"): at the foot of the screen.
    Only once you're there: nothing names it before (RULES.md, "Hidden gems, never hinted"). */
export const AT_SMUGGLERS_BEACH = 'A smugglers\' beach, round the back of Port Decorum! Not a guard in sight';

/** Coming up off Helium's island the first time, their still just gone bang (src/den-helium.ts, opening; the
    user, 12 Nov: "your pirate's face could just kind of look very tense, just like, is it safe?" and "the
    joke of you've got no eyebrows left"): over your head, between their lines. */
export const AT_HELIUMS = {
  safe: 'Is... is it safe?',
  brows: 'You\'ve got no eyebrows left.',
} as const;

export const CHARACTER: Character = {
  name: 'You',
  who: 'Your own pirate, dressed as you like from the wardrobe (or as any real pirate in it). You say little, '
    + 'and only at the den\'s short, cheesy moments: picking up the captain\'s map, and riding the crane '
    + 'up the cliff and down again, your own wedding, screaming at a vampire in Gravee\'s house, having an ear roobed in Roobear\'s, and sailing '
    + 'by Primates Rule, not ready yet, coming into the smugglers\' cove behind Port Decorum, and, warily, at '
    + 'Helium\'s still just after it\'s gone bang.',
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
      each: { vow: 'Sweet and blissful: your vow, after your sweetheart\'s', buried: 'Showered in gifts: from under the pile, up to your neck in presents', ido: '"I do"' },
    },
    { when: 'Off Kikkit\'s island, once she\'s told her whole ramble the first time (wondering aloud)', says: [AFTER_KIKKIT] },
    { when: 'Sailing up near Primates Rule at anchor, still to come (once a voyage)', says: [BY_PRIMATES_RULE] },
    { when: 'Off Helium\'s island the first time, their still just gone bang: between their lines', says: AT_HELIUMS },
    { when: 'Coming into the smugglers\' cove behind Port Decorum, by way of the whirlpools (once a voyage)', says: [AT_SMUGGLERS_BEACH] },
    { when: 'Robert the kangaroo bear roobing your ear, in Roobear\'s ROOm', says: IN_ROOBEARS_HOUSE, each: { rubbed: 'The first time, at her door', again: 'Asking him for another' } },
  ],
};
