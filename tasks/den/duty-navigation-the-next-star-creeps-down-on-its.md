---
title: Duty Navigation: the next star creeps down on its own, a timer, and drops where it is when it touches
status: playtest
asked: 20 Nov
updated: 20 Nov
---

**Asked:** I think the idea of the slow-moving Dukinov piece is being misunderstood. It's supposed to slowly move down, like, before you've done anything. Like, the idea is that that's the timer to give you only a set amount of time to do something, so you can't just sit there forever. Like, really slowly. But eventually it will touch the bottom and then you're stuck with that move.

## Log

- 20 Nov: added.
- 20 Nov: Not what the 13 Nov card did (duty-navigation-stars-should-drop-slowly-the-rin: that slowed a dropped star's fall). Done looks like: the next star, waiting over its spoke, creeps down toward the rings on its own, really slowly, before you've done anything; when it touches, it drops where it is, whatever ring's turned, so you can't sit there forever. Its pace a setting in src/navigation.ts's rules (the clock passed in), drawn by js/den/nav-board.js on every Duty Navigation board; the lessons' boards hold it while Multibella talks.
- 20 Nov: being done
- 20 Nov: 20 Nov, built: the next star creeps in from its handle toward the wheel on its own, an arc round it draining (red near the end, its halo pulsing faster), and at 20 seconds (CREEP.SECS) it drops where it is, a booch if its spoke's full. Turning doesn't stop the clock. Only while you're at the board: not in Multibella's lessons, her opening or under her menu. On every Duty Navigation board (the wolf den, the starlit door, the test page). Rules in src/navigation.ts (creep, creepShare), tested; drawn by js/den/nav-board.js. The handle's close to the rim, so the creep itself is small; the arc carries the timer.
- 20 Nov: for you to playtest
