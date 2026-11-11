/** Her greeting, starting her lesson: if you've not met Kikkit, or (`heard`) you've heard her out. */
export const GREET = {
    plain: 'Ahoy! Sailing, is it? Easy. It\'s just balloons.',
    heard: 'Let me guess. Kikkit? Five lefts and a penguin? Ha. Watch. It\'s just balloons.',
};
/** Her lesson, on a real Sailing board (src/balloons.ts's ROUTINES): a Double, then a Bingo, built
    the real way (YPPedia's Sailing strategy: a platform one target short, a line beside it whose pop
    drops a pegged partner into the gap). The user, 11 Nov: "She's helping you ... how to build doubles
    and bingos and things", and of a first go, "This is a tutorial, and she's just showing bodging
    moves": so she says what each balloon's for as she puts it down, the joke on top of the move,
    never instead of it. She sets each up, then hands you the last pair: "she sets up the balloons, you
    do the pop". A line as each act starts, one as each of her pairs is blown up, handing you yours,
    each time you miss (in turn), if she shows you after all, and once it's popped: her chatter, in her
    bubble.
    What's for you to do or watch is said apart from her chatter (the user, 11 Nov: "when she's telling
    me blue over the yellow and top the stack, that should be a lot clearer that it's just not her being
    a bit just chatting. It's an actual instruction to you, and it should be more prominent and
    persistent"): a note in a panel by her board, up till the next. `brief` as the act starts; `watch`,
    by her twist, once it's down and its mark's shown on the board (src/balloons.ts, marks: shown, then
    named); `task` on your go; `chain` once you've set it off. In plain words (the user: "she's using the
    right terminology, like the trigger or what triggers what. But ... that doesn't mean anything to
    most"): "trigger" only once the gap's been shown, and said what it is. */
export const DOUBLE = {
    start: 'First, a Double. A platform one short, and a line to set it off.',
    twists: [
        'Blow, blow, tie. Each balloon in a square of its own colour.',
        'Second row. Wrong colour in a square and it never pops.',
        'White in its square. Its blue partner goes beside it.',
        'Two more blues on top of that one. Up they go.',
    ],
    yours: 'Your go! That gap\'s the trigger: fill it last, and the whole lot pops.',
    again: [
        'Ooh, nearly! Here it is again. Follow the ghost.',
        'Not quite! The yellow sits on the blue till the blues pop. Again!',
        'So close. Go on, you\'ve got this!',
    ],
    help: 'Here, like this. Watch the yellow.',
    popped: 'Double! That\'s what zooms you over a whirlpool.',
    brief: 'The platform filling up: each balloon goes in a square of its own colour.',
    watch: {
        2: 'See the empty square? That\'s the gap. She leaves it empty on purpose.',
        3: 'Three blues stacked up. One more blue on top makes four in a line, and four in a line pop.',
    },
    task: 'Yellow over the gap, blue on top of the blues.',
    chain: '1, the four blues pop. 2, the yellow drops into the gap, and the platform pops.',
};
export const BINGO = {
    start: 'Now a Bingo: that Double, with another on top.',
    twists: [
        'Bottom one first, same as before. Puff, puff...',
        '...puff, puff...',
        '...white in, blue beside it...',
        '...three blues. Now, upstairs.',
        'Top one. I\'m leaving a gap in the middle again.',
        'White, blue, in their squares. I\'m getting dizzy.',
        'White on the corner. That starts the next stack.',
        'Three whites. That top gap\'s your trigger this time.',
        'This pair waits on the corner. Watch where it\'ll fall.',
    ],
    yours: 'Your go! Set off the lot.',
    again: [
        'Nearly! Here it is again. Follow the ghost.',
        'Not quite. Pop the whites, and the rest falls into place. Again!',
        'So close! Go on!',
    ],
    help: 'Like this. Then just watch it go.',
    popped: 'Bingo! Four pops in a row. Now go make a whirlpool jealous.',
    brief: 'The same Double at the bottom, then another platform on top of it.',
    watch: {
        3: 'Same as before: the gap, and three blues.',
        6: 'A gap in the top platform too. Nothing goes over it, so a balloon can drop straight in.',
        7: 'Three whites stacked up. One more white on top pops them.',
        8: 'This pair waits. When the top platform pops, it falls: blue onto the blues, yellow into the bottom gap.',
    },
    task: 'White on top of the whites, yellow over the top gap.',
    chain: '1, the whites pop. 2, the top platform. 3, the blues. 4, the bottom platform.',
};
/** When each of a lesson act's lines is said (LINES.md). */
const LESSON_EACH = {
    start: 'In her bubble, as it starts', twists: 'In her bubble, as she blows up each pair', yours: 'In her bubble, handing you your go',
    again: 'In her bubble, each time you miss', help: 'In her bubble, showing you after all', popped: 'In her bubble, once it\'s popped',
    brief: 'An instruction, in the panel by her board, as it starts', watch: 'Instructions, in the panel by her board, once her pair (counted from 0) is down',
    task: 'Your instruction on your go, in the panel by her board', chain: 'An instruction, in the panel by her board, once you\'ve set it off',
};
/** After her lesson, while you're within earshot: a tip now and then, round and round. */
export const AFTER = [
    'Space if you want it again. Balloons are cheap.',
    'Lines pop before platforms. So a line drops its partners into the gaps.',
    'A Double gets you over one whirly bit. The far side wants a Vegas.',
    'Kikkit\'s not wrong, you know. She\'s just... scenic about it.',
    'D\'rizzle ate a balloon once. Squeaked for a week.',
    'I\'m a Nap Specialist, officially. This is my awake bit.',
    'Never put a balloon in the wrong colour. It just sulks there.',
    'Every pop\'s a gust. Six in a row and you\'re gone.',
];
/** Racing you in the sloop race (src/den-rivals.ts): steady Sailing her own way (the user, 11 Nov: "[Tzz] goes
    another route"), hopping the Double's and the Triple's gaps on Doubles and Triples she builds on the move,
    and never firing a shot: it's just balloons. */
