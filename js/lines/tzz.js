/** Her greeting, starting her lesson: if you've not met Kikkit, or (`heard`) you've heard her out. */
export const GREET = {
    plain: 'Ahoy! Sailing, is it? Easy. It\'s just balloon animals.',
    heard: 'Let me guess. Kikkit? Five lefts and a penguin? Ha. Watch. It\'s just balloon animals.',
};
/** Her lesson, on a real Sailing board (src/balloons.ts's ROUTINES): a Double, then a Bingo, then a
    Vegas, each a staircase of ledges a little higher (the user, 11 Nov: "She's helping you ... how to
    build doubles and bingos and things"). She sets each up, then hands you the last pair: "she sets up
    the balloons, you do the pop". A line as each act starts, one as each of her pairs is twisted,
    handing you yours, each time you miss (in turn), if she shows you after all, and once it's popped. */
const AGAIN = [
    'Ooh, so close. Again! Right in the gap, the colour it wants.',
    'Not quite! Steer it under, top ledge, top right. You\'ve got this.',
    'Nearly! Look at the colour the gap wants. Again!',
];
export const DOUBLE = {
    start: 'First, a Double. Two ledges, one over the other. Watch the balloons.',
    twists: [
        'One on the bottom ledge\'s floor. Its spare goes beside it, under the gap...',
        'one on the top ledge\'s floor. Its spare\'s the colour the bottom gap wants...',
    ],
    yours: 'Your turn! Fill the top ledge\'s gap. A D move, W turns, S drops.',
    again: AGAIN,
    help: 'Here, like this. Watch.',
    popped: 'Double! The top ledge pops and drops its spare in the next gap, that pops. That\'s what zooms you over a whirlpool.',
};
export const BINGO = {
    start: 'Now a Bingo. Same trick, four ledges high.',
    twists: [
        'Bottom ledge...',
        'next one up, its spare the colour the gap below wants...',
        'next one up, same again...',
        'top ledge, same again...',
    ],
    yours: 'Go on, then. Fill the top gap.',
    again: AGAIN,
    help: 'Like this. See?',
    popped: 'Bingo! Four pops. Each ledge drops one into the next. Stairs, see?',
};
export const VEGAS = {
    start: 'And a Vegas. It\'s simple, look.',
    twists: ['This,', 'and this,', 'and this,', 'and this,', 'and this,', 'and this...'],
    yours: '...and you do the pop!',
    again: AGAIN,
    help: 'Like this! Pop!',
    popped: 'Vegas! Six pops, one long whoosh. That\'s all a Vegas is.',
};
/** After her lesson, while you're within earshot: a tip now and then, round and round. */
export const AFTER = [
    'Space if you want it again. Balloons are cheap.',
    'Ledges pop last. So stack them like stairs, and each one drops into the next.',
    'A Double gets you over one whirly bit. The far side wants a Vegas.',
    'Kikkit\'s not wrong, you know. She\'s just... scenic about it.',
    'D\'rizzle ate a balloon once. Squeaked for a week.',
    'I\'m a Nap Specialist, officially. This is my awake bit.',
    'R gets you Sailing. Twist away.',
    'Every pop\'s a gust. Six in a row and you\'re gone.',
];
export const CHARACTER = {
    name: 'Tzz',
    who: 'On a little island of her own a hop from Kikkit\'s, on the den\'s side of it, with a copper still behind '
        + 'her. A real Puzzle Pirates pirate (Tzz of Emerald): Senior Officer and "Nap Specialist" of Virtute et '
        + 'Armis, Princess of the flag Don\'t Open Till Doomsday; she built the huge multi-Vegas in the user\'s '
        + 'screenshot, in a competition. Drawn from her portrait: light brown hair tied back, an eyepatch, a gold '
        + 'hoop earring, a big grin, a ragged light blue Rag shirt off one shoulder, blue-and-white Stripy knickers '
        + 'to below the knee, a peg leg, and D\'rizzle on her shoulder, a red dragon with silver horns.\n\n'
        + 'The sensible one, after Kikkit: she shows you plainly how a big Vegas is built, as a street performer '
        + 'twists balloon animals: real balloons, squeak by squeak, into Sailing\'s pieces, played onto a real '
        + 'Sailing board beside her. A Double ("and that\'s what zooms you over a whirlpool"), a Bingo, then a '
        + 'Vegas, breezily ("it\'s simple, look, this, and this..."); she sets the balloons up and you drop the '
        + 'pair that pops it, egged on, and the chain goes off pop-pop-pop. That\'s why Sailing\'s pieces pop at '
        + 'all: they\'re balloon animals.',
    theUser: [
        { on: '10 Nov', said: 'Maybe Tzz can be on an island in there showing how she built her huge Vegas?' },
        { on: '11 Nov', said: 'like how someone does balloon animals, except that she\'s doing like a sailing version of balloon animals' },
        { on: '11 Nov', said: 'Say, look, it\'s simple. Look, you just do this, and this, and this, and this, and this. You set up this thing, and it pop, and then she pops it, and all the balloons go popping down' },
        { on: '11 Nov', said: 'It just makes sense of like, well, how on earth do these sailing pieces pop in the puzzle? It makes sense. They\'re balloon animals.' },
        { on: '11 Nov', said: 'Have it nearby because you want to run in to [Kikkit] first, because then it\'s like the point is you want to go find the other person to help you.' },
        { on: '11 Nov', said: 'it\'s not really a real looking sailing board ... it needs to be ... closer to the actual tutorial idea. She\'s helping you ... how to build doubles and bingos and things.' },
        { on: '11 Nov', said: 'it should definitely be like a now you try thing. And, you know, she sets up the balloons, you do the pop.' },
        { on: '11 Nov', said: 'I don\'t think they need to be aboard, to be honest. I like Kikkit just kind of on her island. It works.' },
    ],
    lines: [
        { when: 'Sailing up to her island, her lesson begins (or Space there, again)', says: GREET, each: { plain: 'If you\'ve not heard Kikkit out', heard: 'If you have' } },
        { when: 'Her lesson\'s first act: she twists a Double onto her board, and you drop the pair that pops it', says: DOUBLE },
        { when: 'Her lesson\'s second act: a Bingo, four ledges high, the last pair yours', says: BINGO },
        { when: 'Her lesson\'s last act: a Vegas, six ledges high, the last pair yours', says: VEGAS },
        { when: 'After her lesson, while you\'re within earshot of her island: round and round', says: AFTER },
    ],
};
