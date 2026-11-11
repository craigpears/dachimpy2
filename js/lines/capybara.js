/** What's said as his story goes. */
export const OF_HIM = {
    found: 'A capybara, shut in an old fish trap on the bank!',
    free: 'He\'s free! Umami the capybara',
    aboard: 'Umami\'s aboard!',
};
export const CHARACTER = {
    name: 'Umami',
    who: 'A capybara, the den\'s first rescued friend (a friend\'s side quest: the friend asked for the name). '
        + 'Shut in an old driftwood fish trap on the far bank of the clifftop lagoon, and never hinted at '
        + 'beforehand: you find him. Freed by Foraging, he bursts out of his trap, bounds along the bank three '
        + 'times for joy, swims out to her and clambers aboard onto her foredeck. Then he lives at the den, in '
        + 'the shallows by her mooring: wading, swimming, sitting at the water\'s edge.\n\n'
        + 'He doesn\'t speak (yet): his lines are what\'s said of him.',
    theUser: [
        { on: '10 Nov', said: 'a pet that you found and rescued' },
        { on: '10 Nov', said: 'being in the cage or being trapped in some way visually makes sense while you\'re trying to free them. They break free and happily start jumping around' },
    ],
    lines: [
        {
            when: 'His rescue', says: OF_HIM,
            each: {
                found: 'Poling her along the lagoon to his bank, the first time',
                free: 'Off the foot of his Foraging board: his trap bursts open',
                aboard: 'He\'s clambered aboard onto her foredeck',
            },
        },
    ],
};
