# Pirate Den: to do

Fixes, quality-of-life and feel changes the user has asked for. These are agreed: just do them.
New puzzles, new features and the user's unrefined ideas go in [IDEAS.md](IDEAS.md) instead.
When one's done, put its rule in [RULES.md](RULES.md) and delete it from here. Not published with
the site (`.assetsignore` skips `*.md`).

## Asked for

- **Raiders need a real gap to get in.** The user finds it weird and dumb that raiders hop
  through tiny gaps, even five-square ones high up the wall, as if by magic. Today any empty hole
  counts as a way in, whatever its size or height. What they want:
  - **They walk through, not jump through:** a raider only gets in through an opening big enough
    to walk through: down at floor level, and roughly two squares wide by three tall.
  - **A smaller gap makes the wall weaker, not open:** raiders go for it and hack it wider (it
    falls faster than whole stone), so leaving gaps still costs you, but nobody just waltzes in.

  Tested 7 Nov 2026 (two waves simulated, nobody mending): **a gap left in a part-mended hole no
  longer lets them in.** Any wood in a hole means they hack it all out first, and only then climb
  through. **But an empty hole of any size or height still does.** Every wall has one single-piece
  hole (5 squares), often up off the floor. Three raiders sent at one whose bottom was 1.1 m up all
  hopped through it, stole and climbed back out. The user hadn't seen it in a while, probably
  because that hole is usually the first one mended.

  A possible way to build it: a hole a raider can't fit through is a weak spot with low strength;
  hacked through, it becomes a breach that is a bigger, floor-level carpentry hole (still made of
  whole pieces' worth of squares, still solvable), which the crew then mends.
- **Covering a hole must cost the raiders.** Covering a hole felt like nothing: raiders bashed
  through a boarded one in seconds. Chopping is slower now, early on especially (RULES.md:
  "Raiders always have swords"). The user also wants hacking through to weaken the
  wave in some way (they lose raiders, or time, or arrive spent). Goes with the real gap above.
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

## Needs a playtest to pin down

- **Turning a piece close to the wall feels off.** The user can't yet say how (which way it
  turns? where the ghost jumps to?). The snapping changes of 7 Nov may have helped; ask again.
- **Holding the wall.** The cannon now aims before it fires, breaches fill with rubble, and
  turning raiders away pays (RULES.md: "Keeping them out must be possible"). Not yet tried by the
  user. If it still feels hopeless or too easy, see "Holding the wall" in IDEAS.md.

## Spotted along the way (not asked for)

- **The camera indoors:** walk into the shack and its near wall hides you. Fade it out then.
- **Your den's preview** shows your flag on every tab. The Shack tab could show the shack itself
  (painted as you choose), and the Den tab the landscape.
- **Wave sizes for a crew** may need retuning after the cannon change; only solo was tested.
- **Not checked yet:** the look and den messages between two real crewmates (only tried solo),
  and the shack on a narrow den (the left-hand crate could crowd its floor frames).
