---
title: The race editor crashes on load
status: ready
asked: 15 Nov
updated: 15 Nov
---

**Asked:** Found by the smoke tests (15 Nov): race-editor.html crashes on every load, TypeError: lay.SNAKES.TIGHT is not iterable at js/race-editor-view.js:41. den-sail.ts's SNAKES now has only LEFT and MID; the editor still reads TIGHT.

**Done looks like:** race-editor.html loads and its course draws, with no error; npm run smoke -- race-editor passes.

## Log

- 15 Nov: added.
