/* Pirate Den: the shape of a character's file in src/lines/. One file per character: who they are,
   then everything they say, grouped by when they say it, each line as it's written in the game. The
   code takes its lines from these files (a line changed here changes the game), and LINES.md is made
   from them by `npm run build` (tools/lines-doc.mjs), so git's history shows every line as it changes.

   The user (11 Nov): "make sure that all the various lines, characters, and personalities are in
   like some configurable files ... I just want there to be a record of them in case any get lost
   that I really love, so I can see how they've evolved over time, even if it's just in source
   control somehow."

   Plain data, no logic: a line is a string, as the game shows it. Each file exports its lines (by
   the names the code imports them by) and CHARACTER, who they are with those lines grouped by when;
   src/lines/index.ts lists the characters in the story's order. */

/** Something said: a line; lines, in order; or lines by name (the names the code uses), nested as
    deep as the code keeps them (one pool of lines for each tone, say). */
export type Said = string | readonly Said[] | { readonly [key: string]: Said };

/** A group of lines, by when they're said. */
export interface Lines {
  /** When they're said, in plain words. */
  when: string;
  /** The lines, in the order they come. */
  says: Said;
  /** When each one's said, by its name in `says`, where `when` doesn't say. */
  each?: { readonly [key: string]: string };
}

/** What the user said of them, word for word, and when. */
export interface Quote { on: string; said: string }

/** A character who races you in the sloop race (src/den-rivals.ts lines them up; src/race-sim.ts's bots
    sail them): how they race, in plain words and as the simulation's names for it, and what they say. */
export interface Racer {
  /** How they race, in plain words. */
  how: string;
  /** Their favourite way round (a route of src/race-sim.ts's ROUTES, by name: 'whirls', 'doubles'...),
      their racing style (STYLES: 'peaceful', 'opportunist', 'aggressive', 'cautious'), and how good they
      are at the puzzles (a level better at their own route's: RACE.md §1, back yourself). */
  route: string;
  style: string;
  skill: 'decent' | 'good' | 'great';
  /** On the starting line before the gun; over the finish line first; over it after someone. */
  says: { readonly start: readonly string[]; readonly won: readonly string[]; readonly lost: readonly string[] };
}

export interface Character {
  /** Their name, as the game has it. */
  name: string;
  /** Who they are and their personality, in plain words. Paragraphs split by a blank line. */
  who: string;
  /** What the user said of them, in their own words. */
  theUser?: readonly Quote[];
  /** Everything they say, grouped by when. */
  lines: readonly Lines[];
}
