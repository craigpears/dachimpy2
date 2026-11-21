# Rumble: the design document

Rumble (or rumbling, the brawling puzzle) as Puzzle Pirates plays it, researched 21 Nov 2026 from YPPedia's
pages: "Rumble", "Official:Rumbling" (Three Rings' own words), "Rumble strike calculations", "Rumble sprinkle
calculations" and "Rumbling drop pattern", "Bare fists", and Boothook's Rumbling Guide (a top rumbler's own study
of it). Where they disagree, or say nothing, it's marked, with what the den does for now.

The rules are `src/rumble.ts` (knowing nothing of the den, clock and dice handed in), its bots
`src/rumble-bots.ts`, its test page `rumble-test.html` (a duel against a bot, or `?watch` two bots, both boards
side by side), drawn by `js/rumble-view.js`. Tested in `tests/rumble.test.ts`.

## 1. The board and the shot

- **A bubble shooter.** "Similar to Snood, Bust-A-Move, Puzzle Bobble." Balls hang from the top of the board in a
  hexagonal pack ("the puzzle plays in diagonal rows"). You fire balls up from the bottom; a ball travels straight,
  **bounces off the sides**, and sticks where it meets the mass (or the top).
- **Five colours:** red, orange, yellow, aqua, blue. Bruising is a state of a ball, not a sixth colour (one page's
  summary calls bruised a sixth; the main page is clear it isn't).
- **Nine balls across.** A full row of sprinkles is 9 balls, and the widest strike is 9 wide. The den's board: every
  row 9 cells, alternate rows half a ball over. *Not given anywhere: how many rows tall.* The den's: 13, the first 5
  filled at the start (also a guess).
- **Two fists.** Two launchers at the foot, one per fist, both aimed together (the mouse, or the arrow keys). Z or
  the left button fires the left fist, X or the right button the right. Each fist holds a ball and you can see what's
  next in it ("the balls in your launcher queues"). One ball is in the air at a time: the next shot comes once the
  last one has landed and resolved. *Not given: how the next colours are picked.* The den's: at random, all five
  alike.
- **The shot clock.** About five seconds to fire after getting a ball, or the game fires for you (the ball jiggles
  first as a warning).
- **The board drops.** After every **eight shots**, a new row comes in at the top and everything moves down one.
- **You lose** when your balls go below the line at the bottom of the board.
- **Boxing** is the same with one fist (YPPedia: added 5 Feb 2008). Not built.

## 2. Groups, clears and dropoff

- A fired ball that makes a **group of three or more** of its colour (touching, bruised balls not counted) clears
  the group. Any balls no longer hanging from the top fall off too: **dropoff** ("loose balls"). Dropoff falls
  whatever it is, bruises included.
- A clear next to a bruised ball lightens it one stage (§4).

## 3. Charging and combos

- **Charging:** hold the fire button about a second before letting go. A charged ball that makes a group of three or
  more **doesn't clear it**: the group stays, charged, and is **recorded in order**. A charged ball that makes no
  group loses its charge and is an ordinary ball.
- **Triggering:** hit a charged group with an ordinary (uncharged) ball. That group and **every group recorded after
  it** clear together, a **combo**; groups recorded before it stay charged. So triggering the oldest group gives the
  biggest combo, and a later one is there if the oldest is blocked.
- Each group cleared is one **combo counter**. A charged group knocked loose while the combo goes off still counts.
  Loose ordinary balls add to the attack's size but not its count.
- *Not given: a charged ball fired into a group that's already charged.* The den's: it joins the group as an ordinary
  ball, neither triggering it nor recording another.
- *Not given: whether the trigger ball counts in its group's size.* The strike tables count "2 uncharged balls + 1
  charged ball" as the smallest group, so the den doesn't count the trigger ball.

## 4. Bruises

- A bruised ball keeps its colour underneath, but doesn't join groups. Two stages: **dark**, then **bruised**, then
  normal. Each clear next to one lightens it a stage ("do this 2 times and the ball will be back to normal"). One
  that comes loose falls with the rest.
- Bruises come three ways (the official page): a **charged ball pushed out of its group** turns into one; **strikes**
  carry them (§5); and the **new rows** from the board dropping can bring them, more as the game goes on.
- The new rows' bruises: the game keeps a hidden count, up for every ball you remove, down for every ball you send.
  If it's above nothing when a new row comes, each new ball has a chance of being dark. *The chance isn't given.*
  The den's: the count over 150, at most a half.
- The den makes every bruise start **dark** (two clears). The main page says a pushed charged ball "may be darkened
  or bruised"; the official page just says it turns into a bruise.

## 5. Attacks: what a clear sends to the other board

A combo of **one** counter (a plain clear, or a charged group triggered on its own) is a **sprinkle**; **two or
more** is a **strike**.

### Sprinkles: from the bottom

- Each clear adds to your **sprinkle queue**: half the balls popped (the trigger ball included, rounded down), plus
  a third of the dropoff (rounded down). Popping 5 with 7 dropoff: 2 + 2 = 4.
- The queue goes only when it holds a **full row, 9**, and then all of it at once. More than **two full rows (18)**
  and it's **squished** to one row of 9, so a single huge clear can't bury anyone.
- *Where the formula breaks:* a very big pop sends less than it says (16 then 8 sent 9, not 12). One theory is that a
  single pop makes at most 5; the den's caps a pop's own half at 5 (its dropoff's third isn't capped, which matches
  the hint video 3 3 3 4d22 → 12).
- *"Sprinkle scaling"* (Boothook, 2006): early on it takes 18 balls for a row, until both players have sprinkled.
  Not known to be still in the game; not built.
- **How they land:** the balls fly **up from the bottom**, each up its own column, and stick to the first thing they
  meet (an "umbrella" of your own balls across a few columns catches them). The first row uses the bludgeon's
  **single-row** sprinkle pattern; balls past the first 9 use its **multi-row** pattern, at columns that look random.
- A warning shows at the foot of your board before sprinkles come.

### Strikes: from the top corner

- **Which corner:** a combo set off with your **left** fist strikes the **top-right** of the other board; with your
  **right** fist, the **top-left**.
- **How they land:** a strike **pushes itself onto the board**, shoving the balls under it down to make room, so it
  scrambles what was there, breaks up groups, and turns charged balls pushed out of their groups into bruises. It
  "staggers" as it's pushed in (on hexes, a column pushed down an odd number of rows shifts half a ball).
- **Size:** look up the number of groups for a base height and width, then add the dropoff and extra-ball modifiers
  to the width (extra balls: every ball in a group past 3, over the whole combo). The widest is the board's 9.

  | Groups | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 |
  |---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
  | Base height | 1 | 2 | 3 | 3 | 4 | 5 | 6 | 6 | 7 | 9 | 11 | 12 | 14 | 16 | 18 | 19 |
  | Base width | 7 | 5 | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 3 | 3 | 3 | 3 | 2 | 2 | 2 |

  Dropoff modifier (to the width), by groups and total dropoff 0, 1, ... 8+:

  | Groups | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8+ |
  |---|---|---|---|---|---|---|---|---|---|
  | 3 | 0 | 0 | 0* | 0* | 3 | 3 | 4 | 4 | 4 |
  | 4 | 0 | 0 | 1+ | 1+ | 3 | 3 | 4 | 4 | 5 |
  | 5 | 0 | 0 | 2 | 2 | 3 | 3 | 4 | 4 | 4 |
  | 6 | 0 | 0 | 2 | 2 | 3 | 4 | 5 | 5 | 5 |
  | 7 | 0 | 0 | 1 | 1 | 3 | 3 | 4 | 4 | 5 |
  | 8 | 0 | 0 | 1 | 2 | 2 | 2 | 4 | 4 | 5 |

  \* 1 instead if exactly one extra ball. + 2 instead if at least one extra ball.

  Extra-balls modifier (to the width), by groups and total extra balls 0, 1, ... 9:

  | Groups | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
  |---|---|---|---|---|---|---|---|---|---|---|
  | 3 | 0 | 0 | 1 | 1 | 2 | 2 | 3 | 3 | 4 | 4 |
  | 4 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 3 | 3 |
  | 5 | 0 | 0 | 1 | 1 | 1 | 2 | 2 | | | |
  | 6 | 0 | 0 | 1 | 1 | 1 | 1 | 1 | 2 | | |
  | 7 | | | | 1 | | | | | | |
  | 8 | | | | | 1 | | | | | |

  *Gaps in the tables:* nothing is given for 2 groups' modifiers, or past 8 groups, or the blank cells. The den's:
  2 groups take 3 groups' modifiers; past 8 groups take 8's; a blank cell takes the last number given on its row
  (or 0 before any, 1 from the first given on the 7 and 8 rows).
- **Bruises in a strike:** one for every dropoff ball, at most **half the strike's balls** (rounded down). Boothook's
  rule of thumb: (groups − 1) × 4.5. A table: 2 groups at most 4, 3 groups 9, 4 and 5 groups 13, 6 groups 18.
  The den scatters them at random through the strike.
- A warning shows in the corner of your board the turn before a strike comes in.

### When attacks land

"There is a delay that occurs before my attack reaches your screen"; the warning comes "on the turn before you
receive" it. The den's: an attack lands on the other board **after their next shot**, the warning showing until
then. In a duel nothing cancels an incoming attack (defending is a team rumble's, and isn't built).

### Bludgeons: the drop pattern

What you send is laid out by your **bludgeon's drop pattern**: its top rows (four to six) the strike pattern, used
from the bottom row up (more rows than it has repeats its top four); its bottom two rows the sprinkle pattern, the
single-row then the multi-row. A bludgeon's colours change the colours, not the pattern (and some colours mirror
it). 17 bludgeons (bare fists, belaying pin, blackjack, brass knuckles, ... skull rings), each balanced for a style.
YPPedia shows their patterns only as pictures. The den's duel has the **bare fists** only, its sprinkles as
YPPedia describes them (red in columns 1 to 3, and so on, RRRYYYOOO; the multi-row a different colour in the
middle, "CYC", one point of contact in the middle of the board). *Its strike pattern isn't given in words:* the den's
is a stand-in of diagonal stripes, to be checked against the picture.

