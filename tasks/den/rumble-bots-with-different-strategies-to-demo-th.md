---
title: Rumble bots with different strategies, to demo them
status: idea
asked: 21 Nov
updated: 21 Nov
---

**Asked:** 21 Nov: "a few bots that have different strategies, like for rumbling, you know, going for an aggressive clearing, sprinkling pattern, one that does kind of short bludgeon style, you know, 3-pop, maybe one that goes for bruising strategy of, you know, 3 or 4 with some bruising on it, pop. One that has ... goes for big combos, like, you know, 10+ things. It would be really nice just to be able to demo those different strategies with rumble."

## Log

- 21 Nov: added.
- 21 Nov: 21 Nov, from the Rumble basics: a strategy bot plugs in as a Style in src/rumble-bots.ts (id, name, says, think = its pace, score(option, {me, them})) added to STYLES; options() already lists every shot (both fists, each reachable cell, charged or not) with its Outcome (groups, popped, dropoff, extra) and the board after, and strikeSize() gives what a combo would send. rumble-test.html picks it by ?bot=<id>, or ?watch&left=<id>&right=<id>. RUMBLE.md §6 names the styles.
