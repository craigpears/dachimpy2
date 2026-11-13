/** Answering the door when you knock (the district's list: js/den/lodgings.js): the first time, and when
    you come back. "A ROOm you mean? xD" was her own, when the user told her she had a room in the game. */
export const AT_THE_DOOR = {
    first: 'Hi! Come in! Welcome to my ROOm. xD',
    again: 'You came back! Robert missed your ears.',
};
/** Robert's welcome: he roobs your ear (the first time you come in, and whenever you ask him); then her. */
export const ROBERT = {
    hello: 'That\'s Robert. He roobs ears. It\'s how he says hello.',
    again: ['He likes you.', 'Robert! Give them their ear back.', 'Both ears is a special occasion.'],
};
/** Showing you round, a stop at a time: the lines she says when you get there. */
export const TOUR_LINES = {
    guesses: [
        'So. My name. Everyone had a guess.',
        'I hung all the guesses up. Have a look, I\'ll tell you whose was whose.',
    ],
    tea: [
        'And this is where we have tea. It\'s always tea time here.',
        'It\'s my crew\'s name, actually. Tea Time.',
    ],
};
/** About the guess you're looking at (the house shell's: src/den-houses.ts's lookingAt), by its id in
    src/den-roobear.ts's GUESSES, once a visit each: whose guess it was. Also under it in the close view. */
export const ON_A_GUESS = {
    robert: 'Dachimpy\'s guess. A French Robert. Very much a monsieur.',
    rooBear: 'Also Dachimpy\'s. A roo, plus a bear. Half and half.',
    roobed: 'Dachimpy again: did someone roob an ear? The scene of the crime. I\'m saying nothing.',
    books: 'That one\'s Dignity\'s. A roo and a bear, from the books. Yes, abstract. She knows.',
    answer: 'And that\'s mine. Robert the kangaroo bear that roobs ears. I like it.',
};
/** After the tour, as you wander: now and then, while she's near. */
export const CHATTER = [
    'Blueberry? They\'re good for your ears. Robert says.',
    'I room at Gravee\'s too, you know. This is my ROOm.',
    'Robert, not the frames.',
    'Gravee wants to paint Robert. He won\'t sit still.',
    'The crow\'s not Robert. Robert\'s the one with the ears.',
];
/** Seeing you out. */
export const GOODBYE = 'Bye! Mind your ears!';
export const CHARACTER = {
    name: 'Roobear',
    who: 'A real pirate of the Emerald Ocean (by her pirate name only): captain of the crew Tea Time, of the flag '
        + 'Do Not Reply, a Grand-Master Forager. Drawn from her pirate page\'s portrait as it\'s described: deep '
        + 'purple, not black, only her hair black, pinned up with curls by her ears under a wreath of dark purple '
        + 'roses with gold leaves; a gold hoop earring, a silver hook for her left hand, a blue-and-white china '
        + 'bowl of blueberries in her right, and a pale periwinkle crow on her shoulder.\n\n'
        + 'Warm and quietly funny. Asked what her name stands for, she answered that she could be Robert the '
        + 'kangaroo bear that roobs ears, and liked it; told she had a room in the den, "a ROOm you mean? xD". So her '
        + 'little house in the den\'s housing district is her ROOm, its walls hung with everyone\'s guesses at her '
        + 'name, the biggest frame her own answer; and Robert, half kangaroo and half bear, roobs your ear at the '
        + 'door. She rooms at Gravee\'s too.',
    theUser: [
        { on: '12 Nov', said: 'This absolutely needs to be a memory later, she needs her little house in the game.' },
        { on: '12 Nov', said: 'Or is she the Roobear that roobs ears? You need that.' },
        { on: '13 Nov', said: 'she was really cute ... a really sweet interaction, and I wanted to commemorate it' },
    ],
    lines: [
        { when: 'Answering the door when you knock', says: AT_THE_DOOR, each: { first: 'Your first visit', again: 'Coming back' } },
        { when: 'Robert roobs your ear', says: ROBERT, each: { hello: 'The first time, at the door', again: 'Asking him for another, one in turn' } },
        {
            when: 'Showing you round, as you come to each stop', says: TOUR_LINES,
            each: { guesses: 'In the middle of her ROOm, before her gallery of guesses', tea: 'At her tea table' },
        },
        {
            when: 'About the guess you\'ve stopped by or turned to look at (once a visit each), and under it in the close view', says: ON_A_GUESS,
            each: {
                robert: 'Robert, a Monsieur', rooBear: 'Roo + Bear', roobed: 'Did Someone Roob an Ear?',
                books: 'A Roo and a Bear (Dignity\'s guess)', answer: 'Robert the Kangaroo Bear that Roobs Ears, the biggest frame',
            },
        },
        { when: 'Now and then, as you wander her ROOm after the tour', says: CHATTER },
        { when: 'As you leave', says: [GOODBYE] },
    ],
};
