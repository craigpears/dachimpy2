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

## 2. The course (built: its second pass, 11 Nov)

- **Where it is:** its own stretch of sea out past Primates Rule, behind a line of rocks with one gate in
  it. It's laid out on the den's own sea, from a few numbers (`LAY.RACE` in `src/den-sail.ts`: a column
  for each shortcut), so it can be reworked freely: "We're going to have to go through several iterations of
  this course." `tools/race-measure.mjs` measures it with the helm (the long way, each spot's way through the
  start, each shortcut's saving), and the tests hold the course to those numbers.
- **The start (§7):** Space by the buoy off the gate takes you in to the starting line behind the rocks;
  you pick your spot along it; the starter's card explains the race (§5); Space, and he counts you down.
  Below the line, a field of plain whirlpools and winds to eyeball.
- **The legs:** five legs, two squares deep, back and forth, a spit of land between each pair, the long way
  round each spit's end by its numbered buoy (§5). The course's own breeze blows out across it, so every leg
  is a reach and every bend a run. Leg 4 before the locks is the zigzag (§3).
- **Home:** the run home is one square wide, the left-hand trade wind blowing along beside it (§4), to a
  finish line across it between two towers (§5). Past the line, that wind carries you back to the start.
- **Times:** the long way takes about 3:42 (222 s), from the long way's own spot on the line. Your rivals
  (§6) are home in about 3:13 (Kikkit, her Vegas a gamble: 3:00 to 3:45), 3:24 (Tzz) and 3:36 (Dalnoth),
  so you beat them on the shortcuts you're good at. Your best time's kept in this browser.

## 3. Shortcuts (the ladders)

**Two kinds of shortcut.** On the move, you keep sailing while you puzzle: Sailing on the pilot, Gunnery
while you sail. Stopped dead, she sits still while you play, which is slower for the same puzzle time.

**Sheltered or exposed.** A stopped-dead shortcut can be sheltered: in a lock's chamber between its walls,
or on the crane's ledge behind the neck of land, out of a passing broadside's reach. These are safe to play
even in the lead. Others are out in the open: the whirlpool channel's mouth and the starlit door's rock and
mouth. Sitting there, you're a sitting duck for anyone coming up behind (§6).

| Shortcut | Puzzle | Kind | Saves (s) | State |
|---|---|---|---|---|
| Spit 1, the gun gap: three squares deep, a gun either side, its marks all in the spit | A Quad from the leg rushes her past (a big Sailing chain, or a Vegas rowed each side); or shoot its guns quiet; a square at a time she's holed | On the move | 14 | Built |
| Spit 2, the headwind gap, a dog-leg at its far end | Rowing (mirror strokes); idle in it and the wind blows her back out | Rowing, slowly | 25 | Built |
| Spit 2, a small gap, one wind blowing back across it | A Double, built on the move and broken as she's lined up | On the move | 8 | Built |
| Spit 3, the whirlpool channel | Only a Sailing Vegas from its mouth carries her over; less sends her back to the mouth | Stopped at the mouth, exposed | 49 | Built |
| Spit 3, a barrier of driftwood across a gap | Foraging clears it, from the notch in front of it | Stopped dead, sheltered | 15 | Built |
| Spit 4, the locks: a lock up and a lock down | Bilge, pumping the up lock; a sheltered berth to wait your turn in | Stopped dead, sheltered | 26 | Built |
| Leg 4, the zigzag (on the long way) | Hop its headwinds with well-timed Doubles; weaving through is the no-puzzle way | On the move | 8 | Built |
| Spit 5, the crane in a notch | Carpentry, building the crane a part at a time, which hauls her over | Stopped dead, sheltered | 38 | Built |
| Spit 5, a gap with two winds blowing back across it | A Triple | On the move | 9 | Built |
| The starlit door: a hidden tunnel from leg 2 to leg 4 (§9) | Duty Navigation on the rock (two small constellations), then a Sailing Vegas through | Stopped dead, twice, exposed | 78 | Built, secret |
| Rocks across a gap, blasted away | Gunnery: her guns | On the move | ? | Idea |
| A Rigging passage of shifting, gusty winds | Rigging, its six pulleys as her rigging lines (§11) | On the move | ? | Idea |

