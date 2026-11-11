/* Pirate Den: Tzz's lines (src/lines/character.ts says how these files go). When she says them is
   src/den-tzz.ts's (TZZ_CAST: her balloon lesson, src/balloons.ts's show, then her chatter, played by
   src/chatter.ts); js/den/balloon-isle.js shows them over her head.

   The sensible one after Kikkit (the user, 11 Nov): someone who can "explain how to get past all
   these ... whirlpools and winds that makes a bit more sense, or goes on fewer tangents". She shows
   Sailing like a street performer: "she's teaching you how to make a double that makes the ship go
   ... and zoom over the whirlpool ... You set up this thing, and it pop, and then she pops it". First
   twisting balloon animals, then, simpler (11 Nov): "Maybe it would be simpler just to be like,
   they're balloons and she's blowing them up": each of Sailing's pieces a balloon she blows up. Breezy,
   quick, a bit smug about how easy it is. Each line's a bubble over her head: kept short, on a phone
   too. */
import type { Character } from './character.js';

/** Her greeting, starting her lesson: if you've not met Kikkit, or (`heard`) you've heard her out. */
export const GREET = {
  plain: 'Ahoy! Sailing, is it? Easy. It\'s just balloons.',
  heard: 'Let me guess. Kikkit? Five lefts and a penguin? Ha. Watch. It\'s just balloons.',
} as const;

/** Her lesson, on a real Sailing board (src/balloons.ts's ROUTINES): a Double, then a Bingo, built
    the real way (YPPedia's Sailing strategy: a platform one target short, a line beside it whose pop
    drops a pegged partner into the gap). The user, 11 Nov: "She's helping you ... how to build doubles
    and bingos and things", and of a first go, "This is a tutorial, and she's just showing bodging
    moves": so she says what each balloon's for as she puts it down, the joke on top of the move,
    never instead of it. She sets each up, then hands you the last pair: "she sets up the balloons, you
    do the pop". A line as each act starts, one as each of her pairs is blown up, handing you yours,
    each time you miss (in turn), if she shows you after all, and once it's popped. */
export const DOUBLE = {
  start: 'First, a Double. A platform one short, and a line to set it off.',
  twists: [
    'Blow, blow, tie. Each balloon the colour its square wants.',
    'Second row. Wrong colour in a square and it never pops.',
    'White in its square. Its blue partner starts a stack.',
    'Two more blues. Three, and the platform one short. See?',
  ],
  yours: 'Your go! Blue on the blues, yellow over the gap.',
  again: [
    'Ooh, nearly. Blue on the blue stack, yellow over the gap. Again!',
    'Not quite! The yellow hangs on the blue till the blues pop. Again!',
    'So close. Four blues pop, then the yellow drops in. Go on!',
  ],
  help: 'Here, like this. Watch the yellow.',
  popped: 'Double! Blues pop, the yellow drops in, the platform pops. That\'s what zooms you over a whirlpool.',
} as const;
export const BINGO = {
  start: 'Now a Bingo: that Double, with another on top.',
  twists: [
    'Bottom one first, same as before. Puff, puff...',
    '...puff, puff...',
    '...white in, blue on the floor...',
    '...three blues. Now, upstairs.',
    'Top one, gap in the middle. Keep that column clear.',
    'White, blue, in their squares. I\'m getting dizzy.',
    'White on the corner. That\'s my next stack.',
    'Three whites. One short, see? That\'s your trigger.',
    'Park this: yellow on the corner, blue hanging over the blues.',
  ],
  yours: 'Your go: white on the whites, yellow over the top gap.',
  again: [
    'Nearly! White on the white stack, yellow over the top gap.',
    'Not quite. Pop the whites, and the rest falls into place. Again!',
    'So close! The yellow hangs on the white till the whites pop. Go on!',
  ],
  help: 'Like this. Then just watch it go.',
  popped: 'Bingo! Whites, top platform, my pair drops, blues, bottom platform. Now go make a whirlpool jealous.',
} as const;

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
] as const;

export const CHARACTER: Character = {
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
    { when: 'Her lesson\'s first act: she blows up a Double\'s balloons onto her board, and you drop the pair that pops it', says: DOUBLE },
    { when: 'Her lesson\'s last act: a Bingo, that Double with another on top, the last pair yours', says: BINGO },
    { when: 'After her lesson, while you\'re within earshot of her island: round and round', says: AFTER },
  ],
};
