# Pirate Den: to do

Fixes, quality-of-life and feel changes the user has asked for. These are agreed: just do them.
New puzzles, new features and the user's unrefined ideas go in [IDEAS.md](IDEAS.md) instead.
When one's done, put its rule in [RULES.md](RULES.md) and delete it from here. Not published with
the site (`.assetsignore` skips `*.md`).

## Asked for

- **Covering a hole must cost the raiders.** Covering a hole felt like nothing: raiders bashed
  through a boarded one in seconds. Chopping is slower now, early on especially (RULES.md:
  "Raiders always have swords"), and raiders now need a gap they can walk through (RULES.md:
  "Raiders walk in"). The user also wants hacking through to weaken the wave in some way (they
  lose raiders, or time, or arrive spent). Not done yet: a raider who spends most of their
  stamina hacking through still walks in fresh. The 7 Nov balance test (RULES.md: "Every bit of
  mending counts") found partial and sloppy mending turns away all of wave 1 but only a quarter
  of wave 5 without help, and that once one gap is opened the raiders nearby all pour through it.
  Ideas: raiders arrive tired (slower, easier to knock flat), or a widened gap is choked with the
  fallen stone for a few seconds, like a cannon breach.
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