The savings column is `RACE.DECENT` and `DOOR.SAVES` (and the simulation's `SIM.ZIGZAG`), as measured by the
helm and tested. Each is about what the simulation recommended (§8): a shortcut pays only for a player good
at its puzzle.

**Every stretch has a shortcut a leader can play safely (built 11 Nov).** Sheltered or on the move: the gun
gap's combo (spit 1), the Double's gap (spit 2), the barrier of driftwood (spit 3), the locks and the zigzag
(spit 4, leg 4), the crane and the Triple's gap (spit 5). The simulation checks each saves a good player time.

**The barrier of driftwood (built 11 Nov).** "it's not even macheting. You just have to clear the barrier."
A jam of logs across a gap in spit 3; in the notch in front of it, Space stands a board of Foraging on the
jam (`src/foraging.ts`, played as Umami's), dealt with two bundles of driftwood and nothing more to come;
cleared down off the bottom, the jam breaks up and floats off. **Sheltered**, decided: the notch is tucked
into the spit between the gap's banks, so no broadside reaches her, and with the whirlpools beside it in the
open, it's the leader's shortcut on that stretch. Umami's way round, when he races (§6). Once cleared it's
open the rest of the race (the simulation has each racer clear her own, as with the crane: §8, "For the user
to decide").

**Shortcuts not all created equal (built 11 Nov).** Shortcuts of every size, each needing a combo of its size. A
tiny one a Double gets you through, bigger ones need a bigger combo, the biggest is the starlit door. "Are
you a person that can break quick double triples? That gets you through some shortcuts ... Or do you want to
go for those giant" ones.

**Small combos pay on the long way too (built 11 Nov: the zigzag on leg 4).** "When I've said, you know, you
should have some benefit from just doing small doubles, that's very much something you can do on the long
way round ... people have to time it so that they break their double at the same time so they can jump over
an obstacle, like a wind or something like that." The shape: a narrow stretch of the long way, only two
squares wide, with headwinds blowing her back, alternating side to side in a zigzag with gaps between them.
"Yes, you can bump around the rocks and get around them, but getting over them with, like, a double, like a
well-timed double, would be a lot more effective."
- **Weaving through costs time.** You swing from side to side through the gaps, and any slip puts you in
  a headwind that pushes you back.
- **A Double timed right hops one.** A Double broken just as she's lined up behind a headwind carries
  her over it, like a gust over the whirlpools.
- **It's a skill on the long way.** Timing your breaks, not only building big combos, so the long way isn't
  just waiting. It suits the quick double-and-triple player, and it's on the move, so the leader can use
  it safely (§6).
- **As built:** four headwinds, one square each, alternating side to side two squares apart, a wind behind
  her there so she can weave either way (in the course's breeze she couldn't turn back up). Woven through,
  about 17 s; hopped with a Double each, about 9.

**Findable, never marked (built 11 Nov: every way in is a gap beside a leg).** On a first go the user couldn't find the crane or the rowing gap ("There's a
carpentry shortcut in here I've not seen it"). So the shortcuts should be plain to see as you sail past: a
gap, the crane's footing. The starter names a few as examples. Only the starlit door is secret.

**The combo is what gets you through, not the puzzle.** At sea a heavy combo is what rushes her past
guns, whirlpools and winds, whether sailed or rowed: "it's the combo, heavy combo that gets you through, not
anything specific to either one." A square at a time past guns is a sitting duck; rowing past them doesn't
help.

## 4. Snakes (built 11 Nov)

Snakes are winds that sweep her back. They're the risk that makes a dash a gamble. The starter calls out each
sweep.
- **The trade wind back up the course** crosses all of leg 3 and runs up through a gap in spit 2 onto leg 2.
  Every racer hops it with a Double ("you have to get a double in sailing and basically jump over the trade
  winds"); anything less sweeps her back up onto leg 2, a leg and a half lost ("back a significant like one
  leg"). The pilot can't take her round it: it's to be jumped.
- **The left-hand trade wind**, up the whole left-hand side to the starting line: a real snake on the way
  out. Legs 2 and 4 end hard by it, so a careless turn or a gust too far there sweeps her back to the start
  ("I want the snakes and [ladders]").
- **The tight water just past the gun gap.** A wall ahead, and a move too far, a wind along leg 2 sweeping
  her back to its bend ("you accidentally clicked one too many"); out of the gap, a turn to port is the way
  on. A Quad from the leg lands her clear, a Quint in it: it makes rushing the gap a gamble.
- **The last, biggest snake by the finish.** The run home is one square wide beside the left-hand trade
  wind, which takes her all the way back to the start with the finish in sight ("If I accidentally misclick
  ... pushed into the trade winds that send you back right to the very start").
- **A snake's sting grows down the course** (tested): the tight water costs a few seconds, the trade wind up
  the middle a leg and a half, the left-hand one everything you'd sailed.

## 5. Knowing where you're going (built 11 Nov)

- **Clear buoys round the long way:** a tall red and white buoy at each bend, its number on a board above it,
  on the outside of the turn; the one you're sailing for lit, its lamp on and its number gold. The clock's
  bar says "Leg 2 of 5 · to buoy 2", or "the run home · to the finish line". The gate's flags and the finish
  flag, which "don't look like they're in the actual proper direction at all", are gone. Shortcuts are never
  marked.
- **The race explained at the start:** on the line, the starter's card: the long way round the buoys, no
  puzzle; shortcuts through the spits that cost a puzzle, a few named (bilge up through a lock, build a
  crane, row the headwind gap, zoom over the whirlpools on a Vegas, hop a headwind with a Double), and "Get
  it wrong and ye're back where ye started"; the winds that sweep you back, the left-hand trade wind most;
  and that the others shoot you if you sit still in the open. Never the starlit door: a race's rules are
  explained, its secret isn't (`src/lines/race.ts`, `STARTER.explain`).
- **A ceremonious finish:** a line across the run home between two striped towers, gold balls on top, a
  chequered banner strung between them over the water and a chequered line on it. Crossing it, a burst of
  colour, and a card: "Over the line", her time, and her place.

## 6. Racing each other: position and risk

**Several racers (rules built 11 Nov; on the water, stage 3, 11 Nov).** Two to four on the course, you and
bots to start with: "start adding multiple players to this first, even if it's like 2 to 4 players with
some bots, and obviously tweak the course and sizes according to that." The field (`src/den-racers.ts`)
holds each racer's pose, the stretch she's reached in order, what she's doing (sailing, waiting her turn,
puzzling, dazed, carried by a gust, the crane or the tunnel, finished), and her time and place. In the den
it's you and one to three rivals (below), picked with 1 to 3 on the line, three to start with. The clock's
bar shows your place ("2nd of 4"), by how far round the long way each of you has got (`progressAt`), and
your shots; over the line, the card lists everyone's places and times, filled in as the rest come home.

**Shooting other racers (rules built 11 Nov; at sea, stage 3).** Her guns are for the other sloops as well as the gun gap.
At sea it's Q and E, as anywhere: a rival on the broadside's squares, before rock or land, is holed, sits low
and smoking with stars over her till she's patched. Rivals fire on you by their styles once you've sat on
one square a second and a half in the open (`RACE.STILL`): a flash on her, and the deck patch, as any hit
(knocked off the starlit door's board, if she was at it). At the gun she's loaded up to two, one a side
(`Broadside.stock`). Hits are shown on the sloops, never as wordy toasts.
Her guns fire a broadside, three squares out of her side (`SAIL.RANGE`, as everywhere at sea), stopped by
rock or land, so nobody shoots across a spit. A hit holes her: she's dazed, still, till she's patched by
Carpentry, but is never knocked out, and can't be hit again till she's patched. Every racer starts with two
shots loaded (`FIELD.SHOTS`) and holds four at most; more are loaded by Gunnery. "One of the advantages of
[gunnery] ... is that you can disrupt somebody trying to do the sailing Vegas ... by shooting them."
- **Settled by the simulation: shared shots** (`RACE.GAP.MODE`). The gun gap's guns are quietened by the
  same shots that hit racers, a hit a gun, so leaving other racers in peace pays: "a kind of peaceful
  racer bonus". With the guns needing more hits than a racer starts with, shooting them out was the worst
  way through the gap (12% against fair 25%), and the rest even (§8).
- **Roused, the gap's guns load slower in a race** (`RACE.GAP.AIMED_RELOAD`, 6 s against the checkpoint's
  4). In a race they fire on whoever comes near, not only on whoever roused them, and they were already
  "very relentless".

**First come, first served (rules built 11 Nov).** A lock is anyone's who gets there first: "If you got
through it first, we get through it first." The up lock, the down lock, the crane and the barrier's notch
are each one racer's at a time; the next waits her turn, in the order they came, and has it when it's free.
Waiting at the locks, she's in a berth beside the way in, a notch in the spit, sheltered (since the course's
second pass). (The bots give up after 20 s and go the long way.) There could be more
than one lock or crane spot, but not one for everybody.

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
- **What it found (11 Nov, §8):** it holds. Stopping in the open in the lead, she's hit three times in four
  in a field of four; last, one time in ten. Yet leaders who stopped still won about half their races, so
  the lead isn't doomed, and hanging back doesn't win (those who stopped last won 9%). Cautious racers (who
  stop in the open only with nobody close behind) win their fair share. Two things on the course as laid
  undid it on the first draft, both fixed on the second pass: the headwind gap's far end opened onto leg 3
  (now a dog-leg), and it was within the gun gap's guns' reach (now well out of it, as the starlit door is).
  On the second pass, stopping in the open in the lead she's hit three times in four, last one time in
  twenty; leaders who stopped there still won 38% of their races, those last 10%.

**The rivals: the den's own characters (built 11 Nov, stage 3).** "Everyone's got their own little profile
and way they approach it." Each is a profile in her own file in `src/lines/` (`RACER`: how she races, her
favourite route and style as the simulation names them, her skill, a line or two on the line and over the
finish), lined up in `src/den-rivals.ts` (`RIVALS`: their order, spots on the line, sails and flag, who's
aboard), and sailed by the simulation's own bots (`simDrive`, `src/race-sim.ts`) on the race's own field,
you racer 0 on it: the same logic that's balance-tested races you.
- **Kikkit** (red sails, black flag, spot 18 by the field's gap): greedy for the Vegas over the whirlpools,
  stopped at the channel's mouth in the open; an opportunist, firing on anyone she finds sitting still.
  Good, so great at her Vegas.
- **Tzz** (blue sails, spot 14): steady, hopping the Double's and the Triple's gaps on Doubles and Triples
  built on the move; peaceful, never fires. Decent, so good at her Doubles.
- **Dalnoth, with Umami aboard** (gold sails, spot 4): through the barrier of driftwood, Umami on her
  foredeck doing his foraging; aggressive, firing on anyone sitting still and loading more by Gunnery.
  Decent, so good at the Foraging. **Daquan has no look yet** (his portrait's still to check), so Dalnoth
  races in his place for now; Umami rides with him rather than racing a sloop of his own.
- One rival is Kikkit; two, Kikkit and Tzz. None takes the starlit door (it's never shown or hinted).
- Still to come: their puzzles played as real moves where the puzzles have bots (Sailing, rowing,
  Navigation), so they're the testers as well; today they take the simulation's drawn times. And Daquan.

## 7. The start: a field of whirlpools and winds (built 11 Nov)

"In the opening of a blockade, one of the challenges is, right, you've got a bunch of winds and whirlpools
and you have to really eyeball it to figure out what the fastest way forward is. And you can kind of ...
pick your starting spot along the starting edge based on that."
- **Picking your spot:** Space at the buoy takes you in to the starting line, a rope of floats across the
  course behind the rocks, your spot ringed in gold; A and D move you along it (never onto a rival's
  spot); Space and the count. Racers start from their spots at the gun.
- **The field:** six rows between the line and leg 1. A conveyor across its near side blows right, from
  the left edge to a gap, where it turns her down; a trade wind blows back left along its far side, right of
  the gap (cross it at the gap, ride it back there, or hop it with a Double); a headwind either side of the
  gap; plain whirlpools to go round, or zoom over with a gust (stop on one and it has her, by Puzzle Pirates'
  rules, `src/den-whirl.ts`).
- **The best line is the crowded one:** the gap the conveyor drops her at is the quickest way through (14.5
  s to the first bend), so the spots by it are; the far left is about 5 s slower, the far right about 8. In the
  simulation half the racers make for the gap, and racers starting beside each other jostle (a move given way
  each).
- **No single starting spot always wins** (tested): left of the gap 23%, at it 27%, right of it 21% in fields
  of four (fair 25%).

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

**A headless simulation (built 11 Nov).** "A test harness underneath this ... where you don't need to worry
about the graphical elements. So you can just run through simulations quickly and easily, and just really
test balance." `src/race-sim.ts`, run by `tools/race-sim.mjs` (2000 races of four in about 20 s), its
balance held by `tests/race-sim.test.ts`.
- **What it runs:** the race's field (§6) with no graphics, 2–4 bots over many seeded races, one seed one
  race. The course is read from `LAY.RACE`, so a reworked course is simulated as it's laid: each racer's
  progress is how far round the long way she's got, sailed at the helm's own pace (the long way 257 s,
  measured and tested), and each shortcut leaves and rejoins it where the course does, saving the long way
  between less her own trip through (tested to agree with `RACE.DECENT`). Since stage 3 (11 Nov) a bot comes
  down the start's field from her own spot (straight down, then along the first leg), and a shortcut's
  trip runs through its own water, as your rivals are drawn; the balance test held, unchanged.
- **The bots:** each is a route and a style. Routes: the long way; the gun gap run square by square, rushed
  on a heavy combo, or its guns shot quiet; the headwind gap rowed; the whirlpools' Vegas; the locks; the
  crane; the starlit door; or every shortcut it comes to. Styles: peaceful (never fires), opportunist (fires
  its two shots on anyone sitting still as it goes by), aggressive (and loads more by Gunnery), cautious
  (stops in the open only with nobody within 30 s behind). Skill decent, good or great, and a level better
  at its own route's puzzle: back yourself on your puzzles (§1).
- **The puzzles:** a time drawn round a decent player's, spread as people are; good takes three quarters
  of it, great a little over half. Measured where a bot or the den has a figure: Navigation at the door 53
  moves (`tools/nav-bots.mjs`), Bilge at a lock the pilot's own 28 s, running the gap one hit (the helm and
  its guns, measured). Assumed elsewhere: a Vegas 55 s and coming off 55/70/85% of goes, a heavy combo 30 s,
  rowing the gap 30 s, a Carpentry piece 4 s, a shot loaded by Gunnery 20 s, a broadside landing 60/75/90%
  of the time. Free on the move, everyone Sails on the pilot, its chains carrying her on (from
  `tools/sail-bots.mjs`: 0.06 to 0.12 squares a second by skill; assumed); a combo or Gunnery on the move
  takes that time instead and slows her to 85%.
- **What it reports:** win rates by route, by style, by skill, by place in the field when stopping in the
  open, and what each shortcut really saved.
- **How it's used:** the course's next pass is tuned with it, before it's played.

**Simulation results (11 Nov, on the first draft).** 3000 races of four, routes drawn at random (no two alike), fair 25%.

| Route | Course as laid | Next pass (`NEXT`) |
|---|---|---|
| The long way | 1% | 23% |
| Gun gap, run | 22% | 19% |
| Gun gap, combo | 32% | 33% |
| Gun gap, shot quiet | 30% | 31% |
| Headwind, rowed | 3% | 23% |
| Whirlpools' Vegas | 7% | 23% |
| Locks | 13% | 24% |
| Crane | 28% | 22% |
| Starlit door | 58% | 24% |
| Every shortcut | 55% | 29% |

- **As laid, every shortcut saves too much against the long way,** so the long way never wins, and the
  biggest savings win most. The locks and the crane save half as much again as a decent player takes on
  them (the user found them quick). The door's 149 s is worth twice its Navigation and Vegas. The
  headwind gap and the whirlpools win little: they're where a racer stopped in the open gets shot (the
  headwind gap from both legs and the gap's roused guns), and a Vegas doesn't always come off.
- **What each shortcut should save** (`NEXT` in `src/race-sim.ts`, for `RACE.DECENT` when the course is
  re-laid): the gun gap 10 s, the headwind gap 30, the whirlpools 46, the locks 24, the crane 37, the
  door 85; and the long way kept off the gap's guns' marks (the pilot's line from the buoy runs over gun 0's
  way-in mark today, so every racer who doesn't take the gap is holed there). With those, every route wins
  19–33%. Racing styles are even either way (peaceful 27%, opportunist 25%, aggressive 23%, cautious 25%),
  and skill tells: great 47%, good 25%, decent 4%.
- **Each shortcut on the next pass pays for a good or great player at it, and costs a decent one** (the
  locks: decent −5 s, great +3; the whirlpools: −29, −4): back yourself on your puzzles.
- **Two to three racers:** in fields of two every route wins 42–59% (fair 50%); in fields of three
  25–43% (fair 33%), the gap's combo and shot strongest, its run weakest.
- **The gun gap:** shooting its guns quiet with your starting shots (shared shots) evens it with rushing it
  on a combo (31% and 33%); needing more hits, shooting them out falls to 12%. Running it costs about a hit
  (as the user found) and is the weakest way past it, 19%: a combo of four squares on the move is cheap.
- **Sailing on the pilot carries the long way.** With nobody Sailing on the pilot, the long way falls to
  5%; it's what a racer who takes no shortcut is doing, and it has to work at sea in a race for the long
  way to be a real choice.
- **One starting shot instead of two** hurts the aggressive style (19%) and changes little else, so two it
  stays.

**Recommended for the course's next pass** (layout; done on the second pass, 11 Nov: see below):
- Shortcut savings as above, `RACE.DECENT` updated to them (`tests/den-race.test.ts` then holds the course
  to them, and the balance test races on the course as laid instead of `NEXT`).
- The long way clear of the gun gap's marks: gun 0's way-in mark off the first leg, or the gap set back in a
  notch.
- The headwind gap's far end not opening straight onto leg 3, and out of reach (3 squares) of the gun gap's
  guns: a dog-leg at its exit, or moved along its spit.
- The crane's ledge truly behind the neck, in a notch off the leg (today it's on leg 5's second row, where
  only the rule shelters her).
- The gap's heavy combo bigger (a combo of five or six squares, the gap longer), if its combo is to be no
  stronger than the rest; or its saving a little less.
- Waiting for a lock or the crane, a racer sits in the open by the way in: a sheltered berth to wait in
  would keep the leader's sheltered shortcuts sheltered.

**Second pass results (11 Nov).** The course re-laid to the recommendations above (its savings, the long
way off the gap's marks, the headwind gap's dog-leg out of the guns' reach, the crane's notch and the
locks' berth sheltered, the gap a Quad deep), with the start's field, the snakes, the small shortcuts and the
barrier added; `NEXT` gone, the balance test racing on the course as laid. 3000 races of four, fair 25%:

| Route | Wins | Route | Wins |
|---|---|---|---|
| The long way (hopping the zigzag) | 31% | Doubles (the Double's and Triple's gaps) | 28% |
| Gun gap, run | 15% | Whirlpools' Vegas | 34% |
| Gun gap, combo | 29% | Barrier (Foraging) | 20% |
| Gun gap, shot quiet | 24% | Locks | 27% |
| Headwind, rowed | 17% | Crane | 24% |
| Starlit door | 18% | Every shortcut | 34% |

- **Styles:** peaceful 25%, opportunist 27%, aggressive 24%, cautious 24%. **Skill:** great 47%, good 24%,
  decent 5%. **Starting spot:** left of the gap 23%, at it 27%, right 21%. Fields of two: every route 39–62%
  (fair 50%); of three, 22–42% (fair 33%).
- **Snakes:** about one racer in twelve slips into one a race. Those the left-hand trade wind or the trade
  wind up the middle had never won; the tight water's still won 14% of the time (it's near the start).
- **The leader's shortcuts:** each spit's safe one (sheltered or on the move) saved a good player 4–8 s on
  average.
- **What it took** (each an assumption, for the user to weigh): a heavy combo for the gap held and broken
  as she's lined up costs 32 s of puzzling on the move (at the gap's own 14 it won nearly half its races); a
  Double or Triple built on the move to break at its gap, 22 s and 28 s (at their own savings the doubles
  route won 85%); a Vegas 52 s; the long way's racers hop the zigzag as well as their skill lets them; the
  gap's light airs only in its middle square (light airs right through made running it a sure loss); and the
  tight water's slip half as likely running the gap a square at a time as rushing it.
- **Still weakest:** running the gun gap a square at a time (15%, half its fair share at worst): it costs a
  hit's patch for about the saving, as the user found. **Strongest:** the whirlpools, the long way and every
  shortcut at once (31–34%).
- `tools/race-measure.mjs` gives the course's numbers as the helm sails it; `tests/race-sim.test.ts` holds the
  balance (routes 0.5–1.6 of fair, styles 0.75–1.25, starting spots 0.6–1.4, the leader's safe shortcuts).

**For the user to decide:**
- Once the crane's built in a race, is it built for everyone (the next racer just rides it, as the den's
  crane stays built), or does each racer build her own? The simulation has each build her own. The same
  for the starlit door once it's open.
- The skill model: a racer a level better at her own route's puzzle. Without it, the shortcuts would
  have to save less again for the long way to keep up.
- How strong Sailing on the pilot should be in a race (it carries the long way).

**From players, later (idea).** A full competitive version would log each run: the route, the time on each
puzzle and each leg, and the finish. That gives win rates by route, "like in Age of Empires". The data is
for the user to balance by, not automatic balancing. "Balancing is going to be certainly, I think, for
players to actually test."

## 9. The secret: the starlit door (built)

A hidden gem, never hinted. There's no cheat, no `?at=` link, no shot, and the starter doesn't mention it.
- **The door:** faint marks on a cliff off leg 2. Stop by it and press Space, and Duty Navigation stands
  on the rock as the night sky. Each constellation filled lights its stars on the carved wheel. Two small
  ones open it, about a minute's play. A booch pushes her off and darkens the stars.
- **The tunnel:** it runs under leg 3 to leg 4. Only a Sailing Vegas from the mouth carries her
  through; anything less, and a draught carries her back to the mouth. It saves about 78 s of sailing (145
  on the first draft, when it ran on to leg 5: the second pass brings it up a leg sooner, to what the
  simulation said it should save).
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
- **Treasure Haul, and a bribe at the gate (12 Nov):** haul up treasure, then use it to bribe a guard at
  a gate to let you through. "I can imagine you having treasure haul, and one of the shortcuts is then
  bribe, yeah, you can then use the treasure that you hold up to bribe somebody at a gate to get through."
  So the course doesn't get too busy, it could be the gun gap itself made an imperial gate (the Empire's
  look, as at the checkpoint), with three ways through one gate: rush past on a big combo, shoot its
  destructible guns quiet, or pay the guard. "Maybe to keep it from being too overly busy in a course,
  but it could vary." A thought to weigh: the haul and the bribe can be apart, the chest hauled
  somewhere sheltered earlier (a wreck on a leg) and spent at the exposed gate in a moment, so it's a
  way for the leader to do her puzzling safely and still take the gate. On the course's size: "for a
  long [race], just do one big, I guess it can be one bigger fuller course" (one fuller course rather
  than a short one and a long one).
- **Shoot-away rocks** for Gunnery. Like the snakes, where they go decides how much they matter.
- Not every puzzle needs a place: "not that we necessarily need to worry about adding every single puzzle,
  we've got enough concepts here."

## 12. Open questions

- Shared shots or more hits for the obstacles (§6)? Settled by the simulation: shared (§6, §8).
- Can the lead hold? How strong the "lead isn't safe" effect should be (§6). The simulation says it holds
  as it is (§6, "What it found").
- Is a built crane built for everyone that race (§8, "For the user to decide")? The same for the barrier
  of driftwood once one racer's cleared it. **Default for now (stage 3, 11 Nov, the user to decide):** each
  racer builds her own crane, clears her own barrier and opens her own door, as the simulation has it; so a
  rival's sloop sails through your barrier's logs or swings over the neck with no crane of yours up.
- How good a rival is at her own route's puzzle. **Default for now:** a level better than at the rest
  (`bestAt`), as the simulation's bots are.
- The mandatory Double over the trade wind back up the course: every racer has to hop it, so the long way
  isn't quite "without doing anything" (a Double, a few seconds' timing). Keep it, or give it a way round?
