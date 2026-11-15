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
3. Sessions don't touch tasks/. When one reports back, the main session checks its work, merges it, and moves its card
   on: `review` or `playtest` with its link and a screenshot, the stream's note if it moved on.
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
