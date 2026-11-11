/** Lifting his lid: he sits up and screams (as you do), then lies back down, grumbling. */
export const WOKEN = {
    scream: 'AAAAH!',
    grumble: 'Five more minutes...',
    again: 'Do you MIND?',
};
export const CHARACTER = {
    name: 'The Count',
    who: 'The vampire who sleeps in the coffin at the bedside in Gravee\'s house (Bedside Manors). Not a real '
        + 'pirate: a look from the wardrobe (a black Vampire raiment lined red), deathly pale. His portrait over the '
        + 'coffin follows you with its eyes. Lift his lid and he sits bolt upright, and you both scream at each '
        + 'other; then he lies back down. Grumpy before sunset, harmless after it. (No vampire game yet: IDEAS.md, '
        + '"The vampire in the coffin".)',
    theUser: [
        { on: '9 Nov', said: 'you open a coffin, and a vampire sits up. You both scream at each other comically, "ah! ah!"' },
        { on: '11 Nov', said: 'Maybe we don\'t go as far as a vampire game.' },
    ],
    lines: [
        { when: 'Lifting his lid', says: WOKEN, each: { scream: 'Sitting bolt upright, nose to nose with you', grumble: 'Lying back down as the lid shuts', again: 'Lifting it again, another time' } },
    ],
};
