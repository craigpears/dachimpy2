/* Pirate Den: the wedding keepsake's captions (src/lines/character.ts says how these files go): written
   under each snapshot of the collage you're given at the end of a wedding on the Wedding Isle, in the
   wedding's tone. Which moments a wedding's taken at is src/den-wedding.ts's (MOMENTS); js/den/wedding.js
   lays the collage out. `{partner}` and `{you}`: the couple's names. */
import type { Character } from './character.js';
// (a type only: den-wedding.ts imports this file)
import type { ToneId } from '../den-wedding.js';

/** Under each snapshot: Happy and cheesy, and Dark humour. */
export const CAPTIONS = {
  aisle: { happy: 'Here comes {partner}!', dark: 'Here comes {partner}. Mind the splatter.' },
  vows: { happy: 'Dearly beloved... not a dry eye', dark: 'Dearly beloved... security on standby' },
  sweet: { happy: 'Not a thing went wrong', dark: 'Nothing went wrong. We checked twice.' },
  raiders: { happy: 'Uninvited guests, shown the sea', dark: 'Raiders again. Into the sea they went.' },
  drunk: { happy: 'Somebody found the cake. Face first.', dark: 'The cake didn\'t make it. Nor did they.' },
  brawl: { happy: 'A lively one! Benches everywhere', dark: 'A proper brawl. The benches were hired.' },
  kiss: { happy: 'The kiss!', dark: 'The kiss! Still all in one piece.' },
  cheer: { happy: 'Hooray! Hearts and confetti', dark: 'Hooray! The confetti, mostly not red' },
} as const satisfies Record<string, Record<ToneId, string>>;

/** Signed across the foot of it, under the couple's names. */
export const SIGNED = 'On the Wedding Isle, with love';

export const CHARACTER: Character = {
  name: 'The wedding keepsake',
  who: 'Not someone you meet: the captions on the keepsake you\'re given at the end of a wedding, a collage of '
    + 'snapshots taken as it played (your sweetheart up the aisle, the vows, the plot\'s big moment, the kiss, the '
    + 'cheer) round the wedding portrait, framed in gilt. Short and fond, cheesy in Happy and cheesy, cheerfully '
    + 'grim in Dark humour.',
  theUser: [
    { on: '11 Nov', said: 'given how much work we\'ve done into the different scenes on the wedding thing, like you shouldn\'t just get one picture, you should get snapshots of all the key moments, so you have a nice kind of collage of the whole wedding.' },
  ],
  lines: [
    {
      when: 'Under each snapshot', says: CAPTIONS,
      each: {
        aisle: 'Your sweetheart walking up the aisle', vows: 'The vows begun', sweet: 'Sweet and blissful: hand in hand',
        raiders: 'Raiders crash it: the guards see them off into the sea', drunk: 'Somebody\'s drunk: into the cake',
        brawl: 'A brawl breaks out: benches flying', kiss: 'The kiss', cheer: 'The cheer',
      },
    },
    { when: 'Across its foot, under the couple\'s names', says: [SIGNED] },
  ],
};
