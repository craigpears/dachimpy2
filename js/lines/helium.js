/** Coming up off their island the first time (src/den-helium.ts, opening): a white goes down the furnace
    on their board as you arrive, the still goes bang, and they treat it as an everyday thing. The user (12 Nov): "the distillery exploding and Helium
    just treating it as kind of a casual everyday event, just like, oh, sorry, just a little distilling
    mishap ... would you like me to teach you some distilling", then, to your "is it safe?", "of course it's
    safe. What would make you think it's not safe? This is perfectly normal. It's fine." And the eyebrows:
    "none of us have got eyebrows ... I keep asking the developers for some, but I've not gotten them yet"
    (true: no pirate in Puzzle Pirates has any, checked on Helium's and Roobear's portraits, 12 Nov; it only
    sounds like the bangs took them). Then (13 Nov): "maybe there should be a bit more of a link in the
    initial dialogue to the idea of just make sure you don't send any white pieces down into the burner": the
    mishap was a white let go down, and the one thing to know, said in passing, is don't. Your lines between
    are src/lines/you.ts's AT_HELIUMS. */
export const OPENING = {
    mishap: 'Oh. Sorry about that. Let a white go down the furnace. Just a little distilling mishap.',
    offer: 'Would you like me to teach you some distilling? While you\'re here.',
    safe: 'Of course it\'s safe. Just don\'t send whites down the furnace. Perfectly normal, this. It\'s fine.',
    brows: 'None of us have got eyebrows. I keep asking the developers for some. Nothing yet.',
};
/** Their lesson, on a real board at their still after their opening (src/den-helium.ts, lessonPlan): a line in
    their bubble (`says`), and what it shows in plain words, in the bar at the foot of the screen (`note`).
    No basics (the user, 13 Nov: "basic move mechanics ... Puzzle Pirates does that. That tutorial exists"):
    step one (STEP_ONE, below), then it's yours. */
export const LESSON = {
    yours: {
        says: 'Right, your go. Keep those three clear of white. H if you want me, F to hold the fire. I\'ll be here. Probably.',
        note: 'Your go: keep the three right-hand columns clear of white, and burn them once they\'re all junk. H: Help, Helium. G: a hint. W: watch Helium play. F: hold the fire, X: burn by hand.',
    },
};
/** Step one, the first of the puzzle's steps (src/den-helium.ts, STEPS), straight after their opening showed
    what comes of skipping it: the three columns next to the fire cleared of every white, each ringed on the
    board. The user (13 Nov): "step one is getting a few columns on the right-hand side that are about to burn
    completely free of white pieces ... because otherwise, yeah, the furnace blows up and, you know, I've
    already got no eyebrows", and later "First things first. See all these whites on the right, you know,
    highlight them all. Right, we want to get them out of the way because ... otherwise ... silly mishaps
    happen." `says` as it starts, `clear` as they drag the whites out, `why` after, `note` in the bar, `done`
    when you've cleared them yourself, `goal` in the bar while you play. */
export const STEP_ONE = {
    says: 'Right. First things first. See all these whites on the right? Next in the fire, every one.',
    clear: 'So out of the way they go. Left, away from the fire, swap by swap.',
    why: 'Otherwise, silly mishaps. Bang. And I\'ve already got no eyebrows.',
    note: 'Step 1: get every white (ringed) out of the three right-hand columns, the next to burn.',
    done: 'There. Step one. Nothing on the fire\'s side worth losing.',
    goal: 'Step 1: clear the whites out of the 3 right-hand columns',
};
/** Sending you on to other pirates (the user, 13 Nov: "the greatest love of the game is talking to other
    pirates ... this is not a replacement for the game ... this is a tool, a side adventure ... We should be
    watching people, looking at YouTube videos, talk to people"): said once you've done step one yourself,
    after `done` (src/den-helium.ts, stepDoneLines). Offhand, as everything they say. */
export const ONWARD = 'Few of my tricks, that. The rest\'s from other pirates. Ask about. Watch them play. Find their videos.';
/** And always the last thing they say when a lesson ends, after ONWARD (the user, 13 Nov: "to really mess with
    Helium, I feel like we should always end with, if you got any questions, you can always send me a tell on
    Emerald"). The real Helium, on Emerald, can expect a few tells. */
export const TELL = 'Any questions, send me a tell on Emerald. Any time.';
/** At your still, getting nervous as a white sits in the furnace's column and the fire comes round (the user,
    13 Nov: "imagine Helium getting nervous if you're not really clearing out the whites, because Helium's going
    to be nervous that the distiller is going to have a mishap"). For all their "perfectly normal", it's their
    still. `uneasy` with a while to go, `panic` just before it burns (they cower), `phew` if you get it out in
    time after all: each in turn, round again. */
