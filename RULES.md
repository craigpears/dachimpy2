# Rules and design notes

The working rulebook for the primer. When a playtest corrects something, write it down here
so it isn't lost. Two kinds of entry: facts about the real puzzle, and design rules from feedback.

## The real puzzle

- Pieces are the twelve pentominoes plus a putty bucket. Draw weights (from YPPedia):
  P 22, F 14, Y 14, N 8, L 8, T 7, W 4, U 4, V 4, Z 4, X 3, I 2, putty 1 (95 in all).
- **The toolbox holds three pieces.** You play any one of them and a fresh piece tops it up.
- A Masterpiece is a hole filled exactly, with no overlap, before it waits too long.
- Long-grain pieces (I, L, N, Y) score the Grain bonus only when lying along the hole.
- Several holes are open at once. A drawn piece that doesn't suit one hole goes into another.
- Hawkings' advice (YPPedia *Carpentry tutorial*): put the rare, awkward pieces in the odd
  corners while the hole is big; keep the flexible pieces (P above all) for the finish;
  square the hole off and work from the outside in; learn the named two-piece holes
  (Top-Notch, Dogleg, Dome, Middle-Notch, Animal, Offset, Lazy Animal, The Ship, The Rectangle).

## Design rules from playtests

- **It's a game, not a tutorial.** Short, quick-fire, with a journey and a daily puzzle.
- **Words over percentages.** Don't fill the screen with numbers. Grades, meters and rarity
  words are fine. When rarity is shown, also say how often a piece turns up as "about 1 in X"
  pieces. No decimals or percentages in the main play. **Exception:** *Which gap?* is about
  the actual sums, so it shows a percentage on each gap and the full working ("97% × 37% = 36%")
  in a fold-out panel.
- **Every choice must be a real choice.** Never show a single option. If one piece has only
  one sensible spot, offer two pieces to pick from instead.
- **There must be a right answer.** No two options may finish about as often (they must differ by
  at least a tenth and a fifth), or "the green one was stronger" splits hairs. When every move
  really is as good (often because you hold the closing piece), both show green and the feedback
  says either was right.
- **No betting on the voyage.** The bet on the last draw was dropped there; betting lives at the
  harbour table. The voyage is for earning.
- **Options must be plausible.** No obviously bad moves: every option hugs the edge and strands
  no squares. They should differ in what they set up ("leaves a Dogleg", "keeps it square").
- **Feedback must stay on screen long enough to read** before the next step rolls on.
- **The board shakes** on a bad move or a missed draw.
- **Don't say "patching"**: that's a different puzzle. Use "puzzling" or carpentry words.
- **Betting is about the three draws**, not the rarity label. Ask "you get three draws, will it
  turn up?" Betting across several holes at once is more fun than one hole at a time.
- **The trail builds up the toolbox**: one piece at the first ports, two at Tarpot Reef,
  three (the real puzzle) at Kraken's Maw and in Hole of the Day.
- **One purse for the whole site.** Earn doubloons from Masterpieces (voyage, Hole of the Day)
  and right answers; spend them on bets. Every bet is priced against the player (about an 8%
  edge), and the house refuses bets that are too likely. Gambling alone should slowly lose.
- **In-play betting is the fun bit** (like blackjack): pieces come one at a time, prices move,
  and you can add bets between pieces. Holes that don't get finished are "bodged".
- **Which pair fits?** is exactly right for teaching two-piece finishes; build more games in that style.
  Three big buttons above the puzzle (not a small slider) set how many pieces finish the hole (2 to 4; five-piece holes are too slow to build
  and have too many answers). Harder holes must feel properly rewarded, so the pay climbs steeply:
  2 pieces pay 1, 3 pieces 4, 4 pieces 10. **Guessing must not pay:** a wrong answer costs as
  much as a right one pays (in *Which gap?* anything worse than a close second costs 2).
- **Place your bets: no "A before B".** A piece only fills one hole, but the order mustn't feel
  arbitrary. If two holes need the same piece, it goes to the one with more of your money on it,
  and the prices are worked out with that rule. Stakes leave the purse as you place them, and
  the purse is shown on the page, not just in the corner.
- **Every hole on the betting table shows its odds**, two-piece holes too: how often a starting
  piece turns up ("about 1 in 2 pieces") and how often it gets finished from the pieces left.
- **Earn, then face off.** The landing page leads with two steps: earn doubloons (the puzzles,
  best payers first, with what each pays), then bet them against other pirates at the harbour
  table. The menu groups them the same way ("Earn doubloons", "Bet them"). When your purse is
  empty at the table, a clear box sends you to the puzzles.
- **Every game feeds the one purse**, and its page shows your purse and what it pays.
  *Which gap?* pays 2 for the best gap and 1 for a close second.
- **No looping animations.** The bobbing ship and spinning ring on the map hurt to watch. Movement
  should be a short reaction to something you did (a piece dropping in, a shake, a glow).
- **Keep text readable.** Nothing that matters (stakes, returns, odds) in tiny hint text.
- **Say why a move is risky in plain odds.** Every option shows "Finishes about N times in 10"
  (three draws for each piece still needed), and the grades come from that same number.
- **Odds as bookmaker's prices** ("3 to 1", "evens"), worked out from the real chance, not
  from the rarity label.
- **Make it sociable.** Pick a pirate name (letters only, no sign-up) and your purse goes on a
  leaderboard beside the game. The purse lives in the browser, so the board is an honour system
  with guard rails (no huge jumps in one go). Only ever show pirate names, never real ones.
- **Competitive play is capped.** Head-to-head games give everyone the same stake, so a big purse
  buys no edge. If you run out, you earn your way back in with the quick puzzles first.
- **The harbour table is player against player.** One shared round every 45 seconds: 20 seconds
  to bet, then five pieces for everyone. No bookie: all stakes go in one pot. If more than one
  hole gets finished, the rarest one with money on it wins. **The winners share the whole pot by
  stake**, like a horse-racing tote: put 10 of the 40 on the winning hole and you get a quarter.
  Every other bet is lost, so spreading money over every hole has a real cost, and a hole few
  pirates back pays big. Each hole shows its live tote price ("pays 3 to 1"). (Tried and dropped:
  poker-style side pots, where you could only win your own stake from each pirate. Nobody could
  follow the split, and losing bets often came straight back, so covering every hole was free.)
  If nobody backed a finished hole, the whole pot rolls over into the next round's pot. Each hole is labelled Rarest … Likeliest. House pirates
  (Cap'n Bones, One-Eyed Peg, Barnacle Bill) bet every round so there's always a pot. Stakes are
  capped at 20 a round, bets are final, and the pieces stay secret on the server until betting
  closes. The solo table against the bookie stays as *Practice bets*.
- **Who's at the table must be obvious.** A prominent panel beside the holes (above them on narrow
  screens) lists every pirate at the table, house pirates marked, with what each has on which hole,
  and after the round who won and who lost. Each hole also lists its backers by name.
- **The table fits on one screen.** All four holes in one row, a short intro with the pot rules
  folded away, and the page brings the pile into view as the pieces turn over. Betting is one big
  button per hole. **The leaderboard stays visible at the table**; the crew goes beside the holes
  only when there's room, otherwise in a strip above them.
- **Say plainly what you can win.** Each hole shows its price and what you'd win or lose if it
  wins, counting your other bets. After the round, the split panel lists each winner's stake on the
  hole and their share of the pot.
- **Stake first, then holes.** The stake is picked separately (5, 10, 15 or 20, as chips above the
  holes), then each hole's button places it. Betting on several holes at once stays: it's fun.
  (Tried and dropped: one hole per round.) The holes you've backed are highlighted.
