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

export const CHARACTERS: readonly Character[] = [DALNOTH, YOU, NARRATOR, DIGNITY, BELLA, UMAMI];
