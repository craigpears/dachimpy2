---
title: Duty Navigation: stars should drop slowly, the ring selected hard to tell, turning jumpy
status: done
asked: 13 Nov
updated: 15 Nov
---

"for Duty Nav, the pieces are supposed to slowly drop. It's feeling really weird ... some of the highlights as well and the contrasts are a bit off"; "the highlight between the selected ring and a non-selected ring is relatively minimal, so it's making it hard to tell what ring"; "the turning animation, it's just very jumpy and jagged. It's not as smooth as I expect." Done 13 Nov (js/den/nav-board.js, every Duty Navigation board, the starlit door's too): a star drops in and falls at a steady, slow pace, about a third of a second a ring (was a sixth of a second whatever the distance); the ring selected lit plainly, a bright band with gold edges either side, gently pulsing; a turn takes a quarter of a second, eased, and a run of turns flows on without stopping at each spoke. Other contrasts the user meant: to pin down with them.

## Log

- 15 Nov: moved over from TODO.md, its column a first guess.