export const NERVES = {
    uneasy: [
        'Er. That end column. Still a white in it.',
        'You do see that white, yes? Right by the fire.',
        'Hm. White by the furnace. Just saying. No pressure.',
        'Not to fuss, but. That white.',
    ],
    panic: [
        'White! White! The fire!',
        'Get it out, get it out, get it out...',
        'Oh no. Oh no no no. My eyebrows. Again.',
        'It\'s going to go. It\'s going to GO.',
    ],
    phew: [
        'Phew. Fine. Totally fine. Wasn\'t worried.',
        'There. See? Perfectly normal. I knew you had it.',
        'Ha. Right. Good. Breathing again.',
    ],
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
    /** The path search (src/distill-path.ts): a piece brought round into a stuck one's place, a piece moved out
        of the way first when nothing reaches it. */
    path: 'Shift that one first. Then there\'s a way through.',
};
/** "Help, Helium" when it isn't a drag: burn now, wait, call it a day, or nothing to be done. */
export const HELP_ELSE = {
    burn: 'Burn it now. It\'s all junk. Why wait?',
    wait: 'Nothing worth doing. Let it cook.',
    dismiss: 'Call it. Bottle what we\'ve got.',
    stuck: 'Hm. Nothing. Even I\'m stumped. Burn something?',
    busy: 'Hang on, it\'s still moving.',
};
/** The phase they think the game's in (src/distill-phase.ts), and what they're working towards, said as it starts
    when they play your board for you to watch (`first`; `again` back in one they've said already: a burned column
    brings a new one onto the fire's side every column or so), and as a hint's line (`first`). The user (13 Nov):
    "first of all, you know, I'm going to try and get rid of all the white pieces in all these columns, and then
    just kind of step by step what you're thinking based on the whatever technique or strategy". */
export const PHASE = {
    fire: {
        first: 'First things first: the whites out of these three. Away from the fire.',
        again: 'New column, new whites. Out of the fire\'s side first.',
    },
    fill: {
        first: 'Fire\'s side is clear. Now fill the right-hand columns with junk. Long drags.',
        again: 'Clear again. Back to piling junk on the right.',
    },
    block: {
        first: 'Whites mostly left now. So blocks: big drags, the junk round them in a V.',
        again: 'Back to blocks. Big drags. Keep the V.',
    },
    chain: {
        first: 'Plenty of whites banked. Now the chain: Crystal Clears, one after another.',
        again: 'Back on the chain. Whites right.',
    },
};
/** Playing your board for you to watch (W, or the button), before each move: the technique and why, in a line,
    their own hand (the arrow's up just before they drag). `again` when it's the same as the move before. */
export const WATCH = {
    start: 'Right, watch. I\'ll say what I\'m doing. Esc, or a move of yours, and it\'s yours.',
    rescue: 'That white\'s near the fire. Pulling it left.',
    junkColumn: 'Finishing this junk column. Black on top, so it burns.',
    diamond: 'Just a sweep. Junk right, whites left. Quick and dirty.',
    turnOver: 'Turning the right side over. Whites out of the junk.',
    store: 'Storing this one. Blacks top-left, browns bottom-left. For later.',
    crawl: 'A crawl. Black and brown together, a swap at a time.',
    figureEight: 'Figure of eight. Round each other, through the whites.',
    linePull: 'Pulling a line of browns. One drag, the lot slides.',
    leapfrog: 'Leapfrog. The black hops along the browns.',
    hook: 'The hook. Black down, round the brown. My favourite.',
    channel: 'Channels. Whites up through blacks, down through browns. Right.',
    path: 'That one\'s stuck. Bringing a piece round into its place.',
    burn: 'All junk. Burn it. No point waiting.',
    wait: 'Nothing worth doing. Let it cook a bit.',
    dismiss: 'That\'s the chain done. I\'d bottle it here. Your call.',
    stuck: 'Hm. Nothing. Even I\'m stumped.',
    again: ['Same again.', 'And another.', 'More of that.', 'Again. Works, doesn\'t it?'],
    done: 'Your board. Off you go.',
};
/** A hint (G, or the button): the next drag or two drawn on your board as arrows, not played, their line the
    phase and what they're working towards (PHASE's `first`). When they're nervous about a white by the fire and
    show the pieces that could take its place, the bar says so (`routes`). */
export const HINT = {
    routes: 'Blue arrows: pieces that could take that white\'s place. Then it drops out left.',
    none: 'Nothing worth showing. Let it cook.',
};
/** Holding the fire (F) to take it slowly, burning by hand (X) (the user, 13 Nov: "Should have the ability to pause
    auto burning and burn manually if you'd like to slow down, helium should reference the keyboard shortcuts for
    it at points"): as you hold it (`held`) and let it go (`going`), and in the bar; `tip`, said after they panic
    the first time or two in a while, the keys for slowing down. */
