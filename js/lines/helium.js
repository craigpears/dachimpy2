/** Coming up off her island the first time (src/den-helium.ts, opening): the still goes bang as you
    arrive, and she treats it as an everyday thing. The user (12 Nov): "the distillery exploding and Helium
    just treating it as kind of a casual everyday event, just like, oh, sorry, just a little distilling
    mishap ... would you like me to teach you some distilling", then, to your "is it safe?", "of course it's
    safe. What would make you think it's not safe? This is perfectly normal. It's fine." And the eyebrows:
    "none of us have got eyebrows ... I keep asking the developers for some, but I've not gotten them yet"
    (true: no pirate in Puzzle Pirates has any, checked on Helium's and Roobear's portraits, 12 Nov; it only
    sounds like the bangs took them). Your lines between are src/lines/you.ts's AT_HELIUMS. */
export const OPENING = {
    mishap: 'Oh. Sorry about that. Just a little distilling mishap.',
    offer: 'Would you like me to learn you some distilling? While you\'re here.',
    safe: 'Of course it\'s safe. What would make you think it\'s not safe? Perfectly normal, this. It\'s fine.',
    brows: 'None of us have got eyebrows. I keep asking the developers for some. Nothing yet.',
};
/** Her lesson begins, after her opening. */
export const GREET = 'Right then. Distilling. Nothing to it. Watch.';
/** Her opening lesson, on a real board at her still (src/den-helium.ts, lessonPlan): a line in her bubble
    as each beat starts (`says`), and what it shows in plain words, in the bar at the foot of the screen
    (`note`). The swap rule, whites left and junk right, the furnace's column burned, and a white burned
    with it: her mishap. Then it's yours. */
export const LESSON = {
    rule: {
        says: 'One rule. The lower piece beats the upper one: white floats up past black.',
        note: 'The swap rule: a piece swaps up past the one it beats. White beats black, brown beats white, black beats brown.',
    },
    ruleAfter: {
        says: 'Brown past white, black past brown. Round and round. Can\'t swap it straight back, mind.',
        note: 'White over black, brown over white, black over brown: like rock, paper, scissors.',
    },
    left: {
        says: 'Whites go left, away from the fire. Junk goes right, toward it.',
        note: 'Whites left, junk right: drag a white along, swap after swap, and the junk steps the other way.',
    },
    furnace: {
        says: 'Furnace takes the right-hand column. All junk? Burn it now. X.',
        note: 'The furnace burns the right-hand column every 15 seconds, or now on X. More blacks than whites and it burns; the rest goes up into the flask.',
    },
    mishapSetup: {
        says: 'And the next one\'s mostly junk. One white in it. Eh. X.',
        note: 'A white in a column that burns is lost: burnt whites come back later, scorched, and spoil a column.',
    },
    yours: {
        says: 'Right, your go. H if you want me. I\'ll be here. Probably.',
        note: 'Your go: whites left, junk right, burn the junk. H, or the button: Help, Helium.',
    },
};
/** A column burns with a white in it (the still goes bang): the first time, and then any of these. The
    user (11 Nov): "just for the comedic layer ... occasionally, distilleries have been known to blow up". */
export const MISHAP = [
    'Oops. That happens sometimes. Don\'t worry about it.',
    'Bang. Yep. The still\'s fine. Mostly.',
    'That white\'s gone up the flue. Happens.',
    'Eyebrows grow back.',
    'Bit much heat. Or not enough. One of those.',
];
/** "Help, Helium" (H, or the button while you play): what she'd do now, and why, naming the technique,
    by the routine the planner picks for your board (src/distill-bots.ts, advise; the routines' names
    src/distill-routines.ts). Then she plays it on your board. */
