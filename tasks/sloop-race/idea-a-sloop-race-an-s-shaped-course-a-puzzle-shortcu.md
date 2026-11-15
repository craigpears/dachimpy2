---
title: A sloop race: an S-shaped course, a puzzle shortcut at every bend
status: done
asked: 11 Nov
updated: 15 Nov
---

*A sloop race: an S-shaped course, a puzzle shortcut at every bend (11 Nov)*

The user: "maybe we've got enough to start some sloop races ... we've got enough mechanics here to make a
little racing course, especially like all the sloop snakes and ladders sort of stuff we talked about."
First thought: four routes, "which one do you want to compete on?" ("probably a bit more Puzzle
Pirate-esque"). Then, wanting it "a bit more tactical": "a winding, snakes and ladders, zigzagging kind of
course, just with a lot of shortcuts, and each shortcut is a different puzzle, and you have to choose either
the long way round, just ... without doing anything, and the long way it potentially involves running past
some cannons ... so there's a risk of having to do a bit of carpentry, but not as much as, say, with a crane
... a zigzagging S-shaped course where you have puzzle-based shortcuts for each one." And "it should be
significant", long enough that the choices matter. It pulls together the racing notes above ("Racing, one
day", "A course like snakes and ladders", "Guns trained on squares", "Quick clears against big combos",
"A puzzling decathlon").

**A first design (to shape with the user):**

```
 START ══ leg 1 ═══════════════════════════╗
          ▲ guns on marked squares           ║ [A] the gun gap (Gunnery)
 ╔══ leg 2 ════════════════════════════════╝
 ║ [B] the headwind gap (rowing)        ◄── a wind down the leg: the snake
 ╚══ leg 3 ════════════════════════════════╗
          ~ ~ whirlpool reef ~ ~             ║ [C] over the whirlpools (Sailing, a Vegas)
 ╔══ leg 4 ════════════════════════════════╝
 ║ [D] the locks through the headland (Bilge)
 ╚══ leg 5 ════════════════════════════════╗
                                             ║ [E] the crane over the neck (Carpentry)
            FINISH ═════════════════════════╝
    (*) the starlit door: a hidden tunnel in the cliffs, leg 2 to leg 5 (Duty Navigation)
```

- **The course:** five legs, back and forth down the page, with a spit of land or reef between each pair.
  The long way sails right round every bend, needs no puzzle and is open to anyone, but it's long, and runs
  past guns trained on marked squares (as at the checkpoint: src/den-checkpoint.ts, src/den-turret.ts).
  Land on one and you're holed: a little deck patch (Carpentry, src/den-patch.ts) before you sail on. "A
  bit of carpentry, but not as much as ... with a crane."
- **The shortcuts (the ladders), one at each bend, each a different puzzle, each cutting the bend off:**
  - **[A] the gun gap (Gunnery):** a turret sits in a narrow gap through the first spit. Load her guns
    (src/gunnery.ts, src/den-guns.ts) and shoot it out, and the gap's open. Miss, and it holes you.
  - **[B] the headwind gap (rowing):** a gap with the wind blowing straight back through it, so no sail
    gets through: row it by mirror strokes (src/mirror-row.ts). Drift and the wind carries you back up
    the leg, the snake, "all the way back to the start and you've got to row back up again".
  - **[C] over the whirlpools (Sailing):** a whirlpool reef across the bend, as at Kikkit's
    (src/den-whirl.ts): only a Vegas carries you over (src/sailing.ts). Less, and they spin you back.
  - **[D] the locks (Bilge):** a canal cut through the headland, two locks up and down, pumped by Bilge
    (src/den-lock.ts), as the canal round the checkpoint.
  - **[E] the crane (Carpentry):** a neck of land to haul her over, the crane built by Carpentry
    (src/carpentry-frame.ts), as up the cliff into the lagoon. The biggest saving, and the most work.
