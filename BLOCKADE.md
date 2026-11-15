# Blockades: the design

A proof of concept on the unlinked `blockade-test.html` (15 Nov). Its rules are `src/blockade.ts`, its bots
`src/blockade-bots.ts`, every ship's damage `src/ship-damage.ts`, the imperial gate `src/imperial-gate.ts`, each
ship's handling `src/ship-handling.ts`. Its 3D is `js/den/blockade.js`, the gate's `js/den/gate-look.js` and the
damage's `js/den/ship-damage.js`. Tests: `tests/blockade.test.ts`, `tests/ship-damage.test.ts`,
`tests/ship-handling.test.ts`.

## 1. What was asked (15 Nov)

- "Go study blockading and how blockade boards look, because I think we're ready to do a nice kind of blockading
  concept here, where you've got sideways for the sloops and you've got a few bots ... competing, trying to get to the
  points. The [war frig] bots are there trying to blast their way through while the sloops are more nimble, taking
  the shortcuts, taking those sideways in, just like winds and things now. Keep it like relatively close. Don't do
  all like the new mechanics ... I want to get ambitious now."
- The imperial gate: "the sloop can run through it. The ship, the war frig has to shoot through it because there's
  only one tile of ... canal between the Imperial Gate ... It's a way of naturally delaying the war [frigs]. Like,
  they have to go through a shooting destruction phase before they can get into the heart and center of the board."
- Side ways: "only the sloops can really get to on those fast little winds."
- Damage: "as it starts getting chipped away or shot, damage goes up, and you should visibly start seeing some holes
  and bilge appear ... a few like carpentry bots on board the [war frig], slowly repairing or bilging out ... I want
  the war frig to feel alive and look alive ... a ship full of people puzzling ... see a hole and see an explode or
  bang and a hole appear in the side of the war frigate as I shoot it, and for it to appear where I've shot it. I
  want to shoot the sloop from the war frigate and see it just go dead in the water ... they then have to sit there
  and rebuild."
- Handling: "I want the big ships to feel clumsy. They're powerful but clumsy." Her moves as big as her turn, her
  turns of moves fewer: "slower to react". And the sloop's speed from the sea, not her moves: "getting in there faster
  comes from the opportunities you have to go take [winds] that the [war frig] doesn't have access to."

## 2. Puzzle Pirates' blockades, as researched (YPPedia)

- A blockade board is a big sea battle board: rocks, winds, whirlpools, and buoys.
- A buoy has one, two or three pennants: that many points each turn. At the end of a blockade turn, a buoy in the
  influence circle of one side's ships only scores that side its pennants; both sides' circles reach it, it's
  contested and scores nobody; nobody's, its flags are yellow. Bigger ships have bigger circles.
- Rounds are won on points, not sinks (sinks matter only in a sinking blockade, or a long war).
- Damage: a war frigate's full damage is 15 large, 20 medium or 30 small shots. Damage fills the bilge faster, and
  water slows her (her move tokens come more slowly). Carpentry takes damage off and slows the water coming in.

## 3. What's built

- **The board** (`BLOCKADE`): 30 by 28 squares; both sides come in at its foot, a war frigate and two sloops each
  (Dachimpy's flag: Primates Rule, Lucky Banana, Grin and Bear It; Dalnoth's: Iron Pride, Red Wake, Smoke and
  Mirrors). A wall of rocks across it, two deep, between the open sea and its heart, with three ways in:
  - **the imperial gate** in the middle: its way one square wide under its arch, a tower two squares wide either
    side, its bastion guns on the wall. The sloops run straight through; a frigate lies broadside to a tower and
    shoots it down (6 large shots, both of each broadside on it: three broadsides), and then the way's three wide
    for anyone. Its guns leave you be till someone fires on the gate, then fire on whoever's in reach (holing her
    for the gate's medium shot's damage); any ship's hits quieten one, three wreck it;
  - **a side way at each flank**: a one-square gap in the wall with a wind blowing up through it from the open sea,
    and a wind along the heart from each toward its middle. A sloop on one is carried along it, fast; a frigate
    rides them out (and wouldn't fit the gap anyway).
- **Buoys**: three out on the open sea (one, two, one pennants) and three in the heart (two, three, two). Influence:
  2 squares from any of a sloop's squares, 3.5 of a frigate's. Scored every 10 s (a blockade turn); a round is 5
  minutes.
- **Damage** (`Damage`): each hit a hole where it struck (along her, which side), its damage by the gun's size (a
  small shot 1, a medium 1.5, a large 2: YPPedia's proportions). Full damage: a war frigate 30 (YPPedia), a sloop 6
  (not checked: three of a frigate's large shots). Her carpenters patch the oldest hole first, her bilgers pump,
  both quicker with more stations (by the square root of her carpentry and bilge stations: a frigate's 18 and 12, a
  sloop's 2 and 2). Water comes in in proportion to her damage and slows her moves (up to 60% longer, full). At full
  damage she's knocked out: dead in the water, no influence, till her crew have her back under 60% (a non-sinking
  blockade's way).
- **Seen**: a hole made with a bang where the shot comes down, a dark hole ringed with raw splintered wood (it shows
  on black paint), patched with a fresh plank that weathers away; her carpenters hammering while there's a hole, her
  bilgers pumping and water spouting over her side while there's water; sitting lower and listing as she fills;
  smoking when badly hurt; knocked out, listing hard, low, smoking dark and turning slowly where she lies.
- **The bots**: greedy, as the puzzles' are. Each looks round every 2 s for the buoy most worth her while (its
  pennants; more if the other side holds it or it's contested; less if a friend's already on it) for how far it is;
  a frigate with the gate shut weighs shooting it down instead (worth the heart's pennants), lies broadside to a
  tower and fires till it's down; a frigate weighs the heart's buoys up (what she's come for). Each fires a loaded
  side whenever it would hit an enemy and no friend, a tower she's come for, or one of the gate's guns firing on her.
  Blocked by another ship, a bot makes a move of her own rather than wait for ever.
- **You** sail one ship (Primates Rule to start; any of them by clicking her in the list, or `?ship=` her number;
  `?watch` for the bots alone).

## 4. Balance, as it plays (bots, five seeded rounds)

- The sloops are into the heart by the side ways at 14 to 25 s; a tower's down at 25 to 37 s; a frigate's in the
  heart in three rounds of five (41 to 68 s), knocked out by the gate's guns before it in the other two. Scores close
  (52 to 110 a side).
- A frigate's big moves keep her middle on every other square (it moves two at a time), so she can only line up with
  half the gaps two squares wide. So the gate's towers are two wide: crumbled, the way's three wide, and any frigate
  fits. Any narrow way meant for a frigate wants three squares, or two placed for her.

## 5. To shape with the user

- Whether the frigate's handling feels right: as quick as the sloop over open water, clumsy (her turns of moves half
  as long again), the sloop's speed the winds'.
- The sloop's full damage (6 small shots, not YPPedia's yet), and how long a knocked-out ship takes to rebuild.
- Rams and rocks doing damage (YPPedia's), whirlpools on the board, more buoys or rounds, a sinking blockade.
- The bots playing as teams (escorting, holding a buoy together), sloops darting in to fire and run.
- Puzzles for you aboard: your carpentry and bilge (the den's own boards) instead of the bots' crew.
- Where it goes in the den: a blockade at Port Decorum, Daquan's flotilla (IDEAS.md).
