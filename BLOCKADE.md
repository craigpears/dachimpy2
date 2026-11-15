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

## 3. What's built (15 Nov, the second pass: "blockading is a bit more epic")

- More asked: "just to be clear, this should be like the race where you see ... the little pirates on each ship ... a
  bigger team ... a good handful of sloops each side and ... three or four [war frigs] ... coming from different
  directions ... Some ocean, some island, so you should be able to just spectate and watch, and I want it to really
  showcase each of those mechanics ... sloops hiding out, sometimes coming out ... while [war frigs] are having a fight
  to land a few pot shots."
- **The board** (`BLOCKADE`): 44 by 36 squares. Each side three war frigates and five sloops, coming in from two edges
  of its own: Dachimpy's flag from the south and west (Primates Rule, Coral Throne the Atlantean, Golden Grin; Lucky
  Banana, Grin and Bear It, Cheeky Monkey, Bananarama, Coconut Shy), Dalnoth's from the north and east (Iron Pride,
  Eldritch Wail the ghost ship, Crimson Tide; Red Wake, Smoke and Mirrors, Scarlet Fever, Blood Orange, Rust Bucket).
- **The heart, a walled fort in the middle**, two deep, with four ways in:
  - **an imperial gate** in its south wall and another in its north: its way one square wide under its arch, a
    tower two squares wide either side, bastion guns on the wall. The sloops run straight through; a frigate lies
    broadside to a tower and shoots it down (6 large shots, both of each broadside on it: three broadsides), and
    then the way's three wide for anyone. A gate's guns leave you be till it's fired on, then fire on whoever's in
    reach (the gate's medium shot's damage); any ship's hits quieten one, three wreck it;
  - **a side way** through its west wall and its east: a one-square gap with a wind blowing in through it from the
    open sea. A sloop on it is carried through, fast; a frigate rides the winds out (and wouldn't fit anyway).
- **Islands**: four out on the open sea, sand and grass and palms, each with a cove a sloop hides in, one square in
  by a narrow way no frigate fits, the island's rocks between her and anyone's guns. Each side's corner of the sea is
  somewhere to lie out of the fighting too, when the coves are full.
- **Buoys**: in the heart two two-pennant and the prize, three; out on the open sea a two off each gate and a one by
  each island. Influence 2 squares from any of a sloop's squares, 3.5 of a frigate's. Scored every 10 s; a round is
  six minutes.
- **Damage** (`Damage`): each hit a hole where it struck (along her, which side), its damage by the gun's size (a
  small shot 1, a medium 1.5, a large 2: YPPedia's proportions). Full damage: a war frigate 30 (YPPedia), a sloop 6
  (not checked: three of a frigate's large shots). Her carpenters patch the oldest hole first, her bilgers pump,
  both quicker with more stations (by the square root of her carpentry and bilge stations: a frigate's 18 and 12, a
  sloop's 2 and 2). Water comes in in proportion to her damage and slows her moves (up to 60% longer, full). At full
  damage she's knocked out: dead in the water, no influence, till her crew have her back under 60% (a non-sinking
  blockade's way).
- **Seen**: every ship's crew aboard, little pirates at work (a frigate's helmsman, three carpenters and two
  bilgers; a sloop's helmsman, a carpenter and a bilger), in their side's colours; a hole made with a bang where the
  shot comes down, a dark hole ringed with raw splintered wood (it shows on black paint), patched with a fresh plank
  that weathers away; carpenters hammering while there's a hole, bilgers pumping and water spouting over her side
  while there's water; sitting lower and listing as she fills; smoking when badly hurt; knocked out, listing hard,
  low, smoking dark and turning slowly where she lies.
- **Each war frigate a config of her decoration** (src/den-frigate.ts; "a [war frig] should have a config for its
  decoration ... the same with an Atlantean type and a haunted seas type"): her paints, figurehead (a beast, a mermaid
  holding a trident, a skull), guns and furniture. Coral Throne, an Atlantean class (YPPedia: sea-themed, sold ready
  painted): sea green and sand gold, verdigris guns, clams, coral and tridents. Eldritch Wail, a Phantom class (YPPedia:
  a ghost aboard for good): see-through and glowing faintly green, flickering, a skull at her bow, candles, skeletons
  and gibbets on her deck and two ghosts. Their new pieces are furniture like any (js/den/furniture/: clam, coral,
  trident, bronzeCannon, ghost), in the catalogue. Either can be sailed in the blockade (its Sail button) or looked at
  on frigate-test.html (`?frigate=`).
- **The bots** (greedy, as the puzzles' are):
  - each picks the buoy most worth her while (its pennants; more if the other side holds it or it's contested; less if
    a friend's on it) for how far it is, and holds it;
  - a war frigate weighs shooting the nearest shut gate down (worth all the heart's pennants) against sailing round to
    an open one, and inside, the heart's buoys are worth more to her;
  - a war frigate with an enemy close by (frigates first) lies off her side and fights her for it;
  - a sloop badly hurt runs for a cove (or her side's corner) and hides till she's patched;
  - two raider sloops a side lurk in a cove, dart out at an enemy frigate, lie off her side, fire, and run back;
  - everyone fires a loaded side whenever it would hit an enemy and no friend, a tower she's come for, or a gate's
    gun firing on her; blocked by another ship, she makes a move of her own rather than wait for ever.
- **Spectating** (the page's start): the camera's director moves to whatever's happening (a knockout, a tower coming
  down, a hit; else a raid or a fight), no more often than every five seconds, drifting slowly round her; or follow any
  ship by clicking her, or the whole board. Any ship's Sail button takes her helm (`?ship=` her number).

## 4. Balance and cost, as it plays (bots, four seeded six-minute rounds)

- Sloops in the heart by a side way at 10 to 11 s; a gate down at 30 to 107 s; a frigate in the heart in two rounds of
  four (64 and 169 s), the others fighting outside it. Every round has hiding, raids, fights and 8 to 20 knockouts.
- A frigate's big moves keep her middle on every other square (it moves two at a time), so she can only line up with
  half the gaps two squares wide. So the gate's towers are two wide: crumbled, the way's three wide, and any frigate
  fits. Any narrow way meant for a frigate wants three squares, or two placed for her.
- Cost: sixteen ships' pilots on a big board. A round takes 9 to 19 s of computing for its six minutes (worst tick
  under half a second): only the ships near one that moves work their ways out afresh; working out a way as if the
  other ships had moved (choosing where to go) uses a twin of her sea with no ships on it, its reckonings kept; bots
  look round every 3.5 s, as the crow flies, working out properly only what they pick; a place with no way to it is
  left alone a while.

## 5. To shape with the user

- Whether the frigate's handling feels right: as quick as the sloop over open water, clumsy (her turns of moves half
  as long again), the sloop's speed the winds'.
- The sloop's full damage (6 small shots, not YPPedia's yet), and how long a knocked-out ship takes to rebuild.
- Rams and rocks doing damage (YPPedia's), whirlpools on the board, more buoys or rounds, a sinking blockade.
- The bots playing as teams (escorting, holding a buoy together), sloops darting in to fire and run.
- Puzzles for you aboard: your carpentry and bilge (the den's own boards) instead of the bots' crew.
- Where it goes in the den: a blockade at Port Decorum, Daquan's flotilla (IDEAS.md).
- The styles' own mechanics (IDEAS.md): the Atlantean launching little craft (trikes, an octopus), the ghost ship
  gliding through rocks.
- Frigates getting into the heart more often (two rounds in four), and the bots' fights round the gates.
