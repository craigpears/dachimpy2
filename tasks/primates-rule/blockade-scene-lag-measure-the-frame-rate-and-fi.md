---
title: Blockade scene lag: measure the frame rate and find the biggest cost
status: playtest
asked: 15 Nov
updated: 15 Nov
---

**Asked:** The blockade scene seems like it's quite laggy to me ... can you just do a sanity check as well on exactly what is the biggest contributor to whatever's slowing? ... I don't even know what the frame rate is, or how much it's being slowed down

## Log

- 15 Nov: added.
- 15 Nov: being done
- 15 Nov: Measured (Playwright Chromium on this machine's T1200, whole board in view, 2000x1125): the blockade page never cleared its sparks (the den's loop does, the page didn't), so every shot's sparks stayed: 98 scene objects at 7 s, 15,389 at 48 s, 30 fps falling to 12 within the minute. Fixed: tickSparks in world.js, called by the den, two-ships and the blockade page. Now steady at about 20-23 fps with the whole board in view. What's left: the game logic is about 2 ms a frame; resolution, shadows, terrain and sea make no difference; the 30 ships are 4,081 separate meshes (about 3,400 draw calls), taking the render from about 13 ms to about 42 ms; then live sparks (500-900 in a fight, a draw call each). Next: bake each ship's still parts into one mesh a material, and draw the sparks as one instanced mesh.
- 15 Nov: for you to playtest
