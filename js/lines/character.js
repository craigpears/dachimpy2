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
export {};
