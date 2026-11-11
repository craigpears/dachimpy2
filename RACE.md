# The sloop race: design document

The race's design and balance in one place: what it's for, what's built, what's agreed, the ideas, and the
open questions. The user, 11 Nov: "all these kind of thoughts, design and balance decisions should all be in
some kind of game design document specific to these races."

How it sits with the other notes:
- **RULES.md** ("The sloop race", "The starlit door") has the exact rules as built.
- **TODO.md** has the agreed work still to do.
- **IDEAS.md** keeps the long brain-dumps.
- **This file** pulls them together, with the reasoning, and is kept up to date as the race changes. Each
  heading says whether it's **built**, **agreed** (in TODO) or an **idea**.

## 1. What it's for

- **A minigame, not a sea battle.** "Creative new mechanics, and tutorials", built from the puzzles the den
  already has (STORY.md: "New mechanics, concept ideas and tutorials, not the big fights again").
- **Snakes and ladders at sea.** "A winding, snakes and ladders, zigzagging kind of course, just with a lot
  of shortcuts, and each shortcut is a different puzzle, and you have to choose either the long way round,
  just ... without doing anything" or a shortcut, which "should be significant".
- **Back yourself on your puzzles.** Every shortcut costs a puzzle and saves about what a decent player takes
  on it, so a shortcut pays only if it's your puzzle. The race comes down to which puzzles you're good at,
  and when you dare to play them.
- **Part course, part maze.** On a first go: "I've not got a clue where I'm going. But then again ... is
  that a good thing? ... Is it like a maze as much as a course?" Settled: the long way is plain to follow,
  and the shortcuts are the maze, there to spot and work out, never marked.
- **A race against people.** Several racers on one course, shooting each other: "I definitely want to be
  able to shoot other racers. That's absolutely part of this."
- **Fun to watch.** "It would be so fantastic to watch. You could see everybody puzzling and racing."

## 2. The course (built, a first draft)

- **Where it is:** its own stretch of sea out past Primates Rule, behind a line of rocks with one gate in
  it. It's laid out on the den's own sea, from a few numbers (`LAY.RACE`), so it can be reworked freely: "We're
  going to have to go through several iterations of this course."
- **The start:** a buoy off the gate. The starter counts you down.
- **The legs:** five legs, back and forth across the sea, with a spit of land between each pair, and the
  long way round each spit's end. The course's own breeze blows across it, so every leg is a reach and
  every bend a run. Nobody sails back the way they came.
- **Home:** a trade wind up the left-hand side sweeps her up to the finish, by the gate.
- **Times:** the long way takes about 4:20. The first draft's one rival takes the long way at a set
  pace and is home in 3:55. Your best time is kept in this browser.

## 3. Shortcuts (the ladders)

**Two kinds of shortcut.** On the move, you keep sailing while you puzzle: Sailing on the pilot, Gunnery
while you sail. Stopped dead, she sits still while you play, which is slower for the same puzzle time.

**Sheltered or exposed.** A stopped-dead shortcut can be sheltered: in a lock's chamber between its walls,
or on the crane's ledge behind the neck of land, out of a passing broadside's reach. These are safe to play
even in the lead. Others are out in the open: the whirlpool channel's mouth and the starlit door's rock and
mouth. Sitting there, you're a sitting duck for anyone coming up behind (§6).

| Shortcut | Puzzle | Kind | Saves (s) | State |
|---|---|---|---|---|
| The gun gap: a gap with a gun either side, as at the imperial checkpoint | A heavy combo zooms her past (a big Sailing chain, or a Vegas rowed each side); or knock the guns out by Gunnery | On the move | 30 | Built |
| The headwind gap: the wind straight back through it | Rowing (mirror strokes); idle in it and the wind blows her back out | Rowing, slowly | 30 | Built |
| The whirlpool channel: three whirlpools across a spit | Only a Sailing Vegas from its mouth carries her over; anything less sends her back to the mouth | Stopped at the mouth to build the Vegas, exposed | 55 | Built |
| The locks: a lock up and a lock down | Bilge, pumping each lock | Stopped dead, sheltered in the chamber | 45 | Built |
| The crane on the last neck of land | Carpentry, building the crane a part at a time, which hauls her over | Stopped dead, sheltered behind the neck | 75 | Built |
| The starlit door: a hidden tunnel from leg 2 to leg 5 (§9) | Duty Navigation on the rock (two small constellations), then a Sailing Vegas through | Stopped dead, twice, exposed | about 145 | Built, secret |
| A barrier across a gap: overgrowth, driftwood, fallen trunks | Foraging clears it ("it's not even macheting. You just have to clear the barrier") | Stopped dead; sheltered or exposed, to decide | ? | Agreed. Umami's way round |
| Small shortcuts a Double gets you through | Sailing (or rowing): a Double's gust | On the move | small | Agreed |
| Rocks across a gap, blasted away | Gunnery: her guns | On the move | ? | Idea |
| A Rigging passage of shifting, gusty winds | Rigging, its six pulleys as her rigging lines (§11) | On the move | ? | Idea |

