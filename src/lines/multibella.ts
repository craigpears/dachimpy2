/* Pirate Den: Multibella's lines (src/lines/character.ts says how these files go). When she says them is
   js/den/wolfden-house.js's, in her wolf den's hut on her island (src/den-multibella.ts, src/den-wolfden.ts); her
   lesson's opening choice is src/wolf-den-tutorial.ts's. */
import type { Character } from './character.js';

/** In the hut, at her star table: over her head as things happen. */
export const WOLF_DEN = {
  hello: 'Oh, hi! Come in, come in. Cookie? They\'re choc chip. Pull up to the table, the stars won\'t chart themselves.',
  again: 'You\'re back! I saved you a cookie. Mostly.',
  table: 'Four rings here, not three. The outer one\'s for parking stars, to set up chains.',
  half: 'Half the pack turned back already. You got this!',
  last: 'That\'s the last of them, back to wolf-kin! Moon\'s down. Cookie to celebrate?',
  rise: 'Uh oh, here comes the next pack. Back to the stars!',
  chain: 'A chain! See the next one\'s centre? All wild. Any star will do.',
  plain: 'Charted! Finish the next one with a chain, it\'s worth way more.',
  booch: 'Oops, booched it. Happens to everyone. Deep breath, keep going.',
  bye: 'Bye! Take a cookie for the road.',
} as const;

/** Her lesson's opening choice and its words (src/wolf-den-tutorial.ts; js/tutorial-choice.js draws it). */
export const TUTOR = {
  hello: 'A wolf den\'s Navigation isn\'t the one you know. Let me show you.',
  basics: { asks: 'Want to start with what\'s different here?', then: 'What\'s different, then. Which bit?' },
  tricks: { asks: 'Or the chains that pay?', then: 'Chains! Pick one.' },
  run: { asks: 'Or shall I play you a run, start to finish?', then: 'A run, then. Watch closely.' },
  show: 'This one\'s {title}. I\'ll set it up, you watch the board.',
  after: 'Your board now. I\'ll be right here with the cookies.',
  afterNote: 'Chart what you can: each constellation turns werewolves back. T for her lessons again.',
} as const;

export const CHARACTER: Character = {
  name: 'Multibella',
  who: 'She teaches the wolf den\'s four-ring Duty Navigation at the star table in her hut, on an island of her own '
    + 'off to the right of the den. A real Puzzle Pirates pirate (Multibella of Emerald), drawn from her portrait: '
    + 'smiling, wavy blonde hair, a magenta tricorne edged in gold, a magenta vest with gold buttons over a rose '
    + 'shirt, magenta trousers and boots, and Divergent, her parrot, light blue and pink, on her shoulder.\n\n'
    + 'Kind and practical, and encouraging ("You got this!"): the one who explained the wolf den\'s wild places. She '
    + 'helps you set a chain up, then munches chocolate chip cookies while you finish it.',
  theUser: [
    { on: '11 Nov', said: 'Multibella is very sweet as well' },
    { on: '14 Nov', said: 'everyone loves cookies, so [Multibella] can be munching on choco chip cookies while they wait for you to finish what they\'ve helped you set up' },
    { on: '14 Nov', said: 'Thought the plan was for her to do the wolf den tutorial and would expect her to have her own island similar to others' },
  ],
  lines: [
    {
      when: 'In her wolf den\'s hut, at the star table (four-ring Duty Navigation)', says: WOLF_DEN,
      each: {
        hello: 'You come in, the first time',
        again: 'You come in again',
        table: 'You first step up to the table',
        half: 'Your charts turn half the pack back',
        last: 'Your charts turn the last werewolf back: the moon\'s gone',
        rise: 'A moment later: the moon\'s full again',
        chain: 'You chart a constellation in a chain',
        plain: 'You chart one with no chain (now and then)',
        booch: 'You booch',
        bye: 'You leave',
      },
    },
    {
      when: 'Her lesson\'s opening choice, at the star table (T)', says: TUTOR,
      each: { hello: 'Her opening line', basics: 'Her first question, and once it\'s picked', tricks: 'Her second, and once it\'s picked', run: 'Her third, and once it\'s picked', show: 'As a lesson\'s board is laid ({title} its name)', after: 'Handing you the board', afterNote: 'Under it, in the bar' },
    },
  ],
};
