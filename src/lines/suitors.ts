/* Pirate Den: the suitors on the Wedding Isle (src/lines/character.ts says how these files go): their
   names and their cheesy lines. Their looks, and which comes first in each tone, are src/den-wedding.ts's
   (suitors()); js/den/wedding.js has each step forward and say their line. */
import type { Character } from './character.js';

/** Each suitor: their name, the line they step forward with, and what they're like. Cheesy and varied
    (the user, 11 Nov: "Oh, I love the cheesy lines ... the variety is funny"), and whatever they
    mention, they have (a test checks their looks). */
export const SUITORS = {
  barnaby: {
    name: 'Barnaby',
    line: 'My last bride had a little mishap. With a cannon. I\'ve had a lie down and I\'m ready to try again!',
    who: 'The groom left over from the last wedding, bandaged and still in his finery: Bachelor number one in Dark humour. Unsinkably cheerful about it.',
  },
  william: {
    name: 'Sweet William',
    line: 'I picked you a daisy. I picked everyone a daisy, actually. I just really like daisies.',
    who: 'Bachelor number one in Happy and cheesy: sweet, earnest and a little dotty, a white daisy for a bouquet.',
  },
  sal: {
    name: 'Saltwater Sal',
    line: 'I can splice a rope, bilge a sloop and drink a kraken under the table. You\'ll never be bored.',
    who: 'A sailor to her boots, braids and an eyepatch, all navy and aqua: practical, tough, and proud of it.',
  },
  jem: {
    name: 'Gentleman Jem',
    line: 'I\'ve written you a poem. It\'s mostly about rum, but you\'re in the last verse.',
    who: 'A dashing swashbuckler in navy and gold, a would-be poet whose muse is mostly rum.',
  },
  rosalind: {
    name: 'Captain Rosalind',
    line: 'I\'ve sunk forty ships, darling, but nobody\'s ever sunk my heart. Until now.',
    who: 'A captain in maroon and gold, grand and theatrical, a heartbreaker who calls everyone darling. Her line\'s among those the user loved (11 Nov).',
  },
  pete: {
    name: 'Wobbly Pete',
    line: 'I\'ve only the one good knee, but I\'ll go down on it for you. Getting up again\'s your job.',
    who: 'An old salt in a fez and a kilt, one good knee, long grey beard: game for anything, as long as someone helps him up.',
  },
  marigold: {
    name: 'Lady Marigold',
    line: 'I\'ve a house on Admiral Island, three cats and a parrot who swears. We come as a set.',
    who: 'A lady of means in orange and lemon, her parrot on her shoulder: a whole household comes with her.',
  },
} as const;
export type SuitorId = keyof typeof SUITORS;

/** At the den, married to them: what they say when you walk up (src/den-spouse.ts says when), each in
    their own voice; and coming aboard the sloop with you. */
export const AT_HOME: Record<SuitorId, { aboard: string; den: readonly string[] }> = {
  barnaby: { aboard: 'A ship! Do keep me away from the cannons, love.', den: ['Not a single mishap all day. I\'m ever so proud.', 'I\'ve had a lie down on the beach. Lovely spot.'] },
  william: { aboard: 'I\'ve brought daisies for the crew. And the mast.', den: ['I planted a daisy by the wall. It\'s doing ever so well.', 'Everyone here is lovely. Even the raiders, a bit.'] },
  sal: { aboard: 'Right, where\'s the bilge pump? I\'ve missed it.', den: ['That wall wants another plank. I\'ll fetch the hammer.', 'I\'ve challenged the capybara to a drinking contest. He\'s winning.'] },
  jem: { aboard: 'A poem for the voyage: rum, rum, the sea, and you.', den: ['I\'ve added a verse about the den. It rhymes with rum.', 'The sunset off the beach! Very poetic. Very rum-coloured.'] },
  rosalind: { aboard: 'A sloop, darling? How quaint. I adore her.', den: ['Forty ships, darling, and not one had a beach like this.', 'I\'d sink anyone who came for this den. For you, darling.'] },
  pete: { aboard: 'Give us a hand up the gangplank, there\'s a love.', den: ['This knee likes the sea air. The other one\'s sulking.', 'Sit with me a while. Getting up again\'s your job, mind.'] },
  marigold: { aboard: 'The cats are following on by the next boat. The parrot\'s already aboard.', den: ['The parrot\'s learnt three new words from the raiders. Lovely.', 'It\'s not Admiral Island, but I adore it already.'] },
};

export const CHARACTER: Character = {
  name: 'The suitors',
  who: 'A line of bachelors and bachelorettes on the Wedding Isle, blind-date style: they walk in with bouquets '
    + 'out, and each steps forward with a cheesy line ("Here are your bachelors!"). Men and women both, so anyone '
    + 'can find a match. Number one depends on the tone: in Dark humour, Barnaby, the groom left over from the last '
    + 'wedding (his bride had a mishap); in Happy and cheesy, Sweet William. Whatever a suitor mentions, they have '
    + '(Lady Marigold\'s parrot is on her shoulder).\n\n'
    + Object.values(SUITORS).map((s) => `${s.name}: ${s.who}`).join('\n\n'),
  theUser: [
    { on: '11 Nov', said: 'Oh, I love the cheesy lines ... the variety is funny' },
    { on: '11 Nov', said: 'whoever you marry, I think naturally has to jump on the ship with you after you leave the Isle to have that continuity and hang out with the Den with you, that sort of thing. It\'s got to carry out into the world.' },
  ],
  lines: [
    {
      when: 'Stepping forward in the line-up, each in turn', says: Object.fromEntries(Object.values(SUITORS).map((s) => [s.name, s.line])),
    },
    {
      when: 'Married to them, at home (whoever you married comes home with you, 11 Nov): coming aboard the sloop with you off the isle, then walking up to them at the den',
      says: Object.fromEntries((Object.keys(SUITORS) as SuitorId[]).map((id) => [SUITORS[id].name, AT_HOME[id]])),
    },
  ],
};