- **The tactics:** each shortcut saves about what a good player takes on its puzzle, so a shortcut only
  pays if that's your puzzle: the race comes down to which puzzles you back yourself on, and how fast and
  well you play them (big combos or quick clears: "Quick clears against big combos"). A good Gunner takes
  [A] and sails round [E]; a good Carpenter does the reverse. Doing all five badly loses to the long way.
- **Who you race:** to start, one rival sloop, a pirate of the den's (Daquan, say, before the pink slips:
  "Racing him for pink slips", above), taking a set route at a set pace, and your best time to beat. PvP
  later ("Solo for now").
- **Its own place:** an island of its own in the code (its course in src/, its 3D in js/den/, its lines in
  src/lines/), reached by a starting buoy off one of the islands, with its own `?at=` link to the start.
  Ends where it started, so the den's sea is left as it is.

**The starlit door: Duty Navigation finds the secret passage (11 Nov).** The user, of the Navigation duty
puzzle finding hidden routes: "I don't like the idea of like how exactly you're going to look at the sky to
see this route ... how would you actually reveal that mechanic? ... the only thing that comes to mind is in
[The Fellowship of the Ring] ... going into the mines of Moria, and he's ... doing the thing to reveal the
door by starlight. Can we do a similar kind of thing and use duty navigation as the puzzle for how you find
the door and have it discoverable in some way similar to the carpentry spots?"
- **The real puzzle (YPPedia, "Navigation", checked 11 Nov):** a round board of three rings, eight places
  round each (up, down, left, right and the diagonals). Stars fall in from outside toward the middle; you
  pick a ring and turn it (and its stars) clockwise or anticlockwise, and a star with nothing under it
  falls inward. Three or more of a colour in a line, out from the middle or round a ring, vanish. The aim
  is a **constellation**: stars of the right colours in the marked places, which then vanish and score.
  Dropping a star onto a full outer ring is a booch: the ship turns around. Keys: left and right turn the
  ring, up and down change ring, Space drops.
