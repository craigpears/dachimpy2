---
title: Distilling with a higher skill cap: fun variations
status: idea
asked: 13 Nov
updated: 15 Nov
---

*Distilling with a higher skill cap: fun variations (13 Nov)*

The user, 13 Nov: "I know some puzzles have a skill cap, like distilling. People can just play that so perfectly.
So anything we can just to create a fun kind of variation of distilling would be brilliant to make it
challenging." Distilling played well is near solved (a perfect player sends up CC^12 again and again), so the den
could have variations on it with more to master, each its own mode on the same rules module (src/distilling.ts),
knowing nothing of where it's played. Ideas to shape with the user:
- **A hotter furnace:** the fire speeds up as the chain grows, or with each column; the clock is the skill cap.
- **Tainted spice:** some spice that spoils a Crystal Clear, or spice that moves, so the block can't be built and
  forgotten.
- **Two furnaces:** one each side, whites to one, junk to the other, the board pulled both ways.
- **A taller still:** more rows or columns, so the V and the channels are longer and the hauls harder.
- **Orders from Helium:** a target pattern for the batch (so many whites, a CC of a given length by a given
  column, a column of only browns), scored on meeting it, like a daily challenge.
- **Duels:** two players on mirrored boards, a Crystal Clear of yours dropping a junk piece onto theirs.
- **Blind pours:** the next column's pieces hidden till they slide in, so you plan for the unknown.
Each with a bot tier tuned to it (src/distill-bots.ts), and a read version, as every tutorial has (RULES.md).

## Log

- 15 Nov: moved over from IDEAS.md.
