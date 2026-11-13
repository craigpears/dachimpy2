# Distilling: design document

A draft, from research on 12 Nov, for recreating Puzzle Pirates' Distilling as a browser puzzle with
bots. The rules below are pinned down well: besides YPPedia and the old guides, there is an open-source
practice site whose Distilling was ported from the real game client (its `crafting/brew` code) and
checked against it move for move (see Sources, "the client port"). Where that port gives a number, it
is the game's own. Anything unclear is marked **(to confirm with the user)**.

**The read version (13 Nov):** [distilling-guide.html](distilling-guide.html), the public guide to the strategy as
the bots and Helium play it: the rules in brief, a target and the levels, then the four phases in a game's order, each
with its own tricks and techniques under it, simplest first and tagged with the level that brings each in (`PLAN`,
reordered 13 Nov after the user found the progression "a bit weird"), every technique drawn as its drag on a real
board, one colour a drag, and the way on to other pirates. Its boards, names and Helium's lines come
from the code (`src/distill-guide.ts`; the later boards picked from bot play by `tools/distill-guide.mjs` into
`src/distill-guide-boards.ts`), and `tests/distill-guide.test.ts` fails when a routine, phase, level or trick has no
section or its board stops showing its move. Change it in the same work as any change to the lesson or the strategy.

Piece letters in the sketches: `w` white, `b` brown, `K` black, `*` spice, `x` burnt white.

## 1. What the real puzzle is

### The board
- **10 columns** of round pieces ("bubbles"), set like a honeycomb: columns alternate **9 tall and 8
  short**, the short ones sitting half a piece lower. 85 pieces in all.
- Every piece touches **four diagonal neighbours** (up-left, up-right, down-left, down-right), never the
  pieces directly above or below it in its own column. Swaps only happen along those diagonals.
- At the start, columns 1, 3, 5, 7, 9 (counting from the left as 1) are tall, the rest short. The
  rightmost column, next to the furnace, **always starts all black**; the rest are random.
- When the board shifts right, every column keeps its pieces, so the tall/short pattern flips each time;
  the new column on the left is always the opposite height of its neighbour.

```
   w       K       b          a corner of the board: tall columns (1st, 3rd...)
       b       w       K      sit half a piece higher than short ones (2nd, 4th...)
   K       w       w          each piece links only to its four diagonal neighbours
       w       b       w
```

### The pieces
| Piece | Called | Weight | Points if sent up | Swaps? |
|---|---|---|---|---|
| White | light, "white" | light (-1) | +1 | yes |
| Brown | medium, "brown" | neutral (0) | 0 | yes |
| Black | heavy, "black" | heavy (+1) | -1 | yes |
| Spice (orange) | spice | neutral (0) | +3 | **never moves** |
| Burnt white | burnt | light (-1), like a white | **-3** | yes, exactly like a white |

New pieces: each is white, brown or black with equal odds; **1 in 31 is a spice**, except that the
first 17 pieces made (the two columns beside the all-black one) are never spice. (An older guide says
"roll 1-30, a 30 is spice"; the client port's 1 in 31 is the game's own.)

### The swap rule (the heart of it)
Two linked pieces swap only if the **lower one "beats" the upper one**, rock-paper-scissors style:

```
  K           w           b         upper over lower: these three pairs swap,
    w           b           K       and only these
  (white      (brown      (black
   rises       rises       rises
   past black) past white) past brown)
```
- A **white rises through blacks** and **sinks through browns**.
- A **brown rises through whites** and **sinks through blacks**.
- A **black rises through browns** and **sinks through whites**.
- Same colours never swap; spice never swaps. **No swap can be undone straight away** (the pair is now
  the wrong way round), which is what makes it a puzzle.
- Every swap moves a piece one column sideways and half a row up or down. So a lone piece in a sea of one
  colour can only go one way: diagonally up (or down), left or right. A brown in whites rises; a black in
  whites sinks. Going level needs a second colour (the crawl, section 3).
- In the game, the links that can swap are drawn: each piece lights the corner facing every neighbour it
  could swap with, so little khaki "bridges" show between swappable pairs.

### Moving
- **Click** a piece, then **click** a linked neighbour: they swap (150 ms animation).
- **Drag**: press on a piece and drag it over a path of legal swaps; it keeps swapping as long as the
  mouse crosses pieces it can swap with. Too fast or too sloppy and it stops; overshoot and you've made a
  swap you can't take back. Experts only drag.
- Keys: arrows or number pad move a cursor one hex, Space swaps, **X or right-click burns the column now**.
- Input pauses while the board slides after a burn (900 ms).

### The furnace: columns leaving
- The furnace **ticks every 306 ms**; at tick 50 (**15.3 seconds**) the rightmost column leaves. A warning
  sound plays at tick 40, about 3 seconds before. A burn waits for any swap still moving.
- **Right-click (or X) burns at once**, whatever the timer, and restarts it. This is how fast players
  play: the timer is only the slowest pace. (The user's own Distilling Simulator was built around
  "control over when columns are burnt".)
- The rightmost column goes **up into the batch** or **down into the furnace**; everything slides one
  column right and a new random column comes in on the left.

### Which way a column goes
Add up its weights: whites (and burnt whites) -1, blacks +1, browns and spice 0.
- **Total 0 or less: up into the batch.** That includes an equal number of whites and blacks, and a
  column of **only browns** (a "pure brown", the classic accident: it goes up and spoils a chain).
- **More blacks than whites: down into the furnace.** So every junk column you mean to burn needs at
  least one black more than it has whites.

### Burnt whites
Whites that go into the furnace roll back out along the trough at the bottom, scorched. For **every two
whites burned** (counted across the whole session), the next white the game makes becomes a **burnt
white**. The 1st burned white makes nothing, the 2nd makes one burnt white, the 3rd nothing, and so on.
A burnt white moves and weighs like a white but scores -3 and spoils a Crystal Clear. One guide reckons
burning a white costs you about three whites in all.

### Spice
Spice never moves, so pieces boxed in by spices and the board's top or bottom edge can be **stuck for
good** (the game makes no check for this). Spice sent up scores +3 and shows "Spicy!"; a spice in a
column that burns is **wasted, -3**, "Wasted Spice". A spice does not stop a column being Crystal Clear.

### What each column scores, and its message
Only columns sent up score. Points = the sum of the piece values above, plus the chain bonus.

| Column sent up | Message |
|---|---|
| only whites (and spice) | **"Crystal clear!"** with the chain count beside it from the 2nd: "Crystal clear!²", "³"... |
| no blacks, more whites than browns | **"Smooooooth"** |
| as many blacks as whites | **"Blecch!"** |
| anything else that goes up (e.g. pure brown) | no message |
| a column that burns with whites in it | **"Burnt!"** (drifts down) |
| plus, if it had spice | **"Spicy!"** (orange) or **"Wasted Spice"** if it burned |

**Crystal Clear chain bonus:** each Crystal Clear scores **+4 for every Crystal Clear straight before it**
in the chain (the 2nd +4, the 3rd +8 ... the 12th +44). Any column that isn't Crystal Clear, sent up or
burned, breaks the chain. Players write a chain of 12 as **CC^12** (or CC12).

### The end of a session
- The flask fills as pieces go up: the session ends once **100 pieces** are in it, which is the 12th column
  sent up (YPPedia says "twelve columns"; same thing, since 12 columns hold about 102).
- **Except:** if that column was the **12th Crystal Clear in a row or more**, it carries on until a
  column that isn't Crystal Clear leaves (up or down), so CC^13, CC^14... are possible. That only
  happens from CC^12; a CC^10 then a CC^2 ends normally. (Added 12 Dec 2007; before, it always stopped.)
- You can **dismiss** (quit) any time and keep what you've sent up. No overall time limit, and time does
  not affect the score. Abandoning after moving pieces costs standing (since July 2007).

### The session's score and ratings
- **Session score = total points / number of columns sent up** (YPPedia; the client port's simulator
  shows the same). So a short brilliant chain beats it with a weaker run added: CC^8 then CC^4 averages
  less than CC^8 alone, which is why players **dismiss as soon as a chain ends** (unless they're at
  CC^12, which ends the session anyway).
- The game turns that into a duty-report rating on the server, by comparing it with other players'
  scores: **Booched, Poor, Fine, Good, Excellent, Incredible** (greenies see "Learning" for the bottom
  two), plus the labour grade **basic, skilled or expert**. The thresholds were never published.
