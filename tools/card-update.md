The user is going through the task board card by card, saying (often dictating) what's changed about each. This is
what they said about the card `tasks/{{card}}.md` (id `{{id}}`); it's already logged on it, in their words:

> {{words}}

(The user, 15 Nov: "some quick way of going between them, even if the quick fire way is then me just having this mic
on and dictating into here about what the updated status of each thing is.")

1. Read the card (`node tools/task.mjs show {{id}}`) and the task board's part of CLAUDE.md. `node tools/task.mjs
   list` shows every card, if what they said touches others.
2. Do what they said, only that:
   - **Its status**, if they gave one, in any words: it works, it's fine, finished, not wanted any more: `done`;
     still to do, not right yet, broken again: `asked`; ready to be started: `ready`; for them to try or look at:
     `playtest` or `review`; just an idea for now: `idea`. `node tools/task.mjs set {{id}} <status> --note "<why, in
     a few words>"`. Said nothing about whether it's done? Leave its status alone.
   - **What it's about changed** (a better name, what's wanted now): `node tools/task.mjs note {{id}} "<what's
     wanted now>" --title "<a better title>"` (the title only if the old one's now wrong).
   - **Something else they mention** (a new fix, a new idea, a part to split off): a card of its own, `node
     tools/task.mjs add <stream> "<title>" --asked "<their words>"` (`--status idea` for an idea), in the stream it
     belongs to, then `note {{id}} "split off: <new id>"`. Already a card for it? `note` that card instead.
   - **The same as another card**: `note` both with the other's id, and set the one that's the duplicate `done`
     ("same as <id>").
   - **A design decision or a rule**: written into the document it belongs in (RACE.md, STORY.md, RULES.md,
     DISTILLING.md; never design.html), dated, their words quoted, then `note` it on the card.
   - **A question, or something you can't tell**: `note {{id}} "to ask: <what's unclear>"` and leave the rest.
3. Finish with one line saying what you did.

Rules: their words kept (quoted, lightly trimmed), plain English, pirate names only (CLAUDE.md). Cards only through
`node tools/task.mjs`, never edited by hand; don't log their words again, they're logged. Edit only the documents
named above, never code, and don't commit (the main session does). Nothing else: no simulations, no browser, no
starting work on the card itself.
