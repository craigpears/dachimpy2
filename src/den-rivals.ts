/* Pirate Den: the sloop race's rivals, the den's own characters, as config. TypeScript, compiled to
   js/den-rivals.js; tested in tests/den-rivals.test.ts. Who they are, how they race and what they say is
   each one's file in src/lines/ (RACER); here, how they're lined up: their order (the first one races you
   alone, the first two as a pair...), their spot on the starting line, and how their sloops are told apart
   (sails and flag), and who's aboard with them. The race itself is src/den-race.ts (its Race lines up
   the first `rivals` of these), sailed by the simulation's bots (src/race-sim.ts, simDrive); js/den/
   race-field.js draws them.

   The user (11 Nov): "Daquan ... whoever other characters we've got already in here can all be characters
   that can drive sloops ... [Tzz] and [Kikkit] will be the sailors ... maybe [Kikkit] goes greedy for the
   Vegases, [Tzz] goes another route ... Everyone's got their own little profile and way they approach it",
   and of Umami, "obviously you will have maybe like the foraging slant".

   Daquan has no look yet (his portrait's still to check: IDEAS.md, "Daquan's flotilla"), so Dalnoth races
   in his place for now, Umami aboard to do his foraging. */

import type { Racer } from './lines/character.js';
import { RACER as KIKKIT } from './lines/kikkit.js';
import { RACER as TZZ } from './lines/tzz.js';
import { RACER as DALNOTH } from './lines/dalnoth.js';
import { RACING as UMAMI } from './lines/capybara.js';

export interface Rival {
  /** Their name, as the race shows it. */
  name: string;
  /** Their look (js/den-look.js, PIRATES), by name. */
  look: string;
  /** Their spot on the starting line (a column of LAY.RACE.LINE). */
  spot: number;
  /** Their sloop's sails and flag (colours), to tell her apart from yours and the others. */
  sail: string;
  flag: string;
  /** Who's aboard with them, if anyone ('umami'), and what the starter's card says of it. */
  crew: { who: 'umami'; said: string } | null;
  /** How they race and what they say (src/lines/). */
  racer: Racer;
}

/** In the order they're lined up: one rival is Kikkit, two Kikkit and Tzz, three all of them. Their spots
    clear of the field's whirlpools' columns (they come down the field from them) and of the spot you're
    taken in to (FIRST_SPOT). */
export const RIVALS: readonly Rival[] = [
  { name: 'Kikkit', look: 'Kikkit', spot: 18, sail: '#b8322a', flag: '#1d1a18', crew: null, racer: KIKKIT },
  { name: 'Tzz', look: 'Tzz', spot: 14, sail: '#4f95d6', flag: '#f4f1e8', crew: null, racer: TZZ },
  { name: 'Dalnoth', look: 'Dalnoth', spot: 4, sail: '#e2b23c', flag: '#2c2a6e', crew: { who: 'umami', said: UMAMI }, racer: DALNOTH },
];

/** How many rivals race you, at most and by default. */
export const MOST_RIVALS = RIVALS.length;
