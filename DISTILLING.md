# Distilling: design document

A draft, from research on 12 Nov, for recreating Puzzle Pirates' Distilling as a browser puzzle with
bots. The rules below are pinned down well: besides YPPedia and the old guides, there is an open-source
practice site whose Distilling was ported from the real game client (its `crafting/brew` code) and
checked against it move for move (see Sources, "the client port"). Where that port gives a number, it
is the game's own. Anything unclear is marked **(to confirm with the user)**.

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
