---
title: The code in folders by what it is: puzzles, places, adventures, tutorials, the race
status: asked
asked: 15 Nov
updated: 15 Nov
---

**Asked:** we were going to go with these modular islands and things. Yeah, looking at the code, I can see different folders, but it's certainly not organized into like here are the adventures, here are the tutorials. (15 Nov; "this will probably be a big thing".) Today each island is modular by file but not by folder: Helium is src/den-helium.ts (rules), js/den/helium-isle.js (3D) and src/lines/helium.ts (lines), among 107 files in js/den/, 116 in src/ and 132 compiled in js/, flat; only CLAUDE.md's long paragraph says which is which.

**Done looks like:** A folder each, the same names in src/ (rules, lines) and js/den/ (3D), so a feature is one place to look: puzzles/ (each puzzle's rules, bots and board look: distilling, sailing, gunnery, bilge, carpentry, swordfight, treasure haul, foraging, navigation, rowing), places/ (an island each: helium, kikkit, tzz, multibella, jazzmy, port decorum, the smugglers' beach, the wedding isle), adventures/ (the rum run, the carpet ride, Umami's rescue, the wedding), tutorials/ (the shape, the read guides, each teacher's lesson), race/ (the sloop race, its sim, editor, online), houses/ (the housing district and each house), and the den's core (world, sea, sailing, wind, the wall and raids) and shared pieces (furniture, creatures, portraits, cutscenes, blasts) apart from them. Each folder a short README saying what is in it, in place of most of CLAUDE.md's file list. Done mechanically (moves and an import rewrite by a script), nothing else changed in the same work, the tests, the build, the bundle and the smoke tests passing before and after. To agree first: the folders and what goes in each. When: once nothing else is in flight (the Primates Rule and Helium branches merged, the smoke tests in), since it touches every import and would clash with any open branch.

## Log

- 15 Nov: added.