export const FIRE = {
    held: 'Fire\'s held. Take your time. X burns the end column when you\'re ready.',
    going: 'Fire\'s back on. Fifteen seconds a column, mind.',
    heldNote: 'The fire\'s held: nothing burns till you press X. F lets it go again.',
    goingNote: 'The fire\'s on: the end column burns every 15 seconds. F holds it.',
    tip: 'Psst. F holds the fire. X burns when you\'re ready. No shame in it.',
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
    'Ask about, mind. Other pirates know tricks I\'ve never seen.',
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
        { on: '13 Nov', said: 'to really mess with Helium, I feel like we should always end with, if you got any questions, you can always send me a tell on Emerald.' },
        { on: '13 Nov', said: 'as well as helium helping, they can be hinting as well, so it shows you the path. Of what the next moves are they would do. And maybe ... plans out a few of like, well, this is the thing I will do at this part of the game' },
        { on: '13 Nov', said: 'when he\'s kind of highlighting the white pieces, yeah, maybe it should show some arrows of nearby routes of pieces that can be dragged into the spots' },
        { on: '13 Nov', said: 'the watch helium play option where he explains, well, you know, first of all, you know, I\'m going to try and get rid of all the white pieces in all these columns, and then just kind of step by step what you\'re thinking based on the whatever technique or strategy' },
        { on: '13 Nov', said: 'helium said to teach you some tricks, but ... don\'t forget, you know, the greatest love of the game is talking to other pirates ... this is not a replacement for the game ... this is a tool, a side adventure ... We should be watching people, looking at YouTube videos, talk to people, just whatever.' },
    ],
    lines: [
        { when: 'Coming up off their island the first time: the still goes bang, and they shrug it off (your lines between, src/lines/you.ts)', says: OPENING },
        { when: 'Their lesson\'s step one, straight after their opening, the whites on the fire\'s side ringed: as it starts (says), as they drag the whites out of the three columns next to the fire (clear), why (why), in the bar (note); when you\'ve cleared them yourself (done); your goal in the bar while you play (goal)', says: STEP_ONE },
        { when: 'Once you\'ve done step one yourself, after their "done": the rest is from other pirates', says: [ONWARD] },
        { when: 'The last thing they say when a lesson ends, always, after the other pirates', says: [TELL] },
        {
            when: 'The end of their lesson: in their bubble (says) and in the bar at the foot of the screen (note)', says: LESSON,
            each: { yours: 'Handing you the board, step one the goal' },
        },
        {
            when: 'At your still, a white left in the furnace\'s column as the fire comes round: uneasy with a while to go, panic just before (they cower), phew if you get it out in time; each in turn', says: NERVES,
            each: { uneasy: 'About 9 seconds before it burns', panic: 'About 3 seconds before', phew: 'You got the white out in time, after they\'d got nervous' },
        },
        { when: 'At your still, a column burns with a white in it, and the still goes bang: the first time the first, then any', says: MISHAP },
        { when: '"Help, Helium" while you play: by the technique they\'d play on your board now (then they play it)', says: HELP },
        { when: '"Help, Helium" when it isn\'t a drag', says: HELP_ELSE },
        {
            when: 'The phase they think the game\'s in, and what they\'re working towards: as it starts while they play your board for you to watch (first; again, back in one already said), and a hint\'s line (first)', says: PHASE,
            each: { fire: 'Whites on the fire\'s side, the three columns next to it', fill: 'The fire\'s side clear, colour all over', block: 'The whites mostly left', chain: 'The chain' },
        },
        { when: 'Playing your board for you to watch: as it starts (start), before each move the technique and why (again when it\'s the same as the move before), and as they hand it back (done)', says: WATCH },
        {
            when: 'Holding the fire (F) to take it slowly and burning by hand (X): their line and the bar\'s as you hold it and let it go; the tip after they panic the first time or two', says: FIRE,
            each: { held: 'You hold the fire', going: 'You let it go again', heldNote: 'In the bar, held', goingNote: 'In the bar, let go', tip: 'After their panic, the first time or two' },
        },
        { when: 'A hint: the bar when the arrows show the pieces that could take a white\'s place by the fire (routes), or there\'s nothing to show (none)', says: HINT },
        { when: 'Now and then as your Crystal Clears go up, and when the flask\'s full', says: PRAISE },
        { when: 'While you\'re within earshot of their island: round and round', says: AFTER },
    ],
};
