/** Answering the door when you knock (the district's list: js/den/lodgings.js): the first time, and
    when you come back (with your portrait on her wall, or without). */
export const AT_THE_DOOR = {
    first: 'A visitor! Oh, come in, come in! Mind Spud, he only bites a little.',
    again: 'You came back! Come in, come in!',
    painted: 'It\'s you! From the wall! Come in, come in!',
};
/** Showing you round, a stop at a time: the lines she says when you get there. */
export const TOUR_LINES = {
    hall: [
        'Welcome to Bedside Manors! I collect portraits. Just a few.',
        'That\'s me, by the way. Well, me last Tuesday.',
        'And that spot in the middle\'s for my very favourite. It\'s empty. For now...',
    ],
    gallery: [
        'This way! The bedchamber\'s just past my portraits.',
    ],
    yeti: [
        'Oh! And those are my definitive proof. The yeti! Look at him. Clear as day.',
        'Thirty-one times I\'ve proved him. Nobody believes me.',
    ],
    chamber: [
        'And this is the bedchamber! Bedside Manors, see? The coffin\'s at the bedside.',
        'That\'s the Count\'s. He\'s a darling. Sleeps all day.',
        'Don\'t mind his eyes. They do that.',
    ],
    coffin: [
        'Ooh, don\'t open it. He\'s ever so grumpy before sunset.',
    ],
};
/** By his coffin, beckoning you over to it from across her bedchamber, now and then, till you've had
    your look (the user, 11 Nov: "if you're on the other side of the room, there's nothing really pushing
    you in that direction"). */
export const BECKON = [
    "Go on, have a look at the Count. He won't mind.",
    'Over here! Come and say hello to the Count.',
    "He's only sleeping. Have a peek!",
];
/** The hall's last line, once your portrait's up in the middle of it. */
export const HALL_YOURS = 'And in the middle, my very favourite. You! Mid-scream.';
/** The endless gallery: whizzing down it at a run (a skip you choose), the first time (yours is in you.ts). */
export const THE_GALLERY = {
    answer: 'Only seven pages!',
    back: 'Mind the yetis!',
};
/** The scare: he sits up, you both scream, and she sees her chance. */
export const THE_SCARE = {
    moment: 'Oh! OH! That\'s a perfect portrait moment! Hold that pose while I paint!',
    painting: 'Don\'t move... a little more terror in the eyebrows... perfect!',
    done: 'Done! Pride of place, I think. Right in the middle of the hall.',
    hung: 'There! Now everyone who visits sees you first.',
};
/** After the tour, as you wander: now and then, while she's near. */
export const CHATTER = [
    'Have you seen the yetis? Every one of them\'s a different yeti. I checked.',
    'Spud, no. Not the frames.',
    'Seven pages, and I\'ve room for eight.',
    'Everyone I meet ends up on a wall. It\'s a compliment!',
    'Dalnoth sat for me once. Well, fell over near me. Same thing.',
    'The Count\'s portrait does follow you round. Isn\'t it lovely?',
];
/** Seeing your portrait again, once it's hung. */
export const YOUR_PORTRAIT = [
    'My favourite. Look at that face!',
    'Visitors always ask who you are. I tell them: my friend, mid-scream.',
];
/** Seeing you out. */
export const GOODBYE = 'Come back soon! Bring your face!';
export const CHARACTER = {
    name: 'Gravee',
    who: 'A real pirate of the Emerald Ocean (by her pirate name only): captain of Just In Time, Lady of the '
        + 'flag Don\'t Open Till Doomsday, and a great collector of portraits: seven pages of them, most of herself '
        + 'in her many looks, and dozens of her "Definitive Proof" of a yeti. Drawn from her pirate page\'s portrait: '
        + 'a white Berserker pelt (a bear\'s head) over white hair, an eyepatch, a blue starfish stuck to her cheek, '
        + 'a green Dress top and Gown trimmed white, a hook for her left hand, a candle in her right, and Spud, her '
        + 'tan monkey.\n\n'
        + 'Sweet and excitable, far more excited about adding you to her collection than worried about the vampire '
        + 'in the coffin by her bed. She shows you round her house, Bedside Manors, the first house in the den\'s '
        + 'housing district, and when the Count sits up and you both scream, she sits you for a portrait, frozen '
        + 'mid-fright, and hangs it pride of place.',
    theUser: [
        { on: '10 Nov', said: 'I think we need Gravee, she\'s a sweety.' },
        { on: '10 Nov', said: 'Oh, that looks like a perfect portrait moment. Just hold that pose while I paint.' },
        { on: '11 Nov', said: 'she can show you, be showing you around her house. And the vampires and do the portrait thing.' },
    ],
    lines: [
        { when: 'Answering the door when you knock', says: AT_THE_DOOR, each: { first: 'Your first visit', again: 'Coming back, not yet painted', painted: 'Coming back, your portrait on her wall' } },
        {
            when: 'Showing you round, as you come to each stop', says: TOUR_LINES,
            each: {
                hall: 'Just inside the front door, by the pride of place',
                gallery: 'At the gallery\'s door',
                yeti: 'At the gallery\'s far end, among her yeti proofs',
                chamber: 'Coming into her bedchamber, the vampire\'s portrait over his coffin',
                coffin: 'Coming up to the coffin',
            },
        },
        { when: "Stood by the coffin, beckoning you over, now and then till you've lifted its lid", says: BECKON },
        { when: 'In the hall, instead of "It\'s empty. For now...", once your portrait\'s hung there', says: [HALL_YOURS] },
        { when: 'Whizzing down the endless gallery (a skip you choose)', says: THE_GALLERY, each: { answer: 'The first time, after you ask', back: 'Coming back down it' } },
        { when: 'The Count sits up, and she paints you', says: THE_SCARE, each: { moment: 'As you both scream', painting: 'At her easel', done: 'Her brush down', hung: 'Your portrait up, pride of place' } },
        { when: 'Now and then, as you wander her house after the tour', says: CHATTER },
        { when: 'By your portrait, once it\'s hung', says: YOUR_PORTRAIT },
        { when: 'As you leave', says: [GOODBYE] },
    ],
};
