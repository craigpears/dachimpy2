/** Picking up the captain's map, at the end of Dalnoth's cutscene. */
export const FOUND_MAP = 'A map!';
/** The crane's trip, a line for each beat of it: hauling her up the cliff into the lagoon, or
    lowering her back down into the cove. */
export const CRANE_RIDE = {
    up: 'Up she comes!',
    down: 'Down she goes!',
    heave: 'Heave!',
    ho: 'Ho!',
    easy: 'Easy... easy...',
    paint: 'Mind her paint!',
    wheee: 'Wheee!',
    lagoon: 'Ooh, a lagoon!',
    cove: 'Home sweet cove',
};
/** Your wedding, on the Wedding Isle: your vow (Sweet and blissful) and your "I do". */
export const AT_YOUR_WEDDING = {
    vow: 'And I promise to mend your wall. Every time.',
    ido: 'I do!',
};
/** In Gravee's house (js/den/gravee-house.js): down her endless gallery, and when the Count sits up. */
export const IN_GRAVEES_HOUSE = {
    howMany: 'How many portraits ARE there?',
    scream: 'AAAAAH!',
};
/** Once Kikkit's told her ramble (all of it, the first time), you wonder aloud, the joke on her
    tangents (the user, 11 Nov: "now I wonder if I can find somebody that can explain how to get past
    all these ... whirlpools and winds that makes a bit more sense, or goes on fewer tangents"). It
    says someone else might, never who or where (RULES.md, "Hidden gems, never hinted"). */
export const AFTER_KIKKIT = 'Is there anyone out here who could explain that with fewer tangents?';
export const CHARACTER = {
    name: 'You',
    who: 'Your own pirate, dressed as you like from the wardrobe (or as any real pirate in it). You say little, '
        + 'and only at the den\'s short, cheesy moments: picking up the captain\'s map, and riding the crane '
        + 'up the cliff and down again, your own wedding, and screaming at a vampire in Gravee\'s house.',
    lines: [
        { when: 'Picking up the captain\'s map, at the end of Dalnoth\'s cutscene', says: [FOUND_MAP] },
        {
            when: 'Hauling her up the cliff by the crane, or back down (over your head)', says: CRANE_RIDE,
            each: {
                up: 'Leaping up to the windlass, to haul her up into the lagoon',
                down: 'Leaping up to the windlass, to lower her back down into the cove',
                heave: 'Winding her up out of the water',
                ho: 'Winding her the rest of the way up',
                easy: 'The jib swinging her round',
                paint: 'Lowering her in',
                wheee: 'Leaping down onto her deck',
                lagoon: 'There: up in the lagoon',
                cove: 'There: back down in the cove',
            },
        },
        {
            when: 'Your wedding, on the Wedding Isle', says: AT_YOUR_WEDDING,
            each: { vow: 'Sweet and blissful: your vow, after your sweetheart\'s', ido: '"I do"' },
        },
        { when: 'Off Kikkit\'s island, once she\'s told her whole ramble the first time (wondering aloud)', says: [AFTER_KIKKIT] },
    ],
};
