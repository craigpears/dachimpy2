---
title: Helium's island throws now and then on arrival
status: playtest
asked: 15 Nov
updated: 15 Nov
link: den.html?at=helium&as=dachimpy
---

**Asked:** Found by the smoke tests (15 Nov): den.html?at=helium throws about one run in three, a three.js error, Cannot read properties of undefined (reading 'isReady'). warm() in js/den/world.js calls compileAsync, which keeps checking the materials on a timer; Helium's island builds a board and replaces it straight away, so the old board's material is disposed mid-check. Likely fix: warm() calls renderer.compile instead (the same work; nothing uses compileAsync's result).

**Done looks like:** npm run smoke -- helium passes ten runs in a row.

## Log

- 15 Nov: added.
- 15 Nov: being done
- 15 Nov: for you to playtest: fixed: warm() builds shaders with renderer.compile, not compileAsync's poll that tripped on a disposed material; smoke -- helium passed 10 of 10
