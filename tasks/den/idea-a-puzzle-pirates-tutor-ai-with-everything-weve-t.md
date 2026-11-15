---
title: A Puzzle Pirates tutor AI, with everything we've taught the den in it
status: idea
asked: 13 Nov
updated: 15 Nov
---

*A Puzzle Pirates tutor AI, with everything we've taught the den in it (13 Nov)*

The user (13 Nov): "It would be really nice eventually to have our own kind of puzzle pirate tutorial AI ...
all these things that obviously we're training into the distilling thing or the puzzle, the pirate knowledge
questions, you know, to have that all encoded in there." Eventually, one tutor that knows what the den has
learned: each puzzle's rules and techniques as the bots play them (DISTILLING.md and its bots, Sailing's,
Navigation's, rowing's, the greedy ones), the user's corrections on where a bot went wrong, and the pirate
knowledge (the real pirates, the islands, the lore). You could ask it about your own board and it would read
it, name the technique and show it, as "Help, Helium" does for Distilling, but for every puzzle, and answer
questions about the game besides. A start that's already there: the bots' `advise` and Helium's lines. How
it's built (in the den, a page of its own, or both) is to shape with the user.

But a side adventure, never the place to learn it all (the user, the same day: "don't forget ... the greatest
love of the game is talking to other pirates ... this is not a replacement for the game ... a tool, a side
adventure ... We should be watching people, looking at YouTube videos, talk to people"). The tutor would
say so itself, and point you to other pirates (STORY.md, the principles).

**A catalogue first, then an assistant that reads it (14 Nov).** The user: "what would it take for me to have a
little AI assistant on here? ... a catalog of all the guides and good guides, the wiki ... or just, you know, pieces
of wisdom people have dropped in ... could we scrape the YPP Trophy Hunters Discord chat and we just get all of the
nuggets of wisdom that have built up, obviously with appropriate credits to it, and then have an AI agent that you
could ask a question." As discussed:
- **The catalogue page first,** no AI needed: the good guides, YPPedia, videos and streams, and nuggets of wisdom,
  each credited to the pirate who said it. Useful on its own, and it's what the assistant would read.
- **The assistant:** an "Ask" box on the site; the Cloudflare Worker the den already has calls the Claude API with a
  key kept as a Worker secret (never in the browser), the catalogue and the den's own guides as its cached system
  prompt, answering with links and credits, and sending people on to real pirates. It needs an API key from the
  Claude Console, billed separately: the Max plan covers using Claude (the apps, Claude Code), not a website's
  calls. Roughly a few cents a question on Claude Opus 5.5 with the catalogue cached; a monthly spend limit in the
  Console and a per-visitor limit in the Worker keep it safe from abuse.
- **The Discord's wisdom, with permission, not scraped:** Discord's terms forbid scraping and self-bots, and the
  words are people's own. Ask the Trophy Hunters' admins: a pinned "tips" channel or a bot they add, or members
  sending in their own nuggets, each with the pirate's name only if they're happy to be credited.
- **Answers show who said it (14 Nov):** "you would ask a question and then it would show you the picture of whoever
  had answered it or where the source is. And again, it would just always point you back towards that Discord or
  asking people. Again, I just don't want any impression that I'm trying to ... replace people interaction." So
  each answer comes with the pirate's portrait and name (with their
  say-so) or the guide it came from, and always ends by sending you to the Discord or to ask other pirates.
- **Decided (14 Nov): no assistant built on the Discord's wisdom.** The user: "people ... would probably not like
  that because ... even if it wasn't against Discord's terms, it undermines that social interaction thing. Like ...
  if you got a question on [a] mechanic, that's what [YPP] Trophy Hunters is for. There's nothing you can't really
  find there or ask about." So questions go to the people: the front page points there. (Of the server's own rules
  on AI-generated content, "visual media created using AI", the user reads it as keeping out slop.) The catalogue of
  guides may still be worth a page of its own; an assistant isn't planned.

## Log

- 15 Nov: moved over from IDEAS.md.
