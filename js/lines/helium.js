/** Coming up off their island the first time (src/den-helium.ts, opening): the still goes bang as you
    arrive, and they treat it as an everyday thing. The user (12 Nov): "the distillery exploding and Helium
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
/** Their lesson begins, after their opening. */
export const GREET = 'Right then. Distilling. Nothing to it. Watch.';
/** Their opening lesson, on a real board at their still (src/den-helium.ts, lessonPlan): a line in their bubble
    as each beat starts (`says`), and what it shows in plain words, in the bar at the foot of the screen
    (`note`). The swap rule, whites left and junk right, the furnace's column burned, and a white burned
    with it: their mishap. Then it's yours. */
export const LESSON = {
    rule: {
        says: 'One rule. The lower piece beats the upper one: white floats up past black.',
        note: 'The swap rule: a piece swaps up past the one it beats. White beats black, brown beats white, black beats brown.',
    },
    ruleAfter: {
        says: 'Brown past white, black past brown. Round and round. Can\'t swap it straight back, mind.',
        note: 'White over black, brown over white, black over brown: like rock, paper, scissors.',
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
        says: 'Right, your go. Keep those three clear of white. H if you want me. I\'ll be here. Probably.',
        note: 'Your go: keep the three right-hand columns clear of white, and burn them once they\'re all junk. H: Help, Helium.',
    },
};
/** Step one, the first of the puzzle's steps (src/den-helium.ts, STEPS), after the mishap shows what comes of
    skipping it: the three columns next to the fire cleared of every white. The user (13 Nov): "step one is
    getting a few columns on the right-hand side that are about to burn completely free of white pieces ...
    because otherwise, yeah, the furnace blows up and, you know, I've already got no eyebrows." `says` as it
    starts, `clear` as they drag the whites out, `why` after, `note` in the bar, `done` when you've cleared
    them yourself, `goal` in the bar while you play. */
export const STEP_ONE = {
    says: 'Which is step one, really. The three columns next to the fire: no whites in them. None.',
    clear: 'Whites go left, away from the fire. Walk them out, swap by swap. Junk steps the other way.',
    why: 'Otherwise the still goes bang. And I\'ve already got no eyebrows.',
    note: 'Step 1: clear every white out of the three right-hand columns, the next to burn.',
    done: 'There. Step one. Nothing on the fire\'s side worth losing.',
    goal: 'Step 1: clear the whites out of the 3 right-hand columns',
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
/** "Help, Helium" (H, or the button while you play): what they'd do now, and why, naming the technique,
    by the routine the planner picks for your board (src/distill-bots.ts, advise; the routines' names
    src/distill-routines.ts). Then they play it on your board. */
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
/** While you're within earshot of their island, before or after: round and round. */
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
    who: 'On a little island of their own out past the checkpoint, by the smugglers\' rocks, at a copper still with '
        + 'a board of Distilling on a stand beside it. A real Puzzle Pirates pirate (Helium of Emerald): Senior '
        + 'Officer of a crew of rum-makers, Revered at Distilling and Ultimate on the ocean, with distilleries on '
        + 'five islands and a tailoring stall beside Mischievious\'s. Drawn from their portrait: dark skin, white hair '
        + 'under a black cat-eared mask, an eyepatch, a gold hoop earring, a blue starfish on the cheek, a black '
        + 'Vampire raiment lined in gold, black pants, black fancy boots with plum tops, a hook for the left hand, '
        + 'and King, their plum monkey, on their shoulder.\n\n'
        + 'Teaches Distilling as if it were nothing: offhand, by the by, a maker proud of their brews and unbothered '
        + 'when the balance goes wrong and the still goes bang ("Oops. That happens sometimes. Don\'t worry about '
        + 'it."). A short lesson on a real board, then it\'s yours, and "Help, Helium" while you play: they read '
        + 'your board, say what they\'d do and why, name the technique, and do it. Knows the others: a big '
        + 'order of rum for Mischievious\'s next wedding, Kikkit at their stash again.',
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
        { when: 'Coming up off their island the first time: the still goes bang, and they shrug it off (your lines between, src/lines/you.ts)', says: OPENING },
        { when: 'Their lesson begins, after their opening', says: GREET },
        {
            when: 'Their opening lesson at the still: in their bubble (says) and in the bar at the foot of the screen (note), beat by beat', says: LESSON,
            each: { rule: 'They swap a white up past a black', ruleAfter: 'The rest of the rule', furnace: 'They burn the all-black column', mishapSetup: 'They burn the next, a white in it (their mishap follows)', yours: 'Handing you the board, step one the goal' },
        },
        { when: 'Their lesson\'s step one, after the mishap: as it starts (says), as they drag the whites out of the three columns next to the fire (clear), why (why), in the bar (note); when you\'ve cleared them yourself (done); your goal in the bar while you play (goal)', says: STEP_ONE },
        { when: 'A column burns with a white in it, and the still goes bang: the first time the first, then any', says: MISHAP },
        { when: '"Help, Helium" while you play: by the technique they\'d play on your board now (then they play it)', says: HELP },
        { when: '"Help, Helium" when it isn\'t a drag', says: HELP_ELSE },
        { when: 'Now and then as your Crystal Clears go up, and when the flask\'s full', says: PRAISE },
        { when: 'While you\'re within earshot of their island: round and round', says: AFTER },
    ],
};
