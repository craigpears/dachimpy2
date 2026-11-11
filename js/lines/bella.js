/** Her chatter in Dignity's cutscene. */
export const CHATTER = {
    eek: 'Eek eek!',
    proud: 'Eek!',
};
export const CHARACTER = {
    name: 'Bella',
    who: 'Dignity\'s lavender monkey, on her shoulder (a limited-edition monkey colour: what looked like little '
        + 'purple wings in the portrait is her curled tail). She\'s the one who fires the warning shot: she '
        + 'chatters, scampers down in quick monkey bounds to one of the checkpoint\'s real guns, salutes very '
        + 'stiffly, lights the fuse, covers her ears, and strikes a proud little pose, a fist pumped in the air.',
    theUser: [
        { on: '10 Nov', said: 'The lavender monkey has got to be involved somehow ... the little monkey is the one that fires the cannon at you.' },
        { on: '10 Nov', said: 'We\'ve got to get these familiars really involved' },
    ],
    lines: [
        {
            when: 'Dignity\'s cutscene', says: CHATTER,
            each: {
                eek: 'Sent to the gun: bouncing on Dignity\'s shoulder, arms waving',
                proud: 'Her proud little pose on the gun, after the shot',
            },
        },
    ],
};