export const RACER = {
    how: 'Steady: Sailing on the move all the way, hopping the small gaps with Doubles and Triples timed to break '
        + 'as she\'s lined up. Never stops in the open, never fires.',
    route: 'doubles', style: 'peaceful', skill: 'decent',
    says: {
        start: ['Doubles. Pop, hop, pop, hop. Easy.', 'Shoot at me if you like. I\'ll be gone.'],
        won: ['Told you. It\'s just balloons.'],
        lost: ['Huh. Nap first, rematch after.'],
    },
};
export const CHARACTER = {
    name: 'Tzz',
    who: 'On a little island of her own a hop from Kikkit\'s, on the den\'s side of it, with a copper still behind '
        + 'her. A real Puzzle Pirates pirate (Tzz of Emerald): Senior Officer and "Nap Specialist" of Virtute et '
        + 'Armis, Princess of the flag Don\'t Open Till Doomsday; she built the huge multi-Vegas in the user\'s '
        + 'screenshot, in a competition. Drawn from her portrait: light brown hair tied back, an eyepatch, a gold '
        + 'hoop earring, a big grin, a ragged light blue Rag shirt off one shoulder, blue-and-white Stripy knickers '
        + 'to below the knee, a peg leg, and D\'rizzle on her shoulder, a red dragon with silver horns.\n\n'
        + 'The sensible one, after Kikkit: she shows you plainly how a big Vegas is built, as a street performer '
        + 'does balloons: each of Sailing\'s pieces a real balloon she blows up and ties off, squeak, played onto '
        + 'a real Sailing board beside her. A Double ("and that\'s what zooms you over a whirlpool"), then a Bingo, '
        + 'the real way: a platform one short, a line beside it whose pop drops its partner into the gap; '
        + 'every balloon in its own colour, breezily, a joke on each; she sets the balloons up and you drop the '
        + 'pair that pops it, egged on, and the chain goes off pop-pop-pop. That\'s why Sailing\'s pieces pop at '
        + 'all: they\'re balloons.',
    theUser: [
        { on: '10 Nov', said: 'Maybe Tzz can be on an island in there showing how she built her huge Vegas?' },
        { on: '11 Nov', said: 'like how someone does balloon animals, except that she\'s doing like a sailing version of balloon animals' },
        { on: '11 Nov', said: 'Say, look, it\'s simple. Look, you just do this, and this, and this, and this, and this. You set up this thing, and it pop, and then she pops it, and all the balloons go popping down' },
        { on: '11 Nov', said: 'It just makes sense of like, well, how on earth do these sailing pieces pop in the puzzle? It makes sense. They\'re balloon animals.' },
        { on: '11 Nov', said: 'Have it nearby because you want to run in to [Kikkit] first, because then it\'s like the point is you want to go find the other person to help you.' },
        { on: '11 Nov', said: 'it\'s not really a real looking sailing board ... it needs to be ... closer to the actual tutorial idea. She\'s helping you ... how to build doubles and bingos and things.' },
        { on: '11 Nov', said: 'it should definitely be like a now you try thing. And, you know, she sets up the balloons, you do the pop.' },
        { on: '11 Nov', said: 'I don\'t think they need to be aboard, to be honest. I like Kikkit just kind of on her island. It works.' },
        { on: '11 Nov', said: 'Maybe it would be simpler just to be like, they\'re balloons and she\'s blowing them up. Would that be easier? Maybe my balloon animal thing was a bit too complicated.' },
    ],
    lines: [
        { when: 'Sailing up to her island, her lesson begins (or Space there, again)', says: GREET, each: { plain: 'If you\'ve not heard Kikkit out', heard: 'If you have' } },
        { when: 'Her lesson\'s first act: she blows up a Double\'s balloons onto her board, and you drop the pair that pops it', says: DOUBLE, each: LESSON_EACH },
        { when: 'Her lesson\'s last act: a Bingo, that Double with another on top, the last pair yours', says: BINGO, each: LESSON_EACH },
        { when: 'After her lesson, while you\'re within earshot of her island: round and round', says: AFTER },
        { when: 'Racing you in the sloop race, over her sloop: on the starting line, and over the finish line first or after', says: RACER.says },
    ],
};
