/* Pirate Den: the penguin in the balaclava (src/lines/character.ts says how these files go), out past
   Kikkit's whirlpools and their winds, where she said he'd be. He doesn't speak: these are what's said
   when you get to him, by js/den/whirlpools.js. */
import type { Character } from './character.js';

/** What's said as you get there. */
export const OF_HIM = {
  through: 'Through the reef by the whirlpools! The open sea beyond',
  penguins: 'Penguins! A whole colony of them, out past the whirlpools',
  balaclava: 'And one of them\'s in a balaclava. He\'s up to something',
} as const;

export const CHARACTER: Character = {
  name: 'The penguin in the balaclava',
  who: 'One of a colony of penguins on a floe out past Kikkit\'s whirlpools and their winds, beyond the reef: '
    + 'the bigger prize, only a Vegas carries you there. Exactly where she said, and in a balaclava, as she '
    + 'said, sneaking about the floe with a sack over his shoulder, up to something.\n\n'
    + 'He doesn\'t speak: his lines are what\'s said as you get to him.',
  theUser: [
    { on: '11 Nov', said: 'there\'s a penguin in the middle, so it gives you a bit of a reward' },
    { on: '11 Nov', said: 'Maybe a small combo gets you through the reef, with the penguins being the bigger prize after.' },
  ],
  lines: [
    {
      when: 'Getting through her whirlpools', says: OF_HIM,
      each: {
        through: 'A small chain from the mouth carries her clean over the reef\'s gap and out past the reef',
        penguins: 'A Vegas carries her clean over the winds that feed the whirlpools, into the penguins\' water',
        balaclava: 'Just after, as he freezes and looks round at her',
      },
    },
  ],
};