- Over many sessions that becomes your **standing**: Able, Proficient, Distinguished, Respected, Master,
  Renowned, Grand-Master, Legendary, Ultimate (and #1 on the ocean).
- "Crystal clear" is the best **column**, not a session rating: the goal "crystal clear 12" is a CC^12.

### What ruins a batch
Sending up blacks or burnt whites; burning whites (each pair becomes a burnt white later); a pure-brown
column sneaking up and breaking the chain; wasting spice; a spice trap (a spice with junk stuck behind
it in a column you need clear); and starting the chain before the board can feed it to 12.

### Where sources disagree or are unclear
- Spice odds: 1 in 31 (client port) vs "1-30, 30 is spice" (Ryuken's guide). Going with 1 in 31.
- Rating thresholds and how the server rates a score: unknown. **(to confirm with the user:** what
  scores or chains gave Excellent and Incredible?)
- YPPedia's older text says the timer is "every few seconds"; the client's is 15.3 s. Was it ever faster,
  or did it change with standing? **(to confirm with the user)**

## 2. How it looks

The whole puzzle panel is **450 x 600**, portrait.
- **Top strip (about 135 px):** the title "Distilling" in gold lettering with a dark outline, top
  centre; behind it the shop: a pirate distiller on the left by barrels, a brass **pot still** (a tall
  polished cylinder with a domed lid and a tap), and to its right the **flask**, a glass cylinder (42 x
  75 at 235, 55) with dark metal caps, tick marks up its right side and a white line marking the level. A
  brass pipe runs from it to the right and down a chute at the board's top-right corner: columns sent
  up rise into it.
- **The flask's liquid** rises with pieces sent up (full at 100) and is golden-yellow (hue about 49
  degrees); the purer the batch, the paler and more see-through: all whites look nearly clear, blacks
  make it dark and murky olive.
- **The board (425 x 465 at 25, 135):** a dark brown, slightly burnished background, lighter and more
  olive-gold in the middle, framed by thin double brass/olive lines. Pieces are **40 px glossy spheres**
  with a dark outline and a highlight top-left; columns 40 px apart, the top row 23 px down, short
  columns 20 px lower.
  - white: pale cream-yellow; brown: rich amber gold; black: dark olive grey-green; spice: bright orange
    with a darker red-orange swirl like an ember; burnt white: a dull, mottled khaki-brown white.
  - Links: each piece lights the quarter facing every neighbour it can swap with, so small khaki-olive
    nubs bridge swappable pairs.
  - The selected piece glows, with **red corner brackets** round it (the cursor).
- **Bottom (about 66 px):** at bottom-right the **furnace**, an iron box with a grille (109 x 66); its
  glow rises from the bottom as the burn nears (orange slots lit) and is full just before a burn. To its
  left a long **copper trough** along the bottom edge: burned whites drop in and roll back left in it,
  turning burnt.
- **Animations:** swaps slide 150 ms; a leaving column's pieces glide up off the top into the pipe, or
  down into the furnace (0.4 px/ms); then the whole board slides right over 900 ms. Messages float up in
  the centre of the board, 30 px over 1.5 s, fading in the second half ("Burnt!" and "Wasted Spice"
  drift down). "Finished!" holds the board when the flask is full.
- **Sounds** (the port has them): swap up, swap down, burn warning, burn, burnt, crystal clear (two),
  smooth, blecch (two), spicy, finished.

## 3. The techniques, step by step

### The physics, in one line each
In **whites**: browns rise, blacks sink. In **blacks**: whites rise, browns sink. In **browns**: blacks
rise, whites sink. A lone piece always moves diagonally; it travels level only with a partner.

### The two stages
Every good game has the same shape (Fullbeard University's "Intro, Bridge, Finish"; Nickbush's "Stage I:
burn, baby, burn" and "Stage II: all good rum goes to heaven"):
1. **Stage I, burn the junk:** get all the whites over to the **left**, all the browns and blacks to the
   **right**, and burn full columns of junk, never a white. Whites pile up on the board as a big block.
2. **Decision time:** when the next junk column can't be finished before it burns, switch.
3. **Stage II, the chain:** now send up only pure white columns, one after another, while every new
   column from the left brings about 3 whites that must be ferried right to top up the block. Every
   column that leaves must be Crystal Clear, so no more junk can burn: it piles up on the left.

### Stage I, opening: rescue the whites
The rightmost three columns burn first, so save the whites there first, moving them left, or think of
it as pushing junk right in small moves. **Build evenly:** finish one junk column before starting the
next. The starting all-black column is a gift: its blacks can be pulled back into the board (they make
the "black tips" below) rather than just burned.

### Sort the junk: blacks to the top, browns to the bottom
In the junk on the right, a black and a brown swap whenever the black is below, so junk sorts itself:
**blacks rise, browns sink** (Nickbush's "Mode III"). Keep it that way on purpose:
- **Black tips:** top every junk column with a black. A column with a black at the top and the rest brown
  still burns (more blacks than whites), and it can never become a pure brown that floats up.

### Store blacks top-left, browns bottom-left: crossing the river in one drag
Once the whites are a wide "river" in the middle, junk caught on the left has to cross it. A black sinks
through whites, so a black kept at the **top** of the left side can be dragged in one straight diagonal
**down-right** across the whole river (it has 16 half-rows to fall). A brown rises through whites, so a
brown kept at the **bottom** crosses **up-right** the same way. A brown left high, or a black left low,
gets stuck against the edge ("blacks get stuck at the bottom, browns at the top").

```
  K . . . . . . . . . .      black stored top-left: one drag down-right
    \                        through the whites ...
      \ . . . . . . . junk   ... reaches the bottom of the junk pile
        \ . . . . . . junk
  . . . . \ . . . . / junk   brown stored bottom-left: one drag
          / . . . .          up-right through the whites
  b . . /
```

### The hook (the user's technique)
In the user's words: "if you drag the opposite colour all the way from the top left to the bottom white,
you can kind of hook it in and then re-drag the brown back to the bottom." Reading it with the rules: a
black dragged from the top-left falls diagonally to the bottom; there it meets a brown, and the black
rises past the brown (they swap: the brown drops), so the black hooks into the junk and the brown is
pushed back down, to be dragged on along the bottom again. **(to confirm with the user:** the exact
order of the drags, and which brown gets re-dragged.) As built for the bots (12 Nov, `hook` in
`src/distill-routines.ts`): a black dragged down through the whites hooks up past a brown, then the brown
is dragged on; and in the chain, a piece trapped on the whites' edge is freed with two partners, one
hooked in beside it.

### The crawl ("figure of eight"?)
A black and a brown together can travel **level** through whites forever, leapfrogging: the black climbs
into the brown then falls into a white; the brown climbs into a white then falls into the black. Six
swaps move the pair two columns (three swaps a column). Checked by brute force on the rules:

```
  w   w   w      w   w   w      w   w   w      w   w   w      w   w   w      w   w   w      w   w   w
w   b   w      w   K   w      w   w   w      w   b   w      w   K   w      w   K   b      w   w   b
  K   w   w      b   w   w      b   K   w      w   K   w      w   b   w      w   w   w      w   K   w
start          1: K up        2: K down      3: b up        4: b down      5: b up        6: K down
               through b      through w      through w      through K      through w      through w
```
As drags: the black up-right then down-right (one drag); the brown up-right, down-right (past the
black, which pops back up-left) and up-right (one drag); the black down-right, and round again. Taking
turns, the pair weaves round each other, a figure-of-eight path. The same works for
any pair in a sea of the third colour: **a white and a brown through blacks, a white and a black through
browns** (also checked), which is how whites cross junk in Stage II. Ryuken calls it **crawling**;
dragging a whole row of one colour along with a single partner is a **row** or **train**. Ryuken's
"accelerated crawling" keeps a spare partner piece waiting at the board's edge. **(to confirm with the
user:** is this your figure of eight, or the drills' "butterfly"?)

### The user's own account of the techniques (12 Nov)
- **The figure of eight is late-game, for moving pieces up and down:** "a way of getting a piece up and
  down the board when it's mostly white. So you kind of have ... a black and a brown piece, and you kind
  of loop them around in a figure of eight, and you can drag ... a pair of pieces up and down, vertically
  up and down. I think it's like a relatively late game thing where you've got an almost [white] board
  and only the occasional piece, and you've kind of got to do them together."
- **Pulling a line up:** "you can also do it for like a line of pieces, so you can have like one black
  piece at the front, and you kind of pull a line of brown things up, which makes it end up at the
  bottom. And then with just the trailing brown, you can bring the black up again, bring it to the start
  of the line ... and then repeat the process to keep pulling it up one tile at a time."
  As built (12 Nov, after the fifth and sixth notes, `linePull`, labelled "Pull a line of browns"): with a
  brown beside the black, the pair crawls up past the line, every brown of it ending lower, and loops round
  until the black has a brown above it to climb again (`pairPass`: the black and the brown dragged in turn,
  the fewest drags and swaps that do it, by the rules). With no brown beside it, one black climbs up
  through the browns and loops back through the whites to park beside them (the fifth note). Each pass
  is one move; the planner plays it again while it keeps bettering the board.
- **Going sideways is mid-game, while there are plenty of pieces:** the leapfrog "happens, I think, more
  mid-game, so it depends on how many pieces you've got left ... that relies on, for example, you keep
  three brown pieces at the top or bottom, and then drag a black along each one. But again, that relies on
  having a lot of pieces hanging around."
- **The hook is for when pieces get scarce:** "the hook stuff comes in more, I think, when things get
  more scarce."
- **Smooth over the frustrations:** "certainly make it smooth. I want this enjoyable." So drags don't stop
  on a slightly sloppy path where the intent is clear, and no column-shift glitch.
So the techniques by stage: early, sort the junk (whites left, blacks top, browns bottom); mid-game, with
plenty of pieces, travel sideways by leapfrogging along a stored row; late, on a nearly white board, the
figure of eight for pairs up and down, the line pulled up a tile at a time, and the hook when pieces are
scarce. The bots play by stage the same way.

**Watching the first bots (12 Nov), the user's own plan for a run:** the bot "just went down and burnt"
a white ("you would never leave a white piece in the top"): "fine, you might be swapping quickly, but
you're not following the strategy of [whites] to the left, clearing ... roughly one column at a time to
give yourself breathing room." And the shape to keep: "blacks ... you want on the right-hand side, when
you're getting whites to the left, you want browns near the bottom because then from the left you drag a
black from the top left down to the bottom right, up through the browns on the right-hand side, and you
kind of drag it up through the browns until it [meets] the black at the top. So you end up in a situation
where the top right is black, the bottom right is brown in a kind of an almost diamond shape, and then
when you get later, you kind of do the mirror effect of that, trying to get whites to the right when
you've run out of stuff to do." So, for the bots and the tutorial:
- **Never burn a white:** whites near the top of a burning column are saved first.
- **One column at a time:** finish the next junk column for the furnace before starting another, for
  breathing room, whites always heading left.
- **The diamond:** blacks stored top-right, browns bottom-right. A black taken from the top-left goes
  down-right across the whites to the bottom-right, then up through the browns (blacks rise in browns)
  till it joins the blacks at the top: so the junk columns on the right fill black above, brown below.
- **Then the mirror:** later, with the junk run out, the same moves the other way round, whites heading
  right.

**A technique is one smooth drag, not little swaps (12 Nov):** watching the bot, "I can see it's doing
individual few swaps, but the whole point is everything's like one smooth motion. Like a human doesn't have
time for those little swaps. That's very bot-like. A real player is like moving [browns] left, top, bottom,
left, top, right ... just like zooming them along, but in one smooth, like one operation. That's the point of
these techniques, is then it creates a way of doing things quickly and consistently." So a routine is played
as one long drag (the piece held and swept along its whole path, a swap at each step as the mouse passes),
or a pair's few drags in quick succession, never a pause and a fresh click per swap; the bots' pace counts
drags, and a drag's swaps come at a hand's speed, and the tutorial shows each technique as that one sweep.

**Skill is the techniques, not the strategy (12 Nov):** "The different skill levels [are] about the
techniques as much as anything ... I don't think any technique would say start burning immediately. It's
always whites to the left. There's no reason to do any other strategy." So every tier, the learner too,
plays the same plan (whites left, junk right, never a white burnt on purpose); a beginner only does less
of it ("might start trying to like just burn one or two white columns"), and the tiers differ in which
techniques they can pull off and how fast. **Whites stuck at the top are rescued by the crawl:** "if
you've just got whites stuck at the top of the screen, that's where you need to kind of crawl things along
with white, browns and blacks working together. Because if you have a brown at the top next to two whites,
it does nothing. If you have a black next to it, all of a sudden they can work together and they can crawl
along." A lone brown among whites at the top can't move (browns rise in whites: it's already up); a black
and a brown together can, so the rescue brings a black up beside the brown and crawls the pair along,
carrying the whites their way.

### What each technique costs (12 Nov, measured)
The user (the seventh note): "rank each of the techniques as to how move efficient they are, and therefore
... which one you resort to depends on what options and what stage you're at"; and in a person's time, not
swaps: "one smooth mouse motion is cheap. It's quick." Measured from the Ultimate's 40 sessions
(`tools/distill-bots.mjs`, its pace: 250 ms to spot and pick up a drag, 6 swaps a second along it, 60 ms a
turn), in Stage I, its time for each column a piece of junk was got across, cheapest first:

| Technique | ms a column of junk across | What it's for |
|---|---|---|
| The sweep (one long plain drag) | 279 | the opening, and while four or more pieces can still be dragged straight over |
| Finish the junk column | 357 | the last whites out of the furnace's column, a black on top |
| Save the whites | 374 | a white in a column about to burn |
| Other diamond runs (another piece brought in first) | 419 | a piece with no way over alone |
| The crawl | 456 | a stuck pair, once plain drags stop getting much over |
| The hook | 616 | junk trapped on an edge, pieces scarce |
| The leapfrog | 674 | sideways along a stored row |
| The turn-over, storing, the figure of eight, the line pull | no junk across: they sort it | only once colour is scarce (40% of the board or less) or three junk columns are left |

So the planner plays the sweep while it works, then the cheaper techniques, and the sorting ones last. (Since
the eleventh note this ranking isn't written into the planner: it falls out of the board score below.)

### The board score (12 Nov, the eleventh to fourteenth notes)
The user: "the scoring should just be as simple as like how many whites have moved to the left, how many other
pieces have moved to the right. For burning, and it's bonus for completing columns ... Like completed brown
black columns with no whites in on the right, good." Built as `boardScore` in `src/distill-score.ts`:
- **Whites left, junk right:** each white scores the columns to its right, each brown, black or burnt white the
  columns to its left. A swap carrying junk right past a white is +2; two pieces of junk swapped (a black up
  through the browns, sorting) is 0; junk back left is -2.
- **Junk columns done, from the right:** +8 for each column with no white that's sure to burn (a pure brown
  isn't), counted from the furnace's column in and stopping at the first that isn't done.
- **Junk trapped in the whites:** -2 for a brown or a black with whites on its right that no swap takes right
  (a black on the bottom of the whites, a brown on the top). Added after a look at the bots: without it the
  white block went into the chain full of these.
- **A white behind spice:** -12 for a white on the top or bottom of its column with a spice just inside it (the
  thirteenth note: free it before the board slides and walls it in).
- **The wall:** -0.5 for each place a white meets junk, so the whites stay one block behind an upright wall,
  not cut by a line of colour (the fourteenth note's zigzag).

In Stage I the bots judge every move they could make, a plain drag or a technique alike, by the score of the
board it leaves, a second of a person's time (a pause to spot each drag, a sweep's shorter one for one long
plain drag all one way across, its swaps at a hand's speed, a little for each turn); one look ahead, no search
("I'm not saying implement them because they're expensive, but even just as a test of moves"). A drag is let go
where that's best: on while each swap still gets something over, never on up through the junk for nothing. So a
plain drag beats a crawl that gets the same junk over, and a black dragged up gets nothing. The planner's stand-
ins for judging the board are gone (the sweeping phase, "plain drags first", the turn-over played next, the
second look with colour taken as scarce, the ground-given-back charge); the routines themselves still offer the
turn-over, the line pull, storing and the long ways round only once colour's scarce, which keeps the look ahead
cheap. Sorting the junk scores nothing, so the turn-over is now rarely played. The chain (Stage II) is still
weighed by the old `measure`, whites heading right.

**The simpler score (13 Nov, the eighteenth note), as built now** (`boardScore`, replacing the list above; the
weights are `S` in `src/distill-score.ts`):
- **First, the columns filled on the right:** +15 for each junk column done (no white, sure to burn), counted from
  the furnace in; +1 for each piece of junk in the column being filled (the first not done), +0.5 in the one left
  of it. The last piece that finishes a column is the bonus.
- **Colour pulled right:** +0.5 for each column a piece of junk is further right ("you just want to pull things
  from the left to the right"). No credit for whites going left: "forget about dragging whites to the left".
- **Second, the wall, once it's formed:** each row (the y-th piece of every column) has its own best split, whites
  left of it and colour right; it has formed once at most one piece of the row is on the wrong side. The straight
  wall is the one upright split of the whole board with fewest on the wrong side. -1 for each column a formed
  row's split stands off it. On the opening's mixed board no row has formed, so it counts nothing.
- **Nothing trapped:** -3 for a white trapped (`trappedWhite`: no swap taking it left, junk left of it in its
  row, on the colour's side of the straight wall, and on the top or bottom edge of a tall column, or lower down
  with junk on both its left), counted in the column being filled and the two left of it, next to burn; -1 for
  junk trapped in the whites (as before); -12 for a white behind spice (as before). The seams term is gone, the
  wall standing in for it. Whites boxed in further left aren't counted: tried on the whole board, the bots carried
  whites back right just to give them a way out.
- **The brown sweep waits (the user, 13 Nov, watching the bots: "the way that [the bot's] sweeping browns up back
  down to the bottom right is right now is very good. But it's just like it leaves one or two trapped whites ...
  it's being applied a bit too quickly before those columns have been cleared"):** a brown taken up through the
  whites and back down through the blacks (`brownSweep`) is played as before, but while whites are left in the
  junk columns next to burn (`whitesInJunk`, the columns more junk than white from the one before the column
  being built), only when it takes one of them out. Clearing those columns comes first.
- The planner's thresholds scaled to it: a move must gain 0.15 a second (was 0.5), and a ready column burns at
  once unless a move gains 1 a second (was 3).

**Why the first move trapped a white (13 Nov):** the old score had no term for a trapped white at all (its
"trapped" was junk among the whites, and the white behind spice), and every swap of a white left past junk was +2.
On the test page's first board (seed 1) the rescue took the white from the second column from the right up-left
twice, each swap +2, to the top of column 7, where its only way left was the white below it: stuck until a brown
comes under it. Now that second swap costs 3 more than it gains, and the rescue stops after one swap, where the
white can still go on up-left into a black.

### Bringing a piece round: the path search (13 Nov, the eighteenth note)
"Find the path of a piece that could take that white's place. But obviously that pathfinding can involve loops."
Built as `src/distill-path.ts`: a piece is **stuck** (`stuck`) when it can't go its way: in Stage I a trapped white
(above), junk trapped in the whites, or a white in a column about to burn with no way left; in the chain, junk in a
column still to go up with no way left. `bringRound` searches, A\*, for the one drag of some other piece, cheapest
in a person's time (a moment to pick it up, 6 swaps a second along it, 60 ms a turn), along legal swaps and
ending in a swap with the stuck piece that sends it its way. Each board the drag leaves is a node, so the same
square with the board changed behind it is a new one, and loops come out of it; the heuristic is the squares
still to go. At most 12 swaps and 2,500 boards a stuck piece, four stuck pieces a move: about 2 ms a board in
Node. On the user's board it finds their move exactly: the brown below-right of the trapped white up-left,
up-left through the whites, and up-right into its place, the white dropping out left.

The planner offers it as a fallback (`weigh`): only for a stuck piece that's still stuck after every move the
routines it knows offer, and then its move is judged like the rest. The Able to Master and up, and Helium, know
it (`path` on a tier); its label is "Bring a piece round". For anyone keyed by the routines' names the advice
names the hook, the nearest named technique, with `technique: 'path'` beside it; "Help, Helium" looks that up for
their own line, "Shift that one first. Then there's a way through." (13 Nov).

**Moving one piece to open the way (13 Nov, the nineteenth note).** When no single drag brings a piece into a
white's place in the junk columns next to burn, `openWay` tries one piece moved out of the way first: every
piece within four squares of the white, dragged one or two swaps, the cheapest 80 of those boards, each searched
on with 300 boards; the pair played together, costed as a person's two drags (two moments to spot, their swaps
and turns). About 10 to 25 ms a stuck white in Node, and only when the single search found nothing. On the user's
board (`37-move-a-brown-to-open-the-path.webp`, read off the picture) it finds their move: the brown low in the
middle moved up a swap, then the black left of it dragged along the bottom, right and up, into the white's place
at the bottom right. The planner weighs the pair like any move: with sweeping still to do it waits, and it's
played as the furnace nears (the urgent look takes only what saves the furnace's column).

**Whites in the furnace's column cost more (13 Nov, from the same note).** Watching why the bots still waited
with whites left: every way out of the furnace's column put the white boxed in one column left (-3, trapped),
while leaving it to burn cost only the one piece of junk it kept out (-1), so waiting scored best and it burned.
Now each white in the furnace's column, while it's a junk column being filled, costs 4 more (`S.FIRE`); only
that column, so finishing it never moves the cost onto the next (tried on the column being filled, wherever it
was, the bots stopped finishing columns).

### The pair rescue: junk stuck on the edge of a column going up (13 Nov)
The user, on a board in the chain, the furnace's column all white but a brown at its top: "this is absolute danger
mode ... the first thing I would be doing here is just rescuing that brown piece, because that gives you your crystal
clear 2 or 3 easily here. You got a brown piece there, look, that can move up, and then a black that can hop along the
top, and you'd rescue the brown piece. You'd then be able to pull it back ... there was lots of time to rescue it even
before now." A brown on the top of a column of whites can't move (browns rise in whites: it's already up), and a black
can't travel along the top on its own (blacks sink in whites); it needs a brown up there first to climb. So no one
drag frees it. Built as `pairRescue` (src/distill-path.ts): the cheapest plan, in a person's time, of up to four
drags that leaves less junk in that column and the columns after it still to go up, and none pushed on into the next
one (`freed`). Each step is a piece of the column's junk going out left on its own, or a piece brought round into a
stuck one's place (the path search's one drag), either after a piece near it is moved first to open the way (up to
three swaps). On the user's board (`STUCK_ON_TOP` in src/distill-guide.ts) it finds their move: the brown below the
black lifted up to the top row; the black down into a white and up past it, down and up past the stuck brown, which
drops out left; a white slid in past the freed brown; and the black sinks out after it. Upside down, the colours
swapped, the same for a black stuck at the bottom, a brown brought along the bottom (tested). About 20 ms a search in
Node, its result kept while the board's unchanged.

**Urgent, and early.** In the chain, the column being filled and the one after it (`chainZones`), while mostly white
with a piece of junk in it that can't go left, are a danger zone like a white by the fire: only moves that free it
(`freed`) are offered, from the first look, ahead of anything easy elsewhere, the pair rescue's plan weighed among
them (the hook's own way out, from CC^5, often wins on worth, taking the piece further left). Saving a white from the
junk columns burning out ahead of the chain still comes first. Every level plays it
(it rides on the path search, which every level has); its label is "The pair rescue", its technique 'path' for
Helium's lines. `P.PAIR` switches it off.

### Decision time
Keep burning full junk columns as long as you're sure the next one will be finished before the furnace;
the more white columns you bank, the longer the chain. Near the end there's less room on the right to
shuffle blacks and browns, so the last junk columns are the hardest. The **"half push"**: when too few
junk pieces are left to make a whole column, push them to the middle and leave them.

### Stage II: channels to the top-right and bottom-right
Now the whites must go right, through the junk piling up on the left. A white rises through blacks and
sinks through browns, so arrange the junk into **channels**: a diagonal line of blacks running up-right
lets a white climb all the way to the **top-right**; a line of browns running down-right lets it slide
down to the **bottom-right**. The block of whites on the right is topped up from both corners. A
channel survives being used, shifted one step down-left (checked):

```
b   b   b   b    b   b   b   b    b   b   b   b    b   b   b   b    b   b   b   b
  b   b   K        b   b   K        b   b   K        b   b   K        b   b   w
b   b   K   b    b   b   K   b    b   b   K   b    b   b   w   b    b   b   K   b
  b   K   b        b   K   b        b   w   b        b   K   b        b   K   b
b   K   b   b    b   w   b   b    b   K   b   b    b   K   b   b    b   K   b   b
  w   b   b        K   b   b        K   b   b        K   b   b        K   b   b
start            1                2                3                4: the white is top-right
```
Fill each Crystal Clear column completely before starting the next. Rescue a stuck white at once, if need
be by borrowing one from a finished column.

### Spice
- Before a spice becomes a wall, flush the junk behind it: blacks behind a spice wall at the bottom,
  browns behind one at the top, while they can still get out.
- **Spice trap:** a spice with junk stuck behind it in a column that would go up mid-chain. Never send it
  up (it can cost 7 or 8 whites); **"drown" it**: let that column burn, even with a white or two.
- Spice in a white column is a bonus: +3 instead of +1, and it's still Crystal Clear. Experts go for
  CC^12 with the most spice and the least wasted.

### The endgame's gamble (the user, 12 Nov)
"The difference between even a legendary, ultimate, whatever, like the CC10 and the CC12 ... it's almost
like it becomes like a game of Russian roulette. Like ... you've got a column of 8 whites on the right-hand
side. When the new column appears on the left where there were 2 whites, and you have to get them over as
fast as you can, and it's like, oh, do I risk burning a thing to try and chase that next thing that will
set me up for a longer CC without ruining my entire game?" So past about CC^10 it's no longer skill alone:
each new column is a bet, ferry its whites right in time or not, and a burn there ends the chain. For the
bots: the top tiers take that bet the way a player would (chase the chain while the odds are fair, cash in
when they're not), so a tier's CC^12 rate is a probability, and the goals are set from it ("reached CC^12
in 1 run of 4"), not a promise. For Helium: their advice at that point is the bet, plainly put.

### Burn timing
Right-click to burn as soon as the right column is ready: in Stage I, as soon as the junk column is
complete; in Stage II, as soon as the next white column is full. A fast game (under 3.5 minutes) is
almost all early burns. In Stage II don't burn a column you can't fill in time.

### Choosing boards, and when to stop
Look at the starting board: beginners abandon boards with more than 5 whites in the rightmost three
columns (hard to save); experts abandon boards with many spices. When a chain ends below CC^12,
dismiss. (Abandoning at the start, before moving, is free; the real game counts a session once a piece
is touched or a column burned.)

### Names from the practice drills (to fill in)
The practice site's drills (from a Python "Distilling_Sim") name more moves, worth asking about: two-
and three-colour swaps; "staircase" (browns or blacks above or below, a white through a staircase,
"reverse staircase", "staircase over spices"); "unboxing"; "save the corners!"; "crawling",
"butterfly" and the two combined; "horizontal drag"; "classic noob stuck"; "raking the top", "raking
the bottom"; "multiple brown crawl", "multiple black crawl"; "crawl under spices"; "rescuing stuck
pieces", "evening board"; endgames; midgames by how much junk is left ("35 junk", Master; "18 junk",
Grand-Master); and burn play: "finish burn", "crawling a burn", "walking the dog", "moving a burn
up/down", "corner burns", "moving a burn wall", "walking the pack", and spice traps at different flask
levels. **(to confirm with the user:** which of these you used, and how.)

## 4. Ratings and target numbers

### Worked scores (session score = points per column sent up)
| Session | Points | Per column |
|---|---|---|
| CC^12, no spice (102 whites + bonus 4 x (0+1+...+11) = 264) | 366 | **30.5** |
| CC^12 with 3 spices sent up (each +2 over a white) | 372 | 31.0 |
| CC^8 then dismiss (68 + 112) | 180 | **22.5** |
| CC^8 then CC^4 (180 + 34 + 24) | 238 | 19.8 |
| 12 separate Crystal Clears, never two in a row | 102 | 8.5 |
| 12 "Smooooooth" columns (say 6 whites, 2 browns) | 72 | 6 |

### How good is good: whites banked before the chain
The best measure (Nickbush's tutorial) is how many full **white columns** are on the board when the first
one goes up, since every column after that must be white and each new column brings only about 3:
| White columns on the board | Chains (only Legendary's is the tutorial's; the rest my estimates) | Standing |
|---|---|---|
| about 6 | CC^6 to CC^8 | Master / Renowned |
| about 7 | CC^9 to CC^10 | Grand-Master |
| 7.5 to 8 | CC^10 to CC^11, the odd CC^12 | Legendary |
| 8 to 8.5, every game | CC^12 often | Ultimate |
| 8.5 to 9 | | a shot at #1 on the ocean |

The practice drills measure the same thing the other way round, by junk left on the board: their
"Master" midgame has 35 junk pieces (about 6 columns of whites), their "Grand-Master" one 18 (nearer 7.5).

Why 8 is the magic number: 8 columns hold about 68 whites; a CC^12 needs about 102, so the next 12 columns
must bring 34 whites, which is just what 12 new columns bring on average (2.8 each). Ryuken's tiers match:
basic play is CC^5 and below, skilled CC^6+, expert CC^9+.

### Speed
- By my reckoning a CC^12 session is about **30 columns** (about 20 junk columns burned, then the 12
  up), so at the furnace's own pace roughly **8 minutes**, which matches YPPedia's "slow game".
- Experts finish a CC^12 in **under 3.5 minutes** by burning early: so roughly 7 seconds a column.
- Top distillers get CC^12 or better **more than half the time**.
- Swaps take 150 ms, so a dragged piece moves at most about 6 swaps a second.
- No source gives moves per minute for top players. **(to confirm with the user:** your own pace, and
  what time you'd set as a target.)

### Suggested bot and goal tiers (a starting point, to tune)
(Since 13 Nov the bots aren't named by these tiers: each is its target chain, CC^1 to CC^8, the twelfth run below.
The table stays as the real game's standings.)

| Tier | Whites banked | Typical result | Burns |
|---|---|---|---|
| Learner | never burns a white | Smooooooth columns, odd CC | waits for the timer |
| Able to Master | 5 to 6 columns | CC^5 to CC^8, dismisses after | some early burns |
| Grand-Master to Legendary | 7 to 8 | CC^9 to CC^11 | mostly early |
| Ultimate | 8.5+ | CC^12+, with spice | under 3.5 minutes |

### What the bots reach (12 Nov, first run)
`tools/distill-bots.mjs 40`: each tier of `src/distill-bots.ts` on the same 40 seeded boards (seeds 5000
to 5039), at its own pace (swaps a second, and a moment to spot each drag), on the real furnace.

| Tier | Pace | Bank | Longest chain: mean (best) | CC^6+ | CC^12 | Score a column: mean (best) | Minutes a session | Whites burned |
|---|---|---|---|---|---|---|---|---|
| Learner | 2 swaps/s, timer only | none | 0.0 (1) | 0/40 | 0/40 | 1.3 (3.4) | 5.0 (flask full) | 14.0 |
| Able to Master | 3.5/s, burns early | 4 columns | 1.9 (5) | 0/40 | 0/40 | 8.6 (15.2) | 1.7 (dismissed) | 0.7 |
| Grand-Master to Legendary | 5/s, + pair moves | 4.5 | 2.4 (5) | 0/40 | 0/40 | 9.0 (14.7) | 1.8 | 1.0 |
| Ultimate | 6/s, + pair moves | 5 | 2.5 (6) | 3/40 | 0/40 | 8.9 (17.6) | 1.9 | 1.6 |

**Honestly: no bot gets near CC^12; the best reach CC^5 to CC^7 now and then, CC^2 typically.** So these
are not yet goals for a player: a real Master's CC^6 to CC^8 is beyond every tier. What they do well and
badly:
- **Stage I works.** Junk columns burn with almost no whites in them (under one white a session from the
  Master up), whites are banked, never a junk column floats up. 4 to 6 columns of whites are on the board
  when the chain starts.
- **Stage II is where they fail,** and not for speed: with unlimited swaps a second and the full 15.3 s a
  column, the Master's chains are still CC^2 on average (CC^6 once in 16). The white block they bank is
  dirty at its edges: browns that rose to its top and blacks that sank to its bottom while junk crossed it
  ("browns get stuck at the top, blacks at the bottom"), one in most columns, so only one or two columns
  in a row come out Crystal Clear, and the whites scattered in the junk on the left are rarely ferried
  across in time.
- **Why:** the bots play by a sense of the board (each piece pulled toward its zone: the junk columns to
  burn, the block of whites, the rest; blacks up and browns down; a way out kept open) and pick the best
  drag of one piece, or two pieces moved together (up to six swaps: the crawl, the figure of eight), or a
  drag that sets up the next. That's a hill-climb: it can't plan the long multi-drag techniques that clean
  a block (the line pulled up a tile at a time, the hook, leapfrogging along a stored row of browns), nor
  keep junk out of the block's edges from the start. Banking more doesn't help (the chain stays about
  CC^2 from a bank of 3.5 to 7 columns): the block's cleanliness is the limit, not its size.
- **Next, to make them real goals:** each technique as its own scripted routine (the crawl, the figure of
  eight, the line pull, the hook, the leapfrog, channels), which the tutorial needs anyway (§7, item 3),
  and a planner that picks a routine by the stage of the game and what's out of place, rather than the
  hill-climb choosing swaps.

### What the routine bots reach (12 Nov, second run)
Each technique is now a routine of its own (`src/distill-routines.ts`: save the whites, finish the junk
column, the diamond and its mirror, store the junk, the crawl, the figure of eight, pull a line up, the
leapfrog, the hook, channels), each knowing where it applies on any board and returning whole drags. A
planner (`choose` in `src/distill-bots.ts`) puts the stage's routines on the menu and plays the one that
betters the board most for its drags; `advise(board)` is the same planner on anyone's board, for "Help,
Helium". Every tier plays the same plan (whites left, never a white burned on purpose); they differ in the
routines they know (the learner only the four basic ones, the Master adds the crawl, storing and the
leapfrog, the Grand-Master the figure of eight and the hook, the Ultimate the line pull), their pace (a
moment to spot each drag, then swept at 4 to 6 swaps a second), and burning early. The top two take the
endgame's gamble: in the chain, with a few seconds left and the next column out of reach, cash in.
`tools/distill-bots.mjs 40`, the same 40 boards (seeds 5000 to 5039):

| Tier | Longest chain: mean (best), was | CC^6+ | CC^12 | Score a column: mean (best) | Minutes | Whites burned | White columns banked |
|---|---|---|---|---|---|---|---|
| Learner | 1.5 (4), was 0.0 (1) | 0/40 | 0/40 | 3.9 (6.2) | 5.6 (flask full) | 6.5 | 5.0 |
| Able to Master | 2.8 (6), was 1.9 (5) | 4/40 | 0/40 | 8.6 (16.3) | 3.3 | 1.6 | 6.8 |
| Grand-Master to Legendary | 2.7 (9), was 2.4 (5) | 4/40 | 0/40 | 9.5 (22.4) | 3.0 | 1.4 | 6.6 |
| Ultimate | 3.3 (9), was 2.5 (6) | 8/40 | 0/40 | 10.5 (22.8) | 3.0 | 1.4 | 6.5 |

**Honestly: better, but still far from the goals.** CC^12 is reached in no run of 40 by any tier (a rate of
0 in 40); the Ultimate reaches CC^6 or more one run in 5 and CC^9 once, where a real Master's CC^6 to
CC^8 is typical. Banking more (7 or 8 columns) made every tier worse, so all bank 6. What still holds them
back:
- **Junk trapped on the whites' edges.** Almost every chain breaks on a column of whites with one black on
  its bottom or one brown on its top. A black in whites only sinks and a brown only rises, so each piece of
  junk left in the white block ends on an edge, and there it can't move at all: a black on the bottom can
  only rise through a brown, and a brown can never get down to it through whites. They come from new
  columns (a black low on the left as whites close round it), and from the techniques themselves (every
  white ferried up through blacks pushes a black down; channels push browns up and blacks down).
- **What frees them is a three-piece job.** The hook as built frees some (a partner dragged down beside
  the trapped piece, a brown hooked in past it, then the crawl), but only with junk close by. Players keep
  the edges clean as they go ("store blacks top-left, browns bottom-left"); the bots don't plan far enough
  ahead to: the next step is a staircase of blacks down to the bottom for a brown to sink through, which
  the drills name ("staircase", "raking the top/bottom").
- **Speed isn't the limit:** the Master at three times its pace reaches the same chains. The techniques
  are: giving the Master every routine took its mean chain from 2.3 to 3.0 on 20 boards.
- The learner burns whites (6.5 a session) not by choice but by waiting on the furnace with too few
  techniques to rescue them in time, which is the beginner the user described.

### After the user's first notes (12 Nov, third run)
From the five notes above: every junk drag carries on as far as it goes (`carryOn`), never parked partway
into the whites; the diamond's drags go any way through (down and up through whites, the ladder up the
right side's browns, a brown over the top and down through the blacks), aiming for browns at the bottom
right and blacks at the top; the planner's phases are decided by the board: **the sweep** (plain long
drags taking junk over, blind, a fifth to a half of a technique's pause between them) while it gets junk
right, then **turning the right side over** (`turnOver`, blacks zigzagged up the side through the browns),
then everything else hooking in; the crawl crawls a side-by-side pair as drawn (two drags in turn, down,
up, down); the line pull is the drawn loop (one black up through the browns, each dropping a place, round
through the whites to park beside them again, one drag a pass). Same 40 boards:

| Tier | Longest chain: mean (best), was | CC^6+, was | CC^12 | Score a column, was | Minutes | Whites burned | Swaps a drag, was |
|---|---|---|---|---|---|---|---|
| Learner | 1.7 (4), was 1.5 (4) | 0/40, was 0 | 0/40 | 4.3, was 3.9 | 5.5 | 6.2 | 3.4, was 2.8 |
| Able to Master | 2.7 (6), was 2.8 (6) | 2/40, was 4 | 0/40 | 8.8, was 8.6 | 3.4 | 1.9 | 4.1, was 3.1 |
| Grand-Master to Legendary | 3.1 (7), was 2.7 (9) | 7/40, was 4 | 0/40 | 10.2, was 9.5 | 3.2 | 1.4 | 4.1, was 3.1 |
| Ultimate | 3.5 (8), was 3.3 (9) | 14/40, was 8 | 0/40 | 11.3, was 10.5 | 3.2 | 1.6 | 4.1, was 3.1 |

Drags are a third longer and the top tiers reach CC^6 more often (the Ultimate one run in 3), but the mean
chain barely moves and CC^12 is still 0 in 40: the chains still break on a black stuck on the bottom or a
brown on the top of a white column. Whether the line pull's loop frees the blacks stuck at the bottom (the fifth note's "we've got to
try and rescue them") isn't shown: the bots play it under once a session.

### After the sixth to tenth notes (12 Nov, fourth run)
The line pull played as the pair's crawl and loop (the sixth note); each technique costed in a person's
time (the tenth note's last bullet: a moment to spot each drag, its swaps at a hand's speed, a little for
each turn, and swaps that give ground back charged as lost progress); the plain drags counted first (the
ninth note: with four or more pieces a plain drag gets over, it's sweeping time and the slow techniques
wait); the slow techniques (the turn-over, the line pull, the ladder) and the sorting (storing, the
diamond's order) only once colour is scarce, 40% of the board or less, or the junk waiting on the right is
down to three columns (the seventh note and the tenth's last bullet), or when nothing cheaper gets anything
over; another piece brought in to make a way rather than a loop (the tenth note); colour on a diagonal
marked down against upright bands (the eighth note). Same 40 boards:

| Tier | Longest chain: mean (best), was | CC^6+, was | CC^12 | Score a column, was | Minutes | Whites burned |
|---|---|---|---|---|---|---|
| Learner | 1.4 (4), was 1.7 (4) | 0/40, was 0 | 0/40 | 3.7, was 4.3 | 5.7 | 7.4 |
| Able to Master | 2.4 (7), was 2.7 (6) | 3/40, was 2 | 0/40 | 8.0, was 8.8 | 3.2 | 1.9 |
| Grand-Master to Legendary | 2.9 (8), was 3.1 (7) | 7/40, was 7 | 0/40 | 9.5, was 10.2 | 3.0 | 1.8 |
| Ultimate | 2.9 (8), was 3.6 (8) | 6/40, was 14 | 0/40 | 9.9, was 11.3 | 2.7 | 1.7 |

How often each technique is played in Stage I, a session, while colour is plentiful (over 45%), middling, or
scarce (40% or less); the Ultimate's: the sweep 20.4 / 4.1 / 2.9, saving whites 14.9 / 2.7 / 0.8, the crawl
8.7 / 2.2 / 0.8, other diamond runs 7.7 / 0.9 / 0.2, the turn-over 3.7 / 0.6 / 0.6 (the plentiful ones when
nothing cheaper got anything over), storing 3.6 / 0.3 / 0.1, the leapfrog 0.3, the hook and the line pull
0.2 or less. The bots play faster (the Ultimate's sessions 2.7 minutes, were 3.2) and more as the user
describes, **but the chains are shorter, and honestly that's the gating:** with the same code but the
sorting and slow techniques allowed whenever they pay (`MEASURE='{"SORT_FROM":10,"SCARCE":1}'`), the
Ultimate's mean chain on 20 boards is 4.1 against 2.8 with colour counted scarce only at 30%, and 3.2 at 40%
(the setting kept), 3.6 at 45%. The bots bank about 6.5 columns of whites, so at decision time about 40% of
the board is still colour: by the user's rule it's never yet time to sort, and the white block goes into
the chain less tidy. A real player banks 8 and sorts in the last two or three columns; the bots can't yet
bank 8 without burning whites (§4 above). The upright-bands term changes little either way (2.7 without
it). The line pull is still too rare (0.2 a session) to say whether it frees the blacks stuck at the bottom.
**Left here for now (the user, 12 Nov):** "I think that's fine for now. Just obviously I watch what they
do and I'll feed back. That's probably going to be better than you brute force." So no more tuning by
running the bots over and over: the user watches them play on `distilling-test.html` and says what a
real player would do instead, and the routines change from that.

### Judged by the board score (12 Nov, fifth run)
After the eleventh to fourteenth notes, Stage I judged by the board score (§3, "The board score"), one look
ahead, the planner's stand-in rules dropped. Same 40 boards, run once before and once after:

| Tier | Longest chain: mean (best), was | CC^6+, was | CC^12 | Minutes, was | Whites burned, was | White columns banked, was |
|---|---|---|---|---|---|---|
| Learner | 1.7 (5), was 1.4 (4) | 0/40, was 0 | 0/40 | 6.0, was 5.7 | 6.5, was 7.4 | 5.3, was 4.9 |
| Able to Master | 1.1 (3), was 2.4 (7) | 0/40, was 3 | 0/40 | 3.1, was 3.2 | 2.3, was 1.9 | 5.9, was 6.5 |
| Grand-Master to Legendary | 1.6 (4), was 2.9 (8) | 0/40, was 7 | 0/40 | 2.7, was 3.0 | 2.2, was 1.8 | 5.8, was 6.7 |
| Ultimate | 1.8 (6), was 2.9 (8) | 1/40, was 6 | 0/40 | 2.8, was 2.7 | 1.9, was 1.7 | 5.7, was 6.7 |

- **What it fixed:** blacks go down early. Over the Ultimate's first four sessions, Stage I's drags of a black
  that ended higher than they began fell from 40 to 3 (130 went down, 172 before). The
  turn-over and storing are all but gone (0.1 a session, were 4 to 6), the sweep is played more (25 a session
  while colour's plentiful, was 20) and is cheaper a column of junk (204 ms, was 279).
- **What it cost, honestly:** the chains. Every tier but the learner chains shorter (the Ultimate 1.8, was 2.9;
  the Master 1.1, was 2.4), banks about a column less before the chain, and burns a few more whites. The old
  measure's terms for a clean white block (a black too low to cross, junk on the whites' edges, junk caught in
  the whites) did work the simple score doesn't yet; the trapped-junk and wall terms win back only part of it.
  Not tuned further (the user's cost rule): the next step is the user watching them on `distilling-test.html`,
  and likely a term for the white block's top and bottom edges kept clean.

### The simpler score, nothing trapped, the path search (13 Nov, sixth run)
After the eighteenth note (§3, "The simpler score", "Bringing a piece round"), and the user's note on the brown
sweep. 20 boards a tier (seeds 5000 on), the old code and the new run by the same runner. "Trapping moves" are
Stage I moves leaving more whites trapped than before them, by the score's test (no way left, cut off, on the
edge or boxed in by junk, in the three columns next to burn); the runner also counts a broader one, any white
anywhere with no way left and junk left of it, on the edge or boxed in.

| Tier | Longest chain: mean (best), was | Whites burned, was | Trapping moves a session, was (broader, was) | Brown sweeps leaving one trapped, was | Session score, was | Points a minute, was | Junk columns burned a minute of Stage I, was |
|---|---|---|---|---|---|---|---|
| Learner | 1.1 (2), was 1.6 (5) | 6.5, was 6.3 | 1.7, was 2.3 (3.7, was 3.0) | 0.1 of 1.9, was 0.3 of 2.9 | 4.2, was 4.8 | 9.0, was 9.9 | 3.8, was 3.8 |
| Able to Master | 1.1 (3), was 1.2 (3) | 0.8, was 1.8 | 2.4, was 3.9 (7.3, was 5.0) | 0.1 of 4.3, was 0.4 of 5.0 | 5.7, was 5.9 | 9.5, was 9.1 | 5.6, was 5.8 |
| Grand-Master to Legendary | 1.6 (5), was 1.3 (4) | 0.9, was 1.9 | 1.6, was 3.1 (8.1, was 4.8) | 0.1 of 3.8, was 0.5 of 3.7 | 7.2, was 6.0 | 15.2, was 11.0 | 6.0, was 6.3 |
| Ultimate | 2.0 (5), was 2.0 (6) | 0.9, was 1.1 | 1.9, was 4.0 (7.7, was 5.3) | 0.1 of 2.5, was 0.2 of 2.1 | 9.0, was 7.2 | 21.0, was 16.1 | 6.1, was 6.4 |

- **The first move:** on the test page's board (seed 1) no tier drags the white to the top any more; over seeds 1
  to 20, first moves leaving a white trapped on the edge fell from 3 or 4 of 20 a tier to 1 or 2 (seed 20's is a
  rescued white dropped to the bottom of column 5, far from the furnace, which the score doesn't count).
- **What it fixed:** trapping moves by the furnace halved for the three upper tiers, brown sweeps leaving a white
  trapped all but stopped, whites burned halved (the Master 1.8 to 0.8, the Grand-Master 1.9 to 0.9), and the
  session's points a minute rose a quarter for the top two tiers, at about the same pace burning junk.
- **What it didn't, honestly:** the chains are the same within the noise of 20 boards (the Ultimate 2.0 both,
  its best 5 against 6; the learner shorter, 1.1 against 1.6). The broader count of trapped whites went up for the
  upper tiers (about 8 a session against 5): with no credit for whites going left, whites further from the furnace
  are left boxed in more, which the score doesn't count (counting them everywhere had the bots carrying whites back
  right to free them). The path search is played about once a session (the upper tiers); most stuck pieces are
  freed by a routine first. 20 boards can't tell a chain change of a few tenths; a 40-board run would, if wanted.

### Opening the way, and the furnace's whites first (13 Nov, seventh run)
After the nineteenth note (§3, "Moving one piece to open the way", "Whites in the furnace's column cost more").
20 boards a tier, the code before and after run by the same runner. "Stuck" is a Stage I decision to wait while
whites are left in the junk columns next to burn. The middle column is the two-drag search alone, without the
furnace's cost.

| Tier | Stuck waits a session, was (two-drag alone) | Sessions with one, was | Whites burned, was | Longest chain: mean (best), was | Points a minute, was | Path moves a session, was |
|---|---|---|---|---|---|---|
| Learner (no path search) | 9.3, was 11.4 (11.4) | 5/20, was 5 | 6.5, was 6.5 | 1.1 (2), was 1.1 (2) | 9.0, was 9.0 | - |
| Able to Master | 24.3, was 17.1 (11.4) | 11/20, was 11 | 0.7, was 0.8 | 1.1 (3), was 1.1 (3) | 9.8, was 9.5 | 1.9, was 1.2 |
| Grand-Master to Legendary | 16.5, was 25.4 (24.2) | 9/20, was 11 | 0.7, was 0.9 | 1.4 (4), was 1.6 (5) | 13.8, was 15.2 | 1.5, was 1.1 |
| Ultimate | 8.9, was 17.6 (17.6) | 4/20, was 6 | 0.3, was 0.9 | 1.9 (5), was 2.0 (5) | 20.7, was 21.0 | 1.3, was 1.1 |

- **What it did:** the Ultimate waits half as often with whites in the way and burns a third as many whites; the
  Grand-Master a third less often. On the user's own board the pair is found as they drew it.
- **What it didn't, honestly:** the Able to Master waits more with the furnace's cost (24.3 a session, against
  11.4 with the two-drag search alone), for no fewer whites burned; and the chains and points a minute are the
  same within 20 boards' noise. Most of the waits left are boards where the only way out of the furnace's column
  is worse than the burn (a white put on top of a spice, say): letting it go is right there. The search itself
  is played under twice a session: most stuck whites are freed by a routine first.

### Whites burned, by when (13 Nov, the seventh run measured again)
After the twentieth note (§3): the same code as the seventh run, the same 20 boards a tier, measured by when the
first white burned. "Columns gone" counts every column, up or burned; a white burned in the first 3 is a disaster.

| Tier | Sessions with no white burned | A white burned in the first 3 columns (a disaster) | Junk columns burned before the first white, where one burned: median (fewest) | Whites burned a session |
|---|---|---|---|---|
| Learner | 3/20 | 2/20 | 5 (1) | 6.5 |
| Able to Master | 12/20 | 1/20 | 9 (2) | 0.7 |
| Grand-Master to Legendary | 13/20 | 0/20 | 10 (5) | 0.7 |
| Ultimate | 15/20 | 0/20 | 8 (7) | 0.3 |

- **Against the user's bar** ("If you're playing well, you should never burn a white"): no tier is there. Even
  the Ultimate burns one in a quarter of its sessions, though never early (7 junk columns burned first at
  the least). The Able to Master has one early disaster in 20, after 2 junk columns.

### Never a white burned: the furnace's whites first, and the danger by the fire (13 Nov, eighth run)
After the twentieth and twenty-second notes. Why the Master and the Ultimate burned whites (each burn traced back):
nearly always a move had existed that would get the white out, often as the column reached the furnace with 14 s
left, but the bot took a sweep elsewhere that scored more a second, or saved the easy white first and left the
hard one, which by then no one or two drags could reach; and while the furnace's column still had whites, hard
ones in the column before it got no attention at all, so they reached the furnace already lost (the user's
picture, `39-*`). Rules now, not weights (`weigh`, `dangerZones`):
- **The furnace's whites first:** while the furnace's column (a column to burn) has a white, only moves that take
  one out in time are played, whatever they score, the one freeing a hard-to-reach white first (no way out left on
  its own); if no routine or path does, the wider path search (`PATH_WIDE`: drags to 16 swaps, a piece up to 6
  squares off moved first). No move ever puts a white into it.
- **The danger a column earlier:** in Stage I, a white hard to reach in the column before the furnace's (low down,
  boxed in, behind spice) is next in line the same way, before easy work elsewhere, even while the furnace's
  column still has whites no move can save. `P.ZONE2` switches it off.
- Tried and dropped: forbidding any move that leaves a white in the last two columns harder to reach (no effect on
  20 boards a tier).

20 boards a tier, before and after, the runner's lines; "elsewhere" is moves taking no white out of the last two
columns while a hard-to-reach white sat one column from the fire. In brackets, the furnace rule alone (`ZONE2` 0).

| Tier | Sessions with no white burned, was | Disasters (first 3 columns), was | Junk columns burned before the first: median, was | Whites burned a session, was | Elsewhere a session, was | Longest chain mean, was | Points a minute, was |
|---|---|---|---|---|---|---|---|
| Learner | 2/20, was 3 | 1, was 2 | 6, was 5 | 6.5, was 6.5 | 1.3, was 3.5 | 1.4, was 1.1 | 8.9, was 9.0 |
| Able to Master | 12/20, was 12 (14) | 0, was 1 | 9, was 9 | 0.7, was 0.7 (0.3) | 7.8, was 11.7 (10.1) | 1.3, was 1.1 (1.1) | 12.9, was 9.8 (11.3) |
| Grand-Master to Legendary | 14/20, was 13 (13) | 0, was 0 | 8, was 10 | 0.3, was 0.7 (0.6) | 7.2, was 9.3 (11.2) | 1.4, was 1.4 (1.3) | 11.4, was 13.8 (14.0) |
| Ultimate | 12/20, was 15 (14) | 0, was 0 | 9, was 8 | 0.6, was 0.3 (0.3) | 4.8, was 8.1 (8.7) | 1.6, was 1.9 (2.4) | 16.9, was 20.7 (21.3) |

- **What it did:** no early disaster for any tier but the Learner's one (was 2, and the Master's 1); the Master's
  old disaster board (seed 5007) is clean; the bots spend far less time elsewhere with a hard white by the fire
  (the Ultimate 8.1 to 4.8 a session), which is the twenty-second note's complaint.
- **What it didn't, honestly:** "never" isn't reached: 12 to 14 clean sessions in 20 for the top three, about as
  before, and within 20 boards' noise either way. The Ultimate is worse with the next-column rule (12 clean,
  points a minute 16.9 against 20.7); with the furnace rule alone it's 14 and 21.3. What's left: a hard white
  that's already beyond any one or two drags when its column comes up (a black or a brown would have to be brought
  from far off, three drags or more); the cure is earlier, keeping whites out of the last columns' corners while
  they fill, which this doesn't yet do. The Learner's burns are mostly after its chain starts (it never dismisses),
  which this touches little.

### A brown a flick lower, as a tie-breaker (13 Nov, ninth run)
After the twenty-first note. In Stage I, once the best move is picked, `tieBreak` looks for another doing its job
(its board score gain within 0.25) in as many drags and at most two more swaps that leaves the last four columns
in better order, browns lower and blacks higher (`rightOrder`); it's played instead when there is one. Never when
a white's being saved. The picture's own board is a crop that couldn't be placed, so its test is the same choice
built by hand. Same 20 boards, the eighth run's code with and without it:

| Tier | Tie-breaker changed the choice, a session | Sessions with no white burned, was | Whites burned a session, was | Longest chain mean (best), was | Points a minute, was |
|---|---|---|---|---|---|
| Learner | 2.8 of 33 moves | 1/20, was 2 | 5.3, was 6.5 | 1.1 (4), was 1.4 (4) | 9.6, was 8.9 |
| Able to Master | 7.0 of 76 | 11/20, was 12 | 0.7, was 0.7 | 1.0 (3), was 1.3 (6) | 9.5, was 12.9 |
| Grand-Master to Legendary | 5.8 of 77 | 14/20, was 14 | 0.7, was 0.3 | 1.6 (5), was 1.4 (4) | 13.4, was 11.4 |
| Ultimate | 6.0 of 81 | 14/20, was 12 | 0.8, was 0.6 | 1.9 (6), was 1.6 (6) | 16.2, was 16.9 |

- It changes about one Stage I move in twelve, at no more than two swaps each. On 20 boards its effect on
  outcomes can't be told from noise: the Master lost points a minute, the Grand-Master gained them, the rest about
  even. Whether the right-hand side really ends up better connected for later (the note's reason) isn't measured
  here; watching it on `distilling-test.html` would show it.

### The block phase: junk in blocks, the V, a brown kept bottom-left (13 Nov, tenth run)
After the twenty-third to twenty-fifth notes. Reading the pictures (`40-` to `43-*`): the V is the junk wrapping
the white block, the three right-hand columns and a row along the bottom, a brown and a black kept in the left-hand
corners. As built (`blockPhase`, `keptTools` in `src/distill-score.ts`; `P.BLOCK_DRAG_MS` in the planner):
- **When:** Stage I, once colour is half the board or less ("more white than anything else") and three in four
  whites are left of the last three columns. The user's picture 40 is at 48% colour.
- **Blocks, not fiddling:** each drag costs a person 400 ms more there, so a small move has to earn its place and
  the long drags (browns up, blacks down, together) win.
- **Toward the V:** +0.5 for each brown on the bottom row under the whites (the bottom arm, browns more than
  blacks).
- **The tools:** +1.5 each for still having a brown in the bottom-left corner (the first two columns' lowest two
  pieces) and a black in the top-left; the last one is spent only for a real gain.
- **Not done:** the twenty-fifth note's next step, looping browns from the right-hand store along the bottom under
  the whites, isn't a move of its own; the V term rewards it when a routine or the path search offers it. Keeping
  whites out of the last columns' corners (the eighth run's open question) didn't come out of these shapes, and is
  left.

20 boards a tier, the ninth run's code (before) and with the block phase (after); "in the block phase" counts only
moves made there (the Learner never gets there: it starts its chain at 4 columns banked).

| Tier | Block phase reached | Small drags (1–2 swaps) there, a session, was | Drags there, was | Swaps a drag there, was | Moves a minute there, was | Sessions with no white burned, was | Whites burned a session, was | Longest chain mean (best), was | Points a minute, was |
|---|---|---|---|---|---|---|---|---|---|
| Learner | 0/20 | - | - | - | - | 1/20, was 1 | 5.3, was 5.3 | 1.1 (4), was 1.1 (4) | 9.6, was 9.6 |
| Able to Master | 20/20 | 3.8, was 6.8 | 14.2, was 21.5 | 4.4, was 3.9 | 28.5, was 33.4 | 14/20, was 11 | 1.2, was 0.7 | 1.0 (2), was 1.0 (3) | 8.9, was 9.5 |
| Grand-Master to Legendary | 19/20 | 7.7, was 11.7 | 21.2, was 29.1 | 3.9, was 3.5 | 44.8, was 47.8 | 17/20, was 14 | 0.2, was 0.7 | 1.5 (5), was 1.6 (5) | 12.0, was 13.4 |
| Ultimate | 19/20 | 7.8, was 12.5 | 21.0, was 29.4 | 4.0, was 3.6 | 47.6, was 54.8 | 13/20, was 14 | 0.6, was 0.8 | 1.9 (5), was 1.9 (6) | 16.1, was 16.2 |

- **What it did:** in the block phase the bots play about a third fewer drags and 40% fewer small ones, each a
  little longer, the note's "a lot of small, intricate moves" cut back; on the user's own board the planner goes
  from seven small moves to two (one a long 8-swap drag) and keeps both corner tools.
- **What it didn't, honestly:** chains and points a minute are the same within 20 boards' noise (the Grand-Master
  12.0 against 13.4); whites burned mixed (the Grand-Master's clean sessions 14 to 17, the Master's whites a session
  0.7 to 1.2). Whether the V it leaves feeds the chain better isn't shown by these numbers.

### Phases the bots say aloud, each weighing the techniques (13 Nov, eleventh run)
The user (13 Nov): "the bot should have this is the current phase I think I'm in, and that obviously changes the
strategy and techniques that it starts using. Obviously, it can always use all the techniques if it absolutely needs
to, like it gets stuck or there's a blocked white piece. But ... different techniques have different weights
depending on the stage." Built as `src/distill-phase.ts` (`phaseOf`), read off the board each move, on the planner's
own stages, not a parallel system:
- **fire** (Stage I, a white in the three columns next to the fire, Helium's step one): rescue 1.3, junk column
  1.15, the path search 1.15; the sweep 0.9, storing 0.75, the line pull, leapfrog and figure of eight 0.85.
- **fill** (Stage I, the fire's side clear): the sweep (diamond) 1.2, junk column 1.15, turn-over 1.1; storing
  0.75, the line pull and figure of eight 0.85, the hook 0.9.
- **block** (Stage I, `blockPhase`, the whites mostly left): the hook 1.2, storing, the line pull, leapfrog and
  figure of eight 1.15, the sweep 1.1; the turn-over 0.85.
- **chain** (Stage II): the crawl and figure of eight 1.1, the hook 1.05. (The channels left even: tilting toward
  them over the rescues cost the Learner whites, 5.5 a session against 5.3.)
A move's worth (Stage I's score a second, the chain's betterment less its time) is multiplied by its technique's
weight only to rank it, never for the least worth playing; every weight 1 while a piece is stuck or a white's in a
danger zone (`weigh`), and the rules there (the furnace's whites first) unchanged. `P.PHASES` 0 switches them off.
The advice carries its `phase`; "Help, Helium", their hints and watching them play say it (src/lines/helium.ts,
PHASE). A burned column brings a new one onto the fire's side, so Stage I goes fire, fill, fire... a column at a time.

20 boards a tier, the tenth run's code (before) and with the phases' weights (after); moves a session in each phase:

| Tier | Moves in fire / fill / block / chain | Sessions with no white burned, was | Disasters, was | Whites burned a session, was | Longest chain mean (best), was | Points a minute, was |
|---|---|---|---|---|---|---|
| Learner | 18.6 / 14.1 / 0 / 57.5 | 1/20, was 1 | 1, was 1 | 5.3, was 5.3 | 1.1 (4), was 1.1 (4) | 9.6, was 9.6 |
| Able to Master | 38.6 / 22.1 / 13.1 / 27.9 | 14/20, was 14 | 0, was 0 | 1.2, was 1.2 | 1.0 (2), was 1.0 (2) | 8.8, was 8.9 |
| Grand-Master to Legendary | 25.5 / 31.6 / 16.9 / 26.1 | 17/20, was 17 | 0, was 0 | 0.2, was 0.2 | 1.5 (5), was 1.5 (5) | 12.2, was 12.0 |
| Ultimate | 28.7 / 29.6 / 16.5 / 32.9 | 13/20, was 13 | 0, was 0 | 0.6, was 0.6 | 2.1 (5), was 1.9 (5) | 18.5, was 16.1 |

- **What it did:** the whites burned lines are unchanged for every tier, and the bots now know (and say) where they
  are. The Ultimate's chains and points a minute rose a little (2.1 against 1.9; 18.5 against 16.1), within 20 boards'
  noise.
- **What it didn't:** the weights are mild on purpose and change few choices; whether stronger ones would play
  better isn't tried (`PHASE_W='{"block":{"hook":1.3}}'` on tools/distill-bots.mjs tries others).

### The bots as target chains, and the twenty-sixth to twenty-ninth notes (13 Nov, twelfth run)
The tiers are gone (the thirtieth note: "I don't want to say able blah blah blah"). Each bot is its target chain,
`LEVELS` in `src/distill-bots.ts`: **CC^1, CC^2, CC^3, CC^5, CC^8** (`?bot=cc2` on distilling-test.html; the old
names still open the nearest, learner CC^1, master CC^3, grandmaster CC^5, ultimate CC^8).
- **The target sets the bank:** the whites banked before the chain, `bankFor`: 4 columns for CC^1, 4.5, 5, then 6
  for CC^5 and CC^8 (7 was tried for CC^8 and kept it in Stage I nearly all session, below).
- **The target sets the techniques:** CC^1 the four simple ones (save the whites, finish the junk column, the
  diamond and the sweep, channels); CC^2 adds the turn-over and storing; CC^3 the leapfrog; CC^5 the crawl and the
  hook; CC^8 the figure of eight and the line pull. All search for a piece to bring round when a white's stuck.
- **It never dismisses:** it sends its chain up, and when the chain breaks it goes back to Stage I, banking for the
  next ("then it will start working on the next one"). A session ends with the flask full.
- **One pace for all:** 5 swaps a second along a drag, 350 ms to spot one, 100 ms between the start's blind sweeps,
  drags up to 14 swaps. Every bot burns early (now safe, the second fix below); none takes the endgame's gamble
  (Helium's advice still can).
- **Its target on the advice:** every Advice from a bot or `advise` carries `target` and `whitesNeeded` (still to
  bank in Stage I; still missing from the columns going up in the chain, 0 once reached), for Helium to say aloud.
  `advise(board, { target })`: Helium's pace, the techniques of the level for that target; CC^8 if none is given.

The four fixes:
1. **A white walled in by the fire (26th):** in the three columns next to the fire a white on its column's top or
   bottom, or beside a spice, is in danger already (`edgeWhites`); its column is a danger zone, saved only by that
   white getting out (junk brought into its place, the wide path search if need be). No move takes such a white's
   way out away or puts another white there, unless it gets a white out of the two columns nearest the fire. On the
   user's board both such whites are out in two moves (the bottom one by a crawl, then the top one).
2. **Early burns (27th):** a junk column is burned early only while the two columns coming up to the fire after it
   have no white (`clearComingUp`).
3. **Phase weights (28th):** they give way only for a danger zone, no longer for any stuck piece. The crawl is
   weighed down in the fire and fill phases (0.8) and in the block phase (0.85, the hook 1.2).
4. **One short (29th):** in the block phase a drag let go among the whites is carried on a swap or two more when
   that takes the piece in against the junk on its right (`joinedUp`) and still gains. Carrying on showed a greedy
   streak: later drags spent the last corner tool for a long pull across, so the corner tools (the twenty-fourth
   note) are now spent only to save a white in danger.

20 boards each (seeds 5000 on). Before: the eleventh run's tiers; after: the levels.

| Bot | Target reached (sessions) | Longest chain: mean (best) | Chains a session, mean length | Sessions with no white burned | Disasters | Whites burned a session (first 3 min) | Points a minute |
|---|---|---|---|---|---|---|---|
| Learner, before | - | 1.1 (4) | - | 1/20 | 1 | 5.3 | 9.6 |
| Able to Master, before | - | 1.0 (2) | - | 14/20 | 0 | 1.2 | 8.8 |
| Grand-Master, before | - | 1.5 (5) | - | 17/20 | 0 | 0.2 | 12.2 |
| Ultimate, before | - | 2.1 (5) | - | 13/20 | 0 | 0.6 | 18.5 |
| **CC^1** | 20/20 | 2.3 (4) | 2.8, 1.6 | 4/20 | 0 | 2.0 (0.8) | 12.9 |
| **CC^2** | 11/20 | 2.1 (5) | 2.5, 1.5 | 6/20 | 0 | 2.9 (0.6) | 10.9 |
| **CC^3** | 10/20 | 2.3 (5) | 2.9, 1.5 | 0/20 | 0 | 4.2 (0.7) | 9.8 |
| **CC^5** | 5/20 | 2.5 (7) | 2.0, 1.9 | 0/20 | 0 | 8.7 (1.0) | 8.6 |
| **CC^8**, banking 7 | 0/20 | 0.6 (3) | 0.3, 1.7 | 0/20 | 0 | 12.3 (1.3) | 1.8 |
| CC^8 banking 6 (5 boards only) | 0/5 | 3.0 (5) | 1.8, 2.3 | 0/5 | 0 | 9.0 (0.4) | 9.7 |

Early burns, the phase weights, and the techniques by phase (a session):

| Bot | Early burns: in all, within 3 s of the last, with whites in the next two columns | Stage I moves ranked with the weights on | Crawls in fire / fill / block / chain |
|---|---|---|---|
| Master / Grand-Master / Ultimate, before | 6.9, 1.9, 4.3 / 7.5, 1.3, 3.7 / 7.1, 2.0, 3.9 | 0 of about 1,500 each | Ultimate 2.2 / 3.8 / 1.3 / 2.9 |
| CC^1 / CC^2 / CC^3 | 4.8, 0.3, 0 / 5.0, 0.3, 0 / 5.5, 0.3, 0 | 49% / 43% / 40% | none (they don't know it) |
| CC^5 / CC^8 | 5.5, 0.6, 0 / 4.3, 0.6, 0 | 36% / 28% | 15.7 / 1.8 / 6.2 / 5.4 and 11.8 / 1.6 / 7.5 / 0.8 |

What the low targets play: the sweep, saving whites and the diamond in Stage I (CC^1: 49 sweeps, 37 rescues, 18
diamonds a session in the fire phase), channels and the diamond in the chain.

Plainly:
- **Targets:** CC^1 is reached every session (every one of its 55 chains); CC^2 about half the sessions, CC^3
  half, CC^5 a quarter. CC^8 isn't reached. Means sit near CC^2 for all of them: the chains are still limited by
  the white block's dirty edges (the second run), not the bank.
- **Whites burned went up, honestly the main cost.** Sessions now run to the flask full (6.5 to 8.6 minutes, where
  the old bots dismissed at about 3), and most whites burn after the first chain, when the bot goes back to Stage I
  on a mixed board and waits with a white it can't reach by the fire. In the first 3 minutes it's 0.6 to 1.3, near
  the old 0.2 to 1.2 a (3-minute) session; no disasters. Sessions with no white burned at all fell (0 to 6 of 20).
- **Early burns:** none now with whites in the next two columns (was 33 of 46 on seeds 1 to 5), and back to back
  burns down from about 2 a session to 0.3 to 0.6.
- **Weights:** they now rank 28% to 49% of Stage I moves (was 1 in about 1,500). Crawls in the fill phase halved
  (Ultimate 3.8, now 1.6 to 1.8), but in the fire phase rose for CC^5 and CC^8 (to 12 to 16): the new danger zone
  for an edge white turns up often, every technique is even there, and a crawl is often the saving move.
- **CC^8 banking 7 failed** (0.3 chains a session); 6, measured on 5 boards only, gave chains of 3.0 and is what
  ships. To measure on 20 boards next.
- **Next:** rescuing a white that's let go in a rebuild (whites burned later in a session); ranking the saving
  moves of an edge zone by the phase's weights too, so a hook or a plain drag beats a crawl there.

### Whites burned later in a session, traced; and the thirty-second note (13 Nov, thirteenth run)
Burns traced back to the moves before them (CC^3 and CC^8 on seeds 5000 to 5009, and CC^5 on 5001, which burned 20
whites in one session), and what was found:
1. **The bank turned into junk after a chain broke (the main cause).** Back in Stage I, the bot treated every column
   reaching the fire as a junk column to finish, but after a chain the right-hand side is the bank's leftover whites:
   each column was mostly white, the bot moved junk into it, and a white or two burned with it, column after column.
   Now, once it has chained, a mostly white column at the fire (`mostlyWhite`) puts it back in the chain, a new one
   (`DistillBot.chained`); Stage I resumes only when junk reaches the fire. No white is burned that way: a mostly white
   column goes up whatever happens.
2. **A way out that saved nothing.** In a danger zone the path search's cheapest move often took the junk under the
   white out of the column and back, the white out and another white in behind it; it counted as a way out, so nothing
   else was looked for while the column burned (one CC^3 board waited 15 s so). Now a danger zone's white is searched
   for with its zone (`Stuck.zone`): a way out counts only when it leaves fewer whites there, and the move a piece out
   of the way first (`openWay`) is tried for the chain's junk columns too. On that board it now brings a brown round
   from the left, eight swaps.
3. **Whites walled in by spice.** A third of the CC^8's remaining burns were whites with spice on both their ways
   left: spice never moves and the board slides as a whole, so such a white can only drift right till it burns.
   `behindSpice` now counts it (-12, as a white behind spice at the top or bottom), so no move puts a white there.
   One already walled in from the deal can't be saved.

And the brief's other points:
- **The saving moves ranked by the phase's weights** (`rankSaves`): the hard-to-reach first as before, then by worth
  weighed, only the weights holding a technique back counting (the rescue's own lift doesn't), and a long plain drag
  in full, so a sweep or a hook that saves the white beats a crawl that saves it as well. (Tried first with every
  weight, round one: a rescue's two drags beat one plain sweep that saved the same white better.)
- **The thirty-second note:** (1) frozen with whites low by the fire: when nothing saves a white in danger in one
  move, a short plan (`setUp`): of the best 8 moves on offer, the one after which a plain save or a piece brought round
  saves it, both in time, the save judged as the planner will play it next move. About 2.5 a session (CC^3). (3)
  drags stopping short: in Stage I a drag is carried on past where its score a second peaks while each swap more takes
  its junk further right and the board scores no worse (`P.ONWARD`). (2) the blacks' diagonal through the right-hand
  junk isn't addressed as such: whatever it boxes in by the fire is now a short plan's to free, but nothing clears it
  early.

20 boards each (seeds 5000 on), CC^8 banking 6 (item 4 of the brief). Before: the twelfth run; round 1 the three
fixes and the first ranking; after: everything above (round 3).

| Bot | Longest chain: mean (best), was | Target reached (sessions), was | Sessions with no white burned, was | Disasters | Whites burned a session (first 3 min), was | Points a minute, was |
|---|---|---|---|---|---|---|
| **CC^1** | 1.9 (4), was 2.3 (4) | 20/20, was 20/20 | 13/20, was 4/20 | 0 | 0.6 (0.1), was 2.0 (0.8) | 15.7, was 12.9 |
| **CC^2** | 2.6 (5), was 2.1 (5) | 15/20, was 11/20 | 15/20, was 6/20 | 0 | 0.6 (0.0), was 2.9 (0.6) | 16.7, was 10.9 |
| **CC^3** | 2.0 (4), was 2.3 (5) | 6/20, was 10/20 | 14/20, was 0/20 | 0 | 0.6 (0.1), was 4.2 (0.7) | 14.1, was 9.8 |
| **CC^5** | 2.5 (5), was 2.5 (7) | 3/20, was 5/20 | 10/20, was 0/20 | 0 | 0.7 (0.1), was 8.7 (1.0) | 12.2, was 8.6 |
| **CC^8** (bank 6) | 2.6 (5), was 0.6 (3) at bank 7 | 0/20, was 0/20 | 11/20, was 0/20 | 0 | 0.7 (0.1), was 12.3 (1.3) | 12.4, was 1.8 |

Round 1 (the three fixes alone) had whites burned 0.3 / 0.6 / 0.3 / 0.9 / 0.8, sessions with none 14 / 12 / 15 / 12 /
14, chains 2.0 / 2.3 / 2.2 / 2.8 / 2.8: the rounds differ within 20 boards' noise.

Crawls a session in the fire / fill / block / chain phases: CC^5 5.1 / 4.4 / 4.9 / 6.2 (was 15.7 / 1.8 / 6.2 / 5.4),
CC^8 4.8 / 4.6 / 5.3 / 6.5 (was 11.8 / 1.6 / 7.5 / 0.8). Round 1, before the onward carry and the short plan, had CC^5
3.4 / 2.7 / 5.0 / 6.4 and CC^8 3.4 / 2.8 / 4.3 / 6.9.

Plainly:
- **Whites burned fell by two thirds to nine tenths** at every level, half to three quarters of sessions burn none,
  and in the first 3 minutes it's 0.1 or less a session (CC^8 0.1, the old Ultimate's 0.6). No disasters. Points a
  minute rose for every level, CC^8's most (its rebuilds no longer stall).
- **Crawls by the fire are down to a third** (12 to 16 a session, now about 5). In the fill phase they rose (1.6 to 1.8,
  now about 4.5), with the onward carry and the short plans in; not traced yet.
- **CC^8 at bank 6, on 20 boards:** chains 2.6 (best 5), never its target. It ships at 6.
- **The targets still aren't reached past CC^2:** every level's mean chain sits at 2 to 2.6. Traced on CC^1 and CC^5
  (4 sessions each): in the chain the bot waits, nothing worth moving, about 300 times a session (some 75 s) with junk
  in the column going up, mostly a brown or a black stuck on its top or bottom edge, and that column then goes up
  not Crystal Clear (7 or 8 breaks a session). Such a piece needs a pair working together (a black brought under a
  brown at the top, then a white under the black), which no chain routine finds and the path search's one drag can't.
  That's the next lever for the chains; and while it waits in the chain the bot could be building on the left.
- The runs got slower (2 to 3 minutes a level for 20 boards, was about 1): the short plans' look ahead.

### The pair rescue in the chain, urgent and early (13 Nov, fourteenth run)
After the user's note on a brown stuck at the top of the column going up (§3, "The pair rescue"), and the thirteenth
run's finding that such pieces break the chains. Built: `pairRescue` and `freed` (src/distill-path.ts), `chainZones`
and the chain's danger zone in `weigh` (src/distill-bots.ts), the user's board as `STUCK_ON_TOP` (tested every level,
and its mirror, a black at the bottom). The runner now counts the chain's waits (each wait, up to 250 ms, with junk
in the column being filled) and the columns sent up not Crystal Clear.

20 boards a level (seeds 5000 on). Round 0 is main before this work: the thirteenth run's code plus the changes made on
main since, unmeasured till now (no bot burns by hand, a drag let go where the board's best with the reach at 40, a
column banked per Crystal Clear of the target). Round 1, the pair rescue as it ships. (Round 2 tried `freed` letting
junk go into the next column when that column's mostly junk: chains 3.6 / 3.5 / 3.6 / 4.6 / 3.8, a few more whites
burned, sessions with none 10 / 10 / 12 / 15 / 10; not kept.)

| Bot | Longest chain: mean (best) | Target reached | Sessions with no white burned | Whites burned (first 3 min) | Points a minute | Chain waits a session (s) | Columns up not Crystal Clear |
|---|---|---|---|---|---|---|---|
| CC^1, thirteenth run | 1.9 (4) | 20/20 | 13/20 | 0.6 (0.1) | 15.7 | about 300 (75 s), traced | 7 or 8, traced |
| CC^1, round 0 | 2.4 (5) | 19/20 | 13/20 | 0.8 (0.3) | 11.0 | 1,178 (317) | 7.0 |
| **CC^1, round 1** | **3.7 (6)** | **20/20** | **15/20** | **0.4 (0.1)** | **13.8** | 1,154 (311) | **4.3** |
| CC^2, thirteenth run | 2.6 (5) | 15/20 | 15/20 | 0.6 (0.0) | 16.7 | | |
| CC^2, round 0 | 2.4 (5) | 17/20 | 12/20 | 0.9 (0.3) | 10.7 | 1,162 (312) | 7.3 |
| **CC^2, round 1** | **3.5 (6)** | **20/20** | **16/20** | **0.3 (0.1)** | **13.6** | 1,116 (301) | **4.4** |
| CC^3, thirteenth run | 2.0 (4) | 6/20 | 14/20 | 0.6 (0.1) | 14.1 | | |
| CC^3, round 0 | 2.5 (5) | 8/20 | 13/20 | 0.5 (0.3) | 11.2 | 1,011 (271) | 7.8 |
| **CC^3, round 1** | **3.9 (7)** | **19/20** | 11/20 | 0.6 (0.3) | **13.6** | 1,033 (277) | **4.5** |
| CC^5, thirteenth run | 2.5 (5) | 3/20 | 10/20 | 0.7 (0.1) | 12.2 | | |
| CC^5, round 0 | 3.6 (8) | 7/20 | 16/20 | 0.2 (0.1) | 14.0 | 775 (208) | 6.1 |
| **CC^5, round 1** | **4.7 (7)** | **13/20** | **18/20** | **0.1 (0.1)** | **16.3** | 634 (170) | **4.0** |
| CC^8, thirteenth run | 2.6 (5) | 0/20 | 11/20 | 0.7 (0.1) | 12.4 | | |
| CC^8, round 0 | 3.0 (5) | 0/20 | 12/20 | 0.6 (0.1) | 10.5 | 737 (197) | 7.0 |
| **CC^8, round 1** | **3.9 (8)** | **1/20** | **13/20** | **0.5 (0.1)** | **13.3** | 614 (165) | **5.5** |

No disasters in any round. Pieces brought round (the path search's moves, the pair rescue among them) went from 14 / 13
/ 7 / 5 / 7 a session to 25 / 23 / 18 / 12 / 14.

Plainly:
- **What main's changes did on their own (round 0 against the thirteenth run):** longer chains for most levels (CC^5
  2.5 to 3.6, CC^8 2.6 to 3.0, CC^1 1.9 to 2.4), but points a minute fell for the low ones (CC^1 15.7 to 11.0, CC^2 16.7
  to 10.7): with no burns by hand every junk column waits out the furnace, and CC^1 banking one column is in the chain
  nearly all session. Whites burned in the first 3 minutes rose a little at CC^1 to CC^3 (0.1 to 0.3). One run, so the
  three changes can't be told apart from each other.
- **The pair rescue (round 1 against round 0):** every level's mean chain up by about one (CC^3 2.5 to 3.9, CC^5 3.6 to
  4.7), CC^1 to CC^3 reach their target in 19 or 20 sessions of 20, CC^5 in 13 (was 7), and the first CC^8 (1 of 20).
  Columns sent up not Crystal Clear fell from 6 to 8 a session to 4 to 5.5; points a minute rose at every level (by 2 to 3).
  Whites burned no worse, sessions with none up except CC^3.
- **The waits didn't fall.** Counted this way the chain waits 600 to 1,200 times a session (2.5 to 5 minutes of an
  8-minute session). Traced on CC^3 (2 sessions): nearly all with the column being filled mostly white, a piece of junk
  stuck in it and whites to spare on the left, where neither the routines nor a four-drag pair rescue finds a way: most
  often a black at the very bottom of the furnace's column (a tall column's bottom has one neighbour on the left), with
  junk under the column before it. The rest are junk columns burning out ahead of the chain, nothing to do but wait.
- **Still not reached:** CC^5 one session in three short, CC^8 almost never (3.9 mean). The next levers: a wider plan
  for the bottom corner (five or six drags, or the pair crawled along), and building on the left while the chain waits.
- **Not done:** the thirty-second note's diagonal of blacks (a Stage I change to the board score, not cheap to measure).
- **After the run, one ordering:** the chain's danger zone now waits while a white is still in the junk columns burning
  out ahead of the chain (the full test run caught CC^1, banking one column, playing a pair rescue as its first move on
  seed 3 while a white sat in a column to burn). Checked on 5 boards only: CC^1 chains 3.6, CC^3 3.0, whites burned 0.4
  a session each; not measured on 20.
- **Its cost:** the search is about 20 ms where it runs, kept while the board's unchanged, and what found nothing kept
  for the same pieces round the column; the runs took 2 to 4 minutes for CC^1 to CC^3 (was about 1.5).

**Watching them, the first note (the user, 12 Nov, a screenshot of the Ultimate's board):** "the main
thing is it just doesn't carry on the whole way to the right. It just kind of stops ... that black ... in
the white, it was dragging the black diagonally down and it just stopped there. It's like, well, no, it
should carry on as far as it can go. And you can see in the top as well, there's just like a lone white
piece. So at the start ... there's plenty of moves. So it's like just drag the brown, drag all the black,
drag everything over. It's just quick drag motions. You don't need to be surgically precise about it at
the start, and that gives you a huge amount of speed difference." So:
- **A drag goes as far as it can:** a black sent down through the whites keeps going, diagonally, to the
  bottom and on to the right until nothing lets it further; a brown up the same; never parked one place
  short in the middle of the whites, where it's a piece trapped on the next column's edge.
- **The start is sweeping, not surgery:** in the first columns, with plenty of moves and time, the junk
  is swept right in long rough drags one after another, every brown and black dragged over, with little
  pause between them; precision comes later, when the furnace is close. That's where most of a real
  player's speed comes from.
- **No lone white left behind at the top:** the sweep brings the whites left with it.
- **When the sweeping stops working, the techniques start (the user, 12 Nov):** "it's only once you can't
  just do that blind ... that you start needing to do things like having browns at the bottom to drag
  things up so that you can pull stuff over easily. But at the start, it's easy. It's just go, go, go." So
  the routines (browns kept at the bottom to bring things up, and the rest) come in only once plain sweeping
  stops moving the junk right; until then it's blind, fast dragging.

**The second note: browns to the bottom, blacks to the top, and climbing the right-hand wall (the user,
12 Nov, two screenshots drawn on: `notes/distilling/2-brown-over-the-top.webp` and
`3-brown-down-and-black-zigzag.webp`; the first note's is `1-black-stopped-short.webp`).** The board: the
left and middle nearly all white, the junk in the last two or three columns on the right, a few blacks and
browns still low in the middle.
- **Red, a brown sent over the top:** the brown low on the left goes down through the black beside it,
  then up through the whites on a long diagonal to the top of the right-hand side ("so that it aligns all
  the way up"), and then down through the blacks there. One drag, across the whole board.
- **Yellow, the second stage: and on down to the bottom.** "you can then drag it all the way down again
  ... you kind of drag the brown to the bottom. And then you could even like catch that black that's
  currently trapped behind a brown": the brown sinks on through the blacks to the bottom of the right
  side, and on its way can free a black stuck behind a brown.
- **The point:** "you don't just drag it to the right and leave it there. You get, once you got to this
  stage of the board, you need browns at the bottom, blacks at the top. Otherwise, you've got no way of
  kind of hooking things in." With the junk in a few columns on the right, it's arranged: browns low,
  blacks high, so anything else can be hooked in through them.
- **Green, a black climbing the right-hand wall:** a black low in the middle goes "down, up, down through
  the whites", and on reaching "the kind of brown wall at the right, you can go up through browns, and that
  kind of gets you up. And ... if there was a line of blacks there, you can kind of zigzag your way up to
  get to the top. And that's how you, once you get down to a few columns of color on the right, that is
  how you get it up." So the right-hand columns are a ladder: a black climbs through browns, zigzagging
  across into the next column where the browns are, up to the top. With browns at the bottom and blacks at
  the top (above), there's always a way up and a way down.
- **For the bots:** in this stage (the sweeping done, the junk in a few columns on the right), every junk
  piece is taken all the way: browns to the bottom of the right side, blacks to the top, by the long drags
  above, and any piece low in the middle brought over by the ladder. Never a piece left where it was
  dragged to.

**The third note: the sweep's end, and turning the right side over (the user, 12 Nov, three screenshots:
`notes/distilling/4-end-of-the-sweep.webp`, `5-nowhere-to-go.webp`, `6-blacks-up-the-right-side.webp`).**
- **Where the sweep ends:** "by the end of the first ... phase, you should kind of end up with a board kind
  of like this. So you can see brown's at the top, black's at the bottom, but that's not then where we want
  them." Whites fill the left; on the right, the browns have risen to the top and the blacks sunk to the
  bottom, as they do on their own through whites.
- **Why that's stuck (after the next burn, a new column on the left):** green, a black from the left "wants
  to go down but it's got nowhere to go": it sinks through the whites and meets the blacks at the bottom.
  Red, a brown "going up, again, it's got nowhere to go": it rises through the whites into the browns at
  the top. Nothing hooks in.
- **Yellow, the fix: blacks up the right side.** "what I can do is take black pieces and move them up the
  board on the right-hand side ... imagine if I had another brown there, I can do the same and bring
  multiple of them. And then once there's a black at the top there, the brown can hook in and pull down."
  A black climbs up through the browns (a black rises past a brown), zigzagging between the right-hand
  columns to the top; several of them, one after another. With blacks at the top right, a brown arriving
  there sinks through them and pulls down; with browns at the bottom, a black arriving low climbs.
- **So the zigzag up the side does two jobs:** "zigzagging up the side is how you get them over. But it
  also then is what allows you to hook things on the left and pull them in." It's the second phase: once
  the sweep's done (browns top right, blacks bottom right), turn the right side over, blacks up and browns
  down, by zigzags up the side, and from then on everything new from the left hooks in.
- **A burn button while paused (the test page):** "when I'm in pause mode as well, I need a burn button so I
  can demo these." On `distilling-test.html`, a Burn button that works while the game's paused, so a board
  can be set up and burned to show the next stage.

**The fourth note: the crawl, drawn (the user, 12 Nov, `notes/distilling/7-the-crawl.png`).** "this is what I
mean by crawling along. So you can see the black can go down, up, down. And then the brown can essentially
do a very similar motion because it's got the black next to it. So it manages to kind of crawl together and
they can loop around." In the picture a black and a brown sit side by side low in the whites: the black
goes down through a white, up past the brown, and down through the next white; then the brown, with the
black beside it, does the same in its turn, and the pair travels along level through the whites, looping
round each other. It confirms "The crawl" in §3 as the user plays it: two drags in turn, each a down, up,
down, not one piece dragged alone.

**The fifth note: one black pulls a line of browns over (the user, 12 Nov, `notes/distilling/8-` to
`10-*`).** "I've got to try and figure out exactly how you do it." The board: whites everywhere but the
left, where browns fill the top two or three columns, blacks are stuck at the bottom ("we've got to try and
rescue them"), and among all the browns there's one black.
- **Red, freeing the one black:** it comes out of the browns over the top, along the side through the
  browns, then down through the whites to low in the middle. ("Oh shoot! I just pulled it one thing too
  many. This is a bit sensitive.")
- **Teal, where it should have stopped:** lined up in the whites right beside the column of three browns.
- **Orange, then up through the browns:** "I was going to go up through the browns. In that kind of orange
  arrow direction, that pulls the browns down, and then you can loop it all back over again ... that's kind
  of a way of pulling a line of pieces across the board." The black climbs past each brown (a black rises
  past a brown), so each brown drops a place as it goes by; then the black's looped back over the top and
  round to do it again, and the line of browns comes across.
- **Mid game and late:** "when you're in this mid game, yeah, you use kind of like one black to pull a whole
  row of browns over. And then once you get further on and pieces are rare, you just have one black and one
  brown and do it like really quickly."
- **The whole idea:** "using pieces together like that ... you can use a black and a brown to get things up
  and down vertically, left and right, using these kind of combinations of these tricks." The user's name
  for it escapes them; it's "Pull a line up" in §3 and in the bots (`linePull`), the loop done again and
  again.

**The sixth note: the line pull as a sequence, a crawl and a loop (the user, 12 Nov, six screenshots drawn on
in orange and green, `notes/distilling/11-` to `16-*`).** "let's say it's 6 to 7. That's
basically the equivalent of a crawl. But then you can kind of see how all the browns are one lower, and then
I can loop the brown back again, up through, do kind of a crawl at the top, black down, round the bottom, up
again, and drag all of those brown pieces down." ("6 to 7" may be the shape drawn in orange on the first
picture, or steps of a longer sequence: to pin down with the user.) The board, the same mid game as the
fifth note: browns filling the top left, one black among them, blacks stuck at the bottom.
- **Orange, the crawl:** the black and a brown beside it work along the bottom of the browns and up past
  them, a crawl as in the fourth note; afterwards every brown in that line sits one place lower.
- **Green, the loop:** then the brown loops back: up through the browns, a crawl along the top, the black
  down, round the bottom and up again, and the whole line of browns is dragged down another place. One
  picture has the black drawn from low in the middle diagonally up and left through the browns to the left
  wall, hooking at the end.
- **What it adds to "Pull a line up" (§3, `linePull`):** it isn't one black's loop alone. A black and a brown
  together crawl to shift the line one place, then loop round and go again, each pass lowering every brown in
  the line by one, until the line's where it's wanted.

**The seventh note: the techniques by stage, the cheapest that still works (the user, 12 Nov, watching the
new Ultimate).** Browns to the bottom and blacks to the top (the second and third notes) aren't for the whole
game: "you don't need the blacks at the top and the browns at the bottom when you've still got, like, 4 or 5
columns. Like, if you move really fast, like, there's lots of color there ... you only need to do that when
things are getting a bit trickier." What the Ultimate did wrong:
- **Black to the bottom well, then no crawl:** "it's doing black to the bottom very well, but it's then not
  kind of crawled it." It crawled on a second go, but the first time "it wasn't one smooth motion".
- **Whites left on the right:** "it's just leaving a lot of whites on the right hand side with one thick band
  of color in the middle. It's not taking the opportunity to crawl very early."
- **The turn-over too soon:** "even just after a few columns burn, black ... zigzagging a black on the right
  hand side. That's what I mean. When you've got, like, half the board is color, you don't need those
  techniques."
- **The rule:** "They're very action heavy. They're slow, so you don't do them until they become more and
  more necessary. There are faster ways of doing it when the board is full. So ... rank each of the
  techniques as to how move efficient they are, and therefore ... which one you resort to depends on what
  options and what stage you're at." So each technique has a cost in swaps for what it gets over, and a bot
  plays the cheapest one that still works on the board in front of it: the sweep while colour's plentiful,
  the crawl early to carry the band of colour on to the right, and the turn-over, the right-hand ladder and
  the line pull only as colour gets scarce. (More examples to come from the user.)

**The eighth note: the opening's shape, upright bands, never a diagonal (the user, 12 Nov).** "the rule at
the start is kind of like white to the left. You want to fill those columns on the right as quickly.
Certainly once you get 2 or 3, then you can just start dragging a bit more. But ... you want to be forming
a line of color, white, color. Again, it's not a perfect idea, but you should not have a diagonal line of
color and white above and below it. That's how you're going to get that. Just looks horrible to unstick."
- **First, the right-hand columns full of junk, fast:** whites to the left, and the rightmost columns filled
  with colour as quickly as possible (Stage I's opening, §3). Once 2 or 3 are full, you can drag more freely.
- **Upright bands:** the board should read across as colour, white, colour: full junk columns on the right,
  the white block in the middle, the new colour coming in on the left, each band standing up.
- **Never a diagonal band:** a slanting line of colour with whites above and below it is what gets stuck
  ("horrible to unstick"); it's the "one thick band of color in the middle" the Ultimate left (the seventh
  note). So a drag that would leave colour lying on a diagonal is worse than one that stacks it upright in a
  column, even when it gets over the same junk.

**The ninth note: when the two halves are close, just drag (the user, 12 Nov, watching the bot,
`notes/distilling/17-two-halves-close.webp`).** "here's a perfect example from watching the bot. So here, it's
doing all kinds of crawling techniques in the middle of the board for some reason, whereas at this point, the
two halves are really close to each other. Like, all you need to do is drag the blacks down, the browns up.
You could get, like, 10 pieces over to the other side dead easy." The board: early, the left half a mix of
whites and colour, the right half mostly junk, the gap of whites between them only a column or two wide. The
user's drawing: green drags taking each black in the middle down-right through the whites into the junk on the
right, one after another, and an orange one taking a brown up-right the same way.
- **The sweep isn't done while the gap is narrow:** while blacks sit above whites and browns below them with
  the junk side a short drag away, plain drags (blacks down, browns up) are the cheapest moves on the board,
  each getting a piece over in a few swaps. The bot was crawling there instead, the slow technique for when
  colour is scarce or the river is wide (the seventh note's ranking).
- **What it means for the bots:** count what plain drags could still get over (how many pieces have a
  straight run into the junk side) before reaching for any technique; with something like ten such pieces,
  it's sweeping time, whatever happened a drag ago.

**The tenth note: early on, bring in another piece rather than loop back (the user, 12 Nov,
`notes/distilling/18-another-black-not-a-loop.webp` and `19-the-diamond-forming.webp`, a few drags on from the
ninth's board).** "Here's a great example of what I mean by early game efficiency ... that black top left black
piece I dragged down bottom right. So what I could have done is I could have used a crawl technique to go brown
down through the black, loop it around a bit, blah blah blah. But it's like, well, I don't need to, because
I've got another black piece further up. I can just drag it down, fill in the gap, and then go brown up, down,
up. It's just far more space efficient. Like each time you kind of loop or go back, you're basically undoing
some progress in a way ... That makes it inefficient, whereas at this stage I can still just drag stuff down
and then instead of following that red path, which would have been less efficient ... I've now pulled a black
down, it's a bit simpler, but it's also got an extra move because the black, an extra piece, is now involved,
and it just works."
- **The picture:** low in the middle a brown sits left of a black the user had just dragged down. Orange, the
  path not taken: the brown down through the black and looping round (a crawl). Green, what they did: another
  black from higher up dragged down to fill the gap, then the brown up, down, up past it into the junk.
- **The rule:** a loop or a step back undoes progress, so while there are free pieces higher up (early on,
  colour's plentiful), drag one more down to make the brown's way, rather than loop the pair you've got. It
  costs one more drag, but every swap in it moves something the right way.
- **Where it leads:** "if I carry that to its conclusion, I then end up in this position ... the brown's there,
  and you can see what I mean by that diamond shape kind of forming at the bottom." The second picture: the
  junk on the right building up from the bottom in the diamond's shape (§3, "The diamond").
- **For the bots:** score a technique's swaps by how many move a piece the wrong way (back left, or back over
  ground already won), and prefer a plan that brings in another free piece to one that loops, while free
  pieces are about.
- **Don't sort what's about to burn (the user, following on):** "there's all these brown ... if I brought those
  browns down in that last screenshot to the bottom left, like there's no point because things are all going
  to get burned anyway. I've got like three or four rows of pieces ... so organizing stuff like that is just
  not necessary yet because it's going to get burned. And I'm not going to waste my time organizing stuff
  that's going to get burned. But once I start getting down to two or three columns, and things are a bit
  scarcer, then ... it will start becoming more" (cut off; necessary, presumably; a concrete example to
  come). So while three or four columns of junk are still waiting on the right, sorting junk (browns to the
  bottom, blacks to the top, §3) is wasted swaps: it all burns as it is. Sorting earns its swaps only when
  the junk is down to two or three columns and pieces are scarcer.
- **Cost in human terms, not swaps (the user, 12 Nov):** "obviously got to think in human terms, like, yeah,
  fine, a bot can click as fast as possible, but for a human, that kind of muscle memory of drag, you know,
  that kind of one smooth mouse motion is cheap. It's quick." So when the techniques are ranked by how
  efficient they are, the cost is a person's time, not the count of swaps: one smooth drag, however many
  swaps long, is cheap; what costs is each new drag (finding the piece, picking it up), each turn back within
  one, and the thinking before a fiddly sequence. A long straight drag beats a few short ones that swap less.

**The eleventh note: judge the board, as early chess programs did (the user, 12 Nov, watching the merged
bots, `notes/distilling/20-blocked-middle-trapped-white.webp`).** "I'm not sure if it almost needs some
heuristics, like I'm thinking, and I guess the early chess Deep Blue work. Like, for example, here I can see in
the green in the middle, there's a lot of colours blocking movement from top to bottom in the middle of the
board. I can also see in the bottom right, there's a trapped white ... ball. Like, those are very bad things.
... you should be almost giving yourself bonus points for getting those first few columns on the right
complete. You know, you don't have to necessarily strictly go that way, but as a heuristic ... almost min-max
style things, I'm not saying implement them because they're expensive, but even just as a test of moves, being
able to move pieces clearly, having trapped pieces, trapped holes, those are bad." And what they saw: "things
aren't just dragged to the bottom. Again, there's just a lot of weird crawling rather than quick drag brown up,
black down, done. And so as things are being actively dragged into the middle instead of trying to get things
column by column on the right".
- **The picture:** the green outline takes in the middle four columns, a mix of browns, blacks and whites
  with colour scattered top to bottom, so nothing can cross them in one drag; the right-hand columns are
  nearly all junk, but a white is caught low in them.
- **What's bad on a board:** colour blocking the middle top to bottom (no clear lane for a drag); a white
  trapped in the junk on the right (it burns, or costs a rescue); trapped pieces and holes in general;
  pieces that can't move freely.
- **What's good:** the rightmost columns complete, one by one, from the right (a bonus each); clear lanes,
  so a brown can be dragged straight up and a black straight down; colour gathered on the right rather than
  dragged into the middle.
- **How to use it:** a score of the board from these, used as a test of each candidate drag (the board after
  it, scored), not a deep search: "I'm not saying implement them because they're expensive". The cheap
  plain drag that scores well wins over a crawl.
- **Blacks to the top, misread (the user, 12 Nov, `notes/distilling/21-a-diagonal-of-blacks.webp`):** "it's
  trying to get blacks to the top. And it's now ended up with a diagonal of blacks the entire way across the
  screen because it's tried to drag them up. I think it's really misunderstood that, no, you want blacks to the
  bottom right at this stage. I think it's really misunderstood the concept and the point of doing that." In
  the picture a band of blacks runs diagonally across the middle, with whites above and below it (the eighth
  note's horror). Blacks at the top is for the late game's scarce colour; early on a black goes down and right,
  into the junk.
- **The score, start simple (the user):** "the scoring should just be as simple as like how many whites have
  moved to the left, how many other pieces have moved to the right. For burning, and it's bonus for completing
  columns, and having more pieces like further to the left ... Like completed brown black columns with no
  whites in on the right, good." So: whites further left is good, junk further right is good, and a bonus for
  each completed junk column on the right with no white in it. Build that first, then add the rest above only
  where it shows it's needed.

**The twelfth note: stuck, a solid line of colour makes a channel (the user, 12 Nov,
`notes/distilling/22-stuck-bottom-right.webp`; and what came next,
`23-a-white-river-forming.webp`).** "I don't know if this is the best example, but this is one where I was stuck in the bottom right on
how to ... unstick myself on this. And like, I think what I've done is just made sure I had a solid line of
coloured pieces, so blacks and browns, because ... once they're nice and connected. At least I can then start
dragging all the blacks down. It creates a nice little channel to get through. But I certainly could start
clearing the mess that is this kind of middle of the board." The board: colour mixed right across the middle
and top, the right-hand columns junk with whites caught low in them and along the bottom, nothing a plain
drag gets over.
- **Getting unstuck:** first join the colour into one solid, connected line of blacks and browns; once it's
  connected, blacks can be dragged down along it one after another, and the line becomes a channel for
  pieces to get through. Then clear the mixed-up middle.
- **What came next (the second screenshot):** "there's a nice separation of white forming down the middle,
  because all I've been doing is taking individual blacks, zigzagging them through, being like right to the
  top right and the bottom left, and it's forming this nice separation." In the picture a clean column or two
  of whites runs down the middle, colour on either side of it. One black at a time, each zigzagged right
  through, and the whites gather into the "river" (§3) with no grand plan.

**The thirteenth note: free a white trapped behind spice first (the user, 12 Nov,
`notes/distilling/24-white-behind-the-spice.webp`, the next moment of the same game).** "based on that
heuristic, one of the first things I've done is cleared that white piece that's kind of trapped behind the
spice at the top right. Like those kind of, especially because ... things burn, like those places become
inaccessible. So that's certainly something what I've not seen the bots doing." Spice never swaps, so a white
in a pocket behind it can only get out one way, and as the columns burn and the board slides, that way can
close. So a white caught behind spice is rescued early, before it's walled in, and for the board's score it
counts as one of the worst things to leave (with a white trapped in the junk on the right, the eleventh note).

**The fourteenth note: a zigzag, not a diagonal, keeps the wall of white (the user, 12 Nov,
`notes/distilling/25-zigzag-keeps-the-wall.webp`, further on in the same game).** "it's not quite just what I
said of like drag straight down. I'm like zigzagging so I can maintain a nice wall of white so I'm not
creating that line in the middle that I think is what was emerging maybe from my earlier simplistic
instructions of saying drag blacks down, diagonally. I think it's not just a diagonal, it's a zigzag to
maintain the shape and separation." In the picture the whites stand as a solid block down the middle and
left, the colour packed on the right, the boundary between them upright. This corrects the ninth note's
"drag the blacks down": a black goes down and right in a zigzag that follows the edge of the white block,
not one straight diagonal across it, which would leave the diagonal line of colour through the whites (the
eighth note) that the bots were making.

**The fifteenth note: the shape, by zigzags alone (the user, 12 Nov,
`notes/distilling/26-the-shape-by-zigzags-alone.webp`, the end of the same game's opening).** "you can see, look,
I kind of end up at this shape. Which is great, which is just ... browns and blacks just being zigzagged
around. It's not required anything clever yet." In the picture the three left columns are solid white, the
fourth nearly so, and the right five or six columns are all junk, browns and blacks mixed, with only a white
or two at the boundary: Stage I done (§3), whites left and junk right in upright bands. Every move on the way
was a plain zigzag drag (the fourteenth note); no crawl, hook, turn-over or line pull. The slow techniques
are for later, when this stops working.

**The sixteenth note: when zigzags stop finishing columns, a brown pulls the blacks in (the user, 12 Nov,
`notes/distilling/27-blacks-grouping-at-the-bottom.webp` and `28-a-brown-pulls-them-in.webp`, later in the same
game, and the result, `29-after-the-loops.webp`).** "I think this is here the difference. Like you can see as pieces
are starting to spawn, more to the left. Like if I just keep doing black zigzagging down to the right, you can
see I'm not completing columns. They're kind of grouping at the bottom more. This is when you start dragging
browns down through the blacks to kind of pull them in. So yeah, using this example, I would start wanting to
... use this brown piece to kind of pull things in and kind of loop around. I think I've got too many green
arrows there".
- **The picture:** the whites are a solid block on the left, the junk on the right, but the new columns
  come in with colour on the left, and the blacks zigzagged across have settled in a row along the bottom
  of the middle columns, under the whites, rather than finishing a junk column on the right.
- **The turn:** this is where the fifteenth note's zigzags stop being enough, the first point where
  something cleverer is needed. A brown is dragged down through the row of blacks at the bottom (a brown sinks past a black: blacks rise, browns sink, §3), pulling them in, and loops
  round, as in the crawl and line pull (the fourth to sixth notes), to carry the blacks over into the junk
  side and finish its columns.
- **After a few loops (the user):** "So after a few loop kind of things, see, this is kind of the shape I end
  up with." In the picture the whites are one solid block on the left and top middle, the junk five columns
  on the right, and the blacks that were lying along the bottom now sit packed at the foot of the junk side,
  under the browns: the bottom row of the middle is colour joined to the junk, not blacks stranded under the
  whites. The shape is back to upright bands, ready for the next junk columns to finish and burn.

**The seventeenth note: the late game, browns down then up, the loop again, and the hooks lined up for the
end (the user, 12 Nov, the same game on, `notes/distilling/30-` to `34-*`).**
- **Browns down, then back up (`30-browns-down-then-up.webp`, `31-the-browns-gone-up.webp`):** "This is when
  I really start, you really start wanting to just drag the browns down, because you can see it has that
  impact in pulling the shape up. And then you have a bunch of browns at the bottom. So they kind of swap
  places, so then you go for the green arrows and you can get browns going back up ... Doesn't help that
  there's a couple of black[s] over there. Get those blacks out of the way and then drag those browns up."
  Red in the first picture: browns dragged down through the blacks packed at the bottom of the junk, which
  lifts the blacks (the shape pulled up). Green: then the browns, now at the bottom, go back up through the
  blacks. In the second, the browns ticked are the ones that went up.
- **The loop again, through a thick blob of black (`32-loop-again-through-the-blacks.webp`):** "this is when
  you start dragging them down, you can just repeat the whole process because you've got a nice big thick
  blob of black piece[s] to pull them through. And you just can continue in that kind of a loop to get rid of
  those diamond kind of edges." A brown zigzags down and back up through the mass of blacks on the right, over
  and over, squaring off the diamond's slanted edges (§3, "The diamond") into full columns.
- **Line the hooks up before the end (`33-hooks-aligned.webp`, `34-no-way-down-for-a-brown.webp`):** "you can
  get to a point where you need to make sure you have like those bottom and top kind of bits where things hook
  in, aligned, so you kind of resort things like this ... If you then start burning to the point where you
  only have one or two columns left, you will see here, for example, there is no way to get browns down to
  the bottom if you hadn't already gotten them there." The first picture: the junk re-sorted, blacks gathered
  high in the columns next to the whites, browns low and on the far right, so that each column has a black at
  the top and a brown at the bottom where the next pieces hook in. The second, later, with only two junk
  columns left: a spice sits low in one and the green cross marks a brown that has no way down; with so
  little junk left there's nothing to carry it. So the sorting (browns to the bottom, blacks to the top, the
  second and third notes) is done here, in the late game, while there's still junk to do it with: this is the
  "once you get down to two or three columns" of the tenth note.

**The eighteenth note: the board-scoring bots' first move traps a white; think of it as a path (the user,
13 Nov, watching the bots after the board score was merged, `notes/distilling/35-` and `36-*`).**
- **What the bot did (`35-bot-drags-a-white-up-to-the-top.webp`, `36-the-white-left-trapped-top-right.webp`):**
  "the very first thing they did was to drag this white upwards, and then like they went the entire way so
  that there was a white trap right at the top. So I don't know how that's following the instruction of don't
  trap things." In the first picture the green line is the bot's opening drag: a white near the top of the
  middle columns taken up and right, all the way to the top of the second column from the right. The second
  picture is the board after: that white sits at the very top right (it glows), with blacks below it and
  round it, a "?" beside it. It's on the right, the junk side, cut off from the whites on the left: trapped.
  The board score (§4) penalises a trapped white, so either it isn't seeing this one as trapped (at the top
  edge, perhaps) or something else in the score outweighed it.
- **What a person would do next:** "maybe like the next step I would have taken is to loop the brown around,
  because I really want to get rid of that ... trapped white. But let's see. Yeah, nothing does that." Get a
  junk piece round into the white's place (the brown looped round, the eighth and tenth notes' loop) so the
  white can come out, rather than carrying on. "you want things to go in one smooth motion, but I don't feel
  like it's really working."
- **Model it as a path (A\*):** "I know you've got the techniques that we really want to use, but sometimes
  ... I don't know if it's almost better to model it as a path ... in this case, feels more like a
  pathfinding A-star style problem. Find the path of a piece that could take that white's place. But
  obviously that pathfinding can involve loops." So, beside the named techniques: when a white's trapped (or
  any piece is in the wrong place), search for the cheapest way to get a piece that belongs there into its
  place, the moves a person would make, costed in their time (one smooth drag cheap, the eleventh note), and
  loops allowed in the path. The named routines stay as the shapes such a search tends to find; the search
  covers what they miss.
- **A simpler score to try (the same day):** "maybe we try just see how the bots do [with] simpler metrics ...
  forget about dragging whites to the left. It is about filling those right-hand columns of black and brown
  ... I still want it to be human-like ... you just want to pull things from the left to the right. Metric is
  how many columns are filled, second metric, how straight and vertical is the ... wall where the white meets
  the color. Once that starts emerging, that's another metric." So the board score, tried simpler: first, how
  many junk columns are filled on the right (no white in them); second, once a wall between white and colour
  has formed, how straight and upright it is. No separate credit for whites moving left: that follows from
  colour being pulled right.
- **The brown sweep is right, but too early (the same day, watching on):** "once you get past the first few
  columns, the way that [the bot's] sweeping browns up back down to the bottom right is right now is very
  good. But it's just like it leaves one or two trapped whites. So I feel like this is probably more of the
  right technique, but it's being applied a bit too quickly before those columns have been cleared." So keep
  the sweep of browns down to the bottom right, but only once the first few right-hand columns are clear of
  white; until then, clearing them (step one of Helium's lesson) comes first, and a sweep that leaves a white
  trapped is worse than it looks.

**The nineteenth note: when no single drag gets there, move one piece to open the way (the user, 13 Nov,
watching the bots after the simpler score and the path search were merged,
`notes/distilling/37-move-a-brown-to-open-the-path.webp`).** "the distilling bot did a lot better at that
first phase. But then it did seem to get stuck ... once it gets to the point where there's no single piece
path that can be dragged to the bottom right where these whites are, it's not doing stuff like ... you have
to drag that brown upwards so then you could drag a black over and into that spot." The picture: whites low
in the two right-hand columns, the next to burn; no junk piece has a clear drag down to them. The green
arrows: first a brown in the lower middle dragged up (the short hooked arrow), which opens a way; then a black
dragged along the bottom, right and up, into the whites' place at the bottom right. "clearing [and] filling
in with single piece drags definitely is there, huge improvement. Now it's got to work on ... if there's no
way of getting to this piece, what's a single thing that could move, like in this example, that brown piece
that would allow me to get to that path." So the next step for the search: when no one drag brings a junk
piece into a white's place, look for one enabling drag first (one piece moved out of the way) that opens
such a path, and play the two together, costed as a person's two drags.

**The twentieth note: measure whites burned by when, not how many (the user, 13 Nov, on the seventh run's
table).** "why it's burned in itself doesn't feel like it means much. Like, for example, I would measure like the
early game by how many like mixed brown black columns you burn before you burned a white. Like if you burn a white
on the first column or the second column that goes up or down, that's catastrophic. That's game ending. If you
accidentally burn a white on the 10th or whatever ... it's still bad ... If you're playing well, you should never
burn a white. That's just really bad." So the runner's yardstick: sessions with no white burned at all (the aim,
every one); the junk columns burned before the first white burned; and how many sessions burned one in the first
few columns gone, up or down, counted as a disaster. The bare count of whites burned is kept but no longer leads.

**The twenty-first note: a brown a flick lower when it costs next to nothing (the user, 13 Nov, watching the
bots' first move, `notes/distilling/38-brown-a-flick-lower-instead.webp`).** "the first move that jumped out to
me was how this brown piece just got dragged up, I guess, on the simplest diagonal ... I would have put it further
down ... that to me provides so many more opportunities later, because it gets that black piece up. It creates
... a more connected board on that right hand side. I feel like you can then drag browns down. You've got a gap
that's then easier to fill afterwards if you do get another brown in ... one of the heuristics is browns being
lower down the board. Like, you don't want to really actively be going out of your way, spending extra moves to
sort them at this point. But it's still preferable if it costs you very little. Like in this case, it's a little
flick and a swish, and the brown can be one level lower." The picture: near the top right, the bot dragged a
brown up and right along the plain diagonal (green); the user's way (orange) is a short hook that ends the brown
a row lower, a black lifted above it. So a tie-breaker, not a goal: among moves that do the same job for about
the same time (a swap or two more at most), prefer the one that leaves browns lower and blacks higher on the
right-hand side; never spend real moves on it this early.

**The twenty-second note: urgency where the danger is, low down by the fire (the user, 13 Nov, watching the
bots, `notes/distilling/39-no-urgency-whites-low-by-the-fire.webp`).** "there's no urgency in this script. Like,
it doesn't seem fussed that you're only one column away from a couple of whites burning at the bottom, and it's
not clearing the boundary thing at the bottom, that chunk at the bottom. It seems to be working ... the top part
of the board still, and it's like, well, the top board's safe. Moves are easy there. You've got a spice and a bunch
of stuff blocking things at the bottom. Like, that's your danger area that's hard to reach ... I wouldn't put my
money on this being a much more likely risk area for whites to get burned." The picture: the right-hand column is
all junk; the next one, to burn after it, has whites low down, and the bottom middle (circled) is a knot of whites
round a spice with junk pieces cut off, hard to reach. The bot was busy near the top. So: the whites in the next
columns to burn, and how hard they are to reach, set the priority. When they are one column from the fire and hard
to reach (low down, behind a spice, boxed in), that's the urgent work, before anything easy elsewhere; the harder
to reach, the sooner to start, since it takes more moves.

**The twenty-third note: once the whites are mostly left, move the junk in blocks and build the V (the user,
13 Nov, watching the bots, `notes/distilling/40-whites-left-now-move-junk-in-blocks.webp`).** "the bot does get
there, but it made me a bit anxious, and ... it's doing a lot of little fiddly things. I don't know if they're
necessary always or not ... a lot of small, intricate moves ... So when it gets to this stage here ... I don't know
if it's the fact that there is now more white than anything else, but I would just start pulling, like treating it
more like blocks of things to move ... you've got the whites mostly over to the left. This is where you just start
saying all those three browns, move them up, all the blacks on the bottom left, pull them all the way down and
start building that V shape." The picture: the whites are a big block on the left and middle; the right-hand
three columns are junk, browns near the top, blacks lower, scattered. So, at that point (whites the bulk of the
board, mostly on the left): stop single-piece fiddling; move the junk as groups in long drags, the browns up
together and the blacks down together, into the shape the chain wants, the V (most likely the channels of §3's
Stage II: a line of blacks running up-right and a line of browns running down-right, meeting on the left, so the
whites climb and slide through them to the right; to confirm with the user if it's not that). And fewer fiddly
moves in general: a small move should earn its place.

**The twenty-fourth note: where the block moves end up, and a brown kept bottom-left (the user, 13 Nov, the board
after their own next moves from the twenty-third note's, `notes/distilling/41-the-blocks-done-a-brown-kept-bottom-left.webp`).**
"this is kind of where I would end up with as my kind of next set of moves after that. But ... note that I've left
the brown at the bottom left ... I don't know if this is necessary at this point, but certainly becomes relevant
later, because I want to use that to haul black pieces up potentially ... one black in the top left, one brown in
the bottom left can be useful ... maybe for a little bit later of a phase, but you don't want to just get too
greedy." The picture: whites a solid block over the left two-thirds; the right three columns all junk, browns
along the top, blacks below; a few blacks along the bottom under the whites; and, circled, a brown and a black
left at the bottom-left corner. So the target of the block moves is that shape (the twenty-third note), and
not every piece of junk on the left is swept right: a brown kept at the bottom-left (and a black at the
top-left) are tools for later, to haul junk across the whites (§3, "Store blacks top-left, browns bottom-left").
Don't be greedy clearing the left; more specifics to come.

**The twenty-fifth note: with the V there, pull the browns in along the bottom, the blacks over (the user, 13 Nov,
two pictures, `notes/distilling/42-a-brown-looped-in-along-the-bottom.webp` and `43-the-v-browns-in-blacks-over.webp`).**
"once I've got this V shape, that's when I start pulling the browns in, then the blacks down, so you kind of end
up kind of like this, where you can see I've looped some of the browns around, the blacks are then moving over and
again it's like tidying. You can have a bit of a V shape, but ... especially like blacks hanging around at the
bottom left, like you want the V to be made of, this is when you do start wanting browns there, preferably more
than blacks. But at least ... there's enough three columns on the right, so it's still easy to go grab a brown
and pull it over when you need it. And vice versa." The first picture: a drag (orange) from a brown in the
right-hand junk, looped down and along the bottom to the left under the whites, and a short hook at the
bottom-left. The second, after: the whites a block top-left; the junk wraps them, the three right-hand columns
and a row along the bottom, browns looped in at the bottom-left beside the kept black. So the V is the junk
round the whites, the right-hand columns and the bottom; once it's there, its bottom arm should be browns more
than blacks (a brown at the bottom can still rise through the whites; a black there is stuck, the swap rule),
and the three right-hand columns of junk are the store to grab a brown, or a black, from when one is wanted.

**The twenty-sixth note: a white at the top by the fire, beside a spice, filled before it's walled in (the user,
13 Nov, watching the Ultimate on seed 1, `notes/distilling/44-a-white-trapped-top-right-by-a-spice.webp`, and a
second picture a few moves on, not kept).** "something that always would make me anxious that it isn't really
prioritizing ... this top right here. It just moved the brown piece next to it. It should have moved it into that
spot behind the [spice] piece ... where something can potentially get trapped. Like, I would be taking some of
those browns in the far bottom left and be like racing them up there to fill those gaps in." Then, a few moves
on: "It even moved some blacks in the way at the top that actually block getting that white piece out easily.
Like, it was so easy. All you had to do was drag the brown pieces up. Why have you blocked it all in?" The
pictures: a white at the top of the third column from the fire, a spice below-left of it; the bot put a brown
under it and blacks either side of it at the top. Why (traced 13 Nov, seed 1 replayed to the user's board):
the danger zones were only the furnace's column and the one before it, so a white in the third column, however
easily trapped, wasn't urgent, and moves that boxed it in were scored on the board score alone. So: in the three
right-hand columns a white at the top or bottom edge, or beside a spice, is in danger already; its place gets
junk raced to it (from far off if need be), and no move takes away its way out.

**The twenty-seventh note: three columns burned in a row, early (the user, 13 Nov, the same session).** "Did it
just choose to burn things? Like 3 burns just happened in rapid succession before it even made another move. Is
that why it's struggling and failing?" The bots burn a column the moment it's all junk when nothing better is
worth doing (`style.early`). Counted over seeds 1 to 5 for the Ultimate: 46 early burns, 12 within 3 s of the
one before, and 33 of them with whites still in the two columns that would slide up to the fire. Each early burn
brings the whites a column closer with the stock of clear columns used up. So burn early only while the columns
coming up next are clear too.

**The twenty-eighth note: crawls and loops too early; through the V, one big sweeping hook (the user, 13 Nov).**
"it's doing a lot of crawls and kind of looping things up motions while it's trying to get stuff across ... they're
still being done at an early stage when there are much simpler techniques. Like when you've got that kind of ...
V-shaped wall on the right-hand side, you can just drag stuff and loop, kind of hook things in through there in
one big giant sweeping motion. That's really easy. You don't need to crawl things across. That's for ... mid or
late game ... it's certainly getting to more advanced techniques or late game techniques too quickly still, when
there are alternative options open." Why (traced 13 Nov): the phase weights are dropped whenever any piece on the
board is stuck or a white's in danger, and something's nearly always stuck. Over seeds 1 to 5, of the Ultimate's
Stage I moves only one was ranked with the phase weights on; crawls were played 59 times, in every phase. So the
weights should give way only for real danger (the zones by the fire), not for any stuck piece anywhere.

**The twenty-ninth note: a black left one short of its corner (the user, 13 Nov, two pictures, not kept).**
"I don't know what it's just done with this black piece. It has decided to just leave it one short. Why? Like,
there was an extra move there. You could have gotten that right, nice, tucked into the corner. And then that brown
piece kind of right in the bottom middle could have then swept in to kind of help even up the bottom ... with just
a few moves and using that brown in the middle bottom, you have a nice straight thing going on. Like, that's
markedly improved quite quickly." The pictures: in the block phase, a black dragged across the whites and let go a
place short of the junk at the bottom right, sitting among the whites; the user's drag takes it on into the
corner, and then a brown low in the middle sweeps in along the bottom, the bottom row of junk level. So a block
move is carried on to where the junk joins up (the corner, the row) when it's a swap or two more, not let go
where the board score happens to peak.

**The thirtieth note: set a target first, a Crystal Clear to aim for, and build up to it (the user, 13 Nov).**
"some of the things I do in my tutorials, I think really needs breaking down ideally in this as well. It's just
kind of setting a target ... what is your goal? For example, like what masterpieces is this bot getting to?
Because that will determine then ... at what point do you keep trying to build just one more column to be burnt
compared with other options ... we're going to start off just trying to ... get enough whites to do like a
crystal clear 2 or 3 or something, because what your goal is based on ... precedent of what you've managed before
depends on how long you stay in each stage or the simplicity or how complex the tricks you use are ... this is
supposed to be a tutorial, not a straight to crystal clear 12 in one go. You want to kind of build up and start
saying, this is how I build a crystal clear 2. That's the initial tutorial, and then you can control what level of
tutorial you want." Where the bots stand (the eleventh run): no target, only `bank`, the columns of whites to bank
before the chain (4 for the Learner, 6 for the rest); their longest chains average CC^1.1, 1.0, 1.5 and 2.1 (best
CC^4, 2, 5, 5). So a CC^2 or CC^3 is about what they reach now. The idea: a target chain set first (from what
you've managed before, or picked as the tutorial's level), and everything follows from it: the whites to bank, so
how long Stage I lasts and when one more junk column stops being worth it; which techniques that level needs (a
CC^2 with the simple ones, the crawls and hooks only for the longer chains); and Helium's lesson in levels, "this
is how I build a Crystal Clear 2" first, the next level when you're ready. Then (the same day), the bots' levels too: "I don't
want to say able blah blah blah. I want to say what is the bot's target crystal clear and it will try and work
towards it. Like once it's got a crystal clear one, it will start sending them up ... it will just be like one
white column, and it will be like, right, and then it will start working on the next one." So the tiers become
targets: a bot is its target chain, CC^1, CC^2, CC^3 and on; it banks the whites for that chain, sends it up, then
goes back to building toward the next one, and it's judged by its mean chain against its target.

**The thirty-first note: a sorted right side, and new junk brought in in one fluid motion (the user, 13 Nov,
playing Helium's still, `notes/distilling/45-sorted-right-side-one-fluid-motion.webp`).** "once you get to this
nice, organized right-hand side, brown [bottom] and black top, it becomes one fluid motion to bring in new pieces
and keep them sorted. So here you can see you can bring the black down. It's on the right-hand side, but then it's
just super easy. Just you drag it all the way up that channel of brown pieces, and it keeps everything sorted. It's
just so easy to keep. So once there's a nice clear separation, it's just down, up and back up again." The picture:
the whites a solid block on the left and middle; the right four columns junk, sorted, browns low and in the
middle, blacks along the top; the user's drag takes a black from the far left, down and right under the whites to
the bottom of the junk, then up through the browns, zigzagging, to join the blacks at the top. So once the right
side is sorted (browns low, blacks high, the twenty-first note's order, done properly), it's a conveyor: a black
from the left goes down, along and up the brown channel to the blacks in one drag, a brown the other way, and the
sort keeps itself. Not one of the bots' named techniques yet; it's the reason the right side's order matters, and
the payoff of the block phase. Helium's lesson and the read version should say so. The read version does (13 Nov):
the last of the block phase's sections, on the picture's own board (`SORTED_RIGHT`), the drag found by `fluidMotion`
(the fewest swaps: a black from the far left, not a corner tool, down through the whites and then only up, joining the
blacks with the right side no less sorted and no white let in) and checked by `isFluid`; it finds the user's own
drag, down four and up eight to the blacks.

**The thirty-second note: frozen, whites left at the bottom, the blacks' diagonal never cleared; and drags not
carried all the way (the user, 13 Nov, watching a bot, `notes/distilling/46-frozen-whites-at-the-bottom-blacks-left-on-the-diagonal.webp`).**
"Don't know what happened to the bottom of this one. It seems to have just frozen ... It seemed to really neglect
clearing out the diagonal of blacks. It just left them a long time ... those diagonals of blacks on the right-hand
side. And then eventually you end up with these white gaps at the bottom. And it just gets frozen ... there is a
[brown] piece there ... maybe it's stuck because it requires maybe a few moves just to kind of get the brown into
the right position. And then you can use it to drag across a few blacks and then just mass drag them down and
things get easier from there." And again: "it's very bot-like ... it doesn't really still finish dragging things
all the way to the right when it's got the opportunity ... you could go one step further, just do it. Why does it
seem to be limited?" The picture: the right-hand columns junk, but a diagonal of blacks running down through them
left uncleared; whites in the bottom rows under the junk, in the columns by the fire; a brown low in the middle
the user would set first, then use to drag blacks across and the blacks pulled down in one go. So: (1) a stall
with whites low by the fire is the worst case, and a plan of a few moves (set a brown, then the drags it opens)
must be found when no single move helps; (2) the blacks' diagonal through the junk wants clearing early, before
it boxes whites in below; (3) a drag that can carry a piece further right, toward where it belongs, should,
rather than stopping where one look ahead scores best.

**The thirty-third note: early on, the top right first, before the whites there are trapped (the user, 13 Nov, on
position P1 of `distilling-positions.html`).** The bot, 16 s in at CC^8, saved a white low in the middle by setting a
black on its diagonal. "There's nothing wrong with the move that's been shown, but in itself, but priorities, I'd
definitely be going at the top because I see the risk of traps. Because there's blacks at the top and there's just
no way for things to move as freely up there. I'd maybe be dragging those blacks down, and then some of those blacks
at the top from column 10, dragging those through the browns and back through, and just really fixing that top right
corner to get those whites unstuck." So early in the fire phase, whites at the top of the right-hand columns with
blacks round them and no move beside them come before a white lower down that can still be saved later: drag the
blacks there down, and pull column 10's top blacks through the browns and back, until the top right flows again.
Its verdict, `P1` in `src/distill-positions.ts`: the first drag starts in the top three rows of columns 6 to 10.
And on P2, a CC^3 board 16 s in with a white at the top of column 9 above a wall of blacks: "That's shocking, the
state of that board. Alarm bells going off that column 9 has got a white at the top ... I feel like this board is a
reflection of something that's gone wrong far, far earlier, but I think ... the same theme still is risk management
and priorities are not there." The same verdict on `P2`: the top right first. And the deeper lesson: the top right
going bad is the snowball the bots must see coming, from the first look at a fresh board.
And on P3, two whites low in column 9 with 7 s before column 10 goes (the bot dragged one out left): "I'll just be
dragging the blacks down, like the two in column 8. I'll just be going down, down, and then going all along the
columns ... just going down, browns up, they're just really fast, quick, simple, easy moves. I'll just be doing
those." So while nothing's about to burn, the default is the quick sorting moves, blacks down and browns up, not a
careful rescue; the verdict on `P3` (it replaces the one first drawn from the twenty-second note): the first drag
takes a black down or a brown up.
The theme the user drew from P1 to P3: "you need some kind of little agent or something that detects, traps, and
risks and prioritizes which white pieces to try and rescue seems to be the outcome of this." So the bots want a risk
reader of its own: for every white, how trapped it is (no move beside it, blacks round it, walled in from above or
below), how soon its column burns, and how much worse it gets if left; the whites ranked by that, the most at risk
worked first (the top right before a white lower down that can wait), and the quick sorting moves when nothing is at
risk yet. The open verdicts on P1, P2, P3, P6 and P7 are its tests.
And on P4, two whites in column 9 (rows 7 and 9) with column 10 all black and going in 9.7 s; the bot brought a black
beside one white and dragged it out left: "my instinct would just be like, there's a [brown] that can go up, there's
a black that can go down, and take both of those. You'd fill both of those ... spaces in column 9 in 2 moves. So
again, I feel like here I would be prioritising filling those right-hand columns with as much speed as I could,
rather than worrying about how far I can drag this one white piece that's then still going to leave me with a lot
of gaps on the right that I still need to fill." So by the fire, the measure is gaps filled per move: junk raced into
the whites' places, the quickest drags first, not one white dragged a long way. The verdict on `P4`: the first drag
carries junk into a white's place in column 9.
And on P5, CC^8 at 171 s: column 8 white from top to bottom, column 9 with a white at row 3; the bot brought a brown
round, looping, to free column 9's white: "it's a lot closer ... in column 8, there is a piece kind of trapped ...
there's no way of getting an [brown] up to those two at the top of [column] 8 ... Like, why is there so much white in
the gap? ... So I would be, yeah, fixing those top two in column 8, because those seem like the biggest risks. Even
the move itself seems fine, but again, it's missing the bigger danger and priority." The same lesson as P1 and P2: the
whites at the top of the columns near the fire, with no way for junk to reach them, come first. The verdict on `P5`:
one of column 8's top two whites freed.
And on P6, CC^3 at 201 s, whites at the top of columns 8 and 9 with blacks under them; the bot played the diamond,
two drags of five and six swaps from column 3: "Why are we doing these big, long, complicated moves? Like pull those
blacks down at the bottom of column 8. Better yet, again, there are whites that are isolated and trapped at the top of
columns 8 and 9. Like again, something really has gone wrong to even be in that situation. Absolutely, I would be
putting my focus on those trapped white pieces." The verdict on `P6` (it replaces the one first drawn from the
twenty-sixth note): one of those two top whites freed, and not by the diamond.

**The thirty-fourth note: reading the board's state, and how many columns it can still fill (the user, 13 Nov, on
P7).** CC^8 at 589 s, 7.8 s before column 10 goes: whites everywhere, blacks low in the middle columns, browns along
the top; the bot waits ("the column is ready"). "This isn't going to be specific test case answer, but it's going to
probably be fit into more the strategy calculations ... if you think of an enum like there should be like an enum
calculation that then feeds into other areas ... there is risk of not completing a full column ... I'm no longer
thinking about how many pieces can I just generally get over to the left. I'm really starting to get specific about
right how many columns do I think I can actually fill before I then need to start rescuing things out in the middle.
So in this one, biggest risk I see is there are a lot of blacks trapped at the bottom. Especially columns five and six,
they are at risk of being stranded and ruining the crystal clear ... I'll do a quick and easy moves to start with to
fill in those columns on the right hand side. So those two blacks I'd pull down into columns 8 and 9. Browns can go
up. That leaves about 3 or 4 kind of white spots ... my risk analysis is also looking ... at how many pieces are
stuck. So I guess that's definitely a metric that's just really important on a board ... blacks all at the bottom,
browns at the top, there's just not enough movement. So I'd be filling those two columns however I could and then
getting things out of the way to the left as I said, especially those blacks and the brown at the top of column 5
... That's a fantastic example of just things have gone really wrong, and then it would be into damage control, but
you could still get like a crystal clear 6 or" (the message was cut off there).

So the risk reader is more than a ranking of whites: it reads the board's state as one of a few named states (an
enum: say healthy, at risk, damage control) that every other choice reads. What feeds it: how many pieces are stuck
(blacks at the bottom and browns at the top, no movement); how many columns the junk on the board can still fill
before the middle needs rescuing; and junk at risk of being stranded among the whites (blacks low in the middle
columns, a brown at the top of one), which ruins the Crystal Clear. In damage control: the quick, easy fills first
(blacks down and browns up into the columns by the fire, however they can), then the stranded junk out of the way to
the left, aiming for the best chain still in reach, not the target. The verdict on `P7` (it replaces the one first
drawn from the thirty-second note): it moves, its first drag filling a white's place in column 8 or 9.

And on P8, CC^8 at 198 s with 0.9 s before column 10 goes: whites everywhere on the left, columns 9 and 10 junk but
unsorted (column 10 browns at the top and blacks below); the bot waits: "I would be pulling in columns 9 and 10 the
browns really quickly to the bottom and some blacks really quickly up to the top, because to make that zigzag
technique work, you need 2 columns of solid color. And those columns are about to be burned, and once that 1 column
is burned, next you can't then pull the black, move the blacks and browns vertically, because you've lost that column
you need. And then I'd start pulling the blacks down the bottom left, fixing up that V, doing the same at the top. This
is definitely the you've left the V for too long, you've not sorted your pieces situation." So the right-hand pair of
columns is a tool to keep sorted (blacks over browns, the ladder the zigzag climbs) before one of them burns, and the
V sorted well before the late game. In the board's state (the thirty-fourth note), unsorted junk on the right and a V
left too long count as risk too. The verdict on `P8`: it moves, its first drag in column 9 or 10 taking a black up or a
brown down.

And on P9, CC^8's block phase at 102 s: the bot sweeps the brown at column 7, row 3 three swaps onto a white and lets
go: "this feels like it's just stopped. Why not? ... I would keep dragging that down through the blacks to really
reach the bottom. I think the better move would be dealing with the tail at the bottom left. So dragging those browns
at the bottom of 7 and 8 just because then when you do come to that move at the top, you can drag that brown all the
way down through ... yes, that is the relatively priority white piece that it's going for. So it's not bad, but I do
think there's something to be said for the efficiency of sorting that bottom bit out and the kind of tail that you've
got going on there." So in the block phase, a move that makes the next one longer and cleaner (the tail of junk at the
V's bottom sorted first) can beat the priority white, and a sweep goes on while it can. The verdict on `P9`: its
first drag a brown at the bottom of column 7 or 8 taken down.

And on P10, CC^8's block phase at 160 s: whites over most of the board, blacks stranded among them at the bottom
(columns 1, 3, 5 and 7), browns at the top; the bot drags column 8's white one swap down-left, lifting the brown in
column 7, row 5 up to the right. "Why are things only half moving? ... instead of pulling the white left, I would see
this as moving the brown ... up to the right. And then ... pulling the other brown in quick succession ... this is a
board in bad state ... because there's so many trapped pieces. Like black's at the bottom, surrounded by whites,
browns at the top ... the immediate move is fine, but my actual attention is drawn to oh my god, how do I get those
blacks out? So I'd actually be holding off on making any moves because as soon as you ... move those browns up, they
might have been the browns that I needed to rescue the black pieces ... So I think for that reason, that's actually
quite a bad move ... I'd switch strategy or tactics from trying to fill in the white column so they're brown with
fixing cracked pieces." So the board's state (the thirty-fourth note) has a "cracked" reading too: junk stranded
among the whites, which switches the bot from filling the columns by the fire to fixing it, and the browns in the
middle become tools to keep, not junk to send right. The verdict on `P10`: the browns in columns 6 and 7, row 5 left
where they are. ("Half moving": the page draws the bot's drag as it is, one swap; the reason's "down through the
browns" oversells it.)

And P11 (CC^3 at CC^2, 2.5 s before column 10 goes, the board junk everywhere and whites scattered): no verdict, by
the user's choice: "that's just not really a real situation. Like if you're in that, you're just losing ... Start
panicking and trying to get as many things over as you can. You wouldn't get enough over in time ... I don't know how
you would even get into that spot ... not a valid question, because something went wrong." Its lesson is upstream:
the risk reader's job is never to arrive there.
And P12 (CC^8 at CC^1, a brown in column 10, row 2, 2.5 s before it goes up) skipped too: "what really has gone
wrong there? ... if you aren't good enough to avoid that situation in the first place ... the answer is I'll try and
rescue the [brown] by kind of crawling a black and a brown ... over to that trap piece ... drag that brown in column 7
up to column 9, and then like maybe another one so you could get that black at the top of column 6 to go and be the
rescue party. But that's a big if in 2.5 seconds. And as I said, you would not get into that situation if you're any
good." (One swap up-left hands that brown to the top of column 9, sending column 10 up clean with column 9's whole
time left to free it; asked of the user, 13 Nov.)

**The thirty-fifth note: a board reader, thinking in groups and patterns, not one piece (the user, 13 Nov, after
P1 to P11).** "There is a clear need for ... risk management, feature that tells you there's a risk and detects it.
But also what kind of tactics are in play, like, oh look, the biggest problem is maybe even from that risk, that can
be an individual piece that's trapped, but also thinking on a bigger group level of are there risks on the board,
like there's too many blacks and browns at the bottom, we need to go rescue them. Or we're in this phase of the game,
there's a V down there, it's we need to go and fix that up ... I'm sure you can break several things out, like, a
bit of pattern matching of some kind, to even just like be able to think in those bigger terms rather than just in
one piece." So the bots get a board reader of its own, before any move is weighed:
- **Risks, piece by piece:** each white's danger (trapped, no move beside it, junk unable to reach it, walled in;
  how soon its column burns), the top of the columns near the fire above all (P1, P2, P5, P6).
- **Risks, as groups, by pattern:** junk stranded among the whites (blacks at the bottom, browns at the top; P7,
  P10), how many pieces are stuck, how many columns the junk can still fill, the V and its tail unsorted (P8, P9),
  the right-hand pair not a ladder (P8).
- **The board's state**, one of a few named (healthy, at risk, cracked, damage control; the thirty-fourth note),
  and **the tactic in play**, named in words (free the trapped whites, fill by the fire, sort, fix the V, sort the
  ladder, rescue the stranded junk, keep the tools), which every move's weighing then reads.
And after the last position: "those need to be actual features and calculations, not just things of note you're
noting of mine. They need to be like little modules that the bot uses to have information and determine what it's
doing", with tests that it "identifies the right, phases, risks, both at the individual piece level and that middle
pattern level". So each level of the reader is a small pure module of its own with its own tests on the positions'
boards (pieces, patterns, the state and tactic), and the planner decides by their numbers, not by labels.

## 5. Questions only the user can answer
1. Your figure of eight: the crawl as drawn above, or something else ("butterfly")?
2. The hook: the exact drags, and where the black and the brown end up.
3. Stage II channels: how you built them, and in what order the top-right and bottom-right fill.
4. What score or chain earned Excellent and Incredible in your day, and is our own scale wanted?
5. Your speed: minutes per CC^12, and how often you got one.
6. Did the furnace's 15.3 s ever change (with standing, or by version)?
7. Your 2010 simulator (on Flash Museum): its burn control was a key to burn now, or a timer you set?
8. Should our version keep the real-game frustrations: drags that stop on a sloppy path, impossible
   boards, the column-shift glitch? (The glitch: a piece flung as the board shifts loses its links.)

## 7. What we'll build (12 Nov)

The user (12 Nov): "start on the mechanics of building that puzzle, usual kind of modularized stuff",
"check the real Puzzle Pirate visuals to make sure that it matches", "real structure ... and real
challenges for like a timer ... if you actually run through, have some simulations of the puzzle ... this
is how fast you need to do, yeah, the bot completed this to reach crystal clear X, Y, and Z", and the
teaching "very tutorial-like, follow the same principles as in [Tzz's] sailing guide, where it's really
nice and illustrative". In order:
1. **The puzzle (`src/distilling.ts`):** the rules above exactly, knowing nothing of where it's played:
   the honeycomb board, the swap rule, drags, the furnace's ticks and burning early, sending up or
   burning, burnt whites, spice, scoring and chains, the end. Seeded, so a board is the same every time.
   Its look as the real one (`js/den/distill-board.js`), played on its own on an unlinked
   `distilling-test.html`, as Navigation and Foraging were.
2. **Bots (`src/distill-bots.ts`, `tools/distill-bots.mjs`):** one per tier (section 4), each playing by
   the techniques (sort the junk, store blacks top-left and browns bottom-left, the crawl, channels,
   when to burn), not a search no person could do, run over many seeded boards for what each tier
   reaches and how fast. Those runs become the goals: "the bot reached CC^12 in 3 min 20 s".
3. **The tutorial,** after the user's pointer to the real one: Helium showing each technique on a real
   board, animated, then "now you try", in the style of Tzz's balloon lesson.
   **Each technique demonstrated, and funny (12 Nov):** "I'd love to see like demonstrating each of the
   techniques, like the hook, clearing each stage, obviously each thing should be funny." So a short
   demonstration per technique (the hook, the crawl, the figure of eight, the leapfrog, channels, when
   to burn) and per stage of a run (§3), each a little scene with its own joke. **Not drunk jokes:** the
   user first had them drinking each demonstration's beer, then dropped it: "forget that part, I think
   we've already got the [Kikkit] being the drunk part, he's just the creator of these things." Helium's
   humour is the maker's: proud of their brews, their mishaps when the balance goes wrong (item 4).
   Each demonstration shows its plan on the board before they start (RULES.md, "A demonstration shows its
   plan before it builds"), the lesson the user drew from Tzz's Bingo.
   **"Help, Helium" while you play (12 Nov):** "playing and be able to press a button that says help
   helium and he starts showing you some moves on how you could get yourself out of the situation." So
   mid-game a button asks them, and they play the routine your board needs from where it stands (the same
   technique routines the bots and the lesson use), a few moves shown on your own board, then hands it
   back.
   **Context-aware, better than a set lesson (12 Nov):** "helium should kind of detect what stage you're
   at and show you what technique. So should you be getting things to the left? ... how you should be
   organizing the pieces should you be using hooks? ... Oh, this is how I would rescue that piece. Look, I
   would draw these together in this way, the brown and black working together. You should be showing you
   like techniques relevant to the situation, I guess, is a lot better than a structured tutorial. It's
   context aware." So Helium's teaching is mostly "Help, Helium": they read your board (the planner's
   stage and the routine it would pick, and why), say it in a line in their voice (whites left now; save
   that white at the top; time for the hook), and plays it on your board as the one smooth drag. A short
   opening lesson can still show the basics first.
   **The distiller in the panel becomes Helium (12 Nov).** The panel's top strip has a pirate distiller
   by the barrels, as the real one does; ours is a stand-in (a green coat, red sash, tricorn), drawn from
   the research's description, not anyone in particular. The user, seeing it: "I'm not sure what this
   graphic is either ... some kind of distilling sensei figure? ... it could work." So once Helium's drawn
   (from their portrait, checked first), they're the one standing at the still, and the one who steps in on
   "Help, Helium".
4. **Helium and their island** (IDEAS.md, "Helium, and Distilling"; their portrait checked first): their own
   little island, perhaps by the smugglers' beach, their still on it, and their mishaps: when they get the
   balance wrong, the still goes up with a bang ("Oops. That happens sometimes. Don't worry about it.").
   A burnt column in the puzzle could be its little bang.
   **Built, a first pass (12 Nov):** their island past the checkpoint (`?at=helium`; src/den-helium.ts,
   js/den/helium-isle.js), a short opening lesson on a real board (the swap rule, whites left and junk
   right, the furnace's column burned, and a white burned: their bang and line), then your session at their
   still, "Help, Helium" on H (`advise` said in their voice, naming the technique, its drags played on your
   board), the bang whenever a white burns, and the panel's distiller drawn as them. Still to come: a
   demonstration per technique, the coached replay (IDEAS.md), the smuggling ring.

## 6. Sources
- YPPedia, Distilling: https://yppedia.puzzlepirates.com/Distilling (rules, scoring, CC^12, history, tips)
- YPPedia, the official game document: https://yppedia.puzzlepirates.com/Official:Distilling (controls,
  weights, the flask, the successive-column bonus); its swap diagrams and flask pictures
- YPPedia, Nickbush's tutorial: https://yppedia.puzzlepirates.com/User:Henryrules10/Distilling_tutorial
  (modes of movement, stages, white columns banked by standing)
- YPPedia, Puzzle scoring: https://yppedia.puzzlepirates.com/Puzzle_scoring ; Duty report:
  https://yppedia.puzzlepirates.com/Duty_report ; Puzzle standing: https://yppedia.puzzlepirates.com/Gm
- The client port: puzzle-practice's Puzzle_Practice, Distilling "on the client's rules", decompiled from
  the game's `crafting/brew` and checked against the real classes on six seeds:
  https://github.com/jared-morgan/Puzzle_Practice/pull/10 (now https://github.com/puzzle-practice/Puzzle_Practice,
  `src/puzzles/distilling/logic.ts`, `index.ts`, `practice.ts`; site https://puzzle-practice.github.io/Puzzle_Practice/)
- Ryuken's Illustrated Distilling Guide (a 2017 forum post, copied at
  https://dopcaabsolute.weebly.com/puzzle-pirates-distilling-guide.html): crawling, rows, spice traps,
  black tips, board choice
- Fullbeard University, Distilling: Basic Strategy (2008):
  https://fullbeardu.blogspot.com/2008/10/distilling-basic-strategy.html , and Sonnyz' videos:
  https://fullbeardu.blogspot.com/2008/10/distilling-sonnyz-videos.html
- The user's own Distilling Simulator (Dachimpy.com, 2010), playable at
  https://flashmuseum.net/game/yohoho-puzzle-pirates-distilling-simulator-3tr/
- Videos: SonnyZ Distilling Tutorial 1, https://www.youtube.com/watch?v=pg4JolCRHfk ; Yassenn's
  "Distilling Tutorial: 1 The Basics", https://www.youtube.com/watch?v=-vFZX3HhdN0 ; a playlist,
  https://www.youtube.com/playlist?list=PL83C33242A772CE01 (titles only seen, not watched)
- Not reachable: the old Puzzle Pirates forums (403) and archive.org copies, so Sonnyz' "12 tips" thread
  and the forum distilling tutorial (thread 16632) weren't read.
- The crawl and channel sketches were checked by a small brute-force search on the swap rule.