- **Show how the split worked, as a picture.** After each round a "How the pot was split" panel
  lists every stake that went in (the winning hole's highlighted), then shows the pot as one bar
  that breaks into each winner's share, labelled with name, fraction ("1/2") and doubloons.
- **Watching is free, playing needs a name.** Anyone can watch the table; a clear "You're only
  watching" box asks for a pirate name before you can bet.
- Ideas to build next: a daily head-to-head on Hole of the Day (same pieces for everyone, a board
  of who got the Masterpiece); and *carpentry poker*: two pieces in your hand,
  the holes on the table, then shared pieces dealt like a flop, turn and river, with betting
  between each; and *crew carpentry*: a co-op Hole of the Day where the crew take turns round a
  circle, each picking one of the dealt pieces, and the whole crew shares the grade and the pay.
- Dropped ideas: *Commit or wait* (not interesting).

## Pirate Den (3D prototype, `den.html`)

Unlisted for now: reachable only by its URL until the user says to put it in the nav.

- **A puzzle game, not an action game.** The raiders are there for a bit of interest and a bit of
  pressure, so you can't ignore things altogether; the emphasis is always on wanting to finish the
  puzzle in front of you (the next section to build, the next Gunnery load). It mustn't be a
  pressured fight against defeat. The user (9 Nov): "there's not as much of a worry about making
  things too easy ... progression is fun. It's to be expected. ... we can add more challenging
  elements later." So when a change could go either way, keep it simple and on the easy side.
- **A quick siege to start, then calm (9 Nov).** The first three waves come as they always have,
  each counting down after the last. Beat the third and their captain calls it off ("We'll be
  back!") and the ship sails out of the cove, its cannon with it. The den's quiet after that: no
  countdown, so you're free to build, roam and puzzle. The user liked the quick intro under attack
  but wanted raids "more opt-in ... so you're not constantly under pressure and you feel free to go
  explore": "do a few waves". What brings raiders back later is to come (IDEAS.md, "Raids you
  choose" and "The captain's map"); for now only the cheat's "Next wave now" does, the ship back
  at anchor, and the den goes quiet again once it's beaten. Rules: `src/den-raids.ts`.
- **The captain's map, and the cheesy cutscene that brings it (9 Nov).** Beat the third wave and
  a short cutscene plays (the user: "I want a little cutscene, so they're not just sailing off in
  the distance ... a short, cheesy one"), black bars top and bottom, the den's buttons and keys
  out of the way: their captain, **Dalnoth**, on the beach, shakes his fist at your wall ("We'll
  be back! *hic*"), runs for his boat and rows off, and a rolled-up map tumbles out of his coat
  onto the sand. Then your pirate walks out through the gate on their own, picks it up ("A
  map!") and opens it out on the sand in front of them, the camera looking down on it. Whatever
  you had in hand goes back on its crate first. **Space or Esc skips it**, and then the map's left
  lying on the beach, "A map?" over it, for you to walk out and pick up with Space. **M** opens
  it again wherever you're standing on the ground; M, Esc, Space or a click rolls it up. **While
  it's open, only the map shows** (the user, 9 Nov: the crates and the piece instructions "ruin
  the immersion"): the buttons, the crates, the keys and the labels fade away, leaving a quiet
  "M, Esc or Space: roll it up" at the bottom. The map
  goes to **his island across the sea**, not back up the cliffs ("it feels weird going backwards
  ... it would be better if you can go forward"): your cove at the bottom, his island at the top
  with the X, the captain's scrawl ("we hear there's some secret treasure here, guarded by a
  fearsome enemy"), and **one way in for each puzzle** (leave the choices open): come at him by
  sea and shoot up his defences from your ship (Gunning), land on his beach and fight him for it
  (Swordfight), or round to a hidden cove with "some hidden undiscovered bilge pump" (Bilge). In
  a crew, whoever picks it up, everyone can open it. Skipping straight to a stage after the
  siege (the cheats) leaves it lying there, with no cutscene; the cheat "The captain's map scene"
  plays it again. Nothing out at sea yet (IDEAS.md). Rules: `src/den-map.ts`.
  - **Dalnoth looks like Dalnoth (9 Nov).** The first go, a captain in a red coat and hat, "really
    does not look very much like Dalnoth": he's drawn from his portrait on YPPedia (his pirate
    page was down), not from memory. Dark skin and a big black beard, a silver helmet with gold
    bands, a nose guard, white horns and yellow fur at the sides, gold earrings, a long yellow coat
    with gold buttons over a white shirt, a white sash, yellow breeches and stockings, a frothy
    pewter tankard in his right hand (the ale slopping as he rants, and a bit unsteady on his
    feet), and his white monkey on his left shoulder. (In the portrait the one on his shoulder is
    his black Hunter Archetype familiar; the white monkey is the Champion one, the one that comes
    to you.) **Any real pirate drawn in the den: check their portrait first.**
- **You can see out to sea (9 Nov).** The taller wall shut the view in: "it just feels like I'm
  staring at a wall. It's lost some of the chop. I don't feel like there's any background to look
  at. I don't know why it's so black. Rather like there's supposed to be a sea over there." So:
  - **Towers either side, the middle lower** (the user's own thought: "better suited to having
    like towers ... if the middle was a bit lower, then that fixes the problem where you can see
    the beach a bit better, but ultimately also where the gunning platform would eventually go").
    The stretches with the holes stand full height; the curtain round the gate (three columns
    either side of it) is the old six rows, a row of stone over the gate's beam. Over it you see
    the beach, the sea and the raiders' ship. Once built, the wall-walk and the gun tower span
    it on their posts, like a timber gallery between the towers, and the beach still shows under
    them. No hole or breach in the low middle (`lowMiddle`, src/den-wall.ts).
  - **A night sky over the sea**, not a flat near-black: dark overhead, lighter down to a horizon
    glow, with the moon (where the moonlight comes from) and stars, coloured to the landscape.
    The fog takes the horizon's colour and starts further off, so the sea out to the ship shows
    and then fades into the sky.
- **A cove (9 Nov).** The den should feel like a pirate hideout in a cove, a step towards the
  more ship-based den the user would like (without starting again). Whatever the landscape, out
  beyond the wall is a beach and the sea. The raiders row in from their ship in little rowboats,
  one each, run them up the beach and walk up to the wall; a raider who gives up (or gets away
  with the loot) walks back to their boat and rows off, and a boat left empty drifts back out.
  Their cannon is on the deck of their ship, anchored broadside on out in the cove (dark hull,
  gold stripe, two masts, black flag), run out from wave 2 ("Their ship's run out a cannon!").
  Only the look changed: raiders land about where they used to appear, so a wave's timing is
  about the same (a few seconds' rowing first). The user: "instead of them just walking over ...
  they're rowing in little rowboats onto the beach of your pirate hideout, and the cannon is
  actually a ship off in the distance".
- **The gate opens, and you can walk out onto the beach (9 Nov).** The user: "go implement opening
  the gate ... be able to walk through the gate". Walk up to the gate, from either side, and the
  drawbar slides back into the wall and the two leaves swing in; it shuts again once nobody's by
  it. Through it, the whole beach is yours, down to the water's edge (round the gun tower's legs,
  under its deck). It's only for pirates: the raiders never go for it (it's only ever open while
  someone's stood by it). Out there you can't fit pieces (you mend the wall from inside), but you
  can throw them straight at raiders on the sand, no lob. The camera looks down over the wall at
  you, and you show as a gold outline through anything in the way, **and only where something's
  really in the way** (9 Nov: "the character shouldn't have a yellow silhouette if you can
  actually see him"). His own arms and legs never count: in plain view on the sand he's just
  himself. The raiders' red silhouettes work the same way. This is the first step
  towards fighting on the beach (soldiers going out, the Kraken: IDEAS.md).
- **Bilging the shallows (9 Nov).** The user: "can you bilge out the ocean? ... reveals some like
  obstacles they have to pass over that hurts and damages them ... but it gradually comes back over
  time"; better than the mine idea "because it helps everything stay focused on this one area"; it
  should feel real, "almost like the bilge pieces are in the water. So when you kind of clear
  something and it moves, that piece of water recedes"; and combos could dredge up "an explosive
  barrel ... you can blow up as people go past". So:
  - **The board** is the real Bilge (YPPedia, read 9 Nov): 6 wide by 12 high, seven kinds, a
    two-square cursor that swaps side by side (any swap, even one that clears nothing), three or
    more in a row or column clear, pieces float up and new ones come in at the bottom, chains;
    crabs (can't be moved, cleared as a bonus when they come up out of the water), pufferfish
    (swapped, it clears itself and the eight round it) and jellyfish (swapped with a piece, clears
    every piece of that kind); the combo names Good, Great, Arrr!, Har!, Yarrr!, Bingo!, Sea
    Donkey!, Vegas!. Specials come in as the raids go on: pufferfish from wave 2, crabs 3,
    jellyfish 4 (in the real puzzle, with your standing). Tests: tests/bilge.test.ts.
  - **Where:** it lies in the shallows to the right of the gun tower, a metre a square, its top
    row on the sand 8 m out from the wall and running out into the sea, with stakes down its sides.
    Space by its top end to play; Esc to walk. You see it as in the real puzzle, from the sea end
    looking back at the den: row 0 at the top of the screen, the water at the bottom. Arrows (or
    WASD) and Space, or the mouse and a click.
  - **The water is the tide.** The board's water line is the sea's edge all along the beach, so
    clearing pieces draws the sea back. It starts at three rows, as the puzzle does; left alone it
    comes in a row every 30 seconds, up to nine (the top three rows always dry). Each move pumps
    out as much as it's worth in moves, as the bilging guides reckon it (a three a little under a
    move, two lines about three, a Bingo about eight; crabs well, more the higher the water; a
    pufferfish or jellyfish's own clear nothing). A three every three seconds keeps up with it.
    The raiders row in to wherever the sea's edge is.
  - **Rocks:** the sand the tide leaves bare past high tide's mark (up to 6 m of it) is strewn with
    sharp rocks. Raiders landing beyond them have to cross: slowed, and a point of stamina gone for
    every metre, so they reach the wall tired and give up sooner.
  - **Powder barrels:** two lines at once dredges one up, a Bingo two, more three (six on the beach
    at most). It's rolled up the beach to the foot of the wall by a hole, and blows up the next
    raider who comes by, knocking flat every raider within a couple of metres.
  - **The look matches Puzzle Pirates' bilge (the user, 9 Nov: "the graphics need to match Puzzle
    Pirates ... it's supposed to be in the water ... semi-transparent water underneath it, around
    it ... so you can see the water receding").** Seven glassy pieces in the sea's colours, each
    its own shape and pattern (two octagons, two spheres, a square, a rounded square, a pentagon);
    an orange crab, a yellow pufferfish, a cyan and pink jellyfish; orange corner brackets for the
    cursor. They lie flat on wet sand marked into squares, and the rows under water show through a
    deep clear blue, as in the real puzzle. The sea everywhere is see-through, clearest at its
    edge, over a sandy bed that falls away into the deep, so you watch it draw back off the sand.
  - **Solo only for now,** like Swordfight: in a crew there's no board and the sea stays about
    where it always was.
  The numbers are in src/den-bilge.ts (tests/den-bilge.test.ts).
- **Every puzzle stays high fidelity to the original.** Small tweaks are fine, but the puzzle's own
  rules come over as they are; the 3D only decides where the board stands and who is on the other
  end. The user turned down a clay golem built from smashed Swordfight blocks, with breakers won
  from kills, as "too far away from the sword fighting puzzle", and said this goes for all of them.
  A new job's look (a golem, a forge) can be a skin, never a change to the rules.
- **The Carpentry view (9 Nov).** The user, after Bilge: "have a 3D mode, but when you're
  puzzling, like I just don't think you can beat 2D, especially like the biggest critique and
  feedback I've got is people like to use keyboard controls, and this 3D experience is just not very
  good. Yeah, it's fun, but it's not good for puzzling and keyboard control." Not a separate
  screen: "to make it really feel like, oh, look, I can put things on the stairs. I can put things
  on the wall or the deck or ramparts". Swordfight is already close ("you kind of zoom in and you
  get that same effect"). So:
  - **Tab, from anywhere on the den floor,** goes into the Carpentry view on the nearest thing
    being built (the wall if you're by it); Tab again goes on to the next (the wall, then each
    frame: the wall-walk, the stairs, the gun tower's parts, your shack); Esc walks off. Bringing a
    piece to anything being built brings it on by itself: stop by the wall and it's the wall's
    view; stop on or beside a frame (or with a spot for the piece on one in reach) and it's that
    frame's, never the wall's (the user, 9 Nov, at the walk frame: "I'm still seeing the same view
    as before ... I'm certainly not getting that more 2D isometric view"). The arrow keys with a
    piece do the same. After Esc it stays off until you walk a few steps or take another piece.
    Pointing at a frame with the mouse, the piece goes in wherever it is, however far away.
  - **The camera goes straight on to it,** like a 2D board: the wall square on, the whole of it
    (a stretch round the piece if it's ever too long); a frame on the floor from above, its rows running up the
    screen; the stairs square on to their face. Your pirate walks along to stand by the piece,
    out of the way, so others see you building.
  - **Puzzle Pirates' own Carpentry keys** (YPPedia "Carpentry", read 9 Nov): 1-3 take a crate's
    piece (the toolbox), the arrows move it a square, X and C turn it, Z flips it, Q/W/A/S centre
    it over the upper-left, upper-right, lower-left and lower-right holes (on the wall, the real
    four: the high and low holes left and right of the gate, going on round any cannon breach in
    that corner; on a frame, that quarter of it), Space puts it in. Backspace takes the last
    piece back off (the real puzzle lets you adjust your last piece). E and F still turn and flip.
    The mouse works too: point and click.
  - **The keys stay exactly the real game's, and each hole shows its key (9 Nov).** The user
    pressed W and S for up and down, as when walking, and the piece leapt to the top-right and
    bottom-right holes ("I was just working in the bottom left hole, pressed up, and I ended up in
    the top right"); D did nothing, so "left and right" seemed dead. Told it's Puzzle Pirates' own
    Q/W/A/S (a little square on the keyboard, like the four holes), they chose: "we want to be
    completely faithful to the Puzzle Pirate controls." So in the Carpentry view each hole's label
    starts with its key (Q and A on the left of the gate, W and S on the right).
  - **Nothing in the way, and switching is seamless (9 Nov).** The user: "everything's really
    obscured", and moving between the wall, the stairs and the platform should be like Carpentry's
    four holes, with no going out and back in. So: a row of tabs over the prompt names everything
    being built, the one you're on lit and a tick on each one the piece in your hands fits
    cleanly; click one (or Tab) to go straight to it, piece and all. Your pirate stands beside the
    piece (at the wall) or off the frame's near edge, never in front, and the piece over their
    head is hidden while the ghost shows where it goes. It works from up on the rampart too,
    without walking anywhere. The den is 4 m deeper (to make room for all that's built), the
    wall-walk's frame and your shack at the back.
  - **It stays on between pieces,** and the next piece starts where the last one went. A piece can
    be held anywhere over the board and turned there, whether it fits or not, and put in from
    anywhere in the view, no walking.
  - **Immersive, never an overlay (9 Nov).** A flat Carpentry board drawn over the den at the wall
    (the holes in two rows) was tried and dropped the same day. The user: "I can't even see the wall
    now ... The wall one feels very forced ... I want it to feel more immersive, like you're in the
    3D world. This one feels a lot more detached", and "don't create a separate overlay. I think
    that's bad. That just suggests there's a deeper design problem". The wall-walk's view, where you
    see the full 3D world and nothing's blocked, is the model. If the wall needs to be closer to the
    real puzzle, change the wall itself: done, "The wall in two courses" below.
  - **The keys must be dependable (9 Nov).** The user, playing by keyboard: "this needs a lot more
    quality control for keyboard use. A lot of it." So, tested key by key:
    - **An arrow always moves the piece, and never further than it must** (the user, 9 Nov: "you
      should always be able to go left and right and move to the next available spot"; the piece
      seemed "to be jumping two spaces and going right to the bottom", sent to the next hole's best
      fit). A square at a time while the piece touches a hole (overhanging its edges counts); off
      it, over the bare stone and the gate ("it just blocks me instead of skipping over it") to the
      first spot touching the next hole in line with it, its row kept (left and right keep to its
      course, high or low; up and down work the same way between a side's two holes); with no hole
      in line that way, a plain square on, right to the wall's edge. Never a diagonal jump, never
      to a fit it chose for you: that's what Q/W/A/S are for (`arrowStep`, src/den-carp-view.ts).
    - **You can always turn and flip the piece, fit or no fit** (the user, 9 Nov: "It not fitting
      should not stop you flipping it"). It turns where it is, about its middle (turning it round
      and round doesn't walk it off), and the wheel turns any piece you carry (see below).
    - Q/W/A/S never send the piece back to the hole it's already at (it did, with the piece a little
      right of its hole's middle: "it isn't jumping").
    - A hand resting on the mouse doesn't undo key moves: after a key, the mouse takes over again
      only once it has really moved.
    - 1-3 swap the piece in your hands for that crate's; for the same letter, a note says so (or it
      looks as if nothing happened).
    - Tab and Shift+Tab go round everything being built, both ways; the tabs sit in a bar of their
      own, the one you're on in gold, with "Tab next" beside them.
  The rules for the keys and jumps are in src/den-carp-view.ts (tests/den-carp-view.test.ts).
- **Bilge is the model to aim for (9 Nov).** The user loved it most for being "so faithful and
  close": "really close one-to-one with the puzzle ... it just plays like the puzzle. It's not like
  a dumbed down version at all", while you can still see what's going on in the den. They loved
  how it "goes into that different view" (from the sea end, the board filling the screen, the den
  behind it), and that the board is out in the world, visible to everyone: "it's not just somebody
  standing at a post. You can see somebody puzzling." Carpentry should move closer to this (see
  IDEAS.md, "Carpentry as close to the puzzle as Bilge").
- **Nothing pauses the raid.** The den is quick-paced, so a job can't stop the action for a long
  one-on-one. The user turned down Swordfight duels at the wall (as in some Puzzle Pirates scenes)
  because a two-minute duel while raiders hack through the wall is "really disjointed". A slow
  puzzle has to pay off big instead: that's why the user came to the golem, one puzzle that makes
  something able to fight a crowd, not just one raider.
  **Except a boss fight.** A Swordfight against a golem is a big standoff in the open, "almost
  heroic", not "any old one-on-one", so there it makes sense for the rest of the raid to pause.
  The golem's size also makes big Swordfight boards look in proportion.
- **Crewmates help each other's puzzle, visibly.** Even when one pirate plays a puzzle (one
  swordfighter against the golem), the rest of the crew should be able to help from their own
  jobs: a cannon shot that hits the golem drops black blocks onto its board. The help has to be
  easy to see, so the puzzle feels real. Keep these ideas simple, not multi-step.
- **Every way of fighting the raid is there at once; you choose as you go.** No picker, no mode
  to choose up front: the user, "attackers are coming and you just choose which ways to deal with
  them. Similar to how you can defend with carp or jump to the gun turret later" (8 Nov; the idea
  came from the Age of Apes tutorial's choice of three mini-games).
  - **The same goes for quests: leave the choices open (9 Nov).** An obstacle on a side quest (a
    pirate guarding his treasure, say) can be got past with any of the den's puzzles, each in its
    own believable way: swordfight him, shoot him off from a gun deck, or bilge water in to flood
    him out. The user: "I like that principle. Like, leave the choices open."
- **Swordfight at the armoury hoist: soldiers and wall repairs (8 Nov).** Each raider beaten
  (knocked flat, by a thrown piece, the guns or a soldier; or turned away at the wall) drops their
  weapons: a pair of crates, a Swordfight pair, that lands inside the den. Walk over it to pick it
  up (eight at most). At the armoury hoist, against the left of the den, Space at the winch plays
  them on a real Swordfight board, by the real rules (6 by 13, pairs in at the top of the fourth
  column, fusing, breakers, chains; stack up into the red stripes at the top of the fourth column
  and the stack topples, with the crates you had). A pair only comes in while you're at the
  winch; nothing pauses the raid. What a break would send at an opponent goes to the raid instead:
  - **Chests arm soldiers.** Only a fused block (2x2 or bigger, a big chest of swords) arms
    anyone: a soldier for each one broken, two for each on the second link of a chain, three on
    the third, and so on; bigger blocks make tougher, bigger soldiers; five at most to start with
    (ten till 9 Nov: the user wanted "only so many soldiers ... limited to a handful at the start,
    but can be upgraded ... as you build more of a pirate den", to "build a little army up later"). The user: "you'd
    have to do a combo, like a fuse block to get a soldier, and obviously combo for multiples".
    Soldiers go for raiders loose in the den and stand just inside the gaps in the wall (or behind
    the holes being hacked), and a raider coming through a gap they hold stops to fight them; they
    don't go out over the wall.
  - **Loose crates mend the wall, for good.** Each sprinkle is a loose crate broken up for planks,
    thrown onto the lumber pile at the foot of the hoist (on the wall side); every 4 crates' worth
    is nailed into a hole as a piece's worth of planks (a pentomino's shape, pale boards with nail
    heads), as if you'd fitted that piece, and stays. It goes to the hole that needs it most (a gap
    raiders can walk through first, then the one hacked hardest, then the weakest; the nearest done
    if it's a tie), lowest down, and always where the rest of the hole can still be finished
    exactly, so a Masterpiece is still there to be made (and if the planks finish it, it is one,
    breaker and all). Planks with no hole to mend wait on the pile, three pieces' worth at most.
    The break's message says how many crates went for planks and how near the next repair is. The
    user, on the barricades this replaced (crates piled inside the breaches): "It says three
    sprinkles to the barricades, but I just see blocks on the ground ... this is confusing. Maybe
    you have to do a certain number and it actually fills in a hole a bit ... more of like a
    permanent wall repair for sprinkling."
  - **Masterpieces pay in breakers.** A Masterpiece (a hole, a layer behind one, or a frame built
    without waste) also pays a pair of crates with a breaker in it, flown straight to the hoist's
    landing as the next pair down (onto the floor by you if your hands are full). Once per
    Masterpiece: taking a piece back and fitting it again doesn't pay twice, but a hole broken open
    and mended again does. The gold is still paid, since it's what the raiders steal. The user:
    gold "is fairly meaningless. So getting a reward like some breakers would be a lot better".
  - A raider who gets in while you're at the winch nails crates shut on your stack (sprinkles, as
    an opponent's attack would). Playing alone only so far.
  **It's part of the den, not a picture:** the board is a real stack of weapon crates under a timber
  hoist, at the den's scale; each pair is lowered on the rope and turns on it, and the crates
  you've brought wait on a landing at the top. Each colour is a crate of one weapon (red a skull
  dagger, yellow a broadsword, green a machete, blue a sabre, stencilled on), a breaker the bare
  sword glowing, a fused block a big chest with brass corners, attack blocks crates nailed shut
  with iron bands. The hoist stands side on to the usual view, so it hides nothing; at the winch the
  camera turns to face it. The board on a sign before it "just feels like it's been forced in.
  There's nothing natural looking about it. It's very glaring" (the user), and setting it into a
  wall "doesn't really make sense".
  **You can see what you're carrying, and see things break (8 Nov).** The crates you've picked up
  ride on your back, lashed to a carrying frame (the next three pairs, as they'll come down), and a
  tile beside the crates in the toolbox shows the next few pairs, breakers glowing, and how many you
  have; picking one up says how many and where they go. The user: "it doesn't really have any
  indication, visual or otherwise, that you're carrying any breakers. You just kind of walk into
  them and it's like, okay, well, now what?" A break plays out a link of the chain at a time: what's
  about to break shakes and swells, then smashes into flying planks (a breaker's blade just
  flashes), and what was on it drops into the gap, faster as it falls; only then does the break
  send its soldiers and planks, and the next pair waits till it's done. The user: "it needs the
  breaking animation, not just to magically break."

- **A pirate mends a den wall.** Pieces sit on three crates (the toolbox); you carry them over and
  fit them into holes in a stone wall. Same pieces, weights and Masterpiece rule as the main game.
  Every piece on a crate, and the one held overhead, has a bold dark edge on both faces, so its
  shape reads from above on its crate and from behind over your head; held over a spot it fits,
  it goes only half see-through. The user (8 Nov): "you can't see the pieces on the crates or above
  your head when you're placing them so much anymore. That seems to have gone backwards." (A new
  game had also left the first three crates looking empty.)
- **You can never get stuck.** Like real carpentry, a piece may be nailed over the stone around a
  hole ("boarded over"). That always closes the hole, but it's a botch: weak and pays little. A hole
  filled exactly is a Masterpiece: strong, and pays well.
- **Masterpieces make the wall strong.** Raiders hack at mended holes: a boarded hole falls fast, a
  Masterpiece holds. Any wood at all (even one piece in an unfinished hole) has to be hacked
  through with swords first. No magic jumping through a hole that has wood in it. A thief whose way
  out has been mended hacks out from inside.
- **Raiders walk in, they don't jump in.** The user found raiders hopping through tiny gaps high up
  the wall "weird and dumb". Only an empty hole with a gap at the foot of the wall two squares wide
  and three tall lets them walk through. A smaller or higher empty hole is a **weak spot**: they
  hack at the stone round it (8 seconds of hacking, like one piece) until it gives way into a bigger
  hole down to the floor, and walk in. The bigger hole is still whole pieces' worth of squares and
  can always be filled exactly, so the crew can mend it; one piece in the gap stops them again.
  Every wall's holes start off the floor, so every hole is a weak spot until it's widened. The
  user liked it: it's an incentive to fill gaps early and close them off.
- **The wall in two courses (9 Nov).** The wall was one long row of holes, so no view showed them
  all and the piece crossed bare stone to get anywhere; a flat board over it was "forced" (see
  "Immersive, never an overlay"). The user: "Try with 2 wall courses. Let's see how that works."
  So the wall itself is the real puzzle's board: a high hole over a low one each side of the gate,
  four holes two up and two down, a row of stone between them and under the low one
  (`src/den-wall.ts`). It's nine or ten rows tall (5 m, it was six), about 17 m long (it was
  about 24), so the Carpentry view shows the whole of it. Holes lie on their side (wider than tall)
  to keep it low.
  - **The gate stays five rows tall** (2.75 m, as on the six-row wall), under a beam with stone
    over it. Run up the taller wall's full height it "just feels very stretched now". No cannon
    breach opens in the stone over it.
  - **High holes: raiders bring ladders.** Raiders going for a high hole lean a ladder under it
    and climb up; from there they hack its wood, or if it's open, climb straight in and drop down
    inside. There's no stone to hack wider first (that's the low holes), so an open high hole is
    the one to mend first. A raider dazed on a ladder falls off and climbs again. Raiders split
    between a side's high and low hole at chance; an open hole draws the raiders near it, as
    before. A cannon breach in the top half of the wall is a high hole too.
- **Every bit of mending counts; it's never all or nothing.** The user: partly filling a hole or a
  sloppy job should still turn a few raiders away, and when they do get through there's always
  something you can do. Tested 7 Nov 2026 (simulated waves with no cannon, nobody throwing):
  - *Nothing mended:* every raider gets in, the first after about 15 seconds.
  - *One piece in each hole:* all of wave 1 turned away, about 60% of wave 3, a quarter of wave 5.
  - *Boarded over (sloppy):* all of wave 1 turned away, about a quarter of waves 3 and 5.
  - *Masterpieces:* every raider turned away, waves 1 to 5.
  - *Mending during the wave* (one piece every 8 seconds, gaps they can walk through first): wave 5
    went from 9 of 12 raiders getting in to 2 of 12.
- **Getting through costs them: they arrive winded.** Covering a hole felt like nothing, and the
  user wanted hacking through to weaken the wave. A raider's strength (16 seconds of hacking) runs
  down as they hack; one who's used much of it comes through bent double, hands on knees, puffing,
  and stands just inside the wall catching their breath (up to 6 seconds, the more tired the
  longer). Then they go for the chest and back out up to 40% slower. That's the window to knock
  them flat with a thrown piece. The first time in a wave it says "Through, but winded: knock them
  flat!" (kept short: a long line filled a phone screen). One who walked in through a gap someone
  left open arrives fresh.
- **A wall giving way hits the ones hacking at it.** The user found three raiders bursting a hole
  together and walking straight in: "there doesn't seem to be any win for it". Three at once open
  it three times as fast, so each had barely tired (at wave 5, about 15% tired, a second's pause
  inside). Now when the last of a hole's wood or stone goes, every raider hacking it reels back
  dazed for 3 seconds (swaying, yellow sparks round the head), and stone that gives way chokes the
  new gap with fallen rubble (5 seconds of one raider's hacking) they must clear first, which tires
  them further. Plug the gap while it's choked and they're back to hacking wood. At wave 5, three
  raiders on one small hole now take about 8 seconds from the wall giving way to heading for the
  chest, where it was about 2. Dazed raiders at the wall can be hit from the rampart, and the gun
  tower aims at them too. Raiders hacking a hole with a doorway stand in the doorway.
- **Wood comes out a piece at a time.** The user found a hole's wood all coming off in one go
  frustrating, boards behind a Masterpiece or not, and liked the chance to "push back and refix it"
  when part of it goes but leaves a gap too small to walk through. As in the real puzzle (a neglected
  hole loses its most recently placed piece), the last piece put in falls out first. Each piece
  holds an equal share of the hole's strength (a three-piece Masterpiece loses one about every 15
  seconds of one raider's hacking). The gap a piece leaves needs that piece again, and refilling it
  finishes the hole as before. Any wood left still keeps them out. You can refill the front of a
  hole with boards behind it wherever no board covers it.
- **Holes made in a raid are roomy and fit the common pieces; the first wall stays small.** The user
  kept getting shapes they could never fill, with nowhere to dump the awkward pieces: in the real
  puzzle fresh holes keep coming, but the wall is fixed. They like the opening wall's simple 1, 2
  and 3-piece holes, so only holes made during a raid changed. A cannon breach is the roomiest that
  fits (three pieces if there's the stone for it, else two, else a single P, F or Y, never a W or a
  U), and of a few candidate shapes it's the one with the most ways to fill it from P, F, Y, T, N
  and L. A weak spot hacked wider gives way the same way. (A test of a player who always picks the
  most flexible spot: random 1- and 2-piece breaches left them with no piece that fits about 4
  draws for every piece placed; 3-piece breaches picked this way, about 1.5.)
  **The first wall keeps its sizes but is picked the same way.** The user was still "not getting
  the right pieces a lot at the start". Its one-piece hole is for a P, F, Y, T, N or L, and its two
  and three-piece holes are the best of six for the common pieces. (Same test, the whole opening
  wall: 3.2 stuck draws per piece placed with random shapes, 2.0 now.)
- **The first wave is dealt fair: the crates bring the pieces that finish its holes.** Even so, the
  user was left needing three F's and an L that never came, with only a T in the toolbox: "This
  first wave definitely needs to be perfectly considered." So from a new game until wave 1 is beaten,
  each deal looks at what's left of every open hole and deals a piece still missing from a way of
  finishing them all as Masterpieces, picking the way that uses most of what's already on the crates
  or in your hands. It looks afresh every deal, so a piece put somewhere else or knocked out just
  changes the plan. Once nothing's missing, or a hole can't be finished exactly any more, it deals
  at random as usual, and from wave 2 on it's all random: asked whether to keep it on past wave 1,
  the user said first wave only. (The same test: dealt at random, all
  eight games got stuck after 3 to 7 pieces with nothing on the crates that fits cleanly; dealt
  fair, five games out of five finished all four holes as Masterpieces in eight pieces.)
  **It's only for mending the first wall, and it never goes round and round.** Building a frame
  with it still on, the user got "four M pieces in a row ... and so many U pieces. The favourable
  pieces thing seems to be stuck on." Each piece the wall was missing went into the frame, so the
  next deal brought the same piece again. So a piece dealt fair that goes into a frame is held
  back for the next three deals, and once every hole of the first wall is
  done the deal is the usual one for good, even when raiders knock pieces out in wave 1. (Building
  only the shack from a new game: each piece the wall needed came once, at most twice, then the
  usual deal.)
  **It plans every hole together, counting what's in your hands and on the crates.** Planned one
  hole at a time, an earlier hole could take one of the two W's meant for the hole you were
  mending, and a third W got dealt that was no use once that hole was done (the user: "it was
  deciding I needed another M before realising I'd already finished that first hole"), or P after
  P while two holes needed a Y and an N. Now it tries the holes in every order and keeps the plan
  missing fewest pieces. (A careless test player, any piece in any clean spot: eight games out of
  eight finished all four holes as Masterpieces in eight pieces.)
  **The hole nearest done comes first.** Needing only an L to finish a hole, the user got three or
  four P's meant for other holes: "it certainly does not seem to have been looking at him being
  like, right, he needs this piece". Now the deal is for the hole with fewest pieces still to come.
  (It also used to hold a piece back for good once one dealt fair was thrown or put in a frame, so
  a thrown L meant no hole ever got an L. Now a thrown piece isn't held back, the hole still needs
  it, and one put in a frame is held back for three deals only.)
  **And it keeps to the usual odds: a rare piece only when the holes really need one.** Picking
  evenly among the ways of finishing a hole, a way that needs a cross came up as often as one that
  needs a P, and the user got five crosses in thirteen pieces: "That feels very broken." Now each
  way is picked with the chance of being dealt the pieces it still needs (softened, square roots
  of the odds: weighted fully, half of what came was P's), and of the plans missing fewest pieces
  the likeliest is kept. (On the same half-built walls, rare pieces went from 11% of what it asked
  for to 2%. Seven test walls all finished as Masterpieces: P's 39%, F's 20%, Y's 16%, and the odd
  V, W or Z.)
- **Throw pieces at raiders, don't bonk them.** A plain bonk was underwhelming. The carried piece
  is the weapon: it hurls at a raider, who goes flying. It costs the piece.
- **A thrown piece takes a while to come back.** Otherwise you could stand and pelt raiders
  forever. The crate you threw from takes 7 seconds to restock on your own, about 0.6 less for
  each crewmate (5.2 with four), and shows a "Restocking" bar; fitting a piece still restocks its
  crate at once. (It was 8: the user found it close but a touch slow, more so with more pirates.
  Marginal changes only.)
- **You can see the toolbox from anywhere.** A strip along the bottom of the screen shows what's on
  each crate, left to right as they stand: the piece in its wood colour, "In hand" for the one you
  took, a restocking bar, or "Taken" when a crewmate has it. So you can plan your next piece from
  the wall rather than walking back to look (the user: "so that it runs a bit faster"). It's
  hidden on the gun tower and while decorating.
  **And you take pieces from it with 1, 2, 3.** The crates are numbered left to right, and each
  tile shows its number rather than the piece's letter (the user: "instead of showing T, U, F, it
  should show like 1, 2, 3"). Pressing the number, or clicking the tile, takes that crate's piece
  into your hands from anywhere in the den, no walking back (the user chose anywhere over only by
  the crates). Holding another crate's piece, it swaps; the same number again puts it back. Not
  while you're holding a piece lifted out of a frame (fit that first).
  Each piece is drawn the way the main game draws its pieces (`js/render.js`): one solid piece with
  its grain and only its outside edge, in the den's wood colour. (A first try drew separate little
  squares; the user: "why are they in squares just joint from each other instead of one piece?"
  No new art styles: reuse the game's own.)
- **Throwing has its own controls.** Shift (next to WASD; R was too far away) or clicking on a raider. Space
  and plain clicks only pick up and fit, so you can fight beside the crates or the wall without
  fitting by mistake. Up on the rampart Space throws too, since there's nothing to fit there.
- **Throws go where you point.** Shift, Space on the rampart, and clicks all hit the raider by the
  mouse pointer (its body or its ⚔ marker, even pinned to the screen edge), not just the nearest;
  only with nobody near the pointer does it pick the nearest. That raider's marker gets a white
  dashed ring, and the pointer turns to a crosshair over a raider you can hit.
  **Over the wall from anywhere (9 Nov).** Raiders hacking at the wall outside can be hit from the
  den floor too, not just the rampart: the piece is lobbed high over the top. With a piece in hand
  their ⚔ markers show, and the prompt says "Shift or click a raider: lob it over the wall". (The
  user, after finding raiders who get in too easy to knock flat: "just being able to lob over the
  wall is fine ... don't make it overly complicated.") A click on a spot the piece fits still fits
  it, even with a raider showing through the hole; Shift throws.
- **Misplaced pieces can be taken back.** Placing one square too high was a frustrating misclick.
  With empty hands at the wall, Space (or Backspace) takes the last piece you put up back off, the
  same way round, so you can fit it properly. Not once it's made a Masterpiece, once another
  piece has gone on, or once you've picked up a new piece from the crates. A boarded-over hole you
  undo goes back to open and gives back its pay; damage the hole took meanwhile stays.
- **The rampart: a walk along the top of the whole wall,** with stairs up at the right-hand end
  (both ends till 9 Nov: the user wanted the armoury hoist's end of the den kept clear, "sword
  fighting board on the left, stairs on the right for the ramparts to go up"). Raiders hacking
  at the wall can only be hit from up there; it's what makes a Masterpiece pay off: while it holds,
  you go up and knock the raiders off it. The view swings up high to look down at them. Keep it out
  of the way (not in front of the gate), and the full length of the wall.
- **The rampart is built a part at a time, as the reward for beating a wave.** Order: the whole
  walk (then the stairs straight after it), then the gun tower.
  - **One frame at a time.** When a wave is beaten off and nothing is still being built, timber
    arrives for the next part. Its frames come one after another, each only when the last is
    done, so there's never more than one to get on with. The second frame appearing before the
    first was done felt rushed.
  - **Walk only on what's built.** You can only walk where the walk's pieces actually are.
- **It's built by carpentry, piece by piece, not by magic.** A footing hole opening in the wall was
  bizarre, and a stretch popping up was too easy. A finished frame then turning into a ready-made
  rampart was magic too. **Every part of the rampart is the pieces you fitted, and they stay those
  pieces.** Nothing turns into anything else, and nothing is added that you didn't build.
  - **The walk: one big square frame, sawn into lengths** (about 24 pieces). The user wanted it
    "one big piece", not a stretch at a time, but one long thin frame the length of the wall ran
    you out of the rare pieces it needed. Rather than change the odds, the user wanted it built
    square, "a more faithful depiction of carpentry": "one square, but then when it gets hoisted
    ... it almost gets like sliced in the middle 2 or 3 times". So the walk's length is cut into
    strips (four on most walls, eleven or twelve squares long), three squares deep: two over the
    stone and one out over the den, only two at the ends, clear of where the stairs come up. In
    the frame the strips lie side by side with straight cuts between them, about 11 by 13 squares.
    The outer strips' den sides are the frame's two outer edges: single squares jut out of one
    (see "Room for the rare pieces") and a square or two is bitten out to make the count come
    right. It can always be filled with not a scrap wasted. When it's full it's sawn along the
    cuts (pieces lying across a cut are sawn through) and the lengths go up onto the wall one
    after another, end to end. (In a simulated build with crates dealt at random, the square frame
    wasted about half the deals the long one did: about 48 against 107. Most of what's left is at
    the very end, when only one or two shapes will do.) **It lies on the floor at the right of the
    den,** the strips running back from the wall, its near end well back from where you mend the
    wall, so you only fit pieces in it once you've stepped back to it: just behind you, it kept
    taking the pieces meant for the wall (the user: "the walk frame gets the focus"). A square
    frame is too big for the floor between the wall and the crates, and the user chose the right
    side: the barrel and chest stand behind the crates, and in a narrow den the crates shift left.
    History: two rows and a ragged third was "very slim", with not much room to be creative;
    three and a ragged fourth was still "long thin straight holes that only fit the P".
  - **The stairs (at each end):** a frame standing upright at the end of the den, a stringer four
    squares deep under the treads. (Solid down to the floor until 9 Nov: a band three squares deep
    held only four pieces, with room for an X in one spot in five. With the wall in two courses
    the stairs are half as tall again and solid ones took twice the pieces, about 15; four deep,
    they take six or seven, about what they did.) You fit pieces into it like a hole in the wall, and the
    pieces are the steps. Half-built stairs are in the way; you can't walk through them.
  - **Any piece will do:** a piece may stick out over the frame's edge. On the walk the spare is
    sawn off when it's full (it has to lie flat on the wall).
  - **Room for the rare pieces, as in the main puzzle.** A big hole there leaves room to put an X or
    a W in a corner early on and still have "plenty of hole left for you to work towards one of
    the common two-hole finishes". Frames too slim for that (the user, 8 Nov: "there's nowhere to
    put things like those rarer weird cross shapes or M pieces ... without messing up the hole")
    make the shipshape finish a matter of luck. **The fix is the edge, not just the size:** "making
    it a bit less square". A Puzzle Pirates hole has "lots of little single tile things jutting
    out, and that's where the rarer pieces fit in". So frames have single squares jutting out (the
    walk's den-side edge, the gun tower's parts where they meet), or a stepped edge (the stairs).
    Measured: an X or W goes in cleanly at about half the spots tried, against 2 in 16 for an X in
    the old walk stretches.
  - **The stairs stay exactly as built, never changed by magic.** Nothing's sawn off: bits sticking
    out stay, and you walk on the real tops of the pieces. A one-square step you walk up; a
    two-square one you hop up. So the stairs stay climbable, a piece can't stick up more than one
    square above the tread line.
  - **A gap is never filled for you.** (Gaps no piece could reach used to be plugged with
    offcuts; the user: "if there's a gap, that's it, that's broken. That's the point of it being a
    puzzle. You've got to make the things fit.") The way out is to lift pieces back out: any piece
    in a frame that isn't finished, anyone's, by pointing at it (or standing by it, with the
    keyboard) and pressing Space or clicking. It goes into your hands.
  - **Shipshape:** every frame's shape can be filled exactly. A frame filled with nothing sawn off
    is Shipshape and pays a bonus.
- **Up on the wall must stay bright.** The fog keeps its distance from the camera and the view
  brightens as it rises; looking down from the rampart went murky otherwise.
- **Co-op crews: everyone collaborates, nobody gives orders.** Up to four pirates defend one den
  together. No sign-up: a pirate name (3 to 16 letters) and a four-letter crew code, shared as an
  invite link. Every pirate does every job equally. One browser quietly runs the raiders and deals
  the crates, but that's only whose computer does the sums: never call it a captain or show any
  hierarchy. If it leaves, the next pirate in carries on; if your link drops, you carry on alone with
  the den as it was. Only pirate names are ever shown, never real ones.
- **In a crew, things can't be taken twice.** Taking from a crate or fitting a piece is checked
  first, so two pirates can't take the same piece or fill the same spot; whoever loses gets their
  piece back ("Someone got there first"). Waves get bigger with more pirates (half as many again for
  each extra pirate). Crewmates wear their own colours with their name over their head.
- **Keep the pirate-den feel, not medieval.** The rampart is a timber walk like a ship's deck, not
  stone battlements. Any rail or trim on it has to be built from pieces as well, or left off. (Flags
  are the exception, since the user asked for them: Jolly Rogers you design yourself, see below.)
- **Some jobs want accuracy, some want speed.** The user loves the variety: the stairs are rapid
  speed carpentry (any piece will do, just throw them in), while the wall holes and the wall-walk
  reward care. Keep that mix when adding jobs.
- **Keep the opening message short.** The first-screen instructions covered the crates so you
  couldn't start. One or two lines at most, clear of the crates; the prompts and toasts teach
  the rest (boarding over, nailing on behind, the rampart) as it comes up.
- **The layer behind must invite you.** The user didn't feel prompted to build a second layer. So
  while you carry a piece, every mended hole with room shows a pulsing outline on the den side
  where the next layer goes, its label says "room for a layer behind", and once every hole is
  mended the prompt sends you there. (Grading those layers is in IDEAS.md.)
  **And it must be easy to see.** A thin outline was too faint: the user could see "it's trying to
  draw a second shape" but couldn't make anything out. So the layer's squares are filled in a
  pulsing light blue with a bold outline (bars, not a hairline), and the board you're about to
  nail on is a green ghost with a bold white outline (wood-coloured, it got lost against the wood
  in the hole). Every ghost gets the bold outline.
- **Snapping goes where you point.** Boards behind a hole snapped a square or two off, so you
  couldn't line one up: the pointer was read on the stone face while the boards stand out towards
  you. Every spot is matched to the pointer at its own depth. **And the preview must sit on the hole from
  any angle.** The user found the real cause of it still looking off: the boards behind were
  full-depth pieces standing half a metre out, so from the camera's angle the ghost showed about
  half a square below the hole. Boards behind are now planks (14 cm) right against the hole (or
  against a piece boarded over it), each layer in front of the last, and the ghost and the blue
  layer hint sit there too.
- **If it shows you where a piece would go, you can put it there.** With the mouse, you can fit a
  piece from as far back as the preview shows (2.5 m further back than before) and a little further
  along the wall; taking one back works from as far. The user: no value in having to walk closer.
  **That reaches the next hole along** (6 m with the mouse, measured to the piece): holes come in
  pairs about 4 m apart, and from in front of either you can fit a piece in the other. The user:
  "you can place it on adjacent holes. You don't need to walk right up to them." Not across the gate.
  (With the keyboard, stand at the wall as before: it decides between the wall and the frames on the
  floor behind you.)
- **Puzzle mode at the wall: the whole wall at once.** The user wanted it closer to Puzzle Pirates:
  working on all four holes, moving between them with ease rather than running the pirate about,
  "a hybrid of the 2D version" once you're at the wall. Walk up to the wall with a piece (or press
  an arrow there) and the camera pulls back, straight on, to show the whole wall. The pirate walks
  along under the piece by themself, a step back so they don't hide the hole (the user likes the
  zoom, and finds "seeing him walk back and forth while you're just effortlessly doing things"
  funny).
  - **WASD is pure piece moving there:** a square at a time, always the way the key points on
    screen. **The arrows jump hole to hole** (to the best spot the piece has in the next hole that
    way, or over its middle if it won't go in). Q/E/F turn and flip.
  - **You leave by fitting the piece or by Esc.** Fitting it ends it, but the view stays a moment,
    so taking the next piece with 1 2 3 there carries straight on.
  - **A click only ever fits the piece there,** never throws it at a raider showing through the
    hole (it did, so clicks seemed not to work). Boards behind are fitted the same way.
  - **No Tab "next spot":** the user found it "annoying and useless".
  - **Not by itself on a frame.** Frames lie on the floor right where you stand to mend the wall, so
    standing on or by one, the view doesn't come on by itself: along the right-hand walk frame it
    kept switching on, and the camera changed while the user was trying to start on the frame.
    The arrow keys still take you to the wall from there.
- **The pirate walks a touch quicker** (5.4 m/s; was 4.6, then 5). The user and a friend both
  wanted the pace a bit quicker.
- **The piece goes where you point.** The user and a friend found it hard to put pieces where they
  wanted. With the mouse, the spot chosen is one that covers the square under the pointer (then the
  one centred nearest it, and a clean fit before boarding over), from a little further off too. It
  holds steady: once the ghost snaps somewhere it stays until you clearly point somewhere better,
  rather than flicking between two spots. This is easier snapping, not auto-play: the piece is never
  turned for you (below).
  **Pointing into the hole means fit it in the hole.** At first, covering the pointed square won
  even if that meant hanging over the stone, and the user saw the ghost sitting off to the side of
  the hole. The ghost was showing the true spot, but the spot was wrong. Now a clean fit nearby beats
  boarding over while you point into a hole or frame. To board over, point at the stone beside it.
- **One breach doesn't let everyone in; the wall you kept strong pays off.** Raiders used to make
  for any open gap along the whole wall (or else the weakest hole), so once one hole went, the
  whole wave poured through it. Now each raider attacks the hole in front of where they come up to
  the wall, and only switches to a breach within about 3 m. Raiders at a Masterpiece mostly tire
  and leave. (They now also need a gap they can walk through: see "Raiders walk in" above.)
- **The gun tower (after Gunnery): it must be instantly recognisable as Gunnery.** The user knows
  the puzzle well, and the first tries missed it: stores bounced into the guns by themselves, the
  deck was too small, the pieces were tiny and hard to tell apart, the bucket and the arrows
  unreadable, and the guns faced the wrong way for the puzzle. So: pay attention to the specifics
  of the real puzzle, and the graphics must look like Puzzle Pirates, not some other 3D game. But
  it must still make sense in the den: the gun you load is the gun that fires, and you see it fire.
  - **Playability and readability above anything.** Making things look better in 3D tends to make
    them harder to pick out, so push contrast and boldness as far as it will go: bold black
    outlines round the stores, crates, guns and barrel as Gunnery draws them; the deck toned down
    close to Gunnery's deck brown so everything on it stands out; stores a size up, lit from within
    a little and with a soft glow under each; arrows big and bold. Colours on the board are drawn true
    (not washed out by the scene's light or haze).
  - **Where and how big:** built last, after the whole rampart: a square platform jutting out from
    the wall over the gate like a bastion, **the size of a Gunnery board, 13 by 13**. One square of
    a carpentry piece is one square of the board, less two squares off each back corner where it
    meets the wall (169 squares isn't a whole number of pieces; 165 is). It's built of ordinary
    pieces in three frames (4, 5 and 4 rows, from the wall out), laid on the den floor and hauled
    up and out over the wall one after another. Where two meet, the nearer one hands three single
    squares of its edge to the next, so each fills exactly and they lock together with squares
    jutting out. (It was 5, 5 and 3 square rows: the front one, 39 squares, could never be filled
    exactly.) The deck still shows the pieces you laid, toned down. You walk out onto it
    from the wall-walk; the camera then looks down on the whole board, like the Gunnery screen.
  - **The rules are Gunnery's:** a barrel in the middle rolls stores out each way in turn till
    there are two of each on deck; one used, another comes. A store rolls straight; blocked it
    turns right, else left, else back; two that meet both turn back. Arrows steer them, three each,
    the oldest going when you chalk a fourth. Guns load powder, wad, shot; a bucket swabs a fired or
    fouled gun; the wrong store fouls it. Your body is an obstacle too.
  - **The guns lie as in Gunnery: two down each side, muzzle out, with a lane between the muzzle
    and the gunwale.** You load a gun by guiding stores in front of it and in: **a store only goes
    in off an arrow in the lane pointing into the muzzle**; otherwise the gun's an obstacle. (The
    user: pieces going in front of the cannons and being guided in is key to recognising it.)
  - **Firing:** a loaded gun with something to shoot at is run out over its lane (once the lane's
    clear; while out it blocks the lane) with its muzzle through the port, **swivels on the port**
    to aim, forwards at the raiders coming in and their cannon or back along the wall at those
    hacking at it, fires from its own muzzle and recoils back in, square again. They don't all fire
    at the same raider. Every gun is worth loading.
  - **One raider, one gun.** Two loaded guns on one side both ran out at the same raider, then one
    hauled back in; the user found the lunge and back-off weird. A gun now claims its target and
    keeps it till it fires, and the others only pick from who's left (or the raiders' cannon). With
    nothing left to aim at, a loaded gun stays in.
  - **What's in a gun shows in the gun, as in Puzzle Pirates.** The user: whatever's loaded should
    visibly show in the cannon. An open trough along the top of each barrel holds a little copy of
    each store rammed in: powder by the breech, then the wad, then the shot by the muzzle, each
    popping in as it's loaded. The trough glows when it's ready to fire, goes red when fouled, and a
    fired gun smokes until it's swabbed. The gun's label hangs out over its gunport so it never
    hides the barrel.
  - **The board:** no crates round the barrel in the middle, none in the lanes, more out towards
    the edges, never side by side, making pockets that trap a store and loops that bring stores back
    past a gun. Each new board is tried out (stores rolling with no arrows) to pick one where about
    two guns sit on a loop of their own and the rest take more work: as in Gunnery, it's easy to
    load two, harder to load all four, and making loops (or freestyling) is the core of it.
  - **The look:** bright silver guns three squares long, a red gunwale with a gold rail, light-wood
    crates of shot and rum, the barrel on its side; shot bright iron, powder a red bag with a flame
    on it, wad a white puff, the bucket **drawn flat, as Gunnery draws it**
    (a tin pail with blue water, its handle and swab, always facing you: the 3D one looked bizarre).
    Crates sit square to the board, never angled: a puzzle has to read at a glance, so where 3D
    and readability pull apart, go for Gunnery's flat, 2D feel.
    **Arrows are yellow, as in Gunnery** (not blue: the user corrected this): a bold yellow arrow
    with a dark edge on a square lit up yellow underneath; a crewmate's in their own colour. Gun labels show the
    store each wants next as a picture; "Loaded!" in Puzzle Pirates yellow and red. A key to the
    stores shows while you're on the tower.
  - **The mouse works as in Gunnery:** click a plank to chalk the arrow the ghost shows, drag the
    way you want it to point, the wheel turns it (it never zooms on the tower), click an arrow to
    turn it, right-click to rub it out. Space chalks the plank ahead of you, Q/E turn it.
  - **To try it straight away:** `den.html?try=all` (or `?try=gundeck`) starts with the rampart,
    gun tower and house built and you up on the tower, for the user's own testing. It must load
    fast: it once took about a minute, because the engine's solver works row by row and a long,
    thin frame (the tower's 3-row strip, a wall-walk) sent it backtracking for ages. The den's copy
    of the solver turns wide frames on their side and solves them column by column (a millisecond),
    which also stops the game stalling when a new wall-walk frame is laid out. The square walk
    frame is too big for either way round (a fresh one could take ten seconds to check), so the
    frames are checked with a search of their own that gives up on a line as soon as the empty
    squares split into a pocket that isn't a multiple of five: a few milliseconds.
- **The den's buttons sit in a row, all in view** (top left, under the stats): your pirate, your
  den, decorate, pause, play with a crew, cheats. Discoverable matters more than tidy: folded into
  a ☰ menu (8 Nov), the user missed seeing them, as they use your pirate, your den, decorate and
  the cheats a lot. Small text, but big enough to hit easily (shrunk right down, the "hit area is
  tiny").
- **The cheat menu, for trying things out** (the Cheats button, or the backtick key). The user asked
  for a way to skip stages. It pauses the game while it's open. Playing alone only, as with a crew
  everyone's game would have to follow. Kept small: little buttons, few of them.
  - **Skip to a stage:** the start, the walk, the gun tower, or everything built. The den starts
    afresh, built up to there, just as that part's timber arrives (the walk after wave 1, the gun
    tower after 2). Not a stage per frame: that
    puzzled the user. What it builds is filled with a mix of all the pieces, as a crew would: the
    plain solver's fill was nearly all Ps.
  - **Or skip ahead now:** beat this wave (its timber comes as usual), next wave now, mend every
    hole (Masterpieces where they'll go, damage repaired), build the shack. No "finish this frame"
    or "+100 gold": the user found them no help.
- **Making it yours (pirate looks and the den's dress).** The user wants players to be able to make
  it all their own, and the general feel must match the rest of the den. Code: `js/den-look.js`
  (the pirate builder, dyes, familiars, flag drawing) and the "dressing" and "decorating"
  sections of `js/den.js`. **Two panels, two buttons:** **Your pirate** (Pirate, Clothes,
  Familiar) and **Your den** (Flag, Den, Shack). The user: Your pirate is no place for the den's
  things; that's a separate concept. (Your den shows your flag where Your pirate shows the pirate.)
  - **Pirates:** male or female, dressed from the real Puzzle Pirates tailor (YPPedia's clothing
    names: Tricorne, Feathered hat, Captain's hat, Sleeping hat, Striped shirt with vest,
    Swashbuckler's jacket, Corset, Stripy knickers, Pantaloons, Kilt, Long dress bottom, Buckle shoes,
    Curled boots and so on) in the tailor's standard palette of 27 dyes (YPPedia: Clothing palette).
    Skin, hair style and colour, beard, eyepatch, earring. Kept in localStorage (`carp.den.look`),
    and crewmates see it (a `look` message; anything received is cleaned against the lists). The
    crew colour stays on the name tag. "Surprise me" picks a random outfit.
  - **Whatever you wear on your feet must always show.** The user couldn't see the feet of a pirate
    in a long dress. So skirts stop above the ankle, aren't wide at the hem, and the feet come a
    little forward under them.
  - **Familiars** (YPPedia: Familiar): a parrot (two colours), a monkey (natural colours only, as in
    the game) or an octopus, on the shoulder, each with a little life (bobbing, flapping, tail).
  - **The shack stays small and open at the back.** The user loves its size ("it gives it a lot of
    character") and having no back is essential to see inside and decorate it: "a cheap, simple
    lean-to thing". Don't add a back wall. The camera follows you right to the back of the den
    where it stands (it used to stop short).
  - **The house is built like everything else.** The user: "you should build it in a carpentry
    style way, the same as you build the decks: you put something on the ground and it starts
    hoisting it into the side of a house". Its four parts (front wall with a door and window, two
    side walls, a lean-to roof) come one at a time as frames laid on the floor by the cave wall on
    the left. Fill each, it's sawn to fit, then hoisted on ropes and swung into place. Its timber
    never comes on its own after a wave, and building it never holds up the rampart's timber.
  - **The shack's plot is there from the start, and it's obvious what to do.** The user loved
    building it but it was hidden in a menu: "you should be able to walk into that corner and it'd
    be clear that there's an action". Its footprint is chalked out on the floor in the far left
    corner, with pegs, a line round it and a "Your shack" sign. Walk in: "Space: build your shack
    here". Once it's up, the same spot says "Space: paint and dress your shack" and opens Your den
    at the Shack tab.
    **A label over the sign says so before you walk in** ("Your shack: build it here", walk in and
    press Space or click), as the holes have. The user clicked it by accident and couldn't work out
    what had happened. The sign's post stops under the board: running up through it, it hid the S,
    and the sign read "Your hack". The sign is turned to face into the den.
  - **You see the carpentry pieces it's made of.** "It's my little shack. It's made of carpentry
    pieces" (if not as blatantly as the frames). Each piece has a bold dark edge on both faces, and
    paint (walls and roof, any dye) lets each piece's own timber show through.
  - **Decorating is placing things yourself, as in a Puzzle Pirates house:** "just having flags
    appear isn't what you want". Decorate mode: pick a Jolly Roger, a banner, a lantern or a rum
    barrel, a ghost of it follows the pointer, wheel or Q/E turns it, click puts it down,
    right-click takes one down. A ring shows green (fine), red (not there) or amber (one's here).
    Never in front of the wall (z < 5.2, where you mend and build), on a frame, in the house or by
    the crates. Up to 24 things. They stay put game after game. **It must be obvious how to start:**
    the user couldn't find it in the Your pirate panel, so it has its own **Decorate** button next
    to Your pirate (it reads "Done decorating" while you're at it) and the **B** key.
  - **Flags are yours to design:** emblem (skull and crossbones, skull and cutlasses, anchor,
    kraken, bleeding heart), cloth pattern (plain, border, stripes, hoist band) and three dyes. The
    den's own flags (over the gate, on the gun tower's outer corners, on the house roof) fly your
    current design; ones you put up keep the design they had. The den's dress (flag, paint,
    decorations) is kept in localStorage (`carp.den.den`) and shared with the crew (a `den`
    message, and in the sync a joiner gets).
  - **Even the silly things are yours to change.** The user wants to decorate everything, "just all
    silly things": the gun tower's gunwale, rail and crates take any dye (or Gunnery's own red,
    gold and light wood); painted crates keep a hint of their wood.
  - **Pick your landscape:** a barren cave (as it started), a seaside hideout (sand, sandstone,
    palms, the sea and its surf out beyond where the raiders land) or a jungle hideout (mossy
    ground and rock, big trees, ferns at the foot of the cave rocks). The user asked for "something
    simple for right now". Only the look changes, never the play: trees stand out past the raiders'
    cannon, beyond the wall's ends and behind the cave rocks, and ferns never go where the house is.
    These are on Your den's Den tab, kept and shared with the rest of the den's dress.
- **Future ideas live in [IDEAS.md](IDEAS.md).** When the user brain-dumps ideas for later, note
  them there rather than building them.
- **There's always something to do with a junk piece.** Holding three useless pieces with nothing
  to do was frustrating. Any mended hole (Masterpiece or boarded) takes layers behind it, on the
  den side, up to three deep, damaged or not. Raiders hack through the hole's own wood first, then
  each layer in turn, and only get in once the last is gone.
  - **A layer is the hole again, and its pieces slot together.** (Each piece used to be a layer of
    its own: the user placed one, then another that fitted perfectly beside it, and it started a
    third.) A layer's opening is the hole's shape; you fill it a piece at a time like the hole, and
    only once it's full does the next one open in front of it.
  - **Studwork shows where it goes:** once a hole's mended, a timber frame a square wide goes up
    round it on the den side, with the opening edged in dark wood, and the part still to fill glows
    blue while you hold a piece (the user: "some kind of wooden studwork structure outlining where
    the second layer goes, with material between the holes").
  - **Same grades as the hole:** filled exactly, a Masterpiece layer (as strong as a Masterpiece,
    and paid the same); a piece may hang over onto the studwork, but then the layer's only boarded
    over. Unfinished, each piece adds its share. It comes apart a piece at a time, last in first.
  - **You add to the outermost layer.** A layer raiders have knocked pieces out of from the far
    side can't be reached once there's another in front of it.
  - **Each layer has its own bar** under the hole's on its label (amber while it's unfinished), so
    boarding behind a damaged hole shows (the user saw "no visible difference to the healthbar").
  Clean fits and boarding over come first when choosing a spot; layers behind come last.
- **The camera can be turned and zoomed:** Z/C or right-drag to turn and tilt, -/= to zoom, V to
  reset. **It turns all the way round**, so you can see the outside of the wall (the user wants
  that, especially for decorating it); moonlight from outside lights the wall's outer face.
  Walking follows the way the camera faces. Q/E turn the piece, right-click flips it.
- **You turn the pieces yourself; nothing turns them for you.** Making the carried piece turn
  itself to the best fit was tried and dropped: the user felt it cheapens the puzzle. Speeding the
  carpentry up belongs to a 2D mode instead (IDEAS.md).
- **The wheel turns any piece you're carrying,** whether or not it has a spot to fit (it used to
  turn only a piece showing a spot, and zoomed otherwise: the user, 9 Nov, "you should always be
  able to rotate a piece and flip a piece"). Empty-handed, it zooms, and - and = always zoom.
- **Throwing at a raider is the only way to discard.** No scrap fire, no bin: a piece you don't
  want (often a rare one) can only be got rid of by throwing it at an enemy pirate, which deals a
  fresh piece onto that crate. Swapping at the crates just puts it back. With no raiders about,
  you fit it, board it over, nail it on behind a mended hole, or lay it in a rampart frame.
- **You must see what's happening in the den.** Raiders inside get a ⚔ marker, pinned to the edge
  of the screen when they're out of view (gold when carrying loot). The view widens on narrow screens.
- **Keeping them out must be possible, and must feel worth it.** The user found it demoralising
  that raiders got in "no matter what": there seemed no point stopping them. (The other side of it,
  9 Nov: it's "a bit demotivating when it's so easy to just kill them as they come in", since then
  blocking off the holes doesn't matter either. So now you can lob a piece over the wall from the
  den floor: see "Throws go where you point". Raiders inside stay as easy: it's a puzzle game.) The cause was the
  raiders' cannon, firing every 9-20 seconds from wave 2, each shot an open hole a raider was
  through two seconds later; nobody can mend that fast. (Tested: with every hole a Masterpiece and
  nothing else done, six raiders still got in over waves 2 and 3.) Now:
  - **The cannon has a few shots a wave** (one in wave 2, two in wave 3, three after), the first
    about 20 seconds in, 22 seconds apart.
  - **It aims first, for 8 seconds**, the spot glowing red on both faces of the wall with a
    countdown ("Their cannon's aiming here!"). A hit from the gun tower spoils its aim.
  - **A fresh breach is choked with rubble**: raiders must hack 10 seconds of it clear before they
    can climb through, and a piece fitted into it clears it. Its label says so. (Cleared, it's
    like any other hole: if it's too small or high to walk through, they hack it wider first.)
  - **A raider who tires at your wall is turned away**: +5 doubloons, a cheer, and a "Turned away"
    count on the HUD. Each wave ends with how many you turned away and how many got in, and a wave
    where not one got in pays +10 more (the user wanted more reward for blocking them off).
  - **Raiders always have swords.** (Swordless early waves were tried and dropped: the user
    prefers to balance how quickly they chop through.)
  - **How fast they chop is the balance.** They start slow and build up: 55% of full speed in wave
    1, 15% more each wave, full from wave 4. Each piece in an unfinished hole takes 8 seconds of
    full-speed hacking (it was 4, and a half-mended hole fell in seconds). To experiment:
    `den.html?hack=0.8` scales all hacking; in the console, `den.tune` (hack, start, step) and
    `den.HP` (master, boarded, piece, patch) change it live.
  - **Balance tests** (a test player getting one random piece every 12 seconds, best of three,
    fitting it exactly if it can, else boarding over, else nailing it on behind; four waves, three
    runs each; chest at the end, starting from 60): full speed from wave 1 with pieces at 4, lost
    in wave 3 every time; the slow start alone, lost in wave 3 or 4; pieces at 8 alone, survived
    with 2-16 left; slow start with pieces at 6, 16-60; **slow start with pieces at 8 (now),
    35-131**, wave 1 usually held completely and wave 4 a real fight.
  - (Tested: a steady solo player fitting a piece every 10 seconds lost nothing in three waves
    and turned nine raiders away. Holes still wear down wave on wave, so boards behind matter.)
- **You can pause.** A Pause button by Your pirate, or P (P, Space, Enter or Esc carries on).
  Everything stops: raiders, the wave timer, the Gunnery stores. It also pauses by itself when you
  switch away from the tab. Only when playing on your own: with a crew the raiders don't wait.
- **Give enough time to build.** A piece takes about ten seconds to fetch and fit, so the first wave
  waits 75 seconds and starts small. **But no longer than it takes:** the first wave comes as soon
  as you've completed all the holes (the user), 3 seconds after the last one so you see it done,
  with "The wall's mended!" on the banner.
- **Keep the raids big and heavy; give a longer breather instead.** By wave 8 the user was
  overwhelmed (nine raiders, square three-piece holes still open), but didn't want smaller holes or
  fewer raiders: "You need that for the feel of the puzzle ... I like the bigger, heavy raids, and
  especially the cannon and the chaos, and having to pay attention to the wall." So the calm
  between waves is 40 seconds (it was 20), time to catch up on the wall and the frames.
- **The den has a gate** and raiders attack from the far side of the wall, with swords and (from
  wave 2) a cannon that blasts fresh holes (a few a wave, aimed first; see above). Keep
  repairing. **The cannon stands well back** (16 m
  out, behind where the raiders gather): with the gun tower jutting out, the user found it too far
  forward at 10.5 m.
- **A hole is open right through the wall.** The user likes the empty holes, a "nice incomplete
  wall": no backing behind them that looks like cladding or boarding. The dark behind the stones
  (hiding the gaps between them) has the holes cut out of it, including fresh ones from the cannon.
- **You must be able to see the raiders.** Behind the wall they show as red silhouettes through
  the stone; labels over each hole show its strength and who's attacking it.
