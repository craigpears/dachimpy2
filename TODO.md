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

- **No puzzle mode at the stairs (8 Nov):** the stairs frame has no "snap to puzzle" view like the
  front wall's, where the camera goes straight on and the keys move the piece. (Same question as
  "the second stage" below: the frames want it too.)

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

- **Keyboard-moved piece jumps back to the mouse (8 Nov):** move the piece with the keys over to
  the right of the mouse cursor and fit it, then pick up the next piece, and it starts at the mouse
  cursor instead of where you fitted the last one. It should start where the last one went.

- **The last pieces of a frame won't go in until turned (8 Nov):** nearly done with a frame, the
  wall-walk's say, "it's really hard to fit the last pieces if they need rotating or something, it
  just stops giving you the option to place the pieces ... it is telling me it won't fit.. well it
  will if you let me rotate it first". You should be able to hold the piece over the gap and turn
  it there, whether or not it fits the way it's facing.

- **Overwhelmed by wave 8 (8 Nov), a balance issue:** the user: "By wave 8 I haven't got any more
  effective ways of dealing with raiders yet so I get overwhelmed and it's hard to fill in the
  square shaped holes". Each wave brings one more raider than the last (nine by wave 8, solo), while
  the defences only grow as the rampart's parts get built (walk, stairs, other stairs, gun tower),
  and the holes raids make are the roomiest that fit, squarish three-piece ones. Which way to go
  (to pin down with the user): fewer raiders as the waves climb, something new to fight back with
  by the middle waves, smaller holes while you're under pressure, or some help with the deal in
  later waves too.

## Needs a playtest to pin down

- **Turning a piece close to the wall feels off.** The user can't yet say how (which way it
  turns? where the ghost jumps to?). The snapping changes of 7 Nov may have helped, and since 8 Nov
  the whole-wall puzzle mode (arrows move the piece by screen direction); ask again.
- **Puzzle mode at the wall (8 Nov).** The user likes the zoom and the control, but hasn't tried
  the keys yet (WASD moves the piece, arrows jump hole to hole, since 8 Nov). Still to ask: should
  it come on by itself when you walk up with a piece; the same view for the rampart and house
  frames ("the second stage")?
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

## Spotted along the way (not asked for)

- **The camera indoors:** walk into the shack and its near wall hides you. Fade it out then.
- **Your den's preview** shows your flag on every tab. The Shack tab could show the shack itself
  (painted as you choose), and the Den tab the landscape.
- **Wave sizes for a crew** may need retuning after the cannon change; only solo was tested.
- **Not checked yet:** the look and den messages between two real crewmates (only tried solo),
  and the shack on a narrow den (the left-hand crate could crowd its floor frames).
