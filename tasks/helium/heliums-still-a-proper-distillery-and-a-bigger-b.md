---
title: Helium's still: a proper distillery, and a bigger bang
status: playtest
asked: 13 Nov
updated: 15 Nov
---

"I think the explosion needs to be more dramatic. If you look up a distillery on Puzzle Pirates, I think [Helium] needs to have at least a bigger setup. That little object that blows up in the background is very tiny." Look up Puzzle Pirates' distillery building (YPPedia) and give Helium's island a setup like it, big enough to read from the sea, and make the opening's explosion (and the bang when a white burns) much bigger and more dramatic. The user, later: "If white goes down, it should cause like that explosion animation as well", and the other way, "some meaningful animation that happens if you start sending up the white ... Helium should start, you know, distilling out some rum and filling some barrels or something." Go-ahead given, 13 Nov. **Done (13 Nov), to be played:** YPPedia wouldn't load for us, so built from the game's look as remembered: a timber distillery (`js/den/distillery.js`), plank walls open at the front, shingled roof, its sign, a brick chimney smoking, a smaller still and racked barrels inside; in its yard the big copper pot still on its furnace, the swan neck to the worm tub and its coil, a pipe out to a spout over a cask on a stillage with a sight glass, the pile of full casks beside it. The bang (`js/den/blast.js`, for anything that blows up): a screen flash, a fireball, sparks, a dark cloud that hangs about, copper, staves and shingles flying and landing, the camera shaken, the still shaking, its head blown off and landing back on, the copper sooted black and coming back; they cower, then shrug. Bigger the more whites burned (src/den-helium.ts, worksFor). Whites sent up: rum runs into the cask (a measure a white, twice for a Crystal Clear), a full cask capped, tipped and rolled onto the pile (Cellar); they turn to tend it. Watch: whether the bang's size and length feel right, whether the rum reads while you play at a 4:3 screen (the cask is at the edge there).

## Log

- 15 Nov: moved over from TODO.md, its column a first guess.
