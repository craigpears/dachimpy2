---
title: The wolf den's board shows only three rings: a wolf den's Navigation has four, the extra space for combos
status: playtest
asked: 20 Nov
updated: 20 Nov
---

**Asked:** Also, what is going on with this? I only see 3 due to navigation rings. The whole point, part of the point of Wolf Den Navving is there are 4 of them. So that gives you the extra space to do the combos.

## Log

- 20 Nov: added.
- 20 Nov: 20 Nov: the fourth ring was there in the rules, but drawn only as stars sitting on the wheel's handles, no ring of its own to see. Now a wolf den's wheel has a fourth broad rim out over the handles, ticked like the outer one, lit when it's the ring selected (js/den/nav-board.js, wheelCanvas(four)). Plain three-ring boards (the starlit door, the test page) unchanged. Not yet looked at in a screenshot.
- 20 Nov: for you to playtest
- 20 Nov: 20 Nov, the user: 'The spacing on that fourth ring looks really weird ... surely the gap between each ring should be consistent'. The fourth rim now as far from the third as the others are apart (495 on the wheel's scale, the gaps 130, 121, 126), the whole wheel drawn smaller (0.78) to fit, its spokes ending at it, no handles, the next star waiting out past it.