The savings column is `RACE.DECENT` and `DOOR.SAVES`, as tested.

**Shortcuts not all created equal (agreed).** Shortcuts of every size, each needing a combo of its size. A
tiny one a Double gets you through, bigger ones need a bigger combo, the biggest is the starlit door. "Are
you a person that can break quick double triples? That gets you through some shortcuts ... Or do you want to
go for those giant" ones.

**Findable, never marked.** On a first go the user couldn't find the crane or the rowing gap ("There's a
carpentry shortcut in here I've not seen it"). So the shortcuts should be plain to see as you sail past: a
gap, the crane's footing. The starter names a few as examples. Only the starlit door is secret.

**The combo is what gets you through, not the puzzle.** At sea a heavy combo is what rushes her past
guns, whirlpools and winds, whether sailed or rowed: "it's the combo, heavy combo that gets you through, not
anything specific to either one." A square at a time past guns is a sitting duck; rowing past them doesn't
help.

## 4. Snakes (agreed; only the first draft's are built)

Snakes are winds that sweep her back. They're the risk that makes a dash a gamble.
- **A trade wind back up the course,** crossing the legs mid-zigzag. A Double's gust carries her clean over
  it; anything less lands her in it and sweeps her back a leg ("bring you back to the start would be a bit
  evil, but ... a significant like one leg").
- **The left trade wind a real snake,** on the way out as well as the way home. Legs end hard by it, so a
  careless turn or a gust too far lands her in it ("I want the snakes and [ladders]").
- **A snake right past the gun gap.** "I almost want it to be like an accidental misclick ... you panic
  trying to get past the gunning post ... you accidentally clicked one too many, and now you've got no way of
  turning around." It also makes the gun gap a gamble: on its own it's "almost no-brainer", since you only get
  shot once.
- **The last, biggest snake by the finish.** The run home is narrow, hard by a wind that sweeps her all
  the way back to the start, with the finish in sight. "I'm near the finish line. If I accidentally misclick
  ... pushed into the trade winds that send you back right to the very start."
- **A snake's sting grows down the course.** Near the start it costs little ("already a bit more balanced
  because it's right near the start of the course anyway"); by the finish it costs the lot. Where the
  shoot-away rocks go, if they come, matters the same way.

## 5. Knowing where you're going (agreed)

- **Clear buoys round the long way,** numbered at each bend, with the next one shown and "Leg 2 of 5".
  These replace the little gold flags, which "don't look like they're in the actual proper direction at
  all".
- **The race explained at the start.** The starter at the buoy explains the idea before the off: "Here are
  your options ... do you want to bilge through a [lock]? Or you can take the long way around or zoom over a
  whirlpool, risking a doomed return to the start if you ... get it wrong." The long way, the shortcuts
  (with a few named as examples), and the snakes. Never the starlit door: a race's rules are explained,
  its secret isn't.
- **A ceremonious finish.** "You need a more ceremonious finish goal line for sure." A line across the
  water between two markers, flags or a banner, and a moment when you cross it, with your time and the
  others'.

## 6. Racing each other: position and risk

**Several racers (agreed).** Two to four on the course, you and bots to start with: "start adding multiple
players to this first, even if it's like 2 to 4 players with some bots, and obviously tweak the course and
sizes according to that."

**Shooting other racers (agreed).** Her guns are for the other sloops as well as the gun gap. Her guns
fire a broadside, about three squares to her side. A hit holes her: she's dazed and has to patch by
Carpentry, but is never knocked out. Every racer starts with a gun or two loaded, so there's something to
fire from the off. "One of the advantages of [gunnery] ... is that you can disrupt somebody trying to do the
sailing Vegas ... by shooting them."
- **Still open:** do the obstacles use the same shots, so leaving other racers in peace is "a kind of
  peaceful racer bonus"? Or do they just need more hits than a starting gun or two? The simulation
  (§8) can run both.

**First come, first served (agreed).** A lock is anyone's who gets there first: "If you got through it
first, we get through it first." There could be more than one lock or crane spot, but not one for
everybody.

**The lead isn't safe; the back is free (the user, 11 Nov, theorising).** "Getting an early start is not
necessarily what it seems, because let's say you're in the lead. You can't necessarily take the tunnel
because ... somebody behind you is going to come and shoot you and interrupt your puzzle, the same as with
the sailing shortcut. Whereas if you're at the back ... turning around is not really the thing in this race.
So if you're at the back, you can take those shortcuts at will, in theory."
- **Why it works.** The course runs one way, every leg a reach with the breeze, so nobody turns back. A
  sloop sitting still to puzzle can only be shot by someone coming up behind. Guns fire to the side, so
  they shoot her as they sail past.
- **But the leader still puzzles.** The user, 11 Nov: "Some can be safe, like ... the locks and the crane
  ... So I don't want the leaders not be able to puzzle at all. That doesn't sound fun." So the sheltered
  shortcuts (§3) are safe to play in the lead: the locks (Bilge, quick) and the crane (Carpentry, longer and
  saving more). Add any others as the course grows. The leader also has the on-the-move puzzles: a Sailing
  chain on the pilot, Gunnery under way.
- **What the leader can't safely do is the exposed ones.** Stopping out in the open, for the whirlpool
  Vegas or the starlit door, lets the pack catch up and shoot them on the way past. That's a gamble a
  leader might still take, with a big enough lead.
- **And the back of the field can take the exposed ones at will.** Nobody behind you means you can sit
  in the open and build a big combo for the biggest shortcuts. It's a catch-up the race doesn't have to
  fake. It grows out of the course running one way and the guns firing sideways, rather than a rule that
  helps the last place. It's a nudge, not a lock-out: every position always has puzzles worth playing.
- **It feeds the crowded line.** The quickest line, through the whirlpool start and along each leg, is the
  crowded one (§7). Puzzle where nobody can get a shot at you; build your big combo out of the pack's way.
- **To check with the simulation:** a strong leader shouldn't be doomed, a weak racer shouldn't win just by
  hanging back, and a leader should always have a shortcut worth taking (a sheltered one or an on-the-move
  one) on every stretch. How far guns reach, how long a hit dazes her, and how often you can fire set the
  balance.

**The rivals: the den's own characters (agreed).** The nameless rival becomes several pirates from the
den, each a bot with a profile: which shortcuts they go for, how good they are at each puzzle, and how
willing they are to shoot. "Everyone's got their own little profile and way they approach it."
- Kikkit goes greedy for the Vegases.
- Tzz sails steadily another way.
- A carpenter takes the crane.
- Umami the capybara takes the Foraging barrier.
- Daquan joins once his portrait is checked.
- Each looks as they do elsewhere and has a line or two on the way. Where a puzzle has bots (Sailing,
  rowing, Navigation), they play real moves. They're the testers as well.

## 7. The start: a field of whirlpools and winds (agreed)

"In the opening of a blockade, one of the challenges is, right, you've got a bunch of winds and whirlpools
and you have to really eyeball it to figure out what the fastest way forward is. And you can kind of ...
pick your starting spot along the starting edge based on that. That would definitely be a way of starting
off a race."
- **Whirlpools to ride, not to fear.** They follow Puzzle Pirates' rules, as Kikkit's do. Each racer picks
  where to start along the starting line.
- **The best line is the crowded one.** "If you want to take the most optimum route, you're more likely to
  be competing against other players and potentially going to get shot." A slower line on your own can pay.
- **No single starting spot should always win.** The simulation checks it.

## 8. Balance

**What it's balanced for.** Every way round should have "a relatively equal chance of winning". The long way,
each shortcut, and each racing style (greedy for combos, steady, aggressive with the guns) should each win
about as often, for a player who's decent at the puzzles it needs.

**What the user has felt so far (11 Nov):**
- Bilge at the locks and Carpentry at the crane are quick.
- Gunnery is slow and unrewarding: "just loading the guns and gunning takes a long time ... Gunning felt
  very unrewarding." Partly because "in the real Puzzle Pirates you can run a lot faster".
- The turrets are relentless once roused: "If they're aggroed, they are very relentless."
- The gun gap is too easy when you just run it: one hit, one patch.

**On the move against stopped dead.** "You can essentially do some of the puzzles, like [gunnery] and
sailing, while you're on autopilot. I guess bilge ... doesn't quite have that advantage." On-the-move time
half overlaps the sailing. So a stopped-dead shortcut should save more for the same puzzle time, or the
on-the-move ones should cost a little more. Being stopped dead is also exposed to the guns (§6), which
counts against it as well.

**The levers:**
- Each shortcut's saving (`RACE.DECENT`).
- The combo a gust needs (Double, Vegas).
- Where the snakes are, and how far each sweeps her back.
- The rival bots' skill and pace.
- How many hits the turrets and obstacles take, and how relentless they are.
- Starting shots, gun reach and how long a hit dazes her.
- The width of the lanes by the snakes.
- How many locks and crane spots there are.

**A headless simulation (agreed, next).** "A test harness underneath this ... where you don't need to worry
about the graphical elements. So you can just run through simulations quickly and easily, and just really
test balance."
- **What it runs:** the race's rules with no graphics, racing 2–4 bots on different strategies over many
  runs.
- **The puzzles:** played by the existing puzzle bots where they exist, otherwise a puzzle time drawn from
  a skill level.
- **What it reports:** win rates by strategy and by starting spot, and the time each shortcut really saves.
- **How it's used:** the course's next pass is tuned with it, before it's played.

**From players, later (idea).** A full competitive version would log each run: the route, the time on each
puzzle and each leg, and the finish. That gives win rates by route, "like in Age of Empires". The data is
for the user to balance by, not automatic balancing. "Balancing is going to be certainly, I think, for
players to actually test."

## 9. The secret: the starlit door (built)

A hidden gem, never hinted. There's no cheat, no `?at=` link, no shot, and the starter doesn't mention it.
- **The door:** faint marks on a cliff off leg 2. Stop by it and press Space, and Duty Navigation stands
  on the rock as the night sky. Each constellation filled lights its stars on the carved wheel. Two small
  ones open it, about a minute's play. A booch pushes her off and darkens the stars.
- **The tunnel:** it runs under legs 3 and 4 to leg 5. Only a Sailing Vegas from the mouth carries her
  through; anything less, and a draught carries her back to the mouth. It saves about 145 s of sailing.
- **Simplified (11 Nov) to be competitive.** It was first built with an evil constellation last, which took
  minutes of puzzling to save two and a half of sailing: "simplify the duty navigation down to be more
  competitive." The evil constellation is saved for elsewhere (IDEAS.md, with Umami's credit for when it
  lands).
