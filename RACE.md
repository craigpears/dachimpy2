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
- **One connected race, never puzzling apart (12 Nov).** A side shortcut stays tied to the main path, so
  failing in it drops you back into the race rather than out of it: "I just don't like the idea. It's not
  really a race. A connected race if you are completely separate and puzzling against each other. Like,
  there needs to be some chance you can be pulled back in." See §9 for the door's tunnel, the first place
  this applies.
- **Fun to watch.** "It would be so fantastic to watch. You could see everybody puzzling and racing."
- **Never rage-inducing (12 Nov, "almost like a constant principle here").** Watching a whirlpool fling a
  rival (the turning pool, which "just looked like a normal whirlpool to me"): "the gamble or the risk should be
  the whirlpool went a bit squiffy, sent you the wrong way ... even if it is a bit cute and funny, it should not be
  drastic and rage-inducing." Every snake 3 or 4 squares back at most, like the tight water past the gun gap
  (§4); any risk a mild wrong way, never a race lost to luck.

## 2. The course (built: its third pass, 12 Nov, "the race's next pass")

- **Where it is:** its own stretch of sea out past Primates Rule, behind a line of rocks with one gate in
  it. It's laid out on the den's own sea from data (`src/race-course.ts`, `DEFAULT_COURSE`; `layRace` in
  `src/den-sail.ts`: a column for each shortcut), so it can be reworked freely: "We're going to have to go
  through several iterations of this course." `tools/race-measure.mjs` measures it with the helm (the long
  way, each spot's way through the start, each shortcut's saving), and the tests hold the course to those
  numbers (and to a snapshot of every square, `tests/fixtures/race-course-third-pass.json`).
- **The start (§7):** Space by the buoy off the gate takes you in to the starting line behind the rocks;
  you pick your spot along it; the starter's card explains the race (§5); Space, and he counts you down.
  Below the line, a field of slow winds and whirlpools fresh each race, and its hop.
- **The legs:** five legs, two squares deep, back and forth, a spit of land between each pair, the long way
  round each spit's end by its numbered buoy (§5). The course's own breeze blows out across it, so every leg
  is a reach and every bend a run. Leg 4 before the locks is the zigzag (§3).
- **Home:** the run home is one square wide, the left-hand trade wind's loops beside it (§4), to a finish line
  across it between two towers (§5). Past the line, Space takes you back out to the starting buoy.
- **Times:** the long way takes about 3:44 (223.5 s), from the long way's own spot on the line. Your rivals
  (§6) are home in about 3:13 (Kikkit, her Vegas chancy: 3:00 to 3:45), 3:24 (Tzz) and 3:36 (Dalnoth), so
  you beat them on the shortcuts you're good at. Your best time's kept in this browser.

## 3. Shortcuts (the ladders)

**Two kinds of shortcut.** On the move, you keep sailing while you puzzle: Sailing on the pilot, Gunnery
while you sail. Stopped dead, she sits still while you play, which is slower for the same puzzle time.

**Sheltered or exposed.** A stopped-dead shortcut can be sheltered: in a lock's chamber between its walls,
or on the crane's ledge behind the neck of land, out of a passing broadside's reach. These are safe to play
even in the lead. Others are out in the open: the whirlpool channel's mouth and the starlit door's rock and
mouth. Sitting there, you're a sitting duck for anyone coming up behind (§6).

| Shortcut | Puzzle | Kind | Saves (s) | State |
|---|---|---|---|---|
| Spit 1, the gun gap (column 19): an imperial gate, three squares deep, a gun either side of its mouth, its marks all in the spit | A Quad from the leg rushes her past (a big Sailing chain, or a Vegas rowed each side); or shoot its guns quiet; or pay its guard; a square at a time she's holed | On the move | 22 | Built (moved two columns in, 12 Nov) |
| Leg 1, an old wreck in a notch (column 14), for the gate's bribe (§3, below) | Treasure Haul: 40 coins hauled up (about 19 s, 4 s a move: 12 Nov), paid at the gate in a moment, and she's towed through | Stopped dead, sheltered (the haul); a moment at the gate | 22, the gap's | Built 12 Nov |
| Spit 2, the headwind gap, a dog-leg at its far end | Rowing (mirror strokes); idle in it and the wind blows her back out | Rowing, slowly | 25 | Built (its cliffs low and its wind drawn, 12 Nov) |
| Spit 2, a small gap, one wind blowing back across it | A Double, built on the move and broken in its mouth (it lines her up: 12 Nov) | On the move | 9 | Built |
| The start's hop (§7) | A Double over its headwinds into its lane, down onto leg 1 toward buoy 1 | On the move | 10 | Built 12 Nov |
| Spit 3, the whirlpool channel | Only a Sailing Vegas from its mouth carries her over; less sends her back to the mouth | Stopped at the mouth, exposed | 48 | Built |
| Spit 3, the rocks across a gap (column 17), blasted open for everyone (§4) | Her broadsides, three hits, anyone's; more shots loaded by Gunnery | On the move (a stop in the open to load, if short) | 25 | Built 12 Nov |
| Spit 3, a barrier of driftwood across a gap (column 19) | Foraging clears it, from the notch in front of it | Stopped dead, sheltered | 16 | Built (moved, 12 Nov) |
| Spit 4, the locks: a lock up and a lock down | Bilge, pumping the up lock (6 clears since 12 Nov); a sheltered berth to wait your turn in | Stopped dead, sheltered | 23 | Built |
| Leg 4, the zigzag (on the long way) | Hop its headwinds with well-timed Doubles; weaving through is the no-puzzle way | On the move | 8 | Built |
| Spit 5, the crane in a notch (column 16) | Carpentry, building the crane a part at a time (its small frames since 12 Nov), which hauls her over | Stopped dead, sheltered | 23 | Built |
| Spit 5, a gap with two winds blowing back across it (column 21) | A Triple | On the move | 14 | Built |
| The starlit door: a tunnel from leg 2, one stretch under the spit, up a cleft onto leg 3 (§9) | Duty Navigation on the rock (one constellation of three stars, 12 Nov), and that alone carries her through | Stopped dead at the rock, exposed | 40 | Built (back to simple, 12 Nov) |
| A Rigging passage of shifting, gusty winds | Rigging, its six pulleys as her rigging lines (§11) | On the move | ? | Idea |

**Shortcuts in proportion (built 12 Nov, the race's next pass).** Every stopped puzzle's shortcut (the gate's
bribe or guns, the barrier, the locks, the crane, the rowing gap, the rocks) skips about the same stretch,
about 22 seconds, and each puzzle is sized to take about the same time to play (the locks' Bilge 6 clears, the
crane's small frames, the bribe's haul about 19 s, rowing 20 s), so the only choice is which puzzle is yours;
a decent player about breaks even on one, a good or great one gains. The chain hops grow with their chain: a
Double 9 s, a Triple 14, a Vegas 48. The barrier saves 16 (spit 3 has no more room beside the rocks and the
trade wind back's loop) and the starlit door 40 (one stretch; its Navigation sized to it). §8 has the numbers.

**Played (12 Nov).** The gun gap near the start, its imperial guns shot quiet by Gunnery, "felt a lot more
balanced. It was really quick ... You could tell, you know, the trade-off there was a lot better": keep it
as the model of a shortcut whose trade-off reads at once. The wind gaps were "a bit awkward to set the ship
up to get through", and the locks' animation "frustrated and slowed down" (it was the canal, not building: "I was spending just as much time waiting for the ship to go forward"). Both fixed the same day:
- **The wind gaps line her up (decided 12 Nov).** Of the ways offered (a wider mouth, a lane funnelling her
  to the right square, a mark where to wait, the gust lining her up), the gust: a gust big enough for the
  hop, broken anywhere in the gap's mouth (either row of the leg, a column either side; a zigzag headwind
  from right behind it or a square back), swings her onto the square in front of it, facing through, and
  carries her over (`LAY.RACE.LINEUPS`, `lineUp` in `src/den-sailing.ts`). So it's the Double or Triple
  built in time that counts, not stopping on one square facing the right way. Nothing marked (shortcuts
  never are); no course re-laid. Only a gust that carries her clean over is lined up: a Quad in the
  Triple's mouth would land her in the left-hand trade wind beyond, so it's a plain gust along the leg.
  The Double's gap, broken as she sails by, saves 9 s now (8 before, when she had to stop in its mouth).
- **The locks a beat (decided 12 Nov).** Every lock's water and gates quicker (draining or filling 0.8 s,
  gates 0.4 s, a pumped lift's last there in a moment), and the race's two made ready each race (the up lock
  drained, the down lock full), so only Bilge and one drain stand between her and leg 5: through in 4.3 s
  sailed (it was 10). That made the locks save 31 s and win 41% (over the band), so they moved two squares
  toward the bend (`LOCK_C` 13 to 11): 23 s saved, 24% won (§8, "The playtest's fixes").
Carpentry and Duty Navigation weren't come across on that go: the crane sits in a notch off leg 5, easy to
sail past; the door was a secret by design then (public since 12 Nov, §9).

The savings column is `RACE.DECENT` and the door's `DOOR.EXITS` (and the simulation's `SIM.ZIGZAG`), as measured by the
helm and tested. Each is about what the simulation recommended (§8): a shortcut pays only for a player good
at its puzzle.

**Every stretch has a shortcut a leader can play safely (built 11 Nov).** Sheltered or on the move: the gun
gap's combo or its bribe, hauled in the wreck's sheltered notch (spit 1), the Double's gap (spit 2), the barrier of driftwood (spit 3), the locks and the zigzag
(spit 4, leg 4), the crane and the Triple's gap (spit 5). The simulation checks each saves a good player time.

