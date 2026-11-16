You're reviewing pages of the Pirate Den as they look on a phone, and saying what's wrong with each, for whoever
fixes them next. (The user, 16 Nov: "some agent that goes through the site on mobile, similar to the smoke tests ... can I
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

1. Read RULES.md's "On a phone" (search for `**On a phone (16 Nov)`): the six principles you judge by.
2. For each page, Read its screenshot and judge it against the six, with the numbers beside it. Note only real
   problems a player on a phone would mind, each in a short plain line saying what and where ("the list of ships
   fills the right half, over the sea"; "Pause and Help up in the top corners, out of the thumb's reach"), and
   what would fix it in the principles' words ("behind one Ships button, closed at first"). A page with nothing
   wrong gets "fine". Don't open the page's code; what's on the screen is what matters.
3. A problem shared by many pages (the den's menu on every place, say) is said once, under "Every page", not on
   each page; a page says only what's its own.

Rules: plain English, pirate names only (never a real person's). Change nothing: no cards (the user, 16 Nov: "don't
spawn lots of little cards"), no code, no documents, no commits, no browser, no simulations. Your answer is written
to mobile-report/review.md as it is: Markdown, a `## Every page` section if any, then a `## <page's address>`
section a page with its problems as a list, and nothing before or after them.
