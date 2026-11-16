---
title: Blockade bots as plug-in AIs: a folder with one AI per kind (war frigate, war brig, sloop, turtle, ghost sloop)
status: playtest
asked: 16 Nov
updated: 16 Nov
---

**Asked:** I hope the bot behavior is nice and modular, separated from the code ... almost in a way that you could ... slot different AIs in if needed ... clear, separate, almost like an AI folder ... within the ... blockade folder ... so that each of these can be have like a separate plugin AI. So the warfrig AI, a warbrig, a sloop, turtle, [ghost] ship

## Log

- 16 Nov: added.
- 16 Nov: for you to playtest
- 16 Nov: Built (f8959b9): src/blockade-ai/, captain.ts shared, frigate/brig/sloop/turtle/ghost.ts each kind's own, index.ts AIS registry, any kind swapped through Bots' ais. Three seeded games identical before and after; 392 tests pass.