- The snakes' slips in the simulation are guesses (`SIM.SNAKE`); players will show how often they bite.
- More than one lock or crane spot for 2–4 racers, and how the course's size changes with more racers.
- How the starlit door's door and tunnel work with several racers: once one racer opens it, is it open for
  everyone that race?
- Where the race goes in the den's story, and what winning brings.

## 13. Where it lives

- **The race's rules:** `src/den-race.ts` (the line and your spot, the clock, the snakes, the buoys, the
  finish line, the barrier). Its course is `LAY.RACE` in `src/den-sail.ts`, measured by
  `tools/race-measure.mjs`. Its field of racers (several on one course, first come first served, shooting
  each other): `src/den-racers.ts`. Your rivals: `src/den-rivals.ts`, each one's racing in her file in
  `src/lines/` (`RACER`), sailed by `simDrive` in `src/race-sim.ts`.
- **The simulation:** `src/race-sim.ts`, run by `tools/race-sim.mjs` (§8).
- **A chart of the course (12 Nov):** `tools/race-map.mjs <out.html> [races] [size]` (Node 22:
  `node_modules/node/bin/node.exe`) writes one page in the captain's map's look, drawn from `LAY.RACE` and the
  simulation: the long way and its buoys, every shortcut with its puzzle, saving and its route's wins, the
  snakes and winds, the sheltered and exposed spots, the gun gap's reach, the start's spots, and a table of
  wins by route, style, skill and spot (2000 races, about a minute). The user: "a map of the course ... shows
  where all the shortcuts and things are, and all the wins". It shows the starlit door, so it's private:
  write it outside the site (a temp folder), never into it.
- **Drawn and played by:** `js/den/race.js`; its start (the line, your spot, the starter's card)
  `js/den/race-start.js`; its buoys and finish line `js/den/race-marks.js`; its barrier of driftwood and
  its Foraging `js/den/race-forage.js`; your rivals' sloops, their broadsides and yours
  `js/den/race-field.js`.
- **The starter's lines:** `src/lines/race.ts`.
- **The starlit door:** `src/den-door.ts` and `js/den/door.js`.
- **Tests:** `tests/den-race.test.ts`, `tests/den-door.test.ts`, `tests/den-racers.test.ts`,
  `tests/den-rivals.test.ts` (the rivals racing you, shooting, places) and `tests/race-sim.test.ts` (the
  balance test).
- **Try it:** `den.html?at=race`.