- **The door:** a stretch of plain cliff along the course with, for anyone looking closely, faint marks
  in the rock (found as the crane's ledge is: noticed, never pointed out; "Hidden gems, never hinted").
  Stop beside it under the night sky, and the Navigation board is the sky: each constellation you complete
  lights up its stars on the rock, and once they're all lit the outline of a door glows and swings open.
  A booch sends her about, away from the cliff. Inside, a tunnel through the cliffs comes out on a later
  leg: the biggest ladder on the course, for whoever finds it and can navigate. (Ours, not the film's: no
  words to speak, no elvish, just the stars.)
- **New work:** the one puzzle the den doesn't have yet, so it gets a module of its own (src/, knowing
  nothing of the den, with bots like Sailing's), and could find other hidden ways later (the smugglers'
  beach, Port Decorum's treasury).

**The evil constellation, somewhere else in the world (11 Nov):** built first as the starlit door's last
constellation, then taken off it to keep the race competitive: "Maybe save the evil [constellation] idea for
somewhere else in the world, then put that on the ideas list." The user's own design, made with Umami in mind
("what would be a really evil thing for Umami ... to have to contend with?"): a constellation that can only be
filled by a combo, which never matters in Duty Navigation as it's played. Found building it: three, four or
five of a colour side by side on the inner ring can still be made a star at a time (two, a gap, two, the last
into the gap), so it takes six, the last two landing together (the ring above turned so two slide over the
two gaps at once). Kept in the puzzle's module, ready for anywhere (src/navigation.ts: `given` constellations,
`bottomRow`, `needsCombo`; the bots' EVIL=1 in tools/nav-bots.mjs: with five colours the planner filled it in
6 goes of 40, with four 16 of 40, about 270 moves). Somewhere a long, deliberate challenge fits, not a race:
a vault, a treasure's lock, a navigator's trial. Credit Umami in the changelog when it lands ("we should
definitely credit that Umami ... I was just thinking of the change log being funny").
**Shown at the wolf den (15 Nov):** a step of Multibella's lesson (RULES.md, "The wolf den"): filled a star at a
time and lost to a line, then by her combo (whites in the gaps, reds waiting in the fourth ring), credited to Umami in
the changelog. Still an idea: dealt in play somewhere, the long challenge above (a vault, a navigator's trial), or as
a wolf den's rare constellation.

**Balancing from what players do (11 Nov, for a full competitive version):** "Once we got to a full competitive
version, if we got to that far, we would start recording times people took through different routes and
puzzle times, and ... collect data for ... balancing ... I think they do it in like Age of Empires, don't
they, where it's like ... percentage of people winning by ... going this certain route." So a race would log
each run: the route taken (which shortcuts, which snakes), the time on each puzzle and each leg, and the
finish, kept by the leaderboard's worker (worker/index.js, D1) as the Carpentry primer's scores are. Then
how often each route wins, and what each shortcut really saves at each skill, to tune the course by (not
auto-balancing, data for the user to balance by). Only with players' runs, anonymous, by pirate name at
most. **Replays, down to the puzzling, and watching a race (11 Nov):** "the full version, you'd have ...
replays, and ... that would go down to the detail of the actual puzzling, because that's kind of what you're
watching and part of the whole point of the race. It's also what makes this so fantastic. It would be so
fantastic to watch. You could see everybody puzzling and racing." So a replay shows the sea and every
sloop on it, and beside each one the board they're playing, move by move: the Vegas being built at the
whirlpools, the panicked dash past the guns. Cheap to keep, as the puzzles are dealt from a seed: a run is
its seeds and its moves with their times, played back through the same puzzle modules. And watched live,
a race to spectate: the sea, and each racer's board.

**Shooting each other: Gunnery's other use in a race (11 Nov):** "one of the advantages of [gunnery] as well
is that you can disrupt somebody trying to do the sailing Vegas or something ... by shooting them. So yeah
... I forgot there's going to be those competitive elements to this." So her guns, loaded by Gunnery, aren't
only for knocking out the gun gap: a rival sitting still to build a Vegas at the whirlpools or the tunnel is
a sitting duck for you, holed and patching while you sail on (as "Dodging, and what a hit does" above has
it: dazed, never knocked out). And the other way round: build your big combo where nobody can get a shot
at you. First against the rival sloop (it could fire on you too), then players against each other.
Shots as a budget (the user, 11 Nov): "Maybe start with one or two guns to enable that gameplay? And make
obstacles need to either use those instead of vs other players as a kind of peaceful racer bonus or just need
more hits idk." So every racer starts with a gun or two already loaded, enough to matter at the crowded line
through the whirlpools. Either the shot-away obstacles (the gun gap's guns, the shoot-away rocks) want those
same shots, so firing at another racer costs you a way through and leaving them in peace is its own reward;
or the obstacles simply need more hits than a starting gun or two, so the loaded shots are for racers and the
obstacles still take Gunnery. To weigh with the balance simulation (TODO.md), which can run both. Agreed
(11 Nov): "I definitely want to be able to shoot other racers. That's absolutely part of this." Now in
TODO.md, "Shooting other racers".

**A Rigging passage: trimming her through shifting winds (11 Nov):** the user wants Rigging in, "certainly in
a way that's like rigging ... I'm not sure I ever liked it as a compliment to the sailing puzzle ... my
understanding of like rigging. Usually, is all about changing winds and whatnot ... the rigging shortcut is
one full of unpredictable winds where you've got to change the rigging quick ... changing the rigging
positions to deal with high wind, low wind, catching the wind from a different direction ... similar to
what we've done with rowing, are we able to ... tweak the rigging puzzle so that ... you can deal with
really gusty, unpredictable passages, and that, again, would give you another path through, is a rigging
path. But you've got to constantly change and adapt the rigging to get through it."
- **A first shape (to shape with the user):** a passage of gusty, shifting wind, its next change shown a
  little ahead (stronger, lighter, round to another quarter), as mirror strokes turned a puzzle's clears
  into pulling the oars. On the Rigging board, what you clear sets her trim: reefed for a blow, full sail
  for light airs, sheeted round to the side the wind's coming from. Trimmed to the wind she's carried on;
  caught wrong she's pushed back or stalls (a knockdown in a blow: the snake).
- **Why it suits Rigging:** its play comes in small breaks every two or three moves (above, "How Rigging
  would move her"), which here is the point: the wind keeps changing, so it's quick, constant adjusting
  that gets her through, not holding out for a heavy combo. The opposite of the Sailing and rowing
  shortcuts, so it's a different kind of player's way through.
- **The real puzzle (YPPedia, "Rigging", read 11 Nov):** a hexagonal grid of pieces, moved in straight
  lines in six directions; **six pulleys** round it, one always active, the active one moving on clockwise
  after every move, pull or not. A chain of a colour in front of the active pulley is pulled off the board;
  big pulls score, lots of small ones don't. Surrounding pieces in a pull is a loop (a bonus, and loops on
  the rope coil); the coil full (20 loops) gives a wild piece; no pull three moves running loses 5 loops.
  Special pieces: wild, gaff (pulls everything round it; from surrounding a non-matching piece), tar (from
  pulling all of a colour, five or more), splice (a second chain pulled; from linking an inactive pulley).
- **The six pulleys as her rigging points (the user, 11 Nov):** "the different combos or a hook or something
  would like impact whether you're putting the sails up, down, catching the angles. I don't want it just to
  be like rowing ... normally rigging's all about, you know, it goes around in a circle ... is it 8 points
  ... or is it 6? ... it's like a toggle. So if you clear a piece on any one of the [points] around ... it
  toggles the rigging for that point. So essentially ... if you want sails down, you have to unclip all ...
  of them. If you want full set, you have to do more of them, and maybe ... they almost charge, so ... bigger
  combo will hook it immediately, or you have to do multiple to kind of slowly kind of tighten it. That would
  work actually very well." So each of the six pulleys is a line of her rigging: a pull at it hauls that
  line in, a big pull (or a loop) hauls it taut at once, small ones a bit at a time; let alone, a line slowly
  pays out. All six hauled is full sail for light airs; all let go, sails down to ride out a blow; hauled on
  one side and not the other, sheeted round to catch a wind from that quarter. The active pulley going round
  clockwise is the tactics: you can only haul the line whose turn it is, so you plan your pulls round the
  board to have her trimmed for the gust that's coming.
- Keep it the real puzzle with a new job, as mirror strokes did for rowing. SunnyKira, "sublime in
  rigging", to teach it.

**More kinds of shortcut, for later versions of the course (11 Nov):** "we've got a good collection of
mechanics actually here that you can have all different kinds of shortcuts." One the user suggested:
"some destructible object that then reveals the shortcut. So like you shoot some rocks or something" (rocks
across a gap, blasted away by her guns, loaded by Gunnery). The first draft's gun gap reuses the
checkpoint's mechanic instead (TODO.md).

(To shape with the user: where the course is and how you come to it; how long a race runs (a few minutes
the long way?); whether the rival takes shortcuts too; what winning gets you; whether it's night all race
or the door only shows at dusk; and what to build first: the course, the long way and one or two shortcuts
the den already has, before the Navigation puzzle and the door.)

## Log

- 15 Nov: moved over from IDEAS.md.
- 15 Nov: you said: "is this in a different category of thing than ideas is this more notes than I I don't know what ideas are left"
- 15 Nov: done: split up: the course, shortcuts, rivals and shooting are built (RACE.md); live ideas now their own cards: a-rigging-passage-trimming-her-through-shifting-, the-evil-constellation-dealt-somewhere-in-the-wo, balancing-from-what-real-players-do-and-replays-; more shortcut kinds are in RACE.md; answer: it was mostly notes
- 15 Nov: you said: "is there any is this more notes really than ideas at this point is there anything in here that hasn't been actioned or isn't captured somewhere else"
- 15 Nov: answer to 'anything not captured?': no. Course, shortcuts, rivals, shooting and the shot budget are built and in RACE.md; the three live ideas (rigging passage, evil constellation, balancing from real players/replays) are their own cards. Nothing left here but notes; stays done.
