You're reviewing pages of the Pirate Den as they look on a phone, and putting what's wrong with each on the task
board. (The user, 16 Nov: "some agent that goes through the site on mobile, similar to the smoke tests ... can I
actually see the action? Is the menu following good UX principles?") Run by `npm run mobile -- --review <pages>`
(tools/mobile.mjs), after it measured them.

The pages, as `npm run mobile` measured them at 390x844 with touch (their screenshots, `shot`, are in this
checkout; a `null` cover means the page has no big canvas, so there's no action to cover):

```json
{{pages}}
```

`cover` is the share of the action (the biggest canvas: the 3D, a board) that HTML panels, buttons and words paint
over, `middle` the share of its central part, `chrome` the share of the screen taken by fixed or sticky bars,
`panels` what covers it, biggest first; the rest are examples of small taps, small words and things off the edge.
The numbers can't tell a speech bubble that's fine from a menu in the way: that's your job.

1. Read RULES.md's "On a phone" (search for `**On a phone (16 Nov)`): the six principles you judge by. Read the
   task board's part of CLAUDE.md (search for "The task board").
2. For each page, Read its screenshot and judge it against the six, with the numbers beside it. Note only real
   problems a player on a phone would mind, each in a short plain line saying what and where ("the list of ships
   fills the right half, over the sea"; "Pause and Help up in the top corners, out of the thumb's reach"), and
   what would fix it in the principles' words ("behind one Ships button, closed at first"). A page with nothing
   wrong gets nothing. Don't open the page's code; what's on the screen is what matters.
3. Put each page's problems on the board, all of one page's on one card:
   - Find a card already about that page on a phone: `node tools/task.mjs list`, and `node tools/task.mjs show
     <id>` to read one (search the titles for "phone", "mobile", "menu", the place's name). Known ones: the
     blockade (`blockade-test.html`), `the-blockade-on-a-phone-its-buttons-and-list-of-` in primates-rule; the den's
     menu, `the-dens-menu-as-a-hamburger-menu-on-a-phone-abo` in den; the wolf den, `on-a-phone` in wolf-den. If
     there is one, `node tools/task.mjs note <id> "Phone check (16 Nov): <the problems, in a line or three>"`.
     Don't change its status, title or anything else on it.
   - If there isn't, add one in that page's stream (a stream is the folder under `tasks/`; each `_stream.md` says
     what it holds; `den` if none fits): `node tools/task.mjs add <stream> "<page> on a phone: <its worst problem,
     short>" --status asked --asked "Phone check (16 Nov), <the page's address>: <the problems>" --done "<what it
     looks like fixed, in a line>"`. If `add` doesn't take an option, leave it out and `note` it instead.
   - A problem shared by many pages (the den's menu on every place, say) goes once on the card about it, not on
     every page's; a page's card says only what's its own.
   - Only the pages above, and only their cards: never a note on a card about a page you weren't given (the known
     cards above are each for their own page; leave the others alone), and never a note saying there's nothing.

Rules: plain English, pirate names only (never a real person's). Cards are changed only through `node tools/task.mjs`,
never edited by hand. Change nothing else: no code, no documents, no commits, no browser, no simulations. Finish
with one short line per page, under 20 words each, saying what you did ("blockade-test.html: 3 problems, noted on
the-blockade-on-a-phone-..."; "tutorial-test.html: fine"), and nothing after them.
