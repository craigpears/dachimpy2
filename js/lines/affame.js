/** Answering the door when you knock (the district's list: js/den/lodgings.js): the first time, and when
    you come back. */
export const AT_THE_DOOR = {
    first: 'Oh, hello, sweetness! Come in, come in. Mind the teddies.',
    again: 'You came back! The teddies said you would.',
};
/** Showing you round, a stop at a time: the lines she says when you get there. */
export const TOUR_LINES = {
    wall: [
        'Dachimpy made me these. I hung them up the very same day.',
        'Have a look. I\'ll tell you about each one.',
    ],
    nook: [
        'And this is the cushion corner.',
        'Everyone\'s welcome in it. The teddies insist.',
    ],
};
/** About the picture you're looking at (the house shell's: src/den-houses.ts's lookingAt), by its id in
    src/den-affame.ts's PICTURES, once a visit each. Also under it in the close view. */
export const ON_A_PICTURE = {
    dame: 'The day I was made Dame of Everlasting Sweetness. With a candy cane! Melt-Apart Springer of Pastries is the rest of it.',
    cushions: 'That\'s me in my happy place. Cushions, teddies, and absolutely no hurry.',
    war: 'The Sweetness War. A love card against a cupcake. Nobody lost. That\'s the best kind of war.',
    index: 'The Sweetness Index. Off the charts, see? It\'s raining chocolate. Very scientific.',
};
/** Sinking into her cushion corner (walk up to it and Space): her line as you come up out of it, the first
    time, then one of the others in turn. */
export const IN_THE_CUSHIONS = {
    first: 'There. Isn\'t that better? Stay as long as you like.',
    again: ['Teddy says hello.', 'Softest spot on the seven seas.', 'Shh. The cushions are working.'],
};
/** After the tour, as you wander: now and then, while she's near. */
export const CHATTER = [
    'Would you like a pastry? They melt apart. That\'s the whole point.',
    'Queen of sweetness. It\'s not an official title. Well. It\'s a little bit official.',
    'Be kind to someone today. You can start with yourself.',
    'The teddies all have names. I\'m still deciding most of them.',
    'If the Sweetness War ever starts again, I\'ve got cupcakes ready.',
];
/** Seeing you out. */
export const GOODBYE = 'Bye, sweetness! Come back soon.';
export const CHARACTER = {
    name: 'Affame',
    who: 'A real pirate of the Emerald Ocean (by her pirate name only), the queen of sweetness: Dachimpy dubbed her '
        + 'so, and made her four cartoons to hang in her little house in the den\'s housing district (being knighted '
        + 'Dame of Everlasting Sweetness, Melt-Apart Springer of Pastries, with a candy cane; at peace among cushions '
        + 'and teddies; the Sweetness War; the Sweetness Index, off the charts). Drawn from her pirate page\'s portrait: '
        + 'long pink hair under a pink-and-navy striped wrap, a long navy coat with a magenta panel.\n\n'
        + 'Kind, sweet and playful, a gentle, peaceful part: she shows you her pictures, and her cushion corner, where '
        + 'everyone\'s welcome.',
    theUser: [
        { on: '11 Nov', said: 'I have dubbed her the queen of sweetness so she can have a nice kind peaceful role somewhere.' },
        { on: '14 Nov', said: 'Affame is a sweety' },
        { on: '14 Nov', said: 'The dame of everlasting sweetness things I made for Affame to show in her little house XD' },
    ],
    lines: [
        { when: 'Answering the door when you knock', says: AT_THE_DOOR, each: { first: 'Your first visit', again: 'Coming back' } },
        {
            when: 'Showing you round, as you come to each stop', says: TOUR_LINES,
            each: { wall: 'In the middle of her room, before her four pictures', nook: 'By her cushion corner' },
        },
        {
            when: 'About the picture you\'ve stopped by or turned to look at (once a visit each), and under it in the close view', says: ON_A_PICTURE,
            each: { dame: 'Dame of Everlasting Sweetness', cushions: 'Cushions and Teddies', war: 'Sweetness War', index: 'Sweetness Index: Off the Charts!' },
        },
        { when: 'As you come up out of her cushions', says: IN_THE_CUSHIONS, each: { first: 'The first time', again: 'Another time, one in turn' } },
        { when: 'Now and then, as you wander her room after the tour', says: CHATTER },
        { when: 'As you leave', says: [GOODBYE] },
    ],
};
