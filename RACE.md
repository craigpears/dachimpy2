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

**Small combos pay on the long way too (idea, the user theorising, 11 Nov).** "When I've said, you know, you
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
- **For the course's redesign** (it will change anyway): the Double's gust length decides how long each
  headwind is and how far apart they sit.

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

**Several racers (rules built 11 Nov; not drawn yet).** Two to four on the course, you and bots to start
with: "start adding multiple players to this first, even if it's like 2 to 4 players with some bots, and
obviously tweak the course and sizes according to that." The field (`src/den-racers.ts`) holds each
racer's pose, the stretch she's reached in order, what she's doing (sailing, waiting her turn, puzzling,
dazed, carried by a gust, the crane or the tunnel, finished), and her time and place. The den's race is
already a field of two: you, and the rival as a bot racer. Drawing more sloops and their bots at sea is the
next agent's.

**Shooting other racers (rules built 11 Nov).** Her guns are for the other sloops as well as the gun gap.
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
through it first, we get through it first." The up lock, the down lock and the crane are each one racer's
at a time; the next waits her turn, in the order they came, and has it when it's free. Waiting, she's
beside the way in, out in the open. (The bots give up after 20 s and go the long way.) There could be more
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
  undo it: the headwind gap's far end opens onto leg 3, so a rower can be shot from the leg ahead as well;
  and it's within the gun gap's guns' reach, so once they're roused they fire on her too.

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

**A headless simulation (built 11 Nov).** "A test harness underneath this ... where you don't need to worry
about the graphical elements. So you can just run through simulations quickly and easily, and just really
test balance." `src/race-sim.ts`, run by `tools/race-sim.mjs` (2000 races of four in about 20 s), its
balance held by `tests/race-sim.test.ts`.
- **What it runs:** the race's field (§6) with no graphics, 2–4 bots over many seeded races, one seed one
  race. The course is read from `LAY.RACE`, so a reworked course is simulated as it's laid: each racer's
  progress is how far round the long way she's got, sailed at the helm's own pace (the long way 257 s,
  measured and tested), and each shortcut leaves and rejoins it where the course does, saving the long way
  between less her own trip through (tested to agree with `RACE.DECENT`).
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

**Simulation results (11 Nov).** 3000 races of four, routes drawn at random (no two alike), fair 25%.

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

**Recommended for the course's next pass** (layout, for the agent laying it out):
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

- Shared shots or more hits for the obstacles (§6)? Settled by the simulation: shared (§6, §8).
- Can the lead hold? How strong the "lead isn't safe" effect should be (§6). The simulation says it holds
  as it is (§6, "What it found").
- Is a built crane built for everyone that race (§8, "For the user to decide")?
- More than one lock or crane spot for 2–4 racers, and how the course's size changes with more racers.
- How the starlit door's door and tunnel work with several racers: once one racer opens it, is it open for
  everyone that race?
- Where the race goes in the den's story, and what winning brings.

## 13. Where it lives

- **The race's rules:** `src/den-race.ts`. Its course is `LAY.RACE` in `src/den-sail.ts`. Its field of
  racers (several on one course, first come first served, shooting each other): `src/den-racers.ts`.
- **The simulation:** `src/race-sim.ts`, run by `tools/race-sim.mjs` (§8).
- **Drawn and played by:** `js/den/race.js`.
- **The starter's lines:** `src/lines/race.ts`.
- **The starlit door:** `src/den-door.ts` and `js/den/door.js`.
- **Tests:** `tests/den-race.test.ts`, `tests/den-door.test.ts`, `tests/den-racers.test.ts` and
  `tests/race-sim.test.ts` (the balance test).
- **Try it:** `den.html?at=race`.
