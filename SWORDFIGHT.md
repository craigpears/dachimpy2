# Swordfight duels

Puzzle Pirates' Swordfight, two players, each on a board of their own, every break of yours landing on the other's.
Researched 21 Nov for the duel test page (`swordfight-duel-test.html`). The rules are built in `src/swordfight.ts`
(the one Swordfight module: the den's armoury hoist plays the same board), its bots in `src/sword-bots.ts`, the
page drawn by `js/sword-duel-view.js`.

Sources: YPPedia's [Swordfight](https://yppedia.puzzlepirates.com/Swordfight) (the board, attacks, chains, winning,
instakills, Dueling), its [Swordfighting drop pattern](https://yppedia.puzzlepirates.com/Swordfighting_drop_pattern)
(colours) and the [Black Death Sword and Sprinkle Placement Guide](https://yppedia.puzzlepirates.com/Black_Death_Sword_and_Sprinkle_Placement_Guide)
(where everything lands); the drop patterns' colours from [Mantid's Sword Patterns](https://ypp.mantid.org/swords).

## 1. The board and what a break sends (as the den already had it)

- 6 wide by 13 high; pairs come in at the top of the fourth column at a steady pace. You lose when the fourth column
  is full, so no pair can come in; in a duel the other side wins.
- **Both players get the same pairs** in the same order (Black Death: "your opponents get the same pieces as you").
- A breaker shatters everything of its colour it's connected to (side by side or one above the other).
- **Sprinkles:** one for every two loose pieces broken (breakers count), rounded down, region by region, times the
  chain's link (a single 1x, a double 2x...).
- **Strikes:** a fused block (2x2 or bigger, one colour) sends a sword. Square or taller: an upright sword the same
  size; wider: a sideways one. A 2x2 sends a 1x4, a 3x3 a 2x4. Wider than 3 upright: the excess width goes onto its
  length (5x5 → 3x7); taller than 3 sideways: the excess height onto its length (5 wide by 4 high → 6x3). A chain
  multiplies the block's longest side first (its height when square).
- Attacks carry blocks only, never breakers.

## 2. When an attack lands

- An attack shows at the side of the board for a turn (flashing), then comes in (Black Death: you can block a
  sideways sword "on the turn where you see the horizontal flashing at the side" by completing a gem in its path).
  **Built:** an attack sent at you waits, shown over your board, and comes in when your falling pair lands.
- **A sword** lands as an immovable sword picture for one turn, then turns into opaque grey blocks, translucent the
  turn after, ordinary blocks after that. **A sprinkle** comes in as an opaque grey block and decays the same way.
  A "turn" is a pair of yours landing. Grey blocks can't be broken or fuse till they've turned.
- Swords enter in the order they were broken; the den drops an attack's swords first, then its sprinkles.

## 3. Where swords land (vertical)

- Two queues **shared by both players** (each player's swords move both on): the column a sword aims at, and
  which hand it is.
  - The k-th sword of the duel aims its left edge at the second of the columns it fits in, then on round them in
    turn: a 1-wide sword 2, 3, 4, 5, 6, 1; a 2-wide 2/3, 3/4, 4/5, 5/6, 1/2; a 3-wide 2/3/4, 3/4/5, 4/5/6, 1/2/3
    (any sword moves every queue on one).
  - Hands alternate: the first sword right-handed, then left, right...
- A sword that can't land where it aims moves over a column at a time, right-handed to the right first (then to
  the left), left-handed to the left first:
  - **never into the fourth column** unless nowhere else will take it (so a 3-wide sword lands in 1/2/3);
  - never on top of another sword;
  - always where the whole of it fits if anywhere does, otherwise where most of it fits; what doesn't fit is wasted,
    and a sword with nowhere at all to land is wasted, never kept for later.
- It falls till it rests on what's in its columns.
- Colours: the attacker's drop pattern, column for column, the sword's bottom row from the pattern's bottom row up.
  Longer than the pattern, it goes on from the pattern's fourth row from the top, round those top four again (a
  pattern under four rows tall repeats whole).

## 4. Sideways swords

- Enter from the side of their hand (the first sword of the duel from the right), as far in as they go, at most
  the board's 6.
- Their height: with no fused block on the board, their top two rows below the highest piece (rows 1/2 or 1/2/3 if
  that's low; and rows 1/2 if the board is full to its top row); with fused blocks, their top three rows below the
  bottom of the lowest one. Never in row 13.
- Blocked at that height (a gem, or another sword), it tries the other side at the same height, then lower, then
  higher. If at least half of it can't get in anywhere (any sideways sword 12 long or more), it turns upright, a
  vertical sword of the same length.
- Colours: the drop pattern turned on its side, the side it came in from: from the left its top row is the
  pattern's first column, read from the pattern's bottom row as it goes in; from the right, mirrored.
- **Built simplification:** the guide's sides and heights are followed; any piece in its way stops it (the guide
  names gems and swords; it doesn't say loose blocks don't).

## 5. Where sprinkles land

- An attack's sprinkles all start on one side, the sides alternating attack by attack, shared by both players,
  the first of the duel on the right: from the right, one in column 6, then 5, 4... round again; from the left,
  1, 2, 3...
- A sprinkle meant for a full column is wasted, never moved to another. Column 4 takes them only 10 high, so
  sprinkles can never knock anyone out.
- Colours: the attacker's pattern's bottom two rows: the first sprinkle into a column its bottom row's colour, the
  second its second row's, the third its bottom row's again...

## 6. The insta (instakill)

A sword landing in the fourth column fills it and knocks the other side out at once: "an instakill, or insta". Swords
avoid the fourth column, so an insta is built: keep the other side's columns 1-3 and 5-6 blocked (their own stack,
or your swords sent first in the same attack), so the last sword of a combo has only the fourth column left, or send
a sword so long it has nowhere else to fit whole. Sprinkles can't do it. Bots that try to build one are an idea card,
`swordfight-duel-bots-with-different-strategies-o`.

## 7. Drop patterns (`SWORDS` in src/swordfight.ts)

Every sword's pattern is 6 wide, 3 to 6 rows tall; its enamel colours change the pattern's colours (and a blue,
green or purple guard mirrors it). The den's are each sword in red/red, as Mantid's tool shows them, written top
row first:

| Sword | Pattern (top row first) |
| --- | --- |
| Cutlass | rrggyy bbbygg ggbbrr ggbbrr yygbbr yyggbb |
| Rapier | ygrybr rgbgby rrbgyy gggbbb rggbby rrgbyy |
| Foil | ggbbyy ggbbyy rrggbb rrggbb |
| Falchion | yyggrr ybbgbr rbgbby rrggyy |
| Skull dagger | ggyrgg gbyrbg gbyrbg bbyrbb byggrb |
| Stiletto | bbyrgg brgbyg brbgyg bbrygg |
| Long sword | bbrryy bggggy ybrryb ybrryb bbggyy bbrryy |
| Saber | gbbrry gggyyy gggyyy grrbby brrbbb bbbrrb |
| Stick | yrbbgy rrbbgg rrbbgg |

(and in Mantid's: backsword, cleaver, dadao, dirk, katana, poniard, scimitar, short sword, all in `SWORDS`).

## 8. Not settled

- Whether your own break, landing while an attack waits for you, cancels any of it (Super Puzzle Fighter's
  "counter"). Nothing on YPPedia says so; built: attacks never cancel.
- How fast pairs fall in a duel, and whether it speeds up. Built: the den's armoury pace, a row every 0.6 s.
- Whether sprinkles and swords from one attack land swords first. Built: swords first.
- Whether loose blocks (not only gems) stop a sideways sword. Built: they do.
