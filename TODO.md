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

- **Your pirate glows yellow on the beach with nothing in the way (9 Nov):** "the player goes
  yellow as if you are behind something while on the beach, even if nothing is obstructing the
  view." The gold outline should only show when something really hides your pirate from the
  camera.

## Needs a playtest to pin down

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
