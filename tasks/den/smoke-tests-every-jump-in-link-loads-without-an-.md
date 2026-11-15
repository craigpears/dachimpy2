---
title: Smoke tests: every jump-in link loads without an error
status: ready
asked: 15 Nov
updated: 15 Nov
---

**Asked:** we do need a few smoke tests for this, like things like Helium's tutorial, crashing on start is really bad. We could use a suite of smoke tests for the each of these jumping in points. (15 Nov, after den.html?at=helium had crashed on arrival, live, for a day: helium-isle.js's lessonPlay threw before its lesson began, and nothing caught it.)

**Done looks like:** A smoke test (npm run smoke, and run before every push to main) that opens each ?at= link on the front page's launch pad (index.html, #places: 28 today, read from the page so a new one is covered as soon as it is added) dressed as Dachimpy (&as=dachimpy), in a headless browser, both as the plain modules and as the bundle the live site loads (?bundle), and fails on any uncaught error or console error. Each link waited on until the den has drawn its first frames and played a few seconds (cutscenes and lessons start then: Helium's crashed in its first tick, not on load), with a few key presses where a link needs one to get going (Space through a cutscene). The other pages too: the front page, the changelog, design.html, the read guides, race-editor.html, the test pages. A browser to run it: Playwright (with its Chromium, a dev dependency and a download of a hundred or so MB) is the likely pick; to agree before it is added. Fast enough to run every time (aim: under two minutes for the lot), quiet when it passes, and naming the link and the error when it does not. CLAUDE.md says to run it before a push.

## Log

- 15 Nov: added.
