---
title: The race editor crashes on load
status: playtest
asked: 15 Nov
updated: 15 Nov
link: race-editor.html
---

**Asked:** Found by the smoke tests (15 Nov): race-editor.html crashes on every load, TypeError: lay.SNAKES.TIGHT is not iterable at js/race-editor-view.js:41. den-sail.ts's SNAKES now has only LEFT and MID; the editor still reads TIGHT.

**Done looks like:** race-editor.html loads and its course draws, with no error; npm run smoke -- race-editor passes.

## Log

- 15 Nov: added.
- 15 Nov: being done
- 15 Nov: for you to playtest: fixed: the editor reads whatever snakes the course has, not TIGHT by name; smoke passes
