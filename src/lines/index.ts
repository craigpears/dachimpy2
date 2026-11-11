/* Pirate Den: every character with lines, in the story's order: what LINES.md is made from
   (tools/lines-doc.mjs, run by `npm run build`; tests/lines.test.ts checks every file in src/lines/
   is here, and that LINES.md is up to date). A new character's file goes in this list. */
import type { Character } from './character.js';
import { CHARACTER as DALNOTH } from './dalnoth.js';
import { CHARACTER as YOU } from './you.js';
import { CHARACTER as NARRATOR } from './narrator.js';
import { CHARACTER as DIGNITY } from './dignity.js';
import { CHARACTER as BELLA } from './bella.js';
import { CHARACTER as UMAMI } from './capybara.js';
import { CHARACTER as MISCHIEVIOUS } from './mischievious.js';
import { CHARACTER as SUITORS } from './suitors.js';
import { CHARACTER as SPOUSE } from './spouse.js';
import { CHARACTER as GUESTS } from './wedding-guests.js';
import { CHARACTER as KEEPSAKE } from './keepsake.js';
import { CHARACTER as KIKKIT } from './kikkit.js';
import { CHARACTER as PENGUIN } from './penguin.js';
import { CHARACTER as TZZ } from './tzz.js';
import { CHARACTER as GRAVEE } from './gravee.js';
import { CHARACTER as VAMPIRE } from './vampire.js';
import { CHARACTER as IMPERIAL_GUARDS } from './imperial-guards.js';

export const CHARACTERS: readonly Character[] = [DALNOTH, YOU, NARRATOR, DIGNITY, BELLA, UMAMI, MISCHIEVIOUS, SUITORS, SPOUSE, GUESTS, KEEPSAKE, KIKKIT, PENGUIN, TZZ, GRAVEE, VAMPIRE, IMPERIAL_GUARDS];
