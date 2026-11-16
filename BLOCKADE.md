# The tabletop blockade: design document

Started 16 Nov. A faithful recreation of Puzzle Pirates' blockade, as it plays today, with bots that teach it, like
Distilling's ([DISTILLING.md](DISTILLING.md)). The task board's card: `tasks/tabletop-blockade/`.

**Not the 3D blockade.** The den already has a blockade of its own invention (ships to scale, frigates holding the
open water, sloops in the coves; `idea-a-war-frigate-and-a-sloop-on-one-board-and-a-blo`). This is separate and
faithful, sharing nothing with it (the user, 16 Nov: "this should be completely isolated from the other one. It
should just be like a tabletop version almost, where you could go into someone's on an island and they've got their
little blockade thing set out on a tabletop or something. All separate and modular.")

## The shape of it

- **Its rules, one pure module in `src/`**, knowing nothing of the den, the 3D blockade or where it's played: the
  board, the ships, a turn's moves and shots resolved, winds, whirlpools, rocks, flags and points. Randomness and the
  clock handed in, as every rule in `src/` is.
- **Its bots by tier**, playing it as a person would and saying why, in their own module, run by a `tools/` script;
  watched by link on a test page (seed, bot and speed in the URL).
- **A test page of its own** to play it on a board, flat, like `distilling-test.html`.
- **Later, a tabletop on someone's island**: the board laid out on a table, its little ships as pieces, a host
  teaching it; a place of its own in the den, touching the rest through a few thin hooks.
- **Later, its tutorial in the one shape** (`src/tutorial.ts`, [TUTORIALS.md](TUTORIALS.md)) and its read version.

## 1. The real rules

Researched 16 Nov. Sources: YPPedia's Sea battle, Blockade, Collision mechanics, Influence, Ramming, Rock, Wind,
Whirlpool and Maneuver pages ([Y]); the user's own BlockadeSim ([C], see Sources), the mechanics the tabletop is
ported from; and another player's later cade sim server, BenBeri's Obsidio-Server ([S]). Where they differ, the
game's own numbers (YPPedia) win. Anything unclear is marked **(to confirm with the user)**.

**Where it's built (16 Nov):** in the den's code like everything else, its rules in `src/`, a test page to play it
flat, then a little island of its own with the tabletop on it; separate from the den's 3D blockade, sharing nothing
with it.

### The board [Y][S]

- **20 squares wide, 36 long**: 30 rows of play, with a **safe zone** of 3 rows at each end, lighter, holding
  nothing. One end is **island-side**, the other **ocean-side**. The sim codes it as 36 rows of 20 numbers.
- **What's on a square**, the sim's tile codes: open water (0); a **tall rock** (1) and a **small rock** (2); a
  **wind** blowing west, east, north or south (3 to 6); a **whirlpool**, 2 by 2, its four corners NW, NE, SW, SE
  (7 to 10); a **buoy** worth 1, 2 or 3 (11 to 13). Buoys only on open water, never in a safe zone; ships sail over
  them freely.
- **The sides** of the board act like rocks. Ships come and go only by the ends.
- **The board's reset each round**; between rounds its buoys are taken off.

### The ships [Y]

The blockade table, the numbers the tabletop uses. Damage in small shots (a medium shot is 1.5, a large 2; YPPedia's
full-damage table agrees: a war frigate sinks at 50 small, 33.3 medium, 25 large).

| Ship | Class | Budget | Influence ⌀ | Crew for influence | Moves a turn | Guns a side a move | Shot | Sinks at |
|---|---|---|---|---|---|---|---|---|
| Sloop | small | 5 | 1 | 3 | 4 | 1 | small | 10 |
| Cutter | small | 7 | 2 | 4 | 4 | 1 | small | 12 |
| Dhow | small | 7 | 2 | 4 | 4 | 1 | medium | 12 |
| Fanchuan | small | 7 | 2 | 4 | 3 | 1 | large | 13.125 |
| Longship | medium | 10 | 2 | 5 | 4 | 2 | small | 15 |
| Baghlah | medium | 15 | 4 | 6 | 3 | 2 | medium | 20 |
| Merchant brig | medium | 15 | 4 | 7 | 3 | 1 | medium | 20 |
| Junk | medium | 15 | 4 | 6 | 3 | 1 | large | 25 |
| War brig | medium | 25 | 6 | 8 | 3 | 2 | medium | 25 |
| Merchant galleon | large | 20 | 6 | 13 | 3 | 1 | large | 30 |
| Xebec | large | 30 | 6 | 12 | 3 | 2 | medium | 35 |
| War galleon | large | 30 | 6 | 12 | 3 | 2 | large | 25 |
| War frigate | large | 40 | 8 | 17 | 3 | 2 | large | 50 |
| Grand frigate | grand | 60 | 10 | 29 | 3 | 2 | large | 60 |

- **Class** decides collisions (below). **Budget**: a side's ships on the board at once may not cost more than the
  blockade's budget (it scales with the island; 100 in YPPedia's example).
