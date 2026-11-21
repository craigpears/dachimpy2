---
title: A Distilling test board with furnaces on both sides
status: playtest
asked: 21 Nov
updated: 21 Nov
---

**Asked:** 21 Nov: "Can I do a quick test?" of furnaces on more sides ("two furnaces, burning both directions ... maybe you have every single edge burns"). Also, to try on it: dark rum and special pieces "fit with the four aside thing"; and "if a spice in a crystal clear does something that ... just gives you a lot, the next spawn gives you more spice or more white pieces". From the idea card idea-distilling-with-a-higher-skill-cap-fun-variation.

## Log

- 21 Nov: added.
- 21 Nov: being done
- 21 Nov: 21 Nov, the user, mid-build: "a version about efficiency where the burn is sped up by how many drags you do ... I don't want to score based on efficiency, but the idea of burning faster because you're doing more moves or fewer moves". Added as a fourth flag, &moveheat (each drag heats the furnace a tick, 0.3 s).
- 21 Nov: Built and pushed (85be1dd): four flags on distilling-test.html, each off by default (DISTILLING.md §8). Two furnaces: both edge columns go together every 30.6 s, two new columns rise into the middle (two at a time keeps the honeycomb's tall-and-short; new columns on the far side would leave 15 s after coming). Dark rum, rich spice, moves heating the furnace as asked. Bots don't play two furnaces yet. Links: https://dachimpy2.dachimpy.workers.dev/distilling-test.html?seed=1&furnaces=2 , ...&furnaces=2&darkrum&richspice , ...?seed=1&moveheat . Found on main, not this change: distill-bots.test.ts 'never burn a column with a white in it on purpose' times out (73 s against 60).
- 21 Nov: for you to playtest
- 21 Nov: 21 Nov, the user: "I kind of wanted the concepts all in one go ... they kind of work with each other. So I don't know why you've done 3 different pages." Added ?hard (and a Harder button): all four at once, one link: https://dachimpy2.dachimpy.workers.dev/distilling-test.html?seed=1&hard . Asked about four sides: doable the same way (top and bottom rows leaving together, two rows coming in in the middle), not built yet.
