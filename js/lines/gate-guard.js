/** As you first come up to the gate in a race. */
export const HALT = 'Halt! Imperial gate. The guns are trained on the gap, pirate.';
/** Then, while you're within earshot, now and then. */
export const GRUMBLES = [
    'Long way round\'s that way. Unless you make it worth my while.',
    '{price} coins, and I might just be looking the other way.',
    'A guard\'s pay is a pittance. A pittance, I tell you.',
    'Heard there\'s an old wreck back along the leg. Not that I\'d know.',
    'Nobody gets through without the Empire\'s say-so. Or mine.',
];
/** Paid: the gate's guns hold their fire on you. */
export const PAID = [
    'Pleasure doing business. Hold your fire, lads!',
    'I never saw you. Off you go.',
];
/** Space with less than the price. */
export const SHORT = ['That\'s short. The price is {price}: go and haul up the rest.'];
/** Space again, once you've paid. */
export const AGAIN = ['You\'ve paid. Go on, before I change my mind.'];
export const CHARACTER = {
    name: 'The guard at the race\'s gate',
    who: 'An imperial soldier in the Empire\'s crimson and gold, posted at the gun gap on the sloop race\'s first '
        + 'spit, made an imperial gate: its guns trained on the way through. By the book, till there\'s a purse '
        + 'in it: pay him off with coins hauled up from the old wreck back along the leg, and his guns look the '
        + 'other way while you sail through.',
    theUser: [
        { on: '12 Nov', said: 'I can imagine you having treasure haul, and one of the shortcuts is then bribe, yeah, you can then use the treasure that you hold up to bribe somebody at a gate to get through.' },
        { on: '12 Nov', said: 'build the bribe gate ... I just want all the ideas in there ... to show how many different ways you have of really getting through the course.' },
    ],
    lines: [
        { when: 'As you first come up to the gate in a race', says: HALT },
        { when: 'Then, while you\'re within earshot, now and then', says: GRUMBLES },
        { when: 'Paid, the gate\'s guns holding their fire on you', says: PAID },
        { when: 'Space at the gate with less than his price', says: SHORT },
        { when: 'Space at the gate again, once you\'ve paid', says: AGAIN },
    ],
};
