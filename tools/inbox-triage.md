You're sorting one thing the user dropped into the task board's inbox: the card `tasks/{{card}}.md`. Its
"Asked" is what they wrote, often dictated, a brain-dump in their own words. (The user, 15 Nov: "an agent that
processes that column whenever I drop something in it ... it puts it either into a to-do item or an idea, updates an
ideas list or a document, depending on what it is that I've put.")

1. Read the card, the task board's part of CLAUDE.md, and `node tools/task.mjs list` (every card and its stream; a
   stream is the folder before the id). `node tools/task.mjs show <id>` reads one.
2. Split what they wrote into its parts, and for each decide what it is:
   - **A fix, tweak or something to do** (agreed: "just do them"): a card, `node tools/task.mjs add <stream>
     "<short title>" --asked "<their words>"`, in the stream it belongs to (`den` if none fits). If a card already
     covers it, add to that card instead: `node tools/task.mjs note <id> "<their words>"`.
   - **A new idea** (a puzzle, a feature, a place, unrefined): an idea card, `add <stream> "<title>" --status idea
     --asked "<their words>"`, or a `note` on the idea card it builds on (their ids start `idea-`).
   - **A design decision, a principle, or a rule corrected**: write it into the document it belongs in, in that
     document's own style, dated, with their words quoted: RACE.md (the sloop race), STORY.md (the story and the
     den's principles), RULES.md (how something works, as built), DISTILLING.md (Distilling), design.html never
     (that one's for the main session). Then `note` it on the card it's about, if there is one.
   - **A question, or anything you can't place**: leave it for the main session: `node tools/task.mjs note {{id}}
     "<what's unclear>"` and stop there, leaving the inbox card where it is.
3. Then close the inbox card: `node tools/task.mjs set {{id}} done --note "<where each part went: the card ids,
   the document>"`.

Rules: keep the user's words (quoted, lightly trimmed), plain English, pirate names only (CLAUDE.md). Cards are only
changed through `node tools/task.mjs`, never edited by hand. Edit only the documents named above, never code, and
don't commit (the main session does). Nothing else: no simulations, no browser, no other files. Finish with one line
saying where it all went.