- **Position matters most here (§6):** it's two stops, the rock and then the mouth. It's the back
  of the field's big chance, and a leader's big risk.

## 10. Watching and replays (idea)

"Replays, and ... that would go down to the detail of the actual puzzling, because that's kind of what
you're watching." A replay shows the sea and every sloop on it, with each racer's board beside them, move by
move. It's cheap to keep, because the puzzles are dealt from a seed: a run is its seeds and its moves with
their times. A race could also be watched live.

## 11. Puzzles still to fit in (ideas)

- **Rigging:** a passage of shifting, gusty winds where you keep re-trimming. The six pulleys are six
  rigging lines, hauled in by pulls at them (a big pull hauls a line taut at once). All hauled is full
  sail; all let go is sails down for a blow; one side hauled sheets her round. Its small, frequent clears
  suit constant adjusting, unlike Sailing's and rowing's heavy combos. SunnyKira to teach it. Another way:
  Rigging dealt with big clears already half-built, tuned to be as quick as a big Sailing chain.
- **Shoot-away rocks** for Gunnery. Like the snakes, where they go decides how much they matter.
- Not every puzzle needs a place: "not that we necessarily need to worry about adding every single puzzle,
  we've got enough concepts here."

## 12. Open questions

- Shared shots or more hits for the obstacles (§6)?
- Can the lead hold? How strong the "lead isn't safe" effect should be (§6).
- More than one lock or crane spot for 2–4 racers, and how the course's size changes with more racers.
- How the starlit door's door and tunnel work with several racers: once one racer opens it, is it open for
  everyone that race?
- Where the race goes in the den's story, and what winning brings.

## 13. Where it lives

- **The race's rules:** `src/den-race.ts`. Its course is `LAY.RACE` in `src/den-sail.ts`.
- **Drawn and played by:** `js/den/race.js`.
- **The starter's lines:** `src/lines/race.ts`.
- **The starlit door:** `src/den-door.ts` and `js/den/door.js`.
- **Tests:** `tests/den-race.test.ts` and `tests/den-door.test.ts`.
- **Try it:** `den.html?at=race`.
