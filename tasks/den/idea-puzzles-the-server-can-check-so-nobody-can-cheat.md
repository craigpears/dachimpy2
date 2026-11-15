---
title: Puzzles the server can check, so nobody can cheat
status: idea
asked: 12 Nov
updated: 15 Nov
---

*Puzzles the server can check, so nobody can cheat (12 Nov)*

The user (12 Nov): "that is a problem that Puzzle Pirates really suffers from, is that everything is in a
client, especially like running puzzles ... it makes it very vulnerable to hacks and like tampering with
client-side code. So long term ... a great proof of concept, is creating puzzles and things like that that
can be run efficiently within a server-based environment." Not only whether a result is possible, but
whether its timing is: "you can't just say, oh yeah, I put the puzzle here, here, here, and here for
sailing magically ... you've had 5 minutes to send your first move, then you suddenly made 90." And "how
intensive is that? What network usage does that have?"

- **How it would work:** you still play on your own screen, instantly, but each move goes to the server
  too, and the server plays the same move on its own copy of the board (the puzzles are already rules
  with no 3D in `src/`, so the same code runs there). The server deals the pieces and shows a browser only
  what the puzzle shows (the next piece or two), so nobody can work out a run in advance. It times moves
  by when they arrive, not by what the browser says, so ninety moves can't land at once after five
  minutes of nothing. A move faster than a person could make is refused. If the two copies disagree, the
  server's wins (it only happens to someone tampering).
- **How much traffic (a rough sum, 12 Nov):** a move is a few bytes (which move, a turn, where), and a fast
  player makes one to three a second. Sent in little batches four times a second, that's about 100 bytes a
  second up: about 60 KB for a ten-minute race, less than one picture on the changelog. The server's
  snapshots of six sloops back down are a kilobyte or so a second. Checking a move costs the server a
  fraction of a millisecond.
- **What it can't stop:** a program playing the puzzle for you in the browser (a bot) is making real,
  legal moves at a person's pace. That's caught only by its patterns, as in any online game.
- **Where it'd run:** Cloudflare, as the den's rooms already do. The free plan covers playtests; the paid
  Workers plan ($5 a month, as last known) covers a lot of races before anything more is charged.
- Racing first (RACE.md §6, "Long term, a proper server"), then every puzzle played online.

**But a bot client still plays legally (12 Nov):** "what's to stop ... some kind of botted client from ...
determining the perfect ideal placement of a piece and slotting it in exactly at the right spot ... and
just sending the message back"; bilging is the clearest case, "it's so easy to detect a bilge move for a
bot and ... execute" it rapid fire. "Is there any way of architecturing and structuring it in a more
fundamental way so that you don't have to think, oh, how are we going to detect hacks and unfair play?
... experiment with technical security solutions." Thoughts to experiment with:
- **Nothing makes it impossible.** If a person can see the board and answer with a move, so can a
  program. Chess is the proof: the whole board is public and the server checks every move, and cheating is
  still caught only by detection. So the server stops *impossible* play (tampering, too fast, moves sent in
  bulk, seeing the future); what's left is a bot playing *possible* moves very well.
- **Cap the speed at a human's best.** The server takes moves no faster than a top player makes them
  (Bilge's swaps a second, Sailing's drops), so a bot is at best a flawless top player, never a machine
  gun. The gap left is only in the choices.
- **Bound what puzzling is worth.** Design so a perfect puzzle can't win on its own: a shortcut saves at
  most so much (the race already works so: each saves about what it takes to play), and a lock or a crane
  takes some seconds whatever you do. Then the rest is routing, timing a gamble, shooting, reading the
  others: judgment a puzzle bot doesn't have.
- **Catch it as chess does, by agreement with a bot.** We have bots for every puzzle already (`src/*-bot.ts`):
  the server can score how often your moves are the bot's best one, and how your thinking time follows how
  hard the board is (people slow down on a hard board and speed up on an easy one; a bot's even). A person
  agrees with the best move now and then; a bot nearly always. Quiet, after the race, never accusing on
  one result.
- **Raw input, not decisions.** Send the pointer's path and key timings, and the server replays the input
  rather than trusting "piece here". A bot then has to fake a human hand as well: harder, not impossible.
- **Make room for bots instead.** A bot league, labelled, with its own table (Dachimpy.com's simulators
  were half this already); ranked play only in rooms among people who know each other, or with a
  reputation to lose.

## Log

- 15 Nov: moved over from IDEAS.md.
