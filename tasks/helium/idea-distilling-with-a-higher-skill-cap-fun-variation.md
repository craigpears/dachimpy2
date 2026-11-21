---
title: Distilling with a higher skill cap: fun variations
status: idea
asked: 13 Nov
updated: 21 Nov
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
- 21 Nov: 21 Nov, the user: once you're good, CC^12 is easy and the rest is luck (how whites and spice spawn; experts abandon boards for spice). Wants a harder Distilling that changes the thinking, not the pace: not stale spice, not more rows, not pieces that blow up whites ('do the same thing you do now, but there's more frustration'). Ideas from this, to shape with the user: (1) Dark rum: a pure-brown column, today's accident, is a clear product of its own, chaining like a Crystal Clear, with a bonus for alternating blends; two blocks to build, and they get in each other's way, because browns rise through whites; only blacks are junk, and the luck of the spawn halves. (2) Spice earned and placed: a chain of so many earns a spice you drop where you choose; it is worth points but never moves, so it is a wall in your own channels. The luck the user named becomes a decision. (3) Pour by par: no furnace timer, a budget of swaps for the session; skill as finding the shortest way, not dragging fast. (4) Two furnaces (already listed): no safe side to keep junk.
- 21 Nov: 21 Nov, the user's second thoughts. Placed/earned spice: 'I don't feel that really fits distilling ... I don't see that really exciting anybody' (dropped). Liked: furnaces on more sides, even every edge ('crystal clear is much more of a trade-off'; burnt whites matter again; 'more tactical decisions' than jumping pieces in as fast as you can), to try and see how it plays. Dark rum liked, but as a bonus on top of the Crystal Clears, not against them: 'right now your only incentive is to have like a longer and longer crystal clear chain, because anything else you would send up would just detract'. New: a party of needy drunks wanting a drink right now, more turning up as you send Crystal Clears, so sending one early can pay (timing, not only chain length). Also: an early Crystal Clear, or a spice sent up in one, making a special piece; an all-black or all-brown column making one ('is that even much of a challenge? I don't think it is').