export const HELP = {
    rescue: 'Save the whites. That one\'s heading for the fire. Pull it left.',
    junkColumn: 'Finish the junk column. All junk on the right, and it burns clean.',
    diamond: 'Just sweep. Junk right, whites left, long drags. Quick and dirty.',
    turnOver: 'Turn the right side over. Junk to the right, whites out of it. Like a pancake.',
    store: 'Store the junk. Blacks up top-left, browns bottom-left. Out of the way till later.',
    crawl: 'The crawl. Walk it across, swap by swap. Slow. Works.',
    figureEight: 'The figure of eight. Round it goes, and out the other side.',
    linePull: 'Pull a line of browns. Drag one and the line slides along with it.',
    leapfrog: 'The leapfrog. Black hops the brown, brown hops the white. Off it goes.',
    hook: 'The hook. Black and brown together, round the corner. My favourite.',
    channel: 'Channels. A clear lane on the right for the whites. Then it\'s all Crystal Clear.',
};
/** "Help, Helium" when it isn't a drag: burn now, wait, call it a day, or nothing to be done. */
export const HELP_ELSE = {
    burn: 'Burn it now. It\'s all junk. Why wait?',
    wait: 'Nothing worth doing. Let it cook.',
    dismiss: 'Call it. Bottle what we\'ve got.',
    stuck: 'Hm. Nothing. Even I\'m stumped. Burn something?',
    busy: 'Hang on, it\'s still moving.',
};
/** Each column you send up as a Crystal Clear chain grows, now and then; the flask full. */
export const PRAISE = {
    clear: ['Crystal Clear. That\'s the stuff.', 'Another! Keep them coming.', 'Ooh. Smooth.'],
    finished: 'Flask\'s full. That\'s a batch. Mischievious will want ten more.',
};
/** While you're within earshot of her island, before or after: round and round. */
export const AFTER = [
    'Big order of rum for Mischievious. Another wedding. She does keep getting married.',
    'Kikkit\'s been at the stash again. Explains her directions, really.',
    'Mind you, she was like that before she\'d had any. That\'s just Kikkit.',
    'Five distilleries, me. This is the quiet one.',
    'King, put that down. That\'s spice.',
    'Twelve Crystal Clears in a row and it just keeps going. Lovely.',
    'The still\'s only gone bang twice today. Good day.',
    'Space if you fancy a go at the still. I won\'t watch. Much.',
    'Whites left, junk right. That\'s most of it. The rest is just showing off.',
];
export const CHARACTER = {
    name: 'Helium',
    who: 'On a little island of her own out past the checkpoint, by the smugglers\' rocks, at a copper still with '
        + 'a board of Distilling on a stand beside it. A real Puzzle Pirates pirate (Helium of Emerald): Senior '
        + 'Officer of a crew of rum-makers, Revered at Distilling and Ultimate on the ocean, with distilleries on '
        + 'five islands and a tailoring stall beside Mischievious\'s. Drawn from her portrait: dark skin, white hair '
        + 'under a black cat-eared mask, an eyepatch, a gold hoop earring, a blue starfish on the cheek, a black '
        + 'Vampire raiment lined in gold, black pants, black fancy boots with plum tops, a hook for the left hand, '
        + 'and King, her plum monkey, on her shoulder.\n\n'
        + 'Teaches Distilling as if it were nothing: offhand, by the by, a maker proud of her brews and unbothered '
        + 'when the balance goes wrong and the still goes bang ("Oops. That happens sometimes. Don\'t worry about '
        + 'it."). A short lesson on a real board, then it\'s yours, and "Help, Helium" while you play: she reads '
        + 'your board, says what she\'d do and why, names the technique, and does it. Knows the others: a big '
        + 'order of rum for Mischievious\'s next wedding, Kikkit at her stash again.',
    theUser: [
        { on: '11 Nov', said: 'Maybe he\'s got a secret distillery operation going. If you find his house, he ... teaches you how to make some rum. But he\'s very kind of by the by' },
        { on: '11 Nov', said: 'occasionally, distilleries have been known to blow up ... So, oops, that happened sometimes. Don\'t worry about it.' },
        { on: '12 Nov', said: 'Him being in a hidden house, maybe he can just have his own little island ... I bet he just wants an island for him somewhere.' },
        { on: '12 Nov', said: 'I have a large shipment of rum for one of Mischievious\'s weddings, or Kikkit\'s been at the stash again.' },
        { on: '13 Nov', said: 'if you are joking about her drinking, that it\'s like, oh, ... explains her behaviour really, but hang on, ... she was like that before she\'s drunk ... she\'s not that way because she\'s drinking, she\'s just that way anyway.' },
        { on: '12 Nov', said: 'playing and be able to press a button that says help helium and he starts showing you some moves on how you could get yourself out of the situation.' },
        { on: '12 Nov', said: 'helium should kind of detect what stage you\'re at and show you what technique ... It\'s context aware.' },
    ],
    lines: [
        { when: 'Coming up off her island the first time: the still goes bang, and she shrugs it off (your lines between, src/lines/you.ts)', says: OPENING },
        { when: 'Her lesson begins, after her opening', says: GREET },
        {
            when: 'Her opening lesson at the still: in her bubble (says) and in the bar at the foot of the screen (note), beat by beat', says: LESSON,
            each: { rule: 'She swaps a white up past a black', ruleAfter: 'The rest of the rule', left: 'She drags a white left', furnace: 'She burns the all-black column', mishapSetup: 'She burns the next, a white in it (her mishap follows)', yours: 'Handing you the board' },
        },
        { when: 'A column burns with a white in it, and the still goes bang: the first time the first, then any', says: MISHAP },
        { when: '"Help, Helium" while you play: by the technique she\'d play on your board now (then she plays it)', says: HELP },
        { when: '"Help, Helium" when it isn\'t a drag', says: HELP_ELSE },
        { when: 'Now and then as your Crystal Clears go up, and when the flask\'s full', says: PRAISE },
        { when: 'While you\'re within earshot of her island: round and round', says: AFTER },
    ],
};