**The barrier a square along (12 Nov).** At the chart: "how do you get to it? Like, you have to spin on the
spot after jumping over the, that snake trade wind thing. It just feels like it's one square off." It was in
column 20, right beside the trade wind back up the course (column 19): hop the wind on a Double along leg 3 and
she landed on its column facing along the leg, and had to turn on the spot to face the notch. Moved a column east
(21, `DEFAULT_COURSE.forage`), the Double lands her a square short and one turn to port takes her up into the
notch. The helm: it saves 12 s now (15 before; `RACE.DECENT.forage`), and the long way's 220.6 s (221.7: the
notch's breeze along leg 3 a column on). Foraging's own time stays 15 s (`SIM.PUZZLE.forage`), so it pays a
little less: 2000 races of four, the barrier won 23.0% (fair 25%, it was 24%), the rest in their band (§8).

**The barrier of driftwood (built 11 Nov).** "it's not even macheting. You just have to clear the barrier."
A jam of logs across a gap in spit 3; in the notch in front of it, Space stands a board of Foraging on the
jam (`src/foraging.ts`, played as Umami's), dealt with two bundles of driftwood and nothing more to come;
cleared down off the bottom, the jam breaks up and floats off. **Sheltered**, decided: the notch is tucked
into the spit between the gap's banks, so no broadside reaches her, and with the whirlpools beside it in the
open, it's the leader's shortcut on that stretch. Umami's way round, when he races (§6). Once cleared it's
open the rest of the race (the simulation has each racer clear her own, as with the crane: §8, "For the user
to decide").

**The gun gap as an imperial gate, and its bribe (built 12 Nov).** The user (12 Nov): "I can imagine you
having treasure haul, and one of the shortcuts is then bribe, yeah, you can then use the treasure that you
hold up to bribe somebody at a gate to get through", "maybe to keep it from being too overly busy in a
course", and, agreeing it: "build the bribe gate ... I just want all the ideas in there ... to show how many
different ways you have of really getting through the course." So the gun gap is three ways through one gate,
not a new gap:
- **The gate:** the Empire's look on it, as at the checkpoint: a gatehouse of pale stone over its way in,
  crimson banners and the Empire's flag, its two guns on the Empire's bastions, and a guard on a step at the
  foot of its left tower. He halts you ("Halt! Imperial gate. The guns are trained on the gap, pirate."),
  grumbles now and then, names his price, and hints at the wreck ("Heard there's an old wreck back along the
  leg. Not that I'd know."). Its old ways through are as they were: rush it on a combo, shoot its guns quiet,
  or run it and be holed.
- **The treasure:** an old wreck run aground at the back of a notch in spit 1, off leg 1, five squares before
  the gate (out of its guns' reach). Lie in the notch and Space lays Treasure Haul's own board on the water
  behind her: no chest, just the guard's price in coins to bring up. **Sheltered**, as the barrier's and the
  crane's notches are, so it's a leader's way to puzzle safely and spend it at the exposed gate in a moment
  (the thought the user weighed). One racer at a time in the notch; each racer hauls her own; a new race,
  the coins are back.
- **The price: 40 coins.** A chest takes twenty moves and more to raise, worth far more than the gap's 14 s,
  so it's coins: about five moves of Treasure Haul for a player who plays any line he sees (a bot measured
  4.7 on average), about 7 s for a decent player (1.5 s a move, assumed), quicker with the board's gems and
  chains. Set by the simulation (§8): at 30 coins the bribe won 29% of its races, at 40, 27%.
- **Paying:** by the gate (in front of its way in, or a square either side, on leg 1), stopped, Space hands
  him the coins: "Pleasure doing business. Hold your fire, lads!" His guns hold their fire on her for the
  rest of the race, and his men warp her through on the gate's line: a tow, as a gust carries her, through the
  gap's three squares and out onto leg 2, out of anyone's reach while it lasts. Short of his price: "That's
  short. The price is 40: go and haul up the rest." **Why the tow:** with the guns quiet but ghosting through
  the gatehouse's light airs as slowly as running it (7 s against a combo's 2), the bribe won 9% of its
  races at 50 coins and 13% at 30: never worth its haul, whatever the price. Paid and towed, it sits with the
  combo.
- **Not marked:** the gate's plain to see and the guard names his price and hints at the wreck; since 12 Nov the
  starter's card names it among the ways through ("haul up some treasure and pay off the guard at the gate"). No rival takes it (their routes are as they were).

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
gap, the crane's footing. The starter names a few as examples, and since 12 Nov the starlit door (§9): nothing's secret now.

**The combo is what gets you through, not the puzzle.** At sea a heavy combo is what rushes her past
guns, whirlpools and winds, whether sailed or rowed: "it's the combo, heavy combo that gets you through, not
anything specific to either one." A square at a time past guns is a sitting duck; rowing past them doesn't
help.

## 4. Snakes (built 11 Nov; gentle since 12 Nov) and the rocks (built 12 Nov)

Snakes are winds that carry her back. **Gentle (12 Nov):** "that's really too brutal. That sends you back
almost 2 legs worth. Like, it's supposed to be a small, funny thing ... maybe it catches you, sends you back a
small distance ... it should send you back by a few tiles and basically make you repeat the thing ... where
you've got to do the double hop, if you accidentally do one combo, it sends you in a loop. Similar to where the
Vegas [wells] are, where it sends you back to the start of that stage. So it costs you a tiny bit ... I don't
want it to be rage-inducing." And the measure of it, of the tight water past the gate: "I like the [tight]
water feature that just sends you back 3 or 4 squares ... that's the kind of snakes and ladders level that's
a good tune, so it's not quite as rage-inducing, but it is kind of like, ah, damn it, not again." So every
snake carries her three or four squares back, to the start of what she was doing, and none further (tested:
`tests/den-race.test.ts`, "snakes a little setback, never a lost race"). Never rage-inducing (§1). The starter
calls out each one.
- **The trade wind back across leg 3** (column 23): across both rows of the leg, up into a notch in spit 2's
  far face, back along it three columns and down onto the leg again: a loop, three squares back. Every racer
  on the long way hops it with a Double ("you have to get a double in sailing and basically jump over the trade
  winds"), lined up from right behind it or a square further back, either row. Played (12 Nov), its earlier
  form near the driftwood landed: "I love that, near the driftwood, how you have to do a combo over it,
  otherwise it takes you back. Perfect." It was a leg and a half back up through spit 2 till the next pass.
- **The left-hand trade wind:** beside each left-hand bend (spits 2 and 4), up the left-hand edge past the
  spit's end and back out onto the leg she was finishing; along the run home's second row, a few squares
  blowing back the way she came and one blowing her up onto the run home again. It used to run up the whole
  left side to the start, the course's biggest sting; beside spits 1, 3 and 5 the edge is land now.
- **The tight water just past the gun gap:** three squares of wind along leg 2's second row under the gap;
  a move too far out of it and she's three back toward the bend. A Quad from the leg lands her clear.
- In the simulation (§8), a racer a snake had still wins now and then (about 4 to 15% of them, by which).

**No gambles (decided and built 12 Nov):** "it just seems no cost to taking that gamble right at the start ...
are we going to ... create a situation whereby the only way to win is to take that gamble, and if you don't,
you rage quit? ... It does not feel like a very game-worthy thing ... not really in the ... good
sportsman-like spirit", and of the veiled wind, "far too near to the finish for a gamble. That will make people
very cranky." Then "Yes, drop both." The veiled wind (a coin toss through spit 5) and the turning pool (a
whirlpool on leg 2 whose spin flipped on a beat) are gone, their code, lines, chart marks and simulation with
them; the turning pool's spit is plain land. Watching it fling a rival, the user: it "just looked like a
normal whirlpool to me ... even if it is a bit cute and funny, it should not be drastic and rage-inducing", and
a rival "went left into it and then ... came out as it was like into the right turn ... That is not how a
whirlpool works": so every whirlpool on the course turns clockwise, by Puzzle Pirates' rules (tested), and
anything that behaves differently must look different too.

**The rocks blasted open for everyone: a catch-up shortcut (built 12 Nov).** "where you've got the Vegas
whirlpool ... What would actually be cool is if you had like a destructible obstacle there ... somebody could
start shooting it if they're first, but then ... once it's been destroyed, that opens it up ... for everybody,
not just them ... it's a way for the loser to catch up ... Maybe you could do it with like 3 gunshots or
something." As built: a wall of grey boulders across the mouth of a gap in spit 3 (column 17), along leg 3 from
the whirlpool channel (the Vegas keeps its own way over). Shot on the move with her broadsides (her port side,
sailing along leg 3), three hits, anyone's, counted by the race's field (`Field.rocks`); a course of boulders
knocked off each hit; at three the wall falls, rubble heaped against the gap's banks, and it's open water to
every racer for the rest of the race (25 s saved; online, the room keeps the count in its snapshot). Shots are
her budget (two at the gun, four at most, loaded by Gunnery), so blasting costs what she'd fire at rivals. Placed
along from the channel rather than beside it so its saving is in proportion with the other shortcuts (beside
the channel it would have saved about 45 s). In the simulation the rocks' route loads its shots on the move from
the gun and fires them as it comes by, stopping in the open to load more if they're not down; any racer who
comes to them down goes through, free. They come down in about a quarter of races of four; those through them
free win about 31%. The user's doubt, "it's possibly something that drags back ... the leader ... That's a weird
position", stays open (§12): it's shot on the move, so it needn't stop anyone, and a softer version could let
the rubble settle back after half a minute.

## 5. Knowing where you're going (built 11 Nov)

- **Clear buoys round the long way:** a tall red and white buoy at each bend, its number on a board above it,
  on the outside of the turn; the one you're sailing for lit, its lamp on and its number gold. The clock's
  bar says "Leg 2 of 5 · to buoy 2", or "the run home · to the finish line". The gate's flags and the finish
  flag, which "don't look like they're in the actual proper direction at all", are gone. Shortcuts are never
  marked.
- **The race explained at the start:** on the line, the starter's card: the long way round the buoys, no
  puzzle; shortcuts through the spits that cost a puzzle, a few named (bilge up through a lock, build a
  crane, row the headwind gap, zoom over the whirlpools on a Vegas, hop a headwind with a Double, and since
  12 Nov haul up some treasure and pay off the guard at the gate, and blast the rocks off leg three, three hits
  and they're open for everyone); the field below the line ("slow winds that nudge ye a square, whirlpools that
  turn ye round, fresh every race. Eyeball a way through, or hop the headwinds with a Double for a ride"); the
  winds that sweep you back a few squares; and that the others shoot you if you sit still in the open. Since 12
  Nov, the starlit door in a line of its own: "a starry door in the cliff off leg two, opened by Navigation, and
  a tunnel under the course up onto leg three" (§9; `src/lines/race.ts`, `STARTER.explain`). No gambles.
- **A ceremonious finish:** a line across the run home between two striped towers, gold balls on top, a
  chequered banner strung between them over the water and a chequered line on it. Crossing it, a burst of
  colour, and a card: "Over the line", her time, and her place.

- **Studying the course: a tactical view (idea, 12 Nov, to agree):** "having some kind of a map of the
  course ... maybe you get a moment before the race to study the course ... I think originally I liked the
  mystery, but maybe making it a bit less mysterious ... like in ... Total War, where you kind of go out to
  the tactical view ... a minimap ... seems fairly useless in this context. It would need too much detail."
  Proposed: no minimap; instead the camera pulls up high over the real course, the whole of it in view.
  On the line, before the count, as long as you like (the starter's card could become a fly-over of the
  legs). In the race, a key to zoom out and back, the sloop sailing on meanwhile, so a look costs you
  seconds and a leader can't study at leisure. Buoys numbered, the racers' sloops with their names, the
  lit buoy. Whether it marks the shortcuts and their puzzles reverses "shortcuts are never marked" above,
  so that's the user's call. Never the starlit door. Shares its drawing with the course editor's 2D view.

- **Planning your route, then puzzling it through (agreed 12 Nov, to build):** "if we are supposed to be
  puzzling as you're going through as a person, some way of like pre-planning your route through the
  course ... there's no way you're going to get through this ... you should be able to, like, say, yeah, go at
  least halfway around the board and then be sailing to help speed it up or carping once you get to the
  whatever ... there needs to be some kind of a planning phase where everybody plans what route they're
  taking and then the puzzling's kind of the executing phase." Today you have to steer and puzzle at once,
  and nobody can do both. The shape it suggests:
  - **Plan:** before the start, everyone at once, on the course seen from above (the tactical view above),
    lays down her route: the long way or a shortcut on each leg, as a line of waypoints, as far ahead as she
    likes ("at least halfway around").
  - **Execute:** the pilot sails the plan move by move (forward, left, right, the same moves as your own
    helm), and your hands are on the boards: Sailing on the way, each clear's gust a jump along the plan,
    and the shortcut's puzzle when she reaches it (Carpentry at the crane, Bilge at the locks).
  - **The user's answers (12 Nov):** the plan is hidden from the others ("definitely"); it can be changed in
    the race, but changing it mustn't cost puzzling time ("then that just creates that kind of
    frustration"). Planning every pause by hand would be tedious ("I ought to get to here and then pause"):
    "Maybe the ship auto stops when you hit those kind of obvious points or obstacles ... Maybe just put
    waypoints in. Certainly for ... the zigzagging bit ... See if you can figure something out." Shooting
    each other may get trickier or likelier with it; open.
  - **Agreed (12 Nov):** "I like that plan idea ... you plan by choosing those options, that works. That's really simple and easy." To build:
    - **A plan is choices, not a drawn line:** at each of the course's forks (each leg: the long way, or one
      of its shortcuts) you pick one. The pilot already knows the water, so it finds the way to each, move by
      move. Waypoints are an extra, only for a racer who wants a particular line.
    - **The obstacles make the stops, never the plan:** each shortcut or hop has a spot she stops at (the
      trade wind's hop, each of the zigzag's headwinds, a lock, the crane's notch, the barrier, the
      whirlpools' mouth, the door's rock). The pilot sails up to it, lines her up, holds her there and puts up
      the board it asks for. When it's done (the Double thrown, the lock pumped) she goes on by herself. A
      Double or Triple built on the way and held is used without stopping. So the zigzag needs no planning:
      it's a few hop spots in a row, a stop at each.
    - **Changing the plan without leaving the board:** a strip along the screen's edge shows the legs still to
      come and your choice on each. One click on a leg changes it, and the board stays live under your hands.
      The view from above is there for a look, never needed to change anything.
    - **Planning at the start is optional:** the plan starts as the long way everywhere, and you change it
      on the line during the count and in the race. So there's no planning phase of its own.
    - **Shooting:** with a plan hidden, a rival can't tell where you'll stop, but every stop is at a known
      spot, so the spots are where you'd lie in wait. For the simulation to settle (§8), with the guns
      firing when one's loaded and a rival's in range.

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
- Their puzzling is the simulation's drawn times; watched (§10, since 12 Nov) each one's board is shown
  played by its bot in those times. Still to come: the bots' own play deciding the times, so they're the
  testers as well. And Daquan.

**Racing your friends online (built 12 Nov, a first proof of concept for playtests).** Up to six players in
one race's room, bots (the den's own racers, `WATCHED`) filling the field up to however many racers it's set
to (four by default, six at most). As built:
- **A modular monolith** (the user, 12 Nov: the server kept apart from the client, to move to a proper server
  later). All of the room's logic is pure, tested TypeScript with no Cloudflare, WebSocket or DOM in it, the
  clock and the dice handed in: `src/race-server.ts` (`RaceServer`: `join`, `leave`, `message`, `tick(now)`,
  each answering what to send to whom; `Referee`, the race's rules as the room keeps them). The Durable
  Object, `worker/race-room.js` (`RaceRoom`, `/api/race/CODE`, its own migration `v2`), is only a thin
  adapter: sockets, sleeping between races, a timer only while a race is counting down or on. What's said both
  ways is `src/race-net.ts`. The browser talks to a `Link` (`send`, `onMessage`, `close`), never a socket:
  `src/race-link.ts` has two, `wsLink` to the room and `LocalRoom`, the server run in the same tab (the tests'
  pretend browsers; one day the race alone). The browser's end is `js/den/race-net.js`, hooked into race.js's
  keys, prompt and tick, race-field.js (`fieldCast`: whose sloops are on the water) and the Race's `roster`
  and `drive` (src/den-race.ts): single-player races are as they were.
- **The room runs the race**: the lobby (who's in, spots on the line, ready, racers in all; anyone starts the
  count once everyone's ready), the count and the clock, whose turn it is at a lock, the crane, the barrier's
  notch or the wreck's (from where each player is: on its square she has it or waits her turn, the locks'
  berth counting as waiting for the up lock; her browser shuts it to her while it's someone else's and puts her
  in the berth or in front of it), hits (the shooter claims, the room checks it can be hit and is within a
  broadside's reach; the bots' broadsides at players too), places and finish times, the race's seed (the bots'
  sailing, the start's field from it, the next race's shown in the lobby; and the rocks' hits, everyone's), and the bots, sailed by the simulation (`sail`, now with
  `humans`, any number of players at the front of the field).
- **Healing itself** (the user, 12 Nov, on a missed message: "before you know it, you're on top of a rock"):
  the room sends the whole race eight times a second (a numbered snapshot, its run's id so a restarted room's
  numbers start again), never a change or a one-off event that must arrive: a hit is a count of hits taken (a
  missed broadside is taken all the same), a turn is who holds the spot, a finish a time and a place. Your
  own sloop is sailed in your browser against your own sea; everyone else's is drawn only from snapshots, a
  quarter second behind the newest and between two, never sailed on by itself. Drawn on her moves (12 Nov:
  the bots online glided too, "it wasn't just in the watching"): each snapshot says the move each racer's on
  (`mv`: from which square to which, forward, a turn or a square of wind, how far along and how long it takes;
  a bot's as the room sails her, a player's as her browser said it with her pose, brought on at its own pace to
  the snapshot's moment), and between two snapshots she's drawn along that move, or the rest of it and on into
  the next, a turn on its quarter circle (`mvBetween`); only further apart than a move (a jump, missed
  snapshots) is she put straight there as before. Only for drawing: nothing the race's rules or its record
  go by, so replays are as exact as they were. Heard nothing for two seconds
  (the room goes quiet in its lobby), a browser asks for the race again. Tested with a browser that
  drops two snapshots in five all race long.
- **Dropping out:** a closed tab has six seconds to come back (`NET.GRACE`), then a bot of the long way sails
  her sloop home; sailing back out of the gate does the same at once. Everyone gone, the race is off.
- **Whole steps** (the user, 12 Nov: "everybody should always be on the same turn"). During a race the helm
  and the race's field run in fixed steps of a sixtieth of a second (`NET.STEP`), in the room and in every
  browser, the frame's time added up and the rest carried over (`raceHelm`, race.js; at sixty frames a second
  it's a step a frame, so the feel's unchanged); outside a race the helm ticks as ever.
- **Every race written down, to watch again** (the user: "people can see games that have been played"; and
  "you just need moves ... really all you need is to save somebody's actions"): a `RaceRecord`
  (`src/race-server.ts`, versioned): the seed and the racers (names, looks, sails, spots); each player's
  actions at the helm stamped with her steps sailed (moves, pins, moorings, gusts, oars, strokes, hits, locks
  pumped, broadsides, patched, the barrier cleared, a spot shut or opened, the breeze); what each player said
  that changed the race, at the room's step it heard it (her pose's steps and state, a claimed hit, out);
  the room's decisions for a timeline (hits, turns, the rocks' hits, finishes, takeovers); a keyframe every five
  seconds only to start watching from the middle quicker; places and times; and each racer's puzzle moves,
  empty for now. `src/race-replay.ts` replays one exactly: each player's sloop from her actions through the
  same helm (`PlayerSea`), the room's race through the same rules (`Referee.replay`): the same places, times
  and squares, step for step (tested). About 20 KB for a seven-minute race of two players and two bots. The
  room keeps it in its own storage, a row in D1's `races`; `GET /api/races` lists the recent ones, `GET
  /api/races/:id` hands one out. The viewer is next.
- **Not yet, or shaky:** a real player's replay is exact only so far as everything that moves her goes
  through her helm: the puzzles' own boards (the Sailing board's pair, Bilge, Carpentry, Foraging) aren't
  written down move by move yet (the record's `moves`, for the next step), so a viewer can replay where she
  sailed but not yet her boards. The crane's trip and the starlit door's tunnel are moorings at either end.
  Replays across browsers rest on `Math.sin` and friends giving the same bits everywhere, which they nearly
  always do. No cheat-proofing (friends, trusted). A player's hits on the rocks are in the timeline as she makes them (the bots'
  are). Testing it locally: wrangler watches the whole site folder, so anything writing there (an agent's
  build, `node_modules`' caches through a linked folder) restarts the server and closes every room.
- **Cost on Cloudflare's free plan:** a race of about four minutes keeps its room awake about that long: at
  128 MB that's about 30 GB-s of the 13,000 a day (some 400 races a day); and each player's five poses a
  second, counted at twenty WebSocket messages to a request, are about 60 requests a player a race, of
  100,000 a day (some 400 races a day of four players). Snapshots out are free. The lobby sleeps.

**The lobby, as built (12 Nov, after the user's first try online).** "it's not even clear like that you're in a
lobby with people ... how do I know that people are here instead of bots?"; "much more lobby-like ... here's the
map of the course, you've got people loading and waiting, or you can play with bots"; "the public lobby, where
people can just come in"; then "I [don't] think I want people to share codes. You should just see a lobby and
be able to join it", and "I eventually found the race online thing. That really was not clear". So:
- **A plain way in:** Race online on the den's top panel (out to the race's buoy and in to the line from
  anywhere), on the starter's card, or O on the line.
- **Open races, no codes:** three rooms anyone walks into with a click (`NET.LOBBIES`, their codes reserved);
  the list shows each one's state and who's in, looked at from outside (`Referee.peek`, `GET /api/race/CODE`
  without a WebSocket; `GET /api/race-lobbies` all three; `peekText` its words). Private codes are only under
  the hood now: a `?race=CODE` link still works, but the panel never asks for or shows one.
- **The room's lobby** (js/den/race-net.js, den.html's `#racenet`): the course's chart
  (`changelog/race-map.jpg`), who's in, each plainly PIRATE or BOT, and two choices, Blockade-style: **Wait
  for pirates** or **Start now** (bots fill the empty places). The rule is the room's (`Referee.aboard`):
  everyone's pressed Start, the count at once; someone has, the count in `NET.ABOARD` (15 s) with whoever has
  by then, the rest racing the next; nobody, no clock and the room sleeps. Nobody idle can hold a public race up.
