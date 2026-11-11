# Pirate Den: to do

Fixes, quality-of-life and feel changes the user has asked for. These are agreed: just do them.
New puzzles, new features and the user's unrefined ideas go in [IDEAS.md](IDEAS.md) instead.
When one's done, put its rule in [RULES.md](RULES.md) and delete it from here. Not published with
the site (`.assetsignore` skips `*.md`).

## Asked for

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

- **Something worth finding in the hidden cove: treasure (9 Nov):** the canal and the cove "would
  be great, but ... it needs a point of interest in here, even if it's a little like treasure
  chest on this little beach in the cove. You need to be able to go in here and do some treasure
  hauling or something." So: step ashore in the cove, and Puzzle Pirates' Treasure Haul brings up
  the treasure, played by its real rules (checked first), with a believable reason for it there.
  (Treasure Haul's real home is a wreck, so it went at the clifftop lagoon's wreck, the crane's
  place, now built; the cove keeps a chest of its own on the beach. How you get that one: to pin
  down.)

- **The puzzles' pieces checked against the real ones (10 Nov):** "the last few puzzles, the
  graphics have been placeholders rather than matching the Puzzle Pirate pieces". Compare each
  puzzle already in the den (Treasure Haul above all, and Bilge, Swordfight and Gunnery) with its
  YPPedia page's pictures, and redraw any piece that doesn't read as the real one (RULES.md, "A
  puzzle's pieces look like the real ones").

- **A hit on a gun shows on it, not in words (10 Nov):** "there should be some visible damage once
  you fire a cannonball at one of the turrets. Right now it's just like, oh, read the text to work
  out that it's been damaged ... I probably shouldn't really be any text. It should just be visible
  that you've damaged it, and you work out how many shots it takes." So each hit leaves its mark
  on the gun (chipped stone, a scorched and dented barrel, a battlement knocked off, smoking more
  as it's worse), and the toasts that count the hits ("2 more to wreck it") go.

- **Rowing: keep Bilge's water look, lose the compass (10 Nov):** first: "people are just going to
  get very confused given how visually identical it is to the [Bilging]"; then, on second thoughts:
  "I don't like the idea of different pieces ... part I did love of this similarity [to] bilge is
  that they are very watercoloured ... I still like it in idea", and no rowing benches ("you
  already see the guys with the rowing [oars]"). So the pieces and the water stay as they are.
  The compass goes: "the next move compass is a bit confusing, and like the left right arrows are
  very tiny"; "even just ... you can actually see the oars and the ship itself pulling gives you
  enough of an indication. Do we need much else?" So the turn building shows on her: the oars on
  the side pulling harder, her bows swinging and heeling, big enough to read. ("We're going to
  have to prototype a bit more.") Also asked: "didn't we talk about having fewer pieces? ... I see
  the pentagon" (the live site still had the old split board, seven kinds; mirror strokes deals
  five, without the pentagon).

- **Sunk at the checkpoint, row home (10 Nov):** agreed (IDEAS.md, "Sunk at the checkpoint"):
  "it should be a short row home ... you've got the trade winds blowing you back, haven't you? So
  all you need to do is a quick row to get onto the trade winds." Sunk, you bob up in a little
  rowboat, row by mirror strokes the short way to the trade winds, and they carry you home; the
  sloop's waiting at the den, and you're back aboard her, with a small, subtle note after the row
  home that O gets the oars out any time. Nothing about the wind (the user, 10 Nov: "keep it
  secret ... don't do a big thing ... We want to keep it as the Easter egg, the thing that you
  figure out"). After Dignity's cutscene.
  No hint of another way round, here or anywhere (10 Nov; RULES.md, "Hidden gems, never
  hinted"). The chain: you see the wind, and work out for yourself that the oars get you past it.
  Sunk only by a real hit (10 Nov): Bella's first shot is the warning (her giggle stays); a gun
  that actually hits you sinks her, and you row home. No more patching a bit of damage with
  Carpentry at the checkpoint: "it probably adds a bit more stakes ... you are in a tiny sloop at
  this point, after all." Then, unsure (10 Nov): "Part of me likes just being able to get through.
  Part of me wants her to actually sink you if you get enough damage. I'm really not sure on it."
  (To pin down: one hit, or enough damage over a run.)
  **Settled (10 Nov): damage and bilge, as in Puzzle Pirates.** Three hits is no challenge ("I just did
  a very simple go forward, forward, forward, forward, and I only got hit twice"), so instead: "as
  you get hit, your damage goes up and carpentry brings it down ... you can jump into that puzzle.
  ... same as how you hit O to get the oars out, but it's not a forced thing", and "bilging is ... the
  same kind of idea. You can clear your bilge, but ... when you're damaged, bilge slowly goes up."
  So her damage rises with each hit and Carpentry on her deck brings it down, whenever you choose
  (no more being stopped to patch); while she's damaged, water seeps into her hold and her bilge
  rises, and Bilge pumps it out. Sunk when her damage is full, and you row home. Shown as Puzzle
  Pirates shows them, a damage meter and a bilge meter, and on her too (holes, water in her hold).
  Check YPPedia for what bilge does to a ship (slower, say) and how damage sinks one. After the
  lag at the gauntlet is fixed (it's in the same files).
  **But the deck patch stays (10 Nov):** "abandon getting rid of the carp[entry] on deck when the
  cannonball hits things ... people like it. It's funny. It's good." A hit still holes her deck and
  you patch it by Carpentry before she sails on, as now (RULES.md, "Kept because people like
  them"). **The meters are for bigger ships (10 Nov):** "maybe in a sloop you get damaged and you
  have to patch it up instantly, and then those full damage [and] bilge meter things are bigger ship
  features that we can discover later" (IDEAS.md, "A bigger ship from the shipwright"): "it gives a
  bit of personality to this little small sloop." So the sloop keeps the instant patch, and no
  damage or bilge meters are built for her. Still open: whether a hit can sink the sloop at the
  checkpoint (and you row home), and how.

- **The Sailing puzzle, for Kikkit's quest (10 Nov):** Kikkit's penguin quest is next up once the
  work in hand is done ("that is next up ... I guess you can start some of that now because that
  requires the sailing puzzle"). First the Sailing puzzle itself, Puzzle Pirates' own rules
  checked on YPPedia, as a module knowing nothing of the den, tested and with bots; its Vegas (or
  whatever its real big combo is) sends her a long run forward in one go (IDEAS.md, "Kikkit's
  penguin").
  **Her whirlpools are a way through the reef (11 Nov):** the passage through the reef to the right
  of the checkpoint's gate, sailed with Vegases, a harder way past than the gate or the locks, with
  the penguin in the middle as its reward (IDEAS.md, "Kikkit's penguin").
  **Order of work (11 Nov, "move on to that sailing feature with all the accompanying things"):**
  its board drawn, balloony, and playable anywhere at sea first (done: RULES.md, "Sailing at sea"); then Kikkit's island and her
  rambling (done); the whirlpools through the reef with the penguin in the middle (done: RULES.md,
  "Kikkit's whirlpools"); Tzz's island and her
  balloon lesson on her island (built, to be played: RULES.md, "Tzz's balloon lesson"); the ending: Kikkit moves to Vegas Island, the penguins' island
  past the reef, her familiars swimming after your ship (11 Nov, IDEAS.md).

- **Sailing's sparkle, two small things (11 Nov, seen when it was built):** from behind her, the
  camera sees her sails nearly edge-on, so a Vegas's billow barely shows; and on a phone the den's
  big toast covers the Sailing board for a moment after a chain.

- **Start something where you're looking, not at the foot of the screen (10 Nov):** "Still got to
  fix that carpentry hauling up thing. Like, it should be in the middle of the screen where I'm
  looking so that I can click on it and start it. It should not be a space along the bottom ...
  it's not in my eye line at all." (Making the prompt at the bottom bigger and glowing, RULES
  "Something new to do stands out", wasn't enough.) So when there's something new to start (build
  the crane, haul her up, and the like), the offer is in the view where you're looking, at the
  thing itself (the crane's chalked frame on the ledge, say), and clicking it starts it. Space
  still works. Starting with the crane, after the Umami work in the same file.

- **Paint your ship (11 Nov, for later):** "we definitely need that on the to-do, being able to
  paint your ship somewhere. Maybe ... some character later on an island ... will let you paint
  your ship. I don't know who yet." Her colours (hull, sails, trim) chosen somewhere at sea, from a
  character on an island of their own; who, to settle with the user. What you paint her is kept in
  this browser, like your look.

- **Pictures of Primates Rule, from the user (11 Nov): received.** "I'll have to put a to-do in
  there that I'll have to share the pictures of it, where it's got like the gold, the black and
  white thrones, the skeleton cannons." Found and shared the same day: `notes/primates-rule/` (not
  deployed). The user's war frigate, the one for Daquan's flotilla (IDEAS.md, "Daquan's flotilla"):
  - **1-top-deck:** three masts; a black hull with white rails and two white stripes, square gun
    ports in two rows, the planking below the waterline bare wood; a black beast's-head figurehead
    with gold scrollwork; a raised quarterdeck aft and forecastle forward, stairs between. On deck:
    the skeleton cannons (black, banded in bone, a skull on each), suits of armour on plinths,
    gibbet cages hanging from posts, a black grand piano, jars with creatures in them,
    anchor-backed chairs, a skeleton in a chair, tool chests, tables of cards and bottles. Dachimpy
    stands at the bow with Doggie the Dog.
  - **2-captains-cabin:** an L-shaped cabin, wood-panelled; chained skeletons hung on the walls;
    open chests spilling gold; a desk with maps, quill and candlestick; suits of armour; skeleton
    chairs at round black tables with a spiral top; a potted palm; a ladder up.
  - **3-hold-throne:** the hold: the gold and black throne on a tiered black-and-gold dais
    ringed with bones; skeleton cannons along both sides; long tables heaped with gold and gems;
    piles of skulls and bones; chests of gold; pumps and buckets; pumpkins; a globe.
  - **How close (11 Nov):** "Not saying ... to do a faithful depiction ... but ... obviously Puzzle
    Pirate elements ... should be faithful ... the skeleton cannons and the black and white theme and
    a few of the bits of furniture ... the gibbet, the skeleton set ... most of the stuff like on the
    top of the deck looks good. I'm not so sure about some of the goldy bits ... Actually, to be
    fair, yeah, go relatively close. That's fine." So: the war frigate herself as Puzzle Pirates
    drew her (faithful), black and white; must-haves the skeleton cannons, the gibbet cages and the
    skeleton furniture set; the top deck's things relatively close; the gold (the throne, the
    treasure) kept, but not the point. "It was just such a happy one."

- **Next, one at a time, once Tzz is finished and played (11 Nov):** "for the [Daquan] and Helium
  ones, I think they're fleshed out enough ... to be on the to-do list to get started ... there's
  enough there to get started, and then I think you can naturally flesh out the rest of the
  mechanics later." But "try and finish things ... we need to finish things really one at a time"
  (RULES.md, "Finish one thing at a time"): each starts only when the one before is played and done.
  - **Daquan's flotilla, to start (started 11 Nov: Primates Rule modelled, curved, and moored at sea as still to come; below decks and the cutscene next):** the cutscene (Dachimpy at the helm told to go sink a ship,
    sinking their own; Daquan face-palming, then turning to you), and modelling a bigger ship,
    Primates Rule, the war frigate he lends you, to see how she looks beside the sloop
    (proportional by YPPedia's numbers). Daquan's portrait checked first; Primates Rule's gold,
    black and white thrones and skeleton cannons from the user's pictures (above). What you do
    against the flotilla: fleshed out after. (IDEAS.md, "Daquan's flotilla".)
    **Modelled (11 Nov), to be looked at:** Primates Rule beside the sloop on the unlinked
    `frigate-test.html` (`js/den/frigate.js`, `src/den-frigate.ts`; RULES.md, "Primates Rule, as Puzzle
    Pirates drew her"). Next: below decks (the captain's cabin; the hold and its throne), her crew to
    be seen aboard (dozens), then placing her on the sea for the flotilla.
  - **Helium and Distilling, to start:** a Distilling puzzle of its own (its rules from YPPedia, a
    module knowing nothing of the den, tested), and Helium teaching it as Tzz teaches Sailing: a
    funny animated scene showing you real distilling moves, then "now you try". His still is the
    hidden Easter egg in his house, with the mishap ("Oops. That happens sometimes. Don't worry
    about it."). His portrait checked first. Smuggling the rum after still waits. (IDEAS.md,
    "Helium, and Distilling".)

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
- **Port Decorum's back way in: a smugglers' beach, only by way of Kikkit's whirlpools (11 Nov):** "for
  the Imperial Outpost, the kind of beach, so the back way in, I think that will be better, like, accessed
  far through those whirlpools by, you know, [Kikkit]. I think having it one open area is a bit off. Like,
  I do think, like, Penguin Island, and then you have the, you know, Smuggler's Beach there. So that you
  can go sell the rum made by helium or with helium, obviously, once we tie that in. So yeah, redesign the
  fort so that, you know, there's some rocks and whatnot blocking some back entry where that, you know,
  with some kind of, you know, Smuggler's Beach, you know, obviously for that mechanic to plug into
  later." So rocks round Port Decorum's back, the open sea shut off there, and a smugglers' beach in a
  cove behind it, reached only through the whirlpools by way of Penguin Island; nothing to do there yet
  (smuggling, and Helium's rum, plug in later).
- **Port Decorum's towers are gun turrets, too many and too fast to take on (11 Nov):** "those big square
  towers there should be some gunnery turrets on [Port Decorum] ... maybe it's like he gives a bit more of a
  warning again, that little just the guy on the dock, no need for a big cinematic, we've already
  established it. Well, I think that gives it a bit of the right vibe, is this is just a no access area,
  but the guns are also what enforces that. That maybe here there are so many guns and they're just so much
  faster that, you know, you've just not got any chance really of destroying them ... they can be the same
  style as the same [turrets], but a slightly different skin ... if you try messing with them, you just get
  taken down so instantly." So the fort's towers carry the checkpoint's kind of gun turret, in a skin of
  their own, many of them and far quicker; the jetty guard warns you off (a line, no cutscene); try anything
  and you're sunk at once.

## Spotted along the way (not asked for)

- **The camera indoors:** walk into the shack and its near wall hides you. Fade it out then.
- **Your den's preview** shows your flag on every tab. The Shack tab could show the shack itself
  (painted as you choose), and the Den tab the landscape.
- **Wave sizes for a crew** may need retuning after the cannon change; only solo was tested.
- **Not checked yet:** the look and den messages between two real crewmates (only tried solo),
  and the shack on a narrow den (the left-hand crate could crowd its floor frames).
