/* Pirate Den: Dignity's lines (src/lines/character.ts says how these files go). When she says them is
   src/den-dignity.ts's (sceneAt for her cutscene, Dignity for the rest); js/den/dignity.js shows them
   over her head. Bella's chatter is in src/lines/bella.ts. */
import type { Character } from './character.js';

/** Her cutscene, the first time you sail up to her checkpoint from the cove's side. */
export const SCENE = {
  halt: 'Halt! Imperial checkpoint. State your busi...',
  oh: '...oh. Pirates. It\'s always pirates.',
  lively: 'Look lively! And do try to hit them this time.',
  giggle: 'Hee hee! Oops. That was a warning shot. Mostly. Come any closer and the next ones won\'t be.',
} as const;

/** Over her head as things happen, after her cutscene: each said once. */
export const LATER = {
  closer: 'One more stroke and I\'ll have to shoot. There\'ll be paperwork. I hate paperwork.',
  wrecked: 'That was Imperial property!',
  passed: 'This is going in my report. In very small, very cross handwriting.',
  canal: 'Nobody uses the canal. Nobody!',
} as const;

export const CHARACTER: Character = {
  name: 'Dignity',
  who: 'The imperial checkpoint\'s dutiful commander, peering down from the top of its gatehouse, the '
    + 'Empire\'s flag behind her. A real Puzzle Pirates pirate (Dignity of Emerald), drawn from her portrait: '
    + 'smiling, wavy blonde hair, an eyepatch, a dusky purple Buccaneer jacket, a brass spyglass in her hand, '
    + 'and Bella, her lavender monkey, on her shoulder.\n\n'
    + 'Witty, very cute, and a stickler for the rules (she hates paperwork, and writes very cross reports). '
    + 'Pirates are always a disappointment to her. She sends Bella to fire the warning shot, and giggles '
    + 'at it.',
  theUser: [
    { on: '10 Nov', said: 'adding [her] as the dutiful commander of the imperial checkpost, kind of peering down from the gates ... give her a little cutscene similar to Dalnoth ... come up with something witty for her' },
    { on: '10 Nov', said: 'I need to give it a bit of a cheeky giggle and a win' },
    { on: '10 Nov', said: 'we\'ve really got to go all in with Dignity\'s little cutscene. She\'s got to be very cute.' },
    { on: '10 Nov', said: 'I love it. The cheeky giggle and the spyglass, definitely complete it.' },
  ],
  lines: [
    {
      when: 'Her cutscene, the first time you sail up to her checkpoint', says: SCENE,
      each: {
        halt: 'Lowering her spyglass: she\'s seen you',
        oh: 'A hand to her forehead',
        lively: 'To Bella, pointing her spyglass at you',
        giggle: 'The warning shot just missed you: a hand to her mouth, then wagging her spyglass at you',
      },
    },
    {
      when: 'Later, over her head as things happen (each said once)', says: LATER,
      each: {
        closer: 'You come one stroke short of her guns\' first mark',
        wrecked: 'You wreck one of her guns',
        passed: 'You get through her gate, either way',
        canal: 'You come out round her by the locks (even if she never saw you sail up)',
      },
    },
  ],
};