- **Ram damage**, what a ship deals when it hits another, in small shots: sloop, cutter, dhow, fanchuan, longship
  0.5; baghlah, merchant brig 1; junk 1.5; war brig 2; merchant galleon, xebec 2.5; war galleon 2.5 (its medium and
  large figures don't match, **to confirm**); war frigate 3; grand frigate 4. Both ships in a ram take the other's.
- **Rock damage**, hitting a rock or a side: a twentieth of what sinks her (a sloop 0.5, a war brig 1.25, a war frigate
  2.5, a grand frigate 3).
- **Moves a turn**: a 3-move ship rests one of the four slots, the navigator choosing which (the octagon; the sim
  defaults it to the last).

### A turn [Y][S]

- **35 seconds to plan** (the sim used 15), then the turn plays out, all ships at once, in **four slots**. In each slot
  a ship may play one move (forward, left or right; or nothing) and fire guns off either side, up to its guns a side a
  move. No grapples in a blockade.
- **Each slot resolves in three steps**: everyone's moves, then winds and whirlpools, then guns.
- **A move**: forward is one square ahead. A turn (left or right) is one square ahead and then one to that side,
  ending facing that way: it passes through two squares, and both count for collisions.
- **Collisions, the moves step** [Y, Collision mechanics; S, CollisionCalculator]:
  1. Every moving ship claims the square in front of it. Empty and unclaimed: she moves in. A stationary ship there: a
     **bump**. A ship there claiming her square (head on): neither moves. Claimed by a ship of the same or a larger
     class: she stops. Claimed only by smaller ships: she moves in (with a collision).
  2. Then every turning ship that hasn't stopped claims the square to her side. Empty and unclaimed: she moves in. Held
     by a stationary ship, or one that moved there in step 1, whatever its class: she stops (so a little ship going
     forward stops a frigate turning). Head on, or claimed by the same or a larger class: she stops. Only smaller
     ships claiming it: she moves in.
  3. Every ship that tried to turn faces her new way, even if she stopped.
  - **A bump**: a turning ship bumping a stationary one stops, both stay, she still turns. A ship going forward into a
    stationary one of the same class stays put and pushes her back a square. A smaller ship bumping a larger: neither
    moves. A larger bumping a smaller takes her square and pushes her on a square ahead of her ("a push").
  - **Rocks and the sides**: never entered; she stays and takes rock damage. A turn whose first square is a rock still
    turns her where she sits (a half turn on the spot, for damage). If only the second square is a rock, she ends on
    the first, turned [C, its first unit test].
  - Rams: two ships of the same class meeting deal one collision's damage each; of different classes, two each.
- **Winds and whirlpools** act once a slot on a ship sitting on one after the moves. A **wind** pushes her a square
  downwind, as a forward move does, whichever way she faces. A **whirlpool** carries her clockwise to the opposite
  corner of its 2 by 2 and turns her 90° clockwise, as a turn does (two squares, both claimed). The same collision
  rules, wind as forward and whirl as turn. A ship carried onto another wind or whirlpool isn't moved again that slot.
  Left alone in a whirlpool for a whole turn, a ship ends where she started, facing the same way.
- **Guns**, after the winds: each side's shots fly straight out from her side up to **3 squares** and **all hit the
  first ship** in that line. A **tall rock** stops them, a small rock doesn't [S]. A ship in a safe zone can't fire and
  can't be damaged (she can be rammed, and pushed out). **Friendly fire** does half damage.
- **Full damage sinks her**, at the end of the slot. In the sim she comes back at once at a random square along her
  side's outer edge, fresh **(the game: that ship's out of the round, and the side sends another; the tabletop does as
  the sim)**.