## 6. Strategies, by name

From Boothook's guide and YPPedia's (each the writers' own opinion, as they say).

- **Sprinkling / turbo-sprinkling:** shoot fast and clear whatever you can, uncharged, dropping loose balls; sends a
  steady stream of sprinkle rows. Fast and keeps your board clear; too much just hands the other side big, easy
  groups to clear and send back ("**sprinkle tennis**").
- **Striking (combos):** charge groups, then trigger the oldest. Strikes flatten and scramble the other board, bruise
  its charged groups, and are harder to clear; slow to build, and an incoming strike can wreck yours.
  - **Small strikes** (2 to 3 groups, quick, the den's "short 3-pop bludgeons"): hard to interrupt, constant
    pressure, but weak at bruising.
  - **Large strikes** (8, 10 or more groups): only they break a well-hidden combo, and late in the game they usually
    win it; while you build one you aren't attacking.
  - **Injecting bruises / bruise farms:** drop loose balls *during a combo* to turn the strike's balls into bruises,
    up to half of it (a 3 or 4 group strike with its bruises maxed is a strong opener). A **bruise farm**: a group
    left collecting the other side's sprinkles, to be knocked loose in a combo later. "If you can make a really big
    sprinkle attack, you probably should be making a strike instead."
  - **Holding a trigger:** keep a ball of the first group's colour in one fist while building with the other.
  - Build combos in the **middle** early (the sides are for sprinkles); put a charged ball in the **middle of a big
    group** so strikes can't knock it out; keep the first group unburied, better two groups apart.
  - **Vary the timing** of strikes, keep sprinkling while you build a big one ("hiding your strikes").
- **Keeping the board clear, flat, and its middle clean:** a clear board can't be scrambled; a flat one doesn't
  break sprinkles into bits; a **spike** in the middle is hard to clear.
- **The umbrella:** a line of your own balls across a few columns to catch sprinkles before they reach what's under
  it.
- **Don't under-strike or over-strike:** "It is much easier to clear now and strike later".
- **Constant pressure** often beats quality.

## 7. What the den's basics are, and what's next

Built (21 Nov, the user: "start out the basics for now"): the rules above on two boards; a duel against a greedy
bot, or two bots watched, both boards side by side, so you see what your moves do to the other board.

Next, on the idea card `rumble-bots-with-different-strategies-to-demo-th`: bots that each play one of §6's styles
(aggressive sprinkles, short 3-pop strikes, 3 or 4 group strikes with bruises, 10+ group combos), plugged into
`src/rumble-bots.ts` as a `Style`. Rumble in the den as boxers: the idea card
`rumble-as-boxers-big-brawlers-in-boxing-mode`.

The first playtest (21 Nov): both fists aim at the mouse, each line in its ball's colour, the other line gone once one
is held ("it should go where the mouse is aiming at"); slower, the ball flying 15 ball widths a second and the bot
taking about two seconds a shot ("seems to just move very quickly"); attacks animated in, sprinkles rising up from
the foot one after another and a strike punched in at the top, shoving the balls under it down. An idea to think
through later: firing both fists at once, both balls in the air together ("I don't know if that's an interesting
idea that adds any tactical depth"); the real game allows one ball at a time.

## Questions to settle

- The board's height in rows, and how full it starts.
- How the launchers' colours are picked (at random, or from the colours on the board).
- Bare fists' strike pattern, from its picture.
- Exactly when an attack lands (a shot later, or a time).
- The new rows' bruise chance.
