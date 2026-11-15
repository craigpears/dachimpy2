---
title: Browser smoke tests for the 3D side
status: idea
updated: 15 Nov
---

*Browser smoke tests for the 3D side (long term, 11 Nov)*

The rules in `src/` have unit tests; the hand-written 3D in `js/den/` (drawing, cameras, animation,
wiring) is only checked by hand in the browser. The user (11 Nov): "It's not really been a problem
yet ... I don't think the complexity is there. We're iterating too fast. [I don't] want to be slowed
down by that stuff, but yeah, certainly there will be, you know, testing pyramid style things, you
need some smoke tests for that sort of stuff. Longer term." So, later, not now: a headless browser
suite (Playwright), its own command beside `npm test`, that loads every ?at= starting point and fails
on a console error, then drives a few key flows through `window.den` (into a house, the gallery, the
2D view, the coffin scare, a whirlpool) and checks what's on screen (one bubble per speaker, say).
The top of the pyramid, kept small.

## Log

- 15 Nov: moved over from IDEAS.md.
