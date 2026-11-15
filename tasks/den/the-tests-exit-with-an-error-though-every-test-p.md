---
title: The tests exit with an error though every test passes
status: asked
asked: 12 Nov
updated: 15 Nov
---

vitest reports "Timeout calling
onTaskUpdate" from a worker (twice in a full run) while agents run alongside on the same machine, so
`npm test` exits 1. Find what holds a worker up (a long test without a break) or cap the workers.

## Log

- 15 Nov: moved over from TODO.md (spotted along the way, not asked for), its column a first guess.
