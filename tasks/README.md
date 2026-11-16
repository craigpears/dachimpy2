# The task board

What's in flight, as cards (the user, 14 Nov: "a clear list of things and what their status is", grouped by stream of
work, "because I can't even remember all the things I've got in progress"). Kept by a script, never by hand-drawn
pages (15 Nov: "more deterministic ... I don't have to worry about how many tokens are being spent updating the board
and rendering it").

- **A folder a stream** (the wolf den, Primates Rule, the sloop race...), its `_stream.md` its name, its colour (`hue`)
  and where it got to.
- **A file a card** in it: its title, status, when it was asked and last updated, its `?at=` link, a screenshot
  (a path from the repo's root), the session or branch doing it; then what was asked, in the user's words, what done
  looks like, and its log.
- **Statuses:** inbox (what you drop in, before it's sorted), idea (the Ideas column, the left-most: what was IDEAS.md), asked, ready (to start), doing (being done), review (for the user to review), playtest (for the user to
  playtest), done. Nothing's parked (the user, 15 Nov: "if things are parked, that means they're done,
  really"): a maybe-later is asked.
- **The board:** `tasks/board.html`, drawn from the files by `tools/task.mjs` (not committed, not published). Open it
  straight from the folder, or at http://localhost:8642/tasks/board.html.

## Changing it: one command, never an edit by hand

```
npm run task -- list [--stream s] [--status st]
npm run task -- show <id>
npm run task -- add <stream> "<title>" --status ready --asked "the user's words" --done "what done looks like"
npm run task -- set <id> playtest --link "den.html?at=x&as=dachimpy" --shot changelog/x.jpg --note "what's ready"
npm run task -- note <id> "a line for its log"
npm run task -- move <id> <stream>
npm run task -- stream <stream> "where it got to"
npm run board
npm run board:serve
```

Each draws the board again. `board:serve` shows it at http://localhost:8643/, where cards are dragged between columns
(or moved with "Move to" under More, on a phone), each drop a `set` by the script; Ctrl+C stops it. An id is the card's file name; any unique part of one will do.

## How work goes through it

1. Anything asked for gets a card (`add`), before work on it starts; a new idea one too (`--status idea`). There's
   no TODO.md or IDEAS.md: every fix and tweak is a card
   (15 Nov: "It should just be all these little files").
2. The user says start it, or "pick up tasks": the main session reads the `ready` cards (`list --status ready`, then
   `show`), and offers each as a session of its own, its brief from the card; on the user's go it's `doing`, with
   `--session`.
3. A session keeps its own card current, by the script (the user, 15 Nov: "you should be able to update the card
   you're working on"): a `note` as it goes, and `set <id> review` or `playtest` with its link and a shot when its
   work's in. It touches no other card, and no stream. The main session checks its work, merges it, and does the
   rest of the organising: the other cards, the streams, and the card's move if the session didn't.
4. Once the user's played it: `done` (or back to `ready` with what they said).

## The inbox: drop it in, it's sorted for you

On the served board (`npm run board:serve`), the box at the top takes anything: a fix, an idea, a thought, dictated
as it comes (the user, 15 Nov: "an agent that processes that column whenever I drop something in it ... it puts it
either into a to-do item or an idea, updates an ideas list or a document"). It's an inbox card at once
(`tasks/inbox/`), and the server starts a headless Claude (Sonnet, `claude -p`) with `tools/inbox-triage.md`: it may
only run the task script, read, and edit the design documents. It splits what you wrote into its parts and puts each
where it goes: a card (asked), an idea card, a note on a card it adds to, or RACE.md, STORY.md, RULES.md or
DISTILLING.md; then the inbox card's done, its log saying where each part went. Anything it can't place stays in the
inbox with a note, for the main session. It doesn't commit: the main session does.

## A card opened, and going through them

The board moves over to make room for the panel, so it can still be scrolled, dragged and dropped into beside it.
It's made for the mic: the boxes are written into without ever being clicked into, so every key keeps working while
it's on (M the mic, N send and next, ← → go through, 1 to 8 move it, I to the inbox, Esc close; the user, 15 Nov:
"it doesn't really ever need any text focus"). Click into a box only to type; Esc leaves it.

Click a card (or Tab to it and Enter) and it opens in a panel down the right: everything on it, what was asked and its
whole log. ← and → go through the cards showing (the stream picked), column by column from that card's own, each
column's "Go through" starts at its top; 1 to 8 move it (Inbox to Done, the buttons along the top say which); Esc
closes it; a card's link, `#its-id`, opens it. Below is a box for what's changed, typed or said (the user, 15 Nov:
"some quick way of going between them, even if the quick fire way is then me just having this mic on and dictating
into here about what the updated status of each thing is"): the Mic button, or M (Alt+M while writing), where the browser can listen (Chrome,
Edge; "next" said on its own sends it and goes on, "back" goes back), or Windows' dictation (Win+H) anywhere.
"To the inbox" (or "inbox" said on its own) sends what's in the box to the inbox instead, for something that isn't about this card. The inbox's own box has a mic too (M when no card's open; "drop it in" said on its own sends it; Ctrl+Enter). Ctrl+Enter, or "Send and next", sends it: it's logged on the card at once in your words, and a headless Claude
(`tools/card-update.md`; the same limits as the inbox's) acts on it, its status, its title, a new card split off, a
duplicate closed, a decision into its document. The card says it's updating, and redraws itself when that's done.

## An idea card is one idea

A card in the Ideas column is one idea, focused enough to pick up on its own. A brain-dump that grew into several
(much of what came over from IDEAS.md) is split (the user, 15 Nov: "a few things to split into more focused cards
with a lot of rambling that can be removed"): each live idea its own card, in the user's words; what's already built
and what was dropped said in the old card's last note; the old card then `done`, its log saying where each part
went, so nothing's lost. A decision made on the way (dropped for good, not just not yet) goes into the document it
belongs in. The inbox's sorter and the card updates (`tools/inbox-triage.md`, `tools/card-update.md`) split the same
way.

## What you've sent, and what came of it

Everything you send from the board, an update or something dropped in the inbox, shows at once in a short list in
the bottom-left corner, and on the card itself, its log and all (the user, 15 Nov: "It makes you nervous. Like, did
that save? Did it not?"). Its line says "Saved on the card" as soon as it's written, then, once the headless Claude
is done, what it did in a line ("Set it done: the same as raids."), green, or red if it couldn't; the server's own
window prints the same line ("all it says is updated ... some one-liner short confirmation"). A line opens its card.
