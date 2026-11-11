/** What's said the first time you come up off the island, on a voyage (the status line). */
export const SIGHTED = 'Port Decorum, under imperial control. Its harbour\'s shut to pirates';
/** The guard on the jetty's end, as you first come within earshot. */
export const HALT = 'Halt! Port Decorum, by order of the Empire. No pirates in the harbour.';
/** Then, while you're within earshot, round and round. */
export const GRUMBLES = [
    'Move along. The market\'s not for the likes of you.',
    'Customs house is shut. To pirates. Always.',
    'Nice little sloop. Be a shame if she were impounded.',
    'Keep your guns run in. The fort\'s watching.',
    'No, you can\'t see the warehouse. Nobody sees the warehouse.',
    'Everything ashore is imperial property. Every last crate.',
    'Papers? No? Then no.',
];
export const CHARACTER = {
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
    ],
};
