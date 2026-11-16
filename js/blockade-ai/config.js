export const BOTS = {
    /** Seconds between a bot's looks round for something better to do. */
    THINK: 3.5,
    /** Seconds she leaves a place she found no way to before trying it again. */
    NOWAY: 8,
    /** How much better something has to look before she changes her mind. */
    STICK: 1.3,
    /** How much more the heart's buoys are worth to a frigate; and to a sloop, once the enemy's frigates are in it. */
    HEART: 2.5, FLEE: 0.3,
    /** A sloop's dodge: how near (squares) a frigate has to be to be watched, how nearly loaded (seconds) her side has to
        be to count, and the longest she keeps at getting to the cover she picked. */
    DODGE: { NEAR: 7, LOADED: 1.5, SECS: 2.5 },
    /** How near (squares) an enemy frigate has to be to a buoy for a sloop to leave it be. */
    WARY: 5,
    /** A ship's nerve against an enemy, by how damaged each is (`nerve`): 1 + K times his damage less hers, between MIN and
        MAX; a sloop raids only with GO or more. No ship hides (the user, 15 Nov: "this is a game about the points ... You
        die practically on the points"; "you never hide"): her crew patch her where she is. */
    NERVE: { K: 1.5, MIN: 0.3, MAX: 2, GO: 0.8 },
    /** Seconds a raider lies hidden before she darts out again, and the longest a raid lasts. */
    LURK: [8, 14], RAID: 25,
    /** How near an enemy frigate has to be (squares) for a raider to dart out at her, and how far off her side she lies. */
    REACH: 16, OFF: 3,
    /** How far off a frigate's bow or stern a raider lies to snipe at her (squares past her end: in her own guns' reach). */
    END: [3, 2],
    /** Seconds further her bow looks than it is to a raider, against her stern. */
    BOW: 8,
    /** How near an enemy has to be (squares) for a frigate to fight her, and how much she's worth fighting. */
    ENGAGE: 9, FIGHT: 3,
    /** How much a fight's worth to a big ship with an enemy on no buoy (one on a buoy, or contesting it, 1). */
    OFF_POINTS: 0.35,
    /** A gate's guns' worth to a frigate, each one still standing: while they're firing on her, and otherwise. */
    GUNS: { ON: 3.5, W: 1 },
    /** How much longer than her way itself a big ship's way round the ships in it can be before she'd rather wait. */
    DETOUR: 1.6,
    /** The longest (seconds) a big ship waits for them before she takes the long way. */
    PATIENCE: 6,
    /** How near (squares) an enemy has to come for a frigate holding a buoy in the heart to leave it to fight her. */
    HOLD: 5,
    /** How much more a fight's worth to finish an enemy who's knocked out, or to save a friend who is (an enemy within
        SAVE squares of her). */
    FINISH: 2, RESCUE: 1.6, SAVE: 7,
    /** A brig's: how much more the open sea's buoys are worth to her, and the heart's (less: the frigates' to take); how
        near an enemy has to be for her to launch her craft (from her lagoon's corner to the heart's middle, and a little). */
    BRIG: { OUT: 1.5, HEART: 0.35, LAUNCH: 17, SAFE: 7 },
    /** Seconds between a turtle's looks for whom to ram (quick: her prey moves), how far she looks, how many squares
        nearer a ship lying still looks to her (she can only ram one lying still), a frigate (her worth; a brig half), and
        the one she's after already. */
    RAM: { THINK: 0.8, REACH: 24, STUCK: 1.6, STILL_FIRST: 8, WORTH: 12, KEEP: 4, GUN: 10 },
    /** How near (squares, middle to middle) an enemy she's fighting has to be for her to swing her broadside round onto her. */
    SWING: 5,
    /** A skirmishing sloop's seconds running off after each broadside (hit and run). */
    RUN: 4,
    /** Seconds a ship's lain still before a phantom sloop counts her fair game, whatever she is. */
    CAMPED: 6,
    /** How near (squares, middle to middle) an enemy has to be for a frigate on the points to turn her broadside onto her. */
    BEAR: 8,
    /** A stuck frigate's end raked (one half in a gateway): how near she has to be, how few seconds away her end, and her
        worth. */
    RAKE: { NEAR: 14, SECS: 15, W: 10 },
    /** How near (squares) an enemy sloop has to be to a friend's brig at anchor for a sloop to go and drive her off. */
    GUARD: 7,
    /** Seconds a big ship goes getting no nearer the buoy she's making for before she gives it up a while (as long again). */
    STALL: 15,
};
export const same = (a, z) => !!a && !!z && JSON.stringify(a) === JSON.stringify(z);
/** The same thing to do, if not exactly (a raid on the same ship, wherever she's got to; hiding in the same cove). */
export const sameAim = (a, z) => !!a && a.kind === z.kind && (z.kind === 'raid' || z.kind === 'fight' || z.kind === 'ram' ? a.on === z.on && a.gun === z.gun : same(a, z));
