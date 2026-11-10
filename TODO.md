# Pirate Den: to do

Fixes, quality-of-life and feel changes the user has asked for. These are agreed: just do them.
New puzzles, new features and the user's unrefined ideas go in [IDEAS.md](IDEAS.md) instead.
When one's done, put its rule in [RULES.md](RULES.md) and delete it from here. Not published with
the site (`.assetsignore` skips `*.md`).

## Asked for

- **Land in the public den by default.** The user asked where the public lobby went (it was
  talked about but never built). The den you land in should be a public one anyone can drop into,
  with no cap on numbers. Private crews with a four-letter code stay alongside it. To work out:
  - **No cap:** the crew room is limited to four at present (`MAX_CREW` in `worker/crew.js`), and
    the first pirate's browser runs the raiders for everyone. With many pirates, that browser's
    upload and the size of each message grow, so the snapshots would need trimming. Pirates far
    away could be sent less often.
  - **Raiders scale with the crew** (half again per extra pirate), so a big drop-in crowd needs a
    sensible ceiling on wave size, or a different scaling.
  - **Drop-in, drop-out:** someone arriving mid-wave just appears and starts mending. Nobody's
    progress depends on who's there, so a pirate leaving never spoils it for the rest.
  - **Solo stays possible:** keep a way to play alone (a "Play alone" button).
  - **Moderation:** pirate names are letters only already, but an open room may want a way to hide
    a pirate who's being a nuisance.

- **WASD walks you off the gun tower's arrows (8 Nov):** on the Gunnery deck, when you're close
  enough to chalk arrows, WASD still moves the pirate. The user: "WASD should change the direction
  of the arrows, not move the character". So up close it should be a mode of its own, where WASD
  turns the arrow, and Esc leaves it.

- **A piece fitted into a hole under attack has no strength (8 Nov):** fit a piece into a hole
  raiders are hacking at and it goes straight away: "it doesn't seem to have any health, it's more
  like it gets thrown at them". A fresh piece should hold them off for a while, with its own share
  of the hole's strength. (How long it should last to pin down with the user.)

- **You still have to be close to the wall to fit a piece (8 Nov):** there's still a minimum
  distance for placing a piece in the wall. The user: "we were meant to remove that so you can
  place from anywhere". Fitting a piece into the wall should work wherever you're standing.

- **Pull the tricky parts out into their own tested pieces (8 Nov):** the den's code is getting
  more complicated, all in one long file with few separate parts. The user: the fair deal "is
  definitely worthy of a class that's got some proper automated tests around it. Like, here are
  some holes, test what pieces are generated", so they can describe the scenarios they run into
  and have each one become a test. The same for working out layouts (the wall's holes, the frames,
  the walk), "their own little classes ... that you can put tests around", for quality control.
  Tests that run without the browser, from the command line. The user wanted "an actual
  framework, not just some plain JavaScript" (they're most at home in C#), and chose TypeScript
  with Vitest. **Started 8 Nov:** the fair deal is done, in TypeScript (`src/den-deal.ts`), with
  73 Vitest tests (`npm test`). Still to do: the architectural review the user asked for (what's
  tangled in den.js, how to split it, in what order), then the layouts (the wall's holes, the
  frames, the walk). Found on the way: tested on any holes the engine makes, the fair deal asks
  for fewer rare pieces than dealing at random but still 17%; the den's own walls are roomier, so
  test with the den's wall maker once it's pulled out.

- **The fair deal's pieces fit, but never lead to a Masterpiece (8 Nov):** even after the "hole
  nearest done first" fix, the user is "getting pieces that I guess technically fit, but would not
  in any way ever lead to a masterpiece", and suspects the deal's idea of what fits is off. To look
  at with real examples once the tests are in place: a way to save the holes and crates as they
  were when a bad piece came, so it can become a test. (Worth checking: the deal knows a piece fits
  some way of finishing the hole, but not that you'll put it in the one spot that does.)

- **The walk frame once the wall's all filled (8 Nov):** the user: "the walk should appear once you
  are safe and have filled in all the holes, so you can work on that while they try in a futile
  attempt to get in". So the walk's frame comes as soon as every hole is mended, mid-wave or not.

- **A dazed raider behind a hole wastes your piece (8 Nov):** walk up to fill a hole with a dazed
  raider behind it and you've "no choice but to throw it", which wastes the piece you need, "then
  it only dazes them for enough time for you to pick up the next thing and repeat the dazing, you
  make no progress". You should be able to fit the piece in the hole instead of throwing it (or the
  daze should last long enough to fit one). (Which, to pin down with the user.)

