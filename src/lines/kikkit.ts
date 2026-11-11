/* Pirate Den: Kikkit's lines (src/lines/character.ts says how these files go). When she says them is
   src/den-kikkit.ts's (Kikkit); js/den/kikkit.js shows them over her head on her island.

   Every bit of her nonsense is literally true (the user, 10 Nov: "it's got to actually make some
   mechanical sense so that it's more funny and literal"): her ramble is the real way through her
   whirlpools (LAY.KIKKIT in src/den-sail.ts), and tests/den-kikkit.test.ts checks the turns she
   counts are the turns they make. Set off from just off her island, the pointy end at the reef; the
   little whirlpool in the reef spins her right round (the left, the left, the left, the left); out
   the other side of the reef; then the big ones, a left (her fifth), a double backflip and a right,
   only a Vegas big enough to carry her over them ("whoosh ... really, really big and really
   sparkly"), to the penguins. And landing in a whirlpool, it's too many lefts: back on her island. */
import type { Character } from './character.js';

/** Her ramble, the first time you sail up to her island (and again if you hail her): in order. */
export const RAMBLE = [
  'Ooh, hello! Have you seen a penguin? I really, really want a penguin.',
  'I saw one over there. Through the whirly bits. I can\'t remember which way I went.',
  'Maybe I took five lefts and a right? Or was it five rights and a left?',
  'I set off from just there. Pointy end at the reef. That bit I remember.',
  'Then a left, the left, the left, the left, and just spinning. Everything was just spinning.',
  'And I popped out the other side of the reef! Hee hee! Easy peasy.',
  'Then the big whirly ones. A left. Then a double backflip. Well, that\'s what I get. Then a right.',
  'I kind of remember going in the sailing puzzle, doing some sailing, and then... WHOOSH!',
  'It got really, really big and really sparkly and awesome, and I ended up with a penguin!',
  'And he was wearing a balaclava. Up to something, he was. You can always tell.',
  'But then I took a few lefts. Too many lefts. And I ended up back on this island.',
] as const;

/** Hailed again once she's told it all: off on a tangent, now and then a bit of the real way in it. */
export const TANGENTS = [
  'Rodrigo says hello. Rodrigo is a monkey. He says lots of things.',
  'The little whirly one, any old whoosh does. The big ones want a really, really big whoosh.',
  'Did you count your lefts? I count mine. I lose count at about one.',
  'I named my ship after Rodrigo. He wanted it named after a banana.',
  'Seven! It was seven of something. Squares? Whooshes? Sparkles? Seven sparkles.',
  'Have some of my jug. No? More for me, then. Hic.',
  'Penguins are just very small admirals. Think about it.',
] as const;

/** Too many lefts: you're back on her island, and she finds it hilarious (a new line each time,
    short: a joke, never a wait). `out`: once you'd got through the reef and came back by the big
    whirlpools. */
export const BACK = [
  'Hee hee! Too many lefts! I told you!',
  'Whee! Round and round and round! Back again!',
  'Spat out like a pip! Hee hee! Again! Again!',
  'Ooh, you went all spinny. I went all spinny too. Still a bit spinny, actually.',
  'Back so soon? The whirly bits like you. They like me too. Too much.',
  'Was it the backflips? It\'s always the backflips.',
  'You have to go WHOOSH. Really, really big. Like a firework, but a boat.',
] as const;
export const BACK_OUT = [
  'You got out past the reef! And then the big ones got you. They always get you.',
  'So close! Did you see him? Was he still in his balaclava? He\'s up to something.',
] as const;

export const CHARACTER: Character = {
  name: 'Kikkit',
  who: 'Out in the middle of nowhere on a little deserted island at the reef\'s near end, to the right of the '
    + 'imperial checkpoint, with all her familiars about her: "the familiar version of a cat lady". A real Puzzle '
    + 'Pirates pirate (Kikkit of Emerald): captain of Rodrigo\'s Revenge, of the flag Egotistical Englishman, an '
    + 'Admiral in the Aimuari Island Navy (Dignity\'s navy, and above her). Drawn from her portrait: black curls '
    + 'crowned with red roses, an eyepatch, gold hoops, her tongue out, blue swirling tattoos on her arms and '
    + 'middle, a red top tied at the front, a red wristband, a ragged black skirt on a gold-buckled belt, bare '
    + 'feet, and a stone jug marked XXX. Rodrigo, her monkey, on her shoulder (her ship\'s named for him).\n\n'
    + 'Loopy, a bit drunk, and off on twenty tangents at once, she can\'t get her lefts and rights right. She '
    + 'really, really wants a penguin. And every word of her nonsense is the real way through her whirlpools, '
    + 'if you take it literally: the funny part is finding out she was right all along.',
  theUser: [
    { on: '10 Nov', said: 'Look for the pirate Kikkit as well, we need to make her a penguin in the game somewhere, hehe' },
    { on: '10 Nov', said: 'it kind of fits with her just being out in the middle of nowhere on an island trying to figure out some sailing' },
    { on: '10 Nov', said: 'really just do the whole craziness of Kikkit ... she\'s the crazy one' },
    { on: '10 Nov', said: 'it\'s got to actually make some mechanical sense so that it\'s more funny and literal' },
    { on: '11 Nov', said: 'Maybe a small combo gets you through the reef, with the penguins being the bigger prize after.' },
  ],
  lines: [
    { when: 'Her ramble, the first time you sail up to her island (and again, hailing her with Space)', says: RAMBLE },
    { when: 'Hailed again once she\'s told it all: tangents, a bit of the real way buried in them', says: TANGENTS },
    { when: 'Too many lefts: the whirlpools have spun you back to her island (a new one each time)', says: BACK },
    { when: 'Spun back after you\'d got out past the reef', says: BACK_OUT },
  ],
};