- **Scoring, at the end of each turn**: a buoy within any ship's influence of one side only scores its points for that
  side, once, however many of its ships are round it. A buoy both sides influence is **contested** and scores nothing.
  A ship's **influence** is a circle round her, the squares within half its diameter of her square: 1 square (a sloop
  must sit on the buoy), 5, 13, 29, 49 for diameters 1, 2, 4, 6, 8 [Y and S agree]. Diameter 10 YPPedia counts as 73
  squares, which no circle gives (81 within 5) **(to confirm)**.

### Tokens [Y][S]

- **Moves**: the sailors and riggers make them, each a forward, left or right, the kind the navigator picks (or
  "auto", topping up whichever kind is fewest [S]); a high bilge makes them slower. Unused, a move token is lost
  after **5 turns** (the sim: 4). The sim's crews: a basic one makes 1.7 moves a turn, an elite one 2.4, slowed by
  0.9% for each 1% of bilge; a ship starts with 4 forwards, 2 lefts, 2 rights.
- **Guns**: each gun the gunners load is one shot, fired off either side; guns never expire. The sim: a basic crew
  loads 11.5 a turn, an elite 17, up to the ship's store (a war frigate 24); she starts with 10.
- **Damage and bilge**: carpenters and patchers mend damage, bilgers pump. The sim: a basic crew mends 0.5 a turn and
  pumps 4%, an elite 1 and 7%; damage past 40% (elite 50%) starts the bilge rising.
- **Maneuvers** (some event blockades turn them off): made by all three duty areas together, a third each, silver
  then gold. Chain shot (gold, skull shot) destroys the target's move tokens; the in-place turn (gold, a tidal wave
  filling the bilge of the ship in front by 50%); the double forward (gold, ramming speed, ramming as a bigger
  class); flotsam behind her, stopping any ship that sails into it for the rest of that turn (gold, burning, damaging
  too). The tabletop starts without them.

### A round, and the blockade [Y]

- **A round is about 45 minutes** (the sim: 15 minutes), with four one-minute breaks (at 35:00, 26:15, 17:30, 8:45
  left). The side with the most points takes the round; a tie that isn't nil goes to sudden death; nil to nil goes to
  the defenders. **Best of three rounds**; the blockade ends early once the attackers can't win.
- **Entering**: a ship comes in at a random square along the outer edge of her side's safe zone, facing in. Once out
  of the safe zone she can't go back: sailing into it is leaving the board by that end. Defenders may leave by either
  end, attackers only ocean-side.
- **Roles**: the battle admiral (BA, where every ship goes), the land admiral (LA, the fleet in port), the
  navigators, the XOs (each ship stocked and crewed), the jobbers. And the words the old guides use: **snipers**
  (hit-and-run from the safe zone), **the back door** (a brig entering ocean-side), **tunnel vision** (watching one
  enemy), "fire liberally" (shoot whenever an enemy could be in range).

### What the tabletop takes, to start

