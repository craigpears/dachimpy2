/** The guests: any one of them (`guest`), and the one they're arguing with (`guest2`). */
export const GUESTS_SAY = {
    lookAtThem: 'Ooh, look at them!',
    stunning: 'Stunning. Simply stunning.',
    sniff: '*sniff* It\'s beautiful!',
    grog: 'You spilt my grog!',
    face: 'You spilt your FACE!',
    sorry: '...sorry.',
    hooray: 'Hooray!',
};
/** The guest who's had a few. */
export const DRUNK_SAYS = 'Hic! I jusht wanna shay... I love you all!';
/** A raider, storming in. */
export const RAIDER_SAYS = 'Yarr! Hand over the cake!';
/** The hired security, called. */
export const GUARD_SAYS = 'On it, miss!';
export const CHARACTER = {
    name: 'The wedding\'s guests',
    who: 'Everyone else at a wedding on the Wedding Isle: the guests, dressed by the theme or by you (six of them, '
        + 'or half the Ocean), two hired security guards in black and grey, cutlasses at their sides, and the raiders '
        + 'who crash it if that\'s how you chose it to go. The guests coo, sniff, argue over grog and cheer; one may '
        + 'have had a few; the raiders want the cake; the guards earn their doubloons. (A guard stands in as the '
        + 'officiant when it\'s Mischievious you marry.)',
    lines: [
        {
            when: 'The ceremony: the guests', says: GUESTS_SAY,
            each: {
                lookAtThem: 'Your sweetheart walks up the aisle', stunning: 'Your sweetheart walks up the aisle (another guest)',
                sniff: 'Sweet and blissful: after the vows', grog: 'A brawl breaks out: the first word', face: 'A brawl breaks out: the reply',
                sorry: 'A brawl breaks out: after it', hooray: 'The cheer',
            },
        },
        { when: 'The ceremony, Somebody\'s drunk: the drunk, staggering up', says: [DRUNK_SAYS] },
        { when: 'The ceremony, Raiders crash it: a raider, storming in', says: [RAIDER_SAYS] },
        { when: 'The ceremony, Raiders crash it: a guard, called', says: [GUARD_SAYS] },
    ],
};