- **The next race filling in view:** a pirate in during a race sees who's racing and who's waiting for the
  next ("Next race: Cara ✓"), and can press Start for it while it's on. Once every player in the race is home
  or out and someone's waiting, it's called `NET.CALL` (20 s) later; the places show `NET.RESULTS` (15 s) (or
  less, if everyone presses Race again), then the room goes back to its lobby by itself, those who waited
  still in for the next. Nobody waiting, the bots come home in their own time, as before. (The snapshot's
  `soon` counts each of these down.)
- **Only what applies** while racing or in the lobby: the den's top panel slimmed to its name, Race online
  and Pause; the starter's card a line and who's racing, the rest behind How it works; no sailing bar on the
  line; no H: head home (nor H itself) in a race.
- **Names on the water:** over every sloop in the race, small, a pirate's in her sails' colour, a bot's dim
  and marked BOT, yours "(you)" online (race-field.js).
- Not yet: players "loading" (a socket opening) aren't shown till they've said hello; the open races' list is
  looked at every three seconds while it's up (three small requests each time).

**Real players racing each other online (asked about 12 Nov; built as above).** "what would it take to make
the sloop race things multiplayer? So you can have like a handful of people playing if we get to play
testing it." Not peer to peer (the user, 12 Nov: "peer-to-peer
architecture was a major problem when I've done something before"): the den's co-op already has every
browser talk only to a small room on Cloudflare (`worker/crew.js`, a Durable Object), never to each other,
though the room only passes messages on and the first browser in does the sums. **For the race, the room
runs the race itself** (agreed 12 Nov, "absolutely go for it"): the field's rules are plain code with no
3D (`src/den-racers.ts`), so the room keeps the field (whose turn at a lock or the crane, hits, places, the
clock, the start's field from one shared seed) and sails the bots filling the empty places; one fair
referee, no host to lose, nothing stalling when someone's tab is in the background. Each player still sails
and puzzles in their own browser, sending where she is a few times a second. Everyone else's sloop is a racer moved by what arrives
(a `Drive` like the bots', fed from the room). A race room of its own, a few more places than four, a lobby
on the starting line (a code to share, ready up, the count from the host). Kept apart from the rest: its
rules a tested `src/` part, its wiring a `js/den/` file, a thin hook on the line. Trusting the players
(friends, for playtests): no cheat-proofing to start.
**Long term, a proper server (12 Nov):** "we need a proper server in future, so that ... it's not
hackable, it's fair ... and it's reliable", because "if somebody misses one of the messages, someone else
doesn't, then things get out of sync, and before you know it, you're on top of a rock. So yeah, long
term, that definitely needs a proper technical thing, but yeah, it's fine. Proof of concept right now."
So the room-run race is the proof of concept. Later, a hardened server: the server sails every sloop from
the players' inputs and checks every puzzle's moves (the puzzles are seeded rules with no 3D, so it can
replay them), so nothing a browser claims is simply believed; state sent as full snapshots that heal a
missed message; reconnecting mid-race. Even the proof of concept sends full snapshots with a sequence
number, never one-off messages that must all arrive, so a missed one is corrected a moment later. The
puzzles checked by the server, their timing too, and what it costs: IDEAS.md, "Puzzles the server can check".

## 7. The start: a field of slow winds and whirlpools, fresh each race, and its hop (built 11 Nov; reworked 12 Nov)

"In the opening of a blockade, one of the challenges is, right, you've got a bunch of winds and whirlpools
and you have to really eyeball it to figure out what the fastest way forward is. And you can kind of ...
pick your starting spot along the starting edge based on that." And (12 Nov): "we need two different kinds of
[winds]. Like the trade wind kind that really just blows you and you don't get the chance, but you also need
the slower wind that only nudges you one per turn ... you would say left into a whirlpool because the wind
action then takes you one tile further up, so that kind of navigating and eyeballing the route", and "there
should be some element of randomness to it so that it's not the same on every single thing".
- **Picking your spot:** Space at the buoy takes you in to the starting line, a rope of floats across the
  course behind the rocks, your spot ringed in gold; A and D move you along it (never onto a rival's spot);
  Space and the count. Racers start from their spots at the gun.
- **Two kinds of wind, in Puzzle Pirates' order:** each move, her own move first (left, forward, right, or
  staying put: idle, after a breather), then the square she's on acts once: a slow wind pushes her one square
  its way (`Sea.nudge`); a whirlpool turns her to its opposite corner, clockwise, a quarter turn
  (`src/den-whirl.ts`). A square that puts her on another special square acts no more that phase (YPPedia).
  Trade winds stay instant: the snakes, the lanes a Double, Triple or Vegas hops. Slow winds are drawn as soft
  dotted tiles, each with one arrow nudging the way it blows; trade winds as racing streaks.
- **The field, fresh each race** (`src/start-field.ts`, `fieldFor(seed)`): six rows between the line and leg
  1; two or three plain whirlpools and six to nine short runs of slow winds, laid from the race's seed
  (`Race.seed`, picked as she's taken in to the line; online, the room's, the same for everyone and shown in
  the lobby before the count; a watched race's, its own). Always a way through: from every spot the pilot can
  sail her down through it and along leg 1 to its bend under sail (checked; a draw that fails is laid again).
  The slow winds lean on toward buoy 1 on the left and back on the right.
- **Fixed in it:** a conveyor along its first row from the left-hand edge, setting her down above the hop (so
  the far left isn't hopeless); on the right past the hop, a row of headwinds and under them a wind back into
  the hop's lane coming down (so the spots nearest buoy 1 aren't far ahead).
- **The hop (12 Nov: "that could have a nice hop to the ball thing to get started"):** "the ball" read as buoy
  1, the field's ladder lands her toward it: a row of headwinds over a lane walled with rocks (columns 15 to
  20), the lane running her along and down onto leg 1 at column 21, four squares short of buoy 1. A Double from
  the row above, facing down, hops the headwinds into the lane: about 10 s saved, a Double's gap's worth (in
  proportion: §3); less and she's blown back up a square.
- **The spots:** the quickest are above the hop and on the right (about 12 to 14 s to the first bend), the far
  left about ten seconds slower (`SIM.SPOTS`, the mean over 40 fields). In 2000 races of four, left of the hop
  won 18%, above it 28%, right of it 29% (fair 25%; the band 0.6 to 1.4).

## 8. Balance

**Shortcuts in proportion (the user, 12 Nov; built the same day, below and §3):** every puzzle's shortcut should skip about the same stretch
of course, so on the chart they look even: "each an element of puzzling surely should be the same
distance", where today the imperial gate cuts a small corner, the locks about twice that and the crane
three times again. Each stopped puzzle is sized to take about the same time to play, so the only choice
is which puzzle you're good at; only the chain hops scale with how hard their chain is (a Double, then a
Triple, then a Vegas, biggest). This replaces "each saves about what it takes to play" where puzzles
differed in length. (In TODO.md, the race's next pass.) Not strictly uniform (the user, 12 Nov: "things don't have to be
uniform, but ... we've not really got any real numbers on how long each puzzle takes"): roughly even, by
the bots' and the simulation's times till there are real ones. **Real puzzle times, later:** "it would be
good to maybe collect those if possible, but I guess that's more if you had a full server version and a
database ... Especially ... because we're probably bug fixing stuff so rapidly at the moment anyway." So
collecting players' times waits for the proper server (§6) and a steadier course.

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
  trip runs through its own water, as your rivals are drawn; the balance test held, unchanged. Since 12 Nov
  ("Moves and gusts", below) every bot sails on a helm of her own, square to square, and her progress is read
  off her square.
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
  of the time. Free on the move, everyone Sails on the pilot, its chains carrying her on (till 12 Nov a steady
  0.06 to 0.12 squares a second by skill, and a combo or Gunnery on the move slowed her to 85%; since, each
  clear's own gust: "Moves and gusts", below). The bribe's haul (12 Nov): 4.7 moves of Treasure Haul for its
  40 coins (measured by a bot playing any line it sees) at 1.5 s a move (assumed); a second at the gate to
  pay, then the tow.
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

**The bribe added (12 Nov).** A 'bribe' route (the wreck's 40 coins hauled, the gate paid, towed through), and
every shortcut at once bribing at the gate instead of rushing it on a combo. 3000 races of four, fair 25%:

| Route | Wins | Route | Wins |
|---|---|---|---|
| The long way | 31% | Doubles | 29% |
| Gun gap, run | 14% | Whirlpools' Vegas | 34% |
| Gun gap, combo | 29% | Barrier (Foraging) | 19% |
| Gun gap, shot quiet | 22% | Locks | 27% |
| **Bribe** | **27%** | Crane | 23% |
| Headwind, rowed | 17% | Starlit door | 19% |
| | | Every shortcut (bribing) | 34% |

- **What the gap saved each way through it** (seconds, decent / good / great, a racer a level better at her
  own route's puzzle): bribe 6 / 8 / 8 (its haul counted against it), combo 7 / 9 / 8, shot quiet 7 / 8 / 8,
  run 1 / 3 / 2; every shortcut at once, bribing as an all-rounder, 4 / 5 / 7.
- **Tuning it:** without the tow (ghosting through the light airs) the bribe won 9% (50 coins) and 13% (30
  coins); with it, 29% at 30 coins and 27% at 40. The other routes moved a point or two: the barrier fell from
  20% to 19%, shot quiet from 24% to 22%; every shortcut stayed at 34%.
- **Styles:** peaceful 26%, opportunist 27%, aggressive 24%, cautious 24%. **Skill:** great 47%, good 24%,
  decent 5%. **Starting spot:** left 23%, at the gap 27%, right 20%. Fields of two: every route 37–63% (fair
  50%); of three, 20–46% (fair 33%), running the gap the weakest.
- The balance test (`tests/race-sim.test.ts`) races the bribe with the rest, and checks a briber hauls
  sheltered, is never holed by the gate's guns, and that her haul is counted against the gap.

**The playtest's fixes (12 Nov).** The locks' trip 10 s to 4.3 (their water and gates a beat, and made
ready each race), and the Double's gap lined up from the leg (its trip 3.8 s to 2.2). With the locks where
they were (saving 31 s) they won 41.2%, 1.65 of fair, over the band; a column toward the bend (28 s) 35.6%;
two (23 s, `LOCK_C` 11) 24.1%, kept. 2000 races of four, fair 25%: the long way 30%, gap run 16%, combo 29%,
shot quiet 21%, bribe 25%, headwind 17%, doubles 30%, whirlpools 35%, barrier 19%, locks 24%, crane 21%, door
24%, every shortcut 32%. Styles 23–27%; skill great 46%, good 25%, decent 5%; spots left 23%, gap 27%, right
19%. The locks save a decent player about −1 s, good and great 4 (they were −5 and +3 on the first pass).

**The starlit door's stretches (12 Nov, §9).** The door's route in the simulation: Navigation at the rock;
then at the mouth, either any clear (`SIM.PUZZLE.gust`, 8 s, assumed) to come up at the first exit, or a
Vegas, if what it opens up is worth more to her; under the cleft she pushes on with another Vegas while
the next stretch pays her, by her skill at a Vegas and whether it comes off (a Vegas that doesn't spills
her up the last cleft she passed, never back to the mouth). In the tunnel she's carried: nobody can shoot
her. 3000 races of four, fair 25%:
- **The door wins 23.3%** (it was 17.5% with one Vegas through to leg 4); fields of two 42% (fair 50%),
  of three 28% (fair 33%). Every other route stays in its band, the styles 24–27%.
- **Who comes up where:** about half at the first exit (leg 3; mostly decent players throwing any clear,
  and Vegases that didn't come off), who almost never win (0.3%): it's the consolation, back in the race.
  The other half go on to the far end (leg 5), good and great Vegas players, and win 56% of their races.
- **What it saves:** a decent player still loses about 24 s on it all told, a good one 9, a great one 6
  (the Navigation's minute at the rock is most of it); the far end's Vegas in peace is where it pays.
- **Tried and dropped:** an exit under every leg (onto 3, 4 and 5): each stretch saved about 40 s, less
  than a Vegas costs even a great player, so nobody pushed on and the door won 7%. Letting the aggressive
  style come up at the first exit to get back to the fight left them only the consolation; style shows at
  the door only as it does everywhere (the cautious don't stop at the rock with someone close behind).
- `tools/race-sim.mjs` lists who came up at each exit; `tests/race-sim.test.ts` checks whoever goes in
  always comes out at an exit, both are used, and the far end wins more often than the first.

**The gambles added (12 Nov, §4; gone in the race's next pass the same day, below).** In the simulation (`BETS`, `SIM.BET`), a racer coming to a gamble takes
it by her place: leading 10% of the time, in the pack 35%, last 70%; the aggressive a little more willing, a
cautious leader never (at first the cautious were half as willing everywhere: they then won 19%, under the
band, so now they only never gamble in the lead). The veiled wind's a coin toss; at the pool she waits for its
spin to turn her way and goes in, timed right 65 / 78 / 90% of the time by skill (assumed). Each racer takes
each at most once a race (twice let a rival be thrown back twice, home in over 400 s). Each way's saving is
the helm's (`GAMBLE.SAVES`, tested). Bots past the pool on leg 2 are drawn on its second row. 2000 races of
four, fair 25%:

| Route | Wins | Route | Wins |
|---|---|---|---|
| The long way | 32% | Doubles | 28% |
| Gun gap, run | 20% | Whirlpools' Vegas | 34% |
| Gun gap, combo | 25% | Barrier (Foraging) | 24% |
| Gun gap, shot quiet | 21% | Locks | 28% |
| Bribe | 26% | Crane | 21% |
| Headwind, rowed | 18% | Starlit door | 23% |
| | | Every shortcut | 25% |

- **The gambles:** the turning pool taken 2193 times, came off 77%, saving decent / good / great −12 / 0 /
  +8 s on average; the veiled wind taken 2063 times, came off 51%, saving about 0 / −2 / +1. Taken by the
  leader 137 and 367 times, the pack 1287 and 1216, the last 769 and 480.
- **Styles** 24.7–25.3%; **skill** great 39%, good 25%, decent 12%; **spots** left 25%, gap 26%, right 22%.
  Fields of two: every route 45–54% (fair 50%); of three, 25–43% (fair 33%).
- `tools/race-sim.mjs` lists the gambles (`GAMBLES=0` races without them); `tests/den-gamble.test.ts` checks
  both are taken and come off as often as they should, the back of the field takes them more than the
  leader, a cautious leader never, and each is worth about nothing on average.

**The barrier a column east (12 Nov, §3).** Its saving 15 s to 12 (the helm), Foraging still 15 s
(`SIM.PUZZLE.forage`, no longer tied to its saving). 2000 races of four, fair 25%: the long way 33%, gap run 20%,
combo 25%, shot quiet 21%, bribe 25%, headwind 17%, doubles 29%, whirlpools 34%, **barrier 23%**, locks 27%,
crane 20%, door 23%, every shortcut 25%. Styles 24.9–25.1%; skill great 39%, good 24%, decent 12%; spots left
25%, gap 26%, right 22%. All in the band (0.5–1.6 of fair).

**The race's next pass (12 Nov).** No gambles; gentle snakes; slow winds and a field fresh each race with its
hop; the rocks; every stopped puzzle's shortcut about 22 s (the gate moved two columns in, its guns to its
mouth so they stay out of reach of the door's rock; the barrier and the rocks in spit 3; the crane to column
16, its small frames; the Triple's gap to 21; the locks 6 clears; the bribe's haul 4 s a move, from the user's
"an entire puzzle"; rowing 20 s); and the starlit door one stretch, Navigation only. Two things the
simulation needed besides: the long way's racers meet the trade wind back's loop, and an all-rounder taking
every shortcut is a jack of all trades, 20% slower at each stopped puzzle than her skill (`SIM.JACK`: at her
own skill at them all she won 46%, nearly twice her share). The door: with one stretch it saves 40 s, so its
Navigation has to be about forty seconds; two small constellations (53 moves, the day before's) left it
winning 3% of its races, three 2%, one of three stars 20% (`DOOR.NAV`: the user's "a bit trickier" is a
three-star one to start rather than a two; making it longer isn't possible while it's in proportion). 2000
races of four, fair 25%:

| Route | Wins | Route | Wins |
|---|---|---|---|
| The long way | 21% | Doubles (Double's and Triple's gaps) | 40% |
| Gun gap, run | 23% | Whirlpools' Vegas | 27% |
| Gun gap, Quad | 37% | **Rocks** | **29%** |
| Gun gap, shot quiet | 36% | Barrier (Foraging) | 23% |
| Bribe | 21% | Locks | 20% |
| Headwind, rowed | 14% | Crane | 18% |
| Starlit door | 20% | Every shortcut | 24% |

- **What each really saved** (decent / good / great, seconds, her puzzling counted): the gate 7 / 10 / 10,
  rocks 13 / 19 / 18, locks −4 / 3 / 6, crane −5 / 2 / 4, barrier 3 / 6 / 6, rowing 2 / 8 / 8, the door
  1 / 10 / 10, the Vegas −29 / −7 / −1, the Double 9 and the Triple 14 on the move.
- **Styles** 22 to 27%; **skill** great 45%, good 23%, decent 7%; **spots** left 18%, above the hop 28%,
  right 29%. **Snakes:** 161 racers caught by the left-hand trade wind's loops (4% of them still won), 123 by
  the trade wind back (7%), 58 by the tight water (16%). **The rocks** came down in 26% of races; 744 racers
  went through them, 220 free on someone else's hits (they won 31%).
- **Close to the band's edges:** the Doubles (1.59 of fair: two on-the-move hops, nearly free) and rowing
  (0.56: exposed, and rowed slowly). Both in band; the balance test (800 races) holds them there.

**Moves and gusts (12 Nov).** "She's doing lots of Doubles and Triples, but that's supposed to be zooming your
ship along in any context"; "why are they going so smoothly? ... It's supposed to be like moves". Every bot now
sails as your sloop does (RULES.md, "Every racer sails as your sloop does"): a `Helm` of her own on the race's
sea (its start's field from the seed, every shortcut's way shut), square to square at the helm's pace, the
pilot's quickest way charted once backwards from each pin (`src/race-pilot.ts`, the pilot's own weights) to the
long way's pins or her route's next shortcut's way in (on the leg's second row: the course's wind blows down
it, so there's no sailing back up). Off the helm (a trip, a sweep, into a spot) she's walked a square at a time;
the moves into a spot come off the trip's time, which the helm measured from the long way. Her Sailing is a drop
at her skill's pace (2.6 / 2.2 / 1.8 s) whose chain is drawn from the shallow bot's own odds (`SAILOR.ODDS`:
3000 drops, a clear 34%, a Double 2%, a Triple 0.07%; about 0.38 squares a drop), played on a real board when
watched; each clear is a gust there and then (`carry`), along a leg, heading along it (not round a bend, not by
the trade wind back, not on the start's field, not loading by Gunnery). `CHAIN` and `OVERLAP` are gone. The
long way with no puzzle now takes a good Sailor about 198 s (222 s with no Sailing, the helm's measure). 2000
races of four, fair 25% (before → after):

| Route | Before | After | Route | Before | After |
|---|---|---|---|---|---|
| The long way | 20.8% | 22.0% | Doubles | 39.7% | **64.7%** |
| Gun gap, run | 23.4% | 21.6% | Whirlpools' Vegas | 26.5% | 27.0% |
| Gun gap, Quad | 36.6% | **12.2%** | Rocks | 28.8% | 22.0% |
| Gun gap, shot quiet | 35.8% | 33.9% | Barrier (Foraging) | 22.9% | 15.4% |
| Bribe | 20.6% | **7.3%** | Locks | 19.6% | 24.0% |
| Headwind, rowed | 14.0% | 18.1% | Crane | 17.6% | 36.7% |
| Starlit door | 19.7% | 24.9% | Every shortcut | 24.3% | 20.3% |

- **Out of the band (0.5–1.6 of fair), left for the user, not tuned:** the **Doubles** (2.59): both gaps built
  on the move cost nothing now that her clears carry her while she builds (the 85% she sailed at while building
  was what held them back); the **gun gap's Quad** (0.49, on the edge): the real pilot brings her to the gap
  sooner than the old reckoning did, before her combo's built, so she stops short in the open (stopped there
  75 times in 300 races against 40); the **bribe** (0.29): the wreck's notch sits behind the field's hop and
  the conveyor, and the course's wind blows down, so from most of the line no sailing reaches it (a player would
  row); a bot that can't get there goes on without the coins and runs the gap. `tests/race-sim.test.ts` holds
  these three to wider bands, so a further slide still shows. Levers if wanted: the Doubles' build times
  (`SIM.PUZZLE.double`, `triple`, assumed 22 and 28 s; the builder bot makes a Double or better one drop in
  thirteen), where the wreck lies, and a rival choosing her spot by her route.
- **Styles** 23–26%; **skill** great 38%, good 26%, decent 12%; **spots** left 20%, above the hop 27%, right 28%.
  Snakes: the trade wind back 131 racers (15% still won), the left-hand loops 190 (8%), the tight water 70 (6%).
- **Running it:** about two minutes for 2000 races (it was 30 s): the pilot's charts are made once per pin and
  per race for the start's field.

**For the user to decide:**
- Moves and gusts (above): the Doubles, the gap's Quad and the bribe out of the band.
- The rocks: should the rubble settle back after half a minute or so, so only whoever's close behind the
  shooter gets through free (§4)? And should a rival make for them when she's behind?
- The bribe's price (40 coins) and Treasure Haul's pace (1.5 s a move) are guesses till it's played. Should a
  rival bribe her way through? (The starter's card names it, since 12 Nov.)
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

## 9. The starlit door (built)

Built as a hidden gem, never hinted; **public since 12 Nov** (the user: "make the [starlit] door public.
Yeah, no hidden ... not for a proof of concept. It didn't really work"). Built that day:
- **A link and a cheat:** `den.html?at=door` puts her on the race course stopped under the door's crag,
  Space to look closer at the rock (no race running: the door's played as well out of a race as in one).
  "The starlit door" in the cheats' race section (`js/den/menus.js`, `cheatDoor`; `js/den/door.js`,
  `doorCheat`). `doorTest` stays, a console hook for what the cheat doesn't do (open it, carry her through).
- **The starter names it,** among the shortcuts, a line of its own after the bribe's: "Or, for a navigator,
  a starry door in the cliff off leg two, opened by Navigation, and a tunnel under the course up onto leg
  three" (its Vegas line went with the stretches, 12 Nov). The tests that forbade it now check it's said (`tests/den-race.test.ts`).
- **The chart shows it:** one chart, no `PUBLIC` mode (§13): the door and its stars, the tunnel dotted in
  purple, the cave at its exit, its label and its route's wins.
- **The changelog and the design page:** "The starlit door" under 11 November, where it was built, with
  shots of the door open and the tunnel (`changelog/starlit-door.jpg`, `starlit-tunnel.jpg`), and a
  section on `design.html`, "The starlit door: the long way round for a navigator".
- **The bots still don't take it,** in the watched race or as your rivals: kept off their routes for
  balance (the simulation's door bots, §8, are another matter), no longer a secret
  (`tests/race-watch.test.ts`).
- **Back to simple, Navigation only (the user, 12 Nov, decided; replaces the tunnel's Vegas stretches below):**
  "I love some of the animation and the styles on it, but I think it needs just probably to go back to being
  simple... nav only shortcut that takes you just like one step through, and maybe can be tuned to be a bit
  trickier. Because I could just imagine someone good at doing Vegas, it takes you out of the race. It's too
  isolated otherwise." Navigation at the rock opens the door, and that alone carries her through one stretch
  and up the cleft onto leg 3. No clear to get in, no Vegas under the cleft, no exit onto leg 5: a racer who's
  good at Vegases can't sail under half the course out of everyone's reach. The look stays (the crag, the stars, the door
  swinging open, the tunnel). Its Navigation can be made trickier so the door's saving stays in proportion with
  the other shortcuts. They first found the tunnel's two stretches hard to read in play ("so it takes you fully
  all the way through the course?").
- **As built (12 Nov):**
  - **The door, plain to see:** a door in the crag (a frame of pale dressed stone, two iron-bound timber
    leaves), stars round it always twinkling, the carved wheel over it (TODO.md's "Every shortcut reads as what
    it is": "Is there supposed to be a visible marker ...? Surely").
  - **Its Navigation:** Space off it stands Duty Navigation on the rock as the night sky: one constellation of
    three stars (`DOOR.NAV`), about 34 moves for the planner bot, about forty seconds. Filled, its stars light
    on the carved wheel and the door swings open. A booch pushes her off and darkens the stars.
  - **Through, one stretch:** swung open, it carries her straight through (`through`, `src/den-door.ts`):
    in at the door, along the tunnel's cavern under the spit, and up its cleft onto leg 3 (about 40 s saved,
    `DOOR.SAVES`; her trip 3.1 s). Off it later with it open, Space takes her through. Nobody can shoot her in
    the tunnel. No Sailing clear to get in, no Sailing board in the doorway, no Vegas under the cleft, no far
    end onto leg 5: the stretches, and "Getting in, plain and forgiving" (the same day's fix for sailing into
    the doorway), went with them.
  - **The cleft is the door's:** two of its stars over its mouth, so it reads as the door's way out, not an
    open gap ("There's two tunnels. I don't know what they are").
  - **Sized by the simulation (§8):** with one stretch the door saves 40 s, so its Navigation is about that
    long: two small constellations (the day before's) left the door winning 3% of its races, a constellation
    more 2%, one of three stars 20% (fair 25%). "A bit trickier" is the three-star one to start, rather than a
    two; longer than that and it's a shortcut nobody should take.
- **Before (11 and 12 Nov), now gone:** the tunnel ran under legs 3 and 4 in two stretches, a Vegas a stretch,
  a clear from the mouth spilling her up the first cleft, a Vegas built in peace under it carrying her on to
  leg 5 (119 s). The user's reasons for dropping it are above; the decision to keep a side route connected to
  the race ("there needs to be some chance you can be pulled back in", §1) is what one stretch keeps.
- **Simplified (11 Nov) to be competitive.** It was first built with an evil constellation last, which took
  minutes of puzzling to save two and a half of sailing: "simplify the duty navigation down to be more
  competitive." The evil constellation is saved for elsewhere (IDEAS.md, with Umami's credit for when it
  lands).
- **Position matters (§6):** it's a stop at the rock, in the open: the back of the field's chance, a leader's
  risk.

## 10. Watching (built), the course editor (built) and replays (idea)

"Replays, and ... that would go down to the detail of the actual puzzling, because that's kind of what
you're watching." A replay shows the sea and every sloop on it, with each racer's board beside them, move by
move. It's cheap to keep, because the puzzles are dealt from a seed: a run is its seeds and its moves with
their times. A race could also be watched live.
**Past races to watch, online (agreed 12 Nov):** "if we actually put this into a multiplayer, even like
proof of concept thing where people can see games that have been played, view them and see the replays."
So every online race is recorded by its room and kept. **Actions, not positions (12 Nov):** "you don't need
[sloop] positions 4 times a second, you just need moves ... really all you need is to save somebody's
actions." The record is the seeds and each racer's actions (her helm's moves and pins, shots, puzzle moves),
replayed through the same rules. **No drift (12 Nov):** the race goes in fixed steps (60 a second), not
by however long each screen frame took, and each action is stamped with its step, so a replay comes out
exactly as the race did; "you can translate between number of moves and time", so skipping ahead is
replaying the steps without drawing them. Live, the room still sends full snapshots, which heal a missed message; only what's kept is actions. a list of past
races to pick from; and a viewer like watching (§10 below: the free camera, following a racer, her board
played from her real moves), with pause, speed and a bar to skip along. After online racing lands, as
the room's record is the replay.

**Spectator mode (built 12 Nov).** "As a spectator ... I can see the puzzle, as I said, the puzzling, the
just move around free camera, including jumping between watching each person in the race." And "are you
able to show me a link today to just see all four bots? ... I can give input into ... how realistic it
looks." `den.html?at=race-watch` (`&seed=` names a race: one seed, one race, to show someone the same one).
- **Who races:** your three rivals and Gravee (`WATCHED`, `src/den-rivals.ts`), the fourth on a way round
  none of them takes: up through the locks, Bilge on the quay ("Bedside Manors has cellars"), cautious, good.
  A watched race only: a race of yours is still you and up to three. Sailed by the simulation's own bots on
  a field of their own (`sail(..., you: false)`), so what you watch is what the balance test races.
- **The camera and the bar:** a free camera (W A S D, Q E, drag, wheel, pinch), 1 to 4 to follow a racer,
  Tab the next, 0 back to free; the bar says who, her place, her leg and what she's doing in plain words
  (`src/race-watch.ts`, `doing`). RULES.md, "Watched", has the keys.
- **Moves, and every clear a gust (12 Nov):** "she's doing lots of Doubles and Triples, but that's supposed to
  be zooming your ship along in any context", and "why are they going so smoothly? ... It's supposed to be like
  moves, like forward, left, right". Every racer sails as your sloop does (§8, "Moves and gusts"): square to
  square on her own helm, drawn exactly where it has her (`motion`; race-field.js's `boatAt` no longer eases
  after her). Under way her Sailing board is the race's own (`W.sailor`: a real board played by the shallow
  bot, `src/race-sailor.ts`), mirrored on screen drop for drop (watch-boards.js), so each clear you see pop is
  the gust that carries her on, as it pops.
- **The puzzling, with real moves:** her board as she plays it, each puzzle's own rules played by its own bot
  and drawn by its own look, paced to the simulation's drawn seconds, so the balance holds: at a stop the board
  is a picture of the time the simulation gave her, not what decides it; under way, Sailing is what moves her
  (above). Sailing is the shallow bot
  (`src/sail-bots.ts`: one drop ahead, the builder's sense at a thirtieth of its cost, a Double every 60 drops
  or so against the builder's 20; the builder's third of a second a drop stutters the browser). A Vegas is
  one the staircase bot made (`VEGAS_GAMES`, three recorded), its last drops played in her time and the last
  held till the simulation says it came off. Bilge, Foraging, Gunnery and Carpentry have simple greedy bots
  of their own (`src/bilge-bot.ts`, `foraging-bot.ts`, `gunnery-bot.ts`, `carpentry-bot.ts`); rowing's and
  Navigation's moved into `src/` too (`row-bots.ts`, `nav-bots.ts`), though nobody watched rows, and
  nobody takes the door.
- **Not yet:** the rowing boards aren't drawn when watching (nobody watched rows). A built crane isn't
  drawn going up for a bot (its frame shows on her deck). The lock's own water doesn't rise as a bot pumps
  (the board's water goes down). Boards at a stop are only played for the racer followed (every racer's Sailing
  board is played, followed or not: it's what sails her).
- **For the user to judge:** how realistic it looks; whether the boards' pace reads right (the bots don't
  decide when a puzzle's done, the simulation does: a board can look half done when she sails on, or wait
  done a few seconds).

**Idea for later: teams, a relay (12 Nov, not agreed to build).** Teams of sloops racing together, each
member taking a different job: "one ship would go do some hauling, one could race ahead to build the
carpentry thing ... someone helps build while somebody else is running the actual course." Clearing a
section unlocks trade winds that carry teammates further up the course: "once somebody clears a certain
section, it unlocks some trade wind so that their teammates can skip the course." So one races ahead to
unlock the winds, one builds the crane by Carpentry, one hauls treasure by Treasure Haul and rides the
unlocked winds to "really race ahead and get to the final toll gate", paying it with the treasure.
Different tracks for different teams are possible too. "All just ideas." It would build on the field
(several racers), shared shortcuts (one racer's crane or opened wind used by her team; §12's open
question of whether a crane is everyone's), and the bribe gate as the final toll.

- **The den's characters along the course (idea, 12 Nov):** "making the course have a bit more
  personality and come alive ... bring in the different characters", even just lines in speech bubbles
  as you pass: Gravee painting the race, its best moments her paintings at the finish; Helium (once they're
  in) providing the rum; Mischievious putting up banners and styling the event. Scenery and talk only,
  never a change to the racing. IDEAS.md, "The race course coming alive".

- **Replays and a course editor, likely the first things players ask for (idea, 12 Nov):** "being able to
  do things like [re]plays, and having a map editor are going to be like the top of demands if people
  start to enjoy it once we get past testing this initial course." The editor goes "down to the details
  of how many it takes to clear each thing, like ... the number of bilge clears required on the locks,
  or the number of pieces or complexity of each carpentry lift". Mostly a 2D job, but "you'd need to be
  able to switch between 2D and 3D views". What's there to build on: the course is already laid out
  from a few numbers (`LAY.RACE`, meant to be reworked freely); the chart (`tools/race-map.mjs`) already
  draws it in 2D; each shortcut's size (lock clears, the crane's frames, the barrier, the coins) is
  already config; and the simulation could test an edited course's balance before it's raced (win rates,
  what each shortcut saves). Replays (above) are cheap for the same reason the boards are: seeds and moves.
  Replays not started.

**The course editor (built 12 Nov, a first version).** The user agreed to go for it "if it's relatively
easy". `race-editor.html`: the course in 2D in the chart's look, click and drag, a side panel, a balance
check, a share link, and the den's own race for 3D.
- **The course as data** (`src/race-course.ts`, `Course`): the few numbers `LAY.RACE` is laid from, plus each
  shortcut's size. `layRace(course)` in `src/den-sail.ts` lays any course; the den's own is `DEFAULT_COURSE`,
  every square of it as before (`tests/race-course.test.ts` holds it to a snapshot taken before the change,
  `tests/fixtures/race-course-12nov.json`). What's editable:
  - **the buoys:** where each spit ends, so the long way round it (spit 1's 20–25, the other right-hand ends
    16–25, the left-hand ones 2–10); leg 4's zigzag goes with buoy 4;
  - **where each way through cuts its spit** (a column): the gate, the wreck, the headwind gap, the Double's
    gap, the trade wind back (the middle snake, its loop), the whirlpool channel, the rocks, the barrier, the
    locks, the crane, the Triple's gap, the finish line;
  - **each shortcut's size:** the up lock's Bilge clears (3–20, the race's 6: `LockSpot.work`), the crane's
    frames (small 6 pieces, the race's; standard 13; large 18: `CRANES` in `src/den-crane.ts`, each tested to
    fill exactly), the barrier's bundles of driftwood (1–4), the guard's price (10–100 coins; Treasure Haul's
    moves scale with it). (The veiled wind's odds and the turning pool's beat went with the gambles, 12 Nov; a
    share link from before then, version 1, opens the den's own course.)
  - **Fixed for now:** the rows (the legs two deep, each spit its depth: the whirlpool channel's depth is what
    makes it a Vegas, so its Vegas isn't editable yet), the start's field (each race's own) and its hop, the
    left-hand trade wind's loops, the gun gap's Quad, the tight water (it follows the gate), the rocks' three
    hits.
- **Always a race** (`problems`, `waterProblems`): every way through inside its spit with a column of land
  either end and a column of land between it and the next (so no way through runs into another), each where
  the legs either side reach it (the gate and wreck past the starting line's middle, the locks past the
  zigzag...), and the water itself checked: the long way open round every buoy to the finish, every
  shortcut's way in sailable. A thousand random edits are tested. Moving a buoy in past a shortcut flags it
  ("The imperial gate has to be between columns ...") rather than shoving it along; nothing's shared or raced
  in 3D till it's put right.
- **The share link** packs a course into about 26 characters (`?course=`, one base-36 character a number);
  a garbled one, or one that isn't a race, opens the den's own course.
- **3D:** `den.html?at=race&course=...` lays the race from the link, read once as the page loads
  (`courseFromPage`): the land, buoys, locks, crane, barrier, rocks, the rivals racing it by the
  simulation's bots. A link top right goes back to the editor with the course (`js/den/course-back.js`). Its
  best time is kept apart from the den's own course's (`den-race-best:<code>`).
- **The starlit door, public (12 Nov: "make the [starlit] door public ... no hidden"), fixed in place:** it's on
  every course, edited or not, where it is on the den's own (columns 15 and 16: `DOOR_COLS`), drawn on the
  editor's chart with its tunnel and exits, its route in the balance check. Nothing else may cut through spit 2
  or spit 4 in its columns, nor the whirlpools' way home or the barrier come out onto leg 3 where it does, and
  the gate stays clear of its water on leg 2 (from column 18). Its saving is shifted with the legs it passes
  under. Moving it is left for later.
- **The balance check:** 300 races of four, in a Web Worker (`js/race-balance.js`, about 10 s), as the chart
  does: each way round's wins (flagged outside half to 1.6 times its fair share, the balance test's band),
  what each shortcut saves on the course and what it really saved a decent, good and great racer, and the
  Nobody's measured an edited course with the helm, so each shortcut's saving
  is the den's own measured one shifted by how much more or less of the long way it cuts out (`SHIFT` in
  `src/race-sim.ts`), and the long way's time scales with its squares. Its puzzles are as big as the course
  has them (Bilge by its clears, Foraging by its bundles, Carpentry by the crane's pieces, the haul by its
  price).
- **Left for later:** editing rows (spit depths, so the whirlpools' Vegas, leg widths), adding or removing a
  shortcut, more than one of a kind, the start's field, the gun gap's combo and guns' hits, a shortcut's
  saving measured by the helm on an edited course (it's estimated), moving the starlit door, saving courses by name, rotating the
  chart sideways on wide screens, undo, and a 3D view inside the editor rather than the den's race.

- **Shortcuts that change from race to race (idea, 12 Nov):** "if [this] does get too complicated as a
  course, you can always have shortcuts be different each time. Like some of them can be a double hop for
  sails ... These little sections are all ... relatively interchangeable at points." So a spit's gap
  could hold any of a pool of shortcuts (a Double's hop, rowing, a barrier, rocks to blast, a lock),
  picked from the race's seed, the course's shape staying the same: every race a little different, and
  the simulation checking each mix stays fair. Builds on the course editor's course-as-data.

## 11. Puzzles still to fit in (ideas)

- **Rigging:** a passage of shifting, gusty winds where you keep re-trimming. The six pulleys are six
  rigging lines, hauled in by pulls at them (a big pull hauls a line taut at once). All hauled is full
  sail; all let go is sails down for a blow; one side hauled sheets her round. Its small, frequent clears
  suit constant adjusting, unlike Sailing's and rowing's heavy combos. SunnyKira to teach it. Another way:
  Rigging dealt with big clears already half-built, tuned to be as quick as a big Sailing chain.
- **Treasure Haul, and a bribe at the gate (12 Nov): built 12 Nov** (§3, "The gun gap as an imperial gate,
  and its bribe"). The idea as it came: haul up treasure, then use it to bribe a guard at
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
  everyone that race? And two in the tunnel at once (none of your rivals takes it yet): can they shoot
  each other under the cleft? For now nobody in the tunnel can be shot.
- Where the race goes in the den's story, and what winning brings.

## 13. Where it lives

- **The race's rules:** `src/den-race.ts` (the line and your spot, the clock, the snakes, the buoys, the
  finish line, the barrier). Its course is `LAY.RACE` in `src/den-sail.ts`, measured by
  `tools/race-measure.mjs`. Its field of racers (several on one course, first come first served, shooting
  each other): `src/den-racers.ts`. Your rivals: `src/den-rivals.ts`, each one's racing in her file in
  `src/lines/` (`RACER`), sailed by `simDrive` in `src/race-sim.ts`.
- **The simulation:** `src/race-sim.ts`, run by `tools/race-sim.mjs` (§8).
- **The course as data, and its editor (12 Nov, §10):** `src/race-course.ts` (the course, its share link, what
  makes it a race), `layRace` in `src/den-sail.ts`, `src/race-editor.ts` (the editor's rules), the page
  `race-editor.html` drawn by `js/race-editor-view.js`, its balance check `js/race-balance.js` (a Web Worker),
  and the den's way back to it `js/den/course-back.js`.
- **A chart of the course (12 Nov):** `tools/race-map.mjs <out.html> [races] [size]` (Node 22:
  `node_modules/node/bin/node.exe`) writes one page in the captain's map's look, drawn from `LAY.RACE` and the
  simulation: the long way and its buoys, every shortcut with its puzzle, saving and its route's wins, the
  snakes and winds, the sheltered and exposed spots, the gun gap's reach, the start's spots, and a table of
  wins by route, style, skill and spot (2000 races, about a minute). The user: "a map of the course ... shows
  where all the shortcuts and things are, and all the wins". It shows the starlit door, its tunnel and its
  route like any other (since 12 Nov: no hidden gems, §9). Since the race's next pass (12 Nov) it marks the
  rocks, the field's slow winds (one race's) and its hop, and each label beside what it names (the wreck "haul
  the bribe here", the berth "wait for the lock", the headwind gap "row it").
- **The chart on the site (12 Nov):** one chart, everything on it (the `PUBLIC=1` mode that left the door
  out is gone, 12 Nov). Its chart alone, 1280 wide (a headless Chrome's screenshot of the svg, 1280 by 1822),
  is `changelog/race-map.jpg`, shown in the changelog's 12 Nov entry and on `design.html`: drawn by
  `JPG=changelog/race-map.jpg node_modules/node/bin/node.exe tools/race-map.mjs <out.html> 2000`, which stamps
  it with the course's fingerprint. `tests/race-chart.test.ts` fails when the course, or what its shortcuts
  save, has changed since it was drawn (the user, 12 Nov: "hopefully we're keeping this [race map] JPEG in
  sync").
- **Drawn and played by:** `js/den/race.js`; its start (the line, your spot, the starter's card)
  `js/den/race-start.js`; its buoys and finish line `js/den/race-marks.js`; its barrier of driftwood and
  its Foraging `js/den/race-forage.js`; the gun gap's gate, its guard and the wreck's haul
  `js/den/race-bribe.js`; your rivals' sloops, their broadsides and yours `js/den/race-field.js`.
- **The bribe:** `src/den-bribe.ts` (the wreck's coins, the price, the gate's answer, the tow); its squares
  `LAY.RACE.BRIBE`; the guard's lines `src/lines/gate-guard.ts`.
- **The start's field (§7):** `src/start-field.ts` (`fieldFor`, laid by `Sea.layField`; slow winds `Sea.nudge`);
  drawn by `js/den/race-start.js`; tested in `tests/den-race.test.ts`.
- **The rocks (§4):** `Rocks`, `onRocks`, `rocksOn` in `src/den-race.ts`, the hits on `Field.rocks`; drawn by
  `js/den/race-rocks.js`.
- **The chart's fingerprint:** `chartFingerprint` in `src/race-sim.ts`, stamped on `changelog/race-map.jpg` by
  `JPG=changelog/race-map.jpg tools/race-map.mjs` (a headless Chrome's screenshot), checked by
  `tests/race-chart.test.ts`.
- **The starter's lines:** `src/lines/race.ts`.
- **The starlit door:** `src/den-door.ts` and `js/den/door.js`; its starting point `den.html?at=door`.
- **Watched (§10):** `src/race-watch.ts` (the race of four, who's followed, what she's doing, her board and
  its pace, the free camera); drawn by `js/den/race-watch.js` (the camera, the keys, the bar, the sloops)
  and `js/den/watch-boards.js` (each racer's board); the puzzles' bots `src/sail-bots.ts`, `bilge-bot.ts`,
  `foraging-bot.ts`, `gunnery-bot.ts`, `carpentry-bot.ts`, `row-bots.ts`, `nav-bots.ts`.
- **Tests:** `tests/den-race.test.ts`, `tests/den-bribe.test.ts`, `tests/den-door.test.ts`, `tests/den-racers.test.ts`,
  `tests/den-rivals.test.ts` (the rivals racing you, shooting, places), `tests/race-sim.test.ts` (the
  balance test), `tests/race-watch.test.ts` (watching) and `tests/puzzle-bots.test.ts` (the bots).
- **Try it:** `den.html?at=race`; the starlit door, `den.html?at=door`; watch four race, `den.html?at=race-watch`.
