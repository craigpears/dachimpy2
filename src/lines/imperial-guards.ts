/* Pirate Den: the imperial guards of Port Decorum (src/lines/character.ts says how these files go), the
   island under imperial control out past the checkpoint. When they say them is src/den-imperial.ts's
   (EMPIRE_SAYS, played by src/chatter.ts); js/den/imperial-isle.js shows them over the jetty guard's
   head, and puts up what's said as you first come up.

   The user (11 Nov): "just some island that's, say, under imperial control ... to create trading
   mechanics, looting mechanics, smuggling mechanics, all that kind of stuff". For now there's nothing to
   do there: the guards keep pirates out, politely, by the book, a little smug about it. Each line's a
   bubble over the guard's head: kept short, on a phone too. Nothing here says how you might get in. */
import type { Character } from './character.js';

/** What's said the first time you come up off the island, on a voyage (the status line). */
export const SIGHTED = 'Port Decorum, under imperial control. Its harbour\'s shut to pirates' as const;

/** The guard on the jetty's end, as you first come within earshot. */
export const HALT = 'Halt! Port Decorum, by order of the Empire. No pirates in the harbour.' as const;

/** Then, while you're within earshot, round and round. */
export const GRUMBLES = [
  'Move along. The market\'s not for the likes of you.',
  'Customs house is shut. To pirates. Always.',
  'Nice little sloop. Be a shame if she were impounded.',
  'Keep your guns run in. The fort\'s watching.',
  'No, you can\'t see the warehouse. Nobody sees the warehouse.',
  'Everything ashore is imperial property. Every last crate.',
  'Papers? No? Then no.',
] as const;

/** Helium's rum run (src/den-rumrun.ts), brazened out at the jetty: the guard on its end asks what's in the
    barrels, takes Helium's word for it, and isn't happy about it. `what` as you come alongside, `water` after
    Helium's "Water.", `fine` after the thirsty fort. */
export const RUM_RUN = {
  what: 'Halt! No pirates in the harbour. And what\'s in the barrels?',
  water: 'Water.',
  fine: '...Leave them on the jetty. And move along. Before I think about it.',
} as const;

export const CHARACTER: Character = {
  name: 'The imperial guards of Port Decorum',
  who: 'Soldiers of the Empire in its crimson and gold, standing guard over Port Decorum, the imperial port '
    + 'out past the checkpoint: on the jetty\'s end, at the fort\'s gate, along the quay. The one on the '
    + 'jetty does the talking: by the book, politely unhelpful, a little smug that the harbour\'s shut to '
    + 'pirates.\n\n'
    + 'For now there\'s nothing to do there: the island\'s sketched, to sail up to and look at, the place for '
    + 'trading, looting and smuggling to come.',
  theUser: [
    { on: '11 Nov', said: 'even if it\'s just an empty island or something where you can\'t interact yet, is just some island that\'s, say, under imperial control' },
  ],
  lines: [
    { when: 'The first time you come up off the island on a voyage, as the status line', says: SIGHTED },
    { when: 'The jetty guard, as you first come within earshot', says: HALT },
    { when: 'Then, while you\'re within earshot, round and round', says: GRUMBLES },
    {
      when: 'Helium\'s rum run, brazened out at the jetty: its guard and Helium', says: RUM_RUN,
      each: { what: 'As you come alongside with the barrels', water: 'After Helium\'s "Water."', fine: 'After the thirsty fort' },
    },
  ],
};
