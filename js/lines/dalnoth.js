/** Beaten, shaking his fist at your wall from the beach before he runs for his boat. */
export const PARTING = 'We\'ll be back! *hic*';
/** What he scrawled across his map, the one that falls out of his coat. */
export const RUMOUR = "We hear there's some secret treasure here, guarded by a fearsome enemy";
/** Racing you in the sloop race (src/den-rivals.ts), standing in for Daquan till Daquan's drawn (his
    portrait's still to check): Umami the capybara aboard, who does his foraging for him at the barrier of
    driftwood (the user, 11 Nov: "obviously you will have maybe like the foraging slant"), while he loads
    his guns and fires on anyone he finds sitting still. */
export const RACER = {
    how: 'Through the barrier of driftwood, Umami clearing it by Foraging in the sheltered notch; on the way he '
        + 'fires on anyone sitting still, and loads more by Gunnery once he\'s fired his.',
    route: 'forage', style: 'aggressive', skill: 'decent',
    says: {
        start: ['Out o\' me way! Umami, get foragin\'! *hic*'],
        won: ['Har! Vikings first! *hic*'],
        lost: [PARTING],
    },
};
export const CHARACTER = {
    name: 'Dalnoth',
    who: 'Captain of the Vikings who lay siege to the den, and the one at their ship\'s cannon from its first '
        + 'shot. A real Puzzle Pirates pirate, Dalnoth of Emerald (the user\'s friend), drawn from his portrait '
        + 'with affection: a Viking helmet with yellow fur, a big black beard, a long gold coat, a frothy tankard '
        + 'of ale in his hand and his white monkey on his shoulder. A bit of a drunk: the ale slops as he rants, '
        + 'and he\'s unsteady on his feet.\n\n'
        + 'Beaten after the third wave, he leaves his cannon, rows in, stomps up the beach and shakes his fist '
        + 'at your wall, then runs for it, and his map falls out of his coat. To come: guarding his treasure on '
        + 'his island, his white monkey hopping onto your shoulder when you beat him, and back, furious.',
    theUser: [
        { on: '9 Nov', said: 'I want a little cutscene, so they\'re not just sailing off in the distance ... a short, cheesy one' },
        { on: '9 Nov', said: 'it feels just a bit forced how he just magically appears. Like maybe he should be the one like manning the cannon on the boat' },
        { on: '10 Nov', said: 'Surely it should be [Dalnoth] on the ship ... You want him to be on the ship shooting the cannon' },
    ],
    lines: [
        { when: 'The siege beaten: on the beach, shaking his fist at your wall (the captain\'s map cutscene)', says: [PARTING] },
        { when: 'Scrawled across his map', says: [RUMOUR] },
        { when: 'Racing you in the sloop race, Umami aboard, over his sloop: on the starting line, and over the finish line first or after', says: RACER.says },
    ],
};
