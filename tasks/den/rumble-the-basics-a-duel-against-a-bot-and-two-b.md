---
title: Rumble: the basics, a duel against a bot and two bots watched
status: doing
asked: 21 Nov
updated: 21 Nov
branch: claude/rumble-basics-bade27
link: /rumble-test.html
---

**Asked:** 21 Nov: "start a session on doing the basics of a rumble puzzle. Especially want it to be like dueling is in sword fighting" ... "you can fight a bot or see two bots fighting, where you can see both of the boards to get a feel, especially for rumble, so you can get more of a feel for ... seeing what happens to the opponent's board when you do something". Then: "start out the basics for now".

## Log

- 21 Nov: added.
- 21 Nov: being done: Started: rules researched on YPPedia (Rumble, Official:Rumbling, strike and sprinkle calculations, Boothook's guide).
- 21 Nov: Built: RUMBLE.md, src/rumble.ts (two boards, strikes and sprinkles by YPPedia's tables), src/rumble-bots.ts (greedy Style, the hook for the strategy bots), rumble-test.html (?seed=&bot=, ?watch&left=&right=), tests/rumble.test.ts. Smoke and phone checks pass.
- 21 Nov: for you to playtest: Live (bb23bf4): /rumble-test.html to brawl the bot, /rumble-test.html?watch to watch two. To settle: the board's height (13 rows, 5 filled at the start, a guess), how launcher colours are picked, bare fists' strike pattern (a stand-in), when an attack lands (after their next shot), the new rows' bruise chance.
- 21 Nov: being done: Playtest (21 Nov): It
