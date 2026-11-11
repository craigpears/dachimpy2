/** At the wedding (src/den-wedding.ts, plotScript): their vow (Sweet and blissful) and their "I do". */
export const VOWS = {
    vow: 'I promise to love you, share my rum, and bilge beside you always.',
    ido: 'I do!',
};
/** What's said as they come home with you. `{name}`: theirs. */
export const OF_THEM = {
    aboard: '{name}\'s aboard! Off home together',
    home: '{name}\'s come home with you',
};
/** Someone of your own, at home: coming aboard with you off the isle, then walking up to them at the den. */
export const AT_HOME = {
    aboard: 'Off on our honeymoon! Where are we going? Anywhere\'s lovely.',
    den: [
        'Home sweet den! I\'ve put my boots by the fire.',
        'I\'ll keep an eye on the wall while you work. Mostly on you, though.',
        'Shall I make us some grog? I\'ve found where you hide the good stuff.',
        'I keep looking at our wedding portrait. We look ever so happy.',
    ],
};
export const CHARACTER = {
    name: 'Your sweetheart',
    who: 'Whoever you marry on the Wedding Isle: Mischievious (the version of her you picked), one of the suitors, '
        + 'or someone of your own, dressed as you dress yourself and named by you. They walk up the aisle, say their '
        + 'vow and "I do".\n\n'
        + 'Then they come home with you, in their wedding look: aboard the sloop off the isle\'s jetty (or straight home, '
        + 'if you came by the cheat), on her deck as she sails, and at the den from then on, wandering about it and '
        + 'stopping for a word when you come up to them. Kept with your save; a new wedding brings a new sweetheart. '
        + 'Cheerful, a little soppy, and happy to be there.',
    theUser: [
        { on: '11 Nov', said: 'whoever you marry, I think naturally has to jump on the ship with you after you leave the Isle to have that continuity and hang out with the Den with you, that sort of thing. It\'s got to carry out into the world.' },
    ],
    lines: [
        { when: 'At the wedding', says: VOWS, each: { vow: 'Sweet and blissful: their vow', ido: '"I do", after yours' } },
        { when: 'Coming home with you (a toast)', says: OF_THEM, each: { aboard: 'Leaving the isle by sea, off its jetty', home: 'Home by the cheat, straight from the isle' } },
        {
            when: 'Someone of your own, at home', says: AT_HOME,
            each: { aboard: 'Coming aboard the sloop with you, off the isle', den: 'Walking up to them at the den' },
        },
    ],
};