- **Waiting soldiers block the Swordfight board (9 Nov):** soldiers with nobody to fight "stand
  in a spot that obscures the swordfighting board". They should wait somewhere clear of the
  armoury hoist's view, so the stack is never hidden behind them.

- **The Swordfight board hides the stairs being built (9 Nov):** "the swordfighting board
  obscures the stairs while you are building them". You should be able to see the stairs' frame
  clearly while you build it. (Since the last update the stairs are on the right and the armoury
  hoist on the left, which may already have fixed this: check once the new version's live.)

- **The bottom of the gate looks missing (9 Nov):** "I feel like the bottom of the gate is missing
  now. I don't know what it was like before, but it was a lot better." (To pin down with the user:
  since then the gate's five rows tall under a beam, in a lower middle between towers. Check
  whether it still looks wrong.)

- **Raiders getting through mustn't end the game (9 Nov):** rethink what happens when raiders get
  in, because the den should let you go off on side quests, row out to the ship and explore: "I
  don't want the game to be ending because you decided to go exploring." Getting plundered should
  cost you something without ending everything. (What the consequence is instead: to pin down
  with the user. A first sketch, with raids becoming opt-in after an opening siege, is in
  IDEAS.md, "Raids you choose".)

- **Split the den off from the Carpentry primer (9 Nov, not yet):** "we need to separate this code
  at some point from this carpentry primer thing, because this is obviously far more interesting
  ... I think that can just be removed and just focus on the pirate then. It has evolved." But
  "we don't care about that at this point". Later: the den becomes the site (or its own repo), and
  the primer goes. (How, where it's hosted, and what of the primer's engine the den still needs,
  to pin down with the user when it's time.)

- **Rowing by port and starboard (10 Nov):** the user loves IDEAS.md's "Port and starboard":
  "absolutely hilarious ... not obviously like a brand new puzzle, but it's certainly a nice twist
  on bilging ... Do that. Absolutely do that." Her oars are rowed by a Bilge board split down the
  middle: the left half is her port oars, the right half starboard. Clears on a side pull those
  oars; even work keeps her straight, more on one side turns her, so the puzzle is the steering.
  Over a shoal the deep channel twists and you plan your clears to follow it; running aground
  just stops her till you clear her off. The graphics suit rowing rather than bilging ("you'd have
  to update the graphics to suit the rowing theme"). Goes with the wind and oars, and gives the
  shallows the puzzle they were missing. For now the single-player version: one full Bilge board,
  dressed for rowing on each side (10 Nov: "a full bilge board, obviously with the rowing kind of
  graphics on each side"). No cap on a big clear: "everything should be proportionate, but I
  guess that's the point of Vegas. I want the funny animation." A Vegas on each side at once
  sends her zooming at super speed, "the same as traveling on the winds", with her rowers going
  like crazy. (The rules are built: `src/rowing.ts`. The board, its look and the oars at sea are
  next.)

- **Mirror strokes as the den's rowing board (10 Nov):** the user played `row-test` and loves it
  ("This is actually quite a good puzzle. I love it."). The test page now has fewer kinds of piece
  (5, for more cascades), the den's look and her rowing in 3D (IDEAS.md, "Fewer kinds, tested").
  Next: mirror strokes as the den's rowing board on the sloop, two boards side by side, with the
  lean and the compass the den's rowing already has.
  Now, and balanced (the user, 10 Nov, on the den's rowing as it is: "it only took three moves to
  generate three clears to generate a turn, and it ended up being a turn because I did one on one
  side and two on the other. So that's basically impossible to go straight"; mirror strokes is
  "ready enough to be slotted in ... even just that prototype mirrored thing"). Going straight
  must be something you can aim for: a small lopsidedness rows her straight, and only a clear
  imbalance turns her.
  And the turn goes the way you'd expect, not the way real oars do (the user, 10 Nov: "if you pull
  on the right-hand side, it should definitely go right"): more pull from the right-hand board
  turns her right, more from the left turns her left.

- **Something worth finding in the hidden cove: treasure (9 Nov):** the canal and the cove "would
  be great, but ... it needs a point of interest in here, even if it's a little like treasure
  chest on this little beach in the cove. You need to be able to go in here and do some treasure
  hauling or something." So: step ashore in the cove, and Puzzle Pirates' Treasure Haul brings up
  the treasure, played by its real rules (checked first), with a believable reason for it there.
  (Treasure Haul's real home is a wreck, so it went at the clifftop lagoon's wreck, the crane's
  place, now built; the cove keeps a chest of its own on the beach. How you get that one: to pin
  down.)

- **Rescue a capybara at the clifftop lagoon (10 Nov):** the friend's side quest (IDEAS.md, "Side
  quests that leave friends about the den") goes in the lagoon: an animal is trapped there, you
  rescue it (by a puzzle, as every reward is), click it and it turns up back at the den as "a pet
  that you found and rescued". A capybara is semi-aquatic, so it has to make sense (the user, 10
  Nov: "not just hanging around on the land"): it's trapped in the water, not on land (tangled in
  an old net caught on the wreck, say), and at the den it lives at the water's edge, on the beach
  and in the cove's shallows near the shack, wading, swimming and sitting in the water as
  capybaras do. Freed by Foraging (the user, 10 Nov: "Definitely foraging ... it's got the same
  kind of logic as treasure haul, but like reversed, and it fits the scene better. And we want
  foraging later anyway"): Puzzle Pirates' real Foraging, played by its real rules, built as one
  module of its own to reuse later (the foraging island), with the capybara as the container
  stuck high on the lagoon's bank in reeds, roots and mud; cleared down off the board's foot it
  splashes into the water and swims to her. The capybara is called Umami (the user, 10 Nov: "for
  fun ... since he requested it"). The crane being built only for
  the session is fine for a proof of concept (a refresh starts afresh).

- **The puzzles' pieces checked against the real ones (10 Nov):** "the last few puzzles, the
  graphics have been placeholders rather than matching the Puzzle Pirate pieces". Compare each
  puzzle already in the den (Treasure Haul above all, and Bilge, Swordfight and Gunnery) with its
  YPPedia page's pictures, and redraw any piece that doesn't read as the real one (RULES.md, "A
  puzzle's pieces look like the real ones").

- **The patch's pieces show when she rows (10 Nov):** "when I've just clicked oars, I see the
  carpentry pieces for the repairing the damaged carpentry puzzle I've just played." Once she's
  patched, nothing of the patch puzzle should show over the rowing board.

- **A wind by the old wreck beyond the checkpoint (10 Nov):** the wind, parked everywhere else,
  blows in one place only: not the lagoon (the user first said so, then: "maybe I didn't mean the
  lagoon"), but "once you get past the Imperial checkpoint, there's that bit to the left ... where
  you can have the wind to the left, where I can see a bit of a shipwreck. The one that you can get
  through by going through the locks, but without going to the lagoon." So the old wreck is in
  sight beyond the checkpoint, "tempting, but you can't get to it unless you go around the back
  way": a wind dead against her keeps her off it from the checkpoint side, and the locks' way
  round brings her in to it. The oars beat the wind too, but that's never said: a secret for
  players to work out ("we won't tell anybody that, but they can figure out oars go against the
  wind"). Only there: "it should only really apply to this little ... area, not everywhere,
  because otherwise it's irritating."

## Needs a playtest to pin down

- **The captain's map and its cutscene (9 Nov).** (RULES.md, "The captain's map".) Seen: the map
  "is great"; Dalnoth redrawn from his portrait and the map's view cleared, not yet seen. Watch: whether the cutscene's timing and camera feel right (about ten
  seconds), whether the map reads well from where the camera looks down on it, and whether M is
  a good key for it.

- **Towers, a lower middle and a night sky (9 Nov), not yet seen by the user.** (RULES.md, "You
  can see out to sea".) Watch for: whether enough of the beach shows from where you usually
  stand; the step down from the towers to the middle; the walk and gun tower spanning the middle
  on posts; the sky's colours in each landscape; the ship looking too close or big now it shows.

- **Swordfight at the armoury hoist (8 Nov), not yet tried by the user.** Rebuilt after the
  first demo: the board is a stack of weapon crates under a tall timber hoist on the left of the
  den; chests (fused blocks) arm soldiers, more with combos; loose crates are broken up for
  planks that mend the wall a piece at a time (RULES.md). The user wanted "to see what it feels like ... it's hard to say without
  seeing". Watch for: whether the stack now feels part of the den, and the crates big enough from
  where the camera puts it (it frames the whole hoist, 7 m high); too few soldiers now only chests
  arm them (one per chest, the first demo's six from one break looked too strong); repairs coming too often
  or too seldom (4 loose crates a piece's worth), and planks finishing a hole as a Masterpiece
  paying a breaker that makes more planks; the order you pick crates up giving you
  a say in what comes next (the user: "kind of okay. It adds a bit of an element of difference").
  Since 8 Nov Masterpieces also pay a breaker pair, sent to the front of the queue: watch for
  that making the stack too easy, or too many breakers piling up on a well-mended wall.

- **The cove (9 Nov), not yet seen by the user.** Raiders row in to a beach, and their cannon is
  on a ship out in the cove (RULES.md, "A cove"). Watch for: the cove only showing when you turn
  or tilt the view, or go up on the wall (the usual camera frames the wall, as before); the ship
  too dark or too faint in the barren den's night; a row of beached boats looking cluttered.

- **The gate and the beach (9 Nov), not yet tried by the user.** Walk up and it opens; out on the
  beach you can throw straight at raiders (RULES.md, "The gate opens"). Watch for: the camera out
  there (it looks down over the wall; the gold outline shows you under the gun tower); the gate
  opening every time you work near it inside; throwing from the beach being too easy a way to
  thin the raiders out. Not tried with a crew (a crewmate by the gate opens it for you too).

- **Bilging the shallows (9 Nov), not yet tried by the user.** (RULES.md, "Bilging the
  shallows".) Watch for: the board being hard to find (it's out on the beach to the right of the
  gun tower; nothing points you to it yet); the pieces readable from where the camera puts it; the
  tide coming in too fast or too slow (a row every 30 seconds), and being worth bilging at all;
  the rocks too harsh or too soft (a point of stamina a metre, up to 6 m); barrels too strong;
  the sea coming in close at high tide making the raids feel harder for anyone who'd rather not
  bilge.

- **The longer calm between waves (8 Nov), not yet tried by the user.** 40 seconds now (it was
  20), after being overwhelmed by wave 8; the raids stay as big. Watch for: still overwhelmed late
  on (then perhaps longer still, or longer only as the waves climb), or the calm dragging early on.

- **Turning a piece close to the wall feels off.** The user can't yet say how (which way it
  turns? where the ghost jumps to?). The snapping changes of 7 Nov may have helped, and since 8 Nov
  the whole-wall puzzle mode (arrows move the piece by screen direction); ask again.
- **The Carpentry view (9 Nov), not yet tried by the user.** (RULES.md, "The Carpentry view".)
  Tab from anywhere on the den floor goes straight on to the wall or a frame (and since 9 Nov it comes
  on by itself at a frame you bring a piece to), with Puzzle Pirates'
  own keys; it stays on between pieces. Watch for: the wall's stretch of view (15 m round the
  piece) too close or too far; the stairs' frame hard to read (dark on the dark cave wall); the
  pirate in the way (they stand beside the piece now); the tabs over the prompt (ticks where the
  piece fits); one staircase on the right, and the den 4 m deeper; Q/W/A/S on a long wall (the nearest hole that way, up or down first); still
  coming on by itself when you walk up to the wall with a piece (and staying on: Esc to walk).
  Since 9 Nov (after the user's keyboard test): left and right skip the bare stone between holes,
  Q/W/A/S always leave the hole you're at, a resting hand on the mouse no longer undoes key moves,
  Shift+Tab goes back, the tabs are a clearer bar. Watch for: the arrows' jump to the next hole
  feeling abrupt, and anything else the keys do that surprises.
- **The wall in two courses (9 Nov), not yet tried by the user.** (RULES.md, "The wall in two
  courses".) Watch for: open high holes being too easy a way in (no stone to hack first, so most
  raiders go for them while they're open); the ladders reading clearly from inside the den; the
  hole labels for the low holes sitting over the stone between the courses; the gate now tall and
  narrow (nine rows high, still four wide); the stairs as a stringer four deep (a band three deep
  was turned down before for holding too few pieces: this one holds six or seven); the wall-walk
  and gun tower half as high again (5 m); the Carpentry view taking in the whole wall (the holes
  small on a narrow window?).
- **The walk as one square frame, sawn into lengths (8 Nov), not yet tried by the user.** About
  24 pieces in an 11 by 13 frame at the right of the den, sawn into four lengths that go up end
  to end. Watch for: still running out of the right pieces near the end (a simulated build wasted
  half as many deals as the long frame, but the last few pieces still need particular shapes; if
  so, the user's other idea was odds that favour the pieces the frame needs); the frame at the
  right of the den, and the barrel and chest behind the crates, looking right; the strips'
  flight up onto the wall. Also still to try: the solid stairs and gun tower parts.
- **The first wave dealt fair (8 Nov), not yet tried by the user.** Until wave 1 is beaten, the
  crates deal the pieces that finish the holes as Masterpieces. Watch for: it feeling too easy or
  too obvious. (First wave only, the user's choice: from wave 2 the deal is random again.) Since
  8 Nov it also stops once the first wall's done, and doesn't re-deal a piece you used elsewhere
  (the user got four W's in a row building a frame); check it no longer feels stuck on. Also
  since 8 Nov: it plans all the holes together, and keeps to the usual odds (five crosses in
  thirteen pieces before); check the mix feels natural, not too many P's; and (since 8 Nov) that the piece finishing a hole comes first.
- **Layers behind (8 Nov), not yet tried by the user.** A layer is now the hole's shape again,
  filled piece by piece in a timber surround, and a full one is as strong as a Masterpiece and pays
  the same. Watch for: holes three layers deep being too strong, or the pay too generous; the
  surround looking right (only a square wide round each hole: the user may have meant a whole timber
  lining between the holes, once every hole's first layer is done).
- **Wood a piece at a time, and roomier raid holes (8 Nov), not yet tried by the user.** Watch
  for: refilling a knocked-out piece being too easy a way to hold a hole forever, and cannon
  breaches feeling too big now.
- **Holding the wall.** The cannon now aims before it fires, breaches fill with rubble, and
  turning raiders away pays (RULES.md: "Keeping them out must be possible"). Since 7 Nov raiders
  also need a gap they can walk through and arrive winded after hacking one (RULES.md: "Raiders
  walk in", "Getting through costs them"), and a hole giving way dazes the raiders at it and
  chokes the gap with rubble (RULES.md: "A wall giving way hits the ones hacking at it"). The user
  has tried the gaps but not yet the dazing. Watch for: once one gap is opened, every raider
  nearby pours through it, and a single piece in it only holds two or three of them off for a few
  seconds. If it still feels hopeless or too easy, see "Holding the wall" in IDEAS.md.
  Since 9 Nov you can also lob a piece over the wall from the den floor at raiders hacking
  outside; not yet tried by the user. Watch for: the markers on raiders outside cluttering the
  view while you carry a piece.

## Spotted along the way (not asked for)

- **The camera indoors:** walk into the shack and its near wall hides you. Fade it out then.
- **Your den's preview** shows your flag on every tab. The Shack tab could show the shack itself
  (painted as you choose), and the Den tab the landscape.
- **Wave sizes for a crew** may need retuning after the cannon change; only solo was tested.
- **Not checked yet:** the look and den messages between two real crewmates (only tried solo),
  and the shack on a narrow den (the left-hand crate could crowd its floor frames).
