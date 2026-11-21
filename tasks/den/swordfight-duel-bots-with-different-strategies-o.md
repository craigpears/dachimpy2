---
title: Swordfight duel bots with different strategies, one building an insta
status: idea
asked: 21 Nov
updated: 21 Nov
---

**Asked:** 21 Nov: "I'm sure you could find similar with sword fighting, where a bot tries to build an insta, for example, so an instant kill." Bots with styles to demo, as for Rumble.

## Log

- 21 Nov: added.
- 21 Nov: How one plugs in (21 Nov, from the duel basics): a strategy is a SwordBot in src/sword-bots.ts, just name and plan(view) -> {c, rot}, view being copies of its board, the pair, the other side's board and the attacks waiting for it. Add it to BOTS and it's on swordfight-duel-test.html as ?bot=<name> or ?watch&bots=<a>,<b>; Hand plays any of them at a person's pace. placements() and tryPlace() look ahead on copies. An insta builder needs where swords land: Board.take with a copy of the duel's Aim (its shared queues, Duel.aim) says exactly where its swords would go on a copy of the other board (SWORDFIGHT.md section 3 and 6). The page's view only shows the current pair; the real puzzle's next-pair preview is unconfirmed.
