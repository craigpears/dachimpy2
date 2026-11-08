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

## Needs a playtest to pin down

- **Turning a piece close to the wall feels off.** The user can't yet say how (which way it
  turns? where the ghost jumps to?). The snapping changes of 7 Nov may have helped, and since 8 Nov
  the whole-wall puzzle mode (arrows move the piece by screen direction); ask again.
- **Puzzle mode at the wall (8 Nov).** The user likes the zoom and the control, but hasn't tried
  the keys yet (WASD moves the piece, arrows jump hole to hole, since 8 Nov). Still to ask: should
  it come on by itself when you walk up with a piece; the same view for the rampart and house
  frames ("the second stage")?
- **The walk as one big frame (8 Nov), not yet tried by the user.** About 30 pieces in one go,
  with single squares jutting out of its edge for the rare pieces; likewise solid stairs and gun
  tower parts that lock together. Watch for: it taking too long for one wave's timber (it could
  come as two halves); the walk frame now well back from the wall, and the crates further back
  behind it, making fetching slower; the solid stairs looking odd.
- **The first wave dealt fair (8 Nov), not yet tried by the user.** Until wave 1 is beaten, the
  crates deal the pieces that finish the holes as Masterpieces. Watch for: it feeling too easy or
  too obvious, and whether the same help is wanted after wave 1 (for the holes the cannon makes).
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