To shape with the user. A first cut: the board and its tiles, the ships by the table above (the war brig and war
frigate first, as the sim had), the four slots and the collision rules exactly, winds, whirlpools, guns, influence and
scoring, sinking and coming back as the sim did; tokens made at a crew's pace, its quality a setting; no maneuvers,
no budget, a short round.

### Sources

- YPPedia: Sea battle, Blockade, Collision mechanics, Influence, Ramming, Rock, Wind, Whirlpool, Maneuver,
  Blockade strategy guide (read 16 Nov in the browser pane; YPPedia turns automated fetches away).
- The old cade sim's server: github.com/BenBeri/Obsidio-Server (Apache-2.0): its board (`BlockadeMap`), turn
  (`PlayerManager.handleTurns`), collisions (`CollisionCalculator`), tokens (`MoveTokensHandler`, `MoveGenerator`,
  `JobbersQuality`), ships (`vessel/impl`), and 30-odd real blockade boards in `maps/` (Loggerhead, Melanester,
  Aimuari...) to set out on the tabletop.
- **The user's own BlockadeSim** ([C]; the user, 16 Nov: "That's mine. So that should give you all the old mechanics
  you need to at least build the mechanical part"): github.com/craigpears/BlockadeSim, ActionScript for Whirled,
  2011 to 2012, the source the tabletop's mechanics are ported from, checked against YPPedia. Its parts:
  `src/game/logic/CollisionMechanics.as` (a turn resolved: moves in two phases, winds and whirlpools, rams, rocks,
  shoves, guns, sinks), `Tile.as` (its tile codes: 0 open, 1 tall rock, 2 to 5 winds N E S W, 6 to 9 whirlpool
  corners, 10 to 12 buoys, 13 small rock, 14 safe zone), `Scoring.as` and `Flag.as` (influence and points each turn),
  `src/constants.as` (influence shapes, ram and rock damage, max damage), `src/game/data/ShipStats.as` (crews by ship
  and quality), `src/game/data/MapList.as` (26 real boards: Akhlys, Gallows, Iocane, Duat, Zuyua, Labyrinth Moors,
  Windward Vale...; rows of 38, the board's 36 and a rock border, so turned on its side), and
  `src/unitTests/UnitTests.as` (its collision tests, each a little scene, to port as the tabletop's own tests).
  What it settles or adds:
  - **A turn whose second square is a rock** ends on the first square, turned, with a collision (its first unit test).
  - **Influence**: a sloop only her own square; a brig's 29 squares and a frigate's 49, listed square by square, the
    same circles as above.
  - **You can't sink on a rock ram** (CollisionMechanics: rock damage stops short of sinking her) **(to check against
    the game)**.
  - **Crews**, three ships by three qualities (weak, normal, elite):
    moves a turn: sloop 1.4, 2.5, 3.5; brig 1.6, 2.3, 2.9; frigate 1.5, 2.2, 2.8.
    Guns loaded a turn: sloop 1, 2, 3.5; brig 3, 6, 8; frigate 5, 8, 12 (stores 4, 16, 24).
    Damage mended a turn, in small shots: sloop 0.1, 0.15, 0.2; brig 0.4, 0.6, 0.8; frigate 1, 1.6, 2.2.
    Bilge pumped a turn: sloop 12, 16, 25%; brig 10, 18, 23%; frigate 8, 15, 19%.
  - **A round of 60 turns**; a sink delay as an option.

## 2. Teaching it: the user's notes (16 Nov)

From the user's notepad, kept as they wrote them: what blockade nav is about, and how it might be taught. Watching
somebody navigate, 16 Nov: "it's just stuff like teaching about like hotspots, dancing."

Blockade nav challenges:

- Fastest route to the points.
- Hotspot finder.
- Risk analysis: e.g. moves that could leave you vulnerable to 6 hits are dangerous; good ones are usually about
  analysing the risks and mitigating them.
- Daily challenge spots: you "compete" against everyone else and it tells you who you scored the most against. Like
  99% chose x and you beat x, so you win. Average scores over 100 different situations and show the result at the end.
  - Risk of someone cheating by entering lots of "bad" moves that theirs beat?
- Could somehow chain them together, so it's almost like a go-to-page-X kind of story book, where you compete further
  against people who made that move, so you're rewarded for tactically positioning yourself on points etc.
- Damage management: when to trade to win points if you're up, vs staying alive so you last for the next person. How
  do you choose when to trade out? E.g. getting over half damage basically means you're going to be useless and get
  sunk by a replacement; do you want that?
- Die on the points.
  - Only sink others tactically, not at the cost of points.
- Double teaming, being teamed.
  - Incentivises trading (if teaming).
  - Avoid hotspots if at the cost of damage, but still deny the majority of points if teamed; avoid trading.
- Getting to points fast!
- Communication in teams: speak fast and to the point. No chit chat!
- XO and LA comms: tell people when you're going down.
- Comms in a multi-cluster:
  - Coordinate who's covering flags.
  - Let the other know, so they can choose to go for shots instead.
  - The ultimate win is to sink both enemies in quick succession: single sinks still leave one on the flags.
    - If you're both high damage, it's best to purposely trade out and sink yourself so you're back before the other
      ship sinks, instead of sinking together.
  - Coordinate covering each other's vulnerabilities: one covers possibility A, the second option B, that the
    opponent could do.
- Leap-frogging to deeper points clusters.
- Track if you're up or down and tell the board admiral: they need to know if you expect to win or lose, and when.
- You can reverse the damage of being down shots if your opponent is on no damage: that's why you trade when up.
- Shoot! Always shoot! Any possibilities!
- Cluster size: frigs can "cover" a bigger cluster than a brig can. Your goal is to minimise the points they gain,
  like allowing them a one-point flag but denying them the three-pointer until a replacement frig comes along, and
  surviving in the meantime. As a brig you may often "rotate" onto a big cluster when there's a need, while the frig
  comes in through the cluster you came from.
- Cluster hopping: planning a route into the global hotspot, but going through a lesser hotspot to pick up points
  along the way.
- Counting max points a turn against turns left: when is it impossible for them to win, so you can leave the board?
- Training mode?
  - Highlights hotspots.
  - Highlights a route to get to them.
  - Highlights the best ways to get there.
  - Warns you of the risks of a move? Like they could go xyz and put six shots into you?
  - Could prototype by having lots of images, swapping as you click on hotspot mode, route planning etc., with some
    limited options.
- Start really simple:
  - Like a map with two flags where there's only one obvious hotspot.
  - An obvious good and bad route.
  - An obvious good and bad cluster.
- Animated GIFs covering each tip or trick, like Factorio's, for the simpler concepts?
- A few buttons to reposition the ship in different spots, to see how it affects points coverage?
- Could almost do something like hazard detection: highlight the things that get you to the points faster, like
  whirlpools and winds facing towards the cluster.
- Modern blockade nav is more chaotic, more frigs than before: more about getting to and dying on the points?
- An interactive story (like Twine):
  - Start off with a really simple story option, like a sloop trying to get to some points.
  - Your first job is a flag sit! Someone multi-dropped, but they're all busy fighting on the most prestigious
    island. It's your job to get as many points as you can, in case they switch and come over here.
    - Choose a sloop? You don't get enough coverage, and a frig appears before you've got enough points for it to be
      impossible for them to win.
    - Choose a dhow? Great choice! Few jobbers, but much better coverage than a sloop. Only on a map where the flags
      are close, though!
    - Choose a war frig? Bad choice: we don't want to take from the main blockade. Outcome: your flag loses the other
      island because you took the jobbers.
    - A frig could come in at the end?
    - A rival sloop after a while, for a bit of a fight?

## 3. Where it's got to

- 16 Nov: started; the card, this document, the user's notes. The real rules researched into §1, from YPPedia and
  the old cade sim's server. Next: agree the first cut with the user, then its rules module and tests.
