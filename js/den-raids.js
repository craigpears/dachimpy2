/* Pirate Den: the raids, and when they come. TypeScript, compiled to js/den-raids.js; tested in
   tests/den-raids.test.ts. den.js runs the waves and sails the ship; this says what follows each.

   The user (9 Nov) liked the quick intro, under attack from the start, but wanted the raids to
   become "a bit more opt-in" after a few waves, "so you're not constantly under pressure and you
   feel free to go explore, roam, and do different puzzles". Then, on the sketch ("Raids you choose"
   in IDEAS.md): "Yeah, I like that. Yeah, do a few waves." So the opening siege is three waves;
   beat the third and their captain calls it off and sails out of the cove, and the den's quiet:
   no countdown to the next one. (What brings raiders back later, a sail on the horizon or a bell
   you ring, is still to come.) */
export const SIEGE = {
    /** Waves in the opening siege. */
    WAVES: 3,
};
/** What follows a wave beaten off: a breather before the next, or, once the opening siege is
    beaten (and after any raid since), the den's quiet. */
export function afterWave(wave) {
    return wave >= SIEGE.WAVES ? 'peace' : 'calm';
}
/** Whether the next wave is counting down: only before the first, and between the siege's waves. */
export const countingDown = (phase) => phase === 'build' || phase === 'calm';
/** Whether the next part's timber comes now. A later part comes as the reward for beating a wave
    off. The walk comes as soon as every hole in the wall's mended, mid-wave or not (the user,
    8 Nov: "the walk should appear once you are safe and have filled in all the holes, so you can
    work on that while they try in a futile attempt to get in"), or with a wave beaten off if that
    comes first. */
export function timberComes(next, why) {
    if (!next)
        return false;
    return why === 'beaten' || next === 'walk';
}
