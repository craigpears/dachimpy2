# Pirate Den: to do

Fixes, quality-of-life and feel changes the user has asked for. These are agreed: just do them.
New puzzles, new features and the user's unrefined ideas go in [IDEAS.md](IDEAS.md) instead.
When one's done, put its rule in [RULES.md](RULES.md) and delete it from here. Not published with
the site (`.assetsignore` skips `*.md`).

## Still to playtest (kept from 12 Nov)

Built, but not yet played by the user (the user, 12 Nov: "keep a note of what is still to be play
tested"). Struck off here once played; what the playtest corrects goes in RULES.md (or RACE.md).

- **The sloop race, a full run (12 Nov):** the whole course with rivals, now with the locks a beat,
  the buoys always seen, the wind gaps lined up, the bribe gate (the wreck's coins by Treasure Haul),
  the driftwood barrier (Foraging), the crane. And the race's next pass (12 Nov): no gambles; the snakes a
  few squares back; the start's field of slow winds and whirlpools, fresh each race, and its hop; the rocks
  off leg 3 blasted open for everyone; every stopped puzzle's shortcut about the same stretch; the starlit
  door a plain door, Navigation only, one stretch through; the headwind gap's lower cliffs and its wind.
- **The race's puzzle shortcuts, not yet seen at all (12 Nov):** "I've definitely got to check things
  like the starlit door and the crane and [Treasure Haul] ... I've not seen any of that stuff yet. I've
  not even seen a visual or anything about those puzzles, the navigation puzzle that is." So: the crane
  built by Carpentry on the race; the bribe at the gate, the wreck's coins hauled by Treasure Haul; Duty
  Navigation itself (`navigation-test.html`); and the starlit door on the race course (its Navigation on
  the rock, the door opening, the tunnel and its clefts), straight there by `den.html?at=door` since 12 Nov.
- **The race's chart (12 Nov):** `changelog/race-map.jpg` and its changelog entry, and the design
  page (`design.html`), for whether they read well.
- **The course editor (12 Nov):** `race-editor.html`: move buoys and shortcuts, set each puzzle's size,
  the balance check, then race it in 3D; the rocks movable along spit 3 since the race's next pass.
- **Watching the race (12 Nov):** the replay / spectator mode, `?at=race-watch`: four racers, the
  free camera, following one, their boards.
- **Penguin Island and sailing round there (12 Nov):** Kikkit's whirlpools, Vegas Island and the run
  behind the rocks to the smugglers' beach. (The run's width is a fix too, under "Asked for".)
- **Tzz's balloon lesson (11 Nov):** on her island (RULES.md, "Tzz's balloon lesson").
- **The wedding, showered in gifts (12 Nov):** the gifts theme and plot, and Mischievious's newer
  lines (the presents all for her, the loopy weddings).
- **Primates Rule (11 Nov):** beside the sloop on the unlinked `frigate-test.html`.
- **Rowing's turn (14 Nov):** a lopsided Bingo's worth turns her at a lead of 6 now (was 7.5), the view
  coming round a moment after her so the turn shows, and it's said; is it turning too often by accident?
- **Older, still unseen:** the captain's map's cutscene with Dalnoth redrawn; the towers, lower
  middle and night sky; the cove (each under "Asked for", below).

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

- **A hit on a gun shows on it, not in words (10 Nov):** "there should be some visible damage once
  you fire a cannonball at one of the turrets. Right now it's just like, oh, read the text to work
  out that it's been damaged ... I probably shouldn't really be any text. It should just be visible
  that you've damaged it, and you work out how many shots it takes." So each hit leaves its mark
  on the gun (chipped stone, a scorched and dented barrel, a battlement knocked off, smoking more
  as it's worse), and the toasts that count the hits ("2 more to wreck it") go.

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
  **On hold for the racing (11 Nov):** "I just want to focus on this racing for right now on these core
  things." Helium and Distilling "can definitely wait", Kikkit's ending (her move to Vegas Island) too,
  and Primates Rule below decks is "definitely way down the" list. Kept here, not started, until the
  race's core is done.
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
    funny animated scene showing you real distilling moves, then "now you try". Their still is the
    hidden Easter egg in their house, with the mishap ("Oops. That happens sometimes. Don't worry
    about it."). Their portrait checked first. Smuggling the rum after still waits. (IDEAS.md,
    "Helium, and Distilling".)
    **Started (12 Nov), and an island of their own, not a house:** "I think we can start doing his
    thing ... I think you're ready enough to start on the mechanics of building that puzzle, usual
    kind of modularized stuff." And "Him being in a hidden house, maybe he can just have his own
    little island. That just seems to be the theme somewhere. Maybe that can link into where the
    Smuggle Beach is ... I bet he just wants an island for him somewhere." First the puzzle, as
    real as the rest (researched, with bots), and a tutorial in the style of Tzz's Sailing guide;
    the user will point us to what the real tutorial looks like.
    **First pass built (12 Nov), to be played:** the user, "are you able to crack on with adding Helium
    and some of the tutorial elements in? I don't want to get too caught up on perfecting this bit."
    Helium drawn from their Emerald portrait (IDEAS.md), their island past the checkpoint across the
    smugglers' rocks from their cove (`?at=helium`), their still and the real board on a stand; a short
    lesson (swap rule, whites left and junk right, a column burned, their mishap's bang), then your own
    session there, "Help, Helium" on H or the button (`advise`, their line naming the technique, the drag
    played on your board), and a bang with their line whenever a white burns. Panel's distiller is them now.
    Their opening first (12 Nov, the user's): the still blows up as you arrive, they shrug it off, "is it
    safe?", "of course it's safe", and the eyebrows. Your pirate's tense face isn't drawn (lines only).
    Not yet: the smuggling ring and the penguin's link, the coached replay, a lesson per technique.
    Watch: whether the lesson's pace and camera feel right, whether their help's drags read as one smooth
    hand. Helium is drawn as the pirate is, a woman (her portrait, "Lady of the flag"), and called "they"
    in the den's words (the user, 13 Nov).

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

- **The race's rivals, what's left (11 Nov; the rivals and shooting at sea are built: RACE.md §6):** Daquan
  in Dalnoth's place once his portrait's checked and he's drawn; and the rivals' puzzles played as real
  moves where the puzzles have bots (tools/sail-bots.mjs, row-bots, nav-bots), so they're the testers as
  well (today they take the simulation's drawn times).
- **Balancing the race: a headless simulation, and 2–4 racers (11 Nov):** after more goes, the routes
  don't feel even: "the bilging one is relatively probably quick to get through, same with the carpentry.
  I mean, I definitely noticed just loading the guns and gunning takes a long time ... Gunning felt very
  unrewarding, and those turrets are really aggressive once you actually start shooting at them. If
  they're aggroed, they are very relentless." (Partly "in the real Puzzle Pirates you can run a lot
  faster, but nonetheless, we need to at least do some basic balancing just to make this enjoyable.")
  So: a test harness under the race with no graphics ("so you can just run through simulations quickly
  and easily, and just really test balance"), racing a handful of bots that each take a different
  strategy (the long way, the Gunnery gap, the locks, the crane, the whirlpools...) over many runs, and
  tuning until they "all have a relatively equal chance of winning". Racing several at once first: "start
  adding multiple players to this first, even if it's like 2 to 4 players with some bots, and obviously
  tweak the course and sizes according to that." A lock is first come, first served ("If you got through
  it first, we get through it first"); maybe more than one lock or crane spot, though not one for
  everybody. The rivals with profiles (above) are these bots. Gunnery's gap wants to pay off better for
  its time, and the turrets once roused less relentless. Before the course's next pass, so that pass is
  tuned with it.
- **Treasure Haul: any of the redrawn coins to bring back? (12 Nov):** the old look is back (RULES.md),
  but "I kind of liked some of the coins". Which, if any, to put on the old board (to pin down with the
  user).


- **Scale the far sea up and space it out (12 Nov):** "that whole area again needs to be scaled up.
  Like the fort, that Imperial Island is still tiny. And again, I just want things a bit, generally, a
  bit more spaced out now that they're getting busier." Port Decorum (its town, fort and quay) bigger,
  and the places out there given more room between them. For example "that line of sail ...
  between the Penguin Island and that back entrance. Like, it's only like one tile wide, it's tiny. I
  don't think you can even really navigate in there without bumping off the rocks. It looks silly."
  So the smugglers' run behind the rocks wide enough to sail without bumping (two or three squares).


- **The course editor down to the tile (12 Nov):** "it looks cool, especially with the map. But just
  moving stuff left to right isn't exactly much of a ... it doesn't really give you much control over,
  like, how many legs do I do? ... more fine-grained control ... you get to the tile level of what tiles
  you want where, what objects you want to move about and place. It needs to be a lot, give you a lot
  more control." So the course becomes a grid you paint square by square (water, land, rock), with
  objects you place, move and remove anywhere (buoys, the start and finish, winds of both kinds,
  whirlpools, each shortcut and its puzzle), as many legs as you like; the race laid from that grid,
  the checks (a way round, every shortcut sailable) and the balance check as now. With the race's next
  pass, as that reworks the course anyway.


- **A rival's Sailing shows on her sails (12 Nov):** "you should be able to see the [sailing] puzzle in the
  [sails]. Like, I can see Kikkit building a Vegas, but it's not showing on her [sails]." Watching the
  race, her board fills but her sloop's sails don't change. Her sails should sparkle as yours do when you
  sail well (`sail-sparkle.js`), growing as her chain builds, on every racer's sloop, rivals and online
  players alike.


- **Watching the race: the bots and what's shown (12 Nov, from the user watching).**
  - **Missing animations, the puzzling not seen:** at the lock "it's missing the animation ... missing
    some of the animations, puzzle visibility": the lock's water doesn't rise as a bot pumps, a built
    crane isn't drawn going up, the boards only show for the racer followed (RACE.md §10, "Not yet").
  - **Odd moves:** "why did that bot just go out the lock and to the left? That was a bit crazy", and
    "why did a ship just zoom right from the right-hand side to the left? ... like someone just went on
    Zoomies". (The zoom is likely the left-hand trade wind, the snake along the top back to the start,
    with nothing to show it's a snake that caught her; the lock exit to pin down.) Each racer's way out of
    a shortcut should look like a sailor's, and a snake catching her should read as one.
  - **No tactics:** "I'm not seeing people use the tiny [shortcuts]", "nobody's exactly behaving tactically
    between these bots ... Gravee is out in the lead. So the only way you're going to catch up with her is
    to take a gamble ... Nobody's even using the [winds] at the top to get to first." So the bots race by
    the race: behind, they take the bigger shortcuts and the catch-up rocks; ahead, they play safe and
    sheltered; they take the little Doubles and Triples on the way when their chain allows; they hop the
    zigzag and use the winds that help.
  - **Nobody shoots:** "I'm not seeing anybody shoot anything either. Like, no cannon." Watched, the bots
    should fire on a racer sitting still in the open as they pass (as the rivals do in your race), with
    the shot, the hit and the patch shown.
  - **More variety in the ways round:** "I didn't even see anybody ... go do the rowing, go through the
    driftwood. I love that Kikkit went through the sails, but there's a bit more variety needed there."
  - **Kikkit back at the start late on:** "Three of them finished, one of them vanished ... One's back at
    the start. I don't know what happened to her. Did she get bumped? ... Is she doing like lap number 2
    ... I'm pretty sure I thought she got through the Vegas' part." There are no laps; a failed Vegas only
    sends her back to the channel's mouth. Likeliest: the left-hand trade wind (the snake down the left
    edge, back to the start) caught her near buoy 4. Trace a watched race and account for every move that
    looks wrong, with the bar saying what happened ("caught by the trade wind, back to the start").
  - **Follow whoever you've zoomed in on, and see what everyone's doing (12 Nov):** "it should almost look
    like ... whoever you're closest to, if there's only one obvious person there, it should do that kind
    of following thing, follow [the racer], if you've zoomed in on them. Otherwise ... at least you should
    see some little representation of what they're doing." So with the free camera close in on one
    sloop and nobody else near, it eases into following her (her board shown); and every racer always
    has a little sign over her sloop of what she's doing (a tiny board filling as she puzzles, a lock,
    the crane, guns loading, a patch), so you see it all at a glance from anywhere.
  After the course's rework (the race's next pass), as the bots race whatever course it leaves.

- **The opening still says "defend the den" (12 Nov):** "The initial loading screen is more of a loading
  screen because it keeps saying defend the den still, and like we're way past that now". What you first see
  is the siege's: "Raiders are coming! Grab a piece from a crate and mend the wall", "Vikings attack in 1:00",
  the "Defend it again" button, while the den's now a whole sea of islands, puzzles and a race. (What it
  should say instead, and whether the quick siege still opens it, to pin down with the user: the message was
  cut off.)
- **How far does a chain carry her? Vegas Island's hidden rule (12 Nov):** "I did a double to get over the
  first one, and then I thought, well, it's 1, 2, 3 tiles to get to the penguins, so surely a bingo should
  take me 3 tiles, right? ... What's the calculation?" The calculation is a square a step (Double 2,
  Triple 3, Bingo 4, Donkey 5, a Vegas 7, a square more for each step past it), but the penguins' water
  also has a hidden rule: only a Vegas's gust gets in, however near it is, so her Bingo stopped on the
  wind in front of it and was swept home. To make plain (how, to pin down with the user): honest distance
  only (the penguins 7 squares from the mouth, any gust that reaches them lands), or the Vegas rule kept
  and shown (on the water, and said when it stops her short).
- **Plan your race route, then puzzle it through (12 Nov, agreed):** you can't steer and puzzle at once, so the race gets a plan: one choice for each leg (the long way or one of its shortcuts), hidden from the others, changed any time from a strip along the screen's edge with one click and no time lost from the board. The pilot sails it move by move, stops by itself at each obstacle's spot (a hop, each of the zigzag's headwinds, a lock, the crane, the barrier, the whirlpools, the door) with the board it needs up, and goes on once it's done. "That's really simple and easy." The design is in RACE.md §5. (After the course pass and the racers' moves and gusts, which use the same files.) Once it's live, design.html gets a section on it (the user, 12 Nov: "where you've got the design page to have this, the planning feature, so how that fixes the problem of wanting as a player to be able to plot your course in advance, but make those choices, but also be able to focus on puzzling at the same [time]"): the problem (you can't steer and puzzle at once), and how choosing a leg at a time while the pilot sails and stops for you lets you plan ahead and still keep your hands on the boards. With a picture from its `?at=` link, and the changelog entry. Then (13 Nov): "it should all be in the same thing. So if you're watching the race, you should I'm guessing be able to see what people's plans are ... online, local should all be the same." **Done (13 Nov), to be played:** src/race-plan.ts and js/den/race-plan.js; the strip down the right, the pilot on your helm and its stops; every bot races by a plan (the balance unchanged, race for race); the race watched shows plans and changes; online the plan goes to the room and its record, never to the other racers (no watchers in rooms yet). The zigzag's hops are leg 4's own choice, not stops on the long way (as stops they saved nothing: RACE.md §5). design.html and the changelog have it. And (13 Nov): "it should all be in the same thing. So if you're watching the race, you should I'm guessing be able to see what people's plans are, because that keeps it interesting ... online, local should all be the same." So one plan system for every racer and mode (you, the rivals' bots, the simulation, the race watched, online), the plans shown to whoever's watching, hidden from rival racers, and kept in the race's record.
- **Distilling's burn seemed really slow on the test page (12 Nov):** playing it yourself: "I don't think the burn's quite working when it's not in the bottle, it's just going really slow. But oh, I can click the burn button." The furnace seemed to take far too long to burn a column, at least when you're playing rather than watching a bot ("not in the bottle": perhaps "not with the bot"). The Burn button works. What's off, and when (playing alone, paused, or after watching a bot): to pin down with the user. The real game's furnace burns every 15.3 s or so. The user, later: "I don't know what you mean by that. I think that's probably just a text-to-speech error from earlier", so "not in the bottle" was a dictation slip; whether the furnace is really too slow is still to check (on the test page, timed against 15.3 s).
- **Helium's still: a proper distillery, and a bigger bang (13 Nov):** "I think the explosion needs to be more dramatic. If you look up a distillery on Puzzle Pirates, I think [Helium] needs to have at least a bigger setup. That little object that blows up in the background is very tiny." Look up Puzzle Pirates' distillery building (YPPedia) and give Helium's island a setup like it, big enough to read from the sea, and make the opening's explosion (and the bang when a white burns) much bigger and more dramatic. The user, later: "If white goes down, it should cause like that explosion animation as well", and the other way, "some meaningful animation that happens if you start sending up the white ... Helium should start, you know, distilling out some rum and filling some barrels or something." Go-ahead given, 13 Nov. **Done (13 Nov), to be played:** YPPedia wouldn't load for us, so built from the game's look as remembered: a timber distillery (`js/den/distillery.js`), plank walls open at the front, shingled roof, its sign, a brick chimney smoking, a smaller still and racked barrels inside; in its yard the big copper pot still on its furnace, the swan neck to the worm tub and its coil, a pipe out to a spout over a cask on a stillage with a sight glass, the pile of full casks beside it. The bang (`js/den/blast.js`, for anything that blows up): a screen flash, a fireball, sparks, a dark cloud that hangs about, copper, staves and shingles flying and landing, the camera shaken, the still shaking, its head blown off and landing back on, the copper sooted black and coming back; they cower, then shrug. Bigger the more whites burned (src/den-helium.ts, worksFor). Whites sent up: rum runs into the cask (a measure a white, twice for a Crystal Clear), a full cask capped, tipped and rolled onto the pile (Cellar); they turn to tend it. Watch: whether the bang's size and length feel right, whether the rum reads while you play at a 4:3 screen (the cask is at the edge there).
- **Help, Helium's bubble can't be seen while you play (13 Nov):** "you could do like the help from Helium, but they are too far to the right for the help bubble to really appear." Their advice needs to show where you can read it while at the board. **Done (13 Nov), to be played:** they stand just beside the board now, turned to you, and their bubble is kept on the screen and off the board (src/den-helium.ts, lineSpot): beside it on their side on a wide screen, below it on a phone (checked at 375 by 812), narrower to fit; on a wide screen the board sits a little left so they're in the shot.
- **Help, Helium more targeted (13 Nov, later):** "I wanted the help to be more targeted ... I'm sure we'll work on this." What more targeted means: to pin down with the user.
- **Helium's lesson in steps you tab through (13 Nov):** "for the tutorial ... we do those first phases ... you have each step of the puzzle. So maybe we just, for the tutorial, kind of, we could tab through the steps and say, like, step one is getting a few columns on the right-hand side that are about to burn completely free of white pieces. Like maybe that's just step one." The lesson as the puzzle's stages, one at a time, tabbed through: step one, a few junk columns on the right, the next to burn, cleared of every white. The later steps to draw from DISTILLING.md's notes (the techniques by stage, the seventh note) and to agree with the user. After the distillery pass lands (it's in Helium's files now). The user, then: "let's just really take it one step at a time. Just do that clearing ... a few columns to the right first ... because otherwise, yeah, the furnace blows up and, you know, I've already got no eyebrows." So step one only, for now; the four drafted steps (clear the right; keep the wall upright; browns down through the blacks when columns stop finishing; before the end, browns down then up and the hooks lined up) wait. **Step one done (13 Nov), to be played:** after the mishap (what skipping it does), Helium's step one, said in the bar as Step 1: the three columns next to the fire cleared of every white on the real lesson board (the bots' rescue, worked out in src/den-helium.ts's lessonPlan; the lesson's deal picked so it clears in 7 drags), and why: "Otherwise the still goes bang. And I've already got no eyebrows." Then your go with step one as the goal at the foot of the screen (how many whites to go), and their line when you've done it. `STEPS` has room for the rest.
- **Helium's lesson goes by far too fast (13 Nov):** "the speech and the animation is over so quickly. Like, it's supposed to be a little cutscene, and it's like half a second." Each line up long enough to read, each drag played slowly enough to follow, a pause between beats, and a way to go on when you've read it. **Done (13 Nov), to be played:** lines were up 1.4 s plus 0.05 s a letter and their drags 0.2 s a swap; now a reading pace (3.2 s at the least, about 2.5 words a second), the opening's bang 3.5 s on its own, drags 0.55 s a swap after a 1.6 s look at the line, a breath between beats (src/den-helium.ts, PACE_LESSON, tested); Space, Enter or a click goes on once a line's been up a moment, Esc skips. Timed in the browser: about two minutes, opening and lesson together.
- **Helium and Tzz don't do their portraits justice (13 Nov):** looking at Helium's portrait (black and white, the Atlantis trinket, a dark purple monkey on the shoulder): "I don't feel like the character really does her any justice ... I can see she's been given the ears, but like the whole tone and colour of everything, like the shading on the [portrait], she looks really good, but her character in the game really does not. To be honest, I think I found the same with [Tzz] as well. I think the quality of their appearance really needs working on." So: a pass on how the real pirates look in 3D, starting with Helium and Tzz, matched against their portraits: colours and tones, shading, proportions, their pieces (the cat-eared mask, the Atlantis trinket in Helium's hand, left out before as it's not in the wardrobe; the monkey's dark purple). One phrase was lost to dictation ("Why should she be given a poke?"; perhaps the hair, drawn as a bun): to pin down with the user. Then (14 Nov), of Sanne's portrait in Dachimpy's museum: "looking less cringy, but again, I feel like the quality can keep going up. The same things we did with [Tzz] and Helium, that we just look like a couple of Playmobil figures in that. I want it to be a bit higher quality than Playmobil." Then, correcting that: "I do like the [Playmobil] style thing to an extent, but just not to the extreme that it is. Like, I like how blocky people are for a large part, but I think things like hair and clothing need more ... there was a change we made to [Tzz] and Helium to improve the quality of their hair, among other things. I just want the same. It feels like that kind of thing has not been applied to these same styles." So the blocky bodies stay; the hair and the clothes get what Tzz's and Helium's got on 13 Nov (hair built of strands and locks with a streaked texture, garments cut and detailed from the portrait), applied to the other hairstyles (long, ponytail, bun, braids, wavy, curly, short, the beehive) and clothes, starting with the ones the museum's friends wear.
- **Helium's opening: show a white burned causing the bang, and say so (13 Nov):** "maybe there should be a bit more of a link in the initial dialogue to the idea of just make sure you don't send any white pieces down into the burner. And maybe in the initial opening animation, you actually see some white being burnt, and that's what causes the explosion." So the opening shows the board: a column with a white in it goes down into the furnace, and that's the bang. Helium's lines tie it together (the mishap was a white sent down; the one thing to know is never send a white down), leading straight into step one. The lesson's later mishap beat may then be one too many. Then (the same day, go-ahead given): drop the basic mechanics from the lesson: "some of the speech they've got about, oh, blacks up, [browns] down, whatever it is ... basic move mechanics ... Puzzle Pirates does that. That tutorial exists. I'm sure people can work that out. This is more about technique to get to [Crystal Clears] and opening up with the right. First things first. See all these whites on the right, you know, highlight them all. Right, we want to get them out of the way because ... otherwise ... silly mishaps happen." So no swap rule: the lesson opens on technique, every white in the right-hand columns highlighted, and why they go.
- **Helium sends you on to other pirates (13 Nov):** "helium said to teach you some tricks, but ... don't forget, you know, the greatest love of the game is talking to other pirates ... this is not a replacement for the game ... this is a tool, a side adventure ... We should be watching people, looking at YouTube videos, talk to people, just whatever." So once Helium's taught their few tricks, they say plainly the rest comes from other pirates: ask about, watch them play, their videos. The principle is in STORY.md and RULES.md, for every teacher in the den.
- **Distilling bots: measure whites burned by when (13 Nov):** "why it's burned in itself doesn't feel like it means much ... I would measure like the early game by how many like mixed brown black columns you burn before you burned a white ... if you burn a white on the first column or the second column that goes up or down, that's catastrophic. That's game ending ... If you're playing well, you should never burn a white." So the bots' report leads with sessions with no white burned, junk columns burned before the first white burned, and early burns counted as disasters (DISTILLING.md, the twentieth note).
- **Distilling bots: a brown a flick lower when it costs next to nothing (13 Nov):** the bot dragged a brown up the plain diagonal near the top right; "I would have put it further down ... it gets that black piece up. It creates ... a more connected board on that right hand side ... you don't want to really actively be going out of your way, spending extra moves to sort them at this point. But it's still preferable if it costs you very little ... a little flick and a swish, and the brown can be one level lower." A tie-breaker among moves that do the same job (DISTILLING.md, the twenty-first note).
- **Distilling bots: no urgency about whites low by the fire (13 Nov):** "there's no urgency in this script ... it doesn't seem fussed that you're only one column away from a couple of whites burning at the bottom ... It seems to be working ... the top part of the board still ... the top board's safe. Moves are easy there. You've got a spice and a bunch of stuff blocking things at the bottom. Like, that's your danger area that's hard to reach." The whites next to burn, and how hard they are to reach, should come first (DISTILLING.md, the twenty-second note).
- **Distilling bots: whites mostly left, now move the junk in blocks and build the V (13 Nov):** "it made me a bit anxious ... it's doing a lot of little fiddly things ... I would just start pulling, like treating it more like blocks of things to move ... you've got the whites mostly over to the left. This is where you just start saying all those three browns, move them up, all the blacks on the bottom left, pull them all the way down and start building that V shape." (DISTILLING.md, the twenty-third note.) Then the board they'd end up with: whites a block on the left, the junk all right, "note that I've left the brown at the bottom left ... I want to use that to haul black pieces up potentially ... you don't want to just get too greedy" (the twenty-fourth note). Then, with the V there: "that's when I start pulling the browns in, then the blacks down ... I've looped some of the browns around, the blacks are then moving over ... you want the V to be made of ... browns there, preferably more than blacks ... it's still easy to go grab a brown and pull it over when you need it" (the twenty-fifth note).
- **Helium's lesson, the later steps from the user's critiques, concise (13 Nov):** "these are my individual critique guides or critiques, but obviously we want to make this into a more concise tutorial for Helium to give." So DISTILLING.md's notes (the twentieth to the twenty-fifth, and on) become Helium's steps after step one, each short: never a white down the fire, the danger low by the fire first, a brown a flick lower, then the block moves into the V, a brown kept bottom-left, the browns into the V's bottom. One step at a time, as step one was. Then (the same day): levels by a target, "this is how I build a crystal clear 2. That's the initial tutorial, and then you can control what level of tutorial you want": a target chain set first, which sets how much to bank, how long each stage lasts and which tricks it needs (DISTILLING.md, the thirtieth note). And Helium says the target as they teach it (the user, the same day): "he's going to explain ... what the target is. Like, we're going to get some of those whites over. Our goal is to get ... one column full of white pieces. So phase one is get things over, and then we're going to start building the whites to the left ... and then we're going to start gradually increasing the number that we get." So the first level's lesson: the goal is one column of whites; phase one, the junk over to the right; then the whites built up on the left; one column sent up; the next level aims for more. After the bots' target levels land. And your best remembered (the same day): "save it in the local memory, so [they remember] what your best crystal clear is. So the idea is each time you come back, you'll try to work on that breaking that personal best." Done 13 Nov: your best Crystal Clear at their still is kept in this browser; coming back to the still they say it ("Your best's a Crystal Clear 3. Let's beat it.", or with none yet the first goal, one column of whites), and when a chain beats it they say so and remember it. Still to do with the target levels: Helium's lesson and watch mode aiming at your best plus one. And every lesson ends with "Any questions, send me a tell on Emerald" (the user: "to really mess with Helium"; done 13 Nov).
- **Tzz and Umami send you on to the community too (13 Nov):** "I think TZZ and Umami, you can kind of say the same as well ... these are the starter things, but, you know, these guys are amazing. They stream on Twitch a lot. Check out ... link up to the community, especially in the Discord channels ... The official Puzzle Pirate one and the Trophy Hunter community ... where people coordinate things, puts Twitch streams and such." Tzz's done 13 Nov: her lesson ends, after the Bingo, with the starter stuff done, Twitch and the two Discords. Still to do: Umami (he doesn't speak, so how?), and the real links (the Discords' invites, Tzz's and Umami's Twitch) and the community's exact name, from the user.
- **Helium nervous when you leave whites by the fire (13 Nov):** "imagine Helium getting nervous if you're not really clearing out the whites, because Helium's going to be nervous that the distiller is going to have a mishap." Done 13 Nov: at your still, a white in the furnace's column gets them uneasy about 9 seconds before it burns, panicking and cowering about 3 seconds before, and saying phew if you get it out in time.
- **Helium's speech bubble off the edge of the screen at the end (13 Nov):** "I'm looking at the helium thing at the end again. The speech [bubbles] are really off the edge of the screen. There may be two-thirds of them are on the screen, half." Their line should always sit whole on the screen. Done 13 Nov: every pirate's line is kept whole on the screen, side to side. With it: "I can't see helium at all ... still need to see more of the puzzle ... you don't need like the menu at the top again in these views"; done the same day: no den panel at Helium's board, the board bigger, and Helium beside it once the screen's wide enough. Then ("on mobile, I can't see helium at all"): on a phone, where they stand off the screen, they're shown in a little framed window at the top left, a second camera on their face, their line beside it. And bigger ("a bit bigger ... removing more of the dead space"): on a phone the board fills the width, the still's picture tucked up beside Helium's window. When Helium's nervous, the whites they mean are ringed on the board ("it should like visually indicate like highlight the pieces").
- **Distilling bots: the Ultimate walls in a white by the fire, burns early, crawls too soon (13 Nov):** watching the Ultimate on seed 1. A white at the top of the third column from the fire, beside a spice: "It should have moved it into that spot behind the [spice] ... I would be taking some of those browns in the far bottom left and be like racing them up there"; then "it even moved some blacks in the way at the top that actually block getting that white piece out ... Why have you blocked it all in?" Then "3 burns just happened in rapid succession before it even made another move. Is that why it's struggling and failing?" And "a lot of crawls and kind of looping things up motions ... still being done at an early stage when there are much simpler techniques ... through [the V] in one big giant sweeping motion". And a black let go "one short" of the corner, when a swap more and the brown in the bottom middle would have levelled the bottom. Traced (DISTILLING.md, the twenty-sixth to twenty-ninth notes): whites only count as in danger in the last two columns; columns are burned early with whites in the next ones; the phase weights are switched off whenever anything's stuck, which is nearly always; a drag's let go where the score peaks. Go-ahead given (13 Nov): "Just do for all of them", the four fixes and the target together. And the bots' levels by their target, not their names: "I don't want to say able blah blah blah. I want to say what is the bot's target crystal clear and it will try and work towards it. Like once it's got a crystal clear one, it will start sending them up ... it will just be like one white column ... and then it will start working on the next one." So each bot is a target chain (CC^1, CC^2, CC^3...): it banks the whites for that chain, sends it up, then starts on the next; its report leads with its mean chain against its target (DISTILLING.md, the thirtieth note).
- **Helium's opening a bit long, once only, and in on the board for the lesson (13 Nov):** "his initial cutscene goes on a bit too long now. As long as you can skip it, that's fine. I've said I wouldn't want that playing every time, but I think that's standard. Also, when he starts moving pieces and showing you how to get the whites out of the way, it really should be zooming in on the board by that point." Done 13 Nov: Esc still skips it all; their lesson was remembered as seen in this browser (undone the same day: the user wants it again after a refresh); and from step one the camera is in on the board as at your still, Helium beside it on a wide screen, in their little window on a phone. Then which part: "not trimming, but just like ... the time they hang around for. Certainly ... by the time you get to is it safe, it's a bit like, well, come on, get on with the puzzle." Done 13 Nov: every line's up for less (about 3.3 words a second, was 2.5; 2.5 s at the least, was 3.2), the bang's moment 3 s (was 3.5), a shorter breath between beats; Space still goes on sooner.
- **A black bar over the top of Helium's lesson on a phone (13 Nov):** "on mobile, there's just like a black bar in the top of the screen ... it's blocking all the chat and the animation." The cutscene's letterbox bar at the top covered Helium's little window and their line. Done 13 Nov: at Helium's board on a phone (upright), no bar at the top; the bottom one, with the step and the keys, stays. Checked at 375 by 812.
- **A read version of every tutorial, kept in sync: Distilling first, then Tzz's (13 Nov):** "Do you have a summary document of the strategy that the bot is taking now? ... what are the rules, what are the phases, what are the tricks and techniques ... it would be quite good to actually have that as a document anyway to point to if people just want to go have a read version, similar to how we've got the those design docs ... a 2D static version of the guide, and ... everything's just kept in sync, like the animated version, the 2D static version ... So we could do the same with the TZZ tutorial of how to do doubles and bingos or Vegas." There's no such guide yet: the strategy is spread through DISTILLING.md's notes. So a public page, Distilling's guide: the rules in brief, the target (a Crystal Clear to aim for, the levels), the phases (fire, fill, block, chain) and what each is after, the techniques with a 2D board picture each, the tricks from the user's notes; drawn from the same code as the lesson and the bots (the boards, Helium's lines, the phases' and techniques' names), so they can't drift. Then the same for Tzz's balloon animals (doubles, Bingos, Vegases). The rule is in RULES.md.
- **Distilling's read version: the progression out of order, some arrows confusing (13 Nov):** "Just been through the guide, and it seems like a few of the simple things are a bit out of order just reading the read thing. So, you know, progression's a bit weird ... and some of the arrows are a bit confusing at times." The guide goes rules, target, the four phases, then every technique by the level that adds it, then the tricks at the end; so the first things a player needs (never a white down the fire, the danger by the fire) come last, and the chain's channels sit among the simple ones. Which arrows confuse: to pin down with the user. With it, the sorted right side's one fluid motion (DISTILLING.md, the thirty-first note): "once there's a nice clear separation, it's just down, up and back up again", for the guide, Helium's lesson and the bots. Go-ahead (13 Nov): "go ahead and reorder the guide and add the fluid motion thing." Done 13 Nov for the guide: each phase in order with its own tricks and techniques under it, simplest first, each tagged with the level that brings it in (storing and the leapfrog moved to the blocks, where the phase weights put them); the fluid motion drawn on the picture's own board, the drag found by the code; the arrows one colour a drag, a dot at the pick-up, the head only at the end, numbers placed clear, there-and-back stretches as two lanes. Helium's lesson and the bots still to learn the fluid motion.
- **Distilling bots: frozen with whites at the bottom, the blacks' diagonal left, drags stopped short (13 Nov):** "It seems to have just frozen ... It seemed to really neglect clearing out the diagonal of blacks ... eventually you end up with these white gaps at the bottom ... maybe it's stuck because it requires maybe a few moves just to kind of get the brown into the right position. And then you can use it to drag across a few blacks and then just mass drag them down"; and "it doesn't really still finish dragging things all the way to the right when it's got the opportunity ... you could go one step further, just do it." (DISTILLING.md, the thirty-second note.) Passed to the bots' round in progress.
- **Duty Navigation: stars should drop slowly, the ring selected hard to tell, turning jumpy (13 Nov):** "for Duty Nav, the pieces are supposed to slowly drop. It's feeling really weird ... some of the highlights as well and the contrasts are a bit off"; "the highlight between the selected ring and a non-selected ring is relatively minimal, so it's making it hard to tell what ring"; "the turning animation, it's just very jumpy and jagged. It's not as smooth as I expect." Done 13 Nov (js/den/nav-board.js, every Duty Navigation board, the starlit door's too): a star drops in and falls at a steady, slow pace, about a third of a second a ring (was a sixth of a second whatever the distance); the ring selected lit plainly, a bright band with gold edges either side, gently pulsing; a turn takes a quarter of a second, eased, and a run of turns flows on without stopping at each spoke. Other contrasts the user meant: to pin down with them.
- **Gunnery at sea: W A S D steered her instead of pointing the chalk (13 Nov):** "in guns, [WASD] should be controlling the arrow direction, not turning the ship." Done 13 Nov: at her guns W A S D point the chalk arrow the way you press, as on the gun tower, and don't steer; the arrows still move along the planks; the prompt says so.
- **The race's rocks: one hit to bring them down (13 Nov):** "the gunning barrier is definitely need tuning down, like maybe just try it even with one to get through them, like the one that you start with, because any amount of gunning otherwise just feels unworth it." Tried 13 Nov (ROCKS.HITS 3 to 1): the balance check then has the rocks' route winning 41% of races against its cap of 40%, and the barrier's (Foraging) route 12.1% against its floor of 12.5%; every other route still fair. Held back, for the user to choose: one hit as it is (and the caps widened), or one hit with the rocks' route a little longer, or two hits. Then "Try 2 hits" (13 Nov): with two, the rocks' route is fair, but the barrier's (Foraging) route still wins 12.1% against its floor of 12.5% (it was above it at three hits, so the rocks take a few of its wins). Held at three again, for the user: two hits with the barrier's floor eased a hair, or two hits with the barrier made a little quicker. Meanwhile the rocks' look copes with any number of hits (every course still standing comes down with the last).
- **Bilging at the canal: zoom in, the puzzle's tiny (13 Nov):** "[Bilging] at the canal, you definitely need to be zoomed in more. It's so tiny, the puzzle." Done 13 Nov: the camera at a lock's quay pump fits the board with a little room (was 1.75 times that, to take in the lock beside it), and your zoom at sea no longer shrinks it, as at her deck patch. Not checked in the browser.
- **The crane you build in the race: tiny, its arm floating (13 Nov):** "the crane that I built was really tiny in the race, and there's actually no connection even between the [pieces]. It's so small that there's no connection between the bits. So, like, the arm is just floating in midair." The crane built in its notch (Carpentry's frames) wants to be drawn much bigger, and its parts joined: the mast, the arm, the hook all connected.
- **Distilling bots: never burn by hand, no cap on a drag, CC^1 banks one column, its column shown (13 Nov):** "I've got the bot on aiming for CC1, but it's just going and going ... My intention was ... it would highlight a column and say, look, I'm aiming to build a crystal clear one here ... don't have any limits on how long an individual pull can be ... definitely get rid of manual burns ... that's why no one's getting past CC2 ... just don't ever do that. Never." Done 13 Nov: no bot (nor Helium's Help) ever burns a column by hand; a drag's let go where the board's best, the longest such, and the cap on a drag's length lifted (40 swaps, more than any board needs); the bots bank a column of whites a Crystal Clear of their target (CC^1 one column, was four; six at the most); on the test page the bot's aim is said first, banking or "building a Crystal Clear in column N", that column shaded gold on the board. Not measured yet over 20 boards.
- **Distilling bots: a brown stuck at the top of the column going up, rescued (13 Nov):** "this is absolute danger mode ... the first thing I would be doing here is just rescuing that brown piece, because that gives you your crystal clear 2 or 3 easily here. You got a brown piece there, look, that can move up, and then a black that can hop along the top, and you'd rescue the brown piece. You'd then be able to pull it back. It's not applying those techniques in a really urgent situation, and it's actually burned several columns and just left this here. Like, there was lots of time to rescue it even before now." The furnace's column all white but a brown at its top; the user's drag brings a black along the top row to free it. The thirteenth run found the same: in the chain a brown or black stuck on the edge of the column going up needs a pair working together, which no routine finds. To do, urgently, and early (there was time).
- **Helium's lesson as goals: CC^1 first, a plan shown, the batch done when it's met (13 Nov):** "in the tutorial mode, obviously, if we're aiming for crystal clear one, the whole thing should obviously just finish and then restart the next puzzle once you've hit that goal. I guess maybe you could say, no, you should do it again"; then "Might be a bit tedious if you have to go through every single CC level one by one. So maybe you can say, you're aiming for at least one, but do a few more if you can." And the structure after the goal: "she says starts with a goal, one crystal clear, but then it's just kind of like it's just a message. Nothing. There's no structure after it. It's not like, oh ... what I will do is maybe ... try and get those three columns of blacks out of the way and start getting all the white pieces over here and like highlighting some column ... and arrows of where they think the white pieces should go." So at your still: the goal (at least a CC^1, more if you can), then Helium's plan step by step on the board (the junk columns to clear, the column the Crystal Clear will be built in shaded, arrows for where the whites go), and once the goal's met the batch is done: well done, go again or on to a bigger goal. **Done 13 Nov, to be played:** at the still each batch has a goal, at least your best plus one (a Crystal Clear 1 to start), more if you can, said as you sit down and in the bar. Their plan for it is the planner's own (`advise` with the goal as its target; one more than the chain once it's met), shown a step at a time as the board changes: 1, the junk columns to burn shaded red, the whites in them ringed; 2, whites banked left (only when the board hasn't enough for the goal yet); 3, the Crystal Clear's column shaded gold, the junk in it ringed; 4, send it up (X burns the junk ahead). The planner's next drags drawn as numbered arrows throughout, Helium's line as each step starts, the step in the bar. Once the goal's met and the chain ends (or the flask fills), the batch is done: the board stops, their well done (the first time, the other pirates and the tell on Emerald), your best kept, then R the same goal again or N a bigger one (past your best), on buttons too, a fresh board. src/den-helium.ts (goalFor, Batch, planFor, PlanLines), tests/helium-goal.test.ts. Still to do: the read version (distilling-guide.html) to show the goal and the plan's steps.
- **The flask fills a step each Crystal Clear (13 Nov):** "the jar thing at the top should fill up each time you do a crystal clear ... one nth": the flask above the still fills by one n-th for each Crystal Clear, n the most there can be. **Done 13 Nov:** n is 12 (twelve columns of whites fill the flask's 100 pieces, eleven don't; from the twelfth Crystal Clear in a row it carries on), so at Helium's still the flask fills a twelfth a Crystal Clear sent up, twelve marks up its side (src/den-helium.ts, flaskLevel; distill-board.js's `flask` option). The real flask's rule, 100 pieces, still ends the session.
- **Helium's opening plays again after a refresh (13 Nov):** "Going to this Helium's Island isn't playing the thing anymore ... if I refresh the browser there, it should. I don't want it to be stored in local storage." Done 13 Nov: seen once a page load, as before; the browser's old mark cleared.
- **Distilling: positions to critique, turned into tests (13 Nov):** "are we able to create just some sort of set of tests and are you able to like lead me through them of like create a few random boards or ... snapshots from partways through the game that I can critique and we can create some real deterministic test on what I think the bot should be doing at that point, either at the strategic level or specific move level ... at the moment, I feel like I'm critiquing, but it's not really having the specific impact, and it's not very regression-proof." So a set of positions taken from the bots' own games at telling moments (danger by the fire, a stall, a chain about to break, the block phase), each shown numbered with the bot's move drawn, on a page readable on a phone; the user says what should happen (a phase or plan, or a move, drawn as now); each answer becomes a test on that exact board (what the bot must do, or must never do), kept in a file of positions, so every critique stays fixed. Built 13 Nov (`distilling-positions.html`, twelve positions P1 to P12). Verdicts so far: P1 and P2 (13 Nov), the top right first early on, before its whites are trapped (risk management and priorities; open: the bots don't yet). P3 (13 Nov): with time in hand, the quick sorting moves first, blacks down and browns up (open). The theme from them (13 Nov): "you need some kind of little agent or something that detects, traps, and risks and prioritizes which white pieces to try and rescue": a risk reader for the bots, each white ranked by how trapped it is and how soon its column burns, the riskiest worked first, quick sorting moves when nothing is at risk; the open verdicts its tests. P4 (13 Nov): by the fire, fill the gaps as fast as you can, junk raced into the whites' places (a brown up, a black down: column 9's two gaps in two moves), not one white dragged a long way (open). P5 (13 Nov): column 8's top two whites first, with no way for a brown to reach them; the bot's move fine but the bigger danger missed (open). P6 (13 Nov): no big, long, complicated moves; the trapped whites at the top of columns 8 and 9 first (open). P7 (13 Nov): a board gone really wrong; the risk reader names the board's state (an enum: healthy, at risk, damage control) from how many pieces are stuck, how many columns the junk can still fill, and junk stranded among the whites, and every choice reads it; here damage control, columns 8 and 9 filled fast, then the stranded blacks and brown in columns 5 and 6 out left (open; the user's message was cut off at "you could still get like a crystal clear 6 or"). P8 (13 Nov): sort columns 9 and 10 fast before one burns (blacks up, browns down: the zigzag needs two solid columns), then fix the V; the V left too long (open). P9 (13 Nov): the sweep stopped short; better, the tail of browns at the bottom of columns 7 and 8 sorted down first, so the next sweep runs all the way (open). P10 (13 Nov): a cracked board (blacks stranded at the bottom among whites, browns at the top): hold off lifting the middle's browns to the right, they're the tools to rescue the blacks; switch from filling to fixing (open). And "why are things only half moving?": the page draws the bot's one-swap drag faithfully, but its reason says "down through the browns" (to pin down with the user). P11 (13 Nov): skipped, "not a valid question, because something went wrong": a lost board, its lesson upstream. P12 (13 Nov): skipped too, "you would not get into that situation if you're any good". Then (13 Nov): "keep all of that ... kind of organize them into the themes for those test examples": the positions' tests and page grouped by theme, once the board reader is merged (it edits the same files): trapped whites near the fire first (P1, P2, P5, P6); fill by the fire fast (P4); quick sorting when nothing's at risk (P3); the board's state, damage control (P7); a cracked board, keep the tools (P10); the patterns on the right and below, the ladder and the V (P8, P9); and the skipped, lost boards (P11 and P12, the user confirmed, 13 Nov), marked skipped in the code rather than listed as todos. Done 13 Nov: the tests and the page grouped by theme (`THEMES`, `THEMED`), each position also checked for what the board reader reads there; P3's reading open (the reader says fill the gaps, the verdict quick sorting: to put to the user). Then (13 Nov): "once you've done that and trained the bots ... build up the list of examples so that I think we could definitely go with a lot more and speed through them ... we'll test that those are behaving and categorizing the way we want, as well as a new batch." So after the board reader: check the first twelve read and play as judged, then a bigger new batch of positions (twenty or more, from fresh games with the reader in), each shown with the bot's reading (its state, the risks it rings, its tactic) and its move, laid out to judge quickly (agree, or a line of what's wrong), each answer a test. And (13 Nov): "Maybe not just like a few, could be like a random batch, but then maybe it can try and see, like, here's a challenge. Can you find one or two others in the same theme and different boards to see that that feature is detecting those themes is working?" So the batch is two parts: a random set, and for each theme already judged, one or two fresh boards the reader says show that theme (found by searching bot games for its reading), to confirm the detection holds on boards it wasn't built on. The board reader (13 Nov, the thirty-fifth note): risks spotted piece by piece and as groups by pattern (stranded junk, the V and its tail, the ladder), the board's state named and the tactic in play, every move weighed by them; started 13 Nov with the open verdicts as its tests.
- **The den's menu as a hamburger menu, on a phone above all (13 Nov):** "the menu, certainly on mobile, can be more of a hamburger menu." The panel at the top left (Your pirate, Your den, Decorate, Pause...) folded behind one button. And hidden in any puzzle's view, as it now is at Helium's board.
- **Help, Helium: hinting, the path shown, and their plan for this part of the game (13 Nov):** "as well as helium helping, they can be hinting as well, so it shows you the path. Of what the next moves are they would do. And maybe ... plans out a few of like, well, this is the thing I will do at this part of the game." So a hint mode beside the help: the next drag or two drawn on the board as a path (not played), and what they're working towards at this stage in a line (to shape with the user). And with Helium's nerves (the same day): "when he's kind of highlighting the white pieces ... maybe it should show some arrows of nearby routes of pieces that can be dragged into the spots": with the whites ringed, arrows for the nearby junk pieces' drags that would take their places (the path search's routes). And three ways at the still (the same day): Help (they play it), hints and feedback, or "the watch helium play option where he explains, well ... first of all ... I'm going to try and get rid of all the white pieces in all these columns, and then just kind of step by step what you're thinking based on the whatever technique or strategy". So the bots need a phase of their own they say aloud ("this is the current phase I think I'm in"), and the phase sets each technique's weight: "it can always use all the techniques if it absolutely needs to, like it gets stuck or there's a blocked white piece. But ... different techniques have different weights depending on the stage." Done 13 Nov: the bots' phases (fire, fill, block, chain) with weights by phase; hints on G (arrows, and routes into a ringed white); watch Helium on W. Then ("you've got 2 of the 3 in that column, but there's no route shown for how that third white can get out. It should show all of them"): every white in the columns a hint clears gets a pale route of its own, and every white by the fire one before any gets two.
- **Hold the fire and burn by hand at Helium's still (13 Nov):** "Should have the ability to pause auto burning and burn manually if you'd like to slow down, helium should reference the keyboard shortcuts for it at points." Done 13 Nov: F holds the fire (nothing burns till X), F again lets it go; held through Help and watching them; they say the keys as they hand you the board, in the bar, and after they panic the first time or two. Then held to start with ("Maybe it should start that way ... if you're ready for it to start burning automatically, hit so-and-so button, but it's paused by default. I think that's much more tutorial-like"): Helium says so handing you the board, and on a phone there are buttons, Start the fire (F) and Burn now (X). And funny about it ("saying I'm gonna hold the automatic burner so we don't have any of these mishaps. But ... when you feel ready, hit [the key] and it can start burning automatically"): done the same day, a beat before your go. (Of the hints and watching them play: "well aligned ... more of a single toggle so I like that".)
- **Helium's lesson reads the board too: the bigger risks first (13 Nov):** "the tutorial mode as well, like those bigger pattern things again. So it should be like go for the default and the focused view, but if you spot those bigger risks, focus on them instead ... if you start getting into those situations, like that's why I would expect Helium as the kind of little instructor to be like, you know, you've got a lot of trapped pieces, and start highlighting them, similar to how you do with the targets, and say, I think you need to worry about this." So at Helium's still, their goal-led plan stays the default, but when the board reader (the thirty-fifth note) spots a bigger risk (trapped whites near the fire, junk stranded among the whites, the V gone bad, the board cracked or in damage control, or about to lose the zigzag: "when you're at risk of losing the ability to do the Z thing, where you can bring pieces up and down on the right ... That's a risk", the right-hand pair unsorted as the column it needs comes up to burn), Helium says so in their voice and rings those pieces on the board, as the plan's columns are shaded now, until it's dealt with; then back to the plan. Built on the board reader once it's merged.
- **Helium's lesson: its plan's moves to feel like teaching (13 Nov):** playing it: "I kind of get the idea that fine, [they're] trying to get you to get the whites over into that yellow column, but I think the graphics need work ... it's giving you really complicated moves. Oh, okay ... now it's kind of making some sense ... I'm not really sure that seemed very tutorial-like. Like, am I supposed to be able to figure out and spot similar things? Yeah, so I think just a bit of the user experience on that needs refining." So the moves Helium shows should be ones a learner can see and repeat (short, one at a time, each with why it works in a line), drawn more clearly, and teach the pattern so you can spot the next one yourself, not a bot's long plan to copy. Then: "the drawing of the arrows was all fine ... if we go for a crystal clear one, that those were complicated moves. Like best for like maybe for later, sure, but for crystal clear one starting, no." So the arrows stay as they are; the moves scale with the goal: plain one-to-three-swap moves at CC^1, the long plans only for bigger goals later. Started 13 Nov.
- **Two drags that are one move (13 Nov):** at Helium's still, the plan's moves: "drag the brown to the right, and then the white to the left. When to me, it's like, well, why isn't that just one move? So I guess this explains why things are being caught one short, is it's not, oh, I can't go further. It's I want to drag this up and then the white" (the message was cut off there). A one-swap drag of a brown onto a white, then the white it moved dragged on, is the same as holding the white and dragging it the whole way in one go: the bots' plans (and Helium's) should make it one drag, as a player would. A likely cause of the drags "stopped short" (the thirty-second note).
- **Helium's plan after the goal's Crystal Clear, and "Make way" explained (13 Nov):** playing it, with a screenshot (column 10 shaded gold and every piece in it ringed, all junk, an arrow taking column 9's white up into it): "I've just done the crystal clear one. Why on earth is it trying to get me to pull the white piece all the way into the first column? The goal here again should be, we're going back, we're restarting, we've just done the crystal clear, so we should be restarting to three columns of junk and then building the white pieces further to the left." So after a Crystal Clear, with the next column junk, the plan starts again at step one (the junk columns by the fire, the whites banked further left), not chasing the chain into a column of junk. And the two numbered drags of "Make way": "sometimes it was a bit confusing when you've got the 1-2 moves ... a lack of explanation as to, oh, first do this, so because white goes up into black, so you need a black piece there. I mean, that's obviously wordy, but I feel like it's could help": Helium says what the first drag sets up for the second, in a line.
- **Distilling's bots: the odds of filling the next column, and a new chain started as far left as you can (13 Nov):** after Helium's plan chased a Crystal Clear into a column of junk: "Is there no, again, like just method in the bot that sort of tries to predict and calculate what the odds are of actually getting all the whites into that column? Like if you've got a completely junk column, you don't try and build a whites into it. Yeah, you build further left. You start a new chain as far left as you can. Obviously, in the context of [CC^1], you don't need to. But like, if you're going for the maximalist one, absolutely." Today there's only the endgame's cash-in check (whites needed times the time a fix takes, against the time left); Helium's plan has a crude rule (more junk than white: start over). So a real estimate, a module of its own like the board reader: for the next column (and the ones after), the whites it needs, the whites near enough to bring in and how long that takes, against the time before it goes; the bots and Helium both deciding by it whether to carry the chain on, or let it go and start the next chain as far left as they can (the bigger the target, the further left), with tests on the user's board. Then (13 Nov), on Helium's rule (more junk than white in the next column: start over): "We want rules of thumb like that. That doesn't sound too far off how I would think. At least, I wouldn't make it more complicated unless we find some problems when we next review the list of example moves and situations." So no odds model: the rule of thumb stays, shared by the bots and Helium alike (one function), and is looked at again only if the next batch of positions shows a problem.
- **Every move a named trick with a goal, the bots' too, and the tricks side by side in the guide (13 Nov):** on Helium's teaching moves: "I like that you've got labelled moves of what the purpose and goal is of each. That makes me feel more confident that ... that can appear in the [guide] quite well as small things next to each other, but also that, you know, if the bot follows, again, that is integrated into those same tricks, that it's not going to do a half move for no reason, like everything ... has got a goal and a reason and like linked to one of those more abstract moves." So the five tricks (the climb, the sink, the lift, the drop, the weave, and making way) shown small, side by side, in the guide; and the bots' moves built from the same named tricks (src/distill-teach.ts), each move carrying its trick, its goal and its reason, so no move is a half move for no reason.
- **The race's bribe made usable (13 Nov):** route planning found the wreck off leg 1 out of sailing's reach from most of the starting line, so the pilot drops the bribe and runs the gate. The user: "I definitely need to fix the bribe so it's more usable. I mean, I think that was obvious." So the wreck (and its notch) placed, or its way in opened, so a plan for the bribe can reach it from anywhere on the line, and the bribe wins its fair share in the simulation (RACE.md §3, §8). **Done (13 Nov), to be played:** the wreck moved just along from the gate (column 22, where the hop and the field's winds bring most racers down onto leg 1), a breath of wind up out of its notch so she sails in from either way along the leg and out again (it was a wind along the leg that had her in irons coming back); every racer goes for the coins first, wherever the wreck lies, and back for the gate (src/race-plan.ts, goalOf). Reached from every spot on the line on every field (tested). The guard's price halved to 20 coins: in and out of a dead-end notch and back to the gate cost it what the other stopped shortcuts don't; the bribe now wins 15% (0.6 of fair; it was 7%). Watch: whether 20 coins still feels like a puzzle worth the gate.
- **P3 reads as quick sorting (13 Nov):** the user's original verdict on P3 stands ("I'll just be dragging the blacks down ... browns up, they're just really fast, quick, simple, easy moves"; confirmed: "Take my original verdict"). The board reader read it as filling the gaps, so the reader changes to read P3 as quick sorting; the verdict and its test stay as they are.
- **Each position shows a short plan of next steps, followed through (13 Nov):** on the positions page: "for each one as well, show like a short plan of next steps ... this P1, for example, ... the black moving up to three, is it to start working on three in the whites, but it only shows one move, so then it's kind of just wanting to make sure it actually follows through rather than just making a step towards it." So each position shows the bot's next few moves as a plan (its trick and goal, numbered on the board), and a test that the bot carries the plan through to its goal rather than taking one step towards it and wandering off.
- **The race plan's strip: see the course and each choice's length (13 Nov):** sitting on the race's planning: "if you're changing the, you need to be able to see the length. This is very disconnected. At the moment ... it requires you to really know the course to actually be able to do anything with this." The strip lists each leg's choices by name only. So show the course with your route drawn on it, each choice's line on it as you change one, and how long each takes against the long way, so a plan can be made without knowing the course. And (13 Nov): "persist the last plan you chose so that you don't need to do it every time." **Done 13 Nov, to be played:** the strip has the course drawn small with your route in gold and where she is; each leg's choices side by side, each with its seconds against the long way (from the simulation's measures: src/race-sim.ts, choiceTime; tested); pointing at one draws its line on the course and says it, a click or tap takes it; on a phone a tab opening as a sheet. Your last plan's kept in this browser and each race starts from it (src/race-plan.ts, readPlan; tested). RACE.md §5.
- **At sea, Gunnery and the deck patch popped out like Sailing's board (13 Nov):** racing: "While on the move is absolutely chaotic. I don't know what happened. I got shot, and then all I could see was the mast and [the deck], overlooking the [Carpentry] before you could say anything. So I think guns, as fun as it is doing it on the deck, I think, yeah, definitely just needs to be a puzzle on that. Like, yeah, you can still have that, I guess, for spectators, but I think my controls need to be more like sailing is, where it's popped out." So for your own sloop, Gunnery and the deck patch's Carpentry are a board put up in front of you as Sailing's is (the sea and the race still in view, no camera swing down onto her deck); played on her deck only for anyone watching. **Done 13 Nov, to be played:** racing, both come up in a gold frame where Sailing's board goes, looked straight down on (her bow at the top), the race camera staying out over the water (js/den/pop-board.js); the same boards on her deck, so the race watched still sees them there; away from a race, as before.
- **Winds and other things at sea act like rocks (13 Nov):** racing: "I don't know why the [wind] tiles seem to be acting like rocks. And there's a few other things that kind of act like rocks that really shouldn't be ... a [wind] tile should just be a regular tile you can sail over. It only takes effect on the second phase." So a wind square is sailed onto like open water, its push coming only in the turn's second phase, as in Puzzle Pirates; and whatever else stops her as rock does but shouldn't is found and fixed (to pin down with the user which others).
- **The race's headwind gap: boards overlapping, the camera stuck, and rowing sideways (13 Nov):** racing by the plan: "It took me to the [headwind gap], which I swear is broken. I can't move the camera[;] your plan is covering the right hand row board and the left one for some reason has sailing underneath it. And when I went into the gap, ... the rowboat is perpendicular to the actual gap, so you're not even going forward." So at the headwind gap's stop: the plan's strip never covers a board (the rowing boards fit beside it); Sailing's board is put away while she rows, not left under the left rowing board; the camera can be moved as anywhere at sea; and the pilot lines her up facing along the gap before the oars go out, so rowing takes her through it. And on top of that (13 Nov): "isn't there still a problem? I'm sure I remember noting it before. Like, I can't even see a way through." (The 12 Nov pass lowered its cliffs and drew its wind; from the sea its way through still can't be seen.) So the gap's passage plain to see from the water, a way she can be seen to go through. **Done 13 Nov, to be played:** the pilot lines her up on the square above the gap facing down it before the oars go out (tested: even strokes row her in, round its dog-leg and out onto leg 3); Sailing's board is put away while her oars are out, back after; the strip folds to a tab while any board but Sailing's is up and the boards lay themselves out clear of it; the rowing camera turns and tilts as anywhere at sea (V puts it back); the gap's cliffs step down to low shoulders beside it and its water's a paler channel from leg 2 to leg 3. Its "in irons" wind unchanged (open with the user).
- **Remember the race plan you last chose (13 Nov):** "persist the last plan you chose so that you don't need to do it every time." So your last plan is kept in this browser and each race starts from it. Done 13 Nov, to be played: kept in this browser, each race starting from it, a stale or broken one falling back to the long way.
- **Rushing the gate with a Quad isn't realistic (13 Nov):** "a quad sails over the initial imperial checkpoint doesn't seem like a realistic thing, it's far too close to set up a combo and with little benefit." The simulation agrees: the Quad's route wins 9% (0.49 of fair, out of the band), the pilot reaching the gate before the combo's built and stopping short in the open (RACE.md §8). (What to do with it: to settle with the user.)
- **The imperial gate saves far too little for its puzzle (13 Nov):** "[it's] definitely completely unbalanced. Like, again, you're saving a couple of tiles for the time you're spending quite a long time in the puzzle. It needs to be much more significant. I think that Imperial Gate almost needs to be like that, and the treasure hauling thing needs to be almost like on the left-hand side, I think." Today the gun gap saves about 22 s and the bribe's haul and its trip back to the wreck eat most of that. So the gate cuts off a much bigger stretch of the course, and the wreck goes back to the left-hand side, before the gate, on the way (to pin down with the user). And running it is too easy (13 Nov): "that would work, I think, at least for the bribery spot. Maybe it needs to be a bit harder to get through because right now you can just run it and just do a quick [Carpentry] puzzle to heal the damage. Which is really easy." So running the gate costs more than one quick deck patch.
- **Duty Navigation: nothing drops, everything stuck at the top (13 Nov):** "I don't know what happened to do to navigation, but everything's just stuck at the top, like nothing's dropping." Done 13 Nov: the slowed drops' change that morning had put the line starting each step of the board's animation behind a comment, so nothing ever played; put back, with a test.
- **The plan strip: no timings, no scroll bar (13 Nov):** "I'm liking the look of the planning improvements. But yeah, I don't know why you've got the timings on there. Like, that's just a behind-the-scenes balance thing. There's no reason to display that. And it shouldn't have a scroll bar." Done 13 Nov: each choice shows its name (and its puzzle when pointed at), your route the puzzles it stops for; the course drawn small gives up height so the strip never scrolls.
- **The race plan for a new player: what each choice is, where (13 Nov):** "on the plan thing, again, it's not really addressed the idea that for a new player, they don't know what those things correspond to. They've not seen the map before." (Message cut off; to pin down with the user.) The strip names each choice and draws its line on a small chart when pointed at, but a new player can't tell where or what each is. Then: "we've got the nice 2D map for the chart kind of thing. Is it something that could be combined into that" (the parchment chart of the course, tools/race-map.mjs, changelog/race-map.jpg). So the plan becomes that chart: its drawing shared by the tool and the den (one module), shown big on the starting line with each shortcut labelled where it is with its name and puzzle (no win rates or times, those are behind the scenes), your route drawn on it, a click on a shortcut picking it; in the race the strip, with the big chart a key away.
- **Queued, one at a time (13 Nov):** "we've got a few on ... I don't want to do too many going on." Next up, in turn, once the gate experiment, the positions batch and the plan on the parchment chart are in:
  - **Helium's rum run** (IDEAS.md, "Helium's rum run"): "definitely seems ready". After some distilling, Helium aboard with a deck of barrels: deliveries to Mischievious's wedding and to Kikkit, then the rest smuggled past the Empire to Port Decorum.
  - **Dachimpy's house, the museum** (IDEAS.md, "A museum, in Dachimpy's house"): "as is my museum house idea". One more house in the housing district on Gravee's house's shell, its exhibits the old Blockade Simulator and dachimpy.com, oldest first (the screenshots in notes/museum/).
  - **Roobear's small house** (IDEAS.md, "Roobear's little house"): "she was really cute ... a really sweet interaction, and I wanted to commemorate it, but ... I've not really got like a full adventure for her. So maybe just do the small house ... and we'll see kind of where it goes." The small house only: her in her own look, the ROOm at the door, the gallery of guesses at her name; no adventure or send-off yet.
  - **The race commentator** (IDEAS.md, "A commentator for the sloop race"): who it is: "Will let [Disengaged] be the commentator perhaps" (13 Nov; a real pirate, pirate name only, their pirate page and portrait to check before they're drawn; "perhaps", so to confirm when it's built).
- **Distilling: the positions from the lead-up, P13 to P15 judged, and the CC^1 opening (13 Nov):** on the new batch: "I feel like the ones I really want to be judging are the things that have gotten me into that position beforehand ... the problem that you're showing me examples after the problem already looks irreversible." So positions are picked from before the damage: where a white ends up trapped for good or burned, rewound to the last board it was still free and the move that shut it in. P13 and P14 too late to judge (P14's ideas fine); P15 the reader right, the plan right for three steps then distracted (to see through: a brown into column 9 beside column 8's white, the line of brown swapped for blacks, the white up). And the CC^1 bot's opening: "it should be like trying to build it in the second or third column, like close to what's being burnt, just to have a bit of burnt buffer", whites to its right brought over, and never a white moved back out of the target column. (DISTILLING.md, the batch's note.) Then P16 to P22 (13 Nov): P16, P18, P19 too late again ("you need to give me options earlier in the game"); P17 the block phase's black down right, but missing the risk of the left's low blacks stranded under its high browns, a brown to hoist them up; P20 and P21 and P22 not trapped at all ("Nothing's trapped ... a two-step solution ... trapped I define as ... requiring a complicated move and high number of swaps"), so the reader's trapped measured by what it takes to free a white; P20 quick moves then hoisting (column 7's blacks down, column 5's middle black out of the way, a brown hoisting columns 2 and 3). And P23 to P30 (13 Nov): the readings mostly right, the plans not. P23 and P24 quick sorting, but a risk unseen (browns high, blacks low: the whites soon stuck); P25 right; P26 never wait, a doomed white given up as junk and the quick fills played; P27 and P28 damage control right but the plan "terrible" (a brown up to the top right, splitting blacks and browns further, where hoisting with the browns was wanted); P29 and P30 the pattern right, the move not (the brown brought down to the V's tip, swapped for the black at the bottom of column 7). Full verdicts in DISTILLING.md.
- **Dachimpy drawn as they really look (13 Nov):** looking at the den: "Absolutely does not look like me", with an in-game screenshot: "me at the back with my pink and purple wig, kilt, belt and braces, and shoes" (a tall pale-pink beehive wig with a purple band, tan skin, a brown beard, purple braces, a dark belt, a pink kilt with a purple-blue tartan, pink shoes). So Dachimpy in PIRATES from it, the pieces in the wardrobe, and Dachimpy drawn that way where they appear (their museum house; Roobear's ear-rub shot retaken). With the museum house's agent, 13 Nov.
- **Left on branches when the PC went off (13 Nov night), to review and merge next:**
  - **Dachimpy's museum house** (branch worktree-agent-a9e6c13b7d2601261, WIP): the house (`?at=dachimpy`) with its three rooms, every exhibit up close with its plaque, Sanne, Zizzy and Dachimpy's real look in the wardrobe, Roobear's ear-rub shot retaken. **Done 14 Nov:** finished (its changelog entry, the notes, the full tests passing), merged and live.
  - **Distilling's verdicts into fixes, and the lead-up batch** (branch worktree-agent-ac9deb765d59f5f59, WIP): P13 to P30 as tests (P15's plan, P21's two drops and P1's plan still open; P21 and P22 a new theme, "Close, not trapped"); the reader's trapped by what it takes to free a white, junk the wrong way up, a doomed white in column 10 given up; the hoist, the V's tip, the CC^1 buffer; the run: CC^8 better (chains 4.1 to 4.5), CC^1 more whites burned (0.5 to 0.9), CC^5's target 10 to 4 of 20 (to look at before merging); and P31 to P42 from the first 100 seconds, to judge. Full tests pass, but vitest exited 1 on an unhandled error to look into. **Done 14 Nov:** the mixed run split and fixed (CC^1 to CC^8 as on main or better, CC^5 one session short on its target), P1's plan seen through, merged and live; the CC^1 opening built but off, for the user to decide (it burned more whites); P15's plan and P21's two drops still open; the exit 1 is the known onTaskUpdate timeout.
  - Next after them: the race plan on the parchment chart (the course is now the bay's).
- **Dachimpy's museum: the order, the missing versions, and their voice (14 Nov):** after walking round it.
  - **Their voice, too dry:** "what makes it a bit cringy is when the pirate's line says, still warm ...
    usually it should be more like, yay, cookies, and kind of an excited reaction. I think that kind of buzzy,
    excited, great energy, I think is much more me." The hug "a bit cringy, but then again, that's also partly
    the idea". So every line of Dachimpy's goes buzzy and excited ("Yay, cookies!"), not wry.
    Then: keep the wry lines ("people say it fits me still"), "but maybe do the excited reaction first as well. We
    can have both." The rest: "Maybe we just need to experiment with it ... I think what you said all makes sense."
  - **The order, as it really happened** (the user's own telling; to confirm the unclear bits): the raw HTML
    website first ("I thought I copy pasted you the pictures of just the kind of raw HTML website. Like that was
    supposed to be the first one"); then the first Flash try ("wasn't even a prototype ... just the first time
    I'm trying to do something with Flash"); the two before-Whirled boards ("certainly the prototype"); the
    SmartFox set-up screen ("that wasn't even a wireframe, that is just the first version"); the lobby with
    Team One next; then the more refined Blockade Sim lobby (its artwork paid for, as below); "Create your
    game" is Whirled's lobby ("definitely when you get to [Whirled]"); then "that orangey one, and then the one
    with a nicer background comes after that" (which pictures, to pin down); the finished thing in play last
    ("looks about right"). The hand-cut sloop pictures were the earlier versions, before someone pointed out the
    game's own files had the assets ("after all that time scraping ... I didn't need to go through all of that
    pain").
  - **The banner and the title card's story:** "somebody, I regretfully forget who, ... kindly donated some
    money to help me do a [guide], and I spent the money, I think, on that banner", someone to do the art for
    the splash screen and banner, and cutting out the sloop pictures for the first Blockade thing ("some of the
    100 quid"). They sit where that happened, not first in the hall ("quite far in" as they are).
  - **Missing: Dachimpy.com's versions** ("it's missing all the versions of dachimpi.com. Like, what happened to
    all of those?") and **Shooting Dalnoth in each** ("Each version requires some variation of shooting
    [Dalnoth] ... I think we were just blockading against them at the time, and then it's become tradition").
    Not left out on purpose: the site's screenshots pasted on 11 Nov never reached the disk, so the museum had
    only the twelve in `notes/museum/`. The site itself is on the user's NAS (`\nas-pears\Projects\Dachimpy.com\
    Dachimpy.com`: v1, the raw HTML Bnav Guide with its practice boards and "Dalnoth traversing the board"; v2;
    v3 with its banner, logo and Primates Rule's pictures; v4 and the latest, with Shoot Dalnoth's picture and
    its Flash app). Real name, e-mail and forum handle cropped out of anything shown, as before.
  - The cookie's fine as it is (on the table).
  - **"Did you know?", not "not brave enough" (14 Nov):** "I wasn't quite brave enough to do what [Dlonelyone]
    did. I don't think that's a representation of me ... I wanted to do that, but it wasn't a good fit for me.
    So this is what I did instead." Teaching out loud wasn't their fit; Dachimpy.com was their way of helping.
  - **"Monkey Couple" looks awful (14 Nov):** "we definitely need to do work improving the monkey couple ... it's
    not even appropriate to put into here the words of what that looks like other than, oh my God, what is
    that?" Dachimpy's dress for it is a sash for a top (likely a bare chest with a sash) and the monkey placed by
    the familiar slot. The real portrait (Meridian, 5 Jan 2007): the two in matching red, a shirt and trousers, a
    gold buckle, white boots, each with a monkey on the shoulder, on a beach. Redo it to that, and look at it close
    up before it's shown.
    Then: "I can't even see the blonde hair of [Sanne]. It just looks really wrong ... I'm pretty sure I've never
    had long hair. And just everything just looks really wrong, like badly wrong. Quality and fidelity, everything
    just really needs fixing." So the friends' portraits as a whole, drawn far closer to the real ones: Dachimpy
    never with long hair, each friend's hair and colours as in their real portraits.
  - **Done 14 Nov** (branch worktree-agent-a10095a7cebbed134): the order as told (src/den-dachimpy.ts's EXHIBITS),
    the banner, title card and sloops moved to a page on the donation; Dachimpy.com's versions found in the old
    site's archive (its own screenshots of versions one to five, and its pictures), the last version's home page
    and Shoot Dalnoth page rebuilt from its own templates; Shoot Dalnoth in the first version (and Dalnoth
    traversing the board) and the last. Every line excited first, the wry after. "Did you know?" without the
    bravery (the user: "it wasn't a good fit for me. So this is what I did instead"). Privacy: version three's,
    four's (Twitter) and five's other names blanked. Still to pin down: "the orangey one, then the one with a
    nicer background" (no two such screens in the archive: the Team One lobby's orange bars and the sky lobby are
    the likeliest; a second sky lobby, `SetupScreenSecondVersion`, is in the archive, not shown); and the site's
    versions two to five had no Shoot Dalnoth in what was kept.
  - **The friends' portraits (14 Nov):** "Monkey Couple" "oh my God, what is that?", "I'm pretty sure I've never
    had long hair", "Quality and fidelity, everything just really needs fixing"; then: "I like how blocky people
    are ... but I think things like hair and clothing need more", as Tzz and Helium got, "a bit higher quality than
    Playmobil". **Done 14 Nov:** each dressed as the real portrait (yoweb, both oceans), painted close in bigger
    frames; short, long, tied-back and wavy hair and the beehive wig laid in strands, streaked; plain shirts and
    shirts with belt open at the neck with collar points and buttons; the sash knotted, its ends hanging. Left
    for a follow-up: curly, bun, braids still balls and spheres (Kikkit's curls read well enough).
- **Distilling's late game, and the CC^1 bot starting too far right (14 Nov):** a position to keep as a test (two
  blacks stuck in the target column, `notes/distilling/48-*`); the bot to plan the late game's channels, whites
  going right through a black channel or a brown one then a black one into the target (DISTILLING.md, "The late
  game: whites go right"); and the first target started further left, "a person would not be wanting to put
  themselves under so much pressure".
  - **Done 14 Nov (branch, not merged):** P43 kept and judged, the channel built and on (better for CC^3, CC^5 and CC^8,
    CC^1 even, CC^2 3.4 to 3.7 chains on 40 fresh boards, a few more whites burned there to watch); the first target further left built as
    `P.FIRST_AT`, off: it burned more whites in CC^1, CC^2 and CC^8. The user to decide.
- **A welcome page tying the tutorials together: "what are you here for?" (14 Nov):** "some kind of a page that
  starts tying together like the tutorial side of this ... when you come in, you should be ... given the option of
  ... what are you here for?" The choices: "just having a bit of fun and a look around" (the den); "I want to try
  some interesting new concepts" (the race and the rest); "I want to look at the new tutorials", shown by puzzle,
  for now Sailing and Distilling, noted as proofs of concept; and "I just want to practice a puzzle", answered
  plainly: "That's not really the goal here. I'm a tutorial website, not a puzzle practice." For each tutorial "a
  nice graphical link to either the animated 3D guided version or the 2D version", explained at the start: "we
  have a nice fun version. They help play alongside you and give you the situations and such ... there are static
  versions of everything for those that prefer it." (Sailing has no read version yet: Tzz's is still to do.)
  The front page (14 Nov): "Yes, make it the front ... the carpentry primer ... you can completely move aside.
  Maybe that can come under the tutorials because that still has some relevance until we have something that
  supersedes it. Just that it's a bit of fun for carpentry ... it just needs to move away from being the front and
  center." Started 14 Nov.
  And the test pages at the foot (14 Nov): "I don't want them to be like guiding people there, but I want some way of
  easily getting back to them just from the home page ... a link at the bottom to here are a few test pages, mostly
  for me, but ... if you want to see distilling being played at high speed, or the distilling setups that the
  tutorials have been trained on, that's all here."
  And practice (14 Nov): "if they want to practice a puzzle, then fine. We've got a few here that you can go practice
  in the fun [den]. But I'll put a link to where there's a bunch of practice puzzles ... I don't want to compete with
  it. It's what if you just want 2D practice? Here you go." Puzzle Practice: https://puzzle-practice.github.io/Puzzle_Practice/#/
  And real people (14 Nov): "if they want a friendly community full of people ready to help them and have fun on the
  game or watch some real people and have a real interaction ... here is the link to the Trophy Hunters Discord
  page, which I think is the go-to." https://discord.gg/XtRHwP6XT
  And Dachimpy at the door (14 Nov): "put my little pink character in ... Obviously, I need to welcome you to the
  site. Like, would you like a cookie? That'd be hilarious."
  And at a glance (14 Nov): "I want things to be quick and discoverable ... they should at least maybe pick one or
  two things ... a specific teaser of, like, go play [Mischievious's] wedding or the [sloop] race, the distilling
  ... give a sample of some of the things ... easy, scroll to view ... you can go into a section to see more, but it
  should at least show you some of the things at a glance without you having to click and interact."
  And no word block (14 Nov): "I don't like that opening thing of like know the basics or everything [is a] proof
  [of] concept. That's too much of a word block. I don't want a word block for the first thing people see on my
  site." The positioning lives in design.html; the front page opens with Dachimpy's welcome and pictures.
  Then (14 Nov): a collage of a few things in each area; rowing in the new concepts; not "the new tutorials" but
  "try out some new tutorials", "these are just experiments at the moment"; the three outside things (the Global
  Cade Sim, Puzzle Practice, the Discord) plainly outside this site; and credit: "[AMH] created the new [Global
  Cade Sim] ... I just don't want any hint of like for both of that and the practice puzzles, any hint like I'm
  trying to take credit for them in any way, even by omission."
  Then (14 Nov): high level: the sloop race one item, the race watched, the course editor and the starlit door its
  sub-things; the primer just "Carpentry", not "where it all started"; the external links one quick section near the
  start, never repeated; no "successor" line for the Cade Sim; Puzzle Practice not called "2D", and nobody pointed
  to practising in the den ("that is not what the point of this was").
  The outside three stay top-level choices (14 Nov): "They're still high level concepts. I just want to make it
  clear that they are elsewhere ... a different line with some kind of subheading to show they're elsewhere."
  And YPPedia among them (14 Nov): "links to like the [YPPedia] in here as well ... that certainly has the good
  guides and things on there. Or info on basic mechanics." Added the same day.
- **The front page as the launch pad, and what the den is for (14 Nov):** below "what are you here for?", the
  changelog's link and a way to "jump to specific places ... then we could get rid of the cheats menu and we can
  have this as a launch pad into that." And a short, light section on the den's goals: "you want your own adventure
  ... or room ... the bigger islands ... need to have some mechanic or new tutorial or ... real longer adventure ...
  But we also can do the smaller things, just like if you've got a nice little person or just want to show off,
  have a nice 3D thing in your gallery ... find me on Discord ... send me a link to your pirate page, and we can put
  a little room for you together ... I just need a feel for your personality ... I want this to be a fun,
  discoverable place." Gravee's house (the vampire, the portraits) the bigger kind, Roobear's "just a bit of fun".
  "I like things to be meaningful and funny, like ideally in a mechanical sense ... who knows, this could be a
  proposal in a game ... most of ... this is just kind of going to be a dud, but ... there might be that one thing
  that leads to something really fun, like ... the [sloop] races."
  Then (14 Nov): "when I say most ideas will be duds, it's like I'm talking about my ideas, not their ideas. And
  [Gravee's] is definitely not a small room. That was a big gallery concept and a fun mechanic ... that just feels
  demeaning ... Just show the more positive aspect, please."
- **Race online and crew play off the den's main menu (14 Nov):** "some of those buttons on the menu need to be a
  bit more contextual ... race online, play with the crew. I don't think anybody's really cared so far, so I don't
  want them as prominent menu positions if nobody cares." They stay, reachable where they belong (racing online
  from the race's start, the crew where crews are), not up front. The feedback so far: people care about
  "tutorials that are actually in demand, like werewolves"; the den is "cute and a bit of fun ... a bit of a goof";
  "the [sloop] races is a thing, I think, with more potential."
- **The Global Cade Sim in the museum, with a link (14 Nov):** "Need the new cade sim referenced too:
  https://www.globalcadesim.com/#/lobby/36 Absolutely deserves a link. Not the best picture but a placeholder for now,
  if I ever update it." The user's screenshot (Dachimpy sailing it against a bot, flags, whirlpools, winds) as its
  exhibit after "And Then", its plaque and Dachimpy's line, and the link from the close view; also linked from the
  front page's practice choice, for blockade practice. The picture didn't reach the disk: the user to save the file.
  Then: the link is what deserves prominence, on the front page, its own "what are you here for?" choice: "if you want
  to go play the new blockade sim made by [its maker]": AMH (the user, 14 Nov). The museum's picture can wait:
  "I'm going to go at least do a better picture of it ... a bit more justice to get into the midst of things."
- **Tutorials you can jump into anywhere: the read guides' sticky nav, and Helium asking what you want (14 Nov):**
  "each part should be discoverable, which is obviously what the 2D thing I think does a lot better, but certainly
  should be at the top of the 2D thing of like your basic jump to basic mechanics, and everything should have a nice
  sticky nav at the top ... where it goes through like some basic tricks ... whatever the sections are organized as
  ... we put a lot of effort into ... the different strategies and phases ... especially in the animated version
  where it can show you and help you. But I don't feel like it's very discoverable at the moment ... somebody might
  not care about showing me basics of how to do a crystal clear one. They may be struggling with the end game and
  wanting help with that part." So:
  - **The read guides** (Distilling's now, every later one): a sticky nav at the top, jumping to the basic
    mechanics, the phases, the tricks, however each guide's sections are organised.
  - **The animated lessons** (Helium's first): not a chatbot ("they kind of annoy me"), but a choice at the start,
    in the teacher's voice: "Would you like me to start you [with] the basics? Would you like help with the early or
    mid game? Are you trying to get your CC higher?", the end game too; then, for that part, a list of its
    scenarios to be shown, or the individual tricks, to pick from ("a drop down of like, here are the scenario[s]
    ... Are you wanting the individual tricks?"). Each a short lesson on a real board, as the lesson is now.
  - **One standard structure for every puzzle (14 Nov):** "whatever structure we come up with ... should be a standard
    generic thing. Like ... jump to this, let me show you this trick. Let me show you this phase. Like, those are
    general concepts that we'll cover across all puzzles. So having some standard structure would be great." So a
    shared tutorial module, knowing nothing of any puzzle: a tutorial's parts (the basics, its phases, its tricks,
    its scenarios), the choice at the start, the lists to pick from, the read guide's sticky nav, all drawn from one
    description each puzzle fills in; Distilling's first, Sailing's next with the same shape.
- **Dachimpy's friends' room: everyone's special; Daquan in the middle (14 Nov):** "I'm feeling a bit bad about
  having a few people in my house that are labelled as the special ones, because everybody's special. Like, I feel
  like they should have a prominent central position, but ... many of the other people that are there are special
  as well. [Daquan] definitely needs a more prominent special position. He was my partner in crime through the
  whole thing. But yeah, other people like [Gravee] and [Balloffire], people that I just vaguely remember, like
  [Mems], there was the Hunter crew that I was in. Is it Aurora? ... So there are many names of people like that I
  blockaded with, but they keep changing their names, and I can't remember who they are. So they're here. That
  needs to get rid." So: the "Truly special" sign and every "truly special" line go; the middle of the wall stays for
  the closest (Kikkit, Zizzy, Sanne) with Daquan there too, prominent, "partner in crime"; Gravee and Balloffire on
  the wall; and a page for everyone else: Mems, the Hunter crew (its name, Aurora?, to check), and all the
  blockaders whose names have changed, "they're here". Daquan's look (he) from his pirate page and his portraits
  with Dachimpy; Balloffire's (she) and Mems's (they, not known) before they're drawn.
  More names for that page (14 Nov): "is it Seatner? There's like Kenchio on Hunter. I mean, not really my close"
  (spellings to check). And the trinkets: "I need to go take a bunch of screenshots ... of all my trinkets because
  they all need to go in here" (the user's screenshots to come; the shelf's stand-ins until then).
  And Whiterose (she), from Viridian (now Meridian), a place of her own: "she was so incredible. The one pirate you could really
  trust to care about the life of the game instead of taking the most powerful side, she would switch from Vanguard
  and play the other side, will always remember that ❤️ miss you whiterose!"
- **Every dye in the wardrobe, and a list of them (14 Nov):** Fable is asking about her periwinkle colour (the den
  has no periwinkle). "Are you able to check that we've definitely got full coverage of all the colours? Look at
  Fable on Meridian ... Is that a purple? ... people are going to be sad if they can't completely recreate their
  pirate. So there needs to be a list somewhere." So every Puzzle Pirates clothing colour (YPPedia's Clothing
  palette, the limited editions too) in the wardrobe, each sampled from a real portrait where the wiki's swatch is
  off, Fable's checked on Meridian; and a public list of them all.
- **The looks' code laid out so anyone can add a piece (14 Nov):** "it's not very obvious at all where the source
  stuff is for all of the graphics ... I was expecting like there to be a folder somewhere that's got kind of the
  code for drawing each item and little components, each of the colors and rendering, or like the different
  hairstyles being a lot more modular and broken down so that if people wanted to contribute, they could just like
  plug in something for that, or like furniture, like [what] Fable wants to do." Today the whole wardrobe (every
  hairstyle, garment, hat, familiar and colour) is one long file, js/den-look.js, and every piece of furniture
  another, js/den/furniture.js. So a folder of small pieces, one file each: hairstyles, garments, hats, familiars,
  furniture, the colours (started 14 Nov: the palette as its own module), each piece registered by name, with a
  short guide (CONTRIBUTING.md) on adding one and a test page to see it on its own.
  And the pictures by whose they are (14 Nov): "it feels a bit weird that museum is in the top level for the images
  ... that's just a feature related to essentially a house ... like houses, and then [Dachimpy], and then ...
  [museum]. But ... you should have similar for anyone else who has specific images for their house." **Done 14
  Nov:** the museum's pictures moved to houses/dachimpy/museum/; any other house's own pictures go in houses/<host>/.
  And catalogue pages to see every piece (14 Nov): "if this is going to support her helping with things ... she's
  going to need some kind of less technical way of viewing them ... a list of here are all the colors that are
  configurable. Here's a list of all the furniture and kind of what they look like, a list of each of the hairstyles
  and such, and ... a rendering of each ... something for them to work with and then be able to give critique and
  feedback on ... It's partly documentation, but also a test page." So a catalogue page for each kind of piece,
  each drawn from the same registry the den uses (so a new piece shows there by itself): colours (started 14 Nov,
  catalogue-colours.html), then furniture, hairstyles, clothes and familiars, each rendered.
  The colours page with a scene beside it (14 Nov): "some test scene on the right ... a selection of distinct
  furniture and a few pirates that are kind of spinning around, maybe through different outfits that end up being
  dressed in the colour that you've selected."
  And the "Your pirate" wardrobe itself (14 Nov): "could really do with an upgrade as well ... some of the things is
  fine, [the] tongue out, yes, no ... but ... if you've got like so many different hairstyles, scrolling through a
  list doesn't feel like it's enough ... a two-column thing. So on the right, if you're choosing your beard, you can
  see all of them with a preview of what each looks like, especially with things like that and the colors
  selection ... the names of the colors next to them ... people are going to know things by name as well, because
  they're used to coming from Puzzle Pirates." So: the yes/no toggles stay simple; for anything with many choices
  (hair, beards, hats, clothes, familiars, colours), a list of names on one side and a grid of previews of each
  on the other, every colour shown with its Puzzle Pirates name; the previews drawn by the same registry as the
  catalogue pages.
- **Cookies in hand, and the cookie handed over for real (14 Nov):** "for my character as well ... can we add to the
  list of in-hand things, we need cookies. Obviously that fits with my welcome scene as well ... cookies need to
  actually be an animation in there." So a plate of cookies (and a single cookie) among the wardrobe's things in
  hand, Dachimpy's default; and at the house's door, after the hug, the cookie actually changes hands: the plate
  held out, you reach and take one, it's in your hand, you munch it (crumbs), then on to the museum.
  **Every prop from a cutscene, in hand too (14 Nov):** "check the various animations, because ... anything ...
  that's been in a cutscene should be an item." So go through every cutscene and little scene for what anyone
  holds (Gravee's paintbrush, Tzz's balloon animals, Dachimpy's cookies, and the rest), and each becomes a thing
  in hand in the wardrobe, drawn by the same piece the scene uses.

- **The front page: the banner back, a natural intro, a sticky menu (14 Nov):** "I'm liking the what is this place
  thing a bit better ... it just feels very, well, AI. There's nothing natural about how that's done. It feels more
  like my notes than an introduction." So "What is this place?" opened reads as a few plain, friendly sentences, no
  bold labels. "Don't say not part of this site each ... saying elsewhere made by others is enough." "I definitely
  need a sticky navigation menu." And "my beloved banner and monkey ... Where's my monkey banner?": the old
  Dachimpy.com banner, the monkey with the map, back at the top. Puzzle Practice is made by Jice, not "the Puzzle
  Practice team". (Loved as it is: jumping straight to a place, the little things, the houses.)

- **Helium's rum run: Port Decorum as a quest, turned away at the front first (14 Nov):** "there should be a bit
  more of a visible show of ... more of a hint, even in the dialogue ... It should appear more like a quest. Like,
  first of all, it sends you just to Port Decorum, and then it's like, oh, yeah, they're not happy ... You try to
  deliver to the front at first, and then it gives you that ... cutscene of, oh, this is not for pirates or
  something. So you then get the quest of, find a back way around ... it gives you more of a hint that it's for the
  back beach." So the run sends you to Port Decorum plainly; at its jetty the guards turn the rum away, a little
  scene; then a new quest, find a back way round, Helium's lines hinting at a quiet beach behind its rocks and the
  way there; delivered at the smugglers' beach.

- **A marker where Space does something, everywhere (14 Nov):** at Kikkit's island on the rum run: "I eventually
  managed to throw her a barrel. But it took me a few places ... there's lots of spaces adjacent to [her] Island
  that are at the front ... If there's only one square, because that works for the animation, then there should be
  a better visual indication of it." And "always make that a generic thing ... this is like a quest or target ...
  you can do that for anything, even if it's just for interacting with the tutorial, it should be clear ... on the
  wedding island, she's on a little jetty. You could have a little flashing next to it ... a visual indication of
  where the starting point is. Like, I've just found ... the space [for] Mischievious first time because I went next
  to the jetty." So one shared marker (a pulsing ring on the water, or on the ground) on the exact square where
  Space starts something: every quest's next stop, every place's starting point, tutorials too.
- **The winds round the imperial gate, going backwards (14 Nov):** "It's accidental, actually, but I love that ...
  you can get around the Imperial Gate if you're going backwards by going through the winds. It's a shame that it
  ends up pointing at a rock that you then have to bump off. That's a bit weird." So keep the way round, but where
  the winds leave her she shouldn't be pointed straight at a rock (to pin down which wind with the user).

- **Every adventure ends with something to keep (14 Nov):** "if you any little adventure that you complete, there
  should be some meaningful reward, even if it's a small token thing like a visible persistent change to the map, a
  creature that carries along, or some furniture, some visual representation that you've completed that quest. Like
  Kikkit going to live with the penguins." First, Helium's rum run: "it just seems a bit anticlimactic at the end
  ... it needs some little token thing, like, do you get a barrel of rum? ... some barrels of rum to decorate the den
  or something." So Helium hands you a few barrels of rum at the end, and they're at the den for good (as Umami
  stays with you after his quest). Then every other adventure checked for its keepsake; Kikkit's ending (moving to
  Vegas Island, the penguins' island) is still to build. (RULES.md, "Every adventure ends with something to keep".)
- **Sailing: booching at the top too easy (14 Nov):** "when I'm doing the sailing puzzle, it just feels really easy
  to booch on the top. Like, it drops a bit too quickly. It feels very unforgiving when I'm trying to maximize the
  space at the top. It's not fun to booch ... maybe ... just be a bit slower when you're one tile away from
  booching." So the falling pair slows when it's a tile from booching. And "when I rotate things, they do still
  seem to jump up further than the visual position would indicate. So I don't know if there's something a bit off
  about that": turning the pair shouldn't lift it above where it's drawn falling (to check against the drawing).
- **Helium's corner, one way in and one way out (14 Nov):** on the rum run, sailing for the back beach for the
  first time: "If you want to get to Helium's hideout, you have to do a 90-degree turn by rowing, because there's
  no way of bumping yourself there. I really like that ... I think that should be the only way of getting to
  Helium's little corner ... But there should be a wind still so that you can get from his den to the front of
  where the Imperial Fort is. So it kind of becomes a one-way thing of getting back out." So the smugglers' cove
  reached only by that rowed turn, and a wind out of it carrying her round to the front of Port Decorum. Also "am I
  supposed to be able to get to his by just doing a double instead of a Vegas over here?" (which spot, to pin down
  with the user). And at Vegas Island "nothing happened with the penguins": they're a find for now; Kikkit's ending
  there is still to build.
- **The front page's banner redrawn, and a rose purple theme (14 Nov):** of the old Dachimpy.com banner put back:
  "I wanted it done a bit better though, like design it so that it fits. I like the general look of the site, that's
  just obviously does not fit, but do something that is inspired by it but fits with the colour scheme." So a banner
  inspired by it (the monkey, the map's dotted trail, the X, the sea and a ship) drawn in the site's own look. And
  "it would be good to be able to experiment with the color theme of the website ... I like my kind of rose purple
  kind of theme ... not in a glaring way, but at least there's like the call for actions following that theme and
  something neutral for the rest." So the buttons and links in Dachimpy's rose and purple, the rest neutral, the
  colours in one place to try other themes.

- **Dachimpy's museum: the hall, clusters, and Tim DC (14 Nov):** "Why have I got the 'Did you know' bit? But it's
  lost all of the things each side of it." (The banner and the title card that hung either side of it moved into the
  museum's order this morning, leaving it alone on the hall's wall.) "I'm loving the order of the pictures ... I
  think maybe some of them need to be clustered together a bit. Like I love the HTML one, but then the shoot
  [Dalnoth] ... Those next three are kind of grouped together, and then the Smart Fox ones all kind of grouped. And
  the [Whirled] ones, and then a bit of those technical drawings." So the museum's pictures hang in clusters, a
  bigger gap between groups than within one, the order kept. And "Tim DC. He absolutely needs a picture and
  mentioning as somebody that helped me with the early blockades, and he did all the animation code. He absolutely
  needs a mention as being an amazing guy that was a core contributor." So Tim DC in the museum, by the Blockade
  Simulator, a picture of him and a plaque crediting him (pirate name, look checked on his pirate page first).

- **The front page's sticky menu out of order (14 Nov):** "why is the sticky menu in a different order than they
  actually appear on the page? That's really off-putting." Elsewhere was fourth in the menu but first on the page.
  Done: the menu follows the page, and a test keeps it that way.

- **What's new: the little houses too big (14 Nov):** "me and my museum ... they're the small features, they're
  special to me, but wow, you should not be having 3 giant pictures ... the front page is a much more important
  feature." Done: Dachimpy's house and Roobear's ROOm are smaller updates, one thumbnail each; the front page is the
  day's big entry.

- **Tim DC's pirate name (14 Nov):** no picture needed after all, perhaps: "I guess it should just be like ... Tim DC,
  what his pirate name was. I think he was Hunter, maybe?" To pin down with the user before his mention goes in.

- **The front page's colours: rose at the top, calmer below (14 Nov):** looking at the rose and purple theme:
  "it looks quite decent", but "it just feels like everything is in pink ... there's just too much pink and purple.
  Like, it's great in places, like the banner looks amazing, ... the play the den call to action, and maybe the
  outlined top thing, but then I feel like once you get below that in the hierarchy, it feels like it needs to get a
  little bit more neutral, not massively off." Professional sites (Bun, Twitch, Stripe, Evervault) keep their accent
  for the top level and fall back to neutral for the secondary things. And the banner's monkey: "my monkeys don't
  have hats", so no cap. Shown to the user before it's committed.

- **A theme picker on the front page (14 Nov):** "there should be like a theme picker in the top right ... to change
  to the black gold thing if people don't like the pink, purple or blue theme, you know, the usual kind of just theme
  pick ... dark gold, black gold, blue, that kind of thing." So a few themes to pick from at the top right, the
  choice remembered in this browser, each kept readable (the front page's contrast test covers every theme).

- **The secondary buttons drown out Play the den (14 Nov):** "it's certainly those secondary call to action things
  ... that get drowned out. Like the call to action play the den really doesn't work with those light pink buttons
  next to it. It loses its rarity. Even if the others are a step down, some of the contrast seems lost." So Play the
  den the one filled rose button on the page; the others (What's new, How it's designed, Into the den) neutral, a
  touch of the theme only on hover.

- **The front page without the cookie welcome (14 Nov):** "it just works a bit better without me having the hello,
  here's cookies thing. That maybe fits better in the den, because it creates a lot of dead space and misses the key
  point. It's distracting from the key purpose of the homepage." So the front page goes straight from the title to
  "What are you here for?" and its choices; "What is this place?" stays, tucked under the title. Dachimpy's hello
  and cookie lines kept for the den.

- **The front page crams too much into the top (14 Nov):** "it's the wordiness of ... that Meet the Discord one
  that's making those really off ... I don't know if it's kind of like each of those three big things at the top of
  what are you here for? [are] almost enough, and that's adding to that visual overwhelm. Is there's a lot being
  crammed into a small area instead of gradually discovering it. Even if I like immediate visualness, it's
  overwhelming." So the three choices alone at the top, with room round them; Elsewhere moved further down as a
  compact list, a line each.
  Still refining (14 Nov, after it went live as "a step forward"): "one of the most similar one is Twitch ...
  [Evervault's] a lot calmer looking, but they've got less to talk about ... I do like this Stripe Docs a bit ...
  how the menu is not as overwhelming. Obviously, all different use cases, so we've got to pick the one that really
  fits ours, but I'd like to get some good compromise." So: Twitch the nearest model for how much there is to show,
  with Evervault's calm and Stripe docs' quieter menu as the pull. The screenshots compared are in notes/theme/ on
  this machine (not committed).

- **The front page's top trimmed: one bar, no odd heading, the choices one at a time? (14 Nov):** "there's quite a
  bit to trim, like the bit where it's got the pirate den. What is that there for? Are we able to get the menu into
  one row and trim that somehow? Like, you got what's new twice. And do we really need to open up with new concepts
  and things when they are the first things being shown on the page underneath it?" And "What are you here for?":
  "conceptually, yes, but as text, no." And "do each of those things want to be three side by side? What does it
  look like if they're each full width, so that it makes it so you're looking at one thing at a time?" So one bar:
  the den's name, a few links (no repeats, not the three the choices already show) and Play the den; no heading
  over the choices; and the choices shown both ways, side by side and full width, for the user to pick.

- **The choices full width, their pictures captioned; the bar trimmed again (14 Nov):** of full width, one at a
  time: "B needs some refinement, but it definitely has the better kind of feel ... the pictures are kind of cropped
  and distorted a bit weirdly. So if anything, ... subtitle text pictures or something like that." And the bar: "do
  we need that top menu ... maybe ... places, what's new, and [the] call to the den, but ... how it's designed, does
  that really need a menu item ... hierarchically quite close to ... the test pages ... down the bottom. ... Same with
  elsewhere ... that really trims down the menus." So each choice full width, its pictures whole (16:9) with a
  caption under each; the bar just Places, What's new and Play the den; How it's designed linked at the foot.

- **The front page's choices reordered, Kikkit first (14 Nov):** "obviously a few new concepts. One is exciting, and
  then the tutorials ... the bit of fun just needs to be third." And in it: "Mischievous's wedding I definitely
  don't want first ... I want Kick It first, because it's important. Like, Kick It can be the half-width one, and
  then Grave[e] and ... I want Umami the Capybara. I really like that one over the Weddings." So the choices (and
  their sections below) in the order new concepts, tutorials, a bit of fun; each card's first picture big, the
  other two beside it; a bit of fun's Kikkit, then Gravee's gallery, then Umami.

- **Teaser shots as Dachimpy, no spouse (14 Nov):** "For the umami, the capybara one, don't do a screenshot with a
  spouse, just do it with like me configured in my kind of pink wig and things, maybe rescuing him. I just want that
  to be more neutral. Same with approaching Kick It['s] Island. I want that me in my style ... put that as the
  default for anything we're testing now." So `?as=dachimpy` dresses you as Dachimpy for the visit (your own look
  kept, nobody married), every screenshot taken that way; Umami's and Kikkit's pictures retaken.

- **The banner says what it is; the bar just two links and Play; the pictures even (14 Nov):** "I don't know why we
  have the pirate den part there. It's just a title for the sake of it ... The banner already has the. I feel like
  you just need to change the banner to have something better, like the [Dachimpy's] Pirate Den or something, and
  then just have those two links. And the Play the Den on the right. Maybe a bit bigger for Play the Den." And the
  big first picture: "look at how other sites do this ... they just have it three side by side, having different
  heights ... for the pictures is very jarring." So the banner reads "Dachimpy's Pirate Den", the bar Places, What's
  new and a bigger Play the den, and each choice's three pictures the same size side by side.
  Then, of the phone banner losing its sloop: "we definitely need the sloop in the banner. Don't make the text too
  big. That one with the sloop is fine. Not when it's bigger ... ideally you would just make the text a bit smaller
  or something, but I'd like the sloop on mobile." So on a phone the wordmark is smaller and the sloop is back,
  sailing in after it.

- **One action point, not a grid of them (14 Nov):** off Mischievious's island, "what are all those circles ...
  there should not be a huge grid of them, there should be one action point, not 9." Every square of a landing
  had its own gold ring. So each place where Space does something shows one ring, wherever it is (the Wedding
  Isle, the rum run's stops), though Space still works anywhere round it.

- **The front page's pictures one under another on a phone (14 Nov):** "it should certainly be three columns on
  when it's bigger, but yeah, for phone, just make it single column ... each of the new concept ideas should be
  underneath, collapse underneath each other." So three side by side on a wider screen, one a row on a phone.

- **The front page's tutorials too wordy; Carpentry's picture dull (14 Nov):** "when you start getting to the
  tutorials part of the page, it gets far too wordy again"; and Carpentry's picture "is not very interesting. It
  should show at least a [which] picture fits, or ... the thing where it says like what solves this hole, or the
  gambling ... something more visually interesting than the page that was picked." So fewer words there, and a
  Carpentry shot of a puzzle being played.

- **"A room of your own" a wall of text (14 Nov):** "Again, wall of text. Make it a tiny fraction of the word count,
  like a third." So Dachimpy's lines there cut to three short ones.

- **The den's loading screen (14 Nov):** "The loading experience really needs fixing. Like, again, use some of my
  kind of splash screen things, because that first loading screen just looks horrible." So the den loads behind
  the front page's banner look: the monkey, the dotted trail, the X and the sloop.

- **The Carpentry primer trimmed (14 Nov):** "there's a few bits that just aren't interesting. Like the voyage thing
  we've dropped, [Hole] of the Day we've dropped. Practice bets doesn't seem relevant, just have [the] Harbour table.
  I think that can really be trimmed down." So no voyage, Hole of the Day or practice table: a short landing page,
  Which pair fits? and Which gap? to earn doubloons, the harbour table to bet them, and the workshop. The front
  page's Carpentry picture is Which pair fits? now.

- **The new concepts just the race and rowing; a click shows you something (14 Nov):** "I don't think the starlit door
  really earns its place as a new concept that's within the sloop race. I think just the sloop race on its own ...
  that and rowing, which are the new conceptual things." And: "when I click it and then it gives me the options,
  like watch one, it's a bit confusing. Like, well, I clicked it, show me something already. But also, those links
  are tiny, especially on mobile." So each picture at the top goes straight to its thing, and the links under the
  sections are proper buttons, big enough to tap.

- **The den's splash from the old title card, not the banner (14 Nov):** "I think I dropped it in the museum pieces.
  There were two pieces at the same time, like one of which was like the tutorial splash screen that's got, yeah,
  more of a square look, so it's better for a splash than the banner is." So the loading splash is drawn from the
  old Dachimpy.com title card (the sea, big faint jigsaw pieces, the ship at the top right, the name in the middle),
  in the den's colours, as the banner was from the old header.

- **The banner's sloop always at the right (14 Nov):** "can we make sure the sloop's always aligned to the right?
  The sloop being pushed more to the left is irritating me." On a phone the sloop sat in the middle; it keeps to the
  right-hand end at every width.

- **The paused notice hidden behind the boards (14 Nov):** "I keep coming back and it keeps saying it's paused,
  but ... it's not on top, it's hidden behind the puzzling area. And luckily there's a tiny bit of the button
  visible." The paused notice goes over everything.

- **Get into the den quickly, on a phone too (14 Nov):** "I want people to get into it quick. I think it needs a
  lot of just UX optimization. Like, I can't move the camera around on the mobile to see the race. It doesn't
  automatically track or follow anything. Different orientations seem to hide too much or too little of different
  things. Like ... that top bar can take up like a third of the screen, and I can't really see or tell what's going
  on." So on a phone: the top bar small (or tucked away), the camera movable by touch, the race watched following
  someone by default, and each orientation showing the sea and what matters. For watching the race, done 14 Nov
  (RACE.md §10, "Watching on a phone"); the rest of the den on a phone still to go through.

- **Watching a racer shows her racing, not an idle board (14 Nov):** "even if I click on observe Kick It, why have
  I got a bunch of buttons and then there's a puzzle where nothing's happening? Like, the default, I would have
  thought, is you see ... them puzzling on deck and in the sails, so you can kind of observe ... you have that
  kind of nice observing version. That kind of solves this. How much can we fit on the screen at one time?" So
  following a racer shows her sloop, her puzzling on deck and on her sails, with her board small or out of the
  way, as much on the screen at once as fits. Done 14 Nov: small in the corner, a tap for big, no touch pad; and no
  board at all through the start's field, where she steers (it had sat idle there for most of a minute).

- **Sailing has an impact you can see (14 Nov, again; see "A rival's Sailing shows on her sails", 12 Nov):**
  "there's still no impact of sailing ... when you see, for example, Kikkit complete a single or a double as she's
  going along, you should visibly see the jump, the ship sparkle even a tiny bit and start moving faster. There's
  no impact visible at the moment." Each clear: a visible surge, a sparkle on her sails, more speed. Done 14 Nov,
  every racer's sloop, raced or watched: her bow lifting with spray, her sails glinting (a plain clear a little).

- **A watched racer's Sailing runs on its own, not in step with her moves (14 Nov):** "watching Kick-It ... her
  sailing puzzle, it seems almost in sync with the turns. It's like a piece drops fluidly, she puts it in place,
  and then it's like there's a pause waiting for the next turn ... this should be running relatively separately.
  Or is it having performance issues waiting on the rest of the things to all update?" Her pieces should keep
  coming at her own pace, not wait on the race's steps (to find out which it is). Found 14 Nov: not lag; each piece
  was steered down in a rush, then waited for the race's next drop. Now steered down steadily through the time.

- **Teach the sailing bots to build Vegases (14 Nov):** "her sailing is just extremely [poor]. She's building a
  giant combo of nothing. Though I do love that she got bopped by somebody, and you can see the little ... things
  like rotating around her head. That was cool. But ... got to actually start teaching some sailing so we can see
  her start building the Vegases, similar to how we've done the distilling training." So the Sailing bots trained
  as Distilling's were (techniques, positions to critique, tests), so a good sailor like Kikkit builds real chains
  and Vegases.

- **Phone-friendly as a key principle, on the design page (14 Nov):** "Make the kind of mobile first stuff like a
  key feature that's in somewhere in the chain ... maybe in the design page. Just that, you know, it's hard to make
  things mobile first, but trying to make things as mobile friendly that we can." So design.html says so, with a
  picture, and RULES.md holds it as a rule.

- **The watched race more varied, its bar compact (14 Nov):** "the bots aren't being very interesting ... everything
  just seems to be the long way ... somebody that does the foraging and the ... carpentry and the duty nav, maybe.
  That I think that would Umami would come in quite well, actually. I think [Gravee] is better as a side character.
  I don't feel like she's suited to the race part." And: "I love that you can click on the different people and see
  their different plans, see who's first, but ... that's still possible in a more compact, mobile-friendly layout
  ... I don't need something like ticking with the seconds." And the follow camera: "quite a far-out zoom ... as
  default. Though the wide one where you got the 4 [whirlpools] in it, that's fantastic." Done 14 Nov: Umami at the
  helm of his own sloop (the starlit door, the barrier, the crane), Gravee out, Dalnoth up the locks (nobody to
  forage for him); her plan kept on a phone as one compact row; no ticking clock; the camera nearer her on a phone
  held upright, as far back as before on a wide screen. Still to do: the starlit door's Duty Navigation drawn
  while you watch Umami at it (nothing's drawn there yet; the bar says what he's doing).

- **The puzzles' bots, trained and tested like Distilling's (14 Nov):** "for each of the puzzles, we want something
  similar to like those distilling tests with the bots." Each with a simulation of its own, numbers that say how
  it's doing, and positions to critique (as `distilling-positions.html`) where the user gives advice, each answer
  a test:
  - Sailing: from the lowest level, "just trying to clear [pieces] to get a bit of an extra boost", up to building
    Vegases (see "Teach the sailing bots to build Vegases", above).
  - Carpentry: "doing the easy fix holes and then gradually going up to the crane ones ... how many pieces does it
    take them on average?" The pieces are weighted in their favour, so it "will probably need to be artificially
    just slowed as to how many choices a minute" it makes.
  - Foraging: the same idea (and the user hasn't played Foraging in the race yet: "I need to test that").
  - Duty Navigation: "how many drops does it take them to clear the puzzle"; it needn't be really good, "as long as
    it has a little bit of visual interest if somebody's watching".
  - Gunnery: needn't be good, as long as you can see the process; "good enough to fill all four. How many guns does
    it manage to load? Does it fill all four? I hope it just doesn't get stuck." Perhaps "a freestyle bot and a
    looping bot".
  All of it feeding tutorials later, Gunnery's with Rapportus and Balloffire. "No reason not to have them on the
  to-do list and start at least doing some of the basics on those. I'm sure that will evolve over time."

- **Umami as a model you can play (14 Nov):** "when I say umami should take the place of [Gravee], I mean in the
  capybara form" (the watched race has him at his sloop's helm as the capybara). And more: "make it not just so the
  capybara is a pet, but as a model that, you know, you can actually run around with them as a pirate. Who knows,
  have they maybe dressed the capybara up in clothing? That would be so hilarious. Have it as a primary model ...
  Not if it's a huge project, but if it was easy enough to do." Done 14 Nov: a capybara is a body in the wardrobe
  ("Pirate": Male, Female, Capybara), Umami's own model walking the den at a trot; he wears any hat, a shirt or
  jacket over his front, a belt or sash, an eyepatch, earrings and a familiar on his back. Umami himself, in a
  captain's hat and jacket and a red sash: den.html?as=umami. Still to see: how he looks seated, rowing and at
  the helm (the den poses him as it does a pirate, his front legs as arms).
  And (14 Nov): "Umami needs to be in the portraits too as a friend": his portrait in Dachimpy's house (Hugs and
  Cookies), hung with the friends', painted as the capybara. Done 14 Nov: "Umami, Captain Capybara" in the friends'
  room, in his captain's hat and jacket.
  And (14 Nov), on playing as him: "That's hilarious. I think that needs a tiny thing in What's New is him playable
  as a character": a smaller update on What's new, a thumbnail of him walking the den in his hat. Done 14 Nov.
  And (14 Nov): "why does the capybara look like they've only got one eye?" His head sat a little to one side of
  his body, so one eye was buried in it. Done 14 Nov: his head square on, both eyes showing.

- **A race buoy's number by the den's gate (14 Nov):** "I'm at the den opening the door and I see a number 5 buoy
  style flag outside, just outside the gate. What has happened here?" A far buoy's number is drawn nearer so it
  always reads (12 Nov), and that ran on land too. Done 14 Nov: the buoys' numbers only while you're out at sea.

- **Umami's sloop turns the wrong way out of the barrier's gap, in the race (14 Nov):** watching the race, "[he] did
  the foraging thing, and then ended up coming out the wrong way. [He] ran right instead of left." Found: out of
  the barrier's gap onto leg 3 (which runs west), the simulation rejoins her to the long way where going round
  would have had her by then, five squares east of the gap's mouth (7.6 s), so she turns right, sails east, turns
  round and comes back. Every racer by the forage route does it; the rocks' gap the same (5.5 s back), the
  whirlpools' not. Two fixes tried, both moving the balance, so neither kept (the user's call, with the puzzles'
  timings below): out at the gap's mouth and on from there (the forage and rocks shortcuts a few seconds better,
  the gap-shot route then under its floor, and the simulation's savings no longer the helm's RACE.DECENT); or the
  same seconds spent nosing through the gap (the barrier then not worth a good player's while, against "the
  leader always has a shortcut worth taking"). The user, 14 Nov: "yeah, you should come out": out at the gap's
  mouth and on from there, rebalanced round it.

- **The plan's chart draws shortcuts as doubling back (14 Nov):** "if I hover over rocks, why is it showing an L
  shape? Like, well, there's no L shape. You just go straight up. I don't know why it's showing it as if you double
  back. The same with driftwood. The bribe looks a bit weird as well. Like, why is it a hook shape? I know it should
  be more like X marks the spot and then shows you where you cut through. Also, the shooting one as well. Like the
  line goes further up than just through the imperial outpost. Same as the run. I don't think the imperial gateway
  is that big. It's exaggerating it a bit. [Locks] is doing a bit of a weird L-shaped thing as well. And the
  triples gap." (Likely the same rejoin as the barrier's, above: each drawn to where the simulation rejoins her.)

- **Time the puzzles, the user playing them (14 Nov):** "the triple shortcut is so tiny. So is the crane one to a
  degree ... it feels like you're underestimating how long it takes to do those puzzles. Maybe it's worth me going
  through at some point and having that as a to-do thing of timing. Right, how long does it actually take me to
  complete a crane or a triple, even not that, or the guns for the shooting or the foraging or something, even just
  so you've got a bit of a comparison of how long each of these puzzles takes." The first leg looks well balanced
  to the user ("the long way is halfway around, there's a clear benefit to running it, bribing it"), and the sweep
  back to the left they like. A way to time each (a stopwatch on each stop's board in the den's race, written down)
  to make, then RACE.DECENT and SIM.PUZZLE checked against the user's times.

- **The Distilling guide trimmed to its best moves (14 Nov):** "I love how we've got the moves like the hook, pull a
  line of browns. But ... some of the moves are good for behind the scenes but need hiding. Like, with these arrows,
  I really can't even see what the crawl is. Those arrows are so confusing. [A] channel made for [a white] ... these
  are scenarios, not moves. Like, it's all just a bit noisy. It feels like you've got to, like, find the diamonds in
  the rough." The read version shows only the moves that teach well; the rest stay behind the scenes, for the bots;
  scenarios kept apart from moves.

- **A way home at the top of every page (14 Nov):** "we also need a easy way to get back to home on each of these
  other pages at the top."

- **The front page's colours through the whole site (14 Nov):** "the color theme and things need to carry on through
  the site. It's just on the homepage right now." The theme you pick on the front page, and its look, on every page.

- **No "Home, married" on the front page's places (14 Nov):** "why is there a cheat in a place like being at home and
  married? That's not really very interesting ... that's just like a bonus from the marriage thing. It's not really
  something I want to guide people to."

- **What's new shows the front page as it is now (14 Nov):** "The What's New page needs updating with the front page
  design": its front page entry still shows the first go (Dachimpy at the door with a cookie); the banner, the
  choices and the themes since.

- **Hugs and Cookies' entry doing justice to the opening (14 Nov):** "the [Dachimpy's house] Hugs and Cookies does
  not feel like it does justice for my Hugs and Cookies opening." Its What's new entry shows the museum wall, not
  the hug at the door and the cookie (to pin down with the user whether the opening itself wants more, too).

- **Umami among the friends' portraits (14 Nov):** "Umami needs to be in the portraits too as a friend" (with his
  capybara look, in the session making him a model you can play).

- **Helium's rum run on What's new, one picture (14 Nov):** "there's not too many pictures ... very thirsty, nothing
  suspicious. Like that picture looks fine. The first one makes it look like it's more about [Mischievious]." Its
  entry shows only the Port Decorum one. Done 14 Nov.

- **The Distilling guide's cut, agreed (14 Nov):** kept: the five one-drag tricks, the sweep, the diamond, turning the
  right side over ("maybe is okay"), the leapfrog, the hook and pulling a line of browns; the rules of thumb (never a
  white down the fire, the danger low by the fire first, nothing walled in) a section of their own. Behind the
  scenes: the crawl, the figure of eight, bringing a piece round, channels, finishing the junk column, saving the
  whites, storing the junk, the ladder, and the rest of the scenarios, "into the V" among them ("I'm not sure about
  the into the V one"). The user wasn't sure which the figure of eight and bringing a piece round were: to look at
  again with them. Done 14 Nov.

- **The race from its link, and the plan's chart readable (14 Nov):** "When I drop into [?at=race], surely that
  should be the first thing that appears. Oh, okay, if I actually hit space, it works. So if I try moving at all,
  there's no way to get back into the race. It's really annoying." And the chart: "why is on the full screen the
  plan so tiny and on the right-hand side? It's getting there, but it's ... a bit vague on the map ... Like weave,
  hop. Oh, there we go, it's kind of in tiny text above the locks, but again, this is why I wanted almost for like
  the 3D view to kind of jump to the thing as you click it so you can see what it is before you plan." So: the link
  puts you on the starting line; a way back in after sailing off; the chart big and its words readable; picking a
  choice shows it in 3D. Then What's new's race plan entry shows the chart. Done 14 Nov: `?at=race` straight on to the line; Space
  anywhere in the race's waters (by the buoy, sailed off, on the course) back to it; the chart's stylesheet, lost
  in a merge, put back (that was the tiny chart at the side) and its choices' words bigger; picking a choice on the
  line flies the camera to it for a few seconds, then the chart's back; What's new's entry shows both.

- **The wolf den tutorial, a first version (14 Nov):** "You were supposed to be doing the wolf den tutorial thing,
  build the building, the at least do a first version of it. I think I gave you enough as something to get started
  with." From IDEAS.md's "Dignity's tutorial: four-tier Duty Navigation in the werewolf den": the place and its
  hut with the star table, Dignity teaching, Multibella munching cookies, the den's wild slots and moon in
  Navigation's rules, a first lesson and its read version.

## Spotted along the way (not asked for)

- **Distilling's timing tests trip when the machine's busy (14 Nov):** in a full test run, "cheap enough to run on
  every move in the browser" (distill-path), a distill-ahead plan and a distill-bots game failed on time; run on
  their own, all three pass. Their limits could allow for a loaded machine, or they could be kept out of the full
  run's parallel batch.

- **The camera indoors:** walk into the shack and its near wall hides you. Fade it out then.
- **Your den's preview** shows your flag on every tab. The Shack tab could show the shack itself
  (painted as you choose), and the Den tab the landscape.
- **Wave sizes for a crew** may need retuning after the cannon change; only solo was tested.
- **Not checked yet:** the look and den messages between two real crewmates (only tried solo),
  and the shack on a narrow den (the left-hand crate could crowd its floor frames).
- **The tests exit with an error though every test passes (12 Nov):** vitest reports "Timeout calling
  onTaskUpdate" from a worker (twice in a full run) while agents run alongside on the same machine, so
  `npm test` exits 1. Find what holds a worker up (a long test without a break) or cap the workers.
- **Changing the race plan while held at the gate (13 Nov):** in the browser, a plan changed mid-race while she was held facing into the gate for the Quad, and a Sailing gust then carried her straight through the gate without paying or shooting. Changing the plan at a stop should let her go from it cleanly, not leave her lined up and sent through. **Done 13 Nov:** a gust only carries her into a way through that's the one she's in, or the one she's going for and may go through now (the gate on its Quad or run, its gun quiet, its guard paid); otherwise it's held and the pilot turns her onto the leg (src/race-plan.ts, Pilot.gustHeld; tested).
